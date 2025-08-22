// Employee Attendance Page JS
// Assumes user authentication and API endpoints are handled elsewhere

document.addEventListener('DOMContentLoaded', function () {
    // Sidebar toggle for mobile
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    let sidebarOverlay = document.querySelector('.sidebar-overlay');
    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.style.display = 'none';
    }
    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        sidebarOverlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    });
    sidebarOverlay.addEventListener('click', closeSidebar);

    // ========== Mark Attendance Section ==========
    const checkInBtn = document.getElementById('check-in-btn');
    const checkOutBtn = document.getElementById('check-out-btn');
    const timestampSpan = document.querySelector('#attendance-timestamp span');
    const validationMsg = document.getElementById('attendance-validation-msg');

    // API helpers
    const API_BASE = '/api/attendance';
    function getAuthHeaders() {
        try {
            const token = localStorage.getItem('userToken');
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        } catch (_) { return {}; }
    }

    let checkedIn = false;
    let checkedOut = false;

    function updateTimestamp() {
        const now = new Date();
        timestampSpan.textContent = now.toLocaleString();
    }
    setInterval(updateTimestamp, 1000);
    updateTimestamp();

    function toggleAttendanceButtons() {
        if (!checkedIn) {
            checkInBtn.style.display = '';
            checkOutBtn.style.display = 'none';
        } else if (checkedIn && !checkedOut) {
            checkInBtn.style.display = 'none';
            checkOutBtn.style.display = '';
        } else {
            checkInBtn.style.display = 'none';
            checkOutBtn.style.display = 'none';
        }
    }
    toggleAttendanceButtons();

    async function apiCheckIn() {
        try {
            const res = await fetch(`${API_BASE}/checkin`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ location: 'web' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Check-in failed');
            checkedIn = true; checkedOut = false;
            validationMsg.style.color = '#059669';
            validationMsg.textContent = 'Checked in at ' + new Date(data.attendance.checkIn.time).toLocaleTimeString();
            toggleAttendanceButtons();
            await loadSalarySummary();
        } catch (err) {
            validationMsg.style.color = '#b91c1c';
            validationMsg.textContent = err.message;
        }
    }

    async function apiCheckOut() {
        try {
            const res = await fetch(`${API_BASE}/checkout`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ location: 'web' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Check-out failed');
            checkedOut = true;
            validationMsg.style.color = '#059669';
            validationMsg.textContent = 'Checked out at ' + new Date(data.attendance.checkOut.time).toLocaleTimeString() +
              (data.attendance.deductionAmount ? ` · Deduction: Rs ${data.attendance.deductionAmount}` : '');
            toggleAttendanceButtons();
            await loadSalarySummary();
        } catch (err) {
            validationMsg.style.color = '#b91c1c';
            validationMsg.textContent = err.message;
        }
    }

    checkInBtn.addEventListener('click', apiCheckIn);
    checkOutBtn.addEventListener('click', apiCheckOut);

    async function refreshTodayStatus() {
        try {
            const res = await fetch(`${API_BASE}/today`, { credentials: 'include', headers: { ...getAuthHeaders() } });
            const data = await res.json();
            const att = data.attendance;
            if (att?.checkIn?.time) {
                checkedIn = true;
                if (att?.checkOut?.time) checkedOut = true; else checkedOut = false;
                validationMsg.style.color = '#059669';
                validationMsg.textContent = att.checkOut?.time ? 'Checked out' : 'You are checked in for today.';
            } else {
                checkedIn = false; checkedOut = false;
                validationMsg.style.color = '#6b7280';
                validationMsg.textContent = 'Not checked in yet.';
            }
            toggleAttendanceButtons();
        } catch (_) { /* ignore */ }
    }

    async function loadSalarySummary() {
        try {
            const res = await fetch(`${API_BASE}/salary/summary`, { credentials: 'include', headers: { ...getAuthHeaders() } });
            const data = await res.json();
            if (res.ok && data.success) {
                const valueEl = document.getElementById('salary-remaining-value');
                const noteEl = document.getElementById('salary-remaining-note');
                valueEl.textContent = `Rs ${data.net}`;
                noteEl.textContent = `Gross: Rs ${data.gross} · Deduction: Rs ${data.totalDeduction}`;
            }
        } catch (_) { /* ignore */ }
    }

    refreshTodayStatus();
    loadSalarySummary();

    // ========== Calendar View Section ==========
    const calendarGrid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month-label');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // Dummy attendance data for calendar (replace with API data)
    // Format: { 'YYYY-MM-DD': { status: 'present'|'absent'|'leave'|'late'|'holiday', checkIn: '', checkOut: '', note: '' } }
    let attendanceData = {
        '2025-07-01': { status: 'present', checkIn: '09:55', checkOut: '18:10', note: '' },
        '2025-07-02': { status: 'late', checkIn: '10:30', checkOut: '18:20', note: 'Late login' },
        '2025-07-03': { status: 'absent', checkIn: '', checkOut: '', note: 'No activity' },
        '2025-07-04': { status: 'leave', checkIn: '', checkOut: '', note: 'Sick leave' },
    };

    function renderCalendar(month, year) {
        calendarGrid.innerHTML = '';
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        monthLabel.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

        // Fill empty days before 1st
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day holiday';
            calendarGrid.appendChild(emptyCell);
        }
        // Fill days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayData = attendanceData[dateStr] || {};
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day ' + (dayData.status || 'absent');
            dayDiv.textContent = d;
            dayDiv.title = dayData.status ? `${dayData.status.charAt(0).toUpperCase() + dayData.status.slice(1)}${dayData.note ? ': ' + dayData.note : ''}` : 'Absent';
            dayDiv.tabIndex = 0;
            // Pop-up on click/hover
            dayDiv.addEventListener('click', function () {
                alert(`Date: ${dateStr}\nStatus: ${dayData.status || 'Absent'}\nCheck-In: ${dayData.checkIn || '-'}\nCheck-Out: ${dayData.checkOut || '-'}\nNote: ${dayData.note || '-'}`);
            });
            calendarGrid.appendChild(dayDiv);
        }
    }
    renderCalendar(currentMonth, currentYear);
    prevMonthBtn.addEventListener('click', function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });
    nextMonthBtn.addEventListener('click', function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    // ========== Summary Widgets ==========
    function updateSummaryWidgets() {
        // Dummy stats (replace with API data)
        document.getElementById('total-days').querySelector('span').textContent = '22';
        document.getElementById('days-present').querySelector('span').textContent = '16';
        document.getElementById('days-absent').querySelector('span').textContent = '3';
        document.getElementById('days-leave').querySelector('span').textContent = '2';
        document.getElementById('late-days').querySelector('span').textContent = '1';
        document.getElementById('attendance-percentage').querySelector('span').textContent = '81.8%';
    }
    updateSummaryWidgets();

    // ========== Attendance Table ==========
    const attendanceTableBody = document.querySelector('#attendance-table tbody');
    const statusFilter = document.getElementById('status-filter');
    const searchDate = document.getElementById('search-date');
    const searchNote = document.getElementById('search-note');

    function renderAttendanceTable() {
        attendanceTableBody.innerHTML = '';
        // Convert attendanceData to array
        const rows = Object.entries(attendanceData).map(([date, data]) => ({ date, ...data }));
        let filtered = rows;
        // Filter by status
        if (statusFilter.value !== 'all') {
            filtered = filtered.filter(row => row.status === statusFilter.value);
        }
        // Filter by date
        if (searchDate.value) {
            filtered = filtered.filter(row => row.date.includes(searchDate.value));
        }
        // Filter by note
        if (searchNote.value) {
            filtered = filtered.filter(row => (row.note || '').toLowerCase().includes(searchNote.value.toLowerCase()));
        }
        // Render rows
        for (const row of filtered) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.date}</td>
                <td><span class="status-tag status-${row.status}">${row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '-'}</span></td>
                <td>${row.checkIn || '-'}</td>
                <td>${row.checkOut || '-'}</td>
                <td>${row.status === 'absent' ? '0h' : row.status === 'leave' ? '-' : '8h 15m'}</td>
                <td>${row.note || '-'}</td>
            `;
            attendanceTableBody.appendChild(tr);
        }
    }
    renderAttendanceTable();
    statusFilter.addEventListener('change', renderAttendanceTable);
    searchDate.addEventListener('input', renderAttendanceTable);
    searchNote.addEventListener('input', renderAttendanceTable);

    // ========== Export Buttons ==========
    document.getElementById('export-pdf').addEventListener('click', function () {
        alert('Export to PDF feature coming soon!');
    });
    document.getElementById('export-csv').addEventListener('click', function () {
        alert('Export to CSV feature coming soon!');
    });

    // ========== Manual Attendance Request ==========
    const manualReason = document.getElementById('manual-reason');
    const manualReasonCustom = document.getElementById('manual-reason-custom');
    const manualForm = document.getElementById('manual-request-form');
    const manualStatus = document.getElementById('manual-request-status');

    manualReason.addEventListener('change', function () {
        if (manualReason.value === 'other') {
            manualReasonCustom.style.display = '';
            manualReasonCustom.required = true;
        } else {
            manualReasonCustom.style.display = 'none';
            manualReasonCustom.required = false;
        }
    });
    manualForm.addEventListener('submit', function (e) {
        e.preventDefault();
        manualStatus.textContent = 'Request submitted (pending approval).';
        manualStatus.style.color = '#2d6cdf';
        manualForm.reset();
        manualReasonCustom.style.display = 'none';
        // TODO: Send request to backend
    });

    // ========== Date Range Filter (Summary) ==========
    document.getElementById('date-range').addEventListener('change', function () {
        // TODO: Update all widgets, calendar, and table based on selected range
        alert('Date range filter feature coming soon!');
    });
}); 