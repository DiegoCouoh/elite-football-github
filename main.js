import * as THREE from 'three';

// Utils
const toastEl=document.getElementById('toast');
export function showToast(m){toastEl.textContent=m;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),2500)}
export function showModal(t,txt){document.getElementById('modalTitle').textContent=t;document.getElementById('modalText').textContent=txt;document.getElementById('modal').style.display='flex'}
document.getElementById('modalClose').onclick=()=>document.getElementById('modal').style.display='none';

// Room & QR
let ROOM_ID = 'ELITE-'+Math.floor(1000+Math.random()*9000);
let mobileInput={x:0,y:0,buttons:{pass:false,shoot:false,long:false,sprint:false,change:false,tackle:false},power:0};

function drawQR(canvas, text){
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,200,200);
  ctx.fillStyle='#000';
  [[0,0],[140,0],[0,140]].forEach(([x,y])=>{
    ctx.fillRect(x,y,60,60);
    ctx.fillStyle='#fff';ctx.fillRect(x+6,y+6,48,48);
    ctx.fillStyle='#000';ctx.fillRect(x+14,y+14,32,32);
  });
  let h=0;for(let i=0;i<text.length;i++) h=(h*31+text.charCodeAt(i))%100000;
  for(let y=0;y<20;y++) for(let x=0;x<20;x++){
    if((x<6&&y<6)||(x>13&&y<6)||(x<6&&y>13)) continue;
    if(((h + x*7 + y*13)%23)>10) ctx.fillRect(8+x*9,8+y*9,7,7);
  }
}
function updateQR(){
  const link = location.href.split('?')[0].replace('index.html','') + 'controller.html?room='+ROOM_ID;
  const fullLink = location.origin + location.pathname.replace('index.html','') + 'controller.html?room='+ROOM_ID;
  const useLink = location.protocol==='file:' ? link : fullLink;
  document.getElementById('roomIdDisplay').textContent=ROOM_ID;
  document.getElementById('linkPreview').textContent=useLink;
  drawQR(document.getElementById('qrCanvas'), useLink);
  // Try real QR via API as img fallback
  const qrImg=document.getElementById('qrImg');
  qrImg.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(useLink);
  qrImg.onload=()=>{document.getElementById('qrCanvas').style.display='none'; qrImg.style.display='block';};
  localStorage.setItem('elite_room',ROOM_ID);
  return useLink;
}
let currentLink=updateQR();
document.getElementById('btnCopyLink').onclick=async()=>{
  const l=document.getElementById('linkPreview').textContent;
  try{await navigator.clipboard.writeText(l);showToast('¡Link copiado! '+ROOM_ID)}catch{showToast(l)}
};
document.getElementById('btnNewQR').onclick=()=>{ROOM_ID='ELITE-'+Math.floor(1000+Math.random()*9000);currentLink=updateQR();showToast('Nuevo QR: '+ROOM_ID)};
document.getElementById('btnOpenController').onclick=()=>{window.open('controller.html?room='+ROOM_ID,'_blank')};

// Poll controller
setInterval(()=>{
  try{
    const d=localStorage.getItem('elite_ctrl_'+ROOM_ID);
    if(d){const p=JSON.parse(d); if(Date.now()-p.t<600){mobileInput.x=p.x||0; mobileInput.y=p.y||0; mobileInput.buttons=p.buttons||mobileInput.buttons; mobileInput.power=p.power||0; document.getElementById('connDot').classList.add('connected'); document.getElementById('connText').textContent='● Mando conectado: '+ROOM_ID;}}
  }catch{}
},50);

// THREE SETUP - CENITAL STATIC CAMERA
const container=document.getElementById('gameContainer');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a0e1e);
scene.fog=new THREE.Fog(0x0a0e1e, 80, 180);

const camera=new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 1000);
// CENITAL ESTÁTICA
camera.position.set(0,55,35);
camera.lookAt(0,0,0);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
container.appendChild(renderer.domElement);

const ambient=new THREE.AmbientLight(0xffffff,0.65); scene.add(ambient);
const dir=new THREE.DirectionalLight(0xffffff,1.1); dir.position.set(30,50,20); dir.castShadow=true; dir.shadow.mapSize.set(2048,2048); scene.add(dir);
const p1=new THREE.PointLight(0x00ffff,0.6,80); p1.position.set(-25,25,0); scene.add(p1);
const p2=new THREE.PointLight(0xff00ff,0.5,80); p2.position.set(25,25,0); scene.add(p2);

