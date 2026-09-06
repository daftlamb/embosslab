# Emboss Lab macOS Packaging

This repository includes the files needed to build the macOS desktop package from a Mac.

## Build on macOS

```bash
npm install
npm run build:mac
```

The output will be written to `dist/`.

## Notarized Mac Builds

Create the local Keychain profile once:

```bash
xcrun notarytool store-credentials embosslab-notary --team-id AC8ABF9K2Q
```

Use an Apple ID that belongs to the Apple Developer team and paste an
app-specific password when prompted. The password is stored in macOS Keychain,
not in this repository.

Then build notarized packages:

```bash
npm run build:mac:x64:notarized
npm run build:mac:universal:notarized
```

The notarization step is active only when the `embosslab-notary` Keychain
profile exists. Successful builds print `notarization successful`.

## Notes

- The app embeds only `license/public-key.pem`.
- Keep `license/private-key.pem` local and do not commit it.
- For public distribution outside direct sharing, sign and notarize the app on macOS with an Apple Developer ID.
