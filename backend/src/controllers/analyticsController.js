const db = require('../config/db');

// Admin Analytics Dashboard Data (Round 2: Courses + Group Leader Metrics)
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. High-level Summary Counts
    const coursesCountRes = await db.query('SELECT COUNT(*) as count FROM courses');
    const totalCourses = parseInt(coursesCountRes.rows[0].count, 10);

    const studentsCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalStudents = parseInt(studentsCountRes.rows[0].count, 10);

    const groupsCountRes = await db.query('SELECT COUNT(*) as count FROM groups');
    const totalGroups = parseInt(groupsCountRes.rows[0].count, 10);

    const assignmentsCountRes = await db.query('SELECT COUNT(*) as count FROM assignments');
    const totalAssignments = parseInt(assignmentsCountRes.rows[0].count, 10);

    const submissionsCountRes = await db.query(
      'SELECT COUNT(*) as count FROM submissions WHERE confirmed_by_student = TRUE'
    );
    const totalSubmissions = parseInt(submissionsCountRes.rows[0].count, 10);

    // Course-wise aggregate breakdown
    const coursesSql = `
      SELECT 
        c.id, c.code, c.title, c.semester, c.color_theme,
        (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count,
        (SELECT COUNT(*) FROM groups WHERE course_id = c.id) as group_count
      FROM courses c
      ORDER BY c.code ASC
    `;
    const coursesRes = await db.query(coursesSql);

    const courseBreakdown = await Promise.all(
      coursesRes.rows.map(async (c) => {
        const studentCount = parseInt(c.student_count, 10);
        const asgnCount = parseInt(c.assignment_count, 10);
        const expectedSubs = studentCount * asgnCount;

        const subsRes = await db.query(
          `SELECT COUNT(DISTINCT s.id) as count
           FROM submissions s
           INNER JOIN assignments a ON s.assignment_id = a.id
           WHERE a.course_id = $1 AND s.confirmed_by_student = TRUE`,
          [c.id]
        );
        const actualSubs = parseInt(subsRes.rows[0].count, 10);
        const completionRate = expectedSubs > 0 ? Math.round((actualSubs / expectedSubs) * 100) : 0;

        return {
          ...c,
          student_count: studentCount,
          assignment_count: asgnCount,
          group_count: parseInt(c.group_count, 10),
          confirmed_submissions: actualSubs,
          completion_rate: completionRate,
        };
      })
    );

    const totalExpected = totalStudents * totalAssignments;
    const overallRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;

    // 2. Per-Assignment Completion Breakdown
    const asgnBreakdownSql = `
      SELECT 
        a.id, a.course_id, a.title, a.due_date, a.submission_type, a.target_type,
        c.code as course_code, c.title as course_title,
        COUNT(DISTINCT s.student_id) as confirmed_count,
        $1 as total_students
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.confirmed_by_student = TRUE
      GROUP BY a.id, a.course_id, a.title, a.due_date, a.submission_type, a.target_type, c.code, c.title
      ORDER BY a.due_date ASC
    `;
    const asgnBreakdownRes = await db.query(asgnBreakdownSql, [totalStudents]);

    const assignmentStats = asgnBreakdownRes.rows.map((row) => {
      const confirmed = parseInt(row.confirmed_count, 10);
      const expected = totalStudents;
      const pending = Math.max(0, expected - confirmed);
      const rate = expected > 0 ? Math.round((confirmed / expected) * 100) : 0;
      const isPastDue = new Date(row.due_date) < new Date();

      return {
        id: row.id,
        course_id: row.course_id,
        course_code: row.course_code,
        course_title: row.course_title,
        title: row.title,
        due_date: row.due_date,
        submission_type: row.submission_type,
        target_type: row.target_type,
        confirmed_count: confirmed,
        pending_count: pending,
        expected_count: expected,
        completion_rate: rate,
        status: rate === 100 ? 'Completed' : isPastDue ? 'Past Due' : 'In Progress',
      };
    });

    // 3. Group Performance Table & Leaderboard
    const groupsSql = `
      SELECT 
        g.id, g.name, g.code, g.course_id,
        c.code as course_code,
        u.name as leader_name,
        COUNT(DISTINCT gm.user_id) as member_count
      FROM groups g
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, g.name, g.code, g.course_id, c.code, u.name
      ORDER BY g.name ASC
    `;
    const groupsRes = await db.query(groupsSql);

    const groupPerformance = await Promise.all(
      groupsRes.rows.map(async (grp) => {
        const memCount = parseInt(grp.member_count, 10);
        const grpSubsRes = await db.query(
          `SELECT COUNT(DISTINCT s.id) as count
           FROM submissions s
           INNER JOIN group_members gm ON s.student_id = gm.user_id
           WHERE gm.group_id = $1 AND s.confirmed_by_student = TRUE`,
          [grp.id]
        );
        const confirmed = parseInt(grpSubsRes.rows[0].count, 10);
        const expected = memCount * totalAssignments;
        const rate = expected > 0 ? Math.round((confirmed / expected) * 100) : 0;

        let badge = 'Needs Attention';
        let badgeColor = 'amber';
        if (rate >= 80) {
          badge = 'High Performer';
          badgeColor = 'emerald';
        } else if (rate >= 50) {
          badge = 'On Track';
          badgeColor = 'blue';
        }

        return {
          id: grp.id,
          name: grp.name,
          code: grp.code,
          course_code: grp.course_code || 'General',
          leader_name: grp.leader_name,
          member_count: memCount,
          confirmed_submissions: confirmed,
          expected_submissions: expected,
          completion_rate: rate,
          performance_badge: badge,
          badge_color: badgeColor,
        };
      })
    );

    // 4. Recent Submission Activities
    const recentActivitySql = `
      SELECT 
        s.id, s.submitted_at, s.notes, s.submission_type, s.acknowledged_by_leader,
        ack_u.name as acknowledged_by_name,
        u.name as student_name, u.email as student_email, u.student_id as student_id_code,
        a.title as assignment_title,
        c.code as course_code,
        COALESCE(g.name, 'Independent') as group_name
      FROM submissions s
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN users ack_u ON s.acknowledged_by_id = ack_u.id
      WHERE s.confirmed_by_student = TRUE
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `;
    const recentActivityRes = await db.query(recentActivitySql);

    return res.json({
      success: true,
      summary: {
        total_courses: totalCourses,
        total_students: totalStudents,
        total_groups: totalGroups,
        total_assignments: totalAssignments,
        total_submissions: totalSubmissions,
        overall_completion_rate: overallRate,
      },
      course_breakdown: courseBreakdown,
      assignment_stats: assignmentStats,
      group_performance: groupPerformance,
      recent_activity: recentActivityRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

// Student Personalized Progress & Course Analytics
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Enrolled courses count
    const enrollRes = await db.query(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE student_id = $1',
      [studentId]
    );
    const enrolledCoursesCount = parseInt(enrollRes.rows[0].count, 10);

    // Total assignments in enrolled courses
    const asgnRes = await db.query(
      `SELECT COUNT(DISTINCT a.id) as count 
       FROM assignments a
       INNER JOIN course_enrollments ce ON a.course_id = ce.course_id
       WHERE ce.student_id = $1`,
      [studentId]
    );
    const totalAssignments = parseInt(asgnRes.rows[0].count, 10);

    // Student's completed submissions
    const mySubsRes = await db.query(
      'SELECT COUNT(*) as count FROM submissions WHERE student_id = $1 AND confirmed_by_student = TRUE',
      [studentId]
    );
    const completedCount = parseInt(mySubsRes.rows[0].count, 10);
    const pendingCount = Math.max(0, totalAssignments - completedCount);
    const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

    // Group progress details
    const myGroupRes = await db.query(
      `SELECT g.id, g.name, g.code, gm.role 
       FROM groups g 
       INNER JOIN group_members gm ON g.id = gm.group_id 
       WHERE gm.user_id = $1 LIMIT 1`,
      [studentId]
    );

    let groupAnalytics = null;
    if (myGroupRes.rows.length > 0) {
      const grp = myGroupRes.rows[0];
      const members = await db.query(
        `SELECT u.id, u.name, u.email, u.student_id, gm.role,
           (SELECT COUNT(*) FROM submissions WHERE student_id = u.id AND confirmed_by_student = TRUE) as submissions_count
         FROM group_members gm
         INNER JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1
         ORDER BY gm.role DESC, u.name ASC`,
        [grp.id]
      );

      const totalMembers = members.rows.length;
      const totalGroupSubmissions = members.rows.reduce(
        (sum, m) => sum + parseInt(m.submissions_count, 10),
        0
      );
      const totalGroupExpected = totalMembers * (totalAssignments || 1);
      const groupRate =
        totalGroupExpected > 0 ? Math.round((totalGroupSubmissions / totalGroupExpected) * 100) : 0;

      let badge = 'Getting Started';
      if (groupRate === 100) badge = 'Mastery Achieved';
      else if (groupRate >= 75) badge = 'High Momentum';
      else if (groupRate >= 40) badge = 'In Progress';

      groupAnalytics = {
        group_id: grp.id,
        group_name: grp.name,
        group_code: grp.code,
        my_role: grp.role,
        is_leader: grp.role === 'leader',
        members_count: totalMembers,
        members: members.rows,
        group_completion_rate: groupRate,
        badge,
      };
    }

    return res.json({
      success: true,
      personal: {
        enrolled_courses: enrolledCoursesCount,
        total_assignments: totalAssignments,
        completed_count: completedCount,
        pending_count: pendingCount,
        completion_rate: completionRate,
        badge: completionRate === 100 ? 'All Completed' : completionRate >= 50 ? 'Active Contributor' : 'Getting Started',
      },
      group: groupAnalytics,
    });
  } catch (err) {
    next(err);
  }
};
