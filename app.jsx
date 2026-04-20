/* Main App: wires shell + pages + tweaks, persists state, drives live filters */
const {useState:useSa, useEffect:useEa, useMemo:useMa} = React;

const LS_KEY = "aicompliance.state.v4";

const DEFAULT_FILTERS = {
  period:"Last 30 days",
  orgs:[],
  stages:[],
  fmtFilter:"All formats",
  geos:[],
  langFilter:"All languages"
};

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {
    active:"overview",
    tweaks:TWEAK_DEFS,
    tweaksVisible:false,
    resumeRequests:[
      /* A fully-published request — user can view report + download PDF */
      {
        id:"REQ-2041", name:"Q1 EMEA engineering hires",
        submitted:Date.now()-1000*60*60*24*2,
        status:"published",
        filters:{period:"Last 30 days",orgs:["Engineering"],geos:["EMEA"],langFilter:"All languages"},
        total:3460,
        submittedBy:"priya.rao@eightfold.ai",
        assignedTo:"Miguel Alvarez",
        assignedEmail:"miguel.alvarez@eightfold.ai",
        reviewedBy:"Dr. Linnea Holm",
        ticketId:"RAI-3482",
        slaDueAt:Date.now()-1000*60*60*8,
        publishedAt:Date.now()-1000*60*60*8,
        timeline:[
          {at:Date.now()-1000*60*60*48,      kind:"submitted",    who:"priya.rao@eightfold.ai",     text:"Request submitted from the AI Compliance Dashboard."},
          {at:Date.now()-1000*60*60*48+60000, kind:"queued",      who:"System",                     text:"Email dispatched to rai-ops@eightfold.ai. Ticket RAI-3482 opened in the backend queue."},
          {at:Date.now()-1000*60*60*46,      kind:"acknowledged", who:"Miguel Alvarez",             text:"Request picked up. ETA for results ~36 hours."},
          {at:Date.now()-1000*60*60*40,      kind:"testing",      who:"Miguel Alvarez",             text:"Validation pipeline started. Sampling 3,460 resumes across the scoped filters."},
          {at:Date.now()-1000*60*60*14,      kind:"testing",      who:"System",                     text:"All four metric suites completed. Hallucination verification pass finished."},
          {at:Date.now()-1000*60*60*12,      kind:"review",       who:"Dr. Linnea Holm",            text:"Results under quality review — cross-checking against the prior baseline."},
          {at:Date.now()-1000*60*60*8,       kind:"published",    who:"Dr. Linnea Holm",            text:"Reviewed and signed off. Report is published."}
        ]
      },
      /* Currently in backend testing — blocked */
      {
        id:"REQ-2039", name:"APAC sales — Japanese resumes",
        submitted:Date.now()-1000*60*60*5,
        status:"testing",
        filters:{period:"Last 30 days",orgs:["Sales"],geos:["APAC"],langFilter:"Japanese"},
        total:1560,
        submittedBy:"aarav.patel@eightfold.ai",
        assignedTo:"Wei-Lin Chen",
        assignedEmail:"wei.chen@eightfold.ai",
        ticketId:"RAI-3501",
        slaDueAt:Date.now()+1000*60*60*24,
        timeline:[
          {at:Date.now()-1000*60*60*5,        kind:"submitted",    who:"aarav.patel@eightfold.ai",  text:"Request submitted from the AI Compliance Dashboard."},
          {at:Date.now()-1000*60*60*5+60000,  kind:"queued",       who:"System",                    text:"Email dispatched to rai-ops@eightfold.ai. Ticket RAI-3501 opened."},
          {at:Date.now()-1000*60*60*4,        kind:"acknowledged", who:"Wei-Lin Chen",              text:"Request acknowledged. Japanese validation corpus being loaded."},
          {at:Date.now()-1000*60*60*3,        kind:"testing",      who:"Wei-Lin Chen",              text:"Running validation — 42% complete."}
        ]
      },
      /* In review — finished testing, awaiting sign-off */
      {
        id:"REQ-2038", name:"NA finance — March cohort",
        submitted:Date.now()-1000*60*60*36,
        status:"review",
        filters:{period:"Last 30 days",orgs:["Finance"],geos:["North America"],langFilter:"All languages"},
        total:3460,
        submittedBy:"priya.rao@eightfold.ai",
        assignedTo:"Miguel Alvarez",
        assignedEmail:"miguel.alvarez@eightfold.ai",
        reviewedBy:"Dr. Linnea Holm",
        ticketId:"RAI-3489",
        slaDueAt:Date.now()+1000*60*60*4,
        timeline:[
          {at:Date.now()-1000*60*60*36,       kind:"submitted",    who:"priya.rao@eightfold.ai",    text:"Request submitted from the AI Compliance Dashboard."},
          {at:Date.now()-1000*60*60*36+60000, kind:"queued",       who:"System",                    text:"Email dispatched to rai-ops@eightfold.ai. Ticket RAI-3489 opened."},
          {at:Date.now()-1000*60*60*32,       kind:"acknowledged", who:"Miguel Alvarez",            text:"Request acknowledged. Queue position 2."},
          {at:Date.now()-1000*60*60*18,       kind:"testing",      who:"Miguel Alvarez",            text:"Validation started on the 3,460-resume sample."},
          {at:Date.now()-1000*60*60*3,        kind:"review",       who:"Dr. Linnea Holm",           text:"Results complete. Final QA review in progress."}
        ]
      },
      /* Just queued */
      {
        id:"REQ-2044", name:"EMEA ops — German + French",
        submitted:Date.now()-1000*60*45,
        status:"queued",
        filters:{period:"Last 7 days",orgs:["Operations"],geos:["EMEA"],langFilter:"All languages"},
        total:820,
        submittedBy:"priya.rao@eightfold.ai",
        ticketId:"RAI-3511",
        slaDueAt:Date.now()+1000*60*60*46,
        timeline:[
          {at:Date.now()-1000*60*45,          kind:"submitted",    who:"priya.rao@eightfold.ai",    text:"Request submitted from the AI Compliance Dashboard."},
          {at:Date.now()-1000*60*44,          kind:"queued",       who:"System",                    text:"Email dispatched to rai-ops@eightfold.ai. Ticket RAI-3511 opened. Awaiting assignment (business hours SLA: 4 h)."}
        ]
      }
    ],
    activeReportId:null,
    filters: {
      overview:    {...DEFAULT_FILTERS},
      resume:      {...DEFAULT_FILTERS},
      interviewer: {...DEFAULT_FILTERS},
      match:       {...DEFAULT_FILTERS},
      recs:        {...DEFAULT_FILTERS},
    }
  };
}
function saveState(s){ try{ localStorage.setItem(LS_KEY, JSON.stringify(s)); }catch(e){} }

