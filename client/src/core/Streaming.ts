/**
 * Streaming.ts - Чанк стриминг как в GTA 5
 * Подгружает/выгружает части города вокруг игрока
 */
import * as THREE from 'three'
import { CityGenerator } from '../gameplay/World/CityGenerator'

export class Streaming {
  private loadedChunks = new Set<string>()
  private chunkSize = 250
  private loadDistance = 500
  private unloadDistance = 750

  constructor(private cityGen: CityGenerator) {}

  update(playerPos: THREE.Vector3) {
    const chunkX = Math.floor(playerPos.x / this.chunkSize)
    const chunkZ = Math.floor(playerPos.z / this.chunkSize)

    // Загрузка чанков вокруг
    const loadRadius = Math.ceil(this.loadDistance / this.chunkSize)
    for (let x = -loadRadius; x <= loadRadius; x++) {
      for (let z = -loadRadius; z <= loadRadius; z++) {
        const key = `${chunkX + x}_${chunkZ + z}`
        if (!this.loadedChunks.has(key)) {
          const dist = Math.sqrt(x*x + z*z) * this.chunkSize
          if (dist <= this.loadDistance) {
            this.loadedChunks.add(key)
            // В MVP город уже весь загружен, но тут логика LOD
            this.cityGen.setChunkVisible(chunkX + x, chunkZ + z, true)
          }
        }
      }
    }

    // Выгрузка дальних (для оптимизации в будущем)
    // Пока не выгружаем, так как город 2км - помещается в память
  }
}
