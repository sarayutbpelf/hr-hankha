/**
 * จัดการ session ผู้ใช้งาน (เก็บ token ใน localStorage)
 * ใช้ guardPage() ที่หัวไฟล์ของหน้าที่ต้อง login ก่อนใช้งาน
 * ใช้ guardAdminPage() ที่หัวไฟล์ของหน้าที่ต้องมีสิทธิ์ผู้ดูแลระบบ (role admin) เท่านั้น
 */
(function () {
  const KEY = "hrhk_session";

  window.HRHK_AUTH = {
    getSession() {
      try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
    },
    setSession(sess) { localStorage.setItem(KEY, JSON.stringify(sess)); },
    clearSession() { localStorage.removeItem(KEY); },
    isLoggedIn() { return !!this.getSession(); },
    isAdmin() { const s = this.getSession(); return !!s && s.role === "admin"; },
    /** เรียกที่หัวหน้าเพจที่ต้อง login: ถ้ายังไม่ login จะเด้งไปหน้า login.html */
    guardPage() {
      if (!this.isLoggedIn()) {
        const next = encodeURIComponent(location.pathname.split("/").pop());
        location.href = "login.html?next=" + next;
      }
    },
    /** เรียกที่หัวหน้าเพจที่ต้องมีสิทธิ์ผู้ดูแลระบบเท่านั้น เช่น admin.html */
    guardAdminPage() {
      this.guardPage();
      if (this.isLoggedIn() && !this.isAdmin()) {
        location.href = "index.html";
      }
    },
    renderUserChip(elId) {
      const el = document.getElementById(elId);
      if (!el) return;
      const sess = this.getSession();
      if (!sess) return;
      const roleTag = sess.role === "admin" ? `<span class="badge amber" style="margin-right:2px">ผู้ดูแลระบบ</span>` : "";
      el.innerHTML = `${roleTag}<span>${sess.displayName || sess.username}</span>
        <button class="btn-ghost-sm" id="logout-btn">ออกจากระบบ</button>`;
      document.getElementById("logout-btn").addEventListener("click", () => {
        HRHK_AUTH.clearSession();
        location.href = "login.html";
      });
      // แสดงลิงก์เฉพาะผู้ดูแลระบบ (เช่นเมนู "ผู้ดูแลระบบ" ในนาว์บาร์) ที่ซ่อนไว้เป็นค่าเริ่มต้น
      if (sess.role === "admin") {
        document.querySelectorAll(".admin-only").forEach((n) => { n.classList.remove("admin-only"); });
      }
    },
  };
})();
