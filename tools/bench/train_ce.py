# Fine-tune the second reader (MiniLM-L6 cross-encoder, MS MARCO) on pairs made from the app's own content.
import json, random, time, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
random.seed(7); torch.manual_seed(7); torch.set_num_threads(4)
BASE="cross-encoder/ms-marco-MiniLM-L-6-v2"; OUT="/home/claude/models/ent"
tok=AutoTokenizer.from_pretrained(BASE); m=AutoModelForSequenceClassification.from_pretrained(BASE)
P=json.load(open("/home/claude/work/pairs.json")); random.shuffle(P)
opt=torch.optim.AdamW(m.parameters(),lr=2e-5,weight_decay=.01); bce=torch.nn.BCEWithLogitsLoss()
B=16; steps=(len(P)+B-1)//B; sched=torch.optim.lr_scheduler.LambdaLR(opt,lambda s:min(1,(s+1)/(steps*.1))*max(0,(steps-s)/steps))
m.train(); t0=time.time()
for s in range(steps):
    b=P[s*B:(s+1)*B]; enc=tok([x[0] for x in b],[x[1] for x in b],truncation=True,max_length=192,padding=True,return_tensors="pt")
    y=torch.tensor([float(x[2]) for x in b]); loss=bce(m(**enc).logits[:,0],y); loss.backward()
    torch.nn.utils.clip_grad_norm_(m.parameters(),1.0); opt.step(); sched.step(); opt.zero_grad()
    if s%50==0: print(s,steps,round(loss.item(),3),round(time.time()-t0),flush=True)
m.eval(); m.save_pretrained(OUT); tok.save_pretrained(OUT); print("saved",round(time.time()-t0))
