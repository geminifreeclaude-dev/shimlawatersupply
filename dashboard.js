/* =============================================
   DASHBOARD MODULE
   Statistics | Chart.js Charts | Progress Bars
   ============================================= */

import { State } from './auth.js';
import { AppUtils } from './app.js';

/* =============================================
   CHART INSTANCES
   ============================================= */
let chartOverview = null;
let chartContractor = null;
let chartWorkType = null;

/* =============================================
   STATISTICS CALCULATION
   ============================================= */
function calculateStats() {
  const recs = State.dprs || [];
  const today = AppUtils.todayISO();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return {
    totalDPR: recs.length,
    todayDPR: recs.filter(r => r.date === today).length,
    monthlyDPR: recs.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length,
    totalLength: recs.reduce((s, r) => s + (parseFloat(r.layingLength) || 0), 0),
    totalManpower: recs.reduce((s, r) => s + (parseInt(r.manpower) || 0), 0),
    avgWorkTime: recs.length > 0 ? recs.reduce((s, r) => s + (parseFloat(r.workTime) || 0), 0) / recs.length : 0
  };
}

/* =============================================
   AGGREGATION HELPERS
   ============================================= */
function aggregateBy(key, recs) {
  const agg = {};
  recs.forEach(r => {
    const val = r[key];
    if (val !== undefined && val !== null && val !== '') {
      agg[val] = (agg[val] || 0) + 1;
    }
  });
  return Object.entries(agg).sort((a, b) => b[1] - a[1]);
}

function aggregateByLength(key, recs) {
  const agg = {};
  recs.forEach(r => {
    const val = r[key];
    if (val !== undefined && val !== null && val !== '') {
      agg[val] = (agg[val] || 0) + (parseFloat(r.layingLength) || 0);
    }
  });
  return Object.entries(agg).sort((a, b) => b[1] - a[1]);
}

/* =============================================
   RENDER STATS CARDS
   ============================================= */
function renderStats() {
  const stats = calculateStats();
  const container = document.getElementById('dashStats');
  if (!container) return;

  container.innerHTML = [
    ["Total DPR Entries", stats.totalDPR.toLocaleString()],
    ["Today's DPR", stats.todayDPR.toLocaleString()],
    ["Monthly DPR", stats.monthlyDPR.toLocaleString()],
    ["Total Length (m)", stats.totalLength.toLocaleString(undefined, { maximumFractionDigits: 1 })]
  ].map(([l, v]) => `
    <div class="dstat">
      <div class="v">${AppUtils.esc(v)}</div>
      <div class="l">${AppUtils.esc(l)}</div>
    </div>
  `).join('');

  // Update big stat displays
  const todayDprCount = document.getElementById('todayDprCount');
  if (todayDprCount) todayDprCount.textContent = stats.todayDPR;

  const monthlyDprCount = document.getElementById('monthlyDprCount');
  if (monthlyDprCount) monthlyDprCount.textContent = stats.monthlyDPR;
}

/* =============================================
   RENDER PROGRESS BARS
   ============================================= */
function renderProgressBars(containerId, entries, total, colorVar) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (entries.length === 0) {
    container.innerHTML = '<p style="color:var(--app-muted);font-size:12.5px;">No data yet.</p>';
    return;
  }

  const max = Math.max(...entries.map(e => e[1]), 1);
  container.innerHTML = entries.map(([label, val]) => `
    <div class="bar-row">
      <div class="lbl" title="${AppUtils.esc(label)}">${AppUtils.esc(label)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(val / max * 100).toFixed(1)}%;background:${colorVar};"></div>
      </div>
      <div class="val">${typeof val === "number" && val % 1 !== 0 ? val.toFixed(1) : val}</div>
    </div>
  `).join('');
}

/* =============================================
   RENDER CHARTS
   ============================================= */
function renderOverviewChart() {
  const canvas = document.getElementById('chartOverview');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const recs = State.dprs || [];
  const stats = calculateStats();

  if (chartOverview) chartOverview.destroy();

  chartOverview = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Today', 'This Month', 'Earlier'],
      datasets: [{
        data: [stats.todayDPR, stats.monthlyDPR - stats.todayDPR, stats.totalDPR - stats.monthlyDPR],
        backgroundColor: ['#0E6B66', '#2E7DA6', '#DCE6E2'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 12 }
        }
      }
    }
  });
}

function renderContractorChart() {
  const canvas = document.getElementById('chartContractor');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const recs = State.dprs || [];
  const byContractor = aggregateBy('contractor', recs).slice(0, 8);

  if (chartContractor) chartContractor.destroy();

  if (byContractor.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#5B6C6B';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
    return;
  }

  chartContractor = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: byContractor.map(([k]) => k),
      datasets: [{
        label: 'Entries',
        data: byContractor.map(([, v]) => v),
        backgroundColor: '#0E6B66',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 10 } }
        },
        x: {
          ticks: { font: { size: 9 }, maxRotation: 45 }
        }
      }
    }
  });
}

function renderWorkTypeChart() {
  const canvas = document.getElementById('chartWorkType');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const recs = State.dprs || [];
  const byWorkType = aggregateBy('layingWork', recs);

  if (chartWorkType) chartWorkType.destroy();

  if (byWorkType.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#5B6C6B';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
    return;
  }

  const colors = {
    'Distribution': '#0E6B66',
    'Transmission': '#2E7DA6',
    'House Connection': '#427A4C',
    'HSE': '#C97A1F'
  };

  chartWorkType = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: byWorkType.map(([k]) => k),
      datasets: [{
        data: byWorkType.map(([, v]) => v),
        backgroundColor: byWorkType.map(([k]) => colors[k] || '#5C6770'),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 10 }, padding: 8 }
        }
      }
    }
  });
}

/* =============================================
   RENDER ALL DASHBOARD
   ============================================= */
function render() {
  const recs = State.dprs || [];

  // Stats cards
  renderStats();

  // Progress bars
  const byPackage = aggregateByLength('packageNo', recs);
  renderProgressBars('byPackage', byPackage.map(([k, v]) => [`Package ${k}`, v]), 1, "var(--app-sky)");

  const byZone = aggregateByLength('zoneName', recs);
  renderProgressBars('byZone', byZone, 1, "var(--app-teal)");

  const byDMA = aggregateBy('dma', recs).slice(0, 20);
  renderProgressBars('byDMA', byDMA.map(([k, v]) => [`DMA ${k}`, v]), 1, "var(--app-moss)");

  // Charts
  renderOverviewChart();
  renderContractorChart();
  renderWorkTypeChart();
}

/* =============================================
   EVENT LISTENERS
   ============================================= */
function init() {
  window.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'dash') {
      render();
    }
  });

  window.addEventListener('dpr:changed', () => {
    if (State.currentPage === 'dash') {
      render();
    }
  });

  window.addEventListener('app:boot', () => {
    // Pre-render if dashboard is default
    if (State.currentPage === 'dash') {
      render();
    }
  });
}

init();

/* =============================================
   EXPORTS
   ============================================= */
export { render, calculateStats };
