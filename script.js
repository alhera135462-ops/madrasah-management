let allStudents = [];


// =====================================================
// Page Load
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const token =
            localStorage.getItem("token");


        // Login
        document
            .getElementById("loginForm")
            .addEventListener(
                "submit",
                login
            );


        // Student Form
        document
            .getElementById("studentForm")
            .addEventListener(
                "submit",
                saveStudent
            );


        // Cancel button
        document
            .getElementById("cancelBtn")
            .addEventListener(
                "click",
                resetForm
            );


        // Image preview
        document
            .getElementById("photo")
            .addEventListener(
                "change",
                previewPhoto
            );


        if (token) {

            showApp();

        }

    }
);


// =====================================================
// Login
// =====================================================

async function login(e) {

    e.preventDefault();


    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    const button =
        e.target.querySelector(
            "button[type='submit']"
        );


    button.disabled = true;

    button.innerText =
        "লগইন হচ্ছে...";


    try {

        const res =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username,
                            password
                        })
                }
            );


        const data =
            await res.json();


        if (!res.ok) {

            alert(
                data.message ||
                "Login failed"
            );

            return;

        }


        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "role",
            data.role
        );

        localStorage.setItem(
            "username",
            data.username
        );


        showApp();


        // Password Change
        if (
            data.mustChangePassword === true
        ) {

            setTimeout(
                () => {
                    showPasswordModal();
                },
                500
            );

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Server-এর সাথে যোগাযোগ করা যাচ্ছে না।"
        );

    }
    finally {

        button.disabled = false;

        button.innerText =
            "লগইন করুন";

    }

}


// =====================================================
// Show Application
// =====================================================

function showApp() {

    document
        .getElementById("loginSection")
        .style.display = "none";


    document
        .getElementById("appSection")
        .style.display = "block";


    const role =
        localStorage.getItem("role");


    const username =
        localStorage.getItem("username");


    const roleText =
        role === "admin"
            ? "সুপার এডমিন"
            : "শিক্ষক";


    document
        .getElementById("userBadge")
        .innerText =
            `লগইন: ${username} (${roleText})`;


    // Teacher form hide
    if (role !== "admin") {

        document
            .getElementById("studentFormCard")
            .style.display = "none";

    }
    else {

        document
            .getElementById("studentFormCard")
            .style.display = "block";

    }


    loadStudents();

}


// =====================================================
// Logout
// =====================================================

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    location.reload();

}


// =====================================================
// Load Students
// =====================================================

