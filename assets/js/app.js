/* ============================================================
 * app.js —— 交互绑定与导出
 * 事件绑定 / 进度刷新 / 工具动作 / Word·PPT·Markdown 导出 / 启动
 * 依赖：data.js, core.js, steps.js（须最后加载）
 * ============================================================ */

/* ============ 六、交互绑定 ============ */
function bind(){
  // 项目卡片
  document.querySelectorAll('.pcard').forEach(c=>c.addEventListener('click',function(){
    const id=this.dataset.p;
    if(S.proj!==id){
      S.proj=id;
      const p=cur();
      if(p){ S.product=p.product; S.situation=p.sit; }
      else { S.product=''; S.situation=''; }
      S.title=''; save(); render();
      document.getElementById('s1').scrollIntoView({behavior:'smooth'});
    }
  }));
  // 项目库表格行
  document.querySelectorAll('#lib tr[data-go]').forEach(r=>r.addEventListener('click',function(){
    S.proj=this.dataset.go; const p=cur(); if(p){S.product=p.product;S.situation=p.sit;} S.title=''; save(); render();
    document.getElementById('s1').scrollIntoView({behavior:'smooth'});
  }));
  // 标签页
  document.querySelectorAll('#tabsA button').forEach(b=>b.addEventListener('click',function(){
    document.querySelectorAll('#tabsA button').forEach(x=>x.classList.remove('on'));
    this.classList.add('on'); const t=this.dataset.t;
    document.querySelectorAll('#lib tr[data-t]').forEach(r=>r.style.display=(t==='all'||r.dataset.t===t)?'':'none');
  }));
  // 普通字段（含路径字段）：输入即保存，失焦后重算
  document.querySelectorAll('[data-k]').forEach(el=>{
    const k=el.dataset.k;
    el.addEventListener('input',function(){
      setP(k,el.value);
      if(String(k).indexOf('goals')===0||String(k).indexOf('obs')===0||String(k).indexOf('flow')===0) markEdited(k);
      refreshProgress(); save();
    });
    el.addEventListener('change',function(){ setP(k,el.value); save(); render(); });
  });
  // 取证字段
  document.querySelectorAll('[data-ev]').forEach(el=>{
    const [k,f]=el.dataset.ev.split('.');
    el.addEventListener('input',function(){
      S.ev[k]=S.ev[k]||{}; S.ev[k][f]=el.value;
      markEv(k); refreshProgress(); save();
    });
    el.addEventListener('change',function(){ S.ev[k]=S.ev[k]||{}; S.ev[k][f]=el.value; save(); render(); });
  });
  // 资料摘抄本
  document.querySelectorAll('[data-nt]').forEach(el=>{
    const ps=el.dataset.nt.split('.'); const i=+ps[0], f=ps[1];
    el.addEventListener('input',function(){ S.notes=S.notes||[]; S.notes[i]=S.notes[i]||{}; S.notes[i][f]=el.value; save(); });
    el.addEventListener('change',function(){ S.notes=S.notes||[]; S.notes[i]=S.notes[i]||{}; S.notes[i][f]=el.value; save(); render(); });
  });
}
function refreshProgress(){
  const need=['situation','product','xueqing','zhongnan','goalAdj','flowAdj','taskAdj','rubAdj','listAdj','reflect'];
  let done=0; need.forEach(k=>{ if(S[k]&&String(S[k]).trim()) done++; });
  if(S.title&&S.title.trim()) done=Math.min(10,done+1);
  const pct=Math.round(done/10*100);
  document.getElementById('pbar').style.width=pct+'%';
  document.getElementById('ptxt').textContent=done+' / 10 环节已填写';
  const en=document.getElementById('evnote');
  if(en) en.textContent='资料取证：'+evDone()+' / '+evTotal()+' 已核实'+(evLeft()?'（缺 '+evLeft()+' 项）':' ✔');
  const dn=document.getElementById('ednote');
  if(dn){
    let cnt=0; if(S.edited&&S.edited.goals) cnt++; if(S.edited&&S.edited.flow) cnt++;
    dn.textContent='个性化：'+(cnt?cnt+' 个板块由您改写':'沿用平台模板');
  }
}
// 取证项回填后即时变色
function markEv(k){
  const box=document.querySelector('.ev[data-evk="'+k+'"]');
  if(!box) return;
  const e=S.ev[k]||{}, done=!!(e.v&&e.v.trim());
  const pill=box.querySelector('.hd .pill');
  if(pill){ pill.className='pill '+(done?'g':(k==='food'||k==='herb'||k==='dye'?'r':'a')); pill.textContent=done?'已核实':'待核实'; }
  let tag=box.querySelector('.hd .pill.g');
  if(done && !tag){ const s=document.createElement('span'); s.className='pill g'; s.textContent='✔ 已回填'; box.querySelector('.hd').appendChild(s); }
  if(!done && tag){ tag.remove(); }
}

/* ============ 七、工具动作 ============ */
/* 统一开窗：quiet=true 时不弹提示（批量打开时用），返回窗口句柄以便判断是否被拦截 */
function openWin(u,quiet){
  const w=window.open(u,'_blank','noopener');
  if(!w && !quiet) alert('浏览器拦截了弹出窗口。请在地址栏右侧允许本站弹出窗口后重试，或在"官方来源清单"中逐个点击链接打开。');
  return w;
}
function openURL(u){ return openWin(u); }
function searchQ(q){ return openWin('https://www.baidu.com/s?wd='+q); }

