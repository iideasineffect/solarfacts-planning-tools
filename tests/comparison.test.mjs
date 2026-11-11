import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSystems, comparisonCsv } from '../js/comparison.js';
import { calculateSolar } from '../js/estimator.js';

test('both configurations use the existing solar engine with the same household inputs', () => {
  const opts = {
    household: { bill: 220, sunHours: 4.5, roofArea: 800 },
    systemA: { targetOffset: 70, installationCostPerWatt: 2.5 },
    systemB: { targetOffset: 90, installationCostPerWatt: 3.0 },
  };
  const result = compareSystems(opts);
  assert.deepEqual(result.a, calculateSolar({ ...opts.household, ...opts.systemA }));
  assert.deepEqual(result.b, calculateSolar({ ...opts.household, ...opts.systemB }));
  assert.equal(result.a.inputs.bill, result.b.inputs.bill);
  assert.equal(result.a.inputs.sunHours, result.b.inputs.sunHours);
});

test('comparison reports transparent signed differences for upfront cost and output', () => {
  const result = compareSystems({
    systemA: { targetOffset: 60, panelWatts: 400 },
    systemB: { targetOffset: 100, panelWatts: 450 },
  });
  assert.ok(result.b.annualProductionKwh > result.a.annualProductionKwh);
  assert.equal(result.difference.costUsd, result.b.grossCost - result.a.grossCost);
  assert.equal(result.difference.annualKwh, result.b.annualProductionKwh - result.a.annualProductionKwh);
  assert.equal(result.difference.annualSavingsUsd, result.b.firstYearNetSavings - result.a.firstYearNetSavings);
});

test('roof area is enforced consistently for both scenarios', () => {
  const { a, b } = compareSystems({ household: { roofArea: 48 }, systemA: { targetOffset: 50 }, systemB: { targetOffset: 100 } });
  assert.ok(a.panels <= 2);
  assert.ok(b.panels <= 2);
  assert.equal(b.roofLimited, true);
});

test('invalid input is rejected; caller-owned inputs are preserved', () => {
  const household = { bill: 185, roofArea: 550 };
  compareSystems({ household });
  assert.deepEqual(household, { bill: 185, roofArea: 550 });
  assert.throws(() => compareSystems({ household: { electricityRate: 0 } }), RangeError);
});

test('comparison CSV includes both systems and a limitations notice', () => {
  const csv = comparisonCsv(compareSystems());
  assert.match(csv, /"Metric","System A","System B"/);
  assert.match(csv, /Estimated first-year net savings/);
  assert.match(csv, /Not installer quotes or financial advice/);
  assert.match(csv, /No loans, incentives, taxes/);
});


test('manual sizing preserves the exact requested panel count and capacity', () => {
  const result = compareSystems({
    household: { roofArea: 800, bill: 180 },
    systemA: { manualPanels: 12, panelWatts: 400, installationCostPerWatt: 2.5 },
    systemB: { manualPanels: 16, panelWatts: 450, installationCostPerWatt: 3.0 },
  });
  assert.equal(result.a.panels, 12);
  assert.equal(result.a.systemKw, 4.8);
  assert.equal(result.b.panels, 16);
  assert.equal(result.b.systemKw, 7.2);
  assert.equal(result.a.grossCost, 12000);
  assert.equal(result.b.grossCost, 21600);
  assert.equal(result.a.roofLimited, false);
});

test('one system can be automatic while the other uses manual panel count', () => {
  const household = { roofArea: 600, bill: 180 };
  const result = compareSystems({
    household,
    systemA: { targetOffset: 60, panelWatts: 400 },
    systemB: { manualPanels: 14, panelWatts: 400, targetOffset: 10 },
  });
  assert.deepEqual(result.a, calculateSolar({ ...household, targetOffset: 60, panelWatts: 400 }));
  assert.equal(result.b.panels, 14); // Manual count overrides unused target offset.
  assert.equal(result.b.inputs.manualPanels, 14);
  assert.ok(result.b.annualProductionKwh > result.a.annualProductionKwh);
});

test('manual count above the roof limit is rejected without silently capping', () => {
  assert.throws(
    () => compareSystems({ household: { roofArea: 48 }, systemA: { manualPanels: 3 } }),
    /System A: Manual panel count \(3\) exceeds available roof capacity \(2 panels/,
  );
  assert.equal(calculateSolar({ roofArea: 48, bill: 400 }).panels, 2); // Auto unchanged.
});

test('manual panel count rejects fractional, zero, negative and nonnumeric values', () => {
  for (const manualPanels of [0, -1, 2.5, 'abc', Infinity, 2001, undefined]) {
    assert.throws(() => calculateSolar({ manualPanels }), RangeError);
  }
});

test('manual mode can model a fixed panel count with zero electricity use', () => {
  const result = calculateSolar({ manualPanels: 8, bill: 0, roofArea: 500 });
  assert.equal(result.panels, 8);
  assert.equal(result.generationOffsetPct, 0);
  assert.ok(result.grossCost > 0);
});

test('comparison CSV identifies manual and automatic systems independently', () => {
  const csv = comparisonCsv(compareSystems({
    systemA: { targetOffset: 60 },
    systemB: { manualPanels: 8 },
  }));
  assert.match(csv, /"Sizing method","Automatic","Manual"/);
  assert.match(csv, /"Requested manual panels","N\/A","8"/);
  assert.match(csv, /"Actual generation \(% of use\)"/);
  assert.match(csv, /"Target generation \(% of use; auto only\)"/);
});
