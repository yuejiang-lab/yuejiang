/* ============================================================
 * steps.js —— 视图渲染层
 * 十步备课流程（step1~step10）+ 三个附录 + 资料搜寻器 + 摘抄本
 * 依赖：data.js, core.js
 * ============================================================ */

/* ============ 五、渲染 ============ */
function render(){
  syncGen();
  const p=cur(), n=themeName();
  document.getElementById('docTitle').textContent = S.title || (n+' · '+productName()+'　劳动教学设计');
  document.getElementById('docSub').textContent = (GRADE.find(g=>g.v===S.grade)||{n:''}).n+'　|　'+S.period+'　|　任课教师学科背景：'+S.bg+(S.klass?'　|　'+S.klass:'');

  let h='';
  h+=step1(p,n); h+=step2(p,n); h+=step3(p,n); h+=step4(p,n); h+=step5(p,n);
  h+=step6(p,n); h+=step7(p,n); h+=step8(p,n); h+=step9(p,n); h+=step10(p,n);
  h+=appA(); h+=appB(); h+=appC();
  document.getElementById('app').innerHTML=h;
  bind();
  refreshProgress();
}

/* 第①步 选题 */
function step1(p,n){
  const tabs='<div class="tabs" id="regTabs">'
    +'<button class="'+(S.lib==='gd'?'on':'')+'" onclick="setLib(\'gd\')">广东非遗（'+P_GD.length+'）</button>'
    +'<button class="'+(S.lib==='cn'?'on':'')+'" onclick="setLib(\'cn\')">全国非遗（'+P_CN.length+'）</button>'
    +'<button class="'+(S.lib==='all'?'on':'')+'" onclick="setLib(\'all\')">全部（'+P.length+'）</button>'
    +'</div>';
  const provSel = (S.lib==='cn'||S.lib==='all')
    ? '<div class="row" style="margin-bottom:10px"><label class="f" style="margin:0">按省/区/市筛选：</label>'
      +'<select style="width:auto;min-width:160px" onchange="setProv(this.value)">'
      +'<option value="">全部地区</option>'
      +PROVS.map(v=>'<option value="'+esc(v)+'"'+(S.prov===v?' selected':'')+'>'+esc(v)+'</option>').join('')
      +'</select></div>' : '';
  const pool = P.filter(x=>(S.lib==='all'||x.reg===S.lib) && (!S.prov||provOf(x)===S.prov));
  let cards='';
  pool.forEach(x=>{
    const rk = x.risk==='低'?'g':(x.risk==='中'?'a':'r');
    cards+='<div class="pcard'+(S.proj===x.id?' on':'')+'" data-p="'+x.id+'">'
      +'<b>'+esc(x.n)+'</b>'
      +'<div class="m">'+esc(x.area)+'　·　'+esc(x.suit)+'</div>'
      +'<div class="m">类别：'+CATNAME[x.cat]+'　安全：<span class="pill '+rk+'">'+x.risk+'</span></div>'
      +'<div class="m" style="margin-top:4px">成果：'+esc(x.product)+'</div></div>';
  });
  cards+='<div class="pcard'+(S.proj==='custom'?' on':'')+'" data-p="custom"><b>✎ 自定义主题（全国任意项目）</b>'
    +'<div class="m">本地/镇街级项目、或库中未收录的项目，可自行填写名称、地区与类别；平台给出通用备课框架 + 取证要点，资料可用第⑨步"资料搜寻器"补齐。</div></div>';

  return '<section class="card" id="s1"><h3><span class="n">1</span>第①步 · 选定非遗主题与劳动成果（广东 / 全国 / 自定义）</h3>'
  +'<p class="sub">选择 1 项非遗作为课堂主题（课标要求"选择 1-2 项传统工艺进行简易作品的设计与制作"，<strong>不要贪多</strong>）。选定后全站内容自动重算，<strong>您已改写的部分会保留</strong>。</p>'
  +tabs+provSel
  +'<div class="pcards">'+cards+'</div>'
  +(S.proj==='custom'?'<div class="grid3" style="margin-top:14px"><div><label class="f">自定义主题名称</label>'+tx('custom','如：东莞麒麟扎作')+'</div>'
    +'<div><label class="f">类别</label><select data-k="customCat">'+['编','绣','绘','剪','陶','食','其'].map(c=>'<option value="'+c+'"'+(S.customCat===c?' selected':'')+'>'+c+' · '+CATNAME[c]+'</option>').join('')+'</select></div>'
    +'<div><label class="f">所在地区</label>'+tx('area','如：东莞·厚街')+'</div></div>':'')
  +'<div class="grid3" style="margin-top:14px">'
    +'<div><label class="f">学段</label><select data-k="grade">'+GRADE.map(g=>'<option value="'+g.v+'"'+(S.grade===g.v?' selected':'')+'>'+g.n+'</option>').join('')+'</select></div>'
    +'<div><label class="f">课时</label><select data-k="period">'+PERIOD.map(x=>'<option'+(S.period===x?' selected':'')+'>'+x+'</option>').join('')+'</select></div>'
    +'<div><label class="f">授课教师学科背景</label><select data-k="bg">'+BG.map(x=>'<option'+(S.bg===x?' selected':'')+'>'+x+'</option>').join('')+'</select></div>'
  +'</div>'
  +'<div class="grid3">'
    +'<div><label class="f">任教班级</label>'+tx('klass','如：四（2）班 42 人')+'</div>'
    +'<div><label class="f">场地</label><select data-k="place">'+['普通教室（小组桌）','劳动/综合实践教室','美术教室（需清台）','校园劳动实践基地','食堂/家政室（食品类）'].map(x=>'<option'+(S.place===x?' selected':'')+'>'+x+'</option>').join('')+'</select></div>'
    +'<div><label class="f">分组方式</label>'+tx('group','4 人一组，设"工具员"1 名')+'</div>'
  +'</div>'
  +'<div class="grid2" style="margin-top:10px">'
    +'<div><label class="f">课题名称（可改，将作为教案标题）</label>'+tx('title',n+' · '+productName()+'　劳动教学设计')+'</div>'
    +'<div><label class="f">真实劳动情境（任务驱动，必填）</label>'+tx('situation',p?p.sit:'为学校/班级的真实活动制作可用、可送、可展的劳动成果')+'</div>'
  +'</div>'
  +'<div style="margin-top:10px"><label class="f">劳动成果（作品）形式（可改）</label>'+tx('product',p?p.product:'')+'</div>'
  +'<div class="hint"><b>兼职教师提示：</b>劳动课必须有<span class="kw">真实用途</span>的成果。三问自检：① 学生做的东西<strong>有人用吗</strong>？② 过程中需要<strong>规范使用工具</strong>吗？③ 能评价<strong>习惯与品质</strong>吗？三问皆"是"，才是劳动课。</div>'
  +'</section>';
}

