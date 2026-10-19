document.addEventListener("DOMContentLoaded",async()=>{
 const id=new URLSearchParams(location.search).get("id");
 const title=document.getElementById("recordTitle");
 const number=document.getElementById("recordNumber");
 const dl=document.getElementById("recordFields");
 try{
   const records=await fetchArchiveRecords();
   const item=records.find(x=>x.event_id===id);
   if(!item){title.textContent="開催記録が見つかりません";number.textContent="ARCHIVE";return;}
   title.textContent=item.title;number.textContent=item.number+" / ARCHIVE";
   document.title=item.number+" "+item.title+" | 関西血液浄化研究会";
   function addField(label,value){
     if(!value)return;
     const dt=document.createElement("dt"),dd=document.createElement("dd");
     dt.textContent=label;dd.textContent=String(value);dl.append(dt,dd);
   }
   addField("開催回",item.number);
   addField("開催日",item.event_date);
   addField("開催時間",item.event_time);
   const programRows=await fetchArchiveProgram();
   const sessions=Array.isArray(programRows)?programRows.filter(p=>p.event_id===id&&(p.published===true||String(p.published).toUpperCase()==="TRUE")).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)):[];
   if(sessions.length){
     for(const p of sessions){
       addField("演題名", (p.session_type?String(p.session_type)+"：":"")+String(p.lecture_title||""));
       if(p.speaker)addField("演者",String(p.speaker)+(p.affiliation?"（"+p.affiliation+"）":""));
       if(p.chair)addField("司会",p.chair);
     }
   }else{
     // GAS未デプロイ時も既存記録を表示（旧方式）。
     addField("演題名",item.lecture_title||item.theme);
     addField("演者",item.speaker);
   }
   addField("会場",item.venue);
   addField("担当幹事",item.organizer);
   if(item.report){document.getElementById("recordReport").textContent=item.report;document.getElementById("recordReportSection").hidden=false;}
   const photos=Array.isArray(item.photos)?item.photos:String(item.photos||"").split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean);
   if(photos.length){
    const gallery=document.getElementById("recordPhotos");
    for(const src of photos){if(typeof src!=="string"||!/^\.\/assets\/images\/archive\/[a-zA-Z0-9_./-]+$/.test(src))continue;const image=document.createElement("img");image.src=src;image.loading="lazy";image.alt=item.number+"の活動記録";gallery.appendChild(image);}
    if(gallery.childElementCount)document.getElementById("recordPhotosSection").hidden=false;
   }
 }catch(err){title.textContent="開催記録を読み込めませんでした。";console.warn(err);}
 finally{if(typeof initializePublicData==="function")initializePublicData();}
});