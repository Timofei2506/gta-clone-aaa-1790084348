/**
 * Engine.ts - RAGE-like Game Loop
 * Senior Rockstar architecture: fixed tick + variable render
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
  private readonly FIXED_TIMESTEP = 1/60 // 60 Hz physics like RAGE
  
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
    onProgress(10, 'INIT RAPIER...')
    await this.physics.init()
    
    onProgress(30, 'BUILDING CITY...')
    await this.world.init()
    
    onProgress(70, 'SPAWNING PLAYER...')
    await this.world.spawnLocalPlayer()
    
    onProgress(90, 'CONNECTING ONLINE...')
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

    // Fixed timestep physics - как в RAGE, чтобы не было tunneling
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.physics.step(this.FIXED_TIMESTEP)
      this.world.fixedUpdate(this.FIXED_TIMESTEP)
      this.accumulator -= this.FIXED_TIMESTEP
    }

    const alpha = this.accumulator / this.FIXED_TIMESTEP
    this.world.update(delta, alpha)
    this.renderer.render(delta, this.time)
    
    // HUD
    const pos = this.world.localPlayer?.position
    if (pos) {
      const el = document.getElementById('coords')
      if (el) el.textContent = `X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)} | FPS:${Math.round(1/delta)}`
    }
  }

  getWorld() { return this.world }
  getRenderer() { return this.renderer }
}
