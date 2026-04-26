import path from 'path'
import fs from 'fs'
import os from 'os'
import { app } from 'electron'

// Auto-detect the fastest reachable HuggingFace endpoint
async function detectHFEndpoint(): Promise<string> {
  const candidates = ['https://huggingface.co', 'https://hf-mirror.com']
  try {
    const first = await Promise.any(
      candidates.map(async (url) => {
        const res = await fetch(`${url}/favicon.ico`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(4000),
        })
        if (res.status >= 500) throw new Error(`${res.status}`)
        return url
      })
    )
    return first
  } catch {
    return 'https://hf-mirror.com'
  }
}

// Set once before first download; default to mirror until detection completes
process.env['HF_ENDPOINT'] = 'https://hf-mirror.com'
detectHFEndpoint().then(ep => {
  process.env['HF_ENDPOINT'] = ep
  console.log(`[ai] HF endpoint: ${ep}`)
})

// TypeScript compiles dynamic import() to require() for CJS targets — bypass with new Function
const esmImport = new Function('p', 'return import(p)') as (p: string) => Promise<typeof import('node-llama-cpp')>

// ── Model registry ──────────────────────────────────────────────────────────

export interface ModelDef {
  id: string
  name: string
  description: string
  hfUri: string
  filename: string
  sizeMB: number
  ramRequiredGB: number
  quality: number       // 1–5
  chineseFocus: boolean
}

export const MODELS: ModelDef[] = [
  {
    id: 'gemma3-1b',
    name: 'Gemma 3 1B',
    description: 'Ultra-light, fastest, basic quality',
    hfUri: 'hf:bartowski/gemma-3-1b-it-GGUF/gemma-3-1b-it-Q4_K_M.gguf',
    filename: 'gemma-3-1b-it-Q4_K_M.gguf',
    sizeMB: 820,
    ramRequiredGB: 3,
    quality: 2,
    chineseFocus: false,
  },
  {
    id: 'gemma3-4b',
    name: 'Gemma 3 4B',
    description: 'Balanced quality and speed, good multilingual',
    hfUri: 'hf:bartowski/gemma-3-4b-it-GGUF/gemma-3-4b-it-Q4_K_M.gguf',
    filename: 'gemma-3-4b-it-Q4_K_M.gguf',
    sizeMB: 2500,
    ramRequiredGB: 6,
    quality: 3,
    chineseFocus: false,
  },
  {
    id: 'qwen2.5-3b',
    name: 'Qwen 2.5 3B',
    description: 'Best Chinese in small size, good extraction',
    hfUri: 'hf:bartowski/Qwen2.5-3B-Instruct-GGUF/Qwen2.5-3B-Instruct-Q4_K_M.gguf',
    filename: 'Qwen2.5-3B-Instruct-Q4_K_M.gguf',
    sizeMB: 1900,
    ramRequiredGB: 5,
    quality: 3,
    chineseFocus: true,
  },
  {
    id: 'qwen2.5-7b',
    name: 'Qwen 2.5 7B',
    description: 'Strongest Chinese, high quality, needs 10GB+ RAM',
    hfUri: 'hf:bartowski/Qwen2.5-7B-Instruct-GGUF/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
    filename: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf',
    sizeMB: 4700,
    ramRequiredGB: 10,
    quality: 5,
    chineseFocus: true,
  },
]

// ── Hardware detection ──────────────────────────────────────────────────────

export interface HardwareInfo {
  totalRAMGB: number
  cpuModel: string
  arch: string
  platform: string
  isAppleSilicon: boolean
}

export function getHardwareInfo(): HardwareInfo {
  const totalRAMGB = Math.round(os.totalmem() / 1024 / 1024 / 1024)
  const cpuModel = (os.cpus()[0]?.model ?? 'Unknown').replace(/\s+/g, ' ').trim()
  const arch = os.arch()
  const platform = os.platform()
  const isAppleSilicon = platform === 'darwin' && arch === 'arm64'
  return { totalRAMGB, cpuModel, arch, platform, isAppleSilicon }
}

function recommendedModelId(hw: HardwareInfo): string {
  const ram = hw.totalRAMGB
  if (ram >= 12) return 'qwen2.5-7b'
  if (ram >= 7)  return 'qwen2.5-3b'
  if (ram >= 5)  return 'gemma3-4b'
  return 'gemma3-1b'
}

// ── Model state ─────────────────────────────────────────────────────────────

function getModelDir() { return path.join(app.getPath('userData'), 'models') }
function getModelFilePath(filename: string) { return path.join(getModelDir(), filename) }

