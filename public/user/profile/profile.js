// Profile Page JS – Employee Panel
// Handles interactivity for profile.html

// ========== Personal Info Edit/Save/Cancel ==========
const editBtn = document.getElementById('editPersonalBtn');
const saveBtn = document.getElementById('savePersonalBtn');
const cancelBtn = document.getElementById('cancelPersonalBtn');
const personalInfoForm = document.getElementById('personalInfoForm');
const personalInputs = personalInfoForm.querySelectorAll('input:not([readonly]), select');

editBtn.addEventListener('click', () => {
    personalInputs.forEach(input => input.removeAttribute('readonly'));
    editBtn.classList.add('d-none');
    saveBtn.classList.remove('d-none');
    cancelBtn.classList.remove('d-none');
});

cancelBtn.addEventListener('click', () => {
    // TODO: Reset form to original values (fetch from backend or cache)
    personalInputs.forEach(input => input.setAttribute('readonly', true));
    editBtn.classList.remove('d-none');
    saveBtn.classList.add('d-none');
    cancelBtn.classList.add('d-none');
});

personalInfoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO: Validate and send updated info to backend
    personalInputs.forEach(input => input.setAttribute('readonly', true));
    editBtn.classList.remove('d-none');
    saveBtn.classList.add('d-none');
    cancelBtn.classList.add('d-none');
    // Show feedback (success/error)
});

// ========== Profile Photo Upload ==========
const changePhotoBtn = document.getElementById('changePhotoBtn');
const photoInput = document.getElementById('photoInput');
const profilePhoto = document.getElementById('profilePhoto');

changePhotoBtn.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            profilePhoto.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        // TODO: Upload to backend
    }
});

// ========== Change Password Modal ==========
const changePasswordForm = document.getElementById('changePasswordForm');
const passwordChangeFeedback = document.getElementById('passwordChangeFeedback');

changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (newPassword !== confirmPassword) {
        passwordChangeFeedback.textContent = 'New passwords do not match.';
        return;
    }
    // TODO: Send password change request to backend
    passwordChangeFeedback.textContent = '';
    // Show success/error feedback
});

// ========== Document Upload ==========
const documentUploadForm = document.getElementById('documentUploadForm');
const documentInput = document.getElementById('documentInput');
const documentType = document.getElementById('documentType');
const uploadedDocuments = document.getElementById('uploadedDocuments');

documentUploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = documentInput.files[0];
    const type = documentType.value;
    if (!file) return;
    // TODO: Validate file type/size, upload to backend
    // On success, update uploadedDocuments list
});

// ========== Export as PDF ==========
document.getElementById('exportPdfBtn').addEventListener('click', () => {
    // TODO: Implement export to PDF (e.g., using html2pdf.js or similar)
    alert('Export to PDF coming soon!');
});

// ========== Fetch and Render Data ==========
function fetchProfileData() {
    // TODO: Fetch profile data from backend and populate fields
}
function fetchAttendanceSummary() {
    // TODO: Fetch attendance summary and update widgets
}
function fetchLeaveSummary() {
    // TODO: Fetch leave summary and recent requests
}
function fetchDocuments() {
    // TODO: Fetch uploaded documents and render
}
function fetchMessages() {
    // TODO: Fetch recent messages and render
}

// On page load
window.addEventListener('DOMContentLoaded', () => {
    fetchProfileData();
    fetchAttendanceSummary();
    fetchLeaveSummary();
    fetchDocuments();
    fetchMessages();
}); 