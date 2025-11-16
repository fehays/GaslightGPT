import OpenAI from "openai";

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history, apiProvider = 'groq', apiKey, model } = req.body;

  // Input validation
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Invalid message: message must be a non-empty string" });
  }

  if (history && !Array.isArray(history)) {
    return res.status(400).json({ error: "Invalid history: must be an array" });
  }

  // Validate history array items if provided
  if (history) {
    for (const msg of history) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return res.status(400).json({ error: "Invalid history format: each message must have role and content" });
      }
    }
  }

  // Validate API provider
  if (!PROVIDERS[apiProvider]) {
    return res.status(400).json({ error: 'Invalid API provider' });
  }

  // Get provider configuration
  const config = PROVIDERS[apiProvider];

  // Use provided API key or fallback to environment variable
  const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY;

  if (!effectiveApiKey) {
    return res.status(400).json({ error: 'API key required' });
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
        { role: "user", content: message },
      ],
    });

    res.status(200).json({
      reply: response.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err.message || 'Error contacting API';
    res.status(500).json({ error: errorMessage });
  }
}
