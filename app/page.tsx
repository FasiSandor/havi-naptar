"use client";
import {useEffect,useMemo,useRef,useState} from "react";

type CalKey="work"|"personal"|"family"|"sport";
type RangeMode="1w"|"2w"|"4w"|"month"|"custom"|"list";
type ThemeMode="dark"|"light"|"system";
type Ev={id:string;googleId?:string;title:string;date:string;start?:string;end?:string;allDay?:boolean;calendar:CalKey;location?:string;note?:string};

const calMeta:Record<CalKey,{label:string;color:string;icon:string}>={
  work:{label:"Suli / Munka",color:"#3B82F6",icon:"▦"},
  personal:{label:"Személyes",color:"#22C55E",icon:"●"},
  family:{label:"Család",color:"#F59E0B",icon:"⌂"},
  sport:{label:"Sport",color:"#22D3EE",icon:"◆"}
};
const dayNames=["Vasárnap","Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat"];
const shortDays=["V","H","K","Sze","Cs","P","Szo"];

const holidayMap:Record<string,string>={
  "2026-10-23":"Nemzeti ünnep · 1956-os forradalom",
  "2026-11-01":"Mindenszentek",
  "2026-12-25":"Karácsony",
  "2026-12-26":"Karácsony másnapja",
  "2027-01-01":"Újév",
  "2027-03-15":"Nemzeti ünnep · 1848–49-es forradalom",
  "2027-03-26":"Nagypéntek",
  "2027-03-29":"Húsvéthétfő",
  "2027-05-01":"A munka ünnepe",
  "2027-05-17":"Pünkösdhétfő",
  "2027-08-20":"Államalapítás ünnepe"
};

