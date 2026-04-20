import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import aiSparkleIcon from './icons/ai-sparkle.svg'
import sendPlaneIcon from './icons/send-plane.svg'
import { phase1AreaGeojson } from './areaGeojson'
import { buildTourismContext, createLocalAssistantReply, postChatMessage } from './difyChat'

const metricDefinitions = [
  { key: 'cafe', label: 'カフェ', countField: 'cafe_count', densityField: 'cafe_density' },
  { key: 'restaurant', label: 'レストラン', countField: 'restaurant_count', densityField: 'restaurant_density' },
  { key: 'museum', label: 'ミュージアム', countField: 'museum_count', densityField: 'museum_density' },
  { key: 'hotel', label: 'ホテル', countField: 'hotel_count', densityField: 'hotel_density' },
  { key: 'station', label: '駅', countField: 'station_count', densityField: 'station_density' },
]

const areaMeta = {
  shinagawa: {
    accent: 'from-cyan-400 to-sky-600',
    fill: '#67e8f9',
    stroke: '#06b6d4',
  },
  oimachi: {
    accent: 'from-emerald-400 to-teal-600',
    fill: '#6ee7b7',
    stroke: '#10b981',
  },
  shiba_park_tokyo_tower: {
    accent: 'from-amber-300 to-orange-500',
    fill: '#fcd34d',
    stroke: '#f59e0b',
  },
  odaiba: {
    accent: 'from-fuchsia-400 to-rose-500',
    fill: '#f9a8d4',
    stroke: '#f43f5e',
  },
}

const themeLabels = {
  gateway: '移動拠点',
  redevelopment_mixed_urban: '再開発・都市回遊',
  landmark_park_walk: 'ランドマーク・公園散策',
  waterfront_leisure: 'ウォーターフロント・レジャー',
}

const metricIcons = {
  cafe: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M4 10h11v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 11h2a2 2 0 1 1 0 4h-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 7c0-1 1-1.4 1-2.4M10 7c0-1 1-1.4 1-2.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  restaurant: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M7 3v8M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 11v10M15 3v18M15 3c2.2 0 4 1.8 4 4v4h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  museum: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M3 9 12 4l9 5M5 10v7M10 10v7M14 10v7M19 10v7M3 19h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  hotel: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M5 5v14M5 12h14v7M9 8v4M14 9h2a3 3 0 0 1 3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  station: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M8 4h8a2 2 0 0 1 2 2v7a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 8h6M10 20l2-3 2 3M8 13h.01M16 13h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

function parseCsv(text) {
  const rows = []
  let current = ''
  let row = []
  let inQuotes = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current)
      current = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1
      row.push(current)
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }
  if (current !== '' || row.length > 0) {
    row.push(current)
    rows.push(row)
  }
  if (rows.length === 0) return []
  const [header, ...body] = rows
  return body.map((values) => Object.fromEntries(header.map((key, columnIndex) => [key, values[columnIndex] ?? ''])))
}

function parseNumber(value) {
  return value === '' ? null : Number(value)
}

function createAreaNote(areaName, strongestMetric) {
  if (!strongestMetric) return `${areaName} は、QGIS から追加の指標を出力すると、より具体的に説明できます。`

  if (strongestMetric.key === 'station') return `${strongestMetric.label}の指標が最も強く、エリア内を移動しやすい可能性があります。`
  if (strongestMetric.key === 'museum') return `${strongestMetric.label}の件数が相対的に強く、文化寄りの解釈を支えます。`
  return `${strongestMetric.label}の件数が、このエリアでいちばん強いシグナルになっています。`
}

function createPopupFact(area) {
  if (!area) return ''
  return `カフェ ${area.counts.cafe}件、レストラン ${area.counts.restaurant}件、ミュージアム ${area.counts.museum}件、ホテル ${area.counts.hotel}件、駅 ${area.counts.station}件`
}

function createMobilePopupFactList(area) {
  if (!area) return []

  return metricDefinitions.map((metric) => ({
    key: metric.key,
    label: metric.label,
    value: area.counts[metric.key] ?? 0,
    icon: metricIcons[metric.key],
  }))
}

