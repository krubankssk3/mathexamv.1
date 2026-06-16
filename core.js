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

  /* ---------- PLATFORM ---------- */
  var Platform = {
    plugins: {},          // id -> { mount }
    meta: [],             // [{id,title,icon,file,adminOnly,order}]
    settings: { org: '', dept: '', logo: '' },
    user: { role: 'public', name: '' },
    curriculum: { subject: 'คณิตศาสตร์', grades: [] },
    active: null,

    register: function (p) { this.plugins[p.id] = p; },

    services: function () {
      return {
        api: api, toast: toast, swal: Swal, swalDark: SWAL_DARK,
        settings: this.settings, user: this.user, curriculum: this.curriculum,
        examSheetHTML: examSheetHTML, printNode: printNode,
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
      var host = $('#host'); host.innerHTML = ''; host.classList.add('pop');
      setTimeout(function () { host.classList.remove('pop'); }, 360);
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
        return chain.then(function () { return loadScript('plugins/' + name + '.js'); });
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
