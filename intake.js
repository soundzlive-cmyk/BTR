(() => {
  const form = document.getElementById('consentForm');
  const status = document.getElementById('statusLine');
  const get = id => document.getElementById(id);
  const key = 'btr-targets-intake-v1';
  const pads = {};
  const dateString = d => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  get('dob').max = dateString(new Date());
  function ageFromDOB(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y,m,d] = value.split('-').map(Number), today = new Date();
    const birth = new Date(y,m-1,d);
    if (birth.getFullYear() !== y || birth.getMonth() !== m-1 || birth.getDate() !== d || value > dateString(today)) return null;
    const age = today.getFullYear()-y-((today.getMonth()+1<m || (today.getMonth()+1===m && today.getDate()<d)) ? 1 : 0);
    return age>=0 && age<=120 ? age : null;
  }
  function updateGuardian(recalculate = false) {
    const age = ageFromDOB(get('dob').value);
    if (recalculate) get('age').value = age === null ? '' : age;
    const choice = get('isUnder18').value;
    const minor = choice === 'yes' || (age !== null && age < 18);
    get('isUnder18').setCustomValidity(choice==='no' && age!==null && age<18 ? 'The date of birth indicates a participant under 18. Choose Yes or Auto-detect.' : '');
    get('dob').setCustomValidity(get('dob').value && age===null ? 'Enter a valid date of birth that is not in the future.' : '');
    ['guardianName','guardianPhone'].forEach(id => get(id).required = minor);
    get('guardian-note').textContent = minor ? 'A parent/guardian name and phone number are required for this participant.' : 'Parent/guardian name and phone are required if the participant is under 18.';
    get('isUnder18Computed').value = minor ? 'yes' : 'no';
  }
  get('dob').addEventListener('input',()=>updateGuardian(true));
  get('isUnder18').addEventListener('change',()=>updateGuardian());
  updateGuardian();
  for (const id of ['sigGuardian','sigParticipant']) {
    const canvas = get(id), ctx = canvas.getContext('2d');
    let drawing = false, ink = false;
    ctx.lineWidth=3; ctx.lineCap='round'; ctx.strokeStyle='#12253a'; ctx.fillStyle='#12253a';
    const position = e => {const r=canvas.getBoundingClientRect(); return [(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height];};
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drawing=true;ink=true;canvas.setPointerCapture(e.pointerId);const [x,y]=position(e);ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x,y);});
    canvas.addEventListener('pointermove',e=>{if(!drawing)return;ctx.lineTo(...position(e));ctx.stroke();});
    const end=()=>{drawing=false;get(id+'Value').value=ink?canvas.toDataURL('image/png'):'';};
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    pads[id]={clear(){drawing=false;ink=false;ctx.clearRect(0,0,canvas.width,canvas.height);get(id+'Value').value='';},restore(value){this.clear();if(typeof value!=='string'||!value.startsWith('data:image/png;base64,'))return;const image=new Image();image.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);ink=true;get(id+'Value').value=value;};image.src=value;}};
  }
  document.querySelectorAll('[data-clear]').forEach(button=>button.addEventListener('click',()=>pads[button.dataset.clear].clear()));
  function data() {updateGuardian();return Object.fromEntries(new FormData(form).entries());}
  function restore(values) {
    form.reset();Object.values(pads).forEach(p=>p.clear());
    for(const element of form.elements) {
      if(!element.name || element.type==='hidden')continue;
      const value=values[element.name];
      if(element.type==='checkbox')element.checked=value==='on'||value===true;
      else if(element.type==='radio')element.checked=value===element.value;
      else if(typeof value==='string')element.value=value;
    }
    Object.entries(pads).forEach(([id,pad])=>pad.restore(values[id]));updateGuardian(true);
  }
  function validate() {
    updateGuardian();
    for(const element of form.querySelectorAll('input[type="text"],input[type="tel"]'))element.value=element.value.trim();
    if(!form.checkValidity()){status.textContent='Please complete the required fields and review the indicated information.';form.reportValidity();return false;}
    return true;
  }
  form.addEventListener('submit',e=>{if(!validate()){e.preventDefault();return;}status.textContent='Sending your intake to BTR’s existing submission service…';});
  get('btnSave').addEventListener('click',()=>{try{localStorage.setItem(key,JSON.stringify(data()));status.textContent='Draft saved on this device. It has not been submitted.';}catch{status.textContent='This browser could not save your draft. Print or export a copy instead.';}});
  get('btnLoad').addEventListener('click',()=>{try{const raw=localStorage.getItem(key);if(!raw){status.textContent='No saved draft found on this device.';return;}const values=JSON.parse(raw);if(!values||typeof values!=='object'||Array.isArray(values))throw Error();restore(values);status.textContent='Saved draft loaded. Review your details before submitting.';}catch{status.textContent='The saved draft could not be loaded.';}});
  get('btnExport').addEventListener('click',()=>{if(!validate())return;const url=URL.createObjectURL(new Blob([JSON.stringify(data(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='btr-targets-intake.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Your intake was exported. It has not been submitted.';});
  get('btnPrint').addEventListener('click',()=>window.print());
  get('btnReset').addEventListener('click',()=>{if(!window.confirm('Clear all entered information and the saved draft on this device?'))return;form.reset();Object.values(pads).forEach(p=>p.clear());try{localStorage.removeItem(key);}catch{}updateGuardian();status.textContent='Form and saved draft cleared.';});
})();
