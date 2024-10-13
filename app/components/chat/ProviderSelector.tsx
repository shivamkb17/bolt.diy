import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { providerStore, setProvider, type Provider } from '~/lib/stores/provider';
import '~/styles/index.scss';

export function ProviderSelector() {
  const currentProvider = useStore(providerStore);
  const [inputValue, setInputValue] = useState(currentProvider.model);

  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
  };

  const providers = [
    'Anthropic (Claude)',
    'Together AI (meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo)',
    'Together AI (meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo)',
    'Together AI (mistralai/Mixtral-8x7B-Instruct-v0.1)',
    'OpenRouter (openai/gpt-3.5-turbo)',
    'OpenRouter (anthropic/claude-2)',
    'OpenRouter (google/palm-2-chat-bison)',
  ];

  return (
    <div className="relative w-[250px]">
      <input
        list="providers"
        value={inputValue}
        onChange={handleProviderChange}
        onMouseDown={() => {
          setInputValue(''); // Clear input on click
        }}
        className="w-full px-3 py-2 bg-transparent border border-white/20 rounded text-white hover:border-white/40 focus:border-white/60 outline-none"
      />
      <datalist id="providers">
        {providers.map((provider) => (
          <option key={provider} value={provider} />
        ))}
      </datalist>
    </div>
  );
}