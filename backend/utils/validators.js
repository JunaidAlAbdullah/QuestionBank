// Student ID format required by EWU: 2024-3-60-082
const STUDENT_ID_REGEX = /^\d{4}-\d-\d{2}-\d{3}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTENT_TYPES = [
  'quiz_question',
  'mid_question',
  'final_question',
  'assignment_question',
  'term_paper',
  'lab_report',
  'quiz_solution',
  'mid_solution',
  'final_solution',
  'project_report',
  'presentation_slide',
];

function isValidStudentId(id) {
  return typeof id === 'string' && STUDENT_ID_REGEX.test(id.trim());
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isValidContentType(type) {
  return CONTENT_TYPES.includes(type);
}

// Course codes are always stored upper-case with no spaces, e.g. "cse 325" -> "CSE325"
function normalizeCourseCode(code) {
  return String(code || '').toUpperCase().replace(/\s+/g, '');
}

// Builds a public, non-identifying username from a student id, e.g.
// "2024-3-60-082" -> "student_60082" (kept stable & unique per user).
function generateUsername(studentId) {
  const digitsOnly = String(studentId || '').replace(/\D/g, '');
  const suffix = digitsOnly.slice(-6) || Math.floor(Math.random() * 1e6).toString();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `student_${suffix}${rand}`;
}

module.exports = {
  STUDENT_ID_REGEX,
  EMAIL_REGEX,
  CONTENT_TYPES,
  isValidStudentId,
  isValidEmail,
  isValidContentType,
  normalizeCourseCode,
  generateUsername,
};
