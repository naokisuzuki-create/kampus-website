// KaMPUS public feed: GAS JSONP with local JSON fallback.
const KAMPUS_GAS_URL = "https://script.google.com/macros/s/AKfycbyKA3zrmXWZnPaldCDmvW6ElmExiBX5HKRtzzLsJOvTI4OzR3ObaBvHXNy2jf3fJgHT/exec";
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menuButton");
  const nav = document.getElementById("siteNav");
  if(menu && nav){
    menu.addEventListener("click", () => {const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));});
    nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");}));
  }
  const year=document.getElementById("year");if(year)year.textContent=String(new Date().getFullYear());
  if(document.getElementById('seminarDetail')) renderSeminarDetail().finally(initializePublicData);
  else renderKampusSeminars().finally(initializePublicData);
});

function loadGasFeed(type){
  return new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    let done=false;
    const timeout=setTimeout(()=>finish(new Error("GAS response timeout")),10000);
    const old=window.kampusDataCallback;
    function finish(error,rows){
      if(done)return;done=true;clearTimeout(timeout);script.remove();
      if(old===undefined)delete window.kampusDataCallback;else window.kampusDataCallback=old;
      if(error)reject(error);else resolve(rows);
    }
    window.kampusDataCallback=(payload)=>{
      if(!payload||payload.type!==type||!Array.isArray(payload.rows)){finish(new Error("Invalid GAS response"));return;}
      finish(null,payload.rows);
    };
    script.onerror=()=>finish(new Error("GAS script failed"));
    script.src=KAMPUS_GAS_URL+"?type="+encodeURIComponent(type)+"&callback=kampusDataCallback&t="+Date.now();
    document.head.appendChild(script);
  });
}
async function loadPublicRows(type){
  try{return await loadGasFeed(type);}
  catch(error){
    console.warn("KaMPUS GAS unavailable; using local data",type,error);
    const response=await fetch("./data/"+type+".json",{cache:"no-store"});
    if(!response.ok)throw new Error("Local data unavailable");
    return await response.json();
  }
}
const isPublished=x=>x.published===true||String(x.published).toUpperCase()==="TRUE";
function compareSort(a,b){return Number(a.sort_order||0)-Number(b.sort_order||0);}
async function initializePublicData(){
  const tbody=document.getElementById("membersBody");
  if(tbody){
    try{
      const rows=(await loadPublicRows("members")).filter(isPublished).sort(compareSort);
      tbody.replaceChildren();
      if(!rows.length)throw new Error("No published members");
      rows.forEach(item=>{
        const tr=document.createElement("tr");
        [item.role,item.name,item.affiliation].forEach(value=>{
          const cell=document.createElement("td");cell.textContent=String(value??"");tr.appendChild(cell);
        });
        tbody.appendChild(tr);
      });
    }catch(err){tbody.replaceChildren();const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=3;td.textContent="役員一覧を読み込めませんでした。";tr.appendChild(td);tbody.appendChild(tr);}
  }
  const grid=document.getElementById("sponsorGrid");
  if(grid){
    try{
      const rows=(await loadPublicRows("sponsors")).filter(isPublished).sort(compareSort);
      grid.replaceChildren();
      const display=rows.filter(x=>x.image_path);
      if(!display.length){
        for(let i=0;i<8;i++){const tile=document.createElement("div");tile.className="sponsor-placeholder";tile.textContent="協賛企業バナー";grid.appendChild(tile);}
        return;
      }
      display.forEach(item=>{
        const a=document.createElement("a");a.className="sponsor-link";
        if(typeof item.url==="string"&&/^https:\/\//i.test(item.url)){a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";}
        const image=document.createElement("img");image.src=item.image_path;image.alt=String(item.name||"協賛企業");image.loading="lazy";a.appendChild(image);grid.appendChild(a);
      });
    }catch(err){grid.textContent="協賛企業情報は準備中です。";}
  }
}

/* Load the seminar feed first; the legacy GAS endpoint uses one JSONP callback name. */
async function renderKampusSeminars(){
  const list=document.getElementById("seminarList");if(!list)return;
  try{
    const all=await loadPublicRows("seminars");
    list.replaceChildren();
    const rows=all.filter(isPublished).sort(compareSort);
    if(!rows.length){const empty=document.createElement("p");empty.className="seminar-empty";empty.textContent="現在、掲載中のセミナー案内はありません。";list.appendChild(empty);return;}
    rows.forEach(item=>{
      const card=document.createElement("article");card.className="seminar-card seminar-card-clickable";
      const eventId=String(item.event_id||"").trim();const detailLink=eventId?"./seminar.html?id="+encodeURIComponent(eventId):"";
      if(detailLink){card.setAttribute("tabindex","0");card.setAttribute("role","link");card.setAttribute("aria-label",String(item.title||"セミナー")+"の詳細を見る");card.addEventListener("click",e=>{if(!e.target.closest("a"))location.href=detailLink;});card.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.target.closest("a"))location.href=detailLink;});}
      const media=document.createElement("div");media.className="seminar-media";
      if(typeof item.image_path==="string"&&/^(\.\/assets\/images\/|https:\/\/)/.test(item.image_path)){
        const img=document.createElement("img");img.src=item.image_path;img.alt=String(item.title||"セミナー")+" の案内画像";img.loading="lazy";media.appendChild(img);
      }else{const placeholder=document.createElement("div");placeholder.className="seminar-media-placeholder";placeholder.textContent="セミナーの案内画像を準備中です";media.appendChild(placeholder);}
      const body=document.createElement("div");body.className="seminar-body";
      const kicker=document.createElement("p");kicker.className="card-kicker";kicker.textContent="SEMINAR INFORMATION";body.appendChild(kicker);
      const heading=document.createElement("h3");heading.textContent=String(item.title||"セミナー開催案内");body.appendChild(heading);
      const dl=document.createElement("dl");dl.className="seminar-fields";
      const fields=[["開催日時",[item.event_date,item.event_time].filter(Boolean).join(" ")],["開催場所",item.venue],["当番幹事",item.organizer],["講演内容",item.lectures]];
      fields.forEach(([label,value])=>{if(!value)return;const dt=document.createElement("dt");dt.textContent=label;const dd=document.createElement("dd");dd.textContent=String(value);dl.append(dt,dd);});
      body.appendChild(dl);
      const links=document.createElement("div");links.className="seminar-links";
      [["detail_url","開催案内を見る","secondary"],["application_url","参加申し込み",""]].forEach(([key,label,klass])=>{const url=item[key];if(typeof url!=="string"||!/^https:\/\//i.test(url))return;const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label;if(klass)a.className=klass;links.appendChild(a);});
      if(detailLink){const a=document.createElement("a");a.href=detailLink;a.className="secondary";a.textContent="セミナー詳細を見る →";links.prepend(a);}
      if(links.childElementCount)body.appendChild(links);
      card.append(media,body);list.appendChild(card);
    });
  }catch(e){list.replaceChildren();const msg=document.createElement("p");msg.className="seminar-empty";msg.textContent="セミナー情報を取得できませんでした。";list.appendChild(msg);console.warn("seminar feed",e);}
}

function addDetailField(parent,label,value){
 if(!value)return;const dt=document.createElement("dt");dt.textContent=label;
 const dd=document.createElement("dd");dd.textContent=String(value);parent.append(dt,dd);
}
async function renderSeminarDetail(){
 const host=document.getElementById("seminarDetail");if(!host)return;
 const id=new URLSearchParams(location.search).get("id");
 if(!id){host.textContent="セミナーが指定されていません。";return;}
 try{
  const rows=await loadPublicRows("seminars");
  const item=rows.find(x=>isPublished(x)&&String(x.event_id)===id);
  if(!item){host.textContent="指定されたセミナーは見つかりませんでした。";return;}
  document.title=String(item.title||"セミナー")+" | 関西血液浄化研究会";
  const title=document.getElementById("detailTitle"), theme=document.getElementById("detailTheme");
  title.textContent=String(item.title||"セミナーのご案内");
  theme.textContent=String(item.lectures||"");
  const fields=document.getElementById("detailFields");
  addDetailField(fields,"開催日時",[item.event_date,item.event_time].filter(Boolean).join(" "));
  addDetailField(fields,"開催場所",item.venue);
  addDetailField(fields,"当番幹事",item.organizer);
  addDetailField(fields,"講演内容",item.lectures);
  const poster=document.getElementById("detailPoster");
  if(typeof item.image_path==="string"&&/^(\.\/assets\/images\/|https:\/\/)/.test(item.image_path)){
    const img=document.createElement("img");img.src=item.image_path;img.alt=String(item.title||"セミナー")+"の開催案内";poster.appendChild(img);
  }else poster.textContent="開催案内画像は準備中です。";
  const notice=document.getElementById("detailAnnouncement");
  if(item.announcement){notice.textContent=String(item.announcement);document.getElementById("detailNarrativeSection").hidden=false;}
  const posters=document.getElementById("detailExtraPoster");
  [item.poster_path_1,item.poster_path_2].forEach((path,index)=>{
    if(typeof path!=="string"||!^(\.\/assets\/images\/|https:\/\/).test(path))return;
    const frame=document.createElement("figure");frame.className="detail-poster-item";
    const pic=document.createElement("img");pic.src=path;pic.alt=index===0?"開催案内ポスター":"講演プログラム";pic.loading="lazy";
    const caption=document.createElement("figcaption");caption.textContent=index===0?"開催案内":"プログラム";
    frame.append(pic,caption);posters.appendChild(frame);
  });
  if(posters.childElementCount)document.getElementById("detailPosterSection").hidden=false;
  const actions=document.getElementById("detailActions");
  [["application_url","参加・お申し込み"],["detail_url","開催案内・関連資料"]].forEach(([key,label])=>{
    if(typeof item[key]==="string"&&/^https:\/\//i.test(item[key])){
      const a=document.createElement("a");a.href=item[key];a.target="_blank";a.rel="noopener noreferrer";a.className="detail-cta";a.textContent=label+" ↗";actions.appendChild(a);
    }
  });
  if(!actions.childElementCount){const p=document.createElement("p");p.className="small-note";p.textContent="参加方法・詳細情報は準備中です。";actions.appendChild(p);}
  host.hidden=false;
  document.getElementById("detailLoading").hidden=true;
 }catch(e){document.getElementById("detailLoading").textContent="開催情報を取得できませんでした。";console.warn(e);}
}
