import {
  __ELECTRON__
} from '../../config'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

import { Link } from 'react-router'

import Nameplate from '../Nameplate'
import Button from '../Button'

import './plugin_media.scss'

class PluginMedia extends Component {
  constructor (props) {
    super(props)

    this.renderPreview = this.renderPreview.bind(this)
    this.renderVersion = this.renderVersion.bind(this)
    this.renderScore = this.renderScore.bind(this)
  }

  renderPreview () {
    const { thumbnail_url } = this.props.plugin

    if (thumbnail_url === null)
      return

    if (thumbnail_url === undefined)
      return

    return (
      <div className="o-media__right u-mar-left-large">
        <img src={thumbnail_url} role="presentation" />
      </div>
    )
  }

  renderScore () {
    const { score } = this.props.plugin

    if (score === 0)
      return

    return (
      <span>{score}/5.0</span>
    )
  }

  renderVersion () {
    const { version } = this.props.plugin

    if (version === "0")
      return

    return (
      <span>v{version}</span>
    )
  }

  render () {
    const { name, description, owner, version, score } = this.props.plugin

    return (
        <article className="o-plugin">
          <div className="o-media">
            <div className="o-media__content">
              <h5>
                { __ELECTRON__ ? (
                  <span>{name}</span>
                ) : (
                  <Link to={`/${owner.handle}/${name}`}>
                    {name}
                  </Link>
                ) }
              </h5>
              <p>
                {description}
              </p>
            </div>

            { this.renderPreview() }
          </div>

          <div className="o-plugin__footer">
            <Nameplate
              handle={owner.handle}
              thumbnailUrl={owner.avatar_url}
              name={owner.name}
              height={24}
              width={24}
            />

            { this.renderVersion() }

            { this.renderScore() }

            <Button actionVerb={'Install'}/>
          </div>
        </article>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    dispatch
  }
}

function mapStateToProps(state, ownProps) {
  return {
    state
  }
}

export default connect(mapStateToProps, mapDispatchToProps)( PluginMedia )
