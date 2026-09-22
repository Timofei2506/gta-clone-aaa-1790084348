/**
 * World.ts - v0.3 with vehicles, minimap, better streaming
 */
import * as THREE from 'three'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { CityGenerator } from '../gameplay/World/CityGenerator'
import { Player } from '../gameplay/Player/Player'
import { NetworkClient } from '../gameplay/Multiplayer/NetworkClient'
import { Streaming } from './Streaming'
import { Minimap } from '../gameplay/World/Minimap'
import { Vehicle } from '../gameplay/Vehicle/Vehicle'

export class World {
  private cityGen: CityGenerator
  private streaming: Streaming
  private network: NetworkClient
  private minimap: Minimap
  private vehicles: Vehicle[] = []
  
  public localPlayer: Player | null = null
  public remotePlayers: Map<string, Player> = new Map()
  private buildingsRef: any[] = []
  
  constructor(
    private scene: THREE.Scene,
    private physics: PhysicsWorld
  ) {
    this.cityGen = new CityGenerator(scene, physics)
    this.streaming = new Streaming(this.cityGen)
    this.network = new NetworkClient()
    this.minimap = new Minimap()
  }

  async init() {
    await this.cityGen.generate({
      size: 2000,
      blockSize: 100,
      roadWidth: 14,
      maxBuildingHeight: 90,
      density: 0.88
    })
    
    const streetLights = this.cityGen.getStreetLights()
    streetLights.forEach(l => this.scene.add(l))
    
    // @ts-ignore access private for minimap
    this.buildingsRef = (this.cityGen as any).buildings || []

    // Spawn vehicles - 15 cars around city
    for (let i=0; i<15; i++) {
      const spawn = this.cityGen.getRandomSpawnPoint()
      spawn.x += (Math.random()-0.5)*100
      spawn.z += (Math.random()-0.5)*100
      const car = new Vehicle(spawn, this.physics)
      this.vehicles.push(car)
      this.scene.add(car.mesh)
    }
  }

  async spawnLocalPlayer() {
    const spawn = this.cityGen.getRandomSpawnPoint()
    this.localPlayer = new Player(spawn, this.physics, true)
    this.scene.add(this.localPlayer.mesh)
    this.localPlayer.attachCamera()

    // F to enter vehicle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF') this.tryEnterVehicle()
    })
  }

  private tryEnterVehicle() {
    if (!this.localPlayer) return
    let closest: Vehicle | null = null
    let dist = 4
    this.vehicles.forEach(v => {
      const d = v.mesh.position.distanceTo(this.localPlayer!.position)
      if (d < dist) {
        dist = d
        closest = v
      }
    })
    if (closest) {
      (closest as Vehicle).isOccupied = !(closest as Vehicle).isOccupied
      const el = document.getElementById('player-list')
      if (el) el.innerHTML = (closest as Vehicle).isOccupied ? 'IN VEHICLE - WASD to drive, F to exit' : 'ON FOOT'
    }
  }

  async initMultiplayer() {
    await this.network.connect()
    
    this.network.onPlayerJoin = (id, data) => {
      if (id === this.network.localId) return
      const p = new Player(new THREE.Vector3(data.x, data.y, data.z), this.physics, false)
      p.setRemoteId(id)
      this.remotePlayers.set(id, p)
      this.scene.add(p.mesh)
      this.updatePlayerList()
    }

    this.network.onPlayerLeave = (id) => {
      const p = this.remotePlayers.get(id)
      if (p) {
        this.scene.remove(p.mesh)
        p.destroy()
        this.remotePlayers.delete(id)
        this.updatePlayerList()
      }
    }

    this.network.onPlayerUpdate = (id, data) => {
      if (id === this.network.localId) return
      const p = this.remotePlayers.get(id)
      if (p) p.setNetworkTarget(data)
    }

    this.network.onPlayerList = () => this.updatePlayerList()
  }

  fixedUpdate(dt: number) {
    this.localPlayer?.fixedUpdate(dt)
    this.remotePlayers.forEach(p => p.fixedUpdate(dt))
    this.streaming.update(this.localPlayer?.position || new THREE.Vector3())

    // Vehicles update
    this.vehicles.forEach(v => {
      if (v.isOccupied && this.localPlayer) {
        const input = {
          forward: (this.localPlayer as any).controller?.getRawMoveInput ? 0 : 0
        }
        // Get input from PlayerController
        const move = (this.localPlayer as any).controller?.getRawMoveInput?.() || new THREE.Vector2()
        v.update(dt, {
          forward: -move.y,
          steer: move.x,
          brake: false
        })
        // Move player with vehicle
        this.localPlayer.position.copy(v.mesh.position)
        this.localPlayer.mesh.position.copy(v.mesh.position)
        this.localPlayer.mesh.quaternion.copy(v.mesh.quaternion)
      } else {
        v.update(dt, { forward: 0, steer: 0, brake: false })
      }
    })
  }

  update(delta: number, alpha: number) {
    this.localPlayer?.update(delta, alpha)
    this.remotePlayers.forEach(p => p.update(delta, alpha))

    if (this.localPlayer) {
      this.minimap.update(this.localPlayer.position, this.localPlayer.rotation.y, this.buildingsRef, this.remotePlayers)
    }

    if (this.localPlayer && this.network.isConnected) {
      this.network.sendUpdate({
        x: this.localPlayer.position.x,
        y: this.localPlayer.position.y,
        z: this.localPlayer.position.z,
        rotY: this.localPlayer.rotation.y,
        velX: this.localPlayer.velocity.x,
        velY: this.localPlayer.velocity.y,
        velZ: this.localPlayer.velocity.z,
        state: this.localPlayer.state
      })
    }
  }

  private updatePlayerList() {
    const el = document.getElementById('player-list')
    if (!el) return
    const count = this.remotePlayers.size + 1
    el.innerHTML = `${count} ONLINE<br><small style="opacity:0.5">F - enter car</small>`
  }
}
