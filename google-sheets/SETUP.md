# Avani AI → Google Sheets signup tracking

The current Avani frontend uses a local profile flow. This integration records a new first-time profile (name/email) in a private Google Sheet after the user confirms the signup-data notice.

## 1. Create the Sheet

Create a Google Sheet, for example `Avani AI Users`.

## 2. Add Apps Script

Open **Extensions → Apps Script** in that Sheet and paste the contents of `google-sheets/Code.gs`.

## 3. Set the webhook secret

In Apps Script, open **Project Settings → Script Properties** and create:

- Property: `AVANI_WEBHOOK_SECRET`
- Value: a long random secret that you will also put into Render.

Do not put this secret in GitHub or frontend JavaScript.

## 4. Deploy the script

Use **Deploy → New deployment → Web app**.

Set it to execute as the spreadsheet owner and allow access according to your Google account's available web-app options. Copy the generated `/exec` URL.

## 5. Add Render environment variables

In the Render service running Avani AI, add:

- `SHEETS_WEBHOOK_URL` = your Apps Script `/exec` URL
- `SHEETS_WEBHOOK_SECRET` = exactly the same secret as the Apps Script property

Then redeploy the backend.

## 6. Test

Open Avani AI in a private/incognito browser window, create a profile, tick the signup-data notice, and continue.

A new row should appear in the `Signups` sheet with:

`Timestamp | Name | Email | User ID | Provider | Source`

### Important

This phase tracks the existing local-profile registration flow. It is **not yet Firebase Authentication**. For real Google/email accounts with persistent user IDs, connect Firebase Authentication next and send the Firebase UID/provider to `/api/signup`. Firebase's web SDK supports email/password and federated sign-in methods.
