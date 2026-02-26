const STORAGE_KEY = "poker_tracker_lite_sessions_v1";

const form = document.getElementById("sessionForm");
const historyEl = document.getElementById("history");
const filtersEl = document.getElementById("typeFilters");
const summaryAllEl = document.getElementById("summaryAll");
const summary7El = document.getElementById("summary7");
const summary30El = document.getElementById("summary30");
const formTitleEl = document.getElementById("formTitle");
const saveBtnEl = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const advancedFieldsEl = document.getElementById("advancedFields");
const installBtn = document.getElementById("installBtn");
const offlineBanner = document.getElementById("offlineBanner");
const chartsStatusEl = document.getElementById("chartsStatus");

const inputs = {
  date: document.getElementById("date"),
  sessionType: document.getElementById("sessionType"),
  location: document.getElementById("location"),
  stake: document.getElementById("stake"),
  buyIn: document.getElementById("buyIn"),
  cashOut: document.getElementById("cashOut"),
  notes: document.getElementById("notes"),
};

let currentTypeFilter = "all";
let sessions = loadSessions();
let chartRefs = {};
let editingSessionId = null;
let deferredInstallPrompt = null;

resetFormForCreate();
render();
setupPwaAndOffline();

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const buyIn = Number(inputs.buyIn.value);
  const cashOut = Number(inputs.cashOut.value);

  const baseData = {
    date: inputs.date.value,
    sessionType: inputs.sessionType.value,
    location: inputs.location.value.trim(),
    stake: inputs.stake.value.trim(),
    buyIn,
    cashOut,
    profit: cashOut - buyIn,
    notes: inputs.notes.value.trim(),
  };

  if (editingSessionId) {
    sessions = sessions.map((s) => {
      if (s.id !== editingSessionId) return s;
      return {
        ...s,
        ...baseData,
        updatedAt: Date.now(),
      };
    });
  } else {
    sessions.push({
      id: crypto.randomUUID(),
      ...baseData,
      createdAt: Date.now(),
    });
  }

  saveSessions();
  resetFormForCreate();
  render();
});

cancelEditBtn.addEventListener("click", () => {
  resetFormForCreate();
});

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-type]");
  if (!btn) return;
  currentTypeFilter = btn.dataset.type;
  [...filtersEl.querySelectorAll("button")].forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  render();
});

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((session) => sanitizeSession(session));
  } catch {
    return [];
  }
}

function sanitizeSession(session) {
  const safe = session && typeof session === "object" ? session : {};
  const buyIn = toFiniteNumber(safe.buyIn);
  const cashOut = toFiniteNumber(safe.cashOut);
  const sessionType = safe.sessionType === "tournament" ? "tournament" : "cash";

  return {
    id: typeof safe.id === "string" && safe.id ? safe.id : crypto.randomUUID(),
    date: typeof safe.date === "string" && safe.date ? safe.date : "",
    sessionType,
    location: typeof safe.location === "string" ? safe.location : "",
    stake: typeof safe.stake === "string" ? safe.stake : "",
    buyIn,
    cashOut,
    profit: cashOut - buyIn,
    notes: typeof safe.notes === "string" ? safe.notes : "",
    createdAt: toFiniteNumber(safe.createdAt),
    updatedAt: toFiniteNumber(safe.updatedAt),
  };
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function getFilteredSessions() {
  const list = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date) || a.createdAt - b.createdAt);
  if (currentTypeFilter === "all") return list;
  return list.filter((s) => s.sessionType === currentTypeFilter);
}

function summarize(list) {
  const totalProfit = list.reduce((sum, s) => sum + s.profit, 0);
  const totalBuyIn = list.reduce((sum, s) => sum + s.buyIn, 0);
  const roi = totalBuyIn ? (totalProfit / totalBuyIn) * 100 : 0;
  const avg = list.length ? totalProfit / list.length : 0;
  return { count: list.length, totalProfit, avg, roi };
}

function summaryText(s) {
  return `${s.count} sessions • P/L ${money(s.totalProfit)} • Avg ${money(s.avg)} • ROI ${s.roi.toFixed(1)}%`;
}

function renderSummary(list) {
  const all = summarize(list);
  const recent7 = summarize(list.slice(-7));
  const recent30 = summarize(list.slice(-30));

  summaryAllEl.textContent = summaryText(all);
  summary7El.textContent = summaryText(recent7);
  summary30El.textContent = summaryText(recent30);
}

function renderHistory(list) {
  if (!list.length) {
    historyEl.innerHTML = `<p class="meta">No sessions yet. Add your first one above.</p>`;
    return;
  }

  historyEl.innerHTML = list
    .slice()
    .reverse()
    .map((s) => {
      const cls = s.profit >= 0 ? "profit-pos" : "profit-neg";
      return `
      <article class="session-item">
        <div class="session-top">
          <strong>${escapeHtml(s.date)} • ${escapeHtml(cap(s.sessionType))}</strong>
          <span class="${cls}">${money(s.profit)}</span>
        </div>
        <div class="meta">${escapeHtml(s.location || "(No location)")} • ${escapeHtml(s.stake || "(No stake label)")}</div>
        <div class="meta">Buy-in ${money(s.buyIn)} → Cash-out/Payout ${money(s.cashOut)}</div>
        ${s.notes ? `<div class="meta">Notes: ${escapeHtml(s.notes)}</div>` : ""}
        <div class="row-actions">
          <button class="edit-btn" data-edit-id="${s.id}">Edit</button>
          <button class="delete-btn" data-delete-id="${s.id}">Delete</button>
        </div>
      </article>`;
    })
    .join("");

  historyEl.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteId;
      sessions = sessions.filter((s) => s.id !== id);
      saveSessions();
      if (editingSessionId === id) resetFormForCreate();
      render();
    });
  });

  historyEl.querySelectorAll("[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.editId;
      startEdit(id);
    });
  });
}

