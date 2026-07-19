/*** EduForge plugin — แบบฝึกหัดทศนิยม *********************************
 * บวก / ลบ / คูณ / หาร ทศนิยม — เริ่มเปิด "การบวก" ก่อน
 *
 * กำหนดตำแหน่งทศนิยม 2 โหมด (สวิตช์):
 *   1) สุ่มช่วง 0–3 ตำแหน่ง + กำหนดจำนวนหลักหน้าจุดเอง
 *   2) กำหนดหลักเองทุกจุด: ตัวตั้ง/ตัวบวก แยกกัน (หลักหน้าจุด + ตำแหน่งทศนิยม)
 * เฉลยแสดง "วิธีตั้งหลัก" ตารางกล่องต่อหลัก จัดจุดทศนิยมตรงกัน + คำตอบ
 * คำนวณแบบจำนวนเต็มสเกล (10^n) กัน floating-point error
 * A4 พอดีหน้า · เฉลย (inline/พิมพ์พร้อมเฉลย/QR) · จับเวลา · ช่องเวลาที่ใช้
 *********************************************************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var LOGO = 'https://img2.pic.in.th/pic/Logo-7aecb8e321ff2955.png';
  var FOOTER = 'พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3';
  function rndI(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function pow10(n) { return Math.pow(10, n); }
  function rep(ch, n) { var s = ''; for (var i = 0; i < n; i++) s += ch; return s; }
  function clampI(v, lo, hi, def) { v = parseInt(v, 10); if (isNaN(v)) v = def; return Math.max(lo, Math.min(hi, v)); }

  /* ---------- โครงเลขทศนิยม {ip, fp, dp} ---------- */
  function genNum(intDigits, dp) {
    var lo = intDigits <= 1 ? 1 : pow10(intDigits - 1), hi = pow10(intDigits) - 1;
    var ip = rndI(lo, hi), fp = dp > 0 ? rndI(0, pow10(dp) - 1) : 0;
    return { ip: ip, fp: fp, dp: dp };
  }
  function showNum(o) { if (o.dp === 0) return '' + o.ip; return o.ip + '.' + (rep('0', o.dp) + o.fp).slice(-o.dp); }
  function scaled(o, P) { return (o.ip * pow10(o.dp) + o.fp) * pow10(P - o.dp); }
  function addDec(a, b) {
    var P = Math.max(a.dp, b.dp), s = scaled(a, P) + scaled(b, P);
    var ip = Math.floor(s / pow10(P)), fp = s % pow10(P), dp = P;
    while (dp > 0 && fp % 10 === 0) { fp /= 10; dp--; }
    return { ip: ip, fp: fp, dp: dp };
  }
  function metrics(list) { var mi = 0, mf = 0; list.forEach(function (o) { mi = Math.max(mi, ('' + o.ip).length); mf = Math.max(mf, o.dp); }); return { mi: mi, mf: mf }; }

  /* ---------- สุ่มโจทย์ ---------- */
  function genProblem(st) {
    var a, b;
    if (st.mode === 'custom') { a = genNum(st.intA, st.dpA); b = genNum(st.intB, st.dpB); }
    else { a = genNum(st.intDigits, rndI(st.rmin, st.rmax)); b = genNum(st.intDigits, rndI(st.rmin, st.rmax)); }
    return { a: a, b: b, ans: addDec(a, b) };
  }

  /* ---------- ตารางกล่องต่อหลัก (จัดจุดทศนิยมตรงกัน) ---------- */
  function calcGrid(p, showAns, opSym) {
    var m = metrics([p.a, p.b, p.ans]), mi = m.mi, mf = m.mf, ncols = mi + (mf > 0 ? 1 : 0) + mf;
    function cells(o, isOp, isAns) {
      var ipStr = '' + o.ip, out = '<td class="op">' + (isOp ? opSym : '') + '</td>', c, idx, ch;
      for (c = 0; c < mi; c++) { idx = c - (mi - ipStr.length); ch = idx >= 0 ? ipStr.charAt(idx) : ''; out += ch !== '' ? '<td class="db' + (isAns ? ' ans' : '') + '">' + (isAns && !showAns ? '' : ch) + '</td>' : '<td></td>'; }
      if (mf > 0) out += '<td class="pt">' + (o.dp > 0 ? '.' : '') + '</td>';
      var fpStr = o.dp > 0 ? (rep('0', o.dp) + o.fp).slice(-o.dp) : '';
      for (c = 0; c < mf; c++) { ch = c < fpStr.length ? fpStr.charAt(c) : ''; out += ch !== '' ? '<td class="db' + (isAns ? ' ans' : '') + '">' + (isAns && !showAns ? '' : ch) + '</td>' : '<td></td>'; }
      return out;
    }
    return '<table class="calcT">'
      + '<tr>' + cells(p.a, false, false) + '</tr>'
      + '<tr>' + cells(p.b, true, false) + '</tr>'
      + '<tr class="lnrow"><td></td><td colspan="' + ncols + '" class="ln"></td></tr>'
      + '<tr>' + cells(p.ans, false, true) + '</tr></table>';
  }

  /* ---------- CSS เอกสารพิมพ์ ---------- */
  function printCSS(ac) {
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
      + '.qr img{width:80px;height:80px;display:block}.qr .cap{font-size:9px;color:#888}'
      + '.dot{border-bottom:1px dotted #555;display:inline-block;min-width:60px}'
      + '.page{position:relative;display:flex;flex-direction:column;height:277mm;overflow:hidden}'
      + '.page.brk{page-break-before:always}'
      + '.conthd{border-bottom:2px solid ' + ac + ';color:' + ac + ';font-weight:700;font-size:18px;padding-bottom:6px;margin-bottom:12px}'
      + '.conthd span{font-weight:400;font-size:13px;color:#999}'
      + '.grid{display:grid;gap:8px 16px;flex:1;align-content:space-evenly}'
      + '.pb{display:flex;gap:8px;padding:4px;break-inside:avoid;align-items:flex-start}'
      + '.pb .no{font-weight:700;color:' + ac + ';min-width:24px;font-size:19px;padding-top:4px}'
      + '.calcT{border-collapse:collapse}'
      + '.calcT td{width:8.5mm;height:8.5mm;text-align:center;font-size:22px;padding:0;line-height:8.5mm}'
      + '.calcT td.db{border:1.5px solid #333}'
      + '.calcT td.op{width:8mm;color:' + ac + ';font-weight:700;font-size:24px;text-align:right;padding-right:3px}'
      + '.calcT td.pt{width:4mm;vertical-align:bottom;font-weight:700;font-size:22px;line-height:1}'
      + '.calcT td.ln{border-bottom:2.5px solid #333;height:3px;padding:0}'
      + '.calcT td.ans{color:' + ac + '}'
      + '.foot{margin-top:10px;text-align:center;font-size:11px;color:#777;border-top:1px solid #eee;padding-top:6px}';
  }
  function headHTML(o) {
    var qr = o.qrImg ? '<div class="qr"><img src="' + o.qrImg + '"><div class="cap">สแกนดูเฉลย</div></div>' : '';
    return '<div class="hd">' + qr
      + '<div class="top"><img class="logo" src="' + (o.logo || LOGO) + '"><div><div class="ttl">' + esc(o.title) + '</div>'
      + '<div style="font-size:12px;color:' + o.accent + '">' + esc(o.org || '') + (o.org ? ' &middot; ' : '') + 'ชุดที่ ' + esc(o.setId) + ' &middot; ' + esc(o.sub) + '</div></div></div>'
      + '<div class="nm">ชื่อ <span class="dot" style="min-width:200px"></span> ชั้น <span class="dot" style="min-width:50px"></span> เลขที่ <span class="dot" style="min-width:40px"></span></div>'
      + '<div class="meta"><span>วันที่ <span class="dot" style="min-width:40px"></span> เดือน <span class="dot" style="min-width:80px"></span> พ.ศ. <span class="dot" style="min-width:50px"></span></span>'
      + '<span class="box">เวลาที่ใช้ทำ <span class="dot" style="min-width:50px;border-color:' + o.accent + '"></span> นาที</span>'
      + '<span class="box">คะแนนที่ได้ <span class="dot" style="min-width:55px;border-color:' + o.accent + '"></span></span></div></div>';
  }
  function sheetHTML(o, withKey) {
    var PER = 10, i, cols = 2, pages = [];
    for (i = 0; i < o.probs.length; i += PER) pages.push(o.probs.slice(i, i + PER));
    var total = pages.length;
    var body = pages.map(function (chunk, pi) {
      var cells = chunk.map(function (p, j) {
        return '<div class="pb"><span class="no">' + (pi * PER + j + 1) + ')</span>' + calcGrid(p, withKey, o.opSym) + '</div>';
      }).join('');
      var grid = '<div class="grid" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cells + '</div>';
      var header = pi === 0
        ? headHTML(o) + (withKey ? '<div style="text-align:center;color:' + o.accent + ';font-weight:700;margin:2px 0 6px">★ ฉบับเฉลย (แสดงวิธีตั้งหลัก) ★</div>' : '')
        : '<div class="conthd">' + esc(o.title) + ' <span>· ชุด ' + esc(o.setId) + ' · หน้า ' + (pi + 1) + '/' + total + '</span></div>';
      var foot = (pi === total - 1) ? '<div class="foot">' + FOOTER + '</div>' : '';
      return '<div class="page' + (pi > 0 ? ' brk' : '') + '">' + header + grid + foot + '</div>';
    }).join('');
    return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>' + esc(o.title) + '</title><style>' + printCSS(o.accent) + '</style></head><body>' + body + '</body></html>';
  }
  function printDoc(html) {
    var f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { } setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1200); }, 450);
  }

  /* ---------- จับเวลาเต็มจอ ---------- */
  var TM = { el: null, left: 0, run: false, iv: null, mins: 10, reset: null };
  function tmOpen() {
    if (!TM.el) {
      var w = document.createElement('div');
      w.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(120% 120% at 50% 0%,#101426,#05070f);color:#fff;font-family:inherit';
      w.innerHTML = '<button id="dTmX" style="position:absolute;top:18px;right:22px;background:none;border:0;color:#7c8497;font-size:30px;cursor:pointer">&times;</button>'
        + '<div id="dTmM" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;justify-content:center"></div>'
        + '<div id="dTmD" style="font-weight:800;font-size:clamp(72px,20vw,260px);line-height:1;color:#34d399;font-variant-numeric:tabular-nums">10:00</div>'
        + '<div style="display:flex;gap:14px;margin-top:26px"><button id="dTmGo" style="font-size:22px;padding:14px 40px;border-radius:14px;border:0;background:#34d399;color:#04130d;font-weight:700;cursor:pointer">เริ่ม</button>'
        + '<button id="dTmR" style="font-size:22px;padding:14px 34px;border-radius:14px;border:1px solid #3a4356;background:transparent;color:#cfd6e4;cursor:pointer">รีเซ็ต</button></div>';
      document.body.appendChild(w);
      var disp = $('#dTmD', w), go = $('#dTmGo', w);
      function draw() { disp.textContent = pad2(Math.floor(TM.left / 60)) + ':' + pad2(TM.left % 60); }
      function stop() { TM.run = false; if (TM.iv) { clearInterval(TM.iv); TM.iv = null; } go.textContent = 'เริ่ม'; go.style.background = '#34d399'; go.style.color = '#04130d'; }
      function reset() { stop(); TM.left = TM.mins * 60; draw(); disp.style.color = '#34d399'; }
      function tick() { if (TM.left <= 0) { stop(); disp.style.color = '#ef4444'; disp.textContent = '00:00'; return; } TM.left--; draw(); if (TM.left <= 30) disp.style.color = '#fbbf24'; if (TM.left <= 10) disp.style.color = '#ef4444'; }
      var bar = $('#dTmM', w);
      [5, 10, 15, 20, 30].forEach(function (m) { var b = document.createElement('button'); b.textContent = m + ' น.'; b.style.cssText = 'padding:7px 16px;border-radius:999px;border:1px solid #3a4356;background:transparent;color:#cfd6e4;cursor:pointer;font-size:14px'; b.onclick = function () { TM.mins = m; reset(); $$('#dTmM button', w).forEach(function (x) { x.style.background = 'transparent'; x.style.color = '#cfd6e4'; }); b.style.background = '#34d399'; b.style.color = '#04130d'; }; if (m === TM.mins) { b.style.background = '#34d399'; b.style.color = '#04130d'; } bar.appendChild(b); });
      go.onclick = function () { if (TM.run) stop(); else { if (TM.left <= 0) reset(); TM.run = true; go.textContent = 'หยุด'; go.style.background = '#fbbf24'; go.style.color = '#1a1300'; TM.iv = setInterval(tick, 1000); } };
      $('#dTmR', w).onclick = reset; $('#dTmX', w).onclick = function () { stop(); w.style.display = 'none'; };
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && w.style.display === 'flex') { stop(); w.style.display = 'none'; } });
      TM.el = w; TM.reset = reset; reset();
    }
    TM.reset(); TM.el.style.display = 'flex';
  }

  /* ---------- CSS พรีวิว ---------- */
  function ensureCSS() {
    if ($('#efDecCSS')) return;
    var s = document.createElement('style'); s.id = 'efDecCSS';
    s.textContent = ''
      + '.dc-field{display:flex;flex-direction:column;gap:5px}.dc-field label{font-size:13px;color:var(--muted)}'
      + '.dc-field select,.dc-field input{padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt);font:inherit}'
      + '.dc-inline{display:flex;gap:8px;align-items:center;color:var(--muted);font-size:14px}'
      + '.dc-inline select{flex:1;min-width:0}'
      + '.dc-row{display:flex;gap:6px;align-items:center;color:var(--muted);font-size:14px;margin-top:6px}'
      + '.dc-row .lbl{min-width:52px}.dc-row input{width:64px;text-align:center}.dc-row select{padding:8px}'
      + '.dc-prev{display:grid;gap:12px 18px;margin-top:14px;grid-template-columns:repeat(2,1fr)}'
      + '.dc-pb{display:flex;gap:10px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--bg2);align-items:flex-start}'
      + '.dc-pb .no{font-weight:700;color:var(--accent);min-width:22px;padding-top:4px}'
      + '.dc-pb .calcT{border-collapse:collapse}'
      + '.dc-pb .calcT td{width:27px;height:27px;text-align:center;font-size:19px;padding:0}'
      + '.dc-pb .calcT td.db{border:1.5px solid var(--muted)}'
      + '.dc-pb .calcT td.op{width:24px;color:var(--accent);font-weight:700;font-size:21px;text-align:right;padding-right:3px}'
      + '.dc-pb .calcT td.pt{width:12px;vertical-align:bottom;font-weight:700}'
      + '.dc-pb .calcT td.ln{border-bottom:2px solid var(--muted);height:2px;padding:0}'
      + '.dc-pb .calcT td.ans{color:var(--accent)}'
      + '.dctile{--tile:var(--accent);position:relative;border:0;cursor:pointer;color:#fff;border-radius:22px;background:linear-gradient(150deg,var(--tile),color-mix(in srgb,var(--tile) 55%,#000));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:170px;height:170px}'
      + '.dctile.on{animation:dcBreathe 2.6s ease-in-out infinite}'
      + '.dctile.sub{--tile:#16a34a}.dctile.mul{--tile:#7c3aed}.dctile.div{--tile:#2563eb}'
      + '.dctile.soon{opacity:.45;cursor:not-allowed;filter:grayscale(.3)}'
      + '.dctile .soon-tag{position:absolute;top:8px;right:10px;background:rgba(0,0,0,.35);border-radius:8px;font-size:11px;padding:2px 7px}'
      + '@keyframes dcBreathe{0%,100%{box-shadow:0 8px 22px color-mix(in srgb,var(--tile) 30%,transparent)}50%{box-shadow:0 10px 30px color-mix(in srgb,var(--tile) 45%,transparent),0 0 40px 6px color-mix(in srgb,var(--tile) 55%,transparent)}}'
      + '@media (prefers-reduced-motion:reduce){.dctile.on{animation:none}}';
    document.head.appendChild(s);
  }

  var OPS = { add: { op: '+', accent: '#c0392b', word: 'การบวก', pre: 'DA' } };

  window.Platform.register({
    id: 'decimal',
    title: 'แบบฝึกหัดทศนิยม',
    icon: 'ti-decimal',
    mount: function (host, svc) {
      ensureCSS();
      var st = { op: 'add', mode: 'range', rmin: 0, rmax: 3, intDigits: 3, intA: 2, dpA: 1, intB: 3, dpB: 2, count: 10, title: '', setId: '', showKey: false, probs: [] };
      function K() { return OPS[st.op]; }
      function newSetId() { var d = new Date(); return K().pre + String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + rndI(100, 999); }
      function modeWord() { return st.mode === 'custom' ? ('กำหนดเอง · ตัวตั้ง ' + st.intA + ' หลัก ' + st.dpA + ' ตำแหน่ง · ตัวบวก ' + st.intB + ' หลัก ' + st.dpB + ' ตำแหน่ง') : ('สุ่ม ' + st.rmin + '–' + st.rmax + ' ตำแหน่ง · ' + st.intDigits + ' หลัก'); }
      function defTitle() { return st.title || ('แบบฝึก' + K().word + 'ทศนิยม'); }
      function opt(v, label, cur) { return '<option value="' + v + '"' + (v == cur ? ' selected' : '') + '>' + label + '</option>'; }
      function dpShort(cur) { return [0, 1, 2, 3].map(function (n) { return opt(n, n + '', cur); }).join(''); }

      function renderHome() {
        function tile(op, ic, label, active) {
          return '<button class="dctile ' + op + (active ? ' on' : ' soon') + '" data-op="' + op + '"' + (active ? '' : ' disabled') + '>'
            + (active ? '' : '<span class="soon-tag">เร็ว ๆ นี้</span>')
            + '<i class="ti ' + ic + '" style="font-size:48px"></i><span style="font-size:1.05rem;font-weight:700">' + label + '</span></button>';
        }
        host.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:36px 16px;min-height:340px">'
          + '<div class="eyebrow" style="text-align:center">แบบฝึกหัดทศนิยม — เลือกการดำเนินการ</div>'
          + '<div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">'
          + tile('add', 'ti-plus', 'การบวก', true) + tile('sub', 'ti-minus', 'การลบ', false)
          + tile('mul', 'ti-x', 'การคูณ', false) + tile('div', 'ti-divide', 'การหาร', false)
          + '</div><div style="color:var(--muted);font-size:.86rem;text-align:center">ตอนนี้เปิดใช้ “การบวก” ก่อน — ที่เหลือกำลังพัฒนา</div></div>';
        $$('.dctile', host).forEach(function (b) {
          b.onclick = function () { if (b.dataset.op === 'add') { st.op = 'add'; st.probs = []; renderAdd(); } else if (svc.toast) svc.toast('info', 'อยู่ระหว่างพัฒนา จะเปิดให้ใช้เร็ว ๆ นี้'); };
        });
      }

      function renderAdd() {
        host.innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-ghost" id="dBack"><i class="ti ti-arrow-left"></i> กลับ</button></div>'
          + '<div class="grid-main" style="display:grid;gap:22px;grid-template-columns:340px 1fr">'
          + '<section><div class="panel" style="padding:18px;display:flex;flex-direction:column;gap:14px">'
          + '<div class="eyebrow">ตั้งค่าชุดแบบฝึก' + K().word + 'ทศนิยม</div>'
          + '<div class="dc-field"><label>โหมดกำหนดตำแหน่ง</label><select id="dMode">' + opt('range', 'สุ่มช่วง 0–3 ตำแหน่ง', st.mode) + opt('custom', 'กำหนดหลักเองทุกจุด', st.mode) + '</select></div>'
          + '<div class="dc-field" id="dRangeBox"' + (st.mode === 'range' ? '' : ' style="display:none"') + '>'
          + '<label>สุ่มตำแหน่งทศนิยม</label><div class="dc-inline"><select id="dRmin">' + dpShort(st.rmin) + '</select><span>ถึง</span><select id="dRmax">' + dpShort(st.rmax) + '</select><span>ตำแหน่ง</span></div>'
          + '<label style="margin-top:8px">จำนวนหลักหน้าจุด (จำนวนเต็ม)</label><input id="dInt" type="number" min="1" max="7" value="' + st.intDigits + '"></div>'
          + '<div class="dc-field" id="dCustomBox"' + (st.mode === 'custom' ? '' : ' style="display:none"') + '>'
          + '<label>กำหนดหลักเอง (หลักหน้าจุด · ตำแหน่งทศนิยม)</label>'
          + '<div class="dc-row"><span class="lbl">ตัวตั้ง</span><input id="dIntA" type="number" min="1" max="7" value="' + st.intA + '"> หลัก <select id="dDpA">' + dpShort(st.dpA) + '</select> ตำแหน่ง</div>'
          + '<div class="dc-row"><span class="lbl">ตัวบวก</span><input id="dIntB" type="number" min="1" max="7" value="' + st.intB + '"> หลัก <select id="dDpB">' + dpShort(st.dpB) + '</select> ตำแหน่ง</div></div>'
          + '<div class="dc-field"><label>จำนวนข้อ</label><select id="dCount">' + [8, 10, 16, 20].map(function (n) { return opt(n, n + ' ข้อ', st.count); }).join('') + '</select></div>'
          + '<div class="dc-field"><label>ชื่อชุด (เว้นว่างได้)</label><input id="dTitle" value="' + esc(st.title) + '" placeholder="เช่น การบวกทศนิยม ชุดที่ 1"></div>'
          + '<button class="btn btn-accent" id="dGen"><i class="ti ti-refresh"></i> สร้างชุดแบบฝึก</button>'
          + '<button class="btn btn-ghost" id="dTimer"><i class="ti ti-clock"></i> จับเวลาเต็มจอ</button>'
          + '</div></section><section id="dOut"></section></div>';
        $('#dBack', host).onclick = renderHome;
        $('#dTimer', host).onclick = tmOpen;
        $('#dMode', host).onchange = function () { st.mode = this.value; $('#dRangeBox', host).style.display = this.value === 'range' ? '' : 'none'; $('#dCustomBox', host).style.display = this.value === 'custom' ? '' : 'none'; };
        $('#dGen', host).onclick = function () {
          st.mode = $('#dMode', host).value;
          st.rmin = clampI($('#dRmin', host).value, 0, 3, 0); st.rmax = clampI($('#dRmax', host).value, 0, 3, 3); if (st.rmax < st.rmin) { var t = st.rmin; st.rmin = st.rmax; st.rmax = t; }
          st.intDigits = clampI($('#dInt', host).value, 1, 7, 3);
          st.intA = clampI($('#dIntA', host).value, 1, 7, 2); st.dpA = clampI($('#dDpA', host).value, 0, 3, 1);
          st.intB = clampI($('#dIntB', host).value, 1, 7, 3); st.dpB = clampI($('#dDpB', host).value, 0, 3, 2);
          st.count = +$('#dCount', host).value; st.title = $('#dTitle', host).value.trim();
          st.setId = newSetId(); st.showKey = false;
          st.probs = []; for (var i = 0; i < st.count; i++) st.probs.push(genProblem(st));
          renderOut();
          if (svc.toast) svc.toast('success', 'สร้าง ' + st.count + ' ข้อแล้ว');
        };
        renderOut();
      }

      function renderOut() {
        var out = $('#dOut', host); if (!out) return;
        if (!st.probs.length) { out.innerHTML = '<div class="panel" style="padding:30px;text-align:center;color:var(--muted)">เลือกค่าทางซ้าย แล้วกด “สร้างชุดแบบฝึก”</div>'; return; }
        var cells = st.probs.map(function (p, i) { return '<div class="dc-pb"><span class="no">' + (i + 1) + ')</span>' + calcGrid(p, st.showKey, K().op) + '</div>'; }).join('');
        out.innerHTML = '<div class="panel" style="padding:18px">'
          + '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:8px">'
          + '<div><div class="eyebrow">ตัวอย่างก่อนพิมพ์</div><div class="font-display" style="font-weight:800;font-size:1.2rem">' + esc(defTitle()) + ' <span style="font-size:.78rem;color:var(--muted)">ชุด ' + esc(st.setId) + '</span></div></div>'
          + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
          + '<button class="btn btn-ghost" id="dKey"><i class="ti ti-eye"></i> ' + (st.showKey ? 'ซ่อนเฉลย' : 'ดูเฉลย') + '</button>'
          + '<button class="btn btn-ghost" id="dPrintK"><i class="ti ti-printer"></i> พิมพ์พร้อมเฉลย</button>'
          + '<button class="btn btn-accent" id="dPrint"><i class="ti ti-printer"></i> พิมพ์ใบงาน</button></div></div>'
          + '<div class="dc-prev">' + cells + '</div></div>';
        $('#dKey', host).onclick = function () { st.showKey = !st.showKey; renderOut(); };
        $('#dPrint', host).onclick = function () { doPrint(false); };
        $('#dPrintK', host).onclick = function () { doPrint(true); };
      }

      function doPrint(withKey) {
        var S = svc.settings || {}, cur = K();
        var o = { title: defTitle(), setId: st.setId, opSym: cur.op, sub: cur.word + ' · ' + modeWord(),
          accent: cur.accent, org: S.org || '', logo: S.logo || LOGO, probs: st.probs, qrImg: '' };
        var finish = function (qrImg) { o.qrImg = qrImg || ''; printDoc(sheetHTML(o, withKey)); if (svc.toast) svc.toast('success', withKey ? 'เปิดหน้าพิมพ์ฉบับเฉลยแล้ว' : 'เปิดหน้าพิมพ์ใบงานแล้ว'); };
        if (!withKey && svc.makeQR && svc.keyURL) {
          var answers = st.probs.map(function (p) { return showNum(p.a) + ' + ' + showNum(p.b) + ' = ' + showNum(p.ans); });
          svc.makeQR(svc.keyURL(o.title, st.setId, answers)).then(function (img) { finish(img); }, function () { finish(''); });
        } else finish('');
      }

      renderHome();
    }
  });
})();