const stateBias = {healthy:-0.02, watch:0.02, breach:0.06};

function App(){
  const [s, setS] = useSa(loadState);
  useEa(()=>{ saveState(s); }, [s]);
  const [toast, setToast] = useSa(null);
  const showToast = (t) => {
    setToast(t);
    setTimeout(()=>setToast(null), 6000);
  };

  useEa(()=>{
    document.body.classList.remove("density-compact","density-comfortable","density-spacious");
    document.body.classList.add("density-"+s.tweaks.density);
  }, [s.tweaks.density]);

  useEa(()=>{
    const map = {
      violet: {accent:"#5962B7",accentDark:"#414996",accentLight:"#f1f2ff",accentLight2:"#cacffc"},
      blue:   {accent:"#2c8cc9",accentDark:"#146da6",accentLight:"#ebf7ff",accentLight2:"#bce4ff"},
      bgreen: {accent:"#1999ac",accentDark:"#0b7b8b",accentLight:"#ebfdff",accentLight2:"#b0f3fe"}
    }[s.tweaks.primaryColor] || {accent:"#5962B7",accentDark:"#414996",accentLight:"#f1f2ff",accentLight2:"#cacffc"};
    const r=document.documentElement.style;
    r.setProperty("--blueviolet-60", map.accent);
    r.setProperty("--blueviolet-70", map.accentDark);
    r.setProperty("--blueviolet-10", map.accentLight);
    r.setProperty("--blueviolet-20", map.accentLight2);
  }, [s.tweaks.primaryColor]);

  useEa(()=>{
    const h = (e)=>{
      const m = e.data;
      if(!m || typeof m !== "object") return;
      if(m.type==="__activate_edit_mode") setS(x=>({...x, tweaksVisible:true}));
      if(m.type==="__deactivate_edit_mode") setS(x=>({...x, tweaksVisible:false}));
    };
    window.addEventListener("message", h);
    window.parent.postMessage({type:"__edit_mode_available"}, "*");
    return ()=>window.removeEventListener("message", h);
  }, []);

  const bias = stateBias[s.tweaks.state];

  useEa(()=>{
    if(s.tweaks.moduleEmphasis && s.tweaks.moduleEmphasis !== s.active){
      setS(x=>({...x, active: x.tweaks.moduleEmphasis}));
    }
    // eslint-disable-next-line
  }, [s.tweaks.moduleEmphasis]);

  const setFilters = (mod, patch) => setS(x=>({...x, filters:{...x.filters, [mod]:{...x.filters[mod], ...patch}}}));
  const resetFilters = (mod) => setS(x=>({...x, filters:{...x.filters, [mod]:{...DEFAULT_FILTERS}}}));

  // Overview always uses 30d baseline so it reads as platform-level
  const overviewData = useMa(()=>({
    rp: DashData.genResumeParsing({bias, days:30}),
    ai: DashData.genAIInterviewer({bias, days:30}),
    ms: DashData.genMatchScore({bias, days:30}),
    rc: DashData.genRecommendation({bias, days:30})
  }), [bias]);

  const filterParams = (mod) => {
    const f = s.filters[mod];
    return {bias, days:periodDays(f.period, f.customFrom, f.customTo), orgs:f.orgs, stages:f.stages, fmtFilter:f.fmtFilter};
  };
  const rpFilterParams = () => {
    const f = s.filters.resume;
    return {bias, days:periodDays(f.period, f.customFrom, f.customTo), orgs:f.orgs, geos:f.geos||[], langFilter:f.langFilter||"All languages", fmtFilter:f.fmtFilter||"All formats"};
  };

  const rpData = useMa(()=>DashData.genResumeParsing(rpFilterParams()), [bias, JSON.stringify(s.filters.resume)]);
  const aiData = useMa(()=>DashData.genAIInterviewer(filterParams("interviewer")), [bias, JSON.stringify(s.filters.interviewer)]);
  const msData = useMa(()=>DashData.genMatchScore(filterParams("match")), [bias, JSON.stringify(s.filters.match)]);
  const rcData = useMa(()=>DashData.genRecommendation(filterParams("recs")), [bias, JSON.stringify(s.filters.recs)]);

  const setTweaks = (patch) => {
    setS(x=>({...x, tweaks:{...x.tweaks, ...patch}}));
    window.parent.postMessage({type:"__edit_mode_set_keys", edits:patch}, "*");
  };
  const onNav = (id)=> setS(x=>({...x, active:id, tweaks:{...x.tweaks, moduleEmphasis:id}}));

  // Resume Parsing request handlers
  const submitResumeRequest = (name) => {
    const f = s.filters.resume;
    const id = "REQ-" + (2050 + Math.floor(Math.random()*900));
    const ticketId = "RAI-" + (3515 + Math.floor(Math.random()*200));
    const total = rpData.total;
    const now = Date.now();
    const newReq = {
      id, name: name || "Untitled request",
      submitted: now,
      status: "queued",
      filters: {period:f.period, customFrom:f.customFrom, customTo:f.customTo, orgs:[...f.orgs], geos:[...(f.geos||[])], langFilter:f.langFilter||"All languages", fmtFilter:f.fmtFilter||"All formats"},
      total,
      submittedBy: "priya.rao@eightfold.ai",
      ticketId,
      slaDueAt: now + 1000*60*60*48,
      timeline: [
        {at: now,          kind:"submitted", who:"priya.rao@eightfold.ai", text:"Request submitted from the AI Compliance Dashboard."},
        {at: now + 30000,  kind:"queued",    who:"System",                 text:`Email dispatched to rai-ops@eightfold.ai. Ticket ${ticketId} opened. Awaiting assignment (business hours SLA: 4 h).`}
      ]
    };
    setS(x=>({...x, resumeRequests:[newReq, ...(x.resumeRequests||[])]}));
  };

  /* Demo: simulate the backend lifecycle advancing. Each call moves the given
     request to the next stage with a realistic timeline event. */
  const advanceResumeRequest = (id) => {
    const order = ["submitted","queued","acknowledged","testing","review","published"];
    let publishedReq = null;
    setS(x=>{
      const reqs = (x.resumeRequests||[]).map(r=>{
        if(r.id!==id) return r;
        const idx = order.indexOf(r.status);
        if(idx<0 || idx>=order.length-1) return r;
        const next = order[idx+1];
        const now = Date.now();
        const ev = {
          acknowledged: {who:"System", text:"Request acknowledged by the Responsible-AI backend team. Validation corpus loading."},
          testing:      {who:"System", text:"Validation pipeline started. Running all four metric suites on the scoped sample."},
          review:       {who:"System", text:"Results complete. Quality review in progress."},
          published:    {who:"System", text:`Reviewed and signed off. Report is published. Notification email sent to ${r.submittedBy||"the requester"}.`}
        }[next] || {who:"System", text:""};
        const patch = {
          ...r,
          status: next,
          timeline: [...(r.timeline||[]), {at:now, kind:next, who:ev.who, text:ev.text}]
        };
        if(next==="published") {
          patch.publishedAt = now;
          publishedReq = patch;
        }
        return patch;
      });
      return {...x, resumeRequests:reqs};
    });
    if(publishedReq){
      showToast({
        kind: "published",
        reqName: publishedReq.name,
        reqId: publishedReq.id,
        email: publishedReq.submittedBy || "the requester"
      });
    }
  };
  const openResumeReport = (id) => setS(x=>({...x, activeReportId:id}));
  const closeResumeReport = () => setS(x=>({...x, activeReportId:null}));
  const deleteResumeRequest = (id) => setS(x=>({...x, resumeRequests:(x.resumeRequests||[]).filter(r=>r.id!==id), activeReportId:x.activeReportId===id?null:x.activeReportId}));

  const currentLabel = ({
    overview:"Overview", resume:"Resume Parsing", interviewer:"AI Interviewer",
    match:"Match Score", recs:"Recommendations", audit:"Audit & Reports",
    policies:"Policies", incidents:"Incidents"
  })[s.active] || "Overview";

  const mountPage = () => {
    const id = s.active;
    if(id==="overview") return <Overview data={overviewData} onNav={onNav} bias={bias}/>;
    if(id==="resume")   return <ResumeParsing
      data={rpData} bias={bias} onNav={onNav}
      filters={s.filters.resume} onFilter={(p)=>setFilters("resume",p)} onReset={()=>resetFilters("resume")}
      requests={s.resumeRequests||[]}
      activeReportId={s.activeReportId}
      onSubmitRequest={submitResumeRequest}
      onAdvanceRequest={advanceResumeRequest}
      onOpenReport={openResumeReport}
      onCloseReport={closeResumeReport}
      onDeleteRequest={deleteResumeRequest}
    />;
    if(id==="interviewer") return <AIInterviewer data={aiData} bias={bias} onNav={onNav} filters={s.filters.interviewer} onFilter={(p)=>setFilters("interviewer",p)} onReset={()=>resetFilters("interviewer")}/>;
    if(id==="match")    return <MatchScore data={msData} bias={bias} onNav={onNav} filters={s.filters.match} onFilter={(p)=>setFilters("match",p)} onReset={()=>resetFilters("match")}/>;
    if(id==="recs")     return <Recommendations data={rcData} bias={bias} onNav={onNav} filters={s.filters.recs} onFilter={(p)=>setFilters("recs",p)} onReset={()=>resetFilters("recs")}/>;
    return (
      <div className="tab-panel">
        <PageHead title={currentLabel} desc="Governance and audit workflows." />
        <div className="card" style={{padding:48,textAlign:"center"}}>
          <Icon name="construction" size={36}/>
          <div style={{fontSize:16,fontWeight:700,color:"var(--grey-90)",marginTop:12}}>Coming in this prototype round</div>
          <div style={{fontSize:13,color:"var(--grey-60)",marginTop:6,maxWidth:380,margin:"6px auto 0"}}>
            The Responsible AI monitoring surface is the focus here.
          </div>
          <button className="btn btn-primary btn-sm" style={{marginTop:20}} onClick={()=>onNav("overview")}>Back to Overview</button>
        </div>
      </div>
    );
  };

  return (
    <div className="app" data-screen-label={currentLabel}>
      <Topbar currentLabel={currentLabel}/>
      <Sidebar active={s.active} onNav={onNav}/>
      <main className="main">
        <div className="main-inner">{mountPage()}</div>
      </main>
      <Tweaks values={s.tweaks} onChange={setTweaks} visible={s.tweaksVisible}/>
      {toast && toast.kind==="published" && (
        <div className="toast toast-email" role="status" aria-live="polite">
          <div className="toast-icon"><Icon name="mail" size={20}/></div>
          <div className="toast-body">
            <div className="toast-title">Report published · notification sent</div>
            <div className="toast-text">
              <strong>{toast.reqName}</strong> ({toast.reqId}) is live. We've emailed <strong>{toast.email}</strong> with a link to the report and a summary of the published metrics.
            </div>
          </div>
          <button className="toast-close" onClick={()=>setToast(null)} aria-label="Dismiss"><Icon name="close" size={16}/></button>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
