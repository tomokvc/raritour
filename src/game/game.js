// Raritour – Spiel-Logik (Client). Wird von src/app/Game.tsx einmal gestartet.
// @ts-nocheck
export async function initGame(){
const [MAP,ROUND]=await Promise.all([fetch('/map/germany.json').then(r=>r.json()),fetch('/api/round',{cache:'no-store'}).then(r=>r.json())]);
const CATS=ROUND.categories;
let PID;try{PID=localStorage.getItem('raritour-pid');if(!PID){PID=crypto.randomUUID();localStorage.setItem('raritour-pid',PID)}}catch(e){PID=crypto.randomUUID()}


const TIERS=[
 {min:30,ic:'🚶',n:'Latschen',km:12,q:['Die halbe Republik hat dasselbe gesagt. Schuhe schnüren!','Mainstream-Antwort – auf Schusters Rappen weiter.']},
 {min:20,ic:'🚲',n:'Lastenrad',km:30,q:['Gemütlich wie in Prenzlauer Berg.','Kind vorne rein, Kiste hinten drauf – los.']},
 {min:12,ic:'🚌',n:'Schienenersatzverkehr',sn:'SEV-Bus',km:54,q:['Bitte beachten Sie den Schienenersatzverkehr.','Immerhin: Es geht voran.']},
 {min:6,ic:'🚆',n:'Deutschlandticket-RE',sn:'D-Ticket-RE',km:84,q:['Deutschlandticket gezückt, Stehplatz gesichert.','Voll, aber er fährt!']},
 {min:3,ic:'🚄',n:'ICE (pünktlich!)',km:120,q:['Der ICE ist heute tatsächlich pünktlich. Kein Witz.','Grund für die Pünktlichkeit: unbekannt.']},
 {min:1.5,ic:'🏎️',n:'Autobahn ohne Tempolimit',sn:'Autobahn ohne Limit',km:150,q:['Linke Spur, freie Fahrt.','Abstand halten – trotzdem Vollgas.']},
 {min:0.5,ic:'✈️',n:'Flieger ab BER',km:190,q:['Ab BER – ja, der ist inzwischen wirklich offen.','Boarding completed! 14 Jahre Bauzeit haben sich gelohnt.']},
 {min:0,ic:'🛩️',n:'Regierungsflieger',sn:'Regierungs­flieger',km:224,q:['Ausnahmsweise ohne Panne gestartet!','Die Flugbereitschaft lässt grüßen – Ersatzmaschine nicht nötig.','Seltener geht’s nicht. Rotes Teppich-Niveau.']}];
const FAILQ=['Störung im Betriebsablauf.','Weichenstörung – Weiterfahrt verzögert sich.','Ihr Antrag wird bearbeitet. Voraussichtlich bis 2031.','Funkloch. Willkommen in Deutschland.'];
const pick=a=>a[Math.random()*a.length|0];


const tierOf=p=>TIERS.find(t=>p>t.min)||TIERS[TIERS.length-1];

// ---------- Sound (WebAudio, synthetisch) ----------
let AC=null,muted=false;try{muted=localStorage.getItem('raritour-mute')==='1'}catch(e){}
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,type='sine',v=.2,w=0,f2){const a=ac();if(!a||muted)return;const t=a.currentTime+w,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.05)}
function noise(d,f1,f2,v=.25,w=0,q=1.5){const a=ac();if(!a||muted)return;const t=a.currentTime+w,n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=Math.random()*2-1;const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type='bandpass';fl.Q.value=q;fl.frequency.setValueAtTime(f1,t);fl.frequency.exponentialRampToValueAtTime(f2,t+d);const g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+d*.3);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl).connect(g).connect(a.destination);s.start(t)}
const SFX={
  '🚶':()=>{for(let i=0;i<4;i++)noise(.07,900,500,.35,i*.22,3)},
  '🚲':()=>{tone(2100,.5,'triangle',.18);tone(2100,.6,'triangle',.18,.16)},
  '🚌':()=>{tone(233,.35,'square',.07);tone(294,.35,'square',.07);tone(233,.45,'square',.07,.42);tone(294,.45,'square',.07,.42)},
  '🚆':()=>{for(let i=0;i<6;i++)tone(1050,.08,'square',.06,i*.14);noise(.8,300,900,.08,.9)},
  '🚄':()=>{tone(659,.5,'sine',.2);tone(831,.5,'sine',.2,.18);tone(988,.8,'sine',.2,.36);noise(1.2,400,1200,.08,.1)},
  '🏎️':()=>{tone(70,1.3,'sawtooth',.09,0,260);tone(105,1.3,'sawtooth',.05,0,390);noise(1.3,200,900,.1)},
  '✈️':()=>{noise(1.6,250,2600,.3,0,.8);tone(180,1.4,'sawtooth',.03,0,520)},
  '🛩️':()=>{noise(1.6,250,2600,.3,0,.8);[523,659,784].forEach((f,i)=>tone(f,.3,'triangle',.15,.4+i*.12));tone(1047,.9,'triangle',.17,.8)},
  city:()=>{tone(1319,.5,'sine',.15);tone(1760,.6,'sine',.1,.08)},
  wrong:()=>{tone(180,.28,'sawtooth',.12,0,110);tone(140,.35,'sawtooth',.1,.12,80)},
  fail:()=>{[392,330,262].forEach((f,i)=>tone(f,.35,'triangle',.18,i*.2))},
  click:()=>tone(880,.06,'square',.05),
  fanfare:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.35,'triangle',.2,i*.13));tone(1047,1.1,'triangle',.2,.55);tone(1319,1.1,'sine',.12,.55)}
};
const sfx=k=>{try{SFX[k]&&SFX[k]()}catch(e){}};
const muteBtn=document.getElementById('mute');const setMute=m=>{muted=m;muteBtn.textContent=m?'🔇':'🔊';try{localStorage.setItem('raritour-mute',m?'1':'0')}catch(e){}};setMute(muted);
muteBtn.addEventListener('click',()=>{setMute(!muted);if(!muted)sfx('click')});

