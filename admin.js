/**
 * ตรรกะหน้าผู้ดูแลระบบ (ต้อง login + role admin เท่านั้น — ตรวจสอบด้วย guardAdminPage())
 */
(function () {
  let USERS = [];

  const STATUS_LABEL = { pending: "รออนุมัติ", approved: "ใช้งานอยู่", suspended: "ระงับการใช้งาน" };
  const STATUS_BADGE = { pending: "badge amber", approved: "badge", suspended: "badge danger" };

  function fmt(n) { return n.toLocaleString("th-TH"); }
  function fmtDate(iso) {
    if (!iso) return "-";
    try { return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return "-"; }
  }
  function showMsg(id, text) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 4000);
  }

  function renderStatCards() {
    const total = USERS.length;
    const pending = USERS.filter((u) => u.status === "pending").length;
    const admins = USERS.filter((u) => u.role === "admin").length;
    const suspended = USERS.filter((u) => u.status === "suspended").length;
    const cards = [
      { label: "ผู้ใช้งานทั้งหมด", value: fmt(total) },
      { label: "รออนุมัติ", value: fmt(pending) },
      { label: "ผู้ดูแลระบบ", value: fmt(admins) },
      { label: "ถูกระงับการใช้งาน", value: fmt(suspended) },
    ];
    document.getElementById("stat-cards").innerHTML = cards.map((c) => `
      <div class="card stat-card">
        <div class="stat-num">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function renderPending() {
    const pending = USERS.filter((u) => u.status === "pending");
    const tbody = document.getElementById("pending-tbody");
    const empty = document.getElementById("pending-empty");
    if (!pending.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";
    tbody.innerHTML = pending.map((u) => `
      <tr>
        <td>${u.username}</td>
        <td>${u.displayName}</td>
        <td>${fmtDate(u.createdAt)}</td>
        <td style="display:flex; gap:8px">
          <button class="btn btn-primary" style="height:30px; padding:0 12px; font-size:12.5px" data-action="approve" data-user="${u.username}">อนุมัติ</button>
          <button class="btn btn-secondary" style="height:30px; padding:0 12px; font-size:12.5px" data-action="reject" data-user="${u.username}">ปฏิเสธ</button>
        </td>
      </tr>`).join("");
  }

  function renderUsers(currentUsername) {
    const others = USERS.filter((u) => u.status !== "pending");
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = others.map((u) => {
      const isSelf = u.username === currentUsername;
      const roleBadge = u.role === "admin" ? '<span class="badge amber">ผู้ดูแลระบบ</span>' : '<span class="badge gray">ผู้ใช้งานทั่วไป</span>';
      const toggleRoleBtn = u.role === "admin"
        ? `<button class="btn btn-secondary" style="height:30px; padding:0 10px; font-size:12px" data-action="demote" data-user="${u.username}" ${isSelf ? "disabled title='ไม่สามารถถอดสิทธิ์ตนเองได้'" : ""}>ถอดสิทธิ์แอดมิน</button>`
        : `<button class="btn btn-secondary" style="height:30px; padding:0 10px; font-size:12px" data-action="promote" data-user="${u.username}">ตั้งเป็นแอดมิน</button>`;
      const toggleStatusBtn = u.status === "suspended"
        ? `<button class="btn btn-secondary" style="height:30px; padding:0 10px; font-size:12px" data-action="reactivate" data-user="${u.username}">เปิดใช้งาน</button>`
        : `<button class="btn btn-secondary" style="height:30px; padding:0 10px; font-size:12px" data-action="suspend" data-user="${u.username}" ${isSelf ? "disabled title='ไม่สามารถระงับบัญชีตนเองได้'" : ""}>ระงับการใช้งาน</button>`;
      return `<tr>
        <td>${u.username}${isSelf ? ' <span class="badge gray">คุณ</span>' : ""}</td>
        <td>${u.displayName}</td>
        <td>${roleBadge}</td>
        <td><span class="${STATUS_BADGE[u.status]}">${STATUS_LABEL[u.status]}</span></td>
        <td style="display:flex; gap:8px; flex-wrap:wrap">${toggleRoleBtn}${toggleStatusBtn}</td>
      </tr>`;
    }).join("");
  }

  function renderUserSelect() {
    const sel = document.getElementById("f-target-user");
    const approved = USERS.filter((u) => u.status !== "pending");
    sel.innerHTML = approved.map((u) => `<option value="${u.username}">${u.username} — ${u.displayName}</option>`).join("");
  }

  async function reload() {
    const sess = HRHK_AUTH.getSession();
    USERS = await HRHK_API.listUsers();
    renderStatCards();
    renderPending();
    renderUsers(sess.username);
    renderUserSelect();
  }

  async function handleAction(action, username) {
    const errBox = document.getElementById("admin-error");
    errBox.classList.remove("show");
    try {
      if (action === "approve") await HRHK_API.updateUserStatus(username, "approved");
      else if (action === "reject") await HRHK_API.updateUserStatus(username, "rejected");
      else if (action === "suspend") await HRHK_API.updateUserStatus(username, "suspended");
      else if (action === "reactivate") await HRHK_API.updateUserStatus(username, "approved");
      else if (action === "promote") await HRHK_API.setUserRole(username, "admin");
      else if (action === "demote") await HRHK_API.setUserRole(username, "user");
      showMsg("admin-success", "ดำเนินการสำเร็จ");
      await reload();
    } catch (err) {
      errBox.textContent = err.message || "ดำเนินการไม่สำเร็จ";
      errBox.classList.add("show");
    }
  }

  function wireEvents() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      handleAction(btn.dataset.action, btn.dataset.user);
    });

    document.getElementById("reset-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = document.getElementById("admin-error");
      errBox.classList.remove("show");
      const targetUsername = document.getElementById("f-target-user").value;
      const newPassword = document.getElementById("f-new-password").value;
      try {
        await HRHK_API.resetPassword(targetUsername, newPassword);
        showMsg("admin-success", `ตั้งรหัสผ่านใหม่ให้ ${targetUsername} เรียบร้อยแล้ว`);
        document.getElementById("f-new-password").value = "";
      } catch (err) {
        errBox.textContent = err.message || "ตั้งรหัสผ่านไม่สำเร็จ";
        errBox.classList.add("show");
      }
    });
  }

  async function init() {
    HRHK_AUTH.renderUserChip("user-chip");
    wireEvents();
    await reload();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
