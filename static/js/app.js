

let SIM=null;




const LEVELS=[[0,'Beginner'],[60,'Explorer'],[160,'Chatty'],[320,'Conversational']];
let S={xp:0,learned:{},streak:0,last:'',badges:{}},tab='learn',les='greet';
try{const j=JSON.parse(localStorage.getItem('kfe')||'null');if(j)S=Object.assign(S,j)}catch(e){}
const save=()=>{try{localStorage.setItem('kfe',JSON.stringify(S))}catch(e){}};
const today=new Date().toDateString();
if(S.last!==today){const y=new Date(Date.now()-864e5).toDateString();S.streak=S.last===y?S.streak+1:1;S.last=today;save()}
const $=s=>document.querySelector(s);
const total=LESSONS.reduce((a,l)=>a+l.p.length,0);
const nLearned=()=>Object.keys(S.learned).length;
const lvl=()=>[...LEVELS].reverse().find(l=>S.xp>=l[0])[1];
function award(n){S.xp+=n;if(nLearned()>=1)S.badges.first=1;if(nLearned()>=10)S.badges.ten=1;if(S.badges.sim)S.badges.talk=1;save();stats()}
function stats(){$('#stats').innerHTML=`<span>${S.streak}-day streak</span><span>${S.xp} XP</span><span>${lvl()}</span>`}

let voices=[];const loadV=()=>{voices=speechSynthesis.getVoices()};
if('speechSynthesis' in window){loadV();speechSynthesis.onvoiceschanged=loadV}
const hasKn=()=>voices.some(v=>v.lang.toLowerCase().startsWith('kn'));
function speak(t,slow){if(!('speechSynthesis' in window))return false;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='kn-IN';const v=voices.find(v=>v.lang.toLowerCase().startsWith('kn'));if(v)u.voice=v;u.rate=slow?.5:.9;speechSynthesis.speak(u);return true}
$('#demo').onclick=()=>speak('ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?');

function lev(a,b){const m=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
const norm=s=>s.replace(/[\s?.!,]/g,'');
const score=(a,b)=>{a=norm(a);b=norm(b);return Math.round(100*(1-lev(a,b)/Math.max(a.length,b.length,1)))};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

const TABS=[['learn','Situations'],['explore','Explore Karnataka'],['kmap','Karnataka map'],['talk','Conversations'],['ai','AI partner'],['words','Vocabulary'],['path','Guided practice'],['quiz','Quiz'],['tips','Local tips'],['me','Progress'],['about','About']];
function tabs(){$('#tabs').innerHTML=TABS.map(t=>`<button role="tab" aria-selected="${tab===t[0]}" data-t="${t[0]}">${t[1]}</button>`).join('');
 document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;tabs();render()})}
function render(){({learn,explore,kmap,talk,ai,words,path,quiz,tips,me,about})[tab]()}

function learn(){
 const L=LESSONS.find(l=>l.id===les);
 const warn=('speechSynthesis' in window)?(hasKn()?'':'<div class="notice">No Kannada voice found on this device. Audio may sound off. Install a Kannada voice in your system’s text-to-speech settings for best results.</div>'):'<div class="notice">Audio is not supported in this browser.</div>';
 $('#view').innerHTML=warn+how()+`<div class="chips">${LESSONS.map(l=>`<button class="chip" aria-pressed="${l.id===les}" data-l="${l.id}">${l.name}</button>`).join('')}</div>`+
 L.p.map((p,i)=>`<div class="card ph" data-i="${i}"><div><div class="k kn">${p[0]}</div><div class="r">${p[1]}</div><div class="e">${p[2]}</div></div>
 <div class="acts"><button class="btn" data-a="play" aria-label="Hear ${p[2]}">Hear it</button><button class="btn" data-a="slow">Slow</button><button class="btn" data-a="say">Say it</button><button class="btn ${S.learned[L.id+i]?'on':''}" data-a="got">${S.learned[L.id+i]?'✓ Learned':'Mark learned'}</button></div><div class="msg" aria-live="polite"></div></div>`).join('');
 $('#sc').onchange=e=>{S.nk=!e.target.checked;save();document.body.classList.toggle('nk',S.nk)};
 document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{les=c.dataset.l;learn()});
 document.querySelectorAll('.ph .btn').forEach(b=>b.onclick=()=>{
  const card=b.closest('.ph'),i=+card.dataset.i,p=L.p[i],m=card.querySelector('.msg');
  if(b.dataset.a==='play'||b.dataset.a==='slow'){mark('listen');if(!speak(p[0],b.dataset.a==='slow'))m.textContent='Audio is not available here. Read the romanized version aloud.'}
  else if(b.dataset.a==='got'){const k=L.id+i;if(S.learned[k]){delete S.learned[k]}else{S.learned[k]=1;award(5)}save();learn()}
  else{
   if(!SR){m.textContent='Speech check is not supported in this browser (try Chrome). Say it aloud, then compare with the audio.';return}
   const r=new SR();r.lang='kn-IN';r.interimResults=false;m.textContent='Listening… say the phrase.';
   r.onresult=e=>{mark('speak');const h=e.results[0][0].transcript,s=score(h,p[0]);m.innerHTML=`Heard: <b class="kn">${h}</b> · Match <b class="${s>=70?'good':'bad'}">${s}%</b> ${s>=70?'Great pronunciation! +5 XP':'Play it slowly and try again.'}`;if(s>=70)award(5)};
   r.onerror=()=>{m.textContent='Could not hear you. Check microphone permission and try again.'};r.start()}
 })}

