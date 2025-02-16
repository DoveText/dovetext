import { ClipboardIcon } from '@heroicons/react/24/outline';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function CopyButton({ text, className = '', size = 'sm' }: CopyButtonProps) {
  const handleCopy = () => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    try {
      textArea.select();
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4'
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`ml-2 flex-shrink-0 ${className}`}
      title="Copy to clipboard"
    >
      <ClipboardIcon className={`${sizeClasses[size]} text-gray-400 hover:text-gray-600`} />
    </button>
  );
}
