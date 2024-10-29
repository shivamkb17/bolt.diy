import { useFetcher } from '@remix-run/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/DialogOld';
import { useEffect, useState } from 'react';
import { Button } from '../ui/ButtonOld';
import { fileStore } from '~/lib/stores/files';
import JSZip from 'jszip';
import { WORK_DIR } from '~/utils/constants';
import { useStore } from '@nanostores/react';
import { chatId } from '~/lib/persistence';
import { popupStore } from '~/lib/stores/popups';
import { userStore } from '~/lib/stores/user';
import { deploymentStore } from '~/lib/stores/deployments';

const DeploymentPopup: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const fetcher = useFetcher<{ serviceUrl: string }>();

  const user = useStore(userStore);

  const files = useStore(fileStore.files);
  const { deployment } = useStore(popupStore);

  const zipProject = async () => {
    try {
      const zip = new JSZip();

      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          const relativePath = filePath.replace(WORK_DIR, '');
          zip.file(relativePath, dirent.content);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return zipBlob;
    } catch (error) {
      console.error('Failed to zip project', error);
      throw error;
    }
  };

  // Update the view when the fetcher data changes
  useEffect(() => {
    if (fetcher.data) {
      setServiceUrl(fetcher.data.serviceUrl);
      setIsDeploying(false);
      // Forces a re-render for the deployment list
      deploymentStore.set([...deploymentStore.get()]);
    }
  }, [fetcher.data]);

  const handleLaunchFlowDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    setError(null);
    setServiceUrl(null);

    const deploymentName = chatId.get();
    if (!deploymentName) {
      setError('Failed to deploy. Please try again.');
      return;
    }

    if (user?.accountId === undefined) {
      setError('Failed to deploy. Please try again.');
      return;
    }

    try {
      const zipBlob = await zipProject();
      const formData = new FormData();

      const handler = 'main.handler'; // Replace with the appropriate handler value

      formData.append('deployment_name', deploymentName);
      formData.append('handler', handler);
      formData.append('requirements_txt_file', new Blob(['fastapi[standard]\nmangum\n'], { type: 'text/plain' }));
      formData.append('zip_file', zipBlob, 'source.zip');
      formData.append('account_id', user.accountId);

      fetcher.submit(formData, {
        method: 'post',
        action: '/api/deploy',
        encType: 'multipart/form-data',
      });
    } catch (error) {
      console.error('Failed to submit deployment:', error);
      setError('An error occurred while deploying. Please try again.');
    }
  };

  const renderDeploymentInterface = () => {
    switch (selectedProvider) {
      case 'aws':
      case 'gcp':
        return (
          <div className="mt-4 overflow-hidden">
            <h3 className="text-[var(--bolt-elements-textPrimary)] text-lg font-semibold mb-2">Install the SDK</h3>
            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
              <code className="text-sm text-gray-300">{`$ pip install launchflow`}</code>
            </pre>
            <h3 className="text-[var(--bolt-elements-textPrimary)] text-lg font-semibold mb-2 mt-4">
              Launch from your machine
            </h3>
            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
              <code className="text-sm text-gray-300">
                {`$ lf launch "https://ai.launchflow.com/my-api-12345?token=abcdefg123456789"`}
              </code>
            </pre>
            <Button variant="secondary" className="mt-4">
              Read full documentation
            </Button>
          </div>
        );
      case 'launchflow':
        return (
          <div className="mt-4">
            <h3 className="text-[var(--bolt-elements-textPrimary)] text-lg font-semibold mb-2">How it works</h3>
            <ol className="list-decimal list-inside space-y-2 text-[var(--bolt-elements-textSecondary)]">
              <li>Click the button below to deploy this API on an AWS Lambda instance managed by LaunchFlow Cloud</li>
              <li>The public API URL will be returned once the deployment is complete</li>
              <li>APIs deployed by anonymous users (you right now) can be called up to 10 times per day</li>
              <li>Sign up for a free account to increase the limit to 1000 calls per day</li>
              <li>
                Paid accounts have no limits, and we charge the same rate as AWS Lambda{' '}
                <a href="#" className="text-blue-400">
                  on-demand pricing
                </a>
              </li>
              <li>Eject to your own AWS account at any time</li>
            </ol>
            <Button className="mt-4" onClick={handleLaunchFlowDeployment} disabled={isDeploying}>
              Launch on LaunchFlow Cloud
            </Button>
            {isDeploying && (
              <div className="mt-4 flex gap-1 items-center">
                <div className="i-svg-spinners:90-ring-with-bg text-[var(--bolt-elements-textSecondary)]"></div>
                <p className="text-[var(--bolt-elements-textSecondary)]">Deploying, please wait...</p>
              </div>
            )}
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {serviceUrl && (
              <p className="text-green-500 mt-2">
                Deployment successful! Service URL:{' '}
                <a href={serviceUrl} className="text-blue-400" target="_blank" rel="noopener noreferrer">
                  {serviceUrl}
                </a>
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!deployment) return null;

  return (
    <Dialog open={deployment} onOpenChange={() => popupStore.setKey('deployment', false)}>
      <DialogContent className="sm:max-w-[720px] max-h-[75vh] overflow-y-auto dialog-content">
        <DialogHeader>
          <DialogTitle>Deploy Your API</DialogTitle>
          <DialogDescription>Choose a cloud provider to deploy your API</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {['launchflow', 'aws', 'gcp'].map((provider) => (
            <button
              key={provider}
              className={`p-4 rounded-md transition-colors flex flex-col items-center overflow-hidden ${
                selectedProvider === provider ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedProvider(provider)}
            >
              <div className="i-ph:rocket text-2xl" />
              <span className="block mt-2 text-sm capitalize">
                {provider === 'launchflow'
                  ? 'LaunchFlow Cloud'
                  : provider === 'aws'
                    ? 'Amazon Web Services'
                    : 'Google Cloud Platform'}
              </span>
            </button>
          ))}
        </div>
        {renderDeploymentInterface()}
      </DialogContent>
    </Dialog>
  );
};

export default DeploymentPopup;