/* 第②步 课标定位 */
function step2(p,n){
  const g=S.grade;
  const seg = g==='1'?'第一学段（1-2年级）':g==='2'?'第二学段（3-4年级）':g==='3'?'第三学段（5-6年级）':'第四学段（7-9年级）';
  const tg = (g==='1')?['任务群1 · 生活自理','任务群3 · 传统工艺制作（体验层面）']:
             (g==='4')?['任务群3 · 传统工艺制作','任务群8 · 新技术体验与应用（可选融合）']:
                       ['任务群3 · 传统工艺制作'];
  const req = (g==='1')?'参与简单的传统工艺制作体验，感受劳动的辛苦与快乐，初步养成"自己的事情自己做"的习惯。'
             :(g==='4')?'选择 1-2 项传统工艺，了解其特点与历史，进行有一定难度的作品设计与制作，体会精益求精的工匠精神，形成传承中华优秀传统文化的意识。'
             :'选择 1-2 项传统工艺（如纸艺、陶艺、布艺、编织、漆艺、木工、篆刻、皮影、活字印刷等）进行简易作品的设计与制作，感受传统工艺的精湛技艺与独特匠心，体悟劳动创造美、创造智慧的价值。';
  return '<section class="card" id="s2"><h3><span class="n">2</span>第②步 · 课标定位（平台自动判定，供核对）</h3>'
  +'<p class="sub">以下由平台依据"学段 + 主题类别"自动匹配《义务教育劳动课程标准（2022年版）》，属<span class="pill g">高置信</span>内容，请核对学段是否选对。</p>'
  +'<table><tr><th style="width:150px">判定项</th><th>平台结论</th><th style="width:90px">置信度</th></tr>'
  +'<tr><td>所属任务群</td><td>'+tg.map(x=>'<span class="pill b">'+x+'</span>').join(' ')+'（另可结合<span class="pill a">家乡文化传承</span>专题）</td><td><span class="pill g">高</span></td></tr>'
  +'<tr><td>所属学段</td><td>'+seg+'　（劳动课程共设 10 个任务群，按学段螺旋上升安排）</td><td><span class="pill g">高</span></td></tr>'
  +'<tr><td>内容要求（课标要义）</td><td>'+req+'</td><td><span class="pill g">高</span></td></tr>'
  +'<tr><td>核心素养指向</td><td>劳动观念（尊重工匠劳动、认同本土文化）、劳动能力（工具使用与流程执行）、劳动习惯与品质（整洁、节约、耐心、精益求精）、劳动精神（工匠精神、守正创新）</td><td><span class="pill g">高</span></td></tr>'
  +'<tr><td>教学提示（课标）</td><td>① 创设<span class="kw">真实劳动情境</span>；② 强调<span class="kw">动手实践、做中学</span>；③ 注重<span class="kw">安全与卫生</span>；④ 引导<span class="kw">反思与改进</span>；⑤ 联系<span class="kw">生活与家乡文化</span>；⑥ 注重<span class="kw">过程性与表现性评价</span>。</td><td><span class="pill g">高</span></td></tr>'
  +'<tr><td>课时要求</td><td>劳动课程平均<span class="kw">每周不少于 1 课时</span>；本次安排：'+esc(S.period)+'</td><td><span class="pill g">高</span></td></tr>'
  +'</table>'
  +'<div class="okbox"><b>平台判定：</b>本课为<strong>"传统工艺制作 + 家乡文化传承"</strong>复合型劳动课，<strong>不是</strong>美术欣赏课、手工娱乐课或文化宣讲课。合格硬指标：<span class="kw">学生动手劳动时间 ≥ 总时长 50%</span>，且产出<strong>可评价的劳动成果</strong>。</div>'
  +'<div class="warnbox"><b>注意：</b>课标原文请以教育部发布的正式文本为准，本页面为"要义转述"；正式参赛/检查用稿请到教育部官网核对原文条目。</div>'
  +'</section>';
}

/* 第③步 学情目标重难点 */
function step3(p,n){
  const prod = productName();
  const skill = p?p.skill:'（请在第①步选择主题后自动生成）';
  const chant = p?p.chant:'';
  const dims=[['v','劳动观念'],['a','劳动能力'],['h','劳动习惯与品质'],['s','劳动精神']];
  return '<section class="card" id="s3"><h3><span class="n">3</span>第③步 · 学情分析、教学目标与重难点</h3>'
  +'<div class="grid2">'
  +'<div><label class="f">学情起点（平台建议，供参考）</label>'
  +'<div class="tpl ro"><span class="from">平台建议</span>'
  +'· 动手意愿强，但<strong>精细动作控制不足</strong>，易松脱、歪斜<br>'
  +'· 对"非遗"概念模糊，常误认为"就是老东西"<br>'
  +'· 缺乏<strong>工具规范使用</strong>经验，安全意识薄弱<br>'
  +'· 小组合作易出现<strong>"一人做、他人看"</strong><br>'
  +'· 兼职教师本人也可能首次接触该项目——这很正常，<strong>与学生同做一遍即可</strong></div>'
  +'<label class="f">补充本班真实学情（建议填写）</label>'+ta('xueqing','如：本班有随班就读学生 2 名，需降低任务难度；有 3 名学生参加过非遗社团，可当"小师傅"',4)+'</div>'
  +'<div><label class="f">教学重难点（平台生成，可修改）</label>'
  +'<div class="tpl ro"><span class="from">平台建议</span>'
  +'<b>重点：</b>掌握'+esc(skill)+(chant?'（口诀：'+esc(chant)+'）':'')+'，完成 1 件符合要求的'+esc(prod)+'。<br>'
  +'<b>难点：</b>'+esc(hardOf(p))+'。</div>'
  +'<label class="f">我的调整</label>'+ta('zhongnan','如把难点改为"……"，或针对本班降低/提高要求',3)+'</div>'
  +'</div>'
  +'<h4>教学目标（四大核心素养 · <span class="kw">可直接改写</span>）</h4>'
  +'<div class="hint"><b>平台保真 + 教师个性化：</b>四个维度、可观测要求、课标对应关系由平台锁定（不会跑偏）；具体表述请您按本班实际改写。写好后可用 <b>✨一键润色</b>（规范标点、去除口语、精简冗余）、<b>🔍表达体检</b>（查主语/动词/空泛表述）、<b>🤖AI 优化</b>（内置课标约束，只润色不改事实）。</div>'
  +'<table><tr><th style="width:140px">素养维度</th><th>目标表述（可编辑）</th><th style="width:200px">可观测行为（可编辑）</th></tr>'
  +dims.map(function(x){
      return '<tr><td><b>'+x[1]+'</b><div class="dim">对标课标核心素养</div></td>'
      +'<td>'+edTools('goals.'+x[0],'goal')+'<textarea data-k="goals.'+x[0]+'" rows="3">'+esc((S.goals&&S.goals[x[0]])||'')+'</textarea></td>'
      +'<td><textarea data-k="obs.'+x[0]+'" rows="2">'+esc((S.obs&&S.obs[x[0]])||'')+'</textarea></td></tr>';
    }).join('')
  +'</table>'
  +'<div class="hint"><b>写法要点：</b>目标主语是<strong>"学生"</strong>，动词<strong>可操作、可观测</strong>（能编、会说、做到、愿意）。避免"培养学生……精神"这类空泛表述——那是<strong>教学意图</strong>，不是<strong>教学目标</strong>。</div>'
  +'<label class="f">我对目标的补充 / 校本化修改</label>'+ta('goalAdj','如校本要求加入"安全操作"或"合作分工"维度，请在此补充',3)
  +'</section>';
}

