const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const AdminCall = require('../models/AdminCall');
const GuestCall = require('../models/GuestCall');

/* ══════════ value helpers ══════════ */
const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Accepts "01-12-2025" (DD-MM-YYYY), "2025-12-01" (ISO), Date, or excel serial number
const parseDate = (v, fallback) => {
  if (v instanceof Date && !isNaN(v)) return v;
  if (typeof v === 'number' && isFinite(v)) {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return isNaN(d) ? fallback : d;
  }
  const s = String(v || '').trim();
  let m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);            // DD-MM-YYYY (photo format)
  if (m) { const d = new Date(+m[3], +m[2] - 1, +m[1]); return isNaN(d) ? fallback : d; }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);                // ISO
  if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(d) ? fallback : d; }
  const d = new Date(s);
  return isNaN(d) ? fallback : d;
};

// Accepts "3.50 PM", "3:50 PM", "15:50", Date, or excel time fraction -> "HH:MM" 24h
const parseTime = (v, fallback) => {
  if (v instanceof Date && !isNaN(v)) return v.toTimeString().slice(0, 5);
  if (typeof v === 'number' && v >= 0 && v < 1) {
    const mins = Math.round(v * 1440) % 1440;
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  }
  const s = String(v || '').trim().toUpperCase();
  let m = s.match(/^(\d{1,2})[.:](\d{2})\s*(AM|PM)$/);         // "3.50 PM" / "3:50 PM"
  if (m) { let h = +m[1] % 12; if (m[3] === 'PM') h += 12; return `${pad(h)}:${m[2]}`; }
  m = s.match(/^(\d{1,2}):(\d{2})/);                          // "15:50"
  if (m && +m[1] < 24) return `${pad(+m[1])}:${m[2]}`;
  return fallback;
};

