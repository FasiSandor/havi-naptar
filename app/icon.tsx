import {ImageResponse} from "next/og";

export const size={width:512,height:512};
export const contentType="image/png";

export default function Icon(){
  return new ImageResponse(
    <div style={{
      width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
      background:"radial-gradient(circle at 50% 18%, #ffffff 0%, #dff4ff 32%, #8ed8ff 66%, #2f9cff 100%)",
      borderRadius:112,padding:44,boxSizing:"border-box"
    }}>
      <div style={{
        width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
        borderRadius:84,background:"linear-gradient(145deg, rgba(255,255,255,.92), rgba(190,225,255,.75))",
        border:"3px solid rgba(255,255,255,.88)",boxShadow:"0 26px 70px rgba(18,87,180,.28)"
      }}>
        <div style={{width:330,height:330,display:"flex",flexDirection:"column",borderRadius:62,overflow:"hidden",boxShadow:"0 22px 52px rgba(20,76,160,.30)",background:"#f8fbff"}}>
          <div style={{height:102,display:"flex",alignItems:"center",justifyContent:"space-around",background:"linear-gradient(135deg,#1769f5,#16c9e8)",position:"relative"}}>
            <div style={{width:30,height:70,borderRadius:18,background:"linear-gradient(90deg,#f7fbff,#b8dbff,#ffffff)",border:"2px solid rgba(255,255,255,.85)",boxShadow:"0 4px 12px rgba(0,40,120,.24)"}}/>
            <div style={{width:30,height:70,borderRadius:18,background:"linear-gradient(90deg,#f7fbff,#b8dbff,#ffffff)",border:"2px solid rgba(255,255,255,.85)",boxShadow:"0 4px 12px rgba(0,40,120,.24)"}}/>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
            <div style={{width:"100%",display:"flex",flexWrap:"wrap",gap:18,justifyContent:"center"}}>
              {Array.from({length:15},(_,i)=>{
                const main=i===7;
                const accent=i===3?"#ff6767":i===11?"#42c985":i===14?"#63bff5":"#dfeaf6";
                return <div key={i} style={{
                  width:42,height:42,flex:"0 0 42px",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",
                  background:main?"linear-gradient(135deg,#1769f5,#0b52ef)":accent,
                  color:main?"white":"transparent",fontSize:22,fontWeight:800,
                  boxShadow:main?"0 8px 18px rgba(21,90,240,.35)":"none"
                }}>{main?"14":""}</div>
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    size
  );
}
