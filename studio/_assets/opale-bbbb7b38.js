
/* =====================================================================
   STUDIO OPALE · script unico, nessuna libreria esterna
   Ogni blocco è isolato: se uno fallisce, gli altri continuano.
   ===================================================================== */
(function(){
'use strict';
var D=document, H=D.documentElement, W=window;
var $=function(s,c){return (c||D).querySelector(s);};
var $$=function(s,c){return Array.prototype.slice.call((c||D).querySelectorAll(s));};
var RM=!!(W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches);
if(RM) H.classList.add('rm');
var S=W.STUDIO||{};
var enc=encodeURIComponent;
function safe(name,fn){try{fn();}catch(e){if(W.console)console.warn('[studio] '+name,e);}}
function get(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k];},o);}
function setTxt(sel,v){var e=typeof sel==='string'?$(sel):sel;if(e)e.textContent=v;}
function pad(n){return (n<10?'0':'')+n;}
function toMin(s){var p=String(s).split(':');return (+p[0])*60+(+p[1]||0);}
function hm(m){return Math.floor(m/60)+':'+pad(m%60);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function merge(a,b){for(var k in b){if(Object.prototype.hasOwnProperty.call(b,k)){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))merge(a[k],b[k]);else a[k]=b[k];}}return a;}
var GIORNI=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
function dShort(d){try{return d.toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');}catch(e){return d.getDate()+'/'+(d.getMonth()+1);}}
function dLong(d){try{return d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});}catch(e){return d.getDate()+'/'+(d.getMonth()+1);}}
function toast(t){var el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('is-on');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('is-on');},2600);}

/* ---------- scroll: un solo ascoltatore per tutti ---------- */
var subs=[],ticking=false;
function frame(){ticking=false;var y=W.pageYOffset||H.scrollTop||0;for(var i=0;i<subs.length;i++){try{subs[i](y);}catch(e){}}}
function req(){if(!ticking){ticking=true;requestAnimationFrame(frame);}}
W.addEventListener('scroll',req,{passive:true});
W.addEventListener('resize',req);

/* ---------- dati dello studio nella pagina ---------- */
function applyConfig(){
  $$('[data-k]').forEach(function(el){var v=get(S,el.getAttribute('data-k'));if(v!==undefined&&v!==null&&v!=='')el.textContent=v;else if(S.demo===false)el.textContent='';});
  var telN=String(S.tel||'').replace(/\D/g,'');
  var href={
    tel:telN?'tel:+39'+telN:null,
    wa:S.whatsapp?'https://wa.me/'+S.whatsapp+'?text='+enc('Buongiorno, vorrei prenotare una visita.'):null,
    mail:S.email?'mailto:'+S.email:null,
    maps:'https://www.google.com/maps/search/?api=1&query='+enc([S.denominazione,S.indirizzo,S.cap,S.citta].filter(Boolean).join(' ')),
    google:(S.google&&S.google.url)||(S.demo===false&&S.google&&S.google.voto?'https://www.google.com/maps/search/?api=1&query='+enc([S.denominazione,S.citta].filter(Boolean).join(' ')):null)
  };
  $$('[data-href]').forEach(function(a){var h=href[a.getAttribute('data-href')];if(!h&&S.demo===false){var li=a.closest('li');(li||a).parentNode.removeChild(li||a);return;}if(h){a.setAttribute('href',h);if(/^https?:/.test(h)){a.target='_blank';a.rel='noopener';}}});
  if(S.denominazione)D.title=S.denominazione+(S.citta?' · '+S.citta:'');
  var y=new Date().getFullYear();setTxt('#yr',y);
  if(S.dal)setTxt('#fAnni',Math.max(1,y-S.dal));
  if(S.colori){if(S.colori.accento)H.style.setProperty('--aqua',S.colori.accento);if(S.colori.scuro){H.style.setProperty('--ink',S.colori.scuro);H.style.setProperty('--ink-2','color-mix(in srgb,'+S.colori.scuro+' 90%,#fff)');H.style.setProperty('--ink-3','color-mix(in srgb,'+S.colori.scuro+' 80%,#fff)');}}
  var sal=(S.direttore&&S.direttore.saluto);if(sal===undefined||sal===null)sal='Dottore';
  var fem=/^dottoressa/i.test(sal),plu=/^dottori/i.test(sal);
  var U=plu?{alDott:'ai Dottori',alDottL:'ai dottori',perDott:'Per i dottori',perDottL:'per i dottori'}:
        !sal?{alDott:'al titolare',alDottL:'al titolare dello studio',perDott:'Per il titolare',perDottL:'per il titolare'}:
        {alDott:fem?'alla Dottoressa':'al Dottore',alDottL:fem?'alla dottoressa':'al dottore',perDott:fem?'Per la dottoressa':'Per il dottore',perDottL:fem?'per la dottoressa':'per il dottore'};
  $$('[data-u]').forEach(function(e){var v=U[e.getAttribute('data-u')];if(v)e.textContent=v;});
  if(S.umbra&&S.umbra.offerta)setTxt('#uOff',S.umbra.offerta);
  if(S.foto&&S.foto.ritratto){var ph=$('.dr__ph');if(ph){var im=new Image();im.alt='Ritratto di '+((S.direttore&&S.direttore.nome)||'');im.loading='lazy';im.src=S.foto.ritratto;ph.appendChild(im);}}
  if(!(S.umbra&&S.umbra.attivo)){$$('[data-umbra]').forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});var p=$('#pad');if(p)p.style.background='#fff';H.classList.add('no-intro');H.classList.remove('intro-on');}
  var uw=$('#uWa');if(uw&&S.umbra&&S.umbra.whatsapp)uw.href='https://wa.me/'+S.umbra.whatsapp+'?text='+enc('Buongiorno, ho visto l\'anteprima del sito per '+(S.denominazione||'il nostro studio')+'. Vorrei saperne di più.');
  H.classList.add('cfg');
}


