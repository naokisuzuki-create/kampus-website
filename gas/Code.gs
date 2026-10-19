/** KaMPUS public site data API (Google Apps Script)
 * Deploy as Web App: execute as owner, access Anyone.
 * Only publicly approved fields are emitted. Never store private contact info here.
 * Spreadsheet ID: 1LQVhfnFlMm4Uyn0OtluqpkR39G94ar5Je6VApdpuf-E
 */
const KAMPUS_ARCHIVE_SPREADSHEET_ID = '1EMGAyflbTIOQPV7JOIaLAprUSFgdFOm8O5ryP0Yljjg';
const KAMPUS_SPREADSHEET_ID = '1LQVhfnFlMm4Uyn0OtluqpkR39G94ar5Je6VApdpuf-E';
const KAMPUS_PUBLIC_FIELDS = Object.freeze({
  members: ['sort_order', 'role', 'name', 'affiliation', 'published'],
  sponsors: ['sort_order', 'name', 'image_path', 'url', 'published'],
  archive_program: ['event_id','sort_order','session_type','lecture_title','speaker','affiliation','chair','notes','published'],
  archive: ['sort_order','event_id','number','event_date','title','theme','venue','report','photos','published','event_time','lecture_title','speaker','organizer'],
  seminars: ['sort_order', 'event_id', 'title', 'event_date', 'event_time', 'venue', 'organizer', 'lectures', 'image_path', 'detail_url', 'application_url', 'published', 'announcement', 'poster_path_1', 'poster_path_2']
});
const KAMPUS_SHEET_NAMES = Object.freeze({members: '幹事・監事', sponsors: '協賛企業', seminars: 'セミナー', archive: '過去の勉強会', archive_program: '講演プログラム'});

function doGet(e) {
  const kind = String((e && e.parameter && e.parameter.type) || 'members');
  const callback = String((e && e.parameter && e.parameter.callback) || '');
  if (!Object.prototype.hasOwnProperty.call(KAMPUS_PUBLIC_FIELDS, kind)) {
    return ContentService.createTextOutput(JSON.stringify({error: 'invalid type'})).setMimeType(ContentService.MimeType.JSON);
  }
  const values = getPublishedRows_(kind);
  const payload = JSON.stringify({type: kind, rows: values});
  if (callback === 'kampusDataCallback') {
    return ContentService.createTextOutput(callback + '(' + payload + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}
function getPublishedRows_(kind) {
  const sheet = SpreadsheetApp.openById((kind === 'archive' || kind === 'archive_program') ? KAMPUS_ARCHIVE_SPREADSHEET_ID : KAMPUS_SPREADSHEET_ID).getSheetByName(KAMPUS_SHEET_NAMES[kind]);
  if (!sheet) return [];
  const grid = sheet.getDataRange().getValues();
  if (grid.length < 2) return [];
  const header = grid[0].map(String);
  const fields = KAMPUS_PUBLIC_FIELDS[kind];
  return grid.slice(1).map(r => {
    const item = {};
    fields.forEach(field => {
      const index = header.indexOf(field);
      item[field] = index >= 0 ? r[index] : '';
    });
    return item;
  }).filter(item => item.published === true || String(item.published).toUpperCase() === 'TRUE')
    .sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}
