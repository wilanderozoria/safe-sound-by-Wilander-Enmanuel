import { classify, formatDuration } from '../utils/measurement.js';

export class MonitorSession {
  constructor(config) { this.config = config; this.reset(); }
  reset() { this.active=false; this.startedAt=null; this.samples=[]; this.events=[]; this.aboveMs=0; this.overStartedAt=null; this.lastState='normal'; this.lastEventAt=0; }
  start(now=Date.now()) { this.reset(); this.active=true; this.startedAt=now; }
  stop(now=Date.now()) { if (!this.active) return this.summary(now); this.update(now, this.samples.at(-1)?.level); this.active=false; if(this.overStartedAt!==null) this.closeEvent(now); return this.summary(now); }
  update(now, level) {
    if (!this.active || !Number.isFinite(level)) return;
    const state=classify(level,this.config.warning,this.config.threshold);
    const previous=this.samples.at(-1);
    const delta=previous ? Math.max(0, now-previous.timestamp) : 0;
    if(state==='excessive') this.aboveMs += delta;
    if(state==='excessive' && this.overStartedAt===null) this.overStartedAt=now;
    if(state!=='excessive' && this.overStartedAt!==null) this.closeEvent(now);
    this.lastState=state; this.samples.push({timestamp:now,level,state,microphone:this.config.microphone||'default'});
    const cutoff=now-this.config.maxHistoryMs; this.samples=this.samples.filter(s=>s.timestamp>=cutoff);
  }
  closeEvent(now) {
    if (this.overStartedAt===null) return;
    const duration=now-this.overStartedAt;
    if(duration>=this.config.minExcessMs) this.events.push({timestamp:this.overStartedAt,level:this.maxLevelSince(this.overStartedAt),duration});
    this.overStartedAt=null;
  }
  maxLevelSince(ts) { return Math.max(...this.samples.filter(s=>s.timestamp>=ts).map(s=>s.level),0); }
  summary(now=Date.now()) { const values=this.samples.map(s=>s.level); return {duration:this.startedAt!==null?now-this.startedAt:0,average:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,maximum:values.length?Math.max(...values):null,aboveMs:this.aboveMs,events:this.events.length}; }
}
export { formatDuration };
