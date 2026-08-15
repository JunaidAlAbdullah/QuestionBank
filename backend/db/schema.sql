-- Question Bank database schema
-- Run with: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS question_bank
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE question_bank;

-- ---------------------------------------------------------------------------
-- users
-- Real name/email are never exposed publicly. `username` is the public,
-- pseudonymous handle shown on questions and profile pages so the platform
-- can stay anonymous while still letting students browse "who uploaded what".
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  student_id      VARCHAR(20)   NOT NULL UNIQUE, -- format: 2024-3-60-082
  username        VARCHAR(40)   NOT NULL UNIQUE, -- public pseudonymous handle
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------------
CREATE TABLE departments (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(150) NOT NULL,
  code  VARCHAR(20)  NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- faculties  (individual faculty members, tied to a department)
-- ---------------------------------------------------------------------------
CREATE TABLE faculties (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  department_id  INT NULL,
  CONSTRAINT fk_faculties_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL,
  INDEX idx_faculties_name (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
CREATE TABLE courses (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  course_code    VARCHAR(20)  NOT NULL UNIQUE, -- always stored upper-case, no spaces
  course_name    VARCHAR(150) NOT NULL,
  department_id  INT NULL,
  CONSTRAINT fk_courses_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL,
  INDEX idx_courses_code (course_code),
  INDEX idx_courses_name (course_name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- semesters
-- ---------------------------------------------------------------------------
CREATE TABLE semesters (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(20) NOT NULL,   -- Spring / Summer / Fall
  year  INT NOT NULL,
  UNIQUE KEY uq_semester (name, year)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- questions
-- ---------------------------------------------------------------------------
CREATE TABLE questions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  content_type   ENUM(
                   'quiz_question','mid_question','final_question',
                   'assignment_question','term_paper','lab_report',
                   'quiz_solution','mid_solution','final_solution',
                   'project_report','presentation_slide'
                 ) NOT NULL,
  course_id      INT NOT NULL,
  faculty_id     INT NULL,
  semester_id    INT NOT NULL,
  year           SMALLINT NOT NULL,
  description    TEXT NULL,
  question_text  TEXT NULL,
  file_url       VARCHAR(500) NULL,
  file_name      VARCHAR(255) NULL,
  uploaded_by    INT NOT NULL,
  views          INT NOT NULL DEFAULT 0,
  downloads      INT NOT NULL DEFAULT 0,
  blessings_count INT NOT NULL DEFAULT 0,
  is_removed     TINYINT(1) NOT NULL DEFAULT 0, -- soft delete / admin moderation
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_questions_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL,
  CONSTRAINT fk_questions_semester
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  CONSTRAINT fk_questions_user
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_questions_course (course_id),
  INDEX idx_questions_faculty (faculty_id),
  INDEX idx_questions_semester (semester_id),
  INDEX idx_questions_year (year),
  INDEX idx_questions_content_type (content_type),
  INDEX idx_questions_uploaded_by (uploaded_by),
  FULLTEXT INDEX ft_questions_search (title, question_text, description)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- question_files
-- Supports multi-page questions (e.g. a 2-page scanned exam) as an ordered
-- set of image files attached to one question, instead of forcing a single
-- file. A question with one PDF just gets a single row here too.
-- ---------------------------------------------------------------------------
CREATE TABLE question_files (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  question_id  INT NOT NULL,
  file_url     VARCHAR(500) NOT NULL,
  file_name    VARCHAR(255) NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_files_question
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question_files_question (question_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- bookmarks
-- ---------------------------------------------------------------------------
CREATE TABLE bookmarks (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  question_id  INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmarks_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_question
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_bookmark (user_id, question_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- blessings ("thanks" a student can give an uploader, once per question)
-- ---------------------------------------------------------------------------
CREATE TABLE blessings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  question_id  INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_blessings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_blessings_question
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_blessing (user_id, question_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
CREATE TABLE reports (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  question_id  INT NOT NULL,
  reason       VARCHAR(500) NOT NULL,
  status       ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_question
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_reports_status (status)
) ENGINE=InnoDB;
