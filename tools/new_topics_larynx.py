"""Register new Clinical topics (larynx and airway batch) in clinic/data.js and clinic/links.js. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, t, src, one, an, rel, ops, srcs, sum_, ddx=()):
    return dict(id=id, t=t, g='larynx', src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=list(ddx), tx=[], ops=ops,
                cx=[], pearl=[], an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
NEW = [
 T('lxanat', 'Applied anatomy and physiology of the larynx', 'D56,60;L50', 'Cartilages, membranes, spaces and two nerves explain laryngology: why glottic cancer rarely spreads, why the left recurrent nerve fails more often, and why an infant airway closes so fast.',
   ['larynx'], ['vfp', 'lxca', 'lxcong'], [], 'Dhingra ch. 56, 60 and K. J. Lee ch. 50',
   ['Posterior cricoarytenoid is the only abductor.', 'Cricothyroid is supplied by the external laryngeal nerve.', 'The glottis has almost no lymphatics; supraglottis drains richly and bilaterally.', 'In infants the subglottis is the narrowest part.']),
 T('lxtrauma', 'Laryngotracheal trauma and stenosis', 'D57;L50', 'A laryngeal fracture can talk and breathe on arrival and obstruct hours later. Secure the airway by tracheostomy, repair the framework early, and prevent the stenosis that follows intubation.',
   ['larynx'], ['stridor', 'trach', 'vfp'], [[8, 'Laryngeal trauma'], [10, 'Acquired laryngeal stenosis'], [199, 'Tracheal stenosis'], [21, 'Laryngotracheal reconstruction'], [22, 'Tracheal resection']], 'Dhingra ch. 57 and K. J. Lee ch. 50',
   ['Loss of thyroid prominence, emphysema and crepitus.', 'Tracheostomy under local anaesthesia, not blind intubation.', 'Repair displaced fractures and tears within days.', 'Intubation is the commonest cause of subglottic stenosis.'],
   ['Cervical spine injury', 'Oesophageal perforation', 'Vascular injury']),
 T('laryngitis', 'Chronic laryngitis, reflux and specific infections', 'D58;L50', 'Chronic laryngitis is a description, not a diagnosis: find the smoking, reflux, voice misuse or infection behind it, and biopsy anything that might be tuberculosis or cancer.',
   ['larynx'], ['croup', 'benign', 'lxca'], [], 'Dhingra ch. 58 and K. J. Lee ch. 50',
   ['Smoking, reflux and voice misuse dominate.', 'Laryngopharyngeal reflux: posterior oedema; twice-daily PPI for months.', 'Tuberculosis favours the posterior larynx; lupus the anterior.', 'Biopsy persistent lesions.'],
   ['Laryngeal carcinoma', 'Tuberculosis', 'Sarcoidosis', 'Granulomatosis with polyangiitis', 'Candidiasis']),
 T('lxcong', 'Congenital lesions of the larynx', 'D59;L50,53', 'Most noisy babies have laryngomalacia and outgrow it; recognise the stenosis, paralysis, haemangioma, web and cleft that need more, and look at the whole airway when symptoms are severe.',
   ['larynx', 'embryo'], ['stridor', 'croup', 'vfp'], [[193, 'Supraglottoplasty'], [194, 'Subglottic stenosis'], [195, 'Laryngeal cleft repair']], 'Dhingra ch. 59 and K. J. Lee ch. 50, 53',
   ['Laryngomalacia is the commonest; normal cry, better prone.', 'Subglottic stenosis: under 4 mm in a term neonate.', 'Subglottic haemangioma: propranolol.', 'Palpate the interarytenoid area for a cleft.'],
   ['Croup', 'Vascular ring', 'Tracheomalacia', 'Choanal atresia']),
 T('voice', 'Hoarseness, voice and speech disorders', 'D63;L50', 'Hoarseness for more than three weeks needs the larynx examined. Many voice disorders are functional or neurological: functional aphonia, puberphonia, phonasthenia, muscle tension and spasmodic dysphonia.',
   ['larynx'], ['benign', 'vfp', 'laryngitis'], [[1, 'Office procedures and botulinum toxin'], [206, 'Velopharyngeal dysfunction']], 'Dhingra ch. 63 and K. J. Lee ch. 50',
   ['Functional aphonia: folds close on coughing.', 'Puberphonia: Gutzmann pressure test.', 'Spasmodic dysphonia: a dystonia; botulinum toxin.', 'Hyponasality is blockage; hypernasality is velopharyngeal insufficiency.'],
   ['Laryngeal carcinoma', 'Vocal fold paralysis', 'Parkinson disease', 'Myasthenia gravis']),
 T('trach', 'Tracheostomy and airway endoscopy', 'D64,91,92;L50', 'An orderly tracheostomy on an intubated patient is safe; the dangers lie in the hurried emergency and in the blocked or displaced tube on the ward. Know the alternatives that buy time.',
   ['larynx', 'neck'], ['stridor', 'fb', 'lxtrauma'], [[19, 'Open tracheostomy'], [20, 'Percutaneous tracheostomy'], [18, 'Bronchoscopy'], [23, 'Tracheocutaneous fistula'], [24, 'Stomal stenosis']], 'Dhingra ch. 64, 91, 92 and K. J. Lee ch. 50',
   ['Never through the first ring.', 'Do not change the tube before a track forms.', 'Cricothyroidotomy for can\'t intubate, can\'t oxygenate.', 'Rigid bronchoscopy for foreign bodies.']),
]
LINKS = {'lxanat': [], 'lxtrauma': ['laryngeal-trauma'], 'laryngitis': [], 'lxcong': ['laryngocele'], 'voice': [], 'trach': []}
p = W + 'data.js'; s = open(p, encoding='utf-8').read()
pre = 'window.CLINIC_DATA='; assert s.startswith(pre)
body = s[len(pre):].rstrip().rstrip(';'); D = json.loads(body)
have = {t['id'] for t in D['t']}
last = max(i for i, t in enumerate(D['t']) if t['g'] == 'larynx')
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
