<script setup>
import { nextTick, reactive, watch, computed } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import Map from 'ol/Map'
import View from 'ol/View'
import Overlay from 'ol/Overlay'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import ImageCanvas from 'ol/source/ImageCanvas'
import { getRenderPixel } from 'ol/render'
import ImageLayer from 'ol/layer/Image'
import Feature from 'ol/Feature'
import { Style, Fill, Stroke, Circle as CircleStyle, Text, Icon, RegularShape } from 'ol/style'
import { defaults } from 'ol/control'
import { Point, LineString, Polygon } from 'ol/geom'
import GeoJSON from 'ol/format/GeoJSON'
import { get as getProjection, transform, toLonLat, fromLonLat, Projection } from 'ol/proj'
import { easeOut } from 'ol/easing'
import { unByKey } from 'ol/Observable'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'

import { totLayers } from '@/plugins/ol'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IButtonList from '@/components/IButtonList.vue'
import { useRouter } from 'vue-router'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { commonDownloadFilesApi } from '@hiway/api/commonFileApi'
import { useUserStore } from '@hiway/stores/user'

const emit = defineEmits(['upData'])
const dialog = ref(false)
const propsData = ref([])
let lotationRange = 0
const imgUrlTemp = ref([]) //이미지 데이터소스

// 팝업이벤트
const carouselRef = ref(null)
const currentSlide = ref(0)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const router = useRouter()

//=====GIS====================================================================
// filter

const [
  naviLayers,
  shipLayers,
  tempLayers, // 암벽 호선
  areaLayers, //장소
] = totLayers

// Main 지도 선언
var transportMap = null

/**
 * 좌표
 * 5187  5176  -->>   4326  -- >> 3857
 * 5187  // geoserver (Geoserver에서 지도 제공시 사용되는 좌표)
 * 5176  // legacy (오라클 DB에 저장된 좌표값의 좌표 code, e.g. 블록, 호선, 지번 등)
 * 4326  // 표준 (일반적 지도의 표준좌표)
 * 3857  // OPENLAYERS 에서 주로 사용되는 좌표
 */

// 본공장 [129.4346655096387, 35.52086094766955] zoom 14.5
//해양 [129.4067622245301, 35.47818446202955] zoom 15.8
// const mapCenter3857 = [14408934.4, 4234680.53] // [129.43766, 35.51932]  // 최초 OPen시 사용자의 관리대상 yard가 없을때 지도의 default value
const mapCenter = [129.43869620297036, 35.52119574264443]

// projection 목록 // 5176
const projCode = {
  'EPSG:5176':
    '+proj=tmerc +lat_0=38 +lon_0=129.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43',
  'EPSG:5187':
    '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  'EPSG:3857':
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
}

// 좌표계 정의
const projDefs = function () {
  Object.keys(projCode).forEach(function (key) {
    // 브라우저 호환성 - ie9~, chrome
    proj4.defs(key, projCode[key])
    register(proj4)
  })
}

projDefs() // 5176 좌표 추가

const initZoom = 14.6 //15.384173726897865 // open시 zoom 배율
const textZoom = 17 // block text font 기본 사이즈
const textZoomLarge = 15 // block text font 키우기
const setZoom = ref(18) //ref(15.384173726897865) // default zoom level
const zoomLevelRightClick = 0 // context 박스 줌아웃시 삭제
const thinLineWidth = 0.2 // 사각 block 가늘게 테두리
const LineWidth1 = 1 // 사각 block 가늘게 테두리
const unselectedLineWidth = 0.5 // 선택안된 block 테두리 굵기
const selectedLineWidth = 2 // 선택된 block 테두리 굵기

const transNO10 = '1' // 도형 투명도 (0: 불투명)
const transNO9 = '0.9'
const transNO8 = '0.8'
const transNO7 = '0.7'
const transNO2 = '0.2'
const transNO6 = '0.6'
const transNO0 = '0.9'

// Block Color List //
const colorEmpty = 'rgba(255,255,255,0)' //
const color4Box = 'rgba(255,255,255,' + transNO2 + ')' // 사각 형상 block 생상
const colorDefault = 'rgba(180,180,180,' + transNO0 + ')' // 형상 block Default Color
const colorYellow = 'rgba(255,255,0,' + transNO0 + ')' // 지번 선택 색상 노랑
const colorYellow2 = 'rgba(255,255,190,' + transNO0 + ')' // 지번 선택 색상 노랑
const colorDarkBlue = 'rgba(0,0,60,' + transNO10 + ')' // 화면에서 사용되는 다크블루
//
const colorBlack = 'rgba(0,0,0,' + transNO10 + ')'
const colorBlack2 = 'rgba(0,0,0,' + transNO10 + ')'
const colorWhite = 'rgba(255,255,255,' + transNO0 + ')'
const colorGrey = 'rgba(255,255,255,' + transNO7 + ')' // 호선색상