function renderCharts(list) {
  const chartSupported = typeof window.Chart === "function";
  const canvases = [
    document.getElementById("profitOverTimeChart"),
    document.getElementById("cumulativeBankrollChart"),
    document.getElementById("profitByStakeChart"),
  ];

  destroyCharts();

  if (!chartSupported) {
    canvases.forEach((canvas) => {
      if (!canvas) return;
      canvas.hidden = true;
      if (canvas.parentElement) canvas.parentElement.hidden = true;
    });
    if (chartsStatusEl) {
      chartsStatusEl.hidden = false;
      chartsStatusEl.textContent = "Charts unavailable right now (Chart.js failed to load). Your sessions and summaries still work.";
    }
    return;
  }

  canvases.forEach((canvas) => {
    if (!canvas) return;
    canvas.hidden = false;
    if (canvas.parentElement) canvas.parentElement.hidden = false;
  });
  if (chartsStatusEl) {
    chartsStatusEl.hidden = Boolean(list.length);
    chartsStatusEl.textContent = "Add sessions to see charts.";
  }

  const labels = list.map((s) => s.date);
  const profits = list.map((s) => s.profit);

  let running = 0;
  const cumulative = list.map((s) => {
    running += s.profit;
    return running;
  });

  const stakeMap = list.reduce((acc, s) => {
    const key = s.stake || "Unknown";
    acc[key] = (acc[key] || 0) + s.profit;
    return acc;
  }, {});
  const stakeLabels = Object.keys(stakeMap);
  const stakeProfits = stakeLabels.map((k) => stakeMap[k]);

  chartRefs.profitOverTime = new Chart(document.getElementById("profitOverTimeChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Profit per Session",
        data: profits,
        backgroundColor: profits.map((p) => (p >= 0 ? "#34d399" : "#f87171")),
      }],
    },
    options: baseOptions(),
  });

  chartRefs.cumulativeBankroll = new Chart(document.getElementById("cumulativeBankrollChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Cumulative Bankroll",
        data: cumulative,
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.25)",
        fill: true,
        tension: 0.2,
      }],
    },
    options: baseOptions(),
  });

  chartRefs.profitByStake = new Chart(document.getElementById("profitByStakeChart"), {
    type: "bar",
    data: {
      labels: stakeLabels,
      datasets: [{
        label: "Profit by Stake",
        data: stakeProfits,
        backgroundColor: stakeProfits.map((p) => (p >= 0 ? "#22c55e" : "#ef4444")),
      }],
    },
    options: baseOptions(),
  });
}

function destroyCharts() {
  Object.values(chartRefs).forEach((c) => c?.destroy());
  chartRefs = {};
}

function baseOptions() {
  return {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#f9fafb" } },
    },
    scales: {
      x: { ticks: { color: "#e5e7eb" }, grid: { color: "#1f2937" } },
      y: { ticks: { color: "#e5e7eb" }, grid: { color: "#1f2937" } },
    },
  };
}

function money(n) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function cap(v) {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetFormForCreate() {
  editingSessionId = null;
  form.reset();
  inputs.date.valueAsDate = new Date();
  inputs.sessionType.value = "cash";
  formTitleEl.textContent = "Quick Add Session";
  saveBtnEl.textContent = "Save Session";
  cancelEditBtn.hidden = true;
  advancedFieldsEl.open = false;
}

function startEdit(id) {
  const session = sessions.find((s) => s.id === id);
  if (!session) return;

  editingSessionId = id;
  inputs.date.value = session.date;
  inputs.sessionType.value = session.sessionType;
  inputs.location.value = session.location;
  inputs.stake.value = session.stake;
  inputs.buyIn.value = session.buyIn;
  inputs.cashOut.value = session.cashOut;
  inputs.notes.value = session.notes;

  formTitleEl.textContent = "Edit Session";
  saveBtnEl.textContent = "Update Session";
  cancelEditBtn.hidden = false;
  if (session.location || session.stake || session.notes) advancedFieldsEl.open = true;

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupPwaAndOffline() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // no-op: app still works online without SW
      });
    });
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  const refreshOnlineState = () => {
    offlineBanner.hidden = navigator.onLine;
  };

  window.addEventListener("online", refreshOnlineState);
  window.addEventListener("offline", refreshOnlineState);
  refreshOnlineState();
}

function render() {
  const filtered = getFilteredSessions();
  renderSummary(filtered);
  renderHistory(filtered);
  renderCharts(filtered);
}
