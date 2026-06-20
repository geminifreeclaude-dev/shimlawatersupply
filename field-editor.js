/* =============================================
   FIELD EDITOR MODULE
   Admin Field Management | Drag & Drop | Dynamic Form Generation
   ============================================= */

import { DataService, COLLECTIONS } from './firebase.js';
import { State } from './auth.js';
import { AppUtils } from './app.js';

/* =============================================
   DEFAULT FIELD DEFINITIONS
   ============================================= */
const DEFAULT_FIELD_DEFS = [
  { fieldId: 'sno', label: 'S. No.', type: 'number', required: true, system: true, section: 'work', order: 0, visible: true },
  { fieldId: 'date', label: 'Date', type: 'date', required: true, system: true, section: 'work', order: 1, visible: true },
  { fieldId: 'month', label: 'Month', type: 'text', required: true, system: true, section: 'work', order: 2, visible: true },
  { fieldId: 'worktype', label: 'Work Type', type: 'dropdown', required: true, system: true, section: 'work', order: 3, visible: true },
  { fieldId: 'layingWork', label: 'Laying Work', type: 'dropdown', required: true, system: true, section: 'work', order: 4, visible: true },
  { fieldId: 'package', label: 'Package No.', type: 'dropdown', required: true, system: true, section: 'location', order: 0, visible: true },
  { fieldId: 'zone', label: 'Zone No.', type: 'dropdown', required: true, system: true, section: 'location', order: 1, visible: true },
  { fieldId: 'dma', label: 'DMA No.', type: 'dropdown', required: true, system: true, section: 'location', order: 2, visible: true },
  { fieldId: 'stretch', label: 'Transmission Stretch Name', type: 'text', required: false, system: true, section: 'location', order: 3, visible: true, layingWork: 'Transmission' },
  { fieldId: 'pipeDia', label: 'Pipe Dia', type: 'dropdown', required: true, system: true, section: 'pipe', order: 0, visible: true },
  { fieldId: 'layingLength', label: 'Laying Length', type: 'number', required: true, system: true, section: 'pipe', order: 1, visible: true },
  { fieldId: 'ferrule', label: 'Ferrule', type: 'number', required: false, system: true, section: 'fittings', order: 0, visible: true },
  { fieldId: 'ballValve', label: 'Ball Valve', type: 'number', required: false, system: true, section: 'fittings', order: 1, visible: true },
  { fieldId: 'meterBox', label: 'Meter Box', type: 'number', required: false, system: true, section: 'fittings', order: 2, visible: true },
  { fieldId: 'waterMeter', label: 'Water Meter', type: 'number', required: false, system: true, section: 'fittings', order: 3, visible: true },
  { fieldId: 'noOfTeam', label: 'No of Team', type: 'number', required: true, system: true, section: 'manpower', order: 0, visible: true },
  { fieldId: 'manpower', label: 'Total Working Manpower', type: 'number', required: true, system: true, section: 'manpower', order: 1, visible: true },
  { fieldId: 'workTime', label: 'Work Time', type: 'number', required: true, system: true, section: 'manpower', order: 2, visible: true },
  { fieldId: 'contractor', label: 'Contractor', type: 'dropdown', required: true, system: true, section: 'contractor', order: 0, visible: true },
  { fieldId: 'remark', label: 'Remark', type: 'textarea', required: false, system: true, section: 'remarks', order: 0, visible: true }
];

/* =============================================
   INITIALIZE DEFAULT FIELDS
   ============================================= */
async function initializeDefaultFields() {
  try {
    const existing = await DataService.getAll(COLLECTIONS.FIELD_DEFS);
    if (existing.length === 0) {
      // Save default field definitions
      for (const def of DEFAULT_FIELD_DEFS) {
        await DataService.add(COLLECTIONS.FIELD_DEFS, def);
      }
      State.fieldDefs = [...DEFAULT_FIELD_DEFS];
      AppUtils.toast('Default field definitions initialized.');
    }
  } catch (e) {
    console.error('Error initializing default fields:', e);
  }
}

/* =============================================
   ADD CUSTOM FIELD
   ============================================= */