const schoolPlanEvents:Ev[]=[
  {id:"workplan-2026-10-06",title:"Aradi vértanúk megemlékezése",date:"2026-10-06",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-10-15",title:"Fecskeavató",date:"2026-10-15",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-10-22",title:"Október 23-i iskolai megemlékezés",date:"2026-10-22",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-10-23",title:"Őszi szünet kezdete",date:"2026-10-23",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-11-01",title:"Őszi szünet vége",date:"2026-11-01",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-11-19",title:"Nyílt nap I.",date:"2026-11-19",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-11-20",title:"Nyílt nap II.",date:"2026-11-20",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-11-27",title:"Fogadó óra I.",date:"2026-11-27",start:"15:00",end:"17:00",calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-12-12",title:"Szalagavató · tanítási nap",date:"2026-12-12",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-12-16",title:"Karácsonyi vásár",date:"2026-12-16",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-12-18",title:"Karácsonyi ünnepség",date:"2026-12-18",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2026-12-19",title:"Téli szünet kezdete",date:"2026-12-19",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-01-03",title:"Téli szünet vége",date:"2027-01-03",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-01-14",title:"Pályaorientációs nap",date:"2027-01-14",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-01-22",title:"I. félév utolsó napja",date:"2027-01-22",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-01-29",title:"Félévi eredmények közlése",date:"2027-01-29",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-02-05",title:"Szülői értekezlet II.",date:"2027-02-05",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-03-12",title:"Március 15-i ünnepség",date:"2027-03-12",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-03-19",title:"Fogadó óra II.",date:"2027-03-19",start:"15:00",end:"17:00",calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-03-25",title:"Tavaszi szünet kezdete",date:"2027-03-25",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-04-04",title:"Tavaszi szünet vége",date:"2027-04-04",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-04-07",title:"Teleki nap",date:"2027-04-07",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-04-16",title:"Holokauszt áldozatainak megemlékezése",date:"2027-04-16",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-04-27",title:"Szerenád",date:"2027-04-27",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-04-30",title:"Ballagás",date:"2027-04-30",start:"10:00",end:"12:00",calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-05-03",title:"Érettségi szünet",date:"2027-05-03",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-05-04",title:"Érettségi szünet",date:"2027-05-04",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-06-04",title:"Nemzeti Összetartozás Napja",date:"2027-06-04",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-06-10",title:"Év végi osztályozó értekezlet",date:"2027-06-10",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-06-15",title:"Tanévzáró · utolsó tanítási nap",date:"2027-06-15",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"},
  {id:"workplan-2027-06-28",title:"Év végi értékelő értekezlet",date:"2027-06-28",allDay:true,calendar:"work",note:"Iskolai munkaterv 2026/2027"}
];

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
  const category=x.extendedProperties?.private?.haviCategory;
  const calendar=(category==="work"||category==="personal"||category==="family"||category==="sport")?category:"work";
  return {id:"g-"+x.id,googleId:x.id,title:x.summary||"Esemény",date:(start||"").slice(0,10),start:x.start?.dateTime?.slice(11,16),end:x.end?.dateTime?.slice(11,16),allDay:!!x.start?.date,calendar,location:x.location||"",note:x.description||""}
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
  const [themeMode,setThemeMode]=useState<ThemeMode>("system");
  const [resolvedTheme,setResolvedTheme]=useState<"dark"|"light">("dark");
  const [quickAdd,setQuickAdd]=useState(false);
  const [rotateHint,setRotateHint]=useState(false);
  const [monthFlow,setMonthFlow]=useState(false);
  const [showWorkPlan,setShowWorkPlan]=useState(true);

  useEffect(()=>{
    try{
      const stored:Ev[]=JSON.parse(localStorage.getItem("havi-events")||"[]");
      setEvents(stored.filter(e=>!e.id.startsWith("workplan-")));
      setShowWorkPlan(localStorage.getItem("havi-workplan-visible")!=="0");
      localStorage.removeItem("havi-schoolplan-2026-27");
      const savedTheme=localStorage.getItem("havi-theme");
      if(savedTheme==="dark"||savedTheme==="light"||savedTheme==="system") setThemeMode(savedTheme);
      const status=new URLSearchParams(window.location.search).get("google");
      if(status==="connected") setNotice("Google Naptár kapcsolódva.");
      if(status==="error") setNotice("A Google Naptár csatlakoztatása nem sikerült.");
      if(status==="config") setNotice("A Google OAuth beállítása még hiányzik.");
      if(status) window.history.replaceState({}, "", window.location.pathname);
    }catch{}
    finally{setHydrated(true)}
  },[]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-events",JSON.stringify(events.filter(e=>!e.googleId&&!e.id.startsWith("workplan-"))))},[events,hydrated]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-workplan-visible",showWorkPlan?"1":"0")},[showWorkPlan,hydrated]);
  useEffect(()=>{
    if(!hydrated)return;
    localStorage.setItem("havi-theme",themeMode);
    const mq=window.matchMedia("(prefers-color-scheme: dark)");
    const apply=()=>{
      const next=themeMode==="system"?(mq.matches?"dark":"light"):themeMode;
      setResolvedTheme(next);
      document.documentElement.style.colorScheme=next;
    };
    apply();
    mq.addEventListener?.("change",apply);
    return ()=>mq.removeEventListener?.("change",apply);
  },[themeMode,hydrated]);
  useEffect(()=>{
    if(!hydrated)return;
    const mq=window.matchMedia("(max-width: 900px)");
    const portrait=window.matchMedia("(orientation: portrait)");
    const apply=()=>{
      if(!mq.matches)return;
      setMode("month");
      if(!portrait.matches)setRotateHint(false);
    };
    apply();
    mq.addEventListener?.("change",apply);
    portrait.addEventListener?.("change",apply);
    return ()=>{mq.removeEventListener?.("change",apply);portrait.removeEventListener?.("change",apply)};
  },[hydrated]);

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
  const displayEvents=useMemo(()=>[...events,...(showWorkPlan?schoolPlanEvents:[])],[events,showWorkPlan]);
  const shown=displayEvents.filter(e=>enabled[e.calendar]&&days.some(d=>iso(d)===e.date)).sort((a,b)=>(a.date+(a.start||"")).localeCompare(b.date+(b.start||"")));

  async function sync(){
    setSyncing(true);
    try{
      const r=await fetch(`/api/google/events?from=${start.toISOString()}&to=${addDays(end,1).toISOString()}`);
      if(!r.ok){setConnected(false);return}
      const j=await r.json();
      if(!j.connected){setConnected(false);return}
      setConnected(true);
      setEvents(prev=>[...prev.filter(e=>!e.googleId),...(j.items||[]).map(toGoogleEvent)]);
    }catch{setConnected(false)}
    finally{setSyncing(false)}
  }
  useEffect(()=>{if(hydrated)sync().catch(()=>{})},[start.getTime(),end.getTime(),hydrated]);
  useEffect(()=>{
    if(!hydrated)return;
    const refresh=()=>{if(document.visibilityState==="visible")sync().catch(()=>{})};
    const timer=setInterval(refresh,60000);
    window.addEventListener("focus",refresh);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh)};
  },[hydrated,start.getTime(),end.getTime()]);
  useEffect(()=>{
    if(!hydrated||!monthFlow)return;
    const schoolStartYear=anchor.getMonth()>=8?anchor.getFullYear():anchor.getFullYear()-1;
    const from=new Date(schoolStartYear,8,1,0,0,0,0);
    const to=new Date(schoolStartYear+1,8,1,0,0,0,0);
    (async()=>{
      try{
        const r=await fetch(`/api/google/events?from=${from.toISOString()}&to=${to.toISOString()}`);
        if(!r.ok)return;
        const j=await r.json();
        if(!j.connected)return;
        setEvents(prev=>{
          const local=prev.filter(e=>!e.googleId);
          return [...local,...(j.items||[]).map(toGoogleEvent)];
        });
      }catch{}
    })();
  },[monthFlow,hydrated,anchor.getFullYear(),anchor.getMonth()]);

  async function persist(next:Ev){
    let gId=next.googleId;
    const isExistingGoogle=!!gId;
    if(isExistingGoogle&&!connected){
      setNotice("Nincs Google-kapcsolat. A módosítást nem mentettem.");
      return null;
    }
    if(connected){
      const sd=parseDate(next.date);
      const payload={...next,start:next.allDay?next.date:`${next.date}T${next.start}:00`,end:next.allDay?iso(addDays(sd,1)):`${next.date}T${next.end}:00`,endDate:iso(addDays(sd,1))};
      try{
        const r=await fetch("/api/google/events",{method:gId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if(r.ok){
          const j=await r.json();
          gId=j.id||gId;
        }else if(isExistingGoogle){
          setNotice("A Google Naptár módosítása nem sikerült. Az eredeti esemény megmaradt.");
          return null;
        }else{
          setNotice("Google-szinkron hiba. Az új eseményt csak helyben mentettem.");
          gId=undefined;
        }
      }catch{
        if(isExistingGoogle){
          setNotice("A Google Naptár módosítása nem sikerült. Az eredeti esemény megmaradt.");
          return null;
        }
        setNotice("Google-szinkron hiba. Az új eseményt csak helyben mentettem.");
        gId=undefined;
      }
    }
    const saved={...next,googleId:gId};
    setEvents(prev=>[...prev.filter(e=>e.id!==saved.id&&(!gId||e.googleId!==gId)),saved]);
    return saved;
  }

  async function save(x:Partial<Ev>){
    if(!(x.title||"").trim()){setNotice("Adj nevet az eseménynek.");return false}
    if(!x.date){setNotice("Válassz dátumot.");return false}
    if(!x.allDay&&x.start&&x.end&&x.end<=x.start){setNotice("A befejezés legyen később a kezdésnél.");return false}
    const base:Ev={id:x.id||crypto.randomUUID(),googleId:x.googleId,title:(x.title||"Esemény").trim(),date:x.date,start:x.start||"09:00",end:x.end||"10:00",allDay:!!x.allDay,calendar:(x.calendar||"work") as CalKey,location:x.location||"",note:x.note||""};
    const saved=await persist(base);
    if(!saved)return false;
    setEditor(null);
    setNotice(saved.googleId?"Esemény mentve és szinkronizálva.":"Esemény helyben mentve.");
    setTimeout(()=>setNotice(""),1800);
    return true;
  }

  async function remove(e:Ev){
    if(e.googleId){
      if(!connected){
        setNotice("Nincs Google-kapcsolat. A törlést nem hajtottam végre.");
        return;
      }
      try{
        const r=await fetch("/api/google/events?id="+encodeURIComponent(e.googleId),{method:"DELETE"});
        if(!r.ok){
          setNotice("A Google Naptár törlése nem sikerült. Az esemény megmaradt.");
          return;
        }
      }catch{
        setNotice("A Google Naptár törlése nem sikerült. Az esemény megmaradt.");
        return;
      }
    }
    setEvents(p=>p.filter(x=>x.id!==e.id));
    setNotice("Esemény törölve.");
    setTimeout(()=>setNotice(""),1600);
  }

  async function moveEvent(e:Ev,newStart:number,newDate=e.date){
    const target=hhmm(newStart);
    const conflict=events.find(x=>x.id!==e.id&&!x.allDay&&x.date===newDate&&x.start===target);
    if(conflict){
      const oldStart=mins(e.start), cd=duration(conflict);
      const swapped=await persist({...conflict,date:e.date,start:hhmm(oldStart),end:hhmm(oldStart+cd)});
      if(!swapped)return;
    }
    const d=duration(e), moved={...e,date:newDate,start:target,end:hhmm(newStart+d)};
    const movedSaved=await persist(moved);
    if(!movedSaved)return;
    setNotice(conflict?"Az események helyet cseréltek.":`${moved.start} – időpont módosítva`);
    setTimeout(()=>setNotice(""),1500);
  }

  function shift(n:number){
    if(mode==="custom"){
      const span=count;
      const nextStart=addDays(parseDate(customStart),span*n);
      const nextEnd=addDays(parseDate(customEnd),span*n);
      setCustomStart(iso(nextStart));
      setCustomEnd(iso(nextEnd));
      setAnchor(nextStart);
      return;
    }
    const d=new Date(anchor);
    if(mode==="month")d.setMonth(d.getMonth()+n);
    else if(mode==="1w")d.setDate(d.getDate()+7*n);
    else if(mode==="2w")d.setDate(d.getDate()+14*n);
    else d.setDate(d.getDate()+28*n);
    setAnchor(d);
  }

  return <main className="appShell" data-theme={resolvedTheme}>
    <aside className="sidebar">
      <div className="brand"><div className="brandIcon">▦</div><span>HAVI <b>NAPTÁR</b></span></div>
      <div className="calList"><h4>Naptárak</h4>{(Object.keys(calMeta) as CalKey[]).map(k=><label key={k}><i style={{background:calMeta[k].color}}/><span>{calMeta[k].label}</span><input type="checkbox" checked={enabled[k]} onChange={e=>setEnabled({...enabled,[k]:e.target.checked})}/></label>)}</div>
      <button className="nav" onClick={()=>setSettings(true)}>⚙ <span>Naptár kapcsolat</span></button>
    </aside>

    <MobilePortrait
      anchor={anchor}
      events={displayEvents.filter(e=>enabled[e.calendar])}
      connected={connected}
      syncing={syncing}
      onSync={()=>sync()}
      onDay={d=>{setAnchor(d);setDayOpen(iso(d))}}
      onLongDay={d=>{setAnchor(d);setMonthFlow(true)}}
      onQuickAdd={()=>setQuickAdd(true)}
      onToday={()=>setAnchor(new Date())}
      onPrevMonth={()=>{const d=new Date(anchor);d.setMonth(d.getMonth()-1);setAnchor(d)}}
      onNextMonth={()=>{const d=new Date(anchor);d.setMonth(d.getMonth()+1);setAnchor(d)}}
      onSettings={()=>setSettings(true)}
    />
    {monthFlow&&<ContinuousMonthFlow
      anchor={anchor}
      events={displayEvents.filter(e=>enabled[e.calendar])}
      onClose={()=>setMonthFlow(false)}
      onDay={d=>{setAnchor(d);setDayOpen(iso(d));setMonthFlow(false)}}
      onToday={()=>setAnchor(new Date())}
      onQuickAdd={()=>setQuickAdd(true)}
    />}
    <MobileLandscapeMonth
      anchor={anchor}
      events={displayEvents.filter(e=>enabled[e.calendar])}
      onPrev={()=>{const d=new Date(anchor);d.setMonth(d.getMonth()-1);setAnchor(d)}}
      onNext={()=>{const d=new Date(anchor);d.setMonth(d.getMonth()+1);setAnchor(d)}}
      onToday={()=>setAnchor(new Date())}
      onDay={d=>{setAnchor(d);setDayOpen(iso(d))}}
      onQuickAdd={()=>setEditor({date:iso(anchor),calendar:"work",start:"09:00",end:"10:00"})}
      onSettings={()=>setSettings(true)}
    />

    <section className="content desktopCalendarContent">
      <header className="topbar">
        <div className="headLeft">
          <button className="iconBtn" onClick={()=>shift(-1)}>‹</button>
          <button className="iconBtn" onClick={()=>shift(1)}>›</button>
          <button className="todayBtn" onClick={()=>setAnchor(new Date())}>Ma</button>
          <div className="periodTitle"><div className="titleGlowDots" aria-hidden="true"><i/><i/><i/></div><h1>{mode==="custom"?fmtRange(start,end):monthLabel(anchor)}</h1><small>{fmtRange(start,end)}</small></div>
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
      </div>:<CalendarGrid days={days} events={shown} anchor={anchor} onDay={(d)=>{setAnchor(d);setDayOpen(iso(d))}} onSwipe={shift}/>} 
    </section>

    <button className="fab desktopFab" onClick={()=>setEditor({date:iso(anchor),calendar:"work",start:"09:00",end:"10:00"})}>＋</button>
    {quickAdd&&<QuickAddWheel
      baseDate={anchor}
      onClose={()=>setQuickAdd(false)}
      onCreate={async x=>{const ok=await save(x);if(ok)setQuickAdd(false)}}
    />}
    {rotateHint&&<div className="rotateHintBackdrop" onClick={()=>setRotateHint(false)}>
      <div className="rotateHintCard" onClick={e=>e.stopPropagation()}>
        <div className="rotatePhone">▭</div>
        <b>Teljes havi nézet</b>
        <span>Fordítsd el a telefont fekvő helyzetbe.</span>
        <small>A hónap automatikusan kitölti a teljes képernyőt.</small>
        <button onClick={()=>setRotateHint(false)}>Rendben</button>
      </div>
    </div>}
    {notice&&<div className="toast">{notice}</div>}

    {dayOpen&&<MobileDayCards date={dayOpen} events={displayEvents.filter(e=>enabled[e.calendar]&&e.date===dayOpen)} onClose={()=>setDayOpen(null)} onEdit={e=>{if(!e.id.startsWith("workplan-"))setEditor(e)}} onAdd={()=>setQuickAdd(true)}/>}
    {dayOpen&&<DayZoom date={dayOpen} events={displayEvents.filter(e=>enabled[e.calendar]&&e.date===dayOpen)} onClose={()=>setDayOpen(null)} onEdit={e=>setEditor(e)} onAdd={()=>setEditor({date:dayOpen,calendar:"work",start:"09:00",end:"10:00"})} onMove={moveEvent} onDelete={remove}/>} 

    {editor&&<Modal title={editor.id?"Esemény szerkesztése":"Esemény hozzáadása"} onClose={()=>setEditor(null)}><EventForm value={editor} onSave={save} onCancel={()=>setEditor(null)}/></Modal>}

    {settings&&<Modal title="Beállítások" onClose={()=>setSettings(false)}>
      <div className="settingsBox">
        <div className="themeSettings">
          <div className="settingsTitle"><b>Megjelenés</b><span>Válassz témát, vagy kövesse automatikusan a készüléket.</span></div>
          <div className="themeSwitch" role="group" aria-label="Megjelenés">
            <button className={themeMode==="dark"?"on":""} onClick={()=>setThemeMode("dark")}><span>●</span>Sötét</button>
            <button className={themeMode==="light"?"on":""} onClick={()=>setThemeMode("light")}><span>○</span>Világos</button>
            <button className={themeMode==="system"?"on":""} onClick={()=>setThemeMode("system")}><span>◐</span>Rendszer</button>
          </div>
          <small className="themeHint">Aktív: {resolvedTheme==="dark"?"sötét":"világos"} mód</small>
        </div>
        <div className="workPlanSetting">
          <div className="settingsTitle"><b>Iskolai munkaterv</b><span>A 2026/2027-es Teleki munkaterv fontos dátumai külön rétegként.</span></div>
          <button className={"layerToggle "+(showWorkPlan?"on":"")} onClick={()=>setShowWorkPlan(v=>!v)}><i/><span>{showWorkPlan?"Látható":"Elrejtve"}</span></button>
        </div>
        <div className={"status "+(connected?"ok":"")}><i/><div><b>{connected?"Google Naptár kapcsolódva":"Google Naptár nincs kapcsolva"}</b><span>{connected?"Az iPhone-on használt Google Naptár eseményei megjelennek itt.":"Kapcsold össze egyszer a kétirányú szinkronhoz."}</span></div></div>
        <button className="primary wide" onClick={()=>location.href="/api/google/connect"}>{connected?"Újracsatlakozás":"Google Naptár csatlakoztatása"}</button>
      </div>
    </Modal>}
  </main>
}


