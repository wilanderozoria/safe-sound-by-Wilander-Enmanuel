import { AudioEngine } from './audio/audio-engine.js';
import { MultiAudioEngine } from './audio/multi-audio-engine.js';
import { Simulator } from './audio/simulator.js';
import { MonitorSession, formatDuration } from './monitoring/session.js';
import { loadSettings, saveSettings } from './storage/settings.js';
import { classify, smooth } from './utils/measurement.js';
import { SoundChart } from './ui/chart.js';
import { SupabaseClient } from './networking/supabase-client.js';
import { MonitorDashboard } from './ui/monitor-dashboard.js';

const $=id=>document.getElementById(id); const settings=loadSettings();
const audio=new AudioEngine(), simulator=new Simulator();
const session=new MonitorSession({microphone:settings.microphone,threshold:settings.threshold,warning:settings.warning,minExcessMs:settings.minExcessSeconds*1000,maxHistoryMs:settings.historyWindow*1000});
const chart=new SoundChart($('soundChart')); chart.setWindow(settings.historyWindow);
let simulation=false,lastUi=0,lastLevel=NaN,raf=0;

// --- Multi-Aula State ---
let currentMode = 'local';
const supabaseClient = new SupabaseClient();
const multiAudio = new MultiAudioEngine();
const monitorDashboard = new MonitorDashboard('monitorGrid');

function syncSession(){Object.assign(session.config,{microphone:settings.microphone,threshold:settings.threshold,warning:settings.warning,minExcessMs:settings.minExcessSeconds*1000,maxHistoryMs:settings.historyWindow*1000})}
function setStatus(text,bad=false){$('systemStatus').textContent=text;$('systemStatus').className='system-status '+(bad?'bad':'good')}

function render(level){if(!Number.isFinite(level))return;const now=Date.now();lastLevel=smooth(lastLevel,level,.22);const state=classify(lastLevel,settings.warning,settings.threshold);$('levelValue').textContent=Math.round(lastLevel);$('levelLabel').textContent=state==='normal'?'Nivel adecuado':state==='warning'?'Cerca del límite':'Nivel excesivo';$('meterFill').style.width=Math.min(100,lastLevel)+'%';$('warningMarker').style.left=Math.min(100,settings.warning)+'%';const card=$('statusCard');card.className='status-card panel '+state;$('stateIcon').textContent=state==='normal'?'●':state==='warning'?'▲':'■';$('stateText').textContent=state==='normal'?'NORMAL':state==='warning'?'ADVERTENCIA':'EXCESIVO';$('stateDescription').textContent=state==='normal'?'El nivel está dentro del rango configurado.':state==='warning'?'El ruido se acerca al límite configurado.':'El ruido supera el límite configurado.';if(session.active)session.update(now,lastLevel);updateStats(now);chart.setPoints(session.samples);$('chartEmpty').style.display=session.samples.length?'none':'grid';}

function updateStats(now=Date.now()){const s=session.summary(now);$('duration').textContent=formatDuration(s.duration);$('average').textContent=s.average==null?'—':`${Math.round(s.average)} dB`;$('maximum').textContent=s.maximum==null?'—':`${Math.round(s.maximum)} dB`;$('aboveTime').textContent=formatDuration(s.aboveMs).slice(3);$('eventCount').textContent=s.events.length;renderEvents()}
function renderEvents(){const list=$('eventsList');if(!session.events.length){list.innerHTML='<div class="empty">No hay eventos registrados.</div>';return}list.innerHTML=session.events.slice().reverse().map(e=>`<div class="event"><strong>${new Date(e.timestamp).toLocaleTimeString()}</strong><span>${Math.round(e.level)} dB</span><span>${(e.duration/1000).toFixed(1)} s</span></div>`).join('')}

async function devices(){try{const ds=await audio.listDevices();$('microphoneSelect').innerHTML=ds.length?ds.map((d,i)=>`<option value="${d.deviceId}">${d.label||`Micrófono ${i+1}`}</option>`).join(''):'<option value="">No se encontraron micrófonos</option>';if(settings.microphone&&ds.some(d=>d.deviceId===settings.microphone))$('microphoneSelect').value=settings.microphone;setStatus(ds.length?'Micrófonos disponibles':'Sin micrófono',!ds.length)}catch(e){$('microphoneSelect').innerHTML='<option value="">No disponible</option>';setStatus(e.message,true)}}

function bindSource(source){source.addEventListener('level',e=>{if(session.active)render(e.detail.level);else if(simulation)render(e.detail.level)})}
bindSource(audio);bindSource(simulator);

audio.addEventListener('error',e=>{setStatus('Error de audio: '+e.detail.message,true);stopMonitor()});

async function startMonitor(){syncSession();session.start();setStatus(simulation?'Simulación activa':'Solicitando micrófono…');try{if(simulation){simulator.start();}else{await audio.start(settings.microphone,settings.calibration)}$('monitorBtn').textContent='DETENER MONITOREO';setStatus(simulation?'Simulación activa':'Monitoreo activo');}catch(e){session.reset();setStatus(e.message,true);$('monitorBtn').textContent='INICIAR MONITOREO';}}

async function stopMonitor(){simulator.stop();await audio.stop();if(session.active)session.stop();$('monitorBtn').textContent='INICIAR MONITOREO';updateStats();setStatus('Sesión detenida')}

