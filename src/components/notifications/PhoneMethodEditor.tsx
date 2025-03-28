import { PhoneConfig } from '@/types/delivery-method';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumber } from 'libphonenumber-js';

interface PhoneMethodEditorProps {
  config: PhoneConfig;
  onChange: (config: PhoneConfig) => void;
  validationErrors?: Record<string, string>;
}

function getPhoneHint(enableText: boolean, enableVoice: boolean): string {
  if (enableText && enableVoice) {
    return 'This number will receive both text messages and voice calls.';
  } else if (enableText) {
    return 'This number will only receive text messages.';
  } else if (enableVoice) {
    return 'This number will only receive voice calls.';
  }
  return 'Please enable at least one notification method.';
}

export default function PhoneMethodEditor({ config, onChange, validationErrors = {} }: PhoneMethodEditorProps) {
  const validatePhoneNumber = (phoneNumber: string, countryCode: string): string | null => {
    if (!phoneNumber) {
      return 'Phone number is required';
    }

    try {
      const parsedNumber = parsePhoneNumber(phoneNumber, countryCode.toUpperCase());
      if (!parsedNumber?.isValid()) {
        return 'Invalid phone number';
      }
    } catch (error) {
      return 'Invalid phone number';
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
          Phone Number
        </label>
        <div className="flex space-x-4">
          <div className="flex-grow">
            <div>
              <PhoneInput
                country={'cn'}
                value={config.phoneNumber}
                onChange={(value, data: any) => {
                  onChange({
                    ...config,
                    phoneNumber: value,
                    countryCode: data.dialCode
                  });
                }}
                containerClass="phone-input-container"
                specialLabel=""
                masks={{cn: '... .... ....', us: '... ... ....', gb: '.... ......'}}
              />
            </div>
            {validationErrors.phone ? (
              <p className="mt-2 text-sm text-red-500">{validationErrors.phone}</p>
            ) : (
              <p className={`mt-2 text-sm ${!config.enableText && !config.enableVoice ? 'text-red-500' : 'text-gray-500'}`}>
                {getPhoneHint(config.enableText, config.enableVoice)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4 h-[38px]">
            <label className="inline-flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={config.enableText}
                onChange={(e) => onChange({ ...config, enableText: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Text</span>
            </label>
            <label className="inline-flex items-center whitespace-nowrap">
              <input
                type="checkbox"
                checked={config.enableVoice}
                onChange={(e) => onChange({ ...config, enableVoice: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Voice</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
