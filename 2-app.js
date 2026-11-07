/* Diwali greeting - 3D scene. Original work, built for the user's house. */
(function(){
const params = new URLSearchParams(location.search);
const body = document.body;
const demo = !!params.get('demo');   // cycles all names in the finale, skips picker
let demoIdx = 0, demoTimer = null;

// ---------- names ----------
let names = CONFIG.names.filter(n => n && n.trim());
const single = params.get('name');
if (single) names = [single];
let namesText = names.length <= 1 ? (names[0] || '')
  : names.length === 2 ? names.join(' & ')
  : names.slice(0,-1).join(', ') + ' & ' + names[names.length-1];
document.getElementById('namesLine').textContent = namesText;

// ---------- renderer ----------
const canvas = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070412);
scene.fog = new THREE.Fog(0x0a0618, 22, 60);
const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, .1, 200);
addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- sky: stars + horizon glow ----------
{
  const n=350, pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, r=40+Math.random()*40, y=6+Math.random()*40;
    pos[i*3]=Math.cos(a)*r; pos[i*3+1]=y; pos[i*3+2]=Math.sin(a)*r;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const m=new THREE.PointsMaterial({color:0xffffff, size:.14, transparent:true, opacity:.85, fog:false});
  scene.add(new THREE.Points(g,m));
  const hg = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 26),
    new THREE.MeshBasicMaterial({ color:0x3a1e3e, transparent:true, opacity:.55, fog:false })
  );
  hg.position.set(0, 6, -45); scene.add(hg);
  const moonTex = radialTex([[0,'rgba(255,246,220,1)'],[.35,'rgba(255,240,200,.9)'],[.6,'rgba(240,220,180,.25)'],[1,'rgba(240,220,180,0)']]);
  const moonS = new THREE.Sprite(new THREE.SpriteMaterial({ map:moonTex, transparent:true, fog:false, depthWrite:false }));
  moonS.position.set(-16, 15, -40); moonS.scale.set(7,7,1); scene.add(moonS);
}

// ---------- lights (base, dim night) ----------
scene.add(new THREE.AmbientLight(0x3d4f66, 1.05));
const moon = new THREE.DirectionalLight(0x9db1d8, .55);
moon.position.set(-8, 14, 6); scene.add(moon);
const doorLight = new THREE.PointLight(0xffa040, 0, 14); doorLight.position.set(0, 1.6, 3.8); scene.add(doorLight);
const courtLight = new THREE.PointLight(0xff9540, 0, 24); courtLight.position.set(0, 2.5, 7); scene.add(courtLight);
const diyaLight = new THREE.PointLight(0xff9030, 0, 7); diyaLight.position.set(-.5, .9, 5.6); scene.add(diyaLight);
const yardLight = new THREE.PointLight(0xffc060, 0, 22); yardLight.position.set(0, 6, 15); scene.add(yardLight);
const roadLight = new THREE.PointLight(0xffb050, 0, 18); roadLight.position.set(0, 6.5, 24); scene.add(roadLight);

// ---------- materials ----------
const M = {
  wall:   new THREE.MeshStandardMaterial({ color:0xc4bcd6, roughness:.9 }),
  wallDim:new THREE.MeshStandardMaterial({ color:0x9a91ab, roughness:.95 }),
  trim:   new THREE.MeshStandardMaterial({ color:0x7fc7b5, roughness:.8 }),
  roof:   new THREE.MeshStandardMaterial({ color:0x847b92, roughness:.95 }),
  doorGlow: new THREE.MeshStandardMaterial({ color:0x554411, emissive:0xffb054, emissiveIntensity:0 }),
  winGlow:  new THREE.MeshStandardMaterial({ color:0x443a18, emissive:0xffc06a, emissiveIntensity:0 }),
  bulb:   new THREE.MeshBasicMaterial({ color:0xffd75e }),
  marigold:  new THREE.MeshStandardMaterial({ color:0xf5a623, roughness:.7 }),
  marigold2: new THREE.MeshStandardMaterial({ color:0xe25303, roughness:.7 }),
  leaf:   new THREE.MeshStandardMaterial({ color:0x2e6b2a, roughness:.8 }),
  clay:   new THREE.MeshStandardMaterial({ color:0xa5502a, roughness:.85 }),
  clayDark: new THREE.MeshStandardMaterial({ color:0x7d3c1c, roughness:.9 }),
};
function box(w,h,d,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z); return m;
}