let activeModelId = ''
let loadedModelId = ''
let modelInstance: unknown = null

function resolveActiveModelId(): string {
  if (activeModelId) return activeModelId
  const hw = getHardwareInfo()
  const recommended = recommendedModelId(hw)
  const downloaded = MODELS.filter(m => fs.existsSync(getModelFilePath(m.filename)))
  if (!downloaded.length) return ''
  return downloaded.find(m => m.id === recommended)?.id ?? downloaded[0].id
}

export function setActiveModel(modelId: string) {
  if (activeModelId !== modelId) {
    activeModelId = modelId
    modelInstance = null
    loadedModelId = ''
  }
}

// ── Public status ───────────────────────────────────────────────────────────

export interface ModelStatus extends ModelDef {
  downloaded: boolean
  filepath: string | null
  isRecommended: boolean
  isActive: boolean
}

export function getModelsStatus() {
  const hw = getHardwareInfo()
  const recommended = recommendedModelId(hw)
  const active = resolveActiveModelId()

  const models: ModelStatus[] = MODELS.map(m => {
    const filepath = getModelFilePath(m.filename)
    const downloaded = fs.existsSync(filepath)
    return {
      ...m,
      downloaded,
      filepath: downloaded ? filepath : null,
      isRecommended: m.id === recommended,
      isActive: m.id === active,
    }
  })

  return { hardware: hw, recommended, active, models }
}

// ── Download ────────────────────────────────────────────────────────────────

export async function downloadModel(
  modelId: string,
  onProgress: (p: { percent: number; downloadedMB: number; totalMB: number }) => void
): Promise<void> {
  const model = MODELS.find(m => m.id === modelId)
  if (!model) throw new Error(`Unknown model id: ${modelId}`)

  const { createModelDownloader } = await esmImport('node-llama-cpp')
  fs.mkdirSync(getModelDir(), { recursive: true })

  const downloader = await createModelDownloader({
    modelUri: model.hfUri,
    dirPath: getModelDir(),
    fileName: model.filename,
    onProgress(status: { downloadedSize: number; totalSize: number }) {
      const downloadedMB = Math.round(status.downloadedSize / 1024 / 1024)
      const totalMB = Math.round((status.totalSize ?? 0) / 1024 / 1024) || model.sizeMB
      const percent = totalMB > 0 ? Math.min(99, Math.round(status.downloadedSize / (status.totalSize ?? model.sizeMB * 1024 * 1024) * 100)) : 0
      onProgress({ percent, downloadedMB, totalMB })
    },
  })

  await downloader.download()
  onProgress({ percent: 100, downloadedMB: model.sizeMB, totalMB: model.sizeMB })
}

// ── Inference ───────────────────────────────────────────────────────────────

async function ensureModel() {
  const modelId = resolveActiveModelId()
  if (!modelId) throw new Error('No model available. Please download a model first.')
  if (modelInstance && loadedModelId === modelId) return

  const model = MODELS.find(m => m.id === modelId)!
  const { getLlama } = await esmImport('node-llama-cpp')
  const llama = await getLlama()
  modelInstance = await llama.loadModel({ modelPath: getModelFilePath(model.filename) })
  loadedModelId = modelId
}

const SYSTEM_PROMPT = `You are a content structuring assistant. Given raw input (notes, diary, thoughts — usually in Chinese), extract and format structured content.

Return ONLY valid JSON, no explanation, no markdown fences:
{
  "title": "concise Chinese title (under 20 chars)",
  "title_en": "English title translation",
  "city": "city name in English (empty string if not mentioned)",
  "tags": "tag1,tag2,tag3 (3-5 tags, comma-separated, no # prefix)",
  "content": "formatted Chinese content in Markdown (clean up, add structure, preserve meaning)",
  "content_en": "full English translation of the content"
}`

export interface AiExtractResult {
  title: string
  title_en: string
  city: string
  tags: string
  content: string
  content_en: string
}

export async function extractWithAI(rawText: string): Promise<AiExtractResult> {
  await ensureModel()

  const { LlamaChatSession } = await esmImport('node-llama-cpp')
  const context = await (modelInstance as { createContext: Function }).createContext({ contextSize: 2048 })

  try {
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      systemPrompt: SYSTEM_PROMPT,
    })
    const response = await session.prompt(`Raw input:\n${rawText}`)
    const text = response.trim()
    try {
      return JSON.parse(text) as AiExtractResult
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0]) as AiExtractResult
      throw new Error('AI returned invalid JSON, please retry')
    }
  } finally {
    await context.dispose()
  }
}
