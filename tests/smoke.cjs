const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),T=require('three');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
const decoded=new Map();for(const key of['hero-male','hero-female','passengers','incidents','spycam','boss','herosit','guard']){const file='assets/atlas/'+key+'.png',im=await loadImage(file),cv=createCanvas(im.width,im.height);cv.getContext('2d').drawImage(im,0,0);decoded.set('data:image/png;base64,'+fs.readFileSync(file).toString('base64'),cv);}
const nodes=new Map(),saved=new Map(),events={};let frame,rendered;
function node(id){const flags=new Set();return{id,hidden:false,style:{},textContent:'',attributes:{},classList:{add:x=>flags.add(x),toggle(x,on){if(on??!flags.has(x))flags.add(x);else flags.delete(x)},contains:x=>flags.has(x)},append(){},prepend(){},children:[],animate(){},remove(){},setAttribute(k,v){this.attributes[k]=v},addEventListener(){},setPointerCapture(){}};}
const doc={documentElement:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id)},createElement(type){return type==='canvas'?createCanvas(256,256):node()},addEventListener(){}};
class Renderer{constructor(){this.shadowMap={}}setPixelRatio(){}setSize(){}dispose(){}render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);rendered={s,c};}}
class TextureLoader{load(uri,cb){const canvas=decoded.get(uri);assert(canvas,'Embedded image must decode');const tex=new T.Texture(canvas);if(cb)cb(tex);return tex;}}
const ctx={THREE:{...T,WebGLRenderer:Renderer,TextureLoader},window:{THREE:T},document:doc,innerWidth:844,innerHeight:390,devicePixelRatio:1,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>0},requestAnimationFrame:f=>frame=f,addEventListener:(k,f)=>events[k]=f,setInterval(){},setTimeout(){},clearTimeout(){},navigator:{},screen:{},console,Math};
const gamePath='game/index.html';
let src=fs.readFileSync(gamePath,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
src=src.replace('showSelection();\nrequestAnimationFrame(loop);',`globalThis.qa={hero,S,SAVE,stats,scene,camera,person,pose,seats,actors,d2,dropBills,chooseCharacter,showSelection,getSelection:()=>selectionStage,targetable,strike,standVillain,sitVillain,spawnVillain,spawnWave,setAttackStyle,update,openModels,closeModels${true?',spawnIncident,activateIncident,updateIncidents,deposits,arriveStation,CARDS,spawnBoss,dash,STATIONS,getMode:()=>mode,activateUlt,failIncident,newSegment,segFinish,BOSSES,applyCos,dailyProg,ensureDaily,billVal,COS,orderTick,getOrder:()=>orderK,spawnPacker,FAN_REACH,UMB':''}};showSelection();\nrequestAnimationFrame(loop);`);
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
q.setAttackStyle('umbrella');ticks(1);assert.equal(q.hero.o.userData.P.mop.visible,true);q.setAttackStyle('fists');ticks(1);assert.equal(q.hero.o.userData.P.mop.visible,false);
q.spawnWave();for(const v of q.S.villains.filter(v=>v.state==='rush')){assert.equal(q.targetable(v),false);assert.equal(v.tag,null);assert(v.seat.prio);}
for(const a of q.actors)a.traverse(m=>{if(m.geometry)for(const n of m.geometry.attributes.position.array)assert(Number.isFinite(n))});
console.log('PASS: male/female selection, saved selection, equal stats, returning to selection preserves progress.');
console.log('PASS: priority-seat violations are attackable; unrelated general-seat/standing passengers, arrivals, elders and pregnant passengers remain protected.');
console.log('PASS: female combat, drops, collection, capacity, banking, upgrades, weapon switching and seat-only arrivals.');
console.log('PASS: all production mesh coordinates are finite.');
for(const m of q.actors)if(m.userData.art){const a=m.userData.art,shader={uniforms:{},vertexShader:T.ShaderLib.sprite.vertexShader};a.sprite.material.onBeforeCompile(shader);assert.equal(shader.uniforms.atlasRect.value,a.rect);assert(shader.vertexShader.includes('vUv=vUv*atlasRect.zw+atlasRect.xy;'));assert.equal(a.tex.image.width,1024);assert.equal(a.tex.image.height,1024);assert(a.rect.x>=0&&a.rect.x<=.75&&a.rect.y>=0&&a.rect.y<=.75);}
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
 const stat0=JSON.stringify(q.stats());q.SAVE.cos.own.push('j1','u1','f2');q.SAVE.cos.jk='j1';q.SAVE.cos.umb='u1';q.SAVE.cos.fx='f2';q.applyCos();
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
{ // v6.1: 백팩 뒤로(가해·공격 가능) / 앞으로(매너·보호), 강풍 우산 스윙 부채꼴
 q.hero.dead=0;q.hero.hp=1000;q.hero.seat=null;q.S.trickT=1e9;
 const rear=q.spawnPacker(true,null,true),front=q.spawnPacker(false,null,true);
 assert(rear&&q.targetable(rear),'rear backpack wearer is a marked target');assert(rear.o.userData.pack,'rear pack visible mesh');
 assert(front&&!q.S.villains.includes(front),'front backpack wearer never enters the target list');assert.equal(front.tag&&front.tag.className,'tag ok');
 const walking=q.spawnPacker(true,0,false);if(walking){assert.equal(walking.state,'packIn');assert.equal(q.targetable(walking),false,'boarding passenger not a target yet');}
 q.hero.pos.copy(rear.o.position).add(new T.Vector3(0,0,-.6));rear.hp=1;q.strike(1);assert(['fly','gone'].includes(rear.state));assert(q.SAVE.dex.rearpack>=1);
 // 강풍 우산 스윙: 2분, 정면 90°만 맞음, 뒤쪽은 안 맞음
 const fanCard=q.CARDS.find(c=>c.id==='fan');assert(fanCard.ok());q.S.fanT=0;fanCard.go();assert.equal(q.S.fanT,120);
 const s1=q.seats.find(s=>s.prio&&!s.p&&!s.res)||q.seats.find(s=>s.prio);for(const v of q.S.villains)if(v.state==='sit'&&v.seat){}
 const mk=(x,z)=>{const v=q.spawnVillain(new T.Vector3(x,0,z),'neutral');v.angry=true;v.state='chase';v.tag={remove(){},classList:{toggle(){}},style:{}};v.hp=v.max=1e6;v.spd=0;return v;};
 q.hero.pos.set(0,0,0);q.hero.face=0;const inFront=mk(0,1.9),behind=mk(0,-1.2),side=mk(1.2/0.72,0);
 q.strike(1.6,q.FAN_REACH-.2,Math.PI/2);assert(inFront.hp<1e6,'front target in cone is hit (beyond normal reach)');assert.equal(behind.hp,1e6,'target behind is not hit');assert.equal(side.hp,1e6,'target at 90° is outside the 90° cone');
 for(const v of[inFront,behind,side])v.state='gone';
 // 옛 인형 우산 메시는 숨기고, 새 우산은 따로 그림
 let rigVisible=false;q.hero.o.traverse(o=>{if(o.isMesh&&o.userData.rigUmb&&o.visible)rigVisible=true;});assert.equal(rigVisible,false);assert(q.UMB.parts.length>=3);
 q.S.fanT=0;
 console.log('PASS: v6.1 rear backpack = marked target / front backpack protected, boarding not targetable; fan swing hits only a 90° frontal cone with longer reach; visible umbrella separate from hidden rig.');
}
if(process.argv.includes('--render')){fs.mkdirSync('outputs',{recursive:true});
 const rendererSource=fs.readFileSync('tests/software-render.cjs','utf8');const cpu={T,fs,createCanvas,urban:false};vm.createContext(cpu);vm.runInContext(rendererSource.slice(rendererSource.indexOf('function renderCPU(')),cpu);
 q.showSelection();frame(now+=17);cpu.renderCPU(q.getSelection().ss,q.getSelection().cc,'outputs/selection-models-check.png',true);
 nodes.get('chooseFemale').onclick();nodes.get('btnStart').onclick();q.hero.pos.set(-10.6,0,-.9);ticks(90);cpu.renderCPU(q.scene,q.camera,'outputs/play-models-check.png',true);
 console.log('Production geometry previews rendered (software QA, not browser screenshots).');
}
})().catch(error=>{console.error(error);process.exitCode=1;});
