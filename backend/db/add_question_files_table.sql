-- ============================================================================
-- add_question_files_table.sql
--
-- Run this ONCE in MySQL Workbench against your EXISTING question_bank
-- database. It adds support for multi-page question uploads (e.g. a
-- 2-page scanned exam as two images) without touching any existing data.
-- Your already-uploaded questions and their files are completely unaffected.
-- ============================================================================

USE question_bank;

CREATE TABLE IF NOT EXISTS question_files (
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

-- Done. Check the results:
SHOW TABLES LIKE 'question_files';
DESCRIBE question_files;
