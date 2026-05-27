## Сердце & Сон — Dr. Tatyana Gromyko

PWA-приложение «2 в 1»: дневник давления + цифровой детокс перед сном с AI-анализом и прогревом на платные продукты.

### Стек
- **Фронт:** vanilla HTML/CSS/JS, Canvas графики, Web Audio API (synthesized звуки)
- **Бэк:** FastAPI + Telegram Bot API
- **Воронка:** JSON-файл (`data/funnel.json`) с lifecycle `cold → warm → hot → booked → paid`

### Модули

**💗 Дневник давления**
- Ввод АД/пульса + настроение
- График 7-дней (Canvas)
- AI-анализ: среднее, тренд, стадия риска
- Авто-CTA при росте АД → консультация кардиолога / курс

**🌙 Цифровой детокс**
- Таймер 60 мин до сна с чеклистом
- 6 синтезированных звуковых сред: белый/розовый шум, дождь, лес, океан, вентилятор
- Таймер выключения звука
- Утренняя оценка сна ⭐ + AI-анализ
- Авто-CTA при плохом сне → консультация сомнолога / закрытый канал

### AI-воронка (прогрев лидов)
Каждая запись обрабатывается локально → отправляется на FastAPI backend:
- `cold`: пациент в норме → мягкие рекомендации
- `warm`: риск средний/тенденция роста → уведомление Dr. Gromyko в Telegram
- `hot`: пациент кликнул CTA (консультация/курс) → мгновенный алерт
- `paid`: webhook от платёжки → подтверждение покупки

### Деплой
1. **Фронт:** GitHub Pages (папка `/bp-pressure-detox/`)
2. **Бэк:** Render / Railway / VPS — `python api/main.py`
3. **Env:** `TELEGRAM_BOT_TOKEN`, `DR_GROMYKO_CHAT_ID`, `PORT`

### Запуск локально
```bash
cd bp-pressure-detox
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python api/main.py
```

### Ссылки
- [Telegram: @Tatiana_Gromyko](https://t.me/Tatiana_Gromyko)
- Дизайн-система: бордо `#6B2D3A` + крем `#F5F0EB` + янтарь `#B48C46`