function MobilePortrait({anchor,events,connected,syncing,onSync,onDay,onLongDay,onQuickAdd,onToday,onPrevMonth,onNextMonth,onSettings}:{anchor:Date;events:Ev[];connected:boolean;syncing:boolean;onSync:()=>void;onDay:(d:Date)=>void;onLongDay:(d:Date)=>void;onQuickAdd:()=>void;onToday:()=>void;onPrevMonth:()=>void;onNextMonth:()=>void;onSettings:()=>void}){
  const swipeX=useRef<number|null>(null);
  const first=monday(new Date(anchor.getFullYear(),anchor.getMonth(),1,12));
  const days=Array.from({length:42},(_,i)=>addDays(first,i));
  const longTimer=useRef<number|undefined>(undefined);
  const longFired=useRef(false);
  function pressStart(d:Date){
    longFired.current=false;
    longTimer.current=window.setTimeout(()=>{longFired.current=true;onLongDay(d)},460);
  }
  function pressEnd(d:Date){
    if(longTimer.current)window.clearTimeout(longTimer.current);
    longTimer.current=undefined;
    if(!longFired.current)onDay(d);
    setTimeout(()=>{longFired.current=false},60);
  }
  return <section className="mobilePortraitCalendar"
    onPointerDown={e=>{swipeX.current=e.clientX}}
    onPointerUp={e=>{if(swipeX.current===null)return;const dx=e.clientX-swipeX.current;swipeX.current=null;if(Math.abs(dx)>70)dx<0?onNextMonth():onPrevMonth()}}> 
    <header className="mockHero">
      <div className="monthNavCapsule"><button onClick={onPrevMonth}>‹</button><span>{anchor.getFullYear()}.</span><button onClick={onNextMonth}>›</button></div>
      <div className="mockActions">
        <button className={"syncDot "+(connected?"online":"")} onClick={onSync}>{syncing?"↻":connected?"●":"○"}</button>
        <button onClick={onSettings}>⚙</button>
        <button className="mockPlus" onClick={onQuickAdd}>＋</button>
      </div>
    </header>

    <div className="mockMonthTitle">{anchor.toLocaleDateString("hu-HU",{month:"long"})}</div>
    <div className="mockWeekdays">{["H","K","Sze","Cs","P","Sz","V"].map(x=><span key={x}>{x}</span>)}</div>

    <div className="mockMonthGrid">
      {days.map(d=>{
        const current=d.getMonth()===anchor.getMonth();
        const es=events.filter(e=>e.date===iso(d));
        const today=iso(d)===iso(new Date());
        const holiday=holidayMap[iso(d)];
        return <button key={iso(d)}
          className={(current?"":"outside ")+(today?"mockToday ":"")+(holiday?"holidayDay ":"")}
          onPointerDown={()=>pressStart(d)}
          onPointerUp={()=>pressEnd(d)}
          onPointerCancel={()=>{if(longTimer.current)window.clearTimeout(longTimer.current)}}
          onPointerLeave={()=>{if(longTimer.current)window.clearTimeout(longTimer.current)}}>
          <b>{d.getDate()}</b>
          {holiday&&<em className="holidayMark">✦</em>}
          <div className="eventMarks">
            {es.slice(0,4).map((e,i)=><i key={e.id} className={(es.length>2?"eventBar":"eventDot")+(e.note==="Iskolai munkaterv 2026/2027"?" workPlanMark":"")} style={{"--event":e.note==="Iskolai munkaterv 2026/2027"?"#F59E0B":calMeta[e.calendar].color,"--i":i} as React.CSSProperties}/>)}
          </div>
        </button>
      })}
    </div>

    <div className="portraitHint">Koppintás: napi események · Hosszan nyomva: havi folyam</div>
    <div className="mockBottom">
      <button className="mockTodayBtn" onClick={onToday}>Ma</button>
      <button className="mockBottomPlus" onClick={onQuickAdd}>＋</button>
    </div>
  </section>
}

