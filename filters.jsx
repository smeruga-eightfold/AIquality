/* Shared filter strip */
const {useState:useSf} = React;

const PERIOD_DAYS = {
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last quarter": 90,
  "Year to date": 120,
  "Custom range": null   // computed from customFrom/customTo
};

// Resolve a period label (+optional custom range) into a day count.
function periodDays(period, customFrom, customTo){
  if(period === "Custom range" && customFrom && customTo){
    const a = new Date(customFrom), b = new Date(customTo);
    const days = Math.max(1, Math.round((b - a) / 86400000) + 1);
    return days;
  }
  return PERIOD_DAYS[period] || 30;
}

// Default custom window = last 14 days
function defaultCustomRange(){
  const to = new Date();
  const from = new Date(to.getTime() - 13*86400000);
  const iso = (d)=>d.toISOString().slice(0,10);
  return { from: iso(from), to: iso(to) };
}

function FiltersBar({
  period, onPeriod,
  customFrom, customTo, onCustomRange,
  orgs, orgOptions, onOrgs,
  stages, stageOptions, onStages,
  extra,
  onReset
}){
  const showCustom = period === "Custom range";
  const defaults = defaultCustomRange();
  const from = customFrom || defaults.from;
  const to   = customTo   || defaults.to;

  const handlePeriod = (p) => {
    if(p === "Custom range" && (!customFrom || !customTo) && onCustomRange){
      onCustomRange(defaults.from, defaults.to);
    }
    onPeriod(p);
  };
  const handleFrom = (e) => {
    const v = e.target.value;
    if(onCustomRange) onCustomRange(v, (to < v ? v : to));
  };
  const handleTo = (e) => {
    const v = e.target.value;
    if(onCustomRange) onCustomRange((from > v ? v : from), v);
  };

  return (
    <div className="filters">
      <div className="filter">
        <span className="lbl">Time period</span>
        <select className="select" value={period} onChange={e=>handlePeriod(e.target.value)}>
          {Object.keys(PERIOD_DAYS).map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      {showCustom && (
        <div className="filter filter-daterange">
          <span className="lbl">From</span>
          <input
            type="date"
            className="select date-input"
            value={from}
            max={to}
            onChange={handleFrom}
          />
          <span className="lbl" style={{marginLeft:4}}>to</span>
          <input
            type="date"
            className="select date-input"
            value={to}
            min={from}
            max={defaults.to}
            onChange={handleTo}
          />
        </div>
      )}
      {orgOptions && <MultiSelect label="Business unit" value={orgs} onChange={onOrgs} options={orgOptions}/>}
      {stageOptions && <MultiSelect label="Hiring stage" value={stages} onChange={onStages} options={stageOptions}/>}
      {extra}
      <div className="actions">
        <button className="btn btn-secondary btn-sm" onClick={onReset}><Icon name="refresh" size={14}/>Reset</button>
        <button className="btn btn-secondary btn-sm"><Icon name="file_download" size={14}/>Export</button>
      </div>
    </div>
  );
}

window.FiltersBar = FiltersBar;
window.PERIOD_DAYS = PERIOD_DAYS;
window.periodDays = periodDays;
