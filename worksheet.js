/*** EduForge plugin — ออกข้อสอบกระดาษ (worksheet) ************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.Platform.register({
    id: 'worksheet',
    mount: function (host, svc) {
      var CUR = svc.curriculum;
      var lockGrade = (svc.ctx && svc.ctx.gradeId) || null;
      var firstG = lockGrade ? (CUR.grades.filter(function (g) { return g.id === lockGrade; })[0] || CUR.grades[0]) : CUR.grades[0];
      var st = {
        gradeId: firstG && firstG.id,
        chapterId: firstG && firstG.chapters[0] && firstG.chapters[0].id,
        level: 'easy', count: 12, cols: 2, title: '', current: null, showKey: false, busy: false, chPage: 0,
        term: '1', year: String(new Date().getFullYear() + 543), fontSize: 'normal', copies: 1, qr: false
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
              '<div id="chPager" class="pager" style="display:none"></div>' +
            '</div>' +
            '<div class="panel" style="padding:18px">' +
              '<div class="eyebrow" style="margin-bottom:12px">ตั้งค่าใบงาน</div>' +
              '<label class="lbl">ระดับความยาก</label>' +
              '<div class="seg" id="lv" style="margin:5px 0 14px"><button data-l="easy" class="on">ง่าย</button><button data-l="medium">ปานกลาง</button><button data-l="hard">ยาก</button></div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">' +
                '<div><label class="lbl">จำนวนข้อ</label><input id="cnt" type="number" min="4" max="50" value="12" class="field mono" style="margin-top:5px"></div>' +
                '<div><label class="lbl">คอลัมน์</label><div class="seg" id="col" style="margin-top:5px"><button data-c="1">1</button><button data-c="2" class="on">2</button></div></div>' +
              '</div>' +
              '<label class="lbl">หัวกระดาษ</label>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:5px 0 12px">' +
                '<div><span class="lbl" style="font-size:.72rem">ภาคเรียน</span><div class="seg" id="term" style="margin-top:4px"><button data-t="1" class="on">1</button><button data-t="2">2</button></div></div>' +
                '<div><span class="lbl" style="font-size:.72rem">ปีการศึกษา</span><input id="year" class="field mono" style="margin-top:4px" value="' + (new Date().getFullYear() + 543) + '"></div>' +
              '</div>' +
              '<label class="lbl">ขนาดฟอนต์</label>' +
              '<div class="seg" id="fsz" style="margin:5px 0 12px"><button data-f="normal" class="on">ปกติ</button><button data-f="lg">ใหญ่</button><button data-f="xl">ใหญ่พิเศษ</button></div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;align-items:end">' +
                '<div><label class="lbl">จำนวนชุดพิมพ์</label><input id="copies" type="number" min="1" max="10" value="1" class="field mono" style="margin-top:5px"></div>' +
                '<label style="display:flex;align-items:center;gap:8px;font-size:.85rem;padding-bottom:9px;cursor:pointer"><input type="checkbox" id="qron"> QR เฉลย</label>' +
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
        var list = lockGrade ? CUR.grades.filter(function (gr) { return gr.id === lockGrade; }) : CUR.grades;
        list.forEach(function (gr) {
          var b = document.createElement('button'); b.className = 'chip click'; b.style.whiteSpace = 'nowrap';
          if (gr.id === st.gradeId) { b.style.background = 'var(--accent)'; b.style.color = '#fff'; b.style.borderColor = 'transparent'; }
          b.textContent = gr.name;
          if (lockGrade) { b.style.cursor = 'default'; b.onclick = null; }
          else b.onclick = function () { st.gradeId = gr.id; st.chapterId = gr.chapters[0].id; drawGrades(); drawChapters(); setTitle(); build(true); };
          g.appendChild(b);
        });
      }
      function drawChapters() {
        var c = $('#chapters', host); c.innerHTML = '';
        var all = gradeOf(st.gradeId).chapters, PER = 6, pages = Math.max(1, Math.ceil(all.length / PER));
        if (st.chPage >= pages) st.chPage = pages - 1;
        // ให้หน้าแสดงบทที่ถูกเลือกอยู่
        var selIdx = all.map(function (x) { return x.id; }).indexOf(st.chapterId);
        if (selIdx >= 0) st.chPage = Math.floor(selIdx / PER);
        var shown = all.slice(st.chPage * PER, st.chPage * PER + PER);
        shown.forEach(function (ch) {
          var el = document.createElement('button'); el.className = 'tile' + (ch.id === st.chapterId ? ' on' : '');
          var ico = /^https?:\/\//.test(String(ch.icon || '')) ? '<img src="' + ch.icon + '" style="width:24px;height:24px;object-fit:contain">' : '<i class="ti ' + (ch.icon || 'ti-file') + '"></i>';
          el.innerHTML = '<div class="ic">' + ico + '</div><div class="font-display" style="font-weight:600;margin-top:8px;font-size:.92rem;line-height:1.2">' + ch.name + '</div>';
          el.onclick = function () { st.chapterId = ch.id; drawChapters(); setTitle(); build(true); };
          c.appendChild(el);
        });
        var pg = $('#chPager', host);
        if (pages > 1) {
          pg.style.display = 'flex';
          pg.innerHTML = '<button class="pg-btn" data-d="-1"' + (st.chPage === 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
            '<span class="pg-info">หน้า ' + (st.chPage + 1) + ' / ' + pages + '</span>' +
            '<button class="pg-btn" data-d="1"' + (st.chPage === pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button>';
          $$('.pg-btn', pg).forEach(function (b) {
            b.onclick = function () { if (b.disabled) return; st.chPage += (+b.dataset.d); st.chPage = Math.max(0, Math.min(pages - 1, st.chPage)); drawChapterPage(); };
          });
        } else { pg.style.display = 'none'; pg.innerHTML = ''; }
      }
      // เปลี่ยนหน้าโดยไม่ย้ายบทที่เลือก (ไม่ให้ selIdx ดึงกลับ)
      function drawChapterPage() {
        var c = $('#chapters', host); c.innerHTML = '';
        var all = gradeOf(st.gradeId).chapters, PER = 6, pages = Math.max(1, Math.ceil(all.length / PER));
        var shown = all.slice(st.chPage * PER, st.chPage * PER + PER);
        shown.forEach(function (ch) {
          var el = document.createElement('button'); el.className = 'tile' + (ch.id === st.chapterId ? ' on' : '');
          var ico = /^https?:\/\//.test(String(ch.icon || '')) ? '<img src="' + ch.icon + '" style="width:24px;height:24px;object-fit:contain">' : '<i class="ti ' + (ch.icon || 'ti-file') + '"></i>';
          el.innerHTML = '<div class="ic">' + ico + '</div><div class="font-display" style="font-weight:600;margin-top:8px;font-size:.92rem;line-height:1.2">' + ch.name + '</div>';
          el.onclick = function () { st.chapterId = ch.id; drawChapters(); setTitle(); build(true); };
          c.appendChild(el);
        });
        var pg = $('#chPager', host);
        pg.innerHTML = '<button class="pg-btn" data-d="-1"' + (st.chPage === 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
          '<span class="pg-info">หน้า ' + (st.chPage + 1) + ' / ' + pages + '</span>' +
          '<button class="pg-btn" data-d="1"' + (st.chPage === pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button>';
        $$('.pg-btn', pg).forEach(function (b) {
          b.onclick = function () { if (b.disabled) return; st.chPage += (+b.dataset.d); st.chPage = Math.max(0, Math.min(pages - 1, st.chPage)); drawChapterPage(); };
        });
      }
      function setTitle() {
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        st.title = 'แบบฝึกหัด' + ch.name + ' ' + g.name; $('#ttl', host).value = st.title;
      }

      $$('#lv button', host).forEach(function (b) { b.onclick = function () { $$('#lv button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.level = b.dataset.l; build(true); }; });
      $$('#col button', host).forEach(function (b) { b.onclick = function () { $$('#col button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.cols = +b.dataset.c; if (st.current) render(); }; });
      $('#cnt', host).oninput = function (e) { st.count = Math.max(4, Math.min(50, +e.target.value || 12)); };
      $('#ttl', host).oninput = function (e) { st.title = e.target.value; };
      $$('#term button', host).forEach(function (b) { b.onclick = function () { $$('#term button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.term = b.dataset.t; if (st.current) render(); }; });
      $('#year', host).oninput = function (e) { st.year = e.target.value.trim(); if (st.current) render(); };
      $$('#fsz button', host).forEach(function (b) { b.onclick = function () { $$('#fsz button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.fontSize = b.dataset.f; if (st.current) render(); }; });
      $('#copies', host).oninput = function (e) { st.copies = Math.max(1, Math.min(10, +e.target.value || 1)); };
      $('#qron', host).onchange = function (e) { st.qr = e.target.checked; if (st.current) render(); };

      var DEF_INSTR = {
        compare: 'เติมเครื่องหมาย > , < หรือ = ลงในช่องว่าง',
        count: 'นับจำนวนรูปภาพในแต่ละข้อ แล้ววงกลมตัวเลขที่ถูกต้อง',
        count9: 'นับจำนวนรูปภาพในแต่ละข้อ แล้ววงหรือเขียนจำนวนที่ถูกต้อง',
        numwrite: 'นับจำนวนแท่งฐานสิบ แล้วเขียนตัวเลขฮินดูอารบิก ตัวเลขไทย และตัวหนังสือ ลงในตาราง',
        order: 'เรียงจำนวนที่กำหนดให้ ตามทิศที่ระบุในแต่ละข้อ แล้วเขียนลงในช่องว่าง',
        time: 'ดูเข็มนาฬิกาในแต่ละข้อ แล้วเขียนเวลาลงในช่องว่าง',
        geometry: 'ระบายสีรูปตามข้อกำหนด แล้วนับจำนวนรูปแต่ละชนิด เขียนลงในช่องว่าง',
        measlen: 'จงวัดความยาวของสิ่งของแต่ละชิ้นโดยใช้ไม้บรรทัด แล้วบอกความยาวเป็นเซนติเมตร',
        mixed: 'เติมคำตอบลงในช่องว่างให้ถูกต้อง (คิดในวงเล็บก่อน)',
        expand: 'เติมตัวเลขแสดงค่าประจำหลักและเขียนจำนวนในรูปกระจายลงในช่องว่าง'
      };
      function makeSet() {
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        var res = svc.genProblems(ch, st.level, st.count);
        var instrText = (ch.lv && ch.lv.instruction) || DEF_INSTR[ch.gen] || '';
        return { setId: res.setId, subjectName: g.name + ' · ' + ch.name, problems: res.problems, level: st.level, cols: st.cols, title: st.title, instr: instrText, picture: ch.gen === 'picture' };
      }
      function sheetOpts(c, withKey, qr) {
        return { title: c.title, subjectName: c.subjectName, level: c.level, setId: c.setId, problems: c.problems, cols: (c.picture ? 1 : st.cols), withKey: withKey, instr: c.instr, term: st.term, year: st.year, fontSize: st.fontSize, qr: qr || '' };
      }
      function build(announce) {
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        st.current = makeSet();
        st.showKey = false; keyBtn(); render();
        if (announce) svc.toast('success', 'สร้างชุด ' + st.current.setId);
      }
      function render() {
        var c = st.current; if (!c) return;
        var g = gradeOf(st.gradeId), ch = chapterOf(st.gradeId, st.chapterId);
        $('#stamp', host).textContent = c.setId;
        $('#crumb', host).textContent = CUR.subject + ' › ' + g.name + ' › ' + ch.name;
        var stage = $('#stage', host);
        var draw = function (qr) { stage.innerHTML = svc.examSheetHTML(sheetOpts(c, st.showKey, qr)); };
        if (st.qr) {
          if (!window.QRCode) { svc.toast('warning', 'โหลดตัวสร้าง QR ไม่ได้ — กรุณาอัปไฟล์ index.html ใหม่ หรือเช็คอินเทอร์เน็ต'); draw(''); return; }
          svc.makeQR(svc.keyURL(c.title, c.setId, c.problems.map(function (p) { return p.a; }))).then(draw);
        } else { draw(''); }
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
      function doPrint(withKey) {
        var copies = Math.max(1, Math.min(10, st.copies || 1));
        var sets = [st.current];
        for (var i = 1; i < copies; i++) sets.push(makeSet());   // ชุดถัดไปสุ่มใหม่
        var jobs = sets.map(function (s) { return st.qr ? svc.makeQR(svc.keyURL(s.title, s.setId, s.problems.map(function (p) { return p.a; }))) : Promise.resolve(''); });
        svc.loading('กำลังเตรียมพิมพ์...');
        Promise.all(jobs).then(function (qrs) {
          svc.done();
          var html = sets.map(function (s, idx) {
            var sheet = svc.examSheetHTML(sheetOpts(s, withKey, qrs[idx]));
            return idx === 0 ? sheet : '<div style="page-break-before:always">' + sheet + '</div>';
          }).join('');
          svc.printNode(html);
        }).catch(function () { svc.done(); svc.printNode(svc.examSheetHTML(sheetOpts(st.current, withKey, ''))); });
      }
      $('#print', host).onclick = function () {
        if (!st.current) { svc.toast('warning', 'ยังไม่มีชุด'); return; }
        svc.swal.fire(Object.assign({ title: 'พิมพ์ใบงาน', icon: 'question', showCancelButton: true, confirmButtonText: 'พิมพ์พร้อมเฉลย', cancelButtonText: 'เฉพาะใบงาน', confirmButtonColor: '#6366f1', cancelButtonColor: '#334155' }, svc.swalDark))
          .then(function (r) {
            if (!r.isConfirmed && r.dismiss !== 'cancel') return; // ปิดด้วย ESC/คลิกพื้นหลัง = ไม่พิมพ์
            doPrint(r.isConfirmed);
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
