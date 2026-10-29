document.addEventListener("DOMContentLoaded",async()=>{
 const id=new URLSearchParams(location.search).get("id");
 const title=document.getElementById("recordTitle");
 const number=document.getElementById("recordNumber");
 const dl=document.getElementById("recordFields");
 // The sponsor widget loads independently and must not delay the archive.
 const sponsorsPromise=typeof initializePublicData==="function"
   ? Promise.resolve().then(()=>initializePublicData()).catch(err=>console.warn("Sponsor widget unavailable",err))
   : Promise.resolve();
 // Start both independent static requests together instead of serially.
 const programPromise=fetchArchiveProgram();
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
   const programRows=await programPromise;
   const sessions=Array.isArray(programRows)
     ? programRows.filter(p=>p.event_id===id&&(p.published===true||String(p.published).toUpperCase()==="TRUE"))
       .sort((a,b)=>Number(a.sort_order)-Number(b.sort_order))
     : [];
   function photoSources(value){
     return (Array.isArray(value)?value:String(value||"").split(/\r?\n|,/)).map(x=>String(x).trim()).filter(Boolean);
   }
   function appendGallery(host,value){
     const sources=photoSources(value);
     if(!sources.length)return false;
     const gallery=document.createElement("div");gallery.className="archive-photo-grid";
     for(const src of sources){
       const local=/^\.\/assets\/images\/archive\/[a-zA-Z0-9_./-]+$/.test(src);
       const driveId=/^[A-Za-z0-9_-]{20,}$/.test(src);
       if(!local&&!driveId)continue;
       const image=document.createElement("img");
       image.src=driveId?"https://drive.google.com/thumbnail?id="+encodeURIComponent(src)+"&sz=w1600":src;
       image.alt=item.number+" 講演記録";image.loading="lazy";
       image.onerror=()=>{image.remove();};
       gallery.appendChild(image);
     }
     if(!gallery.childElementCount)return false;
     if(gallery.childElementCount===1)gallery.classList.add("archive-photo-grid--single");
     if(id==="KAMPUS-011"||id==="KAMPUS-013"||id==="KAMPUS-014"||id==="KAMPUS-017")gallery.classList.add("archive-photo-grid--compact");
     host.appendChild(gallery);return true;
   }
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
     if(p.photos)appendGallery(article,p.photos);
     programList.append(article);
   }
   const legacyPhotos=photoSources(item.photos);
   const hasProgramPhotos=sessions.some(p=>photoSources(p.photos).length>0);
   if(sessions.length){
     // Temporary compatibility for the 8th meeting until the updated GAS API is deployed.
     if(id==="KAMPUS-008"&&!hasProgramPhotos&&legacyPhotos.length===5){
       sessions.forEach((p,i)=>{p.photos=i===0?legacyPhotos[0]:i===1?legacyPhotos[1]:i===2?legacyPhotos.slice(2).join("\n"):"";});
     }
     sessions.forEach(renderSession);
   }else if(item.lecture_title||item.theme){
     renderSession({session_type:"講演",lecture_title:item.lecture_title||item.theme,speaker:item.speaker},0);
   }
   programSection.hidden=programList.children.length===0;
   if(id==="KAMPUS-013"){
     const poster=document.getElementById("recordPoster");
     const link=document.createElement("a");
     link.href="https://drive.google.com/file/d/1iwjtTilIwX2-Pu0R2KEijqF-sVGAeYRg/view";
     link.target="_blank";link.rel="noopener noreferrer";
     const img=document.createElement("img");
     img.src="https://drive.google.com/thumbnail?id=1iwjtTilIwX2-Pu0R2KEijqF-sVGAeYRg&sz=w1200";
     img.alt="第13回 関西血液浄化研究会 開催ポスター";
     img.loading="lazy";
     link.appendChild(img);poster.appendChild(link);
     document.getElementById("recordPosterSection").hidden=false;
   }
   if(id==="KAMPUS-015"){
     const poster=document.getElementById("recordPoster");
     poster.classList.add("archive-poster--two");
     const posterIds=["1NMfqLfznWD5FyqVkFCqLqA4uVxWr0Sis","1d53JGZC48MR0T7rqNBE7OC_Ppg3KgbL_"];
     posterIds.forEach((fileId,index)=>{
       const link=document.createElement("a");
       link.href="https://drive.google.com/file/d/"+fileId+"/view";
       link.target="_blank";link.rel="noopener noreferrer";
       const img=document.createElement("img");
       img.src="https://drive.google.com/thumbnail?id="+fileId+"&sz=w1200";
       img.alt="第15回 関西血液浄化研究会 開催ポスター "+(index+1)+"ページ目";
       img.loading="lazy";
       link.appendChild(img);poster.appendChild(link);
     });
     document.getElementById("recordPosterSection").hidden=false;
   }
   if(id==="KAMPUS-017"){
     const poster=document.getElementById("recordPoster");
     const fileId="1D9Eq_j4Q_QWBu11zlhlf8ueRiEnhiwjn";
     const link=document.createElement("a");
     link.href="https://drive.google.com/file/d/"+fileId+"/view";
     link.target="_blank";link.rel="noopener noreferrer";
     const img=document.createElement("img");
     img.src="https://drive.google.com/thumbnail?id="+fileId+"&sz=w1200";
     img.alt="第17回 関西血液浄化研究会 開催ポスター";
     img.loading="lazy";
     link.appendChild(img);poster.appendChild(link);
     document.getElementById("recordPosterSection").hidden=false;
   }
   if(id==="KAMPUS-018"){
     const poster=document.getElementById("recordPoster");
     const fileId="1YXwhE19fB_a1C0Jjv8W_FTWO9oWdTduF";
     const link=document.createElement("a");
     link.href="https://drive.google.com/file/d/"+fileId+"/view";
     link.target="_blank";link.rel="noopener noreferrer";
     const img=document.createElement("img");
     img.src="https://drive.google.com/thumbnail?id="+fileId+"&sz=w1200";
     img.alt="第18回 関西血液浄化研究会 開催チラシ";
     img.loading="lazy";
     link.appendChild(img);poster.appendChild(link);
     document.getElementById("recordPosterSection").hidden=false;
   }
   if(id==="KAMPUS-019"){
     const poster=document.getElementById("recordPoster");
     const fileId="1w0UI-cEqBg5gYa8U6HwoWKKhWyLmv1d4";
     const link=document.createElement("a");
     link.href="https://drive.google.com/file/d/"+fileId+"/view";
     link.target="_blank";link.rel="noopener noreferrer";
     const img=document.createElement("img");
     img.src="https://drive.google.com/thumbnail?id="+fileId+"&sz=w1200";
     img.alt="第19回 関西血液浄化研究会 開催チラシ";
     img.loading="lazy";
     link.appendChild(img);poster.appendChild(link);
     document.getElementById("recordPosterSection").hidden=false;
   }
   if(id==="KAMPUS-021"){
     const poster=document.getElementById("recordPoster");
     const fileId="1Hy2wju2zQeAy9V_OA7-oJAd6rpY18uoF";
     const link=document.createElement("a");
     link.href="./assets/images/archive/kampus-021-flyer.png";
     link.target="_blank";link.rel="noopener noreferrer";
     const img=document.createElement("img");
     img.src="./assets/images/archive/kampus-021-flyer.png";
     img.alt="第21回 関西血液浄化研究会 開催チラシ";
     img.loading="lazy";
     link.appendChild(img);poster.appendChild(link);
     document.getElementById("recordPosterSection").hidden=false;
   }
   if(id==="KAMPUS-022"){
     const poster=document.getElementById("recordPoster");
     const fileId="1T3zk0E0YQEioFgwYDqUDOGYUs0nBLKvn";
     const link=document.createElement("a");
     link.href="./assets/images/archive/kampus-022-flyer.png";
     link.target="_blank";link.rel="noopener noreferrer";
     const img=document.createElement("img");
     img.src="./assets/images/archive/kampus-022-flyer.png";
     img.alt="第22回 関西血液浄化研究会 開催チラシ";
     img.loading="lazy";
     link.appendChild(img);poster.appendChild(link);
     document.getElementById("recordPosterSection").hidden=false;
   }
   if(item.report){document.getElementById("recordReport").textContent=item.report;document.getElementById("recordReportSection").hidden=false;}
   const photos=Array.isArray(item.photos)?item.photos:String(item.photos||"").split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean);
   if(photos.length&&!sessions.some(p=>photoSources(p.photos).length>0)){
    const gallery=document.getElementById("recordPhotos");
    if(id==="KAMPUS-013"||id==="KAMPUS-014")gallery.classList.add("archive-photo-grid","archive-photo-grid--compact");
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
 finally{const loading=document.getElementById("archiveLoading");if(loading)loading.hidden=true;}
});