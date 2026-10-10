/* ============================================================
   app.js —— Python 冒险岛 主逻辑
   进度存档 / 关卡渲染 / 项目工坊 / 成就系统 / 编辑器
   ============================================================ */

/* ---------------- 常量 ---------------- */
const STORE_KEY = 'pyquest_v1';
// 等级表：下标 = 等级-1，值是「升到该级所需的累计 XP」。
// 全部内容打完共 3995 XP（基础 870 + 进阶 1045 + 项目 480 + 挑战 1600），满级定在 3995。
const LEVEL_XP = [0, 80, 200, 380, 620, 920, 1280, 1700, 2180, 2700, 3100, 3450, 3750, 3995];
const XP_PROJECT = 80;
const CHALLENGE_UNLOCK_AFTER = 3;   // 失败几次后解锁参考答案

const ACHIEVEMENTS = [
  { id: 'first',    ico: '🐣', name: '第一行代码',   desc: '完成任意一关',            test: s => doneLessons(s) >= 1 },
  { id: 'ch1',      ico: '🚀', name: '启程者',       desc: '通关第一章「出发！」',      test: s => chapterDone(s, 'ch1') },
  { id: 'cond',     ico: '🔀', name: '抉择者',       desc: '通关第二章「分岔路口」',    test: s => chapterDone(s, 'ch2') },
  { id: 'loop',     ico: '🌀', name: '循环大师',     desc: '通关第三章「循环迷宫」',    test: s => chapterDone(s, 'ch3') },
  { id: 'func',     ico: '🧰', name: '函数工程师',   desc: '通关第四章「函数工坊」',    test: s => chapterDone(s, 'ch4') },
  { id: 'data',     ico: '🗄️', name: '数据管理员',   desc: '通关第五章「数据结构宝库」', test: s => chapterDone(s, 'ch5') },
  { id: 'all',      ico: '👑', name: '冒险岛通关',   desc: '通关基础篇全部 28 关',      test: s => moduleDone(s, LESSON_CHAPTERS) },

  // ---- 进阶篇 ----
  { id: 'oop',      ico: '🏛️', name: '面向对象',     desc: '通关进阶第一章「面向对象」', test: s => chapterDone(s, 'a1') },
  { id: 'higher',   ico: '🧪', name: '高阶玩家',     desc: '通关进阶第二章「高阶工具」', test: s => chapterDone(s, 'a2') },
  { id: 'stdlib',   ico: '📦', name: '武器库管理员', desc: '通关进阶第三章「标准库」',   test: s => chapterDone(s, 'a3') },
  { id: 'algo',     ico: '🧮', name: '算法入门',     desc: '通关进阶第四章「算法入门」', test: s => chapterDone(s, 'a4') },
  { id: 'advAll',   ico: '🎓', name: '进阶毕业',     desc: '通关进阶篇全部 20 关',      test: s => moduleDone(s, ADVANCED_CHAPTERS) },
  { id: 'master',   ico: '🌟', name: '登峰造极',     desc: '基础篇与进阶篇全部通关',    test: s => moduleDone(s, LESSON_CHAPTERS) && moduleDone(s, ADVANCED_CHAPTERS) },

  { id: 'proj1',    ico: '🛠️', name: '第一个作品',   desc: '完成任意一个项目',        test: s => doneProjects(s) >= 1 },
  { id: 'proj3',    ico: '🏗️', name: '项目狂人',     desc: '完成 3 个项目',           test: s => doneProjects(s) >= 3 },
  { id: 'projAll',  ico: '🏆', name: '全能选手',     desc: '完成全部项目',            test: s => doneProjects(s) >= PROJECTS.length },

  // ---- 挑战 ----
  { id: 'chal1',    ico: '⚔️', name: '初试身手',     desc: '通过第一个挑战',          test: s => solvedChallenges(s) >= 1 },
  { id: 'chal5',    ico: '🎖️', name: '挑战者',       desc: '通过 5 个挑战',           test: s => solvedChallenges(s) >= 5 },
  { id: 'chalHard', ico: '💎', name: '硬核玩家',     desc: '通关全部困难挑战',        test: s => CHALLENGES.filter(c => c.level === 3).every(c => s.solved[c.id]) },
  { id: 'chalAll',  ico: '👑', name: '挑战全清',     desc: '通过全部挑战',            test: s => solvedChallenges(s) >= CHALLENGES.length },

  { id: 'debug',    ico: '🐛', name: '除虫专家',     desc: '累计处理 5 次报错',       test: s => (s.errorFixes || 0) >= 5 },
  { id: 'oneshot',  ico: '🎯', name: '一击必中',     desc: '某关第一次提交就通过',    test: s => Object.keys(s.perfect || {}).length >= 1 },
  { id: 'lv5',      ico: '⚡', name: '五级玩家',     desc: '等级达到 Lv.5',           test: s => levelInfo(s.xp).level >= 5 },
  { id: 'lv10',     ico: '💫', name: '十级玩家',     desc: '等级达到 Lv.10',          test: s => levelInfo(s.xp).level >= 10 },
  { id: 'streak3',  ico: '🔥', name: '三日不辍',     desc: '连续 3 天完成学习',       test: s => (s.streak || 1) >= 3 }
];

/* ---------------- 状态 ---------------- */
let State = null;
const View = { tab: 'map', lessonId: null, projectId: null, projFilter: 'all', challengeId: null, trackId: null };
let busy = false;

function defaultState() {
  return {
    xp: 0, done: {}, proj: {}, drafts: {}, perfect: {},
    solved: {}, attempts: {},
    errorFixes: 0, streak: 1, lastActive: '', unlocked: {},
    /* 下面这些是「学习闭环」用的。一律只在这里给默认值 ——
       读取处不要再写 `|| {}` 兜底，两处都写迟早会分歧
       （之前 stdin 渲染出字面量 undefined 就是兜底写漏了）。 */
    starred: {},   // 收藏：id -> 加星时间戳
    notes: {},     // 学习笔记：id -> { text, updatedAt }
    wrong: {},     // 错题本：id -> { n, kind, ts, last, code, corrected }
    history: {},   // 提交历史：id -> [ { ts, code, pass, detail } ]（最多 20 条）
    srs: {},       // 间隔重复：id -> { due, iv, ease, reps, lapses }
    daily: null,   // 每日目标：{ date, goal, done, xp }
    theme: 'auto', // auto | light | dark
    updateSkip: null  // 用户点过「忽略本次」的版本号，同一个版本不再提示
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    State = raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
  } catch (e) { State = defaultState(); }
}
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(State));
  } catch (e) {
    // localStorage 大约 5MB。加了错题本 / 笔记 / 提交历史之后虽然还在预算内
    // （代码快照是大头，按每题 20 条 × 约 500B 估约 1MB），但用户导入大量
    // 自定义关卡就可能顶满。真写不进去时先淘汰一半提交历史再试，
    // 而不是把失败吞掉 —— 静默丢进度是最伤信任的一类 bug。
    if (trimHistory(0.5)) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(State)); return; } catch (e2) {}
    }
    if (typeof toast === 'function') toast('浏览器存储满了，这次进度没能保存', 'bad');
  }
}

/* 写不下时按比例砍掉提交历史（代码快照是大头）。
   返回 true 表示确实砍掉了东西 —— 没砍成还去重试一次写就是白试。 */
function trimHistory(ratio) {
  const hist = State.history;
  if (!hist || typeof hist !== 'object') return false;
  let cut = 0;
  Object.keys(hist).forEach(id => {
    const arr = hist[id];
    if (!Array.isArray(arr) || arr.length <= 1) return;
    const keep = Math.max(1, Math.floor(arr.length * ratio));
    cut += arr.length - keep;
    hist[id] = arr.slice(-keep);
  });
  return cut > 0;
}

/* ---------------- 主题 ----------------
   三档：auto 跟随系统 / light / dark。
   结果写在 <html data-theme>，CSS 里两套变量各自生效。

   另外单独往 localStorage 存一份裸值（不走 State）：首屏绘制前就要定下主题，
   那时 loadState() 还没跑。index.html 的 <head> 里有一段内联脚本读它，
   避免亮色先闪一下再变暗。 */
const THEME_KEY = 'pq-theme';

function themeOf() { return (State && State.theme) || 'auto'; }
function systemPrefersDark() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
  catch (e) { return false; }
}
function themeResolved() {
  const t = themeOf();
  return t === 'auto' ? (systemPrefersDark() ? 'dark' : 'light') : t;
}
const THEME_LABEL = { auto: '跟随系统', light: '浅色', dark: '深色' };

function applyTheme() {
  const resolved = themeResolved();
  document.documentElement.dataset.theme = resolved;
  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.textContent = resolved === 'dark' ? '🌙' : '☀️';
    btn.title = '外观：' + THEME_LABEL[themeOf()] + '（点击切换）';
    btn.dataset.mode = themeOf();
  }
}

function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  State.theme = order[(order.indexOf(themeOf()) + 1) % order.length];
  try { localStorage.setItem(THEME_KEY, State.theme); } catch (e) {}
  saveState();
  applyTheme();
  toast('外观：' + THEME_LABEL[State.theme], 'ok');
}

/* ---------------- 工具 ---------------- */
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* ---------------- 模块（基础篇 / 进阶篇 / 实战工坊） ----------------
   三块共用同一套渲染与判题机制，只是章节数据不同。
   关卡 id 全局唯一（基础 l*-*、进阶 a*-*、板块 t*-*），所以 State.done 不用分家。 */
const MODULES = [
  { tab: 'map',      chapters: () => LESSON_CHAPTERS,   title: '冒险地图', icon: '🗺️' },
  { tab: 'advanced', chapters: () => ADVANCED_CHAPTERS, title: '进阶路线', icon: '🎓' },
  // 实战工坊：侧栏只显示当前方向内的章节；没选方向时给空数组（侧栏另画方向列表）
  { tab: 'tracks',   chapters: () => activeTrackChapters(), title: '实战工坊', icon: '🚀' }
];

function activeTrackChapters() {
  const t = TRACKS.find(x => x.id === View.trackId);
  return t ? (t.chapters || []) : [];
}
function allTrackChapters() {
  const out = [];
  TRACKS.forEach(t => (t.chapters || []).forEach(ch => out.push(ch)));
  return out;
}
function allProjects() {
  const out = PROJECTS.slice();
  TRACKS.forEach(t => (t.projects || []).forEach(p => out.push(p)));
  return out;
}
function findProject(id) { return allProjects().find(p => p.id === id) || null; }

function chaptersOf(tab) {
  const m = MODULES.find(x => x.tab === tab);
  return m ? m.chapters() : LESSON_CHAPTERS;
}
function activeChapters() { return chaptersOf(View.tab); }
/* ---------------- 章节聚合 ----------------
   三块内容是并列的：基础篇、进阶篇、实战工坊（方向板块）。
   关卡 id 全局唯一，所以进度存档不用分家。 */
function allChapters() { return LESSON_CHAPTERS.concat(ADVANCED_CHAPTERS, allTrackChapters()); }

function trackOfLesson(id) {
  return TRACKS.find(t => (t.chapters || []).some(c => c.lessons.some(l => l.id === id)));
}
/* 一个实战项目属于哪个方向。项目详情页靠它决定「返回」回哪儿、
   面包屑怎么写、以及「下一个项目」在哪个范围内循环。 */
function trackOfProject(id) {
  return TRACKS.find(t => (t.projects || []).some(p => p.id === id)) || null;
}
function trackOfChapter(chId) {
  return TRACKS.find(t => (t.chapters || []).some(c => c.id === chId));
}
function chaptersForLesson(id) {
  if (ADVANCED_CHAPTERS.some(c => c.lessons.some(l => l.id === id))) return ADVANCED_CHAPTERS;
  const tc = allTrackChapters();
  if (tc.some(c => c.lessons.some(l => l.id === id))) return tc;
  return LESSON_CHAPTERS;
}
function tabForLesson(id) {
  const list = chaptersForLesson(id);
  if (list === ADVANCED_CHAPTERS) return 'advanced';
  return list === LESSON_CHAPTERS ? 'map' : 'tracks';
}

