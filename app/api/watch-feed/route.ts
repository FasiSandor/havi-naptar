import {NextResponse} from "next/server";

export const revalidate=1800;
type Item={id:string;title:string;url:string;summary:string;source:string;published:string|null;category:string};
const sources=[
  {name:"Pályázati Portál",url:"https://www.palyazat.gov.hu/rss.xml"},
  {name:"NKFIH",url:"https://rss.nkfih.gov.hu/news"}
];
function decode(s:string){
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();
}
function field(xml:string,name:string){
  const m=xml.match(new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i"));
  return m?decode(m[1]):"";
}
function classify(text:string){
  if(/mesterséges intelligencia|artificial intelligence|\bai\b|digitaliz|informatik|szoftver|technológ/i.test(text))return "ai";
  if(/állás|munkaerő|foglalkoztat|álláshely/i.test(text))return "jobs";
  if(/alapítvány|civil szervezet|nonprofit|adomány/i.test(text))return "foundation";
  if(/önkormányzat|település|helyi fejleszt/i.test(text))return "local";
  if(/oktatás|tanár|kutatás|innováció|fejlesztés|ösztöndíj|egyetem/i.test(text))return "education";
  return "grants";
}
function safeUrl(raw:string){try{const u=new URL(raw);return u.protocol==="https:"?u.href:""}catch{return ""}}
async function read(src:(typeof sources)[number]){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  try{
    const resp=await fetch(src.url,{signal:controller.signal,next:{revalidate:1800},headers:{"Accept":"application/rss+xml, application/xml, text/xml"}});
    if(!resp.ok)throw Error("http_"+resp.status);
    const xml=(await resp.text()).slice(0,1000000);
    const entries=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,35);
    return entries.map((entry,i)=>{
      const block=entry[1],title=field(block,"title"),summary=field(block,"description");
      const url=safeUrl(field(block,"link")),published=field(block,"pubDate");
      return {id:src.name+":"+i+":"+url,title,url,summary:summary.slice(0,280),source:src.name,published:published&&Number.isFinite(Date.parse(published))?new Date(published).toISOString():null,category:classify(title+" "+summary)} as Item;
    }).filter(x=>x.title&&x.url);
  }finally{clearTimeout(timer)}
}
export async function GET(){
  const results=await Promise.allSettled(sources.map(read));
  const items=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
  const unique=[...new Map(items.map(x=>[x.url,x])).values()];
  unique.sort((a,b)=>(b.published||"").localeCompare(a.published||""));
  return NextResponse.json({items:unique,checkedAt:new Date().toISOString(),sources:sources.map((s,i)=>({name:s.name,status:results[i].status==="fulfilled"?"ok":"unavailable"}))},{headers:{"Cache-Control":"public, s-maxage=1800, stale-while-revalidate=3600"}});
}
