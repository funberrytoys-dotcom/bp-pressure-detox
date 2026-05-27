/**
 * app.js — Premium PWA Controller
 */
(() => {
  const $ = id => document.getElementById(id);

  // ========== NAVIGATION ==========
  window.goHome = () => {
    document.querySelectorAll('.module-screen').forEach(el => {
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('hidden'), 400);
    });
    document.getElementById('home').classList.remove('hidden');
  };

  window.showModule = (id) => {
    document.getElementById('home').classList.add('hidden');
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden');
      void el.offsetWidth;
      el.classList.add('visible');
      if (id === 'bp') setTimeout(drawBPChart, 100);
    }
  };

  window.goHome(); // Show home after splash logic

  // ========== BP FORM ==========
  window.saveBP = () => {
    const sys = parseInt($('sys').value);
    const dia = parseInt($('dia').value);
    const pulse = parseInt($('pulse').value);
    if (!sys || !dia || !pulse) { alert('Введите все значения'); return; }
    if (sys > 220 || dia > 140 || pulse > 200) { alert('Проверьте значения'); return; }

    const rec = { sys, dia, pulse, ts: Date.now() };
    DB.add('bp', rec);

    // Show advice
    let advice = '';
    if (sys >= 140 || dia >= 90) advice = '⚠️ Высокое давление. Рекомендуем консультацию кардиолога.';
    else if (sys >= 120) advice = '↗️ Пограничное давление. Следите за трендом и снижайте соль.';
    else advice = '✅ Отличные показатели! Продолжайте в том же духе.';

    $('bpAdviceText').textContent = advice;
    $('bpAdvice').classList.remove('hidden');
    drawBPChart();
  };

  // ========== SOUND ==========
  let currentSound = null;
  window.playSound = (type) => {
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-sound="${type}"]`).classList.add('active');
    if (currentSound) stopNoise();
    currentSound = type;
    startNoise(type, parseInt($('volume').value) / 100);
  };

  window.setVolume = (v) => {
    setNoiseVolume(v / 100);
  };

  // ========== CTA FUNNEL ==========
  window.openFunnel = (type) => {
    const msg = type === 'bp'
      ? '📅 Открываю запись к кардиологу...'
      : '🌙 Открываю запись к сомнологу...';
    alert(msg + '\n\n(Интеграция с Telegram-ботом в разработке)');
  };

  // ========== INIT ==========
  // Splash auto-dismiss after 3s
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.style.display = 'none', 800);
    }
  }, 3500);
})();