/* ---------- studio reale: la pagina si riscrive dai dati, niente contenuti dimostrativi ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function rm(sel){$$(sel).forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});}
function dropSection(id){rm('#'+id);$$('a[href="#'+id+'"]').forEach(function(a){var li=a.closest('li');var t=li||a;if(t.parentNode)t.parentNode.removeChild(t);});}
var OPT={},FALL={};
function extImg(src,alt,fail,ok){var im=new Image(),o=OPT[src],f=FALL[src];if(ok)im.onload=function(){ok(im);};im.loading='lazy';im.decoding='async';im.referrerPolicy='no-referrer';im.alt=alt||'';im.draggable=false;im.onerror=function(){if(o){o=null;im.src=src;}else if(f){var g=f;f=null;im.src=g;}else if(fail)fail();};im.src=o||src;return im;}
var ARROW='<svg class="ic" aria-hidden="true"><use href="#i-ar"/></svg>';
var STARS='<div class="stars" aria-hidden="true">'+new Array(6).join('<svg class="ic ic--f"><use href="#i-star"/></svg>')+'</div>';
function real(){
  H.classList.add('real');
  var T=S.trattamenti||[],TM=S.team||[],TC=S.tecnologie||[],RV=S.recensioni||[],AM=S.ambienti||[],I=S.info||{},hasVoto=!!(S.google&&S.google.voto);
  var tel=S.tel||'';
  /* hero */
  var lead=$('.hero .lead');if(lead)lead.textContent=S.intro||('Studio dentistico a '+(S.citta||'')+'. In questa pagina trovate trattamenti, contatti e la richiesta di appuntamento online.');
  if(!S.dal)$$('.hero .eye [data-k="dal"]').forEach(function(e){var p=e.parentNode;if(p&&p.parentNode)p.parentNode.removeChild(p);});
  rm('.chip--visit');if(!hasVoto)rm('.chip--rate');
  setTxt('.top__mid',[S.indirizzo,S.citta].filter(Boolean).join(', '));
  var facts=[];
  if(S.dal)facts.push([Math.max(1,new Date().getFullYear()-S.dal),'anni di attività a '+(S.citta||'')]);
  if(TM.length>1)facts.push([TM.length,'professionisti in studio']);
  if(T.length)facts.push([T.length,'aree di cura']);
  if(hasVoto)facts.push([S.google.voto,'su '+(S.google.n||'')+' recensioni Google']);
  var fl=$('.facts');if(fl){if(facts.length<2)fl.parentNode.removeChild(fl);else{fl.setAttribute('data-n',facts.length);fl.innerHTML=facts.map(function(f){return '<li><b>'+esc(f[0])+'</b><span>'+esc(f[1])+'</span></li>';}).join('');}}
  /* fotografie vere integrate nella pagina: primo schermo, scheda trattamenti, fascia a tutta larghezza */
  var PH=AM.filter(function(a){return a&&/^(https?:\/\/|\.\.\/|img\/)/.test(a.src||'');}).slice(0,8);
  AM.forEach(function(a){if(a&&a.orig)FALL[a.src]=a.orig;});(S.team||[]).forEach(function(m){if(m&&m.fotoOrig)FALL[m.foto]=m.fotoOrig;});
  PH.forEach(function(a){if(a.w&&Math.max(a.w,a.h||0)>1800)OPT[a.src]='https://wsrv.nl/?url='+encodeURIComponent(a.src)+'&w=1600&q=82&we';});
  var noDim=!PH.some(function(a){return a.w;});
  function ttl(a){return (a.titolo||'Lo studio')+' · '+(S.denominazione||'');}
  var iHero=(S.heroFoto!==false&&PH.length&&(!PH[0].w||Math.min(PH[0].w,PH[0].h)>=420))?0:-1,iBand=-1,iSub=-1,iPv=-1;
  PH.forEach(function(a,i){if(iBand<0&&i!==iHero&&a.w&&a.w>=900&&a.w>=a.h*1.25)iBand=i;});
  if(iBand<0&&noDim&&PH.length>=3)iBand=2;
  if(iHero===0)PH.forEach(function(a,i){if(iSub<0&&i!==iBand&&i>0&&a.w&&a.w>=480&&a.w>=a.h*1.1)iSub=i;});
  if(iHero===0&&noDim&&PH.length>=4)iSub=1;
  PH.forEach(function(a,i){if(iPv<0&&i!==iHero&&i!==iBand&&i!==iSub&&(noDim?i===3:(a.w>=480)))iPv=i;});
  S._bg=(PH[iHero>=0?iHero:0]||{}).src||'';
  S._ph=PH.filter(function(a,i){return i!==iHero&&(!a.w||a.w>=480);}).map(function(a){return a.src;});
  var art=$('.hero__art');
  if(art&&iHero===0){
    var hfg=D.createElement('figure');hfg.className='hero__ph';
    var dropHero=function(){if(hfg.parentNode)hfg.parentNode.removeChild(hfg);rm('.hero__sub');art.classList.remove('has-ph','has-sub');var hh=$('.hero');if(hh)hh.classList.remove('hero--divisa');};
    hfg.appendChild(extImg(PH[0].src,ttl(PH[0]),dropHero,function(im){if(im.naturalWidth<420||im.naturalHeight<360)dropHero();else hfg.classList.add('is-in');}));
    hfg.firstChild.loading='eager';
    var cp=D.createElement('figcaption');cp.textContent=(PH[0].titolo&&PH[0].titolo!=='Lo studio'?PH[0].titolo+' · ':'')+(S.citta||'');hfg.appendChild(cp);
    art.insertBefore(hfg,art.firstChild);art.classList.add('has-ph');
    if(iSub>0){
      var sb=D.createElement('figure');sb.className='hero__sub';
      sb.appendChild(extImg(PH[iSub].src,ttl(PH[iSub]),function(){if(sb.parentNode)sb.parentNode.removeChild(sb);art.classList.remove('has-sub');},function(im){if(im.naturalWidth<480||im.naturalWidth<im.naturalHeight){if(sb.parentNode)sb.parentNode.removeChild(sb);art.classList.remove('has-sub');}else sb.classList.add('is-in');}));
      sb.firstChild.loading='eager';
      art.appendChild(sb);art.classList.add('has-sub');
    }
  }
  if(iBand>=0){
    var bd=D.createElement('section');bd.className='band';bd.setAttribute('aria-label','Lo studio');
    var dropBand=function(){if(bd.parentNode)bd.parentNode.removeChild(bd);};
    var bi=extImg(PH[iBand].src,'',dropBand,function(im){if(im.naturalWidth<900)dropBand();});bi.setAttribute('aria-hidden','true');
    bd.appendChild(bi);
    var bw=D.createElement('div');bw.className='wrap band__in';
    bw.innerHTML='<p class="eye"><span>'+esc(S.citta||'Lo studio')+'</span></p><p class="band__t">'+esc(S.denominazione||'')+'</p><p class="band__s">'+esc([S.indirizzo,[S.cap,S.citta].filter(Boolean).join(' ')].filter(Boolean).join(', '))+'</p><a class="btn btn--aqua" href="#prenota">Prenota una visita '+ARROW+'</a>';
    bd.appendChild(bw);
    var before=$('#chi-siamo')||$('#recensioni')||$('#prenota');if(before&&before.parentNode)before.parentNode.insertBefore(bd,before);
  }
  if(iPv>=0){
    var pvh=$('.pv__h');
    if(pvh){var pf=D.createElement('figure');pf.className='pv__ph';pf.appendChild(extImg(PH[iPv].src,ttl(PH[iPv]),function(){if(pf.parentNode)pf.parentNode.removeChild(pf);}));pvh.appendChild(pf);}
  }
  try{stile(PH,iHero);}catch(e){}
  /* striscia */
  var st=$('#strip ul');if(st){var items=[];if(S.direttore&&S.direttore.nome)items.push((S.direttore.ds?'Direttore sanitario ':'')+S.direttore.nome);T.slice(0,6).forEach(function(t){items.push(t.titolo);});TC.slice(0,3).forEach(function(t){items.push(t.titolo);});if(S.citta)items.push(S.citta);if(items.length<3)rm('.strip');else st.innerHTML=items.map(function(t){return '<li>'+esc(t)+'</li>';}).join('');}
  /* trattamenti */
  var GEN=[['Igiene e prevenzione','Sedute di igiene professionale e controlli periodici.'],['Conservativa ed endodonzia','Cura delle carie e trattamenti canalari.'],['Protesi','Corone, ponti e protesi mobili.'],['Implantologia','Sostituzione dei denti mancanti con impianti.'],['Ortodonzia','Allineamento dei denti per ragazzi e adulti.'],['Parodontologia','Cura delle gengive e dei tessuti di sostegno del dente.']];
  var list=T.length?T.map(function(t){return [t.titolo,t.testo||''];}):GEN,tl=$('#trList');
  if(tl){tl.innerHTML=list.slice(0,10).map(function(t,i){return '<li class="tr__i'+(i?'':' is-on')+'"><button class="tr__h" type="button" aria-expanded="'+(i?'false':'true')+'"><span class="tr__n">'+pad(i+1)+'</span><span class="tr__t">'+esc(t[0])+'</span><svg class="ic tr__x" aria-hidden="true"><use href="#i-plus"/></svg></button><div class="tr__b"><p>'+esc(t[1])+'</p><p style="margin-top:20px"><a class="lnk" href="#prenota" data-mot="prima">Prenota una visita '+ARROW+'</a></p></div></li>';}).join('');}
  var th=$('#trattamenti .h2');if(th)th.innerHTML='Di cosa ci occupiamo, <span class="arc">area per area</span>.';
  setTxt('#trattamenti .lead',T.length?'Le aree di cura dello studio. Per ognuna potete chiedere una visita direttamente da qui.':'Elenco indicativo delle aree di cura: quello definitivo lo scriviamo insieme a voi.');
  /* prima visita: passi generici, senza minuti */
  var PV=[['Accoglienza','Vi riceve la segreteria e raccoglie i dati che servono per la cartella.'],['La visita','Il dentista esamina denti e gengive e ascolta il motivo per cui siete venuti.'],['Il piano di cura','Vi viene spiegato cosa serve, perché, e in quante sedute.'],['Tempi e costi','Prima di iniziare sapete cosa vi aspetta e potete decidere con calma.']];
  $$('.pv__c').forEach(function(c,i){if(!PV[i])return;setTxt($('h3',c),PV[i][0]);setTxt($('p',c),PV[i][1]);rm('.pv__tags');var d=$('.pv__dial',c);if(d){d.style.setProperty('--a',i*11.25);d.style.setProperty('--b',(i+1)*11.25);setTxt($('span',d),(i+1)+' di 4');}});
  var ph=$('#prima-visita .h2');if(ph)ph.innerHTML='La prima visita, <span class="arc">un passo alla volta</span>.';
  setTxt('#prima-visita .lead','Cosa succede la prima volta che venite in studio.');
  /* ambienti: fotografie vere */
  var tr=$('#stTrack');
  if(tr){
    var ok=AM.filter(function(a){return a&&/^https?:\/\//.test(a.src||'');}).slice(0,8);
    if(!ok.length)dropSection('studio');
    else{
      tr.innerHTML='';
      var renum=function(){var c=$$('.st__c',tr);if(!c.length){dropSection('studio');return;}c.forEach(function(f,i){setTxt($('.st__k',f),pad(i+1));});setTxt('#stTot',pad(c.length));if(c.length<2)rm('.st__ctl');};
      ok.forEach(function(a){var f=D.createElement('figure');f.className='st__c';f.innerHTML='<div class="st__ph"></div><figcaption><span class="st__k"></span><div><h3>'+esc(a.titolo||'Lo studio')+'</h3><p>'+esc(a.testo||'')+'</p></div></figcaption>';
        $('.st__ph',f).appendChild(extImg(a.src,(a.titolo||'Lo studio')+' · '+(S.denominazione||''),function(){if(f.parentNode){f.parentNode.removeChild(f);renum();}},function(im){if(im.naturalHeight>im.naturalWidth*1.12)f.classList.add('is-v');else if(im.naturalWidth<760)f.classList.add('is-s');}));tr.appendChild(f);});
      renum();
      var sh=$('#studio .h2');if(sh)sh.innerHTML='Lo studio, <span class="arc">prima di entrarci</span>.';
      setTxt('#studio .lead','Le fotografie dello studio'+(S.citta?' a '+S.citta:'')+'.');
    }
  }
  /* tecnologia */
  var tg=$('#tecGrid');
  if(tg){if(!TC.length)dropSection('tecnologia');else{tg.innerHTML=TC.slice(0,6).map(function(t,i){return '<article class="tc tc--w"><span class="tc__ic"><svg class="ic" aria-hidden="true"><use href="#'+['i-cube','i-micro','i-shield','i-wave'][i%4]+'"/></svg></span><h3>'+esc(t.titolo)+'</h3><p>'+esc(t.testo||'')+'</p></article>';}).join('');
    var th2=$('#tecnologia .h2');if(th2)th2.innerHTML='Gli strumenti <span class="arc">dello studio</span>.';setTxt('#tecnologia .lead','Le attrezzature con cui lavoriamo ogni giorno.');}}
  /* casi clinici: solo con materiale vero dello studio */
  /* prima e dopo: illustrazioni dichiarate come esempio, mai presentate come casi dello studio */
  $$('a[href="#casi"]').forEach(function(a){a.textContent='Prima e dopo';});
  var ce=$('#casi .eye span');if(ce)ce.textContent='Prima e dopo · esempi';
  var ch2=$('#casi .h2');if(ch2)ch2.innerHTML='Come cambia un sorriso, <span class="arc">in tre esempi</span>.';
  setTxt('#casi .lead','Tre percorsi tipici, illustrati: problema, piano, tempi e mantenimento. Trascinate la linea per confrontare prima e dopo.');
  setTxt('#casi .fine','Illustrazioni di esempio: non sono pazienti né risultati di questo studio. Nella versione definitiva qui entrano i casi dello studio, pubblicati con il consenso scritto dei pazienti. I risultati dipendono dalla situazione clinica di partenza.');
  var cn=$('#casi .nt div');if(cn)cn.innerHTML='<b>Nota per lo studio</b>Qui vanno i vostri casi con foto prima e dopo, con il consenso scritto dei pazienti. Per l\'anteprima abbiamo messo tre esempi illustrati, dichiarati come tali.';
  $$('#csTabs button').forEach(function(b){b.textContent=b.textContent.replace(/^0(\d) · /,'Esempio $1 · ');});
  /* chi vi cura */
  var dm=$('.dr__main'),dg=$('.dr__g');
  var first=TM[0]||{nome:(S.direttore&&S.direttore.nome)||'',ruolo:'',albo:(S.direttore&&S.direttore.albo)||'',bio:'',titoli:[]};
  if(!first.nome)dropSection('chi-siamo');
  else if(dm){
    var sig=first.nome.replace(/^(Dott\.?(ssa)?|Dr\.?(ssa)?|Prof\.?)\s+/i,'').split(/\s+/).map(function(w){return w.charAt(0);}).join('').slice(0,2).toUpperCase();
    var cv=(first.titoli||[]).filter(function(t){return t&&t[1];});
    $('.dr__tx',dm).innerHTML=(first.ruolo?'<p class="dr__role">'+esc(first.ruolo)+'</p>':'')+'<h3 class="dr__name">'+esc(first.nome)+'</h3>'+(first.albo?'<p class="dr__albo">'+esc(first.albo)+'</p>':'')+(first.bio?'<p class="dr__bio">'+esc(first.bio)+'</p>':'')+(cv.length?'<table class="cv"><caption>Titoli e formazione</caption><tbody>'+cv.map(function(t){return '<tr><th scope="row">'+esc(t[0]||'')+'</th><td>'+esc(t[1])+'</td><td>'+esc(t[2]||'')+'</td></tr>';}).join('')+'</tbody></table>':'');
    var mono=$('.dr__mono',dm);if(mono)mono.textContent=sig;rm('.dr__ph small');
    if(first.foto&&/^https?:/.test(first.foto)){var box=$('.dr__ph',dm);var im=extImg(first.foto,'Ritratto di '+first.nome,function(){if(im.parentNode)im.parentNode.removeChild(im);});box.appendChild(im);}
    if(dg){var rest=TM.slice(1,7);if(!rest.length)dg.parentNode.removeChild(dg);else dg.innerHTML=rest.map(function(m){var s2=String(m.nome||'').replace(/^(Dott\.?(ssa)?|Dr\.?(ssa)?|Sig\.?(ra)?)\s+/i,'').split(/\s+/).map(function(w){return w.charAt(0);}).join('').slice(0,2).toUpperCase();return '<article class="dc"><span class="dc__m"'+(m.foto&&/^https?:/.test(m.foto)?' data-f="'+esc(m.foto)+'" data-n="'+esc(m.nome)+'"':'')+'>'+esc(s2)+'</span><div><p class="dr__role">'+esc(m.ruolo||'')+'</p><h3>'+esc(m.nome)+'</h3>'+(m.albo?'<p class="dr__albo">'+esc(m.albo)+'</p>':'')+(m.bio?'<p style="margin-top:10px;font-size:.94rem">'+esc(m.bio)+'</p>':'')+'</div></article>';}).join('');
      $$('.dc__m[data-f]',dg).forEach(function(sp){var pi=extImg(sp.getAttribute('data-f'),'Ritratto di '+sp.getAttribute('data-n'),function(){if(pi.parentNode)pi.parentNode.removeChild(pi);sp.classList.remove('has-f');},function(){sp.classList.add('has-f');});sp.appendChild(pi);});}
    var ch=$('#chi-siamo .h2');if(ch)ch.innerHTML=TM.length>1?'Le persone che <span class="arc">trovate in studio</span>.':'Chi <span class="arc">vi cura</span>.';
  }
  /* recensioni */
  var cols=$('#rvCols');
  if(RV.length<2&&!hasVoto)dropSection('recensioni');
  else{
    rm('#recensioni .fine');
    if(!hasVoto)rm('.rv__big');
    if(!RV.length){if(cols)cols.parentNode.removeChild(cols);var g=$('.rv__g');if(g)g.style.gridTemplateColumns='minmax(0,1fr)';}
    else if(cols){
      var card=function(r){return '<article class="rc">'+(/google/i.test(r.fonte||'')?STARS:'')+'<p>'+esc(r.testo)+'</p><footer><i>'+esc(String(r.autore||'P').charAt(0).toUpperCase())+'</i><span><b>'+esc(r.autore||'Paziente')+'</b>'+(r.data?' · '+esc(r.data):'')+'</span><em>'+esc(r.fonte||'')+'</em></footer></article>';};
      var A=[],B=[];RV.slice(0,8).forEach(function(r,i){(i%2?B:A).push(card(r));});
      if(RV.length<4){cols.innerHTML='<div class="rv__col is-static" style="animation:none">'+RV.slice(0,3).map(card).join('')+'</div>';cols.style.cssText='height:auto;-webkit-mask:none;mask:none;grid-template-columns:minmax(0,1fr)';}
      else cols.innerHTML='<div class="rv__col">'+A.join('')+'</div><div class="rv__col rv__col--b">'+B.join('')+'</div>';
    }
  }
  /* prenotazione */
  $$('.mt small').forEach(function(e){e.parentNode.removeChild(e);});
  ['impianti','orto','bimbi'].forEach(function(v){var r=$('input[name=mot][value="'+v+'"]');if(r){var l=r.closest('label');l.parentNode.removeChild(l);}var o=$('#qMot option[value="'+v+'"]');if(o)o.parentNode.removeChild(o);});
  setTxt('#prenota .lead','Indicate il motivo e l\'orario che preferite: la segreteria vi ricontatta per confermare.');
  setTxt('.urg p',I.urgenze||'Chiamate la segreteria: vi diciamo subito quando possiamo vedervi.');
  var bu=$('#bwUrg');if(bu)bu.innerHTML='Per un dolore forte fate prima a chiamare lo <b>'+esc(tel)+'</b>. Altrimenti scegliete qui il primo orario libero.';
  var lp=$('.loc p');if(lp)lp.textContent=[S.indirizzo,[S.cap,S.citta].filter(Boolean).join(' ')].filter(Boolean).join(', ')+'.'+(I.parcheggio?' '+I.parcheggio:'');
  rm('.tk__b>.fine');
  /* domande */
  var fq=$('.fq__l');
  if(fq){var Q=[['Come prenoto una visita?','Dal modulo in questa pagina, scegliendo motivo e orario, oppure chiamando lo '+tel+'. La segreteria vi ricontatta per confermare.'],['Ho dolore: cosa faccio?',I.urgenze||('Chiamate lo '+tel+': la segreteria vi indica il primo momento utile.')]];
    if(I.convenzioni)Q.push(['Lavorate con fondi sanitari e assicurazioni?',I.convenzioni]);
    if(I.pagamenti)Q.push(['Come si può pagare?',I.pagamenti]);
    if(I.bambini)Q.push(['Visitate anche i bambini?',I.bambini]);
    if(I.parcheggio)Q.push(['Dove si parcheggia?',I.parcheggio]);
    if(I.lingue)Q.push(['In che lingue potete seguirmi?',I.lingue]);
    Q.push(['Dove si trova lo studio?',[S.indirizzo,[S.cap,S.citta].filter(Boolean).join(' ')].filter(Boolean).join(', ')+'. Dalla sezione «Prenotazione» si apre la mappa.']);
    fq.innerHTML=Q.map(function(q,i){return '<details'+(i?'':' open')+'><summary>'+esc(q[0])+'<i aria-hidden="true"></i></summary><div><p>'+esc(q[1])+'</p></div></details>';}).join('');}
  /* footer ed etichette */
  var lg=$('.ft__legal');if(lg){var l1=[S.ragioneSociale||S.denominazione,S.piva?'P.IVA '+S.piva:'',[S.indirizzo,[S.cap,S.citta].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
    var l2=(S.direttore&&S.direttore.nome)?(S.direttore.ds?'Direttore sanitario: ':'')+S.direttore.nome+(S.direttore.albo?', '+S.direttore.albo:'')+'. ':'';
    lg.innerHTML='<p>'+esc(l1)+'</p><p>'+esc(l2)+'Informazione sanitaria ai sensi della L. 145/2018, art. 1, commi 525 e 536.</p><p>Anteprima realizzata da Umbra con informazioni e immagini pubbliche dello studio. Non è il sito ufficiale.</p>';}
  setTxt('.ft__claim',S.denominazione+(S.citta?', '+S.citta:''));
  $$('.ft h4').forEach(function(h){if(/Documenti/.test(h.textContent)){var d=h.parentNode;d.parentNode.removeChild(d);}});
  var fg=$('.ft__g');if(fg)fg.classList.add('is-3');
  var nm=String(S.nome||'');$$('.logo__n').forEach(function(e){if(nm.length>18)e.style.fontSize='1.02rem';else if(nm.length>12)e.style.fontSize='1.26rem';});
  var n1=$('#studio .nt div');if(n1)n1.innerHTML='<b>Nota per lo studio</b>Queste sono fotografie prese dal vostro sito attuale. Nella versione definitiva usiamo quelle che preferite, sistemate da noi (luce, tagli, formati).';
  var n2=$('#trattamenti .nt div');if(n2)n2.innerHTML='<b>Nota per lo studio</b>L\'elenco viene da quello che pubblicate oggi. Ogni scheda porta alla richiesta di appuntamento, senza passare dal telefono.';
  setTxt('.demo','Anteprima · proposta per '+(S.denominazione||'lo studio'));
  if(S.umbra&&S.umbra.attivo){var pb=D.createElement('p');pb.className='pvbar';pb.textContent='Anteprima · non è il sito ufficiale dello studio';var tp=$('.top');if(tp&&tp.parentNode)tp.parentNode.insertBefore(pb,tp);}
  if(S.logo&&/^https?:/.test(S.logo)){/* il logo resta testuale: quello vero entra nella versione definitiva */}
}

/* ---------- carattere di ogni studio: copertina, titolo, ordine ---------- */
function stile(PH,iHero){
  var st=S.stile||{},H1=$('.hero .h1'),hero=$('.hero'),art=$('.hero__art');
  if(st.titolo&&H1&&st.titolo.length){
    H1.innerHTML=st.titolo.map(function(l){return '<span class="ln"><span>'+l+'</span></span>';}).join('');
  }
  if(st.eye){var ey=$('.hero .eye');if(ey)ey.innerHTML=st.eye.map(function(x){return '<span>'+esc(x)+'</span>';}).join('');}
  H.classList.add('tono-'+(st.tono||'perla'));
  var hv=st.hero||'arco',ph0=PH[iHero>=0?iHero:0];
  if(!ph0)hv='arco';
  if(hv==='piena'&&ph0){
    hero.classList.add('hero--piena');
    var fl=D.createElement('div');fl.className='hero__full';fl.setAttribute('aria-hidden','true');
    var undo=function(){hero.classList.remove('hero--piena');if(fl.parentNode)fl.parentNode.removeChild(fl);var r=$('.chip--inline');if(r&&art){r.classList.remove('chip--inline');art.appendChild(r);}};
    fl.appendChild(extImg(ph0.src,'',undo,function(im){if(im.naturalWidth<1000||im.naturalWidth<im.naturalHeight*1.15)undo();else fl.classList.add('is-in');}));
    fl.firstChild.loading='eager';hero.insertBefore(fl,hero.firstChild);
    var rate=$('.chip--rate',art);if(rate){var hc=$('.hero__c');rate.classList.add('chip--inline');hc.appendChild(rate);}
  }else if(hv==='divisa'&&ph0){
    hero.classList.add('hero--divisa');
  }else if(hv==='cornice'&&PH.length>=3){
    hero.classList.add('hero--cornice');
    var mo=D.createElement('div');mo.className='wrap hero__mos';mo.setAttribute('aria-hidden','true');
    PH.slice(0,3).forEach(function(a,i){var f=D.createElement('figure');f.className='mos mos--'+i;f.appendChild(extImg(a.src,'',function(){if(f.parentNode)f.parentNode.removeChild(f);},function(){f.classList.add('is-in');}));f.firstChild.loading='eager';mo.appendChild(f);});
    var g=$('.hero__g');g.parentNode.insertBefore(mo,g.nextSibling);
  }
  /* ordine delle sezioni */
  function mv(id,after){var a=D.getElementById(id),b=D.getElementById(after);if(a&&b&&a!==b&&b.parentNode)b.parentNode.insertBefore(a,b.nextSibling);}
  var band=$('.band');
  if(st.ordine==='foto'){mv('studio','top');}
  else if(st.ordine==='persone'){mv('chi-siamo','top');}
  else if(st.ordine==='voti'){mv('recensioni','trattamenti');}
}

/* ---------- intro Umbra ---------- */
function intro(){
  var el=$('#intro');
  function ready(){H.classList.add('ready');}
  if(!el||H.classList.contains('no-intro')){if(el&&el.parentNode)el.parentNode.removeChild(el);H.classList.remove('intro-on');ready();return;}
  try{
    if(S.demo===false){
      var mesi=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'],oggi=new Date();
      var k=$('.intro__k',el);if(k)k.textContent='Anteprima riservata · '+(S.citta||'')+' · '+oggi.getDate()+' '+mesi[oggi.getMonth()];
      var dn=S.direttore&&S.direttore.nome;
      if(dn){var w=D.createElement('p');w.className='intro__w';w.textContent='All\'attenzione di '+dn;var tt=$('.intro__t',el);if(tt)tt.parentNode.insertBefore(w,tt.nextSibling);}
      if(S._bg){var bg=D.createElement('div');bg.className='intro__bg';bg.setAttribute('aria-hidden','true');var bi=new Image();bi.referrerPolicy='no-referrer';bi.alt='';bi.onload=function(){bg.classList.add('is-in');};bi.onerror=function(){if(bg.parentNode)bg.parentNode.removeChild(bg);};bi.src=(typeof OPT!=='undefined'&&OPT[S._bg])||S._bg;bg.appendChild(bi);el.insertBefore(bg,el.firstChild);}
    }
  }catch(e){}
  var closed=false,t=setTimeout(close,RM?2400:3400);
  ['wheel','touchmove'].forEach(function(ev){el.addEventListener(ev,close,{passive:true});});
  function close(){if(closed)return;closed=true;clearTimeout(t);el.classList.add('is-out');H.classList.remove('intro-on');
    try{sessionStorage.setItem('opale-intro','1');}catch(e){}
    D.removeEventListener('keydown',key);
    setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},1150);
    setTimeout(ready,220);}
  function key(e){if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();close();}}
  el.addEventListener('click',close);D.addEventListener('keydown',key);
}
function hint(){
  var h=$('#dockHint'),p=$('#dockP'),done=false;if(!h)return;
  subs.push(function(y){if(done||y<900||H.classList.contains('intro-on'))return;done=true;if(p&&!p.hidden)return;h.hidden=false;setTimeout(function(){h.hidden=true;},7000);});
}

