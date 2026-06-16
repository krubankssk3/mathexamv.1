/*** EduForge — Exams.gs ****************************************************
 * Action ของระบบย่อยต่างๆ (worksheet / quiz / vault / admin / bootstrap)
 ***************************************************************************/

/* ---------- ออกข้อสอบกระดาษ ---------- */
function generateExam_(token, p) {
  requireAuth_(token);
  var problems = buildChapterProblems_(p.chapterId, p.level, p.count);
  var setId = makeSetId_();
  logExam_(token, p, setId);
  return { setId: setId, problems: problems };
}

function logExam_(token, p, setId) {
  try {
    var who = verifyToken_(token);
    appendObj_(CFG.SHEETS.LOG, {
      setId: setId, gradeId: p.gradeId || '', chapterId: p.chapterId || '',
      level: p.level || '', count: p.count || '',
      user: who ? who.u : '', createdAt: new Date()
    });
  } catch (e) {}
}

/* ---------- ทดสอบออนไลน์ ---------- */
function quizGen_(token, p) {
  requireAuth_(token);
  var raw = buildChapterProblems_(p.chapterId, p.level, p.count);
  var items = raw.map(function (it) { return toMCQ_(it); });
  return { items: items };
}

/* ---------- คลังข้อสอบ ---------- */
function saveExam_(token, p) {
  var who = requireAuth_(token);
  var id = Utilities.getUuid();
  appendObj_(CFG.SHEETS.SAVED, {
    id: id, owner: who.u, title: p.title || '', gradeId: p.gradeId || '',
    chapterId: p.chapterId || '', subjectName: p.subjectName || '',
    level: p.level || '', cols: p.cols || 2, setId: p.setId || '',
    problemsJSON: JSON.stringify(p.problems || []), createdAt: new Date()
  });
  return { id: id };
}
function listExams_(token) {
  var who = requireAuth_(token);
  return rows_(CFG.SHEETS.SAVED)
    .filter(function (r) { return String(r.owner) === String(who.u); })
    .map(function (r) {
      var probs = []; try { probs = JSON.parse(r.problemsJSON); } catch (e) {}
      return {
        id: r.id, title: r.title, subjectName: r.subjectName, level: r.level,
        cols: Number(r.cols) || 2, setId: r.setId, problems: probs,
        createdAt: r.createdAt
      };
    })
    .reverse();
}
function deleteExam_(token, p) {
  var who = requireAuth_(token);
  var row = rows_(CFG.SHEETS.SAVED).filter(function (r) { return String(r.id) === String(p.id); })[0];
  if (!row) throw '\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e0a\u0e38\u0e14\u0e02\u0e49\u0e2d\u0e2a\u0e2d\u0e1a';
  if (String(row.owner) !== String(who.u) && who.r !== 'admin') throw '\u0e44\u0e21\u0e48\u0e21\u0e35\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e25\u0e1a';
  deleteWhere_(CFG.SHEETS.SAVED, 'id', p.id);
  return { deleted: true };
}

/* ---------- แผงผู้ดูแล ---------- */
function togglePlugin_(token, p) {
  requireAdmin_(token);
  updateWhere_(CFG.SHEETS.PLUGINS, 'pluginId', p.id, { enabled: p.enabled ? 'TRUE' : 'FALSE' });
  return { ok: true };
}
function deletePlugin_(token, p) {
  requireAdmin_(token);
  if (p.id === 'admin') throw 'ลบระบบจัดการไม่ได้';
  deleteWhere_(CFG.SHEETS.PLUGINS, 'pluginId', p.id);
  return { deleted: true };
}
function saveSettings_(token, p) {
  requireAdmin_(token);
  if (p.org !== undefined) updateWhere_(CFG.SHEETS.SETTINGS, 'key', 'org', { value: p.org });
  if (p.dept !== undefined) updateWhere_(CFG.SHEETS.SETTINGS, 'key', 'dept', { value: p.dept });
  return { ok: true };
}
function adminStats_(token) {
  requireAdmin_(token);
  var plugins = rows_(CFG.SHEETS.PLUGINS);
  return {
    plugins: plugins.length,
    enabled: plugins.filter(function (r) { return String(r.enabled).toUpperCase() !== 'FALSE'; }).length,
    saved: rows_(CFG.SHEETS.SAVED).length
  };
}

/* ---------- bootstrap (ดึงทุกอย่างหลังล็อกอิน) ---------- */
function bootstrap_(token) {
  var who = requireAuth_(token);
  var settings = {};
  rows_(CFG.SHEETS.SETTINGS).forEach(function (r) { settings[r.key] = r.value; });
  var plugins = rows_(CFG.SHEETS.PLUGINS)
    .filter(function (r) { return String(r.enabled).toUpperCase() !== 'FALSE'; })
    .filter(function (r) { return String(r.adminOnly).toUpperCase() !== 'TRUE' || who.r === 'admin'; })
    .map(function (r) {
      return {
        id: r.pluginId, title: r.title, icon: r.icon, file: r.file,
        adminOnly: String(r.adminOnly).toUpperCase() === 'TRUE',
        order: Number(r.order) || 0
      };
    })
    .sort(function (a, b) { return a.order - b.order; });
  return {
    user: { role: who.r, name: who.n },
    settings: settings,
    plugins: plugins,
    curriculum: getCurriculumTree_()
  };
}

/* ---------- bootstrap สำหรับโหมดสาธารณะ (ไม่ต้องล็อกอิน) ---------- */
function isPublicPlugin_(r) {
  if (r.public !== undefined && String(r.public) !== '') return String(r.public).toUpperCase() === 'TRUE';
  return (CFG.PUBLIC_PLUGINS || []).indexOf(String(r.pluginId)) >= 0;
}
function publicBootstrap_() {
  var settings = {};
  rows_(CFG.SHEETS.SETTINGS).forEach(function (r) { settings[r.key] = r.value; });
  var plugins = rows_(CFG.SHEETS.PLUGINS)
    .filter(function (r) { return String(r.enabled).toUpperCase() !== 'FALSE'; })
    .filter(function (r) { return isPublicPlugin_(r); })
    .map(function (r) {
      return { id: r.pluginId, title: r.title, icon: r.icon, file: r.file, adminOnly: false, order: Number(r.order) || 0 };
    })
    .sort(function (a, b) { return a.order - b.order; });
  return {
    user: { role: 'public', name: 'ผู้ใช้สาธารณะ' },
    settings: settings,
    plugins: plugins,
    curriculum: getCurriculumTree_()
  };
}

/* ---------- สถิติหน้า public (ไม่ต้องล็อกอิน) ---------- */
function publicStats_() {
  var tree = getCurriculumTree_();
  var chapters = tree.grades.reduce(function (s, g) { return s + g.chapters.length; }, 0);
  return {
    grades: tree.grades.length,
    chapters: chapters,
    subjects: Object.keys(GEN).length
  };
}
