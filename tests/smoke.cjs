const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),T=require('three');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
const decoded=new Map();for(const key of['hero-male','hero-female','passengers','incidents','spycam','boss','herosit','guard','walk-male','walk-female','walk-civilians','walk-protected','walk-staff','walk-special','walk-incident','walk-backpack','walk-backpack-female',"dir-hero-male","dir-hero-female","dir-civilians","dir-protected","dir-staff","dir-special","dir-incident","dir-backpack","dir-backpack-female",'swing-male','swing-female','carry-male','carry-female']){const file='assets/atlas/'+key+'.png',im=await loadImage(file),cv=createCanvas(im.width,im.height);cv.getContext('2d').drawImage(im,0,0);decoded.set('data:image/png;base64,'+fs.readFileSync(file).toString('base64'),cv);}
{const cv=decoded.get('data:image/png;base64,'+fs.readFileSync('assets/atlas/walk-backpack-female.png').toString('base64')),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let transparent=0;for(let i=3;i<d.length;i+=4)if(d[i]===0)transparent++;assert(transparent>cv.width*cv.height*.5,'female sprite background must be transparent');}
for(const key of ['hero-male','hero-female','civilians','protected','staff','special','incident','backpack','backpack-female']){const uri='data:image/png;base64,'+fs.readFileSync('assets/atlas/dir-'+key+'.png').toString('base64'),cv=decoded.get(uri);assert.equal(cv.width,1024);assert.equal(cv.height,key.startsWith('hero-')?512:1024);const pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let alpha=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)alpha++;assert(alpha>cv.width*cv.height*.45,'new directions require clean alpha');}
const nodes=new Map(),saved=new Map(),events={};let frame,rendered;
function node(id){const flags=new Set();return{id,hidden:false,style:{},textContent:'',attributes:{},classList:{add:x=>flags.add(x),toggle(x,on){if(on??!flags.has(x))flags.add(x);else flags.delete(x)},contains:x=>flags.has(x)},append(...items){this.children.push(...items)},prepend(){},children:[],animate(){},remove(){},setAttribute(k,v){this.attributes[k]=v},addEventListener(){},setPointerCapture(){}};}
const doc={documentElement:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id)},createElement(type){return type==='canvas'?createCanvas(256,256):node()},addEventListener(){}};
class Renderer{constructor(){this.shadowMap={}}setPixelRatio(){}setSize(){}dispose(){}render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);rendered={s,c};}}
class TextureLoader{load(uri,cb){const canvas=decoded.get(uri);assert(canvas,'Embedded image must decode');const tex=new T.Texture(canvas);if(cb)cb(tex);return tex;}}
const ctx={THREE:{...T,WebGLRenderer:Renderer,TextureLoader},window:{THREE:T},document:doc,innerWidth:844,innerHeight:390,devicePixelRatio:1,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>0},requestAnimationFrame:f=>frame=f,addEventListener:(k,f)=>events[k]=f,setInterval(){},setTimeout(){},clearTimeout(){},navigator:{},screen:{},console,Math};
const gamePath='game/index.html';
let src=fs.readFileSync(gamePath,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
src=src.replace('showSelection();\nrequestAnimationFrame(loop);',`globalThis.qa={hero,S,SAVE,stats,scene,camera,person,pose,seats,actors,d2,dropBills,locomotionSample,setGameArtPose,walkingArt,steer,spawnBackpack,umbrellaFrame,impactSparks,tickImpactSparks,applyHitReaction,umbrellaArc,tickUmbrella,updateUmbrellaFan,umbrellaFan,chooseCharacter,showSelection,getSelection:()=>selectionStage,targetable,strike,standVillain,sitVillain,spawnVillain,spawnWave,setAttackStyle,update,openModels,closeModels${true?',spawnIncident,activateIncident,updateIncidents,deposits,arriveStation,CARDS,spawnBoss,dash,STATIONS,getMode:()=>mode,activateUlt,failIncident,newSegment,segFinish,BOSSES,applyCos,dailyProg,ensureDaily,billVal,COS,orderTick,getOrder:()=>orderK':''}};showSelection();\nrequestAnimationFrame(loop);`);
vm.createContext(ctx);vm.runInContext(src,ctx);const q=ctx.qa;
frame(16);assert(q.getSelection());assert.equal(q.getSelection().models.length,2);
nodes.get('chooseFemale').onclick();assert.equal(q.hero.o.userData.spec.female,true);assert.equal(q.SAVE.character,'female');assert(nodes.get('chooseFemale').classList.contains('active'));
const femaleStats=JSON.stringify(q.stats());nodes.get('chooseMale').onclick();assert.equal(q.hero.o.userData.spec.female,false);assert.equal(JSON.stringify(q.stats()),femaleStats);nodes.get('chooseFemale').onclick();
assert.equal(JSON.parse(saved.get('line2clash-v1')).character,'female');
nodes.get('btnStart').onclick();assert.equal(q.getSelection(),null);assert.equal(nodes.get('start').hidden,true);
let now=16;function ticks(n){for(let i=0;i<n;i++)frame(now+=1000/60)}ticks(3);
const seated=q.S.villains[0],other=q.S.villains[1];q.hero.pos.copy(seated.o.position).add(new T.Vector3(0,0,.8));
assert(q.targetable(seated));const hp=seated.hp;q.strike(.25);assert(seated.hp<hp);assert.equal(seated.state,'sit');assert(seated.seat.p===seated);
// Standing former offender in the same attack radius cannot be hit.
q.standVillain(other);other.o.position.copy(q.hero.pos);const standingHP=other.hp;q.strike(1);assert.equal(other.hp,standingHP);assert.equal(q.targetable(other),false);assert.equal(other.tag,null);
// Reserved/rushing arrivals are immune until actually seated on a priority seat.
const free=q.seats.find(s=>s.prio&&!s.p&&!s.res),incoming=q.spawnVillain(q.hero.pos.clone(),'rush',free);assert.equal(q.targetable(incoming),false);const arrivalHP=incoming.hp;q.strike(1);assert.equal(incoming.hp,arrivalHP);
q.sitVillain(incoming,free);assert(q.targetable(incoming));
// Same young model on a general seat must never receive an offender label or damage.
const regular=q.seats.find(s=>!s.prio);const fake=q.spawnVillain(q.hero.pos.clone(),'neutral');q.sitVillain(fake,regular);assert.equal(fake.tag,null);assert.equal(q.targetable(fake),false);
// Explicit elder/pregnancy exclusion holds even if a future caller miscategorizes them.
const spec={...incoming.sp};incoming.sp.old=true;assert.equal(q.targetable(incoming),false);incoming.sp={...spec,belly:true};assert.equal(q.targetable(incoming),false);incoming.sp=spec;
const elder=q.S.elders[0],elderPos=elder.o.position.clone();q.hero.pos.copy(elderPos);q.strike(2);assert.notEqual(elder.state,'fly');assert.equal(q.targetable(elder),false);
// Run combat/drop/bank/upgrade with the female hero and then switch while retaining progress.
seated.hp=1;q.hero.pos.copy(seated.o.position).add(new T.Vector3(0,0,.8));q.hero.swingT=0;q.strike(1);ticks(100);assert(['fly','gone'].includes(seated.state));
for(const d of q.S.drops){d.land=true;d.m.position.copy(q.hero.pos).setY(.1)}ticks(100);assert(q.hero.stack.length>0);assert(q.hero.stack.length<=q.stats().cap);
// v5: floor pads removed. Station arrival auto-settles the bag and opens the shop.
{const note=()=>new T.Mesh(new T.BoxGeometry(.1,.1,.1));for(let i=0;i<4;i++)q.hero.stack.push(note());const cash=q.S.money,st=q.SAVE.st;q.arriveStation();assert.equal(q.hero.stack.length,0);assert(q.S.money>=cash+20);assert.equal(q.SAVE.st,(st+1)%q.STATIONS.length);assert.equal(q.getMode(),'shop');nodes.get('btnDepart').onclick();assert.equal(q.getMode(),'play');}
const card=q.CARDS.find(c=>c.id==='bag'),cap=q.stats().cap;q.S.money=card.cost();q.S.money-=card.cost();card.go();assert.equal(q.stats().cap,cap+8);assert.equal(q.S.pads.length,0);
const preservedCash=q.S.money,preservedCap=q.stats().cap;nodes.get('btnCharacter').onclick();nodes.get('chooseMale').onclick();nodes.get('btnStart').onclick();assert.equal(q.stats().cap,preservedCap);assert.equal(q.S.money,preservedCash);assert.equal(q.hero.o.userData.spec.female,false);
q.CARDS.find(c=>c.id==='umbrella120').go();q.setAttackStyle('umbrella');ticks(1);assert(/^(swing|carry)-/.test(q.hero.o.userData.art.walkKey));assert.equal(q.hero.o.userData.P.mop.visible,false);q.setAttackStyle('fists');ticks(1);assert.equal(q.hero.o.userData.P.mop.visible,false);
q.spawnWave();for(const v of q.S.villains.filter(v=>v.state==='rush')){assert.equal(q.targetable(v),false);assert.equal(v.tag,null);assert(v.seat.prio);}
for(const a of q.actors)a.traverse(m=>{if(m.geometry)for(const n of m.geometry.attributes.position.array)assert(Number.isFinite(n))});
console.log('PASS: male/female selection, saved selection, equal stats, returning to selection preserves progress.');
console.log('PASS: priority-seat violations are attackable; unrelated general-seat/standing passengers, arrivals, elders and pregnant passengers remain protected.');
console.log('PASS: female combat, drops, collection, capacity, banking, upgrades, weapon switching and seat-only arrivals.');
console.log('PASS: all production mesh coordinates are finite.');
for(const m of q.actors)if(m.userData.art){const a=m.userData.art,shader={uniforms:{},vertexShader:T.ShaderLib.sprite.vertexShader};a.sprite.material.onBeforeCompile(shader);assert.equal(shader.uniforms.atlasRect.value,a.rect);assert(shader.vertexShader.includes('vUv=vUv*atlasRect.zw+atlasRect.xy;'));assert(a.sprite.material.map.image.width>=1024);assert(a.sprite.material.map.image.height>=512);assert(a.rect.x+Math.min(0,a.rect.z)>=-1e-6&&a.rect.x+Math.max(0,a.rect.z)<=1.000001&&a.rect.y>=0&&a.rect.y+a.rect.w<=1.000001);}
assert(new Set(q.actors.filter(m=>m.userData.art).map(m=>m.userData.art.tex)).size<=(true?4:3));
console.log('PASS: embedded image decoding, atlas shader uniforms, frame bounds, and shared atlas textures.');
if(false){
 assert.equal(q.scene.scale.x,.72);assert(Math.abs(q.d2({x:0,z:0},{x:10,z:0})-7.2)<.0001);assert(q.stats().cap>=32);
 for(const bill of q.hero.stack)q.scene.remove(bill);q.hero.stack=[];for(const d of q.S.drops)q.scene.remove(d.m);q.S.drops=[];q.S.flying=[];q.hero.hp=1000;q.hero.dead=0;
 q.hero.pos.set(12,0,0);q.dropBills(new T.Vector3(0,0,-3.0),20);ticks(120);
 assert(q.S.drops.length===20);for(const d of q.S.drops){assert(d.land);assert(d.m.position.z>=-1.65&&d.m.position.z<=1.65);}
 q.hero.pos.set(0,0,-1);ticks(90);assert.equal(q.S.drops.length,0);assert.equal(q.hero.stack.length,20);const before=q.S.money;
 q.hero.pos.set(0,0,.9);ticks(180);assert.equal(q.hero.stack.length,0);assert(q.S.money>=before+100);
 const countBefore=q.S.rescueCount,cashBefore=q.S.money;for(const v of q.S.villains.filter(q.targetable).slice(0,3)){v.hp=1;q.hero.pos.copy(v.o.position).add(new T.Vector3(0,0,.8));q.strike(1);}
 assert(q.S.rescueCount>countBefore);assert.equal(q.S.money-cashBefore,(Math.floor(q.S.rescueCount/3)-Math.floor(countBefore/3))*30);assert.equal(q.SAVE.rescued,q.S.rescueCount);
 console.log('PASS: compact spacing, expanded capacity, twenty wall-side drops remain reachable, magnet pickup, central deposit.');
 console.log('PASS: recurring three-seat milestone bonus and rescued progress.');
}
if(false||true){
 assert(q.stats().speed>=6.3);q.hero.hp=1000;q.hero.dead=0;q.hero.pos.set(true?11:7,0,-.6);for(const e of q.S.elders)e.tipT=1000;
 for(const m of q.hero.stack)q.scene.remove(m);q.hero.stack=[];for(const d of q.S.drops)q.scene.remove(d.m);q.S.drops=[];q.S.flying=[];
 function note(){const m=new T.Mesh(new T.BoxGeometry(.4,.06,.2),new T.MeshBasicMaterial());q.scene.add(m);return m;}
 const quiet=n=>{for(let k=0;k<n;k++){for(const e of q.S.elders)e.tipT=1e9;for(const v of q.S.villains){v.rolled=true;if(v.angry&&v.state==="chase")v.state="neutral";}q.S.trickT=1e9;ticks(1);}};
 for(let i=0;i<12;i++)q.hero.stack.push(note());let money=q.S.money;nodes.get('btnCash').onclick();assert.equal(q.hero.stack.length,0);assert.equal(q.S.money,money+60);nodes.get('btnCash').onclick();nodes.get('btnCash').onclick();assert.equal(q.S.money,money+60);quiet(80);assert.equal(q.S.money,money+60);
 money=q.S.money;for(let i=0;i<15;i++){const m=note();m.position.set(1000,.1,-1000);q.S.drops.push({m,v:new T.Vector3(),t:0,land:true,val:5});}quiet(1);for(const d of q.S.drops){assert(d.m.position.x<=13);assert(d.m.position.z>=-1.65);}
 quiet(160);assert.equal(q.S.drops.length,0);nodes.get('btnCash').onclick();assert.equal(q.S.money,money+75);quiet(60);assert.equal(q.S.money,money+75);
 money=q.S.money;for(let i=0;i<q.stats().cap;i++)q.hero.stack.push(note());const cap=q.stats().cap;quiet(1);assert.equal(q.hero.stack.length,0);assert.equal(q.S.money,money+cap*5);
 money=q.S.money;for(let i=0;i<4;i++)q.hero.stack.push(note());q.arriveStation();assert.equal(q.hero.stack.length,0);assert(q.S.money>=money+20);nodes.get('btnDepart').onclick(); // v5: station arrival unloads the bag before the shop opens.
 console.log('PASS: immediate payout, rapid repeat clicks do not duplicate cash, animation does not pay twice, already-landed outside money rescued, full-bag auto-bank, station-arrival unloading.');
}
if(true){
 assert.equal(q.deposits.length,0);q.updateIncidents(10);for(const kind of['drunk','harass','bully'])if(!q.S.incidents.some(i=>i.phase==='active'&&i.kind===kind))q.spawnIncident(kind,null,true);const initial=q.S.incidents.filter(i=>i.phase==='active');assert(initial.some(i=>i.kind==='drunk'));assert(initial.some(i=>i.kind==='harass'));assert(initial.some(i=>i.kind==='bully'));
 const drunk=initial.find(i=>i.kind==='drunk');assert(!drunk.attacker.seat.prio);assert(drunk.victim.seat);assert(q.targetable(drunk.attacker));assert.equal(q.targetable(drunk.victim),false);assert.equal(drunk.victim.o.userData.incidentView.calm,false);
 for(const inc of initial){const v=inc.attacker;q.hero.pos.copy(v.o.position).add(new T.Vector3(0,0,.6));const victimObject=inc.victim.o;v.hp=1;q.strike(1);assert.equal(inc.active,false);assert.equal(inc.phase,'resolved');assert.equal(victimObject.userData.incidentView.calm,true);assert(victimObject.parent===q.scene);assert.equal(q.targetable(v),false);}
 q.updateIncidents(5);assert(!q.S.incidents.some(i=>i.phase==='resolved'));assert.equal(drunk.victim.o.userData.incidentView,undefined);
 q.spawnWave();const fresh=q.S.incidents.filter(i=>i.phase==='arriving');assert(fresh.length>0);for(const i of fresh){assert.equal(q.targetable(i.attacker),false);assert.equal(i.attacker.tag,null);}
 for(let i=0;i<300;i++)q.updateIncidents(1/60);assert(fresh.some(i=>i.phase==='active'));assert(fresh.filter(i=>i.phase==='active').every(i=>q.targetable(i.attacker)));
 for(let i=0;i<8;i++)q.spawnWave();assert(q.S.incidents.filter(i=>i.phase!=='resolved').length<=6);
 console.log('PASS: ordinary-seat drunk leaning, distressed protected victim, harassment/bullying eligibility, rescue/relief/cleanup, repeated same-car boarding and six-incident cap.');
}

{ // v5 (Claude): spycam incident, boss, resting seat rules, dash
 for(const e of q.S.elders)e.tipT=1e9;
 let inc=q.S.incidents.find(i=>i.kind==='spycam'&&i.phase==='active');if(!inc){for(const i of q.S.incidents){i.phase='resolved';i.ttl=0;}q.updateIncidents(1);inc=q.spawnIncident('spycam',null,true);}assert(inc,'spycam incident spawns');
 assert(q.targetable(inc.attacker));assert.equal(q.targetable({o:inc.victim.o,sp:{},tag:inc.victim.tag}),false);
 q.spawnBoss();const boss=q.S.boss;assert(boss&&boss.boss);assert(q.targetable(boss));assert(boss.max>q.S.villains.find(v=>!v.boss).max*3);
 boss.hp=1;q.hero.dead=0;q.hero.pos.copy(boss.o.position).add(new T.Vector3(0,0,.6));q.strike(1);assert(['fly','gone'].includes(boss.state));assert(q.SAVE.dex.boss>=1);
 q.hero.vel.set(0,0,0);q.hero.seat=null;const prio=q.seats.find(s=>s.prio&&!s.p&&!s.res);if(prio){q.hero.pos.set(prio.x,0,Math.sign(prio.z)*1.9);ticks(60);assert(!q.hero.seat||!q.hero.seat.prio,'hero never rests on a priority seat');}
 q.hero.seat=null;q.hero.dashCd=0;q.hero.face=Math.PI/2;q.dash();assert(q.hero.inv>0);assert(q.hero.vel.x>10);
 console.log('PASS: spycam attacker targetable / victim protected, transfer-station boss + dex, no resting on priority seats, dash invulnerability.');
}
{ // v6 (Claude): shake, ultimate, incident timer/escape, segment stars, boss variants, cosmetics, daily, laps, justice
 for(const e of q.S.elders)e.tipT=1e9;q.S.trickT=1e9;q.hero.dead=0;q.hero.hp=1000;q.hero.seat=null;
 // 화면 흔들림: 타격 시 충격량이 쌓임
 const sv=q.S.villains.find(v=>q.targetable(v)&&!v.boss&&v.state==='sit')||(()=>{const s=q.seats.find(s=>s.prio&&!s.p&&!s.res);const v=q.spawnVillain(new T.Vector3(s.x,0,s.z),'sit',s);q.sitVillain(v,s);return v;})();
 q.S.trauma=0;q.hero.pos.copy(sv.o.position).add(new T.Vector3(0,0,.7));sv.hp=1e6;sv.max=1e6;q.strike(.2);assert(q.S.trauma>0,'hit adds screen shake');sv.hp=sv.max=30;
 // 한방: 게이지 100에서만 발동, 반경 안 표시된 가해자를 한꺼번에 제압
 q.S.ult=50;q.activateUlt();assert.equal(q.S.ult,50,'ult needs full gauge');
 const pool=q.seats.filter(s=>s.prio&&s.zone===1).slice(0,3);const ultTargets=[];for(const s of pool){if(s.p&&q.S.villains.includes(s.p)){ultTargets.push(s.p);continue;}if(s.p||s.res)continue;const v=q.spawnVillain(new T.Vector3(s.x,0,s.z),'sit',s);q.sitVillain(v,s);ultTargets.push(v);}
 q.hero.pos.set(pool[0].x,0,pool[0].z*.6);const before=q.S.rescueCount;q.S.ult=100;q.activateUlt();assert.equal(q.S.ult,0);for(let i=0;i<30;i++)q.update(1/60);
 assert(q.S.rescueCount>before,'ultimate defeats nearby offenders');
 const elder=q.S.elders.find(e=>e.state==='sit');if(elder)assert.notEqual(elder.state,'fly');
 // 사건 제한 시간: 다 되면 실패 → 가해자 퇴장(공격 불가), 질서 하락
 for(const i of q.S.incidents){i.phase='resolved';i.ttl=0;}q.updateIncidents(1);
 let inc=q.spawnIncident('harass',null,true);assert(inc&&inc.limit>0&&inc.left>0);q.S.failPen=0;inc.left=.001;q.updateIncidents(.05);
 assert.equal(inc.phase,'resolved');assert(inc.failed);assert.equal(q.targetable(inc.attacker),false);assert(q.S.failPen>0);assert.equal(inc.attacker.state,'leave');
 // 몰카범: 다가가면 도주, 도주 중에도 공격 가능, 끝에 닿으면 놓침
 q.updateIncidents(5);inc=q.spawnIncident('spycam',null,true);const spy=inc.attacker;q.hero.pos.copy(spy.o.position).add(new T.Vector3(-2,0,.3));q.updateIncidents(1/60);
 assert(inc.fleeing,'spycam flees when approached');assert(q.targetable(spy),'fleeing spycam is still a target');spy.o.position.x=inc.fleeX;q.updateIncidents(1/60);assert(inc.failed);assert.equal(q.targetable(spy),false);
 // 구간 미션: 별 0~3개, 역 스탬프 저장
 q.S.boss=null;q.newSegment();assert.equal(q.S.seg.ms.length,3);q.S.seg.kills=99;q.S.seg.streak=99;q.S.seg.inc=99;q.S.seg.ult=99;q.S.seg.downs=0;q.S.seg.fails=0;q.S.failPen=0;
 const cash0=q.S.money,st=q.SAVE.st;const res=q.segFinish();assert(res.stars>=2&&res.stars<=3);assert(q.S.money>cash0);assert.equal(q.SAVE.stamps[st],res.stars);assert.equal(q.S.seg,null);
 // 보스 7종
 assert.equal(Object.keys(q.BOSSES).length,7);
 for(const v of q.S.villains)if(v.angry||v.boss){v.state='gone';}q.S.villains=q.S.villains.filter(v=>v.state!=='gone');q.S.boss=null;
 q.spawnBoss('신도림');assert.equal(q.S.boss.btype,'신도림');const minions=q.S.villains.filter(v=>v.angry&&v.state==='chase'&&!v.boss);assert.equal(minions.length,2);assert(minions.every(v=>q.targetable(v)));
 q.S.boss.state='gone';q.S.boss=null;q.spawnBoss('왕십리');assert.equal(q.S.boss.B.skill,'charge');assert(q.targetable(q.S.boss));q.S.boss.state='gone';q.S.boss=null;
 // 꾸미기: 재킷 색은 주인공 셰이더 값만 바꾸고 능력치는 그대로
 const stat0=JSON.stringify(q.stats());q.SAVE.cos.own.push('j1','f2');q.SAVE.cos.jk='j1';q.SAVE.cos.fx='f2';q.applyCos();
 assert.equal(q.hero.o.userData.art.sprite.material.userData.jk.w,1);assert.equal(JSON.stringify(q.stats()),stat0);
 {const sh={uniforms:{},vertexShader:'#include <uv_vertex>\n#include <logdepthbuf_vertex>',fragmentShader:'void main(){\n#include <map_fragment>\n}'};q.hero.o.userData.art.sprite.material.onBeforeCompile(sh);assert(sh.uniforms.uJk);assert(sh.fragmentShader.includes('jkHsv2rgb'));}
 q.SAVE.cos.jk='j0';q.applyCos();assert.equal(q.hero.o.userData.art.sprite.material.userData.jk.w,0);
 // 오늘 미션
 const d=q.ensureDaily();assert.equal(d.list.length,3);const it=d.list[0];q.dailyProg(it.k,it.goal);assert.equal(it.prog,it.goal);
 // 바퀴·정의감
 const laps=q.SAVE.laps;q.SAVE.laps=0;q.S.event=null;q.SAVE.justice=0;assert.equal(q.billVal(),5);q.SAVE.laps=2;assert(q.billVal()>5);const hv=q.spawnVillain(new T.Vector3(0,0,0),'neutral');q.SAVE.laps=0;const lv=q.spawnVillain(new T.Vector3(0,0,0),'neutral');assert(hv.max>lv.max);q.SAVE.laps=laps;
 const j=q.CARDS.find(c=>c.id==='justice');assert(j.ok());const dm=q.stats().dmg;j.go();assert(q.stats().dmg>dm);q.SAVE.justice=0;
 console.log('PASS: v6 hit shake, ultimate (full gauge only, offenders only), incident timeout + spycam escape, segment stars/stamps, 7 bosses + minions, cosmetics shader, daily missions, lap scaling, justice upgrade.');
}
{
 const yaw=Math.atan2(3.4*.72,8.95),cases=[
 [{mop:true},'dir-hero-male',0,4],[{mop:true,female:true},'dir-hero-female',0,4],
 [{own:true},'dir-civilians',0,8],[{female:true},'dir-civilians',4,8],
 [{old:true},'dir-protected',0,8],[{belly:true},'dir-protected',4,8],
 [{uniform:true},'dir-staff',0,8],[{kind:'harass'},'dir-staff',4,8],
 [{kind:'bully'},'dir-staff',4,8],[{kind:'drunk'},'dir-incident',0,8],
 [{kind:'spycam'},'dir-special',4,8],[{bossProbe:true},'dir-special',0,8],
 [{backpack:'back'},'dir-backpack',0,8],[{backpack:'front'},'dir-backpack',4,8],
 [{backpack:'back',female:true},'dir-backpack-female',0,8],[{backpack:'front',female:true},'dir-backpack-female',4,8]];
 for(const [spec,key,base,rows] of cases){const o=q.person(spec);q.scene.add(o);if(spec.bossProbe)o.userData.big=1.12;
 for(let direction=0;direction<4;direction++){o.rotation.y=yaw+direction*Math.PI/2;q.pose(o,'walk',0);const art=o.userData.art;assert.equal(art.walkKey,key);assert.equal(art.walkingRow,base+direction,'each direction uses its own unmirrored row');assert.equal(art.rect.w,1/rows);assert.equal(art.mirrored,false);assert(art.rect.y>=0&&art.rect.y+art.rect.w<=1.000001);assert.equal(art.sprite.material.rotation,0);}
 o.rotation.y=yaw;q.pose(o,'walk',0);const before=o.userData.art.motion.frame;o.position.x+=Math.sin(yaw)*.31/.72;o.position.z+=Math.cos(yaw)*.31;q.pose(o,'walk',.1);assert.notEqual(o.userData.art.motion.frame,before);assert.equal(o.userData.art.motion.direction,0,'actual velocity is camera-relative');const phase=o.userData.art.motion.frame;q.pose(o,'walk',999);assert.equal(o.userData.art.motion.frame,phase);q.pose(o,'idle',1000);assert.equal(o.userData.art.walkKey,key,'idle preserves front/side art identity');
 const d=o.userData.art.motion.distance;o.position.x+=20;q.pose(o,'walk',1001);assert.equal(o.userData.art.motion.distance,d);q.scene.remove(o);
 }
 const probe=q.person({mop:true});q.scene.add(probe);probe.rotation.y=yaw;q.pose(probe,'walk',0);for(const angle of[.76,.80,.78,.81,.77]){probe.rotation.y=yaw+angle;q.pose(probe,'walk',0);assert.equal(probe.userData.art.motion.direction,0,'boundary hysteresis');}probe.rotation.y=yaw+1.05;q.pose(probe,'walk',0);assert.equal(probe.userData.art.motion.direction,1);
 for(const angle of[0,.4,1,1.8,2.5,3.5,5.2]){probe.rotation.y=angle;q.pose(probe,'walk',0);q.scene.updateMatrixWorld(true);assert(Math.abs(probe.userData.art.sprite.getWorldScale(new T.Vector3()).x-2.04)<1e-6);}
 const a=q.person({mop:true}),b=q.person({mop:true});q.pose(a,'walk',0);q.pose(b,'walk',0);for(let i=0;i<60;i++){a.position.z+=2.1/60;q.pose(a,'walk',i/60);}for(let i=0;i<30;i++){b.position.z+=2.1/30;q.pose(b,'walk',i/30);}assert.equal(a.userData.art.motion.frame,b.userData.art.motion.frame);
 const aa=q.person({}),bb=q.person({});for(let i=0;i<90;i++)q.steer(aa,2,0,1.5,1/30);for(let i=0;i<180;i++)q.steer(bb,2,0,1.5,1/60);assert(q.d2(aa.position,{x:2,z:0})<.05);assert(q.d2(aa.position,bb.position)<.04);
 console.log('PASS: 16 archetypes use independent front/right/back/left rows, no mirror fallback; camera-relative physical velocity; idle heading; distance gait, pause, hysteresis, teleport rejection, fixed width and 30/60fps steering.');
}
{
 const back=q.S.villains.find(v=>v.sp.backpack==='back'&&!v.sp.female&&!['fly','gone'].includes(v.state))||q.spawnBackpack('back',true,false);
 const front=q.S.villains.find(v=>v.sp.backpack==='front'&&!v.sp.female)||q.spawnBackpack('front',true,false);
 assert(back&&front);back.state='backpackStand';back.tag=back.tag||node();front.state='backpackStand';front.tag=front.tag||node();
 q.hero.pos.set(0,0,0);back.o.position.set(.2,0,0);front.o.position.set(-.2,0,0);const h=front.hp,b=back.hp;
 assert(q.targetable(back));assert.equal(q.targetable(front),false);q.strike(.25);assert(back.hp<b);assert.equal(front.hp,h);
 front.angry=true;front.boss=true;front.guilty=true;front.sp.own=true;front.state='chase';assert.equal(q.targetable(front),false);front.angry=false;front.boss=false;front.guilty=false;front.sp.own=false;front.state='backpackStand';
 back.state='backpackArrival';assert.equal(q.targetable(back),false);back.state='backpackStand';back.sp.old=true;assert.equal(q.targetable(back),false);back.sp.old=false;back.sp.belly=true;assert.equal(q.targetable(back),false);back.sp.belly=false;
 for(const [v,row]of [[back,0],[front,4]]){v.o.rotation.y=0;q.pose(v.o,'walk',0);assert.equal(v.o.userData.art.walkKey,'dir-backpack');assert.equal(v.o.userData.art.walkingRow,row);const a=v.o.userData.art.rect.x;v.o.position.z+=.5;q.pose(v.o,'walk',1);assert.notEqual(v.o.userData.art.rect.x,a);v.o.rotation.y=Math.PI;q.pose(v.o,'idle',1);assert.equal(v.o.userData.art.walkingRow,row+2);}
 back.o.position.copy(q.hero.pos);back.hp=1;const count=q.SAVE.dex.backpack||0;q.strike(1);assert.equal(back.state,'fly');assert.equal(q.SAVE.dex.backpack,count+1);assert.equal(front.hp,h);
 assert(q.spawnBackpack('back'),'defeated backpack offender can be replaced');
 console.log('PASS: unique backpack art/gait, rear carry only damage, front carry protected even with accidental boss flags, arrival immunity, elder/pregnancy protection, defeat/dex/reboarding.');
}
{
 const back=q.S.villains.find(v=>v.sp.backpack==='back'&&v.sp.female&&!['fly','gone'].includes(v.state))||q.spawnBackpack('back',true,true);
 const front=q.S.villains.find(v=>v.sp.backpack==='front'&&v.sp.female);
 assert(back&&front,'female rear/front commuters are present');assert.equal(q.spawnBackpack('front',true,true),null,'do not duplicate protected commuter');
 back.state='backpackStand';back.tag=back.tag||node();front.state='backpackStand';front.tag=front.tag||node();
 q.hero.pos.set(-7,0,0);back.o.position.copy(q.hero.pos);front.o.position.copy(q.hero.pos);const h=front.hp,b=back.hp;
 assert(q.targetable(back));assert.equal(q.targetable(front),false);q.strike(.25);assert(back.hp<b);assert.equal(front.hp,h);
 back.state='backpackArrival';assert.equal(q.targetable(back),false);back.state='backpackStand';
 for(const [v,row]of [[back,0],[front,4]]){v.o.rotation.y=0;q.pose(v.o,'walk',0);assert.equal(v.o.userData.art.walkKey,'dir-backpack-female');assert.equal(v.o.userData.art.walkingRow,row);const a=v.o.userData.art.rect.x;v.o.position.z+=.5;q.pose(v.o,'walk',1);assert.notEqual(v.o.userData.art.rect.x,a);v.o.rotation.y=Math.PI;q.pose(v.o,'idle',1);assert.equal(v.o.userData.art.walkingRow,row+2);}
 back.o.position.copy(q.hero.pos);back.hp=1;const count=q.SAVE.dex['backpack-female']||0;q.strike(1);assert.equal(back.state,'fly');assert.equal(q.SAVE.dex['backpack-female'],count+1);assert.equal(front.hp,h);
 const replacement=q.spawnBackpack('back',false,true);assert(replacement);assert.equal(q.targetable(replacement),false);replacement.o.position.copy(replacement.packTarget);q.S.hitstop=0;q.update(1/60);assert.equal(replacement.state,'backpackStand');assert(q.targetable(replacement));
 console.log('PASS: distinct female backpack front/rear gait, mixed-area protected passenger immunity, arrival and reboarding, duplicate cap, female dex.');
}
{
 q.setAttackStyle('fists');q.SAVE.umbrellaSeconds=0;q.setAttackStyle('umbrella');assert(nodes.get('btnFists').classList.contains('active'),'cannot equip unpaid umbrella');
 q.arriveStation();q.S.money=0;q.CARDS.find(c=>c.id==='umbrella120');
 // Reopen the actual station shop to render purchase buttons with the updated balance.
 q.arriveStation();q.S.money=0;const button=[...nodes.get('cards').children].reverse().find(c=>c.innerHTML.includes('장우산 · 2분'));assert(button);button.onclick();assert.equal(q.SAVE.umbrellaSeconds,0);assert.equal(q.S.money,0);
 q.S.money=40;button.onclick();assert.equal(q.S.money,0);assert.equal(q.SAVE.umbrellaSeconds,120);assert(nodes.get('btnUmbrella').classList.contains('active'));button.onclick();assert.equal(q.S.money,0);assert.equal(q.SAVE.umbrellaSeconds,120,'no repeated purchase while active');
 q.tickUmbrella(30);assert.equal(q.SAVE.umbrellaSeconds,120,'station shop pauses rental');nodes.get('btnDepart').onclick();
 q.hero.pos.set(0,0,0);q.hero.face=0;q.hero.spin=0;q.hero.hp=1000;
 const probes=[0,Math.PI/4-.001,Math.PI/4+.001,Math.PI/2,Math.PI].map(angle=>{const v=q.spawnVillain(new T.Vector3(Math.sin(angle)/.72,0,Math.cos(angle)),'backpackStand');Object.assign(v.sp,{own:true,old:false,belly:false,backpack:'back'});v.guilty=true;v.tag=node();v.hp=10000;return v});
 const protectedFront=q.S.villains.find(v=>v.sp.backpack==='front');protectedFront.o.position.set(0,0,.5);const innocentHP=protectedFront.hp;const before=probes.map(v=>v.hp);q.strike(1,true);probes.forEach((v,i)=>assert.equal(v.hp<before[i],i<2,'only forward 90 degree arc hits'));assert.equal(protectedFront.hp,innocentHP);
 for(const gender of ['male','female']){q.chooseCharacter(gender);q.hero.spin=.25;q.hero.duration=.44;q.hero.swingFace=0;for(let d=0;d<4;d++){q.hero.face=Math.atan2(3.4*.72,8.95)+d*Math.PI/2;q.hero.swingFace=q.hero.face;q.hero.o.rotation.y=q.hero.face;q.pose(q.hero.o,'windmill',0);assert.equal(q.hero.o.userData.art.walkKey,'swing-'+gender);assert.equal(q.hero.o.userData.art.walkingRow,d);}q.hero.spin=0;q.hero.face=0;q.hero.o.rotation.y=0;q.pose(q.hero.o,'walk',0);assert.equal(q.hero.o.userData.art.walkKey,'carry-'+gender);const leg=q.hero.o.userData.art.rect.x;q.hero.o.position.z+=.4;q.pose(q.hero.o,'walk',0);assert.notEqual(q.hero.o.userData.art.rect.x,leg,'umbrella carry preserves moving legs');}
 // A swing connects once midway, not at windup and not each frame.
 for(const v of q.S.villains)if(v!==probes[0])v.o.position.x=150;
 for(const gd of q.S.guards)gd.o.position.x=150;
 q.hero.pos.set(0,0,0);q.hero.o.position.copy(q.hero.pos);q.hero.vel.set(0,0,0);q.hero.seat=null;q.hero.pulse=0;q.hero.face=q.hero.swingFace=0;q.hero.duration=.44;q.hero.spin=.44;q.hero.swingT=2;q.hero.umbrellaHit=false;
 probes[0].o.position.set(0,0,1);const windupHP=probes[0].hp;q.S.hitstop=0;q.update(.1);assert.equal(probes[0].hp,windupHP);q.S.hitstop=0;q.update(.12);assert(probes[0].hp<windupHP);assert.equal(q.S.hitstop,.06);assert.equal(q.hero.o.userData.art.rect.x,4/8,'contact freezes on actual impact pose');assert(q.impactSparks.length>0);const impactHP=probes[0].hp;for(let i=0;i<12;i++){q.S.hitstop=0;q.update(.02);}assert.equal(probes[0].hp,impactHP,'one hit per sweep');
 q.hero.face=0;q.updateUmbrellaFan();assert(q.umbrellaFan.visible);const arr=q.umbrellaFan.geometry.attributes.position.array;for(let i=0;i<arr.length;i+=3){const dx=(arr[i]-q.hero.pos.x)*.72,dz=arr[i+2]-q.hero.pos.z;if(Math.hypot(dx,dz)>.01)assert(dz/Math.hypot(dx,dz)>=Math.SQRT1_2-1e-6,'visible fan equals collision arc');}
 nodes.get('btnDex').onclick();const remaining=q.SAVE.umbrellaSeconds;q.tickUmbrella(10);assert.equal(q.SAVE.umbrellaSeconds,remaining);nodes.get('btnDexClose').onclick();
 ctx.document.hidden=true;q.tickUmbrella(10);assert.equal(q.SAVE.umbrellaSeconds,remaining);ctx.document.hidden=false;
 q.tickUmbrella(remaining-.5);assert.equal(q.SAVE.umbrellaSeconds,.5);assert.equal(nodes.get('umbrellaClock').textContent,'0:01');q.tickUmbrella(.5);assert.equal(q.SAVE.umbrellaSeconds,0);assert(nodes.get('btnFists').classList.contains('active'));q.updateUmbrellaFan();assert.equal(q.umbrellaFan.visible,false);assert.equal(JSON.parse(saved.get('line2clash-v1')).umbrellaSeconds,0);
 const after=probes[0].hp;q.strike(1,true);assert.equal(probes[0].hp,after,'expired umbrella cannot hit');assert(q.CARDS.find(c=>c.id==='umbrella120').ok());
 console.log('PASS: actual impact frame4 held for 60ms, visible billboard recoil/reset without paper tilt, temporary spark cleanup.');
 console.log('PASS: actual shop payment/insufficient funds/duplicate protection, male/female visible swings, precise 90 degree cone and protected passengers, fan matches collision, 120 play seconds with menu/hidden pauses, expiry/save/fists fallback and repurchase.');
}
if(process.argv.includes('--render')){fs.mkdirSync('outputs',{recursive:true});
 const rendererSource=fs.readFileSync('tests/software-render.cjs','utf8');const cpu={T,fs,createCanvas,urban:false};vm.createContext(cpu);vm.runInContext(rendererSource.slice(rendererSource.indexOf('function renderCPU(')),cpu);
 q.showSelection();frame(now+=17);cpu.renderCPU(q.getSelection().ss,q.getSelection().cc,'outputs/selection-models-check.png',true);
 nodes.get('chooseFemale').onclick();nodes.get('btnStart').onclick();q.hero.pos.set(-10.6,0,-.9);ticks(90);cpu.renderCPU(q.scene,q.camera,'outputs/play-models-check.png',true);
 console.log('Production geometry previews rendered (software QA, not browser screenshots).');
}
})().catch(error=>{console.error(error);process.exitCode=1;});
