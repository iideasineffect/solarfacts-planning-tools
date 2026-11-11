import './site.js';
import { compareSystems, comparisonCsv } from './comparison.js';
import { DEFAULTS } from './estimator.js';

const form = document.querySelector('#comparison-form');
const results = document.querySelector('#comparison-results');
const errorBox = document.querySelector('#comparison-error');
const saveButton = document.querySelector('#save-comparison');
const usd = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const number = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
let current = null;

function paint(result) {
  const output = {
    method: r => r.inputs.manualPanels === undefined ? `Automatic (${r.inputs.targetOffset}% target)` : `Manual (${r.panels} panels)`,
    panels: r => String(r.panels),
    capacity: r => `${r.systemKw.toFixed(2)} kW`,
    production: r => `${number(r.annualProductionKwh)} kWh`,
    cost: r => usd(r.grossCost),
    savings: r => usd(r.firstYearNetSavings),
    payback: r => r.paybackYears === null ? 'Not within 25 years' : `${r.paybackYears.toFixed(1)} years`,
    benefit: r => usd(r.netBenefit25Years),
  };
  for (const [key, formatter] of Object.entries(output)) {
    results.querySelector(`[data-metric="${key}-a"]`).textContent = formatter(result.a);
    results.querySelector(`[data-metric="${key}-b"]`).textContent = formatter(result.b);
  }
  const costDelta = result.difference.costUsd;
  const savingsDelta = result.difference.annualSavingsUsd;
  results.querySelector('#comparison-summary').textContent = `Compared with A, System B has ${Math.abs(result.difference.capacityKw).toFixed(2)} kW ${result.difference.capacityKw >= 0 ? 'more' : 'less'} modeled capacity, ${usd(Math.abs(costDelta))} ${costDelta >= 0 ? 'higher' : 'lower'} estimated upfront cost, and ${usd(Math.abs(savingsDelta))} ${savingsDelta >= 0 ? 'higher' : 'lower'} first-year net savings. Neither is automatically the better choice; review warranties, financing, roof limits, and actual installer proposals.`;
  results.querySelector('#comparison-roof-note').textContent = (result.a.roofLimited || result.b.roofLimited)
    ? 'Roof capacity limits at least one automatically sized configuration. Increasing its generation target may not increase the number of panels.'
    : 'Both configurations fit the entered usable roof area. Manual panel counts are checked against roof capacity rather than silently reduced.';
  results.hidden = false;
}

function manualRoofHint(id) {
  const note = form.querySelector(`[data-roof-note="${id}"]`);
  const area = Number(form.elements.namedItem('roofArea').value);
  const panels = Number(form.elements.namedItem(`manualPanels${id}`).value);
  const maxPanels = Number.isFinite(area) && area >= 0 ? Math.floor(area / DEFAULTS.panelFootprint) : null;
  if (maxPanels === null) {
    note.textContent = 'Enter a valid usable roof area to check panel fit.';
    note.classList.remove('is-warning');
    return;
  }
  const tooMany = Number.isFinite(panels) && panels > maxPanels;
  note.textContent = tooMany
    ? `Roof-space warning: ${panels} panels exceed this roof's modeled limit of ${maxPanels}. Reduce the count or increase the usable roof area.`
    : `Estimated roof limit: ${maxPanels} panels using ${DEFAULTS.panelFootprint} sq ft per panel.`;
  note.classList.toggle('is-warning', tooMany);
}

function syncSizingMode(id) {
  const manual = form.elements.namedItem(`sizingMode${id}`).value === 'manual';
  form.querySelector(`[data-auto-fields="${id}"]`).hidden = manual;
  form.querySelector(`[data-manual-fields="${id}"]`).hidden = !manual;
  form.elements.namedItem(`targetOffset${id}`).disabled = manual;
  form.elements.namedItem(`manualPanels${id}`).disabled = !manual;
  if (manual) manualRoofHint(id);
}

function scenarioFromFields(fields, id) {
  const common = {
    panelWatts: fields[`panelWatts${id}`],
    installationCostPerWatt: fields[`installationCostPerWatt${id}`],
  };
  return fields[`sizingMode${id}`] === 'manual'
    ? { ...common, manualPanels: fields[`manualPanels${id}`] }
    : { ...common, targetOffset: fields[`targetOffset${id}`] };
}

function runComparison(event) {
  if (event) event.preventDefault();
  try {
    if (!form.checkValidity()) throw new Error('Please correct the highlighted fields.');
    const fields = Object.fromEntries(new FormData(form).entries());
    const household = {
      bill: fields.bill,
      electricityRate: fields.electricityRate,
      roofArea: fields.roofArea,
      sunHours: fields.sunHours,
      selfUsePercent: fields.selfUsePercent,
      exportRate: fields.exportRate,
    };
    current = compareSystems({
      household,
      systemA: scenarioFromFields(fields, 'A'),
      systemB: scenarioFromFields(fields, 'B'),
    });
    paint(current);
    errorBox.hidden = true;
    errorBox.textContent = '';
    saveButton.disabled = false;
  } catch (err) {
    current = null;
    results.hidden = true;
    saveButton.disabled = true;
    errorBox.textContent = err.message || 'Unable to calculate. Please review the inputs.';
    errorBox.hidden = false;
  }
}

if (form) {
  for (const id of ['A', 'B']) {
    form.elements.namedItem(`sizingMode${id}`).addEventListener('change', () => syncSizingMode(id));
    syncSizingMode(id);
  }
  form.addEventListener('input', () => {
    current = null;
    results.hidden = true;
    saveButton.disabled = true;
    errorBox.hidden = true;
    for (const id of ['A', 'B']) {
      if (form.elements.namedItem(`sizingMode${id}`).value === 'manual') manualRoofHint(id);
    }
  });
  form.addEventListener('change', () => {
    current = null;
    results.hidden = true;
    saveButton.disabled = true;
    errorBox.hidden = true;
  });
  form.addEventListener('submit', runComparison);
  saveButton.addEventListener('click', () => {
    if (!current) return;
    const file = new Blob([comparisonCsv(current)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'solarfacts-system-comparison.csv';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
  runComparison();
}
