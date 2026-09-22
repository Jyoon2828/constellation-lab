/* Drawing model shared by the SVG editor and PNG renderer. No dependencies. */
(function(root){
'use strict';
const WIDTH=1200,HEIGHT=700,MAX_STARS=15,MAX_STROKES=40;
const copy=x=>JSON.parse(JSON.stringify(x));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const blank=()=>({stars:[],lines:[],strokes:[],nextId:1});
function point(x,y){return {x:clamp(Number(x)||0,.025,.975),y:clamp(Number(y)||0,.045,.955)}}
function addStar(d,x,y,size=1,brightness=1){if(d.stars.length>=MAX_STARS)return null;const id='s'+d.nextId++;d.stars.push({id,...point(x,y),size:clamp(size,0,2),brightness:clamp(brightness,0,2)});return id}
function moveStar(d,id,x,y){const star=d.stars.find(s=>s.id===id);if(!star)return false;Object.assign(star,point(x,y));return true}
function removeStar(d,id){d.stars=d.stars.filter(s=>s.id!==id);d.lines=d.lines.filter(l=>l.a!==id&&l.b!==id)}
function connect(d,a,b){if(a===b)return 'same';if(!d.stars.some(s=>s.id===a)||!d.stars.some(s=>s.id===b))return 'missing';if(d.lines.some(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a)))return 'duplicate';d.lines.push({id:'l'+d.nextId++,a,b});return 'added'}
function largestGroup(d){const adjacent=new Map(d.stars.map(s=>[s.id,[]]));for(const l of d.lines){adjacent.get(l.a)?.push(l.b);adjacent.get(l.b)?.push(l.a)}let max=0,seen=new Set();for(const star of d.stars){if(seen.has(star.id))continue;const stack=[star.id];let count=0;while(stack.length){const id=stack.pop();if(seen.has(id))continue;seen.add(id);count++;for(const n of adjacent.get(id)||[])stack.push(n)}max=Math.max(max,count)}return max}
function normalize(input){const d=blank();if(!input||typeof input!=='object')return d;const used=new Set();for(const s of (Array.isArray(input.stars)?input.stars:[]).slice(0,MAX_STARS)){if(!s||typeof s.id!=='string'||!/^s\d+$/.test(s.id)||used.has(s.id)||!Number.isFinite(s.x)||!Number.isFinite(s.y))continue;used.add(s.id);d.stars.push({id:s.id,...point(s.x,s.y),size:[0,1,2].includes(s.size)?s.size:1,brightness:[0,1,2].includes(s.brightness)?s.brightness:1})}const pairs=new Set();for(const l of (Array.isArray(input.lines)?input.lines:[]).slice(0,105)){if(!l||!used.has(l.a)||!used.has(l.b)||l.a===l.b)continue;const key=[l.a,l.b].sort().join(':');if(pairs.has(key))continue;pairs.add(key);d.lines.push({id:'l'+d.nextId++,a:l.a,b:l.b})}for(const st of (Array.isArray(input.strokes)?input.strokes:[]).slice(0,MAX_STROKES)){if(!st||!Array.isArray(st.points))continue;const pts=st.points.slice(0,180).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>point(p.x,p.y));if(pts.length>1)d.strokes.push({id:'p'+d.nextId++,points:pts})}const highest=Math.max(0,...d.stars.map(s=>Number(s.id.slice(1))),...d.lines.map(l=>Number(l.id.slice(1))),...d.strokes.map(st=>Number(st.id.slice(1))));d.nextId=highest+1;return d}
function distanceToSegment(p,a,b){const px=p.x*WIDTH,py=p.y*HEIGHT,ax=a.x*WIDTH,ay=a.y*HEIGHT,bx=b.x*WIDTH,by=b.y*HEIGHT;const dx=bx-ax,dy=by-ay;const t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy)}
function nearestStar(d,p,r){let found=null,best=r;for(const s of d.stars){const distance=Math.hypot((p.x-s.x)*WIDTH,(p.y-s.y)*HEIGHT);if(distance<best){best=distance;found=s}}return found}
function eraseStroke(d,p,r){const i=d.strokes.findIndex(st=>st.points.slice(1).some((b,j)=>distanceToSegment(p,st.points[j],b)<r));if(i<0)return false;d.strokes.splice(i,1);return true}
function backgroundStars(){let seed=18473;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};return Array.from({length:155},()=>({x:rand(),y:rand(),r:.5+rand()*.8,opacity:.12+rand()*.25}))}
const API={WIDTH,HEIGHT,MAX_STARS,MAX_STROKES,copy,clamp,blank,point,addStar,moveStar,removeStar,connect,largestGroup,normalize,distanceToSegment,nearestStar,eraseStroke,backgroundStars};
if(typeof module==='object'&&module.exports)module.exports=API;else root.ConstellationCore=API;
})(typeof window!=='undefined'?window:globalThis);
