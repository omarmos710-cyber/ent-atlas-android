"""Register new Clinical topics (mouth and throat batch) in clinic/data.js and clinic/links.js. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, t, src, one, an, rel, ops, srcs, sum_, ddx=()):
    return dict(id=id, t=t, g='mouth', src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=list(ddx), tx=[], ops=ops,
                cx=[], pearl=[], an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
NEW = [
 T('oralanat', 'Applied anatomy of the oral cavity', 'D42;L36', 'Know where each subsite of the mouth begins and ends, its nerves, and where its lymph goes: examination, staging and neck dissection all follow from it.',
   ['oral'], ['oraldis', 'oralbenign', 'tonsil_ca'], [], 'Dhingra ch. 42 and K. J. Lee ch. 36',
   ['The oral cavity ends at the circumvallate papillae, palate junction and anterior pillars.', 'Tongue: lingual nerve and chorda tympani in front, glossopharyngeal behind.', 'Lateral tongue may skip to level IV; floor of mouth crosses the midline.', 'Referred otalgia comes through V3 and IX.']),
 T('oraldis', 'Oral ulcers, white patches and submucous fibrosis', 'D43;L36', 'Most painful mouths are aphthous, viral, traumatic or candidal; an ulcer that has not healed three weeks after its cause is removed is biopsied. Areca nut causes submucous fibrosis, a premalignant trismus.',
   ['oral'], ['oralbenign', 'tonsil_ca', 'pharyngitis'], [], 'Dhingra ch. 43 and K. J. Lee ch. 36',
   ['Aphthous ulcers recur on movable mucosa and heal in two weeks.', 'A white patch that will not wipe off is not thrush: biopsy.', 'Submucous fibrosis: areca nut, blanching, bands and trismus; premalignant.', 'Three-week rule for any non-healing ulcer.'],
   ['Squamous cell carcinoma', 'Tuberculous ulcer', 'Lichen planus', 'Pemphigus', 'Blood dyscrasia']),
 T('oralbenign', 'Benign oral lesions and premalignant patches', 'D44;L36', 'Fibromas, pyogenic granulomas, mucoceles and ranulas are benign and excised; leukoplakia and especially erythroplakia are premalignant and are biopsied and watched.',
   ['oral', 'salivary'], ['oraldis', 'tonsil_ca'], [[89, 'Ranula and sublingual gland excision']], 'Dhingra ch. 44 and K. J. Lee ch. 36',
   ['Leukoplakia is a clinical term: a white patch not otherwise explained.', 'Erythroplakia carries far the higher malignant risk.', 'Remove the ranula with its sublingual gland.', 'Every palatal lump is biopsied: many minor salivary tumours are malignant.'],
   ['Squamous cell carcinoma', 'Lichen planus', 'Hyperplastic candidiasis', 'Minor salivary gland carcinoma']),
 T('pharanat', 'Applied anatomy and physiology of the pharynx', 'D47;L36', 'Three parts, three constrictors, one weak spot: the anatomy of the pharynx explains referred otalgia, Waldeyer\'s ring, the pouch at Killian\'s dehiscence and the order of a swallow.',
   ['pharynx'], ['adenoid', 'tonsil', 'pouch', 'npc'], [], 'Dhingra ch. 47 and K. J. Lee ch. 36',
   ['Fossa of Rosenmuller: commonest site of nasopharyngeal carcinoma.', 'Killian\'s dehiscence lies between thyropharyngeus and cricopharyngeus.', 'All pharyngeal muscles are vagal except stylopharyngeus (IX) and tensor palati (V3).', 'The piriform sinus drains richly to the neck.']),
 T('adenoid', 'Adenoids and nasopharyngitis', 'D48,95;L53', 'A mouth-breathing, snoring child with a wet nose and glue ear: judge the adenoid against the space it fills, and feel the palate for a submucous cleft before removing it.',
   ['pharynx'], ['osa', 'om', 'tonsil'], [[191, 'Adenoidectomy']], 'Dhingra ch. 48, 95 and K. J. Lee ch. 53',
   ['Adenoids have no crypts and no capsule.', 'Nasal, aural and general symptoms; adenoid facies.', 'Submucous cleft is a contraindication to adenoidectomy.', 'Grisel syndrome and atlantoaxial instability in Down syndrome.'],
   ['Choanal atresia', 'Antrochoanal polyp', 'Angiofibroma', 'Nasopharyngeal carcinoma or lymphoma in adults']),
 T('pharyngitis', 'Acute and chronic pharyngitis', 'D50,53;L36', 'Most sore throats are viral and self-limiting; find the streptococcal throat, glandular fever and diphtheria, and examine the adult smoker whose "chronic pharyngitis" will not settle.',
   ['pharynx'], ['tonsil', 'oraldis', 'tonsil_ca'], [[38, 'Removal of an elongated styloid process']], 'Dhingra ch. 50, 53 and K. J. Lee ch. 36',
   ['Viral causes predominate; group A streptococcus matters for its complications.', 'No amoxicillin in glandular fever.', 'Chronic pharyngitis: remove nasal, dental, smoking and reflux causes.', 'Eagle syndrome: an elongated styloid process causing throat and ear pain.'],
   ['Tonsillitis', 'Infectious mononucleosis', 'Epiglottitis', 'Oropharyngeal carcinoma', 'Laryngopharyngeal reflux']),
 T('hypoca', 'Carcinoma of the hypopharynx', 'D54;L45', 'A silent cancer in the gutter beside the larynx: it spreads early to the neck and under the mucosa, presents late, and is treated by chemoradiation or laryngopharyngectomy.',
   ['pharynx', 'larynx'], ['lxca', 'pouch', 'neckmass'], [[17, 'Total laryngopharyngectomy'], [48, 'Partial pharyngectomy'], [49, 'Reconstruction of hypopharyngeal defects'], [45, 'Oesophagoscopy']], 'Dhingra ch. 54 and K. J. Lee ch. 45',
   ['Piriform sinus, postcricoid region, posterior wall.', 'Plummer-Vinson syndrome predisposes to postcricoid cancer.', 'Three-quarters have nodes at presentation.', 'Look for a synchronous oesophageal cancer.'],
   ['Laryngeal carcinoma', 'Pharyngeal pouch', 'Globus', 'Oesophageal carcinoma']),
]
LINKS = {'oralanat': [], 'oraldis': [], 'oralbenign': ['schwannomas-of-the-oral-cavity-and-neck', 'ranula-of-the-sublingual-gland', 'cystic-hygroma-lymphangioma'],
         'pharanat': [], 'adenoid': ['adenoid-hypertrophy', 'thornwaldt-cyst'], 'pharyngitis': [], 'hypoca': ['supraglottic-and-pharyngeal-tumors']}
p = W + 'data.js'; s = open(p, encoding='utf-8').read()
pre = 'window.CLINIC_DATA='; assert s.startswith(pre)
body = s[len(pre):].rstrip().rstrip(';'); D = json.loads(body)
have = {t['id'] for t in D['t']}
last = max(i for i, t in enumerate(D['t']) if t['g'] == 'mouth')
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
