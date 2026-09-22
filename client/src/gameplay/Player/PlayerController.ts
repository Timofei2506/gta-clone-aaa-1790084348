/**
 * PlayerController.ts - v0.3 with raw input for vehicles
 */
import * as THREE from 'three'
import { InputManager } from '../../input/InputManager'

export class PlayerController {
  private input = new InputManager()
  private stamina = 1.0
  private staminaRegen = 0.5
  private staminaDrain = 1.0

  getInput() {
    const move = this.input.getMoveInput()
    const running = this.input.isRunning() && this.stamina > 0.1 && move.length() > 0
    const jump = this.input.isJump()

    if (running) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrain * 0.016)
    } else {
      this.stamina = Math.min(1, this.stamina + this.staminaRegen * 0.016)
    }

    return { move, running, jump }
  }

  getRawMoveInput() {
    return this.input.getRawMoveInput()
  }

  getStamina() { return this.stamina }
}
