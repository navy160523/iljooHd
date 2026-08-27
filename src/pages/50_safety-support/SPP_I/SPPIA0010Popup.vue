<script setup>
import { nextTick, reactive, watch, computed } from 'vue'
import IMenuTitle from "@/components/IGridTitle.vue"
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
import LocationPopup from '@/components/popup/LocationPopup.vue'
import dayjs from 'dayjs'

import SvgIcon from '@/components/svgicon/SvgIcon.vue'
import { useRouter } from 'vue-router'
//파일업로드 임시
import IUpload from '@/components/IUpload.vue'
import IUploadPdfMulti from '@/components/IUploadPdfMulti.vue'
import { commonLogExecuteApi } from "@hiway/api/commonApi"
import saveFlowHelper from '@/utils/saveFlowHelper'
import {
  commonDownloadFilesApi,
} from "@hiway/api/commonFileApi"
import { useUserStore } from '@hiway/stores/user'


const emit = defineEmits(["upData"])
const dialog = ref(false)
const propsData = ref([])

const imgUrlTemp = ref([]) //이미지 데이터소스

// 팝업이벤트
const carouselRef = ref(null)
const currentSlide = ref(0)

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const router = useRouter()
const locationPopup = ref(null)

const location = ref({
  LOC_CD : '',
  LOC_NM : '',
})

//=====GIS====================================================================
// filter
const pointStyle = ref(
  'position: absolute; z-index: 100000; right: 15px; bottom: 15px; flex-flow: column;',
)

const targetStyle = ref(
  'position: absolute; z-index: 100000; left: 50%; top: 50%; margin-left:-30px; margin-top:-30px; flex-flow: column;',
)

const noneOverlay = () => {
  for (const overlay of transportMap.getOverlays().getArray()) {
    overlay.setPosition(undefined)
  }
}

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
const coordinateEPSG5187 = 'EPSG:5187' // gis__1

// 본공장 [129.4346655096387, 35.52086094766955] zoom 14.5
//해양 [129.4067622245301, 35.47818446202955] zoom 15.8
// const mapCenter3857 = [14408934.4, 4234680.53] // [129.43766, 35.51932]  // 최초 OPen시 사용자의 관리대상 yard가 없을때 지도의 default value
const mapCenter = [129.43791849182165, 35.515152006395915]

