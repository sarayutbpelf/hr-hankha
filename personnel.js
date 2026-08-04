/**
 * ตรรกะหน้าบันทึกข้อมูลรายบุคคล (ต้อง login)
 * บันทึกผ่าน HRHK_API.saveStaff() ซึ่งจะไปอัปเดตทั้ง Google Sheet (โหมด live)
 * หรือ localStorage (โหมดสาธิต) ทำให้ข้อมูลตรงกันกับหน้าแดชบอร์ดและทะเบียนบุคลากรทันที
 */
(function () {
  let STAFF = [];

  function genFor(y) {
    if (y >= 1997) return "Gen Z";
    if (y >= 1981) return "Gen Y";
    if (y >= 1965) return "Gen X";
    return "Baby Boomer";
  }
  function maskName(name) {
    if (!name) return "";
    if (name.length <= 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 1);
  }

  function fillSelectOptions() {
    const posSel = document.getElementById("f-position");
    HRHK_MOCK.POSITIONS.forEach((p) => posSel.insertAdjacentHTML("beforeend", `<option value="${p.pos}" data-group="${p.group}" data-dept="${p.dept}">${p.pos}</option>`));

    const deptSel = document.getElementById("f-department");
    HRHK_MOCK.DEPARTMENTS.forEach((d) => deptSel.insertAdjacentHTML("beforeend", `<option value="${d}">${d}</option>`));

    const empSel = document.getElementById("f-emptype");
    HRHK_MOCK.EMP_TYPES.forEach((t) => empSel.insertAdjacentHTML("beforeend", `<option value="${t.key}" data-fte="${t.fte}">${t.label}</option>`));

    posSel.addEventListener("change", () => {
      const opt = posSel.selectedOptions[0];
      if (!opt || !opt.dataset.group) return;
      document.getElementById("f-profgroup").value = opt.dataset.group;
      if (opt.dataset.dept) document.getElementById("f-department").value = opt.dataset.dept;
    });
  }

  function fillPicker() {
    const picker = document.getElementById("existing-picker");
    STAFF.slice().sort((a, b) => (a.firstName > b.firstName ? 1 : -1)).forEach((s) => {
      picker.insertAdjacentHTML("beforeend", `<option value="${s.id}">${s.maskedName} — ${s.position} (${s.id})</option>`);
    });
    picker.addEventListener("change", () => {
      if (!picker.value) return resetForm();
      const rec = STAFF.find((s) => s.id === picker.value);
      if (rec) loadRecord(rec);
    });
    document.getElementById("new-btn").addEventListener("click", () => {
      picker.value = "";
      resetForm();
    });
  }

  function loadRecord(rec) {
    document.getElementById("f-id").value = rec.id;
    document.getElementById("f-firstName").value = rec.firstName;
    document.getElementById("f-lastName").value = rec.lastName;
    document.getElementById("f-birthDate").value = rec.birthDate;
    document.getElementById("f-phone").value = rec.phone || "";
    document.getElementById("f-position").value = rec.position;
    document.getElementById("f-department").value = rec.department;
    document.getElementById("f-profgroup").value = rec.professionalGroup;
    document.getElementById("f-specialty").value = rec.specialty === "-" ? "" : rec.specialty;
    document.getElementById("f-emptype").value = rec.employmentType;
    document.getElementById("f-fte").value = String(rec.fte.toFixed(1));
    document.getElementById("f-hireDate").value = rec.hireDate;
    document.getElementById("f-status").value = rec.status;
    document.getElementById("f-resignDate").value = rec.resignDate || "";
    toggleResignField();
  }

  function resetForm() {
    document.getElementById("personnel-form").reset();
    document.getElementById("f-id").value = "";
    toggleResignField();
  }

  function toggleResignField() {
    const status = document.getElementById("f-status").value;
    document.getElementById("resign-field").style.display = status === "active" ? "none" : "block";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errBox = document.getElementById("form-error");
    const okBox = document.getElementById("form-success");
    errBox.classList.remove("show"); okBox.classList.remove("show");

    const btn = document.getElementById("save-btn");
    btn.disabled = true; btn.textContent = "กำลังบันทึก...";

    try {
      const birthDate = document.getElementById("f-birthDate").value;
      const birthYear = new Date(birthDate).getFullYear();
      const now = new Date(2026, 7, 4);
      const age = now.getFullYear() - birthYear;
      const empSel = document.getElementById("f-emptype");
      const empLabel = empSel.selectedOptions[0].textContent;
      const firstName = document.getElementById("f-firstName").value.trim();
      const lastName = document.getElementById("f-lastName").value.trim();
      const status = document.getElementById("f-status").value;

      const record = {
        id: document.getElementById("f-id").value || undefined,
        firstName, lastName,
        maskedName: maskName(firstName) + " " + maskName(lastName),
        birthDate, age, generation: genFor(birthYear),
        phone: document.getElementById("f-phone").value.trim(),
        position: document.getElementById("f-position").value,
        department: document.getElementById("f-department").value,
        professionalGroup: document.getElementById("f-profgroup").value,
        specialty: document.getElementById("f-specialty").value.trim() || "-",
        employmentType: empSel.value,
        employmentTypeLabel: empLabel,
        fte: parseFloat(document.getElementById("f-fte").value),
        hireDate: document.getElementById("f-hireDate").value,
        status,
        resignDate: status === "active" ? null : (document.getElementById("f-resignDate").value || null),
      };

      const saved = await HRHK_API.saveStaff(record);
      okBox.textContent = "บันทึกข้อมูลเรียบร้อยแล้ว ข้อมูลจะปรากฏในแดชบอร์ดและทะเบียนบุคลากรทันที";
      okBox.classList.add("show");

      // refresh local cache + picker so the record is selectable right away
      STAFF = await HRHK_API.getStaffList();
      const picker = document.getElementById("existing-picker");
      if (![...picker.options].some((o) => o.value === saved.id)) {
        picker.insertAdjacentHTML("beforeend", `<option value="${saved.id}">${saved.maskedName || record.maskedName} — ${saved.position || record.position} (${saved.id})</option>`);
      }
      picker.value = saved.id || record.id;
    } catch (err) {
      errBox.textContent = err.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      errBox.classList.add("show");
    } finally {
      btn.disabled = false; btn.textContent = "บันทึกข้อมูล";
    }
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    fillSelectOptions();
    STAFF = await HRHK_API.getStaffList();
    fillPicker();
    document.getElementById("f-status").addEventListener("change", toggleResignField);
    document.getElementById("personnel-form").addEventListener("submit", handleSubmit);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
