import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { providerStore, setProvider, type Provider } from '~/lib/stores/provider';
import '~/styles/index.scss';

export function ProviderSelector() {
  const currentProvider = useStore(providerStore);
  const [inputValue, setInputValue] = useState(currentProvider.model);
  const [providers, setProviders] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState(''); // New state for API key

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json() as any;
        setProviders(data.data.map((a: any) => a.id));
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    };

    fetchProviders();
  }, []);

  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setProvider({ model: value, apiKey: apiKey }); // Update provider in store when selection changes
  };

  const handleApiKeyButtonClick = () => {
    const value = prompt("Enter API Key"); // Prompt user for API key
    if (value) {
      setApiKey(value); // Update API key state if a value is provided
      setProvider({ model: inputValue, apiKey: value }); // Update provider in store when API key is set
    }
  };

  return (
    <div className="flex space-x-2"> {/* Changed to flex for horizontal layout */}
      {/* Button to set API key */}
      <button
        onClick={handleApiKeyButtonClick}
        className="w-[120px] px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
      >
        Set API Key
      </button>
      <input
        list="providers"
        value={inputValue}
        onChange={handleProviderChange}
        onMouseDown={() => {
          setInputValue(''); // Clear input on click
        }}
        className="w-[300px] px-3 py-2 bg-transparent border border-white/20 rounded text-white hover:border-white/40 focus:border-white/60 outline-none" // Increased width for larger input
      />
      <datalist id="providers">
        {providers.map((provider) => (
          <option key={provider} value={provider} />
        ))}
      </datalist>
    </div>
  );
}
