// Render demo charts for admin reports page

document.addEventListener('DOMContentLoaded', function() {
  // Employee Performance Report (Bar)
  new Chart(document.getElementById('performanceChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['John Doe', 'Jane Smith', 'Michael Brown', 'Emily Johnson', 'David Lee'],
      datasets: [{
        label: 'Performance Score',
        data: [88, 92, 75, 95, 80],
        backgroundColor: '#4e73df',
        borderRadius: 8
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });

  // Attendance Report (Line)
  new Chart(document.getElementById('attendanceReportChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Attendance %',
        data: [95, 90, 92, 88],
        fill: true,
        backgroundColor: 'rgba(78,115,223,0.08)',
        borderColor: '#4e73df',
        tension: 0.4,
        pointBackgroundColor: '#4e73df',
        pointRadius: 5
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });

  // Leave Analysis (Doughnut)
  new Chart(document.getElementById('leaveAnalysisChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Sick Leave', 'Casual Leave', 'Earned Leave'],
      datasets: [{
        data: [8, 5, 3],
        backgroundColor: ['#36b37e', '#f6c23e', '#e74a3b'],
        borderWidth: 2
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      cutout: '70%'
    }
  });

  // Task Completion Rate (Horizontal Bar)
  new Chart(document.getElementById('taskCompletionChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Completed', 'In Progress', 'Pending'],
      datasets: [{
        label: 'Tasks',
        data: [32, 12, 6],
        backgroundColor: ['#36b37e', '#4e73df', '#f6c23e'],
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
});
