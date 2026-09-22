/**
 * Renderer.ts - PBR рендерер как в RAGE
 */
import * as THREE from 'three'
import { Lighting } from './Lighting'
import { Time } from '../core/Time'

export class Renderer {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public webglRenderer: THREE.WebGLRenderer
  public lighting: Lighting

  constructor(private canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.0008)
    this.scene.background = new THREE.Color(0x0f0f1a)

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000)
    this.camera.position.set(0, 10, 20)

    this.webglRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.webglRenderer.setSize(window.innerWidth, window.innerHeight)
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.webglRenderer.shadowMap.enabled = true
    this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.webglRenderer.toneMapping = THREE.ACESFilmicToneMapping
    this.webglRenderer.toneMappingExposure = 1.2
    this.webglRenderer.outputColorSpace = THREE.SRGBColorSpace

    this.lighting = new Lighting(this.scene)

    window.addEventListener('resize', () => this.onResize())
  }

  render(delta: number, time: Time) {
    this.lighting.update(time, delta)
    this.webglRenderer.render(this.scene, this.camera)
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.webglRenderer.setSize(window.innerWidth, window.innerHeight)
  }
}