const fmtDate = (d) => (d instanceof Date && !isNaN(d) ? `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` : '');
// "15:50" -> "3.50 PM" (photo format)
const fmtTime = (t) => {
  const m = String(t || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t || '';
  const h = +m[1];
  return `${h % 12 || 12}.${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
};
const titleCase = (s) => { const t = String(s || '').trim(); return t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : ''; };
const monthLabel = (d) => { const x = d instanceof Date && !isNaN(d) ? d : new Date(); return `${MONTHS[x.getMonth()]}-${String(x.getFullYear()).slice(2)}`; };
const hotelTitle = (u) => `Hotel Name : ${String(u?.companyName || '').trim() || 'Your Hotel'}`;

const isDateStr = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const dayStart = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dayEnd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 23, 59, 59, 999); };

// Mongo condition from ?from=&to= (YYYY-MM-DD), {} when none, null when invalid
const rangeCondition = (field, from, to) => {
  if ((from && !isDateStr(from)) || (to && !isDateStr(to))) return null;
  const cond = {};
  if (from) cond.$gte = dayStart(from);
  if (to) cond.$lte = dayEnd(to);
  return Object.keys(cond).length ? { [field]: cond } : {};
};
const rangeSuffix = (from, to) => (from || to ? `_${from || 'start'}_to_${to || 'end'}` : '');

/* ══════════ styled workbook builder (photo layout) ══════════ */
const ADMIN_HEADERS = ['S.No','Location','Issue','Solutions','Start Date','End Date','Time Start','Time End','Category','Status'];
const ADMIN_WIDTHS  = [6, 16, 34, 50, 13, 13, 12, 12, 12, 10];
const GUEST_HEADERS = ['S.No','Room No','Issue','Solutions','Date','Time Start','Time End','Category','By Who'];
const GUEST_WIDTHS  = [6, 11, 34, 50, 13, 12, 12, 12, 14];

const THIN = { style: 'thin', color: { argb: 'FF9AA5B4' } };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const FILL = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const BAND_FILL = FILL('FFBDD7EE');   // summary band (row 2)
const HEAD_FILL = FILL('FFDEEBF7');   // column headers (row 3)

const dataUrlBuffer = (dataUrl) => {
  const m = String(dataUrl).match(/^data:image\/(png|jpe?g|gif);base64,(.+)$/i);
  if (!m) throw new Error('Unsupported logo format');
  const ext = m[1].toLowerCase() === 'jpg' ? 'jpeg' : m[1].toLowerCase();
  return { buffer: Buffer.from(m[2], 'base64'), extension: ext };
};
/**
 * Builds the styled worksheet from the photo:
 *  row 1: logo (top-left) + centered bold "Hotel Name : X"
 *  row 2: blue band  "IT Summary :" | "Admin call logs" | "Month :" | "Dec-25"
 *  row 3: column headers (same order as photo)
 *  row 4+: bordered data rows
 */
const buildWorkbook = ({ user, sheetName, headers, widths, summaryLabel, logTitle, monthText, rows }) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = widths.map(w => ({ width: w }));
  const n = headers.length;

  /* row 1 — logo + hotel name */
  ws.getRow(1).height = 48;
  ws.mergeCells(1, 1, 1, n);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = hotelTitle(user);
  titleCell.font = { bold: true, size: 18, name: 'Calibri' };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  if (user?.logo) {
    try {
      const { buffer, extension } = dataUrlBuffer(user.logo);
      const img = wb.addImage({ buffer, extension });
      ws.addImage(img, { tl: { col: 0.08, row: 0.12 }, ext: { width: 84, height: 42 } });
    } catch (e) { /* unsupported logo — title still renders */ }
  }

  /* row 2 — summary band: [1..2] label | [3..6] title | [7..8] "Month :" | [9..n] month */
  ws.getRow(2).height = 22;
  ws.mergeCells(2, 1, 2, 2);
  ws.mergeCells(2, 3, 2, Math.max(6, n - 4));
  ws.mergeCells(2, Math.max(7, n - 3), 2, Math.max(8, n - 2));
  ws.mergeCells(2, Math.max(9, n - 1), 2, n);
  const bandCells = [
    [1, summaryLabel, 'left'],
    [3, logTitle, 'center'],
    [Math.max(7, n - 3), 'Month :', 'center'],
    [Math.max(9, n - 1), monthText, 'center'],
  ];
  for (let c = 1; c <= n; c++) {
    const cell = ws.getCell(2, c);
    cell.fill = BAND_FILL;
    cell.border = BORDER;
  }
  bandCells.forEach(([col, val, align]) => {
    const cell = ws.getCell(2, col);
    cell.value = val;
    cell.font = { bold: true, size: 11, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: align, indent: align === 'left' ? 1 : 0 };
  });

  /* row 3 — headers */
  ws.getRow(3).height = 20;
  headers.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 11, name: 'Calibri' };
    cell.fill = HEAD_FILL;
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  /* data rows */
  const leftCols = new Set(headers.map((h, i) => (['Location', 'Issue', 'Solutions', 'Room No', 'By Who'].includes(h) ? i : -1)).filter(i => i >= 0));
  rows.forEach((r, ri) => {
    const row = ws.getRow(4 + ri);
    r.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.border = BORDER;
      cell.font = { size: 11, name: 'Calibri' };
      cell.alignment = {
        vertical: 'middle',
        horizontal: leftCols.has(ci) ? 'left' : 'center',
        wrapText: leftCols.has(ci),
      };
    });
  });

  ws.views = [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }];
  return wb;
};

const sendWorkbook = async (wb, filename, res) => {
  const buffer = await wb.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};
/* ══════════ SAMPLE TEMPLATES (exact dummy rows from the photo) ══════════ */
// [Location, Issue, Solutions, Start Date, End Date, Time Start, Time End, Category, Status]
const ADMIN_DUMMY = [
  ['Admin office', 'Printer Issue', 'Paper stuck in the printer. After removing papers, issue has been resolved.', '01-12-2025', '01-12-2025', '3.50 PM', '3.55 PM', 'Hardware', 'Done'],
  ['IT', 'Daily routine Server room temp check', 'IT Work flow', '01-12-2025', '01-12-2025', '3.15 PM', '4.00 PM', 'Hardware', 'Done'],
  ['IT', 'Daily task', 'Daily task', '01-12-2025', '01-12-2025', '6.10 PM', '6.15 PM', 'Hardware', 'Done'],
  ['Admin office', 'Printer Issue', 'Paper stuck in the printer. After removing it, issue has been resolved.', '02-12-2025', '02-12-2025', '12.25 PM', '12.30 PM', 'Hardware', 'Done'],
  ['Admin office', 'Printer Issue in HR System', 'First remove and then add the printer. Issue has been resolved', '02-12-2025', '02-12-2025', '12.35 PM', '12.40 PM', 'Software', 'Done'],
  ['Store Room', 'Unable to open attached file in JPG format', 'After setting the file to default format, issue has been resolved', '02-12-2025', '02-12-2025', '2.30 PM', '2.35 PM', 'Software', 'Done'],
  ['Front office', 'Telephone issue from Room No 505.', 'After setting it to Front office. Getting calls to front office.', '02-12-2025', '02-12-2025', '2.51 PM', '3.10 PM', 'Hardware', 'Done'],
  ['IT', 'Daily routine Server room temp check', 'IT Work flow', '02-12-2025', '02-12-2025', '3.19 PM', '3.25 PM', 'Hardware', 'Done'],
  ['IT', 'Daily task', 'Daily task', '02-12-2025', '02-12-2025', '6.45 PM', '6.55 PM', 'Hardware', 'Done'],
];
// [Room No, Issue, Solutions, Date, Time Start, Time End, Category, By Who]
const GUEST_DUMMY = [
  ['201', 'WiFi issue', 'Password changed', '01-12-2025', '10.00 AM', '10.15 AM', 'WiFi', 'Aman'],
  ['305', 'AC not cooling', 'Filter cleaned', '01-12-2025', '2.00 PM', '2.30 PM', 'AC', 'Rahul'],
  ['412', 'TV signal not working', 'Set-top box restarted', '02-12-2025', '5.15 PM', '5.35 PM', 'TV', 'Suresh'],
  ['108', 'Phone not ringing', 'Handset replaced', '02-12-2025', '7.05 PM', '7.20 PM', 'Phone', 'Aman'],
];

exports.downloadAdminTemplate = async (req, res, next) => {
  try {
    const rows = ADMIN_DUMMY.map((r, i) => [i + 1, ...r]);
    const wb = buildWorkbook({
      user: req.user, sheetName: 'Admin call logs', headers: ADMIN_HEADERS, widths: ADMIN_WIDTHS,
      summaryLabel: 'IT Summary :', logTitle: 'Admin call logs', monthText: 'Dec-25', rows,
    });
    await sendWorkbook(wb, 'AdminSample.xlsx', res);
  } catch (err) { next(err); }
};

exports.downloadGuestTemplate = async (req, res, next) => {
  try {
    const rows = GUEST_DUMMY.map((r, i) => [i + 1, ...r]);
    const wb = buildWorkbook({
      user: req.user, sheetName: 'Guest call logs', headers: GUEST_HEADERS, widths: GUEST_WIDTHS,
      summaryLabel: 'Guest Summary :', logTitle: 'Guest call logs', monthText: 'Dec-25', rows,
    });
    await sendWorkbook(wb, 'GuestSample.xlsx', res);
  } catch (err) { next(err); }
};
/* ══════════ IMPORT (skips decorative rows, maps columns by header name) ══════════ */
const readMatrix = (file) => {
  try {
    const wb = XLSX.readFile(file.path, { cellDates: true });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
  } finally {
    try { fs.unlinkSync(file.path); } catch (e) { /* already removed */ }
  }
};

/* Finds the header row (row containing "S.No" + a known field) — ignores logo/title/band rows */
const findHeaderRow = (matrix, mustContain) => {
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const cells = (matrix[i] || []).map(c => String(c).trim().toLowerCase());
    if (cells.includes('s.no') && mustContain.some(k => cells.includes(k))) return i;
  }
  // Legacy/simple files: first row that contains the key field
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const cells = (matrix[i] || []).map(c => String(c).trim().toLowerCase());
    if (mustContain.some(k => cells.includes(k))) return i;
  }
  return -1;
};

const rowObjects = (matrix, headerIdx) => {
  const headers = (matrix[headerIdx] || []).map(h => String(h).trim());
  return matrix.slice(headerIdx + 1)
    .filter(r => r.some(c => String(c).trim() !== ''))
    .map(r => {
      const o = {};
      headers.forEach((h, i) => { if (h) o[h] = r[i]; });
      return o;
    });
};

const get = (r, ...names) => {
  for (const n of names) {
    const key = Object.keys(r).find(k => k.toLowerCase() === n.toLowerCase());
    if (key && String(r[key]).trim() !== '') return r[key];
  }
  return '';
};

exports.importAdminCalls = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload file required' });
    let matrix;
    try { matrix = readMatrix(req.file); }
    catch (e) { return res.status(400).json({ success: false, message: 'Invalid or corrupted Excel file' }); }

    const headerIdx = findHeaderRow(matrix, ['location', 'issue']);
    if (headerIdx === -1) return res.status(400).json({ success: false, message: 'Header row not found — please use the downloaded sample format' });

    const dataRows = rowObjects(matrix, headerIdx);
    if (!dataRows.length) return res.status(400).json({ success: false, message: 'No data rows found below the header' });

    const now = new Date();
    const toInsert = dataRows.map(r => {
      const startDate = parseDate(get(r, 'Start Date'), now);
      const category = String(get(r, 'Category') || '').toLowerCase();
      const status = String(get(r, 'Status') || '').toLowerCase();
      return {
        userId: req.user._id,
        location: String(get(r, 'Location') || '').trim() || 'General',
        issue: String(get(r, 'Issue') || 'Issue'),
        solution: String(get(r, 'Solutions', 'Solution') || 'Resolved'),
        startDate,
        endDate: parseDate(get(r, 'End Date'), startDate),
        timeStart: parseTime(get(r, 'Time Start'), '09:00'),
        timeEnd: parseTime(get(r, 'Time End'), '09:05'),
        category: ['hardware', 'software'].includes(category) ? category : 'hardware',
        status: ['done', 'pending'].includes(status) ? status : 'done',
        createdBy: req.user._id,
      };
    });

    await AdminCall.insertMany(toInsert);
    res.status(200).json({ success: true, message: `Imported ${toInsert.length} admin calls successfully` });
  } catch (err) { next(err); }
};

exports.importGuestCalls = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload file required' });
    let matrix;
    try { matrix = readMatrix(req.file); }
    catch (e) { return res.status(400).json({ success: false, message: 'Invalid or corrupted Excel file' }); }

    const headerIdx = findHeaderRow(matrix, ['room no', 'issue']);
    if (headerIdx === -1) return res.status(400).json({ success: false, message: 'Header row not found — please use the downloaded sample format' });

    const dataRows = rowObjects(matrix, headerIdx);
    if (!dataRows.length) return res.status(400).json({ success: false, message: 'No data rows found below the header' });

    const valid = dataRows.filter(r => String(get(r, 'Room No')).trim() !== '');
    if (!valid.length) return res.status(400).json({ success: false, message: 'No rows with a "Room No" found in the file' });

    const toInsert = valid.map(r => ({
      userId: req.user._id,
      roomNo: String(get(r, 'Room No')).trim(),
      issue: String(get(r, 'Issue') || 'Issue'),
      solution: String(get(r, 'Solutions', 'Solution') || 'Resolved'),
      timeStart: parseTime(get(r, 'Time Start'), '09:00'),
      timeEnd: parseTime(get(r, 'Time End'), '09:05'),
      category: String(get(r, 'Category') || 'WiFi'),
      byWho: String(get(r, 'By Who') || 'Unknown'),
      createdBy: req.user._id,
    }));

    await GuestCall.insertMany(toInsert);
    const skipped = dataRows.length - valid.length;
    res.status(200).json({ success: true, message: `Imported ${toInsert.length} guest calls successfully${skipped ? ` (${skipped} row(s) skipped: missing Room No)` : ''}` });
  } catch (err) { next(err); }
};
/* ══════════ EXPORTS (photo layout, ?from=&to= date filter) ══════════ */
const sendError = (res, msg) => res.status(400).json({ success: false, message: msg });

exports.exportAdminCalls = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = rangeCondition('startDate', from, to);
    if (range === null) return sendError(res, 'Invalid date range. Use YYYY-MM-DD format.');
    const q = req.user.role !== 'admin' ? { userId: req.user._id } : {};
    const calls = await AdminCall.find({ ...q, ...range }).sort({ startDate: -1 });

    const rows = calls.map((c, i) => [
      i + 1, c.location || '', c.issue || '', c.solution || '',
      fmtDate(c.startDate), fmtDate(c.endDate),
      fmtTime(c.timeStart), fmtTime(c.timeEnd),
      titleCase(c.category), titleCase(c.status),
    ]);

    // Month shown in the band: from the filter's "to"/"from", else newest record, else today
    const monthDate = parseDate(to || from, null)
      || (calls.length ? parseDate(calls[0].startDate, new Date()) : new Date());

    const wb = buildWorkbook({
      user: req.user, sheetName: 'Admin call logs',
      headers: ADMIN_HEADERS, widths: ADMIN_WIDTHS,
      summaryLabel: 'IT Summary :', logTitle: 'Admin call logs',
      monthText: monthLabel(monthDate), rows,
    });
    await sendWorkbook(wb, `AdminCalls_Export${rangeSuffix(from, to)}.xlsx`, res);
  } catch (err) { next(err); }
};

exports.exportGuestCalls = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const range = rangeCondition('createdAt', from, to);
    if (range === null) return sendError(res, 'Invalid date range. Use YYYY-MM-DD format.');
    const q = req.user.role !== 'admin' ? { userId: req.user._id } : {};
    const calls = await GuestCall.find({ ...q, ...range }).sort({ createdAt: -1 });

    const rows = calls.map((c, i) => [
      i + 1, c.roomNo || '', c.issue || '', c.solution || '',
      fmtDate(c.createdAt),
      fmtTime(c.timeStart), fmtTime(c.timeEnd),
      c.category || '', c.byWho || '',
    ]);

    const monthDate = parseDate(to || from, null)
      || (calls.length ? parseDate(calls[0].createdAt, new Date()) : new Date());

    const wb = buildWorkbook({
      user: req.user, sheetName: 'Guest call logs',
      headers: GUEST_HEADERS, widths: GUEST_WIDTHS,
      summaryLabel: 'Guest Summary :', logTitle: 'Guest call logs',
      monthText: monthLabel(monthDate), rows,
    });
    await sendWorkbook(wb, `GuestCalls_Export${rangeSuffix(from, to)}.xlsx`, res);
  } catch (err) { next(err); }
};

/* Exposed for tests */
exports._test = { parseDate, parseTime, fmtDate, fmtTime, findHeaderRow, rowObjects, buildWorkbook, monthLabel };