// Field
const fieldGeo=new THREE.PlaneGeometry(90,130);
const fieldMat=new THREE.MeshStandardMaterial({color:0x1a8c3a, roughness:0.85});
const field=new THREE.Mesh(fieldGeo,fieldMat); field.rotation.x=-Math.PI/2; field.receiveShadow=true; scene.add(field);
const lineMat=new THREE.LineBasicMaterial({color:0xffffff});
function addLine(pts){const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(p[0],0.02,p[1]))); scene.add(new THREE.Line(g,lineMat))}
addLine([[-35,-50],[35,-50]]); addLine([[35,-50],[35,50]]); addLine([[35,50],[-35,50]]); addLine([[-35,50],[-35,-50]]);
addLine([[-35,0],[35,0]]);
const goalMat=new THREE.MeshStandardMaterial({color:0xffffff});
const goalA=new THREE.Mesh(new THREE.BoxGeometry(14,4,1),goalMat); goalA.position.set(0,2,-52.5); scene.add(goalA);
const goalB=new THREE.Mesh(new THREE.BoxGeometry(14,4,1),goalMat); goalB.position.set(0,2,52.5); scene.add(goalB);

// Ball
const ball=new THREE.Mesh(new THREE.SphereGeometry(0.6,16,16), new THREE.MeshStandardMaterial({color:0xffffff, emissive:0x222222})); ball.position.set(0,0.6,0); ball.castShadow=true; scene.add(ball);
let ballVel=new THREE.Vector3();

// Robot class
class Robot{
  constructor(team,type,pos,idx){
    this.team=team; this.type=type; this.idx=idx;
    this.group=new THREE.Group(); this.group.position.set(pos.x,0,pos.z);
    const col=team==='A'?0x00ffff:0xff2a6d;
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.6,0.8), new THREE.MeshStandardMaterial({color:col, metalness:0.65, roughness:0.28})); body.position.y=1.8; body.castShadow=true; this.body=body; this.group.add(body);
    const head=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.6,0.8), new THREE.MeshStandardMaterial({color:0x222233, metalness:0.8})); head.position.y=2.9; head.castShadow=true; this.group.add(head);
    const visor=new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.2), new THREE.MeshStandardMaterial({color:col, emissive:col, emissiveIntensity:0.9})); visor.position.set(0,2.9,0.41); this.group.add(visor);
    this.leftArm=new THREE.Group(); this.leftArm.position.set(-0.7,1.9,0); const a1=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,1), new THREE.MeshStandardMaterial({color:0x888})); a1.position.y=-0.5; this.leftArm.add(a1); this.group.add(this.leftArm);
    this.rightArm=new THREE.Group(); this.rightArm.position.set(0.7,1.9,0); const a2=a1.clone(); a2.position.y=-0.5; this.rightArm.add(a2); this.group.add(this.rightArm);
    this.leftLeg=new THREE.Group(); this.leftLeg.position.set(-0.32,1,0); const l1=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,1.2), new THREE.MeshStandardMaterial({color:0x666})); l1.position.y=-0.6; this.leftLeg.add(l1); this.group.add(this.leftLeg);
    this.rightLeg=new THREE.Group(); this.rightLeg.position.set(0.32,1,0); const l2=l1.clone(); l2.position.y=-0.6; this.rightLeg.add(l2); this.group.add(this.rightLeg);
    this.vel=new THREE.Vector3(); this.target=new THREE.Vector3(pos.x,0,pos.z);
    scene.add(this.group);
  }
  update(t, isActive){
    const speed=this.type==='SPEEDSTER'?0.22: this.type==='TANK'?0.14:0.18;
    const dir=new THREE.Vector3().subVectors(this.target, this.group.position); dir.y=0;
    if(dir.length()>0.3){dir.normalize().multiplyScalar(speed); this.vel.lerp(dir,0.15);} else this.vel.multiplyScalar(0.84);
    this.group.position.add(this.vel);
    this.group.position.x=Math.max(-38,Math.min(38,this.group.position.x));
    this.group.position.z=Math.max(-58,Math.min(58,this.group.position.z));
    if(dir.length()>0.4) this.group.lookAt(this.group.position.x+this.vel.x*10,0,this.group.position.z+this.vel.z*10);
    const c=t*8, moving=this.vel.length()>0.02;
    if(moving){
      this.leftLeg.rotation.x=Math.sin(c)*0.85;
      this.rightLeg.rotation.x=Math.sin(c+Math.PI)*0.85;
      this.leftArm.rotation.x=Math.sin(c+Math.PI)*0.55;
      this.rightArm.rotation.x=Math.sin(c)*0.55;
      this.group.position.y=Math.abs(Math.sin(c*2))*0.08;
    }else{this.leftLeg.rotation.x=0;this.rightLeg.rotation.x=0;this.leftArm.rotation.x=0;this.rightArm.rotation.x=0;}
    if(isActive){this.body.material.emissive.setHex(0x002244); this.body.scale.set(1.12,1.12,1.12)} else {this.body.material.emissive.setHex(0); this.body.scale.set(1,1,1)}
  }
}

