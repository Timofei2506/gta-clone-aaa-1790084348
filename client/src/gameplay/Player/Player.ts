/**
 * Player.ts - Игрок, как в GTA 5
 * Third person, капсула, анимации
 */
import * as THREE from 'three'
import { PhysicsWorld } from '../../physics/PhysicsWorld'
import { CharacterController } from '../../physics/CharacterController'
import { PlayerController } from './PlayerController'
import { AnimationController } from './AnimationController'

export type PlayerState = 'idle' | 'walk' | 'run' | 'jump' | 'fall'

export class Player {
  public mesh: THREE.Group
  private bodyMesh: THREE.Mesh
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
  private cameraDistance = 5
  private cameraPitch = 0.2
  private cameraYaw = 0
  private isRemote = false
  private remoteId: string | null = null

  // Для интерполяции удаленных игроков
  private networkTarget: any = null
  private lerpSpeed = 10

  constructor(
    startPos: THREE.Vector3,
    private physics: PhysicsWorld,
    isLocal: boolean
  ) {
    this.isRemote = !isLocal
    this.mesh = new THREE.Group()
    this.mesh.position.copy(startPos)

    // Тело - капсула, как в GTA 5 (пока без скина, потом Mixamo)
    const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.0, 8, 16)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isLocal ? 0x4a90e2 : 0xe24a4a,
      roughness: 0.6,
      metalness: 0.1
    })
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
    this.bodyMesh.position.y = 1.0
    this.bodyMesh.castShadow = true
    this.mesh.add(this.bodyMesh)

    // Голова
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 })
    this.headMesh = new THREE.Mesh(headGeo, headMat)
    this.headMesh.position.y = 1.8
    this.headMesh.castShadow = true
    this.mesh.add(this.headMesh)

    // Оружие / руки (заглушка)
    const armGeo = new THREE.CapsuleGeometry(0.12, 0.5, 4, 8)
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffdbac })
    const leftArm = new THREE.Mesh(armGeo, armMat)
    leftArm.position.set(-0.5, 1.0, 0)
    leftArm.rotation.z = -0.2
    this.mesh.add(leftArm)
    const rightArm = leftArm.clone()
    rightArm.position.set(0.5, 1.0, 0)
    rightArm.rotation.z = 0.2
    this.mesh.add(rightArm)

    if (!this.isRemote) {
      this.physicsController = new CharacterController(physics, startPos)
      this.controller = new PlayerController()
      this.animController = new AnimationController(this.bodyMesh, this.headMesh)
      
      // Мышь - камера
      window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement) {
          this.cameraYaw -= e.movementX * 0.003
          this.cameraPitch = THREE.MathUtils.clamp(
            this.cameraPitch - e.movementY * 0.003,
            -0.8, 0.8
          )
        }
      })

      // C - дистанция камеры
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyC') {
          this.cameraDistance = this.cameraDistance === 5 ? 2.5 : this.cameraDistance === 2.5 ? 8 : 5
        }
      })
    } else {
      // Удаленный - без физики, только интерполяция
      this.physicsController = null as any
      this.controller = null as any
      this.animController = new AnimationController(this.bodyMesh, this.headMesh)
    }

    this.position.copy(startPos)
  }

  attachCamera() {
    // Найдем камеру из сцены - костыль, но работает
    // В Engine она создается, тут просто запомним что мы локальный
    const interval = setInterval(() => {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      if ((window as any).__renderer) {
        this.camera = (window as any).__renderer.camera
        clearInterval(interval)
      }
    }, 100)
  }

  setRemoteId(id: string) { this.remoteId = id }

  setNetworkTarget(data: any) {
    this.networkTarget = data
  }

  fixedUpdate(dt: number) {
    if (this.isRemote) return

    const input = this.controller.getInput()
    const move = new THREE.Vector3()

    // Направление относительно камеры
    const forward = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraYaw)
    const right = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraYaw)
    forward.y = 0; forward.normalize()
    right.y = 0; right.normalize()

    if (input.move.length() > 0) {
      move.addScaledVector(forward, -input.move.y)
      move.addScaledVector(right, input.move.x)
      move.normalize()
      
      const speed = input.running ? 6 : 3
      move.multiplyScalar(speed * dt)
      
      // Поворот персонажа в сторону движения
      if (move.length() > 0.01) {
        const targetYaw = Math.atan2(move.x, move.z)
        this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, targetYaw, dt*10)
        this.mesh.rotation.y = this.rotation.y
      }

      this.state = input.running ? 'run' : 'walk'
    } else {
      this.state = 'idle'
    }

    // Прыжок
    if (input.jump) {
      this.physicsController.jump(8)
      this.state = 'jump'
    }

    if (!this.physicsController.getGrounded() && this.velocity.y < -1) {
      this.state = 'fall'
    }

    this.physicsController.move(move, dt)
    this.position.copy(this.physicsController.getPosition())
    this.mesh.position.copy(this.position)
    this.velocity.set(move.x/dt, this.physicsController['velocity'].y, move.z/dt)
  }

  update(delta: number, alpha: number) {
    if (this.isRemote && this.networkTarget) {
      // Интерполяция удаленного игрока - как в GTA Online
      const target = new THREE.Vector3(
        this.networkTarget.x,
        this.networkTarget.y,
        this.networkTarget.z
      )
      this.position.lerp(target, delta * this.lerpSpeed)
      this.mesh.position.lerp(target, delta * this.lerpSpeed)
      
      if (this.networkTarget.rotY !== undefined) {
        this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, this.networkTarget.rotY, delta*5)
        this.mesh.rotation.y = this.rotation.y
      }
      this.state = this.networkTarget.state || 'idle'
    }

    this.animController.update(delta, this.state, this.velocity)

    // Камера - GTA 5 style, за спиной, с коллизией
    if (!this.isRemote && this.camera) {
      const camOffset = new THREE.Vector3(
        Math.sin(this.cameraYaw) * this.cameraDistance,
        2 + Math.sin(this.cameraPitch) * this.cameraDistance,
        Math.cos(this.cameraYaw) * this.cameraDistance
      )
      
      // Raycast чтобы камера не заходила в стены (как в RAGE)
      const desiredPos = new THREE.Vector3().copy(this.position).add(camOffset)
      desiredPos.y += 1.5

      // Простая коллизия камеры - spherecast
      // TODO: использовать physics.castRay

      this.camera.position.lerp(desiredPos, delta*5)
      this.cameraTarget.copy(this.position)
      this.cameraTarget.y += 1.5
      this.camera.lookAt(this.cameraTarget)
    }

    // Обновление бара стамины
    if (!this.isRemote) {
      const staminaBar = document.getElementById('stamina-bar') as HTMLElement
      if (staminaBar) {
        const stamina = this.controller ? this.controller.getStamina() : 1
        staminaBar.style.width = `${stamina*100}%`
      }
    }
  }

  destroy() {
    if (this.physicsController) this.physicsController.destroy()
  }
}
