/**
 * KaMPUS お問い合わせ専用 GAS
 * Web App: 自分として実行 / 全員に公開
 * 受付用スプレッドシートは公開しないこと。
 * Script Properties: CONTACT_SHEET_ID / CONTACT_TO / CONTACT_CC
 * 送信件数上限はアカウントの MailApp quota に依存します。
 */
const CONTACT_TYPES = Object.freeze({
  general: '当会についてのお問い合わせ',
  seminar: 'セミナーについてのお問い合わせ',
  speaker: '講師派遣のご依頼',
  collaboration: '共同開催のご依頼',
  other: 'その他'
});
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form')
    .setTitle('KaMPUS お問い合わせ')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}
function submitContactForm(payload) {
  const d = validateContact_(payload);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty('CONTACT_SHEET_ID');
    const to = props.getProperty('CONTACT_TO');
    const cc = props.getProperty('CONTACT_CC') || '';
    if (!sheetId || !to) throw new Error('管理者による受付設定が完了していません。');
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('お問い合わせ');
    if (!sheet) throw new Error('お問い合わせシートがありません。');
    const key = 'contact_last_' + Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, d.email.toLowerCase())
    ).slice(0,32);
    const cache = CacheService.getScriptCache();
    if (cache.get(key)) throw new Error('連続送信を避けるため、しばらくしてからお試しください。');
    const ref = Utilities.getUuid();
    const protect = s => /^[=+@\-\t\r]/.test(s) ? "'" + s : s;
    sheet.appendRow([new Date(),ref,CONTACT_TYPES[d.category],protect(d.name),
      protect(d.affiliation),protect(d.email),protect(d.message),'未対応','','']);
    cache.put(key,'1',300);
    try {
      MailApp.sendEmail({
        to:to,cc:cc,
        subject:'【KaMPUSお問い合わせ】' + CONTACT_TYPES[d.category] + '（' + ref + '）',
        body:['受付番号: '+ref,'カテゴリー: '+CONTACT_TYPES[d.category],
          '氏名: '+d.name,'所属: '+d.affiliation,'メール: '+d.email,
          '','お問い合わせ内容:',d.message].join('\n'),
        replyTo:d.email,
        name:'KaMPUSお問い合わせ'
      });
    } catch (error) {
      sheet.getRange(sheet.getLastRow(),8).setValue('通知エラー');
      throw new Error('内容は記録されましたが通知に問題が発生しました。事務局にご連絡ください。');
    }
    return {ok:true,reference:ref};
  } finally { lock.releaseLock(); }
}
function validateContact_(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('入力情報が不正です。');
  if (String(raw.website||'').trim()) throw new Error('送信できません。');
  const category=String(raw.category||'');
  const name=String(raw.name||'').trim();
  const affiliation=String(raw.affiliation||'').trim();
  const email=String(raw.email||'').trim();
  const message=String(raw.message||'').trim();
  if (!Object.prototype.hasOwnProperty.call(CONTACT_TYPES,category)) throw new Error('お問い合わせの種類を確認してください。');
  if (!name || name.length>100 || affiliation.length>150) throw new Error('氏名・所属を確認してください。');
  if (email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('メールアドレスを確認してください。');
  if (!message || message.length>5000 || raw.consent!==true) throw new Error('お問い合わせ内容と同意を確認してください。');
  return {category,name,affiliation,email,message};
}
