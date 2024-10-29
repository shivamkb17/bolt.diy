import React, { useEffect, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import { popupStore } from '~/lib/stores/popups';

const FeedbackPopup: React.FC = () => {
  const fetcher = useFetcher<{ success: boolean; error: string }>();
  const [apiGenerationRating, setApiGenerationRating] = useState<number | null>(null);
  const [deploymentRating, setDeploymentRating] = useState<number | null>(null);
  const [toolUsageFrequency, setToolUsageFrequency] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { feedback } = useStore(popupStore);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.popup-content')) return;
      popupStore.setKey('feedback', false);
    };

    if (feedback) {
      window.addEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [feedback]);

  useEffect(() => {
    if (fetcher.data?.success) {
      setSuccessMessage(true);
      setError(null);
    } else if (fetcher.data?.error) {
      setError(fetcher.data?.error || 'Something went wrong. Please try again.');
    }
  }, [fetcher.data]);

  if (!feedback) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    fetcher.submit(
      {
        apiGenerationRating: apiGenerationRating?.toString() || '',
        deploymentRating: deploymentRating?.toString() || '',
        toolUsageFrequency: toolUsageFrequency || '',
      },
      { method: 'post', action: '/api/feedback' },
    );
  };

  return (
    <div className="p-4 sm:p-0 popup-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="popup-content bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-6">
        {!successMessage ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Submit feedback for 25 credits</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">How useful is the automatic API generation?</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`w-10 h-10 rounded-full border ${apiGenerationRating === value ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-400'}`}
                      onClick={() => setApiGenerationRating(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2">How useful is the 1-click deployments?</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`w-10 h-10 rounded-full border ${deploymentRating === value ? 'bg-blue-600 text-white' : 'border-gray-300 text-gray-400'}`}
                      onClick={() => setDeploymentRating(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2">How often would you use this tool?</label>
                <div className="flex flex-col items-start space-y-2">
                  {['Never', 'Once a month', 'Once a week', 'Once a day', 'Throughout the day'].map((option) => (
                    <label key={option} className="inline-flex items-center space-x-2">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        checked={toolUsageFrequency === option}
                        onChange={() => setToolUsageFrequency(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500">{error}</p>}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                disabled={!apiGenerationRating || !deploymentRating || !toolUsageFrequency}
              >
                Submit Feedback
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Thank you for your feedback!</h2>
            <p className="mb-4">25 credits have been added to your account 🚀</p>
            <button
              className="py-2 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              onClick={() => popupStore.setKey('feedback', false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPopup;
