let allStudents = [];


// =====================================
// DOM READY
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const token =
            localStorage.getItem("token");

        if (token) {
            showApp();
        }


        // ===============================
        // LOGIN
        // ===============================

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async (e) => {

                    e.preventDefault();

                    try {

                        const username =
                            document.getElementById(
                                "loginUsername"
                            ).value.trim();

                        const password =
                            document.getElementById(
                                "loginPassword"
                            ).value;


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


                        if (
                            data.mustChangePassword
                        ) {

                            setTimeout(
                                () => {
                                    openPasswordModal();
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

                }
            );

        }


        // ===============================
        // STUDENT FORM
        // ===============================

        const studentForm =
            document.getElementById(
                "studentForm"
            );

        if (studentForm) {

            studentForm.addEventListener(
                "submit",
                async (e) => {

                    e.preventDefault();


                    const token =
                        localStorage.getItem(
                            "token"
                        );


                    if (!token) {

                        alert(
                            "দয়া করে Login করুন।"
                        );

                        return;
                    }


                    try {

                        const studentId =
                            document.getElementById(
                                "studentId"
                            ).value;


                        const formData =
                            new FormData();


                        formData.append(
                            "name",
                            document.getElementById(
                                "name"
                            ).value
                        );


                        formData.append(
                            "roll",
                            document.getElementById(
                                "roll"
                            ).value
                        );


                        formData.append(
                            "studentClass",
                            document.getElementById(
                                "studentClass"
                            ).value
                        );


                        formData.append(
                            "section",
                            document.getElementById(
                                "section"
                            ).value
                        );


                        formData.append(
                            "father_name",
                            document.getElementById(
                                "father_name"
                            ).value
                        );


                        formData.append(
                            "mother_name",
                            document.getElementById(
                                "mother_name"
                            ).value
                        );


                        formData.append(
                            "mobile",
                            document.getElementById(
                                "mobile"
                            ).value
                        );


                        formData.append(
                            "birth_reg",
                            document.getElementById(
                                "birth_reg"
                            ).value
                        );


                        formData.append(
                            "address",
                            document.getElementById(
                                "address"
                            ).value
                        );


                        // ======================
                        // PHOTO COMPRESSION
                        // ======================

                        const photoInput =
                            document.getElementById(
                                "photo"
                            );


                        if (
                            photoInput &&
                            photoInput.files.length > 0
                        ) {

                            const original =
                                photoInput.files[0];


                            const compressed =
                                await compressImage(
                                    original
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
                                        Authorization:
                                            `Bearer ${token}`
                                    },

                                    body: formData

                                }
                            );


                        const data =
                            await res.json();


                        if (
                            res.status === 401
                        ) {

                            logout();

                            return;
                        }


                        if (!res.ok) {

                            alert(
                                data.message ||
                                "সমস্যা হয়েছে!"
                            );

                            return;
                        }


                        alert(
                            studentId
                                ? "তথ্য আপডেট হয়েছে!"
                                : "শিক্ষার্থী যুক্ত হয়েছে!"
                        );


                        resetForm();

                        loadStudents();

                    }
                    catch (error) {

                        console.error(error);

                        alert(
                            "তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।"
                        );

                    }

                }
            );

        }

    }
);


// =====================================
// IMAGE COMPRESSOR
// =====================================

async function compressImage(file) {

    const image =
        await createImageBitmap(file);


    const maxWidth = 600;
    const maxHeight = 600;


    let width =
        image.width;

    let height =
        image.height;


    if (
        width > maxWidth ||
        height > maxHeight
    ) {

        const ratio =
            Math.min(
                maxWidth / width,
                maxHeight / height
            );

        width =
            Math.round(
                width * ratio
            );

        height =
            Math.round(
                height * ratio
            );

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
        image,
        0,
        0,
        width,
        height
    );


    // প্রথমে quality 0.70
    let quality = 0.70;

    let blob =
        await canvasToBlob(
            canvas,
            quality
        );


    // 100KB-এর বেশি হলে quality কমাবে
    while (
        blob.size > 100 * 1024 &&
        quality > 0.25
    ) {

        quality -= 0.05;

        blob =
            await canvasToBlob(
                canvas,
                quality
            );

    }


    // 60KB-এর বেশি হলে আরও ছোট করবে
    while (
        blob.size > 60 * 1024 &&
        quality > 0.15
    ) {

        quality -= 0.03;

        blob =
            await canvasToBlob(
                canvas,
                quality
            );

    }


    return blob;
}


function canvasToBlob(
    canvas,
    quality
) {

    return new Promise(
        (resolve) => {

            canvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                "image/jpeg",
                quality
            );

        }
    );

}


// =====================================
// SHOW APP
// =====================================

function showApp() {

    const loginSection =
        document.getElementById(
            "loginSection"
        );

    const appSection =
        document.getElementById(
            "appSection"
        );


    if (loginSection)
        loginSection.style.display =
            "none";


    if (appSection)
        appSection.style.display =
            "block";


    const role =
        localStorage.getItem(
            "role"
        );

    const username =
        localStorage.getItem(
            "username"
        );


    const badge =
        document.getElementById(
            "userBadge"
        );


    if (badge) {

        badge.innerText =
            `লগইন: ${username} (${
                role === "admin"
                    ? "সুপার এডমিন"
                    : "শিক্ষক"
            })`;

    }


    loadStudents();

}


// =====================================
// LOGOUT
// =====================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "role"
    );

    localStorage.removeItem(
        "username"
    );

    location.reload();

}


// =====================================
// LOAD STUDENTS
// =====================================

