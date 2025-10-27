import { React, useState, useEffect } from 'react'
import './CollectionDropdown.css'
import { Stack } from '@mui/material'
import Grid from '@mui/material/Grid'
import NativeSelect from '@mui/material/NativeSelect'
import { useDispatch, useSelector } from 'react-redux'
import {
  setSelectedCollectionData,
  setShowZoomNotice,
  setSearchLoading,
  sethasCollectionChanged,
  setSelectedCollection
} from '../../redux/slices/mainSlice'
import {
  zoomToCollectionExtent,
  clearAllLayers,
  clearMapSelection
} from '../../utils/mapHelper'

const Dropdown = () => {
  const _selectedCollection = useSelector(
    (state) => state.mainSlice.selectedCollection
  )
  const _selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const dispatch = useDispatch()
  const [collectionId, setCollectionId] = useState(_selectedCollection)
  const _collectionsData = useSelector(
    (state) => state.mainSlice.collectionsData
  )
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)

  useEffect(() => {
    if (_collectionsData.length > 0) {
      if (_selectedCollection !== 'Select Collection') {
        setCollectionId(_selectedCollection)
        return
      }
      // Config is already normalized, so we only need to check COLLECTIONS.default
      const defaultCollection = _appConfig.COLLECTIONS?.default
      if (!defaultCollection) {
        setCollectionId(_collectionsData[0].id)
        return
      }
      const defaultCollectionFound = !!_collectionsData.find(
        (o) => o.id === defaultCollection
      )
      if (!defaultCollectionFound) {
        console.log('Configuration Error: default collection not found in API')
        setCollectionId(_collectionsData[0].id)
      } else {
        setCollectionId(defaultCollection)
      }
    }
  }, [_collectionsData])

  useEffect(() => {
    const selectedCollection = _collectionsData?.find(
      (e) => e.id === collectionId
    )
    if (selectedCollection) {
      dispatch(setSelectedCollection(collectionId))
      dispatch(setSelectedCollectionData(selectedCollection))
      dispatch(setShowZoomNotice(false))
      dispatch(setSearchLoading(false))
      if (selectedCollection !== _selectedCollectionData) {
        zoomToCollectionExtent(selectedCollection)
      }
    }
  }, [collectionId])

  function onCollectionChanged(e) {
    dispatch(sethasCollectionChanged(true))
    setCollectionId(e.target.value)
    clearMapSelection()
    clearAllLayers()
  }

  function formatDate(dateString) {
    return dateString ? dateString.split('T')[0] : null
  }

  return (
    <Stack>
      <label htmlFor="collectionDropdown">Collection</label>
      <Grid container alignItems="center">
        <Grid size="grow">
          <NativeSelect
            id="collectionDropdown"
            value={collectionId}
            label="Collection"
            onChange={(e) => onCollectionChanged(e)}
          >
            <option value="selectOne" disabled={true}>
              Select Collection
            </option>
            {_collectionsData &&
              _collectionsData.map(({ id, title }) => (
                <option key={id} value={id}>
                  {title ?? id}
                </option>
              ))}
          </NativeSelect>
        </Grid>
      </Grid>
      {_selectedCollectionData?.extent?.temporal && (
        <div className="collectionRangeText">
          <span>Extent:&nbsp;</span>
          {formatDate(_selectedCollectionData.extent.temporal.interval[0][0]) ||
            'No Lower Limit'}{' '}
          to{' '}
          {formatDate(_selectedCollectionData.extent.temporal.interval[0][1]) ||
            'Present'}
        </div>
      )}
    </Stack>
  )
}

export default Dropdown
