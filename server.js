const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// ======================================================
// BASIC SETTINGS
// ======================================================

const PORT = process.env.PORT || 3000;

// JWT Secret
const JWT_SECRET = 'ALHERA_MADRASAH_SECRET_2026_987654321';

// ======================================================
// MONGODB CONNECTION
// ======================================================

// MongoDB Atlas Database User
const DB_USERNAME = 'alheraadmin';
const DB_PASSWORD = 'AlheraDB2026pass';

// MongoDB Database Name
const DB_NAME = 'alheramadrasah';

// MongoDB Cluster
const DB_CLUSTER = 'cluster0.41wb1.mongodb.net';

// Final MongoDB Connection URL
const MONGO_URI =
  `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

// Website files
app.use(express.static(__dirname));

// Upload files
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

// ======================================================
// USER SCHEMA
// ======================================================

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      default: 'teacher'
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model(
  'User',
  userSchema
);

// ======================================================
// CREATE DEFAULT USERS
// ======================================================

async function createDefaultUsers() {

  try {

    // --------------------------------------------------
    // ADMIN USER
    // --------------------------------------------------

    const admin = await User.findOne({
      username: 'superadmin'
    });

    if (!admin) {

      const adminPassword =
        await bcrypt.hash(
          'admin1234',
          10
        );

      await User.create({
        username: 'superadmin',
        password: adminPassword,
        role: 'admin'
      });

      console.log(
        'ADMIN CREATED: superadmin / admin1234'
      );

    } else {

      console.log(
        'Admin user already exists.'
      );

    }

    // --------------------------------------------------
    // TEACHER USER
    // --------------------------------------------------

    const teacher = await User.findOne({
      username: 'teacher'
    });

    if (!teacher) {

      const teacherPassword =
        await bcrypt.hash(
          'teacher1234',
          10
        );

      await User.create({
        username: 'teacher',
        password: teacherPassword,
        role: 'teacher'
      });

      console.log(
        'TEACHER CREATED: teacher / teacher1234'
      );

    } else {

      console.log(
        'Teacher user already exists.'
      );

    }

  } catch (error) {

    console.error(
      'Default user creation error:',
      error.message
    );

  }

}

// ======================================================
// LOGIN API
// ======================================================

app.post(
  '/api/login',
  async (req, res) => {

    try {

      // Get username and password
      const username =
        req.body.username
          ? req.body.username.trim()
          : '';

      const password =
        req.body.password
          ? req.body.password
          : '';

      // Check empty fields
      if (!username || !password) {

        return res.status(400).json({
          success: false,
          message:
            'Username and password are required.'
        });

      }

      // Check MongoDB connection
      if (
        mongoose.connection.readyState !== 1
      ) {

        return res.status(500).json({
          success: false,
          message:
            'MongoDB is not connected.'
        });

      }

      // Find user
      const user =
        await User.findOne({
          username: username
        });

      // User not found
      if (!user) {

        return res.status(401).json({
          success: false,
          message:
            'Invalid Username or Password'
        });

      }

      // Compare password
      const passwordCorrect =
        await bcrypt.compare(
          password,
          user.password
        );

      // Wrong password
      if (!passwordCorrect) {

        return res.status(401).json({
          success: false,
          message:
            'Invalid Username or Password'
        });

      }

      // Create login token
      const token =
        jwt.sign(
          {
            id: user._id,
            username: user.username,
            role: user.role
          },
          JWT_SECRET,
          {
            expiresIn: '1d'
          }
        );

      // Successful login
      return res.json({
        success: true,
        token: token,
        role: user.role,
        username: user.username
      });

    } catch (error) {

      console.error(
        'LOGIN ERROR:',
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          'Server Error: ' +
          error.message
      });

    }

  }
);

// ======================================================
// DATABASE STATUS
// ======================================================

app.get(
  '/api/health',
  (req, res) => {

    const connected =
      mongoose.connection.readyState === 1;

    res.json({
      success: true,
      mongodb:
        connected
          ? 'connected'
          : 'disconnected'
    });

  }
);

// ======================================================
// HOME PAGE
// ======================================================

app.get(
  '/',
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        'index.html'
      )
    );

  }
);

// ======================================================
// START SERVER
// ======================================================

async function startServer() {

  try {

    console.log(
      '======================================'
    );

    console.log(
      'AL-HERA MADRASAH MANAGEMENT SYSTEM'
    );

    console.log(
      '======================================'
    );

    console.log(
      'Connecting to MongoDB...'
    );

    // Connect MongoDB
    await mongoose.connect(
      MONGO_URI,
      {
        serverSelectionTimeoutMS: 10000
      }
    );

    console.log(
      'MongoDB connected successfully!'
    );

    // Create default users
    await createDefaultUsers();

    // Start server
    app.listen(
      PORT,
      () => {

        console.log(
          '======================================'
        );

        console.log(
          `Server running on port ${PORT}`
        );

        console.log(
          '======================================'
        );

        console.log(
          'ADMIN LOGIN'
        );

        console.log(
          'Username: superadmin'
        );

        console.log(
          'Password: admin1234'
        );

        console.log(
          '======================================'
        );

        console.log(
          'TEACHER LOGIN'
        );

        console.log(
          'Username: teacher'
        );

        console.log(
          'Password: teacher1234'
        );

        console.log(
          '======================================'
        );

      }
    );

  } catch (error) {

    console.error(
      '======================================'
    );

    console.error(
      'MONGODB CONNECTION FAILED'
    );

    console.error(
      '======================================'
    );

    console.error(
      error.message
    );

    console.error(
      '======================================'
    );

    process.exit(1);

  }

}

// ======================================================
// RUN APPLICATION
// ======================================================

startServer();
