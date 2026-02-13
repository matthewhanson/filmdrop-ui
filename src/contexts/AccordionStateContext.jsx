import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo
} from 'react'
import PropTypes from 'prop-types'
import { normalizeGroupName } from '../utils/fieldGrouping.js'

const AccordionStateContext = createContext(null)

export const useAccordionState = () => {
  const context = useContext(AccordionStateContext)
  if (!context) {
    throw new Error(
      'useAccordionState must be used within AccordionStateProvider'
    )
  }
  return context
}

export const AccordionStateProvider = ({ children }) => {
  const [expandedMap, setExpandedMap] = useState({})

  const isExpanded = useCallback(
    (groupName, defaultExpanded = false) => {
      const key = normalizeGroupName(groupName)
      if (key in expandedMap) {
        return expandedMap[key]
      }
      return !!defaultExpanded
    },
    [expandedMap]
  )

  const toggleGroup = useCallback((groupName, currentExpanded) => {
    const key = normalizeGroupName(groupName)
    setExpandedMap((prev) => ({
      ...prev,
      [key]: !currentExpanded
    }))
  }, [])

  const value = useMemo(
    () => ({ isExpanded, toggleGroup }),
    [isExpanded, toggleGroup]
  )

  return (
    <AccordionStateContext.Provider value={value}>
      {children}
    </AccordionStateContext.Provider>
  )
}

AccordionStateProvider.propTypes = {
  children: PropTypes.node.isRequired
}
