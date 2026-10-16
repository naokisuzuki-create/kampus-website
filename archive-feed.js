// Shared public archive feed: GAS first, local JSON only as an offline fallback.
const ARCHIVE_API="https://script.google.com/macros/s/AKfycbyKA3zrmXWZnPaldCDmvW6ElmExiBX5HKRtzzLsJOvTI4OzR3ObaBvHXNy2jf3fJgHT/exec";
async function fetchArchiveRecords(){
 try{
  const rows=await new Promise((resolve,reject)=>{
   const tag=document.createElement("script");let done=false;const previous=window.kampusDataCallback;
   const timeout=setTimeout(()=>finish(new Error("archive API timed out")),8000);
   function finish(error,result){if(done)return;done=true;clearTimeout(timeout);tag.remove();if(previous===undefined)delete window.kampusDataCallback;else window.kampusDataCallback=previous;error?reject(error):resolve(result)}
   window.kampusDataCallback=payload=>payload&&payload.type==="archive"&&Array.isArray(payload.rows)?finish(null,payload.rows):finish(new Error("invalid archive response"));
   tag.onerror=()=>finish(new Error("archive API unavailable"));
   tag.src=ARCHIVE_API+"?type=archive&callback=kampusDataCallback&t="+Date.now();document.head.append(tag);
  });
  return rows.filter(x=>x.published===true||String(x.published).toUpperCase()==="TRUE").sort((a,b)=>Number(b.sort_order||0)-Number(a.sort_order||0));
 }catch(error){
  console.warn("Archive API unavailable; displaying backup data",error);
  const r=await fetch("./data/archive-events.json");if(!r.ok)throw error;
  return (await r.json()).map(x=>({...x,event_id:x.id,event_date:x.date,published:true,sort_order:Number((x.id||"").split("-").pop())})).sort((a,b)=>Number(b.sort_order)-Number(a.sort_order));
 }
}
