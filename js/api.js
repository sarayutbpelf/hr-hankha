/**
 * ชั้นเชื่อมต่อข้อมูล (Data Access Layer)
 * - ถ้าตั้งค่า APP_CONFIG.GAS_WEB_APP_URL ไว้ -> เรียก Google Apps Script Web App
 *   (ซึ่งอ่าน/เขียนข้อมูลจริงใน Google Sheet)
 * - ถ้ายังไม่ตั้งค่า -> ใช้ข้อมูลจำลองใน localStorage (โหมดสาธิต)
 * หน้าเว็บอื่น ๆ เรียกใช้ผ่าน window.HRHK_API เท่านั้น ไม่ต้องสนใจว่าอยู่โหมดไหน
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

  // ---------- Demo-mode implementations ----------
  async function demoLogin({ username, password }) {
    await delay(250);
    const users = HRHK_MOCK.getUsers();
    const u = users.find((x) => x.username === username && x.password === password);
    if (!u) throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    return { token: "demo-" + btoa(username + ":" + Date.now()), displayName: u.displayName, username: u.username };
  }
  async function demoRegister({ username, password, displayName }) {
    await delay(250);
    const users = HRHK_MOCK.getUsers();
    if (users.find((x) => x.username === username)) throw new Error("มีชื่อผู้ใช้นี้ในระบบแล้ว");
    users.push({ username, password, displayName });
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
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (!isLive() && window.HRHK_MOCK) HRHK_MOCK.ensureSeeded();
    const banner = document.getElementById("promo-banner");
    if (banner) {
      banner.textContent = isLive()
        ? "เชื่อมต่อฐานข้อมูล Google Sheet แล้ว — ข้อมูลทั้งหมดเป็นข้อมูลจริง"
        : "โหมดสาธิต — กำลังแสดงข้อมูลจำลอง เชื่อมต่อ Google Sheet ได้ตามขั้นตอนใน README";
      banner.classList.add("show");
      if (!isLive()) banner.classList.add("is-warning");
    }
  });
})();
