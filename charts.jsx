/* Chart primitives — SVG-based, Octuple-colored */
const {useMemo:useM, useState:useS, useRef:useR, useEffect:useE} = React;

const C = {
  blue:"var(--primary-60)",
  blueDark:"var(--primary-80)",
  bgreen:"var(--bluegreen-60)",
  violet:"var(--blueviolet-60)",
  green:"var(--green-60)",
  orange:"var(--orange-60)",
  red:"var(--red-60)",
  grey30:"var(--grey-30)",
  grey20:"var(--grey-20)",
  grey15:"var(--grey-15)",
  grey60:"var(--grey-60)",
  grey80:"var(--grey-80)",
};

/* LineChart: multiple series, value domain [0,1] by default */
function LineChart({series, height=220, ymin=0, ymax=1, xLabels, yTicks=5, yFmt=v=>(v*100).toFixed(0)+"%", showGrid=true, strokeW=2.5}){
  const width=1000, padL=44, padR=16, padT=12, padB=28;
  const iw=width-padL-padR, ih=height-padT-padB;
  const n = series[0]?.values.length || 0;
  const xPos = i => padL + (n>1 ? (i/(n-1))*iw : iw/2);
  const yPos = v => padT + (1-((v-ymin)/(ymax-ymin)))*ih;
  const ticks = Array.from({length:yTicks+1},(_,i)=>ymin+(ymax-ymin)*i/yTicks);
  const labelStep = Math.ceil(n/8);
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {showGrid && ticks.map((t,i)=>(
          <g key={i}>
            <line x1={padL} x2={width-padR} y1={yPos(t)} y2={yPos(t)} stroke={C.grey15}/>
            <text x={padL-8} y={yPos(t)+4} fontSize="11" fill={C.grey60} textAnchor="end">{yFmt(t)}</text>
          </g>
        ))}
        {xLabels && xLabels.map((lbl,i)=>(
          i%labelStep===0 ? <text key={i} x={xPos(i)} y={height-8} fontSize="11" fill={C.grey60} textAnchor="middle">{lbl}</text> : null
        ))}
        {series.map((s,si)=>{
          const path = s.values.map((v,i)=>`${i===0?"M":"L"} ${xPos(i)} ${yPos(v)}`).join(" ");
          return (
            <g key={si}>
              {s.fill && (
                <path d={`${path} L ${xPos(n-1)} ${padT+ih} L ${xPos(0)} ${padT+ih} Z`} fill={s.fill} opacity="0.14"/>
              )}
              <path d={path} fill="none" stroke={s.color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round"/>
              {s.dots && s.values.map((v,i)=>(
                <circle key={i} cx={xPos(i)} cy={yPos(v)} r="3" fill="#fff" stroke={s.color} strokeWidth="2"/>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* Horizontal bar chart (for Impact Ratio, perturbation) */
function HBars({rows, max=1, fmt=v=>(v*100).toFixed(1)+"%", threshold, thresholdLabel, tone="auto", strokeColor, height, barHeight=28}){
  const width=920, padL=140, padR=80, padT=14, padB=threshold?40:14;
  const h = (height || padT+padB+rows.length*(barHeight+10));
  const iw=width-padL-padR;
  const xPos = v => padL + (v/max)*iw;
  const toneFor = (v, row) => {
    if(row.tone) return row.tone;
    if(tone==="ir"){ return v>=0.95?C.green:v>=0.80?C.blue:v>=0.70?C.orange:C.red; }
    if(tone==="diff"){ return v<=0.003?C.green:v<=0.007?C.blue:v<=0.015?C.orange:C.red; }
    return C.violet;
  };
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="xMidYMid meet">
        {threshold && (
          <g>
            <line x1={xPos(threshold)} x2={xPos(threshold)} y1={padT-4} y2={h-padB+4} stroke={C.grey60} strokeDasharray="4 4"/>
            <text x={xPos(threshold)} y={h-padB+20} fontSize="11" fill={C.grey60} textAnchor="middle">{thresholdLabel||fmt(threshold)}</text>
          </g>
        )}
        {rows.map((r,i)=>{
          const y = padT + i*(barHeight+10);
          const bw = xPos(r.v)-padL;
          const c = toneFor(r.v, r);
          return (
            <g key={i}>
              <text x={padL-12} y={y+barHeight/2+4} fontSize="12" fill={C.grey80} textAnchor="end" fontWeight="600">{r.label}</text>
              <rect x={padL} y={y} width={iw} height={barHeight} rx="4" fill={C.grey15}/>
              <rect x={padL} y={y} width={Math.max(2,bw)} height={barHeight} rx="4" fill={c}/>
              <text x={padL+bw+8} y={y+barHeight/2+4} fontSize="12" fill={C.grey80} fontWeight="700">{fmt(r.v)}</text>
              {r.sub && <text x={padL-12} y={y+barHeight/2+18} fontSize="10" fill={C.grey60} textAnchor="end">{r.sub}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* Histogram / distribution */
function Histogram({bins, height=200, color=C.blueDark, gradient=true}){
  const width=1000, padL=44, padR=16, padT=16, padB=28;
  const iw=width-padL-padR, ih=height-padT-padB;
  const maxY = Math.max(...bins.map(b=>b.y));
  const xPos = i => padL + (i/(bins.length-1))*iw;
  const yPos = v => padT + (1-v/maxY)*ih;
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="histgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.blueDark} stopOpacity="0.95"/>
            <stop offset="100%" stopColor={C.bgreen} stopOpacity="0.6"/>
          </linearGradient>
        </defs>
        {/* X axis labels 0, 1, 2, 3, 4, 5 */}
        {[0,1,2,3,4,5].map((x,i)=>(
          <text key={i} x={padL + (x/5)*iw} y={height-8} fontSize="11" fill={C.grey60} textAnchor="middle">{x}</text>
        ))}
        {bins.map((b,i)=>{
          const next = bins[i+1] || b;
          const w = xPos(i+1)-xPos(i)-2;
          return <rect key={i} x={xPos(i)} y={yPos(b.y)} width={Math.max(1,w)} height={padT+ih-yPos(b.y)} fill={gradient?"url(#histgrad)":color} rx="1"/>;
        })}
        <line x1={padL} x2={width-padR} y1={padT+ih} y2={padT+ih} stroke={C.grey30}/>
      </svg>
    </div>
  );
}

/* Stacked column chart for source diversity */
function StackedBars({rows, height=200, colors}){
  const width=1000, padL=44, padR=16, padT=16, padB=42;
  const iw=width-padL-padR, ih=height-padT-padB;
  const bw = iw / rows.length - 30;
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {[0,25,50,75,100].map((t,i)=>(
          <g key={i}>
            <line x1={padL} x2={width-padR} y1={padT+(1-t/100)*ih} y2={padT+(1-t/100)*ih} stroke={C.grey15}/>
            <text x={padL-8} y={padT+(1-t/100)*ih+4} fontSize="11" fill={C.grey60} textAnchor="end">{t}%</text>
          </g>
        ))}
        {rows.map((r,i)=>{
          const x = padL + i*(iw/rows.length) + (iw/rows.length-bw)/2;
          const h = (r.pct/100)*ih;
          const y = padT+ih-h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={h} fill={colors[i%colors.length]} rx="4"/>
              <text x={x+bw/2} y={padT+ih+18} fontSize="11" fill={C.grey80} textAnchor="middle" fontWeight="600">{r.src}</text>
              <text x={x+bw/2} y={padT+ih+32} fontSize="10" fill={C.grey60} textAnchor="middle">{r.hires} hires</text>
              <text x={x+bw/2} y={y-6} fontSize="11" fill={C.grey80} textAnchor="middle" fontWeight="700">{r.pct}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* Mini sparkline for KPI cards */
function Sparkline({values, color=C.violet, width=120, height=36, fill=true}){
  if(!values || values.length<2) return null;
  const min=Math.min(...values), max=Math.max(...values), span=max-min||1;
  const xPos = i => (i/(values.length-1))*width;
  const yPos = v => 4 + (1-(v-min)/span) * (height-8);
  const path = values.map((v,i)=>`${i===0?"M":"L"} ${xPos(i)} ${yPos(v)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:"block"}}>
      {fill && <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={color} opacity="0.12"/>}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

Object.assign(window, {LineChart, HBars, Histogram, StackedBars, Sparkline, ChartColors:C});
