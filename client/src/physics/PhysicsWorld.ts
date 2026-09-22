/**
 * PhysicsWorld.ts - FIXED v0.4: no deprecated init warning
 */
import * as RAPIER from '@dimforge/rapier3d-compat'

export class PhysicsWorld {
  private world!: RAPIER.World
  private gravity = { x: 0, y: -19.62, z: 0 }

  async init() {
    // FIX: Rapier 0.15+ compat - init() with no args is the new way
    // Passing {} was still triggering "deprecated parameters" in some builds
    // @ts-ignore
    if (typeof RAPIER.init === 'function') {
      try {
        // Try new API first - no args
        await (RAPIER as any).init()
      } catch {
        // Fallback to old compat
        await (RAPIER as any).init({})
      }
    }
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
