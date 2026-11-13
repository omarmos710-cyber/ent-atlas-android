"""Register the curriculum-gap Clinical topics (JCST 2021 syllabus) in clinic/data.js and clinic/links.js. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, g, t, src, one, an, rel, ops, srcs, sum_, ddx=()):
    return dict(id=id, t=t, g=g, src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=list(ddx), tx=[], ops=ops,
                cx=[], pearl=[], an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
NEW = [
 T('dizzychild', 'ear', 'The dizzy child', 'OT85',
   'Sort the attacks by how long they last, test the hearing in every child, and look for the few signs that point to the brain. Most dizzy children have a migraine variant, glue ear or a viral vestibular upset.',
   ['inner'], ['vertigo', 'vest', 'om', 'deaf', 'meniere', 'ap_dizzy'], [[129, 'Grommets'], [146, 'Surgery for vertigo']],
   'Oxford Textbook of Otolaryngology ch. 85',
   ['BPVC: seconds-long spells at 2 to 6 years, normal between, no hearing loss; a migraine precursor.', 'Vestibular migraine leads in older children; family history in most.', 'Glue ear makes children clumsy rather than giddy.', 'BPPV in a child almost always follows head injury.', 'Red flags: ataxia between attacks, morning headache, focal signs, central nystagmus.'],
   ['Benign paroxysmal vertigo of childhood', 'Vestibular migraine', 'Otitis media with effusion', 'Vestibular neuritis', 'Posterior fossa tumour']),
 T('pituitary', 'nose', 'Pituitary tumours and sellar lesions', 'L6,34;OT44;D90',
   'The pituitary is reached through the sphenoid sinus. Prolactinomas are treated with tablets, other functioning adenomas and those threatening vision with surgery; know the sphenoid anatomy that protects the carotids and optic nerves, and watch the sodium after surgery.',
   ['sinus', 'skullbones'], ['skullbase', 'csf', 'sinussurg', 'orbit'], [[117, 'Endonasal approach to the sella'], [124, 'Skull base reconstruction'], [110, 'Sphenoidotomy']],
   'K. J. Lee ch. 6, 34, Oxford Textbook of Otolaryngology ch. 44 and Dhingra ch. 90',
   ['Chiasm above, cavernous sinuses with the carotid and nerves III to VI beside.', 'Prolactinoma: cabergoline or bromocriptine first.', 'Stalk effect: modest prolactin rise from stalk compression.', 'Apoplexy: hydrocortisone first, then decompression.', 'Diabetes insipidus early; SIADH about a week later.'],
   ['Rathke cleft cyst', 'Craniopharyngioma', 'Meningioma', 'Empty sella', 'Carotid aneurysm']),
 T('paeds_ca', 'neck', 'Head and neck cancer in children', 'OT81;OS23;L24,34',
   'Childhood head and neck cancer is lymphoma, sarcoma, neural tumour or thyroid cancer, rarely squamous carcinoma. Recognise the lump that does not behave, image it, X-ray the chest before any anaesthetic, and take tissue the way the pathologist needs it.',
   ['neck'], ['paeds_neck', 'neckmass', 'thyroid', 'npc', 'saltum', 'hncprinc'], [[60, 'Fine-needle aspiration'], [78, 'Thyroidectomy'], [92, 'Parotidectomy']],
   'Oxford Textbook of Otolaryngology ch. 81, Oxford Specialist Handbook ch. 23 and K. J. Lee ch. 24, 34',
   ['Lymphoma is the commonest; squamous carcinoma is rare.', 'Chest X-ray before anaesthesia: the mediastinal mass.', 'Lymphoma node: excise it and send it fresh.', 'Rhabdomyosarcoma: orbital best, parameningeal worst; the bleeding aural polyp.', 'Neuroblastoma: Horner syndrome, heterochromia, raised HVA and VMA.'],
   ['Reactive lymphadenopathy', 'Atypical mycobacterial infection', 'Branchial cyst', 'Lymphatic malformation']),
 T('earminor', 'ear', 'Pinna haematoma and preauricular sinus', 'OS15;D8;L53;OT85',
   'Drain a pinna haematoma and hold the skin to the cartilage with a bolster so it cannot re-collect; excise a preauricular sinus widely down to the temporalis fascia rather than chasing its branches.',
   ['extear'], ['pinna', 'perich', 'atresia', 'paeds_neck'], [],
   'Oxford Specialist Handbook ch. 15, Dhingra ch. 8, K. J. Lee ch. 53, Oxford Textbook of Otolaryngology ch. 85 and the literature',
   ['Haematoma under a third of the pinna: aspirate and compress; larger or recurrent: incise and bolster.', 'Bolsters for about a week; antibiotics for delay, infection or repeat drainage.', 'Infant with a pinna haematoma: think of non-accidental injury.', 'Preauricular sinus: excise only after recurrent infection, once settled.', 'Supra-auricular approach recurs less (about 2%) than simple sinectomy (about 5.5%).'],
   ['Perichondritis', 'Relapsing polychondritis', 'First branchial cleft anomaly', 'Infected sebaceous cyst']),
 T('mouthminor', 'mouth', 'Quinsy drainage, tongue-tie, lip biopsy and drooling', 'OH24;OS24;D43;L35;OT82',
   'Small procedures with one safety rule each: guard the needle in the tonsil bed, stay clear of the submandibular ducts under the tongue, take mucosa only in a lip biopsy, and never redirect saliva backwards in a child who aspirates.',
   ['oral', 'pharynx', 'salivary'], ['tonsil', 'deepneck', 'salivary', 'ap_saliv', 'oralanat', 'paeds_vs'], [[192, 'Tonsillectomy'], [91, 'Excision of the submandibular gland']],
   'Oxford Handbook of ENT ch. 24, Oxford Specialist Handbook ch. 24, Dhingra ch. 43, K. J. Lee ch. 35, Oxford Textbook of Otolaryngology ch. 82 and the literature',
   ['Quinsy: three-point aspiration with the needle guarded to 1 cm; incise if it fails or recurs.', 'Interval tonsillectomy after a second quinsy.', 'Frenotomy eases maternal nipple pain; evidence on feeding is weak.', 'Lip biopsy focus score of 1 or more scores 3 points in the Sjogren criteria.', 'Drooling: anterior or posterior; no duct relocation in children who aspirate.'],
   ['Peritonsillar cellulitis', 'Parapharyngeal abscess', 'Sialadenitis', 'Ranula']),
 T('fona', 'larynx', 'Emergency front-of-neck airway and arterial ligation', 'OH12;OT52;OS20;OT27;L33',
   'In a can\'t intubate, can\'t oxygenate emergency, go through the cricothyroid membrane with scalpel, bougie and tube. For bleeding that will not stop, tie the artery nearest the bleed: sphenopalatine, ethmoidal, maxillary, and the external carotid only as a last resort.',
   ['larynx', 'vessels'], ['stridor', 'anaes', 'trach', 'epistaxis', 'lxtrauma', 'tonsil'], [[19, 'Open tracheostomy'], [98, 'Sphenopalatine artery ligation'], [99, 'Ethmoid artery ligation']],
   'Oxford Handbook of ENT ch. 12, Oxford Textbook of Otolaryngology ch. 27 and 52, Oxford Specialist Handbook ch. 20, K. J. Lee ch. 33 and the literature',
   ['CICO: declare it; scalpel, bougie, 6.0 cuffed tube through the cricothyroid membrane.', 'Membrane impalpable: vertical midline incision and finger dissection.', 'Children under about 12: needle cricothyroidotomy; convert any emergency airway to a tracheostomy.', 'Ethmoidal arteries: 24-12-6 mm behind the anterior lacrimal crest to the optic nerve.', 'External carotid: identify by its branches; rebleeding up to about 45%.'],
   ['Laryngeal tumour', 'Angio-oedema', 'Supraglottitis', 'Post-tonsillectomy haemorrhage']),
]
LINKS = {'dizzychild': [], 'pituitary': [], 'paeds_ca': [], 'earminor': [], 'mouthminor': [], 'fona': []}
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
