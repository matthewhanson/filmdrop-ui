import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  setCurrentTheme,
  setEffectiveTheme
} from '../../redux/slices/mainSlice'
import {
  getNextTheme,
  applyTheme,
  saveThemeToStorage
} from '../../utils/themeHelper'
import SunIcon from '../../assets/sun-icon.svg?react'
import MoonIcon from '../../assets/moon-icon.svg?react'
import './ThemeSwitcher.css'

const ThemeSwitcher = () => {
  const dispatch = useDispatch()
  const currentTheme = useSelector((state) => state.mainSlice.currentTheme)

  const handleThemeSwitch = () => {
    // Get the next theme in the cycle
    const nextTheme = getNextTheme(currentTheme)

    // Update Redux state (effectiveTheme is same as currentTheme now)
    dispatch(setCurrentTheme(nextTheme))
    dispatch(setEffectiveTheme(nextTheme))

    // Apply theme to DOM
    applyTheme(nextTheme)

    // Save preference to localStorage
    saveThemeToStorage(nextTheme)
  }

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <SunIcon />
      case 'dark':
        return <MoonIcon />
      default:
        return <MoonIcon />
    }
  }

  const getThemeLabel = () => {
    switch (currentTheme) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      default:
        return 'Dark mode'
    }
  }

  return (
    <button
      className="theme-switcher"
      onClick={handleThemeSwitch}
      title={`Current: ${getThemeLabel()}. Click to switch themes.`}
      aria-label={`Switch theme. Currently ${getThemeLabel()}`}
      data-testid="theme-switcher-button"
    >
      <span className="theme-switcher-icon" aria-hidden="true">
        {getThemeIcon()}
      </span>
    </button>
  )
}

export default ThemeSwitcher
