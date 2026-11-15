
(function(){var b=document.getElementById('themeToggle');if(!b)return;var root=document.documentElement;
function setTheme(t){if(t==='dark'){root.setAttribute('data-theme','dark')}else{root.removeAttribute('data-theme')}b.setAttribute('aria-pressed',t==='dark'?'true':'false');try{localStorage.setItem('vitalia-theme',t)}catch(e){}}
b.addEventListener('click',function(){setTheme(root.getAttribute('data-theme')==='dark'?'light':'dark')});
b.setAttribute('aria-pressed',root.getAttribute('data-theme')==='dark'?'true':'false');})();