/* ---------------- 设备能力 ----------------
   同一个方向在不同设备上能走多远差很多：本机 Python 有真 socket、能起子进程、
   能开窗口，浏览器沙箱里这些都没有。所以方向卡上会拿 needs 和实际能力对一遍，
   做不到的地方直接标出来 —— 而不是让学生跑到一半撞上报错再去猜。 */
function engineCaps() {
  if (typeof PyRunner === 'undefined') return null;
  return PyRunner.caps || null;      // null 表示引擎还没探测完，先不显示任何警告
}
function missingNeeds(track) {
  const caps = engineCaps();
  if (!caps) return [];
  return (track.needs || []).filter(n => !caps[n]);
}

/* 单个关卡 / 项目也能声明 needs。为什么需要这一层：
   同一个方向里，有的内容两端都能跑、有的只有本机 Python 跑得动
   （比如 Web 后端：手拼 HTTP 报文两端都行，真起监听端口只能在本机）。
   方向级 needs 表达不了这种颗粒度，只能粗到「整个方向都别点」——
   那会把本来能学的内容一起挡掉。 */
function missingItemNeeds(item) {
  const needs = (item && item.needs) || [];
  if (!needs.length) return [];
  const caps = engineCaps();
  if (!caps) return [];             // 引擎还没探测完，先不下结论
  return needs.filter(n => !caps[n]);
}
function needText(needs) {
  return (needs || []).map(n => TRACK_NEEDS[n] || n).join('、');
}
/* 能力不足时页面顶部的说明条。要讲清三件事：缺什么、为什么、怎么办 ——
   只说「不支持」等于没说。 */
function needAlertHTML(miss, what) {
  return `<div class="track-alert">`
    + `<strong>这一${what || '关'}要「${needText(miss)}」，当前环境没有。</strong><br>`
    + `代码本身没问题，是运行环境不够：你正在用的是浏览器内置引擎（或在手机 App 里），`
    + `它跑在沙箱里，做不了这类事。<br>`
    + `👉 用 <strong>桌面版（本机 Python）</strong> 打开就能正常跑这一${what || '关'}。`
    + `</div>`;
}

function trackLessonCount(t) {
  return (t.chapters || []).reduce((n, ch) => n + ch.lessons.length, 0);
}
function trackDoneCount(t, s) {
  let n = 0;
  (t.chapters || []).forEach(ch => ch.lessons.forEach(l => { if (s.done[l.id]) n += 1; }));
  (t.projects || []).forEach(p => { if (s.proj[p.id]) n += 1; });
  return n;
}
function trackTotalCount(t) {
  return trackLessonCount(t) + (t.projects || []).length;
}

function flatLessons(list) {
  const out = [];
  (list || allChapters()).forEach(ch => ch.lessons.forEach(l => out.push({ ch, lesson: l })));
  return out;
}
function countLessons(list) { return list.reduce((n, ch) => n + ch.lessons.length, 0); }
function totalLessons() { return countLessons(allChapters()); }
function doneIn(s, list) { return flatLessons(list).filter(x => s.done[x.lesson.id]).length; }
function moduleDone(s, list) { return doneIn(s, list) >= countLessons(list); }
function doneLessons(s) { return Object.keys(s.done || {}).length; }
function doneProjects(s) { return Object.keys(s.proj || {}).length; }
// 没标 level 的算基础项目，只有显式写 advanced 的才算进阶
function isAdvancedProject(p) { return p.level === 'advanced'; }

/* ---------------- 挑战相关小工具 ---------------- */
function challengeLevel(c) {
  return CHALLENGE_LEVELS.find(l => l.level === c.level) || CHALLENGE_LEVELS[0];
}
function solvedChallenges(s) { return Object.keys(s.solved || {}).length; }
function challengeTries(c) { return (State.attempts || {})[c.id] || 0; }
function solutionUnlocked(c) { return !!State.solved[c.id] || challengeTries(c) >= CHALLENGE_UNLOCK_AFTER; }
// 把题目描述压成一行，给卡片当摘要用
function plainText(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function briefOf(html, n) {
  const t = plainText(html);
  return t.length > n ? t.slice(0, n) + '…' : t;
}
function chapterDone(s, chId) {
  const ch = allChapters().find(c => c.id === chId);
  return !!ch && ch.lessons.every(l => s.done[l.id]);
}
function levelInfo(xp) {
  let lv = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) lv = i + 1;
  const cur = LEVEL_XP[lv - 1];
  const next = LEVEL_XP[lv] != null ? LEVEL_XP[lv] : cur;
  const pct = next === cur ? 100 : Math.round((xp - cur) / (next - cur) * 100);
  return { level: lv, cur, next, pct, isMax: LEVEL_XP[lv] == null };
}

/* ---------------- Toast / 弹窗 ---------------- */
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.innerHTML = msg;
  $('#toast-layer').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

function showModal(emoji, title, desc, xp, nextFn, labels) {
  $('#modal-emoji').textContent = emoji;
  $('#modal-title').textContent = title;
  $('#modal-desc').innerHTML = desc;
  $('#modal-xp').textContent = xp ? `+${xp} XP` : '';
  $('#modal-xp').style.display = xp ? '' : 'none';
  // 关卡说「关」、挑战说「题」，所以标签允许覆盖
  $('#modal-close').textContent = (labels && labels.stay) || '留在本关';
  $('#modal-next').textContent = (labels && labels.next) || '下一关 →';
  $('#modal-mask').hidden = false;
  $('#modal-next').onclick = () => { $('#modal-mask').hidden = true; nextFn && nextFn(); };
  $('#modal-close').onclick = () => { $('#modal-mask').hidden = true; };
}
$('#modal-mask').addEventListener('click', e => { if (e.target.id === 'modal-mask') $('#modal-mask').hidden = true; });

/* ---------------- HUD ---------------- */
function renderHud(animate) {
  const info = levelInfo(State.xp);
  $('#hud-level').textContent = info.level;
  $('#hud-xp').textContent = State.xp;
  $('#hud-streak').textContent = State.streak || 1;
  $('#xpbar').style.width = (info.isMax ? 100 : Math.max(2, info.pct)) + '%';
  if (animate) {
    document.querySelectorAll('.hud-item').forEach(el => {
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    });
  }
}

