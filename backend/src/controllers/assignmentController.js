const db = require('../config/db');

// Create new assignment (Admin only)
exports.createAssignment = async (req, res, next) => {
  try {
    const {
      title,
      description,
      due_date,
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

    // Insert assignment
    const insertSql = `
      INSERT INTO assignments (title, description, due_date, onedrive_link, target_type, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, description, due_date, onedrive_link, target_type, created_by, created_at
    `;
    const result = await db.query(insertSql, [
      title.trim(),
      description ? description.trim() : null,
      new Date(due_date).toISOString(),
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

// Get all assignments (Personalized for students based on group membership & submissions)
exports.getAllAssignments = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    if (isStudent) {
      // Find the student's groups
      const myGroupsRes = await db.query(
        'SELECT group_id FROM group_members WHERE user_id = $1',
        [req.user.id]
      );
      const myGroupIds = myGroupsRes.rows.map((r) => r.group_id);

      // Fetch assignments that are targeted to 'all' OR to any of the student's groups
      let assignmentQuery = `
        SELECT DISTINCT
          a.id, a.title, a.description, a.due_date, a.onedrive_link, a.target_type, a.created_at,
          u.name as creator_name
        FROM assignments a
        LEFT JOIN users u ON a.created_by = u.id
        LEFT JOIN assignment_group_targets agt ON a.id = agt.assignment_id
        WHERE a.target_type = 'all'
      `;

      const params = [];
      if (myGroupIds.length > 0) {
        // PostgreSQL handles ANY or multiple params; for universal compat:
        const placeholders = myGroupIds.map((_, i) => `$${i + 1}`).join(',');
        assignmentQuery = `
          SELECT DISTINCT
            a.id, a.title, a.description, a.due_date, a.onedrive_link, a.target_type, a.created_at,
            u.name as creator_name
          FROM assignments a
          LEFT JOIN users u ON a.created_by = u.id
          LEFT JOIN assignment_group_targets agt ON a.id = agt.assignment_id
          WHERE a.target_type = 'all' OR agt.group_id IN (${placeholders})
          ORDER BY a.due_date ASC
        `;
        params.push(...myGroupIds);
      } else {
        assignmentQuery += ` ORDER BY a.due_date ASC`;
      }

      const assignmentsRes = await db.query(assignmentQuery, params);

      // Enhance assignments with submission status and group progress
      const enrichedAssignments = await Promise.all(
        assignmentsRes.rows.map(async (asgn) => {
          // Check personal submission
          const subRes = await db.query(
            'SELECT id, confirmation_step1, confirmation_step2, confirmed_by_student, submitted_at, notes FROM submissions WHERE assignment_id = $1 AND student_id = $2',
            [asgn.id, req.user.id]
          );

          const isSubmitted = subRes.rows.length > 0 && subRes.rows[0].confirmed_by_student;
          const submission = subRes.rows[0] || null;

          // Check group progress if user belongs to a group
          let groupProgress = null;
          if (myGroupIds.length > 0) {
            const primaryGroupId = myGroupIds[0]; // Primary group
            const grpInfoRes = await db.query('SELECT name FROM groups WHERE id = $1', [primaryGroupId]);
            const membersCountRes = await db.query(
              'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1',
              [primaryGroupId]
            );
            const totalMembers = parseInt(membersCountRes.rows[0].count, 10);

            const submittedCountRes = await db.query(
              `SELECT COUNT(DISTINCT s.student_id) as count
               FROM submissions s
               INNER JOIN group_members gm ON s.student_id = gm.user_id
               WHERE s.assignment_id = $1 AND gm.group_id = $2 AND s.confirmed_by_student = TRUE`,
              [asgn.id, primaryGroupId]
            );
            const submittedMembers = parseInt(submittedCountRes.rows[0].count, 10);
            const completionPercent = totalMembers > 0 ? Math.round((submittedMembers / totalMembers) * 100) : 0;

            groupProgress = {
              group_id: primaryGroupId,
              group_name: grpInfoRes.rows[0]?.name || 'My Group',
              total_members: totalMembers,
              submitted_members: submittedMembers,
              completion_percent: completionPercent,
              is_fully_submitted: submittedMembers === totalMembers && totalMembers > 0,
            };
          }

          // Determine status: Submitted, Overdue, or Pending
          const isOverdue = new Date(asgn.due_date) < new Date() && !isSubmitted;
          const status = isSubmitted ? 'completed' : isOverdue ? 'overdue' : 'pending';

          return {
            ...asgn,
            is_submitted: isSubmitted,
            submission,
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

    // Admin view: all assignments with aggregate stats and target group info
    const adminSql = `
      SELECT 
        a.id, a.title, a.description, a.due_date, a.onedrive_link, a.target_type, a.created_at,
        u.name as creator_name,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND confirmed_by_student = TRUE) as total_submissions
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `;
    const adminAssignments = await db.query(adminSql);

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
      SELECT a.*, u.name as creator_name, u.email as creator_email
      FROM assignments a
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
    if (req.user.role === 'student') {
      const sub = await db.query(
        'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
        [id, req.user.id]
      );
      if (sub.rows.length > 0) {
        userSubmission = sub.rows[0];
      }
    }

    return res.json({
      success: true,
      assignment: {
        ...assignment,
        target_groups: tgtRes.rows,
        user_submission: userSubmission,
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
      title,
      description,
      due_date,
      onedrive_link,
      target_type = 'all',
      target_group_ids = [],
    } = req.body;

    const existing = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const normalizedTarget = target_type === 'specific_groups' ? 'specific_groups' : 'all';

    const updateSql = `
      UPDATE assignments
      SET title = $1, description = $2, due_date = $3, onedrive_link = $4, target_type = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const result = await db.query(updateSql, [
      title ? title.trim() : existing.rows[0].title,
      description !== undefined ? description : existing.rows[0].description,
      due_date ? new Date(due_date).toISOString() : existing.rows[0].due_date,
      onedrive_link ? onedrive_link.trim() : existing.rows[0].onedrive_link,
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
