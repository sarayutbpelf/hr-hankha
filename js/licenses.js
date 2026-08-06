/**
 * ตรรกะหน้าใบอนุญาต/ใบประกอบวิชาชีพ (ต้อง login)
 */
(function () {
  let ROWS = [];
  const STATUS_LABEL = { expired: "หมดอายุแล้ว", expiring: "ใกล้หมดอายุ", valid: "ปกติ" };
  const STATUS_BADGE = { expired: "badge danger", expiring: "badge amber", valid: "badge" };

  function fmt(n) { return HRHK_PLAN.fmt(n); }

  function renderStatCards(rows) {
    const expired = rows.filter((r) => r.status === "expired").length;
    const expiring = rows.filter((r) => r.status === "expiring").length;
    const valid = rows.filter((r) => r.status === "valid").length;
    const avgCme = rows.length ? Math.round(rows.reduce((a, r) => a + r.cmeHours, 0) / rows.length) : 0;
    const cards = [
      { label: "มีใบอนุญาตทั้งหมด", value: fmt(rows.length) + " คน" },
      { label: "หมดอายุแล้ว", value: fmt(expired) + " คน" },
      { label: "ใกล้หมดอายุใน 90 วัน", value: fmt(expiring) + " คน" },
      { label: "ชั่วโมง CME เฉลี่ย/คน", value: fmt(avgCme) + " ชม." },
    ];
    document.getElementById("stat-cards").innerHTML = cards.map((c) => `
      <div class="card stat-card">
        <div class="stat-num">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function applyFilters() {
    const q = document.getElementById("search-box").value.trim().toLowerCase();
    const status = document.getElementById("filter-status").value;
    let rows = ROWS;
    if (status) rows = rows.filter((r) => r.status === status);
    if (q) rows = rows.filter((r) => r.id.toLowerCase().includes(q) || r.position.toLowerCase().includes(q));
    renderTable(rows);
  }

  function renderTable(rows) {
    const tbody = document.getElementById("license-tbody");
    const empty = document.getElementById("empty-state");
    document.getElementById("result-count").textContent = `พบ ${fmt(rows.length)} รายการ`;
    if (!rows.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";
    tbody.innerHTML = rows.map((r) => {
      const daysLeft = HRHK_PLAN.daysUntil(r.licenseExpiry);
      const remain = daysLeft < 0 ? `เกิน ${fmt(Math.abs(daysLeft))} วัน` : `${fmt(daysLeft)} วัน`;
      return `<tr>
        <td>${r.id}</td>
        <td>${r.maskedName}</td>
        <td>${r.position}</td>
        <td>${r.licenseNumber}</td>
        <td>${r.licenseExpiry}</td>
        <td>${remain}</td>
        <td>${r.cmeHours} ชม.</td>
        <td><span class="${STATUS_BADGE[r.status]}">${STATUS_LABEL[r.status]}</span></td>
      </tr>`;
    }).join("");
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    const all = await HRHK_API.getStaffList();
    const active = HRHK_PLAN.activeStaff(all);
    ROWS = active
      .filter((s) => s.licenseExpiry) // เฉพาะวิชาชีพที่ต้องมีใบอนุญาต
      .map((s) => ({ ...s, status: HRHK_PLAN.licenseStatus(s) }))
      .sort((a, b) => HRHK_PLAN.daysUntil(a.licenseExpiry) - HRHK_PLAN.daysUntil(b.licenseExpiry));

    renderStatCards(ROWS);
    ["search-box", "filter-status"].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", applyFilters);
    });
    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
