/*** EduForge — Curriculum.gs ***********************************************
 * อ่านโครงสร้าง วิชา > ชั้น > บท จากชีต Curriculum แล้วประกอบเป็นต้นไม้
 * และสร้างโจทย์ของบทที่เลือกโดยเรียก GEN[gen]
 ***************************************************************************/

function getCurriculumTree_() {
  var rows = rows_(CFG.SHEETS.CURRICULUM).filter(function (r) {
    return String(r.enabled).toUpperCase() !== 'FALSE' && r.chapterId;
  });
  var byGrade = {};
  var order = [];
  rows.forEach(function (r) {
    if (!byGrade[r.gradeId]) {
      byGrade[r.gradeId] = { id: r.gradeId, name: r.gradeName, order: Number(r.gradeOrder) || 0, chapters: [] };
      order.push(r.gradeId);
    }
    var lv = {};
    if (r.lv) { try { lv = JSON.parse(r.lv); } catch (e) { lv = {}; } }
    byGrade[r.gradeId].chapters.push({
      id: r.chapterId, name: r.chapterName, icon: r.icon || 'ti-file',
      gen: r.gen, ops: r.ops ? String(r.ops).split(',').map(function (s) { return s.trim(); }) : [], lv: lv
    });
  });
  var grades = order.map(function (id) { return byGrade[id]; })
    .sort(function (a, b) { return a.order - b.order; });
  return { subject: '\u0e04\u0e13\u0e34\u0e15\u0e28\u0e32\u0e2a\u0e15\u0e23\u0e4c', grades: grades };
}

function findChapterRow_(chapterId) {
  return rows_(CFG.SHEETS.CURRICULUM).filter(function (r) {
    return String(r.chapterId) === String(chapterId);
  })[0];
}

// ประกอบ cfg จากบท: base ops + ค่า override ต่อระดับ (lv) แล้วเรียก generator
function buildChapterProblems_(chapterId, level, count) {
  var row = findChapterRow_(chapterId);
  if (!row) throw '\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e1a\u0e17\u0e40\u0e23\u0e35\u0e22\u0e19\u0e19\u0e35\u0e49';
  var gen = GEN[row.gen];
  if (!gen) throw '\u0e44\u0e21\u0e48\u0e23\u0e39\u0e49\u0e08\u0e31\u0e01\u0e0a\u0e19\u0e34\u0e14\u0e42\u0e08\u0e17\u0e22\u0e4c: ' + row.gen;

  var cfg = { level: level || 'easy', count: Math.max(4, Math.min(40, Number(count) || 12)) };
  if (row.ops) cfg.ops = String(row.ops).split(',').map(function (s) { return s.trim(); });

  var lv = {};
  if (row.lv) { try { lv = JSON.parse(row.lv); } catch (e) { lv = {}; } }
  var ov = lv[cfg.level];
  if (ov) for (var k in ov) cfg[k] = ov[k];

  return gen(cfg);
}

/*** ===== จัดการหลักสูตร (เฉพาะแอดมิน) ===== ***/
var GEN_TYPES_ = ['arith', 'fraction', 'equation', 'percent', 'measure', 'word', 'picture'];
var GEN_LABELS_ = {
  arith: 'บวก-ลบ-คูณ-หาร', fraction: 'เศษส่วน', equation: 'สมการ',
  percent: 'ร้อยละ', measure: 'หน่วยวัด', word: 'โจทย์ปัญหา', picture: 'นับรูปภาพ (บวก/ลบ)'
};

function genTypeList_() {
  return GEN_TYPES_.map(function (id) { return { id: id, label: GEN_LABELS_[id] }; });
}

// คืนโครงหลักสูตรทั้งหมด (รวมบทที่ปิดอยู่) สำหรับหน้าจัดการ
function adminCurriculum_(token) {
  requireAdmin_(token);
  var rows = rows_(CFG.SHEETS.CURRICULUM).filter(function (r) { return r.chapterId; });
  var byGrade = {}, order = [];
  rows.forEach(function (r) {
    if (!byGrade[r.gradeId]) {
      byGrade[r.gradeId] = { id: r.gradeId, name: r.gradeName, order: Number(r.gradeOrder) || 0, chapters: [] };
      order.push(r.gradeId);
    }
    byGrade[r.gradeId].chapters.push({
      id: r.chapterId, name: r.chapterName, icon: r.icon || 'ti-file', gen: r.gen,
      ops: r.ops ? String(r.ops) : '', lv: r.lv ? String(r.lv) : '',
      enabled: String(r.enabled).toUpperCase() !== 'FALSE'
    });
  });
  var grades = order.map(function (id) { return byGrade[id]; })
    .sort(function (a, b) { return a.order - b.order; });
  return { grades: grades, genTypes: genTypeList_() };
}

