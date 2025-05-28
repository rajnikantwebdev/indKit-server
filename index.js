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
    origin: ['http://localhost:5173', 'https://ind-kit-client.vercel.app']
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

app.post('/api/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        // Verify token to ensure the request is from an authenticated user
        jwt.verify(token, process.env.JWT_SECRET);
        // Since JWT is stateless, instruct client to clear token
        res.json({ success: true, message: 'Logged out successfully. Please clear token.' });
    } catch (error) {
        console.error('Error during logout:', error);
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

app.put('/api/employee/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            f_Id: req.body.f_Id,
            f_Image: req.body.f_Image,
            f_Name: req.body.f_Name,
            f_Email: req.body.f_Email,
            f_Mobile: req.body.f_Mobile,
            f_Designation: req.body.f_Designation,
            f_gender: req.body.f_gender,
            f_Course: req.body.f_Course,
            f_Createdate: req.body.f_Createdate ? new Date(req.body.f_Createdate) : undefined,
        };

        // Remove undefined fields to prevent overwriting with null
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const employee = await client.db("t_db").collection("employees").findOneAndUpdate(
            { f_Id: parseInt(id) },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ data: employee, success: true });
    } catch (error) {
        console.error('Error while updating employee:', error);
        res.status(500).json({ success: false, error: 'Failed to update employee' });
    }
});

app.delete('/api/employee/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await client.db("t_db").collection("employees").findOneAndDelete({ f_Id: parseInt(id) });

        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error while deleting employee:', error);
        res.status(500).json({ success: false, error: 'Failed to delete employee' });
    }
});

app.post('/api/employee', async (req, res) => {
    try {
        const lastEmployee = await client.db("t_db").collection("employees").findOne().sort({ f_Id: -1 });
        const nextId = lastEmployee ? lastEmployee.f_Id + 1 : 1;

        const employeeData = {
            f_Id: nextId,
            f_Image: req.body.f_Image,
            f_Name: req.body.f_Name,
            f_Email: req.body.f_Email,
            f_Mobile: req.body.f_Mobile,
            f_Designation: req.body.f_Designation,
            f_gender: req.body.f_gender,
            f_Course: req.body.f_Course,
            f_Createdate: req.body.f_Createdate ? new Date(req.body.f_Createdate) : new Date(),
        };

        const employee = new Employee(employeeData);
        await employee.save();

        res.status(201).json({ data: employee, success: true });
    } catch (error) {
        console.error('Error while creating employee:', error);
        res.status(500).json({ success: false, error: 'Failed to create employee' });
    }
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
