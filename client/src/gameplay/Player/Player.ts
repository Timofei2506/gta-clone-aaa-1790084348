/**
 * Player.ts - FIXED: GTA 5 style controls, realistic model, smooth camera
 */
import * as THREE from 'three'
import { PhysicsWorld } from '../../physics/PhysicsWorld'
import { CharacterController } from '../../physics/CharacterController'
import { PlayerController } from './PlayerController'
import { AnimationController } from './AnimationController'

export type PlayerState = 'idle' | 'walk' | 'run' | 'jump' | 'fall'

export class Player {
  public mesh: THREE.Group
  private bodyMesh: THREE.Group
  private headMesh: THREE.Mesh
  
  private physicsController: CharacterController
  private controller: PlayerController
  private animController: AnimationController

  public position = new THREE.Vector3()
  public rotation = new THREE.Euler()
  public velocity = new THREE.Vector3()
  public state: PlayerState = 'idle'

  private camera: THREE.PerspectiveCamera | null = null
  private cameraTarget = new THREE.Vector3()
  private cameraDistance = 4.5
  private cameraPitch = 0.15
  private cameraYaw = 0
  private cameraOffsetX = 0.6 // shoulder offset как в GTA 5
  private isRemote = false
  private remoteId: string | null = null

  private networkTarget: any = null
  private lerpSpeed = 12

  // Для плавности движения
  private currentMoveSpeed = 0
  private targetMoveSpeed = 0
  private smoothVelocity = new THREE.Vector3()

  constructor(
    startPos: THREE.Vector3,
    private physics: PhysicsWorld,
    isLocal: boolean
  ) {
    this.isRemote = !isLocal
    this.mesh = new THREE.Group()
    this.mesh.position.copy(startPos)

    // === РЕАЛИСТИЧНАЯ МОДЕЛЬ ===
    this.bodyMesh = new THREE.Group()

    // Тело - бокс с закруглениями, PBR
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35)
    const torsoMat = new THREE.MeshStandardMaterial({
      color: isLocal ? 0x1a1a2a : 0x2a1a1a,
      roughness: 0.7,
      metalness: 0.1,
      emissive: isLocal ? 0x0a0a2a : 0x2a0a0a,
      emissiveIntensity: 0.1
    })
    const torso = new THREE.Mesh(torsoGeo, torsoMat)
    torso.position.y = 1.1
    torso.castShadow = true
    this.bodyMesh.add(torso)

    // Плечи
    const shoulderGeo = new THREE.BoxGeometry(0.9, 0.25, 0.4)
    const shoulder = new THREE.Mesh(shoulderGeo, torsoMat)
    shoulder.position.y = 1.4
    shoulder.castShadow = true
    this.bodyMesh.add(shoulder)

