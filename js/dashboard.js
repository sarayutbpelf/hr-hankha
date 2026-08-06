/**
 * ตรรกะประมวลผลและแสดงผลหน้าแดชบอร์ด (หน้าสาธารณะ ไม่ต้อง login)
 * รับผิดชอบ: mosaic, stat cards, กราฟทั้งหมด, ตารางความเชี่ยวชาญ
 */
(function () {
  const PALETTE = ["#1E3A5F", "#2563EB", "#6B7280", "#16A34A", "#CA8A04", "#DC2626", "#94A3B8", "#0EA5E9"];
  const GEN_ORDER = ["Baby Boomer", "Gen X", "Gen Y", "Gen Z"];

  function groupCount(list, keyFn) {
    const m = new Map();
    for (const item of list) {
      const k = keyFn(item);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }
  /** จัดลำดับ Map ที่ group ตาม employmentTypeLabel ให้ตรงกับลำดับที่กำหนดใน HRHK_MOCK.EMP_TYPES เสมอ */
  function sortByEmpTypeOrder(map) {
    const order = HRHK_MOCK.EMP_TYPES.map((t) => t.label);
    const sorted = new Map();
    order.forEach((label) => { if (map.has(label)) sorted.set(label, map.get(label)); });
    // เผื่อมี label แปลกปลอมที่ไม่อยู่ในลำดับมาตรฐาน ให้ต่อท้ายไว้ไม่ให้ข้อมูลหาย
    map.forEach((v, k) => { if (!sorted.has(k)) sorted.set(k, v); });
    return sorted;
  }
  function fmt(n) { return n.toLocaleString("th-TH"); }

  function baseChartOptions(extra) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: "Anuphan", size: 11.5 }, color: "#475569", boxWidth: 12 } },
      },
      scales: {
        x: { ticks: { font: { family: "Anuphan", size: 11 }, color: "#475569" }, grid: { color: "#E2E8F0", display: false } },
        y: { ticks: { font: { family: "Anuphan", size: 11 }, color: "#475569" }, grid: { color: "#E2E8F0" }, beginAtZero: true },
      },
    }, extra || {});
  }

  function renderMosaic(active) {
    const total = active.length;
    document.getElementById("hero-total").textContent = fmt(total);
    const byType = sortByEmpTypeOrder(groupCount(active, (s) => s.employmentTypeLabel));
    const typeColor = new Map();
    HRHK_MOCK.EMP_TYPES.forEach((t, i) => typeColor.set(t.label, PALETTE[i % PALETTE.length]));

    // build ordered tile list grouped by type for a legible mosaic
    const grid = document.getElementById("mosaic-grid");
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const [label, count] of byType) {
      for (let i = 0; i < count; i++) {
        const tile = document.createElement("div");
        tile.className = "mosaic-tile";
        tile.style.background = typeColor.get(label);
        tile.title = label;
        frag.appendChild(tile);
      }
    }
    grid.appendChild(frag);

    const legend = document.getElementById("mosaic-legend");
    legend.innerHTML = "";
    for (const [label, count] of byType) {
      const span = document.createElement("span");
      span.innerHTML = `<i style="background:${typeColor.get(label)}"></i>${label} (${fmt(count)})`;
      legend.appendChild(span);
    }
  }

  function renderStatCards(active, all) {
    const depts = new Set(active.map((s) => s.department)).size;
    const avgAge = active.length ? Math.round(active.reduce((a, s) => a + s.age, 0) / active.length) : 0;
    const now = new Date(2026, 7, 4);
    const retiringSoon = active.filter((s) => (60 - s.age) >= 0 && (60 - s.age) <= 5).length;

    const cards = [
      { label: "บุคลากรทั้งหมด (ปฏิบัติงานอยู่)", value: fmt(active.length), icon: "users" },
      { label: "จำนวนกลุ่มงาน", value: fmt(depts), icon: "layers" },
      { label: "อายุเฉลี่ยบุคลากร", value: avgAge + " ปี", icon: "clock" },
      { label: "จะเกษียณใน 5 ปีข้างหน้า", value: fmt(retiringSoon) + " คน", icon: "flag" },
    ];
    const icons = {
      users: '<path d="M17 20a5 5 0 0 0-10 0" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9" r="3.2" stroke="currentColor" stroke-width="1.6"/>',
      layers: '<path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 13l9 5 9-5" stroke="currentColor" stroke-width="1.6"/>',
      clock: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      flag: '<path d="M6 21V4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M6 4h11l-2.5 3.5L17 11H6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    };
    const wrap = document.getElementById("stat-cards");
    wrap.innerHTML = cards.map((c) => `
      <div class="card stat-card">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none">${icons[c.icon]}</svg></div>
        <div class="stat-num">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function renderEmpType(active) {
    const m = sortByEmpTypeOrder(groupCount(active, (s) => s.employmentTypeLabel));
    new Chart(document.getElementById("chart-emptype"), {
      type: "bar",
      data: {
        labels: [...m.keys()],
        datasets: [{ data: [...m.values()], backgroundColor: PALETTE, borderRadius: 3, maxBarThickness: 34 }],
      },
      options: baseChartOptions({ plugins: { legend: { display: false } }, indexAxis: "y" }),
    });
  }

  function renderGeneration(active) {
    const m = groupCount(active, (s) => s.generation);
    const labels = GEN_ORDER.filter((g) => m.has(g));
    new Chart(document.getElementById("chart-generation"), {
      type: "doughnut",
      data: { labels, datasets: [{ data: labels.map((l) => m.get(l)), backgroundColor: PALETTE, borderWidth: 2, borderColor: "#FFFFFF" }] },
      options: baseChartOptions({ scales: {} , cutout: "62%"}),
    });
  }

  function renderDept(active) {
    const m = groupCount(active, (s) => s.department);
    const entries = [...m.entries()].sort((a, b) => b[1] - a[1]);
    new Chart(document.getElementById("chart-dept"), {
      type: "bar",
      data: { labels: entries.map((e) => e[0]), datasets: [{ data: entries.map((e) => e[1]), backgroundColor: "#1E3A5F", borderRadius: 3, maxBarThickness: 20 }] },
      options: baseChartOptions({ plugins: { legend: { display: false } }, indexAxis: "y" }),
    });
  }

  function renderProfGroup(active) {
    const m = groupCount(active, (s) => s.professionalGroup);
    new Chart(document.getElementById("chart-profgroup"), {
      type: "polarArea",
      data: { labels: [...m.keys()], datasets: [{ data: [...m.values()], backgroundColor: PALETTE.map((c) => c + "CC") }] },
      options: baseChartOptions({ scales: {} }),
    });
  }

  function renderAge(active) {
    const bins = [[20,29],[30,39],[40,49],[50,59],[60,120]];
    const labels = ["20–29 ปี","30–39 ปี","40–49 ปี","50–59 ปี","60 ปีขึ้นไป"];
    const counts = bins.map(([lo,hi]) => active.filter((s) => s.age >= lo && s.age <= hi).length);
    new Chart(document.getElementById("chart-age"), {
      type: "bar",
      data: { labels, datasets: [{ data: counts, backgroundColor: "#2563EB", borderRadius: 3, maxBarThickness: 40 }] },
      options: baseChartOptions({ plugins: { legend: { display: false } } }),
    });
  }

  function renderFTE(active) {
    const m = groupCount(active, (s) => "FTE " + s.fte.toFixed(1));
    new Chart(document.getElementById("chart-fte"), {
      type: "pie",
      data: { labels: [...m.keys()], datasets: [{ data: [...m.values()], backgroundColor: PALETTE, borderWidth: 2, borderColor: "#FFFFFF" }] },
      options: baseChartOptions({ scales: {} }),
    });
  }

  function renderRetire(active) {
    const now = new Date(2026, 7, 4);
    const years = [2026,2027,2028,2029,2030,2031];
    const counts = years.map((y) => active.filter((s) => (new Date(s.birthDate).getFullYear() + 60) === y).length);
    new Chart(document.getElementById("chart-retire"), {
      type: "line",
      data: { labels: years, datasets: [{ label: "จำนวนผู้เกษียณ", data: counts, borderColor: "#CA8A04", backgroundColor: "#CA8A0422", fill: true, tension: 0.3, pointRadius: 3 }] },
      options: baseChartOptions({}),
    });
  }

  function renderTurnover(all) {
    const years = [2021,2022,2023,2024,2025,2026];
    const hires = years.map((y) => all.filter((s) => new Date(s.hireDate).getFullYear() === y).length);
    const resigns = years.map((y) => all.filter((s) => s.resignDate && new Date(s.resignDate).getFullYear() === y).length);
    new Chart(document.getElementById("chart-turnover"), {
      type: "bar",
      data: {
        labels: years,
        datasets: [
          { label: "บรรจุใหม่", data: hires, backgroundColor: "#16A34A", borderRadius: 3, maxBarThickness: 24 },
          { label: "ลาออก", data: resigns, backgroundColor: "#DC2626", borderRadius: 3, maxBarThickness: 24 },
        ],
      },
      options: baseChartOptions({}),
    });
  }

  function renderSpecialty(active) {
    const m = groupCount(active.filter((s) => s.specialty && s.specialty !== "-"), (s) => s.specialty);
    const entries = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = active.length;
    const tbody = document.getElementById("specialty-tbody");
    tbody.innerHTML = entries.map(([spec, count]) => `
      <tr><td>${spec}</td><td>${fmt(count)} คน</td><td><span class="badge">${((count/total)*100).toFixed(1)}%</span></td></tr>
    `).join("");
  }

  async function init() {
    const all = await HRHK_API.getStaffList();
    const active = all.filter((s) => s.status === "active");

    renderMosaic(active);
    renderStatCards(active, all);
    renderEmpType(active);
    renderGeneration(active);
    renderDept(active);
    renderProfGroup(active);
    renderAge(active);
    renderFTE(active);
    renderRetire(active);
    renderTurnover(all);
    renderSpecialty(active);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
