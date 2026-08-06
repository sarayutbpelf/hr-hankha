/**
 * ตั้งค่าการเชื่อมต่อระบบ
 * -----------------------------------------------------------------
 * เมื่อ deploy Google Apps Script เป็น Web App แล้ว (ดูขั้นตอนใน
 * apps-script/Code.gs และ README.md) ให้นำ URL ที่ได้มาใส่ด้านล่างนี้
 *
 * ตัวอย่าง:
 * GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbx.../exec"
 *
 * ถ้ายังไม่ตั้งค่า (เว้นว่างเป็น "") ระบบจะทำงานใน "โหมดสาธิต" โดยใช้
 * ข้อมูลจำลองที่เก็บใน localStorage ของเบราว์เซอร์แทน เพื่อให้ทดลอง
 * ใช้งานหน้าตาระบบได้ทันทีโดยไม่ต้องตั้งค่า Google Sheet ก่อน
 * -----------------------------------------------------------------
 */
window.APP_CONFIG = {
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbymjY85zW1NiDsJPs1yeRRt_M7rAO51uGp_AWX0npEVJSKn3pin6nGJDDx3BnxgJL7D/exec", // <-- ใส่ URL ของ Web App ที่ deploy จาก Google Apps Script
  HOSPITAL_NAME: "โรงพยาบาลหันคา",
  HOSPITAL_SUB: "ระบบบริหารงานทรัพยากรบุคคล",
  APP_VERSION: "1.0.0"
};
