/* =============================================
   APP MODULE - Main Application Shell
   Navigation | Utilities | Toast | Modals | Initialization
   ============================================= */

import { DataService, COLLECTIONS } from './firebase.js';
import { State, Utils } from './auth.js';

/* =============================================
   SHARED STATE
   ============================================= */
// Ensure state is global for inline handlers
window.AppState = State;

/* =============================================
   MASTER DATA
   ============================================= */
const MASTER_DATA = [
  {"p":1,"zn":3,"z":"Dhalli","d":3},{"p":1,"zn":3,"z":"Dhalli","d":2},
  {"p":1,"zn":3,"z":"Dhalli","d":1},{"p":1,"zn":2,"z":"Mashobra","d":2},
  {"p":1,"zn":2,"z":"Mashobra","d":1},{"p":1,"zn":1,"z":"Craignano","d":1},
  {"p":10,"zn":49,"z":"Bhimakali Temple","d":3},{"p":10,"zn":49,"z":"Bhimakali Temple","d":2},
  {"p":10,"zn":49,"z":"Bhimakali Temple","d":1},{"p":10,"zn":48,"z":"Baluganj Hari Nagar-NEW Tank","d":2},
  {"p":10,"zn":48,"z":"Baluganj Hari Nagar-NEW Tank","d":1},{"p":10,"zn":52,"z":"Summer Hill Bazar-New Tank","d":1},
  {"p":10,"zn":51,"z":"Kamnadevi Temple","d":1},{"p":10,"zn":41,"z":"Chakkar/Sandal","d":1},
  {"p":10,"zn":47,"z":"Adv Study Steel","d":1},{"p":10,"zn":50,"z":"IIA Summerhill","d":1},
  {"p":10,"zn":42,"z":"Kamna Devi-New Tank","d":1},{"p":2,"zn":8,"z":"Sanjauli Tank","d":2},
  {"p":2,"zn":8,"z":"Sanjauli Tank","d":1},{"p":2,"zn":7,"z":"Dhingodevi-4-NEW Tank","d":1},
  {"p":2,"zn":12,"z":"North Oak-1-New Tank","d":1},{"p":2,"zn":5,"z":"Dhingodevi_2","d":1},
  {"p":2,"zn":4,"z":"Dhingodevi_1","d":1},{"p":2,"zn":6,"z":"Dhingodevi_3","d":1},
  {"p":3,"zn":53,"z":"Tapping Point Near Navbahar Chauk","d":1},{"p":3,"zn":11,"z":"Navbahar-New Tank","d":1},
  {"p":3,"zn":9,"z":"Jakhu Tank","d":1},{"p":3,"zn":10,"z":"Jakhu-Tank (UC)","d":2},
  {"p":3,"zn":10,"z":"Jakhu-Tank (UC)","d":1},{"p":4,"zn":16,"z":"Tara Hall-New Tank","d":2},
  {"p":4,"zn":15,"z":"Kelestone1-OHT","d":1},{"p":4,"zn":14,"z":"Kelston-2/Bharari","d":1},
  {"p":4,"zn":13,"z":"Tapping Point Near Ridge","d":1},{"p":4,"zn":16,"z":"Tara Hall-New Tank","d":1},
  {"p":4,"zn":13,"z":"Tapping Point Near Ridge","d":3},{"p":4,"zn":13,"z":"Tapping Point Near Ridge","d":2},
  {"p":5,"zn":22,"z":"Panthaghati-New Tank","d":2},{"p":5,"zn":18,"z":"IAS Colony-2-New Tank","d":1},
  {"p":5,"zn":22,"z":"Panthaghati-New Tank","d":1},{"p":5,"zn":17,"z":"Vasant Vihar-New Tank","d":1},
  {"p":5,"zn":20,"z":"Kasumpti-New Tank","d":1},{"p":5,"zn":20,"z":"Kasumpti-New Tank","d":2},
  {"p":5,"zn":21,"z":"HP PWD-OHT","d":1},{"p":5,"zn":23,"z":"Vasant Vihar-1","d":1},
  {"p":6,"zn":24,"z":"Vidhan Sabha-New Tank","d":1},{"p":6,"zn":25,"z":"Shanti Vihar","d":1},
  {"p":6,"zn":24,"z":"Vidhan Sabha-New Tank","d":2},{"p":6,"zn":27,"z":"Ark-New Tank","d":1},
  {"p":6,"zn":27,"z":"Ark-New Tank","d":2},{"p":6,"zn":26,"z":"Chotta-1,2,3-New Tank","d":1},
  {"p":7,"zn":29,"z":"Lichu-Krishna Nagar","d":1},{"p":7,"zn":30,"z":"HIMLAND-BCS","d":1},
  {"p":7,"zn":30,"z":"HIMLAND-BCS","d":2},{"p":7,"zn":28,"z":"Shimla East-Nabha","d":1},
  {"p":7,"zn":28,"z":"Shimla East-Nabha","d":2},{"p":7,"zn":31,"z":"Lichu-New Tank","d":1},
  {"p":7,"zn":29,"z":"Lichu-Krishna Nagar","d":2},{"p":8,"zn":33,"z":"Boileauganj-1,2,3","d":1},
  {"p":8,"zn":34,"z":"Kashyap-Nagar","d":1},{"p":8,"zn":34,"z":"Kashyap-Nagar","d":2},
  {"p":8,"zn":32,"z":"New Shivalik-1,2","d":1},{"p":8,"zn":33,"z":"Boileauganj-1,2,3","d":2},
  {"p":8,"zn":32,"z":"New Shivalik-1,2","d":2},{"p":9,"zn":37,"z":"Mehli-Gumma","d":1},
  {"p":9,"zn":36,"z":"Gumma-Knolls","d":1},{"p":9,"zn":37,"z":"Mehli-Gumma","d":2},
  {"p":9,"zn":35,"z":"Kashyap-Nagar","d":1},{"p":9,"zn":38,"z":"Upper Kalyan-New Tank","d":1},
  {"p":9,"zn":38,"z":"Upper Kalyan-New Tank","d":2},{"p":9,"zn":36,"z":"Gumma-Knolls","d":2},
  {"p":10,"zn":40,"z":"Panthaghati UC","d":1},{"p":10,"zn":43,"z":"Baluganj UC","d":1},
  {"p":10,"zn":44,"z":"VikasNagar UC","d":1},{"p":10,"zn":39,"z":"Lower Kalyan UC","d":1},
  {"p":10,"zn":45,"z":"Craignano UC","d":1},{"p":10,"zn":46,"z":"Panthaghati-2 UC","d":1}
];

