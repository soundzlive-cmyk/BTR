# Connect the BTR website forms to Google Sheets (≈10 minutes)

Do this signed in to the BTR Google Workspace account (e.g. info@breakingthroughroadblocks.org).

1. **Create the sheet** – Go to sheets.new and name it `BTR Website Forms`.
2. **Add the script** – Extensions → Apps Script. Delete the sample code, paste all of `Code.gs`, click Save.
3. **Create the tabs** – In the function dropdown pick `setup`, click Run, and approve the permissions
   (Sheets, Drive for signature images, Mail for alerts). Four tabs appear: Contact, Event Registration,
   Event Sign-in, TARGETS Intake. You can delete the default "Sheet1".
4. **Deploy** – Deploy → New deployment → gear icon → Web app.
   - Execute as: **Me**
   - Who has access: **Anyone**  (required so website visitors can submit; they can't see the sheet)
   - Click Deploy and copy the **Web app URL** (ends in `/exec`).
5. **Connect the website** – Open `forms-config.js` in the site folder and replace
   `PASTE_YOUR_WEB_APP_URL_HERE` with that URL. Commit and push to GitHub.
6. **Test** – Submit each form once on the live site and confirm a row lands in each tab.

## Later changes
- Edited `Code.gs`? Deploy → Manage deployments → pencil → Version: **New version** → Deploy.
  This keeps the same URL, so the website needs no change.
- Email alerts go to `NOTIFY_EMAIL` at the top of `Code.gs`; set it to `''` to turn them off.
- Intake signatures are saved as PNGs in the Drive folder "BTR Intake Signatures"; the sheet holds the links.
- The intake form contains minors' medical and contact info — keep the sheet and that folder shared only with
  people who need it.
