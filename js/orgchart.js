/**
 * ตรรกะหน้าผังโครงสร้างองค์กร (ต้อง login)
 * แสดงกลุ่มงานเป็นการ์ด: จำนวนบุคลากร, ผู้อาวุโสสุด (แทนหัวหน้ากลุ่มงาน), สัดส่วนตำแหน่งในกลุ่มงาน
 */
(function () {
  function fmt(n) { return HRHK_PLAN.fmt(n); }

  function render(active) {
    const byDept = {};
    active.forEach((s) => { (byDept[s.department] = byDept[s.department] || []).push(s); });

    const cards = HRHK_MOCK.DEPARTMENTS
      .map((dept) => ({ dept, staff: byDept[dept] || [] }))
      .sort((a, b) => b.staff.length - a.staff.length)
      .map(({ dept, staff }) => {
        const sorted = staff.slice().sort((a, b) => new Date(a.hireDate) - new Date(b.hireDate));
        const head = sorted[0];
        const posCount = {};
        staff.forEach((s) => { posCount[s.position] = (posCount[s.position] || 0) + 1; });
        const posList = Object.entries(posCount).sort((a, b) => b[1] - a[1]).slice(0, 4)
          .map(([pos, count]) => `<div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--text-secondary); padding:3px 0">
            <span>${pos}</span><span>${count} คน</span>
          </div>`).join("");

        return `
        <div class="card">
          <h3>${dept}</h3>
          <div class="card-sub">${fmt(staff.length)} คน</div>
          <div style="border-top:1px solid var(--border); padding-top:10px; margin-bottom:10px">
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px">ผู้อาวุโสสุดในกลุ่มงาน (อ้างอิงอายุงาน)</div>
            ${head ? `<div style="font-size:13.5px; font-weight:600">${head.maskedName} <span style="font-weight:400; color:var(--text-secondary)">— ${head.position}</span></div>`
                   : `<div style="font-size:13px; color:var(--text-muted)">— ไม่มีบุคลากรในกลุ่มงาน —</div>`}
          </div>
          <div style="border-top:1px solid var(--border); padding-top:8px">
            ${posList || '<div style="font-size:12.5px; color:var(--text-muted)">ไม่มีข้อมูลตำแหน่ง</div>'}
          </div>
        </div>`;
      });

    document.getElementById("org-grid").innerHTML = cards.join("");
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    const all = await HRHK_API.getStaffList();
    render(HRHK_PLAN.activeStaff(all));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
