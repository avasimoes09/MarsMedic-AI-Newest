// Common space-flight foods (ISS-style menu) used to preload the food logger.
export const SPACE_FOODS = [
  'Tortilla (flour)',
  'Rehydratable scrambled eggs',
  'Thermostabilized beef stew',
  'Chicken teriyaki (rehydratable)',
  'Spaghetti with meat sauce',
  'Beef jerky',
  'Tuna in pouch',
  'Peanut butter',
  'Cheddar cheese spread',
  'Granola with milk',
  'Trail mix',
  'Almonds',
  'Dried apricots',
  'Protein bar',
  'Fruit cocktail (thermostabilized)',
  'Chocolate pudding',
  'Mashed potatoes (rehydratable)',
  'Instant rice',
  'Space ramen (instant noodles)',
  'Yogurt (shelf-stable)',
  'Orange drink (rehydratable)',
  'Electrolyte drink mix',
  'Coffee (freeze-dried)',
  'Green tea',
  'Water',
  'Multivitamin tablet',
  'Vitamin D supplement',
  'Calcium supplement',
];

export const FOOD_UNITS = ['servings', 'packet', 'bar', 'g', 'ml', 'oz', 'cup', 'piece', 'tablets'];

export const AMOUNT_OPTIONS = [0.5, 1, 1.5, 2, 3];

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const pad2 = (n) => String(n).padStart(2, '0');

// Hours between two "HH:MM" clock times; a wake time earlier than the sleep
// time means the sleep crossed midnight.
export function hoursBetween(sleepTime, wakeTime) {
  const [sh, sm] = sleepTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = wh * 60 + wm - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

export function formatClock(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export { pad2 };