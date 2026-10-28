import json, sys, os
from PIL import Image
from rapidocr_onnxruntime import RapidOCR
eng = RapidOCR()
keys = json.load(open('tools/ocr_keys.json'))
out = {}
for n, k in enumerate(keys):
    p = f'app/src/main/assets/www/fig2/{k}.jpg'
    im = Image.open(p).convert('RGB'); W, H = im.size
    rec = {'W': W, 'H': H}
    for s in (1.0, 2.0):
        q = im if s == 1.0 else im.resize((int(W * s), int(H * s)), Image.LANCZOS)
        q.save('/tmp/q.png')
        res, _ = eng('/tmp/q.png', text_score=0.3, box_thresh=0.4, unclip_ratio=1.6)
        rec[f's{int(s)}'] = [[[[round(x / s, 1), round(y / s, 1)] for x, y in b], t, round(float(c), 3)] for b, t, c in (res or [])]
    out[k] = rec
    if n % 20 == 0: print(n, k, len(rec['s1']), len(rec['s2']), flush=True)
json.dump(out, open('ocr_rapid.json', 'w'))