/* ---------- comparsa allo scroll, archi, contatore di pagina ---------- */
function reveals(){
  $$('.arc').forEach(function(a){if(!a.querySelector('svg'))a.insertAdjacentHTML('beforeend','<svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M1 3 Q50 13 99 3"/></svg>');});
  var els=$$('[data-rv],.arc');
  if(!('IntersectionObserver' in W)){els.forEach(function(e){e.classList.add('in');});return;}
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{rootMargin:'0px 0px -6% 0px',threshold:.06});
  els.forEach(function(e){io.observe(e);});
}
function chrome(){
  var pr=$('#prog'),nav=$('#nav'),mb=$('#mbar');
  subs.push(function(y){
    var max=Math.max(1,H.scrollHeight-W.innerHeight);
    if(pr)pr.style.transform='scaleX('+clamp(y/max,0,1).toFixed(4)+')';
    if(nav)nav.classList.toggle('is-stuck',y>60);
    if(mb)mb.classList.toggle('is-on',y>360);
  });
  var bg=$('#burger');
  if(bg){
    var tog=function(on){H.classList.toggle('menu-on',on);bg.setAttribute('aria-expanded',on?'true':'false');bg.setAttribute('aria-label',on?'Chiudi il menu':'Apri il menu');};
    bg.addEventListener('click',function(){tog(!H.classList.contains('menu-on'));});
    $$('#menu a').forEach(function(a){a.addEventListener('click',function(){tog(false);});});
    D.addEventListener('keydown',function(e){if(e.key==='Escape')tog(false);});
  }
  /* voce di menu attiva */
  var links=$$('.nav__l a');
  if('IntersectionObserver' in W&&links.length){
    var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){links.forEach(function(a){a.classList.remove('is-cur');});var a=map[x.target.id];if(a)a.classList.add('is-cur');}});},{rootMargin:'-45% 0px -50% 0px'});
    Object.keys(map).forEach(function(id){var s=D.getElementById(id);if(s)io.observe(s);});
  }
}

/* ---------- aperto / chiuso, orari ---------- */
function romeNow(){
  var d=new Date();
  try{
    var o={},parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d);
    parts.forEach(function(p){o[p.type]=p.value;});
    var map={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
    if(map[o.weekday]===undefined)throw 0;
    return {dow:map[o.weekday],min:((+o.hour)%24)*60+(+o.minute)};
  }catch(e){return {dow:d.getDay(),min:d.getHours()*60+d.getMinutes()};}
}
function hours(){
  if(!S.orari){setTxt('#stTxt','Si riceve su appuntamento');var hb=$('#hrsTb tbody');if(hb)hb.innerHTML='<tr><td>Su appuntamento</td><td>chiamate la segreteria</td></tr>';$$('.chip--open').forEach(function(e){e.parentNode.removeChild(e);});return;}
  var O=S.orari||{},n=romeNow();
  var iv=function(d){return (O[d]||[]).map(function(r){return [toMin(r[0]),toMin(r[1])];});};
  var today=iv(n.dow),open=false,txt='',short='',i;
  for(i=0;i<today.length;i++){
    if(n.min>=today[i][0]&&n.min<today[i][1]){open=true;txt='Aperto ora · chiude alle '+hm(today[i][1])+(today[i+1]?', riapre alle '+hm(today[i+1][0]):'');short='Aperto ora, fino alle '+hm(today[i][1]);break;}
  }
  if(!open){
    var nx=null;
    for(i=0;i<today.length;i++){if(n.min<today[i][0]){nx={k:0,m:today[i][0]};break;}}
    if(!nx){for(var k=1;k<=7;k++){var dd=(n.dow+k)%7,r=iv(dd);if(r.length){nx={k:k,dow:dd,m:r[0][0]};break;}}}
    if(nx){var when=nx.k===0?'oggi':(nx.k===1?'domani':GIORNI[nx.dow]);txt='Chiuso ora · riapre '+when+' alle '+hm(nx.m);short='Riapre '+when+' alle '+hm(nx.m);}
    else{txt='Orari su appuntamento';short='Su appuntamento';}
  }
  setTxt('#stTxt',txt);
  $$('#stDot,[data-st-dot]').forEach(function(d){d.classList.toggle('on',open);});
  $$('[data-st-short]').forEach(function(e){e.textContent=short;});
  /* tabella orari: i giorni consecutivi con lo stesso orario si raggruppano */
  var tb=$('#hrsTb tbody');if(!tb)return;
  var order=[1,2,3,4,5,6,0],groups=[];
  order.forEach(function(d){var s=(O[d]||[]).map(function(r){return r[0]+'–'+r[1];}).join(' · ')||'Chiuso';var g=groups[groups.length-1];if(g&&g.s===s)g.days.push(d);else groups.push({s:s,days:[d]});});
  tb.innerHTML='';
  groups.forEach(function(g){
    var tr=D.createElement('tr'),a=D.createElement('td'),b=D.createElement('td');
    a.textContent=g.days.length>1?cap(GIORNI[g.days[0]])+' – '+cap(GIORNI[g.days[g.days.length-1]]):cap(GIORNI[g.days[0]]);
    b.textContent=g.s;if(g.days.indexOf(n.dow)>-1)tr.className='is-today';
    tr.appendChild(a);tr.appendChild(b);tb.appendChild(tr);
  });
}

