// Demo data for messages 
const demoMessages = {
  inbox: [
    {
      id: 1,
      sender: 'Sita Sharma',
      subject: 'Leave Application Update',
      date: '2025-07-08 09:15',
      content: 'Your leave application for July 10-12 has been approved. Please update your status in the portal.',
      unread: true
    },
    {
      id: 2,
      sender: 'Ramesh Adhikari',
      subject: 'Monthly Report Submission',
      date: '2025-07-07 16:40',
      content: 'Please submit your monthly report by July 10. Let me know if you need any help.',
      unread: false
    },
    {
      id: 3,
      sender: 'Anita Gautam',
      subject: 'Team Meeting Reminder',
      date: '2025-07-06 11:00',
      content: 'Reminder: Team meeting scheduled for July 9 at 10:00 AM in Conference Room B.',
      unread: true
    },
    {
      id: 4,
      sender: 'Bikash Thapa',
      subject: 'System Maintenance',
      date: '2025-07-05 14:20',
      content: 'There will be a scheduled system maintenance on July 12 from 8:00 PM to 10:00 PM.',
      unread: false
    }
  ],
  sent: [
    {
      id: 5,
      sender: 'You',
      subject: 'Payroll Processed',
      date: '2025-07-07 10:30',
      content: 'Payroll for July has been processed. Please check your bank account for the deposit.',
      unread: false
    },
    {
      id: 6,
      sender: 'You',
      subject: 'Document Submission Reminder',
      date: '2025-07-06 15:00',
      content: 'Reminder to submit your pending documents by July 15.',
      unread: false
    },
    {
      id: 7,
      sender: 'You',
      subject: 'Welcome to the Team',
      date: '2025-07-05 09:00',
      content: 'Welcome to the company! Please reach out if you have any questions.',
      unread: false
    }
  ],
  broadcast: [
    {
      id: 8,
      sender: 'Admin',
      subject: 'Office Closed on July 20',
      date: '2025-07-04 12:00',
      content: 'The office will be closed on July 20 for a public holiday. Enjoy your day off!',
      unread: false
    },
    {
      id: 9,
      sender: 'Admin',
      subject: 'COVID-19 Safety Guidelines',
      date: '2025-07-03 17:30',
      content: 'Please follow the updated COVID-19 safety guidelines attached in the portal.',
      unread: false
    },
    {
      id: 10,
      sender: 'Admin',
      subject: 'Annual Event Announcement',
      date: '2025-07-02 10:00',
      content: 'We are excited to announce our annual event on August 15. More details coming soon!',
      unread: false
    }
  ]
};


let currentTab = 'inbox';
let selectedMessageId = null;

function renderMessagesList(tab) {
  const list = document.getElementById('messagesList');
  list.innerHTML = '';
  demoMessages[tab].forEach(msg => {
    const item = document.createElement('div');
    item.className = 'message-item' + (msg.unread ? ' unread' : '') + (msg.id === selectedMessageId ? ' selected' : '');
    item.innerHTML = `
      <span class="message-sender">${msg.sender}</span>
      <span class="message-subject">${msg.subject}</span>
      <span class="message-date">${msg.date}</span>
    `;
    item.onclick = () => {
      selectedMessageId = msg.id;
      renderMessagesList(currentTab);
      renderMessageView(msg);
      msg.unread = false;
    };
    list.appendChild(item);
  });
  if (demoMessages[tab].length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No messages.';
    list.appendChild(empty);
  }
}

function renderMessageView(msg) {
  const view = document.getElementById('messageView');
  if (!msg) {
    view.innerHTML = '<p class="no-message">Select a message to view</p>';
    return;
  }
  view.innerHTML = `
    <div><strong>From:</strong> ${msg.sender}</div>
    <div><strong>Subject:</strong> ${msg.subject}</div>
    <div><strong>Date:</strong> ${msg.date}</div>
    <hr/>
    <div>${msg.content}</div>
  `;
}

function setupTabs() {
  document.querySelectorAll('.message-tab').forEach(tabBtn => {
    tabBtn.onclick = () => {
      document.querySelectorAll('.message-tab').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      currentTab = tabBtn.getAttribute('data-tab');
      selectedMessageId = null;
      renderMessagesList(currentTab);
      renderMessageView();
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  renderMessagesList(currentTab);
  renderMessageView();
});
