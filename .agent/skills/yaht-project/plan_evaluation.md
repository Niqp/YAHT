# Reminder Queue Plan Evaluation

I have reviewed the proposed "Derived Bounded Reminder Queue" plan against the current YAHT codebase. The plan is technically sound, extremely well-thought-out, and directly addresses several hidden bugs and platform limitations in the current implementation.

## Key Findings & Validation against Codebase

### 1. The iOS Notification Limit (64)

- **Current Code:** `useReminderManager` schedules up to `MAX_CONCURRENT_REMINDER_NOTIFICATIONS = 500`.
- **Validation:** Expo and iOS limit scheduled local notifications to 64 per app. The current approach will result in iOS silently dropping reminders.
- **Verdict:** The plan to reserve 63 slots for normal occurrences and 1 for a "queue full" stop notification is a **perfect, platform-aware solution** that keeps the user informed when they need to reopen the app.

### 2. Timezone Travel on iOS

- **Current Code:** `schedulePreparedReminderNotification` uses `DATE` triggers (absolute timestamps) for all platforms.
- **Validation:** On iOS, `DATE` triggers will fire at the exact UTC timestamp. If the user schedules a habit for 9:00 AM and travels to a timezone 3 hours ahead, it will fire at 12:00 PM local time.
- **Verdict:** Using `CALENDAR` triggers on iOS without a specified timezone is exactly how to achieve wall-clock local reminders. Since Expo doesn't support waking up the app on iOS timezone changes, this is the only reliable way to handle travel for iOS users.

### 3. Critical Bug Catch: Timer Cleanups

- **Current Code:** `cancelAllTimerNotifications` in `utils/notifications.ts` calls `Notifications.cancelAllScheduledNotificationsAsync()`.
- **Validation:** This currently wipes out the entire reminder queue whenever timers are globally cleaned up!
- **Verdict:** The plan successfully identifies this cross-domain pollution. Tightening notification ownership via stable prefixes is a mandatory fix.

### 4. Background Reconciliation on Android

- **Current Code:** The `react-native-android-time-change` sibling package only listens for `TIME_SET`, `TIMEZONE_CHANGED`, and `TIMEZONE_OFFSET_CHANGED`.
- **Validation:** Android clears all scheduled alarms when a device reboots or when an app is updated. Without `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`, users will permanently lose all background reminders after their phone restarts or the app updates, until they open the app again.
- **Verdict:** Extending the native package is absolutely correct.

### 5. The MMKV Ledger

- **Current Code:** Relies on `Notifications.getAllScheduledNotificationsAsync()` to figure out what to clear.
- **Validation:** This Expo method is asynchronous and can be unreliable or slow during background tasks.
- **Verdict:** Storing scheduled IDs and timestamps in a synchronous MMKV ledger makes reconciliation deterministic and much safer.

---

## Technical Suggestions & Minor Refinements

> [!NOTE]
> These are minor implementation details to keep in mind while executing the plan.

1. **Queue Lookahead Optimization:**
   Currently, `useReminderManager` hardcodes `MAX_LOOKAHEAD_DAYS = 7`. The plan suggests expanding up to 366 days until 64 jobs are found. To avoid burning CPU on a full year loop if the queue fills up quickly, the builder loop should check `candidates.length >= 64` and break early.

2. **Native Android Manifest Updates:**
   When updating the sibling package, don't forget that `BOOT_COMPLETED` requires a specific permission. We will need to add `<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />` to the library's `AndroidManifest.xml` alongside the intent filters.

3. **Foreground Clearing Behavior:**
   The plan notes: _"Foreground behavior keeps the current UX: clear pending/presented YAHT reminders while the app is active."_
   If we are completely clearing the queue while the app is active, we must also clear the new MMKV ledger at the same time to prevent the ledger from getting out of sync with actual native scheduled alarms.

---

## Open Questions for Implementation

1. **Should the ledger be placed in the main `habitStore`?**
   Since the ledger changes frequently and isn't used for React UI rendering, it might be better to create a separate zustand store (e.g., `scheduleStore`) or just a plain MMKV wrapper. This will prevent unnecessary React re-renders across the app whenever the queue is rebuilt.

2. **Shall we proceed with the implementation?**
   If you approve of this review, I am ready to start executing the plan. I will begin by updating the sibling Android package, then move to the notification utilities, and finally rebuild the queue logic.