const rotated = false
const blockLayerTextShowYn = true // 기본 visible 설정 (default )
const fontstyle = ' 나눔고딕'

// Block Memo Size : BMS
const sizeMemoText = '18.2px' + fontstyle // 18
const supertinyfont = '5px' + fontstyle
const tinyfont = '7px' + fontstyle //3.5
const xsmallfont = '9px' + fontstyle // 18
const smallfont = '11px' + fontstyle // 18
const regularfont = '12.5px' + fontstyle // 19, 20
const largefont = '18px' + fontstyle // 21

const mapView = ref(null)

const area0 = ref([]) //장소 레벨0 데이터 저장
const area1 = ref([]) //장소 레벨1 데이터 저장
const area2 = ref([]) //장소 레벨2 데이터 저장
const area3 = ref([]) //장소 레벨3 데이터 저장
const area4 = ref([]) //장소 레벨4 데이터 저장
const areas = ref([]) //현재 장소 레벨
const areaLoc = ref([]) //조직유형별 장소 데이터
const selectLoc = ref('') //select 장소 데이터
const areaAsgn = ref([]) //안전팀 리스트 데이터
const areaTeam = ref(null) //안전팀 데이터 저장
const areaLv = ref('4') //현재 레벨
const areaOrg = ref('HHIZ012') //현재 조직유형 기본:전사
let scale = 0.4 //검정색 점 크기
const comParams = ref({
  //공통 조회 변수
  CMPNY_DIV: '',
  OCCUR_FROM: '',
  OCCUR_TO: '',
})

const overlay = ref()
const infoData = ref({
  REL_DEPT_NM: '',
})

// 좌표 변환
function trans5176To3857(coordArray, ffrom, tto) {
  const returnCoord = []
  for (let i = 0, l = coordArray.length; i < l; i++) {
    const coord = coordArray[i].split(',')
    var dle = []
    coord.forEach(function (item) {
      dle.push(parseFloat(item ? item : 0))
    })

    returnCoord.push(transform(dle, ffrom === undefined ? 'EPSG:5176' : ffrom, tto === undefined ? 'EPSG:3857' : tto))
  }

  return returnCoord
}

const trans5176To5187 = (coordArray, ffrom, tto) => {
  const returnCoord = []
  for (let i = 0, l = coordArray.length; i < l; i++) {
    const coord = coordArray[i].split(',')
    var dle = []
    coord.forEach(function (item) {
      dle.push(parseFloat(item ? item : 0))
    })

    returnCoord.push(proj4(ffrom === undefined ? 'EPSG:5176' : ffrom, tto === undefined ? 'EPSG:5187' : tto, dle))
  }

  return returnCoord
}

// coordinate 좌표로 feature 생성
function getFeatureFromCoord(geomType, coord) {
  const shape = {
    Point: new Point(coord),
    Polygon: new Polygon([coord]), // MultiPoint
  }

  return new Feature({
    geometry: shape[geomType],
  })
}

function getFeatureFromBox(box) {
  // 5176 이 들어오고 있다.
  const coord = getPolygonFromBox(box)
  const transCoord = trans5176To5187(coord) //trans5176To3857(coord)

  return getFeatureFromCoord('Polygon', transCoord)
}

function getPolygonFromBox(box) {
  const polygon = box.split(';')

  polygon.push(polygon[0])

  return polygon
}

