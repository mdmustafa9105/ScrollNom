// ScrollNom Time Belt Determination Service

export const BELT_SCHEDULE = {
  TRANSITION_MORNING: 'TRANSITION', // 05:00 - 06:00
  MORNING: 'MORNING',               // 06:00 - 11:00
  MORNING_AFTERNOON: 'MORNING_AFTERNOON_MIX', // 11:00 - 12:00
  AFTERNOON: 'AFTERNOON',           // 12:00 - 15:00
  AFTERNOON_EVENING: 'AFTERNOON_EVENING_MIX', // 15:00 - 16:00
  EVENING: 'EVENING',               // 16:00 - 21:00
  OVERNIGHT: 'OVERNIGHT'            // 21:00 - 05:00
};

export const getTimeBelt = (hour, minute = 0) => {
  const totalMinutes = hour * 60 + minute;

  // 05:00 (300m) to 06:00 (360m) -> TRANSITION
  if (totalMinutes >= 300 && totalMinutes < 360) {
    return { id: BELT_SCHEDULE.TRANSITION_MORNING, label: 'Transition Belt', prefer: ['breakfast', 'beverages'] };
  }
  // 06:00 (360m) to 11:00 (660m) -> MORNING
  if (totalMinutes >= 360 && totalMinutes < 660) {
    return { id: BELT_SCHEDULE.MORNING, label: 'Morning Belt', prefer: ['breakfast', 'beverages'] };
  }
  // 11:00 (660m) to 12:00 (720m) -> MORNING + AFTERNOON MIX
  if (totalMinutes >= 660 && totalMinutes < 720) {
    return { id: BELT_SCHEDULE.MORNING_AFTERNOON, label: 'Morning + Afternoon Mix', prefer: ['breakfast', 'main_food', 'beverages'] };
  }
  // 12:00 (720m) to 15:00 (900m) -> AFTERNOON
  if (totalMinutes >= 720 && totalMinutes < 900) {
    return { id: BELT_SCHEDULE.AFTERNOON, label: 'Afternoon Belt', prefer: ['main_food', 'beverages'] };
  }
  // 15:00 (900m) to 16:00 (960m) -> AFTERNOON + EVENING MIX
  if (totalMinutes >= 900 && totalMinutes < 960) {
    return { id: BELT_SCHEDULE.AFTERNOON_EVENING, label: 'Afternoon + Evening Mix', prefer: ['main_food', 'street_food', 'snacks', 'beverages'] };
  }
  // 16:00 (960m) to 21:00 (1260m) -> EVENING
  if (totalMinutes >= 960 && totalMinutes < 1260) {
    return { id: BELT_SCHEDULE.EVENING, label: 'Evening Belt', prefer: ['street_food', 'snacks', 'main_food', 'desserts', 'beverages'] };
  }
  // 21:00 (1260m) to 05:00 (300m next day) -> OVERNIGHT
  return { id: BELT_SCHEDULE.OVERNIGHT, label: 'Overnight Belt', prefer: ['main_food', 'beverages', 'snacks'] };
};