function MobileDayCards({date,events,onClose,onEdit,onAdd}:{date:string;events:Ev[];onClose:()=>void;onEdit:(e:Ev)=>void;onAdd:()=>void}){
  const d=parseDate(date);
  const sorted=[...events].sort((a,b)=>(a.start||"").localeCompare(b.start||""));
  const holiday=holidayMap[date];
  const [closing,setClosing]=useState(false);
  const close=()=>{if(closing)return;setClosing(true);setTimeout(onClose,190)};
  return <div className={"mobileDayOverlay "+(closing?"closing":"")} onMouseDown={e=>{if(e.currentTarget===e.target)close()}}>
    <section className="mobileDayPanel">
      <div className="panelGrabber"/>
      <header>
        <div><small>{d.toLocaleDateString("hu-HU",{weekday:"long"})}</small><h2>{d.toLocaleDateString("hu-HU",{year:"numeric",month:"long",day:"numeric"})}</h2></div>
        <button onClick={close}>×</button>
      </header>
      {holiday&&<div className="holidayBanner"><span>✦</span><div><b>Ünnepnap</b><small>{holiday}</small></div></div>}
      <div className="mobileDayList">
        {sorted.length?sorted.map(e=><button key={e.id} className="mobileEventCard" style={{"--event":calMeta[e.calendar].color} as React.CSSProperties} onClick={()=>onEdit(e)}>
          <div className="mobileEventTime"><b>{e.allDay?"Egész nap":e.start}</b><span>{e.allDay?"":e.end||""}</span></div>
          <div className="mobileEventIcon">{calMeta[e.calendar].icon}</div>
          <div className="mobileEventText"><b>{e.title}</b><span>{calMeta[e.calendar].label}{e.location?" · "+e.location:""}</span>{e.note==="Iskolai munkaterv 2026/2027"&&<small className="sourceBadge">MUNKATERV · CSAK OLVASHATÓ</small>}</div>
        </button>):<div className="mobileNoEvents"><i>✦</i><b>Szabad nap</b><span>Nincs bejegyzett esemény.</span></div>}
      </div>
      <button className="mobilePanelAdd" onClick={onAdd}>＋ Esemény hozzáadása</button>
    </section>
  </div>
}

