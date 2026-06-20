/* =============================================
   EXPORT MODULE
   CSV Export | Excel Export with SheetJS | Dynamic Columns
   ============================================= */

import { State } from './auth.js';
import { AppUtils } from './app.js';

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
   CSV FIELD ESCAPING
   ============================================= */
function csvField(v) {
  const s = String(v == null ? "" : v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/* =============================================
   GET DYNAMIC COLUMN DEFINITIONS
   ============================================= */
function getColumnDefinitions() {
  const columns = [
    { key: 'sno', label: 'S.No', width: 8 },
    { key: 'date', label: 'Date', width: 12 },
    { key: 'month', label: 'Month', width: 15 },
    { key: 'workType', label: 'Work Type', width: 15 },
    { key: 'layingWork', label: 'Laying Work', width: 18 }
  ];

  // Add conditional columns based on field definitions
  const fieldDefs = State.fieldDefs || [];

  // Location fields
  const hasLocation = fieldDefs.find(f => f.fieldId === 'package');
  if (hasLocation && hasLocation.visible !== false) {
    columns.push({ key: 'packageNo', label: 'Package No.', width: 12 });
    columns.push({ key: 'zoneName', label: 'Zone', width: 20 });
    columns.push({ key: 'dma', label: 'DMA No.', width: 10 });
  }

  // Transmission stretch
  const hasStretch = fieldDefs.find(f => f.fieldId === 'stretch');
  if (hasStretch && hasStretch.visible !== false) {
    columns.push({ key: 'stretch', label: 'Transmission Stretch', width: 30 });
  }

  // Pipe fields
  const hasPipe = fieldDefs.find(f => f.fieldId === 'pipeDia');
  if (hasPipe && hasPipe.visible !== false) {
    columns.push({ key: 'pipeDia', label: 'Pipe Dia (mm)', width: 14 });
    columns.push({ key: 'layingLength', label: 'Laying Length (m)', width: 16 });
  }

  // Fittings fields
  const hasFittings = fieldDefs.find(f => f.fieldId === 'ferrule');
  if (hasFittings && hasFittings.visible !== false) {
    columns.push({ key: 'ferrule', label: 'Ferrule', width: 10 });
    columns.push({ key: 'ballValve', label: 'Ball Valve', width: 11 });
    columns.push({ key: 'meterBox', label: 'Meter Box', width: 11 });
    columns.push({ key: 'waterMeter', label: 'Water Meter', width: 12 });
  }

  // Manpower
  const hasManpower = fieldDefs.find(f => f.fieldId === 'noOfTeam');
  if (hasManpower && hasManpower.visible !== false) {
    columns.push({ key: 'noOfTeam', label: 'No of Team', width: 11 });
    columns.push({ key: 'manpower', label: 'Manpower', width: 11 });
    columns.push({ key: 'workTime', label: 'Work Time (hrs)', width: 14 });
  }

  // Contractor
  const hasContractor = fieldDefs.find(f => f.fieldId === 'contractor');
  if (hasContractor && hasContractor.visible !== false) {
    columns.push({ key: 'contractor', label: 'Contractor', width: 18 });
  }

  // Remarks
  const hasRemark = fieldDefs.find(f => f.fieldId === 'remark');
  if (hasRemark && hasRemark.visible !== false) {
    columns.push({ key: 'remark', label: 'Remark', width: 30 });
  }

  // Custom admin fields
  const customFields = fieldDefs.filter(f => !f.system && f.visible !== false);
  customFields.forEach(f => {
    columns.push({
      key: f.fieldId,
      label: f.label,
      width: 18,
      custom: true
    });
  });

  // Metadata columns
  columns.push({ key: 'engineerName', label: 'Submitted By', width: 18 });
  columns.push({ key: 'createdAt', label: 'Submitted At', width: 18 });

  return columns;
}

/* =============================================
   EXPORT CSV
   ============================================= */
function exportCSV() {
  const rows = getFilteredData();
  if (rows.length === 0) {
    AppUtils.toast('Nothing to export with current filters.', true);
    return;
  }

  const columns = getColumnDefinitions();

  // Header
  const header = columns.map(c => csvField(c.label));
  const lines = [header.join(",")];

  // Data
  for (const r of rows) {
    const line = columns.map(col => {
      let val;
      if (col.custom && r.customFields) {
        val = r.customFields[col.key] || '';
      } else {
        val = r[col.key];
        if (val === undefined || val === null) val = '';
      }
      return csvField(val);
    });
    lines.push(line.join(','));
  }

  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "DPR_export_" + AppUtils.todayISO() + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  AppUtils.toast(`Exported ${rows.length} rows to CSV.`);
}

/* =============================================
   EXPORT EXCEL
   ============================================= */
function exportExcel() {
  const rows = getFilteredData();
  if (rows.length === 0) {
    AppUtils.toast('Nothing to export with current filters.', true);
    return;
  }

  // Check if XLSX is available
  if (typeof XLSX === 'undefined') {
    AppUtils.toast('Excel library not loaded. Try CSV export.', true);
    return;
  }

  const columns = getColumnDefinitions();

  // Build data array
  const data = [];

  // Header row
  const header = columns.map(c => c.label);
  data.push(header);

  // Data rows
  for (const r of rows) {
    const row = columns.map(col => {
      let val;
      if (col.custom && r.customFields) {
        val = r.customFields[col.key] || '';
      } else {
        val = r[col.key];
        if (val === undefined || val === null) val = '';
      }
      return val;
    });
    data.push(row);
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  const wscols = columns.map(c => ({ wch: c.width || 15 }));
  ws['!cols'] = wscols;

  // Style header (first row)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0E6B66" } },
        alignment: { horizontal: "center" }
      };
    }
  }

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };

  XLSX.utils.book_append_sheet(wb, ws, "DPR Entries");

  // Generate file
  const fileName = "DPR_export_" + AppUtils.todayISO() + ".xlsx";
  XLSX.writeFile(wb, fileName);

  AppUtils.toast(`Exported ${rows.length} rows to Excel.`);
}

/* =============================================
   CLEAR FILTERS
   ============================================= */
function clearFilters() {
  document.getElementById('filt_from').value = '';
  document.getElementById('filt_to').value = '';
  document.getElementById('filt_package').value = '';
  document.getElementById('filt_zone').value = '';
  document.getElementById('filt_dma').value = '';
  document.getElementById('filt_contractor').value = '';
  document.getElementById('filt_engineer').value = '';
  document.getElementById('filt_worktype').value = '';
  document.getElementById('filt_search').value = '';
  window.dispatchEvent(new CustomEvent('log:render'));
}

/* =============================================
   POPULATE ENGINEER FILTER
   ============================================= */
function populateEngineerFilter() {
  const sel = document.getElementById('filt_engineer');
  if (!sel) return;

  // Keep first option
  const firstOption = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(firstOption);

  const engineers = [...(State.engineers || [])].sort((a, b) => a.name.localeCompare(b.name));
  engineers.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name} (${e.empId})`;
    sel.appendChild(opt);
  });
}

/* =============================================
   INITIALIZATION
   ============================================= */
function init() {
  // CSV export
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportCSV);
  }

  // Excel export
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', exportExcel);
  }

  // Clear filters
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters);
  }

  // Populate engineer filter on boot
  window.addEventListener('app:boot', () => {
    populateEngineerFilter();
  });
}

init();

/* =============================================
   EXPORTS
   ============================================= */
export { exportCSV, exportExcel, getFilteredData, getColumnDefinitions, clearFilters };
