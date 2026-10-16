// No app/page caching: GitHub updates keep loading normally.
// Firebase displays background notification payloads. This handler updates badges.
self.addEventListener('notificationclick',event=>{
 const target=event.notification.data?.url||event.notification.data?.FCM_MSG?.fcmOptions?.link;if(!target)return;
 const url=new URL(target,self.registration.scope);if(url.origin!==self.location.origin)return;
 event.stopImmediatePropagation();event.notification.close();
 event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const client=windows.find(c=>c.url.startsWith(self.registration.scope));if(client){await client.navigate(url.href);await client.focus()}else await self.clients.openWindow(url.href)})());
});
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({"apiKey":"AIzaSyCKLe6iYLGfT9Qg3xZ3GYinJ9v12DrMvzY","authDomain":"rusty-cup-34753.firebaseapp.com","projectId":"rusty-cup-34753","storageBucket":"rusty-cup-34753.firebasestorage.app","messagingSenderId":"547001204300","appId":"1:547001204300:web:152aff0608f202d846bee9","measurementId":"G-M9QGZD8HC4"});
const messaging=firebase.messaging();
const database=new Promise((resolve,reject)=>{const r=indexedDB.open('rustycup-push',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
let badgeQueue=Promise.resolve();
function applyBadge(data){badgeQueue=badgeQueue.catch(()=>{}).then(()=>writeBadge(data));return badgeQueue}
async function writeBadge(data){
 const db=await database;
 const state=await new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),r=store.get('active');let next=null;
  r.onsuccess=()=>{const current=r.result;
   if(data.reset){next={deviceId:null,revision:0,unreadCount:0};store.put(next,'active');return}
   if(!data.deviceId||(!data.activate&&current?.deviceId!==data.deviceId))return;
   if(current?.deviceId===data.deviceId&&Number(data.revision)<current.revision)return;
   next={deviceId:data.deviceId,revision:Number(data.revision)||0,unreadCount:Math.max(0,Number(data.unreadCount)||0)};store.put(next,'active');
  };tx.oncomplete=()=>resolve(next);tx.onerror=()=>reject(tx.error);
 });
 if(!state)return;
 if(state.unreadCount>0&&self.navigator.setAppBadge)await self.navigator.setAppBadge(state.unreadCount);
 else if(self.navigator.clearAppBadge)await self.navigator.clearAppBadge();
}
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.kind==='RUSTYCUP_BADGE')event.waitUntil(applyBadge(event.data).catch(()=>{}))});
messaging.onBackgroundMessage(payload=>applyBadge(payload.data||{}).catch(()=>{}));
