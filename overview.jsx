/* Overview landing page */
const {useMemo:useMo, useState:useSo} = React;

function ModuleCard({icon, name, sub, score, breakdown, note, onOpen, delta}){
  const st = statusForScore(score);
  return (
    <div className="module-card" onClick={onOpen}>
      <div className="hd">
        <div className="ic"><Icon name={icon}/></div>
        <div style={{flex:1}}>
          <div className="nm">{name}</div>
          <div className="sb">{sub}</div>
        </div>
        <Chip tone={st.tone}>{st.label}</Chip>
      </div>
      <div className="score-row">
        <div className="n">{(score*100).toFixed(1)}</div>
        <div className="u">/ 100 health</div>
        </div>
      <div className="bar"><HealthStrip {...breakdown}/></div>
      <div className="mini-legend">
        <span>{breakdown.green+breakdown.blue} pass</span>
        <span>{breakdown.orange} attention</span>
        <span>{breakdown.red} at risk</span>
      </div>
      <div className="note">{note}</div>
    </div>
  );
}

function Overview({data, onNav, bias}){
  const {rp, ai, ms, rc} = data;
  const overallHealth = (
    rp.parse * 0.22 +
    ai.over.accuracy * 0.28 +
    ms.auc * 0.28 +
    rc.ndcg * 0.22
  );
  const st = statusForScore(overallHealth);

  // Recent risk feed
  const feed = [
    {sev:"high", icon:"error", title:"AI Interviewer: non-native accent impact ratio dropped to 0.77",
     msg:"28 candidates affected over last 7 days. 80% rule threshold breached for 'Accent' segment in Sales roles.",
     who:"Auto-detected · 2h ago", cta:"Open investigation"},
    {sev:"med", icon:"trending_down", title:"Match Score drift detected on Engineering roles",
     msg:"Average score fell 0.12 points vs. 30-day baseline. Calibration health at 68% (target ≥ 75%).",
     who:"Monitor · 6h ago", cta:"Recalibrate"},
    {sev:"med", icon:"warning", title:"Resume Parsing: multi-column PDFs at 74.3% accuracy",
     msg:"Below 80% threshold for 3rd consecutive day. Affects ~1,200 candidates/day.",
     who:"Monitor · 1d ago", cta:"Review samples"},
    {sev:"low", icon:"info", title:"Recommendation Quality: source diversity slightly skewed",
     msg:"Internal referrals account for 34% of surfaced candidates, up from 28% last month.",
     who:"Monitor · 2d ago", cta:"Review mix"},
  ];

  return (
    <div className="tab-panel">
      <PageHead
        title="AI Compliance Overview"
        desc="Health, fairness, and performance monitors across every AI module in the Talent Intelligence Platform. Real-time signals, with drill-down into bias, accuracy, and drift."
        right={
          <>
            <button className="btn btn-secondary btn-sm"><Icon name="date_range" size={14}/>Last 30 days</button>
            <button className="btn btn-primary btn-sm"><Icon name="file_download" size={14}/>Export audit pack</button>
          </>
        }
      />

      {/* Hero */}
      <div className="health-hero">
        <Donut value={overallHealth} tone={st.tone} size={112}/>
        <div>
          <div className="lbl">Platform AI Health Score</div>
          <h2>{st.label === "Excellent" ? "All modules operating within policy" : st.label === "Good" ? "Operating within policy, with watch items" : "Attention required across at least one module"}</h2>
          <div className="sub">
            Weighted composite across Resume Parsing, AI Interviewer, Match Score, and Recommendation Quality.
            Bias tests follow the NYC Local Law 144 impact-ratio standard (0.80 threshold). Last audit pack exported Apr 08, 2026.
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
          <Chip tone={st.tone}>{st.label}</Chip>
          
          <div style={{fontSize:12,color:"var(--grey-60)"}}>234,891 decisions audited</div>
        </div>
      </div>

      {/* KPI row — platform-level counters */}
      <div className="kpi-row">
        <div className="kpi gradient">
          <div className="lbl">Decisions audited · 30d</div>
          <div className="val">234,891</div>
          <div className="foot">
            <span className="muted" style={{fontSize:12}}>Across 1,247 closed positions</span>
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Bias tests passing</div>
          <div className="val">11<span className="unit">/ 14</span></div>
          <div className="foot">
            <span className="muted" style={{fontSize:12}}>Impact ratio ≥ 0.80</span>
            <Chip tone={bias>0.03?"orange":"green"}>{bias>0.03?"2 borderline":"Pass"}</Chip>
          </div>
        </div>
        <div className={"kpi " + (bias>0?"warn":"")}>
          <div className="lbl">Open incidents</div>
          <div className="val">{bias>0?"3":"1"}</div>
          <div className="foot">
            <span className="muted" style={{fontSize:12}}>{bias>0?"2 high · 1 medium":"1 medium"}</span>
            <Chip tone={bias>0?"orange":"blue"}>SLA on track</Chip>
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Next audit export</div>
          <div className="val" style={{fontSize:32}}>Jun 12</div>
          <div className="foot">
            <span className="muted" style={{fontSize:12}}>NYC LL144 quarterly filing</span>
            <Chip tone="blue">53 days</Chip>
          </div>
        </div>
      </div>

      {/* Module grid */}
      <div className="section-title">
        <div>
          <h2>Module health</h2>
          <div className="sub">Click a module for full monitoring, fairness, and drift panels</div>
        </div>
        <div className="right">
          <Segmented value="health" onChange={()=>{}} options={[
            {value:"health",label:"Health"},{value:"bias",label:"Bias"},{value:"drift",label:"Drift"}
          ]}/>
        </div>
      </div>
      <div className="grid-2">
        <ModuleCard icon="article" name="Resume Parsing" sub="184,392 resumes / 30d · 5 languages"
          score={rp.parse} breakdown={{green:88, blue:6, orange:4, red:2}}
          delta={0.012}
          note={<><strong>Contact accuracy</strong> {fmtPct(rp.contact,1)} · <strong>Profile completeness</strong> {fmtPct(rp.prof,1)} · reliability index {fmtPct(rp.reliability,1)}</>}
          onOpen={()=>onNav("resume")}/>
        <ModuleCard icon="record_voice_over" name="AI Interviewer" sub="6,241 interviews / 30d · 5 role families"
          score={ai.over.accuracy} breakdown={{green:62, blue:18, orange:14, red:6}}
          delta={-0.021}
          note={<><strong>Response relevance</strong> {fmtPct(ai.over.rrel,1)} · <strong>Compliance rate</strong> {fmtPct(ai.over.compliance,1)} · 2 fairness watch-items</>}
          onOpen={()=>onNav("interviewer")}/>
        <ModuleCard icon="tune" name="Match Score Quality" sub="184,392 applications ranked · 1,247 reqs"
          score={ms.auc} breakdown={{green:74, blue:14, orange:8, red:4}}
          delta={0.004}
          note={<><strong>AUC</strong> {fmtNum(ms.auc,3)} · <strong>F1</strong> {fmtNum(ms.f1,3)} · hire alignment {fmtNum(ms.hireAlign,2)}/5</>}
          onOpen={()=>onNav("match")}/>
        <ModuleCard icon="how_to_reg" name="Recommendation Quality" sub="48,122 talent recs surfaced · 30d"
          score={rc.ndcg} breakdown={{green:58, blue:24, orange:14, red:4}}
          delta={-0.009}
          note={<><strong>nDCG@10</strong> {fmtNum(rc.ndcg,3)} · <strong>Shortlist rate</strong> {fmtPct(rc.shortlistRate,1)} · coverage {fmtPct(rc.coverage,1)}</>}
          onOpen={()=>onNav("recs")}/>
      </div>

      {/* Risk feed */}
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Recent monitor events</h3>
            <div className="sub">Automatically-surfaced signals that may require action</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Chip tone="red" active>{bias>0?"2":"1"} High</Chip>
            <Chip tone="orange" active>2 Medium</Chip>
            <Chip tone="blue" active>1 Low</Chip>
            <button className="btn btn-ghost btn-sm">View all 12</button>
          </div>
        </div>
        <div className="feed">
          {feed.map((f,i)=>(
            <div key={i} className={"feed-row sev-"+f.sev}>
              <div className="sev"><Icon name={f.icon}/></div>
              <div className="msg">
                <div className="t">{f.title}</div>
                <div className="m">{f.msg}</div>
              </div>
              <div className="who">{f.who}</div>
              <div className="act"><button className="btn btn-secondary btn-sm">{f.cta}</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Overview = Overview;
window.ModuleCard = ModuleCard;
