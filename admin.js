/*** EduForge plugin — จัดการระบบ (admin) *******************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.Platform.register({
    id: 'admin',
    mount: function (host, svc, P) {
      var meta = P.meta.filter(function (m) { return m.id !== 'admin'; });

      host.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px" class="grid-main">' +
          '<div class="panel" style="padding:18px"><div class="eyebrow">ระบบที่แสดงอยู่</div><div class="font-display" data-count="' + meta.length + '" style="font-size:2.2rem;font-weight:700">0</div></div>' +
          '<div class="panel" style="padding:18px"><div class="eyebrow">ผู้ใช้ปัจจุบัน</div><div class="font-display" style="font-size:1.5rem;font-weight:700;color:var(--accent2);margin-top:8px">' + (P.user.name || '-') + '</div></div>' +
          '<div class="panel" style="padding:18px"><div class="eyebrow">ชุดในคลัง (ทั้งระบบ)</div><div class="font-display mono" id="savedCount" data-count="0" style="font-size:2.2rem;font-weight:700">0</div></div>' +
        '</div>' +
        '<div class="panel" style="padding:20px">' +
          '<div style="display:flex;align-items:center;margin-bottom:14px"><div><div class="eyebrow">ระบบย่อย (Plugins)</div>' +
          '<p style="color:var(--muted);font-size:.86rem;margin:2px 0 0">เปิด/ปิดระบบที่จะให้ผู้ใช้เห็นในแถบด้านซ้าย (บันทึกลง Google Sheets)</p></div>' +
          '<button class="btn btn-accent" id="addsys" style="margin-left:auto"><i class="ti ti-plus"></i> ติดตั้งระบบใหม่</button></div>' +
          '<div style="overflow:auto"><table class="adm"><thead><tr><th>ระบบ</th><th>ไฟล์</th><th style="text-align:center">สถานะ</th></tr></thead><tbody id="tb"></tbody></table></div>' +
        '</div>' +
        '<div class="panel" style="padding:20px;margin-top:16px">' +
          '<div class="eyebrow" style="margin-bottom:12px">หัวกระดาษ (ใช้ทุกระบบ)</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="grid-main">' +
            '<div><label class="lbl">ชื่อหน่วยงาน</label><input class="field" id="org" style="margin-top:5px" value="' + (P.settings.org || '') + '"></div>' +
            '<div><label class="lbl">สังกัด</label><input class="field" id="dept" style="margin-top:5px" value="' + (P.settings.dept || '') + '"></div>' +
          '</div><button class="btn btn-accent" id="savecfg" style="margin-top:14px"><i class="ti ti-device-floppy"></i> บันทึก</button>' +
        '</div>';

      var tb = $('#tb', host);
      meta.forEach(function (m) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><div class="flex items-center gap2"><span class="ni-ic" style="width:30px;height:30px"><i class="ti ' + m.icon + '"></i></span><b class="font-display">' + m.title + '</b>' + (m.adminOnly ? ' <span class="chip" style="font-size:.62rem">admin</span>' : '') + '</div></td>' +
          '<td class="mono" style="color:var(--muted)">plugins/' + m.id + '.js</td>' +
          '<td style="text-align:center"><div class="switch on" style="margin:0 auto"><i></i></div></td>';
        tr.querySelector('.switch').onclick = function () {
          var on = !this.classList.contains('on');
          var sw = this;
          sw.classList.toggle('on', on);           // สลับทันที
          svc.toast('success', on ? 'เปิดใช้งานแล้ว' : 'ปิดแล้ว (รีโหลดเพื่อให้เมนูอัปเดต)');
          svc.api('togglePlugin', { id: m.id, enabled: on })
            .catch(function (e) { sw.classList.toggle('on', !on); svc.toast('error', String(e.message || e)); });
        };
        tb.appendChild(tr);
      });

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
        var el = $('#savedCount', host); if (el) el.dataset.count = s.saved;
        svc.animateCounters(host);
      }).catch(function () { svc.animateCounters(host); });
    }
  });
})();