/* ---------- striscia e recensioni: duplicati per lo scorrimento continuo ---------- */
function loops(){
  var st=$('#strip');
  if(st&&!RM){var ul=st.querySelector('ul');if(ul){for(var i=0;i<2;i++){var c=ul.cloneNode(true);c.setAttribute('aria-hidden','true');st.appendChild(c);}st.appendChild(ul.cloneNode(true)).setAttribute('aria-hidden','true');}}
  if(!RM){$$('.rv__col:not(.is-static)').forEach(function(col){$$('.rc',col).forEach(function(card){var c=card.cloneNode(true);c.setAttribute('aria-hidden','true');col.appendChild(c);});});}
}

/* ---------- trattamenti ---------- */
function treatments(){
  var items=$$('.tr__i'),panel=$('#trPanel');if(!items.length)return;
  var mq=W.matchMedia('(min-width: 900px)');
  function show(i){
    items.forEach(function(it,j){it.classList.toggle('is-on',j===i);$('.tr__h',it).setAttribute('aria-expanded',j===i?'true':'false');});
    if(panel){var it=items[i];panel.innerHTML='<div class="tr__pin">'+(S._ph&&S._ph.length?(function(u){return '<figure class="tr__ph"><img src="'+esc(OPT[u]||u)+'" data-o="'+esc(u)+'" alt="" referrerpolicy="no-referrer" decoding="async" onerror="if(this.src!==this.getAttribute(\'data-o\')){this.src=this.getAttribute(\'data-o\');}else{this.parentNode.parentNode.removeChild(this.parentNode);}"></figure>';})(S._ph[i%S._ph.length]):'')+'<p class="tr__big" aria-hidden="true">'+$('.tr__n',it).textContent+'</p><h3 class="tr__pt">'+$('.tr__t',it).textContent+'</h3>'+$('.tr__b',it).innerHTML+'</div>';}
  }
  var cur=0;
  items.forEach(function(it,i){
    var h=$('.tr__h',it);
    h.addEventListener('click',function(){
      if(!mq.matches&&it.classList.contains('is-on')){it.classList.remove('is-on');h.setAttribute('aria-expanded','false');return;}
      cur=i;show(i);
    });
    h.addEventListener('mouseenter',function(){if(mq.matches&&cur!==i){cur=i;show(i);}});
    h.addEventListener('focus',function(){if(mq.matches&&cur!==i){cur=i;show(i);}});
  });
  show(0);
}

/* ---------- prima visita: le schede si impilano ---------- */
function stack(){
  var cards=$$('.pv__c');if(cards.length<2||RM)return;
  subs.push(function(){
    for(var i=0;i<cards.length-1;i++){
      var r=cards[i].getBoundingClientRect(),n=cards[i+1].getBoundingClientRect();
      var ov=clamp((r.bottom-n.top)/Math.max(1,r.height),0,1);
      cards[i].style.setProperty('--ov',ov.toFixed(3));
    }
  });
}

