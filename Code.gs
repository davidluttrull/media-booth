/**
 * ICA Media Booth Sign-Up
 *
 * Back end for the sign-up page (index.html) on GitHub Pages. Students pick a
 * home basketball shift and sign up with their name, grade and school email.
 * One student per shift unless the Spots column says otherwise.
 *
 * Tabs:
 *   Shifts    one row per shift. Edit freely: change times, add rows for
 *             tournament games, set Status to Cancelled or Hidden. Leave
 *             Shift ID blank on a new row and the script fills it in.
 *   Sign-Ups  one row per sign-up, written by the script.
 *   Settings  coordinator, arrive time, allowed email endings, grades.
 *
 * Emails: a confirmation when a student signs up (with an Add to Calendar
 * link and a cancel link), a reminder the afternoon before (daily trigger at
 * 3 PM), and a notice if the coordinator marks a game Cancelled.
 *
 * See SETUP.md for how to deploy it.
 */

const SHIFTS_NAME = 'Shifts';
const SIGNUPS_NAME = 'Sign-Ups';
const SETTINGS_NAME = 'Settings';

const SHIFT_HEADERS = ['Shift ID', 'Date', 'Opponent', 'Shift', 'Games', 'Start', 'Spots', 'Status', 'Notes', 'Students (Filled by Script)'];
const SIGNUP_HEADERS = ['Sign-Up ID', 'Signed Up At', 'Shift ID', 'Date', 'Opponent', 'Shift', 'Name', 'Grade', 'Email',
  'Status', 'Cancelled At', 'Reminder Sent', 'Key'];
const SHIFT_STATUSES = ['Open', 'Cancelled', 'Hidden'];
const ACTIVE = 'Signed Up';
const REMINDER_HOUR = 15;   // the daily reminder run, script time zone
const GAME_HOURS = 1.5;     // rough length of one game, for the calendar link's end time

// [setting, starting value, note]. OWNER means the email of whoever runs setup.
const SETTING_DEFAULTS = [
  ['Coordinator name', '', 'Shown on the page and in emails as the person students contact.'],
  ['Coordinator email', 'OWNER', 'Replies to the emails go here.'],
  ['Arrive minutes early', 30, 'How long before the first game of a shift the student should be in the booth.'],
  ['Allowed email endings', 'indianachristianacademy.org', 'Comma-separated. A student email must end in one of these.'],
  ['Grades', '7, 8, 9, 10, 11, 12', 'Comma-separated. The grade buttons on the page.'],
  ['Late cancel alert (hours)', 24, 'If a student cancels this close to the shift, the coordinator gets an email. Blank turns it off.'],
  ['Sign-up page link', 'https://davidluttrull.github.io/media-booth/', 'Used for the cancel links in emails.'],
  ['Test mode: send all email to', 'OWNER', 'While this has an address, every email goes there instead, saying who it was for. Clear it to go live.'],
];

