/**
 * ตรรกะหน้าการลา ภาระงาน และความเสี่ยงด้านคน (ต้อง login)
 */
(function () {
  function fmt(n) { return HRHK_PLAN.fmt(n); }

  function renderStatCards(active) {
    const avgSick = active.length ? (active.reduce((a, s) => a + s.leaveSick, 0) / active.length).toFixed(1) : 0;
    const avgFte = active.length ? (active.reduce((a, s) => a + s.fte, 0) / active.length).toFixed(2) : 0;
    const scored = active.map((s) => HRHK_PLAN.flightRiskScore(s));
    const highRisk = scored.filter((sc) => sc >= 55).length;
    const avgTenure = active.length ? (active.reduce((a, s) => a + HRHK_PLAN.tenureYears(s.hireDate), 0) / active.length).toFixed(1) : 0;

    const cards = [
      { label: "ลาป่วยเฉลี่ย/คน/ปี", value: fmt(avgSick) + " วัน" },
      { label: "FTE เฉลี่ย", value: avgFte },
      { label: "กลุ่มเสี่ยงลาออกสูง", value: fmt(highRisk) + " คน" },
      { label: "อายุงานเฉลี่ย", value: fmt(avgTenure) + " ปี" },
    ];
    document.getElementById("stat-cards").innerHTML = cards.map((c) => `
      <div class="card stat-card">
        <div class="stat-num">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function renderLeaveChart(active) {
    const n = active.length || 1;
    const avgSick = active.reduce((a, s) => a + s.leaveSick, 0) / n;
    const avgPersonal = active.reduce((a, s) => a + s.leavePersonal, 0) / n;
    const avgVacation = active.reduce((a, s) => a + s.leaveVacation, 0) / n;
    new Chart(document.getElementById("chart-leave"), {
      type: "doughnut",
      data: {
        labels: ["ลาป่วย", "ลากิจ", "ลาพักร้อน"],
        datasets: [{ data: [avgSick.toFixed(1), avgPersonal.toFixed(1), avgVacation.toFixed(1)], backgroundColor: ["#DC2626", "#CA8A04", "#16A34A"], borderWidth: 2, borderColor: "#FFFFFF" }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { family: "Anuphan", size: 11.5 }, color: "#475569" } } } },
    });
  }

  function renderRiskChart(active) {
    const scored = active.map((s) => HRHK_PLAN.flightRiskScore(s));
    const low = scored.filter((s) => s < 30).length;
    const mid = scored.filter((s) => s >= 30 && s < 55).length;
    const high = scored.filter((s) => s >= 55).length;
    new Chart(document.getElementById("chart-risk"), {
      type: "bar",
      data: {
        labels: ["เสี่ยงต่ำ", "เสี่ยงปานกลาง", "เสี่ยงสูง"],
        datasets: [{ data: [low, mid, high], backgroundColor: ["#16A34A", "#CA8A04", "#DC2626"], borderRadius: 3, maxBarThickness: 60 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { family: "Anuphan", size: 11 }, color: "#475569" }, grid: { display: false } },
          y: { ticks: { font: { family: "Anuphan", size: 11 }, color: "#475569" }, grid: { color: "#E2E8F0" }, beginAtZero: true },
        },
      },
    });
  }

  function renderTable(active) {
    const rows = active
      .map((s) => ({ ...s, riskScore: HRHK_PLAN.flightRiskScore(s) }))
      .filter((s) => s.riskScore >= 30)
      .sort((a, b) => b.riskScore - a.riskScore);

    const tbody = document.getElementById("risk-tbody");
    tbody.innerHTML = rows.map((s) => {
      const risk = HRHK_PLAN.riskLabel(s.riskScore);
      const tenure = HRHK_PLAN.tenureYears(s.hireDate).toFixed(1);
      return `<tr>
        <td>${s.id}</td>
        <td>${s.maskedName}</td>
        <td>${s.department}</td>
        <td>${s.employmentTypeLabel}</td>
        <td>${tenure} ปี</td>
        <td>${s.leaveSick} วัน</td>
        <td><span class="${risk.cls}">${risk.label}</span></td>
      </tr>`;
    }).join("");
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    const all = await HRHK_API.getStaffList();
    const active = HRHK_PLAN.activeStaff(all);
    renderStatCards(active);
    renderLeaveChart(active);
    renderRiskChart(active);
    renderTable(active);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
