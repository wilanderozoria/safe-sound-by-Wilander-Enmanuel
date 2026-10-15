const fs = require('fs');
const path = 'src/app.js';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/const supabaseClient = new SocketClient();/g, 'const supabaseClient = new SupabaseClient();');
c = c.replace(/await socketClient.connect();/g, 'await supabaseClient.connect();');
c = c.replace(/socketClient.requestInitialState(state => { monitorDashboard.setInitialState(state); });/g, 'const state = await supabaseClient.getInitialState(); monitorDashboard.setInitialState(state);');
c = c.replace(/socketClient.onMonitorUpdate(data => { monitorDashboard.updateRoom(data.data); });/g, 'supabaseClient.subscribeToLevels(data => { monitorDashboard.updateRoom(data); });');
fs.writeFileSync(path, c);
