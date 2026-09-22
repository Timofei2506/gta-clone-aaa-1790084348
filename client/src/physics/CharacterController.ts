/**
 * CharacterController.ts - Kinematic персонаж как в GTA 5
 */
import * as THREE from 'three'
import * as RAPIER from '@dimforge/rapier3d-compat'
import { PhysicsWorld } from './PhysicsWorld'

export class CharacterController {
  private body: RAPIER.RigidBody
  private collider: RAPIER.Collider
  private controller: RAPIER.KinematicCharacterController
  private rapier: typeof RAPIER

  public velocity = new THREE.Vector3()
  private isGrounded = false

  constructor(
    private physics: PhysicsWorld,
    startPos: THREE.Vector3
  ) {
    this.rapier = physics.getRAPIER()
    const world = physics.getWorld()

    const desc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(startPos.x, startPos.y, startPos.z)
    this.body = world.createRigidBody(desc)

    const colDesc = RAPIER.ColliderDesc.capsule(0.9, 0.4)
      .setFriction(0)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min)
    this.collider = world.createCollider(colDesc, this.body)

    this.controller = world.createCharacterController(0.01)
    this.controller.setApplyImpulsesToDynamicBodies(true)
    this.controller.setUp({ x:0, y:1, z:0 })
    this.controller.setMaxSlopeClimbAngle(Math.PI/4)
    this.controller.setMinSlopeSlideAngle(Math.PI/6)
    this.controller.enableAutostep(0.5, 0.3, true)
    this.controller.enableSnapToGround(0.5)
  }

  move(desiredTranslation: THREE.Vector3, delta: number) {
    const world = this.physics.getWorld()
    
    // Гравитация
    if (!this.isGrounded) {
      this.velocity.y -= 20 * delta
    }

    const move = new THREE.Vector3()
      .copy(desiredTranslation)
      .add(new THREE.Vector3(0, this.velocity.y * delta, 0))

    const rapierMove = { x: move.x, y: move.y, z: move.z }
    this.controller.computeColliderMovement(this.collider, rapierMove)

    const corrected = this.controller.computedMovement()
    const pos = this.body.translation()
    const newPos = {
      x: pos.x + corrected.x,
      y: pos.y + corrected.y,
      z: pos.z + corrected.z
    }
    this.body.setNextKinematicTranslation(newPos)

    this.isGrounded = this.controller.computedGrounded()

    if (this.isGrounded && this.velocity.y < 0) {
      this.velocity.y = 0
    }

    // Коллизии
    const collisions = this.controller.numComputedCollisions()
    for (let i=0; i<collisions; i++) {
      // Можно добавить звук шагов, эффекты
    }
  }

  jump(force = 8) {
    if (this.isGrounded) {
      this.velocity.y = force
      this.isGrounded = false
    }
  }

  getPosition() {
    const t = this.body.translation()
    return new THREE.Vector3(t.x, t.y, t.z)
  }

  setPosition(pos: THREE.Vector3) {
    this.body.setNextKinematicTranslation({ x:pos.x, y:pos.y, z:pos.z })
  }

  getGrounded() { return this.isGrounded }

  destroy() {
    this.physics.getWorld().removeRigidBody(this.body)
  }
}