// ---------- the house (modelled from the user's photo) ----------
const house = new THREE.Group();
const HW=18, HH=3.3, HD=6;           // main block
house.add(box(HW,HH,HD, M.wall, 0,HH/2,0));
house.add(box(HW+.5,.34,HD+.5, M.roof, 0,HH+.17,0));            // roof slab
house.add(box(HW+.1,.22,.14, M.trim, 0,HH-.05,HD/2+.05));       // teal top band, front
house.add(box(HW+.1,.3,.2, M.trim, 0,.15,HD/2+.06));            // teal plinth, front
// raised porch canopy (the block over the centre, from the photo)
house.add(box(6.2,1.15,1.7, M.wallDim, 0,HH+1.15/2,HD/2-.5));
house.add(box(6.4,.16,1.9, M.roof, 0,HH+1.23,HD/2-.5));
house.add(box(6.4,.16,.12, M.trim, 0,HH+.06,HD/2+.42));
// door (double, centre) with steps
const door = box(1.9,2.5,.12, M.doorGlow, 0,1.25,HD/2+.02);
house.add(door);
house.add(box(2.2,.14,.3, M.trim, 0,2.56,HD/2+.04));            // door lintel
house.add(box(.06,2.5,.13, M.trim, 0,1.25,HD/2+.03));           // door centre seam
house.add(box(2.6,.18,1.1, M.roof, 0,.09,HD/2+.6));             // step
house.add(box(2.2,.18,.8, M.wallDim, 0,.27,HD/2+.5));
// windows: 4, teal frames, warm shutters (matches photo: 2 left, 2 right)
const winX=[-6.6,-3.8,3.8,6.6];
winX.forEach(x=>{
  house.add(box(1.5,1.6,.1, M.winGlow, x,1.7,HD/2+.02));
  house.add(box(1.7,.14,.16, M.trim, x,2.56,HD/2+.04));
  house.add(box(1.7,.14,.16, M.trim, x,.84,HD/2+.04));
  house.add(box(.14,1.86,.16, M.trim, x-.82,1.7,HD/2+.04));
  house.add(box(.14,1.86,.16, M.trim, x+.82,1.7,HD/2+.04));
  for(let i=-1;i<=1;i++) house.add(box(.05,1.5,.12, M.trim, x+i*.45,1.7,HD/2+.05));
});
// roof parapet (low wall around the roof edge, as in the photo)
house.add(box(HW+.5,.5,.18, M.wall, 0,HH+.55,HD/2+.16));
house.add(box(HW+.5,.5,.18, M.wallDim, 0,HH+.55,-HD/2-.16));
house.add(box(.18,.5,HD+.5, M.wallDim, -HW/2-.16,HH+.55,0));
house.add(box(.18,.5,HD+.5, M.wallDim, HW/2+.16,HH+.55,0));
// door panels (double-door etched rectangles)
[-.45,.45].forEach(dx=>{
  house.add(box(.62,1.9,.03, new THREE.MeshStandardMaterial({color:0x776644, roughness:.4, metalness:.35}), dx,1.35,HD/2+.1));
});
// window sill slabs
winX.forEach(x=> house.add(box(1.9,.1,.3, M.roof, x,.78,HD/2+.12)));
// small round vents + decorative teal grilles from the photo
[-7.6,-.9,.9,7.6].forEach(x=>{
  house.add(box(.55,.4,.08, M.trim, x,2.95,HD/2+.03));
});
scene.add(house);

// ---------- ground + courtyard ----------
{
  const g = new THREE.Mesh(new THREE.CircleGeometry(60, 48),
    new THREE.MeshStandardMaterial({ color:0x2f4622, roughness:1 }));
  g.rotation.x = -Math.PI/2; scene.add(g);
  // grass field: scattered tufts + lighter patches all around the house
  const tuft = new THREE.ConeGeometry(.09,.32,5);
  const tuftM = new THREE.MeshStandardMaterial({ color:0x3d5c2a, roughness:1 });
  const tuftM2 = new THREE.MeshStandardMaterial({ color:0x4a7031, roughness:1 });
  for(let i=0;i<160;i++){
    const a=Math.random()*Math.PI*2, r=4.5+Math.random()*38;
    const x=Math.cos(a)*r, z=Math.sin(a)*r;
    if (Math.abs(x)<6.9 && z>2.0 && z<41) continue;    // keep the road clear
    if (Math.abs(x)<8.2 && Math.abs(z)<3.6) continue;   // keep the house clear
    const t=new THREE.Mesh(tuft, i%2?tuftM:tuftM2);
    t.position.set(x,.14,z); t.rotation.y=Math.random()*3; t.scale.setScalar(.7+Math.random()*.9);
    scene.add(t);
  }
  for(let i=0;i<14;i++){ // lighter grass patches
    const a=Math.random()*Math.PI*2, r=8+Math.random()*30;
    const p=new THREE.Mesh(new THREE.CircleGeometry(1.5+Math.random()*2.5, 18),
      new THREE.MeshStandardMaterial({ color:0x38512a, roughness:1 }));
    p.rotation.x=-Math.PI/2; p.position.set(Math.cos(a)*r,.005,Math.sin(a)*r);
    scene.add(p);
  }
  // the forecourt and road are one single paved road, built below
}

// ---------- road from the house to the front + fences ----------
{
  // one complete wide, long paved road: house steps to the far end of the scene
  function roadTex(){
    const c=document.createElement('canvas'); c.width=256; c.height=512;
    const x=c.getContext('2d');
    x.fillStyle='#4a4442'; x.fillRect(0,0,256,512);
    for(let i=0;i<900;i++){ // subtle stone noise
      x.fillStyle = Math.random()<.5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.035)';
      x.fillRect(Math.random()*256, Math.random()*512, 2, 2);
    }
    x.strokeStyle='rgba(28,24,22,.3)'; x.lineWidth=2; // transverse paver joints
    for(let y=0;y<=512;y+=64){ x.beginPath(); x.moveTo(0,y); x.lineTo(256,y); x.stroke(); }
    [11,245].forEach(bx=>{ // festive border band: soft dots + small diamonds
      x.fillStyle='rgba(230,220,200,.55)';
      for(let y=20;y<512;y+=40){ x.beginPath(); x.arc(bx,y,3,0,7); x.fill(); }
      x.fillStyle='rgba(214,106,30,.5)';
      for(let y=40;y<512;y+=80){ x.save(); x.translate(bx,y); x.rotate(Math.PI/4); x.fillRect(-4,-4,8,8); x.restore(); }
    });
    const t=new THREE.CanvasTexture(c);
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,10);
    t.anisotropy=renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  const ROAD_LEN = 38, ROAD_CZ = 2.6 + ROAD_LEN/2;   // z 2.6 .. 40.6
  const road = new THREE.Mesh(new THREE.PlaneGeometry(12, ROAD_LEN),
    new THREE.MeshStandardMaterial({ map:roadTex(), color:0x8f887f, roughness:.95 }));
  road.rotation.x = -Math.PI/2; road.position.set(0,.012,ROAD_CZ); scene.add(road);
  // light kerb strips along the full road
  [-6.1,6.1].forEach(x=>{
    const k = new THREE.Mesh(new THREE.BoxGeometry(.24,.07,ROAD_LEN),
      new THREE.MeshStandardMaterial({ color:0x8d857c, roughness:.9 }));
    k.position.set(x,.035,ROAD_CZ); scene.add(k);
  });
  // warm path bulbs along both kerbs, house to far end
  for(let i=0;i<9;i++){
    [-6.45,6.45].forEach(x=>{
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.34,6), M.roof);
      post.position.set(x,.17,4.6+i*2.6); scene.add(post);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.075,8,8), M.bulb);
      bulb.position.set(x,.4,4.6+i*2.6); scene.add(bulb);
    });
  }
  // fences running from the house sides along the road, both sides
  [-1,1].forEach(side=>{
    const fx = side*9.5;
    for(let i=0;i<13;i++){ // posts
      const p = new THREE.Mesh(new THREE.BoxGeometry(.16,1.05,.16),
        new THREE.MeshStandardMaterial({ color:0x7a7066, roughness:.95 }));
      p.position.set(fx,.52,3.6+i*2.3); scene.add(p);
    }
    [.42,.82].forEach(h=>{ // two rails
      const r = new THREE.Mesh(new THREE.BoxGeometry(.05,.05,28.2),
        new THREE.MeshStandardMaterial({ color:0x6b6157, roughness:.95 }));
      r.position.set(fx,h,3.6+6*2.3); scene.add(r);
    });
  });
}

