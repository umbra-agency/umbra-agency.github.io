/* Umbra — template servizi ambientali: animazioni e 3D */
(function(){
'use strict';
var H=document.documentElement, A=window.AZ||{}, RM=H.classList.contains('rm');
var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var isDesk=function(){return window.matchMedia('(min-width:900px)').matches};

/* ---------- immagini: fallback se una foto non c'è ---------- */
$$('img[data-fb]').forEach(function(im){
  function sw(){ if(im.dataset.fb && im.src.indexOf(im.dataset.fb)<0){ im.src=im.dataset.fb; im.closest('.ph')&&im.closest('.ph').classList.add('ph--fb'); } }
  im.addEventListener('error',sw); if(im.complete && im.naturalWidth===0) sw();
});

/* ---------- intro Umbra: si chiude da sola ---------- */
var intro=$('#intro');
function closeIntro(){ if(!intro||intro.classList.contains('out')) return; intro.classList.add('out'); try{sessionStorage.setItem('amb-intro','1')}catch(e){} document.dispatchEvent(new Event('intro:done')); }
if(intro && !H.classList.contains('no-intro')){ setTimeout(closeIntro,2900); intro.addEventListener('click',closeIntro); }
else document.dispatchEvent(new Event('intro:done'));

/* ---------- nav ---------- */
var nav=$('.nav'), lastY=0;
function onScroll(y){
  if(!nav) return;
  nav.classList.toggle('is-scrolled', y>40);
  nav.classList.toggle('is-hidden', y>lastY && y>400);
  lastY=y;
}

/* ---------- smooth scroll ---------- */
var lenis=null;
if(!RM && window.Lenis){
  lenis=new Lenis({duration:1.15,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))},smoothWheel:true});
  lenis.on('scroll',function(e){onScroll(e.scroll); if(window.ScrollTrigger) ScrollTrigger.update();});
  if(window.gsap){ gsap.ticker.add(function(t){lenis.raf(t*1000)}); gsap.ticker.lagSmoothing(0); }
  else { (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0); }
} else window.addEventListener('scroll',function(){onScroll(window.scrollY)},{passive:true});
$$('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=$(a.getAttribute('href'));if(!t)return;e.preventDefault(); if(lenis) lenis.scrollTo(t,{offset:-70}); else t.scrollIntoView({behavior:'smooth'});});});

/* ---------- reveal ---------- */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
$$('.rv,.ln,.img-rv').forEach(function(el){io.observe(el)});

/* ---------- contatori ---------- */
var cio=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;cio.unobserve(e.target);var el=e.target,to=parseFloat(el.dataset.to),dec=(el.dataset.to.split('.')[1]||'').length,t0=null,d=1600;
  if(RM||isNaN(to)){return}
  function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/d),v=to*(1-Math.pow(1-p,4));el.textContent=fmt(v,dec);if(p<1)requestAnimationFrame(f)} el.textContent=fmt(0,dec);requestAnimationFrame(f);})},{threshold:.4});
function fmt(v,dec){return v.toLocaleString('it-IT',{minimumFractionDigits:dec,maximumFractionDigits:dec})}
$$('[data-to]').forEach(function(el){cio.observe(el)});

/* ---------- parole che si accendono ---------- */
$$('.say').forEach(function(el){
  var ws=$$('.w',el); if(!ws.length) return;
  function upd(){var r=el.getBoundingClientRect(),vh=innerHeight,p=(vh*.85-r.top)/(r.height+vh*.35);p=Math.max(0,Math.min(1,p));var n=Math.round(p*ws.length);ws.forEach(function(w,i){w.classList.toggle('on',i<n)})}
  if(RM){ws.forEach(function(w){w.classList.add('on')});return}
  window.addEventListener('scroll',upd,{passive:true}); if(lenis) lenis.on('scroll',upd); upd();
});

/* ---------- form dimostrativo ---------- */
$$('form.form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();f.classList.add('sent');var b=$('.btn',f);if(b)b.textContent='Richiesta pronta (anteprima)';})});

/* ---------- foto che segue il cursore (I) ---------- */
var cph=$('.cursor-ph');
if(cph && isDesk() && !RM){
  var cimg=$('img',cph), mx=0,my=0,cx=0,cy=0;
  $$('.idx__row').forEach(function(r){
    r.addEventListener('mouseenter',function(){var s=r.dataset.img;if(s){cimg.src=s; if(r.dataset.fb) cimg.dataset.fb=r.dataset.fb;}cph.classList.add('on')});
    r.addEventListener('mouseleave',function(){cph.classList.remove('on')});
  });
  window.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY});
  (function lp(){cx+=(mx-cx)*.14;cy+=(my-cy)*.14;cph.style.left=cx+'px';cph.style.top=cy+'px';requestAnimationFrame(lp)})();
}