    // Голова - сфера с волосами
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16)
    const headMat = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac, 
      roughness: 0.4,
      metalness: 0
    })
    this.headMesh = new THREE.Mesh(headGeo, headMat)
    this.headMesh.position.y = 1.85
    this.headMesh.castShadow = true
    this.bodyMesh.add(this.headMesh)

    // Волосы
    const hairGeo = new THREE.SphereGeometry(0.30, 12, 12, 0, Math.PI*2, 0, Math.PI/2)
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.8 })
    const hair = new THREE.Mesh(hairGeo, hairMat)
    hair.position.y = 1.90
    hair.rotation.x = Math.PI
    this.bodyMesh.add(hair)

    // Руки
    const armGeo = new THREE.CapsuleGeometry(0.11, 0.55, 4, 8)
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 })
    const skinMat2 = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.7 })
    
    const leftArm = new THREE.Group()
    const leftUpper = new THREE.Mesh(armGeo, skinMat2)
    leftUpper.position.y = -0.2
    leftArm.add(leftUpper)
    const leftFore = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 4, 8), armMat)
    leftFore.position.y = -0.7
    leftArm.add(leftFore)
    leftArm.position.set(-0.55, 1.3, 0)
    leftArm.rotation.z = -0.15
    leftArm.rotation.x = 0.1
    this.bodyMesh.add(leftArm)

    const rightArm = leftArm.clone()
    rightArm.position.set(0.55, 1.3, 0)
    rightArm.rotation.z = 0.15
    rightArm.rotation.x = 0.1
    this.bodyMesh.add(rightArm)

    // Ноги
    const legGeo = new THREE.CapsuleGeometry(0.15, 0.7, 4, 8)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.8 })
    const leftLeg = new THREE.Mesh(legGeo, legMat)
    leftLeg.position.set(-0.18, 0.35, 0)
    leftLeg.castShadow = true
    this.bodyMesh.add(leftLeg)
    const rightLeg = new THREE.Mesh(legGeo, legMat)
    rightLeg.position.set(0.18, 0.35, 0)
    rightLeg.castShadow = true
    this.bodyMesh.add(rightLeg)

    // Обувь
    const shoeGeo = new THREE.BoxGeometry(0.22, 0.15, 0.35)
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat)
    leftShoe.position.set(-0.18, 0.05, 0.05)
    this.bodyMesh.add(leftShoe)
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat)
    rightShoe.position.set(0.18, 0.05, 0.05)
    this.bodyMesh.add(rightShoe)

    this.mesh.add(this.bodyMesh)

    if (!this.isRemote) {
      this.physicsController = new CharacterController(physics, startPos)
      this.controller = new PlayerController()
      this.animController = new AnimationController(this.bodyMesh, this.headMesh)
      
      window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement) {
          // GTA 5 sensitivity: 0.0025, сглаживание
          this.cameraYaw -= e.movementX * 0.0022
          this.cameraPitch = THREE.MathUtils.clamp(
            this.cameraPitch - e.movementY * 0.0022,
            -0.6, 0.85
          )
        }
      })

      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyC') {
          this.cameraDistance = this.cameraDistance === 4.5 ? 2.2 : this.cameraDistance === 2.2 ? 7 : 4.5
        }
        if (e.code === 'KeyV') {
          this.cameraOffsetX = this.cameraOffsetX === 0.6 ? -0.6 : 0.6
        }
      })
    } else {
      this.physicsController = null as any
      this.controller = null as any
      this.animController = new AnimationController(this.bodyMesh, this.headMesh)
    }

    this.position.copy(startPos)
  }

  attachCamera() {
    const interval = setInterval(() => {
      if ((window as any).__renderer) {
        this.camera = (window as any).__renderer.camera
        clearInterval(interval)
      }
    }, 100)
  }

  setRemoteId(id: string) { this.remoteId = id }
  setNetworkTarget(data: any) { this.networkTarget = data }

  fixedUpdate(dt: number) {
    if (this.isRemote) return

    const input = this.controller.getInput()
    const move = new THREE.Vector3()

    const forward = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraYaw)
    const right = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraYaw)
    forward.y = 0; forward.normalize()
    right.y = 0; right.normalize()

    if (input.move.length() > 0.02) {
      move.addScaledVector(forward, -input.move.y)
      move.addScaledVector(right, input.move.x)
      move.normalize()
      
      this.targetMoveSpeed = input.running ? 5.5 : 2.8
      const targetYaw = Math.atan2(move.x, move.z)
      // Плавный поворот как в GTA 5
      let deltaYaw = targetYaw - this.rotation.y
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI*2
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI*2
      this.rotation.y += deltaYaw * dt * 8
      this.mesh.rotation.y = this.rotation.y
      this.state = input.running ? 'run' : 'walk'
    } else {
      this.targetMoveSpeed = 0
      this.state = 'idle'
    }

    // Плавное ускорение/замедление
    this.currentMoveSpeed = THREE.MathUtils.lerp(this.currentMoveSpeed, this.targetMoveSpeed, dt * 6)
    move.multiplyScalar(this.currentMoveSpeed * dt)

    if (input.jump) {
      this.physicsController.jump(7.5)
      this.state = 'jump'
    }
    if (!this.physicsController.getGrounded() && this.velocity.y < -1) {
      this.state = 'fall'
    }

    this.physicsController.move(move, dt)
    this.position.copy(this.physicsController.getPosition())
    this.mesh.position.copy(this.position)
    this.smoothVelocity.lerp(new THREE.Vector3(move.x/dt, this.physicsController['velocity'].y, move.z/dt), dt*10)
    this.velocity.copy(this.smoothVelocity)
  }

  update(delta: number, alpha: number) {
    if (this.isRemote && this.networkTarget) {
      const target = new THREE.Vector3(this.networkTarget.x, this.networkTarget.y, this.networkTarget.z)
      this.position.lerp(target, delta * this.lerpSpeed)
      this.mesh.position.lerp(target, delta * this.lerpSpeed)
      if (this.networkTarget.rotY !== undefined) {
        let dy = this.networkTarget.rotY - this.rotation.y
        while (dy > Math.PI) dy -= Math.PI*2
        while (dy < -Math.PI) dy += Math.PI*2
        this.rotation.y += dy * delta * 5
        this.mesh.rotation.y = this.rotation.y
      }
      this.state = this.networkTarget.state || 'idle'
    }

    this.animController.update(delta, this.state, this.velocity)

    if (!this.isRemote && this.camera) {
      // GTA 5 camera with shoulder offset and collision
      const offset = new THREE.Vector3(
        Math.sin(this.cameraYaw) * this.cameraDistance + this.cameraOffsetX * Math.cos(this.cameraYaw),
        1.2 + Math.sin(this.cameraPitch) * this.cameraDistance,
        Math.cos(this.cameraYaw) * this.cameraDistance - this.cameraOffsetX * Math.sin(this.cameraYaw)
      )
      
      const desiredPos = new THREE.Vector3().copy(this.position).add(offset)
      desiredPos.y += 1.2

      // Camera collision - raycast to buildings
      const dir = new THREE.Vector3().subVectors(desiredPos, this.position).normalize()
      const dist = this.position.distanceTo(desiredPos)
      // Simple collision check - reduce distance if close to ground/building
      // TODO: use physics raycast

      this.camera.position.lerp(desiredPos, delta * 8)
      this.cameraTarget.copy(this.position)
      this.cameraTarget.y += 1.4
      this.cameraTarget.x += this.cameraOffsetX * 0.3
      this.camera.lookAt(this.cameraTarget)
    }

    if (!this.isRemote) {
      const staminaBar = document.getElementById('stamina-bar') as HTMLElement
      if (staminaBar) {
        staminaBar.style.width = `${this.controller.getStamina()*100}%`
      }
    }
  }

  destroy() {
    if (this.physicsController) this.physicsController.destroy()
  }
}
