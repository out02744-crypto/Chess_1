function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export async function Tasks({ api, navigate }) {
  const allTasks = await api('/api/tasks'); // used only to populate the theme filter list
  let elo = '', theme = '';
  const initial = allTasks;

  async function load() {
    const q = new URLSearchParams();
    if (theme) q.set('theme', theme);
    if (elo) q.set('elo', elo);
    const qs = q.toString();
    return api('/api/tasks' + (qs ? '?' + qs : ''));
  }

  function cardHtml(list) {
    return list.map(t => `<article class="card">
      <span class="badge">${t.elo} ELO</span>
      <h3>${escapeHtml(t.title)}</h3>
      <p class="sub">${escapeHtml(t.theme)}</p>
      <button class="btn secondary" data-id="${t.id}">Решить →</button>
    </article>`).join('');
  }

  return {
    mount(root) {
      root.innerHTML = `<section class="fade">
        <div class="view-head">
          <div>
            <h1 class="title">Тактическая тренировка</h1>
            <div class="sub">Подбираем задачи вокруг вашего Puzzle Rating.</div>
          </div>
          <button class="btn" data-task="random">Начать тренировку</button>
        </div>
        <div class="filters">
          <select class="select" id="elo">
            <option value="">Все уровни</option>
            <option>400</option><option>800</option><option>1200</option><option>1600</option><option>2200</option>
          </select>
          <select class="select" id="theme">
            <option value="">Все темы</option>
            ${[...new Set(allTasks.map(x => x.theme))].map(x => `<option>${escapeHtml(x)}</option>`).join('')}
          </select>
        </div>
        <div class="grid" id="taskGrid">${cardHtml(initial)}</div>
      </section>`;

      function wireCards() {
        root.querySelectorAll('[data-id]').forEach(b => b.onclick = () => navigate('/tasks/' + b.dataset.id));
      }
      wireCards();

      async function refresh() {
        const list = await load();
        root.querySelector('#taskGrid').innerHTML = cardHtml(list);
        wireCards();
      }

      root.querySelector('#elo').onchange = e => { elo = e.target.value; refresh(); };
      root.querySelector('#theme').onchange = e => { theme = e.target.value; refresh(); };
      root.querySelector('[data-task]').onclick = async () => {
        const list = await load();
        if (list.length) navigate('/tasks/' + list[Math.floor(Math.random() * list.length)].id);
      };
    },
    unmount() {}
  };
}