// ---------- flame sprite texture ----------
function radialTex(stops){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,2,64,64,62);
  stops.forEach(s=>g.addColorStop(s[0],s[1]));
  x.fillStyle=g; x.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c); return t;
}
const flameTex = radialTex([[0,'rgba(255,250,210,1)'],[.3,'rgba(255,210,80,.95)'],[.6,'rgba(255,130,30,.55)'],[1,'rgba(255,90,0,0)']]);
const glowTex  = radialTex([[0,'rgba(255,190,90,.8)'],[.5,'rgba(255,150,50,.25)'],[1,'rgba(255,140,40,0)']]);

// ---------- diya builder (ornate style from the user's reference) ----------
function diyaSideTexture(){
  const c=document.createElement('canvas'); c.width=512; c.height=128;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,128);
  g.addColorStop(0,'#c62b1a'); g.addColorStop(.5,'#a51e12'); g.addColorStop(1,'#7e1408');
  x.fillStyle=g; x.fillRect(0,0,512,128);
  // gold wavy bands
  x.strokeStyle='#e8b64c'; x.lineWidth=3;
  for(let row=0; row<3; row++){
    const y=34+row*30; x.beginPath();
    for(let px=0; px<=512; px+=8){ x.lineTo(px, y + Math.sin(px/14)*6); }
    x.stroke();
  }
  return new THREE.CanvasTexture(c);
}
function diyaTopTexture(){
  const S=512, c=document.createElement('canvas'); c.width=c.height=S;
  const x=c.getContext('2d'); x.translate(S/2,S/2);
  const g=x.createRadialGradient(0,0,10,0,0,S*.5);
  g.addColorStop(0,'#ffb347'); g.addColorStop(.6,'#f5821f'); g.addColorStop(1,'#d94f10');
  x.fillStyle=g; x.beginPath(); x.arc(0,0,S*.5,0,7); x.fill();
  // lotus petals
  x.strokeStyle='#c23c0e'; x.fillStyle='#f7941e'; x.lineWidth=3;
  for(let i=0;i<18;i++){ x.save(); x.rotate(i*Math.PI/9);
    x.beginPath(); x.ellipse(0,-S*.28,S*.05,S*.17,0,0,7); x.fill(); x.stroke(); x.restore(); }
  // zigzag ring near rim
  x.strokeStyle='#ffe9b0'; x.lineWidth=5; x.beginPath();
  const n=40, r1=S*.43, r2=S*.46;
  for(let i=0;i<=n*2;i++){ const a=i/(n*2)*Math.PI*2, r=(i%2)?r1:r2;
    x.lineTo(Math.cos(a)*r, Math.sin(a)*r); }
  x.closePath(); x.stroke();
  // centre medallion with swastika (sacred Diwali symbol, as in the reference)
  x.fillStyle='#c62b1a'; x.beginPath(); x.arc(0,0,S*.13,0,7); x.fill();
  x.strokeStyle='#e8b64c'; x.lineWidth=3; x.beginPath(); x.arc(0,0,S*.13,0,7); x.stroke();
  x.strokeStyle='#ffd75e'; x.lineWidth=10; x.lineCap='square';
  const u=S*.05;
  x.beginPath();
  // right-facing swastika
  x.moveTo(-u,-u); x.lineTo(u,-u); x.lineTo(u,-2*u);
  x.moveTo(u,-u); x.lineTo(u,u); x.lineTo(2*u,u);
  x.moveTo(u,u); x.lineTo(-u,u); x.lineTo(-u,2*u);
  x.moveTo(-u,u); x.lineTo(-u,-u); x.lineTo(-2*u,-u);
  x.stroke();
  return new THREE.CanvasTexture(c);
}
const diyaSideTex = diyaSideTexture();
const diyaTopTex  = diyaTopTexture();
const beadGeo = new THREE.SphereGeometry(.028, 6, 6);
const beadMat = new THREE.MeshStandardMaterial({ color:0xffe9b0, metalness:.5, roughness:.3 });
const rimMat  = new THREE.MeshStandardMaterial({ color:0xd9a521, metalness:.7, roughness:.35 });
const bowlMat = new THREE.MeshStandardMaterial({ map:diyaSideTex, roughness:.6 });
const topMat  = new THREE.MeshStandardMaterial({ map:diyaTopTex, roughness:.45 });

const flames = [];   // {fl, gl, on, seed}
function makeDiya(scale, ornate){
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 14, 0, Math.PI*2, Math.PI*.42, Math.PI*.58), bowlMat);
  bowl.scale.set(1,.55,1); g.add(bowl);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), topMat);
  inner.rotation.x = -Math.PI/2; inner.position.y = .12; g.add(inner);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.44,.045,8,28), rimMat);
  rim.rotation.x = Math.PI/2; rim.position.y = .19; g.add(rim);
  if (ornate){
    for(let i=0;i<36;i++){
      const b = new THREE.Mesh(beadGeo, beadMat);
      const a = i/36*Math.PI*2;
      b.position.set(Math.cos(a)*.475, .19, Math.sin(a)*.475);
      g.add(b);
    }
  }
  // curved spout on the left, flame sits above it
  const spout = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 8), bowlMat);
  spout.scale.set(1.5,.4,.8); spout.position.set(-.52,.16,0); g.add(spout);
  const spoutRim = new THREE.Mesh(new THREE.TorusGeometry(.1,.02,6,14), rimMat);
  spoutRim.rotation.x = Math.PI/2; spoutRim.scale.set(1.4,.8,1);
  spoutRim.position.set(-.56,.2,0); g.add(spoutRim);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map:flameTex, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
  fl.position.set(-.56,.45,0); fl.scale.set(.001,.001,1);
  g.add(fl);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.7 }));
  gl.position.set(-.56,.45,0); gl.scale.set(.001,.001,1);
  g.add(gl);
  flames.push({ fl, gl, on:false, seed:Math.random()*10 });
  g.scale.setScalar(scale);
  return g;
}