// ---------- Meme-Animationen (pro Verkehrsmittel) ----------
const NOLIMIT='<svg viewBox="0 0 60 60" width="54" height="54"><circle cx="30" cy="30" r="27" fill="#fff" stroke="#222" stroke-width="2"/><g stroke="#222" stroke-width="2.6"><line x1="14" y1="40" x2="40" y2="14"/><line x1="18" y1="44" x2="44" y2="18"/><line x1="22" y1="48" x2="48" y2="22"/><line x1="10" y1="36" x2="36" y2="10"/><line x1="26" y1="51" x2="51" y2="26"/></g></svg>';
const MEMES={
  '🚶':{s:'<div class="mm walk">🚶</div><div class="mm puff">💨</div>',c:'Zu Fuß. Wie 1850.'},
  '🚲':{s:'<div class="mm across">👶📦🚲</div>',c:'Prenzlauer-Berg-Express'},
  '🚌':{s:'<div class="mm across slow"><span class="sev">SEV</span>🚌</div>',c:'Ersatzverkehr. Wie immer.'},
  '🚆':{s:'<div class="mm across">🚆<span class="crowd">🧍🧍🧍🧍🧍</span></div>',c:'Deutschlandticket-Gedränge: Stehplatz gesichert'},
  '🚄':{s:'<div class="mm board"><div class="fb">ICE 1337 · Frankfurt</div><div class="fb big" id="delay">+45 Min</div></div>',c:'Moment … pünktlich?!',fx:el=>{const d=el.querySelector('#delay');const seq=['+45 Min','+20 Min','+5 Min','pünktlich'];seq.forEach((v,i)=>setTimeout(()=>{d.textContent=v;d.classList.remove('flip');void d.offsetWidth;d.classList.add('flip');noise(.05,3000,2500,.06)},350+i*380))}},
  '🏎️':{s:'<div class="mm sign">'+NOLIMIT+'</div><div class="mm zoom">🏎️<span class="lines">≡</span></div>',c:'Freie Fahrt. Linke Spur.'},
  '✈️':{s:'<div class="mm crane">🏗️</div><div class="mm takeoff">✈️</div>',c:'BER: eröffnet. Wirklich.'},
  '🛩️':{s:'<div class="mm carpet"></div><div class="mm takeoff">🛩️</div><div class="mm smoke">💨</div><div class="mm thumbs">👍</div>',c:'Panne? Heute nicht.'},
  '❌':{s:'<div class="mm baustelle">🚧🚧🚧</div>',c:'Störung im Betriebsablauf'},
  '⏰':{s:'<div class="mm leave">🚆💨</div><div class="mm walk">🏃</div>',c:'Zurückbleiben, bitte!'}
};
function meme(k){const m=MEMES[k];if(!m)return;const box=document.querySelector('.mapbox');box.querySelectorAll('.meme').forEach(e=>e.remove());
  const d=document.createElement('div');d.className='meme';d.innerHTML=`<div class="stage">${m.s}</div><div class="cap"></div>`;d.querySelector('.cap').textContent=m.c;box.append(d);
  if(m.fx)m.fx(d);setTimeout(()=>d.classList.add('out'),2600);setTimeout(()=>d.remove(),3000)}

