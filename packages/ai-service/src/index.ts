export { OpenAICompatibleProvider, type OpenAICompatibleConfig } from './llm/openaiCompatible';
export { createGeminiProvider, type GeminiProviderConfig } from './llm/gemini';

export { SYSTEM_PROMPT, FOLLOWUP_SYSTEM_PROMPT_SUFFIX } from './prompt/system';
export { formatChartForPrompt, buildInterpretationUserMessage } from './prompt/templates';
export { FEWSHOT_EXAMPLES, toMessages as fewShotToMessages, type FewShotExample } from './prompt/fewShot';

export { BaziConversation, type ConversationOptions } from './conversation';

export {
  retrieveForChart,
  retrieveByKeywords,
  CORPUS_RIGAN,
  type RagContext,
  type CorpusEntry,
} from './rag/retriever';

export {
  EVAL_CASES,
  scoreResponse,
  type EvalCase,
  type EvalResult,
} from './eval/cases';
export {
  runAB,
  formatABReport,
  type ABConfig,
  type ABRunResult,
} from './eval/runner';

export { createBaziMcpServer } from './mcp/server';

export {
  LLMError,
  type ChatMessage,
  type ChatRequest,
  type LLMProvider,
  type MessageRole,
  type BaziInterpretationRequest,
} from './types';
