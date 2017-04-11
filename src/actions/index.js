import linkHeader from 'parse-link-header'
import qs from 'qs'

import { normalize } from 'normalizr'
import * as schemas from 'schemas'

import {pick} from 'lodash'

const VALID_KEYS = [
  'id',
  'name',
  'title',
  'description',
  'version',
  'compatible_version',
  'score',
  'watchers_count',
  'stargazers_count',
  'auto_updates',
  'source_url',
  'thumbnail_url',
  'download_url',
  'owner',
  'locked',
  'install_path',
  'identifier'
]

const prunePluginData = (plugins) => plugins.map(p => pick(p, VALID_KEYS))

export const LOCATION_CHANGE = '@@router/LOCATION_CHANGE'

//
// ENTITIES
//

export const ADD_ENTITIES = 'ADD_ENTITIES'
export const addEntities = (normalizedData) => {
  return {
    type: ADD_ENTITIES,
    payload: normalizedData
  }
}


//
// CATALOG
//

export function fetchCatalog (query, append=true) {
  return (dispatch, getState, {api}) => {

    const defaults = getState().plugins.meta

    const queryParams = qs.stringify({
      sort: qs.parse(query).sort || [defaults.sortKey,defaults.sortDir].join(':'),
      page: qs.parse(query).page || defaults.nextPage,
      text: qs.parse(query).text,
      perPage: qs.parse(query).perPage
    })

    dispatch(fetchCatalogRequest({ payload: queryParams, append: append }))

    api.getCatalog({query: queryParams})
      .then(response => {
        const pageMeta = linkHeader(response.headers.link)
        const normalizedPluginList = normalize(response.data, schemas.pluginListSchema)
        dispatch(fetchCatalogReceived({ payload: normalizedPluginList, append }))

        dispatch(addEntities(normalizedPluginList))


        if (pageMeta) dispatch(catalogPaginate({ pageMeta, append }))
      })
      .catch(error => {
        console.log(error)
        dispatch(fetchCatalogError(error))
      })
  }
}

export const FETCH_CATALOG_REQUEST = 'catalog/FETCH_REQUEST'

export function fetchCatalogRequest ({payload, append}) {
  return {
    type: FETCH_CATALOG_REQUEST,
    payload,
    append
  }
}

export const FETCH_CATALOG_RECEIVED = 'catalog/FETCH_RECEIVED'

export function fetchCatalogReceived ({payload, append, total}) {
  return {
    type: FETCH_CATALOG_RECEIVED,
    payload,
    append
  }
}

export const FETCH_CATALOG_ERROR = 'catalog/FETCH_ERROR'

export function fetchCatalogError (error) {
  return {
    type: FETCH_CATALOG_ERROR,
    error
  }
}

export const CATALOG_PAGINATE = 'catalog/PAGINATE'

export function catalogPaginate (payload) {
  console.log(CATALOG_PAGINATE, payload)
  return {
    type: CATALOG_PAGINATE,
    payload: payload
  }
}

export const CATALOG_SORT_BY = 'catalog/SORT_BY'

export function catalogSortBy (sort) {
  const queryParams = qs.stringify({
    page: 1,
    per_page: 10,
    q: '',
    sort: sort
  })

  return (dispatch, getState, {api}) => {

    dispatch(fetchCatalog(queryParams, false))

    return {
      type: CATALOG_SORT_BY,
      sort,
      meta: {
        mixpanel: {
          eventName: 'Registry',
          type: 'Sort',
          props: {
            sortKey: sort,
          },
        },
      },
    }
  }
}


//
// SEARCH
//

export function fetchSearch (keyword, append=false) {
  return (dispatch, getState, {api}) => {
    dispatch(fetchSearchRequest({keyword: keyword}))

    api.getCatalog({query: `text=${keyword}`})
      .then(response => {
        const pageMeta = linkHeader(response.headers.link)

        if (pageMeta) dispatch(catalogPaginate(pageMeta))

        dispatch(fetchCatalogReceived({
          payload: response.data,
          append: append,
          total: response.headers.total,
        }))
      })
      .catch(error => dispatch(fetchCatalogError(error)))
  }
}

export const FETCH_SEARCH_REQUEST = 'search/FETCH_REQUEST'

export function fetchSearchRequest (payload) {
  return {
    type: FETCH_SEARCH_REQUEST,
    payload,
    meta: {
      mixpanel: {
        eventName: 'Registry',
        type: 'Search',
        props: {
          source: 'desktop',
          keyword: payload.keyword,
        },
      },
    },
  }
}

export const FETCH_SEARCH_RECEIVED = 'search/FETCH_RECEIVED'

export function fetchSearchReceived (payload) {
  return {
    type: FETCH_SEARCH_RECEIVED,
    payload: payload
  }
}

export const FETCH_SEARCH_ERROR = 'search/FETCH_ERROR'

export function fetchSearchError (error) {
  return {
    type: FETCH_SEARCH_ERROR,
    error
  }
}


//
// LIBRARY
//

export const FETCH_LIBRARY_REQUEST = 'library/FETCH_REQUEST'

