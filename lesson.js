/*** EduForge plugin — ระบบแบบฝึกหัด (แสดงวิธีทำ) *************************
 * ครูสร้าง Node เนื้อหาเอง: เลือกระดับชั้น + ใส่หัวข้อ + เขียนวิธีทำ
 * คั่นหลายตัวอย่างในชิ้นเดียวด้วยบรรทัด === (สามตัวขึ้นไป)
 * นักเรียน/สาธารณะเปิดดูได้ · ครู/แอดมินเพิ่ม/แก้/ลบ/เปิด-ปิด
 ***********************************************************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  window.Platform.register({
    id: 'lesson',
    mount: function (host, svc) {
      var CUR = svc.curriculum || { grades: [] };
      var canManage = svc.user && svc.user.role !== 'public';
      var lockGrade = (svc.ctx && svc.ctx.gradeId) || null;
      var st = { gradeId: lockGrade || 'all', page: 0, lessons: [], loaded: false };
      var INP = 'width:100%;margin:.3rem 0 .6rem;padding:.6rem .7rem;border-radius:9px;background:#0b1120;color:#e6ebf7;border:1px solid #2a3556;font-family:Sarabun,sans-serif';

      function grades() { return CUR.grades || []; }
      function gradeName(id) { var g = grades().filter(function (x) { return x.id === id; })[0]; return g ? g.name : '—'; }

      /* ---------- แปลงเนื้อหาเป็นการ์ดตัวอย่าง ---------- */
      function renderContent(content) {
        var blocks = String(content || '').split(/\n\s*={3,}\s*\n/);
        var multi = blocks.length > 1;
        return blocks.map(function (b, i) {
          var body = b.split('\n').map(function (ln) {
            var e = esc(ln);
            if (/^\s*(โจทย์|วิธีทำ|ตอบ|ขั้นที่|ขั้นตอน|วิเคราะห์|สูตร)/.test(ln)) e = '<b>' + e + '</b>';
            return e;
          }).join('<br>');
          return '<div class="ex-card">' + (multi ? '<div class="ex-no">ตัวอย่างที่ ' + (i + 1) + '</div>' : '') + '<div class="ex-body">' + body + '</div></div>';
        }).join('');
      }

      /* ---------- โหลดข้อมูล ---------- */
      function load() {
        host.innerHTML = '<div class="panel" style="padding:40px;text-align:center;color:var(--muted)">กำลังโหลด...</div>';
        svc.api('lessonList').then(function (res) {
          st.lessons = (res && res.ok && res.data) ? res.data : (res.data || res || []);
          if (!Array.isArray(st.lessons)) st.lessons = [];
          st.loaded = true; renderList();
        }).catch(function (e) {
          host.innerHTML = '<div class="panel" style="padding:30px;text-align:center;color:var(--bad)">โหลดไม่ได้: ' + esc(String(e && e.message || e)) + '</div>';
        });
      }

      function filtered() {
        return st.lessons.filter(function (l) { return st.gradeId === 'all' || l.gradeId === st.gradeId; });
      }

      /* ---------- หน้ารายการ ---------- */
      function renderList() {
        var list = filtered(), PER = 10, pages = Math.max(1, Math.ceil(list.length / PER));
        if (st.page >= pages) st.page = pages - 1; if (st.page < 0) st.page = 0;
        var shown = list.slice(st.page * PER, st.page * PER + PER);

        var chips = '';
        if (!lockGrade) {
          chips = '<div id="lsGrades" style="display:flex;gap:8px;overflow:auto;padding-bottom:6px;margin:6px 0 14px">' +
            '<button class="chip click' + (st.gradeId === 'all' ? ' on' : '') + '" data-g="all" style="white-space:nowrap">ทั้งหมด</button>' +
            grades().map(function (g) { return '<button class="chip click' + (st.gradeId === g.id ? ' on' : '') + '" data-g="' + g.id + '" style="white-space:nowrap">' + esc(g.name) + '</button>'; }).join('') +
            '</div>';
        }

        var cards = shown.map(function (l, j) {
          var i = st.page * PER + j;
          return '<div class="qcard" style="display:flex;align-items:center;gap:14px;margin:0">' +
            '<span class="stamp" style="background:var(--accent2,#f59e0b)"><i class="ti ti-notebook"></i></span>' +
            '<div style="flex:1;min-width:0"><div class="font-display" style="font-weight:600">' + esc(l.title) +
              (canManage && !l.enabled ? ' <span style="color:var(--muted);font-size:.75rem">(ปิดอยู่)</span>' : '') + '</div>' +
            '<div style="color:var(--muted);font-size:.82rem">' + esc(gradeName(l.gradeId)) + (l.by ? ' · โดย ' + esc(l.by) : '') + '</div></div>' +
            '<button class="btn btn-ghost" data-view="' + i + '"><i class="ti ti-eye"></i> ดูวิธีทำ</button>' +
            (canManage ? '<button class="btn btn-ghost" data-edit="' + i + '"><i class="ti ti-edit"></i></button>' +
              '<button class="btn btn-ghost" data-toggle="' + i + '"><i class="ti ' + (l.enabled ? 'ti-eye-off' : 'ti-eye') + '"></i></button>' +
              '<button class="btn btn-ghost" data-del="' + i + '" style="color:var(--bad)"><i class="ti ti-trash"></i></button>' : '') +
            '</div>';
        }).join('');

        var empty = '<div style="text-align:center;padding:46px;color:var(--muted)"><i class="ti ti-notebook" style="font-size:42px"></i><div style="margin-top:8px">ยังไม่มีแบบฝึกหัดในส่วนนี้</div>' +
          (canManage ? '<div style="margin-top:6px;font-size:.85rem">กด “เพิ่มแบบฝึกหัด” เพื่อสร้างใหม่</div>' : '') + '</div>';

        var pager = pages > 1 ? '<div class="pager" style="display:flex">' +
          '<button class="pg-btn lsPrev"' + (st.page === 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
          '<span class="pg-info">หน้า ' + (st.page + 1) + ' / ' + pages + ' (รวม ' + list.length + ')</span>' +
          '<button class="pg-btn lsNext"' + (st.page === pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button></div>' : '';

        host.innerHTML =
          '<div class="panel" style="padding:20px">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap">' +
              '<div class="eyebrow">แบบฝึกหัด</div>' +
              (canManage ? '<button class="btn btn-accent" id="lsAdd" style="margin-left:auto"><i class="ti ti-plus"></i> เพิ่มแบบฝึกหัด</button>' : '<span style="margin-left:auto"></span>') +
              '<button class="btn btn-ghost" id="lsRefresh" style="padding:.4rem .7rem"><i class="ti ti-refresh"></i> รีเฟรช</button>' +
            '</div>' +
            '<h3 class="font-display" style="margin:0 0 4px;font-weight:600">แบบฝึกหัด — แสดงวิธีทำ</h3>' +
            '<p style="color:var(--muted);font-size:.88rem;margin:0 0 12px">ตัวอย่างการคิดวิเคราะห์และวิธีทำทีละขั้น เปิดดูและพิมพ์เป็นใบความรู้ได้</p>' +
            chips +
            '<div style="display:grid;gap:12px">' + (shown.length ? cards : empty) + '</div>' +
            pager +
          '</div>';

        if (canManage) $('#lsAdd', host).onclick = function () { openEdit(null); };
        $('#lsRefresh', host).onclick = function () { load(); };
        $$('#lsGrades .chip', host).forEach(function (b) { b.onclick = function () { st.gradeId = b.dataset.g; st.page = 0; renderList(); }; });
        var pv = $('.lsPrev', host), nx = $('.lsNext', host);
        if (pv) pv.onclick = function () { if (st.page > 0) { st.page--; renderList(); } };
        if (nx) nx.onclick = function () { st.page++; renderList(); };
        $$('[data-view]', host).forEach(function (b) { b.onclick = function () { view(list[+b.dataset.view]); }; });
        $$('[data-edit]', host).forEach(function (b) { b.onclick = function () { openEdit(list[+b.dataset.edit]); }; });
        $$('[data-toggle]', host).forEach(function (b) { b.onclick = function () { doToggle(list[+b.dataset.toggle]); }; });
        $$('[data-del]', host).forEach(function (b) { b.onclick = function () { doDelete(list[+b.dataset.del]); }; });
      }

      /* ---------- หน้าดูวิธีทำ ---------- */
      function view(l) {
        if (!l) return;
        host.innerHTML =
          '<div class="panel" style="padding:22px">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">' +
              '<button class="btn btn-ghost" id="lsBack"><i class="ti ti-arrow-left"></i> กลับ</button>' +
              '<button class="btn btn-ghost" id="lsPrint" style="margin-left:auto"><i class="ti ti-printer"></i> พิมพ์เป็นใบความรู้</button>' +
              (canManage ? '<button class="btn btn-ghost" id="lsEdit"><i class="ti ti-edit"></i> แก้ไข</button>' : '') +
            '</div>' +
            '<div class="eyebrow">' + esc(gradeName(l.gradeId)) + '</div>' +
            '<h2 class="font-display" style="margin:.2rem 0 14px;font-weight:800"><span class="grad-text">' + esc(l.title) + '</span></h2>' +
            '<div class="ex-list">' + renderContent(l.content) + '</div>' +
          '</div>';
        $('#lsBack', host).onclick = function () { renderList(); };
        $('#lsPrint', host).onclick = function () { printLesson(l); };
        if (canManage) $('#lsEdit', host).onclick = function () { openEdit(l); };
        if (svc.reveal) svc.reveal(host);
      }

      /* ---------- พิมพ์เป็นใบความรู้ ---------- */
      function printLesson(l) {
        var S = svc.settings || {};
        var head = '<div class="exam-head"><img src="' + (S.logo || '') + '">' +
          '<div style="flex:1"><h1>' + esc(S.org || 'แบบฝึกหัด') + '</h1><div class="sub">' + esc(S.dept || '') + '</div></div></div>' +
          '<div style="text-align:center;margin:14px 0 4px"><div class="font-display" style="font-size:18px;font-weight:700">' + esc(l.title) + '</div>' +
          '<div class="sub">ใบความรู้ · แสดงวิธีทำ · ' + esc(gradeName(l.gradeId)) + '</div></div>';
        var foot = '<div class="sheet-foot"><span>พัฒนาโดย นายชิติพัทธ์ นิลวรรณ ครู สพป.ศรีสะเกษ เขต 3</span></div>';
        var html = '<div class="sheet"><div class="exam-body">' + head +
          '<div class="ex-list print">' + renderContent(l.content) + '</div>' + foot + '</div></div>';
        svc.printNode(html);
      }

      /* ---------- เพิ่ม/แก้ไข ---------- */
      function openEdit(l) {
        var editing = !!l;
        var gOpts = grades().map(function (g) { return '<option value="' + g.id + '"' + ((l && l.gradeId === g.id) ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('');
        svc.swal.fire(Object.assign({
          title: editing ? 'แก้ไขแบบฝึกหัด' : 'เพิ่มแบบฝึกหัด',
          width: 680, focusConfirm: false, showCancelButton: true,
          confirmButtonText: editing ? 'บันทึก' : 'เพิ่ม', cancelButtonText: 'ยกเลิก',
          html: '<div style="text-align:left">' +
            '<label style="font-size:.85rem;color:#9aa8c8">ระดับชั้น</label>' +
            '<select id="ls_grade" style="' + INP + '">' + (gOpts || '<option value="">— ยังไม่มีชั้น —</option>') + '</select>' +
            '<label style="font-size:.85rem;color:#9aa8c8">หัวข้อ / เนื้อหา</label>' +
            '<input id="ls_title" placeholder="เช่น การบวกจำนวนสองหลักแบบมีทด" value="' + (l ? esc(l.title) : '') + '" style="' + INP + '">' +
            '<label style="font-size:.85rem;color:#9aa8c8">วิธีทำ / รายละเอียด</label>' +
            '<textarea id="ls_content" rows="11" placeholder="โจทย์: 24 + 18 = ?&#10;วิธีทำ:&#10;1) บวกหลักหน่วย 4 + 8 = 12 เขียน 2 ทด 1&#10;2) บวกหลักสิบ 2 + 1 + 1 = 4&#10;ตอบ 42&#10;&#10;===&#10;(พิมพ์ === ขึ้นบรรทัดใหม่ เพื่อขึ้นตัวอย่างถัดไป)" style="' + INP + ';resize:vertical;line-height:1.6">' + (l ? esc(l.content) : '') + '</textarea>' +
            '<label style="display:flex;align-items:center;gap:8px;font-size:.9rem;color:#cdd6ea;margin-top:.2rem"><input type="checkbox" id="ls_enabled"' + ((!l || l.enabled) ? ' checked' : '') + '> แสดงให้นักเรียนเห็น</label>' +
            '<div style="font-size:.78rem;color:#9aa8c8;margin-top:.4rem">เคล็ดลับ: บรรทัดที่ขึ้นต้นด้วย “โจทย์ / วิธีทำ / ตอบ / ขั้นที่” จะถูกเน้นตัวหนาอัตโนมัติ</div>' +
            '</div>',
          preConfirm: function () {
            var title = (document.getElementById('ls_title').value || '').trim();
            if (!title) { svc.swal.showValidationMessage('กรุณาใส่หัวข้อ'); return false; }
            return {
              id: l ? l.id : '',
              gradeId: document.getElementById('ls_grade').value || '',
              title: title,
              content: document.getElementById('ls_content').value || '',
              enabled: document.getElementById('ls_enabled').checked
            };
          }
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed || !r.value) return;
          svc.loading('กำลังบันทึก...');
          svc.api('lessonSave', r.value).then(function (res) {
            svc.done();
            if (res && res.ok === false) { svc.toast('error', res.error || 'บันทึกไม่สำเร็จ'); return; }
            svc.toast('success', editing ? 'บันทึกแล้ว' : 'เพิ่มแบบฝึกหัดแล้ว');
            load();
          }).catch(function (e) { svc.done(); svc.toast('error', 'ผิดพลาด: ' + String(e && e.message || e)); });
        });
      }

      function doToggle(l) {
        svc.api('lessonToggle', { id: l.id, enabled: !l.enabled }).then(function () {
          l.enabled = !l.enabled; renderList();
        }).catch(function (e) { svc.toast('error', String(e && e.message || e)); });
      }

      function doDelete(l) {
        svc.swal.fire(Object.assign({
          title: 'ลบแบบฝึกหัด?', html: 'ลบ “' + esc(l.title) + '” ถาวร',
          icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#ef4444'
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          svc.loading('กำลังลบ...');
          svc.api('lessonDelete', { id: l.id }).then(function () {
            svc.done(); svc.toast('success', 'ลบแล้ว');
            st.lessons = st.lessons.filter(function (x) { return x.id !== l.id; }); renderList();
          }).catch(function (e) { svc.done(); svc.toast('error', String(e && e.message || e)); });
        });
      }

      load();
    }
  });
})();
