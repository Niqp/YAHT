package com.niqp.yaht.notifications

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
      super.onReceiveNotificationResponse(context, intent)
      return
    }

    if (!handleReminderResponse(context.applicationContext, response)) {
      super.onReceiveNotificationResponse(context, intent)
    }
  }

  private fun handleReminderResponse(context: Context, response: NotificationResponse): Boolean {
    val actionId = response.actionIdentifier
    if (actionId != DONE_ACTION_ID && actionId != SNOOZE_ACTION_ID) {
      return false
    }

    val payload = parsePayload(response) ?: return false
    dismissNotification(context, payload.notificationId)

    val nowMs = currentTimeMs()
    val responseKey = "${payload.notificationId}:${payload.actionId}"

    synchronized(NATIVE_RESPONSE_LOCK) {
      if (!claimResponse(context, responseKey, nowMs)) {
        return true
      }

      val handled = try {
        when (payload.actionId) {
          DONE_ACTION_ID -> {
            val habitSnapshot = readHabit(context, payload.habitId) ?: return falseAfterReleasingClaim(context, responseKey)
            if (!applyDone(context, payload)) {
              return falseAfterReleasingClaim(context, responseKey)
            }

            cancelReminderSeries(context, payload.reminderSeriesId)
            removeScheduleLedgerEntries(context, payload.reminderSeriesId)
            scheduleNextIntervalSeriesIfNeeded(context, habitSnapshot, payload, nowMs)
            true
          }

          SNOOZE_ACTION_ID -> {
            val snoozedUntilMs = nowMs + DEFAULT_SNOOZE_MS
            if (!applySnooze(context, payload, snoozedUntilMs)) {
              return falseAfterReleasingClaim(context, responseKey)
            }

            cancelReminderSeries(context, payload.reminderSeriesId)
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
        false
      }

      if (!handled) {
        releaseResponseClaim(context, responseKey)
      }
      return handled
    }
  }

  private fun falseAfterReleasingClaim(context: Context, responseKey: String): Boolean {
    releaseResponseClaim(context, responseKey)
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
    val root = JSONObject(storage.decodeString(HABIT_STORAGE_KEY) ?: return false)
    val state = root.optJSONObject("state") ?: return false
    val habits = state.optJSONObject("habits") ?: return false
    val habit = habits.optJSONObject(habitId) ?: return false

    if (!mutate(habit)) {
      return false
    }

    habits.put(habitId, habit)
    state.put("habits", habits)
    root.put("state", state)
    return storage.encode(HABIT_STORAGE_KEY, root.toString())
  }

  private fun readHabit(context: Context, habitId: String): JSONObject? {
    val storage = mmkv(context, HABIT_STORAGE_ID)
    val root = JSONObject(storage.decodeString(HABIT_STORAGE_KEY) ?: return null)
    return root.optJSONObject("state")?.optJSONObject("habits")?.optJSONObject(habitId)
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
      .setTitle(
        if (job.attemptNumber > 0) {
          localizedString(context, "yaht_notification_follow_up_title", "Still waiting")
        } else {
          localizedString(context, "yaht_notification_reminder_title", "Friendly Reminder")
        }
      )
      .setText(
        localizedString(
          context,
          if (job.attemptNumber > 0) "yaht_notification_follow_up_body" else "yaht_notification_reminder_body",
          if (job.attemptNumber > 0) "{habitTitle} still needs attention." else "It's time for: {habitTitle}"
        ).replace("{habitTitle}", job.habitTitle)
      )
      .setBody(body)
      .setPriority(NotificationPriority.HIGH)
      .setColor(0xFF023C69.toInt())
      .setAutoDismiss(true)
      .setCategoryId(CATEGORY_ID)
      .build()
  }

  private fun cancelReminderSeries(context: Context, reminderSeriesId: String) {
    val scheduledIds = getSchedulingDelegate(context)
      .getAllScheduledNotifications()
      .filter { notificationMatchesSeries(it.identifier, it.content.body, reminderSeriesId) }
      .map { it.identifier }
    if (scheduledIds.isNotEmpty()) {
      getSchedulingDelegate(context).removeScheduledNotifications(scheduledIds)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.activeNotifications
        .filter { notificationMatchesSeries(it.tag ?: "", unmarshaledRequestBody(it.notification.extras), reminderSeriesId) }
        .forEach { NotificationManagerCompat.from(context).cancel(it.tag, it.id) }
    }
  }

  private fun dismissNotification(context: Context, identifier: String) {
    NotificationManagerCompat.from(context).cancel(identifier, ANDROID_NOTIFICATION_ID)
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
    val storage = mmkv(context, RESPONSE_LEDGER_STORAGE_ID)
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
    val storage = mmkv(context, RESPONSE_LEDGER_STORAGE_ID)
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

  private fun removeScheduleLedgerEntries(context: Context, reminderSeriesId: String) {
    val storage = mmkv(context, SCHEDULE_LEDGER_STORAGE_ID)
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
    val storage = mmkv(context, SCHEDULE_LEDGER_STORAGE_ID)
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
    // react-native-mmkv's JS `new MMKV()` maps to Tencent MMKV's default "mmkv.default" instance.
    return if (storageId == HABIT_STORAGE_ID) MMKV.defaultMMKV() else MMKV.mmkvWithID(storageId)
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
    private const val ANDROID_NOTIFICATION_ID = 0
    private const val CATEGORY_ID = "habitReminderActions"
    private const val DONE_ACTION_ID = "habitReminderDone"
    private const val SNOOZE_ACTION_ID = "habitReminderSnooze"
    private const val REMINDER_KIND = "habitReminder"
    private const val REMINDER_PREFIX = "reminder-"
    private const val REMINDER_CHANNEL_ID = "reminders"
    private const val DEFAULT_SNOOZE_MS = 15 * 60 * 1000L
    private const val MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE = 3
    private const val RESPONSE_LEDGER_TTL_MS = 48 * 60 * 60 * 1000L
    private const val HABIT_STORAGE_ID = "mmkv.default"
    private const val HABIT_STORAGE_KEY = "habits-storage"
    private const val RESPONSE_LEDGER_STORAGE_ID = "reminder-response-ledger"
    private const val RESPONSE_LEDGER_KEY = "reminder-response-ledger"
    private const val SCHEDULE_LEDGER_STORAGE_ID = "reminder-schedule-ledger"
    private const val SCHEDULE_LEDGER_KEY = "reminder-schedule-ledger"
  }
}
