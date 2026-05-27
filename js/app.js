/**
 * app.js — main controller: navigation, forms, charts, AI-analysis, CTA triggers
 */
(() => {
  const $ = id => document.getElementById(id);
  const $$ = q => document.querySelectorAll(q);

  // ---------- Toast ----------
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // ---------- Navigation ----------
  function showSplash() {
    $$('.module').forEach(m => m.classList.remove('visible'));
    $('splash').classList.remove('hidden');
  }
  function hideSplash() { $('splash').classList.add('hidden'); }
  function openModule(id) {
    hideSplash();
    $$('.module').forEach(m => m.classList.remove('visible'));
    $(id).classList.add('visible');
    if (id === 'module-cardio') updateCardioUI();
    if (id === 'module-sleep') updateSleepUI();
  }

  $('btn-cardio').addEventListener('click', () => openModule('module-cardio'));
  $('btn-sleep').addEventListener('click', () => openModule('module-sleep'));
  $$('[data-back]').forEach(b => b.addEventListener('click', showSplash));

  // ========== КАРДИО: форма + график + AI ==========
  let selectedMood = null;
  $$('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = btn.dataset.mood;
    });
  });

  $('btn-save-bp').addEventListener('click', () => {
    const sys = parseInt($('sys').value);
    const dia = parseInt($('dia').value);
    const pulse = parseInt($('pulse').value);
    if (!sys || !dia || !pulse) { toast('Введите все значения'); return; }
    if (sys > 220 || dia > 140 || pulse > 200) { toast('Проверьте значения'); return; }

    DB.add('bp', { sys, dia, pulse, mood: selectedMood, note: $('note').value.trim() });
    toast('✅ Запись сохранена');
    $('sys').value = $('dia').value = $('pulse').value = $('note').value = '';
    $$('.mood-btn').forEach(b => b.classList.remove('active'));
    selectedMood = null;
    updateCardioUI();
  });

  function updateCardioUI() {
    const last = DB.last('bp');
    const lastDiv = $('last-bp-display');
    if (last) {
      const d = new Date(last.ts);
      const dateStr = `${d.getDate()}.${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
      let color = '';
      if (last.sys >= 140 || last.dia >= 90) color = 'color:var(--danger)';
      else if (last.sys >= 120) color = 'color:var(--warn)';
      else color = 'color:var(--ok)';

      let moodEmoji = '';
      if (last.mood === 'great') moodEmoji = '😊';
      else if (last.mood === 'ok') moodEmoji = '😐';
      else if (last.mood === 'bad') moodEmoji = '😰';
      else if (last.mood === 'dizzy') moodEmoji = '😵';

      lastDiv.innerHTML = `
        <div class="bp-pill" style="padding:.75rem 1.25rem">
          <span class="sys" style="${color};font-size:1.3rem">${last.sys}</span> /
          <span class="dia" style="font-size:1.1rem">${last.dia}</span>
          <span style="color:var(--text-light);margin:0 .3rem">·</span>
          <span class="pulse">♥ ${last.pulse}</span>
          <span style="margin-left:auto;font-size:1.2rem">${moodEmoji}</span>
        </div>
        <p style="font-size:.8rem;color:var(--text-light);margin-top:.4rem;text-align:center">${dateStr} ${last.note ? '· ' + last.note : ''}</p>
      `;
    } else {
      lastDiv.textContent = 'Записей пока нет';
    }

    const recs = DB.get('bp');
    drawBPChart('bp-chart', recs);

    const hist = $('bp-history');
    if (recs.length === 0) {
      hist.innerHTML = '<p style="color:var(--text-light);font-size:.85rem;text-align:center">Ваши записи появятся здесь</p>';
    } else {
      hist.innerHTML = recs.slice(0, 20).map(r => {
        const d = new Date(r.ts);
        return `
          <div style="display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--cream-2);font-size:.9rem">
            <span>${d.getDate()}.${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}</span>
            <span><strong style="color:var(--bordeaux)">${r.sys}/${r.dia}</strong> · ♥${r.pulse}</span>
          </div>`;
      }).join('');
    }

    const analysis = DB.analyzeBP();
    const aiText = $('ai-analysis-text');
    const aiCTA = $('ai-cta');

    if (!analysis) {
      aiText.innerHTML = 'Добавьте минимум <strong>3 записи</strong> для персонального анализа';
      aiCTA.classList.add('hidden');
      return;
    }

    let msg = '', ctaShown = false;
    if (analysis.risk === 'high') {
      msg = `⚠️ <strong>Риск повышен</strong>. Среднее АД <strong>${analysis.avgSys}/${analysis.avgDia}</strong> мм рт.ст. (${analysis.recs.length} записей). Рекомендуется консультация кардиолога.`;
      ctaShown = true;
    } else if (analysis.risk === 'medium') {
      msg = `⚡ <strong>Среднее АД на границе</strong>: ${analysis.avgSys}/${analysis.avgDia}. Отслеживайте тенденцию. При росте — обратитесь к специалисту.`;
      if (analysis.recs.length >= 5) ctaShown = true;
    } else if (analysis.risk === 'rising') {
      msg = `📈 <strong>Восходящий тренд</strong>: систола +${analysis.trendSys} к среднему. Рекомендуется корректировка образа жизни.`;
      ctaShown = true;
    } else {
      msg = `✅ <strong>Хорошие показатели</strong>. Среднее АД ${analysis.avgSys}/${analysis.avgDia}. Пульс ${analysis.avgPulse}. Продолжайте в том же духе!`;
    }

    aiText.innerHTML = msg;
    if (ctaShown) {
      aiCTA.classList.remove('hidden');
      sendWarmup('cardio', analysis);
    } else {
      aiCTA.classList.add('hidden');
    }
  }

  // ========== СОН: форма + звук + AI ==========
  let selectedStars = 0;
  $$('.star').forEach(star => {
    star.addEventListener('click', () => {
      selectedStars = parseInt(star.dataset.star);
      $$('.star').forEach((s, i) => {
        if (i < selectedStars) s.classList.add('active');
        else s.classList.remove('active');
      });
    });
  });

  // Sound selector
  let activeSoundBtn = document.querySelector('.sound-btn.active');
  $$('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.sound-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSoundBtn = btn;
      $('sound-label').textContent = btn.dataset.label;
      if (activeType) playSound(btn.dataset.sound);
    });
  });

  $('btn-play').addEventListener('click', () => {
    const btn = document.querySelector('.sound-btn.active');
    if (!btn) { toast('Выберите звук'); return; }
    const type = btn.dataset.sound;
    if (activeType && activeType === type) {
      stopSound(); $('btn-play').textContent = '▶️ Включить звук';
    } else {
      playSound(type); $('btn-play').textContent = '⏹️ Остановить';
    }
  });

  $('vol').addEventListener('input', e => setVolume(e.target.value));

  // Detox timer
  let detoxInterval = null, detoxRunning = false;
  $('btn-start-detox').addEventListener('click', () => {
    if (detoxRunning) {
      clearInterval(detoxInterval); detoxRunning = false;
      $('btn-start-detox').textContent = '🚀 Начать детокс';
      $('detox-timer').innerHTML = '60<span class="unit">мин</span>';
      return;
    }
    detoxRunning = true;
    $('btn-start-detox').textContent = '⏹️ Остановить';
    let mins = 60;
    $('detox-timer').textContent = mins;
    detoxInterval = setInterval(() => {
      mins--;
      if (mins <= 0) {
        clearInterval(detoxInterval); detoxRunning = false;
        toast('⏰ Детокс завершён! Время спать 💤');
        $('detox-timer').innerHTML = '0<span class="unit">мин</span>';
        $('btn-start-detox').textContent = '🚀 Начать детокс';
        return;
      }
      $('detox-timer').textContent = mins;
    }, 60000);
  });

  // Save sleep
  $('btn-save-sleep').addEventListener('click', () => {
    const hours = parseFloat($('sleep-hours').value);
    if (!hours || selectedStars === 0) { toast('Укажите часы сна и оценку'); return; }

    DB.add('sleep', { hours, stars: selectedStars, wakeTime: $('wake-time').value });
    toast('✅ Запись сна сохранена');
    $('sleep-hours').value = ''; selectedStars = 0;
    $$('.star').forEach(s => s.classList.remove('active'));
    updateSleepUI();
  });

  function updateSleepUI() {
    const analysis = DB.analyzeSleep();
    const aiText = $('sleep-ai-text');
    const aiCTA = $('sleep-cta');

    if (!analysis) {
      aiText.innerHTML = 'Нужно минимум <strong>3 записи</strong> для анализа';
      aiCTA.classList.add('hidden');
      return;
    }

    let msg = '', ctaShown = false;
    if (analysis.concern) {
      msg = `😴 <strong>Сон тревожит</strong>: в среднем ${analysis.avgHours}ч, оценка ${analysis.avgStars}/5. AI-сомнолог рекомендует консультацию.`;
      ctaShown = true;
    } else if (parseFloat(analysis.avgHours) < 7) {
      msg = `⏰ <strong>Недосып</strong>: ${analysis.avgHours}ч в среднем. Рекомендуется увеличить до 7–8 часов.`;
      if (analysis.recs.length >= 5) ctaShown = true;
    } else {
      msg = `✅ <strong>Сон хороший</strong>: ${analysis.avgHours}ч, оценка ${analysis.avgStars}/5. Отличный результат!`;
    }

    aiText.innerHTML = msg;
    if (ctaShown) {
      aiCTA.classList.remove('hidden');
      sendWarmup('sleep', analysis);
    } else {
      aiCTA.classList.add('hidden');
    }
  }

  // ========== AI WARM-UP BOT ==========
  async function sendWarmup(type, data) {
    const userId = localStorage.getItem('gromyko_user_id') ||
                   'user_' + Math.random().toString(36).slice(2,9);
    localStorage.setItem('gromyko_user_id', userId);

    const payload = { userId, type, data, ts: new Date().toISOString() };
    console.log('[WARMUP]', payload);

    // Uncomment when backend is live:
    // try {
    //   await fetch('https://your-api.com/warmup', {
    //     method: 'POST',
    //     headers: {'Content-Type': 'application/json'},
    //     body: JSON.stringify(payload)
    //   });
    // } catch(e) { console.error(e); }
  }

  // CTA placeholders
  $('btn-course-cardio')?.addEventListener('click', e => {
    e.preventDefault();
    alert('Курс «Здоровое сердце» — ссылка на оплату/канал будет здесь');
  });
  $('btn-course-sleep')?.addEventListener('click', e => {
    e.preventDefault();
    alert('Закрытый канал «Глубокий сон» / курс — ссылка будет здесь');
  });

  // Init
  updateCardioUI();
})();
