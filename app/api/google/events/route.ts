import { NextRequest, NextResponse } from "next/server";
async function access(req:NextRequest){
  const refresh=req.cookies.get("gcal_refresh")?.value;
  if(!refresh) return null;
  const body=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",refresh_token:refresh,grant_type:"refresh_token"});
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
  const j=await r.json(); return r.ok?j.access_token:null;
}
function eventBody(x:any){
  const repeatMap:Record<string,string>={daily:"RRULE:FREQ=DAILY",weekly:"RRULE:FREQ=WEEKLY",monthly:"RRULE:FREQ=MONTHLY",yearly:"RRULE:FREQ=YEARLY"};
  const body:any={
    summary:x.title||"Esemény",
    location:x.location||"",
    description:x.note||"",
    extendedProperties:{private:{haviCategory:x.calendar||"work",haviUid:x.id||""}},
    start:x.allDay?{date:x.date}:{dateTime:x.start,timeZone:"Europe/Budapest"},
    end:x.allDay?{date:x.endDate||x.date}:{dateTime:x.end,timeZone:"Europe/Budapest"},
    reminders:Number(x.reminder||0)>0?{useDefault:false,overrides:[{method:"popup",minutes:Number(x.reminder)}]}:{useDefault:true}
  };
  if(x.repeat&&repeatMap[x.repeat])body.recurrence=[repeatMap[x.repeat]];
  return body;
}
export async function GET(req:NextRequest){
  const token=await access(req); if(!token) return NextResponse.json({connected:false},{status:401});
  const from=req.nextUrl.searchParams.get("from")||new Date().toISOString();
  const to=req.nextUrl.searchParams.get("to")||new Date(Date.now()+35*86400000).toISOString();
  const u=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  u.searchParams.set("timeMin",from);u.searchParams.set("timeMax",to);u.searchParams.set("singleEvents","true");u.searchParams.set("orderBy","startTime");
  const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"}); const j=await r.json();
  if(!r.ok) return NextResponse.json({connected:false,error:j?.error?.message||"google_error"},{status:r.status});
  return NextResponse.json({connected:true,items:j.items||[]});
}
export async function POST(req:NextRequest){
  const token=await access(req); if(!token) return NextResponse.json({error:"not_connected"},{status:401});
  const x=await req.json();

  // Idempotens létrehozás: ugyanaz a HAVI-esemény hálózati újrapróbálásnál se duplázódjon.
  if(x.id){
    const lookup=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    lookup.searchParams.set("privateExtendedProperty","haviUid="+x.id);
    lookup.searchParams.set("maxResults","1");
    lookup.searchParams.set("showDeleted","false");
    const lr=await fetch(lookup,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    if(lr.ok){
      const lj=await lr.json();
      const existing=lj.items?.[0];
      if(existing) return NextResponse.json(existing,{status:200});
    }
  }

  const r=await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(eventBody(x))});
  return NextResponse.json(await r.json(),{status:r.status});
}
export async function PATCH(req:NextRequest){
  const token=await access(req); if(!token) return NextResponse.json({error:"not_connected"},{status:401});
  const x=await req.json(); if(!x.googleId) return NextResponse.json({error:"missing_id"},{status:400});
  const r=await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(x.googleId)}`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(eventBody(x))});
  return NextResponse.json(await r.json(),{status:r.status});
}
export async function DELETE(req:NextRequest){
  const token=await access(req); if(!token) return NextResponse.json({error:"not_connected"},{status:401});
  const id=req.nextUrl.searchParams.get("id"); if(!id) return NextResponse.json({error:"missing_id"},{status:400});
  const r=await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
  return new NextResponse(null,{status:r.status===204?204:r.status});
}