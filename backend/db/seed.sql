-- Optional starter data. Safe to run once after schema.sql.
USE question_bank;

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
  ('Population Sciences and Human Security', 'PPHS')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO courses (course_code, course_name, department_id) VALUES
  ('CSE325', 'Operating System', (SELECT id FROM departments WHERE code = 'CSE')),
  ('CSE251', 'Electronic Circuits', (SELECT id FROM departments WHERE code = 'CSE')),
  ('CSE115', 'Programming Language I', (SELECT id FROM departments WHERE code = 'CSE')),
  ('EEE101', 'Circuit Analysis', (SELECT id FROM departments WHERE code = 'EEE')),
  ('BUS201', 'Principles of Management', (SELECT id FROM departments WHERE code = 'BBA'))
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name);

INSERT INTO faculties (name, department_id) VALUES
  ('Dr. Rahman', (SELECT id FROM departments WHERE code = 'CSE')),
  ('Dr. Karim', (SELECT id FROM departments WHERE code = 'CSE')),
  ('Ms. Sultana', (SELECT id FROM departments WHERE code = 'EEE')),
  ('Mr. Hasan', (SELECT id FROM departments WHERE code = 'BBA'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO semesters (name, year) VALUES
  ('Spring', 2025),
  ('Summer', 2025),
  ('Fall', 2025),
  ('Spring', 2026)
ON DUPLICATE KEY UPDATE name = VALUES(name);
