if(!self.define){let e,i={};const n=(n,c)=>(n=new URL(n+".js",c).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(c,s)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(i[r])return;let o={};const f=e=>n(e,r),t={module:{uri:r},exports:o,require:f};i[r]=Promise.all(c.map((e=>t[e]||f(e)))).then((e=>(s(...e),o)))}}define(["./workbox-7cfec069"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-C_D-nbIQ.css",revision:"f7d64983f88e5aae2a7c8b1ff44d5480"},{url:"assets/index-DwLbxjH2.js",revision:"ec2b3d87389e74e911a6f069a8dd2f34"},{url:"index.html",revision:"be44234f20d6c71e1341161b40022af7"},{url:"registerSW.js",revision:"42346a55211aaf20b89e943c7fcb5c6e"},{url:"icon-chicken/web/icon-192.png",revision:"27865433c92df6f6047bb556c31dd4c2"},{url:"icon-chicken/web/icon-512.png",revision:"f9aba0dc9f1c553d48f353fc81de5db1"},{url:"icon-chicken/web/icon-512-maskable.png",revision:"f8f237cae7b0d1e859ae33f31297c8bb"},{url:"manifest.webmanifest",revision:"9012676b9a982e8bb7980fcac65da204"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