/* ---------- ambienti: illustrazioni (sostituite dalle foto vere quando ci sono) ---------- */
var SCENES={
accoglienza:'<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrazione dell\'accoglienza">'
+'<rect width="800" height="500" fill="url(#g-wall)"/>'
+'<path d="M-20 0H250L520 372H120Z" fill="url(#g-light)" opacity=".6"/>'
+'<rect y="372" width="800" height="128" fill="url(#g-floor)"/>'
+'<path d="M296 372V196a104 104 0 0 1 208 0V372Z" fill="#fff"/>'
+'<path d="M310 372V198a90 90 0 0 1 180 0V372Z" fill="url(#g-sky)"/>'
+'<circle cx="400" cy="206" r="34" fill="none" stroke="url(#g-opal)" stroke-width="8"/>'
+'<ellipse cx="400" cy="452" rx="290" ry="16" fill="#0A2A2E" opacity=".16" filter="url(#f-soft)"/>'
+'<rect x="150" y="322" width="500" height="128" rx="18" fill="url(#g-wood)"/>'
+'<path d="M176 336V438M202 336V438M228 336V438M254 336V438M280 336V438M306 336V438M332 336V438M358 336V438M384 336V438M410 336V438M436 336V438M462 336V438M488 336V438M514 336V438M540 336V438M566 336V438M592 336V438M618 336V438" stroke="#A67C52" stroke-width="2" opacity=".4"/>'
+'<rect x="136" y="306" width="528" height="24" rx="12" fill="#fff"/>'
+'<rect x="522" y="254" width="84" height="54" rx="7" fill="#0A2A2E"/><rect x="530" y="262" width="68" height="38" rx="3" fill="#14434A"/>'
+'<rect x="206" y="262" width="36" height="46" rx="15" fill="#fff"/>'
+'<path d="M224 264C214 222 190 206 178 168M224 264C232 226 252 206 266 178M224 264C222 232 226 198 220 152" stroke="#0C7C76" stroke-width="3" fill="none" stroke-linecap="round"/>'
+'<ellipse cx="176" cy="164" rx="15" ry="7" transform="rotate(-50 176 164)" fill="#35B8AE"/><ellipse cx="268" cy="174" rx="15" ry="7" transform="rotate(-125 268 174)" fill="#35B8AE"/><ellipse cx="219" cy="146" rx="15" ry="7" transform="rotate(-85 219 146)" fill="#5CC9C0"/><ellipse cx="196" cy="206" rx="13" ry="6" transform="rotate(-40 196 206)" fill="#5CC9C0"/><ellipse cx="250" cy="214" rx="13" ry="6" transform="rotate(-140 250 214)" fill="#35B8AE"/>'
+'<path d="M620 0V104M676 0V150M732 0V84" stroke="#0A2A2E" stroke-width="1.5" opacity=".45"/>'
+'<circle cx="620" cy="122" r="52" fill="url(#g-glow)"/><circle cx="676" cy="168" r="52" fill="url(#g-glow)"/><circle cx="732" cy="102" r="52" fill="url(#g-glow)"/>'
+'<circle cx="620" cy="122" r="18" fill="#fff"/><circle cx="676" cy="168" r="18" fill="#fff"/><circle cx="732" cy="102" r="18" fill="#fff"/>'
+'<rect x="36" y="150" width="96" height="130" rx="8" fill="#fff"/><path d="M52 250a32 32 0 0 1 64 0Z" fill="#FAD8C3"/><circle cx="100" cy="190" r="14" fill="#D8CFF4"/>'
+'</svg>',
sala:'<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrazione di una sala operativa">'
+'<rect width="800" height="500" fill="url(#g-wall)"/><rect y="388" width="800" height="112" fill="url(#g-floor)"/>'
+'<rect x="500" y="56" width="256" height="276" rx="12" fill="#fff"/><rect x="514" y="70" width="228" height="248" rx="5" fill="url(#g-sky)"/><path d="M628 70V318M514 194H742" stroke="#fff" stroke-width="9"/>'
+'<path d="M514 318H742L600 500H170Z" fill="url(#g-light)" opacity=".55"/>'
+'<rect x="40" y="86" width="232" height="84" rx="10" fill="#fff"/><path d="M117 86V170M195 86V170" stroke="#DDE6E2" stroke-width="2"/>'
+'<rect x="40" y="252" width="232" height="136" rx="10" fill="#fff"/><path d="M40 298H272M40 344H272M156 252V388" stroke="#DDE6E2" stroke-width="2"/><rect x="30" y="240" width="252" height="16" rx="8" fill="#D3DEDA"/>'
+'<path d="M214 240v-28q0-12 12-12h16" stroke="#9FB2AE" stroke-width="5" fill="none" stroke-linecap="round"/>'
+'<ellipse cx="420" cy="436" rx="180" ry="14" fill="#0A2A2E" opacity=".18" filter="url(#f-soft)"/>'
+'<rect x="340" y="416" width="160" height="18" rx="9" fill="#C3D0CB"/><rect x="404" y="352" width="30" height="68" rx="7" fill="#B3C3BE"/>'
+'<rect x="196" y="300" width="160" height="36" rx="18" transform="rotate(38 330 340)" fill="url(#g-aqua)"/>'
+'<ellipse cx="226" cy="236" rx="28" ry="19" transform="rotate(38 226 236)" fill="#8ED6CE"/>'
+'<rect x="310" y="322" width="200" height="38" rx="19" fill="url(#g-aqua)"/>'
+'<rect x="488" y="330" width="126" height="30" rx="15" transform="rotate(20 488 345)" fill="url(#g-aqua)"/>'
+'<path d="M356 0V58L268 112" stroke="#9FB2AE" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
+'<path d="M236 122L292 108L352 296L214 306Z" fill="url(#g-light)" opacity=".5"/>'
+'<rect x="222" y="100" width="84" height="28" rx="14" transform="rotate(-18 264 114)" fill="#fff"/>'
+'<path d="M434 352V250H470" stroke="#9FB2AE" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="452" y="206" width="84" height="56" rx="7" fill="#0A2A2E"/><rect x="460" y="214" width="68" height="40" rx="3" fill="#14434A"/><path d="M468 244q26-22 52 0" stroke="#9FF0E6" stroke-width="5" stroke-dasharray="6 3" fill="none"/>'
+'<ellipse cx="664" cy="378" rx="36" ry="11" fill="#0A2A2E"/><rect x="660" y="378" width="8" height="42" fill="#7C8F8E"/><ellipse cx="664" cy="424" rx="28" ry="6" fill="#B3C3BE"/>'
+'</svg>',
diagnostica:'<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrazione della sala di diagnostica 3D">'
+'<rect width="800" height="500" fill="url(#g-ink)"/><rect y="400" width="800" height="100" fill="#08211F" opacity=".7"/>'
+'<circle cx="320" cy="240" r="250" fill="url(#g-glow-a)" opacity=".5"/>'
+'<rect x="120" y="402" width="150" height="16" rx="8" fill="#C3D0CB"/>'
+'<rect x="158" y="66" width="74" height="340" rx="20" fill="#E8EEEB"/>'
+'<rect x="158" y="66" width="320" height="50" rx="25" fill="#F4F6F4"/>'
+'<rect x="262" y="116" width="36" height="158" rx="13" fill="#D3DEDA"/><rect x="420" y="116" width="46" height="178" rx="15" fill="#D3DEDA"/>'
+'<ellipse cx="358" cy="236" rx="128" ry="28" fill="none" stroke="#9FF0E6" stroke-width="10" opacity=".35" filter="url(#f-x)"/>'
+'<ellipse cx="358" cy="236" rx="128" ry="28" fill="none" stroke="#9FF0E6" stroke-width="2.5"/>'
+'<rect x="336" y="296" width="46" height="11" rx="5.500" fill="#B3C3BE"/><rect x="355" y="304" width="8" height="70" fill="#B3C3BE"/><rect x="232" y="366" width="150" height="12" rx="6" fill="#D3DEDA"/>'
+'<rect x="540" y="120" width="220" height="150" rx="14" fill="#04181A" stroke="#1D4B4F" stroke-width="2"/>'
+'<path d="M566 172Q650 232 734 172" stroke="#D6F4F0" stroke-width="24" stroke-dasharray="13 4" fill="none" opacity=".92"/>'
+'<path d="M574 206Q650 254 726 206" stroke="#7FCFC6" stroke-width="19" stroke-dasharray="11 4" fill="none" opacity=".6"/>'
+'<path d="M556 136h18M556 136v18M744 254h-18M744 254v-18" stroke="#9FF0E6" stroke-width="2" fill="none" opacity=".7"/>'
+'<rect x="560" y="330" width="180" height="12" rx="6" fill="#1D4B4F"/><rect x="578" y="342" width="8" height="62" fill="#1D4B4F"/><rect x="714" y="342" width="8" height="62" fill="#1D4B4F"/><rect x="606" y="316" width="88" height="10" rx="4" fill="#2A5C60"/>'
+'</svg>',
sterilizzazione:'<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrazione del locale di sterilizzazione">'
+'<rect width="800" height="500" fill="url(#g-wall)"/><rect y="424" width="800" height="76" fill="url(#g-floor)"/>'
+'<rect x="56" y="52" width="688" height="112" rx="12" fill="#fff"/>'
+'<rect x="68" y="64" width="158" height="88" rx="6" fill="url(#g-aqua)" opacity=".4"/><rect x="238" y="64" width="158" height="88" rx="6" fill="url(#g-aqua)" opacity=".4"/><rect x="408" y="64" width="158" height="88" rx="6" fill="url(#g-aqua)" opacity=".4"/><rect x="578" y="64" width="154" height="88" rx="6" fill="url(#g-aqua)" opacity=".4"/>'
+'<path d="M92 128h70M92 112h50M262 128h90M262 112h60M432 128h60M602 128h84M602 112h50" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".85"/>'
+'<rect x="56" y="172" width="688" height="7" rx="3.500" fill="#fff"/><rect x="56" y="176" width="688" height="60" fill="url(#g-light)" opacity=".6"/>'
+'<rect x="60" y="308" width="680" height="116" fill="#EEF2F0"/><path d="M230 308V424M400 308V424M570 308V424" stroke="#D3DEDA" stroke-width="2"/>'
+'<path d="M128 330h36M298 330h36M468 330h36M638 330h36" stroke="#B3C3BE" stroke-width="5" stroke-linecap="round"/>'
+'<rect x="40" y="290" width="720" height="20" rx="10" fill="#fff"/><rect x="40" y="306" width="720" height="6" fill="#0A2A2E" opacity=".06"/>'
+'<rect x="96" y="192" width="160" height="98" rx="15" fill="#F7F9F8" stroke="#D3DEDA" stroke-width="2"/><circle cx="158" cy="241" r="34" fill="#D3DEDA"/><circle cx="158" cy="241" r="24" fill="#0A2A2E" opacity=".86"/><path d="M146 232a16 16 0 0 1 18-6" stroke="#9FF0E6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><rect x="206" y="210" width="36" height="17" rx="4" fill="#0A2A2E"/><circle cx="224" cy="258" r="7" fill="#35B8AE"/>'
+'<rect x="330" y="282" width="130" height="10" rx="5" fill="#C3D0CB"/><path d="M396 282v-34q0-14 14-14h20" stroke="#9FB2AE" stroke-width="6" fill="none" stroke-linecap="round"/>'
+'<rect x="520" y="268" width="200" height="24" rx="7" fill="#D3DEDA"/>'
+'<g fill="#fff" stroke="#7FCFC6" stroke-width="2"><rect x="532" y="216" width="28" height="56" rx="4"/><rect x="568" y="216" width="28" height="56" rx="4"/><rect x="604" y="216" width="28" height="56" rx="4"/><rect x="640" y="216" width="28" height="56" rx="4"/><rect x="676" y="216" width="28" height="56" rx="4"/></g>'
+'<g fill="#35B8AE"><circle cx="546" cy="230" r="4"/><circle cx="582" cy="230" r="4"/><circle cx="618" cy="230" r="4"/><circle cx="654" cy="230" r="4"/><circle cx="690" cy="230" r="4"/></g>'
+'</svg>',
attesa:'<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrazione della sala d\'attesa">'
+'<rect width="800" height="500" fill="url(#g-wall)"/><rect y="398" width="800" height="102" fill="url(#g-floor)"/>'
+'<path d="M560 0H820V140L520 398H300Z" fill="url(#g-light)" opacity=".55"/>'
+'<rect x="296" y="70" width="208" height="160" rx="9" fill="#fff"/><path d="M326 204a74 74 0 0 1 148 0Z" fill="#FAD8C3"/><circle cx="446" cy="124" r="24" fill="#D8CFF4"/><path d="M326 204h148" stroke="#0A2A2E" stroke-width="2" opacity=".3"/>'
+'<ellipse cx="400" cy="452" rx="320" ry="34" fill="#fff" opacity=".55"/>'
+'<ellipse cx="216" cy="426" rx="100" ry="10" fill="#0A2A2E" opacity=".16" filter="url(#f-soft)"/><ellipse cx="584" cy="426" rx="100" ry="10" fill="#0A2A2E" opacity=".16" filter="url(#f-soft)"/>'
+'<path d="M140 404V328q0-44 44-44h64q44 0 44 44v76Z" fill="url(#g-aqua)"/><rect x="150" y="348" width="132" height="38" rx="16" fill="#C4ECE6"/><rect x="150" y="402" width="9" height="22" fill="#A67C52"/><rect x="273" y="402" width="9" height="22" fill="#A67C52"/>'
+'<path d="M508 404V328q0-44 44-44h64q44 0 44 44v76Z" fill="#fff"/><rect x="518" y="348" width="132" height="38" rx="16" fill="#EEF2F0"/><rect x="518" y="402" width="9" height="22" fill="#A67C52"/><rect x="641" y="402" width="9" height="22" fill="#A67C52"/>'
+'<ellipse cx="400" cy="364" rx="50" ry="11" fill="url(#g-wood)"/><rect x="396" y="366" width="8" height="52" fill="#A67C52"/><ellipse cx="400" cy="420" rx="26" ry="5" fill="#A67C52"/><rect x="384" y="340" width="22" height="18" rx="5" fill="#fff"/><rect x="410" y="350" width="26" height="6" rx="2" fill="#D8CFF4"/>'
+'<path d="M724 422V190q0-86-84-86" stroke="#0A2A2E" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="614" cy="150" r="70" fill="url(#g-glow)"/><path d="M574 104h80l-14 46h-52Z" fill="#fff"/><ellipse cx="724" cy="424" rx="26" ry="5" fill="#0A2A2E"/>'
+'<rect x="52" y="352" width="56" height="70" rx="20" fill="#fff"/>'
+'<path d="M80 354C66 300 40 280 30 236M80 354C86 296 110 270 122 232M80 354C78 304 84 258 76 204M80 354C60 322 44 316 20 300M80 354C100 324 118 322 140 306" stroke="#0C7C76" stroke-width="3.500" fill="none" stroke-linecap="round"/>'
+'<ellipse cx="28" cy="230" rx="19" ry="8" transform="rotate(-55 28 230)" fill="#35B8AE"/><ellipse cx="124" cy="226" rx="19" ry="8" transform="rotate(-120 124 226)" fill="#35B8AE"/><ellipse cx="75" cy="196" rx="19" ry="8" transform="rotate(-85 75 196)" fill="#5CC9C0"/><ellipse cx="16" cy="296" rx="17" ry="7" transform="rotate(-20 16 296)" fill="#5CC9C0"/><ellipse cx="144" cy="302" rx="17" ry="7" transform="rotate(-160 144 302)" fill="#35B8AE"/>'
+'</svg>'
};
var SCENE_LABEL={accoglienza:'Accoglienza',sala:'Sala operativa',diagnostica:'Diagnostica 3D',sterilizzazione:'Sterilizzazione',attesa:'Sala d\'attesa'};
function gallery(){
  var tr=$('#stTrack');if(!tr)return;
  var cur=$('#stCur'),bar=$('#stBar'),cards=[];
  function live(){cards=$$('.st__c',tr);return cards;}
  $$('.st__ph',tr).forEach(function(ph){
    var k=ph.getAttribute('data-scene'),f=S.foto&&S.foto[k];
    if(f){var im=new Image();im.alt=(SCENE_LABEL[k]||'Lo studio')+' · '+(S.denominazione||'');im.loading='lazy';im.decoding='async';im.draggable=false;im.src=f;ph.appendChild(im);}
    else if(SCENES[k])ph.innerHTML=SCENES[k];
  });
  function idx(){live();var c=tr.scrollLeft+tr.clientWidth/2,best=0,bd=1e9;cards.forEach(function(el,i){var d=Math.abs(el.offsetLeft+el.offsetWidth/2-c);if(d<bd){bd=d;best=i;}});return best;}
  function upd(){var i=idx();if(cur)cur.textContent=pad(i+1);var max=tr.scrollWidth-tr.clientWidth,p=max>0?tr.scrollLeft/max:0;if(bar)bar.style.transform='scaleX('+(0.2+0.8*p).toFixed(3)+')';}
  function to(i){live();i=clamp(i,0,cards.length-1);var el=cards[i];tr.scrollTo({left:el.offsetLeft-(tr.clientWidth-el.offsetWidth)/2,behavior:RM?'auto':'smooth'});}
  var p=$('#stPrev'),n=$('#stNext');
  if(p)p.addEventListener('click',function(){to(idx()-1);});
  if(n)n.addEventListener('click',function(){to(idx()+1);});
  var rq=false;tr.addEventListener('scroll',function(){if(!rq){rq=true;requestAnimationFrame(function(){rq=false;upd();});}},{passive:true});
  tr.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();to(idx()+1);}if(e.key==='ArrowLeft'){e.preventDefault();to(idx()-1);}});
  var down=false,moved=false,sx=0,sl=0;
  tr.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;down=true;moved=false;sx=e.clientX;sl=tr.scrollLeft;});
  W.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-sx;if(!moved&&Math.abs(dx)>5){moved=true;tr.classList.add('is-drag');}if(moved)tr.scrollLeft=sl-dx;});
  W.addEventListener('pointerup',function(){if(!down)return;down=false;if(moved){var i=idx();tr.classList.remove('is-drag');to(i);}});
  /* ingrandimento: solo quando ci sono fotografie vere */
  var lb=null,lbI=0,lbL=[],lbBack=null;
  function lbShow(i){lbI=(i+lbL.length)%lbL.length;var c=lbL[lbI],im=$('img',c),h=$('h3',c);var big=$('.lb__img',lb);big.src=im.currentSrc||im.src;big.alt=im.alt;setTxt($('.lb__cap',lb),(h?h.textContent+' · ':'')+pad(lbI+1)+' / '+pad(lbL.length));}
  function lbClose(){if(!lb)return;lb.classList.remove('is-on');D.documentElement.classList.remove('lb-open');if(lbBack&&lbBack.focus)lbBack.focus();}
  function lbOpen(c){
    lbL=live().filter(function(x){return $('.st__ph img',x);});var i=lbL.indexOf(c);if(i<0)return;
    if(!lb){lb=D.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Fotografie dello studio');
      lb.innerHTML='<button class="lb__x" type="button" aria-label="Chiudi"><svg class="ic" aria-hidden="true"><use href="#i-x"/></svg></button><button class="lb__n lb__n--p" type="button" aria-label="Foto precedente">'+ARROW+'</button><img class="lb__img" alt="" referrerpolicy="no-referrer"><button class="lb__n lb__n--n" type="button" aria-label="Foto successiva">'+ARROW+'</button><p class="lb__cap"></p>';
      D.body.appendChild(lb);
      lb.addEventListener('click',function(e){if(e.target.closest('.lb__n--p'))lbShow(lbI-1);else if(e.target.closest('.lb__n--n'))lbShow(lbI+1);else if(!e.target.closest('.lb__img'))lbClose();});
      lb.addEventListener('keydown',function(e){if(e.key==='Escape')lbClose();else if(e.key==='ArrowRight')lbShow(lbI+1);else if(e.key==='ArrowLeft')lbShow(lbI-1);else if(e.key==='Tab'){var f=$$('button',lb).filter(function(b){return b.offsetParent;}),k=f.indexOf(D.activeElement);e.preventDefault();f[(k+(e.shiftKey?-1:1)+f.length)%f.length].focus();}});
      var tx=0;lb.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)lbShow(lbI+(dx<0?1:-1));},{passive:true});
    }
    lb.classList.toggle('is-one',lbL.length<2);lbBack=D.activeElement;lbShow(i);lb.classList.add('is-on');D.documentElement.classList.add('lb-open');$('.lb__x',lb).focus();
  }
  tr.addEventListener('click',function(e){if(moved)return;var c=e.target.closest('.st__c');if(!c||!e.target.closest('.st__ph')||!$('.st__ph img',c))return;lbOpen(c);});
  upd();
}

/* ---------- tecnologia: panoramica stilizzata + bagliore che segue il puntatore ---------- */
function tech(){
  var el=$('#pano');
  if(el){
    var w=[30,30,28,22,22,24,20,26,26,20,24,22,22,28,30,30],gap=4,tot=0,i;
    for(i=0;i<w.length;i++)tot+=w[i]+gap;
    var x=(760-tot)/2,s='<svg viewBox="0 0 760 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="pn-b" x1="0" x2="1"><stop offset="0" stop-color="#9FF0E6" stop-opacity="0"/><stop offset=".5" stop-color="#9FF0E6" stop-opacity=".5"/><stop offset="1" stop-color="#9FF0E6" stop-opacity="0"/></linearGradient><radialGradient id="pn-g"><stop offset="0" stop-color="#35B8AE" stop-opacity=".35"/><stop offset="1" stop-color="#35B8AE" stop-opacity="0"/></radialGradient></defs>';
    s+='<ellipse cx="380" cy="150" rx="340" ry="150" fill="url(#pn-g)"/>';
    s+='<path d="M70 40Q380 300 690 40" fill="none" stroke="#9FF0E6" stroke-opacity=".07" stroke-width="70" stroke-linecap="round"/>';
    s+='<circle cx="78" cy="52" r="16" fill="none" stroke="#9FF0E6" stroke-opacity=".25" stroke-width="2"/><circle cx="682" cy="52" r="16" fill="none" stroke="#9FF0E6" stroke-opacity=".25" stroke-width="2"/>';
    for(i=0;i<w.length;i++){
      var cx=x+w[i]/2,t=(cx-380)/300,yu=150-26*t*t,yl=158-26*t*t,mol=(i<3||i>12),rot=(t*-9).toFixed(1);
      s+='<g transform="rotate('+rot+' '+cx.toFixed(1)+' '+yu.toFixed(1)+')">';
      if(mol){s+='<path d="M'+(x+2)+' '+(yu-30)+'L'+(x+w[i]*.3)+' '+(yu-72)+'L'+(x+w[i]*.46)+' '+(yu-30)+'ZM'+(x+w[i]*.54)+' '+(yu-30)+'L'+(x+w[i]*.72)+' '+(yu-70)+'L'+(x+w[i]-2)+' '+(yu-30)+'Z" fill="#9FF0E6" fill-opacity=".3"/>';}
      else{s+='<path d="M'+(x+3)+' '+(yu-30)+'L'+cx+' '+(yu-82)+'L'+(x+w[i]-3)+' '+(yu-30)+'Z" fill="#9FF0E6" fill-opacity=".3"/>';}
      s+='<rect x="'+x.toFixed(1)+'" y="'+(yu-34).toFixed(1)+'" width="'+w[i]+'" height="34" rx="7" fill="#DDF7F3" fill-opacity=".92"/></g>';
      s+='<g transform="rotate('+rot+' '+cx.toFixed(1)+' '+yl.toFixed(1)+')">';
      if(mol){s+='<path d="M'+(x+2)+' '+(yl+28)+'L'+(x+w[i]*.28)+' '+(yl+68)+'L'+(x+w[i]*.46)+' '+(yl+28)+'ZM'+(x+w[i]*.54)+' '+(yl+28)+'L'+(x+w[i]*.74)+' '+(yl+66)+'L'+(x+w[i]-2)+' '+(yl+28)+'Z" fill="#9FF0E6" fill-opacity=".24"/>';}
      else{s+='<path d="M'+(x+4)+' '+(yl+28)+'L'+cx+' '+(yl+76)+'L'+(x+w[i]-4)+' '+(yl+28)+'Z" fill="#9FF0E6" fill-opacity=".24"/>';}
      s+='<rect x="'+(x+1).toFixed(1)+'" y="'+yl.toFixed(1)+'" width="'+(w[i]-2)+'" height="30" rx="7" fill="#BFEDE6" fill-opacity=".7"/></g>';
      x+=w[i]+gap;
    }
    s+='<rect class="pano__beam" x="0" y="0" width="92" height="300" fill="url(#pn-b)"/>';
    s+='<path d="M24 24h22M24 24v22M736 276h-22M736 276v-22M736 24h-22M736 24v22M24 276h22M24 276v-22" stroke="#9FF0E6" stroke-opacity=".5" stroke-width="1.5" fill="none"/>';
    s+='<text x="58" y="34" font-family="Geist Mono,monospace" font-size="10" letter-spacing="1.5" fill="#9FF0E6" fill-opacity=".7">PANORAMICA · CBCT</text></svg>';
    el.innerHTML=s;
  }
  $$('.tc').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});});
}

