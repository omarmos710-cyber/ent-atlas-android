"""Add the three Oxford books to the source line of every existing Clinical topic they cover.
OT = Oxford Textbook of Otolaryngology (Phillips & Bhalla, 2025); OS = Oxford Specialist Handbook of
Otolaryngology HNS (2nd ed.); OH = Oxford Handbook of ENT and HNS (3rd ed., 2020).
Chapter numbers follow each book's table of contents. Safe to re-run (topics already citing Oxford are skipped)."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/')
M = {  # id: (OT chapters, OS chapters, OH chapters)
 'om': ('84, 88', '16, 23', '6, 17'), 'mastoiditis': ('8', '16', '6'), 'csom': ('8, 21', '16', '6'), 'chole': ('19', '16', '6'),
 'icc': ('8', '16', '6'), 'oe': ('8, 13', '15', '5'), 'tmperf': ('21', '16', '6'), 'otosc': ('20', '16', '6'),
 'ssnhl': ('11', '18', '7'), 'meniere': ('14', '18', '7'), 'vs': ('18', '19', '8'), 'facial': ('10', '17', ''),
 'tbfx': ('23', '16', '25'), 'tumear': ('18', '19', '8'), 'tinnitus': ('6', '3, 18', '3, 7'), 'fistula': ('7', '18', ''),
 'petrous': ('18', '19', ''), 'perich': ('13', '15', '5'), 'myring': ('13', '15', ''), 'ko': ('13', '15', '5'),
 'tbom': ('8, 24', '16', ''), 'canal': ('13', '15', '5'), 'pinna': ('13', '15', '5'), 'hl': ('5, 11, 12, 83', '3, 14', '3, 4'),
 'sensori': ('11, 17', '18', '7'), 'et': ('9, 88', '16', '6'), 'vertigo': ('7, 15', '18', '7'), 'deaf': ('16, 83', '23', '17'),
 'otalgia': ('8', '3', '3'), 'extca': ('13, 18', '15', ''), 'audio': ('5', '14', '4'), 'vest': ('7', '14', '4'),
 'rehab': ('16', '14', ''), 'scd': ('7, 12', '18', ''), 'earsurg': ('19, 20, 21', '16', '20'), 'atresia': ('13, 83', '23', ''),
 'stridor': ('52, 74', '3, 23', '3, 25'), 'croup': ('74', '23', '17'), 'fb': ('74', '23', '25'), 'vfp': ('47, 71', '8', '12'),
 'benign': ('47, 71', '8', '12'), 'lxca': ('55', '8', '12'), 'lxanat': ('47', '8', ''), 'lxtrauma': ('53', '8', '25'),
 'laryngitis': ('47', '8', '12'), 'lxcong': ('74, 79', '23', '17'), 'voice': ('47, 71, 72', '8, 13', '22'),
 'trach': ('70', '8', '20'), 'laser': ('71', '8', ''), 'neckmass': ('50, 67', '3, 12', '3, 14'), 'paeds_neck': ('81', '23', '17'),
 'thyroid': ('59', '11', '15'), 'para': ('63', '11', '15'), 'salivary': ('82', '7', '11'), 'saltum': ('58', '7', '11'),
 'vascneck': ('67', '12', ''), 'hnrt': ('65', '12', ''), 'hivent': ('', '', '18'), 'hnrecon': ('64', '9', ''),
 'hncprinc': ('68, 69', '4, 12', '14'), 'epistaxis': ('27, 77', '20', '9, 25'), 'hht': ('43', '20', '9'),
 'septum': ('28, 33', '20', '9'), 'rhinitis': ('29, 42', '20', '9'), 'abs': ('36', '21', '9'), 'crs': ('37, 38', '21', '9'),
 'afs': ('38', '21', ''), 'gpa': ('34', '20', '9'), 'juv': ('39', '20', ''), 'sinus_ca': ('39', '21', '9'),
 'atrophic': ('34', '20', ''), 'nphys': ('26, 33', '20', ''), 'extnose': ('35', '22', ''), 'congnose': ('78', '23', '17'),
 'nfb': ('77, 78', '23', '25'), 'csf': ('29, 45', '21', ''), 'facefx': ('53', '22', '25'), 'orbit': ('36', '21', '9'),
 'sinussurg': ('37', '21', '20'), 'skullbase': ('44, 45', '19', ''), 'facplast': ('35, 40, 41', '22', ''),
 'tonsil': ('49, 87', '6', '10'), 'deepneck': ('62', '12', '25'), 'osa': ('51, 75', '6', '16'), 'npc': ('61', '20', ''),
 'tonsil_ca': ('56', '6', ''), 'pouch': ('48', '10', '13'), 'oralanat': ('', '6', ''), 'oraldis': ('54, 57', '6', '10'),
 'oralbenign': ('57', '6', ''), 'pharanat': ('', '6', ''), 'adenoid': ('87, 88', '6', '10'), 'pharyngitis': ('49, 76', '6', '10'),
 'hypoca': ('60', '10', ''), 'oesoph': ('48', '10', '13'), 'fbfood': ('48', '10', '25'), 'cleft': ('89', '23', '17'),
}
p = W + 'data.js'; s = open(p, encoding='utf-8').read()
pre = 'window.CLINIC_DATA='; D = json.loads(s[len(pre):].rstrip().rstrip(';'))
n = 0
for t in D['t']:
    if t['id'] not in M or 'Oxford' in (t.get('srcs') or ''): continue
    ot, os_, oh = M[t['id']]
    parts = [x for x in (ot and 'Oxford Textbook of Otolaryngology ch. ' + ot, os_ and 'Oxford Specialist Handbook ch. ' + os_,
                         oh and 'Oxford Handbook of ENT ch. ' + oh) if x]
    code = ';'.join(x for x in (ot and 'OT' + ot.replace(' ', ''), os_ and 'OS' + os_.replace(' ', ''), oh and 'OH' + oh.replace(' ', '')) if x)
    t['srcs'] = ', '.join(parts) + (', ' + t['srcs'] if t.get('srcs') else '')
    t['src'] = code + (';' + t['src'] if t.get('src') else '')
    n += 1
open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('updated', n, 'topics; missing:', [t['id'] for t in D['t'] if t['id'] not in M and t['g'] != 'appr' and 'Oxford' not in (t.get('srcs') or '')])
