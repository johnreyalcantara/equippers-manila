/**
 * Shared Admin Table — date filter + data loading for all admin list pages.
 *
 * Usage: call initAdminTable({ endpoint, columns, containerId })
 * where columns is an array of { key, label, render? } objects.
 */

function initAdminTable(config) {
  if (!API.requireAuth() || !API.requireAdmin()) return;

  const container = document.getElementById(config.containerId);
  let currentFilter = '';

  // Build filter bar
  const filterBar = document.getElementById('filterBar');
  if (filterBar) {
    const filters = ['today', 'week', 'month', 'year', 'custom'];
    filterBar.innerHTML = `
      <button class="btn btn-outline" onclick="applyFilter('')">All</button>
      ${filters.map(f => `<button class="btn btn-outline" onclick="applyFilter('${f}')">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('')}
      <input type="date" id="filterFrom" style="display:none;">
      <input type="date" id="filterTo" style="display:none;">
      <button class="btn btn-primary btn-sm" id="applyCustom" style="display:none;" onclick="applyCustomFilter()">Apply</button>
    `;
  }

  window.applyFilter = function (f) {
    currentFilter = f;
    // Toggle custom date inputs
    const show = f === 'custom';
    document.getElementById('filterFrom').style.display = show ? '' : 'none';
    document.getElementById('filterTo').style.display = show ? '' : 'none';
    document.getElementById('applyCustom').style.display = show ? '' : 'none';

    // Highlight active
    filterBar.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (f !== 'custom') loadData();
  };

  window.applyCustomFilter = function () {
    loadData();
  };

  async function loadData() {
    try {
      let url = config.endpoint + '?filter=' + currentFilter;
      if (currentFilter === 'custom') {
        url += '&from=' + document.getElementById('filterFrom').value;
        url += '&to=' + document.getElementById('filterTo').value;
      }
      const rows = await API.get(url);

      if (rows.length === 0) {
        container.innerHTML = '<p style="color:var(--gray-400); padding:1rem;">No records found.</p>';
        return;
      }

      let html = '<table class="data-table"><thead><tr>';
      config.columns.forEach(c => { html += '<th>' + c.label + '</th>'; });
      html += '</tr></thead><tbody>';

      rows.forEach(row => {
        html += '<tr>';
        config.columns.forEach(c => {
          const val = c.render ? c.render(row) : (row[c.key] || '—');
          html += '<td>' + val + '</td>';
        });
        html += '</tr>';
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (e) {
      console.error(e);
      container.innerHTML = '<p style="color:var(--danger);">Failed to load data.</p>';
    }
  }

  loadData();
}
