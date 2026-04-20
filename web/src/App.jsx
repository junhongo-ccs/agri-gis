import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  formatCropType,
  formatFieldType,
  formatManagementNote,
  formatPestPressure,
  formatRotationStatus,
} from './agriFormat'
import { buildAgriContext, createLocalAssistantReply, postChatMessage } from './difyChat'

const fieldPalette = {
  field_001: { fill: '#86efac', stroke: '#15803d' },
  field_002: { fill: '#4ade80', stroke: '#166534' },
  field_003: { fill: '#facc15', stroke: '#a16207' },
  field_004: { fill: '#22c55e', stroke: '#166534' },
  field_005: { fill: '#84cc16', stroke: '#3f6212' },
}

const defaultPalette = { fill: '#86efac', stroke: '#15803d' }

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createChatMessage(role, content, meta = {}) {
  return { id: `${role}-${createMessageId()}`, role, content, meta }
}

function splitMessageContent(message) {
  if (message.role !== 'assistant') {
    return [{ id: message.id, content: message.content, role: message.role }]
  }

  const parts = message.content.split(/\n\s*\n+/).map((part) => part.trim()).filter(Boolean)
  if (parts.length <= 1) return [{ id: message.id, content: message.content, role: message.role }]

  return parts.map((part, index) => ({
    id: `${message.id}-${index}`,
    content: part,
    role: message.role,
  }))
}

function toUserFacingChatError(error) {
  if (!(error instanceof Error)) {
    return '一時的に応答を取得できませんでした。'
  }

  const message = error.message?.trim()
  if (!message || message === 'Failed to fetch') {
    return '接続に失敗しました。しばらくしてから、もう一度お試しください。'
  }

  return message
}

function isComposingEvent(event) {
  return event.nativeEvent?.isComposing || event.isComposing || event.keyCode === 229
}

