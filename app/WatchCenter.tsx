"use client";
import {useEffect,useMemo,useState} from "react";

type WatchItem={id:string;title:string;url:string;summary:string;source:string;published:string|null;category:string};
type Suggestion={id:string;source_app:string;title:string;summary?:string|null;source_url?:string|null;created_at:string};
const groups=[
 {id:"all",icon:"◉",label:"Összes"},
 {id:"grants",icon:"Ft",label:"Pénz és pályázatok"},
 {id:"ai",icon:"✦",label:"AI és fejlesztés"},
 {id:"jobs",icon:"▣",label:"Állás és munka"},
 {id:"education",icon:"▤",label:"Oktatás és kutatás"},
 {id:"local",icon:"⌂",label:"Önkormányzatok"},
 {id:"foundation",icon:"♡",label:"Alapítványok"},
 {id:"calendar",icon:"▦",label:"Naptárjavaslatok"}
];
const sources=[
 {category:"grants",label:"Pályázati Portál – hivatalos felhívások",url:"https://www.palyazat.gov.hu/"},
 {category:"ai",label:"NKFIH – aktuális fejlesztési pályázatok",url:"https://nkfih.gov.hu/palyazoknak/palyazatok/aktualis-felhivasok"},
 {category:"ai",label:"EU Funding & Tenders – uniós források",url:"https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home"},
 {category:"jobs",label:"Közszolgállás – állami munkalehetőségek",url:"https://kozszolgallas.ksz.gov.hu/"},
 {category:"education",label:"Tempus Közalapítvány – oktatási pályázatok",url:"https://tka.hu/"},
 {category:"foundation",label:"Bethlen Gábor Alapkezelő – pályázatok",url:"https://bgazrt.hu/"},
 {category:"foundation",label:"Nemzeti Együttműködési Alap",url:"https://civil.info.hu/nea"},
 {category:"local",label:"Mezőtúr önkormányzat",url:"https://mezotur.hu/"},
 {category:"local",label:"Jász-Nagykun-Szolnok vármegye",url:"https://www.jnszvarmegye.hu/"}
];
const key="havi-watch-center-seen-v1";
export default function WatchCenter({suggestions,onDecision}:{suggestions:Suggestion[];onDecision:(id:string,action:"accept"|"reject")=>void}){
 const [open,setOpen]=useState(false),[group,setGroup]=useState("all"),[query,setQuery]=useState("");
 const [items,setItems]=useState<WatchItem[]>([]),[seen,setSeen]=useState<string[]>([]);
 const [status,setStatus]=useState("Még nem frissült"),[loading,setLoading]=useState(false);
 useEffect(()=>{try{setSeen(JSON.parse(localStorage.getItem(key)||"[]"))}catch{}},[]);
 useEffect(()=>{if(!open)return;let active=true;setLoading(true);fetch("/api/watch-feed",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(!active)return;setItems(Array.isArray(d.items)?d.items:[]);const good=(d.sources||[]).filter((s:{status:string})=>s.status==="ok").length;setStatus(good?good+" hivatalos hírforrás ellenőrizve":"A hírforrások jelenleg nem elérhetők")}).catch(()=>{if(active)setStatus("Frissítés nem sikerült")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[open]);
 const mark=(id:string)=>setSeen(prev=>{const v=[...new Set([...prev,id])].slice(-300);try{localStorage.setItem(key,JSON.stringify(v))}catch{}return v});
 const filtered=useMemo(()=>items.filter(x=>(group==="all"||group===x.category)&&(x.title+" "+x.summary+" "+x.source).toLowerCase().includes(query.toLowerCase())),[items,group,query]);
 const pending=suggestions.length;
 return <div className="haviWatchArea">
  <button type="button" className="haviWatchTrigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
   <span className="haviWatchIcon">◎</span><span className="haviWatchTriggerCopy"><b>Figyelési Központ</b><small>Pályázatok · AI-fejlesztés · állások · értesítések</small></span>
   {pending>0&&<span className="haviWatchCount">{pending} javaslat</span>}
   <span aria-hidden="true">{open?"⌃":"⌄"}</span>
  </button>
  {open&&<section className="haviWatchPanel" aria-label="Figyelési Központ">
    <p className="haviWatchInfo">Hivatalos RSS-hírek és források, témák szerint. A találatok nem jelentenek automatikusan nyitott pályázatot vagy jogosultságot: ezt a kiírásnál ellenőrizd.</p>
    <div className="haviWatchCategories">{groups.map(g=><button type="button" key={g.id} className={group===g.id?"selected":""} onClick={()=>setGroup(g.id)}><span>{g.icon}</span>{g.label}{g.id==="calendar"&&pending>0?" ("+pending+")":""}</button>)}</div>
    <div className="haviWatchToolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Keresés: AI, támogatás, oktatás…" aria-label="Figyelési központ keresés"/><span>{loading?"Frissítés…":status}</span></div>
    {group==="calendar"?<div className="haviWatchResults">{suggestions.length?suggestions.map(s=><article key={s.id} className="haviWatchEntry"><small>Naptárba javasolt · {s.source_app}</small><strong>{s.title}</strong>{s.summary&&<p>{s.summary}</p>}<div className="haviWatchActions">{s.source_url&&/^https:\/\//.test(s.source_url)&&<a href={s.source_url} target="_blank" rel="noopener noreferrer">Forrás ↗</a>}<button type="button" onClick={()=>onDecision(s.id,"accept")}>Naptárba</button><button type="button" onClick={()=>onDecision(s.id,"reject")}>Elutasítás</button></div></article>):<p className="haviWatchEmpty">Nincs jóváhagyásra váró naptáresemény.</p>}</div>:<>
      <div className="haviWatchResults">{filtered.length?filtered.map(x=><article key={x.id} className={"haviWatchEntry "+(seen.includes(x.id)?"haviWatchSeen":"")}><small>{x.source}{x.published?" · "+new Date(x.published).toLocaleDateString("hu-HU"):""}{seen.includes(x.id)?" · Megnézve":""}</small><strong>{x.title}</strong>{x.summary&&<p>{x.summary}</p>}<div className="haviWatchActions"><a href={x.url} target="_blank" rel="noopener noreferrer" onClick={()=>mark(x.id)}>Hivatalos közlemény ↗</a><button type="button" onClick={()=>mark(x.id)}>Megnéztem ✓</button></div></article>):<p className="haviWatchEmpty">{loading?"Hivatalos hírek lekérése…":"Ebben a témában jelenleg nincs beolvasott hír. Az alábbi források megnyithatók."}</p>}</div>
      <h4 className="haviWatchSubheading">Hivatalos források</h4><div className="haviWatchSources">{sources.filter(x=>group==="all"||x.category===group).map(x=><a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer">{x.label} <span>↗</span></a>)}</div>
    </>}
    <p className="haviWatchFoot">Első verzió: RSS-hírek frissítése megnyitáskor, a megtekintett jelzések ezen az eszközön tárolódnak. Automatikus háttérértesítés és jogosultságvizsgálat még nincs bekapcsolva.</p>
  </section>}
 </div>;
}
