/**
 * Transparent, simplified residential solar planning model.
 * All monetary amounts are USD. This is not a PVWatts simulation or an installation quote.
 * No external dependencies or API calls.
 */
export const DEFAULTS = Object.freeze({
  bill: 180,
  electricityRate: 0.19,
  roofArea: 520,
  sunHours: 5,
  panelWatts: 430,
  panelFootprint: 24,
  performanceRatio: 0.77,
  targetOffset: 90,
  selfUsePercent: 65,
  exportRate: 0.06,
  installationCostPerWatt: 2.85,
  yearlyMaintenance: 175,
  rateGrowthPercent: 2,
  degradationPercent: 0.5,
});

const INPUT_RANGES = Object.freeze({
  bill: [0, 10000], electricityRate: [0.01, 2], roofArea: [0, 25000],
  sunHours: [1, 8], panelWatts: [200, 800], panelFootprint: [15, 40],
  performanceRatio: [0.4, 0.95], targetOffset: [10, 100],
  selfUsePercent: [0, 100], exportRate: [0, 2],
  installationCostPerWatt: [0.5, 12], yearlyMaintenance: [0, 10000],
  rateGrowthPercent: [0, 15], degradationPercent: [0, 5],
});

export function normalizeInputs(values = {}) {
  const input = { ...DEFAULTS, ...values };
  for (const [key, [low, high]] of Object.entries(INPUT_RANGES)) {
    const number = Number(input[key]);
    if (!Number.isFinite(number) || number < low || number > high) {
      throw new RangeError(`${key} must be between ${low} and ${high}`);
    }
    input[key] = number;
  }
  // Optional fixed panel count is used only by manual sizing. An omitted
  // manualPanels field retains the estimator's original automatic behavior.
  if (Object.hasOwn(values, 'manualPanels')) {
    const count = Number(values.manualPanels);
    if (!Number.isSafeInteger(count) || count < 1 || count > 2000) {
      throw new RangeError('Manual panel count must be a whole number between 1 and 2000.');
    }
    input.manualPanels = count;
  }
  return input;
}

export function calculateSolar(values = {}) {
  const input = normalizeInputs(values);
  // Roof area means *usable* unshaded area, not total roof size.
  const maxPanels = Math.floor(input.roofArea / input.panelFootprint);
  const monthlyKwh = input.bill / input.electricityRate;
  const annualUseKwh = monthlyKwh * 12;
  const productionPerKw = input.sunHours * 365 * input.performanceRatio;
  const requiredKw = (annualUseKwh * (input.targetOffset / 100)) / productionPerKw;
  const manualMode = Object.hasOwn(input, 'manualPanels');
  const wantedPanels = manualMode
    ? input.manualPanels
    : Math.ceil(requiredKw * 1000 / input.panelWatts);
  // Never silently reduce a manually requested panel count: the displayed
  // design must match the number entered by the visitor.
  if (manualMode && wantedPanels > maxPanels) {
    throw new RangeError(`Manual panel count (${wantedPanels}) exceeds available roof capacity (${maxPanels} panels at ${input.panelFootprint} sq ft per panel). Reduce the panel count or increase usable roof area.`);
  }
  const panels = manualMode ? wantedPanels : Math.max(0, Math.min(maxPanels, wantedPanels));
  const systemKw = panels * input.panelWatts / 1000;
  const annualProductionKwh = systemKw * productionPerKw;
  const annualSelfUsedKwh = Math.min(annualProductionKwh * input.selfUsePercent / 100, annualUseKwh);
  const annualExportKwh = Math.max(0, annualProductionKwh - annualSelfUsedKwh);
  const grossCost = systemKw * 1000 * input.installationCostPerWatt;
  const firstYearValue = annualSelfUsedKwh * input.electricityRate + annualExportKwh * input.exportRate;
  const firstYearNetSavings = Math.max(0, firstYearValue - (panels > 0 ? input.yearlyMaintenance : 0));
  const generationOffsetPct = annualUseKwh > 0 ? 100 * annualProductionKwh / annualUseKwh : 0;
  const cashflow = [];
  let cumulative = 0;
  let paybackYears = null;
  const rateGrowth = 1 + input.rateGrowthPercent / 100;
  const degradation = 1 - input.degradationPercent / 100;
  for (let year = 1; year <= 25; year++) {
    const productionFactor = degradation ** (year - 1);
    const rateFactor = rateGrowth ** (year - 1);
    const value = annualSelfUsedKwh * productionFactor * input.electricityRate * rateFactor
      + annualExportKwh * productionFactor * input.exportRate;
    const savings = panels > 0 ? Math.max(0, value - input.yearlyMaintenance) : 0;
    const previous = cumulative;
    cumulative += savings;
    if (paybackYears === null && grossCost > 0 && cumulative >= grossCost && savings > 0) {
      paybackYears = year - 1 + (grossCost - previous) / savings;
    }
    cashflow.push({ year, savings, cumulative, netPosition: cumulative - grossCost });
  }
  return {
    inputs: input, panels, maxPanels, roofLimited: !manualMode && panels < wantedPanels, systemKw,
    monthlyKwh, annualUseKwh, annualProductionKwh, monthlyProductionKwh: annualProductionKwh / 12,
    annualSelfUsedKwh, annualExportKwh, generationOffsetPct, grossCost,
    firstYearValue, firstYearNetSavings, paybackYears,
    savings25Years: cumulative, netBenefit25Years: cumulative - grossCost, cashflow,
  };
}

export function calculateBattery({ capacityKwh = 10, loadWatts = 800, usablePercent = 90 } = {}) {
  const capacity = Number(capacityKwh);
  const watts = Number(loadWatts);
  const usable = Number(usablePercent);
  if (!Number.isFinite(capacity) || capacity < 0 || capacity > 200 ||
      !Number.isFinite(watts) || watts <= 0 || watts > 50000 ||
      !Number.isFinite(usable) || usable <= 0 || usable > 100) {
    throw new RangeError('Battery inputs are outside the supported range.');
  }
  const hours = (capacity * (usable / 100) * 1000) / watts;
  return { hours, usableEnergyKwh: capacity * usable / 100 };
}

export function reportCsv(result) {
  const rows = [
    ['SolarFacts preliminary estimate', 'Value'],
    ['Monthly bill (USD)', result.inputs.bill],
    ['Electricity rate (USD/kWh)', result.inputs.electricityRate],
    ['Usable roof area (sq ft)', result.inputs.roofArea],
    ['Peak sun hours/day (assumed)', result.inputs.sunHours],
    ['Solar panels', result.panels],
    ['System capacity (kW DC)', result.systemKw.toFixed(2)],
    ['Annual modeled production (kWh)', Math.round(result.annualProductionKwh)],
    ['Annual usage inferred from bill (kWh)', Math.round(result.annualUseKwh)],
    ['Illustrative upfront system cost (USD)', Math.round(result.grossCost)],
    ['Illustrative first-year net savings (USD)', Math.round(result.firstYearNetSavings)],
    ['Payback in modeled years', result.paybackYears === null ? 'Beyond 25 years' : result.paybackYears.toFixed(1)],
    ['Assumptions', 'Fixed losses, simple self-use/export model, no loans, taxes or site survey. No federal tax credit included.'],
  ];
  return rows.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');
}
