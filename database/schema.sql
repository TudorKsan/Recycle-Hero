CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE point_status AS ENUM ('approved', 'pending', 'rejected');

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255),
    description TEXT
);

CREATE TABLE IF NOT EXISTS recycle_points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    geom GEOMETRY(Point, 4326) NOT NULL,
    status point_status DEFAULT 'pending',
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recycle_points_geom ON recycle_points USING GIST (geom);

CREATE TABLE IF NOT EXISTS point_categories (
    point_id INTEGER REFERENCES recycle_points(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (point_id, category_id)
);

CREATE TABLE IF NOT EXISTS recycling_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    point_id INTEGER NOT NULL REFERENCES recycle_points(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recycling_events_point ON recycling_events(point_id);
CREATE INDEX IF NOT EXISTS idx_recycling_events_category ON recycling_events(category_id);

-- --- SEED DATA ---

INSERT INTO categories (name, icon_url, description) VALUES
('Baterii', '/icons/battery.png', 'Baterii și acumulatori portabili'),
('Plastic', '/icons/plastic.png', 'PET-uri și ambalaje din plastic'),
('Sticlă', '/icons/glass.png', 'Sticle și borcane'),
('Hârtie', '/icons/paper.png', 'Ziare, reviste, cartoane'),
('Electronice', '/icons/electronics.png', 'DEEE - Deșeuri de echipamente electrice'),
('Ulei', '/icons/oil.png', 'Ulei alimentar uzat'),
('Textile', '/icons/clothes.png', 'Haine și materiale textile');

INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@recyclehero.com', '$2b$10$wW.wW.wW.wW.wW.wW.wW.wOu.a.a.a.a.a.a.a.a.a.a.a.a.a.a', 'admin');

INSERT INTO recycle_points (name, description, geom, status, user_id) VALUES
(
    'Punct Colectare Universitate', 
    'Tomberon galben lângă metrou',
    ST_SetSRID(ST_MakePoint(26.1025, 44.4355), 4326),
    'approved',
    1
);

INSERT INTO point_categories (point_id, category_id) VALUES
(1, 2), 
(1, 4);