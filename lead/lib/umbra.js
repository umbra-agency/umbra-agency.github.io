/* Umbra · base comune: intro che parte e si toglie da sola, comparse allo scroll, contatori, nota concept */
(function(){
  var b=document.body, de=document.documentElement;
  de.classList.add('js');
  if(!document.querySelector('.u-intro')){
    var i=document.createElement('div');i.className='u-intro';i.setAttribute('aria-hidden','true');
    i.innerHTML='<div><i class="u-moon"></i><b>umbra</b><small></small></div>';
    i.querySelector('small').textContent=b.getAttribute('data-umbra')||'anteprima riservata';
    b.prepend(i);
    setTimeout(function(){i.remove()},3200);
  }
  var note=b.getAttribute('data-note');
  if(note){
    var n=document.createElement('aside');n.className='u-note';n.setAttribute('role','note');
    n.innerHTML='<b>Anteprima Umbra.</b> <span></span><button type="button" aria-label="Chiudi nota">×</button>';
    n.querySelector('span').textContent=note;
    n.querySelector('button').onclick=function(){n.hidden=true};
    setTimeout(function(){b.appendChild(n)},2600);
    setTimeout(function(){n.style.transition='opacity .6s';n.style.opacity='0';setTimeout(function(){n.hidden=true},700)},11000);
  }
  function count(el){
    var to=parseFloat(el.getAttribute('data-count')),dec=(el.getAttribute('data-count').split('.')[1]||'').length,t0=null,d=1600;
    function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=(to*e).toLocaleString('it-IT',{minimumFractionDigits:dec,maximumFractionDigits:dec});if(p<1)requestAnimationFrame(f)}
    requestAnimationFrame(f);
  }
  var els=document.querySelectorAll('.rv,.rv-clip,.rv-line,[data-count]');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');if(e.target.hasAttribute('data-count'))count(e.target);io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){io.observe(e)});
  window.umbraReveal=function(){els.forEach(function(e){e.classList.add('in')})};
})();
