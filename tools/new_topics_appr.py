"""Create the "Approach to" branch of the Clinical library (group 'appr', sub-grouped by 'sys').
Moves the symptom-led articles that already existed, cross-lists two disease articles, and registers the new ones.
Sources: Oxford Textbook of Otolaryngology (Phillips & Bhalla, 2025) = OT; Oxford Specialist Handbook of
Otolaryngology HNS (2nd ed.) = OS; Oxford Handbook of ENT and HNS (3rd ed., 2020) = OH; Dhingra = D; K. J. Lee = L.
Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, sys, t, src, one, an, rel, ops, srcs, sum_, ddx=()):
    return dict(id=id, t=t, g='appr', sys=sys, src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=list(ddx), tx=[], ops=ops,
                cx=[], pearl=[], an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
OX = 'Oxford Textbook of Otolaryngology ch. %s, Oxford Specialist Handbook ch. 3, Oxford Handbook of ENT ch. 3'
MOVE = {  # existing articles that are already symptom-led: keep their ids, move them into the branch
 'hl': ('ear', 'Approach to hearing loss'), 'otalgia': ('ear', 'Approach to earache'), 'tinnitus': ('ear', 'Approach to tinnitus'),
 'stridor': ('larynx', 'Approach to stridor and the threatened airway'), 'neckmass': ('neck', 'Approach to a lump in the neck')}
XAP = {'epistaxis': 'nose', 'osa': 'mouth'}   # disease articles also listed under Approach
NEW = [
 T('ap_otorr', 'ear', 'Approach to the discharging ear', 'OT8,84;OS3;D10,11',
   'Look at the drum, not just the pus: clean the canal under the microscope, then decide whether the discharge comes from the canal, a perforation or a retraction pocket. Persistent, foul or bloody discharge with pain, palsy or vertigo is a complication or a cancer until proved otherwise.',
   ['extear', 'midear'], ['oe', 'csom', 'chole', 'om', 'icc', 'extca', 'tbom'], [], OX % '8, 84' + ', Dhingra ch. 10, 11',
   ['Microsuction first: you cannot diagnose through pus.', 'Mucoid = middle ear; scanty foul = cholesteatoma; watery after trauma = CSF.', 'Diabetic, severe pain, granulation on the canal floor = necrotising otitis externa.', 'Facial palsy, vertigo or headache with discharge = a complication.'],
   ['Otitis externa', 'Mucosal chronic otitis media', 'Cholesteatoma', 'Necrotising otitis externa', 'CSF otorrhoea', 'Carcinoma of the canal']),
 T('ap_dizzy', 'ear', 'Approach to dizziness and vertigo', 'OT7,14,15,85;OS3;D7;L16',
   'Ask about timing and triggers before the word "dizzy": seconds with head movement is BPPV, minutes to hours with ear symptoms is Ménière\'s disease or vestibular migraine, days of continuous vertigo is neuritis or stroke. In acute continuous vertigo, HINTS separates the ear from the brain.',
   ['inner', 'vessels'], ['vertigo', 'meniere', 'vs', 'fistula', 'scd', 'vest', 'tbfx'], [], OX % '7, 14, 15, 85' + ', Dhingra ch. 7, K. J. Lee ch. 16',
   ['Classify by timing and trigger: episodic triggered, episodic spontaneous, acute continuous, chronic.', 'Dix–Hallpike for positional vertigo; HINTS for acute continuous vertigo.', 'A normal head impulse in acute vertigo is a red flag for stroke.', 'Vestibular migraine is the commonest cause of spontaneous episodic vertigo.'],
   ['BPPV', 'Vestibular neuritis', 'Ménière\'s disease', 'Vestibular migraine', 'Posterior circulation stroke', 'Persistent postural-perceptual dizziness']),
 T('ap_full', 'ear', 'Approach to a blocked or full ear', 'OT9,12;OS3;D5',
   'A full ear is wax, fluid, a stiff Eustachian tube, or the inner ear. Look first, then test: tympanometry separates the middle ear from the cochlea, and a fullness with low-frequency hearing loss may be early Ménière\'s or a sudden loss that needs steroids today.',
   ['extear', 'midear', 'et', 'inner'], ['et', 'om', 'ssnhl', 'meniere', 'scd', 'npc', 'otosc'], [], OX % '9, 12' + ', Dhingra ch. 5',
   ['Otoscopy and tympanometry before anything else.', 'Sudden sensorineural loss presents as a blocked ear: test the hearing that day.', 'Unilateral effusion in an adult: examine the nasopharynx.', 'Autophony: patulous tube or superior canal dehiscence.'],
   ['Wax', 'Eustachian tube dysfunction', 'Otitis media with effusion', 'Sudden sensorineural hearing loss', 'Ménière\'s disease', 'Patulous Eustachian tube']),
 T('ap_face', 'ear', 'Approach to facial weakness', 'OT10;OS3,17;D8;L19',
   'First decide upper or lower motor neuron: a spared forehead means a central lesion. Then look along the nerve from the brainstem to the parotid before calling it Bell\'s palsy, protect the eye, and start steroids within 72 hours.',
   ['facial', 'temporal'], ['facial', 'tbfx', 'chole', 'saltum', 'vs', 'oe'], [], OX % '10' + ', Oxford Specialist Handbook ch. 17, Dhingra ch. 8, K. J. Lee ch. 19',
   ['Forehead spared = upper motor neuron.', 'Examine ear, parotid, other cranial nerves and skin for vesicles.', 'Prednisolone within 72 hours; eye protection always.', 'Slowly progressive or recurrent same-side palsy = tumour until imaged.'],
   ['Bell\'s palsy', 'Ramsay Hunt syndrome', 'Stroke', 'Cholesteatoma', 'Parotid malignancy', 'Temporal bone fracture']),
 T('ap_block', 'nose', 'Approach to nasal obstruction', 'OT33,78;OS3;D26,28',
   'Separate fixed from fluctuating, and unilateral from bilateral. Bilateral fluctuating blockage is mucosal (rhinitis, polyps); fixed unilateral blockage is structural or a mass, and a unilateral mass with bleeding needs endoscopy and imaging.',
   ['nose', 'sinus'], ['septum', 'rhinitis', 'crs', 'adenoid', 'sinus_ca', 'juv', 'congnose', 'nfb', 'facplast'], [], OX % '33, 78' + ', Dhingra ch. 26, 28',
   ['Fixed and one-sided: structural or a mass.', 'Fluctuating and two-sided: mucosal.', 'Children: adenoids, foreign body, choanal atresia.', 'Unilateral blockage with bleeding or pain: a tumour until proved otherwise.'],
   ['Deviated septum', 'Allergic rhinitis', 'Nasal polyps', 'Adenoid hypertrophy', 'Nasal valve collapse', 'Sinonasal tumour']),
 T('ap_rhin', 'nose', 'Approach to a runny nose', 'OT29,77;OS3;D28',
   'Rhinorrhoea is usually rhinitis, but the unilateral, clear, positional drip is CSF until beta-2 transferrin says otherwise, and a unilateral purulent or bloody discharge is a foreign body in a child and a tumour in an adult.',
   ['nose', 'sinus'], ['rhinitis', 'crs', 'abs', 'csf', 'nfb', 'sinus_ca', 'afs'], [], OX % '29, 77' + ', Dhingra ch. 28',
   ['Clear and watery from one side: test for CSF.', 'Unilateral purulent in a child: foreign body.', 'Gustatory rhinorrhoea is cholinergic: ipratropium.', 'Rhinitis medicamentosa: stop the decongestant.'],
   ['Allergic rhinitis', 'Non-allergic rhinitis', 'Chronic rhinosinusitis', 'CSF leak', 'Foreign body', 'Sinonasal tumour']),
 T('ap_pnd', 'nose', 'Approach to postnasal drip and catarrh', 'OT30;D28',
   'Catarrh is common and often has no single cause. Look for rhinosinusitis, reflux and a sensitive pharynx, treat what you find, and reassure; the nasopharynx must still be examined in anyone with a unilateral effusion or neck node.',
   ['nose', 'pharynx'], ['crs', 'rhinitis', 'laryngitis', 'pharyngitis', 'npc', 'adenoid'], [], OX % '30' + ', Dhingra ch. 28',
   ['Endoscope the nose and nasopharynx.', 'Treat rhinosinusitis first: saline and steroid spray for 2 to 3 months.', 'Catarrh without findings: explain, avoid antibiotics.', 'Persistent unilateral signs: biopsy.'],
   ['Chronic rhinosinusitis', 'Rhinitis', 'Laryngopharyngeal reflux', 'Chronic nasal catarrh syndrome', 'Nasopharyngeal mass']),
 T('ap_pain', 'nose', 'Approach to facial pain and headache', 'OT31;OS3;D33',
   'Most facial pain is not sinusitis. Sinus pain comes with blockage, discharge or loss of smell and an abnormal endoscopy; without them, think migraine, tension-type pain, midfacial segment pain, neuralgia, the teeth and the jaw.',
   ['sinus', 'trigeminal', 'nose'], ['crs', 'abs', 'sinus_ca', 'npc', 'skullbase'], [], OX % '31' + ', Dhingra ch. 33',
   ['No nasal symptoms and normal endoscopy: it is not sinusitis.', 'Midfacial segment pain responds to low-dose amitriptyline.', 'Trigeminal neuralgia: carbamazepine and MRI.', 'Numbness with pain = perineural tumour until imaged.'],
   ['Migraine', 'Tension-type headache', 'Midfacial segment pain', 'Trigeminal neuralgia', 'Temporomandibular disorder', 'Acute or chronic rhinosinusitis']),
 T('ap_smell', 'nose', 'Approach to loss of smell', 'OT26;D28;L30',
   'Find out whether air reaches the olfactory cleft (polyps, CRS) or the nerve has failed (viral, trauma, ageing, neurodegeneration). Test smell, examine the cleft, image when unexplained, and start olfactory training early.',
   ['nose'], ['nphys', 'crs', 'rhinitis', 'sinus_ca', 'skullbase'], [], OX % '26' + ', Dhingra ch. 28, K. J. Lee ch. 30',
   ['Conductive: polyps, CRS — oral steroid trial helps.', 'Sensorineural: post-viral, head injury, age, Parkinson\'s.', 'Psychophysical testing (Sniffin\' Sticks, UPSIT).', 'Olfactory training twice daily for months.'],
   ['Chronic rhinosinusitis with polyps', 'Post-viral olfactory loss', 'Head injury', 'Neurodegenerative disease', 'Olfactory neuroblastoma']),
 T('ap_epiph', 'nose', 'Approach to the watering eye', 'OT32;D33',
   'Decide whether the eye makes too many tears or drains too few. Lid malposition and dry eye are treated by the ophthalmologist; nasolacrimal duct obstruction with a positive syringing test is cured by dacryocystorhinostomy, done endoscopically by the ENT surgeon.',
   ['orbit', 'nose'], ['orbit', 'sinussurg', 'sinus_ca', 'facefx'], [], OX % '32' + ', Dhingra ch. 33',
   ['Hypersecretion versus drainage failure.', 'Syringing and probing localise the block.', 'Endoscopic DCR for nasolacrimal duct obstruction.', 'Bloody tears or a mass at the medial canthus: image and biopsy.'],
   ['Nasolacrimal duct obstruction', 'Dry eye with reflex tearing', 'Lid malposition', 'Dacryocystitis', 'Lacrimal sac tumour']),
 T('ap_crust', 'nose', 'Approach to nasal crusting', 'OT34;D27,28',
   'Crusting means the mucosa has lost its ability to clear: surgery, atrophy, vasculitis, infection, drugs or a tumour. Biopsy the edge of ulceration, check ANCA and serology, and ask about cocaine before calling it atrophic rhinitis.',
   ['nose'], ['atrophic', 'gpa', 'septum', 'sinussurg', 'rhinitis'], [], OX % '34' + ', Dhingra ch. 27, 28',
   ['Post-surgical crusting is common and self-limiting.', 'Perforation plus crusting: GPA, cocaine, TB, sarcoid, tumour.', 'Bloods: ANCA, ACE, syphilis serology.', 'Douching is the treatment for most.'],
   ['Post-surgical', 'Atrophic rhinitis', 'Granulomatosis with polyangiitis', 'Cocaine-induced midline destruction', 'Sarcoidosis', 'NK/T-cell lymphoma']),
 T('ap_sore', 'mouth', 'Approach to a sore throat', 'OT49,76;OS3;D50,51',
   'Most sore throats are viral and self-limiting. The work is to recognise the bacterial ones that benefit from penicillin, the complications that need drainage, the airway that needs securing, and the persistent unilateral sore throat in a smoker that needs a biopsy.',
   ['pharynx', 'oral'], ['pharyngitis', 'tonsil', 'deepneck', 'croup', 'tonsil_ca', 'hivent'], [], OX % '49, 76' + ', Dhingra ch. 50, 51',
   ['Centor or FeverPAIN to decide on antibiotics.', 'Trismus, drooling, muffled voice: quinsy or deep neck abscess.', 'Stridor or toxic patient: epiglottitis — airway first.', 'Over 3 weeks, unilateral, otalgia: examine for cancer.'],
   ['Viral pharyngitis', 'Streptococcal tonsillitis', 'Infectious mononucleosis', 'Peritonsillar abscess', 'Supraglottitis', 'Oropharyngeal carcinoma']),
 T('ap_ulcer', 'mouth', 'Approach to a mouth ulcer', 'OT54;OS3;D47',
   'Ask how many, how long and how often. Recurrent small ulcers that heal in two weeks are aphthae; a single ulcer that persists beyond three weeks is cancer until biopsy says otherwise.',
   ['oral'], ['oraldis', 'tonsil_ca', 'oralbenign', 'hivent', 'tbom'], [], OX % '54' + ', Dhingra ch. 47',
   ['Single, persistent over 3 weeks, indurated: biopsy.', 'Recurrent and healing: aphthous, check blood count, ferritin, B12, folate, coeliac.', 'Multiple with skin, eye or genital lesions: systemic disease.', 'Remove trauma and review in 2 weeks.'],
   ['Traumatic ulcer', 'Recurrent aphthous stomatitis', 'Squamous cell carcinoma', 'Herpetic stomatitis', 'Lichen planus', 'Behçet disease']),
 T('ap_hoarse', 'larynx', 'Approach to the hoarse voice', 'OT47,79;OS3;D60,62',
   'Every voice change lasting more than three weeks needs the larynx seen, and in a smoker that means within two weeks. The history points to the cause; the laryngoscope, ideally with stroboscopy, makes the diagnosis.',
   ['larynx'], ['benign', 'lxca', 'vfp', 'laryngitis', 'voice', 'croup', 'thyroid'], [], OX % '47, 79' + ', Dhingra ch. 60, 62',
   ['Over 3 weeks: laryngoscopy.', 'Smoker, pain, otalgia, dysphagia, neck node: urgent suspected-cancer pathway.', 'Breathy voice and weak cough: palsy — image skull base to arch.', 'Normal larynx: think muscle tension dysphonia, but look again if it does not improve.'],
   ['Acute laryngitis', 'Vocal fold nodules, polyps and cysts', 'Reinke\'s oedema', 'Laryngeal carcinoma', 'Vocal fold palsy', 'Muscle tension dysphonia']),
 T('ap_dysph', 'larynx', 'Approach to difficulty swallowing', 'OT48,80;OS3;D67,68',
   'Locate it (mouth and pharynx, or oesophagus), characterise it (solids or liquids first) and time it (progressive or intermittent). Progressive dysphagia with weight loss needs endoscopy within two weeks.',
   ['pharynx', 'larynx'], ['oesoph', 'pouch', 'hypoca', 'fbfood', 'laryngitis', 'vfp'], [], OX % '48, 80' + ', Dhingra ch. 67, 68',
   ['Coughing and nasal regurgitation: oropharyngeal (neurological).', 'Solids then liquids, weight loss: cancer.', 'Liquids and solids from the start: achalasia.', 'Regurgitation of old food, gurgling: pharyngeal pouch.'],
   ['Stroke and neuromuscular disease', 'Oesophageal or hypopharyngeal carcinoma', 'Pharyngeal pouch', 'Achalasia', 'Peptic stricture', 'Eosinophilic oesophagitis']),
 T('ap_globus', 'larynx', 'Approach to a lump in the throat', 'OT48;OS3;D63',
   'Globus is a midline, intermittent sensation, worse when swallowing saliva and better with food, in a patient who otherwise swallows normally. Examine fully to exclude the red flags, then explain it well; that is most of the treatment.',
   ['pharynx', 'larynx'], ['laryngitis', 'hypoca', 'pouch', 'thyroid', 'oesoph'], [], OX % '48' + ', Dhingra ch. 63',
   ['Globus: midline, comes and goes, eating relieves it.', 'Red flags: true dysphagia, pain, otalgia, lateralised, voice change, weight loss, neck lump.', 'Flexible nasendoscopy in clinic; no routine barium.', 'Reassurance, reflux measures, speech therapy.'],
   ['Globus pharyngeus', 'Laryngopharyngeal reflux', 'Cricopharyngeal hypertonicity', 'Hypopharyngeal carcinoma', 'Thyroid enlargement']),
 T('ap_saliv', 'neck', 'Approach to a swollen salivary gland', 'OT58,82;OS7;D45,46',
   'Ask whether the swelling comes with meals (obstruction), is acute and painful (infection), is bilateral and diffuse (systemic), or is a discrete lump (tumour). A discrete parotid lump with facial weakness or pain is malignant until proved otherwise.',
   ['salivary'], ['salivary', 'saltum', 'hivent', 'paeds_neck'], [], OX % '58, 82' + ', Oxford Specialist Handbook ch. 7, Dhingra ch. 45, 46',
   ['Meal-related swelling: stone or stricture.', 'Bilateral diffuse: mumps, Sjögren, sialosis, HIV, sarcoid.', 'Discrete lump: ultrasound and FNA.', 'Children: parotid lumps are more often malignant than in adults.'],
   ['Sialolithiasis', 'Acute bacterial sialadenitis', 'Sjögren syndrome', 'Pleomorphic adenoma', 'Salivary malignancy', 'Juvenile recurrent parotitis']),
]
p = W + 'data.js'; s = open(p, encoding='utf-8').read()
pre = 'window.CLINIC_DATA='; assert s.startswith(pre)
D = json.loads(s[len(pre):].rstrip().rstrip(';'))
D['g']['appr'] = 'Approach to'
by = {t['id']: t for t in D['t']}
for k, (sys_, title) in MOVE.items():
    by[k]['g'] = 'appr'; by[k]['sys'] = sys_; by[k]['t'] = title
for k, sys_ in XAP.items():
    by[k]['xap'] = sys_
add = []
for t in NEW:
    if t['id'] in by: by[t['id']].update({k: v for k, v in t.items()}); continue
    D['t'].append(t); add.append(t['id'])
ids = {t['id'] for t in D['t']}
for t in D['t']:
    bad = [r for r in t['rel'] if r not in ids]
    assert not bad, (t['id'], bad)
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
p = W + 'links.js'; s = open(p, encoding='utf-8').read()
i = s.find('window.CLINIC_LINKS='); head = s[:i]; L = json.loads(s[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';'))
for t in NEW: L.setdefault(t['id'], {'im': [], 'rd': []})
open(p, 'w', encoding='utf-8').write(head + 'window.CLINIC_LINKS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('added', add)
