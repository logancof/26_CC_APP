# Community Camp Hub Apps Script

`Code.js` is the local reference copy of the Google Apps Script code used by the Community Camp Hub Google Sheets backend.

Workflow:

1. Update and review `apps-script/Code.js` locally.
2. Run a syntax check before copying it into Google Apps Script.
3. Paste the full contents of `Code.js` into the Apps Script editor.
4. Deploy the Apps Script web app when backend behavior changes.

Secrets and API credentials should stay in Apps Script Project Settings as Script Properties, not in this file.
