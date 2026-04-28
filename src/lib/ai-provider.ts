import OpenAI from "openai";

const DEFAULT_AI_BASE_URL = "https://9router-168-144-37-19.sslip.io/v1";
const PRIMARY_AI_MODEL = "cx/gpt-5.2";
const FALLBACK_AI_MODEL = "cx/gpt-5.5";

export function getAIBaseURL() {
    return process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_AI_BASE_URL;
}

export function getAIApiKey() {
    return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "dummy";
}

export function getAIClient() {
    return new OpenAI({
        apiKey: getAIApiKey(),
        baseURL: getAIBaseURL(),
    });
}

export function getPrimaryAIModel() {
    return process.env.AI_MODEL || process.env.OPENAI_MODEL || PRIMARY_AI_MODEL;
}

export function getAIModels() {
    const configured = getPrimaryAIModel();
    const fallback = process.env.AI_FALLBACK_MODEL || FALLBACK_AI_MODEL;
    return configured === fallback ? [configured] : [configured, fallback];
}

export function isAIConfigured() {
    return Boolean(getAIBaseURL());
}

export async function createChatCompletionWithFallback(
    params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "model"> & { model?: string }
) {
    const client = getAIClient();
    let lastError: unknown;

    for (const model of params.model ? [params.model, ...getAIModels().filter(m => m !== params.model)] : getAIModels()) {
        try {
            return await client.chat.completions.create({ ...params, model });
        } catch (error) {
            lastError = error;
            console.warn(`[AI] Model ${model} failed, trying next fallback if available`, error);
        }
    }

    throw lastError;
}
