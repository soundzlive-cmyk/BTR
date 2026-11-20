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

    const type = val('formType');
    if (type === 'pageview') return logPageview(val);
    if (type === 'stats') return statsRequest(val);

    if (val('website')) return json({ ok: true, message: 'Thank you!' }); // honeypot: silently drop bots

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
  getAnalyticsSheet();
  const folders = DriveApp.getFoldersByName(SIGNATURE_FOLDER_NAME);
  if (!folders.hasNext()) DriveApp.createFolder(SIGNATURE_FOLDER_NAME);
}

// ===========================================================================
// Website analytics: page views from analytics.js + the /stats dashboard
// ===========================================================================
const ANALYTICS_SHEET = 'Analytics';
const ANALYTICS_COLS = ['Timestamp', 'Page', 'Title', 'Referrer', 'VisitorId', 'SessionId',
                        'UserAgent', 'Language', 'Screen', 'TimeZone'];
const TZ = 'America/New_York';

function getAnalyticsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ANALYTICS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ANALYTICS_SHEET);
    sheet.appendRow(ANALYTICS_COLS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, ANALYTICS_COLS.length).setFontWeight('bold');
  }
  return sheet;
}

function logPageview(val) {
  const cut = (v, n) => safe(String(v || '').slice(0, n));
  const page = cut(val('page'), 300);
  const vid = cut(val('vid'), 64), sid = cut(val('sid'), 64);
  if (!page || !vid || !sid) return json({ ok: false });
  getAnalyticsSheet().appendRow([new Date(), page, cut(val('title'), 200), cut(val('ref'), 300), vid, sid,
    cut(val('ua'), 400), cut(val('lang'), 20), cut(val('screen'), 20), cut(val('tz'), 60)]);
  return json({ ok: true });
}

// ---- Password-protected stats (breakingthroughroadblocks.org/stats/) ------
// Set the password in Apps Script: Project Settings → Script Properties →
// add property DASHBOARD_PASSWORD. It never appears in the website code.
function statsRequest(val) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('stats_fails') || 0);
  if (fails >= 10) return json({ ok: false, message: 'Too many wrong passwords. Try again in 15 minutes.' });
  const pw = PropertiesService.getScriptProperties().getProperty('DASHBOARD_PASSWORD');
  if (!pw) return json({ ok: false, message: 'Dashboard password has not been set up yet.' });
  if (val('password') !== pw) {
    cache.put('stats_fails', String(fails + 1), 900);
    Utilities.sleep(800);
    return json({ ok: false, auth: false, message: 'Incorrect password.' });
  }
  return json({ ok: true, data: getDashboardData(val('days')) });
}

// ---- Aggregation (called from Dashboard.html) -----------------------------
function getDashboardData(days) {
  days = Math.max(1, Math.min(730, Number(days) || 30));
  const sheet = getAnalyticsSheet();
  const n = sheet.getLastRow() - 1;
  const rows = n > 0 ? sheet.getRange(2, 1, n, ANALYTICS_COLS.length).getValues() : [];

  const dayKey = d => Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  const now = new Date();
  const start = new Date(now.getTime() - days * 864e5);
  const prevStart = new Date(start.getTime() - days * 864e5);

  const firstSeen = {};
  rows.forEach(r => { const t = new Date(r[0]); if (!(r[4] in firstSeen) || t < firstSeen[r[4]]) firstSeen[r[4]] = t; });

  const blank = () => ({ hits: 0, sessions: new Set(), visitors: new Set() });
  const cur = blank(), prev = blank();
  const daily = {};
  for (let d = new Date(start); d <= now; d = new Date(d.getTime() + 864e5)) daily[dayKey(d)] = blank();
  daily[dayKey(now)] = daily[dayKey(now)] || blank();

  const tally = () => ({});
  const add = (m, k) => { m[k] = (m[k] || 0) + 1; };
  const browsers = tally(), oses = tally(), devices = tally(), pages = tally(), refs = tally();
  const seenSessUA = {};
  const recent = [];

  rows.forEach(r => {
    const t = new Date(r[0]);
    if (t >= prevStart && t < start) { prev.hits++; prev.sessions.add(r[5]); prev.visitors.add(r[4]); }
    if (t < start) return;
    cur.hits++; cur.sessions.add(r[5]); cur.visitors.add(r[4]);
    const dk = dayKey(t);
    if (daily[dk]) { daily[dk].hits++; daily[dk].sessions.add(r[5]); daily[dk].visitors.add(r[4]); }
    add(pages, r[1]);
    const ua = parseUA(String(r[6]));
    if (!seenSessUA[r[5]]) { // count browser/OS/device once per visit, not per page
      seenSessUA[r[5]] = 1;
      add(browsers, ua.browser); add(oses, ua.os); add(devices, ua.device);
      add(refs, refHost(String(r[3])));
    }
    recent.push([t.getTime(), r[1], ua.browser, ua.os, ua.device]);
  });

  const newVisitors = [...cur.visitors].filter(v => firstSeen[v] >= start).length;
  const top = (m, k) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, k || 10);
  const pack = s => ({ hits: s.hits, visits: s.sessions.size, uniques: s.visitors.size });

  return {
    days, generated: now.getTime(),
    totals: Object.assign(pack(cur), { newVisitors }),
    previous: pack(prev),
    daily: Object.keys(daily).sort().map(k => Object.assign({ date: k }, pack(daily[k]))),
    browsers: top(browsers), os: top(oses), devices: top(devices),
    pages: top(pages, 12), referrers: top(refs),
    recent: recent.sort((a, b) => b[0] - a[0]).slice(0, 25)
  };
}

function refHost(ref) {
  if (!ref) return 'Direct / none';
  const m = ref.match(/^https?:\/\/([^\/?#]+)/i);
  let h = m ? m[1].toLowerCase().replace(/^www\.|^m\.|^l\.|^lm\./, '') : ref;
  if (/google\./.test(h)) return 'Google';
  if (/facebook\.com|fb\.me/.test(h)) return 'Facebook';
  if (/instagram\.com/.test(h)) return 'Instagram';
  if (/bing\.com/.test(h)) return 'Bing';
  if (/t\.co$|twitter\.com|x\.com/.test(h)) return 'X / Twitter';
  if (/linkedin\.com|lnkd\.in/.test(h)) return 'LinkedIn';
  return h;
}

function parseUA(ua) {
  let browser = 'Other';
  if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = 'Facebook app';
  else if (/Instagram/.test(ua)) browser = 'Instagram app';
  else if (/Edg(e|A|iOS)?\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/CriOS|Chrome\//.test(ua)) browser = 'Chrome';
  else if (/FxiOS|Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = 'Safari';
  let os = 'Other';
  if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  let device = 'Desktop';
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = 'Tablet';
  else if (/Mobi|iPhone|iPod|Android/.test(ua)) device = 'Mobile';
  return { browser, os, device };
}
