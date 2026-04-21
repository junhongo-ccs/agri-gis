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

const issuePalette = {
  disease: { fill: '#f3c7c2', stroke: '#9a4f48' },
  pest: { fill: '#9fd8c5', stroke: '#2f7563' },
}

const fieldIssueType = {
  field_001: 'disease',
  field_002: 'pest',
  field_003: 'pest',
  field_004: 'pest',
  field_005: 'pest',
}

const defaultPalette = issuePalette.pest

const pesticideImageCatalog = [
  { name: 'オリゼメート粒剤', aliases: ['オリゼメート粒剤'], src: '/pesticides/orizemate-granule.png' },
  { name: 'ブラシンフロアブル', aliases: ['ブラシンフロアブル'], src: '/pesticides/bracin-flowable.png' },
  { name: 'アファーム乳剤', aliases: ['アファーム乳剤'], src: '/pesticides/affirm-emulsion.png' },
  {
    name: 'プレバソンフロアブル5',
    aliases: ['プレバソンフロアブル5', 'プレバソンフロアブル５'],
    src: '/pesticides/prevathon-flowable5.png',
  },
  {
    name: 'スタークル顆粒水溶剤',
    aliases: ['スタークル顆粒水溶剤', 'スタークル顆粒水溶', 'スタークル顆粒'],
    src: '/pesticides/starkle-wdg.png',
  },
  { name: 'スタークル粒剤', aliases: ['スタークル粒剤'], src: '/pesticides/starkle-granule.png' },
]

function normalizePesticideText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[「」『』（）()【】［］\[\]・,，.。:：]/g, '')
}

function findPesticideImage(messageContent) {
  if (!messageContent) return null
  const normalized = normalizePesticideText(messageContent)
  return (
    pesticideImageCatalog.find((item) =>
      (item.aliases ?? [item.name]).some((alias) => normalized.includes(normalizePesticideText(alias))),
    ) ?? null
  )
}

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

function getFieldStatus(field) {
  if (!field) return '状態未設定'
  if (field.suspectedPest && field.suspectedPest !== 'なし') {
    return `${field.suspectedPest} に注意`
  }
  return formatPestPressure(field.pestPressureNote)
}

function applyFieldScenario(field) {
  if (!field) return field

  if (field.id === 'field_001') {
    return {
      ...field,
      suspectedPest: 'いもち病',
      pestPressureNote: 'high',
      managementNote: '葉身に病斑が見られ、病害拡大の疑いがあります。',
    }
  }

  if (field.id === 'field_002') {
    return {
      ...field,
      suspectedPest: 'アブラムシ類',
      pestPressureNote: 'high',
      managementNote: '下葉の黄化に加え、アブラムシの寄生密度が上昇。吸汁害の拡大に注意。',
    }
  }

  return field
}

function MapFitBounds({ geojson }) {
  const map = useMap()

  useEffect(() => {
    if (!geojson?.features?.length) return
    map.fitBounds(getFeatureBounds(geojson.features), { padding: [32, 32], maxZoom: 16 })
  }, [geojson, map])

  return null
}

