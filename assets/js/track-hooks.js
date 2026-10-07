/* ============================================================
 * track-hooks.js —— 工作台埋点挂钩
 * 不改动 data/core/steps/app 任何一行源码，只在运行时做行为包装。
 * 依赖：telemetry.js（window.YJ）、app.js（须先加载）
 * ============================================================ */
(function () {
  if (!window.YJ) return;
  const T = window.YJ.track;

  /* S 由 core.js 用 let 声明，不挂在 window 上，只能直接取值 */
  function curProj() {
    try { return (typeof S !== 'undefined' && S && S.proj) ? S.proj : ''; } catch (e) { return ''; }
  }
  function curLib() {
    try { return (typeof S !== 'undefined' && S && S.lib) ? S.lib : ''; } catch (e) { return ''; }
  }

  /* ① 导出行为：包装导出函数 */
  ['expDoc', 'expPPT', 'expPPTHTML', 'expMD', 'expTask', 'expJSON'].forEach(function (fn) {
    const orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function () {
      try { T('export', { kind: fn, proj: curProj() }); } catch (e) { }
      return orig.apply(this, arguments);
    };
  });

  /* ② 取证回填：包装 markEv */
  const _markEv = window.markEv;
  if (typeof _markEv === 'function') {
    window.markEv = function (k) {
      try { T('evidence', { k: k, proj: curProj() }); } catch (e) { }
      return _markEv.apply(this, arguments);
    };
  }

  /* ③ 选题：事件委托（项目卡 + 附录项目库表格行） */
  document.addEventListener('click', function (e) {
    try {
      const card = e.target.closest && e.target.closest('.pcard');
      if (card && card.dataset && card.dataset.p) {
        T('theme_select', { proj: card.dataset.p, from: 'step1', lib: curLib() });
        return;
      }
      const row = e.target.closest && e.target.closest('#lib tr[data-go]');
      if (row) {
        T('theme_select', { proj: row.dataset.go, from: 'appendix' });
      }
    } catch (err) { }
  }, true);

  /* ④ 步骤到达：用 IntersectionObserver 观察各 section */
  const seen = {};
  let io = null;
  function observeSections() {
    try {
      if (!('IntersectionObserver' in window)) return;
      if (!io) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            const id = en.target.id || '';
            if (!id || seen[id]) return;
            seen[id] = true;
            T('step_view', { step: id, proj: curProj() });
          });
        }, { threshold: 0.35 });
      }
      document.querySelectorAll('#app section[id], main section[id]').forEach(function (s) {
        io.observe(s);
      });
    } catch (e) { }
  }

  /* render() 会重建 DOM，每次渲染后重新观察 */
  const _render = window.render;
  if (typeof _render === 'function') {
    window.render = function () {
      const r = _render.apply(this, arguments);
      observeSections();
      return r;
    };
  }
  observeSections();

  /* ⑤ 进入工作台 */
  T('pv', { page: 'app', proj: curProj() });
})();
