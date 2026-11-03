# ENT Atlas (Android)

Personal ENT head & neck anatomy study app. Offline Android app built automatically by GitHub Actions.

**Install:** open the latest release under **Releases**, download `ENT-Atlas.apk` on your phone and open it.

Includes a practical bones section (skull, mandible, hyoid and cervical spine) and a test lab.

Private: contains copyrighted handout figures for personal study only.

- Web app: `app/src/main/assets/www/`
- Android wrapper: `app/src/main/java/com/omar/entatlas/MainActivity.java`
- Build: `.github/workflows/build.yml`

## iPhone / web version (Cloudflare Pages)

- Build command: `mkdir -p dist && cp -r app/src/main/assets/www/. dist/ && cp -r web/. dist/`
- Build output directory: `dist`