/* 官方来源清单：改用可逐个点击的链接，避免批量 window.open 被拦截 */
function srcLinksHTML(){
  return '<p class="sub">以下均为官方 / 权威来源。请<strong>逐个点击</strong>打开 —— 浏览器通常只允许"一次点击打开一个窗口"，批量打开会被拦截。</p>'
   +'<table><tr><th style="width:230px">来源</th><th>用途</th><th style="width:110px">操作</th></tr>'
   +SRCLIST.map(function(k){const s=SRC[k];
      return '<tr><td>'+s.n+'</td><td>'+s.d+'</td><td>'
       +(s.u?'<a class="btn ghost sm" style="display:inline-block;text-decoration:none;line-height:1.4" href="'+s.u+'" target="_blank" rel="noopener">打开</a>'
           :'<span class="dim">线下核实</span>')+'</td></tr>';}).join('')
   +'</table>';
}
function openAllSrc(){
  modalHTML('🔎 官方来源清单（逐个点击打开）',
    srcLinksHTML()
   +'<div class="row"><button class="btn sm" onclick="openAllSrcForce()">⧉ 尝试一次性全部打开</button>'
   +'<button class="btn ghost sm" onclick="copySrcLinks()">📋 复制全部链接</button>'
   +'<button class="btn ghost sm" onclick="closeModal()">关闭</button></div>');
}
function openAllSrcForce(){
  let blocked=0;
  SRCLIST.forEach(function(k){ if(SRC[k].u && !openWin(SRC[k].u,true)) blocked++; });
  if(blocked) alert('有 '+blocked+' 个窗口被浏览器拦截。请回到清单逐个点击链接打开。');
}
function copySrcLinks(){
  copyText(SRCLIST.map(function(k){ return SRC[k].n+(SRC[k].u?('　'+SRC[k].u):'　（线下核实）'); }).join('\n'));
}
function copyText(t){
  const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select();
  try{document.execCommand('copy'); alert('已复制到剪贴板');}catch(e){alert('复制失败，请手动选中复制');}
  document.body.removeChild(ta);
}
function modalHTML(title,html){
  document.getElementById('modalBox').innerHTML='<h3>'+title+'</h3>'+html;
  document.getElementById('modal').classList.add('show');
}
function closeModal(){ document.getElementById('modal').classList.remove('show'); }
document.getElementById('modal').addEventListener('click',function(e){ if(e.target===this) closeModal(); });
function lockDoc(){
  if(!S.locked && evLeft()>0){ if(!confirm('取证台仍有 '+evLeft()+' 项未核实，标记为"合规可用"后如被发现事实错误需由本人负责。是否继续？')) return; }
  S.locked=!S.locked; save(); render(); alert(S.locked?'已标记为「合规可用」':'已解除锁定');
}

