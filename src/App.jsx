import React, { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import './themes/theme.css'
import Content from './components/Layout/Content/Content'
import PageHeader from './components/Layout/PageHeader/PageHeader'
import UploadGeojsonModal from './components/UploadGeojsonModal/UploadGeojsonModal'
import SystemMessage from './components/SystemMessage/SystemMessage'
import { GetCollectionsService } from './services/get-collections-service'
import { LoadConfigIntoStateService } from './services/get-config-service'
import { useDispatch, useSelector } from 'react-redux'
import CartModal from './components/Cart/CartModal/CartModal'
import { InitializeAppFromConfig } from './utils/configHelper'
import Login from './components/Login/Login'
import { setauthTokenExists, setCurrentTheme } from './redux/slices/mainSlice'
import { initializeTheme, applyTheme } from './utils/themeHelper'
import L from 'leaflet'
import {
  clickedFootprintLayerStyle,
  clearLayer,
  zoomToItemExtent
} from './utils/mapHelper'
import { LayoutProvider } from './contexts/LayoutContext'

function App() {
  const dispatch = useDispatch()
  const _showUploadGeojsonModal = useSelector(
    (state) => state.mainSlice.showUploadGeojsonModal
  )
  const _showApplicationAlert = useSelector(
    (state) => state.mainSlice.showApplicationAlert
  )
  const _appConfig = useSelector((state) => state.mainSlice.appConfig)
  const _showCartModal = useSelector((state) => state.mainSlice.showCartModal)
  const _authTokenExists = useSelector(
    (state) => state.mainSlice.authTokenExists
  )
  const _currentPopupResult = useSelector(
    (state) => state.mainSlice.currentPopupResult
  )
  const _map = useSelector((state) => state.mainSlice.map)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('APP_AUTH_TOKEN')) {
      dispatch(setauthTokenExists(true))
    }
    LoadConfigIntoStateService()
    try {
      console.log('Version: ' + process.env.REACT_APP_VERSION)
    } catch (err) {
      console.error('Error logging version:', err)
    }
  }, [])

  const _collectionsData = useSelector(
    (state) => state.mainSlice.collectionsData
  )
  const _collectionsLoadError = useSelector(
    (state) => state.mainSlice.collectionsLoadError
  )

  useEffect(() => {
    if (_appConfig) {
      if (_appConfig.APP_TOKEN_AUTH_ENABLED && !_authTokenExists) {
        setShowLogin(true)
        return
      }
      setShowLogin(false)
      InitializeAppFromConfig()
      // Only load collections if not already loaded (router may have loaded them)
      // Don't retry if there was a previous load error to prevent infinite loops
      if (
        !_collectionsLoadError &&
        (!_collectionsData || _collectionsData.length === 0)
      ) {
        GetCollectionsService()
      }
    }
  }, [_appConfig, _authTokenExists, _collectionsData, _collectionsLoadError])

  useEffect(() => {
    if (_appConfig) {
      const { currentTheme, switchingEnabled } = initializeTheme(_appConfig)

      if (switchingEnabled) {
        dispatch(setCurrentTheme(currentTheme))
      }

      applyTheme(currentTheme)
    }
  }, [_appConfig])

  // Render footprint when currentPopupResult changes (for routed items)
  useEffect(() => {
    if (_currentPopupResult && _map && Object.keys(_map).length > 0) {
      // Clear previous footprint
      clearLayer('clickedSceneHighlightLayer')

      // Render new footprint
      const clickedFootprintsFound = L.geoJSON(_currentPopupResult, {
        style: clickedFootprintLayerStyle
      })
      _map.eachLayer(function (layer) {
        if (layer.layer_name === 'clickedSceneHighlightLayer') {
          clickedFootprintsFound.addTo(layer)
        }
      })

      // Auto-zoom to item extent if enabled in config
      if (_appConfig?.SHOW_ITEM_AUTO_ZOOM) {
        zoomToItemExtent(_currentPopupResult)
      }
    }
  }, [_currentPopupResult, _map, _appConfig])

  return (
    <React.StrictMode>
      <LayoutProvider>
        {_appConfig ? (
          showLogin ? (
            <div className="App">
              <Login></Login>
              {_showApplicationAlert ? <SystemMessage></SystemMessage> : null}
            </div>
          ) : (
            <div className="App">
              <PageHeader></PageHeader>
              <Content></Content>
              {_showUploadGeojsonModal ? (
                <UploadGeojsonModal></UploadGeojsonModal>
              ) : null}
              {_showApplicationAlert ? <SystemMessage></SystemMessage> : null}
              {_showCartModal ? <CartModal></CartModal> : null}
            </div>
          )
        ) : (
          <div className="App">
            <div className="appLoading" data-testid="testAppLoading"></div>
            {_showApplicationAlert ? <SystemMessage></SystemMessage> : null}
          </div>
        )}
      </LayoutProvider>
    </React.StrictMode>
  )
}

export default App
