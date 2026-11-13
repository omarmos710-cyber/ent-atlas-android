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
]
LINKS = {'dizzychild': [], 'pituitary': [], 'paeds_ca': []}
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
