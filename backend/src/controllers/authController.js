const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', student_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const normalizedRole = role.toLowerCase() === 'admin' ? 'admin' : 'student';

    // Normalize student_id: if role is student and none provided, auto-generate one
    let finalStudentId = student_id ? student_id.trim() : null;
    if (normalizedRole === 'student' && !finalStudentId) {
      finalStudentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Check if email already registered
    const existingEmail = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Check if student_id already taken
    if (finalStudentId) {
      const existingId = await db.query('SELECT id FROM users WHERE student_id = $1', [finalStudentId]);
      if (existingId.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Student ID already in use. Please provide a unique ID.',
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertSql = `
      INSERT INTO users (name, email, password, role, student_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, student_id, created_at
    `;
    const insertRes = await db.query(insertSql, [
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      normalizedRole,
      finalStudentId,
    ]);

    const newUser = insertRes.rows[0];

    // Generate JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        student_id: newUser.student_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        student_id: newUser.student_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const result = await db.query(
      'SELECT id, name, email, password, role, student_id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get current user profile + groups
exports.getProfile = async (req, res, next) => {
  try {
    const userRes = await db.query(
      'SELECT id, name, email, role, student_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userRes.rows[0];

    // Fetch user groups
    const groupSql = `
      SELECT g.id, g.name, g.code, g.description, gm.role as member_role, gm.joined_at
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
    `;
    const groupsRes = await db.query(groupSql, [req.user.id]);

    return res.json({
      success: true,
      user: {
        ...user,
        groups: groupsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Search / list students for group invites (by email or student_id or name)
exports.searchStudents = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.json({ success: true, students: [] });
    }

    const searchTerm = `%${query.trim()}%`;
    const sql = `
      SELECT id, student_id, name, email
      FROM users
      WHERE role = 'student'
        AND id != $1
        AND (name ILIKE $2 OR email ILIKE $3 OR student_id ILIKE $4)
      LIMIT 10
    `;
    const result = await db.query(sql, [req.user.id, searchTerm, searchTerm, searchTerm]);

    return res.json({
      success: true,
      students: result.rows,
    });
  } catch (err) {
    next(err);
  }
};
