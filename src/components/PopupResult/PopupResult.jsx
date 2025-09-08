import React, { useEffect, useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import './PopupResult.css'
import { useSelector, useDispatch } from 'react-redux'

import { setshowEnhancedDetailsModal } from '../../redux/slices/mainSlice'
import { debounceTitilerOverlay, zoomToItemExtent } from '../../utils/mapHelper'
import { buildAutoDisplayFieldList } from '../../utils/fieldGrouping.js'
import FieldRenderer from './FieldRenderer'

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
    dispatch(setshowEnhancedDetailsModal(true))
  }, [dispatch])

  // Memoized display fields computation
  const displayFields = useMemo(() => {
    if (
      _appConfig.POPUP_DISPLAY_FIELDS &&
      _selectedCollectionData?.id &&
      _selectedCollectionData.id in _appConfig.POPUP_DISPLAY_FIELDS
    ) {
      return _appConfig.POPUP_DISPLAY_FIELDS[_selectedCollectionData.id]
    }
    // Only show auto-discovered fields if POPUP_DISPLAY_FIELDS is not configured
    if (!_appConfig.POPUP_DISPLAY_FIELDS) {
      return buildAutoDisplayFieldList(props.result)
    }
    return []
  }, [
    _appConfig.POPUP_DISPLAY_FIELDS,
    _selectedCollectionData?.id,
    props.result
  ])

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
        <div role="region" aria-label="Item details">
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
            {/* Render fields using the reusable FieldRenderer component */}
            {displayFields.map((field) => (
              <FieldRenderer
                key={field}
                field={field}
                item={props.result}
                className="detailRow"
              />
            ))}

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
  result: PropTypes.shape({
    id: PropTypes.string.isRequired,
    properties: PropTypes.object,
    collection: PropTypes.string,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        rel: PropTypes.string,
        href: PropTypes.string
      })
    )
  })
}

export default PopupResult
