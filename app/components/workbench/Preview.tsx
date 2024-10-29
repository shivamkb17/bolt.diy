import { useStore } from '@nanostores/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { PortDropdown } from './PortDropdown';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Position,
  type Edge,
  type Node,
  // useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodesStore } from '~/lib/stores/nodes';
import { Button } from '../ui/ButtonOld';
import { Loader2 } from 'lucide-react';
import { chatId } from '~/lib/persistence';
import { deploymentStore } from '~/lib/stores/deployments';
import { Link } from '@remix-run/react';
import { popupStore } from '~/lib/stores/popups';

type SchemaField = {
  name: string;
  type: string;
  required?: boolean;
};

type SchemaSection = {
  [key: string]: SchemaField[];
};

const methodColors = {
  GET: 'bg-green-500 hover:bg-green-600 border-green-600',
  POST: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  PUT: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  DELETE: 'bg-red-500 hover:bg-red-600 border-red-600',
};

export function Preview() {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchedUrl, setLaunchedUrl] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0); // State to force iframe reload

  const currentId = useStore(chatId);
  const deployments = useStore(deploymentStore);

  useEffect(() => {
    if (deployments.length > 0) {
      const deployment = deployments.find((d) => d.name === currentId);
      if (deployment) {
        setLaunchedUrl(deployment.service_url);
        setReloadKey((prevKey) => prevKey + 1); // Increment reload key to force iframe reload
      }
    }
  }, [deployments, currentId]);

  if (launchedUrl) {
    return (
      <div className="w-full h-full border-none bg-[#f5f5f5]">
        <div className="flex items-center p-2 gap-1">
          <h2 className="text-xl font-bold text-[#222222]">Service URL:</h2>
          <Link target="_blank" to={launchedUrl} className="text-xl text-blue-600 hover:underline">
            {launchedUrl}
          </Link>
        </div>

        <iframe
          key={reloadKey}
          src={`${launchedUrl}/docs`}
          className="w-full h-full border-none"
          title="Swagger Documentation"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-[#f5f5f5]">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 ">API Documentation</h2>
        <p className="mb-4 ">The API documentation is not available yet. Launch the API to view the Swagger docs.</p>
        <Button
          disabled={isLaunching}
          onClick={() => {
            popupStore.setKey('deployment', true);
          }}
        >
          {isLaunching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Launching API...
            </>
          ) : (
            'Launch API'
          )}
        </Button>
      </div>
    </div>
  );
}
