"""Fill imaging cases (im) and anatomy notes sections (rd) for clinical topics whose panel was empty. Safe to re-run:
only topics with no links are touched."""
import json, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/links.js')
F = {
 'lxanat': (['glottic-tumor', 'laryngocele'], ['larynx-s1', 'larynx-s4', 'larynx-s6', 'larynx-s7', 'larynx-s9']),
 'laryngitis': (['supraglottic-tumor'], ['larynx-s7', 'larynx-s5']),
 'voice': (['paralysis-of-the-recurrent-laryngeal-nerve'], ['larynx-s7', 'larynx-s8', 'larynx-s9']),
 'trach': (['laryngeal-trauma', 'foreign-bodies'], ['larynx-s11', 'larynx-s12', 'neck-s0']),
 'laser': (['glottic-tumor'], ['larynx-s12', 'larynx-s7']),
 'hnrt': (['osteoradionecrosis', 'effects-of-radiotherapy-on-cpa-schwannoma'], ['neck-s7', 'neck-s10']),
 'skinca': (['malignancies-of-the-parotid-gland'], ['extear-s0', 'nose-s0', 'salivary-s2']),
 'hnrecon': (['squamous-cell-carcinoma-oral-cavity-oropharynx-a'], ['neck-s11', 'mandible-s7', 'oral-s7']),
 'atrophic': (['wegener-granulomatosis'], ['nose-s3', 'nose-s6']),
 'nphys': (['nasal-polyps'], ['nose-s2', 'nose-s3', 'nose-s6', 'nose-s11']),
 'extnose': (['fracture-of-the-nasal-bone-and-retention-cysts'], ['nose-s0', 'nose-s1']),
 'nfb': (['foreign-bodies', 'choanal-atresia'], ['nose-s2', 'nose-s3']),
 'facplast': (['blow-out-fracture'], ['nose-s0', 'facial-s7']),
 'oralanat': (['squamous-cell-carcinoma-oral-cavity-oropharynx-a'], ['oral-s0', 'oral-s2', 'oral-s3', 'oral-s5', 'oral-s6']),
 'oraldis': (['ranula-of-the-sublingual-gland'], ['oral-s0', 'oral-s3']),
 'pharanat': (['adenoid-hypertrophy', 'thornwaldt-cyst'], ['pharynx-s0', 'pharynx-s1', 'pharynx-s3', 'pharynx-s4', 'pharynx-s8']),
 'pharyngitis': (['tonsillar-abscess', 'parapharyngeal-abscess'], ['pharynx-s4', 'pharynx-s7']),
 'cleft': (['malformations-treacher-collins'], ['embryo-s3', 'oral-s6', 'embryo-s8']),
 'ap_otorr': (['malignant-external-otitis-or-necrotizing-externa', 'cholesteatoma-of-the-middle-ear', 'malignancy-of-the-external-auditory-canal-squamo', 'dural-prolapse-and-cerebrospinal-fluid-leakage'], ['extear-s2', 'extear-s4', 'midear-s10']),
 'ap_dizzy': (['vestibular-schwannoma', 'labyrinthitis-and-subclinical-meningitis', 'iatrogenic-fenestration'], ['inner-s5', 'inner-s8', 'inner-s11']),
 'ap_full': (['nasopharyngeal-carcinoma', 'adenoid-hypertrophy', 'vestibular-aqueduct-enlargements'], ['et-s4', 'et-s8', 'inner-s11']),
 'ap_face': (['schwannoma-of-the-facial-nerve', 'hemangioma-of-the-geniculate-ganglion', 'malignancies-of-the-parotid-gland', 'skull-base-fractures'], ['facial-s1', 'facial-s4', 'facial-s9', 'facial-s10']),
 'ap_block': (['nasal-polyps', 'unilateral-nasal-polyps', 'inverted-papilloma', 'angiofibroma-juvenile', 'choanal-atresia', 'piriform-aperture-malformation'], ['nose-s3', 'nose-s4', 'nose-s5']),
 'ap_rhin': (['dural-defect-after-sinonasal-surgery', 'meningoencephalocele', 'odontogenic-sinusitis'], ['nose-s5', 'sinus-s4', 'sinus-s11']),
 'ap_pnd': (['maxillary-sinusitis', 'thornwaldt-cyst', 'adenoid-hypertrophy'], ['nose-s5', 'pharynx-s5']),
 'ap_pain': (['frontal-sinusitis', 'mucocele', 'sinonasal-tumours'], ['trigeminal-s2', 'trigeminal-s5', 'itf-s5']),
 'ap_smell': (['olfactory neuroblastoma', 'nasal-polyps'], ['nose-s11', 'sinus-s4']),
 'ap_epiph': (['nasolacrimal-mucocele'], ['orbit-s5', 'nose-s3']),
 'ap_crust': (['wegener-granulomatosis', 'wegener-granulomatosis-orbital-involvement'], ['nose-s4', 'nose-s7']),
 'ap_sore': (['tonsillar-abscess', 'parapharyngeal-abscess', 'abscess-of-the-neck', 'tonsillar-carcinoma'], ['pharynx-s3', 'pharynx-s7']),
 'ap_ulcer': (['squamous-cell-carcinoma-oral-cavity-oropharynx-a'], ['oral-s0', 'oral-s9']),
 'ap_hoarse': (['paralysis-of-the-recurrent-laryngeal-nerve', 'glottic-tumor', 'laryngocele'], ['larynx-s7', 'larynx-s9', 'vessels-s6']),
 'ap_dysph': (['zenker-diverticulum-1', 'esophageal-passage-disorders', 'aspiration'], ['pharynx-s2', 'pharynx-s9']),
 'ap_globus': (['supraglottic-and-pharyngeal-tumors', 'hypertrophy-of-the-thyroid-gland-thyroid-goiter'], ['pharynx-s8', 'pharynx-s9']),
 'ap_saliv': (['sialolith-of-the-submandibular-gland', 'sialadenitis', 'pleomorphic-adenoma-of-the-parotid-gland', 'malignancies-of-the-parotid-gland'], ['salivary-s1', 'salivary-s3', 'salivary-s5']),
 'syndr': (['malformations-treacher-collins', 'malformations-of-the-inner-ear', 'vestibular-aqueduct-enlargements', 'choanal-atresia'], ['embryo-s0', 'embryo-s8']),
 'oral_ca': (['squamous-cell-carcinoma-oral-cavity-oropharynx-a', 'multiple-synchronous-malignancies'], ['oral-s2', 'oral-s9', 'neck-s7', 'mandible-s5']),
 'paeds_vs': (['paralysis-of-the-recurrent-laryngeal-nerve', 'aspiration', 'foreign-bodies'], ['larynx-s10', 'larynx-s7']),
 'anaes': (['laryngeal-trauma', 'pneumothorax'], ['larynx-s10', 'larynx-s11', 'neck-s0']),
}
s = open(W, encoding='utf-8').read(); i = s.find('window.CLINIC_LINKS=')
L = json.loads(s[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';')); n = 0
for k, (im, rd) in F.items():
    cur = L.get(k) or {'im': [], 'rd': []}
    if cur.get('im') or cur.get('rd'): continue
    L[k] = {'im': im, 'rd': rd}; n += 1
open(W, 'w', encoding='utf-8').write(s[:i] + 'window.CLINIC_LINKS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('filled', n)
