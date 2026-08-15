-- ============================================================================
-- update_departments_and_content_types.sql
--
-- Run this ONCE in MySQL Workbench against your EXISTING question_bank
-- database. It does two things:
--   1. Replaces the department list with your new set (ICE, CSE, EEE,
--      PHARMACY, GEB, CE, MATHEMATICS, DSA, BBA, ENGLISH, SOCIOLOGY, IS,
--      LLB, PPHS).
--   2. Adds "Project Report" and "Presentation Slide" as content types.
--
-- Safe to run even if you already have courses/faculties/questions saved —
-- nothing gets deleted except the old department rows themselves. Any
-- course/faculty that pointed at an old department just becomes
-- "no department" (NULL) instead of being deleted.
-- ============================================================================

USE question_bank;

-- 1) Allow the two new content types on the questions table.
--    (Lists every existing value too — MySQL replaces the whole ENUM list,
--    it doesn't "append" to it.)
ALTER TABLE questions MODIFY content_type ENUM(
  'quiz_question','mid_question','final_question',
  'assignment_question','term_paper','lab_report',
  'quiz_solution','mid_solution','final_solution',
  'project_report','presentation_slide'
) NOT NULL;

-- 2) Replace the department list.
-- MySQL Workbench's "Safe Update Mode" blocks DELETE/UPDATE statements that
-- don't filter by a key column, even when you mean it. These two lines
-- turn that safety check off just for this script, then back on at the end.
SET SQL_SAFE_UPDATES = 0;

DELETE FROM departments;

INSERT INTO departments (name, code) VALUES
  ('Information and Communication Engineering', 'ICE'),
  ('Computer Science and Engineering', 'CSE'),
  ('Electrical and Electronic Engineering', 'EEE'),
  ('Pharmacy', 'PHARMACY'),
  ('Genetic Engineering and Biotechnology', 'GEB'),
  ('Civil Engineering', 'CE'),
  ('Mathematics', 'MATHEMATICS'),
  ('Data Science and Analytics', 'DSA'),
  ('Business Administration', 'BBA'),
  ('English', 'ENGLISH'),
  ('Sociology', 'SOCIOLOGY'),
  ('Information Systems', 'IS'),
  ('Law', 'LLB'),
  ('Population Sciences and Human Security', 'PPHS');

SET SQL_SAFE_UPDATES = 1;

-- Done. Check the results:
SELECT * FROM departments ORDER BY name;
