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

export const Preview = memo(() => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const hasSelectedPreview = useRef(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const [url, setUrl] = useState('');
  const [iframeUrl, setIframeUrl] = useState<string | undefined>();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges } = useStore(nodesStore);
  const [localNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setEdges, onEdgesChange] = useEdgesState(edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingSchema, setEditingSchema] = useState<SchemaSection | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('GET');
  const [hasChanges, setHasChanges] = useState(false);

  console.log('nodes', nodes);
  console.log('edges', edges);

  useEffect(() => {
    console.log('nodes changed in component', nodes);
    console.log('edges changed in component', edges);
    setNodes([...nodes]);
    setEdges([...edges]);
  }, [nodes, edges]);

  useEffect(() => {
    if (!activePreview) {
      setUrl('');
      setIframeUrl(undefined);
      return;
    }

    const { baseUrl } = activePreview;

    setUrl(baseUrl);
    setIframeUrl(baseUrl);
  }, [activePreview]);

  const validateUrl = useCallback(
    (value: string) => {
      if (!activePreview) {
        return false;
      }

      const { baseUrl } = activePreview;

      if (value === baseUrl) {
        return true;
      } else if (value.startsWith(baseUrl)) {
        return ['/', '?', '#'].includes(value.charAt(baseUrl.length));
      }

      return false;
    },
    [activePreview],
  );

  const findMinPortIndex = useCallback(
    (minIndex: number, preview: { port: number }, index: number, array: { port: number }[]) => {
      return preview.port < array[minIndex].port ? index : minIndex;
    },
    [],
  );

  useEffect(() => {
    if (previews.length > 1 && !hasSelectedPreview.current) {
      const minPortIndex = previews.reduce(findMinPortIndex, 0);
      setActivePreviewIndex(minPortIndex);
    }
  }, [previews]);

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (node.data.schema) {
      const newEditingSchema: SchemaSection = {};
      Object.entries(node.data.schema).forEach(([key, value]) => {
        newEditingSchema[key] = Object.entries(value as object).map(([name, type]) => ({ name, type: type as string }));
      });
      setEditingSchema(newEditingSchema);
      setSelectedMethod((node.data.label as any).split(' ')[0]);
    } else {
      setEditingSchema(null);
    }
    setHasChanges(false);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedNode(null);
    setEditingSchema(null);
    setHasChanges(false);
  }, []);

  const onPaneClick = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <div ref={reactFlowWrapper} className="absolute inset-0 shadow-lg bg-black bg-opacity-30">
          <ReactFlow
            nodes={localNodes}
            edges={localEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Controls style={{ display: 'flex', flexDirection: 'row', gap: '5px' }} />
            <Background color="rgba(107, 107, 107, 0.2)" gap={16} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
});
