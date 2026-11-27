const db = require('../config/db');

// Create new assignment (Admin only)
exports.createAssignment = async (req, res, next) => {
  try {
    const {
      course_id,
      title,
      description,
      due_date,
      submission_type = 'individual',
      onedrive_link,
      target_type = 'all',
      target_group_ids = [],
    } = req.body;

    if (!title || !due_date || !onedrive_link) {
      return res.status(400).json({
        success: false,
        message: 'Title, due date, and OneDrive submission link are required.',
      });
    }

    const normalizedTarget = target_type === 'specific_groups' ? 'specific_groups' : 'all';
    const normalizedSubType = submission_type === 'group' ? 'group' : 'individual';

    // Insert assignment
    const insertSql = `
      INSERT INTO assignments (course_id, title, description, due_date, submission_type, onedrive_link, target_type, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await db.query(insertSql, [
      course_id || null,
      title.trim(),
      description ? description.trim() : null,
      new Date(due_date).toISOString(),
      normalizedSubType,
      onedrive_link.trim(),
      normalizedTarget,
      req.user.id,
    ]);

    const newAssignment = result.rows[0];

    // If specific groups targeted, insert into assignment_group_targets
    if (normalizedTarget === 'specific_groups' && Array.isArray(target_group_ids) && target_group_ids.length > 0) {
      for (const grpId of target_group_ids) {
        await db.query(
          'INSERT INTO assignment_group_targets (assignment_id, group_id) VALUES ($1, $2)',
          [newAssignment.id, grpId]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      assignment: {
        ...newAssignment,
        target_group_ids,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get all assignments (Personalized for students with course filtering & group leader permissions)
exports.getAllAssignments = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';
    const { course_id } = req.query;

    if (isStudent) {
      // Find the student's groups
      const myGroupsRes = await db.query(
        'SELECT group_id FROM group_members WHERE user_id = $1',
        [req.user.id]
      );
      const myGroupIds = myGroupsRes.rows.map((r) => r.group_id);

      // Build base query
      let assignmentQuery = `
        SELECT DISTINCT
          a.id, a.course_id, a.title, a.description, a.due_date, a.submission_type, a.onedrive_link, a.target_type, a.created_at,
          c.code as course_code, c.title as course_title, c.color_theme as course_color,
          u.name as creator_name
        FROM assignments a
        LEFT JOIN courses c ON a.course_id = c.id
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN assignment_group_targets agt ON a.id = agt.assignment_id
        WHERE 1=1
      `;

      const params = [];

      // Target filter
      if (myGroupIds.length > 0) {
        const placeholders = myGroupIds.map((_, i) => `$${params.length + i + 1}`).join(',');
        assignmentQuery += ` AND (a.target_type = 'all' OR agt.group_id IN (${placeholders}))`;
        params.push(...myGroupIds);
      } else {
        assignmentQuery += ` AND a.target_type = 'all'`;
      }

      // Course filter
      if (course_id) {
        params.push(course_id);
        assignmentQuery += ` AND a.course_id = $${params.length}`;
      }

      assignmentQuery += ` ORDER BY a.due_date ASC`;

      const assignmentsRes = await db.query(assignmentQuery, params);

      // Enrich each assignment with personal submission, group leader status, and group progress
      const enrichedAssignments = await Promise.all(
        assignmentsRes.rows.map(async (asgn) => {
          // Check personal submission record
          const subRes = await db.query(
            'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
            [asgn.id, req.user.id]
          );

          const submission = subRes.rows[0] || null;
          const isSubmitted = !!(submission && submission.confirmed_by_student);

          // Find student's group details if in any group
          let userGroup = null;
          let isLeader = false;
          let leaderInfo = null;

          if (myGroupIds.length > 0) {
            const grpRes = await db.query(
              `SELECT g.id, g.name, g.code, gm.role as member_role
               FROM groups g
               INNER JOIN group_members gm ON g.id = gm.group_id
               WHERE gm.user_id = $1 LIMIT 1`,
              [req.user.id]
            );
            if (grpRes.rows.length > 0) {
              userGroup = grpRes.rows[0];
              isLeader = userGroup.member_role === 'leader';

              // Find who the leader is
              const lRes = await db.query(
                `SELECT u.id, u.name, u.email 
                 FROM group_members gm 
                 INNER JOIN users u ON gm.user_id = u.id 
                 WHERE gm.group_id = $1 AND gm.role = 'leader' LIMIT 1`,
                [userGroup.id]
              );
              if (lRes.rows.length > 0) {
                leaderInfo = lRes.rows[0];
              }
            }
          }

          // Group Leader logic for group assignments:
          // If assignment is group-based:
          // - can_submit is true ONLY if user is the leader!
          // - If user is not leader, can_submit is false (displays "Awaiting leader submission")
          const isGroupAssignment = asgn.submission_type === 'group';
          const canSubmit = !isGroupAssignment ? true : isLeader;

          // Check if leader has acknowledged/submitted
          const acknowledgedByLeader = !!(submission && submission.acknowledged_by_leader);

          // Group Progress stats
          let groupProgress = null;
          if (userGroup) {
            const membersCountRes = await db.query(
              'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1',
              [userGroup.id]
            );
            const totalMembers = parseInt(membersCountRes.rows[0].count, 10);

            const submittedCountRes = await db.query(
              `SELECT COUNT(DISTINCT s.student_id) as count
               FROM submissions s
               INNER JOIN group_members gm ON s.student_id = gm.user_id
               WHERE s.assignment_id = $1 AND gm.group_id = $2 AND s.confirmed_by_student = TRUE`,
              [asgn.id, userGroup.id]
            );
            const submittedMembers = parseInt(submittedCountRes.rows[0].count, 10);
            const completionPercent = totalMembers > 0 ? Math.round((submittedMembers / totalMembers) * 100) : 0;

            groupProgress = {
              group_id: userGroup.id,
              group_name: userGroup.name,
              total_members: totalMembers,
              submitted_members: submittedMembers,
              completion_percent: completionPercent,
              is_fully_submitted: isGroupAssignment ? acknowledgedByLeader : submittedMembers === totalMembers && totalMembers > 0,
            };
          }

          // Status calculation
          const isOverdue = new Date(asgn.due_date) < new Date() && !isSubmitted;
          const status = isSubmitted ? 'completed' : isOverdue ? 'overdue' : 'pending';

          return {
            ...asgn,
            is_submitted: isSubmitted,
            submission,
            is_group_assignment: isGroupAssignment,
            is_leader: isLeader,
            can_submit: canSubmit,
            leader_name: leaderInfo ? leaderInfo.name : 'Group Leader',
            acknowledged_by_leader: acknowledgedByLeader,
            group_progress: groupProgress,
            status,
          };
        })
      );

      return res.json({
        success: true,
        assignments: enrichedAssignments,
      });
    }

    // Admin (Professor) view: all assignments with target info and submission counts
    let adminSql = `
      SELECT 
        a.id, a.course_id, a.title, a.description, a.due_date, a.submission_type, a.onedrive_link, a.target_type, a.created_at,
        c.code as course_code, c.title as course_title, c.color_theme as course_color,
        u.name as creator_name,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND confirmed_by_student = TRUE) as total_submissions
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;

    const adminParams = [];
    if (course_id) {
      adminParams.push(course_id);
      adminSql += ` AND a.course_id = $${adminParams.length}`;
    }

    adminSql += ` ORDER BY a.due_date ASC`;

    const adminAssignments = await db.query(adminSql, adminParams);

    // Fetch target groups for specific_groups assignments
    const detailed = await Promise.all(
      adminAssignments.rows.map(async (asgn) => {
        let targetGroups = [];
        if (asgn.target_type === 'specific_groups') {
          const tgtRes = await db.query(
            `SELECT g.id, g.name, g.code 
             FROM assignment_group_targets agt
             INNER JOIN groups g ON agt.group_id = g.id
             WHERE agt.assignment_id = $1`,
            [asgn.id]
          );
          targetGroups = tgtRes.rows;
        }

        return {
          ...asgn,
          target_groups: targetGroups,
        };
      })
    );

    return res.json({
      success: true,
      assignments: detailed,
    });
  } catch (err) {
    next(err);
  }
};

