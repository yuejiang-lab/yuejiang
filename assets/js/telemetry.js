/* ============================================================
 * telemetry.js —— 匿名使用行为统计
 * 采集范围（可在 config.js 的 collect 中逐项关闭）：
 *   页面浏览 / 选题热度 / 各步骤到达 / 导出行为 / 取证进度
 * 明确不采集：教师填写的任何备课内容（学情、目标、流程、取证结论、反思……）
 * 这些内容只保存在使用者本机浏览器，不会离开本机。
 * 依赖：config.js, cloud.js
 * ============================================================ */
(function () {
  const C = window.YJ_CONFIG || {};
  const K_ID = 'yuejiang_anon_v1';
  const K_SID = 'yuejiang_sess_v1';
  const K_Q = 'yuejiang_events_v1';
  const K_C = 'yuejiang_consent_v1';
  const MAX_Q = 300;

  function rid(p) {
    return p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  let anonId = null;
  try {
    anonId = localStorage.getItem(K_ID);
    if (!anonId) { anonId = rid('a-'); localStorage.setItem(K_ID, anonId); }
  } catch (e) { anonId = 'a-offline'; }

  let sid = null;
  try {
    sid = sessionStorage.getItem(K_SID);
    if (!sid) { sid = rid('s-'); sessionStorage.setItem(K_SID, sid); }
  } catch (e) { sid = 's-offline'; }

  function consent() { try { return localStorage.getItem(K_C) || ''; } catch (e) { return ''; } }
  function setConsent(v) {
    try { localStorage.setItem(K_C, v); } catch (e) { }
    if (v === 'granted') flush();
    if (v === 'denied') { try { localStorage.removeItem(K_Q); } catch (e) { } }
  }

  function queue() { try { return JSON.parse(localStorage.getItem(K_Q) || '[]'); } catch (e) { return []; } }
  function saveQueue(a) { try { localStorage.setItem(K_Q, JSON.stringify(a.slice(-MAX_Q))); } catch (e) { } }
  function clearQueue() { try { localStorage.removeItem(K_Q); } catch (e) { } }

  /* 同一秒内重复触发的同类事件做节流，避免刷数据 */
  const THROTTLE_MS = { step_view: 30000, evidence: 60000, step_edit: 60000 };
  const lastAt = {};

  /* 允许上报的字段白名单：只放元数据，绝不放教师填写的文本 */
  const FIELDS = ['proj', 'lib', 'step', 'kind', 'from', 'grade', 'k', 'n', 'ok'];

  function allowed(type) {
    const c = C.collect || {};
    if (type === 'pv') return c.pageView !== false;
    if (type === 'theme_select') return c.themeSelect !== false;
    if (type === 'step_view') return c.stepView !== false;
    if (type === 'export') return c.exportEvent !== false;
    if (type === 'evidence') return c.evidence !== false;
    return true;
  }

  function track(type, data) {
    try {
      const cst = consent();
      if (cst === 'denied') return;
      if (!allowed(type)) return;

      const now = Date.now();
      const key = type + ':' + ((data && (data.step || data.k || data.proj || data.kind)) || '');
      const gap = THROTTLE_MS[type];
      if (gap && lastAt[key] && now - lastAt[key] < gap) return;
      lastAt[key] = now;

      const ev = {
        ts: now,
        type: type,
        v: 2,
        anon: anonId,
        sid: sid,
        page: (location.pathname.split('/').pop() || 'index').slice(0, 40)
      };
      if (data) {
        FIELDS.forEach(function (f) {
          if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
            ev[f] = String(data[f]).slice(0, 60);
          }
        });
      }

      const arr = queue();
      arr.push(ev);
      saveQueue(arr);

      if (cst === 'granted' && arr.length >= (C.batchSize || 10)) flush();
      if (C.debug) console.info('[track]', type, ev);
    } catch (e) { /* 埋点失败绝不影响备课功能 */ }
  }

  let flushing = false;
  async function flush() {
    if (flushing) return false;
    if (consent() !== 'granted') return false;
    const arr = queue();
    if (!arr.length) return false;
    flushing = true;
    let ok = false;
    try {
      ok = await (window.YJCloud ? window.YJCloud.addMany(arr) : false);
      if (ok) clearQueue();
    } catch (e) { if (C.debug) console.warn(e); }
    flushing = false;
    return ok;
  }

  /* 离开页面时补一次上报 */
  window.addEventListener('pagehide', function () { flush(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  window.YJ = {
    track: track,
    flush: flush,
    consent: consent,
    setConsent: setConsent,
    queue: queue,
    clearQueue: clearQueue,
    exportQueue: function () {
      return JSON.stringify({ anon: anonId, events: queue() }, null, 2);
    },
    get anonId() { return anonId; }
  };
})();
