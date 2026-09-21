const bcrypt = require('bcryptjs');
const User = require('../models/entities/userModel');
const Student = require('../models/entities/studentModel');
const AnswerSheet = require('../models/entities/answerSheetModel');

function formatStudentEmail(rollNo) {
  if (!rollNo) return '';
  const cleanRoll = String(rollNo).trim().toLowerCase();
  return `${cleanRoll}@ch.students.amrita.edu`;
}

const DEFAULT_STUDENTS = [
  { regNo: 'CH.SC.U4CSE23003', name: 'Rahul Sharma' },
  { regNo: 'CH.SC.U4CSE23004', name: 'Ananya Roy' },
  { regNo: 'CH.SC.U4CSE23005', name: 'Vikram Patel' },
  { regNo: 'CH.SC.U4CSE23006', name: 'Priya Nair' }
];

async function syncAllStudents(commonPassword = 'std123') {
  try {
    const hashedPassword = await bcrypt.hash(commonPassword, 10);
    console.log(`[StudentSync] Syncing student accounts to @ch.students.amrita.edu with password: ${commonPassword}...`);

    // 1. Ensure default known students from demo/evaluations exist
    for (const def of DEFAULT_STUDENTS) {
      const email = formatStudentEmail(def.regNo);

      let student = await Student.findOne({
        registrationNumber: new RegExp(`^${def.regNo}$`, 'i')
      });

      let user = null;
      if (student && student.userId) {
        user = await User.findById(student.userId);
      }
      if (!user) {
        user = await User.findOne({ email });
      }
      if (!user && student && student.email) {
        user = await User.findOne({ email: student.email.toLowerCase() });
      }

      if (!user) {
        user = await User.create({
          role: 'STUDENT',
          email,
          password: hashedPassword,
          name: def.name
        });
        console.log(`[StudentSync] Created user ${def.name} (${email})`);
      } else {
        user.email = email;
        user.password = hashedPassword;
        user.name = def.name;
        user.role = 'STUDENT';
        await user.save();
      }

      if (!student) {
        student = await Student.create({
          userId: user._id,
          name: def.name,
          registrationNumber: def.regNo,
          email
        });
        console.log(`[StudentSync] Created Student record for ${def.name} (${def.regNo})`);
      } else {
        student.userId = user._id;
        student.name = def.name;
        student.email = email;
        await student.save();
      }
    }

    // 2. Iterate ALL existing Student documents in DB and ensure their email is rollno@ch.students.amrita.edu and user password is std123
    const allStudents = await Student.find({});
    for (const st of allStudents) {
      const email = formatStudentEmail(st.registrationNumber);
      
      let user = null;
      if (st.userId) {
        user = await User.findById(st.userId);
      }
      if (!user) {
        user = await User.findOne({ email });
      }
      if (!user && st.email) {
        user = await User.findOne({ email: st.email.toLowerCase() });
      }

      if (!user) {
        user = await User.create({
          role: 'STUDENT',
          email,
          password: hashedPassword,
          name: st.name || `Student ${st.registrationNumber}`
        });
      } else {
        user.email = email;
        user.password = hashedPassword;
        if (st.name) user.name = st.name;
        user.role = 'STUDENT';
        await user.save();
      }

      st.userId = user._id;
      st.email = email;
      await st.save();
    }

    // 3. Check any AnswerSheets with studentId that might not have user
    const sheets = await AnswerSheet.find({});
    for (const sh of sheets) {
      if (sh.studentId) {
        const student = await Student.findById(sh.studentId);
        if (student) {
          const email = formatStudentEmail(student.registrationNumber);
          let user = null;
          if (student.userId) {
            user = await User.findById(student.userId);
          }
          if (!user) {
            user = await User.findOne({ email });
          }
          if (!user) {
            user = await User.create({
              role: 'STUDENT',
              email,
              password: hashedPassword,
              name: student.name || `Student ${student.registrationNumber}`
            });
          } else {
            user.email = email;
            user.password = hashedPassword;
            user.role = 'STUDENT';
            await user.save();
          }
          student.userId = user._id;
          student.email = email;
          await student.save();
        }
      }
    }

    // 4. Remove any stale student1@gmail.com style accounts that are no longer linked
    const staleUsers = await User.find({
      role: 'STUDENT',
      email: { $not: /@ch\.students\.amrita\.edu$/i }
    });
    for (const stale of staleUsers) {
      const linked = await Student.findOne({ userId: stale._id });
      if (!linked) {
        await User.deleteOne({ _id: stale._id });
      }
    }

    console.log('[StudentSync] All students successfully formatted as <rollno>@ch.students.amrita.edu with password: ' + commonPassword);
    return { success: true, count: allStudents.length };
  } catch (err) {
    console.error('[StudentSync] Error syncing students:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { syncAllStudents, formatStudentEmail, DEFAULT_STUDENTS };
