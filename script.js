/* ============================================
   APEX MOTORS — Command Center
   script.js
   ============================================ */

/* ── Live Clock ──────────────────────────── */
function updateClock() {
  const now = new Date();

  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateStr = '— ' + now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  document.getElementById('curr-time').textContent = timeStr;
  document.getElementById('curr-date').textContent = dateStr;
}

updateClock();
setInterval(updateClock, 1000);

/* ── Progress Bars ───────────────────────── */
const progressTargets = [
  { id: 'prog1', target: 84 },  // ₹4.2Cr / ₹5Cr
  { id: 'prog2', target: 76 },  // 38 / 50 units
  { id: 'prog3', target: 84 },  // 67 / 80 test drives
];

function animateProgressBars() {
  progressTargets.forEach(({ id, target }) => {
    const el = document.getElementById(id);
    if (el) el.style.width = target + '%';
  });
}

// Trigger after a brief delay so CSS transition plays on load
setTimeout(animateProgressBars, 600);

/* ── Sidebar Nav ─────────────────────────── */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

/* ── Chart Tabs ──────────────────────────── */

// Chart data for each period
const chartData = {
  '7D': {
    current:  [110, 88, 100, 60, 75, 45, 62, 30],
    previous: [120, 105, 115, 90, 100, 80, 95, 75],
    labels:   ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    peakIndex: 3,
    xPositions: [0, 83, 166, 249, 332, 415, 498, 580]
  },
  '1M': {
    current:  [130, 100, 85, 70, 90, 50, 40, 55],
    previous: [145, 120, 100, 95, 110, 80, 70, 85],
    labels:   ['W1', 'W2', 'W3', 'W4'],
    peakIndex: 0,
    xPositions: [0, 83, 166, 249, 332, 415, 498, 580]
  },
  'YTD': {
    current:  [150, 120, 100, 90, 70, 60, 45, 30],
    previous: [160, 140, 125, 110, 100, 90, 75, 60],
    labels:   ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'],
    peakIndex: 0,
    xPositions: [0, 83, 166, 249, 332, 415, 498, 580]
  }
};

function buildPath(xPositions, yValues) {
  return xPositions.map((x, i) => (i === 0 ? `M${x},${yValues[i]}` : `L${x},${yValues[i]}`)).join(' ');
}

function buildAreaPath(xPositions, yValues, bottomY = 170) {
  const line = buildPath(xPositions, yValues);
  return `${line} L${xPositions[xPositions.length - 1]},${bottomY} L${xPositions[0]},${bottomY} Z`;
}

function updateChart(period) {
  const data = chartData[period];
  const svg  = document.querySelector('.chart-svg');
  if (!svg) return;

  const { current, previous, labels, peakIndex, xPositions } = data;

  // Update previous period paths
  const prevArea = svg.querySelectorAll('path')[0];
  const prevLine = svg.querySelectorAll('path')[1];
  if (prevArea) prevArea.setAttribute('d', buildAreaPath(xPositions, previous));
  if (prevLine) prevLine.setAttribute('d', buildPath(xPositions, previous));

  // Update current period paths
  const currArea = svg.querySelectorAll('path')[2];
  const currLine = svg.querySelectorAll('path')[3];
  if (currArea) currArea.setAttribute('d', buildAreaPath(xPositions, current));
  if (currLine) currLine.setAttribute('d', buildPath(xPositions, current));

  // Update circles
  const circles = svg.querySelectorAll('circle');
  circles.forEach((c, i) => {
    if (i < xPositions.length) {
      c.setAttribute('cx', xPositions[i]);
      c.setAttribute('cy', current[i]);
      c.setAttribute('r', i === xPositions.length - 1 ? 4 : 3.5);
    }
  });

  // Update peak drop line
  const dropLine = svg.querySelectorAll('line')[5]; // after 4 grid lines + separator
  if (dropLine) {
    dropLine.setAttribute('x1', xPositions[peakIndex]);
    dropLine.setAttribute('x2', xPositions[peakIndex]);
  }

  // Update axis labels
  const texts = svg.querySelectorAll('text');
  texts.forEach((t, i) => {
    if (labels[i]) {
      t.textContent = labels[i];
      t.setAttribute('fill', i === peakIndex ? '#c9a84c' : '#44444f');
    }
  });
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const container = tab.closest('.tabs');
    container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    updateChart(tab.textContent.trim());
  });
});

/* ── Activity Feed — Auto-refresh ────────── */
const activityTemplates = [
  { color: 'var(--green)',  title: 'Sale confirmed — Kia Seltos HTX+',        sub: 'Customer: Amit Sharma · ₹18.4L finance',        time: 'Just now' },
  { color: 'var(--blue)',   title: 'Test drive started — Tata Nexon EV',      sub: 'Salesperson: Ravi Dubey · Bay 3',                time: 'Just now' },
  { color: 'var(--gold)',   title: 'New lead — Maruti Baleno Alpha Turbo',     sub: 'Source: Walk-in · Anita Joshi',                  time: 'Just now' },
  { color: 'var(--red)',    title: 'Stock alert — BMW 3 Series down to 1 unit',sub: 'Notify procurement team',                       time: 'Just now' },
  { color: 'var(--green)',  title: 'Sale confirmed — Mahindra XEV 9e Pack Three', sub: 'Customer: Deepak Singh · ₹35.9L cash',      time: 'Just now' },
];

let activityIndex = 0;

function injectActivityItem() {
  const list = document.querySelector('.activity-list');
  if (!list) return;

  const entry  = activityTemplates[activityIndex % activityTemplates.length];
  activityIndex++;

  const item = document.createElement('div');
  item.className = 'activity-item';
  item.style.opacity = '0';
  item.style.transition = 'opacity 0.4s';
  item.innerHTML = `
    <div class="activity-dot" style="background: ${entry.color}"></div>
    <div class="activity-text">
      <div class="activity-title">${entry.title}</div>
      <div class="activity-sub">${entry.sub}</div>
    </div>
    <div class="activity-time">${entry.time}</div>
  `;

  // Prepend and fade in
  list.insertBefore(item, list.firstChild);
  requestAnimationFrame(() => { item.style.opacity = '1'; });

  // Remove last item to keep list tidy
  const items = list.querySelectorAll('.activity-item');
  if (items.length > 7) {
    const last = items[items.length - 1];
    last.style.transition = 'opacity 0.3s';
    last.style.opacity = '0';
    setTimeout(() => last.remove(), 300);
  }
}

// New activity every 12 seconds
setInterval(injectActivityItem, 12000);

/* ── KPI Card — click to highlight ──────── */
document.querySelectorAll('.kpi-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.kpi-card').forEach(c => c.style.borderColor = '');
    card.style.borderColor = 'var(--gold)';
  });
});