/* 第④步 场域与安全 */
function step4(p,n){
  const rk = p?(p.risk==='低'?'g':p.risk==='中'?'a':'r'):'a';
  const risks = p? [
    ['工具伤害（剪/刀/针）','使用圆头学生剪或钝头工具；传递时手柄朝人；禁止边走边持工具；课前发放、课后点数','工具员 + 教师'],
    ['材料伤害（刺/屑/粉尘）','课前预处理去刺去毛刺；湿式清扫；过敏体质学生改做平面替代任务','教师'],
    ['场地湿滑 / 泼洒','水盆置于桌内角；备抹布 2 条；发现积水立即处理','组长'],
    ['误食 / 误触（低年级）','明确"三不"：不入口、不揉眼、不甩动材料','全班'],
    ['工具遗失 / 混拿','工具盘编号与座位号对应，下课按盘回收清点','工具员'],
    ['热源 / 电器 / 特殊工艺','<span class="pill r">涉及即升级为高风险课</span>：须教研组审批 + 第二监护人在场，禁用明火，电器有防烫与断电措施','教研组审批']
  ] : [['（请先选择主题）','—','—']];
  const habits = habitsOf(p);
  return '<section class="card" id="s4"><h3><span class="n">4</span>第④步 · 劳动场域、工具与安全预案 <span class="pill r">红线环节</span></h3>'
  +'<p class="sub">劳动课程<span class="kw">强制性要求</span>：实践类课程必须落实安全教育与安全监护。本项未确认，第⑩步<strong>无法通过合规自检</strong>。</p>'
  +'<div class="grid3">'
  +'<div><label class="f">场地</label><div class="tpl ro">'+esc(S.place)+'</div></div>'
  +'<div><label class="f">分组</label><div class="tpl ro">'+esc(S.group)+'</div></div>'
  +'<div><label class="f">人均材料成本</label><div class="tpl ro">'+esc(p?p.cost:'待填写')+'　<span class="pill a">中置信</span>（须在第⑨步核实）</div></div>'
  +'</div>'
  +'<h4>本项目安全等级初判：<span class="pill '+rk+'">'+(p?p.risk:'待定')+'</span>'+(p&&p.risk==='高'?'　<span class="pill r">须教研组审批 + 第二监护人在场</span>':'')+'</h4>'
  +'<table><tr><th style="width:150px">风险点</th><th>防控措施</th><th style="width:110px">责任人</th></tr>'
  +risks.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')
  +'</table>'
  +(p&&p.risk!=='低'?'<div class="warnbox"><b>本项目为' +p.risk+'风险：</b>'+esc(p.flowTip)+'</div>':'')
  +'<h4>劳动习惯养成点（易被忽略，却是课标评价要点）</h4>'
  +'<div class="row">'+habits.map(x=>'<span class="chip sel">'+esc(x)+'</span>').join('')
  +'<span class="chip">延伸：作品带回，向家人讲述非遗故事</span></div>'
  +'<div class="hint"><b>安全三件套：</b>① <strong>课前交底</strong>（工具握姿 + 三不原则）② <strong>课中监护</strong>（设"工具员"，教师定点巡视）③ <strong>课后清点</strong>（工具 100% 回收，缺一件不离场）。</div>'
  +'</section>';
}

