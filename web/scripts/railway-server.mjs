import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')
const distRoot = path.join(webRoot, 'dist')

loadEnvFile(path.join(webRoot, '.env.proxy'))

const port = Number(process.env.PORT || 3000)
const difyApiKey = process.env.DIFY_API_KEY || ''
const difyBaseUrl = (process.env.DIFY_API_BASE_URL || 'https://api.dify.ai').replace(/\/+$/, '')
const difyAppPath = process.env.DIFY_APP_PATH || '/v1/chat-messages'

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    sendJson(res, 200, { ok: true, hasApiKey: Boolean(difyApiKey) })
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

  serveStatic(req, res)
})

server.listen(port, () => {
  console.log(`Railway server listening on 0.0.0.0:${port}`)
})

function serveStatic(req, res) {
  const rawPath = req.url === '/' ? '/index.html' : req.url || '/index.html'
  const safePath = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = path.join(distRoot, safePath)
  const fallbackPath = path.join(distRoot, 'index.html')
  const targetPath = existsSync(filePath) && !filePath.endsWith(path.sep) ? filePath : fallbackPath

  if (!existsSync(targetPath)) {
    sendJson(res, 404, { message: 'Build output not found' })
    return
  }

  res.writeHead(200, {
    'Content-Type': getContentType(targetPath),
  })
  createReadStream(targetPath).pipe(res)
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8'
  if (filePath.endsWith('.svg')) return 'image/svg+xml'
  if (filePath.endsWith('.csv')) return 'text/csv; charset=utf-8'
  return 'application/octet-stream'
}

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