// ---------- Konfetti ----------
function confetti(){const cv=document.getElementById('confetti'),x=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;const cols=['#F26A1B','#1B2A4A','#FFC83D','#3d5a99','#fff'];
  const P=Array.from({length:180},()=>({x:innerWidth/2+(Math.random()-.5)*200,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,r:Math.random()*6+4,c:cols[Math.random()*5|0],a:Math.random()*6,va:(Math.random()-.5)*.3}));
  const t0=performance.now();(function f(t){x.clearRect(0,0,cv.width,cv.height);P.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);x.restore()});if(t-t0<4000)requestAnimationFrame(f);else x.clearRect(0,0,cv.width,cv.height)})(t0)}

// Route
const C=MAP.cities; let cum=0; C.forEach(c=>{cum+=c.km;c.cum=cum}); const TOTAL=cum;
document.getElementById('total').textContent=TOTAL.toLocaleString('de-DE');
document.getElementById('legend').innerHTML=TIERS.map(t=>`<span>${t.ic} ${t.sn||t.n} ${t.km} km</span>`).join('');
document.getElementById('stiers').innerHTML=TIERS.map((t,i)=>`<div style="animation-delay:${i*70}ms"><div class="b">${t.ic}</div>${t.sn||t.n}<div class="k">+${t.km} km</div></div>`).join('');
const svg=document.getElementById('map'), NS='http://www.w3.org/2000/svg';
const el=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const NSS={'vector-effect':'non-scaling-stroke'};
svg.append(el('rect',{x:-200,y:-200,width:800,height:940,fill:'#BCD6E6'}));
svg.append(el('path',Object.assign({d:MAP.neigh,fill:'#E3E0D8',stroke:'#C8C2B4','stroke-width':.8},NSS)));
svg.append(el('path',Object.assign({d:MAP.states,fill:'none',stroke:'#A89C80','stroke-width':3.2,'stroke-linejoin':'round'},NSS)));
svg.append(el('path',Object.assign({d:MAP.states,fill:'#F5F1E6',stroke:'#DDD4C0','stroke-width':.9,'stroke-dasharray':'3 2'},NSS)));
svg.append(el('path',Object.assign({d:MAP.rivMinor,fill:'none',stroke:'#9EC3DD','stroke-width':.8},NSS)));
svg.append(el('path',Object.assign({d:MAP.rivMajor,fill:'none',stroke:'#86B3D4','stroke-width':1.6},NSS)));
svg.append(el('path',{d:MAP.lakes,fill:'#BCD6E6'}));
svg.append(el('polyline',Object.assign({points:C.map(c=>c.x+','+c.y).join(' '),fill:'none',stroke:'#1B2A4A','stroke-opacity':.45,'stroke-width':2.2,'stroke-dasharray':'5 5','stroke-linecap':'round'},NSS)));
const done=el('polyline',Object.assign({points:'',fill:'none',stroke:'#F26A1B','stroke-width':5,'stroke-linecap':'round','stroke-linejoin':'round'},NSS)); svg.append(done);
// Marker (werden gegen den Zoom skaliert, damit sie gleich groß bleiben)
const markers=[];
function marker(x,y,inner){const g=el('g',{});g.innerHTML=inner;svg.append(g);markers.push({g,x,y});return g}
const otherG=[];MAP.others.forEach(o=>otherG.push(marker(o.x,o.y,`<circle r="2.2" fill="#9A927F"/><text x="4" y="3.5" font-size="8.5" fill="#8A8270" font-family="Inter,sans-serif">${o.n}</text>`)));
const LBL={Hamburg:[8,-6,'start'],Berlin:[8,-6,'start'],Leipzig:[-8,-6,'end'],Dresden:[8,4,'start'],'Nürnberg':[8,4,'start'],'München':[8,4,'start'],Stuttgart:[-8,4,'end'],Frankfurt:[8,4,'start'],'Köln':[-2,16,'middle'],'Düsseldorf':[8,8,'start'],Dortmund:[8,-7,'start'],Hannover:[8,4,'start'],Bremen:[-8,-4,'end']};
const cityDots={};
C.forEach((c,i)=>{const [dx,dy,an]=LBL[c.n];const g=marker(c.x,c.y,`<circle r="${i===0?6:4.8}" fill="#fff" stroke="#1B2A4A" stroke-width="2.2"/><text x="${dx}" y="${dy}" text-anchor="${an}" font-size="12" font-weight="700" fill="#1B2A4A" font-family="Inter,sans-serif" paint-order="stroke" stroke="#F5F1E6" stroke-width="3">${c.n}</text>`);cityDots[c.n]=g.querySelector('circle')});
const pin=marker(C[0].x,C[0].y,'<circle r="16" fill="#fff" stroke="#F26A1B" stroke-width="3"/><text text-anchor="middle" dy="6" font-size="18">📍</text>');
const vehicle=pin.querySelector('text');
let reached=new Set(), veh={x:C[0].x,y:C[0].y};
// Kamera
let camMode='follow'; const FULL={x:0,y:0,w:400,h:540}; let cam={...FULL};
function camTarget(){if(camMode==='all')return FULL;const w=175,h=w*540/400;return {x:Math.max(-40,Math.min(440-w,veh.x-w/2)),y:Math.max(-40,Math.min(580-h,veh.y-h/2)),w,h}}
(function camLoop(){const tg=camTarget();for(const k of ['x','y','w','h'])cam[k]+=(tg[k]-cam[k])*.08;
  svg.setAttribute('viewBox',`${cam.x} ${cam.y} ${cam.w} ${cam.h}`);const s=cam.w/400;const ov=cam.w>300?'0':'1';otherG.forEach(g=>{if(g.style.opacity!==ov)g.style.opacity=ov});
  markers.forEach(m=>m.g.setAttribute('transform',`translate(${m===markers[markers.length-1]?veh.x:m.x},${m===markers[markers.length-1]?veh.y:m.y}) scale(${s})`));
  requestAnimationFrame(camLoop)})();
