/**
 * NetworkClient.ts - Мультиплеер клиент, как GTA Online (упрощенно)
 * Authoritative server, 20 tick
 */
export class NetworkClient {
  private ws: WebSocket | null = null
  public isConnected = false
  public localId: string | null = null

  public onPlayerJoin: (id:string, data:any)=>void = ()=>{}
  public onPlayerLeave: (id:string)=>void = ()=>{}
  public onPlayerUpdate: (id:string, data:any)=>void = ()=>{}
  public onPlayerList: (list:any[])=>void = ()=>{}

  private serverUrl = this.getServerUrl()
  private sendQueue: any[] = []
  private lastSend = 0

  private getServerUrl() {
    // Локально - localhost, на проде - тот же хост
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return 'ws://localhost:8080'
    }
    // Если деплой - пробуем тот же хост с портом 8080
    // В будущем - отдельный сервер
    return `ws://${location.hostname}:8080`
  }

  async connect(): Promise<void> {
    return new Promise((resolve) => {
      console.log(`[Network] Connecting to ${this.serverUrl}...`)
      
      try {
        this.ws = new WebSocket(this.serverUrl)

        this.ws.onopen = () => {
          console.log('[Network] Connected')
          this.isConnected = true
          resolve()
        }

        this.ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            this.handleMessage(msg)
          } catch(e) {
            console.warn('[Network] Bad message', e)
          }
        }

        this.ws.onclose = () => {
          console.log('[Network] Disconnected, retry in 3s')
          this.isConnected = false
          setTimeout(() => this.connect(), 3000)
        }

        this.ws.onerror = (e) => {
          console.warn('[Network] Error, offline mode', e)
          // Оффлайн режим - резолвим чтобы игра запустилась
          this.isConnected = false
          resolve()
        }

        // Таймаут - если сервера нет, идем в оффлайн
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('[Network] Timeout, offline mode')
            resolve()
          }
        }, 2000)

      } catch(e) {
        console.warn('[Network] Failed, offline', e)
        resolve()
      }
    })
  }

  private handleMessage(msg: any) {
    switch(msg.t) {
      case 'welcome':
        this.localId = msg.id
        console.log(`[Network] Welcome, id=${this.localId}`)
        break
      case 'player_join':
        this.onPlayerJoin(msg.id, msg.data)
        break
      case 'player_leave':
        this.onPlayerLeave(msg.id)
        break
      case 'player_update':
        this.onPlayerUpdate(msg.id, msg.data)
        break
      case 'player_list':
        this.onPlayerList(msg.list)
        break
    }
  }

  sendUpdate(data: any) {
    const now = performance.now()
    if (now - this.lastSend < 50) return // 20 tick
    this.lastSend = now

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'update', data }))
    }
  }
}
