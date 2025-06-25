require('dotenv').config(); // Load .env variables locally

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { pdata } = require('./data');

const app = express();
app.use(cors());
app.use(express.json());

let client;

async function connectToMongo() {
    if (!client || !client.topology || !client.topology.isConnected()) {
        const mongouri = process.env.MONGO_URI;
        client = new MongoClient(mongouri, {
            serverApi: { version: '1' }, // optional for MongoDB Atlas
        });
        await client.connect();
    }
    return client;
}

app.get('/products', async (req, res) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        // Abort fetch if RDS not open to current IP
        controller.abort();
    }, 3000);

    try {
        const response = await fetch(
            'http://shoppingapi-single-env.eba-pqzmi8gm.eu-central-1.elasticbeanstalk.com/categories',
            { signal: controller.signal }
        );

        clearTimeout(timeout); // Cancel timeout if fetch succeeds

        if (!response.ok) {
            res.json(pdata);
            // throw new Error(`Fetch failed with status ${response.status}`);
        } else {
            const data = await response.json();
            res.json(data);
        }
    } catch (err) {
        clearTimeout(timeout); // Ensure timeout is cleared on error

        if (err.name === 'AbortError') {
            console.error('Fetch timed out You IP not set on RDS!');
        } else {
            console.error('Failed to fetch products:', err);
        }

        res.json(pdata);
        // res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/save', async (req, res) => {
    const cartData = req.body;

    // Basic validation
    if (!cartData || typeof cartData !== 'object') {
        return res.status(400).json({ error: 'Invalid cart data' });
    }

    try {
        const client = await connectToMongo();
        const db = client.db('cart');
        const collection = db.collection('carts');

        const result = await collection.insertOne(cartData);
        console.log('Inserted cart with id:', result.insertedId);
        res.status(201).json({ message: 'Cart saved', id: result.insertedId });
    } catch (err) {
        console.error('Error saving cart:', err);
        res.status(500).json({ error: 'Error saving cart' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello from Express on Lambda! to see products visit /products');
});

module.exports = app;
//zip -r function.zip . -x "*.git*" ".env"