// 2026-27 home basketball from the ICA calendar (scanned 2026-11-09):
// [date, opponent, shift, games, start, notes]. Three-game days are split:
// Shift 1 is the first two games, Shift 2 the last.
const STARTING_SHIFTS = [
  ['2026-11-10', 'ITOWN', 'All Games', 'JV Boys 6:00 PM', '6:00 PM', ''],
  ['2026-11-13', 'Indy Wildcats', 'Shift 1', 'JH Girls 5:30 PM; JH Boys 6:30 PM', '5:30 PM', ''],
  ['2026-11-13', 'Indy Wildcats', 'Shift 2', 'JV Boys 7:45 PM', '7:45 PM', ''],
  ['2026-11-20', 'ICA Whirlwind Invitational Tournament', 'Times TBA', '', '', 'Day 1. Game times aren\'t on the school calendar yet.'],
  ['2026-11-21', 'ICA Whirlwind Invitational Tournament', 'Times TBA', '', '', 'Day 2. Game times aren\'t on the school calendar yet.'],
  ['2026-11-30', 'Good News', 'All Games', 'JH Boys 6:15 PM; JV Boys 7:15 PM', '6:15 PM', ''],
  ['2026-12-07', 'Emmanuel Wabash', 'All Games', 'JH Boys 5:00 PM; Varsity Boys 6:30 PM', '5:00 PM', ''],
  ['2026-12-08', 'Colonial / Laurel', 'Shift 1', 'Varsity Girls 4:30 PM vs Colonial; JV Boys 6:00 PM vs Laurel', '4:30 PM', ''],
  ['2026-12-08', 'Colonial / Laurel', 'Shift 2', 'Varsity Boys 7:15 PM vs Laurel', '7:15 PM', ''],
  ['2026-12-11', 'Carmel Latin', 'All Games', 'JH Boys 5:00 PM; Varsity Boys 6:00 PM', '5:00 PM', ''],
  ['2026-12-14', 'Columbus', 'All Games', 'JH Boys 5:30 PM; JV Boys 6:30 PM', '5:30 PM', ''],
  ['2026-12-18', 'Heritage Hall', 'Shift 1', 'JH Girls 4:30 PM; Varsity Girls 5:45 PM', '4:30 PM', 'Brass Ball Game'],
  ['2026-12-18', 'Heritage Hall', 'Shift 2', 'Varsity Boys 7:15 PM', '7:15 PM', 'Brass Ball Game'],
  ['2027-01-05', 'King\'s Academy', 'All Games', 'Varsity Girls 5:00 PM; Varsity Boys 7:30 PM', '5:00 PM', ''],
  ['2027-01-11', 'Rooted', 'Shift 1', 'JH Girls 4:30 PM; Varsity Girls 5:30 PM', '4:30 PM', ''],
  ['2027-01-11', 'Rooted', 'Shift 2', 'Varsity Boys 6:45 PM', '6:45 PM', ''],
  ['2027-01-14', 'Fishers', 'All Games', 'JH Girls 4:30 PM; JH Boys 5:30 PM', '4:30 PM', ''],
  ['2027-01-16', 'ICA MS Girls Tournament', 'Times TBA', '', '', 'Game times aren\'t on the school calendar yet.'],
  ['2027-01-19', 'Heritage Hall', 'Shift 1', 'JH Girls 4:30 PM; Varsity Girls 5:45 PM', '4:30 PM', ''],
  ['2027-01-19', 'Heritage Hall', 'Shift 2', 'Varsity Boys 7:00 PM', '7:00 PM', ''],
  ['2027-01-22', 'Crosspointe', 'Shift 1', 'JV Boys 4:30 PM; Varsity Girls 5:45 PM', '4:30 PM', ''],
  ['2027-01-22', 'Crosspointe', 'Shift 2', 'Varsity Boys 7:15 PM', '7:15 PM', ''],
  ['2027-01-25', 'Legacy', 'All Games', 'JV 5:30 PM; Varsity 7:00 PM', '5:30 PM', ''],
  ['2027-01-26', 'Heartland', 'Shift 1', 'JH Boys 4:30 PM; Varsity Girls 5:30 PM', '4:30 PM', ''],
  ['2027-01-26', 'Heartland', 'Shift 2', 'Varsity Boys 7:00 PM', '7:00 PM', ''],
  ['2027-01-28', 'Columbus', 'All Games', 'JV Boys 5:30 PM; Varsity Boys 7:00 PM', '5:30 PM', ''],
  ['2027-01-30', 'ICA JV Boys Basketball Tournament', 'Times TBA', '', '', 'Game times aren\'t on the school calendar yet.'],
  ['2027-02-02', 'Holy Cross', 'All Games', 'JH Girls 5:00 PM; JH Boys 6:00 PM', '5:00 PM', ''],
  ['2027-02-09', 'Calvary', 'All Games', 'JH Boys 5:00 PM; Varsity Boys 6:15 PM', '5:00 PM', ''],
  ['2027-02-16', 'Suburban', 'Shift 1', 'JH Girls 4:30 PM; Varsity Girls 5:45 PM', '4:30 PM', ''],
  ['2027-02-16', 'Suburban', 'Shift 2', 'Varsity Boys 7:15 PM', '7:15 PM', ''],
  ['2027-02-19', 'Tabernacle', 'Shift 1', 'JV Boys 4:30 PM; Varsity Girls 5:45 PM', '4:30 PM', 'Senior Night'],
  ['2027-02-19', 'Tabernacle', 'Shift 2', 'Varsity Boys 7:15 PM', '7:15 PM', 'Senior Night'],
];

/* ---------- Web app ---------- */

/** GET: just says the script is running, to check a deployment in a browser. */
function doGet() {
  return json_({ app: 'Media Booth Sign-Up', status: 'ok' });
}

