#!/usr/bin/env python3
"""Accuracy check for the whiteboard summaries.

Every number written on a board (percentages, sizes, doses, ages, timings, grades)
must also appear in the article it summarises, so a board can never introduce a
figure the article does not contain. Prints each board's unmatched numbers.
"""
import os, re, sys, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def text(s):
    s = re.sub(r'<style.*?</style>|<svg.*?</svg>', ' ', s, flags=re.S) if '<svg' in s or '<style' in s else s
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    return s

def nums(s):
    s = s.replace('–', '-').replace('−', '-').replace('·', ' ').replace(',', '')
    return set(re.findall(r'\d+(?:\.\d+)?', s))

def main(ids=None):
    bad = 0
    for f in sorted(os.listdir(os.path.join(ROOT, 'content', 'boards'))):
        tid = f[:-5]
        if ids and tid not in ids: continue
        b = open(os.path.join(ROOT, 'content', 'boards', f), encoding='utf-8').read()
        a = open(os.path.join(ROOT, 'content', 'clinic', tid + '.txt'), encoding='utf-8').read()
        svg = ' '.join(re.findall(r'<svg.*?</svg>', b, re.S))
        nb = nums(text(b)) | nums(html.unescape(re.sub(r'<[^>]+>', ' ', svg)))
        na = nums(a)
        miss = sorted(nb - na - {'0'}, key=lambda x: float(x))
        print('%-14s %s' % (tid, 'ok' if not miss else 'NOT IN ARTICLE: ' + ' '.join(miss)))
        bad += bool(miss)
    return bad

if __name__ == '__main__':
    sys.exit(1 if main(sys.argv[1:]) else 0)
