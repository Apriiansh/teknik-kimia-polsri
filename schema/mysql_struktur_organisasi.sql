-- MySQL Schema untuk Struktur Organisasi Content
-- Run ini di MySQL server kamu

CREATE TABLE IF NOT EXISTS struktur_organisasi_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    narasi TEXT,
    gambar LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert data default (opsional)
-- INSERT INTO struktur_organisasi_content (narasi, gambar) 
-- VALUES ('Narasi struktur organisasi...', 'https://example.com/image.jpg');
