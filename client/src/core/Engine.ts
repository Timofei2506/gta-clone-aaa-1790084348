/**
 * Engine.ts - RAGE-like Game Loop, clean logs
 */
import * as THREE from 'three'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { World } from './World'
import { Renderer } from '../renderer/Renderer'
import { InputManager } from '../input/InputManager'
import { Time } from './Time'

export class Engine {
  private renderer: Renderer
  private physics: PhysicsWorld
  private world: World
  private input: InputManager
  private time: Time
  
  private clock = new THREE.Clock()
  private accumulator = 0
  private readonly FIXED_TIMESTEP = 1/60
  
  private isRunning = false
  private rafId = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas)
    this.physics = new PhysicsWorld()
    this.world = new World(this.renderer.scene, this.physics)
    this.input = new InputManager()
    this.time = new Time()
  }

  async init(onProgress: (p:number, text:string)=>void) {
    onProgress(10, 'INIT PHYSICS')
    await this.physics.init()
    onProgress(35, 'GENERATING CITY')
    await this.world.init()
    onProgress(70, 'SPAWNING PLAYER')
    await this.world.spawnLocalPlayer()
    onProgress(85, 'ONLINE CHECK')
    await this.world.initMultiplayer()
    onProgress(100, 'READY')
  }

  start() {
    this.isRunning = true
    this.clock.start()
    this.loop()
  }

  stop() {
    this.isRunning = false
    cancelAnimationFrame(this.rafId)
  }

  private loop = () => {
    if (!this.isRunning) return
    this.rafId = requestAnimationFrame(this.loop)

    const delta = Math.min(this.clock.getDelta(), 0.1)
    this.accumulator += delta

    this.time.update(delta)
    this.input.update()

    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.physics.step(this.FIXED_TIMESTEP)
      this.world.fixedUpdate(this.FIXED_TIMESTEP)
      this.accumulator -= this.FIXED_TIMESTEP
    }

    const alpha = this.accumulator / this.FIXED_TIMESTEP
    this.world.update(delta, alpha)
    this.renderer.render(delta, this.time)
    
    const pos = this.world.localPlayer?.position
    if (pos) {
      const el = document.getElementById('coords')
      if (el) el.textContent = `${pos.x.toFixed(0)} ${pos.y.toFixed(0)} ${pos.z.toFixed(0)} | ${Math.round(1/delta)} FPS | ${this.world.remotePlayers.size + 1} ONLINE`
    }
  }

  getWorld() { return this.world }
  getRenderer() { return this.renderer }
}
