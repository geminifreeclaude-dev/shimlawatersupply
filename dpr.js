/* =============================================
   DPR MODULE
   Dynamic Form | Field Visibility | CRUD | S.No Auto-increment
   ============================================= */

import { DataService, COLLECTIONS } from './firebase.js';
import { State } from './auth.js';
import { AppUtils, MASTER_DATA } from './app.js';

/* =============================================
   FIELD VISIBILITY CONFIG
   ============================================= */
const FIELD_VISIBILITY = {
  'HSE': {
    show: ['card-fittings'],
    hide: ['card-location', 'card-pipe', 'field-stretch'],
    fields: {
      show: ['f_ferrule', 'f_ballValve', 'f_meterBox', 'f_waterMeter'],
      hide: ['f_package', 'f_zone', 'f_dma', 'f_stretch', 'f_pipeDia', 'f_layingLength']
    }
  },
  'Distribution': {
    show: ['card-location', 'card-pipe', 'card-fittings', 'card-manpower', 'card-contractor', 'card-remarks'],
    hide: ['field-stretch'],
    fields: {
      show: ['f_package', 'f_zone', 'f_dma', 'f_pipeDia', 'f_layingLength', 'f_ferrule', 'f_ballValve', 'f_meterBox', 'f_waterMeter', 'f_noOfTeam', 'f_manpower', 'f_workTime', 'f_contractor', 'f_remark'],
      hide: ['f_stretch']
    }
  },
  'Transmission': {
    show: ['card-location', 'card-pipe', 'card-manpower', 'card-contractor', 'card-remarks'],
    hide: ['card-fittings'],
    fields: {
      show: ['f_package', 'f_zone', 'f_dma', 'f_stretch', 'f_pipeDia', 'f_layingLength', 'f_noOfTeam', 'f_manpower', 'f_workTime', 'f_contractor', 'f_remark'],
      hide: ['f_ferrule', 'f_ballValve', 'f_meterBox', 'f_waterMeter']
    }
  },
  'House Connection': {
    show: ['card-fittings', 'card-manpower', 'card-contractor', 'card-remarks'],
    hide: ['card-location', 'card-pipe', 'field-stretch'],
    fields: {
      show: ['f_ferrule', 'f_ballValve', 'f_meterBox', 'f_waterMeter', 'f_noOfTeam', 'f_manpower', 'f_workTime', 'f_contractor', 'f_remark'],
      hide: ['f_package', 'f_zone', 'f_dma', 'f_stretch', 'f_pipeDia', 'f_layingLength']
    }
  }
};

/* =============================================
   S.NO COUNTER
   ============================================= */
async function getNextSNo() {
  try {
    // Get all DPRs to find max S.No
    const dprs = State.dprs || [];
    let maxSNo = 0;
    dprs.forEach(d => {
      const sno = parseInt(d.sno);
      if (!isNaN(sno) && sno > maxSNo) maxSNo = sno;
    });

    // Check settings for starting S.No
    const startSNo = State.settings?.snoStart || 1;
    const nextSNo = Math.max(maxSNo + 1, startSNo);

    return nextSNo;
  } catch (e) {
    console.error('Error getting next S.No:', e);
    return (State.dprs?.length || 0) + 1;
  }
}

/* =============================================
   CASCADING DROPDOWNS (Package > Zone > DMA)
   ============================================= */
function populateZones() {
  const pkg = document.getElementById('f_package').value;
  const zoneSel = document.getElementById('f_zone');
  const dmaSel = document.getElementById('f_dma');

  if (!zoneSel || !dmaSel) return;

  zoneSel.innerHTML = '';
  dmaSel.innerHTML = '<option value="" disabled selected>Select zone first</option>';
  dmaSel.disabled = true;

  if (!pkg) {
    zoneSel.innerHTML = '<option value="" disabled selected>Select package first</option>';
    zoneSel.disabled = true;
    return;
  }

  const zones = [];
  const seen = new Set();
  for (const r of MASTER_DATA) {
    if (String(r.p) === String(pkg) && !seen.has(r.zn)) {
      seen.add(r.zn);
      zones.push({ zn: r.zn, z: r.z });
    }
  }
  zones.sort((a, b) => a.z.localeCompare(b.z));

  zoneSel.appendChild(new Option('Select zone', '', true, true));
  zoneSel.firstChild.disabled = true;
  zones.forEach(z => zoneSel.appendChild(new Option(z.z, z.zn)));
  zoneSel.disabled = false;
}

