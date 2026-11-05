"""Register the gap-batch Clinical topics in clinic/data.js and clinic/links.js. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, g, t, src, one, an, rel, ops, srcs, sum_, ddx=()):
    return dict(id=id, t=t, g=g, src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=list(ddx), tx=[], ops=ops,
                cx=[], pearl=[], an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
NEW = [
 T('oesoph', 'mouth', 'Oesophagus and dysphagia', 'D67,68,69,93;L36,45',
   'Sort dysphagia by where it is (mouth and pharynx, or oesophagus), what sticks (solids or liquids) and how fast it is progressing. Progressive dysphagia with weight loss is cancer until endoscopy says otherwise.',
   ['pharynx'], ['pouch', 'fbfood', 'hypoca', 'laryngitis'], [[45, 'Oesophagoscopy'], [46, 'Upper sphincter dysfunction'], [50, 'Cervical oesophageal cancer'], [47, 'Oesophageal trauma']],
   'Dhingra ch. 67, 68, 69, 93 and K. J. Lee ch. 36, 45',
   ['Constrictions at 15, 25 and 40 cm from the incisors.', 'Achalasia: liquids and solids, bird beak, exclude a cardia cancer.', 'Caustics: alkali penetrates deep; stricture from week 3.', 'Pain after oesophagoscopy is perforation until proved otherwise.'],
   ['Pharyngeal pouch', 'Postcricoid carcinoma', 'Stroke', 'Eosinophilic oesophagitis', 'Globus']),
 T('fbfood', 'mouth', 'Swallowed foreign bodies', 'D70;L36',
   'Most swallowed objects pass; those stuck in the pharynx or oesophagus, sharp ones, magnets and button batteries must be removed under direct vision, the battery within hours.',
   ['pharynx'], ['oesoph', 'fb', 'deepneck'], [[45, 'Oesophagoscopy'], [198, 'Airway foreign bodies']],
   'Dhingra ch. 70 and K. J. Lee ch. 36',
   ['Commonest site: just below the cricopharyngeus.', 'Oesophageal coin is flat on the PA film; tracheal coin is edge-on.', 'Button battery: halo sign, remove immediately, honey or sucralfate en route.', 'Never use a Foley catheter or push it down blind.'],
   ['Airway foreign body', 'Mucosal abrasion', 'Eosinophilic oesophagitis', 'Oesophageal stricture']),
 T('laser', 'larynx', 'Lasers, radiofrequency, cryosurgery and hyperbaric oxygen', 'D71,72;L3',
   'Each energy device works by one principle: which tissue absorbs which wavelength, how hot, how deep. Know the safety rules, above all how to prevent and manage an airway fire.',
   ['larynx'], ['benign', 'lxca', 'osa', 'tonsil'], [[11, 'Transoral laser microsurgery'], [34, 'TLM tongue base'], [159, 'Resurfacing']],
   'Dhingra ch. 71, 72 and K. J. Lee ch. 3',
   ['CO2 (10,600 nm) is absorbed by water; KTP by haemoglobin; Nd:YAG coagulates deeply.', 'CO2 cannot pass through a fibre.', 'Airway fire: stop laser, stop gas, remove tube, saline, reintubate, bronchoscopy.', 'Coblation works at 40 to 70 degrees through a saline plasma.']),
 T('skullbase', 'nose', 'Skull base and the parapharyngeal space', 'L34,49',
   'Skull base tumours present to ENT as a blocked nose, a unilateral effusion, facial numbness, diplopia or a bulge behind the tonsil. Endoscopic endonasal surgery now reaches much of it; in the parapharyngeal space, decide prestyloid or poststyloid.',
   ['sinus', 'itf', 'trigeminal'], ['sinus_ca', 'juv', 'csf', 'npc', 'petrous', 'vascneck'], [[118, 'Anterior cranial base'], [119, 'Transpterygoid'], [124, 'Skull base reconstruction'], [121, 'Infratemporal fossa'], [69, 'Prestyloid parapharyngeal'], [72, 'Neural tumours']],
   'K. J. Lee ch. 34, 49',
   ['Abducens runs free in the cavernous sinus: often the first nerve to fail.', 'Prestyloid mass is usually pleomorphic adenoma; poststyloid is neural or paraganglioma.', 'Never biopsy a parapharyngeal mass through the mouth.', 'Nasoseptal flap is pedicled on the posterior septal artery.'],
   ['Nasopharyngeal carcinoma', 'Pituitary adenoma', 'Chordoma', 'Meningioma', 'Cholesterol granuloma']),
 T('cleft', 'mouth', 'Cleft lip and palate and velopharyngeal insufficiency', 'L52',
   'Cleft care runs from the antenatal scan to the end of growth. ENT owns feeding and airway, the near-universal glue ear, speech and velopharyngeal insufficiency, and the submucous cleft that adenoidectomy unmasks.',
   ['oral', 'pharynx', 'embryo'], ['om', 'adenoid', 'osa', 'paeds_neck'], [[206, 'Cleft palate and VPI'], [37, 'Soft palate'], [54, 'Pharyngoplasty'], [202, 'Mandibular distraction']],
   'K. J. Lee ch. 52',
   ['Tensor veli palatini is the only palatal muscle supplied by V3.', 'Submucous cleft: bifid uvula, zona pellucida, palpable notch.', 'Lip repair at about 3 months, palate at 6 to 12 months.', 'Pharyngeal flap for central gaps; sphincter pharyngoplasty for lateral gaps.'],
   ['Submucous cleft', '22q11 deletion', 'Pierre Robin sequence', 'Stickler syndrome']),
 T('facplast', 'nose', 'Facial plastic surgery', 'L54',
   'Start with analysis: thirds, fifths, angles and skin. Rhinoplasty must fix form and airway together; know the tip supports, valves and grafts, and the complications of eyelid, brow, face and ear surgery and of injectables.',
   ['nose', 'facial', 'extear'], ['extnose', 'septum', 'facefx', 'pinna', 'hnrecon'], [[155, 'Rhinoplasty'], [156, 'Blepharoplasty'], [157, 'Brow lift'], [158, 'Face lift'], [209, 'Otoplasty'], [160, 'Botox and fillers']],
   'K. J. Lee ch. 54',
   ['Major tip supports: lower lateral cartilages, footplate to caudal septum, scroll.', 'Spreader grafts for the internal valve; batten grafts for the external valve.', 'Retrobulbar haematoma after blepharoplasty: lateral canthotomy now.', 'Mustarde sutures make the antihelical fold; Furnas sets back the concha.'],
   ['Body dysmorphic disorder', 'Nasal valve collapse', 'Blepharoptosis']),
 T('hnrecon', 'neck', 'Head and neck reconstruction and facial reanimation', 'L55',
   'Analyse the defect, then restore function and form with the simplest reliable method: grafts, local, regional or free flaps. For facial palsy, the time since injury decides between nerve repair, nerve transfer and muscle transfer.',
   ['facial', 'neck'], ['facial', 'skinca', 'tonsil_ca', 'jaw', 'facplast'], [[162, 'Free flaps'], [170, 'Pectoralis major'], [165, 'Forehead flap'], [27, 'Lip cancer'], [180, 'Facial reanimation'], [179, 'Eyelid reanimation']],
   'K. J. Lee ch. 55',
   ['Concave sites heal well by secondary intention.', 'Abbe for a third to a half of the lip; Karapandzic up to two-thirds.', 'Fibula for the mandible; radial forearm for the tongue; check the Allen test.', 'Facial muscle survives about 18 to 24 months of denervation.']),
 T('hncprinc', 'neck', 'Head and neck cancer: biology, staging and principles', 'L41,48;D73',
   'Tobacco-driven, HPV-driven and EBV-driven squamous cancers behave differently. Stage by AJCC 8, work up with imaging and panendoscopy, decide in the multidisciplinary team, and follow up for recurrence, second primaries and late effects.',
   ['neck'], ['tonsil_ca', 'lxca', 'hypoca', 'npc', 'hnrt', 'neckmass'], [[61, 'Unknown primary'], [45, 'Panendoscopy'], [64, 'Selective neck dissection'], [65, 'Modified radical']],
   'K. J. Lee ch. 41, 48 and Dhingra ch. 73',
   ['Tobacco and alcohol act synergistically.', 'HPV: E6 degrades p53, E7 inactivates Rb, p16 rises.', 'AJCC 8 added depth of invasion, extranodal extension and p16 staging.', 'Treat the N0 neck when occult risk exceeds about 15 to 20%.']),
]
LINKS = {'oesoph': ['esophageal-passage-disorders', 'zenker-diverticulum-1'], 'fbfood': ['foreign-bodies'], 'laser': [],
         'skullbase': ['malignancy-of-the-pterygopalatine-and-infratempo', 'pseudotumors-in-the-apex-of-the-petrous-bone', 'meningioma-with-skull-base-destruction'],
         'cleft': [], 'facplast': [], 'hnrecon': [], 'hncprinc': ['esr-lymph-node-levels']}
p = W + 'data.js'; s = open(p, encoding='utf-8').read()
pre = 'window.CLINIC_DATA='; assert s.startswith(pre)
D = json.loads(s[len(pre):].rstrip().rstrip(';'))
have = {t['id'] for t in D['t']}
add = []
for t in NEW:
    if t['id'] in have: continue
    last = max(i for i, x in enumerate(D['t']) if x['g'] == t['g'])
    D['t'].insert(last + 1, t); add.append(t['id'])
ids = {t['id'] for t in D['t']}
for t in D['t']:
    bad = [r for r in t['rel'] if r not in ids]
    assert not bad, (t['id'], bad)
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
p = W + 'links.js'; s = open(p, encoding='utf-8').read()
i = s.find('window.CLINIC_LINKS='); head = s[:i]; L = json.loads(s[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';'))
for k, v in LINKS.items(): L.setdefault(k, {'im': v, 'rd': []})
open(p, 'w', encoding='utf-8').write(head + 'window.CLINIC_LINKS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('added', add)