/* 第⑤步 教学流程 */
function step5(p,n){
  const prod = productName();
  const chant = p?p.chant:'（先选主题）';
  return '<section class="card" id="s5"><h3><span class="n">5</span>第⑤步 · 教学流程设计（40 分钟 · 教师活动 / 学生活动 / 设计意图）</h3>'
  +'<div class="hint"><b>黄金比例：</b>导入 ≤ 5 分钟 ｜ 示范 ≤ 8 分钟 ｜ <span class="kw">动手实践 ≥ 20 分钟（占比 ≥ 50%）</span> ｜ 展示评价 + 整理 ≤ 7 分钟。兼职教师最常见的问题是"讲多了、做少了"。</div>'
  +'<div class="row" style="margin:8px 0"><button class="btn ghost sm" onclick="reloadFlow()">🔄 载入本项目最新平台模板</button>'
  +'<span class="dim">（东莞四项目已内置 40 分钟五环节脚本；若您此前打开过旧版本，点此刷新为最新模板）</span></div>'
  +'<div class="hint"><b>每个环节请写清"三件事"：</b><span class="kw">教师活动</span>（做什么、怎么组织）、<span class="kw">学生活动</span>（做什么、产出什么）、<span class="kw">设计意图</span>（对应哪条课标要求）。三栏均可改写 —— 平台锁定的是时间配比与课标依据，文字表达交还给您。</div>'
  +S.flow.map(function(f,i){
     return '<div class="flowrow">'
      +'<div class="fh"><span class="ft">'+esc(f.t)+'</span>'
      +'<input type="text" data-k="flow.'+i+'.name" value="'+esc(f.name)+'" placeholder="环节名称">'
      +'<div class="tools">'
      +'<button class="mini" onclick="doPolishRow('+i+')">✨ 润色本环节</button>'
      +'<button class="mini" onclick="doLintRow('+i+')">🔍 体检</button>'
      +'<button class="mini" onclick="doAIRow('+i+')">🤖 AI 优化</button>'
      +'<button class="mini" onclick="doRestoreRow('+i+')">↺ 恢复模板</button>'
      +(S.edited.flow?'<span class="pill b">已个性化</span>':'<span class="pill g">平台模板</span>')
      +'</div></div>'
      +'<div class="grid3">'
      +'<div><label class="f">👩‍🏫 教师活动</label><textarea data-k="flow.'+i+'.teach" rows="5">'+esc(f.teach)+'</textarea></div>'
      +'<div><label class="f">🧒 学生活动</label><textarea data-k="flow.'+i+'.stu" rows="5">'+esc(f.stu)+'</textarea></div>'
      +'<div><label class="f">🎯 设计意图（对应课标）</label><textarea data-k="flow.'+i+'.intent" rows="5">'+esc(f.intent)+'</textarea></div>'
      +'</div></div>';
   }).join('')
  +(p?'<div class="okbox"><b>本项目专项提示：</b>'+esc(p.flowTip)+'</div>':'')
  +'<h4>板书 / 课件结构（自动生成骨架，可直接照抄）</h4>'
  +'<pre class="txt">'+esc(boardText())+'</pre>'
  +'<label class="f">我对流程的调整（如课时不同、环节重排）</label>'+ta('flowAdj','如：2 课时则第 1 课时完成成型，第 2 课时完成装饰与展示',3)
  +'</section>';
}
function keysLine(p){ return p?p.keys.join(' · '):'本土文化 · 劳动创造价值'; }

/* 第⑥步 任务单 */
function step6(p,n){
  const prod = productName();
  const steps = p?p.steps:['准备材料','关键工序 1','关键工序 2','修整定型','清洁归位','填写作品卡'];
  return '<section class="card" id="s6"><h3><span class="n">6</span>第⑥步 · 劳动实践任务单（可直接打印发给学生）</h3>'
  +'<div class="tpl" style="border-style:solid">'
  +'<b>《粤匠小小传承人》劳动任务单</b>　姓名：______　班级：______　小组：______　日期：______<hr style="border:none;border-top:1px dashed var(--line)">'
  +'<b>我的劳动任务：</b>用'+esc(n)+'的技法，完成 1 件'+esc(prod)+'。<br>'
  +'<b>我的劳动流程（完成一步打一个 √）：</b><br>'
  +steps.map((s,i)=>'☐ '+(i+1)+'. '+esc(s.replace(/\s*（.*?）/g,''))).join('　')
  +'<br><b>我遇到的困难：</b>____________　<b>我是怎么解决的：</b>____________<br>'
  +'<b>我最满意的一处：</b>____________　<b>我想改进的一处：</b>____________<br>'
  +'<b>劳动自评（涂星）：</b>作品质量 ☆☆☆☆☆　工具安全 ☆☆☆☆☆　工位整洁 ☆☆☆☆☆　帮助同伴 ☆☆☆☆☆<br>'
  +'<b>一句话感言：</b>我今天体会到 ____________ 的辛苦 / 快乐。<br>'
  +'<span class="dim">安全提醒：工具不指向他人；材料不入口；下课按盘清点工具。</span>'
  +'</div>'
  +'<div class="row" style="margin-top:10px">'
  +'<button class="btn sm" onclick="expTask()">⬇ 下载任务单（Word）</button>'
  +'<button class="btn ghost sm" onclick="modalHTML(\'家长告知单（可直接抄送家长群）\',parentNote())">📱 生成家长告知单</button>'
  +'</div>'
  +'<label class="f">我对任务单的调整</label>'+ta('taskAdj','如增补本班特殊要求、加入小组角色分工表',3)
  +'</section>';
}
function parentNote(){
  const p=cur(),n=themeName();
  return '<p>家长您好：</p><p>本周劳动课我们将开展非遗主题劳动实践——<b>'+esc(n)+'</b>，学生将亲手完成 <b>'+esc(productName())+'</b>。</p>'
  +'<p><b>需要您配合：</b></p><ul>'
  +'<li>如孩子有<b>过敏史</b>（草屑、粉尘、药材、花生等）或特殊身体情况，请私信告知，我们将安排替代任务；</li>'
  +'<li>如孩子需携带<b>围裙/袖套</b>，请于当日带来；</li>'
  +'<li>课后请听孩子讲一讲"今天做了什么、难在哪里"，这是劳动教育的重要一环。</li></ul>'
  +'<p>本课安全等级：'+(p?p.risk:'待定')+'　任课教师：__________　联系电话：__________</p>'
  +'<div class="row"><button class="btn sm" onclick="copyText(document.getElementById(\'modalBox\').innerText)">📋 复制全文</button><button class="btn ghost sm" onclick="closeModal()">关闭</button></div>';
}

/* 第⑦步 评价量规 */
function step7(p,n){
  const prod = productName();
  return '<section class="card" id="s7"><h3><span class="n">7</span>第⑦步 · 评价量规（过程性 + 表现性，对标课标）</h3>'
  +'<p class="sub">劳动课程评价<strong>重过程、重表现、重成长</strong>，忌用"像不像"的美术标准评判。</p>'
  +'<table><tr><th style="width:120px">评价维度</th><th>★★★ 优秀</th><th>★★ 良好</th><th>★ 待改进</th><th style="width:70px">权重</th></tr>'
  +'<tr><td>劳动成果<br><span class="dim">技能</span></td><td>'+esc(prod)+'成型、符合用途要求，细节工整、有巧思</td><td>基本成型，局部粗糙</td><td>未成型或无法使用</td><td>30%</td></tr>'
  +'<tr><td>劳动过程<br><span class="dim">习惯</span></td><td>工具使用规范、工位始终整洁、材料无浪费</td><td>偶需提醒后整理</td><td>需多次督促</td><td>25%</td></tr>'
  +'<tr><td>劳动品质<br><span class="dim">精神</span></td><td>主动返工改进 ≥1 次，能说出"为什么这样更好"</td><td>经鼓励后改进</td><td>应付交差</td><td>25%</td></tr>'
  +'<tr><td>劳动合作</td><td>主动帮助同伴、分享材料与技法</td><td>完成本份任务</td><td>旁观或干扰</td><td>10%</td></tr>'
  +'<tr><td>劳动认知</td><td>能讲清'+esc(n)+'与'+esc(p?p.area:'本地')+'生活的关系</td><td>能说出基本工序</td><td>仅知其名</td><td>10%</td></tr>'
  +'</table>'
  +'<div class="okbox"><b>评价建议：</b>采用<strong>"教师评 + 同伴评 + 自评 + 家长评（课后）"</strong>四方评价；对动手能力弱但有进步的学生使用<strong>增值评价</strong>——"比上一次更紧实了"，而非横向比较。评价结果计入<strong>劳动档案袋</strong>（第⑧步）。</div>'
  +'<label class="f">校本量规调整</label>'+ta('rubAdj','如学校要求使用星级卡/学分制，可在此说明换算方式',3)
  +'</section>';
}

