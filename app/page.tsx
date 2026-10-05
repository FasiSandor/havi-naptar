"use client";
import {useEffect,useMemo,useRef,useState} from "react";

type CalKey="work"|"personal"|"family"|"sport";
type RangeMode="1w"|"2w"|"4w"|"month"|"custom"|"list";
type Ev={id:string;googleId?:string;title:string;date:string;start?:string;end?:string;allDay?:boolean;calendar:CalKey;location?:string;note?:string};

const calMeta:Record<CalKey,{label:string;color:string;icon:string}>={
  work:{label:"Suli / Munka",color:"#3B82F6",icon:"▦"},
  personal:{label:"Személyes",color:"#22C55E",icon:"●"},
  family:{label:"Család",color:"#F59E0B",icon:"⌂"},
  sport:{label:"Sport",color:"#22D3EE",icon:"◆"}
};
const dayNames=["Vasárnap","Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat"];
const shortDays=["V","H","K","Sze","Cs","P","Szo"];

function iso(d:Date){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,"0");const day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function parseDate(s:string){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d,12)}
function monday(d:Date){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(12,0,0,0);return x}
function addDays(d:Date,n:number){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function daysBetween(a:Date,b:Date){return Math.floor((parseDate(iso(b)).getTime()-parseDate(iso(a)).getTime())/86400000)+1}
function monthLabel(d:Date){return d.toLocaleDateString("hu-HU",{year:"numeric",month:"long"})}
function fmtRange(a:Date,b:Date){return a.toLocaleDateString("hu-HU",{month:"short",day:"numeric"})+" – "+b.toLocaleDateString("hu-HU",{month:"short",day:"numeric"})}
function mins(t?:string){if(!t)return 9*60;const [h,m]=t.split(":").map(Number);return h*60+m}
function hhmm(m:number){m=Math.max(0,Math.min(23*60+45,m));return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`}
function duration(e:Ev){return Math.max(15,mins(e.end)-mins(e.start))}
function toGoogleEvent(x:any):Ev{
  const start=x.start?.dateTime||x.start?.date;
  return {id:"g-"+x.id,googleId:x.id,title:x.summary||"Esemény",date:(start||"").slice(0,10),start:x.start?.dateTime?.slice(11,16),end:x.end?.dateTime?.slice(11,16),allDay:!!x.start?.date,calendar:"work",location:x.location||"",note:x.description||""}
}

export default function Home(){
  const [anchor,setAnchor]=useState(()=>new Date());
  const [mode,setMode]=useState<RangeMode>("4w");
  const [customStart,setCustomStart]=useState(()=>iso(new Date()));
  const [customEnd,setCustomEnd]=useState(()=>iso(addDays(new Date(),13)));
  const [events,setEvents]=useState<Ev[]>([]);
  const [dayOpen,setDayOpen]=useState<string|null>(null);
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
    }catch{}
    finally{setHydrated(true)}
  },[]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-events",JSON.stringify(events.filter(e=>!e.googleId)))},[events,hydrated]);

  const {start,count}=useMemo(()=>{
    if(mode==="custom"){
      const a=parseDate(customStart),b=parseDate(customEnd);
      return {start:a,count:Math.max(1,Math.min(62,daysBetween(a,b)))};
    }
    if(mode==="month"){const first=new Date(anchor.getFullYear(),anchor.getMonth(),1,12);return {start:monday(first),count:42}}
    if(mode==="1w")return {start:monday(anchor),count:7};
    if(mode==="2w")return {start:monday(anchor),count:14};
    return {start:monday(anchor),count:28};
  },[anchor,mode,customStart,customEnd]);

  const days=useMemo(()=>Array.from({length:count},(_,i)=>addDays(start,i)),[start,count]);
  const end=days[days.length-1];
  const shown=events.filter(e=>enabled[e.calendar]&&days.some(d=>iso(d)===e.date)).sort((a,b)=>(a.date+(a.start||"")).localeCompare(b.date+(b.start||"")));

  async function sync(){
    setSyncing(true);
    try{
      const r=await fetch(`/api/google/events?from=${start.toISOString()}&to=${addDays(end,1).toISOString()}`);
      if(!r.ok){setConnected(false);return}
      const j=await r.json();setConnected(true);
      setEvents(prev=>[...prev.filter(e=>!e.googleId),...(j.items||[]).map(toGoogleEvent)]);
    }catch{setConnected(false)}
    finally{setSyncing(false)}
  }
  useEffect(()=>{if(hydrated)sync().catch(()=>{})},[start.getTime(),end.getTime(),hydrated]);

  async function persist(next:Ev){
    let gId=next.googleId;
    if(connected){
      const sd=parseDate(next.date);
      const payload={...next,start:next.allDay?next.date:`${next.date}T${next.start}:00`,end:next.allDay?iso(addDays(sd,1)):`${next.date}T${next.end}:00`,endDate:iso(addDays(sd,1))};
      try{
        const r=await fetch("/api/google/events",{method:gId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if(r.ok){const j=await r.json();gId=j.id||gId}else setNotice("Google-szinkron hiba, helyben elmentve.");
      }catch{setNotice("Google-szinkron hiba, helyben elmentve.")}
    }
    const saved={...next,googleId:gId};
    setEvents(prev=>[...prev.filter(e=>e.id!==saved.id&&(!gId||e.googleId!==gId)),saved]);
    return saved;
  }

  async function save(x:Partial<Ev>){
    if(!(x.title||"").trim()){setNotice("Adj nevet az eseménynek.");return}
    if(!x.date){setNotice("Válassz dátumot.");return}
    if(!x.allDay&&x.start&&x.end&&x.end<=x.start){setNotice("A befejezés legyen később a kezdésnél.");return}
    const base:Ev={id:x.id||crypto.randomUUID(),googleId:x.googleId,title:(x.title||"Esemény").trim(),date:x.date,start:x.start||"09:00",end:x.end||"10:00",allDay:!!x.allDay,calendar:(x.calendar||"work") as CalKey,location:x.location||"",note:x.note||""};
    await persist(base);setEditor(null);setNotice("Esemény mentve.");setTimeout(()=>setNotice(""),1800);
  }

  async function remove(e:Ev){
    if(e.googleId&&connected){try{await fetch("/api/google/events?id="+encodeURIComponent(e.googleId),{method:"DELETE"})}catch{}}
    setEvents(p=>p.filter(x=>x.id!==e.id));setNotice("Esemény törölve.");setTimeout(()=>setNotice(""),1600);
  }

  async function moveEvent(e:Ev,newStart:number,newDate=e.date){
    const target=hhmm(newStart);
    const conflict=events.find(x=>x.id!==e.id&&!x.allDay&&x.date===newDate&&x.start===target);
    if(conflict){
      const oldStart=mins(e.start), cd=duration(conflict);
      await persist({...conflict,date:e.date,start:hhmm(oldStart),end:hhmm(oldStart+cd)});
    }
    const d=duration(e), moved={...e,date:newDate,start:target,end:hhmm(newStart+d)};
    await persist(moved);
    setNotice(conflict?"Az események helyet cseréltek.":`${moved.start} – időpont módosítva`);
    setTimeout(()=>setNotice(""),1500);
  }

  function shift(n:number){
    const d=new Date(anchor);
    if(mode==="month")d.setMonth(d.getMonth()+n);
    else if(mode==="1w")d.setDate(d.getDate()+7*n);
    else if(mode==="2w")d.setDate(d.getDate()+14*n);
    else d.setDate(d.getDate()+28*n);
    setAnchor(d);
  }

  return <main className="appShell">
    <aside className="sidebar">
      <div className="brand"><div className="brandIcon">▦</div><span>HAVI <b>NAPTÁR</b></span></div>
      <div className="calList"><h4>Naptárak</h4>{(Object.keys(calMeta) as CalKey[]).map(k=><label key={k}><i style={{background:calMeta[k].color}}/><span>{calMeta[k].label}</span><input type="checkbox" checked={enabled[k]} onChange={e=>setEnabled({...enabled,[k]:e.target.checked})}/></label>)}</div>
      <button className="nav" onClick={()=>setSettings(true)}>⚙ <span>Naptár kapcsolat</span></button>
    </aside>

    <section className="content">
      <header className="topbar">
        <div className="headLeft">
          <button className="iconBtn" onClick={()=>shift(-1)}>‹</button>
          <button className="iconBtn" onClick={()=>shift(1)}>›</button>
          <button className="todayBtn" onClick={()=>setAnchor(new Date())}>Ma</button>
          <div className="periodTitle"><h1>{mode==="custom"?fmtRange(start,end):monthLabel(anchor)}</h1><small>{fmtRange(start,end)}</small></div>
        </div>
        <div className="actions">
          <button className="secondary" onClick={()=>window.print()}>⎙ PDF / Nyomtatás</button>
          <button className="syncBtn" onClick={()=>sync()} disabled={syncing}>{syncing?"Szinkron…":connected?"↻ Szinkron":"○ Offline"}</button>
          <button className="primary" onClick={()=>setEditor({date:iso(anchor),calendar:"work",start:"09:00",end:"10:00"})}>＋ Esemény</button>
        </div>
      </header>

      <div className="rangeBar">
        {([["1w","1 hét"],["2w","2 hét"],["4w","4 hét"],["month","Hónap"],["custom","Egyedi"],["list","Lista"]] as [RangeMode,string][]).map(([k,label])=><button key={k} className={mode===k?"on":""} onClick={()=>setMode(k)}>{label}</button>)}
      </div>

      {mode==="custom"&&<div className="customRange">
        <label>Kezdet <input type="date" value={customStart} onChange={e=>{setCustomStart(e.target.value);if(e.target.value>customEnd)setCustomEnd(e.target.value)}}/></label>
        <span>→</span>
        <label>Vége <input type="date" value={customEnd} min={customStart} onChange={e=>setCustomEnd(e.target.value)}/></label>
        <b>{count} nap</b>
      </div>}

      {mode==="list"?<div className="listView">
        {shown.length?shown.map(e=><button key={e.id} className="listItem" onClick={()=>setEditor(e)}>
          <div className="listDate"><b>{parseDate(e.date).getDate()}</b><span>{shortDays[parseDate(e.date).getDay()]}</span></div>
          <i style={{background:calMeta[e.calendar].color}}/><div><strong>{calMeta[e.calendar].icon} {e.title}</strong><small>{e.allDay?"Egész napos":(e.start||"")+" – "+(e.end||"")}</small></div>
        </button>):<div className="empty">Nincs esemény ebben az időszakban.</div>}
      </div>:<CalendarGrid days={days} events={shown} anchor={anchor} onDay={(d)=>{setAnchor(d);setDayOpen(iso(d))}}/>}
    </section>

    <button className="fab" onClick={()=>setEditor({date:iso(anchor),calendar:"work",start:"09:00",end:"10:00"})}>＋</button>
    {notice&&<div className="toast">{notice}</div>}

    {dayOpen&&<DayZoom date={dayOpen} events={events.filter(e=>enabled[e.calendar]&&e.date===dayOpen)} onClose={()=>setDayOpen(null)} onEdit={e=>setEditor(e)} onAdd={()=>setEditor({date:dayOpen,calendar:"work",start:"09:00",end:"10:00"})} onMove={moveEvent} onDelete={remove}/>}

    {editor&&<Modal title={editor.id?"Esemény szerkesztése":"Esemény hozzáadása"} onClose={()=>setEditor(null)}><EventForm value={editor} onSave={save} onCancel={()=>setEditor(null)}/></Modal>}

    {settings&&<Modal title="Naptár kapcsolat" onClose={()=>setSettings(false)}>
      <div className="settingsBox"><div className={"status "+(connected?"ok":"")}><i/><div><b>{connected?"Google Naptár kapcsolódva":"Google Naptár nincs kapcsolva"}</b><span>{connected?"Az iPhone-on használt Google Naptár eseményei megjelennek itt.":"Kapcsold össze egyszer a kétirányú szinkronhoz."}</span></div></div>
      <button className="primary wide" onClick={()=>location.href="/api/google/connect"}>{connected?"Újracsatlakozás":"Google Naptár csatlakoztatása"}</button></div>
    </Modal>}
  </main>
}

function CalendarGrid({days,events,anchor,onDay}:{days:Date[];events:Ev[];anchor:Date;onDay:(d:Date)=>void}){
  const first=days[0]?.getDay()||1;
  const headers=Array.from({length:7},(_,i)=>dayNames[(first+i)%7]);
  return <div className="calendar timeCalendar">
    <div className="weekHeader">{headers.map(x=><span key={x}>{x}</span>)}</div>
    <div className="grid">{days.map(d=>{
      const es=events.filter(e=>e.date===iso(d));
      return <button key={iso(d)} className={"day timeDay "+(iso(d)===iso(anchor)?"selectedDay":"")} onClick={()=>onDay(d)}>
        <div className="dayHead"><b>{d.getDate()}</b><small>{shortDays[d.getDay()]}</small></div>
        <div className="miniTimeline">
          <i className="guide g1"/><i className="guide g2"/><i className="guide g3"/>
          {es.slice(0,5).map((e,i)=>{
            const top=e.allDay?2:Math.max(2,Math.min(84,(mins(e.start)-7*60)/(14*60)*88));
            return <span key={e.id} className="timelineEvent" style={{"--event":calMeta[e.calendar].color,top:`${top}%`,zIndex:5+i} as React.CSSProperties}><em>{calMeta[e.calendar].icon}</em><b>{e.allDay?"":e.start+" "}</b>{e.title}</span>
          })}
          {es.length>5&&<span className="moreEvents">+{es.length-5}</span>}
        </div>
      </button>
    })}</div>
  </div>
}

function DayZoom({date,events,onClose,onEdit,onAdd,onMove,onDelete}:{date:string;events:Ev[];onClose:()=>void;onEdit:(e:Ev)=>void;onAdd:()=>void;onMove:(e:Ev,m:number,d?:string)=>void;onDelete:(e:Ev)=>void}){
  const scrollRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setTimeout(()=>scrollRef.current?.scrollTo({top:7*64,behavior:"smooth"}),80)},[]);
  const sorted=[...events].sort((a,b)=>(a.start||"00:00").localeCompare(b.start||"00:00"));
  return <div className="dayBackdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <section className="dayZoom">
      <header><div><small>{dayNames[parseDate(date).getDay()]}</small><h2>{parseDate(date).toLocaleDateString("hu-HU",{month:"long",day:"numeric"})}</h2></div><div><button className="secondary" onClick={onAdd}>＋ Esemény</button><button className="closeX" onClick={onClose}>×</button></div></header>
      {sorted.some(e=>e.allDay)&&<div className="allDayRow">{sorted.filter(e=>e.allDay).map(e=><button key={e.id} style={{"--event":calMeta[e.calendar].color} as React.CSSProperties} onClick={()=>onEdit(e)}>{calMeta[e.calendar].icon} {e.title}</button>)}</div>}
      <div className="dayScroll" ref={scrollRef}>
        <div className="hours">{Array.from({length:24},(_,h)=><div className="hourRow" key={h}><span>{String(h).padStart(2,"0")}:00</span><i/></div>)}</div>
        <div className="dayEventsLayer">{sorted.filter(e=>!e.allDay).map(e=><DraggableEvent key={e.id} e={e} onMove={onMove} onEdit={onEdit} onDelete={onDelete}/>)}</div>
      </div>
      <footer><span>Fogd meg az eseményt és húzd fel/le • 15 perces lépések</span></footer>
    </section>
  </div>
}

function DraggableEvent({e,onMove,onEdit,onDelete}:{e:Ev;onMove:(e:Ev,m:number,d?:string)=>void;onEdit:(e:Ev)=>void;onDelete:(e:Ev)=>void}){
  const [dragY,setDragY]=useState(0);const startY=useRef<number|null>(null);
  const base=mins(e.start), dur=duration(e), pxPerMin=64/60;
  const top=base*pxPerMin, height=Math.max(34,dur*pxPerMin);
  function down(ev:React.PointerEvent){startY.current=ev.clientY;(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId)}
  function move(ev:React.PointerEvent){if(startY.current!==null)setDragY(ev.clientY-startY.current)}
  function up(){if(startY.current===null)return;const delta=Math.round((dragY/pxPerMin)/15)*15;startY.current=null;setDragY(0);if(delta)onMove(e,base+delta)}
  return <article className="dragEvent" style={{"--event":calMeta[e.calendar].color,top:top+dragY,height} as React.CSSProperties} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{startY.current=null;setDragY(0)}}>
    <button className="eventMain" onClick={()=>onEdit(e)}><span>{calMeta[e.calendar].icon}</span><div><b>{e.title}</b><small>{e.start} – {e.end}{e.location?" • "+e.location:""}</small></div></button>
    <div className="eventQuick"><button onPointerDown={ev=>ev.stopPropagation()} onClick={()=>onMove(e,base-15)}>−15</button><button onPointerDown={ev=>ev.stopPropagation()} onClick={()=>onMove(e,base+15)}>+15</button><button onPointerDown={ev=>ev.stopPropagation()} onClick={()=>onMove(e,base,iso(addDays(parseDate(e.date),-1)))}>←nap</button><button onPointerDown={ev=>ev.stopPropagation()} onClick={()=>onMove(e,base,iso(addDays(parseDate(e.date),1)))}>nap→</button><button onPointerDown={ev=>ev.stopPropagation()} onClick={()=>onEdit(e)}>✎</button><button onPointerDown={ev=>ev.stopPropagation()} onClick={()=>onDelete(e)}>×</button></div>
  </article>
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
  return <div className="backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><div className="modal"><div className="modalHead"><b>{title}</b><button onClick={onClose}>×</button></div>{children}</div></div>
}
function EventForm({value,onSave,onCancel}:{value:Partial<Ev>;onSave:(x:Partial<Ev>)=>void;onCancel:()=>void}){
  const [x,setX]=useState(value);
  return <div className="form">
    <label><span>Cím</span><input value={x.title||""} onChange={e=>setX({...x,title:e.target.value})} placeholder="Esemény neve"/></label>
    <div className="two"><label><span>Dátum</span><input type="date" value={x.date||""} onChange={e=>setX({...x,date:e.target.value})}/></label><label className="toggleLabel"><span>Egész napos</span><input type="checkbox" checked={!!x.allDay} onChange={e=>setX({...x,allDay:e.target.checked})}/></label></div>
    {!x.allDay&&<div className="two"><label><span>Kezdés</span><input type="time" step="900" value={x.start||""} onChange={e=>setX({...x,start:e.target.value})}/></label><label><span>Vége</span><input type="time" step="900" value={x.end||""} onChange={e=>setX({...x,end:e.target.value})}/></label></div>}
    <label><span>Naptár</span><select value={x.calendar||"work"} onChange={e=>setX({...x,calendar:e.target.value as CalKey})}>{(Object.keys(calMeta) as CalKey[]).map(k=><option key={k} value={k}>{calMeta[k].icon} {calMeta[k].label}</option>)}</select></label>
    <label><span>Helyszín</span><input value={x.location||""} onChange={e=>setX({...x,location:e.target.value})} placeholder="Opcionális"/></label>
    <label><span>Megjegyzés</span><textarea value={x.note||""} onChange={e=>setX({...x,note:e.target.value})} placeholder="Opcionális"/></label>
    <div className="modalActions"><button className="secondary" onClick={onCancel}>Mégse</button><button className="primary" onClick={()=>onSave(x)}>Mentés</button></div>
  </div>
}