function populateDMAs() {
  const pkg = document.getElementById('f_package').value;
  const zn = document.getElementById('f_zone').value;
  const dmaSel = document.getElementById('f_dma');

  if (!dmaSel) return;

  dmaSel.innerHTML = '';
  if (!pkg || !zn) {
    dmaSel.innerHTML = '<option value="" disabled selected>Select zone first</option>';
    dmaSel.disabled = true;
    return;
  }

  const dmas = [...new Set(
    MASTER_DATA
      .filter(r => String(r.p) === String(pkg) && String(r.zn) === String(zn))
      .map(r => r.d)
  )].sort((a, b) => a - b);

  dmaSel.appendChild(new Option('Select DMA', '', true, true));
  dmaSel.firstChild.disabled = true;
  dmas.forEach(d => dmaSel.appendChild(new Option('DMA ' + d, d)));
  dmaSel.disabled = false;
}

/* =============================================
   DYNAMIC FIELD VISIBILITY
   ============================================= */
function updateFieldVisibility() {
  const layingWork = document.getElementById('f_laying').value;
  const config = FIELD_VISIBILITY[layingWork];

  if (!config) return;

  // Show/hide entire cards
  config.show.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  });
  config.hide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Show/hide individual fields within cards
  if (config.fields) {
    config.fields.show.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.closest('.field')?.classList.remove('field-hidden');
        el.disabled = false;
      }
    });
    config.fields.hide.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.closest('.field')?.classList.add('field-hidden');
        el.disabled = true;
        el.required = false;
      }
    });
  }

  // Special handling for stretch field in Transmission
  const stretchField = document.getElementById('field-stretch');
  const stretchInput = document.getElementById('f_stretch');
  const stretchReqMark = document.getElementById('stretchReqMark');

  if (layingWork === 'Transmission') {
    if (stretchField) stretchField.style.display = 'block';
    if (stretchInput) {
      stretchInput.required = true;
      stretchInput.disabled = false;
    }
    if (stretchReqMark) {
      stretchReqMark.innerHTML = '*';
      stretchReqMark.className = 'req';
    }
  } else {
    if (stretchField) stretchField.style.display = 'none';
    if (stretchInput) {
      stretchInput.required = false;
      stretchInput.value = '';
    }
  }

  // Update custom admin fields visibility
  updateCustomFieldsVisibility(layingWork);
}

/* =============================================
   CUSTOM ADMIN FIELDS
   ============================================= */
