import React from 'react'
import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'
import InfoIcon from '@mui/icons-material/Info'
import Tooltip from '@mui/material/Tooltip'
import { getFieldMetadata } from '../../utils/fieldDiscovery.js'

// Styled component for the info icon
const StyledInfoIcon = styled(InfoIcon)(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  opacity: 0.7,
  transition: 'opacity 0.2s ease',
  fontSize: 'inherit',
  '&:hover': {
    opacity: 1
  }
}))

const FieldInfoIcon = ({ field, tooltipPlacement = 'left' }) => {
  const metadata = getFieldMetadata(field)

  if (!metadata?.hasTooltip || !metadata?.tooltipContent) return null

  return (
    <Tooltip
      title={metadata.tooltipContent}
      placement={tooltipPlacement}
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: 'var(--map-info-overlay-background)',
            color: 'var(--map-info-overlay-color)',
            border: '1px solid var(--brand-accent-primary)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            maxWidth: 300,
            zIndex: 1000,
            '& .MuiTooltip-arrow': {
              color: 'var(--map-info-overlay-background)',
              '&::before': {
                border: '1px solid var(--brand-accent-primary)'
              }
            }
          }
        }
      }}
    >
      <span
        aria-label={`Information about ${field}`}
        style={{ display: 'inline-flex' }}
      >
        <StyledInfoIcon />
      </span>
    </Tooltip>
  )
}

FieldInfoIcon.propTypes = {
  field: PropTypes.string.isRequired,
  tooltipPlacement: PropTypes.oneOf([
    'bottom-end',
    'bottom-start',
    'bottom',
    'left-end',
    'left-start',
    'left',
    'right-end',
    'right-start',
    'right',
    'top-end',
    'top-start',
    'top'
  ])
}

export default FieldInfoIcon
