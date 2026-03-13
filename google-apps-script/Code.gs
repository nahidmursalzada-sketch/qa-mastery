// ============================================
// QA Mastery - Çarx Kampanyası Backend
// Google Apps Script - Google Sheets ilə işləyir
// ============================================
// QURAŞDIRMA:
// 1. Google Sheets yaradın
// 2. İlk sətirə başlıqları yazın: Tarix | WhatsApp | Mükafat | Browser ID
// 3. Extensions -> Apps Script açın
// 4. Bu kodu yapışdırın
// 5. Deploy -> New deployment -> Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. URL-i kopyalayıb index.html-dəki APPS_SCRIPT_URL-ə yapışdırın

var SHEET_NAME = 'Spins';

function doGet(e) {
  var action = e.parameter.action;

  if (action === 'check') {
    return checkPhone(e.parameter.phone);
  }

  if (action === 'warmup') {
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

function checkPhone(phone) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(phone).trim()) {
      return jsonResponse({
        exists: true,
        prize: data[i][2]
      });
    }
  }

  return jsonResponse({ exists: false });
}

function recordSpin(data) {
  var sheet = getSheet();
  var allData = sheet.getDataRange().getValues();

  // Admin/override rejimi - təkrar yoxlama yoxdur
  if (!data.override) {
    // Təkrar yoxlama (race condition qarşısını almaq üçün)
    for (var i = 1; i < allData.length; i++) {
      if (String(allData[i][1]).trim() === String(data.phone).trim()) {
        return jsonResponse({
          success: false,
          message: 'already_spun',
          prize: allData[i][2],
          code: allData[i][3]
        });
      }
    }
  }

  // Yeni sətir əlavə et
  sheet.appendRow([
    new Date(),
    data.phone,
    data.prize,
    data.code || '',
    data.browserId || 'unknown'
  ]);

  return jsonResponse({ success: true, prize: data.prize, code: data.code });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Tarix', 'WhatsApp', 'Mükafat', 'Təsdiq Kodu', 'Browser ID']);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 150);
    sheet.setColumnWidth(4, 280);
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
