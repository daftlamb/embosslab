# Emboss Lab macOS Packaging

This repository includes the files needed to build the macOS desktop package from a Mac.

## Build on macOS

```bash
npm install
npm run build:mac
```

The output will be written to `dist/`.

## Notes

- The app embeds only `license/public-key.pem`.
- Keep `license/private-key.pem` local and do not commit it.
- For public distribution outside direct sharing, sign and notarize the app on macOS with an Apple Developer ID.
