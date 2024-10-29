export type ActionType = 'file' | 'shell' | 'schema';

export interface BaseAction {
  content: string;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export interface SchemaAction extends BaseAction {
  type: 'schema';
  endpoint: string;
}

export type BoltAction = FileAction | ShellAction | SchemaAction;

export type BoltActionData = BoltAction | BaseAction;
