import {
  formatCropType,
  formatFieldType,
  formatManagementNote,
  formatPestPressure,
  formatRotationStatus,
} from './agriFormat'

const pesticideCatalog = [
  {
    product_name: 'ブラシンフロアブル',
    target_crop: '稲',
    target_issue: 'いもち病',
    target_issue_type: 'disease',
    dosage_l_per_10a: 0.1,
    dilution_ratio: '1000倍',
    note: '病斑の拡大抑制を狙う基本候補',
  },
  {
    product_name: 'オリゼメート粒剤',
    target_crop: '稲',
    target_issue: 'いもち病',
    target_issue_type: 'disease',
    dosage_l_per_10a: 3.0,
    dilution_ratio: '粒剤',
    note: '予防寄りの施用候補',
  },
  {
    product_name: 'スタークル顆粒水溶剤',
    target_crop: '野菜類',
    target_issue: 'アブラムシ類',
    target_issue_type: 'pest',
    dosage_l_per_10a: 0.05,
    dilution_ratio: '2000倍',
    note: '吸汁害虫向け候補',
  },
  {
    product_name: 'アファーム乳剤',
    target_crop: '野菜類',
    target_issue: 'ハモグリバエ類',
    target_issue_type: 'pest',
    dosage_l_per_10a: 0.05,
    dilution_ratio: '2000倍',
    note: '潜葉害虫向け候補',
  },
  {
    product_name: 'プレバソンフロアブル5',
    target_crop: '野菜類',
    target_issue: 'ヨトウムシ類',
    target_issue_type: 'pest',
    dosage_l_per_10a: 0.02,
    dilution_ratio: '4000倍',
    note: 'チョウ目幼虫向け候補',
  },
  {
    product_name: 'スタークル粒剤',
    target_crop: '稲',
    target_issue: 'イネミズゾウムシ類',
    target_issue_type: 'pest',
    dosage_l_per_10a: 3.0,
    dilution_ratio: '粒剤',
    note: '田植え後の害虫向け候補',
  },
  {
    product_name: 'リドミルゴールドMZ',
    target_crop: '野菜類',
    target_issue: 'べと病',
    target_issue_type: 'disease',
    dosage_l_per_10a: 0.25,
    dilution_ratio: '1000倍',
    note: 'べと病向け候補',
  },
  {
    product_name: 'トリフミン水和剤',
    target_crop: '野菜類',
    target_issue: 'うどんこ病',
    target_issue_type: 'disease',
    dosage_l_per_10a: 0.033,
    dilution_ratio: '3000倍',
    note: 'うどんこ病向け候補',
  },
]

function normalizeTargetCrop(cropType) {
  const normalized = formatCropType(cropType)
  if (!normalized || normalized === '—') return ''
  if (normalized === '野菜') return '野菜類'
  if (normalized === '果樹') return '果樹類'
  if (normalized === '水稲') return '稲'
  if (normalized === '複合作物') return '野菜類'
  return normalized
}

function normalizeTargetIssue(suspectedPest) {
  const normalized = suspectedPest == null ? '' : String(suspectedPest).trim()
  if (!normalized || normalized === 'なし' || normalized === '—') return ''
  if (normalized.includes('病')) return normalized
  if (normalized.endsWith('類')) return normalized
  return `${normalized}類`
}

function inferIssueType(targetIssue) {
  if (!targetIssue) return ''
  if (targetIssue.includes('病')) return 'disease'
  return 'pest'
}

function findPesticideCandidates({ targetCrop, targetIssue, targetIssueType }) {
  if (!targetCrop || !targetIssue) return []
  return pesticideCatalog.filter(
    (item) =>
      item.target_crop === targetCrop &&
      item.target_issue === targetIssue &&
      item.target_issue_type === targetIssueType,
  )
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return ''
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, '').replace(/\.$/, '')
}

function getDosageUnit(candidate) {
  const ratio = String(candidate?.dilution_ratio ?? '')
  if (ratio.includes('粒')) return 'kg'
  return 'L'
}

