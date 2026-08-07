import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   PHX — Ember → City → Receipt
   One particle system, four target states, scroll-driven.
   No build step. Degrades to a static mark.
   ═══════════════════════════════════════════════════════════════ */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile  = matchMedia('(max-width: 820px)').matches;
const COUNT   = reduced ? 0 : (mobile ? 15000 : 38000);

const stage = document.getElementById('stage');
const hint  = document.getElementById('hint');

/* ── Scroll progress: 0 → 2 across the three beats ─────────── */
let scrollP = 0, scrollTarget = 0;
function readScroll(){
  const vh = innerHeight;
  const raw = scrollY / vh;                 // beats are 100svh each
  scrollTarget = Math.max(0, Math.min(2, raw));
  if (hint) hint.style.opacity = raw > .25 ? '0' : '1';
}
addEventListener('scroll', readScroll, {passive:true});
readScroll();

/* ── Beat reveal + nav state ───────────────────────────────── */
const beatObs = new IntersectionObserver(es=>{
  es.forEach(e=> e.target.classList.toggle('on', e.intersectionRatio > .45));
},{threshold:[0,.45,.75]});
document.querySelectorAll('.beat').forEach(b=>beatObs.observe(b));

const revObs = new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); revObs.unobserve(e.target);} });
},{threshold:.18, rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.reveal').forEach((el,i)=>{
  el.style.transitionDelay = (i % 4) * 70 + 'ms';
  revObs.observe(el);
});

const nav = document.getElementById('nav');
addEventListener('scroll', ()=> nav.classList.toggle('stuck', scrollY > 60), {passive:true});

/* ── Founding counter ────────────────────────────────────────
   Animates whatever number is already in the markup, so the bar is
   never empty. phx-live.js overwrites both with real data if the
   Supabase call succeeds; if it doesn't, this static value stands. ── */
const CGOAL = 1000;
new IntersectionObserver((es,o)=>{
  es.forEach(e=>{
    if(!e.isIntersecting) return;
    o.unobserve(e.target);
    const n = document.getElementById('f-num');
    const f = document.getElementById('f-fill');
    if(!n || !f) return;                       // live script may have replaced it
    const target = parseInt((n.textContent||'').replace(/[^0-9]/g,''), 10);
    if(!Number.isFinite(target) || target <= 0) return;
    const suffix = n.querySelector('span') ? n.querySelector('span').outerHTML : '';
    requestAnimationFrame(()=> f.style.width = Math.max(target/CGOAL*100, 2).toFixed(1)+'%');
    if(reduced) return;
    const t0 = performance.now(), dur = 1500;
    (function tick(now){
      if(!document.getElementById('f-num')) return;   // live data took over
      const p = Math.min(1,(now-t0)/dur);
      n.innerHTML = Math.round(target*(1-Math.pow(1-p,3))).toLocaleString('en-US') + suffix;
      if(p<1) requestAnimationFrame(tick);
    })(t0);
  });
},{threshold:.4}).observe(document.querySelector('.counter'));

/* ── WebGL ─────────────────────────────────────────────────── */
if (reduced || !COUNT) { document.body.classList.add('no-gl'); }
else { boot().catch(()=> document.body.classList.add('no-gl')); }