/* ---------- casi clinici: confronto prima / dopo ---------- */
var TEETH=[{n:14,w:54,y:158,h:88,k:'p'},{n:13,w:62,y:148,h:118,k:'c'},{n:12,w:54,y:154,h:104,k:'i'},{n:11,w:74,y:150,h:124,k:'i'},{n:21,w:74,y:150,h:124,k:'i'},{n:22,w:54,y:154,h:104,k:'i'},{n:23,w:62,y:148,h:118,k:'c'},{n:24,w:54,y:158,h:88,k:'p'}];
var CASES=[
  {k:'Caso 01 · Ortodonzia',t:'Affollamento degli incisivi, risolto con allineatori',
   rows:[['Paziente','Donna, 29 anni'],['Motivo','Incisivi superiori accavallati, canino alto'],['Piano','Allineatori trasparenti, 22 mascherine'],['Durata','11 mesi, controlli ogni 8 settimane'],['Mantenimento','Contenzione fissa e mascherina notturna']],
   fdi:[13,12,11,21,22,23],tone:'b',
   before:{12:{r:-17,dx:11,dy:7},11:{r:8,dx:5},21:{r:-7,dx:-7,dy:3},22:{r:14,dx:-9,dy:6},13:{dy:-15,dx:5,r:5},23:{dy:-7,r:-3}}},
  {k:'Caso 02 · Estetica',t:'Sei faccette in ceramica su denti consumati',
   rows:[['Paziente','Uomo, 41 anni'],['Motivo','Incisivi accorciati dall\'usura e scuriti'],['Piano','Sbiancamento, poi 6 faccette in disilicato di litio'],['Durata','3 sedute in 4 settimane'],['Mantenimento','Bite notturno e controllo annuale']],
   fdi:[13,12,11,21,22,23],tone:'b',
   before:{13:{dh:-20,flat:1},12:{dh:-18,flat:1},11:{dh:-26,flat:1,dx:-5},21:{dh:-23,flat:1,dx:5},22:{dh:-16,flat:1},23:{dh:-19,flat:1}}},
  {k:'Caso 03 · Implantologia',t:'Un incisivo laterale mancante, sostituito da un impianto',
   rows:[['Paziente','Donna, 55 anni'],['Motivo','Elemento 12 perso per frattura della radice'],['Piano','Impianto singolo con chirurgia guidata, corona in ceramica'],['Durata','5 mesi, di cui 3 di guarigione'],['Mantenimento','Igiene ogni 6 mesi, radiografia di controllo annuale']],
   fdi:[12],tone:'a',implant:12,
   before:{12:{miss:1},11:{r:-4,dx:-4},13:{r:5,dx:5}}}
];
function toothPath(x,y,w,h,k,flat){
  var rt=w*.52,rb=flat?5:(k==='i'?13:17),b=y+h,f=function(v){return v.toFixed(1);};
  var d='M'+f(x)+' '+f(y+rt)+'C'+f(x)+' '+f(y-rt*.28)+' '+f(x+w)+' '+f(y-rt*.28)+' '+f(x+w)+' '+f(y+rt);
  if(k==='c'&&!flat){d+='L'+f(x+w)+' '+f(b-26)+'Q'+f(x+w*.86)+' '+f(b-4)+' '+f(x+w/2)+' '+f(b+2)+'Q'+f(x+w*.14)+' '+f(b-4)+' '+f(x)+' '+f(b-26)+'Z';}
  else{d+='L'+f(x+w)+' '+f(b-rb)+'Q'+f(x+w)+' '+f(b)+' '+f(x+w-rb)+' '+f(b)+'L'+f(x+rb)+' '+f(b)+'Q'+f(x)+' '+f(b)+' '+f(x)+' '+f(b-rb)+'Z';}
  return d;
}
function smile(c,after){
  var gap=5,tot=0,i;for(i=0;i<TEETH.length;i++)tot+=TEETH[i].w+gap;
  var x0=(800-tot+gap)/2,pos={},x=x0;
  for(i=0;i<TEETH.length;i++){pos[TEETH[i].n]=x;x+=TEETH[i].w+gap;}
  var tone=after?'a':c.tone,s='<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrazione del caso, '+(after?'dopo':'prima')+' il trattamento">';
  s+='<rect width="800" height="500" fill="#0A2A2E"/><ellipse cx="400" cy="250" rx="420" ry="230" fill="#14434A"/><ellipse cx="400" cy="290" rx="300" ry="90" fill="#061B1E"/>';
  s+='<path d="M40 30H760V196Q400 236 40 196Z" fill="url(#g-gum)"/>';
  for(i=0;i<6;i++){s+='<rect x="'+(236+i*56)+'" y="322" width="50" height="86" rx="15" fill="'+(after?'#DCE9E6':'#D6CBAE')+'" opacity=".85"/>';}
  s+='<path d="M90 500V402Q400 352 710 402V500Z" fill="url(#g-gum-l)"/>';
  var order=[14,24,12,22,13,23,11,21];
  order.forEach(function(n){
    var T=null,j;for(j=0;j<TEETH.length;j++)if(TEETH[j].n===n)T=TEETH[j];
    var m=(!after&&c.before[n])||{},h=T.h+(m.dh||0),px=pos[n],cx=px+T.w/2,cy=T.y+h/2;
    if(m.miss){s+='<path d="M'+(px+8)+' 196Q'+cx+' 214 '+(px+T.w-8)+' 196" fill="none" stroke="#B46B6B" stroke-width="3" opacity=".7"/>';return;}
    s+='<g transform="translate('+(m.dx||0)+' '+(m.dy||0)+') rotate('+(m.r||0)+' '+cx.toFixed(1)+' '+cy.toFixed(1)+')">';
    s+='<path d="'+toothPath(px,T.y,T.w,h,T.k,m.flat)+'" fill="url(#g-en-'+tone+')" stroke="#0A2A2E" stroke-opacity=".14"/>';
    s+='<path d="M'+(px+T.w*.24).toFixed(1)+' '+(T.y+h*.3).toFixed(1)+'Q'+(px+T.w*.2).toFixed(1)+' '+(T.y+h*.56).toFixed(1)+' '+(px+T.w*.27).toFixed(1)+' '+(T.y+h*.78).toFixed(1)+'" fill="none" stroke="#fff" stroke-width="'+(T.w*.09).toFixed(1)+'" stroke-linecap="round" opacity="'+(tone==='a'?'.85':'.4')+'"/>';
    s+='</g>';
    if(after&&c.implant===n){s+='<rect x="'+(cx-10)+'" y="62" width="20" height="62" rx="8" fill="#fff" opacity=".55"/><path d="M'+(cx-10)+' 80h20M'+(cx-10)+' 92h20M'+(cx-10)+' 104h20" stroke="#0A2A2E" stroke-opacity=".35" stroke-width="2"/>';}
  });
  TEETH.forEach(function(T){
    var cx=pos[T.n]+T.w/2,on=c.fdi.indexOf(T.n)>-1;
    if(on)s+='<rect x="'+(cx-17)+'" y="'+(c.implant===T.n&&after?30:122)+'" width="34" height="22" rx="7" fill="#9FF0E6"/>';
    s+='<text x="'+cx+'" y="'+(c.implant===T.n&&after?46:138)+'" text-anchor="middle" font-family="Geist Mono,monospace" font-size="14" font-weight="500" fill="'+(on?'#0A2A2E':'#fff')+'" fill-opacity="'+(on?1:.75)+'">'+T.n+'</text>';
  });
  return s+'</svg>';
}
function cases(){
  var ba=$('#ba'),A=$('#baA'),B=$('#baB'),R=$('#baR'),sheet=$('#csSheet'),tabs=$$('#csTabs button');if(!ba||!A||!B)return;
  function render(i){
    var c=CASES[i];A.innerHTML=smile(c,false);B.innerHTML=smile(c,true);
    tabs.forEach(function(b,j){b.setAttribute('aria-selected',j===i?'true':'false');});
    if(sheet){
      var h='<p class="cs__k">'+(S.demo===false?c.k.replace('Caso','Esempio'):c.k)+'</p><h3>'+c.t+'</h3><dl class="cs__dl">';
      c.rows.forEach(function(r){if(S.demo===false&&r[0]==='Paziente')return;h+='<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>';});
      h+='<div><dt>Elementi</dt><dd><span class="fdi">'+c.fdi.map(function(n){return '<span>'+n+'</span>';}).join('')+'</span></dd></div></dl>';
      sheet.innerHTML=h;
    }
  }
  function setX(v){ba.style.setProperty('--x',v+'%');}
  if(R){R.addEventListener('input',function(){hintStop();setX(R.value);});}
  tabs.forEach(function(b,i){b.addEventListener('click',function(){render(i);});});
  render(0);
  /* piccolo movimento iniziale: fa capire che la linea si trascina */
  var raf=0,stopped=false;
  function hintStop(){stopped=true;if(raf)cancelAnimationFrame(raf);}
  if(!RM&&'IntersectionObserver' in W){
    var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){io.disconnect();var t0=performance.now();
      (function step(now){if(stopped)return;var t=(now-t0)/2400;if(t>=1){setX(50);if(R)R.value=50;return;}var v=50+Math.sin(t*Math.PI*2)*22*(1-t*.3);setX(v.toFixed(1));if(R)R.value=v;raf=requestAnimationFrame(step);})(t0);}},{threshold:.5});
    io.observe(ba);
  }
}

