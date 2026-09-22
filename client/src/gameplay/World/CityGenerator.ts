/**
 * CityGenerator.ts - v0.4 FIXED: no MAX_TEXTURE_IMAGE_UNITS overflow
 * FIX: 50 point lights with shadows = 50 shadow maps > 16 limit
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

  private createProceduralTexture(type: 'concrete' | 'brick' | 'asphalt' | 'windows', color: string) {
    const canvas = document.createElement('canvas')
    canvas.width = 128 // smaller for perf
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = color
    ctx.fillRect(0,0,128,128)
    
    if (type === 'concrete') {
      for (let i=0; i<200; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.08})`
        ctx.fillRect(Math.random()*128, Math.random()*128, 2, 2)
      }
    } else if (type === 'brick') {
      for (let y=0; y<128; y+=16) {
        for (let x=0; x<128; x+=32) {
          const offset = (y/16)%2===0 ? 0 : 16
          ctx.fillStyle = `hsl(${10+Math.random()*10}, 20%, ${25+Math.random()*10}%)`
          ctx.fillRect(x+offset+1, y+1, 30, 14)
        }
      }
    } else if (type === 'asphalt') {
      for (let i=0; i<400; i++) {
        ctx.fillStyle = `rgba(${100+Math.random()*40},${100+Math.random()*40},${100+Math.random()*40},0.2)`
        ctx.fillRect(Math.random()*128, Math.random()*128, 1, 1)
      }
    } else if (type === 'windows') {
      ctx.fillStyle = '#1a1a2a'
      ctx.fillRect(0,0,128,128)
      for (let y=4; y<128; y+=16) {
        for (let x=4; x<128; x+=12) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = Math.random() > 0.7 ? '#ffff88' : '#88aaff'
            ctx.globalAlpha = 0.8
            ctx.fillRect(x, y, 7, 10)
          }
        }
      }
      ctx.globalAlpha = 1
    }
    
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  async generate(opts: CityOptions) {
    const half = opts.size / 2
    const blocksX = Math.floor(opts.size / opts.blockSize)
    const blocksZ = Math.floor(opts.size / opts.blockSize)

    const asphaltTex = this.createProceduralTexture('asphalt', '#1a1a1a')
    asphaltTex.repeat.set(8,8)
    const concreteTex = this.createProceduralTexture('concrete', '#2a2a2a')
    concreteTex.repeat.set(1,1)
    const brickTex = this.createProceduralTexture('brick', '#3a2a2a')
    const windowTex = this.createProceduralTexture('windows', '#1a1a2a')
    windowTex.repeat.set(1,1)

    const groundGeo = new THREE.PlaneGeometry(opts.size, opts.size)
    const groundMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.95,
      metalness: 0.05
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI/2
    ground.receiveShadow = true
    this.scene.add(ground)

    const R = this.physics.getRAPIER()
    const world = this.physics.getWorld()
    const groundBodyDesc = R.RigidBodyDesc.fixed()
    const groundBody = world.createRigidBody(groundBodyDesc)
    const groundCol = R.ColliderDesc.cuboid(half, 0.5, half).setTranslation(0, -0.5, 0)
    world.createCollider(groundCol, groundBody)

    // FIX: Use single shared materials to reduce texture units
    const sharedConcreteMat = new THREE.MeshStandardMaterial({ 
      map: concreteTex, 
      color: 0xcccccc,
      roughness: 0.8, metalness: 0.1 
    })
    const sharedBrickMat = new THREE.MeshStandardMaterial({ 
      map: brickTex,
      roughness: 0.85, metalness: 0.05 
    })
    const sharedGlassMat = new THREE.MeshStandardMaterial({ 
      color: 0x4a5a6a, 
      roughness: 0.3, metalness: 0.6
    })
    const sharedDarkMat = new THREE.MeshStandardMaterial({ 
      color: 0x3a3a3a, 
      roughness: 0.7, metalness: 0.2 
    })

    const buildingMats = [sharedConcreteMat, sharedBrickMat, sharedGlassMat, sharedDarkMat]

    const windowMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      emissive: 0xffffaa,
      emissiveMap: windowTex,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    })

    const roadMat = new THREE.MeshStandardMaterial({ 
      map: asphaltTex,
      color: 0x222222,
      roughness: 0.9, metalness: 0.05 
    })

    for (let bx = -blocksX/2; bx < blocksX/2; bx++) {
      for (let bz = -blocksZ/2; bz < blocksZ/2; bz++) {
        const blockCenterX = bx * opts.blockSize + opts.blockSize/2
        const blockCenterZ = bz * opts.blockSize + opts.blockSize/2

        if (Math.abs(bx) < blocksX/2 && Math.abs(bz) < blocksZ/2) {
          const roadH = new THREE.Mesh(new THREE.PlaneGeometry(opts.blockSize, opts.roadWidth), roadMat)
          roadH.rotation.x = -Math.PI/2
          roadH.position.set(blockCenterX, 0.02, blockCenterZ - opts.blockSize/2)
          roadH.receiveShadow = true
          this.scene.add(roadH)
          this.roads.push(roadH)

          const lineGeo = new THREE.PlaneGeometry(opts.blockSize, 0.25)
          const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
          const line = new THREE.Mesh(lineGeo, lineMat)
          line.rotation.x = -Math.PI/2
          line.position.set(blockCenterX, 0.03, blockCenterZ - opts.blockSize/2)
          this.scene.add(line)

          const roadV = new THREE.Mesh(new THREE.PlaneGeometry(opts.roadWidth, opts.blockSize), roadMat)
          roadV.rotation.x = -Math.PI/2
          roadV.position.set(blockCenterX - opts.blockSize/2, 0.02, blockCenterZ)
          roadV.receiveShadow = true
          this.scene.add(roadV)
          this.roads.push(roadV)

          if (Math.random() < 0.35) {
            this.spawnPoints.push(new THREE.Vector3(blockCenterX, 2, blockCenterZ))
          }
        }

        if (Math.random() > opts.density) continue

        const buildingsInBlock = 1 + Math.floor(Math.random() * 2)
        for (let i=0; i<buildingsInBlock; i++) {
          const w = 12 + Math.random() * 18
          const d = 12 + Math.random() * 18
          const h = 15 + Math.random() * opts.maxBuildingHeight

          const x = blockCenterX + (Math.random() - 0.5) * (opts.blockSize - w - opts.roadWidth - 4)
          const z = blockCenterZ + (Math.random() - 0.5) * (opts.blockSize - d - opts.roadWidth - 4)

          const geo = new THREE.BoxGeometry(w, h, d)
          const mat = buildingMats[Math.floor(Math.random() * buildingMats.length)]
          const building = new THREE.Mesh(geo, mat)
          building.position.set(x, h/2, z)
          building.castShadow = true
          building.receiveShadow = true
          this.scene.add(building)
          this.buildings.push(building)

          const colDesc = R.ColliderDesc.cuboid(w/2, h/2, d/2).setTranslation(x, h/2, z)
          const col = world.createCollider(colDesc)
          this.colliders.push(col)

          if (h > 20 && Math.random() > 0.4) {
            const winGeo = new THREE.PlaneGeometry(w*0.8, h*0.7)
            const winMesh = new THREE.Mesh(winGeo, windowMat)
            winMesh.position.set(x, h/2, z + d/2 + 0.02)
            this.scene.add(winMesh)
          }

          const roofGeo = new THREE.BoxGeometry(w*0.85, 1.0, d*0.85)
          const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
          const roof = new THREE.Mesh(roofGeo, roofMat)
          roof.position.set(x, h+0.5, z)
          roof.castShadow = true
          this.scene.add(roof)
        }
      }
    }

    // FIX: No shadows for point lights - prevents MAX_TEXTURE_IMAGE_UNITS overflow
    // Only sun casts shadows now
    for (let i=0; i<30; i++) {
      const x = (Math.random()-0.5)*opts.size*0.9
      const z = (Math.random()-0.5)*opts.size*0.9
      const light = new THREE.PointLight(0xffaa44, 2.5, 30, 2)
      light.position.set(x, 8, z)
      light.castShadow = false // FIX: was true, caused 50 shadow maps > 16 limit
      this.streetLights.push(light)
      
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 8, 6)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.5 })
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.set(x, 4, z)
      pole.castShadow = true
      this.scene.add(pole)

      const lampGeo = new THREE.SphereGeometry(0.3, 6, 6)
      const lampMat = new THREE.MeshStandardMaterial({ 
        color: 0xffaa44, 
        emissive: 0xffaa44, 
        emissiveIntensity: 1.5 
      })
      const lamp = new THREE.Mesh(lampGeo, lampMat)
      lamp.position.set(x, 8.3, z)
      this.scene.add(lamp)
    }

    for (let i=0; i<30; i++) {
      const x = (Math.random()-0.5)*opts.size*0.85
      const z = (Math.random()-0.5)*opts.size*0.85
      if (Math.abs(x) < 50 && Math.abs(z) < 50) continue
      const treeGroup = new THREE.Group()
      
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 4, 6)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.y = 2
      trunk.castShadow = true
      treeGroup.add(trunk)

      const leavesGeo = new THREE.IcosahedronGeometry(2.2, 0)
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1e4a1e, roughness: 0.8 })
      const leaves = new THREE.Mesh(leavesGeo, leavesMat)
      leaves.position.y = 5
      leaves.castShadow = true
      treeGroup.add(leaves)

      treeGroup.position.set(x, 0, z)
      this.scene.add(treeGroup)
    }
  }

  getStreetLights() { return this.streetLights }
  getRandomSpawnPoint() {
    if (this.spawnPoints.length === 0) return new THREE.Vector3(0,5,0)
    return this.spawnPoints[Math.floor(Math.random()*this.spawnPoints.length)].clone()
  }
  setChunkVisible(cx: number, cz: number, visible: boolean) {}
}
