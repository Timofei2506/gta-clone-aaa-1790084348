/**
 * NetworkClient.ts - v0.4: silent, no spam logs
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
  private lastSend = 0
  private retryCount = 0

  private getServerUrl(): string | null {
    // @ts-ignore
    const envUrl = import.meta.env?.VITE_WS_URL
    if (envUrl) return envUrl

    const isSecure = location.protocol === 'https:'
    const proto = isSecure ? 'wss:' : 'ws:'
    const host = location.hostname

    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return `${proto}//localhost:8080`
    }

    if (host.includes('vercel.app')) {
      return null // silent offline
    }

    return `${proto}//${host}:8080`
  }

  async connect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.serverUrl) {
        resolve()
        return
      }

      try {
        this.ws = new WebSocket(this.serverUrl)

        this.ws.onopen = () => {
          this.isConnected = true
          this.retryCount = 0
          resolve()
        }

        this.ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            this.handleMessage(msg)
          } catch {}
        }

        this.ws.onclose = () => {
          this.isConnected = false
          if (this.retryCount < 2 && this.serverUrl && !this.serverUrl.includes('vercel.app')) {
            this.retryCount++
            setTimeout(() => this.connect(), 3000)
          }
        }

        this.ws.onerror = () => {
          this.isConnected = false
          resolve()
        }

        setTimeout(() => {
          if (!this.isConnected) resolve()
        }, 1200)

      } catch {
        resolve()
      }
    })
  }

  private handleMessage(msg: any) {
    switch(msg.t) {
      case 'welcome': this.localId = msg.id; break
      case 'player_join': this.onPlayerJoin(msg.id, msg.data); break
      case 'player_leave': this.onPlayerLeave(msg.id); break
      case 'player_update': this.onPlayerUpdate(msg.id, msg.data); break
      case 'player_list': this.onPlayerList(msg.list); break
    }
  }

  sendUpdate(data: any) {
    const now = performance.now()
    if (now - this.lastSend < 50) return
    this.lastSend = now
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'update', data }))
    }
  }
}