// the hero diya (close-up in scene 1)
const heroDiya = makeDiya(.9, true);
heroDiya.position.set(0, 0, 5.6);
scene.add(heroDiya);
const heroFlame = flames[0];

// rows of small diyas on the house (roof edge, window sills, plinth) + courtyard
const houseDiyas = new THREE.Group();
for(let i=0;i<11;i++){
  const d = makeDiya(.55);
  d.position.set(-8.5 + i*1.7, 4.12, HD/2+.16);
  houseDiyas.add(d);
}
winX.forEach(x=>{
  const d = makeDiya(.4); d.position.set(x-.5,.92,HD/2+.15); houseDiyas.add(d);
  const d2 = makeDiya(.4); d2.position.set(x+.5,.92,HD/2+.15); houseDiyas.add(d2);
});
for(let i=0;i<7;i++){
  const d = makeDiya(.5);
  d.position.set(-7.8 + i*2.6, .02, 3.55);
  houseDiyas.add(d);
}
scene.add(houseDiyas);
const houseFlameStart = 1; // flames[0] is hero

// ---------- roadside diyas + chakris (ground spinner fireworks) ----------
const chakris = [];
{
  // rows of lit diyas on the road itself, with warm light pools
  const poolGeo = new THREE.PlaneGeometry(1.7,1.7);
  const poolMat = new THREE.MeshBasicMaterial({ map:glowTex, color:0xff9840, transparent:true,
    opacity:.3, depthWrite:false, blending:THREE.AdditiveBlending });
  for(let i=0;i<7;i++){
    [-1,1].forEach(side=>{
      [[side*3.9, 10.6+i*1.7],[side*5.45, 11.5+i*1.7]].forEach(pp=>{
        const d = makeDiya(.42); d.position.set(pp[0], .02, pp[1]); scene.add(d);
        const pool = new THREE.Mesh(poolGeo, poolMat);
        pool.rotation.x=-Math.PI/2; pool.position.set(pp[0], .045, pp[1]); scene.add(pool);
      });
    });
  }
  // chakris: small clay discs that spin and spray golden sparks (ignite at stage 4)
  const chakriSpots = [[-4.7,13.2],[4.7,13.9],[-4.65,16.4],[4.65,17.1],[-4.7,19.6],[4.7,20.3]];
  chakriSpots.forEach(sp=>{
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.22,.24,.07,14), M.clayDark);
    disc.position.y = .05; g.add(disc);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.09,.14,8), M.clay);
    cap.position.y = .14; g.add(cap);
    // two spark rings (gold outer, white inner), spun fast while lit
    const mkRing=(r,n,h,col,size)=>{
      const pos = new Float32Array(n*3);
      for(let i=0;i<n;i++){
        const a = i/n*Math.PI*2;
        pos[i*3]=Math.cos(a)*r; pos[i*3+1]=.1+Math.random()*h; pos[i*3+2]=Math.sin(a)*r;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({
        map:glowTex, color:col, size:size, transparent:true, depthWrite:false,
        blending:THREE.AdditiveBlending, fog:false }));
      pts.visible = false; g.add(pts); return pts;
    };
    g.userData.r1 = mkRing(.55, 40, .5, 0xffb840, .3);
    g.userData.r2 = mkRing(.3, 24, .9, 0xfff2cc, .22);
    g.position.set(sp[0], 0, sp[1]);
    g.userData.on = false; g.userData.seed = Math.random()*10;
    scene.add(g); chakris.push(g);
  });
}

// ---------- floating golden sparkles above the road ----------
const motes = [];
let motePts = null;
{
  const N=90, pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){
    pos[i*3]=(Math.random()*2-1)*5.2; pos[i*3+1]=.4+Math.random()*3.2; pos[i*3+2]=3.4+Math.random()*21;
    motes.push({ s:.2+Math.random()*.5, o:Math.random()*10 });
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  motePts=new THREE.Points(geo, new THREE.PointsMaterial({ map:glowTex, color:0xffd27a, size:.16,
    transparent:true, opacity:.85, depthWrite:false, blending:THREE.AdditiveBlending }));
  motePts.userData.base = pos.slice();
  scene.add(motePts);
}

