const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'al_hera_secret_key_2026';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection String
const mongo_URI = "mongodb+srv://alhera135462_db_user:lsFcTuFBVT1Y4G7y@cluster0.41wb1.mongodb.net/alheramadrasah?retryWrites=true&w=majority";

let isDbConnected = false;

mongoose.connect(mongo_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    isDbConnected = true;
    createInitialUsers();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    isDbConnected = false;
  });

// User Schema & Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'teacher' }
});

const User = mongoose.model('User', userSchema);

// Initial Users Creation
async function createInitialUsers() {
  try {
    const adminExists = await User.findOne({ username: 'superadmin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin1234', 10);
      await User.create({ username: 'superadmin', password: hashedPassword, role: 'admin' });
      console.log('Default Admin Created');
    }

    const teacherExists = await User.findOne({ username: 'teacher' });
    if (!teacherExists) {
      const hashedPassword = await bcrypt.hash('teacher1234', 10);
      await User.create({ username: 'teacher', password: hashedPassword, role: 'teacher' });
      console.log('Default Teacher Created');
    }
  } catch (err) {
    console.error('Error creating default users:', err);
  }
}

// Login API Route
app.post('/api/login', async (req, res) => {
  if (!isDbConnected && mongoose.connection.readyState !== 1) {
    return res.status(500).json({ success: false, message: 'Database connecting, please try again in 10 seconds...' });
  }

  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid Username or Password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Username or Password' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, role: user.role, username: user.username });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Database Auth Error: ' + err.message });
  }
});

// Base Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
