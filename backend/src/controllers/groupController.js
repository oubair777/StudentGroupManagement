const db = require('../config/db');

// Generate short random group code (e.g. GRP-4A8F)
function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'GRP-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new group (Student creates group and becomes 'leader')
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    const code = generateGroupCode();

    // Insert group
    const insertGroupSql = `
      INSERT INTO groups (name, description, code, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, code, created_by, created_at
    `;
    const groupRes = await db.query(insertGroupSql, [
      name.trim(),
      description ? description.trim() : null,
      code,
      req.user.id,
    ]);

    const newGroup = groupRes.rows[0];

    // Add creator as leader
    await db.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'leader')`,
      [newGroup.id, req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      group: {
        ...newGroup,
        members_count: 1,
        user_role: 'leader',
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get current user's groups (with members and current progress)
exports.getMyGroups = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        g.id, g.name, g.description, g.code, g.created_by, g.created_at,
        gm.role as my_role, gm.joined_at,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
      ORDER BY g.created_at DESC
    `;
    const result = await db.query(sql, [req.user.id]);

    // For each group, also fetch member details
    const groupsWithMembers = await Promise.all(
      result.rows.map(async (grp) => {
        const memSql = `
          SELECT u.id, u.name, u.email, u.student_id, gm.role, gm.joined_at
          FROM group_members gm
          INNER JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1
          ORDER BY gm.role DESC, gm.joined_at ASC
        `;
        const membersRes = await db.query(memSql, [grp.id]);
        return {
          ...grp,
          members: membersRes.rows,
        };
      })
    );

    return res.json({
      success: true,
      groups: groupsWithMembers,
    });
  } catch (err) {
    next(err);
  }
};

// Get all groups (For Admin / Professor view and assignment targeting)
exports.getAllGroups = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        g.id, g.name, g.description, g.code, g.created_at,
        u.name as creator_name, u.email as creator_email,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      ORDER BY g.created_at DESC
    `;
    const result = await db.query(sql);

    // Fetch members for each group
    const groupsWithMembers = await Promise.all(
      result.rows.map(async (grp) => {
        const memSql = `
          SELECT u.id, u.name, u.email, u.student_id, gm.role, gm.joined_at
          FROM group_members gm
          INNER JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1
          ORDER BY gm.role DESC, gm.joined_at ASC
        `;
        const membersRes = await db.query(memSql, [grp.id]);
        return {
          ...grp,
          members: membersRes.rows,
        };
      })
    );

    return res.json({
      success: true,
      groups: groupsWithMembers,
    });
  } catch (err) {
    next(err);
  }
};

// Get single group details
exports.getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const groupSql = `
      SELECT g.id, g.name, g.description, g.code, g.created_by, g.created_at,
             u.name as creator_name, u.email as creator_email
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = $1
    `;
    const groupRes = await db.query(groupSql, [id]);

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const group = groupRes.rows[0];

    const memSql = `
      SELECT u.id, u.name, u.email, u.student_id, gm.role, gm.joined_at
      FROM group_members gm
      INNER JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.role DESC, gm.joined_at ASC
    `;
    const membersRes = await db.query(memSql, [id]);

    return res.json({
      success: true,
      group: {
        ...group,
        members: membersRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Add / Invite member to group (via student email or student ID)
exports.addMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { identifier } = req.body; // email or student_id

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student email or Student ID is required to invite.',
      });
    }

    // Check if group exists
    const groupCheck = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // If caller is student, verify they are a member/leader of this group
    if (req.user.role === 'student') {
      const callerMembership = await db.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, req.user.id]
      );
      if (callerMembership.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group.',
        });
      }
    }

    // Find student by email OR student_id
    const targetQuery = identifier.trim().toLowerCase();
    const studentUser = await db.query(
      `SELECT id, name, email, student_id, role 
       FROM users 
       WHERE role = 'student' 
         AND (LOWER(email) = $1 OR LOWER(student_id) = $2)`,
      [targetQuery, targetQuery]
    );

    if (studentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No student found with Email or Student ID: "${identifier}".`,
      });
    }

    const student = studentUser.rows[0];

    // Check if already in this group
    const alreadyMember = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, student.id]
    );
    if (alreadyMember.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `${student.name} is already a member of this group.`,
      });
    }

    // Add to group
    await db.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')`,
      [groupId, student.id]
    );

    return res.status(201).json({
      success: true,
      message: `Student ${student.name} (${student.student_id || student.email}) added to group.`,
      member: {
        id: student.id,
        name: student.name,
        email: student.email,
        student_id: student.student_id,
        role: 'member',
      },
    });
  } catch (err) {
    next(err);
  }
};

// Remove member or leave group
exports.removeMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;

    // Check group
    const group = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (group.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const targetUserId = parseInt(userId, 10);

    // Permission check: Admin can remove anyone, caller can remove themselves (leave),
    // or group leader can remove members.
    if (req.user.role === 'student' && req.user.id !== targetUserId) {
      const leaderCheck = await db.query(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'leader'",
        [groupId, req.user.id]
      );
      if (leaderCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Only the group leader or admin can remove other members.',
        });
      }
    }

    await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [
      groupId,
      targetUserId,
    ]);

    // If no members remain in group, delete group
    const remaining = await db.query('SELECT COUNT(*) as count FROM group_members WHERE group_id = $1', [
      groupId,
    ]);
    if (parseInt(remaining.rows[0].count, 10) === 0) {
      await db.query('DELETE FROM groups WHERE id = $1', [groupId]);
    }

    return res.json({
      success: true,
      message: 'Member removed from group successfully.',
    });
  } catch (err) {
    next(err);
  }
};
