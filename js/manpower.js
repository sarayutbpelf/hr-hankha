/**
 * ตรรกะหน้าอัตรากำลัง (ต้อง login)
 * เทียบกรอบอัตรากำลังมาตรฐาน (HRHK_MOCK.MANPOWER_FRAME) กับจำนวนบุคลากรจริง
 * และประมาณการความต้องการบรรจุทดแทนจากแนวโน้มเกษียณ
 */
(function () {
  function fmt(n) { return HRHK_PLAN.fmt(n); }

  function renderStatCards(rows, totalFrame, totalActual) {
    const diff = totalActual - totalFrame;
    const pct = totalFrame ? Math.round((totalActual / totalFrame) * 100) : 0;
    const shortagePositions = rows.filter((r) => r.diff < 0).length;
    const cards = [
      { label: "กรอบอัตรากำลังรวม", value: fmt(totalFrame) + " อัตรา" },
      { label: "จำนวนบุคลากรจริง", value: fmt(totalActual) + " คน" },
      { label: "ผลต่างรวม", value: (diff >= 0 ? "+" : "") + fmt(diff) },
      { label: "ตำแหน่งที่ขาดอัตรากำลัง", value: fmt(shortagePositions) + " ตำแหน่ง" },
    ];
    document.getElementById("stat-cards").innerHTML = cards.map((c) => `
      <div class="card stat-card">
        <div class="stat-num">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function renderTable(rows) {
    const tbody = document.getElementById("manpower-tbody");
    tbody.innerHTML = rows.map((r) => {
      const pct = r.frame ? Math.round((r.actual / r.frame) * 100) : 100;
      let badge = '<span class="badge">พอดีกรอบ</span>';
      if (r.diff < 0) badge = '<span class="badge danger">ขาดอัตรากำลัง</span>';
      else if (r.diff > 0) badge = '<span class="badge amber">เกินกรอบ</span>';
      return `<tr>
        <td>${r.position}</td>
        <td>${fmt(r.frame)}</td>
        <td>${fmt(r.actual)}</td>
        <td>${r.diff >= 0 ? "+" : ""}${fmt(r.diff)}</td>
        <td>${pct}%</td>
        <td>${badge}</td>
      </tr>`;
    }).join("");
  }

  function renderReplacementChart(active) {
    const years = [2026, 2027, 2028, 2029, 2030, 2031];
    const counts = years.map((y) => active.filter((s) => (new Date(s.birthDate).getFullYear() + 60) === y).length);
    new Chart(document.getElementById("chart-replacement"), {
      type: "bar",
      data: {
        labels: years,
        datasets: [{ label: "ตำแหน่งที่ต้องบรรจุทดแทน", data: counts, backgroundColor: "#1E3A5F", borderRadius: 3, maxBarThickness: 40 }],
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

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    const all = await HRHK_API.getStaffList();
    const active = HRHK_PLAN.activeStaff(all);

    const frameMap = HRHK_MOCK.MANPOWER_FRAME;
    const actualCount = {};
    active.forEach((s) => { actualCount[s.position] = (actualCount[s.position] || 0) + 1; });

    const rows = Object.keys(frameMap).map((position) => {
      const frame = frameMap[position];
      const actual = actualCount[position] || 0;
      return { position, frame, actual, diff: actual - frame };
    }).sort((a, b) => a.diff - b.diff);

    const totalFrame = rows.reduce((a, r) => a + r.frame, 0);
    const totalActual = rows.reduce((a, r) => a + r.actual, 0);

    renderStatCards(rows, totalFrame, totalActual);
    renderTable(rows);
    renderReplacementChart(active);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
