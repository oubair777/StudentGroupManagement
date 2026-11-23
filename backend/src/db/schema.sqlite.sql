-- SQLite Database Schema for Local Evaluation & Testing Fallback

DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS assignment_group_targets;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    onedrive_link TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'specific_groups')),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_group_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, group_id)
);

CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    confirmation_step1 INTEGER DEFAULT 1,
    confirmation_step2 INTEGER DEFAULT 1,
    confirmed_by_student INTEGER DEFAULT 1,
    notes TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_assignments_target_type ON assignments(target_type);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_group_id ON submissions(group_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
