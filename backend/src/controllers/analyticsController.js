const db = require('../config/db');

// Admin Analytics Dashboard Data
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. High-level Summary Counts
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

    // Theoretical maximum submissions = totalStudents * totalAssignments
    const totalExpected = totalStudents * totalAssignments;
    const overallRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;

    // 2. Per-Assignment Completion Breakdown
    const asgnBreakdownSql = `
      SELECT 
        a.id, a.title, a.due_date, a.target_type,
        COUNT(DISTINCT s.student_id) as confirmed_count,
        $1 as total_students
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.confirmed_by_student = TRUE
      GROUP BY a.id, a.title, a.due_date, a.target_type
      ORDER BY a.created_at ASC
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
        title: row.title,
        due_date: row.due_date,
        target_type: row.target_type,
        confirmed_count: confirmed,
        pending_count: pending,
        expected_count: expected,
        completion_rate: rate,
        status: rate === 100 ? 'Completed' : isPastDue ? 'Past Due' : 'In Progress',
      };
    });

    // 3. Group Performance Table / Chart Data
    const groupsSql = `
      SELECT 
        g.id, g.name, g.code,
        COUNT(DISTINCT gm.user_id) as member_count
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, g.name, g.code
      ORDER BY g.name ASC
    `;
    const groupsRes = await db.query(groupsSql);

    const groupPerformance = await Promise.all(
      groupsRes.rows.map(async (grp) => {
        const memCount = parseInt(grp.member_count, 10);
        // Find total submissions by members of this group
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
        s.id, s.submitted_at, s.notes,
        u.name as student_name, u.email as student_email, u.student_id as student_id_code,
        a.title as assignment_title,
        COALESCE(g.name, 'Independent') as group_name
      FROM submissions s
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.confirmed_by_student = TRUE
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `;
    const recentActivityRes = await db.query(recentActivitySql);

    return res.json({
      success: true,
      summary: {
        total_students: totalStudents,
        total_groups: totalGroups,
        total_assignments: totalAssignments,
        total_submissions: totalSubmissions,
        overall_completion_rate: overallRate,
      },
      assignment_stats: assignmentStats,
      group_performance: groupPerformance,
      recent_activity: recentActivityRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

// Student Personalized Progress & Group Analytics
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Total assignments available
    const myGroupsRes = await db.query('SELECT group_id FROM group_members WHERE user_id = $1', [studentId]);
    const myGroupIds = myGroupsRes.rows.map((r) => r.group_id);

    let asgnCountSql = 'SELECT COUNT(DISTINCT a.id) as count FROM assignments a WHERE a.target_type = \'all\'';
    if (myGroupIds.length > 0) {
      asgnCountSql = `
        SELECT COUNT(DISTINCT a.id) as count 
        FROM assignments a
        LEFT JOIN assignment_group_targets agt ON a.id = agt.assignment_id
        WHERE a.target_type = 'all' OR agt.group_id IN (${myGroupIds.map((_, i) => `$${i + 1}`).join(',')})
      `;
    }
    const asgnRes = await db.query(asgnCountSql, myGroupIds);
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
    let groupAnalytics = null;
    if (myGroupIds.length > 0) {
      const primaryGroupId = myGroupIds[0];
      const grpInfo = await db.query('SELECT id, name, code FROM groups WHERE id = $1', [primaryGroupId]);
      
      const members = await db.query(
        `SELECT u.id, u.name, u.email, u.student_id, gm.role,
           (SELECT COUNT(*) FROM submissions WHERE student_id = u.id AND confirmed_by_student = TRUE) as submissions_count
         FROM group_members gm
         INNER JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1
         ORDER BY gm.role DESC, u.name ASC`,
        [primaryGroupId]
      );

      const totalMembers = members.rows.length;
      const totalGroupSubmissions = members.rows.reduce(
        (sum, m) => sum + parseInt(m.submissions_count, 10),
        0
      );
      const totalGroupExpected = totalMembers * totalAssignments;
      const groupRate =
        totalGroupExpected > 0 ? Math.round((totalGroupSubmissions / totalGroupExpected) * 100) : 0;

      let badge = 'Getting Started';
      if (groupRate === 100) badge = 'Mastery Achieved';
      else if (groupRate >= 75) badge = 'High Momentum';
      else if (groupRate >= 40) badge = 'In Progress';

      groupAnalytics = {
        group_id: primaryGroupId,
        group_name: grpInfo.rows[0]?.name,
        group_code: grpInfo.rows[0]?.code,
        members_count: totalMembers,
        members: members.rows,
        group_completion_rate: groupRate,
        badge,
      };
    }

    return res.json({
      success: true,
      personal: {
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
