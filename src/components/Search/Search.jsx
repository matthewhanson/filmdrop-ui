import React from 'react'
import './Search.css'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CollectionDropdown from '../CollectionDropdown/CollectionDropdown'
import VisualizationDropdown from '../VisualizationDropdown/VisualizationDropdown'
import DateTimeRangeSelector from '../DateTimeRangeSelector/DateTimeRangeSelector'
import AreaOfInterestSelector from '../AreaOfInterestSelector/AreaOfInterestSelector'
import QueryableFilters from '../QueryableFilters/QueryableFilters'
import ViewSelector from '../ViewSelector/ViewSelector'
import { useRenderableQueryables } from '../../hooks/useRenderableQueryables'
import { newSearch, clearSearch } from '../../utils/searchHelper'
import { flushAllPendingCallbacks } from '../../hooks/useDebouncedCallback'

const Search = () => {
  const { hasFields } = useRenderableQueryables()

  const handleSearchClick = () => {
    flushAllPendingCallbacks()
    newSearch()
  }

  const handleClearClick = () => {
    clearSearch()
  }

  return (
    <div className="Search" data-testid="Search">
      <div className="Search__scrollable">
        {/* Collection Section */}
        <div className="Search__section">
          <CollectionDropdown />
          <VisualizationDropdown />
        </div>

        {/* Location & Date Section */}
        <div className="Search__section">
          <h2 className="Search__section-heading">Location & Date</h2>
          <div className="Search__section-content">
            <AreaOfInterestSelector />
            <DateTimeRangeSelector />
          </div>
        </div>

        {/* Filters Section */}
        {hasFields && (
          <div className="Search__section">
            <h2 className="Search__section-heading">Filters</h2>
            <div className="Search__section-content">
              <QueryableFilters />
            </div>
          </div>
        )}
      </div>

      {/* View & Search Section */}
      <div className="Search__section Search__section--footer">
        <h2 className="Search__section-heading">View & Search</h2>
        <div className="Search__section-content">
          <ViewSelector />
          <ButtonGroup
            variant="contained"
            disableElevation
            fullWidth
            className="Search__button-group"
            aria-label="Search actions"
          >
            <Button
              className="Search__button"
              onClick={handleSearchClick}
              fullWidth
            >
              Search
            </Button>
            <Tooltip
              title="Clear search"
              placement="top"
              slotProps={{
                tooltip: {
                  className: 'tooltip-field-label'
                }
              }}
            >
              <Button
                className="Search__clear-button"
                onClick={handleClearClick}
                aria-label="Clear search"
              >
                <RestartAltIcon fontSize="medium" />
              </Button>
            </Tooltip>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}

export default Search
