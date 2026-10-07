/* ============================================================
 * config.js —— 站点运行配置
 * 开通腾讯云开发（CloudBase）后，把 cloudEnabled 改为 true 并填入 envId，
 * 网站即具备「多人在线使用 + 匿名行为统计上报」能力。
 * 未开通时自动降级为纯本地模式，全部功能照常可用。
 * ============================================================ */
window.YJ_CONFIG = {
  /* ---- CloudBase 云开发环境 ---- */
  cloudEnabled: false,        // 开通后改为 true
  envId: '',                  // 云开发环境 ID，形如：yuejiang-1g8xxxxxx
  region: 'ap-guangzhou',     // 环境地域

  /* ---- 数据库与云函数 ---- */
  collection: 'usage_events', // 匿名行为事件集合
  statsFunction: 'getStats',  // 统计聚合云函数名（首页热门主题）

  /* ---- 采集开关（仅匿名行为，不含备课内容） ---- */
  collect: {
    pageView: true,           // 页面浏览
    themeSelect: true,        // 选题热度
    stepView: true,           // 各步骤到达情况（用于算流失）
    exportEvent: true,        // 导出次数与类型
    evidence: true            // 取证完成进度
  },

  /* ---- 其它 ---- */
  batchSize: 10,              // 本地队列达到该条数即上报
  debug: false,               // 打开后会在控制台输出上报调试信息

  /* ---- 使用反馈（免费问卷；留空则页面自动隐藏所有反馈入口）----
     填法：在腾讯问卷 / 金山表单等免费工具里做好问卷，把公开链接粘贴到这里。
     例：feedbackUrl: 'https://wj.qq.com/s2/xxxxxxxx'  */
  feedbackUrl: '',
  feedbackText: '💬 使用反馈（约 10 秒）'
};

/* ---- 反馈入口：未配置链接时自动隐藏所有带 data-feedback="1" 的元素 ---- */
function yjFeedbackUrl(){ return (window.YJ_CONFIG && window.YJ_CONFIG.feedbackUrl) || ''; }
function openFeedback(){
  var u = yjFeedbackUrl();
  if (!u) { alert('作者还没有填写反馈问卷地址。'); return; }
  window.open(u, '_blank', 'noopener,noreferrer');
}
document.addEventListener('DOMContentLoaded', function(){
  if (yjFeedbackUrl()) return;
  var els = document.querySelectorAll('[data-feedback="1"]');
  for (var i = 0; i < els.length; i++) els[i].style.display = 'none';
});
