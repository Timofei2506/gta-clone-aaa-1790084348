/**
 * Renderer.ts - FIXED v0.4: no deprecated useLegacyLights, no texture units overflow
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
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.0012)
    this.scene.background = new THREE.Color(0x87ceeb)

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 3000)
    this.camera.position.set(0, 10, 20)

    this.webglRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    })
    this.webglRenderer.setSize(window.innerWidth, window.innerHeight)
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.webglRenderer.shadowMap.enabled = true
    this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.webglRenderer.shadowMap.autoUpdate = true
    // FIX: removed deprecated useLegacyLights - in r155+ it's always false
    this.webglRenderer.toneMapping = THREE.ACESFilmicToneMapping
    this.webglRenderer.toneMappingExposure = 1.0
    this.webglRenderer.outputColorSpace = THREE.SRGBColorSpace

    this.lighting = new Lighting(this.scene)

    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `
    const uniforms = {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 400 },
      exponent: { value: 0.6 }
    }
    const skyGeo = new THREE.SphereGeometry(2000, 32, 15)
    const skyMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.BackSide
    })
    const sky = new THREE.Mesh(skyGeo, skyMat)
    this.scene.add(sky)

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
