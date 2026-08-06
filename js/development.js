/**
 * ตรรกะหน้าสมรรถนะและแผนพัฒนาบุคลากร (ต้อง login)
 */
(function () {
  let ROWS = [];
  const IDP_BADGE = { "ยังไม่เริ่ม": "badge amber", "กำลังดำเนินการ": "badge amber", "เสร็จสิ้น": "badge" };

  function fmt(n) { return HRHK_PLAN.fmt(n); }

  function renderStatCards(rows) {
    const avgScore = rows.length ? (rows.reduce((a, r) => a + r.performanceScore, 0) / rows.length).toFixed(2) : "-";
    const avgTraining = rows.length ? Math.round(rows.reduce((a, r) => a + r.trainingHours, 0) / rows.length) : 0;
    const completed = rows.filter((r) => r.idpStatus === "เสร็จสิ้น").length;
    const notStarted = rows.filter((r) => r.idpStatus === "ยังไม่เริ่ม").length;
    const cards = [
      { label: "คะแนนผลปฏิบัติงานเฉลี่ย", value: avgScore + " / 5.0" },
      { label: "ชั่วโมงอบรมเฉลี่ย/คน/ปี", value: fmt(avgTraining) + " ชม." },
      { label: "IDP เสร็จสิ้นแล้ว", value: fmt(completed) + " คน" },
      { label: "IDP ยังไม่เริ่มดำเนินการ", value: fmt(notStarted) + " คน" },
    ];
    document.getElementById("stat-cards").innerHTML = cards.map((c) => `
      <div class="card stat-card">
        <div class="stat-num">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function renderChart(rows) {
    const bins = [[2.7, 3.2], [3.2, 3.7], [3.7, 4.2], [4.2, 4.6], [4.6, 5.0]];
    const labels = ["2.7–3.2", "3.2–3.7", "3.7–4.2", "4.2–4.6", "4.6–5.0"];
    const counts = bins.map(([lo, hi]) => rows.filter((r) => r.performanceScore >= lo && r.performanceScore < hi + 0.001).length);
    new Chart(document.getElementById("chart-performance"), {
      type: "bar",
      data: { labels, datasets: [{ data: counts, backgroundColor: "#2563EB", borderRadius: 3, maxBarThickness: 40 }] },
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

  function applyFilters() {
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const idp = document.getElementById("filter-idp").value;
    let rows = ROWS;
    if (idp) rows = rows.filter((r) => r.idpStatus === idp);
    if (q) rows = rows.filter((r) => r.id.toLowerCase().includes(q) || r.position.toLowerCase().includes(q));
    renderTable(rows);
  }

  function renderTable(rows) {
    const tbody = document.getElementById("dev-tbody");
    const empty = document.getElementById("empty-state");
    document.getElementById("result-count").textContent = `พบ ${fmt(rows.length)} รายการ`;
    if (!rows.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${r.id}</td>
        <td>${r.maskedName}</td>
        <td>${r.position}</td>
        <td>${r.performanceScore.toFixed(1)}</td>
        <td>${r.trainingHours} ชม.</td>
        <td>${r.idpGoal}</td>
        <td><span class="${IDP_BADGE[r.idpStatus]}">${r.idpStatus}</span></td>
      </tr>`).join("");
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    const all = await HRHK_API.getStaffList();
    ROWS = HRHK_PLAN.activeStaff(all).sort((a, b) => a.performanceScore - b.performanceScore);

    renderStatCards(ROWS);
    renderChart(ROWS);
    ["search-box", "filter-idp"].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });
    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
