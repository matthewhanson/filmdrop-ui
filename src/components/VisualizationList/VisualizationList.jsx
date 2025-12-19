import React, { useMemo } from 'react'
import './VisualizationList.css'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedVisualization } from '../../redux/slices/mainSlice'
import { getCollectionVisualizations } from '../../utils/configHelper'
import { router } from '../../router'

const VisualizationList = () => {
  const dispatch = useDispatch()
  const _selectedCollectionData = useSelector(
    (state) => state.mainSlice.selectedCollectionData
  )
  const _selectedVisualization = useSelector(
    (state) => state.mainSlice.selectedVisualization
  )
  const _currentPopupResult = useSelector(
    (state) => state.mainSlice.currentPopupResult
  )

  const { visualizations, visualizationKeys } = useMemo(() => {
    return _selectedCollectionData
      ? getCollectionVisualizations(_selectedCollectionData.id)
      : {
          visualizations: null,
          visualizationKeys: []
        }
  }, [_selectedCollectionData])

  const onVisualizationClicked = (visualizationKey) => {
    dispatch(setSelectedVisualization(visualizationKey))

    // Update URL if user is viewing an item
    if (
      _currentPopupResult &&
      _currentPopupResult.collection &&
      _currentPopupResult.id
    ) {
      router.navigate({
        to: '/item/$collectionId/$itemId/{-$visualizationId}',
        params: {
          collectionId: _currentPopupResult.collection,
          itemId: _currentPopupResult.id,
          visualizationId: visualizationKey
        }
      })
    }
  }

  return (
    <div className="VisualizationList">
      <div className="VisualizationListTitle">
        <span className="VisualizationListTitleText">Visualizations</span>
      </div>
      <div className="VisualizationListItems">
        {visualizationKeys.map((key) => {
          const vis = visualizations[key]
          const displayText = vis?.title || key
          const isSelected = _selectedVisualization === key
          return (
            <div className="VisualizationListItem" key={key}>
              <label className="VisualizationListItemContainer">
                {displayText}
                <input
                  type="radio"
                  name="visualization"
                  checked={isSelected}
                  onChange={() => onVisualizationClicked(key)}
                ></input>
                <span className="VisualizationListRadio"></span>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VisualizationList
