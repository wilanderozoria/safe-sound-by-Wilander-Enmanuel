import { SocketClient } from '../networking/socket-client.js';

export class MonitorDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.rooms = new Map(); // roomId -> { aggregatedLevel, mics: { micId -> level } }
  }

  updateRoom(data) {
    const { roomId, micId, level, timestamp } = data;

    if (!this.rooms.has(roomId)) {
      this.createRoomCard(roomId);
    }

    const room = this.rooms.get(roomId);
    room.mics[micId] = level;

    // Calculate aggregated level (Average)
    const micLevels = Object.values(room.mics);
    const avgLevel = micLevels.reduce((a, b) => a + b, 0) / micLevels.length;
    room.aggregatedLevel = avgLevel;

    this.renderRoomCard(roomId);
  }

  createRoomCard(roomId) {
    const card = document.createElement('div');
    card.id = `room-card-${roomId}`;
    card.className = 'room-card';
    card.innerHTML = `
      <div class="room-header">
        <span class="room-name">${roomId}</span>
        <span class="room-level" id="room-level-${roomId}">-- dB</span>
      </div>
      <div class="room-meter-bg">
        <div class="room-meter-fill" id="room-meter-${roomId}"></div>
      </div>
      <button class="room-detail-btn" onclick="window.toggleRoomDetails('${roomId}')">Ver Micros</button>
      <div class="room-details" id="room-details-${roomId}" style="display: none;">
        <div class="mic-list" id="mic-list-${roomId}"></div>
      </div>
    `;
    this.container.appendChild(card);
    this.rooms.set(roomId, { aggregatedLevel: NaN, mics: {} });
  }

  renderRoomCard(roomId) {
    const room = this.rooms.get(roomId);
    const levelElem = document.getElementById(`room-level-${roomId}`);
    const meterElem = document.getElementById(`room-meter-${roomId}`);
    const detailsElem = document.getElementById(`room-details-${roomId}`);
    const micListElem = document.getElementById(`mic-list-${roomId}`);

    if (!levelElem || !meterElem) return;

    const level = room.aggregatedLevel;
    levelElem.textContent = `${Math.round(level)} dB`;
    meterElem.style.width = `${Math.min(100, level)}%`;

    // Update individual mics if details are open
    if (detailsElem && detailsElem.style.display !== 'none') {
      micListElem.innerHTML = Object.entries(room.mics).map(([micId, val]) => `
        <div class="mic-item">
          <span>${micId}</span>
          <span class="mic-val">${Math.round(val)} dB</span>
        </div>
      `).join('');
    }
  }

  setInitialState(state) {
    // state: { roomId: { micId: { level, timestamp } } }
    for (const [roomId, mics] of Object.entries(state)) {
      this.createRoomCard(roomId);
      const room = this.rooms.get(roomId);
      for (const [micId, data] of Object.entries(mics)) {
        room.mics[micId] = data.level;
      }
      const micLevels = Object.values(room.mics);
      room.aggregatedLevel = micLevels.reduce((a, b) => a + b, 0) / micLevels.length;
      this.renderRoomCard(roomId);
    }
  }
}
