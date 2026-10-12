import {NextRequest,NextResponse} from "next/server";

const coreUrl=()=>process.env.CALENDAR_CORE_URL||"https://calendar-core.vercel.app";
const coreKey=()=>process.env.CALENDAR_CORE_API_KEY||"";

async function forward(path:string,init?:RequestInit){
  const key=coreKey();
  if(!key)return NextResponse.json({error:"core_not_configured"},{status:503});
  try{
    const r=await fetch(coreUrl()+path,{
      ...init,
      headers:{
        "x-calendar-core-key":key,
        "Content-Type":"application/json",
        ...(init?.headers||{})
      },
      cache:"no-store"
    });
    if(r.status===204)return new NextResponse(null,{status:204});
    const text=await r.text();
    return new NextResponse(text,{status:r.status,headers:{"Content-Type":r.headers.get("content-type")||"application/json"}});
  }catch{
    return NextResponse.json({error:"core_unreachable"},{status:502});
  }
}

export async function GET(req:NextRequest){
  const q=new URLSearchParams();
  const from=req.nextUrl.searchParams.get("from");
  const to=req.nextUrl.searchParams.get("to");
  if(from)q.set("from",from);
  if(to)q.set("to",to);
  return forward("/api/events"+(q.size?"?"+q.toString():""));
}

export async function POST(req:NextRequest){
  const body=await req.text();
  return forward("/api/events",{method:"POST",body});
}

export async function PATCH(req:NextRequest){
  const id=req.nextUrl.searchParams.get("id");
  if(!id)return NextResponse.json({error:"missing_id"},{status:400});
  const body=await req.text();
  return forward("/api/events/"+encodeURIComponent(id),{method:"PATCH",body});
}

export async function DELETE(req:NextRequest){
  const id=req.nextUrl.searchParams.get("id");
  if(!id)return NextResponse.json({error:"missing_id"},{status:400});
  return forward("/api/events/"+encodeURIComponent(id),{method:"DELETE"});
}
