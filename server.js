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

// MongoDB Connection
const mongo_URI = "mongodb+srv://alhera135462_db_user:lsFcTuFBVT1Y4G7y@cluster0.41wb1.mongodb.net/alheramadrasah?retryWrites=true&w=majority";

mongoose.connect(mongo_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Multer Storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Image Handling Middleware
const processImage = (req, res, next) => {
  if (!req.file) return next();
  req.file.resizedBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  next();
};

// Base Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
