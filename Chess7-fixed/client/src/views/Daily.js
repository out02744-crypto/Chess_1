function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

export async function Daily({ api, navigate, store }) {
  const t = await api('/api/daily');
  const loggedIn = !!store.getState().user;
  const history = t.history || [];
  const streak = store.getState().user?.streak ?? 0;

  return {
    mount(root) {
      root.innerHTML = `<section class="fade">
        <div class="view-head">
          <div>
            <h1 class="title">Задание дня</h1>
            <p class="sub">Одна позиция для всех. Решите сегодня и сохраните стрик.</p>
          </div>
          <span class="badge">🔥 ${streak} дней</span>
        </div>
        <div class="card">
          <h2>${escapeHtml(t.title)}</h2>
          <p>${escapeHtml(t.theme)} · ${t.elo} ELO</p>
          ${t.solvedToday
            ? `<p class="sub">✓ Уже решено сегодня</p>`
            : `<button class="btn" data-go>Решить задание дня</button>`}
        </div>
        ${loggedIn ? `<h2>История</h2><div class="grid">${history.map(h => `<div class="card"><b>${escapeHtml(fmtDate(h.date))}</b><p class="sub">${h.solved ? 'Решено' : 'Пропущено'}</p></div>`).join('')}</div>` : `<p class="sub">Войдите, чтобы отслеживать историю и стрик.</p>`}
      </section>`;
      root.querySelector('[data-go]')?.addEventListener('click', () => navigate('/tasks/' + t.id + '?daily=1'));
    },
    unmount() {}
  };
}
