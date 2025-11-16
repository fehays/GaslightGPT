import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Flame, Trash2, Eye, EyeOff, Key, Palette } from 'lucide-react'
import { ApiProvider, ThemeName } from '@/types'
import { themes } from '@/lib/themes'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  theme: ThemeName
  onThemeChange: (theme: ThemeName) => void
  showGaslitLabels: boolean
  onToggleGaslitLabels: () => void
  onClearChat: () => void
  onClearAllChats: () => void
  apiProvider: ApiProvider
  onApiProviderChange: (provider: ApiProvider) => void
  apiKey: string
  onApiKeyChange: (key: string) => void
  model: string
  onModelChange: (model: string) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
  showGaslitLabels,
  onToggleGaslitLabels,
  onClearChat,
  onClearAllChats,
  apiProvider,
  onApiProviderChange,
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
}: SettingsDialogProps) {
  const [showApiKey, setShowApiKey] = useState(false)

  // Provider information
  const providerInfo = {
    groq: {
      name: 'Groq',
      description: 'Ultra-fast inference - no API key needed (uses server config)',
      signupUrl: 'https://console.groq.com/',
      defaultModel: 'llama-3.3-70b-versatile',
    },
    openrouter: {
      name: 'OpenRouter',
      description: '300+ models, many free options (200 requests/day)',
      signupUrl: 'https://openrouter.ai/',
      defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
    },
    together: {
      name: 'Together AI',
      description: '$25 free credits on signup',
      signupUrl: 'https://api.together.xyz/',
      defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    },
    openai: {
      name: 'OpenAI',
      description: 'Premium quality (paid, requires your own key)',
      signupUrl: 'https://platform.openai.com/',
      defaultModel: 'gpt-4o-mini',
    },
  }

  const currentProvider = providerInfo[apiProvider]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your GaslightGPT experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Setting */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label htmlFor="theme-select" className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>
            <Select value={theme} onValueChange={onThemeChange}>
              <SelectTrigger id="theme-select">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(themes).map((themeOption) => (
                  <SelectItem key={themeOption.name} value={themeOption.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{themeOption.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {themeOption.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Gaslit Labels Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gaslit-switch" className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Gaslit Labels
              </Label>
              <p className="text-sm text-muted-foreground">
                Show "Gaslit!" badge on edited messages
              </p>
            </div>
            <Switch
              id="gaslit-switch"
              checked={showGaslitLabels}
              onCheckedChange={onToggleGaslitLabels}
            />
          </div>

          <Separator />

          {/* API Provider Settings */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label htmlFor="api-provider" className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Provider
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose your AI API provider
              </p>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider-select" className="text-sm">
                Provider
              </Label>
              <select
                id="provider-select"
                value={apiProvider}
                onChange={(e) => onApiProviderChange(e.target.value as ApiProvider)}
                className="w-full p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="groq">Groq (Recommended - Fast & Free)</option>
                <option value="openrouter">OpenRouter (300+ Models)</option>
                <option value="together">Together AI ($25 Free Credits)</option>
                <option value="openai">OpenAI (Premium)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {currentProvider.description}
              </p>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-sm">
                API Key {apiProvider === 'groq' && '(Optional)'}
              </Label>
              {apiProvider === 'groq' ? (
                <>
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                      <div className="space-y-1 text-xs">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Groq is ready to use
                        </p>
                        <p className="text-green-800 dark:text-green-200">
                          This app is configured with a Groq API key. You can start chatting immediately without entering your own key.
                          Optionally, you can provide your own key below to use your own quota.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => onApiKeyChange(e.target.value)}
                      placeholder="Optional: Enter your own Groq API key"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => onApiKeyChange(e.target.value)}
                      placeholder={`Enter your ${currentProvider.name} API key`}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Don't have an API key?{' '}
                    <a
                      href={currentProvider.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Sign up for {currentProvider.name}
                    </a>
                  </p>
                </>
              )}
            </div>

            {/* Model Input (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm">
                Model (Optional)
              </Label>
              <Input
                id="model"
                type="text"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                placeholder={`Default: ${currentProvider.defaultModel}`}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default model
              </p>
            </div>

            {/* Security Warning */}
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 text-sm">⚠️</span>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    Security Notice
                  </p>
                  <p className="text-orange-800 dark:text-orange-200">
                    Your API key is stored locally in your browser and sent with each request.
                    Set spending limits in your provider's dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Clear API Key Button */}
            {apiKey && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApiKeyChange('')}
                className="w-full"
              >
                Clear API Key
              </Button>
            )}
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-3">
            <Label className="text-base text-destructive">Danger Zone</Label>

            <Button
              variant="outline"
              size="sm"
              onClick={onClearChat}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear Current Chat
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onClearAllChats}
              className="w-full justify-start gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Chat History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
