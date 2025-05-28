const express = require('express')
const app = express()
require('dotenv').config()
const bcrypt = require('bcrypt');
const cors = require("cors")
const jwt = require("jsonwebtoken")
const {run, client} = require("./mongoDb")

const saltRounds = 10
const port = 8080

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173'
}));
  


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/api/register', async (req, res) => {
    try {
        run()
        const { username, password } = req.body;
        await client.connect();
        const db = client.db("t_db");
        const collection = db.collection("t_login");

        // Check if username already exists
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = { username, password: hashedPassword };
        const result = await collection.insertOne(user);
        console.log('User stored successfully:', result.insertedId);
        res.json({ success: true, username });
    } catch (error) {
        console.log("Error storing user: ", error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        await client.close();
    }
});

app.post('/api/login', async (req, res) => {
    try {
        run()
        const { username, password } = req.body;
        const db = client.db("t_db");
        const collection = db.collection("t_login");
        const user = await collection.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, username: user.username, token });
    } catch (error) {
        console.log("Error during login: ", error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/verify-token', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ success: true, username: decoded.username });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

app.get("/api/employee/list", async (req, res) => {
    try {
        const db = client.db("t_db")
        const collection = db.collection("employees")
        const result = await collection.find().toArray();
        
        res.json({ data: result, success: true });
    } catch (error) {
        console.log("error while fetching employees, ", error)
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
