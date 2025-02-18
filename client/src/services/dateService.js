export const formatDateToUserTimezone = (timestamp) => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h12",
    timeZone: userTimezone,
  }).format(new Date(timestamp));
};

export const wait = async (timeInMs) => {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
};
