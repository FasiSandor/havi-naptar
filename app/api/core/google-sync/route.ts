import {NextRequest,NextResponse} from "next/server";

const coreUrl=()=>process.env.CALENDAR_CORE_URL||"https://calendar-core.vercel.app";
const coreKey=()=>process.env.CALENDAR_CORE_API_KEY||"";

async function forward(init?:RequestInit){
  const key=coreKey();
  if(!key)return NextResponse.json({error:"core_not_configured"},{status:503});
  try{
    const r=await fetch(coreUrl()+"/api/google-sync",{
      ...init,
      headers:{"x-calendar-core-key":key,"Content-Type":"application/json",...(init?.headers||{})},
      cache:"no-store"
    });
    const text=await r.text();
    return new NextResponse(text,{status:r.status,headers:{"Content-Type":r.headers.get("content-type")||"application/json"}});
  }catch{
    return NextResponse.json({error:"core_unreachable"},{status:502});
  }
}

export async function GET(){return forward()}
export async function POST(req:NextRequest){return forward({method:"POST",body:await req.text()})}