// 안벽 호선정보 조회
const getShipFromQuay = async () => {
  // T72BB085 table에 Manual 이동된 블록 정보가 저장되고
  // 그외는 T72BB080 의 안벽 정보에 따라 display 된다.
  // T72BB080 안벽 ship 그리는 위치 및 angle정보를 포함한다.

  let response = await commonSearchApi({ queryId: 'GIS_SEARCH_QUAY', param: {} })

  response = response.ORESULT_CUR

  let features = []
  let feature = null
  shipLayers.getSource().clear()
  tempLayers.getSource().clear()

  for (var i in response) {
    try {
      feature = getFeatureFromBox(response[i]['CTIPOINTA'])

      // console.log('getShipFromQuay feature',feature)
      feature.ship = response[i].SHIP
      feature.block = response[i].SHPDES
      feature.itemdescr =
        response[i].PLNST === null ||
        response[i].PLNST === undefined ||
        response[i].PLNST === '' ||
        response[i].PLNST === ' '
          ? ''
          : response[i].PLNST + '~' + response[i].PLNFI
      feature.text = ''
      feature.type = 'ship'
      feature.quay = response[i]['QUAY']
      feature.sign = response[i]['SIGN']
      feature.rcenter = response[i]['CTIPOINTB']
      feature.angle = response[i]['ANGLE']

      feature.setStyle(featureStyler(feature, unselectedLineWidth, colorBlack, colorWhite))

      if (feature) {
        features.push(feature)
      }
    } catch (error) {
      console.log(error)
    }
  }
  tempLayers.getSource().addFeatures(features)
  turnTheShips()
}

// 호선정보를 각 배치된 안벽의 각에 맞추어 회전 시켜존다.
function turnTheShips() {
  shipLayers.getSource().clear()
  var features = tempLayers.getSource().getFeatures()
  var rCenter = []
  var currentQuay = ''
  var oldQuay = ''

  for (var i in features) {
    var curFeature = features[i]
    var boxPosition = curFeature.getGeometry().getCoordinates()
    var marker = new Polygon([[]])
    var angle = curFeature.angle
    var currentCenter = []

    // if (curFeature.quay !== null) {
    curFeature.rcenter.split(',').forEach(function (item) {
      currentCenter.push(parseFloat(item))
    })

    // }
    marker.setCoordinates(boxPosition)
    var featureMarker = new Feature({
      name: 'Marker',
      geometry: marker,
    })
    featureMarker.ship = curFeature.ship
    featureMarker.block = curFeature.block.substr(5)
    featureMarker.itemdescr = curFeature.itemdescr
    featureMarker.text = 'zzzzzzz' // curFeature.text
    featureMarker.curpro_new = '00000' // '' 을 넣어야 tooltip 이 나온다.
    featureMarker.type = 'ship'
    featureMarker.sign = curFeature.sign
    featureMarker.sign = curFeature.sign

    shipLayers.getSource().addFeature(featureMarker)
    featureMarker.setStyle(featureStyler(featureMarker, LineWidth1, colorBlack, colorGrey))

    if (featureMarker.sign === 'S') {
      var thisisCenter = featureMarker.getGeometry().getExtent()
      var X = thisisCenter[0] + (thisisCenter[2] - thisisCenter[0]) / 2
      var Y = thisisCenter[1] + (thisisCenter[3] - thisisCenter[1]) / 2
      var centerOfFeature = [X, Y]
      marker.rotate((180 * Math.PI) / 180, centerOfFeature)
    }

    // if (curFeature.quay !== null) {
    marker.rotate(
      (parseFloat(angle) * Math.PI) / 180,
      proj4('EPSG:5176', 'EPSG:5187', currentCenter)

      // transform(currentCenter, 'EPSG:5176', 'EPSG:3857'),
    )

    // }
  }
  tempLayers.getSource().clear()
}

var f_text = ''

