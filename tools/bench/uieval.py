# Evaluate what the app's smart box actually shows (first answer, and after the second reader), on the 407 questions
import asyncio, json, re, subprocess, sys
from playwright.async_api import async_playwright
B="/home/claude/ent-atlas-android/tools/bench/"
Q=json.loads(subprocess.run(["node","-e",f'const Q=[...require("{B}bench_a.js"),...require("{B}bench_b.js"),...require("{B}bench_c.js")];console.log(JSON.stringify(Q.map(([l,q,a,r])=>[l,q,r.source,r.flags])))'],capture_output=True,text=True).stdout)
OUT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
        pg=await b.new_page()
        await pg.goto("http://localhost:8765/index.html"); await pg.wait_for_timeout(1500)
        await pg.evaluate("(async()=>{if(XSEARCH.ready)await XSEARCH.ready();await XSEARCH.smartLoad()})()"); await pg.wait_for_function("XSEARCH.smartReady()",timeout=120000)
        res=[]
        for lib,q,src,fl in Q:
            r=await pg.evaluate("""async(q)=>{const txt=h=>{const d=document.createElement('div');d.innerHTML=h||'';return d.textContent.replace(/\\s+/g,' ').trim()};
              const a=txt(XSEARCH.ask(q));let b=a;for(let k=0;k<40;k++){await new Promise(r=>setTimeout(r,250));const t=txt(XSEARCH.ask(q));b=t;if(k>3&&t===b&&window.XRANK&&XRANK.ready()&&k>8)break}return [a,b]}""",q)
            res.append([lib,q,src,fl,r[0],r[1]])
        json.dump(res,open(OUT,"w"))
        await b.close()
asyncio.run(main())
