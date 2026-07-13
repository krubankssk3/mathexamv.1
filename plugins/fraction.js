/*** EduForge plugin — แบบฝึกหัดเศษส่วน *********************************
 * แบ่งเป็น บวก / ลบ / คูณ / หาร (เศษส่วน) — เริ่มเปิดใช้ "การบวก" ก่อน
 *
 * การบวกเศษส่วน มี 3 ประเภท:
 *   1) เศษส่วน + เศษส่วน   2) เศษส่วน + จำนวนคละ   3) จำนวนคละ + จำนวนคละ
 * เศษส่วนธรรมดา = เศษแท้ (น<ส) หรือ เศษเกิน (น>ส) ก็ได้ · จำนวนคละมีเศษส่วนแท้
 * เลือกตัวส่วน "เท่ากัน / ไม่เท่ากัน" · เฉลยบอกคำตอบ + ต่อท้ายรูปอย่างต่ำถ้าทอนได้
 * A4 พอดีหน้า · เฉลย (inline/พิมพ์พร้อมเฉลย/QR) · จับเวลา · ช่องเวลาที่ใช้
 ***********************************************************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var LOGO = 'https://img2.pic.in.th/pic/Logo-7aecb8e321ff2955.png';
  var FOOTER = 'พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3';
  function rndI(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function lcm(a, b) { return a / gcd(a, b) * b; }

  /* ---------- โครงเศษส่วน/จำนวนคละ + คำตอบ ---------- */
  function toImproper(o) { return { n: (o.w || 0) * o.d + o.n, d: o.d }; }
  function fracVal(o) { var I = toImproper(o); return I.n / I.d; }
  function computeAnswer(a, b, op) {
    op = op || 'add';
    if (op === 'mul') {                                     // คูณ: เศษคูณ/ส่วนคูณ แล้วทอน
      var Nn = a.n * b.n, Nd = a.d * b.d, chainM = [], gm;
      chainM.push({ t: 'frac', n: Nn, d: Nd });
      gm = gcd(Nn, Nd); var Mr = Nn, Dm = Nd;
      if (gm > 1) { Mr = Nn / gm; Dm = Nd / gm; chainM.push(Dm === 1 ? { t: 'whole', w: Mr } : { t: 'frac', n: Mr, d: Dm }); }
      if (Dm > 1 && Mr > Dm) chainM.push({ t: 'mixed', w: Math.floor(Mr / Dm), n: Mr % Dm, d: Dm });
      return { a: a, b: b, chain: chainM };
    }
    if (op === 'div') {                                     // หาร: a/b ÷ c/d = a/b × d/c = (a·d)/(b·c) แล้วทอน
      var Dn = a.n * b.d, Dd = a.d * b.n, chd = [], gd;
      chd.push({ t: 'frac', n: Dn, d: Dd });
      gd = gcd(Dn, Dd); var Er = Dn, Fd = Dd;
      if (gd > 1) { Er = Dn / gd; Fd = Dd / gd; chd.push(Fd === 1 ? { t: 'whole', w: Er } : { t: 'frac', n: Er, d: Fd }); }
      if (Fd > 1 && Er > Fd) chd.push({ t: 'mixed', w: Math.floor(Er / Fd), n: Er % Fd, d: Fd });
      return { a: a, b: b, chain: chd };
    }
    if (op === 'sub' && fracVal(a) < fracVal(b)) { var t = a; a = b; b = t; }   // ลบ: ให้ตัวตั้ง ≥ ตัวลบ (กันติดลบ)
    var A = toImproper(a), B = toImproper(b), D = lcm(A.d, B.d);
    var N = (op === 'sub') ? (A.n * (D / A.d) - B.n * (D / B.d)) : (A.n * (D / A.d) + B.n * (D / B.d));
    var isMixed = (a.type === 'mixed' || b.type === 'mixed'), chain = [], g;
    if (N === 0) { chain.push({ t: 'whole', w: 0 }); return { a: a, b: b, chain: chain }; }
    if (isMixed) {
      var W = Math.floor(N / D), n = N % D;
      chain.push(n === 0 ? { t: 'whole', w: W } : (W === 0 ? { t: 'frac', n: n, d: D } : { t: 'mixed', w: W, n: n, d: D }));
      if (n > 0) { g = gcd(n, D); if (g > 1) chain.push(D / g === 1 ? { t: 'whole', w: W + n / g } : (W === 0 ? { t: 'frac', n: n / g, d: D / g } : { t: 'mixed', w: W, n: n / g, d: D / g })); }
    } else {
      chain.push({ t: 'frac', n: N, d: D });                 // คำตอบดิบ (บนตัวส่วนร่วม)
      g = gcd(N, D); var Nr = N, Dr = D;
      if (g > 1) { Nr = N / g; Dr = D / g; chain.push(Dr === 1 ? { t: 'whole', w: Nr } : { t: 'frac', n: Nr, d: Dr }); }  // ทอนอย่างต่ำ
      if (Dr > 1 && Nr > Dr) chain.push({ t: 'mixed', w: Math.floor(Nr / Dr), n: Nr % Dr, d: Dr });                    // เศษเกิน → จำนวนคละ
    }
    return { a: a, b: b, chain: chain };
  }

  /* ---------- เรนเดอร์ HTML ---------- */
  function fracHTML(n, d) { return '<span class="fr"><span class="fn">' + n + '</span><span class="fd">' + d + '</span></span>'; }
  function mixedHTML(w, n, d) { return '<span class="mx"><span class="mw">' + w + '</span>' + fracHTML(n, d) + '</span>'; }
  function operandHTML(o) { return o.type === 'mixed' ? mixedHTML(o.w, o.n, o.d) : fracHTML(o.n, o.d); }
  function structHTML(s) {
    if (s.t === 'whole') return '<span class="mw">' + s.w + '</span>';
    if (s.t === 'mixed') return mixedHTML(s.w, s.n, s.d);
    return fracHTML(s.n, s.d);
  }
  function answerHTML(ans) { return ans.chain.map(structHTML).join('<span class="eq">=</span>'); }

  /* ---------- สุ่มโจทย์ ---------- */
  function coprime(a, b) { return gcd(a, b) === 1; }
      function genDenSame(level) { var m = level === 'easy' ? 20 : level === 'medium' ? 40 : 80; return rndI(2, m); }
  // ตัวส่วนต่างกันตามระดับ — ง่าย: พหุคูณ ≤50 (เปลี่ยนตัวหนึ่งเป็นอีกตัว)
  //   กลาง: ค.ร.น. ต้องคิด ≤500 · ยาก: ≤1000 (คุม cofactor เล็กให้ยังคิดไหว)
  function genDenPairDiff(level) {
    if (level === 'easy') {
      var base = rndI(2, 24), kmax = Math.min(6, Math.floor(50 / base)); if (kmax < 2) kmax = 2;
      var big = base * rndI(2, kmax);
      return Math.random() < 0.5 ? [base, big] : [big, base];
    }
    var max = level === 'hard' ? 499 : 99, coMax = level === 'hard' ? 12 : 9;
    var gMax = Math.max(2, Math.floor(max / coMax)), g, a, b, guard = 0;
    do {
      g = rndI(2, gMax);
      do { a = rndI(2, coMax); b = rndI(2, coMax); } while (a === b || !coprime(a, b));
      guard++;
    } while ((g * a > max || g * b > max) && guard < 400);
    return [g * a, g * b];
  }
  function genFrac(d, nmin, nmax) {
    if (nmin != null) return { type: 'frac', n: rndI(Math.max(1, nmin), Math.max(1, nmax)), d: d };
    var im = Math.random() < 0.4; return { type: 'frac', n: im ? rndI(d + 1, 2 * d - 1) : rndI(1, d - 1), d: d };
  }
  function genMixedNum(d, nmin, nmax) {
    var n;
    if (nmin != null) { var lo = Math.min(Math.max(1, nmin), d - 1), hi = Math.min(Math.max(1, nmax), d - 1); if (hi < lo) hi = lo; n = rndI(lo, hi); }
    else n = rndI(1, d - 1);
    return { type: 'mixed', w: rndI(1, 9), n: n, d: d };
  }
  // กำหนดช่วงเอง: เลือกตัวประกอบร่วม g ที่มีพหุคูณ ≥2 ตัวในช่วง แล้วหยิบ 2 พหุคูณต่างกัน → gcd>1 และอยู่ในช่วงเสมอ
  function genDenPairCustom(min, max) {
    if (min < 2) min = 2; if (max < min) max = min;
    var gs = []; [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(function (g) { if (Math.floor(max / g) - Math.ceil(min / g) >= 1) gs.push(g); });
    if (!gs.length) { var x = rndI(min, max), y = x === max ? x - 1 : x + 1; return [x, Math.max(min, Math.min(max, y))]; }
    var g = gs[rndI(0, gs.length - 1)], lo = Math.ceil(min / g), hi = Math.floor(max / g);
    var k1 = rndI(lo, hi), k2 = rndI(lo, hi), guard = 0; while (k2 === k1 && guard < 50) { k2 = rndI(lo, hi); guard++; }
    return [g * k1, g * k2];
  }
  function genProblem(kind, sameDenom, level, dmin, dmax, op, nmin, nmax) {
    var cust = (level === 'custom'), nn = cust ? nmin : null, nx = cust ? nmax : null;
    if (kind === 'mix') kind = (op === 'mul' || op === 'div') ? (Math.random() < 0.5 ? 'cancel' : 'nocancel') : ['ff', 'fm', 'mm'][rndI(0, 2)];   // ผสม: สุ่มต่อข้อ
    if (op === 'mul') {                                     // คูณ: ประเภท = ตัดไขว้ได้/ไม่ได้
      var pr;
      if (cust) pr = genMulCustom(kind, dmin, dmax, nmin, nmax);   // กำหนดช่วงตัวเศษ+ตัวส่วนเอง
      else { var r = mulRange(level, dmin, dmax); pr = (kind === 'cancel') ? genMulCancel(r[0], r[1]) : genMulNoCancel(r[0], r[1]); }
      var rm = computeAnswer(pr.a, pr.b, 'mul');
      return { a: rm.a, b: rm.b, ans: { chain: rm.chain } };
    }
    if (op === 'div') {                                     // หาร: ประเภท = ตัดไขว้ (หลังกลับตัวหาร) ได้/ไม่ได้
      var prd;
      if (cust) prd = genDivCustom(kind, dmin, dmax, nmin, nmax);
      else { var rd0 = mulRange(level, dmin, dmax); prd = (kind === 'cancel') ? genDivCancel(rd0[0], rd0[1]) : genDivNoCancel(rd0[0], rd0[1]); }
      var rd = computeAnswer(prd.a, prd.b, 'div');
      return { a: rd.a, b: rd.b, ans: { chain: rd.chain } };
    }
    var d1, d2;
    if (sameDenom) { var d = cust ? rndI(dmin, dmax) : genDenSame(level); d1 = d; d2 = d; }
    else { var prr = cust ? genDenPairCustom(dmin, dmax) : genDenPairDiff(level); d1 = prr[0]; d2 = prr[1]; }
    var a, b;
    if (kind === 'ff') { a = genFrac(d1, nn, nx); b = genFrac(d2, nn, nx); }
    else if (kind === 'fm') { a = genFrac(d1, nn, nx); b = genMixedNum(d2, nn, nx); }
    else { a = genMixedNum(d1, nn, nx); b = genMixedNum(d2, nn, nx); }
    var res = computeAnswer(a, b, op);       // อาจสลับ a,b (กรณีลบ กันติดลบ)
    return { a: res.a, b: res.b, ans: { chain: res.chain } };
  }

  /* ---------- การคูณ: ช่วงตัวส่วนตามระดับ + สุ่มแบบตัดไขว้ได้/ไม่ได้ (เศษส่วนแท้อย่างต่ำ) ---------- */
  function mulRange(level, dmin, dmax) {
    if (level === 'custom') return [Math.max(2, dmin), Math.max(2, dmax)];
    return level === 'easy' ? [2, 10] : level === 'medium' ? [2, 20] : [2, 40];
  }
  function genLowestFrac(min, max) { var d, n; do { d = rndI(Math.max(2, min), max); n = rndI(1, d - 1); } while (gcd(n, d) !== 1); return { type: 'frac', n: n, d: d }; }
  function crossCancel(a, b) { return gcd(a.n, b.d) > 1 || gcd(b.n, a.d) > 1; }   // ตัดไขว้ได้ไหม
  function anyCancel(a, b) { return gcd(a.n, a.d) > 1 || gcd(b.n, b.d) > 1 || gcd(a.n, b.d) > 1 || gcd(b.n, a.d) > 1; }
  // หาร: ตัดไขว้หลังกลับตัวหาร = ตัวเศษคู่กัน (a.n,b.n) หรือ ตัวส่วนคู่กัน (a.d,b.d)
  function crossDiv(a, b) { return gcd(a.n, b.n) > 1 || gcd(a.d, b.d) > 1; }
  function anyCancelDiv(a, b) { return gcd(a.n, a.d) > 1 || gcd(b.n, b.d) > 1 || gcd(a.n, b.n) > 1 || gcd(a.d, b.d) > 1; }
  function genDivNoCancel(min, max) { var a, b, g = 0; do { a = genLowestFrac(min, max); b = genLowestFrac(min, max); g++; } while (crossDiv(a, b) && g < 300); return { a: a, b: b }; }
  function genDivCancel(min, max) {
    var g = 0;
    do {
      var f = rndI(2, 5), numMode = Math.random() < 0.5, a, b, t1, t2, ad, bd, an, bn;
      if (numMode) {                                        // ตัวเศษคู่กัน
        an = f * rndI(1, Math.max(1, Math.floor((max - 1) / f))); bn = f * rndI(1, Math.max(1, Math.floor((max - 1) / f))); if (an < 1) an = f; if (bn < 1) bn = f;
        t1 = 0; do { ad = rndI(an + 1, Math.max(an + 1, max)); t1++; } while (gcd(an, ad) !== 1 && t1 < 60);
        t2 = 0; do { bd = rndI(bn + 1, Math.max(bn + 1, max)); t2++; } while (gcd(bn, bd) !== 1 && t2 < 60);
        a = { type: 'frac', n: an, d: ad }; b = { type: 'frac', n: bn, d: bd };
      } else {                                              // ตัวส่วนคู่กัน
        ad = f * rndI(1, Math.max(1, Math.floor(max / f))); bd = f * rndI(1, Math.max(1, Math.floor(max / f))); if (ad < 2) ad = f * 2; if (bd < 2) bd = f * 2;
        t1 = 0; do { an = rndI(1, ad - 1); t1++; } while (gcd(an, ad) !== 1 && t1 < 60);
        t2 = 0; do { bn = rndI(1, bd - 1); t2++; } while (gcd(bn, bd) !== 1 && t2 < 60);
        a = { type: 'frac', n: an, d: ad }; b = { type: 'frac', n: bn, d: bd };
      }
      g++;
      if (a.n < a.d && b.n < b.d && a.d <= max && b.d <= max && gcd(a.n, a.d) === 1 && gcd(b.n, b.d) === 1 && crossDiv(a, b)) return { a: a, b: b };
    } while (g < 300);
    return genDivNoCancel(min, max);
  }
  function genDivCustom(kind, dmin, dmax, nmin, nmax) {
    var want = (kind === 'cancel'), a, b, g = 0;
    function mk() { return { type: 'frac', n: rndI(Math.max(1, nmin), Math.max(1, nmax)), d: rndI(Math.max(2, dmin), Math.max(2, dmax)) }; }
    do { a = mk(); b = mk(); g++; } while (anyCancelDiv(a, b) !== want && g < 400);
    return { a: a, b: b };
  }
  // คูณ กำหนดช่วงเอง: สุ่มตัวเศษ/ตัวส่วนในช่วง แล้วเลือกให้ตัดได้ (มีตัวตัด) / ตัดไม่ได้ (ไม่มีเลย)
  function genMulCustom(kind, dmin, dmax, nmin, nmax) {
    var want = (kind === 'cancel'), a, b, g = 0;
    function mk() { return { type: 'frac', n: rndI(Math.max(1, nmin), Math.max(1, nmax)), d: rndI(Math.max(2, dmin), Math.max(2, dmax)) }; }
    do { a = mk(); b = mk(); g++; } while (anyCancel(a, b) !== want && g < 400);
    return { a: a, b: b };
  }
  function genMulNoCancel(min, max) {
    var a, b, g = 0; do { a = genLowestFrac(min, max); b = genLowestFrac(min, max); g++; } while (crossCancel(a, b) && g < 300);
    return { a: a, b: b };
  }
  function genMulCancel(min, max) {
    var g = 0;
    do {
      var f = rndI(2, 5);
      var an = f * rndI(1, Math.max(1, Math.floor((max - 1) / f))); if (an < 2) an = f;
      var bd = f * rndI(1, Math.max(1, Math.floor(max / f))); if (bd < 2) bd = f * 2;
      var ad, bn, t1 = 0, t2 = 0;
      do { ad = rndI(an + 1, Math.max(an + 1, max)); t1++; } while (gcd(an, ad) !== 1 && t1 < 60);
      do { bn = rndI(1, bd - 1); t2++; } while (gcd(bn, bd) !== 1 && t2 < 60);
      var a = { type: 'frac', n: an, d: ad }, b = { type: 'frac', n: bn, d: bd };
      g++;
      if (ad > an && bn < bd && ad <= max && bd <= max && gcd(an, ad) === 1 && gcd(bn, bd) === 1 && crossCancel(a, b)) return { a: a, b: b };
    } while (g < 300);
    return genMulNoCancel(min, max);   // สำรอง (แทบไม่เกิด)
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
      + '.grid{display:grid;gap:6px 20px;flex:1;align-content:space-evenly}'
      + '.pb{display:flex;align-items:center;gap:8px;padding:4px 2px;break-inside:avoid}'
      + '.pb .no{font-weight:700;color:' + ac + ';min-width:26px}'
      + '.ex{display:flex;align-items:center;gap:7px;flex-wrap:wrap}'
      + '.op{font-weight:700}'
      + '.fr{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.03}'
      + '.fr .fn{padding:0 5px;border-bottom:2px solid currentColor}'
      + '.fr .fd{padding:0 5px}'
      + '.mx{display:inline-flex;align-items:center;gap:3px}.mx .mw{font-weight:600}'
      + '.eq{margin:0 4px;font-weight:700}'
      + '.ansbl{border-bottom:1px dotted #999;min-width:90px;display:inline-block}'
      + '.ansk{color:' + ac + '}'
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
    var PER = 20, i, cols = 2;
    var fs = 22;   // ขนาดฟอนต์เศษส่วน
    var dyn = '.ex{font-size:' + fs + 'px}.pb .no{font-size:' + (fs - 4) + 'px}.ansbl{height:' + fs + 'px}';
    var pages = [];
    for (i = 0; i < o.probs.length; i += PER) pages.push(o.probs.slice(i, i + PER));
    var total = pages.length;
    var body = pages.map(function (chunk, pi) {
      var cells = chunk.map(function (p, j) {
        var no = pi * PER + j + 1;
        var ansCell = withKey ? '<span class="ansk">' + answerHTML(p.ans) + '</span>' : '<span class="ansbl"></span>';
        return '<div class="pb"><span class="no">' + no + ')</span><span class="ex">' + operandHTML(p.a) + '<span class="op">' + (o.opSym || '+') + '</span>' + operandHTML(p.b) + '<span class="eq">=</span>' + ansCell + '</span></div>';
      }).join('');
      var grid = '<div class="grid" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cells + '</div>';
      var header = pi === 0
        ? headHTML(o) + (withKey ? '<div style="text-align:center;color:' + o.accent + ';font-weight:700;margin:2px 0 6px">★ ฉบับเฉลย ★</div>' : '')
        : '<div class="conthd">' + esc(o.title) + ' <span>· ชุด ' + esc(o.setId) + ' · หน้า ' + (pi + 1) + '/' + total + '</span></div>';
      var foot = (pi === total - 1) ? '<div class="foot">' + FOOTER + '</div>' : '';
      return '<div class="page' + (pi > 0 ? ' brk' : '') + '">' + header + grid + foot + '</div>';
    }).join('');
    return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>' + esc(o.title) + '</title><style>' + printCSS(o.accent) + dyn + '</style></head><body>' + body + '</body></html>';
  }
  function printDoc(html) {
    var f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { } setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1200); }, 450);
  }

  /* ---------- จับเวลาเต็มจอ (สไตล์เกม 24) ---------- */
  var TM = { el: null, left: 0, run: false, iv: null, mins: 10, reset: null };
  function tmOpen() {
    if (!TM.el) {
      var w = document.createElement('div');
      w.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(120% 120% at 50% 0%,#101426,#05070f);color:#fff;font-family:inherit';
      w.innerHTML = '<button id="fTmX" style="position:absolute;top:18px;right:22px;background:none;border:0;color:#7c8497;font-size:30px;cursor:pointer">&times;</button>'
        + '<div id="fTmM" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;justify-content:center"></div>'
        + '<div id="fTmD" style="font-weight:800;font-size:clamp(72px,20vw,260px);line-height:1;color:#34d399;font-variant-numeric:tabular-nums">10:00</div>'
        + '<div style="display:flex;gap:14px;margin-top:26px"><button id="fTmGo" style="font-size:22px;padding:14px 40px;border-radius:14px;border:0;background:#34d399;color:#04130d;font-weight:700;cursor:pointer">เริ่ม</button>'
        + '<button id="fTmR" style="font-size:22px;padding:14px 34px;border-radius:14px;border:1px solid #3a4356;background:transparent;color:#cfd6e4;cursor:pointer">รีเซ็ต</button></div>';
      document.body.appendChild(w);
      var disp = $('#fTmD', w), go = $('#fTmGo', w);
      function draw() { disp.textContent = pad2(Math.floor(TM.left / 60)) + ':' + pad2(TM.left % 60); }
      function stop() { TM.run = false; if (TM.iv) { clearInterval(TM.iv); TM.iv = null; } go.textContent = 'เริ่ม'; go.style.background = '#34d399'; go.style.color = '#04130d'; }
      function reset() { stop(); TM.left = TM.mins * 60; draw(); disp.style.color = '#34d399'; }
      function tick() { if (TM.left <= 0) { stop(); disp.style.color = '#ef4444'; disp.textContent = '00:00'; return; } TM.left--; draw(); if (TM.left <= 30) disp.style.color = '#fbbf24'; if (TM.left <= 10) disp.style.color = '#ef4444'; }
      var bar = $('#fTmM', w);
      [5, 10, 15, 20, 30].forEach(function (m) { var b = document.createElement('button'); b.textContent = m + ' น.'; b.style.cssText = 'padding:7px 16px;border-radius:999px;border:1px solid #3a4356;background:transparent;color:#cfd6e4;cursor:pointer;font-size:14px'; b.onclick = function () { TM.mins = m; reset(); $$('#fTmM button', w).forEach(function (x) { x.style.background = 'transparent'; x.style.color = '#cfd6e4'; }); b.style.background = '#34d399'; b.style.color = '#04130d'; }; if (m === TM.mins) { b.style.background = '#34d399'; b.style.color = '#04130d'; } bar.appendChild(b); });
      go.onclick = function () { if (TM.run) stop(); else { if (TM.left <= 0) reset(); TM.run = true; go.textContent = 'หยุด'; go.style.background = '#fbbf24'; go.style.color = '#1a1300'; TM.iv = setInterval(tick, 1000); } };
      $('#fTmR', w).onclick = reset; $('#fTmX', w).onclick = function () { stop(); w.style.display = 'none'; };
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && w.style.display === 'flex') { stop(); w.style.display = 'none'; } });
      TM.el = w; TM.reset = reset; reset();
    }
    TM.reset(); TM.el.style.display = 'flex';
  }

  /* ---------- CSS พรีวิวในแอป ---------- */
  function ensureCSS() {
    if ($('#efFracCSS')) return;
    var s = document.createElement('style'); s.id = 'efFracCSS';
    s.textContent = ''
      + '.fr-field{display:flex;flex-direction:column;gap:5px}.fr-field label{font-size:13px;color:var(--muted)}'
      + '.fr-field select,.fr-field input{padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt);font:inherit}'
      + '.fr-prev{display:grid;gap:8px 18px;margin-top:14px;grid-template-columns:repeat(2,1fr)}'
      + '.fr-pb{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg2);font-size:22px}'
      + '.fr-pb .no{font-weight:700;color:var(--accent);min-width:24px;font-size:16px}'
      + '.fr-pb .ex{display:flex;align-items:center;gap:6px;flex-wrap:wrap}'
      + '.fr-pb .op{font-weight:700}.fr-pb .eq{margin:0 4px;font-weight:700}'
      + '.fr-pb .fr{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.03}'
      + '.fr-pb .fr .fn{padding:0 5px;border-bottom:2px solid currentColor}.fr-pb .fr .fd{padding:0 5px}'
      + '.fr-pb .mx{display:inline-flex;align-items:center;gap:3px}.fr-pb .mx .mw{font-weight:600}'
      + '.fr-pb .ansbl{border-bottom:1px dotted var(--muted);min-width:80px;display:inline-block;height:22px}'
      + '.fr-pb .ansk{color:var(--accent)}'
      + '.frtile{--tile:var(--accent);position:relative;border:0;cursor:pointer;color:#fff;border-radius:22px;background:linear-gradient(150deg,var(--tile),color-mix(in srgb,var(--tile) 55%,#000));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:170px;height:170px}'
      + '.frtile.on{animation:frBreathe 2.6s ease-in-out infinite}'
      + '.frtile.sub{--tile:#16a34a}.frtile.mul{--tile:#7c3aed}.frtile.div{--tile:#2563eb}'
      + '.frtile.soon{opacity:.45;cursor:not-allowed;filter:grayscale(.3)}'
      + '.frtile .soon-tag{position:absolute;top:8px;right:10px;background:rgba(0,0,0,.35);border-radius:8px;font-size:11px;padding:2px 7px}'
      + '@keyframes frBreathe{0%,100%{box-shadow:0 8px 22px color-mix(in srgb,var(--tile) 30%,transparent)}50%{box-shadow:0 10px 30px color-mix(in srgb,var(--tile) 45%,transparent),0 0 40px 6px color-mix(in srgb,var(--tile) 55%,transparent)}}'
      + '@media (prefers-reduced-motion:reduce){.frtile.on{animation:none}}';
    document.head.appendChild(s);
  }

  var OPS = {
    add: { op: '+', accent: '#c0392b', word: 'การบวก', pre: 'FA' },
    sub: { op: '−', accent: '#16a34a', word: 'การลบ', pre: 'FS' },
    mul: { op: '×', accent: '#7c3aed', word: 'การคูณ', pre: 'FM' },
    div: { op: '÷', accent: '#2563eb', word: 'การหาร', pre: 'FD' }
  };

  window.Platform.register({
    id: 'fraction',
    title: 'แบบฝึกหัดเศษส่วน',
    icon: 'ti-math-x-divide-y',
    mount: function (host, svc) {
      ensureCSS();
      var st = { op: 'add', kind: 'ff', same: false, level: 'medium', dmin: 2, dmax: 20, nmin: 1, nmax: 12, count: 20, title: '', setId: '', showKey: false, probs: [] };

      function K() { return OPS[st.op]; }
      function newSetId() { var d = new Date(); return K().pre + String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + rndI(100, 999); }
      function joinWord() { return st.op === 'sub' ? ' − ' : ' + '; }
      function kindWord() {
        if ((st.op === 'mul' || st.op === 'div')) return st.kind === 'cancel' ? 'ตัดกันได้ (ตัดไขว้)' : st.kind === 'nocancel' ? 'ตัดกันไม่ได้' : 'ผสม (ตัดได้+ตัดไม่ได้)';
        if (st.kind === 'mix') return 'ผสม (คละทั้ง 3 แบบ)';
        var w = st.kind === 'ff' ? 'เศษส่วน' + joinWord() + 'เศษส่วน' : st.kind === 'fm' ? 'เศษส่วน' + joinWord() + 'จำนวนคละ' : 'จำนวนคละ' + joinWord() + 'จำนวนคละ'; return w;
      }
      function levelWord() { return st.level === 'easy' ? 'ง่าย' : st.level === 'medium' ? 'ปานกลาง' : st.level === 'hard' ? 'ยาก' : ('กำหนดเอง (ตัวส่วน ' + st.dmin + '–' + st.dmax + ', ตัวเศษ ' + st.nmin + '–' + st.nmax + ')'); }
      function defTitle() { return st.title || ('แบบฝึก' + K().word + 'เศษส่วน (' + kindWord() + ')'); }
      function opt(v, label, cur) { return '<option value="' + v + '"' + (v == cur ? ' selected' : '') + '>' + label + '</option>'; }

      /* ---------- หน้าแรก: 4 ปุ่ม (เปิดบวก/ลบ) ---------- */
      function renderHome() {
        function tile(kind, ic, label, active) {
          return '<button class="frtile ' + kind + (active ? ' on' : ' soon') + '" data-op="' + kind + '"' + (active ? '' : ' disabled') + '>'
            + (active ? '' : '<span class="soon-tag">เร็ว ๆ นี้</span>')
            + '<i class="ti ' + ic + '" style="font-size:48px"></i><span style="font-size:1.05rem;font-weight:700">' + label + '</span></button>';
        }
        host.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:36px 16px;min-height:340px">'
          + '<div class="eyebrow" style="text-align:center">แบบฝึกหัดเศษส่วน — เลือกการดำเนินการ</div>'
          + '<div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">'
          + tile('add', 'ti-plus', 'การบวก', true) + tile('sub', 'ti-minus', 'การลบ', true)
          + tile('mul', 'ti-x', 'การคูณ', true) + tile('div', 'ti-divide', 'การหาร', true)
          + '</div><div style="color:var(--muted);font-size:.86rem;text-align:center">เปิดใช้ครบทั้ง บวก / ลบ / คูณ / หาร แล้ว</div></div>';
        $$('.frtile', host).forEach(function (b) {
          b.onclick = function () {
            var o = b.dataset.op;
            if (o === 'add' || o === 'sub' || o === 'mul' || o === 'div') {
              st.op = o; st.probs = [];
              if (o === 'mul' || o === 'div') { if (st.kind !== 'cancel' && st.kind !== 'nocancel' && st.kind !== 'mix') st.kind = 'cancel'; }
              else { if (st.kind !== 'ff' && st.kind !== 'fm' && st.kind !== 'mm' && st.kind !== 'mix') st.kind = 'ff'; }
              renderAdd();
            } else if (svc.toast) svc.toast('info', 'อยู่ระหว่างพัฒนา จะเปิดให้ใช้เร็ว ๆ นี้');
          };
        });
      }

      /* ---------- หน้าสร้างแบบฝึก (การบวก) ---------- */
      function renderAdd() {
        host.innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-ghost" id="fBack"><i class="ti ti-arrow-left"></i> กลับ</button></div>'
          + '<div class="grid-main" style="display:grid;gap:22px;grid-template-columns:340px 1fr">'
          + '<section><div class="panel" style="padding:18px;display:flex;flex-direction:column;gap:14px">'
          + '<div class="eyebrow">ตั้งค่าชุดแบบฝึก' + K().word + 'เศษส่วน</div>'
          + '<div class="fr-field"><label>ประเภทโจทย์</label><select id="fKind">'
          + ((st.op === 'mul' || st.op === 'div')
            ? (opt('cancel', 'ตัดกันได้ (ตัดไขว้)', st.kind) + opt('nocancel', 'ตัดกันไม่ได้', st.kind) + opt('mix', 'ผสม (ตัดได้ + ตัดไม่ได้)', st.kind))
            : (opt('ff', 'เศษส่วน' + K().op + 'เศษส่วน', st.kind) + opt('fm', 'เศษส่วน' + K().op + 'จำนวนคละ', st.kind) + opt('mm', 'จำนวนคละ' + K().op + 'จำนวนคละ', st.kind) + opt('mix', 'ผสม (คละทั้ง 3 แบบ)', st.kind)))
          + '</select></div>'
          + ((st.op === 'mul' || st.op === 'div') ? '' :
            '<div class="fr-field"><label>ตัวส่วน</label><select id="fSame">' + opt('0', 'ไม่เท่ากัน (หา ค.ร.น.)', st.same ? '1' : '0') + opt('1', 'เท่ากัน', st.same ? '1' : '0') + '</select></div>')
          + '<div class="fr-field"><label>ระดับความยาก (ตัวส่วน)</label><select id="fLevel">'
          + ((st.op === 'mul' || st.op === 'div')
            ? (opt('easy', 'ง่าย — ตัวส่วน ≤ 10', st.level) + opt('medium', 'ปานกลาง — ตัวส่วน ≤ 20', st.level) + opt('hard', 'ยาก — ตัวส่วน ≤ 40', st.level))
            : (opt('easy', 'ง่าย — เปลี่ยนตัวส่วนได้ตรง ๆ (≤ 50)', st.level) + opt('medium', 'ปานกลาง — ต้องหา ค.ร.น. (< 100)', st.level) + opt('hard', 'ยาก — หา ค.ร.น. เลขใหญ่ (< 500)', st.level)))
          + opt('custom', 'กำหนดเอง — ระบุช่วงตัวส่วน', st.level) + '</select></div>'
          + '<div class="fr-field" id="fRangeBox"' + (st.level === 'custom' ? '' : ' style="display:none"') + '><label>กำหนดช่วงเอง</label>'
          + '<div style="display:flex;gap:8px;align-items:center;color:var(--muted);margin-bottom:6px">ตัวส่วน <input id="fMin" type="number" min="2" max="999" value="' + st.dmin + '" style="width:70px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt)"> ถึง <input id="fMax" type="number" min="2" max="999" value="' + st.dmax + '" style="width:70px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt)"></div>'
          + '<div style="display:flex;gap:8px;align-items:center;color:var(--muted)">ตัวเศษ <input id="fNMin" type="number" min="1" max="999" value="' + st.nmin + '" style="width:70px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt)"> ถึง <input id="fNMax" type="number" min="1" max="999" value="' + st.nmax + '" style="width:70px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt)"></div></div>'
          + '<div class="fr-field"><label>จำนวนข้อ</label><select id="fCount">' + [10, 20, 30, 40].map(function (n) { return opt(n, n + ' ข้อ', st.count); }).join('') + '</select></div>'
          + '<div class="fr-field"><label>ชื่อชุด (เว้นว่างได้)</label><input id="fTitle" value="' + esc(st.title) + '" placeholder="เช่น การบวกเศษส่วน ชุดที่ 1"></div>'
          + '<button class="btn btn-accent" id="fGen"><i class="ti ti-refresh"></i> สร้างชุดแบบฝึก</button>'
          + '<button class="btn btn-ghost" id="fTimer"><i class="ti ti-clock"></i> จับเวลาเต็มจอ</button>'
          + '</div></section><section id="fOut"></section></div>';
        $('#fBack', host).onclick = renderHome;
        $('#fTimer', host).onclick = tmOpen;
        $('#fLevel', host).onchange = function () { var b = $('#fRangeBox', host); if (b) b.style.display = this.value === 'custom' ? '' : 'none'; };
        $('#fGen', host).onclick = function () {
          st.kind = $('#fKind', host).value; var se = $('#fSame', host); st.same = se ? se.value === '1' : false;
          st.level = $('#fLevel', host).value;
          if (st.level === 'custom') {
            var mn = Math.max(2, Math.min(999, parseInt($('#fMin', host).value, 10) || 2));
            var mx = Math.max(2, Math.min(999, parseInt($('#fMax', host).value, 10) || mn));
            if (mx < mn) { var t = mn; mn = mx; mx = t; }
            st.dmin = mn; st.dmax = mx;
            var nn = Math.max(1, Math.min(999, parseInt($('#fNMin', host).value, 10) || 1));
            var nx = Math.max(1, Math.min(999, parseInt($('#fNMax', host).value, 10) || nn));
            if (nx < nn) { var t2 = nn; nn = nx; nx = t2; }
            st.nmin = nn; st.nmax = nx;
          }
          st.count = +$('#fCount', host).value; st.title = $('#fTitle', host).value.trim();
          st.setId = newSetId(); st.showKey = false;
          st.probs = []; for (var i = 0; i < st.count; i++) st.probs.push(genProblem(st.kind, st.same, st.level, st.dmin, st.dmax, st.op, st.nmin, st.nmax));
          renderOut();
          if (svc.toast) svc.toast('success', 'สร้าง ' + st.count + ' ข้อแล้ว');
        };
        renderOut();
      }

      function renderOut() {
        var out = $('#fOut', host); if (!out) return;
        if (!st.probs.length) { out.innerHTML = '<div class="panel" style="padding:30px;text-align:center;color:var(--muted)">เลือกค่าทางซ้าย แล้วกด “สร้างชุดแบบฝึก”</div>'; return; }
        var cells = st.probs.map(function (p, i) {
          var ansCell = st.showKey ? '<span class="ansk">' + answerHTML(p.ans) + '</span>' : '<span class="ansbl"></span>';
          return '<div class="fr-pb"><span class="no">' + (i + 1) + ')</span><span class="ex">' + operandHTML(p.a) + '<span class="op">' + K().op + '</span>' + operandHTML(p.b) + '<span class="eq">=</span>' + ansCell + '</span></div>';
        }).join('');
        out.innerHTML = '<div class="panel" style="padding:18px">'
          + '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:8px">'
          + '<div><div class="eyebrow">ตัวอย่างก่อนพิมพ์</div><div class="font-display" style="font-weight:800;font-size:1.2rem">' + esc(defTitle()) + ' <span style="font-size:.78rem;color:var(--muted)">ชุด ' + esc(st.setId) + '</span></div></div>'
          + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
          + '<button class="btn btn-ghost" id="fKey"><i class="ti ti-eye"></i> ' + (st.showKey ? 'ซ่อนเฉลย' : 'ดูเฉลย') + '</button>'
          + '<button class="btn btn-ghost" id="fPrintK"><i class="ti ti-printer"></i> พิมพ์พร้อมเฉลย</button>'
          + '<button class="btn btn-accent" id="fPrint"><i class="ti ti-printer"></i> พิมพ์ใบงาน</button></div></div>'
          + '<div class="fr-prev">' + cells + '</div></div>';
        $('#fKey', host).onclick = function () { st.showKey = !st.showKey; renderOut(); };
        $('#fPrint', host).onclick = function () { doPrint(false); };
        $('#fPrintK', host).onclick = function () { doPrint(true); };
      }

      function doPrint(withKey) {
        var S = svc.settings || {}, cur = K();
        var o = { title: defTitle(), setId: st.setId, opSym: cur.op,
          sub: cur.word + ' · ' + kindWord() + ' · ตัวส่วน' + (st.same ? 'เท่ากัน' : 'ไม่เท่ากัน') + ' · ระดับ' + levelWord(),
          accent: cur.accent, org: S.org || '', logo: S.logo || LOGO, probs: st.probs, qrImg: '' };
        var finish = function (qrImg) { o.qrImg = qrImg || ''; printDoc(sheetHTML(o, withKey)); if (svc.toast) svc.toast('success', withKey ? 'เปิดหน้าพิมพ์ฉบับเฉลยแล้ว' : 'เปิดหน้าพิมพ์ใบงานแล้ว'); };
        if (!withKey && svc.makeQR && svc.keyURL) {
          var answers = st.probs.map(function (p) { return answerHTML(p.ans).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); });
          svc.makeQR(svc.keyURL(o.title, st.setId, answers)).then(function (img) { finish(img); }, function () { finish(''); });
        } else finish('');
      }

      renderHome();
    }
  });
})();
