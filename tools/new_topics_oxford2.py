"""Register the gap articles written from the Oxford books: oral cancer, paediatric voice and swallowing,
anaesthesia and the shared airway. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, g, t, src, one, ddx, an, rel, srcs, sum_):
    return dict(id=id, t=t, g=g, src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=ddx, tx=[], ops=[], cx=[], pearl=[],
                an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
NEW = [
 T('oral_ca', 'mouth', 'Oral potentially malignant disorders and oral cancer', 'OT57;OS6;OH10;D49',
   'From leukoplakia to the neck: depth of invasion, elective neck dissection and risk-based adjuvant therapy.',
   ['Leukoplakia', 'Erythroplakia', 'Proliferative verrucous leukoplakia', 'Traumatic ulcer', 'Lichen planus', 'Minor salivary gland tumour'],
   ['oral', 'tongue'], ['oralbenign', 'oraldis', 'hncprinc', 'hnrecon', 'tonsil_ca', 'ap_ulcer'],
   'Oxford Textbook of Otolaryngology ch. 57, Oxford Specialist Handbook ch. 6, Oxford Handbook of ENT ch. 10, Dhingra ch. 49',
   ['**Erythroplakia** and **proliferative verrucous leukoplakia** carry the highest risk; dysplasia transforms in about 5 to 18%.',
    '**Depth of invasion** (not thickness) drives T stage in AJCC 8: T1 ≤2 cm and DOI ≤5 mm; T3 >4 cm or DOI >10 mm.',
    '**Elective neck dissection** (levels I–III) improves survival in early oral cancer (D\'Cruz 2015); sentinel node biopsy is emerging.',
    '**Margins:** clear ≥5 mm, close 1–5 mm, involved <1 mm. Marginal mandibulectomy for abutment, segmental for medullary invasion.',
    '**Adjuvant:** radiotherapy for pT3–4, N2+, close margins, PNI, LVI; chemoradiotherapy for ENE or involved margins.']),
 T('paeds_vs', 'larynx', 'The hoarse child and the child who cannot swallow', 'OT79,80;OS23;OH17',
   'Nodules and papillomatosis in the hoarse child; clefts, fistulae and neurology in the child who aspirates.',
   ['Vocal fold nodules', 'Recurrent respiratory papillomatosis', 'Vocal fold paralysis', 'Laryngeal cleft', 'Tracheo-oesophageal fistula', 'Eosinophilic oesophagitis'],
   ['larynx'], ['lxcong', 'benign', 'vfp', 'stridor', 'cleft', 'ap_dysph'],
   'Oxford Textbook of Otolaryngology ch. 79, 80, Oxford Specialist Handbook ch. 23, Oxford Handbook of ENT ch. 17',
   ['**Nodules** are the commonest cause of a hoarse child and respond to voice therapy; **RRP** (HPV 6 and 11) is second.',
    '**RRP:** debulking; cidofovir or bevacizumab for frequent recurrence; HPV vaccination.',
    '**Vocal fold paralysis** follows about 5% of aortic arch operations; injection or ansa–RLN reinnervation if persistent.',
    '**FEES and videofluoroscopy** show penetration (to the folds) and aspiration (below them), often silent in children.',
    '**Laryngeal clefts** (Benjamin–Inglis I–IV): palpate the interarytenoid area at every microlaryngoscopy.']),
 T('anaes', 'larynx', 'Anaesthesia and the shared airway', 'OT3;OS5;OH21',
   'Planning the airway with the anaesthetist: obstruction, jet and tubeless techniques, laser safety and the bleeding tonsil.',
   ['Obstructing laryngeal tumour', 'Post-tonsillectomy haemorrhage', 'Airway fire', 'Retained throat pack'],
   ['larynx'], ['stridor', 'trach', 'laser', 'tonsil', 'lxca'],
   'Oxford Textbook of Otolaryngology ch. 3, Oxford Specialist Handbook ch. 5, Oxford Handbook of ENT ch. 21',
   ['**NAP4:** about two in five major airway complications arose in head, neck or tracheal disease.',
    '**Obstructed airway:** agree a primary and backup plan; awake fibreoptic intubation or awake tracheostomy; surgeon scrubbed before induction.',
    '**Sharing the airway:** microlaryngeal or laser tubes, jet ventilation (keep an outflow path), tubeless spontaneous ventilation, high-flow nasal oxygen.',
    '**Laser safety:** laser tube with saline cuff, oxygen under about 30%, no nitrous oxide; know the airway fire drill.',
    '**Bleeding tonsil:** resuscitate, rapid sequence induction by a senior anaesthetist, empty the stomach, extubate awake on the side.']),
]
p = W + 'data.js'; s = open(p, encoding='utf-8').read(); pre = 'window.CLINIC_DATA='
D = json.loads(s[len(pre):].rstrip().rstrip(';'))
ids = {t['id'] for t in D['t']}; anok = set()
for t in D['t']: anok.update(t.get('an') or [])
for t in NEW:
    t['an'] = [a for a in t['an'] if a in anok]
    bad = [r for r in t['rel'] if r not in ids]; assert not bad, (t['id'], bad)
    if t['id'] in ids: [x.update(t) for x in D['t'] if x['id'] == t['id']]
    else: D['t'].append(t)
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
p = W + 'links.js'; s = open(p, encoding='utf-8').read(); i = s.find('window.CLINIC_LINKS=')
L = json.loads(s[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';'))
for t in NEW: L.setdefault(t['id'], {'im': [], 'rd': []})
open(p, 'w', encoding='utf-8').write(s[:i] + 'window.CLINIC_LINKS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n')
print([(t['id'], t['an']) for t in NEW])
