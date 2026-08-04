/**
 * จัดการ session ผู้ใช้งาน (เก็บ token ใน localStorage)
 * ใช้ guardPage() ที่หัวไฟล์ของหน้าที่ต้อง login ก่อนใช้งาน
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
    /** เรียกที่หัวหน้าเพจที่ต้อง login: ถ้ายังไม่ login จะเด้งไปหน้า login.html */
    guardPage() {
      if (!this.isLoggedIn()) {
        const next = encodeURIComponent(location.pathname.split("/").pop());
        location.href = "login.html?next=" + next;
      }
    },
    renderUserChip(elId) {
      const el = document.getElementById(elId);
      if (!el) return;
      const sess = this.getSession();
      if (!sess) return;
      el.innerHTML = `<span>${sess.displayName || sess.username}</span>
        <button class="btn-ghost-sm" id="logout-btn">ออกจากระบบ</button>`;
      document.getElementById("logout-btn").addEventListener("click", () => {
        HRHK_AUTH.clearSession();
        location.href = "login.html";
      });
    },
  };
})();
