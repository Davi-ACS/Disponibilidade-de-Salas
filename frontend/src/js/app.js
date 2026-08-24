// frontend/src/js/app.js — interações globais
const $ = (s, c=document)=>c.querySelector(s);
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');
if(hamburger) hamburger.addEventListener('click', ()=> mobileMenu.classList.toggle('open'));

const themeBtn = document.getElementById('themeBtn');
if(themeBtn){
  themeBtn.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });
  if(localStorage.getItem('theme')==='light') document.documentElement.classList.add('light');
}

// Demo: toast simples
window.toast = (msg)=>{
  let t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#0f172a;color:white;padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.15);box-shadow:0 10px 30px rgba(0,0,0,.4);z-index:60;font-weight:600';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2600);
};
