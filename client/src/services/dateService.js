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

export const formatDobDate = (input) => {
  if (!input) return '';

  // Remove any non-numeric characters
  let numbers = input.replace(/\D/g, "");

  // Ensure we don't exceed the expected length
  numbers = numbers.substring(0, 8);

  // Add the slashes
  if (numbers.length > 4) {
    numbers = numbers.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
  } else if (numbers.length > 2) {
    numbers = numbers.replace(/(\d{2})(\d{0,2})/, "$1/$2");
  }

  return numbers;
};

export const handleDobDateSubmit = (selectedDate) => {
  if (!selectedDate) return '';

  // Convert MM/DD/YYYY to YYYY-MM-DD for the date input
  if (selectedDate.length === 10) {
    const [month, day, year] = selectedDate.split("/");
    // Validate the date components
    if (!month || !day || !year) return selectedDate;
    
    // Basic date validation
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) {
      return selectedDate;
    }

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }
  return selectedDate;
};