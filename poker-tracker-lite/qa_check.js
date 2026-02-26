const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parseHTML } = require('linkedom');

const root = '/Users/pinchylin/.openclaw/workspace/poker-tracker-lite';
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
}

function boot({ chart = false, seedStorage } = {}) {
  const { window, document } = parseHTML(html);
  const storage = makeStorage();
  if (seedStorage) storage.setItem('poker_tracker_lite_sessions_v1', seedStorage);

  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  if (window.navigator) {
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  }

  const formEl = document.getElementById('sessionForm');
  if (formEl && typeof formEl.reset !== 'function') formEl.reset = function () { this.querySelectorAll('input, textarea, select').forEach((el)=>{ if (el.type==='date' || el.tagName==='TEXTAREA' || el.tagName==='INPUT') el.value=''; }); };
  if (window.HTMLElement && !window.HTMLElement.prototype.scrollIntoView) window.HTMLElement.prototype.scrollIntoView = function(){};

  Object.defineProperty(window, 'crypto', { value: { randomUUID: () => 'id-' + Math.random().toString(16).slice(2) }, configurable: true });
  window.confirm = () => true;
  window.alert = () => {};
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

  if (chart) window.Chart = function () { return { destroy() {} }; };

  const ctx = vm.createContext(window);
  vm.runInContext(appJs, ctx, { filename: 'app.js' });
  return { window, document, storage };
}

function fillAndSubmit(window, document, data) {
  document.getElementById('date').value = data.date;
  document.getElementById('sessionType').value = data.sessionType;
  document.getElementById('location').value = data.location;
  document.getElementById('stake').value = data.stake;
  document.getElementById('buyIn').value = String(data.buyIn);
  document.getElementById('cashOut').value = String(data.cashOut);
  document.getElementById('notes').value = data.notes || '';
  document.getElementById('sessionForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
}

const failures = [];
const check = (name, cond) => { if (!cond) failures.push(name); };

const env = boot({ chart: false });
check('Chart fallback message visible', env.document.getElementById('chartsStatus').textContent.includes('Charts unavailable right now'));

fillAndSubmit(env.window, env.document, { date:'2026-02-20', sessionType:'cash', location:'A', stake:'1/2', buyIn:100, cashOut:150, notes:'n1' });
check('Create session works w/o charts', env.document.querySelectorAll('.session-item').length === 1);
check('Summary updates w/o charts', env.document.getElementById('summaryAll').textContent.includes('1 sessions'));

env.document.querySelector('[data-edit-id]').dispatchEvent(new env.window.Event('click', { bubbles: true }));
env.document.getElementById('cashOut').value = '180';
env.document.getElementById('sessionForm').dispatchEvent(new env.window.Event('submit', { bubbles:true, cancelable:true }));
check('Edit updates profit', (env.document.querySelector('.profit-pos')?.textContent || '').includes('$80.00'));

fillAndSubmit(env.window, env.document, { date:'2026-02-21', sessionType:'tournament', location:'B', stake:'MTT', buyIn:50, cashOut:20, notes:'' });
env.document.querySelector('button[data-type="cash"]').dispatchEvent(new env.window.Event('click',{bubbles:true}));
check('Filter cash only', env.document.querySelectorAll('.session-item').length === 1);

const saved = env.storage.getItem('poker_tracker_lite_sessions_v1');
const env2 = boot({ chart:false, seedStorage: saved });
check('Persistence reload count', env2.document.querySelectorAll('.session-item').length === 2);

console.log(JSON.stringify({ ok: failures.length===0, failures }, null, 2));
