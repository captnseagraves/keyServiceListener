import express from 'express';
import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database setup
const pgp = pgPromise();
const db = pgp(process.env.DATABASE_URL!);

app.use(express.json());

// Create
app.post('/events', async (req, res) => {
    try {
        const { sender, user_op, transaction_hash, block_number } = req.body;
        const result = await db.one(
            'INSERT INTO key_service_events(sender, user_op, transaction_hash, block_number) VALUES($1, $2, $3, $4) RETURNING id',
            [sender, user_op, transaction_hash, block_number]
        );
        res.json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

// Read
app.get('/events', async (req, res) => {
    try {
        const events = await db.any('SELECT * FROM key_service_events');
        res.json(events);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

app.get('/events/:id', async (req, res) => {
    try {
        const event = await db.one('SELECT * FROM key_service_events WHERE id = $1', req.params.id);
        res.json(event);
    } catch (error) {
        res.status(404).json({ error: 'Event not found' });
    }
});

// Update
app.put('/events/:id', async (req, res) => {
    try {
        const { sender, user_op, transaction_hash, block_number } = req.body;
        const result = await db.one(
            'UPDATE key_service_events SET sender=$1, user_op=$2, transaction_hash=$3, block_number=$4 WHERE id=$5 RETURNING *',
            [sender, user_op, transaction_hash, block_number, req.params.id]
        );
        res.json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

// Delete
app.delete('/events/:id', async (req, res) => {
    try {
        await db.none('DELETE FROM key_service_events WHERE id = $1', req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});