// featureStyler, 외곽선굵기, 라인색상, 색상값, 선종류, 선Clear
function featureStyler(feature, lineWidth, lineColor, colorChangeType, strokeLineStyle, LineClear, transparent) {
  var forcedlineWidth = lineWidth

  // 거리 / 면적 측정시
  if (feature.id_ === 'line' && feature.ship === undefined) {
    return new Style({
      fill: new Fill({ color: 'rgba(255,255,255,' + transNO8 + ')' }),
      stroke: new Stroke({
        color: 'rgba(102,178,255,1)',
        width: 5,
        lineJoin: 'round',
      }),
      zIndex: 1,
      text: new Text({
        font: '23px' + fontstyle,
        overflow: true,
        fill: new Fill({ color: 'rgba(0,0,0,1)' }),
        text: '[' + feature.block + ']',
      }),

      // text: map.getView().getZoom() > 12 ? feature.ship : ' '
    })
  } else if (feature.transparent !== undefined && feature.transparent === true) {
    // 투명 블록들
    return new Style({
      fill: new Fill({ color: colorEmpty }),
      stroke: new Stroke({
        color: 'rgba(255,255,255,0)',
        width: 0.1,
        lineJoin: 'round',
      }),
      zIndex: 1,
      opacity: 0.1,
    })
  } else {
    var featureColor = getColor(feature, colorChangeType)
    var newZoomLevel = transportMap.getView().getZoom()

    var newfont = '14px' + fontstyle

    // if (newZoomLevel > textZoomLarge) {newfont = '28px' + fontstyle}
    if (newZoomLevel > textZoomLarge) {
      newfont = largefont
    } else if (newZoomLevel > 18) {
      newfont = regularfont
    } else if (newZoomLevel > 16) {
      newfont = smallfont
    } else {
      newfont = tinyfont
    }
    if (feature.type === 'block_memo') {
      f_text =
        feature.itemdescr === undefined ||
        feature.itemdescr === '' ||
        feature.itemdescr === null ||
        feature.itemdescr === ' '
          ? ''
          : feature.itemdescr // '';
    } else {
      f_text =
        (feature.type === 'block_memo' ? '' : feature.ship + '\n' + feature.block) +
        (feature.itemdescr === undefined ||
        feature.itemdescr === '' ||
        feature.itemdescr === null ||
        feature.itemdescr === ' '
          ? ''
          : '\n' + feature.itemdescr) +
        (feature.blktrans === undefined ||
        feature.blktrans === '' ||
        feature.blktrans === null ||
        feature.blktrans === ' '
          ? ''
          : '\n' + feature.blktrans) +
        (feature.gccrane === undefined || feature.gccrane === '' || feature.gccrane === null || feature.gccrane === ' '
          ? ''
          : '\n' + feature.gccrane) +
        (feature.pe_plan === undefined || feature.pe_plan === '' || feature.pe_plan === null || feature.pe_plan === ' '
          ? ''
          : '\n' + feature.pe_plan) +
        (feature.datetext === undefined ||
        feature.datetext === '' ||
        feature.datetext === null ||
        feature.datetext === ' '
          ? ''
          : '\n' + feature.datetext) // '';
      if (feature.type !== undefined && feature.type === 'ship') {
        f_text = feature.ship
      }
    }

    f_text = feature.text === '' ? '' : f_text
    if (!blockLayerTextShowYn && feature.type !== 'ship') {
      f_text = ''
    }

    if (strokeLineStyle === 'dot') {
      lineWidth = unselectedLineWidth // selectedLineWidth
      strokeLineStyle = strokeDotStyle
    } else {
      strokeLineStyle = [0, 0]
    }

    if (feature.style_ !== null && LineClear !== 'Y') {
      // 'Y'가 아니면 살려줌

      // 라인 유지
      if (feature.except_today !== '') {
        // 금일착수
        lineWidth = selectedLineWidth
        lineColor = colorDarkBlue
      }
      if (feature.except_dot !== '' && feature.except_dot === 'dot') {
        // dot
        // dot
        lineWidth = unselectedLineWidth // selectedLineWidth
        strokeLineStyle = strokeDotStyle
      }
      if (feature.datetext !== '') {
        lineWidth = selectedLineWidth
        lineColor = colorDarkBlue
      }
    }

    if (feature.type === 'block_memo' || feature.type === 'ship') {
      lineWidth = forcedlineWidth
      lineColor = colorBlack
    }

    if (feature.type === 'ship') {
      if (newZoomLevel > 16.5) {
        newfont = largefont
      } else if (newZoomLevel < 16.0) {
        newfont = tinyfont
      } else {
        newfont = regularfont
      }
    }

    var v_text = newZoomLevel > (feature.type !== undefined && feature.type === 'ship' ? 15 : text_zoom) ? f_text : ' '

    return new Style({
      fill: new Fill({ color: featureColor }),
      stroke: new Stroke({
        color: lineColor,
        width: lineWidth,
        lineJoin: 'square',
        lineDash: strokeLineStyle,
      }),
      zIndex: 1,
      text: new Text({
        font: newfont,
        overflow: true,
        fill: new Fill({ color: 'rgba(0,0,0,1)' }),
        text: v_text,
      }),
    })
  }
}

