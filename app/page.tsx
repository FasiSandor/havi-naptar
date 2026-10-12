"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import CoreGoogleSyncSettings from "./CoreGoogleSyncSettings";

type CalKey="work"|"personal"|"family"|"sport";
type RangeMode="1w"|"2w"|"3w"|"4w"|"month"|"custom"|"list";
type ThemeMode="dark"|"light"|"system";
type RepeatMode="none"|"daily"|"weekly"|"monthly"|"yearly"|"googleSeries";
type Ev={id:string;googleId?:string;centralEventId?:string;sourceApp?:string;sourceRecordId?:string;title:string;date:string;start?:string;end?:string;allDay?:boolean;calendar:CalKey;location?:string;note?:string;repeat?:RepeatMode;reminder?:number;pendingSync?:boolean;linkedApp?:string;linkedLabel?:string;linkedUrl?:string};
type SyncOp={id:string;kind:"create"|"update"|"delete";event?:Ev;googleId?:string;createdAt:number};
type Suggestion={id:string;source_app:string;source_record_id:string;source_url?:string|null;title:string;summary?:string|null;event_date?:string|null;starts_at?:string|null;ends_at?:string|null;all_day:boolean;timezone:string;location?:string|null;confidence:"probable"|"uncertain";status:"pending"|"accepted"|"rejected";payload?:Record<string,any>;created_at:string};

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
function isWorkPlanEvent(e:Pick<Ev,"id"|"sourceApp">){return e.id.startsWith("workplan-")||e.sourceApp==="teleki-workplan"}
function nearDuplicate(a:Ev,b:Ev){
  if(a.date!==b.date)return false;
  if(normText(a.title)!==normText(b.title))return false;
  if(normText(a.location)&&normText(b.location)&&normText(a.location)!==normText(b.location))return false;
  if(a.allDay||b.allDay)return !!a.allDay===!!b.allDay;
  return Math.abs(mins(a.start)-mins(b.start))<=15;
}
function timeOverlap(a:Ev,b:Ev){
  if(a.date!==b.date||a.allDay||b.allDay)return false;
  const as=mins(a.start),ae=mins(a.end),bs=mins(b.start),be=mins(b.end);
  return Math.max(as,bs)<Math.min(ae,be);
}
function dedupeEvents(list:Ev[]){
  const out:Ev[]=[];
  for(const e of list){
    const sameId=out.findIndex(x=>x.id===e.id);
    const sameGoogle=e.googleId?out.findIndex(x=>x.googleId===e.googleId):-1;
    const sameCore=e.centralEventId?out.findIndex(x=>x.centralEventId===e.centralEventId):-1;
    const exact=sameId>=0?sameId:(sameGoogle>=0?sameGoogle:(sameCore>=0?sameCore:out.findIndex(x=>eventKey(x)===eventKey(e))));
    const near=exact<0?out.findIndex(x=>nearDuplicate(x,e)):-1;
    const i=exact>=0?exact:near;
    if(i<0){out.push(e);continue}
    const old=out[i];
    out[i]={
      ...old,
      ...e,
      id:old.id.startsWith("g-")&&e.sourceApp==="havi"?e.id:old.id,
      googleId:e.googleId||old.googleId,
      centralEventId:e.centralEventId||old.centralEventId,
      sourceApp:e.sourceApp||old.sourceApp,
      sourceRecordId:e.sourceRecordId||old.sourceRecordId,
      pendingSync:(e.googleId||old.googleId)?false:(e.pendingSync??old.pendingSync)
    };
  }
  return out;
}
function toGoogleEvent(x:any):Ev{
  const start=x.start?.dateTime||x.start?.date;
  const category=x.extendedProperties?.private?.haviCategory;
  const haviUid=x.extendedProperties?.private?.haviUid as string|undefined;
  const centralEventId=x.extendedProperties?.private?.calendarCoreId as string|undefined;
  const sourceApp=x.extendedProperties?.private?.sourceApp as string|undefined;
  const sourceRecordId=x.extendedProperties?.private?.sourceRecordId as string|undefined;
  const calendar=(category==="work"||category==="personal"||category==="family"||category==="sport")?category:"work";
  const recurrence=(x.recurrence?.[0]||"") as string;
  let repeat:RepeatMode=x.recurringEventId?"googleSeries":"none";
  if(!x.recurringEventId&&recurrence.includes("FREQ=DAILY"))repeat="daily";
  if(!x.recurringEventId&&recurrence.includes("FREQ=WEEKLY"))repeat="weekly";
  if(!x.recurringEventId&&recurrence.includes("FREQ=MONTHLY"))repeat="monthly";
  if(!x.recurringEventId&&recurrence.includes("FREQ=YEARLY"))repeat="yearly";
  const reminder=Number(x.reminders?.overrides?.[0]?.minutes||0);
  const localId=(!x.recurringEventId&&haviUid)?haviUid:"g-"+x.id;
  return {id:localId,googleId:x.id,centralEventId,sourceApp:sourceApp||"google",sourceRecordId,title:x.summary||"Esemény",date:(start||"").slice(0,10),start:x.start?.dateTime?.slice(11,16),end:x.end?.dateTime?.slice(11,16),allDay:!!x.start?.date,calendar,location:x.location||"",note:x.description||"",repeat,reminder,pendingSync:false}
}

function toCoreEvent(x:any):Ev{
  const calendar=(x.category==="work"||x.category==="personal"||x.category==="family"||x.category==="sport")?x.category:"work";
  const allDay=!!x.all_day;
  let date="";
  let start: string|undefined;
  let end: string|undefined;
  if(allDay){
    date=String(x.event_date||"").slice(0,10);
  }else{
    const sd=new Date(x.starts_at);
    const ed=new Date(x.ends_at);
    date=iso(sd);
    start=hhmm(sd.getHours()*60+sd.getMinutes());
    end=hhmm(ed.getHours()*60+ed.getMinutes());
  }
  const sourceApp=String(x.source_app||"core");
  const sourceRecordId=x.source_record_id?String(x.source_record_id):undefined;
  const localId=sourceApp==="havi"&&sourceRecordId?sourceRecordId:"core-"+String(x.id);
  return {
    id:localId,
    googleId:x.google_event_id?String(x.google_event_id):undefined,
    centralEventId:String(x.id),
    sourceApp,
    sourceRecordId,
    title:String(x.title||"Esemény"),
    date,
    start,
    end,
    allDay,
    calendar,
    location:String(x.location||""),
    note:String(x.note||""),
    repeat:String(x.metadata?.repeat||"none") as RepeatMode,
    reminder:Number(x.metadata?.reminder||0),
    pendingSync:false,
    linkedApp:x.metadata?.linkedApp?String(x.metadata.linkedApp):undefined,
    linkedLabel:x.metadata?.linkedLabel?String(x.metadata.linkedLabel):undefined,
    linkedUrl:x.metadata?.linkedUrl?String(x.metadata.linkedUrl):undefined
  };
}

function corePayload(e:Ev){
  const localIso=(date:string,time:string)=>new Date(date+"T"+time+":00").toISOString();
  return {
    title:e.title,
    date:e.allDay?e.date:null,
    startsAt:e.allDay?null:localIso(e.date,e.start||"09:00"),
    endsAt:e.allDay?null:localIso(e.date,e.end||"10:00"),
    allDay:!!e.allDay,
    timezone:"Europe/Budapest",
    category:e.calendar,
    location:e.location||"",
    note:e.note||"",
    sourceApp:e.sourceApp||"havi",
    sourceRecordId:e.sourceRecordId||e.id,
    googleEventId:e.googleId||null,
    metadata:{repeat:e.repeat||"none",reminder:Number(e.reminder||0),linkedApp:e.linkedApp||null,linkedLabel:e.linkedLabel||null,linkedUrl:e.linkedUrl||null}
  };
}

async function saveToCore(e:Ev){
  const method=e.centralEventId?"PATCH":"POST";
  const url=e.centralEventId?"/api/core/events?id="+encodeURIComponent(e.centralEventId):"/api/core/events";
  const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(corePayload(e))});
  if(!r.ok)return e;
  const j=await r.json();
  return {...e,centralEventId:String(j.id||e.centralEventId||""),sourceApp:String(j.source_app||e.sourceApp||"havi"),sourceRecordId:String(j.source_record_id||e.sourceRecordId||e.id),googleId:j.google_event_id?String(j.google_event_id):e.googleId};
}

async function loadCoreRange(from:Date,to:Date){
  try{
    const r=await fetch("/api/core/events?from="+encodeURIComponent(from.toISOString())+"&to="+encodeURIComponent(to.toISOString()),{cache:"no-store"});
    if(!r.ok)return [] as Ev[];
    const j=await r.json();
    return (j.items||[]).map(toCoreEvent).filter((e:Ev)=>!!e.date);
  }catch{return [] as Ev[]}
}

function mergeGoogleRange(prev:Ev[],incoming:Ev[],from:string,toExclusive:string){
  const local=prev.filter(e=>!e.googleId);
  const keepGoogle=prev.filter(e=>e.googleId&&(e.date<from||e.date>=toExclusive));
  const byId=new Map<string,Ev>();
  for(const e of [...keepGoogle,...incoming]) if(e.googleId) byId.set(e.googleId,{...e,pendingSync:false});
  return dedupeEvents([...local,...byId.values()]);
}

