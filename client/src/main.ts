/**
 * main.ts - Clean boot, no spam
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
  }

  try {
    await engine.init(onProgress)
    loading.style.opacity = '0'
    setTimeout(() => loading.style.display = 'none', 400)
    engine.start()
    canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) canvas.requestPointerLock()
    })
  } catch(e) {
    loadingText.textContent = 'BOOT FAILED'
    console.error(e)
  }
}

boot()
