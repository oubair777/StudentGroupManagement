const bcrypt = require('bcryptjs');
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

async function runSeed() {
  try {
    console.log('🔄 Checking / running database seeding...');

    // Ensure schema is applied first
    const schemaFileName = db.getDbType() === 'postgres' ? 'schema.sql' : 'schema.sqlite.sql';
    const schemaPath = path.resolve(__dirname, schemaFileName);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.execScript(schemaSql);
    console.log('✅ Schema tables verified/created.');

    // Password hashes
    const adminPass = await bcrypt.hash('admin123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    // 1. Create Users
    console.log('👤 Seeding users...');
    const usersData = [
      {
        name: 'Dr. Robert Vance (Professor)',
        email: 'professor@joineazy.edu',
        password: adminPass,
        role: 'admin',
        student_id: null,
      },
      {
        name: 'Alex Rivera',
        email: 'alex@joineazy.edu',
        password: studentPass,
        role: 'student',
        student_id: 'STU-1001',
      },
      {
        name: 'Bella Chen',
        email: 'bella@joineazy.edu',
        password: studentPass,
        role: 'student',
        student_id: 'STU-1002',
      },
      {
        name: 'Charlie Davis',
        email: 'charlie@joineazy.edu',
        password: studentPass,
        role: 'student',
        student_id: 'STU-1003',
      },
      {
        name: 'Diana Prince',
        email: 'diana@joineazy.edu',
        password: studentPass,
        role: 'student',
        student_id: 'STU-1004',
      },
      {
        name: 'Evan Wright',
        email: 'evan@joineazy.edu',
        password: studentPass,
        role: 'student',
        student_id: 'STU-1005',
      },
    ];

    const insertedUsers = {};
    for (const u of usersData) {
      const res = await db.query(
        `INSERT INTO users (name, email, password, role, student_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email`,
        [u.name, u.email, u.password, u.role, u.student_id]
      );
      insertedUsers[u.email] = res.rows[0].id;
    }

    // 2. Create Groups
    console.log('👥 Seeding groups...');
    const groupsData = [
      {
        name: 'Alpha Architects',
        description: 'Frontend and Full Stack engineering cohort team A',
        code: 'GRP-ALPHA',
        created_by: insertedUsers['alex@joineazy.edu'],
        members: [
          { email: 'alex@joineazy.edu', role: 'leader' },
          { email: 'bella@joineazy.edu', role: 'member' },
        ],
      },
      {
        name: 'Beta Bytecrafters',
        description: 'Distributed systems and backend API integration team',
        code: 'GRP-BETA',
        created_by: insertedUsers['charlie@joineazy.edu'],
        members: [
          { email: 'charlie@joineazy.edu', role: 'leader' },
          { email: 'diana@joineazy.edu', role: 'member' },
        ],
      },
      {
        name: 'Gamma Grid',
        description: 'Cloud infrastructure, containerization, and automation team',
        code: 'GRP-GAMMA',
        created_by: insertedUsers['evan@joineazy.edu'],
        members: [{ email: 'evan@joineazy.edu', role: 'leader' }],
      },
    ];

    const insertedGroups = {};
    for (const g of groupsData) {
      const gRes = await db.query(
        `INSERT INTO groups (name, description, code, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id, code`,
        [g.name, g.description, g.code, g.created_by]
      );
      const groupId = gRes.rows[0].id;
      insertedGroups[g.code] = groupId;

      for (const m of g.members) {
        await db.query(
          `INSERT INTO group_members (group_id, user_id, role)
           VALUES ($1, $2, $3)`,
          [groupId, insertedUsers[m.email], m.role]
        );
      }
    }

    // 3. Create Assignments
    console.log('📝 Seeding assignments...');
    const now = new Date();
    const addDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

    const assignmentsData = [
      {
        title: 'Milestone 1: Project Architecture & ER Diagram',
        description:
          'Design the complete modular architecture, database schema, and entity-relationship models for the Joineazy system. Upload your design doc and diagram to the OneDrive folder.',
        due_date: addDays(5),
        onedrive_link:
          'https://onedrive.live.com/?id=joineazy_milestone_1_student_submissions',
        target_type: 'all',
        created_by: insertedUsers['professor@joineazy.edu'],
      },
      {
        title: 'Milestone 2: Modular API & JWT Authentication',
        description:
          'Implement secure REST APIs, role-based access control (Student vs Admin), and two-step verification mechanisms. Provide testing proof in OneDrive.',
        due_date: addDays(12),
        onedrive_link:
          'https://onedrive.live.com/?id=joineazy_milestone_2_student_submissions',
        target_type: 'specific_groups',
        target_group_codes: ['GRP-ALPHA', 'GRP-BETA'],
        created_by: insertedUsers['professor@joineazy.edu'],
      },
      {
        title: 'Milestone 3: Full Stack Integration & Docker Deployment',
        description:
          'Final containerized application with Docker Compose, automated database seeding, and responsive UI. Upload demo video and links to OneDrive.',
        due_date: addDays(20),
        onedrive_link:
          'https://onedrive.live.com/?id=joineazy_milestone_3_student_submissions',
        target_type: 'all',
        created_by: insertedUsers['professor@joineazy.edu'],
      },
    ];

    const insertedAssignments = [];
    for (const a of assignmentsData) {
      const aRes = await db.query(
        `INSERT INTO assignments (title, description, due_date, onedrive_link, target_type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title`,
        [a.title, a.description, a.due_date, a.onedrive_link, a.target_type, a.created_by]
      );
      const asgnId = aRes.rows[0].id;
      insertedAssignments.push({ id: asgnId, title: a.title });

      if (a.target_type === 'specific_groups' && a.target_group_codes) {
        for (const code of a.target_group_codes) {
          const gId = insertedGroups[code];
          if (gId) {
            await db.query(
              `INSERT INTO assignment_group_targets (assignment_id, group_id)
               VALUES ($1, $2)`,
              [asgnId, gId]
            );
          }
        }
      }
    }

    // 4. Create Initial Submissions (Alex, Bella, and Charlie submit Milestone 1)
    console.log('✅ Seeding verified submissions...');
    const m1Id = insertedAssignments[0].id;
    const m2Id = insertedAssignments[1].id;

    // Alex submission for M1
    await db.query(
      `INSERT INTO submissions (assignment_id, group_id, student_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, $3, TRUE, TRUE, TRUE, $4)`,
      [
        m1Id,
        insertedGroups['GRP-ALPHA'],
        insertedUsers['alex@joineazy.edu'],
        'Uploaded complete PDF schema and ER diagram to OneDrive folder.',
      ]
    );

    // Bella submission for M1 (Completing Alpha Architects M1 100%)
    await db.query(
      `INSERT INTO submissions (assignment_id, group_id, student_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, $3, TRUE, TRUE, TRUE, $4)`,
      [
        m1Id,
        insertedGroups['GRP-ALPHA'],
        insertedUsers['bella@joineazy.edu'],
        'Verified and co-signed Milestone 1 submission on OneDrive.',
      ]
    );

    // Charlie submission for M1
    await db.query(
      `INSERT INTO submissions (assignment_id, group_id, student_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, $3, TRUE, TRUE, TRUE, $4)`,
      [
        m1Id,
        insertedGroups['GRP-BETA'],
        insertedUsers['charlie@joineazy.edu'],
        'Submitted ER diagram & backend architecture draft.',
      ]
    );

    // Alex submission for M2 (In Progress for Alpha Architects)
    await db.query(
      `INSERT INTO submissions (assignment_id, group_id, student_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, $3, TRUE, TRUE, TRUE, $4)`,
      [
        m2Id,
        insertedGroups['GRP-ALPHA'],
        insertedUsers['alex@joineazy.edu'],
        'Pushed API code and uploaded Postman collection to OneDrive.',
      ]
    );

    console.log('✨ Demo database successfully seeded!');
    console.log('----------------------------------------------------');
    console.log('Credentials:');
    console.log('Professor / Admin:  professor@joineazy.edu / admin123');
    console.log('Student (Group Lead): alex@joineazy.edu      / student123');
    console.log('Student (Group Mbr):  bella@joineazy.edu     / student123');
    console.log('Student (Group Lead): charlie@joineazy.edu   / student123');
    console.log('Student:              diana@joineazy.edu     / student123');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Error during database seeding:', err);
    throw err;
  }
}

// Allow direct execution: node src/db/seed.js
if (require.main === module) {
  (async () => {
    await db.initDb();
    await runSeed();
    process.exit(0);
  })();
}

module.exports = { runSeed };
