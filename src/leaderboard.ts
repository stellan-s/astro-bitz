// Leaderboard functionality for landing page
const SUPABASE_URL = import.meta.env.VITE_LEADERBOARD_URL;
const SUPABASE_KEY = import.meta.env.VITE_LEADERBOARD_ANON_KEY;
const TABLE_NAME = 'leaderboard';

let currentTab = 'all-time';

async function fetchLeaderboard(type = 'all-time', limit = 10) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=score.desc&limit=${limit}`;

    if (type === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      url += `&created_at=gte.${todayISO}`;
    } else if (type === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();
      url += `&created_at=gte.${weekAgoISO}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return null;
  }
}

function getRankMedal(rank: number): string {
  return `#${rank}`;
}

function displayLeaderboard(entries: any[]) {
  const content = document.getElementById('leaderboard-content');
  if (!content) return;

  if (!entries || entries.length === 0) {
    content.innerHTML = '<div class="leaderboard-error">No scores yet. Be the first to play!</div>';
    return;
  }

  const table = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Score</th>
          <th>Wave</th>
          <th>Rank</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((entry, index) => {
          const rank = index + 1;
          const rankClass = rank <= 3 ? `rank-${rank}` : '';
          return `
            <tr class="${rankClass}">
              <td><span class="rank-medal">${getRankMedal(rank)}</span></td>
              <td>${entry.player_name}</td>
              <td>${entry.score.toLocaleString()}</td>
              <td>${entry.wave}</td>
              <td>${entry.rank}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  content.innerHTML = table;
}

async function loadLeaderboard(type: string) {
  const content = document.getElementById('leaderboard-content');
  if (!content) return;

  content.innerHTML = '<div class="leaderboard-loading">Loading leaderboard...</div>';

  const entries = await fetchLeaderboard(type);
  displayLeaderboard(entries);
}

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.leaderboard-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Load leaderboard for selected tab
      const tabType = tab.getAttribute('data-tab');
      if (tabType) {
        currentTab = tabType;
        loadLeaderboard(tabType);
      }
    });
  });

  // Load initial leaderboard
  loadLeaderboard('all-time');

  // Refresh leaderboard every 30 seconds
  setInterval(() => {
    loadLeaderboard(currentTab);
  }, 30000);
});
