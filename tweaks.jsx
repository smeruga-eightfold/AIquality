/* Tweaks panel: design-time controls */
const {useState:useSt, useEffect:useEt} = React;

const TWEAK_DEFS = /*EDITMODE-BEGIN*/{
  "density":"comfortable",
  "state":"healthy",
  "primaryColor":"violet",
  "moduleEmphasis":"overview"
}/*EDITMODE-END*/;

function Tweaks({values, onChange, visible}){
  return (
    <div className={"tweaks-panel " + (visible?"":"hidden")}>
      <div className="tweaks-head">
        <Icon name="tune"/>
        <h3>Tweaks</h3>
        <span className="sub">Design controls</span>
      </div>
      <div className="tweaks-body">
        <div className="tweak">
          <span className="lbl">Density</span>
          <div className="opts">
            {["compact","comfortable","spacious"].map(o=>(
              <button key={o} className={values.density===o?"on":""} onClick={()=>onChange({density:o})}>{o}</button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="lbl">Compliance state</span>
          <div className="opts">
            {[
              {v:"healthy",  l:"Healthy"},
              {v:"watch",    l:"Watch"},
              {v:"breach",   l:"Breach"}
            ].map(o=>(
              <button key={o.v} className={values.state===o.v?"on":""} onClick={()=>onChange({state:o.v})}>{o.l}</button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="lbl">Primary accent</span>
          <div className="opts">
            {[
              {v:"violet", l:"Blue-violet"},
              {v:"blue",   l:"Primary blue"},
              {v:"bgreen", l:"Blue-green"}
            ].map(o=>(
              <button key={o.v} className={values.primaryColor===o.v?"on":""} onClick={()=>onChange({primaryColor:o.v})}>{o.l}</button>
            ))}
          </div>
        </div>
        <div className="tweak">
          <span className="lbl">Jump to module</span>
          <div className="opts">
            {[
              {v:"overview",    l:"Overview"},
              {v:"resume",      l:"Resume"},
              {v:"interviewer", l:"Interviewer"},
              {v:"match",       l:"Match Score"},
              {v:"recs",        l:"Recs"}
            ].map(o=>(
              <button key={o.v} className={values.moduleEmphasis===o.v?"on":""} onClick={()=>onChange({moduleEmphasis:o.v})}>{o.l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Tweaks = Tweaks;
window.TWEAK_DEFS = TWEAK_DEFS;
