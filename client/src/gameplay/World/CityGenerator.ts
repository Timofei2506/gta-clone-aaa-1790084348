/**
 * CityGenerator.ts - FIXED: realistic PBR textures, better models
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
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = color
    ctx.fillRect(0,0,256,256)
    
    if (type === 'concrete') {
      for (let i=0; i<400; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.08})`
        ctx.fillRect(Math.random()*256, Math.random()*256, Math.random()*4+1, Math.random()*4+1)
      }
    } else if (type === 'brick') {
      ctx.fillStyle = '#3a2a2a'
      for (let y=0; y<256; y+=32) {
        for (let x=0; x<256; x+=64) {
          const offset = (y/32)%2===0 ? 0 : 32
          ctx.fillStyle = `hsl(${10+Math.random()*10}, 20%, ${25+Math.random()*10}%)`
          ctx.fillRect(x+offset+2, y+2, 60, 28)
        }
      }
    } else if (type === 'asphalt') {
      for (let i=0; i<800; i++) {
        ctx.fillStyle = `rgba(${100+Math.random()*40},${100+Math.random()*40},${100+Math.random()*40},0.3)`
        ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2)
      }
    } else if (type === 'windows') {
      ctx.fillStyle = '#1a1a2a'
      ctx.fillRect(0,0,256,256)
      for (let y=8; y<256; y+=32) {
        for (let x=8; x<256; x+=24) {
          if (Math.random() > 0.3) {
            ctx.fillStyle = Math.random() > 0.7 ? '#ffff88' : '#88aaff'
            ctx.globalAlpha = 0.8 + Math.random()*0.2
            ctx.fillRect(x, y, 14, 20)
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

    // Textures
    const asphaltTex = this.createProceduralTexture('asphalt', '#1a1a1a')
    asphaltTex.repeat.set(10,10)
    const concreteTex = this.createProceduralTexture('concrete', '#2a2a2a')
    concreteTex.repeat.set(2,2)
    const brickTex = this.createProceduralTexture('brick', '#3a2a2a')
    const windowTex = this.createProceduralTexture('windows', '#1a1a2a')
    windowTex.repeat.set(1,2)

    // Ground - asphalt + concrete mix
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

    // Building materials - PBR with textures
    const buildingMats = [
      new THREE.MeshStandardMaterial({ 
        map: concreteTex, 
        color: 0xcccccc,
        roughness: 0.8, metalness: 0.1 
      }),
      new THREE.MeshStandardMaterial({ 
        map: brickTex,
        roughness: 0.85, metalness: 0.05 
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x4a5a6a, 
        roughness: 0.3, metalness: 0.6,
        envMapIntensity: 0.5
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x3a3a3a, 
        roughness: 0.7, metalness: 0.2 
      }),
    ]

    const windowMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      emissive: 0xffffaa,
      emissiveMap: windowTex,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9
    })

    // Roads with markings
    const roadMat = new THREE.MeshStandardMaterial({ 
      map: asphaltTex,
      color: 0x222222,
      roughness: 0.9, metalness: 0.1 
    })

    for (let bx = -blocksX/2; bx < blocksX/2; bx++) {
      for (let bz = -blocksZ/2; bz < blocksZ/2; bz++) {
        const blockCenterX = bx * opts.blockSize + opts.blockSize/2
        const blockCenterZ = bz * opts.blockSize + opts.blockSize/2

        if (Math.abs(bx) < blocksX/2 && Math.abs(bz) < blocksZ/2) {
          // Road
          const roadH = new THREE.Mesh(new THREE.PlaneGeometry(opts.blockSize, opts.roadWidth), roadMat)
          roadH.rotation.x = -Math.PI/2
          roadH.position.set(blockCenterX, 0.02, blockCenterZ - opts.blockSize/2)
          roadH.receiveShadow = true
          this.scene.add(roadH)
          this.roads.push(roadH)

          // White line
          const lineGeo = new THREE.PlaneGeometry(opts.blockSize, 0.3)
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

          // Building with windows texture on sides
          const geo = new THREE.BoxGeometry(w, h, d)
          const mat = buildingMats[Math.floor(Math.random() * buildingMats.length)].clone()
          const building = new THREE.Mesh(geo, mat)
          building.position.set(x, h/2, z)
          building.castShadow = true
          building.receiveShadow = true
          this.scene.add(building)
          this.buildings.push(building)

          const colDesc = R.ColliderDesc.cuboid(w/2, h/2, d/2).setTranslation(x, h/2, z)
          const col = world.createCollider(colDesc)
          this.colliders.push(col)

          // Windows - separate planes for realism
          if (h > 20 && Math.random() > 0.2) {
            const sides = [
              { pos: [x + w/2 + 0.02, 0, 0], rot: Math.PI/2, size: [d, h] },
              { pos: [x - w/2 - 0.02, 0, 0], rot: -Math.PI/2, size: [d, h] },
              { pos: [0, 0, z + d/2 + 0.02], rot: 0, size: [w, h] },
              { pos: [0, 0, z - d/2 - 0.02], rot: Math.PI, size: [w, h] },
            ]
            // Only 1-2 sides to save perf
            const side = sides[Math.floor(Math.random()*sides.length)]
            const winGeo = new THREE.PlaneGeometry(side.size[0]*0.9, side.size[1]*0.85)
            const winMesh = new THREE.Mesh(winGeo, windowMat)
            winMesh.position.set(x + (side.pos[0]-x), h/2, z + (side.pos[2]-z))
            if (side.rot !== 0) winMesh.rotation.y = side.rot
            this.scene.add(winMesh)
          }

          // Roof details
          const roofGeo = new THREE.BoxGeometry(w*0.85, 1.2, d*0.85)
          const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
          const roof = new THREE.Mesh(roofGeo, roofMat)
          roof.position.set(x, h+0.6, z)
          roof.castShadow = true
          this.scene.add(roof)

          // AC units on roof
          if (Math.random() > 0.5) {
            const acGeo = new THREE.BoxGeometry(2, 1.5, 2)
            const acMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 })
            const ac = new THREE.Mesh(acGeo, acMat)
            ac.position.set(x + (Math.random()-0.5)*w*0.5, h+1.5, z + (Math.random()-0.5)*d*0.5)
            this.scene.add(ac)
          }
        }
      }
    }

    // Street lights with better model
    for (let i=0; i<50; i++) {
      const x = (Math.random()-0.5)*opts.size*0.9
      const z = (Math.random()-0.5)*opts.size*0.9
      const light = new THREE.PointLight(0xffaa44, 3, 35, 2)
      light.position.set(x, 8.5, z)
      light.castShadow = true
      light.shadow.mapSize.set(512,512)
      this.streetLights.push(light)
      
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 9, 8)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.2 })
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.set(x, 4.5, z)
      pole.castShadow = true
      this.scene.add(pole)

      const lampGeo = new THREE.SphereGeometry(0.4, 8, 8)
      const lampMat = new THREE.MeshStandardMaterial({ 
        color: 0xffaa44, 
        emissive: 0xffaa44, 
        emissiveIntensity: 2 
      })
      const lamp = new THREE.Mesh(lampGeo, lampMat)
      lamp.position.set(x, 9, z)
      this.scene.add(lamp)
    }

    // Trees with better model
    for (let i=0; i<50; i++) {
      const x = (Math.random()-0.5)*opts.size*0.85
      const z = (Math.random()-0.5)*opts.size*0.85
      if (Math.abs(x) < 50 && Math.abs(z) < 50) continue
      const treeGroup = new THREE.Group()
      
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 5, 8)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.y = 2.5
      trunk.castShadow = true
      treeGroup.add(trunk)

      const leavesGeo = new THREE.IcosahedronGeometry(2.8, 0)
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1e4a1e, roughness: 0.8 })
      const leaves = new THREE.Mesh(leavesGeo, leavesMat)
      leaves.position.y = 6
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
