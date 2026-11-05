"""Register new Clinical topics (nose batch) in clinic/data.js and clinic/links.js. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, t, src, one, an, rel, ops, srcs, sum_, ddx=()):
    return dict(id=id, t=t, g='nose', src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=list(ddx), tx=[], ops=ops,
                cx=[], pearl=[], an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
NEW = [
 T('atrophic', 'Acute, chronic and atrophic rhinitis', 'D27;L31', 'From the common cold to the wide, crusted, foul nose of atrophic rhinitis: tell simple from hypertrophic rhinitis by the probe, and treat ozaena with hygiene first.',
   ['nose'], ['rhinitis', 'gpa', 'nfb'], [[97, 'Turbinate reduction for hypertrophic rhinitis']], 'Dhingra ch. 27 and K. J. Lee ch. 31',
   ['Colds are viral: treat symptoms, not with antibiotics.', 'Simple rhinitis pits and shrinks; hypertrophic rhinitis does not.', 'Atrophic rhinitis: wide crusted nose, foul smell, merciful anosmia.', 'Douches and glucose-glycerine first; Young\'s operation for resistant cases.'],
   ['Rhinitis sicca', 'Rhinoscleroma', 'Granulomatous disease', 'Nasal foreign body']),
 T('nphys', 'Nasal physiology and disorders of smell', 'D24,35;L27', 'How the nose warms, humidifies, filters and smells, and how to assess a patient who has lost smell or taste.',
   ['nose'], ['rhinitis', 'crs', 'facefx'], [[94, 'Office endoscopy of the olfactory cleft']], 'Dhingra ch. 24, 35 and K. J. Lee ch. 27',
   ['The nose conditions air and clears it on a mucus conveyor belt.', 'Conductive smell loss is blockage; sensorineural is nerve or brain.', 'Commonest causes: viral infection, sinonasal disease, head injury.', 'Test smell, scope the olfactory cleft, and image when the cause is unclear.'],
   ['Chronic rhinosinusitis with polyps', 'Post-viral loss', 'Head injury', 'Olfactory groove meningioma', 'Neurodegenerative disease']),
 T('extnose', 'External nose and nasal vestibule', 'D25;L31,54', 'Infections, deformities and tumours of the outer nose and vestibule: never squeeze a nasal furuncle, and biopsy any non-healing lesion.',
   ['nose'], ['septum', 'facefx', 'congnose'], [[155, 'Rhinoplasty and the nasal valve'], [101, 'Rhinectomy for cancer'], [163, 'Nasal reconstruction']], 'Dhingra ch. 25 and K. J. Lee ch. 31, 54',
   ['A furuncle can spread to the cavernous sinus: antibiotics, never squeeze.', 'Saddle, hump and crooked nose have different causes.', 'Rhinophyma is acne rosacea of the nose.', 'Basal cell carcinoma is the commonest cancer of the nasal skin.'],
   ['Cellulitis', 'Lupus vulgaris', 'Basal and squamous cell carcinoma']),
 T('congnose', 'Choanal atresia and congenital nasal masses', 'D25,29;L31,53', 'A newborn who goes blue when feeding and pink when crying has bilateral choanal atresia until proven otherwise. A midline nasal mass in a child is never biopsied before imaging.',
   ['nose', 'embryo'], ['csf', 'extnose', 'nfb'], [[189, 'Choanal atresia and pyriform aperture stenosis'], [190, 'Midline nasal masses']], 'Dhingra ch. 25, 29 and K. J. Lee ch. 31, 53',
   ['Bilateral choanal atresia is an airway emergency: oral airway, then repair.', 'Unilateral atresia presents later with one-sided discharge.', 'Dermoid, glioma and encephalocele: image before biopsy.', 'Furstenberg sign suggests encephalocele.'],
   ['Pyriform aperture stenosis', 'Nasolacrimal duct cyst', 'Haemangioma']),
 T('nfb', 'Nasal foreign bodies, rhinoliths and myiasis', 'D29;L53', 'A child with a one-sided, foul nasal discharge has a foreign body until proven otherwise; a button battery is an emergency.',
   ['nose'], ['atrophic', 'congnose', 'epistaxis'], [], 'Dhingra ch. 29 and K. J. Lee ch. 53',
   ['One-sided foul discharge in a child: foreign body.', 'Button batteries and magnets: remove urgently.', 'Rhinolith: a stone around an old foreign body.', 'Maggots: kill them first, then remove; look for the cause.'],
   ['Choanal atresia', 'Sinusitis', 'Tumour']),
 T('csf', 'CSF rhinorrhoea', 'D29;L34', 'Clear, salty, one-sided drip that increases on bending forward, after trauma or surgery or for no reason: prove it is CSF with beta-2 transferrin, find the leak, and close it to prevent meningitis.',
   ['sinus', 'nose'], ['facefx', 'sinussurg', 'congnose'], [[116, 'Endoscopic repair of CSF leaks'], [124, 'Reconstruction after skull base surgery']], 'Dhingra ch. 29 and K. J. Lee ch. 34',
   ['Beta-2 transferrin confirms CSF.', 'High-resolution CT finds the bony defect; cisternography or MRI if needed.', 'Most traumatic leaks stop with conservative care.', 'Endoscopic repair succeeds in over 90%.'],
   ['Vasomotor rhinitis', 'Allergic rhinitis']),
 T('facefx', 'Nasal and facial fractures', 'D34;L56,57', 'Airway, bleeding and the eye first; then examine the septum for a haematoma, reduce the nasal fracture within two weeks, and know your Le Fort and blow-out fractures.',
   ['nose', 'orbit', 'sinus'], ['septum', 'csf', 'orbit'], [[186, 'Cranio-orbital and midfacial fractures'], [187, 'Fractures of the orbit'], [185, 'Fractures of the mandible'], [95, 'Septoplasty for septal fractures'], [155, 'Rhinoplasty for late deformity']], 'Dhingra ch. 34 and K. J. Lee ch. 56, 57',
   ['Look for a septal haematoma in every nasal injury.', 'Reduce a displaced nasal fracture within about two weeks.', 'Le Fort I, II and III separate the maxilla at different levels.', 'Blow-out fracture: diplopia on upgaze, entrapment, enophthalmos.'],
   ['Septal haematoma', 'CSF leak', 'Orbital haematoma']),
 T('orbit', 'Proptosis and the orbit', 'D41;L58', 'Proptosis is the eye pushed forward; its direction, speed and laterality point to the cause, from thyroid eye disease to sinus mucoceles and tumours.',
   ['orbit', 'sinus'], ['abs', 'sinus_ca', 'afs'], [[151, 'Orbital decompression'], [150, 'Optic nerve decompression'], [149, 'Dacryocystorhinostomy'], [152, 'Orbital abscess drainage'], [153, 'Lateral canthotomy'], [154, 'Orbital exenteration']], 'Dhingra ch. 41 and K. J. Lee ch. 58',
   ['Thyroid eye disease is the commonest cause in adults.', 'Orbital cellulitis is the commonest cause in children.', 'Direction of displacement points to the source.', 'Retrobulbar haemorrhage: lateral canthotomy within minutes.'],
   ['Thyroid eye disease', 'Orbital cellulitis', 'Mucocele', 'Sinonasal tumour', 'Lymphoma']),
 T('sinussurg', 'Nose and sinus operations: principles', 'D84,85,86,87,88,89,90;L33,34', 'Know each operation by what it opens and what it risks: from antral puncture and Caldwell-Luc to septoplasty and endoscopic sinus surgery, with the complications that matter.',
   ['sinus', 'nose'], ['crs', 'abs', 'septum'], [[94, 'Office endoscopy'], [95, 'Septoplasty'], [97, 'Turbinates'], [102, 'Balloon dilation'], [103, 'Antrostomy'], [104, 'Caldwell-Luc'], [105, 'Oroantral fistula'], [108, 'Ethmoidectomy'], [109, 'External ethmoidectomy'], [110, 'Sphenoidotomy'], [111, 'Frontal trephination'], [112, 'Endoscopic frontal sinus'], [113, 'Draf III'], [114, 'Osteoplastic flap'], [115, 'Cranialisation'], [117, 'Endonasal pituitary surgery']], 'Dhingra ch. 84 to 90 and K. J. Lee ch. 33, 34',
   ['Septoplasty has replaced submucous resection.', 'Endoscopic sinus surgery restores drainage through the natural ostia.', 'Major complications: orbital injury, CSF leak, carotid injury.', 'Know the danger areas: lamina papyracea, cribriform plate, anterior ethmoidal artery.'],
   ['']),
]
LINKS = {'csf': ['dural-defect-after-sinonasal-surgery', 'anterior-skull-fractures', 'meningoencephalocele'],
         'facefx': ['fracture-of-the-nasal-bone-and-retention-cysts', 'blow-out-fracture', 'anterior-skull-fractures'],
         'orbit': ['orbital-decompression-in-graves-disease', 'amyloidosis-in-the-orbit', 'mucocele', 'osteoma-gardner-syndrome-and-complications', 'nasolacrimal-mucocele', 'orbital-cellulitis'],
         'congnose': ['choanal-atresia', 'piriform-aperture-malformation', 'meningoencephalocele', 'nasolacrimal-mucocele'],
         'sinussurg': ['dural-defect-after-sinonasal-surgery', 'mucocele-of-the-frontal-recess'], 'nphys': [], 'extnose': [], 'nfb': [], 'atrophic': []}
p = W + 'data.js'; s = open(p, encoding='utf-8').read()
pre = 'window.CLINIC_DATA='; assert s.startswith(pre)
body = s[len(pre):].rstrip().rstrip(';'); D = json.loads(body)
have = {t['id'] for t in D['t']}
last = max(i for i, t in enumerate(D['t']) if t['g'] == 'nose')
add = [t for t in NEW if t['id'] not in have]
for t in add: t['ddx'] = [x for x in t['ddx'] if x]
D['t'][last + 1:last + 1] = add
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
p = W + 'links.js'; s = open(p, encoding='utf-8').read()
i = s.find('window.CLINIC_LINKS='); head = s[:i]; rest = s[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';')
L = json.loads(rest)
for k, v in LINKS.items(): L.setdefault(k, {'im': v, 'rd': []})
open(p, 'w', encoding='utf-8').write(head + 'window.CLINIC_LINKS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('added', [t['id'] for t in add])
