import { SUPABASE_CONFIG } from '../config/supabase-config.js';

// Usamos la librería de Supabase vía ESM (CDN) para compatibilidad con GitHub Pages
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';

export class SupabaseClient {
  constructor() {
    this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }

  async connect() {
    // La conexión es implícita en el cliente de Supabase,
    // pero verificamos la configuración.
    if (!SUPABASE_CONFIG.url.includes('supabase.co')) {
      throw new Error('URL de Supabase no configurada correctamente.');
    }
    return true;
  }

  async sendLevel(roomId, level, status) {
    const { error } = await this.client
      .from('classroom_levels')
      .upsert({
        room_id: roomId,
        level: level,
        status: status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'room_id' });

    if (error) throw error;
  }

  async getInitialState() {
    const { data, error } = await this.client
      .from('classroom_levels')
      .select('*');

    if (error) throw error;

    // Transformar formato de tabla a formato esperado por MonitorDashboard:
    // { roomId: { micId: { level, timestamp } } }
    const state = {};
    data.forEach(row => {
      state[row.room_id] = {
        'main-mic': { level: row.level, timestamp: row.updated_at }
      };
    });
    return state;
  }

  subscribeToLevels(callback) {
    return this.client
      .channel('classroom-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'classroom_levels'
      }, payload => {
        const row = payload.new;
        callback({
          roomId: row.room_id,
          micId: 'main-mic',
          level: row.level,
          timestamp: row.updated_at
        });
      })
      .subscribe();
  }

  unsubscribe() {
    this.client.removeChannel('classroom-updates');
  }
}