const camF=document.getElementById('camF'),camA=document.getElementById('camA');
camF.onclick=()=>{camMode='follow';camF.classList.add('on');camA.classList.remove('on')};
camA.onclick=()=>{camMode='all';camA.classList.add('on');camF.classList.remove('on')};
function ortsschild(n){const w=document.querySelector('.mapbox');const d=document.createElement('div');d.className='ortsschild';d.innerHTML=`<div class="n"></div><div class="s">Raritour-Etappe</div>`;d.querySelector('.n').textContent=n;w.append(d);setTimeout(()=>d.remove(),2000)}
function pulse(c){const r=el('circle',Object.assign({cx:c.x,cy:c.y,r:6,fill:'none',stroke:'#F26A1B','stroke-width':3,class:'ring'},NSS));svg.insertBefore(r,markers[0].g);setTimeout(()=>r.remove(),1100)}
function sign(km){const nx=C.filter(c=>c.cum>km+0.01).slice(0,3);const s=document.getElementById('sign');
  s.innerHTML=nx.length?nx.map(c=>`<div class="r"><span>${c.n}</span><span>${Math.round(c.cum-km)} km</span></div>`).join(''):'<div class="r"><span>🏁 Ziel erreicht</span></div>'}
function posAt(km){km=Math.min(km,TOTAL);const pts=[[C[0].x,C[0].y]];let last=C[0].n;
  for(let i=1;i<C.length;i++){const a=C[i-1],b=C[i];if(km>=b.cum){pts.push([b.x,b.y]);last=b.n;continue}const f=(km-a.cum)/b.km;pts.push([a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f]);return {pts,last,next:b.n,rest:Math.round(b.cum-km)}}
  return {pts,last,next:null,rest:0};}
