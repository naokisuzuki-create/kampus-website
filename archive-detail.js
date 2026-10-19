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
   // 第8回はプログラム案の各講演と演者・司会を対応づけて表示する。
   if(item.event_id==="KAMPUS-008"&&item.lecture_title&&item.speaker){
     const talks=String(item.lecture_title).split(/\r?\n/).filter(x=>!x.startsWith("【"));
     const speakers=String(item.speaker).split(/\r?\n/).filter(x=>!x.startsWith("【"));
     const findLine=prefix=>speakers.find(x=>x.startsWith(prefix))||"";
     const chairLine=findLine("司会：").replace(/^司会：/,"");
     const chairs=chairLine.split("／");
     talks.forEach((talk,i)=>{
       addField("講演"+(i+1),talk);
       const speaker=i===0?findLine("講演①："):i===1?findLine("講演②："):findLine("特別講演：");
       addField("演者・講師",speaker.replace(/^[^：]+：/,""));
       const chair=i<2?chairs[0]:chairs[1];
       if(chair)addField("司会",chair.replace(/（講演[^）]*）|（特別講演）/g,"").trim());
     });
   }else{
     addField("プログラム",item.lecture_title||item.theme);
     addField("講師・演者",item.speaker);
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