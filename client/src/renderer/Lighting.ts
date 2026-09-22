/**
 * Lighting.ts - Realistic day/night, no spam logs
 */
import * as THREE from 'three'
import { Time } from '../core/Time'

export class Lighting {
  private sun: THREE.DirectionalLight
  private moon: THREE.DirectionalLight
  private ambient: THREE.AmbientLight
  private hemi: THREE.HemisphereLight

  constructor(private scene: THREE.Scene) {
    this.sun = new THREE.DirectionalLight(0xfff4e6, 2.8)
    this.sun.position.set(100, 200, 50)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.near = 0.5
    this.sun.shadow.camera.far = 1200
    this.sun.shadow.camera.left = -300
    this.sun.shadow.camera.right = 300
    this.sun.shadow.camera.top = 300
    this.sun.shadow.camera.bottom = -300
    this.sun.shadow.bias = -0.0003
    this.sun.shadow.normalBias = 0.05
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)

    this.moon = new THREE.DirectionalLight(0x8a8aff, 0.25)
    this.moon.position.set(-100, 100, -50)
    this.scene.add(this.moon)

    this.ambient = new THREE.AmbientLight(0x404060, 0.4)
    this.scene.add(this.ambient)

    this.hemi = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.5)
    this.scene.add(this.hemi)
  }

  update(time: Time, delta: number) {
    const sunAngle = time.sunAngle
    const sunHeight = Math.sin(sunAngle)
    const radius = 600
    
    this.sun.position.set(
      Math.cos(sunAngle) * radius,
      Math.sin(sunAngle) * radius,
      120
    )
    this.sun.target.position.set(0,0,0)
    this.sun.target.updateMatrixWorld()

    const dayFactor = Math.max(0, sunHeight)
    this.sun.intensity = dayFactor * 2.8
    this.sun.visible = dayFactor > 0.02
    this.moon.intensity = (1 - dayFactor) * 0.35
    this.moon.visible = dayFactor < 0.25

    if (this.scene.background instanceof THREE.Color) {
      if (time.isDay) {
        const t = dayFactor
        this.scene.background.setRGB(0.25 + t*0.2, 0.45 + t*0.3, 0.7 + t*0.3)
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.copy(this.scene.background)
          this.scene.fog.density = 0.0009
        }
      } else {
        this.scene.background.setRGB(0.02, 0.03, 0.12)
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.setRGB(0.02, 0.03, 0.12)
          this.scene.fog.density = 0.0014
        }
      }
    }

    this.hemi.intensity = 0.25 + dayFactor * 0.55
    this.ambient.intensity = 0.15 + dayFactor * 0.45
  }
}
