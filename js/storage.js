/**
 * storage.js — localStorage wrapper с typed records
 */
const DB = {
  key: name => `gromyko_${name}`,

  get(name) {
    try { return JSON.parse(localStorage.getItem(this.key(name))) || []; }
    catch { return []; }
  },

  set(name, data) {
    localStorage.setItem(this.key(name), JSON.stringify(data));
  },

  add(name, record) {
    const all = this.get(name);
    record.id = Date.now();
    record.ts = new Date().toISOString();
    all.unshift(record);
    this.set(name, all);
    return record;
  },

  last(name) {
    const all = this.get(name);
    return all[0] || null;
  },

  recent(name, days) {
    const cutoff = Date.now() - days * 864e5;
    return this.get(name).filter(r => new Date(r.ts).getTime() > cutoff);
  },

  // Анализ данных для AI-бота
  analyzeBP() {
    const recs = this.recent('bp', 14);
    if (recs.length < 3) return null;

    const sys = recs.map(r => r.sys);
    const dia = recs.map(r => r.dia);
    const pulse = recs.map(r => r.pulse);

    const avg = arr => Math.round(arr.reduce((a,b)=>a+b,0) / arr.length);
    const trend = arr => arr[0] - avg(arr.slice(-3)); // pos = рост

    const avgSys = avg(sys), avgDia = avg(dia), avgPulse = avg(pulse);
    const trendSys = trend(sys);

    let risk = 'low';
    if (avgSys >= 140 || avgDia >= 90) risk = 'high';
    else if (avgSys >= 130 || avgDia >= 85) risk = 'medium';
    else if (trendSys > 5) risk = 'rising';

    let stage = '';
    if (avgSys < 120 && avgDia < 80) stage = 'normal';
    else if (avgSys < 130 && avgDia < 80) stage = 'elevated';
    else if (avgSys < 140 || avgDia < 90) stage = 'stage1';
    else stage = 'stage2';

    return { recs, avgSys, avgDia, avgPulse, trendSys, risk, stage };
  },

  analyzeSleep() {
    const recs = this.recent('sleep', 14);
    if (recs.length < 3) return null;

    const hours = recs.map(r => parseFloat(r.hours) || 0);
    const stars = recs.map(r => parseInt(r.stars) || 0);

    const avgHours = (hours.reduce((a,b)=>a+b,0) / hours.length).toFixed(1);
    const avgStars = (stars.reduce((a,b)=>a+b,0) / stars.length).toFixed(1);

    let concern = false;
    if (avgHours < 6 || avgStars < 3) concern = true;

    return { recs, avgHours, avgStars, concern };
 }
};
