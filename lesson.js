/*** EduForge plugin — แบบฝึกหัด (แสดงวิธีทำ) ****************************
 * โหมดอ่าน: ดึงเนื้อหาจาก window.EduForgeLessons (ไฟล์ lessons-data.js)
 * ครูเอาเนื้อหามาจากที่อื่น แล้วเพิ่มเป็น Node ในไฟล์ข้อมูล (ทีละอัน)
 * ทำงานฝั่งหน้าเว็บล้วน · ทุกคนเปิดดู/พิมพ์ได้ · ไม่ต้อง backend
 ***********************************************************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  window.Platform.register({
    id: 'lesson',
    mount: function (host, svc) {
      var CUR = svc.curriculum || { grades: [] };
      var DATA = (window.EduForgeLessons || []).slice();
      var lockGrade = (svc.ctx && svc.ctx.gradeId) || null;
      var st = { grade: lockGrade || 'all', page: 0 };

      function gradeName(id) {
        var g = (CUR.grades || []).filter(function (x) { return x.id === id; })[0];
        return g ? g.name : (id || 'ทั่วไป');
      }
      // ชั้นที่มีเนื้อหาจริง (เรียงตามหลักสูตร ถ้ามี)
      function gradesWithData() {
        var present = {}; DATA.forEach(function (l) { present[l.grade || ''] = true; });
        var ordered = (CUR.grades || []).filter(function (g) { return present[g.id]; }).map(function (g) { return { id: g.id, name: g.name }; });
        // ชั้น/หมวดที่ไม่ตรงหลักสูตร
        Object.keys(present).forEach(function (k) {
          if (!ordered.filter(function (o) { return o.id === k; }).length) ordered.push({ id: k, name: k || 'ทั่วไป' });
        });
        return ordered;
      }

      function renderItems(items, cls) {
        return (items || []).map(function (it, i) {
          var steps = (it.steps || []).join('<br>');
          if (cls === 'print') {
            return '<div class="ex-card"><div class="ex-no">ข้อ ' + (i + 1) + '</div><div class="ex-body"><div style="font-weight:700;margin-bottom:6px">' + (it.q || '') + '</div>' + steps + '</div></div>';
          }
          return '<div class="sol-card">' +
            '<div class="sol-q"><span class="sol-no">' + (i + 1) + '</span><span class="sol-qt">' + (it.q || '') + '</span></div>' +
            '<div class="sol-steps"><div class="sol-h">วิธีทำ</div>' + steps + '</div></div>';
        }).join('');
      }

      /* ---------- รายการ ---------- */
      function renderList() {
        var list = DATA.filter(function (l) { return st.grade === 'all' || (l.grade || '') === st.grade; });
        var PER = 10, pages = Math.max(1, Math.ceil(list.length / PER));
        if (st.page >= pages) st.page = pages - 1; if (st.page < 0) st.page = 0;
        var shown = list.slice(st.page * PER, st.page * PER + PER);

        var chips = '';
        if (!lockGrade) {
          chips = '<div id="lsGrades" style="display:flex;gap:8px;overflow:auto;padding-bottom:6px;margin:6px 0 16px">' +
            '<button class="chip click' + (st.grade === 'all' ? ' on' : '') + '" data-g="all" style="white-space:nowrap">ทั้งหมด</button>' +
            gradesWithData().map(function (g) { return '<button class="chip click' + (st.grade === g.id ? ' on' : '') + '" data-g="' + esc(g.id) + '" style="white-space:nowrap">' + esc(g.name) + '</button>'; }).join('') +
            '</div>';
        }

        var cards = shown.map(function (l, j) {
          var i = st.page * PER + j;
          return '<div class="qcard" style="display:flex;align-items:center;gap:14px;margin:0">' +
            '<span class="stamp"><i class="ti ti-notebook"></i></span>' +
            '<div style="flex:1;min-width:0"><div class="font-display" style="font-weight:600">' + esc(l.title || '(ไม่มีชื่อ)') + '</div>' +
            '<div style="color:var(--muted);font-size:.82rem">' + esc(gradeName(l.grade)) + ' · ' + ((l.items || []).length) + ' ข้อ</div></div>' +
            '<button class="btn btn-accent" data-view="' + i + '"><i class="ti ti-eye"></i> ดูวิธีทำ</button></div>';
        }).join('');

        var empty = '<div style="text-align:center;padding:48px;color:var(--muted)"><i class="ti ti-notebook" style="font-size:42px"></i>' +
          '<div style="margin-top:10px">ยังไม่มีแบบฝึกหัดในส่วนนี้</div>' +
          '<div style="margin-top:6px;font-size:.85rem">เนื้อหาจะถูกเพิ่มลงไฟล์ lessons-data.js</div></div>';

        var pager = pages > 1 ? '<div class="pager" style="display:flex">' +
          '<button class="pg-btn lsPrev"' + (st.page === 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
          '<span class="pg-info">หน้า ' + (st.page + 1) + ' / ' + pages + ' (รวม ' + list.length + ')</span>' +
          '<button class="pg-btn lsNext"' + (st.page === pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button></div>' : '';

        host.innerHTML =
          '<div class="panel" style="padding:22px">' +
            '<div class="eyebrow">แบบฝึกหัด</div>' +
            '<h3 class="font-display" style="margin:.2rem 0 4px;font-weight:700">แบบฝึกหัด — แสดงวิธีทำ</h3>' +
            '<p style="color:var(--muted);font-size:.88rem;margin:0 0 12px">ตัวอย่างการคิดและวิธีทำทีละขั้น เปิดดูและพิมพ์เป็นใบความรู้ได้</p>' +
            chips +
            '<div style="display:grid;gap:12px">' + (shown.length ? cards : empty) + '</div>' +
            pager +
          '</div>';

        $$('#lsGrades .chip', host).forEach(function (b) { b.onclick = function () { st.grade = b.dataset.g; st.page = 0; renderList(); }; });
        var pv = $('.lsPrev', host), nx = $('.lsNext', host);
        if (pv) pv.onclick = function () { if (st.page > 0) { st.page--; renderList(); } };
        if (nx) nx.onclick = function () { st.page++; renderList(); };
        $$('[data-view]', host).forEach(function (b) { b.onclick = function () { view(list[+b.dataset.view]); }; });
      }

      /* ---------- ดูวิธีทำ ---------- */
      function view(l) {
        if (!l) return;
        host.innerHTML =
          '<div class="panel" style="padding:22px">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">' +
              '<button class="btn btn-ghost" id="lsBack"><i class="ti ti-arrow-left"></i> กลับ</button>' +
              '<button class="btn btn-accent" id="lsPrint" style="margin-left:auto"><i class="ti ti-printer"></i> พิมพ์เป็นใบความรู้</button>' +
            '</div>' +
            '<div class="eyebrow">' + esc(gradeName(l.grade)) + '</div>' +
            '<h2 class="font-display" style="margin:.2rem 0 16px;font-weight:800"><span class="grad-text">' + esc(l.title || '') + '</span></h2>' +
            '<div class="sol-list">' + renderItems(l.items) + '</div>' +
          '</div>';
        $('#lsBack', host).onclick = function () { renderList(); };
        $('#lsPrint', host).onclick = function () { printLesson(l); };
        if (svc.reveal) svc.reveal(host);
      }

      /* ---------- พิมพ์ ---------- */
      function printLesson(l) {
        var S = svc.settings || {};
        var head = '<div class="exam-head"><img src="' + (S.logo || '') + '">' +
          '<div style="flex:1"><h1>' + esc(S.org || 'แบบฝึกหัด') + '</h1><div class="sub">' + esc(S.dept || '') + '</div></div></div>' +
          '<div style="text-align:center;margin:14px 0 6px"><div class="font-display" style="font-size:18px;font-weight:700">' + esc(l.title || '') + '</div>' +
          '<div class="sub">ใบความรู้ · แสดงวิธีทำ · ' + esc(gradeName(l.grade)) + '</div></div>';
        var foot = '<div class="sheet-foot"><span>พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3</span></div>';
        svc.printNode('<div class="sheet"><div class="exam-body">' + head + '<div class="ex-list print">' + renderItems(l.items, 'print') + '</div>' + foot + '</div></div>');
      }

      renderList();
    }
  });
})();
