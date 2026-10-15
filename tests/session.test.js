import test from 'node:test'; import assert from 'node:assert/strict'; import { MonitorSession } from '../src/monitoring/session.js';
function make(){return new MonitorSession({threshold:70,warning:60,minExcessMs:3000,maxHistoryMs:30000,microphone:'test'})}
test('records samples and session summary',()=>{const s=make();s.start(0);s.update(1000,50);s.update(2000,55);s.update(3000,65);const out=s.stop(4000);assert.equal(out.duration,4000);assert.ok(out.average>50);assert.equal(out.maximum,65)});
test('debounces excessive event',()=>{const s=make();s.start(0);s.update(0,80);s.update(1000,82);s.update(2000,85);s.update(2500,81);s.update(3500,50);assert.equal(s.events.length,1);assert.ok(s.events[0].duration>=3000)});
test('short spike is not an event',()=>{const s=make();s.start(0);s.update(0,80);s.update(1000,50);assert.equal(s.events.length,0)});
