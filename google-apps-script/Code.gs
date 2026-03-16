// ============================================
// QA Mastery - Çarx Kampanyası Backend
// Google Apps Script - Google Sheets ilə işləyir
// ============================================
// QURAŞDIRMA:
// 1. Google Sheets yaradın
// 2. Extensions -> Apps Script açın
// 3. Bu kodu yapışdırın
// 4. Deploy -> New deployment -> Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. URL-i kopyalayıb index.html-dəki APPS_SCRIPT_URL-ə yapışdırın

var SHEET_NAME = 'Spins';

function doGet(e) {
  if (e.parameter.action === 'warmup') {
    return jsonResponse({ status: 'ok' });
  }
  return jsonResponse({ error: 'Invalid action' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
  } catch (err) {
    return jsonResponse({ success: false, message: 'server_busy' });
  }

  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'record') {
      return recordSpin(data);
    }

    return jsonResponse({ error: 'Invalid action' });
  } finally {
    lock.releaseLock();
  }
}

function recordSpin(data) {
  var sheet = getSheet();

  // Yeni sətir əlavə et
  sheet.appendRow([
    new Date(),
    data.browserId || 'unknown',
    data.prize,
    data.code || '',
    data.override ? 'admin' : 'user'
  ]);

  return jsonResponse({ success: true, prize: data.prize, code: data.code });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Tarix', 'Browser ID', 'Mükafat', 'Təsdiq Kodu', 'Növ']);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 220);
    sheet.setColumnWidth(3, 150);
    sheet.setColumnWidth(4, 150);
    sheet.setColumnWidth(5, 80);
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
