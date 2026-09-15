const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sharp = require('sharp'); // ফাইল অপটিমাইজেশনের জন্য sharp

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

// Memory storage for multer (Sharp দিয়ে প্রসেস করার জন্য মেমরিতে রাখা)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // ১০ MB পর্যন্ত আপলোড এলাউড
});

// Image Processing Middleware using Sharp (সাইজ সর্বোচ্চ 300x300 এবং quality 80% এ কমাবে)
const processImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const resizedBuffer = await sharp(req.file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // ডাটাবেজে বেস৬৪ স্ট্রিং বা বাফার হিসেবে সেভ করার জন্য
    req.file.resizedBase64 = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    next();
  } catch (error) {
    console.error('Image compression error:', error);
    next();
  }
};

// Routes placeholder / Base Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
