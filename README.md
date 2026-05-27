# 💗 Сердце & Сон — Dr. Tatyana Gromyko

> **Персональное медицинское PWA-приложение**: дневник артериального давления + цифровой детокс перед сном с AI-анализом и умной воронкой прогрева на платные продукты.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-GitHub_Pages-6B2D3A?style=for-the-badge)](https://funberrytoys-dotcom.github.io/bp-pressure-detox/)
[![Stack](https://img.shields.io/badge/stack-vanilla_HTML/CSS/JS-F5F0EB?style=for-the-badge)](https://developer.mozilla.org/)
[![Design](https://img.shields.io/badge/design-Glassmorphism_+_Bordeaux-B48C46?style=for-the-badge)]()

---

## 📸 Скриншоты

| Splash Screen | Главный экран | Дневник давления |
|:---:|:---:|:---:|
| ![Splash](assets/images/splash_512.png) | ![Home](assets/images/home_preview.png) | ![BP](assets/images/bp_preview.png) |

---

## ✨ Фичи

### 💗 Дневник давления
- **Быстрый ввод** АД (систолическое / диастолическое) и пульса
- **История записей** с временными метками в `localStorage`
- **График динамики** 7 дней на HTML5 Canvas
- **AI-анализ**:
  - ✅ Норма → поздравление
  - ↗️ Пограничное → рекомендации по образу жизни
  - ⚠️ Высокое → CTA на консультацию кардиолога
- **Прогрев воронки**: при росте АД автоматически предлагает запись

### 🌙 Цифровой детокс
- **Таймер обратного отсчёта** до сна (настраиваемый)
- **6 синтезированных звуковых сред** через Web Audio API:
  - Белый шум
  - Розовый шум  
  - Коричневый шум
  - Дождь
  - Лес
  - Океан
- **Регулятор громкости** с плавным fade
- **Авто-CTA**: после сессии предлагает запись к сомнологу

### 🎨 Дизайн
- **Premium glassmorphism** — frosted glass, blur, полупрозрачность
- **Цветовая система** Dr. Gromyko:
  - Бордо `#6B2D3A` — основной
  - Крем `#F5F0EB` — текст
  - Янтарь `#B48C46` — акценты
- **Playfair Display + Inter** — премиальная типографика
- **Анимации**: fadeIn, pulse, slide-переходы, hover-эффекты
- **AI-генерированные ассеты** через Google Imagen

---

## 🏗 Архитектура

```
┌─────────────────────────────────────────┐
│           Клиент (PWA)                  │
│  ┌─────────────┐    ┌─────────────┐     │
│  │ 💗 Дневник  │    │ 🌙 Детокс   │     │
│  │  Давления   │    │   (Web Audio)│    │
│  └──────┬──────┘    └──────┬──────┘   │
│         │                    │           │
│  ┌──────▼──────────────────▼──────┐   │
│  │      localStorage (offline)     │   │
│  └──────────────┬──────────────────┘   │
│                 │                      │
│  ┌──────────────▼──────────────────┐   │
│  │         FastAPI Backend          │   │
│  │  /api/analyze | /api/funnel     │   │
│  └──────────────┬──────────────────┘   │
│                 │                      │
│  ┌──────────────▼──────────────────┐   │
│  │    Telegram Bot (уведомления)    │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🚀 Установка

### Локальный запуск (фронт)

```bash
git clone https://github.com/funberrytoys-dotcom/bp-pressure-detox.git
cd bp-pressure-detox
python3 -m http.server 8765
# Открыть http://localhost:8765
```

### Бэкенд (FastAPI)

```bash
cd bp-pressure-detox
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Запуск
export TELEGRAM_BOT_TOKEN="your_token"
export DR_GROMYKO_CHAT_ID="123456789"
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

---

## 📡 API Endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/analyze` | POST | Анализ записи АД |
| `/api/funnel` | POST | Переход воронки |
| `/api/notify` | POST | Telegram-уведомление |

### Пример запроса

```bash
curl -X POST https://your-api.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_abc123",
    "sys": 145,
    "dia": 92,
    "pulse": 88,
    "mood": "bad"
  }'
```

---

## 🗺 Roadmap

- [x] MVP с дневником давления и детоксом
- [x] Premium glassmorphism дизайн
- [x] AI-генерированные иконки и splash
- [x] Web Audio API синтез звуков
- [ ] Push-уведомления (PWA)
- [ ] Экспорт данных в PDF
- [ ] Интеграция с Telegram Mini App
- [ ] Мультиязычность (RU/EN)

---

## 🎨 Дизайн-система

| Токен | Значение | Использование |
|-------|----------|---------------|
| `--bordeaux` | `#6B2D3A` | Фон, primary |
| `--cream` | `#F5F0EB` | Текст, светлый фон |
| `--amber` | `#B48C46` | Акценты, CTA, золото |
| `--glass` | `rgba(255,255,255,0.12)` | Glassmorphism панели |
| `--font-display` | Playfair Display | Заголовки |
| `--font-body` | Inter | Текст |

---

## 🤝 Контакты

- **Telegram:** [@Tatiana_Gromyko](https://t.me/Tatiana_Gromyko)
- **GitHub:** [funberrytoys-dotcom](https://github.com/funberrytoys-dotcom)

---

> _«Сердце и сон — два столпа здоровья, которые мы заботливо контролируем вместе.»_  
> — Dr. Tatyana Gromyko