function ContinuousMonthFlow({anchor,events,onClose,onDay,onToday,onQuickAdd}:{anchor:Date;events:Ev[];onClose:()=>void;onDay:(d:Date)=>void;onToday:()=>void;onQuickAdd:()=>void}){
  const schoolStartYear=anchor.getMonth()>=8?anchor.getFullYear():anchor.getFullYear()-1;
  const months=Array.from({length:12},(_,i)=>new Date(schoolStartYear,8+i,1,12));
  const centerRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setTimeout(()=>centerRef.current?.scrollIntoView({block:"start",behavior:"auto"}),30)},[schoolStartYear]);
  return <div className="monthFlow">
    <header className="monthFlowHead">
      <button onClick={onClose}>‹</button>
      <b>Havi áttekintés</b>
      <button onClick={onQuickAdd}>＋</button>
    </header>
    <div className="monthFlowScroll">
      {months.map((m,mi)=>{
        const first=monday(new Date(m.getFullYear(),m.getMonth(),1,12));
        const days=Array.from({length:42},(_,i)=>addDays(first,i));
        const isAnchorMonth=m.getFullYear()===anchor.getFullYear()&&m.getMonth()===anchor.getMonth();
        return <section key={iso(m)} className="flowMonth" ref={isAnchorMonth?centerRef:undefined}>
          <h2>{m.toLocaleDateString("hu-HU",{month:"long"})}<small>{m.getFullYear()}</small></h2>
          <div className="flowWeekdays">{["H","K","Sze","Cs","P","Sz","V"].map(x=><span key={x}>{x}</span>)}</div>
          <div className="flowGrid">
            {days.map(d=>{
              const current=d.getMonth()===m.getMonth();
              const es=events.filter(e=>e.date===iso(d));
              const today=iso(d)===iso(new Date());
              const holiday=holidayMap[iso(d)];
              return <button key={iso(d)} className={(current?"":"outside ")+(today?"flowToday ":"")+(holiday?"flowHoliday ":"")} onClick={()=>onDay(d)}>
                <b>{d.getDate()}</b>
                {holiday&&<em>✦</em>}
                <div>{es.slice(0,3).map(e=><i key={e.id} className={e.note==="Iskolai munkaterv 2026/2027"?"workPlanMark":""} style={{"--event":e.note==="Iskolai munkaterv 2026/2027"?"#F59E0B":calMeta[e.calendar].color} as React.CSSProperties}/>)}</div>
              </button>
            })}
          </div>
        </section>
      })}
    </div>
    <button className="flowTodayBtn" onClick={onToday}>Ma</button>
  </div>
}

