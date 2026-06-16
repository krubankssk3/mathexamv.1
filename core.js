/*** EduForge — core.js ****************************************************
 * เปลือกกลาง: Platform, ตัวเรียก API, ล็อกอิน/โทเค็น, ธีม, เอฟเฟกต์,
 * ตัวสร้างกระดาษข้อสอบ, ตัวโหลดปลั๊กอินตาม manifest
 * ปลั๊กอินแต่ละไฟล์เรียก window.Platform.register({ id, mount })
 ***************************************************************************/
(function () {
  'use strict';

  var API = (window.EDU_CONFIG && window.EDU_CONFIG.API_URL) || '';
  var LS = 'eduforge_token';
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
    var q = o.problems.map(function (p, i) {
      return '<div class="qitem"><span class="qno">' + (i + 1) + '.</span><span class="qbody">' + p.q + ' <span class="ans-line"></span></span></div>';
    }).join('');
    var k = o.problems.map(function (p, i) {
      return '<div class="qitem"><span class="qno">' + (i + 1) + '.</span><span class="qbody"><span class="ans">' + p.a + '</span></span></div>';
    }).join('');
    var sheet =
      '<div class="sheet pop"><div class="exam-head"><img src="' + S.logo + '">' +
      '<div style="flex:1"><h1>' + S.org + '</h1><div class="sub">' + S.dept + '</div></div>' +
      '<div style="text-align:right"><div class="mono" style="font-size:11px;color:#888">ชุดที่</div><div class="mono" style="font-weight:700;color:var(--accent)">' + o.setId + '</div></div></div>' +
      '<div style="text-align:center;margin:14px 0 4px"><div class="font-display" style="font-size:18px;font-weight:700">' + o.title + '</div><div class="sub">เรื่อง ' + o.subjectName + ' · ระดับ ' + lv + '</div></div>' +
      '<div class="meta-row"><span><b>ชื่อ–สกุล</b> <span class="blank" style="min-width:200px"></span></span><span><b>ชั้น</b> <span class="blank" style="min-width:70px"></span></span><span><b>เลขที่</b> <span class="blank" style="min-width:50px"></span></span><span><b>วันที่</b> ' + date + '</span></div>' +
      '<div class="instr"><b>คำชี้แจง</b> แสดงวิธีทำและเขียนคำตอบลงในช่องว่าง (' + o.problems.length + ' ข้อ ข้อละ 1 คะแนน)</div>' +
      '<div class="qcols ' + (o.cols === 2 ? 'c2' : '') + '">' + q + '</div>' +
      '<div class="sheet-foot"><span>พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3</span><span class="mono">' + o.setId + '</span></div></div>';
    var key = o.withKey ?
      '<div class="sheet key-sheet pop"><div class="exam-head" style="border-color:var(--accent)"><img src="' + S.logo + '"><div style="flex:1"><h1>เฉลย — ' + o.title + '</h1><div class="sub">' + o.subjectName + ' · ชุด ' + o.setId + '</div></div><span class="key-tag">ANSWER KEY</span></div>' +
      '<div class="key-grid">' + k + '</div><div class="sheet-foot"><span>เฉลยเฉพาะชุด ' + o.setId + '</span><span class="mono">' + o.setId + '</span></div></div>' : '';
    return sheet + key;
  }
  function printNode(html) {
    var host = $('#host'); var keep = host.innerHTML; host.innerHTML = html;
    setTimeout(function () { window.print(); host.innerHTML = keep; }, 200);
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
        if (op === '+') { a = ri(addR[0], addR[1]); b = ri(addR[0], addR[1]); ans = a + b; sym = '+'; }
        else if (op === '-') { a = ri(addR[0], addR[1]); b = ri(addR[0], a); ans = a - b; sym = '\u2212'; }
        else if (op === 'x') { a = ri(2, mulM); b = ri(2, mulM); ans = a * b; sym = '\u00d7'; }
        else { b = ri(2, mulM); ans = ri(2, mulM); a = b * ans; sym = '\u00f7'; }
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
    }
  };
  function buildProblems(ch, level, count) {
    var fn = GEN[ch.gen]; if (!fn) return [];
    var cfg = { level: level || 'easy', count: Math.max(4, Math.min(40, Number(count) || 12)) };
    if (ch.ops && ch.ops.length) cfg.ops = ch.ops;
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

    register: function (p) { this.plugins[p.id] = p; },

    services: function () {
      return {
        api: api, toast: toast, swal: Swal, swalDark: SWAL_DARK,
        settings: this.settings, user: this.user, curriculum: this.curriculum, store: this.store,
        examSheetHTML: examSheetHTML, printNode: printNode,
        genProblems: genProblems, genQuiz: genQuiz, makeSetId: makeSetId,
        countUp: countUp, animateCounters: animateCounters, reveal: initReveals
      };
    },

    renderNav: function () {
      var self = this, list = $('#navList'), m = $('#mnav');
      list.innerHTML = ''; m.innerHTML = '';
      this.meta.forEach(function (mt) {
        if (!self.plugins[mt.id]) return;
        var el = document.createElement('div');
        el.className = 'nav-item' + (mt.id === self.active ? ' on' : '');
        el.innerHTML = '<span class="ni-ic"><i class="ti ' + mt.icon + '"></i></span><div><div style="font-weight:500">' + mt.title + '</div></div>';
        el.onclick = function () { self.mount(mt.id); };
        list.appendChild(el);
        var mb = document.createElement('button');
        mb.className = 'chip click'; mb.style.whiteSpace = 'nowrap';
        mb.innerHTML = '<i class="ti ' + mt.icon + '"></i> ' + mt.title;
        mb.onclick = function () { self.mount(mt.id); };
        m.appendChild(mb);
      });
    },

    mount: function (id) {
      var p = this.plugins[id]; if (!p) return;
      var mt = this.meta.filter(function (x) { return x.id === id; })[0] || {};
      this.active = id; $('#hostTitle').textContent = mt.title || id;
      var host = $('#host'); host.innerHTML = '';
      this.renderNav();
      p.mount(host, this.services(), this);
    },

    start: function () {
      this.renderNav();
      var first = this.meta.filter(function (m) { return Platform.plugins[m.id]; })[0];
      if (first) this.mount(first.id);
    }
  };
  window.Platform = Platform;

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
  window.doLogin = function () {
    var u = $('#loginUser').value.trim(), p = $('#loginPass').value.trim();
    api('login', { username: u, password: p }).then(function (res) {
      session.token = res.token; localStorage.setItem(LS, res.token);
      return enterAppFromBootstrap();
    }).catch(function (e) { alertErr('เข้าสู่ระบบไม่สำเร็จ', String(e.message || e)); });
  };
  window.guestLogin = function () {
    // เดโม/ทดลอง: เข้าด้วยบัญชี teacher อัตโนมัติ
    api('login', { username: 'teacher', password: '1234' }).then(function (res) {
      session.token = res.token; localStorage.setItem(LS, res.token);
      return enterAppFromBootstrap();
    }).catch(function (e) { alertErr('เข้าใช้แบบทดลองไม่ได้', String(e.message || e)); });
  };
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
      $('#mnav').style.display = window.innerWidth <= 880 ? 'flex' : 'none';
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
      d.onclick = function () { document.documentElement.dataset.theme = d.dataset.theme; paintDots(); };
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

    // เติมตัวเลขสถิติหน้า public + เริ่มเอฟเฟกต์
    apiGetPublicStats().then(function (s) {
      if (s) {
        var g = $('#stGrades'), c = $('#stChapters'), su = $('#stSubjects');
        if (g) g.dataset.count = s.grades;
        if (c) c.dataset.count = s.chapters;
        if (su) su.dataset.count = s.subjects;
      }
      initReveals();
    });

    // ถ้ามี token เก่า ลองเข้าระบบต่อเลย
    if (session.token) {
      enterAppFromBootstrap().catch(function () { session.token = ''; localStorage.removeItem(LS); });
    }

    window.addEventListener('resize', function () {
      if (!$('#appView').classList.contains('hidden')) $('#mnav').style.display = window.innerWidth <= 880 ? 'flex' : 'none';
    });

    if (!REDUCE) setTimeout(function () {
      if ($('#appView').classList.contains('hidden') && !session.token)
        Swal.fire(Object.assign({ iconHtml: '<i class="ti ti-sparkles"></i>', title: 'ยินดีต้อนรับสู่ EduForge', text: 'แพลตฟอร์มรวมระบบสร้างสื่อการเรียนของโรงเรียนบ้านละลม', confirmButtonText: 'เริ่มเลย', confirmButtonColor: '#6366f1', timer: 6000, timerProgressBar: true }, SWAL_DARK));
    }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
