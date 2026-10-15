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
  initializePublicData();
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
