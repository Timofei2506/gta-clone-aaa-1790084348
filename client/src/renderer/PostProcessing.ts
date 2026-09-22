/**
 * PostProcessing.ts - GTA 5 style post-processing
 * Bloom, vignette, color grading
 */
import * as THREE from 'three'

export class PostProcessing {
  private enabled = false // пока выключен для перфоманса, включим позже с EffectComposer
  private bloomStrength = 0.15

  constructor(private renderer: THREE.WebGLRenderer, private scene: THREE.Scene, private camera: THREE.Camera) {}

  render(delta: number) {
    // Пока без EffectComposer чтобы не тянуть зависимости
    // В v0.4 добавим: EffectComposer + UnrealBloomPass + SSAO
  }

  setBloom(strength: number) {
    this.bloomStrength = strength
  }
}
