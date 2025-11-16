# User-Provided API Keys Implementation Plan

## Executive Summary

This document outlines the implementation plan for allowing users to provide their own OpenAI API keys in GaslightGPT, avoiding consumption of your ChatGPT credits while maintaining the current functionality for users without API keys.

**Critical Constraint**: OpenAI blocks direct browser-to-API calls via CORS restrictions. Therefore, we must use a **backend proxy approach** where user-provided API keys are sent to your backend with each request.

---

## Current Architecture

### Dual Backend Pattern
- **Development**: Express server (`server-dev.js`) on port 3001
- **Production**: Vercel Serverless Function (`api/chat.js`)
- Both must be kept in sync for any API changes

### Current Flow
1. User types message in `Chat.tsx`
2. Frontend sends POST to `/api/chat` with `{ message, history }`
3. Backend uses `process.env.OPENAI_API_KEY`
4. Backend calls OpenAI API
5. Backend returns `{ reply }` to frontend

---

## Recommended Approach: Hybrid Mode

### Overview
Implement dual-mode functionality:
- **Default**: Use server-side API key (existing behavior)
- **Optional**: Users can provide their own key

### Why This Approach?
- Maintains backward compatibility
- Works around CORS restrictions
- Balances convenience and security
- Clear upgrade path for users
- You avoid paying for all usage while still offering demo mode

---

## Implementation Details

### 1. Backend Changes

#### Files to Modify
- `server-dev.js` (Express server for local development)
- `api/chat.js` (Vercel serverless function for production)

#### Changes Required
```javascript
// Accept optional apiKey and model in request body
app.post('/api/chat', async (req, res) => {
  const { message, history, apiKey, model } = req.body;

  // Validate API key format if provided
  if (apiKey && !validateApiKeyFormat(apiKey)) {
    return res.status(400).json({
      error: 'Invalid API key format'
    });
  }

  // Use provided key or fallback to server key
  const openai = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY
  });

  // Use provided model or fallback to default
  const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // Rest of existing logic...
});

function validateApiKeyFormat(key) {
  // OpenAI keys: sk-proj-... or sk-...
  return /^sk-(proj-)?[A-Za-z0-9]{32,}$/.test(key);
}
```

**CRITICAL**: Both `server-dev.js` and `api/chat.js` must have identical logic!

---

### 2. Type Definitions

#### `src/types/chat.ts`
```typescript
export interface Settings {
  theme: 'light' | 'dark'
  showGaslitLabels: boolean
  useOwnApiKey: boolean      // NEW
  selectedModel?: string      // NEW
}
```

#### `src/types/api.ts`
```typescript
export interface ChatRequest {
  message: string
  history: Message[]
  apiKey?: string   // NEW
  model?: string    // NEW
}
```

---

### 3. Storage Functions

#### `src/lib/chatStorage.ts`

Add new functions:

```typescript
// Encryption (basic obfuscation - not cryptographically secure)
function encryptKey(key: string): string {
  return btoa(key); // Base64 encoding
}

function decryptKey(encrypted: string): string {
  return atob(encrypted);
}

export function getUserApiKey(): string | null {
  try {
    const encrypted = localStorage.getItem('userApiKey');
    return encrypted ? decryptKey(encrypted) : null;
  } catch {
    return null;
  }
}

export function setUserApiKey(key: string): void {
  try {
    localStorage.setItem('userApiKey', encryptKey(key));
  } catch (error) {
    console.error('Failed to save API key:', error);
  }
}

export function clearUserApiKey(): void {
  localStorage.removeItem('userApiKey');
}

export function getUseOwnApiKey(): boolean {
  return localStorage.getItem('useOwnApiKey') === 'true';
}

export function setUseOwnApiKey(enabled: boolean): void {
  localStorage.setItem('useOwnApiKey', String(enabled));
}

export function getSelectedModel(): string {
  return localStorage.getItem('selectedModel') || 'gpt-4o-mini';
}

export function setSelectedModel(model: string): void {
  localStorage.setItem('selectedModel', model);
}
```

---

### 4. Settings Dialog UI

#### `src/components/SettingsDialog.tsx`

Add new section:

