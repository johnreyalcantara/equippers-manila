(function () {
  if (!API.requireAuth()) return;

  const form = document.getElementById('donationForm');
  const alertEl = document.getElementById('donationAlert');
  const historyEl = document.getElementById('donationHistory');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.amount = parseFloat(data.amount);
    try {
      const res = await API.post('/donations', data);
      alertEl.innerHTML = '<div class="alert alert-success">' + res.message + '</div>';
      form.reset();
      loadHistory();
    } catch (err) {
      alertEl.innerHTML = '<div class="alert alert-error">' + err.message + '</div>';
    }
  });

  async function loadHistory() {
    try {
      const rows = await API.get('/donations/mine');
      if (rows.length === 0) {
        historyEl.innerHTML = '<p style="color:var(--gray-400)">No donations yet.</p>';
        return;
      }
      historyEl.innerHTML = rows.map(d => `
        <div style="padding:0.75rem 0; border-bottom:1px solid var(--gray-200);">
          <strong style="color:var(--navy);">PHP ${parseFloat(d.amount).toLocaleString()}</strong>
          <span style="color:var(--gray-400); font-size:0.8rem; margin-left:0.5rem;">Ref: ${d.reference_number}</span>
          <br><span style="font-size:0.8rem; color:var(--gray-600);">${new Date(d.donated_at).toLocaleDateString()}</span>
          ${d.message ? '<br><span style="font-size:0.85rem; color:var(--gray-600); font-style:italic;">' + d.message + '</span>' : ''}
        </div>`).join('');
    } catch (e) { console.error(e); }
  }

  loadHistory();
})();
