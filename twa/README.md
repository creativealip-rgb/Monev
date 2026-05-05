# Monev TWA

Trusted Web Activity wrapper for `https://monev.app` intended for Play Store publishing.

## Build

```bash
cd twa
ANDROID_HOME=/usr/lib/android-sdk ANDROID_SDK_ROOT=/usr/lib/android-sdk ./gradlew bundleRelease
```

The Play Store artifact generated for this branch is also copied to:

```text
public/twa/monev-twa-release-signed-1.aab
```

## App Identity

- Package ID: `app.monev.twa`
- Version code: `1`
- Version name: `1`
- Status bar color: `#131313`
- Navigation bar color: `#131313`
- Launch URL: `https://monev.app/`
- Web manifest: `https://monev.app/manifest.json`

## Digital Asset Links

`public/.well-known/assetlinks.json` contains the upload certificate fingerprint used for the locally signed build:

```text
56:30:EC:A2:41:58:CB:53:42:5B:F2:A9:54:B0:E9:A8:FE:1B:B4:85:F1:F4:98:06:19:CE:B0:A1:9F:A3:B2:88
```

After creating the app in Play Console with Play App Signing, add the Play App Signing SHA-256 certificate fingerprint to `public/.well-known/assetlinks.json` and redeploy `monev.app`.

## Signing

The local upload keystore is intentionally not committed. Keep `twa/upload-keystore.jks` backed up securely.
