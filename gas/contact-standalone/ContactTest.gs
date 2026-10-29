/** 安全な手動実行テスト：保存・通知を行わない */
function testContactValidation() {
  const base={category:'general',name:'テスト太郎',affiliation:'テスト施設',
    email:'test@example.com',message:'テスト内容',consent:true,website:''};
  const cases=[
    {name:'正常',input:base,valid:true},
    {name:'カテゴリー不正',input:{...base,category:'bad'},valid:false},
    {name:'同意なし',input:{...base,consent:false},valid:false},
    {name:'メール不正',input:{...base,email:'invalid'},valid:false},
    {name:'bot入力',input:{...base,website:'spam'},valid:false}
  ];
  let pass=0;
  for(const c of cases){let valid=true;try{validateContact_(c.input);}catch(e){valid=false;}
    const ok=valid===c.valid;if(ok)pass++;Logger.log(JSON.stringify({test:c.name,result:ok?'PASS':'FAIL'}));}
  Logger.log('===== '+pass+'/'+cases.length+' PASS =====');
}