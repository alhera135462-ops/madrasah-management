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

const JWT_SECRET = "alhera_secret_key_2026_change_later";

/*
====================================================
MONGODB CONNECTION
====================================================

এখানে আপনার বর্তমান কাজ করা MongoDB connection string
একবার বসান।

আপনার Cluster hostname:
cluster0.4rwbrlt.mongodb.net

উদাহরণ:

const MONGO_URI =
"mongodb+srv://alheraadmin:YOUR_OLD_PASSWORD@cluster0.4rwbrlt.mongodb.net/alheramadrasah?retryWrites=true&w=majority&appName=Cluster0";
*/

const MONGO_URI =
"mongodb+srv://alheraadmin:YOUR_OLD_PASSWORD@cluster0.4rwbrlt.mongodb.net/alheramadrasah?retryWrites=true&w=majority&appName=Cluster0";


// =========================
// Middleware
// =========================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));


// =========================
// Upload Folder
// =========================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
    "/uploads",
    express.static(uploadDir)
);


// =========================
// MongoDB
// =========================

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000
})
.then(async () => {

    console.log("MongoDB Connected Successfully");

    await createInitialUsers();

})
.catch((err) => {

    console.error(
        "MONGODB CONNECTION FAILED:",
        err.message
    );

});


// =========================
// User Schema
// =========================

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

});

const User =
    mongoose.model("User", userSchema);


// =========================
// Student Schema
// =========================

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

    class: {
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
    mongoose.model("Student", studentSchema);


// =========================
// Initial Users
// =========================

async function createInitialUsers() {

    try {

        let admin =
            await User.findOne({
                username: "superadmin"
            });

        if (!admin) {

            const password =
                await bcrypt.hash(
                    "admin1234",
                    10
                );

            await User.create({

                username: "superadmin",

                password,

                role: "admin",

                mustChangePassword: true

            });

            console.log(
                "Default Admin Created: superadmin / admin1234"
            );

        }
        else if (
            admin.mustChangePassword === undefined
        ) {

            admin.mustChangePassword = true;

            await admin.save();
        }


        let teacher =
            await User.findOne({
                username: "teacher"
            });

        if (!teacher) {

            const password =
                await bcrypt.hash(
                    "teacher1234",
                    10
                );

            await User.create({

                username: "teacher",

                password,

                role: "teacher",

                mustChangePassword: true

            });

            console.log(
                "Default Teacher Created: teacher / teacher1234"
            );

        }
        else if (
            teacher.mustChangePassword === undefined
        ) {

            teacher.mustChangePassword = true;

            await teacher.save();
        }

    }
    catch (err) {

        console.error(
            "Initial user error:",
            err.message
        );

    }

}


// =========================
// Authentication
// =========================

function authenticateToken(req, res, next) {

    const auth =
        req.headers.authorization;

    if (!auth) {

        return res.status(401).json({

            success: false,

            message: "Login required"

        });

    }

    const token =
        auth.split(" ")[1];

    if (!token) {

        return res.status(401).json({

            success: false,

            message: "Invalid token"

        });

    }

    jwt.verify(
        token,
        JWT_SECRET,
        (err, user) => {

            if (err) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Session expired. Login again."

                });

            }

            req.user = user;

            next();

        }
    );

}


// =========================
// Admin Only
// =========================

function adminOnly(req, res, next) {

    if (req.user.role !== "admin") {

        return res.status(403).json({

            success: false,

            message:
                "শুধু Super Admin এই কাজটি করতে পারবেন।"

        });

    }

    next();

}


// =========================
// Login
// =========================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const username =
                String(
                    req.body.username || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );

            if (!username || !password) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username ও Password দিন।"

                });

            }

            const user =
                await User.findOne({
                    username
                });

            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Username or Password"

                });

            }

            const match =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!match) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid Username or Password"

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
                        expiresIn: "1d"
                    }

                );

            res.json({

                success: true,

                token,

                username: user.username,

                role: user.role,

                mustChangePassword:
                    user.mustChangePassword === true

            });

        }
        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message: "Server Error"

            });

        }

    }
);


// =========================
// Change Password
// =========================

app.post(
    "/api/change-password",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                currentPassword,
                newPassword,
                confirmPassword
            } = req.body;

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "সবগুলো ঘর পূরণ করুন।"

                });

            }

            if (newPassword.length < 6) {

                return res.status(400).json({

                    success: false,

                    message:
                        "নতুন Password কমপক্ষে ৬ অক্ষরের হতে হবে।"

                });

            }

            if (
                newPassword !==
                confirmPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "নতুন Password দুটো একই নয়।"

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

            const match =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );

            if (!match) {

                return res.status(400).json({

                    success: false,

                    message:
                        "বর্তমান Password সঠিক নয়।"

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


// =========================
// Image Upload
// =========================

const storage =
    multer.diskStorage({

        destination:
            (req, file, cb) => {

                cb(
                    null,
                    uploadDir
                );

            },

        filename:
            (req, file, cb) => {

                const ext =
                    path.extname(
                        file.originalname
                    );

                const filename =
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .substring(2, 8) +
                    ext;

                cb(
                    null,
                    filename
                );

            }

    });


const upload =
    multer({

        storage,

        limits: {
            fileSize:
                200 * 1024
        },

        fileFilter:
            (req, file, cb) => {

                if (
                    file.mimetype
                        .startsWith("image/")
                ) {

                    cb(
                        null,
                        true
                    );

                }
                else {

                    cb(
                        new Error(
                            "শুধু Image upload করা যাবে।"
                        )
                    );

                }

            }

    });


// =========================
// Get Students
// =========================

app.get(
    "/api/students",
    authenticateToken,
    async (req, res) => {

        try {

            const students =
                await Student.find()
                .sort({
                    class: 1,
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
                    "Student data load করা যায়নি।"

            });

        }

    }
);


// =========================
// Add Student
// =========================

app.post(
    "/api/students",
    authenticateToken,
    adminOnly,
    upload.single("photo"),
    async (req, res) => {

        try {

            const student =
                await Student.create({

                    name:
                        req.body.name,

                    roll:
                        req.body.roll,

                    class:
                        req.body.studentClass,

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

            res.json({

                success: true,

                message:
                    "শিক্ষার্থী সফলভাবে যুক্ত হয়েছে।",

                data: student

            });

        }
        catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message:
                    "শিক্ষার্থী যুক্ত করতে সমস্যা হয়েছে।"

            });

        }

    }
);


// =========================
// Update Student
// =========================

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
                req.body.name;

            student.roll =
                req.body.roll;

            student.class =
                req.body.studentClass;

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
                        fs.existsSync(
                            oldPath
                        )
                    ) {

                        fs.unlinkSync(
                            oldPath
                        );

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

                data: student

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


// =========================
// Delete Student
// =========================

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
                    fs.existsSync(
                        photoPath
                    )
                ) {

                    fs.unlinkSync(
                        photoPath
                    );

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


// =========================
// Error Handler
// =========================

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


// =========================
// Frontend
// =========================

app.get("*", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


// =========================
// Start
// =========================

app.listen(
    PORT,
    () => {

        console.log(
            `Al-Hera Madrasah Server running on port ${PORT}`
        );

    }
);