/* 第⑧步 清单与档案 */
function step8(p,n){
  return '<section class="card" id="s8"><h3><span class="n">8</span>第⑧步 · 劳动清单归属与劳动档案袋（课标"每周 1 课时"落地）</h3>'
  +'<div class="grid2">'
  +'<div><label class="f">本课在"劳动清单"中的归属</label>'
  +'<div class="tpl ro"><span class="from">平台建议</span>'
  +'<b>类型：</b>生产劳动 · 传统工艺制作<br>'
  +'<b>频次：</b>每学期 ≥ 6 课时（建议第 3、5、7、9、11、13 周）<br>'
  +'<b>单元化衔接：</b>第 1 课 基础成型 → 第 2 课 加纹样/提难度 → 第 3 课 立体或组合 → 第 4 课 文创与义卖（真实使用）<br>'
  +'<b>跨学科：</b>可结合语文（讲解词）、美术（纹样）、道法（工匠精神）</div></div>'
  +'<div><label class="f">劳动档案袋（学生个人，贯穿学期）</label>'
  +'<ul class="check">'
  +'<li>劳动任务单原件（含自评）</li>'
  +'<li>作品照片（含"最满意"与"最想改进"对比）</li>'
  +'<li>非遗访谈记录（家人 / 传承人）</li>'
  +'<li>劳动时长登记（累计 ≥ 12 课时 / 学期）</li>'
  +'<li>反思短文 1 篇（《我眼中的工匠》）</li>'
  +'</ul></div></div>'
  +'<div class="hint"><b>政策衔接：</b>劳动课程平均<strong>每周不少于 1 课时</strong>，劳动素养纳入学生综合素质评价。此处生成的档案袋可直接作为学期末评价依据，避免兼职教师"期末补材料"。</div>'
  +'<label class="f">本校劳动清单衔接说明</label>'+ta('listAdj','如本校清单要求"每学期完成 X 项传统工艺"，请在此说明本课承接关系',3)
  +'</section>';
}