let shown=0;
function draw(km){const p=posAt(km);done.setAttribute('points',p.pts.map(q=>q.join(',')).join(' '));const e=p.pts[p.pts.length-1];veh.x=e[0];veh.y=e[1];
  C.forEach(c=>{const ok=c.cum<=km+0.01;cityDots[c.n].setAttribute('fill',ok?'#F26A1B':'#fff');if(ok&&!reached.has(c.n)){reached.add(c.n);if(c.cum>0){pulse(c);sfx('city');ortsschild(c.n)}}});
  sign(km);
  document.getElementById('where').textContent=p.next?`zuletzt: ${p.last} · noch ${p.rest} km bis ${p.next}`:'Ziel erreicht! 🎉';return p;}
function animateTo(target){const from=shown,t0=performance.now(),dur=600+(target-from)*8;function step(t){const f=Math.min(1,(t-t0)/dur),e=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2,v=from+(target-from)*e;draw(v);document.getElementById('km').textContent=Math.round(v).toLocaleString('de-DE');document.getElementById('bar').style.width=(v/TOTAL*100)+'%';if(f<1)requestAnimationFrame(step);else shown=target}requestAnimationFrame(step)}

// Spielzustand
let S;
function reset(){S={i:0,tries:3,km:0,res:[]};shown=0;reached=new Set();vehicle.textContent='📍';draw(0);document.getElementById('km').textContent='0';document.getElementById('bar').style.width='0';
  document.getElementById('log').innerHTML='';document.getElementById('final').classList.add('hidden');document.getElementById('play').classList.remove('hidden');render()}
const READ=5, ANSWER=25; let tm=null, tLeft=0, tStart=0;
function flap(node,text){const L='ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ',t0=performance.now(),D=700;let tick=0;
  (function f(t){const p=(t-t0)/D;let s='';for(let i=0;i<text.length;i++){const ch=text[i];s+=(ch===' '||p>i/text.length*0.8+0.2)?ch:L[Math.random()*L.length|0]}node.textContent=s;
    if(++tick%3===0)noise(.02,3000,2500,.05);if(p<1)requestAnimationFrame(f);else node.textContent=text})(t0)}
function stopTimer(){clearInterval(tm);tm=null}
function startCountdown(){if(!document.getElementById('start').classList.contains('hidden'))return;const cd=document.getElementById('cd'),tb=document.getElementById('tbar'),tw=document.getElementById('timer');
  stopTimer();tw.classList.remove('low');tb.style.transition='none';tb.style.transform='scaleX(1)';
  cd.classList.remove('hidden');document.getElementById('ask').classList.add('hidden');let n=READ;
  const show=()=>{cd.innerHTML=`Erst lesen, dann tippen … <b>${n}</b>`;sfx('click')};show();
  tm=setInterval(()=>{n--;if(n>0){show();return}stopTimer();cd.classList.add('hidden');const a=document.getElementById('ask');a.classList.remove('hidden');const inp=document.getElementById('in');inp.disabled=false;inp.value='';inp.focus();tStart=performance.now();
    tone(988,.15,'square',.06);tLeft=ANSWER;requestAnimationFrame(()=>{tb.style.transition=`transform ${ANSWER}s linear`;tb.style.transform='scaleX(0)'});
    tm=setInterval(()=>{tLeft--;document.getElementById('clock').textContent=`⏱ ${tLeft}s`;if(tLeft<=5){tw.classList.add('low');if(tLeft>0)tone(660,.06,'square',.05)}if(tLeft<=0){stopTimer();timeout()}},1000)},1000)}
function timeout(){const c=CATS[S.i];sfx('fail');addRow('⏰','Zug verpasst',c.q,'0 km');S.res.push('⏰');meme('⏰');showReveal({ic:'⏰',ans:'Zug verpasst',tier:'Zeit abgelaufen',quip:pick(['Der Zug ist ohne dich abgefahren.','Türen schließen selbsttätig.','Zurückbleiben, bitte!']),pctTxt:'',pct:0,km:0})}
function render(){const c=CATS[S.i];document.getElementById('catn').textContent=`Gleis ${S.i+1} · Kategorie ${S.i+1}/${CATS.length}`;document.getElementById('clock').textContent=`⏱ ${ANSWER}s`;flap(document.getElementById('catq'),c.q);document.getElementById('catx').textContent='ℹ '+c.x;
  document.getElementById('msg').textContent='';document.getElementById('reveal').classList.add('hidden');document.getElementById('timer').classList.remove('hidden');document.getElementById('in').disabled=true;startCountdown();
  document.getElementById('dots').innerHTML=CATS.map((_,j)=>`<span class="${j<S.i?'done':j===S.i?'cur':''}"></span>`).join('')}