async function loadStudents() {

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) return;


    try {

        const res =
            await fetch(
                "/api/students",
                {

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }

                }
            );


        const result =
            await res.json();


        // শুধুমাত্র 401 হলে logout
        if (
            res.status === 401
        ) {

            logout();

            return;
        }


        if (!res.ok) {

            alert(
                result.message ||
                "Student data load করা যায়নি।"
            );

            return;
        }


        allStudents =
            result.data || [];


        const role =
            result.userRole;


        const body =
            document.getElementById(
                "studentTableBody"
            );


        if (!body) return;


        body.innerHTML = "";


        if (
            allStudents.length === 0
        ) {

            body.innerHTML = `
                <tr>
                    <td colspan="6"
                        class="text-center text-muted py-4">
                        এখনো কোনো শিক্ষার্থী যুক্ত করা হয়নি।
                    </td>
                </tr>
            `;

            return;
        }


        allStudents.forEach(
            student => {

                const photo =
                    student.photo
                        ? `/uploads/${student.photo}`
                        : "https://via.placeholder.com/45?text=No";


                let actions =
                    `<span class="text-muted">
                        শুধু দেখার অনুমতি
                     </span>`;


                if (
                    role === "admin"
                ) {

                    actions = `

                        <button
                            class="btn btn-sm btn-warning me-1"
                            onclick="editStudent('${student._id}')">
                            সম্পাদনা
                        </button>

                        <button
                            class="btn btn-sm btn-danger"
                            onclick="deleteStudent('${student._id}')">
                            ডিলিট
                        </button>

                    `;

                }


                body.innerHTML += `

                    <tr>

                        <td>
                            <img
                                src="${photo}"
                                style="
                                    width:45px;
                                    height:45px;
                                    object-fit:cover;
                                    border-radius:6px;
                                "
                                class="border"
                            >
                        </td>

                        <td>
                            <strong>
                                ${student.roll || "-"}
                            </strong>
                        </td>

                        <td>
                            ${student.name || "-"}
                        </td>

                        <td>
                            <span class="badge bg-success">
                                ${student.class || "-"}
                            </span>
                        </td>

                        <td>
                            ${student.mobile || "-"}
                        </td>

                        <td>
                            ${actions}
                        </td>

                    </tr>

                `;

            }
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Student data load করতে সমস্যা হয়েছে।"
        );

    }

}


// =====================================
// EDIT
// =====================================

function editStudent(id) {

    const student =
        allStudents.find(
            s => s._id === id
        );


    if (!student) return;


    document.getElementById(
        "studentId"
    ).value =
        student._id;


    document.getElementById(
        "name"
    ).value =
        student.name || "";


    document.getElementById(
        "roll"
    ).value =
        student.roll || "";


    document.getElementById(
        "studentClass"
    ).value =
        student.class || "";


    document.getElementById(
        "section"
    ).value =
        student.section || "";


    document.getElementById(
        "father_name"
    ).value =
        student.father_name || "";


    document.getElementById(
        "mother_name"
    ).value =
        student.mother_name || "";


    document.getElementById(
        "mobile"
    ).value =
        student.mobile || "";


    document.getElementById(
        "birth_reg"
    ).value =
        student.birth_reg || "";


    document.getElementById(
        "address"
    ).value =
        student.address || "";


    document.getElementById(
        "formTitle"
    ).innerText =
        "তথ্য সংশোধন করুন";


    document.getElementById(
        "submitBtn"
    ).innerText =
        "আপডেট করুন";


    document.getElementById(
        "cancelBtn"
    ).classList.remove(
        "d-none"
    );

}


// =====================================
// RESET
// =====================================

function resetForm() {

    document.getElementById(
        "studentId"
    ).value = "";


    document.getElementById(
        "studentForm"
    ).reset();


    document.getElementById(
        "formTitle"
    ).innerText =
        "শিক্ষার্থী তথ্য ইনপুট";


    document.getElementById(
        "submitBtn"
    ).innerText =
        "সংরক্ষণ করুন";


    document.getElementById(
        "cancelBtn"
    ).classList.add(
        "d-none"
    );

}


// =====================================
// DELETE
// =====================================

async function deleteStudent(id) {

    if (
        !confirm(
            "আপনি কি নিশ্চিতভাবে এই শিক্ষার্থীর তথ্য মুছে ফেলতে চান?"
        )
    ) {

        return;

    }


    const token =
        localStorage.getItem(
            "token"
        );


    try {

        const res =
            await fetch(
                `/api/students/${id}`,
                {

                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }

                }
            );


        const data =
            await res.json();


        if (
            res.status === 401
        ) {

            logout();

            return;
        }


        if (res.ok) {

            alert(
                "তথ্য মুছে ফেলা হয়েছে!"
            );

            loadStudents();

        }
        else {

            alert(
                data.message ||
                "ডিলিট করতে সমস্যা হয়েছে!"
            );

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Server error হয়েছে।"
        );

    }

}


// =====================================
// PASSWORD MODAL
// =====================================

function openPasswordModal() {

    const element =
        document.getElementById(
            "passwordModal"
        );


    if (!element) return;


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        const modal =
            bootstrap.Modal
                .getOrCreateInstance(
                    element
                );

        modal.show();

    }

}


// =====================================
// CHANGE PASSWORD
// =====================================

async function changePassword(
    event
) {

    event.preventDefault();


    const token =
        localStorage.getItem(
            "token"
        );


    const currentPassword =
        document.getElementById(
            "currentPassword"
        ).value;


    const newPassword =
        document.getElementById(
            "newPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;


    try {

        const res =
            await fetch(
                "/api/change-password",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            currentPassword,

                            newPassword,

                            confirmPassword

                        })

                }
            );


        const data =
            await res.json();


        if (
            res.status === 401
        ) {

            logout();

            return;
        }


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


        document.getElementById(
            "passwordForm"
        ).reset();


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

}
