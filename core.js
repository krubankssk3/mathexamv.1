/*** EduForge — core.js ****************************************************
 * เปลือกกลาง: Platform, ตัวเรียก API, ล็อกอิน/โทเค็น, ธีม, เอฟเฟกต์,
 * ตัวสร้างกระดาษข้อสอบ, ตัวโหลดปลั๊กอินตาม manifest
 * ปลั๊กอินแต่ละไฟล์เรียก window.Platform.register({ id, mount })
 ***************************************************************************/
(function () {
  'use strict';

  var API = (window.EDU_CONFIG && window.EDU_CONFIG.API_URL) || '';
  var LS = 'eduforge_token';
  var LS_THEME = 'eduforge_theme';
  (function () { try { var t = localStorage.getItem(LS_THEME); if (t) document.documentElement.dataset.theme = t; } catch (e) {} })();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  var session = { token: localStorage.getItem(LS) || '' };

  /* ---------- API client (POST text/plain เลี่ยง CORS preflight) ---------- */
  function api(action, payload) {
    var body = JSON.stringify(Object.assign({ action: action, token: session.token }, payload || {}));
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body
    }).then(function (r) { return r.json(); })
      .then(function (d) { if (!d.ok) throw new Error(d.error || 'เกิดข้อผิดพลาด'); return d.data; });
  }
  function apiGetPublicStats() {
    return fetch(API + (API.indexOf('?') < 0 ? '?' : '&') + 'action=publicStats')
      .then(function (r) { return r.json(); })
      .then(function (d) { return d.ok ? d.data : null; }).catch(function () { return null; });
  }

  /* ---------- UI helpers (SweetAlert) ---------- */
  var SWAL_DARK = { background: '#121a2e', color: '#e6ebf7' };
  function toast(icon, title) {
    return Swal.fire(Object.assign({ toast: true, position: 'top-end', timer: 1800, showConfirmButton: false, icon: icon, title: title }, SWAL_DARK));
  }
  function alertErr(title, text) {
    return Swal.fire(Object.assign({ icon: 'error', title: title, text: text || '', confirmButtonColor: '#6366f1' }, SWAL_DARK));
  }
  // ป็อปอัปกำลังโหลด (มีสปินเนอร์) — เรียก loading('ข้อความ') แล้วปิดด้วย done()
  function loading(msg) {
    Swal.fire(Object.assign({
      title: msg || 'กำลังดำเนินการ...',
      allowOutsideClick: false, allowEscapeKey: false,
      didOpen: function () { Swal.showLoading(); }
    }, SWAL_DARK));
  }
  function done() { if (Swal.isVisible()) Swal.close(); }

  /* ---------- ตัวเลขนับขึ้น + scroll reveal ---------- */
  var REDUCE = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function countUp(el, target, dur, suffix) {
    var t = Number(target) || 0; suffix = suffix || ''; dur = dur || 1100;
    if (REDUCE) { el.textContent = t.toLocaleString('th-TH') + suffix; return; }
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(e * t).toLocaleString('th-TH') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function animateCounters(scope) {
    $$('[data-count]', scope || document).forEach(function (el) {
      if (el.dataset.done) return; el.dataset.done = '1';
      countUp(el, el.dataset.count, 1100, el.dataset.suffix || '');
    });
  }
  var revObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        if (en.target.hasAttribute('data-count') || en.target.querySelector('[data-count]')) animateCounters(en.target);
        revObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.18 });
  function initReveals(scope) { $$('.reveal', scope || document).forEach(function (el) { revObserver.observe(el); }); }

  /* ---------- ตัวสร้างกระดาษข้อสอบ (ใช้ร่วมกันหลายปลั๊กอิน) ---------- */
  function examSheetHTML(o) {
    var S = Platform.settings;
    var date = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    var lv = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' }[o.level] || o.level || '';
    var cols = o.cols === 2 ? 2 : 1;
    var total = o.problems.length;
    var isPic = o.problems.some(function (p) { return p.noline; }); // โจทย์รูปภาพ (สูงกว่า)
    var perCol = isPic ? 8 : 15;                  // จำนวนข้อต่อคอลัมน์ต่อหน้า
    var perPage = perCol * cols;

    function qitemHTML(p, i) {
      return '<div class="qitem"><span class="qno">' + (i + 1) + '.</span><span class="qbody">' + p.q + (p.noline ? '' : ' <span class="ans-line"></span>') + '</span></div>';
    }
    function headFull() {
      return '<div class="exam-head"><img src="' + S.logo + '">' +
        '<div style="flex:1"><h1>' + S.org + '</h1><div class="sub">' + S.dept + '</div></div>' +
        '<div style="text-align:right"><div class="mono" style="font-size:11px;color:#888">ชุดที่</div><div class="mono" style="font-weight:700;color:var(--accent)">' + o.setId + '</div></div></div>' +
        '<div style="text-align:center;margin:14px 0 4px"><div class="font-display" style="font-size:18px;font-weight:700">' + o.title + '</div><div class="sub">เรื่อง ' + o.subjectName + ' · ระดับ ' + lv + '</div></div>' +
        '<div class="meta-row"><span><b>ชื่อ–สกุล</b> <span class="blank" style="min-width:180px"></span></span><span><b>ชั้น</b> <span class="blank" style="min-width:60px"></span></span><span><b>เลขที่</b> <span class="blank" style="min-width:45px"></span></span><span><b>วันที่</b> ' + date + '</span><span class="score-box"><b>คะแนนที่ได้</b> <span class="blank" style="min-width:48px"></span> / ' + total + '</span></div>' +
        '<div class="instr"><b>คำชี้แจง</b> ' + (o.instr ? o.instr : 'แสดงวิธีทำและเขียนคำตอบลงในช่องว่าง') + ' (' + total + ' ข้อ ข้อละ 1 คะแนน)</div>';
    }
    function headCont() {
      return '<div class="exam-head"><img src="' + S.logo + '">' +
        '<div style="flex:1"><h1>' + o.title + ' (ต่อ)</h1><div class="sub">เรื่อง ' + o.subjectName + ' · ระดับ ' + lv + '</div></div>' +
        '<div style="text-align:right"><div class="mono" style="font-size:11px;color:#888">ชุดที่</div><div class="mono" style="font-weight:700;color:var(--accent)">' + o.setId + '</div></div></div>';
    }
    function foot() {
      return '<div class="sheet-foot"><span>พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3</span><span class="mono">' + o.setId + '</span></div>';
    }

    var pages = [];
    for (var st = 0; st < total; st += perPage) pages.push(o.problems.slice(st, st + perPage));
    if (!pages.length) pages.push([]);

    var sheet = pages.map(function (chunk, pi) {
      var rowsOnPage = Math.ceil(chunk.length / cols) || 1;
      var rowh = 185 / rowsOnPage; if (rowh > 24) rowh = 24; if (rowh < 9) rowh = 9;
      rowh = Math.round(rowh * 10) / 10;
      var items = chunk.map(function (p, idx) { return qitemHTML(p, pi * perPage + idx); }).join('');
      return '<div class="sheet pop' + (pi > 0 ? ' pgb' : '') + '" style="--rowh:' + rowh + 'mm">' +
        (pi === 0 ? headFull() : headCont()) +
        '<div class="qcols ' + (cols === 2 ? 'c2' : '') + '">' + items + '</div>' +
        foot() + '</div>';
    }).join('');

    var k = o.problems.map(function (p, i) {
      return '<div class="qitem"><span class="qno">' + (i + 1) + '.</span><span class="qbody"><span class="ans">' + p.a + '</span></span></div>';
    }).join('');
    var key = o.withKey ?
      '<div class="sheet key-sheet pop"><div class="exam-head" style="border-color:var(--accent)"><img src="' + S.logo + '"><div style="flex:1"><h1>เฉลย — ' + o.title + '</h1><div class="sub">' + o.subjectName + ' · ชุด ' + o.setId + '</div></div><span class="key-tag">ANSWER KEY</span></div>' +
      '<div class="key-grid">' + k + '</div><div class="sheet-foot"><span>เฉลยเฉพาะชุด ' + o.setId + '</span><span class="mono">' + o.setId + '</span></div></div>' : '';
    return sheet + key;
  }
  function printNode(html) {
    var area = document.getElementById('printArea');
    if (!area) { area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
    area.innerHTML = html;
    document.body.classList.add('printing');
    var cleaned = false;
    function cleanup() {
      if (cleaned) return; cleaned = true;
      document.body.classList.remove('printing');
      area.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    }
    var fired = false;
    function fire() {
      if (fired) return; fired = true;
      window.addEventListener('afterprint', cleanup);
      window.print();
      setTimeout(cleanup, 800); // เคลียร์หลังพิมพ์ (กันกรณี afterprint ไม่ทำงาน) — ผูกกับครั้งนี้เท่านั้น
    }
    // รอรูป (โลโก้/ไอคอนรูป) โหลดเสร็จก่อนพิมพ์ ไม่งั้นรูปไม่ขึ้น
    var imgs = [].slice.call(area.querySelectorAll('img'));
    var pending = imgs.filter(function (im) { return !(im.complete && im.naturalWidth > 0); });
    if (!pending.length) { setTimeout(fire, 60); return; }
    var done = 0;
    function one() { if (++done >= pending.length) fire(); }
    pending.forEach(function (im) { im.addEventListener('load', one); im.addEventListener('error', one); });
    setTimeout(fire, 3000); // กันรูปพัง/โหลดช้า
  }

  /* ---------- เครื่องสุ่มโจทย์ฝั่ง client (ลื่น ไม่ต้องรอ GAS) ---------- */
  function ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  function frac(n, d) { return '<span class="frac"><span>' + n + '</span><span>' + d + '</span></span>'; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function makeSetId() {
    var A = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split(''), N = '23456789'.split('');
    return pick(A) + pick(A) + '-' + pick(N) + pick(N) + pick(N);
  }
  var GEN = {
    arith: function (c) {
      var out = [], D = { easy: [1, 20, 10], medium: [5, 99, 12], hard: [20, 999, 25] }[c.level];
      var addR = c.addRange || [D[0], D[1]], mulM = c.mulMax || D[2];
      var ops = (c.ops && c.ops.length) ? c.ops : ['+'];
      for (var i = 0; i < c.count; i++) {
        var op = pick(ops), a, b, ans, sym;
        if (op === '-') { a = ri(addR[0], addR[1]); b = ri(addR[0], a); ans = a - b; sym = '\u2212'; }
        else if (op === 'x' || op === 'X' || op === '*' || op === '\u00d7') { a = ri(2, mulM); b = ri(2, mulM); ans = a * b; sym = '\u00d7'; }
        else if (op === '/' || op === '\u00f7') { b = ri(2, mulM); ans = ri(2, mulM); a = b * ans; sym = '\u00f7'; }
        else { a = ri(addR[0], addR[1]); b = ri(addR[0], addR[1]); ans = a + b; sym = '+'; }
        out.push({ q: a + ' ' + sym + ' ' + b + ' =', a: String(ans), n: ans });
      }
      return out;
    },
    percent: function (c) {
      var P = { easy: [10, 25, 50], medium: [5, 15, 20, 30, 40], hard: [12, 18, 35, 65, 85] };
      var B = { easy: [20, 40, 60, 80, 100], medium: [80, 120, 150, 200], hard: [150, 260, 320, 480] };
      var out = [];
      for (var i = 0; i < c.count; i++) { var p = pick(P[c.level]), b = pick(B[c.level]); var v = Math.round(p / 100 * b * 100) / 100; out.push({ q: p + '% ของ ' + b + ' เท่ากับเท่าใด', a: String(v), n: v }); }
      return out;
    },
    measure: function (c) {
      var u = [{ q: 'เมตร', to: 'ซม.', f: 100 }, { q: 'กก.', to: 'กรัม', f: 1000 }, { q: 'กม.', to: 'เมตร', f: 1000 }, { q: 'ลิตร', to: 'มล.', f: 1000 }];
      var N = c.range || ({ easy: [1, 9], medium: [2, 25], hard: [5, 99] }[c.level]); var out = [];
      for (var i = 0; i < c.count; i++) { var x = pick(u), n = ri(N[0], N[1]); out.push({ q: n + ' ' + x.q + ' = _____ ' + x.to, a: (n * x.f) + ' ' + x.to, n: n * x.f }); }
      return out;
    },
    fraction: function (c) {
      var M = c.maxDen || ({ easy: 6, medium: 10, hard: 15 }[c.level]); var out = [];
      for (var i = 0; i < c.count; i++) {
        var d1 = ri(2, M), d2 = ri(2, M), n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1), plus = Math.random() < 0.5;
        var num = plus ? (n1 * d2 + n2 * d1) : Math.abs(n1 * d2 - n2 * d1), den = d1 * d2, g = gcd(num, den) || 1;
        out.push({ q: frac(n1, d1) + ' ' + (plus ? '+' : '\u2212') + ' ' + frac(n2, d2) + ' =', a: num === 0 ? '0' : frac(num / g, den / g) });
      }
      return out;
    },
    equation: function (c) {
      var R = { easy: [1, 5, 1, 10], medium: [2, 9, -9, 20], hard: [2, 15, -30, 60] }[c.level]; var out = [];
      for (var i = 0; i < c.count; i++) { var a = ri(R[0], R[1]), x = ri(R[2], R[3]), b = ri(R[2] < 0 ? -12 : 1, 12), cc = a * x + b; out.push({ q: a + 'x ' + (b < 0 ? '\u2212 ' + (-b) : '+ ' + b) + ' = ' + cc, a: 'x = ' + x, n: x }); }
      return out;
    },
    word: function (c) {
      var names = ['น้องฟ้า', 'เด็กชายเอก', 'น้องมุก', 'พี่บาส'], items = ['ดินสอ', 'สมุด', 'ลูกอม', 'ส้ม'];
      var R = c.range || ({ easy: [2, 12], medium: [5, 40], hard: [12, 120] }[c.level]); var out = [];
      for (var i = 0; i < c.count; i++) {
        var nm = pick(names), it = pick(items), a = ri(R[0], R[1]), b = ri(R[0], R[1]), t = ri(0, 2), q, ans;
        if (t === 0) { q = nm + 'มี' + it + ' ' + a + ' ชิ้น ซื้อเพิ่มอีก ' + b + ' ชิ้น มีทั้งหมดกี่ชิ้น'; ans = a + b; }
        else if (t === 1) { var bg = Math.max(a, b), sm = Math.min(a, b); q = nm + 'มี' + it + ' ' + bg + ' ชิ้น ให้เพื่อน ' + sm + ' ชิ้น เหลือกี่ชิ้น'; ans = bg - sm; }
        else { q = nm + 'ซื้อ' + it + 'วันละ ' + a + ' ชิ้น เป็นเวลา ' + b + ' วัน รวมกี่ชิ้น'; ans = a * b; }
        out.push({ q: q, a: ans + ' ชิ้น', n: ans });
      }
      return out;
    },
    picture: function (c) {
      var pics = (c.pics && c.pics.length) ? c.pics : ['\ud83c\udf4e', '\u2b50', '\u2764\ufe0f', '\ud83c\udf38', '\ud83d\ude97', '\ud83c\udf53'];
      var ops = (c.ops && c.ops.length) ? c.ops.filter(function (o) { return o === '+' || o === '-'; }) : ['+'];
      if (!ops.length) ops = ['+'];
      var R = { easy: [1, 5], medium: [2, 8], hard: [3, 10] }[c.level] || [1, 5];
      function rep(s, n) { var o = ''; for (var k = 0; k < n; k++) o += s; return o; }
      var out = [];
      for (var i = 0; i < c.count; i++) {
        var pic = pick(pics), op = pick(ops), a = ri(R[0], R[1]), b = ri(R[0], R[1]), ans, sym;
        if (op === '-') { if (b > a) { var t = a; a = b; b = t; } ans = a - b; sym = '\u2212'; }
        else { ans = a + b; sym = '+'; }
        var q = '<span class="picwrap">' +
          '<span class="piccap">' +
            '<span class="picoval"><span class="picell">' + rep(pic, a) + '</span><span class="piccirc"></span></span>' +
            '<span class="pico">' + sym + '</span>' +
            '<span class="picoval"><span class="picell">' + rep(pic, b) + '</span><span class="piccirc"></span></span>' +
          '</span>' +
          '<span class="pico">=</span>' +
          '<span class="picbox"></span></span>';
        out.push({ q: q, a: String(ans), n: ans, noline: true });
      }
      return out;
    }
  };
  function buildProblems(ch, level, count) {
    var fn = GEN[ch.gen]; if (!fn) return [];
    var cfg = { level: level || 'easy', count: Math.max(4, Math.min(50, Number(count) || 12)) };
    if (ch.ops && ch.ops.length) cfg.ops = ch.ops;
    if (ch.lv) { for (var kk in ch.lv) { if (kk === 'easy' || kk === 'medium' || kk === 'hard') continue; cfg[kk] = ch.lv[kk]; } }
    var ov = ch.lv && ch.lv[cfg.level]; if (ov) for (var k in ov) cfg[k] = ov[k];
    return fn(cfg);
  }
  function genProblems(ch, level, count) { return { setId: makeSetId(), problems: buildProblems(ch, level, count) }; }
  function genQuiz(ch, level, count) {
    var raw = buildProblems(ch, level, count);
    var items = raw.map(function (it) {
      var correct = (typeof it.n === 'number') ? it.n : Number(String(it.a).replace(/[^0-9.\-]/g, ''));
      var seen = {}, keys = [correct]; seen[correct] = 1; var guard = 0;
      while (keys.length < 4 && guard++ < 60) { var d = pick([1, 2, 3, 4, 5, 10, -1, -2, -3, -5]); var cand = correct + d; if (cand >= 0 && !seen[cand]) { seen[cand] = 1; keys.push(cand); } }
      while (keys.length < 4) keys.push(correct + keys.length);
      var arr = shuffle(keys.slice());
      return { q: it.q, choices: arr, correct: arr.indexOf(correct) };
    });
    return { items: items };
  }

  /* ---------- PLATFORM ---------- */
  var Platform = {
    plugins: {},          // id -> { mount }
    meta: [],             // [{id,title,icon,file,adminOnly,order}]
    settings: { org: '', dept: '', logo: '' },
    user: { role: 'public', name: '' },
    curriculum: { subject: 'คณิตศาสตร์', grades: [] },
    store: { saved: [], savedLoaded: false },
    active: null,
    ctx: { gradeId: null, gradeName: '' },

    register: function (p) { this.plugins[p.id] = p; },

    services: function () {
      return {
        api: api, toast: toast, swal: Swal, swalDark: SWAL_DARK, loading: loading, done: done,
        settings: this.settings, user: this.user, curriculum: this.curriculum, store: this.store,
        examSheetHTML: examSheetHTML, printNode: printNode,
        genProblems: genProblems, genQuiz: genQuiz, makeSetId: makeSetId,
        countUp: countUp, animateCounters: animateCounters, reveal: initReveals,
        ctx: this.ctx
      };
    },

    syncTopbar: function () {
      var back = $('#homeBtn'); if (back) back.style.display = this.active ? '' : 'none';
    },

    showHome: function () {
      this.active = null;
      this.ctx = { gradeId: null, gradeName: '' };
      $('#hostTitle').textContent = '';
      this.syncTopbar();
      var self = this;
      var HIDE = { worksheet: 1, quiz: 1, exam: 1 };
      var utils = this.meta.filter(function (m) { return self.plugins[m.id] && !HIDE[m.id]; });
      var UDESC = { vault: 'ชุดข้อสอบที่บันทึกไว้', library: 'คลังข้อสอบสาธารณะ ดาวน์โหลดได้', admin: 'ตั้งค่าและจัดการระบบ', users: 'อนุมัติผู้ใช้ · กำหนดบทบาท', curriculum: 'เพิ่ม/แก้ไข ชั้นและบทเรียน' };
      var grades = (this.curriculum && this.curriculum.grades) || [];
      var gradeCards = grades.map(function (g, i) {
        var nCh = (g.chapters || []).length;
        return '<button class="launch-card reveal" data-grade="' + g.id + '" data-gname="' + g.name + '" style="transition-delay:' + (i * 0.04) + 's;animation-delay:' + (i * 0.4) + 's">' +
          '<span class="lc-ic"><i class="ti ti-school"></i></span>' +
          '<span class="lc-title">คณิต ' + g.name + '</span>' +
          '<span class="lc-desc">ใบงาน · ทดสอบ · สอบจริง · ' + nCh + ' บท</span>' +
          '<span class="lc-go"><i class="ti ti-arrow-right"></i></span>' +
        '</button>';
      }).join('');
      var utilCards = utils.map(function (m, i) {
        return '<button class="launch-card reveal" data-id="' + m.id + '" style="transition-delay:' + (i * 0.05) + 's;animation-delay:' + (i * 0.5) + 's">' +
          '<span class="lc-ic"><i class="ti ' + m.icon + '"></i></span>' +
          '<span class="lc-title">' + m.title + '</span>' +
          '<span class="lc-desc">' + (UDESC[m.id] || '') + '</span>' +
          '<span class="lc-go"><i class="ti ti-arrow-right"></i></span>' +
        '</button>';
      }).join('');
      var host = $('#host');
      host.innerHTML =
        '<div style="max-width:1040px;margin:0 auto">' +
          '<div class="reveal in" style="margin-bottom:20px"><div class="eyebrow">ยินดีต้อนรับ</div>' +
          '<h2 class="font-display" style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin:.25rem 0"><span class="grad-text glow-head">เลือกระบบที่ต้องการใช้งาน</span></h2></div>' +
          '<div id="homeStats"></div>' +
          (gradeCards ? '<div class="eyebrow" style="margin:6px 0 10px">ระบบรายชั้น (วิชาคณิตศาสตร์)</div><div class="launch-grid">' + gradeCards + '</div>' : '') +
          (utilCards ? '<div class="eyebrow" style="margin:22px 0 10px">ระบบส่วนกลาง</div><div class="launch-grid">' + utilCards + '</div>' : '') +
        '</div>';
      $$('.launch-card[data-grade]', host).forEach(function (b) { b.onclick = function () { self.openGrade(b.dataset.grade, b.dataset.gname); }; });
      $$('.launch-card[data-id]', host).forEach(function (b) { b.onclick = function () { self.mount(b.dataset.id); }; });
      initReveals(host);
      loadHomeStats();
    },

    openGrade: function (gid, gname) {
      this.ctx = { gradeId: gid, gradeName: gname };
      this.active = 'grade';
      $('#hostTitle').textContent = 'คณิต ' + gname;
      this.syncTopbar();
      var self = this;
      var pub = this.user && this.user.role === 'public';
      var tools = [
        { id: 'worksheet', label: 'ใบงาน', icon: 'ti-file-pencil' },
        { id: 'quiz', label: 'ทดสอบออนไลน์', icon: 'ti-list-check' }
      ];
      if (!pub && this.plugins['exam']) tools.push({ id: 'exam', label: 'สอบจริง', icon: 'ti-clipboard-check' });
      var tabsHtml = tools.map(function (t, i) {
        return '<button class="grade-tab' + (i === 0 ? ' on' : '') + '" data-tool="' + t.id + '"><i class="ti ' + t.icon + '"></i> ' + t.label + '</button>';
      }).join('');
      var host = $('#host');
      host.innerHTML =
        '<div style="max-width:1080px;margin:0 auto">' +
          '<div class="reveal in" style="margin-bottom:14px"><div class="eyebrow">คณิตศาสตร์ ' + gname + '</div>' +
          '<h2 class="font-display" style="font-size:clamp(1.3rem,2.6vw,1.7rem);font-weight:800;margin:.2rem 0"><span class="grad-text glow-head">เครื่องมือของ ' + gname + '</span></h2></div>' +
          '<div class="grade-tabs" id="gradeTabs">' + tabsHtml + '</div>' +
          '<div id="gradeTool" style="margin-top:18px"></div>' +
        '</div>';
      function mountTool(tid) {
        $$('#gradeTabs .grade-tab', host).forEach(function (b) { b.classList.toggle('on', b.dataset.tool === tid); });
        var el = $('#gradeTool', host); el.innerHTML = '';
        var p = self.plugins[tid]; if (p) p.mount(el, self.services(), self);
      }
      $$('#gradeTabs .grade-tab', host).forEach(function (b) { b.onclick = function () { mountTool(b.dataset.tool); }; });
      initReveals(host);
      if (pub) api('bumpView', { id: 'g-' + gid, title: 'คณิต ' + gname }).catch(function () {});
      mountTool(tools[0].id);
    },

    mount: function (id) {
      var p = this.plugins[id]; if (!p) return;
      var mt = this.meta.filter(function (x) { return x.id === id; })[0] || {};
      this.active = id; $('#hostTitle').textContent = mt.title || id;
      this.syncTopbar();
      var host = $('#host'); host.innerHTML = '';
      p.mount(host, this.services(), this);
      if (this.user && this.user.role === 'public') api('bumpView', { id: id, title: mt.title || id }).catch(function () {});
    },

    renderNav: function () { this.syncTopbar(); },   // เผื่อโค้ดเดิมที่ยังเรียก

    start: function () { this.showHome(); }
  };
  window.Platform = Platform;
  window.goHome = function () { Platform.showHome(); };

  /* ---------- โหลดปลั๊กอินตาม manifest.json ---------- */
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('โหลดไม่ได้: ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadPlugins() {
    return fetch('manifest.json').then(function (r) { return r.json(); }).then(function (mf) {
      var files = (mf.plugins || []);
      return files.reduce(function (chain, name) {
        return chain.then(function () {
          return loadScript('plugins/' + name + '.js').catch(function () { return loadScript(name + '.js'); });
        });
      }, Promise.resolve());
    });
  }

  /* ---------- AUTH FLOW ---------- */
  var loginRole = 'public';
  function bindLogin() {
    $$('#loginSeg button').forEach(function (b) {
      b.onclick = function () {
        $$('#loginSeg button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); loginRole = b.dataset.role;
        $('#loginUser').value = loginRole === 'admin' ? 'admin' : '';
      };
    });
  }
  window.openRegister = function () {
    var IN = 'width:100%;margin:.3rem 0;padding:.6rem .8rem;border-radius:8px;background:#0b1120;color:#e6ebf7;border:1px solid #2a3556;font-family:Sarabun,sans-serif';
    Swal.fire(Object.assign({
      title: 'สมัครเข้าใช้งาน', focusConfirm: false, showCancelButton: true,
      confirmButtonText: 'สมัคร', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
      html: '<div style="text-align:left">' +
        '<input id="r-user" placeholder="ชื่อผู้ใช้ (อังกฤษ/ตัวเลข)" style="' + IN + '">' +
        '<input id="r-name" placeholder="ชื่อที่แสดง" style="' + IN + '">' +
        '<input id="r-pass" type="password" placeholder="รหัสผ่าน (อย่างน้อย 4 ตัว)" style="' + IN + '">' +
        '<input id="r-pass2" type="password" placeholder="ยืนยันรหัสผ่าน" style="' + IN + '">' +
        '<label style="font-size:.85rem;color:#9aa8c8">สมัครเป็น</label>' +
        '<select id="r-role" style="' + IN + '"><option value="member">ผู้ใช้ทั่วไป</option><option value="teacher">ครู</option></select>' +
        '<p style="font-size:.8rem;color:#9aa8c8;margin:.4rem 0 0">สมัครแล้วต้องรอผู้ดูแลอนุมัติก่อนจึงเข้าใช้ได้</p></div>',
      preConfirm: function () {
        var u = document.getElementById('r-user').value.trim(), n = document.getElementById('r-name').value.trim();
        var p1 = document.getElementById('r-pass').value, p2 = document.getElementById('r-pass2').value;
        var role = document.getElementById('r-role').value;
        if (!/^[a-zA-Z0-9_.]{3,}$/.test(u)) { Swal.showValidationMessage('ชื่อผู้ใช้ต้องเป็นอังกฤษ/ตัวเลข อย่างน้อย 3 ตัว'); return false; }
        if (p1.length < 4) { Swal.showValidationMessage('รหัสผ่านต้องยาวอย่างน้อย 4 ตัว'); return false; }
        if (p1 !== p2) { Swal.showValidationMessage('ยืนยันรหัสผ่านไม่ตรงกัน'); return false; }
        return { username: u, displayName: n || u, password: p1, role: role };
      }
    }, SWAL_DARK)).then(function (r) {
      if (!r.isConfirmed) return;
      loading('กำลังสมัคร...');
      api('register', r.value).then(function () {
        done(); Swal.fire(Object.assign({ icon: 'success', title: 'สมัครเรียบร้อย', text: 'รอผู้ดูแลอนุมัติบัญชี แล้วจึงเข้าสู่ระบบได้', confirmButtonColor: '#6366f1' }, SWAL_DARK));
      }).catch(function (e) { done(); alertErr('สมัครไม่สำเร็จ', String(e.message || e)); });
    });
  };

  window.toggleLoginPass = function () {
    var inp = $('#loginPass'), ic = $('#pwIcon');
    if (!inp) return;
    if (inp.type === 'password') { inp.type = 'text'; if (ic) ic.className = 'ti ti-eye-off'; }
    else { inp.type = 'password'; if (ic) ic.className = 'ti ti-eye'; }
  };

  var CPINP = 'width:100%;margin:.3rem 0;padding:.6rem .8rem;border-radius:8px;background:#0b1120;color:#e6ebf7;border:1px solid #2a3556;font-family:Sarabun,sans-serif';
  function openChangePassword(force) {
    var html = '<div style="text-align:left">' +
      (force ? '<p style="color:#fbbf24;font-size:.85rem;margin:0 0 6px">เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งานครั้งแรก</p>' : '<input id="cp-old" type="password" placeholder="รหัสผ่านเดิม" style="' + CPINP + '">') +
      '<input id="cp-new" type="password" placeholder="รหัสผ่านใหม่ (อย่างน้อย 4 ตัว)" style="' + CPINP + '">' +
      '<input id="cp-new2" type="password" placeholder="ยืนยันรหัสผ่านใหม่" style="' + CPINP + '">' +
      '</div>';
    return Swal.fire(Object.assign({
      title: 'เปลี่ยนรหัสผ่าน', html: html, focusConfirm: false,
      showCancelButton: !force, allowOutsideClick: !force, allowEscapeKey: !force,
      confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
      preConfirm: function () {
        var oldp = force ? '' : document.getElementById('cp-old').value;
        var n1 = document.getElementById('cp-new').value, n2 = document.getElementById('cp-new2').value;
        if (n1.length < 4) { Swal.showValidationMessage('รหัสผ่านใหม่ต้องยาวอย่างน้อย 4 ตัว'); return false; }
        if (n1 !== n2) { Swal.showValidationMessage('ยืนยันรหัสผ่านไม่ตรงกัน'); return false; }
        return { oldPassword: oldp, newPassword: n1 };
      }
    }, SWAL_DARK));
  }
  function forceChangeThenEnter() {
    return openChangePassword(true).then(function (r) {
      if (!r.isConfirmed) { return forceChangeThenEnter(); }
      loading('กำลังบันทึกรหัสผ่านใหม่...');
      return api('changePassword', { newPassword: r.value.newPassword }).then(function () {
        done(); toast('success', 'ตั้งรหัสผ่านใหม่แล้ว');
        loading('กำลังโหลด...'); return enterAppFromBootstrap().then(done);
      }).catch(function (e) { done(); alertErr('เปลี่ยนรหัสไม่สำเร็จ', String(e.message || e)); return forceChangeThenEnter(); });
    });
  }

  window.doLogin = function () {
    if (window._welcomeTimer) clearTimeout(window._welcomeTimer);
    var u = $('#loginUser').value.trim(), p = $('#loginPass').value.trim();
    loading('กำลังเข้าสู่ระบบ...');
    api('login', { username: u, password: p }).then(function (res) {
      session.token = res.token; localStorage.setItem(LS, res.token);
      done();
      if (res.mustChange) return forceChangeThenEnter();
      loading('กำลังโหลด...'); return enterAppFromBootstrap().then(done);
    }).catch(function (e) { done(); alertErr('เข้าสู่ระบบไม่สำเร็จ', String(e.message || e)); });
  };
  function statsSkeleton() {
    return '<div class="panel reveal glow-panel" style="margin:0 0 26px;padding:24px">' +
      '<div class="eyebrow glow-head" style="margin-bottom:16px">สถิติการใช้งาน</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;margin-bottom:6px">' +
        '<div><div class="stat-num" style="opacity:.4">···</div><div style="color:var(--muted);font-size:.82rem">ระบบ</div></div>' +
        '<div><div class="stat-num" style="opacity:.4">···</div><div style="color:var(--muted);font-size:.82rem">ยอดผู้ใช้งาน</div></div>' +
        '<div><div class="stat-num" style="opacity:.4">···</div><div style="color:var(--muted);font-size:.82rem">จำนวนการดู</div></div>' +
      '</div>' +
      '<p style="text-align:center;color:var(--muted);font-size:.8rem">กำลังโหลดสถิติ…</p>' +
    '</div>';
  }
  function renderStats(s) {
    var box = $('#homeStats'); if (!box) return;
    var vbs = (s.viewsBySystem || []).filter(function (v) { return v.count > 0; });
    var totalViews = (s.viewsBySystem || []).reduce(function (a, v) { return a + (v.count || 0); }, 0);
    window._lastVBS = vbs;
    box.innerHTML =
      '<div class="panel reveal glow-panel" style="margin:0 0 26px;padding:24px">' +
        '<div class="eyebrow glow-head" style="margin-bottom:16px">สถิติการใช้งาน</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;margin-bottom:20px">' +
          '<div><div class="stat-num grad-text glow-head">' + s.systems + '</div><div style="color:var(--muted);font-size:.82rem">ระบบ</div></div>' +
          '<div><div class="stat-num glow-head" style="color:var(--accent2)">' + s.users + '</div><div style="color:var(--muted);font-size:.82rem">ยอดผู้ใช้งาน</div></div>' +
          '<div><div class="stat-num glow-head" style="color:var(--accent2)">' + totalViews + '</div><div style="color:var(--muted);font-size:.82rem">จำนวนการดู</div></div>' +
        '</div>' +
        (vbs.length
          ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:center" class="grid-main">' +
              '<div style="max-width:300px;margin:0 auto;width:100%"><div class="eyebrow" style="text-align:center;margin-bottom:8px">สัดส่วนการเข้าดู</div><canvas id="pieViews" class="glow-chart"></canvas></div>' +
              '<div><div class="eyebrow" style="text-align:center;margin-bottom:8px">การเข้าดูแต่ละระบบ</div><canvas id="barViews" class="glow-chart" height="200"></canvas></div>' +
            '</div>'
          : '<p style="text-align:center;color:var(--muted)">ยังไม่มีข้อมูลการเข้าดูระบบ — ลองกดเข้าระบบสักครั้งแล้วกลับมาดู</p>') +
      '</div>';
    initReveals($('#host'));
    if (vbs.length) drawViewCharts(vbs);
  }
  function loadHomeStats() {
    var box = $('#homeStats'); if (!box) return;
    var cached = Platform.store && Platform.store._stats;
    if (cached) renderStats(cached); else box.innerHTML = statsSkeleton(); // ขึ้นทันทีพร้อมหน้า
    api('publicStats').then(function (s) {
      if (Platform.store) Platform.store._stats = s;
      renderStats(s); // อัปเดตค่าจริงเมื่อมาถึง
    }).catch(function () {});
  }
  function themeColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#6366f1'; }
  function hexToRgba(hex, a) {
    hex = String(hex).replace('#', ''); if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return 'rgba(' + (r || 0) + ',' + (g || 0) + ',' + (b || 0) + ',' + a + ')';
  }
  function viewPalette(n) {
    var base = [themeColor('--accent'), themeColor('--accent2')], out = [];
    for (var i = 0; i < n; i++) { var al = 1 - Math.floor(i / 2) * 0.22; if (al < 0.4) al = 0.4; out.push(hexToRgba(base[i % 2], al)); }
    return out;
  }
  function drawViewCharts(vbs) {
    if (typeof Chart === 'undefined') return;
    var labels = vbs.map(function (v) { return v.title; });
    var data = vbs.map(function (v) { return v.count; });
    var accent = themeColor('--accent'), tick = '#9aa8c8';
    if (window._pieChart) window._pieChart.destroy();
    if (window._barChart) window._barChart.destroy();
    var pe = document.getElementById('pieViews'), be = document.getElementById('barViews');
    if (pe) window._pieChart = new Chart(pe, { type: 'doughnut', data: { labels: labels, datasets: [{ data: data, backgroundColor: viewPalette(labels.length), borderColor: 'transparent' }] }, options: { plugins: { legend: { position: 'bottom', labels: { color: '#cdd6f4', font: { family: 'Sarabun' } } } } } });
    if (be) window._barChart = new Chart(be, { type: 'bar', data: { labels: labels, datasets: [{ label: 'การเข้าดู', data: data, backgroundColor: hexToRgba(accent, 0.85), borderRadius: 8 }] }, options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: tick, font: { family: 'Sarabun' } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: tick, precision: 0 }, grid: { color: 'rgba(255,255,255,.06)' } } } } });
  }

  window.exitPublic = function () {
    if (window._welcomeTimer) clearTimeout(window._welcomeTimer);
    session.token = ''; localStorage.removeItem(LS); Platform.user = {};
    $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');
  };
  function setExitButton(loggedIn) {
    var b = $('#exitBtn'); if (!b) return;
    if (loggedIn) { b.innerHTML = '<i class="ti ti-logout"></i>'; b.title = 'ออกจากระบบ'; b.onclick = window.logout; }
    else { b.innerHTML = '<i class="ti ti-home"></i>'; b.title = 'กลับหน้าแรก'; b.onclick = window.exitPublic; }
  }

  function renderFeatures(list) {
    var host = $('#featGrid'); if (!host) return;
    var DESC = { worksheet: 'เลือกชั้นและบท สุ่มโจทย์ใหม่ไม่จำกัด พร้อมเฉลยและพิมพ์ A4', quiz: 'ทำแบบทดสอบเลือกตอบ ตรวจและสรุปคะแนนอัตโนมัติ', vault: 'เก็บชุดข้อสอบที่ออกไว้ นำกลับมาพิมพ์ซ้ำได้', library: 'คลังข้อสอบสาธารณะ เปิดดู/พิมพ์ได้ทุกเมื่อ' };
    if (!list.length) { host.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted)">ยังไม่มีระบบที่เปิดสาธารณะ</p>'; return; }
    host.innerHTML = list.map(function (m, i) {
      return '<div class="panel reveal click feat-card" style="padding:20px;cursor:pointer;transition-delay:' + (i * 0.08) + 's;animation-delay:' + (i * 0.5) + 's" onclick="guestLogin(\'' + m.id + '\')">' +
        '<div class="ic" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:color-mix(in srgb,var(--accent) 22%,transparent);color:var(--accent2)"><i class="ti ' + m.icon + '"></i></div>' +
        '<div class="font-display" style="font-weight:600;margin-top:12px">' + m.title + '</div>' +
        '<p style="color:var(--muted);font-size:.86rem;margin:6px 0 0">' + (DESC[m.id] || '') + '</p>' +
        '<div style="margin-top:10px;color:var(--accent2);font-size:.82rem;font-weight:600">เปิดใช้งาน <i class="ti ti-arrow-right"></i></div>' +
      '</div>';
    }).join('');
  }

  window.guestLogin = function (targetId) {
    if (window._welcomeTimer) clearTimeout(window._welcomeTimer);
    // โหมดสาธารณะ: เข้าใช้ได้เลยโดยไม่ต้องล็อกอิน (เห็นเฉพาะระบบที่เปิดเป็น public)
    loading('กำลังเข้าสู่โหมดสาธารณะ...');
    api('publicBootstrap').then(function (b) {
      session.token = ''; localStorage.removeItem(LS);
      Platform.settings = b.settings || Platform.settings;
      Platform.meta = b.plugins || [];
      Platform.curriculum = b.curriculum || Platform.curriculum;
      Platform.user = { role: 'public', name: 'ผู้ใช้สาธารณะ' };
      Platform.store = { saved: [], savedLoaded: false };
      $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden');
      $('#userChip span').textContent = 'สาธารณะ';
      $('#userChip i').className = 'ti ti-world';
      bindUserChip(false);
      setExitButton(false);
      Platform.start();
      if (targetId && Platform.plugins[targetId]) Platform.mount(targetId);
      done(); toast('success', 'เข้าใช้งานแบบสาธารณะ');
    }).catch(function (e) { done(); alertErr('เข้าใช้สาธารณะไม่ได้', String(e.message || e)); });
  };
  function bindUserChip(loggedIn) {
    var chip = $('#userChip'); if (!chip) return;
    chip.style.cursor = loggedIn ? 'pointer' : 'default';
    chip.title = loggedIn ? 'คลิกเพื่อเปลี่ยนรหัสผ่าน' : '';
    chip.onclick = loggedIn ? function () {
      openChangePassword(false).then(function (r) {
        if (!r.isConfirmed) return;
        loading('กำลังเปลี่ยนรหัสผ่าน...');
        api('changePassword', { oldPassword: r.value.oldPassword, newPassword: r.value.newPassword })
          .then(function () { done(); toast('success', 'เปลี่ยนรหัสผ่านแล้ว'); })
          .catch(function (e) { done(); alertErr('เปลี่ยนรหัสไม่สำเร็จ', String(e.message || e)); });
      });
    } : null;
  }
  window.logout = function () {
    Swal.fire(Object.assign({ icon: 'question', title: 'ออกจากระบบ?', showCancelButton: true, confirmButtonText: 'ออกจากระบบ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#fb7185' }, SWAL_DARK))
      .then(function (r) {
        if (r.isConfirmed) {
          session.token = ''; localStorage.removeItem(LS);
          $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); $('#loginPass').value = '';
        }
      });
  };

  function enterAppFromBootstrap() {
    return api('bootstrap').then(function (b) {
      Platform.settings = b.settings || Platform.settings;
      Platform.meta = b.plugins || [];
      Platform.curriculum = b.curriculum || Platform.curriculum;
      Platform.user = b.user || Platform.user;
      $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden');
      $('#userChip span').textContent = b.user.role === 'admin' ? 'ผู้ดูแลระบบ' : (b.user.name || 'ครูผู้สอน');
      $('#userChip i').className = b.user.role === 'admin' ? 'ti ti-shield-lock' : 'ti ti-user';
      bindUserChip(true);
      setExitButton(true);
      Platform.start();
      toast('success', b.user.role === 'admin' ? 'เข้าสู่ระบบผู้ดูแลแล้ว' : 'พร้อมใช้งานแล้ว');
    });
  }

  /* ---------- THEME ---------- */
  function paintDots() {
    var map = { indigo: '#6366f1', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', sky: '#0ea5e9', violet: '#a855f7' };
    $$('.theme-dot').forEach(function (d) {
      var t = d.dataset.theme; d.style.background = map[t];
      d.style.borderColor = document.documentElement.dataset.theme === t ? '#fff' : 'transparent';
    });
  }
  function bindTheme() {
    $$('.theme-dot').forEach(function (d) {
      d.onclick = function () {
        document.documentElement.dataset.theme = d.dataset.theme; paintDots();
        try { localStorage.setItem(LS_THEME, d.dataset.theme); } catch (e) {}
        if (window._lastVBS && window._lastVBS.length && document.getElementById('pieViews')) drawViewCharts(window._lastVBS);
      };
    });
    paintDots();
  }

  /* ---------- popups หน้า public ---------- */
  window.showNews = function () {
    Swal.fire(Object.assign({
      icon: 'info', title: 'ข่าวประชาสัมพันธ์', width: 520, confirmButtonText: 'รับทราบ', confirmButtonColor: '#6366f1',
      html: '<div style="text-align:left;font-size:.92rem;line-height:1.8"><b>มีอะไรใหม่</b><br>• เพิ่มการจัดเนื้อหาแบบ <b>ชั้น › บท › ใบงาน</b> (ป.1–ม.3)<br>• เพิ่มระบบ <b>ทดสอบออนไลน์</b> ตรวจคะแนนอัตโนมัติ<br>• เพิ่ม <b>คลังข้อสอบ</b> เก็บชุดไว้พิมพ์ซ้ำ</div>'
    }, SWAL_DARK));
  };
  window.featInfo = function (which) {
    var data = {
      worksheet: { i: 'ti-file-pencil', t: 'ออกข้อสอบกระดาษ', h: 'เลือกระดับชั้นและบทเรียน ระบบสุ่มโจทย์ให้ใหม่ทุกครั้ง พร้อมเฉลยแยกชุด พิมพ์เป็นกระดาษ A4 หรือบันทึกเป็น PDF ได้ทันที' },
      quiz: { i: 'ti-list-check', t: 'ทดสอบออนไลน์', h: 'นักเรียนทำแบบทดสอบเลือกตอบบนหน้าจอ ระบบตรวจและสรุปคะแนนให้อัตโนมัติ พร้อมไฮไลต์ข้อถูก/ผิด' },
      vault: { i: 'ti-archive', t: 'คลังข้อสอบ', h: 'ชุดที่กดบันทึกจะถูกเก็บไว้ในคลัง นำกลับมาพิมพ์ซ้ำได้ทุกเมื่อ (บันทึกลง Google Sheets)' }
    }[which];
    Swal.fire(Object.assign({ iconHtml: '<i class="ti ' + data.i + '"></i>', title: data.t, text: data.h, confirmButtonText: 'เข้าสู่ระบบเพื่อใช้งาน', confirmButtonColor: '#6366f1' }, SWAL_DARK));
  };

  /* ---------- BOOT ---------- */
  function boot() {
    if (!API || API.indexOf('/exec') < 0) {
      // ยังไม่ได้ตั้งค่า API_URL
      $$('.reveal').forEach(function (e) { e.classList.add('in'); });
      bindTheme(); bindLogin();
      Swal.fire(Object.assign({ icon: 'warning', title: 'ยังไม่ได้ตั้งค่า API', text: 'เปิดไฟล์ config.js แล้ววาง URL /exec ของ Web App (GAS)', confirmButtonColor: '#6366f1' }, SWAL_DARK));
      return;
    }
    bindTheme(); bindLogin();
    loadPlugins().catch(function (e) { console.error(e); });

    // เติมตัวเลขสถิติหน้า public + เริ่มเอฟเฟกต์ (ขึ้นทันทีจากแคช แล้วค่อยรีเฟรช)
    function fillLanding(s) {
      if (!s) { initReveals(); return; }
      var g = $('#stGrades'), sy = $('#stSystems'), us = $('#stUsers');
      if (g) g.dataset.count = s.grades;
      if (sy) sy.dataset.count = s.systems;
      if (us) us.dataset.count = s.visits;
      renderFeatures(s.systemsList || []);
      initReveals();
    }
    var cachedLanding = Platform.store && Platform.store._stats;
    if (cachedLanding) fillLanding(cachedLanding);
    else { var fg = $('#featGrid'); if (fg) fg.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);font-size:.85rem">กำลังโหลดระบบ…</p>'; }
    apiGetPublicStats().then(function (s) {
      if (s && Platform.store) Platform.store._stats = s;
      fillLanding(s);
    });

    // ถ้ามี token เก่า ลองเข้าระบบต่อเลย
    if (session.token) {
      enterAppFromBootstrap().catch(function () { session.token = ''; localStorage.removeItem(LS); });
    }



    // ป๊อปอัปต้อนรับตรงกลาง (โผล่สั้นๆ แล้วหายเอง) แสดงเฉพาะตอนอยู่หน้าล็อกอิน
    if (!REDUCE && !session.token) window._welcomeTimer = setTimeout(function () {
      var onLogin = !$('#loginView').classList.contains('hidden') && $('#appView').classList.contains('hidden');
      if (onLogin && !session.token && !Swal.isVisible()) {
        Swal.fire(Object.assign({
          iconHtml: '<img src="https://img2.pic.in.th/Logo-removebg-previewd44fed925d2a2228.png" style="width:84px;height:84px;object-fit:contain">',
          customClass: { icon: 'no-border-icon' },
          title: 'ยินดีต้อนรับเข้าสู่ระบบ EduForge',
          text: 'แพลตฟอร์มรวมระบบสร้างสื่อการเรียนที่พัฒนาโดย ครูแบงค์',
          confirmButtonText: 'เริ่มเลย', confirmButtonColor: '#6366f1',
          timer: 2500, timerProgressBar: true
        }, SWAL_DARK));
      }
    }, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
