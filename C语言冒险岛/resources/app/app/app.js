(function () {
  'use strict';

  const STORE_KEY = 'cpp-quest-state-v1';
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function defaultState() {
    return {
      done: {},
      xp: 0,
      theme: '',
      currentView: 'map',
      currentDetail: null,
      wrong: [],
      dailyDone: [],
      dailyCursor: 0,
      sidebarVisible: true,
      fontSize: 100
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      return Object.assign(defaultState(), saved || {}, { currentView: 'map', currentDetail: null });
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  const state = loadState();

  const BASE_ORDER = ['ch1', 'ch2', 'ch4', 'ch3', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10'];
  const ADV_ORDER = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'];
  function orderChapters(chapters, order) {
    return order.map((id) => chapters.find((ch) => ch.id === id)).filter(Boolean);
  }
  const BASE_CHAPTERS = orderChapters(LESSON_CHAPTERS, BASE_ORDER);
  const ADV_CHAPTERS = orderChapters(ADVANCED_CHAPTERS, ADV_ORDER);
  const BASE_LESSONS = BASE_CHAPTERS.flatMap((ch) => ch.lessons);
  const ADV_LESSONS = ADV_CHAPTERS.flatMap((ch) => ch.lessons);
  const ALL_LESSONS = [...BASE_LESSONS, ...ADV_LESSONS];

  const levelFromXp = (xp) => Math.floor(xp / 100) + 1;

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(message) {
    const layer = $('#toast-layer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function applyTheme() {
    const theme = state.theme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    $('#btn-theme').textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function updateHud() {
    const level = levelFromXp(state.xp);
    $('#hud-level').textContent = level;
    $('#hud-xp').textContent = state.xp;
    $('#xpbar').style.width = ((state.xp % 100) / 100 * 100) + '%';
  }

  function showServerWarning(message) {
    const el = $('#server-warning');
    if (message) {
      el.hidden = false;
      el.textContent = message;
    } else {
      el.hidden = true;
    }
  }

  async function checkHealth() {
    try {
      const data = await api('/api/health', {});
      if (data && data.ok) {
        showServerWarning('');
        return true;
      }
      showServerWarning('无法连接本地 C 语言编译服务，请先运行 node server.js 后刷新页面。');
      return false;
    } catch (e) {
      showServerWarning('无法连接本地 C 语言编译服务，请先运行 node server.js 后刷新页面。');
      return false;
    }
  }

  async function api(path, body) {
    if (window.cppNative) {
      if (path === '/api/run') return window.cppNative.run(body || {});
      if (path === '/api/check') return window.cppNative.check(body || {});
      if (path === '/api/health') return window.cppNative.health();
    }
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    return res.json();
  }

  function isDone(id) {
    return Boolean(state.done[id]);
  }

  function isDailyDone(id) {
    return (state.dailyDone || []).includes(id);
  }

  function markDone(id, xp) {
    if (state.done[id]) return false;
    state.done[id] = true;
    state.xp += xp || 0;
    saveState();
    updateHud();
    return true;
  }

  function markDailyDone(id, xp) {
    if (!state.dailyDone) state.dailyDone = [];
    if (state.dailyDone.includes(id)) return false;
    state.dailyDone.push(id);
    state.xp += xp || 0;
    saveState();
    updateHud();
    return true;
  }

  function addWrong(type, id, title) {
    if (!state.wrong) state.wrong = [];
    if (!state.wrong.some((w) => w.type === type && w.id === id)) {
      state.wrong.push({ type, id, title, at: Date.now() });
      saveState();
      toast('已加入错题本');
    }
  }

  function setView(view) {
    state.currentView = view;
    state.currentDetail = null;
    // AI 助手现在使用本地离线问答，不再覆盖页面。
    $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.view === view));
    renderNavSidebar(view);
    renderStage();
  }

  function viewHeader(icon, title, subtitle) {
    return `<div class="view-title">${icon} ${title}</div><div class="view-subtitle">${subtitle}</div>`;
  }

  function chapterProgress(lessons) {
    const done = lessons.filter((l) => isDone(l.id)).length;
    return `${done} / ${lessons.length}`;
  }


  function renderNavSidebar(view) {
    const sidebar = $('#sidebar');
    if (view !== 'map' && view !== 'advanced') {
      sidebar.hidden = true;
      return;
    }
    sidebar.hidden = false;
    sidebar.classList.toggle('collapsed', state.sidebarVisible === false);
    const arrow = $('#sidebar-arrow');
    if (arrow) arrow.textContent = state.sidebarVisible === false ? '▶' : '◀';
    $('#sidebar-title').textContent = view === 'map' ? '冒险地图' : '进阶地图';
    const chapters = view === 'map' ? BASE_CHAPTERS : ADV_CHAPTERS;
    $('#sidebar-body').innerHTML = chapters.map((ch) => `
      <div class="sidebar-group">
        <div class="sidebar-group-title">${ch.icon} ${ch.title}</div>
        ${ch.lessons.map((l) => `
          <button class="sidebar-link ${isDone(l.id) ? 'done' : ''}" data-open-lesson="${l.id}" data-back="${view}">
            <span>${isDone(l.id) ? '✓ ' : ''}${l.title}</span><span class="mini">${l.xp} XP</span>
          </button>`).join('')}
      </div>`).join('');
  }

  function renderChapterGrid(chapters, backView) {
    return `<div class="map-board chapter-grid">${chapters.map((ch, index) => `
      <article class="map-card chapter-card"><span class="map-node">${index + 1}</span>
        <h3>${ch.icon} ${ch.title}</h3>
        <div class="chapter-sub">${ch.subtitle} · ${chapterProgress(ch.lessons)}</div>
        <div class="lesson-list">${ch.lessons.map((lesson) => `
          <button class="lesson-item ${isDone(lesson.id) ? 'done' : ''}" data-open-lesson="${lesson.id}" data-back="${backView}">
            <span>${isDone(lesson.id) ? '<span class="check">✓</span> ' : ''}${lesson.title}</span>
            <span class="xp">${lesson.xp} XP</span>
          </button>`).join('')}
        </div>
      </article>`).join('')}
      <div class="reference-panel panel" id="reference-panel" hidden>
        <div class="panel-title"><span>参考答案</span><button class="btn ghost small-btn" id="ref-hide">隐藏</button></div>
        <pre class="reference-code" id="reference-code"></pre>
      </div>
    </div>`;
  }

  function renderMap() {
    return viewHeader('🗺️', '冒险关卡', '从第一句 printf 开始，慢慢学会 C 语言基础。') +
      renderChapterGrid(BASE_CHAPTERS, 'map');
  }

  function renderAdvanced() {
    return viewHeader('🧭', '进阶地图', '数组、函数、指针、结构体、文件和标准库，学完能独立写 C 小程序。') +
      renderChapterGrid(ADV_CHAPTERS, 'advanced');
  }

  function renderChallenges() {
    const cards = CHALLENGES.map((ch) => {
      const lv = CHALLENGE_LEVELS.find((x) => x.level === ch.level) || {};
      return `
      <article class="challenge-card">
        <div class="ch-top">
          <h3>${ch.title}</h3>
          <span class="level-badge" style="background:${lv.color || 'var(--surface-2)'}">${lv.icon || ''} ${lv.name || ''}</span>
        </div>
        <div class="tags">${(ch.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        <p class="challenge-desc">${(ch.desc || '').replace(/<[^>]+>/g, '').slice(0, 80)}</p>
        <div class="specs">${(ch.specs || []).slice(0, 2).map((s) => `<div class="spec"><code>${escapeHtml(s.call)}</code> → ${escapeHtml(s.out)}</div>`).join('')}</div>
        <button class="btn primary" data-open-challenge="${ch.id}">${isDone(ch.id) ? '✓ 已完成' : '开始挑战 · ' + (lv.xp || '') + ' XP'}</button>
      </article>`;
    }).join('');
    return viewHeader('⚔️', '算法挑战', '把基础语法练成解题能力。') +
      `<div class="section-grid">${cards}</div>`;
  }

  function renderProjects() {
    const cards = PROJECTS.map((p) => `
      <article class="project-card">
        <div class="p-top">
          <h3>${p.icon} ${p.title}</h3>
          <span class="level-badge">${p.xp} XP</span>
        </div>
        <p class="challenge-desc">${(p.desc || '').replace(/<[^>]+>/g, '').slice(0, 100)}</p>
        <button class="btn primary" data-open-project="${p.id}">${isDone(p.id) ? '✓ 已完成' : '开始项目'}</button>
      </article>`).join('');
    return viewHeader('🛠️', '实战项目', '把学到的知识点拼成能运行的小程序。') +
      `<div class="section-grid">${cards}</div>`;
  }

  function lessonProgressCount() {
    return ALL_LESSONS.filter((l) => isDone(l.id)).length;
  }

  function getDailyQuestion() {
    const pool = DAILY_QUESTIONS;
    if (!pool.length) return null;
    const cursor = state.dailyCursor || 0;
    const idx = ((cursor % pool.length) + pool.length) % pool.length;
    return pool[idx];
  }

  function shiftDaily(delta) {
    state.dailyCursor = (state.dailyCursor || 0) + delta;
    saveState();
    renderStage();
  }

  function renderDaily() {
    const pool = DAILY_QUESTIONS;
    const q = getDailyQuestion();
    if (!pool.length) {
      return viewHeader('📅', '每日一题', '题库准备中。');
    }
    const cursor = state.dailyCursor || 0;
    const idx = ((cursor % pool.length) + pool.length) % pool.length;
    const round = Math.floor(Math.abs(cursor) / pool.length) + 1;
    return viewHeader('📅', '每日一题', `第 ${Math.abs(cursor) + 1} 题 · 可无限切换。`) + `
      <article class="daily-card">
        <div class="daily-top">
          <div><span class="daily-badge">${round > 1 ? '第 ' + round + ' 轮' : '每日一题'}</span><h3>${q.title}</h3></div>
          <span class="level-badge">${q.xp} XP</span>
        </div>
        <div class="tags">${(q.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="lesson-body">${q.body || ''}</div>
        <div class="daily-actions">
          <button class="btn" id="daily-prev">← 上一题</button>
          <button class="btn primary" data-open-daily="${q.id}">开始答题</button>
          <button class="btn" id="daily-next">下一题 →</button>
        </div>
      </article>`;
  }

  function renderWrong() {
    const rows = (type, title, empty) => {
      const items = (state.wrong || []).filter((w) => w.type === type);
      if (!items.length) return `<section class="wrong-section"><h3>${title}</h3><div class="empty">${empty}</div></section>`;
      return `<section class="wrong-section"><h3>${title}</h3>${items.map((w) => `
        <button class="wrong-item" data-open-wrong="${type}" data-wrong-id="${w.id}">
          <span>${w.title}</span><span class="muted">${new Date(w.at).toLocaleDateString()}</span>
        </button>`).join('')}</section>`;
    };
    return viewHeader('📕', '错题本', '做错的题目会按栏目收集在这里，可以随时回来重做。') + `
      <div class="wrong-list">
        ${rows('lesson', '关卡错题', '还没有关卡错题。')}
        ${rows('advanced', '进阶错题', '还没有进阶错题。')}
        ${rows('daily', '每日一题错题', '还没有每日一题错题。')}
      </div>`;
  }

  function renderAchievements() {
    const lessonsDone = ALL_LESSONS.filter((l) => isDone(l.id)).length;
    const challengesDone = CHALLENGES.filter((c) => isDone(c.id)).length;
    const projectsDone = PROJECTS.filter((p) => isDone(p.id)).length;
    const stats = { first: lessonsDone, starter: lessonsDone, fighter: challengesDone, builder: projectsDone, scholar: state.xp };
    const cards = ACHIEVEMENTS.map((a) => {
      const current = stats[a.id] || 0;
      const unlocked = current >= a.goal;
      const metric = a.id === 'scholar' ? `${current}/${a.goal} XP` : `${Math.min(current, a.goal)}/${a.goal}`;
      return `<article class="achievement ${unlocked ? '' : 'locked'}">
        <div class="a-ico">${unlocked ? a.icon : '🔒'}</div>
        <div><h3>${a.title}</h3><p>${a.desc} · ${metric}</p></div>
      </article>`;
    }).join('');
    return viewHeader('🏆', '成就', '把进度变成奖章。') +
      `<div class="achievements-grid">${cards}</div>`;
  }


  function askLocalAI(question) {
    const q = String(question || '').toLowerCase();
    const rules = [
      [['printf','输出','打印'], 'printf 就是“把内容打印到屏幕”。格式：printf("你好 %d", 数字);'],
      [['scanf','输入','读取'], 'scanf 就是“从键盘读数据”。格式：scanf("%d", &变量); 注意变量前要加 &。'],
      [['数组'], '数组是一排连续的小盒子，下标从 0 开始。int a[5] = {1,2,3,4,5};'],
      [['循环','for','while'], '循环就是重复执行。for(初始化;条件;变化) 适合知道次数；while(条件) 适合不知道次数。'],
      [['函数'], '函数是把一段代码打包并起名。返回类型 函数名(参数){ return 结果; }'],
      [['指针','地址'], '指针保存的是变量的地址。int *p = &x; 用 *p 取地址里的值。'],
      [['结构体'], '结构体是把多种信息放在一起。struct Student { char name[20]; int age; };'],
      [['文件','fopen'], '文件读写用 fopen("文件名","w/r")、fprintf、fscanf、fclose。'],
      [['if','判断','条件'], 'if(条件){ 成立时执行 } else { 否则执行 }，判断相等用 ==。']
    ];
    for (const r of rules) {
      if (r[0].some((k) => q.includes(k))) return r[1];
    }
    return '我会尽量回答你的问题。当前离线版主要熟悉 C 语言和常见学习问题，也可以帮你解释其他科目的题意、给学习建议；如果需要更强大的自然语言模型，请点“打开 DeepSeek 网页版”。';
  }

  const musicStore = { files: [], byName: {} };

  function musicOpenDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('cpp-quest-music', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'name' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function musicLoadCached() {
    try {
      const db = await musicOpenDb();
      const tx = db.transaction('songs', 'readonly');
      const req = tx.objectStore('songs').getAll();
      req.onsuccess = () => {
        (req.result || []).forEach((item) => {
          if (!musicStore.byName[item.name]) {
            musicStore.byName[item.name] = item;
            musicStore.files.push(item);
          }
        });
        renderMusicList();
      };
    } catch (e) {}
  }

  async function musicSaveSong(name, blob) {
    try {
      const db = await musicOpenDb();
      const tx = db.transaction('songs', 'readwrite');
      tx.objectStore('songs').put({ name, blob });
    } catch (e) {}
  }

  function musicAddFiles(files) {
    Array.from(files).forEach((file) => {
      const name = file.name;
      if (musicStore.byName[name]) return;
      const url = URL.createObjectURL(file);
      const item = { name, url, blob: file, lyrics: '' };
      musicStore.byName[name] = item;
      musicStore.files.push(item);
      musicSaveSong(name, file);
    });
    renderMusicList();
  }

  function renderMusicList() {
    const list = $('#music-list');
    const audio = $('#global-audio');
    if (!list) return;
    list.innerHTML = musicStore.files.map((item) => `<button class="music-item" data-name="${escapeHtml(item.name)}">${escapeHtml(item.name)}</button>`).join('');
    if (audio && !audio.src && musicStore.files.length) audio.src = musicStore.files[0].url;
  }

  async function musicLoadLyrics(name) {
    const item = musicStore.byName[name];
    const panel = $('#lyrics');
    if (!item || !panel) return;
    panel.textContent = item.lyrics || '正在识别歌词…';
    const base = name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').trim();
    try {
      const res = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(base)}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0] && data[0].syncedLyrics) {
        item.lyrics = data[0].syncedLyrics;
        panel.textContent = item.lyrics;
        return;
      }
      if (Array.isArray(data) && data[0] && data[0].plainLyrics) {
        item.lyrics = data[0].plainLyrics;
        panel.textContent = item.lyrics;
        return;
      }
    } catch (e) {}
    item.lyrics = '没有自动匹配到歌词。你可以点击下方“编辑歌词”手动粘贴。';
    panel.textContent = item.lyrics;
  }

  const KNOWLEDGE_POINTS = [
    { title: 'printf 格式占位符', body: `<p><code>%d</code> 输出整数；<code>%f</code> 输出浮点数；<code>%c</code> 输出字符；<code>%s</code> 输出字符串。</p><p><code>%6.2f</code> 表示总宽度至少 6 位，保留 2 位小数，不足时前面补空格。</p>` },
    { title: 'scanf 输入', body: `<p><code>scanf("%d", &amp;n)</code> 读取整数，变量前要写 <code>&amp;</code>。</p><p>字符串使用 <code>%s</code>，但遇到空格会停止；需要读一行用 <code>gets</code> 或 <code>fgets</code>。</p>` },
    { title: '转义字符', body: `<p><code>\\n</code> 换行，<code>\\t</code> 制表，<code>\\\\</code> 反斜杠，<code>%%</code> 百分号，<code>\\0</code> 字符串结束。</p>` },
    { title: '运算符优先级', body: `<p>括号最高，其次是单目运算符，再是乘除取余，然后加减，关系、逻辑最后。</p><p>例如 <code>2 + 3 * 4</code> 等于 14，先算 <code>3 * 4</code>。</p>` },
    { title: '选择结构', body: `<p><code>if</code> / <code>else if</code> / <code>else</code> 处理多分支；判断相等用 <code>==</code>，赋值用 <code>=</code>。</p><p><code>switch</code> 适合整数或字符的等值判断。</p>` },
    { title: '循环结构', body: `<p><code>for(初始化; 条件; 变化)</code> 适合知道次数；<code>while</code> 适合条件循环；<code>do while</code> 至少执行一次。</p>` },
    { title: '一维数组', body: `<p><code>int a[5] = {1,2,3,4,5};</code> 下标从 0 开始，最后一个元素是 <code>a[4]</code>。</p>` },
    { title: '二维数组', body: `<p><code>int a[2][3]</code> 表示 2 行 3 列，访问元素用 <code>a[行][列]</code>。</p>` },
    { title: '函数定义与调用', body: `<p>返回类型 函数名(参数列表) { 函数体 return 返回值; }</p><p>函数要先声明或定义，才能被调用。</p>` },
    { title: '指针', body: `<p><code>&amp;x</code> 取地址，<code>*p</code> 取地址里的值。</p><p><code>int *p = &amp;x;</code> 表示 p 保存 x 的地址。</p>` },
    { title: '结构体', body: `<p><code>struct Student { char name[20]; int age; };</code> 把不同类型数据组合在一起。</p>` },
    { title: '文件读写', body: `<p><code>fopen</code> 打开文件，<code>fprintf</code> 写入，<code>fscanf</code> 读取，<code>fclose</code> 关闭。</p>` }
  ];

  function renderKnowledge() {
    const cards = KNOWLEDGE_POINTS.map((it) => `
      <article class="knowledge-card">
        <h3>${it.title}</h3>
        <div class="knowledge-body">${it.body}</div>
      </article>`).join('');
    return viewHeader('📌', '期末考试知识点', '把高频考点单独整理出来，方便考前快速复习。') +
      `<div class="knowledge-list">${cards}</div>`;
  }

  function renderMusic() {
    return viewHeader('🎵', '音乐休息室', '切到其他栏目音乐也不会停；听过的歌会缓存下来。') + `
        <div class="panel-title"><span>音乐播放器</span><button class="music-toggle" id="music-toggle">▶</button></div>
        <div class="music-body">
          <input type="file" id="music-files" accept="audio/*" multiple>
          <div class="music-list" id="music-list"></div>
          <div class="lyrics-box">
            <div class="panel-title"><span>歌词识别</span><button class="btn ghost" id="lyrics-edit">编辑歌词</button></div>
            <pre id="lyrics" class="lyrics">导入歌曲后点击歌名即可识别歌词。</pre>
          </div>
        </div>
      </div>`;
  }

  function renderAI() {
    return viewHeader('🤖', 'AI助手', '离线可用，无需登录；支持 C 语言和一般学习问题。') + `
      <div class="ai-chat">
        <div class="ai-quick">
          <button class="btn" data-ai-question="printf是什么">printf 是什么</button>
          <button class="btn" data-ai-question="scanf怎么用">scanf 怎么用</button>
          <button class="btn" data-ai-question="数组是什么">数组是什么</button>
          <button class="btn" data-ai-question="循环怎么写">循环怎么写</button>
        </div>
        <div class="ai-chat-log" id="ai-log"></div>
        <div class="ai-answer-box">
          <div class="panel-title"><span>回答框</span><span id="ai-image-info"></span></div>
          <div id="ai-answer" class="ai-answer"></div>
        </div>
        <div class="ai-input-row">
          <label class="ai-upload"><span>上传图片</span><input type="file" id="ai-image" accept="image/*" hidden></label>
          <textarea id="ai-input" placeholder="输入你的问题，或粘贴作业题目"></textarea>
    const imageInput = $('#ai-image');
    if (imageInput) imageInput.addEventListener('change', (e) => {
      const f = e.target.files[0];
      const info = $('#ai-image-info');
      if (info) info.textContent = f ? ('图片已选择：' + f.name + '（离线版暂不支持真实识别，请描述题目）') : '';
    });
          <button class="btn primary" id="ai-send">发送</button>
        </div>
        <div class="ai-toolbar"><button class="btn" id="ai-open">打开 DeepSeek 网页版</button></div>
      </div>`;
  }

  function plainHint(item) {
    const words = [
      ['printf', 'printf 就是“打印出来给你看”，把内容显示到屏幕上。'],
      ['scanf', 'scanf 就是“从键盘读你输入的东西”，把输入存进变量。'],
      ['变量', '变量就是“贴了名字的盒子”，用来暂时保存一个数或文字。'],
      ['函数', '函数就是“可以反复调用的一段代码”，把零散步骤打包起来。'],
      ['数组', '数组就是“一排连续的小盒子”，一次能放很多同类数据。'],
      ['循环', '循环就是“重复做同一件事”，直到条件不满足。'],
      ['指针', '指针就是“记住别人家的门牌号”，通过地址找到那个变量。'],
      ['结构体', '结构体就是“一张资料卡”，把名字、年龄等不同信息放在一起。']
    ];
    if (item.plain) return item.plain;
    const text = `${item.title} ${item.goal || ''} ${(item.body || '').replace(/<[^>]+>/g, '')}`;
    const hit = words.find((w) => text.includes(w[0]));
    return hit ? `${item.goal || ''}。大白话：${hit[1]}` : (item.goal || '完成本题');
  }
  function setOutput(result) {
    const out = $('#output');
    const status = $('#status');
    const box = $('#error-box');
    out.textContent = '';
    status.textContent = '';
    status.className = 'status';
    if (box) box.hidden = true;
    if (result.compileError) {
      const errors = explainCompileError(result.stderr || result.message || '');
      out.textContent = errors.join('\n') || '编译失败';
      out.className = 'output stderr';
      status.textContent = '编译失败';
      status.className = 'status fail';
      if (box) {
        const raw = String(result.stderr || result.message || '');
        const matches = raw.match(/main\.c:(\d+):(?:\d+):\s*(?:error|warning):\s*(.*)/g) || [];
        box.innerHTML = matches.length ? matches.map((m) => {
          const mm = m.match(/main\.c:(\d+):(?:\d+):\s*(?:error|warning):\s*(.*)/);
          return `<div class="error-item" data-line="${mm[1]}">第 ${mm[1]} 行：${escapeHtml(mm[2])}</div>`;
        }).join('') : `<div class="error-item">编译失败，请查看上方输出。</div>`;
        box.hidden = false;
      }
      return;
    }
    if (result.timedOut) {
      out.textContent = '程序运行超时，请检查是否出现死循环。';
      out.className = 'output stderr';
      status.textContent = '运行超时';
      status.className = 'status fail';
      return;
    }
    out.textContent = [result.stdout, result.stderr].filter(Boolean).join('\n');
    out.className = 'output stdout';
    status.textContent = result.pass ? '通过' : (result.ok ? '运行成功' : '未通过');
    status.className = result.pass ? 'status pass' : (result.ok ? 'status pass' : 'status fail');
  }


  function editorHtml(item) {
    const tags = item.tags ? item.tags.join(' · ') : '';
    return `
      <div class="detail-head">
        <div>
          <h1>${item.title}</h1>
          <div class="goal">${item.goal || '完成本题'}</div>
        </div>
        <button class="btn ghost" id="detail-back">← 返回</button>
      </div>
      <article class="lesson-body">${item.body || item.desc || ''}</article>
      <div class="plain-line"><span class="plain-tag">说大白话</span><div>${plainHint(item)}</div></div>
      <div class="workbench">
        <div class="editor-panel panel">
          <div class="panel-title"><span>动手时间 · 代码编辑</span><span>${tags}</span></div>
          <div class="editor-wrap"><div class="line-gutter" id="line-gutter"></div><pre class="editor-highlight" id="editor-highlight"></pre><textarea class="editor" id="editor" spellcheck="false"></textarea></div>
          <div id="include-hint" class="include-hint" hidden></div>
          <div class="actions">
            <button class="btn primary" id="run-btn">▶ 运行</button>
            <button class="btn" id="submit-btn">提交判题</button>
            <button class="btn" id="hint-btn">提示</button>
            <button class="btn" id="solution-btn">参考答案</button>
            <button class="btn" id="reset-btn">重置</button>
          </div>
        </div>
        <div class="io-row">
          <div class="input-panel panel">
            <div class="panel-title"><span>输入区 input()</span><span>可多行测试</span></div>
            <textarea class="input-area" id="stdin" placeholder="在这里输入测试数据">${escapeHtml(item.stdin || '')}</textarea>
          </div>
          <div class="output-panel panel">
            <div class="panel-title"><span>运行结果</span><span id="status" class="status"></span></div>
            <pre class="output" id="output"></pre>
          </div>
        </div>
      <div id="error-box" class="error-box" hidden></div>
      </div>
      <div class="reference-panel panel" id="reference-panel" hidden>
        <div class="panel-title"><span>参考答案</span><button class="btn ghost small-btn" id="ref-hide">隐藏</button></div>
        <pre class="reference-code" id="reference-code"></pre>
      </div>`;
  }

  function makeLessonStarter(solution) {
    const text = solution || '';
    const lines = text.split(/\r?\n/);
    const includes = lines.filter((l) => l.trim().startsWith('#include'));
    const usingLine = lines.find((l) => /^\s*using\s+namespace\s+std\s*;/.test(l));
    const parts = includes.slice();
    if (usingLine) parts.push(usingLine);
    parts.push('', '// TODO: 根据上方讲解，补全代码。', 'int main() {', '    // TODO: 在这里完成题目要求', '    return 0;', '}');
    return parts.join('\n');
  }

  function escapeHtmlCode(text) {
    return String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightC(code) {
    const escaped = escapeHtmlCode(code);
    const keywords = 'auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while';
    let html = escaped
      .replace(/(\/\/[^\n]*)/g, '<span class="tok tok-com">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="tok tok-str">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="tok tok-str">$1</span>')
      .replace(/(#\s*(?:include|define|ifdef|ifndef|endif|pragma)[^\n]*)/g, '<span class="tok tok-pre">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok tok-num">$1</span>');
    const kw = new RegExp('\\b(' + keywords + ')\\b', 'g');
    html = html.replace(kw, '<span class="tok tok-kw">$1</span>');
    return html;
  }

  const C_HEADERS = [
    ['stdio.h', '标准输入输出：printf、scanf、fopen'],
    ['stdlib.h', '常用工具：malloc、free、rand、exit'],
    ['math.h', '数学函数：sqrt、pow、fabs'],
    ['string.h', '字符串函数：strlen、strcmp、strcpy'],
    ['ctype.h', '字符判断：isdigit、isalpha、tolower'],
    ['time.h', '时间函数：time、clock']
  ];

  function updateIncludeHints(editor) {
    const box = $('#include-hint');
    if (!box) return;
    const line = editor.value.slice(0, editor.selectionStart).split('\n').pop() || '';
    if (line.includes('#include')) {
      const q = line.replace(/^.*#include\s*<([^>]*)$/, '$1').toLowerCase();
      const matches = C_HEADERS.filter((h) => h[0].startsWith(q));
      box.innerHTML = matches.map((h) => `<button class="include-item" data-header="${h[0]}"><strong>${h[0]}</strong><span>${h[1]}</span></button>`).join('');
      box.hidden = matches.length === 0;
    } else {
      box.hidden = true;
    }
  }

  function updateEditorHighlight(editor) {
    const pre = $('#editor-highlight');
    const gutter = $('#line-gutter');
    if (pre) {
      pre.innerHTML = highlightC(editor.value) + '\n';
      pre.scrollTop = editor.scrollTop;
      pre.scrollLeft = editor.scrollLeft;
    }
    if (gutter) {
      const lines = editor.value.split('\n');
      gutter.innerHTML = lines.map((line, idx) => {
        const indent = (line.match(/^ */) || [''])[0].length;
        const pad = Math.min(indent, 40) * 2;
        return `<div class="gutter-line" style="padding-left:${pad}px"><span class="gutter-num">${idx + 1}</span></div>`;
      }).join('');
      gutter.scrollTop = editor.scrollTop;
    }
  }

  function explainCompileError(stderr) {
    const text = String(stderr || '');
    const lines = text.split(/\r?\n/).filter(Boolean);
    return lines.map((line) => {
      const m = line.match(/main\.c:(\d+):(?:\d+):\s*(?:error|warning):\s*(.*)/);
      if (!m) return line;
      const n = m[1];
      const raw = m[2];
      let zh = raw;
      if (raw.includes('expected \';\'')) zh = '缺少分号 (missing semicolon)';
      else if (raw.includes('expected \')\'')) zh = '缺少右括号 (missing closing parenthesis)';
      else if (raw.includes('expected \'}\'')) zh = '缺少右花括号 (missing closing brace)';
      else if (raw.includes('undeclared')) zh = '未声明的标识符 (undeclared identifier)';
      else if (raw.includes('syntax error')) zh = '语法错误 (syntax error)';
      else if (raw.includes('expected \'=\'')) zh = '缺少等号 (missing equals sign)';
      return `第 ${n} 行：${zh}`;
    });
  }

  function bindEditor(item, kind, list, nextList) {
    const editor = $('#editor');
    editor.value = (kind === 'lesson' || kind === 'advanced')
      ? makeLessonStarter(item.solution || item.starter || '')
      : (item.starter || '');
    updateEditorHighlight(editor);
    editor.addEventListener('input', () => { updateEditorHighlight(editor); updateIncludeHints(editor); });
    editor.addEventListener('scroll', () => updateEditorHighlight(editor));
    editor.addEventListener('keydown', (e) => {
      const pairs = { '(': ')', '[': ']', '{': '}', '<' : '>', '"' : '"', "''": "''" };
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.setRangeText('    ', start, end, 'end');
        updateEditorHighlight(editor);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const start = editor.selectionStart;
        const before = editor.value.slice(0, start);
        const line = before.split('\n').pop() || '';
        const indent = (line.match(/^\s*/) || [''])[0];
        const extra = line.trim().endsWith('{') ? '    ' : '';
        editor.setRangeText('\n' + indent + extra, start, editor.selectionEnd, 'end');
        updateEditorHighlight(editor);
        return;
      }
      if (pairs[e.key]) {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const insert = e.key + pairs[e.key];
        editor.setRangeText(insert, start, end, 'start');
        editor.selectionStart = editor.selectionEnd = start + 1;
        updateEditorHighlight(editor);
        return;
      }
      if (e.key === ')' || e.key === ']' || e.key === '}' || e.key === '>') {
        const pos = editor.selectionStart;
        if (editor.value[pos] === e.key) {
          e.preventDefault();
          editor.selectionStart = editor.selectionEnd = pos + 1;
        }
        updateEditorHighlight(editor);
      }
    });
    $('#detail-back').addEventListener('click', () => {
      if (kind === 'daily') setView('daily');
      else if (kind === 'challenge') setView('challenges');
      else if (kind === 'project') setView('projects');
      else setView(kind === 'advanced' ? 'advanced' : 'map');
    });

    function currentCode() { return $('#editor').value; }
    function currentStdin() { return $('#stdin') ? $('#stdin').value : ''; }

    async function run(markOnPass) {
      showServerWarning('');
      const code = currentCode();
      const stdin = currentStdin();
      let result;
      if (markOnPass) {
        if (kind === 'project') {
          result = await api('/api/run', { code, stdin });
          result.pass = result.ok;
        } else {
          result = await api('/api/check', { code, stdin, check: item.check });
        }
      } else {
        if (kind === 'challenge' || kind === 'daily') {
          result = await api('/api/check', { code, stdin, check: item.check });
        } else {
          result = await api('/api/run', { code, stdin });
        }
      }
      setOutput(result);

      if (markOnPass) {
        if (result.pass) {
          if (kind === 'daily') {
            const gained = markDailyDone(item.id, item.xp);
            if (gained) {
              toast(`获得 ${item.xp} XP！`);
              showPassModal(item, [], 'daily');
            } else {
              toast('这道题已经完成过。');
            }
          } else {
            const gained = markDone(item.id, item.xp);
            if (gained) {
              toast(`获得 ${item.xp} XP！`);
              showPassModal(item, nextList, kind);
            } else {
              toast('这一关已经完成过。');
            }
          }
        } else {
          if (kind === 'lesson') addWrong('lesson', item.id, item.title);
          else if (kind === 'advanced') addWrong('advanced', item.id, item.title);
          else if (kind === 'daily') addWrong('daily', item.id, item.title);
        }
      }
    }

    $('#run-btn').addEventListener('click', () => run(false));
    $('#submit-btn').addEventListener('click', () => run(true));
    $('#hint-btn').addEventListener('click', () => toast(item.hint || '没有提示。'));
    $('#solution-btn').addEventListener('click', () => {
      const panel = $('#reference-panel');
      if (panel.hidden) {
        $('#reference-code').textContent = item.solution || item.starter || '';
        panel.hidden = false;
        toast('参考答案已显示在下方，可直接对照。');
      } else {
        panel.hidden = true;
      }
    });
    $('#ref-hide').addEventListener('click', () => { $('#reference-panel').hidden = true; });
    $('#reset-btn').addEventListener('click', () => {
      editor.value = (kind === 'lesson' || kind === 'advanced')
        ? makeLessonStarter(item.solution || item.starter || '')
        : (item.starter || '');
      setOutput({ stdout: '已重置。', stderr: '', pass: false, ok: true });
    });
  }

  function showPassModal(item, nextList, nextKind) {
    const modal = $('#modal-mask');
    $('#modal-emoji').textContent = '🎉';
    $('#modal-title').textContent = '通关！';
    $('#modal-desc').textContent = `${item.title} 已完成。`;
    $('#modal-xp').textContent = `+${item.xp} XP`;
    modal.hidden = false;
    const next = nextKind === 'daily' ? null : findNext(item.id, nextList || []);
    $('#modal-next').hidden = !next;
    $('#modal-next').dataset.nextId = next ? next.id : '';
    $('#modal-next').dataset.nextKind = next ? nextKind : '';
  }

  function findNext(id, list) {
    const idx = list.findIndex((x) => x.id === id);
    if (idx < 0 || idx >= list.length - 1) return null;
    return list[idx + 1];
  }

  function chapterFor(id, chapters) {
    return chapters.find((ch) => ch.lessons.some((l) => l.id === id));
  }

  function renderSidebar(items, currentId, onSelect) {
    const sidebar = $('#sidebar');
    sidebar.hidden = false;
    sidebar.classList.toggle('collapsed', state.sidebarVisible === false);
    $('#sidebar-body').innerHTML = items.map((it) => `
      <button class="sidebar-link ${it.id === currentId ? 'active' : ''}" data-side-id="${it.id}">
        <span>${isDone(it.id) ? '✓ ' : ''}${it.title}</span><span class="mini">${it.xp} XP</span>
      </button>`).join('');
    $$('.sidebar-link', sidebar).forEach((btn) => {
      btn.addEventListener('click', () => onSelect(btn.dataset.sideId));
    });
  }

  function openDetail(id, list, kind, backView, nextList) {
    const item = list.find((x) => x.id === id);
    if (!item) return;
    state.currentView = backView;
    state.currentDetail = id;
    saveState();
    $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.view === backView));
    renderSidebar(list, id, (sid) => openDetail(sid, list, kind, backView, nextList));
    $('#sidebar-title').textContent = kind === 'lesson' ? '基础关卡' : (kind === 'advanced' ? '进阶关卡' : '题目列表');
    $('#stage').innerHTML = editorHtml(item);
    bindEditor(item, kind, list, nextList);
  }

  function openDaily(id) {
    const item = DAILY_QUESTIONS.find((x) => x.id === id);
    if (!item) return;
    state.currentView = 'daily';
    state.currentDetail = id;
    saveState();
    $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.view === 'daily'));
    $('#sidebar').hidden = true;
    $('#stage').innerHTML = editorHtml(item);
    bindEditor(item, 'daily', DAILY_QUESTIONS, []);
  }

  function openWrong(type, id) {
    if (type === 'daily') {
      openDaily(id);
      return;
    }
    const chapters = type === 'lesson' ? BASE_CHAPTERS : ADV_CHAPTERS;
    const chapter = chapterFor(id, chapters);
    const list = chapter ? chapter.lessons : (type === 'lesson' ? BASE_LESSONS : ADV_LESSONS);
    openDetail(id, list, type === 'lesson' ? 'lesson' : 'advanced', type === 'lesson' ? 'map' : 'advanced', ALL_LESSONS);
  }

  function bindDelegation() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#music-toggle')) {
        const audio = $('#global-audio');
        if (!audio || !audio.src) return;
        if (audio.paused) { audio.play(); } else { audio.pause(); }
      }
    });
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab) {
        setView(tab.dataset.view);
        return;
      }
      const err = e.target.closest('.error-item');
      if (err) {
        const line = Number(err.dataset.line || 0);
        const ed = $('#editor');
        if (ed && line > 0) {
          const lines = ed.value.split('\\n');
          let pos = 0;
          for (let i = 0; i < line - 1; i++) pos += (lines[i] || '').length + 1;
          ed.focus();
          ed.setSelectionRange(pos, pos + (lines[line - 1] || '').length);
          ed.scrollTop = Math.max(0, (line - 3) * 16);
          updateEditorHighlight(ed);
        }
        return;
      }
      const inc = e.target.closest('.include-item');
      if (inc) {
        const ed = $('#editor');
        const header = inc.dataset.header;
        if (ed && header) {
          const before = ed.value.slice(0, ed.selectionStart);
          const after = ed.value.slice(ed.selectionStart);
          const lineStart = before.lastIndexOf('\\n') + 1;
          const line = before.slice(lineStart);
          const m = line.match(/^(\s*#include\s*<)[^>]*$/);
          if (m) {
            ed.value = before.slice(0, lineStart + m[1].length) + header + '>' + after;
            ed.selectionStart = ed.selectionEnd = lineStart + m[1].length + header.length + 1;
            updateEditorHighlight(ed);
            updateIncludeHints(ed);
          }
        }
        return;
      }
      const viewButton = e.target.closest('[data-view-button]');
      if (viewButton) {
        setView(viewButton.dataset.viewButton);
        return;
      }
      const lesson = e.target.closest('[data-open-lesson]');
      if (lesson) {
        const id = lesson.dataset.openLesson;
        const backView = lesson.dataset.back || 'map';
        const chapters = backView === 'map' ? BASE_CHAPTERS : ADV_CHAPTERS;
        const chapter = chapterFor(id, chapters);
        const list = chapter ? chapter.lessons : (backView === 'map' ? BASE_LESSONS : ADV_LESSONS);
        openDetail(id, list, backView === 'map' ? 'lesson' : 'advanced', backView, ALL_LESSONS);
        return;
      }
      const prev = e.target.closest('#daily-prev');
      if (prev) { shiftDaily(-1); return; }
      const next = e.target.closest('#daily-next');
      if (next) { shiftDaily(1); return; }
      const daily = e.target.closest('[data-open-daily]');
      if (daily) {
        openDaily(daily.dataset.openDaily);
        return;
      }
      const wrong = e.target.closest('[data-open-wrong]');
      if (wrong) {
        openWrong(wrong.dataset.openWrong, wrong.dataset.wrongId);
        return;
      }
      const challenge = e.target.closest('[data-open-challenge]');
      if (challenge) {
        openDetail(challenge.dataset.openChallenge, CHALLENGES, 'challenge', 'challenges', CHALLENGES);
        return;
      }
      const project = e.target.closest('[data-open-project]');
      if (project) {
        openDetail(project.dataset.openProject, PROJECTS, 'project', 'projects', PROJECTS);
      }
    });
  }

  function bindModal() {
    $('#modal-close').addEventListener('click', () => { $('#modal-mask').hidden = true; });
    $('#modal-next').addEventListener('click', () => {
      $('#modal-mask').hidden = true;
      const id = $('#modal-next').dataset.nextId;
      const kind = $('#modal-next').dataset.nextKind;
      if (!id) return;
      if (kind === 'challenge') openDetail(id, CHALLENGES, 'challenge', 'challenges', CHALLENGES);
      else if (kind === 'project') openDetail(id, PROJECTS, 'project', 'projects', PROJECTS);
      else if (kind === 'daily') openDaily(id);
      else openDetail(id, ALL_LESSONS, kind || 'lesson', state.currentView, ALL_LESSONS);
    });
  }

  function renderStage() {
    const stage = $('#stage');
    if (state.currentView === 'map') stage.innerHTML = renderMap();
    else if (state.currentView === 'advanced') stage.innerHTML = renderAdvanced();
    else if (state.currentView === 'challenges') stage.innerHTML = renderChallenges();
    else if (state.currentView === 'daily') stage.innerHTML = renderDaily();
    else if (state.currentView === 'wrong') stage.innerHTML = renderWrong();
    else if (state.currentView === 'projects') stage.innerHTML = renderProjects();
    else if (state.currentView === 'achievements') stage.innerHTML = renderAchievements();
    else if (state.currentView === 'music') stage.innerHTML = renderMusic();
    else if (state.currentView === 'knowledge') stage.innerHTML = renderKnowledge();
    else stage.innerHTML = renderMap();
  }

  function applyFontSize() {
    const size = state.fontSize || 100;
    document.documentElement.style.fontSize = size + '%';
    const label = $('#font-label');
    const range = $('#font-size');
    if (label) label.textContent = size + '%';
    if (range) range.value = size;
  }

  function toggleSidebar() {
    state.sidebarVisible = state.sidebarVisible === false;
    saveState();
    if (state.currentView === 'map' || state.currentView === 'advanced') renderNavSidebar(state.currentView);
  }

  function sendAi() {
    const input = $('#ai-input');
    const log = $('#ai-log');
    if (!input || !log) return;
    const text = input.value.trim();
    if (!text) return;
    const q = document.createElement('div');
    q.className = 'ai-msg user';
    q.textContent = text;
    log.appendChild(q);
    const a = document.createElement('div');
    a.className = 'ai-msg bot';
    a.textContent = askLocalAI(text);
    log.appendChild(a);
    input.value = '';
    log.scrollTop = log.scrollHeight;
  }

  async function checkForUpdates() {
    try {
      const res = await fetch('update.json', { cache: 'no-store' });
      const data = await res.json();
      if (!data || !data.version) return;
      const current = '1.0.0';
      if (data.version !== current && data.downloadUrl) {
        const banner = $('#update-banner');
        if (banner) {
          $('#update-text').textContent = `发现新版本 ${data.version}：${data.notes || '可前往下载最新安装包'}`;
          banner.hidden = false;
          $('#update-open').onclick = () => window.open(data.downloadUrl, '_blank');
          $('#update-close').onclick = () => { banner.hidden = true; };
        }
      }
    } catch (e) {}
  }

  function init() {
    state.currentView = 'map';
    state.currentDetail = null;
    applyTheme();
    renderStage();
    renderNavSidebar(state.currentView);
    bindDelegation();
    bindModal();
    const tabs = $('#tabs');
    $('#tabs-prev').addEventListener('click', () => tabs.scrollBy({ left: -180, behavior: 'smooth' }));
    $('#tabs-next').addEventListener('click', () => tabs.scrollBy({ left: 180, behavior: 'smooth' }));
    document.addEventListener('change', (e) => {
      if (e.target.id === 'music-files') musicAddFiles(e.target.files);
    });
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.music-item');
      if (item) {
        const audio = $('#global-audio');
        const entry = musicStore.byName[item.dataset.name];
        if (audio && entry) {
          audio.src = entry.url;
          audio.play();
          musicLoadLyrics(entry.name);
        }
        return;
      }
      if (e.target.closest('#lyrics-edit')) {
        const itemName = (musicStore.files.find((m) => true) || {}).name;
        const entry = musicStore.byName[itemName];
        const text = prompt('编辑歌词', entry ? entry.lyrics : '');
        if (text != null && entry) { entry.lyrics = text; const panel = $('#lyrics'); if (panel) panel.textContent = text; }
      }
    });
    $('#sidebar-arrow').addEventListener('click', toggleSidebar);
    $('#font-size').addEventListener('input', (e) => {
      state.fontSize = Number(e.target.value);
      saveState();
      applyFontSize();
    });
    $('#font-size').addEventListener('wheel', (e) => {
      e.preventDefault();
      state.fontSize = Math.max(50, Math.min(500, (state.fontSize || 100) + (e.deltaY < 0 ? 10 : -10)));
      saveState();
      applyFontSize();
    });
    $('#btn-theme').addEventListener('click', () => {
      state.theme = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
      saveState();
      applyTheme();
    });
    $('#btn-quit').addEventListener('click', () => {
      if (window.cppNative && window.cppNative.quit) window.cppNative.quit();
      else window.close();
    });
    $('#btn-back').addEventListener('click', () => setView(state.currentView || 'map'));
    checkHealth();
    checkForUpdates();
  }

  init();
})();