function mergeCoreRange(prev:Ev[],incoming:Ev[],from:string,toExclusive:string){
  const keep=prev.filter(e=>!e.centralEventId||e.date<from||e.date>=toExclusive);
  return dedupeEvents([...keep,...incoming]);
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
  const [searchOpen,setSearchOpen]=useState(false);
  const [clock,setClock]=useState(()=>Date.now());
  const [backupPreview,setBackupPreview]=useState<{events:Ev[];total:number;duplicates:number;invalid:number;name:string}|null>(null);
  const [wallPrintOpen,setWallPrintOpen]=useState(false);
  const [wallPrintMode,setWallPrintMode]=useState<"2w"|"3w"|"4w"|"month">("month");
  const [suggestions,setSuggestions]=useState<Suggestion[]>([]);

  useEffect(()=>{
    try{
      const stored:Ev[]=JSON.parse(localStorage.getItem("havi-events")||"[]");
      setEvents(dedupeEvents(stored.filter(e=>!isWorkPlanEvent(e))));
      const last=Number(localStorage.getItem("havi-last-sync")||0);
      if(last)setLastSync(last);
      setShowWorkPlan(localStorage.getItem("havi-workplan-visible")!=="0");
      localStorage.removeItem("havi-schoolplan-2026-27");
      try{setSyncQueue(JSON.parse(localStorage.getItem("havi-sync-queue")||"[]"))}catch{setSyncQueue([])}
      const savedTheme=localStorage.getItem("havi-theme");
      if(savedTheme==="dark"||savedTheme==="light"||savedTheme==="system") setThemeMode(savedTheme);
      const savedView=localStorage.getItem("havi-range-mode");
      if(savedView==="2w"||savedView==="3w"||savedView==="4w"||savedView==="month") setMode(savedView);
      const params=new URLSearchParams(window.location.search);
      const status=params.get("google");
      const gmailStatus=params.get("gmail_realtime"),gmailAccount=params.get("account");
      if(status==="connected") setNotice("Google Naptár kapcsolódva.");
      if(status==="error") setNotice("A Google Naptár csatlakoztatása nem sikerült.");
      if(status==="config") setNotice("A Google OAuth beállítása még hiányzik.");
      if(gmailStatus==="connected") setNotice("Gmail kapcsolat frissítve"+(gmailAccount?": "+gmailAccount:"")+".");
      if(status||gmailStatus) window.history.replaceState({}, "", window.location.pathname);
    }catch{}
    finally{setHydrated(true)}
  },[]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-events",JSON.stringify(dedupeEvents(events.filter(e=>!isWorkPlanEvent(e)))))},[events,hydrated]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-workplan-visible",showWorkPlan?"1":"0")},[showWorkPlan,hydrated]);
  useEffect(()=>{if(hydrated)localStorage.setItem("havi-sync-queue",JSON.stringify(syncQueue))},[syncQueue,hydrated]);
  useEffect(()=>{
    if(!hydrated)return;
    loadSuggestions();
    const t=window.setInterval(()=>loadSuggestions(),60000);
    return ()=>window.clearInterval(t);
  },[hydrated]);
  useEffect(()=>{
    const t=setInterval(()=>setClock(Date.now()),60000);
    return ()=>clearInterval(t);
  },[]);
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
    if(mode==="2w"||mode==="3w"||mode==="4w"||mode==="month") localStorage.setItem("havi-range-mode",mode);
  },[mode,hydrated]);
  useEffect(()=>{
    if(!hydrated)return;
    const portrait=window.matchMedia("(orientation: portrait)");
    const apply=()=>{if(!portrait.matches)setRotateHint(false)};
    apply();
    portrait.addEventListener?.("change",apply);
    return ()=>portrait.removeEventListener?.("change",apply);
  },[hydrated]);

  const {start,count}=useMemo(()=>{
    if(mode==="custom"){
      const a=parseDate(customStart),b=parseDate(customEnd);
      return {start:a,count:Math.max(1,Math.min(62,daysBetween(a,b)))};
    }
    if(mode==="month"){
      const first=new Date(anchor.getFullYear(),anchor.getMonth(),1,12);
      const start=monday(first);
      const last=new Date(anchor.getFullYear(),anchor.getMonth()+1,0,12);
      const weeks=Math.ceil((Math.round((last.getTime()-start.getTime())/86400000)+1)/7);
      return {start,count:Math.max(35,Math.min(42,weeks*7))};
    }
    if(mode==="1w")return {start:monday(anchor),count:7};
    if(mode==="2w")return {start:monday(anchor),count:14};
    if(mode==="3w")return {start:monday(anchor),count:21};
    return {start:monday(anchor),count:28};
  },[anchor,mode,customStart,customEnd]);

  const days=useMemo(()=>Array.from({length:count},(_,i)=>addDays(start,i)),[start,count]);
  const end=days[days.length-1];
  const displayEvents=useMemo(()=>dedupeEvents([...(showWorkPlan?events:events.filter(e=>!isWorkPlanEvent(e))),...(showWorkPlan?schoolPlanEvents:[])]),[events,showWorkPlan]);
  const enabledEvents=useMemo(()=>displayEvents.filter(e=>enabled[e.calendar]),[displayEvents,enabled]);
  const shown=enabledEvents.filter(e=>days.some(d=>iso(d)===e.date)).sort((a,b)=>(a.date+(a.start||"")).localeCompare(b.date+(b.start||"")));
  const clockDate=new Date(clock);
  const todayIso=iso(clockDate);
  const nowMinutes=clockDate.getHours()*60+clockDate.getMinutes();
  const upcomingEvents=useMemo(()=>{
    const limitIso=iso(addDays(clockDate,7));
    return enabledEvents
      .filter(e=>(e.date>todayIso||(e.date===todayIso&&(e.allDay||mins(e.end||e.start)>=nowMinutes)))&&e.date<=limitIso)
      .sort((a,b)=>(a.date+(a.allDay?"00:00":a.start||"")).localeCompare(b.date+(b.allDay?"00:00":b.start||"")));
  },[enabledEvents,todayIso,nowMinutes,clock]);

  async function loadSuggestions(){
    try{
      const r=await fetch("/api/core/suggestions",{cache:"no-store"});
      if(!r.ok)return;
      const j=await r.json();
      setSuggestions(Array.isArray(j.items)?j.items:[]);
    }catch{}
  }

  async function decideSuggestion(id:string,action:"accept"|"reject"){
    try{
      const r=await fetch("/api/core/suggestions?id="+encodeURIComponent(id),{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action})
      });
      if(!r.ok)throw new Error("decision_failed");
      const j=await r.json();
      setSuggestions(prev=>prev.filter(x=>x.id!==id));
      if(action==="accept"&&j.event){
        const ev=toCoreEvent(j.event);
        setEvents(prev=>dedupeEvents([...prev.filter(x=>x.centralEventId!==ev.centralEventId),ev]));
        setNotice("Esemény bekerült a naptárba.");
      }else{
        setNotice("Javaslat elutasítva.");
      }
      setTimeout(()=>setNotice(""),1500);
    }catch{
      setNotice("A döntés mentése nem sikerült.");
      setTimeout(()=>setNotice(""),1800);
    }
  }

  function queueSync(op:SyncOp){
    setSyncQueue(prev=>{
      const target=op.googleId||op.event?.id||op.id;
      const filtered=prev.filter(x=>(x.googleId||x.event?.id||x.id)!==target);
      return [...filtered,op];
    });
  }
  function clearQueuedFor(eventId?:string,googleId?:string){
    if(!eventId&&!googleId)return;
    setSyncQueue(prev=>prev.filter(op=>{
      const opEventId=op.event?.id;
      const opGoogleId=op.googleId||op.event?.googleId;
      return !((eventId&&opEventId===eventId)||(googleId&&opGoogleId===googleId));
    }));
  }
  function filterPendingDeletes(incoming:Ev[]){
    const blocked=new Set(syncQueue.filter(op=>op.kind==="delete").map(op=>op.googleId).filter(Boolean) as string[]);
    return blocked.size?incoming.filter(e=>!e.googleId||!blocked.has(e.googleId)):incoming;
  }

  function reconcileQueueWithIncoming(incoming:Ev[]){
    if(!incoming.length)return;
    const ids=new Set(incoming.map(e=>e.id));
    const gids=new Set(incoming.map(e=>e.googleId).filter(Boolean) as string[]);
    setSyncQueue(prev=>prev.filter(op=>{
      // Csak egy elveszett válaszú CREATE igazolható pusztán abból, hogy ugyanaz
      // a haviUid/Google ID már megjelent a szerveren. UPDATE/DELETE maradjon,
      // amíg a konkrét művelet sikeresen le nem fut.
      if(op.kind!=="create")return true;
      const opEventId=op.event?.id;
      const opGoogleId=op.googleId||op.event?.googleId;
      return !((opEventId&&ids.has(opEventId))||(opGoogleId&&gids.has(opGoogleId)));
    }));
  }

  async function syncCoreRange(from:Date,to:Date){
    const incoming=await loadCoreRange(from,to);
    setEvents(prev=>mergeCoreRange(prev,incoming,iso(from),iso(to)));
    return incoming;
  }

  async function importGoogleToCore(incoming:Ev[]){
    const out:Ev[]=[];
    for(const e of incoming){
      if(!e.googleId||e.centralEventId){
        out.push(e);
        continue;
      }
      try{
        const saved=await saveToCore({
          ...e,
          sourceApp:"google",
          sourceRecordId:e.googleId,
          pendingSync:false
        });
        out.push({...e,...saved,sourceApp:"google",sourceRecordId:e.googleId,pendingSync:false});
      }catch{
        out.push(e);
      }
    }
    return out;
  }

  async function flushSyncQueue(){
    if(!connected||syncQueue.length===0)return;
    const done=new Set<string>();
    for(const op of syncQueue){
      try{
        if(op.kind==="delete"&&op.googleId){
          const r=await fetch("/api/google/events?id="+encodeURIComponent(op.googleId),{method:"DELETE"});
          if(r.ok||r.status===404){
            const deletedGoogleId=op.googleId;
            setEvents(prev=>prev.filter(e=>e.googleId!==deletedGoogleId));
            done.add(op.id);
          }
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
          const synced=await saveToCore({...ev,googleId:gId,pendingSync:false});
          setEvents(prev=>dedupeEvents(prev.map(x=>x.id===ev.id?{...x,...synced,googleId:gId,pendingSync:false}:x)));
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
      await syncCoreRange(start,addDays(end,1));
      try{
        const r=await fetch(`/api/google/events?from=${start.toISOString()}&to=${addDays(end,1).toISOString()}`);
        if(!r.ok){setConnected(false);return}
        const j=await r.json();
        if(!j.connected){setConnected(false);return}
        setConnected(true);
        const stamp=Date.now();setLastSync(stamp);localStorage.setItem("havi-last-sync",String(stamp));
        const rawIncoming=filterPendingDeletes((j.items||[]).map(toGoogleEvent));
        const incoming=await importGoogleToCore(rawIncoming);
        reconcileQueueWithIncoming(incoming);
        setEvents(prev=>mergeGoogleRange(prev,incoming,iso(start),iso(addDays(end,1))));
      }catch{setConnected(false)}
    }finally{setSyncing(false)}
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
        await syncCoreRange(from,to);
        const r=await fetch(`/api/google/events?from=${from.toISOString()}&to=${to.toISOString()}`);
        if(!r.ok)return;
        const j=await r.json();
        if(!j.connected)return;
        const stamp=Date.now();setLastSync(stamp);localStorage.setItem("havi-last-sync",String(stamp));
        const rawIncoming=filterPendingDeletes((j.items||[]).map(toGoogleEvent));
        const incoming=await importGoogleToCore(rawIncoming);
        reconcileQueueWithIncoming(incoming);
        setEvents(prev=>mergeGoogleRange(prev,incoming,iso(from),iso(to)));
      }catch{}
    })();
  },[monthFlow,hydrated,anchor.getFullYear(),anchor.getMonth()]);
  useEffect(()=>{
    if(!hydrated||!searchOpen)return;
    const schoolStartYear=anchor.getMonth()>=8?anchor.getFullYear():anchor.getFullYear()-1;
    const from=new Date(schoolStartYear,8,1,0,0,0,0);
    const to=new Date(schoolStartYear+1,8,1,0,0,0,0);
    (async()=>{
      try{
        await syncCoreRange(from,to);
        const r=await fetch("/api/google/events?from="+encodeURIComponent(from.toISOString())+"&to="+encodeURIComponent(to.toISOString()));
        if(!r.ok)return;
        const j=await r.json();
        if(!j.connected)return;
        setConnected(true);
        const stamp=Date.now();setLastSync(stamp);localStorage.setItem("havi-last-sync",String(stamp));
        const rawIncoming=filterPendingDeletes((j.items||[]).map(toGoogleEvent));
        const incoming=await importGoogleToCore(rawIncoming);
        reconcileQueueWithIncoming(incoming);
        setEvents(prev=>mergeGoogleRange(prev,incoming,iso(from),iso(to)));
      }catch{}
    })();
  },[searchOpen,hydrated,anchor.getFullYear(),anchor.getMonth()]);

  async function persist(next:Ev){
    let gId=next.googleId;
    const isExistingGoogle=!!gId;
    const sd=parseDate(next.date);
    const payload:any={...next};
    payload.start=next.allDay?next.date:(next.date+"T"+next.start+":00");
    payload.end=next.allDay?iso(addDays(sd,1)):(next.date+"T"+next.end+":00");
    payload.endDate=iso(addDays(sd,1));

    if(!connected){
      let local:Ev={...next,pendingSync:true};
      local=await saveToCore(local);
      setEvents(prev=>dedupeEvents([...prev.filter(e=>e.id!==local.id),local]));
      queueSync({id:crypto.randomUUID(),kind:isExistingGoogle?"update":"create",event:local,googleId:gId,createdAt:Date.now()});
      return local;
    }

    try{
      const r=await fetch("/api/google/events",{method:gId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(r.ok){
        const j=await r.json();
        gId=j.id||gId;
        let saved:Ev={...next,googleId:gId,pendingSync:false};
        saved=await saveToCore(saved);
        clearQueuedFor(saved.id,gId);
        setEvents(prev=>dedupeEvents([...prev.filter(e=>e.id!==saved.id&&(!gId||e.googleId!==gId)),saved]));
        return saved;
      }
    }catch{}

    let local:Ev={...next,pendingSync:true};
    local=await saveToCore(local);
    setEvents(prev=>dedupeEvents([...prev.filter(e=>e.id!==local.id),local]));
    queueSync({id:crypto.randomUUID(),kind:isExistingGoogle?"update":"create",event:local,googleId:gId,createdAt:Date.now()});
    setNotice("Google-kapcsolati hiba: az eseményt a központi naptárba mentettem, Google-ba később szinkronizálom.");
    return local;
  }

  async function save(x:Partial<Ev>){
    if(!(x.title||"").trim()){setNotice("Adj nevet az eseménynek.");return false}
    if(!x.date){setNotice("Válassz dátumot.");return false}
    if(!x.allDay&&x.start&&x.end&&x.end<=x.start){setNotice("A befejezés legyen később a kezdésnél.");return false}
    if(!connected&&x.repeat&&x.repeat!=="none"&&x.repeat!=="googleSeries"){setNotice("Az ismétlődő eseményhez Google Naptár-kapcsolat kell.");return false}
    if(!connected&&Number(x.reminder||0)>0){setNotice("Az emlékeztetőhöz Google Naptár-kapcsolat kell.");return false}
    const id=x.id||crypto.randomUUID();
    const base:Ev={id,googleId:x.googleId,centralEventId:x.centralEventId,sourceApp:x.sourceApp||"havi",sourceRecordId:x.sourceRecordId||id,title:(x.title||"Esemény").trim(),date:x.date,start:x.start||"09:00",end:x.end||"10:00",allDay:!!x.allDay,calendar:(x.calendar||"work") as CalKey,location:x.location||"",note:x.note||"",repeat:(x.repeat||"none") as RepeatMode,reminder:Number(x.reminder||0),linkedApp:x.linkedApp,linkedLabel:x.linkedLabel,linkedUrl:x.linkedUrl};
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
    if(e.centralEventId){
      try{await fetch("/api/core/events?id="+encodeURIComponent(e.centralEventId),{method:"DELETE"})}catch{}
    }
    if(!e.googleId){
      clearQueuedFor(e.id);
    }
    if(e.googleId&&connected){
      try{
        const r=await fetch("/api/google/events?id="+encodeURIComponent(e.googleId),{method:"DELETE"});
        if(r.ok||r.status===404)clearQueuedFor(e.id,e.googleId);
        else queueSync({id:crypto.randomUUID(),kind:"delete",googleId:e.googleId,createdAt:Date.now()});
      }catch{
        queueSync({id:crypto.randomUUID(),kind:"delete",googleId:e.googleId,createdAt:Date.now()});
      }
    }else if(e.googleId){
      queueSync({id:crypto.randomUUID(),kind:"delete",googleId:e.googleId,createdAt:Date.now()});
    }
    setEvents(p=>p.filter(x=>x.id!==e.id&&(!e.googleId||x.googleId!==e.googleId)&&(!e.centralEventId||x.centralEventId!==e.centralEventId)));
    setNotice(e.googleId&&!connected?"Esemény törölve a központi naptárból, a Google-t később frissítem.":"Esemény törölve.");
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

  function exportBackup(){
    const payload={
      format:"havi-naptar-backup",
      version:1,
      exportedAt:new Date().toISOString(),
      events:dedupeEvents(events.filter(e=>!isWorkPlanEvent(e))),
      syncQueue,
      settings:{themeMode,showWorkPlan,lastSync}
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="havi-naptar-backup-"+iso(new Date())+".json";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice("Biztonsági mentés elkészült.");
    setTimeout(()=>setNotice(""),1800);
  }

  function isBackupEvent(x:any):x is Ev{
    return !!x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.title==="string"&&typeof x.date==="string"&&
      /^\d{4}-\d{2}-\d{2}$/.test(x.date)&&["work","personal","family","sport"].includes(x.calendar);
  }
  async function inspectBackupFile(file:File){
    try{
      const raw=JSON.parse(await file.text());
      if(raw?.format!=="havi-naptar-backup"||!Array.isArray(raw.events))throw new Error("format");
      const valid=(raw.events as any[]).filter(isBackupEvent).map((e:Ev)=>({...e,pendingSync:false}));
      const invalid=raw.events.length-valid.length;
      let duplicates=0;
      for(const e of valid){
        if(events.some(x=>x.id===e.id||(e.googleId&&x.googleId===e.googleId)||nearDuplicate(x,e)))duplicates++;
      }
      setBackupPreview({events:valid,total:raw.events.length,duplicates,invalid,name:file.name});
    }catch{
      setBackupPreview(null);
      setNotice("A kiválasztott fájl nem érvényes HAVI NAPTÁR mentés.");
      setTimeout(()=>setNotice(""),2600);
    }
  }
  function mergeBackup(){
    if(!backupPreview)return;
    const before=events.length;
    const merged=dedupeEvents([...events,...backupPreview.events]);
    const added=Math.max(0,merged.length-before);
    setEvents(merged);
    setBackupPreview(null);
    setNotice(added+" esemény visszaállítva helyben. Google-ba nem küldtem automatikusan.");
    setTimeout(()=>setNotice(""),3200);
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
    else if(mode==="3w")d.setDate(d.getDate()+21*n);
    else d.setDate(d.getDate()+28*n);
    setAnchor(d);
  }

  return <main className="appShell" data-theme={resolvedTheme}>
    <aside className="sidebar">
      <div className="brand"><div className="brandIcon">▦</div><span>HAVI <b>NAPTÁR</b></span></div>
      <div className="calList"><h4>Naptárak</h4>{(Object.keys(calMeta) as CalKey[]).map(k=><label key={k}><i style={{background:calMeta[k].color}}/><span>{calMeta[k].label}</span><input type="checkbox" checked={enabled[k]} onChange={e=>setEnabled({...enabled,[k]:e.target.checked})}/></label>)}</div>
      <button className="nav" onClick={()=>setSearchOpen(true)}>⌕ <span>Keresés</span></button>
      <button className="nav" onClick={()=>setSettings(true)}>⚙ <span>Naptár kapcsolat</span></button>
    </aside>

    <MobilePortrait
      anchor={anchor}
      events={enabledEvents}
      connected={connected}
      syncing={syncing}
      pendingCount={syncQueue.length}
      lastSync={lastSync}
      onSync={()=>sync()}
      onDay={d=>{setAnchor(d);setDayOpen(iso(d))}}
      onLongDay={d=>{setAnchor(d);setMonthFlow(true)}}
      onQuickAdd={()=>setQuickAdd(true)}
      onSearch={()=>setSearchOpen(true)}
      onPrint={()=>{setWallPrintMode(mode==="2w"||mode==="3w"||mode==="4w"?mode:"month");setWallPrintOpen(true)}}
      upcomingEvents={upcomingEvents}
      onUpcomingEvent={e=>{setAnchor(parseDate(e.date));setDayOpen(e.date)}}
      suggestions={suggestions}
      onSuggestionDecision={(id,action)=>decideSuggestion(id,action)}
      onToday={()=>setAnchor(new Date())}
      rangeMode={mode==="2w"||mode==="3w"||mode==="4w"?mode:"month"}
      onRangeMode={m=>setMode(m)}
      onPrev={()=>shift(-1)}
      onNext={()=>shift(1)}
      onSettings={()=>setSettings(true)}
    />
    {monthFlow&&<ContinuousMonthFlow
      anchor={anchor}
      events={enabledEvents}
      onClose={()=>setMonthFlow(false)}
      onDay={d=>{setAnchor(d);setDayOpen(iso(d));setMonthFlow(false)}}
      onToday={()=>setAnchor(new Date())}
      onQuickAdd={()=>setQuickAdd(true)}
    />}
    <MobileLandscapeMonth
      anchor={anchor}
      events={enabledEvents}
      onPrev={()=>{const d=new Date(anchor);d.setMonth(d.getMonth()-1);setAnchor(d)}}
      onNext={()=>{const d=new Date(anchor);d.setMonth(d.getMonth()+1);setAnchor(d)}}
      onToday={()=>setAnchor(new Date())}
      onDay={d=>{setAnchor(d);setDayOpen(iso(d))}}
      onQuickAdd={()=>setQuickAdd(true)}
      onPrint={()=>{setWallPrintMode("month");setWallPrintOpen(true)}}
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
          <button className="secondary" onClick={()=>setSearchOpen(true)}>⌕ Keresés</button>
          <button className="secondary" onClick={()=>{setWallPrintMode(mode==="2w"||mode==="3w"||mode==="4w"?mode:"month");setWallPrintOpen(true)}}>⎙ Falinaptár / PDF</button>
          <button className="syncBtn" onClick={()=>sync()} disabled={syncing}>{syncing?"Szinkron…":connected?"↻ Szinkron":"○ Offline"}</button>
          <button className="primary" onClick={()=>setQuickAdd(true)}>＋ Esemény</button>
        </div>
      </header>

      <div className="rangeBar">
        {([["1w","1 hét"],["2w","2 hét"],["3w","3 hét"],["4w","4 hét"],["month","Hónap"],["custom","Egyedi"],["list","Lista"]] as [RangeMode,string][]).map(([k,label])=><button key={k} className={mode===k?"on":""} onClick={()=>setMode(k)}>{label}</button>)}
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

    <button className="fab desktopFab" onClick={()=>setQuickAdd(true)}>＋</button>
    {quickAdd&&<QuickAddWheel
      baseDate={anchor}
      existingEvents={displayEvents}
      onClose={()=>setQuickAdd(false)}
      onCreate={async x=>await save(x)}
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

    {dayOpen&&<MobileDayCards date={dayOpen} events={displayEvents.filter(e=>enabled[e.calendar]&&e.date===dayOpen)} onClose={()=>setDayOpen(null)} onEdit={e=>{if(isWorkPlanEvent(e))setInfoEvent(e);else setEditor(e)}} onDelete={e=>{if(!isWorkPlanEvent(e))remove(e)}} onAdd={()=>setQuickAdd(true)}/>}
    {dayOpen&&<DayZoom date={dayOpen} events={displayEvents.filter(e=>enabled[e.calendar]&&e.date===dayOpen)} onClose={()=>setDayOpen(null)} onEdit={e=>{if(isWorkPlanEvent(e))setInfoEvent(e);else setEditor(e)}} onAdd={()=>setQuickAdd(true)} onMove={(e,m,d)=>{if(!isWorkPlanEvent(e))moveEvent(e,m,d)}} onDelete={e=>{if(!isWorkPlanEvent(e))remove(e)}}/>} 

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

    {wallPrintOpen&&<WallCalendarPrint
      anchor={anchor}
      events={enabledEvents}
      mode={wallPrintMode}
      onMode={setWallPrintMode}
      onClose={()=>setWallPrintOpen(false)}
    />}

    {searchOpen&&<EventSearchOverlay events={enabledEvents} onClose={()=>setSearchOpen(false)} onOpen={e=>{setSearchOpen(false);setAnchor(parseDate(e.date));setDayOpen(e.date)}}/>}

    {editor&&<Modal title={editor.id?"Esemény szerkesztése":"Esemény hozzáadása"} onClose={()=>setEditor(null)}><EventForm value={editor} connected={connected} onSave={save} onCancel={()=>setEditor(null)}/></Modal>}

    {settings&&<Modal title="Beállítások" onClose={()=>setSettings(false)}>
      <div className="settingsBox">
        <div className="settingsQuickActions">
          <button onClick={()=>{setSettings(false);setWallPrintMode(mode==="2w"||mode==="3w"||mode==="4w"?mode:"month");setWallPrintOpen(true)}}>⎙ Naptár / PDF előnézet</button>
        </div>
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
          <div className="settingsTitle"><b>Iskolai munkaterv</b><span>A 2026/2027-es Teleki munkaterv 31 dátuma központi naptári eseményként, alapból bekapcsolva.</span></div>
          <button className={"layerToggle "+(showWorkPlan?"on":"")} onClick={()=>setShowWorkPlan(v=>!v)}><i/><span>{showWorkPlan?"Látható":"Elrejtve"}</span></button>
        </div>
        <CoreGoogleSyncSettings/>
        <GmailRealtimeSettings/>
        <WatchedSourcesSettings/>
        <div className="syncDiagnostics">
          <div className="settingsTitle"><b>Szinkron állapot</b><span>Gyors ellenőrzés a háttérszinkronról és a helyi cache-ről.</span></div>
          <div className="syncDiagGrid">
            <span><b>{connected?"ONLINE":"OFFLINE"}</b><small>Google</small></span>
            <span><b>{events.filter(e=>!!e.googleId).length}</b><small>Google cache</small></span>
            <span><b>{events.filter(e=>!e.googleId&&!isWorkPlanEvent(e)).length}</b><small>Saját</small></span>
            <span className={syncQueue.length?"warn":""}><b>{syncQueue.length}</b><small>Függő művelet</small></span>
          </div>
          <div className="syncDiagFoot">
            <span>{lastSync?"Utolsó sikeres sync: "+new Date(lastSync).toLocaleString("hu-HU"):"Még nem volt sikeres Google-szinkron."}</span>
            <button disabled={syncing} onClick={()=>sync()}>{syncing?"Szinkron…":"Szinkron most"}</button>
          </div>
        </div>
        {syncQueue.length>0&&<div className="pendingSyncSetting">
          <div><b>{syncQueue.length} módosítás vár szinkronra</b><span>Offline vagy sikertelen Google-műveletek. Kapcsolat esetén automatikusan újrapróbáljuk.</span></div>
          <button disabled={!connected} onClick={()=>flushSyncQueue()}>{connected?"Újrapróbálás":"Offline"}</button>
        </div>}
        <div className={"status "+(connected?"ok":"")}><i/><div><b>{connected?"Google Naptár kapcsolódva":"Google Naptár nincs kapcsolva"}</b><span>{connected?"Az iPhone-on használt Google Naptár eseményei megjelennek itt.":"Kapcsold össze egyszer a kétirányú szinkronhoz."}{lastSync?<><br/>Utolsó sikeres szinkron: {new Date(lastSync).toLocaleString("hu-HU")}</>:""}</span></div></div>
        <div className="backupSetting">
          <div className="settingsTitle"><b>Helyi biztonsági mentés</b><span>Export vagy kézi visszaállítás. Importnál semmit nem küldünk automatikusan Google-ba.</span></div>
          <div className="backupActions">
            <button onClick={exportBackup}>↓ Export</button>
            <label className="backupImportBtn">↑ Visszaállítás<input type="file" accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f)inspectBackupFile(f);e.currentTarget.value=""}}/></label>
          </div>
        </div>
        {backupPreview&&<div className="backupPreview">
          <div className="backupPreviewHead"><div><small>MENTÉS ELŐNÉZET</small><b>{backupPreview.name}</b></div><button onClick={()=>setBackupPreview(null)}>×</button></div>
          <div className="backupPreviewStats">
            <span><b>{backupPreview.events.length}</b><small>Érvényes</small></span>
            <span><b>{backupPreview.duplicates}</b><small>Már megvan</small></span>
            <span className={backupPreview.invalid?"warn":""}><b>{backupPreview.invalid}</b><small>Hibás sor</small></span>
          </div>
          <p>A visszaállítás csak a helyi naptáradatokkal egyesít. Meglévő eseményt nem ír felül és régi sync queue-t nem indít újra.</p>
          <div className="backupPreviewActions"><button onClick={()=>setBackupPreview(null)}>Mégse</button><button className="primary" disabled={!backupPreview.events.length} onClick={mergeBackup}>Egyesítés</button></div>
        </div>}
        <button className="primary wide" onClick={()=>location.href="/api/google/connect"}>{connected?"Újracsatlakozás":"Google Naptár csatlakoztatása"}</button>
      </div>
    </Modal>}
  </main>
}


function UpcomingCarousel({events,onOpen}:{events:Ev[];onOpen:(e:Ev)=>void}){
  const [index,setIndex]=useState(0);
  const [dir,setDir]=useState<"next"|"prev">("next");
  useEffect(()=>{if(index>=events.length)setIndex(0)},[events.length,index]);
  useEffect(()=>{
    if(events.length<=1)return;
    const t=window.setInterval(()=>{setDir("next");setIndex(i=>(i+1)%events.length)},4800);
    return ()=>window.clearInterval(t);
  },[events.length]);
  if(!events.length)return <div className="upcomingEmptyStrip"><span>KÖVETKEZŐ 7 NAP</span><b>Nincs közelgő esemény</b></div>;
  const e=events[index]||events[0];
  const when=parseDate(e.date).toLocaleDateString("hu-HU",{month:"short",day:"numeric",weekday:"short"});
  return <div className="upcomingCarousel">
    <button className="upcomingArrow" aria-label="Előző esemény" onClick={()=>{setDir("prev");setIndex(i=>(i-1+events.length)%events.length)}}>‹</button>
    <button key={e.id+"-"+index} className={"upcomingSlide "+(dir==="next"?"slideNext":"slidePrev")} onClick={()=>onOpen(e)}>
      <span className="nextEventLabel">KÖVETKEZŐ 7 NAP · {index+1}/{events.length}</span>
      <b>{e.title}</b>
      <small>{when}{e.allDay?" · egész nap":e.start?" · "+e.start:""}{e.location?" · "+e.location:""}</small>
      <em>›</em>
    </button>
    <button className="upcomingArrow" aria-label="Következő esemény" onClick={()=>{setDir("next");setIndex(i=>(i+1)%events.length)}}>›</button>
  </div>
}

function SuggestionDecisionCard({items,onDecision}:{items:Suggestion[];onDecision:(id:string,action:"accept"|"reject")=>void}){
  if(!items.length)return null;
  const x=items[0];
  const source=String(x.payload?.platform||x.source_app||"Forrás");
  const sender=String(x.payload?.sender||"");
  const when=x.all_day
    ?(x.event_date?parseDate(String(x.event_date).slice(0,10)).toLocaleDateString("hu-HU",{month:"short",day:"numeric",weekday:"short"}):"")
    :(x.starts_at?new Date(x.starts_at).toLocaleString("hu-HU",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"");
  return <div className="suggestionDecision">
    <div className="suggestionCopy">
      <span>{x.confidence==="probable"?"VALÓSZÍNŰ ESEMÉNY":"ELLENŐRIZENDŐ"}{items.length>1?" · +"+(items.length-1):""}</span>
      <b>{x.title}</b>
      <small>{when}{source?" · "+source:""}{sender?" · "+sender:""}</small>
      {x.summary&&<p>{x.summary}</p>}
    </div>
    <div className="suggestionQuestion">Naptárba kerüljön?</div>
    <div className="suggestionActions">
      <button className="suggestionNo" onClick={()=>onDecision(x.id,"reject")}>Nem</button>
      <button className="suggestionYes" onClick={()=>onDecision(x.id,"accept")}>Igen</button>
    </div>
  </div>
}

function MobilePortrait({anchor,events,connected,syncing,pendingCount,lastSync,onSync,onDay,onLongDay,onQuickAdd,onSearch,onPrint,upcomingEvents,onUpcomingEvent,suggestions,onSuggestionDecision,onToday,rangeMode,onRangeMode,onPrev,onNext,onSettings}:{anchor:Date;events:Ev[];connected:boolean;syncing:boolean;pendingCount:number;lastSync:number|null;onSync:()=>void;onDay:(d:Date)=>void;onLongDay:(d:Date)=>void;onQuickAdd:()=>void;onSearch:()=>void;onPrint:()=>void;upcomingEvents:Ev[];onUpcomingEvent:(e:Ev)=>void;suggestions:Suggestion[];onSuggestionDecision:(id:string,action:"accept"|"reject")=>void;onToday:()=>void;rangeMode:"2w"|"3w"|"4w"|"month";onRangeMode:(m:"2w"|"3w"|"4w"|"month")=>void;onPrev:()=>void;onNext:()=>void;onSettings:()=>void}){
  const swipeX=useRef<number|null>(null);
  const swipeY=useRef<number|null>(null);
  const swipeMoved=useRef(false);
  const monthFirst=new Date(anchor.getFullYear(),anchor.getMonth(),1,12);
  const monthStart=monday(monthFirst);
  const monthLast=new Date(anchor.getFullYear(),anchor.getMonth()+1,0,12);
  const monthWeeks=Math.max(5,Math.ceil((Math.round((monthLast.getTime()-monthStart.getTime())/86400000)+1)/7));
  const first=rangeMode==="month"?monthStart:monday(anchor);
  const dayCount=rangeMode==="month"?Math.min(42,monthWeeks*7):rangeMode==="2w"?14:rangeMode==="3w"?21:28;
  const days=Array.from({length:dayCount},(_,i)=>addDays(first,i));
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
    onPointerUp={e=>{if(swipeX.current===null||swipeY.current===null)return;const dx=e.clientX-swipeX.current,dy=e.clientY-swipeY.current;swipeX.current=null;swipeY.current=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.25)dx<0?onNext():onPrev();setTimeout(()=>{swipeMoved.current=false},80)}}> 
    <header className="mockHero">
      <div className="monthNavCapsule"><button onClick={onPrev}>‹</button><span>{anchor.getFullYear()}.</span><button onClick={onNext}>›</button></div>
      <div className="mockActions">
        <button className={"syncDot "+(connected?"online":"")} aria-label="Google Naptár szinkron" title={connected?"Google Naptár kapcsolódva":"Google Naptár offline"} onClick={onSync}>{syncing?"↻":connected?"●":"○"}</button>
        <button aria-label="Esemény keresése" onClick={onSearch}>⌕</button>
        <button aria-label="PDF előnézet" title="Naptár / PDF" onClick={onPrint}>⎙</button>
        <button onClick={onSettings}>⚙</button>
      </div>
    </header>

    <button className="mockMonthTitle" onClick={()=>onLongDay(anchor)}>{anchor.toLocaleDateString("hu-HU",{month:"long"})}<span>↕ tanév</span></button>
    <div className="mobileLegend">
      <span><i className="legendOwn"/>Saját</span>
      <span><i className="legendPlan"/>Munkaterv</span>
      <span><i className="legendHoliday"/>Ünnep</span>
      <span className={pendingCount?"syncState pending":connected?"syncState ok":"syncState"} title={lastSync?"Utolsó szinkron: "+new Date(lastSync).toLocaleString("hu-HU"):""}>{pendingCount?pendingCount+" vár szinkronra":connected?"Google ✓":lastSync?"Offline · cache":"Offline"}</span>
    </div>

    <div className="mobileRangeSwitch" role="group" aria-label="Naptárnézet">
      {([["2w","2 hét"],["3w","3 hét"],["4w","4 hét"],["month","Hónap"]] as const).map(([k,label])=><button key={k} className={rangeMode===k?"on":""} onClick={()=>onRangeMode(k)}>{label}</button>)}
    </div>

    <UpcomingCarousel events={upcomingEvents} onOpen={onUpcomingEvent}/>
    <SuggestionDecisionCard items={suggestions} onDecision={onSuggestionDecision}/>

    <div className="mockWeekdays">{["H","K","Sze","Cs","P","Sz","V"].map(x=><span key={x}>{x}</span>)}</div>

    <div className={"mockMonthGrid rows-"+Math.ceil(days.length/7)}>
      {days.map(d=>{
        const current=rangeMode==="month"?d.getMonth()===anchor.getMonth():true;
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

    <div className="portraitHint">Koppintás: napi események · Hosszan nyomva: tanévi folyam</div>
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
            <div className="mobileEventText"><b>{e.title}</b><span>{calMeta[e.calendar].label}{e.location?" · "+e.location:""}</span>{e.linkedApp&&<small className="linkedAppBadge">↗ {e.linkedApp}</small>}{e.note==="Iskolai munkaterv 2026/2027"&&<small className="sourceBadge">MUNKATERV · CSAK OLVASHATÓ</small>}{e.pendingSync&&<small className="pendingBadge">SZINKRONRA VÁR</small>}</div>
          </button>
          {e.linkedUrl&&<a className="mobileLinkedOpen" href={e.linkedUrl} target="_self">Megnyitás ›</a>}
          {!isWorkPlanEvent(e)&&<button className={"mobileEventDelete "+(deleteId===e.id?"armed":"")} aria-label="Esemény törlése" onClick={()=>{if(deleteId===e.id){onDelete(e);setDeleteId(null)}else{setDeleteId(e.id);setTimeout(()=>setDeleteId(id=>id===e.id?null:id),2200)}}}>{deleteId===e.id?"Törlés":"×"}</button>}
        </div>):<div className="mobileNoEvents"><i>✦</i><b>Szabad nap</b><span>Nincs bejegyzett esemény.</span></div>}
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

function MobileLandscapeMonth({anchor,events,onPrev,onNext,onToday,onDay,onQuickAdd,onPrint,onSettings}:{anchor:Date;events:Ev[];onPrev:()=>void;onNext:()=>void;onToday:()=>void;onDay:(d:Date)=>void;onQuickAdd:()=>void;onPrint:()=>void;onSettings:()=>void}){
  const first=monday(new Date(anchor.getFullYear(),anchor.getMonth(),1,12));
  const days=Array.from({length:42},(_,i)=>addDays(first,i));
  return <section className="mobileLandscapeMonth">
    <header className="landscapeHead">
      <div className="landscapeNav"><button onClick={onPrev}>‹</button><button onClick={onNext}>›</button><button onClick={onToday}>Ma</button></div>
      <div><small>{anchor.getFullYear()}</small><h1>{anchor.toLocaleDateString("hu-HU",{month:"long"})}</h1></div>
      <div className="landscapeActions"><button aria-label="Falinaptár előnézet" title="Falinaptár / PDF" onClick={onPrint}>⎙</button><button onClick={onSettings}>⚙</button><button className="landscapeAdd" onClick={onQuickAdd}>＋</button></div>
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
      const bareDay=low.match(/\b(\d{1,2})[-.]?(?:an|en|án|én)\b/);
      if(bareDay){
        const da=Number(bareDay[1]);
        if(da>=1&&da<=31){
          let y=d.getFullYear(),mo=d.getMonth();
          const candidate=new Date(y,mo,da,12);
          if(candidate.getTime()<addDays(baseDate,-7).getTime()){
            const next=new Date(y,mo+1,da,12); y=next.getFullYear();mo=next.getMonth();
          }
          d=new Date(y,mo,da,12);matched=true;explicitDate=true;
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
  let explicitEndMins:number|undefined;
  const range=low.match(/\b([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\s*(?:-?\s*(?:tol|tól|től)|-|–|—)\s*([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\s*(?:-?\s*ig)?\b/);
  if(range){
    const sh=Number(range[1]),sm=Number(range[2]||0),eh=Number(range[3]),em=Number(range[4]||0);
    startMins=sh*60+sm; explicitEndMins=eh*60+em;
    if(explicitEndMins<=startMins)explicitEndMins+=24*60;
  }
  if(startMins===undefined&&(/\bdelben\b|\bdélben\b/.test(low)))startMins=12*60;
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

  let duration=explicitEndMins!==undefined&&startMins!==undefined?Math.max(15,explicitEndMins-startMins):60;
  const durM=low.match(/\b(\d{1,3})\s*(perc|p)\b/);
  const hourDurM=low.match(/\b(?:(\d+[.,]\d+)\s*(?:ora|óra)|(\d+)\s*(?:ora|óra)\s*(?:hosszu|hosszú|idotartam|időtartam))\b/);
  if(explicitEndMins===undefined&&durM)duration=Math.max(15,Math.min(12*60,Number(durM[1])));
  else if(explicitEndMins===undefined&&hourDurM){const hv=hourDurM[1]||hourDurM[2];duration=Math.max(15,Math.min(12*60,Math.round(Number(hv.replace(",","."))*60)))}
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
    .replace(/\b\d{1,2}[-.]?(?:an|en|án|én)\b/gi," ")
    .replace(/\b(jovo|jövő)\b/gi," ")
    .replace(/\b(vasarnap(?:on)?|vasárnap(?:on)?|hetfo(?:n)?|hétfő(?:n)?|kedd(?:en)?|szerda(?:n|án)?|csutortok(?:on)?|csütörtök(?:ön)?|pentek(?:en)?|péntek(?:en)?|szombat(?:on)?)\b/gi," ")
    .replace(/\b([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\s*(?:-?\s*(?:tol|tól|től)|-|–|—)\s*([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\s*(?:-?\s*ig)?\b/gi," ")
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
    end:startMins===undefined?undefined:hhmm(explicitEndMins!==undefined?explicitEndMins:startMins+duration)
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
  const pieces=text.split(/\n+|\s*[;•·]\s*|(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean).slice(0,16);
  const out:SmartParse[]=[];
  for(const piece of pieces){
    let p=parseSmartEvent(piece,baseDate);
    const deadlineLike=/\b(hatarido|határidő|leadás|leadas|jelentkezési|jelentkezesi|esedékes|esedekes)\b/i.test(piece);
    if(p.explicitDate&&!p.explicitTime&&!p.allDay&&deadlineLike){
      p={...p,allDay:true,missing:p.missing.filter(x=>x!=="idő"),confidence:"high"};
    }
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
    let p=parseSmartEvent(text,baseDate);
    const deadlineLike=/\b(hatarido|határidő|leadás|leadas|jelentkezési|jelentkezesi|esedékes|esedekes)\b/i.test(text);
    if(p.explicitDate&&!p.explicitTime&&!p.allDay&&deadlineLike)p={...p,allDay:true,missing:p.missing.filter(x=>x!=="idő"),confidence:"high"};
    if(p.explicitDate&&(p.explicitTime||p.allDay))out.push({...p,title:cleanExtractedTitle(p.title)||"Esemény",location:p.location||inferProseLocation(text)});
  }
  return out.slice(0,5);
}

function QuickAddWheel({baseDate,existingEvents,onClose,onCreate,onDetails}:{baseDate:Date;existingEvents:Ev[];onClose:()=>void;onCreate:(x:Partial<Ev>)=>Promise<boolean>;onDetails?:(x:Partial<Ev>)=>void}){
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
  const [savedCandidates,setSavedCandidates]=useState<Record<number,boolean>>({});
  const [clipboardError,setClipboardError]=useState("");
  const parsed=useMemo(()=>parseSmartEvent(smartText,baseDate),[smartText,baseDate]);
  const extracted=useMemo(()=>extractEventCandidates(smartText,baseDate),[smartText,baseDate]);
  const asCandidate=(x:Partial<Ev>):Ev=>({id:"candidate",title:x.title||"",date:x.date||iso(baseDate),start:x.start,end:x.end,allDay:!!x.allDay,calendar:(x.calendar||"personal") as CalKey,location:x.location||""});
  const duplicateFor=(x:Partial<Ev>)=>{const candidate=asCandidate(x);return existingEvents.find(e=>nearDuplicate(e,candidate))};
  const conflictFor=(x:Partial<Ev>)=>{const candidate=asCandidate(x);return existingEvents.find(e=>!nearDuplicate(e,candidate)&&timeOverlap(e,candidate))};
  const pastedMode=!manual&&(smartText.includes("\n")||smartText.trim().length>=70);
  const maxDay=new Date(year,month+1,0).getDate();
  const safeDay=Math.min(day,maxDay);
  const date=iso(new Date(year,month,safeDay,12));
  const monthItems=Array.from({length:14},(_,i)=>{const d=new Date(baseDate.getFullYear(),baseDate.getMonth()-2+i,1,12);return {value:d.getFullYear()*12+d.getMonth(),label:d.toLocaleDateString("hu-HU",{month:"short"})+" "+String(d.getFullYear()).slice(2)}});
  const monthValue=year*12+month;
  const chooseMonth=(v:number)=>{const y=Math.floor(v/12),m=v%12;setYear(y);setMonth(m);setDay(d=>Math.min(d,new Date(y,m+1,0).getDate()))};
  const smartCalendar=calendarTouched?calendar:parsed.calendar;
  const selectedDayTitleOnly=!manual&&!!parsed.title&&!parsed.explicitDate&&!parsed.explicitTime&&!parsed.allDay&&parsed.missing.every(x=>x==="idő");
  const effectiveParsed=selectedDayTitleOnly?{...parsed,date:iso(baseDate),allDay:true,start:undefined,end:undefined,missing:[],confidence:"high" as const}:parsed;
  const smartPayload:Partial<Ev>={title:effectiveParsed.title,date:effectiveParsed.date,allDay:effectiveParsed.allDay,start:effectiveParsed.start,end:effectiveParsed.end,calendar:smartCalendar,location:effectiveParsed.location};
  const manualPayload:Partial<Ev>={title,date,allDay,start:allDay?undefined:hhmm(time),end:allDay?undefined:hhmm(time+60),calendar};
  const payload=manual?manualPayload:smartPayload;
  const smartDuplicate=duplicateFor(smartPayload);
  const smartConflict=conflictFor(smartPayload);
  const canSmartSave=!manual&&!!effectiveParsed.title&&effectiveParsed.missing.length===0&&!smartDuplicate;

  async function pasteClipboard(){
    try{
      const text=await navigator.clipboard.readText();
      if(!text.trim()){setClipboardError("A vágólap üres.");return}
      setSmartText(text);setSavedCandidates({});setClipboardError("");
    }catch{
      setClipboardError("A vágólap olvasása nem engedélyezett. Hosszan nyomva továbbra is beilleszthetsz.");
    }
  }
  async function saveSingle(x:Partial<Ev>){
    const ok=await onCreate(x);
    if(ok)onClose();
  }
  async function saveExtracted(c:SmartParse,index:number){
    const ok=await onCreate({title:c.title,date:c.date,allDay:c.allDay,start:c.start,end:c.end,calendar:c.calendar,location:c.location});
    if(ok){
      setSavedCandidates(prev=>({...prev,[index]:true}));
      if(extracted.length===1)setTimeout(onClose,180);
    }
  }

  return <div className="quickBackdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <section className="quickSheet smartQuickSheet">
      <div className="quickGrabber"/>
      <header><div><small>ÚJ ESEMÉNY</small><h2>{pastedMode?"Szövegből kinyerés":"Gyors bevitel"}</h2></div><button onClick={onClose}>×</button></header>

      {!manual&&<>
        <div className="activeDateHint"><span>Aktív nap</span><b>{baseDate.toLocaleDateString("hu-HU",{month:"short",day:"numeric",weekday:"short"})}</b><em>Ha nem írsz dátumot, erre a napra kerül.</em></div>
        <div className="pasteRow"><button type="button" onClick={pasteClipboard}>⌘ Beillesztés vágólapról</button><span>Emailből vagy üzenetből</span></div>
        {clipboardError&&<div className="clipboardError">{clipboardError}</div>}
        <textarea className={"smartInput "+(pastedMode?"pasteInput":"")} autoFocus rows={pastedMode?5:2}
          placeholder={"Írj röviden vagy másolj be szöveget…\npl. okt 15 fodrász 16.10"}
          value={smartText}
          onChange={e=>{setSmartText(e.target.value);setSavedCandidates({})}}
          onPaste={()=>setSavedCandidates({})}
          onKeyDown={e=>{if(!pastedMode&&(e.metaKey||e.ctrlKey)&&e.key==="Enter"&&canSmartSave)saveSingle(smartPayload)}}/>

        {!pastedMode&&<div className={"smartPreview "+effectiveParsed.confidence}>
          <div className="smartPreviewHead"><span>{selectedDayTitleOnly?"Aktív napra kész ✓":effectiveParsed.confidence==="high"?"Értettem ✓":effectiveParsed.confidence==="medium"?"Majdnem kész":"Írd le az eseményt"}</span><small>{effectiveParsed.date}</small></div>
          {effectiveParsed.title?<b>{effectiveParsed.title}</b>:<b>Mi legyen az esemény?</b>}
          <p>{effectiveParsed.allDay?"Egész nap":effectiveParsed.start+" – "+effectiveParsed.end}{effectiveParsed.duration!==60&&!effectiveParsed.allDay?" · "+effectiveParsed.duration+" perc":""}{effectiveParsed.location?" · @"+effectiveParsed.location:""}</p>
          {effectiveParsed.missing.length>0&&<em>Hiányzik: {effectiveParsed.missing.join(", ")}</em>}
          {smartDuplicate&&<em className="duplicateWarning">Már szerepel: {smartDuplicate.title} · {smartDuplicate.date}{smartDuplicate.start?" · "+smartDuplicate.start:""}</em>}
          {!smartDuplicate&&smartConflict&&<em className="conflictWarning">Időütközés: {smartConflict.title} · {smartConflict.start}–{smartConflict.end}</em>}
        </div>}

        {pastedMode&&<div className="extractArea">
          <div className="extractHead">
            <div><small>KINYERÉS</small><b>{extracted.length?extracted.length+" egyértelmű eseményt találtam":"Még nincs biztos találat"}</b></div>
            <span>Semmi nem kerül be automatikusan. A bemásolt nyers szöveget nem tároljuk.</span>
          </div>
          {extracted.length?extracted.map((c,i)=>{const candidate={title:c.title,date:c.date,allDay:c.allDay,start:c.start,end:c.end,calendar:c.calendar,location:c.location};const dup=duplicateFor(candidate),conflict=dup?undefined:conflictFor(candidate);return <article key={i} className={"extractCard "+(savedCandidates[i]?"saved ":"")+(dup?"duplicate ":"")+(conflict?"conflict":"")}>
            <div className="extractDate"><b>{parseDate(c.date).getDate()}</b><span>{parseDate(c.date).toLocaleDateString("hu-HU",{month:"short"})}</span></div>
            <div className="extractBody">
              <strong>{c.title}</strong>
              <span>{c.allDay?"Egész nap":(c.start||"")+" – "+(c.end||"")}{c.location?" · "+c.location:""}</span>
              <small>{dup?"Már szerepel a naptárban":conflict?"Ütközik: "+conflict.title+" "+(conflict.start||"")+"–"+(conflict.end||""):calMeta[c.calendar].label}</small>
            </div>
            <div className="extractActions">
              {onDetails&&<button disabled={!!savedCandidates[i]||!!dup} onClick={()=>onDetails({title:c.title,date:c.date,allDay:c.allDay,start:c.start,end:c.end,calendar:c.calendar,location:c.location})}>Szerkesztés</button>}
              <button className="extractSave" disabled={!!savedCandidates[i]||!!dup} onClick={()=>saveExtracted(c,i)}>{dup?"Már szerepel":savedCandidates[i]?"Rögzítve ✓":"Rögzítés"}</button>
            </div>
          </article>}) :<div className="extractEmpty">
            <b>Nem találtam még egyértelmű dátum + idő párost.</b>
            <span>A szöveget nem mentem el és nem teszek semmit automatikusan. Egészítsd ki, vagy használd a Részletek nézetet.</span>
          </div>}
        </div>}

        {!pastedMode&&<div className="smartExamples"><b>Egyszerűen:</b> <span>fodrász</span> = aktív nap, egész nap · <span>fodrász 16.10</span> = aktív nap, időponttal · <span>okt 15 fodrász 16.10</span> = megadott nap</div>}
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

      {!pastedMode&&<div className="quickCategories">{(Object.keys(calMeta) as CalKey[]).map(k=><button key={k} className={(manual?calendar:(calendarTouched?calendar:parsed.calendar))===k?"active":""} style={{"--event":calMeta[k].color} as React.CSSProperties} onClick={()=>{setCalendar(k);setCalendarTouched(true)}}><span>{calMeta[k].icon}</span>{calMeta[k].label}</button>)}</div>}

      <button className="manualToggle" onClick={()=>setManual(v=>!v)}>{manual?"← Intelligens bevitel":"Dátum/idő kézi beállítása"}</button>

      {!pastedMode&&<div className="quickFooter">
        {onDetails&&<button className="quickDetails" disabled={!manual&&!parsed.title} onClick={()=>onDetails(payload)}>Részletek</button>}
        <button className="quickSave" disabled={manual?!title.trim():!canSmartSave} onClick={()=>saveSingle(payload)}>Rögzítés <span>→</span></button>
      </div>}
      {pastedMode&&extracted.length>1&&<button className="extractDone" onClick={onClose}>Kész</button>}
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

function WallCalendarPrint({anchor,events,mode,onMode,onClose}:{anchor:Date;events:Ev[];mode:"2w"|"3w"|"4w"|"month";onMode:(m:"2w"|"3w"|"4w"|"month")=>void;onClose:()=>void}){
  const monthFirst=new Date(anchor.getFullYear(),anchor.getMonth(),1,12);
  const monthStart=monday(monthFirst);
  const monthLast=new Date(anchor.getFullYear(),anchor.getMonth()+1,0,12);
  const monthWeeks=Math.max(5,Math.ceil((Math.round((monthLast.getTime()-monthStart.getTime())/86400000)+1)/7));
  const rangeStart=mode==="month"?monthStart:monday(anchor);
  const rangeWeeks=mode==="month"?Math.min(6,monthWeeks):mode==="2w"?2:mode==="3w"?3:4;
  const cells=Array.from({length:rangeWeeks*7},(_,i)=>addDays(rangeStart,i));
  const rangeEnd=cells[cells.length-1];
  const title=mode==="month"?monthLabel(anchor):fmtRange(rangeStart,rangeEnd);
  const subtitle=mode==="month"?"Havi naptár":mode==="2w"?"2 hetes naptár":mode==="3w"?"3 hetes naptár":"4 hetes naptár";
  const weekdayHeaders=["Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat","Vasárnap"];
  const visibleEvents=events.filter(e=>e.date>=iso(rangeStart)&&e.date<=iso(rangeEnd)).sort((a,b)=>(a.date+(a.allDay?"00:00":a.start||"")).localeCompare(b.date+(b.allDay?"00:00":b.start||"")));

  async function sharePreview(){
    const data={title:"Naptár – "+title,text:"Naptár előnézet: "+title};
    try{
      if(navigator.share)await navigator.share(data);
      else window.print();
    }catch{}
  }

  return <div className="wallPrintOverlay">
    <div className="wallPrintToolbar">
      <div>
        <small>PDF ELŐNÉZET</small>
        <b>A4 fekvő · {subtitle}</b>
      </div>
      <div className="wallPrintMode">
        {([["2w","2 hét"],["3w","3 hét"],["4w","4 hét"],["month","Hónap"]] as const).map(([k,label])=><button key={k} className={mode===k?"on":""} onClick={()=>onMode(k)}>{label}</button>)}
      </div>
      <div className="wallPrintActions">
        <button onClick={onClose}>Bezárás</button>
        <button onClick={sharePreview}>↗ Küldés</button>
        <button className="printPrimary" onClick={()=>window.print()}>⎙ Mentés / PDF / Nyomtatás</button>
      </div>
    </div>

    <section className={"wallPaper rows-"+rangeWeeks}>
      <header className="wallPaperHead">
        <div><small>{subtitle}</small><h1>{title}</h1></div>
        <span>HAVI NAPTÁR</span>
      </header>
      <div className="wallWeekdays">{weekdayHeaders.map(x=><div key={x}>{x}</div>)}</div>
      <div className="wallGrid" style={{"--wall-rows":rangeWeeks} as React.CSSProperties}>
        {cells.map(d=>{
          const dayIso=iso(d);
          const isOutside=mode==="month"&&d.getMonth()!==anchor.getMonth();
          const es=events.filter(e=>e.date===dayIso).sort((a,b)=>(a.allDay?"00:00":a.start||"").localeCompare(b.allDay?"00:00":b.start||""));
          const holiday=holidayMap[dayIso];
          return <div className={"wallCell "+(isOutside?"outside ":"")+(holiday?"holiday ":"")} key={dayIso}>
            <div className="wallDayHead"><b>{d.getDate()}</b><span>{d.toLocaleDateString("hu-HU",{weekday:"short"})}</span></div>
            {holiday&&<div className="wallHoliday">✦ {holiday}</div>}
            <div className="wallEvents">
              {es.slice(0,5).map(e=>{
                const source=isWorkPlanEvent(e)?"plan":e.centralEventId?"core":e.googleId?"google":"local";
                return <div className={"wallEvent "+source} key={e.id+"-"+(e.start||"")}>
                  <i style={{background:calMeta[e.calendar].color}}/>
                  <span><b>{e.allDay?"":(e.start||"")+" "}</b>{e.title}</span>
                </div>
              })}
              {es.length>5&&<div className="wallMore">+{es.length-5} további</div>}
            </div>
          </div>
        })}
      </div>
      <footer className="wallLegend">
        <span><i className="dot local"/>Saját</span>
        <span><i className="dot core"/>Calendar Core</span>
        <span><i className="dot google"/>Google</span>
        <span><i className="dot plan"/>Iskolai munkaterv</span>
        <span className="wallGenerated">{visibleEvents.length} esemény · {new Date().toLocaleDateString("hu-HU")}</span>
      </footer>
    </section>
  </div>
}
function EventSearchOverlay({events,onClose,onOpen}:{events:Ev[];onClose:()=>void;onOpen:(e:Ev)=>void}){
  const [q,setQ]=useState("");
  const query=normText(q);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};
    window.addEventListener("keydown",key);
    return ()=>window.removeEventListener("keydown",key);
  },[onClose]);
  const results=useMemo(()=>{
    const base=[...events].sort((a,b)=>(a.date+(a.start||"")).localeCompare(b.date+(b.start||"")));
    if(!query)return base.filter(e=>e.date>=iso(new Date())).slice(0,12);
    return base.filter(e=>{
      const source=isWorkPlanEvent(e)?"munkaterv":e.googleId?"google":e.pendingSync?"szinkronra vár saját":"saját";
      const readableDate=parseDate(e.date).toLocaleDateString("hu-HU",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
      const hay=normText([e.title,e.location,e.note,calMeta[e.calendar].label,e.date,readableDate,source].filter(Boolean).join(" "));
      return query.split(" ").every(part=>hay.includes(part));
    }).slice(0,40);
  },[events,query]);
  return <div className="searchOverlay" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <section className="searchPanel">
      <header>
        <div><small>KERESÉS</small><h2>Események</h2></div>
        <button onClick={onClose}>×</button>
      </header>
      <div className="searchBox">
        <span>⌕</span>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Cím, helyszín, megjegyzés…"/>
        {q&&<button onClick={()=>setQ("")}>×</button>}
      </div>
      <div className="searchMeta">{q?results.length+" találat":"Következő események"}</div>
      <div className="searchResults">
        {results.length?results.map(e=>{
          const workplan=isWorkPlanEvent(e);
          return <button key={e.id+"-"+e.date+"-"+(e.start||"")} className="searchResult" onClick={()=>onOpen(e)}>
            <div className="searchDate">
              <b>{parseDate(e.date).getDate()}</b>
              <span>{parseDate(e.date).toLocaleDateString("hu-HU",{month:"short"})}</span>
            </div>
            <div className="searchResultBody">
              <strong>{e.title}</strong>
              <span>{e.allDay?"Egész nap":(e.start||"")+" – "+(e.end||"")}{e.location?" · "+e.location:""}</span>
              <small>
                {workplan?"Munkaterv":e.googleId?"Google":e.pendingSync?"Szinkronra vár":"Saját"} · {calMeta[e.calendar].label}
              </small>
            </div>
            <em>›</em>
          </button>
        }):<div className="searchEmpty"><b>Nincs találat</b><span>Próbálj rövidebb kifejezést, helyszínt vagy dátumot.</span></div>}
      </div>
    </section>
  </div>
}

function GmailRealtimeSettings(){
  type GmailCon={account_email:string;status:string;last_error?:string|null;last_event_at?:string|null;watch_expiration?:string|null;updated_at?:string|null;calendar_write?:boolean;health?:"ok"|"error";health_error?:string|null};
  const [items,setItems]=useState<GmailCon[]>([]);
  const [busy,setBusy]=useState("");
  const [loaded,setLoaded]=useState(false);
  async function load(){
    try{
      const r=await fetch("/api/gmail/realtime",{cache:"no-store"});
      const j=await r.json();
      if(r.ok&&j.ok)setItems(Array.isArray(j.connections)?j.connections:[]);
    }catch{}
    finally{setLoaded(true)}
  }
  useEffect(()=>{load()},[]);
  async function reconnect(email:string){
    setBusy(email);
    try{
      const r=await fetch("/api/gmail/realtime",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({account_email:email})});
      const j=await r.json();
      if(r.ok&&j.url)location.href=j.url;
    }finally{setBusy("")}
  }
  return <div className="gmailRealtimeSetting">
    <div className="settingsTitle"><b>Gmail valós idejű figyelés</b><span>A figyelt levelekből felismert biztos események automatikusan, a bizonytalanok jóváhagyással kerülnek a naptárba.</span></div>
    {!loaded?<div className="gmailLoading">Kapcsolatok ellenőrzése…</div>:items.length?<div className="gmailAccounts">
      {items.map(x=>{
        const stale=x.health==="error"||!!x.last_error||x.status==="error";
        return <div className={"gmailAccount "+(stale?"warn":"")} key={x.account_email}>
          <div><b>{x.account_email}</b><span>{stale?"Google hozzáférés frissítése szükséges":x.status==="watching"?"Figyelés aktív":x.status}</span><small>{stale?(x.health_error==="token_refresh_failed"?"A háttér-hozzáférés lejárt vagy vissza lett vonva.":(x.health_error||x.last_error||"Kapcsolathiba")):(x.last_event_at?"Utolsó feldolgozott esemény: "+new Date(x.last_event_at).toLocaleString("hu-HU"):"Még nincs feldolgozott esemény.")}</small></div>
          <button disabled={busy===x.account_email} onClick={()=>reconnect(x.account_email)}>{busy===x.account_email?"Nyitás…":"Újracsatlakozás"}</button>
        </div>
      })}
    </div>:<div className="gmailLoading">Nincs bekötött Gmail-fiók.</div>}
    <small className="gmailHint">Ha a Google visszavonja a háttér-hozzáférést, itt egy érintéssel újraengedélyezhető.</small>
  </div>
}

function WatchedSourcesSettings(){
  type WatchGroup={id:string;group_key:string;title:string;source_type:string;watch_type?:string|null;default_mode:"auto"|"review"|"watch";status:"active"|"paused"};
  type WatchSource={id:string;group_id?:string|null;kind:string;label:string;match_value?:string|null;source_url?:string|null;mode:"auto"|"review"|"watch";status:"active"|"paused";origin:string};
  const [groups,setGroups]=useState<WatchGroup[]>([]);
  const [sources,setSources]=useState<WatchSource[]>([]);
  const [q,setQ]=useState("");
  const [expanded,setExpanded]=useState<string|null>(null);
  const [adding,setAdding]=useState(false);
  const [busy,setBusy]=useState(false);
  const [draft,setDraft]=useState({kind:"email",label:"",value:"",mode:"review" as "auto"|"review"|"watch"});
  const kindLabel:Record<string,string>={email:"E-mail cím",email_domain:"E-mail domain",person:"Személy",messenger_group:"Messenger csoport",facebook_group:"Facebook csoport",web:"Weboldal",institution:"Intézmény",other:"Egyéb"};
  const modeLabel:Record<string,string>={auto:"Automatikus",review:"Jóváhagyás",watch:"Csak figyelés"};

  async function load(){
    try{
      const r=await fetch("/api/core/watch-sources",{cache:"no-store"});
      if(!r.ok)return;
      const j=await r.json();
      setGroups(Array.isArray(j.groups)?j.groups:[]);
      setSources(Array.isArray(j.sources)?j.sources:[]);
    }catch{}
  }
  useEffect(()=>{load()},[]);

  async function updateSource(id:string,patch:any){
    setBusy(true);
    try{
      const r=await fetch("/api/core/watch-sources?id="+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)});
      if(r.ok)await load();
    }finally{setBusy(false)}
  }
  async function removeSource(id:string){
    setBusy(true);
    try{
      const r=await fetch("/api/core/watch-sources?id="+encodeURIComponent(id),{method:"DELETE"});
      if(r.ok)await load();
    }finally{setBusy(false)}
  }
  async function addSource(){
    const value=draft.value.trim(),label=draft.label.trim()||value;
    if(!label||!value)return;
    setBusy(true);
    try{
      const isUrl=draft.kind==="web";
      const r=await fetch("/api/core/watch-sources",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        kind:draft.kind,label,matchValue:isUrl?null:value,sourceUrl:isUrl?value:null,mode:draft.mode
      })});
      if(r.ok){
        setDraft({kind:"email",label:"",value:"",mode:"review"});
        setAdding(false);
        await load();
      }
    }finally{setBusy(false)}
  }

  const query=normText(q);
  const visibleGroups=groups.filter(g=>{
    if(!query)return true;
    const own=normText(g.title+" "+g.source_type+" "+(g.watch_type||""));
    const child=sources.some(x=>x.group_id===g.id&&normText(x.label+" "+(x.match_value||"")+" "+(x.source_url||"")).includes(query));
    return own.includes(query)||child;
  });
  const loose=sources.filter(x=>!x.group_id&&(!query||normText(x.label+" "+(x.match_value||"")+" "+(x.source_url||"")).includes(query)));
  const activeCount=sources.filter(x=>x.status==="active").length;

  function SourceRow({x}:{x:WatchSource}){
    return <div className={"watchSourceRow "+(x.status==="paused"?"paused":"")}>
      <div className="watchSourceMain">
        <span className="watchKind">{kindLabel[x.kind]||x.kind}</span>
        <b>{x.label}</b>
        <small>{x.match_value||x.source_url||""}</small>
      </div>
      <select disabled={busy} value={x.mode} onChange={e=>updateSource(x.id,{mode:e.target.value})}>
        <option value="auto">Automatikus</option>
        <option value="review">Jóváhagyás</option>
        <option value="watch">Csak figyelés</option>
      </select>
      <button className={x.status==="active"?"watchPause":"watchResume"} disabled={busy} onClick={()=>updateSource(x.id,{status:x.status==="active"?"paused":"active"})}>{x.status==="active"?"Szünet":"Vissza"}</button>
      <button className="watchDelete" disabled={busy} onClick={()=>removeSource(x.id)}>×</button>
    </div>
  }

  return <div className="watchedSourcesSetting">
    <div className="settingsTitle"><b>Figyelt források</b><span>{activeCount} aktív forrás · e-mail, személy, csoport, weboldal és intézmény. A naptári viselkedés forrásonként állítható.</span></div>
    <div className="watchSourceTools">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Keresés: Teleki, EKKE, KRÉTA…"/>
      <button onClick={()=>setAdding(v=>!v)}>{adding?"Mégse":"＋ Forrás"}</button>
    </div>
    {adding&&<div className="watchAddCard">
      <select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value})}>
        <option value="email">E-mail cím</option>
        <option value="email_domain">E-mail domain</option>
        <option value="person">Személy</option>
        <option value="messenger_group">Messenger csoport</option>
        <option value="facebook_group">Facebook csoport</option>
        <option value="web">Weboldal</option>
        <option value="institution">Intézmény</option>
        <option value="other">Egyéb</option>
      </select>
      <input value={draft.label} onChange={e=>setDraft({...draft,label:e.target.value})} placeholder="Név / megnevezés"/>
      <input value={draft.value} onChange={e=>setDraft({...draft,value:e.target.value})} placeholder={draft.kind==="web"?"https://…":draft.kind==="email_domain"?"@pelda.hu":"Azonosító / cím / csoportnév"}/>
      <select value={draft.mode} onChange={e=>setDraft({...draft,mode:e.target.value as any})}>
        <option value="auto">Automatikus naptár</option>
        <option value="review">Jóváhagyást kér</option>
        <option value="watch">Csak figyelés</option>
      </select>
      <button className="watchAddSave" disabled={busy||!draft.value.trim()} onClick={addSource}>Hozzáadás</button>
    </div>}
    <div className="watchGroupList">
      {visibleGroups.map(g=>{
        const children=sources.filter(x=>x.group_id===g.id);
        const active=children.filter(x=>x.status==="active").length;
        const open=expanded===g.id||!!query;
        return <div className="watchGroup" key={g.id}>
          <button className="watchGroupHead" onClick={()=>setExpanded(open&&!query?null:g.id)}>
            <span><b>{g.title}</b><small>{active}/{children.length} aktív · {g.source_type==="gmail"?"Gmail":"Web"} · {modeLabel[g.default_mode]||g.default_mode}</small></span>
            <em>{open?"⌃":"⌄"}</em>
          </button>
          {open&&<div className="watchSourceRows">{children.length?children.map(x=><SourceRow key={x.id} x={x}/>):<div className="watchEmpty">Nincs külön forrás ebben a csoportban.</div>}</div>}
        </div>
      })}
      {!!loose.length&&<div className="watchGroup">
        <div className="watchGroupHead static"><span><b>Saját hozzáadott források</b><small>{loose.filter(x=>x.status==="active").length}/{loose.length} aktív</small></span></div>
        <div className="watchSourceRows">{loose.map(x=><SourceRow key={x.id} x={x}/>)}</div>
      </div>}
    </div>
    <small className="watchSourceHint">Automatikus: biztos eseménynél rögtön naptár. Jóváhagyás: Igen/Nem kártyát mutat. Csak figyelés: nem készít naptáreseményt.</small>
  </div>
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
  const [closing,setClosing]=useState(false);
  const close=()=>{if(closing)return;setClosing(true);setTimeout(onClose,180)};
  return <div className={"backdrop "+(closing?"closing":"")} onMouseDown={e=>{if(e.currentTarget===e.target)close()}}><div className="modal"><div className="modalHead"><b>{title}</b><button onClick={close}>×</button></div>{children}</div></div>
}
function EventForm({value,connected,onSave,onCancel}:{value:Partial<Ev>;connected:boolean;onSave:(x:Partial<Ev>)=>void;onCancel:()=>void}){
  const [x,setX]=useState(value);
  const titleNorm=normText(x.title||"");
  const suggestedApp=titleNorm.includes("leltar")||titleNorm.includes("rendeles")?"HaviNyersanyag Rendelő":titleNorm.includes("kerek")?"Kerékcsere":titleNorm.includes("szemelyes")?"Személyes Központ":"";
  const appPresets=[
    {name:"",label:"Nincs",url:""},
    {name:"HaviNyersanyag Rendelő",label:"HaviNyersanyag Rendelő",url:""},
    {name:"Személyes Központ",label:"Személyes Központ",url:"https://szemelyes-kozpont.vercel.app/?screen=nav&tab=deadlines"},
    {name:"Kerékcsere",label:"Kerékcsere",url:"https://kerekcsere-app.vercel.app/?tab=garage"},
    {name:"Egyedi",label:"Egyedi hivatkozás",url:""}
  ];
  function chooseApp(name:string){
    const p=appPresets.find(a=>a.name===name);
    setX({...x,linkedApp:name||undefined,linkedLabel:name||undefined,linkedUrl:p?.url||undefined});
  }
  function submit(){
    const linkedLabel=x.linkedApp==="HaviNyersanyag Rendelő"&&titleNorm.includes("leltar")?"Leltár megnyitása":
      x.linkedApp==="HaviNyersanyag Rendelő"&&titleNorm.includes("rendeles")?"Rendelés megnyitása":
      x.linkedApp?((x.linkedApp||"")+" megnyitása"):undefined;
    onSave({...x,linkedLabel});
  }
  return <div className="iosEventForm">
    <section className="iosFormGroup iosTitleGroup">
      <input className="iosTitleInput" value={x.title||""} onChange={e=>setX({...x,title:e.target.value})} placeholder="Cím"/>
      <input value={x.location||""} onChange={e=>setX({...x,location:e.target.value})} placeholder="Helyszín"/>
    </section>

    <section className="iosFormGroup">
      <label className="iosRow"><span>Egész napos</span><input className="iosToggle" type="checkbox" checked={!!x.allDay} onChange={e=>setX({...x,allDay:e.target.checked})}/></label>
      <label className="iosRow"><span>Dátum</span><input type="date" value={x.date||""} onChange={e=>setX({...x,date:e.target.value})}/></label>
      {!x.allDay&&<>
        <label className="iosRow"><span>Kezdés</span><input type="time" step="900" value={x.start||""} onChange={e=>setX({...x,start:e.target.value})}/></label>
        <label className="iosRow"><span>Vége</span><input type="time" step="900" value={x.end||""} onChange={e=>setX({...x,end:e.target.value})}/></label>
      </>}
    </section>

    <section className="iosFormGroup">
      <label className="iosRow"><span>Naptár</span><select value={x.calendar||"work"} onChange={e=>setX({...x,calendar:e.target.value as CalKey})}>{(Object.keys(calMeta) as CalKey[]).map(k=><option key={k} value={k}>{calMeta[k].label}</option>)}</select></label>
      <label className="iosRow"><span>Ismétlődés</span><select disabled={!connected||x.repeat==="googleSeries"} value={x.repeat||"none"} onChange={e=>setX({...x,repeat:e.target.value as RepeatMode})}>
        {x.repeat==="googleSeries"&&<option value="googleSeries">Google-sorozat</option>}
        <option value="none">Nincs</option><option value="daily">Naponta</option><option value="weekly">Hetente</option><option value="monthly">Havonta</option><option value="yearly">Évente</option>
      </select></label>
      <label className="iosRow"><span>Értesítés</span><select disabled={!connected} value={Number(x.reminder||0)} onChange={e=>setX({...x,reminder:Number(e.target.value)})}>
        <option value={0}>Nincs</option><option value={5}>5 perccel előtte</option><option value={10}>10 perccel előtte</option><option value={15}>15 perccel előtte</option><option value={30}>30 perccel előtte</option><option value={60}>1 órával előtte</option><option value={1440}>1 nappal előtte</option>
      </select></label>
    </section>

    <section className="iosFormGroup">
      <label className="iosRow"><span>Kapcsolódó app</span><select value={x.linkedApp||""} onChange={e=>chooseApp(e.target.value)}>{appPresets.map(p=><option key={p.name||"none"} value={p.name}>{p.label}</option>)}</select></label>
      {suggestedApp&&!x.linkedApp&&<button className="appSuggestion" type="button" onClick={()=>chooseApp(suggestedApp)}>Javaslat: {suggestedApp} hozzákapcsolása</button>}
      {x.linkedApp&&<label className="iosLinkField"><span>Megnyitási hivatkozás</span><input value={x.linkedUrl||""} onChange={e=>setX({...x,linkedUrl:e.target.value})} placeholder={x.linkedApp==="HaviNyersanyag Rendelő"?"Az app pontos URL-je":"https://…"}/></label>}
      <LinkedOpenButton url={x.linkedUrl} label={x.linkedLabel||x.linkedApp||"Megnyitás az eredeti helyen"}/>
    </section>

    <section className="iosFormGroup">
      <textarea className="iosNotes" value={x.note||""} onChange={e=>setX({...x,note:e.target.value})} placeholder="Jegyzet"/>
    </section>

    {!connected&&<small className="googleOnlyHint">Az ismétlődés és az időzített Google-értesítés Google Naptár-kapcsolattal érhető el.</small>}
    <div className="iosModalActions"><button className="iosCancel" onClick={onCancel}>Mégse</button><button className="iosSave" onClick={submit}>Hozzáadás / Mentés</button></div>
  </div>
}