```typescript
// Add to component state
const [useOwnApiKey, setUseOwnApiKey] = useState(false);
const [userApiKey, setUserApiKey] = useState('');
const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
const [showApiKey, setShowApiKey] = useState(false);

// Load from localStorage on mount
useEffect(() => {
  setUseOwnApiKey(getUseOwnApiKey());
  setUserApiKey(getUserApiKey() || '');
  setSelectedModel(getSelectedModel());
}, []);

// In the dialog content, add new section:
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label htmlFor="use-own-key">Use my own API key</Label>
    <Switch
      id="use-own-key"
      checked={useOwnApiKey}
      onCheckedChange={(checked) => {
        setUseOwnApiKey(checked);
        setUseOwnApiKey(checked);
      }}
    />
  </div>

  {useOwnApiKey && (
    <>
      <div className="space-y-2">
        <Label htmlFor="api-key">OpenAI API Key</Label>
        <div className="relative">
          <Input
            id="api-key"
            type={showApiKey ? 'text' : 'password'}
            value={userApiKey}
            onChange={(e) => setUserApiKey(e.target.value)}
            placeholder="sk-proj-..."
            className="pr-20"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-orange-600 dark:text-orange-400 text-lg">⚠️</span>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-orange-900 dark:text-orange-100">
              Security Warning
            </p>
            <p className="text-orange-800 dark:text-orange-200">
              Your API key will be stored in your browser and sent to our server
              with each request. Only use this feature if you trust this application.
            </p>
            <ul className="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-300">
              <li>Use a key with spending limits set in OpenAI dashboard</li>
              <li>Never share this device with untrusted users</li>
              <li>Clear your API key when using shared/public computers</li>
            </ul>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              Your key is only used to make API requests on your behalf and is
              not stored on our servers.
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => {
          setUserApiKey('');
          clearUserApiKey();
        }}
        className="w-full"
      >
        Clear API Key
      </Button>
    </>
  )}
</div>
```

---

### 5. Chat Component Updates

#### `src/components/Chat.tsx`

Modify the `sendMessage` function:

```typescript
// Add props
interface ChatProps {
  messages?: Message[]
  onMessagesUpdate: (messages: Message[]) => void
  showGaslitLabels?: boolean
  userApiKey?: string        // NEW
  selectedModel?: string     // NEW
}

// In sendMessage function
const sendMessage = async () => {
  if (!input.trim() || isLoading) return;

  // ... existing code ...

  try {
    const requestBody: ChatRequest = {
      message: userMessage.content,
      history: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    // Add user API key if provided
    if (userApiKey) {
      requestBody.apiKey = userApiKey;
    }

    // Add selected model if provided
    if (selectedModel) {
      requestBody.model = selectedModel;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // ... rest of existing code ...
  } catch (error) {
    // Enhanced error handling
    if (error.message.includes('Invalid API key')) {
      toast.error('Invalid API key. Please check your OpenAI API key in Settings.');
    } else {
      // ... existing error handling ...
    }
  }
};
```

---

### 6. App State Management

#### `src/App.tsx`

Add state and pass to components:

```typescript
const [useOwnApiKey, setUseOwnApiKey] = useState(false);
const [userApiKey, setUserApiKey] = useState<string | null>(null);
const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

// Load from storage on mount
useEffect(() => {
  setUseOwnApiKey(getUseOwnApiKey());
  setUserApiKey(getUserApiKey());
  setSelectedModel(getSelectedModel());
}, []);

// Pass to Chat component
<Chat
  messages={messages}
  onMessagesUpdate={handleMessagesUpdate}
  showGaslitLabels={showGaslitLabels}
  userApiKey={useOwnApiKey ? userApiKey : undefined}
  selectedModel={useOwnApiKey ? selectedModel : undefined}
/>

// Pass to Settings dialog
<SettingsDialog
  open={settingsOpen}
  onOpenChange={setSettingsOpen}
  theme={theme}
  onThemeChange={handleThemeChange}
  showGaslitLabels={showGaslitLabels}
  onShowGaslitLabelsChange={setShowGaslitLabels}
  onClearHistory={handleClearHistory}
  useOwnApiKey={useOwnApiKey}
  onUseOwnApiKeyChange={setUseOwnApiKey}
  userApiKey={userApiKey || ''}
  onUserApiKeyChange={setUserApiKey}
  selectedModel={selectedModel}
  onSelectedModelChange={setSelectedModel}
/>
```

---

## Security Considerations

### Known Risks

1. **localStorage Exposure**
   - XSS attacks can steal keys
   - Keys visible in browser DevTools
   - Not encrypted by default

2. **Network Request Exposure**
   - API keys visible in request payload (mitigated by HTTPS)
   - Browser DevTools can inspect network traffic
   - Man-in-the-middle attacks possible without HTTPS

