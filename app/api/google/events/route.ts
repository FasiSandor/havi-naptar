import { NextRequest, NextResponse } from "next/server";
async function access(req:NextRequest){
  const refresh=req.cookies.get("gcal_refresh")?.value;
  if(!refresh) return null;
  const body=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",refresh_token:refresh,grant_type:"refresh_token"});
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
  const j=await r.json(); return r.ok?j.access_token:null;
}
function eventBody(x:any){return {summary:x.title||"Esemény",location:x.location||"",description:x.note||"",start:x.allDay?{date:x.date}:{dateTime:x.start},end:x.allDay?{date:x.endDate||x.date}:{dateTime:x.end}}}
export async function GET(req:NextRequest){
  const token=await access(req); if(!token) return NextResponse.json({connected:false},{status:401});
  const from=req.nextUrl.searchParams.get("from")||new Date().toISOString();
  const to=req.nextUrl.searchParams.get("to")||new Date(Date.now()+35*86400000).toISOString();
  const u=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  u.searchParams.set("timeMin",from);u.searchParams.set("timeMax",to);u.searchParams.set("singleEvents","true");u.searchParams.set("orderBy","startTime");
  const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`}}); const j=await r.json();
  return NextResponse.json({connected:true,items:j.items||[]},{status:r.status});
}
export async function POST(req:NextRequest){
  const token=await access(req); if(!token) return NextResponse.json({error:"not_connected"},{status:401});
  const x=await req.json();
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