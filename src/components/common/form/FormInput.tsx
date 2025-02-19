interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export default function FormInput({ className = '', error, ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={`block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
        error ? 'ring-red-500' : 'ring-gray-300'
      } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${className}`}
    />
  );
}
