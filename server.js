const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

const PORT = process.env.PORT || 3000;

const JWT_SECRET = 'ALHERA_MADRASAH_SECRET_2026_987654321';

// =====================================================
// MONGODB ATLAS
// =====================================================

const MONGO_URI =
  'mongodb+srv://alheraadmin:AlheraDB2026pass@cluster0.4rwbrlt.mongodb.net/alheramadrasah?retryWrites=true&w=majority&appName=Cluster0';

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.use(express.static(__dirname));

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

// =====================================================
// USER SCHEMA
// =====================================================

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

// =====================================================
// CREATE DEFAULT USERS
// =====================================================

async function createDefaultUsers() {

  try {

    // ADMIN
    const admin = await User.findOne({
      username: 'superadmin'
    });

    if (!admin) {

      const hashedAdminPassword =
        await bcrypt.hash(
          'admin1234',
          10
        );

      await User.create({
        username: 'superadmin',
        password: hashedAdminPassword,
        role: 'admin'
      });

      console.log(
        'Admin created successfully.'
      );

    } else {

      console.log(
        'Admin already exists.'
      );

    }

    // TEACHER
    const teacher = await User.findOne({
      username: 'teacher'
    });

    if (!teacher) {

      const hashedTeacherPassword =
        await bcrypt.hash(
          'teacher1234',
          10
        );

      await User.create({
        username: 'teacher',
        password: hashedTeacherPassword,
        role: 'teacher'
      });

      console.log(
        'Teacher created successfully.'
      );

    } else {

      console.log(
        'Teacher already exists.'
      );

    }

  } catch (error) {

    console.error(
      'User creation error:',
      error.message
    );

  }
}

// =====================================================
// LOGIN API
// =====================================================

app.post(
  '/api/login',
  async (req, res) => {

    try {

      const username =
        req.body.username
          ? req.body.username.trim()
          : '';

      const password =
        req.body.password
          ? req.body.password
          : '';

      if (!username || !password) {

        return res.status(400).json({
          success: false,
          message:
            'Username and password are required.'
        });

      }

      if (
        mongoose.connection.readyState !== 1
      ) {

        return res.status(500).json({
          success: false,
          message:
            'MongoDB is not connected.'
        });

      }

      const user =
        await User.findOne({
          username: username
        });

      if (!user) {

        return res.status(401).json({
          success: false,
          message:
            'Invalid Username or Password'
        });

      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {

        return res.status(401).json({
          success: false,
          message:
            'Invalid Username or Password'
        });

      }

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

// =====================================================
// DATABASE HEALTH CHECK
// =====================================================

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

// =====================================================
// HOME PAGE
// =====================================================

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

// =====================================================
// START SERVER
// =====================================================

async function startServer() {

  try {

    console.log(
      '===================================='
    );

    console.log(
      'AL-HERA DAKHIL MADRASAH'
    );

    console.log(
      'MANAGEMENT SYSTEM'
    );

    console.log(
      '===================================='
    );

    console.log(
      'Connecting to MongoDB Atlas...'
    );

    await mongoose.connect(
      MONGO_URI,
      {
        serverSelectionTimeoutMS: 15000
      }
    );

    console.log(
      'MongoDB connected successfully!'
    );

    await createDefaultUsers();

    app.listen(
      PORT,
      () => {

        console.log(
          '===================================='
        );

        console.log(
          'SERVER STARTED SUCCESSFULLY'
        );

        console.log(
          `Port: ${PORT}`
        );

        console.log(
          '===================================='
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
          '===================================='
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
          '===================================='
        );

      }
    );

  } catch (error) {

    console.error(
      '===================================='
    );

    console.error(
      'MONGODB CONNECTION FAILED'
    );

    console.error(
      '===================================='
    );

    console.error(
      error.message
    );

    console.error(
      '===================================='
    );

    process.exit(1);

  }

}

// =====================================================
// RUN
// =====================================================

startServer();
