import {ImageResponse} from "next/og";
export const size={width:180,height:180};
export const contentType="image/png";
export default function AppleIcon(){
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(circle at 50% 18%,#fff,#dff4ff 35%,#65c7ff 72%,#2387ff)",borderRadius:40,padding:14}}>
      <div style={{width:142,height:142,display:"flex",flexDirection:"column",borderRadius:30,overflow:"hidden",background:"#f8fbff",boxShadow:"0 10px 24px rgba(20,76,160,.28)"}}>
        <div style={{height:43,display:"flex",alignItems:"center",justifyContent:"space-around",background:"linear-gradient(135deg,#1769f5,#16c9e8)"}}>
          <div style={{width:13,height:29,borderRadius:8,background:"#fff",boxShadow:"0 2px 5px rgba(0,40,120,.22)"}}/>
          <div style={{width:13,height:29,borderRadius:8,background:"#fff",boxShadow:"0 2px 5px rgba(0,40,120,.22)"}}/>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:52,height:52,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#1769f5,#0b52ef)",color:"#fff",fontSize:28,fontWeight:800,boxShadow:"0 5px 12px rgba(21,90,240,.35)"}}>14</div>
        </div>
      </div>
    </div>,
    size
  );
}
