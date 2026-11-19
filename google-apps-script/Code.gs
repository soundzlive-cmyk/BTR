/**
 * BTR website forms → Google Sheets
 *
 * One web app receives every form on breakingthroughroadblocks.org and
 * appends each submission to its own tab:
 *   Contact | Event Registration | Event Sign-in | TARGETS Intake
 *
 * Intake signatures are saved as PNG files in a Drive folder; the sheet
 * stores a link (signature images are too large for a sheet cell).
 *
 * Setup: see SETUP.md in this folder.
 */

// ---- Settings -------------------------------------------------------------
const NOTIFY_EMAIL = 'dambroise@breakingthroughroadblocks.org'; // '' to turn off email alerts
const SIGNATURE_FOLDER_NAME = 'BTR Intake Signatures';

const FORMS = {
  contact: {
    sheet: 'Contact',
    fields: ['firstName', 'lastName', 'email', 'phone', 'interest', 'comments'],
    message: 'Thank you! Your message has been sent.'
  },
  event_register: {
    sheet: 'Event Registration',
    fields: ['event', 'firstName', 'lastName', 'email', 'phone', 'company', 'role'],
    message: 'Thank you for registering! We look forward to seeing you.'
  },
  event_signin: {
    sheet: 'Event Sign-in',
    fields: ['event', 'otherEvent', 'firstName', 'lastName', 'email', 'phone',
             'firstTime', 'heardFrom', 'interests[]', 'comments'],
    message: 'You’re signed in. Thank you for joining us!'
  },
  intake: {
    sheet: 'TARGETS Intake',
    fields: ['participantName', 'dob', 'age', 'grade', 'isUnder18', 'isUnder18Computed',
             'guardianName', 'guardianPhone', 'guardianEmail',
             'riskAck', 'emergencyName', 'emergencyPhone', 'medicalNeeds',
             'confAck', 'mediaRelease',
             'checkinTime', 'checkinImprove', 'checkinStress', 'checkinSupport',
             'parentEnjoy', 'parentStruggle', 'parentContact', 'parentFocus',
             'guardianSigName', 'guardianSigDate', 'sigGuardian',
             'participantSigName', 'participantSigDate', 'sigParticipant'],
    signatures: ['sigGuardian', 'sigParticipant'],
    message: 'Thank you! Your T.A.R.G.E.T.S. intake form has been received.'
  }
};

// ---- Web app entry points -------------------------------------------------
function doPost(e) {
  try {
    const p = (e && e.parameters) || {};
    const val = k => (p[k] || []).map(String).join(', ').trim();

    if (val('website')) return json({ ok: true, message: 'Thank you!' }); // honeypot: silently drop bots

    const type = val('formType');
    const form = FORMS[type];
    if (!form) return json({ ok: false, message: 'Unknown form.' });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet(form);
      const row = [new Date()].concat(form.fields.map(f => {
        let v = val(f);
        if (form.signatures && form.signatures.includes(f)) v = saveSignature(v, f, val('participantName'));
        return safe(v);
      }));
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    notify(form, type, p);
    return json({ ok: true, message: form.message });
  } catch (err) {
    console.error(err);
    return json({ ok: false, message: 'Something went wrong saving your submission.' });
  }
}

function doGet() {
  return json({ ok: true, message: 'BTR forms endpoint is running.' });
}

// ---- Helpers --------------------------------------------------------------
function getSheet(form) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(form.sheet);
  if (!sheet) {
    sheet = ss.insertSheet(form.sheet);
    sheet.appendRow(['Submitted'].concat(form.fields.map(f => f.replace('[]', ''))));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, form.fields.length + 1).setFontWeight('bold');
  }
  return sheet;
}

// Stops formula injection (values starting with = + - @ run as formulas in Sheets).
function safe(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function saveSignature(dataUrl, field, name) {
  const prefix = 'data:image/png;base64,';
  if (!dataUrl || dataUrl.indexOf(prefix) !== 0) return '';
  const blob = Utilities.newBlob(Utilities.base64Decode(dataUrl.slice(prefix.length)), 'image/png',
    `${(name || 'participant').replace(/[^\w\- ]/g, '')} - ${field} - ${new Date().toISOString()}.png`);
  const folders = DriveApp.getFoldersByName(SIGNATURE_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(SIGNATURE_FOLDER_NAME);
  return folder.createFile(blob).getUrl();
}

function notify(form, type, p) {
  if (!NOTIFY_EMAIL) return;
  try {
    const name = [p.firstName, p.lastName].join(' ').trim() || (p.participantName || '');
    const ssUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
    MailApp.sendEmail(NOTIFY_EMAIL, `New website submission: ${form.sheet}${name ? ' – ' + name : ''}`,
      `A new "${form.sheet}" submission was received on the BTR website.\n\nView it here: ${ssUrl}`);
  } catch (err) {
    console.warn('Email notification failed: ' + err);
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to create all tabs and grant permissions. */
function setup() {
  Object.values(FORMS).forEach(getSheet);
  const folders = DriveApp.getFoldersByName(SIGNATURE_FOLDER_NAME);
  if (!folders.hasNext()) DriveApp.createFolder(SIGNATURE_FOLDER_NAME);
}
