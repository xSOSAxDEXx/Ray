# Plan: reading steps, workouts and heart rate from Apple Health and Health Connect

Status: **planned, not built** (roadmap Phase 5, item 5). This lists what each platform needs so the work can be scheduled.

## Shared approach

- **What to read:** steps, workouts (type, start, duration, energy) and heart rate (resting and during workouts). Read only, at first.
- **When:** read when the app opens and on pull-to-refresh. Show it on Today (steps toward a daily goal) and in Analytics (workouts recorded by a watch alongside logged sessions).
- **Avoid double counting:** a watch workout that overlaps a logged Rep & Ration session (same day, start within 30 minutes) is shown as one session.
- **Privacy:** health data stays on the phone and is **not** uploaded to Supabase unless the user turns on a separate, clearly explained "Sync health data" setting. Both Apple and Google forbid using health data for advertising.
- **Build type:** both need native code, so they need development builds (EAS), not Expo Go. This is already the plan for the mobile app.

## iPhone and Apple Watch: HealthKit

- **Library:** a maintained HealthKit module with an Expo config plugin (for example `@kingstinct/react-native-healthkit`). Check its SDK 58 compatibility at build time.
- **Config:**
  - Turn on the HealthKit capability (entitlement `com.apple.developer.healthkit`).
  - Add `NSHealthShareUsageDescription` (why we read) to the iOS config in `app.json`. `NSHealthUpdateUsageDescription` is needed only if we later write data.
- **Data types:**
  - `HKQuantityTypeIdentifierStepCount`, `HKQuantityTypeIdentifierHeartRate`, `HKQuantityTypeIdentifierRestingHeartRate`
  - `HKWorkoutType` (with `activeEnergyBurned`)
- **Apple Watch:** workouts and heart rate recorded on the watch sync into HealthKit on the iPhone automatically, so no watch app is needed just to read them.
- **App Review:** the privacy policy must describe health data use. HealthKit data can't be stored in iCloud, and apps may not ask for health types they don't use.
- **Testing:** the iOS Simulator has a Health app for adding sample data; real watch data needs a device.

## Android, Samsung Galaxy Watch and Wear OS: Health Connect

- **Library:** `react-native-health-connect` with its Expo config plugin (plus `expo-build-properties` for the minimum SDK it needs).
- **Config:**
  - Declare permissions in the Android manifest via the plugin: `android.permission.health.READ_STEPS`, `READ_EXERCISE`, `READ_HEART_RATE`.
  - Add an activity that shows the privacy-policy rationale; Health Connect requires it.
- **Availability:** Health Connect is built into Android 14 and later. On Android 9–13 the user installs the Health Connect app from Google Play, so the app should detect this and link to it.
- **Samsung Galaxy Watch:** Samsung Health syncs to Health Connect once the user turns that on in Samsung Health's settings. Explain this in the app. Wear OS watches that write to Health Connect (for example via Fitbit or Google Fit) work the same way.
- **Google Play:** the Health Connect permissions declaration form must be approved before release, with a privacy policy that covers health data.
- **Testing:** use the Health Connect toolbox app to insert sample data on an emulator or device.

## Rough order of work

1. Add a "Connect health data" card in Settings with plain-language explanations, and request permissions only when tapped.
2. Steps on Today. This is the simplest read and proves the setup on both platforms.
3. Watch workouts in the workout history, with de-duplication.
4. Heart rate in workout summaries.
5. Optionally, write Rep & Ration workouts back to Health. This needs the "update" or "write" permissions and a new review.