function addRow(ic,a,s,k){const r=document.createElement('div');r.className='row';r.innerHTML=`<div class="ic">${ic}</div><div><div class="a"></div><div class="s"></div></div><div class="k">${k}</div>`;r.querySelector('.a').textContent=a;r.querySelector('.s').textContent=s;document.getElementById('log').prepend(r)}
function next(){S.i++;S.tries=3;if(S.i>=CATS.length)finish();else render()}
let busy=false;
document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();const c=CATS[S.i],inp=document.getElementById('in'),raw=inp.value;if(!raw.trim()||!tm||busy)return;
  busy=true;let r;
  try{const res=await fetch('/api/answer',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({date:ROUND.date,cat:S.i,answer:raw,playerId:PID})});r=await res.json()}catch(err){r={error:'network'}}
  busy=false;if(!tm)return; // Zeit inzwischen abgelaufen
  if(r.error){document.getElementById('msg').textContent=r.error==='round_closed'?'Diese Runde ist schon vorbei – bitte neu laden.':'Verbindung weg – nochmal versuchen.';return}
  if(!r.ok){S.tries--;const h=r.hint;
    const f=document.getElementById('f');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');
    if(S.tries<=0){sfx('fail');addRow('❌','–',c.q,'0 km');S.res.push('❌');meme('❌');showReveal({ic:'❌',ans:'Dreimal daneben',tier:'Stillstand',quip:pick(FAILQ),pctTxt:'',pct:0,km:0});return}
    sfx('wrong');document.getElementById('msg').textContent=(h?h+' ':pick(['Nee, gibt’s nicht.','Knapp daneben ist auch vorbei.','Antrag abgelehnt.','Das Faxgerät sagt nein.','Bitte in dreifacher Ausfertigung erneut einreichen.','Dafür ist das Amt nicht zuständig.'])+' ')+`Noch ${S.tries} Versuch${S.tries>1?'e':''}.`;inp.select();return}
  const t=tierOf(r.pct),el=(performance.now()-tStart)/1000;
  // Tempo: bis 5 s +10 %, bis 12 s normal, danach linear bis −20 % bei 25 s
  const f=el<=5?1.1:el<=12?1:Math.max(0.8,1-(el-12)/13*0.2), gain=Math.round(t.km*f);
  const tempo=f>1?'⚡ Blitz-Bonus +10 %':f<1?`🐌 Zu lange überlegt −${Math.round((1-f)*100)} %`:'';
  S.km+=gain;S.res.push(t.ic);
  const pct=r.pct<0.1?'< 0,1':r.pct<1?r.pct.toFixed(1).replace('.',','):Math.round(r.pct);
  addRow(t.ic,r.name,`${pct} % haben das auch gesagt · ${t.n}`,`+${gain} km`);
  sfx(t.ic);vehicle.textContent=t.ic;meme(t.ic);
  showReveal({ic:t.ic,ans:r.name,tier:t.n,quip:pick(t.q),pctTxt:`<b>${pct} %</b> haben das auch gesagt`,pct:r.pct,km:gain,tempo});
  setTimeout(()=>animateTo(Math.min(S.km,TOTAL)),450)});
function showReveal(o){stopTimer();document.getElementById('ask').classList.add('hidden');document.getElementById('cd').classList.add('hidden');document.getElementById('timer').classList.add('hidden');const r=document.getElementById('reveal');r.classList.remove('hidden');
  const last=S.i===CATS.length-1;
  r.innerHTML=`<div class="big">${o.ic}</div><div class="ans"></div><div class="tier">${o.tier}</div>`+(o.pctTxt?`<div class="pbar"><div></div></div><div class="pct">${o.pctTxt}</div>`:'')+`<div class="quip">${o.quip||''}</div>`+`<div class="plus">+${o.km} km</div>`+(o.tempo?`<div class="tempo">${o.tempo}</div>`:'')+`<button class="sec" id="nx">${last?'Ergebnis anzeigen 🏁':'Weiter →'}</button>`;
  r.querySelector('.ans').textContent=o.ans;
  const pb=r.querySelector('.pbar div');if(pb)requestAnimationFrame(()=>requestAnimationFrame(()=>pb.style.width=Math.max(1.5,Math.min(100,o.pct))+'%'));
  const nx=r.querySelector('#nx');nx.focus();nx.addEventListener('click',()=>{sfx('click');next()},{once:true});}
