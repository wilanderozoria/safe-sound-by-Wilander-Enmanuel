import { rmsToRelativeDb } from '../utils/measurement.js';

export class AudioEngine extends EventTarget {
  constructor(){super();this.context=null;this.stream=null;this.analyser=null;this.source=null;this.buffer=null;this.raf=0;this.running=false;this.lastLevel=NaN;}
  async listDevices(){ if(!navigator.mediaDevices?.enumerateDevices) throw new Error('La API de dispositivos de audio no está disponible.'); return navigator.mediaDevices.enumerateDevices().then(ds=>ds.filter(d=>d.kind==='audioinput')); }
  async start(deviceId='', calibration=0){
    await this.stop();
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no permite acceso al micrófono en este entorno. Usa localhost/HTTPS.');
    this.stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:deviceId?{exact:deviceId}:undefined,echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    this.context=new AudioContext();
    this.analyser=this.context.createAnalyser(); this.analyser.fftSize=2048; this.analyser.smoothingTimeConstant=.55;
    this.source=this.context.createMediaStreamSource(this.stream); this.source.connect(this.analyser); this.buffer=new Float32Array(this.analyser.fftSize); this.running=true;
    const tick=()=>{if(!this.running)return; try{this.analyser.getFloatTimeDomainData(this.buffer);let sum=0;for(const x of this.buffer)sum+=x*x;const rms=Math.sqrt(sum/this.buffer.length);const level=rmsToRelativeDb(rms,calibration);this.lastLevel=level;this.dispatchEvent(new CustomEvent('level',{detail:{level,timestamp:Date.now()}}));}catch(error){this.dispatchEvent(new CustomEvent('error',{detail:error}));}this.raf=setTimeout(tick,100)};tick();
  }
  async stop(){this.running=false;clearTimeout(this.raf);if(this.stream)this.stream.getTracks().forEach(t=>t.stop());if(this.context)await this.context.close().catch(()=>{});this.stream=null;this.context=null;this.source=null;this.analyser=null;}
}