function getFeatureBounds(features) {
  const points = features.flatMap((feature) => {
    const coords = feature?.geometry?.coordinates ?? []
    if (feature?.geometry?.type === 'Polygon') return coords[0] ?? []
    if (feature?.geometry?.type === 'MultiPolygon') return coords.flatMap((polygon) => polygon[0] ?? [])
    return []
  })

  const lngs = points.map(([lng]) => lng)
  const lats = points.map(([, lat]) => lat)

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

function getFeatureCenter(feature) {
  const coords =
    feature?.geometry?.type === 'Polygon'
      ? feature.geometry.coordinates[0] ?? []
      : feature?.geometry?.type === 'MultiPolygon'
        ? feature.geometry.coordinates[0]?.[0] ?? []
        : []

  if (coords.length === 0) return [35.918, 140.536]

  const uniquePoints = coords.slice(0, -1)
  const summary = uniquePoints.reduce(
    (accumulator, [lng, lat]) => ({
      lat: accumulator.lat + lat,
      lng: accumulator.lng + lng,
    }),
    { lat: 0, lng: 0 },
  )

  return [summary.lat / uniquePoints.length, summary.lng / uniquePoints.length]
}

function formatDate(value) {
  return value?.replaceAll('/', '-') || '—'
}

function getFieldSummary(field) {
  if (!field) return '圃場を選択してください'
  return [
    formatCropType(field.cropType),
    field.areaHa != null ? `${field.areaHa} ha` : '面積未設定',
    `土壌 pH ${field.soilPh ?? '—'}`,
  ].join(' / ')
}

function MapFitBounds({ geojson }) {
  const map = useMap()

  useEffect(() => {
    if (!geojson?.features?.length) return
    map.fitBounds(getFeatureBounds(geojson.features), { padding: [32, 32], maxZoom: 16 })
  }, [geojson, map])

  return null
}

function AgriMap({ geojson, activeFieldId, onSelectField }) {
  const geoJsonRef = useRef(null)

  useEffect(() => {
    if (!geoJsonRef.current || !activeFieldId) return
    geoJsonRef.current.eachLayer((layer) => {
      const fieldId = layer.feature?.properties?.field_id
      if (fieldId === activeFieldId) {
        layer.bringToFront()
      }
    })
  }, [activeFieldId, geojson])

  if (!geojson) return null

  return (
    <MapContainer
      center={[35.918, 140.536]}
      zoom={15}
      scrollWheelZoom={true}
      zoomControl={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFitBounds geojson={geojson} />
      <GeoJSON
        ref={geoJsonRef}
        data={geojson}
        style={(feature) => {
          const fieldId = feature?.properties?.field_id
          const palette = fieldPalette[fieldId] ?? defaultPalette
          const active = fieldId === activeFieldId
          return {
            color: palette.stroke,
            fillColor: palette.fill,
            fillOpacity: active ? 0.48 : 0.22,
            weight: active ? 4 : 2,
          }
        }}
        onEachFeature={(feature, layer) => {
          const fieldId = feature.properties.field_id
          layer.on({
            click: () => onSelectField(fieldId),
          })
          layer.bindTooltip(`${feature.properties.field_name} (${fieldId})`, {
            sticky: true,
            direction: 'top',
            opacity: 0.95,
          })
        }}
      />
    </MapContainer>
  )
}

function App() {
  const [geojson, setGeojson] = useState(null)
  const [activeFieldId, setActiveFieldId] = useState('')
  const [chatMessages, setChatMessages] = useState(() => [
    createChatMessage(
      'assistant',
      'QGIS で描いた実ポリゴンを使っています。圃場を選んで質問してください。',
      { source: 'welcome' },
    ),
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatError, setChatError] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const chatEndRef = useRef(null)

  const difyEndpoint =
    import.meta.env.VITE_DIFY_CHAT_ENDPOINT?.trim() || (import.meta.env.PROD ? '/api/dify/chat' : '')
  const difyUserId = import.meta.env.VITE_DIFY_USER_ID?.trim() || 'agri-gis-poc'

  useEffect(() => {
    let active = true
    document.title = 'QGIS × Dify | 農業GIS PoC'

    async function loadBoundary() {
      try {
        const response = await fetch('/boundaries/agri-fields-boundary.geojson')
        if (!response.ok) throw new Error(`境界データの取得に失敗しました (HTTP ${response.status})`)
        const data = await response.json()
        if (!active) return
        setGeojson(data)
        setActiveFieldId(data.features?.[0]?.properties?.field_id ?? '')
        setError('')
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'データの読み込みで不明なエラーが発生しました')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadBoundary()
    return () => {
      active = false
    }
  }, [])

  const fields = useMemo(() => {
    if (!geojson?.features) return []
    return geojson.features
      .map((feature) => {
        const props = feature.properties ?? {}
        return {
          id: props.field_id,
          name: props.field_name,
          fieldType: props.field_type,
          cropType: props.crop_type,
          areaHa: props.area_ha,
          soilPh: props.soil_ph,
          lastPesticideDate: formatDate(props.last_pesticide_date),
          managementNote: props.management_note,
          rotationStatus: props.rotation_status,
          pestPressureNote: props.pest_pressure_note,
          suspectedPest: props.suspected_pest,
          center: getFeatureCenter(feature),
        }
      })
      .sort((left, right) => left.id.localeCompare(right.id))
  }, [geojson])

  const selectedField = useMemo(
    () => fields.find((field) => field.id === activeFieldId) ?? fields[0] ?? null,
    [activeFieldId, fields],
  )

  const renderedChatMessages = useMemo(
    () => chatMessages.flatMap((message) => splitMessageContent(message)),
    [chatMessages],
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages, isSending])

  async function sendChatMessage(messageText) {
    const text = messageText.trim()
    if (!text || isSending) return

    setChatMessages((current) => [...current, createChatMessage('user', text)])
    setChatInput('')
    setChatError('')
    setIsSending(true)

    const context = buildAgriContext({ field: selectedField, question: text })

    if (!difyEndpoint) {
      setChatMessages((current) => [
        ...current,
        createChatMessage('assistant', createLocalAssistantReply({ question: text, field: selectedField }), {
          source: 'local-fallback',
        }),
      ])
      setIsSending(false)
      return
    }

    try {
      const result = await postChatMessage({
        endpoint: difyEndpoint,
        userId: difyUserId,
        conversationId,
        question: text,
        context,
      })
      setConversationId(result.conversationId ?? conversationId)
      setChatMessages((current) => [
        ...current,
        createChatMessage('assistant', result.answer || '返答が届きませんでした。', { source: 'dify' }),
      ])
    } catch (sendError) {
      setChatError(toUserFacingChatError(sendError))
      setChatMessages((current) => [
        ...current,
        createChatMessage(
          'assistant',
          `${createLocalAssistantReply({ question: text, field: selectedField })} いまはローカル代替応答を表示しています。`,
          { source: 'fallback-after-error' },
        ),
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#ecfdf5_0%,_#d1fae5_100%)] text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:h-full lg:min-h-0 lg:px-6">
        <header className="rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_16px_44px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">QGIS / GeoJSON / Dify</p>
          <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight text-slate-950 lg:text-[2rem]">
            実ポリゴンで見る農業GIS
          </h1>
          <p className="mt-2 max-w-4xl text-[0.95rem] leading-6 text-slate-700">
            QGIS から書き出した圃場ポリゴンと属性をそのまま使っています。左で圃場を選び、右で Dify に質問します。
          </p>
        </header>

        <main className="mt-4 grid min-h-0 flex-1 gap-4 lg:min-h-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,420px)]">
          <section className="flex min-h-[50vh] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/75 shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:min-h-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Map</p>
                <h2 className="mt-1 text-[1rem] font-semibold text-slate-950">圃場ポリゴン</h2>
              </div>
              <div className="text-right text-[0.76rem] text-slate-600">
                <p>{selectedField?.name ?? '未選択'}</p>
                <p>{selectedField ? getFieldSummary(selectedField) : '読み込み中'}</p>
              </div>
            </div>
            <div className="relative min-h-[420px] flex-1 lg:min-h-0">
              {!loading && !error && geojson ? <AgriMap geojson={geojson} activeFieldId={activeFieldId} onSelectField={setActiveFieldId} /> : null}
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-700">境界データを読み込み中...</div>
              ) : null}
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 px-6 text-sm text-rose-700">{error}</div>
              ) : null}
            </div>
          </section>

          <aside className="flex min-h-[50vh] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-slate-900/95 text-white shadow-[0_24px_60px_rgba(15,23,42,0.10)] lg:min-h-0">
            <div className="shrink-0 border-b border-white/10 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300">Field</p>
              <h2 className="mt-1 text-[1.2rem] font-semibold tracking-tight">{selectedField?.name ?? '圃場を選択してください'}</h2>
              <p className="mt-1 text-[0.88rem] text-slate-300">{selectedField ? getFieldSummary(selectedField) : '地図から圃場を選択してください。'}</p>
              {selectedField?.suspectedPest && selectedField.suspectedPest !== 'なし' ? (
                <p className="mt-3 inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-[0.78rem] text-amber-100">
                  {selectedField.suspectedPest} の発生報告あり。必要なら対応農薬を確認できます。
                </p>
              ) : null}
              {selectedField ? (
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[0.82rem]">
                  <span className="text-slate-400">圃場ID</span>
                  <span className="font-medium text-white">{selectedField.id}</span>
                  <span className="text-slate-400">圃場種別</span>
                  <span className="font-medium text-white">{formatFieldType(selectedField.fieldType)}</span>
                  <span className="text-slate-400">作物</span>
                  <span className="font-medium text-white">{formatCropType(selectedField.cropType)}</span>
                  <span className="text-slate-400">農薬最終日</span>
                  <span className="font-medium text-white">{selectedField.lastPesticideDate || '—'}</span>
                  <span className="text-slate-400">輪作状況</span>
                  <span className="font-medium text-white">{formatRotationStatus(selectedField.rotationStatus)}</span>
                  <span className="text-slate-400">病害虫状況</span>
                  <span className="font-medium text-white">{formatPestPressure(selectedField.pestPressureNote)}</span>
                  <span className="text-slate-400">害虫報告</span>
                  <span className="font-medium text-white">{selectedField.suspectedPest || '—'}</span>
                  <span className="text-slate-400">観察事項</span>
                  <span className="font-medium text-white">{formatManagementNote(selectedField.managementNote)}</span>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-5 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Chat</p>
                <p className="text-[10px] text-slate-400">{difyEndpoint ? 'Dify接続中' : '未接続'}</p>
              </div>
              <div className="chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {renderedChatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] rounded-[22px] px-4 py-3 text-[0.9rem] leading-[1.55] ${
                        message.role === 'user' ? 'bg-emerald-500 text-slate-950' : 'border border-white/10 bg-white/8 text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isSending ? (
                  <div className="flex justify-start">
                    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-[0.82rem] text-slate-300">Dify に送信中...</div>
                  </div>
                ) : null}
                <div ref={chatEndRef} />
              </div>
              <form
                className="shrink-0 border-t border-white/10 px-5 py-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  sendChatMessage(chatInput)
                }}
              >
                <p className="mb-2 text-[10px] text-emerald-100/70">Enter で送信 / Shift+Enter で改行</p>
                <div className="flex items-end gap-3">
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' || event.shiftKey || isComposingEvent(event)) return
                      event.preventDefault()
                      sendChatMessage(chatInput)
                    }}
                    rows={3}
                    placeholder="入力例：この圃場で管理上まず見るべき点は？"
                    className="min-h-[76px] flex-1 resize-none rounded-2xl border border-emerald-300/25 bg-slate-900 px-4 py-3 text-[0.95rem] leading-[1.45] text-white outline-none placeholder:text-slate-400 focus:border-emerald-300"
                  />
                  <button
                    type="submit"
                    className="h-14 rounded-full bg-emerald-500 px-5 text-[0.88rem] font-semibold text-slate-950 shadow-[0_16px_32px_rgba(16,185,129,0.34)] lg:hidden"
                  >
                    送信
                  </button>
                </div>
                {chatError ? <p className="mt-3 text-[0.86rem] text-rose-200">{chatError}</p> : null}
              </form>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

export default App
