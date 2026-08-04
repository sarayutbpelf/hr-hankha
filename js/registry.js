/**
 * ตรรกะหน้าทะเบียนบุคลากร (ต้อง login)
 * แสดงข้อมูลบางส่วนเท่านั้น: ชื่อจะถูกปิดบังด้วย maskedName ที่เตรียมไว้แล้ว
 */
(function () {
  let ALL = [];

  const STATUS_LABEL = { active: "ปฏิบัติงานอยู่", resigned: "ลาออก", retired: "เกษียณอายุ" };
  const STATUS_BADGE = { active: "badge", resigned: "badge amber", retired: "badge amber" };

  function populateFilters(list) {
    const deptSel = document.getElementById("filter-dept");
    const empSel = document.getElementById("filter-emptype");
    const depts = [...new Set(list.map((s) => s.department))].sort();
    const emps = [...new Set(list.map((s) => s.employmentTypeLabel))];
    depts.forEach((d) => deptSel.insertAdjacentHTML("beforeend", `<option value="${d}">${d}</option>`));
    emps.forEach((e) => empSel.insertAdjacentHTML("beforeend", `<option value="${e}">${e}</option>`));
  }

  function applyFilters() {
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const dept = document.getElementById("filter-dept").value;
    const emptype = document.getElementById("filter-emptype").value;
    const status = document.getElementById("filter-status").value;

    let rows = ALL;
    if (status) rows = rows.filter((s) => s.status === status);
    if (dept) rows = rows.filter((s) => s.department === dept);
    if (emptype) rows = rows.filter((s) => s.employmentTypeLabel === emptype);
    if (q) {
      rows = rows.filter((s) =>
        s.id.toLowerCase().includes(q) ||
        s.position.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.professionalGroup.toLowerCase().includes(q)
      );
    }
    renderTable(rows);
  }

  function renderTable(rows) {
    const tbody = document.getElementById("registry-tbody");
    const empty = document.getElementById("empty-state");
    document.getElementById("result-count").textContent = `พบ ${rows.length.toLocaleString("th-TH")} รายการ`;

    if (!rows.length) {
      tbody.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    tbody.innerHTML = rows.map((s) => `
      <tr>
        <td>${s.id}</td>
        <td>${s.maskedName}</td>
        <td>${s.position}</td>
        <td>${s.department}</td>
        <td>${s.professionalGroup}</td>
        <td>${s.employmentTypeLabel}</td>
        <td>${s.generation}</td>
        <td><span class="${STATUS_BADGE[s.status]}">${STATUS_LABEL[s.status]}</span></td>
      </tr>
    `).join("");
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    ALL = await HRHK_API.getStaffList();
    populateFilters(ALL);
    ["search-box", "filter-dept", "filter-emptype", "filter-status"].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });
    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
