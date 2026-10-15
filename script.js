document.addEventListener("DOMContentLoaded",()=>{const b=document.getElementById("menuButton"),n=document.getElementById("siteNav");if(b&&n){b.addEventListener("click",()=>{const open=n.classList.toggle("open");b.setAttribute("aria-expanded",String(open))});n.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{n.classList.remove("open");b.setAttribute("aria-expanded","false")}))}const y=document.getElementById("year");if(y)y.textContent=String(new Date().getFullYear())});
/* Local data adapters. Replace JSON endpoints with GAS public JSON later. */
async function renderKampusRows(){
  const tbody=document.getElementById("membersBody");
  if(tbody){try{
    const response=await fetch("./data/members.json",{cache:"no-store"});
    if(!response.ok)throw new Error("members unavailable");
    const rows=await response.json();
    tbody.replaceChildren();
    rows.filter(x=>x.published).sort((a,b)=>a.sort_order-b.sort_order).forEach(x=>{
      const tr=document.createElement("tr");
      [x.role,x.name,x.affiliation].forEach(value=>{const td=document.createElement("td");td.textContent=value||"";tr.appendChild(td)});
      tbody.appendChild(tr);
    });
  }catch(e){tbody.replaceChildren();const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=3;td.textContent="役員一覧を表示できません。時間をおいて再度ご確認ください。";tr.appendChild(td);tbody.appendChild(tr)}}
  const grid=document.getElementById("sponsorGrid");
  if(grid){try{
    const response=await fetch("./data/sponsors.json",{cache:"no-store"});
    if(!response.ok)throw new Error("sponsors unavailable");
    const sponsors=await response.json();
    grid.replaceChildren();
    const active=sponsors.filter(x=>x.published===true).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    if(!active.length){for(let i=0;i<8;i++){const div=document.createElement("div");div.className="sponsor-placeholder";div.textContent="協賛企業バナー";grid.appendChild(div)}}
    else active.forEach(x=>{if(!x.image_path)return;const a=document.createElement("a");a.className="sponsor-link";if(/^https:\/\//.test(x.url||"")){a.href=x.url;a.target="_blank";a.rel="noopener noreferrer"}else a.removeAttribute("href");const img=document.createElement("img");img.src=x.image_path;img.alt=x.name||"協賛企業";img.loading="lazy";a.appendChild(img);grid.appendChild(a)});
  }catch(e){grid.textContent="協賛企業情報は準備中です。"}}
  }
}
document.addEventListener("DOMContentLoaded",renderKampusRows);
