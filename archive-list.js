document.addEventListener("DOMContentLoaded",async()=>{
 const root=document.getElementById("archiveList");if(!root)return;
 try{const records=await fetchArchiveRecords();root.replaceChildren();
 if(!records.length){root.textContent="現在、公開中の開催記録はありません。";return;}
 records.forEach(item=>{
  const a=document.createElement("a");a.className="archive-list-item";a.href="./archive-detail.html?id="+encodeURIComponent(item.event_id);
  const meta=document.createElement("div");meta.className="archive-list-meta";
  const num=document.createElement("span");num.className="archive-number";num.textContent=String(item.number||"");
  const date=document.createElement("span");date.textContent=String(item.event_date||"日付未確認");meta.append(num,date);
  const main=document.createElement("div");main.className="archive-list-main";
  const h=document.createElement("h2");h.textContent=String(item.title||"開催記録");
  const p=document.createElement("p");p.textContent=String(item.theme||"");main.append(h,p);
  const arrow=document.createElement("span");arrow.className="archive-list-arrow";arrow.setAttribute("aria-hidden","true");arrow.textContent="→";
  a.append(meta,main,arrow);root.append(a);
 });
 }catch(err){root.textContent="開催記録を読み込めませんでした。";console.warn(err);}
});