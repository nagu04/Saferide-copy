CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    password_hash VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cameras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_code VARCHAR(20),
    location VARCHAR(100),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id VARCHAR(50) PRIMARY KEY,
    camera_id INT,
    location VARCHAR(100),
    violation_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    timestamp DATETIME,
    reviewed_by INT,
    reviewer_note TEXT,
    reviewed_at DATETIME
);

CREATE TABLE detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id VARCHAR(50),
    image_url TEXT,
    violation_type VARCHAR(50),
    confidence FLOAT,
    plate_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id)
);


CREATE TABLE incident_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id VARCHAR(50),
    admin_id INT,
    action VARCHAR(20),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action VARCHAR(100),
    target_id VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_name VARCHAR(100),
    file_url TEXT,
    generated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES admin_users(id)
);

INSERT INTO admin_users (username, email, password_hash, role)
VALUES (
    'admin',
    'admin@saferide.com',
    '$2b$12$DxFL4rRbdj.SOmdotv5ak.Ac.2sQTa2PjLnp0HZEoKNq0k6qICE2G',
    'admin'
);


INSERT INTO cameras (camera_code, location, status)
VALUES ('CAM-001', 'Gate 1', 'online');

-- @block
INSERT INTO admin_users (id, username, email, password_hash, role, created_at)
VALUES (
  '3',
  'admin2',
  'admin@test.com',
  '$2b$12$OB8lcxg0SFS6oB2ags2JeebuLvjZv1voTn0vE89gyVGQesBMFg2U',
  'admin',
  '2026-04-07 23:24:41'
);
