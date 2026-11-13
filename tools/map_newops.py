"""Add the newer theatre chapters and minor-procedure articles to the curriculum map in hub/hub.js. Safe to re-run."""
import os, re
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/hub/hub.js')
OPN = {3: "Recurrent respiratory papillomatosis", 20: "Percutaneous tracheostomy", 27: "Excision and reconstruction of lip cancer",
 46: "Upper oesophageal sphincter dysfunction", 52: "Drug-induced sleep endoscopy", 75: "Soft tissue and vascular injuries of the neck",
 89: "Ranula", 96: "Nasal septal perforation repair", 99: "Ethmoid artery ligation", 100: "Surgery for hereditary haemorrhagic telangiectasia",
 102: "Balloon sinus dilation", 104: "Caldwell-Luc operation", 105: "Oroantral fistula repair", 109: "External ethmoidectomy",
 111: "Frontal sinus trephination", 113: "Draf III (endoscopic modified Lothrop)", 114: "Osteoplastic frontal sinus obliteration",
 116: "Endoscopic repair of CSF leaks", 118: "Transcranial and endonasal anterior skull base approaches", 127: "Exostoses and osteomas of the ear canal",
 135: "Bone-anchored hearing devices", 136: "Implantable middle ear devices", 139: "Tumours of the facial nerve", 145: "Temporal bone trauma",
 147: "Superior semicircular canal dehiscence", 150: "Optic nerve decompression", 151: "Orbital decompression", 152: "Orbital abscess",
 153: "Lateral canthotomy", 161: "Excision of head and neck skin cancer", 173: "Skin grafting", 180: "Facial reanimation",
 186: "Orbital and midface fractures", 189: "Choanal atresia and pyriform aperture stenosis", 190: "Midline nasal masses",
 194: "Subglottic stenosis", 197: "EXIT procedure", 201: "Branchial cleft cysts and sinuses", 205: "Paediatric cochlear implantation",
 207: "Microtia", 208: "Ear canal atresia and stenosis", 209: "Otoplasty"}
ADD = {  # syllabus topic title -> codes to add
 "Trauma to the ear, upper aerodigestive tract and neck": "c:earminor o:75 o:186",
 "Rhinosinusitis; orbital and intracranial complications": "o:152 o:109 o:111",
 "Airway pathology in childhood": "c:fona o:194 o:3 o:197",
 "The drooling child": "c:mouthminor",
 "Acute tonsillitis, diseases of the adenoids and their complications": "c:mouthminor",
 "Congenital and acquired neck masses": "o:201 o:197",
 "Language delay and dysphonia in childhood": "c:mouthminor o:3",
 "Congenital abnormalities of the ear": "c:earminor o:207 o:208 o:209 o:135",
 "Congenital deafness": "o:205 o:135",
 "Nasal obstruction": "o:189 o:190",
 "Obstructive sleep apnoea": "o:52",
 "Adenoid and tonsillar pathology in adults": "c:mouthminor",
 "Airway obstruction in adults": "c:fona o:194 o:20",
 "Craniocervical trauma in adults": "o:75 o:186 o:153",
 "Disorders of swallowing": "o:46",
 "Congenital abnormalities of the head and neck in adults": "o:201",
 "Non-neoplastic salivary gland disease": "c:mouthminor o:89",
 "Oral pathology": "c:mouthminor o:27 o:89",
 "Sleep-related breathing disorders": "o:52",
 "Laryngology and voice disorders": "o:3",
 "Tracheostomy care (adult)": "o:20",
 "Non-infective, acquired lesions of the pinna and external ear": "c:earminor o:127",
 "Infective conditions of the pinna and external ear canal": "c:earminor",
 "Trauma": "o:145",
 "Adult hearing loss": "o:135 o:136",
 "Facial palsy": "o:180 o:139",
 "Disorders of balance": "o:147",
 "Lateral skull base tumours": "o:139",
 "Epistaxis": "c:fona o:99 o:100",
 "Nasal trauma and deformity": "o:96 o:186",
 "Acute and chronic rhinosinusitis": "o:102 o:104 o:105 o:109 o:111 o:113 o:114",
 "Congenital abnormalities of the nose and sinuses": "o:189 o:190",
 "Sinonasal neoplasms, including anterior skull base tumours": "o:118 o:113",
 "CSF leaks and skull base defects": "o:116",
 "Orbital disorders": "o:151 o:150 o:152 o:153",
 "Congenital abnormalities of the face": "o:209 o:207",
 "Skin cancer": "o:161 o:173 o:27",
 "Reconstruction": "o:173 o:180",
}
IDX = {"Tracheostomies": ["o:20"], "Paediatric endoscopies, including flexible": ["o:194", "o:3"], "Functional endoscopic sinus surgery": ["o:113"]}
s = open(P, encoding='utf-8').read()
m = re.search(r'const OPN=\{([^}]*)\};', s)
have = dict((int(k), v) for k, v in re.findall(r'(\d+):"([^"]*)"', m.group(1)))
have.update(OPN)
s = s[:m.start()] + 'const OPN={' + ','.join('%d:"%s"' % (k, have[k]) for k in sorted(have)) + '};' + s[m.end():]
for t, codes in ADD.items():
    rx = re.compile(r'(\["' + re.escape(t) + r'",\[[\d,]*\],")([^"]*)(")')
    mm = rx.search(s); assert mm, t
    cur = mm.group(2).split(' ')
    new = cur + [c for c in codes.split() if c not in cur]
    s = s[:mm.start()] + mm.group(1) + ' '.join(new) + mm.group(3) + s[mm.end():]
for t, codes in IDX.items():
    rx = re.compile(r'(\["' + re.escape(t) + r'","[^"]*",\[)([^\]]*)(\])')
    mm = rx.search(s); assert mm, t
    cur = re.findall(r'"([^"]+)"', mm.group(2))
    new = cur + [c for c in codes if c not in cur]
    s = s[:mm.start()] + mm.group(1) + ','.join('"%s"' % c for c in new) + mm.group(3) + s[mm.end():]
open(P, 'w', encoding='utf-8').write(s)
print('OPN', len(have))
