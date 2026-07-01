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
      var activeGid = null, cPage = 0;

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
          b.onclick = function () { activeGid = g.id; cPage = 0; render(); };
          box.appendChild(b);
        });
      }

      function renderBody() {
        var body = $('#cBody', host); body.innerHTML = '';
        var g = data.grades.filter(function (x) { return x.id === activeGid; })[0];
        if (!g) { body.innerHTML = '<p style="color:var(--muted)">เลือกชั้นด้านบน หรือเพิ่มชั้นใหม่</p>'; return; }

        var PER = 10, pages = Math.max(1, Math.ceil(g.chapters.length / PER));
        if (cPage >= pages) cPage = pages - 1; if (cPage < 0) cPage = 0;
        var startIdx = cPage * PER;
        var shown = g.chapters.slice(startIdx, startIdx + PER);
        var rows = shown.map(function (c) {
          var label = (data.genTypes.filter(function (t) { return t.id === c.gen; })[0] || {}).label || c.gen;
          return '<tr>' +
            '<td><span style="margin-right:6px;color:var(--accent2)">' + iconHTML_(c.icon, 18) + '</span>' + esc(c.name) + (c.ops ? ' <span style="color:var(--muted);font-size:.8rem">[' + esc(c.ops) + ']</span>' : '') + '</td>' +
            '<td>' + esc(label) + '</td>' +
            '<td style="text-align:center">' + (c.enabled ? '<span style="color:var(--ok)">เปิด</span>' : '<span style="color:var(--muted)">ปิด</span>') + '</td>' +
            '<td style="text-align:center;white-space:nowrap">' +
              '<button class="btn btn-ghost cEdit" data-id="' + esc(c.id) + '" style="padding:.35rem .5rem"><i class="ti ti-edit"></i></button> ' +
              '<button class="btn btn-ghost cToggle" data-id="' + esc(c.id) + '" data-en="' + (c.enabled ? '1' : '0') + '" style="padding:.35rem .5rem"><i class="ti ' + (c.enabled ? 'ti-eye-off' : 'ti-eye') + '"></i></button> ' +
              '<button class="btn btn-ghost cDel" data-id="' + esc(c.id) + '" data-name="' + esc(c.name) + '" style="padding:.35rem .5rem;color:var(--bad)"><i class="ti ti-trash"></i></button>' +
            '</td></tr>';
        }).join('');
        var pager = pages > 1 ? '<div class="pager" style="display:flex">' +
          '<button class="pg-btn cPrev"' + (cPage === 0 ? ' disabled' : '') + '><i class="ti ti-chevron-left"></i></button>' +
          '<span class="pg-info">หน้า ' + (cPage + 1) + ' / ' + pages + ' (รวม ' + g.chapters.length + ' บท)</span>' +
          '<button class="pg-btn cNext"' + (cPage === pages - 1 ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button></div>' : '';

        body.innerHTML =
          '<div style="display:flex;align-items:center;margin-bottom:10px">' +
            '<div class="font-display" style="font-size:1.15rem;font-weight:700">' + esc(g.name) + '</div>' +
            '<button class="btn btn-ghost" id="cEditGrade" style="margin-left:12px;padding:.35rem .6rem"><i class="ti ti-edit"></i> แก้ชั้น</button>' +
            '<button class="btn btn-ghost" id="cDelGrade" style="padding:.35rem .6rem;color:var(--bad)"><i class="ti ti-trash"></i> ลบชั้น</button>' +
            '<button class="btn btn-accent" id="cAddChapter" style="margin-left:auto"><i class="ti ti-plus"></i> เพิ่มบทเรียน</button>' +
          '</div>' +
          '<div style="overflow:auto"><table class="adm"><thead><tr><th>บทเรียน</th><th>ชนิดโจทย์</th><th style="text-align:center">สถานะ</th><th style="text-align:center">จัดการ</th></tr></thead><tbody>' +
          (rows || '<tr><td colspan="4" style="color:var(--muted)">ยังไม่มีบทเรียนในชั้นนี้</td></tr>') +
          '</tbody></table></div>' + pager;

        $('#cAddChapter', body).onclick = function () { chapterDialog(g, null); };
        $('#cEditGrade', body).onclick = function () { gradeEditDialog(g); };
        $('#cDelGrade', body).onclick = function () { delGrade(g); };
        var prev = $('.cPrev', body), next = $('.cNext', body);
        if (prev) prev.onclick = function () { if (cPage > 0) { cPage--; renderBody(); } };
        if (next) next.onclick = function () { cPage++; renderBody(); };
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
      var ICONS_ = ['ti-plus','ti-minus','ti-x','ti-divide','ti-math-symbols','ti-equal','ti-percentage','ti-ruler-2','ti-clock','ti-coin','ti-shapes','ti-circle','ti-square','ti-triangle','ti-puzzle','ti-abacus','ti-calculator','ti-cards','ti-dice','ti-star','ti-apple','ti-pencil','ti-book','ti-school','ti-bulb','ti-trophy','ti-target','ti-clipboard-check','ti-message-2-question','ti-chart-bar','ti-photo','ti-numbers'];
      function isImg_(v) { return /^https?:\/\//.test(String(v || '')); }
      function iconHTML_(v, sz) { sz = sz || 22; return isImg_(v) ? '<img src="' + esc(v) + '" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:contain">' : '<i class="ti ' + esc(v || 'ti-file') + '"></i>'; }
      function chapterDialog(g, c) {
        var editing = !!c;
        var lvObj = {}; if (editing && c.lv) { try { lvObj = JSON.parse(c.lv); } catch (e) {} }
        var selPics = (lvObj.pics && lvObj.pics.slice()) || [];
        var selIcon = editing ? (c.icon || 'ti-file') : 'ti-file';
        var curGen = editing ? c.gen : (data.genTypes[0] && data.genTypes[0].id);
        var opsArr = (editing && c.ops) ? String(c.ops).split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
        var selPicOps = (curGen === 'picture' && opsArr.length) ? opsArr.slice() : ['+'];
        var selAr = (curGen === 'arith' && opsArr.length) ? opsArr.slice() : ['+'];
        var selCarry = lvObj.carry || 'any';
        var RANGES_ = [['0-20', '0–20'], ['1-20', '1–20'], ['10-20', '10–20'], ['21-100', '21–100'], ['1-100', '1–100'], ['1-200', '1–200'], ['100-200', '100–200'], ['201-1000', '201–1,000'], ['100-1000', '100–1,000']];
        var selRange = (lvObj.range && lvObj.range.join('-')) || (curGen === 'numwrite' ? '21-100' : ((curGen === 'expand' || curGen === 'evenodd') ? '100-1000' : '10-20'));
        var selColor = lvObj.color || 'orange';
        var selDir = lvObj.dir || 'asc';
        var selK = lvObj.k || 4;
        var selTmode = lvObj.mode || 'line';
        var selTstep = lvObj.step || 5;
        var selDim = lvObj.dim || '2d';
        var selPrec = lvObj.prec || 'half';
        var selWMode = lvObj.mode || 'mix';
        var selWStyle = lvObj.wstyle || 'full';
        var selExpMode = lvObj.mode || 'full';
        var selEoTarget = lvObj.target || 'even';
        var selEoLayout = lvObj.layout || 'row';
        var selPtStep = lvObj.step || 2;
        var selPtDir = lvObj.dir || 'mix';
        var selPtLayout = (curGen === 'pattern' ? (lvObj.layout || 'fill') : 'fill');
        var selCmpMode = lvObj.mode || 'two';
        var instr0 = lvObj.instruction || '';

        function tglBtns(list, sel, cls) {
          return list.map(function (o) {
            var on = sel.indexOf(o[0]) >= 0;
            return '<button type="button" class="' + cls + '" data-o="' + o[0] + '" style="padding:6px 12px;border-radius:8px;border:1px solid ' + (on ? '#6366f1' : '#2a3556') + ';background:' + (on ? 'rgba(99,102,241,.25)' : '#0b1120') + ';color:#e6ebf7;cursor:pointer">' + o[1] + '</button>';
          }).join('');
        }
        function iconBtns() {
          return ICONS_.map(function (ic) {
            var on = selIcon === ic;
            return '<button type="button" class="sw_ic" data-i="' + ic + '" style="width:38px;height:38px;border-radius:8px;border:1px solid ' + (on ? '#6366f1' : '#2a3556') + ';background:' + (on ? 'rgba(99,102,241,.25)' : '#0b1120') + ';color:#cdd6f4;font-size:18px;cursor:pointer"><i class="ti ' + ic + '"></i></button>';
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
              '<label style="font-size:.85rem;color:#9aa8c8">ไอคอน</label>' +
              '<div style="display:flex;align-items:center;gap:10px;margin:.3rem 0 .4rem"><span id="sw_icprev" style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,.16);display:inline-flex;align-items:center;justify-content:center;color:#a5b4fc;font-size:22px;flex:none"></span><span style="font-size:.8rem;color:#9aa8c8">กดเลือกไอคอน หรือวางลิงก์รูปของคุณเองด้านล่าง</span></div>' +
              '<div id="sw_icgrid" style="display:flex;flex-wrap:wrap;gap:6px;max-height:118px;overflow:auto;margin-bottom:.5rem">' + iconBtns() + '</div>' +
              '<input id="sw_icurl" style="' + INP + '" placeholder="วางลิงก์รูปไอคอนของคุณเอง https://...">' +
              '<label style="font-size:.85rem;color:#9aa8c8">ชนิดโจทย์</label>' +
              '<select id="sw_cg" style="' + INP + '">' + genOptions(curGen) + '</select>' +
              '<div id="sw_arithWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">การดำเนินการ (เลือกได้หลายอย่าง)</label>' +
                '<div id="sw_ar" style="display:flex;flex-wrap:wrap;gap:8px;margin:.35rem 0 .4rem">' + tglBtns(AR_, selAr, 'sw_arop') + '</div>' +
                '<label style="font-size:.85rem;color:#9aa8c8">การทด / การยืม</label>' +
                '<select id="sw_carry" style="' + INP + '">' +
                  '<option value="any"' + (selCarry === 'any' ? ' selected' : '') + '>คละ (มีทั้งทด/ยืม และไม่ทด/ไม่ยืม)</option>' +
                  '<option value="no"' + (selCarry === 'no' ? ' selected' : '') + '>ไม่ทด / ไม่ยืม</option>' +
                  '<option value="yes"' + (selCarry === 'yes' ? ' selected' : '') + '>มีทด / มียืม</option>' +
                '</select>' +
                '<div style="font-size:.78rem;color:#9aa8c8;margin-top:.2rem">ใช้กับบวก/ลบ (ทด = ผลรวมหลักเกิน 10, ยืม = ตัวตั้งหลักน้อยกว่าตัวลบ)</div>' +
              '</div>' +
              '<div id="sw_picWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">เลือกรูปภาพที่จะใช้ (เลือกได้หลายรูป)</label>' +
                '<div id="sw_pics" style="display:flex;flex-wrap:wrap;gap:6px;margin:.35rem 0 .7rem">' + picBtns() + '</div>' +
                '<label style="font-size:.85rem;color:#9aa8c8">การดำเนินการ</label>' +
                '<div id="sw_pop" style="display:flex;gap:8px;margin:.35rem 0 .7rem">' + tglBtns(POP_, selPicOps, 'sw_pop_b') + '</div>' +
                '<label style="font-size:.85rem;color:#9aa8c8">คำชี้แจง</label>' +
                '<input id="sw_instr" style="' + INP + '" value="' + esc(instr0) + '" placeholder="เช่น นับจำนวนสิ่งของในแต่ละกลุ่ม แล้วหาผลรวม">' +
              '</div>' +
              '<div id="sw_rangeWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">ช่วงตัวเลขที่ใช้เปรียบเทียบ</label>' +
                '<select id="sw_range" style="' + INP + '">' + RANGES_.map(function (r) { return '<option value="' + r[0] + '"' + (selRange === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select>' +
              '</div>' +
              '<div id="sw_colorWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">สีแท่งฐานสิบ</label>' +
                '<select id="sw_color" style="' + INP + '">' +
                  '<option value="mix"' + (selColor === 'mix' ? ' selected' : '') + '>คละสี</option>' +
                  '<option value="orange"' + (selColor === 'orange' ? ' selected' : '') + '>ส้ม</option>' +
                  '<option value="blue"' + (selColor === 'blue' ? ' selected' : '') + '>ฟ้า</option>' +
                  '<option value="green"' + (selColor === 'green' ? ' selected' : '') + '>เขียว</option>' +
                  '<option value="pink"' + (selColor === 'pink' ? ' selected' : '') + '>ชมพู</option>' +
                  '<option value="purple"' + (selColor === 'purple' ? ' selected' : '') + '>ม่วง</option>' +
                  '<option value="yellow"' + (selColor === 'yellow' ? ' selected' : '') + '>เหลือง</option>' +
                '</select>' +
              '</div>' +
              '<div id="sw_dirWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">ทิศทางการเรียง</label>' +
                '<select id="sw_dir" style="' + INP + '">' +
                  '<option value="asc"' + (selDir === 'asc' ? ' selected' : '') + '>น้อย → มาก</option>' +
                  '<option value="desc"' + (selDir === 'desc' ? ' selected' : '') + '>มาก → น้อย</option>' +
                  '<option value="mix"' + (selDir === 'mix' ? ' selected' : '') + '>คละ (สุ่มทิศแต่ละข้อ)</option>' +
                '</select>' +
                '<label style="font-size:.85rem;color:#9aa8c8">จำนวนตัวเลขต่อข้อ</label>' +
                '<select id="sw_k" style="' + INP + '">' +
                  [3, 4, 5, 6].map(function (kk) { return '<option value="' + kk + '"' + (selK === kk ? ' selected' : '') + '>' + kk + ' จำนวน</option>'; }).join('') +
                '</select>' +
              '</div>' +
              '<div id="sw_timeWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">รูปแบบโจทย์เวลา</label>' +
                '<select id="sw_tmode" style="' + INP + '">' +
                  '<option value="line"' + (selTmode === 'line' ? ' selected' : '') + '>กลางวัน/กลางคืน (เส้นให้เขียน)</option>' +
                  '<option value="box"' + (selTmode === 'box' ? ' selected' : '') + '>กลางวัน/กลางคืน (กล่อง ☀️🌙)</option>' +
                  '<option value="tell"' + (selTmode === 'tell' ? ' selected' : '') + '>บอกเวลาอย่างเดียว</option>' +
                '</select>' +
                '<label style="font-size:.85rem;color:#9aa8c8">ความละเอียดเวลา</label>' +
                '<select id="sw_tstep" style="' + INP + '">' +
                  '<option value="30"' + (selTstep === 30 ? ' selected' : '') + '>ชั่วโมง / ครึ่งชั่วโมง</option>' +
                  '<option value="5"' + (selTstep === 5 ? ' selected' : '') + '>ทุก 5 นาที</option>' +
                  '<option value="1"' + (selTstep === 1 ? ' selected' : '') + '>ทุก 1 นาที</option>' +
                '</select>' +
              '</div>' +
              '<div id="sw_geoWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">ชนิดรูปเรขาคณิต</label>' +
                '<select id="sw_dim" style="' + INP + '">' +
                  '<option value="2d"' + (selDim === '2d' ? ' selected' : '') + '>2 มิติ (สี่เหลี่ยม สามเหลี่ยม วงกลม วงรี)</option>' +
                  '<option value="3d"' + (selDim === '3d' ? ' selected' : '') + '>3 มิติ (ทรงสี่เหลี่ยม ทรงกลม ทรงกระบอก กรวย)</option>' +
                '</select>' +
                '<div style="font-size:.8rem;color:#9aa8c8;margin-top:.3rem">รูปจะกระจายเต็มหน้า A4 ค่า "จำนวนข้อ" = จำนวนรูปในหน้า</div>' +
              '</div>' +
              '<div id="sw_mlWrap" style="display:none">' +
                '<div style="font-size:.82rem;color:#9aa8c8">ใบงานเต็มหน้า มีไม้บรรทัด + ของวัด 5 ชิ้น (สุ่มจาก 14 ชนิด) ตอบเป็นเซนติเมตร</div>' +
              '</div>' +
              '<div id="sw_weighWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">รูปแบบโจทย์</label>' +
                '<select id="sw_wmode" style="' + INP + '">' +
                  '<option value="mix"' + (selWMode === 'mix' ? ' selected' : '') + '>ผสม (อ่านน้ำหนัก + วาดเข็ม)</option>' +
                  '<option value="read"' + (selWMode === 'read' ? ' selected' : '') + '>อ่านน้ำหนักจากหน้าปัด</option>' +
                  '<option value="draw"' + (selWMode === 'draw' ? ' selected' : '') + '>วาดเข็มชี้ตามน้ำหนักที่กำหนด</option>' +
                '</select>' +
                '<div style="font-size:.8rem;color:#9aa8c8;margin-top:.3rem">หน้าปัดตาชั่ง 0–5 (หน่วยขีด) เข็มแดง สุ่มน้ำหนักทุกข้อ</div>' +
              '</div>' +
              '<div id="sw_wordWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">รูปแบบโจทย์ปัญหา</label>' +
                '<select id="sw_wstyle" style="' + INP + '">' +
                  '<option value="full"' + (selWStyle === 'full' ? ' selected' : '') + '>เต็มรูปแบบ (โจทย์ถาม/โจทย์บอก/ประโยคสัญลักษณ์/ตอบ)</option>' +
                  '<option value="compact"' + (selWStyle === 'compact' ? ' selected' : '') + '>แบบย่อ (ประโยคสัญลักษณ์/ตอบ)</option>' +
                  '<option value="plain"' + (selWStyle === 'plain' ? ' selected' : '') + '>แบบธรรมดา (โจทย์ + ตอบ)</option>' +
                '</select>' +
                '<div style="font-size:.8rem;color:#9aa8c8;margin-top:.3rem">โจทย์บวก-ลบหลากหลาย (เก็บผลไม้ ใช้จ่าย ให้เพื่อน เปรียบเทียบ ฯลฯ) สุ่มทุกข้อ</div>' +
              '</div>' +
              '<div id="sw_expandWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">รูปแบบโจทย์ค่าประจำหลัก / การกระจาย</label>' +
                '<select id="sw_expmode" style="' + INP + '">' +
                  '<option value="value"' + (selExpMode === 'value' ? ' selected' : '') + '>เลขโดดให้มา → หาค่าประจำหลัก</option>' +
                  '<option value="full"' + (selExpMode === 'full' ? ' selected' : '') + '>เติมเลขโดด + ค่า + เขียนกระจาย</option>' +
                  '<option value="expand"' + (selExpMode === 'expand' ? ' selected' : '') + '>เขียนในรูปกระจายอย่างเดียว</option>' +
                  '<option value="mix"' + (selExpMode === 'mix' ? ' selected' : '') + '>คละ (หาค่า + เติมเต็ม)</option>' +
                '</select>' +
                '<div style="font-size:.8rem;color:#9aa8c8;margin-top:.3rem">เลือก "ช่วงตัวเลข" ด้านบนเป็น 100–1,000 สำหรับ 3 หลัก · พิมพ์เลือก 2 คอลัมน์ได้</div>' +
              '</div>' +
              '<div id="sw_compareWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">รูปแบบการเปรียบเทียบ</label>' +
                '<select id="sw_cmpmode" style="' + INP + '">' +
                  '<option value="two"' + (selCmpMode === 'two' ? ' selected' : '') + '>2 จำนวน (A ⬚ B)</option>' +
                  '<option value="three"' + (selCmpMode === 'three' ? ' selected' : '') + '>3 จำนวน (A ⬚ B ⬚ C)</option>' +
                '</select>' +
                '<div style="font-size:.8rem;color:#9aa8c8;margin-top:.3rem">เติมเครื่องหมาย &gt; &lt; = · ทุกโหมดมีโอกาสเจอ = (เท่ากัน)</div>' +
              '</div>' +
              '<div id="sw_evenoddWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">เป้าหมาย</label>' +
                '<select id="sw_eotarget" style="' + INP + '">' +
                  '<option value="even"' + (selEoTarget === 'even' ? ' selected' : '') + '>จำนวนคู่</option>' +
                  '<option value="odd"' + (selEoTarget === 'odd' ? ' selected' : '') + '>จำนวนคี่</option>' +
                  '<option value="mix"' + (selEoTarget === 'mix' ? ' selected' : '') + '>คละ คู่/คี่ (มีป้ายบอกแต่ละข้อ)</option>' +
                '</select>' +
                '<label style="font-size:.85rem;color:#9aa8c8;margin-top:.4rem;display:block">รูปแบบใบงาน</label>' +
                '<select id="sw_eolayout" style="' + INP + '">' +
                  '<option value="row"' + (selEoLayout === 'row' ? ' selected' : '') + '>แถวพิลล์ — วงรอบ</option>' +
                  '<option value="grid"' + (selEoLayout === 'grid' ? ' selected' : '') + '>ตารางกริด 4×4 — เขียน ✗ ทับ</option>' +
                '</select>' +
                '<div style="font-size:.8rem;color:#9aa8c8;margin-top:.3rem">เลือก "ช่วงตัวเลข" ด้านบน · แนะนำพิมพ์แบบ 1 คอลัมน์</div>' +
              '</div>' +
              '<div id="sw_patternWrap" style="display:none">' +
                '<label style="font-size:.85rem;color:#9aa8c8">ผลต่าง (เพิ่ม/ลด ทีละ)</label>' +
                '<select id="sw_ptstep" style="' + INP + '">' +
                  [2, 3, 5, 10, 20, 25, 100].map(function (s) { return '<option value="' + s + '"' + (Number(selPtStep) === s ? ' selected' : '') + '>ทีละ ' + s + '</option>'; }).join('') +
                '</select>' +
                '<label style="font-size:.85rem;color:#9aa8c8;margin-top:.4rem;display:block">ทิศทาง (เฉพาะแบบเติมช่องว่าง)</label>' +
                '<select id="sw_ptdir" style="' + INP + '">' +
                  '<option value="up"' + (selPtDir === 'up' ? ' selected' : '') + '>เพิ่มขึ้น</option>' +
                  '<option value="down"' + (selPtDir === 'down' ? ' selected' : '') + '>ลดลง</option>' +
                  '<option value="mix"' + (selPtDir === 'mix' ? ' selected' : '') + '>คละ เพิ่ม/ลด</option>' +
                '</select>' +
                '<label style="font-size:.85rem;color:#9aa8c8;margin-top:.4rem;display:block">รูปแบบใบงาน</label>' +
                '<select id="sw_ptlayout" style="' + INP + '">' +
                  '<option value="fill"' + (selPtLayout === 'fill' ? ' selected' : '') + '>เติมจำนวนที่หายไป + บอกแบบรูป</option>' +
                  '<option value="mark"' + (selPtLayout === 'mark' ? ' selected' : '') + '>เขียน ✓ / ✗ ว่าเพิ่มหรือลดทีละที่กำหนด</option>' +
                '</select>' +
                '<div style="font-size:.8rem;color:#9aa8c8;margin-top:.3rem">เลือก "ช่วงตัวเลข" ด้านบน · แบบมาร์กจะมีทั้งเพิ่ม/ลด/ไม่ใช่ ปนกัน · แนะนำพิมพ์ 1 คอลัมน์</div>' +
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
              document.getElementById('sw_rangeWrap').style.display = (v === 'compare' || v === 'numwrite' || v === 'order' || v === 'expand' || v === 'evenodd' || v === 'pattern') ? 'block' : 'none';
              document.getElementById('sw_colorWrap').style.display = v === 'numwrite' ? 'block' : 'none';
              document.getElementById('sw_dirWrap').style.display = v === 'order' ? 'block' : 'none';
              document.getElementById('sw_timeWrap').style.display = v === 'time' ? 'block' : 'none';
              document.getElementById('sw_geoWrap').style.display = v === 'geometry' ? 'block' : 'none';
              document.getElementById('sw_mlWrap').style.display = v === 'measlen' ? 'block' : 'none';
              document.getElementById('sw_weighWrap').style.display = v === 'weigh' ? 'block' : 'none';
              document.getElementById('sw_wordWrap').style.display = v === 'word' ? 'block' : 'none';
              document.getElementById('sw_expandWrap').style.display = v === 'expand' ? 'block' : 'none';
              document.getElementById('sw_compareWrap').style.display = v === 'compare' ? 'block' : 'none';
              document.getElementById('sw_evenoddWrap').style.display = v === 'evenodd' ? 'block' : 'none';
              document.getElementById('sw_patternWrap').style.display = v === 'pattern' ? 'block' : 'none';
              document.getElementById('sw_noOps').style.display = (v === 'arith' || v === 'picture' || v === 'compare' || v === 'numwrite' || v === 'order' || v === 'time' || v === 'geometry' || v === 'measlen' || v === 'weigh' || v === 'word' || v === 'expand' || v === 'evenodd' || v === 'pattern') ? 'none' : 'block';
            }
            sel.addEventListener('change', toggle); toggle();
            var icurl = document.getElementById('sw_icurl');
            if (isImg_(selIcon)) icurl.value = selIcon;
            function renderPrev() { document.getElementById('sw_icprev').innerHTML = isImg_(selIcon) ? '<img src="' + selIcon + '" style="width:30px;height:30px;object-fit:contain">' : '<i class="ti ' + (selIcon || 'ti-file') + '"></i>'; }
            function clearGrid() { Array.prototype.forEach.call(document.querySelectorAll('#sw_icgrid .sw_ic'), function (x) { var on = x.getAttribute('data-i') === selIcon; x.style.borderColor = on ? '#6366f1' : '#2a3556'; x.style.background = on ? 'rgba(99,102,241,.25)' : '#0b1120'; }); }
            renderPrev();
            document.getElementById('sw_icgrid').addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('.sw_ic') : null; if (!b) return; selIcon = b.getAttribute('data-i'); icurl.value = ''; clearGrid(); renderPrev(); });
            icurl.addEventListener('input', function () { var v = this.value.trim(); if (isImg_(v)) { selIcon = v; } else if (!v) { selIcon = 'ti-file'; } clearGrid(); renderPrev(); });
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
            var icurlv = (document.getElementById('sw_icurl').value || '').trim();
            var icon = isImg_(icurlv) ? icurlv : (selIcon || 'ti-file');
            if (gen === 'picture') {
              if (!selPics.length) { window.Swal.showValidationMessage('เลือกรูปอย่างน้อย 1 รูป'); return false; }
              if (!selPicOps.length) { window.Swal.showValidationMessage('เลือกการดำเนินการอย่างน้อย 1 อย่าง'); return false; }
              return { picture: true, chapterName: name, icon: icon, gen: gen, ops: selPicOps.join(','), lv: { pics: selPics.slice(), instruction: (document.getElementById('sw_instr').value || '').trim() } };
            }
            if (gen === 'arith') {
              if (!selAr.length) { window.Swal.showValidationMessage('เลือกการดำเนินการอย่างน้อย 1 อย่าง'); return false; }
              var cv = document.getElementById('sw_carry').value || 'any';
              lvObj.carry = cv;
              return { chapterName: name, icon: icon, gen: gen, ops: selAr.join(','), lv: lvObj, hasLv: true };
            }
            if (gen === 'compare' || gen === 'numwrite') {
              var rr = (document.getElementById('sw_range').value || (gen === 'numwrite' ? '21-100' : '10-20')).split('-').map(Number);
              lvObj.range = rr;
              if (gen === 'numwrite') lvObj.color = document.getElementById('sw_color').value || 'orange';
              if (gen === 'compare') lvObj.mode = document.getElementById('sw_cmpmode').value || 'two';
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: lvObj, hasLv: true };
            }
            if (gen === 'order') {
              var orr = (document.getElementById('sw_range').value || '10-20').split('-').map(Number);
              lvObj.range = orr;
              lvObj.dir = document.getElementById('sw_dir').value || 'asc';
              lvObj.k = +document.getElementById('sw_k').value || 4;
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: lvObj, hasLv: true };
            }
            if (gen === 'time') {
              lvObj.mode = document.getElementById('sw_tmode').value || 'line';
              lvObj.step = +document.getElementById('sw_tstep').value || 5;
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: lvObj, hasLv: true };
            }
            if (gen === 'geometry') {
              lvObj.dim = document.getElementById('sw_dim').value || '2d';
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: lvObj, hasLv: true };
            }
            if (gen === 'measlen') {
              return { chapterName: name, icon: icon, gen: gen, ops: '' };
            }
            if (gen === 'weigh') {
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: { mode: document.getElementById('sw_wmode').value || 'mix' }, hasLv: true };
            }
            if (gen === 'word') {
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: { wstyle: document.getElementById('sw_wstyle').value || 'full' }, hasLv: true };
            }
            if (gen === 'expand') {
              var er = (document.getElementById('sw_range').value || '100-1000').split('-').map(Number);
              lvObj.range = er;
              lvObj.mode = document.getElementById('sw_expmode').value || 'full';
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: lvObj, hasLv: true };
            }
            if (gen === 'evenodd') {
              var eor = (document.getElementById('sw_range').value || '100-1000').split('-').map(Number);
              lvObj.range = eor;
              lvObj.target = document.getElementById('sw_eotarget').value || 'even';
              lvObj.layout = document.getElementById('sw_eolayout').value || 'row';
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: lvObj, hasLv: true };
            }
            if (gen === 'pattern') {
              var pr = (document.getElementById('sw_range').value || '100-1000').split('-').map(Number);
              lvObj.range = pr;
              lvObj.step = Number(document.getElementById('sw_ptstep').value) || 2;
              lvObj.dir = document.getElementById('sw_ptdir').value || 'mix';
              lvObj.layout = document.getElementById('sw_ptlayout').value || 'fill';
              return { chapterName: name, icon: icon, gen: gen, ops: '', lv: lvObj, hasLv: true };
            }
            return { chapterName: name, icon: icon, gen: gen, ops: '' };
          }
        }, svc.swalDark)).then(function (r) {
          if (!r.isConfirmed) return;
          var p = r.value;
          var payload = editing ? { chapterId: c.id } : { gradeId: g.id };
          payload.chapterName = p.chapterName; payload.icon = p.icon; payload.gen = p.gen; payload.ops = p.ops;
          if (p.picture || p.hasLv) payload.lv = p.lv;
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