/* ---------- prenotazione ---------- */
function rnd(s){var x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function buildDays(n){
  var out=[],d=new Date();d.setHours(12,0,0,0);
  for(var k=1;out.length<n&&k<45;k++){
    var x=new Date(d.getTime()+k*864e5),iv=(S.orari||DEF_OR)[x.getDay()]||[];if(!iv.length)continue;
    var slots=[];iv.forEach(function(r){for(var m=toMin(r[0]);m+30<=toMin(r[1]);m+=30)slots.push(m);});
    if(!slots.length)continue;
    var seed=x.getDate()*37+x.getMonth()*101,free=slots.map(function(m,i){return rnd(seed+i*7.3)>.5;});
    if(free.filter(Boolean).length<3){free[Math.min(1,free.length-1)]=true;free[Math.floor(free.length/2)]=true;free[free.length-1]=true;}
    out.push({date:x,slots:slots,free:free});
  }
  return out;
}
var DEF_OR={1:[['9:00','13:00'],['15:00','19:00']],2:[['9:00','13:00'],['15:00','19:00']],3:[['9:00','13:00'],['15:00','19:00']],4:[['9:00','13:00'],['15:00','19:00']],5:[['9:00','13:00'],['15:00','19:00']]};
var DAYL=[];
var MOT={prima:['Prima visita',45],igiene:['Igiene professionale',40],controllo:['Controllo',20],urgenza:['Dolore o urgenza',30],impianti:['Consulto per impianti',45],orto:['Consulto per ortodonzia',45],bimbi:['Visita per un bambino',20]};
var inboxAdd=function(){};
function booking(){
  var f=$('#bw');if(!f)return;
  DAYL=buildDays(10);
  var st={step:0,day:0,slot:null,pref:'any'};
  var panels=$$('.bw__p',f),steps=$$('#bwSteps li'),daysEl=$('#bwDays'),slotsEl=$('#bwSlots');
  function mot(){var r=f.querySelector('input[name=mot]:checked');return r?r.value:'prima';}
  function setMot(v){var r=f.querySelector('input[name=mot][value="'+v+'"]');if(r)r.checked=true;}
  function show(n,scroll){
    st.step=n;
    panels.forEach(function(p,i){p.hidden=i!==n;});
    steps.forEach(function(li,i){li.classList.toggle('is-on',i===n);li.classList.toggle('is-done',i<n);});
    if(n===1){$('#bwUrg').hidden=mot()!=='urgenza';renderDays();}
    if(scroll){var r=f.getBoundingClientRect();if(r.top<80||r.top>W.innerHeight*.55)W.scrollTo({top:(W.pageYOffset+r.top-96),behavior:RM?'auto':'smooth'});}
  }
  function renderDays(){
    daysEl.innerHTML='';
    DAYL.forEach(function(d,i){
      var b=D.createElement('button');b.type='button';b.className='dy';b.setAttribute('aria-pressed',i===st.day?'true':'false');
      var wd=d.date.toLocaleDateString('it-IT',{weekday:'short'}).replace('.',''),n=d.free.filter(Boolean).length;
      b.innerHTML='<span>'+wd+'</span><b>'+d.date.getDate()+'</b><em>'+n+' liberi</em>';
      b.setAttribute('aria-label',dLong(d.date)+', '+n+' orari liberi');
      b.addEventListener('click',function(){st.day=i;st.slot=null;renderDays();});
      daysEl.appendChild(b);
    });
    renderSlots();
  }
  function renderSlots(){
    var d=DAYL[st.day];slotsEl.innerHTML='';if(!d)return;
    var grp=[['Mattina',function(m){return m<780;}],['Pomeriggio',function(m){return m>=780;}]];
    if(st.slot===null&&st.pref!=='any'){for(var i=0;i<d.slots.length;i++){var am=d.slots[i]<780;if(d.free[i]&&((st.pref==='am'&&am)||(st.pref==='pm'&&!am))){st.slot=d.slots[i];break;}}}
    grp.forEach(function(g){
      var list=[];d.slots.forEach(function(m,i){if(g[1](m))list.push([m,d.free[i]]);});if(!list.length)return;
      var h=D.createElement('h4');h.textContent=g[0];slotsEl.appendChild(h);
      var box=D.createElement('div');
      list.forEach(function(it){
        var b=D.createElement('button');b.type='button';b.className='sl';b.textContent=hm(it[0]);
        if(!it[1]){b.disabled=true;b.setAttribute('aria-label',hm(it[0])+', occupato');}
        b.setAttribute('aria-pressed',st.slot===it[0]?'true':'false');
        b.addEventListener('click',function(){st.slot=it[0];setTxt('#bwErr1','');renderSlots();});
        box.appendChild(b);
      });
      slotsEl.appendChild(box);
    });
    var note=D.createElement('p');note.className='fine';note.style.marginTop='14px';note.textContent='Disponibilità dimostrativa. Nel sito vero mostra le fasce che la segreteria decide di aprire.';slotsEl.appendChild(note);
  }
  function next(){
    if(st.step===0){show(1,true);return;}
    if(st.step===1){if(st.slot===null){setTxt('#bwErr1','Scegliete un giorno e un orario libero.');return;}show(2,true);var n=$('#bwNome');if(n)try{n.focus({preventScroll:true});}catch(e){}}
  }
  $$('[data-next]',f).forEach(function(b){b.addEventListener('click',next);});
  $$('[data-back]',f).forEach(function(b){b.addEventListener('click',function(){show(Math.max(0,st.step-1),true);});});
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(st.step!==2){next();return;}
    var nome=$('#bwNome'),tel=$('#bwTel'),pr=$('#bwPriv'),note=$('#bwNote'),bad=[];
    var okN=nome.value.trim().length>=3,okT=tel.value.replace(/\D/g,'').length>=8;
    nome.classList.toggle('is-bad',!okN);tel.classList.toggle('is-bad',!okT);
    if(!okN)bad.push('nome e cognome');if(!okT)bad.push('un numero di telefono valido');if(!pr.checked)bad.push('il consenso sulla privacy');
    if(bad.length){setTxt('#bwErr2','Manca: '+bad.join(', ')+'.');(okN?(okT?pr:tel):nome).focus();return;}
    setTxt('#bwErr2','');
    var m=mot(),d=DAYL[st.day],first=(f.querySelector('input[name=primo]:checked')||{}).value==='sì';
    var when=cap(dLong(d.date))+', ore '+hm(st.slot),addr=[S.indirizzo,S.citta].filter(Boolean).join(', ');
    var sum=$('#bwSum');sum.innerHTML='';
    [['Motivo',MOT[m][0]],['Quando',when]].concat(S.demo===false?[]:[['Durata',MOT[m][1]+' minuti']]).concat([['Dove',addr],['A nome di',nome.value.trim()],['Telefono',tel.value.trim()]]).forEach(function(r){
      var w=D.createElement('div'),a=D.createElement('dt'),b=D.createElement('dd');a.textContent=r[0];b.textContent=r[1];w.appendChild(a);w.appendChild(b);sum.appendChild(w);
    });
    var s=new Date(d.date);s.setHours(Math.floor(st.slot/60),st.slot%60,0,0);var en=new Date(s.getTime()+MOT[m][1]*6e4);
    var z=function(x){return x.getFullYear()+pad(x.getMonth()+1)+pad(x.getDate())+'T'+pad(x.getHours())+pad(x.getMinutes())+'00';};
    var cal=$('#bwCal');if(cal)cal.href='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+enc(MOT[m][0]+' · '+(S.denominazione||''))+'&dates='+z(s)+'/'+z(en)+'&ctz=Europe/Rome&location='+enc(addr)+'&details='+enc('Richiesta inviata dal sito, in attesa di conferma della segreteria.');
    var seg=$('#bwSeg');
    if(seg){var now=new Date();seg.textContent='';
      ['Nuova richiesta dal sito · oggi '+hm(now.getHours()*60+now.getMinutes()),nome.value.trim()+' · '+tel.value.trim()+' · '+(first?'prima volta in studio':'già paziente'),MOT[m][0]+' ('+MOT[m][1]+' min) · '+dLong(d.date)+', '+hm(st.slot)].concat(note.value.trim()?['Nota: «'+note.value.trim()+'»']:[]).forEach(function(line,i){if(i)seg.appendChild(D.createElement('br'));seg.appendChild(D.createTextNode(line));});}
    inboxAdd({n:nome.value.trim(),tel:tel.value.trim(),mot:MOT[m][0],dur:MOT[m][1],date:d.date,slot:st.slot,first:first,note:note.value.trim(),mine:true});
    show(3,true);
  });
  var nw=$('#bwNew');if(nw)nw.addEventListener('click',function(){st.slot=null;st.pref='any';f.reset();show(0,true);});
  ['#bwNome','#bwTel'].forEach(function(id){var e=$(id);if(e)e.addEventListener('input',function(){e.classList.remove('is-bad');});});
  /* barra rapida in alto e link «prenota» delle schede */
  var q=$('#quick');
  if(q)q.addEventListener('submit',function(e){e.preventDefault();setMot($('#qMot').value);st.pref=$('#qWhen').value;st.slot=null;st.day=0;show(1,false);var t=$('#prenota');if(t)t.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});});
  D.addEventListener('click',function(e){var a=e.target.closest?e.target.closest('[data-mot]'):null;if(a){setMot(a.getAttribute('data-mot'));if(st.step===3){st.slot=null;}show(0,false);}});
  show(0,false);
}

/* ---------- livello Umbra: richieste in segreteria, calcolo, inoltro, pannello ---------- */
function copyText(t,el){
  var ok=function(){toast('Messaggio copiato');};
  var fb=function(){try{if(el&&el.select){el.focus();el.select();D.execCommand('copy');ok();}else toast('Selezionate il testo e copiatelo');}catch(e){toast('Selezionate il testo e copiatelo');}};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,fb);}else fb();}catch(e){fb();}
}
function umbra(){
  if(!(S.umbra&&S.umbra.attivo))return;
  /* 1. richieste */
  var ul=$('#ibxL'),msg=$('#ibxMsg'),txt=$('#ibxTxt'),cnt=$('#ibxN'),nNew=0;
  if(ul){
    if(!DAYL.length)DAYL=buildDays(10);
    var pick=function(di,slot){var d=DAYL[Math.min(di,DAYL.length-1)];return d?{date:d.date,slot:d.slots.indexOf(slot)>-1?slot:d.slots[0]}:{date:new Date(),slot:slot};};
    var ex=[{n:'Giulia R.',tel:'348 000 0000',mot:'Prima visita',dur:45,p:pick(1,570),first:true,note:'Dolore a un molare quando mastico'},{n:'Paolo S.',tel:'333 000 0000',mot:'Igiene professionale',dur:40,p:pick(2,930),first:false,note:''},{n:'Marta L.',tel:'347 000 0000',mot:'Visita per un bambino',dur:20,p:pick(3,1020),first:true,note:'Bambina di 5 anni, prima volta dal dentista'}];
    var add=function(r,top){
      var li=D.createElement('li');li.className='rq'+(r.mine?' is-new':'');
      li.innerHTML='<div class="rq__t"><b></b><span></span></div><div class="rq__w"></div><div class="rq__m"></div><div class="rq__a"><button type="button" data-a="ok">Conferma</button><button type="button" data-a="alt">Proponi un altro orario</button></div><div class="rq__ok"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg><span>Confermata. Il messaggio per il paziente è pronto qui sotto.</span></div>';
      $('.rq__t b',li).textContent=r.n;$('.rq__t span',li).textContent=r.mot+' · '+r.dur+' min';
      if(r.mine)$('.rq__t',li).insertAdjacentHTML('beforeend',' <i class="rq__tag">la vostra prova</i>');
      $('.rq__w',li).textContent=dShort(r.date)+' · '+hm(r.slot);
      $('.rq__m',li).textContent=r.tel+' · '+(r.first?'prima volta in studio':'già paziente')+(r.note?' · «'+r.note+'»':'');
      var name=r.n.split(' ')[0];
      $('[data-a=ok]',li).addEventListener('click',function(){
        li.classList.add('is-ok');nNew=Math.max(0,nNew-1);upd();
        txt.textContent='Gentile '+name+', confermiamo l\'appuntamento per '+r.mot.toLowerCase()+' di '+dLong(r.date)+' alle '+hm(r.slot)+' presso '+(S.denominazione||'lo studio')+', '+[S.indirizzo,S.citta].filter(Boolean).join(', ')+'. Porti con sé la tessera sanitaria ed eventuali radiografie recenti. Per spostare l\'appuntamento risponda a questo messaggio. La segreteria';
        msg.hidden=false;
      });
      $('[data-a=alt]',li).addEventListener('click',function(){
        var alt=null;DAYL.some(function(d){if(d.date>r.date){var i=d.free.indexOf(true);if(i>-1){alt={date:d.date,slot:d.slots[i]};return true;}}return false;});
        txt.textContent='Gentile '+name+', per '+r.mot.toLowerCase()+' l\'orario richiesto non è più libero. Possiamo proporle '+(alt?dLong(alt.date)+' alle '+hm(alt.slot):'un altro orario nei prossimi giorni')+'. Va bene? La segreteria';
        msg.hidden=false;
      });
      if(top&&ul.firstChild)ul.insertBefore(li,ul.firstChild);else ul.appendChild(li);
      nNew++;upd();
    };
    var upd=function(){if(cnt)cnt.textContent=nNew===0?'Tutte gestite':(nNew===1?'1 nuova':nNew+' nuove');};
    ex.forEach(function(r){add({n:r.n,tel:r.tel,mot:r.mot,dur:r.dur,date:r.p.date,slot:r.p.slot,first:r.first,note:r.note});});
    inboxAdd=function(r){add(r,true);};
    var cp=$('#ibxCopy');if(cp)cp.addEventListener('click',function(){copyText(txt.textContent);});
  }
  /* 2. calcolo */
  var c=['c1','c2','c3','c4','c5','c6','c7'].map(function(i){return $('#'+i);});
  if(c[0]){
    var nf=function(n){try{return Math.round(n).toLocaleString('it-IT');}catch(e){return String(Math.round(n));}};
    var calc=function(){
      var v=c.map(function(e){return +e.value;});
      c.forEach(function(e){e.style.setProperty('--p',((e.value-e.min)/(e.max-e.min)*100)+'%');});
      setTxt('#o1',v[0]);setTxt('#o2',String(v[1]).replace('.',',')+' min');setTxt('#o3',v[2]+'%');setTxt('#o4',v[3]);setTxt('#o5',nf(v[4])+' €');setTxt('#o6',v[5]);setTxt('#o7',nf(v[6])+' €');
      var calls=v[0]*22*v[2]/100,hY=calls*v[1]/60*12,chair=v[3]/3*v[4],eY=(chair+v[5]*v[6])*12;
      setTxt('#rH',nf(hY)+' ore');setTxt('#rD',nf(hY/8));setTxt('#rE',nf(eY)+' €');setTxt('#rC',nf(calls));setTxt('#rP',nf(chair)+' €');
    };
    c.forEach(function(e){e.addEventListener('input',calc);});calc();
  }
  /* 3. inoltro */
  var sal=(S.direttore&&S.direttore.saluto);if(sal===undefined||sal===null)sal='Dottore';
  var url=location.href.split('#')[0].replace(/([?&])intro=0&?/,'$1').replace(/[?&]$/,'');
  var base=(sal?sal+', buongiorno.':'Buongiorno.')+'\n\nCi hanno preparato, senza impegno, un\'anteprima del nuovo sito dello studio:\n'+url+'\n\nIn breve:\n• i pazienti chiedono l\'appuntamento online e la richiesta arriva in segreteria già compilata;\n• orari, costi, fondi sanitari e domande frequenti sono sul sito: meno telefonate;\n• titoli, casi clinici e recensioni sono in evidenza.\n\nIn fondo alla pagina c\'è il calcolo di quante ore e quanto fatturato si recuperano. L\'anteprima è gratuita: se '+(/^dottori/i.test(sal)?'vi':'Le')+' piace, basta rispondere su WhatsApp.';
  var pairs=[['#fwTxt','#fwMail','#fwWa'],['#fwTxt2','#fwMail2','#fwWa2']];
  pairs.forEach(function(p){
    var ta=$(p[0]),m=$(p[1]),w=$(p[2]);if(!ta)return;ta.value=base;
    var link=function(){var t=ta.value;if(m)m.href='mailto:?subject='+enc('Anteprima del nuovo sito dello studio')+'&body='+enc(t);if(w)w.href='https://wa.me/?text='+enc(t);};
    ta.addEventListener('input',link);link();
  });
  D.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-copy]'):null;
    if(b){var ta=$(b.getAttribute('data-copy'));if(ta)copyText(ta.value,ta);}
  });
  /* 4. pannello, note, finestra di inoltro */
  var dock=$('#dock'),db=$('#dockB'),dp=$('#dockP'),dh=$('#dockHint'),sv=$('#svT'),modal=$('#fwd');
  var openDock=function(on){if(!dp)return;dp.hidden=!on;if(db)db.setAttribute('aria-expanded',on?'true':'false');if(dh)dh.hidden=true;};
  if(db)db.addEventListener('click',function(e){e.stopPropagation();openDock(dp.hidden);});
  D.addEventListener('click',function(e){if(dock&&dp&&!dp.hidden&&!dock.contains(e.target))openDock(false);});
  if(dp)$$('a',dp).forEach(function(a){a.addEventListener('click',function(){openDock(false);});});
  if(sv)sv.addEventListener('change',function(){H.classList.toggle('sv',sv.checked);toast(sv.checked?'Note attive: le trovate lungo la pagina':'Note nascoste');req();});
  var lastFocus=null;
  var openModal=function(on){if(!modal)return;modal.hidden=!on;if(on){lastFocus=D.activeElement;openDock(false);var x=$('.modal__x',modal);if(x)x.focus();}else if(lastFocus&&lastFocus.focus){try{lastFocus.focus();}catch(e){}}};
  D.addEventListener('click',function(e){
    var t=e.target;if(!t.closest)return;
    if(t.closest('[data-fwd]')){e.preventDefault();openModal(true);}
    else if(t.closest('[data-close]')||t===modal){openModal(false);}
  });
  D.addEventListener('keydown',function(e){if(e.key==='Escape'){openModal(false);openDock(false);}});
}

