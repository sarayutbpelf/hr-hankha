/**
 * ชั้นเชื่อมต่อข้อมูล (Data Access Layer)
 * - ถ้าตั้งค่า APP_CONFIG.GAS_WEB_APP_URL ไว้ -> เรียก Google Apps Script Web App
 *   (ซึ่งอ่าน/เขียนข้อมูลจริงใน Google Sheet)
 * - ถ้ายังไม่ตั้งค่า -> ใช้ข้อมูลจำลองใน localStorage (โหมดสาธิต)
 * หน้าเว็บอื่น ๆ เรียกใช้ผ่าน window.HRHK_API เท่านั้น ไม่ต้องสนใจว่าอยู่โหมดไหน
 *
 * ระบบสิทธิ์: ผู้ใช้ใหม่ที่สมัครสมาชิกจะมีสถานะ "pending" (รออนุมัติ) และ role "user"
 * โดยปริยาย ต้องได้รับการอนุมัติจากผู้ดูแลระบบ (role "admin") ก่อนจึงจะเข้าสู่ระบบได้
 * ฟังก์ชันจัดการผู้ใช้ (listUsers/updateUserStatus/setUserRole/resetPassword) สงวนไว้
 * เฉพาะผู้ใช้ที่มี role admin เท่านั้น — ฝั่ง server (Code.gs) ตรวจสอบสิทธิ์ซ้ำอีกชั้นเสมอ
 */
(function () {
  const isLive = () => !!(window.APP_CONFIG && window.APP_CONFIG.GAS_WEB_APP_URL);

  async function callGAS(action, payload) {
    const url = window.APP_CONFIG.GAS_WEB_APP_URL;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight on Apps Script
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) throw new Error("เครือข่ายขัดข้อง (" + res.status + ")");
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function requireDemoAdmin() {
    const sess = window.HRHK_AUTH && HRHK_AUTH.getSession();
    if (!sess || sess.role !== "admin") throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่ดำเนินการนี้ได้");
    return sess;
  }

  // ---------- Demo-mode implementations ----------
  async function demoLogin({ username, password }) {
    await delay(250);
    const users = HRHK_MOCK.getUsers();
    const u = users.find((x) => x.username === username && x.password === password);
    if (!u) throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    if (u.status === "pending") throw new Error("บัญชีนี้ยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ กรุณารอการอนุมัติก่อนเข้าสู่ระบบ");
    if (u.status === "suspended") throw new Error("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
    return { token: "demo-" + btoa(username + ":" + Date.now()), displayName: u.displayName, username: u.username, role: u.role || "user" };
  }
  async function demoRegister({ username, password, displayName }) {
    await delay(250);
    const users = HRHK_MOCK.getUsers();
    if (users.find((x) => x.username === username)) throw new Error("มีชื่อผู้ใช้นี้ในระบบแล้ว");
    users.push({ username, password, displayName, role: "user", status: "pending", createdAt: new Date().toISOString() });
    HRHK_MOCK.saveUsers(users);
    return { ok: true };
  }
  async function demoGetStaff() { await delay(150); return HRHK_MOCK.getStaff(); }
  async function demoUpsertStaff(record) {
    await delay(200);
    const list = HRHK_MOCK.getStaff();
    const idx = list.findIndex((s) => s.id === record.id);
    record.updatedAt = new Date().toISOString();
    if (idx >= 0) list[idx] = { ...list[idx], ...record };
    else { record.id = record.id || ("EMP" + Date.now()); list.push(record); }
    HRHK_MOCK.saveStaff(list);
    return record;
  }
  async function demoListUsers() {
    await delay(150);
    requireDemoAdmin();
    return HRHK_MOCK.getUsers().map((u) => ({ username: u.username, displayName: u.displayName, role: u.role || "user", status: u.status || "approved", createdAt: u.createdAt || null }));
  }
  async function demoUpdateUserStatus({ targetUsername, status }) {
    await delay(200);
    requireDemoAdmin();
    const users = HRHK_MOCK.getUsers();
    if (status === "rejected") {
      const filtered = users.filter((u) => u.username !== targetUsername);
      HRHK_MOCK.saveUsers(filtered);
      return { ok: true };
    }
    const u = users.find((x) => x.username === targetUsername);
    if (!u) throw new Error("ไม่พบผู้ใช้งานนี้");
    u.status = status;
    HRHK_MOCK.saveUsers(users);
    return { ok: true };
  }
  async function demoSetUserRole({ targetUsername, role }) {
    await delay(200);
    requireDemoAdmin();
    const users = HRHK_MOCK.getUsers();
    const u = users.find((x) => x.username === targetUsername);
    if (!u) throw new Error("ไม่พบผู้ใช้งานนี้");
    u.role = role;
    HRHK_MOCK.saveUsers(users);
    return { ok: true };
  }
  async function demoResetPassword({ targetUsername, newPassword }) {
    await delay(200);
    requireDemoAdmin();
    const users = HRHK_MOCK.getUsers();
    const u = users.find((x) => x.username === targetUsername);
    if (!u) throw new Error("ไม่พบผู้ใช้งานนี้");
    u.password = newPassword;
    HRHK_MOCK.saveUsers(users);
    return { ok: true };
  }

  // ---------- Public API ----------
  window.HRHK_API = {
    mode: () => (isLive() ? "live" : "demo"),

    async login(username, password) {
      if (isLive()) return callGAS("login", { username, password });
      return demoLogin({ username, password });
    },
    async register(username, password, displayName) {
      if (isLive()) return callGAS("register", { username, password, displayName });
      return demoRegister({ username, password, displayName });
    },
    async getStaffList() {
      if (isLive()) return callGAS("listStaff", {});
      return demoGetStaff();
    },
    async saveStaff(record) {
      if (isLive()) return callGAS("upsertStaff", record);
      return demoUpsertStaff(record);
    },

    // ---- เฉพาะผู้ดูแลระบบ (role admin) ----
    async listUsers() {
      const sess = HRHK_AUTH.getSession();
      if (isLive()) return callGAS("listUsers", { adminUsername: sess && sess.username });
      return demoListUsers();
    },
    async updateUserStatus(targetUsername, status) {
      const sess = HRHK_AUTH.getSession();
      if (isLive()) return callGAS("updateUserStatus", { adminUsername: sess && sess.username, targetUsername, status });
      return demoUpdateUserStatus({ targetUsername, status });
    },
    async setUserRole(targetUsername, role) {
      const sess = HRHK_AUTH.getSession();
      if (isLive()) return callGAS("setUserRole", { adminUsername: sess && sess.username, targetUsername, role });
      return demoSetUserRole({ targetUsername, role });
    },
    async resetPassword(targetUsername, newPassword) {
      const sess = HRHK_AUTH.getSession();
      if (isLive()) return callGAS("resetPassword", { adminUsername: sess && sess.username, targetUsername, newPassword });
      return demoResetPassword({ targetUsername, newPassword });
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (!isLive() && window.HRHK_MOCK) HRHK_MOCK.ensureSeeded();
    const badge = document.getElementById("mode-badge");
    if (badge) {
      badge.textContent = isLive() ? "เชื่อมต่อ Google Sheet" : "โหมดสาธิต (ข้อมูลจำลอง)";
      badge.classList.add(isLive() ? "badge" : "badge amber");
    }
  });
})();