function renderCustomFields() {
  const container = document.getElementById('admin-custom-fields-container');
  if (!container) return;

  const customFields = (State.fieldDefs || []).filter(f => !f.system && f.visible !== false);

  if (customFields.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Group by section
  const sections = {};
  customFields.forEach(f => {
    const section = f.section || 'custom';
    if (!sections[section]) sections[section] = [];
    sections[section].push(f);
  });

  let html = '';
  for (const [sectionName, fields] of Object.entries(sections)) {
    html += `<div class="sw-card custom-field-card" data-custom-section="${sectionName}">`;
    html += `<div class="sw-card-head" style="--accent: var(--app-sky); --accent-light: var(--app-sky-light);">`;
    html += `<div class="ic"><i class="fa-solid fa-sliders"></i></div>`;
    html += `<div><h2>${AppUtils.esc(sectionName.charAt(0).toUpperCase() + sectionName.slice(1))} Fields</h2></div>`;
    html += `</div>`;
    html += `<div class="sw-card-body">`;

    fields.forEach(f => {
      html += renderCustomField(f);
    });

    html += `</div></div>`;
  }

  container.innerHTML = html;

  // Setup dropdown options for custom dropdown fields
  customFields.forEach(f => {
    if (f.type === 'dropdown' && f.options) {
      const sel = document.getElementById('custom_' + f.fieldId);
      if (sel) {
        f.options.split(',').forEach(opt => {
          const trimmed = opt.trim();
          if (trimmed) {
            const option = document.createElement('option');
            option.value = trimmed;
            option.textContent = trimmed;
            sel.appendChild(option);
          }
        });
      }
    }
  });
}

function renderCustomField(fieldDef) {
  const fieldId = 'custom_' + fieldDef.fieldId;
  const required = fieldDef.required ? '<span class="req">*</span>' : '<span class="opt">optional</span>';
  const requiredAttr = fieldDef.required ? 'required' : '';
  const layingClass = fieldDef.layingWork ? `field-laying-${fieldDef.layingWork.replace(/\s+/g, '-')}` : '';

  let inputHtml = '';
  switch (fieldDef.type) {
    case 'text':
      inputHtml = `<input type="text" id="${fieldId}" class="sw-input" placeholder="Enter ${AppUtils.esc(fieldDef.label)}" ${requiredAttr}>`;
      break;
    case 'number':
      inputHtml = `<input type="number" id="${fieldId}" class="sw-input" min="0" step="1" inputmode="numeric" placeholder="0" ${requiredAttr}>`;
      break;
    case 'dropdown':
      inputHtml = `<select id="${fieldId}" class="sw-select" ${requiredAttr}><option value="" disabled selected>Select ${AppUtils.esc(fieldDef.label)}</option></select>`;
      break;
    case 'date':
      inputHtml = `<input type="date" id="${fieldId}" class="sw-input" ${requiredAttr}>`;
      break;
    case 'textarea':
      inputHtml = `<textarea id="${fieldId}" class="sw-textarea" rows="2" placeholder="Enter ${AppUtils.esc(fieldDef.label)}" ${requiredAttr}></textarea>`;
      break;
    default:
      inputHtml = `<input type="text" id="${fieldId}" class="sw-input" placeholder="Enter ${AppUtils.esc(fieldDef.label)}">`;
  }

  return `
    <div class="field ${layingClass}" data-laying="${AppUtils.esc(fieldDef.layingWork || '')}">
      <label for="${fieldId}">${AppUtils.esc(fieldDef.label)} ${required}</label>
      ${inputHtml}
    </div>
  `;
}

function updateCustomFieldsVisibility(layingWork) {
  document.querySelectorAll('#admin-custom-fields-container .field[data-laying]').forEach(el => {
    const fieldLaying = el.dataset.laying;
    if (fieldLaying && fieldLaying !== layingWork) {
      el.classList.add('field-hidden');
      const input = el.querySelector('input, select, textarea');
      if (input) input.disabled = true;
    } else {
      el.classList.remove('field-hidden');
      const input = el.querySelector('input, select, textarea');
      if (input) input.disabled = false;
    }
  });
}

function gatherCustomFieldsData() {
  const data = {};
  (State.fieldDefs || []).forEach(f => {
    if (!f.system) {
      const el = document.getElementById('custom_' + f.fieldId);
      if (el && !el.disabled) {
        data[f.fieldId] = el.value;
      }
    }
  });
  return data;
}

function loadCustomFieldsIntoForm(record) {
  (State.fieldDefs || []).forEach(f => {
    if (!f.system && record[f.fieldId] !== undefined) {
      const el = document.getElementById('custom_' + f.fieldId);
      if (el) el.value = record[f.fieldId];
    }
  });
}

/* =============================================
   FORM DATA GATHERING
   ============================================= */
function gatherFormData() {
  const layingWork = document.getElementById('f_laying').value;
  const data = {
    sno: document.getElementById('f_sno').value,
    date: document.getElementById('f_date').value,
    month: document.getElementById('f_month').value,
    workType: document.getElementById('f_worktype').value,
    layingWork: layingWork,
    contractor: document.getElementById('f_contractor').value,
    noOfTeam: AppUtils.cleanNum(document.getElementById('f_noOfTeam').value),
    manpower: AppUtils.cleanNum(document.getElementById('f_manpower').value),
    workTime: AppUtils.cleanNum(document.getElementById('f_workTime').value),
    remark: document.getElementById('f_remark').value.trim(),
    customFields: {}
  };

  // Conditionally add fields based on laying work
  const config = FIELD_VISIBILITY[layingWork];
  if (config && config.fields) {
    config.fields.show.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el && !el.disabled) {
        const key = fieldId.replace('f_', '');
        if (el.type === 'number' || el.tagName === 'SELECT') {
          data[key] = el.type === 'number' ? AppUtils.cleanNum(el.value) : el.value;
        } else {
          data[key] = el.value;
        }
      }
    });
  }

  // Add custom fields
  data.customFields = gatherCustomFieldsData();

  return data;
}

/* =============================================
   FORM SUBMISSION
   ============================================= */
