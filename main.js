const { app, BrowserWindow, ipcMain, dialog, nativeTheme, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  })

  mainWindow.loadFile('Tableau de commande CE211.html')

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC: Chargement des données CE211 (depuis localStorage ou Electron)
ipcMain.handle('ce211-load', () => {
  try {
    const userDataPath = app.getPath('userData')
    const dataPath = path.join(userDataPath, 'ce211-data.json')
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      return { status: 'ok', data }
    }
    // Aucun fichier JSON existant – migration depuis localStorage (fallback renderer)
    let fallbackData = null
    try {
      const lsData = localStorage.getItem('ce211')
      if (lsData) {
        fallbackData = JSON.parse(lsData)
        // Migration non destructive : on écrit seulement si le fichier n'existe pas
        try { fs.writeFileSync(dataPath, JSON.stringify(fallbackData), 'utf-8') } catch (e) {}
      }
    } catch (e) {}
    return { status: 'ok', data: fallbackData }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Sauvegarde des données CE211
ipcMain.handle('ce211-save', (event, data) => {
  try {
    const userDataPath = app.getPath('userData')
    const dataPath = path.join(userDataPath, 'ce211-data.json')
    fs.writeFileSync(dataPath, JSON.stringify(data), 'utf-8')
    // Sauvegarder aussi en localStorage pour compatibilité
    try { localStorage.setItem('ce211', JSON.stringify(data)) } catch (e) {}
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Sauvegarde des données (alias)
ipcMain.handle('save-data', (event, data) => {
  try {
    const userDataPath = app.getPath('userData')
    const dataPath = path.join(userDataPath, 'ce211-data.json')
    fs.writeFileSync(dataPath, JSON.stringify(data), 'utf-8')
    try { localStorage.setItem('ce211', JSON.stringify(data)) } catch (e) {}
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Chargement des données (alias)
ipcMain.handle('load-data', () => {
  try {
    const userDataPath = app.getPath('userData')
    const dataPath = path.join(userDataPath, 'ce211-data.json')
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      return { status: 'ok', data }
    }
    let fallbackData = null
    try {
      const lsData = localStorage.getItem('ce211')
      if (lsData) {
        fallbackData = JSON.parse(lsData)
      }
    } catch (e) {}
    return { status: 'ok', data: fallbackData }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Export des données
ipcMain.handle('export-data', () => {
  try {
    const userDataPath = app.getPath('userData')
    const dataPath = path.join(userDataPath, 'ce211-data.json')
    if (fs.existsSync(dataPath)) {
      return { status: 'ok', data: fs.readFileSync(dataPath, 'utf-8') }
    }
    return { status: 'no-data' }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Import des données
ipcMain.handle('import-data', (event, data) => {
  try {
    const userDataPath = app.getPath('userData')
    const dataPath = path.join(userDataPath, 'ce211-data.json')
    fs.writeFileSync(dataPath, data, 'utf-8')
    // Mettre à jour localStorage aussi
    try { localStorage.setItem('ce211', data) } catch (e) {}
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Sélectionner dossier de données
ipcMain.handle('select-data-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['directory']
    })
    return { status: 'ok', folder: result.filePaths[0] }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Obtenir le chemin du dossier de données
ipcMain.handle('get-data-folder', () => {
  try {
    const userDataPath = app.getPath('userData')
    return { status: 'ok', folder: userDataPath }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})

// IPC: Vérifier si les données existent
ipcMain.handle('check-data-exists', () => {
  try {
    const userDataPath = app.getPath('userData')
    const dataPath = path.join(userDataPath, 'ce211-data.json')
    return { status: 'ok', exists: fs.existsSync(dataPath) }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
})