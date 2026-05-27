/**
 * chart.js — Canvas BP trends (7-day sparkline + full chart)
 */
function drawBPChart(canvasId, records) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || records.length === 0) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width, H = rect.height;
  const PAD = 28; // padding for labels

  // Take last 7 records, reverse to chronological
  const data = records.slice(0, 7).reverse();

  const allSys = data.map(r => r.sys);
  const allDia = data.map(r => r.dia);
  const allPulse = data.map(r => r.pulse);
  const maxVal = Math.max(...allSys, ...allPulse, 140) + 10;
  const minVal = Math.min(...allDia, 60) - 10;

  const n = data.length;
  const x = i => PAD + (i * (W - PAD * 2)) / (n - 1 || 1);
  const y = v => H - PAD - ((v - minVal) / (maxVal - minVal)) * (H - PAD * 2);

  // Background zones
  ctx.fillStyle = '#FBEAE8'; // danger zone (sys > 140)
  const y140 = y(140), y120 = y(120);
  ctx.fillRect(PAD, y140, W - PAD * 2, y120 - y140);

  ctx.fillStyle = '#E8F8F0'; // normal zone
  ctx.fillRect(PAD, y120, W - PAD * 2, PAD - y120 + 10);

  // Grid lines
  ctx.strokeStyle = '#E0D8D0'; ctx.lineWidth = .5;
  [80, 100, 120, 140, 160].forEach(v => {
    const yy = y(v);
    ctx.beginPath(); ctx.moveTo(PAD, yy); ctx.lineTo(W - PAD, yy); ctx.stroke();
    ctx.fillStyle = '#A09080'; ctx.font = '10px Inter';
    ctx.fillText(v, 2, yy + 3);
  });

  // Draw lines
  function drawLine(values, color, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
    ctx.beginPath();
    values.forEach((v, i) => {
      const px = x(i), py = y(v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Dots
    ctx.fillStyle = color;
    values.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(x(i), y(v), 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  drawLine(allSys, '#6B2D3A', 2.5);   // bordeaux
  drawLine(allDia, '#5A7BA8', 2);     // soft blue
  drawLine(allPulse, '#4CAF50', 1.8); // green

  // Legend
  ctx.font = '11px Inter';
  const leg = [
    ['Систола', '#6B2D3A'],
    ['Диастола', '#5A7BA8'],
    ['Пульс', '#4CAF50']
  ];
  let lx = W - 100;
  leg.forEach(([label, color]) => {
    ctx.fillStyle = color; ctx.fillRect(lx, H - PAD + 8, 8, 8);
    ctx.fillStyle = '#6B5B50'; ctx.fillText(label, lx + 12, H - PAD + 16);
    lx -= 68;
  });

  // Date labels at bottom
  ctx.fillStyle = '#A09080'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
  data.forEach((r, i) => {
    const d = new Date(r.ts);
    ctx.fillText(`${d.getDate()}/${d.getMonth()+1}`, x(i), H - 4);
  });
}
