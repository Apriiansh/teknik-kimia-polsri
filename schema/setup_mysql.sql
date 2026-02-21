-- Setup lengkap untuk Struktur Organisasi Content
-- Run semua query ini di MySQL

-- 1. Buat database kalau belum ada
CREATE DATABASE IF NOT EXISTS si_tekkim;

-- 2. Pake database
USE si_tekkim;

-- 3. Buat table
CREATE TABLE IF NOT EXISTS struktur_organisasi_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    narasi TEXT,
    gambar LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