async function addCustomField(e) {
  e.preventDefault();

  const label = document.getElementById('af_label').value.trim();
  let fieldId = document.getElementById('af_fieldId').value.trim();
  const type = document.getElementById('af_type').value;
  const layingWork = document.getElementById('af_layingWork').value;
  const section = document.getElementById('af_section').value;
  const order = parseInt(document.getElementById('af_order').value) || 0;
  const required = document.getElementById('af_required').checked;
  const options = document.getElementById('af_options').value.trim();

  if (!label || !fieldId || !type) {
    AppUtils.toast('Please fill in all required fields.', true);
    return;
  }

  // Auto-generate fieldId from label if not provided
  if (!fieldId) {
    fieldId = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  // Check for duplicate fieldId
  const existing = (State.fieldDefs || []).find(f => f.fieldId === fieldId);
  if (existing) {
    AppUtils.toast(`Field ID "${fieldId}" already exists.`, true);
    return;
  }

  const fieldDef = {
    fieldId,
    label,
    type,
    required,
    system: false,
    section,
    order,
    visible: true,
    createdAt: new Date().toISOString()
  };

  if (layingWork) fieldDef.layingWork = layingWork;
  if (type === 'dropdown' && options) fieldDef.options = options;

  try {
    const docRef = await DataService.add(COLLECTIONS.FIELD_DEFS, fieldDef);
    fieldDef.id = docRef.id;
    State.fieldDefs.push(fieldDef);

    AppUtils.toast(`Field "${label}" added successfully.`);
    document.getElementById('addFieldForm').reset();
    document.getElementById('af_optionsRow').style.display = 'none';
    renderFieldList();

    // Notify other modules
    window.dispatchEvent(new CustomEvent('fielddefs:changed'));
  } catch (e) {
    console.error('Error adding field:', e);
    AppUtils.toast('Could not add field. Try again.', true);
  }
}

/* =============================================
   RENDER FIELD LIST
   ============================================= */
function renderFieldList() {
  const container = document.getElementById('field-definitions-list');
  if (!container) return;

  const fieldDefs = [...(State.fieldDefs || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (fieldDefs.length === 0) {
    container.innerHTML = `
      <div class="field-list-empty">
        <i class="fa-solid fa-layer-group"></i>
        <p>No field definitions yet. Add your first custom field above.</p>
      </div>`;
    return;
  }

  container.innerHTML = fieldDefs.map((f, index) => {
    const isSystem = f.system === true;
    const typeClass = `type-${f.type}`;
    const sectionClass = `section-${f.section || 'custom'}`;
    const sectionLabels = {
      work: 'Work', location: 'Location', pipe: 'Pipe',
      fittings: 'Fittings', manpower: 'Manpower',
      contractor: 'Contractor', remarks: 'Remarks', custom: 'Custom'
    };

    return `
      <div class="field-def-item ${isSystem ? 'system-field' : ''}" data-field-id="${f.id || f.fieldId}" data-index="${index}" draggable="${!isSystem}">
        <div class="field-def-drag-handle" style="${isSystem ? 'opacity:0.4;' : ''}">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>
        <div class="field-def-info">
          <div class="fd-label">
            ${AppUtils.esc(f.label)}
            ${f.required ? '<span class="fd-required-badge">Required</span>' : ''}
            ${f.layingWork ? `<span class="laying-filter-badge">${AppUtils.esc(f.layingWork)}</span>` : ''}
          </div>
          <div class="fd-meta">
            <span class="section-badge ${sectionClass}">${sectionLabels[f.section] || f.section}</span>
            <span style="margin-left:6px; color:var(--app-muted-2);">ID: ${AppUtils.esc(f.fieldId)}</span>
          </div>
        </div>
        <div class="field-def-type-badge ${typeClass}">${f.type}</div>
        <div class="field-def-actions">
          ${!isSystem ? `
            <button class="visibility-toggle" data-id="${f.id || f.fieldId}" title="${f.visible !== false ? 'Hide' : 'Show'} field">
              <i class="fa-solid ${f.visible !== false ? 'fa-eye' : 'fa-eye-slash'}"></i>
            </button>
            <button class="delete" data-id="${f.id || f.fieldId}" title="Delete field">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : '<span style="font-size:10px; color:var(--app-muted-2); padding:6px;">System</span>'}
        </div>
      </div>
    `;
  }).join('');

  // Attach drag events
  if (!isSystem) setupDragAndDrop();

  // Attach action events
  container.querySelectorAll('.visibility-toggle').forEach(btn => {
    btn.addEventListener('click', () => toggleFieldVisibility(btn.dataset.id));
  });

  container.querySelectorAll('.field-def-actions .delete').forEach(btn => {
    btn.addEventListener('click', () => deleteField(btn.dataset.id));
  });
}

/* =============================================
   DRAG AND DROP
   ============================================= */
let dragSrcEl = null;

function setupDragAndDrop() {
  const items = document.querySelectorAll('.field-def-item:not(.system-field)');

  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  dragSrcEl = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.stopPropagation();

  if (dragSrcEl !== this) {
    const container = document.getElementById('field-definitions-list');
    const items = [...container.querySelectorAll('.field-def-item')];
    const srcIndex = items.indexOf(dragSrcEl);
    const targetIndex = items.indexOf(this);

    // Reorder in state
    const fieldDefs = [...State.fieldDefs].sort((a, b) => (a.order || 0) - (b.order || 0));
    const [moved] = fieldDefs.splice(srcIndex, 1);
    fieldDefs.splice(targetIndex, 0, moved);

    // Update orders
    fieldDefs.forEach((f, i) => {
      f.order = i;
    });

    State.fieldDefs = fieldDefs;

    // Save to Firebase
    saveFieldOrder(fieldDefs);

    // Re-render
    renderFieldList();

    AppUtils.toast('Field order updated.');
  }

  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.field-def-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

async function saveFieldOrder(fieldDefs) {
  try {
    const promises = fieldDefs.map(f => {
      if (f.id) {
        return DataService.update(COLLECTIONS.FIELD_DEFS, f.id, { order: f.order });
      }
      return Promise.resolve();
    });
    await Promise.all(promises);
  } catch (e) {
    console.error('Error saving field order:', e);
  }
}

/* =============================================
   TOGGLE FIELD VISIBILITY
   ============================================= */
async function toggleFieldVisibility(fieldId) {
  const idx = State.fieldDefs.findIndex(f => (f.id || f.fieldId) === fieldId);
  if (idx === -1) return;

  const field = State.fieldDefs[idx];
  const newVisible = field.visible === false ? true : false;

  try {
    if (field.id) {
      await DataService.update(COLLECTIONS.FIELD_DEFS, field.id, { visible: newVisible });
    }
    State.fieldDefs[idx].visible = newVisible;
    renderFieldList();
    window.dispatchEvent(new CustomEvent('fielddefs:changed'));
    AppUtils.toast(`Field "${field.label}" ${newVisible ? 'visible' : 'hidden'}.`);
  } catch (e) {
    console.error('Error toggling visibility:', e);
    AppUtils.toast('Could not update visibility.', true);
  }
}

/* =============================================
   DELETE FIELD
   ============================================= */
async function deleteField(fieldId) {
  const field = State.fieldDefs.find(f => (f.id || f.fieldId) === fieldId);
  if (!field) return;

  if (field.system) {
    AppUtils.toast('System fields cannot be deleted.', true);
    return;
  }

  // Set up confirm modal
  document.getElementById('confirm-msg').textContent = `Delete custom field "${field.label}"? This will remove it from all DPR forms.`;
  document.getElementById('modal-confirm-title').textContent = 'Delete Field';

  const confirmBtn = document.getElementById('confirm-btn');
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener('click', async () => {
    closeModal('modal-confirm');
    try {
      if (field.id) {
        await DataService.delete(COLLECTIONS.FIELD_DEFS, field.id);
      }
      State.fieldDefs = State.fieldDefs.filter(f => (f.id || f.fieldId) !== fieldId);
      renderFieldList();
      window.dispatchEvent(new CustomEvent('fielddefs:changed'));
      AppUtils.toast(`Field "${field.label}" deleted.`);
    } catch (e) {
      console.error('Error deleting field:', e);
      AppUtils.toast('Could not delete field.', true);
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
   ADMIN NAVIGATION
   ============================================= */
function setupAdminNav() {
  const navBtns = document.querySelectorAll('.admin-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.adminTab;

      // Update nav
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update subviews
      document.querySelectorAll('.admin-subview').forEach(v => v.classList.remove('active'));
      const subview = document.getElementById(`admin-${tab}`);
      if (subview) subview.classList.add('active');
    });
  });
}

/* =============================================
   FIELD TYPE CHANGE HANDLER
   ============================================= */
function setupFieldTypeHandler() {
  const typeSelect = document.getElementById('af_type');
  const optionsRow = document.getElementById('af_optionsRow');

  if (typeSelect && optionsRow) {
    typeSelect.addEventListener('change', () => {
      if (typeSelect.value === 'dropdown') {
        optionsRow.style.display = 'block';
        document.getElementById('af_options').required = true;
      } else {
        optionsRow.style.display = 'none';
        document.getElementById('af_options').required = false;
      }
    });
  }
}

/* =============================================
   AUTO-GENERATE FIELD ID
   ============================================= */
function setupAutoFieldId() {
  const labelInput = document.getElementById('af_label');
  const fieldIdInput = document.getElementById('af_fieldId');

  if (labelInput && fieldIdInput) {
    labelInput.addEventListener('blur', () => {
      if (!fieldIdInput.value && labelInput.value) {
        fieldIdInput.value = labelInput.value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      }
    });
  }
}

/* =============================================
   SAVE SETTINGS
   ============================================= */
async function saveSettings() {
  const snoStart = parseInt(document.getElementById('setting_sno_start').value) || 1;
  const pageSize = parseInt(document.getElementById('setting_page_size').value) || 50;

  try {
    await DataService.set(COLLECTIONS.SETTINGS, 'default', {
      snoStart,
      pageSize,
      updatedAt: new Date().toISOString()
    });

    State.settings = { snoStart, pageSize };
    AppUtils.toast('Settings saved.');
  } catch (e) {
    console.error('Error saving settings:', e);
    AppUtils.toast('Could not save settings.', true);
  }
}

/* =============================================
   INITIALIZATION
   ============================================= */
async function init() {
  // Setup handlers
  setupAdminNav();
  setupFieldTypeHandler();
  setupAutoFieldId();

  // Add field form
  const addFieldForm = document.getElementById('addFieldForm');
  if (addFieldForm) {
    addFieldForm.addEventListener('submit', addCustomField);
  }

  // Save settings
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }

  // Navigation
  window.addEventListener('app:navigate', (e) => {
    if (e.detail.page === 'admin') {
      renderFieldList();
    }
  });

  // Boot
  window.addEventListener('app:boot', async () => {
    await initializeDefaultFields();
    renderFieldList();
  });
}

init();

/* =============================================
   EXPORTS
   ============================================= */
export { renderFieldList, initializeDefaultFields };
