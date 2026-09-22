/**
 * InputManager.ts - Ввод как в GTA 5
 */
import * as THREE from 'three'

export class InputManager {
  public keys = new Map<string, boolean>()
  public mouseDelta = new THREE.Vector2()
  public mouseButtons = new Map<number, boolean>()
  public isPointerLocked = false

  private _mouseAccum = new THREE.Vector2()

  constructor() {
    window.addEventListener('keydown', e => this.keys.set(e.code.toLowerCase(), true))
    window.addEventListener('keyup', e => this.keys.set(e.code.toLowerCase(), false))
    
    window.addEventListener('mousedown', e => {
      this.mouseButtons.set(e.button, true)
      if (!this.isPointerLocked) {
        document.body.requestPointerLock()
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
    })

    // Prevent context menu
    window.addEventListener('contextmenu', e => e.preventDefault())
  }

  update() {
    this.mouseDelta.copy(this._mouseAccum)
    this._mouseAccum.set(0,0)
  }

  isKeyDown(code: string) {
    return this.keys.get(code.toLowerCase()) || false
  }

  getMoveInput() {
    const x = (this.isKeyDown('keyd') || this.isKeyDown('arrowright') ? 1 : 0) - 
              (this.isKeyDown('keya') || this.isKeyDown('arrowleft') ? 1 : 0)
    const z = (this.isKeyDown('keys') || this.isKeyDown('arrowdown') ? 1 : 0) - 
              (this.isKeyDown('keyw') || this.isKeyDown('arrowup') ? 1 : 0)
    return new THREE.Vector2(x, z)
  }

  isRunning() { return this.isKeyDown('shiftleft') || this.isKeyDown('shiftright') }
  isJump() { return this.isKeyDown('space') }
}