/* ---------- metodo: foto sticky che cambia (I) ---------- */
var mph=$('.meth__ph');
if(mph){ var mimgs=$$('img',mph);
  var mio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=+e.target.dataset.i;mimgs.forEach(function(im,j){im.classList.toggle('on',j===i)})}})},{rootMargin:'-45% 0px -45% 0px'});
  $$('.meth__step').forEach(function(s){mio.observe(s)}); }

/* ---------- tilt 3D delle card (I) ---------- */
$$('.tcard').forEach(function(c,i){
  if(RM||!isDesk())return;
  c.style.transform='rotateX(8deg) rotateY('+(i-1)*-8+'deg) translateZ(0)';
  c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='rotateX('+(-y*14)+'deg) rotateY('+(x*16)+'deg) translateZ(30px)'});
  c.addEventListener('mouseleave',function(){c.style.transform='rotateX(8deg) rotateY('+(i-1)*-8+'deg)'});
});

/* ---------- galleria a trascinamento (X) ---------- */
$$('.strip').forEach(function(s){var d=false,sx=0,sl=0;
  s.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;d=true;sx=e.clientX;sl=s.scrollLeft;s.style.scrollSnapType='none';s.style.cursor='grabbing'});
  window.addEventListener('pointerup',function(){if(!d)return;d=false;s.style.scrollSnapType='';s.style.cursor=''});
  window.addEventListener('pointermove',function(e){if(d)s.scrollLeft=sl-(e.clientX-sx)});});

/* ---------- GSAP: pin e scrub ---------- */
function gsapStuff(){
  if(!window.gsap||!window.ScrollTrigger||RM) return;
  gsap.registerPlugin(ScrollTrigger);
  var mm=gsap.matchMedia();

  // servizi orizzontali (T)
  mm.add('(min-width:900px)',function(){
    $$('.hs').forEach(function(sec){
      var tr=$('.hs__track',sec), cnt=$('.hs__count b',sec), cards=$$('.hs__card',sec);
      var dist=function(){return Math.max(0,tr.scrollWidth-innerWidth+48)};
      gsap.to(tr,{x:function(){return -dist()},ease:'none',scrollTrigger:{trigger:sec,pin:$('.hs__pin',sec),start:'top top',end:function(){return '+='+dist()},scrub:.6,invalidateOnRefresh:true,
        onUpdate:function(st){if(cnt){var i=Math.min(cards.length,1+Math.floor(st.progress*cards.length));cnt.textContent=String(i).padStart(2,'0')}}}});
      cards.forEach(function(c){var im=$('img',c); if(im) gsap.fromTo(im,{scale:1.18},{scale:1,ease:'none',scrollTrigger:{trigger:sec,start:'top top',end:function(){return '+='+dist()},scrub:true}})});
    });
  });

  // foto che si apre (T)
  $$('.open').forEach(function(sec){
    var ph=$('.open__ph',sec), im=$('img',ph);
    gsap.to(ph,{clipPath:'inset(0% 0% 0% 0% round 0px)',ease:'none',scrollTrigger:{trigger:sec,start:'top top',end:'60% bottom',scrub:true}});
    gsap.to(im,{scale:1,ease:'none',scrollTrigger:{trigger:sec,start:'top bottom',end:'bottom top',scrub:true}});
    gsap.from($('.open__t',sec),{opacity:0,y:40,scrollTrigger:{trigger:sec,start:'20% top',end:'45% top',scrub:true}});
  });

  // ciclo: tracciato che si disegna (T)
  $$('.cyc').forEach(function(sec){
    var path=$('.cyc__path',sec), dots=$$('.cyc__dot',sec), its=$$('.cyc__it',sec), mid=$('.cyc__mid b',sec), len=path?path.getTotalLength():0;
    if(path){path.style.strokeDasharray=len;path.style.strokeDashoffset=len;}
    ScrollTrigger.create({trigger:sec,start:'top 65%',end:'bottom 45%',scrub:.4,onUpdate:function(st){
      var p=st.progress; if(path) path.style.strokeDashoffset=len*(1-p);
      var k=Math.min(its.length-1,Math.floor(p*its.length*0.999));
      its.forEach(function(it,i){it.classList.toggle('on',i<=k)}); dots.forEach(function(d,i){d.classList.toggle('on',i<=k)});
      if(mid && its[k]) mid.textContent=its[k].dataset.t;
    }});
  });

  // hero I: la foto si allarga
  mm.add('(min-width:701px)',function(){
    $$('.heroI__frame').forEach(function(fr){
      var ph=$('.heroI__ph',fr), im=$('img',ph);
      gsap.to(ph,{width:'100%',height:'100svh',borderRadius:0,ease:'none',scrollTrigger:{trigger:fr,start:'top top',end:'bottom bottom',scrub:true}});
      gsap.to(im,{scale:1,ease:'none',scrollTrigger:{trigger:fr,start:'top top',end:'bottom bottom',scrub:true}});
      gsap.to($('.heroI__cards',fr),{y:-60,ease:'none',scrollTrigger:{trigger:fr,start:'top top',end:'bottom bottom',scrub:true}});
    });
  });

  // parallax foto
  $$('.par').forEach(function(p){var im=$('img',p); if(im) gsap.fromTo(im,{yPercent:-7},{yPercent:7,ease:'none',scrollTrigger:{trigger:p,start:'top bottom',end:'bottom top',scrub:true}})});

  // hero X: sfondo che si allontana
  $$('.heroX').forEach(function(h){gsap.to($('.heroX__bg img',h),{scale:1.25,yPercent:8,ease:'none',scrollTrigger:{trigger:h,start:'top top',end:'bottom top',scrub:true}});
    gsap.to($('.heroX__c',h),{yPercent:-25,opacity:.15,ease:'none',scrollTrigger:{trigger:h,start:'top top',end:'bottom top',scrub:true}});});
  $$('.heroT').forEach(function(h){gsap.to($('.heroT__c',h),{yPercent:-18,opacity:.2,ease:'none',scrollTrigger:{trigger:h,start:'top top',end:'bottom top',scrub:true}})});

  // linea del processo (X)
  $$('.proc').forEach(function(p){var l=$('.proc__line i',p); if(l) gsap.to(l,{scaleX:1,ease:'none',scrollTrigger:{trigger:p,start:'top 80%',end:'bottom 55%',scrub:true}});
    gsap.from($$('.proc__st',p),{opacity:0,y:30,stagger:.12,duration:1,ease:'power3.out',scrollTrigger:{trigger:p,start:'top 80%'}})});

  // bento a cascata (X)
  $$('.bento').forEach(function(b){gsap.from($$('.bx',b),{opacity:0,y:60,stagger:.08,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:b,start:'top 82%'}})});

  window.addEventListener('load',function(){ScrollTrigger.refresh()});
  setTimeout(function(){ScrollTrigger.refresh()},1500);
}
if(window.gsap) gsapStuff(); else window.addEventListener('load',gsapStuff);

