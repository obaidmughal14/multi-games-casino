# Deployment - HuggingFace Space, GitHub Pages, and the Android APK

Everything here is free to build and run. There is no server code, no
database, and no build step for the website: the game is one HTML file
plus a manifest and icons, served as static files.

Live website: https://obaidasiaone-multi-games-casino.static.hf.space

## Files the website needs

Upload or serve these files together, in one folder, with these exact
names:

| File | Required | Notes |
|---|---|---|
| `index.html` | Yes | The whole game |
| `manifest.json` | Yes, for install | Names the icons below; without it, install-as-app does not appear |
| `icon-192.png` | Yes, for install | 192 x 192 app icon |
| `icon-512.png` | Yes, for install | 512 x 512 app icon |
| `icon-maskable-512.png` | Yes, for install | 512 x 512 maskable icon with safe-zone padding |
| `apple-touch-icon.png` | Recommended | 180 x 180 icon for iOS home screen |

If the icons are missing, the game still plays, but phones will not
offer a proper install prompt and the home screen icon will be wrong.
Regenerate them any time with:

```sh
pip install pillow
python3 tools/make_icons.py
```

Run from the repo root. The script writes the four icons into the
current folder (pass `--out <folder>` to write elsewhere). See
`tools/make_icons.py` for details.

## Option 1: HuggingFace Static Space (the live site)

The live site runs as a free HuggingFace Static Space named
`obaidasiaone/multi-games-casino` with `sdk: static`. To recreate it or
update it:

1. Sign in to HuggingFace and create a new Space. Choose the Static SDK
   (the SDK called "static"). Pick a name; the live URL follows the
   pattern `https://<owner>-<space-name>.static.hf.space`.
2. In the Space, add a `README.md` whose first lines are exactly this
   frontmatter, with your own title if you rename the Space:

   ```yaml
   ---
   title: Multi Games Casino
   emoji: 🎰
   colorFrom: yellow
   colorTo: green
   sdk: static
   pinned: false
   ---
   ```

   The `sdk: static` line is what makes HuggingFace serve the files as
   a static site. `colorFrom` and `colorTo` must use colors from
   HuggingFace's allowed palette; yellow and green are accepted.
3. Upload `index.html`, `manifest.json` and the four icon files into
   the Space (web upload, or `git push` to the Space repo, or the
   HuggingFace Hub upload tools). Keep the file names exactly as
   listed above, in the Space root. Also upload `Casino_Games_v1.apk`
   (built from `android/`, see the APK section below) into the Space
   root: the Install screen links to it for the Android direct
   download, and it is not part of the text-only GitHub push.
4. Wait for the Space to build, then open the Space URL and check: the
   lobby loads, a casino game opens and plays, a mind game opens, the
   Install app screen appears, and House Stats shows on the lobby.
5. To update the live site, replace `index.html` (and any changed icons
   or manifest) in the Space and wait for the rebuild. There is no
   separate build step.

Notes:

- The Space README is separate from this repo's `README.md`. The Space
  needs the frontmatter above; this repo's README is the GitHub
  documentation and has no frontmatter.
- HuggingFace serves the site over HTTPS, which the install prompt and
  manifest require.
- The Space holds only the website files. It does not need the
  `android/` folder, the `docs/` folder or the `tools/` folder.

## Option 2: GitHub Pages

The same files deploy to GitHub Pages from this repo, free:

1. Make sure the repo has `index.html`, `manifest.json` and the four
   icon files at the repo root. Note: the first GitHub push of this
   repo used a text-only route that could not carry the PNG icons, so
   if the icons are missing from GitHub, add them through a normal
   `git push` or the GitHub web upload, or regenerate them locally
   with `tools/make_icons.py` and then push them.
2. On GitHub, open the repo, then Settings, then Pages.
3. Under Build and deployment, choose Deploy from a branch, branch
   `main`, folder `/ (root)`, and save.
4. Wait for the Pages build, then open the published URL shown on the
   Pages settings screen. It follows the pattern
   `https://<owner>.github.io/<repo>/`.
5. Check the same things as the Space checklist above: lobby, one
   casino game, one mind game, install screen, House Stats.

GitHub Pages serves over HTTPS, so install-as-app works the same way.
Any other static host (Netlify Drop, Cloudflare Pages, Firebase
Hosting, a plain web server) works the same way: serve the folder,
keep the file names, use HTTPS for install features.

## Option 3: Android APK (WebView wrapper)

The `android/` folder is a minimal native Android app: one WebView that
loads only the live site URL. No dependencies, no tracking SDKs, no
ads, no payments. Game progress, profiles and the fun-credit balance
live in WebView localStorage on the device.

