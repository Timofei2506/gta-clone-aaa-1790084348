/**
 * Vehicle.ts - Simple drivable car, Raycast Vehicle style
 * MVP for v0.3
 */
import * as THREE from 'three'
import * as RAPIER from '@dimforge/rapier3d-compat'
import { PhysicsWorld } from '../../physics/PhysicsWorld'

export class Vehicle {
  public mesh: THREE.Group
  private body: RAPIER.RigidBody
  private collider: RAPIER.Collider
  private wheels: THREE.Mesh[] = []
  
  private speed = 0
  private maxSpeed = 18
  private acceleration = 8
  private brake = 12
  private steerAngle = 0
  private maxSteer = 0.6

  public isOccupied = false

  constructor(
    pos: THREE.Vector3,
    private physics: PhysicsWorld
  ) {
    this.mesh = new THREE.Group()
    this.mesh.position.copy(pos)

    // Car body - low poly GTA style
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.9, 4.2)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
      roughness: 0.3,
      metalness: 0.4
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.9
    body.castShadow = true
    body.receiveShadow = true
    this.mesh.add(body)

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2)
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 })
    const cabin = new THREE.Mesh(cabinGeo, cabinMat)
    cabin.position.set(0, 1.5, -0.2)
    cabin.castShadow = true
    this.mesh.add(cabin)

    // Windows - emissive at night
    const winGeo = new THREE.BoxGeometry(1.7, 0.6, 2.0)
    const winMat = new THREE.MeshStandardMaterial({ 
      color: 0x88ccff, 
      roughness: 0.1, 
      metalness: 0.9,
      transparent: true,
      opacity: 0.6
    })
    const windows = new THREE.Mesh(winGeo, winMat)
    windows.position.set(0, 1.5, -0.2)
    this.mesh.add(windows)

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
    const positions = [
      [-1.1, 0.45, 1.4],
      [1.1, 0.45, 1.4],
      [-1.1, 0.45, -1.4],
      [1.1, 0.45, -1.4],
    ]
    positions.forEach(p => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.rotation.z = Math.PI/2
      wheel.position.set(p[0], p[1], p[2])
      wheel.castShadow = true
      this.mesh.add(wheel)
      this.wheels.push(wheel)
    })

    // Lights
    const headLightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1)
    const headLightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 2 })
    const hl1 = new THREE.Mesh(headLightGeo, headLightMat)
    hl1.position.set(-0.6, 0.8, 2.11)
    this.mesh.add(hl1)
    const hl2 = hl1.clone()
    hl2.position.set(0.6, 0.8, 2.11)
    this.mesh.add(hl2)

    // Physics - dynamic rigidbody
    const R = physics.getRAPIER()
    const world = physics.getWorld()
    const desc = R.RigidBodyDesc.dynamic()
      .setTranslation(pos.x, pos.y, pos.z)
      .setLinearDamping(0.5)
      .setAngularDamping(0.8)
    this.body = world.createRigidBody(desc)
    const colDesc = R.ColliderDesc.cuboid(1.0, 0.7, 2.1)
      .setMass(800)
      .setFriction(0.8)
    this.collider = world.createCollider(colDesc, this.body)
  }

  update(delta: number, input: { forward: number, steer: number, brake: boolean }) {
    if (!this.isOccupied) {
      // Sync mesh to physics when not occupied (for collisions)
      const t = this.body.translation()
      this.mesh.position.set(t.x, t.y, t.z)
      const r = this.body.rotation()
      this.mesh.quaternion.set(r.x, r.y, r.z, r.w)
      return
    }

    // Simple arcade handling like GTA 3
    const targetSpeed = input.forward * this.maxSpeed
    const speedDiff = targetSpeed - this.speed
    this.speed += speedDiff * delta * (input.forward !== 0 ? this.acceleration : this.brake) * 0.3

    if (input.brake) {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 4)
    }

    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, input.steer * this.maxSteer, delta * 5)

    // Apply movement
    const forward = new THREE.Vector3(0,0,1).applyQuaternion(this.mesh.quaternion)
    const move = forward.multiplyScalar(this.speed * delta)
    
    const pos = this.body.translation()
    this.body.setNextKinematicTranslation ? null : null // dynamic so use forces
    // For dynamic, set linvel
    this.body.setLinvel({ x: move.x / delta, y: this.body.linvel().y, z: move.z / delta }, true)
    
    // Steering - rotate body
    if (Math.abs(this.speed) > 0.5) {
      const rot = this.body.rotation()
      const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
      const yaw = this.steerAngle * (this.speed / this.maxSpeed) * delta * 2
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yaw)
      q.multiply(deltaQ)
      this.body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true)
    }

    // Wheel rotation
    this.wheels.forEach((w, i) => {
      w.rotation.x += this.speed * delta * 2
      if (i < 2) { // front steer
        w.rotation.y = this.steerAngle
      }
    })

    const t = this.body.translation()
    this.mesh.position.set(t.x, t.y, t.z)
    const r = this.body.rotation()
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w)
  }

  getEnterPosition() {
    return new THREE.Vector3().copy(this.mesh.position).add(new THREE.Vector3(2.5, 0, 0))
  }

  destroy() {
    this.physics.getWorld().removeRigidBody(this.body)
  }
}
