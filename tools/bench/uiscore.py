import json,re,sys
def held(q):
    h=0
    for c in q:h=(h*31+ord(c))&0xffffffff
    return h%10<3
for f in sys.argv[1:]:
    R=json.load(open(f));out={}
    for lib,q,src,fl,a,b in R:
        rx=re.compile(src,re.I if 'i' in fl else 0)
        for k in [lib,'ALL','HELD' if held(q) else 'DEV']:
            o=out.setdefault(k,[0,0,0,0,0]);o[0]+=1
            o[1]+=bool(b.strip());o[2]+=bool(rx.search(b));o[3]+=bool(b.strip()) and not rx.search(b);o[4]+=bool(rx.search(a))
    print("\n"+f);print("library      n  shown  correct  shown-but-wrong  correct-at-first")
    for k,o in out.items():n=o[0];print(f"{k:10}{n:4} {100*o[1]/n:5.0f}% {100*o[2]/n:6.0f}%  {100*o[3]/n:10.0f}%  {100*o[4]/n:10.0f}%")
