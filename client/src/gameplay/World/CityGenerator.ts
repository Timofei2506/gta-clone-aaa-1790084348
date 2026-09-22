/**
 * CityGenerator.ts - Процедурный реалистичный город
 * Как в GTA 5, но процедурно, без ассетов Rockstar (чтобы не DMCA)
 */
import * as THREE from 'three'
import * as RAPIER from '@dimforge/rapier3d-compat'
import { PhysicsWorld } from '../../physics/PhysicsWorld'

interface CityOptions {
  size: number
  blockSize: number
  roadWidth: number
  maxBuildingHeight: number
  density: number
}

export class CityGenerator {
  private buildings: THREE.Mesh[] = []
  private colliders: RAPIER.Collider[] = []
  private roads: THREE.Mesh[] = []
  private streetLights: THREE.PointLight[] = []
  private spawnPoints: THREE.Vector3[] = []

  constructor(
    private scene: THREE.Scene,
    private physics: PhysicsWorld
  ) {}

  async generate(opts: CityOptions) {
    const half = opts.size / 2
    const blocksX = Math.floor(opts.size / opts.blockSize)
    const blocksZ = Math.floor(opts.size / opts.blockSize)

    // Земля
    const groundGeo = new THREE.PlaneGeometry(opts.size, opts.size)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI/2
    ground.receiveShadow = true
    this.scene.add(ground)

    // Физика земли
    const R = this.physics.getRAPIER()
    const world = this.physics.getWorld()
    const groundBodyDesc = R.RigidBodyDesc.fixed()
    const groundBody = world.createRigidBody(groundBodyDesc)
    const groundCol = R.ColliderDesc.cuboid(half, 0.5, half).setTranslation(0, -0.5, 0)
    world.createCollider(groundCol, groundBody)

    // Материалы зданий - PBR, реалистичные
    const buildingMats = [
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.5, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x3a2a2a, roughness: 0.7, metalness: 0.2 }),
    ]

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffffaa,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    })

    // Генерация блоков
    for (let bx = -blocksX/2; bx < blocksX/2; bx++) {
      for (let bz = -blocksZ/2; bz < blocksZ/2; bz++) {
        const blockCenterX = bx * opts.blockSize + opts.blockSize/2
        const blockCenterZ = bz * opts.blockSize + opts.blockSize/2

        // Дорога вокруг блока
        if (Math.abs(bx) < blocksX/2 && Math.abs(bz) < blocksZ/2) {
          const roadGeo = new THREE.PlaneGeometry(opts.blockSize, opts.roadWidth)
          const roadMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 })
          
          // Горизонтальная дорога
          const roadH = new THREE.Mesh(roadGeo, roadMat)
          roadH.rotation.x = -Math.PI/2
          roadH.position.set(blockCenterX, 0.01, blockCenterZ - opts.blockSize/2)
          roadH.receiveShadow = true
          this.scene.add(roadH)
          this.roads.push(roadH)

          // Вертикальная дорога
          const roadVGeo = new THREE.PlaneGeometry(opts.roadWidth, opts.blockSize)
          const roadV = new THREE.Mesh(roadVGeo, roadMat)
          roadV.rotation.x = -Math.PI/2
          roadV.position.set(blockCenterX - opts.blockSize/2, 0.01, blockCenterZ)
          roadV.receiveShadow = true
          this.scene.add(roadV)
          this.roads.push(roadV)

          // Спавн точки на дорогах
          if (Math.random() < 0.3) {
            this.spawnPoints.push(new THREE.Vector3(blockCenterX, 2, blockCenterZ))
          }
        }

        // Здания в блоке
        if (Math.random() > opts.density) continue

        const buildingsInBlock = 1 + Math.floor(Math.random() * 3)
        for (let i=0; i<buildingsInBlock; i++) {
          const w = 8 + Math.random() * 20
          const d = 8 + Math.random() * 20
          const h = 10 + Math.random() * opts.maxBuildingHeight

          const x = blockCenterX + (Math.random() - 0.5) * (opts.blockSize - w - opts.roadWidth)
          const z = blockCenterZ + (Math.random() - 0.5) * (opts.blockSize - d - opts.roadWidth)

          // Здание
          const geo = new THREE.BoxGeometry(w, h, d)
          const mat = buildingMats[Math.floor(Math.random() * buildingMats.length)].clone()
          
          const building = new THREE.Mesh(geo, mat)
          building.position.set(x, h/2, z)
          building.castShadow = true
          building.receiveShadow = true
          this.scene.add(building)
          this.buildings.push(building)

          // Физика здания
          const colDesc = R.ColliderDesc.cuboid(w/2, h/2, d/2).setTranslation(x, h/2, z)
          const col = world.createCollider(colDesc)
          this.colliders.push(col)

          // Окна - эмиссивные, как ночью в GTA
          if (Math.random() > 0.3) {
            const winCount = Math.floor(h / 4)
            for (let wy=0; wy<winCount; wy++) {
              if (Math.random() > 0.5) continue
              const winGeo = new THREE.PlaneGeometry(1.5, 1.5)
              const win = new THREE.Mesh(winGeo, windowMat)
              win.position.set(
                x + w/2 + 0.01,
                2 + wy*3 + Math.random(),
                z + (Math.random()-0.5)*d*0.8
              )
              win.rotation.y = Math.PI/2
              this.scene.add(win)
            }
          }

          // Крыша деталь
          const roofGeo = new THREE.BoxGeometry(w*0.8, 1, d*0.8)
          const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
          const roof = new THREE.Mesh(roofGeo, roofMat)
          roof.position.set(x, h+0.5, z)
          this.scene.add(roof)
        }
      }
    }

    // Уличное освещение
    for (let i=0; i<60; i++) {
      const x = (Math.random()-0.5)*opts.size
      const z = (Math.random()-0.5)*opts.size
      const light = new THREE.PointLight(0xffaa44, 2, 30, 2)
      light.position.set(x, 8, z)
      light.castShadow = false
      this.streetLights.push(light)
      
      // Столб
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 8)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.set(x, 4, z)
      this.scene.add(pole)
    }

    // Декорации - парки, деревья (простые)
    for (let i=0; i<40; i++) {
      const x = (Math.random()-0.5)*opts.size*0.8
      const z = (Math.random()-0.5)*opts.size*0.8
      const treeGroup = new THREE.Group()
      
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a })
      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.y = 2
      trunk.castShadow = true
      treeGroup.add(trunk)

      const leavesGeo = new THREE.SphereGeometry(2.5, 8, 8)
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.8 })
      const leaves = new THREE.Mesh(leavesGeo, leavesMat)
      leaves.position.y = 5
      leaves.castShadow = true
      treeGroup.add(leaves)

      treeGroup.position.set(x, 0, z)
      this.scene.add(treeGroup)
    }

    console.log(`[City] Generated ${this.buildings.length} buildings, ${this.roads.length} roads`)
  }

  getStreetLights() { return this.streetLights }
  
  getRandomSpawnPoint() {
    if (this.spawnPoints.length === 0) return new THREE.Vector3(0,5,0)
    return this.spawnPoints[Math.floor(Math.random()*this.spawnPoints.length)].clone()
  }

  setChunkVisible(cx: number, cz: number, visible: boolean) {
    // LOD логика - в будущем скрывать дальние здания
  }
}
