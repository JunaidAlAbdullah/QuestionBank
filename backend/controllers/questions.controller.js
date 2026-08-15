const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { isValidContentType } = require('../utils/validators');
const { findOrCreateCourse } = require('./courses.controller');
const { findOrCreateFaculty } = require('./faculties.controller');
const { findOrCreateSemester } = require('./semesters.controller');
const { UPLOAD_DIR } = require('../middleware/upload');

const SORT_MAP = {
  newest: 'q.created_at DESC',
  oldest: 'q.created_at ASC',
  most_viewed: 'q.views DESC',
  most_downloaded: 'q.downloads DESC',
};

const BASE_SELECT = `
  SELECT
    q.id, q.title, q.content_type, q.year, q.description, q.question_text,
    q.file_url, q.file_name, q.views, q.downloads, q.blessings_count,
    q.created_at, q.updated_at,
    c.id AS course_id, c.course_code, c.course_name,
    f.id AS faculty_id, f.name AS faculty_name,
    s.id AS semester_id, s.name AS semester_name, s.year AS semester_year,
    u.id AS uploader_id, u.username AS uploader_username
  FROM questions q
  JOIN courses c ON c.id = q.course_id
  LEFT JOIN faculties f ON f.id = q.faculty_id
  JOIN semesters s ON s.id = q.semester_id
  JOIN users u ON u.id = q.uploaded_by
`;

function shapeQuestion(row) {
  return {
    id: row.id,
    title: row.title,
    contentType: row.content_type,
    year: row.year,
    description: row.description,
    questionText: row.question_text,
    legacyFileUrl: row.file_url,
    legacyFileName: row.file_name,
    files: [],
    views: row.views,
    downloads: row.downloads,
    blessings: row.blessings_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    course: { id: row.course_id, code: row.course_code, name: row.course_name },
    faculty: row.faculty_id ? { id: row.faculty_id, name: row.faculty_name } : null,
    semester: { id: row.semester_id, name: row.semester_name, year: row.semester_year },
    uploader: { id: row.uploader_id, username: row.uploader_username },
  };
}

async function attachFiles(questions) {
  if (!questions.length) return questions;
  const ids = questions.map((q) => q.id);

  const [fileRows] = await pool.query(
    `SELECT id, question_id, file_url, file_name FROM question_files
     WHERE question_id IN (?) ORDER BY question_id, sort_order ASC, id ASC`,
    [ids]
  );

  const byQuestion = new Map();
  fileRows.forEach((f) => {
    if (!byQuestion.has(f.question_id)) byQuestion.set(f.question_id, []);
    byQuestion.get(f.question_id).push({ id: f.id, url: f.file_url, name: f.file_name });
  });

  questions.forEach((q) => {
    const files = byQuestion.get(q.id);
    if (files && files.length) {
      q.files = files;
    } else if (q.legacyFileUrl) {
      q.files = [{ id: null, url: q.legacyFileUrl, name: q.legacyFileName }];
    }
    delete q.legacyFileUrl;
    delete q.legacyFileName;
  });

  return questions;
}

async function attachFilesToOne(question) {
  await attachFiles([question]);
  return question;
}

