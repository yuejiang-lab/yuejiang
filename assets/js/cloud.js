/* ============================================================
 * cloud.js —— CloudBase 云端同步层
 * 依赖：config.js（window.YJ_CONFIG）
 * 未启用或未配置 envId 时，所有方法安全返回 false，页面功能不受影响。
 * ============================================================ */
(function () {
  const C = window.YJ_CONFIG || {};
  let app = null, auth = null, db = null;
  let ready = false, failed = false, initPromise = null;

  function enabled() {
    return !!(C.cloudEnabled && C.envId) && !failed;
  }

  function loadSDK() {
    return new Promise(function (res, rej) {
      if (typeof window.cloudbase !== 'undefined') return res();
      const s = document.createElement('script');
      s.src = 'https://static.cloudbase.net/cloudbase-js-sdk/2.7.1/cloudbase.full.js';
      s.onload = res;
      s.onerror = function () { rej(new Error('cloudbase sdk load failed')); };
      document.head.appendChild(s);
    });
  }

  function init() {
    if (!enabled()) return Promise.resolve(false);
    if (ready) return Promise.resolve(true);
    if (initPromise) return initPromise;
    initPromise = (async function () {
      try {
        await loadSDK();
        app = window.cloudbase.init({ env: C.envId, region: C.region });
        auth = app.auth({ persistence: 'local' });
        const st = await auth.getLoginState();
        if (!st) await auth.signInAnonymously();   // 匿名登录，不采集任何身份信息
        db = app.database();
        ready = true;
        if (C.debug) console.info('[cloud] ready');
        return true;
      } catch (e) {
        failed = true;
        if (C.debug) console.warn('[cloud] init failed:', e && e.message);
        return false;
      }
    })();
    return initPromise;
  }

  /* 写入单条事件 */
  async function add(doc) {
    if (!(await init())) return false;
    try {
      await db.collection(C.collection).add(doc);
      return true;
    } catch (e) {
      if (C.debug) console.warn('[cloud] add failed:', e && e.message);
      return false;
    }
  }

  /* 批量写入（客户端 SDK 无批量接口，逐条并发写入，事件量小） */
  async function addMany(docs) {
    if (!(await init()) || !docs.length) return false;
    let okCount = 0;
    const rs = await Promise.all(docs.map(function (d) {
      return db.collection(C.collection).add(d).then(function () { return true; }).catch(function () { return false; });
    }));
    rs.forEach(function (r) { if (r) okCount++; });
    if (C.debug) console.info('[cloud] flush', okCount + '/' + docs.length);
    return okCount > 0;
  }

  /* 调用统计云函数（首页热门主题等聚合数据） */
  async function stats(payload) {
    if (!(await init())) return null;
    try {
      const r = await app.callFunction({ name: C.statsFunction, data: payload || {} });
      return (r && r.result) || null;
    } catch (e) {
      if (C.debug) console.warn('[cloud] stats failed:', e && e.message);
      return null;
    }
  }

  window.YJCloud = {
    enabled: enabled,
    init: init,
    add: add,
    addMany: addMany,
    stats: stats,
    get ready() { return ready; }
  };
})();
