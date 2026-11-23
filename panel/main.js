(()=>{var en=Object.defineProperty;var tn=(e,n,s)=>n in e?en(e,n,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[n]=s;var Me=(e,n,s)=>tn(e,typeof n!="symbol"?n+"":n,s);var S="openchamber.sdk";var ye="data-oc-scrolling",Ze=`
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${ye}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${ye}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${ye}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${ye}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;function Qt(e){let n=e.documentElement;if(n.hasAttribute("data-oc-scrollbar-activity"))return;n.setAttribute("data-oc-scrollbar-activity","");let s=new WeakMap;e.addEventListener("scroll",a=>{let i=a.target===e?n:a.target;if(!(i instanceof Element))return;i.hasAttribute("data-oc-scrolling")||i.setAttribute("data-oc-scrolling","");let d=s.get(i);d!==void 0&&clearTimeout(d),s.set(i,setTimeout(()=>{s.delete(i),i.removeAttribute("data-oc-scrolling")},1e3))},{capture:!0,passive:!0})}var on=`(${Qt.toString()})(document);`;var Zt=e=>{let n=[],s=0,a=0;return{push:i=>{for(n.push(i),a+=i.length;a-s>e&&n.length>1;){let d=n.shift();a-=d?.length??0,s=0}},pull:i=>{let d=0;for(;d<i.length&&n.length>0;){let A=n[0],h=Math.min(i.length-d,A.length-s);i.set(A.subarray(s,s+h),d),d+=h,s+=h,s>=A.length&&(n.shift(),a-=A.length,s=0)}i.fill(0,d)},clear:()=>{n.length=0,s=0,a=0},get size(){return a-s}}};var no=/^[a-z][a-z0-9-]{0,39}$/;var eo=e=>Object(e)===e&&!Array.isArray(e),et=(e,n)=>Object.keys(e).every(s=>n.includes(s)),to=e=>String(e)===e&&e.length>=1&&e.length<=60,oo=e=>String(e)===e&&e.length>=1&&e.length<=80,ro=e=>{if(!Array.isArray(e)||e.length>4)return!1;let n=new Set;for(let s of e){if(!eo(s)||!no.test(s.id)||!to(s.label)||s.disabled!==void 0&&s.disabled!==!0&&s.disabled!==!1||n.has(s.id))return!1;if(n.add(s.id),s.kind==="button"){if(!et(s,["kind","id","label","disabled"]))return!1;continue}if(s.kind!=="select"||!et(s,["kind","id","label","value","options","disabled"])||!oo(s.value)||!Array.isArray(s.options)||s.options.length<1||s.options.length>16)return!1;let a=new Set;for(let i of s.options){if(!eo(i)||!et(i,["value","label"])||!oo(i.value)||!to(i.label)||a.has(i.value))return!1;a.add(i.value)}if(!a.has(s.value))return!1}return!0};var rn=1024*1024;var so=["{id}","{segment}","{segments+}"];var Yn=new Set(so);var ao=["turn-finished","turn-failed","permission-asked","question-asked","turn-started","session-created","session-archived","session-deleted"];var Zn=new Set(ao);var tt=e=>"bytes"in e?e.bytes.byteLength:e.content.length,io=(e,n)=>{if(e.path!==n.path||e.readOnly!==n.readOnly)return!1;if(e.encoding==="text"||n.encoding==="text")return e.encoding==="text"&&n.encoding==="text"&&e.content===n.content;if(e.bytes.byteLength!==n.bytes.byteLength)return!1;for(let s=0;s<e.bytes.byteLength;s+=1)if(e.bytes[s]!==n.bytes[s])return!1;return!0};var co=/^[A-Za-z0-9_-]{1,80}$/;var lo=["left","right","top","bottom"];var uo=(e,n=0,s={remaining:16e3})=>{if(--s.remaining<0||n>=32)return!1;if(e===null)return!0;let a=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let i of a)if(!uo(i,n+1,s))return!1;return!0},ot=e=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every(n=>/^(0|[1-9]\d*)$/.test(n)&&Number(n)<e.length)&&e.every(ot);if(Object(e)===e){let n=Object.getPrototypeOf(e);return(n===null||n===Object.prototype)&&Object.values(e).every(ot)}return String(e)===e||Number.isFinite(e)},nt=e=>{try{return String(e.id)!==e.id||!co.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!lo.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!uo(e.data)||!ot(e.data)?!1:JSON.stringify(e.data).length<=16e3}catch{return!1}};var po=/^[0-9a-f]{7,64}$/i,_o=e=>po.test(e),rt=255,Eo=(e,n,s)=>({openCommit:a=>_o(a)?e({channel:S,v:1,type:"open-commit",id:n(),payload:{sha:a}}):s("Commit id must be 7 to 64 hex characters."),openWalkthrough:({base:a})=>{let i=a.trim();return!i||i.length>rt?s(`Base must contain 1 to ${rt} characters.`):e({channel:S,v:1,type:"open-walkthrough",id:n(),payload:{base:i}})}});var at=2e3;var So=["file","directory","other","missing"],it=e=>!!(e&&"sessionId"in e),ct=e=>!!(e&&"sent"in e&&!("sessionId"in e));var Ce=500,Ue=32e3,fo=16e3,mo=128,Ao=200,ho=2e3,Oo=16e3,Ro=80,bo=200,go=16e3;var Io=2e3;var dt=2e4,Ne=1024,Le=2e6;var Pe=64e3,we=8e3,lt=4e3;var ut=96e4,sn=60*6e4;var xo=999,vo=1e4,Se=500,ko=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],Mo=["stopped","starting","ready","failed"],an=new Set(ko),yo=e=>an.has(e),Co=e=>e&&yo(e)?e:"HOST_REJECTED",re=e=>e===void 0?!1:e===null||e===!0||e===!1||String(e)===e?!0:Number(e)===e?Number.isFinite(e):Array.isArray(e)?e.every(re):Object(e)===e?Object.values(e).every(re):!1,Uo=e=>re(e)&&JSON.stringify(e).length<=go,To=e=>e?.trim().slice(0,bo)??"",se=e=>{let n=e.id.trim().slice(0,mo),s=e.title.trim().slice(0,Ao),a=e.url.trim().slice(0,ho),i=e.text?.trim().slice(0,Oo),d=e.author?.trim().slice(0,Ro),A=e.kind==="pull"?"pull":"issue",h={providerId:e.providerId.trim(),id:n,title:s||n,url:a,kind:A};if(i&&(h.text=i),d&&(h.author=d),A==="pull"){let $=To(e.branches?.head),H=To(e.branches?.base);$&&H&&(h.branches={head:$,base:H})}return Uo(e.data)&&(h.data=e.data),h},pt=e=>{let n=se(e);return e.projectId&&(n.projectId=e.projectId),e.navigation&&(n.navigation=e.navigation),e.worktree&&(n.worktree=e.worktree),n},_t=e=>{let n={text:e.text.trim().slice(0,fo)};return e.send&&(n.send=!0),n},Et=e=>e===null||!Number.isFinite(e)?null:Math.min(xo,Math.max(0,Math.round(e))),Tt=e=>Number.isFinite(e)?Math.min(vo,Math.max(0,Math.ceil(e))):0;var ae=e=>e.length>0&&e.length<=Ne&&!e.includes("\0")&&!e.includes("\\");var De=e=>!e.startsWith("/")||e.includes("\0")||e.includes("\\")||e.includes("://")||e.length>Io?!1:!e.split("/").some(s=>s==="."||s===".."),cn=new Set(Mo),St=e=>!!(e&&"status"in e&&cn.has(String(e.status))&&!("body"in e)),Ge=e=>!!(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),ft=e=>!!(e&&"content"in e&&String(e.content)===e.content),mt=e=>!!(e&&"written"in e&&e.written===!0),At=e=>!!(e&&"entries"in e&&Array.isArray(e.entries)),dn=new Set(So),ht=e=>!!(e&&"kind"in e&&"size"in e&&dn.has(String(e.kind))&&Number.isFinite(e.size)),Ot=e=>!!(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),ln=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","service-event","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late","microphone-audio","microphone-ended"]),un=e=>Object(e)===e?e:null,st=e=>String(e)===e&&e.length>0,pn=e=>{if(!st(e.id))return null;if(e.ok===!0){let n={channel:S,v:1,type:"result",id:e.id,ok:!0};return Object(e.payload)===e.payload&&(n.payload=e.payload),n}return e.ok===!1&&st(e.error)?{channel:S,v:1,type:"result",id:e.id,ok:!1,error:e.error,code:Co(st(e.code)?e.code:void 0)}:null},Rt=e=>{let n=un(e);return!n||n.channel!==S||n.v!==1?null:n.type==="result"?pn(n):!ln.has(String(n.type))||Object(n.payload)!==n.payload?null:n};var No=e=>"key"in e&&"metaKey"in e&&"ctrlKey"in e,_n=e=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s",p=class extends Error{constructor(s,a){super(a);Me(this,"code");this.name="HostRequestError",this.code=s}},Lo=()=>Promise.reject(new p("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),$e=()=>Promise.reject(new p("BAD_PATH",`File path must be 1 to ${Ne} characters without NUL or backslash.`)),He=e=>{if(e!==void 0){if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new p("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0}},T=e=>(e.value+=1,`oc-${e.value}`),vt=(e={})=>{let n=e.target??("window"in globalThis?window:null);if(!n)throw new p("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let s=e.acceptSource??(t=>t===n.parent),a=e.requestTimeoutMs??dt,i=new Set,d=new Set,A=new Set,h=new Set,$=new Set,H=new Set,q=new Set,he=new Set,Oe=new Set,Re=new Set,be=new Set,Z=new Set,je=[],le=null,ue=null,ge=new Set,Ie=new Set,pe=null,_e=null,ze=!1,ee=new Map,te=new Map,oe=new Map,B=!1,E={value:0},_=null,W=null,Ee=!1,Te=!1,Ht=null,X=null,Xt=t=>t?{sessionId:t.id,phase:t.busy?"started":"completed"}:null,P=t=>{n.parent.postMessage(t,"*")},Vt=()=>{B||n.parent===n||Z.size===0||_?.features?.lateGenerateResults!==!0||P({channel:S,v:1,type:"generate-late-listen"})},b=(t,o)=>{for(let u of t)try{u(o)}catch(l){console.error(l)}},Ft=t=>{if(!(t instanceof MessageEvent)||!s(t.source))return;let o=Rt(t.data);if(!o)return;if(o.type==="workspace"){let l=te.get(o.payload.subscriptionId);l&&b([l],o.payload.snapshot);return}if(o.type==="shells"){let l=oe.get(o.payload.subscriptionId);l&&b([l],o.payload.snapshot);return}if(o.type==="microphone-audio"){X?.queue.push(o.payload.samples);return}if(o.type==="microphone-ended"){let l=X;if(!l)return;X=null,l.release(),b(l.endedListeners,o.payload.reason);return}if(o.type==="ready"){_=o.payload,W=Xt(o.payload.session),b(i,o.payload),b(d,o.payload.directory),b(A,o.payload.session),W&&b(h,W),b($,o.payload.connection),b(H,o.payload.settings),b(q,o.payload.item),o.payload.block&&b(he,o.payload.block),Vt();return}if(o.type==="service-event"){b(Oe,o.payload);return}if(o.type==="generate-late"){Z.size===0?je.push(o.payload):b(Z,o.payload);return}if(o.type==="directory"){_&&(_={..._,directory:o.payload.directory}),b(d,o.payload.directory);return}if(o.type==="session"){_&&(_={..._,session:o.payload.session}),o.payload.session?W?.sessionId!==o.payload.session.id&&(W=Xt(o.payload.session)):W=null,b(A,o.payload.session);return}if(o.type==="session-lifecycle"){W=o.payload,b(h,o.payload);return}if(o.type==="connection"){_&&(_={..._,connection:o.payload.connection}),b($,o.payload.connection);return}if(o.type==="settings"){_&&(_={..._,settings:o.payload.settings}),b(H,o.payload.settings);return}if(o.type==="item"){_&&(_={..._,item:o.payload.item}),b(q,o.payload.item);return}if(o.type==="status-control-event"){b(Re,o.payload);return}if(o.type==="popover-closed"){b(be,o.payload);return}if(o.type==="action"){let l=R=>{B||P({channel:S,v:1,type:"action-result",id:o.id,payload:R})},O=ue;if(!O){l({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>O(o.payload)).then(()=>l({ok:!0}),R=>{let g=(R instanceof Error?R.message:String(R)).trim();l({ok:!1,error:(g||"Action failed.").slice(0,Se)})});return}if(o.type==="file-open"){let l=o.payload;if(_e&&io(_e,l))return;_e=l,b(ge,o.payload);return}if(o.type==="file-saved"){b(Ie,o.payload.version);return}if(o.type==="file-snapshot"){let l=g=>{B||P({channel:S,v:1,type:"file-snapshot-result",id:o.id,payload:g})},O=g=>l({error:(g.trim()||"Could not read the edited file.").slice(0,Se)}),R=pe;if(!R){O("This extension does not edit files.");return}Promise.resolve().then(()=>R(o.payload.purpose)).then(g=>{if(tt(g)>2e7){O(`The file is over ${2e7} ${"bytes"in g?"bytes":"characters"}.`);return}if(g.version.length>256){O(`The snapshot version is over ${256} characters.`);return}l({snapshot:"bytes"in g?{bytes:g.bytes,version:g.version}:{content:g.content,version:g.version}})},g=>O(g instanceof Error?g.message:String(g)));return}if(o.type==="resolve"){let l=R=>{P({channel:S,v:1,type:"resolve-result",id:o.id,payload:R})},O=le;if(!O){l({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>O(o.payload)).then(R=>l({item:R?se(R):null}),R=>{let g=(R instanceof Error?R.message:String(R)).trim();l({error:(g||"Command failed.").slice(0,Se)})});return}let u=ee.get(o.id);if(u){if(clearTimeout(u.timer),ee.delete(o.id),o.ok){u.resolve(o.payload);return}u.reject(new p(o.code,o.error))}};n.addEventListener("message",Ft),P({channel:S,v:1,type:"hello"});let U=(t,o=a)=>B||n.parent===n?Promise.reject(new p("HOST_UNAVAILABLE","No host frame. This page is not in an iframe.")):new Promise((u,l)=>{let O=setTimeout(()=>{ee.delete(t.id),l(new p("HOST_TIMEOUT","Host did not answer in time."))},o);ee.set(t.id,{resolve:u,reject:l,timer:O}),P(t)}),y=t=>U(t).then(()=>{}),v={channel:S,v:1},Je=t=>{!B&&n.parent!==n&&P(t)},Bt=()=>Je({...v,type:"file-save"}),qe=()=>{!B&&n.parent!==n&&P({...v,type:"microphone-close",id:T(E)})},Qo=async()=>{if(X)throw new p("HOST_REJECTED","The microphone is already open in this frame.");if(_?.features?.microphone!==!0)throw new p("UNSUPPORTED","This OpenChamber cannot share the microphone with extensions.");let t=globalThis.AudioContext;if(typeof t!="function")throw new p("UNSUPPORTED","This frame has no Web Audio.");let o=new t;if(o.sampleRate<8e3||o.sampleRate>192e3)throw o.close().catch(()=>{}),new p("UNSUPPORTED",`Audio at ${o.sampleRate} Hz is not supported.`);let u=o.state==="suspended"?o.resume().catch(()=>{}):void 0,l=Zt(Math.round(o.sampleRate/4)),O=o.createScriptProcessor(1024,1,1);O.onaudioprocess=F=>l.pull(F.outputBuffer.getChannelData(0));let R=o.createMediaStreamDestination();O.connect(R);let g=new Set,ne={queue:l,endedListeners:g,release:()=>{O.onaudioprocess=null,O.disconnect(),l.clear();for(let F of R.stream.getTracks())F.stop();o.close().catch(()=>{})}};X=ne;try{let F=await U({...v,type:"microphone-open",id:T(E),payload:{sampleRate:o.sampleRate}},12e4);if(!F||!("opened"in F)||F.opened!==!0)throw new p("HOST_REJECTED","Host did not open the microphone.");if(await u,X!==ne)throw new p("DISCONNECTED","The microphone closed while it was opening.")}catch(F){throw X===ne&&(X=null),ne.release(),qe(),F}return{stream:R.stream,close:()=>{X===ne&&(X=null,ne.release(),qe())},onEnded:F=>(g.add(F),()=>{g.delete(F)})}},Kt=t=>{!No(t)||!_n(t)||(t.preventDefault(),Bt())},Wt=t=>{!No(t)||t.key!=="Escape"||_?.surface!=="popover"||!_.popover||(t.preventDefault(),qt(_.popover.id,"escape").catch(()=>{}))},xe=()=>{let t=_?.surface==="popover"?_.popover:void 0;if(!t)return;let o=Ee||Te;Ht!==o&&(Ht=o,Yt(t.id,o).catch(()=>{}))},ve=()=>{_?.surface!=="popover"||Ee||(Ee=!0,xe())},jt=t=>{_?.surface!=="popover"||t.relatedTarget!==null||!Ee||(Ee=!1,xe())},zt=()=>{_?.surface!=="popover"||Te||(Te=!0,xe())},Jt=()=>{_?.surface!=="popover"||!Te||(Te=!1,xe())},K=(t,o=1024)=>{if(!t.trim()||t.length>o)throw new p("HOST_REJECTED",`Identity must contain 1 to ${o} characters.`)},Ye=async t=>{t.kind!=="projects"&&K(t.projectId);let o=await U({...v,type:"workspace-read",id:T(E),payload:t});if(!o||!("kind"in o)||!("state"in o)||o.kind!==t.kind)throw new p("HOST_REJECTED","Host did not return workspace data.");return o},Qe=async(t,o)=>{t.kind!=="projects"&&K(t.projectId);let u=T(E);te.set(u,o);try{await y({...v,type:"workspace-subscribe",id:T(E),payload:{subscriptionId:u,query:t}})}catch(l){throw te.delete(u),B||P({...v,type:"workspace-unsubscribe",id:T(E),payload:{subscriptionId:u}}),l}return()=>{!te.delete(u)||B||P({...v,type:"workspace-unsubscribe",id:T(E),payload:{subscriptionId:u}})}},Zo=async(t,o)=>{t.kind==="session"&&K(t.sessionId),t.kind==="project"&&K(t.projectId);let u=T(E);oe.set(u,o);try{await y({...v,type:"shells-subscribe",id:T(E),payload:{subscriptionId:u,scope:t}})}catch(l){throw oe.delete(u),B||P({...v,type:"shells-unsubscribe",id:T(E),payload:{subscriptionId:u}}),l}return()=>{!oe.delete(u)||B||P({...v,type:"shells-unsubscribe",id:T(E),payload:{subscriptionId:u}})}},ke=async t=>{if("key"in t&&(t.key.length===0||t.key.length>128))throw new p("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(t.op==="set"&&!re(t.value))throw new p("HOST_REJECTED","Storage values must be JSON.");if(t.op==="set"&&new TextEncoder().encode(JSON.stringify(t.value)).length>65536)throw new p("HOST_REJECTED","Storage value exceeds 64 KiB.");if(t.scope==="device"&&_?.features?.deviceStorage!==!0)throw new p("UNSUPPORTED","This host does not support device storage.");let o=await U({...v,type:"storage",id:T(E),payload:t});if(!o||!("storage"in o)||o.op!==t.op)throw new p("HOST_REJECTED","Host did not return storage data.");return o},qt=(t,o)=>_?.features?.popovers!==!0&&!(_?.surface==="popover"&&_.popover?.id===t)?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):y({...v,type:"popover-close",id:T(E),payload:o?{id:t,reason:o}:{id:t}}),Yt=(t,o)=>_?.features?.popovers!==!0&&!(_?.surface==="popover"&&_.popover?.id===t)?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):y({...v,type:"popover-anchor",id:T(E),payload:{id:t,active:o}});return n.addEventListener("keydown",Wt,!0),n.addEventListener("pointerover",ve),n.addEventListener("pointermove",ve),n.addEventListener("pointerout",jt),n.addEventListener("focus",zt),n.addEventListener("blur",Jt),{onAction:t=>(ue=t,()=>{ue===t&&(ue=null)}),listProjects:async()=>{let t=await Ye({kind:"projects"});if(t.kind!=="projects")throw new p("HOST_REJECTED","Expected projects.");return t},listWorktrees:async t=>{let o=await Ye({kind:"worktrees",projectId:t});if(o.kind!=="worktrees")throw new p("HOST_REJECTED","Expected worktrees.");return o},listSessions:async t=>{let o=await Ye({kind:"sessions",projectId:t});if(o.kind!=="sessions")throw new p("HOST_REJECTED","Expected sessions.");return o},onProjects:t=>Qe({kind:"projects"},o=>{o.kind==="projects"&&t(o)}),onWorktrees:(t,o)=>Qe({kind:"worktrees",projectId:t},u=>{u.kind==="worktrees"&&o(u)}),onSessions:(t,o)=>Qe({kind:"sessions",projectId:t},u=>{u.kind==="sessions"&&o(u)}),onRunningShells:(t,o)=>Zo(t,o),readShellOutput:async(t,o)=>{K(t,128);let u=o?.cursor;if(u!==void 0&&(!Number.isInteger(u)||u<0))throw new p("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let l=o?.tailBytes;if(l!==void 0&&(!Number.isInteger(l)||l<1||l>65536))throw new p("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${65536}.`);let R=await U({...v,type:"shell-output",id:T(E),payload:{shellId:t,cursor:u,tailBytes:l}});if(!R||typeof R.output!="string"||!Number.isFinite(R.cursor))throw new p("HOST_REJECTED","Host did not return shell output.");return R},stopShell:async t=>{if(K(t,128),(await U({...v,type:"shell-stop",id:T(E),payload:{shellId:t}}))?.stopped!==!0)throw new p("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async t=>{K(t),await y({...v,type:"open-session",id:T(E),payload:{sessionId:t}})},storage:{get:async(t,o)=>{let u=He(o),l={op:"get",key:t};u&&(l.scope=u);let O=await ke(l);return O.op==="get"&&O.found?O.value:void 0},set:async(t,o,u)=>{let l=He(u),O={op:"set",key:t,value:o};l&&(O.scope=l),await ke(O)},delete:async(t,o)=>{let u=He(o),l={op:"delete",key:t};u&&(l.scope=u),await ke(l)},keys:async t=>{let o=He(t),u={op:"keys"};o&&(u.scope=o);let l=await ke(u);if(l.op!=="keys")throw new p("HOST_REJECTED","Expected storage keys.");return l.keys}},onReady:t=>(i.add(t),_&&t(_),()=>{i.delete(t)}),onDirectory:t=>(d.add(t),_&&t(_.directory),()=>{d.delete(t)}),onSession:t=>(A.add(t),_&&t(_.session),()=>{A.delete(t)}),onSessionLifecycle:t=>(h.add(t),W&&t(W),()=>{h.delete(t)}),onConnection:t=>($.add(t),_&&t(_.connection),()=>{$.delete(t)}),onSettings:t=>(H.add(t),_&&t(_.settings),()=>{H.delete(t)}),onItem:t=>(q.add(t),_&&t(_.item),()=>{q.delete(t)}),onBlock:t=>(he.add(t),_?.block&&t(_.block),()=>{he.delete(t)}),onServiceEvent:t=>(Oe.add(t),()=>{Oe.delete(t)}),onStatusControl:t=>(Re.add(t),()=>{Re.delete(t)}),onPopoverClosed:t=>(be.add(t),()=>{be.delete(t)}),setStatusControls:t=>_?.features?.statusControls!==!0?Promise.reject(new p("UNSUPPORTED","This host does not support status controls.")):ro(t)?y({...v,type:"status-controls",id:T(E),payload:{controls:t}}):Promise.reject(new p("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options.")),openPopover:t=>_?.features?.popovers!==!0?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):nt(t)?y({...v,type:"popover-open",id:T(E),payload:t}):Promise.reject(new p("HOST_REJECTED","Popover requests need bounded geometry and JSON data.")),closePopover:qt,setPopoverAnchorActive:Yt,onResolve:t=>(le=t,()=>{le===t&&(le=null)}),toast:t=>{let o=t.message.trim();return!o||o.length>Ce?Promise.reject(new p("HOST_REJECTED",`Toast message must contain 1 to ${Ce} characters.`)):t.copy&&t.copy!==!0&&(!t.copy.text.length||t.copy.text.length>Ue)?Promise.reject(new p("HOST_REJECTED",`Toast copy text must contain 1 to ${Ue} characters.`)):y({channel:S,v:1,type:"toast",id:T(E),payload:{...t,message:o}})},openUrl:t=>y({channel:S,v:1,type:"open-url",id:T(E),payload:{url:t}}),...Eo(y,()=>T(E),t=>Promise.reject(new p("HOST_REJECTED",t))),answerBlock:t=>y({channel:S,v:1,type:"block-answer",id:T(E),payload:{text:t.trim().slice(0,at)}}),openSurface:t=>y({channel:S,v:1,type:"open-surface",id:T(E),payload:{surfaceId:t}}),writeClipboard:t=>y({channel:S,v:1,type:"clipboard-write",id:T(E),payload:{text:t}}),compose:t=>y({channel:S,v:1,type:"compose",id:T(E),payload:t}),attach:t=>y({channel:S,v:1,type:"attach",id:T(E),payload:se(t)}),startSession:async t=>{t.projectId!==void 0&&K(t.projectId);let o=t.worktree;o&&o!==!0&&(o.kind==="existing"?K(o.directory):(o.name!==void 0&&K(o.name,200),o.baseBranch!==void 0&&K(o.baseBranch,200)));let u=await U({channel:S,v:1,type:"start-session",id:T(E),payload:pt(t)},e.requestTimeoutMs??18e4);if(!it(u))throw new p("HOST_REJECTED","Host did not return a session.");return u},prompt:t=>U({channel:S,v:1,type:"prompt",id:T(E),payload:_t(t)}).then(o=>{if(!ct(o))throw new p("HOST_REJECTED","Host did not return a prompt result.");return o}),sessionLink:t=>y({channel:S,v:1,type:"session-link",id:T(E),payload:se(t)}),close:()=>y({channel:S,v:1,type:"close",id:T(E)}),oauthStart:()=>y({channel:S,v:1,type:"oauth-start",id:T(E)}),oauthDisconnect:()=>y({channel:S,v:1,type:"oauth-disconnect",id:T(E)}),request:t=>(De(t.path)?U({channel:S,v:1,type:"request",id:T(E),payload:t}):Lo()).then(o=>{if(!Ge(o))throw new p("HOST_REJECTED","Host request result was empty.");return o}),serviceRequest:t=>(De(t.path)?U({channel:S,v:1,type:"service-request",id:T(E),payload:t}):Lo()).then(o=>{if(!Ge(o))throw new p("HOST_REJECTED","Host service request result was empty.");return o}),serviceStatus:()=>U({channel:S,v:1,type:"service-status",id:T(E)}).then(t=>{if(!St(t))throw new p("HOST_REJECTED","Host did not return service status.");return t}),readFile:t=>(ae(t)?U({channel:S,v:1,type:"file-read",id:T(E),payload:{path:t}}):$e()).then(o=>{if(!ft(o))throw new p("HOST_REJECTED","Host did not return file content.");return o}),writeFile:(t,o)=>ae(t)?o.length>Le?Promise.reject(new p("FILE_TOO_LARGE",`Content is over ${Le} characters.`)):U({channel:S,v:1,type:"file-write",id:T(E),payload:{path:t,content:o}}).then(u=>{if(!mt(u))throw new p("HOST_REJECTED","Host did not confirm the write.");return u}):$e(),listDir:t=>(ae(t)?U({channel:S,v:1,type:"file-list",id:T(E),payload:{path:t}}):$e()).then(o=>{if(!At(o))throw new p("HOST_REJECTED","Host did not return directory entries.");return o}),stat:t=>(ae(t)?U({channel:S,v:1,type:"file-stat",id:T(E),payload:{path:t}}):$e()).then(o=>{if(!ht(o))throw new p("HOST_REJECTED","Host did not return file status.");return o}),generate:t=>{let o=t.prompt.trim(),u=t.system?.trim();if(o.length===0||o.length>Pe)return Promise.reject(new p("HOST_REJECTED",`Prompt must be 1 to ${Pe} characters.`));if(u!==void 0&&(u.length===0||u.length>we))return Promise.reject(new p("HOST_REJECTED",`System prompt must be 1 to ${we} characters.`));let l=t.maxOutputTokens===void 0?void 0:Math.min(lt,Math.max(1,Math.floor(t.maxOutputTokens)));if(l!==void 0&&!Number.isFinite(l))return Promise.reject(new p("HOST_REJECTED","maxOutputTokens must be a number."));let O={prompt:o};return u!==void 0&&(O.system=u),l!==void 0&&(O.maxOutputTokens=l),U({channel:S,v:1,type:"generate",id:T(E),payload:O},e.requestTimeoutMs??ut).then(R=>{if(!Ot(R))throw new p("HOST_REJECTED","Host did not return generated text.");return R})},onLateGenerateResult:t=>{Z.add(t);for(let o of je.splice(0))b([t],o);return Vt(),()=>{Z.delete(t)}},openMicrophone:Qo,setBadge:t=>y({channel:S,v:1,type:"badge",id:T(E),payload:{count:Et(t)}}),setHeight:t=>y({channel:S,v:1,type:"resize",id:T(E),payload:{height:Tt(t)}}),onFileOpen:t=>(ge.add(t),ze||(ze=!0,n.addEventListener("keydown",Kt,!0)),_e&&t(_e),()=>{ge.delete(t)}),onFileSnapshot:t=>(pe=t,()=>{pe===t&&(pe=null)}),onFileSaved:t=>(Ie.add(t),()=>{Ie.delete(t)}),reportFileChange:t=>Je({...v,type:"file-change",payload:{dirty:t.dirty,edited:t.edited}}),requestFileSave:Bt,reportFileUnsupported:()=>Je({...v,type:"file-unsupported"}),dispose:()=>{for(let t of te.keys())P({...v,type:"workspace-unsubscribe",id:T(E),payload:{subscriptionId:t}});te.clear();for(let t of oe.keys())P({...v,type:"shells-unsubscribe",id:T(E),payload:{subscriptionId:t}});oe.clear(),X&&(qe(),X.release(),X=null),B=!0,le=null,ue=null,pe=null,ge.clear(),Ie.clear(),ze&&n.removeEventListener("keydown",Kt,!0),n.removeEventListener("message",Ft),n.removeEventListener("keydown",Wt,!0),n.removeEventListener("pointerover",ve),n.removeEventListener("pointermove",ve),n.removeEventListener("pointerout",jt),n.removeEventListener("focus",zt),n.removeEventListener("blur",Jt);for(let t of ee.values())clearTimeout(t.timer),t.reject(new p("HOST_UNAVAILABLE","Host client was disposed."));ee.clear(),i.clear(),d.clear(),A.clear(),h.clear(),$.clear(),H.clear(),q.clear(),he.clear(),Oe.clear(),Re.clear(),be.clear(),Z.clear(),je.length=0}}};var Ho=["browser.open","browser.snapshot","browser.click","browser.type","browser.select","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var Or=new Set(Ho);var En=10*6e4;var Tn=10*6e4;var Sn=10*6e4;var fn=10*6e4;var Xo=["none","agent","user"];var gr=new Set(Xo);var mn=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],An=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],Vo=(e,n)=>{n.style.colorScheme=e.mode;for(let[s,a]of mn)n.style.setProperty(s,e.tokens[a]);for(let[s,a,i]of An){let d=e.tokens[i]??"";n.style.setProperty(s,d),n.style.setProperty(a,d)}n.style.setProperty("font-family",e.tokens.font),n.style.setProperty("font-size",e.tokens.fontSize??"0.875rem"),n.style.setProperty("line-height","1.45"),n.style.setProperty("color",e.tokens.foreground)},kt=(e,n)=>{Vo(e.theme,n),n.dataset&&(n.dataset.ocSurface=e.surface,n.dataset.ocTheme=e.theme.mode)};var hn={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},I=(e,n)=>`var(--${e}, var(--oc-${hn[e]}, ${n}))`,z=I("surface-background","transparent"),Ve=I("surface-elevated","transparent"),ie=I("surface-elevated-foreground","inherit"),V=I("surface-foreground","inherit"),k=I("surface-muted-foreground","gray"),On=I("surface-muted","transparent"),Y=I("interactive-border","currentColor"),w=I("interactive-hover","transparent"),Q=I("interactive-active","transparent"),Mt=I("interactive-selection","transparent"),yt=I("interactive-selection-foreground","inherit"),j=I("primary","currentColor"),Ct=I("primary-text","inherit"),Ut=I("error-text","inherit"),Rn=I("font-sans","inherit"),Nt=I("font-mono","monospace"),Wo=I("radius","9px"),Lt=`calc(${Wo} - 2px)`,Fo=`calc(${Wo} - 4px)`,M=(e,n,s="transparent")=>`color-mix(in srgb, ${e} ${n}%, ${s})`,Bo=`background-image: linear-gradient(${w}, ${w});`,Pt=(e,n="0.5px")=>`box-shadow: inset 0 0 0 ${n} ${e}, var(--oc-sdk-field-lift);`,wt="border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);",Ko="box-shadow: var(--oc-sdk-lit);",Dt=`inset 0 0.5px 0 0 ${M(V,8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`,bn=`
:root {
  --oc-sdk-edge: ${M(V,16)};
  --oc-sdk-field-bg: ${Ve};
  --oc-sdk-raised-bg: ${z};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${M(V,14)};
  --oc-sdk-field-bg: ${M(z,50,Ve)};
  --oc-sdk-raised-bg: ${Ve};
  --oc-sdk-field-lift: ${Dt};
  --oc-sdk-raised-lift: ${Dt};
  --oc-sdk-lit: ${Dt};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`,Xe=e=>{let n=I(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${n}; --oc-sdk-tone-text: ${I(`${e}-text`,"inherit")}; }`},c=e=>`calc(${e}rem / 14)`,gn=`
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: ${c(8)}; height: ${c(32)}; padding: 0 ${c(12)}; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: ${c(6)}; height: ${c(28)}; padding: 0 ${c(10)}; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: ${c(4)}; height: ${c(24)}; padding: 0 ${c(8)}; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: ${c(14)}; height: ${c(14)}; }

.oc-sdk-field { display: flex; flex-direction: column; gap: ${c(4)}; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: ${c(32)}; padding: 0 ${c(10)}; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: ${c(8)} ${c(10)}; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: ${c(34)}; padding-right: ${c(34)}; }
.oc-sdk-search-icon { position: absolute; left: ${c(11)}; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: ${c(6)}; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: ${c(24)}; height: ${c(24)}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: ${c(4)}; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: ${c(6)}; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: ${c(28)}; padding: 0 ${c(10)}; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: ${c(2)}; min-width: ${c(160)}; max-width: calc(100vw - ${c(16)}); max-height: min(${c(320)}, calc(100vh - ${c(16)})); overflow: auto; padding: ${c(4)}; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: ${c(2)} ${c(2)} ${c(4)}; }
.oc-sdk-popup-search .oc-sdk-input { height: ${c(28)}; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: ${c(8)}; width: 100%; padding: ${c(6)} ${c(8)}; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: ${c(14)}; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: ${c(8)}; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: ${c(8)}; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: ${c(14)}; height: ${c(14)}; margin-top: ${c(3)}; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: ${c(36)}; height: ${c(20)}; --oc-sdk-thumb-travel: ${c(16)}; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: ${c(2)}; left: ${c(2)}; width: ${c(16)}; height: ${c(16)}; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: ${c(2)}; padding: ${c(2)}; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: ${c(6)}; height: ${c(28)}; padding: 0 ${c(10)}; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: ${c(1)} ${c(6)}; font-size: ${c(11)}; font-weight: 500; line-height: ${c(16)}; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: ${c(8)}; width: 100%; padding: ${c(6)} ${c(8)}; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: ${c(64)}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: ${c(16)} ${c(8)}; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${c(4)}; padding: ${c(40)} ${c(16)}; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: ${c(12)}; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: ${c(8)}; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: ${c(16)}; height: ${c(16)}; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: ${c(12)}; height: ${c(12)}; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: ${c(12)}; padding: ${c(8)} ${c(12)}; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: ${c(2)}; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: ${c(8)}; width: 100%; margin: ${c(8)} 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: ${c(4)} 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: ${c(4)}; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: ${c(6)}; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }
.oc-sdk-progress-value { display: inline-flex; align-items: center; gap: ${c(2)}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { font-weight: 600; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: ${c(8)} 0; }

/* Under a finger the controls reach the app's touch sizes: rows and options 44px like its sheets, every other
   control at least 36px. Inputs keep 16px text, below which iOS zooms the page on focus. */
@media (pointer: coarse) {
  .oc-sdk-btn, .oc-sdk-input { height: ${c(40)}; }
  .oc-sdk-btn[data-size="sm"], .oc-sdk-btn[data-size="xs"], .oc-sdk-trigger, .oc-sdk-tab, .oc-sdk-popup-search .oc-sdk-input { height: ${c(36)}; }
  .oc-sdk-input, .oc-sdk-popup-search .oc-sdk-input { font-size: max(16px, 0.875rem); }
  .oc-sdk-search-clear { width: ${c(36)}; height: ${c(36)}; right: 0; }
  .oc-sdk-row, .oc-sdk-option { min-height: ${c(44)}; }
  .oc-sdk-check { min-height: ${c(36)}; padding: ${c(8)} 0; }
}
`,jo=`${bn}
.oc-sdk { color: ${V}; font-family: ${Rn}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${Bo} }
.oc-sdk-mono { font-family: ${Nt}; }
.oc-sdk-muted { color: ${k}; }
${Xe("success")}${Xe("warning")}${Xe("error")}${Xe("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${j}; --oc-sdk-tone-text: ${Ct}; }

.oc-sdk-btn { border-radius: ${Lt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${Fo}; }
.oc-sdk-btn[data-variant="default"] { color: ${Ct}; background: ${M(j,10,z)}; border-color: ${M(j,12)}; ${Ko} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${M(j,16,z)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${M(j,22,z)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${On}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${Q}, ${Q}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${ie}; ${wt} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${Q}, ${Q}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${w}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${Q}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${I("status-error","red")}; color: ${Ut}; background: ${M("var(--oc-sdk-tone)",7,z)}; border-color: ${M("var(--oc-sdk-tone)",12)}; ${Ko} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${M("var(--oc-sdk-tone)",9,z)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${M("var(--oc-sdk-tone)",11,z)}; box-shadow: none; }

.oc-sdk-field-note { color: ${k}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${Ut}; }
.oc-sdk-input { border-radius: ${Lt}; background: var(--oc-sdk-field-bg); color: ${ie}; ${Pt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${k}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${Pt(M(V,26),"1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${Pt(I("status-error","red"),"1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${Nt}; }

.oc-sdk-search-icon { color: ${k}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${j}; }
.oc-sdk-search-clear { border-radius: ${Fo}; color: ${k}; }
.oc-sdk-search-clear:hover { background: ${w}; color: ${V}; }

.oc-sdk-trigger { border-radius: ${Lt}; background: var(--oc-sdk-raised-bg); color: ${ie}; ${wt} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${Q}, ${Q}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${k}; }
.oc-sdk-trigger-chevron { color: ${k}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${ie}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${Ve}; background-clip: padding-box; color: ${ie}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${w}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${Mt}; color: ${yt}; }
.oc-sdk-option-check { color: ${V}; }
.oc-sdk-option[data-destructive="true"] { color: ${Ut}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${M(I("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${k}; }
.oc-sdk-popup-empty { color: ${k}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${Y}; border-radius: 4px; color: ${V}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${M(V,60,Y)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${Y}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${z}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${j}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(var(--oc-sdk-thumb-travel, 16px)); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${Bo} }
.oc-sdk-check-desc { color: ${k}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${M(V,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${k}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${V}; }
.oc-sdk-tab[aria-selected="true"] { color: ${yt}; background: ${Mt}; border-color: ${Y}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${ie}; background: var(--oc-sdk-raised-bg); ${wt} }
.oc-sdk-tab-count { color: ${k}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${M(V,6)}; color: ${k}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${M("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${w}; }
.oc-sdk-row[aria-selected="true"] { background: ${Mt}; color: ${yt}; }
.oc-sdk-row-lead { font-family: ${Nt}; color: ${k}; }
.oc-sdk-row-sub { color: ${k}; }
.oc-sdk-row-meta { color: ${k}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${k}; }

.oc-sdk-empty-body { color: ${k}; }

.oc-sdk-spinner { color: ${k}; }
.oc-sdk-spinner-ring { border-color: ${Y}; border-top-color: ${j}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${M("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${k}; }

.oc-sdk-separator { color: ${k}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${M(Y,40)}; }

.oc-sdk-progress-label { color: ${k}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${M(V,6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${j}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${I("status-success","currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${I("success-text","inherit")}; }

.oc-sdk-text a { color: ${Ct}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${M(Y,60)}; }
`,L=`
${Ze}
${gn}
${jo}`;var $t=[{id:"reasoning",label:"Raciocínio"},{id:"coding",label:"Python/SQL"},{id:"debugging",label:"Debug"},{id:"delphi",label:"Delphi"},{id:"csharp",label:"C#"},{id:"firebird",label:"Firebird"}],C=vt(),r={surface:"panel",tab:"ranking",sessionModelRaw:null,sessionNvidiaModel:null,backendUrl:"http://127.0.0.1:8765",backendOnline:!1,health:null,notice:"Conectando ao serviço local do ModelArena...",noticeError:!1,models:[],codingOnly:!0,search:"",selectedModels:[],selectedCategories:$t.map(e=>e.id),repeats:1,rankingCat:"",ranking:[],recommendation:null,frontier:null,activeJob:null,history:[],expandedRunId:null,expandedRunDetail:null,schedule:null,busy:!1},me=null;function Mn(e){if(!e)return null;let n=e.trim(),s=["console-nvidia/","nvidia/","nvidia-nim/"];for(let a of s)if(n.toLowerCase().startsWith(a))return n.slice(a.length);return null}function m(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function N(e,n,s){let a=await C.serviceRequest({method:e,path:n,body:s!==void 0?JSON.stringify(s):void 0}),i=null;try{i=a.body?JSON.parse(a.body):null}catch{i=a.body}if(a.status<200||a.status>=300){let d=i&&typeof i=="object"&&"detail"in i?String(i.detail):`Erro HTTP ${a.status}`,A=new Error(d);throw i&&typeof i=="object"&&"code"in i&&(A.code=String(i.code)),A}return i}async function Ae(){try{let e=await N("GET","/config");e.backendUrl&&(r.backendUrl=e.backendUrl)}catch{}try{let e=await N("GET","/arena/health");r.health=e,r.backendOnline=!0,r.noticeError=!1;let n=e.provider_ready??e.nvidia_configured;r.notice=n?e.active_provider_mode==="opencode"?`Pronto via ${e.active_provider_label||"OpenChamber (console-nvidia)"} — sem precisar de API key!`:`Backend conectado (${r.backendUrl}) · ${e.active_provider_label||"NVIDIA NIM"} pronta.`:"Backend conectado, mas nenhum provedor foi encontrado (verifique o OpenChamber ou configure NVIDIA_API_KEY).";let[s,a,i,d,A,h]=await Promise.all([N("GET",r.rankingCat?`/arena/ranking?category=${encodeURIComponent(r.rankingCat)}`:"/arena/ranking"),N("GET","/arena/recommendation"),N("GET","/arena/history?limit=40"),N("GET","/arena/benchmarks/jobs?limit=5"),N("GET","/arena/schedule"),N("GET","/arena/frontier-comparison").catch(()=>null)]);r.ranking=s.data||[],r.recommendation=a,r.frontier=h,r.history=i.data||[],r.schedule=A;let $=(d.data||[]).find(H=>H.status==="running"||H.status==="queued")||null;r.activeJob=$,de(),n&&r.models.length===0&&await Jo(!1)}catch(e){r.backendOnline=!1,r.noticeError=!0,r.notice=e instanceof Error?e.message:"Serviço local do ModelArena indisponível."}x()}async function Jo(e=!0){try{let n=await N("GET","/arena/models");r.models=n.data||[],r.sessionNvidiaModel&&!r.selectedModels.includes(r.sessionNvidiaModel)&&r.models.some(s=>s.id===r.sessionNvidiaModel)&&(r.selectedModels=[r.sessionNvidiaModel,...r.selectedModels]),e&&await C.toast({kind:"success",message:`${n.coding_total??r.models.length} modelos NVIDIA de código carregados.`})}catch(n){r.noticeError=!0,r.notice=n instanceof Error?n.message:"Erro ao listar modelos NVIDIA."}x()}function de(){let e=r.activeJob&&(r.activeJob.status==="running"||r.activeJob.status==="queued");e&&me===null?me=window.setInterval(()=>{qo()},1800):!e&&me!==null&&(window.clearInterval(me),me=null)}async function qo(){if(!r.activeJob){de();return}try{let e=await N("GET",`/arena/benchmarks/jobs/${r.activeJob.id}`);r.activeJob=e.job,e.job.status!=="running"&&e.job.status!=="queued"?(de(),await C.toast({kind:e.job.status==="completed"?"success":"info",message:`Model Arena: benchmark ${e.job.status} (${e.job.succeeded_steps}/${e.job.total_steps}).`}),await Ae()):x()}catch{de()}}async function zo(e){let n=e&&e.length?e:r.selectedModels;if(!n.length||!r.selectedCategories.length){await C.toast({kind:"error",message:"Selecione pelo menos um modelo e uma categoria."});return}r.busy=!0,x();try{let s=await N("POST","/arena/benchmarks/jobs",{models:n,categories:r.selectedCategories,repeats:r.repeats});r.activeJob=s.job,r.noticeError=!1,r.notice=`Benchmark iniciado (${s.job.total_steps} avaliações em background).`,de(),await C.toast({kind:"info",message:`Benchmark iniciado para ${n.length} modelo(s).`})}catch(s){r.noticeError=!0,r.notice=s instanceof Error?s.message:"Falha ao iniciar benchmark."}finally{r.busy=!1,x()}}async function yn(){if(r.activeJob)try{await N("POST",`/arena/benchmarks/jobs/${r.activeJob.id}/cancel`),await C.toast({kind:"info",message:"Cancelamento solicitado."}),await qo()}catch(e){r.noticeError=!0,r.notice=e instanceof Error?e.message:"Não foi possível cancelar o job.",x()}}async function Cn(e){if(r.expandedRunId===e){r.expandedRunId=null,r.expandedRunDetail=null,x();return}try{let n=await N("GET",`/arena/runs/${e}`);r.expandedRunId=e,r.expandedRunDetail=n}catch(n){r.noticeError=!0,r.notice=n instanceof Error?n.message:"Erro ao abrir detalhes da execução."}x()}async function Un(){let e=r.recommendation?.primary_coding_model;if(!e)return;let n=["Resultado atual do Model Arena (NVIDIA NIM):",`- Modelo principal recomendado: \`${e.openchamber_model_ref}\` (${e.composite_score}/100 composta · ${e.quality_score}/100 qualidade real · ${Math.round(e.avg_latency_ms)} ms).`,`- Motivo: ${e.rationale}`];await C.compose({text:n.join(`
`),mode:"append"}),await C.toast({kind:"success",message:"Resumo do ranking enviado para a caixa de chat."})}function Nn(){return`
    <div class="ma-card">
      <div class="ma-badge">Backend Local Offline</div>
      <strong>Inicie o serviço ModelArena para rodar benchmarks</strong>
      <p class="ma-subtitle">O painel do OpenChamber se conecta via serviço local autenticado a <code class="ma-mono">${m(r.backendUrl)}</code>.</p>
      <pre class="ma-code">.\\scripts\\start-modelarena.ps1</pre>
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="copy-cmd">Copiar comando</button>
        <button class="ma-btn" data-action="refresh">Tentar reconectar</button>
        <button class="ma-btn" data-action="goto-connection">Alterar URL</button>
      </div>
    </div>
  `}function Ln(){let n=r.recommendation?.primary_coding_model,s=n?`
      <div class="ma-card ma-hero">
        <div class="ma-badge">Modelo Principal Recomendado</div>
        <div class="ma-row">
          <strong class="ma-mono" style="font-size:14px">${m(n.model_id)}</strong>
          <span class="ma-score">${n.composite_score}<small style="font-size:10px;color:var(--ma-muted)">/100</small></span>
        </div>
        <div class="ma-subtitle" style="color:var(--ma-fg);opacity:.9">${m(n.rationale)}</div>
        <div class="ma-btn-row">
          <button class="ma-btn primary" data-action="copy-ref" data-ref="${m(n.openchamber_model_ref)}">Copiar ref OpenChamber</button>
          <button class="ma-btn" data-action="compose-rec">Enviar ao chat</button>
        </div>
      </div>
    `:`
      <div class="ma-card ma-hero">
        <div class="ma-badge">Pronto para Comparar</div>
        <strong>Descubra o melhor modelo NVIDIA para programar</strong>
        <div class="ma-subtitle">Vá na aba <b>Executar</b> e rode o benchmark real de código (Python sandbox, SQLite/Firebird, C# e Delphi).</div>
        <div class="ma-btn-row">
          <button class="ma-btn primary" data-action="goto-run">Selecionar modelos</button>
          ${r.sessionNvidiaModel?'<button class="ma-btn" data-action="bench-session">Testar modelo desta sessão</button>':""}
        </div>
      </div>
    `,a=[`<button class="ma-chip ${r.rankingCat?"":"selected"}" data-action="rank-cat" data-cat="">Geral</button>`,...$t.map(d=>`<button class="ma-chip ${r.rankingCat===d.id?"selected":""}" data-action="rank-cat" data-cat="${d.id}">${d.label}</button>`)].join(""),i=r.ranking.length?r.ranking.map((d,A)=>{let h=r.sessionNvidiaModel&&d.model_id===r.sessionNvidiaModel,$=Object.entries(d.category_scores||{}).map(([H,q])=>`${H}:${q}`).join(" · ");return`
            <div class="ma-rank-item">
              <div class="ma-place ${A===0?"gold":""}">${d.rank||A+1}</div>
              <div class="ma-rank-body">
                <div class="ma-row">
                  <strong class="ma-mono">${m(d.model_id)}</strong>
                  ${h?'<span class="ma-badge">Sessão atual</span>':""}
                </div>
                <div class="ma-bar"><i style="width:${Math.min(100,Math.max(0,d.composite_score))}%"></i></div>
                <div class="ma-meta">
                  <span>Qual.: <b>${d.quality_score}</b></span>
                  <span>Testes: <b>${d.execution_pass_rate!==null?`${d.execution_pass_rate}%`:"—"}</b></span>
                  <span>${Math.round(d.avg_latency_ms)} ms</span>
                  ${d.avg_tokens_per_second?`<span>${d.avg_tokens_per_second} tok/s</span>`:""}
                </div>
                ${$?`<div class="ma-subtitle" style="margin-top:3px">${m($)}</div>`:""}
              </div>
              <div class="ma-score">${d.composite_score}</div>
            </div>
          `}).join(""):'<p class="ma-subtitle">Nenhum resultado registrado ainda.</p>';return`
    ${s}
    <div class="ma-card">
      <div class="ma-row">
        <strong>Ranking NVIDIA NIM</strong>
        <button class="ma-btn" data-action="refresh">Atualizar</button>
      </div>
      <div class="ma-chips">${a}</div>
      <div>${i}</div>
    </div>
  `}function Pn(){let e=r.frontier;if(!e)return'<div class="ma-card"><p class="ma-subtitle">Atualize o backend para v1.2+ para ver o comparativo com modelos de ponta.</p></div>';let n=e.frontier_baselines.map(a=>`
      <div class="ma-rank-item">
        <div class="ma-rank-body">
          <div class="ma-row"><strong>${m(a.name)}</strong><span class="ma-subtitle">${m(a.family)}</span></div>
          <div class="ma-bar"><i style="width:${a.swe_bench_verified}%;background:#6366f1"></i></div>
        </div>
        <div class="ma-score" style="color:#818cf8">${a.swe_bench_verified}%</div>
      </div>`).join(""),s=e.nvidia_models.map(a=>{let i=a.swe_bench_verified!==null?`${a.swe_bench_estimated?"~":""}${a.swe_bench_verified}%`:"N/D",d=a.gap_vs_frontier_pp!==null?`${a.gap_vs_frontier_pp} pts`:"—",A=a.swe_bench_verified??10,h=a.project_risk==="baixo"?"#76b900":a.project_risk.startsWith("medio")?"#f59e0b":"#ef4444";return`
        <div class="ma-run-row" style="cursor:default">
          <div class="ma-row">
            <strong class="ma-mono" style="font-size:11px">${m(a.model_id)}</strong>
            <span class="ma-badge" style="border-color:${h};color:${h}">${m(a.risk_label)}</span>
          </div>
          ${a.swe_bench_verified!==null?`<div class="ma-bar"><i style="width:${A}%;background:${h}"></i></div>`:""}
          <div class="ma-meta">
            <span>SWE-bench: <b>${i}</b></span>
            <span>Gap topo: <b>${d}</b></span>
            ${a.local_composite_score!==null?`<span>Local: <b>${a.local_composite_score}/100</b></span>`:""}
          </div>
          <div class="ma-subtitle">${m(a.guidance)}</div>
        </div>
      `}).join("");return`
    <div class="ma-card">
      <div class="ma-badge">Referência Externa · ${m(e.metric_name)} (${m(e.updated_at)})</div>
      <div class="ma-subtitle">${m(e.methodology_note)}</div>
      <strong style="margin-top:4px">Modelos de Ponta (Fronteira)</strong>
      <div>${n}</div>
    </div>
    <div class="ma-card">
      <strong>Seus Modelos NVIDIA vs. Fronteira (${e.frontier_leader.score}%)</strong>
      ${s}
    </div>
  `}function wn(){let e=r.search.trim().toLowerCase(),n=r.models.filter(i=>!(r.codingOnly&&i.is_coding_candidate===!1||e&&!i.id.toLowerCase().includes(e)&&!(i.vendor||"").toLowerCase().includes(e))),s=n.length?n.slice(0,50).map(i=>{let d=r.selectedModels.includes(i.id);return`
            <label class="ma-model-opt ${d?"selected":""}">
              <input type="checkbox" data-action="toggle-model" data-model="${m(i.id)}" ${d?"checked":""} />
              <div style="min-width:0">
                <div class="ma-mono" style="font-size:11.5px;font-weight:600">${m(i.id)}</div>
                <div class="ma-subtitle">${m(i.vendor||"nvidia")}${i.tags?.length?` · ${m(i.tags.join(", "))}`:""}</div>
              </div>
            </label>
          `}).join(""):'<p class="ma-subtitle">Nenhum modelo carregado. Clique em "Atualizar lista" para listar os modelos NVIDIA do seu OpenChamber.</p>',a=$t.map(i=>`<button class="ma-chip ${r.selectedCategories.includes(i.id)?"selected":""}" data-action="toggle-cat" data-cat="${i.id}">${i.label}</button>`).join("");return`
    <div class="ma-card">
      <div class="ma-row">
        <strong>Selecionar Modelos (${r.selectedModels.length})</strong>
        <div class="ma-btn-row">
          <button class="ma-btn" data-action="load-models">Atualizar lista</button>
          <button class="ma-btn" data-action="select-top">Top 4</button>
        </div>
      </div>
      <input class="ma-input" id="ma-search" placeholder="Filtrar modelos (ex: glm, nemotron, qwen, deepseek)..." value="${m(r.search)}" />
      <label class="ma-subtitle" style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" id="ma-coding-only" ${r.codingOnly?"checked":""} />
        Mostrar apenas modelos de chat/programação
      </label>
      <div class="ma-model-list">${s}</div>
      <div class="ma-row" style="margin-top:4px">
        <strong style="font-size:12px">Categorias de avaliação real</strong>
        <select class="ma-select" id="ma-repeats" style="width:auto">
          <option value="1" ${r.repeats===1?"selected":""}>1x</option>
          <option value="2" ${r.repeats===2?"selected":""}>2x</option>
          <option value="3" ${r.repeats===3?"selected":""}>3x</option>
        </select>
      </div>
      <div class="ma-chips">${a}</div>
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="start-bench" ${r.busy||r.activeJob&&r.activeJob.status==="running"?"disabled":""}>
          Iniciar Benchmark (${r.selectedModels.length} modelo${r.selectedModels.length===1?"":"s"})
        </button>
      </div>
    </div>
  `}function Dn(){let e=r.schedule,n=r.history.length?r.history.slice(0,20).map(s=>{let a=r.expandedRunId===s.id&&r.expandedRunDetail,i=a?`
              <div style="margin-top:6px;display:flex;flex-direction:column;gap:5px">
                ${(a.evaluation?.criteria||[]).map(d=>`
                      <div class="ma-crit ${d.passed?"pass":"fail"}">
                        <span><b>${d.passed?"✓":"✗"} ${m(d.name)}</b> — ${m(d.detail)}</span>
                        <span>${d.earned}/${d.weight}</span>
                      </div>
                    `).join("")}
                ${a.evaluation?.code_extracted?`<pre class="ma-code">${m(a.evaluation.code_extracted)}</pre>`:""}
                ${a.error?`<div class="ma-notice error">${m(a.error)}</div>`:""}
              </div>
            `:"";return`
            <div class="ma-run-row" data-action="inspect-run" data-run-id="${s.id}">
              <div class="ma-row">
                <strong class="ma-mono" style="font-size:11px">${m(s.model_id)}</strong>
                <span class="ma-score" style="font-size:12px">${s.score}/100</span>
              </div>
              <div class="ma-meta">
                <span>${m(s.category)} / ${m(s.task_id)}</span>
                <span>${s.tests_total?`${s.tests_passed}/${s.tests_total} testes`:s.status}</span>
                <span>${Math.round(s.latency_ms||0)} ms</span>
              </div>
              ${i}
            </div>
          `}).join(""):'<p class="ma-subtitle">Nenhuma avaliação registrada ainda.</p>';return`
    <div class="ma-card">
      <div class="ma-row">
        <strong>Execução Automática</strong>
        <span class="ma-badge">${e?.enabled?"Ativo":"Pausado"}</span>
      </div>
      <label class="ma-subtitle" style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" id="ma-sched-enabled" ${e?.enabled?"checked":""} />
        Rodar benchmarks automaticamente e manter ranking atualizado
      </label>
      <div class="ma-row">
        <select class="ma-select" id="ma-sched-interval" style="flex:1">
          <option value="60" ${e?.interval_minutes===60?"selected":""}>A cada 1 hora</option>
          <option value="180" ${e?.interval_minutes===180?"selected":""}>A cada 3 horas</option>
          <option value="360" ${!e||e.interval_minutes===360?"selected":""}>A cada 6 horas</option>
          <option value="720" ${e?.interval_minutes===720?"selected":""}>A cada 12 horas</option>
          <option value="1440" ${e?.interval_minutes===1440?"selected":""}>Diariamente (24h)</option>
        </select>
        <select class="ma-select" id="ma-sched-mode" style="flex:1">
          <option value="auto_coding" ${!e||e.model_selection_mode==="auto_coding"?"selected":""}>Auto (Top modelos código)</option>
          <option value="manual" ${e?.model_selection_mode==="manual"?"selected":""}>Modelos selecionados</option>
        </select>
      </div>
      ${e?.next_run_at?`<div class="ma-subtitle">Próxima rodada: ${new Date(e.next_run_at).toLocaleString("pt-BR")}</div>`:""}
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="save-schedule">Salvar agendamento</button>
        <button class="ma-btn" data-action="run-schedule-now">Executar agora</button>
      </div>
    </div>
    <div class="ma-card">
      <strong>Histórico e Rubrica (clique para inspecionar)</strong>
      ${n}
    </div>
  `}function Gn(){return`
    <div class="ma-card">
      <strong>Conexão com Backend ModelArena</strong>
      <div class="ma-subtitle">Modo ativo: <b>${m(r.health?.active_provider_label||"Aguardando conexão")}</b>. Funciona direto com o provedor <code>console-nvidia</code> do seu OpenChamber sem precisar de API key.</div>
      <input class="ma-input ma-mono" id="ma-backend-url" value="${m(r.backendUrl)}" />
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="save-backend-url">Salvar URL e reconectar</button>
        <button class="ma-btn" data-action="open-web">Abrir Dashboard Web</button>
      </div>
    </div>
  `}function x(){let e=document.getElementById("root");if(!e)return;let n=r.activeJob&&(r.activeJob.status==="running"||r.activeJob.status==="queued")?`
        <div class="ma-card">
          <div class="ma-row">
            <strong>Benchmark em andamento (${r.activeJob.completed_steps}/${r.activeJob.total_steps} · ${r.activeJob.progress_percent}%)</strong>
            <button class="ma-btn danger" data-action="cancel-job">Cancelar</button>
          </div>
          <div class="ma-subtitle ma-mono">${m(r.activeJob.current_model||"Preparando...")} ${r.activeJob.current_task_id?`→ ${m(r.activeJob.current_task_id)}`:""}</div>
          <div class="ma-bar"><i style="width:${r.activeJob.progress_percent}%"></i></div>
        </div>
      `:"",s=r.sessionModelRaw?`
      <div class="ma-session-pill">
        <span>Sessão OpenChamber:</span>
        <strong class="ma-mono">${m(r.sessionModelRaw)}</strong>
      </div>
    `:"",a="";!r.backendOnline&&r.tab!=="connection"?a=Nn():r.tab==="ranking"?a=Ln():r.tab==="frontier"?a=Pn():r.tab==="run"?a=wn():r.tab==="automation"?a=Dn():a=Gn();let i=r.health?.provider_ready??r.health?.nvidia_configured,d=r.backendOnline?i?"ma-dot":"ma-dot warn":"ma-dot offline",A=r.backendOnline?i?r.health?.active_provider_label||"NVIDIA":"Não config.":"Offline";e.innerHTML=`
    <div class="ma-shell ${r.surface==="page"?"ma-page":""}">
      <header class="ma-header">
        <div class="ma-brand">
          <div class="ma-logo">MA</div>
          <div>
            <h1 class="ma-title">Model Arena</h1>
            <p class="ma-subtitle">NVIDIA NIM Benchmark</p>
          </div>
        </div>
        <div class="ma-status"><span class="${d}"></span><span>${A}</span></div>
      </header>
      ${s}
      <nav class="ma-tabs">
        <button class="ma-tab ${r.tab==="ranking"?"active":""}" data-action="tab" data-tab="ranking">Ranking</button>
        <button class="ma-tab ${r.tab==="frontier"?"active":""}" data-action="tab" data-tab="frontier">vs. Ponta</button>
        <button class="ma-tab ${r.tab==="run"?"active":""}" data-action="tab" data-tab="run">Executar</button>
        <button class="ma-tab ${r.tab==="automation"?"active":""}" data-action="tab" data-tab="automation">Automático</button>
        <button class="ma-tab ${r.tab==="connection"?"active":""}" data-action="tab" data-tab="connection">Conexão</button>
      </nav>
      <div class="ma-notice ${r.noticeError?"error":""}">${m(r.notice)}</div>
      ${n}
      ${a}
    </div>
  `,$n(e)}function $n(e){let n=e.querySelector("#ma-search");n&&n.addEventListener("input",()=>{r.search=n.value,x();let s=document.querySelector("#ma-search");s&&(s.focus(),s.setSelectionRange(r.search.length,r.search.length))}),e.querySelector("#ma-coding-only")?.addEventListener("change",s=>{r.codingOnly=s.target.checked,x()}),e.querySelector("#ma-repeats")?.addEventListener("change",s=>{r.repeats=Number(s.target.value)}),e.querySelectorAll('input[data-action="toggle-model"]').forEach(s=>{s.addEventListener("change",()=>{let a=s.dataset.model;a&&(r.selectedModels=s.checked?[...new Set([...r.selectedModels,a])]:r.selectedModels.filter(i=>i!==a),x())})}),e.querySelectorAll("[data-action]").forEach(s=>{s.tagName!=="INPUT"&&s.addEventListener("click",()=>{let a=s.dataset.action;if(a==="tab")r.tab=s.dataset.tab||"ranking",x();else if(a==="goto-run")r.tab="run",x();else if(a==="goto-connection")r.tab="connection",x();else if(a==="refresh")Ae();else if(a==="load-models")Jo(!0);else if(a==="select-top"){let i=r.models.filter(A=>A.is_coding_candidate!==!1).slice(0,4).map(A=>A.id),d=r.sessionNvidiaModel?[r.sessionNvidiaModel,...i]:i;r.selectedModels=[...new Set(d)].slice(0,5),x()}else if(a==="rank-cat")r.rankingCat=s.dataset.cat||"",Ae();else if(a==="toggle-cat"){let i=s.dataset.cat;if(!i)return;r.selectedCategories=r.selectedCategories.includes(i)?r.selectedCategories.filter(d=>d!==i):[...r.selectedCategories,i],x()}else if(a==="start-bench")zo();else if(a==="bench-session"&&r.sessionNvidiaModel)zo([r.sessionNvidiaModel]);else if(a==="cancel-job")yn();else if(a==="copy-ref"){let i=s.dataset.ref||"";C.writeClipboard(i).then(()=>C.toast({kind:"success",message:`Copiado: ${i}`}))}else if(a==="copy-cmd")C.writeClipboard(".\\scripts\\start-modelarena.ps1").then(()=>C.toast({kind:"success",message:"Comando copiado para a área de transferência."}));else if(a==="compose-rec")Un();else if(a==="open-web")C.openUrl(r.backendUrl);else if(a==="inspect-run"){let i=Number(s.dataset.runId);Number.isFinite(i)&&Cn(i)}else if(a==="save-schedule"){let i=!!e.querySelector("#ma-sched-enabled")?.checked,d=Number(e.querySelector("#ma-sched-interval")?.value||360),A=e.querySelector("#ma-sched-mode")?.value||"auto_coding";N("PUT","/arena/schedule",{enabled:i,interval_minutes:d,model_selection_mode:A,max_auto_models:5,models:r.selectedModels,categories:r.selectedCategories,repeats:r.repeats}).then(h=>(r.schedule=h,C.toast({kind:"success",message:h.enabled?"Agendamento ativado!":"Agendamento salvo."}))).then(()=>x()).catch(h=>{r.noticeError=!0,r.notice=h instanceof Error?h.message:"Erro ao salvar agendamento.",x()})}else if(a==="run-schedule-now")N("POST","/arena/schedule/run-now").then(i=>(i.job&&(r.activeJob=i.job,de()),C.toast({kind:"info",message:"Execução agendada iniciada agora."}))).then(()=>x()).catch(i=>{r.noticeError=!0,r.notice=i instanceof Error?i.message:"Erro ao executar agendamento.",x()});else if(a==="save-backend-url"){let i=e.querySelector("#ma-backend-url")?.value||"";N("PUT","/config",{backendUrl:i}).then(d=>(r.backendUrl=d.backendUrl,C.toast({kind:"success",message:`Backend atualizado: ${d.backendUrl}`}))).then(()=>Ae()).catch(d=>{r.noticeError=!0,r.notice=d instanceof Error?d.message:"URL inválida.",x()})}})})}function Yo(e){r.sessionModelRaw=e?.model||null,r.sessionNvidiaModel=Mn(e?.model),x()}C.onReady(e=>{kt(e,document.documentElement),r.surface=e.surface,Yo(e.session),Ae()});C.onSession(e=>{Yo(e)});x();})();
