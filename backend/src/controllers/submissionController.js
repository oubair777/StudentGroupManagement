const db = require('../config/db');

// Two-step submission confirmation by student (With Group Leader Acknowledgment Rule)
exports.confirmSubmission = async (req, res, next) => {
  try {
    const { assignment_id, confirmation_step1, confirmation_step2, notes } = req.body;

    if (!assignment_id) {
      return res.status(400).json({ success: false, message: 'Assignment ID is required.' });
    }

    // Two-step verification check
    if (!confirmation_step1 || !confirmation_step2) {
      return res.status(400).json({
        success: false,
        message:
          'Two-step verification required: Both Step 1 ("Yes, I have uploaded to OneDrive") and Step 2 ("Confirm Final Submission") must be completed.',
      });
    }

    // Verify assignment exists and check its submission type
    const asgnRes = await db.query('SELECT * FROM assignments WHERE id = $1', [assignment_id]);
    if (asgnRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const assignment = asgnRes.rows[0];
    const isGroupAssignment = assignment.submission_type === 'group';

    // Find student's group
    const groupRes = await db.query(
      `SELECT g.id, g.name, gm.role 
       FROM group_members gm 
       INNER JOIN groups g ON gm.group_id = g.id 
       WHERE gm.user_id = $1 LIMIT 1`,
      [req.user.id]
    );

    const userGroup = groupRes.rows[0] || null;
    const groupId = userGroup ? userGroup.id : null;

    // Group Assignment Rule: Only the Group Leader can acknowledge and submit!
    if (isGroupAssignment) {
      if (!userGroup) {
        return res.status(400).json({
          success: false,
          message: 'This is a group assignment. You must create or join a group before submitting.',
        });
      }

      if (userGroup.role !== 'leader') {
        // Find leader's name
        const leaderRes = await db.query(
          `SELECT u.name FROM group_members gm INNER JOIN users u ON gm.user_id = u.id WHERE gm.group_id = $1 AND gm.role = 'leader' LIMIT 1`,
          [groupId]
        );
        const leaderName = leaderRes.rows[0]?.name || 'your Group Leader';

        return res.status(403).json({
          success: false,
          message: `Group Assignment: Only the group leader (${leaderName}) can acknowledge and submit for the group.`,
        });
      }
    }

    // Upsert Leader / Individual submission
    const existing = await db.query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment_id, req.user.id]
    );

    let submissionRecord;
    const isAckByLeader = isGroupAssignment;
    const ackById = isGroupAssignment ? req.user.id : null;

    if (existing.rows.length > 0) {
      const updateSql = `
        UPDATE submissions
        SET course_id = $1,
            submission_type = $2,
            group_id = $3,
            acknowledged_by_leader = $4,
            acknowledged_by_id = $5,
            confirmation_step1 = TRUE,
            confirmation_step2 = TRUE,
            confirmed_by_student = TRUE,
            notes = $6,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `;
      const updateRes = await db.query(updateSql, [
        assignment.course_id,
        assignment.submission_type,
        groupId,
        isAckByLeader,
        ackById,
        notes || null,
        existing.rows[0].id,
      ]);
      submissionRecord = updateRes.rows[0];
    } else {
      const insertSql = `
        INSERT INTO submissions (assignment_id, course_id, submission_type, group_id, student_id, acknowledged_by_leader, acknowledged_by_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE, TRUE, $8)
        RETURNING *
      `;
      const insertRes = await db.query(insertSql, [
        assignment_id,
        assignment.course_id,
        assignment.submission_type,
        groupId,
        req.user.id,
        isAckByLeader,
        ackById,
        notes || null,
      ]);
      submissionRecord = insertRes.rows[0];
    }

    // REFLECT ACROSS ALL GROUP MEMBERS:
    // If this is a group assignment, automatically acknowledge & submit for all fellow group members!
    if (isGroupAssignment && groupId) {
      const membersRes = await db.query(
        'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id != $2',
        [groupId, req.user.id]
      );

      for (const m of membersRes.rows) {
        const memExisting = await db.query(
          'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
          [assignment_id, m.user_id]
        );

        const memberNote = `Acknowledged and submitted by Group Leader ${req.user.name} for team ${userGroup.name}${notes ? ` ("${notes}")` : ''}`;

        if (memExisting.rows.length > 0) {
          await db.query(
            `UPDATE submissions
             SET course_id = $1,
                 submission_type = 'group',
                 group_id = $2,
                 acknowledged_by_leader = TRUE,
                 acknowledged_by_id = $3,
                 confirmation_step1 = TRUE,
                 confirmation_step2 = TRUE,
                 confirmed_by_student = TRUE,
                 notes = $4,
                 submitted_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [assignment.course_id, groupId, req.user.id, memberNote, memExisting.rows[0].id]
          );
        } else {
          await db.query(
            `INSERT INTO submissions (assignment_id, course_id, submission_type, group_id, student_id, acknowledged_by_leader, acknowledged_by_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
             VALUES ($1, $2, 'group', $3, $4, TRUE, $5, TRUE, TRUE, TRUE, $6)`,
            [assignment_id, assignment.course_id, groupId, m.user_id, req.user.id, memberNote]
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: isGroupAssignment
        ? `Group submission confirmed! Acknowledgment reflected across all members of ${userGroup.name}.`
        : 'Individual assignment submission successfully confirmed via two-step verification!',
      submission: submissionRecord,
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Track group-wise and student-wise submission confirmations
exports.getSubmissionsTracker = async (req, res, next) => {
  try {
    const { course_id, assignment_id, group_id, status_filter } = req.query;

    let studentSubmissionsSql = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.student_id as student_id_code,
        g.id as group_id,
        g.name as group_name,
        a.id as assignment_id,
        a.title as assignment_title,
        a.submission_type,
        a.due_date,
        c.id as course_id,
        c.code as course_code,
        c.title as course_title,
        s.id as submission_id,
        s.confirmation_step1,
        s.confirmation_step2,
        s.confirmed_by_student,
        s.acknowledged_by_leader,
        ack_u.name as acknowledged_by_name,
        s.submitted_at,
        s.notes,
        CASE 
          WHEN s.confirmed_by_student = TRUE THEN 'submitted'
          WHEN a.due_date < CURRENT_TIMESTAMP THEN 'overdue'
          ELSE 'pending'
        END as status
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.user_id
      LEFT JOIN groups g ON gm.group_id = g.id
      CROSS JOIN assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = u.id
      LEFT JOIN users ack_u ON s.acknowledged_by_id = ack_u.id
      WHERE u.role = 'student'
    `;

    const conditions = [];
    const params = [];

    if (course_id) {
      params.push(course_id);
      conditions.push(`a.course_id = $${params.length}`);
    }

    if (assignment_id) {
      params.push(assignment_id);
      conditions.push(`a.id = $${params.length}`);
    }

    if (group_id) {
      params.push(group_id);
      conditions.push(`g.id = $${params.length}`);
    }

    if (conditions.length > 0) {
      studentSubmissionsSql += ` AND ${conditions.join(' AND ')}`;
    }

    studentSubmissionsSql += ` ORDER BY a.id ASC, g.name ASC, u.name ASC`;

    const studentList = await db.query(studentSubmissionsSql, params);

    // Filter by status if requested (submitted / pending / overdue)
    let filteredStudents = studentList.rows;
    if (status_filter && status_filter !== 'all') {
      filteredStudents = filteredStudents.filter((s) => s.status === status_filter);
    }

    // Group-wise aggregations
    let groupAggSql = `
      SELECT 
        g.id as group_id,
        g.name as group_name,
        a.id as assignment_id,
        a.title as assignment_title,
        a.submission_type,
        a.due_date,
        c.code as course_code,
        COUNT(DISTINCT gm.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN s.confirmed_by_student = TRUE THEN s.student_id END) as confirmed_count,
        MAX(CASE WHEN s.acknowledged_by_leader = TRUE THEN 1 ELSE 0 END) as is_leader_acknowledged,
        CASE 
          WHEN COUNT(DISTINCT gm.user_id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN s.confirmed_by_student = TRUE THEN s.student_id END) * 100.0) / COUNT(DISTINCT gm.user_id))
        END as completion_percentage
      FROM groups g
      CROSS JOIN assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = gm.user_id AND s.confirmed_by_student = TRUE
    `;

    const groupConditions = [];
    const groupParams = [];

    if (course_id) {
      groupParams.push(course_id);
      groupConditions.push(`a.course_id = $${groupParams.length}`);
    }

    if (assignment_id) {
      groupParams.push(assignment_id);
      groupConditions.push(`a.id = $${groupParams.length}`);
    }

    if (group_id) {
      groupParams.push(group_id);
      groupConditions.push(`g.id = $${groupParams.length}`);
    }

    if (groupConditions.length > 0) {
      groupAggSql += ` WHERE ${groupConditions.join(' AND ')}`;
    }

    groupAggSql += `
      GROUP BY g.id, g.name, a.id, a.title, a.submission_type, a.due_date, c.code
      ORDER BY a.id ASC, completion_percentage DESC
    `;

    const groupList = await db.query(groupAggSql, groupParams);

    return res.json({
      success: true,
      student_submissions: filteredStudents,
      group_summaries: groupList.rows.map((grp) => ({
        ...grp,
        total_members: parseInt(grp.total_members, 10),
        confirmed_count: parseInt(grp.confirmed_count, 10),
        completion_percentage: parseFloat(grp.completion_percentage || 0),
        is_leader_acknowledged: parseInt(grp.is_leader_acknowledged, 10) === 1,
        is_all_confirmed: parseInt(grp.confirmed_count, 10) === parseInt(grp.total_members, 10) && parseInt(grp.total_members, 10) > 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// Get current student's submissions history
exports.getMySubmissions = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        s.*,
        a.title as assignment_title,
        a.due_date,
        a.onedrive_link,
        a.submission_type,
        c.code as course_code,
        c.title as course_title,
        g.name as group_name
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC
    `;
    const result = await db.query(sql, [req.user.id]);

    return res.json({
      success: true,
      submissions: result.rows,
    });
  } catch (err) {
    next(err);
  }
};
