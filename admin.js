/*** EduForge plugin — จัดการระบบ (admin) — ดึงทุกปลั๊กอิน + แก้ไข/ลบ/กู้คืน ***/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  var INP = 'width:100%;margin:.25rem 0 .6rem;padding:.55rem .7rem;border-radius:8px;background:#0b1120;color:#e6ebf7;border:1px solid #2a3556;font-family:Sarabun,sans-serif';

  window.Platform.register({
    id: 'admin',
    mount: function (host, svc, P) {
      host.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px" class="grid-main">' +
          '<div class="panel" style="padding:18px"><div class="eyebrow">ระบบที่แสดงอยู่</div><div class="font-display" id="shownCount" data-count="0" style="font-size:2.2rem;font-weight:700">0</div></div>' +
          '<div class="panel" style="padding:18px"><div class="eyebrow">ผู้ใช้ปัจจุบัน</div><div class="font-display" style="font-size:1.5rem;font-weight:700;color:var(--accent2);margin-top:8px">' + (P.user.name || '-') + '</div></div>' +
          '<div class="panel" style="padding:18px"><div class="eyebrow">ชุดในคลัง (ทั้งระบบ)</div><div class="font-display mono" id="savedCount" data-count="0" style="font-size:2.2rem;font-weight:700">0</div></div>' +
        '</div>' +
        '<div class="panel" style="padding:20px">' +
          '<div style="display:flex;align-items:center;margin-bottom:14px"><div><div class="eyebrow">ระบบย่อย (Plugins)</div>' +
          '<p style="color:var(--muted);font-size:.86rem;margin:2px 0 0">เปิด/ปิด · แก้ไขชื่อ-ไอคอน-ลำดับ · ลบ (กู้คืนได้)</p></div>' +
          '<button class="btn btn-ghost" id="reload" style="margin-left:auto;margin-right:8px;padding:.5rem .8rem"><i class="ti ti-refresh"></i></button>' +
          '<button class="btn btn-accent" id="addsys"><i class="ti ti-plus"></i> ติดตั้งระบบใหม่</button></div>' +
          '<div style="overflow:auto"><table class="adm"><thead><tr><th>ระบบ</th><th>ไฟล์</th><th style="text-align:center">สถานะ</th><th style="text-align:center">จัดการ</th></tr></thead><tbody id="tb"></tbody></table></div>' +
        '</div>' +
        '<div class="panel" style="padding:20px;margin-top:16px">' +
          '<div class="eyebrow" style="margin-bottom:12px">หัวกระดาษ (ใช้ทุกระบบ)</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="grid-main">' +
            '<div><label class="lbl">ชื่อหน่วยงาน</label><input class="field" id="org" style="margin-top:5px" value="' + esc(P.settings.org || '') + '"></div>' +
            '<div><label class="lbl">สังกัด</label><input class="field" id="dept" style="margin-top:5px" value="' + esc(P.settings.dept || '') + '"></div>' +
          '</div><button class="btn btn-accent" id="savecfg" style="margin-top:14px"><i class="ti ti-device-floppy"></i> บันทึก</button>' +
        '</div>';

      function syncMeta(all) {
        P.meta = all.filter(function (m) { return m.enabled && !m.deleted && (!m.adminOnly || P.user.role === 'admin'); })
          .sort(function (a, b) { return a.order - b.order; })
          .map(function (m) { return { id: m.id, title: m.title, icon: m.icon, file: m.file, adminOnly: m.adminOnly, order: m.order }; });
        P.renderNav();
      }

      function renderRows(all) {
        var tb = $('#tb', host); tb.innerHTML = '';
        all.forEach(function (m) {
          var tr = document.createElement('tr');
          if (m.deleted) tr.style.opacity = '.5';
          tr.innerHTML =
            '<td><div class="flex items-center gap2"><span class="ni-ic" style="width:30px;height:30px"><i class="ti ' + m.icon + '"></i></span><b class="font-display">' + esc(m.title) + '</b>' +
              (m.adminOnly ? ' <span class="chip" style="font-size:.62rem">admin</span>' : '') +
              (m.deleted ? ' <span style="color:var(--bad);font-size:.7rem">(ลบแล้ว)</span>' : '') + '</div></td>' +
            '<td class="mono" style="color:var(--muted)">plugins/' + m.id + '.js</td>' +
            '<td style="text-align:center">' + (m.deleted ? '<span style="color:var(--muted)">—</span>' : '<div class="switch' + (m.enabled ? ' on' : '') + '" style="margin:0 auto"><i></i></div>') + '</td>' +
            '<td style="text-align:center;white-space:nowrap">' +
              '<button class="btn btn-ghost edit-sys" style="padding:.4rem .6rem"><i class="ti ti-edit"></i> แก้ไข</button> ' +
              (m.deleted
                ? '<button class="btn btn-ghost rs-sys" style="padding:.4rem .6rem;color:var(--ok);border-color:color-mix(in srgb,var(--ok) 40%,transparent)"><i class="ti ti-arrow-back-up"></i> กู้คืน</button>'
                : (m.id === 'admin' ? '' : '<button class="btn btn-ghost del-sys" style="padding:.4rem .6rem;color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,transparent)"><i class="ti ti-trash"></i> ลบ</button>')) +
            '</td>';

          var sw = tr.querySelector('.switch');
          if (sw) sw.onclick = function () {
            var on = !sw.classList.contains('on'); sw.classList.toggle('on', on);
            svc.api('togglePlugin', { id: m.id, enabled: on })
              .then(function () { m.enabled = on; syncMeta(all); svc.toast('success', on ? 'เปิดใช้งานแล้ว' : 'ปิดแล้ว'); })
              .catch(function (e) { sw.classList.toggle('on', !on); svc.toast('error', String(e.message || e)); });
          };
          tr.querySelector('.edit-sys').onclick = function () { openEdit(m); };
          var del = tr.querySelector('.del-sys'); if (del) del.onclick = function () { doDelete(m); };
          var rs = tr.querySelector('.rs-sys'); if (rs) rs.onclick = function () { doRestore(m); };
          tb.appendChild(tr);
        });
        var cEl = $('#shownCount', host);
        if (cEl) { cEl.dataset.done = ''; cEl.dataset.count = all.filter(function (m) { return m.enabled && !m.deleted; }).length; svc.animateCounters(host); }
      }

      function openEdit(m) {
        svc.swal.fire(Object.assign({
          title: 'แก้ไขระบบ', focusConfirm: false, showCancelButton: true,
          confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
          html: '<div style="text-align:left;font-size:.88rem">' +
            '<label>ชื่อที่แสดง</label><input id="e-title" style="' + INP + '" value="' + esc(m.title) + '">' +
            '<label>ไอคอน (Tabler เช่น ti-file-pencil)</label><input id="e-icon" style="' + INP + '" value="' + esc(m.icon) + '">' +
            '<label>ลำดับการแสดง</label><input id="e-order" type="number" style="' + INP + '" value="' + (m.order || 0) + '">' +
            '</div>',
          preConfirm: function () {
            return { title: document.getElementById('e-title').value, icon: document.getElementById('e-icon').value, order: document.getElementById('e-order').value };
          }
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          svc.api('updatePlugin', { id: m.id, title: r.value.title, icon: r.value.icon, order: r.value.order })
            .then(function () { svc.toast('success', 'บันทึกแล้ว'); loadList(); })
            .catch(function (e) { svc.toast('error', String(e.message || e)); });
        });
      }

      function doDelete(m) {
        svc.swal.fire(Object.assign({
          icon: 'warning', title: 'ลบระบบนี้ออก?', showCancelButton: true,
          confirmButtonText: 'ลบออก', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#fb7185',
          html: '“<b>' + esc(m.title) + '</b>” จะถูกซ่อนจากเมนู<br><span style="font-size:.82rem;color:#9aa8c8">กู้คืนได้ภายหลังจากหน้านี้ (ไฟล์บน GitHub ไม่ถูกแตะ)</span>'
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          svc.api('deletePlugin', { id: m.id })
            .then(function () { svc.toast('success', 'ลบ “' + m.title + '” แล้ว (กู้คืนได้)'); loadList(); })
            .catch(function (e) { svc.toast('error', 'ลบไม่สำเร็จ: ' + String(e.message || e)); });
        });
      }

      function doRestore(m) {
        svc.api('restorePlugin', { id: m.id })
          .then(function () { svc.toast('success', 'กู้คืน “' + m.title + '” แล้ว'); loadList(); })
          .catch(function (e) { svc.toast('error', String(e.message || e)); });
      }

      function loadList() {
        var tb = $('#tb', host);
        tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">กำลังโหลด...</td></tr>';
        svc.api('listAllPlugins').then(function (all) { renderRows(all); syncMeta(all); })
          .catch(function (e) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--bad);padding:20px">โหลดไม่ได้: ' + String(e.message || e) + '</td></tr>'; });
      }

      $('#reload', host).onclick = loadList;
      $('#addsys', host).onclick = function () {
        svc.swal.fire(Object.assign({
          icon: 'info', title: 'ติดตั้งระบบใหม่', width: 600, confirmButtonText: 'เข้าใจแล้ว', confirmButtonColor: '#6366f1',
          html: 'เพิ่ม “ระบบ” ใหม่บน GitHub ทำได้ 3 ขั้น:<br><br>' +
            '<div style="text-align:left;font-size:.9rem;line-height:1.7"><b>1.</b> สร้างไฟล์ <code>plugins/ชื่อระบบ.js</code><br><b>2.</b> ในไฟล์เรียก <code>Platform.register({...})</code><br><b>3.</b> เพิ่มชื่อไฟล์ลง <code>manifest.json</code> และเพิ่มแถวในชีต <code>Plugins</code></div>' +
            '<pre style="text-align:left;background:#0b1120;color:#9fb3ff;padding:12px;border-radius:10px;font-size:12px;margin-top:12px;overflow:auto">// plugins/flashcard.js\nPlatform.register({\n  id:\'flashcard\',\n  mount:function(host,svc){\n    host.innerHTML = \'...UI...\';\n  }\n});</pre>'
        }, svc.swalDark));
      };
      $('#savecfg', host).onclick = function () {
        svc.api('saveSettings', { org: $('#org', host).value, dept: $('#dept', host).value })
          .then(function () { P.settings.org = $('#org', host).value; P.settings.dept = $('#dept', host).value; svc.toast('success', 'บันทึกแล้ว'); })
          .catch(function (e) { svc.toast('error', String(e.message || e)); });
      };

      svc.api('adminStats').then(function (s) {
        var el = $('#savedCount', host); if (el) el.dataset.count = s.saved; svc.animateCounters(host);
      }).catch(function () { svc.animateCounters(host); });

      loadList();
    }
  });
})();
