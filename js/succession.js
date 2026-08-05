/**
 * ตรรกะหน้าแผนสืบทอดตำแหน่ง (ต้อง login)
 * กำหนด "ตำแหน่งสำคัญ" = หัวหน้ากลุ่มงาน ต่อกลุ่มงาน
 * ผู้ดำรงตำแหน่งปัจจุบัน = บุคลากรที่ปฏิบัติงานอยู่ซึ่งมีอายุงานมากที่สุดในกลุ่มงานนั้น
 * ผู้สืบทอดที่เสนอ = บุคลากรอาวุโสรองลงมาในกลุ่มงานเดียวกัน ประเมินความพร้อมจากอายุงาน+ผลปฏิบัติงาน
 */
(function () {
  function fmt(n) { return HRHK_PLAN.fmt(n); }

  function readiness(candidate) {
    if (!candidate) return { label: "ไม่มีผู้สืบทอด", cls: "badge danger" };
    const tenure = HRHK_PLAN.tenureYears(candidate.hireDate);
    if (tenure >= 3 && candidate.performanceScore >= 4.0) return { label: "พร้อมทันที", cls: "badge" };
    if (tenure >= 1.5) return { label: "พร้อมใน 1-2 ปี", cls: "badge amber" };
    return { label: "ต้องพัฒนาเพิ่มเติม", cls: "badge amber" };
  }

  function buildPlans(active) {
    const byDept = {};
    active.forEach((s) => { (byDept[s.department] = byDept[s.department] || []).push(s); });

    return HRHK_MOCK.DEPARTMENTS.map((dept) => {
      const staffInDept = (byDept[dept] || []).slice().sort((a, b) => new Date(a.hireDate) - new Date(b.hireDate));
      const incumbent = staffInDept[0] || null;
      const candidate = staffInDept[1] || null;
      return { dept, incumbent, candidate, readiness: readiness(candidate) };
    });
  }

  function renderStatCards(plans) {
    const total = plans.length;
    const readyNow = plans.filter((p) => p.readiness.label === "พร้อมทันที").length;
    const readySoon = plans.filter((p) => p.readiness.label === "พร้อมใน 1-2 ปี").length;
    const noSuccessor = plans.filter((p) => p.readiness.label === "ไม่มีผู้สืบทอด").length;
    const cards = [
      { label: "ตำแหน่งสำคัญทั้งหมด", value: fmt(total) + " ตำแหน่ง" },
      { label: "มีผู้สืบทอดพร้อมทันที", value: fmt(readyNow) + " ตำแหน่ง" },
      { label: "ผู้สืบทอดพร้อมใน 1-2 ปี", value: fmt(readySoon) + " ตำแหน่ง" },
      { label: "ไม่มีผู้สืบทอด (เสี่ยงสูง)", value: fmt(noSuccessor) + " ตำแหน่ง" },
    ];
    document.getElementById("stat-cards").innerHTML = cards.map((c) => `
      <div class="card stat-card">
        <div class="stat-num">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function renderTable(plans) {
    const tbody = document.getElementById("succession-tbody");
    tbody.innerHTML = plans.map((p) => {
      const inc = p.incumbent;
      const incCell = inc
        ? `${inc.maskedName} <span style="color:var(--text-muted)">(${inc.position})</span>`
        : '<span style="color:var(--text-muted)">— ไม่มีบุคลากรในกลุ่มงาน —</span>';
      const yearsToRetire = inc ? Math.max(0, 60 - inc.age) : "-";
      const ageCell = inc ? `${inc.age} ปี / อีก ${yearsToRetire} ปี` : "-";
      const candCell = p.candidate
        ? `${p.candidate.maskedName} <span style="color:var(--text-muted)">(${p.candidate.position})</span>`
        : '<span style="color:var(--text-muted)">ยังไม่มีผู้เสนอชื่อ</span>';
      return `<tr>
        <td>หัวหน้า${p.dept}</td>
        <td>${incCell}</td>
        <td>${ageCell}</td>
        <td>${candCell}</td>
        <td><span class="${p.readiness.cls}">${p.readiness.label}</span></td>
      </tr>`;
    }).join("");
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    const all = await HRHK_API.getStaffList();
    const active = HRHK_PLAN.activeStaff(all);
    const plans = buildPlans(active);
    renderStatCards(plans);
    renderTable(plans);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