let st={n:0,pts:0,log:[]};
function talk(){
 const v=$('#view');
 if(!SIM){v.innerHTML=`<h2>Pick a conversation</h2><p>Choose a real-life chat. The other person speaks Kannada; you choose how to reply.</p>`+SC.map((s,i)=>`<button class="opt" data-i="${i}"><b>${s[0]}</b><br><small>${s[1]}</small></button>`).join('');document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{SIM=SC[+b.dataset.i][2];STT=SC[+b.dataset.i][0];st={n:0,pts:0,log:[]};talk()});return}
 if(st.n>=SIM.length){const max=SIM.length*2,great=st.pts>=max-1;
  mark('talk');if(!S.badges.sim){S.badges.sim=1}award(20+st.pts*5);
  v.innerHTML=`<div class="card"><h2>${great?'Fair fare. Well done!':'Conversation finished'}</h2><p>You scored <b>${st.pts}/${max}</b> and earned ${20+st.pts*5} XP.</p><p>${great?'Locals would nod at that bargaining.':'Replay and aim for the polite, firm replies.'}</p><button class="btn pri" id="again">Ride again</button></div>`;
  $('#again').onclick=()=>{SIM=null;talk()};return}
 const n=SIM[st.n];
 v.innerHTML=`<h2>${STT}</h2><div class="bar"><i style="width:${st.n/SIM.length*100}%"></i></div>`+
 st.log.map(l=>`<div class="bub u"><span class="kn">${l[0]}</span><br><small>${l[1]}</small></div><div class="msg">${l[2]}</div>`).join('')+
 `<div class="bub d"><span class="kn" style="font-size:20px">${n.d[0]}</span><br><b>${n.d[1]}</b><br><small>${n.d[2]}</small><br><button class="btn" id="hd">Hear the driver</button></div><p><b>Your reply:</b></p>`+
 n.o.map((o,i)=>`<button class="opt" data-i="${i}"><span class="kn" style="font-size:19px">${o[0]}</span><br><span class="r" style="color:var(--red);font-weight:700">${o[1]}</span></button>`).join('');
 speak(n.d[0]);$('#hd').onclick=()=>speak(n.d[0]);
 document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const o=n.o[+b.dataset.i];st.pts+=o[2];st.log.push([o[0],o[1],(o[2]==2?'<span class="good">Great.</span> ':o[2]==1?'<span>Okay. </span>':'<span class="bad">Oops. </span>')+o[3]]);speak(o[0]);st.n++;talk()})}

