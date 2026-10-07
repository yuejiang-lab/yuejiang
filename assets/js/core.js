/* ============================================================
 * core.js —— 状态与生成引擎
 * 状态读写 / 四维目标与五环节流程生成 / 润色与表达体检 / 编辑工具条 / 取证条目
 * 依赖：data.js
 * ============================================================ */

/* ============ 三、状态 ============ */
const KEY='yuejiang_plan_v1';
let S = {
  proj:'guancao', custom:'', customCat:'编',
  grade:'2', period:'1', bg:'其他学科兼职', klass:'', place:'普通教室（小组桌）', group:'4 人一组，设"工具员"1 名',
  title:'', situation:'', product:'',
  xueqing:'', zhongnan:'', goalAdj:'',
  flowAdj:'', taskAdj:'', rubAdj:'',
  listAdj:'', reflect:'',
  ev:{}, checks:{}, locked:false,
  // —— 可个性化编辑区 ——
  goals:null,   // {v,a,h,s} 四维教学目标
  obs:null,     // {v,a,h,s} 可观测行为
  flow:null,    // [{t,name,teach,stu,intent}] 五环节
  edited:{goals:false,flow:false},  // 教师是否已个性化改写
  genSig:'',    // 生成签名，主题/学段变化时只刷新未改写的区块
  // —— 资料搜寻与摘抄 ——
  lib:'gd', prov:'', q:'', dims:{}, notes:[]
};
function load(){try{const r=localStorage.getItem(KEY); if(r) S=Object.assign(S,JSON.parse(r));}catch(e){}}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(S));
   const d=new Date(); const p=x=>String(x).padStart(2,'0');
   document.getElementById('saveTip').textContent='已自动保存 '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
  }catch(e){}
}
function cur(){ return P.find(p=>p.id===S.proj) || null; }
function themeName(){ return S.proj==='custom' ? (S.custom||'（未填写自定义主题）') : (cur()?cur().n:''); }
function productName(){ return S.product || (cur()?cur().product:'（待填写）'); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---- 路径读写：支持 'goals.v' / 'flow.0.teach' ---- */
function getP(k){ return String(k).split('.').reduce((o,p)=>(o==null?undefined:o[p]), S); }
function setP(k,v){
  const ps=String(k).split('.'); let o=S;
  for(let i=0;i<ps.length-1;i++){
    const nx=ps[i+1];
    if(typeof o[ps[i]]!=='object'||o[ps[i]]===null) o[ps[i]]=/^\d+$/.test(nx)?[]:{};
    o=o[ps[i]];
  }
  o[ps[ps.length-1]]=v;
}
function ta(k,ph,rows){ return '<textarea data-k="'+k+'" rows="'+(rows||3)+'" placeholder="'+esc(ph)+'">'+esc(getP(k)||'')+'</textarea>'; }
function tx(k,ph){ return '<input type="text" data-k="'+k+'" value="'+esc(getP(k)||'')+'" placeholder="'+esc(ph)+'">'; }

/* ---- 平台模板：四维教学目标（教师可改写） ---- */
function genGoalsAll(){
  const p=cur(), n=themeName(), prod=productName();
  const steps=p?p.steps:['准备材料','关键工序一','关键工序二','修整定型','清洁归位','填写作品卡'];
  const keys=p?p.keys:['本土文化认同','平凡劳动创造价值'];
  const flowTxt=steps.slice(0,5).map((s,i)=>(i+1)+'. '+s.replace(/\s*（.*?）/g,'')).join(' → ');
  return {
    goals:{
      v:'知道'+n+'是'+(p?p.area:'本地')+'人民'+keys[0]+'的劳动智慧，认同"平凡材料也能创造美"，尊重手工艺人的劳动。',
      a:'能安全、规范使用'+(p?p.tools:'常用工具')+'，按"'+flowTxt+'"流程，独立完成 1 件'+prod+'。',
      h:'做到工位整洁、材料节约、工具归位；在反复修正中养成耐心、专注、精益求精的品质。',
      s:'感受"择一事、终一生"的工匠精神，愿意为作品二次改进而非应付交差。'
    },
    obs:{
      v:'能说出 1 个"'+n+'与生活"的例子',
      a:'作品成型、符合要求',
      h:'下课前端面整理达标',
      s:'有 ≥1 次主动返工记录'
    }
  };
}

/* ---- 平台模板：五环节流程（教师活动 / 学生活动 / 设计意图） ---- */
function genFlow(){
  const p=cur();
  /* 项目自带"课堂流程脚本"（如东莞龙舟 / 莞香 / 莞草 / 千角灯）优先使用；返回副本，避免编辑时污染静态库 */
  if(p&&p.flow&&p.flow.length) return p.flow.map(function(f){ return {t:f.t,name:f.name,teach:f.teach,stu:f.stu,intent:f.intent}; });
  const n=themeName(), prod=productName();
  const sit=S.situation||(p?p.sit:'（请在第①步填写真实劳动情境）');
  const chant=p?p.chant:'（自编口诀）';
  const steps=p?p.steps:['准备材料','关键工序一','关键工序二','修整定型','清洁归位','填写作品卡'];
  const cl=s=>s.replace(/\s*（.*?）/g,'');
  return [
   {t:'0-5′',name:'情境导入·激趣与劳动观念',
    teach:'出示'+(p?p.area:'本地')+'的真实劳动照片或成品实物；提问"它是怎么来的、谁做的"；揭示课题并下达真实任务：'+sit+'。',
    stu:'观察实物与图片，回答提问，明确本节课要完成的劳动任务与成果用途。',
    intent:'创设真实劳动情境、激发劳动动机，落实课标教学提示①"加强与学生生活和社会实际的联系"，指向"劳动观念"素养。'},
   {t:'5-10′',name:'观摩与示范·突破技能难点',
    teach:'播放教学短片（≤3 分钟）；现场慢速示范'+(p?p.skill:'关键技法')+' 3 遍，边做边念口诀"'+chant+'"；交代工具规范与安全"三不"原则。',
    stu:'观看短片；跟随教师做手势模仿；复述口诀与工具使用要点，明确安全要求。',
    intent:'建立正确操作表象、突破技能难点，落实"劳动能力"；同步完成安全教育与监护交底（课标教学提示⑤）。'},
   {t:'10-32′',name:'劳动实践·核心 22 分钟（占 55%）',
    teach:'下达限时任务（每人完成 1 件'+prod+'）；巡视帮扶薄弱小组，记录"谁最先完成、谁反复拆、谁在帮同伴"；最后 2 分钟组织二次改进。',
    stu:'按 '+steps.map((s,i)=>(i+1)+'.'+cl(s)).join(' → ')+' 流程独立制作；遇困难先自查再求助；完成至少一次返工改进。',
    intent:'保证动手实践不少于课时 50%，落实课标教学提示②"以实践为主线、做中学"；在重复劳作中培养习惯品质与工匠精神。'},
   {t:'32-37′',name:'展示评价·成果与品质双评',
    teach:'组织"非遗小市集"组间互评，要求用三句话评价：①牢不牢/好不好用 ②好不好看 ③有没有帮别人；点评聚焦劳动过程而非仅看成品。',
    stu:'用三句话互评同伴作品；完成自评量表；说出自己"最满意的一处"与"最想改进的一处"。',
    intent:'落实课标评价建议的"过程性评价 + 表现性评价"，以增值评价保护动手能力较弱学生的积极性。'},
   {t:'37-40′',name:'整理延伸·习惯养成与家校协同',
    teach:'组织工具归位、桌面清理与垃圾分类；带领齐读本课口号；布置课后任务：向家人介绍'+n+'，或采访一位会手艺的长辈。',
    stu:'按清单归位工具、清理工位、分类投放垃圾；记录课后访谈任务，作品带回向家人讲解。',
    intent:'把"劳动习惯与品质"落到收尾环节（工具归位、节约、整洁），并通过家校访谈为劳动档案袋积累过程材料。'}
  ];
}

/* ---- 主题/学段变化时：只刷新"未被教师改写"的区块，保护个性化内容 ---- */
/* 模板版本号：平台升级内置模板（如新增东莞项目流程）后，改动此值即可让老用户自动刷新"未改写"的区块 */
const GEN_VER='2026.10.07';
function sig(){ return GEN_VER+'|'+[S.proj,S.custom,S.grade,S.period,S.product].join('|'); }
function resetGen(what){
  if(what==='goals'){ const g=genGoalsAll(); S.goals=g.goals; S.obs=g.obs; S.edited.goals=false; }
  if(what==='flow'){ S.flow=genFlow(); S.edited.flow=false; }
}
function syncGen(){
  if(!S.goals||!S.obs) resetGen('goals');
  if(!S.flow||!S.flow.length) resetGen('flow');
  const s=sig();
  if(S.genSig!==s){
    if(!S.edited.goals) resetGen('goals');
    if(!S.edited.flow) resetGen('flow');
    S.genSig=s;
  }
}

/* 手动载入当前项目的最新平台模板（老用户升级后刷新流程用） */
function reloadFlow(){
  if(S.edited.flow && !confirm('您已个性化改写过教学流程，重新载入平台模板会覆盖这些修改。是否继续？')) return;
  resetGen('flow'); save(); render();
  alert('已载入当前项目的最新平台模板。');
}

/* ---- 润色引擎（本地规则化，只优化表达，不改教学事实） ---- */
function polishText(t){
  const ch=[]; let s=String(t||'');
  const b0=s;
  s=s.replace(/[ \t]+/g,' ').replace(/\s*([，。；：！？、])\s*/g,'$1').trim();
  s=s.replace(/([，。；：！？、])\1+/g,'$1');
  s=s.replace(/([,;:!?])/g,m=>({',':'，',';':'；',':':'：','!':'！','?':'？'}[m]));
  s=s.replace(/\(([^)]*)\)/g,'（$1）');
  if(s!==b0) ch.push('统一标点、去除多余空格');
  ['其实','然后','我觉得','我认为','大家都知道','可以说','就是说'].forEach(w=>{
    const re=new RegExp('(^|，)'+w+'[，、]?','g');
    if(re.test(s)){ s=s.replace(re,'$1'); ch.push('删除口语词「'+w+'」'); }
  });
  if(/进行[\u4e00-\u9fa5]{2,6}/.test(s)){ s=s.replace(/进行([\u4e00-\u9fa5]{2,6})/g,'$1'); ch.push('精简"进行…"式冗余表达'); }
  s=s.replace(/，{2,}/g,'，').replace(/^，/,'').replace(/([^。！？；])$/,'$1。');
  return {text:s, changes:[...new Set(ch)]};
}
/* ---- 表达体检：给出可采纳的修改建议 ---- */
function lintText(t,type){
  const tips=[], s=String(t||'');
  if(!s.trim()) return tips;
  if(/培养|提高[^，。]{0,6}意识|增强[^，。]{0,6}精神|树立[^，。]{0,6}观念/.test(s))
    tips.push('【空泛表述】出现"培养/提高…意识、精神"类写法，这是<b>教学意图</b>不是教学目标，建议改为"学生能……（可观测行为）"。');
  if(type==='goal'){
    if(!/^(学生|能|会|知道|做到|愿意|说出|完成|按|在|感受)/.test(s.trim()))
      tips.push('【主语不清】建议以"学生"为主语，或以"能/会/做到/愿意/说出/完成"等可观测动词开头。');
    if(!['能','会','做到','愿意','说出','完成','独立','使用','整理','改进','记录'].some(w=>s.includes(w)))
      tips.push('【缺可观测动词】补上"能/会/做到/愿意/说出/完成"，评价时才好操作。');
  }
  if(type==='intent'&&!/课标|教学提示|评价建议|劳动观念|劳动能力|劳动习惯|劳动精神|素养/.test(s))
    tips.push('【未挂钩课标】设计意图建议点明依据，如"落实课标教学提示②做中学，指向劳动能力素养"。');
  if(type==='teach'&&s.length<45&&!/；|;/.test(s))
    tips.push('【偏笼统】教师活动建议写成"做什么 + 怎么组织/怎么评价"，可拆成 2-3 个动作。');
  if(type==='stu'&&!/完成|制作|说出|整理|互评|记录|观察|回答/.test(s))
    tips.push('【学生行为不明】学生活动应写明"做什么、产出什么"，便于观课评价。');
  if(s.length>110) tips.push('【句子偏长】当前 '+s.length+' 字，建议拆为"做什么 + 做到什么程度"两句。');
  if(/[，。]{2,}$/.test(s)) tips.push('【结尾标点】句末有重复标点，可一键润色修正。');
  return tips;
}
/* ---- 可编辑区工具条 ---- */
const LBL={goal:'教学目标（劳动课程核心素养维度）',teach:'教师活动',stu:'学生活动',intent:'设计意图',plain:'文本'};
function edKey(k){ return (String(k).indexOf('goals')===0||String(k).indexOf('obs')===0)?'goals':'flow'; }
function edTools(k,type){
  const my=S.edited[edKey(k)];
  return '<div class="tools">'
   +'<button class="mini" onclick="doPolish(\''+k+'\')">✨ 一键润色</button>'
   +'<button class="mini" onclick="doLint(\''+k+'\',\''+type+'\')">🔍 表达体检</button>'
   +'<button class="mini" onclick="doAI(\''+k+'\',\''+type+'\')">🤖 AI 优化</button>'
   +(my?'<button class="mini" onclick="doRestore(\''+k+'\')">↺ 恢复平台模板</button><span class="pill b">已个性化</span>'
       :'<span class="pill g">平台模板</span>')
   +'</div>';
}
function fieldVal(k){ return getP(k)||''; }
function markEdited(k){ S.edited[edKey(k)]=true; }
function doPolish(k){
  const r=polishText(fieldVal(k));
  if(!r.changes.length){ modalHTML('润色结果','<p>未发现需要规范化的表达，语言已通顺、条理清晰 👍</p><div class="row"><button class="btn sm" onclick="closeModal()">好的</button></div>'); return; }
  setP(k,r.text); markEdited(k); save(); render();
  modalHTML('已润色（内容保真，仅优化表达）','<p class="sub">本次优化：'+r.changes.map(x=>esc(x)).join('；')+'</p><pre class="txt">'+esc(r.text)+'</pre><div class="row"><button class="btn sm" onclick="closeModal()">知道了</button></div>');
}
function doLint(k,type){
  const t=fieldVal(k), tips=lintText(t,type);
  let body = tips.length? '<ul class="check">'+tips.map(x=>'<li style="padding-left:8px">'+x+'</li>').join('')+'</ul>'
    : '<div class="okbox">未发现明显问题：主语明确、动词可观测、表述书面化 ✔</div>';
  body += '<div class="row"><button class="btn sm" onclick="doPolish(\''+k+'\')">✨ 立即一键润色</button>'
    +'<button class="btn ghost sm" onclick="doAI(\''+k+'\',\''+type+'\')">🤖 交给 AI 深度优化</button>'
    +'<button class="btn ghost sm" onclick="closeModal()">关闭</button></div>';
  modalHTML('表达体检 · '+LBL[type],'<div class="dim" style="margin-bottom:6px">当前文本：'+esc(t.slice(0,60))+(t.length>60?'…':'')+'</div>'+body);
}
function aiTextFor(k,type){
  const t=fieldVal(k);
  const rule = type==='goal'?'主语必须是"学生"，动词必须可观测（能/会/做到/愿意/说出/完成），须对应劳动课程四大核心素养之一（劳动观念、劳动能力、劳动习惯与品质、劳动精神），禁止"培养……精神"式空泛表述。'
    :type==='intent'?'必须点明课标依据（教学提示/评价建议/核心素养维度），一句话说清"为什么这样设计"。'
    :type==='teach'?'写清教师"做什么、怎么组织、怎么评价"，动词具体、可分步执行。'
    :type==='stu'?'写清学生"做什么、产出什么"，便于观课与评价。'
    :'语言通顺、条理清晰、书面化。';
  return '你是劳动教育教研员。请在不改变教学事实、不改变《义务教育劳动课程标准（2022年版）》要求的前提下，对下面这段【'+LBL[type]+'】做语言润色与条理优化。\n'
   +'要求：\n① 语言通顺、条理清晰、书面化，适合写入正式教案；\n② '+rule+'\n③ 保留原文全部教学信息，不得新增未提及的事实、数据或人名；\n④ 只输出结果文本，不要解释说明。\n\n【原文】\n'+t;
}
function doAI(k,type){
  const pmpt=aiTextFor(k,type);
  modalHTML('🤖 AI 优化（保真润色）',
   '<p class="sub">复制提示词 → 交给任意 AI 助手 → 把结果粘贴回下方 → 点击"应用"。提示词已内置<b>课标约束</b>，AI 不会改动教学事实。</p>'
   +'<pre class="txt" id="pmptBox" style="max-height:200px;overflow:auto">'+esc(pmpt)+'</pre>'
   +'<div class="row"><button class="btn sm" onclick="copyText(document.getElementById(\'pmptBox\').innerText)">📋 复制提示词</button></div>'
   +'<label class="f">粘贴 AI 返回的结果</label><textarea id="aiBack" rows="5" placeholder="在此粘贴 AI 优化后的文本"></textarea>'
   +'<div class="row"><button class="btn sm" onclick="applyAI(\''+k+'\')">✔ 应用到教案</button><button class="btn ghost sm" onclick="closeModal()">取消</button></div>');
}
function applyAI(k){
  const v=document.getElementById('aiBack').value.trim();
  if(!v){ alert('请先粘贴 AI 返回的结果'); return; }
  setP(k,v); markEdited(k); save(); render(); closeModal();
}
function doRestore(k){
  if(!confirm('恢复为平台模板？您在此处所做的个性化修改将被覆盖。')) return;
  resetGen(edKey(k)); save(); render();
}
/* ---- 整环节（教师活动 / 学生活动 / 设计意图）批量处理 ---- */
function rowKeys(i){ return ['flow.'+i+'.teach','flow.'+i+'.stu','flow.'+i+'.intent']; }
function rowName(i){ return 'flow.'+i+'.name'; }
function doPolishRow(i){
  let ch=[];
  [rowName(i)].concat(rowKeys(i)).forEach(function(k){ const r=polishText(fieldVal(k)); setP(k,r.text); ch=ch.concat(r.changes); });
  ch=[...new Set(ch)]; S.edited.flow=true; save(); render();
  modalHTML('已润色（内容保真，仅优化表达）',
    '<p class="sub">本环节优化项：'+(ch.length?ch.map(x=>esc(x)).join('；'):'无需改动')+'</p>'
    +'<div class="row"><button class="btn sm" onclick="closeModal()">知道了</button></div>');
}
function doLintRow(i){
  const map=[['teach','教师活动'],['stu','学生活动'],['intent','设计意图']];
  let body='';
  map.forEach(function(m){
    const tips=lintText(fieldVal('flow.'+i+'.'+m[0]), m[0]);
    body+='<div style="margin:8px 0"><b>'+m[1]+'</b>'+(tips.length
      ? '<ul class="check">'+tips.map(x=>'<li style="padding-left:8px">'+x+'</li>').join('')+'</ul>'
      : '<div class="dim" style="padding-left:8px">✔ 未发现问题</div>')+'</div>';
  });
  modalHTML('表达体检 · 环节'+(i+1),
    '<div class="dim" style="margin-bottom:6px">'+esc(fieldVal(rowName(i)))+'　'+esc((S.flow[i]&&S.flow[i].t)||'')+'</div>'+body
    +'<div class="row"><button class="btn sm" onclick="doPolishRow('+i+')">✨ 立即润色本环节</button>'
    +'<button class="btn ghost sm" onclick="doAIRow('+i+')">🤖 AI 深度优化</button>'
    +'<button class="btn ghost sm" onclick="closeModal()">关闭</button></div>');
}
function doAIRow(i){
  const pmpt='你是劳动教育教研员。请在不改变教学事实、不改变《义务教育劳动课程标准（2022年版）》要求的前提下，'
   +'对下面这个教学环节的【教师活动】【学生活动】【设计意图】做语言润色与条理优化。\n'
   +'要求：\n① 语言通顺、条理清晰、书面化，适合写入正式教案；\n'
   +'② 教师活动写清"做什么、怎么组织、怎么评价"，动词具体可分步执行；\n'
   +'③ 学生活动写清"做什么、产出什么"，便于观课与评价；\n'
   +'④ 设计意图必须点明课标依据（教学提示/评价建议/核心素养维度）；\n'
   +'⑤ 保留原文全部教学信息，不得新增未提及的事实、数据或人名；\n'
   +'⑥ 严格按以下格式输出，不要解释说明：\n【教师活动】……\n【学生活动】……\n【设计意图】……\n\n'
   +'【环节】'+fieldVal(rowName(i))+'（'+(S.flow[i]?S.flow[i].t:'')+'）\n'
   +'【教师活动】'+fieldVal('flow.'+i+'.teach')+'\n'
   +'【学生活动】'+fieldVal('flow.'+i+'.stu')+'\n'
   +'【设计意图】'+fieldVal('flow.'+i+'.intent');
  modalHTML('🤖 AI 优化 · 环节'+(i+1)+'（保真润色）',
   '<p class="sub">复制提示词 → 交给任意 AI 助手 → 把结果粘贴回下方 → 点击"应用"。提示词内置<b>课标约束</b>与<b>输出格式</b>。</p>'
   +'<pre class="txt" id="pmptBox" style="max-height:220px;overflow:auto">'+esc(pmpt)+'</pre>'
   +'<div class="row"><button class="btn sm" onclick="copyText(document.getElementById(\'pmptBox\').innerText)">📋 复制提示词</button></div>'
   +'<label class="f">粘贴 AI 返回的结果（需含【教师活动】【学生活动】【设计意图】三段）</label>'
   +'<textarea id="aiBack" rows="6" placeholder="在此粘贴 AI 优化后的文本"></textarea>'
   +'<div class="row"><button class="btn sm" onclick="applyAIRow('+i+')">✔ 应用到教案</button><button class="btn ghost sm" onclick="closeModal()">取消</button></div>');
}
function applyAIRow(i){
  const v=document.getElementById('aiBack').value||'';
  const seg=function(name){ const m=v.split('【'+name+'】'); if(m.length<2) return ''; return m[1].split(/【/)[0].trim(); };
  const t=seg('教师活动'), s=seg('学生活动'), it=seg('设计意图');
  if(!t&&!s&&!it){ alert('未识别到【教师活动】【学生活动】【设计意图】三段，请检查粘贴内容'); return; }
  if(t) setP('flow.'+i+'.teach',t);
  if(s) setP('flow.'+i+'.stu',s);
  if(it) setP('flow.'+i+'.intent',it);
  S.edited.flow=true; save(); render(); closeModal();
}
function doRestoreRow(i){
  if(!confirm('把本环节恢复为平台模板？您的个性化修改将被覆盖。')) return;
  const def=genFlow();
  if(def[i]){ S.flow[i]=def[i]; save(); render(); }
}

