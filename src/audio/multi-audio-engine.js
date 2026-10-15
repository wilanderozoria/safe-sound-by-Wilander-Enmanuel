import { rmsToRelativeDb } from '../utils/measurement.js';

/**
 * MultiAudioEngine manages multiple concurrent AudioEngine instances.
 * It allows a single classroom (Client) to monitor multiple microphones.
 */
export class MultiAudioEngine extends EventTarget {
  constructor() {
    super();
    this.engines = new Map(); // micId -> AudioEngine instance
  }

  async listDevices() {
    // Delegate to one of the internal engines for the list
    const dummyEngine = new AudioEngine();
    try {
      return await dummyEngine.listDevices();
    } finally {
      await dummyEngine.stop();
    }
  }

  async addMicrophone(micId, deviceId = '', calibration = 0) {
    if (this.engines.has(micId)) {
      throw new Error(`Microphone with ID ${micId} is already active.`);
    }

    const engine = new AudioEngine();

    // We wrap the 'level' event from the internal AudioEngine
    // to include the micId so the listener knows which mic is reporting
    engine.addEventListener('level', (e) => {
      this.dispatchEvent(new CustomEvent('level', {
        detail: {
          micId,
          level: e.detail.level,
          timestamp: e.detail.timestamp
        }
      }));
    });

    engine.addEventListener('error', (e) => {
      this.dispatchEvent(new CustomEvent('error', {
        detail: { micId, message: e.detail.message || e.detail }
      }));
    });

    await engine.start(deviceId, calibration);
    this.engines.set(micId, engine);
    return true;
  }

  async removeMicrophone(micId) {
    const engine = this.engines.get(micId);
    if (engine) {
      await engine.stop();
      this.engines.delete(micId);
    }
  }

  async stopAll() {
    const promises = Array.from(this.engines.values()).map(engine => engine.stop());
    await Promise.all(promises);
    this.engines.clear();
  }

  /**
   * Calculates the aggregated level (average) of all active microphones.
   */
  getAggregatedLevel() {
    const activeEngines = Array.from(this.engines.values());
    if (activeEngines.length === 0) return NaN;

    const sum = activeEngines.reduce((acc, engine) => acc + (engine.lastLevel || 0), 0);
    return sum / activeEngines.length;
  }
}

// Keep the original AudioEngine for single-mic usage to avoid breaking existing code
import { AudioEngine } from './audio-engine.js';
// Wait, I can't import from myself if I'm editing audio-engine.js.
// I will separate this into a new file as planned.
