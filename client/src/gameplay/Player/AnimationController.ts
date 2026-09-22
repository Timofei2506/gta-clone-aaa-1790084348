/**
 * AnimationController.ts - GTA 5 style procedural animation
 */
import * as THREE from 'three'
import { PlayerState } from './Player'

export class AnimationController {
  private time = 0
  private bobPhase = 0
  private leftLeg: THREE.Object3D | null = null
  private rightLeg: THREE.Object3D | null = null

  constructor(
    private body: THREE.Group,
    private head: THREE.Mesh
  ) {
    // Find legs for animation
    this.body.traverse((obj) => {
      // legs are at index, we approximate by position
      if (obj instanceof THREE.Mesh && obj.position.y < 0.6) {
        if (obj.position.x < 0 && !this.leftLeg) this.leftLeg = obj
        if (obj.position.x > 0 && !this.rightLeg) this.rightLeg = obj
      }
    })
  }

  update(delta: number, state: PlayerState, velocity: THREE.Vector3) {
    this.time += delta
    const speed = velocity.length()

    switch(state) {
      case 'idle':
        this.body.position.y = THREE.MathUtils.lerp(this.body.position.y, 0, delta*5)
        this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, 0, delta*5)
        this.body.rotation.z = Math.sin(this.time*0.6)*0.015
        this.bobPhase *= 0.9
        break
      case 'walk':
        this.bobPhase += delta*5.5
        this.body.position.y = Math.abs(Math.sin(this.bobPhase))*0.06
        this.body.rotation.x = Math.sin(this.bobPhase)*0.08
        this.body.rotation.z = Math.sin(this.bobPhase*0.5)*0.04
        break
      case 'run':
        this.bobPhase += delta*9
        this.body.position.y = Math.abs(Math.sin(this.bobPhase))*0.11
        this.body.rotation.x = Math.sin(this.bobPhase)*0.18
        this.body.rotation.z = Math.sin(this.bobPhase*0.5)*0.08
        this.head.rotation.x = -0.08 + Math.sin(this.bobPhase)*0.04
        break
      case 'jump':
        this.body.position.y = THREE.MathUtils.lerp(this.body.position.y, 0.25, delta*10)
        this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, -0.25, delta*10)
        break
      case 'fall':
        this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, 0.25, delta*8)
        break
    }
  }
}
