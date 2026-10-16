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
   [["開催回",item.number],["開催日",item.event_date],["テーマ",item.theme],["会場",item.venue]].forEach(([label,value])=>{
    if(!value)return;const dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=label;dd.textContent=value;dl.append(dt,dd);
   });
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