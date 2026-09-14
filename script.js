let allStudents = [];

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) {
        showApp();
    }

    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("username", data.username);
            showApp();
        } else {
            alert(data.message);
        }
    });

    document.getElementById("studentForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const studentId = document.getElementById("studentId").value;
        const formData = new FormData();

        formData.append("name", document.getElementById("name").value);
        formData.append("roll", document.getElementById("roll").value);
        formData.append("studentClass", document.getElementById("studentClass").value);
        formData.append("section", document.getElementById("section").value);
        formData.append("father_name", document.getElementById("father_name").value);
        formData.append("mother_name", document.getElementById("mother_name").value);
        formData.append("mobile", document.getElementById("mobile").value);
        formData.append("birth_reg", document.getElementById("birth_reg").value);
        formData.append("address", document.getElementById("address").value);

        const photoInput = document.getElementById("photo");
        if (photoInput.files[0]) formData.append("photo", photoInput.files[0]);

        let url = '/api/students';
        let method = 'POST';

        if (studentId) {
            url = `/api/students/${studentId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert(studentId ? "তথ্য আপডেট হয়েছে!" : "শিক্ষার্থী যুক্ত হয়েছে!");
            resetForm();
            loadStudents();
        } else {
            const errData = await res.json();
            alert(errData.message || "সমস্যা হয়েছে!");
        }
    });
});

function showApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
    
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    document.getElementById("userBadge").innerText = `লগইন: ${username} (${role === 'admin' ? 'সুপার এডমিন' : 'শিক্ষক'})`;
    
    loadStudents();
}

function logout() {
    localStorage.clear();
    location.reload();
}

async function loadStudents() {
    const token = localStorage.getItem("token");
    const res = await fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
        logout();
        return;
    }

    const result = await res.json();
    allStudents = result.data;
    const currentRole = result.userRole;

    const tableBody = document.getElementById("studentTableBody");
    tableBody.innerHTML = "";

    allStudents.forEach(student => {
        const photoUrl = student.photo ? `/uploads/${student.photo}` : 'https://via.placeholder.com/45?text=No+Img';
        let actionButtons = `<span class="text-muted">শুধু দেখার অনুমতি</span>`;

        if (currentRole === 'admin') {
            actionButtons = `
                <button class="btn btn-sm btn-warning me-1" onclick="editStudent('${student._id}')">সম্পাদনা</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student._id}')">ডিলিট</button>
            `;
        }

        const row = `
            <tr>
                <td><img src="${photoUrl}" class="student-img border shadow-sm"></td>
                <td><strong>${student.roll}</strong></td>
                <td>${student.name}</td>
                <td><span class="badge bg-success">${student.class}</span></td>
                <td>${student.mobile || '-'}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function editStudent(id) {
    const student = allStudents.find(s => s._id === id);
    if (!student) return;

    document.getElementById("studentId").value = student._id;
    document.getElementById("name").value = student.name;
    document.getElementById("roll").value = student.roll;
    document.getElementById("studentClass").value = student.class;
    document.getElementById("section").value = student.section || '';
    document.getElementById("father_name").value = student.father_name || '';
    document.getElementById("mother_name").value = student.mother_name || '';
    document.getElementById("mobile").value = student.mobile || '';
    document.getElementById("birth_reg").value = student.birth_reg || '';
    document.getElementById("address").value = student.address || '';

    document.getElementById("formTitle").innerText = "তথ্য সংশোধন করুন";
    document.getElementById("submitBtn").innerText = "আপডেট করুন";
    document.getElementById("cancelBtn").classList.remove("d-none");
}

function resetForm() {
    document.getElementById("studentId").value = "";
    document.getElementById("studentForm").reset();
    document.getElementById("formTitle").innerText = "শিক্ষার্থী তথ্য ইনপুট";
    document.getElementById("submitBtn").innerText = "সংরক্ষণ করুন";
    document.getElementById("cancelBtn").classList.add("d-none");
}

async function deleteStudent(id) {
    if (confirm("আপনি কি নিশ্চিতভাবে এই শিক্ষার্থীর তথ্য মুছে ফেলতে চান?")) {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/students/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("তথ্য মুছে ফেলা হয়েছে!");
            loadStudents();
        } else {
            const errData = await res.json();
            alert(errData.message || "ডিলিট করতে সমস্যা হয়েছে!");
        }
    }
}