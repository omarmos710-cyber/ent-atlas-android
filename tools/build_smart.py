#!/usr/bin/env python3
"""Build the offline "smart search" model files (www/search/sm_*.bin, sm_meta.js).

Smart search answers questions such as "hashimoto treatment" or "clinical picture of RLN injury"
without any network. It combines the keyword index (xsearch.js) with a small medical sentence
embedding model that runs in the browser:

  * The model is NeuML/pubmedbert-base-embeddings-8M, a static (model2vec) distillation of
    PubMedBERT embeddings: every WordPiece token has a fixed 256-number vector, and a sentence
    vector is the mean of its token vectors. No neural network runs on the phone, only a lookup
    and an average, so a query is encoded in about a millisecond.
  * Every section of every article (search/full.js) is cut into chunks of two or three sentences,
    and each chunk is encoded here at build time. The phone encodes only the query.
  * Abbreviations defined in the text ("recurrent laryngeal nerve (RLN)") are collected so that
    the query "RLN" is expanded before encoding.

Outputs (all in www/search/):
  sm_tok.bin  int8 token matrix (vocab x dim), row-wise scale in sm_meta.js
  sm_vec.bin  int8 chunk vectors (chunks x dim)
  sm_meta.js  window.XSM = {dim, vocab, tscale (base64 float32), chunks (base64 uint32 triples), abbr}

The model files are cached in ~/.cache/ent-atlas-smart; they are downloaded once from Hugging Face.
"""
import base64, json, os, re, sys, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
OUT = os.path.join(WWW, 'search')
MODEL = 'NeuML/pubmedbert-base-embeddings-8M'
CACHE = os.path.join(os.path.expanduser('~'), '.cache', 'ent-atlas-smart')
CHUNK = 220  # characters per chunk, roughly two sentences


def fetch(name):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, name)
    if not os.path.exists(p):
        url = f'https://huggingface.co/{MODEL}/resolve/main/{name}'
        print('downloading', url)
        urllib.request.urlretrieve(url, p)
    return p


def load_model():
    from safetensors.numpy import load_file
    from tokenizers import Tokenizer
    E = load_file(fetch('model.safetensors'))['embeddings'].astype(np.float32)
    tok = Tokenizer.from_file(fetch('tokenizer.json'))
    vocab = json.load(open(fetch('tokenizer.json'), encoding='utf-8'))['model']['vocab']
    inv = [None] * len(vocab)
    for w, i in vocab.items():
        inv[i] = w
    return E, tok, inv


def chunks_of(text):
    """Split a section into chunks of about CHUNK characters on sentence boundaries; (start, end) offsets."""
    out, start, pos = [], 0, 0
    for m in re.finditer(r'(?<=[.;:!?])\s+', text):
        pos = m.end()
        if pos - start >= CHUNK:
            out.append((start, m.start()))
            start = pos
    if start < len(text):
        if out and len(text) - start < 60:
            out[-1] = (out[-1][0], len(text))
        else:
            out.append((start, len(text)))
    return out or [(0, len(text))]


ABBR = re.compile(r'((?:[A-Za-z][\w\'-]*[ -]){1,7}[A-Za-z][\w\'-]*)\s+\(([A-Z][A-Za-z0-9]{1,6})\)')


def mine_abbr(texts):
    """Collect 'full name (ABBR)' pairs whose initials spell the abbreviation."""
    found = {}
    for t in texts:
        for m in ABBR.finditer(t):
            words, ab = m.group(1).split(), m.group(2)
            letters = ab.lower().rstrip('s') if ab.endswith('s') and len(ab) > 2 else ab.lower()
            # take the shortest tail of words whose initials (or initials of hyphen parts) match
            for k in range(1, len(words) + 1):
                tail = words[-k:]
                parts = [p for w in tail for p in re.split(r'-', w) if p]
                ini = ''.join(p[0].lower() for p in parts)
                ini2 = ''.join(w[0].lower() for w in tail)
                if ini == letters or ini2 == letters:
                    full = ' '.join(tail).lower()
                    if full.split()[0] in ('the', 'a', 'an', 'and', 'or', 'of'):
                        break
                    found.setdefault(ab.lower(), {}).setdefault(full, 0)
                    found[ab.lower()][full] += 1
                    break
    out = {}
    for ab, fulls in found.items():
        best = max(fulls.items(), key=lambda kv: kv[1])[0]
        if len(ab) >= 2:
            out[ab] = best
    return out


def main():
    try:
        import safetensors, tokenizers  # noqa: F401
    except ImportError:
        print('WARNING smart search NOT rebuilt: pip install safetensors tokenizers numpy, then run tools/build_smart.py'
              ' (the app switches smart search off until the vectors match search/full.js again)')
        return
    s = open(os.path.join(OUT, 'full.js'), encoding='utf-8').read()
    X = json.loads(s[s.index('['):s.rindex(']') + 1])
    E, tok, vocab = load_model()
    dim = E.shape[1]

    def enc_ids(ids):
        if not ids:
            return np.zeros(dim, np.float32)
        v = E[ids].mean(0)
        return v / (np.linalg.norm(v) + 1e-9)

    texts, owners = [], []
    for i, x in enumerate(X):
        art = x[3].split(' · ')[0]
        ctx = f'{art}. {x[2]}. '
        for a, b in chunks_of(x[4]):
            texts.append(ctx + x[4][a:b])
            owners.append((i, a, b))
    enc = tok.encode_batch(texts, add_special_tokens=False)
    V = np.stack([enc_ids(e.ids) for e in enc])
    # int8 quantisation: chunk vectors are unit length, so a single scale suffices
    vq = np.clip(np.round(V * 127 / np.abs(V).max()), -127, 127).astype(np.int8)
    # token matrix: per-row scale, because rows differ in length after the model's Zipf weighting
    rs = np.abs(E).max(1)
    rs[rs == 0] = 1
    tq = np.clip(np.round(E / rs[:, None] * 127), -127, 127).astype(np.int8)
    tscale = (rs / 127).astype(np.float32)
    open(os.path.join(OUT, 'sm_vec.bin'), 'wb').write(vq.tobytes())
    open(os.path.join(OUT, 'sm_tok.bin'), 'wb').write(tq.tobytes())
    ch = np.array(owners, dtype=np.uint32).ravel()
    abbr = mine_abbr(x[4] for x in X)
    meta = {
        'model': MODEL, 'dim': int(dim), 'n': int(len(owners)), 'sections': len(X),
        'fp': '%d:%d' % (len(X), sum(len(x[4]) for x in X)), 'vocab': vocab,
        'tscale': base64.b64encode(tscale.tobytes()).decode(),
        'chunks': base64.b64encode(ch.tobytes()).decode(),
        'abbr': abbr,
    }
    js = 'window.XSM=' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(OUT, 'sm_meta.js'), 'w', encoding='utf-8').write(js)
    print(f'smart search: {len(owners)} chunks from {len(X)} sections, dim {dim}, '
          f'{len(abbr)} abbreviations, vec {vq.nbytes//1024} KB, tok {tq.nbytes//1024} KB, meta {len(js)//1024} KB')


if __name__ == '__main__':
    main()
