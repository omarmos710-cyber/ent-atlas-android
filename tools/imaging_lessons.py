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
  [IA + ', temporal bone chapters', DI + ', temporal bone overview and diagnoses', DU], ['temporal', 'middle', 'inner'], ['chole', 'tbom', 'otosc', 'scd', 'tbfx', 'atresia', 'earsurg'],
  ['Thin **bone-algorithm** CT, no contrast, axial and coronal; Pöschl and Stenvers obliques when needed.',
   'Know the landmarks: the **ice-cream cone**, **Prussak\'s space**, the **scutum**, and the posterior wall trio of **sinus tympani, pyramidal eminence and facial recess**.',
   'Read lateral to medial: canal, drum and scutum, spaces, ossicles, tegmen and canals, mastoid, inner ear, IAC and facial nerve, vessels, petrous apex.',
   'Cholesteatoma: **tegmen, fistula, facial canal, sinus tympani, ossicles**. CT shows bone; non-EPI DWI shows keratin.',
   'Otosclerosis: lucency at the **fissula ante fenestram**; fractures: otic capsule **sparing or violating**.']),
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
