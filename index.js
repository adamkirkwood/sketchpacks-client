/* eslint strict: 0 */
'use strict';

const {
  APP_VERSION,
  SERVER_PORT,
  __PRODUCTION__,
  __DEVELOPMENT__,
  __ELECTRON__
} = require('./src/config')

const path = require('path')
const os = require('os')
const ms = require('ms')
const electron = require('electron')
const app = electron.app
const dialog = electron.dialog
const autoUpdater = electron.autoUpdater
const {ipcMain, ipcRenderer} = electron
const log = require('electron-log')
const menubar = require('menubar')
const Database = require('nedb')
const PluginManager = require('./src/main/plugin_manager')
const CatalogManager = require('./src/main/catalog_manager')
const Catalog = require('./src/lib/catalog')
const {
  CATALOG_FETCH_DELAY,
  CATALOG_FETCH_INTERVAL
} = require('./src/config')

const opts = {
  dir: __dirname,
  icon: __dirname + '/src/IconTemplate.png',
  width: 640,
  height: 600,
  index: `http://localhost:${SERVER_PORT}/`,
  resizable: false
}

const menuBar = menubar(opts)

const database = new Database({
  filename: path.join(app.getPath('userData'), 'catalog.db'),
  autoload: true
})
Catalog.setDatabase(database)

global.database = database
global.Catalog = Catalog
global.CatalogManager = CatalogManager

let mainWindow

menuBar.on('ready', () => {
  log.info(`Sketchpacks v${APP_VERSION} (${__PRODUCTION__ ? 'PROD' : 'DEV'}) launched`)

  if (__PRODUCTION__ && __ELECTRON__) {
    const server = require('./src/server')
    server.listen(SERVER_PORT)
    log.info("Server started on port " + SERVER_PORT)
  }
})

menuBar.on('after-show', () => {
  // if (__DEVELOPMENT__ || __DEBUG__) {
    // require('devtron').install()
    menuBar.window.openDevTools({ mode: 'detach' })
  // }
})

menuBar.on('after-create-window', () => {
  menuBar.window.show()
  mainWindow = menuBar.window

  CatalogManager.addSubscribers(mainWindow)
})

app.on('ready', () => {
  if (__PRODUCTION__ && __ELECTRON__) {
    const updater = require('./src/main/updater')
    updater.init()
  }

  if (__ELECTRON__) {
    setTimeout(updateCatalogOnStart, ms('5s'))

    CatalogManager.enableAutoUpdate()
  }
})

ipcMain.on('manager/INSTALL_REQUEST', (event, arg) => {
  PluginManager.install(event, arg)
})

const updateCatalogOnStart = () => {
  CatalogManager.fetch()
    .then((plugins) => {
      Catalog.upsert(plugins)
    })
}
