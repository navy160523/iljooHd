/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

// import envs from '@/envs'
import ImageLayer from 'ol/layer/Image'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import ImageWMS from 'ol/source/ImageWMS'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'
import WMTS from 'ol/source/WMTS'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style, Text, Circle as CircleStyle } from 'ol/style'
// import TileGrid from 'ol/tilegrid/TileGrid'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { fromLonLat, get as getProjection } from 'ol/proj'

export const subLayerGroup = []

const contextPath = import.meta.env.VITE_SYSTEM_CODE.toLowerCase()
const isLocal = process.env.NODE_ENV !== 'production'

console.log('ol.js',import.meta.env)
console.log('ol.js',process.env.NODE_ENV)

/// ////////////////////////////////////////////
// let extent = [14400825.458234308, 4225256.025540899, 14412507.231754968, 4239419.221541438]
// let startResolution = 0.703125
// let startResolution = 55.324984377108194;
// const extent = [14402434.141077053, 4226891.219200822, 14412474.358187947, 4239508.298117745]
// const startResolution = 49.28546451923103
// const resolutions = new Array(26)
// for (let i = 0, ii = resolutions.length; i < ii; ++i) {
//   resolutions[i] = startResolution / Math.pow(2, i)
// }
// const tileGrid = new TileGrid({
//   extent: extent,
//   resolutions: resolutions,
// })

// 블록 layer fvlayers
const vectorSource = new VectorSource({})

const vlayers = new VectorLayer({
  id: 'block_layer',
  option: 'translate',
  visible: true,
  source: vectorSource,
  clickout: false,
  renderIntent: 'select',

  // declutter: true
})

// 지역 정보 layer
const areaSource = new VectorSource({})

const areaLayers = new VectorLayer({
  id:'area_layer',
  source: areaSource,
  style: function (feature) {
    // console.log('areaLayers style',feature)

    // const size = feature.get('features').length
    // let style = styleCache[size]
    // if (!style) {
    // styleCache[size] = style
    // }
    
    return new Style(
    //   {
    //   image: new CircleStyle({
    //     radius: 10,
    //     scale: 3,
    //     stroke: new Stroke({
    //       color: '#E1580A80',
    //       width: 10,
    //     }),
    //     fill: new Fill({
    //       color: '#E1580A',
    //     }),
    //   }),
    //   zIndex: 1,
    //   text: new Text({
    //     text: feature.count,
    //     font: '23px 나눔고딕',
    //     fill: new Fill({
    //       color: '#FFFFFF',
    //     }),
    //   }),
    // }
    )
  },
})

// tooltip layer
const tooltipVectorSource = new VectorSource({})

const tooltipLayer = new VectorLayer({
  id: 'tooltip_layer',
  option: 'translate',
  visible: false,
  source: tooltipVectorSource,
  clickout: false,
  renderIntent: 'select',
})

// tooltip line layer
const lineVectorSource = new VectorSource({})

const tooltipLineLayer = new VectorLayer({
  id: 'ttl_layer',
  visible: false,
  source: lineVectorSource,
  clickout: false,
  style: new Style({
    fill: new Fill({ color: '#00FF00', weight: 4 }),
    stroke: new Stroke({ color: '#000000', width: 2 }),
  }),
})

// Open Street Map
// const osmLayer = new TileLayer({
//   id: 'osmlayer',
//   source: new OSM(),
// })

const env =
  'fill:#808080;fillOpacity:0.7;fillStyle:fill;fillStyleSize:7;stroke:#000000;strokeDashStyle:;strokeWidth:1;maxScale:1000000;geometryType:Polygon;labelDisplayYn:Y;fontColor:#000000;fontFamily:DotumChe;fontSize:14;fontWeight:bold;labelField:gibuncode;labelMaxScale:1000000;labelMinScale:0;rotation:90;'

// 배 배치공간 레이어
const shipAreaLayers = new ImageLayer({
  id: 'layer_ship_area',
  visible: true,
  source: new ImageWMS({
    // url: isLocal ? import.meta.env.VITE_GEO_SERVER_URL : `${contextPath}/pc/map/object`,
    url: import.meta.env.VITE_GEO_SKYVIEW_SERVER_URL,
    params: {
      FORMAT: 'image/png',
      VERSION: '1.1.1',
      SRS: 'EPSG:3857', /// /gis__1
      TILED: true,
      LAYERS: ['layer_ship_area'], // layer key
      // CQL_FILTER: " id = 'D13801' "
      // CQL_FILTER: vJIBUN
    },
  }),

  zIndex: 10,

  // , opacity: 1
})

shipAreaLayers.setVisible(false)

const coordinate = 'EPSG:5187'

const naviLayers = new TileLayer({
  id: 'hhi_naviview',

  // visible: true,
  opacity: 1.0,
  source: new WMTS({
    // url: 'http://gissvc.hhi.co.kr:6080/geoserver/hhi/wms',
    url: 'https://navi.hhi.co.kr/geoserver/gwc/service/wmts',
    layer: 'navi:hhi_yard_layer_group',
    matrixSet: coordinate,
    format: 'image/png',
    projection: getProjection('EPSG:5187'),
    tileGrid: new WMTSTileGrid({
      tileSize: [256, 256],
      extent: [108147.36663105823, 210531.46593547217, 261808.90527065843, 671516.0818542728],
      origin: [108147.36663105823, 671516.0818542728],
      resolutions: [600.2403853109382, 300.1201926554691, 150.06009632773456, 75.03004816386728, 37.51502408193364, 18.75751204096682, 9.37875602048341, 4.689378010241705, 2.3446890051208524, 1.1723445025604262, 0.5861722512802131, 0.2930861256401066, 0.1465430628200533, 0.0732715314100266, 0.0366357657050133],
      matrixIds: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
    }),
    serverType: 'geoserver',
    crossOrigin: 'anonymous',
  }),
})

// 호선정보 layer
// 암벽 호선
const shipVectorSource = new VectorSource({})

const shipLayers = new VectorLayer({
  id: 'ship_layer',
  visible: true,
  source: shipVectorSource,
  clickout: false,
})

// 호선정보 temp // 회전 전의 ship 정보
// fshipLayers
// 암벽 호선
const tempVectorSource = new VectorSource({})

const tempLayers = new VectorLayer({
  id: 'temp_layer',
  visible: true,
  source: tempVectorSource,
  clickout: false,
})


export const totLayers = [
  // vlayers, // block
  // osmLayer,
  naviLayers,
  // tooltipLayer,
  // tooltipLineLayer,
  shipLayers,
  tempLayers, // 암벽 호선
  // shipAreaLayers,
  areaLayers, //장소
]
