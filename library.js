/*** EduForge plugin — คลังข้อสอบสาธารณะ (library) **********************
 * ทุกคนเปิดดู/พิมพ์ได้ (ไม่ต้องล็อกอิน) ครู/แอดมินลบรายการที่ตัวเองเผยแพร่ได้
 ***********************************************************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.Platform.register({
    id: 'library',
    mount: function (host, svc) {
      var store = svc.store;
      if (!store.public) { store.public = []; store.publicLoaded = false; }
      var canManage = svc.user.role !== 'public';

      function render(loading) {
        var list = store.public;
        host.innerHTML =
          '<div class="panel" style="padding:20px">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
              '<div class="eyebrow">คลังสาธารณะ</div>' +
              '<button class="btn btn-ghost" id="refresh" style="margin-left:auto;padding:.4rem .7rem"><i class="ti ti-refresh"></i> รีเฟรช</button>' +
            '</div>' +
            '<h3 class="font-display" style="margin:0 0 4px;font-weight:600">คลังข้อสอบสาธารณะ</h3>' +
            '<p style="color:var(--muted);font-size:.88rem;margin:0 0 16px">ชุดข้อสอบที่ครูเผยแพร่ไว้ ทุกคนเปิดดูและพิมพ์ได้ (พร้อมเฉลย)</p>' +
            (loading && list.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--muted)">กำลังโหลด...</div>' : '') +
            (!loading && list.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--muted)"><i class="ti ti-books" style="font-size:42px"></i><div style="margin-top:8px">ยังไม่มีชุดข้อสอบที่เผยแพร่</div></div>' : '') +
            '<div style="display:grid;gap:12px">' + list.map(function (s, i) {
              return '<div class="qcard" style="display:flex;align-items:center;gap:14px;margin:0">' +
                '<span class="stamp">' + s.setId + '</span>' +
                '<div style="flex:1"><div class="font-display" style="font-weight:600">' + s.title + '</div>' +
                '<div style="color:var(--muted);font-size:.82rem">' + s.subjectName + ' · ' + s.problems.length + ' ข้อ' + (s.publishedBy ? ' · โดย ' + s.publishedBy : '') + '</div></div>' +
                '<button class="btn btn-ghost" data-print="' + i + '"><i class="ti ti-printer"></i> พิมพ์</button>' +
                (canManage ? '<button class="btn btn-ghost" data-del="' + i + '" style="color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,transparent)"><i class="ti ti-trash"></i></button>' : '') +
                '</div>';
            }).join('') + '</div></div>';

        $('#refresh', host).onclick = function () { store.publicLoaded = false; load(); };
        $$('[data-print]', host).forEach(function (b) {
          b.onclick = function () {
            var s = store.public[+b.dataset.print];
            svc.printNode(svc.examSheetHTML({ title: s.title, subjectName: s.subjectName, level: s.level, setId: s.setId, problems: s.problems, cols: s.cols, withKey: true }));
          };
        });
        $$('[data-del]', host).forEach(function (b) {
          b.onclick = function () {
            var item = store.public[+b.dataset.del];
            store.public.splice(+b.dataset.del, 1); render(false); svc.toast('success', 'นำออกจากคลังสาธารณะแล้ว');
            svc.api('unpublishExam', { id: item.id }).catch(function (e) {
              store.public.unshift(item); render(false); svc.toast('error', 'ลบไม่สำเร็จ: ' + String(e.message || e));
            });
          };
        });
      }

      function load() {
        if (store.publicLoaded) { render(false); return; }
        render(true);
        svc.api('listPublicExams').then(function (list) {
          store.public = list; store.publicLoaded = true; render(false);
        }).catch(function (e) {
          host.innerHTML = '<div class="panel" style="padding:30px;text-align:center;color:var(--bad)">โหลดไม่ได้: ' + String(e.message || e) + '</div>';
        });
      }
      load();
    }
  });
})();
