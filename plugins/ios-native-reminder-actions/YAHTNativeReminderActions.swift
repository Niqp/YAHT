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
    static let responseLedgerTtlMs: Int64 = 48 * 60 * 60 * 1000

    static let habitStorageId = "mmkv.default"
    static let habitStorageKey = "habits-storage"
    static let responseLedgerStorageId = "reminder-response-ledger"
    static let responseLedgerKey = "reminder-response-ledger"
    static let scheduleLedgerStorageId = "reminder-schedule-ledger"
    static let scheduleLedgerKey = "reminder-schedule-ledger"
    static let nativeAppliedStorageId = "ios-native-reminder-actions"
    static let nativeAppliedKey = "ios-native-reminder-actions"
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

  @objc static func install() {
    shared.registerCategory()
    let center = UNUserNotificationCenter.current()
    if center.delegate !== shared {
      shared.downstreamDelegate = center.delegate
      center.delegate = shared
    }
  }

  private func registerCategory() {
    let doneAction = UNNotificationAction(
      identifier: Constants.doneActionId,
      title: "Done",
      options: []
    )
    let snoozeAction = UNNotificationAction(
      identifier: Constants.snoozeActionId,
      title: "Snooze",
      options: []
    )
    let openAction = UNNotificationAction(
      identifier: Constants.openActionId,
      title: "Open",
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
    if handleReminderResponse(response) {
      completionHandler()
      return
    }

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
      return false
    }

    let nowMs = currentTimeMs()
    let responseKey = "\(payload.notificationId):\(payload.actionId)"
    guard claimResponse(responseKey, nowMs: nowMs) else {
      return true
    }

    switch payload.actionId {
    case Constants.doneActionId:
      guard applyDone(payload) else {
        return true
      }
      cancelReminderSeries(payload.reminderSeriesId)
      removeScheduleLedgerEntries(for: payload.reminderSeriesId)
      appendNativeAppliedRecord(payload: payload, handledAtMs: nowMs, snoozedUntilMs: nil)
    case Constants.snoozeActionId:
      let snoozedUntilMs = nowMs + Constants.defaultSnoozeMs
      guard applySnooze(payload, snoozedUntilMs: snoozedUntilMs) else {
        return true
      }
      cancelReminderSeries(payload.reminderSeriesId)
      scheduleSnoozedReminder(payload, snoozedUntilMs: snoozedUntilMs)
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

  private func cancelReminderSeries(_ reminderSeriesId: String) {
    let center = UNUserNotificationCenter.current()
    center.getPendingNotificationRequests { requests in
      let identifiers = requests
        .filter { self.notificationMatchesSeries($0.identifier, userInfo: $0.content.userInfo, reminderSeriesId: reminderSeriesId) }
        .map(\.identifier)
      center.removePendingNotificationRequests(withIdentifiers: identifiers)
    }

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
      center.removeDeliveredNotifications(withIdentifiers: identifiers)
    }
  }

  private func notificationMatchesSeries(_ identifier: String, userInfo: [AnyHashable: Any], reminderSeriesId: String) -> Bool {
    if userInfo["reminderSeriesId"] as? String == reminderSeriesId {
      return true
    }

    return identifier.hasPrefix("\(Constants.reminderPrefix)\(reminderSeriesId)-")
  }

  private func scheduleSnoozedReminder(_ payload: ReminderPayload, snoozedUntilMs: Int64) {
    let notificationId = "\(Constants.reminderPrefix)\(payload.reminderSeriesId)-\(snoozedUntilMs)"
    var data: [String: Any] = [
      "kind": Constants.reminderKind,
      "habitId": payload.habitId,
      "habitTitle": payload.habitTitle,
      "reminderDate": payload.reminderDate,
      "reminderSeriesId": payload.reminderSeriesId,
      "scheduledFor": snoozedUntilMs,
      "attemptNumber": 0,
      "maxAttempts": payload.maxAttempts,
    ]
    if let repeatIntervalMs = payload.repeatIntervalMs {
      data["repeatIntervalMs"] = repeatIntervalMs
    }

    let content = UNMutableNotificationContent()
    content.title = "Friendly Reminder"
    content.body = "It's time for: \(payload.habitTitle)"
    content.sound = .default
    content.categoryIdentifier = Constants.categoryId
    content.userInfo = data

    let date = Date(timeIntervalSince1970: TimeInterval(snoozedUntilMs) / 1000)
    let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
    let request = UNNotificationRequest(identifier: notificationId, content: content, trigger: trigger)

    UNUserNotificationCenter.current().add(request)
    upsertScheduleLedgerEntry(payload: payload, notificationId: notificationId, snoozedUntilMs: snoozedUntilMs)
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
      saveJson(entries, storageId: Constants.responseLedgerStorageId, key: Constants.responseLedgerKey)
      return false
    }

    var nextEntries = entries
    nextEntries.append(["responseKey": responseKey, "handledAtMs": nowMs])
    return saveJson(nextEntries, storageId: Constants.responseLedgerStorageId, key: Constants.responseLedgerKey)
  }

  private func responseLedgerEntries() -> [[String: Any]] {
    guard let rawValue = storageString(storageId: Constants.responseLedgerStorageId, key: Constants.responseLedgerKey),
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

    saveJson(ledger, storageId: Constants.scheduleLedgerStorageId, key: Constants.scheduleLedgerKey)
  }

  private func upsertScheduleLedgerEntry(payload: ReminderPayload, notificationId: String, snoozedUntilMs: Int64) {
    var ledger = scheduleLedger() ?? ["version": 1, "generatedAtMs": currentTimeMs(), "normalNotifications": []]
    let existingEntries = ledger["normalNotifications"] as? [[String: Any]] ?? []
    var nextEntries = existingEntries.filter { $0["reminderSeriesId"] as? String != payload.reminderSeriesId }

    var entry: [String: Any] = [
      "notificationId": notificationId,
      "habitId": payload.habitId,
      "habitTitle": payload.habitTitle,
      "timestamp": snoozedUntilMs,
      "reminderDate": payload.reminderDate,
      "reminderSeriesId": payload.reminderSeriesId,
      "attemptNumber": 0,
      "maxAttempts": payload.maxAttempts,
      "scheduledAtMs": currentTimeMs(),
    ]
    if let repeatIntervalMs = payload.repeatIntervalMs {
      entry["repeatIntervalMs"] = repeatIntervalMs
    }
    entry["signature"] = reminderSignature(entry)

    nextEntries.append(entry)
    ledger["normalNotifications"] = nextEntries
    ledger["generatedAtMs"] = currentTimeMs()
    saveJson(ledger, storageId: Constants.scheduleLedgerStorageId, key: Constants.scheduleLedgerKey)
  }

  private func scheduleLedger() -> [String: Any]? {
    guard let rawValue = storageString(storageId: Constants.scheduleLedgerStorageId, key: Constants.scheduleLedgerKey) else {
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
    saveJson(records, storageId: Constants.nativeAppliedStorageId, key: Constants.nativeAppliedKey)
  }

  private func nativeAppliedRecords() -> [[String: Any]] {
    guard let rawValue = storageString(storageId: Constants.nativeAppliedStorageId, key: Constants.nativeAppliedKey),
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
