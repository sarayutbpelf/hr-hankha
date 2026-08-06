/**
 * ==========================================================================
 * ระบบบริหารงานทรัพยากรบุคคล โรงพยาบาลหันคา — Backend (Google Apps Script)
 * ==========================================================================
 * วิธีใช้งาน (สรุป ดูรายละเอียดเต็มใน README.md):
 *  1. สร้าง Google Sheet ใหม่ 1 ไฟล์ แล้วสร้างชีตชื่อ "Staff" และ "Users"
 *     พร้อมหัวตารางตามที่กำหนดไว้ด้านล่าง (ฟังก์ชัน setupSheets() จะสร้างให้อัตโนมัติ)
 *  2. เปิด Extensions > Apps Script แล้ววางไฟล์นี้ทับ Code.gs เดิม
 *  3. รันฟังก์ชัน setupSheets() หนึ่งครั้ง (Run > setupSheets) เพื่อสร้างหัวตาราง
 *     และบัญชีผู้ดูแลระบบเริ่มต้น (admin / admin1234, role admin, สถานะ approved)
 *  4. Deploy > New deployment > Web app
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     คัดลอก URL ที่ได้ไปใส่ใน js/config.js -> GAS_WEB_APP_URL
 *
 * ระบบสิทธิ์: ผู้ใช้ใหม่ที่สมัครผ่าน register.html จะได้ role "user" และสถานะ
 * "pending" (รออนุมัติ) โดยปริยาย ต้องรอผู้ดูแลระบบ (role "admin") อนุมัติก่อน
 * จึงจะเข้าสู่ระบบได้ ฟังก์ชันจัดการผู้ใช้ทั้งหมดด้านล่าง (listUsers_, updateUserStatus_,
 * setUserRole_, resetPassword_) ตรวจสอบสิทธิ์ผู้เรียกซ้ำทุกครั้งผ่าน requireAdmin_()
 * ==========================================================================
 */

const STAFF_SHEET = "Staff";
const USERS_SHEET = "Users";
const SALT = "hrhk-hospital-2026"; // เกลือสำหรับ hash รหัสผ่านแบบพื้นฐาน

const STAFF_HEADERS = [
  "id","firstName","lastName","maskedName","birthDate","age","generation",
  "position","department","professionalGroup","employmentType","employmentTypeLabel",
  "fte","specialty","hireDate","resignDate","status","phone",
  "licenseNumber","licenseExpiry","cmeHours",
  "performanceScore","idpGoal","idpStatus","trainingHours",
  "leaveSick","leavePersonal","leaveVacation",
  "updatedAt"
];
const USERS_HEADERS = ["username","passwordHash","displayName","role","status","createdAt"];

/** ---------- Setup ---------- */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, STAFF_SHEET, STAFF_HEADERS);
  ensureSheet_(ss, USERS_SHEET, USERS_HEADERS);

  const usersSheet = ss.getSheetByName(USERS_SHEET);
  if (usersSheet.getLastRow() < 2) {
    usersSheet.appendRow(["admin", hashPassword_("admin1234"), "ผู้ดูแลระบบ HR", "admin", "approved", new Date().toISOString()]);
  }
}
function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