async function onSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('dprForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const btn = document.getElementById('submitBtn');
  AppUtils.setButtonLoading(btn, true);

  try {
    const record = gatherFormData();

    if (State.editingRecordId) {
      // Update existing
      const existing = State.dprs.find(r => r.id === State.editingRecordId);
      if (State.currentRole !== 'admin' && existing && existing.createdBy !== (State.currentUser?.uid || State.currentEngineer?.id)) {
        throw Object.assign(new Error('Not permitted'), { code: 'perm-denied' });
      }

      await DataService.update(COLLECTIONS.DPR, State.editingRecordId, record);
      const idx = State.dprs.findIndex(r => r.id === State.editingRecordId);
      if (idx > -1) {
        State.dprs[idx] = Object.assign({}, State.dprs[idx], record);
      }
      AppUtils.toast('Daily progress report updated.');
      cancelEdit();
    } else {
      // Create new
      if (State.currentRole === 'engineer' && State.currentEngineer) {
        record.engineerId = State.currentEngineer.id;
        record.engineerName = State.currentEngineer.name;
        record.createdBy = State.currentEngineer.id;
        record.createdByName = State.currentEngineer.name;
      } else {
        record.createdBy = State.currentUser?.uid || 'admin';
        record.createdByName = State.currentUser?.email?.split('@')[0] || 'Admin';
      }

      const ref = await DataService.add(COLLECTIONS.DPR, record);
      State.dprs.unshift(Object.assign({ id: ref.id }, record));
      AppUtils.toast('Daily progress report saved.');
      softReset();
    }

    // Refresh S.No
    refreshSNo();

    // Notify other modules
    window.dispatchEvent(new CustomEvent('dpr:changed'));
  } catch (err) {
    if (err && err.code === 'perm-denied') {
      AppUtils.toast('You can only edit your own entries.', true);
    } else {
      console.error('Save error:', err);
      AppUtils.toast('Could not save. Check connection and try again.', true);
    }
  } finally {
    AppUtils.setButtonLoading(btn, false);
  }
}

/* =============================================
   EDIT MODE
   ============================================= */
async function loadRecordIntoForm(record) {
  // Basic fields
  document.getElementById('f_sno').value = record.sno || '';
  document.getElementById('f_date').value = record.date || '';
  document.getElementById('f_month').value = record.month || '';
  document.getElementById('f_worktype').value = record.workType || '';
  document.getElementById('f_laying').value = record.layingWork || '';

  // Update visibility first
  updateFieldVisibility();

  // Location fields
  if (record.packageNo) {
    document.getElementById('f_package').value = record.packageNo;
    populateZones();
    if (record.zoneNo) {
      setTimeout(() => {
        document.getElementById('f_zone').value = record.zoneNo;
        populateDMAs();
        if (record.dma) {
          setTimeout(() => {
            document.getElementById('f_dma').value = record.dma;
          }, 50);
        }
      }, 50);
    }
  }

  // Pipe fields
  if (record.pipeDia) document.getElementById('f_pipeDia').value = record.pipeDia;
  if (record.layingLength !== undefined) document.getElementById('f_layingLength').value = record.layingLength;

  // Stretch
  if (record.stretch !== undefined) document.getElementById('f_stretch').value = record.stretch;

  // Fittings
  if (record.ferrule !== undefined) document.getElementById('f_ferrule').value = record.ferrule;
  if (record.ballValve !== undefined) document.getElementById('f_ballValve').value = record.ballValve;
  if (record.meterBox !== undefined) document.getElementById('f_meterBox').value = record.meterBox;
  if (record.waterMeter !== undefined) document.getElementById('f_waterMeter').value = record.waterMeter;

  // Manpower
  if (record.noOfTeam !== undefined) document.getElementById('f_noOfTeam').value = record.noOfTeam;
  if (record.manpower !== undefined) document.getElementById('f_manpower').value = record.manpower;
  if (record.workTime !== undefined) document.getElementById('f_workTime').value = record.workTime;

  // Contractor
  if (record.contractor) document.getElementById('f_contractor').value = record.contractor;

  // Remarks
  if (record.remark !== undefined) document.getElementById('f_remark').value = record.remark;

  // Custom fields
  loadCustomFieldsIntoForm(record);
}