const list = asyncHandler(async (req, res) => {
  const {
    search, course, faculty, department, semester, year, examType, sort, uploader,
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const where = ['q.is_removed = 0'];
  const params = [];

  if (search && search.trim()) {
    where.push('(c.course_code LIKE ? OR c.course_name LIKE ? OR f.name LIKE ? OR q.title LIKE ? OR q.question_text LIKE ?)');
    const like = `%${search.trim()}%`;
    params.push(like, like, like, like, like);
  }
  if (course) {
    where.push('c.course_code = ?');
    params.push(String(course).toUpperCase().replace(/\s+/g, ''));
  }
  if (faculty) {
    where.push('f.name LIKE ?');
    params.push(`%${faculty}%`);
  }
  if (department) {
    where.push('c.department_id = ?');
    params.push(department);
  }
  if (semester) {
    where.push('s.name = ?');
    params.push(semester);
  }
  if (year) {
    where.push('q.year = ?');
    params.push(year);
  }
  if (examType && isValidContentType(examType)) {
    where.push('q.content_type = ?');
    params.push(examType);
  }
  if (uploader) {
    where.push('u.username = ?');
    params.push(uploader);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = SORT_MAP[sort] || SORT_MAP.newest;

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM questions q
     JOIN courses c ON c.id = q.course_id
     LEFT JOIN faculties f ON f.id = q.faculty_id
     JOIN semesters s ON s.id = q.semester_id
     JOIN users u ON u.id = q.uploaded_by
     ${whereSql}`,
    params
  );

  const total = countRows[0].total;
  const questions = await attachFiles(rows.map(shapeQuestion));

  res.json({
    success: true,
    questions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(`${BASE_SELECT} WHERE q.id = ? AND q.is_removed = 0`, [id]);

  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }

  pool.query('UPDATE questions SET views = views + 1 WHERE id = ?', [id]).catch(() => {});

  const question = await attachFilesToOne(shapeQuestion(rows[0]));
  const isOwner = req.user ? req.user.id === rows[0].uploader_id : false;

  let bookmarked = false;
  let blessed = false;
  if (req.user) {
    const [b] = await pool.query('SELECT id FROM bookmarks WHERE user_id = ? AND question_id = ?', [req.user.id, id]);
    bookmarked = b.length > 0;
    const [bl] = await pool.query('SELECT id FROM blessings WHERE user_id = ? AND question_id = ?', [req.user.id, id]);
    blessed = bl.length > 0;
  }

  res.json({ success: true, question: { ...question, isOwner, bookmarked, blessed } });
});

function validateFileBatch(files) {
  if (!files || !files.length) return null;
  if (files.length > 2) {
    return 'You can attach at most 2 images. If your question is longer than that, please combine it into one PDF instead.';
  }
  const hasPdf = files.some((f) => f.mimetype === 'application/pdf');
  if (hasPdf && files.length > 1) {
    return 'A PDF must be uploaded on its own, not alongside images.';
  }
  return null;
}

function cleanupFiles(files) {
  (files || []).forEach((f) => fs.unlink(path.join(UPLOAD_DIR, f.filename), () => {}));
}

const create = asyncHandler(async (req, res) => {
  const {
    title, description, questionText, contentType,
    courseCode, courseName, departmentId,
    facultyName, semesterName, year,
  } = req.body;

  const batchError = validateFileBatch(req.files);
  if (batchError) {
    cleanupFiles(req.files);
    return res.status(400).json({ success: false, message: batchError, errors: { files: batchError } });
  }

  const errors = {};
  if (!title || !title.trim()) errors.title = 'Title is required.';
  if (!isValidContentType(contentType)) errors.contentType = 'Select a valid content type.';
  if (!courseCode || !courseCode.trim()) errors.courseCode = 'Course code is required.';
  if (!semesterName || !semesterName.trim()) errors.semesterName = 'Semester is required.';
  if (!year || Number.isNaN(Number(year))) errors.year = 'A valid year is required.';
  if (!questionText?.trim() && !(req.files && req.files.length)) {
    errors.content = 'Provide question text or upload at least one file.';
  }

  if (Object.keys(errors).length) {
    cleanupFiles(req.files);
    return res.status(400).json({ success: false, message: 'Please fix the errors below.', errors });
  }

  const courseId = await findOrCreateCourse(courseCode, courseName, departmentId);
  const facultyId = await findOrCreateFaculty(facultyName, departmentId);
  const semesterId = await findOrCreateSemester(semesterName, year);

  const [result] = await pool.query(
    `INSERT INTO questions
      (title, content_type, course_id, faculty_id, semester_id, year, description, question_text, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title.trim(), contentType, courseId, facultyId, semesterId, year, description || null, questionText || null, req.user.id]
  );

  const questionId = result.insertId;

  if (req.files && req.files.length) {
    const values = req.files.map((f, index) => [
      questionId, `/uploads/${f.filename}`, f.originalname, index,
    ]);
    await pool.query(
      'INSERT INTO question_files (question_id, file_url, file_name, sort_order) VALUES ?',
      [values]
    );
  }

  res.status(201).json({ success: true, message: 'Question uploaded successfully.', questionId });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM questions WHERE id = ? AND is_removed = 0', [id]);

  if (!rows.length) {
    cleanupFiles(req.files);
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }
  if (rows[0].uploaded_by !== req.user.id && req.user.role !== 'admin') {
    cleanupFiles(req.files);
    return res.status(403).json({ success: false, message: 'You can only edit your own questions.' });
  }

  const batchError = validateFileBatch(req.files);
  if (batchError) {
    cleanupFiles(req.files);
    return res.status(400).json({ success: false, message: batchError, errors: { files: batchError } });
  }

  const existing = rows[0];
  const {
    title, description, questionText, contentType,
    courseCode, courseName, departmentId,
    facultyName, semesterName, year,
  } = req.body;

  if (contentType && !isValidContentType(contentType)) {
    cleanupFiles(req.files);
    return res.status(400).json({ success: false, message: 'Invalid content type.' });
  }

  const courseId = courseCode ? await findOrCreateCourse(courseCode, courseName, departmentId) : existing.course_id;
  const facultyId = facultyName ? await findOrCreateFaculty(facultyName, departmentId) : existing.faculty_id;
  const semesterId = (semesterName && year) ? await findOrCreateSemester(semesterName, year) : existing.semester_id;

  await pool.query(
    `UPDATE questions SET
      title = ?, content_type = ?, course_id = ?, faculty_id = ?, semester_id = ?, year = ?,
      description = ?, question_text = ?
     WHERE id = ?`,
    [
      title?.trim() || existing.title,
      contentType || existing.content_type,
      courseId, facultyId, semesterId,
      year || existing.year,
      description !== undefined ? description : existing.description,
      questionText !== undefined ? questionText : existing.question_text,
      id,
    ]
  );

  if (req.files && req.files.length) {
    const [oldFiles] = await pool.query('SELECT file_url FROM question_files WHERE question_id = ?', [id]);
    oldFiles.forEach((f) => fs.unlink(path.join(UPLOAD_DIR, path.basename(f.file_url)), () => {}));
    if (existing.file_url) {
      fs.unlink(path.join(UPLOAD_DIR, path.basename(existing.file_url)), () => {});
    }

    await pool.query('DELETE FROM question_files WHERE question_id = ?', [id]);
    await pool.query('UPDATE questions SET file_url = NULL, file_name = NULL WHERE id = ?', [id]);

    const values = req.files.map((f, index) => [
      id, `/uploads/${f.filename}`, f.originalname, index,
    ]);
    await pool.query(
      'INSERT INTO question_files (question_id, file_url, file_name, sort_order) VALUES ?',
      [values]
    );
  }

  res.json({ success: true, message: 'Question updated successfully.' });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);

  if (!rows.length) return res.status(404).json({ success: false, message: 'Question not found.' });
  if (rows[0].uploaded_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You can only delete your own questions.' });
  }

  const [files] = await pool.query('SELECT file_url FROM question_files WHERE question_id = ?', [id]);
  files.forEach((f) => fs.unlink(path.join(UPLOAD_DIR, path.basename(f.file_url)), () => {}));
  if (rows[0].file_url) {
    fs.unlink(path.join(UPLOAD_DIR, path.basename(rows[0].file_url)), () => {});
  }

  await pool.query('DELETE FROM questions WHERE id = ?', [id]);
  res.json({ success: true, message: 'Question deleted successfully.' });
});

