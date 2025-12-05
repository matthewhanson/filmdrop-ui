import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import './PopupResult.css'
import { useSelector } from 'react-redux'
import { debounceTitilerOverlay, zoomToItemExtent } from '../../utils/mapHelper'

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

      const image = new Image()
      image.onload = function () {
        if (this.width > 0) {
          setthumbnailURL(thumbnailURLForSelection)
        }
      }
      image.onerror = function () {
        setthumbnailURL('/ThumbnailNotAvailable.png')
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
        <div>
          <div className="popupResultThumbnailContainer">
            {thumbnailURL ? (
              <picture>
                <img
                  src={thumbnailURL}
                  alt="thumbnail"
                  className="popupResultThumbnail"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null // prevents looping
                    currentTarget.parentElement.remove()
                  }}
                ></img>
              </picture>
            ) : null}
          </div>

          <div className="popupResultDetails">
            {_appConfig.STAC_LINK_ENABLED && (
              <div className="detailRow">
                <a
                  href={props.result?.links
                    ?.find((x) => x?.rel === 'self')
                    ?.href?.toString()}
                  target="_blank"
                  rel="noreferrer"
                  className="popupResultDetailsRowValue popupResultDetailsHrefLink"
                >
                  STAC API Item
                </a>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

PopupResult.propTypes = {
  result: PropTypes.object
}

export default PopupResult
