import { useState } from 'react';
import { createScopedLogger } from '~/utils/logger';
import { chatStore } from '~/lib/stores/chat';

const logger = createScopedLogger('usePromptEnhancement');

export function usePromptEnhancer() {
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const [promptEnhanced, setPromptEnhanced] = useState(false);

  const resetEnhancer = () => {
    setEnhancingPrompt(false);
    setPromptEnhanced(false);
  };

  const enhancePrompt = async (input: string, setInput: (value: string) => void) => {
    setEnhancingPrompt(true);
    setPromptEnhanced(false);

    const response = await fetch('/api/enhancer', {
      method: 'POST',
      body: JSON.stringify({
        message: input,
      }),
    });

    const reader = response.body?.getReader();

    // parse the response headers to update the daily and bonus quota
    const dailyQuota = response.headers.get('x-daily-quota-remaining');
    const bonusQuota = response.headers.get('x-bonus-quota-remaining');
    chatStore.setKey('dailyQuotaRemaining', Number(dailyQuota));
    chatStore.setKey('bonusQuotaRemaining', Number(bonusQuota));

    const originalInput = input;

    if (reader) {
      const decoder = new TextDecoder();

      let _input = '';
      let _error;

      try {
        setInput('');

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          let temp = decoder.decode(value);
          // TODO: Figure out why the prompt enhancer always ends with '[object Object]'
          if (temp === '[object Object]') {
            continue;
          }
          _input += temp;

          logger.trace(decoder.decode(value));

          setInput(_input);
        }
      } catch (error) {
        _error = error;
        setInput(originalInput);
      } finally {
        if (_error) {
          logger.error(_error);
        }

        setEnhancingPrompt(false);
        setPromptEnhanced(true);

        setTimeout(() => {
          setInput(_input);
        });
      }
    }
  };

  return { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer };
}
