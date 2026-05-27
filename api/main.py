from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
import json, os, asyncio, httpx
from typing import Optional

# ─── CONFIG ──────────────────────────────────
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
DR_GROMYKO_CHAT_ID = os.getenv("DR_GROMYKO_CHAT_ID", "")  # e.g. "@Tatiana_Gromyko" or chat_id
FUNNEL_DB = os.getenv("FUNNEL_DB", "data/funnel.json")

app = FastAPI(title="Heart & Sleep Warmup API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(os.path.dirname(FUNNEL_DB) or ".", exist_ok=True)

# ─── MODELS ──────────────────────────────────
class BPRecord(BaseModel):
    sys: int
    dia: int
    pulse: int
    mood: Optional[str] = None
    note: Optional[str] = None

class SleepRecord(BaseModel):
    hours: float
    stars: int
    wakeTime: Optional[str] = None

class WarmupPayload(BaseModel):
    userId: str
    type: str          # "cardio" | "sleep"
    data: dict
    ts: str

# ─── FUNNEL HELPERS ──────────────────────────
def load_funnel():
    if not os.path.exists(FUNNEL_DB): return {}
    with open(FUNNEL_DB, "r", encoding="utf-8") as f:
        return json.load(f)

def save_funnel(data):
    with open(FUNNEL_DB, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def ensure_user(fid, user_id):
    """Create or get patient funnel entry."""
    if user_id not in fid:
        fid[user_id] = {
            "created_at": datetime.utcnow().isoformat(),
            "stage": "cold",          # cold → warm → hot → booked → paid
            "warmup_count": 0,
            "bp_records": [],
            "sleep_records": [],
            "risks": [],
            "last_contact": None,
            "telegram_sent": False,
            "cta_clicks": 0,
            "conversion": None
        }
    return fid[user_id]

# ─── TELEGRAM BOT ────────────────────────────
async def telegram_notify(text: str):
    if not TELEGRAM_BOT_TOKEN or not DR_GROMYKO_CHAT_ID:
        print(f"[TELEGRAM SKIP] {text[:120]}")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": DR_GROMYKO_CHAT_ID, "text": text, "parse_mode": "HTML"}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, json=payload)
        print("[TG]", r.status_code, r.text[:200])

# ─── ENDPOINTS ───────────────────────────────
@app.post("/warmup")
async def warmup(p: WarmupPayload):
    fid = load_funnel()
    u = ensure_user(fid, p.userId)
    u["warmup_count"] += 1
    u["last_contact"] = datetime.utcnow().isoformat()

    risk_flag = False
    msg = ""

    if p.type == "cardio":
        avg_sys = p.data.get("avgSys", 0)
        avg_dia = p.data.get("avgDia", 0)
        risk = p.data.get("risk")
        stage = p.data.get("stage", "normal")
        u["bp_records"].append({"ts": p.ts, **p.data})

        if risk in ("high", "medium"):
            u["risks"].append({"ts": p.ts, "type": "bp", "risk": risk, "avg": f"{avg_sys}/{avg_dia}"})
            risk_flag = True
            u["stage"] = "warm"
            msg = (
                f"🩸 <b>Тревожный пациент</b>\n"
                f"Среднее АД: <b>{avg_sys}/{avg_dia}</b> mmHg\n"
                f"Риск: <b>{risk}</b> | Стадия: {stage}\n"
                f"Записей: {len(u['bp_records'])} | Уровень: теплый → нужна консультация"
            )
        else:
            u["stage"] = max(u["stage"], "cold")  # stays cold or warm
            msg = f"🩸 Пациент {p.userId[:8]} — АД в норме. ({avg_sys}/{avg_dia})"

    elif p.type == "sleep":
        avg_hours = p.data.get("avgHours", "0")
        concern = p.data.get("concern", False)
        u["sleep_records"].append({"ts": p.ts, **p.data})

        if concern:
            u["risks"].append({"ts": p.ts, "type": "sleep", "concern": True, "avg": avg_hours})
            risk_flag = True
            u["stage"] = "warm"
            msg = (
                f"🌙 <b>Проблемы со сном</b>\n"
                f"Средний сон: <b>{avg_hours}ч</b>\n"
                f"Записей: {len(u['sleep_records'])} | Уровень: теплый → предложить курс"
            )
        else:
            u["stage"] = max(u["stage"], "cold")
            msg = f"🌙 Пациент {p.userId[:8]} — сон в порядке. ({avg_hours}ч)"

    save_funnel(fid)

    # Only notify doctor on RISK; log everything
    if risk_flag and not u.get("telegram_sent"):
        u["telegram_sent"] = True
        save_funnel(fid)
        await telegram_notify(msg)
        return {"ok": True, "action": "notify_sent", "stage": u["stage"]}

    return {"ok": True, "action": "logged", "stage": u["stage"]}


@app.post("/cta-click")
async def cta_click(userId: str, product: str):  # product: "consultation" | "course_cardio" | "course_sleep"
    fid = load_funnel()
    u = ensure_user(fid, userId)
    u["cta_clicks"] += 1
    u["stage"] = "hot"
    u["last_contact"] = datetime.utcnow().isoformat()

    # If user clicked course → stage paid? We'll let manual webhook confirm
    save_funnel(fid)

    await telegram_notify(
        f"🔥 <b>Горячий лид!</b>\n"
        f"Пользователь: <code>{userId[:8]}</code>\n"
        f"Кликнул: <b>{product}</b>\n"
        f"Записей АД: {number(len(u['bp_records']))} | Сон: {number(len(u['sleep_records']))}"
    )
    return {"ok": True, "stage": "hot"}


@app.post("/conversion")
async def conversion(userId: str, product: str, amount_rub: float = 0):
    """Webhook from payment provider (YooKassa, CloudPayments, etc.)"""
    fid = load_funnel()
    u = ensure_user(fid, userId)
    u["conversion"] = {"product": product, "amount_rub": amount_rub, "ts": datetime.utcnow().isoformat()}
    u["stage"] = "paid"
    save_funnel(fid)
    await telegram_notify(
        f"💰 <b>ОПЛАТА!</b>\n"
        f"Пользователь: <code>{userId[:8]}</code>\n"
        f"Продукт: <b>{product}</b>\n"
        f"Сумма: {number(amount_rub)} ₽"
    )
    return {"ok": True, "stage": "paid"}


@app.get("/funnel")
async def get_funnel():
    return load_funnel()


@app.get("/health")
async def health():
    return {"status": "ok"}


# small number formatter
number = lambda x: f"{x:,}".replace(",", " ")

# ─── START ───────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
