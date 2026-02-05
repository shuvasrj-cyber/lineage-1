
# वंशावली रेकर्ड - Android Build Workflow

This application is configured as a native Android app using **Capacitor**.

## How to get the APK
1. **Push to GitHub**: Every time you push to the `main` branch, GitHub Actions will trigger.
2. **Go to Actions Tab**: Click the "Actions" tab in your GitHub repository.
3. **Select "Build Android APK"**: Click on the most recent workflow run.
4. **Download Artifacts**: Once finished, download the `vanshavali-app-debug` zip file. Inside, you will find `app-debug.apk`.
5. **Install on Phone**: Transfer the APK to your Android device and install it (you may need to allow "Unknown Sources").

## Technical Stack
- **Frontend**: React, TypeScript, Tailwind CSS, D3.js.
- **Storage**: IndexedDB (Native WebSQL replacement), fully offline.
- **Native Bridge**: Capacitor (JS to Native bridge).
- **CI/CD**: GitHub Actions using Ubuntu runners with Android SDK and JDK 17.

## Offline Functionality
- The APK bundles all assets (HTML, CSS, JS, Fonts).
- Data is stored in the device's persistent app storage.
- No internet is required after installation.