async function boot(){
  const host = document.getElementById('gl');
  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({antialias:!mobile, alpha:true, powerPreference:'high-performance'});
  }catch(e){ throw e; }

  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 2));
  renderer.setSize(innerWidth, innerHeight);
  host.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, .1, 200);
  camera.position.set(0,0,9.4);

  /* ── Target A: the phoenix, sampled from the real logo ──── */
  const pts = await samplePhoenix('assets/phoenix-sample.png', COUNT);

  const pos    = new Float32Array(COUNT*3);
  const chaos  = new Float32Array(COUNT*3);
  const phx    = new Float32Array(COUNT*3);
  const city   = new Float32Array(COUNT*3);
  const flow   = new Float32Array(COUNT*3);
  const col    = new Float32Array(COUNT*3);
  const seed   = new Float32Array(COUNT);

  // Six district anchors — the verticals, laid out on the grid
  const DIST = [[-6.4,-1.9,-3.2],[-2.1,-1.9,-6.6],[3.0,-1.9,-4.4],
                [6.6,-1.9,-.8],[2.2,-1.9,2.9],[-4.0,-1.9,3.6]];
  // Five artist nodes for the money-flow beat
  const ART  = [[-5.1,1.35,-.4],[-3.3,2.35,-1.0],[0,3.05,-1.5],[3.3,2.35,-1.0],[5.1,1.35,-.4]];

  for(let i=0;i<COUNT;i++){
    const i3=i*3;
    seed[i]=Math.random();

    // A — chaos shell
    const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), r=7+Math.random()*13;
    chaos[i3]=Math.sin(ph)*Math.cos(th)*r;
    chaos[i3+1]=Math.sin(ph)*Math.sin(th)*r*.62;
    chaos[i3+2]=Math.cos(ph)*r;

    // B — phoenix (from logo alpha), colour from the logo pixel
    const p=pts[i];
    phx[i3]=p.x; phx[i3+1]=p.y; phx[i3+2]=p.z;
    col[i3]=p.r; col[i3+1]=p.g; col[i3+2]=p.b;

    // C — city grid (Phoenix is a grid; lean into it) + district clusters
    if(i % 100 < 22){
      const d=DIST[i%DIST.length];
      const a=Math.random()*Math.PI*2, rr=Math.pow(Math.random(),.6)*1.15;
      city[i3]  = d[0]+Math.cos(a)*rr;
      city[i3+1]= d[1]+Math.pow(Math.random(),2.2)*3.4;   // light shaft
      city[i3+2]= d[2]+Math.sin(a)*rr;
    }else{
      let gx=(Math.random()*2-1)*11.5, gz=(Math.random()*2-1)*11.5;
      if(Math.random()<.5) gx=Math.round(gx/1.62)*1.62; else gz=Math.round(gz/1.62)*1.62;
      city[i3]=gx+(Math.random()-.5)*.07;
      city[i3+1]=-2.0+(Math.random()-.5)*.10;
      city[i3+2]=gz+(Math.random()-.5)*.07;
    }

    // D — money flow: arcs from the member card up to artist nodes, then receipt rows
    if(i % 100 < 44){
      const a=ART[i%ART.length];
      const t=Math.random();
      const sx=0, sy=-2.5, sz=0;                       // the pass
      const cx=a[0]*.45, cy=.6, cz=a[2]*.5-1.0;        // bezier control
      const mt=1-t;
      const sp=.10+t*.42;                              // spray widens along the arc
      flow[i3]  = mt*mt*sx + 2*mt*t*cx + t*t*a[0] + (Math.random()-.5)*sp;
      flow[i3+1]= mt*mt*sy + 2*mt*t*cy + t*t*a[1] + (Math.random()-.5)*sp;
      flow[i3+2]= mt*mt*sz + 2*mt*t*cz + t*t*a[2] + (Math.random()-.5)*sp*1.6;
    }else{
      if(i % 100 < 60){                                 // ambient ember haze
        const a2=Math.random()*Math.PI*2, r2=3.4+Math.random()*5.2;
        flow[i3]  = Math.cos(a2)*r2;
        flow[i3+1]= -3.2+Math.random()*6.4;
        flow[i3+2]= Math.sin(a2)*r2*.5 - 2.0;
      }else{                                            // the receipt's own lines
        const row=i%5;
        flow[i3]  = (Math.random()*2-1)*2.05;
        flow[i3+1]= -.55 - row*.42 + (Math.random()-.5)*.04;
        flow[i3+2]= (Math.random()-.5)*.18;
      }
    }

    pos[i3]=chaos[i3]; pos[i3+1]=chaos[i3+1]; pos[i3+2]=chaos[i3+2];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('aChaos',   new THREE.BufferAttribute(chaos,3));
  geo.setAttribute('aPhoenix', new THREE.BufferAttribute(phx,3));
  geo.setAttribute('aCity',    new THREE.BufferAttribute(city,3));
  geo.setAttribute('aFlow',    new THREE.BufferAttribute(flow,3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(col,3));
  geo.setAttribute('aSeed',    new THREE.BufferAttribute(seed,1));

  const mat = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{
      uTime:{value:0}, uIntro:{value:0}, uScroll:{value:0},
      uSize:{value: mobile?52:64}, uDpr:{value:renderer.getPixelRatio()},
      uOpacity:{value:0}
    },
    vertexShader:`
      uniform float uTime,uIntro,uScroll,uSize,uDpr;
      attribute vec3 aChaos,aPhoenix,aCity,aFlow,aColor;
      attribute float aSeed;
      varying vec3 vColor; varying float vHot;

      float ease(float x){ return x*x*(3.0-2.0*x); }
      // stagger so particles don't all arrive at once
      float stag(float p,float s){
        float o = s*0.34;
        return clamp((p-o)/0.66, 0.0, 1.0);
      }
      void main(){
        vec3 p = mix(aChaos, aPhoenix, ease(stag(uIntro, aSeed)));
        float s1 = clamp(uScroll,      0.0, 1.0);
        float s2 = clamp(uScroll-1.0,  0.0, 1.0);
        p = mix(p, aCity, ease(stag(s1, aSeed)));
        p = mix(p, aFlow, ease(stag(s2, aSeed)));

        // ambient drift — stronger while unsettled
        float unsettled = (1.0-uIntro)*0.8 + 0.22;
        p.x += sin(uTime*0.47 + aSeed*41.0)*0.075*unsettled;
        p.y += cos(uTime*0.39 + aSeed*29.0)*0.075*unsettled;
        p.z += sin(uTime*0.31 + aSeed*23.0)*0.075*unsettled;

        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize*uDpr*(0.45+aSeed*0.85)/max(-mv.z,0.001);
        vColor = aColor;
        vHot = 0.55 + aSeed*0.45;
      }`,
    fragmentShader:`
      precision mediump float;
      uniform float uOpacity;
      varying vec3 vColor; varying float vHot;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = dot(c,c);
        if(d > 0.25) discard;
        float a = 1.0 - smoothstep(0.0, 0.25, d);
        a = pow(a, 2.9);
        // hot core
        vec3 col = mix(vColor, vec3(1.0,0.62,0.20), pow(a,6.0)*0.55*vHot);
        gl_FragColor = vec4(col, a*uOpacity);
      }`
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ── Camera keyframes per beat ─────────────────────────── */
  const CAM=[
    {p:new THREE.Vector3(0, 0, 9.4),   l:new THREE.Vector3(0, 0, 0)},      // phoenix
    {p:new THREE.Vector3(0, 5.6, 11.2),l:new THREE.Vector3(0,-1.7, 0)},    // city from above
    {p:new THREE.Vector3(0, .4, 7.6),  l:new THREE.Vector3(0, .1, 0)}      // flow / receipt
  ];
  const look = new THREE.Vector3();

  /* ── Pointer parallax ──────────────────────────────────── */
  let mx=0,my=0,tmx=0,tmy=0;
  if(!mobile){
    addEventListener('pointermove', e=>{
      tmx=(e.clientX/innerWidth-.5)*2; tmy=(e.clientY/innerHeight-.5)*2;
    },{passive:true});
  }

  addEventListener('resize', ()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    mat.uniforms.uDpr.value=renderer.getPixelRatio();
  });

  /* ── Loop ──────────────────────────────────────────────── */
  const clock=new THREE.Clock();
  let intro=0, running=true;

  /* Adaptive quality — additive overdraw is the cost centre on weak GPUs.
     Sample real frame rate after the intro and shed particles/size if needed. */
  let qFrames=0, qT0=0, qDone=false, qTier=0;
  function quality(t){
    if(qDone) return;
    if(!qT0){ if(t>2.2){ qT0=t; qFrames=0; } return; }
    qFrames++;
    if(t-qT0 < 1.4) return;
    const fps = qFrames/(t-qT0);
    if(fps < 26 && qTier < 2){                 // struggling badly
      qTier=2; geo.setDrawRange(0, Math.floor(COUNT*0.34));
      mat.uniforms.uSize.value *= 1.28; renderer.setPixelRatio(1);
    } else if(fps < 46 && qTier < 1){          // a little tight
      qTier=1; geo.setDrawRange(0, Math.floor(COUNT*0.60));
      mat.uniforms.uSize.value *= 1.14;
      renderer.setPixelRatio(Math.min(1.25, devicePixelRatio));
    }
    mat.uniforms.uDpr.value = renderer.getPixelRatio();
    qDone = true;
  }
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; });

  function frame(){
    requestAnimationFrame(frame);
    if(!running) return;
    const dt=Math.min(clock.getDelta(),.05);
    const t=clock.elapsedTime;
    quality(t);

    intro = Math.min(1, intro + dt*0.42);
    scrollP += (scrollTarget - scrollP) * Math.min(1, dt*5.2);
    mx += (tmx-mx)*Math.min(1,dt*3); my += (tmy-my)*Math.min(1,dt*3);

    mat.uniforms.uTime.value   = t;
    mat.uniforms.uIntro.value  = intro*intro*(3-2*intro);
    mat.uniforms.uScroll.value = scrollP;
    mat.uniforms.uOpacity.value= Math.min(0.95, intro*1.2);

    // interpolate camera across the beat keyframes
    const seg=Math.min(1.999, scrollP), i0=Math.floor(seg), i1=Math.min(2,i0+1), f=seg-i0;
    const sf=f*f*(3-2*f);
    camera.position.lerpVectors(CAM[i0].p, CAM[i1].p, sf);
    // only the phoenix beat needs the portrait pull-back; taper it out after
    const distK = Math.min(1.62, Math.max(1, 1.12/camera.aspect));
    camera.position.multiplyScalar(1 + (distK-1)*(1-Math.min(1,scrollP)));
    camera.position.x += mx*.45; camera.position.y += -my*.30;
    look.lerpVectors(CAM[i0].l, CAM[i1].l, sf);
    camera.lookAt(look);

    // slow signature rotation on the phoenix, settling as we leave it
    points.rotation.y = Math.sin(t*.16)*.09*(1-Math.min(1,scrollP));

    renderer.render(scene,camera);
  }
  frame();

  // fade the stage out once the narrative is done
  const contentTop = document.querySelector('.content');
  new IntersectionObserver(es=>{
    es.forEach(e=> host.style.opacity = e.isIntersecting ? '0' : '1');
  },{threshold:.06}).observe(contentTop);
}

