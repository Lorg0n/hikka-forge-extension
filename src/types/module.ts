import type React from "react";

export type InsertPosition =
	| "before"
	| "after"
	| "prepend"
	| "append"
	| "replace";

export interface ModuleSelector {
	selector: string;
	position: InsertPosition;
	index?: number;
}

export type ModuleSettingType =
	| "slider"
	| "colorPicker"
	| "toggle"
	| "select"
	| "text";

export interface BaseModuleSetting {
	id: string;
	label: string;
	description?: string;
}

export interface SliderSetting extends BaseModuleSetting {
	type: "slider";
	min: number;
	max: number;
	step?: number;
	defaultValue: number;
	unit?: string;
}

export interface ColorPickerSetting extends BaseModuleSetting {
	type: "colorPicker";
	defaultValue: string;
}

export interface ToggleSetting extends BaseModuleSetting {
	type: "toggle";
	defaultValue: boolean;
}

export interface SelectSetting extends BaseModuleSetting {
	type: "select";
	options: { value: string; label: string }[];
	defaultValue: string;
}

export interface TextSetting extends BaseModuleSetting {
	type: "text";
	defaultValue: string;
	placeholder?: string;
}

export type ModuleSetting =
	| SliderSetting
	| ColorPickerSetting
	| ToggleSetting
	| SelectSetting
	| TextSetting;

export interface ForgeModuleDef {
	id: string;
	name: string;
	description: string;
	urlPatterns: string[];
	elementSelector?: ModuleSelector;
	enabledByDefault?: boolean;
	component?: React.FC<any>;
	styles?: string | ((settings: Record<string, any>) => string);
	persistentStyles?: boolean;
	settings?: ModuleSetting[];
}

export interface ModuleInfo {
	id: string;
	name: string;
	description: string;
	enabledByDefault?: boolean;
	enabled: boolean;
	urlPatterns: string[];
	settings?: ModuleSetting[];
}

interface ModuleToggleAction {
	type: "MODULE_ACTION";
	action: "TOGGLE";
	moduleId: string;
	enabled: boolean;
}

interface ModuleUpdateSettingAction {
	type: "MODULE_ACTION";
	action: "UPDATE_SETTING";
	moduleId: string;
	settingId: string;
	value: any;
}

interface ModuleRefreshAction {
	type: "MODULE_ACTION";
	action: "REFRESH";
}

interface GetModuleDefinitions {
	type: "GET_MODULE_DEFINITIONS";
}

interface GetContentModulesInfo {
	type: "GET_CONTENT_MODULES_INFO";
}

interface UrlChangedMessage {
	type: "URL_CHANGED";
	url: string;
}

interface SyncModulesMessage {
	type: "SYNC_MODULES";
	enabledStates: Record<string, boolean>;
	moduleSettings: Record<string, Record<string, any>>;
}

export type BackgroundMessage =
	| ModuleToggleAction
	| ModuleUpdateSettingAction
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
	| ModuleUpdateSettingAction
	| ModuleRefreshAction
	| GetModuleDefinitions;

interface BaseResponse {
	success: boolean;
	error?: string;
}

interface GetModulesSuccessResponse extends BaseResponse {
	success: true;
	modules: ModuleInfo[];
	moduleSettings: Record<string, Record<string, any>>;
}

interface GetModulesErrorResponse extends BaseResponse {
	success: false;
	error: string;
}

export type GetModulesResponse =
	| GetModulesSuccessResponse
	| GetModulesErrorResponse;

export type SimpleActionResponse = BaseResponse;
