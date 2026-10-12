BTR WEBSITE — COMPLETE UPDATED FILES

This package contains all 23 pages, styles, scripts, logos, photos, and other assets.
Includes the donation support page, TARGETS intake form, and latest proofreading corrections.

INSTALL ON WINDOWS
1. Download this ZIP.
2. Extract ALL contents directly into C:\projects\BTR. Allow replacement of previous website files.
3. index.html must be directly in C:\projects\BTR, with the assets folder beside it.

PowerShell alternative (adjust the ZIP path to where you downloaded it):
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\BTR_Website_Files_Updated.zip" -DestinationPath 'C:\projects\BTR' -Force

LOCAL PREVIEW
Open a terminal in C:\projects\BTR and run:
python -m http.server 8000
Then open http://localhost:8000.
This is a static site; no npm build is required.

LIVE WEBSITE
https://btr-community.redcow.chatgpt.site

SERVICE CONNECTIONS
The donation meter requests https://thesoe2.net/BTR/api.php; if unavailable,
it displays the dated last-verified amount and links to the original tracker.
Intake submits via POST to https://thesoe2.net/Targets/submit.php.
Other registration, payment, and subscription actions retain their external links.
Backend delivery has not been tested by submitting a registration.
Draft intake information is saved only when a visitor chooses Save draft.
