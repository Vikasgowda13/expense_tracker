const API_URL = "http://localhost:5000/expenses";

// Category colours used across charts and badges
const CATEGORY_COLORS = {
  Food:          "#e67e22",
  Transport:     "#3b82f6",
  Shopping:      "#8b5cf6",
  Health:        "#ef4444",
  Entertainment: "#10b981",
  Other:         "#6b7280",
};

let allExpenses   = [];
let pendingDeleteId = null;
let donutChart    = null;
let barChart      = null;
let budgets       = JSON.parse(localStorage.getItem("budgets")) || {};

// ── DOM refs ────────────────────────────────────────────────────────────────
const expenseList      = document.getElementById("expenseList");
const recentExpenseList= document.getElementById("recentExpenseList");
const totalAmountEl    = document.getElementById("totalAmount");
const monthAmountEl    = document.getElementById("monthAmount");
const totalCountEl     = document.getElementById("totalCount");
const topCategoryEl    = document.getElementById("topCategory");
const modalOverlay     = document.getElementById("modalOverlay");
const deleteModal      = document.getElementById("deleteModal");
const modalTitle       = document.getElementById("modalTitle");
const formError        = document.getElementById("formError");
const titleInput       = document.getElementById("titleInput");
const amountInput      = document.getElementById("amountInput");
const categoryInput    = document.getElementById("categoryInput");
const dateInput        = document.getElementById("dateInput");
const descriptionInput = document.getElementById("descriptionInput");
const expenseIdInput   = document.getElementById("expenseId");
const searchInput      = document.getElementById("searchInput");
const filterCategory   = document.getElementById("filterCategory");
const filterMonth      = document.getElementById("filterMonth");
const loadingOverlay   = document.getElementById("loadingOverlay");

// ── Sidebar navigation ──────────────────────────────────────────────────────
document.querySelectorAll(".nav-item").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const target = link.dataset.section;

    document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));

    link.classList.add("active");
    document.getElementById(`section-${target}`).classList.add("active");

    // Control which filters are visible per section
    const search   = document.getElementById("searchInput");
    const catFilter = document.getElementById("filterCategory");
    const monFilter = document.getElementById("filterMonth");

    if (target === "dashboard") {
      search.style.display    = "flex";
      catFilter.style.display = "block";
      monFilter.style.display = "none";
    } else if (target === "expenses") {
      search.style.display    = "flex";
      catFilter.style.display = "block";
      monFilter.style.display = "block";
    } else {
      search.style.display    = "none";
      catFilter.style.display = "none";
      monFilter.style.display = "none";
    }

    // Refresh budget view when navigating to it
    if (target === "budgets") renderBudgets();
  });
});

// Show search + category filter by default on dashboard load
document.getElementById("searchInput").style.display    = "flex";
document.getElementById("filterCategory").style.display = "block";

// ── Toast notifications ─────────────────────────────────────────────────────
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ── Loading spinner ─────────────────────────────────────────────────────────
function showLoading()  { loadingOverlay.classList.remove("hidden"); }
function hideLoading()  { loadingOverlay.classList.add("hidden"); }

// ── Fetch expenses from backend ─────────────────────────────────────────────
async function loadExpenses() {
  showLoading();
  try {
    const res  = await fetch(API_URL);
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    allExpenses = data;

    applyFilters();
    updateSummary(allExpenses);
    updateDonutChart(allExpenses);
    updateBarChart(allExpenses);
    updateMonthlyTrend(allExpenses);
    renderRecentExpenses();
    populateMonthFilter(allExpenses);

  } catch (err) {
    expenseList.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not connect to the server. Make sure the backend is running.</p></div>`;
    console.error("Load error:", err);
  } finally {
    hideLoading();
  }
}

// ── Render expense list (All Expenses section) ──────────────────────────────
function renderExpenses(expenses) {
  expenseList.innerHTML = "";

  // Show count on opposite side of heading
  const countEl = document.getElementById("expenseCount");
  if (countEl) countEl.textContent = expenses.length > 0 ? `${expenses.length} record${expenses.length > 1 ? "s" : ""}` : "";

  if (expenses.length === 0) {
    expenseList.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No expenses match your search.</p></div>`;
    return;
  }

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach(exp => expenseList.appendChild(createExpenseCard(exp)));
}