function MobileLandscapeMonth({anchor,events,onPrev,onNext,onToday,onDay,onQuickAdd,onSettings}:{anchor:Date;events:Ev[];onPrev:()=>void;onNext:()=>void;onToday:()=>void;onDay:(d:Date)=>void;onQuickAdd:()=>void;onSettings:()=>void}){
  const first=monday(new Date(anchor.getFullYear(),anchor.getMonth(),1,12));
  const days=Array.from({length:42},(_,i)=>addDays(first,i));
  return <section className="mobileLandscapeMonth">
    <header className="landscapeHead">
      <div className="landscapeNav"><button onClick={onPrev}>‹</button><button onClick={onNext}>›</button><button onClick={onToday}>Ma</button></div>
      <div><small>{anchor.getFullYear()}</small><h1>{anchor.toLocaleDateString("hu-HU",{month:"long"})}</h1></div>
      <div className="landscapeActions"><button onClick={onSettings}>⚙</button><button className="landscapeAdd" onClick={onQuickAdd}>＋</button></div>
    </header>
    <div className="landscapeWeekdays">{["H","K","Sze","Cs","P","Szo","V"].map(x=><span key={x}>{x}</span>)}</div>
    <div className="landscapeGrid">{days.map(d=>{
      const es=events.filter(e=>e.date===iso(d));
      const current=d.getMonth()===anchor.getMonth();
      return <button key={iso(d)} className={(current?"":"otherMonth ")+(iso(d)===iso(new Date())?"landToday ":"")} onClick={()=>onDay(d)}>
        <b>{d.getDate()}</b>
        <div>{es.slice(0,3).map(e=><span key={e.id} style={{"--event":calMeta[e.calendar].color} as React.CSSProperties}>{e.start?<i>{e.start}</i>:null}{e.title}</span>)}</div>
        {es.length>3&&<small>+{es.length-3}</small>}
      </button>
    })}</div>
  </section>
}