// projection 목록 // 5176
const projCode = {
  'EPSG:5176':
        '+proj=tmerc +lat_0=38 +lon_0=129.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43',
  'EPSG:5187':
        '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  'EPSG:3857' :
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

const initZoom = 18.3 // open시 zoom 배율
const textZoom = 17 // block text font 기본 사이즈
const textZoomLarge = 15 // block text font 키우기
const setZoom = ref(18.3) // default zoom level
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

const area0 = ref([])             //장소 레벨0 데이터 저장
const area1 = ref([])             //장소 레벨1 데이터 저장
const area2 = ref([])             //장소 레벨2 데이터 저장
const area3 = ref([])             //장소 레벨3 데이터 저장
const area4 = ref([])             //장소 레벨4 데이터 저장
const areas = ref([])             //현재 장소 레벨
const areaLoc = ref([])           //조직유형별 장소 데이터
const selectLoc = ref('')         //select 장소 데이터
const areaAsgn = ref([])          //안전팀 리스트 데이터
const areaTeam = ref(null)        //안전팀 데이터 저장
const areaLv = ref('4')           //현재 레벨
const areaOrg = ref('HHIZ012')    //현재 조직유형 기본:전사

const comParams = ref({           //공통 조회 변수
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

    returnCoord.push(
      transform(
        dle,
        ffrom === undefined ? 'EPSG:5176' : ffrom,
        tto === undefined ? 'EPSG:3857' : tto,
      ),
    )
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

    returnCoord.push(
      proj4(ffrom === undefined ? 'EPSG:5176' : ffrom, tto === undefined ? 'EPSG:5187' : tto, dle),
    )
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
  const transCoord = trans5176To5187(coord)//trans5176To3857(coord)

  return getFeatureFromCoord('Polygon', transCoord)
}

function getPolygonFromBox(box) {
  const polygon = box.split(';')

  polygon.push(polygon[0])
  
  return polygon
}

// 지역 정보 조회
const getInitArea  = async () => {
  // 조직도 부서 조회 파라미터
  let acdtParms = reactive({
    CMPNY_DIV:'HHI',

    // ALL_UP_CD:'HHIZ010',
    // USE_FLAG:'Y',
  })
  let response = await commonSearchApi({ queryId: 'OPRAG0020_SEARCH_06', param: acdtParms })
  response = response.ORESULT_CUR
  // acdtParms.BSNS_CD = 'AN00'
  // acdtParms.USE_DIV = 'Y'
  // let response2 = await commonSearchApi({ queryId: 'OPRAC0010_SEARCH_05', param: acdtParms })
  // response2 = response2.ORESULT_CUR
  
  // for (var i in response2) {
  //   response2[i].FILL = '#' + (parseInt(Math.random()*0xffffff)).toString(16)
  //   response2[i].STROKE = response2[i].FILL + '80'
  // }
  for (var i in checkList.value) {
    checkList.value[i].forEach(item => {
      let temp = '#' + (parseInt(Math.random()*0xffffff)).toString(16)

      checkList.value.forEach(list => {
        if(temp === '#ffffff' || temp.length < 7)
          temp = '#' + (parseInt(Math.random()*0xffffff)).toString(16)

        if(list.findIndex(data => data.COLOR === temp) > -1)
          temp = '#' + (parseInt(Math.random()*0xffffff)).toString(16)
      })

      item.COLOR = temp
    })
  }

  
  area0.value = []
  area1.value = []
  area2.value = []
  area3.value = []
  area4.value = []

  for (var i in response) {
    if(response[i].LV === '0') {
      // response[i].SCALE = 1
      // response[i].FONT = '16px 나눔고딕'
      // response[i].ASGN_NM = null
      // response[i].FILL = null
      // response[i].STROKE = null
     
      // if(response[i].LAT != null) {
      //   for (var j in checkList.value) {
      //     checkList.value[j].forEach(item => {
      //       if(response[i].TEAM_CD == item.ASGN_CD) {
      //         response[i].ASGN_NM = item.ASGN_NM
      //         response[i].FILL = item.COLOR
      //         response[i].STROKE = item.COLOR + '80'
      //       }
      //     })
      //   }
      //   response[i].SCALE = 0.6
      //   area4.value.push(response[i])
      // } else
      //   area0.value.push(response[i])
    // } else if(response[i].LV === '1') {
    //   response[i].SCALE = 4
    //   area1.value.push(response[i])
    // } else if(response[i].LV === '2') {
    //   response[i].SCALE = 3
    //   area2.value.push(response[i])
    // } else if(response[i].LV === '3') {
    //   response[i].SCALE = 1.7
    //   area3.value.push(response[i])
    } else if(response[i].LV === '4') {
      response[i].SCALE = 0.6
      response[i].ASGN_NM = null
      response[i].FILL = null
      response[i].STROKE = null
      for (var j in checkList.value) {
        checkList.value[j].forEach(item => {
          if(response[i].TEAM_CD === item.ASGN_CD) {
            response[i].ASGN_NM = item.ASGN_NM
            response[i].FILL = item.COLOR
            response[i].STROKE = item.COLOR// + '80'
          }
        })
      }

      area4.value.push(response[i])
    }
  }
  
  areaAsgn.value = checkList.value
  areas.value = area4.value
  setAreaLevel(areas.value, areaLv.value)

  
}

const setAreaLevel = (area, lv) => {
  let areaFeatures = []
  let areaFeature = null
  
  // areaAsgn.value = []
  areaLoc.value = []
  areaLoc.value.push({
    LAT : '',
    SYS_CDNM : '지정안함',
  })
  
  areaLayers.getSource().clear()
  if(areaOrg.value === 'HHIZ012') {
    areaAsgn.value = checkList.value
  } else {
    checkList.value.forEach(list => {
      if(list[0].ORG_CD === areaOrg.value)
        areaAsgn.value = [list]
    })
  }
  
  //console.log('areaAsgn', areaAsgn.value)
        
  for (var i in area) {
    let fill = null, stroke = null, scale  = null
    if(area[i].LAT != null && area[i].ALL_SYS_CD.indexOf(areaOrg.value) > -1) {

      areaLoc.value.push(area[i])

      fill = area[i].FILL
      stroke = area[i].STROKE
      scale = area[i].SCALE

      if(area[i].TEAM_CD) {
        
        // let NO = areaAsgn.value.findIndex(item => item.ASGN_CD === area[i].TEAM_CD)
        // if(NO < 0 && area[i].FILL) {
        //   areaAsgn.value.push({
        //     ASGN_CD : area[i].TEAM_CD,
        //     ASGN_NM : area[i].ASGN_NM,
        //     COLOR : area[i].FILL,
        //     SELECT : areaTeam.value && area[i].TEAM_CD === areaTeam.value.ASGN_CD ? true : false,
        //   })
        // }

        if(areaTeam.value && area[i].TEAM_CD !== areaTeam.value.ASGN_CD && area[i].FILL) {
          fill = area[i].FILL + '30'
          stroke = area[i].STROKE.substr(0, 7) + '30'
          // console.log('areaTeam', fill, stroke)
        } 
        
        if(areaTeam.value && area[i].TEAM_CD === areaTeam.value.ASGN_CD) {
          scale = 1
        }
      }
      
      let coordinates = area[i].LAT.split(',')
      let point = new Point(proj4('EPSG:4326', 'EPSG:5187', [parseFloat(coordinates[0]), parseFloat(coordinates[1])]))

      areaFeature = new Feature(point)
      areaFeature.name = area[i].SYS_CDNM
      areaFeature.asgn = area[i].ASGN_NM
      areaFeature.cd = Number(lv) < 4 ? area[i].ALL_SYS_CD : area[i].AREA_CD
      areaFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 10,
            scale: scale,
            stroke: new Stroke({
              color: stroke ? stroke : '#FFFFFF',
              width: 6,
            }),
            fill: new Fill({
              color: fill ? fill : '#FFFFFF',
            }),
          }),
          zIndex: 1,
          // text: new Text({
          //   text: areaFeature.count,// + '[' +areaFeature.name + ']',
          //   font: area[i].FONT,
          //   fill: new Fill({
          //     color: '#FFFFFF',
          //   }),
          // }),
        }),
      )
      // console.log('areaFeature', areaFeature)
      areaFeatures.push(areaFeature)
    }
  }
  // console.log('areaAsgn', areaAsgn.value)
  areaLayers.getSource().addFeatures(areaFeatures)
}

