package dev.niqp.yaht.notifications

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Parcel
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder
import expo.modules.notifications.notifications.triggers.DateTrigger
import expo.modules.notifications.service.NotificationsService
import com.tencent.mmkv.MMKV
import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class YAHTNativeReminderActionsService : NotificationsService() {
  private data class ReminderPayload(
    val notificationId: String,
    val actionId: String,
    val habitId: String,
    val habitTitle: String,
    val reminderDate: String,
    val reminderSeriesId: String,
    val scheduledFor: Long,
    val attemptNumber: Int,
    val maxAttempts: Int,
    val repeatIntervalMs: Long?
  )

  private data class ReminderJob(
    val notificationId: String,
    val habitId: String,
    val habitTitle: String,
    val timestamp: Long,
    val reminderDate: String,
    val reminderSeriesId: String,
    val attemptNumber: Int,
    val maxAttempts: Int,
    val repeatIntervalMs: Long?
  )

  override fun onReceiveNotificationResponse(context: Context, intent: Intent) {
    val response = try {
      getNotificationResponseFromBroadcastIntent(intent)
    } catch (error: Exception) {
      Log.d(LOG_TAG, "Could not parse notification response intent; delegating to Expo.", error)
      appendDebugRecord(context, "intent-parse-failed", detail = error.message)
      super.onReceiveNotificationResponse(context, intent)
      return
    }

    if (!handleReminderResponse(context.applicationContext, response)) {
      Log.d(LOG_TAG, "Native reminder response was not handled; delegating to Expo.")
      appendDebugRecord(context, "delegating-to-expo")
      super.onReceiveNotificationResponse(context, intent)
    }
  }

  private fun handleReminderResponse(context: Context, response: NotificationResponse): Boolean {
    val actionId = response.actionIdentifier
    if (actionId != DONE_ACTION_ID && actionId != SNOOZE_ACTION_ID) {
      Log.d(LOG_TAG, "Ignoring non-reminder action: $actionId")
      appendDebugRecord(context, "ignored-action", actionId = actionId)
      return false
    }

    val payload = parsePayload(response) ?: run {
      Log.d(LOG_TAG, "Could not parse reminder payload for action: $actionId")
      appendDebugRecord(context, "payload-parse-failed", actionId = actionId)
      return false
    }
    Log.d(
      LOG_TAG,
      "Parsed reminder payload action=${payload.actionId} notification=${payload.notificationId} habit=${payload.habitId} date=${payload.reminderDate} series=${payload.reminderSeriesId}"
    )
    appendDebugRecord(context, "payload-parsed", payload)

    val nowMs = currentTimeMs()
    val responseKey = "${payload.notificationId}:${payload.actionId}"

    synchronized(NATIVE_RESPONSE_LOCK) {
      if (!claimResponse(context, responseKey, nowMs)) {
        Log.d(LOG_TAG, "Response already claimed: $responseKey")
        appendDebugRecord(
          context,
          "response-already-claimed",
          payload,
          detail = responseKey,
          diagnosticContext = JSONObject().put("responseKey", responseKey)
        )
        return true
      }
      Log.d(LOG_TAG, "Response claimed: $responseKey")
      appendDebugRecord(
        context,
        "response-claimed",
        payload,
        detail = responseKey,
        diagnosticContext = JSONObject().put("responseKey", responseKey)
      )

      val handled = try {
        when (payload.actionId) {
          DONE_ACTION_ID -> {
            val habitSnapshot = readHabit(context, payload.habitId)
            if (habitSnapshot == null) {
              Log.d(LOG_TAG, "Done action failed: habit not found in MMKV for ${payload.habitId}")
              appendDebugRecord(context, "done-habit-missing", payload)
              return falseAfterReleasingClaim(context, responseKey)
            }

            val didApplyDone = applyDone(context, payload)
            Log.d(LOG_TAG, "Done action mutation result for ${payload.habitId}: $didApplyDone")
            appendDebugRecord(
              context,
              "done-mutation-result",
              payload,
              detail = didApplyDone.toString(),
              diagnosticContext = JSONObject().put("didMutate", didApplyDone)
            )
            if (!didApplyDone) {
              return falseAfterReleasingClaim(context, responseKey)
            }
            appendAppliedActionRecord(context, payload, responseKey)

            cancelReminderSeries(context, payload.reminderSeriesId, payload)
            removeScheduleLedgerEntries(context, payload.reminderSeriesId)
            scheduleNextIntervalSeriesIfNeeded(context, habitSnapshot, payload, nowMs)
            true
          }

          SNOOZE_ACTION_ID -> {
            val snoozedUntilMs = nowMs + DEFAULT_SNOOZE_MS
            val didApplySnooze = applySnooze(context, payload, snoozedUntilMs)
            Log.d(LOG_TAG, "Snooze action mutation result for ${payload.habitId}: $didApplySnooze")
            appendDebugRecord(
              context,
              "snooze-mutation-result",
              payload,
              detail = didApplySnooze.toString(),
              diagnosticContext = JSONObject().put("didMutate", didApplySnooze)
            )
            if (!didApplySnooze) {
              return falseAfterReleasingClaim(context, responseKey)
            }
            appendAppliedActionRecord(context, payload, responseKey, snoozedUntilMs)

            cancelReminderSeries(context, payload.reminderSeriesId, payload)
            val jobs = buildReminderSeriesJobs(
              habitId = payload.habitId,
              habitTitle = payload.habitTitle,
              reminderDate = payload.reminderDate,
              reminderSeriesId = payload.reminderSeriesId,
              firstReminderTimestamp = snoozedUntilMs,
              maxAttempts = payload.maxAttempts,
              repeatIntervalMs = payload.repeatIntervalMs
            )
            scheduleReminderSeries(context, payload.reminderSeriesId, jobs)
            true
          }

          else -> false
        }
      } catch (error: Exception) {
        Log.e(LOG_TAG, "Native reminder response failed; delegating to Expo.", error)
        appendDebugRecord(context, "native-exception", payload, detail = error.message)
        false
      }

      if (!handled) {
        Log.d(LOG_TAG, "Native handler did not complete; releasing response claim: $responseKey")
        appendDebugRecord(
          context,
          "native-not-handled",
          payload,
          detail = responseKey,
          diagnosticContext = JSONObject().put("responseKey", responseKey).put("handled", false)
        )
        releaseResponseClaim(context, responseKey)
      }
      Log.d(LOG_TAG, "Native reminder response handled=$handled action=${payload.actionId} notification=${payload.notificationId}")
      appendDebugRecord(
        context,
        "native-handler-result",
        payload,
        detail = handled.toString(),
        diagnosticContext = JSONObject().put("handled", handled)
      )
      return handled
    }
  }

  private fun falseAfterReleasingClaim(context: Context, responseKey: String): Boolean {
    releaseResponseClaim(context, responseKey)
    appendDebugRecord(
      context,
      "response-released",
      detail = responseKey,
      diagnosticContext = JSONObject().put("responseKey", responseKey)
    )
    return false
  }

  private fun parsePayload(response: NotificationResponse): ReminderPayload? {
    val request = response.notification.notificationRequest
    val body = request.content.body ?: return null
    if (body.optString("kind") != REMINDER_KIND) {
      return null
    }

    val habitId = body.optString("habitId").takeIf { it.isNotBlank() } ?: return null
    val habitTitle = body.optString("habitTitle").takeIf { it.isNotBlank() } ?: return null
    val reminderDate = body.optString("reminderDate").takeIf { it.isNotBlank() } ?: return null
    val reminderSeriesId = body.optString("reminderSeriesId").takeIf { it.isNotBlank() } ?: return null

    return ReminderPayload(
      notificationId = request.identifier,
      actionId = response.actionIdentifier,
      habitId = habitId,
      habitTitle = habitTitle,
      reminderDate = reminderDate,
      reminderSeriesId = reminderSeriesId,
      scheduledFor = body.optLong("scheduledFor", currentTimeMs()),
      attemptNumber = body.optInt("attemptNumber", 0),
      maxAttempts = body.optInt("maxAttempts", 1),
      repeatIntervalMs = body.optionalLong("repeatIntervalMs")
    )
  }

  private fun applyDone(context: Context, payload: ReminderPayload): Boolean =
    mutateHabit(context, payload.habitId) { habit ->
      val completion = habit.optJSONObject("completion") ?: return@mutateHabit false
      val completionType = completion.optString("type")
      val value = when (completionType) {
        "simple" -> 0
        else -> if (completion.has("goal")) completion.get("goal") else return@mutateHabit false
      }

      val reminder = habit.optJSONObject("reminder")
      if (reminder != null &&
        (reminder.optString("snoozedDate") == payload.reminderDate || reminder.has("snoozedUntilMs"))
      ) {
        reminder.remove("snoozedDate")
        reminder.remove("snoozedUntilMs")
        habit.put("reminder", reminder)
      }

      val history = habit.optJSONObject("completionHistory") ?: JSONObject()
      history.put(payload.reminderDate, JSONObject().put("isCompleted", true).put("value", value))
      habit.put("completionHistory", history)
      true
    }

  private fun applySnooze(context: Context, payload: ReminderPayload, snoozedUntilMs: Long): Boolean =
    mutateHabit(context, payload.habitId) { habit ->
      val reminder = habit.optJSONObject("reminder") ?: return@mutateHabit false
      reminder.put("snoozedDate", payload.reminderDate)
      reminder.put("snoozedUntilMs", snoozedUntilMs)
      habit.put("reminder", reminder)
      true
    }

  private fun mutateHabit(context: Context, habitId: String, mutate: (JSONObject) -> Boolean): Boolean {
    val storage = mmkv(context, HABIT_STORAGE_ID)
    val rawStore = storage.decodeString(HABIT_STORAGE_KEY)
    if (rawStore == null) {
      Log.d(LOG_TAG, "mutateHabit failed: habits-storage key missing.")
      appendDebugRecord(context, "mutate-store-missing", detail = habitId)
      return false
    }

    val root = JSONObject(rawStore)
    val state = root.optJSONObject("state") ?: run {
      Log.d(LOG_TAG, "mutateHabit failed: persisted state missing.")
      appendDebugRecord(context, "mutate-state-missing", detail = habitId)
      return false
    }
    val habits = state.optJSONObject("habits") ?: run {
      Log.d(LOG_TAG, "mutateHabit failed: persisted habits map missing.")
      appendDebugRecord(context, "mutate-habits-missing", detail = habitId)
      return false
    }
    val habit = habits.optJSONObject(habitId) ?: run {
      Log.d(LOG_TAG, "mutateHabit failed: habit $habitId missing.")
      appendDebugRecord(context, "mutate-habit-missing", detail = habitId)
      return false
    }

    if (!mutate(habit)) {
      Log.d(LOG_TAG, "mutateHabit callback declined mutation for $habitId.")
      appendDebugRecord(context, "mutate-callback-declined", detail = habitId)
      return false
    }

    habits.put(habitId, habit)
    state.put("habits", habits)
    root.put("state", state)
    val didEncode = storage.encode(HABIT_STORAGE_KEY, root.toString())
    Log.d(LOG_TAG, "mutateHabit encode result for $habitId: $didEncode")
    return didEncode
  }

  private fun readHabit(context: Context, habitId: String): JSONObject? {
    val storage = mmkv(context, HABIT_STORAGE_ID)
    val rawStore = storage.decodeString(HABIT_STORAGE_KEY)
    if (rawStore == null) {
      Log.d(LOG_TAG, "readHabit failed: habits-storage key missing.")
      appendDebugRecord(context, "read-store-missing", detail = habitId)
      return null
    }

    val root = JSONObject(rawStore)
    val habit = root.optJSONObject("state")?.optJSONObject("habits")?.optJSONObject(habitId)
    Log.d(LOG_TAG, "readHabit result for $habitId: ${habit != null}")
    return habit
  }

  private fun appendDebugRecord(
    context: Context,
    event: String,
    payload: ReminderPayload? = null,
    actionId: String? = null,
    detail: String? = null,
    diagnosticContext: JSONObject = JSONObject()
  ) {
    val record = JSONObject()
      .put("handledAtMs", currentTimeMs())
      .put("event", event)

        payload?.let {
          record
            .put("actionId", it.actionId)
            .put("notificationId", it.notificationId)
            .put("habitId", it.habitId)
            .put("reminderDate", it.reminderDate)
            .put("reminderSeriesId", it.reminderSeriesId)
            .put("scheduledFor", it.scheduledFor)
        }

    actionId?.let { record.put("actionId", it) }
    detail?.let { record.put("detail", it) }

    try {
      val storage = mmkv(context, RUNTIME_STORAGE_ID)
      val entries = JSONArray(storage.decodeString(DEBUG_LEDGER_KEY) ?: "[]")
      storage.encode(DEBUG_LEDGER_KEY, appendBoundedRecord(entries, record).toString())
    } catch (error: Exception) {
      Log.d(LOG_TAG, "Failed to append MMKV debug record.", error)
    }

    try {
      val debugFile = File(context.filesDir, DEBUG_FILE_NAME)
      val entries = JSONArray(if (debugFile.exists()) debugFile.readText() else "[]")
      debugFile.writeText(appendBoundedRecord(entries, record).toString())
        } catch (error: Exception) {
          Log.d(LOG_TAG, "Failed to append file debug record.", error)
        }
        appendDiagnosticEvent(context, "android.reminder.$event", record, diagnosticContext)
      }

  private fun appendDiagnosticEvent(context: Context, event: String, debugRecord: JSONObject, extraContext: JSONObject) {
    val diagnosticContext = JSONObject()
      .put("actionId", debugRecord.optString("actionId").takeIf { it.isNotBlank() })
      .put("notificationId", debugRecord.optString("notificationId").takeIf { it.isNotBlank() })
      .put("habitId", debugRecord.optString("habitId").takeIf { it.isNotBlank() })
      .put("reminderDate", debugRecord.optString("reminderDate").takeIf { it.isNotBlank() })
      .put("reminderSeriesId", debugRecord.optString("reminderSeriesId").takeIf { it.isNotBlank() })

    if (debugRecord.has("scheduledFor")) {
      diagnosticContext.put("scheduledFor", debugRecord.optLong("scheduledFor"))
    }

    copyDiagnosticContext(extraContext, diagnosticContext)

    val nowMs = currentTimeMs()
    val diagnosticRecord = JSONObject()
      .put("timestamp", nowMs)
      .put("level", "info")
      .put("event", event)
      .put("source", "android-native")
      .put("context", diagnosticContext)

    try {
      val storage = mmkv(context, RUNTIME_STORAGE_ID)
      val entries = JSONArray(storage.decodeString(DIAGNOSTIC_EVENTS_KEY) ?: "[]")
      storage.encode(DIAGNOSTIC_EVENTS_KEY, appendBoundedDiagnosticRecord(entries, diagnosticRecord, nowMs).toString())
    } catch (error: Exception) {
      Log.d(LOG_TAG, "Failed to append diagnostic event.", error)
    }
  }

  private fun copyDiagnosticContext(source: JSONObject, target: JSONObject) {
    val allowedKeys = listOf(
      "responseKey",
      "didMutate",
      "handled",
      "scheduledCount",
      "ledgerCount",
      "totalCount",
      "count",
      "dismissedCount",
      "snoozedUntilMs"
    )
    allowedKeys.forEach { key ->
      if (source.has(key)) {
        target.put(key, source.get(key))
      }
    }
  }

  private fun appendAppliedActionRecord(
    context: Context,
    payload: ReminderPayload,
    responseKey: String,
    snoozedUntilMs: Long? = null
  ) {
    val record = JSONObject()
      .put("responseKey", responseKey)
      .put("actionIdentifier", payload.actionId)
      .put("habitId", payload.habitId)
      .put("reminderDate", payload.reminderDate)
      .put("handledAtMs", currentTimeMs())

    snoozedUntilMs?.let { record.put("snoozedUntilMs", it) }

    try {
      val storage = mmkv(context, RUNTIME_STORAGE_ID)
      val entries = JSONArray(storage.decodeString(ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY) ?: "[]")
      storage.encode(ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY, appendBoundedRecord(entries, record).toString())
    } catch (error: Exception) {
      Log.d(LOG_TAG, "Failed to append MMKV applied action record.", error)
    }

    try {
      val appliedActionFile = File(context.filesDir, ANDROID_NATIVE_REMINDER_ACTION_FILE_NAME)
      val entries = JSONArray(if (appliedActionFile.exists()) appliedActionFile.readText() else "[]")
      appliedActionFile.writeText(appendBoundedRecord(entries, record).toString())
    } catch (error: Exception) {
      Log.d(LOG_TAG, "Failed to append file applied action record.", error)
    }
  }

  private fun appendBoundedRecord(entries: JSONArray, record: JSONObject): JSONArray {
    val nextEntries = JSONArray()
    val startIndex = maxOf(0, entries.length() - DEBUG_LEDGER_MAX_RECORDS + 1)

    for (index in startIndex until entries.length()) {
      entries.optJSONObject(index)?.let { nextEntries.put(it) }
    }

    nextEntries.put(record)
    return nextEntries
  }

  private fun appendBoundedDiagnosticRecord(entries: JSONArray, record: JSONObject, nowMs: Long): JSONArray {
    val retainedEntries = JSONArray()
    val cutoffMs = nowMs - DIAGNOSTIC_RETENTION_MS

    for (index in 0 until entries.length()) {
      entries.optJSONObject(index)
        ?.takeIf { it.optLong("timestamp", 0L) >= cutoffMs }
        ?.let { retainedEntries.put(it) }
    }

    retainedEntries.put(record)
    return trimDiagnosticRecords(retainedEntries)
  }

  private fun trimDiagnosticRecords(entries: JSONArray): JSONArray {
    var nextEntries = entries
    while (nextEntries.length() > DIAGNOSTIC_MAX_RECORDS) {
      nextEntries = dropFirstDiagnosticRecord(nextEntries)
    }
    while (nextEntries.toString().length > DIAGNOSTIC_MAX_SERIALIZED_BYTES && nextEntries.length() > 0) {
      nextEntries = dropFirstDiagnosticRecord(nextEntries)
    }
    return nextEntries
  }

  private fun dropFirstDiagnosticRecord(entries: JSONArray): JSONArray {
    val nextEntries = JSONArray()
    for (index in 1 until entries.length()) {
      entries.optJSONObject(index)?.let { nextEntries.put(it) }
    }
    return nextEntries
  }

  private fun scheduleNextIntervalSeriesIfNeeded(
    context: Context,
    habit: JSONObject,
    payload: ReminderPayload,
    nowMs: Long
  ) {
    val repetition = habit.optJSONObject("repetition") ?: return
    if (repetition.optString("type") != "interval") {
      return
    }

    val reminder = habit.optJSONObject("reminder") ?: return
    if (!reminder.optBoolean("enabled", false)) {
      return
    }

    val intervalDays = repetition.optInt("days", 0)
    if (intervalDays <= 0) {
      return
    }

    val next = nextIntervalReminder(payload.reminderDate, intervalDays, reminder.optInt("hour"), reminder.optInt("minute"), nowMs)
    val repeatIfNotCompleted = reminder.optBoolean("repeatIfNotCompleted", false)
    val repeatIntervalMs = reminder.optionalLong("repeatIntervalMs")
    val normalizedRepeatIntervalMs = if (repeatIfNotCompleted) repeatIntervalMs else null
    val nextSeriesId = "series-${payload.habitId}-${next.reminderDate}"
    val jobs = buildReminderSeriesJobs(
      habitId = payload.habitId,
      habitTitle = habit.optString("title", payload.habitTitle),
      reminderDate = next.reminderDate,
      reminderSeriesId = nextSeriesId,
      firstReminderTimestamp = next.timestamp,
      maxAttempts = if (normalizedRepeatIntervalMs != null) MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE + 1 else 1,
      repeatIntervalMs = normalizedRepeatIntervalMs
    )

    scheduleReminderSeries(context, nextSeriesId, jobs)
  }

  private fun nextIntervalReminder(
    reminderDate: String,
    intervalDays: Int,
    reminderHour: Int,
    reminderMinute: Int,
    nowMs: Long
  ): NextIntervalReminder {
    val parts = reminderDate.split("-").map { it.toInt() }
    val calendar = Calendar.getInstance().apply {
      set(Calendar.YEAR, parts[0])
      set(Calendar.MONTH, parts[1] - 1)
      set(Calendar.DAY_OF_MONTH, parts[2])
      set(Calendar.HOUR_OF_DAY, reminderHour)
      set(Calendar.MINUTE, reminderMinute)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
      add(Calendar.DAY_OF_MONTH, intervalDays)
    }

    while (calendar.timeInMillis <= nowMs) {
      calendar.add(Calendar.DAY_OF_MONTH, intervalDays)
    }

    val date = "%04d-%02d-%02d".format(
      calendar.get(Calendar.YEAR),
      calendar.get(Calendar.MONTH) + 1,
      calendar.get(Calendar.DAY_OF_MONTH)
    )
    return NextIntervalReminder(date, calendar.timeInMillis)
  }

  private fun buildReminderSeriesJobs(
    habitId: String,
    habitTitle: String,
    reminderDate: String,
    reminderSeriesId: String,
    firstReminderTimestamp: Long,
    maxAttempts: Int,
    repeatIntervalMs: Long?
  ): List<ReminderJob> {
    val normalizedMaxAttempts = maxOf(1, maxAttempts)
    val normalizedRepeatIntervalMs = repeatIntervalMs?.takeIf { it > 0 }
    return (0 until normalizedMaxAttempts).mapNotNull { attemptNumber ->
      if (attemptNumber > 0 && normalizedRepeatIntervalMs == null) {
        null
      } else {
        val timestamp = firstReminderTimestamp + (normalizedRepeatIntervalMs ?: 0L) * attemptNumber
        ReminderJob(
          notificationId = "$REMINDER_PREFIX$reminderSeriesId-$timestamp",
          habitId = habitId,
          habitTitle = habitTitle,
          timestamp = timestamp,
          reminderDate = reminderDate,
          reminderSeriesId = reminderSeriesId,
          attemptNumber = attemptNumber,
          maxAttempts = normalizedMaxAttempts,
          repeatIntervalMs = normalizedRepeatIntervalMs
        )
      }
    }
  }

  private fun scheduleReminderSeries(context: Context, reminderSeriesId: String, jobs: List<ReminderJob>) {
    val scheduledJobs = jobs.filter { job ->
      val request = NotificationRequest(
        job.notificationId,
        notificationContent(context, job),
        DateTrigger(REMINDER_CHANNEL_ID, job.timestamp)
      )
      try {
        getSchedulingDelegate(context).scheduleNotification(request)
        true
      } catch (error: Exception) {
        Log.e(LOG_TAG, "Failed to schedule native reminder ${job.notificationId}.", error)
        false
      }
    }

    if (scheduledJobs.isNotEmpty()) {
      replaceScheduleLedgerEntries(context, reminderSeriesId, scheduledJobs)
    }
  }

  private fun notificationContent(context: Context, job: ReminderJob): NotificationContent {
    val body = JSONObject()
      .put("kind", REMINDER_KIND)
      .put("habitId", job.habitId)
      .put("habitTitle", job.habitTitle)
      .put("reminderDate", job.reminderDate)
      .put("reminderSeriesId", job.reminderSeriesId)
      .put("scheduledFor", job.timestamp)
      .put("attemptNumber", job.attemptNumber)
      .put("maxAttempts", job.maxAttempts)
    job.repeatIntervalMs?.let { body.put("repeatIntervalMs", it) }

    return NotificationContent.Builder()
      .setTitle(job.habitTitle)
      .setText(
        localizedString(
          context,
          if (job.attemptNumber > 0) "yaht_notification_follow_up_body" else "yaht_notification_reminder_body",
          if (job.attemptNumber > 0) "Still due. Mark it done when you're finished." else "Time to check in."
        )
      )
      .setBody(body)
      .setPriority(NotificationPriority.HIGH)
      .setColor(0xFF023C69.toInt())
      .setAutoDismiss(true)
      .setCategoryId(CATEGORY_ID)
      .build()
  }

  private fun cancelReminderSeries(context: Context, reminderSeriesId: String, payload: ReminderPayload? = null) {
    val schedulingDelegate = getSchedulingDelegate(context)
    val scheduledIds = try {
      schedulingDelegate
        .getAllScheduledNotifications()
        .filter { notificationMatchesSeries(it.identifier, it.content.body, reminderSeriesId) }
        .map { it.identifier }
    } catch (error: Exception) {
      Log.d(LOG_TAG, "Failed to inspect scheduled reminder series notifications.", error)
      appendDebugRecord(context, "cancel-series-inspect-failed", payload, detail = error.message)
      emptyList()
    }
    val ledgerIds = try {
      readScheduleLedgerNotificationIds(context, reminderSeriesId)
    } catch (error: Exception) {
      Log.d(LOG_TAG, "Failed to read scheduled reminder series ledger ids.", error)
      appendDebugRecord(context, "cancel-series-ledger-read-failed", payload, detail = error.message)
      emptyList()
    }
    val idsToCancel = (scheduledIds + ledgerIds).distinct()

    Log.d(
      LOG_TAG,
      "Cancel reminder series $reminderSeriesId: scheduled=${scheduledIds.size} ledger=${ledgerIds.size} total=${idsToCancel.size}"
    )
    appendDebugRecord(
      context,
      "cancel-series-candidates",
      payload,
      detail = "scheduled=${scheduledIds.size}; ledger=${ledgerIds.size}; total=${idsToCancel.size}; ids=${idsToCancel.joinToString(",")}",
      diagnosticContext = JSONObject()
        .put("scheduledCount", scheduledIds.size)
        .put("ledgerCount", ledgerIds.size)
        .put("totalCount", idsToCancel.size)
    )

    if (idsToCancel.isNotEmpty()) {
      try {
        schedulingDelegate.removeScheduledNotifications(idsToCancel)
        appendDebugRecord(
          context,
          "cancel-series-removed",
          payload,
          detail = idsToCancel.size.toString(),
          diagnosticContext = JSONObject().put("count", idsToCancel.size)
        )
      } catch (error: Exception) {
        Log.d(LOG_TAG, "Failed to remove scheduled reminder series notifications.", error)
        appendDebugRecord(context, "cancel-series-remove-failed", payload, detail = error.message)
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      try {
        var dismissedCount = 0
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.activeNotifications
          .filter {
            val tag = it.tag ?: ""
            idsToCancel.contains(tag) || notificationMatchesSeries(tag, unmarshaledRequestBody(it.notification.extras), reminderSeriesId)
          }
          .forEach {
            NotificationManagerCompat.from(context).cancel(it.tag, it.id)
            dismissedCount += 1
          }
        appendDebugRecord(
          context,
          "cancel-series-active-dismissed",
          payload,
          detail = dismissedCount.toString(),
          diagnosticContext = JSONObject().put("dismissedCount", dismissedCount)
        )
      } catch (error: Exception) {
        Log.d(LOG_TAG, "Failed to inspect active reminder series notifications.", error)
        appendDebugRecord(context, "cancel-series-active-failed", payload, detail = error.message)
      }
    }
  }

  private fun notificationMatchesSeries(identifier: String, body: JSONObject?, reminderSeriesId: String): Boolean =
    body?.optString("reminderSeriesId") == reminderSeriesId || identifier.startsWith("$REMINDER_PREFIX$reminderSeriesId-")

  private fun unmarshaledRequestBody(extras: android.os.Bundle): JSONObject? {
    val bytes = extras.getByteArray(ExpoNotificationBuilder.EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY) ?: return null
    return try {
      val parcel = Parcel.obtain()
      parcel.unmarshall(bytes, 0, bytes.size)
      parcel.setDataPosition(0)
      val request = NotificationRequest.CREATOR.createFromParcel(parcel)
      parcel.recycle()
      request.content.body
    } catch (_: Exception) {
      null
    }
  }

  private fun claimResponse(context: Context, responseKey: String, nowMs: Long): Boolean {
    val storage = mmkv(context, RUNTIME_STORAGE_ID)
    val cutoffMs = nowMs - RESPONSE_LEDGER_TTL_MS
    val entries = JSONArray(storage.decodeString(RESPONSE_LEDGER_KEY) ?: "[]")
    val nextEntries = JSONArray()
    var alreadyClaimed = false

    for (index in 0 until entries.length()) {
      val entry = entries.optJSONObject(index) ?: continue
      if (entry.optLong("handledAtMs", 0L) >= cutoffMs) {
        if (entry.optString("responseKey") == responseKey) {
          alreadyClaimed = true
        }
        nextEntries.put(entry)
      }
    }

    if (alreadyClaimed) {
      storage.encode(RESPONSE_LEDGER_KEY, nextEntries.toString())
      return false
    }

    nextEntries.put(JSONObject().put("responseKey", responseKey).put("handledAtMs", nowMs))
    return storage.encode(RESPONSE_LEDGER_KEY, nextEntries.toString())
  }

  private fun releaseResponseClaim(context: Context, responseKey: String) {
    val storage = mmkv(context, RUNTIME_STORAGE_ID)
    val entries = JSONArray(storage.decodeString(RESPONSE_LEDGER_KEY) ?: "[]")
    val nextEntries = JSONArray()

    for (index in 0 until entries.length()) {
      val entry = entries.optJSONObject(index) ?: continue
      if (entry.optString("responseKey") != responseKey) {
        nextEntries.put(entry)
      }
    }

    storage.encode(RESPONSE_LEDGER_KEY, nextEntries.toString())
  }

  private fun readScheduleLedgerNotificationIds(context: Context, reminderSeriesId: String): List<String> {
    val storage = mmkv(context, RUNTIME_STORAGE_ID)
    val ledger = JSONObject(storage.decodeString(SCHEDULE_LEDGER_KEY) ?: return emptyList())
    val entries = ledger.optJSONArray("normalNotifications") ?: return emptyList()
    val notificationPrefix = "$REMINDER_PREFIX$reminderSeriesId-"
    val notificationIds = mutableListOf<String>()

    for (index in 0 until entries.length()) {
      val entry = entries.optJSONObject(index) ?: continue
      val notificationId = entry.optString("notificationId")
      if (entry.optString("reminderSeriesId") == reminderSeriesId || notificationId.startsWith(notificationPrefix)) {
        notificationIds.add(notificationId)
      }
    }

    return notificationIds
  }

  private fun removeScheduleLedgerEntries(context: Context, reminderSeriesId: String) {
    val storage = mmkv(context, RUNTIME_STORAGE_ID)
    val ledger = JSONObject(storage.decodeString(SCHEDULE_LEDGER_KEY) ?: return)
    val entries = ledger.optJSONArray("normalNotifications") ?: JSONArray()
    val nextEntries = JSONArray()
    val notificationPrefix = "$REMINDER_PREFIX$reminderSeriesId-"

    for (index in 0 until entries.length()) {
      val entry = entries.optJSONObject(index) ?: continue
      if (entry.optString("reminderSeriesId") != reminderSeriesId &&
        !entry.optString("notificationId").startsWith(notificationPrefix)
      ) {
        nextEntries.put(entry)
      }
    }

    ledger.put("normalNotifications", nextEntries)
    ledger.put("generatedAtMs", currentTimeMs())
    storage.encode(SCHEDULE_LEDGER_KEY, ledger.toString())
  }

  private fun replaceScheduleLedgerEntries(context: Context, reminderSeriesId: String, jobs: List<ReminderJob>) {
    val storage = mmkv(context, RUNTIME_STORAGE_ID)
    val ledger = JSONObject(
      storage.decodeString(SCHEDULE_LEDGER_KEY)
        ?: JSONObject().put("version", 1).put("generatedAtMs", currentTimeMs()).put("normalNotifications", JSONArray()).toString()
    )
    val entries = ledger.optJSONArray("normalNotifications") ?: JSONArray()
    val nextEntries = JSONArray()

    for (index in 0 until entries.length()) {
      val entry = entries.optJSONObject(index) ?: continue
      if (entry.optString("reminderSeriesId") != reminderSeriesId) {
        nextEntries.put(entry)
      }
    }

    val scheduledAtMs = currentTimeMs()
    jobs.forEach { job ->
      nextEntries.put(scheduleLedgerEntry(job, scheduledAtMs))
    }

    ledger.put("version", 1)
    ledger.put("generatedAtMs", scheduledAtMs)
    ledger.put("normalNotifications", nextEntries)
    storage.encode(SCHEDULE_LEDGER_KEY, ledger.toString())
  }

  private fun scheduleLedgerEntry(job: ReminderJob, scheduledAtMs: Long): JSONObject {
    val entry = JSONObject()
      .put("notificationId", job.notificationId)
      .put("habitId", job.habitId)
      .put("habitTitle", job.habitTitle)
      .put("timestamp", job.timestamp)
      .put("reminderDate", job.reminderDate)
      .put("reminderSeriesId", job.reminderSeriesId)
      .put("attemptNumber", job.attemptNumber)
      .put("maxAttempts", job.maxAttempts)
      .put("scheduledAtMs", scheduledAtMs)
    // Match JSON.stringify's omission of undefined repeatIntervalMs in the JS ledger signature.
    job.repeatIntervalMs?.let { entry.put("repeatIntervalMs", it) }
    entry.put("signature", reminderSignature(job))
    return entry
  }

  private fun reminderSignature(job: ReminderJob): String {
    val signature = JSONObject()
      .put("version", 1)
      .put("platform", "android")
      .put("type", "normal")
      .put("habitId", job.habitId)
      .put("habitTitle", job.habitTitle)
      .put("timestamp", job.timestamp)
      .put("reminderDate", job.reminderDate)
      .put("reminderSeriesId", job.reminderSeriesId)
      .put("attemptNumber", job.attemptNumber)
      .put("maxAttempts", job.maxAttempts)
    // Match JSON.stringify's omission of undefined repeatIntervalMs in the JS ledger signature.
    job.repeatIntervalMs?.let { signature.put("repeatIntervalMs", it) }
    return signature.toString()
  }

  private fun mmkv(context: Context, storageId: String): MMKV {
    initializeMmkv(context)
    return MMKV.mmkvWithID(storageId)
  }

  private fun initializeMmkv(context: Context) {
    if (isMmkvInitialized) {
      return
    }

    synchronized(MMKV_INIT_LOCK) {
      if (!isMmkvInitialized) {
        MMKV.initialize("${context.filesDir.absolutePath}/mmkv")
        isMmkvInitialized = true
      }
    }
  }

  private fun JSONObject.optionalLong(key: String): Long? = if (has(key) && !isNull(key)) optLong(key) else null

  private fun localizedString(context: Context, name: String, fallback: String): String {
    val resourceId = context.resources.getIdentifier(name, "string", context.packageName)
    return if (resourceId == 0) fallback else context.getString(resourceId)
  }

  private fun currentTimeMs(): Long = System.currentTimeMillis()

  private data class NextIntervalReminder(val reminderDate: String, val timestamp: Long)

  companion object {
    private const val LOG_TAG = "YAHTReminderActions"
    private val NATIVE_RESPONSE_LOCK = Any()
    private val MMKV_INIT_LOCK = Any()
    @Volatile private var isMmkvInitialized = false
    private const val CATEGORY_ID = "habitReminderActions"
    private const val DONE_ACTION_ID = "habitReminderDone"
    private const val SNOOZE_ACTION_ID = "habitReminderSnooze"
    private const val REMINDER_KIND = "habitReminder"
    private const val REMINDER_PREFIX = "reminder-"
    private const val REMINDER_CHANNEL_ID = "reminders"
    private const val DEFAULT_SNOOZE_MS = 15 * 60 * 1000L
    private const val MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE = 3
    private const val RESPONSE_LEDGER_TTL_MS = 48 * 60 * 60 * 1000L
    private const val HABIT_STORAGE_ID = "yaht-persistence"
    private const val RUNTIME_STORAGE_ID = "yaht-runtime"
    private const val HABIT_STORAGE_KEY = "habits-storage"
    private const val RESPONSE_LEDGER_KEY = "reminder-response-ledger"
    private const val SCHEDULE_LEDGER_KEY = "reminder-schedule-ledger"
    private const val ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY = "android-native-reminder-actions"
    private const val ANDROID_NATIVE_REMINDER_ACTION_FILE_NAME = "yaht-android-native-reminder-actions.json"
      private const val DEBUG_LEDGER_KEY = "reminder-action-debug-ledger"
      private const val DEBUG_FILE_NAME = "yaht-reminder-action-debug.json"
      private const val DEBUG_LEDGER_MAX_RECORDS = 40
      private const val DIAGNOSTIC_EVENTS_KEY = "diagnostic-events"
      private const val DIAGNOSTIC_MAX_RECORDS = 1000
      private const val DIAGNOSTIC_MAX_SERIALIZED_BYTES = 1024 * 1024
      private const val DIAGNOSTIC_RETENTION_MS = 7L * 24L * 60L * 60L * 1000L
    }
  }
