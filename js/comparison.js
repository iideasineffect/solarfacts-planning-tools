import { calculateSolar, DEFAULTS } from './estimator.js';

/**
 * Compare two modeled solar configurations using the *same* household assumptions.
 * These are not installer quotes and do not account for financing, local tariffs,
 * shading, roof orientation or site-specific production.
 */
export function compareSystems({ household = {}, systemA = {}, systemB = {} } = {}) {
  const base = { ...DEFAULTS, ...household };
  const run = (name, configuration) => {
    try {
      return calculateSolar({ ...base, ...configuration });
    } catch (error) {
      // Identify the scenario so manual roof-space errors are actionable.
      if (error instanceof RangeError) throw new RangeError(`${name}: ${error.message}`);
      throw error;
    }
  };
  const a = run('System A', systemA);
  const b = run('System B', systemB);
  return {
    a, b,
    difference: {
      panels: b.panels - a.panels,
      capacityKw: b.systemKw - a.systemKw,
      annualKwh: b.annualProductionKwh - a.annualProductionKwh,
      costUsd: b.grossCost - a.grossCost,
      annualSavingsUsd: b.firstYearNetSavings - a.firstYearNetSavings,
      netBenefit25YearsUsd: b.netBenefit25Years - a.netBenefit25Years,
    },
  };
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function comparisonCsv(comparison) {
  const { a, b } = comparison;
  const fields = [
    ['Metric', 'System A', 'System B'],
    ['Sizing method', a.inputs.manualPanels === undefined ? 'Automatic' : 'Manual', b.inputs.manualPanels === undefined ? 'Automatic' : 'Manual'],
    ['Requested manual panels', a.inputs.manualPanels ?? 'N/A', b.inputs.manualPanels ?? 'N/A'],
    ['Panels', a.panels, b.panels],
    ['System capacity (kW DC)', a.systemKw.toFixed(2), b.systemKw.toFixed(2)],
    ['Estimated yearly production (kWh)', Math.round(a.annualProductionKwh), Math.round(b.annualProductionKwh)],
    ['Estimated installed cost (USD)', Math.round(a.grossCost), Math.round(b.grossCost)],
    ['Estimated first-year net savings (USD)', Math.round(a.firstYearNetSavings), Math.round(b.firstYearNetSavings)],
    ['Modeled payback (years)', a.paybackYears === null ? 'Not within 25 years' : a.paybackYears.toFixed(1), b.paybackYears === null ? 'Not within 25 years' : b.paybackYears.toFixed(1)],
    ['Modeled 25-year net benefit (USD)', Math.round(a.netBenefit25Years), Math.round(b.netBenefit25Years)],
    ['Monthly bill assumed (USD)', a.inputs.bill, b.inputs.bill],
    ['Electricity price assumed (USD/kWh)', a.inputs.electricityRate, b.inputs.electricityRate],
    ['Peak sun hours per day (assumed)', a.inputs.sunHours, b.inputs.sunHours],
    ['Usable roof area (sq ft)', a.inputs.roofArea, b.inputs.roofArea],
    ['Target generation (% of use; auto only)', a.inputs.manualPanels === undefined ? a.inputs.targetOffset : 'N/A', b.inputs.manualPanels === undefined ? b.inputs.targetOffset : 'N/A'],
    ['Actual generation (% of use)', a.generationOffsetPct.toFixed(1), b.generationOffsetPct.toFixed(1)],
    ['Panel rating (W)', a.inputs.panelWatts, b.inputs.panelWatts],
    ['Installed cost (USD/W)', a.inputs.installationCostPerWatt, b.inputs.installationCostPerWatt],
    ['Roof limited?', a.roofLimited ? 'Yes' : 'No', b.roofLimited ? 'Yes' : 'No'],
    ['Caveat', 'Illustrative estimates only. Not installer quotes or financial advice. No loans, incentives, taxes, detailed tariffs, or site survey modeled.', 'Same caveat applies'],
  ];
  return fields.map(row => row.map(csvCell).join(',')).join('\r\n');
}
