const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET =
    process.env.JWT_SECRET || "al_hera_secret_key_2026";


// =====================================================
// Middleware
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));


// =====================================================
// Upload Folder
// =====================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
    "/uploads",
    express.static(uploadDir)
);


// =====================================================
// MongoDB Connection
// =====================================================
//
// Render Dashboard > Environment এ
// MONGODB_URI নামে আপনার বর্তমান working MongoDB
// connection string রাখবেন।
//

const mongo_URI =
    process.env.MONGODB_URI;

if (!mongo_URI) {

    console.error(
        "MONGODB_URI Environment Variable পাওয়া যায়নি!"
    );

} else {

    mongoose.connect(mongo_URI, {
        serverSelectionTimeoutMS: 10000
    })
    .then(async () => {

        console.log(
            "MongoDB connected successfully"
        );

        await createInitialUsers();

    })
    .catch((err) => {

        console.error(
            "MongoDB connection error:",
            err.message
        );

    });
}


// =====================================================
// User Schema
// =====================================================

const userSchema = new mongoose.Schema({

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
        enum: ["admin", "teacher"],
        default: "teacher"
    },

    mustChangePassword: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);


// =====================================================
// Student Schema
// =====================================================

const studentSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    roll: {
        type: String,
        required: true,
        trim: true
    },

    studentClass: {
        type: String,
        required: true
    },

    section: {
        type: String,
        default: ""
    },

    father_name: {
        type: String,
        default: ""
    },

    mother_name: {
        type: String,
        default: ""
    },

    mobile: {
        type: String,
        default: ""
    },

    birth_reg: {
        type: String,
        default: ""
    },

    address: {
        type: String,
        default: ""
    },

    photo: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});

const Student =
    mongoose.models.Student ||
    mongoose.model("Student", studentSchema);


// =====================================================
// Multer
// =====================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {

        const ext =
            path.extname(file.originalname)
                .toLowerCase() || ".jpg";

        const filename =
            "student_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8) +
            ext;

        cb(null, filename);
    }

});


const upload = multer({

    storage: storage,

    limits: {
        fileSize: 300 * 1024
    },

    fileFilter: function (req, file, cb) {

        if (
            file.mimetype &&
            file.mimetype.startsWith("image/")
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "শুধু ছবি আপলোড করা যাবে।"
                )
            );

        }

    }

});


// =====================================================
// Create Initial Users
// =====================================================

async function createInitialUsers() {

    try {

        const adminExists =
            await User.findOne({
                username: "superadmin"
            });

        if (!adminExists) {

            const hashedPassword =
                await bcrypt.hash(
                    "admin1234",
                    10
                );

            await User.create({

                username: "superadmin",

                password: hashedPassword,

                role: "admin",

                mustChangePassword: true

            });

            console.log(
                "Default Admin Created: superadmin"
            );

        }


        const teacherExists =
            await User.findOne({
                username: "teacher"
            });

        if (!teacherExists) {

            const hashedPassword =
                await bcrypt.hash(
                    "teacher1234",
                    10
                );

            await User.create({

                username: "teacher",

                password: hashedPassword,

                role: "teacher",

                mustChangePassword: true

            });

            console.log(
                "Default Teacher Created: teacher"
            );

        }

    }
    catch (err) {

        console.error(
            "User creation error:",
            err.message
        );

    }

}


// =====================================================
// Authentication
// =====================================================

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {

        return res.status(401).json({

            success: false,

            message:
                "লগইন প্রয়োজন।"

        });

    }

    const token =
        authHeader.split(" ")[1];

    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.user = decoded;

        next();

    }
    catch (err) {

        return res.status(401).json({

            success: false,

            message:
                "Session expired. আবার লগইন করুন।"

        });

    }

}


// =====================================================
// Admin Only
// =====================================================

function adminOnly(req, res, next) {

    if (
        !req.user ||
        req.user.role !== "admin"
    ) {

        return res.status(403).json({

            success: false,

            message:
                "এই কাজটি শুধু সুপার এডমিন করতে পারবেন।"

        });

    }

    next();

}


// =====================================================
// Login
// =====================================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            if (
                mongoose.connection.readyState !== 1
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "MongoDB সংযোগ পাওয়া যাচ্ছে না।"

                });

            }


            const username =
                String(
                    req.body.username || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );


            const user =
                await User.findOne({
                    username: username
                });


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "ইউজারনেম অথবা পাসওয়ার্ড ভুল।"

                });

            }


            const isMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!isMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "ইউজারনেম অথবা পাসওয়ার্ড ভুল।"

                });

            }


            const token =
                jwt.sign(

                    {
                        id: user._id.toString(),

                        username:
                            user.username,

                        role:
                            user.role
                    },

                    JWT_SECRET,

                    {
                        expiresIn: "7d"
                    }

                );


            res.json({

                success: true,

                token: token,

                username:
                    user.username,

                role:
                    user.role,

                mustChangePassword:
                    user.mustChangePassword === true

            });

        }
        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message:
                    "Server Error: " +
                    err.message

            });

        }

    }
);


// =====================================================
// Change Password
// =====================================================

