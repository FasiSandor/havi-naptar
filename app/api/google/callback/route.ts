import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest){
  const code=req.nextUrl.searchParams.get("code");
  const origin=process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  if(!code) return NextResponse.redirect(origin+"/?google=error");
  const body=new URLSearchParams({
    code,
    client_id:process.env.GOOGLE_CLIENT_ID||"",
    client_secret:process.env.GOOGLE_CLIENT_SECRET||"",
    redirect_uri:origin+"/api/google/callback",
    grant_type:"authorization_code"
  });
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
  const token=await r.json();
  if(!r.ok || !token.refresh_token) return NextResponse.redirect(origin+"/?google=error");
  const res=NextResponse.redirect(origin+"/?google=connected");
  res.cookies.set("gcal_refresh",token.refresh_token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*365});
  return res;
}