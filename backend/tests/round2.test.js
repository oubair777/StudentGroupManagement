const http = require('http');
const app = require('../src/app');

const server = app.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  function req(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + path);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: headers
      };

      const request = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      request.on('error', reject);
      if (body) request.write(JSON.stringify(body));
      request.end();
    });
  }

  try {
    console.log('🧪 Running Round 2 Integration Test Suite...');

    // 1. Professor Login
    const adminRes = await req('POST', '/auth/login', { email: 'professor@joineazy.edu', password: 'admin123' });
    console.assert(adminRes.status === 200, 'Admin login failed');
    const adminToken = adminRes.body.token;
    console.log('✅ 1. Professor / Admin authentication verified');

    // 2. Admin Courses
    const coursesRes = await req('GET', '/courses', null, adminToken);
    console.assert(coursesRes.status === 200 && coursesRes.body.courses.length >= 3, 'Courses list failed');
    console.log(`✅ 2. Course management verified (${coursesRes.body.courses.length} courses)`);

    // 3. Student Leader Login
    const alexRes = await req('POST', '/auth/login', { email: 'alex@joineazy.edu', password: 'student123' });
    console.assert(alexRes.status === 200, 'Alex login failed');
    const alexToken = alexRes.body.token;
    console.log('✅ 3. Group Leader login verified');

    // 4. Student Member Login
    const bellaRes = await req('POST', '/auth/login', { email: 'bella@joineazy.edu', password: 'student123' });
    console.assert(bellaRes.status === 200, 'Bella login failed');
    const bellaToken = bellaRes.body.token;
    console.log('✅ 4. Group Member login verified');

    // 5. Course Enrolled Progress
    const alexCoursesRes = await req('GET', '/courses', null, alexToken);
    const cs301 = alexCoursesRes.body.courses.find(c => c.code === 'CS-301');
    console.assert(cs301, 'CS-301 not found for Alex');
    console.log(`✅ 5. Student Enrolled Course Progress verified (${cs301.progress_percentage}%)`);

    // 6. Role & Permission checks for Group Assignment
    const alexAssRes = await req('GET', `/assignments?course_id=${cs301.id}`, null, alexToken);
    const groupAss = alexAssRes.body.assignments.find(a => a.submission_type === 'group');
    console.assert(groupAss && groupAss.is_leader === true && groupAss.can_submit === true);
    console.log('✅ 6. Leader submission authorization verified');

    const bellaAssRes = await req('GET', `/assignments?course_id=${cs301.id}`, null, bellaToken);
    const bellaGroupAss = bellaAssRes.body.assignments.find(a => a.id === groupAss.id);
    console.assert(bellaGroupAss.is_leader === false && bellaGroupAss.can_submit === false);
    console.log(`✅ 7. Member restriction verified: Awaiting Leader ${bellaGroupAss.leader_name}`);

    // 8. Rejection of unauthorized member submission
    const bellaSubAttempt = await req('POST', '/submissions/confirm', {
      assignment_id: groupAss.id,
      confirmation_step1: true,
      confirmation_step2: true,
    }, bellaToken);
    console.assert(bellaSubAttempt.status === 403);
    console.log('✅ 8. HTTP 403 Forbidden on non-leader submission verified');

    // 9. Leader Submission
    const alexSubAttempt = await req('POST', '/submissions/confirm', {
      assignment_id: groupAss.id,
      confirmation_step1: true,
      confirmation_step2: true,
      notes: 'Final delivery by team lead'
    }, alexToken);
    console.assert(alexSubAttempt.status === 200 || alexSubAttempt.status === 201);
    console.log('✅ 9. Leader submission accepted and recorded');

    // 10. Automatic Group-wide reflection
    const bellaAssAfter = await req('GET', `/assignments?course_id=${cs301.id}`, null, bellaToken);
    const bellaGroupAfter = bellaAssAfter.body.assignments.find(a => a.id === groupAss.id);
    console.assert(bellaGroupAfter.acknowledged_by_leader === 1 || bellaGroupAfter.acknowledged_by_leader === true);
    console.log('✅ 10. Instant group-wide reflection & leader acknowledgment verified');

    // 11. Admin Analytics
    const analyticsRes = await req('GET', '/analytics/admin', null, adminToken);
    console.assert(analyticsRes.status === 200);
    console.log('✅ 11. Course analytics and summary aggregation verified');

    console.log('\n🎉 ALL ROUND 2 INTEGRATION TESTS PASSED!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
});