let qz=null;
function quiz(){
 if(!qz){const all=LESSONS.flatMap(l=>l.p);const pick=[...all].sort(()=>Math.random()-.5).slice(0,6);qz={i:0,s:0,q:pick,all}}
 const v=$('#view');
 if(qz.i>=qz.q.length){mark('quiz');award(qz.s*4);v.innerHTML=`<div class="card"><h2>Quiz done: ${qz.s}/${qz.q.length}</h2><p>+${qz.s*4} XP</p><button class="btn pri" id="rq">New quiz</button></div>`;$('#rq').onclick=()=>{qz=null;quiz()};return}
 const q=qz.q[qz.i],wrong=qz.all.filter(x=>x!==q).sort(()=>Math.random()-.5).slice(0,3),opts=[q,...wrong].sort(()=>Math.random()-.5);
 v.innerHTML=`<div class="bar"><i style="width:${qz.i/qz.q.length*100}%"></i></div><div class="card"><p>How do you say:</p><h2>${q[2]}</h2><p><button class="btn" id="qh">Hear the answer</button></p></div>`+opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="kn" style="font-size:19px">${o[0]}</span> · ${o[1]}</button>`).join('')+'<div class="msg" id="qm" aria-live="polite"></div>';
 $('#qh').onclick=()=>speak(q[0]);
 document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const ok=opts[+b.dataset.i]===q;if(ok)qz.s++;speak(q[0]);$('#qm').innerHTML=ok?'<span class="good">Correct!</span>':`<span class="bad">Not quite.</span> Answer: ${q[1]}`;document.querySelectorAll('.opt').forEach(x=>x.disabled=true);setTimeout(()=>{qz.i++;quiz()},1300)})}

function tips(){$('#view').innerHTML=TIPS.map(t=>`<div class="card tip"><h3>${t[0]}</h3><div>${t[1]}</div></div>`).join('')}

function me(){
 const nx=LEVELS.find(l=>l[0]>S.xp),B=[['first','First phrase'],['ten','10 phrases'],['talk','Auto negotiator'],['week','7-day streak']];if(S.streak>=7)S.badges.week=1;
 $('#view').innerHTML=`<div class="card"><h2>${lvl()}</h2><p>${nLearned()} of ${total} phrases learned. ${nx?(nx[0]-S.xp)+' XP to '+nx[1]+'.':'Top level reached!'}</p><div class="bar"><i style="width:${nLearned()/total*100}%"></i></div></div>
 <h3>Badges</h3><div class="badges">${B.map(b=>`<span class="badge ${S.badges[b[0]]?'got':''}">${b[1]}</span>`).join('')}</div>
 <p style="margin-top:24px"><button class="btn" id="rs">Reset progress</button></p>`;
 $('#rs').onclick=()=>{if(confirm('Reset all progress?')){S={xp:0,learned:{},streak:1,last:today,badges:{}};save();stats();me()}}}
function mark(k){if(!S.did||S.did.day!==today)S.did={day:today};S.did[k]=1;save()}
const SC=[['Bargain with an auto driver','Ask for a ride, push for the meter, and stop where you want.',SIMA],['Order at a café','Order a dosa, ask for less spice, and ask for the bill.',SIMR],['Buy vegetables at the market','Ask the price, bargain politely, and say how much you want.',SIMM],['See a doctor','Describe a fever or headache and confirm the instructions. Language practice only, not medical advice.',SIMD]];
let STT='',fc=null;
function words(){
 const c0=LESSONS.flatMap(l=>l.p);
 if(!fc)fc={i:0,f:false,k:0,o:[...c0].sort(()=>Math.random()-.5)};
 if(fc.i>=fc.o.length)fc.i=0;
 const c=fc.o[fc.i];
 $('#view').innerHTML=`<h2>Vocabulary</h2><p>Tap the card to flip it. Cards you miss come back sooner.</p><button class="flash" id="fl" aria-live="polite">${fc.f?`<span class="kn big">${c[0]}</span><b class="r">${c[1]}</b><small>${c[2]}</small>`:`<span class="big">${c[2]}</span><small>How do you say this in Kannada?</small>`}</button><div class="acts mid"><button class="btn" id="fh">Hear it</button><button class="btn" id="fa">Again soon</button><button class="btn pri" id="fk">Got it (+2 XP)</button></div><p style="text-align:center;color:var(--mute)">Cards mastered this session: ${fc.k}</p>`;
 $('#fl').onclick=()=>{fc.f=!fc.f;words()};
 $('#fh').onclick=()=>{mark('words');speak(c[0])};
 $('#fa').onclick=()=>{fc.o.splice(Math.min(fc.i+4,fc.o.length),0,c);fc.i++;fc.f=false;words()};
 $('#fk').onclick=()=>{fc.k++;if(fc.k>=5)mark('words');award(2);fc.i++;fc.f=false;words()}}
function path(){
 const d=S.did&&S.did.day===today?S.did:{};
 const P=[['listen','Listen','Play a few phrases and hear how Kannada sounds.','learn'],['speak','Repeat','Say a phrase aloud and check your match score.','learn'],['talk','Converse','Finish one role-play conversation.','talk'],['words','Revise','Master 5 vocabulary cards.','words'],['quiz','Test yourself','Finish a six-question quiz.','quiz']];
 const n=P.filter(s=>d[s[0]]).length;
 $('#view').innerHTML=`<h2>Today’s guided practice</h2><p>Five steps, about ten minutes: listen, repeat, converse, revise, test.</p><div class="bar"><i style="width:${n/5*100}%"></i></div>`+P.map((s,i)=>`<div class="card step ${d[s[0]]?'done':''}"><span class="num">${d[s[0]]?'✓':i+1}</span><div><h3>${s[1]}</h3><div>${s[2]}</div></div><button class="btn ${d[s[0]]?'':'pri'}" data-go="${s[3]}">${d[s[0]]?'Again':'Start'}</button></div>`).join('')+(n===5?'<div class="notice">All five steps done. Come back tomorrow to keep your streak alive.</div>':'');
 document.querySelectorAll('.step .btn').forEach(b=>b.onclick=()=>{tab=b.dataset.go;tabs();render()})}
document.querySelectorAll('.pillars button').forEach(b=>b.onclick=()=>{tab=b.dataset.go;tabs();render();$('#tabs').scrollIntoView({block:'start'})});
function how(){return `<div class="how"><ol><li>Pick a situation below.</li><li>Press <b>Hear it</b>, then <b>Say it</b>.</li><li>Press <b>Mark learned</b> when it feels easy.</li></ol><details><summary>How to read the spellings</summary><div class="gl"><span><b>a</b> as in <i>but</i></span><span><b>aa</b> as in <i>father</i></span><span><b>i</b> as in <i>sit</i></span><span><b>ee</b> as in <i>feel</i></span><span><b>u</b> as in <i>put</i></span><span><b>oo</b> as in <i>moon</i></span><span><b>e</b> as in <i>bed</i></span><span><b>o</b> as in <i>go</i></span></div><p>Say every syllable evenly. A final <b>e</b> is always sounded: <i>dose</i> is “do-seh”.</p></details><label class="tg"><input type="checkbox" id="sc" ${S.nk?'':'checked'}> Show Kannada script</label></div>`}
function about(){$('#view').innerHTML=`<h2>About this project</h2><div class="card"><h3>The problem</h3><p>People move to Karnataka for work and study, but most language apps teach formal grammar. Newcomers still struggle at the auto stand, the market and the café.</p></div><div class="card"><h3>Our approach</h3><p>Learn the phrase you need today. Hear it, say it, use it in a conversation, and review it until it sticks. Romanized spellings and English meanings mean no reading skills are needed.</p></div><div class="card"><h3>Who it is for</h3><p>New residents, students, tourists, and families who want to reconnect with Kannada.</p></div><div class="card"><h3>What is next</h3><p>Live now: an AI conversation partner. Next: recorded audio from native speakers, an offline mode so the website works without internet, and more languages such as Tamil, Telugu and Marathi.</p></div>`}
const POD=LESSONS.flatMap(l=>l.p)[Math.floor(Date.now()/864e5)%total];
$('#pk').textContent=POD[0];$('#pr').textContent=POD[1]+' · '+POD[2];
$('#demo').onclick=()=>{mark('listen');speak(POD[0])};
document.body.classList.toggle('nk',!!S.nk);
let chat=[],busy=false;
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

function localAns(t){const lt=t.toLowerCase();const pm=[...PL.map(p=>[p.n,p.h]),...TP.map(p=>[p[0],p[3]])].find(p=>{const w=p[0].toLowerCase().split(/[^a-z]+/).filter(x=>x.length>3)[0];return w&&new RegExp('(^|[^a-z])'+w+'([^a-z]|$)').test(lt)});if(/bangal|bengal|banglo/.test(lt))return 'ANS: In Bengaluru, start with Lalbagh garden, Cubbon Park, the Vidhana Soudha and Bengaluru Palace. Use the metro to avoid traffic.\nKN: ಮೆಟ್ರೋ ಸ್ಟೇಷನ್ ಎಲ್ಲಿದೆ?\nRO: Metro station ellide?\nEN: Where is the metro station?';if(/eat|food|dish|hungry/.test(lt))return 'ANS: Try masala dosa, bisi bele bath, ragi mudde and filter coffee. In Mysuru, do not miss Mysore pak.\nKN: ಒಂದು ಮಸಾಲೆ ದೋಸೆ ಕೊಡಿ\nRO: Ondu masale dose kodi\nEN: One masala dosa, please';if(pm)return 'ANS: '+pm[1];if(/best|famous|visit|place|trip/.test(lt))return 'ANS: Good first choices are Hampi for ancient ruins, Mysuru for palaces, Coorg for coffee hills and Gokarna for beaches. Open the Explore Karnataka tab for details.\nKN: ನಾನು ಇಲ್ಲಿಗೆ ಹೋಗಬೇಕು\nRO: Naanu illige hogabeku\nEN: I want to go here';const w=t.toLowerCase().split(/\W+/).filter(x=>x.length>3);const hit=LESSONS.flatMap(l=>l.p).filter(p=>w.some(x=>p[2].toLowerCase().includes(x)||p[1].toLowerCase().includes(x))).slice(0,2);return hit.length?hit.map(p=>'KN: '+p[0]+'\nRO: '+p[1]+'\nEN: '+p[2]).join('\n'):'KN: ನಮಸ್ಕಾರ\nRO: Namaskara\nEN: Hello\nTIP: Try the phrases in Situations while the AI partner is offline.'}
function fmt(t,i){let o='',kn='';t.split('\n').forEach(l=>{const m=l.match(/^(ANS|KN|RO|EN|TIP):\s*(.*)/);if(!m)return;const v=esc(m[2]);if(m[1]==='ANS'){o+=`<div class='ans'>${v}</div>`}else if(m[1]==='KN'){kn=m[2];o+=`<div class='kn k'>${v}</div>`}else if(m[1]==='RO')o+=`<div class='r2'>${v}</div>`;else if(m[1]==='EN')o+=`<div>${v}</div>`;else o+=`<small class='tp'>Tip: ${v}</small>`});return o?o+(kn?`<br><button class='btn' data-h='${i}'>Hear it</button>`:''):esc(t)}
function draw(){const L=$('#log');if(!L)return;L.innerHTML=chat.map((m,i)=>m.r==='user'?`<div class='bub u'>${esc(m.t)}</div>`:`<div class='bub d ai-r'>${fmt(m.t,i)}</div>`).join('');if(L.lastElementChild)L.lastElementChild.scrollIntoView({block:'nearest'})}
async function send(t){t=t.trim();if(busy||!t)return;const inp=$('#in');if(inp)inp.value='';chat.push({r:'user',t});const cur={r:'assistant',t:''};chat.push(cur);busy=true;const g0=$('#go');if(g0)g0.disabled=true;draw();const am=$('#am')||{};am.textContent='Thinking…';
 try{const sample=async(msgs,o)=>{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs})});if(!r.ok)throw {code:r.status===429?'rate_limited':r.status===503?'nokey':'none'};const rd=r.body.getReader(),dc=new TextDecoder();let t='';for(;;){const x=await rd.read();if(x.done)break;t+=dc.decode(x.value,{stream:true});o.onText({text:t})}if(!t.trim())throw {code:'none'}};
  let h=chat.slice(0,-1).slice(-7);while(h.length&&h[0].r!=='user')h.shift();
  const msgs=h.map((m,i)=>({role:m.r,content:m.t}));
  await sample(msgs,{modelTier:'quick',cache:false,onText:({text})=>{cur.t=text;am.textContent='';draw()}});
  award(3);mark('talk')}
 catch(e){cur.t=localAns(t);draw();am.textContent=e&&e.code==='rate_limited'?'Too many questions at once. Showing a built-in answer. Try again in a moment.':e&&e.code==='nokey'?'AI key not set. Add ANTHROPIC_API_KEY to the .env file and restart the server. Showing a built-in answer.':'The AI partner is not available here, so this is a built-in answer.'}
 busy=false;const g=$('#go');if(g)g.disabled=false}


(()=>{const h=document.querySelector('.hero'),rb=document.createElement('div'),w=document.createElement('div');rb.className='redband';w.className='wrap';[...h.children].slice(1).forEach(c=>w.appendChild(c));rb.appendChild(w);document.querySelector('header').appendChild(rb)})();


const ART={temple:'<path d="M110 110V70h80v40zM120 70V52h60v18zM130 52V38h40v14zM140 38V26h20v12z"/><path d="M148 26l2-10 2 10z"/>',heritage:'<path d="M60 110V72h180v38z"/><path d="M110 72a40 40 0 0 1 80 0z"/><path d="M60 72V50h12v22zM228 72V50h12v22z"/>',hill:'<path d="M0 110L70 40l50 50 50-60 80 80z"/><path d="M180 110l60-50 60 50z" opacity=".6"/>',beach:'<circle cx="220" cy="40" r="18"/><path d="M0 95q25-12 50 0t50 0 50 0 50 0 50 0 50 0v25H0z"/>',falls:'<path d="M0 110V50l90-14 40 20v54z"/><path d="M150 36h20v76h-20z" opacity=".45"/><path d="M180 50l120-14v74H180z"/>',wild:'<path d="M80 110V70h8v40zM84 30l-30 50h60zM84 50l-36 40h72z"/><path d="M220 110V76h8v34zM224 40l-26 44h52z"/>'};
function art(c,i){const hues=['#FDE9A9','#F9C6C3','#CDE7E1','#D9D2F0','#FAD9B5'];return `<svg class='art' viewBox='0 0 300 120' role='img' aria-label='${LB[c]} illustration' preserveAspectRatio='xMidYMid slice'><rect width='300' height='120' fill='${hues[i%5]}'/><g fill='#22190F' opacity='.8'>${ART[c]}</g></svg>`}

let tf='all';
function tpHTML(){const F=['all',...Object.keys(LB)];return `<h3 style='margin:26px 0 10px'>More places across Karnataka</h3><div class='chips'>${F.map(f=>`<button class='chip' aria-pressed='${tf===f}' data-tf='${f}'>${f==='all'?'All':LB[f]}</button>`).join('')}</div><div class='tpg'>${TP.map((p,i)=>[p,i]).filter(x=>tf==='all'||x[0][2]===tf).map(x=>`<div class='card tpc'>${art(x[0][2],x[1])}<h3>${x[0][0]}</h3><span class='tag'>${x[0][1]} · ${LB[x[0][2]]}</span><p>${x[0][3]}</p><button class='btn' data-ta='${x[1]}'>Phrases for this place</button></div>`).join('')}</div>`}
let pf='all';
function explore(){
 const F=[['all','All places'],['king','Kings and empires'],['temple','Temples and sacred sites'],['city','Cities and culture']];
 $('#view').innerHTML=`<h2>Explore Karnataka</h2><p>Learn the story of a place, then the Kannada you need when you get there.</p><div class='how'><b>Did you know?</b> Kannada is a classical language of India. Karnataka was formed on 1 November 1956, and that day is celebrated every year as Kannada Rajyotsava.</div><div class='chips'>${F.map(f=>`<button class='chip' aria-pressed='${pf===f[0]}' data-pf='${f[0]}'>${f[1]}</button>`).join('')}</div>`+PL.filter(p=>pf==='all'||p.t===pf).map(p=>`<div class='card place'>${art(AK[PL.indexOf(p)],PL.indexOf(p))}<div class='pt'><h3>${p.n}</h3><span class='tag'>${p.r} · ${p.e}</span></div><p>${p.h}</p><p><b>Why go:</b> ${p.w}</p><div class='ph'><div><div class='k kn'>${p.k[0]}</div><div class='r'>${p.k[1]}</div><div class='e'>${p.k[2]}</div></div><div class='acts'><button class='btn' data-pl='${PL.indexOf(p)}'>Hear it</button><button class='btn pri' data-pa='${PL.indexOf(p)}'>Practise with AI</button></div></div></div>`).join('')+tpHTML()+`<h3 style='margin:26px 0 10px'>Festivals and food</h3>`+FE.map((p,i)=>`<div class='card ph'><div><div class='k kn'>${p[0]}</div><div class='r'>${p[1]}</div><div class='e'>${p[2]}</div></div><div class='acts'><button class='btn' data-fe='${i}'>Hear it</button></div></div>`).join('');
 $('#view').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;if(d.pf){pf=d.pf;explore()}else if(d.tf){tf=d.tf;explore()}else if(d.ta!==undefined){tab='ai';tabs();render();send('Teach me two Kannada phrases for visiting '+TP[+d.ta][0])}else if(d.pl!==undefined)speak(PL[+d.pl].k[0]);else if(d.fe!==undefined)speak(FE[+d.fe][0]);else if(d.pa!==undefined){tab='ai';tabs();render();send('Teach me four useful Kannada phrases for visiting '+PL[+d.pa].n)}}}



let kd=-1;
function kmap(){
 const d=kd>=0?KD[kd]:null;
 $('#view').innerHTML=`<h2>Karnataka map</h2><p>Tap a district to see what it is famous for. This is a simple tile map: each tile sits roughly where the district is. North is at the top and the Arabian Sea is on the left.</p><div class='card' id='kdp' aria-live='polite'>${d?`<h3>${d[0]} <span class='tag'>${RG[d[4]][0]}</span></h3><ul class='kl'>${d[5].map(x=>`<li>${x}</li>`).join('')}</ul><button class='btn pri' data-kp='${kd}'>Phrases for ${d[0]}</button>`:`<b>Tap any tile to begin.</b> Try Hassan, Mysuru or Uttara Kannada.`}</div><div class='kgrid'>${KD.map((x,i)=>`<button class='kt' style='grid-column:${x[2]+1};grid-row:${x[3]+1};background:${RG[x[4]][1]}' aria-pressed='${i===kd}' data-kd='${i}' aria-label='${x[0]} district'>${x[1]}</button>`).join('')}</div><div class='klg'>${Object.values(RG).map(r=>`<span><i style='background:${r[1]}'></i>${r[0]}</span>`).join('')}</div>`;
 $('#view').onclick=e=>{const b=e.target.closest('button');if(!b)return;const q=b.dataset;if(q.kd!==undefined){kd=+q.kd;kmap();$('#kdp').scrollIntoView({block:'nearest',behavior:'smooth'})}else if(q.kp!==undefined){tab='ai';tabs();render();send('Teach me two Kannada phrases for visiting '+KD[+q.kp][0]+' district')}}}
function ai(){$('#view').innerHTML=`<h2>AI conversation partner</h2><p>Ask me anything about Kannada, Karnataka, travel or daily life. I answer in English first, then teach you a useful Kannada phrase.</p><div class='chips'>${['Which is the best place to visit in Karnataka?','What should I eat in Mysuru?','How do I say I am lost?','Let us practise buying vegetables'].map(s=>`<button class='chip' data-s='${s}'>${s}</button>`).join('')}</div><div id='log' aria-live='polite'></div><div class='ask'><input id='in' placeholder='Type your question…' autocomplete='off' aria-label='Message'><button class='btn pri' id='go'>Send</button></div><div class='msg' id='am'></div>`;
 draw();$('#go').onclick=()=>send($('#in').value);$('#in').onkeydown=e=>{if(e.key==='Enter')send(e.target.value)};
 document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>send(b.dataset.s));
 $('#log').onclick=e=>{const b=e.target.closest('[data-h]');if(b){const m=chat[+b.dataset.h].t.match(/KN:\s*(.*)/);if(m)speak(m[1])}}}

const sb=document.createElement('button');sb.className='sos';sb.textContent='Quick phrases';sb.setAttribute('aria-label','Open quick survival phrases');
const sp=document.createElement('div');sp.className='sosp';sp.hidden=true;
sp.innerHTML='<h3>Show this screen to someone, or tap to hear</h3>'+SOS.map((p,i)=>`<button data-i="${i}"><span class="kn">${p[0]}</span><small>${p[1]} · ${p[2]}</small></button>`).join('');
sb.onclick=()=>{sp.hidden=!sp.hidden};
sp.onclick=e=>{const b=e.target.closest('button');if(b)speak(SOS[+b.dataset.i][0])};
document.body.append(sp,sb);
stats();tabs();render();