function createCandidateSentence(candidate, fieldAreaHa) {
  const dosage = Number(candidate?.dosage_l_per_10a)
  const dosageText = Number.isFinite(dosage) ? `${candidate.dilution_ratio}、10aあたり${formatAmount(dosage)}${getDosageUnit(candidate)}` : `${candidate.dilution_ratio}`
  const amountText = Number.isFinite(dosage) && Number.isFinite(fieldAreaHa)
    ? `、必要量${formatAmount(dosage * fieldAreaHa * 10)}${getDosageUnit(candidate)}`
    : ''
  const noteText = candidate?.note ? `（${candidate.note}）` : ''

  return `・${candidate.product_name}：${dosageText}${amountText}${noteText}`
}

export function createLocalIssueRecommendationReply({ field }) {
  if (!field) {
    return '圃場データを読み込み中です。しばらく待ってからもう一度試してください。'
  }

  const targetCrop = normalizeTargetCrop(field.cropType)
  const targetIssue = normalizeTargetIssue(field.suspectedPest)
  const targetIssueType = inferIssueType(targetIssue)
  const pesticideCandidates = findPesticideCandidates({ targetCrop, targetIssue, targetIssueType })

  if (pesticideCandidates.length === 0) {
    return '候補を絞れませんでした。'
  }

  const candidateLines = pesticideCandidates
    .map((candidate) => createCandidateSentence(candidate, field.areaHa))
    .join('\n')

  return [
    `${targetIssue || '病害虫'}の候補農薬は以下の通りです。`,
    candidateLines,
  ].join('\n\n')
}

export function buildAgriContext({ field, question }) {
  const targetCrop = field ? normalizeTargetCrop(field.cropType) : ''
  const targetIssue = field ? normalizeTargetIssue(field.suspectedPest) : ''
  const targetIssueType = inferIssueType(targetIssue)
  const pesticideCandidates = findPesticideCandidates({ targetCrop, targetIssue, targetIssueType })

  return {
    schema_version: 'agri.v1',
    task_type: targetIssue ? 'issue_recommendation' : 'field_summary',
    target_crop: targetCrop,
    target_issue_type: targetIssueType,
    target_issue: targetIssue,
    // Backward compatibility for existing Dify flow that reads target_pest.
    target_pest: targetIssue,
    pesticide_candidates: pesticideCandidates,
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

  const targetCrop = normalizeTargetCrop(field.cropType)
  const targetIssue = normalizeTargetIssue(field.suspectedPest)
  const targetIssueType = inferIssueType(targetIssue)
  const pesticideCandidates = findPesticideCandidates({ targetCrop, targetIssue, targetIssueType })
  const summaryParagraph = `${field.name} を選択中です。面積は ${field.areaHa ?? '—'} ha、作物は ${formatCropType(field.cropType)}、土壌 pH は ${field.soilPh ?? '—'} です。前回の薬剤散布日は ${field.lastPesticideDate || '—'}、病害虫状況は ${formatPestPressure(field.pestPressureNote)} です。`
  const interpretationParagraph = question
    ? `ご質問「${question}」については、与えられた情報の範囲では、この圃場は ${field.name} の基本状態を確認する段階です。`
    : `この圃場は、基本状態の確認から入るのがよさそうです。`
  const issueParagraph =
    targetIssue
      ? `報告されている病害虫は ${targetIssue} です。`
      : '現時点で特定の病害虫報告はありません。'
  const pesticideParagraph =
    pesticideCandidates.length > 0
      ? `候補農薬は ${pesticideCandidates.map((item) => `${item.product_name}（目安: ${item.dilution_ratio}）`).join(' / ')} です。実散布前に最新ラベルと使用基準を確認してください。`
      : 'この入力だけでは対応農薬候補を特定できません。実散布前に最新ラベルと使用基準を確認してください。'
  return [summaryParagraph, interpretationParagraph, issueParagraph, pesticideParagraph].join('\n\n')
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

  const answerCandidates = [
    data?.answer,
    data?.data?.answer,
    data?.outputs?.text,
    data?.data?.outputs?.text,
    data?.output_text,
    data?.message,
  ]
  const answer = answerCandidates.find((value) => typeof value === 'string' && value.trim())?.trim() || ''

  if (!answer) {
    const taskId = data?.task_id ? ` (task_id: ${data.task_id})` : ''
    throw new Error(`Dify から空の応答が返りました${taskId}`)
  }

  return {
    answer,
    conversationId: data?.conversation_id ?? data?.conversationId ?? conversationId ?? null,
    raw: data,
  }
}
