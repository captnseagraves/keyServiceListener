"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_promise_1 = __importDefault(require("pg-promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Database setup
const pgp = (0, pg_promise_1.default)();
const db = pgp(process.env.DATABASE_URL);
app.use(express_1.default.json());
/********** ORIGIN EVENTS ROUTES **********/
// TODO: Ensure these routes can only be called by the listener. Ports locked down etc. 
// Create
app.post('/originEvents', async (req, res) => {
    try {
        const { sender, user_op, transaction_hash, block_number } = req.body;
        const result = await db.one('INSERT INTO key_service_originEvents(sender, user_op, transaction_hash, block_number) VALUES($1, $2, $3, $4) RETURNING id', [sender, user_op, transaction_hash, block_number]);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
// Read
app.get('/originEvents', async (req, res) => {
    try {
        const originEvents = await db.any('SELECT * FROM key_service_originEvents');
        res.json(originEvents);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
app.get('/originEvents/:id', async (req, res) => {
    try {
        const event = await db.one('SELECT * FROM key_service_originEvents WHERE id = $1', req.params.id);
        res.json(event);
    }
    catch (error) {
        res.status(404).json({ error: 'Event not found' });
    }
});
// Update
app.put('/originEvents/:id', async (req, res) => {
    try {
        const { sender, user_op, transaction_hash, block_number } = req.body;
        const result = await db.one('UPDATE key_service_originEvents SET sender=$1, user_op=$2, transaction_hash=$3, block_number=$4 WHERE id=$5 RETURNING *', [sender, user_op, transaction_hash, block_number, req.params.id]);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
// Delete
app.delete('/originEvents/:id', async (req, res) => {
    try {
        await db.none('DELETE FROM key_service_originEvents WHERE id = $1', req.params.id);
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
/********** FACTORY ROUTES **********/
// TODO: Ensure these routes are protected and only callable by a specific key
app.post('/factories', async (req, res) => {
    try {
        const { factoryAddress } = req.body;
        const result = await db.one('INSERT INTO key_service_factories(factoryAddress) VALUES($1, $2, $3, $4) RETURNING id', [factoryAddress]);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
// Read
app.get('/factories', async (req, res) => {
    try {
        const factories = await db.any('SELECT * FROM key_service_factories');
        res.json(factories);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
app.get('/factories/:id', async (req, res) => {
    try {
        const event = await db.one('SELECT * FROM key_service_factories WHERE id = $1', req.params.id);
        res.json(event);
    }
    catch (error) {
        res.status(404).json({ error: 'Event not found' });
    }
});
// Delete
app.delete('/factories/:id', async (req, res) => {
    try {
        await db.none('DELETE FROM key_service_factories WHERE id = $1', req.params.id);
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
app.post('/originEvents', async (req, res) => {
    try {
        const { sender, user_op, transaction_hash, block_number } = req.body;
        const result = await db.one('INSERT INTO key_service_originEvents(sender, user_op, transaction_hash, block_number) VALUES($1, $2, $3, $4) RETURNING id', [sender, user_op, transaction_hash, block_number]);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
// Read
app.get('/originEvents', async (req, res) => {
    try {
        const originEvents = await db.any('SELECT * FROM key_service_originEvents');
        res.json(originEvents);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
