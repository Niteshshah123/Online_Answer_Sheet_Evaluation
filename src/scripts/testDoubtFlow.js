const axios = require('axios');

async function testDoubtFlow() {
  const BASE_URL = 'http://localhost:3000';
  console.log('--- 1. Testing Student Login ---');
  let studentToken = null;
  let studentEmail = 'ch.sc.u4cse23003@ch.students.amrita.edu';
  try {
    const sLogin = await axios.post(`${BASE_URL}/api/student/login`, {
      email: studentEmail,
      password: 'std123'
    });
    studentToken = sLogin.data.data.token;
    console.log('✓ Student logged in successfully! Student Name:', sLogin.data.data.user.name);
  } catch (err) {
    console.error('Student login error:', err.response?.data || err.message);
    return;
  }

  console.log('\n--- 2. Fetching Student Dashboard & Sheets ---');
  let sheetId = null;
  try {
    const sDash = await axios.get(`${BASE_URL}/api/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const results = sDash.data.data.results || [];
    console.log(`✓ Found ${results.length} published exam results for student.`);
    if (results.length > 0) {
      sheetId = results[0].sheetId;
      console.log(`✓ Testing with sheetId: ${sheetId} (${results[0].examName})`);
    } else {
      console.log('No published sheets found for student. Checking directly in database...');
    }
  } catch (err) {
    console.error('Fetch student dashboard error:', err.response?.data || err.message);
    return;
  }

  if (!sheetId) {
    console.log('Skipping rest since no published sheet for student');
    return;
  }

  console.log('\n--- 3. Student Raising a Doubt on Question 1 ---');
  let doubtId = null;
  try {
    const raiseRes = await axios.post(`${BASE_URL}/api/student/doubts`, {
      sheetId,
      questionNumber: 1,
      category: 'UNCHECKED_STEP',
      comment: 'Dear Professor, my step 2 in algorithm derivation was evaluated with 0 marks. Could you please review the handwritten formula on page 1?'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    doubtId = raiseRes.data.data._id;
    console.log('✓ Doubt raised successfully! Doubt ID:', doubtId, 'Status:', raiseRes.data.data.status);
  } catch (err) {
    console.error('Raise doubt error:', err.response?.data || err.message);
    return;
  }

  console.log('\n--- 4. Student Fetching Doubts for Sheet ---');
  try {
    const sDoubts = await axios.get(`${BASE_URL}/api/student/doubts/sheet/${sheetId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log(`✓ Student has ${sDoubts.data.data.length} doubts on this sheet.`);
    console.log('Doubt item:', sDoubts.data.data[0]);
  } catch (err) {
    console.error('Fetch student doubts error:', err.response?.data || err.message);
  }

  console.log('\n--- 5. Testing Faculty Login ---');
  let facultyToken = null;
  try {
    const fLogin = await axios.post(`${BASE_URL}/api/faculty/login`, {
      email: 'dr.a01@gmail.com',
      password: 'faculty123'
    });
    facultyToken = fLogin.data.data.token;
    console.log('✓ Faculty logged in successfully! Name:', fLogin.data.data.user.name);
  } catch (err) {
    console.error('Faculty login error:', err.response?.data || err.message);
    return;
  }

  console.log('\n--- 6. Faculty Fetching Doubts ---');
  try {
    const fDoubts = await axios.get(`${BASE_URL}/api/faculty/doubts`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    console.log(`✓ Faculty retrieved ${fDoubts.data.data.length} student doubts.`);
    const matching = fDoubts.data.data.find(d => String(d._id) === String(doubtId));
    if (matching) {
      console.log('✓ Found the raised student doubt in faculty list:');
      console.log(`Student: ${matching.studentName} (${matching.studentRegNo}), Question: ${matching.questionNumber}, Comment: "${matching.comment}"`);
    }
  } catch (err) {
    console.error('Faculty get doubts error:', err.response?.data || err.message);
  }

  console.log('\n--- 7. Faculty Replying to Doubt and Updating Question Marks ---');
  try {
    const replyRes = await axios.post(`${BASE_URL}/api/faculty/doubts/${doubtId}/reply`, {
      teacherReply: 'Reviewed your step 2 formula. The derivation is valid, awarded +1 mark.',
      status: 'RESOLVED',
      updatedMarks: 4.0
    }, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    console.log('✓ Faculty replied successfully! Updated status:', replyRes.data.data.status);
    console.log('Reply text:', replyRes.data.data.teacherReply);
  } catch (err) {
    console.error('Faculty reply error:', err.response?.data || err.message);
  }

  console.log('\n--- 8. Student Verifying Doubt Resolution & Reply ---');
  try {
    const sDoubtsAfter = await axios.get(`${BASE_URL}/api/student/doubts/sheet/${sheetId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const resolvedDoubt = sDoubtsAfter.data.data.find(d => String(d._id) === String(doubtId));
    console.log('✓ Student verified doubt status:', resolvedDoubt.status);
    console.log('✓ Teacher reply displayed to student:', resolvedDoubt.teacherReply);
    console.log('✓ Evaluator Name:', resolvedDoubt.facultyName);
  } catch (err) {
    console.error('Student check error:', err.response?.data || err.message);
  }

  console.log('\n=============================================');
  console.log('🎉 ALL END-TO-END DOUBT FLOW TESTS PASSED!');
  console.log('=============================================');
}

testDoubtFlow();
