// frontend/src/js/app.js — interações LINHAS 01 (quadrado/linhas)
const $ = (s, c=document)=>c.querySelector(s);
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');
if(hamburger) hamburger.addEventListener('click', ()=> mobileMenu.classList.toggle('open'));

// tema: mantém compatibilidade, mas agora o padrão é papel claro.
// Se usuário tinha 'dark', aplicamos inversão suave (opcional).
const themeBtn = document.getElementById('themeBtn');
if(themeBtn){
  themeBtn.addEventListener('click', ()=>{
    // alterna modo tinta (dark editorial) — apenas para demo
    document.documentElement.classList.toggle('ink-mode');
    const isInk = document.documentElement.classList.contains('ink-mode');
    localStorage.setItem('theme', isInk ? 'ink' : 'paper');
    themeBtn.textContent = isInk ? '☀' : '◐';
  });
  const saved = localStorage.getItem('theme');
  if(saved==='ink' || saved==='dark'){ document.documentElement.classList.add('ink-mode'); themeBtn.textContent='☀'; }
}

// nav active: marca link atual
document.querySelectorAll('.nav-links a').forEach(a=>{
  if(a.href && location.href.includes(a.getAttribute('href'))){
    a.style.color='var(--ink)';
    a.style.background='var(--paper-2)';
    a.style.boxShadow='inset 0 -2.5px 0 var(--ink)';
  }
});

// toast quadrado técnico
window.toast = (msg)=>{
  let t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:10px 16px;border:1.5px solid var(--ink);font-family:JetBrains Mono,monospace;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;z-index:60;box-shadow:3px 3px 0 rgba(11,11,13,.2)';
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(6px)'; t.style.transition='.2s'; }, 2200);
  setTimeout(()=>t.remove(), 2600);
};
