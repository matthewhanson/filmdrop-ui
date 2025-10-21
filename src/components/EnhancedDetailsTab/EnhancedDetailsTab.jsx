import React, { useMemo, useCallback } from 'react'
import './EnhancedDetailsTab.css'
import { useSelector, useDispatch } from 'react-redux'
import {
  groupFieldsSemantically,
  createEnhancedDisplayFieldPredicate
} from '../../utils/fieldGrouping.js'
import { groupPropertiesByExtension } from '../../utils/defaultFieldGrouping.js'
import { getCollectionFieldPriorities } from '../../utils/fieldPriorities.js'
import { getCollectionConfig } from '../../utils/configHelper.js'
import FieldGroup from './FieldGroup.jsx'
import ItemHeader from './ItemHeader.jsx'
import AssetDisplay from './AssetDisplay.jsx'
import DefaultAssetDisplay from './DefaultAssetDisplay.jsx'
import { showApplicationAlert } from '../../utils/alertHelper.js'
import {
  setCurrentPopupResult,
  setselectedPopupResultIndex
} from '../../redux/slices/mainSlice'
import PopupFooter from '../PopupFooter/PopupFooter.jsx'
import { debounceTitilerOverlay } from '../../utils/mapHelper'

const EnhancedDetailsTab = () => {
  const dispatch = useDispatch()
  const currentPopupResult = useSelector(
    (state) => state.mainSlice.currentPopupResult
  )
  const appConfig = useSelector((state) => state.mainSlice.appConfig)
  const clickResults = useSelector((state) => state.mainSlice.clickResults)
  const selectedPopupResultIndex = useSelector(
    (state) => state.mainSlice.selectedPopupResultIndex
  )
  const isEnhancedDetailsExpanded = useSelector(
    (state) => state.mainSlice.isEnhancedDetailsExpanded
  )

  const navigateToIndex = useCallback(
    (newIndex) => {
      dispatch(setselectedPopupResultIndex(newIndex))
      dispatch(setCurrentPopupResult(clickResults[newIndex]))
      debounceTitilerOverlay(clickResults[newIndex])
    },
    [clickResults, dispatch]
  )

  const handlePrevClick = useCallback(() => {
    if (selectedPopupResultIndex > 0) {
      navigateToIndex(selectedPopupResultIndex - 1)
    }
  }, [selectedPopupResultIndex, navigateToIndex])

  const handleNextClick = useCallback(() => {
    if (selectedPopupResultIndex < clickResults.length - 1) {
      navigateToIndex(selectedPopupResultIndex + 1)
    }
  }, [selectedPopupResultIndex, clickResults.length, navigateToIndex])

  if (!currentPopupResult) {
    return (
      <div className="enhancedDetailsTabEmpty">
        <span className="enhancedDetailsTabEmptyPrimaryText">
          Nothing Selected
        </span>
        <span className="enhancedDetailsTabEmptySecondaryText">
          search and click footprint on map to view details
        </span>
      </div>
    )
  }

  const { properties, id, collection, assets } = currentPopupResult
  const enhancedDisplayConfig = getCollectionConfig(
    collection,
    'enhancedDisplayConfig'
  )
  const hasEnhancedConfig = !!enhancedDisplayConfig

  // Error handling for field processing
  const handleFieldProcessingError = useCallback((error, context) => {
    console.error(`Enhanced Details ${context} error:`, error)
    showApplicationAlert(
      'error',
      `Failed to process ${context}. Please try again.`
    )
  }, [])

  // Group fields based on configuration
  const groupedFields = useMemo(() => {
    try {
      if (hasEnhancedConfig) {
        // For enhanced config, use the exact order from enhancedDisplayConfig
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
        // Fallback to semantic grouping if config is malformed
        const shouldShowField = createEnhancedDisplayFieldPredicate(collection)
        return groupFieldsSemantically(properties, shouldShowField)
      }
      return groupPropertiesByExtension(properties)
    } catch (error) {
      handleFieldProcessingError(error, 'field grouping')
      return {}
    }
  }, [
    properties,
    collection,
    enhancedDisplayConfig,
    hasEnhancedConfig,
    handleFieldProcessingError
  ])

  // Sort fields for default collections using dynamic priorities
  const sortFields = useMemo(() => {
    if (hasEnhancedConfig) {
      // Enhanced config uses exact order, no sorting needed
      return (fields) => Object.entries(fields)
    }
    // For default collections, use dynamic priorities
    const priorities = getCollectionFieldPriorities(currentPopupResult)
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
  }, [hasEnhancedConfig, currentPopupResult])

  return (
    <div
      className={`enhancedDetailsTab ${!isEnhancedDetailsExpanded ? 'collapsed' : ''}`}
      data-testid="testEnhancedDetailsTab"
    >
      <div className="enhancedDetailsTabContent">
        <ItemHeader id={id} collection={collection} />

        <div className="fields-container">
          {hasEnhancedConfig
            ? Object.entries(groupedFields).map(
                ([groupName, fields], index, array) => (
                  <React.Fragment key={groupName}>
                    <FieldGroup
                      group={[groupName, fields]}
                      sortFields={sortFields}
                      item={currentPopupResult}
                      isConfigured={true}
                    />
                    {index < array.length - 1 && (
                      <div className="group-divider" />
                    )}
                  </React.Fragment>
                )
              )
            : groupedFields.map((group, index, array) => (
                <React.Fragment key={group.name}>
                  <FieldGroup
                    group={group}
                    item={currentPopupResult}
                    isConfigured={false}
                  />
                  {index < array.length - 1 && (
                    <div className="group-divider" />
                  )}
                </React.Fragment>
              ))}
        </div>

        {assets && Object.keys(assets).length > 0 && (
          <>
            <div className="group-divider" />
            <div className="group-divider" />
            <div className="data-files-section">
              <h3 className="data-files-title">Assets</h3>
              <div className="group-divider" />
              {hasEnhancedConfig ? (
                <AssetDisplay assets={assets} />
              ) : (
                <DefaultAssetDisplay assets={assets} />
              )}
            </div>
          </>
        )}
      </div>

      {/* PopupFooter for navigation controls */}
      <PopupFooter
        currentIndex={selectedPopupResultIndex}
        totalCount={clickResults.length}
        onPrevClick={handlePrevClick}
        onNextClick={handleNextClick}
      />
    </div>
  )
}

export default EnhancedDetailsTab