const download = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT file_url, file_name FROM questions WHERE id = ? AND is_removed = 0', [id]);

  if (!rows.length || !rows[0].file_url) {
    return res.status(404).json({ success: false, message: 'No file attached to this question.' });
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(rows[0].file_url));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File no longer available.' });
  }

  pool.query('UPDATE questions SET downloads = downloads + 1 WHERE id = ?', [id]).catch(() => {});
  res.download(filePath, rows[0].file_name || path.basename(filePath));
});

const downloadFile = asyncHandler(async (req, res) => {
  const { id, fileId } = req.params;
  const [rows] = await pool.query(
    'SELECT file_url, file_name FROM question_files WHERE id = ? AND question_id = ?',
    [fileId, id]
  );

  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(rows[0].file_url));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File no longer available.' });
  }

  pool.query('UPDATE questions SET downloads = downloads + 1 WHERE id = ?', [id]).catch(() => {});
  res.download(filePath, rows[0].file_name || path.basename(filePath));
});

const toggleBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [existing] = await pool.query('SELECT id FROM bookmarks WHERE user_id = ? AND question_id = ?', [req.user.id, id]);

  if (existing.length) {
    await pool.query('DELETE FROM bookmarks WHERE id = ?', [existing[0].id]);
    return res.json({ success: true, bookmarked: false, message: 'Bookmark removed.' });
  }

  await pool.query('INSERT INTO bookmarks (user_id, question_id) VALUES (?, ?)', [req.user.id, id]);
  res.json({ success: true, bookmarked: true, message: 'Question bookmarked.' });
});