/* ---------- WebGL ---------- */
function hexToVec(h){h=(h||'#7fd1b9').replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c}).join('');var n=parseInt(h,16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]}
function canGL(){try{var c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch(e){return false}}

/* Terreno topografico (hero T) */
function terrain(host){
  var THREE=window.THREE; if(!THREE||!canGL()) return;
  var r=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio,2)); host.insertBefore(r.domElement,host.firstChild); host.classList.add('gl');
  var sc=new THREE.Scene(), cam=new THREE.PerspectiveCamera(42,1,.1,200);
  var seg=isDesk()?360:200, g=new THREE.PlaneGeometry(80,80,seg,seg); g.rotateX(-Math.PI/2);
  var acc=hexToVec(A.acc), seed=(A.seed||7)%97;
  var m=new THREE.ShaderMaterial({transparent:true,extensions:{derivatives:true},
    uniforms:{t:{value:0},acc:{value:new THREE.Vector3(acc[0],acc[1],acc[2])},seed:{value:seed},mouse:{value:new THREE.Vector2()}},
    vertexShader:[
      'uniform float t,seed;uniform vec2 mouse;varying float vH;varying vec2 vP;varying float vD;',
      'vec3 hash3(vec2 p){vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9)));return fract(sin(q)*43758.5453);}',
      'float n2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);float a=dot(hash3(i).xy-.5,f),b=dot(hash3(i+vec2(1,0)).xy-.5,f-vec2(1,0)),c=dot(hash3(i+vec2(0,1)).xy-.5,f-vec2(0,1)),d=dot(hash3(i+vec2(1,1)).xy-.5,f-vec2(1,1));return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}',
      'float fbm(vec2 p){float s=0.,a=.55;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+seed;a*=.5;}return s;}',
      'void main(){vec3 p=position;vec2 q=p.xz*.07+vec2(seed*.13,t*.012);float h=fbm(q)*12.;h+=smoothstep(10.,40.,-p.z)*fbm(q*.5+3.)*14.;',
      'h+=exp(-length(p.xz-mouse*vec2(18.,10.)-vec2(0.,-8.))*.12)*1.6;p.y=h;vH=h;vP=p.xz;',
      'vec4 mv=modelViewMatrix*vec4(p,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}'].join('\n'),
    fragmentShader:[
      'uniform float t;uniform vec3 acc;varying float vH;varying vec2 vP;varying float vD;',
      'void main(){float c=vH*2.1;float f=abs(fract(c)-.5)/fwidth(c);float line=1.-min(f,1.);',
      'float c5=vH*.42;float f5=abs(fract(c5)-.5)/fwidth(c5);float major=1.-min(f5,1.);',
      'vec2 gq=vP*.25;vec2 gf=abs(fract(gq)-.5)/fwidth(gq);float grid=(1.-min(min(gf.x,gf.y),1.))*.12;',
      'float fog=smoothstep(70.,8.,vD);float pulse=smoothstep(.0,.9,sin(vP.y*.12+t*.6)*.5+.5)*.35;',
      'vec3 base=vec3(.70,.78,.80);vec3 col=base*line*.75+acc*major*(1.1+pulse)+base*grid;',
      'float a=(line*.62+major*1.+grid*1.4)*fog;gl_FragColor=vec4(col,a);}'].join('\n')});
  var mesh=new THREE.Mesh(g,m); sc.add(mesh);
  // nodi luminosi
  var pts=new THREE.BufferGeometry(), N=26, pos=new Float32Array(N*3);
  for(var i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*50;pos[i*3+1]=6+Math.random()*3;pos[i*3+2]=-Math.random()*45+8}
  pts.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{t:{value:0},acc:{value:m.uniforms.acc.value}},
    vertexShader:'uniform float t;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vA=.6+.4*sin(t*1.5+position.x);gl_PointSize=(70./-mv.z)*(1.+.3*sin(t*2.+position.z));gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 acc;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);a=a*a;gl_FragColor=vec4(acc+.25,a*vA);}'});
  sc.add(new THREE.Points(pts,pm));
  var mx=0,my=0,tx=0,ty=0,sy=0;
  window.addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5});
  function size(){var w=host.clientWidth,h=host.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()} size(); window.addEventListener('resize',size);
  var vis=true; new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(host);
  var clock=new THREE.Clock();
  (function loop(){requestAnimationFrame(loop); if(!vis) return; var t=clock.getElapsedTime();
    mx+=(tx-mx)*.04;my+=(ty-my)*.04;sy=Math.min(1,window.scrollY/innerHeight);
    m.uniforms.t.value=t;pm.uniforms.t.value=t;m.uniforms.mouse.value.set(mx,my);
    cam.position.set(mx*6+4,15-sy*7+my*-2,24-sy*6);cam.lookAt(mx*3+6,1,-14);
    mesh.position.z=(t*.8)%3.2*0; r.render(sc,cam);})();
}

