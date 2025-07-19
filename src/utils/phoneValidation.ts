
export const validateIndianPhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check if it starts with +91 or 91 or is 10 digits
  if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    return true;
  } else if (cleanNumber.length === 10) {
    return true;
  }
  
  return false;
};

export const formatIndianPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 91, format it
  if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    return `+91 ${cleanNumber.slice(2, 7)} ${cleanNumber.slice(7)}`;
  }
  
  // If it's 10 digits, add +91 prefix
  if (cleanNumber.length === 10) {
    return `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
  }
  
  return phoneNumber;
};

export const normalizeIndianPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 91, use as is
  if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    return `+${cleanNumber}`;
  }
  
  // If it's 10 digits, add +91 prefix
  if (cleanNumber.length === 10) {
    return `+91${cleanNumber}`;
  }
  
  return phoneNumber;
};
