import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')

loadEnvFile(path.join(webRoot, '.env.proxy'))

const port = Number(process.env.PORT || 8787)
const corsOrigin = process.env.CORS_ORIGIN || 'http://127.0.0.1:5173'
const difyApiKey = process.env.DIFY_API_KEY || ''
const difyBaseUrl = (process.env.DIFY_API_BASE_URL || 'https://api.dify.ai').replace(/\/+$/, '')
const difyAppPath = process.env.DIFY_APP_PATH || '/v1/chat-messages'

const server = createServer(async (req, res) => {
  setCorsHeaders(req, res, corsOrigin)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/healthz') {
    sendJson(res, 200, {
      ok: true,
      endpoint: `${difyBaseUrl}${difyAppPath}`,
      hasApiKey: Boolean(difyApiKey),
    })
    return
  }

  if (req.method === 'POST' && req.url === '/api/dify/chat') {
    if (!difyApiKey) {
      sendJson(res, 500, { message: 'DIFY_API_KEY is not configured' })
      return
    }

    try {
      const rawBody = await readRequestBody(req)
      const upstreamBody = normalizeDifyRequestBody(rawBody)
      const upstream = await postJson(`${difyBaseUrl}${difyAppPath}`, upstreamBody, difyApiKey)
      res.writeHead(upstream.statusCode, {
        'Content-Type': upstream.contentType || 'application/json; charset=utf-8',
      })
      res.end(upstream.body)
    } catch (error) {
      sendJson(res, 502, {
        message: error instanceof Error ? error.message : 'Failed to reach Dify',
      })
    }
    return
  }

  sendJson(res, 404, { message: 'Not found' })
})

server.listen(port, () => {
  console.log(`Dify proxy listening on http://127.0.0.1:${port}`)
})

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function setCorsHeaders(req, res, fallbackOrigin) {
  const requestOrigin = req.headers.origin
  const allowedOrigin = resolveCorsOrigin(requestOrigin, fallbackOrigin)

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Vary', 'Origin')
}

function resolveCorsOrigin(requestOrigin, fallbackOrigin) {
  if (!requestOrigin) return fallbackOrigin

  try {
    const url = new URL(requestOrigin)
    const isLocalhost = ['127.0.0.1', 'localhost'].includes(url.hostname)
    if (isLocalhost) return requestOrigin
  } catch {
    return fallbackOrigin
  }

  return requestOrigin === fallbackOrigin ? requestOrigin : fallbackOrigin
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify(payload))
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function normalizeDifyRequestBody(rawBody) {
  let payload

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return rawBody
  }

  if (payload?.inputs?.agri_context && typeof payload.inputs.agri_context !== 'string') {
    payload.inputs.agri_context = JSON.stringify(payload.inputs.agri_context)
  }

  return JSON.stringify(payload)
}

function postJson(urlString, rawBody, apiKey) {
  const url = new URL(urlString)

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(rawBody),
        },
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode || 502,
            contentType: response.headers['content-type'],
            body,
          })
        })
      },
    )

    request.on('error', reject)
    request.write(rawBody)
    request.end()
  })
}
