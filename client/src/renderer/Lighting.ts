/**
 * Lighting.ts - Реалистичное освещение, день/ночь
 */
import * as THREE from 'three'
import { Time } from '../core/Time'

export class Lighting {
  private sun: THREE.DirectionalLight
  private moon: THREE.DirectionalLight
  private ambient: THREE.AmbientLight
  private hemi: THREE.HemisphereLight

  constructor(private scene: THREE.Scene) {
    // Sun - главный источник, как в GTA 5
    this.sun = new THREE.DirectionalLight(0xfff5e6, 3.0)
    this.sun.position.set(100, 200, 50)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.near = 0.5
    this.sun.shadow.camera.far = 1000
    this.sun.shadow.camera.left = -200
    this.sun.shadow.camera.right = 200
    this.sun.shadow.camera.top = 200
    this.sun.shadow.camera.bottom = -200
    this.sun.shadow.bias = -0.0001
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)

    // Moon - слабый ночью
    this.moon = new THREE.DirectionalLight(0x8888ff, 0.3)
    this.moon.position.set(-100, 100, -50)
    this.scene.add(this.moon)

    // Ambient - заполняющий
    this.ambient = new THREE.AmbientLight(0x404060, 0.5)
    this.scene.add(this.ambient)

    // Hemisphere - небо/земля
    this.hemi = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.6)
    this.scene.add(this.hemi)
  }

  update(time: Time, delta: number) {
    const sunAngle = time.sunAngle
    const sunHeight = Math.sin(sunAngle)
    
    // Позиция солнца по кругу
    const radius = 500
    this.sun.position.set(
      Math.cos(sunAngle) * radius,
      Math.sin(sunAngle) * radius,
      100
    )
    this.sun.target.position.set(0,0,0)
    this.sun.target.updateMatrixWorld()

    // Интенсивность в зависимости от времени
    const dayFactor = Math.max(0, sunHeight)
    this.sun.intensity = dayFactor * 3.0
    this.sun.visible = dayFactor > 0.05

    this.moon.intensity = (1 - dayFactor) * 0.5
    this.moon.visible = dayFactor < 0.3

    // Цвет неба и тумана
    if (this.scene.background instanceof THREE.Color) {
      if (time.isDay) {
        // День - голубой
        const t = dayFactor
        this.scene.background.setRGB(
          0.1 + t * 0.3,
          0.15 + t * 0.5,
          0.3 + t * 0.4
        )
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.copy(this.scene.background)
          this.scene.fog.density = 0.0008
        }
      } else {
        // Ночь - темно-синий
        this.scene.background.setRGB(0.02, 0.02, 0.08)
        if (this.scene.fog instanceof THREE.FogExp2) {
          this.scene.fog.color.setRGB(0.02, 0.02, 0.08)
          this.scene.fog.density = 0.0015
        }
      }
    }

    this.hemi.intensity = 0.3 + dayFactor * 0.6
    this.ambient.intensity = 0.2 + dayFactor * 0.5
  }
}
