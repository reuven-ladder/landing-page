(() => {
  const NS='http://www.w3.org/2000/svg', ink='#34382c', blue='#3F63D5', orange='#c2410c', green='#16733a', paper='#fafaf7';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy=false, resizeTimer, lastW=innerWidth;
  function element(tag,attrs,parent){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));parent.appendChild(n);return n;}
  function scene(id,mobileHeight,desktopHeight,fixedWidth){const svg=document.getElementById(id),mobile=!fixedWidth&&svg.clientWidth<480,w=fixedWidth||(mobile?400:560),h=mobile?mobileHeight:desktopHeight;svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const r=rough.svg(svg);let seed=17;
    const opts=(color=ink,extra={})=>({seed:seed++,stroke:color,strokeWidth:1.15,roughness:1.05,bowing:.6,...extra});
    const g=(attrs={},parent=svg)=>element('g',attrs,parent);
    const line=(x1,y1,x2,y2,color=ink,parent=svg,extra={})=>{const n=r.line(x1,y1,x2,y2,opts(color,extra));parent.appendChild(n);return n;};
    const path=(d,color=ink,parent=svg,extra={})=>{const n=r.path(d,opts(color,extra));parent.appendChild(n);return n;};
    const rect=(x,y,ww,hh,color=ink,parent=svg,extra={})=>{const n=r.rectangle(x,y,ww,hh,opts(color,extra));parent.appendChild(n);return n;};
    const text=(x,y,s,size=20,color=ink,parent=svg,cls='hand')=>{const n=element('text',{x,y,fill:color,'font-size':size,class:cls},parent);n.textContent=s;return n;};
    const circle=(x,y,ww,hh,color=blue,parent=svg)=>{const n=r.ellipse(x,y,ww,hh,opts(color,{roughness:1.5,strokeWidth:1.6}));parent.appendChild(n);return n;};
    function doc(x,y,ww,hh,label,lines=[],angle=0){const group=g({transform:`rotate(${angle} ${x+ww/2} ${y+hh/2})`});path(`M${x} ${y} L${x+ww-15} ${y-2} L${x+ww} ${y+13} L${x+ww-1} ${y+hh} L${x-2} ${y+hh+1} Z`,ink,group,{fill:paper,fillStyle:'solid',roughness:.8});path(`M${x+ww-15} ${y-2} V${y+14} H${x+ww}`,ink,group);text(x+12,y+24,label,10,ink,group,'svg-label');lines.forEach((s,i)=>text(x+12,y+49+i*22,s,19,ink,group));for(let yy=y+57+lines.length*20;yy<y+hh-10;yy+=12)line(x+12,yy,x+ww-18,yy,'#a5a991',group,{strokeWidth:.55});return group;}
    function person(x,y,scale=.23){const group=g({transform:`translate(${x} ${y}) scale(${scale}) translate(-460 -600)`});[['person',464.5,702.5,515,297.5],['head',643,602.5,194,165.5],['armr',875.5,711,214.5,174]].forEach(([name,xx,yy,ww,hh])=>element('image',{href:`../assets/sketch/${name}.webp`,x:xx,y:yy,width:ww,height:hh},group));return group;}
    function reveal(n){n.classList.add('draw-ink');return n;}
    return{svg,mobile,w,h,g,line,path,rect,text,circle,doc,person,reveal};
  }
  function desk(){const svg=document.getElementById('desk-sketch');svg.replaceChildren();svg.setAttribute('viewBox','0 90 1600 1010');const image=(name,x,y,width,height)=>element('image',{href:`../assets/sketch/${name}.webp`,x,y,width,height},svg);element('rect',{x:72,y:92,width:266,height:296,fill:'#e5edf1'},svg);element('circle',{cx:120,cy:140,r:18,fill:'#f7d66c',stroke:ink,'stroke-width':1.4},svg);image('room',35.5,85.5,1529.5,914.5);image('desk',127,443,1410.5,296.5);image('left-spec',312,342,376,246);image('xl',744,304,532,302);[['person',464.5,702.5,515,297.5],['head',643,602.5,194,165.5],['armr',875.5,711,214.5,174]].forEach(([n,x,y,w,h])=>image(n,x,y,w,h));}
  function papers(){const s=scene('papers-sketch',300,380),{mobile:m}=s;
    s.doc(m?6:25,m?40:45,m?151:190,m?177:218,'DRAWINGS · 212 SHEETS',['See specification'],-10);
    s.doc(m?177:290,m?12:23,m?165:190,m?194:225,'SPEC · 1,186 PAGES',['See drawings'],7);
    s.doc(m?139:192,m?166:198,m?162:188,m?104:122,'ADDENDUM 4',['Roof plan reissued'],-4);
    s.reveal(s.path(m?'M126 102 C199 75 119 29 199 57':'M187 120 C272 90 185 22 310 84',blue));
    s.reveal(s.path(m?'M279 126 C330 166 345 149 333 201':'M380 148 C480 185 471 213 391 230',blue));
    s.text(m?12:26,m?258:325,'bid day: Friday',m?22:25,orange);s.path(m?'M12 263 q45 8 117 1':'M26 332 q75 7 132 0',orange);
    s.text(m?250:400,m?281:351,'RFI cutoff: passed',m?18:22,orange);
  }
  function building(){const s=scene('building-sketch',390,430),{mobile:m}=s;
    s.doc(m?6:22,9,m?151:172,91,'DRAWING · REV A',['Original layout'],-7);s.doc(m?236:359,16,m?151:172,91,'DRAWING · REV B',['Revised layout'],6);
    const bx=m?46:120,by=m?149:145,bw=m?274:306,bh=m?157:181;
    s.path(`M${bx-10} ${by+2} L${bx+bw/2} ${by-29} L${bx+bw+10} ${by+2}`);s.rect(bx,by,bw,bh);s.line(bx,by+bh/3,bx+bw,by+bh/3);s.line(bx,by+bh*2/3,bx+bw,by+bh*2/3);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=bx+19+col*(bw-29)/4,y=by+12+row*bh/3,dw=24,dh=m?31:38;s.path(`M${x} ${y+dh} V${y} H${x+dw} V${y+dh}`);s.path(`M${x+2} ${y+2} L${x+dw-4} ${y+6} V${y+dh-2} L${x+2} ${y+dh}`,ink,undefined,{fill:ink,fillStyle:'hachure',hachureGap:4,fillWeight:.2});}
    const change=s.g();s.rect(bx+bw-62,by+bh/3-4,96,bh*2/3+8,blue,change,{fill:blue,fillStyle:'hachure',hachureGap:7,fillWeight:.35,strokeWidth:1.7});s.reveal(change);
    s.text(m?33:95,m?352:391,'affected scope → checked again',m?23:27,blue);s.path(m?'M251 330 q36 -8 68 -30':'M371 361 q53 -16 68 -46',blue);
  }
  // Comic strip: four fixed-size panels telling one finding.
  function panels(){
    let s=scene('panel-1',0,230,300);
    s.doc(22,16,206,196,'SPEC 08 71 00 · §2.4',['Hardware set 4:','hinges, lockset,','closer, kick plate'],-2);
    s.reveal(s.circle(58,103,70,30,blue));
    s.text(236,48,'p. 412',22,orange);
    s=scene('panel-2',0,230,300);
    s.rect(14,14,272,132,ink,undefined,{fill:paper,fillStyle:'solid',roughness:.8});
    s.text(26,36,'A-601 · DOOR SCHEDULE',10,ink,undefined,'svg-label');
    ['DOOR','SET','CLOSER'].forEach((t,i)=>s.text(26+i*86,60,t,10,'#6b6b66',undefined,'svg-label'));
    s.line(24,68,276,68,'#a5a991');
    [['104','4'],['105','4'],['106','4']].forEach(([d,k],i)=>{const y=92+i*20;s.text(26,y,d,19);s.text(112,y,k,19);s.text(198,y,'—',19,orange);});
    const flag=s.g();s.rect(96,164,190,54,blue,flag,{fill:'#eef3ff',fillStyle:'solid'});s.text(108,188,'Dora: conflict!',21,blue,flag);s.text(108,207,'08 71 00 ↔ A-601',10,blue,flag,'svg-label');
    s.reveal(s.path('M210 120 C250 132 236 150 228 162',blue));
    s=scene('panel-3',0,230,300);
    s.person(118,118,.27);
    s.path('M10 22 Q150 2 280 22 Q300 58 270 88 Q150 106 32 92 Q-4 60 10 22 Z',blue,undefined,{fill:paper,fillStyle:'solid'});
    s.path('M150 96 L176 124 L174 98',blue);
    s.text(30,50,'Which set 4 doors are rated?',19,blue);s.text(30,75,'Check G-101.',19,blue);
    s.text(10,214,'Cost professional',10,ink,undefined,'svg-label');
    s=scene('panel-4',0,230,300);
    s.doc(14,16,272,150,'ESTIMATE · 08 71 00 · LINE 12',[],1);
    s.text(28,72,'Closers · set 4',23);
    s.text(168,72,'0',23,orange);s.line(162,66,182,62,orange);
    s.text(188,72,'→ 8 EA',24,green);s.reveal(s.path('M186 80 q36 6 66 -2',green));
    s.text(28,118,'8 rated doors: priced',19,green);
    s.text(28,146,'4 unclear: RFI #9',19,orange);
    s.text(40,206,'the expert changed the number',19,blue);
  }
  function memory(){const s=scene('memory-sketch',380,380,560);
    s.doc(348,44,190,250,'PROJECT LOG',['Questions','Decisions','Assumptions'],7);
    s.doc(24,22,370,300,'CHECKS · EVERY NEW SET',[],-2);
    ['Spec sections ↔ drawing notes','Addenda ↔ the set before','Equipment schedules ↔ plans','Door hardware ↔ door schedule'].forEach((t,i)=>{s.text(42,86+i*36,'✓',21,green);s.text(66,86+i*36,t,19);});
    s.text(42,244,'+',24,blue);s.text(66,244,'Hardware sets ↔ rated doors',20,blue);s.text(66,268,'on the life-safety plan',20,blue);
    s.reveal(s.path('M64 278 q110 8 200 -2',blue));
    s.text(300,356,'added from the last project',19,orange);s.path('M380 336 C 372 312 330 300 290 282',orange);
  }
  // Rough frames around HTML cards (.sk-box) and photo circles (.sk-ph).
  function boxes(){document.querySelectorAll('.sk-box').forEach((el,i)=>{let svg=el.querySelector(':scope>svg.sk-frame');if(!svg){svg=document.createElementNS(NS,'svg');svg.setAttribute('class','sk-frame');svg.setAttribute('aria-hidden','true');el.prepend(svg);}
    const w=el.offsetWidth,h=el.offsetHeight;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.replaceChildren();const color=el.dataset.ink==='blue'?blue:ink;
    svg.appendChild(rough.svg(svg).rectangle(3,3,w-6,h-6,{seed:40+i,stroke:color,strokeWidth:el.dataset.ink?1.6:1.15,roughness:1.1,bowing:.7}));});
    document.querySelectorAll('.sk-ph').forEach((el,i)=>{let svg=el.querySelector(':scope>svg');if(!svg){svg=element('svg',{viewBox:'0 0 100 100','aria-hidden':'true'},el);}svg.replaceChildren();svg.appendChild(rough.svg(svg).ellipse(50,50,94,94,{seed:70+i,stroke:ink,strokeWidth:1.6,roughness:1.3}));});
  }
  // Hand-drawn agent avatars.
  function avatars(){document.querySelectorAll('.sk-av').forEach((el,i)=>{el.replaceChildren();const svg=element('svg',{viewBox:'0 0 64 64','aria-hidden':'true'},el),r=rough.svg(svg),o=(c=ink,x={})=>({seed:90+i*7,stroke:c,strokeWidth:1.3,roughness:1.1,...x}),add=n=>svg.appendChild(n);
    add(r.ellipse(32,32,58,58,o(blue,{fill:'#eef3ff',fillStyle:'solid'})));
    const t=el.dataset.icon;
    if(t==='door'){add(r.rectangle(22,14,20,36,o()));add(r.ellipse(37,33,4,4,o(ink,{fill:ink,fillStyle:'solid'})));}
    if(t==='beam'){add(r.path('M18 18 H46 M18 46 H46 M32 18 V46',o(ink,{strokeWidth:2})));}
    if(t==='pipe'){add(r.path('M16 22 H36 Q44 22 44 30 V48',o(ink,{strokeWidth:2.2})));add(r.line(14,18,14,26,o()));add(r.line(40,48,48,48,o()));}
    if(t==='addenda'){add(r.rectangle(18,20,22,28,o(ink,{fill:paper,fillStyle:'solid'})));add(r.rectangle(24,14,22,28,o(ink,{fill:paper,fillStyle:'solid'})));const n=element('text',{x:31,y:34,'font-size':14,class:'hand',fill:blue},svg);n.textContent='4';}
    if(t==='list'){[22,32,42].forEach(y=>{add(r.path(`M17 ${y} l3 3 l5 -6`,o(green,{strokeWidth:1.6})));add(r.line(28,y,47,y,o()));});}
  });}
  // Lines from the lead cost professional to each agent (hidden on phones via CSS).
  function links(){const org=document.querySelector('.sk-org');if(!org)return;const svg=org.querySelector('.sk-links');svg.replaceChildren();const lead=org.querySelector('#lead'),agents=[...org.querySelectorAll('.sk-agent')];
    if(!lead||getComputedStyle(svg).display==='none')return;const box=org.getBoundingClientRect(),w=box.width,h=box.height;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const r=rough.svg(svg),L=lead.getBoundingClientRect(),x0=L.left+L.width/2-box.left,y0=L.bottom-box.top;
    const g=element('g',{class:'draw-ink'},svg);agents.forEach((a,i)=>{const A=a.getBoundingClientRect(),x1=A.left+A.width/2-box.left,y1=A.top-box.top-4;g.appendChild(r.path(`M${x0} ${y0} C ${x0} ${(y0+y1)/2} ${x1} ${(y0+y1)/2} ${x1} ${y1}`,{seed:120+i,stroke:blue,strokeWidth:1.3,roughness:.9,bowing:.5}));});}
  // Strike-through on the "tool" cards: one rough line per rendered text line, drawn in on hover (CSS).
  function strikes(){document.querySelectorAll('.sk-x .sk-opt-b').forEach((pEl,i)=>{const card=pEl.parentElement;let svg=card.querySelector(':scope>svg.sk-strike');if(!svg){svg=element('svg',{class:'sk-strike','aria-hidden':'true'},card);}svg.replaceChildren();
    const C=card.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${C.width} ${C.height}`);const r=rough.svg(svg),range=document.createRange();range.selectNodeContents(pEl);
    const rows=[];[...range.getClientRects()].forEach(q=>{const y=Math.round(q.top+q.height*.55-C.top),row=rows.find(o=>Math.abs(o.y-y)<4);if(row){row.x0=Math.min(row.x0,q.left-C.left);row.x1=Math.max(row.x1,q.right-C.left);}else rows.push({y,x0:q.left-C.left,x1:q.right-C.left});});
    rows.forEach((o,j)=>{const n=r.line(o.x0-4,o.y+1,o.x1+4,o.y-1,{seed:200+i*10+j,stroke:'#c2410c',strokeWidth:1.7,roughness:1.4,bowing:1.2});n.style.setProperty('--d',`${j*.12}s`);svg.appendChild(n);});
    svg.querySelectorAll('path').forEach(p=>{const len=p.getTotalLength();p.style.strokeDasharray=len;p.style.setProperty('--len',len);});});}
  // Estimate sheet: one line open at a time, and a fixed height so opening a line never moves the layout.
  function sheet(){const sh=document.querySelector('.sk-sheet');if(!sh)return;const lines=[...sh.querySelectorAll('.sk-line')];sh.style.minHeight='';const was=lines.map(d=>d.open);let max=0;
    lines.forEach(d=>{lines.forEach(x=>x.open=(x===d));max=Math.max(max,sh.offsetHeight);});lines.forEach((d,i)=>d.open=was[i]);sh.style.minHeight=max+'px';}
  document.addEventListener('toggle',e=>{const d=e.target;if(!d.classList||!d.classList.contains('sk-line')||!d.open)return;document.querySelectorAll('.sk-line[open]').forEach(x=>{if(x!==d)x.open=false;});},true);
  function drawScenes(){desk();papers();panels();memory();building();sheet();boxes();avatars();links();strikes();prepareInk();update();}
  function prepareInk(){document.querySelectorAll('.draw-ink path').forEach(p=>{if(p.getAttribute('fill')&&p.getAttribute('fill')!=='none')return;try{const len=p.getTotalLength();p.dataset.len=len;p.style.strokeDasharray=len;}catch{}});}
  function update(){busy=false;const vh=innerHeight;document.querySelectorAll('.draw-ink').forEach(g=>{const r=g.ownerSVGElement.getBoundingClientRect(),progress=reduced?1:Math.max(0,Math.min(1,(vh*.95-r.top)/(r.height*.85)));g.querySelectorAll('path[data-len]').forEach(p=>p.style.strokeDashoffset=Number(p.dataset.len)*(1-progress));});}
  addEventListener('scroll',()=>{if(!busy){busy=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',()=>{if(innerWidth===lastW)return;lastW=innerWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(drawScenes,140);});drawScenes();document.fonts.ready.then(drawScenes);addEventListener('load',drawScenes);
})();
