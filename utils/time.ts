
export const getCurrentDay = (startDateStr: string): number => {
  const start = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Return clamped between 1-14, but logic wise we can show day count even if past 14
  if (now < start) return 1;
  return Math.max(1, diffDays);
};

export const isTimePassed = (timeStr: string): boolean => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  return now > scheduledTime;
};

export const formatTimeForDisplay = (timeStr: string): string => {
  return timeStr; // Assuming it's already in 12h format as requested
};