// ── Render recent 5 expenses on dashboard ───────────────────────────────────
function renderRecentExpenses() {
  recentExpenseList.innerHTML = "";
  const recent = [...allExpenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recent.length === 0) {
    recentExpenseList.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No expenses yet.</p></div>`;
    return;
  }

  recent.forEach(exp => recentExpenseList.appendChild(createExpenseCard(exp)));
}

// ── Build a single expense card element ─────────────────────────────────────
function createExpenseCard(exp) {
  const card    = document.createElement("div");
  card.className = "expense-card";

  const dateStr = exp.date
    ? new Date(exp.date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })
    : "No date";

  card.innerHTML = `
    <div class="expense-info">
      <h4>${exp.title}
        <span class="category-badge badge-${exp.category}">${exp.category}</span>
      </h4>
      <div class="meta">${dateStr}</div>
      ${exp.description ? `<div class="desc">${exp.description}</div>` : ""}
    </div>
    <div class="expense-right">
      <div class="amount">$${parseFloat(exp.amount).toFixed(2)}</div>
      <div class="expense-actions">
        <button class="edit-btn" onclick="openEditModal('${exp._id}')" title="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="delete-btn" onclick="confirmDelete('${exp._id}')" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  return card;
}

// ── Summary cards ────────────────────────────────────────────────────────────
function updateSummary(expenses) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();
  const thisMonthExp = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonthExp.reduce((sum, e) => sum + e.amount, 0);

  // Find the highest spending category
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  totalAmountEl.textContent = `$${total.toFixed(2)}`;
  monthAmountEl.textContent = `$${monthTotal.toFixed(2)}`;
  totalCountEl.textContent  = expenses.length;
  topCategoryEl.textContent = topCat ? topCat[0] : "—";
}

// ── Donut chart (dashboard) ──────────────────────────────────────────────────
function updateDonutChart(expenses) {
  const totals = {};
  expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });

  const labels = Object.keys(totals);
  const values = Object.values(totals);
  const colors = labels.map(l => CATEGORY_COLORS[l] || "#ccc");
  const grand  = values.reduce((a, b) => a + b, 0);

  const ctx = document.getElementById("donutChart").getContext("2d");
  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }] },
    options: {
      cutout: "68%",
      plugins: { legend: { display: false } },
    },
  });

  // Render custom legend below the chart
  const legend = document.getElementById("categoryLegend");
  legend.innerHTML = "";
  labels.forEach((label, i) => {
    const pct = grand > 0 ? ((values[i] / grand) * 100).toFixed(1) : 0;
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span><span class="legend-dot" style="background:${colors[i]}"></span>${label}</span>
      <span>$${values[i].toFixed(2)} <span style="color:#aaa">(${pct}%)</span></span>
    `;
    legend.appendChild(item);
  });
}

// ── Bar chart — monthly spending comparison (dashboard) ─────────────────────
function updateBarChart(expenses) {
  const monthTotals = {};
  expenses.forEach(e => {
    const d   = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthTotals[key] = (monthTotals[key] || 0) + e.amount;
  });

  const sorted = Object.entries(monthTotals).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const labels = sorted.map(([k]) => {
    const [y, m] = k.split("-");
    return new Date(y, m - 1).toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
  });
  const values = sorted.map(([, v]) => v);

  const ctx = document.getElementById("barChart").getContext("2d");
  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Spending ($)",
        data: values,
        backgroundColor: "#7c3aed",
        borderRadius: 6,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#f0f0f0" } },
        x: { grid: { display: false } },
      },
    },
  });
}

// ── Monthly trend list (Trends section) ─────────────────────────────────────
function updateMonthlyTrend(expenses) {
  const monthlyTrend = document.getElementById("monthlyTrend");
  const monthTotals  = {};

  expenses.forEach(e => {
    const d   = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthTotals[key] = (monthTotals[key] || 0) + e.amount;
  });

  monthlyTrend.innerHTML = "";

  if (Object.keys(monthTotals).length === 0) {
    monthlyTrend.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>No data yet.</p></div>`;
    return;
  }

  Object.entries(monthTotals)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([key, total]) => {
      const [y, m] = key.split("-");
      const label  = new Date(y, m - 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });

      const item = document.createElement("div");
      item.className = "trend-item";
      item.innerHTML = `
        <span class="trend-left">📅 ${label}</span>
        <span class="trend-right">$${total.toFixed(2)} →</span>
      `;
      item.addEventListener("click", () => openMonthDetail(key, expenses));
      monthlyTrend.appendChild(item);
    });
}

