# ระบบบริหารงานทรัพยากรบุคคล โรงพยาบาลหันคา

Progressive Web App (PWA) สำหรับบริหารข้อมูลกำลังคนของโรงพยาบาล รันเป็นเว็บไซต์สาธารณะบน
GitHub Pages และใช้ **Google Sheet เป็นฐานข้อมูล** ผ่าน Google Apps Script

## ฟีเจอร์หลัก

| หน้า | Login | รายละเอียด |
|---|---|---|
| `index.html` แดชบอร์ด | ไม่ต้อง | ภาพรวมกำลังคน: ประเภทการจ้าง, ตำแหน่ง/กลุ่มงาน, Generation, FTE, กลุ่มวิชาชีพ, แนวโน้มเกษียณ, กราฟอายุ, ความเชี่ยวชาญ, ลาออก/เข้าใหม่ |
| `registry.html` ทะเบียนบุคลากร | ต้อง login | รายชื่อบุคลากร แสดงชื่อแบบปิดบังบางส่วน (เช่น ศรา\*\*\* ม่ว\*\*\*) พร้อมค้นหา/กรอง |
| `personnel.html` บันทึกข้อมูลรายบุคคล | ต้อง login | ฟอร์มเพิ่ม/แก้ไขข้อมูลบุคลากรรายคน เป็นฐานข้อมูลหลักที่ป้อนเข้าแดชบอร์ดและทะเบียน |
| `login.html` / `register.html` | - | เข้าสู่ระบบ / สมัครสมาชิก |

รองรับติดตั้งเป็นแอป (Add to Home Screen) และเปิดใช้งานได้บางส่วนแบบออฟไลน์ผ่าน Service Worker

## โครงสร้างโปรเจกต์

```
hr-hankha/
├─ index.html            แดชบอร์ด (public)
├─ login.html
├─ register.html
├─ registry.html         ทะเบียนบุคลากร (login)
├─ personnel.html        บันทึกข้อมูลรายบุคคล (login)
├─ manifest.json         PWA manifest
├─ service-worker.js     แคชไฟล์สำหรับใช้งานออฟไลน์
├─ css/style.css
├─ js/
│  ├─ config.js          ตั้งค่า URL ของ Apps Script
│  ├─ mockdata.js        ข้อมูลจำลอง (โหมดสาธิต)
│  ├─ api.js             ชั้นเชื่อมต่อข้อมูล (live / demo)
│  ├─ auth.js            จัดการ session
│  ├─ dashboard.js / registry.js / personnel.js
│  └─ pwa.js             ลงทะเบียน Service Worker
├─ icons/
└─ apps-script/
   └─ Code.gs            โค้ด backend สำหรับ Google Apps Script
```

## 1) ทดลองใช้งานทันที (โหมดสาธิต)

เปิด `index.html` ได้เลย (หรือ deploy ขึ้น GitHub Pages ตามขั้นตอนด้านล่าง) ระบบจะสร้างข้อมูล
บุคลากรจำลอง ~186 คนเก็บไว้ใน localStorage ของเบราว์เซอร์โดยอัตโนมัติ

- บัญชีทดสอบ: **admin / admin1234**
- ข้อมูลที่บันทึกในโหมดนี้จะอยู่เฉพาะในเบราว์เซอร์เครื่องนั้น ๆ ไม่ใช่ข้อมูลจริงที่แชร์กันได้
- เหมาะสำหรับตรวจสอบหน้าตา/การทำงานของระบบก่อนเชื่อมต่อฐานข้อมูลจริง

## 2) เชื่อมต่อฐานข้อมูลจริงด้วย Google Sheet

### ขั้นตอนที่ 1 — สร้าง Google Sheet และ Apps Script
1. สร้าง Google Sheet ใหม่ (ตั้งชื่อ เช่น `HRHK-Database`)
2. เมนู **ส่วนขยาย (Extensions) > Apps Script**
3. ลบโค้ดเดิมทั้งหมด แล้ววางเนื้อหาจากไฟล์ `apps-script/Code.gs` ที่มากับโปรเจกต์นี้
4. เลือกฟังก์ชัน `setupSheets` แล้วกด **Run** (ครั้งแรกจะต้องอนุญาตสิทธิ์การเข้าถึง Sheet)
   - จะได้ชีต `Staff` และ `Users` พร้อมหัวตาราง และบัญชี admin/admin1234 อัตโนมัติ

