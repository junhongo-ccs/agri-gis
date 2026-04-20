function serializeArea(area) {
  if (!area) return null

  return {
    area_id: area.id,
    area_name: area.name,
    theme: area.tone,
    status: area.status,
    area_km2: area.areaKm2,
    counts: area.counts,
    densities: area.densities,
    strongest_metric: area.strongestMetric
      ? {
          key: area.strongestMetric.key,
          label: area.strongestMetric.label,
          value: area.strongestMetric.value,
        }
      : null,
    note: area.note,
  }
}

function isExplicitComparisonQuestion(question) {
  if (!question) return false
  return /(?:比較|比べ|比べて|比べると|違い|差|どちら|どっち|くらべ|vs)/i.test(question)
}

export function buildTourismContext({ areas, selectedArea, comparisonArea, question }) {
  const shouldCompare = isExplicitComparisonQuestion(question) && comparisonArea
  return {
    schema_version: 'phase1.v1',
    generated_at: new Date().toISOString(),
    selection_mode: shouldCompare ? 'compare' : 'single',
    question,
    selected_area_id: selectedArea?.id ?? null,
    comparison_area_id: shouldCompare ? comparisonArea?.id ?? null : null,
    selected_area: serializeArea(selectedArea),
    comparison_area: shouldCompare ? serializeArea(comparisonArea) : null,
    available_areas: areas.map(serializeArea),
  }
}

export function createLocalAssistantReply({ question, selectedArea, comparisonArea }) {
  if (!selectedArea) {
    return 'エリアの読み込み中です。しばらく待ってからもう一度試してください。'
  }

  const strongestMetric = selectedArea.strongestMetric
  const strongestLabel = strongestMetric?.label ?? '指標'
  const strongestValue =
    strongestMetric && selectedArea.counts[strongestMetric.key] !== undefined
      ? selectedArea.counts[strongestMetric.key]
      : null
  const questionPrefix = question ? `「${question}」に対して、` : ''
  const compareSuffix = question && isExplicitComparisonQuestion(question) && comparisonArea ? ` ${comparisonArea.name} と比べると、` : ''

  return `${questionPrefix}${selectedArea.name} は ${selectedArea.tone} の文脈で、${strongestLabel} ${strongestValue ?? '—'}件が目立ちます。${compareSuffix}件数と密度を根拠に、Dify ではここから自然文へ整形する想定です。`
}

async function readResponseBody(response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { raw_text: text }
  }
}

export async function postChatMessage({ endpoint, userId, conversationId, question, context, signal }) {
  const body = {
    query: question,
    inputs: {
      tourism_context: context,
    },
    response_mode: 'blocking',
    user: userId,
    auto_generate_name: !conversationId,
  }

  if (conversationId) {
    body.conversation_id = conversationId
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  const data = await readResponseBody(response)
  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'Dify への送信に失敗しました'
    throw new Error(message)
  }

  return {
    answer: data?.answer ?? data?.data?.answer ?? data?.message ?? '',
    conversationId: data?.conversation_id ?? data?.conversationId ?? conversationId ?? null,
    raw: data,
  }
}
