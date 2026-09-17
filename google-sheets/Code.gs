const SHEET_NAME = 'Signups';

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty('AVANI_WEBHOOK_SECRET');
    const body = JSON.parse(e?.postData?.contents || '{}');
    const headerSecret = e?.parameter?.secret || '';

    if (!expectedSecret || (body.secret !== expectedSecret && headerSecret !== expectedSecret)) {
      return json({ success: false, error: 'Unauthorized' });
    }

    const name = String(body.name || '').trim().slice(0, 80);
    const email = String(body.email || '').trim().slice(0, 160);
    const uid = String(body.uid || '').trim().slice(0, 160);
    const provider = String(body.provider || 'unknown').trim().slice(0, 40);
    const source = String(body.source || 'Avani AI').trim().slice(0, 80);

    if (!name && !email) return json({ success: false, error: 'Name or email is required' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'User ID', 'Provider', 'Source']);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([new Date(), name, email, uid, provider, source]);
    return json({ success: true });
  } catch (err) {
    console.error(err);
    return json({ success: false, error: 'Server error' });
  }
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
