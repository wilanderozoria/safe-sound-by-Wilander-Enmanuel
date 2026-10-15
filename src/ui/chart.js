export class SoundChart {
  constructor(canvas){this.canvas=canvas;this.points=[];this.window=30;window.addEventListener('resize',()=>this.draw())}
  setWindow(sec){this.window=sec;this.draw()}
  setPoints(points){this.points=points;this.draw()}
  draw(){const c=this.canvas, r=c.getBoundingClientRect(), d=window.devicePixelRatio||1;c.width=Math.max(1,r.width*d);c.height=Math.max(1,r.height*d);const x=c.getContext('2d');x.scale(d,d);const w=r.width,h=r.height;x.clearRect(0,0,w,h);x.font='12px system-ui';x.fillStyle='#718096';for(let i=0;i<=4;i++){const y=20+(h-45)*i/4;const db=100-i*20;x.strokeStyle='#e7edf4';x.beginPath();x.moveTo(42,y);x.lineTo(w-12,y);x.stroke();x.fillText(`${db}`,8,y+4)}if(this.points.length<2)return;const end=this.points.at(-1).timestamp,start=end-this.window*1000,pts=this.points.filter(p=>p.timestamp>=start);if(pts.length<2)return;x.beginPath();pts.forEach((p,i)=>{const px=42+(p.timestamp-start)/(this.window*1000)*(w-54);const py=20+(100-Math.max(0,Math.min(100,p.level)))/100*(h-45);i?x.lineTo(px,py):x.moveTo(px,py)});x.strokeStyle='#172a46';x.lineWidth=2;x.stroke();}
}