const PIPE_DIAMETERS = [15,20,25,32,40,50,63,75,80,90,100,110,125,140,150,160,180,200,225,250,280,300,315,350,400,450,500,600];
const CONTRACTORS = ["SAI","Rohit","Kulbhushan","Khajan Singh","Jarnail Singh","RK","Shabdbhaid","Brij","Roshan","Chandresh","Mahindar","Ajay Thakur","Sandeep","Surendar Hansreta"];

/* =============================================
   UTILITY FUNCTIONS
   ============================================= */
const AppUtils = {
  todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  },

  monthLabel(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  },

  fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  },

  clampNonNegative(e) {
    const el = e.target;
    if (el.value !== "" && Number(el.value) < 0) el.value = "0";
  },

  preventMinus(e) {
    if (e.key === "-" || e.key === "+") e.preventDefault();
  },

  cleanNum(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : Math.max(0, n);
  },

  debounce(fn, delay) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
  },

  csvField(v) {
    const s = String(v == null ? "" : v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  },

  setButtonLoading(btn, loading, originalHtml) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    } else {
      btn.innerHTML = btn.dataset.originalHtml || originalHtml || btn.innerHTML;
    }
  },

  esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  },

  toast(title, isErr = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' err' : '');
    el.innerHTML = `<i class="fa-solid ${isErr ? 'fa-circle-exclamation' : 'fa-check'}"></i><span>${this.esc(title)}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
};

// Make utils globally available
window.AppUtils = AppUtils;

/* =============================================
   NAVIGATION
   ============================================= */
function setActiveTab(page) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${page}"]`);
  if (btn) btn.classList.add('active');
  const view = document.getElementById(`view-${page}`);
  if (view) view.classList.add('active');
}

function navigateTo(page) {
  if (page === 'engineers' && State.currentRole !== 'admin') return;
  if (page === 'admin' && State.currentRole !== 'admin') return;

  State.currentPage = page;
  setActiveTab(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Dispatch navigation event for other modules
  window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page } }));
}

/* =============================================
   MODAL HANDLING
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
   LOADING SCREEN
   ============================================= */
function hideLoading() {
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.style.opacity = '0';
      ls.style.transition = 'opacity 0.4s ease';
      setTimeout(() => ls.style.display = 'none', 400);
    }
  }, 600);
}

/* =============================================
   POPULATE STATIC DROPDOWNS
   ============================================= */
