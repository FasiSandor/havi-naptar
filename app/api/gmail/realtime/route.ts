import {NextRequest,NextResponse} from "next/server";

const endpoint="https://syzpkrypgcwiyzzzlzzi.supabase.co/functions/v1/naptar-gmail-realtime";
const coreKey=()=>process.env.CALENDAR_CORE_API_KEY||"";

async function call(body:any){
  const key=coreKey();
  if(!key)return NextResponse.json({ok:false,error:"gmail_bridge_not_configured"},{status:503});
  try{
    const r=await fetch(endpoint,{
      method:"POST",
      headers:{"content-type":"application/json","x-calendar-core-key":key},
      body:JSON.stringify(body),
      cache:"no-store"
    });
    const text=await r.text();
    return new NextResponse(text,{status:r.status,headers:{"content-type":r.headers.get("content-type")||"application/json"}});
  }catch{
    return NextResponse.json({ok:false,error:"gmail_bridge_unreachable"},{status:502});
  }
}

export async function GET(){
  return call({action:"havi_status"});
}

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({}));
  const account=String(body.account_email||"").toLowerCase();
  if(!account)return NextResponse.json({ok:false,error:"missing_account"},{status:400});
  const origin=req.nextUrl.origin;
  return call({action:"havi_oauth_url",account_email:account,return_url:origin+"/"});
}
