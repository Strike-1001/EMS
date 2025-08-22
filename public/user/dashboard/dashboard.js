// Dashboard wiring for Check In/Out and attendance summaries
document.addEventListener('DOMContentLoaded', () => {
  const API_ATT = '/api/attendance';
  const checkInBtn = document.getElementById('checkInBtn');
  const checkOutBtn = document.getElementById('checkOutBtn');
  const checkInTime = document.getElementById('checkInTime');
  const checkOutTime = document.getElementById('checkOutTime');
  const totalHours = document.getElementById('totalHours');
  const todayStatus = document.getElementById('todayStatus');
  const daysPresent = document.getElementById('daysPresent');
  const daysAbsent = document.getElementById('daysAbsent');

  function getAuthHeaders() {
    try {
      const token = localStorage.getItem('userToken');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch (_) { return {}; }
  }

  function setLoading(isLoading) {
    const spinner = document.getElementById('loadingSpinner');
    if (!spinner) return;
    spinner.style.display = isLoading ? 'flex' : 'none';
  }

  async function refreshToday() {
    try {
      const res = await fetch(`${API_ATT}/today`, { credentials: 'include', headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load today status');
      const att = data.attendance;
      if (att?.checkIn?.time) {
        checkInTime.textContent = new Date(att.checkIn.time).toLocaleTimeString();
        todayStatus.textContent = att.status || 'present';
        if (att?.checkOut?.time) {
          checkOutTime.textContent = new Date(att.checkOut.time).toLocaleTimeString();
          totalHours.textContent = `${Math.floor(att.totalHours)}h ${Math.round((att.totalHours % 1) * 60)}m`;
        } else {
          checkOutTime.textContent = '--:--';
          totalHours.textContent = '0h 0m';
        }
      } else {
        checkInTime.textContent = '--:--';
        checkOutTime.textContent = '--:--';
        totalHours.textContent = '0h 0m';
        todayStatus.textContent = 'Not Checked In';
      }
    } catch (_) {}
  }

  async function refreshMonthCounts() {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23,59,59,999).toISOString();
      const res = await fetch(`${API_ATT}/history?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`, {
        credentials: 'include', headers: { ...getAuthHeaders() }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load history');
      const records = Array.isArray(data.attendance) ? data.attendance : [];
      const presentDays = new Set();
      const allDays = new Set();
      records.forEach(r => {
        const d = new Date(r.date);
        d.setHours(0,0,0,0);
        allDays.add(d.getTime());
        if (['present','late','half-day'].includes(r.status)) presentDays.add(d.getTime());
      });
      const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const workingDays = Array.from({length: totalDaysInMonth}, (_,i)=> new Date(now.getFullYear(), now.getMonth(), i+1))
        .filter(d => d.getDay() !== 0 && d.getDay() !== 6) // exclude weekends
        .map(d => d.setHours(0,0,0,0));
      const presentCount = workingDays.filter(ts => presentDays.has(ts)).length;
      const absentCount = workingDays.length - presentCount;
      daysPresent.textContent = presentCount;
      daysAbsent.textContent = absentCount;
    } catch (_) {}
  }

  async function checkIn() {
    setLoading(true);
    try {
      const res = await fetch(`${API_ATT}/checkin`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ location: 'dashboard' }) });
      await res.json();
      await refreshToday();
      await refreshMonthCounts();
    } catch (_) {} finally { setLoading(false); }
  }

  async function checkOut() {
    setLoading(true);
    try {
      const res = await fetch(`${API_ATT}/checkout`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ location: 'dashboard' }) });
      await res.json();
      await refreshToday();
      await refreshMonthCounts();
    } catch (_) {} finally { setLoading(false); }
  }

  if (checkInBtn) checkInBtn.addEventListener('click', checkIn);
  if (checkOutBtn) checkOutBtn.addEventListener('click', checkOut);

  refreshToday();
  refreshMonthCounts();
});

