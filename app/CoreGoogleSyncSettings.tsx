"use client";
import {useEffect,useState} from "react";

type SyncState={
  active_events:number;
  linked:number;
  pending_or_error:number;
  workplan_events:number;
  workplan_linked:number;
};

export default function CoreGoogleSyncSettings(){
  const [state,setState]=useState<SyncState|null>(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  async function load(){
    try{
      const r=await fetch("/api/core/google-sync",{cache:"no-store"});
      if(r.ok)setState(await r.json());
    }catch{}
  }

  useEffect(()=>{load()},[]);

  async function retry(){
    setBusy(true);
    setMsg("");
    try{
      const r=await fetch("/api/core/google-sync",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({limit:250})
      });
      const j=await r.json();
      if(r.ok)setMsg(j.failed?j.linked+" szinkronizálva · "+j.failed+" vár még":"Minden várakozó esemény szinkronizálva.");
      else setMsg("A Google-kapcsolat még nem használható.");
      await load();
    }catch{
      setMsg("A szinkron újrapróbálása nem sikerült.");
    }finally{
      setBusy(false);
    }
  }

  const ok=!!state&&Number(state.pending_or_error||0)===0;

  return <div className={"coreGoogleSyncSetting "+(ok?"ok":"")}>
    <div className="settingsTitle">
      <b>Központi Google-szinkron</b>
      <span>Calendar Core → Google Naptár → iPhone / iPad / Mac. Egy Core-eseményhez egyetlen Google-esemény tartozik.</span>
    </div>

    {state?<div className="coreSyncStats">
      <span><b>{state.active_events||0}</b><small>Core esemény</small></span>
      <span><b>{state.linked||0}</b><small>Google-höz kötve</small></span>
      <span className={(state.pending_or_error||0)?"warn":""}><b>{state.pending_or_error||0}</b><small>Vár / hiba</small></span>
      <span><b>{state.workplan_linked||0}/{state.workplan_events||0}</b><small>Munkaterv Google-ben</small></span>
    </div>:<div className="gmailLoading">Szinkronállapot ellenőrzése…</div>}

    <div className="coreSyncActions">
      <small>{msg||((state?.pending_or_error||0)>0
        ?"A várakozó események Google-újracsatlakozás után biztonságosan újrapróbálhatók."
        :"A központi Google-szinkron rendben.")}</small>
      <button disabled={busy||!state||(state.pending_or_error||0)===0} onClick={retry}>
        {busy?"Szinkron…":"Újrapróbálás"}
      </button>
    </div>
  </div>
}
