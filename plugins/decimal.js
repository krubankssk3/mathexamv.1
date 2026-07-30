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
    var ip = rndI(lo, hi), fp = 0;
    if (dp > 0) { do { fp = rndI(0, pow10(dp) - 1); } while (fp % 10 === 0); }   // หลักทศนิยมสุดท้ายไม่เป็น 0
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

  /* ---------- คุมจำนวนตัวทด: ง่าย=0–1 · ปานกลาง=2–3 · ยาก=ทดทุกหลัก ---------- */
  function carriesOf(a, b) {
    var mf = Math.max(a.dp, b.dp);
    var sa = (a.ip * pow10(a.dp) + a.fp) * pow10(mf - a.dp), sb = (b.ip * pow10(b.dp) + b.fp) * pow10(mf - b.dp);
    var da = ('' + sa).split('').reverse(), db = ('' + sb).split('').reverse();
    var n = Math.max(da.length, db.length), carry = 0, cnt = 0, i;
    for (i = 0; i < n; i++) { var x = (+da[i] || 0) + (+db[i] || 0) + carry; if (x >= 10) { carry = 1; cnt++; } else carry = 0; }
    if (carry) cnt++;
    return cnt;
  }
  function overlapCols(intA, dpA, intB, dpB) {
    var maxFrac = Math.max(dpA, dpB), maxInt = Math.max(intA, intB), n = 0, p;
    for (p = maxFrac; p >= 1; p--) if (p <= dpA && p <= dpB) n++;
    for (p = 1; p <= maxInt; p++) if (p <= intA && p <= intB) n++;
    return n;
  }
  function carryOK(c, level, mx) { if (level === 'easy') return c <= 1; if (level === 'medium') return c >= 2 && c <= 3; return c >= Math.max(1, mx); }
  // สร้างเลขทีละหลักตามแผนการทด
  function genDecCarry(intA, dpA, intB, dpB, level) {
    var maxFrac = Math.max(dpA, dpB), maxInt = Math.max(intA, intB), cols = [], place, pos, i;
    for (place = maxFrac; place >= 1; place--) cols.push({ aR: place <= dpA, bR: place <= dpB, aLead: false, bLead: false });
    for (pos = 1; pos <= maxInt; pos++) cols.push({ aR: pos <= intA, bR: pos <= intB, aLead: pos === intA, bLead: pos === intB });
    var n = cols.length, plan = [], both = [];
    for (i = 0; i < n; i++) { plan.push(false); if (cols[i].aR && cols[i].bR) both.push(i); }
    if (level === 'hard') { for (i = 0; i < n; i++) plan[i] = true; }
    else {
      var target = level === 'easy' ? (Math.random() < 0.6 ? 0 : 1) : rndI(2, 3);
      var pool = both.slice(), j, t;
      for (i = pool.length - 1; i > 0; i--) { j = rndI(0, i); t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      for (var k = 0; k < Math.min(target, pool.length); k++) plan[pool[k]] = true;
    }
    var A = [], B = [], carry = 0;
    for (i = 0; i < n; i++) {
      var c = cols[i], la = c.aLead ? 1 : 0, ha = c.aR ? 9 : 0, lb = c.bLead ? 1 : 0, hb = c.bR ? 9 : 0, a, b, tr;
      if (plan[i] && ha + hb + carry >= 10) {
        var need = 10 - carry; tr = 0;
        do { a = rndI(la, ha); b = rndI(lb, hb); tr++; } while (a + b < need && tr < 60);
        if (a + b < need) { a = ha; b = Math.max(lb, Math.min(hb, need - a)); }
      } else {
        var cap = 9 - carry; tr = 0;
        do { a = rndI(la, ha); b = rndI(lb, hb); tr++; } while (a + b > cap && tr < 60);
        if (a + b > cap) { a = la; b = Math.max(lb, Math.min(hb, cap - a)); }
      }
      carry = (a + b + carry >= 10) ? 1 : 0; A[i] = a; B[i] = b;
    }
    var ipa = 0, fpa = 0, ipb = 0, fpb = 0, k2;
    for (k2 = 0; k2 < maxFrac; k2++) { var pl = maxFrac - k2; if (pl <= dpA) fpa += A[k2] * pow10(dpA - pl); if (pl <= dpB) fpb += B[k2] * pow10(dpB - pl); }
    for (pos = 1; pos <= maxInt; pos++) { var idx = maxFrac + pos - 1; if (pos <= intA) ipa += A[idx] * pow10(pos - 1); if (pos <= intB) ipb += B[idx] * pow10(pos - 1); }
    return { a: { ip: ipa, fp: fpa, dp: dpA }, b: { ip: ipb, fp: fpb, dp: dpB } };
  }
  function genLeveled(intA, dpA, intB, dpB, level) {
    var mx = overlapCols(intA, dpA, intB, dpB), best = null, bestDiff = 1e9, g = 0;
    do {
      var p = genDecCarry(intA, dpA, intB, dpB, level), c = carriesOf(p.a, p.b);
      if (carryOK(c, level, mx)) return p;
      var want = level === 'easy' ? 1 : level === 'medium' ? 2.5 : mx, d = Math.abs(c - want);
      if (d < bestDiff) { bestDiff = d; best = p; }
      g++;
    } while (g < 120);
    return best;
  }

  /* ---------- การคูณ: คูณเป็นจำนวนเต็ม แล้ววางจุดที่ dpA+dpB ---------- */
  function digitsOf(o) { return '' + (o.ip * pow10(o.dp) + o.fp); }
  function padDp(o, D) { if (o.dp >= D) return o; return { ip: o.ip, fp: o.fp * pow10(D - o.dp), dp: D }; }   // เติม 0 หลังจุด (ค่าเท่าเดิม)
  function mulDec(a, b) {
    var ia = a.ip * pow10(a.dp) + a.fp, ib = b.ip * pow10(b.dp) + b.fp;
    var prod = ia * ib, dp = a.dp + b.dp;
    return { digits: '' + prod, dp: dp, ip: Math.floor(prod / pow10(dp)), fp: prod % pow10(dp) };
  }
  function partials(a, b) {                       // ผลคูณย่อย ทีละหลักของตัวคูณ (ขวา→ซ้าย)
    var da = digitsOf(a), db = digitsOf(b), out = [], k;
    for (k = db.length - 1; k >= 0; k--) out.push({ val: '' + (parseInt(da, 10) * (+db.charAt(k))), shift: db.length - 1 - k });
    return out;
  }
  // กริดคูณ: [ตารางจำนวนเต็ม] · [ตารางทศนิยม] — จุดคั่นเดียว ตรงกันทุกแถว
  //   แถวโจทย์ใช้ตำแหน่งทศนิยมตามที่ตั้งไว้ (เติม 0 เฉพาะให้ตัวตั้ง/ตัวคูณเท่ากัน)
  //   แถวคำตอบใช้ตำแหน่งจริง (dpA+dpB) · แถวผลคูณย่อยไม่มีจุด วางชิดขวา
  function mulLayout(a, b, fWi, fWo) {
    var da = digitsOf(a), db = digitsOf(b), ps = partials(a, b), ans = mulDec(a, b);
    var ansStr = ans.digits;
    while (ansStr.length < ans.dp + 1) ansStr = '0' + ansStr;          // 0.xxx ต้องมีหลักหน่วย
    var iA = ('' + a.ip).length, iB = ('' + b.ip).length, iAns = ansStr.length - ans.dp;
    var wi = Math.max(iA, iB, iAns);                                   // บล็อกจำนวนเต็ม
    var wo = Math.max(a.dp, b.dp);                                     // ทศนิยมของแถวโจทย์ (ตามที่ตั้ง)
    var wn = ans.dp;                                                   // ทศนิยมของแถวคำตอบ (ตามจริง)
    var wf = Math.max(wo, wn);
    ps.forEach(function (p) { wi = Math.max(wi, p.val.length + p.shift - wf); });
    if (fWi && fWi > wi) wi = fWi;

    return { wi: wi, wo: wo, wn: wn, wf: wf, a: a, b: b, ps: ps, ans: ans, ansStr: ansStr, ncols: wi + wf + (wf > 0 ? 1 : 0) };
  }
  function calcGridMul(p, showAns, opSym, fWi, fWo) {
    var L = mulLayout(p.a, p.b, fWi, fWo), wi = L.wi, wo = L.wo, wn = L.wn, wf = L.wf, multi = L.ps.length > 1;
    // แถวมีจุด: จำนวนเต็มชิดขวา · ทศนิยมกว้างตาม nf (ที่เหลือเป็นช่องเปล่าไม่มีขอบ)
    function rowPoint(ipStr, fpStr, nf, isAns, blank) {
      var out = '', i, ch, cls = 'db' + (isAns ? ' ans' : '');
      while (fpStr.length < nf) fpStr += '0';                          // เติม 0 ให้ครบตำแหน่งที่ตั้งไว้
      for (i = 0; i < wi; i++) { ch = (i >= wi - ipStr.length) ? ipStr.charAt(i - (wi - ipStr.length)) : ''; out += '<td class="' + cls + '">' + (blank ? '' : ch) + '</td>'; }
      if (wf > 0) out += '<td class="pt' + (isAns ? ' ans' : '') + '">.</td>';
      for (i = 0; i < wf; i++) out += (i < nf) ? ('<td class="' + cls + '">' + (blank ? '' : fpStr.charAt(i)) + '</td>') : '<td class="gap"></td>';
      return out;
    }
    // แถวผลคูณย่อย: ไม่มีจุด วางชิดขวาของกริดหลัก
    function rowPlain(str, shift, blank) {
      var n = wi + wf, out = '', i, fromRight, ch;
      for (i = 0; i < n; i++) {
        fromRight = n - 1 - i;
        ch = (fromRight >= shift && fromRight < shift + str.length) ? str.charAt(str.length - 1 - (fromRight - shift)) : '';
        out += '<td class="db ans">' + (blank ? '' : ch) + '</td>';
        if (wf > 0 && i === wi - 1) out += '<td class="db ans join"></td>';   // เอาจุดออก → ตารางติดกัน
      }
      return out;
    }
    var aI = '' + p.a.ip, aF = p.a.dp > 0 ? (rep('0', p.a.dp) + p.a.fp).slice(-p.a.dp) : '';
    var bI = '' + p.b.ip, bF = p.b.dp > 0 ? (rep('0', p.b.dp) + p.b.fp).slice(-p.b.dp) : '';
    var nI = L.ansStr.slice(0, L.ansStr.length - L.ans.dp), nF = L.ans.dp > 0 ? L.ansStr.slice(L.ansStr.length - L.ans.dp) : '';
    var html = '<table class="calcT mulT">'
      + '<tr>' + rowPoint(aI, aF, p.a.dp, false, false) + '<td rowspan="2" class="opR">' + opSym + '</td></tr>'
      + '<tr>' + rowPoint(bI, bF, p.b.dp, false, false) + '</tr>'
      + '<tr class="lnrow"><td colspan="' + L.ncols + '" class="ln"></td><td class="opR"></td></tr>';
    if (multi) {
      L.ps.forEach(function (q, idx) {
        html += '<tr>' + rowPlain(q.val, q.shift, !showAns)
          + (idx === 0 ? '<td rowspan="' + L.ps.length + '" class="opR">+</td>' : '') + '</tr>';
      });
      html += '<tr class="lnrow"><td colspan="' + L.ncols + '" class="ln"></td><td class="opR"></td></tr>';
    }
    html += '<tr>' + rowPoint(nI, nF, wn, true, !showAns) + '<td class="opR"></td></tr></table>';
    return html;
  }

  /* ---------- การหาร: สร้างจากผลหาร (คุมให้หารได้) + ขั้นตอนหารยาว ---------- */
  function mkNum(sc, dp) { var ip = Math.floor(sc / pow10(dp)), fp = sc % pow10(dp); while (dp > 0 && fp % 10 === 0) { fp /= 10; dp--; } return { ip: ip, fp: fp, dp: dp }; }
  // kind 'whole' = ผลหารจำนวนเต็ม · 'dec' = ผลหารทศนิยม qdp ตำแหน่ง
  function roundTo(v, dp) { var m = pow10(dp); return Math.round(v * m) / m; }
  // kind: 'whole' = ลงตัว จำนวนเต็ม · 'dec' = ลงตัว ทศนิยม qdp · 'round' = หารไม่ลงตัว ปัดเศษ qdp ตำแหน่ง
  function genDivProblem(divDigits, qDigits, kind, qdp, divDp) {
    divDp = divDp || 0;
    var g = 0, d, dv, qv, qf, qi, dividend;
    if (kind === 'round') {                          // สุ่มตรง ๆ แล้วปัดเศษ (คำตอบเป็นทศนิยมซ้ำได้)
      do {
        dv = genNum(divDigits, divDp);
        var aInt = Math.max(divDigits, Math.min(6, qDigits + divDigits - 1));
        var aDp = Math.min(3, rndI(0, 2));
        var av = genNum(aInt, aDp);
        var aVal = (av.ip * pow10(av.dp) + av.fp) / pow10(av.dp);
        var bVal = (dv.ip * pow10(dv.dp) + dv.fp) / pow10(dv.dp);
        g++;
        if (bVal > 0 && aVal >= bVal && ('' + av.ip).length >= ('' + dv.ip).length) {
          var qr = roundTo(aVal / bVal, qdp), sc = Math.round(qr * pow10(qdp));
          return { a: av, b: dv, ans: { ip: Math.floor(sc / pow10(qdp)), fp: sc % pow10(qdp), dp: qdp }, rounded: true };
        }
      } while (g < 300);
    }
    do {                                              // สร้างจากผลหาร → หารลงตัวเสมอ
      d = rndI(Math.max(2, pow10(divDigits - 1)), pow10(divDigits) - 1);
      var dfp = 0;
      if (divDp > 0) { do { dfp = rndI(1, pow10(divDp) - 1); } while (dfp % 10 === 0); }
      dv = { ip: d, fp: dfp, dp: divDp };
      qi = rndI(Math.max(1, pow10(qDigits - 1)), pow10(qDigits) - 1);
      var qdpUse = (kind === 'whole') ? 0 : qdp;
      if (kind === 'whole') qv = qi;
      else { do { qf = rndI(1, pow10(qdpUse) - 1); } while (qf % 10 === 0); qv = qi * pow10(qdpUse) + qf; }
      var dScaled = d * pow10(divDp) + dfp;           // ตัวหาร (สเกล divDp)
      var sc2 = qv * dScaled, totDp = qdpUse + divDp; // ตัวตั้ง (สเกล qdp+divDp)
      dividend = { ip: Math.floor(sc2 / pow10(totDp)), fp: sc2 % pow10(totDp), dp: totDp };
      g++;
      if (totDp <= 3 && ('' + dividend.ip).length >= ('' + d).length && ('' + dividend.ip).length <= 7)
        return { a: dividend, b: dv, ans: { ip: Math.floor(qv / pow10(qdpUse)), fp: qv % pow10(qdpUse), dp: qdpUse } };
    } while (g < 400);
    return { a: { ip: d * 2, fp: 0, dp: 0 }, b: { ip: d, fp: 0, dp: 0 }, ans: { ip: 2, fp: 0, dp: 0 } };
  }
  function longDivSteps(a, b) {
    var da = ('' + (a.ip * pow10(a.dp) + a.fp)).split(''), d = b.ip * pow10(b.dp) + b.fp, steps = [], cur = 0, qd = [], i;
    for (i = 0; i < da.length; i++) {
      cur = cur * 10 + (+da[i]);
      var q = Math.floor(cur / d), m = q * d, r = cur - m;
      qd.push(q);
      steps.push({ pos: i, cur: cur, q: q, mul: m, rem: r, next: (i + 1 < da.length) ? (r * 10 + (+da[i + 1])) : r });
      cur = r;
    }
    return { qdigits: qd.join(''), steps: steps };
  }
  // ตารางหารยาว: [ตัวหาร] ) [ตัวตั้ง] · ผลหารอยู่บน (จุดตรงกับตัวตั้ง) · ขั้นตอนลบด้านล่าง
  function calcGridDiv(p, showAns) {
    var L = longDivSteps(p.a, p.b), D = '' + (p.a.ip * pow10(p.a.dp) + p.a.fp), n = D.length;
    var wd = ('' + p.b.ip).length, dp = p.a.dp;
    function fracIdx(i) { return dp > 0 && (n - 1 - i) === dp - 1; }   // ช่องจุดอยู่ก่อนหลักนี้
    function pointCell(cls, show) { return dp > 0 ? '<td class="pt' + (cls || '') + '">' + (show ? '.' : '') + '</td>' : ''; }
    // แถวเนื้อหา: str วางให้หลักสุดท้ายอยู่คอลัมน์ endCol · lead = ช่องนำหน้า (ตัวหาร+วงเล็บ)
    function row(str, endCol, opts) {
      opts = opts || {};
      var out = '', i, ch, start = endCol - str.length + 1;
      // ช่องตัวหาร + วงเล็บ
      if (opts.divisor) { for (i = 0; i < wd; i++) out += '<td class="db">' + ('' + p.b.ip).charAt(i) + '</td>'; out += '<td class="dbk">)</td>'; }
      else { for (i = 0; i < wd; i++) out += '<td class="gap"></td>'; out += '<td class="gap"></td>'; }
      for (i = 0; i < n; i++) {
        if (dp > 0 && (n - 1 - i) === dp - 1) out += pointCell(opts.ansRow ? ' ans' : '', opts.showPoint);
        ch = (i >= start && i <= endCol) ? str.charAt(i - start) : '';
        out += '<td class="' + (opts.blankBox ? 'db' : (ch === '' ? 'gap' : 'db')) + (opts.ansRow ? ' ans' : '') + '">' + (opts.hide ? '' : ch) + '</td>';
      }
      return out;
    }
    var ncols = wd + 1 + n + (dp > 0 ? 1 : 0);
    // ผลหาร (ตัดศูนย์นำหน้า)
    var Q = L.qdigits.replace(/^0+(?=.)/, ''), qEnd = n - 1;
    var html = '<table class="calcT divT">'
      + '<tr class="qrow">' + row(Q, qEnd, { blankBox: true, ansRow: true, hide: !showAns, showPoint: showAns && dp > 0 }) + '</tr>'
      + '<tr class="vrow"><td colspan="' + (wd + 1) + '"></td><td colspan="' + (n + (dp > 0 ? 1 : 0)) + '" class="vln"></td></tr>'
      + '<tr>' + row(D, n - 1, { divisor: true, showPoint: dp > 0 }) + '</tr>';
    // ขั้นตอนการลบ
    L.steps.forEach(function (st, k) {
      if (st.mul === 0 && k === 0) return;
      html += '<tr class="stp">' + row('' + st.mul, st.pos, { blankBox: true, ansRow: true, hide: !showAns }) + '</tr>';
      if (k + 1 < L.steps.length) html += '<tr class="stp">' + row('' + st.next, st.pos + 1, { blankBox: true, ansRow: true, hide: !showAns }) + '</tr>';
      else if (st.rem !== 0) html += '<tr class="stp">' + row('' + st.rem, st.pos, { blankBox: true, ansRow: true, hide: !showAns }) + '</tr>';
    });
    return html + '</table>';
  }

  /* ---------- การลบ: คุมจำนวนตัวยืม + กันคำตอบติดลบ ---------- */
  function subDec(a, b) {
    var P = Math.max(a.dp, b.dp), s = scaled(a, P) - scaled(b, P);
    var ip = Math.floor(s / pow10(P)), fp = s % pow10(P), dp = P;
    while (dp > 0 && fp % 10 === 0) { fp /= 10; dp--; }
    return { ip: ip, fp: fp, dp: dp };
  }
  function borrowsOf(a, b) {
    var mf = Math.max(a.dp, b.dp), sa = scaled(a, mf), sb = scaled(b, mf);
    var da = ('' + sa).split('').reverse(), db = ('' + sb).split('').reverse();
    var n = Math.max(da.length, db.length), borrow = 0, cnt = 0, i;
    for (i = 0; i < n; i++) { var x = (+da[i] || 0), y = (+db[i] || 0); if (x - borrow < y) { borrow = 1; cnt++; } else borrow = 0; }
    return cnt;
  }
  function borrowOK(c, level, mx) { if (level === 'easy') return c <= 1; if (level === 'medium') return c >= 2 && c <= 3; return c >= Math.max(1, mx - 1); }
  function genDecBorrow(intA, dpA, intB, dpB, level) {
    var maxFrac = Math.max(dpA, dpB), maxInt = Math.max(intA, intB), cols = [], place, pos, i;
    for (place = maxFrac; place >= 1; place--) cols.push({ aR: place <= dpA, bR: place <= dpB, aLead: false, bLead: false });
    for (pos = 1; pos <= maxInt; pos++) cols.push({ aR: pos <= intA, bR: pos <= intB, aLead: pos === intA, bLead: pos === intB });
    var n = cols.length, plan = [], both = [], topIdx = n - 1;
    for (i = 0; i < n; i++) { plan.push(false); if (cols[i].aR && cols[i].bR) both.push(i); }
    if (level === 'hard') { for (i = 0; i < n; i++) plan[i] = (i !== topIdx); }   // ยืมทุกหลัก ยกเว้นบนสุด (กันติดลบ)
    else {
      var target = level === 'easy' ? (Math.random() < 0.6 ? 0 : 1) : rndI(2, 3);
      var pool = both.filter(function (x) { return x !== topIdx; }), j, t;
      for (i = pool.length - 1; i > 0; i--) { j = rndI(0, i); t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      for (var k = 0; k < Math.min(target, pool.length); k++) plan[pool[k]] = true;
    }
    var A = [], B = [], borrow = 0;
    for (i = 0; i < n; i++) {
      var c = cols[i], la = c.aLead ? 1 : 0, ha = c.aR ? 9 : 0, lb = c.bLead ? 1 : 0, hb = c.bR ? 9 : 0, a, b, tr;
      if (!c.bR) hb = 0;
      if (plan[i] && c.bR) {                      // ต้องยืม: a - borrow < b
        tr = 0; do { a = rndI(la, ha); b = rndI(Math.max(lb, 1), hb); tr++; } while (!(a - borrow < b) && tr < 80);
        if (!(a - borrow < b)) { a = la; b = Math.max(Math.max(lb, 1), Math.min(hb, a - borrow + 1)); if (b > hb) { a = Math.max(la, 0); b = hb; } }
      } else {                                     // ไม่ยืม: b <= a - borrow
        tr = 0; do { a = rndI(la, ha); b = c.bR ? rndI(lb, hb) : 0; tr++; } while (!(b <= a - borrow) && tr < 80);
        if (!(b <= a - borrow)) { a = ha; b = c.bR ? Math.max(lb, Math.min(hb, a - borrow)) : 0; }
      }
      borrow = (a - borrow < b) ? 1 : 0; A[i] = a; B[i] = b;
    }
    var ipa = 0, fpa = 0, ipb = 0, fpb = 0, k2;
    for (k2 = 0; k2 < maxFrac; k2++) { var pl = maxFrac - k2; if (pl <= dpA) fpa += A[k2] * pow10(dpA - pl); if (pl <= dpB) fpb += B[k2] * pow10(dpB - pl); }
    for (pos = 1; pos <= maxInt; pos++) { var idx = maxFrac + pos - 1; if (pos <= intA) ipa += A[idx] * pow10(pos - 1); if (pos <= intB) ipb += B[idx] * pow10(pos - 1); }
    return { a: { ip: ipa, fp: fpa, dp: dpA }, b: { ip: ipb, fp: fpb, dp: dpB } };
  }
  function genLeveledSub(intA, dpA, intB, dpB, level) {
    if (intB > intA) { var t0 = intA; intA = intB; intB = t0; }        // ตัวตั้งหลักไม่น้อยกว่าตัวลบ
    var mx = overlapCols(intA, dpA, intB, dpB), best = null, bd = 1e9, g = 0;
    do {
      var p = genDecBorrow(intA, dpA, intB, dpB, level), P = Math.max(p.a.dp, p.b.dp);
      if (scaled(p.a, P) >= scaled(p.b, P)) {                          // ไม่ติดลบ
        var c = borrowsOf(p.a, p.b);
        if (borrowOK(c, level, mx)) return p;
        var want = level === 'easy' ? 1 : level === 'medium' ? 2.5 : mx, d = Math.abs(c - want);
        if (d < bd) { bd = d; best = p; }
      }
      g++;
    } while (g < 150);
    return best;
  }

  /* ---------- สุ่มโจทย์ ---------- */
  function genProblem(st) {
    var ia, da, ib, db;
    var lv = (st.level === 'random') ? ['easy', 'medium', 'hard'][rndI(0, 2)] : st.level;   // สุ่มระดับต่อข้อ
    if (st.mode === 'random') {                       // สุ่มทั้งจำนวนหลักและตำแหน่งทศนิยมต่อข้อ
      ia = rndI(1, 4); da = rndI(0, 3);
      if (st.op === 'mul') { db = rndI(0, 2); ib = rndI(1, 3 - db); da = db; }   // ทศนิยมเท่ากัน + ตัวคูณรวม ≤3 หลัก
      else { ib = rndI(1, 4); db = rndI(0, 3); }
    }
    else if (st.mode === 'custom') { ia = st.intA; da = st.dpA; ib = st.intB; db = st.dpB; }
    else { ia = st.intDigits; da = rndI(st.rmin, st.rmax); ib = st.intDigits; db = rndI(st.rmin, st.rmax); }
    if (st.op === 'div') {                              // หาร: กำหนดเองอิสระ หรือคละทั้งหมด
      var kind = st.divKind || 'dec', dd, qd, qdp, ddp, aD = null, aDp = null;
      if (st.numMode === 'random') {
        kind = ['dec', 'round', 'whole'][rndI(0, 2)];
        dd = rndI(1, 2); qd = rndI(1, 3); ddp = rndI(0, 1);
        qdp = (kind === 'whole') ? 0 : rndI(1, 3);
        if (kind !== 'round' && qdp + ddp > 3) ddp = Math.max(0, 3 - qdp);
        if (kind === 'round') { aD = rndI(2, 5); aDp = rndI(0, 2); }
      } else {
        dd = Math.max(1, Math.min(3, st.divDd || 1));
        ddp = Math.max(0, Math.min(3, st.divDp != null ? st.divDp : 0));
        qdp = (kind === 'whole') ? 0 : Math.max(1, Math.min(3, st.qdp || 2));
        if (kind === 'round') { aD = Math.max(1, Math.min(7, st.intA || 3)); aDp = Math.max(0, Math.min(3, st.dpA != null ? st.dpA : 0)); qd = 2; }
        else { qd = Math.max(1, Math.min(4, st.divQd || 2)); if (qdp + ddp > 3) ddp = Math.max(0, 3 - qdp); }
      }
      return genDivProblem(dd, qd, kind, qdp, ddp, aD, aDp);
    }
    if (st.op === 'mul') {                              // คูณ: กำหนดเองอิสระ หรือคละทั้งหมด
      if (st.numMode === 'random') { db = rndI(0, 2); ib = rndI(1, 3 - db); da = db; ia = rndI(1, 4); }
      else { ia = Math.max(1, Math.min(7, st.intA || 2)); da = Math.max(0, Math.min(3, st.dpA != null ? st.dpA : 1)); ib = Math.max(1, Math.min(4, st.intB || 1)); db = Math.max(0, Math.min(3, st.dpB != null ? st.dpB : 1)); }
      if (false) {                                      // (โครงเดิม ไม่ใช้แล้ว)
        var tot = lv === 'easy' ? 1 : lv === 'medium' ? 2 : 3;
        db = Math.min(db, tot - 1); if (db < 0) db = 0;
        ib = tot - db;
        da = db;                                        // ทศนิยมเท่ากัน → จุดตรงกันเสมอ
      }
      var am = genNum(ia, da), bm = genNum(ib, db), gm = 0;
      while (digitsOf(bm).indexOf('0') >= 0 && gm < 60) { bm = genNum(ib, db); gm++; }   // ตัวคูณไม่มีเลข 0 (กันแถวผลคูณย่อยเป็น 0)
      return { a: am, b: bm, ans: mulDec(am, bm) };     // ไม่แตะค่าจริง — เติม 0 ตอนแสดงผลในตาราง
    }
    if (st.op === 'sub') {
      var ps = genLeveledSub(ia, da, ib, db, lv);
      return { a: ps.a, b: ps.b, ans: subDec(ps.a, ps.b) };
    }
    var pr = genLeveled(ia, da, ib, db, lv);
    return { a: pr.a, b: pr.b, ans: addDec(pr.a, pr.b) };
  }

  /* ---------- ตารางกล่องต่อหลัก (จัดจุดทศนิยมตรงกัน) ---------- */
  function calcGrid(p, showAns, opSym) {
    var m = metrics([p.a, p.b, p.ans]), mi = m.mi, mf = m.mf, ncols = mi + (mf > 0 ? 1 : 0) + mf;
    function cells(o, isAns) {
      var ipStr = '' + o.ip, out = '', c, idx, ch, cls = 'db' + (isAns ? ' ans' : '');
      for (c = 0; c < mi; c++) { idx = c - (mi - ipStr.length); ch = idx >= 0 ? ipStr.charAt(idx) : ''; out += '<td class="' + cls + '">' + (isAns && !showAns ? '' : ch) + '</td>'; }
      if (mf > 0) out += '<td class="pt">.</td>';
      // เติม 0 ให้ครบตำแหน่งทศนิยมสูงสุด (เช่น 220.15 → 220.150)
      var fpStr = o.dp > 0 ? (rep('0', o.dp) + o.fp).slice(-o.dp) : '';
      while (fpStr.length < mf) fpStr += '0';
      for (c = 0; c < mf; c++) { ch = fpStr.charAt(c); out += '<td class="' + cls + '">' + (isAns && !showAns ? '' : ch) + '</td>'; }
      return out;
    }
    return '<table class="calcT">'
      + '<tr>' + cells(p.a, false) + '<td rowspan="2" class="opR">' + opSym + '</td></tr>'
      + '<tr>' + cells(p.b, false) + '</tr>'
      + '<tr class="lnrow"><td colspan="' + ncols + '" class="ln"></td><td class="opR"></td></tr>'
      + '<tr>' + cells(p.ans, true) + '<td class="opR"></td></tr></table>';
  }

  // โจทย์บรรทัดเดียว: a (op) b = ______
  function inlineHTML(p, showAns, opSym, approx) {
    var ans = showNum(p.ans);
    return '<span class="inl"><span class="n1">' + showNum(p.a) + '</span><b>' + opSym + '</b><span class="n2">' + showNum(p.b) + '</span><b>=</b>'
      + (showAns ? '<span class="ians">' + (approx ? '&asymp;' : '') + ans + '</span>' : '<span class="ibl"></span>') + '</span>';
  }

  /* ---------- CSS เอกสารพิมพ์ ---------- */
  function printCSS(ac, cs, wA, wB) {
    var fs = (cs * 2.55).toFixed(1), pf = (cs * 2.9).toFixed(1), op = (cs * 1.05).toFixed(2);
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
      + '.page{position:relative;display:flex;flex-direction:column;min-height:277mm}'
      + '.page.brk{page-break-before:always}'
      + '.conthd{border-bottom:2px solid ' + ac + ';color:' + ac + ';font-weight:700;font-size:18px;padding-bottom:6px;margin-bottom:12px}'
      + '.conthd span{font-weight:400;font-size:13px;color:#999}'
      + '.grid{display:grid;gap:6mm 10px;flex:1;align-content:start;justify-items:center}'
      + '.pb{display:flex;gap:8px;padding:2px;break-inside:avoid;page-break-inside:avoid;align-items:flex-start;justify-content:center}'
      + '.pb .no{font-weight:700;color:' + ac + ';min-width:7mm;font-size:' + (cs * 2).toFixed(1) + 'px;padding-top:2mm}'
      + '.calcT{border-collapse:collapse;break-inside:avoid;page-break-inside:avoid}'
      + '.calcT td{width:' + cs + 'mm;min-width:' + cs + 'mm;max-width:' + cs + 'mm;height:' + cs + 'mm;text-align:center;font-size:' + fs + 'px;padding:0;line-height:' + cs + 'mm;box-sizing:border-box}'
      + '.calcT td.db{border:1.5px solid #333}'
      + '.calcT td.opR{color:' + ac + ';font-weight:700;font-size:' + (cs * 3).toFixed(1) + 'px;text-align:center;vertical-align:middle;border:0;width:' + op + 'mm;min-width:' + op + 'mm;max-width:' + op + 'mm}'
      + '.calcT td.pt{vertical-align:bottom;font-weight:700;font-size:' + pf + 'px;line-height:.7;padding-bottom:' + (cs * 0.12).toFixed(1) + 'mm}'
      + '.calcT td.ln{border-bottom:2.5px solid #333;height:3px;padding:0}'
      + '.calcT td.pt.ans{color:' + ac + '}'
      + '.calcT td.gap{border:0}'
      + '.divT td.dbk{border:0;font-size:' + (cs * 3.4).toFixed(1) + 'px;font-weight:400;color:#333;vertical-align:middle;width:' + (cs * 0.5).toFixed(1) + 'mm;min-width:' + (cs * 0.5).toFixed(1) + 'mm;line-height:1}'
      + '.divT tr.vrow td{height:0;padding:0;border:0}'
      + '.divT td.vln{border-bottom:2.5px solid #333;height:2px;padding:0}'
      + '.calcT td.ans{color:' + ac + '}'
      + '.inl{font-size:' + (cs * 2.2).toFixed(1) + 'px;white-space:nowrap;line-height:2.4;font-variant-numeric:tabular-nums}'
      + '.inl b{color:' + ac + ';margin:0 4px;display:inline-block;width:1.1ch;text-align:center}'
      + '.inl .n1{display:inline-block;min-width:' + (wA || 8) + 'ch;text-align:right}'
      + '.inl .n2{display:inline-block;min-width:' + (wB || 6) + 'ch;text-align:right}'
      + '.ibl{display:inline-block;min-width:' + (cs * 3.6).toFixed(1) + 'mm;border-bottom:1px dotted #666;margin-left:4px}'
      + '.ians{color:' + ac + ';font-weight:700;margin-left:4px}'
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
    var i, pages = [];
    // --- ขนาดตารางสูงสุดในชุด ---
    var maxCols = 1, maxRows = 1, mWi = 0;
    o.probs.forEach(function (p) {
      if (o.op === 'div') {
        var Dn = ('' + (p.a.ip * pow10(p.a.dp) + p.a.fp)).length, wdv = ('' + p.b.ip).length;
        maxCols = Math.max(maxCols, wdv + 1 + Dn + (p.a.dp > 0 ? 1 : 0));
        var Ls = longDivSteps(p.a, p.b), used = Ls.steps.filter(function (x, k) { return !(x.mul === 0 && k === 0); });
        var nr = used.length * 2 - ((Ls.steps[Ls.steps.length - 1].rem === 0) ? 1 : 0);
        maxRows = Math.max(maxRows, nr);
      } else if (o.op === 'mul') {
        var L = mulLayout(p.a, p.b);
        maxCols = Math.max(maxCols, L.ncols); maxRows = Math.max(maxRows, L.ps.length); mWi = Math.max(mWi, L.wi);
      } else {
        var m = metrics([p.a, p.b, p.ans]);
        maxCols = Math.max(maxCols, m.mi + (m.mf > 0 ? 1 : 0) + m.mf);
      }
    });
    o.mWi = mWi;
    // --- เลือกจำนวนข้อต่อแถว + ขนาดช่อง ให้เต็มความกว้าง A4 ---
    var PAGE = 192, NUMW = 8, OPR = 1.05, GAP = 6, AVAIL = 200, cols = 2;
    if (o.layout === 'inline') {                                   // โจทย์บรรทัดเดียว: แน่นแบบใบงานเศษส่วน
      var csI = 9, hRow = 16, rowsI = Math.max(4, Math.floor((AVAIL + 4) / hRow));
      var wA = 0, wB = 0;
      o.probs.forEach(function (p) { wA = Math.max(wA, showNum(p.a).length); wB = Math.max(wB, showNum(p.b).length); });
      var PERI = rowsI * 2, pagesI = [];
      for (i = 0; i < o.probs.length; i += PERI) pagesI.push(o.probs.slice(i, i + PERI));
      var totalI = pagesI.length;
      var bodyI = pagesI.map(function (chunk, pi) {
        var cellsI = chunk.map(function (p, j) {
          return '<div class="pb"><span class="no">' + (pi * PERI + j + 1) + ')</span>' + inlineHTML(p, withKey, o.opSym, o.approx) + '</div>';
        }).join('');
        var hdI = pi === 0
          ? headHTML(o) + (withKey ? '<div style="text-align:center;color:' + o.accent + ';font-weight:700;margin:2px 0 6px">★ ฉบับเฉลย ★</div>' : '')
          : '<div class="conthd">' + esc(o.title) + ' <span>· ชุด ' + esc(o.setId) + ' · หน้า ' + (pi + 1) + '/' + totalI + '</span></div>';
        var ftI = (pi === totalI - 1) ? '<div class="foot">' + FOOTER + '</div>' : '';
        return '<div class="page' + (pi > 0 ? ' brk' : '') + '">' + hdI + '<div class="grid" style="grid-template-columns:repeat(2,1fr)">' + cellsI + '</div>' + ftI + '</div>';
      }).join('');
      return '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + esc(o.title) + '</title><style>'
        + printCSS(o.accent, csI, wA, wB) + '</style></head><body>' + bodyI + '</body></html>';
    }
    var cellRows = (o.op === 'div') ? (2 + maxRows) : ((o.op === 'mul' && maxRows > 1) ? (2 + maxRows + 1) : 3);
    var lines = (o.op === 'div') ? 1 : ((o.op === 'mul' && maxRows > 1) ? 2 : 1);
    var cs, csH;
    if (o.op === 'mul' || o.op === 'div') {                         // คูณ/หาร แสดงวิธีทำ: 1 คอลัมน์ 2 ข้อ/หน้า เต็มหน้า A4
      cols = 1;
      var csW1 = (PAGE - NUMW) / (maxCols + OPR);                   // เต็มความกว้าง
      var csH2 = ((AVAIL - GAP) / 2 - lines * 2 - 4) / cellRows;    // ให้พอดี 2 ข้อในหน้า
      cs = Math.min(csW1, csH2, 22);
    } else {
      cs = (((PAGE - 8) / 2) - NUMW) / (maxCols + OPR);
      if (cs < 7) { cols = 1; cs = (PAGE - NUMW) / (maxCols + OPR); }
      csH = ((AVAIL - GAP) / 2 - lines * 2 - 4) / cellRows;
      cs = Math.min(cs, csH, 15);
    }
    cs = Math.floor(cs * 10) / 10;
    var hProb = cellRows * cs + lines * 2 + 4;                     // ความสูงต่อข้อ (mm)
    var rowsPer = Math.max(1, Math.floor((AVAIL + GAP) / (hProb + GAP)));
    var PER = (o.op === 'mul' || o.op === 'div') ? 2 : rowsPer * cols;
    for (i = 0; i < o.probs.length; i += PER) pages.push(o.probs.slice(i, i + PER));
    var total = pages.length;
    var body = pages.map(function (chunk, pi) {
      var cells = chunk.map(function (p, j) {
        return '<div class="pb"><span class="no">' + (pi * PER + j + 1) + ')</span>'
          + (o.layout === 'inline' ? inlineHTML(p, withKey, o.opSym, o.approx) : o.op === 'div' ? calcGridDiv(p, withKey) : o.op === 'mul' ? calcGridMul(p, withKey, o.opSym, o.mWi) : calcGrid(p, withKey, o.opSym)) + '</div>';
      }).join('');
      var grid = '<div class="grid" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cells + '</div>';
      var header = pi === 0
        ? headHTML(o) + (withKey ? '<div style="text-align:center;color:' + o.accent + ';font-weight:700;margin:2px 0 6px">★ ฉบับเฉลย (แสดงวิธีตั้งหลัก) ★</div>' : '')
        : '<div class="conthd">' + esc(o.title) + ' <span>· ชุด ' + esc(o.setId) + ' · หน้า ' + (pi + 1) + '/' + total + '</span></div>';
      var foot = (pi === total - 1) ? '<div class="foot">' + FOOTER + '</div>' : '';
      return '<div class="page' + (pi > 0 ? ' brk' : '') + '">' + header + grid + foot + '</div>';
    }).join('');
    return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>' + esc(o.title) + '</title><style>' + printCSS(o.accent, cs) + '</style></head><body>' + body + '</body></html>';
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

  /* ---------- QR เฉลย (โหลด qrcode.min.js เองถ้าเว็บยังไม่มี) ---------- */
  function ensureQRLib(cb) {
    if (window.QRCode) { cb(true); return; }
    var tried = 0;
    function load(src) {
      var sc = document.createElement('script');
      sc.src = src;
      sc.onload = function () { cb(!!window.QRCode); };
      sc.onerror = function () { tried++; if (tried === 1) load('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'); else cb(false); };
      document.head.appendChild(sc);
    }
    load('qrcode.min.js');
  }
  function b64utf8(str) { return btoa(unescape(encodeURIComponent(str))); }
  function keyURLLocal(title, setId, answers) {
    var o = { t: title, s: setId, a: answers };
    return location.origin + location.pathname + '#k=' + encodeURIComponent(b64utf8(JSON.stringify(o)));
  }
  function fitQRText(title, setId, answers, mkURL) {
    var url = mkURL(title, setId, answers), n = answers.length;
    while (url.length > 1400 && n > 5) {                 // ยาวเกิน → ลดจำนวนคำตอบใน QR
      n = Math.floor(n * 0.8);
      url = mkURL(title, setId, answers.slice(0, n));
    }
    return url;
  }
  function makeQRLocal(text) {
    return new Promise(function (res) {
      ensureQRLib(function (ok) {
        if (!ok) { res(''); return; }
        try {
          var tmp = document.createElement('div');
          tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
          document.body.appendChild(tmp);
          new QRCode(tmp, { text: text, width: 260, height: 260, correctLevel: QRCode.CorrectLevel.L });
          setTimeout(function () {
            var url = '', cv = tmp.querySelector('canvas');
            if (cv) { try { url = cv.toDataURL('image/png'); } catch (e) { } }
            if (!url) { var im = tmp.querySelector('img'); if (im) url = im.src; }
            if (tmp.parentNode) tmp.parentNode.removeChild(tmp);
            res(url);
          }, 150);
        } catch (e) { res(''); }
      });
    });
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
      + '.dc-prev{display:grid;gap:14px 18px;margin-top:14px;grid-template-columns:repeat(2,1fr);justify-items:center;align-items:start;align-content:start}'
      + '.dc-pb{display:flex;gap:10px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--bg2);align-items:flex-start}'
      + '.dc-pb .no{font-weight:700;color:var(--accent);min-width:22px;padding-top:4px}'
      + '.dc-pb .calcT{border-collapse:collapse}'
      + '.dc-pb .calcT td{width:27px;min-width:27px;max-width:27px;height:27px;text-align:center;font-size:19px;padding:0;box-sizing:border-box}'
      + '.dc-pb .calcT td.db{border:1.5px solid var(--muted)}'
      + '.dc-pb .calcT td.opR{color:var(--accent);font-weight:700;font-size:23px;text-align:center;vertical-align:middle;padding-left:4px;width:28px;min-width:28px;max-width:28px}'
      + '.dc-pb .calcT td.pt{width:27px;min-width:27px;max-width:27px;vertical-align:bottom;font-weight:700;font-size:28px;line-height:.7;padding-bottom:3px}'
      + '.dc-pb .calcT td.ln{border-bottom:2px solid var(--muted);height:2px;padding:0}'
      + '.dc-pb .calcT td.pt.ans{color:var(--accent)}'
      + '.dc-pb .calcT td.gap{border:0;width:27px;min-width:27px;max-width:27px}'
      + '.dc-pb .divT td.dbk{border:0;font-size:26px;color:var(--muted);vertical-align:middle;width:14px;min-width:14px;line-height:1}'
      + '.dc-pb .divT tr.vrow td{height:0;padding:0;border:0}'
      + '.dc-pb .divT td.vln{border-bottom:2px solid var(--muted);height:2px;padding:0}'
      + '.dc-pb .calcT td.ans{color:var(--accent)}'
      + '.dc-pb .inl{font-size:19px;white-space:nowrap;font-variant-numeric:tabular-nums}'
      + '.dc-pb .inl b{color:var(--accent);margin:0 4px;display:inline-block;width:1.1ch;text-align:center}'
      + '.dc-pb .inl .n1{display:inline-block;min-width:8ch;text-align:right}'
      + '.dc-pb .inl .n2{display:inline-block;min-width:6ch;text-align:right}'
      + '.dc-pb .ibl{display:inline-block;min-width:70px;border-bottom:1px dotted var(--muted)}'
      + '.dc-pb .ians{color:var(--accent);font-weight:700}'
      + '.dctile{--tile:var(--accent);position:relative;border:0;cursor:pointer;color:#fff;border-radius:22px;background:linear-gradient(150deg,var(--tile),color-mix(in srgb,var(--tile) 55%,#000));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:170px;height:170px}'
      + '.dctile.on{animation:dcBreathe 2.6s ease-in-out infinite}'
      + '.dctile.sub{--tile:#16a34a}.dctile.mul{--tile:#7c3aed}.dctile.div{--tile:#2563eb}'
      + '.dctile.soon{opacity:.45;cursor:not-allowed;filter:grayscale(.3)}'
      + '.dctile .soon-tag{position:absolute;top:8px;right:10px;background:rgba(0,0,0,.35);border-radius:8px;font-size:11px;padding:2px 7px}'
      + '@keyframes dcBreathe{0%,100%{box-shadow:0 8px 22px color-mix(in srgb,var(--tile) 30%,transparent)}50%{box-shadow:0 10px 30px color-mix(in srgb,var(--tile) 45%,transparent),0 0 40px 6px color-mix(in srgb,var(--tile) 55%,transparent)}}'
      + '@media (prefers-reduced-motion:reduce){.dctile.on{animation:none}}';
    document.head.appendChild(s);
  }

  var OPS = {
    add: { op: '+', accent: '#c0392b', word: 'การบวก', pre: 'DA', term: 'ตัวบวก', unit: 'ตัวทด' },
    sub: { op: '−', accent: '#16a34a', word: 'การลบ', pre: 'DS', term: 'ตัวลบ', unit: 'ตัวยืม' },
    mul: { op: '×', accent: '#7c3aed', word: 'การคูณ', pre: 'DM', term: 'ตัวคูณ', unit: 'ตัวคูณ' },
    div: { op: '÷', accent: '#2563eb', word: 'การหาร', pre: 'DD', term: 'ตัวหาร', unit: 'ผลหาร' }
  };

  window.Platform.register({
    id: 'decimal',
    title: 'แบบฝึกหัดทศนิยม',
    icon: 'ti-decimal',
    mount: function (host, svc) {
      ensureCSS();
      var st = { op: 'add', level: 'medium', divKind: 'dec', qdp: 2, divQd: 2, divDd: 1, divDp: 0, layout: 'work', mode: 'range', rmin: 0, rmax: 3, intDigits: 3, intA: 2, dpA: 1, intB: 3, dpB: 2, count: 10, title: '', setId: '', showKey: false, probs: [] };
      function K() { return OPS[st.op]; }
      function newSetId() { var d = new Date(); return K().pre + String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + rndI(100, 999); }
      function levelWord() { return st.level === 'easy' ? 'ง่าย' : st.level === 'medium' ? 'ปานกลาง' : st.level === 'hard' ? 'ยาก' : st.level === 'custom' ? 'กำหนดเอง' : 'สุ่มคละระดับ'; }
      function modeWord() {
        if (st.op === 'div') return (st.divKind === 'whole' ? 'คำตอบจำนวนเต็ม' : st.divKind === 'round' ? ('คำตอบปัดเศษ ' + st.qdp + ' ตำแหน่ง') : 'คำตอบทศนิยม ' + st.qdp + ' ตำแหน่ง') + (st.level === 'custom' ? ' · ผลหาร ' + st.divQd + ' หลัก ÷ ตัวหาร ' + st.divDd + ' หลัก' : '');
        if (st.mode === 'random') return 'สุ่มหลักและตำแหน่งทุกข้อ';
        return st.mode === 'custom' ? ('กำหนดเอง · ตัวตั้ง ' + st.intA + ' หลัก ' + st.dpA + ' ตำแหน่ง · ' + K().term + ' ' + st.intB + ' หลัก ' + st.dpB + ' ตำแหน่ง') : ('สุ่ม ' + st.rmin + '–' + st.rmax + ' ตำแหน่ง · ' + st.intDigits + ' หลัก'); }
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
          + tile('add', 'ti-plus', 'การบวก', true) + tile('sub', 'ti-minus', 'การลบ', true)
          + tile('mul', 'ti-x', 'การคูณ', true) + tile('div', 'ti-divide', 'การหาร', true)
          + '</div><div style="color:var(--muted);font-size:.86rem;text-align:center">เปิดใช้ครบทั้ง บวก / ลบ / คูณ / หาร แล้ว</div></div>';
        $$('.dctile', host).forEach(function (b) {
          b.onclick = function () { var o = b.dataset.op; if (o === 'add' || o === 'sub' || o === 'mul' || o === 'div') { st.op = o; st.probs = []; renderAdd(); } else if (svc.toast) svc.toast('info', 'อยู่ระหว่างพัฒนา จะเปิดให้ใช้เร็ว ๆ นี้'); };
        });
      }

      function renderAdd() {
        host.innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-ghost" id="dBack"><i class="ti ti-arrow-left"></i> กลับ</button></div>'
          + '<div class="grid-main" style="display:grid;gap:22px;grid-template-columns:340px 1fr">'
          + '<section><div class="panel" style="padding:18px;display:flex;flex-direction:column;gap:14px">'
          + '<div class="eyebrow">ตั้งค่าชุดแบบฝึก' + K().word + 'ทศนิยม</div>'
          + (st.op === 'div' ?
            ('<div class="dc-field"><label>แบบคำตอบ</label><select id="dDivKind">'
              + opt('dec', 'ทศนิยม (หารลงตัวพอดี)', st.divKind) + opt('round', 'ทศนิยม (ปัดเศษ ≈)', st.divKind) + opt('whole', 'จำนวนเต็ม (ไม่มีทศนิยม)', st.divKind) + '</select></div>'
              + '<div class="dc-field" id="dQdpBox"' + (st.divKind !== 'whole' ? '' : ' style="display:none"') + '><label>ตำแหน่งทศนิยมของผลหาร</label><select id="dQdp">'
              + [1, 2, 3].map(function (n) { return opt(n, n + ' ตำแหน่ง', st.qdp); }).join('') + '</select></div>') : '')
          + ((st.op === 'mul' || st.op === 'div') ?
            ('<div class="dc-field"><label>รูปแบบตัวเลข</label><select id="dNumMode">'
              + opt('custom', 'กำหนดเองทุกค่า', st.numMode) + opt('random', 'คละทั้งหมด (สุ่มทุกค่า)', st.numMode) + '</select></div>'
              + '<div class="dc-field" id="dFreeBox"' + (st.numMode === 'custom' ? '' : ' style="display:none"') + '><label>กำหนดค่าเอง (หลัก · ตำแหน่งทศนิยม)</label>'
              + (st.op === 'mul'
                ? ('<div class="dc-row"><span class="lbl">ตัวตั้ง</span><input id="dIntA" type="number" min="1" max="7" value="' + st.intA + '"> หลัก <select id="dDpA">' + dpShort(st.dpA) + '</select> ตน.</div>'
                   + '<div class="dc-row"><span class="lbl">ตัวคูณ</span><input id="dIntB" type="number" min="1" max="4" value="' + st.intB + '"> หลัก <select id="dDpB">' + dpShort(st.dpB) + '</select> ตน.</div>'
                   + '<div style="font-size:11px;color:var(--muted);margin-top:4px">ตัวคูณ หลัก+ทศนิยม รวมกันยิ่งมาก แถวผลคูณย่อยยิ่งเยอะ</div>')
                : ((st.divKind === 'round'
                    ? '<div class="dc-row"><span class="lbl">ตัวตั้ง</span><input id="dIntA" type="number" min="1" max="7" value="' + st.intA + '"> หลัก <select id="dDpA">' + dpShort(st.dpA) + '</select> ตน.</div>'
                    : '<div class="dc-row"><span class="lbl">ผลหาร</span><input id="dDivQd" type="number" min="1" max="4" value="' + st.divQd + '"> หลัก</div>')
                   + '<div class="dc-row"><span class="lbl">ตัวหาร</span><input id="dDivDd" type="number" min="1" max="3" value="' + st.divDd + '"> หลัก <select id="dDivDp">' + [0, 1, 2, 3].map(function (n) { return opt(n, n, st.divDp); }).join('') + '</select> ตน.</div>'))
              + '</div>')
            : ('<div class="dc-field"><label>ระดับความยาก (' + K().unit + ')</label><select id="dLevel">'
              + opt('easy', 'ง่าย — ' + K().unit + 'น้อย (0–1)', st.level)
              + opt('medium', 'ปานกลาง — มี' + K().unit + ' 2–3 ตัว', st.level)
              + opt('hard', 'ยาก — มี' + K().unit + 'ทุกหลัก', st.level)
              + opt('random', 'สุ่ม — คละทุกระดับ', st.level) + '</select></div>'
              + '<div class="dc-field"><label>โหมดกำหนดตำแหน่ง</label><select id="dMode">' + opt('range', 'สุ่มช่วง 0–3 ตำแหน่ง', st.mode) + opt('custom', 'กำหนดหลักเองทุกจุด', st.mode) + opt('random', 'สุ่มทั้งหมด (หลัก+ตำแหน่ง)', st.mode) + '</select></div>'))
          + (st.op === 'div' ? '' : '<div class="dc-field" id="dRangeBox"' + (st.mode === 'range' ? '' : ' style="display:none"') + '>'
          + '<label>สุ่มตำแหน่งทศนิยม</label><div class="dc-inline"><select id="dRmin">' + dpShort(st.rmin) + '</select><span>ถึง</span><select id="dRmax">' + dpShort(st.rmax) + '</select><span>ตำแหน่ง</span></div>'
          + '<label style="margin-top:8px">จำนวนหลักหน้าจุด (จำนวนเต็ม)</label><input id="dInt" type="number" min="1" max="7" value="' + st.intDigits + '"></div>')
          + (st.op === 'div' ? '' : '<div class="dc-field" id="dCustomBox"' + (st.mode === 'custom' ? '' : ' style="display:none"') + '>'
          + '<label>กำหนดหลักเอง (หลักหน้าจุด · ตำแหน่งทศนิยม)</label>'
          + '<div class="dc-row"><span class="lbl">ตัวตั้ง</span><input id="dIntA" type="number" min="1" max="7" value="' + st.intA + '"> หลัก <select id="dDpA">' + dpShort(st.dpA) + '</select> ตำแหน่ง</div>'
          + '<div class="dc-row"><span class="lbl">' + K().term + '</span><input id="dIntB" type="number" min="1" max="7" value="' + st.intB + '"> หลัก <select id="dDpB">' + dpShort(st.dpB) + '</select> ตำแหน่ง</div></div>')
          + ((st.op === 'mul' || st.op === 'div') ?
            ('<div class="dc-field"><label>รูปแบบใบงาน</label><select id="dLayout">'
              + opt('work', 'แสดงวิธีทำ (ตั้งหลัก)', st.layout) + opt('inline', 'โจทย์บรรทัดเดียว (ตอบเลย)', st.layout) + '</select></div>') : '')
          + '<div class="dc-field"><label>จำนวนข้อ (สูงสุด 50)</label><input id="dCount" type="number" min="1" max="50" value="' + st.count + '"></div>'
          + '<div class="dc-field"><label>ชื่อชุด (เว้นว่างได้)</label><input id="dTitle" value="' + esc(st.title) + '" placeholder="เช่น ' + K().word + 'ทศนิยม ชุดที่ 1"></div>'
          + '<button class="btn btn-accent" id="dGen"><i class="ti ti-refresh"></i> สร้างชุดแบบฝึก</button>'
          + '<button class="btn btn-ghost" id="dTimer"><i class="ti ti-clock"></i> จับเวลาเต็มจอ</button>'
          + '</div></section><section id="dOut"></section></div>';
        $('#dBack', host).onclick = renderHome;
        $('#dTimer', host).onclick = tmOpen;
        $('#dDivKind', host) && ($('#dDivKind', host).onchange = function () { st.divKind = this.value; var b = $('#dQdpBox', host); if (b) b.style.display = (this.value !== 'whole') ? '' : 'none'; renderAdd(); });
        if ($('#dNumMode', host)) $('#dNumMode', host).onchange = function () { st.numMode = this.value; var b = $('#dFreeBox', host); if (b) b.style.display = this.value === 'custom' ? '' : 'none'; };
        if ($('#dMode', host)) $('#dMode', host).onchange = function () {
          st.mode = this.value;
          $('#dRangeBox', host).style.display = this.value === 'range' ? '' : 'none';
          $('#dCustomBox', host).style.display = this.value === 'custom' ? '' : 'none';
          var qb = $('#dQdpBox', host), hb = $('#dDivHint', host), dk = $('#dDivKind', host);
          if (qb) qb.style.display = (dk && dk.value === 'dec' && this.value !== 'custom') ? '' : 'none';
          if (hb) hb.style.display = this.value === 'custom' ? '' : 'none';
        };
        $('#dGen', host).onclick = function () {
          if ($('#dLevel', host)) st.level = $('#dLevel', host).value;
          if ($('#dNumMode', host)) st.numMode = $('#dNumMode', host).value;
          if ($('#dDivKind', host)) st.divKind = $('#dDivKind', host).value;
          if ($('#dQdp', host)) st.qdp = +$('#dQdp', host).value;
          if ($('#dDivQd', host)) st.divQd = clampI($('#dDivQd', host).value, 1, 4, 2);
          if ($('#dDivDd', host)) st.divDd = clampI($('#dDivDd', host).value, 1, 3, 1);
          if ($('#dDivDp', host)) st.divDp = clampI($('#dDivDp', host).value, 0, 2, 0);
          if ($('#dLayout', host)) st.layout = $('#dLayout', host).value;
          if ($('#dMode', host)) st.mode = $('#dMode', host).value;
          if ($('#dRmin', host)) { st.rmin = clampI($('#dRmin', host).value, 0, 3, 0); st.rmax = clampI($('#dRmax', host).value, 0, 3, 3); } if (st.rmax < st.rmin) { var t = st.rmin; st.rmin = st.rmax; st.rmax = t; }
          if ($('#dInt', host)) st.intDigits = clampI($('#dInt', host).value, 1, 7, 3);
          if ($('#dIntA', host)) { st.intA = clampI($('#dIntA', host).value, 1, 7, 2); st.dpA = clampI($('#dDpA', host).value, 0, 3, 1); }
          if ($('#dIntB', host)) { st.intB = clampI($('#dIntB', host).value, 1, 7, 3); st.dpB = clampI($('#dDpB', host).value, 0, 3, 2); }
          st.count = clampI($('#dCount', host).value, 1, 50, 10); st.title = $('#dTitle', host).value.trim();
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
        var pWi = 0, pWf = 0;
        if (st.op === 'mul') st.probs.forEach(function (p) { var L = mulLayout(p.a, p.b); pWi = Math.max(pWi, L.wi); pWf = Math.max(pWf, L.wo); });
        var cells = st.probs.map(function (p, i) { return '<div class="dc-pb"><span class="no">' + (i + 1) + ')</span>' + (st.layout === 'inline' ? inlineHTML(p, st.showKey, K().op, st.divKind === 'round') : st.op === 'div' ? calcGridDiv(p, st.showKey) : st.op === 'mul' ? calcGridMul(p, st.showKey, K().op, pWi, pWf) : calcGrid(p, st.showKey, K().op)) + '</div>'; }).join('');
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
        var o = { title: defTitle(), setId: st.setId, opSym: cur.op, op: st.op, layout: ((st.op === 'mul' || st.op === 'div') ? st.layout : 'work'), approx: (st.op === 'div' && st.divKind === 'round'), sub: cur.word + ' · ระดับ' + levelWord() + ' · ' + modeWord(),
          accent: cur.accent, org: S.org || '', logo: S.logo || LOGO, probs: st.probs, qrImg: '' };
        var finish = function (qrImg) { o.qrImg = qrImg || ''; printDoc(sheetHTML(o, withKey)); if (svc.toast) svc.toast('success', withKey ? 'เปิดหน้าพิมพ์ฉบับเฉลยแล้ว' : 'เปิดหน้าพิมพ์ใบงานแล้ว'); };
        if (!withKey) {
          var answers = st.probs.map(function (p) { return st.op === 'div' ? showNum(p.ans) : (p.ans.digits ? showNum({ ip: p.ans.ip, fp: p.ans.fp, dp: p.ans.dp }) : showNum(p.ans)); });   // เฉพาะคำตอบ (ให้ QR ไม่ล้น)
          var mk = (svc.keyURL ? svc.keyURL : keyURLLocal);
          var url = fitQRText(o.title, st.setId, answers, mk);
          makeQRLocal(url).then(function (img) {
            if (!img && svc.toast) svc.toast('info', 'สร้าง QR เฉลยไม่สำเร็จ — พิมพ์ใบงานต่อโดยไม่มี QR');
            finish(img);
          }, function () { finish(''); });
        } else finish('');
      }

      renderHome();
    }
  });
})();
