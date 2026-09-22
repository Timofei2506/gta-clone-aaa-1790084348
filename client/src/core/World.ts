/**
 * World.ts - Мир, энтити менеджер, стриминг
 */
import * as THREE from 'three'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { CityGenerator } from '../gameplay/World/CityGenerator'
import { Player } from '../gameplay/Player/Player'
import { NetworkClient } from '../gameplay/Multiplayer/NetworkClient'
import { Streaming } from './Streaming'

export class World {
  private cityGen: CityGenerator
  private streaming: Streaming
  private network: NetworkClient
  
  public localPlayer: Player | null = null
  public remotePlayers: Map<string, Player> = new Map()
  
  constructor(
    private scene: THREE.Scene,
    private physics: PhysicsWorld
  ) {
    this.cityGen = new CityGenerator(scene, physics)
    this.streaming = new Streaming(this.cityGen)
    this.network = new NetworkClient()
  }

  async init() {
    // Генер города 2x2км, как GTA 3 район
    await this.cityGen.generate({
      size: 2000,
      blockSize: 100,
      roadWidth: 12,
      maxBuildingHeight: 80,
      density: 0.85
    })
    
    // Освещение города
    const streetLights = this.cityGen.getStreetLights()
    streetLights.forEach(l => this.scene.add(l))
  }

  async spawnLocalPlayer() {
    const spawn = this.cityGen.getRandomSpawnPoint()
    this.localPlayer = new Player(spawn, this.physics, true)
    this.scene.add(this.localPlayer.mesh)
    
    // Камера привязана к игроку
    this.localPlayer.attachCamera()
  }

  async initMultiplayer() {
    await this.network.connect()
    
    this.network.onPlayerJoin = (id, data) => {
      if (id === this.network.localId) return
      const p = new Player(
        new THREE.Vector3(data.x, data.y, data.z),
        this.physics,
        false
      )
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
      if (p) {
        p.setNetworkTarget(data)
      }
    }

    this.network.onPlayerList = (list) => {
      this.updatePlayerList()
    }
  }

  fixedUpdate(dt: number) {
    this.localPlayer?.fixedUpdate(dt)
    this.remotePlayers.forEach(p => p.fixedUpdate(dt))
    this.streaming.update(this.localPlayer?.position || new THREE.Vector3())
  }

  update(delta: number, alpha: number) {
    this.localPlayer?.update(delta, alpha)
    this.remotePlayers.forEach(p => p.update(delta, alpha))

    // Отправка позиции на сервер (20hz)
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
    el.innerHTML = `YOU + ${this.remotePlayers.size} others<br><small style="opacity:0.5">${count} total</small>`
  }
}
