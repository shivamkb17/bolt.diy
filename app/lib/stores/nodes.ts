import { atom, type MapStore, map } from 'nanostores';
import { type Node, type Edge, Position } from '@xyflow/react';
import type { SchemaAction } from '~/types/actions';

export interface NodeData {
  id: string;
  type?: string;
  data: {
    label: string;
    schema?: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
  };
  style?: Record<string, any>;
  sourcePosition?: Position;
  targetPosition?: Position;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export type NodesState = {
  nodes: Node[];
  edges: Edge[];
};

// Initialize nanostores for nodes and edges
export const nodesStore: MapStore<NodesState> = map({
  nodes: [],
  edges: [],
});

// Function to add or update a node by name
export function updateNode({
  name,
  type = 'default',
  label,
  schema = {},
  position = { x: 0, y: 0 },
}: {
  name: string;
  type?: string;
  label: string;
  schema?: Record<string, any>;
  position?: { x: number; y: number };
}) {
  const currentState = nodesStore.get();
  const nodeIndex = currentState.nodes.findIndex((node) => node.data.label === label);

  if (nodeIndex !== -1) {
    // Update existing node
    currentState.nodes[nodeIndex] = {
      ...currentState.nodes[nodeIndex],
      data: { label, schema },
      position,
    };
  } else {
    // Add new node
    currentState.nodes.push({
      id: name,
      type,
      data: { label, schema },
      position,
      style: {
        width: 150,
        backgroundColor: 'rgba(30, 30, 30, 0.7)',
        color: '#d4d4d4',
        border: '1px solid rgba(62, 62, 62, 0.5)',
        cursor: 'pointer',
      },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    });
  }

  updateEdges(name);
  nodesStore.set({
    nodes: [...currentState.nodes],
    edges: [...currentState.edges],
  });
}

// Function to recalculate edges after node update
export function updateEdges(sourceNodeId: string) {
  const currentState = nodesStore.get();
  const sourceNode = currentState.nodes.find((node) => node.id === sourceNodeId);

  if (!sourceNode) {
    return;
  }

  const sourcePath = sourceNode.data.label.split(' ')[1]; // Extract the path from the label, e.g., "/users/{param}"

  const newEdges: Edge[] = currentState.nodes
    .filter((node) => node.id !== sourceNodeId) // Exclude the source node itself
    .map((node) => {
      const targetPath = node.data.label.split(' ')[1]; // Extract the path from the target node label

      if (shouldConnectPaths(sourcePath, targetPath)) {
        return {
          id: `e-${sourceNodeId}-${node.id}`,
          source: sourceNodeId,
          target: node.id,
          animated: true,
          style: { stroke: 'rgba(107, 107, 107, 0.7)' },
        };
      }

      return null;
    })
    .filter(Boolean) as Edge[];

  currentState.edges = newEdges;
  nodesStore.set({
    nodes: [...currentState.nodes],
    edges: [...currentState.edges],
  });
}

// Helper function to determine if two paths should be connected
function shouldConnectPaths(sourcePath?: string, targetPath?: string): boolean {
  // Handle the root path case
  if (sourcePath === '/' || targetPath === '/') {
    return sourcePath !== targetPath;
  }

  // TODO: Remove this jank logic, just hacking it in for now
  if (sourcePath === undefined || targetPath === undefined) {
    return sourcePath !== targetPath;
  }

  // Handle paths like "/users/{param}"
  const sourceParts = sourcePath.split('/');
  const targetParts = targetPath.split('/');

  // If the target path is a more specific version of the source path, they should be connected.
  // For example, "/users/{param}" should connect to the root "/"
  if (sourceParts.length === 1 && sourceParts[0] === '' && targetParts.length > 1) {
    return true;
  }

  // If the source path is a parent path of the target, they should be connected
  if (targetParts.length === sourceParts.length + 1 && targetPath.startsWith(sourcePath)) {
    return true;
  }

  // Handle specific cases like "/users/{param}" where the source path is dynamic
  if (sourceParts.length === targetParts.length) {
    return sourceParts.every((part, index) => part === targetParts[index] || part.startsWith('{'));
  }

  return false;
}

// Function to handle incoming action data and update nodes accordingly
export function handleIncomingAction(data: {
  endpoint: string;
  name: string;
  query?: Record<string, any>;
  body?: Record<string, any>;
}) {
  const { endpoint, name, query = {}, body = {} } = data;

  // Parse the endpoint to determine the node label
  const [method, path] = endpoint.split(' ');
  const label = `${method} ${path}`;

  updateNode({
    name,
    type: 'default',
    label,
    schema: { request: query, response: body },
    position: { x: Math.random() * 300, y: Math.random() * 300 },
  });
}

// Example data parsing function (this would be called externally)
export function parseBoltAction(boltAction: SchemaAction) {
  // This is a simplified example of parsing boltAction data. Adjust as needed.
  const parsedData = JSON.parse(boltAction.content);
  handleIncomingAction({
    endpoint: boltAction.endpoint,
    name: parsedData.name,
    query: parsedData.query || {},
    body: parsedData.body || {},
  });
}

// Initial nodes and edges setup (for example purposes)
export const initialNodes: NodeData[] = [
  //   {
  //     id: 'domain',
  //     type: 'input',
  //     data: { label: 'api.example.com' },
  //     position: { x: 0, y: 150 },
  //     style: {
  //       width: 180,
  //       backgroundColor: 'rgba(45, 45, 45, 0.7)',
  //       color: '#d4d4d4',
  //       border: '1px solid rgba(62, 62, 62, 0.5)',
  //       cursor: 'pointer',
  //     },
  //     sourcePosition: Position.Right,
  //   },
];

export const initialEdges: EdgeData[] = [
  //   {
  //     id: 'e-domain-users',
  //     source: 'domain',
  //     target: 'users',
  //     animated: true,
  //     style: { stroke: 'rgba(107, 107, 107, 0.7)' },
  //   },
];

// Initialize store with initial nodes and edges
nodesStore.set({ nodes: initialNodes, edges: initialEdges });