// 안벽 호선정보 조회
const getShipFromQuay = async () => {
  // T72BB085 table에 Manual 이동된 블록 정보가 저장되고
  // 그외는 T72BB080 의 안벽 정보에 따라 display 된다.
  // T72BB080 안벽 ship 그리는 위치 및 angle정보를 포함한다.

  let response = await commonSearchApi({ queryId: "GIS_SEARCH_QUAY", param: {} })

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

      feature.setStyle(
        featureStyler(feature, unselectedLineWidth, colorBlack, colorWhite),
      )
      
      if (feature) {
        features.push(feature)
      }
    } catch (error) {
      console.log(error)
    }
  }
  //console.log('getShipFromQuay',features)
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
    curFeature.rcenter.split(',').forEach(function(item) {
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
    featureMarker.setStyle(
      featureStyler(featureMarker, LineWidth1, colorBlack, colorGrey),
    )

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
      proj4('EPSG:5176', 'EPSG:5187', currentCenter),

      // transform(currentCenter, 'EPSG:5176', 'EPSG:3857'),
    )

    // }
  }
  tempLayers.getSource().clear()
}

var f_text = ''

// featureStyler, 외곽선굵기, 라인색상, 색상값, 선종류, 선Clear
function featureStyler(
  feature,
  lineWidth,
  lineColor,
  colorChangeType,
  strokeLineStyle,
  LineClear,
  transparent,
) {
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
  } else if (
    feature.transparent !== undefined &&
    feature.transparent === true
  ) {
    // 투명 블록들
    return new Style({
      fill: new Fill({ color: colorEmpty }),
      stroke: new Stroke({
        color: 'rgba(255,255,255,0)',
        width: 0.1,
        lineJoin: 'round',
      }),
      zIndex: 1,

      // , text: new Text({})
      // , text: new Text({
      //   font: newfont,
      //   overflow: true,
      //   fill: new Fill({color: colorEmpty}),
      //   text: '' // newZoomLevel > text_zoom ? f_text : ' '
      // })
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
        (feature.type === 'block_memo'
          ? ''
          : feature.ship + '\n' + feature.block) +
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
        (feature.gccrane === undefined ||
        feature.gccrane === '' ||
        feature.gccrane === null ||
        feature.gccrane === ' '
          ? ''
          : '\n' + feature.gccrane) +
        (feature.pe_plan === undefined ||
        feature.pe_plan === '' ||
        feature.pe_plan === null ||
        feature.pe_plan === ' '
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

    var v_text =
      newZoomLevel >
      (feature.type !== undefined && feature.type === 'ship' ? 15 : text_zoom)
        ? f_text
        : ' '

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

        // text: newZoomLevel > text_zoom ? f_text : ' '
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
  //console.log('setZoom',setZoom.value)
  // if(newZoomLevel < 15.8) {
  //   areaLv.value = '1'
  //   areas.value = area1.value
  //   setAreaLevel(areas.value, areaLv.value, areaColor.value)
  // } else if(newZoomLevel >= 15.8 && newZoomLevel < 16.5) {
  //   areaLv.value = '2'
  //   areas.value = area2.value
  //   setAreaLevel(areas.value, areaLv.value, areaColor.value)
  // } else if(newZoomLevel >= 16.5 && newZoomLevel < 17.5) {
  //   areaLv.value = '3'
  //   areas.value = area3.value
  //   setAreaLevel(areas.value, areaLv.value, areaColor.value)
  // } else if(newZoomLevel >= 17.5) {
  //   areaLv.value = '4'
  //   areas.value = area4.value
  //   setAreaLevel(areas.value, areaLv.value, areaColor.value)
  // }

  // 호선정보 style 변경
  const shipFeatures = shipLayers.getSource().getFeatures()

  for (const i in shipFeatures) {
    shipFeatures[i].setStyle(
      featureStyler(shipFeatures[i], LineWidth1, colorBlack, 'stayColor'),
    )
  }
}

const currentFeature = ref()
const relInfo = ref()

const displayFeatureInfo = async (pixel, target) => {
  const feature = target.closest('.ol-control')
    ? undefined
    : transportMap.forEachFeatureAtPixel(pixel, function (feature) {
      return feature
    })

  if (feature) {
    noneOverlay()
    //console.log('displayFeatureInfo feature',feature)
    //console.log('displayFeatureInfo currentFeature',currentFeature)
    
    let param = {
      CMPNY_DIV: 'HHI',
      DATE: dayDate.value,
    }
    
    let res = null
    if(feature.type) {
      if(feature.type == 'ship') {
        param.SHIP_NO = feature.ship
        //console.log('AREA_INFO param', param)
        res = await commonSearchApi(
          { queryId: 'OPRAC0030_REL_SHIP', param: param },
        )
      }
    } else {
      param.AREA_CD = feature.cd
      //console.log('SHIP_INFO param', param)
      res = await commonSearchApi(
        { queryId: 'OPRAC0030_REL_AREA', param: param },
      )
    }
    infoData.value = res.ORESULT_CUR
    //console.log('infoData', infoData.value)
    relInfo.value.style.left = pixel[0] + 'px'
    relInfo.value.style.top = pixel[1] + 'px'
    if (feature !== currentFeature.value) {
      relInfo.value.style.visibility = 'visible'
    }
    currentFeature.value = feature
  } else {
    relInfo.value.style.visibility = 'hidden'
  }
}

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
    transportMap.setTarget(null); // 지도와 연결된 DOM 해제
    transportMap = null; // 지도 객체 해제
  }

  dialog.value = false
  emit("upData")
}
const openPopup = async (popupParam) => {
  propsData.value = popupParam
  
  let coords = [];
  let isDefaultCoords = false;

  try {
    coords = propsData.value.COORDI
      ?.replace(/[\n\s]/g, '') // 공백 및 줄바꿈 제거
      .split(',') // 콤마 기준으로 분리
      .map(coord => parseFloat(coord)); // 숫자로 변환

    // 유효성 검사: 좌표가 2개이고 모두 숫자일 때만 사용
    if (
      !Array.isArray(coords) || 
      coords.length !== 2 || 
      coords.some(c => isNaN(c))
    ) {
      coords = mapCenter;
      isDefaultCoords = true;
    }
  } catch (e) {
    coords = mapCenter;
    isDefaultCoords = true;
  }

  const mapCenter4326 = coords;

  dialog.value = true
  
  await nextTick();

  //초기화
  resetDataSource();
  //파일조회
  fileSet(propsData.value.FILE_ID)

  setTimeout(() => {
    forceRenderFirstSlide()
  }, 500)

  const view = new View({
    center: proj4('EPSG:4326', 'EPSG:5187', mapCenter4326),//[240175.364, 324954.256],
    zoomFactor: 2,
    zoom: isDefaultCoords ? 15 : initZoom,
    maxZoom: 20,
    minZoom: 14,

    // rotation: 11,
    enableRotation: false,
  })

  // console.log('totLayers',totLayers)
  relInfo.value = document.getElementById('info')

  // 지도 base 값설정
  transportMap = new Map({
    controls: defaults({
      attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
        collapsible: false,
      }),
      zoom: false,
      rotate: false,
    }),
    target: 'mapOL',
    layers: totLayers, // 각종 layer들 모음
    view: view, // 지도의 기본 view 정보
  })

  //깜빡거리는문제 수정
  window.addEventListener('resize', () => {
    transportMap.updateSize();
  });

  transportMap.getAllLayers().forEach(layer => {
    if (layer.get('id') === 'area_layer') {
      // transportMap.removeLayer(layer)
      layer.getSource().clear()
    }
  })
  getShipFromQuay() // 안쪽 호선 정보 조회
  overlay.value = new Overlay({
    element: document.getElementById('locPoint'),
    className: 'ol ol-overlay-container ol-selectable',
  })
  transportMap.addOverlay(overlay.value)
  if (!isDefaultCoords) {
    overlay.value.setPosition(proj4('EPSG:4326', 'EPSG:5187', mapCenter4326));
  } else {
    // fallback: 혹시 모를 위치 초기화
    overlay.value.setPosition(undefined); // 또는 null
  }

  // 마우스 이동시 현재 좌표를 보여준다.
  transportMap.on('pointermove', function (evt) {
    let hit = transportMap.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      return true
    })
    transportMap.getTargetElement().style.cursor = hit ? 'pointer' : ''
  })
  // 우클릭 context open
  transportMap
    .getViewport()
    .addEventListener('contextmenu', function (evt) {
      //console.log('contextmenu',evt)
      evt.preventDefault()

      const feature = transportMap.forEachFeatureAtPixel(
        transportMap.getEventPixel(evt),
        function (feature, layer) {
          return feature
        },
      )

      const layer = transportMap.forEachLayerAtPixel(
        transportMap.getEventPixel(evt),
        layer => layer,
      )
    })

  transportMap.on('singleclick', function(evt) {
    //console.log('singleclick',proj4('EPSG:5187', 'EPSG:4326', evt.coordinate))

    displayFeatureInfo(evt.pixel, evt.originalEvent.target)
  })
  
  transportMap.on('movestart', function (evt) {
    // console.log('movestart')
    relInfo.value.style.visibility = 'hidden'
  })

  transportMap.on('moveend', function (evt) {
    //console.log('getCoordinates',proj4('EPSG:5187', 'EPSG:4326', transportMap.getView().getCenter()) )
    
    // 지도의 zoom level 변화에 따른 text빛 icon등의 변화
    let newZoomLevel = parseFloat(transportMap.getView().getZoom())
    if(newZoomLevel != setZoom.value) {
      // console.log('checkZoom', setZoom.value)
      checkZoom()
    } else {

    }
  })

    // 마우스 좌클릭
  // transportMap.on('click', featureClick)

  // 지도의 zoom level 변화에 따른 text빛 icon등의 변화
  transportMap.getView().on('change:resolution', evt => {
    // checkZoom(evt)
  })
  transportMap.getView().on('change:rotation', evt => {
    // console.log('change:rotation')
  })

  transportMap.getOverlays().on('change', evt => {
    //console.log('change', evt)
  })

}

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID: '',
})