function toAreaRecord(row) {
  const counts = Object.fromEntries(metricDefinitions.map((metric) => [metric.key, Number(row[metric.countField] || 0)]))
  const densities = Object.fromEntries(metricDefinitions.map((metric) => [metric.key, parseNumber(row[metric.densityField])]))
  const strongestMetric = metricDefinitions
    .map((metric) => ({ key: metric.key, label: metric.label, value: counts[metric.key] }))
    .sort((left, right) => right.value - left.value)[0] ?? null
  return {
    id: row.area_id,
    name: row.area_name,
    tone: themeLabels[row.theme] ?? row.theme,
    status: row.status,
    areaKm2: parseNumber(row.area_km2),
    counts,
    densities,
    strongestMetric,
    accent: areaMeta[row.area_id]?.accent ?? 'from-slate-400 to-slate-600',
    note: createAreaNote(row.area_name, strongestMetric),
  }
}

function getFeatureCenter(feature) {
  const ring = feature?.geometry?.coordinates?.[0] ?? []
  if (ring.length === 0) {
    return [35.635, 139.758]
  }

  const uniquePoints = ring.slice(0, -1)
  const summary = uniquePoints.reduce(
    (accumulator, [lng, lat]) => ({
      lat: accumulator.lat + lat,
      lng: accumulator.lng + lng,
    }),
    { lat: 0, lng: 0 },
  )

  return [summary.lat / uniquePoints.length, summary.lng / uniquePoints.length]
}

function getFeatureBounds(features) {
  const points = features.flatMap((feature) => feature?.geometry?.coordinates?.[0] ?? [])
  const lngs = points.map(([lng]) => lng)
  const lats = points.map(([, lat]) => lat)

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createChatMessage(role, content, meta = {}) {
  return {
    id: `${role}-${createMessageId()}`,
    role,
    content,
    meta,
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function isComposingEvent(event) {
  return event.nativeEvent?.isComposing || event.isComposing || event.keyCode === 229
}

function toUserFacingChatError(error) {
  if (!(error instanceof Error)) {
    return '一時的に応答を取得できませんでした。もう一度お試しください。'
  }

  const message = error.message?.trim()
  if (!message || message === 'Failed to fetch') {
    return '接続に失敗しました。しばらくしてから、もう一度お試しください。'
  }

  return message
}

function splitMessageContent(message) {
  if (message.role !== 'assistant') {
    return [{ id: message.id, content: message.content, role: message.role }]
  }

  const parts = message.content
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length <= 1) {
    return [{ id: message.id, content: message.content, role: message.role }]
  }

  return parts.map((part, index) => ({
    id: `${message.id}-${index}`,
    content: part,
    role: message.role,
  }))
}

function MapDismiss({ onDismiss }) {
  useMapEvents({
    click: (event) => {
      const target = event.originalEvent?.target
      if (target instanceof Element && target.closest('.leaflet-interactive')) {
        return
      }
      onDismiss()
    },
  })

  return null
}

function BottomRightZoomControl() {
  const map = useMap()

  useEffect(() => {
    const control = L.control.zoom({ position: 'bottomright' })
    control.addTo(map)

    return () => {
      control.remove()
    }
  }, [map])

  return null
}

function MapFitBounds() {
  const map = useMap()

  useEffect(() => {
    const bounds = getFeatureBounds(phase1AreaGeojson.features)
    map.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: 13,
    })
  }, [map])

  return null
}

