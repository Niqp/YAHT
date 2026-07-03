# Google Play Submission Notes

## Store Listing

- App name: YAHT Habit Tracker
- Package name: dev.niqp.yaht
- Short description: Track habits, timers, reminders, and streaks locally.
- Full description:

YAHT is a local-first habit tracker for daily, repetition, and timed habits. Create routines, schedule reminders, track streaks and statistics, and keep your habit data on your device. Import and export JSON backups when you want to move or save your data.

Core features:

- Simple, repetition, and timed habits.
- Local reminder and timer notifications.
- Streaks, charts, and overall statistics.
- Light, dark, and OLED-friendly themes.
- JSON import and export with no account required.

## Data Safety Form

Recommended answers based on the current codebase:

- Does the app collect or share required user data types? No.
- Is all user data encrypted in transit? Not applicable because YAHT does not transmit user data to developer-operated servers.
- Can users request deletion? Yes. Users can reset all local app data in Settings, clear app storage through the operating system, or uninstall the app.
- Data sharing: No developer-initiated sharing. User-initiated exports and diagnostic reports are saved or shared only to destinations the user chooses.

Rationale: Google Play defines collection as transmitting data off the device. YAHT stores habit data locally and does not send it to a YAHT backend. User-selected import/export and Android Sharesheet actions are explicit user actions.

## Permissions

Expected user-facing permission/feature declarations:

- Notifications: used for habit reminders, follow-up reminders, and timer completion alerts.
- `SCHEDULE_EXACT_ALARM`: required for user-scheduled reminders and timers to fire at the selected time. Without exact alarm access, YAHT cannot reliably provide its core reminder/timer behavior.
- `VIBRATE`: used for notification vibration and haptic feedback.

The app config blocks legacy storage and system overlay permissions from the generated release manifest because YAHT uses user-selected file import/export and does not need broad storage or overlay access.

## Exact Alarm Declaration

Suggested declaration wording:

YAHT lets users create habit reminders and timed habits that must notify them at a precise user-selected time. Exact alarm access is core to the app's reminder and timer functionality. The app checks whether exact alarms are available and directs users to system settings only when the user enables reminder or timer behavior that depends on precise notification delivery.

## Screenshots

Prepare phone screenshots for:

- Today tab with example habits.
- Add habit flow with completion type selection.
- Reminder settings.
- Stats tab.
- Settings tab with local data controls.
