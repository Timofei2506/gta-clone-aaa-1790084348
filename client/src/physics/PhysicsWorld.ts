/**
 * PhysicsWorld.ts - Rapier физика, как Bullet в RAGE
 * FIX: deprecated init warning
 */
import * as RAPIER from '@dimforge/rapier3d-compat'

export class PhysicsWorld {
  private world!: RAPIER.World
  private gravity = { x: 0, y: -19.62, z: 0 }

  async init() {
    // FIX: new API expects object, not empty call
    // @ts-ignore
    await RAPIER.init({})
    this.world = new RAPIER.World(this.gravity)
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

  castRay(origin: any, direction: any, maxDist: number) {
    const ray = new RAPIER.Ray(origin, direction)
    return this.world.castRay(ray, maxDist, true)
  }
}
