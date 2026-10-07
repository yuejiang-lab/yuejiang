/* ============================================================
 * landing.js —— 首页行为
 * ① 页面浏览埋点　② 拉取匿名聚合统计（未开通云端时自动隐藏统计卡）
 * 依赖：config.js, cloud.js, telemetry.js
 * ============================================================ */
(function () {
  if (!window.YJ) return;
  window.YJ.track('pv', { page: 'home' });

  const box = document.getElementById('hotBox');
  const nums = document.getElementById('statNums');
  const hot = document.getElementById('hotRow');
  const note = document.getElementById('statNote');

  /* 项目库数量：直接读数据层，避免文案与数据不一致
     注意：P 由 data.js 用 const 声明，不挂在 window 上，只能直接取值 */
  var LIB = null;
  try { if (typeof P !== 'undefined') LIB = P; } catch (e) { }
  try {
    var cnt = document.getElementById('cntLib');
    if (cnt && LIB) cnt.textContent = String(LIB.length);
  } catch (e) { }

  /* 用项目库把主题编号翻译成中文名（仅用于展示，不产生任何上报） */
  function nameOf(id) {
    try {
      if (LIB) {
        const hit = LIB.find(function (x) { return x.id === id; });
        if (hit) return hit.n;
      }
    } catch (e) { }
    return id;
  }

  function fail(msg) {
    if (box) box.style.display = 'none';
    if (note) note.textContent = msg || '';
  }

  if (!window.YJCloud || !window.YJCloud.enabled()) {
    fail('统计功能尚未开通：在 assets/js/config.js 中填入 CloudBase 环境 ID 后即可显示。');
    return;
  }

  window.YJCloud.stats({}).then(function (r) {
    if (!r || !r.ok) { fail('暂无统计数据。'); return; }

    if (nums && r.summary) {
      const items = [
        ['参与教师（匿名）', r.summary.teachers || 0],
        ['备课次数', r.summary.sessions || 0],
        ['生成教案 / 课件', r.summary.exports || 0],
        ['覆盖非遗主题', r.summary.themes || 0]
      ];
      nums.innerHTML = items.map(function (x) {
        return '<div><div class="n">' + x[1] + '</div><div class="l">' + x[0] + '</div></div>';
      }).join('');
    }

    if (hot && r.top && r.top.length) {
      hot.innerHTML = r.top.map(function (x) {
        return '<span class="hotChip">' + nameOf(x.proj) + '<i>' + x.count + ' 次</i></span>';
      }).join('');
    }
    if (note) note.textContent = '以上为匿名行为统计，不含任何备课内容。更新时间：' + (r.updatedAt || '—');
  }).catch(function () { fail('统计数据读取失败，请稍后再试。'); });
})();
