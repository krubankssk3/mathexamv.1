/*** EduForge — Router.gs ***************************************************
 * จุดเข้าออกของ Web App : doGet (ทดสอบ/ping) และ doPost (ทุก action)
 * Frontend เรียกแบบ POST Content-Type: text/plain เพื่อเลี่ยง CORS preflight
 ***************************************************************************/

function doGet(e) {
  // เปิด /exec ในเบราว์เซอร์เพื่อเช็คว่า deploy แล้วใช้งานได้
  var action = e && e.parameter && e.parameter.action;
  if (action === 'ping') return jsonOut_(ok_({ pong: true, time: new Date() }));
  if (action === 'publicStats') return jsonOut_(ok_(publicStats_()));
  if (action === 'publicBootstrap') return jsonOut_(ok_(publicBootstrap_()));
  return jsonOut_(ok_({ name: 'EduForge API', status: 'running' }));
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return jsonOut_(err_('payload \u0e44\u0e21\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07')); }

  var action = body.action;
  var token = body.token || '';
  try {
    var data;
    switch (action) {
      case 'ping':         data = { pong: true }; break;
      case 'publicStats':  data = publicStats_(); break;
      case 'publicBootstrap': data = publicBootstrap_(); break;
      case 'login':        data = login_(body.username, body.password); break;
      case 'bootstrap':    data = bootstrap_(token); break;
      case 'generate':     data = generateExam_(token, body); break;
      case 'quizGen':      data = quizGen_(token, body); break;
      case 'saveExam':     data = saveExam_(token, body); break;
      case 'listExams':    data = listExams_(token); break;
      case 'deleteExam':   data = deleteExam_(token, body); break;
      case 'togglePlugin': data = togglePlugin_(token, body); break;
      case 'deletePlugin': data = deletePlugin_(token, body); break;
      case 'saveSettings': data = saveSettings_(token, body); break;
      case 'adminStats':   data = adminStats_(token); break;
      default: return jsonOut_(err_('\u0e44\u0e21\u0e48\u0e23\u0e39\u0e49\u0e08\u0e31\u0e01 action: ' + action));
    }
    return jsonOut_(ok_(data));
  } catch (ex) {
    return jsonOut_(err_(ex));
  }
}