/* ---------- la scultura opale dell'hero (WebGL, senza librerie) ---------- */
function hexRgb(h){h=String(h||'').trim().replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=parseInt(h,16);if(h.length!==6||isNaN(n))return [.21,.72,.68];return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function opal(){
  var box=$('#opalBox'),cv=$('#opal');if(!box||!cv)return;
  var gl=null,opt={alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'high-performance'};
  try{gl=cv.getContext('webgl',opt)||cv.getContext('experimental-webgl',opt);}catch(e){}
  if(!gl)return;
  var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS=[
'#ifdef GL_FRAGMENT_PRECISION_HIGH','precision highp float;','#else','precision mediump float;','#endif',
'uniform vec2 uR;uniform float uT;uniform vec2 uP;uniform float uS;uniform vec3 uA;uniform vec3 uB;',
'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
'float sdBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}',
'float dot2(vec3 v){return dot(v,v);}',
'float sdCone(vec3 p,vec3 a,vec3 b,float r1,float r2){vec3 ba=b-a;float l2=dot(ba,ba);float rr=r1-r2;float a2=l2-rr*rr;float il2=1./l2;vec3 pa=p-a;float y=dot(pa,ba);float z=y-l2;float x2=dot2(pa*l2-ba*y);float y2=y*y*l2;float z2=z*z*l2;float k=sign(rr)*rr*rr*x2;if(sign(z)*a2*z2>k)return sqrt(x2+z2)*il2-r2;if(sign(y)*a2*y2<k)return sqrt(x2+y2)*il2-r1;return (sqrt(x2*a2*il2)+y*rr)*il2-r1;}',
'float tooth(vec3 p){',
'  p.y+=.10;',
'  vec3 q=p-vec3(0.,.48,0.);q.xz*=1.+.20*clamp(-q.y,-.5,.8);',
'  float crown=sdBox(q,vec3(.34,.16,.27),.44);',
'  vec3 c=vec3(abs(p.x),p.y,abs(p.z));',
'  crown=smin(crown,length(c-vec3(.40,.95,.30))-.27,.26);',
'  float fos=length((p-vec3(0.,1.50,0.))*vec3(.80,1.,.55))-.50;',
'  crown=-smin(-crown,fos,.24);',
'  vec3 r=vec3(abs(p.x),p.y+.07*(2.*smoothstep(-.3,.3,p.x)-1.),p.z);',
'  r.x-=.10*smoothstep(-.2,-1.3,r.y)*smoothstep(-1.3,-.2,r.y)*4.*0.;',
'  float root=sdCone(r,vec3(.35,.10,0.),vec3(.47,-1.20,.05),.345,.09);',
'  return smin(crown,root,.20);',
'}',
'vec2 map(vec3 p){',
'  vec3 q=p;q.y-=sin(uT*.8)*.05;',
'  q.xz*=rot(uT*.22+uP.x*.55+uS*2.6);',
'  q.yz*=rot(-.16+uP.y*.22);',
'  q.xy*=rot(.10);',
'  float d=tooth(q);',
'  float a=uT*.45;',
'  vec3 c1=vec3(cos(a)*1.42,.66+sin(a*1.3)*.10,sin(a)*1.42);',
'  vec3 c2=vec3(cos(-a*.7+2.4)*1.58,-.72+sin(a*.9)*.10,sin(-a*.7+2.4)*1.58);',
'  float pr=min(length(p-c1)-.11,length(p-c2)-.07);',
'  return d<pr?vec2(d,0.):vec2(pr,1.);',
'}',
'vec3 nrm(vec3 p){vec2 e=vec2(.002,-.002);return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}',
'float bx(float a,float e,float a0,float e0,float wa,float we){return smoothstep(wa,wa*.55,abs(a-a0))*smoothstep(we,we*.55,abs(e-e0));}',
'vec3 env(vec3 r){',
'  float a=atan(r.x,r.z),e=asin(clamp(r.y,-1.,1.));',
'  vec3 c=mix(vec3(.72,.81,.82),vec3(.97,.985,.98),smoothstep(-.7,.7,r.y));',
'  c+=vec3(1.)*bx(a,e,-.75,.62,.55,.34)*1.15;',
'  c+=mix(uA,vec3(1.),.25)*bx(a,e,1.25,.05,.16,.95);',
'  c+=uB*bx(a,e,2.6,.3,.45,.4)*.7;',
'  c+=vec3(1.,.90,.82)*smoothstep(-.2,-.9,r.y)*.25;',
'  return c;',
'}',
'void main(){',
'  vec2 uv=(gl_FragCoord.xy-.5*uR)/min(uR.x,uR.y);',
'  vec3 ro=vec3(0.,.05,6.4),rd=normalize(vec3(uv*.66,-1.));',
'  float t=4.2,md=1e3;vec2 m=vec2(0.);bool hit=false;',
'  for(int i=0;i<64;i++){vec3 p=ro+rd*t;m=map(p);md=min(md,m.x);if(m.x<.002){hit=true;break;}t+=m.x*.92;if(t>9.)break;}',
'  vec3 col=vec3(0.);float al=0.;',
'  if(hit){',
'    vec3 p=ro+rd*t;vec3 n=nrm(p);vec3 v=-rd;float nv=max(dot(n,v),0.);float fr=pow(1.-nv,2.6);',
'    vec3 L1=normalize(vec3(-.55,.75,.55)),L2=normalize(vec3(.85,.25,.45));',
'    float w1=dot(n,L1)*.5+.5;float w2=max(dot(n,L2),0.);',
'    float ao=clamp(map(p+n*.22).x/.22,0.,1.);',
'    float thin=smoothstep(-.20,.02,map(p-n*.24).x);',
'    float pe=step(.5,m.y);',
'    vec3 base=mix(vec3(.975,.98,.972),mix(vec3(.93,.96,.96),uA,.34),pe);',
'    col=base*(vec3(1.,.99,.97)*(w1*w1*.55+w1*.20)+mix(uA,vec3(1.),.55)*w2*.20+vec3(.90,.94,.95)*.42);',
'    vec3 ir2=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+n.y*.22+n.x*.16+n.z*.10+uT*.02));',
'    col*=mix(vec3(1.),.84+.30*ir2,.34);',
'    col+=mix(uA,vec3(1.,.95,.9),.4)*thin*.16;',
'    vec3 e=env(reflect(rd,n));',
'    col=mix(col,e,clamp(mix(.08+.55*fr,.22+.70*fr,pe),0.,1.));',
'    vec3 ir=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+fr*1.15+n.y*.30+n.x*.12+uT*.025));',
'    col+=ir*fr*mix(.36,.5,pe);',
'    vec3 h=normalize(L1+v);col+=pow(max(dot(n,h),0.),120.)*.9;',
'    h=normalize(L2+v);col+=mix(uA,vec3(1.),.5)*pow(max(dot(n,h),0.),60.)*.28;',
'    col*=mix(.76,1.,ao);',
'    col=clamp(col,0.,1.);al=1.;',
'  }else{',
'    al=1.-smoothstep(0.,.011,md);col=vec3(.94,.975,.97);',
'  }',
'  vec3 gc=mix(uA,uB,smoothstep(-.5,.5,uv.x+uv.y*.6+sin(uT*.3)*.2));',
'  float g=exp(-md*4.2)*.34*smoothstep(.5,.34,length(uv))*(1.-al);',
'  gl_FragColor=vec4(col*al+gc*g,al+g);',
'}'].join('\n');
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader');return s;}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error('link');
  gl.useProgram(pr);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var U={};['uR','uT','uP','uS','uA','uB'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n);});
  var acc=hexRgb(getComputedStyle(H).getPropertyValue('--aqua'));
  gl.uniform3f(U.uA,acc[0],acc[1],acc[2]);gl.uniform3f(U.uB,.72,.66,.94);
  var scale=Math.min(W.devicePixelRatio||1,W.innerWidth<760?1.25:1.6),q=1;
  var px=0,py=0,tx=0,ty=0,sc=0,vis=true,t0=performance.now(),last=t0,frames=0,sum=0,live=false,raf=0,lost=false;
  function size(){var r=box.getBoundingClientRect(),w=Math.max(2,Math.round(r.width*scale*q)),h=Math.max(2,Math.round(r.height*scale*q));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h);}}
  function draw(now){
    raf=0;if(lost)return;size();
    px+=(tx-px)*.05;py+=(ty-py)*.05;
    gl.uniform2f(U.uR,cv.width,cv.height);gl.uniform1f(U.uT,RM?2.4:(now-t0)/1000);gl.uniform2f(U.uP,px,py);gl.uniform1f(U.uS,sc);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);
    if(!live){live=true;box.classList.add('is-live');}
    var dt=now-last;last=now;frames++;
    if(frames>6&&frames<=46)sum+=dt;
    if(frames===46){if(sum/40>36&&q>.5){q*=.72;frames=0;sum=0;}}
    if(vis&&!RM)raf=requestAnimationFrame(draw);
  }
  function kick(){if(!raf&&!lost)raf=requestAnimationFrame(draw);}
  W.addEventListener('pointermove',function(e){tx=(e.clientX/W.innerWidth)*2-1;ty=(e.clientY/W.innerHeight)*2-1;},{passive:true});
  subs.push(function(y){sc=clamp(y/Math.max(500,W.innerHeight),0,1.4);});
  if('IntersectionObserver' in W){new IntersectionObserver(function(en){vis=en[0].isIntersecting;if(vis)kick();}).observe(box);}
  D.addEventListener('visibilitychange',function(){if(!D.hidden){last=performance.now();kick();}});
  W.addEventListener('resize',kick);
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;box.classList.remove('is-live');});
  kick();
}

/* ---------- avvio ---------- */
function init(){
  safe('config',applyConfig);
  if(S.demo===false)safe('real',real);
  safe('hours',hours);
  safe('reveals',reveals);
  safe('chrome',chrome);
  safe('loops',loops);
  safe('treatments',treatments);
  safe('stack',stack);
  safe('gallery',gallery);
  safe('tech',tech);
  safe('cases',cases);
  safe('booking',booking);
  safe('umbra',umbra);
  safe('opal',opal);
  safe('intro',intro);
  safe('hint',hint);
  H.classList.add('ok');
  req();
  setInterval(function(){safe('hours',hours);},60000);
}
function boot(){
  var m=/[?&]s=([a-z0-9-]{2,60})(?:&|$)/i.exec(location.search);
  if(m&&W.fetch){
    fetch('studi/'+m[1].toLowerCase()+'.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){if(j)merge(S,j);}).catch(function(){}).then(init);
  }else init();
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
})();
