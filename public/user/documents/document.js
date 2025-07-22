// Sample document data
let documents = [
  {
    id: 1,
    title: "Resume.pdf",
    category: "CV",
    uploadedOn: "2025-07-15",
    status: "Verified",
    fileName: "Resume.pdf",
    description: "My latest CV for HR records.",
    url: "#"
  },
  {
    id: 2,
    title: "Cert-JS.png",
    category: "Certification",
    uploadedOn: "2025-06-01",
    status: "Pending",
    fileName: "Cert-JS.png",
    description: "JavaScript certification image.",
    url: "#"
  },
  {
    id: 3,
    title: "Report.docx",
    category: "Report",
    uploadedOn: "2025-07-10",
    status: "Verified",
    fileName: "Report.docx",
    description: "Monthly performance report.",
    url: "#"
  }
];

let filteredCategory = "All";
let searchQuery = "";
let sortAsc = false;
let deleteDocId = null;

const tableBody = document.getElementById("documentsTableBody");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const sortBtn = document.getElementById("sortBtn");
const toastContainer = document.getElementById("toastContainer");
const uploadForm = document.getElementById("uploadForm");
const deleteModal = document.getElementById("deleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

function renderTable() {
  let data = documents.filter(doc => {
    let matchCategory = filteredCategory === "All" || doc.category === filteredCategory;
    let matchSearch =
      doc.title.toLowerCase().includes(searchQuery) ||
      doc.category.toLowerCase().includes(searchQuery);
    return matchCategory && matchSearch;
  });
  if (sortAsc) {
    data = data.slice().sort((a, b) => new Date(a.uploadedOn) - new Date(b.uploadedOn));
  } else {
    data = data.slice().sort((a, b) => new Date(b.uploadedOn) - new Date(a.uploadedOn));
  }
  tableBody.innerHTML = data.length
    ? data
        .map(
          (doc) => `
      <tr class="text-sm text-gray-700 hover:bg-gray-50 border-b">
        <td class="p-3">${doc.title}</td>
        <td class="p-3">${doc.category}</td>
        <td class="p-3">${doc.uploadedOn}</td>
        <td class="p-3">
          <span class="status-badge ${doc.status === "Verified" ? "status-verified" : "status-pending"}">
            ${doc.status === "Verified" ? "✅ Verified" : "⏳ Pending"}
          </span>
        </td>
        <td class="p-3 flex gap-2">
          <button class="text-blue-600 hover:text-blue-800 text-sm" onclick="downloadDoc(${doc.id})">🔽 Download</button>
          <button class="text-red-500 hover:text-red-700 text-sm" onclick="showDeleteModal(${doc.id})">🗑️ Delete</button>
        </td>
      </tr>
    `
        )
        .join("")
    : `<tr><td colspan="5" class="p-4 text-center text-gray-400">No documents found.</td></tr>`;
}

function setCategoryFilter(e) {
  if (!e.target.classList.contains("filter-item")) return;
  document.querySelectorAll(".filter-item").forEach((el) => el.classList.remove("active"));
  e.target.classList.add("active");
  filteredCategory = e.target.dataset.category;
  renderTable();
}

function handleSearch(e) {
  searchQuery = e.target.value.trim().toLowerCase();
  renderTable();
}

function handleSort() {
  sortAsc = !sortAsc;
  renderTable();
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = type === "success" ? "toast-success" : "toast-error";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function validateFile(file) {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (!allowedTypes.includes(file.type)) {
    showToast("Invalid file type.", "error");
    return false;
  }
  if (file.size > maxSize) {
    showToast("File size exceeds limit.", "error");
    return false;
  }
  return true;
}

function handleUpload(e) {
  e.preventDefault();
  const form = e.target;
  const title = form.title.value.trim();
  const category = form.category.value;
  const file = form.file.files[0];
  const description = form.description.value.trim();

  if (!title || !category || !file) {
    showToast("Please fill all required fields.", "error");
    return;
  }
  if (!validateFile(file)) return;

  // Simulate upload
  const newDoc = {
    id: Date.now(),
    title: file.name,
    category,
    uploadedOn: new Date().toISOString().slice(0, 10),
    status: "Pending",
    fileName: file.name,
    description,
    url: "#"
  };
  documents.unshift(newDoc);
  renderTable();
  showToast("Document uploaded successfully.", "success");
  form.reset();
}

function downloadDoc(id) {
  const doc = documents.find((d) => d.id === id);
  if (doc) {
    showToast(`Downloading: ${doc.title}`, "success");
    // Simulate download
    // In real app, use: window.location.href = `/api/documents/${id}/download`;
  }
}

function showDeleteModal(id) {
  deleteDocId = id;
  deleteModal.classList.add("active");
  deleteModal.classList.remove("hidden");
}

function hideDeleteModal() {
  deleteDocId = null;
  deleteModal.classList.remove("active");
  deleteModal.classList.add("hidden");
}

function confirmDelete() {
  if (deleteDocId !== null) {
    documents = documents.filter((doc) => doc.id !== deleteDocId);
    renderTable();
    showToast("Document deleted successfully.", "success");
    hideDeleteModal();
  }
}

// Event Listeners
categoryFilter.addEventListener("click", setCategoryFilter);
searchInput.addEventListener("input", handleSearch);
sortBtn.addEventListener("click", handleSort);
uploadForm.addEventListener("submit", handleUpload);
cancelDeleteBtn.addEventListener("click", hideDeleteModal);
confirmDeleteBtn.addEventListener("click", confirmDelete);

// Initial render
renderTable();
