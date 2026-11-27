const bcrypt = require('bcryptjs');
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

async function runSeed() {
  try {
    console.log('🔄 Checking / running database seeding (Round 2)...');

    // Ensure schema is applied first
    const schemaFileName = db.getDbType() === 'postgres' ? 'schema.sql' : 'schema.sqlite.sql';
    const schemaPath = path.resolve(__dirname, schemaFileName);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.execScript(schemaSql);
    console.log('✅ Round 2 Schema verified/created successfully.');

    // Password hashes
    const adminPass = await bcrypt.hash('admin123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    // 1. Seed Users (Professor + Students)
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

    const profId = insertedUsers['professor@joineazy.edu'];

    // 2. Seed Courses (Round 2 requirement: Courses collection with students & assignments)
    console.log('📚 Seeding courses...');
    const coursesData = [
      {
        code: 'CS-301',
        title: 'Full Stack Cloud Architecture',
        description: 'Deep dive into modular microservices, Docker containerization, RESTful API design, and client-side reactive state orchestration.',
        instructor_id: profId,
        semester: 'Fall 2026',
        department: 'Computer Science',
        color_theme: 'indigo',
      },
      {
        code: 'CS-402',
        title: 'Distributed Systems & Scalable APIs',
        description: 'High-throughput data pipelines, relational indexing, database sharding, caching strategies, and consensus algorithms.',
        instructor_id: profId,
        semester: 'Fall 2026',
        department: 'Computer Science',
        color_theme: 'purple',
      },
      {
        code: 'CS-505',
        title: 'DevOps Automation & Cloud Security',
        description: 'Continuous integration/continuous delivery pipelines, container runtime security, observability, and infrastructure-as-code.',
        instructor_id: profId,
        semester: 'Fall 2026',
        department: 'Computer Science',
        color_theme: 'emerald',
      },
    ];

    const insertedCourses = {};
    for (const c of coursesData) {
      const cRes = await db.query(
        `INSERT INTO courses (code, title, description, instructor_id, semester, department, color_theme)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, code`,
        [c.code, c.title, c.description, c.instructor_id, c.semester, c.department, c.color_theme]
      );
      insertedCourses[c.code] = cRes.rows[0].id;
    }

    // 3. Seed Course Enrollments
    console.log('🎓 Seeding course enrollments...');
    const allStudents = ['alex@joineazy.edu', 'bella@joineazy.edu', 'charlie@joineazy.edu', 'diana@joineazy.edu', 'evan@joineazy.edu'];

    // Enroll all students in CS-301 and CS-402
    for (const email of allStudents) {
      await db.query(
        `INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)`,
        [insertedCourses['CS-301'], insertedUsers[email]]
      );
      await db.query(
        `INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)`,
        [insertedCourses['CS-402'], insertedUsers[email]]
      );
    }

    // Enroll Alex and Evan in CS-505
    await db.query(
      `INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)`,
      [insertedCourses['CS-505'], insertedUsers['alex@joineazy.edu']]
    );
    await db.query(
      `INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)`,
      [insertedCourses['CS-505'], insertedUsers['evan@joineazy.edu']]
    );

    // 4. Seed Groups (Associated with course CS-301)
    console.log('👥 Seeding groups...');
    const groupsData = [
      {
        course_id: insertedCourses['CS-301'],
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
        course_id: insertedCourses['CS-301'],
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
        course_id: insertedCourses['CS-301'],
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
        `INSERT INTO groups (course_id, name, description, code, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, code`,
        [g.course_id, g.name, g.description, g.code, g.created_by]
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

    // 5. Seed Assignments (Course-associated + Individual vs Group submission types)
    console.log('📝 Seeding assignments with submission types...');
    const now = new Date();
    const addDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

    const assignmentsData = [
      {
        course_id: insertedCourses['CS-301'],
        title: 'Milestone 1: Relational Schema & API Specification',
        description: 'Design the complete normalized database schema, ER diagrams, and REST API contracts. Each student must submit their personal schema review to OneDrive.',
        due_date: addDays(4),
        submission_type: 'individual',
        onedrive_link: 'https://onedrive.live.com/?id=joineazy_milestone_1_submissions',
        target_type: 'all',
        created_by: profId,
      },
      {
        course_id: insertedCourses['CS-301'],
        title: 'Milestone 2: Collaborative Microservice Architecture',
        description: 'Team assignment: Build and containerize the backend service with Docker. Note: Only the Group Leader can acknowledge and confirm submission on behalf of the team!',
        due_date: addDays(10),
        submission_type: 'group',
        onedrive_link: 'https://onedrive.live.com/?id=joineazy_milestone_2_submissions',
        target_type: 'specific_groups',
        target_group_codes: ['GRP-ALPHA', 'GRP-BETA'],
        created_by: profId,
      },
      {
        course_id: insertedCourses['CS-301'],
        title: 'Milestone 3: End-to-End System Demo & Video Walkthrough',
        description: 'Group deliverable: Complete full-stack integration with responsive dashboards, two-step verification, and video walkthrough upload.',
        due_date: addDays(18),
        submission_type: 'group',
        onedrive_link: 'https://onedrive.live.com/?id=joineazy_milestone_3_submissions',
        target_type: 'all',
        created_by: profId,
      },
      {
        course_id: insertedCourses['CS-402'],
        title: 'Lab 1: High-Concurrency PostgreSQL Tuning',
        description: 'Individual lab: Analyze execution plans using EXPLAIN ANALYZE, implement compound B-Tree indexes, and submit query latency benchmark report.',
        due_date: addDays(7),
        submission_type: 'individual',
        onedrive_link: 'https://onedrive.live.com/?id=joineazy_cs402_lab1_submissions',
        target_type: 'all',
        created_by: profId,
      },
      {
        course_id: insertedCourses['CS-402'],
        title: 'Project 1: Distributed Raft Consensus Implementation',
        description: 'Group project: Implement leader election and heartbeats. The group leader must submit the repository and demo recording.',
        due_date: addDays(15),
        submission_type: 'group',
        onedrive_link: 'https://onedrive.live.com/?id=joineazy_cs402_project1_submissions',
        target_type: 'all',
        created_by: profId,
      },
    ];

    const insertedAssignments = {};
    for (const a of assignmentsData) {
      const aRes = await db.query(
        `INSERT INTO assignments (course_id, title, description, due_date, submission_type, onedrive_link, target_type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, title`,
        [a.course_id, a.title, a.description, a.due_date, a.submission_type, a.onedrive_link, a.target_type, a.created_by]
      );
      const asgnId = aRes.rows[0].id;
      insertedAssignments[a.title] = asgnId;

      if (a.target_type === 'specific_groups' && a.target_group_codes) {
        for (const code of a.target_group_codes) {
          const gId = insertedGroups[code];
          if (gId) {
            await db.query(
              `INSERT INTO assignment_group_targets (assignment_id, group_id) VALUES ($1, $2)`,
              [asgnId, gId]
            );
          }
        }
      }
    }

    // 6. Seed Submissions (Demonstrating Individual & Group Leader Acknowledgment!)
    console.log('✅ Seeding verified individual and group leader submissions...');
    const m1Id = insertedAssignments['Milestone 1: Relational Schema & API Specification'];
    const m2Id = insertedAssignments['Milestone 2: Collaborative Microservice Architecture'];
    const lab1Id = insertedAssignments['Lab 1: High-Concurrency PostgreSQL Tuning'];

    // Individual Submissions for Milestone 1 (Alex and Bella submit individually)
    await db.query(
      `INSERT INTO submissions (assignment_id, course_id, submission_type, student_id, group_id, acknowledged_by_leader, acknowledged_by_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, 'individual', $3, $4, FALSE, NULL, TRUE, TRUE, TRUE, $5)`,
      [
        m1Id,
        insertedCourses['CS-301'],
        insertedUsers['alex@joineazy.edu'],
        insertedGroups['GRP-ALPHA'],
        'Submitted individual schema diagram and Postman collection to OneDrive.',
      ]
    );

    await db.query(
      `INSERT INTO submissions (assignment_id, course_id, submission_type, student_id, group_id, acknowledged_by_leader, acknowledged_by_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, 'individual', $3, $4, FALSE, NULL, TRUE, TRUE, TRUE, $5)`,
      [
        m1Id,
        insertedCourses['CS-301'],
        insertedUsers['bella@joineazy.edu'],
        insertedGroups['GRP-ALPHA'],
        'Submitted individual schema design review and validation queries.',
      ]
    );

    // Group Submission for Milestone 2:
    // Alex Rivera (Group Leader of Alpha Architects) submits on behalf of the group!
    // This reflects across ALL group members (Alex AND Bella)!
    const alphaLeaderId = insertedUsers['alex@joineazy.edu'];
    const alphaMemberId = insertedUsers['bella@joineazy.edu'];
    const alphaGroupId = insertedGroups['GRP-ALPHA'];

    // Leader submission
    await db.query(
      `INSERT INTO submissions (assignment_id, course_id, submission_type, student_id, group_id, acknowledged_by_leader, acknowledged_by_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, 'group', $3, $4, TRUE, $5, TRUE, TRUE, TRUE, $6)`,
      [
        m2Id,
        insertedCourses['CS-301'],
        alphaLeaderId,
        alphaGroupId,
        alphaLeaderId,
        'Group Leader submission: Docker Compose stack and backend microservices uploaded.',
      ]
    );

    // Auto-reflected submission for Bella Chen (Group Member)
    await db.query(
      `INSERT INTO submissions (assignment_id, course_id, submission_type, student_id, group_id, acknowledged_by_leader, acknowledged_by_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, 'group', $3, $4, TRUE, $5, TRUE, TRUE, TRUE, $6)`,
      [
        m2Id,
        insertedCourses['CS-301'],
        alphaMemberId,
        alphaGroupId,
        alphaLeaderId,
        'Acknowledged and submitted by Group Leader Alex Rivera for Alpha Architects.',
      ]
    );

    // Individual submission for Lab 1
    await db.query(
      `INSERT INTO submissions (assignment_id, course_id, submission_type, student_id, group_id, acknowledged_by_leader, acknowledged_by_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
       VALUES ($1, $2, 'individual', $3, NULL, FALSE, NULL, TRUE, TRUE, TRUE, $4)`,
      [
        lab1Id,
        insertedCourses['CS-402'],
        insertedUsers['charlie@joineazy.edu'],
        'PostgreSQL index benchmark report uploaded to OneDrive.',
      ]
    );

    console.log('✨ Round 2 database successfully seeded!');
    console.log('----------------------------------------------------');
    console.log('Courses seeded: CS-301, CS-402, CS-505');
    console.log('Submission types: Individual & Group Leader Acknowledgment');
    console.log('Demo Credentials:');
    console.log('Professor (Admin):    professor@joineazy.edu / admin123');
    console.log('Student (Group Lead): alex@joineazy.edu      / student123');
    console.log('Student (Member):     bella@joineazy.edu     / student123');
    console.log('Student (Group Lead): charlie@joineazy.edu   / student123');
    console.log('Student (Member):     diana@joineazy.edu     / student123');
    console.log('Student:              evan@joineazy.edu      / student123');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Error during database seeding:', err);
    throw err;
  }
}

if (require.main === module) {
  (async () => {
    await db.initDb();
    await runSeed();
    process.exit(0);
  })();
}

module.exports = { runSeed };
