/*** EduForge plugin — ทดสอบออนไลน์ (quiz) ******************************/
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.Platform.register({
    id: 'quiz',
    mount: function (host, svc) {
      var CUR = svc.curriculum;
      // รวมทุกบทเป็นรายการเดียวให้เลือก
      var chapters = [];
      CUR.grades.forEach(function (g) { g.chapters.forEach(function (c) { chapters.push({ id: c.id, label: g.name + ' · ' + c.name }); }); });
      var st = { chapterId: chapters[0] && chapters[0].id, chapterLabel: chapters[0] && chapters[0].label, level: 'easy', count: 8, items: [], answers: [], checked: false, busy: false };
      var loggedIn = svc.user && svc.user.role !== 'public';

      host.innerHTML =
        '<div class="panel" style="padding:18px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:14px;align-items:end">' +
          '<div style="min-width:220px"><label class="lbl">เลือกบทเรียน</label><select id="subj" class="field" style="margin-top:5px"></select></div>' +
          '<div><label class="lbl">ระดับ</label><div class="seg" id="lv" style="margin-top:5px"><button data-l="easy" class="on">ง่าย</button><button data-l="medium">กลาง</button><button data-l="hard">ยาก</button></div></div>' +
          '<div style="width:110px"><label class="lbl">จำนวนข้อ</label><input id="cnt" type="number" min="4" max="20" value="8" class="field mono" style="margin-top:5px"></div>' +
          '<button class="btn btn-accent" id="start"><i class="ti ti-player-play"></i> เริ่มทำแบบทดสอบ</button>' +
          (loggedIn ? '<button class="btn btn-ghost" id="history"><i class="ti ti-history"></i> ประวัติคะแนน</button>' : '') +
          '<div class="chip" id="score" style="margin-left:auto;display:none"></div>' +
        '</div>' +
        '<div id="quizArea"></div>' +
        '<div id="quizFoot" style="display:none;gap:10px;margin-top:6px" class="flex">' +
          '<button class="btn btn-accent" id="check"><i class="ti ti-checkbox"></i> ตรวจคำตอบ</button>' +
          '<button class="btn btn-ghost" id="again"><i class="ti ti-refresh"></i> ทำชุดใหม่</button>' +
        '</div>';

      var sel = $('#subj', host);
      chapters.forEach(function (c) { var o = document.createElement('option'); o.value = c.id; o.textContent = c.label; sel.appendChild(o); });
      sel.onchange = function () { st.chapterId = sel.value; st.chapterLabel = sel.options[sel.selectedIndex].text; };
      $$('#lv button', host).forEach(function (b) { b.onclick = function () { $$('#lv button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.level = b.dataset.l; }; });
      $('#cnt', host).oninput = function (e) { st.count = Math.max(4, Math.min(20, +e.target.value || 8)); };

      function build() {
        var ch = null;
        svc.curriculum.grades.forEach(function (g) { g.chapters.forEach(function (c) { if (c.id === st.chapterId) ch = c; }); });
        var res = svc.genQuiz(ch, st.level, st.count);
        st.items = res.items; st.answers = new Array(res.items.length).fill(-1); st.checked = false;
        $('#score', host).style.display = 'none'; $('#quizFoot', host).style.display = 'flex'; render();
      }
      function render() {
        var area = $('#quizArea', host), L = ['ก', 'ข', 'ค', 'ง'];
        area.innerHTML = st.items.map(function (it, qi) {
          var opts = it.choices.map(function (c, ci) {
            var cls = 'opt';
            if (st.checked) { if (ci === it.correct) cls += ' correct'; else if (st.answers[qi] === ci) cls += ' wrong'; }
            else if (st.answers[qi] === ci) cls += ' sel';
            return '<div class="' + cls + '" data-q="' + qi + '" data-c="' + ci + '"><span class="k">' + L[ci] + '</span><span>' + c + '</span></div>';
          }).join('');
          return '<div class="qcard"><div style="display:flex;gap:8px"><span class="mono" style="color:var(--accent);font-weight:600">' + (qi + 1) + '.</span><div style="flex:1"><div style="font-size:1.02rem">' + it.q + '</div><div>' + opts + '</div></div></div></div>';
        }).join('');
        if (!st.checked) $$('.opt', area).forEach(function (o) { o.onclick = function () { st.answers[+o.dataset.q] = +o.dataset.c; render(); }; });
      }

      $('#start', host).onclick = build;
      $('#again', host).onclick = build;
      if (loggedIn) $('#history', host).onclick = function () {
        svc.loading('กำลังโหลดประวัติ...');
        svc.api('listScores').then(function (list) {
          svc.done();
          var rows = list.slice(0, 30).map(function (s) {
            var pct = s.total ? Math.round(s.score / s.total * 100) : 0;
            var d = s.createdAt ? new Date(s.createdAt).toLocaleDateString('th-TH') : '';
            return '<tr><td style="padding:4px 8px">' + (s.displayName || s.username || '') + '</td><td style="padding:4px 8px">' + (s.chapter || '') + '</td><td style="padding:4px 8px;text-align:center">' + s.score + '/' + s.total + ' (' + pct + '%)</td><td style="padding:4px 8px;color:#9aa8c8;font-size:.8rem">' + d + '</td></tr>';
          }).join('');
          svc.swal.fire(Object.assign({
            title: 'ประวัติคะแนน', width: 640,
            html: list.length ? '<div style="max-height:50vh;overflow:auto"><table style="width:100%;font-size:.88rem;border-collapse:collapse"><thead><tr style="color:#8b97b8"><th style="padding:4px 8px;text-align:left">ผู้ทำ</th><th style="padding:4px 8px;text-align:left">บท</th><th style="padding:4px 8px">คะแนน</th><th style="padding:4px 8px;text-align:left">วันที่</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p>ยังไม่มีประวัติคะแนน</p>',
            confirmButtonText: 'ปิด', confirmButtonColor: '#6366f1'
          }, svc.swalDark));
        }).catch(function (e) { svc.done(); svc.toast('error', String(e.message || e)); });
      };
      $('#check', host).onclick = function () {
        if (st.answers.indexOf(-1) >= 0) { svc.toast('warning', 'ยังตอบไม่ครบทุกข้อ'); return; }
        st.checked = true; render();
        var correct = st.items.filter(function (it, i) { return st.answers[i] === it.correct; }).length;
        var pct = Math.round(correct / st.items.length * 100);
        $('#score', host).style.display = ''; $('#score', host).innerHTML = '<i class="ti ti-trophy"></i> ' + correct + '/' + st.items.length + ' (' + pct + '%)';
        if (loggedIn) svc.api('saveScore', { chapter: st.chapterLabel, level: st.level, score: correct, total: st.items.length }).catch(function () {});
        svc.swal.fire(Object.assign({ icon: pct >= 80 ? 'success' : (pct >= 50 ? 'info' : 'warning'), title: 'ได้ ' + correct + '/' + st.items.length + ' คะแนน', text: (pct >= 80 ? 'เยี่ยมมาก!' : (pct >= 50 ? 'ทำได้ดี ลองทบทวนอีกนิด' : 'ลองฝึกเพิ่มนะ')) + (loggedIn ? ' (บันทึกคะแนนแล้ว)' : ''), confirmButtonColor: '#6366f1' }, svc.swalDark));
      };

      build();
    }
  });
})();