async function loadStudents() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        return;

    }


    const tableBody =
        document.getElementById(
            "studentTableBody"
        );


    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="py-4">
                    <div class="spinner-border text-success"></div>
                    <div class="mt-2">
                        তথ্য লোড হচ্ছে...
                    </div>
                </div>
            </td>
        </tr>
    `;


    try {

        const res =
            await fetch(
                "/api/students",
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const result =
            await res.json();


        /*
         * গুরুত্বপূর্ণ:
         * আগের কোডে যেকোনো error হলে logout()
         * করা হতো।
         *
         * এখন আর সরাসরি logout হবে না।
         */


        if (res.status === 401) {

            alert(
                "আপনার Login Session শেষ হয়েছে। আবার Login করুন।"
            );

            logout();

            return;

        }


        if (!res.ok) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-danger py-4">
                        ${escapeHtml(
                            result.message ||
                            "তথ্য লোড করা যায়নি।"
                        )}
                    </td>
                </tr>
            `;

            return;

        }


        allStudents =
            Array.isArray(result.data)
                ? result.data
                : [];


        renderStudents(
            allStudents
        );

    }
    catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-danger py-4">
                    Server-এর সাথে যোগাযোগ করা যাচ্ছে না।
                </td>
            </tr>
        `;

    }

}


// =====================================================
// Render Students
// =====================================================

function renderStudents(students) {

    const tableBody =
        document.getElementById(
            "studentTableBody"
        );


    tableBody.innerHTML = "";


    if (!students.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-muted py-4">
                    এখনো কোনো শিক্ষার্থী যুক্ত করা হয়নি।
                </td>
            </tr>
        `;

        return;

    }


    const currentRole =
        localStorage.getItem("role");


    students.forEach(
        (student) => {

            const photoUrl =
                student.photo
                    ? `/uploads/${encodeURIComponent(student.photo)}`
                    : "";


            const photo =
                photoUrl
                    ? `
                        <img
                            src="${photoUrl}"
                            class="student-img border shadow-sm"
                            alt="Student"
                        >
                    `
                    : `
                        <div class="no-photo">
                            ছবি নেই
                        </div>
                    `;


            let actionButtons =
                `<span class="text-muted small">
                    শুধু দেখার অনুমতি
                </span>`;


            if (
                currentRole === "admin"
            ) {

                actionButtons = `

                    <button
                        class="btn btn-sm btn-warning me-1 mb-1"
                        onclick="editStudent('${student._id}')"
                    >
                        ✏️ সম্পাদনা
                    </button>

                    <button
                        class="btn btn-sm btn-danger mb-1"
                        onclick="deleteStudent('${student._id}')"
                    >
                        🗑️ ডিলিট
                    </button>

                `;

            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${photo}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(student.roll || "")}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(student.name || "")}
                </td>

                <td>
                    <span class="badge bg-success">
                        ${escapeHtml(
                            student.studentClass || ""
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHtml(
                        student.mobile || "-"
                    )}
                </td>

                <td>
                    ${actionButtons}
                </td>

            `;


            tableBody.appendChild(row);

        }
    );

}


// =====================================================
// Save Student
// =====================================================

async function saveStudent(e) {

    e.preventDefault();


    const token =
        localStorage.getItem("token");


    const studentId =
        document
            .getElementById("studentId")
            .value;


    if (!token) {

        alert(
            "আগে Login করুন।"
        );

        return;

    }


    const form =
        document.getElementById(
            "studentForm"
        );


    const submitButton =
        document.getElementById(
            "submitBtn"
        );


    submitButton.disabled = true;

    submitButton.innerText =
        studentId
            ? "আপডেট হচ্ছে..."
            : "সংরক্ষণ হচ্ছে...";


    try {

        const formData =
            new FormData();


        formData.append(
            "name",
            document.getElementById("name").value.trim()
        );


        formData.append(
            "roll",
            document.getElementById("roll").value.trim()
        );


        formData.append(
            "studentClass",
            document.getElementById("studentClass").value
        );


        formData.append(
            "section",
            document.getElementById("section").value.trim()
        );


        formData.append(
            "father_name",
            document.getElementById("father_name").value.trim()
        );


        formData.append(
            "mother_name",
            document.getElementById("mother_name").value.trim()
        );


        formData.append(
            "mobile",
            document.getElementById("mobile").value.trim()
        );


        formData.append(
            "birth_reg",
            document.getElementById("birth_reg").value.trim()
        );


        formData.append(
            "address",
            document.getElementById("address").value.trim()
        );


        const photoInput =
            document.getElementById(
                "photo"
            );


        if (
            photoInput.files &&
            photoInput.files[0]
        ) {

            const compressed =
                await compressImage(
                    photoInput.files[0]
                );


            formData.append(
                "photo",
                compressed,
                "student.jpg"
            );

        }


        let url =
            "/api/students";

        let method =
            "POST";


        if (studentId) {

            url =
                `/api/students/${studentId}`;

            method =
                "PUT";

        }


        const res =
            await fetch(
                url,
                {
                    method,

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: formData
                }
            );


        const data =
            await res.json();


        if (!res.ok) {

            alert(
                data.message ||
                "সমস্যা হয়েছে।"
            );

            return;

        }


        alert(
            studentId
                ? "তথ্য সফলভাবে আপডেট হয়েছে।"
                : "শিক্ষার্থী সফলভাবে যুক্ত হয়েছে।"
        );


        resetForm();

        await loadStudents();

    }
    catch (error) {

        console.error(error);

        alert(
            "তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।"
        );

    }
    finally {

        submitButton.disabled = false;

        submitButton.innerText =
            studentId
                ? "আপডেট করুন"
                : "সংরক্ষণ করুন";

    }

}


// =====================================================
// Edit Student
// =====================================================

function editStudent(id) {

    const student =
        allStudents.find(
            s => s._id === id
        );


    if (!student) {

        alert(
            "শিক্ষার্থীর তথ্য পাওয়া যায়নি।"
        );

        return;

    }


    document
        .getElementById("studentId")
        .value =
            student._id;


    document
        .getElementById("name")
        .value =
            student.name || "";


    document
        .getElementById("roll")
        .value =
            student.roll || "";


    document
        .getElementById("studentClass")
        .value =
            student.studentClass || "";


    document
        .getElementById("section")
        .value =
            student.section || "";


    document
        .getElementById("father_name")
        .value =
            student.father_name || "";


    document
        .getElementById("mother_name")
        .value =
            student.mother_name || "";


    document
        .getElementById("mobile")
        .value =
            student.mobile || "";


    document
        .getElementById("birth_reg")
        .value =
            student.birth_reg || "";


    document
        .getElementById("address")
        .value =
            student.address || "";


    document
        .getElementById("formTitle")
        .innerText =
            "শিক্ষার্থীর তথ্য সংশোধন";


    document
        .getElementById("submitBtn")
        .innerText =
            "আপডেট করুন";


    document
        .getElementById("cancelBtn")
        .classList
        .remove("d-none");


    document
        .getElementById("studentFormCard")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


// =====================================================
// Reset Form
// =====================================================

function resetForm() {

    document
        .getElementById("studentForm")
        .reset();


    document
        .getElementById("studentId")
        .value = "";


    document
        .getElementById("formTitle")
        .innerText =
            "শিক্ষার্থী তথ্য ইনপুট";


    document
        .getElementById("submitBtn")
        .innerText =
            "সংরক্ষণ করুন";


    document
        .getElementById("cancelBtn")
        .classList
        .add("d-none");


    const preview =
        document.getElementById(
            "photoPreview"
        );


    if (preview) {

        preview.style.display =
            "none";

        preview.src = "";

    }

}


// =====================================================
// Delete Student
// =====================================================

async function deleteStudent(id) {

    const student =
        allStudents.find(
            s => s._id === id
        );


    if (!student) {
        return;
    }


    const confirmed =
        confirm(
            `আপনি কি "${student.name}"-এর তথ্য মুছে ফেলতে চান?`
        );


    if (!confirmed) {
        return;
    }


    const token =
        localStorage.getItem("token");


    try {

        const res =
            await fetch(
                `/api/students/${id}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await res.json();


        if (!res.ok) {

            alert(
                data.message ||
                "ডিলিট করতে সমস্যা হয়েছে।"
            );

            return;

        }


        alert(
            "তথ্য সফলভাবে মুছে ফেলা হয়েছে।"
        );


        await loadStudents();

    }
    catch (error) {

        console.error(error);

        alert(
            "Server-এর সাথে যোগাযোগ করা যাচ্ছে না।"
        );

    }

}


