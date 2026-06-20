/*** EduForge plugin — จัดการหลักสูตร (admin) — เพิ่ม/แก้ไข/ลบ ชั้นและบทเรียน ***/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  var INP = 'width:100%;margin:.3rem 0 .2rem;padding:.6rem .7rem;border-radius:8px;background:#0b1120;color:#e6ebf7;border:1px solid #2a3556;font-family:Sarabun,sans-serif;font-size:.95rem;box-sizing:border-box';

  window.Platform.register({
    id: 'curriculum',
    mount: function (host, svc, P) {
      var data = { grades: [], genTypes: [] };
      var activeGid = null;

      host.innerHTML =
        '<div class="panel" style="padding:20px">' +
          '<div style="display:flex;align-items:center;margin-bottom:14px">' +
            '<div><div class="eyebrow">จัดการหลักสูตร</div>' +
            '<p style="color:var(--muted);font-size:.86rem;margin:2px 0 0">เพิ่ม/แก้ไข/ลบ ชั้นและบทเรียน — บทใหม่จะขึ้นใน Node รายชั้นทันที</p></div>' +
            '<button class="btn btn-ghost" id="cReload" style="margin-left:auto;margin-right:8px;padding:.5rem .8rem"><i class="ti ti-refresh"></i></button>' +
            '<button class="btn btn-accent" id="cAddGrade"><i class="ti ti-plus"></i> เพิ่มชั้นใหม่</button>' +
          '</div>' +
          '<div id="cGrades" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px"></div>' +
          '<div id="cBody"></div>' +
        '</div>';

      function genOptions(sel) {
        return data.genTypes.map(function (g) {
          return '<option value="' + g.id + '"' + (g.id === sel ? ' selected' : '') + '>' + esc(g.label) + '</option>';
        }).join('');
      }

      // อัปเดต curriculum ในแอป (เฉพาะบทที่เปิด) เพื่อให้ Node รายชั้นตรงกับของจริงทันที
      function refreshLocalCurriculum() {
        var grades = data.grades.map(function (g) {
          return {
            id: g.id, name: g.name, order: g.order,
            chapters: g.chapters.filter(function (c) { return c.enabled; }).map(function (c) {
              var lv = {}; if (c.lv) { try { lv = JSON.parse(c.lv); } catch (e) {} }
              return { id: c.id, name: c.name, icon: c.icon || 'ti-file', gen: c.gen, ops: c.ops ? String(c.ops).split(',').map(function (s) { return s.trim(); }) : [], lv: lv };
            })
          };
        }).filter(function (g) { return g.chapters.length; });
        P.curriculum = { subject: 'คณิตศาสตร์', grades: grades };
      }

      function renderGradeChips() {
        var box = $('#cGrades', host); box.innerHTML = '';
        if (!data.grades.length) { box.innerHTML = '<span style="color:var(--muted)">ยังไม่มีชั้น — กด “เพิ่มชั้นใหม่”</span>'; return; }
        data.grades.forEach(function (g) {
          var b = document.createElement('button'); b.className = 'chip click'; b.style.whiteSpace = 'nowrap';
          if (g.id === activeGid) { b.style.background = 'var(--accent)'; b.style.color = '#fff'; b.style.borderColor = 'transparent'; }
          b.textContent = g.name + ' (' + g.chapters.length + ')';
          b.onclick = function () { activeGid = g.id; render(); };
          box.appendChild(b);
        });
      }

      function renderBody() {
        var body = $('#cBody', host); body.innerHTML = '';
        var g = data.grades.filter(function (x) { return x.id === activeGid; })[0];
        if (!g) { body.innerHTML = '<p style="color:var(--muted)">เลือกชั้นด้านบน หรือเพิ่มชั้นใหม่</p>'; return; }

        var rows = g.chapters.map(function (c) {
          var label = (data.genTypes.filter(function (t) { return t.id === c.gen; })[0] || {}).label || c.gen;
          return '<tr>' +
            '<td><i class="ti ' + esc(c.icon || 'ti-file') + '" style="margin-right:6px;color:var(--accent2)"></i>' + esc(c.name) + (c.ops ? ' <span style="color:var(--muted);font-size:.8rem">[' + esc(c.ops) + ']</span>' : '') + '</td>' +
            '<td>' + esc(label) + '</td>' +
            '<td style="text-align:center">' + (c.enabled ? '<span style="color:var(--ok)">เปิด</span>' : '<span style="color:var(--muted)">ปิด</span>') + '</td>' +
            '<td style="text-align:center;white-space:nowrap">' +
              '<button class="btn btn-ghost cEdit" data-id="' + esc(c.id) + '" style="padding:.35rem .5rem"><i class="ti ti-edit"></i></button> ' +
              '<button class="btn btn-ghost cToggle" data-id="' + esc(c.id) + '" data-en="' + (c.enabled ? '1' : '0') + '" style="padding:.35rem .5rem"><i class="ti ' + (c.enabled ? 'ti-eye-off' : 'ti-eye') + '"></i></button> ' +
              '<button class="btn btn-ghost cDel" data-id="' + esc(c.id) + '" data-name="' + esc(c.name) + '" style="padding:.35rem .5rem;color:var(--bad)"><i class="ti ti-trash"></i></button>' +
            '</td></tr>';
        }).join('');

        body.innerHTML =
          '<div style="display:flex;align-items:center;margin-bottom:10px">' +
            '<div class="font-display" style="font-size:1.15rem;font-weight:700">' + esc(g.name) + '</div>' +
            '<button class="btn btn-ghost" id="cEditGrade" style="margin-left:12px;padding:.35rem .6rem"><i class="ti ti-edit"></i> แก้ชั้น</button>' +
            '<button class="btn btn-ghost" id="cDelGrade" style="padding:.35rem .6rem;color:var(--bad)"><i class="ti ti-trash"></i> ลบชั้น</button>' +
            '<button class="btn btn-accent" id="cAddChapter" style="margin-left:auto"><i class="ti ti-plus"></i> เพิ่มบทเรียน</button>' +
          '</div>' +
          '<div style="overflow:auto"><table class="adm"><thead><tr><th>บทเรียน</th><th>ชนิดโจทย์</th><th style="text-align:center">สถานะ</th><th style="text-align:center">จัดการ</th></tr></thead><tbody>' +
          (rows || '<tr><td colspan="4" style="color:var(--muted)">ยังไม่มีบทเรียนในชั้นนี้</td></tr>') +
          '</tbody></table></div>';

        $('#cAddChapter', body).onclick = function () { chapterDialog(g, null); };
        $('#cEditGrade', body).onclick = function () { gradeEditDialog(g); };
        $('#cDelGrade', body).onclick = function () { delGrade(g); };
        $$('.cEdit', body).forEach(function (b) { b.onclick = function () { var c = g.chapters.filter(function (x) { return x.id === b.dataset.id; })[0]; chapterDialog(g, c); }; });
        $$('.cToggle', body).forEach(function (b) { b.onclick = function () { toggleChapter(b.dataset.id, b.dataset.en !== '1'); }; });
        $$('.cDel', body).forEach(function (b) { b.onclick = function () { delChapter(b.dataset.id, b.dataset.name); }; });
      }

      function render() { renderGradeChips(); renderBody(); }

      function load() {
        svc.loading('กำลังโหลดหลักสูตร...');
        svc.api('adminCurriculum').then(function (res) {
          svc.done();
          data = res || { grades: [], genTypes: [] };
          if (!activeGid || !data.grades.filter(function (g) { return g.id === activeGid; })[0]) activeGid = data.grades[0] && data.grades[0].id;
          refreshLocalCurriculum();
          render();
        }).catch(function (e) { svc.done(); svc.toast(String(e), 'error'); });
      }

      /* ---------- dialogs ---------- */
      var PICS_ = ['\ud83c\udf4e','\u2b50','\u2764\ufe0f','\ud83c\udf38','\ud83d\ude97','\ud83c\udf53','\ud83e\uddc1','\u270f\ufe0f','\ud83d\udc30','\u26bd','\ud83c\udf4c','\ud83d\udc31','\ud83c\udf1f','\ud83c\udf88','\ud83c\udf69','\ud83d\udc36'];
      function chapterDialog(g, c) {
        var editing = !!c;
        var lvObj = {}; if (editing && c.lv) { try { lvObj = JSON.parse(c.lv); } catch (e) {} }
        var selPics = (lvObj.pics && lvObj.pics.slice()) || [];
        var curGen = editing ? c.gen : (data.genTypes[0] && data.genTypes[0].id);
        var opsArr = (editing && c.ops) ? String(c.ops).split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
        var selPicOps = (curGen === 'picture' && opsArr.length) ? opsArr.slice() : ['+'];
        var selAr = (curGen === 'arith' && opsArr.length) ? opsArr.slice() : ['+'];
        var instr0 = lvObj.instruction || '';

        function tglBtns(list, sel, cls) {
          return list.map(function (o) {
            var on = sel.indexOf(o[0]) >= 0;
            return '<button type="button" class="' + cls + '" data-o="' + o[0] + '" style="padding:6px 12px;border-radius:8px;border:1px solid ' + (on ? '#6366f1' : '#2a3556') + ';background:' + (on ? 'rgba(99,102,241,.25)' : '#0b1120') + ';color:#e6ebf7;cursor:pointer">' + o[1] + '</button>';
          }).join('');
        }
        function picBtns() {
          return PICS_.map(function (pp) {
            var on = selPics.indexOf(pp) >= 0;
            return '<button type="button" class="sw_pic" data-p="' + pp + '" style="font-size:20px;padding:4px 9px;border-radius:8px;border:1px solid ' + (on ? '#6366f1' : '#2a3556') + ';background:' + (on ? 'rgba(99,102,241,.25)' : '#0b1120') + ';cursor:pointer">' + pp + '</button>';
          }).join('');
        }
        var AR_ = [['+', 'บวก (+)'], ['-', 'ลบ (−)'], ['x', 'คูณ (×)'], ['/', 'หาร (÷)']];
        var POP_ = [['+', 'บวก (+)'], ['-', 'ลบ (−)']];

        function bindTgl(wrapId, list, sel) {
          document.getElementById(wrapId).addEventListener('click', function (e) {
            var b = e.target.closest ? e.target.closest('button[data-o]') : null; if (!b) return;
            var o = b.getAttribute('data-o'); var i = sel.indexOf(o);
            if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else sel.push(o);
            var on = sel.indexOf(o) >= 0;
            b.style.borderColor = on ? '#6366f1' : '#2a3556'; b.style.background = on ? 'rgba(99,102,241,.25)' : '#0b1120';
          });
        }

        svc.swal.fire(Object.assign({
          title: editing ? 'แก้ไขบทเรียน' : 'เพิ่มบทเรียน — ' + g.name,
          width: 560,
          html:
            '<div style="text-align:left">' +
              '<label style="font-size:.85rem;color:#9aa8c8">ชื่อบทเรียน</label>' +
              '<input id="sw_cn" style="' + INP + '" value="' + esc(editing ? c.name : '') + '" placeholder="เช่น การบวกจำนวนสองหลัก">' +
              '<label style="font-size:.85rem;color:#9aa8c8">ไอคอน (Tabler เช่น ti-plus)</label>' +
              '<input id="sw_ci" style="' + INP + '" value="' + esc(editing ? (c.icon || 'ti-file') : 'ti-file') + '">' +
              '<label style="font-size:.85rem;color:#9aa8c8">ชนิดโจทย์</label>' +
              '<select id="sw_cg" style="' + INP + '">' + genOptions(curGen) + '</select>' +
              '<div id="sw_arithWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">การดำเนินการ (เลือกได้หลายอย่าง)</label>' +
                '<div id="sw_ar" style="display:flex;flex-wrap:wrap;gap:8px;margin:.35rem 0 .4rem">' + tglBtns(AR_, selAr, 'sw_arop') + '</div>' +
              '</div>' +
              '<div id="sw_picWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">เลือกรูปภาพที่จะใช้ (เลือกได้หลายรูป)</label>' +
                '<div id="sw_pics" style="display:flex;flex-wrap:wrap;gap:6px;margin:.35rem 0 .7rem">' + picBtns() + '</div>' +
                '<label style="font-size:.85rem;color:#9aa8c8">การดำเนินการ</label>' +
                '<div id="sw_pop" style="display:flex;gap:8px;margin:.35rem 0 .7rem">' + tglBtns(POP_, selPicOps, 'sw_pop_b') + '</div>' +
                '<label style="font-size:.85rem;color:#9aa8c8">คำชี้แจง</label>' +
                '<input id="sw_instr" style="' + INP + '" value="' + esc(instr0) + '" placeholder="เช่น นับจำนวนสิ่งของในแต่ละกลุ่ม แล้วหาผลรวม">' +
              '</div>' +
              '<div id="sw_noOps" style="display:none;font-size:.82rem;color:#9aa8c8;margin-top:.3rem">ชนิดนี้สร้างโจทย์ให้อัตโนมัติ ไม่ต้องตั้งตัวดำเนินการ</div>' +
            '</div>',
          showCancelButton: true, confirmButtonText: editing ? 'บันทึก' : 'เพิ่ม', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
          focusConfirm: false,
          didOpen: function () {
            var sel = document.getElementById('sw_cg');
            function toggle() {
              var v = sel.value;
              document.getElementById('sw_arithWrap').style.display = v === 'arith' ? 'block' : 'none';
              document.getElementById('sw_picWrap').style.display = v === 'picture' ? 'block' : 'none';
              document.getElementById('sw_noOps').style.display = (v === 'arith' || v === 'picture') ? 'none' : 'block';
            }
            sel.addEventListener('change', toggle); toggle();
            bindTgl('sw_ar', AR_, selAr);
            bindTgl('sw_pop', POP_, selPicOps);
            document.getElementById('sw_pics').addEventListener('click', function (e) {
              var b = e.target.closest ? e.target.closest('.sw_pic') : null; if (!b) return;
              var pp = b.getAttribute('data-p'); var i = selPics.indexOf(pp);
              if (i >= 0) selPics.splice(i, 1); else selPics.push(pp);
              var on = selPics.indexOf(pp) >= 0;
              b.style.borderColor = on ? '#6366f1' : '#2a3556'; b.style.background = on ? 'rgba(99,102,241,.25)' : '#0b1120';
            });
          },
          preConfirm: function () {
            var name = (document.getElementById('sw_cn').value || '').trim();
            if (!name) { window.Swal.showValidationMessage('กรอกชื่อบทเรียน'); return false; }
            var gen = document.getElementById('sw_cg').value;
            var icon = (document.getElementById('sw_ci').value || 'ti-file').trim();
            if (gen === 'picture') {
              if (!selPics.length) { window.Swal.showValidationMessage('เลือกรูปอย่างน้อย 1 รูป'); return false; }
              if (!selPicOps.length) { window.Swal.showValidationMessage('เลือกการดำเนินการอย่างน้อย 1 อย่าง'); return false; }
              return { picture: true, chapterName: name, icon: icon, gen: gen, ops: selPicOps.join(','), lv: { pics: selPics.slice(), instruction: (document.getElementById('sw_instr').value || '').trim() } };
            }
            if (gen === 'arith') {
              if (!selAr.length) { window.Swal.showValidationMessage('เลือกการดำเนินการอย่างน้อย 1 อย่าง'); return false; }
              return { chapterName: name, icon: icon, gen: gen, ops: selAr.join(',') };
            }
            return { chapterName: name, icon: icon, gen: gen, ops: '' };
          }
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          var p = r.value;
          var payload = editing ? { chapterId: c.id } : { gradeId: g.id };
          payload.chapterName = p.chapterName; payload.icon = p.icon; payload.gen = p.gen; payload.ops = p.ops;
          if (p.picture) payload.lv = p.lv;
          svc.loading('กำลังบันทึก...');
          svc.api(editing ? 'updateChapter' : 'addChapter', payload)
            .then(function () { svc.done(); svc.toast(editing ? 'แก้ไขแล้ว' : 'เพิ่มบทเรียนแล้ว', 'success'); load(); })
            .catch(function (e) { svc.done(); svc.toast(String(e), 'error'); });
        });
      }

      function gradeAddDialog() {
        svc.swal.fire(Object.assign({
          title: 'เพิ่มชั้นใหม่',
          html:
            '<div style="text-align:left">' +
              '<label style="font-size:.85rem;color:#9aa8c8">รหัสชั้น (อังกฤษ/ตัวเลข เช่น p7, m4)</label>' +
              '<input id="sw_gid" style="' + INP + '" placeholder="p7">' +
              '<label style="font-size:.85rem;color:#9aa8c8">ชื่อชั้น (เช่น ป.7)</label>' +
              '<input id="sw_gname" style="' + INP + '" placeholder="ป.7">' +
              '<hr style="border:none;border-top:1px solid #2a3556;margin:.7rem 0">' +
              '<div style="font-size:.8rem;color:#9aa8c8;margin-bottom:.3rem">บทเรียนแรกของชั้นนี้</div>' +
              '<input id="sw_cn" style="' + INP + '" placeholder="ชื่อบทเรียน เช่น การบวก">' +
              '<select id="sw_cg" style="' + INP + '">' + genOptions('') + '</select>' +
              '<input id="sw_co" style="' + INP + '" placeholder="ตัวดำเนินการ เช่น + (เว้นว่างได้)">' +
            '</div>',
          showCancelButton: true, confirmButtonText: 'เพิ่มชั้น', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
          focusConfirm: false,
          preConfirm: function () {
            var gid = (document.getElementById('sw_gid').value || '').trim();
            var gname = (document.getElementById('sw_gname').value || '').trim();
            var cn = (document.getElementById('sw_cn').value || '').trim();
            if (!/^[a-zA-Z0-9_]+$/.test(gid)) { window.Swal.showValidationMessage('รหัสชั้นเป็นภาษาอังกฤษ/ตัวเลขเท่านั้น'); return false; }
            if (!gname) { window.Swal.showValidationMessage('กรอกชื่อชั้น'); return false; }
            if (!cn) { window.Swal.showValidationMessage('กรอกชื่อบทเรียนแรก'); return false; }
            return { gradeId: gid, gradeName: gname, chapterName: cn, gen: document.getElementById('sw_cg').value, ops: (document.getElementById('sw_co').value || '').trim() };
          }
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          var p = r.value;
          svc.loading('กำลังเพิ่มชั้น...');
          svc.api('addChapter', { gradeId: p.gradeId, gradeName: p.gradeName, chapterName: p.chapterName, gen: p.gen, ops: p.ops, icon: 'ti-file' })
            .then(function () { svc.done(); svc.toast('เพิ่มชั้นใหม่แล้ว', 'success'); activeGid = p.gradeId; load(); })
            .catch(function (e) { svc.done(); svc.toast(String(e), 'error'); });
        });
      }

      function gradeEditDialog(g) {
        svc.swal.fire(Object.assign({
          title: 'แก้ไขชั้น',
          html:
            '<div style="text-align:left">' +
              '<label style="font-size:.85rem;color:#9aa8c8">ชื่อชั้น</label>' +
              '<input id="sw_gn" style="' + INP + '" value="' + esc(g.name) + '">' +
              '<label style="font-size:.85rem;color:#9aa8c8">ลำดับ (เลขน้อยขึ้นก่อน)</label>' +
              '<input id="sw_go" type="number" style="' + INP + '" value="' + esc(g.order) + '">' +
            '</div>',
          showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#6366f1',
          focusConfirm: false,
          preConfirm: function () {
            var n = (document.getElementById('sw_gn').value || '').trim();
            if (!n) { window.Swal.showValidationMessage('กรอกชื่อชั้น'); return false; }
            return { gradeName: n, gradeOrder: document.getElementById('sw_go').value };
          }
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          svc.loading('กำลังบันทึก...');
          svc.api('updateGrade', { gradeId: g.id, gradeName: r.value.gradeName, gradeOrder: r.value.gradeOrder })
            .then(function () { svc.done(); svc.toast('แก้ไขชั้นแล้ว', 'success'); load(); })
            .catch(function (e) { svc.done(); svc.toast(String(e), 'error'); });
        });
      }

      function toggleChapter(id, enable) {
        svc.loading('กำลังบันทึก...');
        svc.api('updateChapter', { chapterId: id, enabled: enable })
          .then(function () { svc.done(); load(); })
          .catch(function (e) { svc.done(); svc.toast(String(e), 'error'); });
      }

      function delChapter(id, name) {
        svc.swal.fire(Object.assign({
          title: 'ลบบทเรียน?', html: 'ลบ “' + esc(name) + '” ออกจากหลักสูตรถาวร',
          icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#fb7185'
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          svc.loading('กำลังลบ...');
          svc.api('deleteChapter', { chapterId: id })
            .then(function () { svc.done(); svc.toast('ลบแล้ว', 'success'); load(); })
            .catch(function (e) { svc.done(); svc.toast(String(e), 'error'); });
        });
      }

      function delGrade(g) {
        svc.swal.fire(Object.assign({
          title: 'ลบทั้งชั้น?', html: 'ลบ “' + esc(g.name) + '” และบทเรียนทั้งหมด (' + g.chapters.length + ' บท) ถาวร',
          icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบทั้งชั้น', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#fb7185'
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          svc.loading('กำลังลบ...');
          svc.api('deleteGrade', { gradeId: g.id })
            .then(function () { svc.done(); svc.toast('ลบชั้นแล้ว', 'success'); activeGid = null; load(); })
            .catch(function (e) { svc.done(); svc.toast(String(e), 'error'); });
        });
      }

      $('#cReload', host).onclick = load;
      $('#cAddGrade', host).onclick = gradeAddDialog;
      load();
    }
  });
})();
