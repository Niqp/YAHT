import Foundation
import UIKit
import UserNotifications

@objc(YAHTNativeReminderActions)
final class YAHTNativeReminderActions: NSObject, UNUserNotificationCenterDelegate {
  private static let shared = YAHTNativeReminderActions()

  private weak var downstreamDelegate: UNUserNotificationCenterDelegate?

  private enum Constants {
    static let categoryId = "habitReminderActions"
    static let doneActionId = "habitReminderDone"
    static let snoozeActionId = "habitReminderSnooze"
    static let openActionId = "habitReminderOpen"
    static let reminderKind = "habitReminder"
    static let reminderPrefix = "reminder-"
    static let defaultSnoozeMs: Int64 = 15 * 60 * 1000
    static let maxFollowUpRemindersPerSchedule = 3
    static let responseLedgerTtlMs: Int64 = 48 * 60 * 60 * 1000

    static let habitStorageId = "yaht-persistence"
    static let runtimeStorageId = "yaht-runtime"
    static let habitStorageKey = "habits-storage"
    static let responseLedgerKey = "reminder-response-ledger"
    static let scheduleLedgerKey = "reminder-schedule-ledger"
    static let nativeAppliedKey = "ios-native-reminder-actions"
    static let diagnosticEventsKey = "diagnostic-events"
    static let diagnosticMaxRecords = 1000
    static let diagnosticMaxSerializedBytes = 1024 * 1024
    static let diagnosticRetentionMs: Int64 = 7 * 24 * 60 * 60 * 1000
  }

  private struct ReminderPayload {
    let notificationId: String
    let actionId: String
    let habitId: String
    let habitTitle: String
    let reminderDate: String
    let reminderSeriesId: String
    let scheduledFor: Int64
    let maxAttempts: Int
    let repeatIntervalMs: Int64?
  }

  private struct ReminderJob {
    let notificationId: String
    let habitId: String
    let habitTitle: String
    let timestamp: Int64
    let reminderDate: String
    let reminderSeriesId: String
    let attemptNumber: Int
    let maxAttempts: Int
    let repeatIntervalMs: Int64?
  }

  private struct NextIntervalReminder {
    let reminderDate: String
    let timestamp: Int64
  }

  @objc static func install() {
    shared.registerCategory()
    shared.appendDiagnosticEvent("ios.reminder.categoryInstalled", context: ["category": Constants.categoryId])
    let center = UNUserNotificationCenter.current()
    if center.delegate !== shared {
      shared.downstreamDelegate = center.delegate
      center.delegate = shared
      shared.appendDiagnosticEvent("ios.reminder.delegateInstalled")
    }
  }

