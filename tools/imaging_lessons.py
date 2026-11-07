"""Register the 'Learn to read ENT imaging' course: clinical-engine articles in the hidden group 'imgl',
listed in order on the Imaging tab. A lesson is registered only once its content/clinic/<id>.txt exists. Safe to re-run."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = os.path.join(ROOT, 'app/src/main/assets/www/clinic/')
DI = 'Diagnostic Imaging: Head and Neck (Koch et al., 3rd ed.)'; IA = 'Imaging Anatomy: Head and Neck (Chapman and Koontz)'
DU = 'Dunnebier, Imaging for Otolaryngologists'; ESR = 'ESR Modern Radiology, Head and Neck Imaging'
L = [  # id, lesson, part, title, one-line, sources, anatomy regions, related clinical topics, at-a-glance
 ('im_ct', 1, 'found', 'CT for the ENT surgeon', 'Hounsfield units, windows, bone and soft-tissue reconstructions, contrast, cone-beam CT, dose and artefacts.',
  [DU + ' ch. 1', ESR, DI + ', overview chapters'], ['temporal', 'sinus'], ['sinussurg', 'chole'],
  ['CT measures density in **Hounsfield units**: air −1000, fat about −100, water 0, soft tissue 30–60, bone 400–1000+.',
   'The **window** decides what you see: always read bone and soft-tissue windows separately.',
   'Thin-slice **bone algorithm** for temporal bone and sinus; **contrast-enhanced** soft-tissue CT for neck masses, abscess and cancer.',
   'Learn the artefacts: dental amalgam streaks, motion, partial volume and beam hardening.',
   'Cone-beam CT gives sinus and ear bone detail at lower dose but no useful soft tissue.']),
 ('im_mri', 2, 'found', 'MRI made simple', 'T1, T2, fat suppression, gadolinium, diffusion and the heavily T2-weighted sequences, with what is bright and dark on each.',
  [DU + ' ch. 1', ESR, DI, IA], ['inner', 'facial'], ['vs', 'chole', 'sinus_ca'],
  ['**T1**: fat bright, fluid dark; the best anatomy and the baseline for enhancement.',
   '**T2**: fluid bright; fat suppression (STIR or fat-sat) makes oedema and tumour stand out.',
   '**Post-gadolinium T1 fat-sat**: tumour, inflammation and perineural spread.',
   '**DWI/ADC**: restricted diffusion in pus, cholesteatoma (non-EPI DWI) and cellular tumour such as lymphoma.',
   '**CISS/FIESTA**: thin heavily T2 images of nerves in CSF, the labyrinth and the IAC.']),
 ('im_test', 3, 'found', 'Choosing the test', 'Which test answers which question: ultrasound, CT, MRI, PET-CT, swallow studies, angiography and nuclear medicine.',
  [DU, ESR, DI], ['neck', 'thyroid'], ['neckmass', 'thyroid', 'ap_dysph'],
  ['Start from the clinical question, not the modality.', 'Ultrasound first for thyroid, salivary glands, superficial lumps and nodes in the neck, with FNA.',
   'CT for bone (temporal bone, sinuses, fractures) and for acute infection; MRI for soft tissue, nerves and skull base spread.',
   'PET-CT for unknown primary, advanced stage and response after chemoradiotherapy (at about 12 weeks).',
   'Children: ultrasound and MRI before CT where possible.']),
 ('im_desc', 4, 'found', 'Describing a lesion and reading a report', 'A vocabulary and an order for every scan: site and space, size, margins, density or signal, enhancement, spread and nodes.',
  [DI + ', overview chapters', IA, ESR], ['neck'], ['neckmass', 'hncprinc'],
  ['Say **where** first: the space or structure of origin.', 'Then **what**: size, shape, margins, density or signal, enhancement, calcification, fat.',
   'Then **what it does**: bone remodelling versus destruction, perineural and vascular spread, airway, nodes.',
   'Finish with a short **differential** in order of likelihood and what would settle it.']),
 ('im_tb', 5, 'ear', 'The temporal bone on CT', 'A slice-by-slice tour of the normal ear in axial and coronal planes, a checklist for every scan, and how cholesteatoma, otosclerosis, dehiscence and fractures change the picture.',
  [IA + ', temporal bone chapters', DI + ', temporal bone overview and diagnoses', DU], ['temporal', 'midear', 'inner'], ['chole', 'tbom', 'otosc', 'scd', 'tbfx', 'atresia', 'earsurg'],
  ['Thin **bone-algorithm** CT, no contrast, axial and coronal; Pöschl and Stenvers obliques when needed.',
   'Know the landmarks: the **ice-cream cone**, **Prussak\'s space**, the **scutum**, and the posterior wall trio of **sinus tympani, pyramidal eminence and facial recess**.',
   'Read lateral to medial: canal, drum and scutum, spaces, ossicles, tegmen and canals, mastoid, inner ear, IAC and facial nerve, vessels, petrous apex.',
   'Cholesteatoma: **tegmen, fistula, facial canal, sinus tympani, ossicles**. CT shows bone; non-EPI DWI shows keratin.',
   'Otosclerosis: lucency at the **fissula ante fenestram**; fractures: otic capsule **sparing or violating**.']),
 ('im_iac', 6, 'ear', 'The inner ear, IAC and CPA on MRI', 'The scan for asymmetric hearing loss: the four nerves, the fluid of the labyrinth, a reading checklist, and the lesions behind nearly every positive study.',
  [IA + ', internal auditory canal and inner ear', DI + ', CPA-IAC overview and diagnoses', DU], ['inner', 'facial'], ['vs', 'ssnhl', 'facial', 'ko', 'meniere', 'tinnitus'],
  ['**High-resolution T2** (CISS or FIESTA) screens; **post-gadolinium fat-suppressed T1** characterises.',
   '"**Seven up, Coke down**": facial anterosuperior, cochlear anteroinferior, vestibular nerves posterior.',
   'About 90% of positive scans for unilateral SNHL are **vestibular schwannomas**: centred on the porus, acute angle, ice cream on a cone.',
   '**Meningioma**: broad dural base, obtuse angle, dural tail. **Epidermoid**: bright on DWI; arachnoid cyst is not.',
   'Labyrinthitis **enhances**; ossification **removes the T2 fluid signal**. Enhancement of the IAC or labyrinthine facial nerve is always abnormal.']),
 ('im_skb', 7, 'ear', 'The skull base and its foramina', 'The three floors, the foramina that matter, the pterygopalatine fossa and perineural spread, and the lesions of the petrous apex, clivus and jugular foramen.',
  [IA + ', skull base chapters', DI + ', skull base overview and diagnoses', DU], ['skullbase', 'temporal'], ['skullbase', 'petrous', 'csf', 'juv', 'npc', 'sinus_ca'],
  ['**Bone CT** for foramina and matrix; **MRI** for extent, marrow and perineural spread. Read the **pre-contrast T1** first.',
   'The **pterygopalatine fossa** should contain fat; it connects nose, infratemporal fossa, orbit, middle cranial fossa and palate.',
   'Perineural spread: enlarged enhancing nerve, **lost fat at the foramen**, widened foramen, denervated muscle.',
   'Petrous apex by signal: marrow suppresses, **cholesterol granuloma bright on T1 and T2**, cholesteatoma bright on DWI.',
   '**Chordoma** midline clivus; **chondrosarcoma** petrooccipital fissure. Jugular foramen: paraganglioma permeative, schwannoma smooth, meningioma sclerotic.']),
 ('im_sin', 8, 'nose', 'Sinus CT before surgery', 'Drainage pathways, the variants that change surgery, the CLOSE checklist, Lund–Mackay scoring, and how to read hyperdense, unilateral and invasive disease.',
  [IA + ', ostiomeatal unit and frontal recess', DI + ', sinonasal overview and diagnoses', DU], ['sinus', 'nose'], ['crs', 'sinussurg', 'afs', 'abs', 'sinus_ca', 'csf'],
  ['Thin **non-contrast** CT in **coronal, axial and sagittal** planes, ideally after medical treatment.',
   '**Ostiomeatal unit** drains maxillary, anterior ethmoid and frontal; **sphenoethmoidal recess** drains posterior ethmoid and sphenoid.',
   'Before surgery read **CLOSE**: cribriform (Keros), lamina papyracea, Onodi cell, sphenoid (optic nerve and carotid), ethmoid artery.',
   '**Lund–Mackay**: 0–2 per sinus, 0 or 2 per ostiomeatal complex, total 0–24.',
   'Hyperdense contents: **allergic fungal sinusitis** or fungal ball. **Unilateral** disease or bone erosion: **MRI**.']),
 ('im_orb', 9, 'nose', 'The orbit', 'The compartments of the orbit, the imaging of sinusitis complications and cavernous sinus thrombosis, blowout fractures, thyroid eye disease and the masses an ENT surgeon meets.',
  [IA + ', orbit chapters', DI + ', orbit and trauma diagnoses', DU], ['orbit', 'sinus'], ['orbit', 'abs', 'facefx', 'sinus_ca', 'sinussurg'],
  ['Contrast **CT** for infection and trauma; fat-suppressed **MRI** for the optic nerve, apex, cavernous sinus and tumours.',
   'Think in compartments: **preseptal or postseptal**; **intraconal, conal or extraconal**.',
   '**Subperiosteal abscess**: lentiform rim-enhancing collection along the lamina papyracea, displacing the medial rectus.',
   '**Cavernous sinus thrombosis**: enlarged superior ophthalmic vein with a filling defect.',
   '**Blowout fracture**: look for muscle entrapment; a child\'s trapdoor fracture may look almost normal. **Thyroid eye disease** spares the tendons.']),
 ('im_spaces', 10, 'neck', 'The neck by spaces', 'The fascial spaces of the suprahyoid and infrahyoid neck, what each contains, the parapharyngeal displacement rule, and how infection spreads.',
  [DI + ', suprahyoid and infrahyoid neck overview', IA + ', neck spaces chapters', ESR], ['neck', 'vessels'], ['deepneck', 'neckmass', 'para', 'salivary', 'vascneck'],
  ['Name the **space** first: its contents give the differential.',
   'Suprahyoid: four spaces (**mucosal, masticator, parotid, carotid**) around the **parapharyngeal fat**; retropharyngeal and perivertebral behind.',
   'Fat pushed **laterally**: mucosal; **posteriorly**: masticator; **medially**: deep parotid; **anteriorly**: carotid.',
   'Carotid body paraganglioma **splays** the ICA and ECA; vagal tumours push the ICA **forwards**.',
   'Cellulitis, phlegmon and abscess differ on contrast CT; only an abscess is drained. The danger space reaches the mediastinum.']),
 ('im_lx', 11, 'neck', 'The larynx and hypopharynx', 'Finding the level of each slice, the normal wall thickness, the pre-epiglottic and paraglottic spaces, cartilage invasion, staging by site, and vocal cord paralysis, laryngocele and trauma.',
  [DI + ', hypopharynx, larynx and trachea overview', IA + ', larynx and hypopharynx', ESR], ['larynx', 'pharynx'], ['lxca', 'hypoca', 'vfp', 'lxtrauma', 'lxanat', 'benign'],
  ['Contrast CT in **quiet breathing** plus a **breath-hold or phonation** pass; MRI when cartilage invasion is uncertain.',
   'False cords have **fat** beneath them; true cords have **muscle**, the arytenoids and the top of the cricoid.',
   'Commissures and subglottic mucosa **≤1 mm**; postcricoid soft tissue **≤1 cm**.',
   'Pre-epiglottic or paraglottic invasion is at least **T3**; inner cortex erosion T3, through the outer cortex **T4a**.',
   'Cord paralysis: medially rotated arytenoid, dilated ventricle and pyriform sinus. Scan from skull base to the **aortopulmonary window**.']),
 ('im_oral', 12, 'neck', 'The oral cavity and oropharynx', 'The four areas of the oral cavity, what to report for tongue, floor of mouth and gum cancers, the HPV cystic node, dental infection and the mylohyoid, ranula and the denervated tongue.',
  [DI + ', oral cavity and squamous cell carcinoma chapters', IA + ', oral cavity', ESR], ['oral', 'pharynx'], ['oral_ca', 'tonsil_ca', 'oraldis', 'deepneck', 'oralanat', 'neckmass'],
  ['**MRI** for oral and oropharyngeal cancer (less amalgam, depth, marrow, nerves); **contrast CT** for infection.',
   'The **mylohyoid** divides the **sublingual** space above from the **submandibular** space below.',
   'Tongue cancer: **depth of invasion**, the **lingual septum**, both **neurovascular bundles**.',
   'Mandible: cortex on **CT**, marrow on **MRI**; follow the inferior alveolar canal.',
   'A **cystic level II node** in an adult is metastasis (often HPV oropharynx) until proven otherwise.']),
 ('im_nodes', 13, 'neck', 'Lymph nodes', 'The imaging levels from their landmarks, the features of a malignant node, reading the nodes back to the primary, the cystic node, and the reactive, suppurative, tuberculous and lymphomatous mimics.',
  [DI + ', lymph node overview and diagnoses', IA + ', cervical lymph nodes', ESR], ['neck', 'vessels'], ['neckmass', 'hncprinc', 'paeds_neck', 'thyroid', 'tonsil_ca'],
  ['Levels from landmarks: **hyoid** (II/III), **cricoid** (III/IV), **back of sternocleidomastoid** (V), **jugular vein** (IIA/IIB), **manubrium** (VI/VII).',
   'Malignant features together: **necrosis**, **round shape** and lost hilum, size, clustering, **extranodal extension**.',
   'Do not forget the **retropharyngeal** nodes: first station for the nasopharynx.',
   'A **cystic node** in an adult is metastasis until proven otherwise: HPV oropharynx or papillary thyroid.',
   'Carotid contact **≥270°** suggests encasement and unresectability.']),
 ('im_glands', 14, 'neck', 'Thyroid and salivary glands', 'Ultrasound grading of thyroid nodules, when to add CT, parathyroid localisation, the facial nerve plane in the parotid, benign and malignant salivary tumours, and gland versus node.',
  [DI + ', visceral and parotid space chapters', IA + ', parotid and visceral spaces', ESR, DU], ['thyroid', 'salivary'], ['thyroid', 'salivary', 'saltum', 'para', 'neckmass'],
  ['**Ultrasound first**, with FNA, for thyroid and salivary lumps.',
   'Suspicious nodule: **solid, hypoechoic, taller than wide, irregular, microcalcifications**. Grade by **U** or **TI-RADS**.',
   '**CT** for retrosternal goitre and invasive cancer; remember iodine delays radioactive iodine.',
   'The facial nerve lies **lateral to the retromandibular vein**; deep lobe tumours widen the **stylomandibular gap**.',
   'Pleomorphic adenoma: very **bright on T2**. Warthin: parotid **tail**, multiple, smokers. Low T2 and ill-defined margins suggest malignancy.']),
 ('im_ca', 15, 'pat', 'Reading a head and neck cancer scan', 'One routine for every staging scan: choosing the modality, the primary and its T4 structures, perineural spread, nodes and extranodal extension, the chest and second primaries, and the unknown primary.',
  [DI + ', squamous cell carcinoma overview and diagnoses', ESR, DU], ['neck', 'pharynx', 'larynx'], ['hncprinc', 'npc', 'oral_ca', 'tonsil_ca', 'lxca', 'hypoca', 'sinus_ca', 'neckmass'],
  ['**CT** for larynx and neck; **MRI** for nasopharynx, oral cavity, oropharynx and sinonasal; **PET-CT** for advanced disease and the unknown primary.',
   'Routine: **primary**, local extent and **T4 structures**, **perineural**, **vessels**, **nodes**, **chest and bones**, second primary.',
   'T4b usually means unresectable: carotid encasement, prevertebral fascia, skull base, mediastinum.',
   '**Extranodal extension** (ill-defined margins, fat, muscle, skin) changes stage and treatment.',
   'Unknown primary: image **before** panendoscopy; PET-CT; HPV and EBV status of the node.']),
 ('im_post', 16, 'pat', 'The treated neck', 'Baseline timing, the appearance of neck dissections and flaps, expected changes after radiotherapy, the signs of recurrence, NI-RADS, and osteoradionecrosis and other complications.',
  [DI + ', post-treatment neck chapters', ESR, DU], ['neck'], ['hnrt', 'hncprinc', 'hnrecon', 'jaw', 'lxca'],
  ['Baseline **PET-CT at about 12 weeks** after chemoradiotherapy (PET-NECK); compare every later scan with it.',
   'Expected change is **symmetric, smooth and diffuse**: oedema early, fibrosis and atrophy late.',
   'Recurrence is **discrete, new or enlarging**, nodular at flap margins, restricts diffusion and is focally FDG-avid.',
   '**NI-RADS** 1 to 4 for primary and neck, each tied to an action.',
   'Mimics: hypertrophied levator scapulae, residual thyroid lobe, **osteoradionecrosis**.']),
]
EXTRA = {}
def main():
    p = W + 'data.js'; s = open(p, encoding='utf-8').read(); pre = 'window.CLINIC_DATA='
    D = json.loads(s[len(pre):].rstrip().rstrip(';')); D['g']['imgl'] = 'Imaging course'
    ids = {t['id'] for t in D['t']}; n = 0
    for (tid, les, part, title, one, srcs, an, rel, sm) in L + EXTRA.get('L', []):
        if not os.path.exists(os.path.join(ROOT, 'content/clinic', tid + '.txt')): continue
        T = dict(id=tid, t=title, g='imgl', les=les, part=part, src='', one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=[], tx=[], ops=[], cx=[],
                 pearl=[], an=an, rel=[r for r in rel if r in ids], fu=[], tb=[], diff=[], srcs=', '.join(srcs), sum=sm)
        if tid in ids: [x.update(T) for x in D['t'] if x['id'] == tid]
        else: D['t'].append(T)
        n += 1
    open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
    lp = W + 'links.js'; ls = open(lp, encoding='utf-8').read(); i = ls.find('window.CLINIC_LINKS=')
    LK = json.loads(ls[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';'))
    for t in D['t']:
        if t['g'] == 'imgl': LK.setdefault(t['id'], {'im': [], 'rd': []})
    open(lp, 'w', encoding='utf-8').write(ls[:i] + 'window.CLINIC_LINKS=' + json.dumps(LK, ensure_ascii=False, separators=(',', ':')) + ';\n')
    # lesson list for the Imaging tab (index.html loads the clinical data only when Clinical opens)
    ix = os.path.join(ROOT, 'app/src/main/assets/www/index.html'); h = open(ix, encoding='utf-8').read()
    les = sorted([[t['id'], t['les'], t['part'], t['t'], t['one']] for t in D['t'] if t['g'] == 'imgl'], key=lambda x: x[1])
    a = h.index('/*ILES*/'); b = h.index('/*/ILES*/')
    h = h[:a] + '/*ILES*/const ILES=' + json.dumps(les, ensure_ascii=False, separators=(',', ':')) + ';' + h[b:]
    open(ix, 'w', encoding='utf-8').write(h)
    print('lessons registered', n)
if __name__ == '__main__':
    main()
