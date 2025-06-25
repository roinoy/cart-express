const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');

const cors = require('cors');
const { pdata } = require('./data');
// Enable CORS for all domains
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from Express on Lambda!');
});

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello world' });
});


let client;

async function connectToMongo() {
    if (!client) {
        const mongouri = process.env.MONGO_URI;
        client = new MongoClient(mongouri);
        await client.connect();
    }
    return client;
}

app.post('/save', async (req, res) => {
    try {
        const client = await connectToMongo();
        const db = client.db('cart');
        const collection = db.collection('carts');

        // הנתונים שהגיעו בבקשת POST
        const cartData = req.body;

        const result = await collection.insertOne(cartData);
        console.log("Inserted cart with id:", result.insertedId);
        res.status(201).json({ message: 'Cart saved', id: result.insertedId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving cart' });
    }
});

app.get('/products', async (req, res) => {
    try {
        const response = await fetch('http://shoppingapi-single-env.eba-pqzmi8gm.eu-central-1.elasticbeanstalk.com/categories');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Failed to fetch products:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// app.get('/products', (req, res) => {
//     res.json(pdata);
// });

module.exports = app;
//zip -r function.zip . -x "*.git*" ".env"
