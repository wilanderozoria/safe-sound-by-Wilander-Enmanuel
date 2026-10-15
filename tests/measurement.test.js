import test from 'node:test'; import assert from 'node:assert/strict'; import { classify, smooth, rmsToRelativeDb, formatDuration } from '../src/utils/measurement.js';
test('classifies levels using warning and threshold',()=>{assert.equal(classify(50,60,70),'normal');assert.equal(classify(65,60,70),'warning');assert.equal(classify(75,60,70),'excessive')});
test('smooths without changing valid endpoints unexpectedly',()=>{assert.equal(smooth(NaN,50),50);assert.equal(smooth(50,60,.2),52)});
test('RMS conversion is bounded and monotonic',()=>{assert.ok(rmsToRelativeDb(.5)<rmsToRelativeDb(1));assert.ok(rmsToRelativeDb(0)>=0);assert.ok(rmsToRelativeDb(100)<=120)});
test('formats duration',()=>assert.equal(formatDuration(3661000),'01:01:01'));
