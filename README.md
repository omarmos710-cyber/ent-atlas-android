# ENT Atlas (Android)

Personal ENT head & neck anatomy study app. Offline Android app built automatically by GitHub Actions.

**Install:** open the [latest release](https://github.com/omarmos710-cyber/ent-atlas-android/releases/latest), download `ENT-Atlas.apk` on your phone and open it.

Sources: ENT Steps Anatomy, Dr. Sameh Doss handout, Gray's Atlas of Anatomy (2nd ed.) and Dr. Mohamed El-Fiky's Mini Atlas of Anatomy Part V. Theatre: figures from Myers & Snyderman, Operative Otolaryngology, 3rd ed.

Private: contains copyrighted handout figures for personal study only.

- Web app: `app/src/main/assets/www/`
- Android wrapper: `app/src/main/java/com/omar/entatlas/MainActivity.java`
- Build: `.github/workflows/build.yml`

## iPhone / web version (Cloudflare Pages)

- Build command: `mkdir -p dist && cp -r app/src/main/assets/www/. dist/ && cp -r web/. dist/`
- Build output directory: `dist`
