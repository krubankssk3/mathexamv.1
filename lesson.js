/*** EduForge plugin — แบบฝึกหัด (แสดงวิธีทำ) ****************************
 * ต่อ Node: เลือกชั้น → เลือกบท → สุ่มโจทย์พร้อม "วิธีทำ" ทีละขั้น
 * ทำงานฝั่งหน้าเว็บล้วน (ใช้ generator เดียวกับใบงาน) ไม่เรียก backend
 * รองรับวิธีทำละเอียด: บวก/ลบ/คูณ/หาร, ร้อยละ, หน่วยวัด, สมการ, โจทย์ปัญหา
 * ชนิดอื่นจะแสดงเฉลยไปก่อน แล้วค่อยเพิ่มวิธีทำทีหลัง
 ***********************************************************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- ตัวช่วยสร้างวิธีทำ ---------- */
  function dig(n) { var a = []; n = Math.abs(n); if (n === 0) return [0]; while (n > 0) { a.push(n % 10); n = Math.floor(n / 10); } return a; }
  function placeName(i) { return ['หลักหน่วย', 'หลักสิบ', 'หลักร้อย', 'หลักพัน', 'หลักหมื่น'][i] || ('หลักที่ ' + (i + 1)); }
  function addSteps(a, b) {
    var x = dig(a), y = dig(b), m = Math.max(x.length, y.length), carry = 0, L = ['• ตั้งเลขให้ตรงหลักกัน แล้วบวกจากหลักหน่วยไปซ้าย'];
    for (var i = 0; i < m; i++) {
      var s = (x[i] || 0) + (y[i] || 0) + carry, c2 = s >= 10 ? 1 : 0, d = s % 10;
      var t = '• ' + placeName(i) + ': ' + (x[i] || 0) + ' + ' + (y[i] || 0) + (carry ? ' + ' + carry + ' (ตัวทด)' : '') + ' = ' + s;
      if (c2) t += ' → เขียน ' + d + ' ทด ' + c2;
      L.push(t); carry = c2;
    }
    if (carry) L.push('• ทดตัวสุดท้าย เขียน ' + carry + ' ไว้หน้าสุด');
    L.push('<b>ตอบ ' + (a + b) + '</b>'); return L;
  }
  function subSteps(a, b) {
    var x = dig(a).slice(), y = dig(b), m = x.length, L = ['• ตั้งเลขให้ตรงหลักกัน แล้วลบจากหลักหน่วยไปซ้าย'];
    for (var i = 0; i < m; i++) {
      var xi = x[i], yi = y[i] || 0;
      if (xi < yi) { L.push('• ' + placeName(i) + ': ' + xi + ' − ' + yi + ' ไม่พอลบ ยืม 1 จาก' + placeName(i + 1) + ' → ' + (xi + 10) + ' − ' + yi + ' = ' + (xi + 10 - yi)); x[i + 1] = (x[i + 1] || 0) - 1; }
      else { L.push('• ' + placeName(i) + ': ' + xi + ' − ' + yi + ' = ' + (xi - yi)); }
    }
    L.push('<b>ตอบ ' + (a - b) + '</b>'); return L;
  }
  function mulSteps(a, b) {
    var L = [], big = dig(a).length >= dig(b).length ? a : b, sm = big === a ? b : a, x = dig(big), terms = [];
    for (var i = x.length - 1; i >= 0; i--) { if (x[i] === 0) continue; terms.push(x[i] * Math.pow(10, i)); }
    if (terms.length <= 1) { L.push('• ท่องสูตรคูณ: ' + a + ' × ' + b + ' = ' + (a * b)); }
    else {
      L.push('• แยก ' + big + ' ตามค่าประจำหลัก แล้วคูณด้วย ' + sm + ':');
      L.push('• = ' + terms.map(function (pv) { return '(' + pv + ' × ' + sm + ')'; }).join(' + '));
      L.push('• = ' + terms.map(function (pv) { return pv * sm; }).join(' + '));
    }
    L.push('<b>ตอบ ' + (a * b) + '</b>'); return L;
  }
  function divSteps(a, b, ans) { return ['• คิดว่า ' + b + ' คูณด้วยจำนวนใดจึงได้ ' + a, '• ' + b + ' × ' + ans + ' = ' + a, '<b>ตอบ ' + ans + '</b>']; }
  function arithSteps(m) {
    if (m.op === '+') return addSteps(m.a, m.b);
    if (m.op === '\u2212') return subSteps(m.a, m.b);
    if (m.op === '\u00d7') return mulSteps(m.a, m.b);
    if (m.op === '\u00f7') return divSteps(m.a, m.b, m.ans);
    return ['<b>ตอบ ' + m.ans + '</b>'];
  }
  function percentSteps(m) { return ['• ' + m.p + '% หมายถึง ' + m.p + ' ส่วนในร้อยส่วน', '• ' + m.p + '% ของ ' + m.b + ' = (' + m.p + ' ÷ 100) × ' + m.b + ' = ' + m.v, '<b>ตอบ ' + m.v + '</b>']; }
  function measureSteps(m) { return ['• เทียบหน่วย: 1 ' + m.unit + ' = ' + m.f + ' ' + m.to, '• ' + m.n + ' ' + m.unit + ' = ' + m.n + ' × ' + m.f + ' = ' + m.ans + ' ' + m.to, '<b>ตอบ ' + m.ans + ' ' + m.to + '</b>']; }
  function equationSteps(m) {
    var rhs = m.c - m.b;
    return ['• ตั้งสมการ: ' + m.a + 'x ' + (m.b < 0 ? '− ' + (-m.b) : '+ ' + m.b) + ' = ' + m.c,
      '• ย้ายข้าง: ' + m.a + 'x = ' + m.c + ' ' + (m.b < 0 ? '+ ' + (-m.b) : '− ' + m.b) + ' = ' + rhs,
      '• x = ' + rhs + ' ÷ ' + m.a + ' = ' + m.x, '<b>ตอบ x = ' + m.x + '</b>'];
  }
  function wordSteps(m) {
    if (m.kind === 0) return ['• ตอนแรกมี ' + m.a + ' ชิ้น ซื้อเพิ่มอีก ' + m.b + ' ชิ้น', '• นำมาบวกกัน: ' + m.a + ' + ' + m.b + ' = ' + m.ans, '<b>ตอบ ' + m.ans + ' ชิ้น</b>'];
    if (m.kind === 1) { var bg = Math.max(m.a, m.b), sm = Math.min(m.a, m.b); return ['• มีอยู่ ' + bg + ' ชิ้น ให้เพื่อนไป ' + sm + ' ชิ้น', '• นำมาลบกัน: ' + bg + ' − ' + sm + ' = ' + m.ans, '<b>ตอบ ' + m.ans + ' ชิ้น</b>']; }
    return ['• วันละ ' + m.a + ' ชิ้น เป็นเวลา ' + m.b + ' วัน', '• นำมาคูณกัน: ' + m.a + ' × ' + m.b + ' = ' + m.ans, '<b>ตอบ ' + m.ans + ' ชิ้น</b>'];
  }
  function buildSolution(item) {
    var m = item.meta; if (!m) return null;
    if (m.t === 'arith') return arithSteps(m);
    if (m.t === 'percent') return percentSteps(m);
    if (m.t === 'measure') return measureSteps(m);
    if (m.t === 'equation') return equationSteps(m);
    if (m.t === 'word') return wordSteps(m);
    return null;
  }

  window.Platform.register({
    id: 'lesson',
    mount: function (host, svc) {
      var CUR = svc.curriculum || { grades: [], subject: 'คณิตศาสตร์' };
      var lockGrade = (svc.ctx && svc.ctx.gradeId) || null;
      var firstG = lockGrade ? (CUR.grades.filter(function (g) { return g.id === lockGrade; })[0] || CUR.grades[0]) : CUR.grades[0];
      var st = {
        gradeId: firstG && firstG.id,
        chapterId: firstG && firstG.chapters[0] && firstG.chapters[0].id,
        level: 'easy', count: 6, chPage: 0, items: [], showSteps: true, busy: false
      };
      function gradeOf(id) { return CUR.grades.filter(function (g) { return g.id === id; })[0]; }
      function chapterOf(gid, cid) { var g = gradeOf(gid); return g && g.chapters.filter(function (c) { return c.id === cid; })[0]; }

      host.innerHTML =
        '<div class="grid-main" style="display:grid;gap:22px;grid-template-columns:360px 1fr">' +
          '<section style="display:flex;flex-direction:column;gap:18px">' +
            '<div class="panel" style="padding:18px">' +
              '<div class="eyebrow" style="margin-bottom:10px">เลือกชั้น / บทเรียน</div>' +
              '<span class="chip" style="margin-bottom:12px"><i class="ti ti-book"></i> ' + CUR.subject + '</span>' +
              '<label class="lbl">ระดับชั้น</label>' +
              '<div id="grades" style="display:flex;gap:8px;overflow:auto;padding-bottom:6px;margin:6px 0 14px"></div>' +
              '<label class="lbl">บทเรียน / เรื่อง</label>' +
              '<div id="chapters" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px"></div>' +
              '<div id="chPager" class="pager" style="display:none"></div>' +
            '</div>' +
            '<div class="panel" style="padding:18px">' +
              '<div class="eyebrow" style="margin-bottom:12px">ตั้งค่าแบบฝึกหัด</div>' +
              '<label class="lbl">ระดับความยาก</label>' +
              '<div class="seg" id="lv" style="margin:5px 0 14px"><button data-l="easy" class="on">ง่าย</button><button data-l="medium">ปานกลาง</button><button data-l="hard">ยาก</button></div>' +
              '<label class="lbl">จำนวนข้อ</label>' +
              '<input id="cnt" type="number" min="1" max="20" value="6" class="field mono" style="margin:5px 0 14px">' +
              '<button class="btn btn-accent" style="width:100%;justify-content:center" id="gen"><i class="ti ti-sparkles"></i> สุ่มโจทย์พร้อมวิธีทำ</button>' +
            '</div>' +
          '</section>' +
          '<section style="display:flex;flex-direction:column;gap:14px">' +
            '<div class="panel no-print" style="padding:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
              '<div style="display:flex;flex-direction:column;gap:3px"><span class="mono" id="crumb" style="font-size:.72rem;color:var(--muted)">—</span>' +
                '<div class="eyebrow">แบบฝึกหัด — แสดงวิธีทำ</div></div>' +
              '<div style="margin-left:auto;display:flex;flex-wrap:wrap;gap:8px">' +
                '<button class="btn btn-ghost" id="redo"><i class="ti ti-dice-3"></i> สุ่มใหม่</button>' +
                '<button class="btn btn-ghost" id="toggle"><i class="ti ti-eye-off"></i> ซ่อนวิธีทำ</button>' +
                '<button class="btn btn-accent" id="print"><i class="ti ti-printer"></i> พิมพ์/PDF</button>' +
              '</div></div>' +
            '<div class="stage" id="stage"></div>' +
          '</section>' +
        '</div>';

      function drawGrades() {
        var c = $('#grades', host); c.innerHTML = '';
        (CUR.grades || []).forEach(function (gr) {
          var b = document.createElement('button'); b.className = 'chip' + (gr.id === st.gradeId ? ' on' : '');
          b.textContent = gr.name; b.style.whiteSpace = 'nowrap';
          if (lockGrade && gr.id !== lockGrade) b.disabled = true;
          else b.onclick = function () { st.gradeId = gr.id; st.chapterId = gr.chapters[0] && gr.chapters[0].id; st.chPage = 0; drawGrades(); drawChapters(); setCrumb(); };
          c.appendChild(b);
        });
      }
      function chTiles(all, shown) {
        var c = $('#chapters', host); c.innerHTML = '';
        shown.forEach(function (ch) {
          var el = document.createElement('button'); el.className = 'tile' + (ch.id === st.chapterId ? ' on' : '');
          var ico = /^https?:\/\//.test(String(ch.icon || '')) ? '<img src="' + ch.icon + '" style="width:24px;height:24px;object-fit:contain">' : '<i class="ti ' + (ch.icon || 'ti-file') + '"></i>';
          el.innerHTML = '<div class="ic">' + ico + '</div><div class="font-display" style="font-weight:600;margin-top:8px;font-size:.92rem;line-height:1.2">' + ch.name + '</div>';
          el.onclick = function () { st.chapterId = ch.id; drawChapters(); setCrumb(); };
          c.appendChild(el);
        });
      }
      function drawChapters(keepPage) {
        var all = gradeOf(st.gradeId).chapters, PER = 6, pages = Math.max(1, Math.ceil(all.length / PER));
        if (!keepPage) { var idx = all.map(function (x) { return x.id; }).indexOf(st.chapterId); if (idx >= 0) st.chPage = Math.floor(idx / PER); }
        if (st.chPage >= pages) st.chPage = pages - 1;
        chTiles(all, all.slice(st.chPage * PER, st.chPage * PER + PER));
        var pg = $('#chPager', host);
        if (pages > 1) {
          pg.style.display = 'flex';
          pg.innerHTML = '<button class="pg-btn" data-d="-1"' + (st.chPage === 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
            '<span class="pg-info">หน้า ' + (st.chPage + 1) + ' / ' + pages + '</span>' +
            '<button class="pg-btn" data-d="1"' + (st.chPage === pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button>';
          $$('.pg-btn', pg).forEach(function (b) { b.onclick = function () { if (b.disabled) return; st.chPage += (+b.dataset.d); drawChapters(true); }; });
        } else { pg.style.display = 'none'; pg.innerHTML = ''; }
      }
      function setCrumb() {
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        $('#crumb', host).textContent = (g ? g.name : '') + (ch ? ' · ' + ch.name : '');
      }

      function build() {
        var ch = chapterOf(st.gradeId, st.chapterId);
        if (!ch) { svc.toast('error', 'ยังไม่ได้เลือกบทเรียน'); return; }
        st.busy = true;
        var res = svc.genProblems(ch, st.level, st.count);
        st.items = res.problems || [];
        st.busy = false;
        render();
      }

      function render() {
        var ch = chapterOf(st.gradeId, st.chapterId);
        var stage = $('#stage', host);
        if (!st.items.length) {
          stage.innerHTML = '<div class="panel" style="padding:48px;text-align:center;color:var(--muted)"><i class="ti ti-notebook" style="font-size:42px"></i><div style="margin-top:10px">เลือกบทเรียนแล้วกด “สุ่มโจทย์พร้อมวิธีทำ”</div></div>';
          return;
        }
        var cards = st.items.map(function (it, i) {
          var steps = buildSolution(it);
          var stepsHTML = steps
            ? '<div class="sol-steps"><div class="sol-h">วิธีทำ</div>' + steps.join('<br>') + '</div>'
            : '<div class="sol-steps"><div class="sol-h">เฉลย</div><b>ตอบ ' + (it.a != null ? it.a : '-') + '</b></div>';
          return '<div class="sol-card">' +
            '<div class="sol-q"><span class="sol-no">' + (i + 1) + '</span><span class="sol-qt">' + it.q + '</span></div>' +
            stepsHTML + '</div>';
        }).join('');
        stage.innerHTML = '<div class="panel ' + (st.showSteps ? '' : 'hide-steps') + '" id="solWrap" style="padding:20px">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">' +
            '<div class="font-display" style="font-weight:700;font-size:1.05rem">' + (ch ? ch.name : '') + '</div>' +
            '<span class="chip" style="margin-left:auto">' + gradeOf(st.gradeId).name + ' · ' + ({ easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' }[st.level]) + '</span>' +
          '</div>' +
          '<div class="sol-list">' + cards + '</div></div>';
        if (svc.reveal) svc.reveal(stage);
      }

      function printAll() {
        if (!st.items.length) { svc.toast('error', 'ยังไม่มีโจทย์ ให้สุ่มก่อน'); return; }
        var S = svc.settings || {}, ch = chapterOf(st.gradeId, st.chapterId), g = gradeOf(st.gradeId);
        var head = '<div class="exam-head"><img src="' + (S.logo || '') + '">' +
          '<div style="flex:1"><h1>' + (S.org || 'แบบฝึกหัด') + '</h1><div class="sub">' + (S.dept || '') + '</div></div></div>' +
          '<div style="text-align:center;margin:14px 0 6px"><div class="font-display" style="font-size:18px;font-weight:700">แบบฝึกหัด แสดงวิธีทำ — ' + (ch ? ch.name : '') + '</div>' +
          '<div class="sub">' + (g ? g.name : '') + ' · เรื่อง ' + CUR.subject + '</div></div>';
        var body = st.items.map(function (it, i) {
          var steps = buildSolution(it);
          var sh = steps ? steps.join('<br>') : ('<b>ตอบ ' + (it.a != null ? it.a : '-') + '</b>');
          return '<div class="ex-card"><div class="ex-no">ข้อ ' + (i + 1) + '</div><div class="ex-body"><div style="font-weight:700;margin-bottom:6px">' + it.q + '</div>' + sh + '</div></div>';
        }).join('');
        var foot = '<div class="sheet-foot"><span>พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3</span></div>';
        svc.printNode('<div class="sheet"><div class="exam-body">' + head + '<div class="ex-list print">' + body + '</div>' + foot + '</div></div>');
      }

      // events
      $$('#lv button', host).forEach(function (b) { b.onclick = function () { $$('#lv button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.level = b.dataset.l; }; });
      $('#cnt', host).onchange = function () { st.count = Math.max(1, Math.min(20, +this.value || 6)); this.value = st.count; };
      $('#gen', host).onclick = build;
      $('#redo', host).onclick = build;
      $('#toggle', host).onclick = function () {
        st.showSteps = !st.showSteps;
        this.innerHTML = st.showSteps ? '<i class="ti ti-eye-off"></i> ซ่อนวิธีทำ' : '<i class="ti ti-eye"></i> แสดงวิธีทำ';
        var w = $('#solWrap', host); if (w) w.classList.toggle('hide-steps', !st.showSteps);
      };
      $('#print', host).onclick = printAll;

      drawGrades(); drawChapters(); setCrumb(); render();
    }
  });
})();
