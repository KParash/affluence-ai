import { getDb } from '../db/database.js';

// ==============================
// FEATURE A: Sales Prediction
// ==============================
export async function predictSales(days = 7) {
  const db = await getDb();

  const historicalSales = db.prepare(`
    SELECT DATE(date) as day, COUNT(*) as count, SUM(amount) as revenue
    FROM sales WHERE date >= datetime('now', '-90 days') AND status = 'completed'
    GROUP BY DATE(date) ORDER BY day
  `).all();

  if (historicalSales.length < 7) {
    return { predictions: [], confidence: 0, message: 'Not enough historical data' };
  }

  const revenues = historicalSales.map(d => d.revenue);
  const counts = historicalSales.map(d => d.count);
  const n = revenues.length;
  const xMean = (n - 1) / 2;
  const yMean = revenues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0, denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (revenues[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  const windowSize = Math.min(7, revenues.length);
  const recentRevenues = revenues.slice(-windowSize);
  const weights = recentRevenues.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const wma = recentRevenues.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;

  const residuals = revenues.map((y, i) => y - (slope * i + intercept));
  const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r ** 2, 0) / n);

  const predictions = [];
  const lastDate = new Date(historicalSales[historicalSales.length - 1].day);

  for (let d = 1; d <= days; d++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + d);
    const trendValue = slope * (n + d - 1) + intercept;
    const predicted = trendValue * 0.6 + wma * 0.4;
    const dayMultipliers = [0.85, 0.95, 1.0, 1.05, 1.1, 1.15, 0.9];
    const seasonalPrediction = Math.max(0, predicted * dayMultipliers[date.getDay()]);

    predictions.push({
      date: date.toISOString().slice(0, 10),
      predicted_revenue: Math.round(seasonalPrediction * 100) / 100,
      predicted_sales: Math.max(1, Math.round(seasonalPrediction / (yMean / (counts.reduce((a, b) => a + b, 0) / n)))),
      confidence_low: Math.max(0, Math.round((seasonalPrediction - 1.96 * stdDev) * 100) / 100),
      confidence_high: Math.round((seasonalPrediction + 1.96 * stdDev) * 100) / 100,
    });
  }

  const ssRes = residuals.reduce((sum, r) => sum + r ** 2, 0);
  const ssTot = revenues.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const confidence = Math.max(0, Math.min(100, Math.round(rSquared * 100)));
  const trend = slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable';
  const trendStrength = Math.abs(slope) > stdDev * 0.1 ? 'strong' : 'moderate';

  return {
    predictions, historical: historicalSales.slice(-30),
    trend: { direction: trend, strength: trendStrength, dailyChange: Math.round(slope * 100) / 100 },
    confidence,
    summary: `Sales are trending ${trend} with ${trendStrength} momentum. Expected ${days}-day revenue: ₹${predictions.reduce((s, p) => s + p.predicted_revenue, 0).toLocaleString()}.`,
  };
}