$('monitorBtn').onclick=()=>session.active?stopMonitor():startMonitor();
$('simulationToggle').onclick=async()=>{simulation=!simulation;$('simulationToggle').textContent=`Simulación: ${simulation?'ON':'OFF'}`;if(session.active){await stopMonitor();await startMonitor()}};
$('fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.().catch(()=>{});

$('historyWindow').value=String(settings.historyWindow);$('historyWindowConfig').value=String(settings.historyWindow);$('thresholdInput').value=settings.threshold;$('warningInput').value=settings.warning;$('durationInput').value=settings.minExcessSeconds;$('alertInput').checked=settings.alerts;
$('thresholdInput').oninput=e=>{settings.threshold=+e.target.value;$('thresholdOutput').textContent=settings.threshold;saveSettings(settings);syncSession()};$('warningInput').oninput=e=>{settings.warning=+e.target.value;$('warningOutput').textContent=settings.warning;saveSettings(settings);syncSession()};$('durationInput').oninput=e=>{settings.minExcessSeconds=+e.target.value;$('durationOutput').textContent=settings.minExcessSeconds;saveSettings(settings);syncSession()};
$('microphoneSelect').onchange=e=>{settings.microphone=e.target.value;saveSettings(settings);syncSession();if(session.active&&!simulation){stopMonitor().then(startMonitor)}};
$('historyWindow').onchange=e=>{settings.historyWindow=+e.target.value;$('historyWindowConfig').value=e.target.value;chart.setWindow(settings.historyWindow);saveSettings(settings);syncSession()};$('historyWindowConfig').onchange=e=>{$('historyWindow').value=e.target.value;$('historyWindow').dispatchEvent(new Event('change'))};$('alertInput').onchange=e=>{settings.alerts=e.target.checked;saveSettings(settings)};
$('clearHistoryBtn').onclick=()=>{session.samples=[];session.events=[];session.aboveMs=0;session.overStartedAt=null;updateStats();chart.setPoints([])};
['thresholdOutput','warningOutput','durationOutput'].forEach((id,i)=>$(id).textContent=[settings.threshold,settings.warning,settings.minExcessSeconds][i]);
setInterval(()=>{if(session.active)updateStats(Date.now())},1000);devices();setStatus('Sistema listo');

// --- Mode Management ---
async function switchMode(mode) {
  currentMode = mode;

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if () .style.display = mode === 'local' ? 'block' : 'none';
  if () .style.display = mode === 'client' ? 'block' : 'none';
  if () .style.display = mode === 'monitor' ? 'block' : 'none';
  if () .style.display = (mode === 'welcome' || !mode) ? 'flex' : 'none';

  if (mode === 'monitor') {
    await initMonitorMode();
  } else if (mode === 'client') {
    await initClientMode();
  } else {
    supabaseClient.unsubscribe();
    await multiAudio.stopAll();
  }
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.onclick = () => {
    const mode = btn.dataset.mode || btn.closest('.welcome-card')?.dataset.mode;
    if (mode) switchMode(mode);
  };
});
// --- Monitor Mode ---
async function initMonitorMode() {
  setStatus('Conectando al monitor...');
  try {
    await supabaseClient.connect();
    const state = await supabaseClient.getInitialState(); monitorDashboard.setInitialState(state);
    supabaseClient.subscribeToLevels(data => { monitorDashboard.updateRoom(data); });
    setStatus('Monitor activo');
  } catch (e) {
    setStatus('Error de conexión: ' + e.message, true);
  }
}

// --- Client Mode ---
async function initClientMode() {
  setStatus('Modo cliente activo');
    const savedRoomId = localStorage.getItem('safesound.lastRoomId');
  if (savedRoomId) { const el = document.getElementById('roomIdInput'); if (el) el.value = savedRoomId; }

  try {
    await supabaseClient.connect();
    const ds = await multiAudio.listDevices();
    $('addMicSelect').innerHTML = ds.map((d,i)=>`<option value="${d.deviceId}">${d.label||`Micrófono ${i+1}`}</option>`).join('');

    $('addMicBtn').onclick = async () => {
      const deviceId = $('addMicSelect').value;
      const micId = `Mic ${multiAudio.engines.size + 1}`;
      try {
        await multiAudio.addMicrophone(micId, deviceId);
        renderActiveMics();
      } catch (e) {
        setStatus(e.message, true);
      }
    };

    $('startClientBtn').onclick = async () => {
      const roomId = $('roomIdInput').value;
      if (!roomId) return setStatus('Ingresa un ID de aula', true);
      localStorage.setItem('safesound.lastRoomId', roomId);
      if (multiAudio.engines.size === 0) return setStatus('Agrega al menos un micrófono', true);
      setStatus('Transmitiendo...');
      multiAudio.addEventListener('level', async () => { const avgLevel = multiAudio.getAggregatedLevel(); await supabaseClient.sendLevel(roomId, avgLevel, 'active'); });
      $('startClientBtn').textContent = 'TRANSMITIENDO...';
      $('startClientBtn').disabled = true;
    };
  } catch (e) {
    setStatus('Error de conexión: ' + e.message, true);
  }
}

function renderActiveMics() {
  const list = $('activeMicsList');
  list.innerHTML = Array.from(multiAudio.engines.keys()).map(id => `
    <div class="mic-item">
      <span>${id}</span>
      <button class="button secondary" onclick="removeMic('${id}')">Quitar</button>
    </div>
  `).join('');
}

window.removeMic = async (id) => {
  await multiAudio.removeMicrophone(id);
  renderActiveMics();
};

window.toggleRoomDetails = (roomId) => {
  const details = document.getElementById(`room-details-${roomId}`);
  if (details) {
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  }
};