const robotsA=[], robotsB=[];
const types=['SPEEDSTER','TANK','BALANCED','LIGHT','BALANCED'];
for(let i=0;i<5;i++){robotsA.push(new Robot('A',types[i],{x:(i%2?8:-8)+(Math.random()-0.5)*3,z:-28+i*12},i))}
for(let i=0;i<5;i++){robotsB.push(new Robot('B',types[i],{x:(i%2?8:-8)+(Math.random()-0.5)*3,z:28-i*12},i))}
let activeRobot=robotsA[0];
let all=[...robotsA,...robotsB];

let keys={}, gameState='MENU', scoreA=0, scoreB=0, timeSec=0;
window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

// Camera cenital control
let camOffsetX=0;
function updateCamera(){
  const targetX = ball.position.x*0.55 + camOffsetX;
  const targetZ = ball.position.z*0.28;
  camera.position.x += (targetX - camera.position.x)*0.06;
  camera.position.z += (25 + targetZ - camera.position.z)*0.06;
  camera.position.y=55;
  camera.lookAt(ball.position.x*0.3,0,ball.position.z*0.2);
  document.getElementById('camInfo').textContent=`CÁMARA X:${camOffsetX.toFixed(0)} [A/D] R:reset`;
}

function getInput(){
  let ix=0,iz=0;
  if(keys['w']||keys['arrowup']) iz=-1;
  if(keys['s']||keys['arrowdown']) iz=1;
  if(keys['a']){ix=-1; camOffsetX-=0.4}
  if(keys['d']){ix=1; camOffsetX+=0.4}
  if(keys['arrowleft']) camOffsetX-=0.6;
  if(keys['arrowright']) camOffsetX+=0.6;
  if(keys['r']){camOffsetX=0}
  if(Math.abs(mobileInput.x)>0.08||Math.abs(mobileInput.y)>0.08){ix=mobileInput.x; iz=mobileInput.y; camOffsetX+=mobileInput.x*0.3}
  camOffsetX=Math.max(-25,Math.min(25,camOffsetX));
  let sprint=keys['shift']||mobileInput.buttons.sprint;
  if(sprint){ix*=1.7;iz*=1.7}
  return {x:ix,z:iz, pass:keys['x']||mobileInput.buttons.pass, shoot:keys['c']||mobileInput.buttons.shoot, change:keys['q']||mobileInput.buttons.change, tackle:keys['e']||mobileInput.buttons.tackle, power:mobileInput.power|| (keys['c']?0.85:0)}
}
function switchPlayer(){
  let best=null,d=999; for(let r of robotsA){const dist=r.group.position.distanceTo(ball.position); if(r!==activeRobot&&dist<d){d=dist;best=r}}
  if(best){activeRobot=best; showToast('Cambio a '+best.type)}
}
let lastT=0;
function animate(t){
  requestAnimationFrame(animate);
  if(gameState!=='PLAYING'){updateCamera(); renderer.render(scene,camera); return;}
  const dt=(t-lastT)/1000; lastT=t; timeSec+=dt;
  document.getElementById('gameTime').textContent=String(Math.floor(timeSec/60)).padStart(2,'0')+':'+String(Math.floor(timeSec%60)).padStart(2,'0');
  const inp=getInput();
  if(inp.change){switchPlayer(); keys['q']=false; mobileInput.buttons.change=false}
  activeRobot.target.set(activeRobot.group.position.x+inp.x*5,0,activeRobot.group.position.z+inp.z*5);
  const dToBall=activeRobot.group.position.distanceTo(ball.position);
  if(dToBall<2.4){
    ball.position.x=activeRobot.group.position.x+0.2; ball.position.z=activeRobot.group.position.z+0.5; ball.position.y=0.6; ballVel.set(0,0,0);
    if(inp.pass){
      const mates=robotsA.filter(r=>r!==activeRobot); let c=mates[0], cd=999; for(let m of mates){const d=m.group.position.distanceTo(ball.position); if(d<cd){cd=d;c=m}} 
      if(c){ballVel.copy(new THREE.Vector3().subVectors(c.group.position, ball.position).normalize().multiplyScalar(7)); ballVel.y=0.6; showToast('¡Pase!')}
      keys['x']=false; mobileInput.buttons.pass=false;
    }
    if(inp.shoot){
      const p=inp.power||0.8; const dir=new THREE.Vector3(0,0,-1); dir.applyQuaternion(activeRobot.group.quaternion); ballVel.copy(dir.multiplyScalar(9+p*12)); ballVel.y=1+p*2.5; activeRobot.rightLeg.rotation.x=-1.3; showToast('¡TIRO '+Math.round(p*100)+'%!');
      keys['c']=false; mobileInput.buttons.shoot=false;
    }
  }else{
    robotsA.forEach(r=>{if(r!==activeRobot) r.target.copy(ball.position)})
  }
  ball.position.add(ballVel.clone().multiplyScalar(dt*6));
  ballVel.multiplyScalar(0.985); ballVel.y-=dt*5;
  if(ball.position.y<0.6){ball.position.y=0.6; ballVel.y*=-0.25; if(Math.abs(ballVel.y)<0.4) ballVel.y=0}
  if(ball.position.z<-52 && Math.abs(ball.position.x)<7){scoreA++; document.getElementById('scoreA').textContent=scoreA; ball.position.set(0,0.6,0); ballVel.set(0,0,0); showToast('¡GOOOL ROBOT! 🤖⚽')}
  if(ball.position.z>52 && Math.abs(ball.position.x)<7){scoreB++; document.getElementById('scoreB').textContent=scoreB; ball.position.set(0,0.6,0); ballVel.set(0,0,0); showToast('¡Gol rival!')}
  robotsB.forEach(r=>{
    const toBall=new THREE.Vector3().subVectors(ball.position, r.group.position); toBall.y=0;
    if(toBall.length()<22){r.target.copy(ball.position); if(toBall.length()<1.6) ballVel.copy(toBall.normalize().multiplyScalar(3.5))}
    else r.target.set((Math.random()-0.5)*18,0,10+(Math.random()-0.5)*10);
  });
  all.forEach(r=>r.update(t/1000, r===activeRobot));
  updateCamera();
  renderer.render(scene,camera);
}
animate(0);