// ==============================
// FEATURE B: Performance Insights
// ==============================
export async function generateInsights(influencerId = null) {
  const db = await getDb();
  const insights = [];

  // Day-of-week analysis
  const influencerFilter = influencerId ? `AND s.influencer_id = ${influencerId}` : '';

  if (influencerId) {
    const dayOfWeekSales = db.prepare(`
      SELECT CASE strftime('%w', s.date)
        WHEN '0' THEN 'Sunday' WHEN '1' THEN 'Monday' WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday' WHEN '4' THEN 'Thursday' WHEN '5' THEN 'Friday' WHEN '6' THEN 'Saturday'
      END as day_name, strftime('%w', s.date) as day_num, COUNT(*) as sales_count, SUM(s.amount) as revenue
      FROM sales s WHERE s.status = 'completed' ${influencerFilter}
      GROUP BY strftime('%w', s.date) ORDER BY sales_count DESC
    `).all();

    if (dayOfWeekSales.length > 0) {
      const bestDay = dayOfWeekSales[0];
      const avgDaily = dayOfWeekSales.reduce((s, d) => s + d.sales_count, 0) / Math.max(dayOfWeekSales.length, 1);
      const multiplier = (bestDay.sales_count / avgDaily).toFixed(1);
      if (parseFloat(multiplier) > 1.3) {
        insights.push({ type: 'pattern', icon: '📅', title: 'Peak Day Detected', text: `Performs ${multiplier}x better on ${bestDay.day_name}s compared to average. Consider scheduling posts on this day.`, confidence: Math.min(95, Math.round(parseFloat(multiplier) * 30)), priority: 'high' });
      }
      const weekendSales = dayOfWeekSales.filter(d => ['0', '6'].includes(d.day_num));
      const weekdaySales = dayOfWeekSales.filter(d => !['0', '6'].includes(d.day_num));
      const weekendAvg = weekendSales.reduce((s, d) => s + d.sales_count, 0) / Math.max(1, weekendSales.length);
      const weekdayAvg = weekdaySales.reduce((s, d) => s + d.sales_count, 0) / Math.max(1, weekdaySales.length);
      if (weekendAvg > weekdayAvg * 1.5) {
        insights.push({ type: 'pattern', icon: '🏖️', title: 'Weekend Performer', text: `Weekend sales are ${((weekendAvg / weekdayAvg - 1) * 100).toFixed(0)}% higher than weekdays. This influencer's audience is most active on weekends.`, confidence: 82, priority: 'medium' });
      }
    }
  } else {
    // Global insights
    const perInfluencer = db.prepare(`
      SELECT i.id, u.name, 
        CASE strftime('%w', s.date) WHEN '0' THEN 'Sunday' WHEN '1' THEN 'Monday' WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday' WHEN '4' THEN 'Thursday' WHEN '5' THEN 'Friday' WHEN '6' THEN 'Saturday' END as day_name,
        COUNT(*) as sales_count
      FROM sales s JOIN influencers i ON s.influencer_id = i.id JOIN users u ON i.user_id = u.id
      WHERE s.status = 'completed' GROUP BY s.influencer_id, strftime('%w', s.date) ORDER BY s.influencer_id, sales_count DESC
    `).all();

    const byInf = {};
    perInfluencer.forEach(d => {
      if (!byInf[d.id]) byInf[d.id] = { name: d.name, days: [] };
      byInf[d.id].days.push(d);
    });

    for (const [, data] of Object.entries(byInf)) {
      if (data.days.length > 0) {
        const best = data.days[0];
        const avg = data.days.reduce((s, d) => s + d.sales_count, 0) / data.days.length;
        if (best.sales_count > avg * 1.5) {
          insights.push({ type: 'pattern', icon: '📅', title: `${data.name}: Peak Day`, text: `${data.name} performs best on ${best.day_name}s with ${((best.sales_count / avg - 1) * 100).toFixed(0)}% above average sales.`, confidence: 78, priority: 'medium' });
        }
      }
    }
  }

  // Click-to-conversion analysis
  const query = influencerId
    ? `SELECT i.id, u.name, (SELECT COUNT(*) FROM clicks WHERE influencer_id=i.id) as clicks, (SELECT COUNT(*) FROM sales WHERE influencer_id=i.id AND status='completed') as sales FROM influencers i JOIN users u ON i.user_id=u.id WHERE i.id=${influencerId}`
    : `SELECT i.id, u.name, (SELECT COUNT(*) FROM clicks WHERE influencer_id=i.id) as clicks, (SELECT COUNT(*) FROM sales WHERE influencer_id=i.id AND status='completed') as sales FROM influencers i JOIN users u ON i.user_id=u.id`;

  const conversionData = db.prepare(query).all();
  for (const inf of conversionData) {
    const rate = inf.clicks > 0 ? (inf.sales / inf.clicks * 100) : 0;
    if (inf.clicks > 100 && rate < 2) {
      insights.push({ type: 'warning', icon: '⚠️', title: influencerId ? 'Low Conversion Rate' : `${inf.name}: Low Conversion`, text: `${inf.clicks} clicks but only ${rate.toFixed(1)}% conversion rate. This suggests audience mismatch — high interest but low purchase intent.`, confidence: 88, priority: 'high' });
    } else if (rate > 15) {
      insights.push({ type: 'success', icon: '🎯', title: influencerId ? 'Exceptional Conversion' : `${inf.name}: Star Performer`, text: `${rate.toFixed(1)}% conversion rate is exceptional! This influencer's audience has strong purchase intent.`, confidence: 92, priority: 'high' });
    }
  }

  // Revenue trend
  const weeklyRevenue = db.prepare(`
    SELECT strftime('%Y-W%W', date) as week, SUM(amount) as revenue
    FROM sales WHERE date >= datetime('now', '-60 days') AND status = 'completed' ${influencerFilter}
    GROUP BY strftime('%Y-W%W', date) ORDER BY week
  `).all();

  if (weeklyRevenue.length >= 3) {
    const recent = weeklyRevenue.slice(-2);
    const previous = weeklyRevenue.slice(-4, -2);
    const recentAvg = recent.reduce((s, w) => s + w.revenue, 0) / recent.length;
    const previousAvg = previous.reduce((s, w) => s + w.revenue, 0) / Math.max(1, previous.length);
    if (previousAvg > 0) {
      const change = ((recentAvg - previousAvg) / previousAvg * 100).toFixed(0);
      if (parseFloat(change) > 20) {
        insights.push({ type: 'success', icon: '📈', title: 'Revenue Surge', text: `Revenue is up ${change}% compared to the previous period. Momentum is building.`, confidence: 85, priority: 'high' });
      } else if (parseFloat(change) < -20) {
        insights.push({ type: 'warning', icon: '📉', title: 'Revenue Decline', text: `Revenue has dropped ${Math.abs(change)}% compared to the previous period.`, confidence: 85, priority: 'high' });
      }
    }
  }

  // Top product insight (global only)
  if (!influencerId) {
    const productPerf = db.prepare(`
      SELECT p.name, COUNT(*) as sales, SUM(s.amount) as revenue
      FROM sales s JOIN products p ON s.product_id = p.id
      WHERE s.status = 'completed' AND s.date >= datetime('now', '-30 days')
      GROUP BY p.id ORDER BY revenue DESC LIMIT 3
    `).all();
    if (productPerf.length > 0) {
      const top = productPerf[0];
      const totalRev = productPerf.reduce((s, p) => s + p.revenue, 0);
      insights.push({ type: 'info', icon: '🏆', title: 'Top Product', text: `"${top.name}" drives ${((top.revenue/totalRev)*100).toFixed(0)}% of affiliate revenue with ${top.sales} sales.`, confidence: 90, priority: 'medium' });
    }
  }

  return insights.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] || 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] || 2));
}

