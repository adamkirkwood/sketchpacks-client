import React from 'react'

import Avatar from 'components/Avatar'

 /* FIXME: CSS for pointer style */

const Nameplate = ({ handle, thumbnailUrl, name, onClick }) => (
  <div>
    <div className="o-media" onClick={onClick} style={{cursor: 'pointer'}}>
      <div className="o-media__left u-mar-right-x-small">
        <Avatar handle={handle} />
      </div>

      <div className="o-media__content">
        {handle || name}
      </div>
    </div>
  </div>
)

export default Nameplate