### ขั้นตอนที่ 2 — Deploy เป็น Web App
1. มุมขวาบน กด **Deploy > New deployment**
2. เลือกประเภท **Web app**
3. ตั้งค่า:
   - **Execute as:** Me (บัญชีของคุณ)
   - **Who has access:** Anyone
4. กด Deploy แล้วคัดลอก **Web app URL** ที่ได้ (ลงท้ายด้วย `/exec`)

### ขั้นตอนที่ 3 — ตั้งค่าเว็บไซต์ให้เรียกใช้ Apps Script
เปิดไฟล์ `js/config.js` แล้วใส่ URL ที่ได้:

```js
window.APP_CONFIG = {
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec",
  ...
};
```

เมื่อบันทึกและรีเฟรชหน้าเว็บ ระบบจะเปลี่ยนจาก "โหมดสาธิต" เป็น "เชื่อมต่อ Google Sheet" โดยอัตโนมัติ
(สังเกตได้จากป้ายบนแถบเมนู) ข้อมูลทั้งหมดจะอ่าน/เขียนไปที่ Google Sheet จริง

> **หมายเหตุความปลอดภัย:** การเข้ารหัสรหัสผ่านใน `Code.gs` เป็นแบบพื้นฐาน (HMAC-SHA256)
> เหมาะสำหรับใช้งานภายในหน่วยงานที่ไม่เปิดสู่สาธารณะวงกว้าง หากต้องการความปลอดภัยระดับสูงขึ้น
> แนะนำให้พิจารณาใช้ Google Identity / OAuth หรือจำกัดสิทธิ์การเข้าถึง Web App เพิ่มเติม

## 3) Deploy เป็นเว็บไซต์บน GitHub Pages

1. สร้าง repository ใหม่บน GitHub เช่น `hr-hankha`
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น repository (เก็บโครงสร้างโฟลเดอร์เดิมไว้)
3. ไปที่ **Settings > Pages**
4. Source เลือก **Deploy from a branch** → Branch: `main` → Folder: `/ (root)`
5. รอสักครู่ เว็บไซต์จะพร้อมใช้งานที่ `https://<username>.github.io/hr-hankha/`

เนื่องจากไฟล์ทั้งหมดใช้ path แบบสัมพัทธ์ (relative path) จึงรองรับการ deploy ใน sub-path ของ
GitHub Pages ได้โดยไม่ต้องแก้ไขเพิ่มเติม

## การปรับแต่งข้อมูลอ้างอิง

- รายการ **ประเภทการจ้าง**, **ตำแหน่ง**, **กลุ่มงาน**, **สาขาความเชี่ยวชาญ** กำหนดไว้ในไฟล์
  `js/mockdata.js` (ตัวแปร `EMP_TYPES`, `POSITIONS`, `DEPARTMENTS`, `SPECIALTIES`) — ใช้ทั้งใน
  โหมดสาธิตและเป็นตัวเลือกในฟอร์มบันทึกข้อมูล ปรับแก้ให้ตรงกับโครงสร้างจริงของโรงพยาบาลได้ทันที
- คอลัมน์ของ Google Sheet กำหนดไว้ใน `apps-script/Code.gs` ตัวแปร `STAFF_HEADERS` /
  `USERS_HEADERS` หากต้องการเพิ่มฟิลด์ใหม่ ให้เพิ่มทั้งในหัวตาราง Sheet, ฟอร์ม `personnel.html`
  และ `js/personnel.js`

## เทคโนโลยีที่ใช้

- HTML / CSS / Vanilla JavaScript (ไม่ต้อง build)
- [Chart.js](https://www.chartjs.org/) สำหรับกราฟในแดชบอร์ด (โหลดผ่าน CDN)
- Google Apps Script + Google Sheets สำหรับฐานข้อมูลและ API
- Web App Manifest + Service Worker สำหรับความสามารถ PWA
