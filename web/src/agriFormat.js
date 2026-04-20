const cropTypeLabels = {
  mixed_crop: '複合作物',
  rice: '水稲',
  vegetable: '野菜',
  fruit: '果樹',
}

const fieldTypeLabels = {
  managed_field: '管理圃場',
}

const rotationStatusLabels = {
  current: '現行',
  fallow: '休耕',
  rotation: '輪作中',
}

const pestPressureLabels = {
  'none observed': '確認なし',
  low: '低',
  medium: '中',
  high: '高',
}

const managementNoteLabels = {
  'routine management': '通常管理',
}

function toLabel(value, labels) {
  if (value == null || value === '') return '—'
  return labels[value] ?? value
}

export function formatCropType(value) {
  return toLabel(value, cropTypeLabels)
}

export function formatFieldType(value) {
  return toLabel(value, fieldTypeLabels)
}

export function formatRotationStatus(value) {
  return toLabel(value, rotationStatusLabels)
}

export function formatPestPressure(value) {
  return toLabel(value, pestPressureLabels)
}

export function formatManagementNote(value) {
  return toLabel(value, managementNoteLabels)
}
