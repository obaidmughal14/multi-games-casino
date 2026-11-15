# Casino Games - Android app

Free fun-credit casino wrapper. 169 original games: 119 casino games and
50 free mind games. Fun credits only, no real money, no payments, no ads,
no tracking, no addiction hooks.

The app is a minimal native WebView wrapper. It loads only this live site:

https://obaidasiaone-multi-games-casino.static.hf.space

Profiles, fun-credit balance, missions and best scores are stored in
WebView localStorage on the device. No data leaves the device except the
request to load the game site.

## Build

Requirements: JDK 17, Android SDK with platform 34 and build-tools 34.0.0,
Gradle 8.5 with Android Gradle Plugin 8.2.2.

Before the first build after a fresh checkout, restore the two binary
pieces that a text-only push cannot carry (see `../docs/DEPLOYMENT.md`
for the full steps):

```sh
gradle wrapper --gradle-version 8.5
python3 ../tools/make_android_icons.py
chmod +x gradlew
```

Then:

```sh
./gradlew assembleRelease
```

The signed release APK lands at:

```
app/build/outputs/apk/release/app-release.apk
```

A debug build (`./gradlew assembleDebug`) works without any keystore.

## Signing

Release signing reads `keystore/keystore.properties` (local only, never
committed). The keystore itself lives in `keystore/`, excluded by the
repo `.gitignore`. Keep a backup of the keystore file: the same key must
sign every future update, or Android will refuse to update the installed
app. Never commit, email or paste the keystore or its passwords.

To make a new keystore on the build machine only:

```sh
keytool -genkeypair -v -keystore keystore/casino-release.keystore \
  -alias casino -keyalg RSA -keysize 2048 -validity 10000
```

## Install on a phone

Copy the APK to the phone, open it, and allow "Install unknown apps" for
the app that opens it when Android asks. The app needs internet access to
load the games. If there is no connection, it shows a Retry screen.

## App details

- Package: com.multigamescasino.app
- App name: Casino Games
- Version: 1.0 (versionCode 1)
- Min Android: 7.0 (API 24), target API 34
- Permissions: Internet, view network state
- Launcher icons: generated from the original chip-and-star art by
  `../tools/make_android_icons.py` in all densities
- Site URL: edit the GAME_URL constant in
  `app/src/main/java/com/multigamescasino/app/MainActivity.java`