// ---------- rangoli textures + meshes ----------
function rangoliTex(c1,c2,c3){
  const S=1024, c=document.createElement('canvas'); c.width=c.height=S;
  const x=c.getContext('2d'); x.translate(S/2,S/2);
  const ring=(r,w,col,dash)=>{ x.strokeStyle=col; x.lineWidth=w; if(dash)x.setLineDash(dash);
    x.beginPath(); x.arc(0,0,r,0,7); x.stroke(); x.setLineDash([]); };
  const disc=(r,col)=>{ x.fillStyle=col; x.beginPath(); x.arc(0,0,r,0,7); x.fill(); };
  const dots=(r,n,rad,col)=>{ x.fillStyle=col; for(let i=0;i<n;i++){ x.save(); x.rotate(i*Math.PI*2/n);
    x.beginPath(); x.arc(0,-r,rad,0,7); x.fill(); x.restore(); } };
  const petals=(r,n,pr,pl,col,off,stroke)=>{ for(let i=0;i<n;i++){ x.save(); x.rotate(i*Math.PI*2/n+(off||0));
    x.beginPath(); x.ellipse(0,-r,pr,pl,0,0,7); x.fillStyle=col; x.fill();
    if(stroke){ x.strokeStyle=stroke; x.lineWidth=S*.004; x.stroke(); } x.restore(); } };
  // base disc
  disc(S*.485, c1);
  // outer scalloped border: big petals with white tips
  petals(S*.415, 24, S*.032, S*.072, c2, 0, 'rgba(255,255,255,.85)');
  dots(S*.468, 24, S*.011, '#fff');
  ring(S*.462, S*.006, '#fff', [3,9]);
  ring(S*.372, S*.014, c3);
  ring(S*.358, S*.005, '#fff');
  dots(S*.346, 36, S*.009, '#fff');
  // large petal layer, two alternating colours with white outline
  petals(S*.3, 16, S*.03, S*.085, c3, 0, '#fff');
  petals(S*.3, 16, S*.014, S*.06, c2, Math.PI/16);
  ring(S*.235, S*.01, '#fff', [8,6]);
  // mid disc + second mandala layer
  disc(S*.215, c2);
  petals(S*.16, 12, S*.026, S*.06, c1, 0, '#fff');
  petals(S*.155, 12, S*.012, S*.042, '#fff', Math.PI/12);
  dots(S*.115, 12, S*.01, c3);
  ring(S*.1, S*.006, '#fff');
  // inner flower
  disc(S*.09, c3);
  petals(S*.052, 8, S*.016, S*.034, c1, 0, '#fff');
  dots(S*.026, 8, S*.007, '#fff');
  disc(S*.02, '#fff');
  disc(S*.011, c2);
  return new THREE.CanvasTexture(c);
}
const rangoliGroup = new THREE.Group();
const rangoliSpots = [
  [-2.9, 6.1, 1.45, ['#c2185b','#f8b500','#e25303']],
  [ 2.9, 6.1, 1.45, ['#6a1b9a','#ff8f00','#c2185b']],
  [ 0,   8.6, 1.9,  ['#00796b','#f8e71c','#e25303']],
  [-4.4, 8.7, 1.1,  ['#b23a48','#ffd23e','#00796b']],
  [ 4.4, 8.7, 1.1,  ['#e25303','#f8b500','#6a1b9a']],
];
rangoliSpots.forEach(s=>{
  const t = rangoliTex(s[3][0],s[3][1],s[3][2]);
  const m = new THREE.Mesh(new THREE.CircleGeometry(s[2], 36),
    new THREE.MeshBasicMaterial({ map:t, transparent:true }));
  m.rotation.x = -Math.PI/2; m.position.set(s[0], .03, s[1]);
  m.userData.finalScale = 1; m.scale.setScalar(.001);
  rangoliGroup.add(m);
});
scene.add(rangoliGroup);
// diyas ringing each rangoli
rangoliSpots.forEach(s=>{
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3, d=makeDiya(.32);
    d.position.set(s[0]+Math.cos(a)*s[2]*1.35, .02, s[1]+Math.sin(a)*s[2]*1.35);
    rangoliGroup.add(d);
  }
});

// ---------- string lights (catenary swags of warm bulbs) ----------
const decor = new THREE.Group();   // everything that "switches on" at stage 3
const bulbGeo = new THREE.SphereGeometry(.05, 6, 6);
const bulbMats = [0xffd75e,0xff9d5c,0xffe89a,0xffb3c1,0x9be7ff].map(c=>new THREE.MeshBasicMaterial({color:c}));
function swag(x1,y1,z1,x2,y2,z2,sag,n,matOffset){
  for(let i=0;i<=n;i++){
    const t=i/n;
    const x=x1+(x2-x1)*t, z=z1+(z2-z1)*t;
    const y=y1+(y2-y1)*t - Math.sin(Math.PI*t)*sag;
    const b=new THREE.Mesh(bulbGeo, bulbMats[(i+matOffset)%bulbMats.length]);
    b.position.set(x,y,z); decor.add(b);
  }
}
// along the main roofline (3 swags) and porch canopy edge
swag(-9,3.15,HD/2+.15,-3.1,3.15,HD/2+.15,.5,18,0);
swag(-3.1,3.15,HD/2+.15, 3.1,3.15,HD/2+.15,.55,18,2);
swag( 3.1,3.15,HD/2+.15, 9,3.15,HD/2+.15,.5,18,4);
swag(-3.05,HH+1.15,HD/2+.45, 3.05,HH+1.15,HD/2+.45,.35,14,1);
// down the wall sides
swag(-9,3.15,HD/2+.1,-9,.5,HD/2+.1,.25,10,3);
swag( 9,3.15,HD/2+.1, 9,.5,HD/2+.1,.25,10,0);

// ---------- marigold garlands ----------
const mariGeo = new THREE.SphereGeometry(.075, 7, 7);
function garland(x1,y1,z1,x2,y2,z2,sag,n){
  for(let i=0;i<=n;i++){
    const t=i/n;
    const x=x1+(x2-x1)*t, z=z1+(z2-z1)*t;
    const y=y1+(y2-y1)*t - Math.sin(Math.PI*t)*sag;
    const m=new THREE.Mesh(mariGeo, (i%3===1)?M.marigold2:M.marigold);
    m.position.set(x,y,z); decor.add(m);
    if(i%4===0){ const lf=new THREE.Mesh(new THREE.ConeGeometry(.06,.16,5), M.leaf);
      lf.position.set(x,y-.12,z); lf.rotation.x=Math.PI; decor.add(lf); }
  }
}
// swags over each window + big swag over the door
winX.forEach(x=> garland(x-.85,2.62,HD/2+.12, x+.85,2.62,HD/2+.12, .3, 12));
garland(-2.3,3.05,HD/2+.14, 2.3,3.05,HD/2+.14, .6, 20);
// hanging strands beside the door
[-1.35,1.35].forEach(x=>{
  for(let i=0;i<10;i++){
    const m=new THREE.Mesh(mariGeo,(i%3===1)?M.marigold2:M.marigold);
    m.position.set(x, 2.9 - i*.26, HD/2+.14); decor.add(m);
  }
});
decor.visible = false;
scene.add(decor);

