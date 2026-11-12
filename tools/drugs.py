"""Register the Drugs library: clinical-engine articles content/clinic/dr_*.txt in the group 'drug',
listed by class under Clinical > Drugs. A drug is registered only when its article exists."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = os.path.join(ROOT, 'app/src/main/assets/www/clinic/')
DC = {
 'pen': 'Antibiotics: penicillins', 'ceph': 'Antibiotics: cephalosporins and carbapenems', 'abx': 'Antibiotics: other classes',
 'ear': 'Ear preparations', 'nose': 'Nasal preparations', 'allergy': 'Allergy, rhinitis and biologics',
 'ster': 'Corticosteroids', 'vest': 'Vertigo and Ménière\'s disease', 'antinf': 'Antifungals and antivirals',
 'la': 'Local anaesthetics and vasoconstrictors', 'haem': 'Bleeding and haemostasis', 'analg': 'Pain and nausea',
 'reflux': 'Reflux', 'thy': 'Thyroid and parathyroid', 'onc': 'Head and neck oncology', 'spec': 'Special ENT agents',
 'tox': 'Drugs that harm the ear and nose',
}
# id, title, class, one-line lede, search aliases, related clinical topics
DR = [
 ('dr_amox', 'Amoxicillin', 'pen', 'The first-line antibiotic for acute otitis media and acute bacterial sinusitis, and the drug you must never give in glandular fever.', 'amoxil penicillin', ['om', 'abs']),
 ('dr_coamox', 'Co-amoxiclav', 'pen', 'Amoxicillin protected by clavulanic acid: the workhorse for beta-lactamase producers, peritonsillar and deep neck infection, bites and complicated sinusitis.', 'augmentin amoxicillin clavulanate', ['deepneck', 'abs', 'tonsil']),
 ('dr_penv', 'Phenoxymethylpenicillin and benzylpenicillin', 'pen', 'Narrow-spectrum penicillins: penicillin V by mouth for streptococcal tonsillitis, benzylpenicillin intravenously for severe tonsillitis and quinsy.', 'penicillin v benzylpenicillin penicillin g pen v', ['tonsil', 'pharyngitis']),
 ('dr_fluclox', 'Flucloxacillin', 'pen', 'The anti-staphylococcal penicillin: perichondritis, furunculosis, infected haematomas and cellulitis of the face and neck.', 'floxapen staphylococcus', ['perich', 'oe']),
 ('dr_piptaz', 'Piperacillin with tazobactam', 'pen', 'Broad intravenous cover including Pseudomonas: necrotising otitis externa, hospital-acquired and post-operative head and neck infection.', 'tazocin piptaz', ['oe', 'deepneck']),
 ('dr_cefal', 'Oral cephalosporins: cefalexin and cefuroxime', 'ceph', 'Oral second-line beta-lactams for penicillin-allergic patients with non-severe allergy, and for skin and soft tissue infection.', 'cefalexin cephalexin cefuroxime zinnat keflex', ['om', 'abs']),
 ('dr_ceftri', 'Ceftriaxone and cefotaxime', 'ceph', 'Third-generation cephalosporins: the backbone for intracranial complications of ear and sinus infection, orbital cellulitis and severe deep neck infection.', 'rocephin cefotaxime third generation cephalosporin meningitis', ['icc', 'orbit', 'mastoiditis']),
 ('dr_ceftaz', 'Ceftazidime', 'ceph', 'The anti-pseudomonal cephalosporin: necrotising otitis externa and Pseudomonas in the post-operative or immunocompromised patient.', 'fortum anti-pseudomonal', ['oe']),
 ('dr_mero', 'Meropenem', 'ceph', 'The carbapenem kept for resistant organisms and the sickest patients: severe deep neck sepsis, ESBL infection and failed first-line treatment of skull base osteomyelitis.', 'meronem carbapenem esbl', ['deepneck', 'oe']),
 ('dr_clari', 'Clarithromycin', 'abx', 'The macrolide for penicillin allergy, and as long-term low-dose therapy for chronic rhinosinusitis without polyps.', 'klaricid macrolide', ['crs', 'abs']),
 ('dr_azi', 'Azithromycin', 'abx', 'A once-daily macrolide with a long tissue half-life: short courses for respiratory infection, and an alternative long-term anti-inflammatory macrolide.', 'zithromax macrolide', ['crs']),
 ('dr_clinda', 'Clindamycin', 'abx', 'Anaerobic and streptococcal cover that penetrates bone and abscess: the penicillin-allergy choice for tonsillitis, quinsy, dental and deep neck infection.', 'dalacin lincosamide', ['deepneck', 'tonsil']),
 ('dr_metro', 'Metronidazole', 'abx', 'The anaerobic partner: added for dental, peritonsillar, deep neck and intracranial infection, and for anaerobic cover after contaminated surgery.', 'flagyl anaerobe', ['deepneck', 'icc']),
 ('dr_doxy', 'Doxycycline', 'abx', 'A tetracycline for penicillin-allergic sinusitis, atypical organisms and Lyme disease, and a sclerosant for lymphatic malformations.', 'vibramycin tetracycline lyme', ['abs', 'facial']),
 ('dr_cipro', 'Ciprofloxacin (systemic)', 'abx', 'The only oral anti-pseudomonal antibiotic: necrotising otitis externa, perichondritis of the pinna and Pseudomonas wound infection.', 'ciproxin fluoroquinolone quinolone pseudomonas', ['oe', 'perich']),
 ('dr_cotrim', 'Co-trimoxazole', 'abx', 'Trimethoprim with sulfamethoxazole: MRSA and Pneumocystis, and maintenance in localised granulomatosis with polyangiitis.', 'septrin trimethoprim sulfamethoxazole', ['gpa']),
 ('dr_vanc', 'Vancomycin and teicoplanin', 'abx', 'Glycopeptides for MRSA and serious Gram-positive infection, with drug-level monitoring and a risk to the kidney and the ear.', 'vancocin teicoplanin targocid glycopeptide mrsa', ['icc', 'deepneck']),
 ('dr_gent', 'Gentamicin (systemic)', 'abx', 'An aminoglycoside for Gram-negative sepsis: effective, cheap, and permanently ototoxic, so every ENT surgeon must know when not to give it.', 'aminoglycoside amikacin tobramycin', ['sensori']),
 ('dr_linez', 'Linezolid', 'abx', 'An oral and intravenous oxazolidinone for resistant Gram-positive infection, with myelosuppression and serotonin interactions to watch.', 'zyvox oxazolidinone mrsa vre', []),
 ('dr_tb', 'Antituberculous drugs', 'abx', 'Rifampicin, isoniazid, pyrazinamide and ethambutol for tuberculous lymphadenitis, laryngeal and ear tuberculosis.', 'rifampicin isoniazid pyrazinamide ethambutol tuberculosis tb scrofula', ['neckmass', 'laryngitis']),
 ('dr_eqc', 'Quinolone ear drops: ciprofloxacin and ofloxacin', 'ear', 'The only antibiotic ear drops proven safe in a perforated drum or with a grommet: first-line for discharging ears.', 'ciloxan cetraxal ofloxacin ciprodex cilodex ear drops', ['oe', 'csom', 'myring']),
 ('dr_eamg', 'Aminoglycoside and combination ear drops', 'ear', 'Gentamicin, neomycin and framycetin combined with a steroid: effective for otitis externa, but a risk to the inner ear through an open middle ear.', 'gentisone sofradex otomize otosporin neomycin framycetin polymyxin', ['oe', 'csom']),
 ('dr_ester', 'Steroid ear drops', 'ear', 'Betamethasone and prednisolone drops for eczematous and allergic otitis externa, granulation and canal inflammation.', 'betnesol vistamethasone predsol', ['oe']),
 ('dr_eaf', 'Antifungal ear preparations', 'ear', 'Clotrimazole and other topical antifungals for otomycosis, with meticulous aural toilet as half of the treatment.', 'canesten clotrimazole otomycosis aspergillus candida', ['oe']),
 ('dr_eacid', 'Acidifying and astringent ear preparations', 'ear', 'Acetic acid, aluminium acetate and boric acid: restoring the canal\'s acid environment and drying a wet ear.', 'earcalm acetic acid aluminium acetate burow boric acid', ['oe']),
 ('dr_wax', 'Cerumenolytics', 'ear', 'Olive oil, sodium bicarbonate and urea hydrogen peroxide: softening wax before syringing or microsuction.', 'wax drops olive oil sodium bicarbonate otex urea peroxide cerumen', ['hl']),
 ('dr_ins', 'Intranasal corticosteroids', 'nose', 'The most effective treatment for allergic rhinitis and the foundation of medical treatment for chronic rhinosinusitis with and without polyps.', 'mometasone nasonex fluticasone flixonase avamys beclometasone budesonide rhinocort nasal spray', ['rhinitis', 'crs']),
 ('dr_budir', 'Steroid drops and irrigations', 'nose', 'Betamethasone drops, fluticasone nasules and budesonide rinses: getting steroid to the sinuses and polyps when sprays cannot.', 'betnesol nasal drops flixonase nasule budesonide irrigation pulmicort', ['crs']),
 ('dr_saline', 'Saline irrigation', 'nose', 'High-volume isotonic saline: cheap, safe and the evidence-based first step in chronic rhinosinusitis and after sinus surgery.', 'nasal douche neilmed sinus rinse hypertonic', ['crs', 'sinussurg']),
 ('dr_decon', 'Topical nasal decongestants', 'nose', 'Xylometazoline and oxymetazoline: rapid relief of congestion for a few days, then rebound and rhinitis medicamentosa.', 'otrivine xylometazoline oxymetazoline afrin sudafed spray', ['rhinitis']),
 ('dr_ipra', 'Ipratropium nasal spray', 'nose', 'An anticholinergic spray for watery rhinorrhoea: vasomotor, gustatory and elderly rhinitis.', 'rinatec atrovent ipratropium bromide', ['rhinitis']),
 ('dr_azel', 'Azelastine and combination sprays', 'nose', 'A topical antihistamine, alone or with fluticasone, for allergic rhinitis that a steroid alone has not controlled.', 'rhinolast dymista azelastine fluticasone', ['rhinitis']),
 ('dr_cromo', 'Sodium cromoglicate', 'nose', 'A mast-cell stabiliser for prophylaxis of allergic rhinitis and conjunctivitis, safe in children and pregnancy.', 'rynacrom opticrom cromoglycate', ['rhinitis']),
 ('dr_naseptin', 'Naseptin and mupirocin', 'nose', 'Antiseptic and antibiotic nasal creams for vestibulitis, crusting after cautery, recurrent epistaxis in children and staphylococcal decolonisation.', 'naseptin chlorhexidine neomycin bactroban mupirocin vestibulitis', ['epistaxis']),
 ('dr_ahist', 'Oral antihistamines', 'allergy', 'Second-generation H1 antihistamines for allergic rhinitis and urticaria; first-generation ones sedate and are kept for specific uses.', 'cetirizine loratadine fexofenadine desloratadine chlorphenamine piriton', ['rhinitis']),
 ('dr_montel', 'Montelukast', 'allergy', 'A leukotriene receptor antagonist for allergic rhinitis with asthma, aspirin-exacerbated respiratory disease, and mild childhood sleep-disordered breathing.', 'singulair leukotriene', ['rhinitis', 'crs', 'osa']),
 ('dr_pseudo', 'Oral decongestants', 'allergy', 'Pseudoephedrine and phenylephrine: short-term relief of congestion and Eustachian tube symptoms, with cardiovascular cautions.', 'sudafed pseudoephedrine phenylephrine', ['et']),
 ('dr_immuno', 'Allergen immunotherapy', 'allergy', 'Subcutaneous or sublingual desensitisation: the only treatment that changes the course of allergic rhinitis.', 'desensitisation grazax acarizax slit scit', ['rhinitis']),
 ('dr_dupi', 'Dupilumab', 'allergy', 'An anti-IL-4 receptor alpha monoclonal antibody: the most effective biologic for severe chronic rhinosinusitis with nasal polyps.', 'dupixent biologic il-4 il-13 type 2', ['crs']),
 ('dr_omal', 'Omalizumab', 'allergy', 'An anti-IgE biologic for severe allergic asthma, chronic urticaria and nasal polyps.', 'xolair anti-ige biologic', ['crs']),
 ('dr_mepo', 'Mepolizumab and anti-IL-5 biologics', 'allergy', 'Anti-eosinophil biologics for severe polyposis, eosinophilic asthma and eosinophilic granulomatosis with polyangiitis.', 'nucala benralizumab reslizumab il-5 eosinophil', ['crs', 'gpa']),
 ('dr_pred', 'Prednisolone', 'ster', 'The oral steroid of ENT: sudden hearing loss, Bell\'s palsy, polyps, laryngeal oedema and many inflammatory diseases, with harms that must be weighed every time.', 'oral steroid corticosteroid prednisone', ['ssnhl', 'facial', 'crs']),
 ('dr_dexa', 'Dexamethasone', 'ster', 'A potent long-acting steroid: airway oedema, croup, post-tonsillectomy nausea and pain, and intratympanic treatment.', 'decadron steroid croup ponv', ['croup', 'tonsil']),
 ('dr_mpred', 'Methylprednisolone and hydrocortisone', 'ster', 'Intravenous steroids: hydrocortisone for anaphylaxis and adrenal cover, methylprednisolone pulses for vasculitis and severe inflammation.', 'solu-medrol solu-cortef hydrocortisone steroid cover', ['gpa', 'anaes']),
 ('dr_itster', 'Intratympanic steroids', 'ster', 'Dexamethasone or methylprednisolone through the drum for sudden sensorineural hearing loss and Ménière\'s disease.', 'intratympanic dexamethasone methylprednisolone transtympanic', ['ssnhl', 'meniere']),
 ('dr_triam', 'Triamcinolone injection', 'ster', 'A depot steroid injected into keloids, subglottic and laryngeal scar, and inflammatory lesions.', 'kenalog triamcinolone keloid intralesional', ['pinna', 'lxcong']),
 ('dr_beta', 'Betahistine', 'vest', 'The most prescribed drug for Ménière\'s disease, with little evidence that it changes the disease.', 'serc betahistine', ['meniere']),
 ('dr_vsupp', 'Vestibular sedatives and antiemetics', 'vest', 'Prochlorperazine, cinnarizine, cyclizine and promethazine: for acute vertigo, used for days, not weeks.', 'stemetil buccastem cinnarizine stugeron cyclizine promethazine', ['vertigo']),
 ('dr_benzo', 'Benzodiazepines for vertigo', 'vest', 'Diazepam and related drugs: vestibular suppression and anxiolysis in severe acute vertigo, with dependence and delayed compensation as the price.', 'diazepam lorazepam clonazepam valium', ['vertigo']),
 ('dr_diur', 'Diuretics in Ménière\'s disease', 'vest', 'Thiazides and acetazolamide used to reduce endolymphatic pressure, with modest evidence and real side effects.', 'bendroflumethiazide hydrochlorothiazide acetazolamide diamox', ['meniere']),
 ('dr_itgent', 'Intratympanic gentamicin', 'vest', 'Chemical labyrinthectomy for disabling Ménière\'s vertigo: controls vertigo in about 90% at the risk of the hearing.', 'gentamicin intratympanic ablation', ['meniere']),
 ('dr_migr', 'Vestibular migraine prophylaxis', 'vest', 'Propranolol, amitriptyline, topiramate, pizotifen and others for the commonest cause of recurrent spontaneous vertigo.', 'propranolol amitriptyline topiramate pizotifen flunarizine candesartan venlafaxine', ['vertigo', 'ap_dizzy']),
 ('dr_fluc', 'Fluconazole', 'antinf', 'An oral azole for Candida: oropharyngeal and oesophageal candidiasis, and candidal otomycosis that topical treatment has not cleared.', 'diflucan azole candida thrush', ['oraldis']),
 ('dr_itra', 'Itraconazole', 'antinf', 'An azole with activity against Aspergillus, used in allergic fungal rhinosinusitis and chronic invasive fungal disease.', 'sporanox azole aspergillus', ['afs']),
 ('dr_vori', 'Voriconazole and posaconazole', 'antinf', 'The first-line treatment for invasive aspergillosis of the sinuses, and posaconazole for mucormycosis step-down.', 'vfend posaconazole noxafil isavuconazole aspergillus mucor', ['afs']),
 ('dr_ampho', 'Amphotericin B', 'antinf', 'Liposomal amphotericin: the emergency drug for acute invasive fungal sinusitis, above all mucormycosis, given with urgent debridement.', 'ambisome amphotericin mucormycosis zygomycosis', ['afs']),
 ('dr_oralaf', 'Nystatin and miconazole oral gel', 'antinf', 'Topical antifungals for oral thrush, denture stomatitis and candidal angular cheilitis.', 'nystan daktarin oral gel thrush', ['oraldis']),
 ('dr_acic', 'Aciclovir and valaciclovir', 'antinf', 'Antivirals for herpes zoster oticus, herpes simplex and, with steroids, severe Bell\'s palsy.', 'zovirax valtrex famciclovir ramsay hunt shingles', ['facial']),
 ('dr_cido', 'Cidofovir', 'antinf', 'An antiviral injected into papillomas as adjuvant treatment of aggressive recurrent respiratory papillomatosis.', 'vistide rrp papilloma', ['benign']),
 ('dr_lido', 'Lidocaine', 'la', 'The local anaesthetic of ENT: infiltration, nerve blocks, sprays and gels, with a maximum dose every resident must know by heart.', 'lignocaine xylocaine lidocaine with adrenaline local anaesthetic toxicity', ['anaes']),
 ('dr_cophen', 'Co-phenylcaine and topical nasal anaesthesia', 'la', 'Lidocaine with phenylephrine spray: anaesthesia and decongestion for nasendoscopy, cautery and nasal procedures.', 'co-phenylcaine forte lidocaine phenylephrine nasal spray', ['epistaxis']),
 ('dr_bupi', 'Bupivacaine and levobupivacaine', 'la', 'Long-acting amides for wound infiltration and blocks, more cardiotoxic than lidocaine.', 'marcain chirocaine levobupivacaine', ['anaes']),
 ('dr_cocaine', 'Cocaine (topical)', 'la', 'The only local anaesthetic that also vasoconstricts: Moffett\'s solution and cocaine paste for nasal surgery, with cardiovascular risks.', 'moffett cocaine paste topical', ['septum', 'sinussurg']),
 ('dr_adren', 'Adrenaline', 'la', 'One drug, three uses: vasoconstriction in infiltration and on pledgets, nebulised for croup and stridor, and intramuscular for anaphylaxis.', 'epinephrine epipen anaphylaxis', ['croup', 'stridor', 'anaes']),
 ('dr_topear', 'Topical anaesthesia of the ear: phenol, EMLA and tetracaine', 'la', 'Anaesthetising the drum and canal for office myringotomy, grommets, injections and biopsies.', 'phenol emla tetracaine ametop bonain', ['myring']),
 ('dr_benzy', 'Benzydamine and mucosal analgesics', 'la', 'Anti-inflammatory mouthwashes and sprays, lidocaine gels and coating agents for sore throat, ulcers and mucositis.', 'difflam benzydamine mucositis mouthwash gelclair', ['oraldis', 'pharyngitis']),
 ('dr_txa', 'Tranexamic acid', 'haem', 'An antifibrinolytic for epistaxis, tonsillar haemorrhage and bleeding surgery: oral, intravenous or topical.', 'cyklokapron txa antifibrinolytic', ['epistaxis', 'tonsil']),
 ('dr_agno', 'Silver nitrate', 'haem', 'Chemical cautery for anterior epistaxis, granulation tissue and small bleeding points.', 'silver nitrate stick cautery', ['epistaxis']),
 ('dr_tophaem', 'Topical haemostatic agents', 'haem', 'Oxidised cellulose, gelatin, thrombin matrices and fibrin sealants: what each does and where it belongs.', 'surgicel gelfoam spongostan floseal surgiflo tisseel fibrin glue', ['epistaxis', 'sinussurg']),
 ('dr_anticoag', 'Anticoagulants and antiplatelets around ENT surgery', 'haem', 'Warfarin, the DOACs, heparins, aspirin and clopidogrel: when to stop, when to bridge, when to restart.', 'warfarin apixaban rivaroxaban edoxaban dabigatran heparin enoxaparin clopidogrel aspirin bridging', ['epistaxis', 'anaes']),
 ('dr_rev', 'Reversal of anticoagulation', 'haem', 'Vitamin K, prothrombin complex concentrate, idarucizumab, andexanet and protamine for the bleeding patient.', 'vitamin k phytomenadione beriplex octaplex pcc praxbind andexxa protamine', ['epistaxis']),
 ('dr_ddavp', 'Desmopressin', 'haem', 'A vasopressin analogue that releases von Willebrand factor: preparing patients with mild bleeding disorders for tonsillectomy and treating their bleeding.', 'ddavp von willebrand haemophilia', ['tonsil', 'epistaxis']),
 ('dr_para', 'Paracetamol', 'analg', 'The foundation of analgesia after every ENT operation, safe at the right dose and lethal in overdose.', 'acetaminophen panadol calpol', ['tonsil']),
 ('dr_nsaid', 'NSAIDs: ibuprofen and diclofenac', 'analg', 'Effective analgesia after tonsillectomy without a meaningful increase in bleeding, with kidney, stomach and asthma cautions.', 'ibuprofen nurofen diclofenac naproxen ketorolac', ['tonsil']),
 ('dr_opioid', 'Opioids: codeine, morphine, oxycodone and tramadol', 'analg', 'Strong analgesia with respiratory depression: why codeine is contraindicated after tonsillectomy in children and how to use opioids safely in sleep apnoea.', 'codeine morphine oramorph oxycodone tramadol opioid', ['tonsil', 'osa']),
 ('dr_ponv', 'Antiemetics: ondansetron and others', 'analg', 'Preventing and treating nausea after ear, tonsil and thyroid surgery.', 'ondansetron zofran cyclizine metoclopramide ponv nausea', ['tonsil', 'earsurg']),
 ('dr_neuro', 'Drugs for neuropathic and facial pain', 'analg', 'Carbamazepine, gabapentin, pregabalin and amitriptyline for neuralgias, burning mouth and post-surgical neuropathic pain.', 'carbamazepine tegretol gabapentin pregabalin amitriptyline trigeminal glossopharyngeal neuralgia', ['ap_pain', 'otalgia']),
 ('dr_ppi', 'Proton pump inhibitors', 'reflux', 'Omeprazole and lansoprazole for reflux disease and suspected laryngopharyngeal reflux, with an honest view of the evidence.', 'omeprazole lansoprazole esomeprazole pantoprazole lpr', ['ap_globus', 'laryngitis']),
 ('dr_algin', 'Alginates', 'reflux', 'Gaviscon and related alginates: a raft on the stomach that also blocks non-acid reflux into the larynx.', 'gaviscon advance alginate', ['ap_globus', 'laryngitis']),
 ('dr_h2', 'H2 receptor antagonists', 'reflux', 'Famotidine and related drugs: night-time acid control and an alternative when PPIs are unsuitable.', 'famotidine ranitidine cimetidine', ['laryngitis']),
 ('dr_levo', 'Levothyroxine and liothyronine', 'thy', 'Thyroid hormone replacement after thyroidectomy, TSH suppression in differentiated cancer, and liothyronine for short-term use.', 'thyroxine levothyroxine liothyronine t3 t4 tsh suppression', ['thyroid']),
 ('dr_carbi', 'Carbimazole and propylthiouracil', 'thy', 'Antithyroid drugs: making a thyrotoxic patient safe for surgery, and the agranulocytosis every patient must be warned about.', 'carbimazole methimazole propylthiouracil ptu antithyroid', ['thyroid']),
 ('dr_rai', 'Radioactive iodine', 'thy', 'Iodine-131 for remnant ablation and treatment of differentiated thyroid cancer, and for Graves\' disease and toxic nodules.', 'i-131 radioiodine rai ablation', ['thyroid']),
 ('dr_iodine', 'Potassium iodide and preoperative preparation for thyroid surgery', 'thy', 'Lugol\'s iodine, beta blockers and steroids to prepare the thyrotoxic patient and prevent thyroid storm.', 'lugol iodine potassium iodide propranolol thyroid storm', ['thyroid']),
 ('dr_calc', 'Calcium replacement', 'thy', 'Intravenous calcium gluconate and oral calcium carbonate for hypocalcaemia after thyroidectomy and parathyroidectomy.', 'calcium gluconate calcium carbonate adcal calcichew hypocalcaemia', ['thyroid', 'para']),
 ('dr_vitd', 'Active vitamin D: alfacalcidol and calcitriol', 'thy', 'Activated vitamin D for post-operative hypoparathyroidism and hungry bone syndrome.', 'alfacalcidol one-alpha calcitriol rocaltrol colecalciferol', ['para', 'thyroid']),
 ('dr_cina', 'Cinacalcet', 'thy', 'A calcimimetic that lowers parathyroid hormone when parathyroidectomy is not possible or has failed.', 'mimpara calcimimetic hyperparathyroidism', ['para']),
 ('dr_rhtsh', 'Recombinant TSH', 'thy', 'Thyrotropin alfa: stimulating thyroid tissue for ablation or surveillance without stopping levothyroxine.', 'thyrogen thyrotropin alfa', ['thyroid']),
 ('dr_tki', 'Targeted therapy for thyroid cancer', 'thy', 'Lenvatinib, sorafenib, selpercatinib and others for radioiodine-refractory and medullary thyroid cancer.', 'lenvatinib sorafenib vandetanib cabozantinib selpercatinib pralsetinib dabrafenib trametinib', ['thyroid']),
 ('dr_cis', 'Cisplatin', 'onc', 'The radiosensitiser of head and neck cancer, and the most important ototoxic drug an ENT surgeon will meet.', 'platinum chemoradiotherapy ototoxicity', ['hncprinc', 'hnrt']),
 ('dr_carbo', 'Carboplatin', 'onc', 'A platinum with less ototoxicity and nephrotoxicity than cisplatin, more myelosuppression.', 'platinum paraplatin', ['hncprinc']),
 ('dr_5fu', 'Fluorouracil', 'onc', 'A pyrimidine antimetabolite in induction and palliative regimens, and topically for superficial skin cancers.', '5-fu fluorouracil efudix capecitabine', ['hncprinc', 'skinca']),
 ('dr_taxane', 'Docetaxel and paclitaxel', 'onc', 'Taxanes in induction chemotherapy (TPF) and palliative treatment.', 'taxotere taxol taxane tpf', ['hncprinc']),
 ('dr_cetux', 'Cetuximab', 'onc', 'An anti-EGFR antibody given with radiotherapy when cisplatin cannot be, and in recurrent disease.', 'erbitux egfr', ['hncprinc', 'hnrt']),
 ('dr_ici', 'Pembrolizumab and nivolumab', 'onc', 'Immune checkpoint inhibitors: first-line for recurrent and metastatic head and neck cancer, with immune-related side effects.', 'keytruda opdivo pd-1 immunotherapy checkpoint', ['hncprinc']),
 ('dr_mtx', 'Methotrexate', 'onc', 'A palliative cytotoxic in head and neck cancer, and an immunosuppressant in granulomatosis with polyangiitis and autoimmune ear disease.', 'methotrexate antifolate', ['gpa']),
 ('dr_xero', 'Pilocarpine and saliva substitutes', 'onc', 'Treating the dry mouth of radiotherapy and Sjögren\'s syndrome.', 'salagen pilocarpine saliva substitute biotene xerostomia', ['hnrt', 'salivary']),
 ('dr_mmc', 'Mitomycin C', 'onc', 'A topical antifibroblast agent used to reduce restenosis in airway, choanal atresia and lacrimal surgery.', 'mitomycin antifibrotic stenosis', ['lxcong', 'congnose']),
 ('dr_bev', 'Bevacizumab', 'onc', 'An anti-VEGF antibody used systemically for papillomatosis and for hereditary haemorrhagic telangiectasia epistaxis.', 'avastin vegf rrp hht', ['hht', 'benign']),
 ('dr_botox', 'Botulinum toxin', 'spec', 'Chemodenervation for spasmodic dysphonia, sialorrhoea, Frey\'s syndrome, cricopharyngeal dysfunction, synkinesis and facial aesthetics.', 'botox dysport xeomin onabotulinumtoxin spasmodic dysphonia frey', ['voice', 'salivary', 'facial']),
 ('dr_glyco', 'Glycopyrronium and hyoscine for drooling', 'spec', 'Anticholinergics to reduce saliva in children with cerebral palsy, neurological disease and after surgery.', 'glycopyrrolate sialanar hyoscine scopolamine patch drooling sialorrhoea', ['salivary']),
 ('dr_propr', 'Propranolol for infantile haemangioma', 'spec', 'The first-line treatment for problematic infantile haemangiomas, including airway and periocular lesions.', 'propranolol hemangeol haemangioma subglottic', ['paeds_vs', 'lxcong']),
 ('dr_scler', 'Sclerosants', 'spec', 'Bleomycin, doxycycline, OK-432 and sodium tetradecyl sulfate for lymphatic and venous malformations and ranulas.', 'bleomycin picibanil ok-432 sodium tetradecyl sulfate std ethanol sclerotherapy', ['paeds_vs', 'oralbenign']),
 ('dr_fluor', 'Intrathecal fluorescein', 'spec', 'Dye injected through a lumbar drain to find a CSF leak at endoscopic repair: dose, dilution and risks.', 'fluorescein csf leak lumbar drain', ['csf']),
 ('dr_mblue', 'Methylene blue and other surgical dyes', 'spec', 'Methylene blue, indocyanine green and isosulfan blue for parathyroid, sentinel node and fistula localisation, and the serotonin warning.', 'methylthioninium indocyanine green icg isosulfan blue patent blue sentinel', ['para']),
 ('dr_heliox', 'Heliox', 'spec', 'A helium-oxygen mixture that buys time in upper airway obstruction by lowering turbulent airflow resistance.', 'helium oxygen stridor', ['stridor']),
 ('dr_hae', 'Drugs for angioedema', 'spec', 'Adrenaline, antihistamines and steroids for allergic angioedema; icatibant and C1-esterase inhibitor for bradykinin angioedema, including ACE inhibitor angioedema.', 'icatibant firazyr berinert c1 inhibitor ace inhibitor angioedema lanadelumab', ['stridor', 'anaes']),
 ('dr_ototox', 'Ototoxic drugs', 'tox', 'Aminoglycosides, platinum, loop diuretics, salicylates, quinine and others: what damages the ear, how, and how to monitor.', 'ototoxicity aminoglycoside cisplatin furosemide aspirin quinine vancomycin hearing loss', ['sensori', 'tinnitus']),
 ('dr_rhinmed', 'Drug-induced rhinitis and smell loss', 'tox', 'Decongestant overuse, antihypertensives, hormones and intranasal drugs that block the nose or destroy smell.', 'rhinitis medicamentosa drug induced rhinitis cocaine anosmia zinc', ['rhinitis', 'ap_smell']),
]

def main():
    p = W + 'data.js'; s = open(p, encoding='utf-8').read(); pre = 'window.CLINIC_DATA='
    D = json.loads(s[len(pre):].rstrip().rstrip(';'))
    D['g']['drug'] = 'Drugs'; D['dc'] = DC
    D['t'] = [t for t in D['t'] if t.get('g') != 'drug']
    ids = {t['id'] for t in D['t']}; n = 0
    for (tid, title, dc, one, alias, rel) in DR:
        if not os.path.exists(os.path.join(ROOT, 'content/clinic', tid + '.txt')): continue
        D['t'].append(dict(id=tid, t=title, g='drug', dc=dc, alias=alias, src='', one=one, call=[], cls=[], why=[], feat=[], dx=[], ddx=[], tx=[],
                           ops=[], cx=[], pearl=[], an=[], rel=[r for r in rel if r in ids], fu=[], tb=[], diff=[], srcs='BNF and BNF for Children; NICE and specialist society guidance; Scott-Brown; Cummings', sum=[]))
        n += 1
    open(p, 'w', encoding='utf-8').write(pre + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
    lp = W + 'links.js'; ls = open(lp, encoding='utf-8').read(); i = ls.find('window.CLINIC_LINKS=')
    LK = json.loads(ls[i + len('window.CLINIC_LINKS='):].rstrip().rstrip(';'))
    for t in D['t']:
        if t['g'] == 'drug': LK.setdefault(t['id'], {'im': [], 'rd': []})
    open(lp, 'w', encoding='utf-8').write(ls[:i] + 'window.CLINIC_LINKS=' + json.dumps(LK, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('drugs registered', n, 'of', len(DR))

if __name__ == '__main__':
    main()
