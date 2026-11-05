"""Register new Clinical topics (neck, thyroid and salivary batch) in clinic/data.js and clinic/links.js,
and refresh the sources of the rewritten neck topics. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
def T(id, t, src, one, an, rel, ops, srcs, sum_, ddx=()):
    return dict(id=id, t=t, g='neck', src=src, one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=list(ddx), tx=[], ops=ops,
                cx=[], pearl=[], an=an, rel=rel, fu=[], tb=[], diff=[], srcs=srcs, sum=sum_)
NEW = [
 T('saltum', 'Salivary gland tumours', 'D46;L35', 'The bigger the gland, the more likely its tumour is benign. Most parotid lumps are pleomorphic adenomas that need a superficial parotidectomy, not enucleation; pain, fixity, nodes and facial weakness mean cancer.',
   ['salivary', 'facial'], ['salivary', 'neckmass', 'facial'], [[92, 'Superficial parotidectomy'], [93, 'Deep lobe parotidectomy'], [91, 'Submandibular gland'], [69, 'Prestyloid parapharyngeal space']], 'Dhingra ch. 46 and K. J. Lee ch. 35',
   ['80% of parotid tumours are benign; most minor gland tumours are malignant.', 'Pleomorphic adenoma: pseudopodia, so never enucleate.', 'Warthin: tail of parotid, older male smokers, bilateral in some.', 'Adenoid cystic carcinoma spreads along nerves and to the lungs.'],
   ['Intraparotid lymph node', 'Lymphoma', 'Metastatic skin cancer', 'Lymphoepithelial cyst', 'Masseteric hypertrophy']),
 T('vascneck', 'Paragangliomas, neural tumours and vascular anomalies', 'D77;L40', 'A painless pulsatile lump at the carotid bifurcation that moves sideways but not up and down is a carotid body tumour: image it, test for metanephrines and SDH genes, and never needle it.',
   ['vessels', 'neck'], ['neckmass', 'paeds_neck'], [[73, 'Carotid body tumour'], [72, 'Neural tumours'], [69, 'Parapharyngeal space'], [142, 'Glomus tumours']], 'Dhingra ch. 77 and K. J. Lee ch. 40',
   ['Carotid body tumour splays the internal and external carotids (lyre sign).', 'Up to 40% of paragangliomas are hereditary (SDH).', 'Vagal tumours push the carotids forward without splaying.', 'Haemangiomas involute; malformations grow with the child.'],
   ['Vagal schwannoma', 'Metastatic node', 'Branchial cyst', 'Carotid aneurysm']),
 T('hnrt', 'Radiotherapy and chemotherapy for head and neck cancer', 'D73,74;L46,47', 'Radiation cures early cancers with organ preservation and, with cisplatin, advanced ones; after surgery it treats margins and nodes. Prepare the teeth first and recognise the late effects that return to the ENT clinic.',
   ['neck'], ['lxca', 'tonsil_ca', 'npc', 'hypoca'], [[182, 'Segmental mandibulectomy'], [162, 'Free flap reconstruction']], 'Dhingra ch. 73, 74 and K. J. Lee ch. 46, 47',
   ['Conventional 2 Gy a day; 70 Gy for gross disease.', 'Positive margins or extranodal extension: add cisplatin.', 'Cisplatin is ototoxic: baseline audiogram.', 'Osteoradionecrosis: prevent by dental care before treatment.']),
 T('hivent', 'HIV and ENT', 'D75;L11', 'Many ENT findings point to HIV: oral hairy leukoplakia, persistent thrush, necrotising gingivitis, bilateral parotid cysts, generalised nodes and Kaposi sarcoma. Universal precautions and prompt post-exposure prophylaxis protect the team.',
   ['salivary', 'oral'], ['neckmass', 'salivary', 'oraldis'], [[60, 'FNA'], [91, 'Submandibular gland']], 'Dhingra ch. 75 and K. J. Lee ch. 11',
   ['CD4 below 200 defines AIDS.', 'Oral hairy leukoplakia is EBV-driven and predicts progression.', 'Bilateral parotid lymphoepithelial cysts regress on ART.', 'PEP within 72 hours, ideally within hours, for 28 days.'],
   ['Sjogren syndrome', 'Tuberculous lymphadenitis', 'Lymphoma', 'Warthin tumour']),
 T('skinca', 'Skin cancer and melanoma of the head and neck', 'L42,43', 'Basal cell carcinoma destroys locally; squamous carcinoma spreads to the parotid and along nerves; melanoma depth decides margins, sentinel node biopsy and survival.',
   ['neck', 'facial'], ['saltum', 'neckmass'], [[161, 'Skin cancer'], [62, 'Sentinel node biopsy'], [27, 'Lip cancer'], [71, 'Posterolateral neck dissection'], [165, 'Forehead flap'], [173, 'Skin grafting']], 'K. J. Lee ch. 42, 43',
   ['Mohs surgery for high-risk and central-face BCC.', 'cSCC of the scalp, temple and ear spreads to the parotid.', 'Melanoma margins: 1 cm up to 1 mm thick, 2 cm over 2 mm.', 'Sentinel node biopsy from T1b; checkpoint inhibitors for advanced disease.'],
   ['Keratoacanthoma', 'Seborrhoeic keratosis', 'Actinic keratosis', 'Pyogenic granuloma']),
 T('jaw', 'Cysts and tumours of the jaws', 'L39', 'The radiograph does most of the work: lucent or opaque, single or multiple, defined or ragged, and its relation to a tooth. Aspirate before biopsy, and resect ameloblastoma rather than curetting it.',
   ['oral', 'sinus'], ['oralbenign', 'hnrt'], [[181, 'Marginal mandibulectomy'], [182, 'Segmental mandibulectomy'], [162, 'Free flap reconstruction'], [32, 'Inferior maxillectomy']], 'K. J. Lee ch. 39',
   ['Radicular cyst: the only cyst with a dead tooth.', 'Dentigerous cyst: around an unerupted crown.', 'Multiple keratocysts: Gorlin syndrome.', 'Ameloblastoma: soap bubble at the angle; resect with margins.'],
   ['Ameloblastoma', 'Odontogenic keratocyst', 'Central giant cell granuloma', 'Fibrous dysplasia', 'Metastasis']),
]
LINKS = {
 'saltum': ['pleomorphic-adenoma-of-the-parotid-gland', 'pleomorphic-adenoma-of-the-submandibular-gland', 'malignancies-of-the-parotid-gland', 'adenoid-cystic-carcinoma', 'acinic-cell-carcinoma', 'lipoma-near-the-parotid-gland'],
 'vascneck': ['carotid-body-paraganglioma', 'glomus-jugulare-tumor-paraganglioma', 'schwannomas-of-the-oral-cavity-and-neck', 'esr-vascular-variants'],
 'hnrt': [], 'hivent': ['lymphadenopathy-hiv'], 'skinca': [], 'jaw': ['fibrous-dysplasia-monostotic', 'fibrous-dysplasia-1', 'odontogenic-sinusitis'],
}
# refreshed fields for the rewritten topics
UPD = {
 'salivary': dict(t='Salivary gland infections, stones and swellings', src='D45;L35', srcs='Dhingra ch. 45 and K. J. Lee ch. 35',
                  ops=[[88, 'Sialendoscopy'], [91, 'Submandibular gland'], [89, 'Ranula']], rel=['saltum', 'facial', 'hivent']),
 'thyroid': dict(src='D66;L38,51', srcs='Dhingra ch. 66 and K. J. Lee ch. 38, 51',
                 ops=[[78, 'Thyroidectomy'], [79, 'Video-assisted'], [80, 'Robotic'], [67, 'Central dissection'], [81, 'Substernal goitre'], [82, 'Invasive cancer']]),
 'para': dict(src='D66;L38,51', srcs='Dhingra ch. 66 and K. J. Lee ch. 38, 51'),
 'neckmass': dict(src='D77;L11,38,40', srcs='Dhingra ch. 77 and K. J. Lee ch. 11, 38, 40', rel=['tonsil_ca', 'thyroid', 'paeds_neck', 'vascneck', 'hivent', 'npc'],
                  ops=[[60, 'FNA'], [61, 'Unknown primary'], [64, 'Selective neck dissection'], [65, 'Modified radical'], [66, 'Radical']]),
 'paeds_neck': dict(src='D77;L40,51', srcs='Dhingra ch. 77 and K. J. Lee ch. 40, 51', rel=['neckmass', 'vascneck', 'thyroid']),
}
LUPD = {'salivary': ['sialadenitis', 'sialolith-of-the-submandibular-gland', 'ranula-of-the-sublingual-gland', 'esr-salivary-glands'],
        'para': [], 'thyroid': ['thyroid-cancer', 'hypertrophy-of-the-thyroid-gland-thyroid-goiter', 'esr-thyroid', 'esr-ectopic-thyroid'],
        'neckmass': ['lymphadenitis-colli', 'abscess-of-the-neck', 'lymphoma-non-hodgkin', 'lymphadenopathy-hiv', 'lipoma-of-the-neck', 'esr-lymph-node-levels'],
        'paeds_neck': ['branchial-cleft-cyst', 'thyroglossal-duct-cyst', 'cystic-hygroma-lymphangioma', 'epi-dermoid-cyst']}
p = W + 'data.js'; s = open(p, encoding='utf-8').read()
pre = 'window.CLINIC_DATA='; assert s.startswith(pre)
D = json.loads(s[len(pre):].rstrip().rstrip(';'))
have = {t['id'] for t in D['t']}
for t in D['t']:
    if t['id'] in UPD: t.update(UPD[t['id']])
last = max(i for i, t in enumerate(D['t']) if t['g'] == 'neck')
add = [t for t in NEW if t['id'] not in have]
D['t'][last + 1:last + 1] = add
ids = {t['id'] for t in D['t']}
for t in D['t']:
    bad = [r for r in t['rel'] if r not in ids]
    assert not bad, (t['id'], bad)
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
p = W + 'links.js'; s = open(p, encoding='utf-8').read()
i = s.find('window.CLINIC_LINKS='); head = s[:i]; L = json.loads(s[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';'))
for k, v in LINKS.items(): L.setdefault(k, {'im': v, 'rd': []})
for k, v in LUPD.items(): L.setdefault(k, {'im': [], 'rd': []})['im'] = v
open(p, 'w', encoding='utf-8').write(head + 'window.CLINIC_LINKS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('added', [t['id'] for t in add])
