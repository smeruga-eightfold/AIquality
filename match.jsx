/* Match Score Quality module — 3 tabs: Accuracy / Impact Ratio / Perturbation */
const {useState:useSms} = React;

function MatchScore({data, bias, onNav, filters, onFilter, onReset}){
  const [tab, setTab] = useSms("acc");
  const [demo, setDemo] = useSms("race");

  const irRows = demo==="gender"?data.irG:data.ir;
  const maxRate = Math.max(...irRows.map(r=>r.rate));
  const irNormalized = irRows.map(r=>({label:r.grp, v:r.rate/maxRate, sub:`n=${fmtInt(r.n)} · rate ${fmtPct(r.rate,1)}`}));

  const trendLabels = data.trend.map(t=>fmtDateShort(t.ts));

  return (
    <div className="tab-panel">
      <PageHead
        title="Match Score Quality"
        desc="How well ranks candidates against the requirements of an open job. Tracks ranking accuracy, alignment with hiring decisions, and fairness of the resulting score distribution."
        right={
          <>
            <button className="btn btn-secondary btn-sm"><Icon name="tune" size={14}/>Recalibrate</button>
            <button className="btn btn-primary btn-sm"><Icon name="file_download" size={14}/>Export report</button>
          </>
        }
      />
      <FiltersBar period={filters.period} onPeriod={p=>onFilter({period:p})}
        orgs={filters.orgs} onOrgs={v=>onFilter({orgs:v})}
        orgOptions={["Engineering","Sales","Operations","Marketing","Finance"]}
        stages={filters.stages} onStages={v=>onFilter({stages:v})}
        stageOptions={["Applied","Screened","Interviewed","Offered","Hired"]}
        onReset={onReset}/>

      <div className="tabs">
        <button className={tab==="acc"?"active":""} onClick={()=>setTab("acc")}><Icon name="check_circle" size={16}/>Accuracy & Utility</button>
        <button className={tab==="ir"?"active":""} onClick={()=>setTab("ir")}><Icon name="balance" size={16}/>Impact Ratio</button>
        <button className={tab==="pert"?"active":""} onClick={()=>setTab("pert")}><Icon name="shuffle" size={16}/>Perturbation</button>
      </div>

      {tab==="acc" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="kpi-row">
            <div className="kpi gradient">
              <div className="lbl">AUC · ranking</div>
              <div className="val">{data.auc.toFixed(3)}</div>
              <div className="foot"><Chip tone={statusForScore(data.auc).tone}>{statusForScore(data.auc).label}</Chip></div>
            </div>
            <div className="kpi">
              <div className="lbl">F1 · hire prediction</div>
              <div className="val">{data.f1.toFixed(3)}</div>
              <div className="foot"><span className="muted" style={{fontSize:12}}>P {data.precision.toFixed(2)} · R {data.recall.toFixed(2)}</span></div>
            </div>
            <div className="kpi">
              <div className="lbl">Hiring decision alignment</div>
              <div className="val">{data.hireAlign.toFixed(2)}<span className="unit">/ 5</span></div>
              <div className="foot"><Chip tone="blue">Good</Chip><span style={{fontSize:11,color:"var(--grey-60)"}}>vs recruiter rating</span></div>
            </div>
            <div className={"kpi " + (data.calibHealth<0.75?"warn":"")}>
              <div className="lbl">Calibration health</div>
              <div className="val">{(data.calibHealth*100).toFixed(0)}<span className="unit">%</span></div>
              <div className="foot"><Chip tone={statusForScore(data.calibHealth).tone}>{statusForScore(data.calibHealth).label}</Chip><span style={{fontSize:11,color:"var(--grey-60)"}}>reqs w/ ≥3 ideal profiles</span></div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Score distribution</h3>
              <div className="card-sub">All 184,392 applications · bimodal shape indicates healthy discrimination</div>
              <Histogram bins={data.bins} gradient/>
              <div className="legend" style={{justifyContent:"space-between"}}>
                <span>0 · weak match</span><span>2.5 · median</span><span>5 · strong match</span>
              </div>
            </div>
            <div className="card">
              <h3>Weekly ranking score trend</h3>
              <div className="card-sub">Median match score across all ranked applications</div>
              <LineChart
                series={[{color:"var(--blueviolet-60)", values:data.trend.map(t=>t.score/5), fill:"var(--blueviolet-60)", dots:true}]}
                xLabels={trendLabels.filter((_,i)=>i%4===0)} ymin={0.55} ymax={0.8}
                yFmt={v=>(v*5).toFixed(2)}
                height={220}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3>Workflow utility</h3>
                <div className="sub">How the match score shortens time-to-shortlist and surfaces explainable decisions</div>
              </div>
            </div>
            <div className="grid-3">
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <Donut value={data.automation} tone="violet"/>
                <div><div style={{fontSize:13,fontWeight:700,color:"var(--grey-90)"}}>Auto-tier rate</div>
                <div style={{fontSize:12,color:"var(--grey-60)",marginTop:2,maxWidth:180}}>Applications resolved by model tiering without human review</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <Donut value={data.explain/5} tone="blue"/>
                <div><div style={{fontSize:13,fontWeight:700,color:"var(--grey-90)"}}>Explanation quality</div>
                <div style={{fontSize:12,color:"var(--grey-60)",marginTop:2,maxWidth:180}}>{data.explain.toFixed(1)}/5 recruiter rating on "Why this score?"</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <Donut value={data.calibHealth} tone={data.calibHealth>=0.75?"green":"orange"}/>
                <div><div style={{fontSize:13,fontWeight:700,color:"var(--grey-90)"}}>Reqs well calibrated</div>
                <div style={{fontSize:12,color:"var(--grey-60)",marginTop:2,maxWidth:180}}>At least 3 ideal candidate profiles on the req</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==="ir" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="card">
            <div className="card-head">
              <div>
                <h3>Data readiness for impact-ratio testing</h3>
                <div className="sub">Prerequisites for a statistically sound 4/5ths analysis</div>
              </div>
              <Chip tone="blue">Ready</Chip>
            </div>
            <div>
              {[
                {k:"volume",   t:"Application volume",     s:"pass"},
                {k:"demo",     t:"Demographic self-ID",    s:data.readiness.demo.pct>=80?"pass":"warn"},
                {k:"profile",  t:"Profile completeness",   s:data.readiness.profile.pct>=80?"pass":"warn"},
                {k:"calibration",t:"Req calibration",      s:data.readiness.calibration.pct>=75?"pass":"warn"},
                {k:"coverage", t:"Stage coverage",         s:"pass"},
              ].map(x=>(
                <div key={x.k} className={"ready "+x.s}>
                  <Icon name={x.s==="pass"?"check_circle":"error_outline"}/>
                  <div>
                    <div style={{fontWeight:600,color:"var(--grey-90)"}}>{x.t}</div>
                    <div style={{fontSize:12,color:"var(--grey-60)",marginTop:1}}>{data.readiness[x.k].note}</div>
                  </div>
                  <div className="s">{data.readiness[x.k].pct}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-title">
            <div><h2>Impact ratio</h2><div className="sub">Shortlist rates as % of highest-rate group</div></div>
            <div className="right">
              <Segmented value={demo} onChange={setDemo} options={[
                {value:"gender",label:"Gender"},{value:"race",label:"Race / ethnicity"}
              ]}/>
            </div>
          </div>

          <div className="card">
            <HBars rows={irNormalized} max={1.05} threshold={0.80} thresholdLabel="0.80 threshold"
                   tone="ir" fmt={v=>v.toFixed(2)}/>
          </div>
        </div>
      )}

      {tab==="pert" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="alert info">
            <Icon name="info"/>
            <div className="body">
              <span className="t">Counterfactual scoring</span>
              Scores of 6,200 real applicants recomputed with race/gender attributes swapped. Mean absolute score difference should stay below 0.010 on a 0–5 scale.
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3>Mean absolute score difference</h3>
                <div className="sub">Race-swapped candidates · lower is more robust</div>
              </div>
            </div>
            <HBars rows={data.pert.map(r=>({label:r.grp, v:r.diff, sub:`original ${r.orig.toFixed(2)} · n=${fmtInt(r.n)}`}))}
                   max={0.03} tone="diff" fmt={v=>v.toFixed(4)} threshold={0.010} thresholdLabel="0.010 target"/>
          </div>
        </div>
      )}
    </div>
  );
}

window.MatchScore = MatchScore;
