import {
  __ELECTRON__,
  WEB_URL,
  API_URL
} from 'config'

import {remote} from 'electron'
import React from 'react'

import qs from 'qs'
import {SketchpacksApi} from 'api'

import Waypoint from 'react-waypoint'

import {
  fetchCatalog
} from 'actions'

import {
  installPluginRequest,
  updatePluginRequest,
  uninstallPluginRequest,
  toggleVersionLockRequest,
} from 'actions/plugin_manager'

const ConnectedPluginList = ComposedComponent =>
  class extends React.Component {
    constructor (props) {
      super(props)

      this.fetchData = this.fetchData.bind(this)

      this.handlePluginEvent = this.handlePluginEvent.bind(this)
    }

    handlePluginEvent ({ type, plugin, author, isLocked }) {
      const {dispatch} = this.props

      switch (type) {
        case "install":
          return dispatch(installPluginRequest(plugin))
        case "remove":
          return dispatch(uninstallPluginRequest(plugin))
        case "update":
          return dispatch(updatePluginRequest(plugin))
        case "lock":
          return dispatch(toggleVersionLockRequest(plugin, isLocked))
        case "favorite":
          return console.log(type, plugin)
        case "collect":
          return console.log(type, plugin)
        case "info":
          return remote.shell.openExternal(`${WEB_URL}/${plugin.owner.handle}/${plugin.name}`)
        case "author":
          return remote.shell.openExternal(`${WEB_URL}/@${plugin.owner.handle}`)
      }
    }

    componentDidMount () {
      this.fetchData({
        page: this.props.state.plugins.meta.nextPage || "1",
        append: false,
        q: this.props.location.query.q,
        sort: this.props.location.query.sort,
      })
    }

    componentWillReceiveProps (nextProps) {
      if (this.props.plugins.isLoading === true) return

      if (this.props.location.query.sort !== nextProps.location.query.sort) {
        this.fetchData({
          page: "1",
          sort: nextProps.location.query.sort,
          append: false,
          q: nextProps.location.query.q,
        })
      }
    }

    fetchData ({ sort, page, append, q }) {
      const {dispatch,plugins} = this.props

      if (this.props.state.plugins.isLoading === true) return

      console.log('location: ', this.props.location)

      const queryParams = qs.stringify({
        page: page,
        per_page: "10",
        sort: sort,
        text: q || null
      })
      console.log(queryParams)

      dispatch(fetchCatalog(queryParams, append))
    }

    render () {
      return (
        <div>
          <ComposedComponent
            fetchData={this.fetchData}
            handlePluginEvent={this.handlePluginEvent}

            plugins={this.props.plugins}
            state={this.props.state}
            location={this.props.location}
            dispatch={this.props.dispatch}
            installedPluginIds={this.props.installedPluginIds}
            sketchpack={this.props.sketchpack}
          />

          { !this.props.state.plugins.isLoading
            && this.props.state.plugins.allIdentifiers.length >= 9
            && <Waypoint
              onEnter={() => this.fetchData({ sort: this.props.plugins.sort })} /> }
        </div>
      )
    }
  }

export default ConnectedPluginList