3. **Server Trust**
   - Users must trust your backend with their key
   - Keys sent with every request
   - You could theoretically log/store keys (don't do this!)

### Mitigations Implemented

1. **HTTPS Required**
   - Vercel provides HTTPS by default
   - Never test with real keys over HTTP

2. **Basic Encryption**
   - Base64 encoding before localStorage
   - Minimal obfuscation (not cryptographically secure)
   - Better than plaintext

3. **User Warnings**
   - Prominent security warning in Settings
   - Clear explanation of risks
   - Recommendations for safe usage

4. **Validation**
   - Format validation on frontend
   - Backend validation before use
   - User-friendly error messages

5. **Optional "Clear Key" Button**
   - Easy way to remove key
   - Important for shared computers

### What This IS and ISN'T

**This IS:**
- Reasonably secure for a web app
- Better than embedding keys in code
- Transparent about risks
- Standard pattern for "Bring Your Own Key" apps

**This ISN'T:**
- Bank-level security
- Protection against determined attackers
- Immune to XSS attacks
- As secure as pure server-side key management

### Recommendations for Users

Include in documentation:
1. Set spending limits in OpenAI dashboard
2. Use dedicated API keys (not your main account key)
3. Monitor usage in OpenAI dashboard
4. Clear key on shared/public computers
5. Understand the risks before enabling

---

## Implementation Checklist

### Backend (MUST keep both in sync!)
- [ ] Modify `server-dev.js` to accept optional `apiKey` and `model`
- [ ] Modify `api/chat.js` with identical logic
- [ ] Add API key format validation function
- [ ] Add error handling for invalid keys
- [ ] Test both backends with and without user keys

### Types
- [ ] Update `Settings` interface in `src/types/chat.ts`
- [ ] Update `ChatRequest` interface in `src/types/api.ts`

### Storage
- [ ] Add encryption/decryption functions to `src/lib/chatStorage.ts`
- [ ] Add `getUserApiKey()`, `setUserApiKey()`, `clearUserApiKey()`
- [ ] Add `getUseOwnApiKey()`, `setUseOwnApiKey()`
- [ ] Add `getSelectedModel()`, `setSelectedModel()`

### UI Components
- [ ] Update `SettingsDialog.tsx` with new section
- [ ] Add toggle for "Use my own API key"
- [ ] Add password input for API key
- [ ] Add show/hide toggle for API key field
- [ ] Add model selection dropdown
- [ ] Add security warning box
- [ ] Add "Clear API Key" button
- [ ] Update props interface

### Chat Logic
- [ ] Update `Chat.tsx` props interface
- [ ] Modify `sendMessage()` to include optional apiKey and model
- [ ] Add enhanced error handling for invalid keys
- [ ] Test with both server key and user key

### App State
- [ ] Add state variables to `App.tsx`
- [ ] Load from localStorage on mount
- [ ] Pass props to Chat component
- [ ] Pass props to Settings dialog

### Testing
- [ ] Test with server API key (default behavior)
- [ ] Test with valid user API key
- [ ] Test with invalid user API key format
- [ ] Test with expired/revoked user API key
- [ ] Test model selection
- [ ] Test "Clear API Key" functionality
- [ ] Test localStorage persistence
- [ ] Test on both local dev and Vercel production
- [ ] Verify HTTPS in production
- [ ] Check for any key leakage in browser console

---

## Estimated Effort

- **Time**: 4-6 hours for experienced developer
- **Complexity**: Medium (touches 8+ files, dual backend)
- **Risk**: Low (backward compatible, additive changes)
- **Testing**: High importance (security-critical)

---

## Alternative Approaches Considered

### Why NOT Direct Browser-to-OpenAI Calls?
**CORS blocking** - OpenAI intentionally blocks browser requests. Not possible.

### Why NOT OAuth?
OpenAI doesn't use OAuth for API access. OAuth is only for ChatGPT Plus user authentication, not API keys.

### Why NOT Ephemeral Tokens?
Only available for Realtime API (WebRTC/WebSocket), not Chat Completions API. Would require complete architectural rewrite.

### Why NOT Browser Extension?
- Still CORS-blocked
- Requires complete rewrite
- Loses web accessibility

---

## Future Enhancements

Potential improvements for later:

1. **Token Counter**
   - Show estimated tokens for current conversation
   - Warn when approaching context limits

2. **Cost Estimator**
   - Calculate estimated cost per request
   - Running total for session

3. **Advanced Encryption**
   - Use crypto-js or similar for better encryption
   - Key derivation from user password

4. **Session-Only Mode**
   - "Remember API key" checkbox
   - Store in state only (lost on refresh)

5. **API Key Testing**
   - Test key validity on save
   - Show success/error feedback immediately

6. **Rate Limiting**
   - Prevent abuse of your server as proxy
   - Throttle requests per IP/session

7. **Usage Analytics**
   - Log requests (without storing keys!)
   - Monitor for abuse patterns

---

## Conclusion

This implementation provides a secure, user-friendly way to allow users to bring their own OpenAI API keys while maintaining the current demo functionality. The hybrid approach ensures backward compatibility while giving power users control over their API usage and costs.

The main tradeoff is that users must trust your backend as a proxy, but this is unavoidable due to OpenAI's CORS restrictions. Clear security warnings and best practices help users make informed decisions about enabling this feature.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Ready for Implementation
