/* Immobildream Prestigio · la lastra di travertino dell'apertura
   Il claim è inciso in una mappa di altezze (canvas 2D), la pietra è procedurale,
   la luce radente segue il cursore. Niente librerie. */
(function () {
  var cv = document.getElementById('stone');
  if (!cv) return;
  var de = document.documentElement, hero = cv.parentNode;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var gl;
  try { gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) {}
  if (!gl) { de.classList.add('nogl'); return; }
  var deriv = gl.getExtension('OES_standard_derivatives');

  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FRAG = [
    deriv ? '#extension GL_OES_standard_derivatives : enable' : '',
    'precision highp float;',
    'uniform vec2 u_res;uniform sampler2D u_ink;uniform sampler2D u_cut;',
    'uniform vec2 u_light;uniform float u_carve;uniform float u_dim;uniform vec2 u_tx;uniform float u_scale;uniform float u_foot;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return s;}',
    'void main(){',
    ' vec2 uv=vec2(gl_FragCoord.x/u_res.x,1.-gl_FragCoord.y/u_res.y);',
    ' float asp=u_res.x/u_res.y;',
    ' vec2 p=vec2(uv.x*asp,uv.y)*u_scale;',
    // strati del travertino: bande orizzontali morbide, appena ondulate
    ' float cloud=fbm(p*.9+11.);',
    ' float warp=fbm(p*vec2(.5,1.8)+3.1);',
    ' float y=p.y+(warp-.5)*.32;',
    ' float strata=fbm(vec2(p.x*.5,y*7.));',
    ' float vein=smoothstep(.90,1.,1.-abs(sin(y*19.+strata*5.5)))*smoothstep(.4,.7,noise(vec2(p.x*.8,y*3.)+2.7));',
    // incisione: gradiente dalla mappa sfocata
    ' float front=smoothstep(0.,1.,u_carve*1.35-uv.x*.35);',
    ' float c0=texture2D(u_cut,uv).r;',
    ' float gx=texture2D(u_cut,uv+vec2(u_tx.x,0.)).r-texture2D(u_cut,uv-vec2(u_tx.x,0.)).r;',
    ' float gy=texture2D(u_cut,uv+vec2(0.,u_tx.y)).r-texture2D(u_cut,uv-vec2(0.,u_tx.y)).r;',
    ' float inkr=texture2D(u_ink,uv).r;float ink=inkr*front;float ins=mix(.2,1.,inkr)*front;',
    // cavità: piccole, allungate lungo gli strati, a grappoli; nessuna vicino alle lettere
    ' float dens=smoothstep(.48,.78,noise(vec2(p.x*.6,y*4.2)+8.3));',
    ' float a=noise(vec2(p.x*15.,y*82.));',
    ' float b=noise(vec2(p.x*33.,y*128.)+31.7);',
    ' float a2=noise(vec2(p.x*8.,y*44.)+5.1);',
    ' float holes=max(smoothstep(.73,.87,a)*smoothstep(.40,.66,b),smoothstep(.81,.91,a2)*.7)*dens*(1.-smoothstep(0.,.18,c0));',
    // zone calme: dietro il testo in basso e dietro la testata
    ' float wx=asp>1.1?.25:.8;',
    ' float calm=max(smoothstep(u_foot-.125,u_foot+.015,uv.y)*(1.-smoothstep(wx,wx+.2,abs(uv.x-.5))),1.-smoothstep(.06,.14,uv.y));',
    ' holes*=1.-calm*.93;',
    ' float grain=noise(p*380.);',
    ' float hs=-holes+strata*.05+grain*.018;',
    deriv ? ' vec2 sd=clamp(vec2(dFdx(hs),-dFdy(hs)),-.22,.22);' : ' vec2 sd=vec2(0.);',
    ' vec3 n=normalize(vec3(gx*5.2*ins-sd.x*.85,gy*5.2*ins-sd.y*.85,1.));',
    // luce: una radente fissa dall alto a sinistra, più quella che segue il cursore
    ' vec3 L0=normalize(vec3(-.52,-.62,.56));',
    ' vec3 lp=vec3((u_light-uv)*vec2(asp,1.),.38);',
    ' float d2=dot(lp.xy,lp.xy);',
    ' vec3 L1=normalize(lp);',
    ' float att=1./(1.+d2*1.5);',
    ' float d0=max(dot(n,L0),0.);',
    ' float d1=max(dot(n,L1),0.);',
    // rilievo: quanto la normale si scosta dal piano, per ciascuna luce
    ' float r0=d0-L0.z;float r1=d1-L1.z;',
    ' float lit=.845+.80*r0+att*(.19*L1.z+1.25*r1);',
    // colore della pietra
    ' vec3 st=mix(vec3(.868,.838,.782),vec3(.925,.903,.858),strata);',
    ' st*=.965+.07*cloud;',
    ' st=mix(st,vec3(.80,.755,.675),vein*.30);',
    ' st*=1.-holes*.25;',
    ' st+=(grain-.5)*.016;',
    ' vec3 warm=mix(vec3(1.),vec3(1.03,.985,.915),clamp(d1*att*1.2,0.,1.));',
    ' vec3 col=st*lit*warm;',
    // lettere dipinte di scuro dentro il solco, come sulle targhe delle strade
    ' float cut=c0*front;',
    ' col*=1.-cut*.22*mix(.35,1.,inkr);',
    ' vec3 paint=vec3(.135,.122,.108)*(.55+.75*lit);',
    ' col=mix(col,paint,ink*.74);',
    // bordo e scroll
    ' vec2 q=uv-.5;float vig=1.-dot(q,q)*.26;',
    ' col*=vig*(1.-u_dim*.34);',
    ' col+=(hash(gl_FragCoord.xy)-.5)*.012;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(t, s) {
    var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(x)); return null; }
    return x;
  }
  var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { de.classList.add('nogl'); return; }
  var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { de.classList.add('nogl'); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var al = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['u_res', 'u_ink', 'u_cut', 'u_light', 'u_carve', 'u_dim', 'u_tx', 'u_scale', 'u_foot'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  function tex(unit) {
    var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  var tInk = tex(0), tCut = tex(1);
  gl.uniform1i(U.u_ink, 0); gl.uniform1i(U.u_cut, 1);

  /* ---- la scritta ---- */
  var tc = document.createElement('canvas'), c2 = tc.getContext('2d', { willReadFrequently: true });
  var FONT = '"Cinzel",Georgia,serif';
  function spaced(text, size, weight, track) {
    c2.font = weight + ' ' + size + 'px ' + FONT;
    var native = 'letterSpacing' in c2;
    if (native) c2.letterSpacing = (track * size) + 'px';
    var w;
    if (native) w = c2.measureText(text).width - track * size;
    else { w = 0; for (var i = 0; i < text.length; i++) w += c2.measureText(text[i]).width + (i < text.length - 1 ? track * size : 0); }
    return { w: w, native: native };
  }
  function draw(text, size, weight, track, cx, y) {
    var m = spaced(text, size, weight, track), x = cx - m.w / 2;
    if (m.native) { c2.textAlign = 'left'; c2.fillText(text, x, y); c2.letterSpacing = '0px'; }
    else for (var i = 0; i < text.length; i++) { c2.fillText(text[i], x, y); x += c2.measureText(text[i]).width + track * size; }
  }
  function fit(lines, weight, track, maxW, maxSize) {
    var s = 100, widest = 0;
    lines.forEach(function (l) { widest = Math.max(widest, spaced(l, s, weight, track).w); });
    if ('letterSpacing' in c2) c2.letterSpacing = '0px';
    return Math.min(maxSize, s * maxW / widest);
  }
  function blur(src, w, h, r) {
    var tmp = new Float32Array(w * h), k = 1 / (r + r + 1), x, y, i, acc;
    for (y = 0; y < h; y++) {
      var row = y * w; acc = 0;
      for (i = -r; i <= r; i++) acc += src[row + Math.min(w - 1, Math.max(0, i))];
      for (x = 0; x < w; x++) { tmp[row + x] = acc * k; acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)]; }
    }
    for (x = 0; x < w; x++) {
      acc = 0;
      for (i = -r; i <= r; i++) acc += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
      for (y = 0; y < h; y++) { src[y * w + x] = acc * k; acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; }
    }
  }
  var W = 0, H = 0, txt = { x: 0, y: 0 };
  var hdr = document.querySelector('.top'), foot = document.querySelector('.hero__foot'), footAt = -1;
  function build() {
    tc.width = W; tc.height = H;
    c2.fillStyle = '#000'; c2.fillRect(0, 0, W, H); c2.fillStyle = '#fff'; c2.textBaseline = 'alphabetic';
    var ch = cv.clientHeight || 1, k = H / ch;
    var wide = W / H > 1.12, low = wide && ch < 780;
    var big = wide ? ['SOLIDE · REALTÀ'] : ['SOLIDE', 'REALTÀ'];
    var small = wide ? ['IMMOBILDREAM NON VENDE SOGNI MA'] : ['IMMOBILDREAM', 'NON VENDE SOGNI MA'];
    // la fascia libera: sotto la testata, sopra la domanda. L'iscrizione ci deve stare tutta
    footAt = foot ? foot.offsetTop : Math.round(ch * .66);
    var bandT = (hdr ? hdr.offsetHeight : 70) * k + H * (wide ? .035 : .02);
    var bandB = footAt * k - H * (wide ? .05 : .035);
    function lay(b) {
      var s1 = Math.max(b * (wide ? .215 : .25), 13.5 * k);
      s1 = Math.min(s1, fit(small, 600, .2, W * .84, 999));
      var g = b * (wide ? .52 : .46), l1 = b * .98, l2 = s1 * 1.75;
      return { ss: s1, gap: g, bl: l1, sl: l2, total: small.length * l2 + g + big.length * l1 - l1 * .28 };
    }
    var bs = fit(big, 600, .035, W * .80, H * (low ? .19 : wide ? .23 : .15)), L = lay(bs), avail = Math.max(H * .2, bandB - bandT);
    for (var it = 0; it < 4 && L.total > avail; it++) { bs *= Math.max(.6, avail / L.total); L = lay(bs); }
    var ss = L.ss, gap = L.gap, bl = L.bl, sl = L.sl, total = L.total;
    var top = H * (low ? .385 : wide ? .455 : .40) - total / 2;
    top = Math.max(bandT, Math.min(top, bandB - total));
    var y = top + ss * .8, cx = W / 2;
    small.forEach(function (l) { draw(l, ss, 600, .2, cx, y); y += sl; });
    y += gap - sl + bs * .74;
    // filetto inciso sotto la riga piccola
    var rw = Math.min(W * .1, bs * 1.1);
    c2.fillRect(cx - rw / 2, y - bs * .74 - gap * .46, rw, Math.max(1.5, bs * .012));
    big.forEach(function (l) { draw(l, bs, 600, .035, cx, y); y += bl; });
    var img = c2.getImageData(0, 0, W, H).data, n = W * H, ink = new Uint8Array(n), i;
    for (i = 0; i < n; i++) ink[i] = img[i * 4];
    // mappa del solco a metà risoluzione
    var hw = W >> 1, hh = H >> 1, cut = new Float32Array(hw * hh), xx, yy;
    for (yy = 0; yy < hh; yy++) for (xx = 0; xx < hw; xx++) {
      var o = (yy * 2) * W + xx * 2;
      cut[yy * hw + xx] = (ink[o] + ink[o + 1] + ink[o + W] + ink[o + W + 1]) * .25;
    }
    var r = Math.max(1, Math.round(bs * .011));
    blur(cut, hw, hh, r); blur(cut, hw, hh, r); blur(cut, hw, hh, Math.max(1, r - 1));
    var cu = new Uint8Array(hw * hh); for (i = 0; i < hw * hh; i++) cu[i] = cut[i];
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tInk);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, W, H, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, ink);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tCut);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, hw, hh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, cu);
    gl.uniform2f(U.u_tx, 1.25 / hw, 1.25 / hh);
    gl.uniform1f(U.u_foot, Math.min(.9, Math.max(.4, footAt / ch)));
  }

  /* ---- stato ---- */
  var dpr = 1, carve = reduce ? 1 : 0, started = 0, live = true, raf = 0;
  var cur = { x: -.25, y: .12 }, tgt = { x: .7, y: .24 }, dim = 0, lastMove = 0, ready = false;
  function size() {
    dpr = Math.min(coarse ? 2 : 1.5, devicePixelRatio || 1);
    var w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (!w || !h) return false;
    if (w === W && h === H) { if (foot && Math.abs(foot.offsetTop - footAt) > 2) build(); return true; }
    W = w; H = h; cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
    gl.uniform2f(U.u_res, W, H); gl.uniform1f(U.u_scale, 2.1);
    build(); return true;
  }
  function render(now) {
    raf = 0;
    if (!ready || !size()) return;
    var busy = false;
    if (carve < 1 && started) { carve = Math.min(1, (now - started) / 2600); busy = true; }
    if (coarse && !reduce && now - lastMove > 2600) {
      tgt.x = .5 + .36 * Math.sin(now * .00027); tgt.y = .30 + .12 * Math.cos(now * .00021); busy = live;
    }
    var k = carve < 1 ? .035 : .075;
    cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k;
    if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > .0015) busy = true;
    var e = 1 - Math.pow(1 - carve, 3);
    gl.uniform2f(U.u_light, cur.x, cur.y); gl.uniform1f(U.u_carve, e); gl.uniform1f(U.u_dim, dim);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (busy && live) req();
  }
  function req() { if (!raf) raf = requestAnimationFrame(render); }

  function point(e) {
    var r = hero.getBoundingClientRect();
    tgt.x = (e.clientX - r.left) / r.width; tgt.y = (e.clientY - r.top) / r.height;
    lastMove = performance.now(); req();
  }
  if (!reduce) {
    addEventListener('pointermove', function (e) { if (live && e.pointerType !== 'touch') point(e); }, { passive: true });
    hero.addEventListener('touchmove', function (e) { if (e.touches[0]) point(e.touches[0]); }, { passive: true });
    hero.addEventListener('touchstart', function (e) { if (e.touches[0]) point(e.touches[0]); }, { passive: true });
  }
  addEventListener('scroll', function () {
    var r = hero.getBoundingClientRect(); dim = Math.min(1, Math.max(0, -r.top / r.height)); if (live) req();
  }, { passive: true });
  var rs; addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(req, 120); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[0].isIntersecting; if (live) req(); }).observe(hero);
  cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); de.classList.add('nogl'); live = false; });

  function go() {
    ready = true; de.classList.add('gl');
    var wait = reduce || /[?&]nointro/.test(location.search) ? 60 : 1250;
    size(); gl.uniform2f(U.u_light, cur.x, cur.y); gl.uniform1f(U.u_carve, carve); gl.uniform1f(U.u_dim, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    setTimeout(function () { started = performance.now(); req(); }, wait);
  }
  var f = document.fonts;
  if (f && f.ready && f.ready.then) f.ready.then(function () { setTimeout(req, 60); });
  if (f && f.load) Promise.all([f.load('600 80px "Cinzel"', 'SOLIDE REALTÀ'), f.load('500 20px "Cinzel"', 'IMMOBILDREAM')]).then(go, go);
  else go();
  window.__stone = { carveNow: function () { carve = 1; started = 1; req(); }, light: function (x, y) { tgt.x = x; tgt.y = y; cur.x = x; cur.y = y; req(); } };
})();