/** POST from the page, body {action, ...}, sent as plain text with no Google login. */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = String(body.action || '');
    if (action === 'load') return json_(load_(body));
    if (action === 'signupMany') return json_(signupMany_(body));
    if (action === 'signup') return json_(signup_(body));
    if (action === 'cancelLoad') return json_(cancelLoad_(body));
    if (action === 'cancel') return json_(cancel_(body));
    throw new Error('The page asked for something the script doesn\'t know. Reload the page.');
  } catch (err) {
    return json_({ status: 'error', message: err.message });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Everything the page needs: upcoming shifts, how full each is, which are this student's. */
function load_(body) {
  const s = settings_();
  const shifts = readShifts_(true);
  const ups = readSignups_().filter(function (u) { return u.status === ACTIVE; });
  const email = normEmail_(body.email);
  const today = dateKey_(new Date());
  const list = shifts.filter(function (sh) { return sh.status !== 'Hidden' && sh.date >= today; })
    .map(function (sh) {
      const on = ups.filter(function (u) { return u.shiftId === sh.id; });
      const mine = email ? on.filter(function (u) { return u.email === email; })[0] : null;
      return {
        id: sh.id, date: sh.date, opponent: sh.opponent, shift: sh.shift, games: sh.games, start: sh.start,
        arrive: arriveTime_(sh, s), spots: sh.spots, taken: on.length, status: sh.status, notes: sh.notes,
        started: started_(sh), mine: mine ? mine.id : '',
      };
    });
  list.sort(shiftOrder_);
  return {
    status: 'ok', shifts: list, grades: s.grades, endings: s.endings, arriveMinutes: s.arriveMinutes,
    coordinator: { name: s.coordinatorName, email: s.coordinatorEmail },
  };
}

const MAX_PICKS = 40;   // shifts one sign-up can hold

/**
 * Puts a student on one or more shifts. Body {shiftIds, name, grade, email}.
 * Each shift is checked on its own: the open ones are saved even if another
 * was just taken. One confirmation email lists every saved shift.
 * Returns {status:'ok', emailed, results:[{shiftId, status:'ok'|'skipped', id, key, message, shift}]}.
 */
function signupMany_(body) {
  const s = settings_();
  const name = cleanName_(body.name);
  if (!/\S+\s+\S+/.test(name)) throw new Error('Enter your first and last name.');
  const grade = String(body.grade || '').trim();
  if (s.grades.indexOf(grade) < 0) throw new Error('Pick your grade.');
  const email = normEmail_(body.email);
  if (!emailAllowed_(email, s)) throw new Error('Use your school email (ending in @' + s.endings[0] + ').');
  const ids = [];
  (Array.isArray(body.shiftIds) ? body.shiftIds : []).forEach(function (x) {
    x = String(x || '');
    if (x && ids.indexOf(x) < 0) ids.push(x);
  });
  if (!ids.length) throw new Error('Pick at least one shift.');
  if (ids.length > MAX_PICKS) throw new Error('That\'s more than ' + MAX_PICKS + ' shifts. Pick fewer.');

  const results = [];
  const made = [];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const shifts = readShifts_(false);
    const on = readSignups_().filter(function (u) { return u.status === ACTIVE; });
    const props = PropertiesService.getScriptProperties();
    let n = Number(props.getProperty('NEXT_ID') || 1001);
    const rows = [];
    ids.forEach(function (id) {
      const sh = shifts.filter(function (x) { return x.id === id; })[0];
      const here = sh ? on.filter(function (u) { return u.shiftId === sh.id; }) : [];
      let problem = '';
      if (!sh || sh.status === 'Hidden') problem = 'This shift isn\'t on the list anymore.';
      else if (sh.status === 'Cancelled') problem = 'This game was cancelled.';
      else if (started_(sh)) problem = 'This shift has already started.';
      else if (here.some(function (u) { return u.email === email; })) problem = 'You were already signed up for this shift.';
      else if (here.length >= sh.spots) problem = 'Someone else just took this shift.';
      if (problem) {
        results.push({ shiftId: id, status: 'skipped', message: problem, shift: sh ? publicShift_(sh, s) : null });
        return;
      }
      const u = { id: 'S-' + n++, key: Utilities.getUuid().replace(/-/g, '').slice(0, 20), name: name, grade: grade, email: email };
      rows.push([u.id, new Date(), sh.id, dateValue_(sh.date), sh.opponent, sh.shift, name, grade, email, ACTIVE, '', '', u.key]);
      on.push({ shiftId: sh.id, email: email });
      made.push({ sh: sh, u: u });
      results.push({ shiftId: id, status: 'ok', id: u.id, key: u.key, shift: publicShift_(sh, s) });
    });
    if (rows.length) {
      props.setProperty('NEXT_ID', String(n));
      const tab = sheet_(SIGNUPS_NAME);
      tab.getRange(tab.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      refreshStudents_(made.map(function (m) { return m.sh.id; }));
      SpreadsheetApp.flush();
    }
  } finally {
    lock.releaseLock();
  }

  let emailed = made.length > 0;
  if (made.length) {
    try {
      sendConfirm_(s, made);
    } catch (err) {
      emailed = false;
      console.error('Confirmation email failed for ' + email + ': ' + err.message);
    }
  }
  return { status: 'ok', emailed: emailed, results: results };
}

/** One shift, for pages loaded before multi-shift sign-up. Body {shiftId, name, grade, email}. */
function signup_(body) {
  const r = signupMany_({ shiftIds: [body.shiftId], name: body.name, grade: body.grade, email: body.email });
  const x = r.results[0];
  if (x.status === 'ok') return { status: 'ok', id: x.id, key: x.key, emailed: r.emailed, shift: x.shift };
  if (/took/.test(x.message)) return { status: 'full', message: 'Someone just took that shift. Pick another one.' };
  throw new Error(x.message);
}

/** For the cancel link in an email: shows what the student is about to cancel. Body {id, key}. */
function cancelLoad_(body) {
  const s = settings_();
  const u = signupByKey_(body);
  const sh = readShifts_(false).filter(function (x) { return x.id === u.shiftId; })[0];
  return {
    status: 'ok', id: u.id, name: u.name, signupStatus: u.status,
    shift: sh ? publicShift_(sh, s) : { date: u.date, opponent: u.opponent, shift: u.shift, games: [] },
    started: sh ? started_(sh) : true,
    coordinator: { name: s.coordinatorName, email: s.coordinatorEmail },
  };
}

/** Takes a student off a shift. Body {id, key}, the key from their confirmation. */
function cancel_(body) {
  const s = settings_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let u, sh;
  try {
    u = signupByKey_(body);
    if (u.status !== ACTIVE) return { status: 'ok', already: true };
    sh = readShifts_(false).filter(function (x) { return x.id === u.shiftId; })[0];
    if (sh && started_(sh)) {
      throw new Error('This shift has already started, so it can\'t be cancelled here.' +
        (s.coordinatorName ? ' Talk to ' + s.coordinatorName + '.' : ''));
    }
    const tab = sheet_(SIGNUPS_NAME);
    tab.getRange(u.row, SIGNUP_HEADERS.indexOf('Status') + 1, 1, 2).setValues([['Cancelled', new Date()]]);
    refreshStudents_(u.shiftId);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  if (sh && s.lateHours > 0 && s.coordinatorEmail) {
    const at = shiftStart_(sh);
    if (at && at.getTime() - Date.now() < s.lateHours * 3600000) {
      try { sendLateCancel_(s, sh, u); } catch (err) { console.error('Late cancel email failed: ' + err.message); }
    }
  }
  return { status: 'ok' };
}

function signupByKey_(body) {
  const id = String(body.id || '');
  const key = String(body.key || '');
  const u = readSignups_().filter(function (x) { return x.id === id; })[0];
  if (!u || !key || u.key !== key) throw new Error('That cancel link doesn\'t match a sign-up. Check the link in your email.');
  return u;
}

/* ---------- Daily trigger ---------- */

/**
 * Runs every afternoon. Reminds each student signed up for tomorrow, and tells
 * students when the coordinator has marked their game Cancelled.
 */
function dailyEmails() {
  const s = settings_();
  const shifts = readShifts_(false);
  const byId = {};
  shifts.forEach(function (sh) { byId[sh.id] = sh; });
  const tomorrow = dateKey_(new Date(Date.now() + 86400000));
  const today = dateKey_(new Date());
  const tab = sheet_(SIGNUPS_NAME);
  const statusCol = SIGNUP_HEADERS.indexOf('Status') + 1;
  const sentCol = SIGNUP_HEADERS.indexOf('Reminder Sent') + 1;
  let reminded = 0, cancelled = 0;
  readSignups_().forEach(function (u) {
    if (u.status !== ACTIVE) return;
    const sh = byId[u.shiftId];
    if (!sh || sh.date < today) return;
    try {
      if (sh.status === 'Cancelled') {
        sendGameCancelled_(s, sh, u);
        tab.getRange(u.row, statusCol).setValue('Game Cancelled');
        cancelled++;
      } else if (sh.date === tomorrow && !u.reminderSent) {
        sendReminder_(s, sh, u);
        tab.getRange(u.row, sentCol).setValue(new Date());
        reminded++;
      }
    } catch (err) {
      console.error('Email to ' + u.email + ' failed: ' + err.message);
    }
  });
  console.log('Reminders sent: ' + reminded + '. Game-cancelled notices sent: ' + cancelled + '.');
  return { reminded: reminded, cancelled: cancelled };
}

/* ---------- Setup and menu ---------- */

/**
 * Run once from the editor: makes the tabs, fills in this season's shifts and
 * the settings, and starts the daily 3 PM email trigger. Safe to run again; it
 * doesn't overwrite rows that are already there.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const owner = Session.getEffectiveUser().getEmail();

  const shifts = sheetOrMake_(ss, SHIFTS_NAME, SHIFT_HEADERS);
  if (shifts.getLastRow() < 2) {
    const rows = STARTING_SHIFTS.map(function (r) {
      return ['', dateValue_(r[0]), r[1], r[2], r[3], r[4], 1, 'Open', r[5], ''];
    });
    shifts.getRange(2, 6, 400, 1).setNumberFormat('@');   // Start stays text, like "5:30 PM"
    shifts.getRange(2, 2, 400, 1).setNumberFormat('ddd m/d/yyyy');
    shifts.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  shifts.getRange(2, 8, 400, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(SHIFT_STATUSES, true).setAllowInvalid(false).build());
  readShifts_(true);  // fills in the Shift IDs

  const ups = sheetOrMake_(ss, SIGNUPS_NAME, SIGNUP_HEADERS);
  ups.getRange(2, 4, 1000, 1).setNumberFormat('ddd m/d/yyyy');

  const set = sheetOrMake_(ss, SETTINGS_NAME, ['Setting', 'Value', 'Notes']);
  const have = set.getLastRow() > 1 ? set.getRange(2, 1, set.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
  SETTING_DEFAULTS.forEach(function (d) {
    if (have.indexOf(d[0]) < 0) set.appendRow([d[0], d[1] === 'OWNER' ? owner : d[1], d[2]]);
  });

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyEmails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyEmails').timeBased().everyDays(1).atHour(REMINDER_HOUR).create();

  const extra = ss.getSheetByName('Sheet1');
  if (extra && ss.getSheets().length > 1 && extra.getLastRow() === 0) ss.deleteSheet(extra);
  console.log('Setup done. ' + (shifts.getLastRow() - 1) + ' shifts. Daily emails at ' + REMINDER_HOUR + ':00.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Media Booth')
    .addItem('Send Today\'s Emails Now', 'menuDailyEmails')
    .addItem('Refresh Students Column', 'menuRefresh')
    .addToUi();
}

function menuDailyEmails() {
  const r = dailyEmails();
  SpreadsheetApp.getUi().alert('Reminders sent: ' + r.reminded + '\nGame-cancelled notices sent: ' + r.cancelled);
}

function menuRefresh() {
  readShifts_(true);
  refreshStudents_();
}

/* ---------- Sheet helpers ---------- */

function sheet_(name) {
  const tab = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!tab) throw new Error('The ' + name + ' tab is missing. Run setup from the script editor.');
  return tab;
}

function sheetOrMake_(ss, name, headers) {
  let tab = ss.getSheetByName(name);
  if (!tab) tab = ss.insertSheet(name);
  if (tab.getLastRow() === 0) {
    tab.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold')
      .setBackground('#172233').setFontColor('#FFFFFF');
    tab.setFrozenRows(1);
  }
  return tab;
}

/** Reads the Shifts tab. With fillIds, gives any row with a date but no Shift ID one, like 2026-11-20-2. */
function readShifts_(fillIds) {
  const tab = sheet_(SHIFTS_NAME);
  const n = tab.getLastRow() - 1;
  if (n < 1) return [];
  const values = tab.getRange(2, 1, n, SHIFT_HEADERS.length).getValues();
  const used = {};
  values.forEach(function (r) { if (r[0]) used[String(r[0]).trim()] = true; });
  const out = [];
  values.forEach(function (r, i) {
    const date = dateKey_(r[1]);
    if (!date) return;
    let id = String(r[0]).trim();
    if (!id && fillIds) {
      let k = 1;
      while (used[date + '-' + k]) k++;
      id = date + '-' + k;
      used[id] = true;
      tab.getRange(i + 2, 1).setValue(id);
    }
    if (!id) return;
    const spots = parseInt(r[6], 10);
    const status = SHIFT_STATUSES.indexOf(String(r[7]).trim()) >= 0 ? String(r[7]).trim() : 'Open';
    out.push({
      row: i + 2, id: id, date: date, opponent: String(r[2]).trim(), shift: String(r[3]).trim() || 'All Games',
      games: String(r[4]).split(';').map(function (g) { return g.trim(); }).filter(String),
      start: timeText_(r[5]), spots: isNaN(spots) ? 1 : Math.max(0, spots), status: status, notes: String(r[8]).trim(),
    });
  });
  return out;
}

function readSignups_() {
  const tab = sheet_(SIGNUPS_NAME);
  const n = tab.getLastRow() - 1;
  if (n < 1) return [];
  const c = function (h) { return SIGNUP_HEADERS.indexOf(h); };
  return tab.getRange(2, 1, n, SIGNUP_HEADERS.length).getValues().map(function (r, i) {
    return {
      row: i + 2, id: String(r[c('Sign-Up ID')]), shiftId: String(r[c('Shift ID')]), date: dateKey_(r[c('Date')]),
      opponent: String(r[c('Opponent')]), shift: String(r[c('Shift')]), name: String(r[c('Name')]),
      grade: String(r[c('Grade')]), email: normEmail_(r[c('Email')]), status: String(r[c('Status')]).trim(),
      reminderSent: r[c('Reminder Sent')], key: String(r[c('Key')]),
    };
  });
}

/** Rewrites the Students column (one shift ID, a list of them, or all) from the active sign-ups. */
function refreshStudents_(shiftIds) {
  const only = shiftIds ? [].concat(shiftIds) : null;
  const tab = sheet_(SHIFTS_NAME);
  const ups = readSignups_().filter(function (u) { return u.status === ACTIVE; });
  const col = SHIFT_HEADERS.length;
  readShifts_(false).forEach(function (sh) {
    if (only && only.indexOf(sh.id) < 0) return;
    const names = ups.filter(function (u) { return u.shiftId === sh.id; })
      .map(function (u) { return u.name + ' (' + u.grade + ')'; }).join(', ');
    tab.getRange(sh.row, col).setValue(names);
  });
}

function settings_() {
  const tab = sheet_(SETTINGS_NAME);
  const map = {};
  if (tab.getLastRow() > 1) {
    tab.getRange(2, 1, tab.getLastRow() - 1, 2).getValues().forEach(function (r) { map[String(r[0]).trim()] = r[1]; });
  }
  const get = function (k) {
    if (k in map) return map[k];
    const d = SETTING_DEFAULTS.filter(function (x) { return x[0] === k; })[0];
    return d && d[1] !== 'OWNER' ? d[1] : '';
  };
  const list = function (v) { return String(v).split(',').map(function (x) { return x.trim(); }).filter(String); };
  const arrive = parseInt(get('Arrive minutes early'), 10);
  const late = parseFloat(get('Late cancel alert (hours)'));
  return {
    coordinatorName: String(get('Coordinator name')).trim(),
    coordinatorEmail: normEmail_(get('Coordinator email')),
    arriveMinutes: isNaN(arrive) ? 30 : arrive,
    endings: list(get('Allowed email endings')).map(function (x) { return x.replace(/^@/, '').toLowerCase(); }),
    grades: list(get('Grades')),
    lateHours: isNaN(late) ? 0 : late,
    pageLink: String(get('Sign-up page link')).trim(),
    testTo: normEmail_(get('Test mode: send all email to')),
  };
}

/* ---------- Dates and times ---------- */

function tz_() { return Session.getScriptTimeZone(); }

/** Any date from the sheet (a Date, "2026-11-20" or "11/20/2026") as "2026-11-20", or '' if it isn't one. */
function dateKey_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  const t = String(v || '').trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + pad2_(m[2]) + '-' + pad2_(m[3]);
  m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return (m[3].length === 2 ? '20' + m[3] : m[3]) + '-' + pad2_(m[1]) + '-' + pad2_(m[2]);
  return '';
}