/* ── Sample the real logo into a 3D point cloud ───────────── */
function samplePhoenix(src, n){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{
      const W=img.width,H=img.height;
      const c=document.createElement('canvas'); c.width=W; c.height=H;
      const x=c.getContext('2d',{willReadFrequently:true});
      x.drawImage(img,0,0);
      const d=x.getImageData(0,0,W,H).data;

      const hits=[];
      for(let py=0;py<H;py++){
        for(let px=0;px<W;px++){
          const k=(py*W+px)*4;
          if(d[k+3]>110 && (d[k]+d[k+1]+d[k+2])>150) hits.push(k);
        }
      }
      if(!hits.length) return rej(new Error('empty mark'));

      const SCALE=8.6/Math.max(W,H);
      const out=new Array(n);
      for(let i=0;i<n;i++){
        const k=hits[(Math.random()*hits.length)|0];
        const idx=k/4, px=idx%W, py=(idx/W)|0;
        out[i]={
          x:(px - W/2)*SCALE + (Math.random()-.5)*.028,
          y:(H/2 - py)*SCALE + (Math.random()-.5)*.028,
          z:(Math.random()-.5)*.85,
          r:0.16+d[k]/255*0.40, g:0.02+d[k+1]/255*0.20, b:0.005+d[k+2]/255*0.06
        };
      }
      res(out);
    };
    img.onerror=rej;
    img.src=src;
  });
}