// Menus
const teams=[
  {name:'CYBER BARÇA', color:'#004D98', s:'FCB', att:92},
  {name:'NEO MADRID', color:'#ffffff', s:'RMA', att:90},
  {name:'CITY BOTS', color:'#6CABDD', s:'MCI', att:89},
  {name:'PSG ROBOTS', color:'#004170', s:'PSG', att:91},
  {name:'BAYERN MECHS', color:'#DC052D', s:'FCB', att:88},
  {name:'ARSENAL DROID', color:'#EF0107', s:'ARS', att:86},
];
const grid=document.getElementById('teamGrid');
teams.forEach((t,i)=>{
  const d=document.createElement('div'); d.className='team-card'+(i===0?' selected':'');
  d.innerHTML=`<div class="team-shield" style="background:${t.color};color:${t.color==='#ffffff'?'#000':'#fff'}">${t.s}</div><div style="font-weight:700;font-size:12px">${t.name}</div><div style="font-size:10px;opacity:0.6">ATT ${t.att}</div>`;
  d.onclick=()=>{document.querySelectorAll('.team-card').forEach(c=>c.classList.remove('selected')); d.classList.add('selected'); showToast(t.name)};
  grid.appendChild(d);
});
document.getElementById('btnKickOff').onclick=()=>{document.getElementById('mainMenu').style.display='none'; document.getElementById('teamSelect').style.display='block'; showToast('Selecciona escuadra robot')};
document.getElementById('btnTorneo').onclick=()=>showModal('🏆 TORNEO CYBER','8 equipos robots en eliminación. Modo en desarrollo. ¡Juega Kick Off!');
document.getElementById('btnRobots').onclick=()=>showModal('🤖 ROBOTS','MESSI-BOT LIGHT 99 agilidad\nCR7-BOT TANK 99 potencia\nMBAPPE-BOT SPEEDSTER 99 velocidad\nTodos con pistones animados');
document.getElementById('btnAjustes').onclick=()=>showModal('⚙️ AJUSTES','Cámara: Cenital estática 55m altura, desplazamiento lateral A/D, R reset\nMando QR activo');
document.getElementById('btnStartMatch').onclick=()=>{document.getElementById('teamSelect').style.display='none'; gameState='PLAYING'; timeSec=0; showToast('¡Partido iniciado! Cámara cenital [A/D mueve lateral]')};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight)});
