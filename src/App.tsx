import { useState, useMemo } from "react";
import { isHoliday, isBusinessDay, getHoliday, getHolidays, getNextHoliday, getHolidaysInRange, addBusinessDays, getBusinessDaysInRange } from "@krizad/thai-financial-holiday";
import CodeBlock from "./CodeBlock";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateThai(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${d} ${months[m - 1]} ${y + 543}`;
}

function daysDifference(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const MONTHS = ["ทุกเดือน", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function App() {
  // ======== Playground State ========
  const [dateInput, setDateInput] = useState(getTodayStr());
  // ======== Playground Logic (Calculated on dateInput change) ========
  const playgroundResult = useMemo(() => {
    if (!dateInput) return null;
    try {
      const isHol = isHoliday(dateInput);
      const isBiz = isBusinessDay(dateInput);
      const holiday = getHoliday(dateInput);
      const nextHoliday = getNextHoliday(dateInput);
      const d = new Date(dateInput + "T00:00:00");
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const daysUntilNext = nextHoliday ? daysDifference(dateInput, nextHoliday.Date) : -1;
      return { isHol, isBiz, holiday, nextHoliday, daysUntilNext, isWeekend };
    } catch {
      return null;
    }
  }, [dateInput]);

  // ======== Calendar State ========
  const currentYear = new Date().getFullYear();
  const allHolidays = useMemo(() => getHolidays(), []);
  const availableYears = useMemo(() => {
    const years = [...new Set(allHolidays.map((h) => parseInt(h.Date.slice(0, 4))))];
    return years.sort((a, b) => b - a);
  }, [allHolidays]);
  const [calYear, setCalYear] = useState(currentYear);
  const [calMonth, setCalMonth] = useState(0);

  const filteredHolidays = useMemo(() => {
    if (calMonth === 0) return getHolidays(calYear);
    return getHolidays(calYear, calMonth);
  }, [calYear, calMonth]);

  // ======== Business Day Calculator State ========
  const [bizStartDate, setBizStartDate] = useState(getTodayStr());
  const [bizDays, setBizDays] = useState("5");
  const [bizResult, setBizResult] = useState<string | null>(null);

  const [rangeStart, setRangeStart] = useState(`${currentYear}-01-01`);
  const [rangeEnd, setRangeEnd] = useState(`${currentYear}-12-31`);
  const [rangeResult, setRangeResult] = useState<{
    businessDays: number;
    holidays: number;
  } | null>(null);


  // ======== Business Day Handlers ========
  const handleCalcBusinessDays = () => {
    try {
      const result = addBusinessDays(bizStartDate, parseInt(bizDays));
      const yyyy = result.getFullYear();
      const mm = String(result.getMonth() + 1).padStart(2, "0");
      const dd = String(result.getDate()).padStart(2, "0");
      setBizResult(`${yyyy}-${mm}-${dd}`);
    } catch {
      setBizResult(null);
    }
  };

  const handleCalcRange = () => {
    try {
      const biz = getBusinessDaysInRange(rangeStart, rangeEnd);
      const hol = getHolidaysInRange(rangeStart, rangeEnd);
      setRangeResult({ businessDays: biz.length, holidays: hol.length });
    } catch {
      setRangeResult(null);
    }
  };

  return (
    <div className="app-container">
      {/* ======== Header ======== */}
      <header>
        <h1>Thai Financial Holiday</h1>
        <p className="subtitle">ข้อมูลวันหยุดทางการเงินของสถาบันการเงินไทย (ธปท.) พร้อมฟังก์ชันตรวจสอบ ค้นหา และคำนวณวันทำการ</p>
        <div className="badge-row">
          <img src="https://img.shields.io/npm/v/@krizad/thai-financial-holiday.svg?style=flat-square&color=f59e0b" alt="npm version" />
          <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="license" />
        </div>
      </header>

      <main>
        {/* ======== 1. Interactive Playground ======== */}
        <section className="glass-panel" id="playground">
          <h2 className="section-title">
            <span>🔍</span> ตรวจสอบวันหยุด
          </h2>
          <p className="section-desc">กรอกวันที่เพื่อตรวจสอบว่าเป็นวันหยุดสถาบันการเงิน วันทำการ หรือวันหยุดสุดสัปดาห์</p>

          <div className="input-group">
            <input id="date-input" type="date" className="input-field" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
            <button className="btn btn-secondary" onClick={() => setDateInput(getTodayStr())}>
              📅 วันนี้
            </button>
          </div>

          {playgroundResult && (
            <>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {playgroundResult.isHol ? <div className="status-badge status-holiday">🏖️ วันหยุดสถาบันการเงิน</div> : playgroundResult.isWeekend ? <div className="status-badge status-weekend">📆 วันหยุดสุดสัปดาห์</div> : <div className="status-badge status-business">💼 วันทำการ</div>}
                {playgroundResult.isBiz ? <div className="status-badge status-business">✓ Business Day</div> : <div className="status-badge status-holiday">✗ Not Business Day</div>}
              </div>

              {playgroundResult.holiday && (
                <div className="holiday-detail">
                  <div className="holiday-detail-title">{playgroundResult.holiday.HolidayDescriptionThai}</div>
                  <div className="holiday-detail-sub">{playgroundResult.holiday.HolidayDescription}</div>
                  <div className="holiday-detail-sub" style={{ marginTop: "0.5rem" }}>
                    {playgroundResult.holiday.HolidayWeekDayThai} ({playgroundResult.holiday.HolidayWeekDay}) · {formatDateThai(playgroundResult.holiday.Date)}
                  </div>
                </div>
              )}

              {playgroundResult.nextHoliday && (
                <div className="countdown-row">
                  <div>
                    <div className="countdown-number">{playgroundResult.daysUntilNext}</div>
                    <div className="countdown-label">วัน</div>
                  </div>
                  <div>
                    <div className="countdown-label">วันหยุดถัดไป</div>
                    <div className="countdown-name">{playgroundResult.nextHoliday.HolidayDescriptionThai}</div>
                    <div className="countdown-label">
                      {playgroundResult.nextHoliday.Date} · {playgroundResult.nextHoliday.HolidayWeekDayThai}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ======== 2. Holiday Calendar ======== */}
        <section className="glass-panel" id="calendar">
          <h2 className="section-title">
            <span>📅</span> ปฏิทินวันหยุด
          </h2>
          <p className="section-desc">ดูรายการวันหยุดทั้งหมด กรองตามปีและเดือนที่ต้องการ</p>

          <div className="input-group">
            <select id="year-select" className="select-field" value={calYear} onChange={(e) => setCalYear(Number(e.target.value))}>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y} ({y + 543})
                </option>
              ))}
            </select>
            <select id="month-select" className="select-field" value={calMonth} onChange={(e) => setCalMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="holiday-table-wrapper">
            <table className="holiday-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>วัน</th>
                  <th>ชื่อวันหยุด</th>
                  <th>Holiday Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.length > 0 ? (
                  filteredHolidays.map((h) => (
                    <tr key={h.Date}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDateThai(h.Date)}</td>
                      <td>
                        <span className="day-badge">{h.HolidayWeekDayThai}</span>
                      </td>
                      <td>{h.HolidayDescriptionThai.replace(/\r\n/g, " ")}</td>
                      <td style={{ color: "var(--text-muted)" }}>{h.HolidayDescription.replace(/\r\n/g, " ")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                      ไม่พบข้อมูลวันหยุดสำหรับช่วงเวลาที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-count">
            📊 พบ <strong>{filteredHolidays.length}</strong> วันหยุด
            {calMonth > 0 && ` ในเดือน${MONTHS[calMonth]}`} ปี {calYear}
          </div>
        </section>

        {/* ======== 3. Business Day Calculator ======== */}
        <section className="glass-panel" id="calculator">
          <h2 className="section-title">
            <span>📆</span> คำนวณวันทำการ
          </h2>
          <p className="section-desc">บวก/ลบวันทำการ (ข้ามเสาร์-อาทิตย์ และวันหยุด ธปท.) หรือนับจำนวนวันทำการในช่วงเวลา</p>

          {/* addBusinessDays */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-muted)" }}>บวก/ลบวันทำการ (addBusinessDays)</h3>
            <div className="input-group">
              <input id="biz-start-date" type="date" className="input-field" value={bizStartDate} onChange={(e) => setBizStartDate(e.target.value)} />
              <input id="biz-days" type="number" className="input-field" style={{ maxWidth: "140px" }} value={bizDays} onChange={(e) => setBizDays(e.target.value)} placeholder="จำนวนวัน" />
              <button className="btn" onClick={handleCalcBusinessDays}>
                ⚡ คำนวณ
              </button>
            </div>
            {bizResult && (
              <div className="result-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                <div className="result-card">
                  <div className="result-label">วันที่เริ่มต้น</div>
                  <div className="result-value">{formatDateThai(bizStartDate)}</div>
                </div>
                <div className="result-card">
                  <div className="result-label">จำนวนวันทำการ</div>
                  <div className="result-value accent">{parseInt(bizDays) >= 0 ? `+${bizDays}` : bizDays} วัน</div>
                </div>
                <div className="result-card">
                  <div className="result-label">ผลลัพธ์</div>
                  <div className="result-value business">{formatDateThai(bizResult)}</div>
                </div>
              </div>
            )}
          </div>

          {/* getBusinessDaysInRange + getHolidaysInRange */}
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-muted)" }}>นับวันทำการในช่วงเวลา (getBusinessDaysInRange)</h3>
            <div className="input-group">
              <input id="range-start" type="date" className="input-field" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
              <input id="range-end" type="date" className="input-field" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
              <button className="btn" onClick={handleCalcRange}>
                ⚡ คำนวณ
              </button>
            </div>
            {rangeResult && (
              <div className="result-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                <div className="result-card">
                  <div className="result-label">วันทำการ</div>
                  <div className="result-value business">{rangeResult.businessDays} วัน</div>
                </div>
                <div className="result-card">
                  <div className="result-label">วันหยุด ธปท.</div>
                  <div className="result-value holiday">{rangeResult.holidays} วัน</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======== 4. API Documentation ======== */}
        <section className="glass-panel" id="doc-isholiday">
          <h2 className="section-title">
            <span>🛡️</span> isHoliday / getHoliday
          </h2>
          <p className="section-desc">ตรวจสอบว่าวันที่กำหนดเป็นวันหยุดสถาบันการเงินหรือไม่ รองรับ Date, string (YYYY-MM-DD) และ timestamp</p>
          <div className="code-block">
            <CodeBlock code={`import { isHoliday, getHoliday } from '@krizad/thai-financial-holiday';

// ตรวจสอบวันหยุด
isHoliday('2026-01-01');     // true  (วันขึ้นปีใหม่)
isHoliday('2026-01-05');     // false (วันทำงานปกติ)
isHoliday(new Date());       // ตรวจสอบจาก Date Object

// ดึงรายละเอียดวันหยุด
const holiday = getHoliday('2026-01-01');
// { HolidayDescriptionThai: "วันขึ้นปีใหม่", ... }

getHoliday('2026-01-05');    // null (ไม่ใช่วันหยุด)`} />
          </div>
        </section>

        <section className="glass-panel" id="doc-getholidays">
          <h2 className="section-title">
            <span>📋</span> getHolidays
          </h2>
          <p className="section-desc">ดึงรายการวันหยุดทั้งหมด หรือกรองเฉพาะปี/เดือนที่ต้องการ</p>
          <div className="code-block">
            <CodeBlock code={`import { getHolidays } from '@krizad/thai-financial-holiday';

// ดึงวันหยุดทั้งหมด (5 ปีย้อนหลัง)
const all = getHolidays();

// ดึงเฉพาะปี 2026
const y2026 = getHolidays(2026);

// ดึงเฉพาะปี 2026 เดือน ม.ค.
const jan2026 = getHolidays(2026, 1);
// [{ Date: "2026-01-01", HolidayDescriptionThai: "วันขึ้นปีใหม่", ... }]`} />
          </div>
        </section>

        <section className="glass-panel" id="doc-nextholiday">
          <h2 className="section-title">
            <span>⏭️</span> getNextHoliday
          </h2>
          <p className="section-desc">หาวันหยุดถัดไปนับจากวันที่กำหนด (ถ้าไม่ระบุ ใช้วันปัจจุบัน)</p>
          <div className="code-block">
            <CodeBlock code={`import { getNextHoliday } from '@krizad/thai-financial-holiday';

const next = getNextHoliday('2025-12-31');
// { Date: "2026-01-01", HolidayDescriptionThai: "วันขึ้นปีใหม่", ... }

// ใช้วันปัจจุบัน
const upcoming = getNextHoliday();`} />
          </div>
        </section>

        <section className="glass-panel" id="doc-range">
          <h2 className="section-title">
            <span>📆</span> getHolidaysInRange
          </h2>
          <p className="section-desc">ดึงรายการวันหยุดระหว่างช่วงวันที่เริ่มต้นและสิ้นสุด (Inclusive)</p>
          <div className="code-block">
            <CodeBlock code={`import { getHolidaysInRange } from '@krizad/thai-financial-holiday';

const holidays = getHolidaysInRange('2026-01-01', '2026-01-05');
// [
//   { Date: "2026-01-01", HolidayDescriptionThai: "วันขึ้นปีใหม่" },
//   { Date: "2026-01-02", HolidayDescriptionThai: "วันหยุดทำการเพิ่มเป็นกรณีพิเศษ" }
// ]`} />
          </div>
        </section>

        <section className="glass-panel" id="doc-businessdays">
          <h2 className="section-title">
            <span>💼</span> Business Days
          </h2>
          <p className="section-desc">ฟังก์ชันตรวจสอบและคำนวณวันทำการสถาบันการเงิน (ข้ามเสาร์-อาทิตย์ และวันหยุด ธปท.)</p>
          <div className="code-block">
            <CodeBlock code={`import {
  isBusinessDay,
  addBusinessDays,
  getBusinessDaysInRange
} from '@krizad/thai-financial-holiday';

// ตรวจสอบวันทำการ
isBusinessDay('2026-01-01');  // false (วันหยุดปีใหม่)
isBusinessDay('2026-01-03');  // false (วันเสาร์)
isBusinessDay('2026-01-05');  // true  (วันจันทร์)

// บวก/ลบวันทำการ
const next = addBusinessDays('2025-12-31', 1);
// Date: 2026-01-05 (ข้ามวันหยุดปีใหม่ + สุดสัปดาห์)

// นับวันทำการในช่วง
const days = getBusinessDaysInRange('2026-01-01', '2026-01-06');
// [Date(2026-01-05), Date(2026-01-06)]`} />
          </div>
        </section>

        <section className="glass-panel" id="doc-types">
          <h2 className="section-title">
            <span>📐</span> TypeScript Interface
          </h2>
          <p className="section-desc">Type definitions ที่มากับแพ็กเกจ</p>
          <div className="code-block">
            <CodeBlock code={`interface BOTHoliday {
  HolidayWeekDay: string;       // "Monday", "Tuesday", ...
  HolidayWeekDayThai: string;   // "วันจันทร์", "วันอังคาร", ...
  Date: string;                  // "YYYY-MM-DD"
  DateThai: string;              // "DD/MM/YYYY" (พ.ศ.)
  HolidayDescription: string;   // English description
  HolidayDescriptionThai: string; // Thai description
}

type DateInput = string | Date | number;`} />
          </div>
        </section>

        <section className="glass-panel" id="doc-install">
          <h2 className="section-title">
            <span>📦</span> การติดตั้ง
          </h2>
          <div className="code-snippet">
            <pre>{`# npm
npm install @krizad/thai-financial-holiday

# pnpm
pnpm add @krizad/thai-financial-holiday

# yarn
yarn add @krizad/thai-financial-holiday`}</pre>
          </div>

          <div className="result-grid" style={{ marginTop: "1.5rem" }}>
            <div className="result-card">
              <div className="result-label">ข้อมูลครอบคลุม</div>
              <div className="result-value accent">
                {availableYears.length} ปี ({availableYears[availableYears.length - 1]}-{availableYears[0]})
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">วันหยุดทั้งหมด</div>
              <div className="result-value accent">{allHolidays.length} วัน</div>
            </div>
            <div className="result-card">
              <div className="result-label">อัปเดตอัตโนมัติ</div>
              <div className="result-value business">ทุกวันที่ 1 ของเดือน</div>
            </div>
            <div className="result-card">
              <div className="result-label">แหล่งข้อมูล</div>
              <div className="result-value info">ธนาคารแห่งประเทศไทย</div>
            </div>
          </div>
        </section>
      </main>

      {/* ======== Footer ======== */}
      <footer>
        <p>
          Built with ❤️ by{" "}
          <a href="https://github.com/KriZad" target="_blank" rel="noopener noreferrer">
            KriZad
          </a>
          {" · "}
          <a href="https://github.com/KriZad/thai-financial-holiday" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {" · "}
          <a href="https://www.npmjs.com/package/@krizad/thai-financial-holiday" target="_blank" rel="noopener noreferrer">
            npm
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