function finish(){stopTimer();document.getElementById('play').classList.add('hidden');document.getElementById('dots').innerHTML='';
  const km=Math.min(S.km,TOTAL),p=posAt(km);
  document.getElementById('ftitle').textContent=p.next?`${km.toLocaleString('de-DE')} km – bis kurz vor ${p.next}!`:'Frankfurt erreicht – Ziel geschafft! 🎉';
  document.getElementById('fsub').textContent=p.next?`Zuletzt erreicht: ${p.last}. Morgen gibt es eine neue Runde.`:'Die ganze Strecke in einer Runde. Respekt!';
  const txt=`Raritour #${ROUND.number} 🇩🇪\n${S.res.join('')}\n${km.toLocaleString('de-DE')} / ${TOTAL.toLocaleString('de-DE')} km · ${p.next?'bis '+p.last:'Ziel erreicht 🏁'}`;
  document.getElementById('share').textContent=txt;document.getElementById('final').classList.remove('hidden');document.getElementById('reveal').classList.add('hidden');
  setTimeout(()=>{sfx('fanfare');if(km>=TOTAL*0.4)confetti()},500);
  try{localStorage.setItem('raritour-played',JSON.stringify({date:ROUND.date,km,res:S.res,log:document.getElementById('log').innerHTML}))}catch(e){}
  startNextRoundClock()}
function startNextRoundClock(){const n=document.getElementById('nextround');const up=()=>{const now=new Date();const b=new Date(now.toLocaleString('en-US',{timeZone:'Europe/Berlin'}));const s=Math.max(0,Math.floor((24*3600)-(b.getHours()*3600+b.getMinutes()*60+b.getSeconds())));n.textContent=`Nächste Runde in ${String(s/3600|0).padStart(2,'0')}:${String(s%3600/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};up();setInterval(up,1000)}
document.getElementById('copy').addEventListener('click',async()=>{const m=document.getElementById('cmsg');try{await navigator.clipboard.writeText(document.getElementById('share').textContent);m.textContent='Kopiert – ab in die WhatsApp-Gruppe!'}catch(e){m.textContent='Kopieren nicht erlaubt – bitte Text markieren und kopieren.'}});

document.getElementById('sroute').innerHTML=C.map((c,i)=>`<span style="animation-delay:${i*60}ms">${c.n}</span>`).join('');
document.getElementById('go').addEventListener('click',()=>{ac();sfx('fanfare');document.getElementById('start').classList.add('hidden');reset()});
document.getElementById('dayno').textContent='Runde '+ROUND.number;
// Heute schon gespielt? Dann Ergebnis zeigen statt neuer Runde (?dev erlaubt Wiederholen)
let played=null;try{played=JSON.parse(localStorage.getItem('raritour-played')||'null')}catch(e){}
if(played&&played.date===ROUND.date&&!location.search.includes('dev')){
  document.getElementById('start').classList.add('hidden');S={i:CATS.length,tries:0,km:played.km,res:played.res};shown=played.km;draw(played.km);
  document.getElementById('km').textContent=Math.round(played.km).toLocaleString('de-DE');document.getElementById('bar').style.width=(played.km/TOTAL*100)+'%';
  document.getElementById('log').innerHTML=played.log||'';camMode='all';camA.classList.add('on');camF.classList.remove('on');
  document.getElementById('play').classList.add('hidden');document.getElementById('timer').classList.add('hidden');
  const p=posAt(played.km);document.getElementById('ftitle').textContent='Heute schon gereist!';document.getElementById('fsub').textContent=`${Math.round(played.km).toLocaleString('de-DE')} km – zuletzt in ${p.last}. Morgen gibt’s eine neue Runde.`;
  document.getElementById('share').textContent=`Raritour #${ROUND.number} 🇩🇪\n${played.res.join('')}\n${Math.round(played.km).toLocaleString('de-DE')} / ${TOTAL.toLocaleString('de-DE')} km`;
  document.getElementById('final').classList.remove('hidden');startNextRoundClock();
}else reset();

}