function WheelScroller({label,items,value,onChange}:{label:string;items:{value:number;label:string}[];value:number;onChange:(v:number)=>void}){
  const ref=useRef<HTMLDivElement>(null);
  const row=42;
  const scrolling=useRef<number|undefined>(undefined);
  useEffect(()=>{
    const i=Math.max(0,items.findIndex(x=>x.value===value));
    requestAnimationFrame(()=>ref.current?.scrollTo({top:i*row,behavior:"auto"}));
  },[items.length]);
  function handleScroll(){
    if(scrolling.current)window.clearTimeout(scrolling.current);
    scrolling.current=window.setTimeout(()=>{
      const el=ref.current;if(!el)return;
      const i=Math.max(0,Math.min(items.length-1,Math.round(el.scrollTop/row)));
      const item=items[i];
      if(item&&item.value!==value)onChange(item.value);
      el.scrollTo({top:i*row,behavior:"smooth"});
    },70);
  }
  return <div className="wheelColumn">
    <small>{label}</small>
    <div className="wheelViewport">
      <div className="wheelSelection"/>
      <div className="wheelScroll" ref={ref} onScroll={handleScroll}>
        <div className="wheelSpacer"/>
        {items.map(item=><button type="button" key={item.value} className={item.value===value?"active":""} onClick={()=>{onChange(item.value);const i=items.findIndex(x=>x.value===item.value);ref.current?.scrollTo({top:i*row,behavior:"smooth"})}}>{item.label}</button>)}
        <div className="wheelSpacer"/>
      </div>
    </div>
  </div>
}

function QuickAddWheel({baseDate,onClose,onCreate}:{baseDate:Date;onClose:()=>void;onCreate:(x:Partial<Ev>)=>Promise<void>}){
  const [title,setTitle]=useState("");
  const [month,setMonth]=useState(baseDate.getMonth());
  const [day,setDay]=useState(baseDate.getDate());
  const [time,setTime]=useState(9*60);
  const [calendar,setCalendar]=useState<CalKey>("work");
  const year=baseDate.getFullYear();
  const monthNames=["Jan","Feb","Már","Ápr","Máj","Jún","Júl","Aug","Szept","Okt","Nov","Dec"];
  const maxDay=new Date(year,month+1,0).getDate();
  const safeDay=Math.min(day,maxDay);
  const date=iso(new Date(year,month,safeDay,12));
  return <div className="quickBackdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <section className="quickSheet">
      <div className="quickGrabber"/>
      <header><div><small>GYORS BEVITEL</small><h2>Új esemény</h2></div><button onClick={onClose}>×</button></header>
      <input className="quickTitle" autoFocus placeholder="Mi legyen?" value={title} onChange={e=>setTitle(e.target.value)}/>
      <div className="wheelPicker">
        <WheelScroller label="HÓNAP" items={monthNames.map((label,value)=>({value,label}))} value={month} onChange={m=>{setMonth(m);setDay(d=>Math.min(d,new Date(year,m+1,0).getDate()))}}/>
        <WheelScroller label="NAP" items={Array.from({length:maxDay},(_,i)=>({value:i+1,label:String(i+1)}))} value={safeDay} onChange={setDay}/>
        <WheelScroller label="IDŐ" items={Array.from({length:96},(_,i)=>({value:i*15,label:hhmm(i*15)}))} value={time} onChange={setTime}/>
      </div>
      <div className="quickCategories">{(Object.keys(calMeta) as CalKey[]).map(k=><button key={k} className={calendar===k?"active":""} style={{"--event":calMeta[k].color} as React.CSSProperties} onClick={()=>setCalendar(k)}><span>{calMeta[k].icon}</span>{calMeta[k].label}</button>)}</div>
      <button className="quickSave" onClick={()=>onCreate({title,date,start:hhmm(time),end:hhmm(time+60),calendar})}>Rögzítés <span>→</span></button>
    </section>
  </div>
}

