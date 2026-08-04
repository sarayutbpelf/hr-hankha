/** ลงทะเบียน Service Worker เพื่อให้ใช้งานเป็น PWA ได้ (ติดตั้งลงหน้าจอ + ใช้งานออฟไลน์) */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = new URL("service-worker.js", document.baseURI).href;
    navigator.serviceWorker.register(swUrl).catch(() => {
      /* เงียบไว้ถ้าลงทะเบียนไม่สำเร็จ (เช่น เปิดจาก file://) */
    });
  });
}
