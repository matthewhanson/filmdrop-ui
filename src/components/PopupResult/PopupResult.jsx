import React, { useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import './PopupResult.css'
import { useSelector, useDispatch } from 'react-redux'
import { processDisplayFieldValues } from '../../utils/dataHelper'
import {
  settabSelected,
  setIsEnhancedDetailsExpanded
} from '../../redux/slices/mainSlice'
import { debounceTitilerOverlay, zoomToItemExtent } from '../../utils/mapHelper'
import { getCollectionConfig } from '../../utils/configHelper'

const PopupResult = (props) => {
  const dispatch = useDispatch()
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)
  const _selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const _autoCenterOnItemChanged = useSelector(
    (state) => state.mainSlice.autoCenterOnItemChanged
  )
  const [thumbnailURL, setthumbnailURL] = useState(null)

  // Memoized callback for enhanced details button
  const handleEnhancedDetailsClick = useCallback(() => {
    dispatch(settabSelected('enhanced'))
    dispatch(setIsEnhancedDetailsExpanded(true))
  }, [dispatch])

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
                  aria-labelledby="popupResultDetailsTitle"
                >
                  STAC API Item
                </a>
              </div>
            )}
            <div className="detailRow">
              <span
                className="popupResultDetailsRowKey"
                id="popupResultDetailsTitle"
              >
                Title:
              </span>
              <span
                className="popupResultDetailsRowValue"
                aria-labelledby="popupResultDetailsTitle"
              >
                {props.result.id}
              </span>
            </div>
            {(() => {
              const popupDisplayFields = getCollectionConfig(
                _selectedCollectionData?.id,
                'popupDisplayFields'
              )
              return popupDisplayFields?.map((field) => (
                <div className="detailRow" key={field + '1'}>
                  <span className="popupResultDetailsRowKey" key={field + '2'}>
                    {field.charAt(0).toUpperCase() + field.slice(1) + ':'}
                  </span>
                  <span
                    className="popupResultDetailsRowValue"
                    key={field + '3'}
                  >
                    {field === 'eo:cloud_cover'
                      ? Math.round(props.result?.properties[field] * 100) /
                          100 +
                        ' %'
                      : processDisplayFieldValues(
                          props.result?.properties[field]
                        )}
                  </span>
                </div>
              ))
            })()}

            {/* Enhanced Details Button */}
            <div className="detailRow enhancedDetailsButtonRow">
              <button
                className="enhancedDetailsButton"
                onClick={handleEnhancedDetailsClick}
                data-testid="testEnhancedDetailsButton"
                type="button"
                aria-label="View enhanced details for this item"
              >
                View Enhanced Details
              </button>
            </div>
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
