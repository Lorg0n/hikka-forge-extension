
import type React from 'react';

export type InsertPosition = 'before' | 'after' | 'prepend' | 'append' | 'replace';

export interface ModuleSelector {
  selector: string;
  position: InsertPosition;
  index?: number;
}

export interface ForgeModuleDef {
  id: string;
  name: string;
  description: string;
  urlPatterns: string[];
  
  elementSelector?: ModuleSelector;
  component?: React.FC<any>;
  styles?: string;

}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  urlPatterns: string[];
}


interface ModuleToggleAction {
  type: 'MODULE_ACTION';
  action: 'TOGGLE';
  moduleId: string;
  enabled: boolean;
}

interface ModuleRefreshAction {
  type: 'MODULE_ACTION';
  action: 'REFRESH';
}

interface GetModuleDefinitions {
  type: 'GET_MODULE_DEFINITIONS';
}

interface GetContentModulesInfo {
  type: 'GET_CONTENT_MODULES_INFO';
}

interface UrlChangedMessage {
  type: 'URL_CHANGED';
  url: string;
}

interface SyncModulesMessage {
  type: 'SYNC_MODULES';
  enabledStates: Record<string, boolean>;
}

export type BackgroundMessage =
  | ModuleToggleAction
  | ModuleRefreshAction
  | GetModuleDefinitions
  | GetContentModulesInfo;

export type ContentMessage =
  | ModuleRefreshAction
  | GetContentModulesInfo
  | SyncModulesMessage
  | UrlChangedMessage;

export type PopupMessage =
  | ModuleToggleAction
  | ModuleRefreshAction
  | GetModuleDefinitions;

interface BaseResponse {
  success: boolean;
  error?: string;
}

interface GetModulesSuccessResponse extends BaseResponse {
  success: true;
  modules: ModuleInfo[];
}

interface GetModulesErrorResponse extends BaseResponse {
  success: false;
  error: string;
}

export type GetModulesResponse = GetModulesSuccessResponse | GetModulesErrorResponse;

export type SimpleActionResponse = BaseResponse;