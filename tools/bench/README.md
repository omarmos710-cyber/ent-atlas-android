# Smart search benchmark

407 questions across every library (`bench_a.js` diseases and drugs, `bench_b.js` approach-to, imaging, basics and
operations, `bench_c.js` anatomy, imaging cases and hard questions). Each is
`[library, question, expected article(s), regex the answer must match]`; the regex is checked against the app's own
text by `node validate.js bench_a.js bench_b.js bench_c.js`.

- `node score.js` — the quick-answer box as it is shown before the second reader (fact present, article found,
  fact in the first three lines). `--fail` lists misses, `--diff` compares with the last run (last.json).
- `node evalrr.js` — the same with the second reader (search/xrank.js); needs `npm i onnxruntime-web@1.20.1`
  in this folder. Slow (about 40 ms per line on one CPU thread).
- About 30% of questions (a hash of the text) are a held-out set that was not used while tuning.
