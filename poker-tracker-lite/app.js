const STORAGE_KEY = "poker_tracker_lite_sessions_v1";

const form = document.getElementById("sessionForm");
const historyEl = document.getElementById("history");
const filtersEl = document.getElementById("typeFilters");
const summaryAllEl = document.getElementById("summaryAll");
const summary7El = document.getElementById("summary7");
const summary30El = document.getElementById("summary30");

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

inputs.date.valueAsDate = new Date();
render();

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const buyIn = Number(inputs.buyIn.value);
  const cashOut = Number(inputs.cashOut.value);

  const session = {
    id: crypto.randomUUID(),
    date: inputs.date.value,
    sessionType: inputs.sessionType.value,
    location: inputs.location.value.trim(),
    stake: inputs.stake.value.trim(),
    buyIn,
    cashOut,
    profit: cashOut - buyIn,
    notes: inputs.notes.value.trim(),
    createdAt: Date.now(),
  };

  sessions.push(session);
  saveSessions();
  form.reset();
  inputs.date.valueAsDate = new Date();
  inputs.sessionType.value = "cash";
  render();
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
        <div class="meta">${escapeHtml(s.location)} • ${escapeHtml(s.stake)}</div>
        <div class="meta">Buy-in ${money(s.buyIn)} → Cash-out/Payout ${money(s.cashOut)}</div>
        ${s.notes ? `<div class="meta">Notes: ${escapeHtml(s.notes)}</div>` : ""}
        <div class="row-actions">
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
      render();
    });
  });
}

function renderCharts(list) {
  const labels = list.map((s) => s.date);
  const profits = list.map((s) => s.profit);

  let running = 0;
  const cumulative = list.map((s) => {
    running += s.profit;
    return running;
  });

  const stakeMap = list.reduce((acc, s) => {
    acc[s.stake] = (acc[s.stake] || 0) + s.profit;
    return acc;
  }, {});
  const stakeLabels = Object.keys(stakeMap);
  const stakeProfits = stakeLabels.map((k) => stakeMap[k]);

  destroyCharts();

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

function render() {
  const filtered = getFilteredSessions();
  renderSummary(filtered);
  renderHistory(filtered);
  renderCharts(filtered);
}