app.post(
    "/api/change-password",
    authenticateToken,
    async (req, res) => {

        try {

            const currentPassword =
                String(
                    req.body.currentPassword || ""
                );

            const newPassword =
                String(
                    req.body.newPassword || ""
                );


            if (
                !currentPassword ||
                !newPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "সব তথ্য পূরণ করুন।"

                });

            }


            if (newPassword.length < 6) {

                return res.status(400).json({

                    success: false,

                    message:
                        "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"

                });

            }


            const user =
                await User.findById(
                    req.user.id
                );


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User পাওয়া যায়নি।"

                });

            }


            const isMatch =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );


            if (!isMatch) {

                return res.status(400).json({

                    success: false,

                    message:
                        "বর্তমান পাসওয়ার্ড ভুল।"

                });

            }


            user.password =
                await bcrypt.hash(
                    newPassword,
                    10
                );

            user.mustChangePassword =
                false;


            await user.save();


            res.json({

                success: true,

                message:
                    "Password সফলভাবে পরিবর্তন হয়েছে।"

            });

        }
        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message:
                    "Password পরিবর্তন করতে সমস্যা হয়েছে।"

            });

        }

    }
);


// =====================================================
// Get Students
// =====================================================

app.get(
    "/api/students",
    authenticateToken,
    async (req, res) => {

        try {

            const students =
                await Student.find()
                    .sort({
                        studentClass: 1,
                        roll: 1
                    });


            res.json({

                success: true,

                data: students,

                userRole:
                    req.user.role

            });

        }
        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message:
                    "শিক্ষার্থীদের তথ্য লোড করা যায়নি।"

            });

        }

    }
);


// =====================================================
// Add Student
// =====================================================

app.post(
    "/api/students",
    authenticateToken,
    adminOnly,
    upload.single("photo"),
    async (req, res) => {

        try {

            const student =
                new Student({

                    name:
                        req.body.name || "",

                    roll:
                        req.body.roll || "",

                    studentClass:
                        req.body.studentClass || "",

                    section:
                        req.body.section || "",

                    father_name:
                        req.body.father_name || "",

                    mother_name:
                        req.body.mother_name || "",

                    mobile:
                        req.body.mobile || "",

                    birth_reg:
                        req.body.birth_reg || "",

                    address:
                        req.body.address || "",

                    photo:
                        req.file
                            ? req.file.filename
                            : ""

                });


            await student.save();


            res.json({

                success: true,

                message:
                    "শিক্ষার্থী সফলভাবে যুক্ত হয়েছে।",

                data:
                    student

            });

        }
        catch (err) {

            console.error(err);

            if (req.file) {

                const p =
                    path.join(
                        uploadDir,
                        req.file.filename
                    );

                if (fs.existsSync(p)) {
                    fs.unlinkSync(p);
                }

            }


            res.status(500).json({

                success: false,

                message:
                    "শিক্ষার্থী যুক্ত করতে সমস্যা হয়েছে।"

            });

        }

    }
);


// =====================================================
// Update Student
// =====================================================

app.put(
    "/api/students/:id",
    authenticateToken,
    adminOnly,
    upload.single("photo"),
    async (req, res) => {

        try {

            const student =
                await Student.findById(
                    req.params.id
                );


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "শিক্ষার্থী পাওয়া যায়নি।"

                });

            }


            student.name =
                req.body.name || "";

            student.roll =
                req.body.roll || "";

            student.studentClass =
                req.body.studentClass || "";

            student.section =
                req.body.section || "";

            student.father_name =
                req.body.father_name || "";

            student.mother_name =
                req.body.mother_name || "";

            student.mobile =
                req.body.mobile || "";

            student.birth_reg =
                req.body.birth_reg || "";

            student.address =
                req.body.address || "";


            if (req.file) {

                if (student.photo) {

                    const oldPath =
                        path.join(
                            uploadDir,
                            student.photo
                        );

                    if (
                        fs.existsSync(oldPath)
                    ) {

                        fs.unlinkSync(oldPath);

                    }

                }

                student.photo =
                    req.file.filename;

            }


            await student.save();


            res.json({

                success: true,

                message:
                    "তথ্য আপডেট হয়েছে।",

                data:
                    student

            });

        }
        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message:
                    "তথ্য আপডেট করতে সমস্যা হয়েছে।"

            });

        }

    }
);


// =====================================================
// Delete Student
// =====================================================

app.delete(
    "/api/students/:id",
    authenticateToken,
    adminOnly,
    async (req, res) => {

        try {

            const student =
                await Student.findById(
                    req.params.id
                );


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "শিক্ষার্থী পাওয়া যায়নি।"

                });

            }


            if (student.photo) {

                const photoPath =
                    path.join(
                        uploadDir,
                        student.photo
                    );

                if (
                    fs.existsSync(photoPath)
                ) {

                    fs.unlinkSync(photoPath);

                }

            }


            await Student.findByIdAndDelete(
                req.params.id
            );


            res.json({

                success: true,

                message:
                    "তথ্য মুছে ফেলা হয়েছে।"

            });

        }
        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message:
                    "Delete করতে সমস্যা হয়েছে।"

            });

        }

    }
);


// =====================================================
// Error Handler
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(err);

        res.status(400).json({

            success: false,

            message:
                err.message ||
                "Server Error"

        });

    }
);


// =====================================================
// Frontend
// =====================================================

// Express 5 compatible
app.get(
    /.*/,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


// =====================================================
// Start Server
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Al-Hera Madrasah Server running on port ${PORT}`
        );

    }
);
