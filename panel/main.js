(()=>{var en=Object.defineProperty;var tn=(e,n,s)=>n in e?en(e,n,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[n]=s;var Me=(e,n,s)=>tn(e,typeof n!="symbol"?n+"":n,s);var S="openchamber.sdk";var Ce="data-oc-scrolling",Ze=`
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
:hover, [${Ce}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${Ce}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${Ce}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${Ce}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;function Qt(e){let n=e.documentElement;if(n.hasAttribute("data-oc-scrollbar-activity"))return;n.setAttribute("data-oc-scrollbar-activity","");let s=new WeakMap;e.addEventListener("scroll",c=>{let a=c.target===e?n:c.target;if(!(a instanceof Element))return;a.hasAttribute("data-oc-scrolling")||a.setAttribute("data-oc-scrolling","");let d=s.get(a);d!==void 0&&clearTimeout(d),s.set(a,setTimeout(()=>{s.delete(a),a.removeAttribute("data-oc-scrolling")},1e3))},{capture:!0,passive:!0})}var on=`(${Qt.toString()})(document);`;var Zt=e=>{let n=[],s=0,c=0;return{push:a=>{for(n.push(a),c+=a.length;c-s>e&&n.length>1;){let d=n.shift();c-=d?.length??0,s=0}},pull:a=>{let d=0;for(;d<a.length&&n.length>0;){let O=n[0],h=Math.min(a.length-d,O.length-s);a.set(O.subarray(s,s+h),d),d+=h,s+=h,s>=O.length&&(n.shift(),c-=O.length,s=0)}a.fill(0,d)},clear:()=>{n.length=0,s=0,c=0},get size(){return c-s}}};var no=/^[a-z][a-z0-9-]{0,39}$/;var eo=e=>Object(e)===e&&!Array.isArray(e),et=(e,n)=>Object.keys(e).every(s=>n.includes(s)),to=e=>String(e)===e&&e.length>=1&&e.length<=60,oo=e=>String(e)===e&&e.length>=1&&e.length<=80,ro=e=>{if(!Array.isArray(e)||e.length>4)return!1;let n=new Set;for(let s of e){if(!eo(s)||!no.test(s.id)||!to(s.label)||s.disabled!==void 0&&s.disabled!==!0&&s.disabled!==!1||n.has(s.id))return!1;if(n.add(s.id),s.kind==="button"){if(!et(s,["kind","id","label","disabled"]))return!1;continue}if(s.kind!=="select"||!et(s,["kind","id","label","value","options","disabled"])||!oo(s.value)||!Array.isArray(s.options)||s.options.length<1||s.options.length>16)return!1;let c=new Set;for(let a of s.options){if(!eo(a)||!et(a,["value","label"])||!oo(a.value)||!to(a.label)||c.has(a.value))return!1;c.add(a.value)}if(!c.has(s.value))return!1}return!0};var rn=1024*1024;var so=["{id}","{segment}","{segments+}"];var qn=new Set(so);var ao=["turn-finished","turn-failed","permission-asked","question-asked","turn-started","session-created","session-archived","session-deleted"];var Qn=new Set(ao);var tt=e=>"bytes"in e?e.bytes.byteLength:e.content.length,io=(e,n)=>{if(e.path!==n.path||e.readOnly!==n.readOnly)return!1;if(e.encoding==="text"||n.encoding==="text")return e.encoding==="text"&&n.encoding==="text"&&e.content===n.content;if(e.bytes.byteLength!==n.bytes.byteLength)return!1;for(let s=0;s<e.bytes.byteLength;s+=1)if(e.bytes[s]!==n.bytes[s])return!1;return!0};var co=/^[A-Za-z0-9_-]{1,80}$/;var lo=["left","right","top","bottom"];var uo=(e,n=0,s={remaining:16e3})=>{if(--s.remaining<0||n>=32)return!1;if(e===null)return!0;let c=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let a of c)if(!uo(a,n+1,s))return!1;return!0},ot=e=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every(n=>/^(0|[1-9]\d*)$/.test(n)&&Number(n)<e.length)&&e.every(ot);if(Object(e)===e){let n=Object.getPrototypeOf(e);return(n===null||n===Object.prototype)&&Object.values(e).every(ot)}return String(e)===e||Number.isFinite(e)},nt=e=>{try{return String(e.id)!==e.id||!co.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!lo.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!uo(e.data)||!ot(e.data)?!1:JSON.stringify(e.data).length<=16e3}catch{return!1}};var po=/^[0-9a-f]{7,64}$/i,_o=e=>po.test(e),rt=255,Eo=(e,n,s)=>({openCommit:c=>_o(c)?e({channel:S,v:1,type:"open-commit",id:n(),payload:{sha:c}}):s("Commit id must be 7 to 64 hex characters."),openWalkthrough:({base:c})=>{let a=c.trim();return!a||a.length>rt?s(`Base must contain 1 to ${rt} characters.`):e({channel:S,v:1,type:"open-walkthrough",id:n(),payload:{base:a}})}});var at=2e3;var So=["file","directory","other","missing"],it=e=>!!(e&&"sessionId"in e),ct=e=>!!(e&&"sent"in e&&!("sessionId"in e));var ye=500,Ue=32e3,fo=16e3,mo=128,Ao=200,Oo=2e3,ho=16e3,Ro=80,go=200,bo=16e3;var Io=2e3;var dt=2e4,Ne=1024,Le=2e6;var Pe=64e3,we=8e3,lt=4e3;var ut=96e4,sn=60*6e4;var xo=999,ko=1e4,Se=500,vo=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],Mo=["stopped","starting","ready","failed"],an=new Set(vo),Co=e=>an.has(e),yo=e=>e&&Co(e)?e:"HOST_REJECTED",re=e=>e===void 0?!1:e===null||e===!0||e===!1||String(e)===e?!0:Number(e)===e?Number.isFinite(e):Array.isArray(e)?e.every(re):Object(e)===e?Object.values(e).every(re):!1,Uo=e=>re(e)&&JSON.stringify(e).length<=bo,To=e=>e?.trim().slice(0,go)??"",se=e=>{let n=e.id.trim().slice(0,mo),s=e.title.trim().slice(0,Ao),c=e.url.trim().slice(0,Oo),a=e.text?.trim().slice(0,ho),d=e.author?.trim().slice(0,Ro),O=e.kind==="pull"?"pull":"issue",h={providerId:e.providerId.trim(),id:n,title:s||n,url:c,kind:O};if(a&&(h.text=a),d&&(h.author=d),O==="pull"){let V=To(e.branches?.head),K=To(e.branches?.base);V&&K&&(h.branches={head:V,base:K})}return Uo(e.data)&&(h.data=e.data),h},pt=e=>{let n=se(e);return e.projectId&&(n.projectId=e.projectId),e.navigation&&(n.navigation=e.navigation),e.worktree&&(n.worktree=e.worktree),n},_t=e=>{let n={text:e.text.trim().slice(0,fo)};return e.send&&(n.send=!0),n},Et=e=>e===null||!Number.isFinite(e)?null:Math.min(xo,Math.max(0,Math.round(e))),Tt=e=>Number.isFinite(e)?Math.min(ko,Math.max(0,Math.ceil(e))):0;var ae=e=>e.length>0&&e.length<=Ne&&!e.includes("\0")&&!e.includes("\\");var De=e=>!e.startsWith("/")||e.includes("\0")||e.includes("\\")||e.includes("://")||e.length>Io?!1:!e.split("/").some(s=>s==="."||s===".."),cn=new Set(Mo),St=e=>!!(e&&"status"in e&&cn.has(String(e.status))&&!("body"in e)),Ge=e=>!!(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),ft=e=>!!(e&&"content"in e&&String(e.content)===e.content),mt=e=>!!(e&&"written"in e&&e.written===!0),At=e=>!!(e&&"entries"in e&&Array.isArray(e.entries)),dn=new Set(So),Ot=e=>!!(e&&"kind"in e&&"size"in e&&dn.has(String(e.kind))&&Number.isFinite(e.size)),ht=e=>!!(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),ln=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","service-event","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late","microphone-audio","microphone-ended"]),un=e=>Object(e)===e?e:null,st=e=>String(e)===e&&e.length>0,pn=e=>{if(!st(e.id))return null;if(e.ok===!0){let n={channel:S,v:1,type:"result",id:e.id,ok:!0};return Object(e.payload)===e.payload&&(n.payload=e.payload),n}return e.ok===!1&&st(e.error)?{channel:S,v:1,type:"result",id:e.id,ok:!1,error:e.error,code:yo(st(e.code)?e.code:void 0)}:null},Rt=e=>{let n=un(e);return!n||n.channel!==S||n.v!==1?null:n.type==="result"?pn(n):!ln.has(String(n.type))||Object(n.payload)!==n.payload?null:n};var No=e=>"key"in e&&"metaKey"in e&&"ctrlKey"in e,_n=e=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s",p=class extends Error{constructor(s,c){super(c);Me(this,"code");this.name="HostRequestError",this.code=s}},Lo=()=>Promise.reject(new p("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),$e=()=>Promise.reject(new p("BAD_PATH",`File path must be 1 to ${Ne} characters without NUL or backslash.`)),He=e=>{if(e!==void 0){if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new p("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0}},T=e=>(e.value+=1,`oc-${e.value}`),kt=(e={})=>{let n=e.target??("window"in globalThis?window:null);if(!n)throw new p("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let s=e.acceptSource??(t=>t===n.parent),c=e.requestTimeoutMs??dt,a=new Set,d=new Set,O=new Set,h=new Set,V=new Set,K=new Set,q=new Set,Oe=new Set,he=new Set,Re=new Set,ge=new Set,Z=new Set,je=[],le=null,ue=null,be=new Set,Ie=new Set,pe=null,_e=null,ze=!1,ee=new Map,te=new Map,oe=new Map,F=!1,E={value:0},_=null,W=null,Ee=!1,Te=!1,Ht=null,$=null,Xt=t=>t?{sessionId:t.id,phase:t.busy?"started":"completed"}:null,P=t=>{n.parent.postMessage(t,"*")},Vt=()=>{F||n.parent===n||Z.size===0||_?.features?.lateGenerateResults!==!0||P({channel:S,v:1,type:"generate-late-listen"})},R=(t,o)=>{for(let u of t)try{u(o)}catch(l){console.error(l)}},Ft=t=>{if(!(t instanceof MessageEvent)||!s(t.source))return;let o=Rt(t.data);if(!o)return;if(o.type==="workspace"){let l=te.get(o.payload.subscriptionId);l&&R([l],o.payload.snapshot);return}if(o.type==="shells"){let l=oe.get(o.payload.subscriptionId);l&&R([l],o.payload.snapshot);return}if(o.type==="microphone-audio"){$?.queue.push(o.payload.samples);return}if(o.type==="microphone-ended"){let l=$;if(!l)return;$=null,l.release(),R(l.endedListeners,o.payload.reason);return}if(o.type==="ready"){_=o.payload,W=Xt(o.payload.session),R(a,o.payload),R(d,o.payload.directory),R(O,o.payload.session),W&&R(h,W),R(V,o.payload.connection),R(K,o.payload.settings),R(q,o.payload.item),o.payload.block&&R(Oe,o.payload.block),Vt();return}if(o.type==="service-event"){R(he,o.payload);return}if(o.type==="generate-late"){Z.size===0?je.push(o.payload):R(Z,o.payload);return}if(o.type==="directory"){_&&(_={..._,directory:o.payload.directory}),R(d,o.payload.directory);return}if(o.type==="session"){_&&(_={..._,session:o.payload.session}),o.payload.session?W?.sessionId!==o.payload.session.id&&(W=Xt(o.payload.session)):W=null,R(O,o.payload.session);return}if(o.type==="session-lifecycle"){W=o.payload,R(h,o.payload);return}if(o.type==="connection"){_&&(_={..._,connection:o.payload.connection}),R(V,o.payload.connection);return}if(o.type==="settings"){_&&(_={..._,settings:o.payload.settings}),R(K,o.payload.settings);return}if(o.type==="item"){_&&(_={..._,item:o.payload.item}),R(q,o.payload.item);return}if(o.type==="status-control-event"){R(Re,o.payload);return}if(o.type==="popover-closed"){R(ge,o.payload);return}if(o.type==="action"){let l=A=>{F||P({channel:S,v:1,type:"action-result",id:o.id,payload:A})},m=ue;if(!m){l({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>m(o.payload)).then(()=>l({ok:!0}),A=>{let g=(A instanceof Error?A.message:String(A)).trim();l({ok:!1,error:(g||"Action failed.").slice(0,Se)})});return}if(o.type==="file-open"){let l=o.payload;if(_e&&io(_e,l))return;_e=l,R(be,o.payload);return}if(o.type==="file-saved"){R(Ie,o.payload.version);return}if(o.type==="file-snapshot"){let l=g=>{F||P({channel:S,v:1,type:"file-snapshot-result",id:o.id,payload:g})},m=g=>l({error:(g.trim()||"Could not read the edited file.").slice(0,Se)}),A=pe;if(!A){m("This extension does not edit files.");return}Promise.resolve().then(()=>A(o.payload.purpose)).then(g=>{if(tt(g)>2e7){m(`The file is over ${2e7} ${"bytes"in g?"bytes":"characters"}.`);return}if(g.version.length>256){m(`The snapshot version is over ${256} characters.`);return}l({snapshot:"bytes"in g?{bytes:g.bytes,version:g.version}:{content:g.content,version:g.version}})},g=>m(g instanceof Error?g.message:String(g)));return}if(o.type==="resolve"){let l=A=>{P({channel:S,v:1,type:"resolve-result",id:o.id,payload:A})},m=le;if(!m){l({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>m(o.payload)).then(A=>l({item:A?se(A):null}),A=>{let g=(A instanceof Error?A.message:String(A)).trim();l({error:(g||"Command failed.").slice(0,Se)})});return}let u=ee.get(o.id);if(u){if(clearTimeout(u.timer),ee.delete(o.id),o.ok){u.resolve(o.payload);return}u.reject(new p(o.code,o.error))}};n.addEventListener("message",Ft),P({channel:S,v:1,type:"hello"});let U=(t,o=c)=>F||n.parent===n?Promise.reject(new p("HOST_UNAVAILABLE","No host frame. This page is not in an iframe.")):new Promise((u,l)=>{let m=setTimeout(()=>{ee.delete(t.id),l(new p("HOST_TIMEOUT","Host did not answer in time."))},o);ee.set(t.id,{resolve:u,reject:l,timer:m}),P(t)}),C=t=>U(t).then(()=>{}),k={channel:S,v:1},Je=t=>{!F&&n.parent!==n&&P(t)},Bt=()=>Je({...k,type:"file-save"}),qe=()=>{!F&&n.parent!==n&&P({...k,type:"microphone-close",id:T(E)})},Qo=async()=>{if($)throw new p("HOST_REJECTED","The microphone is already open in this frame.");if(_?.features?.microphone!==!0)throw new p("UNSUPPORTED","This OpenChamber cannot share the microphone with extensions.");let t=globalThis.AudioContext;if(typeof t!="function")throw new p("UNSUPPORTED","This frame has no Web Audio.");let o=new t;if(o.sampleRate<8e3||o.sampleRate>192e3)throw o.close().catch(()=>{}),new p("UNSUPPORTED",`Audio at ${o.sampleRate} Hz is not supported.`);let u=o.state==="suspended"?o.resume().catch(()=>{}):void 0,l=Zt(Math.round(o.sampleRate/4)),m=o.createScriptProcessor(1024,1,1);m.onaudioprocess=X=>l.pull(X.outputBuffer.getChannelData(0));let A=o.createMediaStreamDestination();m.connect(A);let g=new Set,ne={queue:l,endedListeners:g,release:()=>{m.onaudioprocess=null,m.disconnect(),l.clear();for(let X of A.stream.getTracks())X.stop();o.close().catch(()=>{})}};$=ne;try{let X=await U({...k,type:"microphone-open",id:T(E),payload:{sampleRate:o.sampleRate}},12e4);if(!X||!("opened"in X)||X.opened!==!0)throw new p("HOST_REJECTED","Host did not open the microphone.");if(await u,$!==ne)throw new p("DISCONNECTED","The microphone closed while it was opening.")}catch(X){throw $===ne&&($=null),ne.release(),qe(),X}return{stream:A.stream,close:()=>{$===ne&&($=null,ne.release(),qe())},onEnded:X=>(g.add(X),()=>{g.delete(X)})}},Kt=t=>{!No(t)||!_n(t)||(t.preventDefault(),Bt())},Wt=t=>{!No(t)||t.key!=="Escape"||_?.surface!=="popover"||!_.popover||(t.preventDefault(),qt(_.popover.id,"escape").catch(()=>{}))},xe=()=>{let t=_?.surface==="popover"?_.popover:void 0;if(!t)return;let o=Ee||Te;Ht!==o&&(Ht=o,Yt(t.id,o).catch(()=>{}))},ke=()=>{_?.surface!=="popover"||Ee||(Ee=!0,xe())},jt=t=>{_?.surface!=="popover"||t.relatedTarget!==null||!Ee||(Ee=!1,xe())},zt=()=>{_?.surface!=="popover"||Te||(Te=!0,xe())},Jt=()=>{_?.surface!=="popover"||!Te||(Te=!1,xe())},B=(t,o=1024)=>{if(!t.trim()||t.length>o)throw new p("HOST_REJECTED",`Identity must contain 1 to ${o} characters.`)},Ye=async t=>{t.kind!=="projects"&&B(t.projectId);let o=await U({...k,type:"workspace-read",id:T(E),payload:t});if(!o||!("kind"in o)||!("state"in o)||o.kind!==t.kind)throw new p("HOST_REJECTED","Host did not return workspace data.");return o},Qe=async(t,o)=>{t.kind!=="projects"&&B(t.projectId);let u=T(E);te.set(u,o);try{await C({...k,type:"workspace-subscribe",id:T(E),payload:{subscriptionId:u,query:t}})}catch(l){throw te.delete(u),F||P({...k,type:"workspace-unsubscribe",id:T(E),payload:{subscriptionId:u}}),l}return()=>{!te.delete(u)||F||P({...k,type:"workspace-unsubscribe",id:T(E),payload:{subscriptionId:u}})}},Zo=async(t,o)=>{t.kind==="session"&&B(t.sessionId),t.kind==="project"&&B(t.projectId);let u=T(E);oe.set(u,o);try{await C({...k,type:"shells-subscribe",id:T(E),payload:{subscriptionId:u,scope:t}})}catch(l){throw oe.delete(u),F||P({...k,type:"shells-unsubscribe",id:T(E),payload:{subscriptionId:u}}),l}return()=>{!oe.delete(u)||F||P({...k,type:"shells-unsubscribe",id:T(E),payload:{subscriptionId:u}})}},ve=async t=>{if("key"in t&&(t.key.length===0||t.key.length>128))throw new p("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(t.op==="set"&&!re(t.value))throw new p("HOST_REJECTED","Storage values must be JSON.");if(t.op==="set"&&new TextEncoder().encode(JSON.stringify(t.value)).length>65536)throw new p("HOST_REJECTED","Storage value exceeds 64 KiB.");if(t.scope==="device"&&_?.features?.deviceStorage!==!0)throw new p("UNSUPPORTED","This host does not support device storage.");let o=await U({...k,type:"storage",id:T(E),payload:t});if(!o||!("storage"in o)||o.op!==t.op)throw new p("HOST_REJECTED","Host did not return storage data.");return o},qt=(t,o)=>_?.features?.popovers!==!0&&!(_?.surface==="popover"&&_.popover?.id===t)?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):C({...k,type:"popover-close",id:T(E),payload:o?{id:t,reason:o}:{id:t}}),Yt=(t,o)=>_?.features?.popovers!==!0&&!(_?.surface==="popover"&&_.popover?.id===t)?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):C({...k,type:"popover-anchor",id:T(E),payload:{id:t,active:o}});return n.addEventListener("keydown",Wt,!0),n.addEventListener("pointerover",ke),n.addEventListener("pointermove",ke),n.addEventListener("pointerout",jt),n.addEventListener("focus",zt),n.addEventListener("blur",Jt),{onAction:t=>(ue=t,()=>{ue===t&&(ue=null)}),listProjects:async()=>{let t=await Ye({kind:"projects"});if(t.kind!=="projects")throw new p("HOST_REJECTED","Expected projects.");return t},listWorktrees:async t=>{let o=await Ye({kind:"worktrees",projectId:t});if(o.kind!=="worktrees")throw new p("HOST_REJECTED","Expected worktrees.");return o},listSessions:async t=>{let o=await Ye({kind:"sessions",projectId:t});if(o.kind!=="sessions")throw new p("HOST_REJECTED","Expected sessions.");return o},onProjects:t=>Qe({kind:"projects"},o=>{o.kind==="projects"&&t(o)}),onWorktrees:(t,o)=>Qe({kind:"worktrees",projectId:t},u=>{u.kind==="worktrees"&&o(u)}),onSessions:(t,o)=>Qe({kind:"sessions",projectId:t},u=>{u.kind==="sessions"&&o(u)}),onRunningShells:(t,o)=>Zo(t,o),readShellOutput:async(t,o)=>{B(t,128);let u=o?.cursor;if(u!==void 0&&(!Number.isInteger(u)||u<0))throw new p("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let l=o?.tailBytes;if(l!==void 0&&(!Number.isInteger(l)||l<1||l>65536))throw new p("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${65536}.`);let A=await U({...k,type:"shell-output",id:T(E),payload:{shellId:t,cursor:u,tailBytes:l}});if(!A||typeof A.output!="string"||!Number.isFinite(A.cursor))throw new p("HOST_REJECTED","Host did not return shell output.");return A},stopShell:async t=>{if(B(t,128),(await U({...k,type:"shell-stop",id:T(E),payload:{shellId:t}}))?.stopped!==!0)throw new p("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async t=>{B(t),await C({...k,type:"open-session",id:T(E),payload:{sessionId:t}})},storage:{get:async(t,o)=>{let u=He(o),l={op:"get",key:t};u&&(l.scope=u);let m=await ve(l);return m.op==="get"&&m.found?m.value:void 0},set:async(t,o,u)=>{let l=He(u),m={op:"set",key:t,value:o};l&&(m.scope=l),await ve(m)},delete:async(t,o)=>{let u=He(o),l={op:"delete",key:t};u&&(l.scope=u),await ve(l)},keys:async t=>{let o=He(t),u={op:"keys"};o&&(u.scope=o);let l=await ve(u);if(l.op!=="keys")throw new p("HOST_REJECTED","Expected storage keys.");return l.keys}},onReady:t=>(a.add(t),_&&t(_),()=>{a.delete(t)}),onDirectory:t=>(d.add(t),_&&t(_.directory),()=>{d.delete(t)}),onSession:t=>(O.add(t),_&&t(_.session),()=>{O.delete(t)}),onSessionLifecycle:t=>(h.add(t),W&&t(W),()=>{h.delete(t)}),onConnection:t=>(V.add(t),_&&t(_.connection),()=>{V.delete(t)}),onSettings:t=>(K.add(t),_&&t(_.settings),()=>{K.delete(t)}),onItem:t=>(q.add(t),_&&t(_.item),()=>{q.delete(t)}),onBlock:t=>(Oe.add(t),_?.block&&t(_.block),()=>{Oe.delete(t)}),onServiceEvent:t=>(he.add(t),()=>{he.delete(t)}),onStatusControl:t=>(Re.add(t),()=>{Re.delete(t)}),onPopoverClosed:t=>(ge.add(t),()=>{ge.delete(t)}),setStatusControls:t=>_?.features?.statusControls!==!0?Promise.reject(new p("UNSUPPORTED","This host does not support status controls.")):ro(t)?C({...k,type:"status-controls",id:T(E),payload:{controls:t}}):Promise.reject(new p("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options.")),openPopover:t=>_?.features?.popovers!==!0?Promise.reject(new p("UNSUPPORTED","This host does not support popovers.")):nt(t)?C({...k,type:"popover-open",id:T(E),payload:t}):Promise.reject(new p("HOST_REJECTED","Popover requests need bounded geometry and JSON data.")),closePopover:qt,setPopoverAnchorActive:Yt,onResolve:t=>(le=t,()=>{le===t&&(le=null)}),toast:t=>{let o=t.message.trim();return!o||o.length>ye?Promise.reject(new p("HOST_REJECTED",`Toast message must contain 1 to ${ye} characters.`)):t.copy&&t.copy!==!0&&(!t.copy.text.length||t.copy.text.length>Ue)?Promise.reject(new p("HOST_REJECTED",`Toast copy text must contain 1 to ${Ue} characters.`)):C({channel:S,v:1,type:"toast",id:T(E),payload:{...t,message:o}})},openUrl:t=>C({channel:S,v:1,type:"open-url",id:T(E),payload:{url:t}}),...Eo(C,()=>T(E),t=>Promise.reject(new p("HOST_REJECTED",t))),answerBlock:t=>C({channel:S,v:1,type:"block-answer",id:T(E),payload:{text:t.trim().slice(0,at)}}),openSurface:t=>C({channel:S,v:1,type:"open-surface",id:T(E),payload:{surfaceId:t}}),writeClipboard:t=>C({channel:S,v:1,type:"clipboard-write",id:T(E),payload:{text:t}}),compose:t=>C({channel:S,v:1,type:"compose",id:T(E),payload:t}),attach:t=>C({channel:S,v:1,type:"attach",id:T(E),payload:se(t)}),startSession:async t=>{t.projectId!==void 0&&B(t.projectId);let o=t.worktree;o&&o!==!0&&(o.kind==="existing"?B(o.directory):(o.name!==void 0&&B(o.name,200),o.baseBranch!==void 0&&B(o.baseBranch,200)));let u=await U({channel:S,v:1,type:"start-session",id:T(E),payload:pt(t)},e.requestTimeoutMs??18e4);if(!it(u))throw new p("HOST_REJECTED","Host did not return a session.");return u},prompt:t=>U({channel:S,v:1,type:"prompt",id:T(E),payload:_t(t)}).then(o=>{if(!ct(o))throw new p("HOST_REJECTED","Host did not return a prompt result.");return o}),sessionLink:t=>C({channel:S,v:1,type:"session-link",id:T(E),payload:se(t)}),close:()=>C({channel:S,v:1,type:"close",id:T(E)}),oauthStart:()=>C({channel:S,v:1,type:"oauth-start",id:T(E)}),oauthDisconnect:()=>C({channel:S,v:1,type:"oauth-disconnect",id:T(E)}),request:t=>(De(t.path)?U({channel:S,v:1,type:"request",id:T(E),payload:t}):Lo()).then(o=>{if(!Ge(o))throw new p("HOST_REJECTED","Host request result was empty.");return o}),serviceRequest:t=>(De(t.path)?U({channel:S,v:1,type:"service-request",id:T(E),payload:t}):Lo()).then(o=>{if(!Ge(o))throw new p("HOST_REJECTED","Host service request result was empty.");return o}),serviceStatus:()=>U({channel:S,v:1,type:"service-status",id:T(E)}).then(t=>{if(!St(t))throw new p("HOST_REJECTED","Host did not return service status.");return t}),readFile:t=>(ae(t)?U({channel:S,v:1,type:"file-read",id:T(E),payload:{path:t}}):$e()).then(o=>{if(!ft(o))throw new p("HOST_REJECTED","Host did not return file content.");return o}),writeFile:(t,o)=>ae(t)?o.length>Le?Promise.reject(new p("FILE_TOO_LARGE",`Content is over ${Le} characters.`)):U({channel:S,v:1,type:"file-write",id:T(E),payload:{path:t,content:o}}).then(u=>{if(!mt(u))throw new p("HOST_REJECTED","Host did not confirm the write.");return u}):$e(),listDir:t=>(ae(t)?U({channel:S,v:1,type:"file-list",id:T(E),payload:{path:t}}):$e()).then(o=>{if(!At(o))throw new p("HOST_REJECTED","Host did not return directory entries.");return o}),stat:t=>(ae(t)?U({channel:S,v:1,type:"file-stat",id:T(E),payload:{path:t}}):$e()).then(o=>{if(!Ot(o))throw new p("HOST_REJECTED","Host did not return file status.");return o}),generate:t=>{let o=t.prompt.trim(),u=t.system?.trim();if(o.length===0||o.length>Pe)return Promise.reject(new p("HOST_REJECTED",`Prompt must be 1 to ${Pe} characters.`));if(u!==void 0&&(u.length===0||u.length>we))return Promise.reject(new p("HOST_REJECTED",`System prompt must be 1 to ${we} characters.`));let l=t.maxOutputTokens===void 0?void 0:Math.min(lt,Math.max(1,Math.floor(t.maxOutputTokens)));if(l!==void 0&&!Number.isFinite(l))return Promise.reject(new p("HOST_REJECTED","maxOutputTokens must be a number."));let m={prompt:o};return u!==void 0&&(m.system=u),l!==void 0&&(m.maxOutputTokens=l),U({channel:S,v:1,type:"generate",id:T(E),payload:m},e.requestTimeoutMs??ut).then(A=>{if(!ht(A))throw new p("HOST_REJECTED","Host did not return generated text.");return A})},onLateGenerateResult:t=>{Z.add(t);for(let o of je.splice(0))R([t],o);return Vt(),()=>{Z.delete(t)}},openMicrophone:Qo,setBadge:t=>C({channel:S,v:1,type:"badge",id:T(E),payload:{count:Et(t)}}),setHeight:t=>C({channel:S,v:1,type:"resize",id:T(E),payload:{height:Tt(t)}}),onFileOpen:t=>(be.add(t),ze||(ze=!0,n.addEventListener("keydown",Kt,!0)),_e&&t(_e),()=>{be.delete(t)}),onFileSnapshot:t=>(pe=t,()=>{pe===t&&(pe=null)}),onFileSaved:t=>(Ie.add(t),()=>{Ie.delete(t)}),reportFileChange:t=>Je({...k,type:"file-change",payload:{dirty:t.dirty,edited:t.edited}}),requestFileSave:Bt,reportFileUnsupported:()=>Je({...k,type:"file-unsupported"}),dispose:()=>{for(let t of te.keys())P({...k,type:"workspace-unsubscribe",id:T(E),payload:{subscriptionId:t}});te.clear();for(let t of oe.keys())P({...k,type:"shells-unsubscribe",id:T(E),payload:{subscriptionId:t}});oe.clear(),$&&(qe(),$.release(),$=null),F=!0,le=null,ue=null,pe=null,be.clear(),Ie.clear(),ze&&n.removeEventListener("keydown",Kt,!0),n.removeEventListener("message",Ft),n.removeEventListener("keydown",Wt,!0),n.removeEventListener("pointerover",ke),n.removeEventListener("pointermove",ke),n.removeEventListener("pointerout",jt),n.removeEventListener("focus",zt),n.removeEventListener("blur",Jt);for(let t of ee.values())clearTimeout(t.timer),t.reject(new p("HOST_UNAVAILABLE","Host client was disposed."));ee.clear(),a.clear(),d.clear(),O.clear(),h.clear(),V.clear(),K.clear(),q.clear(),Oe.clear(),he.clear(),Re.clear(),ge.clear(),Z.clear(),je.length=0}}};var Ho=["browser.open","browser.snapshot","browser.click","browser.type","browser.select","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var Or=new Set(Ho);var En=10*6e4;var Tn=10*6e4;var Sn=10*6e4;var fn=10*6e4;var Xo=["none","agent","user"];var gr=new Set(Xo);var mn=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],An=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],Vo=(e,n)=>{n.style.colorScheme=e.mode;for(let[s,c]of mn)n.style.setProperty(s,e.tokens[c]);for(let[s,c,a]of An){let d=e.tokens[a]??"";n.style.setProperty(s,d),n.style.setProperty(c,d)}n.style.setProperty("font-family",e.tokens.font),n.style.setProperty("font-size",e.tokens.fontSize??"0.875rem"),n.style.setProperty("line-height","1.45"),n.style.setProperty("color",e.tokens.foreground)},vt=(e,n)=>{Vo(e.theme,n),n.dataset&&(n.dataset.ocSurface=e.surface,n.dataset.ocTheme=e.theme.mode)};var On={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},b=(e,n)=>`var(--${e}, var(--oc-${On[e]}, ${n}))`,z=b("surface-background","transparent"),Ve=b("surface-elevated","transparent"),ie=b("surface-elevated-foreground","inherit"),H=b("surface-foreground","inherit"),v=b("surface-muted-foreground","gray"),hn=b("surface-muted","transparent"),Y=b("interactive-border","currentColor"),w=b("interactive-hover","transparent"),Q=b("interactive-active","transparent"),Mt=b("interactive-selection","transparent"),Ct=b("interactive-selection-foreground","inherit"),j=b("primary","currentColor"),yt=b("primary-text","inherit"),Ut=b("error-text","inherit"),Rn=b("font-sans","inherit"),Nt=b("font-mono","monospace"),Wo=b("radius","9px"),Lt=`calc(${Wo} - 2px)`,Fo=`calc(${Wo} - 4px)`,M=(e,n,s="transparent")=>`color-mix(in srgb, ${e} ${n}%, ${s})`,Bo=`background-image: linear-gradient(${w}, ${w});`,Pt=(e,n="0.5px")=>`box-shadow: inset 0 0 0 ${n} ${e}, var(--oc-sdk-field-lift);`,wt="border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);",Ko="box-shadow: var(--oc-sdk-lit);",Dt=`inset 0 0.5px 0 0 ${M(H,8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`,gn=`
:root {
  --oc-sdk-edge: ${M(H,16)};
  --oc-sdk-field-bg: ${Ve};
  --oc-sdk-raised-bg: ${z};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${M(H,14)};
  --oc-sdk-field-bg: ${M(z,50,Ve)};
  --oc-sdk-raised-bg: ${Ve};
  --oc-sdk-field-lift: ${Dt};
  --oc-sdk-raised-lift: ${Dt};
  --oc-sdk-lit: ${Dt};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`,Xe=e=>{let n=b(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${n}; --oc-sdk-tone-text: ${b(`${e}-text`,"inherit")}; }`},i=e=>`calc(${e}rem / 14)`,bn=`
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: ${i(8)}; height: ${i(32)}; padding: 0 ${i(12)}; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: ${i(6)}; height: ${i(28)}; padding: 0 ${i(10)}; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: ${i(4)}; height: ${i(24)}; padding: 0 ${i(8)}; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: ${i(14)}; height: ${i(14)}; }

.oc-sdk-field { display: flex; flex-direction: column; gap: ${i(4)}; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: ${i(32)}; padding: 0 ${i(10)}; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: ${i(8)} ${i(10)}; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: ${i(34)}; padding-right: ${i(34)}; }
.oc-sdk-search-icon { position: absolute; left: ${i(11)}; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: ${i(6)}; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: ${i(24)}; height: ${i(24)}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: ${i(4)}; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: ${i(6)}; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: ${i(28)}; padding: 0 ${i(10)}; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: ${i(2)}; min-width: ${i(160)}; max-width: calc(100vw - ${i(16)}); max-height: min(${i(320)}, calc(100vh - ${i(16)})); overflow: auto; padding: ${i(4)}; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: ${i(2)} ${i(2)} ${i(4)}; }
.oc-sdk-popup-search .oc-sdk-input { height: ${i(28)}; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: ${i(8)}; width: 100%; padding: ${i(6)} ${i(8)}; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: ${i(14)}; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: ${i(8)}; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: ${i(8)}; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: ${i(14)}; height: ${i(14)}; margin-top: ${i(3)}; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: ${i(36)}; height: ${i(20)}; --oc-sdk-thumb-travel: ${i(16)}; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: ${i(2)}; left: ${i(2)}; width: ${i(16)}; height: ${i(16)}; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: ${i(2)}; padding: ${i(2)}; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: ${i(6)}; height: ${i(28)}; padding: 0 ${i(10)}; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: ${i(1)} ${i(6)}; font-size: ${i(11)}; font-weight: 500; line-height: ${i(16)}; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: ${i(8)}; width: 100%; padding: ${i(6)} ${i(8)}; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: ${i(64)}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: ${i(16)} ${i(8)}; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${i(4)}; padding: ${i(40)} ${i(16)}; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: ${i(12)}; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: ${i(8)}; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: ${i(16)}; height: ${i(16)}; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: ${i(12)}; height: ${i(12)}; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: ${i(12)}; padding: ${i(8)} ${i(12)}; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: ${i(2)}; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: ${i(8)}; width: 100%; margin: ${i(8)} 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: ${i(4)} 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: ${i(4)}; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: ${i(6)}; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }
.oc-sdk-progress-value { display: inline-flex; align-items: center; gap: ${i(2)}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { font-weight: 600; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: ${i(8)} 0; }

/* Under a finger the controls reach the app's touch sizes: rows and options 44px like its sheets, every other
   control at least 36px. Inputs keep 16px text, below which iOS zooms the page on focus. */
@media (pointer: coarse) {
  .oc-sdk-btn, .oc-sdk-input { height: ${i(40)}; }
  .oc-sdk-btn[data-size="sm"], .oc-sdk-btn[data-size="xs"], .oc-sdk-trigger, .oc-sdk-tab, .oc-sdk-popup-search .oc-sdk-input { height: ${i(36)}; }
  .oc-sdk-input, .oc-sdk-popup-search .oc-sdk-input { font-size: max(16px, 0.875rem); }
  .oc-sdk-search-clear { width: ${i(36)}; height: ${i(36)}; right: 0; }
  .oc-sdk-row, .oc-sdk-option { min-height: ${i(44)}; }
  .oc-sdk-check { min-height: ${i(36)}; padding: ${i(8)} 0; }
}
`,jo=`${gn}
.oc-sdk { color: ${H}; font-family: ${Rn}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${Bo} }
.oc-sdk-mono { font-family: ${Nt}; }
.oc-sdk-muted { color: ${v}; }
${Xe("success")}${Xe("warning")}${Xe("error")}${Xe("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${j}; --oc-sdk-tone-text: ${yt}; }

.oc-sdk-btn { border-radius: ${Lt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${Fo}; }
.oc-sdk-btn[data-variant="default"] { color: ${yt}; background: ${M(j,10,z)}; border-color: ${M(j,12)}; ${Ko} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${M(j,16,z)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${M(j,22,z)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${hn}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${Q}, ${Q}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${ie}; ${wt} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${Q}, ${Q}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${w}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${Q}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${b("status-error","red")}; color: ${Ut}; background: ${M("var(--oc-sdk-tone)",7,z)}; border-color: ${M("var(--oc-sdk-tone)",12)}; ${Ko} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${M("var(--oc-sdk-tone)",9,z)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${M("var(--oc-sdk-tone)",11,z)}; box-shadow: none; }

.oc-sdk-field-note { color: ${v}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${Ut}; }
.oc-sdk-input { border-radius: ${Lt}; background: var(--oc-sdk-field-bg); color: ${ie}; ${Pt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${v}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${Pt(M(H,26),"1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${Pt(b("status-error","red"),"1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${Nt}; }

.oc-sdk-search-icon { color: ${v}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${j}; }
.oc-sdk-search-clear { border-radius: ${Fo}; color: ${v}; }
.oc-sdk-search-clear:hover { background: ${w}; color: ${H}; }

.oc-sdk-trigger { border-radius: ${Lt}; background: var(--oc-sdk-raised-bg); color: ${ie}; ${wt} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${w}, ${w}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${Q}, ${Q}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${v}; }
.oc-sdk-trigger-chevron { color: ${v}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${ie}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${Ve}; background-clip: padding-box; color: ${ie}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${w}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${Mt}; color: ${Ct}; }
.oc-sdk-option-check { color: ${H}; }
.oc-sdk-option[data-destructive="true"] { color: ${Ut}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${M(b("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${v}; }
.oc-sdk-popup-empty { color: ${v}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${Y}; border-radius: 4px; color: ${H}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${M(H,60,Y)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${Y}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${z}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${j}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(var(--oc-sdk-thumb-travel, 16px)); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${Bo} }
.oc-sdk-check-desc { color: ${v}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${M(H,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${v}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${H}; }
.oc-sdk-tab[aria-selected="true"] { color: ${Ct}; background: ${Mt}; border-color: ${Y}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${ie}; background: var(--oc-sdk-raised-bg); ${wt} }
.oc-sdk-tab-count { color: ${v}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${M(H,6)}; color: ${v}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${M("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${w}; }
.oc-sdk-row[aria-selected="true"] { background: ${Mt}; color: ${Ct}; }
.oc-sdk-row-lead { font-family: ${Nt}; color: ${v}; }
.oc-sdk-row-sub { color: ${v}; }
.oc-sdk-row-meta { color: ${v}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${v}; }

.oc-sdk-empty-body { color: ${v}; }

.oc-sdk-spinner { color: ${v}; }
.oc-sdk-spinner-ring { border-color: ${Y}; border-top-color: ${j}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${M("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${v}; }

.oc-sdk-separator { color: ${v}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${M(Y,40)}; }

.oc-sdk-progress-label { color: ${v}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${M(H,6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${j}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${b("status-success","currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${b("success-text","inherit")}; }

.oc-sdk-text a { color: ${yt}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${M(Y,60)}; }
`,N=`
${Ze}
${bn}
${jo}`;var $t=[{id:"reasoning",label:"Raciocínio"},{id:"coding",label:"Python/SQL"},{id:"debugging",label:"Debug"},{id:"delphi",label:"Delphi"},{id:"csharp",label:"C#"},{id:"firebird",label:"Firebird"}],y=kt(),r={surface:"panel",tab:"ranking",sessionModelRaw:null,sessionNvidiaModel:null,backendUrl:"http://127.0.0.1:8765",backendOnline:!1,health:null,notice:"Conectando ao serviço local do ModelArena...",noticeError:!1,models:[],codingOnly:!0,search:"",selectedModels:[],selectedCategories:$t.map(e=>e.id),repeats:1,rankingCat:"",ranking:[],recommendation:null,activeJob:null,history:[],expandedRunId:null,expandedRunDetail:null,schedule:null,busy:!1},me=null;function Mn(e){if(!e)return null;let n=e.trim(),s=["console-nvidia/","nvidia/","nvidia-nim/"];for(let c of s)if(n.toLowerCase().startsWith(c))return n.slice(c.length);return null}function x(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function L(e,n,s){let c=await y.serviceRequest({method:e,path:n,body:s!==void 0?JSON.stringify(s):void 0}),a=null;try{a=c.body?JSON.parse(c.body):null}catch{a=c.body}if(c.status<200||c.status>=300){let d=a&&typeof a=="object"&&"detail"in a?String(a.detail):`Erro HTTP ${c.status}`,O=new Error(d);throw a&&typeof a=="object"&&"code"in a&&(O.code=String(a.code)),O}return a}async function Ae(){try{let e=await L("GET","/config");e.backendUrl&&(r.backendUrl=e.backendUrl)}catch{}try{let e=await L("GET","/arena/health");r.health=e,r.backendOnline=!0,r.noticeError=!1,r.notice=e.nvidia_configured?`Backend conectado (${r.backendUrl}) · NVIDIA NIM pronta.`:"Backend conectado, mas NVIDIA_API_KEY ainda não está configurada em backend/.env.";let[n,s,c,a,d]=await Promise.all([L("GET",r.rankingCat?`/arena/ranking?category=${encodeURIComponent(r.rankingCat)}`:"/arena/ranking"),L("GET","/arena/recommendation"),L("GET","/arena/history?limit=40"),L("GET","/arena/benchmarks/jobs?limit=5"),L("GET","/arena/schedule")]);r.ranking=n.data||[],r.recommendation=s,r.history=c.data||[],r.schedule=d;let O=(a.data||[]).find(h=>h.status==="running"||h.status==="queued")||null;r.activeJob=O,de(),e.nvidia_configured&&r.models.length===0&&await Jo(!1)}catch(e){r.backendOnline=!1,r.noticeError=!0,r.notice=e instanceof Error?e.message:"Serviço local do ModelArena indisponível."}I()}async function Jo(e=!0){try{let n=await L("GET","/arena/models");r.models=n.data||[],r.sessionNvidiaModel&&!r.selectedModels.includes(r.sessionNvidiaModel)&&r.models.some(s=>s.id===r.sessionNvidiaModel)&&(r.selectedModels=[r.sessionNvidiaModel,...r.selectedModels]),e&&await y.toast({kind:"success",message:`${n.coding_total??r.models.length} modelos NVIDIA de código carregados.`})}catch(n){r.noticeError=!0,r.notice=n instanceof Error?n.message:"Erro ao listar modelos NVIDIA."}I()}function de(){let e=r.activeJob&&(r.activeJob.status==="running"||r.activeJob.status==="queued");e&&me===null?me=window.setInterval(()=>{qo()},1800):!e&&me!==null&&(window.clearInterval(me),me=null)}async function qo(){if(!r.activeJob){de();return}try{let e=await L("GET",`/arena/benchmarks/jobs/${r.activeJob.id}`);r.activeJob=e.job,e.job.status!=="running"&&e.job.status!=="queued"?(de(),await y.toast({kind:e.job.status==="completed"?"success":"info",message:`Model Arena: benchmark ${e.job.status} (${e.job.succeeded_steps}/${e.job.total_steps}).`}),await Ae()):I()}catch{de()}}async function zo(e){let n=e&&e.length?e:r.selectedModels;if(!n.length||!r.selectedCategories.length){await y.toast({kind:"error",message:"Selecione pelo menos um modelo e uma categoria."});return}r.busy=!0,I();try{let s=await L("POST","/arena/benchmarks/jobs",{models:n,categories:r.selectedCategories,repeats:r.repeats});r.activeJob=s.job,r.noticeError=!1,r.notice=`Benchmark iniciado (${s.job.total_steps} avaliações em background).`,de(),await y.toast({kind:"info",message:`Benchmark iniciado para ${n.length} modelo(s).`})}catch(s){r.noticeError=!0,r.notice=s instanceof Error?s.message:"Falha ao iniciar benchmark."}finally{r.busy=!1,I()}}async function Cn(){if(r.activeJob)try{await L("POST",`/arena/benchmarks/jobs/${r.activeJob.id}/cancel`),await y.toast({kind:"info",message:"Cancelamento solicitado."}),await qo()}catch(e){r.noticeError=!0,r.notice=e instanceof Error?e.message:"Não foi possível cancelar o job.",I()}}async function yn(e){if(r.expandedRunId===e){r.expandedRunId=null,r.expandedRunDetail=null,I();return}try{let n=await L("GET",`/arena/runs/${e}`);r.expandedRunId=e,r.expandedRunDetail=n}catch(n){r.noticeError=!0,r.notice=n instanceof Error?n.message:"Erro ao abrir detalhes da execução."}I()}async function Un(){let e=r.recommendation?.primary_coding_model;if(!e)return;let n=["Resultado atual do Model Arena (NVIDIA NIM):",`- Modelo principal recomendado: \`${e.openchamber_model_ref}\` (${e.composite_score}/100 composta · ${e.quality_score}/100 qualidade real · ${Math.round(e.avg_latency_ms)} ms).`,`- Motivo: ${e.rationale}`];await y.compose({text:n.join(`
`),mode:"append"}),await y.toast({kind:"success",message:"Resumo do ranking enviado para a caixa de chat."})}function Nn(){return`
    <div class="ma-card">
      <div class="ma-badge">Backend Local Offline</div>
      <strong>Inicie o serviço ModelArena para rodar benchmarks</strong>
      <p class="ma-subtitle">O painel do OpenChamber se conecta via serviço local autenticado a <code class="ma-mono">${x(r.backendUrl)}</code>.</p>
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
          <strong class="ma-mono" style="font-size:14px">${x(n.model_id)}</strong>
          <span class="ma-score">${n.composite_score}<small style="font-size:10px;color:var(--ma-muted)">/100</small></span>
        </div>
        <div class="ma-subtitle" style="color:var(--ma-fg);opacity:.9">${x(n.rationale)}</div>
        <div class="ma-btn-row">
          <button class="ma-btn primary" data-action="copy-ref" data-ref="${x(n.openchamber_model_ref)}">Copiar ref OpenChamber</button>
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
    `,c=[`<button class="ma-chip ${r.rankingCat?"":"selected"}" data-action="rank-cat" data-cat="">Geral</button>`,...$t.map(d=>`<button class="ma-chip ${r.rankingCat===d.id?"selected":""}" data-action="rank-cat" data-cat="${d.id}">${d.label}</button>`)].join(""),a=r.ranking.length?r.ranking.map((d,O)=>{let h=r.sessionNvidiaModel&&d.model_id===r.sessionNvidiaModel,V=Object.entries(d.category_scores||{}).map(([K,q])=>`${K}:${q}`).join(" · ");return`
            <div class="ma-rank-item">
              <div class="ma-place ${O===0?"gold":""}">${d.rank||O+1}</div>
              <div class="ma-rank-body">
                <div class="ma-row">
                  <strong class="ma-mono">${x(d.model_id)}</strong>
                  ${h?'<span class="ma-badge">Sessão atual</span>':""}
                </div>
                <div class="ma-bar"><i style="width:${Math.min(100,Math.max(0,d.composite_score))}%"></i></div>
                <div class="ma-meta">
                  <span>Qual.: <b>${d.quality_score}</b></span>
                  <span>Testes: <b>${d.execution_pass_rate!==null?`${d.execution_pass_rate}%`:"—"}</b></span>
                  <span>${Math.round(d.avg_latency_ms)} ms</span>
                  ${d.avg_tokens_per_second?`<span>${d.avg_tokens_per_second} tok/s</span>`:""}
                </div>
                ${V?`<div class="ma-subtitle" style="margin-top:3px">${x(V)}</div>`:""}
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
      <div class="ma-chips">${c}</div>
      <div>${a}</div>
    </div>
  `}function Pn(){let e=r.search.trim().toLowerCase(),n=r.models.filter(a=>!(r.codingOnly&&a.is_coding_candidate===!1||e&&!a.id.toLowerCase().includes(e)&&!(a.vendor||"").toLowerCase().includes(e))),s=n.length?n.slice(0,50).map(a=>{let d=r.selectedModels.includes(a.id);return`
            <label class="ma-model-opt ${d?"selected":""}">
              <input type="checkbox" data-action="toggle-model" data-model="${x(a.id)}" ${d?"checked":""} />
              <div style="min-width:0">
                <div class="ma-mono" style="font-size:11.5px;font-weight:600">${x(a.id)}</div>
                <div class="ma-subtitle">${x(a.vendor||"nvidia")}${a.tags?.length?` · ${x(a.tags.join(", "))}`:""}</div>
              </div>
            </label>
          `}).join(""):'<p class="ma-subtitle">Nenhum modelo carregado. Clique em "Carregar modelos" (requer NVIDIA_API_KEY no backend).</p>',c=$t.map(a=>`<button class="ma-chip ${r.selectedCategories.includes(a.id)?"selected":""}" data-action="toggle-cat" data-cat="${a.id}">${a.label}</button>`).join("");return`
    <div class="ma-card">
      <div class="ma-row">
        <strong>Selecionar Modelos (${r.selectedModels.length})</strong>
        <div class="ma-btn-row">
          <button class="ma-btn" data-action="load-models">Atualizar lista</button>
          <button class="ma-btn" data-action="select-top">Top 4</button>
        </div>
      </div>
      <input class="ma-input" id="ma-search" placeholder="Filtrar modelos (ex: glm, nemotron, qwen, deepseek)..." value="${x(r.search)}" />
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
      <div class="ma-chips">${c}</div>
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="start-bench" ${r.busy||r.activeJob&&r.activeJob.status==="running"?"disabled":""}>
          Iniciar Benchmark (${r.selectedModels.length} modelo${r.selectedModels.length===1?"":"s"})
        </button>
      </div>
    </div>
  `}function wn(){let e=r.schedule,n=r.history.length?r.history.slice(0,20).map(s=>{let c=r.expandedRunId===s.id&&r.expandedRunDetail,a=c?`
              <div style="margin-top:6px;display:flex;flex-direction:column;gap:5px">
                ${(c.evaluation?.criteria||[]).map(d=>`
                      <div class="ma-crit ${d.passed?"pass":"fail"}">
                        <span><b>${d.passed?"✓":"✗"} ${x(d.name)}</b> — ${x(d.detail)}</span>
                        <span>${d.earned}/${d.weight}</span>
                      </div>
                    `).join("")}
                ${c.evaluation?.code_extracted?`<pre class="ma-code">${x(c.evaluation.code_extracted)}</pre>`:""}
                ${c.error?`<div class="ma-notice error">${x(c.error)}</div>`:""}
              </div>
            `:"";return`
            <div class="ma-run-row" data-action="inspect-run" data-run-id="${s.id}">
              <div class="ma-row">
                <strong class="ma-mono" style="font-size:11px">${x(s.model_id)}</strong>
                <span class="ma-score" style="font-size:12px">${s.score}/100</span>
              </div>
              <div class="ma-meta">
                <span>${x(s.category)} / ${x(s.task_id)}</span>
                <span>${s.tests_total?`${s.tests_passed}/${s.tests_total} testes`:s.status}</span>
                <span>${Math.round(s.latency_ms||0)} ms</span>
              </div>
              ${a}
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
  `}function Dn(){return`
    <div class="ma-card">
      <strong>Conexão com Backend ModelArena</strong>
      <div class="ma-subtitle">A chave NVIDIA_API_KEY permanece apenas no backend local (nunca trafega no painel).</div>
      <input class="ma-input ma-mono" id="ma-backend-url" value="${x(r.backendUrl)}" />
      <div class="ma-btn-row">
        <button class="ma-btn primary" data-action="save-backend-url">Salvar URL e reconectar</button>
        <button class="ma-btn" data-action="open-web">Abrir Dashboard Web</button>
      </div>
    </div>
  `}function I(){let e=document.getElementById("root");if(!e)return;let n=r.activeJob&&(r.activeJob.status==="running"||r.activeJob.status==="queued")?`
        <div class="ma-card">
          <div class="ma-row">
            <strong>Benchmark em andamento (${r.activeJob.completed_steps}/${r.activeJob.total_steps} · ${r.activeJob.progress_percent}%)</strong>
            <button class="ma-btn danger" data-action="cancel-job">Cancelar</button>
          </div>
          <div class="ma-subtitle ma-mono">${x(r.activeJob.current_model||"Preparando...")} ${r.activeJob.current_task_id?`→ ${x(r.activeJob.current_task_id)}`:""}</div>
          <div class="ma-bar"><i style="width:${r.activeJob.progress_percent}%"></i></div>
        </div>
      `:"",s=r.sessionModelRaw?`
      <div class="ma-session-pill">
        <span>Sessão OpenChamber:</span>
        <strong class="ma-mono">${x(r.sessionModelRaw)}</strong>
      </div>
    `:"",c="";!r.backendOnline&&r.tab!=="connection"?c=Nn():r.tab==="ranking"?c=Ln():r.tab==="run"?c=Pn():r.tab==="automation"?c=wn():c=Dn();let a=r.backendOnline?r.health?.nvidia_configured?"ma-dot":"ma-dot warn":"ma-dot offline",d=r.backendOnline?r.health?.nvidia_configured?"NVIDIA NIM":"Sem Key":"Offline";e.innerHTML=`
    <div class="ma-shell ${r.surface==="page"?"ma-page":""}">
      <header class="ma-header">
        <div class="ma-brand">
          <div class="ma-logo">MA</div>
          <div>
            <h1 class="ma-title">Model Arena</h1>
            <p class="ma-subtitle">NVIDIA NIM Benchmark</p>
          </div>
        </div>
        <div class="ma-status"><span class="${a}"></span><span>${d}</span></div>
      </header>
      ${s}
      <nav class="ma-tabs">
        <button class="ma-tab ${r.tab==="ranking"?"active":""}" data-action="tab" data-tab="ranking">Ranking</button>
        <button class="ma-tab ${r.tab==="run"?"active":""}" data-action="tab" data-tab="run">Executar</button>
        <button class="ma-tab ${r.tab==="automation"?"active":""}" data-action="tab" data-tab="automation">Automático</button>
        <button class="ma-tab ${r.tab==="connection"?"active":""}" data-action="tab" data-tab="connection">Conexão</button>
      </nav>
      <div class="ma-notice ${r.noticeError?"error":""}">${x(r.notice)}</div>
      ${n}
      ${c}
    </div>
  `,Gn(e)}function Gn(e){let n=e.querySelector("#ma-search");n&&n.addEventListener("input",()=>{r.search=n.value,I();let s=document.querySelector("#ma-search");s&&(s.focus(),s.setSelectionRange(r.search.length,r.search.length))}),e.querySelector("#ma-coding-only")?.addEventListener("change",s=>{r.codingOnly=s.target.checked,I()}),e.querySelector("#ma-repeats")?.addEventListener("change",s=>{r.repeats=Number(s.target.value)}),e.querySelectorAll('input[data-action="toggle-model"]').forEach(s=>{s.addEventListener("change",()=>{let c=s.dataset.model;c&&(r.selectedModels=s.checked?[...new Set([...r.selectedModels,c])]:r.selectedModels.filter(a=>a!==c),I())})}),e.querySelectorAll("[data-action]").forEach(s=>{s.tagName!=="INPUT"&&s.addEventListener("click",()=>{let c=s.dataset.action;if(c==="tab")r.tab=s.dataset.tab||"ranking",I();else if(c==="goto-run")r.tab="run",I();else if(c==="goto-connection")r.tab="connection",I();else if(c==="refresh")Ae();else if(c==="load-models")Jo(!0);else if(c==="select-top"){let a=r.models.filter(O=>O.is_coding_candidate!==!1).slice(0,4).map(O=>O.id),d=r.sessionNvidiaModel?[r.sessionNvidiaModel,...a]:a;r.selectedModels=[...new Set(d)].slice(0,5),I()}else if(c==="rank-cat")r.rankingCat=s.dataset.cat||"",Ae();else if(c==="toggle-cat"){let a=s.dataset.cat;if(!a)return;r.selectedCategories=r.selectedCategories.includes(a)?r.selectedCategories.filter(d=>d!==a):[...r.selectedCategories,a],I()}else if(c==="start-bench")zo();else if(c==="bench-session"&&r.sessionNvidiaModel)zo([r.sessionNvidiaModel]);else if(c==="cancel-job")Cn();else if(c==="copy-ref"){let a=s.dataset.ref||"";y.writeClipboard(a).then(()=>y.toast({kind:"success",message:`Copiado: ${a}`}))}else if(c==="copy-cmd")y.writeClipboard(".\\scripts\\start-modelarena.ps1").then(()=>y.toast({kind:"success",message:"Comando copiado para a área de transferência."}));else if(c==="compose-rec")Un();else if(c==="open-web")y.openUrl(r.backendUrl);else if(c==="inspect-run"){let a=Number(s.dataset.runId);Number.isFinite(a)&&yn(a)}else if(c==="save-schedule"){let a=!!e.querySelector("#ma-sched-enabled")?.checked,d=Number(e.querySelector("#ma-sched-interval")?.value||360),O=e.querySelector("#ma-sched-mode")?.value||"auto_coding";L("PUT","/arena/schedule",{enabled:a,interval_minutes:d,model_selection_mode:O,max_auto_models:5,models:r.selectedModels,categories:r.selectedCategories,repeats:r.repeats}).then(h=>(r.schedule=h,y.toast({kind:"success",message:h.enabled?"Agendamento ativado!":"Agendamento salvo."}))).then(()=>I()).catch(h=>{r.noticeError=!0,r.notice=h instanceof Error?h.message:"Erro ao salvar agendamento.",I()})}else if(c==="run-schedule-now")L("POST","/arena/schedule/run-now").then(a=>(a.job&&(r.activeJob=a.job,de()),y.toast({kind:"info",message:"Execução agendada iniciada agora."}))).then(()=>I()).catch(a=>{r.noticeError=!0,r.notice=a instanceof Error?a.message:"Erro ao executar agendamento.",I()});else if(c==="save-backend-url"){let a=e.querySelector("#ma-backend-url")?.value||"";L("PUT","/config",{backendUrl:a}).then(d=>(r.backendUrl=d.backendUrl,y.toast({kind:"success",message:`Backend atualizado: ${d.backendUrl}`}))).then(()=>Ae()).catch(d=>{r.noticeError=!0,r.notice=d instanceof Error?d.message:"URL inválida.",I()})}})})}function Yo(e){r.sessionModelRaw=e?.model||null,r.sessionNvidiaModel=Mn(e?.model),I()}y.onReady(e=>{vt(e,document.documentElement),r.surface=e.surface,Yo(e.session),Ae()});y.onSession(e=>{Yo(e)});I();})();
