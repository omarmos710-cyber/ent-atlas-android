/* ENT Atlas dose calculator.
   Every dose rule lives in RULES below. A rule is used only after the user has checked it against
   a formulary and marked it verified (stored in ST.dver with the rule's fingerprint, so a changed
   rule needs re-verifying). The arithmetic is deterministic; the rules are the part to check. */
(function(){
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const r1=x=>x<1?Math.round(x*100)/100:x<10?Math.round(x*10)/10:Math.round(x);
const rm=x=>x<1?Math.round(x*100)/100:Math.round(x*10)/10;
const fmt=(x,u)=>u==="microgram"?(x>=1000?r1(x/1000)+" mg":r1(x)+" micrograms"):u==="units"?Math.round(x)+" units":u==="g"?r1(x)+" g":u==="ml"?rm(x)+" ml":u==="mmol"?r1(x)+" mmol":r1(x)+" mg";

/* kinds:
   kg   : dose = per*kg, capped at max; conc = [[label, amount per ml]]
   band : by age (months) [[from,to,dose,label?]]
   wb   : by weight (kg) [[from,to,{per|dose},maxday?]]
   fn   : custom function returning {lines,warn}
   la   : local anaesthetic maximum dose tool                                                   */
const RULES=[
 {id:"para_po",g:"Analgesia",d:"Paracetamol",art:"dr_para",ind:"Oral, child or adult",k:"kg",per:15,u:"mg",max:1000,freq:"every 4 to 6 hours, no more than 4 doses in 24 hours",maxday:{per:60,max:4000},minAge:1,conc:[["120 mg/5 ml",24],["250 mg/5 ml",50]],
  rule:"15 mg/kg per dose (maximum 1 g), every 4 to 6 hours, maximum 4 doses and 60 mg/kg (maximum 4 g) in 24 hours. Not for neonates (separate dosing)."},
 {id:"para_iv",g:"Analgesia",d:"Paracetamol",art:"dr_para",ind:"Intravenous",k:"wb",u:"mg",bands:[[0,10,{per:10},30],[10,50,{per:15},60],[50,999,{dose:1000},null]],freq:"every 4 to 6 hours",conc:[["10 mg/ml",10]],minAge:1,
  rule:"Under 10 kg: 10 mg/kg (maximum 30 mg/kg a day). 10 to 50 kg: 15 mg/kg (maximum 60 mg/kg a day). Over 50 kg: 1 g (maximum 4 g a day; use 15 mg/kg if risk factors for hepatotoxicity). Interval at least 4 hours."},
 {id:"ibu_po",g:"Analgesia",d:"Ibuprofen",art:"dr_nsaid",ind:"Oral, child or adult",k:"kg",per:10,u:"mg",max:400,freq:"every 6 to 8 hours (three or four times daily)",maxday:{per:30,max:2400},minAge:3,minWt:5,conc:[["100 mg/5 ml",20]],
  rule:"10 mg/kg per dose (maximum 400 mg), three or four times daily, maximum 30 mg/kg a day (maximum 2.4 g). From 3 months and 5 kg."},
 {id:"morph_po",g:"Analgesia",d:"Morphine (oral immediate-release)",art:"dr_opioid",ind:"Child 1 to 12 years, severe pain, monitored",k:"kg",per:0.2,u:"mg",max:10,freq:"every 4 hours if needed",minAge:12,maxAge:144,conc:[["10 mg/5 ml",2]],
  rule:"200 micrograms/kg per dose (maximum 10 mg), every 4 hours as needed; reduce by about half in obstructive sleep apnoea; monitored setting."},
 {id:"ondan",g:"Analgesia",d:"Ondansetron",art:"dr_ponv",ind:"Post-operative nausea, intravenous",k:"kg",per:0.1,u:"mg",max:4,freq:"single dose, may repeat after 8 hours",minAge:1,conc:[["2 mg/ml",2]],
  rule:"100 micrograms/kg (maximum 4 mg) as a single dose."},

 {id:"amox_band",g:"Antibiotics",d:"Amoxicillin",art:"dr_amox",ind:"Oral, standard (age bands)",k:"band",u:"mg",bands:[[1,12,125],[12,60,250],[60,216,500],[216,1800,500]],freq:"three times daily",conc:[["125 mg/5 ml",25],["250 mg/5 ml",50]],
  rule:"1 to 11 months 125 mg; 1 to 4 years 250 mg; 5 years and over 500 mg; three times daily."},
 {id:"amox_kg",g:"Antibiotics",d:"Amoxicillin",art:"dr_amox",ind:"Oral, severe infection",k:"kg",per:30,u:"mg",max:1000,freq:"three times daily",minAge:1,conc:[["125 mg/5 ml",25],["250 mg/5 ml",50]],
  rule:"30 mg/kg per dose (maximum 1 g) three times daily."},
 {id:"coamox_iv",g:"Antibiotics",d:"Co-amoxiclav",art:"dr_coamox",ind:"Intravenous",k:"kg",per:30,u:"mg",max:1200,freq:"every 8 hours",minAge:3,
  rule:"30 mg/kg of co-amoxiclav (combined) per dose (maximum 1.2 g) every 8 hours."},
 {id:"coamox_po",g:"Antibiotics",d:"Co-amoxiclav",art:"dr_coamox",ind:"Oral suspension",k:"fn",minAge:1,
  rule:"1 month to 5 years: 0.25 ml/kg of 125/31 suspension three times daily (doubled in severe infection). 6 to 11 years: 5 ml of 250/62 suspension three times daily (doubled in severe infection). 12 years and over: 625 mg (500/125) tablet three times daily.",
  fn:(kg,m)=>m<72?{lines:[["Dose",rm(0.25*kg)+" ml of 125/31 suspension"],["Severe infection",rm(0.5*kg)+" ml of 125/31 suspension"],["Frequency","three times daily"]]}:m<144?{lines:[["Dose","5 ml of 250/62 suspension"],["Severe infection","10 ml of 250/62 suspension"],["Frequency","three times daily"]]}:{lines:[["Dose","625 mg (500/125) tablet"],["Frequency","three times daily"]]}},
 {id:"penv",g:"Antibiotics",d:"Phenoxymethylpenicillin",art:"dr_penv",ind:"Oral (age bands)",k:"band",u:"mg",bands:[[1,12,62.5],[12,72,125],[72,144,250],[144,1800,500]],freq:"four times daily",conc:[["125 mg/5 ml",25],["250 mg/5 ml",50]],
  rule:"1 to 11 months 62.5 mg; 1 to 5 years 125 mg; 6 to 11 years 250 mg; 12 years and over 500 mg; four times daily."},
 {id:"benpen",g:"Antibiotics",d:"Benzylpenicillin",art:"dr_penv",ind:"Intravenous",k:"kg",per:25,u:"mg",max:2400,freq:"every 6 hours (50 mg/kg in severe infection, maximum 2.4 g)",minAge:1,
  rule:"25 mg/kg per dose every 6 hours; 50 mg/kg in severe infection; maximum 2.4 g per dose."},
 {id:"clari",g:"Antibiotics",d:"Clarithromycin",art:"dr_clari",ind:"Oral (weight bands)",k:"wb",u:"mg",bands:[[0,8,{per:7.5},null],[8,12,{dose:62.5},null],[12,20,{dose:125},null],[20,30,{dose:187.5},null],[30,40,{dose:250},null],[40,999,{dose:500},null]],freq:"twice daily (250 to 500 mg in adults)",minAge:1,conc:[["125 mg/5 ml",25],["250 mg/5 ml",50]],
  rule:"Under 8 kg 7.5 mg/kg; 8 to 11 kg 62.5 mg; 12 to 19 kg 125 mg; 20 to 29 kg 187.5 mg; 30 to 40 kg 250 mg; over 40 kg 250 to 500 mg; twice daily."},
 {id:"cefalex",g:"Antibiotics",d:"Cefalexin",art:"dr_cefal",ind:"Oral",k:"kg",per:12.5,u:"mg",max:500,freq:"twice daily (25 mg/kg in severe infection, maximum 1 g)",minAge:1,conc:[["125 mg/5 ml",25],["250 mg/5 ml",50]],
  rule:"12.5 mg/kg per dose (maximum 500 mg) twice daily; 25 mg/kg (maximum 1 g) in severe infection."},
 {id:"fluclox",g:"Antibiotics",d:"Flucloxacillin",art:"dr_fluclox",ind:"Oral (age bands)",k:"band",u:"mg",bands:[[1,24,"62.5 to 125"],[24,120,"125 to 250"],[120,216,"250 to 500"],[216,1800,"500 to 1000"]],freq:"four times daily, on an empty stomach",conc:[["125 mg/5 ml",25],["250 mg/5 ml",50]],
  rule:"1 month to 1 year 62.5 to 125 mg; 2 to 9 years 125 to 250 mg; 10 to 17 years 250 to 500 mg; adults 500 mg to 1 g; four times daily."},
 {id:"clinda",g:"Antibiotics",d:"Clindamycin",art:"dr_clinda",ind:"Oral",k:"kg",per:6,u:"mg",max:450,freq:"four times daily (3 to 6 mg/kg)",minAge:1,
  rule:"3 to 6 mg/kg per dose (maximum 450 mg) four times daily. The calculator shows the upper dose."},
 {id:"metro_po",g:"Antibiotics",d:"Metronidazole",art:"dr_metro",ind:"Oral",k:"kg",per:7.5,u:"mg",max:400,freq:"three times daily",minAge:1,conc:[["200 mg/5 ml",40]],
  rule:"7.5 mg/kg per dose (maximum 400 mg) three times daily."},
 {id:"metro_iv",g:"Antibiotics",d:"Metronidazole",art:"dr_metro",ind:"Intravenous",k:"kg",per:7.5,u:"mg",max:500,freq:"every 8 hours",minAge:1,conc:[["5 mg/ml",5]],
  rule:"7.5 mg/kg per dose (maximum 500 mg) every 8 hours."},
 {id:"ceftri",g:"Antibiotics",d:"Ceftriaxone",art:"dr_ceftri",ind:"Intravenous, standard",k:"kg",per:50,u:"mg",max:4000,freq:"once daily (adults usually 2 g)",minAge:1,
  rule:"50 mg/kg once daily (maximum 4 g); adults commonly 2 g once daily. Avoid with intravenous calcium in neonates."},
 {id:"ceftri_men",g:"Antibiotics",d:"Ceftriaxone",art:"dr_ceftri",ind:"Intravenous, meningitis and intracranial infection",k:"kg",per:80,u:"mg",max:4000,freq:"once daily (adults 2 g twice daily)",minAge:1,
  rule:"80 mg/kg once daily (maximum 4 g) in children; adults 2 g twice daily."},
 {id:"ceftaz",g:"Antibiotics",d:"Ceftazidime",art:"dr_ceftaz",ind:"Intravenous",k:"kg",per:50,u:"mg",max:2000,freq:"every 8 hours (maximum 6 g a day)",minAge:1,
  rule:"25 to 50 mg/kg per dose every 8 hours (maximum 2 g per dose, 6 g a day). The calculator shows the upper dose."},
 {id:"cipro_po",g:"Antibiotics",d:"Ciprofloxacin",art:"dr_cipro",ind:"Oral, child (specialist use)",k:"kg",per:20,u:"mg",max:750,freq:"twice daily",minAge:1,
  rule:"10 to 20 mg/kg per dose (maximum 750 mg) twice daily; children only where benefit outweighs risk. The calculator shows the upper dose."},
 {id:"gent",g:"Antibiotics",d:"Gentamicin",art:"dr_gent",ind:"Intravenous once-daily dose",k:"kg",per:7,u:"mg",freq:"once daily; interval and later doses by levels and your local nomogram",minAge:1,
  rule:"7 mg/kg once daily (use the dosing weight your local protocol specifies: actual, ideal or adjusted). Check levels and renal function; no interval or nomogram is calculated here."},

 {id:"dex_croup",g:"Steroids",d:"Dexamethasone",art:"dr_dexa",ind:"Croup, single oral dose",k:"fn",minAge:1,
  rule:"150 micrograms/kg as a single dose; up to 600 micrograms/kg in severe croup (maximum 12 mg).",
  fn:kg=>({lines:[["Standard",r1(Math.min(0.15*kg,12))+" mg"],["Severe croup",r1(Math.min(0.6*kg,12))+" mg"+(0.6*kg>12?" (capped at 12 mg)":"")],["Frequency","single dose"]]})},
 {id:"dex_tons",g:"Steroids",d:"Dexamethasone",art:"dr_dexa",ind:"Tonsillectomy, intravenous at induction",k:"kg",per:0.15,u:"mg",max:8,freq:"single dose",minAge:1,
  rule:"150 micrograms/kg intravenously at induction (maximum 8 mg)."},
 {id:"dex_men",g:"Steroids",d:"Dexamethasone",art:"dr_dexa",ind:"Bacterial meningitis, with first antibiotic",k:"kg",per:0.15,u:"mg",max:10,freq:"every 6 hours for 4 days",minAge:3,
  rule:"150 micrograms/kg (maximum 10 mg) every 6 hours for 4 days, started with or just before the first antibiotic dose."},
 {id:"pred",g:"Steroids",d:"Prednisolone",art:"dr_pred",ind:"Sudden hearing loss and similar high-dose courses",k:"kg",per:1,u:"mg",max:60,freq:"once daily in the morning",minAge:1,
  rule:"1 mg/kg once daily (maximum 60 mg)."},

 {id:"adr_im",g:"Emergency",d:"Adrenaline 1:1,000",art:"dr_adren",ind:"Anaphylaxis, intramuscular",k:"band",u:"microgram",bands:[[0,6,"100 to 150"],[6,72,150],[72,144,300],[144,1800,500]],freq:"anterolateral thigh; repeat after 5 minutes if no better",conc:[["1 mg/ml (1:1,000)",1000]],
  rule:"Under 6 months 100 to 150 micrograms; 6 months to 6 years 150 micrograms; 6 to 12 years 300 micrograms; over 12 years and adults 500 micrograms; intramuscular, repeat after 5 minutes."},
 {id:"adr_neb",g:"Emergency",d:"Adrenaline 1:1,000",art:"dr_adren",ind:"Croup or stridor, nebulised",k:"kg",per:400,u:"microgram",max:5000,freq:"repeat after 30 minutes if needed; observe at least 2 to 4 hours",conc:[["1 mg/ml (1:1,000)",1000]],minAge:1,
  rule:"400 micrograms/kg (0.4 ml/kg of 1:1,000), maximum 5 mg (5 ml), nebulised; may repeat after 30 minutes."},
 {id:"lipid",g:"Emergency",d:"Lipid emulsion 20%",art:"dr_lido",ind:"Local anaesthetic toxicity",k:"fn",
  rule:"1.5 ml/kg bolus over 1 minute, then 15 ml/kg/hour; up to two further boluses at 5-minute intervals and the rate may be doubled; maximum cumulative 12 ml/kg.",
  fn:kg=>({lines:[["Bolus",rm(1.5*kg)+" ml over 1 minute"],["Infusion",rm(15*kg)+" ml/hour"],["Doubled rate",rm(30*kg)+" ml/hour"],["Cumulative maximum",rm(12*kg)+" ml"]]})},
 {id:"cagluc",g:"Emergency",d:"Calcium gluconate 10%",art:"dr_calc",ind:"Acute symptomatic hypocalcaemia, intravenous",k:"fn",
  rule:"Child: 0.5 ml/kg of 10% (0.11 mmol/kg), maximum 20 ml, over 5 to 10 minutes with ECG monitoring. Adult: 10 to 20 ml of 10% diluted in 50 to 100 ml over 10 minutes, then infusion by protocol.",
  fn:(kg,m)=>kg>=40&&m>=216?{lines:[["Bolus","10 to 20 ml of 10% diluted in 50 to 100 ml of 5% glucose or saline over 10 minutes"],["Then","infusion by local protocol (for example 100 ml of 10% in 1 litre, titrated)"]]}:{lines:[["Bolus",rm(Math.min(0.5*kg,20))+" ml of 10%"+(0.5*kg>20?" (capped at 20 ml)":"")],["Calcium",r1(Math.min(0.11*kg,4.4))+" mmol"],["Rate","over 5 to 10 minutes, ECG monitoring"]]}},
 {id:"txa_iv",g:"Bleeding",d:"Tranexamic acid",art:"dr_txa",ind:"Intravenous",k:"kg",per:15,u:"mg",max:1000,freq:"slowly; repeat every 8 hours if needed",conc:[["100 mg/ml",100]],
  rule:"10 to 15 mg/kg (maximum 1 g) slowly intravenously, repeated every 8 hours if needed. The calculator shows the upper dose."},
 {id:"txa_po",g:"Bleeding",d:"Tranexamic acid",art:"dr_txa",ind:"Oral",k:"kg",per:25,u:"mg",max:1500,freq:"two or three times daily (15 to 25 mg/kg)",
  rule:"15 to 25 mg/kg (maximum 1.5 g) two or three times daily. The calculator shows the upper dose."},
 {id:"ddavp",g:"Bleeding",d:"Desmopressin",art:"dr_ddavp",ind:"Bleeding disorders, intravenous or subcutaneous",k:"kg",per:0.3,u:"microgram",max:20,freq:"over 20 to 30 minutes; repeat every 12 to 24 hours only with sodium checks",minAge:24,
  rule:"0.3 micrograms/kg (maximum 20 micrograms) over 20 to 30 minutes. Not under 2 years. Fluid restriction and sodium monitoring."},
 {id:"pcc",g:"Bleeding",d:"Prothrombin complex concentrate",art:"dr_rev",ind:"Warfarin reversal, life-threatening bleeding",k:"fn",inr:true,
  rule:"By INR: 2.0 to 3.9: 25 units/kg; 4.0 to 6.0: 35 units/kg; over 6.0: 50 units/kg; maximum 5,000 units (dose weight capped at 100 kg). Give with intravenous vitamin K 5 to 10 mg.",
  fn:(kg,m,x)=>{const i=x.inr;if(!i)return{lines:[["Enter the INR",""]]};if(i<2)return{lines:[["INR below 2.0","PCC dosing by this table does not apply; discuss with haematology"]]};const per=i<4?25:i<=6?35:50;const d=Math.min(per*Math.min(kg,100),5000);return{lines:[["Dose",Math.round(d)+" units ("+per+" units/kg)"],["With","vitamin K 5 to 10 mg intravenously"]]}}},
 {id:"protam",g:"Bleeding",d:"Protamine",art:"dr_rev",ind:"Reversal of unfractionated heparin",k:"fn",hep:true,
  rule:"1 mg per 100 units of heparin given in the previous 2 to 3 hours, maximum 50 mg, slowly intravenously.",
  fn:(kg,m,x)=>x.hep?{lines:[["Dose",r1(Math.min(x.hep/100,50))+" mg"+(x.hep/100>50?" (capped at 50 mg)":"")],["Rate","slow intravenous injection over about 10 minutes"]]}:{lines:[["Enter heparin units",""]]}},

 {id:"propr",g:"Special",d:"Propranolol",art:"dr_propr",ind:"Infantile haemangioma",k:"fn",maxAge:60,
  rule:"Start 1 mg/kg/day in 3 divided doses, increase over 1 to 2 weeks to 2 mg/kg/day (up to 3 mg/kg/day) in 2 or 3 divided doses, with feeds.",
  fn:kg=>({lines:[["Starting dose",r1(kg/3)+" mg three times daily (1 mg/kg/day)"],["Target",r1(2*kg/3)+" mg three times daily (2 mg/kg/day)"],["Maximum",r1(3*kg/2)+" mg twice daily (3 mg/kg/day)"],["With","feeds; stop if not feeding or unwell"]]})},
 {id:"la",g:"Local anaesthetic",d:"Local anaesthetic maximum dose",art:"dr_lido",ind:"Lidocaine, bupivacaine, levobupivacaine, prilocaine, cocaine; combined use",k:"la",
  rule:"Lidocaine plain 3 mg/kg (maximum 200 mg), with adrenaline 7 mg/kg (maximum 500 mg); bupivacaine 2 mg/kg (maximum 150 mg); levobupivacaine 2 mg/kg (maximum 150 mg); prilocaine 6 mg/kg (maximum 400 mg); cocaine topical 1.5 mg/kg (maximum 100 mg). Doses of different agents are additive as fractions of each maximum."},
];
const LA=[["lido","Lidocaine plain",3,200],["lidoa","Lidocaine with adrenaline",7,500],["bupi","Bupivacaine",2,150],["levo","Levobupivacaine",2,150],["prilo","Prilocaine",6,400],["coc","Cocaine (topical)",1.5,100]];
const BY={};RULES.forEach(r=>BY[r.id]=r);
const fp=r=>{let h=0;const s=r.rule;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return (h>>>0).toString(36)};
const DV=()=>(ST.dver=ST.dver||{});
const ver=r=>{const v=DV()[r.id];return v&&v.f===fp(r)?v:null};
const P=window.DCSTATE=window.DCSTATE||{kg:"",y:"",mo:"",sel:"",inr:"",hep:"",la:{}};

/* plausibility: APLS weight estimate for children */
function est(m){return m<12?0.5*m+4:m<72?2*(m/12)+8:m<=144?3*(m/12)+7:null}
function checks(kg,m,r){const w=[];
 if(!(kg>0))return ["Enter a weight."];
 if(kg<0.5||kg>250)w.push("The weight looks wrong. Check it.");
 const e=est(m);if(m!=null&&e&&(kg<0.6*e||kg>1.8*e))w.push("The weight is far from the expected weight for this age (about "+Math.round(e)+" kg). Check both.");
 if(r.minAge!=null&&m!=null&&m<r.minAge)w.push("Below the minimum age for this rule ("+(r.minAge<12?r.minAge+" months":r.minAge/12+" years")+").");
 if(r.maxAge!=null&&m!=null&&m>r.maxAge)w.push("Above the age range this rule is written for.");
 if(r.minWt&&kg<r.minWt)w.push("Below the minimum weight for this rule ("+r.minWt+" kg).");
 if(m==null&&(r.k==="band"||r.minAge!=null))w.push("Enter the age.");
 return w}
function vols(dose,r){if(!r.conc||typeof dose!=="number")return [];return r.conc.map(([l,c])=>["Volume of "+l,fmt(dose/c,"ml")])}
function compute(r,kg,m,x){
 if(r.k==="kg"){const raw=r.per*kg,d=r.max!=null?Math.min(raw,r.max):raw;const L=[["Dose",fmt(d,r.u)+(r.max!=null&&raw>r.max?" (capped at the "+fmt(r.max,r.u)+" maximum)":"")+" "+"("+r.per+" "+(r.u==="microgram"?"micrograms":r.u)+"/kg)"],...vols(d,r),["Frequency",r.freq]];
  if(r.maxday){const md=Math.min(r.maxday.per*kg,r.maxday.max);L.push(["Maximum in 24 hours",fmt(md,r.u)])}return {lines:L}}
 if(r.k==="band"){if(m==null)return{lines:[]};const b=r.bands.find(b=>m>=b[0]&&m<b[1]);if(!b)return{lines:[["No band","Age is outside the bands of this rule"]]};
  const d=b[2];return {lines:[["Dose",typeof d==="number"?fmt(d,r.u):d+" "+(r.u==="microgram"?"micrograms":r.u)],...(typeof d==="number"?vols(d,r):[]),["Frequency",r.freq],...(r.concTxt?[["Volume",r.concTxt]]:[])]}}
 if(r.k==="wb"){const b=r.bands.find(b=>kg>=b[0]&&kg<b[1]);const d=b[2].per?b[2].per*kg:b[2].dose;const L=[["Dose",fmt(d,r.u)+(b[2].per?" ("+b[2].per+" mg/kg)":"")],...vols(d,r),["Frequency",r.freq]];if(b[3])L.push(["Maximum in 24 hours",fmt(b[3]*kg,r.u)+" ("+b[3]+" mg/kg)"]);return {lines:L}}
 if(r.k==="fn")return r.fn(kg,m,x);
 return {lines:[]}}

function inputs(){return `<div class="dcin"><label>Weight<span><input id="dckg" inputmode="decimal" value="${esc(P.kg)}" placeholder="kg"><i>kg</i></span></label>
 <label>Age<span><input id="dcy" inputmode="numeric" value="${esc(P.y)}" placeholder="0"><i>years</i></span></label>
 <label>&nbsp;<span><input id="dcmo" inputmode="numeric" value="${esc(P.mo)}" placeholder="0"><i>months</i></span></label></div>`}
function picker(){const groups=[...new Set(RULES.map(r=>r.g))];
 return `<select id="dcsel" class="dcsel" aria-label="Drug"><option value="">Choose a drug and indication</option>${groups.map(g=>`<optgroup label="${esc(g)}">${RULES.filter(r=>r.g===g).map(r=>`<option value="${r.id}"${P.sel===r.id?" selected":""}>${esc(r.d)}: ${esc(r.ind)}${ver(r)?"":" (not yet verified)"}</option>`).join("")}</optgroup>`).join("")}</select>`}
function laHTML(kg){const used=LA.map(([k,n,per,max])=>{const v=P.la[k]||{pct:"",ml:""};const mg=(parseFloat(v.pct)||0)*10*(parseFloat(v.ml)||0);const lim=Math.min(per*kg,max);return {k,n,per,max,v,mg,lim}});
 const frac=used.reduce((a,u)=>a+(u.mg&&u.lim?u.mg/u.lim:0),0);
 return `<div class="dcla"><table class="cltb"><thead><tr><th>Agent</th><th>Maximum for ${r1(kg)} kg</th><th>%</th><th>ml</th></tr></thead><tbody>${used.map(u=>`<tr><td>${esc(u.n)}</td><td>${fmt(u.lim,"mg")}<br><small>${u.per} mg/kg, max ${u.max} mg</small></td><td><input class="dclap" data-la="${u.k}:pct" inputmode="decimal" value="${esc(u.v.pct)}" placeholder="1"></td><td><input class="dclap" data-la="${u.k}:ml" inputmode="decimal" value="${esc(u.v.ml)}" placeholder="0"></td></tr>`).join("")}</tbody></table>
 <div class="dcres ${frac>1?"bad":frac>0.8?"warn":""}"><div><b>Used so far</b><span>${Math.round(frac*100)}% of the combined maximum</span></div>
 ${used.filter(u=>u.mg).map(u=>`<div><b>${esc(u.n)}</b><span>${r1(u.mg)} mg given</span></div>`).join("")}
 <div><b>Still available</b><span>${frac>=1?"None: the maximum has been reached or exceeded":LA.slice(0,3).map(([k,n,per,max])=>{const lim=Math.min(per*kg,max);const a=(1-frac)*lim;return `${n}: ${r1(a)} mg = `+(k==="bupi"?`${rm(a/2.5)} ml of 0.25% or ${rm(a/5)} ml of 0.5%`:`${rm(a/10)} ml of 1% or ${rm(a/20)} ml of 2%`)}).join("<br>")}</span></div></div>
 <p class="dcnote">1% = 10 mg/ml. Topical doses count. Use lean or ideal body weight in obesity. Aspirate before injecting.</p></div>`}

function result(){const kg=parseFloat(P.kg),y=parseFloat(P.y),mo=parseFloat(P.mo);const m=(isNaN(y)&&isNaN(mo))?null:(y||0)*12+(mo||0);
 const r=BY[P.sel];if(!r)return `<p class="dcnote">Enter the weight and age, then choose a drug.</p>`;
 const v=ver(r);
 const head=`<div class="dchd"><span class="cle">${esc(r.g)}</span><h2>${esc(r.d)}</h2><p>${esc(r.ind)}</p></div>`;
 const ruleBox=`<div class="dcrule"><b>Rule used</b><p>${esc(r.rule)}</p>${v?`<small>Verified against ${esc(v.s)} on ${esc(v.d)}</small>`:""}</div>`;
 if(!v)return head+`<div class="dcres lock"><div><b>Not verified yet</b><span>This rule is shown below. Check it against the BNF, BNF for Children or your formulary, then mark it verified to use it.</span></div></div>`+ruleBox+verifyForm(r)+`<button class="btn" data-go="cl:t-${r.art}">Read the drug article</button>`;
 const w=checks(kg,m,r);const block=!(kg>0)||(r.k==="band"&&m==null);
 let out="";if(!block){const x={inr:parseFloat(P.inr),hep:parseFloat(P.hep)};
  out=r.k==="la"?laHTML(kg):`<div class="dcres">${compute(r,kg,m,x).lines.map(([a,b])=>`<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>`}
 return head+(w.length?`<div class="dcwarn">${w.map(x=>`<p>${esc(x)}</p>`).join("")}</div>`:"")+
  (r.inr?`<div class="dcin one"><label>INR<span><input id="dcinr" inputmode="decimal" value="${esc(P.inr)}"></span></label></div>`:"")+
  (r.hep?`<div class="dcin one"><label>Heparin given in last 2 to 3 hours<span><input id="dchep" inputmode="numeric" value="${esc(P.hep)}"><i>units</i></span></label></div>`:"")+
  out+ruleBox+`<p class="dcnote">Check the result against the patient, the indication and renal and hepatic function. Use the dose your senior or pharmacist confirms.</p><button class="btn" data-go="cl:t-${r.art}">Read the drug article</button>`}
function verifyForm(r){return `<div class="dcver"><label>Checked against<select id="dcsrc"><option>BNF for Children</option><option>BNF</option><option>Local hospital formulary</option><option>Hospital pharmacist</option></select></label>
 <label class="dcchk"><input type="checkbox" id="dcok"> I have checked every number in this rule against that source</label><button class="btn primary" data-dcver="${r.id}">Mark verified</button></div>`}

function vCalc(){const n=RULES.filter(ver).length;
 return `<div class="clw dcw"><span class="cle">Drugs · Calculator</span><h1>Dose calculator</h1>
 <p class="clapl">Weight-based doses for the drugs where calculation matters in ENT. Each rule is used only after you have checked it against a formulary and marked it verified. ${n} of ${RULES.length} rules verified.</p>
 ${inputs()}${picker()}<div id="dcout">${result()}</div>
 <div class="dcfoot"><button class="btn" data-go="cl:calc-rules">Review and verify all rules</button></div></div>`}
function vRules(){return `<div class="clw dcw"><span class="cle">Drugs · Calculator</span><h1>Dose rules</h1>
 <p class="clapl">Every rule the calculator uses. Check each against the BNF, BNF for Children or your local formulary and mark it verified. If a rule is later changed in an update, it returns to unverified.</p>
 ${[...new Set(RULES.map(r=>r.g))].map(g=>`<div class="clgh">${esc(g)}</div>${RULES.filter(r=>r.g===g).map(r=>{const v=ver(r);return `<div class="dcrrow ${v?"ok":""}"><div><b>${esc(r.d)}</b><small>${esc(r.ind)}</small><p>${esc(r.rule)}</p>${v?`<small class="dcok">Verified against ${esc(v.s)} on ${esc(v.d)} <button class="dclink" data-dcun="${r.id}">Undo</button></small>`:`<button class="btn" data-dcpick="${r.id}">Verify</button>`}</div></div>`}).join("")}`).join("")}
 <div class="dcfoot"><button class="btn" data-go="cl:calc">Back to the calculator</button></div></div>`}

function render(arg){const v=document.getElementById("view");v.innerHTML=arg==="rules"?vRules():vCalc();arm(v)}
function redraw(){const o=document.getElementById("dcout");if(o)o.innerHTML=result()}
function arm(v){v.oninput=ev=>{const t=ev.target;if(t.id==="dckg")P.kg=t.value;else if(t.id==="dcy")P.y=t.value;else if(t.id==="dcmo")P.mo=t.value;else if(t.id==="dcinr")P.inr=t.value;else if(t.id==="dchep")P.hep=t.value;
  else if(t.dataset.la){const [k,f]=t.dataset.la.split(":");P.la[k]=P.la[k]||{};P.la[k][f]=t.value}else return;
  const a=document.activeElement,id=a&&a.id,la=a&&a.dataset.la,pos=a&&a.selectionStart;redraw();
  const b=id?document.getElementById(id):la?document.querySelector(`[data-la="${la}"]`):null;if(b&&b!==a){b.focus();try{b.setSelectionRange(pos,pos)}catch(e){}}};
 v.onchange=ev=>{if(ev.target.id==="dcsel"){P.sel=ev.target.value;redraw()}}}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-dcver],[data-dcun],[data-dcpick]");if(!b)return;
 if(b.dataset.dcpick){P.sel=b.dataset.dcpick;go("cl:calc");return}
 if(b.dataset.dcun){delete DV()[b.dataset.dcun];(typeof save==="function"&&save());render("rules");return}
 const r=BY[b.dataset.dcver];const ok=document.getElementById("dcok");if(!ok||!ok.checked){ok&&ok.closest("label").classList.add("need");return}
 DV()[r.id]={f:fp(r),s:document.getElementById("dcsrc").value,d:new Date().toISOString().slice(0,10)};(typeof save==="function"&&save());
 const s=document.getElementById("view");s.innerHTML=vCalc();arm(s)});
window.DOSECALC={render,RULES,compute,fp};
})();