// 블록 색상
// changeColor  : 공정에 따른 색상으로 변경
// stayColor    : 현재 주어진 값에 따른 색상으로 유지 (e.g. 선택된 블록 노랑...)
function getColor(feature, colorChangeType) {
  var color_rgb = ''
  if (colorChangeType === 'stayColor') {
    color_rgb = feature.style_.fill_.color_.toString()
  } else if (colorChangeType === 'changeColor') {
    var curpro = feature.curpro_new
    curpro = curpro == null ? '' : curpro
    if (baseColorGroup === '0') {
      // 표시없음
      return colorDefault
    } else if (baseColorGroup === '1' || baseColorGroup === '3') {
      // 현공정
      curpro = curpro.length > 2 ? curpro.substring(1, 2) : ''
    } else if (baseColorGroup === '2') {
      // 후공정
      curpro = curpro.length > 10 ? curpro.substring(11, 12) : ''
    }
    if (curpro === '') {
      // 사각형 형태는 안보이게 처리
      color_rgb = color4Box
    } else if (curpro === 'B') {
      // 중조립
      color_rgb = 'rgba(144,238,144,' + transNO0 + ')'
    } else if (curpro === 'C') {
      // 조립
      color_rgb = 'rgba(154,205,50,' + transNO0 + ')'
    } else if (curpro === 'F') {
      // 선행의장
      color_rgb = 'rgba(135,206,250,' + transNO0 + ')'
    } else if (curpro === 'G') {
      // 선 PE
      color_rgb = 'rgba(30,144,255,' + transNO0 + ')'
    } else if (curpro === 'H') {
      // 선행도장
      color_rgb = 'rgba(238,130,238,' + transNO0 + ')'
    } else if (curpro === 'K') {
      // 후PE1
      color_rgb = 'rgba(255,165,0,' + transNO0 + ')'
    } else if (curpro === 'L') {
      // 후PE2
      color_rgb = 'rgba(205,92,92,' + transNO0 + ')'
    } else if (curpro === 'N') {
      // 탑재
      color_rgb = 'rgba(255,0,0,' + transNO0 + ')'
    } else {
      color_rgb = colorDefault // 디폴드 줄까? old_color 가질까?
    }
  } else {
    color_rgb = colorChangeType // 지정색상 표시
  }

  return color_rgb
}

// zoom level 변화에 따른 text 값 설정
const checkZoom = () => {
  // noneOverlay()

  const newZoomLevel = parseFloat(transportMap.getView().getZoom())

  setZoom.value = newZoomLevel

  // 호선정보 style 변경
  const shipFeatures = shipLayers.getSource().getFeatures()

  for (const i in shipFeatures) {
    shipFeatures[i].setStyle(featureStyler(shipFeatures[i], LineWidth1, colorBlack, 'stayColor'))
  }
}

const currentFeature = ref()
const relInfo = ref()

const zoomIn = () => {
  setZoom.value = setZoom.value + 0.3
  transportMap.getView().setZoom(setZoom.value)
  checkZoom()
}

const zoomOut = () => {
  setZoom.value = setZoom.value - 0.3
  transportMap.getView().setZoom(setZoom.value)
  checkZoom()
}

//=====GIS====================================================================

// ⭐ 이미지 가져오기
function getMapImg(name) {
  return new URL(`/src/assets/images/dashboard/${name}.png`, import.meta.url).href
}

// screen expansion 확장 여부
const screenExpansion = ref(false)

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    close()
  }
}

const close = () => {
  // 지도 초기화
  if (transportMap) {
    transportMap.setTarget(null) // 지도와 연결된 DOM 해제
    transportMap = null // 지도 객체 해제
  }

  dialog.value = false
}

