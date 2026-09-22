/**
 * PhysicsWorld.ts - Rapier физика, как Bullet в RAGE
 */
import * as RAPIER from '@dimforge/rapier3d-compat'

export class PhysicsWorld {
  private world!: RAPIER.World
  private gravity = { x: 0, y: -9.81 * 2, z: 0 } // x2 для GTA feel

  async init() {
    await RAPIER.init()
    this.world = new RAPIER.World(this.gravity)
    console.log('[Physics] Rapier initialized')
  }

  step(dt: number) {
    this.world.step()
  }

  getWorld() { return this.world }
  getRAPIER() { return RAPIER }

  createRigidBody(desc: RAPIER.RigidBodyDesc) {
    return this.world.createRigidBody(desc)
  }

  createCollider(desc: RAPIER.ColliderDesc, body?: RAPIER.RigidBody) {
    return this.world.createCollider(desc, body)
  }

  // Raycast для камеры, как в GTA 5 чтобы не проходить сквозь стены
  castRay(origin: any, direction: any, maxDist: number) {
    const ray = new RAPIER.Ray(origin, direction)
    return this.world.castRay(ray, maxDist, true)
  }
}
