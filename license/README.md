# Emboss Lab License Tools

This folder contains the offline license generator.

## First setup

```powershell
npm run license:keygen
```

Keep `license/private-key.pem` secret. Do not ship it and do not commit it.
The desktop app only needs `license/public-key.pem`.

## Generate a license

```powershell
npm run license:generate -- email=user@example.com
```

Optional fields:

```powershell
npm run license:generate -- email=user@example.com app=emboss-lab edition=pro expires=2027-12-31
```

Use `app=*` if a code should activate multiple tools that share the same public key.

## Local admin app

```powershell
npm run license:admin
```

This opens a local desktop generator with fields for email, app, edition, and expiry.
It uses `private-key.pem` on this machine and does not package the private key into customer apps.

If PowerShell blocks `npm.ps1`, run:

```powershell
npm.cmd run license:admin
```

Or double-click `License Admin.cmd` from the project folder.