const openPopup = async (popupParam) => {
  let areaFeatures = []
  let areaFeature = null
  let mapCenter4326 = null //지도의 중심 경위도
  if (popupParam.mapCenterFlag === 'A') {
    mapCenter4326 = [129.43882622453094, 35.521259828307265] //본공장 중심 경위도
  } else {
    mapCenter4326 = [129.40802821689408, 35.49154954675001] //해양 중심 경위도
  }

  dialog.value = true

  await nextTick()

  const view = new View({
    center: proj4('EPSG:4326', 'EPSG:5187', mapCenter4326),
    zoomFactor: 2,
    zoom: initZoom, //isDefaultCoords ? 15 : initZoom,
    maxZoom: 20,
    minZoom: 14,
    rotation: -Math.PI / 2, //-180도 회전
    enableRotation: true,
  })

  relInfo.value = document.getElementById('info')

  // 지도 base 값설정
  transportMap = new Map({
    controls: defaults({
      attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
        collapsible: false,
      }),
      zoom: false,
      rotate: true,
    }),
    target: 'mapOL',
    layers: totLayers, // 각종 layer들 모음
    view: view, // 지도의 기본 view 정보
  })

  transportMap.getAllLayers().forEach((layer) => {
    if (layer.get('id') === 'area_layer') {
      // transportMap.removeLayer(layer)
      layer.getSource().clear()
    }
  })
  for (let i = 0; i < popupParam.length; i++) {
    areaLayers.getSource().clear()
    let point = new Point(
      proj4('EPSG:4326', 'EPSG:5187', [parseFloat(popupParam[i].LONGITUDE), parseFloat(popupParam[i].LATITUDE)])
    )
    areaFeature = new Feature(point)

    if (popupParam[i].FLAG) {
      const outerGlow1 = new Style({
        image: new CircleStyle({
          radius: 12,
          fill: new Fill({
            color: '#FFFF99', // 더 진한 파란색 (Indigo 400 계열)
          }),
          stroke: new Stroke({
            color: '#FFFF99', // 테두리는 한 톤 더 진하게
            width: 1,
          }),
        }),
        zIndex: 0,
      })

      // const outerGlow2 = new Style({
      //   image: new CircleStyle({
      //     radius: 18,
      //     stroke: new Stroke({
      //       color: 'rgba(61, 90, 254, 0.3)', // 중간 파랑
      //       width: 4,
      //     }),
      //     fill: new Fill({ color: 'rgba(61, 90, 254, 0.25)' }), // 💡 fill 추가
      //   }),
      //   zIndex: 1,
      // })

      // const innerCircle = new Style({
      //   image: new CircleStyle({
      //     radius: 14,
      //     fill: new Fill({ color: 'rgba(61, 90, 254, 0.3)' }), // 진한 파랑
      //     stroke: new Stroke({
      //       color: 'rgba(61, 90, 254, 0.8)', // 진한 파랑 테두리
      //       width: 1,
      //     }),
      //   }),
      //   zIndex: 2,
      // })
      const innerCircleStyle = new Style({
        image: new CircleStyle({
          radius: 10,
          scale: scale,
          stroke: new Stroke({
            color: '#4D24DE', // 진하고 선명한 파란 테두리 (blue-800)
            width: 2,
          }),
          fill: new Fill({
            color: '#4D24DE', // 밝고 선명한 파란 내부 (sky-500)
          }),
        }),
        zIndex: 3,
      })
      areaFeature.setStyle([outerGlow1, innerCircleStyle])
      //areaFeature.setStyle([outerGlow1, outerGlow2, innerCircle, innerCircleStyle])
    } else {
      //안쪽 테두리
      const innerCircleStyle = new Style({
        image: new CircleStyle({
          radius: 10,
          scale: scale,
          stroke: new Stroke({
            color: '#4D24DE', // 더 밝고 푸른 테두리 (indigo-800)
            width: 3,
          }),
          fill: new Fill({
            color: '#4D24DE', // 선명한 파란색 내부 (sky-500 계열)
          }),
        }),
        zIndex: 1,
      })
      areaFeature.setStyle(innerCircleStyle)
    }

    areaFeatures.push(areaFeature)
    areaLayers.getSource().addFeatures(areaFeatures) //점 표시
  }

  getShipFromQuay() // 안쪽 호선 정보 조회
  // overlay.value = new Overlay({
  //   element: document.getElementById('locPoint'),
  //   className: 'ol ol-overlay-container ol-selectable',
  // })
  // transportMap.addOverlay(overlay.value)
  //overlay.value.setPosition(proj4('EPSG:4326', 'EPSG:5187', mapCenter4326))

  //깜빡거리는문제 수정
  window.addEventListener('resize', () => {
    transportMap.updateSize()
  })

  // 마우스 이동시 현재 좌표를 보여준다.
  transportMap.on('pointermove', function (evt) {
    let hit = transportMap.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
      return true
    })
    transportMap.getTargetElement().style.cursor = hit ? 'pointer' : ''
  })
  // 우클릭 context open
  // transportMap.getViewport().addEventListener('contextmenu', function (evt) {
  //   //console.log('contextmenu',evt)
  //   evt.preventDefault()

  //   const feature = transportMap.forEachFeatureAtPixel(transportMap.getEventPixel(evt), function (feature, layer) {
  //     return feature
  //   })

  //   const layer = transportMap.forEachLayerAtPixel(transportMap.getEventPixel(evt), (layer) => layer)
  // })

  //지도 클릭시 클릭한 좌표의 경도,위도를 보여준다.
  transportMap.on('singleclick', function (evt) {
    //console.log('경도,위도', proj4('EPSG:5187', 'EPSG:4326', evt.coordinate))
    //displayFeatureInfo(evt.pixel, evt.originalEvent.target)
  })

  transportMap.on('movestart', function (evt) {
    // console.log('movestart')
    relInfo.value.style.visibility = 'hidden'
  })

  transportMap.on('moveend', function (evt) {
    //console.log('getCoordinates',proj4('EPSG:5187', 'EPSG:4326', transportMap.getView().getCenter()) )

    // 지도의 zoom level 변화에 따른 text빛 icon등의 변화
    let newZoomLevel = parseFloat(transportMap.getView().getZoom())
    if (newZoomLevel != setZoom.value) {
      //console.log('checkZoom', setZoom.value)
      checkZoom()
    } else {
    }
  })

  // 마우스 좌클릭
  // transportMap.on('click', featureClick)

  // 지도의 zoom level 변화에 따른 text빛 icon등의 변화
  transportMap.getView().on('change:resolution', (evt) => {
    // checkZoom(evt)
  })
  transportMap.getView().on('change:rotation', (evt) => {
    // console.log('change:rotation')
  })

  transportMap.getOverlays().on('change', (evt) => {
    //console.log('change', evt)
  })

  //transportMap.getView().setRotation(lotationRange)
}

