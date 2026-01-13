TRUNCATE recycle_points CASCADE;
ALTER SEQUENCE recycle_points_id_seq RESTART WITH 1;

INSERT INTO recycle_points (name, description, geom, status, user_id) VALUES
('Kaufland Barbu Văcărescu', 'Container parcare - Baterii și Ulei', ST_SetSRID(ST_MakePoint(26.1039, 44.4542), 4326), 'approved', 1),
('Punct Colectare UPB', 'Hol intrare Rectorat - Hârtie și Plastic', ST_SetSRID(ST_MakePoint(26.0494, 44.4386), 4326), 'approved', 1),
('Mega Image Cobălcescu', 'La intrare - Baterii și PET', ST_SetSRID(ST_MakePoint(26.0912, 44.4361), 4326), 'approved', 1),
('Containere Parcul Carol', 'Lângă intrarea principală - Sticlă și Hârtie', ST_SetSRID(ST_MakePoint(26.0963, 44.4182), 4326), 'approved', 1),
('Auchan Titan', 'Centru de reciclare parcare subterană', ST_SetSRID(ST_MakePoint(26.1738, 44.4259), 4326), 'approved', 1),
('Promenada EcoPoint', 'Etaj -1 lângă lifturi', ST_SetSRID(ST_MakePoint(26.1018, 44.4793), 4326), 'approved', 1),
('Metrou Unirii', 'Coșuri selective pe peron', ST_SetSRID(ST_MakePoint(26.1023, 44.4273), 4326), 'approved', 1),
('Facultatea de Automatică', 'Hol principal - Electronice mici', ST_SetSRID(ST_MakePoint(26.0515, 44.4421), 4326), 'approved', 1),
('Lidl Iuliu Maniu', 'Aparat SGR și baterii', ST_SetSRID(ST_MakePoint(26.0084, 44.4339), 4326), 'approved', 1),
('Veranda Mall Obor', 'Intrare parcare - Haine și Textile', ST_SetSRID(ST_MakePoint(26.1268, 44.4519), 4326), 'approved', 1);

INSERT INTO point_categories (point_id, category_id) VALUES
(1, 1), (1, 6), 
(2, 4), (2, 2), 
(3, 1), (3, 2), 
(4, 3), (4, 4), 
(5, 1), (5, 2), (5, 3), (5, 5), 
(6, 1), (6, 5), 
(7, 2), (7, 4), 
(8, 5), 
(9, 2), (9, 3), (9, 1),
(10, 7);

TRUNCATE recycling_events RESTART IDENTITY;
INSERT INTO recycling_events (user_id, point_id, category_id, quantity) VALUES
(1, 1, 1, 2),
(1, 2, 2, 1),
(1, 4, 3, 3);