export function fetchLibraryRequest () {
  return {
    type: FETCH_LIBRARY_REQUEST
  }
}


export const FETCH_LIBRARY_RECEIVED = 'library/FETCH_RECEIVED'

export function fetchLibraryReceived (payload) {
  return {
    type: FETCH_LIBRARY_RECEIVED,
    payload: prunePluginData(payload)
  }
}

export const FETCH_LIBRARY_ERROR = 'library/FETCH_ERROR'

export function fetchLibraryError (error) {
  return {
    type: FETCH_LIBRARY_ERROR,
    error
  }
}

//
// USER
//

export function fetchUser (user) {
  return (dispatch, getState, {api}) => {
    dispatch(fetchUserRequest(user))

    api.getUser({userId: user})
      .then(response => {
        dispatch(fetchUserReceived(response.data))
        dispatch(fetchUserPlugins(response.data.plugins_url))
      })
      .catch(error => dispatch(fetchUserError(error)))
  }
}

export const FETCH_USER_REQUEST = 'user/FETCH_REQUEST'

export function fetchUserRequest (user) {
  return {
    type: FETCH_USER_REQUEST,
    payload: user
  }
}

export const FETCH_USER_RECEIVED = 'user/FETCH_RECEIVED'

export function fetchUserReceived (user) {
  return {
    type: FETCH_USER_RECEIVED,
    payload: user
  }
}

export const FETCH_USER_PLUGINS_REQUEST = 'user/FETCH_PLUGINS_REQUEST'

export function fetchUserPluginsRequest (user) {
  return {
    type: FETCH_USER_PLUGINS_REQUEST,
    payload: user
  }
}

export const FETCH_USER_PLUGINS_RECEIVED = 'user/FETCH_PLUGINS_RECEIVED'

export function fetchUserPluginsReceived (plugins) {
  return {
    type: FETCH_USER_PLUGINS_RECEIVED,
    payload: prunePluginData(plugins)
  }
}

export const FETCH_USER_PLUGINS_ERROR = 'user/FETCH_PLUGINS_ERROR'

export function fetchUserError (error) {
  return {
    type: FETCH_USER_PLUGINS_ERROR,
    error
  }
}

export function fetchUserPlugins (endpoint) {
  return (dispatch, getState, {api}) => {
    api.getUserPlugins(endpoint)
      .then(response => {
        dispatch(fetchUserPluginsReceived(response.data))
      })
      .catch(error => {
        dispatch(fetchUserPluginsError(error))

      })
  }
}


//
// PLUGIN DETAILS
//

export function fetchPluginDetails ({userId, pluginId}) {
  return (dispatch, getState, {api}) => {
    dispatch(fetchPluginDetailsRequest())

    api.getPlugin({userId, pluginId})
      .then(response => {
        dispatch(fetchPluginDetailsReceived(response.data))
        dispatch(fetchPluginReadme(response.data.readme_url))
      })
      .catch(error => dispatch(fetchPluginDetailsError(error)))
  }
}

export const PLUGIN_DETAILS_REQUEST = 'plugins/FETCH_PLUGIN_DETAILS_REQUEST'

export function fetchPluginDetailsRequest () {
  return {
    type: PLUGIN_DETAILS_REQUEST
  }
}

export const PLUGIN_DETAILS_ERROR = 'plugins/FETCH_PLUGIN_DETAILS_ERROR'

export function fetchPluginDetailsError (error) {
  return {
    type: PLUGIN_DETAILS_ERROR,
    error
  }
}


export const PLUGIN_DETAILS_RECEIVED = 'plugins/FETCH_PLUGIN_DETAILS_RECEIVED'

export function fetchPluginDetailsReceived (payload) {
  return {
    type: PLUGIN_DETAILS_RECEIVED,
    payload
  }
}

export function fetchPluginReadme (endpoint) {
  return (dispatch, getState, {api}) => {
    dispatch(fetchPluginReadmeRequest())

    api.getPluginReadme(endpoint)
      .then(response => {

        dispatch(fetchPluginReadmeReceived(response.data))
      })
      .catch(error => dispatch(fetchPluginReadmeError(error)))
  }
}


export const PLUGIN_README_REQUEST = 'plugins/FETCH_PLUGIN_README_REQUEST'

export function fetchPluginReadmeRequest () {
  return {
    type: PLUGIN_README_REQUEST
  }
}


export const PLUGIN_README_RECEIVED = 'plugins/FETCH_PLUGIN_README_RECEIVED'

export function fetchPluginReadmeReceived (payload) {
  return {
    type: PLUGIN_README_RECEIVED,
    payload
  }
}

export const PLUGIN_README_ERROR = 'plugins/FETCH_PLUGIN_README_ERROR'

export function fetchPluginReadmeError (error) {
  return {
    type: PLUGIN_README_ERROR,
    error
  }
}



export const APP_INSTALL = 'app/INSTALL'

export function appInstall (payload) {
  return {
    type: APP_INSTALL,
    payload,
    meta: {
      mixpanel: {
        eventName: 'App',
        type: 'Install',
        props: {
          version: payload,
        },
      },
    },
  }
}
