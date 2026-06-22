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
  if (action === 'listPublicExams') return jsonOut_(ok_(listPublicExams_()));
  if (action === 'lessonList') return jsonOut_(ok_(lessonList_(e.parameter.token || '')));
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
      case 'bumpView':     data = bumpView_(body); break;
      case 'publicBootstrap': data = publicBootstrap_(); break;
      case 'login':        data = login_(body.username, body.password); break;
      case 'changePassword': data = changePassword_(token, body); break;
      case 'register':       data = registerUser_(body); break;
      case 'listUsers':      data = listUsers_(token); break;
      case 'addUser':        data = addUser_(token, body); break;
      case 'updateUser':     data = updateUser_(token, body); break;
      case 'resetUserPassword': data = resetUserPassword_(token, body); break;
      case 'deleteUser':     data = deleteUser_(token, body); break;
      case 'saveScore':      data = saveScore_(token, body); break;
      case 'listScores':     data = listScores_(token); break;
      case 'adminCurriculum': data = adminCurriculum_(token); break;
      case 'addChapter':     data = addChapter_(token, body); break;
      case 'updateChapter':  data = updateChapter_(token, body); break;
      case 'deleteChapter':  data = deleteChapter_(token, body); break;
      case 'updateGrade':    data = updateGrade_(token, body); break;
      case 'deleteGrade':    data = deleteGrade_(token, body); break;
      case 'bootstrap':    data = bootstrap_(token); break;
      case 'generate':     data = generateExam_(token, body); break;
      case 'quizGen':      data = quizGen_(token, body); break;
      case 'saveExam':     data = saveExam_(token, body); break;
      case 'listExams':    data = listExams_(token); break;
      case 'deleteExam':   data = deleteExam_(token, body); break;
      case 'togglePlugin': data = togglePlugin_(token, body); break;
      case 'deletePlugin': data = deletePlugin_(token, body); break;
      case 'restorePlugin': data = restorePlugin_(token, body); break;
      case 'updatePlugin': data = updatePlugin_(token, body); break;
      case 'listAllPlugins': data = listAllPlugins_(token); break;
      case 'publishExam':    data = publishExam_(token, body); break;
      case 'listPublicExams': data = listPublicExams_(); break;
      case 'unpublishExam':  data = unpublishExam_(token, body); break;
      case 'saveSettings': data = saveSettings_(token, body); break;
      case 'adminStats':   data = adminStats_(token); break;
      case 'lessonList':   data = lessonList_(token); break;
      case 'lessonSave':   data = lessonSave_(token, body); break;
      case 'lessonDelete': data = lessonDelete_(token, body); break;
      case 'lessonToggle': data = lessonToggle_(token, body); break;
      default: return jsonOut_(err_('\u0e44\u0e21\u0e48\u0e23\u0e39\u0e49\u0e08\u0e31\u0e01 action: ' + action));
    }
    return jsonOut_(ok_(data));
  } catch (ex) {
    return jsonOut_(err_(ex));
  }
}
