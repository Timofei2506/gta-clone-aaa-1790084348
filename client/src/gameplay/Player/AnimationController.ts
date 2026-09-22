/**
 * AnimationController.ts - Бленд анимаций, пока процедурно
 * Потом заменим на Mixamo + Three.js AnimationMixer
 */
import * as THREE from 'three'
import { PlayerState } from './Player'

export class AnimationController {
  private time = 0
  private bobPhase = 0

  constructor(
    private body: THREE.Mesh,
    private head: THREE.Mesh
  ) {}

  update(delta: number, state: PlayerState, velocity: THREE.Vector3) {
    this.time += delta

    const speed = velocity.length()

    switch(state) {
      case 'idle':
        // Дыхание
        this.body.position.y = 1.0 + Math.sin(this.time*2)*0.02
        this.body.rotation.z = Math.sin(this.time*0.5)*0.02
        this.bobPhase = 0
        break
      case 'walk':
        this.bobPhase += delta*6
        this.body.position.y = 1.0 + Math.abs(Math.sin(this.bobPhase))*0.08
        this.body.rotation.x = Math.sin(this.bobPhase)*0.1
        this.body.rotation.z = Math.sin(this.bobPhase*0.5)*0.05
        break
      case 'run':
        this.bobPhase += delta*10
        this.body.position.y = 1.0 + Math.abs(Math.sin(this.bobPhase))*0.12
        this.body.rotation.x = Math.sin(this.bobPhase)*0.2
        this.body.rotation.z = Math.sin(this.bobPhase*0.5)*0.1
        this.head.rotation.x = -0.1 + Math.sin(this.bobPhase)*0.05
        break
      case 'jump':
        this.body.position.y = 1.0 + 0.3
        this.body.rotation.x = -0.3
        break
      case 'fall':
        this.body.rotation.x = 0.3
        break
    }
  }
}