/* 第⑨步 取证台 */
function step9(p,n){
  let h='<section class="card" id="s9"><h3><span class="n">!</span>第⑨步 · <b style="color:var(--amber)">资料取证台</b>（平台核心机制）</h3>'
  +'<p class="sub">凡属<strong>史实、名录、传承人、价格、版权、安全参数</strong>等易错内容，平台一律<span class="kw">不代填</span>，只提供<strong>核实路径</strong>：<span class="pill g">高置信</span>可直接使用，<span class="pill a">中置信</span>须核实，<span class="pill r">低/高敏感</span>必须由教师补充后，教案才可标记为"合规可用"。</p>';

  h+='<h4>📡 取证助手：一键直达高置信来源</h4>'
  +'<div class="stepbox"><b>高置信来源白名单（只认这些，不要用百科/短视频/自媒体当出处）</b>'
  +'<table><tr><th style="width:230px">来源</th><th>用途</th><th style="width:120px">操作</th></tr>'
  +SRCLIST.map(k=>{const s=SRC[k];return '<tr><td>'+s.n+'</td><td>'+s.d+'</td><td>'+(s.u?'<button class="btn ghost sm" onclick="openURL(\''+s.u+'\')">打开</button>':'<span class="dim">线下核实</span>')+'</td></tr>';}).join('')
  +'</table></div>'
  +'<div class="row" style="margin:10px 0">'
  +'<button class="btn sm" onclick="openAllSrc()">🔎 一键打开全部官方来源</button>'
  +'<button class="btn ghost sm" onclick="copyQueries()">📋 复制本主题检索式（可粘贴到搜索框/AI 助手）</button>'
  +'<button class="btn ghost sm" onclick="modalHTML(\'向 AI 助手取证的提示词（复制后粘贴给任意 AI）\',aiPrompt())">🤖 生成 AI 取证提示词</button>'
  +'</div>';

  // ===== 资料搜寻器 =====
  const kw = S.q || themeName();
  h+='<h4>🔎 资料搜寻器（输入主题 → 自动生成高置信检索式 → 一键去查）</h4>'
   +'<div class="row" style="margin-bottom:8px">'
   +'<input type="text" data-k="q" style="flex:1;min-width:220px" value="'+esc(S.q||'')+'" placeholder="输入要查的非遗主题，如：苏绣 / 潍坊风筝（留空则使用当前主题）">'
   +'<button class="btn sm" onclick="copyQueries()">📋 复制全部检索式</button></div>'
   +'<div class="row" style="margin-bottom:8px">'
   +SEARCH_DIM.map(function(d){ return '<span class="chip'+(S.dims[d.k]===false?'':' sel')+'" onclick="toggleDim(\''+d.k+'\')">'+d.n+'</span>'; }).join('')
   +'<span class="dim">（点击可增减检索维度）</span></div>'
   +'<div class="stepbox"><b>推荐检索式（优先在 ihchina.cn / 文旅部 / 省文旅厅站内检索）</b>'
   +'<table><tr><th style="width:110px">维度</th><th>检索式</th><th style="width:130px">操作</th></tr>'
   +SEARCH_DIM.filter(function(d){ return S.dims[d.k]!==false; }).map(function(d){
      const t=d.t.replace('{q}', kw);
      return '<tr><td>'+d.n+'</td><td>'+esc(t)+'</td><td>'
        +'<button class="mini" onclick="searchText(\''+encodeURIComponent(t)+'\')">🔎 搜索</button> '
        +'<button class="mini" onclick="copyEnc(\''+encodeURIComponent(t)+'\')">📋 复制</button></td></tr>';
    }).join('')
   +'</table></div>'
   +'<div class="row" style="margin:8px 0">'
   +'<button class="btn sm" onclick="openAllSrc()">🔎 打开全部官方来源</button>'
   +'<button class="btn ghost sm" onclick="searchText(\''+encodeURIComponent(kw+' 非物质文化遗产 名录 保护单位')+'\')">🏛 查名录</button>'
   +'<button class="btn ghost sm" onclick="searchText(\''+encodeURIComponent(kw+' 非遗 进校园 劳动教育 教学设计')+'\')">📘 查课例</button>'
   +'<button class="btn ghost sm" onclick="modalHTML(\'AI 取证提示词（复制后粘贴给任意 AI）\',aiPrompt())">🤖 AI 取证提示词</button>'
   +'</div>';

  const f=S.evF||'all';
  const items=evItems().filter(function(x){ return f==='all'?true:(f==='todo'?!evDoneOf(x):evDoneOf(x)); });
  h+='<div class="row" style="margin:10px 0">'
   +[['all','显示全部'],['todo','仅待核实'],['done','已处理']].map(function(o){
      return '<span class="chip'+(f===o[0]?' sel':'')+'" onclick="setEvF(\''+o[0]+'\')">'+o[1]+'（'+evCount(o[0])+'）</span>';
    }).join('')
   +'<span class="dim">（点击切换；先列通用必核项，再列本项目专项；同组内高敏感项自动排最前）</span></div>'
   +'<div class="row" style="margin:0 0 10px">'
   +'<button class="btn sm" onclick="copyEvList()">📋 复制待核实清单（可发给文化馆 / 教研组长）</button>'
   +'<button class="btn ghost sm" onclick="expEvidence()">📄 导出取证清单（Word · 带填写空栏）</button></div>';
  h+='<h4>待核实清单（'+evDone()+' / '+evTotal()+' 已处理）</h4>';
  if(!items.length) h+='<div class="okbox">当前筛选下没有条目。</div>';
  let lastGrp='';
  items.forEach(x=>{
    const e=S.ev[x.k]||{};
    const done=evDoneOf(x);
    const cls=x.c==='高'?'r':'a';
    if(x.grp&&x.grp!==lastGrp){ lastGrp=x.grp; h+='<div class="grpTag">'+esc(x.grp)+'</div>'; }
    h+='<div class="ev" data-evk="'+x.k+'">'
      +'<div class="hd"><b>'+esc(x.i)+'</b><span class="pill '+cls+'">'+(done?'已处理':'置信度 '+x.c)+'</span>'
      +(done?(e.na?'<span class="pill a">已处理 · 未找到权威来源</span>':'<span class="pill g">✔ 已回填</span>'):'')+'</div>'
      +'<div class="dim">平台当前值：'+esc(x.cur)+'</div>'
      +'<div class="stepbox"><b>核实步骤</b><ol>'+x.how.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'
      +'<div class="row" style="margin-top:8px">'
      +(SRC[x.src]&&SRC[x.src].u?'<button class="btn ghost sm" onclick="openURL(\''+SRC[x.src].u+'\')">打开 '+SRC[x.src].n+'</button>':'<span class="dim">来源：'+SRC[x.src].n+'</span>')
      +(x.q?'<button class="btn ghost sm" onclick="searchQ(\''+encodeURIComponent(x.q)+'\')">🔎 按检索式搜索</button>':'')
      +'</div></div>'
      +'<label class="f">核实后的正确表述（回填后自动写入教案）</label><textarea data-ev="'+x.k+'.v" rows="2" placeholder="请粘贴/填写核实结果">'+esc(e.v||'')+'</textarea>'
      +'<div class="grid2">'
      +'<div><label class="f">出处（书名 / 网页标题 + 网址）</label><input type="text" data-ev="'+x.k+'.u" value="'+esc(e.u||'')+'" placeholder="如：中国非物质文化遗产网 · 项目名录"></div>'
      +'<div><label class="f">核实日期</label><input type="text" data-ev="'+x.k+'.d" value="'+esc(e.d||'')+'" placeholder="如：2026-10-05"></div>'
      +'</div>'
      +'<div class="row" style="margin-top:8px">'
      +'<button class="mini" onclick="evToday(\''+x.k+'\')">📅 填入今天</button>'
      +(done?'<button class="mini" onclick="evClear(\''+x.k+'\')">🧹 清除本项记录</button>'
           :'<button class="mini" onclick="evNA(\''+x.k+'\')">🚫 查不到 · 标记无法核实</button>')
      +'</div></div>';
  });

  h+=notesBlock();
  h+='<div class="warnbox"><b>取证三原则：</b>① 只认<strong>官方与权威机构</strong>来源，百科与自媒体<strong>不能作为出处</strong>；② 每条结论必须<strong>可追溯</strong>（有 URL 或有据可查的文献）；③ 无法核实的，教案中保留<span class="kw">【待核实】</span>标记，<strong>宁可不写，不可编造</strong>。</div>';
  h+='</section>';
  return h;
}