// =====================================================
// Password Modal
// =====================================================

function showPasswordModal() {

    const element =
        document.getElementById(
            "passwordModal"
        );


    if (!element) {
        return;
    }


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        const modal =
            new bootstrap.Modal(
                element
            );

        modal.show();

    }

}


// =====================================================
// Change Password
// =====================================================

async function changePassword(e) {

    e.preventDefault();


    const currentPassword =
        document
            .getElementById(
                "currentPassword"
            )
            .value;


    const newPassword =
        document
            .getElementById(
                "newPassword"
            )
            .value;


    const confirmPassword =
        document
            .getElementById(
                "confirmPassword"
            )
            .value;


    if (
        newPassword !==
        confirmPassword
    ) {

        alert(
            "নতুন Password এবং Confirm Password একই নয়।"
        );

        return;

    }


    if (
        newPassword.length < 6
    ) {

        alert(
            "নতুন Password কমপক্ষে ৬ অক্ষরের হতে হবে।"
        );

        return;

    }


    const token =
        localStorage.getItem(
            "token"
        );


    const button =
        document.getElementById(
            "passwordChangeBtn"
        );


    button.disabled = true;

    button.innerText =
        "পরিবর্তন হচ্ছে...";


    try {

        const res =
            await fetch(
                "/api/change-password",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            currentPassword:
                                currentPassword,

                            newPassword:
                                newPassword

                        })
                }
            );


        const data =
            await res.json();


        if (!res.ok) {

            alert(
                data.message ||
                "Password পরিবর্তন করা যায়নি।"
            );

            return;

        }


        alert(
            "Password সফলভাবে পরিবর্তন হয়েছে।"
        );


        document
            .getElementById(
                "passwordForm"
            )
            .reset();


        const element =
            document.getElementById(
                "passwordModal"
            );


        if (
            typeof bootstrap !==
            "undefined"
        ) {

            const modal =
                bootstrap.Modal
                    .getInstance(
                        element
                    );

            if (modal) {

                modal.hide();

            }

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Password পরিবর্তন করতে সমস্যা হয়েছে।"
        );

    }
    finally {

        button.disabled = false;

        button.innerText =
            "Password পরিবর্তন করুন";

    }

}


