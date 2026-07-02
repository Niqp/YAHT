# Apple App Store Submission Notes

## App Information

- App name: YAHT Habit Tracker
- Subtitle: Daily goals and reminders
- Bundle ID: tech.niqp.yaht
- SKU suggestion: yaht-ios
- Primary category: Productivity
- Secondary category: Health & Fitness
- Privacy policy URL: https://github.com/Niqp/YAHT/blob/master/PRIVACY.md
- Support URL: https://github.com/Niqp/YAHT/issues

## App Privacy Answers

Recommended App Store privacy label based on the current codebase:

- Data collection: Data Not Collected
- Tracking: No
- Third-party advertising: No
- Developer advertising or marketing: No
- Analytics transmitted off-device: No

Rationale: habit data, settings, reminder ledgers, and diagnostic events remain on device. Exported backups and diagnostic reports are created only after user action and are saved or shared to a destination the user chooses.

## Review Notes

YAHT does not require an account or demo credentials. Reviewers can create habits locally in the app.

Suggested review note:

YAHT is a local-first habit tracker. The main review flow is: create a habit, choose simple/repetition/timed completion, optionally enable a reminder, complete the habit from Today, review statistics, and use Settings for import/export or reset. Reminder notification actions are local notification actions. The hidden diagnostic export row appears after tapping the version row seven times and only exports privacy-safe troubleshooting logs to a user-selected destination.

## Privacy Manifest

The generated iOS project includes `PrivacyInfo.xcprivacy` from Expo/native dependencies. Before App Store upload, regenerate the native project or build with EAS and confirm the final archive contains the generated privacy manifest plus any required reason API declarations from dependencies.

## Screenshots

Prepare screenshots for:

- Today tab with at least two example habits.
- Add habit flow showing completion types and reminders.
- Stats tab with habit progress.
- Settings tab showing local data controls.

Test small phone, large phone, and iPad layouts before submission because the app declares iPad support.
