require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'recyclehero',
    password: 'admin',
    port: 5432,
});

app.use(cors());
app.use(express.json());


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admins only' });
    }
};


app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, email, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed. Email or username might be taken.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = result.rows[0];
        if (await bcrypt.compare(password, user.password_hash)) {
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
            res.json({ token, role: user.role, username: user.username });
        } else {
            res.status(403).json({ error: 'Invalid password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/points', async (req, res) => {
    const { category_id } = req.query;

    let query = `
    SELECT 
      rp.id, rp.name, rp.description, rp.status,
      ST_X(rp.geom::geometry) as lng, 
      ST_Y(rp.geom::geometry) as lat,
      array_agg(c.name) as categories,
      array_agg(c.id) as category_ids
    FROM recycle_points rp
    JOIN point_categories pc ON rp.id = pc.point_id
    JOIN categories c ON pc.category_id = c.id
    WHERE rp.status = 'approved'
  `;

    const params = [];
    if (category_id) {
        query += ` AND pc.category_id = $1`;
        params.push(category_id);
    }

    query += ` GROUP BY rp.id`;

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/points', authenticateToken, async (req, res) => {
    const { name, description, lat, lng, category_ids } = req.body;

    if (!name || !lat || !lng || !category_ids) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const pointRes = await client.query(
            `INSERT INTO recycle_points (name, description, geom, user_id, status)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, 'pending')
       RETURNING id`,
            [name, description, lng, lat, req.user.id]
        );
        const pointId = pointRes.rows[0].id;

        for (const catId of category_ids) {
            await client.query(
                'INSERT INTO point_categories (point_id, category_id) VALUES ($1, $2)',
                [pointId, catId]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Point added and pending approval' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        client.release();
    }
});

app.get('/api/admin/points', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT rp.id, rp.name, rp.status, rp.created_at, u.username
      FROM recycle_points rp
      LEFT JOIN users u ON rp.user_id = u.id
      ORDER BY rp.created_at DESC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/admin/points/:id', authenticateToken, isAdmin, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        await pool.query('UPDATE recycle_points SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: `Point ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Record a recycling event for statistics (normal users)
app.post('/api/recycling-events', authenticateToken, async (req, res) => {
    const { pointId, categoryIds, quantity } = req.body;

    if (!pointId || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ error: 'Lipsește punctul sau tipul de deșeu.' });
    }

    const cleanQty = Number.parseInt(quantity, 10);
    const safeQty = Number.isFinite(cleanQty) && cleanQty > 0 ? cleanQty : 1;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const catId of categoryIds) {
            await client.query(
                `INSERT INTO recycling_events (user_id, point_id, category_id, quantity)
                 VALUES ($1, $2, $3, $4)`,
                [req.user.id, pointId, catId, safeQty]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Recycling event salvat.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Nu am putut salva reciclarea.' });
    } finally {
        client.release();
    }
});

app.get('/api/recycling-events', async (req, res) => {
    const { category_id } = req.query;

    let sql = `
        SELECT re.id, re.created_at, re.quantity,
               rp.name AS point_name,
               c.name AS category_name,
               u.username
        FROM recycling_events re
        JOIN recycle_points rp ON rp.id = re.point_id
        JOIN categories c ON c.id = re.category_id
        LEFT JOIN users u ON u.id = re.user_id
    `;

    const params = [];
    if (category_id) {
        params.push(category_id);
        sql += ' WHERE re.category_id = $1';
    }

    sql += ' ORDER BY re.created_at DESC LIMIT 200';

    try {
        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Nu am putut încărca evenimentele.' });
    }
});

app.get('/api/recycling-stats', async (req, res) => {
    const { category_id } = req.query;
    const hasFilter = Boolean(category_id);

    const pointParams = [];
    let pointWhere = '';
    if (hasFilter) {
        pointWhere = 'WHERE re.category_id = $1';
        pointParams.push(category_id);
    }

    const pointSql = `
        SELECT rp.id, rp.name, COUNT(*)::int AS events_count, COALESCE(SUM(re.quantity), 0)::int AS total_quantity
        FROM recycling_events re
        JOIN recycle_points rp ON rp.id = re.point_id
        ${pointWhere}
        GROUP BY rp.id, rp.name
        ORDER BY events_count DESC
    `;

    const catParams = [];
    let catWhere = '';
    if (hasFilter) {
        catWhere = 'WHERE re.category_id = $1';
        catParams.push(category_id);
    }

    const categorySql = `
        SELECT c.id, c.name, COUNT(*)::int AS events_count, COALESCE(SUM(re.quantity), 0)::int AS total_quantity
        FROM recycling_events re
        JOIN categories c ON c.id = re.category_id
        ${catWhere}
        GROUP BY c.id, c.name
        ORDER BY events_count DESC
    `;

    try {
        const [pointAgg, categoryAgg] = await Promise.all([
            pool.query(pointSql, pointParams),
            pool.query(categorySql, catParams)
        ]);

        res.json({
            byPoint: pointAgg.rows,
            byCategory: categoryAgg.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Nu am putut încărca statisticile.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});