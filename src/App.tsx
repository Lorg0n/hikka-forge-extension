'use client'

import browser from "webextension-polyfill";
import { useEffect } from "react";
import logo from "@/assets/logo.svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const SettingsFormSchema = z.object({
  anime_player: z.boolean().default(false).optional(),
  font_override: z.boolean().default(false).optional(),
});

function App() {
  const form = useForm<z.infer<typeof SettingsFormSchema>>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      anime_player: false,
      font_override: false,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      const storage = chrome.storage?.sync || browser.storage?.sync;
      
      if (storage) {
        try {
          const result = await storage.get(['anime_player', 'font_override']);
          
          form.reset({
            anime_player: result.anime_player ?? false,
            font_override: result.font_override ?? false,
          });
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
    };

    loadSettings();
  }, [form]);

  const handleSettingChange = async (values: z.infer<typeof SettingsFormSchema>) => {
    const storage = chrome.storage?.sync || browser.storage?.sync;
    
    if (storage) {
      try {
        await storage.set(values);
        console.log('Settings saved:', values);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  };

  return (
    <div className="flex flex-col min-w-[320px] min-h-[auto] relative overflow-hidden p-4 gap-8">
      <div className="flex justify-start items-center flex-grow-0 flex-shrink-0 relative gap-4">
        <img src={logo} alt="Logo" className="size-7" />
        <h1 className="font-bold text-xl">Hikka Forge</h1>
      </div>
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onChange={form.handleSubmit(handleSettingChange)}>
            <FormField
              control={form.control}
              name="anime_player"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Anime Player</FormLabel>
                    <FormDescription>
                      Display the player on the anime page
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="font_override"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Font Override</FormLabel>
                    <FormDescription>
                      Override all font on the page to Inter
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}

export default App;