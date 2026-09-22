import { WebSocket } from 'ws'

export class Player {
  private data: any = { x:0, y:5, z:0, rotY:0, velX:0, velY:0, velZ:0, state:'idle' }
  private lastUpdate = Date.now()

  constructor(
    public id: string,
    public ws: WebSocket
  ) {}

  updateData(newData: any) {
    // Валидация - античит как в GTA Online (простой)
    // Проверяем что игрок не телепортируется слишком быстро
    const dx = newData.x - this.data.x
    const dy = newData.y - this.data.y
    const dz = newData.z - this.data.z
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
    
    // Макс 10м за тик (200м/с) - защита от читов
    if (dist > 10) {
      // console.warn(`[AntiCheat] Player ${this.id} too fast: ${dist}`)
      return
    }

    this.data = newData
    this.lastUpdate = Date.now()
  }

  getData() { return this.data }
}
