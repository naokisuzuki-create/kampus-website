"use strict";
// Set only after the contact GAS Web App is deployed and tested.
// Keep recipient addresses in GAS Script Properties, never in public JavaScript.
const KAMPUS_CONTACT_ENDPOINT = "";
document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("kampusContactForm");
  const button=document.getElementById("contactSubmit");
  const status=document.getElementById("contactStatus");
  const notice=document.getElementById("contactNotice");
  if(!KAMPUS_CONTACT_ENDPOINT){button.disabled=true;return;}
  // A live sender must use a verified same-origin/iframe or backend proxy strategy.
  // Do not enable a cross-origin submission until receipt confirmation is implemented.
  notice.textContent="送信機能の最終確認中です。";
  button.disabled=true;
  form.addEventListener("submit",e=>{e.preventDefault();status.textContent="現在送信できません。";});
});
