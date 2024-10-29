import { Link, useFetcher } from '@remix-run/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/DialogOld';
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
import { ExclamationTriangleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';

const DeploymentPopup: React.FC = () => {
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

  useEffect(() => {
    if (fetcher.data) {
      setServiceUrl(fetcher.data.serviceUrl);
      setIsDeploying(false);
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

      formData.append('deployment_name', deploymentName);
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

  if (!deployment) return null;

  return (
    <Dialog open={deployment} onOpenChange={() => popupStore.setKey('deployment', false)}>
      <DialogContent
        disableCloseButton={true}
        className="sm:max-w-[720px] max-h-[75vh] overflow-y-auto dialog-content border border-gray-300 rounded-md border-opacity-30"
      >
        <div className="flex items-center p-4 rounded-md bg-yellow-100 ">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text text-yellow-700">
              LaunchFlow Cloud is experimental and not designed for production use.
            </p>
          </div>
        </div>
        <DialogHeader>
          <DialogTitle>Deploy Your API</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <div className="text text-gray-300 mb-4">
            <ul className="list-disc pl-4">
              <li>Deploy to LaunchFlow Cloud to get a public URL for your API</li>
              <li>
                You can have up to <strong>3 live deployments</strong> at a time
              </li>
              <li>
                You can send up to <strong>1k requests per day</strong> to your live deployments
              </li>
              <li>
                <strong>100% free to use</strong> - we're just experimenting with this feature
              </li>
            </ul>
          </div>

          <Button className="mt-2 text-lg" onClick={handleLaunchFlowDeployment} disabled={isDeploying}>
            Launch on LaunchFlow Cloud
          </Button>
          {isDeploying && (
            <div className="mt-4 flex gap-2 items-center">
              <div className="i-svg-spinners:90-ring-with-bg text-gray-500"></div>
              <p className="text-gray-500">Deploying, please wait... (your first deployment may take a few minutes)</p>
            </div>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {serviceUrl && (
            <div className=" mt-4 p-4 rounded-md bg-green-100 ">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text text-green-700">Deployment successful!</p>
                </div>
              </div>
              <div className="mt-2">
                <div className=" flex items-center">
                  <p className="text text-green-700">Your API is available at:</p>
                  <Link
                    type="button"
                    to={serviceUrl}
                    target="_blank"
                    className=" rounded-md px-2 py-1.5 text font-medium text-green-800 bg-green-100 hover:underline"
                  >
                    {serviceUrl}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeploymentPopup;
