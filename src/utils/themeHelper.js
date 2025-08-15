const THEME_STORAGE_KEY = 'APP_THEME_PREFERENCE'

export function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  // Fallback to dark if matchMedia is not available
  return 'dark'
}

export function calculateEffectiveTheme(userPreference) {
  switch (userPreference) {
    case 'light':
      return 'light'
    case 'dark':
      return 'dark'
    case 'system':
      return getSystemTheme()
    default:
      throw new Error(
        `Invalid theme preference: "${userPreference}". Must be 'light', 'dark', or 'system'.`
      )
  }
}

export function applyTheme(theme) {
  if (typeof document !== 'undefined') {
    const themeValue = theme === 'filmdrop' ? 'filmdrop' : `filmdrop-${theme}`
    document.documentElement.setAttribute('data-theme', themeValue)
  }
}

export function getThemeFromStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(THEME_STORAGE_KEY)
  }
  return null
}

export function saveThemeToStorage(theme) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
}

export function getNextTheme(currentTheme) {
  // Get next theme in the sequence: light → dark → light
  switch (currentTheme) {
    case 'light':
      return 'dark'
    case 'dark':
      return 'light'
    default:
      throw new Error(
        `Invalid current theme: "${currentTheme}". Must be 'light' or 'dark'.`
      )
  }
}

export function setupSystemThemeListener(callback) {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      callback(newSystemTheme)
    }

    // Use the newer addEventListener if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }

  // Return a no-op cleanup function if no listener was set up
  return () => {}
}

export function getBasemapConfig(appConfig, effectiveTheme) {
  // Return null if no BASEMAP configuration exists
  if (!appConfig.BASEMAP) {
    return null
  }

  // Check if this is single basemap mode (has url property directly)
  if (appConfig.BASEMAP.url) {
    return {
      url: appConfig.BASEMAP.url,
      attribution: appConfig.BASEMAP.attribution
    }
  }

  // Theme switching enabled and not single basemap mode - use the effective theme
  if (appConfig.THEME_SWITCHING_ENABLED === true && effectiveTheme) {
    return appConfig.BASEMAP[effectiveTheme]
  }

  // No valid basemap found for the current theme
  return null
}

export function getBrandLogoConfig(appConfig, effectiveTheme) {
  // Check if brand logo is configured
  if (!appConfig.BRAND_LOGO) {
    return null
  }

  const config = appConfig.BRAND_LOGO
  let logoImage = config.image

  // Theme-specific logo selection (only when theme switching is enabled)
  if (appConfig.THEME_SWITCHING_ENABLED === true && effectiveTheme) {
    if (effectiveTheme === 'light' && config.image_light) {
      logoImage = config.image_light
    } else if (effectiveTheme === 'dark' && config.image_dark) {
      logoImage = config.image_dark
    }
  }

  // If no valid image found, return null (do not render logo)
  if (!logoImage) {
    return null
  }

  return {
    url: config.url,
    title: config.title,
    alt: config.alt,
    image: logoImage
  }
}

function validateThemeCSS(switchingEnabled) {
  if (typeof document === 'undefined') {
    return // Skip validation in non-browser environments
  }

  let hasFilmdropRootSelector = false
  let hasFilmdropDarkThemeSelector = false
  let hasFilmdropLightThemeSelector = false

  try {
    // Check all loaded stylesheets
    for (let i = 0; i < document.styleSheets.length; i++) {
      const stylesheet = document.styleSheets[i]

      try {
        // Check all CSS rules in this stylesheet
        const rules = stylesheet.cssRules || stylesheet.rules
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j]

          if (rule.selectorText) {
            if (
              rule.selectorText.includes(':root[data-theme="filmdrop"]') ||
              rule.selectorText.includes(":root[data-theme='filmdrop']")
            ) {
              hasFilmdropRootSelector = true
            }
            if (
              rule.selectorText.includes(':root[data-theme="filmdrop-dark"]') ||
              rule.selectorText.includes(":root[data-theme='filmdrop-dark']")
            ) {
              hasFilmdropDarkThemeSelector = true
            }
            if (
              rule.selectorText.includes(
                ':root[data-theme="filmdrop-light"]'
              ) ||
              rule.selectorText.includes(":root[data-theme='filmdrop-light']")
            ) {
              hasFilmdropLightThemeSelector = true
            }
          }
        }
      } catch (e) {
        // Skip stylesheets that can't be accessed (CORS restrictions)
        continue
      }
    }
  } catch (e) {
    console.warn('Unable to validate CSS rules:', e.message)
    return
  }

  if (switchingEnabled) {
    if (!hasFilmdropDarkThemeSelector) {
      throw new Error(
        'THEME_SWITCHING_ENABLED is true but no :root[data-theme="filmdrop-dark"] CSS rule found. ' +
          'Theme switching requires :root[data-theme="filmdrop-dark"] and :root[data-theme="filmdrop-light"] selectors.'
      )
    }
    if (!hasFilmdropLightThemeSelector) {
      throw new Error(
        'THEME_SWITCHING_ENABLED is true but no :root[data-theme="filmdrop-light"] CSS rule found. ' +
          'Theme switching requires :root[data-theme="filmdrop-dark"] and :root[data-theme="filmdrop-light"] selectors.'
      )
    }
  } else {
    if (!hasFilmdropRootSelector) {
      throw new Error(
        'THEME_SWITCHING_ENABLED is false but no :root[data-theme="filmdrop"] CSS rule found. ' +
          'Single theme mode requires a :root[data-theme="filmdrop"] selector with CSS variables.'
      )
    }
  }
}

export function initializeTheme(appConfig) {
  const switchingEnabled = appConfig.THEME_SWITCHING_ENABLED === true

  validateThemeCSS(switchingEnabled)

  if (!switchingEnabled) {
    applyTheme('filmdrop')
    return {
      currentTheme: null, // Not used if not switching themes
      effectiveTheme: null, // Not used if not switching themes
      switchingEnabled: false
    }
  }

  const fallbackTheme = appConfig.THEME_DEFAULT || 'dark'
  if (!['light', 'dark'].includes(fallbackTheme)) {
    throw new Error(
      `Invalid THEME_DEFAULT: "${fallbackTheme}". Must be 'light' or 'dark'.`
    )
  }

  let currentTheme = getThemeFromStorage()

  // If no stored preference or stored preference is old 'system' value,
  // detect system theme or fall back to THEME_DEFAULT
  if (
    !currentTheme ||
    currentTheme === 'system' ||
    !['light', 'dark'].includes(currentTheme)
  ) {
    try {
      currentTheme = getSystemTheme()
    } catch (error) {
      // If system detection fails, use fallback
      currentTheme = fallbackTheme
    }
  }

  const effectiveTheme = currentTheme // No longer need calculateEffectiveTheme since we only use light/dark

  return {
    currentTheme,
    effectiveTheme,
    switchingEnabled: true
  }
}
