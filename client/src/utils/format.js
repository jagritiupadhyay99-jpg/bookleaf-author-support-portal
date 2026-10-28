// Format currency in INR
export function formatCurrency(value) {
  if (value === null || value === undefined) return 'Not available';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

// Format date safely
export function formatDate(value) {
  if (!value) return 'Not available';
  try {
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'Not available';
  }
}

// Format number safely
export function formatNumber(value) {
  if (value === null || value === undefined) return 'Not available';
  return Number(value).toLocaleString('en-IN');
}

// Priority badge class
export function priorityClass(priority) {
  const map = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' };
  return `badge badge-${map[priority] || 'low'}`;
}

// Status badge class
export function statusClass(status) {
  const map = { Open: 'open', 'In Progress': 'inprogress', Resolved: 'resolved', Closed: 'closed' };
  return `badge badge-${map[status] || 'open'}`;
}

// Relative time
export function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Ticket number display
export function ticketNum(num) {
  return num || '-';
}

// Get initials from name
export function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
