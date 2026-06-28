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
  // แคชสถิติลง localStorage เพื่อให้เปิดหน้ามาแล้วเด้งทันที (ไม่ต้องรอ GAS ทุกครั้ง)
  var STATS_LS = 'eduforge_stats';
  function statsCacheGet() {
    if (Platform.store && Platform.store._stats) return Platform.store._stats;
    try { var raw = localStorage.getItem(STATS_LS); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function statsCacheSet(s) {
    if (!s) return;
    if (Platform.store) Platform.store._stats = s;
    try { localStorage.setItem(STATS_LS, JSON.stringify(s)); } catch (e) {}
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

  /* ---------- base64 (utf-8 ปลอดภัย) สำหรับ QR เฉลย ---------- */
  function b64e(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64d(str) { return decodeURIComponent(escape(atob(str))); }
  function keyURL(title, setId, answers) {
    var o = { t: title, s: setId, a: answers };
    return location.origin + location.pathname + '#k=' + encodeURIComponent(b64e(JSON.stringify(o)));
  }
  function makeQR(text) {
    return new Promise(function (res) {
      if (!window.QRCode) { res(''); return; }
      try {
        var tmp = document.createElement('div');
        tmp.style.position = 'absolute'; tmp.style.left = '-9999px'; tmp.style.top = '0';
        document.body.appendChild(tmp);
        new QRCode(tmp, { text: text, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
        setTimeout(function () {
          var url = '', cv = tmp.querySelector('canvas');
          if (cv) { try { url = cv.toDataURL('image/png'); } catch (e) { } }
          if (!url) { var im = tmp.querySelector('img'); if (im) url = im.src; }
          document.body.removeChild(tmp);
          res(url);
        }, 40);
      } catch (e) { res(''); }
    });
  }
  // ถ้าเปิดด้วยลิงก์ QR (#k=...) ให้แสดงหน้าเฉลยแล้วหยุด
  function showKeyFromHash() {
    var h = location.hash || '';
    if (h.indexOf('#k=') !== 0) return false;
    try {
      var obj = JSON.parse(b64d(decodeURIComponent(h.slice(3))));
      var ans = (obj.a || []).map(function (a, i) { return '<div class="qitem"><span class="qno">' + (i + 1) + '.</span><span class="qbody"><span class="ans">' + a + '</span></span></div>'; }).join('');
      document.body.innerHTML = '<div style="max-width:760px;margin:28px auto;padding:0 16px">' +
        '<div class="panel" style="padding:24px">' +
        '<div class="eyebrow">เฉลย</div>' +
        '<h2 class="font-display" style="margin:.2rem 0 4px;font-weight:800"><span class="grad-text">' + (obj.t || 'เฉลย') + '</span></h2>' +
        '<div class="sub" style="color:var(--muted);margin-bottom:16px">ชุด ' + (obj.s || '') + '</div>' +
        '<div class="key-grid">' + ans + '</div>' +
        '<div style="text-align:center;margin-top:20px"><a href="' + location.pathname + '" class="btn btn-accent">ไปหน้าหลัก</a></div>' +
        '</div></div>';
      return true;
    } catch (e) { return false; }
  }

  /* ---------- ตัวสร้างกระดาษข้อสอบ (ใช้ร่วมกันหลายปลั๊กอิน) ---------- */
  function examSheetHTML(o) {
    var S = Platform.settings;
    var date = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    var lv = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' }[o.level] || o.level || '';
    var cols = o.cols === 2 ? 2 : 1;
    var total = o.problems.length;
    var isTall = o.problems.some(function (p) { return p.tall; }); // โจทย์รูป/นับ (สูง)
    var isNum = o.problems.length && o.problems[0].numtable;        // ตารางเขียนเลข
    var isOrd = o.problems.length && o.problems[0].ord;             // เรียงลำดับ (กล่อง อาจ 2 บรรทัด)
    var isClock = o.problems.length && o.problems[0].clock;         // นาฬิกา (สูง)
    var isGeo = o.problems.length && o.problems[0].geo;             // เรขาคณิตเต็มหน้า (ไม่แบ่งข้อ)
    var isFull = o.problems.length && (o.problems[0].geo || o.problems[0].full); // ใบงานเต็มหน้า (เรขา/วัดความยาว)
    var isWp = o.problems.length && o.problems[0].wp;               // โจทย์ปัญหา (การ์ดเต็มกว้าง)
    if (isNum || isFull || isWp) cols = 1;
    var fs = o.fontSize || 'normal';
    var fsFactor = fs === 'xl' ? 0.6 : (fs === 'lg' ? 0.78 : 1);
    var isScale = o.problems.length && o.problems[0].scale;
    var isBox = o.problems.length && o.problems[0].box;
    var perHint = o.problems.length && o.problems[0].per;
    var perCol = isFull ? 1 : (perHint ? perHint : (isBox ? 5 : (isScale ? 3 : (isNum ? 3 : (isClock ? 4 : (isOrd ? 8 : (isTall ? 5 : 15)))))));    // numwrite แถวสูง (4 บรรทัด) จำกัด 3/หน้า กันตก
    if (!isFull) perCol = Math.max(2, Math.round(perCol * fsFactor));   // ฟอนต์ใหญ่ = ข้อต่อหน้าน้อยลง กันตก
    var perPage = perCol * cols;
    // หน้าแรก header สูง (มีชื่อ/คะแนน/คำชี้แจง ~72mm) ใส่ได้น้อยกว่าหน้าถัดไป (header ต่อ ~26mm)
    // เฉพาะโจทย์การ์ดสูง (box/scale/wp/tall) ลดหน้าแรกลง 1 แถว กันข้อหล่นไปหน้าถัดไปแบบไม่เต็ม
    var bigItem = isBox || isWp;
    var perColFirst = bigItem ? Math.max(1, perCol - 1) : perCol;
    var perPageFirst = perColFirst * cols;
    var scoreTotal = isFull ? (o.problems[0].pts || total) : total;   // เต็มหน้า: คะแนนเต็ม = จำนวนรูป/ข้อ

    function qitemHTML(p, i) {
      return '<div class="qitem"><span class="qno">' + (i + 1) + '.</span><span class="qbody">' + p.q + (p.noline ? '' : ' <span class="ans-line"></span>') + '</span></div>';
    }
    function headFull() {
      return '<div class="exam-head"><img src="' + S.logo + '">' +
        '<div style="flex:1"><h1>' + S.org + '</h1><div class="sub">' + S.dept + '</div></div>' +
        '<div style="text-align:right">' + (o.qr ? '<img class="qr-key" src="' + o.qr + '"><div class="qr-cap">สแกนดูเฉลย</div>' : '<div class="mono" style="font-size:11px;color:#888">ชุดที่</div><div class="mono" style="font-weight:700;color:var(--accent)">' + o.setId + '</div>') + '</div></div>' +
        '<div style="text-align:center;margin:14px 0 4px"><div class="font-display" style="font-size:18px;font-weight:700">' + o.title + '</div><div class="sub">เรื่อง ' + o.subjectName + ' · ระดับ ' + lv + (o.term ? ' · ภาคเรียนที่ ' + o.term : '') + (o.year ? ' · ปีการศึกษา ' + o.year : '') + '</div></div>' +
        '<div class="meta-row"><span><b>ชื่อ–สกุล</b> <span class="blank" style="min-width:170px"></span></span><span><b>ชั้น</b> <span class="blank" style="min-width:55px"></span></span><span><b>เลขที่</b> <span class="blank" style="min-width:42px"></span></span><span><b>วันที่</b> ' + date + '</span><span class="score-box"><b>คะแนนที่ได้</b> <span class="blank" style="min-width:46px"></span> / ' + scoreTotal + '</span></div>' +
        '<div class="instr"><b>คำชี้แจง</b> ' + (o.instr ? o.instr : 'แสดงวิธีทำและเขียนคำตอบลงในช่องว่าง') + ' (' + (isGeo ? scoreTotal + ' รูป รูปละ 1 คะแนน' : scoreTotal + ' ข้อ ข้อละ 1 คะแนน') + ')</div>';
    }
    function headCont() {
      return '<div class="exam-head" style="margin-bottom:18px"><img src="' + S.logo + '">' +
        '<div style="flex:1"><h1>' + o.title + ' (ต่อ)</h1><div class="sub">เรื่อง ' + o.subjectName + ' · ระดับ ' + lv + '</div></div>' +
        '<div style="text-align:right"><div class="mono" style="font-size:11px;color:#888">ชุดที่</div><div class="mono" style="font-weight:700;color:var(--accent)">' + o.setId + '</div></div></div>';
    }
    function foot() {
      return '<div class="sheet-foot"><span>พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3</span><span class="mono">' + o.setId + '</span></div>';
    }

    var pages = [];
    var st = 0, firstPage = true;
    while (st < total) { var pp = firstPage ? perPageFirst : perPage; pages.push({ items: o.problems.slice(st, st + pp), start: st }); st += pp; firstPage = false; }
    if (!pages.length) pages.push({ items: [], start: 0 });

    var sheet = pages.map(function (page, pi) {
      var chunk = page.items, base = page.start;
      var rowsOnPage = Math.ceil(chunk.length / cols) || 1;
      var rowh = 185 / rowsOnPage; if (rowh > 24) rowh = 24; if (rowh < 9) rowh = 9;
      rowh = Math.round(rowh * 10) / 10;
      var content;
      if (isFull) {
        content = chunk.map(function (p) { return p.q; }).join('');
      } else if (isNum) {
        var rows = chunk.map(function (p, idx) {
          return '<div class="nwrow"><div class="nwc nwpic"><span class="nwno">' + (base + idx + 1) + ')</span>' + p.q + '</div>' +
            '<div class="nwc nwblank"><span class="nwl"></span><span class="nwl"></span></div>' +
            '<div class="nwc nwblank"><span class="nwl"></span><span class="nwl"></span></div>' +
            '<div class="nwc nwblank nwword"><span class="nwl"></span><span class="nwl"></span><span class="nwl"></span><span class="nwl"></span></div></div>';
        }).join('');
        content = '<div class="nwtable"><div class="nwrow nwhead"><div class="nwc nwpic">ภาพ</div><div class="nwc">ตัวเลขฮินดูอารบิก</div><div class="nwc">ตัวเลขไทย</div><div class="nwc nwword">ตัวหนังสือ</div></div>' + rows + '</div>';
      } else {
        var items = chunk.map(function (p, idx) { return qitemHTML(p, base + idx); }).join('');
        var isGrid = chunk[0] && chunk[0].grid;
        content = isGrid
          ? '<div class="qgrid ' + (cols === 2 ? 'c2' : '') + '">' + items + '</div>'
          : '<div class="qcols ' + (cols === 2 ? 'c2' : '') + '">' + items + '</div>';
      }
      return '<div class="sheet pop' + (pi > 0 ? ' pgb' : '') + (fs !== 'normal' ? ' fs-' + fs : '') + '" style="--rowh:' + rowh + 'mm">' +
        (pi === 0 ? headFull() : headCont()) + content + '</div>';
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
  // รูปผัก/ผลไม้ (วาดเป็น SVG) สำหรับตาชั่ง
  var PRODUCE_ = {
    'กะหล่ำ': '<circle cx="CX" cy="CY" r="22" fill="#8bc34a" stroke="#4e7d22" stroke-width="2"/><path d="M CX,CYm22 Q CXm9,CY CX,CYp20 Q CXp9,CY CX,CYm22" fill="none" stroke="#4e7d22" stroke-width="1.3"/><circle cx="CX" cy="CY" r="6" fill="#cfe8a0"/>',
    'ฟักทอง': '<ellipse cx="CX" cy="CYp2" rx="24" ry="18" fill="#f4901e" stroke="#b5560a" stroke-width="2"/><path d="M CXm12,CYm13 Q CXm16,CYp2 CXm12,CYp16" fill="none" stroke="#b5560a" stroke-width="1.3"/><path d="M CXp12,CYm13 Q CXp16,CYp2 CXp12,CYp16" fill="none" stroke="#b5560a" stroke-width="1.3"/><rect x="CXm3" y="CYm24" width="6" height="8" rx="2" fill="#6b8e23"/>',
    'ถั่วฝักยาว': '<path d="M CXm20,CYm14 Q CXp6,CYm6 CXp18,CYp16" fill="none" stroke="#7cb342" stroke-width="5" stroke-linecap="round"/><path d="M CXm20,CYm7 Q CXp4,CY CXp20,CYp14" fill="none" stroke="#8bc34a" stroke-width="5" stroke-linecap="round"/><path d="M CXm18,CY Q CXp4,CYp8 CXp18,CYp20" fill="none" stroke="#689f38" stroke-width="5" stroke-linecap="round"/>',
    'แครอท': '<polygon points="CXm13,CYm8 CXp13,CYm8 CX,CYp22" fill="#f4901e" stroke="#c4600a" stroke-width="2"/><path d="M CX,CYm8 L CXm8,CYm22 M CX,CYm8 L CX,CYm24 M CX,CYm8 L CXp8,CYm22" stroke="#4caf50" stroke-width="3" fill="none" stroke-linecap="round"/>',
    'มะเขือ': '<path d="M CX,CYm16 Q CXp20,CYm12 CXp16,CYp8 Q CXp11,CYp22 CX,CYp22 Q CXm11,CYp22 CXm16,CYp8 Q CXm20,CYm12 CX,CYm16" fill="#7e3ff2" stroke="#4a1f9e" stroke-width="2"/><path d="M CXm8,CYm14 Q CX,CYm20 CXp8,CYm14" fill="#4caf50" stroke="#2e7d32" stroke-width="2"/><rect x="CXm2" y="CYm24" width="4" height="8" fill="#2e7d32"/>',
    'มะระ': '<path d="M CXm20,CYm12 Q CX,CYm22 CXp20,CYp12 Q CX,CYp22 CXm20,CYm12" fill="#9ccc65" stroke="#558b2f" stroke-width="2"/><circle cx="CXm6" cy="CYm4" r="2" fill="#558b2f"/><circle cx="CXp4" cy="CYp4" r="2" fill="#558b2f"/><circle cx="CXp10" cy="CYm2" r="2" fill="#558b2f"/>',
    'หอมแดง': '<path d="M CX,CYm18 Q CXp16,CYm6 CXp11,CYp11 Q CXp6,CYp22 CX,CYp22 Q CXm6,CYp22 CXm11,CYp11 Q CXm16,CYm6 CX,CYm18" fill="#b5532e" stroke="#7d2f16" stroke-width="2"/><path d="M CX,CYm18 L CXm4,CYm26 M CX,CYm18 L CXp4,CYm25" stroke="#8d6e63" stroke-width="2"/>',
    'แตงกวา': '<rect x="CXm21" y="CYm8" width="42" height="17" rx="8" fill="#7cb342" stroke="#33691e" stroke-width="2"/><line x1="CXm11" y1="CYm6" x2="CXm11" y2="CYp7" stroke="#aed581" stroke-width="1.3"/><line x1="CX" y1="CYm6" x2="CX" y2="CYp7" stroke="#aed581" stroke-width="1.3"/><line x1="CXp11" y1="CYm6" x2="CXp11" y2="CYp7" stroke="#aed581" stroke-width="1.3"/>',
    'มันฝรั่ง': '<ellipse cx="CX" cy="CYp2" rx="23" ry="16" fill="#c9a875" stroke="#8a6d3b" stroke-width="2"/><circle cx="CXm8" cy="CYm4" r="2" fill="#8a6d3b"/><circle cx="CXp6" cy="CYp4" r="2" fill="#8a6d3b"/><circle cx="CXp12" cy="CYm6" r="1.6" fill="#8a6d3b"/>',
    'พริก': '<path d="M CXm15,CYm12 Q CXp15,CYm12 CXp13,CYp4 Q CXp9,CYp20 CXm2,CYp18 Q CXm13,CYp16 CXm15,CYm12" fill="#e53935" stroke="#a31515" stroke-width="2"/><path d="M CXm15,CYm12 q -3,-6 -7,-7" stroke="#4caf50" stroke-width="3" fill="none" stroke-linecap="round"/>',
    'มะเขือเทศ': '<circle cx="CX" cy="CYp3" r="20" fill="#e53935" stroke="#a31515" stroke-width="2"/><path d="M CXm8,CYm14 L CXm4,CYm8 L CX,CYm15 L CXp4,CYm8 L CXp8,CYm14 L CXp5,CYm5 L CXm5,CYm5 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="1.3"/>',
    'ผักชี': '<path d="M CX,CYp22 L CX,CYm2" stroke="#33691e" stroke-width="2"/><circle cx="CXm11" cy="CYm9" r="8" fill="#7cb342"/><circle cx="CXp11" cy="CYm9" r="8" fill="#8bc34a"/><circle cx="CX" cy="CYm16" r="9" fill="#9ccc65"/><circle cx="CXm5" cy="CYm3" r="6" fill="#7cb342"/><circle cx="CXp5" cy="CYm3" r="6" fill="#8bc34a"/>',
    'ฟักเขียว': '<ellipse cx="CX" cy="CYp2" rx="26" ry="15" fill="#2e7d32" stroke="#1b5e20" stroke-width="2"/><ellipse cx="CXm8" cy="CYm3" rx="7" ry="3" fill="#4caf50" opacity="0.5"/>',
    'กล้วย': '<path d="M CXm18,CYm10 Q CXm12,CYp16 CXp10,CYp14 Q CXp22,CYp10 CXp19,CYm10 Q CXp14,CYp4 CXp4,CYp6 Q CXm10,CYp8 CXm18,CYm10 Z" fill="#ffd54f" stroke="#c8920f" stroke-width="2"/><path d="M CXp19,CYm10 l 2,-5" stroke="#7d5a1e" stroke-width="3" stroke-linecap="round"/>',
    'ส้ม': '<circle cx="CX" cy="CYp2" r="20" fill="#ff9800" stroke="#c66900" stroke-width="2"/><circle cx="CX" cy="CYp2" r="20" fill="none" stroke="#ffcc80" stroke-width="1" opacity="0.6"/><ellipse cx="CXp3" cy="CYm17" rx="6" ry="3" fill="#4caf50"/>',
    'แอปเปิล': '<path d="M CX,CYm8 Q CXm18,CYm12 CXm16,CYp4 Q CXm14,CYp20 CX,CYp18 Q CXp14,CYp20 CXp16,CYp4 Q CXp18,CYm12 CX,CYm8" fill="#e53935" stroke="#a31515" stroke-width="2"/><rect x="CXm1" y="CYm16" width="3" height="9" fill="#795548"/><ellipse cx="CXp7" cy="CYm13" rx="6" ry="3" fill="#4caf50"/>',
    'องุ่น': '<g fill="#7e3ff2" stroke="#4a1f9e" stroke-width="1"><circle cx="CXm10" cy="CYm4" r="6"/><circle cx="CX" cy="CYm6" r="6"/><circle cx="CXp10" cy="CYm4" r="6"/><circle cx="CXm5" cy="CYp5" r="6"/><circle cx="CXp5" cy="CYp5" r="6"/><circle cx="CX" cy="CYp14" r="6"/></g><path d="M CX,CYm10 l 0,-6" stroke="#6b8e23" stroke-width="2"/>'
  };
  function produceSVG(name, cx, cy) {
    var raw = PRODUCE_[name] || '<circle cx="CX" cy="CY" r="20" fill="#bdbdbd" stroke="#757575" stroke-width="2"/>';
    return raw.replace(/CXm(\d+)/g, function (_, n) { return (cx - +n); }).replace(/CXp(\d+)/g, function (_, n) { return (cx + +n); })
      .replace(/CYm(\d+)/g, function (_, n) { return (cy - +n); }).replace(/CYp(\d+)/g, function (_, n) { return (cy + +n); })
      .replace(/CX/g, cx).replace(/CY/g, cy);
  }
  function scaleDial(name, w, showNeedle) {
    function f(n) { return Math.round(n * 10) / 10; }
    var cx = 75, cyD = 138, R = 52;
    function pt(deg, r) { var a = deg * Math.PI / 180; return [cx + r * Math.sin(a), cyD - r * Math.cos(a)]; }
    var s = produceSVG(name, cx, 36);
    s += '<ellipse cx="' + cx + '" cy="64" rx="46" ry="6" fill="#d7d7e3" stroke="#6b6b80" stroke-width="2"/><rect x="' + (cx - 4) + '" y="64" width="8" height="16" fill="#b9b9cc" stroke="#6b6b80" stroke-width="1.5"/>';
    s += '<path d="M ' + (cx - 34) + ',' + (cyD + R - 10) + ' L ' + (cx + 34) + ',' + (cyD + R - 10) + ' L ' + (cx + 40) + ',' + (cyD + R + 14) + ' L ' + (cx - 40) + ',' + (cyD + R + 14) + ' Z" fill="#9575cd" stroke="#5e35b1" stroke-width="2"/>';
    s += '<circle cx="' + cx + '" cy="' + cyD + '" r="' + R + '" fill="#fff" stroke="#3a3a4a" stroke-width="2.5"/>';
    for (var d = 0; d < 60; d++) { var mj = (d % 10 === 0), p1 = pt(d * 6, R - (mj ? 12 : 6)), p2 = pt(d * 6, R - 3); s += '<line x1="' + f(p1[0]) + '" y1="' + f(p1[1]) + '" x2="' + f(p2[0]) + '" y2="' + f(p2[1]) + '" stroke="#3a3a4a" stroke-width="' + (mj ? 2 : 1) + '"/>'; }
    for (var k = 0; k < 6; k++) { var pn = pt(k * 60, R - 22); s += '<text x="' + f(pn[0]) + '" y="' + f(pn[1] + 5) + '" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#2a2a38">' + k + '</text>'; }
    s += '<text x="' + cx + '" y="' + f(cyD - R * 0.42) + '" font-size="7" font-family="Arial" text-anchor="middle" fill="#888">KILOG</text>';
    if (showNeedle) { var np = pt(w * 6, R - 16), tl = pt(w * 6 + 180, 9); s += '<line x1="' + f(tl[0]) + '" y1="' + f(tl[1]) + '" x2="' + f(np[0]) + '" y2="' + f(np[1]) + '" stroke="#c0392b" stroke-width="2.4"/>'; }
    s += '<circle cx="' + cx + '" cy="' + cyD + '" r="4" fill="' + (showNeedle ? '#c0392b' : '#777') + '"/>';
    return '<svg viewBox="0 0 150 210" class="scale-svg">' + s + '</svg>';
  }
  var GEN = {
    arith: function (c) {
      var out = [], D = { easy: [1, 20, 10], medium: [5, 99, 12], hard: [20, 999, 25] }[c.level];
      var addR = c.addRange || [D[0], D[1]], mulM = c.mulMax || D[2];
      var ops = (c.ops && c.ops.length) ? c.ops : ['+'];
      var carry = c.carry || 'any'; // no=ไม่ทด/ไม่ยืม, yes=มีทด/มียืม, any=คละ
      function dig(n) { var a = []; n = Math.abs(n); if (n === 0) return [0]; while (n > 0) { a.push(n % 10); n = Math.floor(n / 10); } return a; }
      function addCarry(a, b) { var x = dig(a), y = dig(b), m = Math.max(x.length, y.length); for (var i = 0; i < m; i++) { if ((x[i] || 0) + (y[i] || 0) >= 10) return true; } return false; }
      function subBorrow(a, b) { var x = dig(a), y = dig(b); for (var i = 0; i < x.length; i++) { if ((x[i] || 0) < (y[i] || 0)) return true; } return false; }
      function okAdd(a, b) { return carry === 'any' || (carry === 'yes') === addCarry(a, b); }
      function okSub(a, b) { return carry === 'any' || (carry === 'yes') === subBorrow(a, b); }
      for (var i = 0; i < c.count; i++) {
        var op = pick(ops), a, b, ans, sym, t;
        if (op === '-') {
          a = ri(addR[0], addR[1]); b = ri(addR[0], a);
          for (t = 0; t < 60 && !okSub(a, b); t++) { a = ri(addR[0], addR[1]); b = ri(addR[0], a); }
          ans = a - b; sym = '\u2212';
        } else if (op === 'x' || op === 'X' || op === '*' || op === '\u00d7') {
          a = ri(2, mulM); b = ri(2, mulM); ans = a * b; sym = '\u00d7';
        } else if (op === '/' || op === '\u00f7') {
          b = ri(2, mulM); ans = ri(2, mulM); a = b * ans; sym = '\u00f7';
        } else {
          a = ri(addR[0], addR[1]); b = ri(addR[0], addR[1]);
          for (t = 0; t < 60 && !okAdd(a, b); t++) { a = ri(addR[0], addR[1]); b = ri(addR[0], addR[1]); }
          ans = a + b; sym = '+';
        }
        out.push({ q: a + ' ' + sym + ' ' + b + ' =', a: String(ans), n: ans, meta: { t: 'arith', a: a, b: b, op: sym, ans: ans } });
      }
      return out;
    },
    percent: function (c) {
      var P = { easy: [10, 25, 50], medium: [5, 15, 20, 30, 40], hard: [12, 18, 35, 65, 85] };
      var B = { easy: [20, 40, 60, 80, 100], medium: [80, 120, 150, 200], hard: [150, 260, 320, 480] };
      var out = [];
      for (var i = 0; i < c.count; i++) { var p = pick(P[c.level]), b = pick(B[c.level]); var v = Math.round(p / 100 * b * 100) / 100; out.push({ q: p + '% ของ ' + b + ' เท่ากับเท่าใด', a: String(v), n: v, meta: { t: 'percent', p: p, b: b, v: v } }); }
      return out;
    },
    measure: function (c) {
      var u = [{ q: 'เมตร', to: 'ซม.', f: 100 }, { q: 'กก.', to: 'กรัม', f: 1000 }, { q: 'กม.', to: 'เมตร', f: 1000 }, { q: 'ลิตร', to: 'มล.', f: 1000 }];
      var N = c.range || ({ easy: [1, 9], medium: [2, 25], hard: [5, 99] }[c.level]); var out = [];
      for (var i = 0; i < c.count; i++) { var x = pick(u), n = ri(N[0], N[1]); out.push({ q: n + ' ' + x.q + ' = _____ ' + x.to, a: (n * x.f) + ' ' + x.to, n: n * x.f, meta: { t: 'measure', n: n, unit: x.q, to: x.to, f: x.f, ans: n * x.f } }); }
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
      for (var i = 0; i < c.count; i++) { var a = ri(R[0], R[1]), x = ri(R[2], R[3]), b = ri(R[2] < 0 ? -12 : 1, 12), cc = a * x + b; out.push({ q: a + 'x ' + (b < 0 ? '\u2212 ' + (-b) : '+ ' + b) + ' = ' + cc, a: 'x = ' + x, n: x, meta: { t: 'equation', a: a, b: b, c: cc, x: x } }); }
      return out;
    },
    word: function (c) {
      var style = c.wstyle || 'full';   // full | compact | plain | mix
      var R = c.range || ({ easy: [2, 12], medium: [5, 40], hard: [10, 100] }[c.level]) || [2, 12];
      var lo = R[0], hi = R[1], mid = Math.max(lo + 1, Math.floor(hi / 2));
      var NAMES = ['พ่อ', 'แม่', 'พลอย', 'ขุน', 'แก้วตา', 'ใบบัว', 'มะลิ', 'ก้อง', 'ดาว', 'น้องฟ้า', 'พี่บาส', 'ปิติ', 'มานี', 'ชูใจ', 'สมศรี', 'ครูแอน', 'คุณยาย', 'น้องแพรว'];
      function nm() { return pick(NAMES); }
      function two() { var x = nm(), y = nm(), g = 0; while (y === x && g++ < 20) y = nm(); return [x, y]; }
      function rn() { return ri(lo, hi); }
      function subPair() { var a = ri(mid, hi), b = ri(lo, a - 1); return [a, b]; } // a>b
      var BL = '<span class="wp-bl"></span>';
      var T = [
        function () { var it = pick(['มะนาว', 'ส้ม', 'มะม่วง', 'ฝรั่ง']), u = 'ผล', n = nm(), a = rn(), b = rn(); return { story: 'ตอนเช้า' + n + 'เก็บ' + it + 'ได้ ' + a + ' ' + u + ' ตอนเย็นเก็บ' + it + 'ได้ ' + b + ' ' + u + ' ' + n + 'เก็บ' + it + 'ได้ทั้งหมดกี่' + u, ask: n + 'เก็บ' + it + 'ได้ทั้งหมดกี่' + u, givens: ['ตอนเช้า' + n + 'เก็บ' + it + 'ได้ ' + BL + ' ' + u, 'ตอนเย็นเก็บ' + it + 'ได้ ' + BL + ' ' + u], sym: a + ' + ' + b, ans: a + b, ansS: n + 'เก็บ' + it + 'ได้ทั้งหมด ' + BL + ' ' + u, unit: u }; },
        function () { var p = pick([['ดินสอ', 'แท่ง'], ['สมุด', 'เล่ม'], ['หนังสือ', 'เล่ม'], ['ไม้บรรทัด', 'อัน']]), it = p[0], u = p[1], n = nm(), a = rn(), b = rn(); return { story: n + 'มี' + it + ' ' + a + ' ' + u + ' แล้วซื้อ' + it + 'เพิ่มอีก ' + b + ' ' + u + ' ' + n + 'มี' + it + 'ทั้งหมดกี่' + u, ask: n + 'มี' + it + 'ทั้งหมดกี่' + u, givens: [n + 'มี' + it + ' ' + BL + ' ' + u, 'ซื้อ' + it + 'เพิ่มอีก ' + BL + ' ' + u], sym: a + ' + ' + b, ans: a + b, ansS: n + 'มี' + it + 'ทั้งหมด ' + BL + ' ' + u, unit: u }; },
        function () { var p = pick([['ดอกไม้', 'ดอก'], ['ลูกแก้ว', 'ลูก'], ['สติกเกอร์', 'ดวง']]), it = p[0], u = p[1], t = two(), a = rn(), b = rn(); return { story: t[0] + 'มี' + it + ' ' + a + ' ' + u + ' ' + t[1] + 'มี' + it + ' ' + b + ' ' + u + ' ทั้งสองคนมี' + it + 'รวมกันกี่' + u, ask: t[0] + 'และ' + t[1] + 'มี' + it + 'รวมกันกี่' + u, givens: [t[0] + 'มี' + it + ' ' + BL + ' ' + u, t[1] + 'มี' + it + ' ' + BL + ' ' + u], sym: a + ' + ' + b, ans: a + b, ansS: t[0] + 'และ' + t[1] + 'มี' + it + 'รวมกัน ' + BL + ' ' + u, unit: u }; },
        function () { var n = nm(), s = subPair(), a = s[0], b = s[1]; return { story: n + 'มีกระถาง ' + a + ' ใบ ใช้ปลูกพริก ' + b + ' ใบ ' + n + 'เหลือกระถางกี่ใบ', ask: n + 'เหลือกระถางกี่ใบ', givens: [n + 'มีกระถาง ' + BL + ' ใบ', 'ใช้ปลูกพริก ' + BL + ' ใบ'], sym: a + ' \u2212 ' + b, ans: a - b, ansS: n + 'เหลือกระถาง ' + BL + ' ใบ', unit: 'ใบ' }; },
        function () { var p = pick([['ลูกอม', 'เม็ด'], ['ขนม', 'ชิ้น'], ['ส้ม', 'ผล']]), it = p[0], u = p[1], n = nm(), s = subPair(), a = s[0], b = s[1]; return { story: n + 'มี' + it + ' ' + a + ' ' + u + ' แบ่งให้เพื่อนไป ' + b + ' ' + u + ' ' + n + 'เหลือ' + it + 'กี่' + u, ask: n + 'เหลือ' + it + 'กี่' + u, givens: [n + 'มี' + it + ' ' + BL + ' ' + u, 'แบ่งให้เพื่อนไป ' + BL + ' ' + u], sym: a + ' \u2212 ' + b, ans: a - b, ansS: n + 'เหลือ' + it + ' ' + BL + ' ' + u, unit: u }; },
        function () { var n = nm(), s = subPair(), a = s[0], b = s[1]; return { story: n + 'มีเงิน ' + a + ' บาท ซื้อขนมไป ' + b + ' บาท ' + n + 'เหลือเงินกี่บาท', ask: n + 'เหลือเงินกี่บาท', givens: [n + 'มีเงิน ' + BL + ' บาท', 'ซื้อขนมไป ' + BL + ' บาท'], sym: a + ' \u2212 ' + b, ans: a - b, ansS: n + 'เหลือเงิน ' + BL + ' บาท', unit: 'บาท' }; },
        function () { var p = pick([['ลูกโป่ง', 'ลูก'], ['ดอกไม้', 'ดอก'], ['ลูกอม', 'เม็ด']]), it = p[0], u = p[1], n = nm(), cc = ri(mid, hi), b = ri(lo, cc - 1), ansv = cc - b; return { story: n + 'มี' + it + 'สีแดงและสีฟ้ารวมกัน ' + cc + ' ' + u + ' เป็น' + it + 'สีแดงกี่' + u + ' ถ้าเป็น' + it + 'สีฟ้า ' + b + ' ' + u, ask: 'เป็น' + it + 'สีแดงกี่' + u, givens: [it + 'สีแดงและสีฟ้ารวมกัน ' + BL + ' ' + u, 'เป็น' + it + 'สีฟ้า ' + BL + ' ' + u], sym: cc + ' \u2212 ' + b, ans: ansv, ansS: 'เป็น' + it + 'สีแดง ' + BL + ' ' + u, unit: u }; },
        function () { var p = pick([['ขนมเปียกปูน', 'ชิ้น'], ['ดอกบัว', 'ดอก'], ['ข้าวต้มมัด', 'ห่อ']]), it = p[0], u = p[1], n = nm(), b = ri(lo, mid), cc = ri(lo, mid), ansv = b + cc; return { story: n + 'มี' + it + 'กี่' + u + ' ใส่บาตรไป ' + b + ' ' + u + ' แล้วเหลืออยู่ ' + cc + ' ' + u, ask: n + 'มี' + it + 'กี่' + u, givens: ['ใส่บาตรไป ' + BL + ' ' + u, 'เหลืออยู่ ' + BL + ' ' + u], sym: BL + ' \u2212 ' + b + ' = ' + cc, ans: ansv, ansS: n + 'มี' + it + ' ' + BL + ' ' + u, unit: u, symKey: ansv + ' \u2212 ' + b + ' = ' + cc }; },
        function () { var p = pick([['ลูกอม', 'เม็ด'], ['สติกเกอร์', 'ดวง'], ['ขนม', 'ชิ้น']]), it = p[0], u = p[1], n = nm(), a = ri(mid, hi), cc = ri(lo, a - 1), ansv = a - cc; return { story: n + 'มี' + it + ' ' + a + ' ' + u + ' ให้เพื่อนไปแล้วเหลือ' + it + ' ' + cc + ' ' + u + ' ' + n + 'ให้' + it + 'เพื่อนไปกี่' + u, ask: n + 'ให้' + it + 'เพื่อนไปกี่' + u, givens: [n + 'มี' + it + ' ' + BL + ' ' + u, 'เหลือ' + it + ' ' + BL + ' ' + u], sym: a + ' \u2212 ' + BL + ' = ' + cc, ans: ansv, ansS: n + 'ให้' + it + 'เพื่อนไป ' + BL + ' ' + u, unit: u, symKey: a + ' \u2212 ' + ansv + ' = ' + cc }; },
        function () { var p = pick([['ปลา', 'ตัว'], ['สติกเกอร์', 'ดวง'], ['หนังสือ', 'เล่ม']]), it = p[0], u = p[1], t = two(), s = subPair(), a = s[0], b = s[1]; return { story: t[0] + 'มี' + it + ' ' + a + ' ' + u + ' ' + t[1] + 'มี' + it + ' ' + b + ' ' + u + ' ' + t[0] + 'มี' + it + 'มากกว่า' + t[1] + 'กี่' + u, ask: t[0] + 'มี' + it + 'มากกว่า' + t[1] + 'กี่' + u, givens: [t[0] + 'มี' + it + ' ' + BL + ' ' + u, t[1] + 'มี' + it + ' ' + BL + ' ' + u], sym: a + ' \u2212 ' + b, ans: a - b, ansS: t[0] + 'มี' + it + 'มากกว่า' + t[1] + ' ' + BL + ' ' + u, unit: u }; },
        function () { var p = pick([['ดอกไม้', 'ดอก'], ['ไข่', 'ฟอง'], ['ส้ม', 'ผล']]), it = p[0], u = p[1], n = nm(), a = rn(), b = rn(); return { story: n + 'มี' + it + ' ' + a + ' ' + u + ' ได้รับ' + it + 'เพิ่มอีก ' + b + ' ' + u + ' ' + n + 'มี' + it + 'รวมกี่' + u, ask: n + 'มี' + it + 'รวมกี่' + u, givens: [n + 'มี' + it + ' ' + BL + ' ' + u, 'ได้รับเพิ่มอีก ' + BL + ' ' + u], sym: a + ' + ' + b, ans: a + b, ansS: n + 'มี' + it + 'รวม ' + BL + ' ' + u, unit: u }; }
      ];
      function render(d, st) {
        var symKey = (d.symKey || (d.sym + ' = ' + d.ans));
        var head = '<div class="wp-story">' + d.story + '</div>';
        var symRow = '<div class="wp-r"><span class="wp-lb">ประโยคสัญลักษณ์</span><span class="wp-line"></span></div>';
        var ansRow = '<div class="wp-r"><span class="wp-lb wp-ans">ตอบ</span><span class="wp-tx">' + d.ansS + '</span></div>';
        var inner;
        if (st === 'full') {
          var gv = d.givens.map(function (g) { return '<div class="wp-gv">' + g + '</div>'; }).join('');
          inner = head +
            '<div class="wp-r"><span class="wp-lb">โจทย์ถาม</span><span class="wp-tx">' + d.ask + '</span></div>' +
            '<div class="wp-r"><span class="wp-lb">โจทย์บอก</span><span class="wp-tx">' + gv + '</span></div>' +
            symRow + ansRow;
        } else if (st === 'compact') {
          inner = head + symRow + ansRow;
        } else {
          inner = head + ansRow;
        }
        return { html: '<div class="wp wp-' + st + '">' + inner + '</div>', a: symKey + '  \u2192  ตอบ ' + d.ans + ' ' + d.unit };
      }
      var per = { full: 3, compact: 4, plain: 6 };
      var out = [];
      for (var i = 0; i < c.count; i++) {
        var st = style === 'mix' ? pick(['full', 'compact']) : style;
        var d = T[ri(0, T.length - 1)]();
        var r = render(d, st);
        out.push({ q: r.html, a: r.a, noline: true, wp: true, grid: true, tall: true, per: (style === 'mix' ? 3 : per[st]) });
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
        out.push({ q: q, a: String(ans), n: ans, noline: true, tall: true });
      }
      return out;
    },
    count: function (c) {
      var POOL = (c.pics && c.pics.length) ? c.pics : ['\ud83c\udf4e', '\u2b50', '\ud83c\udf88', '\ud83d\udc1f', '\ud83c\udf38', '\ud83e\udd55', '\ud83c\udf6d', '\u270f\ufe0f', '\ud83d\udcd8', '\ud83d\udc31', '\ud83c\udf53', '\u26bd', '\ud83c\udf4c', '\ud83c\udf1f', '\ud83c\udf80', '\ud83d\udc36'];
      var max = Math.min(20, c.count); // นับจำนวนจำกัด 20 ข้อ
      function rep(s, n) { var o = ''; for (var k = 0; k < n; k++) o += s; return o; }
      var out = [];
      for (var i = 0; i < max; i++) {
        var em = pick(POOL), n = ri(0, 5), opts = '';
        for (var o = 0; o <= 5; o++) opts += '<span class="copt">' + o + '</span>';
        var q = '<span class="countbox"><span class="countpics">' + rep(em, n) + '</span><span class="countopts">' + opts + '</span></span>';
        out.push({ q: q, a: String(n), n: n, noline: true, tall: true });
      }
      return out;
    },
    count9: function (c) {
      var POOL = (c.pics && c.pics.length) ? c.pics : ['\ud83c\udf4e', '\u2b50', '\ud83c\udf88', '\ud83d\udc1f', '\ud83c\udf38', '\ud83e\udd55', '\ud83c\udf6d', '\u270f\ufe0f', '\ud83d\udcd8', '\ud83d\udc31', '\ud83c\udf53', '\u26bd', '\ud83c\udf4c', '\ud83c\udf1f', '\ud83c\udf80', '\ud83d\udc36'];
      var max = Math.min(20, c.count);
      function rep(s, n) { var o = ''; for (var k = 0; k < n; k++) o += s; return o; }
      var out = [];
      for (var i = 0; i < max; i++) {
        var em = pick(POOL), n = ri(6, 9), q;
        if (ri(0, 1) === 0) { // แบบวงเลือก 6–9
          var opts = '';
          for (var o = 6; o <= 9; o++) opts += '<span class="copt">' + o + '</span>';
          q = '<span class="countbox"><span class="countpics">' + rep(em, n) + '</span><span class="countopts">' + opts + '</span></span>';
        } else { // แบบนับแล้วเขียนจำนวนลงกล่อง
          q = '<span class="countbox"><span class="countpics">' + rep(em, n) + '</span><span class="countans"><span class="cbox"></span></span></span>';
        }
        out.push({ q: q, a: String(n), n: n, noline: true, tall: true });
      }
      return out;
    },
    compare: function (c) {
      var R = c.range || ({ easy: [1, 20], medium: [10, 100], hard: [100, 1000] }[c.level]) || [1, 20];
      var max = Math.min(50, c.count);
      var out = [];
      for (var i = 0; i < max; i++) {
        var a = ri(R[0], R[1]), b = ri(R[0], R[1]);
        if (ri(0, 5) === 0) b = a; // บางข้อให้เท่ากัน
        var sym = a > b ? '>' : (a < b ? '<' : '=');
        var q = '<span class="cmpwrap"><span class="cmpnum">' + a + '</span><span class="cmpbox"></span><span class="cmpnum">' + b + '</span></span>';
        out.push({ q: q, a: sym, n: (a > b ? 1 : (a < b ? -1 : 0)), noline: true });
      }
      return out;
    },
    numwrite: function (c) {
      var R = c.range || [21, 100];
      var max = Math.min(20, c.count);
      var COLORS = { orange: ['#f3c896', '#e0a86b', '#b07a4a'], blue: ['#bcd8f5', '#7fb2e8', '#4a7fc0'], green: ['#c4e8b8', '#8fd178', '#4f9e3f'], pink: ['#f6c2d4', '#ec90b0', '#c85f86'], purple: ['#d8c6f0', '#b794e0', '#8a5fc0'], yellow: ['#f7e7a0', '#ecd45f', '#c8a925'] };
      var CKEYS = ['orange', 'blue', 'green', 'pink', 'purple', 'yellow'];
      var colMode = c.color || 'orange';
      var TD = '\u0e50\u0e51\u0e52\u0e53\u0e54\u0e55\u0e56\u0e57\u0e58\u0e59';
      function thaiNum(n) { return String(n).split('').map(function (ch) { return TD[+ch]; }).join(''); }
      var ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
      var tens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
      function thaiWord(n) {
        if (n === 0) return 'ศูนย์';
        if (n === 1000) return 'หนึ่งพัน';
        var h = Math.floor(n / 100), r = n % 100, t = Math.floor(r / 10), u = r % 10, s = '';
        if (h > 0) s += ones[h] + 'ร้อย';
        if (t > 0) s += tens[t];
        if (u > 0) s += (u === 1 && (t > 0 || h > 0)) ? 'เอ็ด' : ones[u];
        return s;
      }
      function blocks(n) {
        var key = colMode === 'mix' ? CKEYS[Math.floor(Math.random() * CKEYS.length)] : (COLORS[colMode] ? colMode : 'orange');
        var cc = COLORS[key];
        var sty = '--bl:' + cc[0] + ';--bd:' + cc[1] + ';--bb:' + cc[2];
        var cls = (R[1] > 200) ? 'blocks bk-sm' : 'blocks';
        var h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10, flats = '', rods = '', cubes = '', i;
        for (i = 0; i < h; i++) flats += '<span class="b-flat"></span>';
        for (i = 0; i < t; i++) rods += '<span class="b-rod"></span>';
        for (i = 0; i < u; i++) cubes += '<span class="b-cube"></span>';
        return '<span class="' + cls + '" style="' + sty + '">' + flats + rods + (u ? '<span class="b-units">' + cubes + '</span>' : '') + '</span>';
      }
      var out = [];
      for (var i = 0; i < max; i++) {
        var n = ri(R[0], R[1]);
        out.push({ q: blocks(n), a: n + ' / ' + thaiNum(n) + ' / ' + thaiWord(n), n: n, numtable: true });
      }
      return out;
    },
    order: function (c) {
      var R = c.range || ({ easy: [1, 20], medium: [10, 50], hard: [20, 100] }[c.level]) || [1, 20];
      var dir = c.dir || 'asc';
      var K = Math.max(3, Math.min(6, c.k || 4)), max = Math.min(50, c.count);
      function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
      var out = [];
      for (var i = 0; i < max; i++) {
        var d = dir === 'mix' ? (ri(0, 1) ? 'asc' : 'desc') : dir;
        var set = {}, nums = [], guard = 0;
        while (nums.length < K && guard++ < 300) { var v = ri(R[0], R[1]); if (!set[v]) { set[v] = 1; nums.push(v); } }
        var given = shuffle(nums.slice());
        var sorted = nums.slice().sort(function (a, b) { return a - b; });
        if (d === 'desc') sorted.reverse();
        var label = d === 'asc' ? 'น้อย→มาก' : 'มาก→น้อย';
        var boxes = ''; for (var b = 0; b < nums.length; b++) boxes += '<span class="ordbox"></span>';
        var q = '<span class="ordwrap"><span class="ordnums">' + given.join('&nbsp;&nbsp;') + '</span><span class="ordlbl">' + label + '</span><span class="ordboxes">' + boxes + '</span></span>';
        out.push({ q: q, a: sorted.join(', '), n: sorted[0], noline: true, ord: true });
      }
      return out;
    },
    time: function (c) {
      var mode = c.mode || 'line'; // line | box | tell
      var max = Math.min(20, c.count);
      function pad(x) { return x < 10 ? '0' + x : '' + x; }
      function clockSVG(h, m) {
        var cx = 50, cy = 50, nums = '', ticks = '', i, a, k, ta, inR;
        for (k = 0; k < 60; k++) {
          ta = k * 6 * Math.PI / 180; inR = (k % 5 === 0) ? 41 : 44.5;
          ticks += '<line x1="' + (cx + Math.sin(ta) * 47).toFixed(1) + '" y1="' + (cy - Math.cos(ta) * 47).toFixed(1) + '" x2="' + (cx + Math.sin(ta) * inR).toFixed(1) + '" y2="' + (cy - Math.cos(ta) * inR).toFixed(1) + '" stroke="#2b2f3a" stroke-width="' + (k % 5 === 0 ? '1.5' : '0.6') + '"/>';
        }
        for (i = 1; i <= 12; i++) {
          a = i * 30 * Math.PI / 180;
          nums += '<text x="' + (cx + Math.sin(a) * 34).toFixed(1) + '" y="' + (cy - Math.cos(a) * 34 + 3).toFixed(1) + '" font-size="8" text-anchor="middle" font-family="Arial" font-weight="700" fill="#2b2f3a">' + i + '</text>';
        }
        var ha = ((h % 12) * 30 + m * 0.5) * Math.PI / 180, ma = (m * 6) * Math.PI / 180;
        return '<svg class="clock" viewBox="0 0 100 100">' +
          '<circle cx="50" cy="50" r="47" fill="#fff" stroke="#2b2f3a" stroke-width="2.5"/>' + ticks + nums +
          '<line x1="50" y1="50" x2="' + (cx + Math.sin(ha) * 22).toFixed(1) + '" y2="' + (cy - Math.cos(ha) * 22).toFixed(1) + '" stroke="#2b2f3a" stroke-width="3.5" stroke-linecap="round"/>' +
          '<line x1="50" y1="50" x2="' + (cx + Math.sin(ma) * 32).toFixed(1) + '" y2="' + (cy - Math.cos(ma) * 32).toFixed(1) + '" stroke="#3b82f6" stroke-width="2.3" stroke-linecap="round"/>' +
          '<circle cx="50" cy="50" r="3" fill="#2b2f3a"/></svg>';
      }
      var out = [];
      for (var i = 0; i < max; i++) {
        var step = c.step || 5;
        var h = ri(1, 12), m = step === 30 ? ri(0, 1) * 30 : (step === 1 ? ri(0, 59) : ri(0, 11) * 5);
        var nightH = (h === 12) ? 24 : h + 12;
        var day = pad(h) + ':' + pad(m), night = (nightH === 24 ? '24' : pad(nightH)) + ':' + pad(m);
        var ans, body;
        if (mode === 'tell') {
          ans = day;
          body = '<span class="cl-row"><span class="cl-lbl">เวลา</span><span class="cl-line"></span></span>';
        } else if (mode === 'box') {
          ans = 'กลางวัน ' + day + ' / กลางคืน ' + night;
          body = '<span class="cl-row"><span class="cl-ic">\u2600\ufe0f</span><span class="cl-box"></span></span><span class="cl-row"><span class="cl-ic">\ud83c\udf19</span><span class="cl-box"></span></span>';
        } else {
          ans = 'กลางวัน ' + day + ' / กลางคืน ' + night;
          body = '<span class="cl-row"><span class="cl-lbl">กลางวัน</span><span class="cl-line"></span></span><span class="cl-row"><span class="cl-lbl">กลางคืน</span><span class="cl-line"></span></span>';
        }
        out.push({ q: '<span class="clockwrap">' + clockSVG(h, m) + '<span class="clockans">' + body + '</span></span>', a: ans, n: h, noline: true, clock: true });
      }
      return out;
    },
    geometry: function (c) {
      var dim = c.dim || '2d', W = 600, n = Math.max(6, Math.min(10, c.count || 10));
      function R(a, b) { return a + Math.random() * (b - a); }
      function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
      function f(x) { return x.toFixed(1); }
      function s2d(t, s) {
        if (t === 'rect') {
          var w, h;
          if (Math.random() < 0.42) { w = h = s * R(1.0, 1.4); }           // จัตุรัส
          else { w = s * R(1.3, 2.1); h = s * R(0.55, 0.9); }              // ผืนผ้า
          return '<rect x="' + f(-w / 2) + '" y="' + f(-h / 2) + '" width="' + f(w) + '" height="' + f(h) + '" fill="#fff" stroke="#111" stroke-width="2.2"/>';
        }
        if (t === 'tri') {
          var ax = R(-0.45, 0.45) * s, ay = -s * R(0.85, 1.1);
          return '<polygon points="' + f(ax) + ',' + f(ay) + ' ' + f(s * R(0.7, 1.05)) + ',' + f(s * R(0.6, 0.95)) + ' ' + f(-s * R(0.7, 1.05)) + ',' + f(s * R(0.6, 0.95)) + '" fill="#fff" stroke="#111" stroke-width="2.2"/>';
        }
        if (t === 'ellipse') { return '<ellipse rx="' + f(s * R(1.05, 1.4)) + '" ry="' + f(s * R(0.6, 0.85)) + '" fill="#fff" stroke="#111" stroke-width="2.2"/>'; }
        return '<circle r="' + f(s * R(0.85, 1.05)) + '" fill="#fff" stroke="#111" stroke-width="2.2"/>';
      }
      function s3d(t, s) {
        var st = 'fill="#fff" stroke="#111" stroke-width="2"';
        if (t === 'cuboid') {
          var w = s * R(1.0, 1.7), h = s * R(0.85, 1.5), d = s * R(0.4, 0.62);
          return '<polygon points="' + f(-w / 2) + ',' + f(-h / 2) + ' ' + f(-w / 2 + d) + ',' + f(-h / 2 - d) + ' ' + f(w / 2 + d) + ',' + f(-h / 2 - d) + ' ' + f(w / 2) + ',' + f(-h / 2) + '" ' + st + '/>' +
            '<polygon points="' + f(w / 2) + ',' + f(-h / 2) + ' ' + f(w / 2 + d) + ',' + f(-h / 2 - d) + ' ' + f(w / 2 + d) + ',' + f(h / 2 - d) + ' ' + f(w / 2) + ',' + f(h / 2) + '" ' + st + '/>' +
            '<rect x="' + f(-w / 2) + '" y="' + f(-h / 2) + '" width="' + f(w) + '" height="' + f(h) + '" ' + st + '/>';
        }
        if (t === 'sphere') { return '<circle r="' + f(s * R(0.9, 1.05)) + '" ' + st + '/><ellipse rx="' + f(s) + '" ry="' + f(s * 0.32) + '" fill="none" stroke="#111" stroke-width="1.4"/>'; }
        if (t === 'cylinder') {
          var rw = s * R(0.7, 1.05), hh = s * R(1.2, 2.0), ry = rw * 0.28;
          return '<path d="M' + f(-rw) + ',' + f(-hh / 2) + ' L' + f(-rw) + ',' + f(hh / 2) + ' A' + f(rw) + ',' + f(ry) + ' 0 0 0 ' + f(rw) + ',' + f(hh / 2) + ' L' + f(rw) + ',' + f(-hh / 2) + '" ' + st + '/>' +
            '<ellipse cy="' + f(-hh / 2) + '" rx="' + f(rw) + '" ry="' + f(ry) + '" ' + st + '/>';
        }
        var cw = s * R(0.85, 1.2), chh = s * R(1.3, 2.0), cry = cw * 0.28;
        return '<path d="M0,' + f(-chh / 2) + ' L' + f(-cw) + ',' + f(chh / 2) + ' A' + f(cw) + ',' + f(cry) + ' 0 0 0 ' + f(cw) + ',' + f(chh / 2) + ' Z" ' + st + '/>' +
          '<path d="M' + f(-cw) + ',' + f(chh / 2) + ' A' + f(cw) + ',' + f(cry) + ' 0 0 1 ' + f(cw) + ',' + f(chh / 2) + '" fill="none" stroke="#111" stroke-width="1.4" stroke-dasharray="3,3"/>';
      }
      function rotOf(t) {
        if (dim === '2d') return (t === 'rect' || t === 'tri') ? R(0, 360) : (t === 'ellipse' ? R(0, 180) : 0);
        if (t === 'cuboid') return R(-14, 14);
        if (t === 'cylinder') return pick([0, 0, 90, -90]);
        if (t === 'cone') return pick([0, 0, 90, -90, 180]);
        return 0;
      }
      var types = dim === '3d' ? ['cuboid', 'sphere', 'cylinder', 'cone'] : ['rect', 'tri', 'circle', 'ellipse'];
      var tally = {}; types.forEach(function (t) { tally[t] = 0; });
      var cols = n < 4 ? n : 4, rows = Math.ceil(n / cols), cw = W / cols, chh = 150, H = rows * chh, svg = '';
      for (var i = 0; i < n; i++) {
        var col = i % cols, row = Math.floor(i / cols);
        var cx = col * cw + cw / 2 + R(-cw * 0.08, cw * 0.08), cy = row * chh + chh / 2 + R(-chh * 0.08, chh * 0.08);
        var sz = Math.min(cw, chh) * R(0.28, 0.38);
        var t = types[Math.floor(Math.random() * types.length)]; tally[t]++;
        svg += '<g transform="translate(' + f(cx) + ',' + f(cy) + ') rotate(' + f(rotOf(t)) + ')">' + (dim === '3d' ? s3d(t, sz) : s2d(t, sz)) + '</g>';
      }
      var L = dim === '3d'
        ? [['cuboid', 'ทรงสี่เหลี่ยมมุมฉาก', 'สีแดง'], ['sphere', 'ทรงกลม', 'สีเขียว'], ['cylinder', 'ทรงกระบอก', 'สีฟ้า'], ['cone', 'กรวย', 'สีเหลือง']]
        : [['rect', 'สี่เหลี่ยม', 'สีน้ำเงิน'], ['tri', 'สามเหลี่ยม', 'สีเขียว'], ['ellipse', 'วงรี', 'สีส้ม'], ['circle', 'วงกลม', 'สีชมพู']];
      var chips = L.map(function (x) { return '<span class="geochip">' + x[1] + ' ' + x[2] + '</span>'; }).join('');
      var sum = L.map(function (x) { return '<span>มี' + x[1] + ' <span class="geoblank"></span> รูป</span>'; }).join('');
      var ans = L.map(function (x) { return x[1] + ' ' + tally[x[0]]; }).join(' · ');
      var q = '<div class="geowrap"><div class="geolegend">' + chips + '</div><svg class="geofield" viewBox="0 0 ' + W + ' ' + H + '">' + svg + '</svg><div class="geosum">' + sum + '</div></div>';
      return [{ q: q, a: ans, geo: true, full: true, noline: true, pts: n }];
    },
    measlen: function (c) {
      var maxCm = 13, W = 700, x0 = 46, pad = 18;
      var pxCm = (W - x0 - pad) / maxCm;
      function f(x) { return x.toFixed(1); }
      function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
      var ST = 'fill="#fff" stroke="#111" stroke-width="2"', ST2 = 'fill="none" stroke="#111" stroke-width="1.6"';
      function rrect(x, y, w, h, r) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx="' + r + '" ' + ST + '/>'; }
      var DRAW = {
        pencil: function (x, y, L) { var h = 16, tip = 15, b = L - tip; return rrect(x, y - h / 2, b, h, 2) + '<polygon points="' + f(x + b) + ',' + f(y - h / 2) + ' ' + f(x + L) + ',' + f(y) + ' ' + f(x + b) + ',' + f(y + h / 2) + '" ' + ST + '/>' + '<line x1="' + f(x + 7) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + 7) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.2"/>'; },
        spoon: function (x, y, L) { var bw = 30, hl = L - bw, hh = 8; return rrect(x, y - hh / 2, hl, hh, 4) + '<ellipse cx="' + f(x + hl + bw / 2) + '" cy="' + f(y) + '" rx="' + f(bw / 2) + '" ry="15" ' + ST + '/>'; },
        fork: function (x, y, L) { var hl = L * 0.55, hh = 8, baseX = x + hl, s = ''; s += rrect(x, y - hh / 2, hl, hh, 4); s += rrect(baseX, y - 11, 7, 22, 2); var tx = baseX + 7, tipX = x + L; for (var p = 0; p < 4; p++) { var ty = y - 11 + p * (22 / 3); s += '<line x1="' + f(tx) + '" y1="' + f(ty) + '" x2="' + f(tipX) + '" y2="' + f(ty) + '" stroke="#111" stroke-width="2.6"/>'; } return s; },
        knife: function (x, y, L) { var hl = L * 0.34; return rrect(x, y - 8, hl, 16, 3) + '<polygon points="' + f(x + hl) + ',' + f(y - 7) + ' ' + f(x + L) + ',' + f(y - 1) + ' ' + f(x + L - 4) + ',' + f(y + 9) + ' ' + f(x + hl) + ',' + f(y + 7) + '" ' + ST + '/>'; },
        straw: function (x, y, L) { return rrect(x, y - 7, L, 14, 6) + '<line x1="' + f(x + L * 0.35) + '" y1="' + f(y - 7) + '" x2="' + f(x + L * 0.35) + '" y2="' + f(y + 7) + '" stroke="#111" stroke-width="1.2"/><line x1="' + f(x + L * 0.65) + '" y1="' + f(y - 7) + '" x2="' + f(x + L * 0.65) + '" y2="' + f(y + 7) + '" stroke="#111" stroke-width="1.2"/>'; },
        nail: function (x, y, L) { return rrect(x, y - 9, 8, 18, 1) + rrect(x + 8, y - 3, L - 18, 6, 1) + '<polygon points="' + f(x + L - 10) + ',' + f(y - 3) + ' ' + f(x + L) + ',' + f(y) + ' ' + f(x + L - 10) + ',' + f(y + 3) + '" ' + ST + '/>'; },
        candle: function (x, y, L) { var b = L - 16; return rrect(x, y - 11, b, 22, 3) + '<line x1="' + f(x + b) + '" y1="' + f(y) + '" x2="' + f(x + b + 6) + '" y2="' + f(y) + '" stroke="#111" stroke-width="1.4"/><path d="M' + f(x + b + 6) + ',' + f(y - 10) + ' Q' + f(x + L) + ',' + f(y) + ' ' + f(x + b + 6) + ',' + f(y + 10) + ' Q' + f(x + b + 2) + ',' + f(y) + ' ' + f(x + b + 6) + ',' + f(y - 10) + ' Z" ' + ST + '/>'; },
        crayon: function (x, y, L) { var tip = 12, b = L - tip, h = 16; return rrect(x, y - h / 2, b, h, 2) + '<polygon points="' + f(x + b) + ',' + f(y - h / 2 + 3) + ' ' + f(x + L) + ',' + f(y) + ' ' + f(x + b) + ',' + f(y + h / 2 - 3) + '" ' + ST + '/><line x1="' + f(x + b * 0.4) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + b * 0.4) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.2"/><line x1="' + f(x + b * 0.62) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + b * 0.62) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.2"/>'; },
        marker: function (x, y, L) { var h = 18, capW = L * 0.32, bodyW = L - capW; return rrect(x, y - h / 2, bodyW, h, 4) + rrect(x + bodyW, y - h / 2 - 1.5, capW, h + 3, 4) + '<line x1="' + f(x + bodyW) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + bodyW) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.2"/><circle cx="' + f(x + bodyW + capW - 6) + '" cy="' + f(y) + '" r="2.6" fill="#111"/>'; },
        eraser: function (x, y, L) { var h = 22; return rrect(x, y - h / 2, L, h, 4) + '<line x1="' + f(x + L * 0.56) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + L * 0.46) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.4"/><line x1="' + f(x + L * 0.67) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + L * 0.57) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.4"/>'; },
        leaf: function (x, y, L) { var h = 22; return '<path d="M' + f(x) + ',' + f(y) + ' Q' + f(x + L * 0.5) + ',' + f(y - h) + ' ' + f(x + L) + ',' + f(y) + ' Q' + f(x + L * 0.5) + ',' + f(y + h) + ' ' + f(x) + ',' + f(y) + ' Z" ' + ST + '/><line x1="' + f(x) + '" y1="' + f(y) + '" x2="' + f(x + L) + '" y2="' + f(y) + '" stroke="#111" stroke-width="1.2"/>'; },
        key: function (x, y, L) { var r = 11; return '<circle cx="' + f(x + r) + '" cy="' + f(y) + '" r="' + r + '" fill="none" stroke="#111" stroke-width="3"/>' + rrect(x + 2 * r, y - 3, L - 2 * r, 6, 1) + '<rect x="' + f(x + L - 12) + '" y="' + f(y) + '" width="4" height="8" fill="#fff" stroke="#111" stroke-width="1.5"/><rect x="' + f(x + L - 6) + '" y="' + f(y) + '" width="4" height="6" fill="#fff" stroke="#111" stroke-width="1.5"/>'; },
        toothbrush: function (x, y, L) { var h = 9, headW = Math.min(L * 0.3, 46), hl = L - headW, s = rrect(x, y - h / 2, L, h, 4); for (var b = 0; b < 8; b++) { var bx = x + hl + 4 + b * ((headW - 6) / 7); s += '<line x1="' + f(bx) + '" y1="' + f(y - h / 2) + '" x2="' + f(bx) + '" y2="' + f(y - h / 2 - 8) + '" stroke="#111" stroke-width="1.6"/>'; } return s; },
        battery: function (x, y, L) { var h = 20, body = L - 5; return rrect(x, y - h / 2, body, h, 3) + '<rect x="' + f(x + body) + '" y="' + f(y - 5) + '" width="5" height="10" fill="#fff" stroke="#111" stroke-width="1.5"/><line x1="' + f(x + body * 0.7) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + body * 0.7) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.4"/><line x1="' + f(x + body * 0.82) + '" y1="' + f(y - h / 2) + '" x2="' + f(x + body * 0.82) + '" y2="' + f(y + h / 2) + '" stroke="#111" stroke-width="1.4"/>'; }
      };
      var pool = [['pencil', 'ดินสอ'], ['spoon', 'ช้อน'], ['fork', 'ส้อม'], ['knife', 'มีด'], ['straw', 'หลอด'], ['nail', 'ตะปู'], ['candle', 'เทียน'], ['crayon', 'สีเทียน'], ['marker', 'ปากกา'], ['eraser', 'ยางลบ'], ['leaf', 'ใบไม้'], ['key', 'กุญแจ'], ['toothbrush', 'แปรงสีฟัน'], ['battery', 'ถ่านไฟฉาย']];
      shuffle(pool);
      var chosen = pool.slice(0, 5), used = {}, items = [];
      chosen.forEach(function (o) {
        var cm, guard = 0;
        do { cm = ri(3, 12); guard++; } while (used[cm] && guard < 60);
        used[cm] = 1; items.push({ k: o[0], name: o[1], cm: cm, len: cm });
      });
      var bandH = 66, top = 16, rulerH = 44, H = top + items.length * bandH + rulerH + 18, svg = '';
      var rulerTop = top + items.length * bandH + 6;
      items.forEach(function (it, idx) {
        var yc = top + idx * bandH + bandH / 2 - 6, Lpx = it.len * pxCm;
        svg += DRAW[it.k](x0, yc, Lpx);
        svg += '<line x1="' + f(x0 + Lpx) + '" y1="' + f(yc + 18) + '" x2="' + f(x0 + Lpx) + '" y2="' + f(rulerTop) + '" stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>';
      });
      svg += '<rect x="' + f(x0 - 6) + '" y="' + f(rulerTop) + '" width="' + f(maxCm * pxCm + 12) + '" height="' + rulerH + '" rx="4" fill="#fff" stroke="#111" stroke-width="2"/>';
      for (var cm = 0; cm <= maxCm; cm++) {
        var xx = x0 + cm * pxCm;
        svg += '<line x1="' + f(xx) + '" y1="' + f(rulerTop) + '" x2="' + f(xx) + '" y2="' + f(rulerTop + 16) + '" stroke="#111" stroke-width="1.4"/>';
        svg += '<text x="' + f(xx) + '" y="' + f(rulerTop + 31) + '" font-size="12" text-anchor="middle" font-family="Arial" fill="#111">' + cm + '</text>';
        if (cm < maxCm) for (var mm2 = 1; mm2 < 10; mm2++) { var xm = xx + mm2 * pxCm / 10, th = mm2 === 5 ? 10 : 6; svg += '<line x1="' + f(xm) + '" y1="' + f(rulerTop) + '" x2="' + f(xm) + '" y2="' + f(rulerTop + th) + '" stroke="#111" stroke-width="0.8"/>'; }
      }
      var qorder = items.slice(); shuffle(qorder);
      var qs = qorder.map(function (it, i) {
        return '<div class="mlq"><span class="mlno">' + (i + 1) + '</span><span class="mlname">' + it.name + 'ยาว</span> <span class="mlblank"></span> เซนติเมตร หรือ <span class="mlblank"></span> มิลลิเมตร</div>';
      }).join('');
      var ans = qorder.map(function (it, i) { return (i + 1) + ') ' + it.name + ' ' + it.cm + ' ซม. = ' + (it.cm * 10) + ' มม.'; }).join('  ·  ');
      var q = '<div class="mlwrap"><svg class="mlfield" viewBox="0 0 ' + W + ' ' + H + '">' + svg + '</svg><div class="mlqs">' + qs + '</div></div>';
      return [{ q: q, a: ans, full: true, noline: true, pts: items.length }];
    },
    mixed: function (c) {
      var max = ({ easy: 20, medium: 50, hard: 100 }[c.level]) || 20;
      var out = [];
      for (var i = 0; i < c.count; i++) {
        var a, b, cc, expr, ans, guard = 0;
        do {
          var pat = ri(0, 3);
          if (pat === 0) { a = ri(1, max - 1); b = ri(1, max - a); var s = a + b; cc = ri(1, s); expr = '(' + a + ' + ' + b + ') \u2212 ' + cc; ans = s - cc; }
          else if (pat === 1) { a = ri(2, max); b = ri(1, a - 1); cc = ri(1, max - (a - b)); expr = '(' + a + ' \u2212 ' + b + ') + ' + cc; ans = (a - b) + cc; }
          else if (pat === 2) { b = ri(2, max); cc = ri(1, b - 1); a = ri(1, max - (b - cc)); expr = a + ' + (' + b + ' \u2212 ' + cc + ')'; ans = a + (b - cc); }
          else { b = ri(1, max - 2); cc = ri(1, max - b - 1); var s2 = b + cc; a = ri(s2, max); expr = a + ' \u2212 (' + b + ' + ' + cc + ')'; ans = a - s2; }
          guard++;
        } while ((ans < 0 || ans > max) && guard < 50);
        out.push({ q: expr + ' =', a: String(ans), n: ans });
      }
      return out;
    },
    expand: function (c) {
      var out = [], max = Math.min(50, c.count);
      for (var i = 0; i < max; i++) {
        var t = ri(1, 9), o = ri(1, 9), n = t * 10 + o;
        var q = '<div class="exp"><div class="exp-num">' + n + '</div><div class="exp-rows">' +
          '<div class="exp-r"><span class="exp-bl"></span> ในหลักสิบ มีค่า <span class="exp-bl"></span></div>' +
          '<div class="exp-r"><span class="exp-bl"></span> ในหลักหน่วย มีค่า <span class="exp-bl"></span></div>' +
          '<div class="exp-r exp-sum">เขียนในรูปกระจาย <span class="exp-bl"></span> = <span class="exp-bl"></span> + <span class="exp-bl"></span></div>' +
          '</div></div>';
        out.push({ q: q, a: n + ' = ' + (t * 10) + ' + ' + o, noline: true, tall: true, grid: true });
      }
      return out;
    },
    weigh: function (c) {
      var mode = c.mode || 'mix';
      var foods = ['กะหล่ำ', 'ฟักทอง', 'ถั่วฝักยาว', 'แครอท', 'มะเขือ', 'มะระ', 'หอมแดง', 'แตงกวา', 'มันฝรั่ง', 'พริก', 'มะเขือเทศ', 'ผักชี', 'ฟักเขียว', 'กล้วย', 'ส้ม', 'แอปเปิล', 'องุ่น'];
      for (var z = foods.length - 1; z > 0; z--) { var j = Math.floor(Math.random() * (z + 1)), t = foods[z]; foods[z] = foods[j]; foods[j] = t; }
      var out = [], used = {};
      for (var i = 0; i < c.count; i++) {
        var w, guard = 0; do { w = ri(2, 29); guard++; } while (used[w] && guard < 40); used[w] = 1;
        var m = mode === 'mix' ? (ri(0, 1) ? 'read' : 'draw') : mode;
        var food = foods[i % foods.length];
        if (m === 'read') {
          out.push({ q: '<div class="wcard"><div class="wtitle">' + food + '</div>' + scaleDial(food, w, true) + '<div class="wlabel">น้ำหนัก <span class="wbl"></span> ขีด</div></div>', a: food + ' ' + w + ' ขีด', noline: true, scale: true, grid: true });
        } else {
          out.push({ q: '<div class="wcard"><div class="wtitle">' + food + 'หนัก ' + w + ' ขีด</div>' + scaleDial(food, w, false) + '<div class="wsub">วาดเข็มชี้น้ำหนัก</div></div>', a: food + ' ' + w + ' ขีด (วาดเข็ม)', noline: true, scale: true, grid: true });
        }
      }
      return out;
    },
    weighcmp: function (c) {
      var foods = ['ผักชี', 'มะระ', 'ฟักเขียว', 'แครอท', 'มะเขือ', 'ฟักทอง', 'หอมแดง', 'แตงกวา', 'มันฝรั่ง', 'พริก', 'กะหล่ำ', 'ถั่วฝักยาว', 'มะเขือเทศ', 'กล้วย', 'ส้ม', 'แอปเปิล', 'องุ่น'];
      for (var z = foods.length - 1; z > 0; z--) { var j = Math.floor(Math.random() * (z + 1)), t = foods[z]; foods[z] = foods[j]; foods[j] = t; }
      var it = foods.slice(0, 3), wt = [], used = {};
      for (var i = 0; i < 3; i++) { var w, g = 0; do { w = ri(4, 28); g++; } while (used[w] && g < 40); used[w] = 1; wt.push(w); }
      var dials = it.map(function (nm, i) { return '<div class="wcmp-one">' + scaleDial(nm, wt[i], true) + '<div class="wcmp-cap">' + nm + '</div></div>'; }).join('');
      var reads = it.map(function (nm) { return '<span>' + nm + 'หนัก <span class="wcmp-bl wcmp-bn"></span> ขีด</span>'; }).join('');
      var pairs = [[0, 1], [0, 2], [1, 2]], rows = '', ansC = [];
      pairs.forEach(function (p) {
        [[p[0], p[1]], [p[1], p[0]]].forEach(function (qq) {
          var A = it[qq[0]], B = it[qq[1]], word = wt[qq[0]] > wt[qq[1]] ? 'หนักกว่า' : 'เบากว่า', diff = Math.abs(wt[qq[0]] - wt[qq[1]]);
          rows += '<div class="wcmp-r">' + A + ' <span class="wcmp-bl wcmp-bw"></span> ' + B + ' <span class="wcmp-bl wcmp-bn"></span> ขีด</div>';
          ansC.push(A + ' ' + word + ' ' + B + ' ' + diff + ' ขีด');
        });
      });
      var q = '<div class="wcmp"><div class="wcmp-dials">' + dials + '</div><div class="wcmp-read">' + reads + '</div><div class="wcmp-rows">' + rows + '</div></div>';
      var a = it.map(function (nm, i) { return nm + ' ' + wt[i] + ' ขีด'; }).join(', ') + ' | ' + ansC.join('  ·  ');
      return [{ q: q, a: a, full: true, noline: true, pts: 9 }];
    },
    findbox: function (c) {
      var max = ({ easy: 50, medium: 100, hard: 100 }[c.level]) || 50;
      var out = [], lines = '<div class="ubox-lines">' + Array(6).join('<span></span>') + '</div>';
      for (var i = 0; i < c.count; i++) {
        var pat = ri(0, 7), a, b, res, eq, ans, box = '<span class="ubox-sq"></span>';
        if (pat === 0) { a = ri(2, max - 2); ans = ri(1, max - a); res = a + ans; eq = a + ' + ' + box + ' = ' + res; }
        else if (pat === 1) { b = ri(2, max - 2); ans = ri(1, max - b); res = ans + b; eq = box + ' + ' + b + ' = ' + res; }
        else if (pat === 2) { a = ri(3, max); ans = ri(1, a - 1); res = a - ans; eq = a + ' \u2212 ' + box + ' = ' + res; }
        else if (pat === 3) { b = ri(1, max - 2); res = ri(1, max - b); ans = res + b; eq = box + ' \u2212 ' + b + ' = ' + res; }
        else if (pat === 4) { a = ri(2, max - 2); ans = ri(1, max - a); res = a + ans; eq = res + ' = ' + a + ' + ' + box; }
        else if (pat === 5) { b = ri(2, max - 2); ans = ri(1, max - b); res = ans + b; eq = res + ' = ' + box + ' + ' + b; }
        else if (pat === 6) { a = ri(3, max); ans = ri(1, a - 1); res = a - ans; eq = res + ' = ' + a + ' \u2212 ' + box; }
        else { b = ri(1, max - 2); res = ri(1, max - b); ans = res + b; eq = res + ' = ' + box + ' \u2212 ' + b; }
        out.push({ q: '<div class="ubox-q"><div class="ubox-eq">' + eq + '</div>' + lines + '</div>', a: String(ans), noline: true, box: true, grid: true });
      }
      return out;
    }
  };
  function buildProblems(ch, level, count) {
    var fn = GEN[ch.gen]; if (!fn) return [];
    var cfg = { level: level || 'easy', count: Math.max(4, Math.min(50, Number(count) || 12)) };
    if (ch.ops && ch.ops.length) cfg.ops = String(ch.ops).split(',').filter(function (s) { return s; });
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
        makeQR: makeQR, keyURL: keyURL,
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
    var cached = statsCacheGet();
    if (cached) renderStats(cached); else box.innerHTML = statsSkeleton(); // ขึ้นทันทีพร้อมหน้า
    api('publicStats').then(function (s) {
      statsCacheSet(s);
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
    if (showKeyFromHash()) return;   // เปิดจากลิงก์ QR เฉลย
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
    var cachedLanding = statsCacheGet();
    if (cachedLanding) fillLanding(cachedLanding);
    else { var fg = $('#featGrid'); if (fg) fg.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);font-size:.85rem">กำลังโหลดระบบ…</p>'; }
    apiGetPublicStats().then(function (s) {
      statsCacheSet(s);
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
