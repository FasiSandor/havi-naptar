"use client";
import {useEffect,useMemo,useState} from "react";

type CalKey="work"|"personal"|"family"|"sport";
type Ev={id:string;googleId?:string;title:string;date:string;start?:string;end?:string;allDay?:boolean;calendar:CalKey;location?:string;note?:string};
const calMeta:Record<CalKey,{label:string;color:string}>={work:{label:"Suli / Munka",color:"#3B82F6"},personal:{label:"Személyes",color:"#22C55E"},family:{label:"Család",color:"#F59E0B"},sport:{label:"Sport",color:"#8B5CF6"}};
const names=["Vasárnap","Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat"];

function iso(d:Date){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,"0");const day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function parseDate(s:string){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function monday(d:Date){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(12,0,0,0);return x}
function addDays(d:Date,n:number){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function monthLabel(d:Date){return d.toLocaleDateString("hu-HU",{year:"numeric",month:"long"})}
function toGoogleEvent(x:any):Ev{
  const start=x.start?.dateTime||x.start?.date;
  const end=x.end?.dateTime||x.end?.date;
  const day=(start||"").slice(0,10);
  return {id:"g-"+x.id,googleId:x.id,title:x.summary||"Esemény",date:day,start:x.start?.dateTime?.slice(11,16),end:x.end?.dateTime?.slice(11,16),allDay:!!x.start?.date,calendar:"work",location:x.location||"",note:x.description||""}
}

export default function Home(){
  const [anchor,setAnchor]=useState(()=>new Date());
  const [view,setView]=useState<"four"|"month"|"list">("four");
  const [events,setEvents]=useState<Ev[]>([]);
  const [selected,setSelected]=useState<Ev|null>(null);
  const [editor,setEditor]=useState<Partial<Ev>|null>(null);
  const [enabled,setEnabled]=useState<Record<CalKey,boolean>>({work:true,personal:true,family:true,sport:true});
  const [connected,setConnected]=useState(false);
  const [settings,setSettings]=useState(false);
  const [notice,setNotice]=useState("");
  const [syncing,setSyncing]=useState(false);
  const [hydrated,setHydrated]=useState(false);

  useEffect(()=>{
    try{
      setEvents(JSON.parse(localStorage.getItem("havi-events")||"[]"));
      const status=new URLSearchParams(window.location.search).get("google");
      if(status==="connected") setNotice("Google Naptár kapcsolódva.");
      if(status==="error") setNotice("A Google Naptár csatlakoztatása nem sikerült.");
      if(status==="config") setNotice("A Google OAuth beállítása még hiányzik.");
      if(status) window.history.replaceState({}, "", window.location.pathname);
    } catch {}
    finally{setHydrated(true)}
  },[]);
  useEffect(()=>{
    if(!hydrated) return;
    localStorage.setItem("havi-events",JSON.stringify(events.filter(e=>!e.googleId)))
  },[events,hydrated]);

  const start=useMemo(()=>{
    if(view==="month"){const first=new Date(anchor.getFullYear(),anchor.getMonth(),1,12);return monday(first)}
    return monday(anchor)
  },[anchor,view]);
  const count=view==="month"?42:28;
  const days=useMemo(()=>Array.from({length:count},(_,i)=>addDays(start,i)),[start,count]);
  const end=days[days.length-1];

  async function sync(){
    setSyncing(true);
    try{
      const r=await fetch(`/api/google/events?from=${start.toISOString()}&to=${addDays(end,1).toISOString()}`);
      if(!r.ok){setConnected(false);return}
      const j=await r.json();setConnected(true);
      setEvents(prev=>[...prev.filter(e=>!e.googleId),...(j.items||[]).map(toGoogleEvent)]);
    } catch {
      setConnected(false);
    } finally {
      setSyncing(false);
    }
  }
  useEffect(()=>{if(hydrated) sync().catch(()=>{})},[start.getTime(),end.getTime(),hydrated]);

  const shown=events.filter(e=>enabled[e.calendar] && days.some(d=>iso(d)===e.date)).sort((a,b)=>(a.date+(a.start||"")).localeCompare(b.date+(b.start||"")));

  async function save(x:Partial<Ev>){
    if(!(x.title||"").trim()){setNotice("Adj nevet az eseménynek.");setTimeout(()=>setNotice(""),2200);return}
    if(!x.date){setNotice("Válassz dátumot.");setTimeout(()=>setNotice(""),2200);return}
    if(!x.allDay && x.start && x.end && x.end<=x.start){setNotice("A befejezés legyen később, mint a kezdés.");setTimeout(()=>setNotice(""),2600);return}
    const base:Ev={id:x.id||crypto.randomUUID(),googleId:x.googleId,title:x.title||"Esemény",date:x.date||iso(anchor),start:x.start||"09:00",end:x.end||"10:00",allDay:!!x.allDay,calendar:(x.calendar||"work") as CalKey,location:x.location||"",note:x.note||""};
    let gId=base.googleId;
    if(connected){
      const startDate=parseDate(base.date);
      const payload={...base,start:base.allDay?base.date:`${base.date}T${base.start}:00`,end:base.allDay?iso(addDays(startDate,1)):`${base.date}T${base.end}:00`,endDate:iso(addDays(startDate,1))};
      try{
        const r=await fetch("/api/google/events",{method:gId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if(r.ok){const j=await r.json();gId=j.id||gId}
        else {setNotice("Google-szinkron hiba, az eseményt helyben elmentettem.")}
      } catch {
        setNotice("Google-szinkron hiba, az eseményt helyben elmentettem.")
      }
    }
    const next={...base,googleId:gId};
    setEvents(prev=>[...prev.filter(e=>e.id!==next.id && (!gId || e.googleId!==gId)),next]);
    setEditor(null);setSelected(next);
    if(!notice) setNotice("Esemény mentve.");
    setTimeout(()=>setNotice(""),2200);
  }

  async function remove(e:Ev){
    if(e.googleId&&connected){
      try{
        const r=await fetch("/api/google/events?id="+encodeURIComponent(e.googleId),{method:"DELETE"});
        if(!r.ok){setNotice("A Google Naptár törlése nem sikerült.")}
      } catch {setNotice("A Google Naptár törlése nem sikerült.")}
    }
    setEvents(p=>p.filter(x=>x.id!==e.id));setSelected(null);
    if(!notice) setNotice("Esemény törölve.");
    setTimeout(()=>setNotice(""),2200);
  }

  function shift(n:number){
    const d=new Date(anchor); if(view==="month") d.setMonth(d.getMonth()+n); else d.setDate(d.getDate()+28*n); setAnchor(d)
  }

  return <main className="appShell">
    <aside className="sidebar">
      <div className="brand"><div className="brandIcon">▦</div><span>HAVI <b>NAPTÁR</b></span></div>
      <nav>
        <button className="nav active">▣ <span>Naptár</span></button>
        <button className="nav" onClick={()=>setView("list")}>▤ <span>Események</span></button>
        <button className="nav" onClick={()=>setSettings(true)}>◫ <span>Naptárak</span></button>
        <button className="nav" onClick={()=>setSettings(true)}>⚙ <span>Beállítások</span></button>
      </nav>
      <div className="mini">
        <div className="miniTitle">{monthLabel(anchor)}</div>
        <div className="miniWeek"><span>H</span><span>K</span><span>Sze</span><span>Cs</span><span>P</span><span>Szo</span><span>V</span></div>
        <div className="miniGrid">{days.slice(0,28).map(d=><button key={iso(d)} className={iso(d)===iso(anchor)?"today":""} onClick={()=>setAnchor(d)}>{d.getDate()}</button>)}</div>
      </div>
      <div className="calList">
        <h4>Naptárak</h4>
        {(Object.keys(calMeta) as CalKey[]).map(k=><label key={k}><i style={{background:calMeta[k].color}}/><span>{calMeta[k].label}</span><input type="checkbox" checked={enabled[k]} onChange={e=>setEnabled({...enabled,[k]:e.target.checked})}/></label>)}
      </div>
    </aside>

    <section className="content">
      <header className="topbar">
        <div className="headLeft"><button className="iconBtn" onClick={()=>shift(-1)}>‹</button><button className="iconBtn" onClick={()=>shift(1)}>›</button><button className="todayBtn" onClick={()=>setAnchor(new Date())}>Ma</button><h1>{monthLabel(anchor)}</h1></div>
        <div className="viewSwitch">
          <button className={view==="four"?"on":""} onClick={()=>setView("four")}>4 hét</button>
          <button className={view==="month"?"on":""} onClick={()=>setView("month")}>Hónap</button>
          <button className={view==="list"?"on":""} onClick={()=>setView("list")}>Lista</button>
        </div>
        <div className="actions">
          <button className="secondary" onClick={()=>window.print()}>⎙ PDF / Nyomtatás</button><button className="syncBtn" onClick={()=>sync()} disabled={syncing}>{syncing?"Szinkron…":connected?"↻ Szinkron":"○ Offline"}</button>
          <button className="primary" onClick={()=>setEditor({date:iso(anchor),calendar:"work",start:"09:00",end:"10:00"})}>＋ Esemény</button>
        </div>
      </header>

      {view==="list"?<div className="listView">
        {shown.length?shown.map(e=><button key={e.id} className="listItem" onClick={()=>setSelected(e)}>
          <div className="listDate"><b>{parseDate(e.date).getDate()}</b><span>{names[parseDate(e.date).getDay()].slice(0,3)}</span></div>
          <i style={{background:calMeta[e.calendar].color}}/><div><strong>{e.title}</strong><small>{e.allDay?"Egész napos":(e.start||"")+" – "+(e.end||"")}</small></div>
        </button>):<div className="empty">Nincs esemény ebben az időszakban.</div>}
      </div>:<div className={"calendar "+(view==="month"?"month":"four")}>
        <div className="weekHeader"><span>Hétfő</span><span>Kedd</span><span>Szerda</span><span>Csütörtök</span><span>Péntek</span><span>Szombat</span><span>Vasárnap</span></div>
        <div className="grid">{days.map(d=>{
          const dayEvents=shown.filter(e=>e.date===iso(d));
          return <button key={iso(d)} className={"day "+(iso(d)===iso(anchor)?"selectedDay":"")} onClick={()=>setAnchor(d)} onDoubleClick={()=>setEditor({date:iso(d),calendar:"work",start:"09:00",end:"10:00"})}>
            <div className="dayNum">{d.getDate()}</div>
            <div className="eventStack">{dayEvents.map(e=><span key={e.id} className="eventChip" style={{"--event":calMeta[e.calendar].color} as React.CSSProperties} onClick={ev=>{ev.stopPropagation();setSelected(e)}}><b>{e.allDay?"":e.start+" "}</b>{e.title}</span>)}</div>
          </button>
        })}</div>
      </div>}
    </section>

    {notice&&<div className="toast">{notice}</div>}
    <button className="fab" onClick={()=>setEditor({date:iso(anchor),calendar:"work",start:"09:00",end:"10:00"})}>＋</button>

    {editor&&<Modal title={editor.id?"Esemény szerkesztése":"Esemény hozzáadása"} onClose={()=>setEditor(null)}>
      <EventForm value={editor} onSave={save} onCancel={()=>setEditor(null)}/>
    </Modal>}

    {selected&&<Modal title="Esemény részletei" onClose={()=>setSelected(null)}>
      <div className="detail">
        <div className="detailTitle"><i style={{background:calMeta[selected.calendar].color}}/><div><h2>{selected.title}</h2><span>{calMeta[selected.calendar].label}</span></div></div>
        <p>▣ {parseDate(selected.date).toLocaleDateString("hu-HU",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}</p>
        <p>◷ {selected.allDay?"Egész napos":`${selected.start} – ${selected.end}`}</p>
        {selected.location&&<p>⌖ {selected.location}</p>}{selected.note&&<p>▤ {selected.note}</p>}
        <div className="modalActions"><button className="danger" onClick={()=>remove(selected)}>Törlés</button><button className="secondary" onClick={()=>{setEditor(selected);setSelected(null)}}>Szerkesztés</button><button className="secondary" onClick={()=>setEditor({...selected,id:undefined,googleId:undefined,title:selected.title+" másolat"})}>Másolás</button></div>
      </div>
    </Modal>}

    {settings&&<Modal title="Naptár kapcsolat" onClose={()=>setSettings(false)}>
      <div className="settingsBox"><div className={"status "+(connected?"ok":"")}><i/> <div><b>{connected?"Google Naptár kapcsolódva":"Google Naptár nincs kapcsolva"}</b><span>{connected?"Az iPhone-on használt Google Naptár eseményei automatikusan megjelennek itt.":"Kapcsold össze egyszer, utána a két irányú szinkron automatikus."}</span></div></div>
      <button className="primary wide" onClick={()=>location.href="/api/google/connect"}>{connected?"Újracsatlakozás":"Google Naptár csatlakoztatása"}</button>
      </div>
    </Modal>}
  </main>
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
  return <div className="backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><div className="modal"><div className="modalHead"><b>{title}</b><button onClick={onClose}>×</button></div>{children}</div></div>
}
function EventForm({value,onSave,onCancel}:{value:Partial<Ev>;onSave:(x:Partial<Ev>)=>void;onCancel:()=>void}){
  const [x,setX]=useState(value);
  return <div className="form">
    <label><span>Cím</span><input value={x.title||""} onChange={e=>setX({...x,title:e.target.value})} placeholder="Esemény neve"/></label>
    <div className="two"><label><span>Dátum</span><input type="date" value={x.date||""} onChange={e=>setX({...x,date:e.target.value})}/></label><label className="toggleLabel"><span>Egész napos</span><input type="checkbox" checked={!!x.allDay} onChange={e=>setX({...x,allDay:e.target.checked})}/></label></div>
    {!x.allDay&&<div className="two"><label><span>Kezdés</span><input type="time" value={x.start||""} onChange={e=>setX({...x,start:e.target.value})}/></label><label><span>Vége</span><input type="time" value={x.end||""} onChange={e=>setX({...x,end:e.target.value})}/></label></div>}
    <label><span>Naptár</span><select value={x.calendar||"work"} onChange={e=>setX({...x,calendar:e.target.value as CalKey})}>{(Object.keys(calMeta) as CalKey[]).map(k=><option key={k} value={k}>{calMeta[k].label}</option>)}</select></label>
    <label><span>Helyszín</span><input value={x.location||""} onChange={e=>setX({...x,location:e.target.value})} placeholder="Opcionális"/></label>
    <label><span>Megjegyzés</span><textarea value={x.note||""} onChange={e=>setX({...x,note:e.target.value})} placeholder="Opcionális"/></label>
    <div className="modalActions"><button className="secondary" onClick={onCancel}>Mégse</button><button className="primary" onClick={()=>onSave(x)}>Mentés</button></div>
  </div>
}