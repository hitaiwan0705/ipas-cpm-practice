# 由作答紀錄計算各題實測答對率與鑑別度，輸出 pstat.json 供網站組卷使用
import json,collections as C,statistics as st,sys
REWRITTEN={"L11-4002","L11-4005","L11-4014","L11-4016","L11-3023","L11-1024","L11-4012","L12-6107","L12-6106","L12-6105"}   # 11/12 改寫誘答，舊資料不再適用
MIN_N=10
d=json.load(open('clean.json')); S=d['S']
ret={s['場次ID'] for s in S if '原卷' in s['模式']}
R=[r for r in d['R'] if r['場次ID'] not in ret]
for r in R: r['對錯']=int(r['對錯'])
tot=C.defaultdict(lambda:[0,0])
for r in R: t=tot[r['學號']]; t[0]+=r['對錯']; t[1]+=1
it=C.defaultdict(list)
for r in R:
    t=tot[r['學號']]; loo=(t[0]-r['對錯'])/(t[1]-1) if t[1]>1 else None
    it[r['題號']].append((r['對錯'],loo))
out={}
for q,v in it.items():
    n=len(v); p=st.mean(x for x,_ in v)
    pairs=[(x,a) for x,a in v if a is not None]
    try: rpb=round(st.correlation([x for x,_ in pairs],[a for _,a in pairs]),2)
    except Exception: rpb=None
    e={'n':n,'p':round(p*100)}
    if rpb is not None: e['r']=rpb
    if n>=MIN_N and q not in REWRITTEN: e['d']='易' if p>=0.70 else ('中' if p>=0.40 else '難')
    if q in REWRITTEN: e['rewritten']=True
    out[q]=e
out['_meta']={'asof':max(s['送出時間'] for s in S)[:16],'min_n':MIN_N,'rule':'易≥70%、中40–69%、難<40%'}
json.dump(out,open('/home/claude/cpm/pstat.json','w'),ensure_ascii=False)
print(len(out)-1,'items;', sum(1 for k,v in out.items() if k!='_meta' and 'd' in v),'with empirical level; asof',out['_meta']['asof'])