defineExpose({
  openPopup,
})
</script>
<template>
  <VDialog v-model="dialog" persistent transition="dialog-bottom-transition">
    <div class="title-bar" @mousedown="startDragging">CCTV 현황</div>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2 d-flex align-center justify-end">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          :use-permission="false"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card class="content-area">
        <v-card class="d-flex fill-height justify-space-between" style="width: 100%">
          <v-card-text class="pa-0" style="width: 100%">
            <div class="d-flex flex-column fill-height">
              <v-sheet id="safetyTeam" :class="{ expansion: screenExpansion }">
                <!-- 지도 영역 -->
                <div id="mapOL" style="width: 100%; height: 100%" cover class="dashMap"></div>
                <div id="info">
                  <v-sheet id="markers" color="transparent">
                    <div class="mapMarker" :class="{ selected: true }" style="color: #1e2e55">
                      <svg-icon name="mapMarker" class="marker-icon" />
                    </div>
                  </v-sheet>
                </div>
                <div id="locPoint">
                  <img :src="getMapImg('LocPoint')" />
                </div>
              </v-sheet>
            </div>
          </v-card-text>
        </v-card>
      </v-card>
    </v-card>
  </VDialog>
</template>
<style lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 139px);
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}

#locPoint {
  position: 'absolute';
  transform: translateX(-50%) translateY(-105%);
}

#info {
  position: absolute;
  display: inline-block;
  height: auto;
  width: auto;
  z-index: 100;
  color: #fff;
  text-align: center;
  border-radius: 12px;
  padding: 10px;
  // transform: translateX(3%);
  transform: translateX(-50%) translateY(-110%);
  visibility: hidden;
  // bottom: calc(100% + 8px);
  // pointer-events: none;
  .tableBox {
    // padding: 20px;
    // border-radius: 12px;
    .customTable {
      margin-top: 12px;
      width: 100%;
      tr {
        height: 36px;
        th {
          background: #111e3c;
        }
        td {
          text-align: center;
        }
      }
      tr > th,
      tr > td {
        width: 25%;
      }
      tr:first-child > th:not(:first-child),
      tr:nth-child(2) > td:not(:first-child) {
        width: calc(75% * 0.5);
      }
    }
    .customTable,
    .customTable th,
    .customTable td {
      border: 1px solid #3c4b77;
      border-collapse: collapse;
    }
    .foldBtn {
      cursor: pointer;
      // border: 1px solid #3C4B77;
      // border-radius: 5px;
      padding: 3px;
    }
  }
}

#mapOL {
  background: #45536f;
  position: relative;
  overflow: hidden;
}