// ==============================
// FEATURE C: Fraud Detection
// ==============================
export async function detectFraud() {
  const db = await getDb();
  const alerts = [];

  // Click spike detection
  const dailyClicks = db.prepare(`
    SELECT influencer_id, DATE(timestamp) as day, COUNT(*) as click_count
    FROM clicks WHERE timestamp >= datetime('now', '-30 days')
    GROUP BY influencer_id, DATE(timestamp)
  `).all();

  const influencerClicks = {};
  dailyClicks.forEach(d => {
    if (!influencerClicks[d.influencer_id]) influencerClicks[d.influencer_id] = [];
    influencerClicks[d.influencer_id].push(d);
  });

  for (const [infId, days] of Object.entries(influencerClicks)) {
    const counts = days.map(d => d.click_count);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const stdDev = Math.sqrt(counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length);
    const info = db.prepare('SELECT u.name FROM influencers i JOIN users u ON i.user_id=u.id WHERE i.id=?').get(parseInt(infId));

    for (const day of days) {
      const zScore = stdDev > 0 ? (day.click_count - mean) / stdDev : 0;
      if (zScore > 3) {
        alerts.push({
          type: 'click_spike', severity: zScore > 5 ? 'critical' : 'high',
          influencer_id: parseInt(infId), influencer_name: info?.name || 'Unknown', date: day.day,
          details: `Abnormal click spike: ${day.click_count} clicks (avg: ${mean.toFixed(0)}, Z-score: ${zScore.toFixed(1)}). ${(day.click_count / mean).toFixed(1)}x normal volume.`,
          metric: { actual: day.click_count, expected: Math.round(mean), zScore: parseFloat(zScore.toFixed(2)) },
        });
      }
    }
  }

  // Duplicate IP detection
  const duplicateIPs = db.prepare(`
    SELECT influencer_id, ip_address, COUNT(*) as count, DATE(timestamp) as day
    FROM clicks WHERE timestamp >= datetime('now', '-7 days')
    GROUP BY influencer_id, ip_address, DATE(timestamp) HAVING count > 10
    ORDER BY count DESC LIMIT 20
  `).all();

  for (const dup of duplicateIPs) {
    const info = db.prepare('SELECT u.name FROM influencers i JOIN users u ON i.user_id=u.id WHERE i.id=?').get(dup.influencer_id);
    alerts.push({
      type: 'duplicate_ip', severity: dup.count > 50 ? 'critical' : dup.count > 20 ? 'high' : 'medium',
      influencer_id: dup.influencer_id, influencer_name: info?.name || 'Unknown', date: dup.day,
      details: `${dup.count} clicks from same IP on ${dup.day}. Possible click manipulation.`,
      metric: { clicks: dup.count },
    });
  }

  // Risk scoring
  const riskScores = {};
  for (const alert of alerts) {
    if (!riskScores[alert.influencer_id]) riskScores[alert.influencer_id] = { name: alert.influencer_name, score: 0, alerts: 0 };
    riskScores[alert.influencer_id].score += { critical: 30, high: 20, medium: 10, low: 5 }[alert.severity] || 5;
    riskScores[alert.influencer_id].alerts++;
  }

  const riskAssessment = Object.entries(riskScores).map(([id, data]) => ({
    influencer_id: parseInt(id), influencer_name: data.name,
    risk_score: Math.min(100, data.score), risk_level: data.score >= 50 ? 'High' : data.score >= 25 ? 'Medium' : 'Low',
    alert_count: data.alerts,
  })).sort((a, b) => b.risk_score - a.risk_score);

  return {
    alerts: alerts.sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 }[a.severity] || 3) - ({ critical: 0, high: 1, medium: 2, low: 3 }[b.severity] || 3)),
    riskAssessment,
    summary: {
      total_alerts: alerts.length, critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length, medium: alerts.filter(a => a.severity === 'medium').length,
      high_risk_influencers: riskAssessment.filter(r => r.risk_level === 'High').length,
    },
  };
}