/* Particelle che cambiano forma (hero X) */
function particles(host){
  var THREE=window.THREE; if(!THREE||!canGL()) return;
  var r=new THREE.WebGLRenderer({antialias:false,alpha:true}); r.setPixelRatio(Math.min(devicePixelRatio,2));
  host.appendChild(r.domElement);
  var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,.1,100); cam.position.z=13;
  var N=isDesk()?16000:7000, g=new THREE.BufferGeometry();
  var A0=new Float32Array(N*3),A1=new Float32Array(N*3),A2=new Float32Array(N*3),A3=new Float32Array(N*3),rnd=new Float32Array(N);
  for(var i=0;i<N;i++){
    // nuvola
    var u=Math.random(),v=Math.random(),th=u*6.283,ph=Math.acos(2*v-1),rr=6+Math.random()*5;
    A0.set([rr*Math.sin(ph)*Math.cos(th)*1.4,rr*Math.sin(ph)*Math.sin(th)*.8,rr*Math.cos(ph)*.8],i*3);
    // cubo (balla compressa): punti sulle facce
    var f=i%6,a=Math.random()*2-1,b=Math.random()*2-1,s=2.6,c=[0,0,0];var ax=f>>1,sg=(f&1)?1:-1;c[ax]=sg;c[(ax+1)%3]=a;c[(ax+2)%3]=b;
    A1.set([c[0]*s*1.25,c[1]*s,c[2]*s],i*3);
    // sfera
    var th2=Math.random()*6.283,ph2=Math.acos(2*Math.random()-1),r2=3.3;
    A2.set([r2*Math.sin(ph2)*Math.cos(th2),r2*Math.sin(ph2)*Math.sin(th2),r2*Math.cos(ph2)],i*3);
    // anello (ciclo)
    var tt=Math.random()*6.283,pp=Math.random()*6.283,R=3.6,rt=.55+Math.random()*.25;
    A3.set([(R+rt*Math.cos(pp))*Math.cos(tt),(R+rt*Math.cos(pp))*Math.sin(tt),rt*Math.sin(pp)],i*3);
    rnd[i]=Math.random();
  }
  g.setAttribute('position',new THREE.BufferAttribute(A0,3));g.setAttribute('a1',new THREE.BufferAttribute(A1,3));g.setAttribute('a2',new THREE.BufferAttribute(A2,3));g.setAttribute('a3',new THREE.BufferAttribute(A3,3));g.setAttribute('rnd',new THREE.BufferAttribute(rnd,1));
  var acc=hexToVec(A.acc);
  var m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{t:{value:0},k:{value:0},acc:{value:new THREE.Vector3(acc[0],acc[1],acc[2])},px:{value:Math.min(devicePixelRatio,2)}},
    vertexShader:['uniform float t,k,px;attribute vec3 a1,a2,a3;attribute float rnd;varying float vR;varying float vZ;',
      'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
      'void main(){float kk=clamp(k,0.,3.);float e1=smoothstep(0.,1.,clamp(kk,0.,1.)),e2=smoothstep(0.,1.,clamp(kk-1.,0.,1.)),e3=smoothstep(0.,1.,clamp(kk-2.,0.,1.));',
      'float d=rnd*.25;vec3 p=mix(position,a1,smoothstep(d,d+.75,e1));p=mix(p,a2,smoothstep(d,d+.75,e2));p=mix(p,a3,smoothstep(d,d+.75,e3));',
      'p+=vec3(sin(t*.7+rnd*30.),cos(t*.5+rnd*20.),sin(t*.6+rnd*10.))*(.06+.5*(1.-e1));',
      'p.xz=rot(t*.12+e3*.4)*p.xz;p.yz=rot(.35+e3*.55)*p.yz;',
      'vec4 mv=modelViewMatrix*vec4(p,1.);vZ=-mv.z;vR=rnd;gl_PointSize=(1.4+rnd*2.2)*px*(14./vZ);gl_Position=projectionMatrix*mv;}'].join('\n'),
    fragmentShader:['uniform vec3 acc;varying float vR;varying float vZ;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=smoothstep(.5,0.,d);',
      'vec3 c=mix(vec3(.95,.94,.9),acc,step(.62,vR));gl_FragColor=vec4(c,a*(.55+.45*vR)*smoothstep(22.,9.,vZ));}'].join('\n')});
  var pts=new THREE.Points(g,m); sc.add(pts); pts.position.x=isDesk()?3.6:0; pts.position.y=isDesk()?.6:1.8;
  function size(){var w=host.clientWidth,h=host.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()} size(); window.addEventListener('resize',size);
  var vis=true; new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(host);
  var clock=new THREE.Clock(), k=0, mx=0,tx=0;
  window.addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5});
  (function loop(){requestAnimationFrame(loop); if(!vis) return; var t=clock.getElapsedTime();
    // forma: tempo (si assembla da sola) + scroll
    var ph=Math.max(0,(t-.8)*.42), base=ph<1?ph:2-Math.cos((ph-1)*.75);
    var sp=Math.min(1,window.scrollY/innerHeight*1.4), target=base*(1-sp);
    k+=(target-k)*.06; mx+=(tx-mx)*.05; pts.rotation.y=mx*.6;
    m.uniforms.t.value=t; m.uniforms.k.value=k; r.render(sc,cam);})();
}

function boot3d(){
  if(RM) return;
  var ht=$('.heroT'); if(ht) terrain(ht);
  var hx=$('.heroX'); if(hx) particles(hx);
}
if(window.THREE) boot3d(); else window.addEventListener('load',boot3d);

window.addEventListener('load',function(){setTimeout(function(){$$('img[loading="lazy"]').forEach(function(i){i.loading='eager'})},1200)});
/* card foto 3D in hero T */
$$('.heroT__card').forEach(function(c){if(RM||!isDesk())return;var tx=0,ty=0,x=0,y=0;window.addEventListener('pointermove',function(e){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5});(function l(){x+=(tx-x)*.06;y+=(ty-y)*.06;c.style.transform='perspective(1400px) rotateY('+(-16+x*10)+'deg) rotateX('+(4-y*8)+'deg)';requestAnimationFrame(l)})()});
H.classList.add('ok');
})();
