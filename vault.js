/*** EduForge plugin — คลังข้อสอบ (vault) *******************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.Platform.register({
    id: 'vault',
    mount: function (host, svc) {
      function render(list) {
        host.innerHTML =
          '<div class="panel" style="padding:20px">' +
            '<div class="eyebrow" style="margin-bottom:4px">คลังข้อสอบ</div>' +
            '<h3 class="font-display" style="margin:0 0 4px;font-weight:600">ชุดข้อสอบที่บันทึกไว้</h3>' +
            '<p style="color:var(--muted);font-size:.88rem;margin:0 0 16px">ชุดที่กด “บันทึกเข้าคลัง” จากระบบออกข้อสอบกระดาษจะมาอยู่ที่นี่ นำกลับมาพิมพ์ซ้ำได้</p>' +
            (list.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--muted)"><i class="ti ti-inbox" style="font-size:42px"></i><div style="margin-top:8px">ยังไม่มีชุดที่บันทึก</div></div>' : '') +
            '<div style="display:grid;gap:12px">' + list.map(function (s, i) {
              return '<div class="qcard" style="display:flex;align-items:center;gap:14px;margin:0">' +
                '<span class="stamp">' + s.setId + '</span>' +
                '<div style="flex:1"><div class="font-display" style="font-weight:600">' + s.title + '</div>' +
                '<div style="color:var(--muted);font-size:.82rem">' + s.subjectName + ' · ' + s.problems.length + ' ข้อ</div></div>' +
                '<button class="btn btn-ghost" data-print="' + i + '"><i class="ti ti-printer"></i> พิมพ์</button>' +
                '<button class="btn btn-ghost" data-del="' + s.id + '" style="color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,transparent)"><i class="ti ti-trash"></i></button></div>';
            }).join('') + '</div></div>';

        $$('[data-print]', host).forEach(function (b) {
          b.onclick = function () {
            var s = list[+b.dataset.print];
            svc.printNode(svc.examSheetHTML({ title: s.title, subjectName: s.subjectName, level: s.level, setId: s.setId, problems: s.problems, cols: s.cols, withKey: true }));
          };
        });
        $$('[data-del]', host).forEach(function (b) {
          b.onclick = function () {
            svc.api('deleteExam', { id: b.dataset.del }).then(function () { svc.toast('success', 'ลบแล้ว'); load(); })
              .catch(function (e) { svc.toast('error', String(e.message || e)); });
          };
        });
      }
      function load() {
        host.innerHTML = '<div class="panel" style="padding:40px;text-align:center;color:var(--muted)">กำลังโหลด...</div>';
        svc.api('listExams').then(render).catch(function (e) {
          host.innerHTML = '<div class="panel" style="padding:30px;text-align:center;color:var(--bad)">โหลดไม่ได้: ' + String(e.message || e) + '</div>';
        });
      }
      load();
    }
  });
})();