function populateStaticSelects() {
  // Package dropdown
  const packageSel = document.getElementById('f_package');
  if (packageSel && packageSel.options.length <= 1) {
    const packages = [...new Set(MASTER_DATA.map(r => r.p))].sort((a, b) => a - b);
    packages.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = 'Package ' + p;
      packageSel.appendChild(opt);
    });
  }

  // Pipe diameter dropdown
  const pipeDiaSel = document.getElementById('f_pipeDia');
  if (pipeDiaSel && pipeDiaSel.options.length <= 1) {
    PIPE_DIAMETERS.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d + ' mm';
      pipeDiaSel.appendChild(opt);
    });
  }

  // Contractor dropdown
  const contractorSel = document.getElementById('f_contractor');
  if (contractorSel && contractorSel.options.length <= 1) {
    CONTRACTORS.slice().sort((a, b) => a.localeCompare(b)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      contractorSel.appendChild(opt);
    });
  }

  // Filter dropdowns
  const filtPackage = document.getElementById('filt_package');
  if (filtPackage && filtPackage.options.length <= 1) {
    const packages = [...new Set(MASTER_DATA.map(r => r.p))].sort((a, b) => a - b);
    packages.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = 'Package ' + p;
      filtPackage.appendChild(opt);
    });
  }

  const filtContractor = document.getElementById('filt_contractor');
  if (filtContractor && filtContractor.options.length <= 1) {
    CONTRACTORS.slice().sort((a, b) => a.localeCompare(b)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      filtContractor.appendChild(opt);
    });
  }
}

/* =============================================
   EVENT LISTENERS
   ============================================= */
function setupEventListeners() {
  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.tab;
      if (page) navigateTo(page);
    });
  });

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      AppUtils.toast('Refreshing data...');
      window.dispatchEvent(new CustomEvent('app:refresh'));
    });
  }

  // Confirm modal
  const modalConfirm = document.getElementById('modal-confirm');
  if (modalConfirm) {
    modalConfirm.addEventListener('click', (e) => {
      if (e.target === modalConfirm) closeModal('modal-confirm');
    });
  }

  const modalConfirmClose = document.getElementById('modal-confirm-close');
  if (modalConfirmClose) {
    modalConfirmClose.addEventListener('click', () => closeModal('modal-confirm'));
  }

  const confirmCancel = document.getElementById('confirm-cancel');
  if (confirmCancel) {
    confirmCancel.addEventListener('click', () => closeModal('modal-confirm'));
  }
}

/* =============================================
   APP BOOT
   ============================================= */
async function bootApp() {
  try {
    // Load all data in parallel
    const results = await DataService.loadMultiple([
      { key: 'engineers', collectionName: COLLECTIONS.ENGINEERS, options: { orderBy: 'name' } },
      { key: 'dprs', collectionName: COLLECTIONS.DPR, options: { orderBy: 'date' } },
      { key: 'fieldDefs', collectionName: COLLECTIONS.FIELD_DEFS, options: { orderBy: 'order' } },
      { key: 'settings', collectionName: COLLECTIONS.SETTINGS }
    ]);

    State.engineers = results.engineers || [];
    State.dprs = results.dprs || [];
    State.fieldDefs = results.fieldDefs || [];

    // Process settings
    const settingsArr = results.settings || [];
    if (settingsArr.length > 0) {
      const s = settingsArr[0];
      State.settings = {
        snoStart: s.snoStart || 1,
        pageSize: s.pageSize || 50
      };
    }

    // Reverse DPRs for newest first
    State.dprs.reverse();

    State.dataLoaded = true;

    // Show app
    hideLoading();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('eng-select-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    const isAdmin = State.currentRole === 'admin';
    document.getElementById('engineersTabBtn').style.display = isAdmin ? '' : 'none';
    document.getElementById('adminTabBtn').style.display = isAdmin ? '' : 'none';

    // Update whoami
    const whoami = document.getElementById('whoami');
    if (whoami) {
      if (State.currentRole === 'admin') {
        whoami.innerHTML = AppUtils.esc(State.currentUser?.email?.split('@')[0] || 'Admin') + '<span class="role-tag">Admin</span>';
      } else if (State.currentRole === 'engineer' && State.currentEngineer) {
        whoami.innerHTML = AppUtils.esc(State.currentEngineer.name) + '<span class="role-tag">Engineer</span>';
      }
    }

    // Populate static dropdowns
    populateStaticSelects();

    // Navigate to entry
    navigateTo('entry');

    // Dispatch boot event
    window.dispatchEvent(new CustomEvent('app:boot'));

    AppUtils.toast('Welcome! Data loaded successfully.');
  } catch (e) {
    console.error('Boot error:', e);
    AppUtils.toast('Failed to load data. Please refresh.', true);
    hideLoading();
  }
}

/* =============================================
   AUTH EVENT LISTENER
   ============================================= */
window.addEventListener('auth:login', (e) => {
  bootApp();
});

/* =============================================
   INITIALIZATION
   ============================================= */
function init() {
  setupEventListeners();

  // Show login after brief loading
  setTimeout(() => {
    if (!State.currentRole && document.getElementById('loading-screen').style.display !== 'none') {
      hideLoading();
      document.getElementById('login-screen').style.display = 'block';
    }
  }, 1000);
}

// Initialize
init();

/* =============================================
   EXPORTS
   ============================================= */
export {
  AppUtils,
  MASTER_DATA,
  PIPE_DIAMETERS,
  CONTRACTORS,
  navigateTo,
  openModal,
  closeModal,
  hideLoading,
  setActiveTab
};