App details:

- Package: `com.multigamescasino.app`
- App name: Casino Games
- Version: 1.0 (versionCode 1)
- Min Android: 7.0 (API 24), target API 34, compile SDK 34
- Permissions: Internet, view network state
- Toolchain: Gradle 8.5, Android Gradle Plugin 8.2.2, JDK 17

### Prerequisites

- JDK 17 (Gradle 8.5 with Android Gradle Plugin 8.2.2 requires it).
- Android SDK with platform 34 (`platforms;android-34`) and
  build-tools 34.0.0. Set the SDK location in
  `android/local.properties` with a line like
  `sdk.dir=/path/to/Android/Sdk`, or set the `ANDROID_HOME`
  environment variable. `local.properties` is machine-specific and is
  excluded by `.gitignore`; never commit it.
- A Gradle install, or the wrapper (see the wrapper jar note below).

### Restore the wrapper jar and launcher icons

Two binary pieces are not in the GitHub push (text-only push route) and
must be restored locally before building:

1. **Gradle wrapper jar.** Restore it with a Gradle 8.5 install:

   ```sh
   cd android
   gradle wrapper --gradle-version 8.5
   ```

   Or copy `gradle-wrapper.jar` from a Gradle install into
   `android/gradle/wrapper/`. The wrapper properties file, which pins
   Gradle 8.5, is already in the repo.
2. **Launcher icons.** Regenerate the 15 mipmap PNGs from the same
   original chip-and-star art:

   ```sh
   pip install pillow
   python3 tools/make_android_icons.py
   ```

   Run from the repo root. The script writes into
   `android/app/src/main/res/mipmap-*/`. The adaptive-icon XML files
   and the background color are already in the repo.

Also restore the execute bit on the wrapper script after checkout,
because snapshot pushes do not preserve file modes:

```sh
chmod +x android/gradlew
```

### Debug build (no keystore needed)

```sh
cd android
./gradlew assembleDebug
```

The APK lands at `app/build/outputs/apk/debug/app-debug.apk`. Install
it on a phone or emulator to test. A debug build is not signed with
the release key and must not be distributed as an update to the
release app.

### Release build (signed, needs your own keystore)

Release signing reads `android/keystore/keystore.properties`, which is
local only and never committed. The build file loads it only if the
file exists; without it, a release build is unsigned.

To create a keystore and properties file on the build machine only:

```sh
cd android
mkdir -p keystore
keytool -genkeypair -v -keystore keystore/casino-release.keystore \
  -alias casino -keyalg RSA -keysize 2048 -validity 10000
```

Then create `android/keystore/keystore.properties` with your own
values (placeholders shown; never share the real file):

```properties
storeFile=keystore/casino-release.keystore
storePassword=<your-store-password>
keyAlias=casino
keyPassword=<your-key-password>
```

Then build:

```sh
./gradlew assembleRelease
```

The signed APK lands at
`app/build/outputs/apk/release/app-release.apk`.

**Keystore backup warning.** Keep a backup of the keystore file and its
passwords in a safe private place. The same key must sign every future
update, or Android will refuse to update the installed app and users
will have to uninstall and reinstall, losing local progress. Never
commit the keystore, the properties file, or the passwords to git,
never email them, and never paste them into docs or chat.
`.gitignore` excludes `keystore/`, `*.jks`, `*.keystore` and
`keystore.properties` at every depth.

### Install the APK on a phone

1. Copy the APK to the phone (USB, file share, or download link).
2. Open the APK file on the phone and allow Install unknown apps for
   the app that opens it, when Android asks.
3. Open Casino Games. It needs internet access to load the games. With
   no connection it shows a Retry screen.
4. To update, install a newer APK signed with the same release key over
   the old one. Local progress in WebView storage is kept on update.

### Change the site URL or version

- **Site URL:** edit the `GAME_URL` constant in
  `android/app/src/main/java/com/multigamescasino/app/MainActivity.java`
  and rebuild. Keep it HTTPS.
- **Version:** edit `versionCode` and `versionName` in
  `android/app/build.gradle`. Raise `versionCode` by 1 for every
  release, or Android will treat the new APK as the same version.

### What the APK is not

The APK is not a Play Store listing. Publishing to Google Play needs a
developer account, store packaging, a privacy policy, content rating
and review, and gambling-style apps face extra store rules including
licence checks in many countries. No store submission is included in
this repo, and no approval is promised. The APK here is for direct
install (sideloading) only.
