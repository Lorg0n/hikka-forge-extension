
'use client'

import React, { useEffect, useState, useCallback } from "react";
import browser from "webextension-polyfill";
import logo from "@/assets/logo.svg";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { ModuleInfo, PopupMessage, GetModulesResponse, SimpleActionResponse } from "@/types/module";
import { useForm } from "react-hook-form";

function App() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);




  const form = useForm();


  const loadModules = useCallback(async () => {

    setIsLoading(true);
    setError(null);
    console.log("Popup: Requesting module definitions...");
    try {
      const message: PopupMessage = { type: 'GET_MODULE_DEFINITIONS' };
      const response = await browser.runtime.sendMessage(message) as GetModulesResponse;
      console.log("Popup: Received response:", response);
      if (response?.success && Array.isArray(response.modules)) {
        setModules(response.modules);
      } else {
        const errorMessage = response?.error || "Unknown error loading modules.";
        setError("Failed to load module settings. " + errorMessage);
        console.error("Popup: Error loading modules -", errorMessage);
      }
    } catch (err: any) {
      setError(`Error communicating with background script: ${err.message}`);
      console.error("Popup: Error sending message -", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleToggleChange = async (moduleId: string, enabled: boolean) => {

    console.log(`Popup: Toggling ${moduleId} to ${enabled}`);
    setModules(prevModules =>
      prevModules.map(mod =>
        mod.id === moduleId ? { ...mod, enabled } : mod
      )
    );
    try {
      const message: PopupMessage = { type: 'MODULE_ACTION', action: 'TOGGLE', moduleId, enabled };
      const response = await browser.runtime.sendMessage(message) as SimpleActionResponse;
      if (!response?.success) {
        const errorMessage = response?.error || "Unknown toggle error.";
        console.error(`Popup: Failed to toggle module ${moduleId} -`, errorMessage);
        setError(`Failed to save setting for ${moduleId}. ${errorMessage}`);
        loadModules();
      } else {
        console.log(`Popup: Module ${moduleId} toggled successfully.`);
        setError(null);
      }
    } catch (err: any) {
      console.error("Popup: Error sending toggle message -", err);
      setError(`Error saving setting: ${err.message}`);
      loadModules();
    }
  };

  const handleRefresh = async () => {

    console.log("Popup: Requesting content refresh...");
    try {
      const message: PopupMessage = { type: 'MODULE_ACTION', action: 'REFRESH' };
      const response = await browser.runtime.sendMessage(message) as SimpleActionResponse;
      if (!response?.success) {
        const errorMessage = response?.error || "Unknown refresh error.";
        console.error("Popup: Failed to trigger refresh -", errorMessage);
        setError("Failed to refresh content. " + errorMessage);
      } else {
        console.log("Popup: Refresh triggered successfully.");
        setError(null);

      }
    } catch (err: any) {
      console.error("Popup: Error sending refresh message -", err);
      setError(`Error triggering refresh: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col min-w-[350px] max-w-[400px] relative overflow-hidden p-4 gap-6 bg-background text-foreground">
      { }
      <div className="flex justify-between items-center flex-grow-0 flex-shrink-0 relative gap-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="size-7" />
          <h1 className="font-bold text-xl">Hikka Forge</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} title="Refresh active modules on page">
          Refresh Content
        </Button>
      </div>

      { }
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md">
          Error: {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {isLoading ? (

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-row items-center justify-between p-1">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            ))}
          </div>
        ) : modules.length === 0 && !error ? (

          <p className="text-muted-foreground text-center py-4">No modules found or Hikka tab not active.</p>
        ) : (

          <Form {...form}>
            { }
            <div className="space-y-1">
              {modules.map((moduleInfo) => (

                <FormItem key={moduleInfo.id} className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm hover:bg-accent/50 transition-colors">
                  <div className="space-y-0.5 mr-4">
                    <FormLabel className="text-base">{moduleInfo.name}</FormLabel>
                    <FormDescription>
                      {moduleInfo.description}
                    </FormDescription>
                  </div>
                  <FormControl>
                    { }
                    <Switch
                      checked={moduleInfo.enabled}
                      onCheckedChange={(checked) => handleToggleChange(moduleInfo.id, checked)}
                      aria-label={`Toggle ${moduleInfo.name}`}
                    />
                  </FormControl>
                </FormItem>
              ))}
            </div>
          </Form>

        )}
      </div>
    </div>
  );
}

export default App;