function normOps_(ops) { return Array.isArray(ops) ? ops.join(',') : String(ops || ''); }
function normLv_(lv) { return (lv && typeof lv === 'object') ? JSON.stringify(lv) : String(lv || ''); }

// เพิ่มบทเรียน (ถ้า gradeId ใหม่ = สร้างชั้นใหม่ให้เลย)
function addChapter_(token, p) {
  requireAdmin_(token);
  var gradeId = String(p.gradeId || '').trim();
  var chapterName = String(p.chapterName || '').trim();
  var gen = String(p.gen || '').trim();
  if (!gradeId) throw 'ต้องระบุชั้น';
  if (!chapterName) throw 'ต้องระบุชื่อบทเรียน';
  if (GEN_TYPES_.indexOf(gen) < 0) throw 'ชนิดโจทย์ไม่ถูกต้อง';

  var existing = rows_(CFG.SHEETS.CURRICULUM).filter(function (r) { return String(r.gradeId) === gradeId; });
  var gradeName, gradeOrder;
  if (existing.length) { gradeName = existing[0].gradeName; gradeOrder = existing[0].gradeOrder; }
  else {
    gradeName = String(p.gradeName || '').trim() || gradeId;
    if (p.gradeOrder !== undefined && p.gradeOrder !== '') gradeOrder = p.gradeOrder;
    else {
      var maxO = 0;
      rows_(CFG.SHEETS.CURRICULUM).forEach(function (r) { var o = Number(r.gradeOrder) || 0; if (o > maxO) maxO = o; });
      gradeOrder = maxO + 1;
    }
  }

  var chapterId = String(p.chapterId || '').trim() || (gradeId + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6));
  if (findChapterRow_(chapterId)) throw 'รหัสบทเรียนซ้ำ ลองใหม่อีกครั้ง';

  ensureColumn_(CFG.SHEETS.CURRICULUM, 'enabled');
  appendObj_(CFG.SHEETS.CURRICULUM, {
    gradeId: gradeId, gradeName: gradeName, gradeOrder: gradeOrder,
    chapterId: chapterId, chapterName: chapterName, icon: String(p.icon || 'ti-file'),
    gen: gen, ops: normOps_(p.ops), lv: normLv_(p.lv), enabled: 'TRUE'
  });
  return { ok: true, chapterId: chapterId };
}

function updateChapter_(token, p) {
  requireAdmin_(token);
  var cid = String(p.chapterId || '');
  if (!cid || !findChapterRow_(cid)) throw 'ไม่พบบทเรียน';
  var patch = {};
  if (p.chapterName !== undefined) patch.chapterName = String(p.chapterName);
  if (p.icon !== undefined) patch.icon = String(p.icon);
  if (p.gen !== undefined) { if (GEN_TYPES_.indexOf(String(p.gen)) < 0) throw 'ชนิดโจทย์ไม่ถูกต้อง'; patch.gen = String(p.gen); }
  if (p.ops !== undefined) patch.ops = normOps_(p.ops);
  if (p.lv !== undefined) patch.lv = normLv_(p.lv);
  if (p.enabled !== undefined) patch.enabled = (p.enabled === true || String(p.enabled).toUpperCase() === 'TRUE') ? 'TRUE' : 'FALSE';
  updateWhere_(CFG.SHEETS.CURRICULUM, 'chapterId', cid, patch);
  return { ok: true };
}

function deleteChapter_(token, p) {
  requireAdmin_(token);
  var cid = String(p.chapterId || '');
  if (!cid) throw 'ไม่พบบทเรียน';
  deleteWhere_(CFG.SHEETS.CURRICULUM, 'chapterId', cid);
  return { ok: true };
}

// แก้ชื่อ/ลำดับชั้น (อัปเดตทุกแถวของชั้นนั้น)
function updateGrade_(token, p) {
  requireAdmin_(token);
  var gid = String(p.gradeId || '');
  if (!gid) throw 'ไม่พบชั้น';
  var patch = {};
  if (p.gradeName !== undefined) patch.gradeName = String(p.gradeName);
  if (p.gradeOrder !== undefined && p.gradeOrder !== '') patch.gradeOrder = p.gradeOrder;
  var rs = rows_(CFG.SHEETS.CURRICULUM).filter(function (r) { return String(r.gradeId) === gid; });
  rs.forEach(function (r) { updateWhere_(CFG.SHEETS.CURRICULUM, 'chapterId', r.chapterId, patch); });
  return { ok: true, count: rs.length };
}

// ลบชั้นทั้งหมด (ลบทุกบทของชั้นนั้น)
function deleteGrade_(token, p) {
  requireAdmin_(token);
  var gid = String(p.gradeId || '');
  if (!gid) throw 'ไม่พบชั้น';
  var n = 0;
  while (deleteWhere_(CFG.SHEETS.CURRICULUM, 'gradeId', gid)) n++;
  return { ok: true, count: n };
}
