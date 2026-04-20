/* AI Interviewer module — 3 tabs: Quality / Impact Ratio / Perturbation */
const {useState:useSai} = React;

function AIInterviewer({data, bias, onNav, filters, onFilter, onReset}){
  const [tab, setTab] = useSai("quality");
  const [demo, setDemo] = useSai("gender");

  const irRows = demo==="gender"?data.irGender : demo==="race"?data.irRace : data.irAccent;
  const pertRows = demo==="gender"?data.pertG : demo==="race"?data.pertR : data.pertA;

  // Normalize IR relative to the max rate (selection rate method)
  const maxRate = Math.max(...irRows.map(r=>r.rate));
  const irNormalized = irRows.map(r=>({label:r.grp, v:r.rate/maxRate, sub:`n=${fmtInt(r.n)} · rate ${fmtPct(r.rate,1)}`}));

  return (
    <div className="tab-panel">
      <PageHead
        title="AI Interviewer"
        desc="Conversational AI interview agent. Monitors quality of generated questions, fairness of outcomes across demographics, and robustness to paraphrased inputs."
        right={
          <>
            <button className="btn btn-secondary btn-sm"><Icon name="science" size={14}/>Run eval suite</button>
            <button className="btn btn-primary btn-sm"><Icon name="file_download" size={14}/>Export report</button>
          </>
        }
      />

      <FiltersBar
        period={filters.period} onPeriod={p=>onFilter({period:p})}
        orgs={filters.orgs} onOrgs={v=>onFilter({orgs:v})}
        orgOptions={["Engineering","Sales","Operations","Marketing","Finance"]}
        stages={filters.stages} onStages={v=>onFilter({stages:v})}
        stageOptions={["Applied","Screened","Interviewed","Offered","Hired"]}
        onReset={onReset}
      />

      <div className="tabs">
        <button className={tab==="quality"?"active":""} onClick={()=>setTab("quality")}><Icon name="verified" size={16}/>Quality</button>
        <button className={tab==="ir"?"active":""} onClick={()=>setTab("ir")}><Icon name="balance" size={16}/>Impact Ratio <span className="count">4/5</span></button>
        <button className={tab==="pert"?"active":""} onClick={()=>setTab("pert")}><Icon name="shuffle" size={16}/>Perturbation</button>
      </div>

      {tab==="quality" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="kpi-row">
            <div className="kpi gradient">
              <div className="lbl">Interviews run · 30d</div>
              <div className="val">{fmtInt(data.over.nTotal)}</div>
              <div className="foot">
                <span className="muted" style={{fontSize:12}}>5 role families</span>
              </div>
            </div>
            <div className="kpi">
              <div className="lbl">Response relevance</div>
              <div className="val">{(data.over.rrel*100).toFixed(1)}<span className="unit">%</span></div>
              <div className="foot"><Chip tone={statusForScore(data.over.rrel).tone}>{statusForScore(data.over.rrel).label}</Chip></div>
            </div>
            <div className="kpi">
              <div className="lbl">Compliance rate</div>
              <div className="val">{(data.over.compliance*100).toFixed(1)}<span className="unit">%</span></div>
              <div className="foot"><Chip tone={statusForScore(data.over.compliance).tone}>{statusForScore(data.over.compliance).label}</Chip><span style={{fontSize:11,color:"var(--grey-60)"}}>No protected attrs raised</span></div>
            </div>
            <div className="kpi">
              <div className="lbl">Evidence grounding</div>
              <div className="val">{(data.over.evidence*100).toFixed(1)}<span className="unit">%</span></div>
              <div className="foot"><Chip tone={statusForScore(data.over.evidence).tone}>{statusForScore(data.over.evidence).label}</Chip><span style={{fontSize:11,color:"var(--grey-60)"}}>Citations verified</span></div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3>Per-role quality</h3>
                <div className="sub">Question coverage · question clarity · response relevance · compliance · evidence</div>
              </div>
            </div>
            <div className="mtable" style={{border:"none"}}>
              <div className="mtable-head" style={{gridTemplateColumns:"1.4fr 0.8fr 1fr 1fr 1fr 1fr 1fr"}}>
                <div>Role family</div><div>Volume</div><div>Coverage</div><div>Clarity</div><div>Relevance</div><div>Compliance</div><div>Evidence</div>
              </div>
              {data.byRole.map(r=>(
                <div key={r.role} className="mtable-row" style={{gridTemplateColumns:"1.4fr 0.8fr 1fr 1fr 1fr 1fr 1fr"}}>
                  <div><div className="primary">{r.role}</div><div className="tech">v2.4.1 agent · GPT-4o backbone</div></div>
                  <div className="num">{fmtInt(r.n)}</div>
                  <div><DotValue v={r.coverage}/></div>
                  <div><DotValue v={r.clarity}/></div>
                  <div><DotValue v={r.rrel}/></div>
                  <div><DotValue v={r.compliance}/></div>
                  <div><DotValue v={r.evidence}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="ir" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="alert info">
            <Icon name="info"/>
            <div className="body">
              <span className="t">NYC Local Law 144 · 4/5ths impact ratio rule</span>
              Selection rates must be ≥ 80% of the reference group rate. Chart is normalized to the highest-rate group. Groups with n &lt; 100 are suppressed.
            </div>
          </div>

          <div className="section-title">
            <div><h2>Impact ratio by demographic</h2></div>
            <div className="right">
              <Segmented value={demo} onChange={setDemo} options={[
                {value:"gender",label:"Gender"},{value:"race",label:"Race / ethnicity"},{value:"accent",label:"Accent"}
              ]}/>
            </div>
          </div>

          <div className="card">
            <HBars rows={irNormalized} max={1.05} threshold={0.80} thresholdLabel="0.80 threshold"
                   tone="ir" fmt={v=>v.toFixed(2)}/>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Selection rate by group</h3>
              <div className="card-sub">Pass = receives positive interview outcome ≥ 3.0/5</div>
              <HBars rows={irRows.map(r=>({label:r.grp, v:r.rate, sub:`n=${fmtInt(r.n)}`}))} max={0.7} tone="auto" strokeColor="var(--blueviolet-60)"
                     fmt={v=>(v*100).toFixed(1)+"%"} barHeight={22}/>
            </div>
            <div className="card">
              <h3>Bias test summary</h3>
              <div className="card-sub">Automatic fairness tests run on last 7-day window</div>
              <div style={{display:"flex",flexDirection:"column",gap:2,marginTop:8}}>
                {[
                  {t:"Gender · 4/5ths rule", s:"pass", d:"Min ratio 0.92 · all groups meet threshold"},
                  {t:"Race · 4/5ths rule", s:"pass", d:"Min ratio 0.86 · Black candidates at 0.86"},
                  {t:"Accent · 4/5ths rule", s: bias>0.01?"fail":"warn", d: bias>0.01?"Min ratio 0.77 · breach since Apr 2":"Min ratio 0.83 · watch"},
                  {t:"Disparate treatment test", s:"pass", d:"χ² p = 0.42, no significant effect"},
                  {t:"Calibration across groups", s:"warn", d:"Spread 4.1pp · within tolerance but elevated"},
                ].map((x,i)=>(
                  <div className={"ready "+x.s} key={i}>
                    <Icon name={x.s==="pass"?"check_circle":x.s==="warn"?"error_outline":"cancel"}/>
                    <div>
                      <div style={{fontWeight:600,color:"var(--grey-90)"}}>{x.t}</div>
                      <div style={{fontSize:12,color:"var(--grey-60)",marginTop:1}}>{x.d}</div>
                    </div>
                    <div className="s">{x.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==="pert" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="alert info">
            <Icon name="info"/>
            <div className="body">
              <span className="t">Counterfactual perturbation testing</span>
              Same candidate response is scored with protected-attribute signals swapped (name, voice accent, etc). Lower is better — differences below 0.003 indicate robustness.
            </div>
          </div>

          <div className="section-title">
            <div><h2>Mean absolute score difference</h2></div>
            <div className="right">
              <Segmented value={demo} onChange={setDemo} options={[
                {value:"gender",label:"Gender"},{value:"race",label:"Race"},{value:"accent",label:"Accent"}
              ]}/>
            </div>
          </div>

          <div className="card">
            <HBars rows={pertRows.map(r=>({label:r.grp, v:r.diff, sub:`n=${fmtInt(r.n)} pairs`}))}
                   max={0.02} tone="diff" fmt={v=>v.toFixed(4)}
                   threshold={0.003} thresholdLabel="0.003 target"/>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Top perturbation failures</h3>
              <div className="card-sub">Individual pairs with score diff &gt; 0.05</div>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {[
                  {id:"INT-114029", g:"Accent: Native → Non-native", d:0.084, role:"Sales SDR"},
                  {id:"INT-113982", g:"Race: White → Black", d:0.072, role:"Account Mgr"},
                  {id:"INT-113876", g:"Accent: Native → Non-native", d:0.063, role:"Sales SDR"},
                  {id:"INT-113801", g:"Gender: Male → Non-binary", d:0.058, role:"Product Mgr"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",padding:"10px 0",borderTop:i?"1px solid var(--grey-15)":"none",alignItems:"center",gap:12}}>
                    <div>
                      <div style={{fontWeight:600,color:"var(--grey-90)",fontSize:13}}>{r.id}</div>
                      <div style={{fontSize:12,color:"var(--grey-60)"}}>{r.g} · {r.role}</div>
                    </div>
                    <div className="num" style={{color:"var(--red-70)",fontFamily:"var(--font-display)",fontWeight:600,fontSize:16}}>{r.d.toFixed(3)}</div>
                    <button className="btn btn-ghost btn-sm">Review</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>Test coverage</h3>
              <div className="card-sub">Interviews pair-tested in last 30 days</div>
              <div style={{display:"flex",alignItems:"center",gap:20,padding:"8px 0"}}>
                <Donut value={0.68} tone="blue" size={96}/>
                <div>
                  <div style={{fontSize:28,fontFamily:"var(--font-display)",fontWeight:600,color:"var(--grey-90)"}}>4,239</div>
                  <div style={{fontSize:12,color:"var(--grey-60)",marginTop:2}}>pairs tested of 6,241 interviews</div>
                  <div style={{marginTop:10}}><Chip tone="blue">68% coverage</Chip></div>
                </div>
              </div>
              <hr className="hr"/>
              <div style={{fontSize:12,color:"var(--grey-70)",lineHeight:1.55}}>
                Uncovered interviews had response audio shorter than 30s or were English-only, which makes accent perturbation inapplicable.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AIInterviewer = AIInterviewer;
