/*** EduForge plugin — ออกข้อสอบกระดาษ (worksheet) ************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.Platform.register({
    id: 'worksheet',
    mount: function (host, svc) {
      var CUR = svc.curriculum;
      var st = {
        gradeId: CUR.grades[0] && CUR.grades[0].id,
        chapterId: CUR.grades[0] && CUR.grades[0].chapters[0].id,
        level: 'easy', count: 12, cols: 2, title: '', current: null, showKey: false, busy: false
      };
      function gradeOf(id) { return CUR.grades.filter(function (g) { return g.id === id; })[0]; }
      function chapterOf(gid, cid) { return gradeOf(gid).chapters.filter(function (c) { return c.id === cid; })[0]; }

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
            '</div>' +
            '<div class="panel" style="padding:18px">' +
              '<div class="eyebrow" style="margin-bottom:12px">ตั้งค่าใบงาน</div>' +
              '<label class="lbl">ระดับความยาก</label>' +
              '<div class="seg" id="lv" style="margin:5px 0 14px"><button data-l="easy" class="on">ง่าย</button><button data-l="medium">ปานกลาง</button><button data-l="hard">ยาก</button></div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">' +
                '<div><label class="lbl">จำนวนข้อ</label><input id="cnt" type="number" min="4" max="40" value="12" class="field mono" style="margin-top:5px"></div>' +
                '<div><label class="lbl">คอลัมน์</label><div class="seg" id="col" style="margin-top:5px"><button data-c="1">1</button><button data-c="2" class="on">2</button></div></div>' +
              '</div>' +
              '<label class="lbl">ชื่อใบงาน</label>' +
              '<input id="ttl" class="field" style="margin:5px 0 14px">' +
              '<button class="btn btn-accent" style="width:100%;justify-content:center" id="gen"><i class="ti ti-sparkles"></i> สร้างใบงาน</button>' +
            '</div>' +
          '</section>' +
          '<section style="display:flex;flex-direction:column;gap:14px">' +
            '<div class="panel no-print" style="padding:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
              '<div style="display:flex;flex-direction:column;gap:3px"><span class="mono" id="crumb" style="font-size:.72rem;color:var(--muted)">—</span>' +
                '<div style="display:flex;align-items:center;gap:8px"><span class="eyebrow">ชุดที่</span><span class="stamp" id="stamp">— — —</span></div></div>' +
              '<div style="margin-left:auto;display:flex;flex-wrap:wrap;gap:8px">' +
                '<button class="btn btn-ghost" id="redo"><i class="ti ti-dice-3"></i> สุ่มใหม่</button>' +
                '<button class="btn btn-ghost" id="save"><i class="ti ti-bookmark"></i> บันทึกเข้าคลัง</button>' +
                '<button class="btn btn-ghost" id="publish"><i class="ti ti-upload"></i> เผยแพร่สาธารณะ</button>' +
                '<button class="btn btn-ghost" id="key"><i class="ti ti-eye"></i> แสดงเฉลย</button>' +
                '<button class="btn btn-accent" id="print"><i class="ti ti-printer"></i> พิมพ์/PDF</button>' +
              '</div></div>' +
            '<div class="stage" id="stage"></div>' +
          '</section>' +
        '</div>';

      function drawGrades() {
        var g = $('#grades', host); g.innerHTML = '';
        CUR.grades.forEach(function (gr) {
          var b = document.createElement('button'); b.className = 'chip click'; b.style.whiteSpace = 'nowrap';
          if (gr.id === st.gradeId) { b.style.background = 'var(--accent)'; b.style.color = '#fff'; b.style.borderColor = 'transparent'; }
          b.textContent = gr.name;
          b.onclick = function () { st.gradeId = gr.id; st.chapterId = gr.chapters[0].id; drawGrades(); drawChapters(); setTitle(); build(true); };
          g.appendChild(b);
        });
      }
      function drawChapters() {
        var c = $('#chapters', host); c.innerHTML = '';
        gradeOf(st.gradeId).chapters.forEach(function (ch) {
          var el = document.createElement('button'); el.className = 'tile' + (ch.id === st.chapterId ? ' on' : '');
          el.innerHTML = '<div class="ic"><i class="ti ' + ch.icon + '"></i></div><div class="font-display" style="font-weight:600;margin-top:8px;font-size:.92rem;line-height:1.2">' + ch.name + '</div>';
          el.onclick = function () { st.chapterId = ch.id; drawChapters(); setTitle(); build(true); };
          c.appendChild(el);
        });
      }
      function setTitle() {
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        st.title = 'แบบฝึกหัด' + ch.name + ' ' + g.name; $('#ttl', host).value = st.title;
      }

      $$('#lv button', host).forEach(function (b) { b.onclick = function () { $$('#lv button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.level = b.dataset.l; build(true); }; });
      $$('#col button', host).forEach(function (b) { b.onclick = function () { $$('#col button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.cols = +b.dataset.c; if (st.current) render(); }; });
      $('#cnt', host).oninput = function (e) { st.count = Math.max(4, Math.min(40, +e.target.value || 12)); };
      $('#ttl', host).oninput = function (e) { st.title = e.target.value; };

      function build(announce) {
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        var res = svc.genProblems(ch, st.level, st.count);
        st.current = { setId: res.setId, subjectName: g.name + ' · ' + ch.name, problems: res.problems, level: st.level, cols: st.cols, title: st.title };
        st.showKey = false; keyBtn(); render();
        if (announce) svc.toast('success', 'สร้างชุด ' + res.setId);
      }
      function render() {
        var c = st.current; if (!c) return;
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        $('#stamp', host).textContent = c.setId;
        $('#crumb', host).textContent = CUR.subject + ' › ' + g.name + ' › ' + ch.name;
        $('#stage', host).innerHTML = svc.examSheetHTML({ title: c.title, subjectName: c.subjectName, level: c.level, setId: c.setId, problems: c.problems, cols: st.cols, withKey: st.showKey });
      }
      function keyBtn() { $('#key', host).innerHTML = st.showKey ? '<i class="ti ti-eye-off"></i> ซ่อนเฉลย' : '<i class="ti ti-eye"></i> แสดงเฉลย'; }

      $('#gen', host).onclick = function () { build(true); };
      $('#redo', host).onclick = function () { build(true); };
      $('#key', host).onclick = function () { if (!st.current) return; st.showKey = !st.showKey; keyBtn(); render(); };
      $('#save', host).onclick = function () {
        if (!st.current) { svc.toast('warning', 'ยังไม่มีชุด'); return; }
        var c = st.current;
        var item = { id: 'tmp-' + c.setId, title: c.title, subjectName: c.subjectName, level: c.level, cols: c.cols, setId: c.setId, problems: c.problems, _syncing: true };
        svc.store.saved.unshift(item);            // โผล่ในคลังทันที
        svc.toast('success', 'บันทึกชุด ' + c.setId + ' เข้าคลังแล้ว');
        svc.api('saveExam', { title: c.title, gradeId: st.gradeId, chapterId: st.chapterId, subjectName: c.subjectName, level: c.level, cols: c.cols, setId: c.setId, problems: c.problems })
          .then(function (res) { item.id = res.id; item._syncing = false; })
          .catch(function (e) {
            var i = svc.store.saved.indexOf(item); if (i >= 0) svc.store.saved.splice(i, 1);
            svc.toast('error', 'บันทึกไม่สำเร็จ: ' + String(e.message || e));
          });
      };
      $('#print', host).onclick = function () {
        if (!st.current) { svc.toast('warning', 'ยังไม่มีชุด'); return; }
        svc.swal.fire(Object.assign({ title: 'พิมพ์ใบงาน', icon: 'question', showCancelButton: true, confirmButtonText: 'พิมพ์พร้อมเฉลย', cancelButtonText: 'เฉพาะใบงาน', confirmButtonColor: '#6366f1', cancelButtonColor: '#334155' }, svc.swalDark))
          .then(function (r) {
            var c = st.current;
            svc.printNode(svc.examSheetHTML({ title: c.title, subjectName: c.subjectName, level: c.level, setId: c.setId, problems: c.problems, cols: c.cols, withKey: r.isConfirmed }));
          });
      };

      $('#publish', host).onclick = function () {
        if (!st.current) { svc.toast('warning', 'ยังไม่มีชุด'); return; }
        var c = st.current;
        svc.swal.fire(Object.assign({ icon: 'question', title: 'เผยแพร่สู่คลังสาธารณะ?', text: 'ทุกคนจะเปิดดู/พิมพ์ชุด ' + c.setId + ' ได้โดยไม่ต้องล็อกอิน', showCancelButton: true, confirmButtonText: 'เผยแพร่', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1' }, svc.swalDark))
          .then(function (r) {
            if (!r.isConfirmed) return;
            if (svc.store) svc.store.publicLoaded = false;   // ให้คลังสาธารณะดึงใหม่
            svc.loading('กำลังเผยแพร่...');
            svc.api('publishExam', { title: c.title, subjectName: c.subjectName, level: c.level, cols: c.cols, setId: c.setId, problems: c.problems })
              .then(function () { svc.done(); svc.toast('success', 'เผยแพร่ชุด ' + c.setId + ' แล้ว'); })
              .catch(function (e) { svc.done(); svc.toast('error', String(e.message || e)); });
          });
      };

      drawGrades(); drawChapters(); setTitle(); build(true);
      if (svc.user.role === 'public') {
        ['#save', '#publish'].forEach(function (sel) { var b = $(sel, host); if (b) b.style.display = 'none'; });
      }
    }
  });
})();
