const db = require('../config/db');

// Get all courses (Personalized for Students [Enrolled] vs Professors [Taught])
exports.getAllCourses = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    if (isStudent) {
      // Fetch courses the student is enrolled in, along with instructor details and assignment progress
      const sql = `
        SELECT 
          c.id, c.code, c.title, c.description, c.semester, c.department, c.color_theme, c.created_at,
          u.name as instructor_name, u.email as instructor_email,
          ce.enrolled_at,
          (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
        FROM courses c
        INNER JOIN course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE ce.student_id = $1
        ORDER BY c.code ASC
      `;
      const result = await db.query(sql, [req.user.id]);

      // Calculate personal submission progress for each course
      const coursesWithProgress = await Promise.all(
        result.rows.map(async (course) => {
          const totalAsgn = parseInt(course.assignment_count, 10);
          const completedRes = await db.query(
            `SELECT COUNT(DISTINCT s.assignment_id) as count
             FROM submissions s
             INNER JOIN assignments a ON s.assignment_id = a.id
             WHERE a.course_id = $1 AND s.student_id = $2 AND s.confirmed_by_student = TRUE`,
            [course.id, req.user.id]
          );
          const completedAsgn = parseInt(completedRes.rows[0].count, 10);
          const progressPercent = totalAsgn > 0 ? Math.round((completedAsgn / totalAsgn) * 100) : 0;

          return {
            ...course,
            assignment_count: totalAsgn,
            completed_assignments: completedAsgn,
            progress_percentage: progressPercent,
          };
        })
      );

      return res.json({
        success: true,
        courses: coursesWithProgress,
      });
    }

    // Professor view: Courses taught by this instructor
    const profSql = `
      SELECT 
        c.id, c.code, c.title, c.description, c.semester, c.department, c.color_theme, c.created_at,
        (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count,
        (SELECT COUNT(*) FROM groups WHERE course_id = c.id) as group_count
      FROM courses c
      WHERE c.instructor_id = $1
      ORDER BY c.code ASC
    `;
    const profResult = await db.query(profSql, [req.user.id]);

    // Enhance with submission stats per course
    const profCourses = await Promise.all(
      profResult.rows.map(async (course) => {
        const studentCount = parseInt(course.student_count, 10);
        const asgnCount = parseInt(course.assignment_count, 10);
        const expectedSubs = studentCount * asgnCount;

        const actualSubsRes = await db.query(
          `SELECT COUNT(DISTINCT s.id) as count
           FROM submissions s
           INNER JOIN assignments a ON s.assignment_id = a.id
           WHERE a.course_id = $1 AND s.confirmed_by_student = TRUE`,
          [course.id]
        );
        const actualSubs = parseInt(actualSubsRes.rows[0].count, 10);
        const completionRate = expectedSubs > 0 ? Math.round((actualSubs / expectedSubs) * 100) : 0;

        return {
          ...course,
          student_count: studentCount,
          assignment_count: asgnCount,
          group_count: parseInt(course.group_count, 10),
          confirmed_submissions: actualSubs,
          completion_rate: completionRate,
        };
      })
    );

    return res.json({
      success: true,
      courses: profCourses,
    });
  } catch (err) {
    next(err);
  }
};

// Get single course details with its assignments and students
exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const courseSql = `
      SELECT 
        c.*, 
        u.name as instructor_name, u.email as instructor_email,
        (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1
    `;
    const courseRes = await db.query(courseSql, [id]);

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const course = courseRes.rows[0];

    // Fetch enrolled students
    const studentsSql = `
      SELECT u.id, u.name, u.email, u.student_id, ce.enrolled_at
      FROM course_enrollments ce
      INNER JOIN users u ON ce.student_id = u.id
      WHERE ce.course_id = $1
      ORDER BY u.name ASC
    `;
    const studentsRes = await db.query(studentsSql, [id]);

    return res.json({
      success: true,
      course: {
        ...course,
        student_count: parseInt(course.student_count, 10),
        assignment_count: parseInt(course.assignment_count, 10),
        enrolled_students: studentsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Create a new course (Professor only)
exports.createCourse = async (req, res, next) => {
  try {
    const { code, title, description, semester = 'Fall 2026', department = 'Computer Science', color_theme = 'indigo' } = req.body;

    if (!code || !title) {
      return res.status(400).json({ success: false, message: 'Course Code and Title are required.' });
    }

    // Check unique code
    const existing = await db.query('SELECT id FROM courses WHERE LOWER(code) = $1', [code.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Course with code ${code.toUpperCase()} already exists.` });
    }

    const insertSql = `
      INSERT INTO courses (code, title, description, instructor_id, semester, department, color_theme)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(insertSql, [
      code.trim().toUpperCase(),
      title.trim(),
      description ? description.trim() : null,
      req.user.id,
      semester.trim(),
      department.trim(),
      color_theme,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Enroll a student in a course
exports.enrollStudent = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { identifier } = req.body; // email or student_id

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ success: false, message: 'Student Email or ID is required.' });
    }

    const q = identifier.trim().toLowerCase();
    const studentRes = await db.query(
      `SELECT id, name, email, student_id FROM users WHERE role = 'student' AND (LOWER(email) = $1 OR LOWER(student_id) = $2)`,
      [q, q]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Student not found with identifier: "${identifier}".` });
    }

    const student = studentRes.rows[0];

    // Check existing enrollment
    const existing = await db.query(
      'SELECT id FROM course_enrollments WHERE course_id = $1 AND student_id = $2',
      [courseId, student.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: `${student.name} is already enrolled in this course.` });
    }

    await db.query(
      'INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)',
      [courseId, student.id]
    );

    return res.status(201).json({
      success: true,
      message: `${student.name} successfully enrolled in the course.`,
      student,
    });
  } catch (err) {
    next(err);
  }
};
