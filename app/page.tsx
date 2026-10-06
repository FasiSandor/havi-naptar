"use client";
import {useEffect,useMemo,useRef,useState} from "react";

type CalKey="work"|"personal"|"family"|"sport";
type RangeMode="1w"|"2w"|"4w"|"month"|"custom"|"list";
type ThemeMode="dark"|"light"|"system";
type RepeatMode="none"|"daily"|"weekly"|"monthly"|"yearly"|"googleSeries";
type Ev={id:string;googleId?:string;title:string;date:string;start?:string;end?:string;allDay?:boolean;calendar:CalKey;location?:string;note?:string;repeat?:RepeatMode;reminder?:number;pendingSync?:boolean};
type SyncOp={id:string;kind:"create"|"update"|"delete";event?:Ev;googleId?:string;createdAt:number};

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
function normText(v?:string){
  return (v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("hu-HU").replace(/[^a-z0-9]+/g," ").trim();
}
function eventKey(e:Pick<Ev,"title"|"date"|"start"|"allDay"|"location">){
  const t=normText(e.title),loc=normText(e.location);
  const time=e.allDay?"allday":(e.start||"").slice(0,5);
  return [e.date,time,t,loc].join("|");
}
function nearDuplicate(a:Ev,b:Ev){
  if(a.date!==b.date)return false;
  if(normText(a.title)!==normText(b.title))return false;
  if(normText(a.location)&&normText(b.location)&&normText(a.location)!==normText(b.location))return false;
  if(a.allDay||b.allDay)return !!a.allDay===!!b.allDay;
  return Math.abs(mins(a.start)-mins(b.start))<=15;
}
function dedupeEvents(list:Ev[]){
  const out:Ev[]=[];
  for(const e of list){
    const sameId=out.findIndex(x=>x.id===e.id);
    const sameGoogle=e.googleId?out.findIndex(x=>x.googleId===e.googleId):-1;
    const exact=sameId>=0?sameId:(sameGoogle>=0?sameGoogle:out.findIndex(x=>eventKey(x)===eventKey(e)));
    const near=exact<0?out.findIndex(x=>nearDuplicate(x,e)):-1;
    const i=exact>=0?exact:near;
    if(i<0){out.push(e);continue}
    const old=out[i];
    if(e.googleId&&!old.googleId)out[i]={...old,...e,pendingSync:false};
    else if(!old.googleId&&!e.googleId)out[i]={...old,...e};
  }
  return out;
}
function toGoogleEvent(x:any):Ev{
  const start=x.start?.dateTime||x.start?.date;
  const category=x.extendedProperties?.private?.haviCategory;
  const haviUid=x.extendedProperties?.private?.haviUid as string|undefined;
  const calendar=(category==="work"||category==="personal"||category==="family"||category==="sport")?category:"work";
  const recurrence=(x.recurrence?.[0]||"") as string;
  let repeat:RepeatMode=x.recurringEventId?"googleSeries":"none";
  if(!x.recurringEventId&&recurrence.includes("FREQ=DAILY"))repeat="daily";
  if(!x.recurringEventId&&recurrence.includes("FREQ=WEEKLY"))repeat="weekly";
  if(!x.recurringEventId&&recurrence.includes("FREQ=MONTHLY"))repeat="monthly";
  if(!x.recurringEventId&&recurrence.includes("FREQ=YEARLY"))repeat="yearly";
  const reminder=Number(x.reminders?.overrides?.[0]?.minutes||0);
  const localId=(!x.recurringEventId&&haviUid)?haviUid:"g-"+x.id;
  return {id:localId,googleId:x.id,title:x.summary||"Esemény",date:(start||"").slice(0,10),start:x.start?.dateTime?.slice(11,16),end:x.end?.dateTime?.slice(11,16),allDay:!!x.start?.date,calendar,location:x.location||"",note:x.description||"",repeat,reminder,pendingSync:false}
}

function mergeGoogleRange(prev:Ev[],incoming:Ev[],from:string,toExclusive:string){
  const local=prev.filter(e=>!e.googleId);
  const keepGoogle=prev.filter(e=>e.googleId&&(e.date<from||e.date>=toExclusive));
  const byId=new Map<string,Ev>();
  for(const e of [...keepGoogle,...incoming]) if(e.googleId) byId.set(e.googleId,{...e,pendingSync:false});
  return dedupeEvents([...local,...byId.values()]);
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
  const [infoEvent,setInfoEvent]=useState<Ev|null>(null);
  const [syncQueue,setSyncQueue]=useState<SyncOp[]>([]);
  const [lastSync,setLastSync]=useState<number|null>(null);

  useEffect(()=>{
    try{
      const stored:Ev[]=JSON.parse(localStorage.getItem("havi-events")||"[]");
      setEvents(dedupeEvents(stored.filter(e=>!e.id.startsWith("workplan-"))));
      const last=Number(localStorage.getItem("havi-last-sync")||0);
      if(last)setLastSync(last);
      setShowWorkPlan(localStorage.getItem("havi-workplan-visible")!=="0");
      localStorage.removeItem("havi-schoolplan-2026-27");
      try{setSyncQueue(JSON.parse(localStorage.getItem("havi-sync-queue")||"[]"))}catch{setSyncQueue([])}
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
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-events",JSON.stringify(dedupeEvents(events.filter(e=>!e.id.startsWith("workplan-")))))},[events,hydrated]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-workplan-visible",showWorkPlan?"1":"0")},[showWorkPlan,hydrated]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-sync-queue",JSON.stringify(syncQueue))},[syncQueue,hydrated]);
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
  const displayEvents=useMemo(()=>dedupeEvents([...events,...(showWorkPlan?schoolPlanEvents:[])]),[events,showWorkPlan]);
  const shown=displayEvents.filter(e=>enabled[e.calendar]&&days.some(d=>iso(d)===e.date)).sort((a,b)=>(a.date+(a.start||"")).localeCompare(b.date+(b.start||"")));

  function queueSync(op:SyncOp){
    setSyncQueue(prev=>{
      const target=op.googleId||op.event?.id||op.id;
      const filtered=prev.filter(x=>(x.googleId||x.event?.id||x.id)!==target);
      return [...filtered,op];
    });
  }

  async function flushSyncQueue(){
    if(!connected||syncQueue.length===0)return;
    const done=new Set<string>();
    for(const op of syncQueue){
      try{
        if(op.kind==="delete"&&op.googleId){
          const r=await fetch("/api/google/events?id="+encodeURIComponent(op.googleId),{method:"DELETE"});
          if(r.ok||r.status===404)done.add(op.id);
          continue;
        }
        if(!op.event)continue;
        const ev=op.event,sd=parseDate(ev.date);
        const payload:any={...ev};
        payload.start=ev.allDay?ev.date:(ev.date+"T"+ev.start+":00");
        payload.end=ev.allDay?iso(addDays(sd,1)):(ev.date+"T"+ev.end+":00");
        payload.endDate=iso(addDays(sd,1));
        const method=op.kind==="update"&&ev.googleId?"PATCH":"POST";
        const r=await fetch("/api/google/events",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if(!r.ok)continue;
        const j=await r.json();
        const gId=j.id||ev.googleId;
        if(gId){
          setEvents(prev=>dedupeEvents(prev.map(x=>x.id===ev.id?{...x,googleId:gId,pendingSync:false}:x)));
          done.add(op.id);
        }
      }catch{}
    }
    if(done.size){
      setSyncQueue(prev=>prev.filter(x=>!done.has(x.id)));
      setNotice(done.size+" függő módosítás szinkronizálva.");
      setTimeout(()=>setNotice(""),1800);
    }
  }
  async function sync(){
    setSyncing(true);
    try{
      const r=await fetch(`/api/google/events?from=${start.toISOString()}&to=${addDays(end,1).toISOString()}`);
      if(!r.ok){setConnected(false);return}
      const j=await r.json();
      if(!j.connected){setConnected(false);return}
      setConnected(true);
      const stamp=Date.now();setLastSync(stamp);localStorage.setItem("havi-last-sync",String(stamp));
      const incoming=(j.items||[]).map(toGoogleEvent);
      setEvents(prev=>mergeGoogleRange(prev,incoming,iso(start),iso(addDays(end,1))));
    }catch{setConnected(false)}
    finally{setSyncing(false)}
  }
  useEffect(()=>{if(hydrated)sync().catch(()=>{})},[start.getTime(),end.getTime(),hydrated]);
  useEffect(()=>{if(hydrated&&connected&&syncQueue.length)flushSyncQueue().catch(()=>{})},[hydrated,connected,syncQueue.length]);
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
        const stamp=Date.now();setLastSync(stamp);localStorage.setItem("havi-last-sync",String(stamp));
        const incoming=(j.items||[]).map(toGoogleEvent);
        setEvents(prev=>mergeGoogleRange(prev,incoming,iso(from),iso(to)));
      }catch{}
    })();
  },[monthFlow,hydrated,anchor.getFullYear(),anchor.getMonth()]);

  async function persist(next:Ev){
    let gId=next.googleId;
    const isExistingGoogle=!!gId;
    const sd=parseDate(next.date);
    const payload:any={...next};
    payload.start=next.allDay?next.date:(next.date+"T"+next.start+":00");
    payload.end=next.allDay?iso(addDays(sd,1)):(next.date+"T"+next.end+":00");
    payload.endDate=iso(addDays(sd,1));

    if(!connected){
      const local={...next,pendingSync:true};
      setEvents(prev=>dedupeEvents([...prev.filter(e=>e.id!==local.id),local]));
      queueSync({id:crypto.randomUUID(),kind:isExistingGoogle?"update":"create",event:local,googleId:gId,createdAt:Date.now()});
      return local;
    }

    try{
      const r=await fetch("/api/google/events",{method:gId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(r.ok){
        const j=await r.json();
        gId=j.id||gId;
        const saved={...next,googleId:gId,pendingSync:false};
        setEvents(prev=>dedupeEvents([...prev.filter(e=>e.id!==saved.id&&(!gId||e.googleId!==gId)),saved]));
        return saved;
      }
    }catch{}

    const local={...next,pendingSync:true};
    setEvents(prev=>dedupeEvents([...prev.filter(e=>e.id!==local.id),local]));
    queueSync({id:crypto.randomUUID(),kind:isExistingGoogle?"update":"create",event:local,googleId:gId,createdAt:Date.now()});
    setNotice("Kapcsolati hiba: az eseményt helyben mentettem, később szinkronizálom.");
    return local;
  }

  async function save(x:Partial<Ev>){
    if(!(x.title||"").trim()){setNotice("Adj nevet az eseménynek.");return false}
    if(!x.date){setNotice("Válassz dátumot.");return false}
    if(!x.allDay&&x.start&&x.end&&x.end<=x.start){setNotice("A befejezés legyen később a kezdésnél.");return false}
    if(!connected&&x.repeat&&x.repeat!=="none"&&x.repeat!=="googleSeries"){setNotice("Az ismétlődő eseményhez Google Naptár-kapcsolat kell.");return false}
    if(!connected&&Number(x.reminder||0)>0){setNotice("Az emlékeztetőhöz Google Naptár-kapcsolat kell.");return false}
    const base:Ev={id:x.id||crypto.randomUUID(),googleId:x.googleId,title:(x.title||"Esemény").trim(),date:x.date,start:x.start||"09:00",end:x.end||"10:00",allDay:!!x.allDay,calendar:(x.calendar||"work") as CalKey,location:x.location||"",note:x.note||"",repeat:(x.repeat||"none") as RepeatMode,reminder:Number(x.reminder||0)};
    const duplicate=displayEvents.find(e=>e.id!==base.id&&(!base.googleId||e.googleId!==base.googleId)&&nearDuplicate(e,base));
    if(duplicate){
      setNotice("Hasonló esemény már szerepel a naptárban: "+duplicate.title);
      setTimeout(()=>setNotice(""),2600);
      return false;
    }
    const saved=await persist(base);
    if(!saved)return false;
    setEditor(null);
    setNotice(saved.googleId?"Esemény mentve és szinkronizálva.":"Esemény helyben mentve.");
    setTimeout(()=>setNotice(""),1800);
    return true;
  }

  async function remove(e:Ev){
    if(e.googleId&&connected){
      try{
        const r=await fetch("/api/google/events?id="+encodeURIComponent(e.googleId),{method:"DELETE"});
        if(!r.ok&&r.status!==404)queueSync({id:crypto.randomUUID(),kind:"delete",googleId:e.googleId,createdAt:Date.now()});
      }catch{
        queueSync({id:crypto.randomUUID(),kind:"delete",googleId:e.googleId,createdAt:Date.now()});
      }
    }else if(e.googleId){
      queueSync({id:crypto.randomUUID(),kind:"delete",googleId:e.googleId,createdAt:Date.now()});
    }
    setEvents(p=>p.filter(x=>x.id!==e.id&&(!e.googleId||x.googleId!==e.googleId)));
    setNotice(e.googleId&&!connected?"Esemény törölve helyben, a Google-t később frissítem.":"Esemény törölve.");
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
      pendingCount={syncQueue.length}
      lastSync={lastSync}
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
      onDetails={x=>{setQuickAdd(false);setEditor(x)}}
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

    {dayOpen&&<MobileDayCards date={dayOpen} events={displayEvents.filter(e=>enabled[e.calendar]&&e.date===dayOpen)} onClose={()=>setDayOpen(null)} onEdit={e=>{if(e.id.startsWith("workplan-"))setInfoEvent(e);else setEditor(e)}} onDelete={e=>{if(!e.id.startsWith("workplan-"))remove(e)}} onAdd={()=>setQuickAdd(true)}/>}
    {dayOpen&&<DayZoom date={dayOpen} events={displayEvents.filter(e=>enabled[e.calendar]&&e.date===dayOpen)} onClose={()=>setDayOpen(null)} onEdit={e=>setEditor(e)} onAdd={()=>setEditor({date:dayOpen,calendar:"work",start:"09:00",end:"10:00"})} onMove={moveEvent} onDelete={remove}/>} 

    {infoEvent&&<Modal title="Munkaterv esemény" onClose={()=>setInfoEvent(null)}>
      <div className="readOnlyEvent">
        <div className="readOnlyBadge">ISKOLAI MUNKATERV · CSAK OLVASHATÓ</div>
        <h3>{infoEvent.title}</h3>
        <div className="readOnlyMeta">
          <span><b>Dátum</b>{parseDate(infoEvent.date).toLocaleDateString("hu-HU",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}</span>
          <span><b>Idő</b>{infoEvent.allDay?"Egész nap":((infoEvent.start||"")+" – "+(infoEvent.end||""))}</span>
          <span><b>Forrás</b>Teleki 2026/2027-es munkaterv</span>
        </div>
      </div>
    </Modal>}

    {editor&&<Modal title={editor.id?"Esemény szerkesztése":"Esemény hozzáadása"} onClose={()=>setEditor(null)}><EventForm value={editor} connected={connected} onSave={save} onCancel={()=>setEditor(null)}/></Modal>}

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
        {syncQueue.length>0&&<div className="pendingSyncSetting">
          <div><b>{syncQueue.length} módosítás vár szinkronra</b><span>Offline vagy sikertelen Google-műveletek. Kapcsolat esetén automatikusan újrapróbáljuk.</span></div>
          <button disabled={!connected} onClick={()=>flushSyncQueue()}>{connected?"Újrapróbálás":"Offline"}</button>
        </div>}
        <div className={"status "+(connected?"ok":"")}><i/><div><b>{connected?"Google Naptár kapcsolódva":"Google Naptár nincs kapcsolva"}</b><span>{connected?"Az iPhone-on használt Google Naptár eseményei megjelennek itt.":"Kapcsold össze egyszer a kétirányú szinkronhoz."}{lastSync?<><br/>Utolsó sikeres szinkron: {new Date(lastSync).toLocaleString("hu-HU")}</>:""}</span></div></div>
        <button className="primary wide" onClick={()=>location.href="/api/google/connect"}>{connected?"Újracsatlakozás":"Google Naptár csatlakoztatása"}</button>
      </div>
    </Modal>}
  </main>
}


function MobilePortrait({anchor,events,connected,syncing,pendingCount,lastSync,onSync,onDay,onLongDay,onQuickAdd,onToday,onPrevMonth,onNextMonth,onSettings}:{anchor:Date;events:Ev[];connected:boolean;syncing:boolean;pendingCount:number;lastSync:number|null;onSync:()=>void;onDay:(d:Date)=>void;onLongDay:(d:Date)=>void;onQuickAdd:()=>void;onToday:()=>void;onPrevMonth:()=>void;onNextMonth:()=>void;onSettings:()=>void}){
  const swipeX=useRef<number|null>(null);
  const swipeY=useRef<number|null>(null);
  const swipeMoved=useRef(false);
  const first=monday(new Date(anchor.getFullYear(),anchor.getMonth(),1,12));
  const days=Array.from({length:42},(_,i)=>addDays(first,i));
  const longTimer=useRef<number|undefined>(undefined);
  const longFired=useRef(false);
  function pressStart(d:Date){
    longFired.current=false;
    longTimer.current=window.setTimeout(()=>{if(!swipeMoved.current){longFired.current=true;onLongDay(d)}},460);
  }
  function pressEnd(d:Date){
    if(longTimer.current)window.clearTimeout(longTimer.current);
    longTimer.current=undefined;
    if(!longFired.current&&!swipeMoved.current)onDay(d);
    setTimeout(()=>{longFired.current=false},60);
  }
  return <section className="mobilePortraitCalendar"
    onPointerDown={e=>{swipeX.current=e.clientX;swipeY.current=e.clientY;swipeMoved.current=false}}
    onPointerMove={e=>{if(swipeX.current===null||swipeY.current===null)return;const dx=e.clientX-swipeX.current,dy=e.clientY-swipeY.current;if(Math.abs(dx)>12||Math.abs(dy)>12){swipeMoved.current=true;if(longTimer.current)window.clearTimeout(longTimer.current)}}}
    onPointerUp={e=>{if(swipeX.current===null||swipeY.current===null)return;const dx=e.clientX-swipeX.current,dy=e.clientY-swipeY.current;swipeX.current=null;swipeY.current=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.25)dx<0?onNextMonth():onPrevMonth();setTimeout(()=>{swipeMoved.current=false},80)}}> 
    <header className="mockHero">
      <div className="monthNavCapsule"><button onClick={onPrevMonth}>‹</button><span>{anchor.getFullYear()}.</span><button onClick={onNextMonth}>›</button></div>
      <div className="mockActions">
        <button className={"syncDot "+(connected?"online":"")} aria-label="Google Naptár szinkron" title={connected?"Google Naptár kapcsolódva":"Google Naptár offline"} onClick={onSync}>{syncing?"↻":connected?"●":"○"}</button>
        <button onClick={onSettings}>⚙</button>
        <button className="mockPlus" onClick={onQuickAdd}>＋</button>
      </div>
    </header>

    <button className="mockMonthTitle" onClick={()=>onLongDay(anchor)}>{anchor.toLocaleDateString("hu-HU",{month:"long"})}<span>↕ tanév</span></button>
    <div className="mobileLegend">
      <span><i className="legendOwn"/>Saját</span>
      <span><i className="legendPlan"/>Munkaterv</span>
      <span><i className="legendHoliday"/>Ünnep</span>
      <span className={pendingCount?"syncState pending":connected?"syncState ok":"syncState"} title={lastSync?"Utolsó szinkron: "+new Date(lastSync).toLocaleString("hu-HU"):""}>{pendingCount?pendingCount+" vár szinkronra":connected?"Google ✓":lastSync?"Offline · cache":"Offline"}</span>
    </div>
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
            {es[0]&&<span className={es[0].note==="Iskolai munkaterv 2026/2027"?"monthEventTitle workPlanTitle":"monthEventTitle"} style={{"--event":es[0].note==="Iskolai munkaterv 2026/2027"?"#F59E0B":calMeta[es[0].calendar].color} as React.CSSProperties}>{es[0].title}</span>}
            {es.length>1&&<small>+{es.length-1}</small>}
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

function MobileDayCards({date,events,onClose,onEdit,onDelete,onAdd}:{date:string;events:Ev[];onClose:()=>void;onEdit:(e:Ev)=>void;onDelete:(e:Ev)=>void;onAdd:()=>void}){
  const d=parseDate(date);
  const sorted=[...events].sort((a,b)=>(a.start||"").localeCompare(b.start||""));
  const holiday=holidayMap[date];
  const [closing,setClosing]=useState(false);
  const [deleteId,setDeleteId]=useState<string|null>(null);
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
        {sorted.length?sorted.map(e=><div key={e.id} className="mobileEventCard" style={{"--event":e.note==="Iskolai munkaterv 2026/2027"?"#F59E0B":calMeta[e.calendar].color} as React.CSSProperties}>
          <button className="mobileEventOpen" onClick={()=>onEdit(e)}>
            <div className="mobileEventTime"><b>{e.allDay?"Egész nap":e.start}</b><span>{e.allDay?"":e.end||""}</span></div>
            <div className="mobileEventIcon">{calMeta[e.calendar].icon}</div>
            <div className="mobileEventText"><b>{e.title}</b><span>{calMeta[e.calendar].label}{e.location?" · "+e.location:""}</span>{e.note==="Iskolai munkaterv 2026/2027"&&<small className="sourceBadge">MUNKATERV · CSAK OLVASHATÓ</small>}{e.pendingSync&&<small className="pendingBadge">SZINKRONRA VÁR</small>}</div>
          </button>
          {!e.id.startsWith("workplan-")&&<button className={"mobileEventDelete "+(deleteId===e.id?"armed":"")} aria-label="Esemény törlése" onClick={()=>{if(deleteId===e.id){onDelete(e);setDeleteId(null)}else{setDeleteId(e.id);setTimeout(()=>setDeleteId(id=>id===e.id?null:id),2200)}}}>{deleteId===e.id?"Törlés":"×"}</button>}
        </div>)}:<div className="mobileNoEvents"><i>✦</i><b>Szabad nap</b><span>Nincs bejegyzett esemény.</span></div>}
      </div>
      <button className="mobilePanelAdd" onClick={onAdd}>＋ Esemény hozzáadása</button>
    </section>
  </div>
}

function ContinuousMonthFlow({anchor,events,onClose,onDay,onToday,onQuickAdd}:{anchor:Date;events:Ev[];onClose:()=>void;onDay:(d:Date)=>void;onToday:()=>void;onQuickAdd:()=>void}){
  const schoolStartYear=anchor.getMonth()>=8?anchor.getFullYear():anchor.getFullYear()-1;
  const months=Array.from({length:12},(_,i)=>new Date(schoolStartYear,8+i,1,12));
  const centerRef=useRef<HTMLDivElement>(null);
  const monthRefs=useRef<Record<string,HTMLElement|null>>({});
  const schoolLabel=`${schoolStartYear}/${String(schoolStartYear+1).slice(2)} tanév`;
  useEffect(()=>{setTimeout(()=>centerRef.current?.scrollIntoView({block:"start",behavior:"auto"}),30)},[schoolStartYear]);
  return <div className="monthFlow">
    <header className="monthFlowHead">
      <button onClick={onClose}>‹</button>
      <div><b>{schoolLabel}</b><small>Szept. 1. – Aug. 31.</small></div>
      <button onClick={onQuickAdd}>＋</button>
    </header>
    <div className="monthJumpRail">
      {months.map(m=>{const key=`${m.getFullYear()}-${m.getMonth()}`;return <button key={key} onClick={()=>monthRefs.current[key]?.scrollIntoView({behavior:"smooth",block:"start"})}>{m.toLocaleDateString("hu-HU",{month:"short"}).replace(".","")}</button>})}
    </div>
    <div className="flowLegend"><span><i className="legendOwn"/>Saját</span><span><i className="legendPlan"/>Munkaterv</span><span><i className="legendHoliday"/>Ünnep</span></div>
    <div className="monthFlowScroll">
      {months.map((m,mi)=>{
        const first=monday(new Date(m.getFullYear(),m.getMonth(),1,12));
        const days=Array.from({length:42},(_,i)=>addDays(first,i));
        const isAnchorMonth=m.getFullYear()===anchor.getFullYear()&&m.getMonth()===anchor.getMonth();
        const key=`${m.getFullYear()}-${m.getMonth()}`;
        return <section key={iso(m)} className="flowMonth" ref={el=>{monthRefs.current[key]=el;if(isAnchorMonth)(centerRef as any).current=el}}> 
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
                <div className="flowEvents">{es.slice(0,2).map(e=><span key={e.id} className={e.note==="Iskolai munkaterv 2026/2027"?"flowWorkPlan":""} style={{"--event":e.note==="Iskolai munkaterv 2026/2027"?"#F59E0B":calMeta[e.calendar].color} as React.CSSProperties}>{e.title}</span>)}{es.length>2&&<small>+{es.length-2}</small>}</div>
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
      const holiday=holidayMap[iso(d)];
      return <button key={iso(d)} className={(current?"":"otherMonth ")+(iso(d)===iso(new Date())?"landToday ":"")+(holiday?"landHoliday ":"")} onClick={()=>onDay(d)}>
        <b>{d.getDate()}</b>
        {holiday&&<em className="landHolidayMark">✦</em>}
        <div>{es.slice(0,3).map(e=><span key={e.id} className={e.note==="Iskolai munkaterv 2026/2027"?"landWorkPlan":""} style={{"--event":e.note==="Iskolai munkaterv 2026/2027"?"#F59E0B":calMeta[e.calendar].color} as React.CSSProperties}>{e.start?<i>{e.start}</i>:null}{e.title}</span>)}</div>
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

type SmartParse={title:string;date:string;start?:string;end?:string;allDay:boolean;duration:number;location?:string;calendar:CalKey;confidence:"high"|"medium"|"low";missing:string[];explicitDate:boolean;explicitTime:boolean};

function parseSmartEvent(input:string,baseDate:Date):SmartParse{
  let raw=input.trim();
  const low=raw.toLocaleLowerCase("hu-HU").replace(/\s+/g," ");
  const missing:string[]=[];
  let d=new Date(baseDate); d.setHours(12,0,0,0);
  let explicitDate=false;

  const monthMap:Record<string,number>={
    jan:0,januar:0,január:0,feb:1,februar:1,február:1,mar:2,marc:2,már:2,március:2,
    apr:3,aprilis:3,ápr:3,április:3,maj:4,majus:4,máj:4,május:4,
    jun:5,junius:5,jún:5,június:5,jul:6,julius:6,júl:6,július:6,
    aug:7,augusztus:7,szept:8,szeptember:8,okt:9,oktober:9,október:9,
    nov:10,november:10,dec:11,december:11
  };
  const weekdays:Record<string,number>={vasarnap:0,vasárnap:0,vasarnapon:0,vasárnapon:0,hetfo:1,hétfő:1,hetfon:1,hétfőn:1,kedd:2,kedden:2,szerda:3,szerdan:3,szerdán:3,csutortok:4,csütörtök:4,csutortokon:4,csütörtökön:4,pentek:5,péntek:5,penteken:5,pénteken:5,szombat:6,szombaton:6};

  if(/\bholnaputan\b|\bholnapután\b/.test(low)){d=addDays(d,2);explicitDate=true}
  else if(/\bholnap\b/.test(low)){d=addDays(d,1);explicitDate=true}
  else if(/\bma\b/.test(low)){explicitDate=true}
  else {
    let matched=false;
    const m1=low.match(/\b(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\b/);
    if(m1){
      let y=m1[3]?Number(m1[3]):d.getFullYear(); if(y<100)y+=2000;
      d=new Date(y,Number(m1[2])-1,Number(m1[1]),12); matched=true; explicitDate=true;
    }
    if(!matched){
      const m2=low.match(/\b(jan\w*|feb\w*|mar\w*|már\w*|apr\w*|ápr\w*|maj\w*|máj\w*|jun\w*|jún\w*|jul\w*|júl\w*|aug\w*|szept\w*|okt\w*|nov\w*|dec\w*)\s+(\d{1,2})(?:[-.]?(?:an|en|án|én))?\b/);
      if(m2){
        const key=m2[1].replace(/[.]$/,"");
        const plain=key.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        const mo=monthMap[key] ?? monthMap[plain];
        if(mo!==undefined){
          const da=Number(m2[2]); let y=d.getFullYear();
          const cand=new Date(y,mo,da,12);
          if(cand.getTime()<addDays(baseDate,-7).getTime()) y++;
          d=new Date(y,mo,da,12); matched=true; explicitDate=true;
        }
      }
    }
    if(!matched){
      const forceNextWeek=/\bjovo\b|\bjövő\b/.test(low);
      for(const [name,target] of Object.entries(weekdays)){
        if(new RegExp("\\b"+name+"\\b").test(low)){
          let delta=(target-d.getDay()+7)%7; if(delta===0)delta=7;
          if(forceNextWeek&&delta<7)delta+=7;
          d=addDays(d,delta); matched=true; explicitDate=true; break;
        }
      }
    }
  }

  let startMins:number|undefined;
  if(/\bdelben\b|\bdélben\b/.test(low))startMins=12*60;
  const halfTime=low.match(/\b(?:(reggel|delelot(?:t)?|délelőtt|delutan|délután|este)\s+)?fel\s+([01]?\d|2[0-3])\b|\b(?:(reggel|delelot(?:t)?|délelőtt|delutan|délután|este)\s+)?fél\s+([01]?\d|2[0-3])\b/);
  if(halfTime){
    const part=(halfTime[1]||halfTime[3]||"").toLocaleLowerCase("hu-HU");
    let h=Number(halfTime[2]||halfTime[4])-1;if(h<0)h=23;
    if((part==="delutan"||part==="délután"||part==="este")&&h<12)h+=12;
    startMins=h*60+30;
  }
  const daypart=low.match(/\b(reggel|delelot(?:t)?|délelőtt|delutan|délután|este)\s+([01]?\d|2[0-3])(?:(?::|\.)([0-5]\d))?\b/);
  if(startMins===undefined&&daypart){
    let h=Number(daypart[2]),m=Number(daypart[3]||0);
    const part=daypart[1];
    if((part==="delutan"||part==="délután"||part==="este")&&h<12)h+=12;
    startMins=h*60+m;
  }
  const tm=low.match(/\b(?:([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s*-?\s*kor)?|([01]?\d|2[0-3])\s*-?\s*(?:ora|óra|kor))\b/);
  if(startMins===undefined&&tm){const h=Number(tm[1]??tm[3]),m=Number(tm[2]??0);startMins=h*60+m}

  let duration=60;
  const durM=low.match(/\b(\d{1,3})\s*(perc|p)\b/);
  const hourDurM=low.match(/\b(?:(\d+[.,]\d+)\s*(?:ora|óra)|(\d+)\s*(?:ora|óra)\s*(?:hosszu|hosszú|idotartam|időtartam))\b/);
  if(durM)duration=Math.max(15,Math.min(12*60,Number(durM[1])));
  else if(hourDurM){const hv=hourDurM[1]||hourDurM[2];duration=Math.max(15,Math.min(12*60,Math.round(Number(hv.replace(",","."))*60)))}
  const explicitAllDay=/\begesz\s+nap(?:os)?\b|\begész\s+nap(?:os)?\b/.test(low);

  const locMatch=raw.match(/@([^,@;]+?)(?=\s+\d{1,2}(?::|\.|\s*-?\s*kor)|$|[,;])/i);
  const location=locMatch?.[1]?.trim()||"";
  let suggestedCalendar:CalKey="personal";
  if(/#?(suli|iskola|munka)\b/i.test(raw))suggestedCalendar="work";
  else if(/#?(csalad|család)\b/i.test(raw))suggestedCalendar="family";
  else if(/#?(sport|edzes|edzés)\b/i.test(raw))suggestedCalendar="sport";

  let title=raw
    .replace(/\bholnaputan\b|\bholnapután\b|\bholnap\b|\bma\b/gi," ")
    .replace(/\b(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\b/g," ")
    .replace(/\b(jan\w*|feb\w*|mar\w*|már\w*|apr\w*|ápr\w*|maj\w*|máj\w*|jun\w*|jún\w*|jul\w*|júl\w*|aug\w*|szept\w*|okt\w*|nov\w*|dec\w*)\s+\d{1,2}(?:[-.]?(?:an|en|án|én))?\b/gi," ")
    .replace(/\b(jovo|jövő)\b/gi," ")
    .replace(/\b(vasarnap(?:on)?|vasárnap(?:on)?|hetfo(?:n)?|hétfő(?:n)?|kedd(?:en)?|szerda(?:n|án)?|csutortok(?:on)?|csütörtök(?:ön)?|pentek(?:en)?|péntek(?:en)?|szombat(?:on)?)\b/gi," ")
    .replace(/\bdelben\b|\bdélben\b/gi," ")
    .replace(/\b(?:(reggel|delelot(?:t)?|délelőtt|delutan|délután|este)\s+)?(?:fel|fél)\s+([01]?\d|2[0-3])\b/gi," ")
    .replace(/\b(reggel|delelot(?:t)?|délelőtt|delutan|délután|este)\s+([01]?\d|2[0-3])(?:(?::|\.)([0-5]\d))?\b/gi," ")
    .replace(/\b(?:([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s*-?\s*kor)?|([01]?\d|2[0-3])\s*-?\s*(?:ora|óra|kor))\b/gi," ")
    .replace(/\b\d{1,3}\s*(?:perc|p)\b/gi," ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ora|óra)\s*(?:hosszu|hosszú|idotartam|időtartam)?\b/gi," ")
    .replace(/\begesz\s+nap(?:os)?\b|\begész\s+nap(?:os)?\b/gi," ")
    .replace(/@([^,@;]+?)(?=\s+\d{1,2}(?::|\.|\s*-?\s*kor)|$|[,;])/gi," ")
    .replace(/#(suli|iskola|munka|csalad|család|sport|edzes|edzés)\b/gi," ")
    .replace(/\s+/g," ").trim()
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g,"");

  if(!title) missing.push("cím");
  if(startMins===undefined&&!explicitAllDay) missing.push("idő");
  const allDay=explicitAllDay;
  const confidence=missing.length===0?"high":title&&missing.length===1?"medium":"low";
  return {
    title:title?title.charAt(0).toUpperCase()+title.slice(1):"",
    date:iso(d),allDay,duration,location,calendar:suggestedCalendar,confidence,missing,explicitDate,explicitTime:startMins!==undefined,
    start:startMins===undefined?undefined:hhmm(startMins),
    end:startMins===undefined?undefined:hhmm(startMins+duration)
  };
}


function cleanExtractedTitle(v:string){
  return v
    .replace(/^(tisztelt|kedves)\b[^.!?]*[.!?]?\s*/i,"")
    .replace(/\b(kérjük|kerjuk|szeretném jelezni|szeretnem jelezni|tájékoztatjuk|tajekoztatjuk|értesítjük|ertesitjuk)\b[^.!?]*$/i,"")
    .replace(/\b(lesz|kerül megrendezésre|kerul megrendezesre|kezdődik|kezdodik)\b.*$/i,"")
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g,"")
    .trim();
}
function inferProseLocation(sentence:string){
  const at=sentence.match(/@([^,@;\n]+)/);
  if(at)return at[1].trim();
  const m=sentence.match(/\b(?:a|az)\s+([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9 .-]{2,40}?)(?:ban|ben|nál|nél|on|en|ön)\b/i);
  return m?.[1]?.trim()||"";
}
function extractEventCandidates(text:string,baseDate:Date){
  const pieces=text.split(/\n+|(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean).slice(0,12);
  const out:SmartParse[]=[];
  for(const piece of pieces){
    const p=parseSmartEvent(piece,baseDate);
    const eventLike=p.explicitDate&&(p.explicitTime||p.allDay);
    if(!eventLike)continue;
    const loc=p.location||inferProseLocation(piece);
    let title=cleanExtractedTitle(p.title);
    title=title.replace(/\b(?:a|az)\s+[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9 .-]{2,40}?(?:ban|ben|nál|nél|on|en|ön)\b/gi," ").replace(/\s+/g," ").trim();
    if(!title)title="Esemény";
    const candidate={...p,title:title.charAt(0).toUpperCase()+title.slice(1),location:loc};
    if(!out.some(x=>x.date===candidate.date&&x.start===candidate.start&&normText(x.title)===normText(candidate.title)))out.push(candidate);
  }
  if(out.length===0){
    const p=parseSmartEvent(text,baseDate);
    if(p.explicitDate&&(p.explicitTime||p.allDay))out.push({...p,title:cleanExtractedTitle(p.title)||"Esemény",location:p.location||inferProseLocation(text)});
  }
  return out.slice(0,5);
}

function QuickAddWheel({baseDate,onClose,onCreate,onDetails}:{baseDate:Date;onClose:()=>void;onCreate:(x:Partial<Ev>)=>Promise<void>;onDetails?:(x:Partial<Ev>)=>void}){
  const [smartText,setSmartText]=useState("");
  const [manual,setManual]=useState(false);
  const [title,setTitle]=useState("");
  const [year,setYear]=useState(baseDate.getFullYear());
  const [month,setMonth]=useState(baseDate.getMonth());
  const [day,setDay]=useState(baseDate.getDate());
  const [time,setTime]=useState(9*60);
  const [allDay,setAllDay]=useState(false);
  const [calendar,setCalendar]=useState<CalKey>("personal");
  const [calendarTouched,setCalendarTouched]=useState(false);
  const parsed=useMemo(()=>parseSmartEvent(smartText,baseDate),[smartText,baseDate]);
  const maxDay=new Date(year,month+1,0).getDate();
  const safeDay=Math.min(day,maxDay);
  const date=iso(new Date(year,month,safeDay,12));
  const monthItems=Array.from({length:14},(_,i)=>{const d=new Date(baseDate.getFullYear(),baseDate.getMonth()-2+i,1,12);return {value:d.getFullYear()*12+d.getMonth(),label:d.toLocaleDateString("hu-HU",{month:"short"})+" "+String(d.getFullYear()).slice(2)}});
  const monthValue=year*12+month;
  const chooseMonth=(v:number)=>{const y=Math.floor(v/12),m=v%12;setYear(y);setMonth(m);setDay(d=>Math.min(d,new Date(y,m+1,0).getDate()))};
  const smartCalendar=calendarTouched?calendar:parsed.calendar;
  const smartPayload:Partial<Ev>={title:parsed.title,date:parsed.date,allDay:parsed.allDay,start:parsed.start,end:parsed.end,calendar:smartCalendar,location:parsed.location};
  const manualPayload:Partial<Ev>={title,date,allDay,start:allDay?undefined:hhmm(time),end:allDay?undefined:hhmm(time+60),calendar};
  const payload=manual?manualPayload:smartPayload;
  const canSmartSave=!manual&&!!parsed.title&&parsed.missing.length===0;
  return <div className="quickBackdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <section className="quickSheet smartQuickSheet">
      <div className="quickGrabber"/>
      <header><div><small>GYORS BEVITEL</small><h2>Új esemény</h2></div><button onClick={onClose}>×</button></header>

      {!manual&&<>
        <textarea className="smartInput" autoFocus rows={2} placeholder="pl. okt 15 fodrász 16.10-kor" value={smartText} onChange={e=>setSmartText(e.target.value)} onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"&&canSmartSave)onCreate(smartPayload)}}/>
        <div className={"smartPreview "+parsed.confidence}>
          <div className="smartPreviewHead"><span>{parsed.confidence==="high"?"Értettem ✓":parsed.confidence==="medium"?"Majdnem kész":"Írd le az eseményt"}</span><small>{parsed.date}</small></div>
          {parsed.title?<b>{parsed.title}</b>:<b>Mi legyen az esemény?</b>}
          <p>{parsed.allDay?"Egész nap":parsed.start+" – "+parsed.end}{parsed.duration!==60&&!parsed.allDay?" · "+parsed.duration+" perc":""}{parsed.location?" · @"+parsed.location:""}</p>
          {parsed.missing.length>0&&<em>Hiányzik: {parsed.missing.join(", ")}</em>}
        </div>
        <div className="smartExamples">Példák: <span>holnap értekezlet 14.30</span> · <span>jövő kedden fodrász 16.10</span> · <span>pénteken reggel 8 fogorvos</span></div>
      </>}

      {manual&&<>
        <input className="quickTitle" autoFocus placeholder="Mi legyen?" value={title} onChange={e=>setTitle(e.target.value)}/>
        <div className="wheelPicker">
          <WheelScroller label="HÓNAP" items={monthItems} value={monthValue} onChange={chooseMonth}/>
          <WheelScroller label="NAP" items={Array.from({length:maxDay},(_,i)=>({value:i+1,label:String(i+1)}))} value={safeDay} onChange={setDay}/>
          <WheelScroller label={allDay?"EGÉSZ NAP":"IDŐ"} items={allDay?[{value:0,label:"—"}]:Array.from({length:96},(_,i)=>({value:i*15,label:hhmm(i*15)}))} value={allDay?0:time} onChange={setTime}/>
        </div>
        <div className="quickOptions"><button type="button" className={allDay?"on":""} onClick={()=>setAllDay(v=>!v)}><i/> Egész napos</button><span>{date}</span></div>
      </>}

      <div className="quickCategories">{(Object.keys(calMeta) as CalKey[]).map(k=><button key={k} className={(manual?calendar:(calendarTouched?calendar:parsed.calendar))===k?"active":""} style={{"--event":calMeta[k].color} as React.CSSProperties} onClick={()=>{setCalendar(k);setCalendarTouched(true)}}><span>{calMeta[k].icon}</span>{calMeta[k].label}</button>)}</div>

      <button className="manualToggle" onClick={()=>setManual(v=>!v)}>{manual?"← Intelligens bevitel":"Dátum/idő kézi beállítása"}</button>

      <div className="quickFooter">
        {onDetails&&<button className="quickDetails" disabled={!manual&&!parsed.title} onClick={()=>onDetails(payload)}>Részletek</button>}
        <button className="quickSave" disabled={manual?!title.trim():!canSmartSave} onClick={()=>onCreate(payload)}>Rögzítés <span>→</span></button>
      </div>
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
function EventForm({value,connected,onSave,onCancel}:{value:Partial<Ev>;connected:boolean;onSave:(x:Partial<Ev>)=>void;onCancel:()=>void}){
  const [x,setX]=useState(value);
  return <div className="form">
    <label><span>Cím</span><input value={x.title||""} onChange={e=>setX({...x,title:e.target.value})} placeholder="Esemény neve"/></label>
    <div className="two"><label><span>Dátum</span><input type="date" value={x.date||""} onChange={e=>setX({...x,date:e.target.value})}/></label><label className="toggleLabel"><span>Egész napos</span><input type="checkbox" checked={!!x.allDay} onChange={e=>setX({...x,allDay:e.target.checked})}/></label></div>
    {!x.allDay&&<div className="two"><label><span>Kezdés</span><input type="time" step="900" value={x.start||""} onChange={e=>setX({...x,start:e.target.value})}/></label><label><span>Vége</span><input type="time" step="900" value={x.end||""} onChange={e=>setX({...x,end:e.target.value})}/></label></div>}
    <label><span>Naptár</span><select value={x.calendar||"work"} onChange={e=>setX({...x,calendar:e.target.value as CalKey})}>{(Object.keys(calMeta) as CalKey[]).map(k=><option key={k} value={k}>{calMeta[k].icon} {calMeta[k].label}</option>)}</select></label>
    <div className="two advancedFields">
      <label><span>Ismétlődés</span><select disabled={!connected||x.repeat==="googleSeries"} value={x.repeat||"none"} onChange={e=>setX({...x,repeat:e.target.value as RepeatMode})}>
        {x.repeat==="googleSeries"&&<option value="googleSeries">Google-sorozat</option>}
        <option value="none">Nincs</option><option value="daily">Naponta</option><option value="weekly">Hetente</option><option value="monthly">Havonta</option><option value="yearly">Évente</option>
      </select></label>
      <label><span>Emlékeztető</span><select disabled={!connected} value={Number(x.reminder||0)} onChange={e=>setX({...x,reminder:Number(e.target.value)})}>
        <option value={0}>Nincs</option><option value={5}>5 perccel előtte</option><option value={10}>10 perccel előtte</option><option value={15}>15 perccel előtte</option><option value={30}>30 perccel előtte</option><option value={60}>1 órával előtte</option><option value={1440}>1 nappal előtte</option>
      </select></label>
    </div>
    {!connected&&<small className="googleOnlyHint">Az ismétlődés és az emlékeztető Google Naptár-kapcsolattal érhető el.</small>}
    <label><span>Helyszín</span><input value={x.location||""} onChange={e=>setX({...x,location:e.target.value})} placeholder="Opcionális"/></label>
    <label><span>Megjegyzés</span><textarea value={x.note||""} onChange={e=>setX({...x,note:e.target.value})} placeholder="Opcionális"/></label>
    <div className="modalActions"><button className="secondary" onClick={onCancel}>Mégse</button><button className="primary" onClick={()=>onSave(x)}>Mentés</button></div>
  </div>
}