function CalendarGrid({days,events,anchor,onDay,onSwipe}:{days:Date[];events:Ev[];anchor:Date;onDay:(d:Date)=>void;onSwipe:(n:number)=>void}){
  const first=days[0]?.getDay()||1;
  const headers=Array.from({length:7},(_,i)=>dayNames[(first+i)%7]);
  const startPoint=useRef<{x:number;y:number}|null>(null);
  const suppressClick=useRef(false);
  const [swipeAnim,setSwipeAnim]=useState<""|"left"|"right">("");
  function pointerDown(e:React.PointerEvent<HTMLDivElement>){
    if(e.pointerType==="mouse"&&e.button!==0)return;
    startPoint.current={x:e.clientX,y:e.clientY};
  }
  function pointerUp(e:React.PointerEvent<HTMLDivElement>){
    if(!startPoint.current)return;
    const dx=e.clientX-startPoint.current.x,dy=e.clientY-startPoint.current.y;
    startPoint.current=null;
    if(Math.abs(dx)>=56&&Math.abs(dx)>Math.abs(dy)*1.2){
      suppressClick.current=true;
      const dir=dx<0?"left":"right";
      setSwipeAnim(dir);
      setTimeout(()=>{
        onSwipe(dir==="left"?1:-1);
        setSwipeAnim("");
      },120);
      setTimeout(()=>{suppressClick.current=false},260);
    }
  }
  const rowCount=Math.max(1,Math.ceil(days.length/7));
  return <div className={"calendar timeCalendar swipeCalendar rows-"+rowCount+" "+(swipeAnim?"swipe-"+swipeAnim:"")} onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={()=>{startPoint.current=null}}>
    <div className="weekHeader">{headers.map(x=><span key={x}>{x}</span>)}</div>
    <div className="grid">{days.map(d=>{
      const es=events.filter(e=>e.date===iso(d));
      const accent=es[0]?calMeta[es[0].calendar].color:(d.getDay()===0||d.getDay()===6?"#F59E0B":"#3B82F6");
      return <button key={iso(d)} className={"day timeDay "+(es.length?"hasEvents ":"")+(d.getDay()===0||d.getDay()===6?"weekendDay ":"")+(iso(d)===iso(anchor)?"selectedDay ":"")+(iso(d)===iso(new Date())?"todayDay":"")} style={{"--day-accent":accent} as React.CSSProperties} onClick={()=>{if(!suppressClick.current)onDay(d)}}>
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
  const [now,setNow]=useState(()=>new Date());
  const [closing,setClosing]=useState(false);
  const close=()=>{if(closing)return;setClosing(true);setTimeout(onClose,190)};
  const isToday=date===iso(now);
  useEffect(()=>{
    const timer=setInterval(()=>setNow(new Date()),60000);
    const target=isToday?Math.max(0,(now.getHours()*60+now.getMinutes()-120)*(64/60)):7*64;
    setTimeout(()=>scrollRef.current?.scrollTo({top:target,behavior:"smooth"}),80);
    return ()=>clearInterval(timer);
  },[date]);
  const sorted=[...events].sort((a,b)=>(a.start||"00:00").localeCompare(b.start||"00:00"));
  const nowTop=(now.getHours()*60+now.getMinutes())*(64/60);
  return <div className={"dayBackdrop "+(closing?"closing":"")} onMouseDown={e=>{if(e.currentTarget===e.target)close()}}>
    <section className="dayZoom">
      <header><div><small>{dayNames[parseDate(date).getDay()]}</small><h2>{parseDate(date).toLocaleDateString("hu-HU",{month:"long",day:"numeric"})}</h2></div><div><button className="secondary" onClick={onAdd}>＋ Esemény</button><button className="closeX" onClick={close}>×</button></div></header>
      {sorted.some(e=>e.allDay)&&<div className="allDayRow">{sorted.filter(e=>e.allDay).map(e=><button key={e.id} style={{"--event":calMeta[e.calendar].color} as React.CSSProperties} onClick={()=>onEdit(e)}>{calMeta[e.calendar].icon} {e.title}</button>)}</div>}
      <div className="dayScroll" ref={scrollRef}>
        <div className="hours">{Array.from({length:24},(_,h)=><div className="hourRow" key={h}><span>{String(h).padStart(2,"0")}:00</span><i/></div>)}</div>
        {isToday&&<div className="nowLine" style={{top:nowTop}}><span>{hhmm(now.getHours()*60+now.getMinutes())}</span><i/></div>}
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
  const [closing,setClosing]=useState(false);
  const close=()=>{if(closing)return;setClosing(true);setTimeout(onClose,180)};
  return <div className={"backdrop "+(closing?"closing":"")} onMouseDown={e=>{if(e.currentTarget===e.target)close()}}><div className="modal"><div className="modalHead"><b>{title}</b><button onClick={close}>×</button></div>{children}</div></div>
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