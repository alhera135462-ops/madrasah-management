const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'al_hera_secret_key_2026';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const MONGO_URI = "mongodb+srv://alhera135462_db_user:L4FcTufDYTiY4GTY@cluster0.4rwbrlt.mongodb.net/alHeraMadrasahDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB Cloud Database Connected!'))
    .catch(err => console.error('❌ Database Connection Error:', err));

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Schemas & Models
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher'], default: 'teacher' }
});

const studentSchema = new mongoose.Schema({
    name: String,
    roll: String,
    class: String,
    section: String,
    father_name: String,
    mother_name: String,
    mobile: String,
    birth_reg: String,
    address: String,
    photo: String
});

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);

// Create Initial Users
async function createInitialUsers() {
    try {
        const adminExist = await User.findOne({ username: 'superadmin' });
        if (!adminExist) {
            const hashedPassword = await bcrypt.hash('admin1234', 10);
            await User.create({ username: 'superadmin', password: hashedPassword, role: 'admin' });
            console.log('👤 Admin Created');
        }

        const teacherExist = await User.findOne({ username: 'teacher' });
        if (!teacherExist) {
            const hashedPassword = await bcrypt.hash('teacher1234', 10);
            await User.create({ username: 'teacher', password: hashedPassword, role: 'teacher' });
            console.log('👤 Teacher Created');
        }
    } catch (e) {
        console.log("Error initial users:", e.message);
    }
}
createInitialUsers();

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// Login API
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'ইউজারনেম বা পাসওয়ার্ড ভুল!' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: 'ইউজারনেম বা পাসওয়ার্ড ভুল!' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, role: user.role, username: user.username });
});

// Student APIs
app.get('/api/students', authenticateToken, async (req, res) => {
    const students = await Student.find().sort({ _id: -1 });
    res.json({ data: students, userRole: req.user.role });
});

app.post('/api/students', authenticateToken, upload.single('photo'), async (req, res) => {
    const studentData = { ...req.body, studentClass: req.body.studentClass };
    if (req.file) studentData.photo = req.file.filename;

    const student = new Student({
        name: studentData.name,
        roll: studentData.roll,
        class: studentData.studentClass,
        section: studentData.section,
        father_name: studentData.father_name,
        mother_name: studentData.mother_name,
        mobile: studentData.mobile,
        birth_reg: studentData.birth_reg,
        address: studentData.address,
        photo: studentData.photo || ''
    });

    await student.save();
    res.json({ message: "শিক্ষার্থীর তথ্য সফলভাবে যুক্ত হয়েছে!" });
});

app.put('/api/students/:id', authenticateToken, upload.single('photo'), async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'শুধুমাত্র এডমিন পরিবর্তন করতে পারবেন!' });
    }
    const updateData = {
        name: req.body.name,
        roll: req.body.roll,
        class: req.body.studentClass,
        section: req.body.section,
        father_name: req.body.father_name,
        mother_name: req.body.mother_name,
        mobile: req.body.mobile,
        birth_reg: req.body.birth_reg,
        address: req.body.address
    };
    if (req.file) updateData.photo = req.file.filename;

    await Student.findByIdAndUpdate(req.params.id, updateData);
    res.json({ message: "তথ্য সফলভাবে আপডেট হয়েছে!" });
});

app.delete('/api/students/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'শুধুমাত্র এডমিন মুছে ফেলতে পারবেন!' });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "তথ্য মুছে ফেলা হয়েছে।" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});