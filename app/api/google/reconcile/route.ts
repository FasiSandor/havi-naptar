import {NextRequest,NextResponse} from "next/server";
type CoreEvent={id:string;google_event_id?:string|null;status?:string};
function rangeDate(s:string|null){if(!s)return null;const d=new Date(s);return Number.isFinite(d.getTime())?d:null}
async function access(refresh:string){
  const id=process.env.GOOGLE_CLIENT_ID,secret=process.env.GOOGLE_CLIENT_SECRET;
  if(!id||!secret)return null;
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:id,client_secret:secret,refresh_token:refresh,grant_type:"refresh_token"}),cache:"no-store"});
  const j=await r.json().catch(()=>({}));
  return r.ok&&typeof j.access_token==="string"?j.access_token:null;
}
export async function POST(req:NextRequest){
  const refresh=req.cookies.get("gcal_refresh")?.value;
  if(!refresh)return NextResponse.json({error:"google_not_connected"},{status:401});
  const key=process.env.CALENDAR_CORE_API_KEY;
  if(!key)return NextResponse.json({error:"core_not_configured"},{status:503});
  const from=rangeDate(req.nextUrl.searchParams.get("from"));
  const to=rangeDate(req.nextUrl.searchParams.get("to"));
  if(!from||!to||from>=to||to.getTime()-from.getTime()>45*86400000)
    return NextResponse.json({error:"invalid_range"},{status:400});
  const token=await access(refresh);
  if(!token)return NextResponse.json({error:"google_token_failed"},{status:401});
  const base=(process.env.CALENDAR_CORE_URL||"https://calendar-core.vercel.app").replace(/\/$/,"");
  // Reconcile only known Core events; never import unrelated Google calendars.
  const query=new URLSearchParams({from:from.toISOString(),to:to.toISOString()});
  const core=await fetch(base+"/api/events?"+query,{headers:{"x-calendar-core-key":key},cache:"no-store"}).catch(()=>null);
  if(!core?.ok)return NextResponse.json({error:"core_read_failed"},{status:502});
  const coreJson=await core.json().catch(()=>({}));
  const linked=new Map<string,CoreEvent>();
  for(const e of Array.isArray(coreJson.items)?coreJson.items:[]){
    if(e?.id&&e?.google_event_id)linked.set(String(e.google_event_id),e);
  }
  if(linked.size>500)return NextResponse.json({error:"too_many_linked_events"},{status:413});
  const eventsUrl=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  eventsUrl.searchParams.set("timeMin",from.toISOString());
  eventsUrl.searchParams.set("timeMax",to.toISOString());
  eventsUrl.searchParams.set("singleEvents","true");
  eventsUrl.searchParams.set("showDeleted","true");
  eventsUrl.searchParams.set("maxResults","2500");
  let pageToken="",page=0,updated=0,ignored=0,failed=0,seen=0;
  do{
    if(page++>=15)return NextResponse.json({error:"google_page_limit"},{status:502});
    const url=new URL(eventsUrl);
    if(pageToken)url.searchParams.set("pageToken",pageToken);
    const g=await fetch(url,{headers:{Authorization:"Bearer "+token},cache:"no-store"}).catch(()=>null);
    if(!g?.ok)return NextResponse.json({error:"google_read_failed"},{status:502});
    const response=await g.json().catch(()=>({}));
    for(const item of Array.isArray(response.items)?response.items:[]){
      if(!item?.id)continue;
      seen++;
      const row=linked.get(String(item.id));
      if(!row)continue;
      const privateId=item.extendedProperties?.private?.calendarCoreId;
      if(privateId&&String(privateId)!==String(row.id)){failed++;continue}
      if(!item.updated){failed++;continue}
      const payload={
        googleEventId:String(item.id),calendarCoreId:String(row.id),status:item.status==="cancelled"?"cancelled":"confirmed",
        title:item.summary||"Esemény",start:item.start,end:item.end,
        location:item.location||"",description:item.description||"",updated:item.updated
      };
      const pushed=await fetch(base+"/api/google-inbound",{
        method:"POST",headers:{"x-calendar-core-key":key,"Content-Type":"application/json"},
        body:JSON.stringify(payload),cache:"no-store"
      }).catch(()=>null);
      if(!pushed?.ok){failed++;continue}
      const result=await pushed.json().catch(()=>({}));
      if(result.updated)updated++;else ignored++;
    }
    pageToken=String(response.nextPageToken||"");
  }while(pageToken);
  // A missing event is NOT a deletion signal: it may have moved out of range.
  return NextResponse.json({ok:failed===0,seen,linked:linked.size,updated,ignored,failed});
}
