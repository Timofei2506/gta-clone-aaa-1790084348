/**
 * Minimap.ts - GTA style minimap
 */
import * as THREE from 'three'

export class Minimap {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private size = 200

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.size
    this.canvas.height = this.size
    this.canvas.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: ${this.size}px;
      height: ${this.size}px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.15);
      box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5);
      background: #0a0a0a;
      z-index: 10;
    `
    this.ctx = this.canvas.getContext('2d')!
    document.body.appendChild(this.canvas)
  }

  update(playerPos: THREE.Vector3, playerYaw: number, buildings: any[], remotePlayers: Map<string, any>) {
    const ctx = this.ctx
    ctx.clearRect(0,0,this.size,this.size)
    
    // Background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0,0,this.size,this.size)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i=0; i<this.size; i+=20) {
      ctx.beginPath()
      ctx.moveTo(i,0)
      ctx.lineTo(i,this.size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0,i)
      ctx.lineTo(this.size,i)
      ctx.stroke()
    }

    const scale = 0.15 // world to minimap
    const center = this.size/2

    // Buildings as gray rects
    ctx.fillStyle = 'rgba(100,100,100,0.6)'
    buildings.slice(0,200).forEach((b: any) => {
      if (!b.position) return
      const dx = (b.position.x - playerPos.x) * scale
      const dz = (b.position.z - playerPos.z) * scale
      if (Math.abs(dx) > center || Math.abs(dz) > center) return
      // Rotate around player
      const cos = Math.cos(-playerYaw)
      const sin = Math.sin(-playerYaw)
      const rx = dx * cos - dz * sin
      const rz = dx * sin + dz * cos
      ctx.fillRect(center + rx - 2, center + rz - 2, 4, 4)
    })

    // Remote players - red dots
    ctx.fillStyle = '#ff3b30'
    remotePlayers.forEach((p) => {
      const dx = (p.position.x - playerPos.x) * scale
      const dz = (p.position.z - playerPos.z) * scale
      if (Math.abs(dx) > center || Math.abs(dz) > center) return
      const cos = Math.cos(-playerYaw)
      const sin = Math.sin(-playerYaw)
      const rx = dx * cos - dz * sin
      const rz = dx * sin + dz * cos
      ctx.beginPath()
      ctx.arc(center + rx, center + rz, 3, 0, Math.PI*2)
      ctx.fill()
    })

    // Player - blue arrow
    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(0) // player always up
    ctx.fillStyle = '#4a90e2'
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(-5, 6)
    ctx.lineTo(5, 6)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // North indicator
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '10px monospace'
    ctx.fillText('N', center - 4, 12)
  }
}