  private func registerCategory() {
    let doneAction = UNNotificationAction(
      identifier: Constants.doneActionId,
      title: localizedString("notification_action_done"),
      options: []
    )
    let snoozeAction = UNNotificationAction(
      identifier: Constants.snoozeActionId,
      title: localizedString("notification_action_snooze"),
      options: []
    )
    let openAction = UNNotificationAction(
      identifier: Constants.openActionId,
      title: localizedString("notification_action_open"),
      options: [.foreground]
    )
    let category = UNNotificationCategory(
      identifier: Constants.categoryId,
      actions: [doneAction, snoozeAction, openAction],
      intentIdentifiers: [],
      options: []
    )

    UNUserNotificationCenter.current().setNotificationCategories([category])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    appendDiagnosticEvent("ios.reminder.responseReceived", context: ["actionId": response.actionIdentifier])
    if handleReminderResponse(response) {
      completionHandler()
      return
    }
    appendDiagnosticEvent("ios.reminder.delegateHandoff", context: ["actionId": response.actionIdentifier])

    if let downstreamDelegate,
      downstreamDelegate.responds(
        to: #selector(
          UNUserNotificationCenterDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:)
        )
      )
    {
      downstreamDelegate.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
      return
    }

    completionHandler()
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if let downstreamDelegate,
      downstreamDelegate.responds(
        to: #selector(
          UNUserNotificationCenterDelegate.userNotificationCenter(_:willPresent:withCompletionHandler:)
        )
      )
    {
      downstreamDelegate.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
      return
    }

    completionHandler([])
  }

  private func handleReminderResponse(_ response: UNNotificationResponse) -> Bool {
    guard response.actionIdentifier == Constants.doneActionId || response.actionIdentifier == Constants.snoozeActionId,
      let payload = parsePayload(response)
    else {
      appendDiagnosticEvent("ios.reminder.payloadParseFailed", context: ["actionId": response.actionIdentifier])
      return false
    }
    appendDiagnosticEvent("ios.reminder.payloadParsed", payload: payload)

    let nowMs = currentTimeMs()
    let responseKey = "\(payload.notificationId):\(payload.actionId)"
    guard claimResponse(responseKey, nowMs: nowMs) else {
      appendDiagnosticEvent("ios.reminder.responseDuplicate", payload: payload, context: ["responseKey": responseKey])
      return true
    }
    appendDiagnosticEvent("ios.reminder.responseClaimed", payload: payload, context: ["responseKey": responseKey])

    switch payload.actionId {
    case Constants.doneActionId:
      guard let habitSnapshot = readHabit(payload.habitId) else {
        releaseResponseClaim(responseKey)
        appendDiagnosticEvent("ios.reminder.responseReleased", payload: payload, context: ["responseKey": responseKey])
        appendDiagnosticEvent("ios.reminder.doneHabitMissing", payload: payload, context: ["responseKey": responseKey])
        return false
      }
      guard applyDone(payload) else {
        releaseResponseClaim(responseKey)
        appendDiagnosticEvent("ios.reminder.responseReleased", payload: payload, context: ["responseKey": responseKey])
        appendDiagnosticEvent("ios.reminder.doneMutationResult", payload: payload, context: ["didMutate": false])
        return false
      }
      appendDiagnosticEvent("ios.reminder.doneMutationResult", payload: payload, context: ["didMutate": true])
      removeScheduleLedgerEntries(for: payload.reminderSeriesId)
      cancelReminderSeries(payload.reminderSeriesId, payload: payload) {
        self.scheduleNextIntervalSeriesIfNeeded(habitSnapshot: habitSnapshot, payload: payload, nowMs: nowMs)
      }
      appendNativeAppliedRecord(payload: payload, handledAtMs: nowMs, snoozedUntilMs: nil)
    case Constants.snoozeActionId:
      let snoozedUntilMs = nowMs + Constants.defaultSnoozeMs
      guard applySnooze(payload, snoozedUntilMs: snoozedUntilMs) else {
        releaseResponseClaim(responseKey)
        appendDiagnosticEvent("ios.reminder.responseReleased", payload: payload, context: ["responseKey": responseKey])
        appendDiagnosticEvent("ios.reminder.snoozeMutationResult", payload: payload, context: ["didMutate": false])
        return false
      }
      appendDiagnosticEvent("ios.reminder.snoozeMutationResult", payload: payload, context: ["didMutate": true, "snoozedUntilMs": snoozedUntilMs])
      let jobs = buildReminderSeriesJobs(
        habitId: payload.habitId,
        habitTitle: payload.habitTitle,
        reminderDate: payload.reminderDate,
        reminderSeriesId: payload.reminderSeriesId,
        firstReminderTimestamp: snoozedUntilMs,
        maxAttempts: payload.maxAttempts,
        repeatIntervalMs: payload.repeatIntervalMs
      )
      cancelReminderSeries(payload.reminderSeriesId, payload: payload) {
        self.scheduleReminderSeries(payload.reminderSeriesId, jobs: jobs)
      }
      appendNativeAppliedRecord(payload: payload, handledAtMs: nowMs, snoozedUntilMs: snoozedUntilMs)
    default:
      break
    }

    return true
  }

  private func parsePayload(_ response: UNNotificationResponse) -> ReminderPayload? {
    let request = response.notification.request
    let data = request.content.userInfo
    guard data["kind"] as? String == Constants.reminderKind,
      let habitId = data["habitId"] as? String,
      let habitTitle = data["habitTitle"] as? String,
      let reminderDate = data["reminderDate"] as? String,
      let reminderSeriesId = data["reminderSeriesId"] as? String
    else {
      return nil
    }

    return ReminderPayload(
      notificationId: request.identifier,
      actionId: response.actionIdentifier,
      habitId: habitId,
      habitTitle: habitTitle,
      reminderDate: reminderDate,
      reminderSeriesId: reminderSeriesId,
      scheduledFor: int64Value(data["scheduledFor"]) ?? currentTimeMs(),
      maxAttempts: Int(int64Value(data["maxAttempts"]) ?? 1),
      repeatIntervalMs: int64Value(data["repeatIntervalMs"])
    )
  }

  private func readHabit(_ habitId: String) -> [String: Any]? {
    guard let rawValue = storageString(storageId: Constants.habitStorageId, key: Constants.habitStorageKey),
      let root = jsonObject(rawValue) as? [String: Any],
      let state = root["state"] as? [String: Any],
      let habits = state["habits"] as? [String: Any],
      let habit = habits[habitId] as? [String: Any]
    else {
      return nil
    }

    return habit
  }

  private func applyDone(_ payload: ReminderPayload) -> Bool {
    mutateHabitStorage(for: payload) { habit in
      guard var completion = habit["completion"] as? [String: Any] else {
        return false
      }

      let completionType = completion["type"] as? String
      var reminder = habit["reminder"] as? [String: Any]
      if reminder?["snoozedDate"] as? String == payload.reminderDate || reminder?["snoozedUntilMs"] != nil {
        reminder?.removeValue(forKey: "snoozedDate")
        reminder?.removeValue(forKey: "snoozedUntilMs")
        habit["reminder"] = reminder
      }

      var history = habit["completionHistory"] as? [String: Any] ?? [:]
      let value: Any
      if completionType == "simple" {
        value = 0
      } else if let goal = completion["goal"] {
        value = goal
      } else {
        return false
      }

      completion["type"] = completionType
      habit["completion"] = completion
      history[payload.reminderDate] = ["isCompleted": true, "value": value]
      habit["completionHistory"] = history
      return true
    }
  }

  private func applySnooze(_ payload: ReminderPayload, snoozedUntilMs: Int64) -> Bool {
    mutateHabitStorage(for: payload) { habit in
      guard var reminder = habit["reminder"] as? [String: Any] else {
        return false
      }

      reminder["snoozedDate"] = payload.reminderDate
      reminder["snoozedUntilMs"] = snoozedUntilMs
      habit["reminder"] = reminder
      return true
    }
  }

  private func mutateHabitStorage(_ mutate: (inout [String: Any]) -> Bool) -> Bool {
    guard let rawValue = storageString(storageId: Constants.habitStorageId, key: Constants.habitStorageKey),
      var root = jsonObject(rawValue) as? [String: Any],
      var state = root["state"] as? [String: Any],
      var habits = state["habits"] as? [String: Any],
      let payload = currentPayloadContext,
      var habit = habits[payload.habitId] as? [String: Any]
    else {
      return false
    }

    guard mutate(&habit) else {
      return false
    }

    habits[payload.habitId] = habit
    state["habits"] = habits
    root["state"] = state
    return saveJson(root, storageId: Constants.habitStorageId, key: Constants.habitStorageKey)
  }

  private var currentPayloadContext: ReminderPayload?

  private func mutateHabitStorage(for payload: ReminderPayload, _ mutate: (inout [String: Any]) -> Bool) -> Bool {
    currentPayloadContext = payload
    defer { currentPayloadContext = nil }
    return mutateHabitStorage(mutate)
  }

  private func cancelReminderSeries(_ reminderSeriesId: String, payload: ReminderPayload, completion: @escaping () -> Void) {
    let center = UNUserNotificationCenter.current()
    let group = DispatchGroup()
    var scheduledCount = 0
    var dismissedCount = 0

    group.enter()
    center.getPendingNotificationRequests { requests in
      let identifiers = requests
        .filter { self.notificationMatchesSeries($0.identifier, userInfo: $0.content.userInfo, reminderSeriesId: reminderSeriesId) }
        .map(\.identifier)
      scheduledCount = identifiers.count
      center.removePendingNotificationRequests(withIdentifiers: identifiers)
      group.leave()
    }

    group.enter()
    center.getDeliveredNotifications { notifications in
      let identifiers = notifications
        .filter {
          self.notificationMatchesSeries(
            $0.request.identifier,
            userInfo: $0.request.content.userInfo,
            reminderSeriesId: reminderSeriesId
          )
        }
        .map { $0.request.identifier }
      dismissedCount = identifiers.count
      center.removeDeliveredNotifications(withIdentifiers: identifiers)
      group.leave()
    }

    group.notify(queue: .main) {
      self.appendDiagnosticEvent(
        "ios.reminder.seriesCancelDismissResult",
        payload: payload,
        context: ["scheduledCount": scheduledCount, "dismissedCount": dismissedCount]
      )
      completion()
    }
  }

  private func notificationMatchesSeries(_ identifier: String, userInfo: [AnyHashable: Any], reminderSeriesId: String) -> Bool {
    if userInfo["reminderSeriesId"] as? String == reminderSeriesId {
      return true
    }

    return identifier.hasPrefix("\(Constants.reminderPrefix)\(reminderSeriesId)-")
  }

  private func scheduleNextIntervalSeriesIfNeeded(habitSnapshot: [String: Any], payload: ReminderPayload, nowMs: Int64) {
    guard let repetition = habitSnapshot["repetition"] as? [String: Any],
      repetition["type"] as? String == "interval",
      let reminder = habitSnapshot["reminder"] as? [String: Any],
      reminder["enabled"] as? Bool == true,
      let intervalDays = int64Value(repetition["days"]),
      intervalDays > 0
    else {
      return
    }

    let next = nextIntervalReminder(
      reminderDate: payload.reminderDate,
      intervalDays: Int(intervalDays),
      reminderHour: Int(int64Value(reminder["hour"]) ?? 0),
      reminderMinute: Int(int64Value(reminder["minute"]) ?? 0),
      nowMs: nowMs
    )
    let repeatIfNotCompleted = reminder["repeatIfNotCompleted"] as? Bool == true
    let normalizedRepeatIntervalMs = repeatIfNotCompleted ? int64Value(reminder["repeatIntervalMs"]) : nil
    let nextSeriesId = "series-\(payload.habitId)-\(next.reminderDate)"
    let jobs = buildReminderSeriesJobs(
      habitId: payload.habitId,
      habitTitle: habitSnapshot["title"] as? String ?? payload.habitTitle,
      reminderDate: next.reminderDate,
      reminderSeriesId: nextSeriesId,
      firstReminderTimestamp: next.timestamp,
      maxAttempts: normalizedRepeatIntervalMs != nil ? Constants.maxFollowUpRemindersPerSchedule + 1 : 1,
      repeatIntervalMs: normalizedRepeatIntervalMs
    )

    scheduleReminderSeries(nextSeriesId, jobs: jobs)
  }

  private func nextIntervalReminder(
    reminderDate: String,
    intervalDays: Int,
    reminderHour: Int,
    reminderMinute: Int,
    nowMs: Int64
  ) -> NextIntervalReminder {
    let parts = reminderDate.split(separator: "-").compactMap { Int($0) }
    var components = DateComponents()
    components.year = parts.count > 0 ? parts[0] : nil
    components.month = parts.count > 1 ? parts[1] : nil
    components.day = parts.count > 2 ? parts[2] : nil
    components.hour = reminderHour
    components.minute = reminderMinute
    components.second = 0
    components.nanosecond = 0

    let calendar = Calendar.current
    var nextDate = calendar.date(from: components) ?? Date(timeIntervalSince1970: TimeInterval(nowMs) / 1000)
    nextDate = calendar.date(byAdding: .day, value: intervalDays, to: nextDate) ?? nextDate
    while Int64(nextDate.timeIntervalSince1970 * 1000) <= nowMs {
      nextDate = calendar.date(byAdding: .day, value: intervalDays, to: nextDate) ?? nextDate
    }

    let nextComponents = calendar.dateComponents([.year, .month, .day], from: nextDate)
    let nextReminderDate = String(
      format: "%04d-%02d-%02d",
      nextComponents.year ?? 0,
      nextComponents.month ?? 1,
      nextComponents.day ?? 1
    )
    return NextIntervalReminder(reminderDate: nextReminderDate, timestamp: Int64(nextDate.timeIntervalSince1970 * 1000))
  }

  private func buildReminderSeriesJobs(
    habitId: String,
    habitTitle: String,
    reminderDate: String,
    reminderSeriesId: String,
    firstReminderTimestamp: Int64,
    maxAttempts: Int,
    repeatIntervalMs: Int64?
  ) -> [ReminderJob] {
    let normalizedMaxAttempts = max(1, maxAttempts)
    let normalizedRepeatIntervalMs = repeatIntervalMs.flatMap { $0 > 0 ? $0 : nil }
    var jobs: [ReminderJob] = []

    for attemptNumber in 0..<normalizedMaxAttempts {
      if attemptNumber > 0 && normalizedRepeatIntervalMs == nil {
        continue
      }

      let timestamp = firstReminderTimestamp + (normalizedRepeatIntervalMs ?? 0) * Int64(attemptNumber)
      jobs.append(
        ReminderJob(
          notificationId: "\(Constants.reminderPrefix)\(reminderSeriesId)-\(timestamp)",
          habitId: habitId,
          habitTitle: habitTitle,
          timestamp: timestamp,
          reminderDate: reminderDate,
          reminderSeriesId: reminderSeriesId,
          attemptNumber: attemptNumber,
          maxAttempts: normalizedMaxAttempts,
          repeatIntervalMs: normalizedRepeatIntervalMs
        )
      )
    }

    return jobs
  }

  private func scheduleReminderSeries(_ reminderSeriesId: String, jobs: [ReminderJob]) {
    let center = UNUserNotificationCenter.current()
    for job in jobs {
      let request = UNNotificationRequest(
        identifier: job.notificationId,
        content: notificationContent(job),
        trigger: calendarTrigger(timestamp: job.timestamp)
      )
      center.add(request)
    }

    if !jobs.isEmpty {
      replaceScheduleLedgerEntries(for: reminderSeriesId, jobs: jobs)
    }
    appendDiagnosticEvent("ios.reminder.seriesScheduled", context: ["reminderSeriesId": reminderSeriesId, "count": jobs.count])
  }

  private func notificationContent(_ job: ReminderJob) -> UNMutableNotificationContent {
    var data: [String: Any] = [
      "kind": Constants.reminderKind,
      "habitId": job.habitId,
      "habitTitle": job.habitTitle,
      "reminderDate": job.reminderDate,
      "reminderSeriesId": job.reminderSeriesId,
      "scheduledFor": job.timestamp,
      "attemptNumber": job.attemptNumber,
      "maxAttempts": job.maxAttempts,
    ]
    if let repeatIntervalMs = job.repeatIntervalMs {
      data["repeatIntervalMs"] = repeatIntervalMs
    }

    let content = UNMutableNotificationContent()
    if job.attemptNumber > 0 {
      content.title = localizedString("notification_follow_up_title")
      content.body = String(format: localizedString("notification_follow_up_body"), job.habitTitle)
    } else {
      content.title = localizedString("notification_reminder_title")
      content.body = String(format: localizedString("notification_reminder_body"), job.habitTitle)
    }
    content.sound = .default
    content.categoryIdentifier = Constants.categoryId
    content.userInfo = data
    return content
  }

  private func calendarTrigger(timestamp: Int64) -> UNCalendarNotificationTrigger {
    let date = Date(timeIntervalSince1970: TimeInterval(timestamp) / 1000)
    let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    return UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
  }

  private func localizedString(_ key: String) -> String {
    NSLocalizedString(key, tableName: "YAHTNativeReminderActions", bundle: .main, value: key, comment: "")
  }

  private func appendDiagnosticEvent(_ event: String, payload: ReminderPayload? = nil, context: [String: Any] = [:]) {
    var diagnosticContext = context
    if let payload {
      diagnosticContext["actionId"] = payload.actionId
      diagnosticContext["notificationId"] = payload.notificationId
      diagnosticContext["habitId"] = payload.habitId
      diagnosticContext["reminderDate"] = payload.reminderDate
      diagnosticContext["reminderSeriesId"] = payload.reminderSeriesId
      diagnosticContext["scheduledFor"] = payload.scheduledFor
      diagnosticContext["maxAttempts"] = payload.maxAttempts
      if let repeatIntervalMs = payload.repeatIntervalMs {
        diagnosticContext["repeatIntervalMs"] = repeatIntervalMs
      }
    }

    let nowMs = currentTimeMs()
    var records = diagnosticEventRecords()
    records.append([
      "timestamp": nowMs,
      "level": "info",
      "event": event,
      "source": "ios-native",
      "context": diagnosticContext,
    ])
    saveJson(
      boundedDiagnosticRecords(records, nowMs: nowMs),
      storageId: Constants.runtimeStorageId,
      key: Constants.diagnosticEventsKey
    )
  }

  private func diagnosticEventRecords() -> [[String: Any]] {
    guard let rawValue = storageString(storageId: Constants.runtimeStorageId, key: Constants.diagnosticEventsKey),
      let records = jsonObject(rawValue) as? [[String: Any]]
    else {
      return []
    }

    return records
  }

  private func boundedDiagnosticRecords(_ records: [[String: Any]], nowMs: Int64) -> [[String: Any]] {
    let cutoffMs = nowMs - Constants.diagnosticRetentionMs
    var nextRecords = records.filter { entry in
      guard let timestamp = int64Value(entry["timestamp"]) else {
        return false
      }
      return timestamp >= cutoffMs
    }

    if nextRecords.count > Constants.diagnosticMaxRecords {
      nextRecords = Array(nextRecords.suffix(Constants.diagnosticMaxRecords))
    }

    while let json = jsonString(nextRecords),
      json.utf8.count > Constants.diagnosticMaxSerializedBytes,
      !nextRecords.isEmpty
    {
      nextRecords.removeFirst()
    }

    return nextRecords
  }

  private func claimResponse(_ responseKey: String, nowMs: Int64) -> Bool {
    let cutoffMs = nowMs - Constants.responseLedgerTtlMs
    let entries = responseLedgerEntries().filter { entry in
      guard let handledAtMs = int64Value(entry["handledAtMs"]) else {
        return false
      }
      return handledAtMs >= cutoffMs
    }

    if entries.contains(where: { $0["responseKey"] as? String == responseKey }) {
      saveJson(entries, storageId: Constants.runtimeStorageId, key: Constants.responseLedgerKey)
      return false
    }

    var nextEntries = entries
    nextEntries.append(["responseKey": responseKey, "handledAtMs": nowMs])
    return saveJson(nextEntries, storageId: Constants.runtimeStorageId, key: Constants.responseLedgerKey)
  }

  private func releaseResponseClaim(_ responseKey: String) {
    let entries = responseLedgerEntries().filter { entry in
      entry["responseKey"] as? String != responseKey
    }
    saveJson(entries, storageId: Constants.runtimeStorageId, key: Constants.responseLedgerKey)
  }

  private func responseLedgerEntries() -> [[String: Any]] {
    guard let rawValue = storageString(storageId: Constants.runtimeStorageId, key: Constants.responseLedgerKey),
      let entries = jsonObject(rawValue) as? [[String: Any]]
    else {
      return []
    }

    return entries
  }

  private func removeScheduleLedgerEntries(for reminderSeriesId: String) {
    guard var ledger = scheduleLedger() else {
      return
    }

    let notificationPrefix = "\(Constants.reminderPrefix)\(reminderSeriesId)-"
    let entries = ledger["normalNotifications"] as? [[String: Any]] ?? []
    ledger["normalNotifications"] = entries.filter { entry in
      if entry["reminderSeriesId"] as? String == reminderSeriesId {
        return false
      }
      if let notificationId = entry["notificationId"] as? String, notificationId.hasPrefix(notificationPrefix) {
        return false
      }
      return true
    }

    saveJson(ledger, storageId: Constants.runtimeStorageId, key: Constants.scheduleLedgerKey)
  }

  private func replaceScheduleLedgerEntries(for reminderSeriesId: String, jobs: [ReminderJob]) {
    var ledger = scheduleLedger() ?? ["version": 1, "generatedAtMs": currentTimeMs(), "normalNotifications": []]
    let existingEntries = ledger["normalNotifications"] as? [[String: Any]] ?? []
    var nextEntries = existingEntries.filter { $0["reminderSeriesId"] as? String != reminderSeriesId }
    let scheduledAtMs = currentTimeMs()

    for job in jobs {
      var entry: [String: Any] = [
        "notificationId": job.notificationId,
        "habitId": job.habitId,
        "habitTitle": job.habitTitle,
        "timestamp": job.timestamp,
        "reminderDate": job.reminderDate,
        "reminderSeriesId": job.reminderSeriesId,
        "attemptNumber": job.attemptNumber,
        "maxAttempts": job.maxAttempts,
        "scheduledAtMs": scheduledAtMs,
      ]
      if let repeatIntervalMs = job.repeatIntervalMs {
        entry["repeatIntervalMs"] = repeatIntervalMs
      }
      entry["signature"] = reminderSignature(entry)
      nextEntries.append(entry)
    }

    ledger["version"] = 1
    ledger["normalNotifications"] = nextEntries
    ledger["generatedAtMs"] = scheduledAtMs
    saveJson(ledger, storageId: Constants.runtimeStorageId, key: Constants.scheduleLedgerKey)
  }

  private func scheduleLedger() -> [String: Any]? {
    guard let rawValue = storageString(storageId: Constants.runtimeStorageId, key: Constants.scheduleLedgerKey) else {
      return nil
    }

    return jsonObject(rawValue) as? [String: Any]
  }

  private func reminderSignature(_ entry: [String: Any]) -> String {
    var signature: [String: Any] = [
      "version": 1,
      "platform": "ios",
      "type": "normal",
      "habitId": entry["habitId"] as? String ?? "",
      "habitTitle": entry["habitTitle"] as? String ?? "",
      "timestamp": int64Value(entry["timestamp"]) ?? 0,
      "reminderDate": entry["reminderDate"] as? String ?? "",
      "reminderSeriesId": entry["reminderSeriesId"] as? String ?? "",
      "attemptNumber": int64Value(entry["attemptNumber"]) ?? 0,
      "maxAttempts": int64Value(entry["maxAttempts"]) ?? 1,
    ]
    if let repeatIntervalMs = entry["repeatIntervalMs"] {
      signature["repeatIntervalMs"] = repeatIntervalMs
    }
    return jsonString(signature) ?? "{}"
  }

  private func appendNativeAppliedRecord(payload: ReminderPayload, handledAtMs: Int64, snoozedUntilMs: Int64?) {
    var records = nativeAppliedRecords()
    var record: [String: Any] = [
      "responseKey": "\(payload.notificationId):\(payload.actionId)",
      "actionIdentifier": payload.actionId,
      "habitId": payload.habitId,
      "reminderDate": payload.reminderDate,
      "handledAtMs": handledAtMs,
    ]
    if let snoozedUntilMs {
      record["snoozedUntilMs"] = snoozedUntilMs
    }

    records.append(record)
    let didSave = saveJson(records, storageId: Constants.runtimeStorageId, key: Constants.nativeAppliedKey)
    var diagnosticContext: [String: Any] = ["didMutate": didSave]
    if let snoozedUntilMs {
      diagnosticContext["snoozedUntilMs"] = snoozedUntilMs
    }
    appendDiagnosticEvent("ios.reminder.nativeAppliedRecordWrite", payload: payload, context: diagnosticContext)
  }

  private func nativeAppliedRecords() -> [[String: Any]] {
    guard let rawValue = storageString(storageId: Constants.runtimeStorageId, key: Constants.nativeAppliedKey),
      let records = jsonObject(rawValue) as? [[String: Any]]
    else {
      return []
    }

    return records
  }

  private func storageString(storageId: String, key: String) -> String? {
    YAHTNativeReminderStorage.string(forStorageId: storageId, key: key)
  }

  @discardableResult
  private func saveJson(_ value: Any, storageId: String, key: String) -> Bool {
    guard let json = jsonString(value) else {
      return false
    }

    return YAHTNativeReminderStorage.setString(json, storageId: storageId, key: key)
  }

  private func jsonObject(_ value: String) -> Any? {
    guard let data = value.data(using: .utf8) else {
      return nil
    }

    return try? JSONSerialization.jsonObject(with: data)
  }

  private func jsonString(_ value: Any) -> String? {
    guard JSONSerialization.isValidJSONObject(value),
      let data = try? JSONSerialization.data(withJSONObject: value, options: [])
    else {
      return nil
    }

    return String(data: data, encoding: .utf8)
  }

  private func currentTimeMs() -> Int64 {
    Int64(Date().timeIntervalSince1970 * 1000)
  }

  private func int64Value(_ value: Any?) -> Int64? {
    if let value = value as? Int64 {
      return value
    }
    if let value = value as? Int {
      return Int64(value)
    }
    if let value = value as? Double {
      return Int64(value)
    }
    if let value = value as? String {
      return Int64(value)
    }
    if let value = value as? NSNumber {
      return value.int64Value
    }
    return nil
  }
}
