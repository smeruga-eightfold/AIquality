/* global */
// Deterministic seeded PRNG so data doesn't flicker on re-render
function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function makeRng(seed){
  const rand=mulberry32(seed);
  return {
    next:()=>rand(),
    range:(a,b)=>a+(b-a)*rand(),
    int:(a,b)=>Math.floor(a+(b-a)*rand()),
    pick:(arr)=>arr[Math.floor(rand()*arr.length)],
    normal:(mu,sigma)=>{// Box-Muller
      let u=0,v=0;while(u===0)u=rand();while(v===0)v=rand();
      return mu+sigma*Math.sqrt(-2.0*Math.log(u))*Math.cos(2*Math.PI*v);
    }
  };
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ──────────────────────────────
   RESUME PARSING
   ────────────────────────────── */
function genResumeParsing({bias=0, days=30, seed=42, orgs=[], geos=[], langFilter="All languages", fmtFilter="All formats"}={}){
  // bias: -0.1 healthy ... +0.1 stressed
  const orgKey = (orgs||[]).slice().sort().join("|");
  const geoKey = (geos||[]).slice().sort().join("|");
  const seed2 = seed + Math.round(bias*1000) + days*7 + [...orgKey].reduce((s,c)=>s+c.charCodeAt(0),0)*3 + [...geoKey].reduce((s,c)=>s+c.charCodeAt(0),0)*5 + [...(langFilter||"")].reduce((s,c)=>s+c.charCodeAt(0),0) + [...(fmtFilter||"")].reduce((s,c)=>s+c.charCodeAt(0),0)*2;
  const rng=makeRng(seed2);
  // Format buckets tuned to the four challenging cases called out in the Resume Parser Overview:
  // multi-column layouts, resumes with embedded cover letters, images embedded in resumes, font-extraction (ligature) issues.
  const FA={
    "Single-column PDF":[0.92,0.98],        // clean baseline
    "DOCX":[0.88,0.96],                     // very reliable
    "Multi-column / tabular PDF":[0.74,0.86], // reading-order inference needed
    "Embedded cover letter":[0.80,0.90],    // cover-letter detector removes pages
    "Image-embedded / scanned PDF":[0.66,0.80], // OCR pipeline, lower accuracy
    "Ligature-heavy PDF":[0.78,0.88]        // font-extraction quirks
  };
  // Per-language bias calibrated to the accuracy tiers in the doc
  // (Excellent: English; Great: German, Spanish, French, Italian, Dutch, Portuguese, Chinese, Japanese, Korean; Good: Other)
  const LB={
    "English":0.04,
    "German":0.01,"Spanish":0.01,"French":0.01,"Italian":0.0,"Dutch":0.0,"Portuguese":0.0,
    "Chinese":-0.005,"Japanese":-0.01,"Korean":-0.01,
    "Other (Russian, Turkish, Polish, …)":-0.04
  };
  // Geo nudges: NA/EU stronger, APAC/LATAM a bit weaker
  const GEO_BIAS={"North America":0.01,"EMEA":0.0,"APAC":-0.015,"LATAM":-0.02};
  const fmts=Object.keys(FA),langs=Object.keys(LB);
  // Realistic format mix — most resumes are clean PDF/DOCX; problem formats are the long tail.
  const FMT_MIX={
    "Single-column PDF":0.55,
    "DOCX":0.25,
    "Multi-column / tabular PDF":0.08,
    "Embedded cover letter":0.05,
    "Image-embedded / scanned PDF":0.04,
    "Ligature-heavy PDF":0.03
  };
  // Realistic language mix — English-heavy with a real long tail.
  const LANG_MIX={
    "English":0.55,"German":0.08,"Spanish":0.07,"French":0.06,"Italian":0.03,"Dutch":0.02,
    "Portuguese":0.03,"Chinese":0.05,"Japanese":0.03,"Korean":0.02,
    "Other (Russian, Turkish, Polish, …)":0.06
  };
  const weightedPick = (mix) => {
    const r = rng.next();
    let acc = 0;
    for(const [k,w] of Object.entries(mix)){ acc += w; if(r <= acc) return k; }
    return Object.keys(mix)[0];
  };
  // Org nudges accuracy a bit
  const orgBias = (orgs && orgs.length) ? (orgs.includes("Sales")?0.015:0) + (orgs.includes("Engineering")?-0.008:0) + (orgs.includes("Operations")?0.005:0) : 0;
  const geoBias = (geos && geos.length) ? geos.reduce((s,g)=>s+(GEO_BIAS[g]||0),0)/geos.length : 0;
  // Volume scales with org & geo filter selection — softened so narrow filters still yield a meaningful sample
  const orgScale = (orgs && orgs.length) ? (0.35 + (orgs.length/6)*0.65) : 1;
  const geoScale = (geos && geos.length) ? (0.45 + geos.length*0.18) : 1;
  const langScale = (langFilter && langFilter!=="All languages") ? 0.45 : 1;
  const fmtScale  = (fmtFilter && fmtFilter!=="All formats") ? 0.5 : 1;
  const volScale = orgScale * geoScale * langScale * fmtScale;
  const n=Math.max(80, Math.round(days*400*volScale));
  const recs=[];
  const now=new Date(); now.setHours(0,0,0,0);
  for(let i=0;i<n;i++){
    let fmt=weightedPick(FMT_MIX);
    let lang=weightedPick(LANG_MIX);
    if(langFilter && langFilter!=="All languages") lang = langFilter;
    if(fmtFilter && fmtFilter!=="All formats") fmt = fmtFilter;
    const [lo,hi]=FA[fmt];
    const ca=clamp(rng.range(lo,hi)+LB[lang]-bias-orgBias+geoBias,0,1);
    const pa=clamp(rng.range(lo,hi)+LB[lang]-bias-orgBias+geoBias-0.02,0,1);
    const parsed=rng.next()>(
      fmt==="Image-embedded / scanned PDF" ? 0.18+bias :
      fmt==="Multi-column / tabular PDF"   ? 0.10+bias :
      fmt==="Ligature-heavy PDF"           ? 0.06+bias :
      fmt==="Embedded cover letter"        ? 0.05+bias :
      0.02+bias
    );
    const hs=clamp(rng.range(0.02,0.14)+bias*0.3,0,1);
    const ts=new Date(now.getTime()-rng.int(0,days)*86400000);
    recs.push({id:"R"+i,ts,fmt,lang,ca,pa,parsed,hs});
  }
  // Aggregate timeline (daily)
  const byDay={};
  for(const r of recs){
    const k=r.ts.toISOString().slice(0,10);
    if(!byDay[k])byDay[k]={d:k,ts:r.ts,cnt:0,ca:0,pa:0,par:0,rel:0};
    byDay[k].cnt++; byDay[k].ca+=r.ca; byDay[k].pa+=r.pa; byDay[k].par+=(r.parsed?1:0); byDay[k].rel+=(1-r.hs);
  }
  const trend=Object.values(byDay).sort((a,b)=>a.ts-b.ts).map(x=>({
    d:x.d,ts:x.ts,vol:x.cnt,
    contact:x.ca/x.cnt,prof:x.pa/x.cnt,parse:x.par/x.cnt,reliability:x.rel/x.cnt
  }));
  const avg=(k)=>recs.reduce((s,r)=>s+(k==='parsed'?(r.parsed?1:0):k==='reliability'?(1-r.hs):r[k]),0)/recs.length;
  const contact=avg('ca'), prof=avg('pa'), parse=avg('parsed'), reliability=avg('reliability');
  // Format breakdown
  const fmtRows=fmts.map(f=>{
    const sub=recs.filter(r=>r.fmt===f);
    if(!sub.length) return {fmt:f, n:0, contact:0, prof:0, parse:0, reliability:0};
    const avgF=(k)=>sub.reduce((s,r)=>s+(k==='parsed'?(r.parsed?1:0):k==='reliability'?(1-r.hs):r[k]),0)/sub.length;
    return {fmt:f, n:sub.length, contact:avgF('ca'), prof:avgF('pa'), parse:avgF('parsed'), reliability:avgF('reliability')};
  });
  // Language breakdown
  const langRows=langs.map(l=>{
    const sub=recs.filter(r=>r.lang===l);
    if(!sub.length) return {lang:l, n:0, contact:0, prof:0, parse:0, reliability:0};
    const avgL=(k)=>sub.reduce((s,r)=>s+(k==='parsed'?(r.parsed?1:0):k==='reliability'?(1-r.hs):r[k]),0)/sub.length;
    return {lang:l, n:sub.length, contact:avgL('ca'), prof:avgL('pa'), parse:avgL('parsed'), reliability:avgL('reliability')};
  });
  return {total:recs.length, contact, prof, parse, reliability, trend, fmtRows, langRows};
}

/* ──────────────────────────────
   AI INTERVIEWER
   ────────────────────────────── */
function genAIInterviewer({bias=0, seed=88, days=30, orgs=[], stages=[]}={}){
  const orgKey = (orgs||[]).slice().sort().join("|");
  const stageKey = (stages||[]).slice().sort().join("|");
  const rng=makeRng(seed+Math.round(bias*1000)+days*3+[...orgKey+stageKey].reduce((s,c)=>s+c.charCodeAt(0),0));
  const ROLES=(orgs && orgs.length ? ["Engineering","Sales","Operations","Marketing","Finance"].filter(r=>orgs.includes(r)) : ["Engineering","Sales","Operations","Marketing","Finance"]);
  const stageScale = stages && stages.length ? (0.3 + stages.length*0.18) : 1;
  const daysScale = days/30;
  const GENDERS=["Female","Male","Non-binary"];
  const RACES=["White","Asian","Black","Hispanic","Two or more","Native/Pacific"];
  const ACCENTS=["Native","Non-native"];
  const ROLE_BASE={Engineering:0.88,Finance:0.86,Operations:0.83,Marketing:0.81,Sales:0.78};

  const byRole=ROLES.map(r=>{
    const base=ROLE_BASE[r]-bias*0.1;
    const cov=clamp(base+rng.normal(0,0.02),0,1);
    const cla=clamp(base+0.02+rng.normal(0,0.02),0,1);
    const rrel=clamp(base-0.01+rng.normal(0,0.02),0,1);
    const comp=clamp(0.96+rng.normal(0,0.01)-bias*0.04,0,1);
    const acc=clamp(base+0.01+rng.normal(0,0.02),0,1);
    const cmp2=clamp(base-0.02+rng.normal(0,0.02),0,1);
    const ev=clamp(base+rng.normal(0,0.02),0,1);
    return {role:r,n:Math.round((1200+rng.int(-200,300))*daysScale*stageScale),coverage:cov,clarity:cla,rrel,compliance:comp,accuracy:acc,completeness:cmp2,evidence:ev};
  });
  const over={};
  for(const k of ['coverage','clarity','rrel','compliance','accuracy','completeness','evidence']){
    over[k]=byRole.reduce((s,r)=>s+r[k]*r.n,0)/byRole.reduce((s,r)=>s+r.n,0);
  }
  over.nTotal=byRole.reduce((s,r)=>s+r.n,0);

  // Impact Ratio by demographic
  const irGender=GENDERS.map((g,i)=>{
    const base=[0.515,0.495,0.465][i] - bias*0.04;
    return {grp:g, n:rng.int(3800,8200), score:clamp(base+0.25+rng.range(-0.02,0.02),0,1), rate:clamp(base+rng.range(-0.01,0.01),0,1)};
  });
  const irRace=RACES.map((r,i)=>{
    const base=[0.49,0.50,0.44,0.45,0.47,0.43][i] - (i===2?bias*0.06:bias*0.02);
    return {grp:r, n:rng.int(900,4200), score:clamp(base+0.27+rng.range(-0.02,0.02),0,1), rate:clamp(base+rng.range(-0.01,0.01),0,1)};
  });
  const irAccent=ACCENTS.map((a,i)=>{
    const base=[0.52,0.47][i] - (i===1?bias*0.05:0);
    return {grp:a, n:rng.int(5000,12000), score:clamp(base+0.27+rng.range(-0.02,0.02),0,1), rate:clamp(base+rng.range(-0.01,0.01),0,1)};
  });
  // Perturbation: avg absolute diff
  const pertG=GENDERS.map((g,i)=>({grp:g, n:rng.int(800,1200), diff:[0.0028,0.0032,0.0048][i]+bias*0.003}));
  const pertR=RACES.map((r,i)=>({grp:r, n:rng.int(300,1200), diff:[0.0021,0.0024,0.0069,0.0051,0.0035,0.0042][i]+bias*0.003}));
  const pertA=ACCENTS.map((a,i)=>({grp:a, n:rng.int(1200,2500), diff:[0.0019,0.0088][i]+bias*0.004}));

  return {byRole, over, irGender, irRace, irAccent, pertG, pertR, pertA};
}

/* ──────────────────────────────
   MATCH SCORE QUALITY
   ────────────────────────────── */
function genMatchScore({bias=0, seed=101, days=30, orgs=[], stages=[]}={}){
  const orgKey = (orgs||[]).slice().sort().join("|");
  const stageKey = (stages||[]).slice().sort().join("|");
  const rng=makeRng(seed+Math.round(bias*1000)+days*5+[...orgKey+stageKey].reduce((s,c)=>s+c.charCodeAt(0),0));
  const orgBias = (orgs && orgs.length) ? (orgs.includes("Sales")?0.015:0) + (orgs.includes("Engineering")?-0.01:0) : 0;
  const daysScale = days/30;
  const stageScale = stages && stages.length ? (0.3 + stages.length*0.18) : 1;
  // Core accuracy metrics
  const auc=clamp(0.88-bias*0.1-orgBias+rng.range(-0.01,0.01),0,1);
  const precision=clamp(0.76-bias*0.08-orgBias+rng.range(-0.01,0.01),0,1);
  const recall=clamp(0.72-bias*0.06-orgBias+rng.range(-0.01,0.01),0,1);
  const f1=(2*precision*recall)/(precision+recall);
  // Workflow
  const hireAlign=clamp(4.1-bias*0.3+rng.range(-0.05,0.05),0,5);
  const calibHealth=clamp(0.74-bias*0.15+rng.range(-0.01,0.01),0,1);
  const automation=clamp(0.63-bias*0.1+rng.range(-0.01,0.01),0,1);
  const explain=clamp(4.5-bias*0.2+rng.range(-0.05,0.05),0,5);
  // Score distribution (bins 0-5, 0.25 step)
  const bins=[];
  for(let i=0;i<=20;i++){
    const x=i*0.25;
    const mu1=2.3, mu2=4.0;
    const y1=Math.exp(-Math.pow(x-mu1,2)/(2*0.95*0.95));
    const y2=Math.exp(-Math.pow(x-mu2,2)/(2*0.45*0.45))*0.5;
    bins.push({x, y:(y1+y2)*(2200+rng.int(-200,200))});
  }
  // Weekly trend — number of weeks scales with days
  const trend=[];
  const weeks=Math.max(4, Math.min(26, Math.round(days/7)));
  const today=new Date(); today.setHours(0,0,0,0);
  for(let i=weeks-1;i>=0;i--){
    const ts=new Date(today.getTime()-i*7*86400000);
    const drift=i<4?bias*0.12:0;
    trend.push({ts, score:clamp(3.3+rng.range(-0.12,0.12)-drift-orgBias,0,5), vol:Math.round((15000+rng.int(-2000,2000))*stageScale)});
  }
  // Bias IR by race
  const RACES=["White","Asian","Black","Hispanic","Two or more","Native/Pacific"];
  const ir=RACES.map((r,i)=>{
    const baseR=[0.48,0.51,0.39,0.43,0.46,0.40][i] - (i===2||i===3?bias*0.05:0);
    return {grp:r, n:rng.int(1200,9000), rate:clamp(baseR+rng.range(-0.01,0.01),0,1)};
  });
  // Bias IR by gender
  const GENDERS=["Female","Male","Non-binary"];
  const irG=GENDERS.map((g,i)=>({grp:g, n:rng.int(6000,15000), rate:clamp([0.47,0.51,0.41][i]-bias*0.02+rng.range(-0.005,0.005),0,1)}));
  // Perturbation
  const pert=RACES.map((r,i)=>({grp:r, n:rng.int(400,1800), orig:clamp([3.42,3.55,3.18,3.27,3.36,3.12][i]+rng.range(-0.02,0.02),0,5), diff:[0.009,0.008,0.022,0.016,0.011,0.013][i]+bias*0.005}));
  // Readiness (for IR prereq)
  const readiness={
    volume:{pct:100, note:"184,392 applications across 1,247 closed positions"},
    demo:{pct:86, note:"86% of candidates self-declared race/gender"},
    profile:{pct:79, note:"79% of profiles are complete (resume + experience + education)"},
    calibration:{pct:72, note:"72% of closed positions are well calibrated (≥3 ideal profiles)"},
    coverage:{pct:100, note:"All 4 hiring stages present in data"}
  };
  return {auc, precision, recall, f1, hireAlign, calibHealth, automation, explain, bins, trend, ir, irG, pert, readiness};
}

/* ──────────────────────────────
   RECOMMENDATION QUALITY
   (Talent recommendations: "people you should contact")
   ────────────────────────────── */
function genRecommendation({bias=0, seed=303, days=30, orgs=[]}={}){
  const orgKey = (orgs||[]).slice().sort().join("|");
  const rng=makeRng(seed+Math.round(bias*1000)+days*7+[...orgKey].reduce((s,c)=>s+c.charCodeAt(0),0));
  const orgBias = (orgs && orgs.length) ? (orgs.includes("Sales")?0.02:0) + (orgs.includes("Engineering")?-0.01:0) : 0;
  const clickthrough=clamp(0.41-bias*0.08-orgBias+rng.range(-0.01,0.01),0,1);
  const shortlistRate=clamp(0.28-bias*0.05-orgBias+rng.range(-0.005,0.005),0,1);
  const dismissRate=clamp(0.19+bias*0.04+orgBias+rng.range(-0.005,0.005),0,1);
  const ndcg=clamp(0.71-bias*0.08-orgBias+rng.range(-0.01,0.01),0,1);
  const coverage=clamp(0.68-bias*0.08+rng.range(-0.01,0.01),0,1);
  const diversitySkill=clamp(0.72-bias*0.04+rng.range(-0.01,0.01),0,1);
  const diversityExp=clamp(0.65-bias*0.05+rng.range(-0.01,0.01),0,1);
  const freshness=clamp(0.83-bias*0.1+rng.range(-0.01,0.01),0,1);
  const staleRate=clamp(0.08+bias*0.06+rng.range(-0.005,0.005),0,1);

  // Drift trend — length scales with days
  const today=new Date(); today.setHours(0,0,0,0);
  const driftDays=Math.max(7, Math.min(90, days));
  const driftSeries=[];
  for(let i=driftDays-1;i>=0;i--){
    const ts=new Date(today.getTime()-i*86400000);
    const drift=bias>0 && i<10 ? bias*0.12*((10-i)/10) : 0;
    driftSeries.push({
      ts,
      ctr: clamp(clickthrough+rng.range(-0.02,0.02)-drift*(i<driftDays/3?1:0),0,1),
      shortlist: clamp(shortlistRate+rng.range(-0.02,0.02)-drift*0.8*(i<driftDays/3?1:0),0,1),
      dismiss: clamp(dismissRate+rng.range(-0.015,0.015)+drift*0.5*(i<driftDays/3?1:0),0,1)
    });
  }

  // Source diversity (where recommendations come from)
  const sources=[
    {src:"Internal employees", pct:34, hires:142},
    {src:"Alumni", pct:12, hires:48},
    {src:"Past applicants", pct:23, hires:87},
    {src:"Passive / external", pct:21, hires:62},
    {src:"Referrals", pct:10, hires:56}
  ];

  // Impact Ratio for recs (did demographics get recommended proportionally?)
  const GENDERS=["Female","Male","Non-binary"];
  const irG=GENDERS.map((g,i)=>({grp:g, n:rng.int(8000,22000), rate:clamp([0.31,0.34,0.24][i]-bias*0.03+rng.range(-0.005,0.005),0,1)}));
  const RACES=["White","Asian","Black","Hispanic","Two or more"];
  const irR=RACES.map((r,i)=>({grp:r, n:rng.int(2000,15000), rate:clamp([0.33,0.35,0.26,0.27,0.30][i]-(i===2?bias*0.07:bias*0.02)+rng.range(-0.005,0.005),0,1)}));

  return {clickthrough, shortlistRate, dismissRate, ndcg, coverage,
          diversitySkill, diversityExp, freshness, staleRate,
          driftSeries, sources, irG, irR};
}

/* ──────────────────────────────
   Overview aggregate
   ────────────────────────────── */
function genOverview({bias=0}={}){
  const rp=genResumeParsing({bias, days:30});
  const ai=genAIInterviewer({bias});
  const ms=genMatchScore({bias});
  const rc=genRecommendation({bias});
  return {rp, ai, ms, rc};
}

window.DashData = {genResumeParsing, genAIInterviewer, genMatchScore, genRecommendation, genOverview};
