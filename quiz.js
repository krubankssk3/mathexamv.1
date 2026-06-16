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
      var st = { chapterId: chapters[0] && chapters[0].id, level: 'easy', count: 8, items: [], answers: [], checked: false, busy: false };

      host.innerHTML =
        '<div class="panel" style="padding:18px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:14px;align-items:end">' +
          '<div style="min-width:220px"><label class="lbl">เลือกบทเรียน</label><select id="subj" class="field" style="margin-top:5px"></select></div>' +
          '<div><label class="lbl">ระดับ</label><div class="seg" id="lv" style="margin-top:5px"><button data-l="easy" class="on">ง่าย</button><button data-l="medium">กลาง</button><button data-l="hard">ยาก</button></div></div>' +
          '<div style="width:110px"><label class="lbl">จำนวนข้อ</label><input id="cnt" type="number" min="4" max="20" value="8" class="field mono" style="margin-top:5px"></div>' +
          '<button class="btn btn-accent" id="start"><i class="ti ti-player-play"></i> เริ่มทำแบบทดสอบ</button>' +
          '<div class="chip" id="score" style="margin-left:auto;display:none"></div>' +
        '</div>' +
        '<div id="quizArea"></div>' +
        '<div id="quizFoot" style="display:none;gap:10px;margin-top:6px" class="flex">' +
          '<button class="btn btn-accent" id="check"><i class="ti ti-checkbox"></i> ตรวจคำตอบ</button>' +
          '<button class="btn btn-ghost" id="again"><i class="ti ti-refresh"></i> ทำชุดใหม่</button>' +
        '</div>';

      var sel = $('#subj', host);
      chapters.forEach(function (c) { var o = document.createElement('option'); o.value = c.id; o.textContent = c.label; sel.appendChild(o); });
      sel.onchange = function () { st.chapterId = sel.value; };
      $$('#lv button', host).forEach(function (b) { b.onclick = function () { $$('#lv button', host).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); st.level = b.dataset.l; }; });
      $('#cnt', host).oninput = function (e) { st.count = Math.max(4, Math.min(20, +e.target.value || 8)); };

      function build() {
        if (st.busy) return; st.busy = true;
        svc.api('quizGen', { chapterId: st.chapterId, level: st.level, count: st.count })
          .then(function (res) {
            st.items = res.items; st.answers = new Array(res.items.length).fill(-1); st.checked = false;
            $('#score', host).style.display = 'none'; $('#quizFoot', host).style.display = 'flex'; render();
          })
          .catch(function (e) { svc.toast('error', String(e.message || e)); })
          .then(function () { st.busy = false; });
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
      $('#check', host).onclick = function () {
        if (st.answers.indexOf(-1) >= 0) { svc.toast('warning', 'ยังตอบไม่ครบทุกข้อ'); return; }
        st.checked = true; render();
        var correct = st.items.filter(function (it, i) { return st.answers[i] === it.correct; }).length;
        var pct = Math.round(correct / st.items.length * 100);
        $('#score', host).style.display = ''; $('#score', host).innerHTML = '<i class="ti ti-trophy"></i> ' + correct + '/' + st.items.length + ' (' + pct + '%)';
        svc.swal.fire(Object.assign({ icon: pct >= 80 ? 'success' : (pct >= 50 ? 'info' : 'warning'), title: 'ได้ ' + correct + '/' + st.items.length + ' คะแนน', text: pct >= 80 ? 'เยี่ยมมาก!' : (pct >= 50 ? 'ทำได้ดี ลองทบทวนอีกนิด' : 'ลองฝึกเพิ่มนะ'), confirmButtonColor: '#6366f1' }, svc.swalDark));
      };

      build();
    }
  });
})();
