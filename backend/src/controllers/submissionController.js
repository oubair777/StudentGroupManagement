const db = require('../config/db');

// Two-step submission confirmation by student
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

    // Verify assignment exists
    const asgnRes = await db.query('SELECT * FROM assignments WHERE id = $1', [assignment_id]);
    if (asgnRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Find student's group if any
    const groupRes = await db.query(
      'SELECT group_id FROM group_members WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );
    const groupId = groupRes.rows.length > 0 ? groupRes.rows[0].group_id : null;

    // Check if submission already exists
    const existing = await db.query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment_id, req.user.id]
    );

    let submissionRecord;
    if (existing.rows.length > 0) {
      // Update existing submission
      const updateSql = `
        UPDATE submissions
        SET confirmation_step1 = TRUE,
            confirmation_step2 = TRUE,
            confirmed_by_student = TRUE,
            group_id = $1,
            notes = $2,
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const updateRes = await db.query(updateSql, [groupId, notes || null, existing.rows[0].id]);
      submissionRecord = updateRes.rows[0];
    } else {
      // Insert new submission
      const insertSql = `
        INSERT INTO submissions (assignment_id, group_id, student_id, confirmation_step1, confirmation_step2, confirmed_by_student, notes)
        VALUES ($1, $2, $3, TRUE, TRUE, TRUE, $4)
        RETURNING *
      `;
      const insertRes = await db.query(insertSql, [
        assignment_id,
        groupId,
        req.user.id,
        notes || null,
      ]);
      submissionRecord = insertRes.rows[0];
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment submission successfully confirmed via two-step verification!',
      submission: submissionRecord,
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Track group-wise and student-wise submission confirmations
exports.getSubmissionsTracker = async (req, res, next) => {
  try {
    const { assignment_id, group_id } = req.query;

    // Build base queries
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
        a.due_date,
        s.id as submission_id,
        s.confirmation_step1,
        s.confirmation_step2,
        s.confirmed_by_student,
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
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = u.id
      WHERE u.role = 'student'
    `;

    const conditions = [];
    const params = [];

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

    // Group-wise aggregations
    let groupAggSql = `
      SELECT 
        g.id as group_id,
        g.name as group_name,
        a.id as assignment_id,
        a.title as assignment_title,
        a.due_date,
        COUNT(DISTINCT gm.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN s.confirmed_by_student = TRUE THEN s.student_id END) as confirmed_count,
        CASE 
          WHEN COUNT(DISTINCT gm.user_id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN s.confirmed_by_student = TRUE THEN s.student_id END) * 100.0) / COUNT(DISTINCT gm.user_id))
        END as completion_percentage
      FROM groups g
      CROSS JOIN assignments a
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = gm.user_id AND s.confirmed_by_student = TRUE
    `;

    const groupConditions = [];
    const groupParams = [];

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
      GROUP BY g.id, g.name, a.id, a.title, a.due_date
      ORDER BY a.id ASC, completion_percentage DESC
    `;

    const groupList = await db.query(groupAggSql, groupParams);

    return res.json({
      success: true,
      student_submissions: studentList.rows,
      group_summaries: groupList.rows.map((grp) => ({
        ...grp,
        total_members: parseInt(grp.total_members, 10),
        confirmed_count: parseInt(grp.confirmed_count, 10),
        completion_percentage: parseFloat(grp.completion_percentage || 0),
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
        g.name as group_name
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
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
