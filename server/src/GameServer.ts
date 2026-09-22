/**
 * GameServer.ts - Authoritative server, 20 tick, как в Rockstar
 */
import { WebSocketServer, WebSocket } from 'ws'
import { Player } from './Player.js'

export class GameServer {
  private wss: WebSocketServer
  private players = new Map<string, Player>()
  private tickInterval: NodeJS.Timeout | null = null
  private readonly TICK_RATE = 20

  constructor(private port: number) {
    this.wss = new WebSocketServer({ port, host: '0.0.0.0' })
  }

  start() {
    console.log(`[Server] Starting on 0.0.0.0:${this.port}`)

    this.wss.on('connection', (ws: WebSocket) => {
      const id = this.generateId()
      const player = new Player(id, ws)
      this.players.set(id, player)

      console.log(`[Server] Player ${id} connected, total=${this.players.size}`)

      // Welcome
      ws.send(JSON.stringify({ t: 'welcome', id }))

      // Отправляем новому игроку список всех
      const list = Array.from(this.players.values()).map(p => ({
        id: p.id,
        data: p.getData()
      }))
      ws.send(JSON.stringify({ t: 'player_list', list }))

      // Сообщаем всем о новом
      this.broadcast({ t: 'player_join', id, data: player.getData() }, id)

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString())
          if (msg.t === 'update') {
            player.updateData(msg.data)
          }
        } catch(e) {}
      })

      ws.on('close', () => {
        console.log(`[Server] Player ${id} disconnected`)
        this.players.delete(id)
        this.broadcast({ t: 'player_leave', id })
      })
    })

    // Tick loop - рассылка позиций 20 раз в сек
    this.tickInterval = setInterval(() => this.tick(), 1000 / this.TICK_RATE)

    console.log(`[Server] Tick rate ${this.TICK_RATE}Hz`)
  }

  private tick() {
    // Рассылка всех позиций всем
    for (const [id, player] of this.players) {
      const data = player.getData()
      if (!data) continue
      
      this.broadcast({
        t: 'player_update',
        id,
        data
      }, id) // кроме себя
    }
  }

  private broadcast(msg: any, excludeId?: string) {
    const raw = JSON.stringify(msg)
    for (const [id, player] of this.players) {
      if (id === excludeId) continue
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(raw)
      }
    }
  }

  private generateId() {
    return Math.random().toString(36).substring(2, 9)
  }

  stop() {
    if (this.tickInterval) clearInterval(this.tickInterval)
    this.wss.close()
  }
}
