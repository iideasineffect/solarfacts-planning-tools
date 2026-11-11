import { calculateSolar, calculateBattery, reportCsv } from './estimator.js';
import { configurePartnerLinks } from './partners.js';

configurePartnerLinks();
const $ = (selector) => document.querySelector(selector);
const money = number => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(number);
const whole = number => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number);

const menu = $('.menu-toggle');
const nav = $('#main-nav');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '✕' : '☰';
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.textContent = '☰';
    }
  });
}
if ($('#year')) $('#year').textContent = String(new Date().getFullYear());

const advanced = $('#advanced-button');
if (advanced) advanced.addEventListener('click', () => {
  const fields = $('#advanced-fields');
  const show = fields.hasAttribute('hidden');
  fields.toggleAttribute('hidden', !show);
  advanced.setAttribute('aria-expanded', String(show));
  advanced.querySelector('span').textContent = show ? '−' : '＋';
});

const solarForm = $('#solar-form');
let latest = null;
function drawCashflowChart(result) {
  const chart = $('#chart');
  if (!chart) return;
  chart.replaceChildren();
  const values = result.cashflow.filter(({ year }) => year % 2 === 1 || year === 25);
  const highest = Math.max(1, ...values.map(({ cumulative }) => cumulative));
  values.forEach(({ year, cumulative }) => {
    const bar = document.createElement('div');
    bar.className = 'chart-col';
    bar.style.height = `${Math.max(2, 100 * cumulative / highest)}%`;
    bar.title = `Year ${year}: ${money(cumulative)} in accumulated modeled savings`;
    chart.append(bar);
  });
  chart.setAttribute('aria-label', `Modeled accumulated savings, year 25: ${money(result.savings25Years)}. Gross installed cost: ${money(result.grossCost)}.`);
  const axis = document.createElement('div');
  axis.className = 'chart-axis';
  axis.innerHTML = '<span>YEAR 1</span><span>YEAR 13</span><span>YEAR 25</span>';
  chart.after(axis);
  const previous = chart.parentElement.querySelectorAll('.chart-axis');
  for (let i = 0; i < previous.length - 1; i++) previous[i].remove();
}
function showResults(result) {
  $('#system-kw').textContent = result.systemKw.toFixed(2);
  $('#panel-count').textContent = result.panels
    ? `${result.panels} panels · ${Math.round(result.generationOffsetPct)}% of estimated annual electricity use generated`
    : 'No system fits the inputs provided. Try another usable roof area or monthly bill.';
  $('#production').textContent = whole(result.annualProductionKwh);
  $('#savings').textContent = money(result.firstYearNetSavings);
  $('#system-cost').textContent = money(result.grossCost);
  $('#payback').textContent = result.paybackYears === null ? '25+ years / N/A' : `${result.paybackYears.toFixed(1)} years`;
  $('#roof-note').hidden = !result.roofLimited;
  $('#roof-note').textContent = result.roofLimited ? `The assumed usable roof area limits the proposed panel count to ${result.panels}.` : '';
  $('#download-report').disabled = false;
  drawCashflowChart(result);
}
function runSolar(event) {
  if (event) event.preventDefault();
  const formData = Object.fromEntries(new FormData(solarForm).entries());
  const errors = $('#form-errors');
  try {
    if (!solarForm.checkValidity()) throw new Error('Check the input values. All required fields must be within the displayed ranges.');
    const result = calculateSolar(formData);
    latest = result;
    errors.hidden = true;
    showResults(result);
  } catch (error) {
    latest = null;
    $('#download-report').disabled = true;
    errors.textContent = error.message || 'Please verify your inputs.';
    errors.hidden = false;
  }
}
if (solarForm) {
  solarForm.addEventListener('submit', runSolar);
  // Provide a useful starting snapshot without collecting or submitting visitor data.
  runSolar();
  $('#download-report').addEventListener('click', () => {
    if (!latest) return;
    const blob = new Blob([reportCsv(latest)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'solarfacts-estimate.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
  $('#print-report').addEventListener('click', () => window.print());
}

const batteryForm = $('#battery-form');
function runBattery(event) {
  if (event) event.preventDefault();
  const error = $('#battery-error');
  try {
    if (!batteryForm.checkValidity()) throw new Error('Please check the battery and load values.');
    const result = calculateBattery(Object.fromEntries(new FormData(batteryForm).entries()));
    $('#battery-hours').textContent = `${result.hours.toFixed(1)} hours`;
    error.textContent = '';
  } catch (e) {
    $('#battery-hours').textContent = '—';
    error.textContent = e.message;
  }
}
if (batteryForm) {
  batteryForm.addEventListener('submit', runBattery);
  runBattery();
}

const checklistPrint = $('#print-checklist');
if (checklistPrint) checklistPrint.addEventListener('click', () => window.print());
