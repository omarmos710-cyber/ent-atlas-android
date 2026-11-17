# The ENT Companion

Offline ENT study notes, quizzes, and clinical, imaging, and surgical reference material for residents.

## Android

Download `ENT-Companion.apk` from [GitHub Releases](https://github.com/omarmos710-cyber/ent-atlas-android/releases). The 2.0 build uses a new signing identity and installs alongside the earlier app. In the earlier app, use **More → Back up my progress**. Install the new app, then use **More → Restore a backup**. Confirm that your progress transferred before removing the old version.

Local debug builds use Java 17, Gradle 8.9, Python 3 and Android SDK 34. Run `gradle :app:assembleDebug`.

The release job uses the repository's `ANDROID_KEYSTORE_BASE64` and `ANDROID_KEYSTORE_PASSWORD` Actions secrets. Use a PKCS#12 keystore with the alias `entcompanion`. Keep the same protected key for subsequent 2.x updates.

## Web

Run `python3 tools/build_public.py web dist` and serve `dist` over HTTPS. Use that same command and output directory for Cloudflare. The release workflow also packages the prepared static site as `ENT-Companion-Web.zip`.

The web app saves its core files automatically. Use **More → Offline downloads** for clinical articles, surgical guides, full search, and printable boards.

## Content and checks

The public build includes the study text, original artwork, and source-attributed surgical photographs. See the [media notes](content/basics/distribution.md) for the distributed collections and [surgical figure credits](content/basics/credits.json) for individual licenses.

Run `node tools/test_smart.js`, `node tools/test_answer.js`, and `node --test tools/test_release.js`. GitHub Actions runs these checks plus the Android build before publishing.