const fileSet = async (file) => {
  try {
    const res = await commonSearchApi({
      queryId: 'searchFile',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        FILE_ID: file,
      },
    });

    const fileList = []; // 비어있는 파일 리스트 초기화

    res.ORESULT_CUR.forEach((e) => {
      const type = e.FILE_TYPE.toUpperCase();
      if (type === 'PDF') {
        fileList.push(e);
      }
    });


    if (fileList.length > 0) {
      await commonDown(fileList); // 여러 파일 처리 함수 호출
    }
  } catch (error) {
    console.error('fileSet에서 에러나유:', error);
  }
};

const commonDown = async (fileList) => {
  try {
    for (const file of fileList) {
      if (!file.FILE_ID || file.FILE_ID.trim() === '') {
        console.warn(`파일데이터: ${file}`);
        continue; // 유효하지 않은 파일은 스킵
      }
      const res = await commonDownloadFilesApi(file);

      // 파일 다운로드 후 Blob 생성 및 URL 생성
      const blob = new Blob([res], { type: 'application/pdf' });
      const imageURL = URL.createObjectURL(blob);


      imgUrlTemp.value.push(imageURL); // URL 리스트에 추가('#toolbar=0,view=Fit'는 blob방식이라서 작동안함)
    }
  } catch (error) {
    console.error('commonDown에서 에러나유:', error);
  }
};