/* ============ 八、导出 ============ */
/* 导出文档统一排版（Word / WPS 可直接识别的 HTML 样式） */
function docStyle(){
  return '<style>'
   +'@page{size:A4;margin:2.2cm 2cm 2cm;}'
   +'body{font-family:"SimSun","宋体",serif;font-size:12pt;line-height:1.75;color:#1b2733;}'
   +'h1{font-family:"Microsoft YaHei","黑体",sans-serif;font-size:20pt;text-align:center;margin:0 0 8pt;letter-spacing:1px;color:#1b2733;}'
   +'h2{font-family:"Microsoft YaHei","黑体",sans-serif;font-size:14pt;margin:16pt 0 8pt;padding-left:10px;border-left:5px solid #b03a2e;color:#b03a2e;}'
   +'h3{font-family:"Microsoft YaHei",sans-serif;font-size:12.5pt;margin:12pt 0 6pt;color:#1f5f9e;}'
   +'p{margin:6pt 0;text-align:justify;}'
   +'table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10.5pt;}'
   +'td,th{border:1px solid #9aa7b5;padding:6px 8px;vertical-align:top;line-height:1.6;}'
   +'th{background:#eef2f7;font-family:"Microsoft YaHei",sans-serif;text-align:left;}'
   +'ol,ul{margin:6pt 0 6pt 22px;padding:0;}li{margin:3px 0;}'
   +'pre{background:#fbfcfe;border:1px solid #d8e0ea;padding:12px;font-family:"SimSun",serif;font-size:10.5pt;line-height:1.6;white-space:pre-wrap;}'
   +'.foot{text-align:center;color:#888;font-size:9pt;margin-top:14pt;border-top:1px solid #d8e0ea;padding-top:8pt;}'
   +'</style>';
}
function docBody(){
  const p=cur(), n=themeName();
  const prod=productName(), sit=S.situation||(p?p.sit:'');
  const seg=(GRADE.find(g=>g.v===S.grade)||{n:''}).n;
  const steps=p?p.steps:[];
  const left=evLeft();
  const dims=[['v','劳动观念'],['a','劳动能力'],['h','劳动习惯与品质'],['s','劳动精神']];
  let h='<h1 style="text-align:center">'+esc(S.title||(n+' · '+prod+'　劳动教学设计'))+'</h1>';
  h+='<p style="text-align:center">'+esc(seg)+'　|　'+esc(S.period)+'　|　授课教师学科背景：'+esc(S.bg)+(S.klass?'　|　'+esc(S.klass):'')+'　|　场地：'+esc(S.place)+'</p>';
  if(S.locked) h+='<p style="text-align:center;color:#1e7a5f"><b>状态：合规可用（资料已核实）</b></p>';
  else h+='<p style="text-align:center;color:#b9770e"><b>状态：草稿'+(left>0?'（取证台尚有 '+left+' 项待核实，文中以【待核实】标注）':'')+'</b></p>';

  h+='<h2>一、教学基本信息与课标定位</h2><table border="1" cellspacing="0" cellpadding="6">'
   +'<tr><td>非遗主题</td><td>'+esc(n)+'</td></tr>'
   +'<tr><td>学段 / 课时</td><td>'+esc(seg)+' / '+esc(S.period)+'</td></tr>'
   +'<tr><td>任务群</td><td>任务群3 · 传统工艺制作（结合家乡文化传承）</td></tr>'
   +'<tr><td>劳动成果</td><td>'+esc(prod)+'</td></tr>'
   +'<tr><td>真实劳动情境</td><td>'+esc(sit)+'</td></tr>'
   +'<tr><td>核心素养指向</td><td>劳动观念、劳动能力、劳动习惯与品质、劳动精神</td></tr>'
   +'<tr><td>学校 / 任课教师</td><td>____________________　/　____________________　　授课日期：______年______月______日</td></tr></table>';

  h+='<h2>二、学情分析</h2><p>'+(S.xueqing?esc(S.xueqing):'【待补充：本班真实学情】')
   +'<br>（平台建议：学生动手意愿强但精细动作控制不足；对"非遗"概念模糊；缺乏工具规范使用经验；小组合作易出现"一人做、他人看"。）</p>';

  h+='<h2>三、教学目标（四大核心素养）</h2><table border="1" cellspacing="0" cellpadding="6">'
   +'<tr><th>维度</th><th>目标</th><th>可观测行为</th></tr>'
   +dims.map(function(x){
      return '<tr><td>'+x[1]+'</td><td>'+esc((S.goals&&S.goals[x[0]])||'【待补充】')+'</td><td>'+esc((S.obs&&S.obs[x[0]])||'—')+'</td></tr>';
    }).join('')
   +'</table>';
  if(S.goalAdj) h+='<p>校本补充：'+esc(S.goalAdj)+'</p>';

  h+='<h2>四、教学重难点</h2><p><b>重点：</b>掌握'+esc(p?p.skill:'关键技法')+(p&&p.chant?'（口诀：'+esc(p.chant)+'）':'')+'，完成 1 件符合要求的'+esc(prod)+'。<br>'
   +'<b>难点：</b>'+esc(hardOf(p))+'。</p>'
   +(S.zhongnan?'<p>教师调整：'+esc(S.zhongnan)+'</p>':'');

  h+='<h2>五、教学准备</h2><table border="1" cellspacing="0" cellpadding="6">'
   +'<tr><td>场地</td><td>'+esc(S.place)+'</td></tr>'
   +'<tr><td>分组</td><td>'+esc(S.group)+'</td></tr>'
   +'<tr><td>材料清单</td><td>'+esc(p?p.mat:'【待补充】')+'</td></tr>'
   +'<tr><td>工具</td><td>'+esc(p?p.tools:'【待补充】')+'</td></tr>'
   +'<tr><td>人均成本</td><td>'+esc(p?p.cost:'【待补充】')+'（经核实：'+esc((S.ev.material&&S.ev.material.v)?S.ev.material.v:'【待核实】')+'）</td></tr>'
   +'<tr><td>传承人 / 专家</td><td>'+esc((S.ev.inheritor&&S.ev.inheritor.v)?S.ev.inheritor.v:'【待核实】')+'</td></tr></table>';

  h+='<h2>六、安全预案</h2><p><b>安全等级：</b>'+(p?p.risk:'待定')+'　<b>审批情况：</b>'+esc((S.ev.safety&&S.ev.safety.v)?S.ev.safety.v:'【待核实：审批人 / 日期 / 第二监护人】')+'</p>'
   +'<p>通用措施：圆头工具或钝头针；传递时手柄朝人；课前发放、课后点数；"三不"原则（不入口、不揉眼、不甩动材料）；工具盘编号与座位号对应；涉及刀具/热源/电器须教研组审批并安排第二监护人。</p>'
   +(p&&p.risk!=='低'?'<p><b>项目专项：</b>'+esc(p.flowTip)+'</p>':'');

  h+='<h2>七、教学过程（40 分钟）</h2><table border="1" cellspacing="0" cellpadding="6">'
   +'<tr><th>时间</th><th>教学环节</th><th>教师活动</th><th>学生活动</th><th>设计意图</th></tr>'
   +S.flow.map(function(f){
      return '<tr><td>'+esc(f.t)+'</td><td>'+esc(f.name)+'</td><td>'+esc(f.teach)+'</td><td>'+esc(f.stu)+'</td><td>'+esc(f.intent)+'</td></tr>';
    }).join('')
   +'</table>';
  if(S.flowAdj) h+='<p>流程调整：'+esc(S.flowAdj)+'</p>';

  h+='<h2>八、劳动实践任务单（学生用）</h2><p>任务：完成 1 件'+esc(prod)+'。<br>流程：'
   +esc(steps.map((s,i)=>'☐'+(i+1)+'.'+s.replace(/\s*（.*?）/g,'')).join('　'))
   +'<br>自评：作品质量 ☆☆☆☆☆　工具安全 ☆☆☆☆☆　工位整洁 ☆☆☆☆☆　帮助同伴 ☆☆☆☆☆</p>';
  if(S.taskAdj) h+='<p>调整说明：'+esc(S.taskAdj)+'</p>';

  h+='<h2>九、评价量规</h2><table border="1" cellspacing="0" cellpadding="6">'
   +'<tr><th>维度</th><th>★★★</th><th>★★</th><th>★</th><th>权重</th></tr>'
   +'<tr><td>劳动成果（技能）</td><td>成型、符合用途、细节工整有巧思</td><td>基本成型，局部粗糙</td><td>未成型</td><td>30%</td></tr>'
   +'<tr><td>劳动过程（习惯）</td><td>工具规范、工位整洁、无浪费</td><td>偶需提醒</td><td>需多次督促</td><td>25%</td></tr>'
   +'<tr><td>劳动品质（精神）</td><td>主动返工 ≥1 次并能说明原因</td><td>经鼓励后改进</td><td>应付交差</td><td>25%</td></tr>'
   +'<tr><td>劳动合作</td><td>主动帮助同伴、分享技法</td><td>完成本份</td><td>旁观或干扰</td><td>10%</td></tr>'
   +'<tr><td>劳动认知</td><td>讲清'+esc(n)+'与本地生活的关系</td><td>说出基本工序</td><td>仅知其名</td><td>10%</td></tr></table>'
   +'<p>采用教师评 + 同伴评 + 自评 + 家长评四方评价；对进步明显者使用增值评价。</p>';
  if(S.rubAdj) h+='<p>校本调整：'+esc(S.rubAdj)+'</p>';

  h+='<h2>十、劳动清单与档案</h2><p>归属：生产劳动 · 传统工艺制作；每学期 ≥6 课时；单元化衔接：基础成型 → 加纹样 → 立体/组合 → 文创与义卖。<br>'
   +'档案袋：任务单原件、作品照片（最满意/最想改进）、非遗访谈记录、劳动时长登记（≥12 课时/学期）、反思短文 1 篇。</p>';
  if(S.listAdj) h+='<p>本校衔接说明：'+esc(S.listAdj)+'</p>';

  h+='<h2>十一、板书设计</h2><pre style="background:#fbfcfe;border:1px solid #e3e8ef;padding:14px;border-radius:10px;font-family:SimSun">'+esc(boardText())+'</pre>';

  h+='<h2>十二、课后延伸与作业</h2><ul>'
   +'<li>向家人介绍'+esc(n)+'，讲清它"怎么做、为什么这样做"；</li>'
   +'<li>采访一位会手艺的长辈，记录 3 句话（计入劳动档案袋）；</li>'
   +'<li>完成《劳动实践任务单》自评，并在作品卡上写一句非遗感言；</li>'
   +'<li>家校协同：发放《家长告知单》，回收过敏史与特殊情况。</li></ul>';

  h+='<h2>十三、教学反思（课后填写）</h2><p>'+(S.reflect?esc(S.reflect):'① 动手时间实际 ____ 分钟　② 最乱的环节是 ______ ，因为 ______　③ 下次把 ______ 再砍 / 再加')+'</p>';

  h+='<h2>十四、参考资料与核实记录</h2><table border="1" cellspacing="0" cellpadding="6"><tr><th>核实项</th><th>结论</th><th>出处</th><th>核实日期</th></tr>'
   +evItems().map(x=>{const e=S.ev[x.k]||{};
     const v=e.v?esc(e.v):(e.na?'<b>【待核实】</b>已检索官方来源，未找到可引用的权威表述（课堂不作结论性表述）':'<b>【待核实】</b>'+esc(x.cur));
     return '<tr><td>'+esc(x.i)+'</td><td>'+v+'</td><td>'+esc(e.u||'—')+'</td><td>'+esc(e.d||'—')+'</td></tr>';}).join('')
   +'</table>';
  const notes=(S.notes||[]).filter(x=>x.c||x.t);
  if(notes.length){
    h+='<h3>14.1 我的资料摘抄</h3><table border="1" cellspacing="0" cellpadding="6"><tr><th style="width:200px">标题/要点</th><th>摘抄内容</th><th style="width:180px">出处</th><th style="width:90px">查阅日期</th></tr>'
     +notes.map(x=>'<tr><td>'+esc(x.t||'—')+'</td><td>'+esc(x.c||'')+'</td><td>'+esc(x.u||'—')+'</td><td>'+esc(x.d||'—')+'</td></tr>').join('')+'</table>';
  }
  h+='<p>取证原则：仅采用官方与权威机构来源（中国非物质文化遗产网、文化和旅游部、广东省文化和旅游厅、各省文旅厅、地方文化馆、国家中小学智慧教育平台、教育部、国家图书馆地方志）；无法核实的内容保留【待核实】标记。</p>';

  h+='<h2>十五、课标对照</h2><p>依据《义务教育劳动课程标准（2022年版）》：任务群3 · 传统工艺制作；核心素养四维；过程性评价与表现性评价；平均每周不少于 1 课时；加强劳动安全教育与监护。（正式文本以教育部官网发布稿为准）</p>';
  h+='<p class="foot">本稿由「粤匠 · 广东非遗主题劳动备课平台」生成　生成日期：'+new Date().toLocaleDateString('zh-CN')+'　|　凡标注【待核实】处须经教师核实后方可正式使用</p>';
  return h;
}
/* 取证清单：可打印/可发给文化馆、教研组长协助核实 */
function expEvidence(){
  const n=themeName(), p=cur();
  const it=evItems();
  const rows=it.map(function(x,i){
    const e=S.ev[x.k]||{};
    return '<tr>'
     +'<td>'+(i+1)+'</td>'
     +'<td>'+esc(x.i)+'<br><span style="color:#b9770e">置信度：'+esc(x.c)+'　·　'+esc(x.grp||'')+'</span></td>'
     +'<td>'+esc(x.cur)+'</td>'
     +'<td><ol style="margin:0 0 0 18px;padding:0">'+x.how.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'
        +(x.q?'<div style="color:#1f5f9e;margin-top:4px">检索式：'+esc(x.q)+'</div>':'')
        +'<div style="color:#4a5b6e;margin-top:4px">建议来源：'+esc((SRC[x.src]&&SRC[x.src].n)||'—')+(SRC[x.src]&&SRC[x.src].u?('　'+esc(SRC[x.src].u)):'')+'</div></td>'
     +'<td>'+(e.v?esc(e.v):'')+'</td>'
     +'<td>'+(e.u?esc(e.u):'')+'</td>'
     +'<td>'+(e.d?esc(e.d):'')+'</td>'
     +'</tr>';
  }).join('');
  const html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>'+esc(n)+'·资料取证清单</title>'+docStyle()+'</head><body>'
   +'<h1>'+esc(n)+'　资料取证清单</h1>'
   +'<p style="text-align:center">项目地区：'+esc(p?p.area:'自定义')+'　|　适用学段：'+esc(p?p.suit:'—')+'　|　出具日期：'+new Date().toLocaleDateString('zh-CN')+'　|　已处理 '+evDone()+' / '+evTotal()+' 项</p>'
   +'<h2>使用说明</h2>'
   +'<p>① 本清单由平台生成，可打印后交本市（区）文化馆非遗部、教研组长或传承人协助核实；② 只认官方与权威机构来源，百科与自媒体不能作为出处；③ 无法核实的项目请填写"未找到权威来源"，教学设计中保留【待核实】标记，宁可不写，不可编造；④ 核实完成后回到平台第⑨步逐条回填，导出文档会自动替换。</p>'
   +'<h2>待核实项目清单</h2>'
   +'<table><tr><th style="width:32px">序</th><th style="width:150px">核实项</th><th style="width:150px">平台当前值</th><th>核实步骤与建议来源</th><th style="width:130px">核实结论（请填写）</th><th style="width:130px">出处（书名/网址）</th><th style="width:80px">核实日期</th></tr>'
   +rows+'</table>'
   +'<h2>核实人签署</h2>'
   +'<p>核实人：____________　单位：____________　联系电话：____________　签署日期：______年______月______日</p>'
   +'<p class="foot">本清单由「粤匠 · 广东非遗主题劳动备课平台」生成　平台只给核实路径，不预置史实与名录结论</p>'
   +'</body></html>';
  download(n+'-资料取证清单.doc','\ufeff'+html,'application/msword');
  modalHTML('取证清单已导出','<p>《'+n+'·资料取证清单》共 <b>'+it.length+' 项</b>，已生成 Word 文档，可直接打印后交文化馆非遗部 / 教研组长协助核实。</p>'
   +'<div class="hint">核实完成后回到第⑨步逐条回填，再重新导出教学设计即可自动替换【待核实】标记。</div>'
   +'<div class="row"><button class="btn sm" onclick="closeModal()">好的</button></div>');
}
function download(name,content,type){
  const blob=new Blob([content],{type:type});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function fname(ext){ const n=(S.title||themeName()).replace(/[\\/:*?"<>|]/g,'_'); return n+'.'+ext; }
function expDoc(){
  const html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>'+esc(S.title||themeName())+'</title>'+docStyle()+'</head><body>'+docBody()+'</body></html>';
  download(fname('doc'),'\ufeff'+html,'application/msword');
  modalHTML('已导出','<p>《'+(S.title||themeName())+'》已生成 Word 文档（.doc），可直接用 Word / WPS 打开编辑：A4 版面、标题分级、表格统一边框与表头底色，已按正式教案排版。</p>'
   +(evLeft()?'<div class="warnbox">文中仍有 <b>'+evLeft()+'</b> 项标注为【待核实】，请补齐后重新导出。</div>':'<div class="okbox">全部资料已核实，可作为正式教案提交。</div>')
   +'<div class="row"><button class="btn sm" onclick="closeModal()">好的</button></div>');
}
function expTask(){
  const p=cur(),n=themeName();
  const steps=p?p.steps:['准备','制作','修整','归位','填卡'];
  const html='<html><head><meta charset="utf-8"><title>劳动任务单</title></head><body style="font-family:SimSun;font-size:12pt">'
   +'<h2 style="text-align:center">《粤匠小小传承人》劳动任务单</h2>'
   +'<p>主题：'+esc(n)+'　姓名：______　班级：______　小组：______　日期：______</p>'
   +'<p><b>我的劳动任务：</b>完成 1 件'+esc(productName())+'。</p>'
   +'<p><b>劳动流程：</b><br>'+steps.map((s,i)=>'☐ '+(i+1)+'. '+esc(s.replace(/\s*（.*?）/g,''))).join('<br>')+'</p>'
   +'<p><b>困难：</b>__________　<b>解决：</b>__________</p>'
   +'<p><b>最满意：</b>__________　<b>想改进：</b>__________</p>'
   +'<p><b>自评：</b>作品质量 ☆☆☆☆☆　工具安全 ☆☆☆☆☆　工位整洁 ☆☆☆☆☆　帮助同伴 ☆☆☆☆☆</p>'
   +'<p><b>感言：</b>我今天体会到 __________ 的辛苦 / 快乐。</p>'
   +'<p style="font-size:10pt">安全提醒：工具不指向他人；材料不入口；下课按盘清点工具。</p></body></html>';
  download(themeName()+'-劳动任务单.doc','\ufeff'+html,'application/msword');
}
function expMD(){
  const p=cur(),n=themeName(),prod=productName();
  const dims=[['v','劳动观念'],['a','劳动能力'],['h','劳动习惯与品质'],['s','劳动精神']];
  let m='# '+(S.title||(n+' · '+prod+'　劳动教学设计'))+'\n\n'
   +'> '+((GRADE.find(g=>g.v===S.grade)||{n:''}).n)+'　|　'+S.period+'　|　'+S.bg+(S.klass?'　|　'+S.klass:'')+'\n\n';
  m+='## 一、课标定位\n- 任务群：任务群3 · 传统工艺制作（结合家乡文化传承）\n- 核心素养：劳动观念 / 劳动能力 / 劳动习惯与品质 / 劳动精神\n\n';
  m+='## 二、学情分析\n'+(S.xueqing||'【待补充】')+'\n\n';
  m+='## 三、教学目标\n| 维度 | 目标 | 可观测行为 |\n|---|---|---|\n'
   +dims.map(x=>'| '+x[1]+' | '+((S.goals&&S.goals[x[0]])||'【待补充】').replace(/\n/g,' ')+' | '+((S.obs&&S.obs[x[0]])||'—')+' |').join('\n')+'\n\n';
  m+='## 四、重难点\n- 重点：掌握'+(p?p.skill:'关键技法')+(p&&p.chant?'（口诀：'+p.chant+'）':'')+'\n- 难点：'+(p?p.hard:'关键工序稳定性')+'\n\n';
  m+='## 五、教学准备\n- 场地：'+S.place+'\n- 分组：'+S.group+'\n- 材料：'+(p?p.mat:'【待补充】')+'\n- 工具：'+(p?p.tools:'【待补充】')+'\n- 成本：'+(p?p.cost:'【待补充】')+'\n\n';
  m+='## 六、安全预案\n- 安全等级：'+(p?p.risk:'待定')+'\n- 审批：'+((S.ev.safety&&S.ev.safety.v)?S.ev.safety.v:'【待核实】')+'\n\n';
  m+='## 七、教学过程（40 分钟）\n| 时间 | 环节 | 教师活动 | 学生活动 | 设计意图 |\n|---|---|---|---|---|\n'
   +S.flow.map(f=>'| '+f.t+' | '+f.name+' | '+String(f.teach).replace(/\n/g,' ')+' | '+String(f.stu).replace(/\n/g,' ')+' | '+String(f.intent).replace(/\n/g,' ')+' |').join('\n')+'\n\n';
  m+='## 八、评价量规\n| 维度 | 权重 |\n|---|---|\n| 劳动成果 | 30% |\n| 劳动过程 | 25% |\n| 劳动品质 | 25% |\n| 劳动合作 | 10% |\n| 劳动认知 | 10% |\n\n';
  m+='## 九、参考资料与核实记录\n| 核实项 | 结论 | 出处 | 日期 |\n|---|---|---|---|\n'
   +evItems().map(x=>{const e=S.ev[x.k]||{};
     const v=e.v?String(e.v).replace(/\n/g,' '):(e.na?'**【待核实】** 已检索官方来源，未找到可引用的权威表述':'**【待核实】** '+x.cur);
     return '| '+x.i+' | '+v+' | '+(e.u||'—')+' | '+(e.d||'—')+' |';}).join('\n')+'\n\n';
  const mnotes=(S.notes||[]).filter(x=>x.c||x.t);
  if(mnotes.length) m+='### 9.1 我的资料摘抄\n\n'+mnotes.map(x=>'- **'+(x.t||'摘抄')+'**：'+String(x.c||'').replace(/\n/g,' ')+(x.u?('（出处：'+x.u+'）'):'')+'\n').join('')+'\n';
  m+='## 十、板书设计\n```\n'+boardText()+'\n```\n\n';
  m+='## 十一、教学反思\n'+(S.reflect||'① 动手时间 ____ 分钟　② 最乱环节 ______　③ 下次 ______')+'\n\n';
  m+='---\n由「粤匠 · 广东非遗主题劳动备课平台」生成　'+new Date().toLocaleDateString('zh-CN')+'\n';
  download(fname('md'),m,'text/markdown;charset=utf-8');
}
/* ============ 九、课件 PPT 生成（纯前端：ZIP + OOXML） ============ */
function xesc(s){ return String(s==null?'':s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
function bullets(t,max){
  const s=String(t||'').replace(/\r/g,'');
  let arr=s.split(/[\n；;。]/).map(x=>x.trim()).filter(Boolean);
  const out=[];
  arr.forEach(x=>{
    if(x.length<=(max||42)){ out.push(x); }
    else{ let cur=''; x.split(/[，,]/).forEach(seg=>{ if((cur+seg).length>(max||42)){ if(cur)out.push(cur); cur=seg; } else cur+=seg; }); if(cur)out.push(cur); }
  });
  return out.slice(0,9);
}
function pptSlides(){
  const p=cur(), n=themeName(), prod=productName();
  const seg=(GRADE.find(g=>g.v===S.grade)||{n:''}).n;
  const sit=S.situation||(p?p.sit:'');
  const dims=[['v','劳动观念'],['a','劳动能力'],['h','劳动习惯与品质'],['s','劳动精神']];
  const SL=[];
  SL.push({t:S.title||(n+' · '+prod+'　劳动教学设计'),b:[
    '非遗主题：'+n+'（'+(p?p.area:'自定义')+'）',
    seg+'　|　'+S.period+'　|　'+S.bg,
    '任务群：任务群3 · 传统工艺制作（结合家乡文化传承）',
    '劳动成果：'+prod,
    '真实情境：'+sit]});
  SL.push({t:'一、课标定位（自动判定）',b:[
    '所属任务群：任务群3 · 传统工艺制作',
    '核心素养：劳动观念 / 劳动能力 / 劳动习惯与品质 / 劳动精神',
    '课标要求：选择 1-2 项传统工艺进行简易作品的设计与制作',
    '教学提示：真实情境 · 做中学 · 安全卫生 · 反思改进 · 联系家乡文化',
    '课时要求：平均每周不少于 1 课时',
    '合格硬指标：学生动手时间 ≥ 50%，产出可评价的劳动成果']});
  SL.push({t:'二、学情分析',b:bullets(S.xueqing||'动手意愿强但精细动作不足；对"非遗"概念模糊；缺乏工具规范使用经验；小组合作易"一人做、他人看"。')});
  SL.push({t:'三、教学目标（四大核心素养）',b:dims.map(x=>x[1]+'：'+((S.goals&&S.goals[x[0]])||'【待补充】')).concat(S.goalAdj?['校本补充：'+S.goalAdj]:[])});
  SL.push({t:'四、教学重难点',b:[
    '重点：掌握'+(p?p.skill:'关键技法')+(p&&p.chant?'（口诀：'+p.chant+'）':'')+'，完成 1 件'+prod,
    '难点：'+hardOf(p),
    S.zhongnan?('教师调整：'+S.zhongnan):''].filter(Boolean)});
  SL.push({t:'五、材料与工具准备',b:[
    '场地：'+S.place+'　分组：'+S.group,
    '材料：'+(p?p.mat:'【待补充】'),
    '工具：'+(p?p.tools:'【待补充】'),
    '人均成本：'+(p?p.cost:'【待补充】'),
    '传承人/专家：'+((S.ev.inheritor&&S.ev.inheritor.v)?S.ev.inheritor.v:'【待核实】')]});
  SL.push({t:'六、安全须知（红线环节）',b:[
    '安全等级：'+(p?p.risk:'待定')+(p&&p.risk!=='低'?'（须教研组审批 + 第二监护人）':''),
    '工具：圆头工具/钝头针，传递时手柄朝人，课前发放、课后点数',
    '材料："三不"原则——不入口、不揉眼、不甩动材料',
    '场地：水盆放桌内角，备抹布，积水立即处理',
    p?('项目专项：'+p.flowTip):'',
    '审批情况：'+((S.ev.safety&&S.ev.safety.v)?S.ev.safety.v:'【待核实】')].filter(Boolean)});
  S.flow.forEach(function(f,i){
    SL.push({t:'七-'+(i+1)+'　'+f.name+'（'+f.t+'）',b:[]
      .concat(['▍教师活动：']).concat(bullets(f.teach,46))
      .concat(['▍学生活动：']).concat(bullets(f.stu,46))
      .concat(['▍设计意图：']).concat(bullets(f.intent,46))});
  });
  SL.push({t:'八、展示评价与量规',b:[
    '劳动成果（技能）30%：成型、符合用途、细节工整',
    '劳动过程（习惯）25%：工具规范、工位整洁、无浪费',
    '劳动品质（精神）25%：主动返工 ≥1 次并能说明原因',
    '劳动合作 10%：主动帮助同伴、分享技法',
    '劳动认知 10%：能讲清'+n+'与本地生活的关系',
    '四方评价：教师评 + 同伴评 + 自评 + 家长评；使用增值评价']});
  SL.push({t:'九、劳动习惯与整理（易被忽略的得分点）',b:habitsOf(p).concat(['整理流程：工具归位 → 桌面 5S → 垃圾分类 → 齐读口号'])});
  SL.push({t:'十、板书设计',b:boardText().split('\n')});
  SL.push({t:'十一、课后延伸与作业',b:[
    '向家人介绍'+n+'，讲清它"怎么做、为什么这样做"',
    '采访一位会手艺的长辈，记录 3 句话（计入劳动档案）',
    '完成《劳动任务单》自评，并在作品卡写一句非遗感言',
    '教师反思三问：动手几分钟 / 哪个环节最乱 / 下次砍什么加什么']});
  const notes=(S.notes||[]).filter(x=>x.c||x.t);
  SL.push({t:'十二、参考资料与核实记录',b:[]
    .concat(evItems().map(x=>{const e=S.ev[x.k]||{};return x.i+'：'+(e.v?e.v:'【待核实】'+x.cur);}))
    .concat(notes.length?['—— 我的资料摘抄 ——']:[])
    .concat(notes.map(x=>(x.t?x.t+'：':'')+(x.c||'')+(x.u?('（出处：'+x.u+')'):'')))
    .concat(['取证原则：只认官方与权威机构来源，无法核实的一律标【待核实】'])});
  return SL;
}
function boardText(){
  const p=cur(), n=themeName(), prod=productName(), chant=p?p.chant:'（自编口诀）';
  return n+' —— 一件'+prod+'的劳动课\n'
  +'┌──────────────────────────────┐\n'
  +'│ 劳动观念：'+keysLine(p)+'\n'
  +'│ 劳动能力：'+(p?p.steps.slice(0,5).map(s=>s.replace(/\s*（.*?）/g,'').slice(0,6)).join(' → '):'准备 → 制作 → 修整 → 归位')+'\n'
  +'│ 劳动品质：耐心 · 节约 · 整洁\n'
  +'│ 劳动精神：精益求精 · 守正创新\n'
  +'└──────────────────────────────┘\n'
  +'口诀：'+chant;
}
let CRCT=null;
function crc32(u8){
  if(!CRCT){ CRCT=new Uint32Array(256);
    for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); CRCT[n]=c>>>0; } }
  let c=0xFFFFFFFF;
  for(let i=0;i<u8.length;i++) c=CRCT[(c^u8[i])&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
function zipStore(files){
  const enc=new TextEncoder();
  const chunks=[], central=[]; let offset=0;
  files.forEach(function(f){
    const nb=enc.encode(f.name), db=enc.encode(f.data), crc=crc32(db);
    const lh=new Uint8Array(30+nb.length), dv=new DataView(lh.buffer);
    dv.setUint32(0,0x04034b50,true); dv.setUint16(4,20,true); dv.setUint16(6,0x0800,true);
    dv.setUint16(8,0,true); dv.setUint16(10,0,true); dv.setUint16(12,0x0021,true);
    dv.setUint32(14,crc,true); dv.setUint32(18,db.length,true); dv.setUint32(22,db.length,true);
    dv.setUint16(26,nb.length,true); dv.setUint16(28,0,true); lh.set(nb,30);
    chunks.push(lh,db);
    const ch=new Uint8Array(46+nb.length), cv=new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true);
    cv.setUint16(8,0x0800,true); cv.setUint16(10,0,true); cv.setUint16(12,0,true); cv.setUint16(14,0x0021,true);
    cv.setUint32(16,crc,true); cv.setUint32(20,db.length,true); cv.setUint32(24,db.length,true);
    cv.setUint16(28,nb.length,true); cv.setUint16(30,0,true); cv.setUint16(32,0,true);
    cv.setUint16(34,0,true); cv.setUint16(36,0,true); cv.setUint32(38,0,true); cv.setUint32(42,offset,true);
    ch.set(nb,46); central.push(ch);
    offset+=lh.length+db.length;
  });
  let cdSize=0; central.forEach(c=>cdSize+=c.length);
  const eo=new Uint8Array(22), ev=new DataView(eo.buffer);
  ev.setUint32(0,0x06054b50,true); ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true);
  ev.setUint32(12,cdSize,true); ev.setUint32(16,offset,true);
  return new Blob(chunks.concat(central).concat([eo]),{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
}
function slideXML(s){
  let body='';
  s.b.forEach(function(line){
    const isH=String(line).indexOf('▍')===0;
    body+='<a:p><a:pPr'+(isH?'':' marL="285750" indent="-285750"')+'>'
      +(isH?'':'<a:buClr><a:srgbClr val="D98831"/></a:buClr><a:buFont typeface="Arial"/><a:buChar char="•"/>')
      +'</a:pPr><a:r><a:rPr lang="zh-CN" altLang="en-US" sz="'+(isH?'1800':'1600')+'" b="'+(isH?'1':'0')+'" dirty="0">'
      +'<a:solidFill><a:srgbClr val="'+(isH?'B03A2E':'1B2733')+'"/></a:solidFill></a:rPr><a:t>'+xesc(line)+'</a:t></a:r></a:p>';
  });
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
  +'<p:cSld><p:spTree>'
  +'<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
  +'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
  +'<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>'
  +'<p:spPr><a:xfrm><a:off x="609600" y="411480"/><a:ext cx="10972800" cy="1143000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
  +'<p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN" altLang="en-US" sz="3000" b="1" dirty="0"><a:solidFill><a:srgbClr val="B03A2E"/></a:solidFill></a:rPr><a:t>'+xesc(s.t)+'</a:t></a:r></a:p></p:txBody></p:sp>'
  +'<p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>'
  +'<p:spPr><a:xfrm><a:off x="685800" y="1708200"/><a:ext cx="10800700" cy="4521200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
  +'<p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720"><a:normAutofit/></a:bodyPr><a:lstStyle/>'+body+'</p:txBody></p:sp>'
  +'<p:sp><p:nvSpPr><p:cNvPr id="4" name="Footer"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>'
  +'<p:spPr><a:xfrm><a:off x="609600" y="6400800"/><a:ext cx="10972800" cy="342900"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
  +'<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN" sz="1000" dirty="0"><a:solidFill><a:srgbClr val="9AA7B5"/></a:solidFill></a:rPr><a:t>粤匠 · 广东非遗主题劳动备课平台　依据《义务教育劳动课程标准（2022年版）》</a:t></a:r></a:p></p:txBody></p:sp>'
  +'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
}
function buildPPTXBlob(){
  const SL=pptSlides();
  const files=[];
  let over='';
  SL.forEach(function(s,i){
    over+='<Override PartName="/ppt/slides/slide'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
  });
  files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
   +'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
   +'<Default Extension="xml" ContentType="application/xml"/>'
   +'<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
   +'<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
   +'<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
   +'<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'+over
   +'<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
   +'<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'});
  files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
   +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
   +'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
   +'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'});
  let sldIds='', presRels='<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>';
  SL.forEach(function(s,i){
    sldIds+='<p:sldId id="'+(256+i)+'" r:id="rId'+(i+2)+'"/>';
    presRels+='<Relationship Id="rId'+(i+2)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+(i+1)+'.xml"/>';
  });
  files.push({name:'ppt/presentation.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
   +'<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>'+sldIds+'</p:sldIdLst>'
   +'<p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'});
  files.push({name:'ppt/_rels/presentation.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+presRels+'</Relationships>'});
  files.push({name:'ppt/slideMasters/slideMaster1.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
   +'<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
   +'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
   +'<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
   +'<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>'});
  files.push({name:'ppt/_rels/slideMasters/_rels/slideMaster1.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
   +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
   +'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>'});
  files.push({name:'ppt/slideLayouts/slideLayout1.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">'
   +'<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
   +'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
   +'<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'});
  files.push({name:'ppt/_rels/slideLayouts/_rels/slideLayout1.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
   +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>'});
  files.push({name:'ppt/theme/theme1.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="YueJiang"><a:themeElements>'
   +'<a:clrScheme name="YueJiang">'
   +'<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'
   +'<a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>'
   +'<a:accent1><a:srgbClr val="B03A2E"/></a:accent1><a:accent2><a:srgbClr val="D98831"/></a:accent2>'
   +'<a:accent3><a:srgbClr val="1E7A5F"/></a:accent3><a:accent4><a:srgbClr val="1F5F9E"/></a:accent4>'
   +'<a:accent5><a:srgbClr val="B9770E"/></a:accent5><a:accent6><a:srgbClr val="7A5300"/></a:accent6>'
   +'<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>'
   +'<a:fontScheme name="YueJiang"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface=""/></a:majorFont>'
   +'<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
   +'<a:fmtScheme name="YueJiang"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
   +'<a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>'
   +'<a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>'
   +'<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>'
   +'<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
   +'<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
   +'</a:fmtScheme></a:themeElements></a:theme>'});
  const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
  const ptitle=S.title||themeName();
  files.push({name:'docProps/core.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
   +'<dc:title>'+xesc(ptitle)+'</dc:title>'
   +'<dc:creator>\u7ca4\u5320\u00b7\u5e7f\u4e1c\u975e\u9057\u4e3b\u9898\u52b3\u52a8\u5907\u8bfe\u5e73\u53f0</dc:creator>'
   +'<cp:lastModifiedBy>\u7ca4\u5320\u00b7\u5e7f\u4e1c\u975e\u9057\u4e3b\u9898\u52b3\u52a8\u5907\u8bfe\u5e73\u53f0</cp:lastModifiedBy>'
   +'<dcterms:created xsi:type="dcterms:W3CDTF">'+now+'</dcterms:created>'
   +'<dcterms:modified xsi:type="dcterms:W3CDTF">'+now+'</dcterms:modified>'
   +'</cp:coreProperties>'});
  files.push({name:'docProps/app.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
   +'<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
   +'<Application>\u7ca4\u5320\u5907\u8bfe\u5e73\u53f0</Application><Company>\u7ca4\u5320</Company>'
   +'<Slides>'+SL.length+'</Slides><TitlesOfParts><vt:vector size="'+SL.length+'" baseType="lpstr">'
   +SL.map(s=>'<vt:lpstr>'+xesc(s.t)+'</vt:lpstr>').join('')
   +'</vt:vector></TitlesOfParts></Properties>'});
  SL.forEach(function(s,i){
    files.push({name:'ppt/slides/slide'+(i+1)+'.xml',data:slideXML(s)});
    files.push({name:'ppt/_rels/slides/_rels/slide'+(i+1)+'.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
     +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>'});
  });
  return zipStore(files);
}
function expPPT(){
  try{
    const blob=buildPPTXBlob();
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fname('pptx');
    document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
    modalHTML('课件已生成','<p>《'+(S.title||themeName())+'》课件 PPT 已下载（<b>'+pptSlides().length+' 页</b>，.pptx 格式，可用 PowerPoint / WPS 演示打开并继续编辑）。</p>'
     +'<div class="hint">幻灯片结构：封面 → 课标定位 → 学情 → 目标 → 重难点 → 材料 → 安全 → 五个教学环节（教师活动/学生活动/设计意图）→ 评价量规 → 劳动习惯 → 板书 → 课后延伸 → 参考资料。</div>'
     +'<div class="warnbox">若个别版本 Office 提示修复，请改用<b>"🖥 课件演示版（HTML）"</b>，可全屏放映或打印为 PDF。</div>'
     +'<div class="row"><button class="btn sm" onclick="closeModal()">好的</button></div>');
  }catch(e){ alert('PPT 生成失败：'+e.message+'　请改用"课件演示版（HTML）"'); }
}
function expPPTHTML(){
  const SL=pptSlides(), N=SL.length;
  let body='';
  SL.forEach(function(s,i){
    body+='<section class="pg'+(i===0?' cover':'')+'">'
      +'<div class="num">第 '+(i+1)+' / '+N+' 页</div>'
      +(i===0?'<div class="badge">粤</div>':'')
      +'<h1>'+esc(s.t)+'</h1><ul>'
      +s.b.map(l=>'<li'+(String(l).indexOf('▍')===0?' class="h"':'')+'>'+esc(l)+'</li>').join('')+'</ul>'
      +'<div class="ft">粤匠 · 广东非遗主题劳动备课平台　|　依据《义务教育劳动课程标准（2022年版）》</div></section>';
  });
  const html='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>'+esc(S.title||themeName())+' · 课件</title><style>'
   +'body{margin:0;padding:18px 0;font-family:"Microsoft YaHei","PingFang SC",sans-serif;background:#1b2733}'
   +'.pg{width:1000px;min-height:562px;margin:0 auto 18px;background:#fff;border-radius:14px;padding:46px 58px;box-sizing:border-box;position:relative;page-break-after:always;box-shadow:0 6px 22px rgba(0,0,0,.25)}'
   +'.pg h1{margin:0 0 20px;font-size:29px;color:#b03a2e;border-left:8px solid #d98831;padding-left:16px;line-height:1.35}'
   +'.pg ul{margin:0;padding-left:4px;list-style:none}'
   +'.pg li{font-size:19px;line-height:1.85;margin:9px 0;padding-left:22px;position:relative;color:#1b2733}'
   +'.pg li:before{content:"";position:absolute;left:4px;top:14px;width:8px;height:8px;border-radius:50%;background:#d98831}'
   +'.pg li.h:before{display:none}'
   +'.pg li.h{color:#b03a2e;font-weight:700;padding-left:0;margin-top:16px;font-size:20px}'
   +'.num{position:absolute;right:26px;top:20px;color:#9aa7b5;font-size:13px}'
   +'.ft{position:absolute;left:58px;right:58px;bottom:22px;color:#9aa7b5;font-size:12px;border-top:1px solid #e3e8ef;padding-top:8px}'
   +'.pg.cover{background:linear-gradient(135deg,#b03a2e 0%,#d98831 100%);color:#fff}'
   +'.pg.cover h1{color:#fff;border-left-color:rgba(255,255,255,.85)}'
   +'.pg.cover li{color:rgba(255,255,255,.95);font-size:20px}'
   +'.pg.cover li:before{background:rgba(255,255,255,.9)}'
   +'.pg.cover .num,.pg.cover .ft{color:rgba(255,255,255,.85);border-top-color:rgba(255,255,255,.35)}'
   +'.badge{position:absolute;right:48px;bottom:56px;width:80px;height:80px;border-radius:20px;border:2px solid rgba(255,255,255,.55);background:rgba(255,255,255,.16);color:#fff;font-size:44px;font-weight:700;display:flex;align-items:center;justify-content:center}'
   +'@media print{@page{size:A4 landscape;margin:10mm}'
   +'body{background:#fff;padding:0}'
   +'.pg{width:100%;height:158mm;min-height:0;margin:0;border-radius:0;box-shadow:none;padding:22px 30px}'
   +'.pg h1{font-size:20px;margin-bottom:12px}'
   +'.pg li{font-size:13.5px;line-height:1.7;margin:5px 0}'
   +'.pg li.h{font-size:14.5px}'
   +'.pg.cover{background:#b03a2e!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
   +'</style></head><body>'+body+'</body></html>';
  download((S.title||themeName())+'-课件.html','\ufeff'+html,'text/html;charset=utf-8');
  modalHTML('课件演示版已生成','<p>已下载 HTML 课件（'+N+' 页，16:9）：双击用浏览器打开即可全屏放映（F11），也可用"打印 → 另存为 PDF"横向导出 PDF 课件。</p>'
   +'<div class="hint">样式：封面为品牌色渐变页 + "粤"字徽标，正文页带页码与页脚，打印时自动切换为 A4 横向、一页一张。</div>'
   +'<div class="row"><button class="btn sm" onclick="closeModal()">好的</button></div>');
}
function expJSON(){ download(fname('json'),JSON.stringify(S,null,2),'application/json'); }
function impJSON(inp){
  const f=inp.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=function(){ try{ S=Object.assign(S,JSON.parse(r.result)); save(); render(); alert('已恢复备份'); }catch(e){ alert('文件格式不正确'); } };
  r.readAsText(f); inp.value='';
}
function resetAll(){ if(confirm('确定清空本次备课？建议先做一次备份。')){ localStorage.removeItem(KEY); location.reload(); } }

/* ============ 九、导航高亮 ============ */
window.addEventListener('scroll',()=>{
  const secs=[...document.querySelectorAll('main section')];
  const navs={}; document.querySelectorAll('#nav a').forEach(a=>navs[a.getAttribute('href').slice(1)]=a);
  let curId='';
  secs.forEach(s=>{ if(window.scrollY>=s.offsetTop-140) curId=s.id; });
  document.querySelectorAll('#nav a').forEach(a=>a.classList.remove('on'));
  if(navs[curId]) navs[curId].classList.add('on');
});

/* ============ 启动 ============ */
load();
if(!S.product){ const p=cur(); if(p){S.product=p.product;S.situation=p.sit;} }
render();
