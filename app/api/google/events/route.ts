import { NextRequest, NextResponse } from "next/server";

async function access(req:NextRequest){
  const refresh=req.cookies.get("gcal_refresh")?.value;
  if(!refresh) return null;
  const body=new URLSearchParams({
    client_id:process.env.GOOGLE_CLIENT_ID||"",
    client_secret:process.env.GOOGLE_CLIENT_SECRET||"",
    refresh_token:refresh,
    grant_type:"refresh_token"
  });
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
  const j=await r.json();
  return r.ok?j.access_token:null;
}

function validDate(v:any){return typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)}
function plusOneDay(date:string){
  const [y,m,d]=date.split("-").map(Number);
  const x=new Date(Date.UTC(y,m-1,d));
  x.setUTCDate(x.getUTCDate()+1);
  return x.toISOString().slice(0,10);
}
function normalizeDateTime(date:string,value:any){
  if(typeof value!=="string"||!value)return null;
  if(/^\d{2}:\d{2}$/.test(value)) return date+"T"+value+":00";
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?/.test(value)) return value;
  return null;
}
function eventBody(x:any){
  if(!validDate(x.date)) return null;
  const repeatMap:Record<string,string>={daily:"RRULE:FREQ=DAILY",weekly:"RRULE:FREQ=WEEKLY",monthly:"RRULE:FREQ=MONTHLY",yearly:"RRULE:FREQ=YEARLY"};
  const privateProps:Record<string,string>={
    haviCategory:String(x.calendar||"work"),
    haviUid:String(x.id||""),
    sourceApp:String(x.sourceApp||"havi"),
    sourceRecordId:String(x.sourceRecordId||x.id||"")
  };
  if(x.centralEventId) privateProps.calendarCoreId=String(x.centralEventId);

  let start:any,end:any;
  if(x.allDay){
    start={date:x.date};
    end={date:validDate(x.endDate)?x.endDate:plusOneDay(x.date)};
  }else{
    const startTime=normalizeDateTime(x.date,x.start);
    const endTime=normalizeDateTime(x.date,x.end);
    if(!startTime||!endTime) return null;
    start={dateTime:startTime,timeZone:"Europe/Budapest"};
    end={dateTime:endTime,timeZone:"Europe/Budapest"};
  }

  const body:any={
    summary:x.title||"Esemény",
    location:x.location||"",
    description:x.note||"",
    extendedProperties:{private:privateProps},
    start,
    end,
    reminders:Number(x.reminder||0)>0
      ?{useDefault:false,overrides:[{method:"popup",minutes:Number(x.reminder)}]}
      :{useDefault:true}
  };
  if(x.repeat&&repeatMap[x.repeat]) body.recurrence=[repeatMap[x.repeat]];
  return body;
}

async function googleJson(url:string,token:string,init?:RequestInit){
  const r=await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...(init?.headers||{})},cache:"no-store"});
  let j:any=null;
  try{j=await r.json()}catch{}
  return {r,j};
}

export async function GET(req:NextRequest){
  const token=await access(req);
  if(!token) return NextResponse.json({connected:false},{status:401});
  const from=req.nextUrl.searchParams.get("from")||new Date().toISOString();
  const to=req.nextUrl.searchParams.get("to")||new Date(Date.now()+35*86400000).toISOString();
  const min=new Date(from),max=new Date(to);
  if(!Number.isFinite(min.getTime())||!Number.isFinite(max.getTime())||min>=max){
    return NextResponse.json({connected:true,error:"invalid_range"},{status:400});
  }
  const base=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  base.searchParams.set("timeMin",min.toISOString());
  base.searchParams.set("timeMax",max.toISOString());
  base.searchParams.set("singleEvents","true");
  base.searchParams.set("orderBy","startTime");
  base.searchParams.set("maxResults","2500");
  const items:any[]=[];
  const seen=new Set<string>();
  let pageToken:string|undefined;
  for(let page=0;page<20;page++){
    const url=new URL(base);
    if(pageToken)url.searchParams.set("pageToken",pageToken);
    let r:Response;
    try{
      r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    }catch{
      return NextResponse.json({connected:true,error:"google_unreachable"},{status:502});
    }
    let j:any;
    try{j=await r.json()}catch{
      return NextResponse.json({connected:true,error:"google_invalid_response"},{status:502});
    }
    if(!r.ok)return NextResponse.json({connected:true,error:j?.error?.message||"google_error"},{status:r.status});
    for(const item of Array.isArray(j.items)?j.items:[]){
      if(typeof item.id==="string"&&seen.has(item.id))continue;
      if(typeof item.id==="string")seen.add(item.id);
      items.push(item);
    }
    pageToken=j.nextPageToken;
    if(!pageToken)return NextResponse.json({connected:true,items});
  }
  // Never display a silently truncated calendar as a complete result.
  return NextResponse.json({connected:true,error:"google_too_many_pages"},{status:502});
}

export async function POST(req:NextRequest){
  const token=await access(req);
  if(!token) return NextResponse.json({error:"not_connected"},{status:401});
  const x=await req.json();
  const body=eventBody(x);
  if(!body) return NextResponse.json({error:"invalid_event_time"},{status:400});

  if(x.id){
    const lookup=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    lookup.searchParams.set("privateExtendedProperty","haviUid="+x.id);
    lookup.searchParams.set("maxResults","1");
    lookup.searchParams.set("showDeleted","false");
    const lr=await fetch(lookup,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    if(lr.ok){
      const lj=await lr.json();
      const existing=lj.items?.[0];
      if(existing?.id){
        const patched=await googleJson(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(existing.id)}`,
          token,
          {method:"PATCH",body:JSON.stringify(body)}
        );
        return NextResponse.json(patched.j||{}, {status:patched.r.status});
      }
    }
  }

  const created=await googleJson(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    token,
    {method:"POST",body:JSON.stringify(body)}
  );
  return NextResponse.json(created.j||{}, {status:created.r.status});
}

export async function PATCH(req:NextRequest){
  const token=await access(req);
  if(!token) return NextResponse.json({error:"not_connected"},{status:401});
  const x=await req.json();
  if(!x.googleId) return NextResponse.json({error:"missing_id"},{status:400});
  const body=eventBody(x);
  if(!body) return NextResponse.json({error:"invalid_event_time"},{status:400});
  const updated=await googleJson(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(x.googleId)}`,
    token,
    {method:"PATCH",body:JSON.stringify(body)}
  );
  return NextResponse.json(updated.j||{}, {status:updated.r.status});
}

export async function DELETE(req:NextRequest){
  const token=await access(req);
  if(!token) return NextResponse.json({error:"not_connected"},{status:401});
  const id=req.nextUrl.searchParams.get("id");
  if(!id) return NextResponse.json({error:"missing_id"},{status:400});
  const r=await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
  return new NextResponse(null,{status:r.status===204?204:r.status});
}
