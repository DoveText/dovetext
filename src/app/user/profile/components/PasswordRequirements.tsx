'use client';

interface PasswordRequirementsProps {
  password: string;
  currentPassword: string;
  confirmPassword: string;
}

export default function PasswordRequirements({ password, currentPassword, confirmPassword }: PasswordRequirementsProps) {
  // Check each password requirement
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isDifferentFromCurrent = password !== currentPassword || password === '';
  const matchesConfirmation = password === confirmPassword && password !== '';
  
  // Calculate password strength (0-5)
  const passedRequirements = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;
  
  // Get strength level and color
  const getStrengthInfo = () => {
    if (password === '') return { level: 'Empty', color: 'bg-gray-200', percentage: 0 };
    if (passedRequirements === 1) return { level: 'Very Weak', color: 'bg-red-500', percentage: 20 };
    if (passedRequirements === 2) return { level: 'Weak', color: 'bg-orange-500', percentage: 40 };
    if (passedRequirements === 3) return { level: 'Medium', color: 'bg-yellow-500', percentage: 60 };
    if (passedRequirements === 4) return { level: 'Strong', color: 'bg-blue-500', percentage: 80 };
    return { level: 'Very Strong', color: 'bg-green-500', percentage: 100 };
  };
  
  const strengthInfo = getStrengthInfo();
  
  // Style for requirement items
  const getItemStyle = (isValid: boolean) => {
    return `flex items-center text-xs ${
      isValid ? 'text-green-600' : password ? 'text-red-500' : 'text-gray-500'
    }`;
  };
  
  return (
    <div className="space-y-4">
      {/* Password strength indicator */}
      {password && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span>Password Strength:</span>
            <span className={`font-medium ${strengthInfo.color.replace('bg-', 'text-')}`}>{strengthInfo.level}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${strengthInfo.color} transition-all duration-300 ease-in-out`}
              style={{ width: `${strengthInfo.percentage}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <ul className="space-y-2">
        <li className={getItemStyle(hasMinLength)}>
          {hasMinLength ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          At least 8 characters long
        </li>
        <li className={getItemStyle(hasUppercase)}>
          {hasUppercase ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Include at least one uppercase letter (A-Z)
        </li>
        <li className={getItemStyle(hasLowercase)}>
          {hasLowercase ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Include at least one lowercase letter (a-z)
        </li>
        <li className={getItemStyle(hasNumber)}>
          {hasNumber ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Include at least one number (0-9)
        </li>
        <li className={getItemStyle(hasSpecialChar)}>
          {hasSpecialChar ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Include at least one special character (!@#$%^&*)
        </li>
        <li className={getItemStyle(isDifferentFromCurrent)}>
          {isDifferentFromCurrent ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Must be different from your current password
        </li>
        <li className={getItemStyle(matchesConfirmation)}>
          {matchesConfirmation ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          Passwords match
        </li>
      </ul>
    </div>
  );
}