// ── Month detail view with donut + bar charts ────────────────────────────────
let monthDonutChart = null;
let monthBarChart   = null;

function openMonthDetail(monthKey, expenses) {
  const [y, m] = monthKey.split("-");
  const label  = new Date(y, m - 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  // Filter expenses for this specific month
  const monthExp = expenses.filter(e => {
    const d   = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return key === monthKey;
  });

  document.getElementById("monthDetailTitle").textContent = label;
  document.getElementById("monthDetail").classList.remove("hidden");

  // Donut chart for this month's categories
  const catTotals = {};
  monthExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const labels = Object.keys(catTotals);
  const values = Object.values(catTotals);
  const colors = labels.map(l => CATEGORY_COLORS[l] || "#ccc");

  const dCtx = document.getElementById("monthDonutChart").getContext("2d");
  if (monthDonutChart) monthDonutChart.destroy();
  monthDonutChart = new Chart(dCtx, {
    type: "doughnut",
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }] },
    options: { cutout: "65%", plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } } },
  });

  // Bar chart comparing last 6 months
  const monthTotals = {};
  expenses.forEach(e => {
    const d   = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthTotals[key] = (monthTotals[key] || 0) + e.amount;
  });

  const sorted     = Object.entries(monthTotals).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const barLabels  = sorted.map(([k]) => {
    const [by, bm] = k.split("-");
    return new Date(by, bm - 1).toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
  });
  const barValues  = sorted.map(([, v]) => v);
  const barColors  = sorted.map(([k]) => k === monthKey ? "#7c3aed" : "#c4b5fd");

  const bCtx = document.getElementById("monthBarChart").getContext("2d");
  if (monthBarChart) monthBarChart.destroy();
  monthBarChart = new Chart(bCtx, {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [{ label: "Spent ($)", data: barValues, backgroundColor: barColors, borderRadius: 5 }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#f0f0f0" } },
        x: { grid: { display: false } },
      },
    },
  });

  // List of expenses for that month
  const listEl = document.getElementById("monthExpenseList");
  listEl.innerHTML = "<h4 style='font-size:0.85rem;color:var(--muted);text-transform:uppercase;margin-bottom:0.8rem;'>Expenses This Month</h4>";
  monthExp.sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach(exp => listEl.appendChild(createExpenseCard(exp)));

  // Scroll to detail panel
  document.getElementById("monthDetail").scrollIntoView({ behavior: "smooth" });
}

function closeMonthDetail() {
  document.getElementById("monthDetail").classList.add("hidden");
}

// ── Budget management ────────────────────────────────────────────────────────
function renderBudgets() {
  const categories = ["Food", "Transport", "Shopping", "Health", "Entertainment", "Other"];
  const list = document.getElementById("budgetList");
  list.innerHTML = "";

  // Calculate how much was spent per category this month
  const now = new Date();
  const thisMonthSpend = {};
  allExpenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      thisMonthSpend[e.category] = (thisMonthSpend[e.category] || 0) + e.amount;
    }
  });

  categories.forEach(cat => {
    const limit   = budgets[cat] || 0;
    const spent   = thisMonthSpend[cat] || 0;
    const pct     = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const level   = pct >= 100 ? "danger" : pct >= 75 ? "warning" : "safe";
    const statusMsg = limit > 0
      ? `<strong>${spent.toFixed(2)}</strong> spent of <strong>${limit.toFixed(2)}</strong> limit (<strong>${pct.toFixed(0)}%</strong>)`
      : "No budget set";

    const item = document.createElement("div");
    item.className = "budget-item";
    item.innerHTML = `
      <label>
        <span style="color:${CATEGORY_COLORS[cat]}; font-weight:600;">${cat}</span>
        <input type="number" id="budget-${cat}" value="${limit || ""}" placeholder="Set limit..." min="0" step="0.01" />
      </label>
      <div class="budget-bar-container">
        <div class="budget-bar ${level}" style="width:${pct}%"></div>
      </div>
      <div class="budget-status ${level}">${statusMsg}</div>
    `;
    list.appendChild(item);
  });
}

document.getElementById("saveBudgetsBtn").addEventListener("click", () => {
  const categories = ["Food", "Transport", "Shopping", "Health", "Entertainment", "Other"];
  categories.forEach(cat => {
    const val = parseFloat(document.getElementById(`budget-${cat}`).value);
    if (!isNaN(val) && val > 0) budgets[cat] = val;
    else delete budgets[cat];
  });
  localStorage.setItem("budgets", JSON.stringify(budgets));
  renderBudgets();
  showToast("Budgets saved ✓");
});