function PopupOverlay({ popupArea, popupPosition }) {
  const map = useMap()
  const [style, setStyle] = useState(null)
  const [placement, setPlacement] = useState('top')
  const cardRef = useRef(null)
  const areaNameClass = 'text-[0.95rem] font-semibold tracking-tight text-white sm:text-[1.05rem]'
  const visibleMetrics = useMemo(
    () => Object.entries(popupArea?.counts ?? {}).filter(([, value]) => value > 0),
    [popupArea],
  )

  useEffect(() => {
    if (!popupArea || !popupPosition) {
      setStyle(null)
      return
    }

    function updatePosition() {
      const point = map.latLngToContainerPoint(popupPosition)
      const pointerHeight = 16
      const cardWidth = cardRef.current?.offsetWidth ?? 288
      const cardBodyHeight = cardRef.current?.offsetHeight ?? 136
      const overlayHeight = cardBodyHeight + pointerHeight
      const mapSize = map.getSize()
      const spaceAbove = point.y - 16
      const spaceBelow = mapSize.y - point.y - 16
      const nextPlacement = spaceAbove >= overlayHeight || spaceAbove >= spaceBelow ? 'top' : 'bottom'
      const left = clamp(point.x, 16 + cardWidth / 2, mapSize.x - 16 - cardWidth / 2)
      const top =
        nextPlacement === 'top'
          ? clamp(point.y - overlayHeight, 16, mapSize.y - overlayHeight - 16)
          : clamp(point.y + pointerHeight, 16, mapSize.y - overlayHeight - 16)

      setStyle({
        left: `${left}px`,
        top: `${top}px`,
      })
      setPlacement(nextPlacement)
    }

    updatePosition()
    map.on('zoom move resize', updatePosition)
    return () => {
      map.off('zoom move resize', updatePosition)
    }
  }, [map, popupArea, popupPosition])

  if (!popupArea || !style) {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[500]"
      aria-hidden="true"
    >
      <div
        ref={cardRef}
        className="pointer-events-auto absolute w-[18rem] -translate-x-1/2 rounded-[22px] border border-white/10 bg-slate-900/94 p-3 text-white shadow-[0_24px_80px_rgba(15,23,42,0.40)] backdrop-blur"
        style={style}
      >
        <button
          type="button"
          aria-label="ポップアップを閉じる"
          onClick={(event) => {
            event.stopPropagation()
            onDismissPopup()
          }}
          className="absolute right-2 top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/8 text-[10px] leading-none text-slate-200 transition hover:bg-white/14 hover:text-white"
        >
          ×
        </button>
        <div
          className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 drop-shadow-[0_10px_22px_rgba(15,23,42,0.35)] ${
            placement === 'top'
              ? 'top-full border-x-[8px] border-t-[16px] border-x-transparent border-t-slate-900'
              : 'bottom-full border-x-[8px] border-b-[16px] border-x-transparent border-b-slate-900'
          }`}
        />
        <div className="pr-5">
          <div>
            <p className={areaNameClass}>{popupArea.name}</p>
            <p className="mt-1 hidden text-sm text-slate-300 2xl:block">{popupArea.tone}</p>
          </div>
        </div>
          <div
            className="mt-3 grid gap-1.5 text-center text-xs"
            style={{
              gridTemplateColumns: `repeat(${Math.max(visibleMetrics.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {visibleMetrics.map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white/6 px-1.5 py-1.5">
                <div
                  className="flex items-center justify-center text-slate-300"
                title={metricDefinitions.find((metric) => metric.key === key)?.label ?? key}
                aria-label={metricDefinitions.find((metric) => metric.key === key)?.label ?? key}
              >
                {metricIcons[key] ?? <span className="uppercase tracking-[0.18em] text-slate-400">{key}</span>}
              </div>
              <p className="mt-1 text-xs font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-300">{createPopupFact(popupArea)}</p>
      </div>
    </div>
  )
}

function TourismMap({ areas, activeAreaId, popupAreaId, onSelectArea, onDismissPopup, showPopupOverlay = true, showZoomControl = true }) {
  const areasById = useMemo(() => Object.fromEntries(areas.map((area) => [area.id, area])), [areas])
  const popupFeature = useMemo(
    () => phase1AreaGeojson.features.find((feature) => feature.properties.area_id === popupAreaId) ?? null,
    [popupAreaId],
  )
  const popupArea = popupAreaId ? areasById[popupAreaId] : null
  const popupPosition = popupFeature ? getFeatureCenter(popupFeature) : null

  return (
    <MapContainer
      center={[35.635, 139.758]}
      zoom={13}
      minZoom={11}
      maxZoom={17}
      zoomControl={false}
      className="h-full w-full rounded-[24px]"
      scrollWheelZoom={true}
    >
      <MapFitBounds />
      {showZoomControl ? <BottomRightZoomControl /> : null}
      <MapDismiss onDismiss={onDismissPopup} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        data={phase1AreaGeojson}
        style={(feature) => {
          const areaId = feature?.properties?.area_id
          const palette = areaMeta[areaId] ?? areaMeta.shinagawa
          const active = areaId === activeAreaId
          return {
            color: palette.stroke,
            fillColor: palette.fill,
            fillOpacity: active ? 0.55 : 0.28,
            weight: active ? 3 : 2,
          }
        }}
        onEachFeature={(feature, layer) => {
          layer.on({
            click: (event) => {
              event.originalEvent?.stopPropagation?.()
              onSelectArea(feature.properties.area_id)
            },
          })
        }}
      />
      {showPopupOverlay ? <PopupOverlay popupArea={popupArea} popupPosition={popupPosition} /> : null}
    </MapContainer>
  )
}

function App() {
  const [areas, setAreas] = useState([])
  const [activeAreaId, setActiveAreaId] = useState('shinagawa')
  const [popupAreaId, setPopupAreaId] = useState('shinagawa')
  const [mobileScreen, setMobileScreen] = useState('map')
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState(() => [
    createChatMessage(
      'assistant',
      'エリアを選ぶと、GISで見た施設分布や集積傾向をもとに特徴を整理できます。まずはこのエリアの特徴や違いを聞いてみてください。',
      {
        source: 'welcome',
      },
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
    import.meta.env.VITE_DIFY_CHAT_ENDPOINT?.trim() ?? (import.meta.env.PROD ? '/api/dify/chat' : '')
  const difyUserId = import.meta.env.VITE_DIFY_USER_ID?.trim() || 'qgis-tourism-poc'

  useEffect(() => {
    let active = true
    document.title = 'QGIS × Dify | 観光GIS PoC'
    async function loadAreas() {
      try {
        const response = await fetch('/exports/phase1_areas_summary_counts.csv')
        if (!response.ok) throw new Error(`Failed to load data: ${response.status}`)
        const rows = parseCsv(await response.text())
        if (!active) return
        const mapped = rows.map(toAreaRecord)
        setAreas(mapped)
        const nextAreaId = mapped.find((area) => area.id === activeAreaId)?.id ?? mapped[0]?.id ?? ''
        setActiveAreaId(nextAreaId)
        setPopupAreaId(nextAreaId)
        setError('')
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'データの読み込みで不明なエラーが発生しました')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadAreas()
    return () => {
      active = false
    }
  }, [])

  function handleSelectArea(areaId) {
    setActiveAreaId(areaId)
    setPopupAreaId(areaId)
    setMobileDetailOpen(true)
  }

  const selectedAreas = useMemo(() => {
    if (areas.length === 0) return { left: null, right: null }
    const left = areas.find((area) => area.id === activeAreaId) ?? areas[0]
    const right = areas.find((area) => area.id !== left.id) ?? left
    return { left, right }
  }, [activeAreaId, areas])

  const selectedArea = selectedAreas.left
  const comparisonArea = selectedAreas.right
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

    const nextUserMessage = createChatMessage('user', text)
    setChatMessages((current) => [...current, nextUserMessage])
    setChatInput('')
    setChatError('')
    setIsSending(true)

    const context = buildTourismContext({
      areas,
      selectedArea,
      comparisonArea,
      question: text,
    })

    if (!difyEndpoint) {
      setChatMessages((current) => [
        ...current,
        createChatMessage(
          'assistant',
          createLocalAssistantReply({
            question: text,
            selectedArea,
            comparisonArea,
          }),
          {
            source: 'local-fallback',
          },
        ),
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
        createChatMessage('assistant', result.answer || '返答が届きませんでした。', {
          source: 'dify',
        }),
      ])
    } catch (sendError) {
      setChatError(toUserFacingChatError(sendError))
      setChatMessages((current) => [
        ...current,
        createChatMessage(
          'assistant',
          createLocalAssistantReply({
            question: text,
            selectedArea,
            comparisonArea,
          }) + ' いまはローカル代替応答を表示しています。',
          {
            source: 'fallback-after-error',
          },
        ),
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <div className="lg:hidden h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] text-slate-900">
        <div className="mx-auto flex h-full max-w-[960px] flex-col overflow-hidden px-3 py-3">
          {mobileScreen === 'map' ? (
            <div className="relative flex h-full min-h-0 flex-col">
              <header className="shrink-0 rounded-[22px] border border-white/70 bg-white/75 px-4 py-3 shadow-[0_16px_44px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-700">地図</p>
                <h1 className="mt-1 text-[1.1rem] font-semibold tracking-tight text-slate-950">1.観光エリアを選ぶ</h1>
                <p className="mt-1.5 text-[0.92rem] leading-6 text-slate-700">
                  品川・大井町・芝公園・お台場の観光基本データをもとに、AIと会話できます。
                </p>
              </header>

              <div className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
                {!loading && !error ? (
                  <TourismMap
                    areas={areas}
                    activeAreaId={activeAreaId}
                    popupAreaId={popupAreaId}
                    onSelectArea={handleSelectArea}
                    onDismissPopup={() => {
                      setPopupAreaId('')
                      setMobileDetailOpen(false)
                    }}
                    showPopupOverlay={false}
                    showZoomControl={false}
                  />
                ) : null}
                {loading ? (
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-cyan-300/20 bg-slate-900/85 px-4 py-3 text-sm text-cyan-100">
                    エリア情報を読み込み中...
                  </div>
                ) : null}
                {error ? (
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-rose-300/30 bg-rose-950/85 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}

                {mobileDetailOpen ? (
                  <div
                    className="absolute inset-0 z-[600] flex items-end bg-slate-950/28 backdrop-blur-[2px]"
                    role="button"
                    tabIndex={0}
                    aria-label="モーダルを閉じる"
                    onClick={() => {
                      setMobileDetailOpen(false)
                      setPopupAreaId('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setMobileDetailOpen(false)
                        setPopupAreaId('')
                      }
                    }}
                  >
                    <div
                      className="max-h-[calc(100dvh-24px)] w-full overflow-y-auto border-t border-slate-200 bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-16px_48px_rgba(15,23,42,0.14)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-700">2.エリアについて聞く</p>
                          <p className="mt-1 text-[1.08rem] font-semibold tracking-tight text-slate-950">
                            {selectedArea?.name ?? 'エリアを選択してください'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-medium text-slate-500">
                            {difyEndpoint ? 'Dify接続中' : '未接続'}
                          </span>
                          <button
                            type="button"
                            aria-label="モーダルを閉じる"
                            onClick={() => {
                              setMobileDetailOpen(false)
                              setPopupAreaId('')
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-[0.95rem] leading-6 text-slate-700">
                        {selectedArea?.note ?? 'まずは地図上のエリアを選んでください。'}
                      </p>
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.8rem] leading-5 text-slate-700">
                          {createMobilePopupFactList(selectedArea).map((item) => (
                            <div key={item.key} className="flex items-center gap-2 text-slate-950">
                              <span className="shrink-0 text-slate-950">{item.icon}</span>
                              <span className="min-w-0 flex-1 text-slate-700">{item.label}</span>
                              <span className="shrink-0 font-medium text-slate-950">{item.value}件</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-slate-200 bg-gradient-to-t from-white via-white to-white/95 px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
                        <button
                          type="button"
                          onClick={() => setMobileScreen('chat')}
                          className="inline-flex h-14 w-full items-center justify-center gap-1 rounded-3xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
                        >
                        <img src={aiSparkleIcon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
                        チャットでたずねる
                      </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <header className="shrink-0 rounded-[22px] border border-white/70 bg-white/75 px-4 py-3 shadow-[0_16px_44px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileScreen('map')}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-slate-700 shadow-sm"
                  >
                    <span aria-hidden="true" className="mr-1 font-semibold leading-none">
                      ←
                    </span>
                    地図へ戻る
                  </button>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-50 px-2.5 py-1 text-[10px] font-medium text-cyan-700">
                    {difyEndpoint ? 'Dify接続中' : '未接続'}
                  </span>
                </div>
                <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.26em] text-cyan-700">2.エリアについて聞く</p>
                <h2 className="mt-1 text-[1.1rem] font-semibold tracking-tight text-slate-950">
                  {selectedArea?.name ?? 'エリアを選択してください'}
                </h2>
                <p className="mt-1 text-[0.92rem] leading-6 text-slate-700">
                  {selectedArea?.note ?? '選択したエリアの特徴を質問できます。'}
                </p>
              </header>

              <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                <div className="shrink-0 border-b border-white/10 px-4 py-3">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-400">やり取り</p>
                  <p className="mt-1 text-[1rem] font-semibold tracking-tight text-white">
                    {selectedArea?.name ?? 'エリアを選択してください'}
                  </p>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
                  {renderedChatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-[22px] px-3.5 py-2.5 text-[0.95rem] leading-[1.5] ${
                          message.role === 'user'
                            ? 'bg-cyan-500 text-slate-950'
                            : 'border border-white/10 bg-white/7 text-slate-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isSending ? (
                    <div className="flex justify-start">
                      <div className="rounded-[24px] border border-white/10 bg-white/7 px-4 py-3 text-[0.8rem] leading-5 text-slate-300">
                        Geminiに送信中...
                      </div>
                    </div>
                  ) : null}
                  <div ref={chatEndRef} />
                </div>

                <form
                  className="shrink-0 border-t border-white/10 px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))]"
                  onSubmit={(event) => {
                    event.preventDefault()
                    sendChatMessage(chatInput)
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[9px] leading-4 text-cyan-100/70">Enter で送信 / Shift+Enter で改行</p>
                  </div>
                  <div className="flex items-end gap-3">
                    <textarea
                      id="chat-input-mobile"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' || event.shiftKey || isComposingEvent(event)) return
                        event.preventDefault()
                        sendChatMessage(chatInput)
                      }}
                      rows={2}
                      placeholder="入力例：このエリアはどんな観光体験に向いていますか？"
                      style={{ fontSize: '1rem', lineHeight: '1.45' }}
                      className="min-h-[56px] flex-1 resize-none rounded-2xl border border-cyan-300/25 bg-slate-900 px-4 py-3 text-[1rem] leading-[1.45] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-[1rem] placeholder:leading-[1.45] placeholder:text-slate-400 focus:border-cyan-300 focus:bg-slate-900"
                    />
                    <button
                      type="submit"
                      aria-label="メッセージを送信"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-[0_16px_32px_rgba(6,182,212,0.34)] transition active:scale-[0.98]"
                    >
                      <img src={sendPlaneIcon} alt="" aria-hidden="true" className="h-9 w-9 shrink-0" />
                    </button>
                  </div>
                </form>

                {chatError ? (
                  <p className="shrink-0 border-t border-white/10 px-4 py-3 text-[0.86rem] leading-6 text-rose-100">
                    {chatError}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] text-slate-900">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden px-4 py-3 sm:px-5 lg:px-6 xl:px-8">
        <main className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(330px,360px)] xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
          <section className="flex min-h-0 h-full flex-col gap-3">
            <header className="hidden shrink-0 rounded-[22px] border border-white/70 bg-white/60 px-4 py-3 shadow-[0_16px_44px_rgba(15,23,42,0.06)] backdrop-blur-sm 2xl:block sm:px-5 sm:py-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium tracking-[0.16em] text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">QGIS</span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">空間集計CSV</span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">React</span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">Vite</span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">Leaflet</span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">Dify</span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">Tailwind CSS</span>
                </div>
                <div className="max-w-4xl">
                  <h1 className="text-[1.45rem] font-semibold tracking-tight text-slate-950 sm:text-[1.75rem] lg:text-[1.95rem] xl:text-[2.05rem]">会話する「観光空間データ」。</h1>
                </div>
              </div>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,_rgba(56,189,248,0.10),_transparent_28%),radial-gradient(circle_at_80%_15%,_rgba(250,204,21,0.10),_transparent_20%)]" />
              <div className="relative z-10 shrink-0 flex items-start justify-between gap-3 pl-2 pr-2 pt-2 sm:pl-4 sm:pr-4 sm:pt-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-700">地図</p>
                    <h2 className="mt-1 text-[0.88rem] font-semibold text-slate-950 sm:text-[0.98rem]">1.観光エリアを選ぶ</h2>
                    <p className="mt-1.5 max-w-xl text-[0.86rem] leading-[1.3] text-slate-700 sm:text-[0.9rem]">品川・大井町・芝公園・お台場の観光基本データをもとに、AIと会話できます。</p>
                </div>
                <div className="hidden rounded-full border border-cyan-400/40 bg-cyan-50 px-2.5 py-1 text-[10px] font-medium text-cyan-700 sm:block sm:shrink-0">地図は動かせます</div>
              </div>

              <div className="relative z-10 mt-4 min-h-0 flex-1">
                <div className="relative h-full overflow-hidden rounded-[24px] bg-white">
                  {!loading && !error ? (
                    <TourismMap
                      areas={areas}
                      activeAreaId={activeAreaId}
                      popupAreaId={popupAreaId}
                      onSelectArea={handleSelectArea}
                      onDismissPopup={() => {
                        setPopupAreaId('')
                        setMobileDetailOpen(false)
                      }}
                    />
                  ) : null}
                  {loading ? <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-cyan-300/20 bg-slate-900/80 px-4 py-3 text-sm text-cyan-100">エリア情報を読み込み中...</div> : null}
                  {error ? <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-rose-300/30 bg-rose-950/80 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
                </div>
              </div>
            </div>
          </section>

          <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/75 bg-slate-900/94 p-4 text-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
            <div className="shrink-0">
                <h2 className="text-[0.88rem] font-semibold tracking-tight text-white sm:text-[0.98rem]">2.エリアについて聞く</h2>

                <div className="mt-3 rounded-[20px] border border-white/10 bg-white/7 px-4 py-1.5 sm:mt-4 sm:py-2">
                  <p className="hidden text-[10px] uppercase tracking-[0.22em] text-slate-400 2xl:block">選択中のエリア</p>
                  <p className="mt-0.5 text-[0.92rem] font-semibold tracking-tight text-white sm:mt-1 sm:text-[1.05rem]">
                    {selectedArea?.name ?? 'エリアを選択してください'}
                  </p>
                </div>
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">やり取り</p>
                <p className="text-[10px] text-slate-400">{difyEndpoint ? 'Dify接続中' : '未接続'}</p>
              </div>
              <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {renderedChatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-[22px] px-3.5 py-2.5 text-[0.86rem] leading-[1.4] ${
                        message.role === 'user'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'border border-white/10 bg-white/7 text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isSending ? (
                  <div className="flex justify-start">
                    <div className="rounded-[24px] border border-white/10 bg-white/7 px-4 py-3 text-[10px] leading-5 text-slate-300">
                      Geminiに送信中...
                    </div>
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] leading-5 text-cyan-100/70">Enter で送信 / Shift+Enter で改行</p>
                </div>
                <textarea
                  id="chat-input"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' || event.shiftKey || isComposingEvent(event)) return
                    event.preventDefault()
                    sendChatMessage(chatInput)
                  }}
                  rows={2}
                  placeholder="入力例：このエリアはどんな観光体験に向いていますか？"
                  style={{ fontSize: '0.82rem', lineHeight: '1.35' }}
                  className="w-full resize-none rounded-2xl border border-cyan-300/25 bg-slate-900 px-4 py-3 text-[0.82rem] leading-[1.35] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-[0.82rem] placeholder:leading-[1.35] placeholder:text-slate-400 focus:border-cyan-300 focus:bg-slate-900"
                />
              </form>

              {chatError ? (
                <p className="mt-3 shrink-0 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-[0.86rem] leading-6 text-rose-100">
                  {chatError}
                </p>
              ) : null}
            </div>
          </aside>
        </main>
      </div>
      </div>
    </>
  )
}

export default App