// Get single assignment by ID
exports.getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT a.*, c.code as course_code, c.title as course_title, u.name as creator_name, u.email as creator_email
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `;
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const assignment = result.rows[0];

    // Fetch target groups
    const tgtRes = await db.query(
      `SELECT g.id, g.name, g.code 
       FROM assignment_group_targets agt
       INNER JOIN groups g ON agt.group_id = g.id
       WHERE agt.assignment_id = $1`,
      [id]
    );

    // If student, attach student's personal submission
    let userSubmission = null;
    let isLeader = false;
    let leaderInfo = null;

    if (req.user.role === 'student') {
      const sub = await db.query(
        'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
        [id, req.user.id]
      );
      if (sub.rows.length > 0) {
        userSubmission = sub.rows[0];
      }

      // Check leader status
      const grpRes = await db.query(
        `SELECT g.id, g.name, gm.role 
         FROM group_members gm 
         INNER JOIN groups g ON gm.group_id = g.id 
         WHERE gm.user_id = $1 LIMIT 1`,
        [req.user.id]
      );
      if (grpRes.rows.length > 0) {
        isLeader = grpRes.rows[0].role === 'leader';
        const lRes = await db.query(
          `SELECT u.name FROM group_members gm INNER JOIN users u ON gm.user_id = u.id WHERE gm.group_id = $1 AND gm.role = 'leader' LIMIT 1`,
          [grpRes.rows[0].id]
        );
        if (lRes.rows.length > 0) leaderInfo = lRes.rows[0];
      }
    }

    return res.json({
      success: true,
      assignment: {
        ...assignment,
        target_groups: tgtRes.rows,
        user_submission: userSubmission,
        is_leader: isLeader,
        leader_name: leaderInfo ? leaderInfo.name : 'Group Leader',
        can_submit: assignment.submission_type !== 'group' || isLeader,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Update assignment (Admin only)
exports.updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      course_id,
      title,
      description,
      due_date,
      submission_type,
      onedrive_link,
      target_type = 'all',
      target_group_ids = [],
    } = req.body;

    const existing = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const current = existing.rows[0];
    const normalizedTarget = target_type === 'specific_groups' ? 'specific_groups' : 'all';
    const normalizedSubType = submission_type || current.submission_type || 'individual';

    const updateSql = `
      UPDATE assignments
      SET course_id = $1, title = $2, description = $3, due_date = $4, submission_type = $5, onedrive_link = $6, target_type = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    const result = await db.query(updateSql, [
      course_id !== undefined ? course_id : current.course_id,
      title ? title.trim() : current.title,
      description !== undefined ? description : current.description,
      due_date ? new Date(due_date).toISOString() : current.due_date,
      normalizedSubType,
      onedrive_link ? onedrive_link.trim() : current.onedrive_link,
      normalizedTarget,
      id,
    ]);

    // Update target groups
    await db.query('DELETE FROM assignment_group_targets WHERE assignment_id = $1', [id]);
    if (normalizedTarget === 'specific_groups' && Array.isArray(target_group_ids)) {
      for (const grpId of target_group_ids) {
        await db.query(
          'INSERT INTO assignment_group_targets (assignment_id, group_id) VALUES ($1, $2)',
          [id, grpId]
        );
      }
    }

    return res.json({
      success: true,
      message: 'Assignment updated successfully.',
      assignment: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Delete assignment (Admin only)
exports.deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM assignments WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    return res.json({
      success: true,
      message: 'Assignment deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
