import React, { useCallback, useMemo, useEffect } from 'react'
import './EnhancedDetailsModal.css'
import { useDispatch, useSelector } from 'react-redux'
import { setshowEnhancedDetailsModal } from '../../redux/slices/mainSlice'
import FieldInfoIcon from '../FieldInfoIcon/FieldInfoIcon'
import { getFieldLabel } from '../../utils/fieldFormatting.js'
import {
  groupFieldsSemantically,
  createEnhancedDisplayFieldPredicate
} from '../../utils/fieldGrouping.js'
import {
  getCollectionFieldPriorities,
  sortFieldsByPriority
} from '../../utils/fieldPriorities.js'
import EnhancedFieldRenderer from './EnhancedFieldRenderer.jsx'
import AssetDisplay from './AssetDisplay.jsx'

const EnhancedDetailsModal = () => {
  const dispatch = useDispatch()
  const currentPopupResult = useSelector(
    (state) => state.mainSlice.currentPopupResult
  )
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)

  // Memoized callback for closing modal
  const handleClose = useCallback(() => {
    dispatch(setshowEnhancedDetailsModal(false))
  }, [dispatch])

  // Handle keyboard navigation and focus management
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    // Focus the modal when it opens
    const modal = document.querySelector('[role="dialog"]')
    if (modal) {
      modal.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  if (!currentPopupResult) {
    return null
  }

  const { properties, id, collection, assets } = currentPopupResult

  // Use configuration-based field filtering
  const shouldShowField = useMemo(
    () => createEnhancedDisplayFieldPredicate(collection, _appConfig),
    [collection, _appConfig]
  )

  // Memoized expensive computations
  const groupedFields = useMemo(
    () => groupFieldsSemantically(properties, shouldShowField),
    [properties, shouldShowField]
  )

  const fieldPriorities = useMemo(
    () => getCollectionFieldPriorities(currentPopupResult),
    [currentPopupResult]
  )

  // Memoized callback for sorting fields
  const sortFields = useCallback(
    (fields) => {
      return sortFieldsByPriority(fields, fieldPriorities)
    },
    [fieldPriorities]
  )

  // Memoized callback for rendering field values using React components
  const renderField = useCallback(
    (field, value) => {
      return (
        <EnhancedFieldRenderer
          field={field}
          value={value}
          item={currentPopupResult}
        />
      )
    },
    [currentPopupResult]
  )

  // Memoized callback for rendering field groups
  const renderFieldGroup = useCallback(
    (groupName, fields) => {
      if (Object.keys(fields).length === 0) return null

      const sortedFields = sortFields(fields)

      return (
        <div
          key={groupName}
          className="field-group"
          role="group"
          aria-labelledby={`group-${groupName}`}
        >
          <h3 className="field-group-title" id={`group-${groupName}`}>
            {groupName.charAt(0).toUpperCase() + groupName.slice(1)} Fields
          </h3>
          <div className="field-list" role="list">
            {sortedFields.map(([field, value]) => (
              <div key={field} className="field-item" role="listitem">
                <div className="field-label">
                  {getFieldLabel(field, currentPopupResult)}
                  <FieldInfoIcon
                    field={field}
                    item={currentPopupResult}
                    tooltipPlacement="top-start"
                  />
                </div>
                {renderField(field, value)}
              </div>
            ))}
          </div>
        </div>
      )
    },
    [sortFields, renderField, currentPopupResult]
  )

  return (
    <div
      className="enhancedDetailsModal"
      data-testid="testEnhancedDetailsModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enhanced-details-title"
      aria-describedby="enhanced-details-content"
      tabIndex={-1}
    >
      <div
        className="enhancedDetailsModalContainerBackground"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClose()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      ></div>
      <div className="enhancedDetailsModalContainer">
        <div className="enhancedDetailsModalHeader">
          <h2 className="enhancedDetailsModalTitle" id="enhanced-details-title">
            Enhanced Details
          </h2>
          <button
            className="enhancedDetailsModalCloseButton"
            onClick={handleClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClose()
              }
            }}
            data-testid="testEnhancedDetailsModalClose"
            aria-label="Close enhanced details modal"
          >
            ×
          </button>
        </div>

        <div
          className="enhancedDetailsModalContent"
          id="enhanced-details-content"
        >
          <div className="item-header">
            <h3 className="item-id">{id}</h3>
            <p className="item-collection">Collection: {collection}</p>
          </div>

          <div className="fields-container">
            {Object.entries(groupedFields).map(([groupName, fields]) =>
              renderFieldGroup(groupName, fields)
            )}
          </div>

          {/* Data Files Section */}
          {assets && Object.keys(assets).length > 0 && (
            <div className="data-files-section">
              <h3 className="data-files-title">Assets</h3>
              <AssetDisplay assets={assets} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedDetailsModal
