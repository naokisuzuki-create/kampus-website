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
   addField("会場",item.venue);
   addField("担当幹事",item.organizer);
   const programSection=document.getElementById("archiveProgramSection");
   const programList=document.getElementById("archiveProgramList");
   const programRows=await fetchArchiveProgram();
   const sessions=Array.isArray(programRows)
     ? programRows.filter(p=>p.event_id===id&&(p.published===true||String(p.published).toUpperCase()==="TRUE"))
       .sort((a,b)=>Number(a.sort_order)-Number(b.sort_order))
     : [];
   function renderSession(p,index){
     const article=document.createElement("section");article.className="archive-program-item";
     const header=document.createElement("div");header.className="archive-program-header";
     const type=document.createElement("span");type.className="archive-program-type";
     type.textContent=String(p.session_type||"講演 "+(index+1));
     const heading=document.createElement("h3");heading.className="archive-program-title";
     heading.textContent=String(p.lecture_title||"");
     header.append(type,heading);article.appendChild(header);
     const details=document.createElement("dl");details.className="archive-program-people";
     function addPerson(label,value){
       if(!value)return;
       const dt=document.createElement("dt"),dd=document.createElement("dd");
       dt.textContent=label;dd.textContent=String(value);details.append(dt,dd);
     }
     addPerson("演者",String(p.speaker||"")+(p.affiliation?"（"+p.affiliation+"）":""));
     addPerson("司会",p.chair);
     if(details.children.length)article.append(details);
     programList.append(article);
   }
   if(sessions.length){
     sessions.forEach(renderSession);
   }else if(item.lecture_title||item.theme){
     renderSession({session_type:"講演",lecture_title:item.lecture_title||item.theme,speaker:item.speaker},0);
   }
   programSection.hidden=programList.children.length===0;
   if(item.report){document.getElementById("recordReport").textContent=item.report;document.getElementById("recordReportSection").hidden=false;}
   const photos=Array.isArray(item.photos)?item.photos:String(item.photos||"").split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean);
   if(photos.length){
    const gallery=document.getElementById("recordPhotos");
    for(const raw of photos){
      if(typeof raw!=="string")continue;
      const src=raw.trim();
      const local=/^\.\/assets\/images\/archive\/[a-zA-Z0-9_./-]+$/.test(src);
      const driveId=/^[A-Za-z0-9_-]{20,}$/.test(src);
      if(!local&&!driveId)continue;
      const image=document.createElement("img");
      image.src=driveId?"https://drive.google.com/thumbnail?id="+encodeURIComponent(src)+"&sz=w1600":src;
      image.loading="lazy";
      image.alt=item.number+"の活動記録";
      image.onerror=()=>{image.remove();if(!gallery.childElementCount)document.getElementById("recordPhotosSection").hidden=true;};
      gallery.appendChild(image);
    }
    if(gallery.childElementCount)document.getElementById("recordPhotosSection").hidden=false;
   }
 }catch(err){title.textContent="開催記録を読み込めませんでした。";console.warn(err);}
 finally{if(typeof initializePublicData==="function")initializePublicData();}
});