const toggleBlessing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [question] = await pool.query('SELECT uploaded_by FROM questions WHERE id = ? AND is_removed = 0', [id]);
  if (!question.length) return res.status(404).json({ success: false, message: 'Question not found.' });

  const [existing] = await pool.query('SELECT id FROM blessings WHERE user_id = ? AND question_id = ?', [req.user.id, id]);

  if (existing.length) {
    await pool.query('DELETE FROM blessings WHERE id = ?', [existing[0].id]);
    await pool.query('UPDATE questions SET blessings_count = GREATEST(blessings_count - 1, 0) WHERE id = ?', [id]);
    return res.json({ success: true, blessed: false, message: 'Blessing removed.' });
  }

  await pool.query('INSERT INTO blessings (user_id, question_id) VALUES (?, ?)', [req.user.id, id]);
  await pool.query('UPDATE questions SET blessings_count = blessings_count + 1 WHERE id = ?', [id]);
  res.json({ success: true, blessed: true, message: 'Blessing sent to the uploader.' });
});

const report = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Please describe the issue.' });
  }

  const [question] = await pool.query('SELECT id FROM questions WHERE id = ?', [id]);
  if (!question.length) return res.status(404).json({ success: false, message: 'Question not found.' });

  await pool.query('INSERT INTO reports (user_id, question_id, reason) VALUES (?, ?, ?)', [req.user.id, id, reason.trim()]);
  res.status(201).json({ success: true, message: 'Report submitted. Thank you for helping keep Question Bank useful.' });
});

const myQuestions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE q.uploaded_by = ? AND q.is_removed = 0 ORDER BY q.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM questions WHERE uploaded_by = ? AND is_removed = 0', [req.user.id]);
  const questions = await attachFiles(rows.map(shapeQuestion));

  res.json({
    success: true,
    questions,
    pagination: { page, limit, total: countRows[0].total, totalPages: Math.max(1, Math.ceil(countRows[0].total / limit)) },
  });
});

const myBookmarks = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `${BASE_SELECT} JOIN bookmarks bm ON bm.question_id = q.id
     WHERE bm.user_id = ? AND q.is_removed = 0 ORDER BY bm.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM bookmarks WHERE user_id = ?', [req.user.id]);
  const questions = await attachFiles(rows.map(shapeQuestion));

  res.json({
    success: true,
    questions,
    pagination: { page, limit, total: countRows[0].total, totalPages: Math.max(1, Math.ceil(countRows[0].total / limit)) },
  });
});

module.exports = {
  list, getById, create, update, remove, download, downloadFile,
  toggleBookmark, toggleBlessing, report, myQuestions, myBookmarks,
};
