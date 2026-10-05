const { contextBridge, ipcRenderer } = require('electron')

// Pont entre le renderer et le main process pour le stockage
contextBridge.exposeInMainWorld('electron', {
  // Stockage de données
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: (data) => ipcRenderer.invoke('import-data'),

  // fenêtre.ce211 API - required by the existing HTML code (ligne 72: window.ce211 ? ce211.loadData() : localStorage.getItem("ce211"))
  ce211: {
    loadData: () => ipcRenderer.invoke('ce211-load'),
    saveData: (j) => ipcRenderer.invoke('ce211-save', j).then((r) => r)
  },

  // API système
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getVersion: () => app.getVersion()
})

// Initialiser window.ce211 pour compatibilité descendante
// Cela doit être fait avant que le script principal ne s'exécute
try {
  window.ce211 = {
    loadData: () => {
      // Essayer d'abord depuis l'API Electron, sinon localStorage
      return new Promise((resolve) => {
        const type = typeof ipcRenderer !== 'undefined' ? 'electron' : 'localStorage'
        if (type === 'electron') {
          ipcRenderer.invoke('ce211-load').then((result) => {
            if (result && result.status === 'ok' && result.data) {
              resolve(result.data)
            } else {
              // Fallback vers localStorage
              const ls = localStorage.getItem('ce211')
              resolve(ls ? ls : null)
            }
          }).catch(() => {
            const ls = localStorage.getItem('ce211')
            resolve(ls || null)
          })
        } else {
          const ls = localStorage.getItem('ce211')
          resolve(ls || null)
        }
      })
    },
    saveData: (j) => {
      const type = typeof ipcRenderer !== 'undefined' ? 'electron' : 'localStorage'
      if (type === 'electron') {
        ipcRenderer.invoke('ce211-save', j).then((result) => {
          if (result && result.status === 'ok') {
            // Aussi sauvegarder en localStorage pour compatibilité
            try { localStorage.setItem('ce211', j) } catch (e) {}
          }
        }).catch((e) => {
          try { localStorage.setItem('ce211', j) } catch (e2) {}
        })
      } else {
        try { localStorage.setItem('ce211', j) } catch (e) {}
      }
    }
  }
} catch (e) {}