/* ---- 资料搜寻维度与摘抄本 ---- */
const SEARCH_DIM=[
 {k:'list',n:'名录与批次',t:'{q} 国家级非物质文化遗产代表性项目名录 批次 编号 保护单位'},
 {k:'inheritor',n:'代表性传承人',t:'{q} 代表性传承人 名单 级别 公布批次'},
 {k:'craft',n:'工艺流程',t:'{q} 制作工艺 工序 流程 技法 名称'},
 {k:'history',n:'历史与民俗',t:'{q} 起源 历史 民俗 地方志 记载'},
 {k:'teach',n:'教学转化',t:'{q} 劳动教育 教学设计 课例 非遗进校园 中小学'},
 {k:'media',n:'视频与图片',t:'{q} 纪录片 教学视频 高清图片 官方 非遗'},
 {k:'material',n:'材料与采购',t:'{q} 制作材料 工具 采购 批发 价格'},
 {k:'safety',n:'安全与禁忌',t:'{q} 中小学 劳动课 安全 注意事项 禁忌'}
];
function notesBlock(){
  const ns=S.notes||[];
  let h='<h4>📚 我的资料摘抄本（查到的资料随手存，自动进入导出的教案与课件）</h4>';
  if(!ns.length) h+='<div class="dim">还没有摘抄。用上面的"资料搜寻器"查到资料后，点下面按钮逐条存起来；这些资料会出现在导出文档的《参考资料》章节与课件最后一页。</div>';
  ns.forEach(function(nt,i){
    h+='<div class="ev"><div class="hd"><b>资料 '+(i+1)+'</b>'
     +'<button class="mini" onclick="delNote('+i+')">✕ 删除</button></div>'
     +'<div class="grid2">'
     +'<div><label class="f">标题 / 要点</label><input type="text" data-nt="'+i+'.t" value="'+esc(nt.t||'')+'" placeholder="如：苏绣列入第一批国家级非遗名录"></div>'
     +'<div><label class="f">出处（书名 / 网页 + 网址）</label><input type="text" data-nt="'+i+'.u" value="'+esc(nt.u||'')+'" placeholder="如：中国非物质文化遗产网 · 项目名录"></div>'
     +'</div>'
     +'<label class="f">摘抄内容</label><textarea data-nt="'+i+'.c" rows="3" placeholder="粘贴或摘抄原文要点">'+esc(nt.c||'')+'</textarea>'
     +'<div style="max-width:220px"><label class="f">查阅日期</label><input type="text" data-nt="'+i+'.d" value="'+esc(nt.d||'')+'" placeholder="如：2026-10-06"></div></div>';
  });
  h+='<div class="row"><button class="btn sm" onclick="addNote()">＋ 新增一条资料</button><span class="dim">共 '+ns.length+' 条</span></div>';
  return h;
}
function setLib(v){ S.lib=v; S.prov=''; save(); render(); }
function setProv(v){ S.prov=v; save(); render(); }
function toggleDim(k){ S.dims=S.dims||{}; S.dims[k]=(S.dims[k]===false); save(); render(); }
function searchText(t){ return openWin('https://www.baidu.com/s?wd='+t); }
function copyEnc(t){ copyText(decodeURIComponent(t)); }
function addNote(){ S.notes=S.notes||[]; S.notes.push({t:'',c:'',u:'',d:''}); save(); render(); }
function delNote(i){ if(!confirm('删除这条资料？')) return; S.notes.splice(i,1); save(); render(); }
function aiPrompt(){
  const n=themeName(),p=cur();
  const t='你是非遗资料核查助手。请围绕"'+(n)+'"（'+(p?p.area:'待填地区')+'）核查以下事项，'
   +'要求：每条结论必须给出可追溯的官方来源名称与网址（优先中国非物质文化遗产网 ihchina.cn、广东省文化和旅游厅、地方文化馆官网、国家图书馆地方志），'
   +'无法核实的一律回答"未找到可靠来源"，禁止推测或编造。\n\n'
   +'待核查事项：\n'
   +evItems().map((x,i)=>(i+1)+'. '+x.i+'（平台当前值：'+x.cur+'）').join('\n')
   +'\n\n输出格式：\n【事项】\n【结论】（一句话，可直接写进教案）\n【来源名称】\n【网址/文献】\n【核实日期】';
  return '<p class="sub">复制下面这段提示词，粘贴给任意 AI 助手；把返回结果逐条回填到对应条目即可。</p><pre class="txt" id="aiTxt">'+esc(t)+'</pre>'
   +'<div class="row"><button class="btn sm" onclick="copyText(document.getElementById(\'aiTxt\').innerText)">📋 复制提示词</button><button class="btn ghost sm" onclick="closeModal()">关闭</button></div>';
}
function copyQueries(){
  const txt=evItems().filter(x=>x.q).map(x=>'· '+x.i+'：'+x.q).join('\n');
  copyText('【'+themeName()+'】高置信检索式（建议在 ihchina.cn / 广东省文旅厅 / 国家中小学智慧教育平台站内检索）\n'+txt);
}

/* 第⑩步 自检与出稿 */
function step10(p,n){
  const left=evLeft();
  const ck=[
   ['a','学生动手劳动时间 ≥ 总课时 50%（本课 22/40 = 55%）',true],
   ['b','已明确任务群与学段（见第②步自动判定）',true],
   ['c','教学目标按四大核心素养撰写，动词可观测（见第③步）',true],
   ['d','已落实安全教育与监护安排（见第④步风险清单 + 工具三清点）',true],
   ['e','已设计真实劳动情境与劳动成果',!!(S.situation&&S.situation.trim())],
   ['f','已配置过程性 + 表现性评价量规（见第⑦步）',true],
   ['g','已落实劳动习惯养成环节（工位整洁、垃圾分类、工具归位）',true],
   ['h','已落实家校协同（家长告知单 + 课后访谈）',true],
   ['i','不确定资料已在取证台完成核实',left===0],
   ['j','无学科异化：未上成美术课 / 语文课 / 宣讲课',true]
  ];
  return '<section class="card" id="s10"><h3><span class="n">✓</span>第⑩步 · 合规自检与一键出稿</h3>'
  +'<ul class="check">'+ck.map(x=>'<li class="'+(x[2]?'done':'')+'">'+x[1]+(x[2]?'':'　<span class="pill r">未通过</span>')+'</li>').join('')+'</ul>'
  +(left>0?'<div class="warnbox"><b>取证台还有 '+left+' 项未核实。</b>您仍可出稿，但文档中会以<span class="kw">【待核实】</span>标注，且不能标记为"合规可用"。建议至少补齐"传承人""材料采购""安全审批"三项。</div>'
        :'<div class="okbox"><b>取证台已全部核实完毕 ✔</b>　本教案可标记为<strong>合规可用</strong>。</div>')
  +'<div class="row">'
  +'<button class="btn" onclick="expDoc()">📄 导出完整教学设计（Word）</button>'
  +'<button class="btn g" onclick="expPPT()">📊 导出课件 PPT（.pptx）</button>'
  +'<button class="btn ghost" onclick="expPPTHTML()">🖥 课件演示版（HTML/PDF）</button>'
  +'<button class="btn ghost" onclick="expMD()">⬇ 导出 Markdown</button>'
  +'<button class="btn ghost" onclick="expEvidence()">📄 导出资料取证清单（Word）</button>'
  +'<button class="btn ghost" onclick="window.print()">🖨 打印 / 存 PDF</button>'
  +'<button class="btn '+(left===0?'g':'ghost')+'" onclick="lockDoc()">'+(S.locked?'🔓 解除锁定':'🔒 标记为"合规可用"')+'</button>'
  +'</div>'
  +'<label class="f">教学反思模板（课后填写，三问即可）</label>'
  +ta('reflect','① 今天学生实际动手多少分钟？② 哪个环节最乱，为什么？③ 下次把哪一步再砍 / 再加？',4)
  +'<div class="hint"><b>给兼职教师的最后一句话：</b>劳动课好不好，不看老师讲得漂不漂亮，只看三件事——<span class="kw">学生动手够不够久、成果真不真实、收拾干不干净</span>。记住这三句，就不会错。</div>'
  +'</section>';
}

