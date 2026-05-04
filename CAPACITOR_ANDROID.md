# KAIZEN - Android (Capacitor) Setup

This wraps the deployed Next.js app inside an Android WebView shell.
Server components, API routes, and Supabase auth all keep working
because they continue running on your web server. The APK is a thin
native chrome around the live site.

---

## 0. Prerequisites (one-time)

Install on your dev machine:

- Node 18+ and npm
- JDK 17 (`brew install --cask temurin@17` on macOS, or Adoptium installer on Windows)
- Android Studio (latest) - includes Android SDK, build-tools, platform-tools
- After install: open Android Studio -> SDK Manager and install:
  - Android SDK Platform 34
  - Android SDK Build-Tools 34.0.0
  - Android SDK Command-line Tools

Set env vars (add to `~/.zshrc` or system env):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"     # macOS path; Windows: %LOCALAPPDATA%\Android\Sdk
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Verify:

```bash
adb --version
sdkmanager --list-installed | head
```

---

## 1. Deploy your Next.js web app first

The APK loads `https://your-kaizen-domain.com`. That URL must already
work in a mobile browser. Deploy to Vercel (or anywhere you prefer) and
verify:

- HTTPS only (Capacitor refuses cleartext by default)
- `/dojo` works on a phone browser (login, complete day, etc.)
- `manifest.json` and `sw.js` are served correctly

Then edit `capacitor.config.ts` and replace `your-kaizen-domain.com`
with your actual domain in TWO places: `server.url` and `allowNavigation`.

---

## 2. Install Capacitor + scaffold android/

From the project root:

```bash
bash scripts/cap-android-setup.sh
```

What this does:

1. Installs `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`,
   and the splash + status-bar + app plugins
2. Runs `npx cap add android` (creates the `android/` Gradle project,
   skipped on re-runs)
3. Confirms the `public-shell/` offline page exists
4. `npx cap sync android` - copies config + plugins into the native project

After it finishes you'll have a real Android Studio project under
`android/`.

---

## 3. App identity (name, package, version)

Open `android/app/build.gradle` and confirm:

```gradle
android {
  namespace "com.kaizen.sys"          // matches capacitor.config.ts appId
  defaultConfig {
    applicationId "com.kaizen.sys"
    versionCode 1                     // bump for every Play Store upload
    versionName "1.0.0"
  }
}
```

App display name lives in `android/app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">KAIZEN</string>
<string name="title_activity_main">KAIZEN</string>
```

Both should already say KAIZEN because of `appName` in
`capacitor.config.ts`, but verify after `cap sync`.

---

## 4. Icons + splash screen

Capacitor doesn't auto-generate launcher icons. Use the official asset
generator:

```bash
npm install --save-dev @capacitor/assets
```

Create source files:

- `assets/icon.png` - 1024x1024 transparent or solid (your KAIZEN logo)
- `assets/icon-foreground.png` - 1024x1024 (logo only, will be masked)
- `assets/icon-background.png` - 1024x1024 solid `#050505`
- `assets/splash.png` - 2732x2732 (logo centered on `#050505`)
- `assets/splash-dark.png` - same as above (we're dark-only)

Generate all densities:

```bash
npx capacitor-assets generate --android
```

This writes adaptive launcher icons to
`android/app/src/main/res/mipmap-*` and the splash drawables into
`android/app/src/main/res/drawable-*`.

---

## 5. Internet + display permissions

`android/app/src/main/AndroidManifest.xml` should already include
`<uses-permission android:name="android.permission.INTERNET" />` from
the Capacitor template. If you removed it, add it back. No other
permissions are needed for the WebView shell.

For full-screen "no browser feel":

`android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBar" parent="Theme.MaterialComponents.DayNight.NoActionBar">
  <item name="windowActionBar">false</item>
  <item name="windowNoTitle">true</item>
  <item name="android:background">@color/colorPrimaryDark</item>
</style>
```

`android/app/src/main/res/values/colors.xml`:

```xml
<color name="colorPrimary">#050505</color>
<color name="colorPrimaryDark">#050505</color>
<color name="colorAccent">#D00000</color>
```

These match the web theme (#050505 obsidian + #D00000 blood).

---

## 6. Routing - Capacitor + Next.js routing

Because `server.url` is set, the WebView treats your remote site like a
normal browser tab. Next.js client routing (`Link`, `router.push`) works
out of the box. The hardware back button is wired by `@capacitor/app` -
no extra code needed.

Optional: handle deep back-button behavior manually:

```ts
// somewhere in a top-level client component
useEffect(() => {
  const sub = App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.exitApp();
  });
  return () => { sub.remove(); };
}, []);
```

(You only need this if you want fine-grained control. The default is
fine for KAIZEN.)

---

## 7. Test on a device

```bash
# Plug in an Android phone with USB debugging enabled, then:
npx cap run android
# Or open Android Studio and hit Run:
npx cap open android
```

The first launch downloads Gradle dependencies (~5 minutes).
Subsequent runs are seconds.

Inside Android Studio:
- Build > Make Project
- Run > Run 'app'
- Choose your device
- App opens, shows splash, then your live KAIZEN site

---

## 8. Build a release APK / AAB for Play Store

### Generate a signing key (one-time)

```bash
keytool -genkey -v \
  -keystore ~/keystores/kaizen-release.keystore \
  -alias kaizen \
  -keyalg RSA -keysize 2048 -validity 10000
```

Save the output password somewhere safe (1Password, etc).

### Wire it into Gradle

Create `android/keystore.properties` (DO NOT commit):

```
storeFile=/Users/you/keystores/kaizen-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=kaizen
keyPassword=YOUR_KEY_PASSWORD
```

Edit `android/app/build.gradle`, inside `android { ... }`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
  keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

signingConfigs {
  release {
    keyAlias keystoreProperties["keyAlias"]
    keyPassword keystoreProperties["keyPassword"]
    storeFile file(keystoreProperties["storeFile"])
    storePassword keystoreProperties["storePassword"]
  }
}

buildTypes {
  release {
    signingConfig signingConfigs.release
    minifyEnabled true
    shrinkResources true
    proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
  }
}
```

Add `android/keystore.properties` to `.gitignore`.

### Build commands

```bash
cd android

# Debug build (sideload-able .apk):
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (signed):
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Release AAB - what Play Store actually wants:
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

The .aab is what you upload to the Play Console. Google generates
device-specific APKs from it server-side.

---

## 9. Play Store submission (high level)

1. Create a Play Console developer account ($25 one-time)
2. Create app -> Internal testing track first
3. Upload `app-release.aab`
4. Fill in store listing (KAIZEN logo, screenshots from a Pixel emulator,
   privacy policy URL, content rating questionnaire)
5. Promote internal -> closed -> open -> production once stable

---

## 10. Re-syncing after web changes

You don't need to rebuild the APK every time you edit Next.js code -
the WebView loads the live URL. Just deploy the web app. Only rebuild
the APK when you change:

- `capacitor.config.ts`
- Native Android code or assets
- App icon, splash, name
- Capacitor plugins or dependencies
- `versionCode` / `versionName` (required for any Play Store update)

To sync after a config change:

```bash
npx cap sync android
```

---

## Notes + caveats

- The shell requires internet on first launch; the offline page in
  `public-shell/index.html` shows briefly then reloads when network
  returns.
- iOS works the same way (`npx cap add ios`) but needs a Mac + Xcode.
- The Supabase project's allowed origins must include your web domain;
  the WebView sends the same `Origin` header as a browser.
- Tap-to-call / SMS links (`tel:`, `sms:`) need additional intent
  configuration in `AndroidManifest.xml` if you ever add them.
