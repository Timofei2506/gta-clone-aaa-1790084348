/**
 * GTA Clone Server - Authoritative, как GTA Online
 */
import { GameServer } from './GameServer.js'

const PORT = parseInt(process.env.PORT || '8080')
const server = new GameServer(PORT)

server.start()

process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...')
  server.stop()
  process.exit(0)
})
