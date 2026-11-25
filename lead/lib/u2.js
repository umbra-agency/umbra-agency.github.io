/* Umbra · motore comune delle anteprime, v2
   - apertura breve, poi html.is-in avvia la regia dell'hero
   - scroll morbido con il mouse, ancore comprese
   - [data-p] riceve --p (0..1 mentre attraversa la finestra); U.pin(el,cb) dà --t lungo una traccia sticky
   - U.shader / U.three / U.env per le scene WebGL */
(function(){
  var d=document,de=d.documentElement,b=d.body,U=window.U={};
  var reduce=U.reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=U.fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  U.clamp=function(v,a,z){return v<a?a:v>z?z:v};
  U.lerp=function(a,z,t){return a+(z-a)*t};
  U.map=function(v,a,z){return U.clamp((v-a)/(z-a),0,1)};
  U.ease=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
  U.out=function(t){return 1-Math.pow(1-t,3)};
  de.classList.add('js');

  /* apertura */
  var hold=reduce||/[?&]nointro/.test(location.search)?0:1150;
  if(hold){var it=d.createElement('div');it.className='u-intro';it.setAttribute('aria-hidden','true');it.innerHTML='<div><i></i><b>umbra</b><small></small></div>';
    it.querySelector('small').textContent=b.getAttribute('data-umbra')||'anteprima riservata';b.appendChild(it);setTimeout(function(){it.remove()},2150)}
  setTimeout(function(){de.classList.add('is-in')},hold);

  /* etichetta con la nota */
  var note=b.getAttribute('data-note');
  if(note){var tg=d.createElement('div');tg.className='u-tag';tg.innerHTML='<p></p><button type="button" aria-expanded="false"><i></i>Anteprima Umbra</button>';tg.querySelector('p').textContent=note;
    var tb=tg.querySelector('button'),tog=function(o){tg.classList.toggle('open',o);tb.setAttribute('aria-expanded',o)};
    tb.onclick=function(){tog(!tg.classList.contains('open'))};
    setTimeout(function(){b.appendChild(tg);requestAnimationFrame(function(){requestAnimationFrame(function(){tog(true)})});setTimeout(function(){tog(false)},5500)},hold+1600)}

  /* stato dello scroll */
  var cbs=[],els=[],y=scrollY,tick=false,darks=[].slice.call(d.querySelectorAll('[data-dark]'));
  function run(){tick=false;var ny=scrollY,vh=innerHeight,vy=ny-y;y=ny;
    for(var k=0;k<els.length;k++){var el=els[k],r=el.getBoundingClientRect();
      if(el._pin){var t=U.clamp(-r.top/Math.max(1,r.height-vh),0,1);if(t!==el._t){el._t=t;el.style.setProperty('--t',t.toFixed(4));if(el._cb)el._cb(t)}}
      else if(r.bottom>-vh*.4&&r.top<vh*1.4)el.style.setProperty('--p',U.clamp((vh-r.top)/(vh+r.height),0,1).toFixed(4))}
    var od=false;for(k=0;k<darks.length;k++){r=darks[k].getBoundingClientRect();if(r.top<=40&&r.bottom>40){od=true;break}}de.classList.toggle('on-dark',od);
    de.classList.toggle('scrolled',y>60);if(Math.abs(vy)>2)de.classList.toggle('going-down',vy>0&&y>320);
    for(k=0;k<cbs.length;k++)cbs[k](y,vy)}
  function req(){if(!tick){tick=true;requestAnimationFrame(run)}}
  U.onScroll=function(f){cbs.push(f);f(scrollY,0)};
  U.pin=function(el,f){el._pin=true;el._cb=f;el._t=-1;if(els.indexOf(el)<0)els.push(el);req()};
  U.refresh=function(){d.querySelectorAll('[data-p]').forEach(function(e){if(els.indexOf(e)<0){if(e.getAttribute('data-p')==='pin')e._pin=true;els.push(e)}});req()};
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);addEventListener('load',req);U.refresh();

  /* in vista, una volta */
  var ins=d.querySelectorAll('[data-in]');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.25});ins.forEach(function(e){io.observe(e)})}
  else ins.forEach(function(e){e.classList.add('in')});

  /* scroll morbido */
  var tgt=scrollY,cur=scrollY,going=0;
  function lim(){return de.scrollHeight-innerHeight}
  function step(){if(!going)return;cur+=(tgt-cur)*(going===2?.075:.125);if(Math.abs(tgt-cur)<.5){cur=tgt;going=0}scrollTo(0,cur);if(going)requestAnimationFrame(step)}
  function go(to,slow){tgt=U.clamp(to,0,lim());if(reduce){scrollTo(0,tgt);return}var was=going;going=slow?2:1;if(!was){cur=scrollY;requestAnimationFrame(step)}}
  U.scrollTo=function(el){go(typeof el==='number'?el:el.getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(de).scrollPaddingTop)||0),true)};
  if(fine&&!reduce){
    addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      for(var n=e.target;n&&n!==b&&n.nodeType===1;n=n.parentNode){if(n.hasAttribute('data-native'))return;if(n.scrollHeight>n.clientHeight+2){var o=getComputedStyle(n).overflowY;if(o==='auto'||o==='scroll')return}}
      e.preventDefault();if(!going)tgt=scrollY;go(tgt+e.deltaY*(e.deltaMode===1?32:e.deltaMode===2?innerHeight:1))},{passive:false});
    addEventListener('scroll',function(){if(going&&Math.abs(scrollY-cur)>4){going=0}},{passive:true});
    addEventListener('keydown',function(){going=0});addEventListener('pointerdown',function(){going=0})}
  d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var id=a.getAttribute('href').slice(1),el=id?d.getElementById(id):null;if(id&&!el)return;e.preventDefault();U.scrollTo(el||0)});

  /* frammento a tutto schermo */
  U.shader=function(cv,frag,o){o=o||{};var gl;try{gl=cv.getContext('webgl',{antialias:false,alpha:!!o.alpha,premultipliedAlpha:false})}catch(e){}
    if(!gl){de.classList.add('nogl');return null}
    function sh(t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(x));return x}
    var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,'precision highp float;uniform vec2 u_res;uniform float u_time;'+frag));gl.linkProgram(p);gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);var a=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    var loc={},vals=o.uniforms||{},vis=true,t0=performance.now(),dpr=Math.min(o.dpr||1.5,devicePixelRatio||1),loop=o.loop!==false&&!reduce;
    function L(k){return loc[k]||(loc[k]=gl.getUniformLocation(p,k))}
    function draw(){var w=Math.round(cv.clientWidth*dpr),h=Math.round(cv.clientHeight*dpr);if(!w||!h)return;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h)}
      gl.uniform2f(L('u_res'),w,h);gl.uniform1f(L('u_time'),(performance.now()-t0)/1000);
      for(var k in vals){var v=vals[k];if(typeof v==='number')gl.uniform1f(L(k),v);else if(v.length===2)gl.uniform2f(L(k),v[0],v[1]);else gl.uniform3f(L(k),v[0],v[1],v[2])}
      gl.drawArrays(gl.TRIANGLES,0,3)}
    if(loop){new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(cv);(function f(){if(vis)draw();requestAnimationFrame(f)})()}else{draw();addEventListener('resize',draw)}
    return{gl:gl,draw:draw,set:function(k,v){vals[k]=v;if(!loop)draw()}}};

  /* scena three.js con ridimensionamento, pausa fuori vista e riflessi */
  U.three=function(cv,o){var T=window.THREE;o=o||{};var r;try{r=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:o.alpha!==false,powerPreference:'high-performance'})}catch(e){}
    if(!r){de.classList.add('nogl');return null}
    r.setPixelRatio(Math.min(o.dpr||2,devicePixelRatio||1));r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=o.exposure||1;
    if(o.shadows){r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap}
    var sc=new T.Scene(),cam=new T.PerspectiveCamera(o.fov||30,1,.1,300),vis=true,fr=[],t0=performance.now(),pw=0,ph=0;
    function draw(){var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;if(w!==pw||h!==ph){pw=w;ph=h;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
      var t=(performance.now()-t0)/1000;for(var k=0;k<fr.length;k++)fr[k](t);r.render(sc,cam)}
    new IntersectionObserver(function(e){vis=e[0].isIntersecting},{rootMargin:'120px'}).observe(cv);
    if(reduce){addEventListener('resize',draw);addEventListener('scroll',function(){requestAnimationFrame(draw)},{passive:true});setTimeout(draw,60)}
    else (function f(){if(vis)draw();requestAnimationFrame(f)})();
    return{T:T,renderer:r,scene:sc,camera:cam,render:draw,frame:function(f){fr.push(f)}}};
  U.env=function(T,r,top,bot,boxes){var pm=new T.PMREMGenerator(r),s=new T.Scene();
    var geo=new T.SphereGeometry(30,32,16),col=[],ps=geo.attributes.position,ca=new T.Color(top),cb=new T.Color(bot),c=new T.Color();
    for(var i=0;i<ps.count;i++){var h=ps.getY(i)/60+.5;h=h*h*(3-2*h);c.copy(cb).lerp(ca,h);col.push(c.r,c.g,c.b)}
    geo.setAttribute('color',new T.Float32BufferAttribute(col,3));s.add(new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
    (boxes||[[-7,8,5,10,6,6],[9,3,-4,3,10,2.5],[0,-4,10,14,2,1.2]]).forEach(function(q){var m=new T.Mesh(new T.PlaneGeometry(q[3],q[4]),new T.MeshBasicMaterial({color:new T.Color(q[5],q[5],q[5]),side:T.DoubleSide}));m.position.set(q[0],q[1],q[2]);m.lookAt(0,0,0);s.add(m)});
    var t=pm.fromScene(s,.035).texture;pm.dispose();return t};
})();
