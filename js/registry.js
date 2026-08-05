/**
 * ตรรกะหน้าทะเบียนบุคลากร (ต้อง login)
 * แสดงข้อมูลบางส่วนเท่านั้น: ชื่อจะถูกปิดบังด้วย maskedName ที่เตรียมไว้แล้ว
 * รองรับ bulk selection + export ตามแนวทาง enterprise data table
 */
(function () {
  let ALL = [];
  let VISIBLE = [];
  const SELECTED = new Set();

  const STATUS_LABEL = { active: "ปฏิบัติงานอยู่", resigned: "ลาออก", retired: "เกษียณอายุ" };
  // active=success(green) · resigned=danger(red) · retired=gray(draft-like)
  const STATUS_BADGE = { active: "badge", resigned: "badge danger", retired: "badge gray" };

  const CSV_HEADERS = ["id", "maskedName", "position", "department", "professionalGroup", "employmentTypeLabel", "generation", "status"];
  const CSV_HEADER_LABELS = ["รหัสพนักงาน", "ชื่อ-นามสกุล", "ตำแหน่ง", "กลุ่มงาน", "กลุ่มวิชาชีพ", "ประเภทการจ้าง", "Generation", "สถานะ"];

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
    VISIBLE = rows;
    renderTable(rows);
    updateBulkBar();
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
      <tr class="${SELECTED.has(s.id) ? "is-selected" : ""}" data-id="${s.id}">
        <td class="col-check"><input type="checkbox" class="row-checkbox row-select" data-id="${s.id}" ${SELECTED.has(s.id) ? "checked" : ""} aria-label="เลือก ${s.id}"></td>
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

    tbody.querySelectorAll(".row-select").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) SELECTED.add(cb.dataset.id); else SELECTED.delete(cb.dataset.id);
        cb.closest("tr").classList.toggle("is-selected", cb.checked);
        updateBulkBar();
      });
    });
    syncSelectAll();
  }

  function syncSelectAll() {
    const selectAll = document.getElementById("select-all");
    if (!VISIBLE.length) { selectAll.checked = false; selectAll.indeterminate = false; return; }
    const selectedVisible = VISIBLE.filter((s) => SELECTED.has(s.id)).length;
    selectAll.checked = selectedVisible === VISIBLE.length;
    selectAll.indeterminate = selectedVisible > 0 && selectedVisible < VISIBLE.length;
  }

  function updateBulkBar() {
    const bar = document.getElementById("bulk-bar");
    document.getElementById("bulk-count").textContent = `เลือกแล้ว ${SELECTED.size.toLocaleString("th-TH")} รายการ`;
    bar.classList.toggle("show", SELECTED.size > 0);
  }

  function toCSV(rows) {
    const lines = [CSV_HEADER_LABELS.join(",")];
    rows.forEach((s) => {
      const vals = CSV_HEADERS.map((h) => {
        const v = h === "status" ? STATUS_LABEL[s.status] : s[h];
        return `"${String(v ?? "").replace(/"/g, '""')}"`;
      });
      lines.push(vals.join(","));
    });
    return "\uFEFF" + lines.join("\r\n"); // BOM for Thai text in Excel
  }

  function downloadCSV(rows, filename) {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function wireBulkActions() {
    document.getElementById("select-all").addEventListener("change", (e) => {
      VISIBLE.forEach((s) => { if (e.target.checked) SELECTED.add(s.id); else SELECTED.delete(s.id); });
      renderTable(VISIBLE);
      updateBulkBar();
    });
    document.getElementById("bulk-clear").addEventListener("click", () => {
      SELECTED.clear();
      renderTable(VISIBLE);
      updateBulkBar();
    });
    document.getElementById("bulk-export").addEventListener("click", () => {
      const rows = ALL.filter((s) => SELECTED.has(s.id));
      downloadCSV(rows, "ทะเบียนบุคลากร-ที่เลือก.csv");
    });
    document.getElementById("export-btn").addEventListener("click", () => {
      downloadCSV(VISIBLE, "ทะเบียนบุคลากร.csv");
    });
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    ALL = await HRHK_API.getStaffList();
    populateFilters(ALL);
    ["search-box", "filter-dept", "filter-emptype", "filter-status"].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });
    wireBulkActions();
    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
