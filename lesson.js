/*** EduForge plugin — สร้างแบบฝึกการบวก (ตั้งบวก) **********************
 * ตัวสร้างใบงานการบวกแบบตั้งบวก ทำงานฝั่งหน้าเว็บล้วน · ไม่ต้อง backend
 *   - ตัวตั้ง/ตัวบวก ตั้งหลักได้ 1–8 หลัก (แยกกัน) หรือสุ่มคละหลักต่อข้อ
 *   - A4 แนวตั้ง ตารางช่องตัวเลข · เฉลย (inline/พิมพ์พร้อมเฉลย/QR มุมขวา)
 *   - จับเวลาเต็มจอ · ช่อง "เวลาที่ใช้" · กรอบเรืองแสง
 ***********************************************************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ============================================================
     ส่วนเสริม: ตัวสร้างแบบฝึกการบวก (ตั้งบวก) — helper ระดับโมดูล
     ============================================================ */
  var LOGO = 'https://img2.pic.in.th/pic/Logo-7aecb8e321ff2955.png';
  var FOOTER = 'พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3';
  function rndI(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function numDg(d) { if (d <= 1) return rndI(1, 9); var lo = Math.pow(10, d - 1), hi = Math.pow(10, d) - 1; return rndI(lo, hi); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ตารางช่องตัวเลขของหนึ่งข้อ (ใช้ทั้งพรีวิวและพิมพ์) */
  // จำนวนบรรทัดคำตอบ/ทำงาน: บวก-ลบ = 1 · คูณ = ตามหลักตัวคูณ (1หลัก→1, 2หลัก→3, 3หลัก→4)
  function ansRowCount(p, op) {
    if (op !== '×') return 1;
    var md = String(p.nums[1]).length;
    return md <= 1 ? 1 : md + 1;
  }
  function addGrid(p, showAns, op) {
    op = op || '+';
    var ansRows = ansRowCount(p, op);
    var rows = '', i, j, r, n = p.nums.length;
    for (i = 0; i < n; i++) {
      var s = String(p.nums[i]), pad = p.cols - s.length, tds = '';
      for (j = 0; j < p.cols; j++) tds += '<td>' + (j < pad ? '' : esc(s.charAt(j - pad))) + '</td>';
      if (i === 0) tds += '<td class="op" rowspan="' + n + '">' + op + '</td>';   // เครื่องหมายกึ่งกลางแนวตั้ง
      rows += '<tr>' + tds + '</tr>';
    }
    for (r = 0; r < ansRows; r++) {
      var isLast = (r === ansRows - 1);
      var cl = [];
      if (r === 0) cl.push('sum');                       // เส้นใต้ตัวล่าง (ใต้ตัวคูณ/ตัวบวก)
      if (isLast && ansRows > 1) cl.push('sumf');         // เส้นเหนือผลรวมสุดท้าย (คูณหลายหลัก)
      var as = (showAns && isLast) ? String(p.ans) : '', apad = p.cols - as.length, atds = '';
      for (j = 0; j < p.cols; j++) {
        var ch = (as && j >= apad) ? esc(as.charAt(j - apad)) : '';
        atds += '<td class="ans' + (as ? ' k' : '') + '">' + ch + '</td>';
      }
      rows += '<tr class="' + cl.join(' ') + '">' + atds + '<td class="op"></td></tr>';
    }
    return '<table class="agrid">' + rows + '</table>';
  }

  /* CSS เอกสารพิมพ์ (ฝังในเอกสารพิมพ์เอง — ไม่ชนกับ CSS ของระบบ) */
  function addPrintCSS(ac) {
    ac = ac || '#c0392b';
    return ''
      + '@page{size:A4 portrait;margin:9mm}'
      + '*{box-sizing:border-box}'
      + "body{font-family:'TH Sarabun New','Sarabun',sans-serif;color:#1a1a1a;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}"
      + '.hd{border:2px solid ' + ac + ';border-radius:10px;padding:8px 12px;position:relative;margin-bottom:10px;background:linear-gradient(180deg,#fff,color-mix(in srgb,' + ac + ' 8%,#fff))}'
      + '.hd .top{display:flex;align-items:center;gap:10px;padding-right:96px}'
      + '.hd .logo{width:42px;height:42px;object-fit:contain;flex:0 0 auto}'
      + '.hd .ttl{font-size:24px;font-weight:700;color:' + ac + ';line-height:1.1}'
      + '.hd .nm{font-size:21px;margin-top:9px;padding-right:96px}'
      + '.hd .meta{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:20px;margin-top:9px;align-items:center}'
      + '.hd .meta .box{border:1px solid ' + ac + ';border-radius:6px;padding:3px 12px;text-align:center;color:' + ac + ';font-weight:600}'
      + '.qr{position:absolute;top:8px;right:12px;width:80px;text-align:center}'
      + '.qr img{width:80px;height:80px;display:block}'
      + '.qr .cap{font-size:9px;color:#888;margin-top:1px}'
      + '.dot{border-bottom:1px dotted #555;display:inline-block;min-width:60px}'
      + '.page{position:relative;display:flex;flex-direction:column;min-height:272mm}'
      + '.page.brk{page-break-before:always}'
      + '.conthd{border-bottom:2px solid ' + ac + ';color:' + ac + ';font-weight:700;font-size:18px;padding-bottom:6px;margin-bottom:12px}'
      + '.conthd span{font-weight:400;font-size:13px;color:#999}'
      + '.grid{display:grid;gap:8px 14px;flex:1;align-content:space-evenly}'
      + '.prob{break-inside:avoid;page-break-inside:avoid;padding:6px 4px 8px;display:flex;gap:8px;align-items:flex-start}'
      + '.prob .no{font-weight:700;color:' + ac + ';font-size:15px;min-width:26px}'
      + '.agrid{border-collapse:collapse;margin-top:2px}'
      + '.agrid td{width:8.5mm;height:8.5mm;border:1px solid #333;text-align:center;font-size:16px;font-weight:600;padding:0;line-height:8.5mm}'
      + '.agrid td.op{border:0;width:6mm;font-size:18px;font-weight:700;color:#111;vertical-align:middle}'
      + '.agrid tr.sum td{border-top:2px solid #111}'
      + '.agrid tr.sumf td{border-top:2px solid #111}'
      + '.agrid tr.sum td.op,.agrid tr.sumf td.op{border-top:0}'
      + '.agrid td.k{color:' + ac + '}'
      + '.foot{margin-top:12px;text-align:center;font-size:11px;color:#777;border-top:1px solid #eee;padding-top:6px}';
  }

  function addHead(o) {
    var ac = o.accent || '#c0392b';
    var qr = o.qrImg ? '<div class="qr"><img src="' + o.qrImg + '" alt="QR เฉลย"><div class="cap">สแกนดูเฉลย</div></div>' : '';
    return ''
      + '<div class="hd">' + qr
      + '<div class="top">'
      + '<img class="logo" src="' + (o.logo || LOGO) + '" alt="logo">'
      + '<div><div class="ttl">' + esc(o.title) + '</div>'
      + '<div style="font-size:12px;color:' + ac + '">' + esc(o.org || '') + (o.org ? ' &middot; ' : '') + 'ชุดที่ ' + esc(o.setId) + ' &middot; ' + esc(o.sub) + '</div></div>'
      + '</div>'
      + '<div class="nm">ชื่อ <span class="dot" style="min-width:200px"></span> ชั้น <span class="dot" style="min-width:50px"></span> เลขที่ <span class="dot" style="min-width:40px"></span></div>'
      + '<div class="meta">'
      + '<span>วันที่ <span class="dot" style="min-width:40px"></span> เดือน <span class="dot" style="min-width:80px"></span> พ.ศ. <span class="dot" style="min-width:50px"></span></span>'
      + '<span class="box">เวลาที่ใช้ทำ <span class="dot" style="min-width:50px;border-color:' + ac + '"></span> นาที</span>'
      + '<span class="box">คะแนนที่ได้ <span class="dot" style="min-width:55px;border-color:' + ac + '"></span></span>'
      + '</div></div>';
  }

  function addSheet(o, withKey) {
    var PER = 10;                 // 10 ข้อ/หน้า A4 พอดี
    var numCols = o.cols, i, j;
    var maxGC = 1, maxRows = 1;
    for (i = 0; i < o.probs.length; i++) {
      maxGC = Math.max(maxGC, o.probs[i].cols);
      maxRows = Math.max(maxRows, o.probs[i].nums.length + ansRowCount(o.probs[i], o.op));  // แถวตัวเลข + แถวคำตอบ/ทำงาน
    }
    // ความกว้าง: ไม่ให้ล้นขอบกระดาษ (~192mm)
    var perProb = (192 - 12 * (numCols - 1)) / numCols;
    var widthCap = (perProb - 14) / maxGC;
    // ความสูง: ให้รวมทุกแถวเท่ากับพื้นที่ที่เคยพอดี (≈ 5 แถวโจทย์ × 3 บรรทัด × 15mm)
    var rowsPerPage = Math.ceil(PER / numCols);
    var heightCap = 225 / (rowsPerPage * maxRows);
    var cell = Math.min(15, widthCap, heightCap);
    cell = Math.max(6, Math.round(cell * 10) / 10);
    var fpx = Math.max(15, Math.round(cell * 2.3));
    var dyn = '.agrid td{width:' + cell + 'mm;height:' + cell + 'mm;line-height:' + cell + 'mm;font-size:' + fpx + 'px}'
      + '.agrid td.op{font-size:' + (fpx + 3) + 'px}'
      + '.prob .no{font-size:' + Math.max(14, fpx - 2) + 'px}';

    var ac = o.accent || '#c0392b';
    var keyTag = withKey ? '<div style="text-align:center;color:' + ac + ';font-weight:700;margin:2px 0 6px">★ ฉบับเฉลย ★</div>' : '';
    var pages = [];
    for (i = 0; i < o.probs.length; i += PER) pages.push(o.probs.slice(i, i + PER));
    var totalPages = pages.length;

    var body = pages.map(function (chunk, pi) {
      var cells = chunk.map(function (p, j) {
        var no = pi * PER + j + 1;
        return '<div class="prob"><span class="no">' + no + ')</span>' + addGrid(p, withKey, o.op) + '</div>';
      }).join('');
      var grid = '<div class="grid" style="grid-template-columns:repeat(' + numCols + ',1fr)">' + cells + '</div>';
      var header = pi === 0
        ? addHead(o) + keyTag
        : '<div class="conthd">' + esc(o.title) + ' <span>· ชุด ' + esc(o.setId) + ' · หน้า ' + (pi + 1) + '/' + totalPages + '</span></div>';
      var foot = (pi === totalPages - 1) ? '<div class="foot">' + FOOTER + '</div>' : '';
      return '<div class="page' + (pi > 0 ? ' brk' : '') + '">' + header + grid + foot + '</div>';
    }).join('');

    return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>' + esc(o.title) + '</title><style>' + addPrintCSS(ac) + dyn + '</style></head><body>'
      + body + '</body></html>';
  }

  /* พิมพ์ผ่าน iframe (กันป๊อปอัปถูกบล็อก + คุมเลย์เอาต์เองทั้งหมด) */
  function addPrintDoc(html) {
    var f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    setTimeout(function () {
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { }
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1200);
    }, 450);
  }

  /* จับเวลาเต็มจอ (สไตล์เกม 24) — สร้างครั้งเดียว */
  var TM = { el: null, left: 0, run: false, iv: null, mins: 10, reset: null };
  function tmOpen() {
    if (!TM.el) {
      var w = document.createElement('div');
      w.id = 'efLessonTimer';
      w.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(120% 120% at 50% 0%,#101426,#05070f);color:#fff;font-family:inherit';
      w.innerHTML = ''
        + '<button id="efTmClose" style="position:absolute;top:18px;right:22px;background:none;border:0;color:#7c8497;font-size:30px;cursor:pointer">&times;</button>'
        + '<div id="efTmMins" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;justify-content:center"></div>'
        + '<div id="efTmDisp" style="font-weight:800;font-size:clamp(72px,20vw,260px);line-height:1;letter-spacing:2px;color:#34d399;text-shadow:0 0 40px rgba(52,211,153,.5);font-variant-numeric:tabular-nums">10:00</div>'
        + '<div style="display:flex;gap:14px;margin-top:26px">'
        + '<button id="efTmGo" style="font-size:22px;padding:14px 40px;border-radius:14px;border:0;background:#34d399;color:#04130d;font-weight:700;cursor:pointer">เริ่ม</button>'
        + '<button id="efTmRst" style="font-size:22px;padding:14px 34px;border-radius:14px;border:1px solid #3a4356;background:transparent;color:#cfd6e4;cursor:pointer">รีเซ็ต</button>'
        + '</div>';
      document.body.appendChild(w);
      var disp = $('#efTmDisp', w), go = $('#efTmGo', w);
      function draw() { var m = Math.floor(TM.left / 60), s = TM.left % 60; disp.textContent = pad2(m) + ':' + pad2(s); }
      function stop() { TM.run = false; if (TM.iv) { clearInterval(TM.iv); TM.iv = null; } go.textContent = 'เริ่ม'; go.style.background = '#34d399'; go.style.color = '#04130d'; }
      function reset() { stop(); TM.left = TM.mins * 60; draw(); disp.style.color = '#34d399'; }
      function tick() {
        if (TM.left <= 0) { stop(); disp.style.color = '#ef4444'; disp.textContent = '00:00'; return; }
        TM.left--; draw();
        if (TM.left <= 30) disp.style.color = '#fbbf24';
        if (TM.left <= 10) disp.style.color = '#ef4444';
      }
      var bar = $('#efTmMins', w);
      [5, 10, 15, 20, 30].forEach(function (m) {
        var b = document.createElement('button');
        b.textContent = m + ' น.';
        b.style.cssText = 'padding:7px 16px;border-radius:999px;border:1px solid #3a4356;background:transparent;color:#cfd6e4;cursor:pointer;font-size:14px';
        b.onclick = function () { TM.mins = m; reset(); $$('#efTmMins button', w).forEach(function (x) { x.style.background = 'transparent'; x.style.color = '#cfd6e4'; }); b.style.background = '#34d399'; b.style.color = '#04130d'; };
        if (m === TM.mins) { b.style.background = '#34d399'; b.style.color = '#04130d'; }
        bar.appendChild(b);
      });
      go.onclick = function () {
        if (TM.run) { stop(); }
        else { if (TM.left <= 0) reset(); TM.run = true; go.textContent = 'หยุด'; go.style.background = '#fbbf24'; go.style.color = '#1a1300'; TM.iv = setInterval(tick, 1000); }
      };
      $('#efTmRst', w).onclick = reset;
      $('#efTmClose', w).onclick = function () { stop(); w.style.display = 'none'; };
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && w.style.display === 'flex') { stop(); w.style.display = 'none'; } });
      TM.el = w; TM.reset = reset; reset();
    }
    TM.reset(); TM.el.style.display = 'flex';
  }

  /* CSS พรีวิวในแอป (ฉีดครั้งเดียว) */
  function ensureAddCSS() {
    if ($('#efAddCSS')) return;
    var s = document.createElement('style'); s.id = 'efAddCSS';
    s.textContent = ''
      + '.efadd-prev{display:grid;gap:10px 14px;margin-top:14px}'
      + '.efadd-prob{display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--bg2)}'
      + '.efadd-prob .no{font-weight:700;color:var(--accent);min-width:26px}'
      + '.efadd-prob table{border-collapse:collapse}'
      + '.efadd-prob td{width:30px;height:30px;border:1px solid var(--line);text-align:center;font-weight:600;color:var(--txt)}'
      + '.efadd-prob td.op{border:0;width:22px;color:var(--txt);font-weight:700;vertical-align:middle}'
      + '.efadd-prob tr.sum td{border-top:2px solid var(--txt)}'
      + '.efadd-prob tr.sumf td{border-top:2px solid var(--txt)}'
      + '.efadd-prob tr.sum td.op,.efadd-prob tr.sumf td.op{border-top:0}'
      + '.efadd-prob td.k{color:var(--accent)}'
      + '.efadd-field{display:flex;flex-direction:column;gap:5px}'
      + '.efadd-field label{font-size:13px;color:var(--muted)}'
      + '.efadd-field select,.efadd-field input{padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt);font:inherit}'
      + '.efadd-tile{--tile:var(--accent);position:relative;border:0;cursor:pointer;color:#fff;border-radius:24px;'
      + 'background:linear-gradient(150deg,var(--tile),color-mix(in srgb,var(--tile) 55%,#000));'
      + 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;'
      + 'width:200px;height:200px;animation:efBreathe 2.6s ease-in-out infinite}'
      + '.efadd-tile.sub{--tile:#16a34a}'
      + '.efadd-tile.mul{--tile:#db2777}'
      + '.efadd-tile:hover{filter:brightness(1.08)}'
      + '.efadd-tile:active{transform:scale(.97)}'
      + '@keyframes efBreathe{'
      + '0%,100%{box-shadow:0 8px 22px color-mix(in srgb,var(--tile) 30%,transparent),0 0 0 0 color-mix(in srgb,var(--tile) 45%,transparent);transform:scale(1)}'
      + '50%{box-shadow:0 10px 30px color-mix(in srgb,var(--tile) 45%,transparent),0 0 44px 8px color-mix(in srgb,var(--tile) 60%,transparent);transform:scale(1.035)}}'
      + '@media (prefers-reduced-motion:reduce){.efadd-tile{animation:none}}';
    document.head.appendChild(s);
  }

  window.Platform.register({
    id: 'lesson',
    mount: function (host, svc) {

      /* ============================================================
         โหมด: สร้างแบบฝึก การบวก/การลบ (ตั้งบวก/ตั้งลบ)
         ============================================================ */
      var KINDS = {
        add: { op: '+', accent: '#c0392b', word: 'การบวก', t2: 'ตัวบวก', verb: 'ตั้งบวก', pre: 'A', dMaxTop: 8, dMaxBot: 8 },
        sub: { op: '−', accent: '#16a34a', word: 'การลบ', t2: 'ตัวลบ', verb: 'ตั้งลบ', pre: 'S', dMaxTop: 8, dMaxBot: 8 },
        mul: { op: '×', accent: '#db2777', word: 'การคูณ', t2: 'ตัวคูณ', verb: 'ตั้งคูณ', pre: 'M', dMaxTop: 4, dMaxBot: 3 }
      };
      var ast = { kind: 'add', dTop: 3, dBot: 3, count: 10, cols: 2, title: '', setId: '', showKey: false, mixed: false, probs: [] };

      function newSetId() {
        var d = new Date();
        return KINDS[ast.kind].pre + String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + rndI(100, 999);
      }
      // สุ่มคู่จำนวนตามชนิด — ลบ: ตัวตั้ง>ตัวลบเสมอ · คูณ: หลักตัวคูณไม่เกินตัวตั้ง
      function genPair(dt, db) {
        var top, bot, ans;
        if (ast.kind === 'sub') {
          var d2 = Math.min(db, dt);                       // ตัวลบหลักไม่เกินตัวตั้ง
          if (dt > d2) { bot = numDg(d2); top = numDg(dt); }  // ตัวตั้งหลักมากกว่า → ค่ามากกว่าเสมอ
          else {                                            // หลักเท่ากัน → คุมให้ตัวตั้ง > ตัวลบ
            var lo = (dt === 1) ? 1 : Math.pow(10, dt - 1), hi = Math.pow(10, dt) - 1;
            bot = rndI(lo, hi - 1); top = rndI(bot + 1, hi);
          }
          ans = top - bot;
        } else if (ast.kind === 'mul') {
          var dm = Math.min(db, dt);                       // หลักตัวคูณไม่เกินหลักตัวตั้ง
          top = numDg(dt); bot = numDg(dm); ans = top * bot;
        } else {
          top = numDg(dt); bot = numDg(db); ans = top + bot;
        }
        return { nums: [top, bot], ans: ans, cols: Math.max(String(top).length, String(bot).length, String(ans).length) };
      }
      function buildAddSet() { var p = [], i; for (i = 0; i < ast.count; i++) p.push(genPair(ast.dTop, ast.dBot)); return p; }
      function buildAutoSet() { var p = [], i, K = KINDS[ast.kind]; for (i = 0; i < ast.count; i++) p.push(genPair(rndI(1, K.dMaxTop), rndI(1, K.dMaxBot))); return p; }

      function effDb() { return ast.kind === 'add' ? ast.dBot : Math.min(ast.dBot, ast.dTop); }   // ลบ/คูณ: ตัวล่างหลักไม่เกินตัวตั้ง
      function opt(v, label, cur) { return '<option value="' + v + '"' + (v == cur ? ' selected' : '') + '>' + label + '</option>'; }
      function digOpts(cur, maxN) { var o = '', n; for (n = 1; n <= maxN; n++) o += opt(n, n + ' หลัก', cur); return o; }
      function defTitle() {
        if (ast.title) return ast.title;
        var K = KINDS[ast.kind];
        return ast.mixed ? ('แบบฝึก' + K.word + ' (คละจำนวนหลัก)') : ('แบบฝึก' + K.word + ' ' + ast.dTop + ' หลัก ' + K.op + ' ' + effDb() + ' หลัก');
      }

      /* ---------- หน้าแรก: ปุ่มเรืองแสงเข้า-ออก (บวก/ลบ) ---------- */
      function tileBtn(kind, icon, label) {
        return '<button class="efadd-tile' + (kind === 'sub' ? ' sub' : '') + '" data-kind="' + kind + '">' +
          '<i class="ti ' + icon + '" style="font-size:56px;line-height:1"></i>' +
          '<span style="font-size:1.1rem;font-weight:700;line-height:1.25;text-align:center">' + label + '</span></button>';
      }
      function renderHome() {
        ensureAddCSS();
        host.innerHTML =
          '<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:40px 16px;min-height:340px">' +
            '<div class="eyebrow" style="text-align:center">แบบฝึกหัด — เลือกประเภท</div>' +
            '<div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center">' +
              tileBtn('add', 'ti-square-rounded-plus', 'สร้างแบบฝึก<br>การบวก') +
              tileBtn('sub', 'ti-square-rounded-minus', 'สร้างแบบฝึก<br>การลบ') +
              tileBtn('mul', 'ti-square-rounded-x', 'สร้างแบบฝึก<br>การคูณ') +
            '</div>' +
            '<div style="color:var(--muted);font-size:.86rem;text-align:center">กดเลือกประเภทเพื่อสร้างใบงาน (ตั้งบวก / ตั้งลบ / ตั้งคูณ)</div>' +
          '</div>';
        $$('.efadd-tile', host).forEach(function (b) {
          b.onclick = function () { ast.kind = b.dataset.kind; ast.mixed = false; ast.probs = []; renderAdd(); };
        });
      }

      function renderAdd() {
        ensureAddCSS();
        var K = KINDS[ast.kind];
        // คุมจำนวนหลักให้ไม่เกินเพดานของชนิด และ (ลบ/คูณ) ตัวล่างไม่เกินตัวตั้ง
        if (ast.dTop > K.dMaxTop) ast.dTop = K.dMaxTop;
        var maxBot = (ast.kind === 'add') ? K.dMaxBot : Math.min(K.dMaxBot, ast.dTop);
        if (ast.dBot > maxBot) ast.dBot = maxBot;
        var note = '';
        if (ast.kind === 'sub') note = '* ตัวตั้งจะถูกสุ่มให้มีค่ามากกว่าตัวลบเสมอ (ผลลบไม่ติดลบ)';
        else if (ast.kind === 'mul') note = '* ตัวตั้งสูงสุด 4 หลัก · ตัวคูณสูงสุด 3 หลัก และหลักตัวคูณไม่เกินหลักตัวตั้ง';
        var subNote = note ? '<div style="font-size:12px;color:var(--muted);margin-top:-6px">' + note + '</div>' : '';
        host.innerHTML =
          '<div style="margin-bottom:16px"><button class="btn btn-ghost" id="ad-back"><i class="ti ti-arrow-left"></i> กลับ</button></div>' +
          '<div class="grid-main" style="display:grid;gap:22px;grid-template-columns:340px 1fr">' +
            '<section><div class="panel" style="padding:18px;display:flex;flex-direction:column;gap:14px">' +
              '<div class="eyebrow">ตั้งค่าชุดแบบฝึก' + K.word + '</div>' +
              '<div class="efadd-field"><label>จำนวนหลักของตัวตั้ง</label><select id="ad-dtop">' + digOpts(ast.dTop, K.dMaxTop) + '</select></div>' +
              '<div class="efadd-field"><label>จำนวนหลักของ' + K.t2 + '</label><select id="ad-dbot">' + digOpts(ast.dBot, maxBot) + '</select></div>' + subNote +
              '<div class="efadd-field"><label>จำนวนข้อ</label><select id="ad-count">' +
                [10, 20, 30, 40, 50].map(function (n) { return opt(n, n + ' ข้อ', ast.count); }).join('') + '</select></div>' +
              '<div class="efadd-field"><label>คอลัมน์ต่อหน้า</label><select id="ad-cols">' +
                opt(2, '2 คอลัมน์', ast.cols) + opt(3, '3 คอลัมน์', ast.cols) + opt(4, '4 คอลัมน์', ast.cols) + '</select></div>' +
              '<div class="efadd-field"><label>ชื่อชุด (เว้นว่างได้)</label><input id="ad-title" value="' + esc(ast.title) + '" placeholder="เช่น ' + K.word + ' 3 หลัก ชุดที่ 1"></div>' +
              '<button class="btn btn-accent" id="ad-gen"><i class="ti ti-refresh"></i> สร้างชุดแบบฝึก</button>' +
              '<button class="btn btn-ghost" id="ad-auto"><i class="ti ti-arrows-shuffle"></i> สุ่มอัตโนมัติ (คละหลัก)</button>' +
              '<button class="btn btn-ghost" id="ad-timer"><i class="ti ti-clock"></i> จับเวลาเต็มจอ</button>' +
            '</div></section>' +
            '<section id="ad-out"></section>' +
          '</div>';

        $('#ad-back', host).onclick = function () { renderHome(); };
        // เปลี่ยนหลักตัวตั้ง → ปรับเพดานหลักตัวล่าง (ลบ/คูณ ห้ามเกินตัวตั้ง)
        $('#ad-dtop', host).onchange = function () {
          ast.dTop = +this.value;
          var mb = (ast.kind === 'add') ? K.dMaxBot : Math.min(K.dMaxBot, ast.dTop);
          if (ast.dBot > mb) ast.dBot = mb;
          $('#ad-dbot', host).innerHTML = digOpts(ast.dBot, mb);
        };
        function readUI() {
          ast.dTop = +$('#ad-dtop', host).value;
          ast.dBot = +$('#ad-dbot', host).value;
          ast.count = +$('#ad-count', host).value;
          ast.cols = +$('#ad-cols', host).value;
          ast.title = $('#ad-title', host).value.trim();
        }
        $('#ad-gen', host).onclick = function () {
          readUI(); ast.setId = newSetId(); ast.mixed = false; ast.probs = buildAddSet(); ast.showKey = false;
          renderAddOut();
          if (svc.toast) svc.toast('success', 'สร้าง ' + ast.count + ' ข้อแล้ว');
        };
        $('#ad-auto', host).onclick = function () {
          readUI(); ast.setId = newSetId(); ast.mixed = true; ast.probs = buildAutoSet(); ast.showKey = false;
          renderAddOut();
          if (svc.toast) svc.toast('success', 'สุ่มคละหลัก ' + ast.count + ' ข้อแล้ว');
        };
        $('#ad-timer', host).onclick = tmOpen;
        renderAddOut();
      }

      function renderAddOut() {
        var out = $('#ad-out', host); if (!out) return;
        if (!ast.probs.length) {
          out.innerHTML = '<div class="panel" style="padding:30px;text-align:center;color:var(--muted)">เลือกค่าทางซ้าย แล้วกด “สร้างชุดแบบฝึก”</div>';
          return;
        }
        var cells = ast.probs.map(function (p, i) {
          return '<div class="efadd-prob"><span class="no">' + (i + 1) + ')</span>' + addGrid(p, ast.showKey, KINDS[ast.kind].op) + '</div>';
        }).join('');
        out.innerHTML =
          '<div class="panel" style="padding:18px">' +
            '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:8px">' +
              '<div><div class="eyebrow">ตัวอย่างก่อนพิมพ์</div><div class="font-display" style="font-weight:800;font-size:1.25rem">' + esc(defTitle()) + ' <span style="font-size:.78rem;color:var(--muted)">ชุด ' + esc(ast.setId) + '</span></div></div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button class="btn btn-ghost" id="ad-key"><i class="ti ti-eye"></i> ' + (ast.showKey ? 'ซ่อนเฉลย' : 'ดูเฉลย') + '</button>' +
                '<button class="btn btn-ghost" id="ad-printk"><i class="ti ti-printer"></i> พิมพ์พร้อมเฉลย</button>' +
                '<button class="btn btn-accent" id="ad-print"><i class="ti ti-printer"></i> พิมพ์ใบงาน</button>' +
              '</div></div>' +
            '<div class="efadd-prev" style="grid-template-columns:repeat(' + Math.min(ast.cols, 4) + ',1fr)">' + cells + '</div>' +
          '</div>';
        $('#ad-key', host).onclick = function () { ast.showKey = !ast.showKey; renderAddOut(); };
        $('#ad-print', host).onclick = function () { doAddPrint(false); };
        $('#ad-printk', host).onclick = function () { doAddPrint(true); };
      }

      function doAddPrint(withKey) {
        var S = svc.settings || {}, K = KINDS[ast.kind];
        var subTxt = ast.mixed
          ? (K.verb + ' คละจำนวนหลัก (สุ่ม 1–8 หลัก)')
          : (K.verb + ' ' + ast.dTop + ' หลัก ' + K.op + ' ' + effDb() + ' หลัก');
        var o = {
          title: defTitle(), setId: ast.setId, sub: subTxt,
          op: K.op, accent: K.accent,
          org: S.org || '', logo: S.logo || LOGO,
          probs: ast.probs, cols: ast.cols, qrImg: ''
        };
        var finish = function (qrImg) {
          o.qrImg = qrImg || '';
          addPrintDoc(addSheet(o, withKey));
          if (svc.toast) svc.toast('success', withKey ? 'เปิดหน้าพิมพ์ฉบับเฉลยแล้ว' : 'เปิดหน้าพิมพ์ใบงานแล้ว');
        };
        // QR เฉลยมุมบนขวา (เฉพาะใบงาน) — ใช้บริการกลางถ้ามี
        if (!withKey && svc.makeQR && svc.keyURL) {
          var answers = ast.probs.map(function (p) { return String(p.ans); });
          var url = svc.keyURL(o.title, ast.setId, answers);
          svc.makeQR(url).then(function (img) { finish(img); }, function () { finish(''); });
        } else { finish(''); }
      }

      /* เปิดหน้าแรก (ปุ่มสร้างแบบฝึกการบวก) */
      renderHome();
    }
  });
})();