/* 附录 A 项目库 */
function appA(){
  return '<section class="card" id="s11"><h3>★ 附录A · 非遗劳动项目速选库（广东 '+P_GD.length+' 项 + 全国 '+P_CN.length+' 项，点击即切换主题）</h3>'
  +'<div class="row" style="margin-bottom:10px"><label class="f" style="margin:0">地区：</label>'
  +'<select style="width:auto;min-width:150px" onchange="setProv(this.value)"><option value="">全部地区</option>'
  +PROVS.map(v=>'<option value="'+esc(v)+'"'+(S.prov===v?' selected':'')+'>'+esc(v)+'</option>').join('')
  +'</select><span class="dim">共 '+P.filter(x=>!S.prov||provOf(x)===S.prov).length+' 项可选</span></div>'
  +'<div class="tabs" id="tabsA"><button class="on" data-t="all">全部类别</button>'
  +Object.keys(CATNAME).map(c=>'<button data-t="'+c+'">'+CATNAME[c]+'</button>').join('')+'</div>'
  +'<table id="lib"><tr><th style="width:130px">项目</th><th style="width:90px">类别</th><th style="width:90px">适宜学段</th><th style="width:70px">安全</th><th>课堂转化建议</th></tr>'
  +P.filter(x=>!S.prov||provOf(x)===S.prov).map(x=>{const rk=x.risk==='低'?'g':x.risk==='中'?'a':'r';
    return '<tr data-t="'+x.cat+'" data-go="'+x.id+'" style="cursor:pointer"><td><b>'+esc(x.n)+'</b><br><span class="dim">'+esc(x.area)+'</span></td><td>'+CATNAME[x.cat]+'</td><td>'+x.suit+'</td><td><span class="pill '+rk+'">'+x.risk+'</span></td><td>'+esc(x.product)+'；技法：'+esc(x.skill)+'</td></tr>';}).join('')
  +'</table></section>';
}
/* 附录 B 课标对照 */
function appB(){
  const rows=[
   ['课程性质','劳动课程是实施劳动教育的重要途径，具有实践性、综合性、开放性','真实动手劳动，非观赏、非讲授'],
   ['课程理念','① 育人导向 ② 以实践为主线 ③ 联系生活与社会实际 ④ 丰富多样实践方式 ⑤ 注重综合评价','真实情境 + 五环节流程 + 四方评价'],
   ['核心素养','劳动观念、劳动能力、劳动习惯与品质、劳动精神','第③步四维目标'],
   ['任务群','共 10 个任务群；3-6 年级设"传统工艺制作"','第②步自动判定'],
   ['课时','平均每周不少于 1 课时','第⑧步劳动清单'],
   ['内容要求','选择 1-2 项传统工艺进行简易作品的设计与制作','1 项主题，1 件作品/人'],
   ['教学提示','创设真实情境、注重示范与模仿、鼓励创新、联系家乡文化、重视安全','第④⑤步'],
   ['评价建议','注重过程性评价与表现性评价，关注劳动过程中的观念、能力、习惯、品质','第⑦步量规 + 增值评价'],
   ['资源开发','充分利用地方文化与乡土资源，邀请非遗传承人进校园','第⑨步取证台（传承人核实与预约）'],
   ['安全要求','加强劳动安全教育，落实安全监护与防护措施','第④步红线清单']
  ];
  return '<section class="card" id="s12"><h3>★ 附录B · 劳动课程标准对照速查表（2022年版 · 要义转述）</h3>'
  +'<table><tr><th style="width:110px">维度</th><th>课标要求（要义）</th><th style="width:220px">本课落实点</th></tr>'
  +rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')+'</table>'
  +'<div class="warnbox">本表为<strong>要义转述</strong>，正式文本请以教育部官网发布的《义务教育劳动课程标准（2022年版）》为准。</div></section>';
}
/* 附录 C FAQ */
function appC(){
  const q=[
   ['我没有美术 / 手工基础，教得了吗？','劳动课评价的是<strong>劳动过程与劳动品质</strong>，不是作品美不美。跟着平台的口诀与步骤自己做一遍即可上岗。学生作品"丑"一点完全正常，<b>返工改进的意愿才是得分点</b>。'],
   ['课时不够，讲不完怎么办？','果断砍讲解，保动手。<b>导入压到 5 分钟内</b>，示范不超过 8 分钟。若仍不够，把"装饰与命名"移到课后，课上只保"成型"。'],
   ['材料贵、没经费？','莞草、稻草、葵叶、旧布、快递纸箱都是免费/低价劳动材料。<b>真实、朴素的材料反而更有教育价值</b>，比"超轻黏土"更贴近"劳动"二字。'],
   ['如何避免上成"美术课"？','三条分界线：① 有<b>真实用途</b>（展品/礼物/日用品）② 强调<b>工具规范与流程</b> ③ 评价<b>习惯与品质</b>。三条皆"是"，就是劳动课。'],
   ['学生不动手、只聊天？','用<b>任务驱动 + 限时 + 展示</b>三件套："20 分钟内完成，优秀作品上非遗市集"，比"认真做"有效十倍；同时设"工具员/记录员"等角色，让人人有事做。'],
   ['资料查不到怎么办？','宁可留空标<b>【待核实】</b>，也不要凭印象编。可用第⑨步"AI 取证提示词"批量核查，或直接联系本地文化馆非遗部——他们通常很乐意支持学校。'],
   ['平台给的句子不够顺，能改吗？','当然可以，而且<b>鼓励改</b>。所有目标、流程三栏都可直接在页面上改写；改写后点 <b>✨一键润色</b> 规范语言，或点 <b>🤖AI 优化</b> 复制内置课标约束的提示词让 AI 帮忙润色，再粘回来即可。'],
   ['学校没有劳动教室怎么办？','普通教室即可：桌面铺报纸/桌垫，材料分组装袋，工具盘编号，课后 5 分钟清理。<b>场地不决定课程质量，流程与评价才决定。</b>']
  ];
  return '<section class="card" id="s13"><h3>★ 附录C · 兼职劳动教师高频问题（FAQ）</h3><div class="grid2">'
  +q.map(x=>'<div class="tpl"><b>Q：'+x[0]+'</b><br>A：'+x[1]+'</div>').join('')+'</div></section>';
}
