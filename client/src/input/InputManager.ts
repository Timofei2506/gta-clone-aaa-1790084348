/**
 * InputManager.ts - GTA 5 style input, smooth
 */
import * as THREE from 'three'

export class InputManager {
  public keys = new Map<string, boolean>()
  public mouseDelta = new THREE.Vector2()
  public mouseButtons = new Map<number, boolean>()
  public isPointerLocked = false

  private _mouseAccum = new THREE.Vector2()
  private moveVector = new THREE.Vector2()
  private smoothMove = new THREE.Vector2()

  constructor() {
    window.addEventListener('keydown', e => {
      this.keys.set(e.code.toLowerCase(), true)
      // Prevent space scroll
      if (e.code === 'Space') e.preventDefault()
    })
    window.addEventListener('keyup', e => this.keys.set(e.code.toLowerCase(), false))
    
    window.addEventListener('mousedown', e => {
      this.mouseButtons.set(e.button, true)
      if (!this.isPointerLocked && e.button === 0) {
        const canvas = document.getElementById('canvas')
        if (canvas) canvas.requestPointerLock()
      }
    })
    window.addEventListener('mouseup', e => this.mouseButtons.set(e.button, false))
    
    window.addEventListener('mousemove', e => {
      if (document.pointerLockElement) {
        this._mouseAccum.x += e.movementX
        this._mouseAccum.y += e.movementY
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = !!document.pointerLockElement
      document.body.style.cursor = this.isPointerLocked ? 'none' : 'auto'
      const cross = document.getElementById('crosshair')
      if (cross) cross.style.display = this.isPointerLocked ? 'block' : 'none'
    })

    window.addEventListener('contextmenu', e => e.preventDefault())
  }

  update() {
    this.mouseDelta.copy(this._mouseAccum)
    this._mouseAccum.set(0,0)

    // Smooth movement input
    const rawX = (this.isKeyDown('keyd') ? 1 : 0) - (this.isKeyDown('keya') ? 1 : 0)
    const rawZ = (this.isKeyDown('keys') ? 1 : 0) - (this.isKeyDown('keyw') ? 1 : 0)
    this.moveVector.set(rawX, rawZ)
    if (this.moveVector.length() > 1) this.moveVector.normalize()
    
    // Lerp for inertia
    this.smoothMove.lerp(this.moveVector, 0.2)
  }

  isKeyDown(code: string) {
    return this.keys.get(code.toLowerCase()) || false
  }

  getMoveInput() {
    return this.smoothMove.clone()
  }

  getRawMoveInput() {
    return this.moveVector.clone()
  }

  isRunning() { return (this.isKeyDown('shiftleft') || this.isKeyDown('shiftright')) && this.smoothMove.length() > 0.1 }
  isJump() { 
    const jump = this.isKeyDown('space')
    if (jump) this.keys.set('space', false) // one shot
    return jump
  }
}
