export function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch {
    return iso
  }
}

export function scannerClass(scanner) {
  const s = (scanner || '').toLowerCase()
  if (s === 'nessus')    return 'scanner-nessus'
  if (s === 'acunetix')  return 'scanner-acunetix'
  if (s === 'sonarqube') return 'scanner-sonarqube'
  return 'scanner-default'
}