/** ---------- Web app entry points ---------- */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) {
    return jsonOut_({ error: "รูปแบบข้อมูลไม่ถูกต้อง" });
  }
  const action = body.action;
  const payload = body.payload || {};
  try {
    let result;
    switch (action) {
      case "login": result = login_(payload); break;
      case "register": result = register_(payload); break;
      case "listStaff": result = listStaff_(); break;
      case "upsertStaff": result = upsertStaff_(payload); break;
      case "listUsers": result = listUsers_(payload); break;
      case "updateUserStatus": result = updateUserStatus_(payload); break;
      case "setUserRole": result = setUserRole_(payload); break;
      case "resetPassword": result = resetPassword_(payload); break;
      default: throw new Error("ไม่รู้จักคำสั่ง: " + action);
    }
    return jsonOut_({ result });
  } catch (err) {
    return jsonOut_({ error: err.message });
  }
}
function doGet(e) {
  return jsonOut_({ result: "HRHK API is running. Use POST." });
}
function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** ---------- Auth ---------- */
function hashPassword_(password) {
  const bytes = Utilities.computeHmacSha256Signature(password, SALT);
  return bytes.map((b) => ("0" + (b & 0xff).toString(16)).slice(-2)).join("");
}
function login_({ username, password }) {
  if (!username || !password) throw new Error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
  const rows = sheetToObjects_(USERS_SHEET);
  const user = rows.find((r) => r.username === username);
  if (!user || user.passwordHash !== hashPassword_(password)) {
    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }
  if (user.status === "pending") throw new Error("บัญชีนี้ยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ กรุณารอการอนุมัติก่อนเข้าสู่ระบบ");
  if (user.status === "suspended") throw new Error("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
  return { token: Utilities.getUuid(), username: user.username, displayName: user.displayName, role: user.role || "user" };
}
function register_({ username, password, displayName }) {
  if (!username || !password || !displayName) throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  const rows = sheetToObjects_(USERS_SHEET);
  if (rows.some((r) => r.username === username)) throw new Error("มีชื่อผู้ใช้นี้ในระบบแล้ว");
  sheet.appendRow([username, hashPassword_(password), displayName, "user", "pending", new Date().toISOString()]);
  return { ok: true };
}

/** ---------- Admin: user management (ต้องมี role admin + status approved เท่านั้น) ---------- */
function requireAdmin_(adminUsername) {
  if (!adminUsername) throw new Error("ไม่มีสิทธิ์ดำเนินการ (ไม่พบผู้ใช้งาน)");
  const rows = sheetToObjects_(USERS_SHEET);
  const admin = rows.find((r) => r.username === adminUsername);
  if (!admin || admin.role !== "admin" || admin.status !== "approved") {
    throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่ดำเนินการนี้ได้");
  }
  return admin;
}
function findUserRow_(sheet, headers, username) {
  const data = sheet.getDataRange().getValues();
  const col = headers.indexOf("username");
  for (let i = 1; i < data.length; i++) {
    if (data[i][col] === username) return i + 1; // 1-indexed sheet row
  }
  return -1;
}
function listUsers_({ adminUsername }) {
  requireAdmin_(adminUsername);
  return sheetToObjects_(USERS_SHEET).map((u) => ({
    username: u.username, displayName: u.displayName, role: u.role || "user",
    status: u.status || "approved", createdAt: u.createdAt || null,
  }));
}
function updateUserStatus_({ adminUsername, targetUsername, status }) {
  requireAdmin_(adminUsername);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  const headers = sheet.getDataRange().getValues()[0];
  const rowIndex = findUserRow_(sheet, headers, targetUsername);
  if (rowIndex < 0) throw new Error("ไม่พบผู้ใช้งานนี้");

  if (status === "rejected") {
    sheet.deleteRow(rowIndex);
    return { ok: true };
  }
  const statusCol = headers.indexOf("status") + 1;
  sheet.getRange(rowIndex, statusCol).setValue(status);
  return { ok: true };
}
function setUserRole_({ adminUsername, targetUsername, role }) {
  requireAdmin_(adminUsername);
  if (adminUsername === targetUsername && role !== "admin") {
    throw new Error("ไม่สามารถถอดสิทธิ์ผู้ดูแลระบบของตนเองได้");
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  const headers = sheet.getDataRange().getValues()[0];
  const rowIndex = findUserRow_(sheet, headers, targetUsername);
  if (rowIndex < 0) throw new Error("ไม่พบผู้ใช้งานนี้");
  const roleCol = headers.indexOf("role") + 1;
  sheet.getRange(rowIndex, roleCol).setValue(role);
  return { ok: true };
}
function resetPassword_({ adminUsername, targetUsername, newPassword }) {
  requireAdmin_(adminUsername);
  if (!newPassword || newPassword.length < 8) throw new Error("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  const headers = sheet.getDataRange().getValues()[0];
  const rowIndex = findUserRow_(sheet, headers, targetUsername);
  if (rowIndex < 0) throw new Error("ไม่พบผู้ใช้งานนี้");
  const pwCol = headers.indexOf("passwordHash") + 1;
  sheet.getRange(rowIndex, pwCol).setValue(hashPassword_(newPassword));
  return { ok: true };
}

/** ---------- Staff ---------- */
function listStaff_() {
  return sheetToObjects_(STAFF_SHEET);
}
function upsertStaff_(record) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STAFF_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  record.updatedAt = new Date().toISOString();
  if (!record.id) record.id = "EMP" + new Date().getTime();

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf("id")] === record.id) { rowIndex = i + 1; break; }
  }
  const rowValues = headers.map((h) => (record[h] !== undefined ? record[h] : ""));
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return record;
}

/** ---------- Helpers ---------- */
function sheetToObjects_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).filter((row) => row.some((c) => c !== "")).map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    if (obj.fte !== undefined) obj.fte = Number(obj.fte);
    if (obj.age !== undefined) obj.age = Number(obj.age);
    return obj;
  });
}
