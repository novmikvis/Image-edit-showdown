(()=>{
const DATA=window.BENCH_DATA;
const edit=DATA.mode==='edit', $=s=>document.querySelector(s);
const variantList=[...(edit?[['source','Original']]:[]),['fibo_raw','Fibo 2 · plain'],['fibo_enhanced','Fibo 2 · enhanced'],['klein_raw','Klein 9b · plain'],['klein_enhanced','Klein 9b · enhanced'],['qwen_raw','Qwen 2.1 · plain'],['qwen_enhanced','Qwen 2.1 · enhanced']];
let row=0,variant=edit?1:0,scale=1,panX=0,panY=0,holding=false,gridMode=false,priorGrid=false,renderToken=0,ready=false;
const pointers=new Map();let pinchDistance=0;
const stage=$('#stage'),viewer=$('#viewer'),canvas=$('#canvas');
const identityOverlay=document.createElement('div');identityOverlay.className='identity-overlay';identityOverlay.hidden=true;identityOverlay.setAttribute('aria-label','Identity references');viewer.append(identityOverlay);
function current(){return DATA.cases[row]}
function key(){return variantList[variant][0]}
function record(k){return k==='source'?current().original:current().outputs[k]}
function pair(){return edit?'source':key().replace(/_(raw|enhanced)$/,(_,s)=>s==='raw'?'_enhanced':'_raw')}
function label(k){return variantList.find(v=>v[0]===k)?.[1]||'Original'}
function picture(rec,alt,lazy=false){
 const p=document.createElement('picture'),source=document.createElement('source'),img=document.createElement('img');
 source.type='image/webp';source.srcset=rec.image+'.webp';img.src=rec.image+'.webp';img.alt=alt;img.width=rec.size[0];img.height=rec.size[1];img.draggable=false;img.decoding='async';if(lazy)img.loading='lazy';p.append(source,img);return p;
}
function transform(){canvas.style.transform=`translate(${panX}px,${panY}px) scale(${scale})`;viewer.classList.toggle('zoomed',scale>1);$('#fit').textContent=scale===1?'Fit':Math.round(scale*100)+'%'}
function fit(){scale=1;panX=panY=0;transform()}
function zoom(factor,x,y){const old=scale;scale=Math.max(1,Math.min(8,scale*factor));if(x!==undefined){const r=viewer.getBoundingClientRect(),cx=x-r.left-r.width/2,cy=y-r.top-r.height/2;panX=cx-(cx-panX)*scale/old;panY=cy-(cy-panY)*scale/old}if(scale===1){panX=panY=0}transform()}
function updateHold(){viewer.classList.toggle('revealing',holding);$('#hold').setAttribute('aria-pressed',String(holding));$('#imageLabel').textContent=label(holding?pair():key())}
function beginHold(){if(holding||!ready||edit&&key()==='source')return;holding=true;priorGrid=gridMode;if(gridMode){$('#grid').hidden=true;canvas.hidden=false;$('#imageLabel').hidden=false}updateHold()}
function releaseHold(){if(!holding)return;holding=false;if(priorGrid){$('#grid').hidden=false;canvas.hidden=true;$('#imageLabel').hidden=true}updateHold()}
function focusStage(){stage.focus({preventScroll:true})}
function setGrid(on){releaseHold();gridMode=on;if(on)renderGrid();$('#grid').hidden=!on;canvas.hidden=on;$('#imageLabel').hidden=on;$('#gridToggle').textContent=on?'Single image':'Grid';$('#gridToggle').setAttribute('aria-pressed',String(on))}
function renderGrid(){
 const grid=$('#grid');if(grid.dataset.scene===current().id)return;grid.dataset.scene=current().id;grid.replaceChildren();for(const [k,name] of variantList){const f=document.createElement('figure'),b=document.createElement('button'),caption=document.createElement('figcaption');b.setAttribute('aria-label','View '+name);b.append(picture(record(k),current().title+' — '+name,true));b.onclick=()=>{variant=variantList.findIndex(v=>v[0]===k);setGrid(false);render();focusStage()};caption.textContent=name;f.append(b,caption);grid.append(f)}
}
function renderDetails(){
 const c=current(),r=record(key());$('#detailTitle').textContent=c.title;$('#detailSummary').textContent=c.summary;$('#rawPrompt').textContent=c.rawPrompt;
 $('#selectedPrompt').textContent=r.prompt||c.rawPrompt;$('#promptTitle').textContent=key()==='source'?'Edit request':label(key())+' · executed prompt';
 $('#facts').textContent=key()==='source'?`${r.size.join(' × ')} · shared editing input`:`${r.model} · ${r.size.join(' × ')} · seed ${r.seed} · ${r.steps} steps · CFG ${r.cfg} · one attempt`;
 $('#downloadWorkflow').hidden=!r.workflow;if(r.workflow){$('#downloadWorkflow').href=r.workflow;$('#downloadWorkflow').download=r.workflow.split('/').pop()}
 $('#sourceCredit').hidden=!edit;if(edit){$('#sourceCredit').href=c.sourceUrl;$('#sourceCredit').textContent=c.sourceLabel||'Image-editing benchmark source ↗'}
 const refs=$('#identityReferences');if(refs){refs.replaceChildren();refs.hidden=!c.references?.length;if(c.references?.length){const heading=document.createElement('h3');heading.textContent='Identity references';refs.append(heading);const list=document.createElement('div');list.className='reference-list';for(const [i,ref] of c.references.entries()){const figure=document.createElement('figure'),caption=document.createElement('figcaption');figure.append(picture(ref,'Identity reference, image '+(i+2),true));caption.textContent='Image '+(i+2)+' · identity only';figure.append(caption);list.append(figure)}refs.append(list)}}
}
function renderIdentityOverlay(){
 const refs=edit?current().references:[];identityOverlay.replaceChildren();identityOverlay.hidden=!refs?.length;
 for(const [i,ref] of (refs||[]).entries()){const figure=document.createElement('figure'),caption=document.createElement('figcaption');figure.append(picture(ref,'Identity reference, image '+(i+2)));caption.textContent='Image '+(i+2);figure.append(caption);identityOverlay.append(figure)}
}
async function render(reset=false){
 const ticket=++renderToken,c=current();if($('#fiboNotice'))$('#fiboNotice').hidden=!key().startsWith('fibo_');ready=false;$('#hold').disabled=true;$('#loading').hidden=false;$('#loading').textContent='Loading image';
 $('#caseSelect').value=String(row);$('#sceneTitle').textContent=c.title;$('#sceneBreaker').hidden=!c.modelBreaker;$('#headingBreaker').hidden=!c.modelBreaker;$('#sceneSummary').textContent=c.summary;$('#selectedLabel').textContent=label(key());
 document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variant===key())));
 ensureVariantVisible();document.querySelectorAll('[data-case]').forEach(b=>{const active=Number(b.dataset.case)===row;b.setAttribute('aria-current',String(active));b.closest('.sample-card').classList.toggle('current',active)});const activeCard=$('.sample-card.current'),panel=$('.sample-panel');if(activeCard&&panel.clientHeight){const cr=activeCard.getBoundingClientRect(),pr=panel.getBoundingClientRect();if(cr.top<pr.top)panel.scrollTop+=cr.top-pr.top;else if(cr.bottom>pr.bottom)panel.scrollTop+=cr.bottom-pr.bottom}
 $('#hold').textContent=edit?'Hold for original':key().endsWith('_raw')?'Hold for enhanced':'Hold for plain';
 $('#hold').setAttribute('aria-label',edit?'Hold to show the original image':'Hold to show '+label(pair()));
 renderDetails();renderIdentityOverlay();if(gridMode)renderGrid();else if($('#grid').dataset.scene!==c.id){$('#grid').replaceChildren();delete $('#grid').dataset.scene}if(reset)fit();updateHold();history.replaceState(null,'',`#${c.id}/${key()}`);
 const frame=document.createElement('div');frame.className='frame';const main=picture(record(key()),c.title+' — '+label(key())),comparison=picture(record(pair()),c.title+' — '+label(pair()));comparison.className='comparison';frame.append(main,comparison);canvas.append(frame);
 try{await Promise.all([...frame.querySelectorAll('img')].map(i=>i.decode()));if(ticket!==renderToken){frame.remove();return}for(const old of [...canvas.children])if(old!==frame)old.remove();frame.classList.add('ready');ready=true;$('#loading').hidden=true;$('#hold').disabled=edit&&key()==='source';updateHold()}
 catch{frame.remove();if(ticket===renderToken){$('#loading').textContent='Image could not load. Reload to retry.'}}
}
function updateVariantFade(){const strip=$('#variants');strip.classList.toggle('has-more',strip.scrollLeft+strip.clientWidth<strip.scrollWidth-2)}
$('#variants').addEventListener('scroll',updateVariantFade,{passive:true});new ResizeObserver(updateVariantFade).observe($('#variants'));
function ensureVariantVisible(){const selected=$(`[data-variant="${key()}"]`),strip=$('#variants');if(!selected)return;const left=selected.getBoundingClientRect().left-strip.getBoundingClientRect().left;if(left<0)strip.scrollLeft+=left;else if(left+selected.offsetWidth>strip.clientWidth)strip.scrollLeft+=left+selected.offsetWidth-strip.clientWidth;updateVariantFade()}
new ResizeObserver(ensureVariantVisible).observe($('#variants'));
function changeScene(delta){releaseHold();row=(row+delta+DATA.cases.length)%DATA.cases.length;render(true)}
function changeImage(delta){releaseHold();variant=(variant+delta+variantList.length)%variantList.length;render()}
const sceneOptions=document.createDocumentFragment();let optionGroup=null,previousSection=null;DATA.cases.forEach((c,i)=>{if(c.section&&c.section!==previousSection){optionGroup=document.createElement('optgroup');optionGroup.label=c.section;sceneOptions.append(optionGroup);previousSection=c.section}const o=document.createElement('option');o.value=i;o.textContent=`${String(i+1).padStart(2,'0')} / ${c.title}`;(c.section?optionGroup:sceneOptions).append(o)});$('#caseSelect').replaceChildren(sceneOptions);
$('#variants').replaceChildren(...variantList.map(([k,name],i)=>{const b=document.createElement('button');b.textContent=name;b.dataset.variant=k;b.setAttribute('aria-pressed','false');b.onclick=()=>{releaseHold();variant=i;render();focusStage()};return b}));
const purposes={paws:'Poster edit: coordinate text and subject replacements',constanza:'Add hair, preserve the rest',wave:'Add a subject in the original artistic style',earring:'Relight while preserving painting style',moses:'Add an object with a convincing grip',blackjack:'Surgical edit: change one card',candy:'Remove one colour, preserve the other candies',wormsign:'Replace a symbol, preserve weathering',hobotree:'Remove clutter, preserve the scene',pisa:'Straighten geometry without changing the scene',giraffe:'Change anatomy, preserve identity',shrdlu:'Swap positions without swapping identities','06_lostfound':'Counts, multilingual text and coherent reflections','01_objects':'Dense objects, labels and small details','02_food':'Object counts, labels and natural materials','03_brand':'Branding, repeated marks and small text','04_menu':'Dense handwriting and readable hierarchy','05_animals':'Relative animal scale and exact counts','07_poster':'Rotated typography and precise spelling','08_palette':'Strict palette and repeated objects','09_layout':'Spatial placement and object separation','10_drawer':'Dense inventory and label correspondence','11_crowd':'Crowds, depth and artistic consistency','12_portrait':'Skin, hands and natural anatomy','13_banner':'Ultrawide layout and legible type','14_multiling':'Multiple scripts and reflections','15_infographic':'Charts, values and visual consistency','16_comic':'Panel order and character continuity'};
$('#sampleList').replaceChildren(...DATA.cases.map((c,i)=>{const card=document.createElement('article');card.className='sample-card';const b=document.createElement('button');b.className='sample-choice';b.dataset.case=i;const thumb=c.thumbnail||c.original||c.outputs.fibo_raw;b.append(picture(thumb,'',true));const copy=document.createElement('span');copy.className='sample-copy';const title=document.createElement('strong');title.textContent=`${String(i+1).padStart(2,'0')} · ${c.title}`;const why=document.createElement('span');why.textContent=purposes[c.id]||c.summary;copy.append(title);if(c.modelBreaker){const badge=document.createElement('span');badge.className='breaker-badge';badge.textContent='Model breaker';copy.append(badge)}copy.append(why);b.append(copy);b.onclick=()=>{releaseHold();row=i;render(true);focusStage()};card.append(b);if(c.section&&c.section!==DATA.cases[i-1]?.section){const divider=document.createElement('h3');divider.className='breaker-divider';divider.textContent=c.section;const group=document.createDocumentFragment();group.append(divider,card);return group}return card}));
$('#prevScene').onclick=()=>{changeScene(-1);focusStage()};$('#nextScene').onclick=()=>{changeScene(1);focusStage()};$('#caseSelect').onchange=e=>{releaseHold();row=Number(e.target.value);render(true);focusStage()};
$('#prevImage').onclick=()=>{changeImage(-1);focusStage()};$('#nextImage').onclick=()=>{changeImage(1);focusStage()};
$('#contextLink').onclick=e=>{e.preventDefault();$('#details').scrollIntoView({block:'start'});$('#details').focus({preventScroll:true})};$('#backToImage').onclick=e=>{e.preventDefault();stage.scrollIntoView({block:'start'});focusStage()};
$('#toolsToggle').onclick=()=>{$('#tools').hidden=!$('#tools').hidden;$('#toolsToggle').setAttribute('aria-expanded',String(!$('#tools').hidden))};
$('#plus').onclick=()=>zoom(1.5);$('#minus').onclick=()=>zoom(1/1.5);$('#fit').onclick=fit;$('#gridToggle').onclick=()=>{setGrid(!gridMode);$('#tools').hidden=true;$('#toolsToggle').setAttribute('aria-expanded','false');focusStage()};
const hold=$('#hold');hold.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();hold.setPointerCapture(e.pointerId);beginHold()};hold.onpointerup=releaseHold;hold.onpointercancel=releaseHold;hold.onlostpointercapture=releaseHold;hold.oncontextmenu=e=>e.preventDefault();hold.onselectstart=e=>e.preventDefault();hold.onblur=releaseHold;hold.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();beginHold()}};hold.onkeyup=e=>{if(e.key==='Enter'){e.preventDefault();releaseHold()}};
window.addEventListener('blur',releaseHold);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseHold()});
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||e.target.isContentEditable)return;
 if(e.code==='Space'){e.preventDefault();e.stopPropagation();beginHold();return}
 if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();changeScene(e.key==='ArrowUp'?-1:1)}
 else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();changeImage(e.key==='ArrowLeft'?-1:1)}
 else if(e.key==='Escape'){releaseHold();$('#tools').hidden=true;$('#toolsToggle').setAttribute('aria-expanded','false');fit()}
 else if(e.key==='0'){fit()}
},true);
document.addEventListener('keyup',e=>{if(e.code==='Space'&&holding){e.preventDefault();e.stopPropagation();releaseHold()}},true);
viewer.addEventListener('wheel',e=>{if(gridMode||e.target.closest('#tools'))return;e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12,e.clientX,e.clientY)},{passive:false});
viewer.onpointerdown=e=>{if(e.target.closest('button,a')||gridMode||e.pointerType==='touch')return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(scale>1){viewer.setPointerCapture(e.pointerId);viewer.classList.add('dragging')}pinchDistance=0};
viewer.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const[a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance)zoom(d/pinchDistance);pinchDistance=d}else if(scale>1){panX+=e.clientX-old.x;panY+=e.clientY-old.y;transform()}};
const endPointer=e=>{pointers.delete(e.pointerId);pinchDistance=0;viewer.classList.remove('dragging')};viewer.onpointerup=endPointer;viewer.onpointercancel=endPointer;viewer.ondblclick=e=>{if(matchMedia('(pointer:coarse)').matches)return;if(!e.target.closest('button,a')&&!gridMode)scale===1?zoom(2):fit()};
let imageHoldTimer=null,touchStart=null;const touchIds=new Set();
function cancelImageHold(){clearTimeout(imageHoldTimer);imageHoldTimer=null;touchStart=null;releaseHold()}
viewer.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||e.target.closest('button,a')||gridMode)return;touchIds.add(e.pointerId);if(touchIds.size!==1){cancelImageHold();return}touchStart={x:e.clientX,y:e.clientY};imageHoldTimer=setTimeout(()=>{if(touchIds.size===1)beginHold()},250)},{passive:true});
viewer.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&touchStart&&Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y)>10)cancelImageHold()},{passive:true});
for(const type of ['pointerup','pointercancel','lostpointercapture'])viewer.addEventListener(type,e=>{if(e.pointerType==='touch'){touchIds.delete(e.pointerId);cancelImageHold()}},{passive:true});
viewer.addEventListener('contextmenu',e=>{if(matchMedia('(max-width:700px)').matches&&!e.target.closest('button,a')){e.preventDefault();if(touchIds.size===1)beginHold()}});
window.addEventListener('blur',()=>{touchIds.clear();cancelImageHold()});
document.addEventListener('touchstart',e=>{if(e.touches.length>1)cancelImageHold()},{passive:true});
document.addEventListener('touchend',e=>{if(!e.touches.length){touchIds.clear();cancelImageHold()}},{passive:true});
document.addEventListener('touchcancel',()=>{touchIds.clear();cancelImageHold()},{passive:true});
const mobileHud=document.createElement('div');mobileHud.className='mobile-hud';mobileHud.hidden=true;mobileHud.setAttribute('aria-label','Image controls');document.body.append(mobileHud);
const hudItems=[$('.viewer-navigation'),$('.image-controls')].map(el=>{const slot=document.createElement('div');slot.className='hud-slot';slot.hidden=true;el.before(slot);return {el,slot}});
let hudActive=false,hudFrame=0;
function placeMobileControls(){
 hudFrame=0;const vv=window.visualViewport,z=vv?.scale||1,want=matchMedia('(max-width:700px)').matches&&z>1.02;
 if(want&&!hudActive){for(const {el,slot} of hudItems){slot.style.height=el.classList.contains('image-controls')?el.offsetHeight+'px':'0px';slot.hidden=false;mobileHud.append(el)}hudActive=true}
 if(!want){if(hudActive){for(const {el,slot} of hudItems){slot.after(el);slot.hidden=true;el.removeAttribute('style')}hudActive=false}mobileHud.hidden=true;return}
 const r=viewer.getBoundingClientRect(),bottomSlot=hudItems[1].slot.getBoundingClientRect();
 const left=Math.max(r.left,vv.offsetLeft),top=Math.max(r.top,vv.offsetTop),right=Math.min(r.right,vv.offsetLeft+vv.width),bottom=Math.min(bottomSlot.bottom,vv.offsetTop+vv.height);
 if(right-left<100/z||bottom-top<160/z){mobileHud.hidden=true;return}
 mobileHud.hidden=false;Object.assign(mobileHud.style,{left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px'});mobileHud.style.setProperty('--hud-scale',1/z);
 Object.assign(hudItems[0].el.style,{bottom:58/z+'px',right:8/z+'px'});
 hudItems[1].el.style.width=(right-left)*z+'px';
}
function scheduleMobileControls(){if(!hudFrame)hudFrame=requestAnimationFrame(placeMobileControls)}
window.visualViewport?.addEventListener('resize',scheduleMobileControls);window.visualViewport?.addEventListener('scroll',scheduleMobileControls);
window.addEventListener('resize',scheduleMobileControls);window.addEventListener('scroll',scheduleMobileControls,{passive:true});new ResizeObserver(scheduleMobileControls).observe(viewer);scheduleMobileControls();
const fiboNotice=$('#fiboNotice');let caveatTimer;
if(fiboNotice)fiboNotice.onclick=e=>{e.preventDefault();const caveat=$('#fiboCaveat');caveat.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});caveat.focus({preventScroll:true});caveat.classList.add('caveat-highlight');clearTimeout(caveatTimer);caveatTimer=setTimeout(()=>caveat.classList.remove('caveat-highlight'),4500)};
$('#copyPrompt').onclick=async()=>{try{await navigator.clipboard.writeText($('#selectedPrompt').textContent);$('#copyPrompt').textContent='Copied'}catch{$('#copyPrompt').textContent='Select text to copy'}setTimeout(()=>$('#copyPrompt').textContent='Copy',1500)};
function readHash(){const[id,k]=location.hash.slice(1).split('/');const r=DATA.cases.findIndex(c=>c.id===id),v=variantList.findIndex(a=>a[0]===k);if(r>=0)row=r;if(v>=0)variant=v}
window.addEventListener('hashchange',()=>{releaseHold();readHash();render(true)});readHash();render(true);

})();