// ── Populate month filter dropdown dynamically from expense data ─────────────
function populateMonthFilter(expenses) {
  const months = new Set();

  expenses.forEach(e => {
    const d   = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.add(key);
  });

  // Keep the current selection if possible
  const current = filterMonth.value;
  filterMonth.innerHTML = `<option value="all">All Months</option>`;

  // Sort months newest first
  [...months].sort((a, b) => b.localeCompare(a)).forEach(key => {
    const [y, m] = key.split("-");
    const label  = new Date(y, m - 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
    const opt    = document.createElement("option");
    opt.value    = key;
    opt.textContent = label;
    if (key === current) opt.selected = true;
    filterMonth.appendChild(opt);
  });
}

// ── Filters ──────────────────────────────────────────────────────────────────
function applyFilters() {
  const query    = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const month    = filterMonth.value;

  const filtered = allExpenses.filter(e => {
    const matchSearch   = e.title.toLowerCase().includes(query) ||
                          (e.description || "").toLowerCase().includes(query);
    const matchCategory = category === "all" || e.category === category;

    // Match month filter using YYYY-MM key
    const d        = new Date(e.date);
    const expMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const matchMonth = month === "all" || expMonth === month;

    return matchSearch && matchCategory && matchMonth;
  });

  renderExpenses(filtered);
}

searchInput.addEventListener("input", applyFilters);
filterCategory.addEventListener("change", applyFilters);
filterMonth.addEventListener("change", applyFilters);

// ── Open modal (Add) ─────────────────────────────────────────────────────────
document.getElementById("openFormBtn").addEventListener("click", () => {
  modalTitle.textContent = "Add New Expense";
  expenseIdInput.value   = "";
  titleInput.value       = "";
  amountInput.value      = "";
  categoryInput.value    = "Food";
  dateInput.value        = getTodayDate();
  descriptionInput.value = "";
  formError.classList.add("hidden");
  modalOverlay.classList.remove("hidden");
});

// ── Open modal (Edit) ────────────────────────────────────────────────────────
function openEditModal(id) {
  const exp = allExpenses.find(e => e._id === id);
  if (!exp) return;

  modalTitle.textContent = "Edit Expense";
  expenseIdInput.value   = exp._id;
  titleInput.value       = exp.title;
  amountInput.value      = exp.amount;
  categoryInput.value    = exp.category;
  dateInput.value        = exp.date ? exp.date.split("T")[0] : "";
  descriptionInput.value = exp.description || "";
  formError.classList.add("hidden");
  modalOverlay.classList.remove("hidden");
}

// ── Save expense (create or update) ─────────────────────────────────────────
document.getElementById("saveExpenseBtn").addEventListener("click", async () => {
  const title       = titleInput.value.trim();
  const amount      = parseFloat(amountInput.value);
  const category    = categoryInput.value;
  const date        = dateInput.value;
  const description = descriptionInput.value.trim();
  const id          = expenseIdInput.value;

  if (!title || isNaN(amount) || amount <= 0 || !date) {
    formError.textContent = "Please fill in all required fields with valid values.";
    formError.classList.remove("hidden");
    return;
  }

  const payload = { title, amount, category, date, description };

  try {
    if (id) {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showToast("Expense updated ✓");
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showToast("Expense added ✓");
    }
    modalOverlay.classList.add("hidden");
    loadExpenses();

  } catch (err) {
    formError.textContent = "Something went wrong. Please try again.";
    formError.classList.remove("hidden");
    showToast("Failed to save expense", "error");
    console.error("Save error:", err);
  }
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

// ── Delete flow ──────────────────────────────────────────────────────────────
function confirmDelete(id) {
  pendingDeleteId = id;
  deleteModal.classList.remove("hidden");
}

document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  try {
    await fetch(`${API_URL}/${pendingDeleteId}`, { method: "DELETE" });
    pendingDeleteId = null;
    deleteModal.classList.add("hidden");
    showToast("Expense deleted ✓");
    loadExpenses();
  } catch (err) {
    showToast("Failed to delete", "error");
    console.error("Delete error:", err);
  }
});

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  pendingDeleteId = null;
  deleteModal.classList.add("hidden");
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// ── Init ─────────────────────────────────────────────────────────────────────
loadExpenses();