function enterEditMode(record) {
  if (State.currentRole !== 'admin') {
    const creatorId = record.engineerId || record.createdBy;
    const myId = State.currentEngineer?.id || State.currentUser?.uid;
    if (creatorId !== myId) {
      AppUtils.toast('You can only edit your own entries.', true);
      return;
    }
  }

  State.editingRecordId = record.id;
  loadRecordIntoForm(record);

  document.getElementById('editingBanner').classList.add('show');
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-check"></i> Update Daily Progress Report';

  // Navigate to entry
  window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'entry' } }));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  State.editingRecordId = null;
  document.getElementById('editingBanner').classList.remove('show');
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-check"></i> Save Daily Progress Report';
}

/* =============================================
   FORM RESET
   ============================================= */
async function refreshSNo() {
  const sno = await getNextSNo();
  document.getElementById('f_sno').value = sno;
}

function fullReset() {
  document.getElementById('dprForm').reset();
  document.getElementById('f_date').value = AppUtils.todayISO();
  document.getElementById('f_month').value = AppUtils.monthLabel(AppUtils.todayISO());
  populateZones();
  updateFieldVisibility();
  cancelEdit();
  refreshSNo();
}

function softReset() {
  // Keep date, reset other fields
  document.getElementById('f_pipeDia').selectedIndex = 0;
  document.getElementById('f_layingLength').value = '';
  document.getElementById('f_ferrule').value = '';
  document.getElementById('f_ballValve').value = '';
  document.getElementById('f_meterBox').value = '';
  document.getElementById('f_waterMeter').value = '';
  document.getElementById('f_stretch').value = '';
  document.getElementById('f_noOfTeam').value = '';
  document.getElementById('f_manpower').value = '';
  document.getElementById('f_workTime').value = '';
  document.getElementById('f_remark').value = '';
  refreshSNo();
}

/* =============================================
   DATE/MONTH AUTO-GENERATION
   ============================================= */
function setupDateLogic() {
  const dateInput = document.getElementById('f_date');
  const monthInput = document.getElementById('f_month');

  if (dateInput) {
    dateInput.value = AppUtils.todayISO();
    dateInput.addEventListener('change', () => {
      if (monthInput) monthInput.value = AppUtils.monthLabel(dateInput.value);
    });
  }

  if (monthInput) {
    monthInput.value = AppUtils.monthLabel(AppUtils.todayISO());
  }
}

/* =============================================
   LAYING WORK CHANGE HANDLER
   ============================================= */
function setupLayingWorkHandler() {
  const layingSelect = document.getElementById('f_laying');
  if (layingSelect) {
    layingSelect.addEventListener('change', () => {
      updateFieldVisibility();
    });
  }
}

/* =============================================
   INITIALIZATION
   ============================================= */
async function init() {
  // Setup date logic
  setupDateLogic();

  // Setup cascading dropdowns
  const packageSel = document.getElementById('f_package');
  const zoneSel = document.getElementById('f_zone');
  if (packageSel) packageSel.addEventListener('change', populateZones);
  if (zoneSel) zoneSel.addEventListener('change', populateDMAs);

  // Setup laying work handler
  setupLayingWorkHandler();

  // Form submission
  const form = document.getElementById('dprForm');
  if (form) form.addEventListener('submit', onSubmit);

  // Cancel edit
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);

  // Reset
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', fullReset);

  // Numeric guards
  ["f_layingLength", "f_noOfTeam", "f_manpower", "f_workTime", "f_ferrule", "f_ballValve", "f_meterBox", "f_waterMeter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", AppUtils.clampNonNegative);
      el.addEventListener("keydown", AppUtils.preventMinus);
    }
  });

  // Listen for boot
  window.addEventListener('app:boot', async () => {
    populateZones();
    renderCustomFields();
    updateFieldVisibility();
    await refreshSNo();
  });

  // Listen for field definition changes
  window.addEventListener('fielddefs:changed', () => {
    renderCustomFields();
    updateFieldVisibility();
  });

  // Listen for navigation
  window.addEventListener('app:navigate', (e) => {
    const page = e.detail.page;
    if (page === 'entry' && !State.editingRecordId) {
      refreshSNo();
    }
  });
}

// Initialize
init();

/* =============================================
   EXPORTS
   ============================================= */
export {
  enterEditMode,
  loadRecordIntoForm,
  cancelEdit,
  fullReset,
  updateFieldVisibility,
  renderCustomFields,
  gatherCustomFieldsData,
  getNextSNo,
  populateZones,
  populateDMAs
};
