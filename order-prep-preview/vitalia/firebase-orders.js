/* Real Firebase backend for the isolated order-prep preview.
   TEST ENVIRONMENT: connected to the vitalia-orders Firebase project; used with fake test data only.
   Access is enforced server-side by Firestore security rules:
   - orders/{id}: customer create-only (validated), merchant read/status-update/delete.
   - order_status/{id}: customer create-only (no PII), public single-doc read by unguessable id,
     no listing; merchant status-update/delete. */
(function(){
'use strict';
if(!window.VTL_FIREBASE_CONFIG)return;
firebase.initializeApp(window.VTL_FIREBASE_CONFIG);
var db=firebase.firestore(),auth=firebase.auth();
var STEPS=[{k:'new',label:'جديد'},{k:'prep',label:'قيد التجهيز'},{k:'ready',label:'جاهز'},{k:'done',label:'تم التسليم'}];
var LOCAL_KEY='vitalia-preview-real-orders-v1';
function genCode(){return 'V-'+(1000+Math.floor(Math.random()*9000));}
function itemsLink(items){return items.map(function(it){return it.code+'.'+it.qty;}).join(',');}
function parseItems(s){return String(s||'').split(',').filter(Boolean).map(function(p){var m=p.split('.');return {code:m[0],qty:Number(m[1])||1};});}
function createOrder(o){
 var ref=db.collection('orders').doc(),code=genCode(),now=firebase.firestore.FieldValue.serverTimestamp();
 var items=itemsLink(o.items),total=Math.round(Number(o.total)||0);
 var batch=db.batch();
 batch.set(ref,{
  code:code,createdAt:now,
  name:String(o.name||'').slice(0,100),
  method:o.method==='pickup'?'pickup':'delivery',
  address:String(o.address||'').slice(0,300),
  phone:String(o.phone||'').slice(0,30),
  notes:String(o.notes||'').slice(0,300),
  items:items,total:total,status:'new'
 });
 batch.set(db.collection('order_status').doc(ref.id),{code:code,createdAt:now,items:items,total:total,status:'new'});
 return batch.commit().then(function(){var rec={id:ref.id,code:code,ts:Date.now()};remember(rec);return rec;});
}
function getStatus(id){return db.collection('order_status').doc(id).get().then(function(d){return d.exists?Object.assign({id:d.id},d.data()):null;});}
function listOrders(){return db.collection('orders').get().then(function(q){var a=[];q.forEach(function(d){a.push(Object.assign({id:d.id},d.data()));});a.sort(function(x,y){return ((y.createdAt&&y.createdAt.seconds)||0)-((x.createdAt&&x.createdAt.seconds)||0);});return a;});}
function setStatus(id,k){
 if(!STEPS.some(function(s){return s.k===k;}))return Promise.reject(new Error('bad status'));
 var b=db.batch();
 b.update(db.collection('orders').doc(id),{status:k});
 b.update(db.collection('order_status').doc(id),{status:k});
 return b.commit();
}
function signIn(e,p){return auth.signInWithEmailAndPassword(e,p);}
function signOut(){return auth.signOut();}
function onAuth(f){return auth.onAuthStateChanged(f);}
function remember(rec){try{var l=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');l.push(rec);localStorage.setItem(LOCAL_KEY,JSON.stringify(l));}catch(e){}}
function listLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');}catch(e){return [];}}
/* Same product/price derivation as the site's cart and order.html. Requires CTL_COMPANIES. */
var _products=null;
function productsMap(){
 if(_products)return _products;
 var products=new Map(), samples=['vatika','eva'], previousIndex=0, oldVisualIndex=0;
 CTL_COMPANIES.forEach(function(co){co.products.forEach(function(p){if(p.source==='excel')return;p.oldVisualIndex=oldVisualIndex;oldVisualIndex+=(p.v||[null]).length;if(!samples.includes(co.id)){p.oldNumber=++previousIndex;p.code=p.code||'VTL-P'+String(previousIndex).padStart(5,'0');}});});
 CTL_COMPANIES.forEach(function(co){co.products.forEach(function(p){
  (p.v||[null]).forEach(function(v){
   var x={code:p.code||'',name:p.n+(v?' - '+v.n:''),brand:co.ar,img:p.pending?'':(v?v.img:p.img),price:50+((p.source==='excel'?Number(p.code.slice(5)):p.oldVisualIndex)%9)*15};
   if(x.code&&!products.has(x.code))products.set(x.code,x);
  });
 });});
 _products=products;return products;
}
function itemSummary(items){
 var pm=productsMap(),total=0,count=0;
 items.forEach(function(it){var x=pm.get('VTL-'+it.code);count+=it.qty;if(x)total+=x.price*it.qty;});
 return {total:total,count:count,kinds:items.length};
}
window.VTLFbOrders={STEPS:STEPS,createOrder:createOrder,getStatus:getStatus,listOrders:listOrders,setStatus:setStatus,signIn:signIn,signOut:signOut,onAuth:onAuth,listLocal:listLocal,productsMap:productsMap,itemSummary:itemSummary,itemsLink:itemsLink,parseItems:parseItems};
})();
