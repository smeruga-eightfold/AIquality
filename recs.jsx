/* Recommendation Quality module */
const {useState:useSrc} = React;

function Recommendations({data, bias, onNav, filters, onFilter, onReset}){
  const [tab, setTab] = useSrc("relevance");

  const driftLabels = data.driftSeries.map(d=>fmtDateShort(d.ts));
  const SRC_COLORS = ["var(--blueviolet-60)","var(--primary-60)","var(--bluegreen-60)","var(--green-60)","var(--orange-50)"];

  return (
    <div className="tab-panel">
      <PageHead
        title="Recommendation Quality"
        desc='How well "Candidates to contact" recommendations drive recruiter action. Tracks precision, diversity of surfaced talent, and the stability of the ranking over time.'
        right={
          <>
            <button className="btn btn-secondary btn-sm"><Icon name="refresh" size={14}/>Refresh index</button>
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
        <button className={tab==="relevance"?"active":""} onClick={()=>setTab("relevance")}><Icon name="bolt" size={16}/>Relevance</button>
        <button className={tab==="diversity"?"active":""} onClick={()=>setTab("diversity")}><Icon name="diversity_3" size={16}/>Diversity</button>
        <button className={tab==="stability"?"active":""} onClick={()=>setTab("stability")}><Icon name="show_chart" size={16}/>Stability</button>
      </div>

      {tab==="relevance" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="kpi-row">
            <div className="kpi gradient">
              <div className="lbl">Recs surfaced · 30d</div>
              <div className="val">48,122</div>
              <div className="foot"><span className="muted" style={{fontSize:12}}>3,842 recruiters active</span></div>
            </div>
            <div className="kpi">
              <div className="lbl">Click-through rate</div>
              <div className="val">{(data.clickthrough*100).toFixed(1)}<span className="unit">%</span></div>
              <div className="foot"><Chip tone={statusForScore(data.clickthrough/0.5).tone}>{statusForScore(data.clickthrough/0.5).label}</Chip></div>
            </div>
            <div className="kpi">
              <div className="lbl">Shortlist rate</div>
              <div className="val">{(data.shortlistRate*100).toFixed(1)}<span className="unit">%</span></div>
              <div className="foot"><Chip tone="blue">Good</Chip></div>
            </div>
            <div className="kpi">
              <div className="lbl">nDCG@10</div>
              <div className="val">{data.ndcg.toFixed(3)}</div>
              <div className="foot"><Chip tone={statusForScore(data.ndcg).tone}>{statusForScore(data.ndcg).label}</Chip><span style={{fontSize:11,color:"var(--grey-60)"}}>vs recruiter gold</span></div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Engagement funnel · 30d</h3>
              <div className="card-sub">From surfaced recommendation to completed outreach</div>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:12}}>
                {[
                  {k:"Surfaced", n:48122, pct:100, tone:"var(--blueviolet-60)"},
                  {k:"Clicked / opened", n:19730, pct:data.clickthrough*100, tone:"var(--primary-60)"},
                  {k:"Shortlisted", n:13474, pct:data.shortlistRate*100, tone:"var(--bluegreen-60)"},
                  {k:"Contacted", n:8164, pct:17, tone:"var(--green-60)"},
                  {k:"Replied", n:3291, pct:6.8, tone:"var(--green-70)"},
                ].map((r,i)=>(
                  <div key={i}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                      <span style={{fontWeight:600,color:"var(--grey-90)"}}>{r.k}</span>
                      <span className="mono" style={{color:"var(--grey-70)"}}>{fmtInt(r.n)} · {r.pct.toFixed(1)}%</span>
                    </div>
                    <div style={{height:10,borderRadius:999,background:"var(--grey-15)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:r.pct+"%",background:r.tone,borderRadius:999}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>Top recruiter feedback</h3>
              <div className="card-sub">From 1,214 rated recommendations (last 7 days)</div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
                {[
                  {t:"Relevant skill match", pct:78, tone:"green"},
                  {t:"Strong recent experience", pct:64, tone:"green"},
                  {t:"Good culture fit signal", pct:51, tone:"blue"},
                  {t:"Too senior / too junior", pct:22, tone:"orange"},
                  {t:"Stale activity on platform", pct:14, tone:"orange"},
                  {t:"Location mismatch", pct:9, tone:"red"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:"var(--grey-80)",marginBottom:3}}>{r.t}</div>
                      <div style={{height:6,borderRadius:999,background:"var(--grey-15)",overflow:"hidden"}}>
                        <div style={{height:"100%",width:r.pct+"%",background:`var(--${r.tone}-60)`,borderRadius:999}}/>
                      </div>
                    </div>
                    <div className="mono" style={{fontSize:13,fontWeight:600,color:"var(--grey-80)",minWidth:36,textAlign:"right"}}>{r.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==="diversity" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="kpi-row" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
            <div className="kpi">
              <div className="lbl">Source mix</div>
              <div className="val">5</div>
              <div className="foot"><span className="muted" style={{fontSize:12}}>distinct sources surfaced</span><Chip tone="blue">Balanced</Chip></div>
            </div>
            <div className="kpi">
              <div className="lbl">Skill diversity · Simpson</div>
              <div className="val">{data.diversitySkill.toFixed(2)}</div>
              <div className="foot"><Chip tone={statusForScore(data.diversitySkill).tone}>{statusForScore(data.diversitySkill).label}</Chip></div>
            </div>
            <div className="kpi">
              <div className="lbl">Experience level diversity</div>
              <div className="val">{data.diversityExp.toFixed(2)}</div>
              <div className="foot"><Chip tone={statusForScore(data.diversityExp).tone}>{statusForScore(data.diversityExp).label}</Chip></div>
            </div>
          </div>

          <div className="card">
            <h3>Candidate source distribution</h3>
            <div className="card-sub">Where the top 10 surfaced candidates came from · last 30 days</div>
            <StackedBars rows={data.sources} colors={SRC_COLORS}/>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3>Demographic parity — surfacing rate</h3>
                <div className="sub">Are demographic groups recommended in proportion to their pool share? 0.80 = 4/5ths threshold</div>
              </div>
              <Chip tone={bias>0.02?"orange":"blue"}>{bias>0.02?"Watch":"Pass"}</Chip>
            </div>
            <div className="grid-2">
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"var(--grey-70)",marginBottom:8}}>BY GENDER</div>
                <HBars rows={data.irG.map(r=>{
                  const max=Math.max(...data.irG.map(x=>x.rate));
                  return {label:r.grp, v:r.rate/max, sub:`n=${fmtInt(r.n)}`};
                })} max={1.1} threshold={0.80} tone="ir" fmt={v=>v.toFixed(2)} barHeight={22}/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"var(--grey-70)",marginBottom:8}}>BY RACE / ETHNICITY</div>
                <HBars rows={data.irR.map(r=>{
                  const max=Math.max(...data.irR.map(x=>x.rate));
                  return {label:r.grp, v:r.rate/max, sub:`n=${fmtInt(r.n)}`};
                })} max={1.1} threshold={0.80} tone="ir" fmt={v=>v.toFixed(2)} barHeight={22}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==="stability" && (
        <div className="tab-panel" style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="kpi-row" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
            <div className="kpi">
              <div className="lbl">Coverage</div>
              <div className="val">{(data.coverage*100).toFixed(0)}<span className="unit">%</span></div>
              <div className="foot"><span className="muted" style={{fontSize:12}}>of active reqs with ≥10 recs</span><Chip tone={statusForScore(data.coverage).tone}>{statusForScore(data.coverage).label}</Chip></div>
            </div>
            <div className="kpi">
              <div className="lbl">Recommendation freshness</div>
              <div className="val">{(data.freshness*100).toFixed(0)}<span className="unit">%</span></div>
              <div className="foot"><span className="muted" style={{fontSize:12}}>active in last 90 days</span><Chip tone="green">Healthy</Chip></div>
            </div>
            <div className={"kpi " + (data.staleRate>0.08?"warn":"")}>
              <div className="lbl">Stale rate</div>
              <div className="val">{(data.staleRate*100).toFixed(1)}<span className="unit">%</span></div>
              <div className="foot"><span className="muted" style={{fontSize:12}}>dormant &gt; 12 mo</span></div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3>Engagement drift · 28 days</h3>
                <div className="sub">Early warning: divergence between CTR/shortlist and dismiss rate indicates model drift</div>
              </div>
            </div>
            <LineChart
              series={[
                {color:"var(--blueviolet-60)", values:data.driftSeries.map(d=>d.ctr), fill:"var(--blueviolet-60)"},
                {color:"var(--bluegreen-60)", values:data.driftSeries.map(d=>d.shortlist)},
                {color:"var(--red-60)", values:data.driftSeries.map(d=>d.dismiss)},
              ]}
              xLabels={driftLabels} ymin={0} ymax={0.55}
            />
            <div className="legend">
              <span className="it"><span className="sw line" style={{background:"var(--blueviolet-60)"}}/>Click-through</span>
              <span className="it"><span className="sw line" style={{background:"var(--bluegreen-60)"}}/>Shortlisted</span>
              <span className="it"><span className="sw line" style={{background:"var(--red-60)"}}/>Dismissed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.Recommendations = Recommendations;