function pad2_(n) { return ('0' + n).slice(-2); }

/** "2026-11-20" as a Date at midnight in the script's time zone, for writing to the sheet. */
function dateValue_(key) {
  const p = key.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

/** Minutes after midnight from "5:30 PM", "5:30" (no AM/PM: 1 to 7 is PM) or a Sheets time. -1 if none. */
function minutes_(v) {
  if (v instanceof Date && !isNaN(v)) {
    const hm = Utilities.formatDate(v, tz_(), 'H:mm').split(':');
    return Number(hm[0]) * 60 + Number(hm[1]);
  }
  const m = String(v || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/i);
  if (!m) return -1;
  let h = Number(m[1]) % 12;
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'p' || (!ap && h >= 1 && h <= 7)) h += 12;
  return h * 60 + Number(m[2] || 0);
}

function timeText_(v) {
  return clock_(minutes_(v));
}

/** Minutes after midnight as "5:30 PM", or '' for -1. */
function clock_(m) {
  if (m < 0) return '';
  const h = Math.floor(m / 60);
  return (h % 12 || 12) + ':' + pad2_(m % 60) + ' ' + (h < 12 ? 'AM' : 'PM');
}

function shiftStart_(sh) {
  const m = minutes_(sh.start);
  if (m < 0) return null;
  const d = dateValue_(sh.date);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
}

