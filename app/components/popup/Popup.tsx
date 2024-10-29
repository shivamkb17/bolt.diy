import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import React, { useEffect } from 'react';
import { popupStore } from '~/lib/stores/popups';

const Popup: React.FC = () => {
  const navigate = useNavigate();

  const { login } = useStore(popupStore);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.popup-content')) return;
      popupStore.setKey('login', false);
    };

    if (login) {
      window.addEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [login]);

  if (!login) return null;

  return (
    <div className="popup-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="popup-content bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <h2 className="text-xl font-semibold mb-4">Continue with LaunchFlow</h2>
        <p className="mb-4">Sign in or create an account to continue using LaunchFlow.</p>
        <div className="space-y-4">
          <button
            className="w-full py-2 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-900"
            onClick={() => navigate('/api/auth/login')}
          >
            Sign In
          </button>
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => navigate('/api/auth/signup')}
          >
            Sign Up
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          By using LaunchFlow, you agree to the collection of usage data for analytics.
        </p>
      </div>
    </div>
  );
};

export default Popup;
