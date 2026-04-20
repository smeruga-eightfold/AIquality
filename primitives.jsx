/* Primitives — shared small components */
const {useState, useRef, useEffect, useMemo} = React;

/* -------- Icon (Material Icons font) -------- */
function Icon({name, size}){ return <span className="mdi material-icons" style={size?{fontSize:size}:null}>{name}</span>; }

/* -------- Chip (colored pill, with optional dot) -------- */
function Chip({tone="neutral", dot=true, children, active, onClick, className=""}){
  const cls=["chip",tone,active&&"active",onClick&&"clickable",className].filter(Boolean).join(" ");
  return <span className={cls} onClick={onClick}>{dot && <span className="dt"/>}{children}</span>;
}

/* -------- Status helpers -------- */
const statusForScore = (v, kind="pct") => {
  // v in [0,1]
  if(v>=0.90) return {tone:"green",   label:"Excellent"};
  if(v>=0.80) return {tone:"blue",    label:"Good"};
  if(v>=0.70) return {tone:"orange",  label:"Attention"};
  return             {tone:"red",     label:"At risk"};
};
const statusForIR = (v) => { // 80% rule
  if(v>=0.95) return {tone:"green",  label:"Parity"};
  if(v>=0.80) return {tone:"blue",   label:"Pass"};
  if(v>=0.70) return {tone:"orange", label:"Borderline"};
  return             {tone:"red",    label:"Fail"};
};
const statusForDiff = (v) => {
  if(v<=0.003) return {tone:"green",  label:"Robust"};
  if(v<=0.007) return {tone:"blue",   label:"Stable"};
  if(v<=0.015) return {tone:"orange", label:"Sensitive"};
  return              {tone:"red",    label:"Unstable"};
};

/* -------- Resume-parser accuracy tiers (per the Resume Parser Overview) --------
 *   Contact details       Professional background         Tier
 *   >= 90%                 >= 85%                          Excellent
 *   >= 90%                 >= 70%                          Great
 *   >= 85%                 >= 65%                          Good
 *   <  85%                 <  65%                          Fair
 * Per-metric helpers for when we show only one number at a time.
 */
const statusForContact = (v) => {
  if(v>=0.90) return {tone:"green",  label:"Excellent"};
  if(v>=0.85) return {tone:"blue",   label:"Good"};
  return             {tone:"red",    label:"Fair"};
};
const statusForProf = (v) => {
  if(v>=0.85) return {tone:"green",  label:"Excellent"};
  if(v>=0.70) return {tone:"blue",   label:"Great"};
  if(v>=0.65) return {tone:"orange", label:"Good"};
  return             {tone:"red",    label:"Fair"};
};
const tierForPair = (contact, prof) => {
  if(contact>=0.90 && prof>=0.85) return {tone:"green",  label:"Excellent"};
  if(contact>=0.90 && prof>=0.70) return {tone:"blue",   label:"Great"};
  if(contact>=0.85 && prof>=0.65) return {tone:"blue",   label:"Good"};
  return                                {tone:"red",    label:"Fair"};
};

/* -------- Format helpers -------- */
const fmtPct = (v, d=1) => (v*100).toFixed(d) + "%";
const fmtInt = (v) => v.toLocaleString("en-US");
const fmtNum = (v, d=2) => Number(v).toFixed(d);
const fmtDelta = (v, d=1) => (v>=0?"+":"") + (v*100).toFixed(d) + "pp";
const fmtDateShort = (ts) => ts.toLocaleDateString("en-US",{month:"short",day:"numeric"});

/* -------- Delta badge -------- */
function Delta({v, inverse=false, suffix="pp"}){
  const good = inverse ? v<0 : v>=0;
  const cls = Math.abs(v)<0.0005 ? "flat" : good ? "up" : "down";
  const icon = Math.abs(v)<0.0005 ? "remove" : good ? "arrow_upward" : "arrow_downward";
  return <span className={"delta "+cls}><Icon name={icon}/>{(v>=0?"+":"")+(v*100).toFixed(1)+suffix}</span>;
}

