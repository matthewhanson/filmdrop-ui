import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setSelectedCollectionData,
  setShowZoomNotice,
  setSearchLoading,
  sethasCollectionChanged,
  setSelectedCollection,
  setQueryableFilters
} from '../../redux/slices/mainSlice'
import {
  zoomToCollectionExtent,
  clearAllLayers,
  clearMapSelection
} from '../../utils/mapHelper'
import Dropdown from '../Dropdown/Dropdown'

const CollectionDropdown = () => {
  const dispatch = useDispatch()
  const selectedCollection = useSelector(
    (state) => state.mainSlice.selectedCollection
  )
  const selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const collectionsData = useSelector((state) => state.mainSlice.collectionsData)
  const appConfig = useSelector((state) => state.mainSlice.appConfig)

  // Convert collections data to dropdown options
  const options = useMemo(() => {
    const placeholder = { value: 'selectOne', label: 'Select Collection' }

    if (!collectionsData || collectionsData.length === 0) {
      return [placeholder]
    }

    const collectionOptions = collectionsData.map(({ id, title }) => ({
      value: id,
      label: title ?? id
    }))

    // Include placeholder when no collection is selected yet to avoid
    // MUI warning about out-of-range value during the render before
    // the useEffect sets the default collection
    if (!selectedCollection) {
      return [placeholder, ...collectionOptions]
    }

    return collectionOptions
  }, [collectionsData, selectedCollection])

  // Initialize default collection on mount
  useEffect(() => {
    if (collectionsData.length === 0) return
    if (selectedCollection) return

    // Get default from config
    const defaultCollection = appConfig.COLLECTIONS?.default

    if (!defaultCollection) {
      // No default specified, use first collection
      dispatch(setSelectedCollection(collectionsData[0].id))
      return
    }

    // Check if default collection exists in available collections
    const defaultCollectionExists = collectionsData.some(
      (c) => c.id === defaultCollection
    )

    if (!defaultCollectionExists) {
      console.warn('Configuration Error: default collection not found in API')
      dispatch(setSelectedCollection(collectionsData[0].id))
    } else {
      dispatch(setSelectedCollection(defaultCollection))
    }
  }, [collectionsData, selectedCollection, appConfig, dispatch])

  // Update collection data when selection changes
  useEffect(() => {
    if (!selectedCollection) return

    const collection = collectionsData.find((c) => c.id === selectedCollection)

    if (collection) {
      const isChanging = collection.id !== selectedCollectionData?.id

      dispatch(setSelectedCollectionData(collection))
      dispatch(setShowZoomNotice(false))
      dispatch(setSearchLoading(false))

      if (isChanging) {
        zoomToCollectionExtent(collection)
      }
    }
  }, [selectedCollection, collectionsData, selectedCollectionData?.id, dispatch])

  const handleCollectionChange = (e) => {
    const newCollectionId = e.target.value

    // Mark that collection has changed
    dispatch(sethasCollectionChanged(true))

    // Update selected collection
    dispatch(setSelectedCollection(newCollectionId))

    // Clear map and filters
    clearMapSelection()
    clearAllLayers()
    dispatch(setQueryableFilters({}))
  }

  return (
    <Dropdown
      label="Collection"
      value={selectedCollection || 'selectOne'}
      onChange={handleCollectionChange}
      options={options}
    />
  )
}

export default CollectionDropdown
