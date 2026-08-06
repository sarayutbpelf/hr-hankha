/**
 * ฟังก์ชันช่วยคำนวณสำหรับโมดูลวางแผนบริหารงานบุคคล
 * ใช้ร่วมกันในหน้า: อัตรากำลัง, ใบอนุญาต, สืบทอดตำแหน่ง, พัฒนาบุคลากร,
 * การลา/ภาระงาน/ความเสี่ยง, ผังองค์กร
 */
(function () {
  const NOW = new Date(2026, 7, 4); // อ้างอิงวันที่ปัจจุบันของระบบ (4 ส.ค. 2569)

  function activeStaff(all) { return all.filter((s) => s.status === "active"); }

  function tenureYears(hireDate) {
    return (NOW - new Date(hireDate)) / (1000 * 60 * 60 * 24 * 365.25);
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.round((new Date(dateStr) - NOW) / (1000 * 60 * 60 * 24));
  }

  /** none = ไม่ต้องมีใบอนุญาต, valid, expiring (<=90 วัน), expired */
  function licenseStatus(s) {
    if (!s.licenseExpiry) return "none";
    const d = daysUntil(s.licenseExpiry);
    if (d < 0) return "expired";
    if (d <= 90) return "expiring";
    return "valid";
  }

  /** heuristic 0-100: อายุงานสั้น + สัญญาจ้างไม่มั่นคง + ผลงานต่ำ + ลาป่วยบ่อย */
  function flightRiskScore(s) {
    let score = 0;
    const tenure = tenureYears(s.hireDate);
    if (tenure < 2) score += 35;
    else if (tenure < 4) score += 15;
    if (s.employmentType === "daily_hire") score += 25;
    else if (s.employmentType === "monthly_hire") score += 15;
    if (typeof s.performanceScore === "number" && s.performanceScore < 3.3) score += 15;
    if (typeof s.leaveSick === "number" && s.leaveSick > 10) score += 15;
    return Math.min(100, score);
  }

  function riskLabel(score) {
    if (score >= 55) return { label: "เสี่ยงสูง", cls: "badge danger" };
    if (score >= 30) return { label: "เสี่ยงปานกลาง", cls: "badge amber" };
    return { label: "เสี่ยงต่ำ", cls: "badge" };
  }

  function fmt(n) { return Number(n).toLocaleString("th-TH"); }

  window.HRHK_PLAN = { NOW, activeStaff, tenureYears, daysUntil, licenseStatus, flightRiskScore, riskLabel, fmt };
})();