/** True once the first game of the shift has started (or the day is over, when there's no time). */
function started_(sh) {
  const at = shiftStart_(sh);
  if (at) return Date.now() >= at.getTime();
  return dateKey_(new Date()) > sh.date;
}

function arriveTime_(sh, s) {
  const m = minutes_(sh.start);
  return m < 0 ? '' : clock_(Math.max(0, m - s.arriveMinutes));
}

function shiftOrder_(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ma = minutes_(a.start), mb = minutes_(b.start);
  return (ma < 0 ? 9999 : ma) - (mb < 0 ? 9999 : mb) || (a.shift < b.shift ? -1 : 1);
}

function prettyDate_(key) {
  return Utilities.formatDate(dateValue_(key), tz_(), 'EEEE, MMMM d');
}

/* ---------- People ---------- */

function normEmail_(v) { return String(v || '').trim().toLowerCase(); }

function cleanName_(v) { return String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60); }

function emailAllowed_(email, s) {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
  if (!s.endings.length) return true;
  return s.endings.some(function (d) { return email.slice(-(d.length + 1)) === '@' + d || email.slice(-(d.length + 1)) === '.' + d; });
}

/* ---------- Email ---------- */

function publicShift_(sh, s) {
  return {
    id: sh.id, date: sh.date, opponent: sh.opponent, shift: sh.shift, games: sh.games, start: sh.start,
    arrive: arriveTime_(sh, s), notes: sh.notes, calendar: calendarLink_(sh, s),
  };
}

