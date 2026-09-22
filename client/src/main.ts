/**
 * main.ts - Entry point, как в RAGE
 */
import { Engine } from './core/Engine'

async function boot() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const progress = document.getElementById('progress') as HTMLElement
  const loadingText = document.getElementById('loading-text') as HTMLElement
  const loading = document.getElementById('loading') as HTMLElement

  const engine = new Engine(canvas)
  ;(window as any).__renderer = engine.getRenderer()
  ;(window as any).__engine = engine

  const onProgress = (p:number, text:string) => {
    progress.style.width = `${p}%`
    loadingText.textContent = text
    console.log(`[Boot] ${p}% ${text}`)
  }

  try {
    await engine.init(onProgress)
    
    // Скрываем лоадинг
    loading.style.opacity = '0'
    setTimeout(() => loading.style.display = 'none', 500)

    engine.start()
    console.log('[Boot] Game started')

    // Клик для локка мыши - как в GTA
    canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock()
      }
    })

  } catch(e) {
    console.error('[Boot] Failed', e)
    loadingText.textContent = 'FAILED: ' + (e as Error).message
    loadingText.style.color = '#ff3b30'
  }
}

boot()
