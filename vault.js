/*** EduForge plugin — คลังข้อสอบ (vault) — แคชในหน่วยความจำ + optimistic ***/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.Platform.register({
    id: 'vault',
    mount: function (host, svc) {
      var store = svc.store;
      var vpPage = 0;

      function render(loading) {
        var list = store.saved;
        host.innerHTML =
          '<div class="panel" style="padding:20px">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
              '<div class="eyebrow">คลังข้อสอบ</div>' +
              '<button class="btn btn-ghost" id="refresh" style="margin-left:auto;padding:.4rem .7rem"><i class="ti ti-refresh"></i> รีเฟรช</button>' +
            '</div>' +
            '<h3 class="font-display" style="margin:0 0 4px;font-weight:600">ชุดข้อสอบที่บันทึกไว้</h3>' +
            '<p style="color:var(--muted);font-size:.88rem;margin:0 0 16px">ชุดที่กด “บันทึกเข้าคลัง” จะมาอยู่ที่นี่ นำกลับมาพิมพ์ซ้ำได้</p>' +
            (loading && list.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--muted)">กำลังโหลด...</div>' : '') +
            (!loading && list.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--muted)"><i class="ti ti-inbox" style="font-size:42px"></i><div style="margin-top:8px">ยังไม่มีชุดที่บันทึก</div></div>' : '') +
            '<div style="display:grid;gap:12px">' + (function () {
              var PER = 10, pages = Math.max(1, Math.ceil(list.length / PER));
              if (vpPage >= pages) vpPage = pages - 1; if (vpPage < 0) vpPage = 0;
              var startIdx = vpPage * PER;
              return list.slice(startIdx, startIdx + PER).map(function (s, j) {
                var i = startIdx + j;
                return '<div class="qcard" style="display:flex;align-items:center;gap:14px;margin:0">' +
                  '<span class="stamp">' + s.setId + '</span>' +
                  '<div style="flex:1"><div class="font-display" style="font-weight:600">' + s.title + (s._syncing ? ' <span class="mono" style="font-size:.66rem;color:var(--muted)">· กำลังซิงค์</span>' : '') + '</div>' +
                  '<div style="color:var(--muted);font-size:.82rem">' + s.subjectName + ' · ' + s.problems.length + ' ข้อ</div></div>' +
                  '<button class="btn btn-ghost" data-print="' + i + '"><i class="ti ti-printer"></i> พิมพ์</button>' +
                  '<button class="btn btn-ghost" data-del="' + i + '" style="color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,transparent)"><i class="ti ti-trash"></i></button></div>';
              }).join('');
            })() + '</div>' +
            (function () {
              var PER = 10, pages = Math.max(1, Math.ceil(list.length / PER));
              return pages > 1 ? '<div class="pager" style="display:flex">' +
                '<button class="pg-btn vpPrev"' + (vpPage === 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
                '<span class="pg-info">หน้า ' + (vpPage + 1) + ' / ' + pages + ' (รวม ' + list.length + ' ชุด)</span>' +
                '<button class="pg-btn vpNext"' + (vpPage === pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button></div>' : '';
            })() + '</div>';

        var vpv = $('.vpPrev', host), vnx = $('.vpNext', host);
        if (vpv) vpv.onclick = function () { if (vpPage > 0) { vpPage--; render(false); } };
        if (vnx) vnx.onclick = function () { vpPage++; render(false); };

        $('#refresh', host).onclick = function () { store.savedLoaded = false; load(); };
        $$('[data-print]', host).forEach(function (b) {
          b.onclick = function () {
            var s = store.saved[+b.dataset.print];
            svc.printNode(svc.examSheetHTML({ title: s.title, subjectName: s.subjectName, level: s.level, setId: s.setId, problems: s.problems, cols: s.cols, withKey: true }));
          };
        });
        $$('[data-del]', host).forEach(function (b) {
          b.onclick = function () {
            var item = store.saved[+b.dataset.del];
            store.saved.splice(+b.dataset.del, 1);
            render(false);
            svc.toast('success', 'ลบแล้ว');
            if (item && item.id && String(item.id).indexOf('tmp-') !== 0) {
              svc.api('deleteExam', { id: item.id }).catch(function (e) {
                store.saved.unshift(item); render(false);
                svc.toast('error', 'ลบไม่สำเร็จ: ' + String(e.message || e));
              });
            }
          };
        });
      }

      function load() {
        if (store.savedLoaded) { render(false); return; }
        render(true); svc.loading('กำลังโหลดคลังข้อสอบ...');
        svc.api('listExams').then(function (list) {
          store.saved = list; store.savedLoaded = true; svc.done(); render(false);
        }).catch(function (e) {
          svc.done();
          host.innerHTML = '<div class="panel" style="padding:30px;text-align:center;color:var(--bad)">โหลดไม่ได้: ' + String(e.message || e) + '</div>';
        });
      }
      load();
    }
  });
})();
