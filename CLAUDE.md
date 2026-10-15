# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview
SafeSound is a distributed acoustic monitoring system for classrooms. It allows classrooms (Clients) to capture noise levels via one or more microphones and stream them to a central dashboard (Monitor) via a Node.js relay server.

## Architecture
The system follows a Client-Server architecture:
- **Relay Server**: Node.js + Socket.io. Acts as a stateless pipe routing `level-update` events from clients to monitors.
- **Client (Classroom)**: Vanilla JS app. Uses `MultiAudioEngine` to manage multiple `AudioEngine` instances (Web Audio API). Streams processed dB levels to the server.
- **Monitor (Teacher)**: Vanilla JS app. Subscribes to the server and renders a grid of classroom cards with aggregated (average) and individual noise levels.
- **Processing Pipeline**: Audio $\rightarrow$ RMS $\rightarrow$ Relative dB $\rightarrow$ Smoothing (EMA) $\rightarrow$ Classification (Normal/Warning/Excessive).

## Project Structure
- `server/`: Node.js relay server.
- `src/audio/`: Audio capture logic (`AudioEngine` for single mic, `MultiAudioEngine` for multiple).
- `src/networking/`: Socket.io communication wrapper.
- `src/ui/`: UI components, including the `MonitorDashboard` and styles.
- `src/utils/`: Core measurement math (RMS to dB, smoothing).
- `src/monitoring/`: Session and statistics tracking.

## Development Commands
### Server
- Run server: `node server/index.js`

### Frontend/Tests
- Run local server (Python): `python -m http.server 4173`
- Run all tests: `npm test`

## Key Technical Constraints
- **Privacy**: No audio recording or storage. Only processed dB levels are streamed.
- **Stability**: Priority on "not breaking what already works". Use the `Simulator` for testing without physical microphones.
- **Accuracy**: Measurements are relative/estimated. Calibrated dB SPL is a future goal.
