/* Mock order store for the isolated order-prep preview. Local device storage only.
   This is a LABELED SIMULATION: no backend, no real registration, no cross-device sync.
   The real version would store orders centrally and let the merchant update status. */
(function(){
'use strict';
var KEY='vitalia-preview-mock-orders-v1';
var STEPS=[{k:'new',label:'جديد'},{k:'prep',label:'قيد التجهيز'},{k:'ready',label:'جاهز'},{k:'done',label:'تم التسليم'}];
function read(){try{var v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)?v:null;}catch(e){return null;}}
function write(list){try{localStorage.setItem(KEY,JSON.stringify(list));return true;}catch(e){return false;}}
function list(){return read()||[];}
function save(list){write(list);}
function nextCode(existing){var c;do{c='V-'+(1000+Math.floor(Math.random()*9000));}while(existing.indexOf(c)>=0);return c;}
function add(o){
 var all=list();
 o.code=nextCode(all.map(function(x){return x.code;}));
 o.ts=Date.now();
 o.status='new';
 all.push(o);
 save(all);
 return o;
}
function setStatus(code,k){
 if(!STEPS.some(function(s){return s.k===k;}))return false;
 var all=list(),found=false;
 all.forEach(function(o){if(o.code===code){o.status=k;found=true;}});
 if(found)save(all);
 return found;
}
function find(code){return list().filter(function(o){return o.code===code;})[0]||null;}
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
/* Items are stored as {code:'E01137',qty:4} with the unified short code. */
function itemSummary(items){
 var pm=productsMap(),total=0,count=0;
 items.forEach(function(it){var x=pm.get('VTL-'+it.code);count+=it.qty;if(x)total+=x.price*it.qty;});
 return {total:total,count:count,kinds:items.length};
}
function itemsLink(items){return items.map(function(it){return it.code+'.'+it.qty;}).join(',');}
/* Two clearly-fake seeded orders so the pages are reviewable before any flow is run. */
function seedIfEmpty(){
 if(read()!==null)return;
 var now=Date.now();
 save([
  {code:'V-1042',ts:now-26*3600*1000,name:'عميلة تجريبية أولى',method:'delivery',address:'عنوان تجريبي غير حقيقي',items:[{code:'P00043',qty:2},{code:'P00045',qty:1}],status:'done'},
  {code:'V-2087',ts:now-2*3600*1000,name:'عميل تجريبي ثانٍ',method:'delivery',address:'عنوان تجريبي غير حقيقي',items:[{code:'E01137',qty:4},{code:'P00040',qty:1}],status:'prep'}
 ]);
}
window.VTLMockOrders={STEPS:STEPS,list:list,add:add,setStatus:setStatus,find:find,productsMap:productsMap,itemSummary:itemSummary,itemsLink:itemsLink,seedIfEmpty:seedIfEmpty};
})();
