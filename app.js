const $ = (q, el=document) => el.querySelector(q);
const unlock = $('#unlock'), app = $('#app'), form = $('#unlock-form'), password = $('#password');
let key = '', state = {}, openOnly = false;

function idFor(pass) { let h=5381; for (const c of pass) h=((h<<5)+h)^c.charCodeAt(0); return `crystal-legacy-run-${h>>>0}`; }
function load() { state = JSON.parse(localStorage.getItem(key) || '{"entries":{}}'); state.entries ||= {}; }
function save() { localStorage.setItem(key, JSON.stringify(state)); }
function usedBefore(id) { return new Set(Object.entries(state.entries).filter(([area,e]) => +area < id && e.pokemon).map(([,e]) => e.pokemon)); }
function render() {
  const list = $('#area-list'), template = $('#area-template'); list.innerHTML='';
  const query = $('#search').value.trim().toLowerCase();
  const entries = Object.values(state.entries), caught = entries.filter(e=>e.status==='caught').length, missed=entries.filter(e=>e.status==='missed').length;
  $('#claimed-count').textContent=caught+missed; $('#caught-count').textContent=caught; $('#missed-count').textContent=missed;
  AREAS.filter(a => (!query || a.name.toLowerCase().includes(query)) && (!openOnly || !state.entries[a.id]?.status)).forEach(area => {
    const node=template.content.firstElementChild.cloneNode(true), entry=state.entries[area.id]||{}, head=$('.area-head',node), select=$('.pokemon-select',node), choice=$('.status-choice',node), clear=$('.clear-entry',node), pill=$('.state-pill',node);
    $('.step',node).textContent=String(area.id).padStart(2,'0'); $('.area-title strong',node).textContent=area.name; $('.area-title small',node).textContent=entry.pokemon ? `Encounter: ${entry.pokemon}` : `${area.pokemon.length} possible encounters`; $('.encounter-note',node).textContent=area.note;
    if(entry.status){ pill.textContent=entry.status==='caught'?'Caught':'Missed'; pill.classList.add(entry.status); select.value=entry.pokemon; select.disabled=true; clear.hidden=false; }
    const used=usedBefore(area.id); area.pokemon.forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=used.has(p)&&p!==entry.pokemon?`${p} — already used`:p;o.disabled=used.has(p)&&p!==entry.pokemon;select.append(o)});
    if (!area.pokemon.length) { select.disabled=true; select.options[0].textContent='No wild encounter listed'; }
    head.addEventListener('click',()=>{const isOpen=head.getAttribute('aria-expanded')==='true';head.setAttribute('aria-expanded',String(!isOpen));$('.area-body',node).hidden=isOpen});
    select.addEventListener('change',()=>{ if(!select.value) return; state.entries[area.id]={pokemon:select.value,status:null}; save(); choice.hidden=false; });
    if(entry.pokemon&&!entry.status) choice.hidden=false;
    choice.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{state.entries[area.id].status=btn.className;save();render()}));
    clear.addEventListener('click',()=>{delete state.entries[area.id];save();render()}); list.append(node);
  });
}
form.addEventListener('submit',e=>{e.preventDefault(); key=idFor(password.value); load(); $('#run-name').textContent='••••••'; unlock.hidden=true; app.hidden=false; render();});
$('#switch-run').addEventListener('click',()=>{app.hidden=true;unlock.hidden=false;password.value='';password.focus()});
$('#search').addEventListener('input',render); $('#filter-open').addEventListener('click',e=>{openOnly=!openOnly;e.currentTarget.setAttribute('aria-pressed',String(openOnly));render()});