// ---------- sky lanterns ----------
const lanterns = [];
const lanternGroup = new THREE.Group(); scene.add(lanternGroup);
for(let i=0;i<16;i++){
  const g = new THREE.Group();
  const bodyL = new THREE.Mesh(new THREE.SphereGeometry(.12,10,10),
    new THREE.MeshBasicMaterial({ color:0xffc46a }));
  bodyL.scale.set(1,1.25,.9); g.add(bodyL);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, transparent:true,
    depthWrite:false, blending:THREE.AdditiveBlending, opacity:.9 }));
  gl.scale.set(.62,.62,1); g.add(gl);
  g.position.set(-6.5+Math.random()*13, -3-Math.random()*3, 4.5+Math.random()*2);
  g.userData = { vy:.5+Math.random()*.45, sway:Math.random()*Math.PI*2, sa:.2+Math.random()*.35, on:false };
  lanternGroup.add(g); lanterns.push(g);
}

// ---------- fireworks ----------
const fwGroup = new THREE.Group(); scene.add(fwGroup);
const fwColors = [0xffd23e,0xff8c1a,0xff4d6d,0x7bed9f,0x70a1ff,0xff6b81,0xf8e71c];
const bursts = [];   // {points, vel[], life}
let rockets = [];
function launchRocket(){
  const c = fwColors[(Math.random()*fwColors.length)|0];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]),3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color:c, size:.3, transparent:true }));
  const sx=-7+Math.random()*14;
  p.position.set(sx, 0, -2-Math.random()*4);
  p.userData = { vy:9+Math.random()*3, vx:(Math.random()-.5)*1.2, ty:7.5+Math.random()*4, color:c };
  fwGroup.add(p); rockets.push(p);
}
function explode(r){
  const n=110, pos=new Float32Array(n*3), vel=[];
  for(let i=0;i<n;i++){
    pos[i*3]=r.position.x; pos[i*3+1]=r.position.y; pos[i*3+2]=r.position.z;
    const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), sp=2.2+Math.random()*3.2;
    vel.push([Math.sin(ph)*Math.cos(th)*sp, Math.cos(ph)*sp, Math.sin(ph)*Math.sin(th)*sp]);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const p=new THREE.Points(g, new THREE.PointsMaterial({ color:r.userData.color, size:.22,
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
  fwGroup.add(p);
  bursts.push({ p, vel, life:1 });
  fwGroup.remove(r);
}
function stepFireworks(dt){
  rockets = rockets.filter(r=>{
    r.position.y += r.userData.vy*dt;
    r.position.x += r.userData.vx*dt;
    r.userData.vy -= 2.2*dt;
    if (r.position.y >= r.userData.ty || r.userData.vy < 1){ explode(r); return false; }
    return true;
  });
  for(let i=bursts.length-1;i>=0;i--){
    const b=bursts[i]; b.life -= dt*.5;
    const a = b.p.geometry.attributes.position.array;
    for(let j=0;j<b.vel.length;j++){
      a[j*3]+=b.vel[j][0]*dt; a[j*3+1]+=b.vel[j][1]*dt; a[j*3+2]+=b.vel[j][2]*dt;
      b.vel[j][1]-=1.6*dt; b.vel[j][0]*=.985; b.vel[j][1]*=.985; b.vel[j][2]*=.985;
    }
    b.p.geometry.attributes.position.needsUpdate = true;
    b.p.material.opacity = Math.max(b.life,0);
    if (b.life<=0){ fwGroup.remove(b.p); bursts.splice(i,1); }
  }
}

// ---------- camera keyframes ----------
const CAMS = {
  0: { p:[0,1.05,8.6],  t:[0,.55,5.6] },
  1: { p:[0,1.05,8.6],  t:[0,.55,5.6] },
  2: { p:[0,1.8,9.6],   t:[0,.4,5.6]  },
  3: { p:[0,2.5,13.6], t:[0,2.3,0]   },
  4: { p:[0,3.9,22.5], t:[0,2.6,0]   },
  5: { p:[0,4.6,23.5], t:[0,5.2,0]   },
};
let camFrom = CAMS[0], camTo = CAMS[0], camT = 1, camDur = 2.5;
function flyTo(stage, dur){
  camFrom = { p:camera.position.toArray(), t:curTarget.toArray() };
  camTo = { p: camPos(stage), t: CAMS[stage].t }; camT = 0; camDur = dur || 2.5;
}
function camPos(n){
  const p = CAMS[n].p.slice();
  const a = innerWidth/innerHeight;
  if (a < 1){ const zf = 1 + (1-a)*1.5; p[2] = p[2]*zf - 3*(zf-1); p[1] *= (1+(1-a)*.5); }
  return p;
}
const curTarget = new THREE.Vector3().fromArray(CAMS[0].t);
camera.position.fromArray(camPos(0));
camera.lookAt(curTarget);
function ease(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }

// ---------- flame helpers ----------
function ignite(f){ f.on = true; }

// ---------- stage machine ----------
const prompts = {
  0:'Tap to light the diya', 1:'Tap for rangoli',
  2:'Tap to release the sky lanterns', 3:'Tap for the drone view', 4:'', 5:''
};
const pill = document.getElementById('tapPill');
const hint = document.getElementById('hint');
let stage = 0, rangoliT = 1, finaleTimer = null, fwTimer = null;

function setStage(n, instant){
  stage = n; body.dataset.stage = n;
  if (n>=1){ ignite(heroFlame); diyaLight.intensity = 1.6; }
  if (n>=2){ rangoliT = instant ? 1 : 0;
    if (instant) rangoliGroup.children.forEach(m=>{ if (m.geometry && m.geometry.type==='CircleGeometry') m.scale.setScalar(1); });
  }
  if (n>=3){
    decor.visible = true;
    M.doorGlow.emissiveIntensity = 1.4;
    M.winGlow.emissiveIntensity = 1.1;
    doorLight.intensity = 1.9; courtLight.intensity = 1.35; yardLight.intensity = .75; roadLight.intensity = .35;
    for(let i=houseFlameStart;i<flames.length;i++) ignite(flames[i]);
    lanterns.forEach(l=>l.userData.on=true);
    if (instant) lanterns.forEach(l=>{ l.position.y = 4.5+Math.random()*8; });
  }
  if (n>=4 && !fwTimer){
    fwTimer = setInterval(launchRocket, 750);
    launchRocket(); setTimeout(launchRocket, 350);
  }
  if (n>=4) chakris.forEach(c=>{ c.userData.on = true; c.userData.r1.visible = true; c.userData.r2.visible = true; });
  if (instant && n>=4){
    for(let i=0;i<4;i++){ // pre-detonated bursts for the snapshot
      const r = { position:new THREE.Vector3(-6+i*4, 9+ (i%2)*2.5, -2), userData:{color:fwColors[i%fwColors.length]} };
      explode(r); bursts.forEach(b=>b.life=.75);
    }
  }
  const p = prompts[n];
  if (p){ pill.textContent = p; pill.classList.remove('hidden'); }
  else pill.classList.add('hidden');
  if (n>=3) hint.style.opacity = 0;
  clearTimeout(finaleTimer);
  if (n===4 && !instant) finaleTimer = setTimeout(()=>setStage(5), 7000);
  clearInterval(demoTimer);
  if (n===5 && window.__sparkle){
    if (demo){
      const cycle = ()=>{ document.getElementById('namesLine').textContent = names[demoIdx % names.length];
        demoIdx++; window.__sparkle(); };
      cycle(); demoTimer = setInterval(cycle, 2600);
    } else window.__sparkle();
  }
  if (!instant) flyTo(n, n===4 ? 3.4 : 2.4);
  else { camT = 1; camera.position.fromArray(camPos(n)); curTarget.fromArray(CAMS[n].t); camera.lookAt(curTarget); }
}
function onTap(){ if (stage < 4) setStage(stage+1); }
canvas.addEventListener('click', onTap);
pill.addEventListener('click', e=>{ e.stopPropagation(); onTap(); });
document.getElementById('replay').addEventListener('click', e=>{ e.stopPropagation(); location.reload(); });

// ---------- name picker (when no ?name= / ?stage=) ----------
function applyName(nm){
  document.getElementById('namesLine').textContent = nm;
}
if (!single && !params.get('stage') && !demo){
  body.classList.add('picker'); pill.classList.add('hidden'); hint.style.opacity = 0;
  const pl = document.getElementById('plist');
  names.forEach(nm=>{
    const b = document.createElement('button'); b.textContent = nm;
    b.onclick = ()=>{ body.classList.remove('picker'); applyName(nm);
      pill.classList.remove('hidden'); hint.style.opacity = 1; };
    pl.appendChild(b);
  });
}

// ---------- animation loop ----------
const clock = new THREE.Clock();
let elapsed = 0;
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05); elapsed += dt;
  // camera
  if (camT < 1){
    camT = Math.min(1, camT + dt/camDur);
    const k = ease(camT);
    camera.position.set(
      camFrom.p[0]+(camTo.p[0]-camFrom.p[0])*k,
      camFrom.p[1]+(camTo.p[1]-camFrom.p[1])*k,
      camFrom.p[2]+(camTo.p[2]-camFrom.p[2])*k);
    curTarget.set(
      camFrom.t[0]+(camTo.t[0]-camFrom.t[0])*k,
      camFrom.t[1]+(camTo.t[1]-camFrom.t[1])*k,
      camFrom.t[2]+(camTo.t[2]-camFrom.t[2])*k);
    camera.lookAt(curTarget);
  } else if (stage>=4){ // gentle drone drift
    camera.position.x = Math.sin(elapsed*.12)*.9;
    camera.position.y = camPos(4)[1] + Math.sin(elapsed*.2)*.25;
    camera.lookAt(curTarget);
  }
  // flames flicker
  flames.forEach(f=>{
    if (!f.on) return;
    const s = .9 + Math.sin(elapsed*13+f.seed*7)*.12 + Math.sin(elapsed*29+f.seed*3)*.07;
    f.fl.scale.set(.19*s, .3*s*(1+Math.sin(elapsed*17+f.seed)*.08), 1);
    f.gl.scale.set(.95*s, .95*s, 1);
  });
  // chakris spin and spray sparks
  chakris.forEach(c=>{
    if (!c.userData.on) return;
    c.userData.r1.rotation.y += dt*22; c.userData.r2.rotation.y -= dt*30;
    const p = .85 + Math.sin(elapsed*11+c.userData.seed)*.25;
    c.userData.r1.scale.setScalar(p); c.userData.r2.scale.setScalar(1.1-(p-.85));
    c.rotation.y += dt*14;
  });
  // sparkles drift above the road
  if (motePts){
    const pa = motePts.geometry.attributes.position, bb = motePts.userData.base;
    for(let i=0;i<motes.length;i++){
      pa.array[i*3+1] = .4 + ((bb[i*3+1]-.4 + elapsed*motes[i].s) % 3.4);
      pa.array[i*3]   = bb[i*3] + Math.sin(elapsed*.7+motes[i].o)*.25;
    }
    pa.needsUpdate = true;
  }
  // hero diya light breathes
  if (heroFlame.on) diyaLight.intensity = 1.5 + Math.sin(elapsed*11)*.25;
  // rangoli pop-in
  if (rangoliT < 1){
    rangoliT = Math.min(1, rangoliT + dt*.7);
    rangoliGroup.children.forEach((m,i)=>{
      if (!m.geometry || m.geometry.type!=='CircleGeometry') return;
      const k = Math.min(1, Math.max(0, rangoliT*1.6 - i*.12));
      const e = 1+Math.sin(k*Math.PI)*.15;
      m.scale.setScalar(Math.max(k*e, .001));
    });
  }
  // lanterns
  lanterns.forEach(l=>{
    if (!l.userData.on) return;
    l.userData.sway += dt*.6;
    l.position.y += l.userData.vy*dt;
    l.position.x += Math.sin(l.userData.sway)*l.userData.sa*dt;
    if (l.position.y > 22){ l.position.y = -3; l.position.x = -6.5+Math.random()*13; }
  });
  stepFireworks(dt);
  renderer.render(scene, camera);
}
animate();


// ---------- sparkle particle greeting text ----------
const sCanvas = document.getElementById('sparkle');
const sCtx = sCanvas.getContext('2d');
let sParts = [], sFree = [], sOn = false, sT = 0, sLines = [], sW = 0, sH = 0, sHalo = null;
const GOLD = ['#ffffff','#fff6c8','#ffffff','#ffe98a','#ffd23e','#ffdf6e','#ffef9e'];
function buildSparkle(){
  const dpr = Math.min(devicePixelRatio||1, 2);
  const W = sCanvas.width = innerWidth*dpr, H = sCanvas.height = innerHeight*dpr;
  const off = document.createElement('canvas'); off.width=W; off.height=H;
  const x = off.getContext('2d');
  const name = document.getElementById('namesLine').textContent || '';
  let big = Math.min(W*.15, 150*dpr);
  let nameSize = big*.62;
  x.font = 'bold '+nameSize+'px Georgia, serif';
  while (x.measureText(name).width > W*.9 && nameSize > 12*dpr){
    nameSize *= .94; x.font = 'bold '+nameSize+'px Georgia, serif';
  }
  const P = H > W;  // portrait: keep text clear of the house
  const lines = [
    { t:'Happy Diwali', font:'bold '+big+'px Georgia, serif',         y:H*(P?.14:.14), px:big },
    { t:'from',         font:'italic '+(big*.42)+'px Georgia, serif', y:H*(P?.66:.28), px:big*.42 },
    { t:name,           font:'bold '+nameSize+'px Georgia, serif',    y:H*(P?.76:.42), px:nameSize },
  ];
  x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#fff';
  lines.forEach(l=>{ x.font=l.font; l.w = x.measureText(l.t).width; x.fillText(l.t, W/2, l.y); });
  sLines = lines; sW = W; sH = H;
  const img = x.getImageData(0,0,W,H).data;
  const step = Math.max(2, Math.round(1.8*dpr));
  sParts = [];
  for(let py=0; py<H; py+=step){
    for(let px=0; px<W; px+=step){
      if (img[(py*W+px)*4+3] > 120){
        sParts.push({ x:px, y:py, c:GOLD[(Math.random()*GOLD.length)|0],
          ph:Math.random()*6.28, sp:2+Math.random()*4, sz:(1.3+Math.random()*1.5)*dpr*(H>W?1.3:1),
          fl: Math.random()<.06 });
      }
    }
  }
  sHalo = document.createElement('canvas'); sHalo.width = W; sHalo.height = H;
  const hx = sHalo.getContext('2d');
  for (const l of lines){
    const rx = Math.max(l.w*.78, l.px*3), ry = l.px*1.35;
    const g = hx.createRadialGradient(W/2, l.y, 0, W/2, l.y, rx);
    g.addColorStop(0, 'rgba(6,3,16,.78)');
    g.addColorStop(.65, 'rgba(6,3,16,.5)');
    g.addColorStop(1, 'rgba(6,3,16,0)');
    hx.save(); hx.translate(W/2, l.y); hx.scale(1, ry/rx); hx.translate(-W/2, -l.y);
    hx.fillStyle = g;
    hx.beginPath(); hx.arc(W/2, l.y, rx, 0, 7); hx.fill();
    hx.restore();
  }
  sFree = [];
  for(let i=0;i<130;i++){
    sFree.push({ x:Math.random()*W, y:H*(.25+Math.random()*.5), vy:-(8+Math.random()*20)*dpr/60,
      c:GOLD[(Math.random()*GOLD.length)|0], ph:Math.random()*6.28, sz:(0.8+Math.random()*1.4)*dpr });
  }
}
const FREEZE = !!params.get('freeze');
let sDrew = false;
function sparkleLoop(){
  if (!(FREEZE && sDrew)) requestAnimationFrame(sparkleLoop);
  if (!sOn) return;
  sT += .016;
  sCtx.clearRect(0,0,sCanvas.width,sCanvas.height);
  if (sHalo) sCtx.drawImage(sHalo, 0, 0);
  sDrew = true;
  for(const p of sParts){
    let a = .78 + .22*Math.sin(sT*p.sp + p.ph);
    if (p.fl) a = Math.pow(Math.max(Math.sin(sT*p.sp*1.7+p.ph),0), 6)*1.6; // sharp twinkle flashes
    if (a<=.03) continue;
    sCtx.globalAlpha = Math.min(a,1);
    sCtx.fillStyle = p.c;
    sCtx.fillRect(p.x, p.y, p.sz, p.sz);
  }
  for(const f of sFree){
    f.y += f.vy; f.x += Math.sin(sT+f.ph)*.3;
    if (f.y < sCanvas.height*.18){ f.y = sCanvas.height*.75; f.x = Math.random()*sCanvas.width; }
    sCtx.globalAlpha = .25 + .55*Math.max(Math.sin(sT*3+f.ph),0);
    sCtx.fillStyle = f.c;
    sCtx.fillRect(f.x, f.y, f.sz, f.sz);
  }
  sCtx.globalAlpha = 1;
}
sparkleLoop();
window.__sparkle = function(){
  body.classList.add('sparkle-text');
  buildSparkle();
  sOn = true;
};
addEventListener('resize', ()=>{ if (sOn) buildSparkle(); });

// ---------- deep link for screenshots / testing: ?stage=N ----------
window.__setStage = setStage;   // automation hook for recording
const jump = parseInt(params.get('stage')||'0',10);
if (jump>0){ body.classList.add('snap'); setStage(Math.min(jump,5), true); body.classList.remove('snap'); }
window.__cam = function(){ return { stage: stage, camT: camT, pos: camera.position.toArray().map(v=>+v.toFixed(2)), tgt: curTarget.toArray().map(v=>+v.toFixed(2)) }; };
})();
