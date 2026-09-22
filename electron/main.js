const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let serverProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'GTA CLONE AAA - Open City Reborn',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../client/src/assets/icon.png'),
    backgroundColor: '#000000'
  })

  // В dev - грузим vite, в проде - dist
  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'))
  }

  mainWindow.on('closed', () => mainWindow = null)
}

function startServer() {
  const serverPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'server')
    : path.join(__dirname, '../server')
  
  try {
    serverProcess = spawn('node', [path.join(serverPath, 'dist/index.js')], {
      env: { ...process.env, PORT: '8080' }
    })
    serverProcess.stdout.on('data', d => console.log(`[Server] ${d}`))
    serverProcess.stderr.on('data', d => console.error(`[Server] ${d}`))
  } catch(e) {
    console.warn('Server not started', e)
  }
}

app.whenReady().then(() => {
  startServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})