// =====================================================
// Image Preview
// =====================================================

function previewPhoto(e) {

    const file =
        e.target.files[0];


    const preview =
        document.getElementById(
            "photoPreview"
        );


    if (
        !file ||
        !preview
    ) {

        return;

    }


    const url =
        URL.createObjectURL(
            file
        );


    preview.src = url;

    preview.style.display =
        "block";

}


// =====================================================
// Image Compression
// প্রায় 50 KB-এর মতো হালকা করা
// =====================================================

async function compressImage(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    const img =
                        new Image();


                    img.onload =
                        function () {

                            let width =
                                img.width;

                            let height =
                                img.height;


                            const maxSize =
                                600;


                            if (
                                width >
                                maxSize ||
                                height >
                                maxSize
                            ) {

                                if (
                                    width >
                                    height
                                ) {

                                    height =
                                        Math.round(
                                            height *
                                            maxSize /
                                            width
                                        );

                                    width =
                                        maxSize;

                                }
                                else {

                                    width =
                                        Math.round(
                                            width *
                                            maxSize /
                                            height
                                        );

                                    height =
                                        maxSize;

                                }

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );


                            let quality =
                                0.80;


                            function makeBlob() {

                                canvas.toBlob(
                                    function (blob) {

                                        if (!blob) {

                                            reject(
                                                new Error(
                                                    "Image compression failed"
                                                )
                                            );

                                            return;

                                        }


                                        // প্রায় 60 KB-এর মধ্যে
                                        // রাখার চেষ্টা
                                        if (
                                            blob.size >
                                            60 * 1024 &&
                                            quality >
                                            0.25
                                        ) {

                                            quality -=
                                                0.10;

                                            makeBlob();

                                        }
                                        else {

                                            resolve(
                                                blob
                                            );

                                        }

                                    },
                                    "image/jpeg",
                                    quality
                                );

                            }


                            makeBlob();

                        };


                    img.onerror =
                        function () {

                            reject(
                                new Error(
                                    "Image load failed"
                                )
                            );

                        };


                    img.src =
                        reader.result;

                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "File read failed"
                        )
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


// =====================================================
// Escape HTML
// =====================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
