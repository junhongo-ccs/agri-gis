import {
  formatCropType,
  formatFieldType,
  formatManagementNote,
  formatPestPressure,
  formatRotationStatus,
} from './agriFormat'

function normalizeTargetCrop(cropType) {
  const normalized = formatCropType(cropType)
  if (!normalized || normalized === '—') return ''
  if (normalized === '野菜') return '野菜類'
  if (normalized === '果樹') return '果樹類'
  if (normalized === '水稲') return '稲'
  if (normalized === '複合作物') return '野菜類'
  return normalized
}

function normalizeTargetPest(suspectedPest) {
  const normalized = suspectedPest == null ? '' : String(suspectedPest).trim()
  if (!normalized || normalized === 'なし' || normalized === '—') return ''
  if (normalized.endsWith('類')) return normalized
  return `${normalized}類`
}

export function buildAgriContext({ field, question }) {
  const targetCrop = field ? normalizeTargetCrop(field.cropType) : ''
  const targetPest = field ? normalizeTargetPest(field.suspectedPest) : ''

  return {
    schema_version: 'agri.v1',
    task_type: targetPest ? 'pest_recommendation' : 'field_summary',
    target_crop: targetCrop,
    target_pest: targetPest,
    generated_at: new Date().toISOString(),
    field: field
      ? {
        field_id: field.id,
        field_name: field.name,
        field_type: formatFieldType(field.fieldType),
        area_ha: field.areaHa,
        crop_type: formatCropType(field.cropType),
        soil_ph: field.soilPh,
        last_pesticide_date: field.lastPesticideDate,
        suspected_pest: field.suspectedPest,
        observation_note: formatManagementNote(field.managementNote),
        management_note: formatManagementNote(field.managementNote),
        rotation_status: formatRotationStatus(field.rotationStatus),
        pest_pressure_note: formatPestPressure(field.pestPressureNote),
      }
      : null,
    query: question,
    question,
  }
}

export function createLocalAssistantReply({ question, field }) {
  if (!field) {
    return '圃場データを読み込み中です。しばらく待ってからもう一度試してください。'
  }

  const prefix = question ? `「${question}」に対して、` : ''
  const pestLine =
    field.suspectedPest && field.suspectedPest !== 'なし'
      ? `害虫報告は ${field.suspectedPest} です。`
      : '現時点で特定の害虫報告はありません。'
  return `${prefix}${field.name}（${field.areaHa ?? '—'} ha）は、作物：${formatCropType(field.cropType)}、土壌 pH ${field.soilPh ?? '—'} の圃場です。${pestLine} 病害虫状況：${formatPestPressure(field.pestPressureNote)}。Dify 接続後は、圃場コンテキストをもとに詳細な説明が返ります。`
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
      agri_context: context,
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
