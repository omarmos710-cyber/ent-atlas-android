"""Register 'The syndromal child' (Oxford Textbook of Otolaryngology ch. 90) in the Clinical library. Safe to re-run."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
T = dict(id='syndr', t='The syndromal child', g='mouth', src='OT90;OS23;OH17;D19',
  one='Recognise when a common ENT problem is part of a syndrome, and anticipate the airway, anaesthetic and hearing issues it brings.',
  call=[], cls=[], why=[], feat=[], dx=[], ddx=['Down syndrome', 'Treacher Collins syndrome', 'Goldenhar syndrome', 'Pierre Robin sequence', 'CHARGE syndrome', '22q11.2 deletion'],
  tx=[], ops=[], cx=[], pearl=[], an=['inner', 'pharynx'], rel=['deaf', 'cleft', 'congnose', 'osa', 'om', 'lxcong'], fu=[], tb=[], diff=[],
  srcs='Oxford Textbook of Otolaryngology ch. 90, Oxford Specialist Handbook ch. 23, Oxford Handbook of ENT ch. 17, Dhingra ch. 19',
  sum=['**Syndrome, sequence, association:** single cause, a cascade from one anomaly, or a non-random cluster.',
       '**Down syndrome:** persistent effusion (hearing aids often first), OSA in about 60%, subglottic stenosis, atlantoaxial instability.',
       '**Treacher Collins** is bilateral with lower lid colobomas; **Goldenhar** is unilateral with upper lid colobomas and epibulbar dermoids.',
       '**Syndromic sensorineural loss:** ECG for long QT (Jervell and Lange-Nielsen); Pendred, Waardenburg, Usher, BOR, Alport, CHARGE.',
       '**22q11.2 deletion:** velopharyngeal insufficiency, glottic web, medial carotids — image before pharyngeal surgery.'])
p = W + 'data.js'; s = open(p, encoding='utf-8').read(); pre = 'window.CLINIC_DATA='
D = json.loads(s[len(pre):].rstrip().rstrip(';'))
ids = {t['id'] for t in D['t']}
an_ok = set()
for t in D['t']: an_ok.update(t.get('an') or [])
T['an'] = [a for a in T['an'] if a in an_ok]
assert all(r in ids for r in T['rel'])
if 'syndr' in ids: [t.update(T) for t in D['t'] if t['id'] == 'syndr']
else: D['t'].append(T)
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
p = W + 'links.js'; s = open(p, encoding='utf-8').read(); i = s.find('window.CLINIC_LINKS=')
L = json.loads(s[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';')); L.setdefault('syndr', {'im': [], 'rd': []})
open(p, 'w', encoding='utf-8').write(s[:i] + 'window.CLINIC_LINKS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('ok', T['an'])