/* -------- Segmented (radio group in pill) -------- */
function Segmented({value, onChange, options}){
  return (
    <div className="segmented" role="radiogroup">
      {options.map(o=>(
        <button key={o.value} className={value===o.value?"active":""} onClick={()=>onChange(o.value)} role="radio" aria-checked={value===o.value}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------- Multi-select chip -------- */
function MultiSelect({label, value, onChange, options}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const h=(e)=>{ if(!ref.current||!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const toggle=(v)=> onChange(value.includes(v) ? value.filter(x=>x!==v) : [...value,v]);
  return (
    <div className="filter" ref={ref} style={{position:"relative"}}>
      {label && <span className="lbl">{label}</span>}
      <div className={"multi "+(open?"open":"")} onClick={()=>setOpen(o=>!o)}>
        {value.length===0 && <span className="placeholder">All</span>}
        {value.map(v=>(
          <span className="tag" key={v}>{v}<span className="x" onClick={(e)=>{e.stopPropagation(); onChange(value.filter(x=>x!==v));}}><Icon name="close" size={12}/></span></span>
        ))}
        <button className="add">+</button>
      </div>
      {open && (
        <div className="multi-popover" style={{top:"calc(100% + 4px)",left:0}}>
          {options.map(o=>(
            <div key={o} className={"opt "+(value.includes(o)?"on":"")} onClick={()=>toggle(o)}>
              <Icon name="check" size={14}/>
              <span>{o}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------- Donut meter -------- */
function Donut({value, label, tone="blue", size=84}){
  const r=size/2-6, c=2*Math.PI*r, off=c*(1-value);
  const color = {
    blue:"var(--primary-60)", green:"var(--green-60)", orange:"var(--orange-60)", red:"var(--red-60)", violet:"var(--blueviolet-60)"
  }[tone]||"var(--primary-60)";
  return (
    <div className="donut" style={{width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--grey-15)" strokeWidth="8"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
      </svg>
      <div className="n">{(value*100).toFixed(0)}<span className="u">%</span></div>
    </div>
  );
}

/* -------- Page head -------- */
function PageHead({title, desc, right}){
  return (
    <div className="page-head">
      <div>
        <h1 className="ti">{title}</h1>
        {desc && <div className="desc">{desc}</div>}
      </div>
      {right && <div className="actions">{right}</div>}
    </div>
  );
}

/* -------- Dotted value (colored dot + number) -------- */
function DotValue({v, kind="pct", d=1, invert=false}){
  // invert=true means lower is better (perturbation diff)
  let tone;
  if(kind==="ir") tone = v>=0.95?"green":v>=0.80?"blue":v>=0.70?"orange":"red";
  else if(invert) tone = v<=0.003?"green":v<=0.007?"blue":v<=0.015?"orange":"red";
  else tone = v>=0.90?"green":v>=0.80?"blue":v>=0.70?"orange":"red";
  const text = kind==="pct"?fmtPct(v,d):kind==="ir"?v.toFixed(2):v.toFixed(4);
  return <span className={"dotv "+tone}><span className="dt"/>{text}</span>;
}

/* -------- Stacked health strip (distribution of statuses) -------- */
function HealthStrip({green, blue, orange, red}){
  const total = green+blue+orange+red || 1;
  return (
    <div className="hstrip">
      <span className="seg" style={{width:(green/total*100)+"%",background:"var(--green-60)"}}/>
      <span className="seg" style={{width:(blue/total*100)+"%",background:"var(--primary-60)"}}/>
      <span className="seg" style={{width:(orange/total*100)+"%",background:"var(--orange-60)"}}/>
      <span className="seg" style={{width:(red/total*100)+"%",background:"var(--red-60)"}}/>
    </div>
  );
}

/* -------- Inline info tooltip / popover -------- */
function InfoTip({title, body, width=420}){
  const [open,setOpen]=useState(false);
  const [pos,setPos]=useState({top:0,left:0,arrowLeft:14});
  const btnRef=useRef(null);
  const popRef=useRef(null);
  useEffect(()=>{
    if(!open) return;
    const compute=()=>{
      if(!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const margin = 12;
      let left = r.left;
      // keep popover within viewport
      if(left + width + margin > vw) left = vw - width - margin;
      if(left < margin) left = margin;
      const arrowLeft = Math.max(8, Math.min(width-20, r.left + r.width/2 - left - 5));
      setPos({top:r.bottom + 8, left, arrowLeft});
    };
    compute();
    const onDoc=(e)=>{
      if(btnRef.current && btnRef.current.contains(e.target)) return;
      if(popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onKey=(e)=>{ if(e.key==="Escape") setOpen(false); };
    const onScroll=()=>setOpen(false);
    document.addEventListener("mousedown",onDoc);
    document.addEventListener("keydown",onKey);
    window.addEventListener("scroll",onScroll,true);
    window.addEventListener("resize",compute);
    return ()=>{
      document.removeEventListener("mousedown",onDoc);
      document.removeEventListener("keydown",onKey);
      window.removeEventListener("scroll",onScroll,true);
      window.removeEventListener("resize",compute);
    };
  },[open,width]);
  return (
    <span className="info-tip">
      <button
        ref={btnRef}
        type="button"
        className={"info-tip-btn "+(open?"on":"")}
        onClick={(e)=>{e.stopPropagation();setOpen(o=>!o);}}
        aria-label={"About: "+title}
      >
        <Icon name="info" size={14}/>
      </button>
      {open && (
        <div
          ref={popRef}
          className="info-tip-pop"
          role="dialog"
          style={{position:"fixed",top:pos.top,left:pos.left,width,"--arrow-left":pos.arrowLeft+"px"}}
        >
          <div className="info-tip-pop-head">
            <span className="info-tip-pop-title">{title}</span>
            <button type="button" className="info-tip-close" onClick={()=>setOpen(false)} aria-label="Close"><Icon name="close" size={14}/></button>
          </div>
          <div className="info-tip-pop-body">{body}</div>
        </div>
      )}
    </span>
  );
}

Object.assign(window, {
  Icon, Chip, Segmented, MultiSelect, Donut, PageHead, DotValue, HealthStrip, Delta,
  InfoTip,
  statusForScore, statusForIR, statusForDiff,
  statusForContact, statusForProf, tierForPair,
  fmtPct, fmtInt, fmtNum, fmtDelta, fmtDateShort
});
