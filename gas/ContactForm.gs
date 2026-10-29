/** KaMPUS contact backend - install as a separate GAS project, then deploy.
 * Required Script Properties:
 * CONTACT_SHEET_ID: Google Spreadsheet ID created for inquiries
 * CONTACT_TO: comma-separated To addresses (private; never commit recipient list)
 * CONTACT_CC: comma-separated Cc addresses (private; never commit recipient list)
 * CONTACT_TOKEN: long random secret shared only with a trusted server-side proxy
 * IMPORTANT: Do not expose CONTACT_TOKEN in browser JavaScript.
 * Public anonymous POST without anti-bot verification / a trusted proxy must not be enabled.
 */
const CONTACT_CATEGORIES = Object.freeze({
  general:"当会についてのお問い合わせ",
  seminar:"セミナーについてのお問い合わせ",
  speaker:"講師派遣のご依頼",
  collaboration:"共同開催のご依頼",
  other:"その他"
});
function validateContactSubmission(data) {
  const category=String(data.category||"");
  const name=String(data.name||"").trim();
  const affiliation=String(data.affiliation||"").trim();
  const email=String(data.email||"").trim();
  const message=String(data.message||"").trim();
  if(!Object.prototype.hasOwnProperty.call(CONTACT_CATEGORIES,category))throw new Error("カテゴリーが不正です");
  if(!name||name.length>100||affiliation.length>150)throw new Error("名前または所属が不正です");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error("メールアドレスが不正です");
  if(!message||message.length>5000||String(data.consent)!=="true")throw new Error("内容・同意欄を確認してください");
  if(data.website)throw new Error("不正な投稿です");
  return {category,name,affiliation,email,message};
}
function saveContactSubmission(data) {
  const props=PropertiesService.getScriptProperties();
  if(!props.getProperty("CONTACT_TOKEN") || data.token!==props.getProperty("CONTACT_TOKEN"))throw new Error("認証に失敗しました");
  const d=validateContactSubmission(data);
  const sheet=SpreadsheetApp.openById(props.getProperty("CONTACT_SHEET_ID")).getSheetByName("お問い合わせ");
  if(!sheet)throw new Error("お問い合わせシートがありません");
  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  let number;
  try{
    number=Utilities.getUuid();
    const safe=s=>/^[=+@\-\t\r]/.test(s)?"'"+s:s;
    sheet.appendRow([new Date(),number,CONTACT_CATEGORIES[d.category],safe(d.name),safe(d.affiliation),safe(d.email),safe(d.message),"未対応","",""]);
  }finally{lock.releaseLock();}
  const to=props.getProperty("CONTACT_TO");
  const cc=props.getProperty("CONTACT_CC")||"";
  if(!to)throw new Error("通知先が未設定です（受付記録は保存済み）");
  MailApp.sendEmail({
    to,cc,
    subject:"【KaMPUSお問い合わせ】"+CONTACT_CATEGORIES[d.category]+"（"+number+"）",
    body:["受付番号: "+number,"カテゴリー: "+CONTACT_CATEGORIES[d.category],"お名前: "+d.name,"ご所属: "+d.affiliation,"返信先: "+d.email,"","お問い合わせ内容:",d.message].join("\n"),
    replyTo:d.email,
    name:"KaMPUSお問い合わせ"
  });
  return {ok:true,reference:number};
}
// Deliberately no public doPost endpoint: connect only after security and confirmation design is approved.
function testContactValidation() {
  const valid={category:"general",name:"テスト",affiliation:"研究会",email:"test@example.com",message:"動作確認",consent:"true",website:""};
  const out=validateContactSubmission(valid);
  Logger.log(JSON.stringify({test:"validation",result:out.category==="general"?"PASS":"FAIL"}));
}