/** Google Calendar "add event" link: from the arrive time to about the end of the last game. */
function calendarLink_(sh, s) {
  const title = 'Media Booth: ICA vs ' + sh.opponent + (sh.shift === 'All Games' ? '' : ' (' + sh.shift + ')');
  let dates;
  const start = minutes_(sh.start);
  const d = sh.date.replace(/-/g, '');
  if (start < 0) {
    const next = new Date(dateValue_(sh.date).getTime() + 36 * 3600000);
    dates = d + '/' + Utilities.formatDate(next, tz_(), 'yyyyMMdd');
  } else {
    const last = sh.games.map(function (g) { const m = g.match(/\d{1,2}:\d{2}\s*[AP]M/i); return m ? minutes_(m[0]) : -1; })
      .reduce(function (a, b) { return Math.max(a, b); }, start);
    const from = Math.max(0, start - s.arriveMinutes);
    const to = Math.min(23 * 60 + 59, last + GAME_HOURS * 60);
    const hm = function (m) { return pad2_(Math.floor(m / 60)) + pad2_(m % 60) + '00'; };
    dates = d + 'T' + hm(from) + '/' + d + 'T' + hm(to);
  }
  const details = (sh.games.length ? sh.games.join('\n') + '\n\n' : '') + 'Indiana Christian Academy media booth.';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) +
    '&dates=' + dates + '&ctz=' + encodeURIComponent(tz_()) + '&details=' + encodeURIComponent(details) +
    '&location=' + encodeURIComponent('Indiana Christian Academy, 432 W 300 N, Anderson, IN 46012');
}

