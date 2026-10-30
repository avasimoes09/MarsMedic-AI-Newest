// Identifies local patterns in wellness logs without using network services.
// Rule-based wellness pattern recognition for the sleep + food logs.
// Runs fully offline: every finding is derived from the logged entries.

export const SLEEP_TARGET = 7.5; // hours per night
export const MEAL_TARGET = 3; // logged intake entries per day
const DAY = 1440;
const BED_BASE = 18 * 60; // bedtimes are measured from 18:00 so 23:30 and 00:30 sit together

const HYDRATION = /water|electrolyte|drink|juice|tea|coffee/;
const CAFFEINE = /coffee|tea/;
const PROTEIN = /beef|chicken|tuna|egg|peanut|protein|yogurt|cheese|jerky|stew|almond|nuts/;
const CALCIUM = /cheese|yogurt|calcium|milk/;

const round1 = (n) => Math.round(n * 10) / 10;
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

function bedOffset(t) {
  let off = toMinutes(t) - BED_BASE;
  if (off < -12 * 60) off += DAY;
  return off;
}

function offsetClock(off) {
  const total = (((BED_BASE + off) % DAY) + DAY) % DAY;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function fmtDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function buildRecommendations(c) {
  const recs = [];
  if (c.nights.length >= 3 && c.avgSleep < SLEEP_TARGET) {
    recs.push(`Move lights-out 45 minutes earlier for the next three nights (target ${SLEEP_TARGET} h) and compare the log.`);
  }
  if (c.spread > 90) recs.push('Anchor a fixed wake time and take bright light within 30 minutes of waking.');
  if (c.avgBed !== null && c.avgBed >= bedOffset('23:30')) recs.push('Start a 30-minute wind-down at 22:30 to pull sleep onset inside the window.');
  if (c.sleepDebt >= 4) recs.push('Schedule one 30-minute recovery nap within the next two days.');
  if (c.mealCount === 0 || c.mealsPerDay < MEAL_TARGET) {
    recs.push('Log every meal and drink for three days to establish an intake baseline.');
  }
  if (c.mealCount > 0 && c.hydration / c.daySpan < 1) recs.push('Add one logged hydration drink with each meal.');
  if (c.mealCount >= 4 && c.protein === 0) recs.push('Add a protein source (jerky, tuna, nut butter, protein bar) to each main meal.');
  if (recs.length === 0) recs.push('Hold the current routine and re-run the analysis after three more nights.');
  return recs.slice(0, 4);
}

export function analyzeWellness(sleepLogs = [], mealLogs = []) {
  const nights = sleepLogs
    .filter((s) => typeof s.hours === 'number' && s.log_date)
    .sort((a, b) => (a.log_date < b.log_date ? -1 : a.log_date > b.log_date ? 1 : 0))
    .slice(-14);

  const hours = nights.map((n) => n.hours);
  const avgSleep = hours.length ? round1(mean(hours)) : null;
  const last7 = nights.slice(-7);
  const sleepDebt = last7.length ? round1(last7.reduce((s, n) => s + Math.max(0, SLEEP_TARGET - n.hours), 0)) : null;

  const bedTimes = nights.filter((n) => n.sleep_time).map((n) => bedOffset(n.sleep_time));
  const avgBed = bedTimes.length ? Math.round(mean(bedTimes)) : null;
  const spread = bedTimes.length > 1 ? Math.round(Math.max(...bedTimes) - Math.min(...bedTimes)) : 0;
  const earliest = bedTimes.length ? offsetClock(Math.min(...bedTimes)) : null;
  const latest = bedTimes.length ? offsetClock(Math.max(...bedTimes)) : null;

  const daySpan = Math.max(1, new Set(mealLogs.map((m) => m.log_date).filter(Boolean)).size);
  const mealsPerDay = mealLogs.length ? round1(mealLogs.length / daySpan) : null;
  const has = (name, re) => re.test((name || '').toLowerCase());
  const hydration = mealLogs.filter((m) => has(m.food_name, HYDRATION)).length;
  const caffeine = mealLogs.filter((m) => has(m.food_name, CAFFEINE)).length;
  const protein = mealLogs.filter((m) => has(m.food_name, PROTEIN)).length;
  const calcium = mealLogs.filter((m) => has(m.food_name, CALCIUM)).length;

  const counts = {};
  mealLogs.forEach((m) => {
    const key = (m.food_name || '').trim();
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const topShare = topEntry && mealLogs.length ? Math.round((topEntry[1] / mealLogs.length) * 100) : null;

  const patterns = [];
  const add = (severity, title, detail) => patterns.push({ severity, title, detail });

  if (nights.length < 3) {
    add('info', 'Baseline not yet established',
      `Only ${nights.length} sleep ${nights.length === 1 ? 'entry' : 'entries'} on file. Three or more nights are needed before a sleep pattern is meaningful.`);
  } else {
    const gap = round1(SLEEP_TARGET - avgSleep);
    if (avgSleep < SLEEP_TARGET - 1) {
      add('alert', 'Chronic short sleep', `Averaging ${avgSleep} h across ${nights.length} nights — ${gap} h below the ${SLEEP_TARGET} h mission target every night.`);
    } else if (avgSleep < SLEEP_TARGET) {
      add('watch', 'Sleep slightly short', `Averaging ${avgSleep} h, ${gap} h under the ${SLEEP_TARGET} h mission target.`);
    } else {
      add('info', 'Sleep duration on target', `Averaging ${avgSleep} h across ${nights.length} nights — at or above the ${SLEEP_TARGET} h mission target.`);
    }

    if (sleepDebt >= 4) {
      add('alert', 'Sleep debt accumulating', `${sleepDebt} h of lost sleep across the last ${last7.length} nights. Reaction time and decision quality degrade measurably past 4 h of debt.`);
    }

    if (bedTimes.length > 1 && spread > 90) {
      add('watch', 'Irregular sleep timing', `Bedtimes range from ${earliest} to ${latest} — a ${fmtDuration(spread)} swing. A drifting rhythm lowers sleep quality and next-day focus.`);
    } else if (bedTimes.length > 1) {
      add('info', 'Stable sleep timing', `Bedtimes stay within ${fmtDuration(spread)} of each other, around ${offsetClock(avgBed)} — a consistent circadian anchor.`);
    }

    if (avgBed !== null && avgBed >= bedOffset('23:30')) {
      add('watch', 'Late sleep onset', `Average lights-out is ${offsetClock(avgBed)}, after the 23:30 sleep window.`);
    }

    if (nights.length >= 6) {
      const recent = round1(mean(nights.slice(-3).map((n) => n.hours)));
      const prior = round1(mean(nights.slice(-6, -3).map((n) => n.hours)));
      const delta = round1(recent - prior);
      if (delta >= 0.5) add('info', 'Recovering trend', `The last 3 nights average ${recent} h, up ${delta} h on the 3 nights before.`);
      else if (delta <= -0.5) add('watch', 'Declining trend', `The last 3 nights average ${recent} h, down ${Math.abs(delta)} h on the 3 nights before.`);
    }
  }

  if (mealLogs.length === 0) {
    add('info', 'No food logged yet', 'Log meals and drinks to build an intake pattern over time.');
  } else {
    if (mealsPerDay < MEAL_TARGET) {
      add('watch', 'Intake logging sparse', `${mealsPerDay} entries per day across ${daySpan} ${daySpan === 1 ? 'day' : 'days'} — below a full ${MEAL_TARGET}-entry day. Gaps hide nutrition drift.`);
    }
    if (hydration / daySpan < 1) {
      add('watch', 'Fluid intake low', `${hydration} hydration ${hydration === 1 ? 'entry' : 'entries'} across ${daySpan} ${daySpan === 1 ? 'day' : 'days'}. Spaceflight raises fluid loss — keep one logged drink per meal.`);
    }
    if (protein === 0 && mealLogs.length >= 4) {
      add('watch', 'No protein source logged', 'No protein-rich entries found. Muscle and bone loss accelerate in transit without steady protein intake.');
    } else if (calcium === 0 && mealLogs.length >= 4) {
      add('info', 'Calcium source missing', 'No calcium-rich entries (cheese, yogurt, supplement) — a known driver of bone mineral loss.');
    }
    if (caffeine >= 3) {
      add('info', 'Caffeine load noted', `${caffeine} caffeinated ${caffeine === 1 ? 'entry' : 'entries'} logged. Confirm none land within 6 h of lights-out.`);
    }
    if (topShare !== null && topShare >= 40 && mealLogs.length >= 5) {
      add('info', 'Repetitive menu', `${topEntry[0]} makes up ${topShare}% of logged food. Variety protects against micronutrient shortfalls.`);
    }
  }

  const order = { alert: 0, watch: 1, info: 2 };
  const ranked = [...patterns].sort((a, b) => order[a.severity] - order[b.severity]);
  const enoughData = nights.length >= 3;
  const status = ranked.some((p) => p.severity === 'alert')
    ? 'attention'
    : ranked.some((p) => p.severity === 'watch')
      ? 'watch'
      : enoughData ? 'stable' : 'insufficient';

  const headline = !enoughData ? 'Building a baseline' : ranked[0] ? ranked[0].title : 'No pattern detected';
  const summary = `Based on ${nights.length} sleep ${nights.length === 1 ? 'entry' : 'entries'} and ${mealLogs.length} food ${mealLogs.length === 1 ? 'entry' : 'entries'}`
    + `${avgSleep !== null ? ` · ${avgSleep} h average sleep` : ''}`
    + `${mealsPerDay !== null ? ` · ${mealsPerDay} food entries per day` : ''}.`;

  const metrics = {
    avgSleep,
    sleepDebt,
    spread,
    avgBedtime: avgBed === null ? null : offsetClock(avgBed),
    earliest,
    latest,
    nights: nights.length,
    mealCount: mealLogs.length,
    mealsPerDay,
    hydration,
    caffeine,
    protein,
  };

  return {
    status,
    headline,
    summary,
    patterns: ranked,
    recommendations: buildRecommendations({
      nights, avgSleep, sleepDebt, spread, avgBed, mealsPerDay, hydration, daySpan, protein, mealCount: mealLogs.length,
    }),
    metrics,
  };
}