const state = {
  bands: [
    { name: 'sm', min: 640 },
    { name: 'md', min: 768 },
    { name: 'lg', min: 1024 },
    { name: 'xl', min: 1280 },
    { name: '2xl', min: 1536 },
  ],
}

const elements = {
  innerWidth: document.getElementById('innerWidth'),
  clientWidth: document.getElementById('clientWidth'),
  innerHeight: document.getElementById('innerHeight'),
  dpr: document.getElementById('dpr'),
  statusText: document.getElementById('statusText'),
  rulerFill: document.getElementById('rulerFill'),
  rulerMarker: document.getElementById('rulerMarker'),
  bands: Array.from(document.querySelectorAll('.band')),
}

function currentBand(width) {
  return [...state.bands].reverse().find((band) => width >= band.min)?.name ?? 'base'
}

function update() {
  const width = window.innerWidth
  const height = window.innerHeight
  const clientWidth = document.documentElement.clientWidth
  const dpr = window.devicePixelRatio || 1
  const band = currentBand(width)

  elements.innerWidth.textContent = `${width}px`
  elements.clientWidth.textContent = `${clientWidth}px`
  elements.innerHeight.textContent = `${height}px`
  elements.dpr.textContent = dpr.toFixed(2)
  elements.statusText.textContent = `現在は ${band} 帯です。`

  elements.bands.forEach((element) => {
    element.classList.toggle('active', element.dataset.band === band)
  })

  const maxVisible = 1600
  const clampedWidth = Math.min(width, maxVisible)
  const percent = (clampedWidth / maxVisible) * 100
  elements.rulerFill.style.width = `${percent}%`
  elements.rulerMarker.style.left = `${percent}%`
}

const style = document.createElement('style')
style.textContent = `
  :root {
    color-scheme: light;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
    color: #0f172a;
  }
  * {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    min-height: 100%;
  }
  body {
    padding: 24px;
  }
  .shell {
    display: grid;
    gap: 16px;
    max-width: 960px;
    margin: 0 auto;
  }
  .panel {
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.76);
    box-shadow: 0 16px 60px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(16px);
  }
  .hero {
    padding: 24px;
  }
  .eyebrow, .label {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #64748b;
  }
  h1 {
    margin: 12px 0 0;
    font-size: clamp(28px, 4vw, 44px);
    line-height: 1.05;
    letter-spacing: -0.04em;
  }
  .lead {
    margin: 12px 0 0;
    max-width: 64ch;
    font-size: 15px;
    line-height: 1.8;
    color: #475569;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 16px;
  }
  .metric {
    border-radius: 18px;
    background: #fff;
    border: 1px solid rgba(148, 163, 184, 0.22);
    padding: 16px;
    min-height: 96px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .metric strong {
    font-size: 28px;
    letter-spacing: -0.04em;
  }
  .bands {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    padding: 16px;
  }
  .band {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: #f8fafc;
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #475569;
    transition: 160ms ease;
  }
  .band.active {
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.18), rgba(14, 165, 233, 0.22));
    border-color: rgba(14, 165, 233, 0.55);
    color: #0f172a;
    font-weight: 700;
  }
  .ruler {
    padding: 18px 16px 16px;
  }
  .ruler-track {
    position: relative;
    height: 18px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }
  .ruler-fill {
    height: 100%;
    background: linear-gradient(90deg, #67e8f9, #38bdf8, #818cf8);
    width: 0%;
  }
  .ruler-marker {
    position: absolute;
    top: -8px;
    width: 2px;
    height: 34px;
    background: #0f172a;
    transform: translateX(-1px);
  }
  .ruler-labels {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #64748b;
  }
  .status {
    padding: 18px 20px;
  }
  .status p:last-child {
    margin: 8px 0 0;
    font-size: 18px;
    line-height: 1.7;
  }
  @media (max-width: 900px) {
    .metrics,
    .bands {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 640px) {
    body {
      padding: 12px;
    }
    .hero {
      padding: 18px;
    }
    .metrics,
    .bands {
      grid-template-columns: 1fr;
    }
  }
`
document.head.appendChild(style)

window.addEventListener('resize', update)
update()
