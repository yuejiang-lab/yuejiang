/* ============================================================
 * consent.js —— 匿名统计知情同意浮条
 * 未做出选择前，事件只缓存在本机，不上报；同意后才批量上报。
 * 依赖：telemetry.js（window.YJ）
 * ============================================================ */
(function () {
  if (!window.YJ) return;

  function mount() {
    if (document.getElementById('yjConsent')) return;
    document.body.classList.add('hasConsent');
    const bar = document.createElement('div');
    bar.className = 'consentBar';
    bar.id = 'yjConsent';
    bar.innerHTML =
      '<div class="cbInner">'
      + '<div class="cbTxt"><b>关于数据统计</b>：本平台只收集' 
      + '<b>匿名使用统计</b>（主题热度、步骤完成情况、导出次数），用于改进平台；'
      + '<b>不会上传您的备课内容</b>，备课内容只保存在您本机浏览器。</div>'
      + '<div class="cbBtns">'
      + '<button class="cbBtn cbOk" type="button">同意并继续</button>'
      + '<button class="cbBtn cbNo" type="button">仅本地使用</button>'
      + '<a class="cbLink" href="privacy.html" target="_blank">了解详情</a>'
      + '</div></div>';
    document.body.appendChild(bar);

    bar.querySelector('.cbOk').addEventListener('click', function () {
      window.YJ.setConsent('granted'); bar.remove();
    });
    bar.querySelector('.cbNo').addEventListener('click', function () {
      window.YJ.setConsent('denied'); bar.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!window.YJ.consent()) mount();
    });
  } else {
    if (!window.YJ.consent()) mount();
  }
})();
