import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSolar, calculateBattery, reportCsv } from '../js/estimator.js';

test('produces a finite, realistic preliminary estimate from defaults', () => {
  const r = calculateSolar();
  assert.ok(r.panels > 0);
  assert.ok(r.systemKw > 0);
  assert.ok(Number.isFinite(r.annualProductionKwh));
  assert.ok(r.grossCost > 0);
  assert.equal(r.cashflow.length, 25);
  assert.equal(r.cashflow[24].cumulative, r.savings25Years);
});

test('roof limits cap number of panels', () => {
  const r = calculateSolar({ roofArea: 48, bill: 400 });
  assert.equal(r.panels, 2);
  assert.equal(r.roofLimited, true);
});

test('no available roof gives no savings or cost', () => {
  const r = calculateSolar({ roofArea: 0 });
  assert.equal(r.panels, 0);
  assert.equal(r.grossCost, 0);
  assert.equal(r.firstYearNetSavings, 0);
  assert.equal(r.paybackYears, null);
});

test('zero bill creates no proposed system', () => {
  const r = calculateSolar({ bill: 0 });
  assert.equal(r.panels, 0);
});

test('lower sunlight cannot increase annual output per kW', () => {
  const sunny = calculateSolar({ sunHours: 6, roofArea: 24 });
  const cloudy = calculateSolar({ sunHours: 3, roofArea: 24 });
  assert.ok(sunny.annualProductionKwh > cloudy.annualProductionKwh);
});

test('invalid electricity rate rejects instead of dividing by zero', () => {
  assert.throws(() => calculateSolar({ electricityRate: 0 }), RangeError);
});

test('battery uses usable capacity and constant load', () => {
  const r = calculateBattery({ capacityKwh: 10, loadWatts: 1000, usablePercent: 80 });
  assert.equal(r.hours, 8);
});

test('CSV exports key report fields and caveat', () => {
  const csv = reportCsv(calculateSolar());
  assert.match(csv, /System capacity/);
  assert.match(csv, /No federal tax credit included/);
});