#safetyTeam {
  height: calc(90vh - 122px);
  // position: relative;
  font-size: 16px;
  font-size: clamp(14px, 0.8vw, 32px);
  overflow: hidden;
  // overflow-y: auto;
  .cardTitle {
    font-size: 18px;
    font-size: clamp(16px, 0.95vw, 24px);
    font-weight: 700;
    // padding: 0 0 22px;
  }

  .dashMap {
    position: absolute;
  }
  // card
  .pLeft {
    position: absolute;
    top: 32px;
    left: 40px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: calc(100% - 64px);
    width: 20%;
    transition: all 0.4s ease-in-out 0.2s;
  }

  .pLeft2 {
    position: absolute;
    left: calc(24%);
    transition: all 0.4s ease-in-out 0.2s;
  }

  .dashCard,
  .bottomCard,
  .toolCard {
    border-radius: 12px;
  }

  .bottomCard {
    bottom: 32px;
    width: calc(100% - 38% - 200px); // 전체 - 좌측카드넓이 - 여백
    // width: calc(50%);
    min-width: 984px;
    height: 10vh;
    > .v-row {
      padding: 0 24px;
      height: 100%;
      align-items: center;
    }
    .v-input {
      flex: 1 1;
    }
    .v-label {
      color: #fff;
    }
  }
  .toolCard {
    position: absolute;
    top: 32px;
    left: calc(75%);
    width: 420px; // 전체 - 좌측카드넓이 - 여백
    height: 48px;
    display: flex;
    justify-content: space-between;
    transition: all 0.4s ease-in-out;
  }
  // screen expansion 화면 확장됐을때
  &.expansion {
    .pLeft {
      transform: translateX(-120%);
      transition: all 0.4s ease-in-out;
    }
    .pLeft2 {
      transform: translateX(160%);
      transition: all 0.4s ease-in-out;
    }
    // .toolCard {
    //   top: 32px;
    //   left: calc(100% - 450px);
    //   transition: all 0.4s ease-in-out 0.2s;
    // }
  }

  .safetyTeamCard {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    padding: 24px 0;
    overflow-y: auto;
    .teamListWrap {
      &:not(:last-child) {
        border-bottom: 1px solid #14244b;
      }
    }
    .teamList {
      cursor: pointer;
      list-style-type: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-size: clamp(14px, 0.8vw, 20px);
      font-weight: 400;
      padding: 12px 28px;
      &.selected {
        background: #344266;
      }
      .colorLabel {
        width: 12px;
        height: 12px;
        border-radius: 100%;
        background-color: #525d75;
      }
    }
  }

  // 지도 마커
  #markers {
    /* !!임시로 위치를 설정한 스타일은 제거하고 나머지 스타일을 적용 하시면 됩니다.!! */
    position: absolute; // 임시
    top: 80%; // 임시
    left: 50%; // 임시
    width: 30%; // 임시
    height: 50%; // 임시
    transform: translate(-50%, -50%); // 임시
  }
  .mapMarker {
    width: 2.3vw;
    height: 2.3vw;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 1px solid currentColor;
    &::before {
      position: absolute;
      content: '';
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      border-radius: 100%;
      background: currentColor;
      opacity: 0.5;
      z-index: -1;
    }
    span {
      color: #fff;
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 20px);
      font-weight: 400;
    }
    // 마커 선택시
    &.selected {
      background: transparent;
      position: relative;
      width: calc(1vw + 8px);
      height: calc(1vw + 8px);
      transform: translateX(-36%) translateY(-15%);
      > span {
        display: none;
      }
      .marker-icon {
        display: block;
        position: absolute;
        bottom: 30%;
      }
    }

    .v-btn--size-default {
      margin-left: 0px !important;
    }
  }
  .markerToolTip {
    border-radius: 12px;
    background: rgba(17, 32, 66, 0.85);
    position: absolute;
    bottom: calc(100% + 15px);
    color: #fff;

    .v-window__container {
      padding: 0 31px;
      .v-window__controls {
        padding: 0;
        .v-btn {
          width: 30px;
          height: 100%;
          border-radius: 0;
        }
      }
      .v-window-item {
        padding: 20px 0;
      }
    }
  }
  .cardDataWrap {
    display: flex;
    flex-direction: column;
    gap: 16px;
    .cardData {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;

      .cardLabel {
        font-weight: 400;
        padding-left: 20px;
      }

      .cardLabel2 {
        font-weight: 400;
        width: 30%;
        display: flex;
        align-items: left;
      }
    }
  }
  .expansionBtn {
    padding: 8px !important;
  }
  .toggleBtn {
    font-size: 14px;
    font-size: clamp(14px, 0.7vw, 18px);
    font-weight: 500;
    line-height: normal;
  }

  // slider
  .v-slider-track__background {
    background: rgb(var(--v-theme-dashSliderBg)) !important;
  }
  .v-slider-track {
    height: var(--v-slider-track-size) !important;
  }
  // input date
  .v-field {
    background-color: rgb(var(--v-theme-dashSelectBox)) !important;

    .v-field__input {
      color: #fff !important;
      align-items: center;
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 20px);
    }

    .v-field--variant-outlined {
      border-color: rgb(var(--v-theme-dashSelectBox)) !important;
    }
  }

  // selectBox
  .v-field--variant-solo {
    background: rgb(var(--v-theme-dashSelectBox)) !important;
    .v-field__input {
      color: #fff !important;
      align-items: center;
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 20px);
    }
  }
}
</style>
