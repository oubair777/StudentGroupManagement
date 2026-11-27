-- PostgreSQL Database Schema for Joineazy Student, Group & Assignment Management System (Round 2)

DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignment_group_targets CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table (New in Round 2)
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester VARCHAR(50) DEFAULT 'Fall 2026',
    department VARCHAR(100) DEFAULT 'Computer Science',
    color_theme VARCHAR(50) DEFAULT 'indigo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course Enrollments table (Associates students with courses)
CREATE TABLE course_enrollments (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_course_student UNIQUE (course_id, student_id)
);

-- Groups table (Associated with a course)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE NOT NULL,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group Members table (With roles: leader vs member)
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_group_user UNIQUE (group_id, user_id)
);

-- Assignments table (Associated with courses and submission type: individual or group)
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (submission_type IN ('individual', 'group')),
    onedrive_link TEXT NOT NULL,
    target_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'specific_groups')),
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Target Groups for Assignments (when target_type = 'specific_groups')
CREATE TABLE assignment_group_targets (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT unique_assignment_group UNIQUE (assignment_id, group_id)
);

-- Submissions table with Group Leader Acknowledgment tracking
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL,
    submission_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (submission_type IN ('individual', 'group')),
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    acknowledged_by_leader BOOLEAN DEFAULT FALSE,
    acknowledged_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    confirmation_step1 BOOLEAN DEFAULT TRUE,
    confirmation_step2 BOOLEAN DEFAULT TRUE,
    confirmed_by_student BOOLEAN DEFAULT TRUE,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

-- Indexes for maximum query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_groups_course ON groups(course_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_submission_type ON assignments(submission_type);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_group_id ON submissions(group_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
