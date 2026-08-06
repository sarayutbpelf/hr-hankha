/**
 * โหมดสาธิต (Demo Mode)
 * สร้างข้อมูลบุคลากรจำลองที่สมจริงสำหรับโรงพยาบาลชุมชนขนาดกลาง
 * เก็บไว้ใน localStorage คีย์ "hrhk_demo_staff" / "hrhk_demo_users"
 * โครงสร้างข้อมูลถูกออกแบบให้ตรงกับคอลัมน์ใน Google Sheet ตาม README
 *
 * v2: เพิ่มฟิลด์สำหรับโมดูลวางแผนบริหารงานบุคคล — ใบอนุญาต/CME,
 * ผลปฏิบัติงาน/แผนพัฒนารายบุคคล (IDP), วันลา, และกรอบอัตรากำลังมาตรฐาน
 */
(function () {
  const SEED_VERSION = 3; // bump this to force re-seed when the schema changes

  const THAI_FIRST = ["สมชาย","สมหญิง","วิชัย","วิภา","ประยุทธ","อรุณี","ณัฐพล","ปิยะดา","ธนากร","กมลวรรณ",
    "สุรชัย","วรรณา","ชัยวัฒน์","รัตนา","ศราวุธ","มยุรี","อนุชา","พรทิพย์","วีระ","สุกัญญา",
    "จักรกฤษณ์","นภาพร","ธีรพงษ์","อัจฉรา","สมบัติ","ละออง","กิตติศักดิ์","วราภรณ์","ประเสริฐ","บุษบา",
    "อภิสิทธิ์","ศิริพร","ไพโรจน์","จันทร์เพ็ญ","สุริยา","เกศินี","วิเชียร","นงลักษณ์","ชาญชัย","พิมพ์ใจ"];
  const THAI_LAST = ["ใจดี","มั่งมี","รักเรียน","สายบัว","แก้วมณี","ทองสุข","ศรีสวัสดิ์","บุญมา","ผลเจริญ","วงศ์สกุล",
    "เพชรรัตน์","ชื่นใจ","สว่างวงศ์","ทิพย์มณี","อ่อนน้อม","พงษ์ไพร","สุขสมบูรณ์","แสงทอง","ม่วงงาม","เย็นใจ"];

  const DEPARTMENTS = ["กลุ่มงานการพยาบาล","กลุ่มงานเวชกรรม","กลุ่มงานทันตกรรม","กลุ่มงานเภสัชกรรม",
    "กลุ่มงานเทคนิคการแพทย์","กลุ่มงานรังสีวิทยา","กลุ่มงานเวชกรรมฟื้นฟู","กลุ่มงานควบคุมโรคติดต่อ",
    "กลุ่มงานประกันสุขภาพยุทธศาสตร์และสารสนเทศ","กลุ่มงานบริหารทั่วไป","กลุ่มงานการแพทย์แผนไทยฯ","กลุ่มงานอนามัยชุมชน"];

  const POSITIONS = [
    {pos:"แพทย์", group:"แพทย์", dept:"กลุ่มงานเวชกรรม"},
    {pos:"ทันตแพทย์", group:"ทันตแพทย์", dept:"กลุ่มงานทันตกรรม"},
    {pos:"เภสัชกร", group:"เภสัชกร", dept:"กลุ่มงานเภสัชกรรม"},
    {pos:"พยาบาลวิชาชีพ", group:"พยาบาล", dept:"กลุ่มงานการพยาบาล"},
    {pos:"นักวิชาการสาธารณสุข", group:"สหวิชาชีพ", dept:"กลุ่มงานควบคุมโรคติดต่อ"},
    {pos:"นักเทคนิคการแพทย์", group:"สหวิชาชีพ", dept:"กลุ่มงานเทคนิคการแพทย์"},
    {pos:"นักรังสีการแพทย์", group:"สหวิชาชีพ", dept:"กลุ่มงานรังสีวิทยา"},
    {pos:"นักกายภาพบำบัด", group:"สหวิชาชีพ", dept:"กลุ่มงานเวชกรรมฟื้นฟู"},
    {pos:"นักวิชาการสาธารณสุข (ทันตสาธารณสุข)", group:"สหวิชาชีพ", dept:"กลุ่มงานทันตกรรม"},
    {pos:"เจ้าพนักงานเภสัชกรรม", group:"สายสนับสนุน", dept:"กลุ่มงานเภสัชกรรม"},
    {pos:"เจ้าพนักงานสาธารณสุข", group:"สายสนับสนุน", dept:"กลุ่มงานอนามัยชุมชน"},
    {pos:"เจ้าพนักงานการเงินและบัญชี", group:"สายสนับสนุน", dept:"กลุ่มงานบริหารทั่วไป"},
    {pos:"นักจัดการงานทั่วไป", group:"สายสนับสนุน", dept:"กลุ่มงานบริหารทั่วไป"},
    {pos:"นักวิชาการคอมพิวเตอร์", group:"สายสนับสนุน", dept:"กลุ่มงานประกันสุขภาพยุทธศาสตร์และสารสนเทศ"},
    {pos:"ผู้ช่วยพยาบาล", group:"พยาบาล", dept:"กลุ่มงานการพยาบาล"},
    {pos:"พนักงานช่วยเหลือคนไข้", group:"สายสนับสนุน", dept:"กลุ่มงานการพยาบาล"},
    {pos:"พนักงานขับรถยนต์", group:"สายสนับสนุน", dept:"กลุ่มงานบริหารทั่วไป"},
    {pos:"พนักงานทั่วไป", group:"สายสนับสนุน", dept:"กลุ่มงานบริหารทั่วไป"},
    {pos:"แพทย์แผนไทยประยุกต์", group:"สหวิชาชีพ", dept:"กลุ่มงานการแพทย์แผนไทยฯ"},
  ];

  // กรอบอัตรากำลังมาตรฐานต่อตำแหน่ง (ใช้เทียบกับจำนวนจริงในโมดูลอัตรากำลัง)
  const MANPOWER_FRAME = {
    "แพทย์": 10, "ทันตแพทย์": 4, "เภสัชกร": 8, "พยาบาลวิชาชีพ": 65,
    "นักวิชาการสาธารณสุข": 6, "นักเทคนิคการแพทย์": 5, "นักรังสีการแพทย์": 3,
    "นักกายภาพบำบัด": 3, "นักวิชาการสาธารณสุข (ทันตสาธารณสุข)": 2,
    "เจ้าพนักงานเภสัชกรรม": 4, "เจ้าพนักงานสาธารณสุข": 6,
    "เจ้าพนักงานการเงินและบัญชี": 4, "นักจัดการงานทั่วไป": 4,
    "นักวิชาการคอมพิวเตอร์": 2, "ผู้ช่วยพยาบาล": 20,
    "พนักงานช่วยเหลือคนไข้": 15, "พนักงานขับรถยนต์": 5,
    "พนักงานทั่วไป": 8, "แพทย์แผนไทยประยุกต์": 3,
  };

  const EMP_TYPES = [
    {key:"civil", label:"ข้าราชการ", weight:22, fte:1.0},
    {key:"gov_emp", label:"พนักงานราชการ", weight:12, fte:1.0},
    {key:"perm_hire", label:"ลูกจ้างประจำ", weight:6, fte:1.0},
    {key:"moph_emp", label:"พนักงานกระทรวงสาธารณสุข", weight:28, fte:1.0},
    {key:"monthly_hire", label:"ลูกจ้างชั่วคราว (รายเดือน)", weight:20, fte:0.9},
    {key:"daily_hire", label:"ลูกจ้างชั่วคราว (รายวัน)", weight:12, fte:0.5},
  ];

  const SPECIALTIES = ["เวชปฏิบัติทั่วไป","อายุรศาสตร์","กุมารเวชศาสตร์","ศัลยศาสตร์ออร์โธปิดิกส์",
    "เวชศาสตร์ครอบครัว","การพยาบาลผู้ป่วยวิกฤต","การพยาบาลอนามัยชุมชน","เภสัชกรรมคลินิก",
    "ทันตกรรมทั่วไป","รังสีวินิจฉัย","กายภาพบำบัดระบบกระดูกและกล้ามเนื้อ","เวชศาสตร์ฟื้นฟู",
    "ระบาดวิทยา","อาชีวอนามัย","การพยาบาลเวชปฏิบัติ","เทคนิคการแพทย์ห้องปฏิบัติการ", "-"];

  // กลุ่มวิชาชีพที่ต้องมีใบอนุญาตประกอบวิชาชีพ
  const LICENSE_GROUPS = new Set(["แพทย์", "ทันตแพทย์", "เภสัชกร", "พยาบาล"]);

  const IDP_GOALS = ["พัฒนาทักษะภาวะผู้นำ", "อบรมเฉพาะทางเพิ่มเติม", "พัฒนาทักษะดิจิทัล/ระบบสารสนเทศ",
    "เตรียมความพร้อมสู่ตำแหน่งบริหาร", "พัฒนาทักษะการสื่อสารกับผู้ป่วย", "อบรมมาตรฐานความปลอดภัยผู้ป่วย",
    "พัฒนาทักษะการทำงานเป็นทีม", "อบรมเชิงลึกด้านเทคโนโลยีทางการแพทย์"];
  const IDP_STATUS = ["ยังไม่เริ่ม", "กำลังดำเนินการ", "เสร็จสิ้น"];

  function seededRandom(seed) {
    let s = seed;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  const rand = seededRandom(20260804);
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function weightedEmpType() {
    const total = EMP_TYPES.reduce((a, b) => a + b.weight, 0);
    let r = rand() * total;
    for (const t of EMP_TYPES) { if (r < t.weight) return t; r -= t.weight; }
    return EMP_TYPES[0];
  }
  function randDate(startYear, endYear) {
    const y = startYear + Math.floor(rand() * (endYear - startYear));
    const m = 1 + Math.floor(rand() * 12);
    const d = 1 + Math.floor(rand() * 28);
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  function genFor(y) {
    if (y >= 1997) return "Gen Z";
    if (y >= 1981) return "Gen Y";
    if (y >= 1965) return "Gen X";
    return "Baby Boomer";
  }
  function maskName(name) {
    if (!name) return "";
    if (name.length <= 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 1);
  }

  function generateStaff(n) {
    const staff = [];
    const now = new Date(2026, 7, 4); // 4 Aug 2026
    for (let i = 0; i < n; i++) {
      const first = pick(THAI_FIRST), last = pick(THAI_LAST);
      const posInfo = pick(POSITIONS);
      const empType = weightedEmpType();
      const birthYear = 1962 + Math.floor(rand() * 42); // 1962-2003
      const birthDate = randDate(birthYear, birthYear + 1);
      const age = now.getFullYear() - birthYear;
      const hireYear = Math.min(2025, birthYear + 22 + Math.floor(rand() * 15));
      const hireDate = randDate(hireYear, Math.min(hireYear + 1, 2026));
      // small chance of resignation for turnover chart
      let resignDate = null, status = "active";
      if (rand() < 0.08) {
        const rYear = Math.min(2026, new Date(hireDate).getFullYear() + 1 + Math.floor(rand() * 5));
        resignDate = randDate(rYear, Math.min(rYear + 1, 2027));
        status = "resigned";
      }
      if (age >= 60) { status = status === "resigned" ? "resigned" : "retired"; }

      // ---- ใบอนุญาตประกอบวิชาชีพ & CME ----
      const needsLicense = LICENSE_GROUPS.has(posInfo.group);
      let licenseNumber = "-", licenseExpiry = null;
      if (needsLicense) {
        licenseNumber = "ว." + Math.floor(10000 + rand() * 89999);
        const roll = rand();
        if (roll < 0.06) licenseExpiry = randDate(2025, 2026);       // หมดอายุแล้ว/ใกล้มาก
        else if (roll < 0.18) licenseExpiry = randDate(2026, 2027);  // ใกล้หมดอายุใน ~ปีนี้
        else licenseExpiry = randDate(2027, 2032);                   // ยังไม่ใกล้หมดอายุ
      }
      const cmeHours = needsLicense ? Math.floor(rand() * 60) : 0;

      // ---- ผลปฏิบัติงาน & แผนพัฒนารายบุคคล (IDP) ----
      const performanceScore = +(2.7 + rand() * 2.3).toFixed(1); // 2.7 - 5.0
      const idpGoal = pick(IDP_GOALS);
      const idpStatus = pick(IDP_STATUS);
      const trainingHours = Math.floor(rand() * 40);

      // ---- วันลา ----
      const leaveSick = Math.floor(rand() * 16);
      const leavePersonal = Math.floor(rand() * 10);
      const leaveVacation = Math.floor(rand() * 10);

      staff.push({
        id: "EMP" + String(1000 + i),
        firstName: first,
        lastName: last,
        maskedName: maskName(first) + " " + maskName(last),
        birthDate,
        age,
        generation: genFor(birthYear),
        position: posInfo.pos,
        professionalGroup: posInfo.group,
        department: posInfo.dept,
        employmentType: empType.key,
        employmentTypeLabel: empType.label,
        fte: empType.fte,
        specialty: pick(SPECIALTIES),
        hireDate,
        resignDate,
        status, // active | resigned | retired
        phone: "08" + Math.floor(1000000 + rand() * 8999999),
        // ใบอนุญาต/CME
        licenseNumber, licenseExpiry, cmeHours,
        // ผลปฏิบัติงาน/IDP
        performanceScore, idpGoal, idpStatus, trainingHours,
        // วันลา
        leaveSick, leavePersonal, leaveVacation,
        updatedAt: new Date().toISOString(),
      });
    }
    return staff;
  }

  window.HRHK_MOCK = {
    ensureSeeded() {
      const seededVersion = Number(localStorage.getItem("hrhk_demo_seed_version") || 0);
      if (!localStorage.getItem("hrhk_demo_staff") || seededVersion !== SEED_VERSION) {
        const staff = generateStaff(186);
        localStorage.setItem("hrhk_demo_staff", JSON.stringify(staff));
        localStorage.setItem("hrhk_demo_seed_version", String(SEED_VERSION));
      }
      if (!localStorage.getItem("hrhk_demo_users")) {
        // demo account: user "admin" / password "admin1234"
        localStorage.setItem("hrhk_demo_users", JSON.stringify([
          { username: "admin", password: "admin1234", displayName: "ผู้ดูแลระบบ HR", employeeId: "EMP1000" }
        ]));
      }
    },
    getStaff() { return JSON.parse(localStorage.getItem("hrhk_demo_staff") || "[]"); },
    saveStaff(list) { localStorage.setItem("hrhk_demo_staff", JSON.stringify(list)); },
    getUsers() { return JSON.parse(localStorage.getItem("hrhk_demo_users") || "[]"); },
    saveUsers(list) { localStorage.setItem("hrhk_demo_users", JSON.stringify(list)); },
    EMP_TYPES, POSITIONS, DEPARTMENTS, SPECIALTIES, MANPOWER_FRAME,
    LICENSE_GROUPS, IDP_GOALS, IDP_STATUS,
  };
})();
