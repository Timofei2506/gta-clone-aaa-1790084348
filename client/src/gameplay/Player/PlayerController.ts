/**
 * PlayerController.ts - Ввод -> состояние игрока
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

    // Стамина как в GTA 5
    if (running) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrain * 0.016)
    } else {
      this.stamina = Math.min(1, this.stamina + this.staminaRegen * 0.016)
    }

    return { move, running, jump }
  }

  getStamina() { return this.stamina }
}
