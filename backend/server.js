const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const { testConnection } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const questionRoutes = require('./routes/questions.routes');
const courseRoutes = require('./routes/courses.routes');
const facultyRoutes = require('./routes/faculties.routes');
const departmentRoutes = require('./routes/departments.routes');
const semesterRoutes = require('./routes/semesters.routes');
const userRoutes = require('./routes/users.routes');

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (PDFs/images attached to questions).
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Question Bank API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/profiles', userRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Question Bank API listening on port ${config.port}`);
  testConnection();
});
