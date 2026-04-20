/* App shell: topbar + left sidebar navigation */
const {useState:useSs} = React;

const NAV = [
  {group:"Compliance", items:[
    {id:"overview",    icon:"space_dashboard", label:"Overview"},
  ]},
  {group:"AI modules", items:[
    {id:"resume",      icon:"article",         label:"Resume Parsing",       count:"184k"},
    {id:"interviewer", icon:"record_voice_over",label:"AI Interviewer",       count:"6.2k", risk:true},
    {id:"match",       icon:"tune",            label:"Match Score",          count:"184k"},
    {id:"recs",        icon:"how_to_reg",      label:"Recommendations",      count:"48k"},
  ]},
  {group:"Governance", items:[
    {id:"audit",       icon:"fact_check",      label:"Audit & Reports"},
    {id:"policies",    icon:"policy",          label:"Policies"},
    {id:"incidents",   icon:"report",          label:"Incidents"},
  ]}
];

function Topbar({currentLabel}){
  return (
    <div className="topbar">
      <div className="logo"><img src="assets/eightfold-logo.svg" alt="Eightfold"/></div>
      <div className="breadcrumb">
        <span>Platform</span>
        <span className="sep">/</span>
        <span>Responsible AI</span>
        <span className="sep">/</span>
        <span className="current">{currentLabel}</span>
      </div>
      <div className="spacer"/>
      <div className="env"><span className="dot"/>Production</div>
      <button className="iconbtn" title="Search"><Icon name="search"/></button>
      <button className="iconbtn" title="Notifications"><Icon name="notifications_none"/><span className="dot"/></button>
      <button className="iconbtn" title="Help"><Icon name="help_outline"/></button>
      <div className="me">
        <div>
          <div className="nm">Priya Desai</div>
          <div className="rl">Head of Responsible AI</div>
        </div>
        <div className="av">PD</div>
      </div>
    </div>
  );
}

function Sidebar({active, onNav}){
  return (
    <nav className="rail">
      <div className="brand-block">
        <div className="brand-title">AI Compliance</div>
        <div className="brand-sub">Platform Monitor</div>
      </div>
      {NAV.map(g=>(
        <React.Fragment key={g.group}>
          <div className="group">{g.group}</div>
          {g.items.map(it=>(
            <a key={it.id} className={active===it.id?"active":""} onClick={e=>{e.preventDefault(); onNav(it.id);}}>
              <Icon name={it.icon}/>
              <span className="lbl-txt">{it.label}</span>
              {it.count && <span className="count">{it.count}</span>}
              {it.risk && <span className="risk-dot"/>}
            </a>
          ))}
        </React.Fragment>
      ))}
      <div className="footer">
        <strong>NYC Local Law 144 · EU AI Act</strong>
        Next audit export due Jun 12
      </div>
    </nav>
  );
}

window.Topbar = Topbar;
window.Sidebar = Sidebar;
window.NAV = NAV;
