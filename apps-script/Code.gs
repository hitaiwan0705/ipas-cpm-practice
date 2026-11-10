/**
 * iPAS 練習站 → Google Sheet 作答回傳
 * 使用方式見 README「設定 Google Sheet 回傳」。
 * 1. 在 Google Sheet 開「擴充功能 → Apps Script」，把本檔內容貼上並儲存。
 * 2. 執行一次 setup()（第一次會要求授權）。
 * 3. 部署 → 新增部署作業 → 類型「網頁應用程式」→ 執行身分「我」、存取權「所有人」→ 部署，複製網址。
 */
const CLASS_CODE = "CPM115";   // 需與網站 config.js 的 classCode 相同

const SHEET_SESSION = "場次";
const SHEET_ITEMS = "作答紀錄";
const H_SESSION = ["送出時間", "學號", "場次ID", "模式", "科目", "題數", "答對", "分數", "用時(秒)", "開始時間"];
const H_ITEMS = ["送出時間", "學號", "場次ID", "模式", "題號", "科目", "主要內容代碼", "難度", "診斷領域", "學生答案", "正確答案", "對錯", "隨機數字題", "全部內容代碼"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const p = JSON.parse(e.postData.contents);
    if (p.classCode !== CLASS_CODE) return out_({ ok: false, error: "classCode" });
    const sid = String(p.studentId || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
    if (!sid) return out_({ ok: false, error: "studentId" });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(SHEET_SESSION) || !ss.getSheetByName(SHEET_ITEMS)) setup();
    const now = new Date();
    ss.getSheetByName(SHEET_SESSION).appendRow([now, sid, p.sessionId, p.mode, p.subject, p.total, p.correct, p.score, p.durationSec, p.startedAt]);
    const rows = (p.items || []).map(r => [now, sid, p.sessionId, p.mode, r.id, r.subj, String(r.codes || "").split(",")[0], r.diff, r.dom, "'" + (r.got || ""), "'" + r.ans, r.ok, r.gen, r.codes]);
    if (rows.length) {
      const sh = ss.getSheetByName(SHEET_ITEMS);
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, H_ITEMS.length).setValues(rows);
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_({ ok: true, service: "iPAS practice collector" }); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** 建立工作表與分析用公式（可重複執行，不會刪資料） */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mk = (name, header) => {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (header) { sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold"); sh.setFrozenRows(1); }
    return sh;
  };
  mk(SHEET_SESSION, H_SESSION);
  mk(SHEET_ITEMS, H_ITEMS);
  // 分析表：全部用公式，資料一進來就更新
  const a = mk("學生×領域", null);
  a.getRange("A1").setFormula("=IFERROR(QUERY(作答紀錄!A:N,\"select B, avg(L) where B is not null and B <> '學號' group by B pivot I\",1),\"尚無資料\")");
  a.getRange("A1").setNote("每位學生在 7 個診斷領域的答對率（0–1）。低於 0.6 建議講解。");
  const b = mk("學生×難度", null);
  b.getRange("A1").setFormula("=IFERROR(QUERY(作答紀錄!A:N,\"select B, avg(L), count(L) where B is not null and B <> '學號' group by B pivot H\",1),\"尚無資料\")");
  const c = mk("內容代碼弱點", null);
  c.getRange("A1").setFormula("=IFERROR(QUERY(作答紀錄!A:N,\"select G, count(L), avg(L) where G is not null and G <> '主要內容代碼' group by G order by avg(L) asc label count(L) '作答數', avg(L) '答對率'\",1),\"尚無資料\")");
  const d = mk("題目分析", null);
  d.getRange("A1").setFormula("=IFERROR(QUERY(作答紀錄!A:N,\"select E, F, H, count(L), avg(L) where E is not null and E <> '題號' and M = 0 group by E, F, H order by avg(L) asc label count(L) '作答數', avg(L) '答對率'\",1),\"尚無資料\")");
  d.getRange("H1").setValue("答對率高於 0.9：可能太簡單；低於 0.3：檢查題目是否有問題。隨機數字題不列入。");
  const s = ss.getSheetByName("工作表1") || ss.getSheetByName("Sheet1");
  if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
}