function BottomRightZoomControl() {
  const map = useMap()

  useEffect(() => {
    // Safety cleanup: remove any pre-existing top-left zoom control.
    if (map.zoomControl) {
      map.removeControl(map.zoomControl)
    }

    const control = L.control.zoom({ position: 'bottomright' })
    control.addTo(map)
    return () => {
      control.remove()
    }
  }, [map])

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
      zoomControl={false}
      className="h-full w-full"
    >
      <BottomRightZoomControl />
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
          const issueType = fieldIssueType[fieldId] ?? 'pest'
          const palette = issuePalette[issueType] ?? defaultPalette
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
      '圃場を選んで質問してください。\n\nこの圃場で聞ける例:\n・この圃場の特徴は？\n・まず見るべき点は？\n・必要なら対応農薬の候補は？',
      { source: 'welcome' },
    ),
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatError, setChatError] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFieldDetailsOpen, setIsFieldDetailsOpen] = useState(false)
  const chatEndRef = useRef(null)

  const difyEndpoint =
    import.meta.env.VITE_DIFY_CHAT_ENDPOINT?.trim() || (import.meta.env.PROD ? '/api/dify/chat' : '')
  const difyUserId = import.meta.env.VITE_DIFY_USER_ID?.trim() || 'agri-gis-poc'

  useEffect(() => {
    let active = true
    document.title = '圃場×農薬インサイト|GIS+Dify'

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
        return applyFieldScenario({
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
        })
      })
      .sort((left, right) => left.id.localeCompare(right.id))
  }, [geojson])

  const selectedField = useMemo(
    () => fields.find((field) => field.id === activeFieldId) ?? fields[0] ?? null,
    [activeFieldId, fields],
  )

  useEffect(() => {
    setIsFieldDetailsOpen(false)
  }, [selectedField?.id])

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
    <div className="h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,_#ecfdf5_0%,_#d1fae5_100%)] text-slate-900">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden px-4 py-3 sm:px-5 lg:px-6 xl:px-8">
        <main className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(340px,390px)] xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <section className="flex min-h-0 h-full flex-col gap-3">
            <header className="hidden shrink-0 rounded-[28px] border border-white/18 bg-slate-900/88 px-4 py-3 text-white shadow-[0_20px_64px_rgba(15,23,42,0.07)] backdrop-blur 2xl:block sm:px-5 sm:py-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium tracking-[0.16em] text-slate-200">
                <span className="rounded-full border border-white/14 bg-white/10 px-2 py-0.5">QGIS</span>
                <span className="rounded-full border border-white/14 bg-white/10 px-2 py-0.5">GeoJSON</span>
                <span className="rounded-full border border-cyan-200/40 bg-cyan-300/18 px-2 py-0.5 text-cyan-50">Dify</span>
              </div>
              <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight text-white">圃場×農薬インサイト|GIS+Dify</h1>
              <p className="mt-2 max-w-4xl text-[0.9rem] leading-5 text-slate-200">
                病害虫の兆候から対応の示唆まで、圃場ごとにその場で確認。
              </p>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_85%_15%,_rgba(132,204,22,0.10),_transparent_22%)]" />
              <div className="relative z-10 shrink-0 flex items-center justify-between gap-3 px-2 pt-2 sm:px-4 sm:pt-4">
                <div className="min-w-0">
                  <h2 className="text-[0.9rem] font-semibold text-slate-950 sm:text-[1rem]">圃場を選ぶ</h2>
                  <p className="mt-1 text-[0.82rem] leading-[1.35] text-slate-700 sm:text-[0.88rem]">
                    圃場ポリゴンをクリックして、管理状況を右ペインで確認できます。
                  </p>
                </div>
                <div className="hidden rounded-full border border-emerald-400/35 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 sm:block">
                  地図は動かせます
                </div>
              </div>

              <div className="relative z-10 mt-3 min-h-0 flex-1">
                <div className="relative h-full overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                  {!loading && !error && geojson ? <AgriMap geojson={geojson} activeFieldId={activeFieldId} onSelectField={setActiveFieldId} /> : null}
                  {loading ? (
                    <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-emerald-300/30 bg-slate-900/80 px-4 py-3 text-sm text-emerald-100">
                      境界データを読み込み中...
                    </div>
                  ) : null}
                  {error ? (
                    <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-rose-300/30 bg-rose-950/85 px-4 py-3 text-sm text-rose-100">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/70 bg-slate-900/95 p-4 text-white shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:p-5">
            <div className="shrink-0">
              <h2 className="mt-1 flex items-center gap-1.5 text-[1rem] font-semibold tracking-tight sm:text-[1.25rem]">
                <span className="material-symbols-rounded text-[1.05em] text-white" aria-hidden="true">
                  location_on
                </span>
                <span>{selectedField?.name ?? '圃場を選択してください'}</span>
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.84rem] leading-[1.35] text-slate-300">
                {selectedField ? (
                  <>
                    <span>{getFieldSummary(selectedField)}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-500 sm:inline-block" />
                    <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-0.5 text-[0.76rem] text-amber-100">
                      {getFieldStatus(selectedField)}
                    </span>
                  </>
                ) : (
                  <span>地図から圃場を選択してください。</span>
                )}
              </div>
              {selectedField ? (
                <div className="mt-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-1.5 text-[0.8rem] text-slate-100 transition-colors hover:border-emerald-300/35 hover:bg-emerald-400/10"
                    aria-expanded={isFieldDetailsOpen}
                    aria-controls="field-details-panel"
                    onClick={() => setIsFieldDetailsOpen((current) => !current)}
                  >
                    <span>{isFieldDetailsOpen ? '詳細を閉じる' : '詳細を開く'}</span>
                    <span className={`text-[0.7rem] transition-transform ${isFieldDetailsOpen ? 'rotate-180' : ''}`}>⌄</span>
                  </button>

                  <div
                    id="field-details-panel"
                    className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-200 ease-out ${isFieldDetailsOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'}`}
                    aria-hidden={!isFieldDetailsOpen}
                  >
                    <div className="min-h-0 overflow-hidden">
                      {selectedField?.suspectedPest && selectedField.suspectedPest !== 'なし' ? (
                        <p className="mb-3 inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-[0.76rem] text-amber-100">
                          {selectedField.suspectedPest} の報告あり。必要なら対応農薬を確認できます。
                        </p>
                      ) : null}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.8rem]">
                        <span className="text-slate-400">圃場ID</span>
                        <span className="font-medium text-white">{selectedField.id}</span>
                        <span className="text-slate-400">圃場種別</span>
                        <span className="font-medium text-white">{formatFieldType(selectedField.fieldType)}</span>
                        <span className="text-slate-400">作物</span>
                        <span className="font-medium text-white">{formatCropType(selectedField.cropType)}</span>
                        <span className="text-slate-400">農薬最終日</span>
                        <span className="font-medium text-white">{selectedField.lastPesticideDate || '—'}</span>
                        <span className="hidden text-slate-400 2xl:block">輪作状況</span>
                        <span className="hidden font-medium text-white 2xl:block">{formatRotationStatus(selectedField.rotationStatus)}</span>
                        <span className="hidden text-slate-400 2xl:block">病害虫状況</span>
                        <span className="hidden font-medium text-white 2xl:block">{formatPestPressure(selectedField.pestPressureNote)}</span>
                        <span className="hidden text-slate-400 2xl:block">害虫報告</span>
                        <span className="hidden font-medium text-white 2xl:block">{selectedField.suspectedPest || '—'}</span>
                        <span className="hidden text-slate-400 2xl:block">観察事項</span>
                        <span className="hidden font-medium text-white 2xl:block">{formatManagementNote(selectedField.managementNote)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 flex items-center justify-between border-b border-white/10 pb-2.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Chat</p>
                <p className="text-[10px] text-slate-400">{difyEndpoint ? 'Dify接続中' : '未接続'}</p>
              </div>
              <p className="mt-2 text-[10px] leading-[1.5] text-slate-400">
                圃場の特徴・まず見る点・必要なら対応農薬の候補を質問できます。
              </p>
              <div className="chat-scroll mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {renderedChatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[88%] space-y-2">
                      <div
                        className={`rounded-[22px] px-3.5 py-2.5 text-[0.86rem] leading-[1.4] ${
                          message.role === 'user' ? 'bg-emerald-500 text-slate-950' : 'border border-white/10 bg-white/8 text-slate-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === 'assistant' && (() => {
                        const pesticide = findPesticideImage(message.content)
                        if (!pesticide) return null
                        return (
                          <figure className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
                            <img
                              src={pesticide.src}
                              alt={`${pesticide.name} の参考画像`}
                              className="h-[140px] w-[220px] object-cover"
                              loading="lazy"
                            />
                            <figcaption className="px-2.5 py-2 text-[0.72rem] text-slate-300">{pesticide.name}</figcaption>
                          </figure>
                        )
                      })()}
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
                className="mt-3 shrink-0 border-t border-white/10 pt-3"
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
                    rows={2}
                    placeholder="入力例：この圃場の特徴は？ / 必要なら対応農薬の候補は？"
                    className="min-h-[64px] flex-1 resize-none rounded-2xl border border-emerald-300/25 bg-slate-900 px-4 py-3 text-[0.82rem] leading-[1.35] text-white outline-none placeholder:text-slate-400 focus:border-emerald-300"
                    style={{ fontSize: '0.82rem', lineHeight: '1.35' }}
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
