import React, { useEffect, useMemo } from 'react';

type Provider = 'grok' | 'chatgpt' | 'gemini' | 'custom' | string;

interface ModeSelectorProps {
  provider: Provider;
  value?: string;
  onChange: (mode: string) => void;
}

const MODEL_OPTIONS: Record<string, { value: string; label?: string }[]> = {
  grok: [
    { value: 'grok-4' },
    { value: 'grok-3' },
  ],
  chatgpt: [
    { value: 'gpt-5' },
    { value: 'gpt-5-mini' },
    { value: 'gpt-5-nano' },
    { value: 'gpt-4.1' },
    { value: 'gpt-4.1-mini' },
    { value: 'gpt-4.1-nano' },
    { value: 'gpt-4o' },
    { value: 'gpt-4o-mini' },
  ],
  gemini: [
    { value: 'gemini-2.5-pro' },
    { value: 'gemini-2.5-flash' },
  ],
};

const ModeSelector: React.FC<ModeSelectorProps> = ({ provider, value, onChange }) => {
  const options = useMemo(() => MODEL_OPTIONS[provider] || [], [provider]);

  // Ensure a valid selection whenever provider changes or value is missing
  useEffect(() => {
    if (!options.length) return;
    const exists = value && options.some((o) => o.value === value);
    if (!exists) {
      onChange(options[0].value);
    }
  }, [provider]);

  if (provider === 'custom') return null;

  return (
    <select
      className="input w-full"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label || o.value}
        </option>
      ))}
    </select>
  );
};

export default ModeSelector;
