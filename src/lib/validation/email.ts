// List of disposable email domains to block
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'throwawaymail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'mailinator.com',
  'temp-mail.org',
  'fake-email.com',
  // Add more as needed
];

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmailFormat(email: string): EmailValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email format validation using regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  const domain = email.split('@')[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { isValid: false, error: 'Disposable email addresses are not allowed' };
  }

  return { isValid: true };
}
