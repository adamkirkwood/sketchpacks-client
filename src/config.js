module.exports = {
  __PRODUCTION__: (typeof process !== "undefined") && (typeof process.execPath !== "undefined") && (process.execPath.search('electron-prebuilt') === -1) || false,
  __DEVELOPMENT__: (typeof process !== "undefined") && (typeof process.execPath !== "undefined") && (process.execPath.search('electron-prebuilt') !== -1) || false,
  __ELECTRON__: (typeof process !== "undefined") && process.versions && (process.versions.electron !== undefined),

  RELEASE_SERVER_URL: 'https://sketchpacks-releases.herokuapp.com',
  APP_VERSION: require('../package.json').version,
  SERVER_PORT: process.env.PORT || 8080,

  WEB_URL: 'https://www.sketchpacks.com',
  API_URL: 'https://sketchpacks-api.herokuapp.com',

  PLUGIN_AUTOUPDATE_DELAY: '30s',
  PLUGIN_AUTOUPDATE_INTERVAL: process.env.NODE_ENV === 'development' ? '30s' : '15m',

  UPDATER_INTERVAL: '4h',

  MIXPANEL_TOKEN: process.env.NODE_ENV === 'development'
    ? '83ca491fc0b9796233bffce9e2d7593c'
    : 'e33958b9ef89db7377e9efed5c7e8a64',

  HOME_PATH: process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
  PLUGIN_PATHS: [
    "/Library/Application Support/com.bohemiancoding.sketch3/Plugins/", // Sketch 3
    "/Library/Containers/com.bohemiancoding.sketch3/Data/Library/Application Support/com.bohemiancoding.sketch3/Plugins/", // Sketch 3 (MAS)
    "/Library/Containers/com.bohemiancoding.sketch3.beta/Data/Library/Application Support/com.bohemiancoding.sketch3/Plugins/", // Sketch 3 Beta
    "/Library/Containers/com.bohemiancoding.sketch/Data/Library/Application Support/sketch/Plugins/", // Sketch 2 (MAS)
    "/Library/Application Support/sketch/Plugins/", // Sketch 2
    "/Downloads/" // Fallback
  ],
  SKETCH_TOOLBOX_DB_PATH: '/Library/Application\ Support/Sketch\ Toolbox/Sketch\ Toolbox.sqlite'
}