function cancelLink_(s, u) {
  return s.pageLink.replace(/#.*$/, '') + '#cancel=' + encodeURIComponent(u.id) + '.' + encodeURIComponent(u.key);
}

/** One email for everything a student just signed up for. made = [{sh, u}], all the same student. */
function sendConfirm_(s, made) {
  const u0 = made[0].u;
  const first = u0.name.split(' ')[0];
  const one = made.length === 1;
  const parts = ['<p style="margin:0 0 14px">Thanks, ' + esc_(first) + '. You signed up to run the media booth ' +
    (one ? 'for this shift:' : 'for these ' + made.length + ' shifts:') + '</p>'];
  made.forEach(function (m, i) {
    parts.push('<div style="margin-top:' + (i ? 14 : 0) + 'px">' + shiftCard_(m.sh, s) + '</div>');
    if (one) {
      parts.push(button_('Add to Google Calendar', calendarLink_(m.sh, s), true));
    } else {
      parts.push('<div style="margin-top:6px;font-size:14px">' +
        '<a href="' + esc_(calendarLink_(m.sh, s)) + '" style="color:#96282D;font-weight:bold">Add to Google Calendar</a>' +
        ' &nbsp;&middot;&nbsp; <a href="' + cancelLink_(s, m.u) + '" style="color:#5B6577">Cancel this shift</a></div>');
    }
  });
  parts.push('<p style="margin:18px 0 0;font-size:14px;color:#5B6577">You\'ll get a reminder the afternoon before each shift. ' +
    'If you can\'t make one, cancel as early as you can so someone else can take it' +
    (one ? ': <a href="' + cancelLink_(s, u0) + '" style="color:#96282D">cancel my shift</a>.' : '.') + '</p>');
  const sh0 = made[0].sh;
  const subject = one ? 'Media Booth: ' + shortDate_(sh0.date) + ' vs ' + sh0.opponent
    : 'Media Booth: You\'re on ' + made.length + ' shifts';
  send_(s, u0.email, subject, emailHtml_('You\'re on the Media Booth', parts, s));
}

function sendReminder_(s, sh, u) {
  const html = emailHtml_('Media Booth Tomorrow', [
    '<p style="margin:0 0 14px">Hi ' + esc_(u.name.split(' ')[0]) + ', this is your reminder that you\'re running the media booth tomorrow:</p>',
    shiftCard_(sh, s),
    '<p style="margin:18px 0 0;font-size:14px;color:#5B6577">Can\'t make it? ' +
      '<a href="' + cancelLink_(s, u) + '" style="color:#96282D">Cancel your shift</a>' +
      (s.coordinatorName ? ' and let ' + esc_(s.coordinatorName) + ' know' : '') + '.</p>',
  ], s);
  send_(s, u.email, 'Reminder: Media Booth Tomorrow vs ' + sh.opponent, html);
}

function sendGameCancelled_(s, sh, u) {
  const html = emailHtml_('Game Cancelled', [
    '<p style="margin:0 0 14px">Hi ' + esc_(u.name.split(' ')[0]) + ', this game was cancelled, so you\'re off the media booth for it:</p>',
    shiftCard_(sh, s),
    '<p style="margin:18px 0 0;font-size:14px;color:#5B6577">Pick another game on the ' +
      '<a href="' + esc_(s.pageLink) + '" style="color:#96282D">sign-up page</a>.</p>',
  ], s);
  send_(s, u.email, 'Cancelled: ' + shortDate_(sh.date) + ' vs ' + sh.opponent, html);
}

function sendLateCancel_(s, sh, u) {
  const html = emailHtml_('Late Cancellation', [
    '<p style="margin:0 0 14px">' + esc_(u.name) + ' (grade ' + esc_(u.grade) + ', ' + esc_(u.email) +
      ') just cancelled this media booth shift. It\'s open again on the sign-up page:</p>',
    shiftCard_(sh, s),
  ], s);
  send_(s, s.coordinatorEmail, 'Late cancel: ' + shortDate_(sh.date) + ' vs ' + sh.opponent + ' (' + sh.shift + ')', html);
}

function shortDate_(key) { return Utilities.formatDate(dateValue_(key), tz_(), 'EEE M/d'); }

function shiftCard_(sh, s) {
  const arrive = arriveTime_(sh, s);
  const rows = [
    '<div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#172233">ICA vs ' + esc_(sh.opponent) + '</div>',
    '<div style="margin-top:2px;color:#5B6577">' + esc_(prettyDate_(sh.date)) + ' &middot; ' + esc_(sh.shift) + '</div>',
  ];
  if (sh.games.length) {
    rows.push('<div style="margin-top:10px">' + sh.games.map(esc_).join('<br>') + '</div>');
  }
  rows.push('<div style="margin-top:10px;font-weight:bold">' +
    (arrive ? 'Be in the booth by ' + arrive + '.' : 'Times aren\'t set yet. Watch for an update.') + '</div>');
  if (sh.notes) rows.push('<div style="margin-top:6px;color:#5B6577">' + esc_(sh.notes) + '</div>');
  return '<div style="border:1px solid #E3E6EB;border-left:4px solid #B8913A;border-radius:6px;padding:14px 16px;background:#FFFFFF">' +
    rows.join('') + '</div>';
}

function button_(label, href, primary) {
  return '<div style="margin-top:16px"><a href="' + esc_(href) + '" style="display:inline-block;padding:12px 20px;border-radius:4px;' +
    'background:' + (primary ? '#96282D' : '#EEF0F4') + ';color:' + (primary ? '#FFFFFF' : '#172233') +
    ';font-weight:bold;text-decoration:none">' + esc_(label) + '</a></div>';
}

function emailHtml_(title, parts, s) {
  const contact = s.coordinatorName || s.coordinatorEmail
    ? 'Questions? Reply to this email' + (s.coordinatorName ? ' to reach ' + esc_(s.coordinatorName) : '') + '.'
    : '';
  return '<div style="background:#F5F6F8;padding:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.45;color:#172233">' +
    '<div style="background:#172233;border-bottom:3px solid #B8913A;padding:16px 20px;color:#FFFFFF">' +
    '<div style="font-family:Georgia,serif;font-size:19px;font-weight:bold">Indiana Christian Academy</div>' +
    '<div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#C9CED6">Media Booth Sign-Up</div></div>' +
    '<div style="max-width:560px;margin:0 auto;padding:20px 16px 0">' +
    '<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px;color:#172233">' + esc_(title) + '</h1>' +
    parts.join('') +
    (contact ? '<p style="margin:22px 0 0;font-size:13px;color:#5B6577">' + contact + '</p>' : '') +
    '</div></div>';
}

/** Sends one email. In test mode it goes to the test address, saying who it was for. */
function send_(s, to, subject, html) {
  let note = '';
  if (s.testTo) {
    note = '<div style="background:#F3EBD9;color:#6B5320;padding:10px 16px;font:14px Helvetica,Arial,sans-serif">' +
      'Test mode: this would have gone to ' + esc_(to) + '.</div>';
    to = s.testTo;
  }
  const msg = { to: to, subject: subject, htmlBody: note + html, name: 'ICA Media Booth', body: subject };
  if (s.coordinatorEmail) msg.replyTo = s.coordinatorEmail;
  MailApp.sendEmail(msg);
}

function esc_(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
