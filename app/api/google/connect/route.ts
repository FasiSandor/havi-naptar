import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest){
  const id=process.env.GOOGLE_CLIENT_ID;
  if(!id) return NextResponse.json({error:"GOOGLE_CLIENT_ID nincs beállítva"},{status:500});
  const origin=process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  const redirect=origin+"/api/google/callback";
  const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",id);
  url.searchParams.set("redirect_uri",redirect);
  url.searchParams.set("response_type","code");
  url.searchParams.set("access_type","offline");
  url.searchParams.set("prompt","consent");
  url.searchParams.set("scope","https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly");
  return NextResponse.redirect(url);
}