import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Provider configurations with baseURL and default models
const PROVIDERS = {
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
  },
  together: {
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
};

app.post('/api/chat', async (req, res) => {
  const { message, history, apiProvider = 'groq', apiKey, model } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Validate API provider
  if (!PROVIDERS[apiProvider]) {
    return res.status(400).json({ error: 'Invalid API provider' });
  }

  // Get provider configuration
  const config = PROVIDERS[apiProvider];

  // For GROQ: use environment variable if no API key provided
  // For other providers: require user-provided API key
  let effectiveApiKey = apiKey;
  if (apiProvider === 'groq' && !effectiveApiKey) {
    effectiveApiKey = process.env.GROQ_API_KEY;
  }

  if (!effectiveApiKey) {
    return res.status(400).json({
      error: apiProvider === 'groq'
        ? 'GROQ_API_KEY environment variable not set'
        : `API key required for ${apiProvider}`
    });
  }

  try {
    // Create OpenAI client with provider-specific baseURL
    const client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: effectiveApiKey,
    });

    // Use provided model or provider's default model
    const selectedModel = model || config.defaultModel;

    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: [
        ...(history || []),
        { role: 'user', content: message },
      ],
    });

    res.json({
      reply: response.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err.message || 'Error contacting API';
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔥 Dev API server running on http://localhost:${PORT}`);
});