/* ============ 四、取证台条目（平台不预置史实，只给核实路径） ============ */
function evItems(){
  const p=cur(), n=themeName();
  const base=[
   {k:'list',i:'项目名录级别与公布批次',c:'中',
    cur:S.proj==='custom'?'自定义主题，须先核实其是否列入各级非遗名录':'待核实（平台不预置名录结论，避免以讹传讹）',
    how:['打开中国非物质文化遗产网，在"国家级非物质文化遗产代表性项目名录"中检索项目名称','记录：编号 / 类别 / 公布批次 / 保护单位 / 公布时间','若未列入国家级，改查广东省文化和旅游厅或本市文化馆的省级、市级名录公示'],
    src:'ihchina',q:n+' 非物质文化遗产代表性项目名录 批次 编号'},
   {k:'inheritor',i:'代表性传承人（姓名 / 级别 / 可联系渠道）',c:'低',
    cur:'—（平台不预置，禁止凭印象填写）',
    how:['在中国非物质文化遗产网"代表性传承人"栏目按项目检索','记录：姓名 / 级别（国家/省/市）/ 公布批次 / 项目归属','如需"非遗进校园"，联系本市（区）文化馆非遗部预约，电话核实可到场时间'],
    src:'ihchina',q:n+' 代表性传承人 名单 级别'},
   {k:'craft',i:'核心工序与专业术语的权威表述',c:'中',
    cur:p?('平台教学化表述：'+p.steps.map((s,i)=>(i+1)+'.'+s.replace(/\s*（.*?）/g,'')).join(' → ')):'待填写',
    how:['以官方项目介绍页、地方志或传承人口述为准，记录 3-6 道工序的规范叫法','课堂上可"教学化转译"（如编成口诀），但教案中须注明原术语','避免使用"据说""相传"等无法追溯来源的表述'],
    src:'gd',q:n+' 制作工艺 工序 名称 流程'},
   {k:'material',i:'原材料采购渠道、单价与到货周期',c:'低',
    cur:p?p.cost+'（平台估算，仅供预算参考）':'待填写',
    how:['联系本地非遗工坊、农户或批发市场，电话核实当季是否有货','填写：供货方 / 单价 / 最小起订量 / 到货周期 / 发票','坚持使用真实材料，禁用"仿真替代品"（会丧失真实劳动的教育价值）'],
    src:'local',q:(p?p.area:'广东')+' '+(p?p.mat.split('、')[0]:'材料')+' 采购 批发'},
   {k:'media',i:'教学视频 / 图片来源与授权',c:'低',
    cur:'平台只提供检索路径，不捆绑第三方素材',
    how:['优先使用国家中小学智慧教育平台、官方非遗数字博物馆的素材','记录：来源平台 / 链接 / 作者 / 授权方式','仅校内课堂教学使用；上传公开平台或二次剪辑发布须另获授权','建议同时下载离线副本，防止课堂断网'],
    src:'smart',q:n+' 教学视频 非遗进校园 课例'},
   {k:'safety',i:'安全参数与学校审批',c:'中',
    cur:p?('平台初判安全等级：'+p.risk+'（风险点清单见第④步）'):'待填写',
    how:['对照本校《劳动教室/专用教室安全管理制度》逐条核对','涉及刀具、热源、电器、针具的，须教研组审批并安排第二监护人','填写：审批人 / 审批日期 / 第二监护人 / 应急联系方式'],
    src:'moe',q:'中小学 劳动教室 安全管理 制度 实践课程 审批'},
   {k:'student',i:'本班特殊学生适配方案',c:'低',
    cur:'—（须由任课教师填写，平台无法代劳）',
    how:['课前发放《家长告知单》，回收过敏史与特殊情况','为相关学生设计"同类非遗的替代任务"（如改做平面类任务）','填写：学生代号 / 替代任务 / 评价调整方式'],
    src:'none',q:''},
   {k:'localgov',i:'本地主管单位与"非遗进校园"预约渠道',c:'中',
    cur:'—（平台不预置，须电话核实并留档）',
    how:['联系本市（区）文化馆非遗部或镇街文化服务中心，确认本项目的本地保护单位','询问能否安排传承人进校园，或提供可参观的非遗工坊 / 展示馆','记录：单位名称 / 对接人 / 电话 / 预约要求（一般需提前 2 周）'],
    src:(p&&/东莞/.test(p.area))?'dgwhg':'local',q:(p?p.area:'本市')+' 文化馆 非遗保护中心 非遗进校园 预约'}
  ].map(function(x){ return Object.assign({grp:'通用必核'},x); });
  const extra = (p && p.evExtra) ? p.evExtra : (
    S.proj==='custom' ? [{k:'custom_ev',i:'自定义主题的可行性与安全性自查',c:'高',cur:'—',
      how:['确认该项目是否适合小学生：工具是否可控、单节课能否成型、材料是否易得','确认是否有本地传承人或可查资料','确认安全等级，涉及刀具/热源/电器的一律升级审批'],src:'none',q:''}] : []
  );
  const all = base.concat(extra.map(function(x){ return Object.assign({grp:'本项目专项'},x); }));
  const ord={'高':0,'中':1,'低':2};            // 组内：高敏感项排最前，便于优先处理
  const gord={'通用必核':0,'本项目专项':1};     // 组间：通用项 → 项目专项
  const rank=function(x){ return ord[x.c]===undefined?3:ord[x.c]; };
  const grank=function(x){ return gord[x.grp]===undefined?2:gord[x.grp]; };
  return all.slice().sort(function(a,b){
    const g=grank(a)-grank(b);
    return g!==0?g:rank(a)-rank(b);
  });
}
function evDone(){ const it=evItems(); return it.filter(function(x){ const e=S.ev[x.k]||{}; return (e.v&&e.v.trim())||e.na; }).length; }
function evTotal(){ return evItems().length; }
function evLeft(){ return evTotal()-evDone(); }
function evDoneOf(x){ const e=S.ev[x.k]||{}; return !!((e.v&&e.v.trim())||e.na); }
function evCount(f){
  const it=evItems();
  if(f==='all') return it.length;
  const d=it.filter(evDoneOf).length;
  return f==='todo'? it.length-d : d;
}
/* ---- 取证台快捷操作 ---- */
function todayStr(){ const d=new Date(); const p=function(x){return String(x).padStart(2,'0');}; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
function setEvF(v){ S.evF=v; save(); render(); }
function evToday(k){ S.ev[k]=S.ev[k]||{}; S.ev[k].d=todayStr(); save(); render(); }
function evNA(k){
  if(!confirm('将此项标记为"已尽力检索但未找到权威来源"？\n\n标记后：① 计入已处理；② 导出文档中保留【待核实】标记，不作结论性表述；③ 该项不能作为"合规可用"的事实依据。')) return;
  S.ev[k]=S.ev[k]||{};
  S.ev[k].na=true; S.ev[k].v=''; S.ev[k].d=todayStr();
  S.ev[k].u=S.ev[k].u||'已检索官方来源，未找到可引用的权威表述';
  save(); render();
}
function evClear(k){ if(!confirm('清除本项的核实记录？')) return; delete S.ev[k]; save(); render(); }
function copyEvList(){
  const it=evItems().filter(function(x){ return !evDoneOf(x); });
  if(!it.length){ alert('取证台已全部处理完毕 ✔'); return; }
  const t='【'+themeName()+'】待核实清单（'+it.length+' 项）\n生成日期：'+todayStr()+'\n\n'
   +it.map(function(x,i){
      return (i+1)+'. '+x.i+'（置信度：'+x.c+'）\n   平台当前值：'+x.cur+'\n   核实步骤：\n'+x.how.map(function(s,j){return '     ('+(j+1)+') '+s;}).join('\n')
        +(x.q?'\n   检索式：'+x.q:'')+'\n   核实结论：____________　出处：____________　日期：____________';
    }).join('\n\n')
   +'\n\n取证原则：只认官方与权威机构来源；无法核实的保留【待核实】，宁可不写，不可编造。';
  copyText(t);
}
