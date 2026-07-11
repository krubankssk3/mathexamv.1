/*** EduForge plugin — จัดการผู้ใช้ (users) — เฉพาะผู้ดูแล ******************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  var IN = 'width:100%;margin:.3rem 0;padding:.6rem .8rem;border-radius:8px;background:#0b1120;color:#e6ebf7;border:1px solid #2a3556;font-family:Sarabun,sans-serif';
  var ROLE_TH = { admin: 'ผู้ดูแลระบบ', teacher: 'ครู', member: 'ผู้ใช้ทั่วไป' };
  var ST_TH = { active: 'ใช้งานได้', pending: 'รออนุมัติ', disabled: 'ระงับ' };
  var ST_COLOR = { active: 'var(--ok)', pending: 'var(--warn)', disabled: 'var(--bad)' };

  window.Platform.register({
    id: 'users',
    mount: function (host, svc, P) {
      host.innerHTML =
        '<div class="panel" style="padding:20px">' +
          '<div style="display:flex;align-items:center;margin-bottom:14px"><div><div class="eyebrow">จัดการผู้ใช้</div>' +
          '<p style="color:var(--muted);font-size:.86rem;margin:2px 0 0">อนุมัติคนสมัคร · เพิ่ม/แก้บทบาท · รีเซ็ตรหัส · ระงับ/ลบ</p></div>' +
          '<button class="btn btn-ghost" id="reload" style="margin-left:auto;margin-right:8px;padding:.5rem .8rem"><i class="ti ti-refresh"></i></button>' +
          '<button class="btn btn-accent" id="adduser"><i class="ti ti-user-plus"></i> เพิ่มผู้ใช้</button></div>' +
          '<div style="overflow:auto"><table class="adm"><thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th style="text-align:center">สถานะ</th><th style="text-align:center">จัดการ</th></tr></thead><tbody id="ub"></tbody></table></div>' +
        '</div>';

      function render(list) {
        var tb = $('#ub', host); tb.innerHTML = '';
        list.forEach(function (u) {
          var st = String(u.status || 'active').toLowerCase();
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td><div class="flex items-center gap2"><span class="ni-ic" style="width:30px;height:30px"><i class="ti ' + (u.role === 'admin' ? 'ti-shield-lock' : (u.role === 'teacher' ? 'ti-user' : 'ti-user-circle')) + '"></i></span>' +
              '<div><b class="font-display">' + esc(u.displayName || u.username) + '</b><div class="mono" style="font-size:.7rem;color:var(--muted)">' + esc(u.username) + '</div></div></div></td>' +
            '<td>' + (ROLE_TH[u.role] || u.role) + '</td>' +
            '<td style="text-align:center"><span class="chip" style="font-size:.7rem;color:' + (ST_COLOR[st] || 'var(--muted)') + '">' + (ST_TH[st] || st) + '</span></td>' +
            '<td style="text-align:center;white-space:nowrap">' +
              (st === 'pending' ? '<button class="btn btn-ghost ap" style="padding:.35rem .55rem;color:var(--ok)"><i class="ti ti-check"></i> อนุมัติ</button> ' : '') +
              '<button class="btn btn-ghost ed" style="padding:.35rem .55rem"><i class="ti ti-edit"></i></button> ' +
              '<button class="btn btn-ghost rs" style="padding:.35rem .55rem" title="รีเซ็ตรหัส"><i class="ti ti-key"></i></button> ' +
              '<button class="btn btn-ghost dl" style="padding:.35rem .55rem;color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,transparent)"><i class="ti ti-trash"></i></button>' +
            '</td>';
          var ap = tr.querySelector('.ap'); if (ap) ap.onclick = function () { call('updateUser', { username: u.username, status: 'active' }, 'อนุมัติแล้ว'); };
          tr.querySelector('.ed').onclick = function () { editUser(u); };
          tr.querySelector('.rs').onclick = function () { resetPass(u); };
          tr.querySelector('.dl').onclick = function () { delUser(u); };
          tb.appendChild(tr);
        });
      }
      function call(action, payload, okMsg) {
        svc.loading('กำลังบันทึก...');
        svc.api(action, payload).then(function () { svc.done(); svc.toast('success', okMsg || 'สำเร็จ'); load(); })
          .catch(function (e) { svc.done(); svc.swal.fire(Object.assign({ icon: 'error', title: 'ไม่สำเร็จ', text: String(e.message || e), confirmButtonColor: '#6366f1' }, svc.swalDark)); });
      }
      function roleSelect(id, val) {
        return '<select id="' + id + '" style="' + IN + '">' +
          ['member', 'teacher', 'admin'].map(function (r) { return '<option value="' + r + '"' + (r === val ? ' selected' : '') + '>' + ROLE_TH[r] + '</option>'; }).join('') + '</select>';
      }
      function editUser(u) {
        svc.swal.fire(Object.assign({
          title: 'แก้ไขผู้ใช้', focusConfirm: false, showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
          html: '<div style="text-align:left"><label>ชื่อที่แสดง</label><input id="e-name" style="' + IN + '" value="' + esc(u.displayName || '') + '">' +
            '<label>บทบาท</label>' + roleSelect('e-role', u.role) +
            '<label>สถานะ</label><select id="e-st" style="' + IN + '">' +
            ['active', 'pending', 'disabled'].map(function (s) { return '<option value="' + s + '"' + (s === String(u.status) ? ' selected' : '') + '>' + ST_TH[s] + '</option>'; }).join('') + '</select></div>',
          preConfirm: function () { return { displayName: document.getElementById('e-name').value, role: document.getElementById('e-role').value, status: document.getElementById('e-st').value }; }
        }, svc.swalDark)).then(function (r) { if (r.isConfirmed) call('updateUser', { username: u.username, displayName: r.value.displayName, role: r.value.role, status: r.value.status }, 'บันทึกแล้ว'); });
      }
      function resetPass(u) {
        svc.swal.fire(Object.assign({
          title: 'รีเซ็ตรหัสผ่าน', text: u.username, input: 'password', inputPlaceholder: 'รหัสผ่านใหม่ (≥ 4 ตัว)',
          showCancelButton: true, confirmButtonText: 'รีเซ็ต', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
          inputValidator: function (v) { if (!v || v.length < 4) return 'อย่างน้อย 4 ตัว'; }
        }, svc.swalDark)).then(function (r) { if (r.isConfirmed) call('resetUserPassword', { username: u.username, newPassword: r.value }, 'รีเซ็ตรหัสแล้ว (ผู้ใช้ต้องตั้งใหม่เมื่อล็อกอิน)'); });
      }
      function delUser(u) {
        svc.swal.fire(Object.assign({ icon: 'warning', title: 'ลบผู้ใช้นี้?', text: u.username, showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#fb7185' }, svc.swalDark))
          .then(function (r) { if (r.isConfirmed) call('deleteUser', { username: u.username }, 'ลบแล้ว'); });
      }
      $('#adduser', host).onclick = function () {
        svc.swal.fire(Object.assign({
          title: 'เพิ่มผู้ใช้', focusConfirm: false, showCancelButton: true, confirmButtonText: 'เพิ่ม', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
          html: '<div style="text-align:left">' +
            '<input id="a-user" placeholder="ชื่อผู้ใช้ (อังกฤษ/ตัวเลข)" style="' + IN + '">' +
            '<input id="a-name" placeholder="ชื่อที่แสดง" style="' + IN + '">' +
            '<input id="a-pass" type="password" placeholder="รหัสผ่านเริ่มต้น" style="' + IN + '">' +
            roleSelect('a-role', 'teacher') + '</div>',
          preConfirm: function () {
            var u = document.getElementById('a-user').value.trim();
            var p = document.getElementById('a-pass').value;
            if (!/^[a-zA-Z0-9_.]{3,}$/.test(u)) { svc.swal.showValidationMessage('ชื่อผู้ใช้ไม่ถูกต้อง'); return false; }
            if (p.length < 4) { svc.swal.showValidationMessage('รหัสผ่าน ≥ 4 ตัว'); return false; }
            return { username: u, displayName: document.getElementById('a-name').value || u, password: p, role: document.getElementById('a-role').value };
          }
        }, svc.swalDark)).then(function (r) { if (r.isConfirmed) call('addUser', r.value, 'เพิ่มผู้ใช้แล้ว'); });
      };
      $('#reload', host).onclick = load;

      function load() {
        var tb = $('#ub', host); tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">กำลังโหลด...</td></tr>';
        svc.loading('กำลังโหลดข้อมูลผู้ใช้...');
        svc.api('listUsers').then(function (list) { svc.done(); render(list); }).catch(function (e) {
          svc.done();
          tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--bad);padding:20px">โหลดไม่ได้: ' + String(e.message || e) + '</td></tr>';
        });
      }
      load();
    }
  });
})();
