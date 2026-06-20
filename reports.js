/* =============================================
   REPORTS LOG MODULE
   Table Rendering | Filters | Search | Dynamic Columns
   ============================================= */

import { DataService, COLLECTIONS } from './firebase.js';
import { State } from './auth.js';
import { AppUtils } from './app.js';
import { enterEditMode } from './dpr.js';

/* =============================================
   GET FILTERED DATA
   ============================================= */
function getFilteredData() {
  const from = document.getElementById('filt_from').value;
  const to = document.getElementById('filt_to').value;
  const pkg = document.getElementById('filt_package').value;
  const zone = document.getElementById('filt_zone').value;
  const dma = document.getElementById('filt_dma').value;
  const con = document.getElementById('filt_contractor').value;
  const eng = document.getElementById('filt_engineer').value;
  const workType = document.getElementById('filt_worktype').value;
  const q = document.getElementById('filt_search').value.trim().toLowerCase();

  return (State.dprs || []).filter(r => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (pkg && String(r.packageNo) !== String(pkg)) return false;
    if (zone && String(r.zoneNo) !== String(zone)) return false;
    if (dma && String(r.dma) !== String(dma)) return false;
    if (con && r.contractor !== con) return false;
    if (eng && r.engineerId !== eng && r.createdBy !== eng) return false;
    if (workType && r.layingWork !== workType) return false;
    if (q) {
      const hay = [
        r.zoneName,
        'dma ' + r.dma,
        r.remarks,
        r.remark,
        r.transmissionStretch,
        r.stretch,
        r.workType,
        r.layingWork,
        r.contractor,
        r.engineerName,
        r.createdByName
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/* =============================================
   RENDER LOG TABLE
   ============================================= */
function render() {
  const tbody = document.getElementById('logBody');
  const table = document.getElementById('logTable');
  const empty = document.getElementById('logEmpty');
  if (!tbody || !table || !empty) return;

  const rows = getFilteredData();

  // Summary
  const totalLen = rows.reduce((s, r) => s + (parseFloat(r.layingLength) || 0), 0);
  const totalMan = rows.reduce((s, r) => s + (parseInt(r.manpower) || 0), 0);

  const summaryEl = document.getElementById('logSummary');
  if (summaryEl) {
    summaryEl.innerHTML = [
      ["Entries", rows.length],
      ["Total length", totalLen.toLocaleString(undefined, { maximumFractionDigits: 1 }) + " m"],
      ["Manpower logged", totalMan.toLocaleString()],
      ["Packages active", new Set(rows.map(r => r.packageNo)).size]
    ].map(([l, v]) => `
      <div class="stat-pill">
        <div class="v">${AppUtils.esc(v)}</div>
        <div class="l">${AppUtils.esc(l)}</div>
      </div>
    `).join("");
  }

  if (rows.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    table.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  table.style.display = 'table';

  // Render table body
  tbody.innerHTML = rows.map(r => {
    const canEdit = State.currentRole === 'admin' ||
      r.createdBy === (State.currentUser?.uid || State.currentEngineer?.id);

    const editBtn = canEdit
      ? `<button class="icon-btn-sm edit-dpr-btn" data-id="${r.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>`
      : '';

    const delBtn = State.currentRole === 'admin'
      ? `<button class="icon-btn-sm del delete-dpr-btn" data-id="${r.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>`
      : '';

    return `<tr>
      <td class="mono">${AppUtils.esc(r.sno || '')}</td>
      <td>${AppUtils.esc(AppUtils.fmtDate(r.date))}</td>
      <td><span class="pill">Pkg ${AppUtils.esc(r.packageNo || '')}</span></td>
      <td>${AppUtils.esc(r.zoneName || '')}</td>
      <td class="mono">DMA ${AppUtils.esc(r.dma || '')}</td>
      <td>${AppUtils.esc(r.layingWork || '')}</td>
      <td class="mono">${AppUtils.esc(r.pipeDia || '')}</td>
      <td class="mono">${AppUtils.esc(r.layingLength != null ? Number(r.layingLength).toLocaleString() : '')}</td>
      <td>${AppUtils.esc(r.contractor || '')}</td>
      <td>${AppUtils.esc(r.engineerName || r.createdByName || '--')}</td>
      <td><div class="log-actions-cell">${editBtn}${delBtn}</div></td>
    </tr>`;
  }).join('');

  // Attach event handlers
  tbody.querySelectorAll('.edit-dpr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const record = State.dprs.find(x => x.id === btn.dataset.id);
      if (record) enterEditMode(record);
    });
  });

  tbody.querySelectorAll('.delete-dpr-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
}

/* =============================================
   DELETE DPR
   ============================================= */
function confirmDelete(id) {
  document.getElementById('confirm-msg').textContent = 'Are you sure you want to delete this DPR entry? This action cannot be undone.';
  document.getElementById('modal-confirm-title').textContent = 'Delete DPR Entry';

  const confirmBtn = document.getElementById('confirm-btn');
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener('click', async () => {
    closeModal('modal-confirm');
    try {
      await DataService.delete(COLLECTIONS.DPR, id);
      State.dprs = State.dprs.filter(r => r.id !== id);
      render();
      window.dispatchEvent(new CustomEvent('dpr:changed'));
      AppUtils.toast('Entry deleted.');
    } catch (err) {
      console.error('Delete error:', err);
      AppUtils.toast('Could not delete entry.', true);
    }
  });

  openModal('modal-confirm');
}

/* =============================================
   MODAL HELPERS
   ============================================= */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* =============================================
   POPULATE ZONE/DMA FILTERS
   ============================================= */
function populateZoneFilter() {
  const sel = document.getElementById('filt_zone');
  if (!sel) return;

  // Get unique zones from DPRs
  const zones = [...new Set((State.dprs || []).map(r => r.zoneNo).filter(Boolean))].sort((a, b) => a - b);

  const firstOption = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(firstOption);

  zones.forEach(z => {
    const zoneData = State.dprs.find(r => r.zoneNo === z);
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = zoneData ? zoneData.zoneName : 'Zone ' + z;
    sel.appendChild(opt);
  });
}

function populateDMAFilter() {
  const sel = document.getElementById('filt_dma');
  if (!sel) return;

  const dmas = [...new Set((State.dprs || []).map(r => r.dma).filter(Boolean))].sort((a, b) => a - b);

  const firstOption = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(firstOption);

  dmas.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = 'DMA ' + d;
    sel.appendChild(opt);
  });
}

/* =============================================
   INITIALIZATION
   ============================================= */
function init() {
  // Filter inputs
  ['filt_from', 'filt_to', 'filt_package', 'filt_zone', 'filt_dma',
   'filt_contractor', 'filt_engineer', 'filt_worktype', 'filt_search'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', AppUtils.debounce(() => render(), 150));
      el.addEventListener('change', () => render());
    }
  });

  // Navigation
  window.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'log') {
      render();
      populateZoneFilter();
      populateDMAFilter();
    }
  });

  // Render event
  window.addEventListener('log:render', () => render());

  // DPR changed
  window.addEventListener('dpr:changed', () => {
    if (State.currentPage === 'log') render();
  });

  // Boot
  window.addEventListener('app:boot', () => {
    if (State.currentPage === 'log') render();
  });
}

init();

/* =============================================
   EXPORTS
   ============================================= */
export { render, getFilteredData };
