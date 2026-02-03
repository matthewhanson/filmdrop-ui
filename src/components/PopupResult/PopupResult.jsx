import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import './PopupResult.css'
import { useSelector } from 'react-redux'
import { debounceTitilerOverlay, zoomToItemExtent } from '../../utils/mapHelper'
import ItemHeader from '../EnhancedDetails/ItemHeader.jsx'

const PopupResult = (props) => {
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)
  const _autoCenterOnItemChanged = useSelector(
    (state) => state.mainSlice.autoCenterOnItemChanged
  )
  const [thumbnailURL, setthumbnailURL] = useState(null)

  useEffect(() => {
    if (props.result) {
      if (_autoCenterOnItemChanged) {
        zoomToItemExtent(props.result)
      }
      debounceTitilerOverlay(props.result)
      const thumbnailURLForSelection = props.result?.links?.find(
        ({ rel }) => rel === 'thumbnail'
      )?.href

      // If no thumbnail available, clear immediately
      if (!thumbnailURLForSelection) {
        setthumbnailURL(null)
        return
      }

      // Preload the new image, keeping the previous one visible until ready
      const image = new Image()
      image.onload = function () {
        if (this.width > 0) {
          setthumbnailURL(thumbnailURLForSelection)
        }
      }
      image.src = thumbnailURLForSelection
    }
    // eslint-disable-next-line
  }, [props.result])

  return (
    <div
      data-testid="testPopupResult"
      className={
        _appConfig.CART_ENABLED
          ? 'popupResult popupResultCartEnabled'
          : 'popupResult'
      }
    >
      {props.result ? (
        <div className="popupResultHero">
          {thumbnailURL && (
            <div className="popupResultThumbnailContainer">
              <picture>
                <img
                  src={thumbnailURL}
                  alt="thumbnail"
                  className="popupResultThumbnail"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null // prevents looping
                    currentTarget.parentElement.parentElement.remove()
                  }}
                ></img>
              </picture>
            </div>
          )}
          <ItemHeader
            id={props.result.id}
            collection={props.result.collection}
          />
        </div>
      ) : null}
    </div>
  )
}

PopupResult.propTypes = {
  result: PropTypes.object
}

export default PopupResult