const forceRenderFirstSlide = async () => {
  await nextTick()

  // 다음 슬라이드로 이동 → 다시 첫 슬라이드로 복귀
  if (imgUrlTemp.value.length > 1 && carouselRef.value) {
    carouselRef.value.goTo(1)
    setTimeout(() => {
      carouselRef.value.goTo(0)
    }, 50) 
  }
}

const resetDataSource = () => {
  imgUrlTemp.value = []; // 초기화
};

defineExpose({
  openPopup,
})
</script>
<template>
  <VDialog
    v-model="dialog"
    persistent
    transition="dialog-bottom-transition"
  >
    <div class="title-bar" @mousedown="startDragging">폭발위험장소 ＆ 구분도</div>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2 d-flex align-center justify-end">
        <IMenuTitle
          ref="menuTitle"
          :button-list="[
            'btnClose'
          ]"
          :use-permission="false"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card class="content-area">
        <v-card class="d-flex fill-height justify-space-between" style="width: 100%;">
          <v-card-text class="pa-0" style="width: 50%;">
            <div class="d-flex flex-column fill-height">
              <v-sheet
                id="safetyTeam"
                :class="{ expansion: screenExpansion }"
              >
                <!-- 지도 영역 -->
                <div
                  id="mapOL" 
                  style="width: calc(90%); height: 100%; margin-left: 5%"
                  cover
                  class="dashMap"
                >
                </div>
                <div id="info">
                  <v-sheet id="markers" color="transparent">
                    <div class="mapMarker" :class="{ selected: true }" style="color: #1E2E55">
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
          <!-- pdf 뷰어 -->
          <v-card-text class="pa-0" style="width: 50%;">
            <div class="d-flex flex-column fill-height justify-center">
              <div
                style="width: calc(85%); height: 100%; margin-left: 5%;"
                class="d-flex fill-height"
              >
                <v-carousel 
                  height="98%" 
                  hide-delimiters
                  show-arrows="hover"
                  ref="carouselRef"
                  v-model="currentSlide"
                >
                  <v-carousel-item v-for="(url, index) in imgUrlTemp" :key="index">
                    <iframe :src="url" style="height: 100%; width: 100%;" />
                  </v-carousel-item>
                </v-carousel>
              </div>
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
  .tableBox{
    // padding: 20px;
    // border-radius: 12px;
    .customTable{
      margin-top: 12px;
      width: 100%;
      tr{
        height: 36px;
        th{
          background: #111E3C;
        }
        td{
          text-align: center;
        }
      }
      tr > th, tr > td{
        width: 25%;
      }
      tr:first-child > th:not(:first-child),
      tr:nth-child(2) > td:not(:first-child){
        width:calc(75% * 0.5);
      }
    }
    .customTable,.customTable th, .customTable td{
      border: 1px solid #3C4B77;
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
  // 요소
  // .dataView {
  //   display: flex;
  //   justify-content: space-between;
  //   align-items: center;
  //   width: 100%;
  // }

  // 버튼
  // .dataBtn {
  //   // height: 100%;
  //   padding: 0 4px 0 12px !important;
  //   width: 100%;
  //   margin: 2px 0;
  //   display: block;
  //   // border-radius: 0 4px 4px 0;
  //   &.v-btn--disabled {
  //     background: transparent !important;
  //     .v-btn__overlay {
  //       opacity: 0;
  //     }
  //   }
  //   .v-btn__content {
  //     width: 100%;
  //     justify-content: space-between;
  //   }
  //   &.v-btn--size-default {
  //     --v-btn-height: 35px;
  //   }
  //   &.selected {
  //     position: relative;
  //     // border-left: 2px solid #fff;
  //     &::before {
  //       position: absolute;
  //       content: '';
  //       width: 2px;
  //       height: 60%;
  //       background: #fff;
  //       border-radius: 2px;
  //       left: -1px;
  //       top: 50%;
  //       transform: translateY(-50%);
  //     }
  //   }
  // }
  .expansionBtn {
    padding: 8px !important;
  }

  // FONT 폰트
  // .dashLabel {
  //   font-size: 16px;
  //   font-size: clamp(14px, 0.8vw, 20px);
  //   color: rgba(var(--v-theme-dashText), 0.75);
  //   line-height: normal;
  // }

  // .mainCard {
  //   .totalNum {
  //     font-size: 48px;
  //     font-size: clamp(44px, 2vw, 52px);
  //     font-weight: 700;
  //     line-height: normal;
  //     color: rgba(var(--v-theme-dashText), 1);
  //   }
  //   .dataNum {
  //     font-size: 18px;
  //     font-size: clamp(16px, 1vw, 24px);
  //     font-weight: 700;
  //     line-height: normal;
  //     color: rgba(var(--v-theme-dashText), 1);
  //     // font-size: 32px;
  //     // font-size: clamp(28px, 1.5vw, 40px);
  //     // font-weight: 700;
  //     // line-height: normal;
  //     // opacity: 1;
  //     // color: rgba(var(--v-theme-dashText), 1);
  //   }
  // }
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