/* ---------------- 侧栏 ---------------- */
function renderSidebar() {
  const body = $('#sidebar-body');

  // 收藏入口常驻侧栏底部，数字实时更新；在哪一页都看得到还差多少想回看的
  const entry = $('#btn-starred');
  const stars = starredItems();
  if (entry) {
    entry.classList.toggle('is-active', View.tab === 'starred');
    const c = $('#star-count');
    if (c) c.textContent = stars.length ? String(stars.length) : '';
  }

  if (View.tab === 'starred') {
    $('#sidebar-title').textContent = '我的收藏';
    body.innerHTML = stars.length
      ? `<ul class="lesson-list">
          ${stars.map(it => `
            <li class="lesson-item ${View.lessonId === it.id || View.projectId === it.id || View.challengeId === it.id ? 'is-active' : ''}" data-go="${esc(it.id)}" data-kind="${it.kind}">
              <span class="lesson-badge">${it.icon}</span>
              <span class="lesson-title">${esc(it.title)}</span>
            </li>`).join('')}
        </ul>`
      : '<div class="sidebar-group-title">还没有收藏</div>';
    body.querySelectorAll('[data-go]').forEach(el => {
      el.onclick = () => goToItem(el.dataset.go, el.dataset.kind);
    });
    $('#sidebar-progress').textContent = String(stars.length);
    return;
  }

  if (View.tab === 'workshop') {
    $('#sidebar-title').textContent = '项目工坊';
    body.innerHTML = `
      <div class="sidebar-group-title">项目工坊</div>
      <ul class="lesson-list">
        ${PROJECTS.map(p => `
          <li class="lesson-item ${State.proj[p.id] ? 'done' : ''} ${View.projectId === p.id ? 'is-active' : ''}" data-proj="${p.id}">
            <span class="lesson-badge">${State.proj[p.id] ? '✓' : p.emoji}</span>
            <span class="lesson-title">${esc(p.name)}</span>
            <span class="lesson-xp">+${XP_PROJECT}</span>
          </li>`).join('')}
      </ul>
      <div class="sidebar-group-title">学习关卡（基础篇）</div>
      <ul class="lesson-list">
        ${flatLessons(LESSON_CHAPTERS).map(({ ch, lesson }) => `
          <li class="lesson-item ${State.done[lesson.id] ? 'done' : ''}" data-lesson="${lesson.id}">
            <span class="lesson-badge">${State.done[lesson.id] ? '✓' : ch.icon}</span>
            <span class="lesson-title">${esc(lesson.title)}</span>
          </li>`).join('')}
      </ul>`;
    body.querySelectorAll('[data-proj]').forEach(el => el.onclick = () => { View.projectId = el.dataset.proj; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    body.querySelectorAll('[data-lesson]').forEach(el => el.onclick = () => {
      View.tab = tabForLesson(el.dataset.lesson); View.lessonId = el.dataset.lesson;
      syncTabs(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('#sidebar-progress').textContent = `${doneProjects(State)} / ${PROJECTS.length}`;
    return;
  }

  if (View.tab === 'challenges') {
    $('#sidebar-title').textContent = '挑战场';
    body.innerHTML = `
      <div class="sidebar-group-title">⚔️ 挑战场</div>
      <ul class="lesson-list">
        ${CHALLENGES.map(c => {
          const done = !!State.solved[c.id];
          const info = challengeLevel(c);
          return `
          <li class="lesson-item ${done ? 'done' : ''} ${View.challengeId === c.id ? 'is-active' : ''}" data-chal="${c.id}">
            <span class="lesson-badge">${done ? '✓' : info.badge}</span>
            <span class="lesson-title">${esc(c.title)}</span>
            <span class="lesson-xp">+${info.xp}</span>
          </li>`;
        }).join('')}
      </ul>`;
    body.querySelectorAll('[data-chal]').forEach(el => el.onclick = () => {
      View.challengeId = el.dataset.chal; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('#sidebar-progress').textContent = `${solvedChallenges(State)} / ${CHALLENGES.length}`;
    return;
  }

  // 基础篇与进阶篇共用同一套章节树
  if (View.tab === 'tracks' && !View.trackId) {
    $('#sidebar-title').textContent = '实战工坊';
    body.innerHTML = `
      <div class="sidebar-group-title">${TRACKS.length} 个方向</div>
      <ul class="lesson-list">
        ${TRACKS.map(t => `
          <li class="lesson-item ${t.status !== 'ready' ? 'is-planned' : ''}" data-track="${t.id}">
            <span class="lesson-badge">${t.icon}</span>
            <span class="lesson-title">${esc(t.name)}</span>
            <span class="lesson-xp">${t.status === 'ready' ? trackTotalCount(t) : '筹备'}</span>
          </li>`).join('')}
      </ul>`;
    body.querySelectorAll('[data-track]').forEach(el => {
      el.onclick = () => { View.trackId = el.dataset.track; render(); window.scrollTo({ top: 0 }); };
    });
    return;
  }

  const list = activeChapters();
  const mod = MODULES.find(m => m.tab === View.tab);
  // 进了某个方向就显示方向名，并给一条回到方向列表的路
  const curTrack = View.tab === 'tracks' ? TRACKS.find(t => t.id === View.trackId) : null;
  $('#sidebar-title').textContent = curTrack ? curTrack.icon + ' ' + curTrack.name
                                             : (mod ? mod.title : '冒险地图');
  if (curTrack) {
    // 每次渲染都插一个的话会越堆越多，先把上一轮的清掉
    const oldBack = body.parentElement.querySelector('.sidebar-back');
    if (oldBack) oldBack.remove();
    const back = document.createElement('button');
    back.className = 'ghost-btn sidebar-back';
    back.textContent = '← 全部方向';
    back.onclick = () => { View.trackId = null; if (trackOfLesson(View.lessonId)) View.lessonId = null; render(); };
    body.parentElement.insertBefore(back, body);
  }

  body.innerHTML = list.map(ch => {
    const done = ch.lessons.filter(l => State.done[l.id]).length;
    const collapsed = done === ch.lessons.length && !ch.lessons.some(l => l.id === View.lessonId);
    return `
      <div class="chapter ${collapsed ? 'collapsed' : ''}" data-ch="${ch.id}">
        <div class="chapter-head">
          <span class="chapter-ico">${ch.icon || ""}</span>
          <span class="chapter-name">${esc(ch.title)}</span>
          <span class="chapter-count">${done}/${ch.lessons.length}</span>
          <span class="chev">▼</span>
        </div>
        <ul class="lesson-list">
          ${ch.lessons.map(l => {
            const lm = missingItemNeeds(l);
            return `
            <li class="lesson-item ${State.done[l.id] ? 'done' : ''} ${View.lessonId === l.id ? 'is-active' : ''} ${lm.length ? 'is-locked' : ''}" data-lesson="${l.id}">
              <span class="lesson-badge">${State.done[l.id] ? '✓' : (lm.length ? '🔒' : '')}</span>
              <span class="lesson-title">${esc(l.title)}</span>
              <span class="lesson-xp">${lm.length ? '需桌面版' : '+' + l.xp}</span>
            </li>`;
          }).join('')}
        </ul>
      </div>`;
  }).join('');

  body.querySelectorAll('.chapter-head').forEach(el => el.onclick = () => el.parentElement.classList.toggle('collapsed'));
  body.querySelectorAll('[data-lesson]').forEach(el => el.onclick = () => {
    View.tab = tabForLesson(el.dataset.lesson); View.lessonId = el.dataset.lesson; syncTabs(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#sidebar-progress').textContent = `${doneIn(State, list)} / ${countLessons(list)}`;
}

/* ---------------- 收藏 / 稍后复习 ----------------
   94 关 + 20 个项目，学生被某一关卡住时原本只有一条路：继续往下翻。
   翻过去就再也找不回来了 —— 而「卡住的地方」恰恰是最该回来看的地方。
   加星就是给这条路留个记号。 */
function isStarred(id) { return !!(State.starred && State.starred[id]); }

function toggleStar(id) {
  State.starred = State.starred || {};
  const on = !State.starred[id];
  if (on) {
    // 时间戳要保证「后加的一定更大」。
    // 只用 Date.now() 的话，同一毫秒内连点两下会并列，排序退化成对象键的
    // 插入顺序 —— 而插入顺序是「最早的在最前」，恰好跟我们要的相反。
    // 所以取「当前最大时间戳 + 1」兜一下单调性。
    let maxTs = 0;
    for (const k in State.starred) {
      if (State.starred[k] > maxTs) maxTs = State.starred[k];
    }
    State.starred[id] = Math.max(Date.now(), maxTs + 1);
  } else {
    delete State.starred[id];
  }
  saveState();
  return on;
}

/* 收藏列表：关卡 / 项目 / 挑战三种内容统一成同一种条目，按加星时间倒序 */
function starredItems() {
  const out = [];
  allChapters().forEach(ch => (ch.lessons || []).forEach(l => {
    if (isStarred(l.id)) out.push({ id: l.id, kind: 'lesson', icon: ch.icon || '📘', title: l.title, sub: ch.title, ts: State.starred[l.id] });
  }));
  allProjects().forEach(p => {
    if (isStarred(p.id)) out.push({ id: p.id, kind: 'project', icon: p.emoji || '🛠️', title: p.name, sub: '实战项目', ts: State.starred[p.id] });
  });
  CHALLENGES.forEach(c => {
    if (isStarred(c.id)) out.push({ id: c.id, kind: 'chal', icon: '⚔️', title: c.title, sub: '挑战场', ts: State.starred[c.id] });
  });
  return out.sort((a, b) => b.ts - a.ts);
}

function starBtnHTML(id) {
  const on = isStarred(id);
  return `<button class="star-btn ${on ? 'on' : ''}" data-star="${esc(id)}"`
       + ` title="${on ? '取消收藏' : '收藏，稍后回来复习'}">${on ? '★' : '☆'}</button>`;
}

/* 跳到某个内容。三种内容分属三个标签页，跳完要把不相关的 View 字段清干净
   —— 项目详情页是两个板块共用的一套渲染，留着旧的 projectId 会串页。 */
function goToItem(id, kind) {
  View.projectId = null;
  View.challengeId = null;
  if (kind === 'project') {
    View.tab = 'workshop';
    View.projectId = id;
  } else if (kind === 'chal') {
    View.tab = 'challenges';
    View.challengeId = id;
  } else {
    View.tab = tabForLesson(id);
    View.lessonId = id;
    const t = trackOfLesson(id);
    View.trackId = t ? t.id : null;
  }
  syncTabs();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- 编辑器：行号 / 报错定位 / 导出 ----------------
   行号能 1:1 对上代码，靠的是**没有自动换行**：CSS 里 textarea 和 .hl 都是
   white-space:pre + word-wrap:normal，一行文本 = 一行可视行。
   哪天给编辑器开了自动换行，这套行号会立刻整体错位（要改成按宽度折行计数）。 */

/* 从 traceback 里取真正出错的行号。
   取**最后一个**匹配：多层调用时前面的帧是「问题被谁引发的」，
   最后一帧才是出错处。实测 def go(): x[5] 抛 IndexError，
   帧是 line 4 → line 3，取 3 才对。 */
function errLineOf(text) {
  const re = /File "<你的代码>", line (\d+)/g;
  let m, last = 0;
  while ((m = re.exec(String(text || ''))) !== null) last = parseInt(m[1], 10);
  return last;
}

/* 导出文件名。id 可能来自导入的自定义关卡，带什么字符都有可能，
   过滤成安全字符 —— 否则浏览器会静默换成一个莫名其妙的名字。 */
function exportFilename(id, dateStr) {
  const safe = String(id || 'code').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[_.-]+|[_.-]+$/g, '');
  return (safe || 'code') + '_' + String(dateStr || today()).replace(/-/g, '') + '.py';
}

/* 行高 / 内边距从计算样式里读，避免和 CSS 里的字号行高写两遍而走岔。

   注意 jsdom 与真浏览器的差异：line-height:1.62 在真浏览器里算出来是
   "21.384px"，jsdom 只返回 "1.62"。小于字号就说明拿到的是倍数，乘回去。 */
function editorMetrics(ta) {
  const cs = getComputedStyle(ta);
  const fs = parseFloat(cs.fontSize) || 13.2;
  let lh = parseFloat(cs.lineHeight);
  if (!isFinite(lh) || lh <= 0) lh = fs * 1.62;
  else if (lh < fs) lh = lh * fs;
  return { fs, lh, padTop: parseFloat(cs.paddingTop) || 0 };
}

/* 下载 .py。jsdom 里没有 Blob / createObjectURL，返回 null 让调用方给出人话，
   而不是抛一个 TypeError 出来。 */
function downloadPy(code, filename) {
  if (typeof Blob !== 'function' || typeof URL === 'undefined'
      || typeof URL.createObjectURL !== 'function') return null;
  try {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/x-python;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 4000);
    return filename;
  } catch (e) { return null; }
}

/* ---------------- 编辑器区块 ---------------- */
function editorHTML(id, code, stdinText, filename) {
  return `
  <div class="card editor-card">
    <div class="editor-toolbar">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span class="editor-filename">${filename}</span>
      <div class="editor-actions">
        <button class="btn btn-ghost" data-act="export" title="把当前编辑器里的代码存成 .py 文件">⬇ 导出 .py</button>
        <button class="btn btn-ghost" data-act="reset">↺ 还原</button>
        <button class="btn btn-warn" data-act="hint">💡 提示</button>
        <button class="btn btn-run" data-act="run">▶ 运行</button>
        <button class="btn btn-primary" data-act="submit">✓ 提交判题</button>
      </div>
    </div>
    <div class="editor-wrap">
      <div class="editor-gutter" data-gutter aria-hidden="true"><div class="editor-gutter-inner"></div></div>
      <pre class="hl" data-hl></pre>
      <div class="editor-errline" data-errline></div>
      <textarea data-code spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off">${esc(code)}</textarea>
    </div>
    <div class="io-row">
      <div class="io-col" data-io="stdin">
        <div class="io-head">⌨️ 标准输入 <span class="hint">input() 按行读取</span></div>
        <textarea class="io-stdin" data-stdin spellcheck="false" placeholder="程序需要输入时，每行一个值">${esc(stdinText)}</textarea>
      </div>
      <div class="io-col" data-io="out">
        <div class="io-head">🖥️ 运行结果 <span class="spacer"></span><span class="hint" data-status></span></div>
        <pre class="io-out" data-out><span class="muted">点「运行」看看效果…</span></pre>
      </div>
    </div>
  </div>`;
}

function wireEditor(root, item, kind, onPass, onFail) {
  const ta = root.querySelector('[data-code]');
  const hl = root.querySelector('[data-hl]');
  const gutter = root.querySelector('[data-gutter]');
  const gutterInner = gutter ? gutter.querySelector('.editor-gutter-inner') : null;
  const errBox = root.querySelector('[data-errline]');
  const stin = root.querySelector('[data-stdin]');
  const out = root.querySelector('[data-out]');
  const status = root.querySelector('[data-status]');
  const key = kind + ':' + item.id;

  function paint() { hl.innerHTML = PyHighlight.highlight(ta.value); }

  /* ---------- 行号 ---------- */
  let gutterLines = -1;   // 上次画了多少行。行数没变就别重建 DOM
  let errLine = 0;        // 当前标红的报错行，0 = 没有

  function gutterEl(n) { return gutterInner ? gutterInner.querySelector('.ln[data-ln="' + n + '"]') : null; }

  function markErr() {
    if (!gutterInner || !errBox) return;
    const old = gutterInner.querySelector('.ln.is-err');
    if (old) old.classList.remove('is-err');
    if (!errLine) { errBox.style.display = 'none'; return; }
    const el = gutterEl(errLine);
    if (el) el.classList.add('is-err');
    errBox.style.display = 'block';
    positionErr();
  }

  /* 报错行的红色底条要跟着滚动走，否则一滚就错位到别的行上 */
  function positionErr() {
    if (!errBox || !errLine) return;
    const m = editorMetrics(ta);
    errBox.style.left = (gutter ? gutter.offsetWidth : 0) + 'px';
    errBox.style.top = (m.padTop + (errLine - 1) * m.lh - ta.scrollTop) + 'px';
    errBox.style.height = m.lh + 'px';
  }

  function markActive() {
    if (!gutterInner) return;
    const cur = gutterInner.querySelector('.ln.is-active');
    if (cur) cur.classList.remove('is-active');
    const upto = ta.value.slice(0, ta.selectionStart || 0);
    const el = gutterEl(upto.split('\n').length);
    if (el) el.classList.add('is-active');
  }

  function renderGutter() {
    if (!gutterInner) return;
    const n = ta.value.split('\n').length;
    if (n !== gutterLines) {
      gutterLines = n;
      const parts = [];
      for (let i = 1; i <= n; i++) parts.push('<span class="ln" data-ln="' + i + '">' + i + '</span>');
      gutterInner.innerHTML = parts.join('');
      markErr();     // 元素是新建的，报错标记要重新贴回去
    }
    markActive();
  }

  /* 报错行：设行号 + 滚到看得见的位置。
     不滚的话，报错在第 60 行时学生只看到一句「line 60」，还得自己找。 */
  function setErrLine(n) {
    errLine = n || 0;
    markErr();
    if (!errLine || !gutterInner) return;
    const m = editorMetrics(ta);
    const y = m.padTop + (errLine - 1) * m.lh;
    const view = ta.clientHeight || 0;
    if (view && (y < ta.scrollTop || y + m.lh > ta.scrollTop + view)) {
      ta.scrollTop = Math.max(0, y - view / 2);
      syncScroll();
    }
  }

  function syncScroll() {
    hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft;
    if (gutterInner) gutterInner.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)';
    positionErr();
  }

  ta.value = ta.value.replace(/^\n/, '');
  paint();
  renderGutter();

  ta.addEventListener('input', () => {
    paint(); renderGutter(); saveDraft(key, ta.value, stin.value);
  });
  ta.addEventListener('scroll', syncScroll);
  // 点了别处 / 拖选，光标行也要跟着变
  ta.addEventListener('click', markActive);
  ta.addEventListener('keyup', markActive);
  ta.addEventListener('select', markActive);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, epos = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(epos);
      ta.selectionStart = ta.selectionEnd = s + 4;
      paint(); renderGutter(); saveDraft(key, ta.value, stin.value);
    }
  });
  stin.addEventListener('input', () => saveDraft(key, ta.value, stin.value));

  // 编辑器可以手动拖高（resize:vertical），行号栏的底色得跟着长，
  // 否则下面会露出一截没有行号的空白。
  if (typeof ResizeObserver === 'function') {
    try {
      new ResizeObserver(() => {
        if (gutter && ta.offsetHeight) gutter.style.minHeight = ta.offsetHeight + 'px';
      }).observe(ta);
    } catch (e) {}
  }

  function showRun(r) {
    let html = '';
    if (r.out) html += esc(r.out);
    if (r.err) html += `<span class="err">${esc(r.err)}</span>`;
    if (!html) html = '<span class="muted">（没有任何输出）</span>';
    out.innerHTML = html;
  }

  /* 这一关要的能力当前设备没有（比如 tkinter 需要图形窗口）。
     界面上虽然已经标出来了，但真正的守门放在动作入口 ——
     不管用户从哪儿点到，都会拿到一句人话，而不是一屏 ImportError。 */
  function needBlocked() {
    const miss = missingItemNeeds(item);
    if (!miss.length) return false;
    toast('这一关需要「' + needText(miss) + '」，当前环境没有。用桌面版打开就能跑。', 'bad');
    return true;
  }

  async function ensureEngine() {
    if (PyRunner.isReady) return true;
    try { await PyRunner.init(engineStatus); return PyRunner.isReady; }
    catch (e) { return false; }
  }

  async function doRun() {
    if (busy) return;
    if (needBlocked()) return;
    if (!await ensureEngine()) { toast('Python 引擎还没准备好，检查一下网络？', 'bad'); return; }
    busy = true; status.textContent = '运行中…';
    const r = await PyRunner.run(ta.value, stin.value, '');
    showRun(r);
    setErrLine(errLineOf(r.err));
    status.textContent = r.err.trim()
      ? ('运行出错' + (errLine ? ' · 第 ' + errLine + ' 行' : ''))
      : '运行完成';
    if (r.err.trim()) {
      State.errorFixes = (State.errorFixes || 0) + 1; saveState(); checkAchievements();
    }
    busy = false;
  }

  async function doSubmit() {
    if (busy) return;
    if (needBlocked()) return;
    if (!await ensureEngine()) { toast('Python 引擎还没准备好，检查一下网络？', 'bad'); return; }
    busy = true; status.textContent = '判题中…';
    const already = kind === 'chal' ? !!State.solved[item.id] : !!(State.done[item.id] || State.proj[item.id]);
    // 挑战记录了失败次数，所以「一次就过」可以判准；关卡失败不落盘，用「之前没通过」等价
    const firstTry = !already && !(kind === 'chal' && challengeTries(item) > 0);
    const r = await PyRunner.judge(ta.value, stin.value, item.check);
    showRun(r.run || { out: '', err: '' });
    setErrLine(errLineOf((r.run && r.run.err) || ''));
    status.textContent = r.pass ? '通过 ✓' : (errLine ? '未通过 · 第 ' + errLine + ' 行报错' : '未通过');
    busy = false;

    const vbox = root.querySelector('[data-verdict]');
    if (r.pass) {
      // r.note 是「判过了，但和参考答案还差一些看不见的字符（空格 / 全角半角标点）」。
      // 不拦着不给过，但要说出来 —— 否则学生永远不知道自己打错了哪个字符。
      vbox.innerHTML = `<div class="verdict ok"><span class="verdict-ico">🎉</span><div><strong>通过！</strong>你的代码完全符合要求。</div></div>`
        + (r.note ? `<div class="verdict tip"><span class="verdict-ico">💡</span><div>${esc(r.note)}</div></div>` : '');
      onPass(firstTry);
    } else {
      vbox.innerHTML = `<div class="verdict bad"><span class="verdict-ico">🧐</span><div><strong>还差一点点</strong><br>${esc(r.detail).replace(/\n/g, '<br>')}</div></div>`;
      State.errorFixes = (State.errorFixes || 0) + 1; saveState();
      if (onFail) onFail();
      toast('没过，看看下面的提示～', 'bad');
    }
  }

  root.querySelector('[data-act="run"]').onclick = doRun;
  root.querySelector('[data-act="submit"]').onclick = doSubmit;
  const expBtn = root.querySelector('[data-act="export"]');
  if (expBtn) expBtn.onclick = () => {
    // 导的是编辑器里**当前的**代码，不是初始代码 —— 学生要带走的当然是
    // 自己刚写出来的那一份。
    const name = downloadPy(ta.value, exportFilename(item.id));
    if (name) toast('已导出 ' + name, 'ok');
    else toast('当前环境不支持直接下载，先把代码复制走吧', 'bad');
  };
  root.querySelector('[data-act="reset"]').onclick = () => {
    ta.value = (item.starter || '').replace(/^\n/, '');
    stin.value = item.stdin || '';
    paint(); renderGutter(); setErrLine(0); saveDraft(key, ta.value, stin.value);
    root.querySelector('[data-verdict]').innerHTML = '';
    out.innerHTML = '<span class="muted">已还原成初始代码。</span>';
    status.textContent = '';
  };
  root.querySelector('[data-act="hint"]').onclick = () => {
    const f = root.querySelector('[data-fold="hint"]');
    if (f) { f.open = true; f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };

  // Ctrl/Cmd + Enter 运行
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doRun(); }
  });
}

function saveDraft(key, code, stdinText) {
  State.drafts[key] = { code, stdin: stdinText };
  clearTimeout(saveDraft._t);
  saveDraft._t = setTimeout(saveState, 400);
}
function getDraft(key, fallbackCode, fallbackStdin) {
  const d = State.drafts[key];
  return {
    code: d && typeof d.code === 'string' ? d.code : fallbackCode,
    stdin: d && typeof d.stdin === 'string' ? d.stdin : (fallbackStdin || '')
  };
}

/* ---------------- 关卡视图 ---------------- */
/* 能力不足时把编辑器置为只读：学生仍然可以读代码、看参考答案、抄下来
   到桌面版里跑，只是不能在这里点运行 —— 免得白等一次报错。
   导出让留着：把代码带到桌面版去跑，正是这时候最该做的事。 */
function lockEditor(root, miss) {
  if (!root) return;
  root.querySelectorAll('.editor-actions button').forEach(b => {
    if (b.dataset.act === 'hint' || b.dataset.act === 'export') return;
    b.disabled = true;
    b.title = '需要「' + needText(miss) + '」，当前环境没有';
  });
  const ta = root.querySelector('textarea[data-code]');
  if (ta) ta.readOnly = true;
  const st = root.querySelector('[data-status]');
  if (st) st.textContent = '需要' + needText(miss) + ' · 请用桌面版';
}

function renderLesson() {
  const list = activeChapters();
  const flat = flatLessons(list);
  let idx = flat.findIndex(x => x.lesson.id === View.lessonId);
  if (idx === -1) {
    // 当前 lessonId 不属于本模块（比如刚切了标签页），跳到本模块第一关未完成的
    View.lessonId = (flat.find(x => !State.done[x.lesson.id]) || flat[0]).lesson.id;
    idx = flat.findIndex(x => x.lesson.id === View.lessonId);
  }
  if (idx === -1) idx = 0;
  View.lessonId = flat[idx].lesson.id;

  const { ch, lesson } = flat[idx];
  const done = !!State.done[lesson.id];
  const draft = getDraft('lesson:' + lesson.id, lesson.starter, lesson.stdin);
  const prev = idx > 0 ? flat[idx - 1].lesson : null;
  const next = idx < flat.length - 1 ? flat[idx + 1].lesson : null;
  const mod = MODULES.find(m => m.tab === View.tab) || MODULES[0];
  const missNeed = missingItemNeeds(lesson);

  // 实战工坊的关卡在「工坊 → 方向 → 章节」的第三层，面包屑里必须带上方向名，
  // 否则从关卡页看不出这是哪条线的内容。
  // ch.icon 是可选的（板块里有 5 个章节没写），直接插值会在页面上印出字面量
  // "undefined" —— 这里统一兜成空串。
  const track = trackOfLesson(View.lessonId);
  const modCrumb = track
    ? `${mod.icon} ${esc(mod.title)} &nbsp;›&nbsp; ${track.icon} ${esc(track.name)}`
    : `${mod.icon} ${esc(mod.title)}`;
  const chCrumb = (ch.icon ? ch.icon + ' ' : '') + esc(ch.title);

  $('#stage').innerHTML = `
    <div class="card">
      <div class="quest-head">
        <div class="quest-crumb">${modCrumb} &nbsp;›&nbsp; ${chCrumb} · ${esc(ch.subtitle)} &nbsp;/&nbsp; 第 ${idx + 1} 关，共 ${flat.length} 关</div>
        <div class="quest-title">
          <h1>${esc(lesson.title)}</h1>
          <span class="quest-tag ${done ? 'done' : ''}">${done ? '✓ 已通关' : '+' + lesson.xp + ' XP'}</span>
          ${starBtnHTML(lesson.id)}
        </div>
        <p class="quest-goal">🎯 ${esc(lesson.goal)}</p>
      </div>
      <div class="lesson-body">${lesson.body}</div>
      ${missNeed.length ? needAlertHTML(missNeed) : ''}
    </div>

    <div class="card">
      <div class="quest-head" style="padding:16px 24px;border-bottom:1px solid var(--border)">
        <div class="quest-crumb" style="margin:0">✍️ 动手时间</div>
        <p class="quest-goal" style="margin-top:6px">按上面的说明写代码，然后点 <strong>提交判题</strong> 让系统自动检查。快捷键：<code>Ctrl + Enter</code> 运行。</p>
      </div>
      ${editorHTML(lesson.id, draft.code, draft.stdin, 'main.py')}
      <div style="padding:16px 20px 0"><div data-verdict></div></div>
      <div style="padding:0 20px 18px">
        <details class="fold" data-fold="hint">
          <summary>💡 卡住了？点这里看提示</summary>
          <div class="fold-body">${lesson.hint}</div>
        </details>
        <details class="fold">
          <summary>🔑 参考答案（建议先自己写 5 分钟）</summary>
          <div class="fold-body"><pre><code>${esc(lesson.solution)}</code></pre></div>
        </details>
      </div>
      <div class="quest-nav">
        <button class="btn btn-ghost" id="nav-prev" ${prev ? '' : 'disabled'}>← ${prev ? esc(prev.title) : '已经是第一关'}</button>
        <button class="btn btn-ghost" id="nav-next" ${next ? '' : 'disabled'}>${next ? esc(next.title) : '已经是最后一关'} →</button>
      </div>
    </div>`;

  const card = $('#stage').querySelector('.editor-card');
  wireEditor(card.parentElement, lesson, 'lesson', (firstTry) => completeLesson(lesson, firstTry));
  if (missNeed.length) lockEditor($('#stage'), missNeed);

  if (prev) $('#nav-prev').onclick = () => { View.lessonId = prev.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  if (next) $('#nav-next').onclick = () => { View.lessonId = next.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
}

function completeLesson(lesson, firstTry) {
  const wasDone = !!State.done[lesson.id];
  if (!wasDone) {
    State.done[lesson.id] = true;
    State.xp += lesson.xp;
    if (firstTry) State.perfect[lesson.id] = true;
    touchStreak();
    saveState();
    renderHud(true); renderSidebar(); checkAchievements();

    // 「下一关」只在同一模块内推进，不会从基础篇跳到进阶篇
    const flat = flatLessons(chaptersForLesson(lesson.id));
    const i = flat.findIndex(x => x.lesson.id === lesson.id);
    const next = (i > -1 && i < flat.length - 1) ? flat[i + 1].lesson : null;
    showModal('🎉', '通关！', `「${esc(lesson.title)}」完成${firstTry ? ' —— 而且是一次就过，漂亮！' : '。'}`, lesson.xp,
      next ? () => { View.lessonId = next.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } : null);
    toast(`获得 ${lesson.xp} XP`, 'ok');
    // 重绘当前关，让「已通关」标记更新
    setTimeout(() => { renderSidebar(); }, 50);
  } else {
    showModal('✅', '再次通过', '这关你已经拿过经验值了，不过复习一遍总是好的。', 0, null);
  }
}

/* ---------------- 实战工坊（方向板块） ---------------- */
function trackCard(t) {
  const total = trackTotalCount(t);
  const done = trackDoneCount(t, State);
  const pct = total ? Math.round(done / total * 100) : 0;
  const miss = missingNeeds(t);
  const planned = t.status !== 'ready';
  const needText = (t.needs || []).length
    ? (t.needs || []).map(n => TRACK_NEEDS[n] || n).join('、')
    : '三端都能跑';

  let badge = '';
  if (planned) badge = '<span class="track-badge is-planned">规划中</span>';
  else if (miss.length) badge = '<span class="track-badge is-warn">本设备受限</span>';

  return `
    <button class="track-card ${planned ? 'is-planned' : ''}" data-track="${t.id}">
      <div class="track-card-top">
        <span class="track-icon">${t.icon}</span>
        <span class="track-tag">${esc(t.tag || '')}</span>
        ${badge}
      </div>
      <div class="track-name">${esc(t.name)}</div>
      <div class="track-desc">${esc(t.desc)}</div>
      ${planned
        ? `<div class="track-meta">内容在陆续补完 · 需要：${esc(needText)}</div>`
        : `<div class="track-bar"><i style="width:${pct}%"></i></div>
           <div class="track-meta">${done} / ${total} 已完成${miss.length ? ' · 本设备做不到：' + esc(miss.map(n => TRACK_NEEDS[n] || n).join('、')) : ''}</div>`}
    </button>`;
}

function renderTracks() {
  if (View.trackId) return renderTrackDetail();

  const caps = engineCaps();
  const info = (typeof PyRunner !== 'undefined' && PyRunner.engineInfo) || null;
  const isNative = caps && caps.net;      // net 是「本机真运行时」的标志能力
  const devText = !caps
    ? '正在探测这台设备能做什么…'
    : (isNative
        ? '本机 Python' + (info ? ' ' + info.version : '') + ' · 全部方向可用'
        : '内置 Python 引擎 · 受限方向已标注');

  const ready = TRACKS.filter(t => t.status === 'ready').length;
  const lessons = TRACKS.reduce((n, t) => n + trackLessonCount(t), 0);

  $('#stage').innerHTML = `
    <div class="track-hero">
      <h1>🚀 实战工坊</h1>
      <p>基础篇和进阶篇教的是<strong>语言本身</strong>。这里换成<strong>真实的做事方向</strong> ——
      每个方向都是一条从原理到成品的完整路径。</p>
      <div class="track-device ${isNative ? 'is-native' : ''}">
        <span class="track-device-dot"></span>${esc(devText)}
      </div>
    </div>
    <div class="track-grid">${TRACKS.map(trackCard).join('')}</div>
    <p class="track-foot">共 ${TRACKS.length} 个方向 · ${ready} 个已就绪（${lessons} 关）·
      其余方向在陆续补内容，先列出来是为了让你知道这条路通向哪儿。</p>
  `;

  document.querySelectorAll('#stage [data-track]').forEach(el => {
    el.onclick = () => {
      View.trackId = el.dataset.track;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
}

function renderTrackDetail() {
  const t = TRACKS.find(x => x.id === View.trackId);
  if (!t) { View.trackId = null; return renderTracks(); }

  const miss = missingNeeds(t);
  const chapters = t.chapters || [];
  const projects = t.projects || [];
  const planned = t.status !== 'ready';

  const warn = miss.length
    ? `<div class="track-alert">
         <strong>这个方向在你这台设备上只能学一部分。</strong>
         ${esc(miss.map(n => TRACK_NEEDS[n] || n).join('、'))} ——
         浏览器沙箱和手机环境做不到这些，代码能读能改，但跑到那一步会失败。
         换成桌面版（本机 Python）就没有这个限制。
       </div>`
    : '';

  const plannedNote = planned
    ? `<div class="track-alert is-info">
         <strong>这个方向的内容还在编写中。</strong>先把它列在这里，是为了让整套体系的边界完整 ——
         你可以先学已经就绪的方向。
       </div>`
    : '';

  const chHtml = chapters.map(ch => `
    <div class="track-ch">
      <div class="track-ch-head">
        <span>${esc(ch.title)}</span>
        <span class="count">${ch.subtitle ? esc(ch.subtitle) + ' · ' : ''}${ch.lessons.length} 关</span>
      </div>
      <ul class="lesson-list">
        ${ch.lessons.map(l => {
          const lm = missingItemNeeds(l);
          return `
          <li class="lesson-item ${State.done[l.id] ? 'done' : ''} ${View.lessonId === l.id ? 'is-active' : ''} ${lm.length ? 'is-locked' : ''}" data-lesson="${l.id}">
            <span class="lesson-badge">${State.done[l.id] ? '✓' : (lm.length ? '🔒' : '')}</span>
            <span class="lesson-title">${esc(l.title)}</span>
            <span class="lesson-xp">${lm.length ? '需桌面版' : '+' + l.xp}</span>
          </li>`;
        }).join('')}
      </ul>
    </div>`).join('');

  const projHtml = projects.map(p => {
    const pm = missingItemNeeds(p);
    return `
    <button class="proj-card" data-trackproj="${p.id}">
      ${State.proj[p.id] ? '<span class="proj-status">✓ 已完成</span>' : ''}
      <div class="proj-card-top">
        <span class="proj-emoji" style="background:${p.color || '#eef2f8'}">${p.emoji || '🏗️'}</span>
        <div>
          <p class="proj-name">${esc(p.name || p.id)}</p>
          <p class="proj-sub">${esc(p.sub || '')}</p>
        </div>
      </div>
      <div class="proj-diff">${'★'.repeat(p.diff || 1)}${'☆'.repeat(Math.max(0, 3 - (p.diff || 1)))}</div>
      <p class="proj-desc">${esc(p.desc || '')}</p>
      ${pm.length ? `<p class="proj-lock">🔒 需要桌面版（${esc(needText(pm))}）</p>` : ''}
    </button>`;
  }).join('');

  $('#stage').innerHTML = `
    <button class="back-btn" id="back-tracks">← 全部方向</button>
    <div class="track-detail-head">
      <h1>${t.icon} ${esc(t.name)}</h1>
      <div class="track-detail-sub">${esc(t.desc)} · ${esc(t.level || '')}</div>
      ${t.intro || ''}
    </div>
    ${warn}${plannedNote}
    ${chHtml ? `<div class="section-title">技能关卡 <span class="count">${trackLessonCount(t)} 关</span></div>${chHtml}` : ''}
    ${projHtml ? `<div class="section-title">实战项目 <span class="count">${projects.length} 个</span></div>
      <div class="proj-grid">${projHtml}</div>` : ''}
  `;

  $('#back-tracks').onclick = () => {
    View.trackId = null;
    // 回到方向列表时把当前关卡松开，否则下一关会跳错位置
    if (trackOfLesson(View.lessonId)) View.lessonId = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  document.querySelectorAll('#stage [data-lesson]').forEach(el => {
    el.onclick = () => {
      View.tab = 'tracks';
      View.lessonId = el.dataset.lesson;
      const t2 = trackOfLesson(el.dataset.lesson);
      if (t2) View.trackId = t2.id;
      syncTabs(); render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
  document.querySelectorAll('#stage [data-trackproj]').forEach(el => {
    el.onclick = () => {
      View.tab = 'tracks';
      View.trackId = t.id;
      View.projectId = el.dataset.trackproj;
      syncTabs(); render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
}

/* ---------------- 项目工坊 ---------------- */
function renderWorkshop() {
  if (!View.projectId) {
    const doneN = doneProjects(State);
    const advN = PROJECTS.filter(p => isAdvancedProject(p)).length;
    const shown = PROJECTS.filter(p => View.projFilter === 'all'
      || (View.projFilter === 'advanced') === isAdvancedProject(p));
    const chip = (key, label, n) => `
      <button class="ws-filter ${View.projFilter === key ? 'is-active' : ''}" data-filter="${key}">${label} <span>${n}</span></button>`;

    $('#stage').innerHTML = `
      <div class="ws-hero">
        <h1>🛠️ 项目工坊</h1>
        <p>学完语法不等于会写程序。这里 ${PROJECTS.length} 个实战项目，每一个都能独立运行、都有明确的验收标准。
        前 ${PROJECTS.length - advN} 个用基础篇的知识就能写，后 ${advN} 个需要进阶篇的类、正则、生成器。</p>
        <div class="ws-meta">
          <span class="ws-chip">共 ${PROJECTS.length} 个项目</span>
          <span class="ws-chip">已完成 ${doneN} 个</span>
          <span class="ws-chip">每个 +${XP_PROJECT} XP</span>
        </div>
      </div>
      <div class="ws-filters">
        ${chip('all', '全部', PROJECTS.length)}
        ${chip('basic', '🌱 基础篇', PROJECTS.length - advN)}
        ${chip('advanced', '🎓 进阶篇', advN)}
      </div>
      <div class="proj-grid">
        ${shown.map(p => `
          <button class="proj-card" data-proj="${p.id}">
            ${State.proj[p.id] ? '<span class="proj-status">✓ 已完成</span>' : ''}
            <div class="proj-card-top">
              <span class="proj-emoji" style="background:${p.color}">${p.emoji}</span>
              <div>
                <p class="proj-name">${esc(p.name)}</p>
                <p class="proj-sub">${esc(p.sub)}</p>
              </div>
            </div>
            <div class="proj-diff">${'★'.repeat(p.diff)}${'☆'.repeat(3 - p.diff)}
              ${isAdvancedProject(p) ? '<span class="proj-adv">进阶</span>' : ''}</div>
            <p class="proj-desc">${esc(p.desc)}</p>
            <div class="proj-tags">${p.tags.map(t => `<span class="proj-tag">${esc(t)}</span>`).join('')}</div>
          </button>`).join('')}
      </div>`;
    $('#stage').querySelectorAll('[data-proj]').forEach(el => el.onclick = () => {
      View.projectId = el.dataset.proj; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('#stage').querySelectorAll('[data-filter]').forEach(el => el.onclick = () => {
      View.projFilter = el.dataset.filter; render();
    });
    return;
  }

  // 项目可能来自「项目工坊」，也可能来自「实战工坊」的某个方向
  const p = findProject(View.projectId) || PROJECTS[0];
  renderProjectDetail(p, {
    label: '← 返回项目列表',
    go: () => { View.projectId = null; render(); }
  });
}

/* ---------------- 项目详情页（两个入口共用） ----------------
   项目工坊和实战工坊的项目，页面本身就是同一件事：
   项目档案 + 编辑器 + 参考实现。差别只在一处 —— 「返回」回哪儿。
   所以正文只写一份，差异用 back 参数传进来。

   这个函数是从 renderWorkshop 里抽出来的。抽之前，实战项目那条路
   调的是一个根本没人定义过的 renderProject()，点下去抛 ReferenceError，
   innerHTML 从未被替换 —— 表现就是「点了实战项目没反应」。 */
function renderProjectDetail(p, back) {
  const done = !!State.proj[p.id];
  // stdin 兜底成空串：实战项目不带标准输入，直接传 undefined 会在输入框里
  // 渲染出字面量 "undefined"
  const draft = getDraft('proj:' + p.id, p.starter, p.stdin || '');
  const missProj = missingItemNeeds(p);
  // 板块项目和项目工坊的项目字段名不完全一样（tags/tag、hint/challenge 可选），
  // 这里统一兜一下，免得某一边新增项目时渲染直接崩。
  const projTags = p.tags || (p.tag ? [p.tag] : []);
  const track = trackOfProject(p.id);
  const diff = p.diff || 1;

  // 面包屑：项目详情在实战工坊里藏了两层，没有它容易忘了自己在哪
  const crumb = track
    ? `🚀 实战工坊 / ${track.icon} ${esc(track.name)} / ${esc(p.name)}`
    : `🛠️ 项目工坊 / ${esc(p.name)}`;

  const meta = [
    p.time ? `<span class="proj-meta-item">⏱ 预计 ${esc(p.time)}</span>` : '',
    track ? `<span class="proj-meta-item">📚 前置 ${trackLessonCount(track)} 关</span>` : '',
    `<span class="proj-meta-item">⭐ 难度 ${'★'.repeat(diff)}${'☆'.repeat(Math.max(0, 3 - diff))}</span>`,
    `<span class="proj-meta-item">⚡ +${XP_PROJECT} XP</span>`
  ].filter(Boolean).join('');

  // 下面几块都是可选字段：老项目没写就整块不出现，不能因此崩掉
  const learnHtml = (p.learn && p.learn.length) ? `
      <div class="proj-block">
        <h3>🎯 做完这个项目，你会掌握</h3>
        <ul class="proj-learn">${p.learn.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>` : '';

  const rubricHtml = (p.rubric && p.rubric.length) ? `
      <div class="proj-block">
        <h3>✅ 提交前自查</h3>
        <ul class="proj-rubric">${p.rubric.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>` : '';

  $('#stage').innerHTML = `
    <div class="card">
      <div class="proj-crumb">${crumb}</div>
      <div class="proj-head">
        <span class="proj-emoji" style="background:${p.color || '#eef2f8'}">${p.emoji || '🏗️'}</span>
        <div>
          <h1>${esc(p.name || p.id)} ${done ? '<span class="quest-tag done">✓ 已完成</span>' : `<span class="quest-tag">+${XP_PROJECT} XP</span>`}</h1>
          <p>${esc(p.desc || '')}</p>
          <div class="proj-tags" style="margin-top:9px">${projTags.map(t => `<span class="proj-tag">${esc(t)}</span>`).join('')}
            ${isAdvancedProject(p) ? '<span class="proj-tag proj-tag-adv">🎓 进阶项目</span>' : ''}</div>
        </div>
        <div style="margin-left:auto">${starBtnHTML(p.id)}</div>
      </div>
      <div class="proj-meta">${meta}</div>
      <div class="lesson-body">
        ${p.intro || ''}
        <h3>实现步骤</h3>
        <ol class="steps">${(p.steps || []).map(s => `<li>${s}</li>`).join('')}</ol>
        ${learnHtml}
        ${rubricHtml}
      </div>
      ${missProj.length ? needAlertHTML(missProj, '个项目') : ''}
    </div>

    <div class="card">
      <div class="quest-head" style="padding:16px 24px">
        <div class="quest-crumb" style="margin:0">✍️ 写代码</div>
        <p class="quest-goal" style="margin-top:6px">按步骤实现，然后点 <strong>提交判题</strong>。判题会真的运行你的代码并检查结果。</p>
      </div>
      ${editorHTML(p.id, draft.code, draft.stdin, p.id + '.py')}
      <div style="padding:16px 20px 0"><div data-verdict></div></div>
      <div style="padding:0 20px 18px">
        ${p.hint ? `<details class="fold">
          <summary>💡 卡住了？点这里看思路</summary>
          <div class="fold-body">${p.hint}</div>
        </details>` : ''}
        ${p.challenge ? `<details class="fold">
          <summary>🚀 进阶挑战（做完主任务再来）</summary>
          <div class="fold-body">${p.challenge}</div>
        </details>` : ''}
        <details class="fold">
          <summary>🔑 参考实现</summary>
          <div class="fold-body"><pre><code>${esc(p.solution)}</code></pre></div>
        </details>
      </div>
      <div class="quest-nav">
        <button class="btn btn-ghost" id="back-grid">${back.label}</button>
        <button class="btn btn-ghost" id="next-proj">下一个项目 →</button>
      </div>
    </div>`;

  const card = $('#stage').querySelector('.editor-card');
  wireEditor(card.parentElement, p, 'proj', () => completeProject(p));
  if (missProj.length) lockEditor($('#stage'), missProj);

  $('#back-grid').onclick = () => { back.go(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#next-proj').onclick = () => { gotoNextProject(p); };
}

/* 实战工坊的「实战项目」详情。这是那个缺失的函数 —— render() 里一直在调它。 */
function renderProject() {
  const p = findProject(View.projectId);
  if (!p) {                       // 项目 id 失效（数据改过名 / 存档串了），退回方向列表
    View.projectId = null;
    return renderTracks();
  }
  const track = trackOfProject(p.id);
  // 补一步 trackId：projectId 可能是从别的入口带进来的（标签切换、测试、以后的分享链接），
  // 不补的话侧栏和返回按钮会指向错误的方向
  if (track) View.trackId = track.id;
  renderProjectDetail(p, {
    label: track ? `← 返回「${track.name}」` : '← 返回全部方向',
    go: () => { View.projectId = null; render(); }
  });
}

/* 做完一个项目后跳到「同一条线上」的下一个。
   项目工坊的项目在 PROJECTS 里，板块项目在自己方向的 projects 里 ——
   跨来源乱跳会让人莫名其妙，所以在各自范围内循环。 */
function gotoNextProject(p) {
  const track = trackOfProject(p.id);
  if (track) {
    const list = track.projects;
    const i = list.findIndex(x => x.id === p.id);
    View.trackId = track.id;
    View.projectId = list[(i + 1) % list.length].id;
  } else {
    const i = PROJECTS.findIndex(x => x.id === p.id);
    View.projectId = PROJECTS[(i + 1) % PROJECTS.length].id;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function completeProject(p) {
  if (!State.proj[p.id]) {
    State.proj[p.id] = true;
    State.xp += XP_PROJECT;
    touchStreak();
    saveState();
    renderHud(true); renderSidebar(); checkAchievements();
    showModal('🏗️', '项目完成！', `你做出了「${esc(p.name)}」——这是一个能独立运行的程序了。`, XP_PROJECT,
      () => { gotoNextProject(p); });
    toast(`项目完成，获得 ${XP_PROJECT} XP`, 'ok');
  } else {
    showModal('✅', '再次通过', '这个项目你已经完成过了，经验值不重复发放。', 0, null);
  }
}

/* ---------------- 挑战模块 ---------------- */
function renderChallenges() {
  if (!View.challengeId) {
    // 列表页
    const solvedN = solvedChallenges(State);
    const byLevel = [1, 2, 3].map(lv => ({
      lv,
      info: CHALLENGE_LEVELS.find(l => l.level === lv),
      items: CHALLENGES.filter(c => c.level === lv)
    }));

    $('#stage').innerHTML = `
      <div class="ws-hero">
        <h1>⚔️ 挑战场</h1>
        <p>这里没有手把手讲解，只有题目、示例和隐藏测试。自己想办法，参考答案要失败 ${CHALLENGE_UNLOCK_AFTER} 次才解锁。</p>
        <div class="ws-meta">
          <span class="ws-chip">共 ${CHALLENGES.length} 题</span>
          <span class="ws-chip">已解决 ${solvedN} 题</span>
          <span class="ws-chip">入门 ${byLevel[0].items.length} / 进阶 ${byLevel[1].items.length} / 困难 ${byLevel[2].items.length}</span>
        </div>
      </div>
      ${byLevel.map(g => `
        <div class="section-title">${g.info.icon} ${g.info.name} <span class="count">${g.items.filter(c => State.solved[c.id]).length} / ${g.items.length}</span></div>
        <div class="chal-grid">
          ${g.items.map(c => {
            const done = !!State.solved[c.id];
            const tries = challengeTries(c);
            const unlocked = solutionUnlocked(c);
            return `
            <button class="chal-card ${done ? 'done' : ''}" data-chal="${c.id}">
              ${done ? '<span class="chal-status">✓ 已通过</span>' : ''}
              <div class="chal-top">
                <span class="chal-level" style="background:${g.info.color}">${g.info.badge}</span>
                <div>
                  <p class="chal-name">${esc(c.title)}</p>
                  <p class="chal-tags">${c.tags.map(t => `<span class="proj-tag">${esc(t)}</span>`).join('')}</p>
                </div>
              </div>
              <p class="chal-brief">${esc(briefOf(c.desc, 72))}</p>
              <div class="chal-meta">
                <span>${done ? '已获' : ''} +${g.info.xp} XP</span>
                <span>${tries > 0 ? '已尝试 ' + tries + ' 次' : '还没试过'}</span>
                ${!done && unlocked ? '<span class="chal-unlocked">🔓 答案已解锁</span>' : ''}
              </div>
            </button>`;
          }).join('')}
        </div>
      `).join('')}`;

    $('#stage').querySelectorAll('[data-chal]').forEach(el => el.onclick = () => {
      View.challengeId = el.dataset.chal; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return;
  }

  // 详情页
  const c = CHALLENGES.find(x => x.id === View.challengeId) || CHALLENGES[0];
  const done = !!State.solved[c.id];
  const info = challengeLevel(c);
  const unlocked = solutionUnlocked(c);
  const draft = getDraft('chal:' + c.id, c.starter, '');

  $('#stage').innerHTML = `
    <div class="card">
      <div class="quest-head">
        <div class="quest-crumb">⚔️ 挑战场 &nbsp;›&nbsp; ${info.icon} ${info.name}</div>
        <div class="quest-title">
          <h1>${esc(c.title)}</h1>
          <span class="quest-tag ${done ? 'done' : ''}">${done ? '✓ 已通过' : '+' + info.xp + ' XP'}</span>
          ${starBtnHTML(c.id)}
        </div>
        <div class="chal-tags" style="margin-top:6px">${c.tags.map(t => `<span class="proj-tag">${esc(t)}</span>`).join('')}</div>
      </div>
      <div class="lesson-body">${c.desc}</div>
      <div style="padding:0 24px 18px">
        <div class="section-title">输入输出示例</div>
        <div class="spec-list">
          ${c.specs.map(s => `
            <div class="spec-item">
              <code class="spec-call">${esc(s.call)}</code>
              <span class="spec-arrow">→</span>
              <code class="spec-out">${esc(s.out)}</code>
              ${s.note ? `<span class="spec-note">${esc(s.note)}</span>` : ''}
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="quest-head" style="padding:16px 24px;border-bottom:1px solid var(--border)">
        <div class="quest-crumb" style="margin:0">✍️ 写代码</div>
        <p class="quest-goal" style="margin-top:6px">实现函数，然后点 <strong>提交判题</strong>。隐藏测试会自动检查边界情况。</p>
      </div>
      ${editorHTML(c.id, draft.code, '', 'main.py')}
      <div style="padding:16px 20px 0"><div data-verdict></div></div>
      <div style="padding:0 20px 18px">
        <details class="fold" data-fold="hint">
          <summary>💡 思路提示</summary>
          <div class="fold-body">${c.hint}</div>
        </details>
        <details class="fold" ${unlocked ? '' : 'disabled'}>
          <summary>🔑 参考答案 ${unlocked ? '' : `（再失败 ${Math.max(0, CHALLENGE_UNLOCK_AFTER - challengeTries(c))} 次解锁）`}</summary>
          <div class="fold-body"><pre><code>${esc(c.solution)}</code></pre></div>
        </details>
      </div>
      <div class="quest-nav">
        <button class="btn btn-ghost" id="back-chal">← 返回挑战列表</button>
        <button class="btn btn-ghost" id="next-chal">下一题 →</button>
      </div>
    </div>`;

  const card = $('#stage').querySelector('.editor-card');
  wireEditor(card.parentElement, c, 'chal', (firstTry) => completeChallenge(c, firstTry), () => failChallenge(c));

  $('#back-chal').onclick = () => { View.challengeId = null; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#next-chal').onclick = () => {
    const i = CHALLENGES.findIndex(x => x.id === c.id);
    View.challengeId = CHALLENGES[(i + 1) % CHALLENGES.length].id;
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

function failChallenge(c) {
  State.attempts = State.attempts || {};
  State.attempts[c.id] = (State.attempts[c.id] || 0) + 1;
  saveState();
  // 如果这次失败刚好触发了答案解锁，刷新页面让用户看到
  if (solutionUnlocked(c)) {
    toast('🔓 参考答案已解锁', 'ok');
    render();
  }
}

function completeChallenge(c, firstTry) {
  if (!State.solved[c.id]) {
    State.solved[c.id] = true;
    const info = challengeLevel(c);
    State.xp += info.xp;
    if (firstTry) State.perfect[c.id] = true;
    touchStreak();
    saveState();
    renderHud(true); renderSidebar(); checkAchievements();
    const i = CHALLENGES.findIndex(x => x.id === c.id);
    const next = CHALLENGES[(i + 1) % CHALLENGES.length];
    showModal('⚔️', '挑战通过！', `「${esc(c.title)}」解决${firstTry ? ' —— 一次就过，厉害！' : '。'}`, info.xp,
      () => { View.challengeId = next.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
      { stay: '留在此题', next: '下一题 →' });
    toast(`获得 ${info.xp} XP`, 'ok');
  } else {
    showModal('✅', '再次通过', '这道挑战你已经解决过了，经验值不重复发放。', 0, null);
  }
}

/* ---------------- 成就 ---------------- */
function checkAchievements() {
  let changed = false;
  ACHIEVEMENTS.forEach(a => {
    if (!State.unlocked[a.id] && a.test(State)) {
      State.unlocked[a.id] = true;
      changed = true;
      setTimeout(() => toast(`🏆 解锁成就：<strong>${a.name}</strong><br><span style="font-weight:500;color:var(--text-3)">${a.desc}</span>`, 'ach'), 600);
    }
  });
  if (changed) saveState();
}

function renderAchievements() {
  const info = levelInfo(State.xp);
  const unlocked = Object.keys(State.unlocked || {}).length;
  $('#stage').innerHTML = `
    <div class="card">
      <div class="quest-head">
        <div class="quest-crumb">🏆 我的冒险档案</div>
        <div class="quest-title"><h1>Lv.${info.level} ${info.isMax ? '· 满级' : ''}</h1>
          <span class="quest-tag">${State.xp} XP</span></div>
        <p class="quest-goal">${info.isMax ? '你已经到达最高等级，厉害！' : `再获得 ${info.next - State.xp} XP 就能升到 Lv.${info.level + 1}。`}</p>
      </div>
      <div class="lesson-body">
        <div class="stat-grid">
          <div class="stat"><div class="stat-num">${doneIn(State, LESSON_CHAPTERS)}<span style="font-size:15px;color:var(--text-3)"> / ${countLessons(LESSON_CHAPTERS)}</span></div><div class="stat-label">🗺️ 基础关卡</div></div>
          <div class="stat"><div class="stat-num">${doneIn(State, ADVANCED_CHAPTERS)}<span style="font-size:15px;color:var(--text-3)"> / ${countLessons(ADVANCED_CHAPTERS)}</span></div><div class="stat-label">🎓 进阶关卡</div></div>
          <div class="stat"><div class="stat-num">${doneProjects(State)}<span style="font-size:15px;color:var(--text-3)"> / ${PROJECTS.length}</span></div><div class="stat-label">已完成项目</div></div>
          <div class="stat"><div class="stat-num">${solvedChallenges(State)}<span style="font-size:15px;color:var(--text-3)"> / ${CHALLENGES.length}</span></div><div class="stat-label">⚔️ 已通过挑战</div></div>
          <div class="stat"><div class="stat-num">${unlocked}<span style="font-size:15px;color:var(--text-3)"> / ${ACHIEVEMENTS.length}</span></div><div class="stat-label">解锁成就</div></div>
          <div class="stat"><div class="stat-num">${State.streak || 1}</div><div class="stat-label">连续学习天数</div></div>
          <div class="stat"><div class="stat-num">${State.errorFixes || 0}</div><div class="stat-label">处理过的报错</div></div>
          <div class="stat"><div class="stat-num">${Object.keys(State.perfect || {}).length}</div><div class="stat-label">一次通过</div></div>
        </div>

        <div class="section-title">成就徽章 <span class="count">${unlocked} / ${ACHIEVEMENTS.length}</span></div>
        <div class="ach-grid">
          ${ACHIEVEMENTS.map(a => `
            <div class="ach ${State.unlocked[a.id] ? 'unlocked' : 'locked'}">
              <span class="ach-ico">${State.unlocked[a.id] ? a.ico : '🔒'}</span>
              <div><p class="ach-name">${a.name}</p><p class="ach-desc">${a.desc}</p></div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ---------------- 引擎状态条 ---------------- */
function engineStatus(text, kind) {
  const bar = $('#engine-bar');
  bar.className = 'engine-bar' + (kind === 'ok' ? ' ok' : kind === 'err' ? ' err' : '');
  $('#engine-text').textContent = text;
  $('#engine-retry').hidden = kind !== 'err';
  // 引擎就绪/失败后顺手刷新侧栏那个常驻指示，别等状态条消失了才发现没更新
  if (kind === 'ok' || kind === 'err') updateEngineBadge();
  if (kind === 'ok') setTimeout(() => { bar.style.display = 'none'; }, 2200);
}

/* 侧栏常驻指示：现在跑的是本机 Python，还是内置引擎。
   桌面版和网页版的差别全在这里，学生遇到问题要能一眼说清自己在用哪种。 */
function updateEngineBadge() {
  const el = $('#engine-badge');
  const txt = $('#engine-badge-text');
  if (!el || !txt) return;
  const info = PyRunner.engineInfo;
  el.hidden = false;
  if (!PyRunner.isReady) {
    el.className = 'engine-badge err';
    txt.textContent = 'Python 引擎未就绪，代码暂时跑不了';
  } else if (PyRunner.engine === 'native' && info) {
    el.className = 'engine-badge native';
    // 侧栏只有 260px 宽，这行字太长会把末尾单独挤到第二行（出现「孤儿字」），
    // 所以刻意写得短。完整说明在引擎状态条里已经出现过一次了。
    txt.textContent = '本机 Python ' + info.version + ' · 可用第三方库';
  } else {
    el.className = 'engine-badge pyodide';
    txt.textContent = '内置 Python 引擎 · 免安装';
  }
}

/* 桌面版：把版本号显示在标题旁边。
   为什么值得显示：安装包里能看到号的地方只有安装程序文件名和「控制面板 → 卸载」，
   学生装完打开应用反而看不见自己装的是哪一版；两边一混，「新版到底装上了没」就说不清。
   号来自 desktop/package.json —— 和安装包文件名、卸载项显示名同一个来源，不另存一份。
   网页版没有原生壳，拿不到就保持 hidden，不留一个假的号。 */
async function showAppVersion() {
  const el = $('#brand-version');
  if (!el || !window.pqApp || !window.pqApp.info) return;
  try {
    const info = await window.pqApp.info();
    if (!info || !info.version) return;
    el.textContent = 'v' + info.version;
    el.title = '桌面版 v' + info.version + ' · Electron ' + info.electron +
               ' · ' + info.platform + '/' + info.arch;
    el.hidden = false;
  } catch (_) { /* 读不到就不显示，不影响任何功能 */ }
}

/* ---------------- 我的收藏 ---------------- */
function renderStarred() {
  const items = starredItems();
  const n = k => items.filter(i => i.kind === k).length;

  $('#stage').innerHTML = `
    <div class="ws-hero">
      <h1>⭐ 我的收藏</h1>
      <p>做题时随手加星的关卡、项目和挑战题都在这里，最近加星的排在最前。
      卡住的地方最值得回头再看一遍 —— 现在你不用靠记忆去找它了。</p>
      <div class="ws-meta">
        <span class="ws-chip">共 ${items.length} 项</span>
        <span class="ws-chip">关卡 ${n('lesson')}</span>
        <span class="ws-chip">项目 ${n('project')}</span>
        <span class="ws-chip">挑战 ${n('chal')}</span>
      </div>
    </div>
    ${items.length ? items.map(it => `
      <div class="star-item" data-go="${esc(it.id)}" data-kind="${it.kind}">
        <span class="star-item-ico">${it.icon}</span>
        <span class="star-item-main">
          <strong>${esc(it.title)}</strong>
          <small>${esc(it.sub)}${State.done[it.id] || State.proj[it.id] || State.solved[it.id] ? ' · 已完成' : ''}</small>
        </span>
        ${starBtnHTML(it.id)}
      </div>`).join('')
    : `<div class="card empty-card">
         还没有收藏。<br>在任意关卡、项目或挑战的标题旁点一下 <strong>☆</strong>，它就会出现在这里。
       </div>`}`;

  $('#stage').querySelectorAll('[data-go]').forEach(el => {
    el.onclick = ev => {
      // 点星是「取消收藏」，不能顺手跳走
      if (ev.target.closest && ev.target.closest('[data-star]')) return;
      goToItem(el.dataset.go, el.dataset.kind);
    };
  });
}

/* ---------------- 总渲染 ---------------- */
function render() {
  // 实战工坊里，当前关卡属于哪个方向就进哪个方向。
  // 补这一步是因为「带着 lessonId 直接进来」的路不止一条（标签切换、测试、
  // 以后可能的分享链接），让每个入口都自己记得设 trackId 迟早会漏 ——
  // 漏了的表现就是侧栏和章节列表全是空的。
  if (View.tab === 'tracks' && View.lessonId) {
    const t = trackOfLesson(View.lessonId);
    if (t) View.trackId = t.id;
  }
  if (View.tab === 'workshop') renderWorkshop();
  // 实战工坊有三种页面：方向列表 / 方向详情 / 关卡页。
  // 只要当前 lessonId 属于某个方向，就该渲染关卡页 —— 否则点进关卡会看不到编辑器。
  else if (View.tab === 'tracks') {
    if (View.projectId) renderProject();
    else if (View.lessonId && trackOfLesson(View.lessonId)) renderLesson();
    else renderTracks();
  }
  else if (View.tab === 'starred') renderStarred();
  else if (View.tab === 'challenges') renderChallenges();
  else if (View.tab === 'achievements') renderAchievements();
  else renderLesson();
  renderSidebar();
  renderHud(false);
}

function syncTabs() {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.view === View.tab));
}

/* ---------------- 启动 ---------------- */
function touchStreak() {
  const t = today();
  if (State.lastActive === t) return;
  const y = new Date(Date.now() - 86400000);
  const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  State.streak = State.lastActive === yStr ? (State.streak || 1) + 1 : 1;
  State.lastActive = t;
}

function boot() {
  loadState();
  touchStreakIfSameDay();
  saveState();
  applyTheme();

  const flat = flatLessons(LESSON_CHAPTERS);
  View.lessonId = (flat.find(x => !State.done[x.lesson.id]) || flat[0]).lesson.id;

  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    View.tab = t.dataset.view;
    // 切到关卡 / 进阶时，如果当前 lessonId 不属于该模块，落到该模块第一关未完成的
    if (View.tab === 'map' || View.tab === 'advanced') {
      const list = flatLessons(activeChapters());
      if (!list.some(x => x.lesson.id === View.lessonId)) {
        View.lessonId = (list.find(x => !State.done[x.lesson.id]) || list[0]).lesson.id;
      }
    }
    // 切标签一律清掉 projectId。项目详情页是两个板块共用的一套渲染，
    // 不清的话会出现在「项目工坊」里看实战项目、返回按钮却指向别处的情况。
    View.projectId = null;
    // 进实战工坊先看方向列表。如果当前关卡就属于某个方向，直接进那个方向，
    // 省得用户再从列表里找一遍。
    if (View.tab === 'tracks') {
      const t = trackOfLesson(View.lessonId);
      View.trackId = t ? t.id : null;
    } else {
      // 离开时把方向状态清掉，回来才是干净的
      View.trackId = null;
    }
    syncTabs(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#btn-reset').onclick = () => {
    if (!confirm('确定要清空全部进度吗？\n\n' +
        '将清空：通关记录、XP 与等级、成就、错题本、收藏、学习笔记、提交历史，\n' +
        '以及你在编辑器里写的代码草稿（会还原成每关的初始代码）。\n\n' +
        '此操作不可撤销。')) return;
    // 之前这里刻意把 drafts 留下了，结果就是「重置完自己写的代码还在」——
    // 用户点这个按钮的意思就是一键回到干净状态，草稿属于要清的东西。
    // 顺手把还挂着的防抖存盘定时器停掉：它会在 400ms 后再存一次，
    // 虽然存的是已经重置过的 State，但没必要留这个尾巴。
    clearTimeout(saveDraft._t);
    // theme 与 updateSkip 是「外观 / 更新」偏好，不是学习进度：
    // 清进度不该顺手把深色模式翻回浅色，也不该让忽略过的更新重新弹出来。
    const keep = { theme: State.theme, updateSkip: State.updateSkip };
    State = defaultState();
    State.theme = keep.theme || 'auto';
    State.updateSkip = keep.updateSkip || null;
    saveState();
    applyTheme();
    render(); toast('进度已重置', 'bad');
  };

  const thBtn = $('#btn-theme');
  if (thBtn) thBtn.onclick = cycleTheme;
  // auto 档要跟着系统走：用户在系统设置里换了深色，页面得立刻跟上
  try {
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mq && mq.addEventListener) {
      mq.addEventListener('change', () => { if (themeOf() === 'auto') applyTheme(); });
    }
  } catch (e) {}

  const starEntry = $('#btn-starred');
  if (starEntry) starEntry.onclick = () => {
    View.tab = 'starred';
    syncTabs(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* 加星按钮用事件委托。它出现在关卡 / 项目 / 挑战三种页面里，
     渲染函数各绑一次迟早漏一处 —— 漏了的表现是「点了没反应」，
     跟之前 renderProject 那个 bug 一样难查。 */
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-star]') : null;
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const id = b.dataset.star;
    const on = toggleStar(id);
    toast(on ? '已收藏 —— 左下角「我的收藏」里能找到' : '已取消收藏', on ? 'ok' : 'bad');
    if (View.tab === 'starred') {
      render();
    } else {
      document.querySelectorAll('[data-star="' + id + '"]').forEach(x => {
        x.classList.toggle('on', on);
        x.textContent = on ? '★' : '☆';
        x.title = on ? '取消收藏' : '收藏，稍后回来复习';
      });
      renderSidebar();
    }
  });

  $('#engine-retry').onclick = () => {
    engineStatus('正在重试…');
    PyRunner.init(engineStatus).catch(() => { updateEngineBadge(); });
  };

  // 窄屏下折叠/展开冒险地图（桌面端这个按钮不显示）
  const sidebarToggle = $('#sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.onclick = () => {
      const sb = $('#sidebar');
      sb.classList.toggle('expanded');
      sidebarToggle.textContent = sb.classList.contains('expanded') ? '▴' : '▾';
    };
  }

  render();
  showAppVersion();
  wireUpdater();          // 非桌面版会自己退出，网页版行为不变
  PyRunner.init(engineStatus).catch(() => { updateEngineBadge(); });
}

function touchStreakIfSameDay() {
  // 打开页面不算打卡；但如果今天已经学过，保持连击不重置
  const t = today();
  if (!State.lastActive) { State.lastActive = t; State.streak = 1; return; }
  const y = new Date(Date.now() - 86400000);
  const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  if (State.lastActive !== t && State.lastActive !== yStr) {
    State.streak = 1;   // 断签了
  }
}

/* ---------------- 自动更新（桌面版） ----------------
   只在这三件事上跟主进程打交道：
     1. 启动时查一次更新（check）
     2. 用户点「下载并更新」时下载（download，主进程会推进度事件）
     3. 下完点「安装并重启」时启动安装包（install，测试模式是 dry-run）

   网页版和手机版没有 window.pqUpdater，这一整段不生效，行为跟加它之前一样。
   检查失败（没配地址 / 离线 / 服务器挂了）一律静默 —— 学生是来学 Python 的，
   不该被一条「连不上更新服务器」的提示打断。 */
let updateBusy = false;
let updatePending = null;        // 当前横幅对应的清单，点「忽略」时记它的版本号

function updateEls() {
  return {
    box: $('#update-banner'),
    title: $('#update-title'),
    notes: $('#update-notes'),
    progress: $('#update-progress'),
    bar: $('#update-progress-bar'),
    pct: $('#update-progress-text'),
    btn: $('#update-btn'),
    skip: $('#update-skip')
  };
}

function showUpdateBanner(m) {
  const els = updateEls();
  if (!els.box) return false;
  if (State.updateSkip === m.version) return false;   // 这个版本用户说过「别烦我」
  updatePending = m;
  els.title.textContent = '发现新版本 v' + m.version;
  els.notes.textContent = m.notes || '更新内容见发布说明。';
  els.progress.hidden = true;
  els.bar.style.width = '0%';
  els.btn.disabled = false;
  els.btn.textContent = '下载并更新';
  els.box.hidden = false;
  return true;
}

function setUpdateProgress(received, total) {
  const els = updateEls();
  if (!els.box) return;
  els.progress.hidden = false;
  if (total > 0) {
    const pct = Math.min(100, Math.round(received / total * 100));
    els.bar.style.width = pct + '%';
    els.pct.textContent = pct + '%';
  } else {
    // 服务器没给 Content-Length：进度条画不出来，但要说清还在动
    els.bar.style.width = '100%';
    els.pct.textContent = '下载中…';
  }
}

function wireUpdater() {
  const up = typeof window !== 'undefined' ? window.pqUpdater : null;
  if (!up || typeof up.check !== 'function') return false;   // 非桌面版直接不启动
  const els = updateEls();
  if (!els.box) return false;

  up.onEvent(ev => {
    // 处理事件时抛异常不能把后续事件一起带走 —— 一条坏消息不该让整个
    // 更新流程从此失聪。preload 那边也有一层 try/catch，这里再兜一次是因为
    // 逻辑错在这里，主进程给的信息越完整，越容易看出是哪条事件出的问题。
    try {
      handleUpdateEvent(ev);
    } catch (e) {
      console.error('[updater] 处理更新事件出错', e);
    }
  });

  function handleUpdateEvent(ev) {
    if (!ev) return;
    if (ev.type === 'downloading') {
      setUpdateProgress(ev.received, ev.total);
    } else if (ev.type === 'ready') {
      els.bar.style.width = '100%';
      els.pct.textContent = '100%';
      els.btn.disabled = false;
      els.btn.textContent = '安装并重启';
      els.btn.onclick = async () => {
        if (updateBusy) return;
        updateBusy = true;
        els.btn.disabled = true;
        try {
          const r = await up.install({ path: ev.path });
          if (r && r.ok && r.dryRun) {
            toast('测试模式：跳过了真实安装（' + (r.cmd || []).join(' ') + '）', 'ok');
            els.btn.disabled = false;
          } else if (!r || !r.ok) {
            els.btn.disabled = false;
            els.btn.textContent = '重试安装';
            toast('启动安装失败：' + ((r && r.reason) || '未知错误'), 'bad');
          }
          // 真的装成功时应用会自己退出，不需要在这里收尾
        } finally {
          updateBusy = false;
        }
      };
    } else if (ev.type === 'error') {
      els.btn.disabled = false;
      els.btn.textContent = '重试下载';
      toast('更新出错：' + (ev.message || '未知错误'), 'bad');
    }
  }

  els.btn.onclick = async () => {
    if (updateBusy) return;
    updateBusy = true;
    els.btn.disabled = true;
    els.btn.textContent = '下载中…';
    try {
      const r = await up.download();
      if (!r || !r.ok) {
        els.btn.disabled = false;
        els.btn.textContent = '重试下载';
        toast('下载失败：' + ((r && r.reason) || '未知错误'), 'bad');
      }
      // 成功那条路走 ready 事件，那里会把按钮换成「安装并重启」
    } finally {
      updateBusy = false;
    }
  };

  els.skip.onclick = () => {
    if (updatePending) State.updateSkip = updatePending.version;
    els.box.hidden = true;
    saveState();
  };

  up.check().then(r => {
    if (r && r.ok && r.newer && r.manifest) showUpdateBanner(r.manifest);
  }).catch(() => {});
  return true;
}

document.addEventListener('DOMContentLoaded', boot);

/* ---------------- 原生壳（Android WebView）返回键钩子 ----------------
   返回 'handled' 表示页面自己消化了这次返回（关了弹窗 / 退了一层），
   返回 'exit' 表示可以退出应用。桌面浏览器里这段代码不会有任何副作用。 */
window.__pyquestBack = function () {
  const mask = document.getElementById('modal-mask');
  if (mask && !mask.hidden) { mask.hidden = true; return 'handled'; }
  if (View.tab === 'workshop' && View.projectId) { View.projectId = null; render(); return 'handled'; }
  if (View.tab === 'tracks') {
    if (View.projectId) { View.projectId = null; render(); return 'handled'; }
    if (View.trackId && (View.lessonId || false) && trackOfLesson(View.lessonId)) {
      View.lessonId = null; render(); return 'handled';
    }
    if (View.trackId) { View.trackId = null; render(); return 'handled'; }
  }
  if (View.tab === 'challenges' && View.challengeId) { View.challengeId = null; render(); return 'handled'; }
  if (View.tab !== 'map') { View.tab = 'map'; syncTabs(); render(); return 'handled'; }
  return 'exit';
};
