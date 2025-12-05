import React, { useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import './PopupResults.css'
import '../EnhancedDetails/EnhancedDetails.css'
import { useDispatch, useSelector } from 'react-redux'
import PopupResult from '../PopupResult/PopupResult'
import {
  setCurrentPopupResult,
  setcartItems,
  setimageOverlayLoading,
  setselectedPopupResultIndex
} from '../../redux/slices/mainSlice'
import PopupFooter from '../PopupFooter/PopupFooter.jsx'
import {
  isSceneInCart,
  numberOfSelectedInCart,
  areAllScenesSelectedInCart
} from '../../utils/dataHelper'
import { debounceTitilerOverlay } from '../../utils/mapHelper'
import {
  groupFieldsSemantically,
  createEnhancedDisplayFieldPredicate,
  normalizeGroupName
} from '../../utils/fieldGrouping.js'
import { groupPropertiesByExtension } from '../../utils/defaultFieldGrouping.js'
import { getCollectionFieldPriorities } from '../../utils/fieldPriorities.js'
import { getCollectionConfig } from '../../utils/configHelper.js'
import FieldGroup from '../EnhancedDetails/FieldGroup.jsx'
import ItemHeader from '../EnhancedDetails/ItemHeader.jsx'
import AssetDisplay from '../EnhancedDetails/AssetDisplay.jsx'
import DefaultAssetDisplay from '../EnhancedDetails/DefaultAssetDisplay.jsx'
import { showApplicationAlert } from '../../utils/alertHelper.js'

const PopupResults = (props) => {
  const dispatch = useDispatch()
  const _cartItems = useSelector((state) => state.mainSlice.cartItems)
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)
  const _currentPopupResult = useSelector(
    (state) => state.mainSlice.currentPopupResult
  )
  const _selectedPopupResultIndex = useSelector(
    (state) => state.mainSlice.selectedPopupResultIndex
  )
  const _enhancedColumns = useSelector(
    (state) => state.mainSlice.enhancedColumns
  )

  useEffect(() => {
    if (props.results.length > 0) {
      if (
        !_currentPopupResult ||
        !props.results.includes(_currentPopupResult)
      ) {
        dispatch(setselectedPopupResultIndex(0))
      }
      debounceTitilerOverlay(props.results[_selectedPopupResultIndex])
      dispatch(setCurrentPopupResult(props.results[_selectedPopupResultIndex]))
    }
    return () => {
      dispatch(setimageOverlayLoading(false))
    }
  }, [props.results, _selectedPopupResultIndex])

  useEffect(() => {
    if (props.results.length > 0) {
      dispatch(setCurrentPopupResult(props.results[_selectedPopupResultIndex]))
    }
  }, [_selectedPopupResultIndex, props.results])

  const onNextClick = useCallback(() => {
    if (_selectedPopupResultIndex < props.results.length - 1) {
      dispatch(setselectedPopupResultIndex(_selectedPopupResultIndex + 1))
    }
  }, [_selectedPopupResultIndex, props.results.length])

  const onPrevClick = useCallback(() => {
    if (_selectedPopupResultIndex > 0) {
      dispatch(setselectedPopupResultIndex(_selectedPopupResultIndex - 1))
    }
  }, [_selectedPopupResultIndex])

  function onAddRemoveSceneToCartClicked() {
    if (isSceneInCart(props.results[_selectedPopupResultIndex])) {
      dispatch(
        setcartItems(
          _cartItems.filter(
            (_cartItems) =>
              _cartItems.id !== props.results[_selectedPopupResultIndex].id
          )
        )
      )
      return
    }
    dispatch(
      setcartItems([..._cartItems, props.results[_selectedPopupResultIndex]])
    )
  }

  function onAddAllToCartClicked() {
    if (areAllScenesSelectedInCart(props.results)) {
      return
    }
    const cartPlusNewScenes = [..._cartItems]
    props.results.forEach((result) => {
      const sceneInCart = isSceneInCart(result)
      if (!sceneInCart) {
        cartPlusNewScenes.push(result)
      }
    })
    dispatch(setcartItems(cartPlusNewScenes))
  }

  // Enhanced Details
  const handleFieldProcessingError = useCallback((error, context) => {
    console.error(`Enhanced Details ${context} error:`, error)
    showApplicationAlert(
      'error',
      `Failed to process ${context}. Please try again.`
    )
  }, [])

  // Calculate enhanced display configuration once (single source of truth)
  const enhancedDisplayConfig = useMemo(() => {
    if (!_currentPopupResult) return null
    const { collection } = _currentPopupResult
    return getCollectionConfig(collection, 'enhancedDisplayConfig')
  }, [_currentPopupResult])

  const hasEnhancedConfig = useMemo(() => {
    return !!enhancedDisplayConfig
  }, [enhancedDisplayConfig])

  // Enhanced Details logic - field grouping
  const groupedFields = useMemo(() => {
    if (!_currentPopupResult) return {}
    const { properties, collection } = _currentPopupResult

    try {
      if (hasEnhancedConfig) {
        if (enhancedDisplayConfig?.property_groups) {
          const orderedGroups = {}
          enhancedDisplayConfig.property_groups.forEach((group) => {
            const groupFields = {}
            group.fields.forEach((field) => {
              if (properties[field.name] !== undefined) {
                groupFields[field.name] = properties[field.name]
              }
            })
            if (Object.keys(groupFields).length > 0) {
              orderedGroups[group.name] = groupFields
            }
          })
          return orderedGroups
        }
        const shouldShowField = createEnhancedDisplayFieldPredicate(collection)
        return groupFieldsSemantically(properties, shouldShowField)
      }
      return groupPropertiesByExtension(properties)
    } catch (error) {
      handleFieldProcessingError(error, 'field grouping')
      return {}
    }
  }, [
    _currentPopupResult,
    hasEnhancedConfig,
    enhancedDisplayConfig,
    handleFieldProcessingError
  ])

  const sortFields = useMemo(() => {
    if (!_currentPopupResult) return () => []

    if (hasEnhancedConfig) {
      return (fields) => Object.entries(fields)
    }
    const priorities = getCollectionFieldPriorities(_currentPopupResult)
    return (fields) => {
      return Object.entries(fields).sort(([a], [b]) => {
        const aIndex = priorities.indexOf(a)
        const bIndex = priorities.indexOf(b)
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    }
  }, [_currentPopupResult, hasEnhancedConfig])

  return (
    <div data-testid="testPopupResults" className="popupResultsContainer">
      {props.results.length > 0 ? (
        <div className="popupResults">
          <div className="popupHeader">
            <div className="popupHeaderTop">
              <div className="popupResultContentText">
                {props.results.length + ' scenes selected'}{' '}
                {_appConfig.CART_ENABLED &&
                numberOfSelectedInCart(props.results) > 0
                  ? '(' + numberOfSelectedInCart(props.results) + ' in cart)'
                  : null}
              </div>
            </div>
            {_appConfig.CART_ENABLED ? (
              <div className="popupHeaderBottom">
                <button
                  className={
                    areAllScenesSelectedInCart(props.results)
                      ? 'popupHeaderBottomButton popupHeaderBottomButtonDisabled'
                      : 'popupHeaderBottomButton'
                  }
                  onClick={onAddAllToCartClicked}
                >
                  Add all to cart
                </button>
              </div>
            ) : null}
          </div>
          <div
            className={
              _appConfig.CART_ENABLED
                ? 'popupResultsContent popupResultsContentCartEnabled'
                : 'popupResultsContent'
            }
            style={{ '--columns': _enhancedColumns }}
          >
            <PopupResult
              result={props.results[_selectedPopupResultIndex]}
            ></PopupResult>

            {/* Enhanced Details Section */}
            {_currentPopupResult && (
              <div className="enhancedDetailsSection">
                <ItemHeader
                  id={_currentPopupResult.id}
                  collection={_currentPopupResult.collection}
                />

                <div className="fields-container">
                  {hasEnhancedConfig
                    ? Object.entries(groupedFields).map(
                        ([groupName, fields], index, array) => {
                          const normalized = normalizeGroupName(groupName)
                          const isCore =
                            normalized === 'group-core-fields' ||
                            normalized === 'core-fields'
                          return (
                            <React.Fragment key={groupName}>
                              <FieldGroup
                                group={[groupName, fields]}
                                sortFields={sortFields}
                                item={_currentPopupResult}
                                isConfigured={true}
                                defaultExpanded={isCore}
                              />
                              {index < array.length - 1 && (
                                <div className="group-divider" />
                              )}
                            </React.Fragment>
                          )
                        }
                      )
                    : groupedFields.map((group, index, array) => (
                        <React.Fragment key={group.name}>
                          <FieldGroup
                            group={group}
                            item={_currentPopupResult}
                            isConfigured={false}
                            defaultExpanded={index === 0}
                          />
                          {index < array.length - 1 && (
                            <div className="group-divider" />
                          )}
                        </React.Fragment>
                      ))}
                </div>
                <div className="group-divider" />

                {_currentPopupResult.assets &&
                  Object.keys(_currentPopupResult.assets).length > 0 && (
                    <>
                      <div className="data-files-section">
                        <h3 className="data-files-title">Assets</h3>
                        {hasEnhancedConfig ? (
                          <AssetDisplay assets={_currentPopupResult.assets} />
                        ) : (
                          <DefaultAssetDisplay
                            assets={_currentPopupResult.assets}
                          />
                        )}
                      </div>
                    </>
                  )}
              </div>
            )}

            {_appConfig.CART_ENABLED ? (
              <div className="popupResultsBottom">
                <button
                  className="popupResultsBottomButton"
                  onClick={onAddRemoveSceneToCartClicked}
                >
                  {isSceneInCart(props.results[_selectedPopupResultIndex])
                    ? 'Remove scene from cart'
                    : 'Add scene to cart'}
                </button>
              </div>
            ) : null}
          </div>
          <PopupFooter
            currentIndex={_selectedPopupResultIndex}
            totalCount={props.results.length}
            onPrevClick={onPrevClick}
            onNextClick={onNextClick}
          />
        </div>
      ) : (
        <div className="popupResultsEmpty">
          <span className="popupResultsEmptyPrimaryText">Nothing Selected</span>
          <span className="popupResultsEmptySecondaryText">
            search and click footprint on map to view details
          </span>
        </div>
      )}
    </div>
  )
}

PopupResults.propTypes = {
  results: PropTypes.array
}

export default PopupResults
