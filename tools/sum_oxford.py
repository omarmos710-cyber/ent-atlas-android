"""Add an 'At a glance' line for the Oxford material added to each updated clinical topic. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/data.js')
ADD = {
 'meniere': 'Bárány 2015: definite needs attacks of 20 min–12 h with documented low-frequency loss; betahistine no better than placebo (BEMED).',
 'septum': 'Large perforations can now be closed with an anterior ethmoidal artery flap; buttons are no longer a routine first step.',
 'vertigo': 'Horizontal canal BPPV: supine roll test and barbecue roll or Gufoni; anterior canal: Yacovino manoeuvre.',
 'hht': 'Three genes (ENG, ACVRL1, SMAD4); step up from KTP laser to septodermoplasty to nasal closure; resorbable packs only.',
 'sensori': 'UK action values 80 and 85 dB(A) with a 3 dB exchange rate; CLB criteria for noise loss; synaptopathy still debated.',
 'om': 'NICE: watch non-severe AOM; prophylaxis halves attacks in recurrent AOM; grommets or hearing aids after 3 months of bilateral OME with ≥25–30 dB loss.',
 'voice': '"Spasmodic dysphonia" is now laryngeal dystonia; inducible laryngeal obstruction often coexists with chronic cough.',
 'salivary': 'Drooling: separate anterior from posterior; avoid duct relocation in children who aspirate.',
 'chole': 'EAONO/JOS staging; endoscopic ear surgery and mastoid obliteration are growing; DWI misses disease under about 3 mm.',
 'otosc': 'Stapedotomy closes the gap to ≤10 dB in 80–95%; dead ear 0.4–2%; offer a hearing aid first.',
 'earsurg': 'Austin–Kartush classification (0, A–F) and MERI predict ossiculoplasty results.',
 'vs': 'Most small tumours are watched (17–29% grow over 4 years); radiosurgery or surgery chosen by size and hearing.',
 'petrous': 'Cholesterol granuloma is bright on T1 and T2; cholesteatoma restricts diffusion.',
 'tumear': 'Facial schwannoma: operate only for weakness worse than House–Brackmann III.',
 'tbfx': 'Classify as otic capsule-sparing or -violating; capsule-violating fractures risk late meningitis.',
 'oe': 'Necrotising otitis externa: biopsy, MRI or PET-CT, dual antipseudomonal therapy for at least 6 weeks.',
 'rehab': 'Bone-conduction devices: skin-drive, percutaneous or active transcutaneous; ABI when the cochlear nerve cannot be used.',
 'canal': 'Exostoses are multiple and bilateral (cold water); osteomas single at suture lines; never irrigate a button battery.',
 'crs': 'EPOS 2020: primary localised or diffuse, type 2 or not; biologics for recurrent type 2 polyps meeting 3 of 5 criteria.',
 'abs': 'Post-viral ARS: worse after 5 days or beyond 10; bacterial needs 3 of 5 EPOS features; antibiotics are overused.',
 'sinussurg': 'Appropriateness: Lund–Mackay ≥1, 8 weeks of maximal medical therapy, SNOT-22 ≥20.',
 'sinus_ca': 'SNUC responds to induction chemotherapy; endoscopic resection matches open results with clear margins.',
 'juv': 'UPMC staging adds residual ICA vascularity after embolisation.',
 'epistaxis': 'SPA dominant in 85%; landmark the crista ethmoidalis; electrocautery beats silver nitrate.',
 'rhinitis': 'Immunotherapy is the only disease-modifying treatment; treat the nose to help asthma.',
 'skullbase': 'Multilayer closure; vascularised nasoseptal flap for high-flow leaks; lumbar drains used selectively.',
 'facplast': 'Preservation rhinoplasty lowers the dorsum without resecting it; screen for body dysmorphic disorder.',
 'congnose': 'Stents after choanal atresia repair do not reduce revision; piriform aperture stenosis needs pituitary assessment.',
 'tonsil': 'Intracapsular tonsillectomy means less pain and bleeding; codeine is contraindicated under 18 for OSA.',
 'osa': 'CHAT trial: surgery improved behaviour and sleep but not attention; nearly half the waiting group normalised.',
 'lxca': 'Image before biopsy; NICE: offer T3 a choice of chemoradiotherapy or surgery; consider surgery first for T4a.',
 'tonsil_ca': 'AJCC 8 stages p16-positive disease separately; cetuximab de-escalation worsened survival.',
 'thyroid': 'U1–U5 and Thy1–5 grading; NIFTP is benign; low-dose iodine (HiLo) for low-risk disease.',
 'npc': 'Induction gemcitabine–cisplatin for high risk; plasma EBV DNA for monitoring; cumulative cisplatin about 200 mg/m².',
 'saltum': 'Permanent facial weakness about 7% after parotidectomy; Frey syndrome about 20%; Milan system for cytology.',
 'trach': 'NTSP bedside algorithms and capnography; tracheo-innominate fistula needs cuff overinflation and theatre.',
 'pouch': 'Cricopharyngeal bars are seen in a third of normal people; stapling is less effective for small pouches.',
 'orbit': 'Drain a subperiosteal abscess for age ≥9, large or non-medial abscess, frontal sinusitis, visual change or no improvement in 48 h.',
 'lxtrauma': 'Penetrating neck injury: hard signs mean theatre; otherwise CT angiography and selective exploration.',
 'audio': 'Read every audiogram in order: air, bone, compare ears, masking, fit the clinical picture.',
 'vest': 'vHIT gain ≥0.8 is normal; catch-up saccades mean a weak canal; oVEMP is the best screen for dehiscence.',
}
p = W; s = open(p, encoding='utf-8').read(); pre = 'window.CLINIC_DATA='
D = json.loads(s[len(pre):].rstrip().rstrip(';')); n = 0
for t in D['t']:
    line = ADD.get(t['id'])
    if not line: continue
    if not isinstance(t.get('sum'), list): t['sum'] = []
    if line not in t['sum']: t['sum'].append(line); n += 1
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
missing = [k for k in ADD if k not in {t['id'] for t in D['t']}]
print('added', n, 'missing', missing)
