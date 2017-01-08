const _ = require('lodash')
const Promise = require('promise')
const request = require('request')
const ms = require('ms')
const semver = require('semver')
const log = require('electron-log')
const {ipcRenderer} = require('electron')


const {
  API_URL,
  CATALOG_FETCH_INTERVAL
} = require('../config')

let database
let store
let updateInterval

const Catalog = {
  setDatabase: (db) => database = db,
  getDatabase: () => database,

  setStore: (rdx) => store = rdx,
  getStore: () => store,

  enableAutoUpdate: () => {
    console.log('Enabling catalog auto updating...')
    Catalog.update()
      .then((plugins) => {
        Catalog.upsert(plugins)
          .then((plugins) => {
            store.dispatch(pluginsReceived(plugins))
            Catalog.autoUpdatePlugins()
          })
      })
    updateInterval = setInterval(Catalog.update, ms(CATALOG_FETCH_INTERVAL))
  },

  autoUpdatePlugins: () => {
    Catalog.getUpdatedPlugins().then((plugins) => {
      _(plugins).forEach((plugin) => {
        ipcRenderer.send('manager/INSTALL_REQUEST', plugin)
      })
    })
  },

  disableAutoUpdate: () => clearInterval(updateInterval),

  getPopularPlugins: () => new Promise((resolve, reject) => {
    if (database === undefined) return new Error("Set a database to query")

    database.find({}).sort({ score: -1 }).exec((err, plugins) => {
      if (err) return reject(err)
      return resolve(plugins)
    })
  }),

  getNewestPlugins: () => new Promise((resolve, reject) => {
    if (database === undefined) return new Error("Set a database to query")

    database.find({}).sort({ updated_at: -1 }).exec((err, plugins) => {
      if (err) return reject(err)
      return resolve(plugins)
    })
  }),

  getInstalledPlugins: () => new Promise((resolve, reject) => {
    if (database === undefined) return new Error("Set a database to query")

    database.find({ installed: true }).sort({ name: 1 }).exec((err, plugins) => {
      if (err) return reject(err)
      return resolve(plugins)
    })
  }),

  getUpdatedPlugins: () => new Promise((resolve, reject) => {
    if (database === undefined) return new Error("Set a database to query")

    function updateAvailable (plugin) {
      if (plugin.installed === undefined) return false
      if (!plugin.installed) return false

      let remoteVersion = plugin.version
      let localVersion = plugin.installed_version

      // FIXME: API should return valid SemVer by default
      if (remoteVersion === "0") remoteVersion = "0.0.0"
      if (localVersion === "0") remoteVersion = "0.0.0"

      return plugin.installed && semver.lt(localVersion,remoteVersion)
    }

    database.find({ $where: function () { return updateAvailable(this) } })
      .sort({ updated_at: -1 }).exec((err, plugins) => {
      if (err) return reject(err)
      return resolve(plugins)
    })
  }),

  update: () => {
    const opts = {
      method: 'GET',
      baseUrl: API_URL,
      uri: '/v1/plugins/catalog'
    }

    return new Promise((resolve, reject) => {
      console.log(`Fetching latest plugin catalog from ${API_URL}...`)

      request(opts, (error, response, body) => {
        if (error) return reject(error)
        return resolve(body)
      })
    })
  },

  upsert: (plugins) => {
    new Promise((resolve, reject) => {
      let error

      const filteredPlugins = _.without(JSON.parse(plugins), null, undefined)
      const updatedPlugins = []

      _(filteredPlugins).forEach((plugin) => {
        database.update({ id: plugin.id }, { $set: {
            name: plugin.name,
            description: plugin.description,
            author: plugin.author,
            owner: plugin.owner,
            source_url: plugin.source_url,
            score: plugin.score,
            download_url: plugin.download_url,
            thumbnail_url: plugin.thumbnail_url,
            compatible_version: plugin.compatible_version,
            version: plugin.version,
            update_url: plugin.update_url,
            published_at: plugin.created_at,
            updated_at: plugin.updated_at
          } }, { upsert: true }, (err, num) => {
          if (err) error = err
          updatedPlugins.push(plugin)
        })
      })

      if (error) return reject(err)

      Catalog.autoUpdatePlugins()
      return resolve(filteredPlugins)
    })
  },

  pluginInstalled: ({ id, install_path, version}) => {
    const newProps = {
      installed: true,
      install_path: install_path,
      installed_version: version
    }

    return new Promise((resolve, reject) => {
      database.update({ id: id },
        { $set: newProps },
        { returnUpdatedDocs: true }, (err, num, plugin) => {
          if (err) return reject(err)
          return resolve(plugin)
        })
    })
  },

  pluginRemoved: ({ id }) => {
    const newProps = {
      installed: false,
      install_path: null,
      installed_version: null
    }

    return new Promise((resolve, reject) => {
      database.update({ id: id },
        { $set: newProps },
        { returnUpdatedDocs: true }, (err, num, plugin) => {
          if (err) return reject(err)
          return resolve(plugin)
        })
    })
  }
}

Object.freeze(Catalog)
module.exports = Catalog
