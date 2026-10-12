"use client";

export default function LinkedOpenButton({url,label}:{url?:string;label?:string}){
  if(!url)return null;
  return <a className="linkedOpenButton" href={url} target="_blank" rel="noreferrer">
    {label||"Megnyitás az eredeti helyen"} ↗
  </a>;
}
