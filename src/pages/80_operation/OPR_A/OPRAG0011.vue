<!-- 
  * Vue 내 용 : 통합안전 Dashboard (master버전)
  * 작 성 자 : 일주지앤에스 박성학
  * 최초 작성일 : 2024/08/05
  * 최종 수정자 : 한민규 
  * 최종 수정일 : 2025/04/09
-->

<script setup>
import { nextTick, reactive, watch } from 'vue'
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
import { commonSearchApi } from '@hiway/api/commonApi'
import IButtonList from '@/components/IButtonList.vue'
import detailPanel from '@/components/dashboard/detailPanel.vue'
import floatingSideBanner from '@/components/dashboard/floatingSideBanner.vue'
import dayjs from 'dayjs'

import SvgIcon from '@/components/svgicon/SvgIcon.vue'
import { useUserStore } from '@hiway/stores/user'
import { useRouter } from 'vue-router'

defineOptions({
  name:'80_operation-OPR_A-OPRAG0011',
})

const router = useRouter()
const userStore = useUserStore()


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
  // vlayers, // block
  // osmLayer,
  naviLayers,

  // tooltipLayer,
  // tooltipLineLayer,
  shipLayers,
  tempLayers, // 암벽 호선
  // shipAreaLayers, // 선석
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
const mapCenter4326 = [129.43791849182165, 35.515152006395915]

// 본공장 [129.4346655096387, 35.52086094766955] zoom 14.5 
//해양 [129.4067622245301, 35.47818446202955] zoom 15.8
// const mapCenter3857 = [14408934.4, 4234680.53] // [129.43766, 35.51932]  // 최초 OPen시 사용자의 관리대상 yard가 없을때 지도의 default value

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

const initZoom = 17.5//15.8 // open시 zoom 배율
const textZoom = 17 // block text font 기본 사이즈
const textZoomLarge = 20 // block text font 키우기
const setZoom = ref(16.6)//15.8 // default zoom level
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

const setTime = ref(null)
const area0 = ref([]) //장소 레벨0 데이터 저장
const area1 = ref([]) //장소 레벨1 데이터 저장
const area2 = ref([]) //장소 레벨2 데이터 저장
const area3 = ref([]) //장소 레벨3 데이터 저장
const area4 = ref([]) //장소 레벨4 데이터 저장
const area4of1 = ref([]) //장소 미분류 데이터 저장
const areas = ref([]) //현재 장소 레벨

const mapView = ref(null)

const shipData = ref({
  SHPNO: '',
  OWNERA1: '',
  SHPTYP_NAM : '',
  WCDATE: '',
  KLDATE: '',
  LCDATE: '',
  DLDATE: '',
})

const areaColor = ref('#1A40C7')  //사고 유형별 area 색상
const areaLv = ref('3')           //현재 레벨
const areaOrg = ref('HHIZ012')    //현재 조직유형 기본:전사

const serious = ref([])           //중대성 사고  Y 데이터 저장
const jungdae = ref([])           //중대재해  Y 데이터 저장

const areaEtc1 = ref([])          //기타 군산 데이터 저장
const areaEtc2 = ref([])          //기타 건물/기타 데이터 저장
// const areaEtc3 = ref([])          //인도호선 데이터 저장

const areaEtc1_1 = ref([])          //안전사고 기타 군산 데이터 저장
const areaEtc1_1_San = ref([])      //안전사고 기타 군산 산재 데이터 저장
const areaEtc1_1_Hue = ref([])      //안전사고 기타 군산 휴업 데이터 저장
const areaEtc1_1_Il = ref([])       //안전사고 기타 군산 일반 데이터 저장

const areaEtc1_2 = ref([])          //안전사고 기타 건물/기타 데이터 저장
const areaEtc1_2_San = ref([])      //안전사고 기타 건물/기타 산재 데이터 저장
const areaEtc1_2_Hue = ref([])      //안전사고 기타 건물/기타 휴업 데이터 저장
const areaEtc1_2_Il = ref([])       //안전사고 기타 건물/기타 일반 데이터 저장

// const areaEtc1_3 = ref([])          //안전사고 인도호선 데이터 저장

const areaEtc2_1 = ref([])               //안전점검 기타 군산 데이터 저장
const areaEtc2_1_Ptw = ref([])           //안전점검 기타 군산 ptw 데이터 저장
const areaEtc2_1_Plan = ref([])          //안전점검 기타 군산 plan 데이터 저장
const areaEtc2_1_Daily = ref([])         //안전점검 기타 군산 Daily데이터 저장

const areaEtc2_2 = ref([])               //안전점검 기타 건물/기타 데이터 저장
const areaEtc2_2_Ptw = ref([])           //안전점검 기타 건물/기타 ptw 데이터 저장
const areaEtc2_2_Plan = ref([])          //안전점검 기타 건물/기타 plan 데이터 저장
const areaEtc2_2_Daily = ref([])         //안전점검 기타 건물/기타 Daily 데이터 저장

// const areaEtc2_3 = ref([])            //안전점검 인도호선 데이터 저장

const areaEtc3_1 = ref([])               //안전수칙 기타 군산 데이터 저장
const areaEtc3_1_abs = ref([])           //안전수칙 기타 군산 절대수칙 데이터 저장
const areaEtc3_1_ser = ref([])           //안전수칙 기타 군산 중대수칙 데이터 저장
const areaEtc3_1_crn = ref([])           //안전수칙 기타 군산 크레인 데이터 저장
const areaEtc3_1_gen = ref([])           //안전수칙 기타 군산 일반수칙 데이터 저장
const areaEtc3_1_safe = ref([])          //

const areaEtc3_2 = ref([])               //안전수칙 기타 건물/기타 데이터 저장
const areaEtc3_2_abs = ref([])           //안전수칙 기타 건물/기타 절대수칙 데이터 저장
const areaEtc3_2_ser = ref([])           //안전수칙 기타 건물/기타 중대수칙 데이터 저장
const areaEtc3_2_crn = ref([])           //안전수칙 기타 건물/기타 크레인 데이터 저장
const areaEtc3_2_gen = ref([])           //안전수칙 기타 건물/기타 일반수칙 데이터 저장
const areaEtc3_2_safe = ref([])


// const areaEtc3_3 = ref([])          //안전수칙 인도호선 데이터 저장

const areaDataLv1 = ref([])       //사고 유형별 Lv1 전체 데이터 저장
const areaDataLv2 = ref([])       //사고 유형별 Lv2 전체 데이터 저장
const areaDataLv3 = ref([])       //사고 유형별 Lv3 전체 데이터 저장
const areaDataLv4 = ref([])       //사고 유형별 Lv4 전체 데이터 저장

const areaDataTo1 = ref([])        //안전사고 전체
const areaDataTo2 = ref([])        //안전점검 전체
const areaDataTo3 = ref([])        //안전추칙 전체

const areaDataDe1_1 = ref([])     //안전사고 산제 데이터 저장
const areaDataDe1_2 = ref([])     //안전사고 휴업 데이터 저장
const areaDataDe1_3 = ref([])     //안전사고 일반 데이터 저장

const areaDataDe2_1 = ref([])     //안전점검 ptw 데이터 저장
const areaDataTDe2_1 = ref(0)     //안전점검 ptw 점검중, 점검완료 카운터 저장
const areaDataDe2_2 = ref([])     //안전점검 부서관리 데이터 저장
const areaDataTDe2_2 = ref(0)     //안전점검 부서관리 점검중, 점검완료 카운터 저장
const areaDataDe2_3 = ref([])     //안전점검 일상 데이터 저장
const areaInspection1 = ref([])   //안전사고 상세 미점검 데이터 저장
const areaInspection2 = ref([])   //안전사고 상세 점검진행 데이터 저장
const areaInspection3 = ref([])   //안전사고 상세 점검완료 데이터 저장

const checkIns = ref('Y')         //안전점검 협력사 포함/미포함 체크
const checkYard = ref('N')        //안전점검 3중 점검(국한) 체크
const areaDataDe3_1 = ref([])     //안전수칙 절대수칙 데이터 저장
const areaDataDe3_2 = ref([])     //안전수칙 중대성수칙 데이터 저장
const areaDataDe3_3 = ref([])     //안전수칙 일반수칙 데이터 저장
const areaDataDe3_4 = ref([])     //안전수칙 크레인 특별안전수칙 데이터 저장
const areaDataDe3_5 = ref([])     //안전수칙 The Safe Care 핵심안전수칙 데이터 저장
const autoUpdate = ref('N')       //5분주기 자동 업데이트

const progressLine1 = ref(0)
const progressLine2 = ref(0)
const progressLine3 = ref(0)

const comParams = ref({           //공통 조회 변수
  CMPNY_DIV: 'HHI', //userStore.cmpnyDiv,
  BSNS_CD: '',
  PART_CD: '',
  DEPT_CD: '',
  OCCUR_FROM: '',
  OCCUR_TO: '',
})

const comDetailList = ref([])   // 오른쪽 상세화면 데이터

// 업데이트 로그 데이터
const logData = ref([])         // 로그
const logData1 = ref([])        //안전사고 로그
const logData2 = ref([])        //안전점검 로그
const logData3 = ref([])        //안전수칙 로그

const checkCnt = ref({})   // 오른쪽 안전점검 count
  
// 좌표 변환
function trans5176To3857(coordArray, ffrom, tto) {
  const returnCoord = []
  for (let i = 0, l = coordArray.length; i < l; i++) {
    const coord = coordArray[i].split(',')
    var dle = []
    coord.forEach(function (item) {
      dle.push(parseFloat(item ? item : 0))
    })

    // console.log('trans5176To3857 dle', dle)
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

//공통 파라메터
const setComParams = type => {
  //console.log('setComParams type', type, accidentCard)
  let from, to
  let toDay = dayjs().format('MM') === dateAccMonth.value ? dayjs().format('DD') : '31'

  // console.log('setComParams',dateAccMonth.value, dayjs().format('MM'), toDay)
  
  if(type === 'inspect') {
    from = formInsDate.value
    to = formInsDate.value
  } else if(type === 'accident') {
    if(orgnAccDiv.value === 'date') {
      from = formAccDate.value
      to = formAccDate.value
    } else if(orgnAccDiv.value === 'yyyymm') {
      if(typeAccDiv.value === 'acc') {
        from = dateAccYear.value + '-01-01'
        to = dateAccYear.value + '-' + dateAccMonth.value + '-' + toDay
      } else {
        from = dateAccYear.value + '-' + dateAccMonth.value + '-01'
        to = dateAccYear.value + '-' + dateAccMonth.value + '-' + toDay
      }
    }
  } else {
    if(orgnRulDiv.value === 'date') {
      from = formRulDate.value
      to = formRulDate.value
    } else if(orgnRulDiv.value === 'yyyymm') {
      if(typeRulDiv.value === 'acc') {
        from = dateRulYear.value + '-01-01'
        to = dateRulYear.value + '-' + dateRulMonth.value + '-' + toDay
      } else {
        from = dateRulYear.value + '-' + dateRulMonth.value + '-01'
        to = dateRulYear.value + '-' + dateRulMonth.value + '-' + toDay
      }
    }
  }

  //console.log('setComParams', from, to)
  // comParams.value.CMPNY_DIV = 'HHI'
  comParams.value.OCCUR_FROM = from
  comParams.value.OCCUR_TO = to

  // console.log('setComParams comParams', comParams.value)

  return comParams.value
}

//SLI 데이터////////////////////////////////////////////////////////////////////
const setSAFFB0010 = async () => {
  let params = {
    CMPNY_DIV: 'HHI',
    OCCUR_FROM: dayjs().add(-1, 'day').format('YYYY-MM-DD'),
    OCCUR_TO: dayjs().add(-1, 'day').format('YYYY-MM-DD'),
  }
  //console.log('setSAFFB0010 params', params)
  let response = await commonSearchApi({ queryId: 'OPRAG0010_SAFFB0010', param: params })// setComParams() })
  //console.log('setSAFFB0010 response',response.ORESULT_CUR)
  if(response.ORESULT_CUR.length > 0) {
    sliData.value = response.ORESULT_CUR
  } else {
    sliData.value = [
      { BSNS_NM: '전사', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '조선', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '해양에너지', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '특수선', TOT_SVG: 0, TOTAL_GRADE: '' },
      { BSNS_NM: '엔진기계', TOT_SVG: 0, TOTAL_GRADE: '' },
    ]
  }
  
}

//SLI 데이터////////////////////////////////////////////////////////////////////

//부문별 안전 KPI 현황 데이터////////////////////////////////////////////////////////////////////
const setMNGAA0060 = async () => {
  let params = {
    CMPNY_DIV: 'HHI',
    OCCUR_FROM: dayjs().format('YYYY-MM'),
    OCCUR_TO: dayjs().format('YYYY-MM'),
  }
  let response = await commonSearchApi({ queryId: "OPRAG0010_MNGAA0060", param: params })//setComParams() })
  //console.log('setMNGAA0060 response',response.ORESULT_CUR)
  if(response.ORESULT_CUR.length > 0) {
    kpiList.value = response.ORESULT_CUR
  } 

  // else {
  //   kpiList.value = [
  //     { PART_NM: '', MON_YUL: 0, AHEAD_ITEM: '' },
  //   ]
  // }
}

//부문별 안전 KPI 현황 데이터////////////////////////////////////////////////////////////////////

//안전 사고 데이터////////////////////////////////////////////////////////////////////
const SAFAB0010 = async () => {
  // let tmpDept = ''
  // comParams.DEPT_CD.forEach(item, index => {
  //   if(comParams.value.DEPT_CD.length < 2)
  //     comParams.value.DEPT_CD = item
  //   else {
  //     if(index === 0){
  //       // tmpDept = tmpDept + 
  //     }
  //   }
  // })

  let response = await commonSearchApi({ queryId: "OPRAG0010_SAFAB0010_011", param: setComParams('accident') })
  response = response.ORESULT_CUR
  // console.log('안전사고 response',response)

  await setSAFAD0010() //안전사고 재해율

  return response
}

const setSAFAB0010 = async res => {
  areaDataTo1.value = res
  areaEtc1_1.value = []
  areaEtc1_2.value = []
  serious.value = []
  jungdae.value = []
  areaDataDe1_1.value = []
  areaDataDe1_2.value = []
  areaDataDe1_3.value = []
  logData1.value = []
  
  res.forEach(item => {
    item.TYPE2 = null
    if(item.SAGO_DIV_L !== 'C' && item.SAGO_DIV_L !== 'F') {
      if(item.COME_SERIOUS_YN === 'Y') {
        serious.value.push(item)
      }

      if(item.JUNGDAE_YN === 'Y') {
        jungdae.value.push(item)
      }

      if(item.LV4 !== null && item.LV4.indexOf('HHIZ010AJ')  > -1) {
        areaEtc1_1.value.push(item)
        if (item.SAGO_TYPE_CD === 'SJE'){
          areaEtc1_1_San.value.push(item)
        }
        else if (item.SAGO_TYPE_CD === 'GMS' || item.SAGO_TYPE_CD === 'HRS'){
          areaEtc1_1_Hue.value.push(item)
        }
        else if (item.SAGO_TYPE_CD === 'SNE' || item.SAGO_TYPE_CD === 'NON'  || item.SAGO_TYPE_CD === null){
          areaEtc1_1_Il.value.push(item)
        }
      } //else 

      if(item.LV1 === null) {
        areaEtc1_2.value.push(item)
        if (item.SAGO_TYPE_CD === 'SJE'){
          areaEtc1_2_San.value.push(item)
        }
        else if (item.SAGO_TYPE_CD === 'GMS' || item.SAGO_TYPE_CD === 'HRS'){
          areaEtc1_2_Hue.value.push(item)
        }
        else if (item.SAGO_TYPE_CD === 'SNE' || item.SAGO_TYPE_CD === 'NON'  || item.SAGO_TYPE_CD === null){
          areaEtc1_2_Il.value.push(item)
        }
      } 

      if(item.SAGO_TYPE_CD === 'SJE') {
        areaDataDe1_1.value.push(item)
        item.TYPE = "안전사고(산재)"
      } else if(item.SAGO_TYPE_CD === 'GMS' || item.SAGO_TYPE_CD === 'HRS') {
        areaDataDe1_2.value.push(item)
        item.TYPE = "안전사고(휴업)"
      } else if(item.SAGO_TYPE_CD === 'SNE' || item.SAGO_TYPE_CD === 'NON'  || item.SAGO_TYPE_CD === null) {
        areaDataDe1_3.value.push(item)
        item.TYPE = "안전사고(일반)"
      }

      logData1.value.push(item)
    }
    
  })

}

const setSAFAB0010Detail = async areaData => {
  //console.log('setSAFAB0010Detail',areaData.value)
  await setAreaCount(areaData.value)
  setAreaLevel(areas.value, areaLv.value, areaColor.value)
}

const setSAFAB0010List = async params => {
  //console.log('SAFAB0010_02 params',params)
  let response = await commonSearchApi({ queryId: "OPRAG0010_SAFAB0010_021", param: params })
  comDetailList.value = response.ORESULT_CUR
  //console.log('SAFAB0010_02 response',comDetailList.value)
}

//전사 안전사고 재해율(관리기준) 상세
const setSAFAD0010 = async() => {
  AccChartOpt.series[0].data = []
  AccChartOpt.series[1].data = []

  let response = await commonSearchApi({ queryId: "OPRAG0010_SAFAD0010_011", param: comParams.value })

  // let rate = 0.000
  response.ORESULT_CUR.forEach(item => {
    // rate = rate + item.ACC_RATE
    AccChartOpt.series[0].data.push(item.ACC_RATE_NM)
    AccChartOpt.series[1].data.push(item.ACC_RATE_PLN_MN)
  })
}

//안전 사고 데이터////////////////////////////////////////////////////////////////////

//안전수칙 위반 데이터////////////////////////////////////////////////////////////////////
const SAFDC0010 = async () => {
  let response = await commonSearchApi({ queryId: "OPRAG0010_SAFDC0010_011", param: setComParams('rules') })
  response = response.ORESULT_CUR
  // console.log('안전수칙 response',response)

  return response
}

const setSAFDC0010 = async res => {
  areaDataTo3.value = res
  areaEtc3_1.value = []
  areaEtc3_2.value = []
  areaDataDe3_1.value = []
  areaDataDe3_2.value = []
  areaDataDe3_3.value = []
  areaDataDe3_4.value = []
  areaDataDe3_5.value = []
  logData3.value = []
  
  res.forEach(item => {
    if(item.LV4 !== null && item.LV4.indexOf('HHIZ010AJ')  > -1) {
      areaEtc3_1.value.push(item)

      if(item.VIO_GDIV === 'A') {
        areaEtc3_1_abs.value.push(item)
      } else if(item.VIO_GDIV.indexOf('D')  > -1) {
        areaEtc3_1_ser.value.push(item)
      } else if(item.VIO_GDIV === 'B') {
        areaEtc3_1_gen.value.push(item)
      } else if(item.VIO_GDIV === 'E'){
        areaEtc3_1_crn.value.push(item)
      } else if(item.VIO_GDIV === 'F'){
        areaEtc3_1_safe.value.push(item)
      }

    } //else
    
    if(item.LV1 === null) {
      areaEtc3_2.value.push(item)

      if(item.VIO_GDIV === 'A') {
        areaEtc3_2_abs.value.push(item)
      } else if(item.VIO_GDIV.indexOf('D')  > -1) {
        areaEtc3_2_ser.value.push(item)
      } else if(item.VIO_GDIV === 'B') {
        areaEtc3_2_gen.value.push(item)
      } else if(item.VIO_GDIV === 'E'){
        areaEtc3_2_crn.value.push(item)
      } else if(item.VIO_GDIV === 'F'){
        areaEtc3_2_safe.value.push(item)
      }


    }
    //  else {
      if(item.VIO_GDIV === 'A') {
        areaDataDe3_1.value.push(item)
        item.TYPE = "안전수칙위반(절대)"
      } else if(item.VIO_GDIV.indexOf('D')  > -1) {
        areaDataDe3_2.value.push(item)
        item.TYPE = "안전수칙위반(중대성)"
      } else if(item.VIO_GDIV === 'B') {
        areaDataDe3_3.value.push(item)
        item.TYPE = "안전수칙위반(일반)"
      } else if(item.VIO_GDIV === 'E'){
        areaDataDe3_4.value.push(item)
        item.TYPE = "안전수칙위반(크레인)"
      } else if(item.VIO_GDIV === 'F'){
        areaDataDe3_5.value.push(item)
        item.TYPE = "안전수칙위반(The Safe Care 핵심안전수칙)"
      } else {
        item.TYPE = "안전수칙위반"
      }
    // }

    logData3.value.push(item)
  })
}

const setSAFDC0010Detail = async areaData => {
  //console.log('setSAFDC0010Detail',areaData.value)
  await setAreaCount(areaData.value)
  setAreaLevel(areas.value, areaLv.value, areaColor.value)
}

const setSAFDC0010List = async params => {
  //console.log('SAFDC0010_02 params',params)
  let response = await commonSearchApi({ queryId: "OPRAG0010_SAFDC0010_021", param: params })
  comDetailList.value = response.ORESULT_CUR
  //console.log('SAFDC0010_02 response',comDetailList.value)
}

//안전수칙 위반 데이터////////////////////////////////////////////////////////////////////

//안전점검 데이터////////////////////////////////////////////////////////////////////
const SAFCD0010 = async () => {
  // if()
  //console.log('SAFCD0010', detailCType.value, checkIns.value)
  comParams.value.ORGN_YN = checkIns.value
  comParams.value.YARD_APP_YN = checkYard.value

  let response = await commonSearchApi({ queryId: "OPRAG0010_SAFCD0010_1", param: setComParams('inspect') })
  response = response.ORESULT_CUR
  // console.log('안전점검 response',response)

  return response
}

const setSAFCD0010 = async res => {
  areaDataTo2.value = res
  areaEtc2_1.value = []
  areaEtc2_2.value = []
  areaDataDe2_1.value = []
  areaDataTDe2_1.value = 0
  areaDataDe2_2.value = []
  areaDataTDe2_2.value = 0
  areaDataDe2_3.value = []
  logData2.value = []
  
  res.forEach(item => {

    // 군산
    if(item.LV4 !== null && item.LV4.indexOf('HHIZ010AJ')  > -1) {
      areaEtc2_1.value.push(item)
      if (item.JOB_TYPE === 'ptw' || item.JOB_TYPE === 'ptwe'){
        areaEtc2_1_Ptw.value.push(item)
      }
      else if (item.JOB_TYPE === 'plan' ){
        areaEtc2_1_Plan.value.push(item)
      }
      else if (item.JOB_TYPE === 'daily' ){
        areaEtc2_1_Daily.value.push(item)
      }
    } //else 
    // 기타
    if(item.LV1 === null) {
      areaEtc2_2.value.push(item)
      if (item.JOB_TYPE === 'ptw' || item.JOB_TYPE === 'ptwe'){
        areaEtc2_2_Ptw.value.push(item)
      }
      else if (item.JOB_TYPE === 'plan' ){
        areaEtc2_2_Plan.value.push(item)
      }
      else if (item.JOB_TYPE === 'daily' ){
        areaEtc2_2_Daily.value.push(item)
      }
    }
    //  else {
      if(item.JOB_TYPE === 'ptw' || item.JOB_TYPE === 'ptwe') {
        areaDataDe2_1.value.push(item)
        item.TYPE = item.JOB_TYPE === 'ptw' ? "PTW 점검" : "PTW 점검(단기공사)"
        // if(item.STATUS === 'P' || item.STATUS === 'C')
        if(item.STATUS === 'C') // 점검완료 기준 데이터만 보여주기(윤찬양책임 요청(2024.11.20))
            areaDataTDe2_1.value = ++ areaDataTDe2_1.value
        } 
      else if(item.JOB_TYPE === 'plan') {
          areaDataDe2_2.value.push(item)
          item.TYPE = "부서관리작업 점검"
           // if(item.STATUS === 'P' || item.STATUS === 'C')
          if(item.STATUS === 'C') // 점검완료 기준 데이터만 보여주기(윤찬양책임 요청(2024.11.20))
            areaDataTDe2_2.value = ++ areaDataTDe2_2.value
        }
      else if(item.JOB_TYPE === 'daily') {
        //console.log('daily',item)
        areaDataDe2_3.value.push(item)
        item.TYPE = "일상 점검"
      }
    // }
    // if(item.STATUS !== 'N')
    if(item.STATUS === 'C') //점검완료 기준 데이터만 보여주기(윤찬양책임 요청(2024.11.20))
      logData2.value.push(item)
  })


  console.log('areaEtc1_1', areaEtc2_1)
  console.log('areaEtc2_1_Ptw', areaEtc2_1_Ptw)
  console.log('areaEtc2_1_Plan', areaEtc2_1_Plan)
  console.log('areaEtc2_1_Daily', areaEtc2_1_Daily)
  

}

const setSAFCD0010Detail = async areaData => {


  console.log('setSAFCD0010Detail',areaData)
  await setAreaCount(areaData.value)
  setAreaLevel(areas.value, areaLv.value, areaColor.value)

  if(detailCType.value !== 'daily') {
    //console.log('setSAFCD0010Detail detailCType',detailCType.value)
    let c_cnt = 0, p_cnt = 0, n_cnt = 0
      , grp0_cnt = 0, grp1_cnt = 0,grp2_cnt = 0,grp3_cnt = 0
      , grp0_tot = 0, grp1_tot = 0,grp2_tot = 0,grp3_tot = 0

    areaData.value.forEach(data => {
      switch (data.STATUS) {
      case 'C':
        c_cnt = ++ c_cnt
        break
      case 'P':
        p_cnt = ++ p_cnt
        break
      case 'N':
        n_cnt = ++ n_cnt
        break
      }
      // console.log('setSAFCD0010Detail grp', data)
      if(data.YARD_APP_YN === 'C') {
        grp0_tot = ++ grp0_tot
        grp1_tot = ++ grp1_tot
      } else if(data.YARD_APP_YN === 'F' || data.YARD_APP_YN === 'S') {
        grp0_tot = ++ grp0_tot
        grp1_tot = ++ grp1_tot
        grp2_tot = ++ grp2_tot
        grp3_tot = ++ grp3_tot
      }
      grp0_cnt = Number(data.GRP_0) > 0 ? ++ grp0_cnt : grp0_cnt
      grp1_cnt = Number(data.GRP_1) > 0 ? ++ grp1_cnt : grp1_cnt
      grp2_cnt = Number(data.GRP_2) > 0 ? ++ grp2_cnt : grp2_cnt
      grp3_cnt = Number(data.GRP_3) > 0 ? ++ grp3_cnt : grp3_cnt
    })

    checkCnt.value.cTotal = c_cnt
    checkCnt.value.pTotal = p_cnt
    checkCnt.value.nTotal = n_cnt
    checkCnt.value.grp0Total = grp0_tot
    checkCnt.value.grp1Total = grp1_tot
    checkCnt.value.grp2Total = grp2_tot
    checkCnt.value.grp3Total = grp3_tot
    checkCnt.value.grp0Cnt = grp0_cnt
    checkCnt.value.grp1Cnt = grp1_cnt
    checkCnt.value.grp2Cnt = grp2_cnt
    checkCnt.value.grp3Cnt = grp3_cnt

    //console.log('checkCnt', checkCnt.value)
    // byTopicChartOpt1.value.series[0].data = [
    //   // { value: checkCnt.value.grp0Cnt }, { value: checkCnt.value.grp0Total },
    //   { value: (checkCnt.value.grp0Cnt / checkCnt.value.grp0Total ) * 100 },
    // ]
    
    progressLine1.value = 0
    progressLine1.value = (checkCnt.value.grp0Cnt / checkCnt.value.grp0Total ) * 100
    
    progressLine2.value = 0
    progressLine2.value = (checkCnt.value.grp1Cnt / checkCnt.value.grp1Total ) * 100

    progressLine3.value = 0
    progressLine3.value = (checkCnt.value.grp2Cnt / checkCnt.value.grp2Total ) * 100

    // byTopicChartOpt2.value.series[0].data = [
    //   // { value: checkCnt.value.grp1Cnt }, { value: checkCnt.value.grp1Total },
    //   { value: (checkCnt.value.grp1Cnt / checkCnt.value.grp1Total ) * 100 },
    // ]
    
    // byTopicChartOpt3.value.series[0].data = [
    //   // { value: checkCnt.value.grp2Cnt }, { value: checkCnt.value.grp2Total },
    //   { value: (checkCnt.value.grp2Cnt / checkCnt.value.grp2Total ) * 100 },
    // ]
  }
}

const setSAFCD0010List = async queryData => {//////////////
  console.log('SAFCD0010List params',queryData)
  let response = await commonSearchApi(queryData)
  comDetailList.value = response.ORESULT_CUR
  //console.log('SAFCD0010List response',comDetailList.value)
}

const setSAFCD0010AllList = async () => {//////////////
  console.log('setSAFCD0010AllList ')
  let resAll = []
  let queryInfo = {
    queryId: 'OPRAG0010_SAFCD0010_011',
    param: comParams.value,
  }
  let response1 = await commonSearchApi(queryInfo)
  queryInfo.queryId = 'OPRAG0010_SAFCD0010_021'
  let response2 = await commonSearchApi(queryInfo)
  queryInfo.queryId = 'OPRAG0010_SAFCD0010_031'
  let response3 = await commonSearchApi(queryInfo)

  response1.ORESULT_CUR.forEach(data => {
    resAll.push(data)
  })

  response2.ORESULT_CUR.forEach(data => {
    resAll.push(data)
  })

  response3.ORESULT_CUR.forEach(data => {
    resAll.push(data)
  })

  comDetailList.value = resAll
  //console.log('setSAFCD0010AllList response',comDetailList.value)
}

//안전점검 데이터////////////////////////////////////////////////////////////////////

//공통 데이터 장소 카운트
const setAreaCount = areaData => {
  // if(areaData.length > 0) {
  area1.value.forEach(areaItem => {
    let count = 0, c_cnt = 0, p_cnt = 0, n_cnt = 0
    areaItem.count = areaItem.c_cnt = areaItem.p_cnt = areaItem.n_cnt = 0
    areaData.forEach(dataItem => {
      if(dataItem.LV1 !== null && areaItem.ALL_SYS_CD === dataItem.LV1) {
        count = ++count

        // if(inspectCard.value && (mapMakersVisable.value.ptw || mapMakersVisable.value.plan)) {
        if(inspectCard.value) {
          
          if(dataItem.STATUS === 'C')  c_cnt = ++ c_cnt
          if(dataItem.STATUS === 'P')  p_cnt = ++ p_cnt
          if(dataItem.STATUS === 'N')  n_cnt = ++ n_cnt
        }
      }
    })
    areaItem.count = count
    areaItem.c_cnt = c_cnt
    areaItem.p_cnt = p_cnt
    areaItem.n_cnt = n_cnt
  })
  area2.value.forEach(areaItem => {
    let count = 0, c_cnt = 0, p_cnt = 0, n_cnt = 0
    areaItem.count = areaItem.c_cnt = areaItem.p_cnt = areaItem.n_cnt = 0
    areaData.forEach(dataItem => {
      if(dataItem.LV2 !== null && areaItem.ALL_SYS_CD === dataItem.LV2) {
        count = ++count
        if(inspectCard.value) {
          
          if(dataItem.STATUS === 'C')  c_cnt = ++ c_cnt
          if(dataItem.STATUS === 'P')  p_cnt = ++ p_cnt
          if(dataItem.STATUS === 'N')  n_cnt = ++ n_cnt
        }
      }
    })
    areaItem.count = count
    areaItem.c_cnt = c_cnt
    areaItem.p_cnt = p_cnt
    areaItem.n_cnt = n_cnt
  })
  area3.value.forEach(areaItem => {
    let count = 0, c_cnt = 0, p_cnt = 0, n_cnt = 0
    areaItem.count = areaItem.c_cnt = areaItem.p_cnt = areaItem.n_cnt = 0
    areaData.forEach(dataItem => {
      if(dataItem.LV3 !== null && areaItem.ALL_SYS_CD === dataItem.LV3) {
        count = ++count
        if(inspectCard.value) {
          
          if(dataItem.STATUS === 'C')  c_cnt = ++ c_cnt
          if(dataItem.STATUS === 'P')  p_cnt = ++ p_cnt
          if(dataItem.STATUS === 'N')  n_cnt = ++ n_cnt
        }
      }
    })
    areaItem.count = count
    areaItem.c_cnt = c_cnt
    areaItem.p_cnt = p_cnt
    areaItem.n_cnt = n_cnt
  })
  area4.value.forEach(areaItem => {
    let count = 0, c_cnt = 0, p_cnt = 0, n_cnt = 0
    areaItem.count = areaItem.c_cnt = areaItem.p_cnt = areaItem.n_cnt = 0
    areaData.forEach(dataItem => {
      if(dataItem.LV4 !== null && areaItem.AREA_CD === dataItem.LV4) {
        count = ++count
        if(inspectCard.value) {
          if(dataItem.STATUS === 'C')  c_cnt = ++ c_cnt
          if(dataItem.STATUS === 'P')  p_cnt = ++ p_cnt
          if(dataItem.STATUS === 'N')  n_cnt = ++ n_cnt
        }
      }
    })
    areaItem.count = count
    areaItem.c_cnt = c_cnt
    areaItem.p_cnt = p_cnt
    areaItem.n_cnt = n_cnt
  })

  // console.log('area1',area1.value)
  // console.log('area2',area2.value)
  // console.log('area3',area3.value)
  // console.log('area4',area4.value)
  // }
}

// 지역 정보 조회
const getInitArea  = async () => {
  // 조직도 부서 조회 파라미터
  let acdtParms = reactive({
    CMPNY_DIV:'HHI',

    // ALL_UP_CD:'HHIZ010',
    // USE_FLAG:'Y',
  })
  let response = await commonSearchApi({ queryId: "OPRAG0020_SEARCH_06", param: acdtParms })
  response = response.ORESULT_CUR

  // console.log('area response',response)
  
  area0.value = []
  area1.value = []
  area2.value = []
  area3.value = []
  area4.value = []

  for (var i in response) {
    if(response[i].LV === '0') {
      response[i].SCALE = 20//1.7
      response[i].FONT = '16px 나눔고딕'
      if(response[i].LAT != null) {
        area4.value.push(response[i])
      } else
        area0.value.push(response[i])
      //console.log('LV0 area', response[i].AREA_CD, response[i].LAT)
    } else if(response[i].LV === '1') {
      response[i].SCALE = 50//4 
      response[i].FONT = '24px 나눔고딕'
      area1.value.push(response[i])
    } else if(response[i].LV === '2') {
      response[i].SCALE = 40//3 
      response[i].FONT = '20px 나눔고딕'
      area2.value.push(response[i])
    } else if(response[i].LV === '3') {
      response[i].SCALE = 30//1.7 
      response[i].FONT = '16px 나눔고딕'
      area3.value.push(response[i])
    } else if(response[i].LV === '4') {
      response[i].SCALE = 16//1 
      response[i].FONT = '16px 나눔고딕'
      //console.log('LV4 area', response[i].AREA_CD, response[i].LAT)
      area4.value.push(response[i])
    }
  }

  if(areaLv.value === '1')
    areas.value = area1.value
  else if(areaLv.value === '2')
    areas.value = area2.value
  else if(areaLv.value === '3')
    areas.value = area3.value
  else if(areaLv.value === '4')
    areas.value = area4.value

  // console.log('area0',area0.value)
  // console.log('area1',area1.value)
  // console.log('area2',area2.value)
  // console.log('area3',area3.value)
  // console.log('area4',area4.value)
  setSAFFB0010()
  setMNGAA0060()

  let response1 = await SAFAB0010()  // 안전수칙
  let response2 = await SAFCD0010()  // 안전점검
  let response3 = await SAFDC0010()  // 안전사고

  await setSAFAB0010(response1)
  await setSAFCD0010(response2)
  await setSAFDC0010(response3)

  //대시보드 첫로드 시 안전점검현황 마커뿌리기
  //console.log("[setAreaCount] areaDataTo2.value", areaDataTo2.value)
  await setAreaCount(areaDataTo2.value)

  logData.value = logData2.value
  areaEtc1.value = areaEtc2_1.value
  areaEtc2.value = areaEtc2_2.value

  // areaEtc3.value = areaEtc1_3.value
  // console.log("[setAreaLevel] areaDataTo2.value", areas.value, areaLv.value, areaColor.value)
  setAreaLevel(areas.value, areaLv.value, areaColor.value)

  
}

//상세정보 Tooltip
const detailTooltip = item => {
  return `
        <div class="dashIns mapMarker">
          <div class="ptwLabel">
            <div class="accident" >
              <img src="${getMapImg('accident')}"/>
              <div style="padding-top: 2px;">${ item.n }</div>
            </div>
            <div class="progress" >
              <img src="${getMapImg('progress')}"/>
              <div style="padding-top: 2px;">${ item.p }</div>
            </div>
            <div class="complete" >
              <img src="${getMapImg('complete')}"/>
              <div style="padding-top: 2px;">${ item.c }</div>
            </div>
            <div class="total" style="display: none;">
              <div style="padding-top: 2px;">${ item.tot }</div>
            </div>
            <div class="foldBtn">
              <img src="${getMapImg('fold')}"/>
            </div>
          </div>
        </div>
        `
}

const setAreaLevel = (area, lv, color) => {
  console.log('setAreaLevel', area)
  pannelShow.value = false
  let areaFeatures = []
  let areaFeature = null
  areaLayers.getSource().clear()
  transportMap.getOverlays().clear()

  for (var i in area) {
    // console.log('areaOrg index', area[i].ALL_SYS_CD.indexOf(areaOrg.value))
    if(area[i].LAT != null && area[i].ALL_SYS_CD.indexOf(areaOrg.value) > -1) {
      // let count = Math.floor(Math.random() * 1000 + 1) + ''
      let coordinates = area[i].LAT.split(',')
      let point = new Point(proj4('EPSG:4326', 'EPSG:5187', [parseFloat(coordinates[0]), parseFloat(coordinates[1])]))

      if(inspectCard.value && (mapMakersVisable.value.ptw || mapMakersVisable.value.plan)) { //Number(lv) > 2) {
        ptwFold[i] = true

        const overlay = new Overlay({
          id: lv === '4' ? area[i].AREA_CD : area[i].ALL_SYS_CD,
          element: document.getElementById('popup'),
          className: 'ol ol-overlay-container ol-selectable',
        })

        // console.log('cnt', area[i].n_cnt, area[i].p_cnt, area[i].c_cnt)
        let items = {
          tot: !area[i].count ? '0' : area[i].count,
          c: !area[i].c_cnt ? '0' : area[i].c_cnt,
          p: !area[i].p_cnt ? '0' : area[i].p_cnt,
          n: !area[i].n_cnt ? '0' : area[i].n_cnt,
        }

        overlay.setPosition(proj4('EPSG:4326', 'EPSG:5187', [parseFloat(coordinates[0]), parseFloat(coordinates[1])]))
        overlay.element.innerHTML = detailTooltip(items)
        transportMap.addOverlay(overlay)

        const marker = overlay.element.children[0]
        const eVal = overlay.element.children[0].children[0].children
        const btn = overlay.element.children[0].children[0].children[4]


     
        if(items.tot === '0') {
          btn.classList.add('ptwFold')
          for (var item = 0; item < eVal.length; item++) {
            // console.log('classList',eVal[item].className)
            if(!eVal[item].classList.contains('foldBtn')) {
              eVal[item].style.display = "none"
            }

            if(eVal[item].classList.contains('total'))
              eVal[item].style.display = ""
          }
        }  
        else{ 
          marker.addEventListener('click', function (evt) {
          if(areaLv.value === '4') {
            setComParams(detailType.value)
            let id = ''
            
            if(detailCType.value === 'ptw') {
              id = 'OPRAG0010_SAFCD0010_011' // 사업부, 부문, 부서도 반영되어야 해서 01->011로 변경
            } else if(detailCType.value === 'plan') {
              id = 'OPRAG0010_SAFCD0010_021'
            }

            comParams.value.WORK_LOC = overlay.id
            
            let queryInfo = {
              queryId: id,
              param: comParams.value,
            }
            console.log('queryInfo', queryInfo)
            setSAFCD0010List(queryInfo)
           
            clickMarker(detailType.value)
          }
        })

        btn.addEventListener('click', function (evt) {
          console.log('overlay',overlay)
          ptwFold[overlay.id] = !ptwFold[overlay.id]
          
          if(!ptwFold[overlay.id]) {
            btn.classList.add('ptwFold')
            overlay.element.classList.remove('active')
            for (var item = 0; item < eVal.length; item++) {
              // console.log('classList',eVal[item].className)
              if(!eVal[item].classList.contains('foldBtn')) {
                eVal[item].style.display = "none"
              }

              if(eVal[item].classList.contains('total'))
                eVal[item].style.display = ""
            }
          } else {
            btn.classList.remove('ptwFold')
            overlay.element.classList.add('active')
            for (var item = 0; item < eVal.length; item++) {
              if(!eVal[item].classList.contains('foldBtn')) {
                eVal[item].style.display = ""
              }
              if(eVal[item].classList.contains('total'))
                eVal[item].style.display = "none"
            }
          }
          
        })
      }
      } else {
        // console.log('area count', area[i].count)
        areaFeature = new Feature(point)
        areaFeature.count = !area[i].count ? '0' : area[i].count +''
        areaFeature.name = area[i].SYS_CDNM
        areaFeature.cd = Number(lv) < 4 ? area[i].ALL_SYS_CD : area[i].AREA_CD
        
        if(areaFeature.count === '0' && color.length < 8) 
          color = color + '80'
        else if(areaFeature.count !== '0' && color.length > 8)
          color = color.substr(0, 7)
          
        //console.log('count', areaFeature.count, color)
        areaFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: area[i].SCALE,
              // scale: area[i].SCALE,
              // stroke: new Stroke({
              //   // color: color,//'1A' ,
              //   width: area[i].SCALE, //6
              // }),
              fill: new Fill({
                color: color,
              }),
            }),
            zIndex: 1,
            text: new Text({
              text: areaFeature.count,// + '[' +areaFeature.name + ']',
              font: area[i].FONT,
              fill: new Fill({
                color: '#FFFFFF',
              }),
              
            }),
          }),
        )
        areaFeatures.push(areaFeature)
      }
    }
  }
  
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

// ffeatureStyler, 외곽선굵기, 라인색상, 색상값, 선종류, 선Clear
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

const view = new View({
  center: proj4('EPSG:4326', 'EPSG:5187', mapCenter4326),//[240175.364, 324954.256],
  zoomFactor: 2,
  zoom: initZoom,
  maxZoom: 20,
  minZoom: 14,

  // rotation: 11,
  enableRotation: false,
})

// zoom level 변화에 따른 text 값 설정
const checkZoom = () => {
  noneOverlay()

  const newZoomLevel = parseFloat(transportMap.getView().getZoom())

  setZoom.value = newZoomLevel
  //console.log('setZoom',setZoom.value)
  if(newZoomLevel < 15.8) {
    areaLv.value = '1'
    areas.value = area1.value
    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  } else if(newZoomLevel >= 15.8 && newZoomLevel < 16.5) {
    areaLv.value = '2'
    areas.value = area2.value
    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  } else if(newZoomLevel >= 16.5 && newZoomLevel < 17.5) {
    areaLv.value = '3'
    areas.value = area3.value
    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  } else if(newZoomLevel >= 17.5) {
    areaLv.value = '4'
    areas.value = area4.value
    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  }

  // 호선정보 style 변경
  const shipFeatures = shipLayers.getSource().getFeatures()

  for (const i in shipFeatures) {
    shipFeatures[i].setStyle(
      featureStyler(shipFeatures[i], LineWidth1, colorBlack, 'stayColor'),
    )
  }
}

const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: transportMap,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 2,
  },
})

const currentFeature = ref()
const shipInfo = ref()

const displayFeatureInfo = async (pixel, target) => {

  const feature = target.closest('.ol-control')
    ? undefined
    : transportMap.forEachFeatureAtPixel(pixel, function (feature) {
      return feature
    })

  if (feature) {
    // console.log('displayFeatureInfo feature',feature)
    // console.log('displayFeatureInfo feature',feature.cd,feature.name)
    // console.log('displayFeatureInfo Point',proj4('EPSG:5187', 'EPSG:4326', feature.getGeometry().getCoordinates()))
    //console.log('displayFeatureInfo currentFeature',currentFeature)

    if(feature.type) {
      pannelShow.value = false
      // console.log('type', feature.type)
      if(feature.type == 'ship') {
        commonSearchApi(
          { queryId: "OPRAG0010_SHIP_INFO", param: { SHPNO: feature.ship } },
        ).then(res => {
          //console.log('SHIP_INFO pixel', res.ORESULT_CUR[0])
          shipData.value = res.ORESULT_CUR[0]
          shipInfo.value.style.left = pixel[0] + 'px'
          shipInfo.value.style.top = pixel[1] + 'px'

          if (feature !== currentFeature.value) {
            shipInfo.value.style.visibility = 'visible'
          }
          currentFeature.value = feature
        })
      }
        
    } else {
      //console.log('type', '!type')
      if(areaLv.value === '4') {
        setComParams(detailType.value)
       
        if(accidentCard.value) {
          //console.log('areaDataDe1_1',areaDataDe1_1.value)
          //console.log('areaDataDe1_2',areaDataDe1_2.value)
          //console.log('areaDataDe1_3',areaDataDe1_3.value)
          
          // if(detailCType.value === 'idt') {
          //   comParams.value.SAGO_TYPE_CD = 'SJE'
          // } else if(detailCType.value === 'clo') {
          //   comParams.value.SAGO_TYPE_CD = "'GMS' , 'HRS'"
          // } else if(detailCType.value === 'gen') {
          //   comParams.value.SAGO_TYPE_CD = "'SNE' , 'NON', null"
          // } else {
          comParams.value.SAGO_TYPE_CD = null
          // }

          comParams.value.SAGO_LOC = feature.cd
          setSAFAB0010List(comParams.value)
        } else if(inspectCard.value) {
          //console.log('areaDataDe2_1',areaDataDe2_1.value)
          //console.log('areaDataDe2_2',areaDataDe2_2.value)
          //console.log('areaDataDe2_3',areaDataDe2_3.value)
          //console.log('detailCType',detailCType.value)
          console.log(feature)
          comParams.value.WORK_LOC = feature.cd
          
          await setSAFCD0010AllList()
        } else if(rulesCard.value) {
          //console.log('areaDataDe3_1',areaDataDe3_1.value)
          //console.log('areaDataDe3_2',areaDataDe3_2.value)
          //console.log('areaDataDe3_3',areaDataDe3_3.value)
          if(detailCType.value === 'absolute') {
            comParams.value.VIO_GDIV = 'A'
          } else if(detailCType.value === 'important') {
            comParams.value.VIO_GDIV = 'D'
          } else if(detailCType.value === 'general') {
            comParams.value.VIO_GDIV = 'B'
          } else if(detailCType.value === 'crane'){
            comParams.value.VIO_GDIV = 'E'
          } else if(detailCType.value === 'safecare'){
            comParams.value.VIO_GDIV = 'F'
          } else {
            comParams.value.VIO_GDIV = null
          }
          comParams.value.VIO_LOC = feature.cd
          setSAFDC0010List(comParams.value)
        }
        
        clickMarker(detailType.value)
      }
    }

    
  } else {
    pannelShow.value = false
    shipInfo.value.style.visibility = 'hidden'
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

const formDate = ref(dayjs().format('YYYY-MM-DD'))
const formAccDate = ref(dayjs().format('YYYY-MM-DD'))
const formRulDate = ref(dayjs().format('YYYY-MM-DD'))
const formInsDate = ref(dayjs().format('YYYY-MM-DD'))
const dateAccYear = ref(dayjs().format('YYYY'))
const dateAccMonth = ref(dayjs().format('MM'))
const dateRulYear = ref(dayjs().format('YYYY'))
const dateRulMonth = ref(dayjs().format('MM'))

const maxDate = ref(dayjs().format('YYYY-MM-DD'))
const toMonth = ref(Number(dayjs().format('MM')) - 1)

// ⭐ 이미지 가져오기
function getMapImg(name) {
  return new URL(`/src/assets/images/dashboard/${name}.png`, import.meta.url).href
}

// screen expansion 확장 여부
const screenExpansion = ref(false)

// 전사 안전사고 발생 현황
const AccChartOpt = reactive({
  grid: { bottom: '20px', top: '20px', left: '10px', right: '10px' },
  legend: {
    show: true,
    left: 'left',
    textStyle: { color: '#fff' },
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  xAxis: {
    type: 'category',

    // boundaryGap: false,
    data: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.25)',
      },
    },
    splitLine: { show: true, lineStyle: { type: 'dashed', color: 'rgba(255, 255, 255, 0.25)' } },
    nameGap: 0,
    nameTextStyle: { color: '#fff' },
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      name: '재해율',
      type: 'line',
      color: '#37E8C8',
      symbol: 'circle',
      symbolSize: 5,
      data: [],
      markLine: {
        symbol: ['none'],
        label: { show: false },
        lineStyle: {
          // type: 'line',
          width: 2,
          color: '#5470C6',
        },
        data: [{ xAxis: toMonth.value }],
      },
    },
    {
      name: '관리기준',
      type: 'line',
      lineStyle: {
        color: '#F90',
        type: 'dashed',
      },
      color: '#F90',
      symbol: 'circle',
      symbolSize: 5,
      data: [],
    },
  ],
})

const byTopicChartOpt1 = ref({
  series: [
    {
      name: 'byTopicChartOpt1',
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      pointer: {
        show: false
      },
      detail: {
          show: false // % 표시 숨기기
      },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: {
          borderWidth: 1,
          borderColor: '#1A40C7',
          color: '#1A40C7'
        }
      },
      axisLine: {
        lineStyle: {
          width: 3,
          color: [[1, '#566280']]
        }
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false,
        distance: 50
      },
      title: {
        show: false
      },
      detail: {
        show: false
      },
      data: [
          { value: 50 }
      ]
    }
  ]
})

const byTopicChartOpt2 = ref({
  series: [
    {
      name: 'byTopicChartOpt2',
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      pointer: {
        show: false
      },
      detail: {
          show: false // % 표시 숨기기
      },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: {
          borderWidth: 1,
          borderColor: '#08B9C8',
          color: '#08B9C8'
        }
      },
      axisLine: {
        lineStyle: {
          width: 3,
          color: [[1, '#566280']]
        }
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false,
        distance: 50
      },
      title: {
        show: false
      },
      detail: {
        show: false
      },
      data: [
          { value: 50 }
      ]
    }
  ]
  // legend: {
  //   show: false,
  // },
  // series: [
  //   {
  //     name: 'byTopicChartOpt2',
  //     type: 'pie',

  //     // startAngle: 90,
  //     // endAngle: 450,
  //     radius: ['80%', '20%'],
  //     center: ['50%', '50%'],
  //     labelLine: {
  //       show: false,
  //     },
  //     avoidLabelOverlap: false,
  //     emphasis: {
  //       disabled: true,
  //     },
  //     itemStyle: {
  //       // borderRadius: '100%',
  //     },
  //     color: ['#08B9C8', '#566280'],
  //     data: [{ value: 200 }, { value: 300 }],
  //   },
  // ],
})

const byTopicChartOpt3 = ref({
  series: [
    {
      name: 'byTopicChartOpt3',
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      pointer: {
        show: false
      },
      detail: {
          show: false // % 표시 숨기기
      },
      progress: {
        show: true,
        overlap: false,
        roundCap: true,
        clip: false,
        itemStyle: {
          borderWidth: 1,
          borderColor: '#16C3F4',
          color: '#16C3F4'
        }
      },
      axisLine: {
        lineStyle: {
          width: 3,
          color: [[1, '#566280']]
        }
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false,
        distance: 50
      },
      title: {
        show: false
      },
      detail: {
        show: false
      },
      data: [
          { value: 50 }
      ]
    }],
  // legend: {
  //   show: false,
  // },
  // series: [
  //   {
  //     name: 'byTopicChartOpt3',
  //     type: 'pie',

  //     // startAngle: 90,
  //     // endAngle: 450,
  //     radius: ['80%', '20%'],
  //     center: ['50%', '50%'],
  //     labelLine: {
  //       show: false,
  //     },
  //     avoidLabelOverlap: false,
  //     emphasis: {
  //       disabled: true,
  //     },
  //     itemStyle: {
  //       // borderRadius: '100%',
  //     },
  //     color: ['#16C3F4', '#566280'],
  //     data: [{ value: 30 }, { value: 300 }],
  //   },
  // ],
})

//////
const accidentCard = ref(false) // 전사 안전사고 발생 현황 체크
const inspectCard = ref(true) // 안전점검 현황 체크
const rulesCard = ref(false) // 안전수칙 위반 현황 체크
const orgnAccDiv = ref('yyyymm') // 일/년_월
const orgnInsDiv = ref('date') // 일/년_월
const orgnRulDiv = ref('yyyymm') // 일/년_월

const typeAccDiv = ref('acc') // 월/누적 mm/acc
const typeRulDiv = ref('acc') // 월/누적 mm/acc

const mapMakersVisable = ref({
  idt: false,
  clo: false,
  gen: false,
  ptw: false,
  plan: false,
  daily: false,
  absolute: false,
  important: false,
  general: false,
  crane: false,
  safecare: false,
})


const cleardetail = () => {
  console.log("cleardetail")
  areaEtc2_1_Ptw.value = []
  areaEtc2_1_Plan.value = []
  areaEtc2_1_Daily.value = []
  areaEtc2_2_Ptw.value = []
  areaEtc2_2_Plan.value = []
  areaEtc2_2_Daily.value = []

  areaEtc1_1_San.value = []
  areaEtc1_1_Hue.value = []
  areaEtc1_1_Il.value = []
  areaEtc1_2_San.value = []
  areaEtc1_2_Hue.value = []
  areaEtc1_2_Il.value = []

  areaEtc3_1_abs.value = []
  areaEtc3_1_crn.value = []
  areaEtc3_1_gen.value = []
  areaEtc3_1_ser.value = []
  areaEtc3_1_safe.value = []
  areaEtc3_2_abs.value = []
  areaEtc3_2_crn.value = []
  areaEtc3_2_gen.value = []
  areaEtc3_2_ser.value = []
  areaEtc3_2_safe.value = []


}

// 현황 카드 클릭
const clickCard = async type => {

  cleardetail()

  // 카드 선택 해지되면 모든 마커 off
  Object.keys(mapMakersVisable.value).forEach(key => {
    mapMakersVisable.value[key] = false
  })

  detailType.value = type
  if(type === 'accident') {
    accidentCard.value = true
    rulesCard.value = inspectCard.value = false
    areaColor.value = '#E1580A'
    
    await setSAFAB0010(areaDataTo1.value)
    await setAreaCount(areaDataTo1.value)
    
    logData.value = logData1.value
    areaEtc1.value = areaEtc1_1.value
    areaEtc2.value = areaEtc1_2.value

    // areaEtc3.value = areaEtc1_3.value

    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  } else if(type === 'inspect') {

    console.log("type", type)
    inspectCard.value = true
    accidentCard.value = rulesCard.value = false
    areaColor.value = '#1A40C7'

    await setSAFCD0010(areaDataTo2.value)
    await setAreaCount(areaDataTo2.value)
    //console.log()
    logData.value = logData2.value

    areaEtc1.value = areaEtc2_1.value
    areaEtc2.value = areaEtc2_2.value



    // areaEtc3.value = areaEtc2_3.value

    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  } else if(type === 'rules') {
    rulesCard.value = true
    accidentCard.value = inspectCard.value = false
    areaColor.value = '#11A74D'

    await setSAFDC0010(areaDataTo3.value)
    await setAreaCount(areaDataTo3.value)

    logData.value = logData3.value
    areaEtc1.value = areaEtc3_1.value
    areaEtc2.value = areaEtc3_2.value

    // areaEtc3.value = areaEtc3_3.value

    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  }

  detailCType.value = ''
  accBtnList.value.forEach(el => (el.selected = el.id === type ? true : false))
  showInspectChart.value = false
}

const accidentAcc = ref(false) // 안전사고 발생 현황
const rulesAcc = ref(false)  // 안전수칙 위반 현황

// 누적/금일 클릭
function clickAccidentFilter(type) {
  accidentAcc.value = type === 'mm' ? false : true
  //console.log('clickAccidentFilter', type)
}

function clickRulesFilter(type) {
  rulesAcc.value = type === 'mm' ? false : true
  //console.log('clickRulesFilter', type)
}


// 현황 상세 클릭
function clickDetail(type) {
  console.log('clickDetail', type, mapMakersVisable.value[type])
  detailCType.value = type

  // 2025.09.01 윤찬양 책임 요청으로 고위험점검인 경우 3중점검(국한) 체크 기본값
  checkYard.value = type === "ptw" ? "Y" : "N"

  // 선택한 카드에서 현재 클릭한 마커만 활성화 (버튼 활성화)
  if(mapMakersVisable.value[type])
    return

  Object.keys(mapMakersVisable.value).forEach(key => {
    mapMakersVisable.value[key] = false
  })
  mapMakersVisable.value[type] = !mapMakersVisable.value[type]
  if(type === 'idt') {
    console.log('idt')
    areaEtc1.value = areaEtc1_1_San.value
    areaEtc2.value = areaEtc1_2_San.value
    setSAFAB0010Detail(areaDataDe1_1)
  } else if(type === 'clo') {
    console.log('clo')
    areaEtc1.value = areaEtc1_1_Hue.value
    areaEtc2.value = areaEtc1_2_Hue.value
    setSAFAB0010Detail(areaDataDe1_2)
  } else if(type === 'gen') {
    console.log('gen')
    areaEtc1.value = areaEtc1_1_Il.value
    areaEtc2.value = areaEtc1_2_Il.value
    setSAFAB0010Detail(areaDataDe1_3)
  } else if(type === 'ptw') {
    areaEtc1.value = areaEtc2_1_Ptw.value
    areaEtc2.value = areaEtc2_2_Ptw.value
    setSAFCD0010Detail(areaDataDe2_1)
  } else if(type === 'plan') {
    areaEtc1.value = areaEtc2_1_Plan.value
    areaEtc2.value = areaEtc2_2_Plan.value
    setSAFCD0010Detail(areaDataDe2_2)
  } else if(type === 'daily') {
    areaEtc1.value = areaEtc2_1_Daily.value
    areaEtc2.value = areaEtc2_2_Daily.value
    setSAFCD0010Detail(areaDataDe2_3)
  } else if(type === 'absolute') {
    areaEtc1.value = areaEtc3_1_abs.value
    areaEtc2.value = areaEtc3_2_abs.value
    setSAFDC0010Detail(areaDataDe3_1)
  } else if(type === 'important') {
    areaEtc1.value = areaEtc3_1_ser.value
    areaEtc2.value = areaEtc3_2_ser.value
    setSAFDC0010Detail(areaDataDe3_2)
  } else if(type === 'general') {
    areaEtc1.value = areaEtc3_1_gen.value
    areaEtc2.value = areaEtc3_2_gen.value
    setSAFDC0010Detail(areaDataDe3_3)
  } else if(type === 'crane') {
    areaEtc1.value = areaEtc3_1_crn.value
    areaEtc2.value = areaEtc3_2_crn.value
    setSAFDC0010Detail(areaDataDe3_4)
  } else if(type === 'safecare'){
    areaEtc1.value = areaEtc3_1_safe.value
    areaEtc2.value = areaEtc3_2_safe.value
    setSAFDC0010Detail(areaDataDe3_5)
  }

  if(type === 'ptw' || type === 'plan')
    showInspectChart.value = true
  else
    showInspectChart.value = false
}

// 일/년_월 라디오버튼 이벤트
const changeOrgnDiv = val => {
  //console.log('changeOrgnDiv', val)
  //console.log('라디오버튼')
}

// 월/누적 라디오버튼 이벤트
const changeTypeDiv = val => {
  //console.log('changeTypeDiv', val)
}

// 일/월_년 적용 버튼 클릭
const btnClick = async () => {


  console.log('적용',detailType.value, checkIns.value)
  Object.keys(mapMakersVisable.value).forEach(key => {
    mapMakersVisable.value[key] = false
  })
  pannelShow.value = false
  showInspectChart.value = false
  detailCType.value = ''
  // await setSAFFB0010()
  setSAFFB0010()
  setMNGAA0060()

  await setSAFAB0010(await SAFAB0010()) //안전사고
  await setSAFDC0010(await SAFDC0010()) //수칙위반
  await setSAFCD0010(await SAFCD0010()) //안전점검

  if(detailType.value === 'accident') {
    await setAreaCount(areaDataTo1.value)

    logData.value = logData1.value
    areaEtc1.value = areaEtc1_1.value
    areaEtc2.value = areaEtc1_2.value

    // areaEtc3.value = areaEtc1_3.value
    setAreaLevel(areas.value, areaLv.value, areaColor.value)
    
  } else if(detailType.value === 'inspect') {
    await setAreaCount(areaDataTo2.value)

    logData.value = logData2.value
    areaEtc1.value = areaEtc2_1.value
    areaEtc2.value = areaEtc2_2.value

    // areaEtc3.value = areaEtc2_3.value
    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  } else if(detailType.value === 'rules') {
    await setAreaCount(areaDataTo3.value)

    logData.value = logData3.value
    areaEtc1.value = areaEtc3_1.value
    areaEtc2.value = areaEtc3_2.value

    // areaEtc3.value = areaEtc3_3.value

    setAreaLevel(areas.value, areaLv.value, areaColor.value)
  }

  console.log('autoUpdate ::: ', autoUpdate.value)
  if(autoUpdate.value === 'Y'){    
    setTime.value = setInterval(() => {
      console.log('setInterval')
      btnClick()
    }, 300000)
  } else {
    clearInterval(setTime.value)
  }
}

// SLI 현황 데이터
const sliData = ref([
  { BSNS_NM: '전사', TOT_SVG: 0, TOTAL_GRADE: '' },
  { BSNS_NM: '조선', TOT_SVG: 0, TOTAL_GRADE: '' },
  { BSNS_NM: '해양에너지', TOT_SVG: 0, TOTAL_GRADE: '' },
  { BSNS_NM: '특수선', TOT_SVG: 0, TOTAL_GRADE: '' },
  { BSNS_NM: '엔진기계', TOT_SVG: 0, TOTAL_GRADE: '' },
])

// 부문별 안전 주요KPI 데이터
const kpiList = ref([])

//
const areaBtnList  = ref([
  { text: '본공장', id: 'HHI', loc: [129.437918, 35.515152], selected: true },
  { text: '해양', id: 'OCN', loc: [129.406218, 35.480363], selected: false },
])



// 하단 버튼 리스트
// 사고유형 버튼 리스트
const accBtnList = ref([
  // { text: '전체', id: 'total', selected: true },
  { text: '안전사고', id: 'accident', selected: false },
  { text: '안전점검', id: 'inspect', selected: true },
  { text: '안전수칙', id: 'rules', selected: false },
])

// 조직유형 버튼 리스트
const orgBtnList = ref([
  { text: '전사', id: 'HHIZ012', selected: true },
  { text: '조선', id: 'HHIZ012A', selected: false },
  { text: '해양', id: 'HHIZ012B', selected: false },
  { text: '엔진기계', id: 'HHIZ012C', selected: false },
  { text: '특수선', id: 'HHIZ012D', selected: false },
])

const orgnDivList = ref([
  { text: '일', code: 'date' },
  { text: '년/월', code: 'yyyymm' },
])

const typeDivList = ref([
  { text: '누적(년)', code: 'acc' },
  { text: '월', code: 'mm' },
])


//상단 본공장/해양
function clickAreaBtn(btn) {
  //console.log('clickAreaBtn',btn.id)
  areaBtnList.value.forEach(el => (el.selected = el.id === btn.id ? true : false))
  transportMap.getView().setCenter(proj4('EPSG:4326', 'EPSG:5187', btn.loc))
}

//하단 조직 유형
function clickOrgBtn(btnId) {
  //console.log('clickOrgBtn',btnId)
  areaOrg.value = btnId
  orgBtnList.value.forEach(el => (el.selected = el.id === btnId ? true : false))
  setAreaLevel(areas.value, areaLv.value, areaColor.value)
}

const showInspectChart = ref(false)
const detailType = ref('inspect')
const detailCType = ref('')
const pannelShow = ref(false)

// 지도 마커 클릭
function clickMarker(type, btn) {
  //console.log('clickMarker', type, detailCType.value)
  
  if (detailType.value === type) pannelShow.value = false
  if (btn && btn === 'ptw') {
    // ptw 마커 클릭시 우측 차트 show
    showInspectChart.value = !showInspectChart.value
  } else {
    detailType.value = type
    pannelShow.value = true
  }
}

// PTW 라벨
const ptwData = ref({ accident: 3, progress: 5, complete: 6, total: 14 })
const ptwFold = ref([])

const clickShip = () => {
  //console.log('clickShip')
  router.push('/30_safety/SAF_H/SAFHA0010')
}

// 코드리스트 선언
const codeList = reactive({
  BSNS: [], //사업부
  PART: [], //부문
  DEPT: [], // 부서
})

const codeTempList = reactive({
  PART: [], //부문
  DEPT: [], // 부서
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" } }),
    commonSearchApi({ queryId: "MNGAA0060_SEARCH_01", param: { } }),
    commonSearchApi({ queryId: "OPRAG0010_SEARCH_DEPT", param: { CMPNY_DIV: userStore.cmpnyDiv } }),
  ]).then( res => {
    codeList.BSNS = res[0].ORESULT_CUR
    codeList.PART = res[1].ORESULT_CUR
    codeList.DEPT = res[2].ORESULT_CUR
    codeList.BSNS.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeTempList.PART.unshift({ ASGN_SHRT_NM: "전체", PART_CD: "" })
    codeTempList.DEPT.unshift({ DEPT_NM: "전체", DEPT_CD: "" })

    console.log('BSNS',res[0].ORESULT_CUR)
    console.log('PART',res[1].ORESULT_CUR)
    console.log('DEPT',res[2].ORESULT_CUR)

    changedBsns(comParams.value.BSNS_CD)
  })
}

// 사업부 선택시 부문리스트 자동으로 정리
const changedBsns = e => {
  console.log('changedBsns',e)
  codeTempList.PART = []
  codeTempList.DEPT = []
  comParams.value.PART_CD = ''
  comParams.value.DEPT_CD = ''
  if(e) { // e가 있으면 (선택한게 전체가 아님)
    codeList.PART.forEach(item => {
      if(item.BSNS_CD === e) {
        codeTempList.PART.push(item)
      }
    })
  }
  codeTempList.PART.unshift({ ASGN_SHRT_NM: "전체", PART_CD: "" })
  codeTempList.DEPT.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
}

const changedBumun = e => {
  console.log('changedBumun',e)
  codeTempList.DEPT = []
  comParams.value.DEPT_CD = ''
  if(e) { // e가 있으면 (선택한게 전체가 아님)
    codeList.DEPT.forEach(item => {
      if(item.PART_CD === e) {
        codeTempList.DEPT.push(item)
      }
    })
  }
  codeTempList.DEPT.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
}

const getGradeClass = (grade) => {
  if (grade === '안전'){
    return 'SLICOLOR1'
  } else if (grade === '주의'){
    return 'SLICOLOR2'
  } else if (grade === '경고'){
    return 'SLICOLOR3'
  } else if (grade === '위험'){
    return 'SLICOLOR4'
  }  

}



onMounted(() => {
  clearInterval(setTime.value)
  initCodeList()
  // console.log('totLayers',totLayers)
  shipInfo.value = document.getElementById('info')
  
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

    // overlays: [overlays], // 사용되는 tooltip
  })

  // transportMap.getAllLayers().forEach(layer => {
  //   if (layer.get('id') === 'area_layer') {
  //     transportMap.removeLayer(layer)
  //   }
  // })
  // transportMap.render()
  transportMap.renderSync()
  getInitArea() // 장소 정보 조쇠
  getShipFromQuay() // 안쪽 호선 정보 조회
  // mapView.value = transportMap
  
  // 마우스 이동시 현재 좌표를 보여준다.
  transportMap.on('pointermove', function (evt) {
    let hit = transportMap.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      return true
    })
    transportMap.getTargetElement().style.cursor = hit ? 'pointer' : ''
    
    //   // log(findLotBGLayer.getSource().getData(evt.pixel))
    //   let container
    //   container = document.getElementById('myposition')
    //   if (container === undefined || container === null) {
    //     return
    //   }

    //   let coordinate = evt.coordinate
    
    //   let text = ''
    //   coordinate = transform(coordinate, 'EPSG:3857', 'EPSG:4326')

    //   // console.log('coordinate',evt.coordinate, coordinate)
    //   coordinate.forEach(function (item) {
    //     text =
    //           text === ''
    //             ? item.toString().substr(0, 10)
    //             : text + ', ' + item.toString().substr(0, 9)
    //   })

    //   container.innerHTML = text + ' EPSG: 4326'

  //   container = document.getElementById('myposition_point')
  //   if (container !== undefined || container !== null) {
  //     container.innerHTML = text
  //   }
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

  // transportMap.on('click', function (evt) {
  //   console.log('click',evt)

  //   // positionFeature.setGeometry(new Point(evt.coordinate))
  // })
        
  transportMap.on('singleclick', function(evt) {
   console.log('singleclick',evt.originalEvent.target)

    displayFeatureInfo(evt.pixel, evt.originalEvent.target)
  })
     
  transportMap.on('movestart', function (evt) {
    // console.log('movestart')
    shipInfo.value.style.visibility = 'hidden'
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
  //console.log('getOverlays', transportMap.getOverlays())
  transportMap.getOverlays().on('change', evt => {
    //console.log('change', evt)
  })

  if(autoUpdate.value === 'Y'){
    setTime.value = setInterval(() => {
      console.log('setInterval')
      btnClick()
    }, 300000)
  } else {
    clearInterval(setTime.value)
  }
  
})

onDeactivated(() => {
  console.log('onDeactivated 11')
  clearInterval(setTime.value)
  // areaLayers.getSource().clear()
})

onActivated(() => {
  console.log('onActivated 11')
  clearInterval(setTime.value)
  if(autoUpdate.value === 'Y'){
    setTime.value = setInterval(() => {
      console.log('setInterval')
      btnClick()
    }, 300000)
  }
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-0">
      <div class="d-flex flex-column fill-height">
        <v-sheet
          id="dashboard"
          :class="{ expansion: screenExpansion }"
        >
          <!-- 지도 영역 -->
          <!-- <v-img :src="getMapImg('GISMAP.png')" width="100%" height="100%" cover class="dashMap" /> -->
          <div
            id="mapOL" 
            style="width: calc(100%); height: 100%;"
            cover
            class="dashMap"
          />

          <div id="info">
            <v-card
              class="dashCard tableBox"
              color="dashCard"
              variant="flat"
              min-width="520"
            >
              <div class="d-flex justify-space-between">
                <p class="cardTitle pl-1">
                  호선 정보
                </p>
                <div
                  class="d-flex align-center foldBtn"
                  @click="clickShip"
                >
                  POB 현황보기
                  <svg-icon
                    name="arrowR"
                    class="pl-2"
                  />
                </div>
              </div>
              <table class="customTable">
                <tr>
                  <th colspan="2">
                    호선
                  </th>
                  <th colspan="3">
                    선주
                  </th>
                  <th colspan="3">
                    선형-선종
                  </th>
                </tr>
                <tr>
                  <td colspan="2">
                    {{ shipData.SHPNO }}
                  </td>
                  <td colspan="3">
                    {{ shipData.OWNERA1 }}
                  </td>
                  <td colspan="3">
                    {{ shipData.SHPTYP_NAM }}
                  </td>
                </tr>
                <tr>
                  <th colspan="2">
                    W/C
                  </th>
                  <th colspan="2">
                    K/L
                  </th>
                  <th colspan="2">
                    L/C
                  </th>
                  <th colspan="2">
                    C/L
                  </th>
                </tr>
                <tr>
                  <td colspan="2">
                    {{ dayjs(shipData.WCDATE).format('YY.MM.DD') }}
                  </td>
                  <td colspan="2">
                    {{ dayjs(shipData.KLDATE).format('YY.MM.DD') }}
                  </td>
                  <td colspan="2">
                    {{ dayjs(shipData.LCDATE).format('YY.MM.DD') }}
                  </td>
                  <td colspan="2">
                    {{ dayjs(shipData.DLDATE).format('YY.MM.DD') }}
                  </td>
                </tr>
              </table>
            </v-card>
          </div>
          <div id="popup" />
          
          <!-- 좌측 카드 -->
          <v-sheet
            class="pLeft"
            color="transparent"
          >
            <!-- 안전점검 현황 -->
            <v-card
              color="dashCard"
              class="py-5 pl-6 pr-3 dashCard checkCard"
              :class="{ checked: inspectCard }"
              variant="flat"
              @click="clickCard('inspect')"
            >
              <section class="dataView mb-4">
                  <div class="cardTitle">
                    <v-sheet
                      width="20"
                      color="transparent"
                    >
                      <svg-icon
                        :key="inspectCard ? 'checked' : 'unChecked'"
                        :name="inspectCard ? 'checked' : 'unChecked'"
                      />
                    </v-sheet>
                    안전점검 현황 <span style="font-size:8pt">*고위험점검/부서관리작업 점검은<br/> 점검완료 기준</span>
                  </div>
                </section>
                <v-sheet
                  color="rgba(255, 255, 255, 0.15)"
                  class="py-2 px-4 dataView mt-4 rounded"
                >
                  <span class="dashLabel">전체</span>
                  <div class="dashLabel d-flex align-center">
                    <!-- 2344 건 / 2626 건 -->
                    <span class="dataNum pr-2">{{ logData2.length }}</span>
                    <span class="dataNum2">/ {{ areaDataTo2.length }}</span>건
                  </div>
                </v-sheet>

                <v-btn
                  :disabled="!inspectCard"
                  density="comfortable"
                  flat
                  color="dashCard"
                  class="dataBtn mt-1 mb-2"
                  :class="{ selected: mapMakersVisable.ptw }"
                  @click.stop="clickDetail('ptw')"
                >
                  <span class="dashLabel">고위험점검</span>
                  <div class="dashLabel d-flex align-center">
                    <span class="dataNum pr-2">{{ areaDataTDe2_1 }}/</span> {{ areaDataDe2_1.length }}건
                    <v-sheet
                      width="20"
                      color="transparent"
                    >
                      <!-- v-if="inspectCard"  -->
                      <svg-icon
                        key="arrowRight2"
                        name="arrowRight2"
                        class="dataNum pl-1"
                      />
                      <!--
                        :name="mapMakersVisable.inspect.ptw ? 'close' : 'arrowRight2'"
                        :key="mapMakersVisable.inspect.ptw ? 'close' : 'arrowRight2'" 
                      -->
                    </v-sheet>
                  </div>
                </v-btn>

                <v-btn
                  :disabled="!inspectCard"
                  density="comfortable"
                  flat
                  color="dashCard"
                  class="dataBtn mb-2"
                  :class="{ selected: mapMakersVisable.plan }"
                  @click.stop="clickDetail('plan')"
                >
                  <span class="dashLabel">부서관리작업 점검</span>
                  <div class="dashLabel d-flex align-center">
                    <span class="dataNum pr-2">{{ areaDataTDe2_2 }}/</span> {{ areaDataDe2_2.length }}건
                    <v-sheet
                      width="20"
                      color="transparent"
                    >
                      <!-- v-if="inspectCard" -->
                      <svg-icon
                        key="arrowRight2"
                        name="arrowRight2"
                        class="dataNum pl-1"
                      />
                    </v-sheet>
                  </div>
                </v-btn>
                <v-btn
                  :disabled="!inspectCard"
                  density="comfortable"
                  flat
                  color="dashCard"
                  class="dataBtn mb-2"
                  :class="{ selected: mapMakersVisable.daily }"
                  @click.stop="clickDetail('daily')"
                >
                  <span class="dashLabel">일상점검</span>
                  <div class="dashLabel d-flex align-center">
                    <span class="dataNum pr-2">{{ areaDataDe2_3.length }}</span>건
                    <v-sheet
                      width="20"
                      color="transparent"
                    >
                      <!-- v-if="inspectCard" -->
                      <svg-icon
                        key="arrowRight2"
                        name="arrowRight2"
                        class="dataNum pl-1"
                      />
                      <!--
                        :name="mapMakersVisable.inspect.daily ? 'close' : 'arrowRight2'"
                        :key="mapMakersVisable.inspect.daily ? 'close' : 'arrowRight2'" 
                      -->
                    </v-sheet>
                  </div>
                </v-btn>
            </v-card>
            <!--안전사고 발생 현황-->
            <v-card
              color="dashCard"
              class="pa-5 dashCard mainCard checkCard"
              :class="{ checked: accidentCard }"
              variant="flat"
              @click="clickCard('accident')"
            >
              <!-- @click="accidentCard = !accidentCard" -->
              <section class="dataView mb-4">
                <div class="cardTitle">
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <svg-icon
                      :key="accidentCard ? 'checked' : 'unChecked'"
                      :name="accidentCard ? 'checked' : 'unChecked'"
                    />
                  </v-sheet>
                  안전사고 발생 현황
                </div>
              </section>
              <v-sheet
                  color="rgba(255, 255, 255, 0.15)"
                  class="py-2 px-4 mt-4 rounded"
                >
                <div class="dataView mb-2">
                  <span class="dashLabel">전체</span>
                  <div class="dataNum d-flex align-center">
                    {{ areaDataTo1.length }} 건
                  </div>
                </div>
              <!-- </v-sheet>
              <v-sheet
                color="rgba(255, 255, 255, 0.15)"
                class="py-4 px-4 dataView mt-4 rounded"
              > -->
                <div class="dataView py-2">
                  <span class="dashLabel">중대재해</span>
                  <div class="dashLabel d-flex align-center">
                    {{ jungdae.length }} 건
                  </div>
                  <span class="dashLabel">중대성사고</span>
                  <div class="dashLabel d-flex align-center">
                    {{ serious.length }} 건
                  </div>
                </div>
              </v-sheet>
              <v-btn
                :disabled="!accidentCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mt-1 mb-2"
                :class="{ selected: mapMakersVisable.idt }"
                @click.stop="clickDetail('idt')"
              >
                <span class="dashLabel">산재사고</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe1_1.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>
              <v-btn
                :disabled="!accidentCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mb-2"
                :class="{ selected: mapMakersVisable.clo }"
                @click.stop="clickDetail('clo')"
              >
                <span class="dashLabel">휴업사고</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe1_2.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>
              <v-btn
                :disabled="!accidentCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mb-1"
                :class="{ selected: mapMakersVisable.gen }"
                @click.stop="clickDetail('gen')"
              >
                <span class="dashLabel">일반사고</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe1_3.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>
            </v-card>

            <!-- 안전수칙 위반 현황 -->
            <v-card
              color="dashCard"
              class="checkCard"
              :class="{ checked: rulesCard }"
              variant="flat"
              @click="clickCard('rules')"
            >
              <section class="dataView mb-4">
                <div class="cardTitle">
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <svg-icon
                      :key="rulesCard ? 'checked' : 'unChecked'"
                      width="20"
                      :name="rulesCard ? 'checked' : 'unChecked'"
                    />
                  </v-sheet>
                  안전수칙 위반 현황<span style="font-size: 12px;">* 승인완료기준</span>
                </div>
              </section>
              <v-sheet
                  color="rgba(255, 255, 255, 0.15)"
                  class="py-2 px-4 dataView mt-4 rounded"
                >
                  <span class="dashLabel">전체</span>
                  <div class="dataNum pr-2 d-flex align-center">
                    {{ areaDataTo3.length }} 건
                  </div>
              </v-sheet>
              <v-btn
                :disabled="!rulesCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mt-1 mb-2"
                :class="{ selected: mapMakersVisable.safecare }"
                @click.stop="clickDetail('safecare')"
              >
                <span class="dashLabel">The Safe Care 핵심안전수칙</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe3_5.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <!-- v-if="rulesCard"  -->
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>
              <v-btn
                :disabled="!rulesCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mt-1 mb-2"
                :class="{ selected: mapMakersVisable.absolute }"
                @click.stop="clickDetail('absolute')"
              >
                <span class="dashLabel">절대수칙</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe3_1.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <!-- v-if="rulesCard"  -->
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>
              <v-btn
                :disabled="!rulesCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mb-2"
                :class="{ selected: mapMakersVisable.important }"
                @click.stop="clickDetail('important')"
              >
                <span class="dashLabel">중대성수칙</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe3_2.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <!-- v-if="rulesCard" -->
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>
              <v-btn
                :disabled="!rulesCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mb-2"
                :class="{ selected: mapMakersVisable.crane }"
                @click.stop="clickDetail('crane')"
              >
                <span class="dashLabel">크레인 특별안전수칙</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe3_4.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <!-- v-if="rulesCard" -->
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>
              <v-btn
                :disabled="!rulesCard"
                density="comfortable"
                flat
                color="dashCard"
                class="dataBtn mb-2"
                :class="{ selected: mapMakersVisable.general }"
                @click.stop="clickDetail('general')"
              >
                <span class="dashLabel">일반수칙</span>
                <div class="dashLabel d-flex align-center">
                  <span class="dataNum pr-2">{{ areaDataDe3_3.length }}</span>건
                  <v-sheet
                    width="20"
                    color="transparent"
                  >
                    <!-- v-if="rulesCard" -->
                    <svg-icon
                      key="arrowRight2"
                      name="arrowRight2"
                      class="dataNum pl-1"
                    />
                  </v-sheet>
                </div>
              </v-btn>

            </v-card>
          </v-sheet>

          <!-- 상단 카드 -->
          <v-sheet
            color="dashCard"
            class="topCard pRight"
            variant="flat"
          >
            <section
              class="d-flex align-center w-full pl-1 px-2"
              style="gap: 10px; white-space: nowrap"
            >
              <p class="cardTitle">
                안전지수(SLI)
              </p>

              <div
                v-for="item in sliData"
                :key="item"
                class="d-flex align-center mr-4 ml-7"
                
              >
                <span>
                  {{ item.BSNS_NM }}
                </span> 
                <span class="dataNum pl-3 pr-2">
                  {{ item.TOT_SVG }}
                </span>
                <span
                  class = "slichip rounded"
                  :class="getGradeClass(item.TOTAL_GRADE)"
                >
                  {{ item.TOTAL_GRADE }}
                </span>

              </div>


            </section>
            <v-divider vertical />
            <section class="d-flex align-center w-full px-2" v-if="false">
              <p class="cardTitle">
                <!-- 부문별 안전 KPI 현황 -->
                부문 중점추진사항
              </p>
              <div class="d-flex align-center pl-2">
                <!--
                  <v-chip color="primary" variant="flat" :text="'내업1'" />
                  <span class="dataNum pl-2 pr-1">안전예습</span>이/가 전월 대비
                  <span class="dataNum pl-1">5% 상승</span> 
                -->
                <floating-side-banner
                  :list="kpiList"
                  content-width="auto"
                  :content-height="30"
                  :gap="20"
                />
              </div>
            </section>
          </v-sheet>

          <v-sheet
            color="transparent"
            class="pRight rightArea"
          >
            <!-- 부서관리작업 진행 현황 -->
            <v-card
              v-if="showInspectChart"
              color="dashCard"
              class="progressCard"
              variant="flat"
            >
              <p class="cardTitle pb-3">
                {{ detailCType === 'ptw' ? '고위험점검 진행 현황' : '부서관리작업 점검 진행 현황' }}
              </p>
              <v-sheet
                color="transparent"
                class="chartContents"
              >
                <section>
                  <svg-icon name="cs01" />
                  <!--
                    <div class="svg-icon">
                    <img :src="getMapImg('accident')" style="background: #30b063; width: 40px; height: 40px; border-radius: 50%;"/>
                    </div> 
                  -->
                  <span class="dashLabel">점검 미완료</span>
                  <div>
                    <span class="dataNum pr-1">{{ checkCnt.nTotal }}</span>건
                  </div>
                </section>
                <section>
                  <svg-icon name="cs02" />
                  <span class="dashLabel">점검 진행중</span>
                  <div>
                    <span class="dataNum pr-1">{{ checkCnt.pTotal }}</span>건
                  </div>
                </section>
                <section>
                  <svg-icon name="cs03" />
                  <span class="dashLabel">점검완료</span>
                  <div>
                    <span class="dataNum pr-1">{{ checkCnt.cTotal }}</span>건
                  </div>
                </section>
              </v-sheet>
            </v-card>
            <!-- 주제별 부서관리작업 점검 현황 -->
            <!-- <v-card
              v-if="showInspectChart && (comParams.YARD_APP_YN === 'N' ? false : true)"
              color="dashCard"
              class="byTopicCard"
              variant="flat"
            > -->
            <!-- 테스트 -->
            <v-card
              v-if="showInspectChart && (comParams.YARD_APP_YN === 'N' ? false : true)"
              color="dashCard"
              class="byTopicCard"
              variant="flat"
            >
              <p class="cardTitle pb-3">
                {{ detailCType === 'ptw' ? '주체별 PTW 점검 현황' : '주체별 부서관리작업 점검 현황' }}
              </p>
               <v-sheet
                color="transparent"
                height="calc(100% - 27px)"
                class="chartContents"
              >
                <section class="chart-row mb-2">
                  <div style="width: 30%;"><span class="dashLabel" style="display: block; text-align: left;">관리감독자</span></div>
                  <div style="width: 45%;">
                    <v-progress-linear
                      :model-value="progressLine1"
                      color="blue"
                      height="4"
                      style="width: 80%; border: 0px solid black;"
                    ></v-progress-linear>
                  </div>
                  <div style="width: 25%;">{{ checkCnt.grp0Cnt }}</div>
                </section>
                <section class="chart-row">
                  <div style="width: 30%;">
                    <span class="dashLabel" style="display: block; text-align: left;">세잎클로버</span>
                  </div>
                  <div style="width: 45%;">
                    <v-progress-linear
                      :model-value="progressLine2"
                      color="#08B9C8"
                      height="4"
                      style="width: 80%; border: 0px solid black;"
                    ></v-progress-linear>
                  </div>
                  <div style="width: 25%;">{{ checkCnt.grp1Cnt }}</div>
                </section>
                <span class="dashLabel" style="white-space: nowrap; display: block;">(협력사 안전관리자)</span>
                <section class="chart-row mt-2">
                  <div style="width: 30%;"><span class="dashLabel" style="display: block; text-align: left;">안전요원</span></div>
                  <div style="width: 45%;">
                    <v-progress-linear
                      :model-value="progressLine3"
                      color="#16C3F4"
                      height="4"
                      style="width: 80%; border: 0px solid black;"
                    ></v-progress-linear>
                  </div>
                  <div style="width: 25%;">{{ checkCnt.grp2Cnt }}</div>
                </section>
                <section class="chart-row mt-2">
                  <div style="width: 30%;"><span class="dashLabel" style="display: block; text-align: left;">기타</span></div>
                  <div style="width: 45%;">
                    <v-progress-linear
                      id="progressBackGround"
                      :model-value="checkCnt.grp3Cnt"
                      color="#41F395"
                      height="4"
                      style="width: 80%;"
                    ></v-progress-linear>
                  </div>
                  <div style="width: 25%;">{{ checkCnt.grp3Cnt }}</div>
                </section>
               </v-sheet>

            </v-card>
            <!-- 테스트 끛-->
            <!-- 업데이트 로그 -->
            <!-- <v-card
              color="dashCard"
              class="logCard"
              variant="flat"
            >
              <p class="cardTitle pl-2 pb-3">
                업데이트 로그
              </p>
              <section class="logContents">
                <v-sheet
                  v-for="log in logData"
                  :key="log"
                  color="dashLogBox"
                  rounded
                  class="py-3 px-4 mb-3 mr-3"
                >
                  <div class="textSubTitle d-flex justify-space-between">
                    {{ log.TYPE }}
                    <span class="textDate">{{ dayjs(log.DATE).format('YYYY.MM.DD') }}</span>
                  </div>
                  <div v-if="log.TYPE2" class="textContent mt-1" style="color: #FF0000;">
                    {{ log.TYPE2 }}
                  </div>
                  <div class="textContent mt-2">
                    {{ log.DEPT }}
                  </div>
                  <div class="textDate mt-2">
                    {{ log.LOC }}
                  </div>
                </v-sheet>
              </section>
            </v-card> -->
          </v-sheet>

          <!-- 하단 필터 -->
          <v-card
            color="rgba(17, 32, 66, 0.85)"
            class="bottomCard pLeft2 text-white"
            variant="flat"
          >
            <div class="d-flex align-center px-8 h-full w-full flex-auto">
              <!--
                <section class="d-flex flex-column justify-space-evenly h-full">
                <p>사고유형</p>
                <div>
                <v-btn
                v-for="btn in accBtnList"
                :key="btn"
                :text="btn.text"
                :color="btn.selected ? 'primary' : 'dashBtnDisabled'"
                class="mr-2 toggleBtn"
                variant="flat"
                @click="clickCard(btn.id)" />
                <v-divider vertical style="height: 36px" class="ml-2 mr-4 d-block float-right" />
                </div>
                </section> 
              -->
              <section class="d-flex flex-column justify-space-evenly h-full">
                <!-- <p>조직유형</p> -->
                <p>조직</p>
                <div class="d-flex align-center">
                  <!-- <v-btn
                    v-for="btn in orgBtnList"
                    :key="btn"
                    :text="btn.text"
                    :color="btn.selected ? 'primary' : 'dashBtnDisabled'"
                    class="mr-2 toggleBtn"
                    variant="flat"
                    @click="clickOrgBtn(btn.id)"
                  /> -->
                  <i-select 
                    width="180px"
                    class="mt-1"
                    v-model="comParams.BSNS_CD"
                    :items="codeList.BSNS"
                    item-value="BSNS_CD"
                    item-title="BSNS_NM"
                    @update:modelValue="changedBsns"
                  />
                  <i-select 
                    width="160px"
                    class="mt-1"
                    v-model="comParams.PART_CD"
                    :items="codeTempList.PART"
                    item-value="PART_CD"
                    item-title="ASGN_SHRT_NM"
                    @update:modelValue="changedBumun"
                  />
                  <!-- <v-select
                    style="width:160px !important;"
                    class="mt-1"
                    v-model="comParams.DEPT_CD"
                    :items="codeTempList.DEPT"
                    item-value="DEPT_CD"
                    item-title="DEPT_NM"
                    multiple
                  >
                    <template v-slot:selection="{ item, index }">
                      <span v-if="index < 1" >{{ item.title }}</span>
                      <span v-if="index === 1" class="text-grey text-caption align-self-center">
                        (+{{ comParams.DEPT_CD.length - 1 }})
                      </span>
                    </template>
                  </v-select> -->
                  <i-select 
                    width="160px"
                    class="mt-1"
                    v-model="comParams.DEPT_CD"
                    :items="codeTempList.DEPT"
                    item-value="DEPT_CD"
                    item-title="DEPT_NM"
                  />
                  <v-divider
                    vertical
                    style="height: 36px"
                    class="mr-4 d-block float-right"
                  />
                </div>
              </section>
              <section
                class="d-flex flex-column justify-space-evenly h-full"
                style="flex-grow: 1"
              > 
                <div>
                <v-row>
                  <v-col>
                    <p v-if="accidentCard">
                      <VRadioGroup
                        v-model="orgnAccDiv"
                        class="mt-auto mb-1"
                        inline
                      >
                        <!-- @update:modelValue="changeOrgnDiv" -->
                        <VRadio
                          v-for="(item, i) in orgnDivList"
                          :key="i"
                          :value="item.code"
                          :label="item.text"
                          class="mr-2"
                        />
                      </VRadioGroup>
                    </p>
                    <p v-else-if="rulesCard">
                      <VRadioGroup
                        v-model="orgnRulDiv"
                        class="mt-auto mb-1"
                        inline
                      >
                        <VRadio
                          v-for="(item, i) in orgnDivList"
                          :key="i"
                          :value="item.code"
                          :label="item.text"
                          class="mr-2"
                        />
                      </VRadioGroup>
                    </p>
                    <p v-else>
                      <!-- 조회일자 -->
                      <VRadioGroup v-model="orgnInsDiv">
                        <VRadio
                          value="date"
                          label="일"
                          class="mr-2"
                        />
                      </VRadioGroup>
                    </p>
                  </v-col>
                  <v-col class="d-flex justify-end">
                    <!-- <v-checkbox
                      v-model="autoUpdate"
                      label="5분 주기 자동 업데이트 설정"
                      true-value="Y"
                      false-value="N"
                      class="d-inline-flex"
                    />  -->
                  </v-col>
                </v-row>             
              </div>
                <div class="d-flex algin-center">
                  <template v-if="accidentCard">
                    <template v-if="orgnAccDiv === 'date'">
                      <i-input
                        v-model="formAccDate"
                        type="Date"
                        width="155px"
                        min-width="140px"
                        :max="maxDate"
                      />
                    </template>
                    <template v-else>
                      <i-select
                        v-model="dateAccYear"
                        width="100px"
                        min-width="100px"
                        type="YEAR"
                      />
                      <i-select
                        v-model="dateAccMonth"
                        width="80px"
                        min-width="80px"
                        type="MM"
                      />
                      <div style="width: 140px;">
                        <VRadioGroup
                          v-model="typeAccDiv"
                          class="mt-1"
                          inline
                        >
                          <!-- @update:modelValue="changeTypeDiv" -->
                          <VRadio
                            v-for="(item, i) in typeDivList"
                            :key="i"
                            :value="item.code"
                            :label="item.text"
                            class="mr-2"
                          />
                        </VRadioGroup>
                      </div>
                    </template>
                  </template>
                  <template v-else-if="rulesCard">
                    <template v-if="orgnRulDiv === 'date'">
                      <i-input
                        v-model="formRulDate"
                        type="Date"
                        width="155px"
                        min-width="140px"
                        :max="maxDate"
                      />
                    </template>
                    <template v-else>
                      <i-select
                        v-model="dateRulYear"
                        width="100px"
                        min-width="100px"
                        type="YEAR"
                      />
                      <i-select
                        v-model="dateRulMonth"
                        width="80px"
                        min-width="80px"
                        type="MM"
                      />
                      <div style="width: 140px;">
                        <VRadioGroup
                          v-model="typeRulDiv"
                          class="mt-1"
                          inline
                        >
                          <VRadio
                            v-for="(item, i) in typeDivList"
                            :key="i"
                            :value="item.code"
                            :label="item.text"
                            class="mr-2"
                          />
                        </VRadioGroup>
                      </div>
                    </template>
                  </template>
                  <template v-else>
                    <i-input
                      v-model="formInsDate"
                      type="Date"
                      width="135px"
                      min-width="120px"
                      :max="maxDate"
                    />

                    <v-checkbox
                      v-model="checkIns"
                      label="협력사 포함"
                      true-value="Y"
                      false-value="N"
                      style="margin-left: 10px;"
                    />

                    <v-checkbox
                      v-model="checkYard"
                      label="3중 점검(국한)"
                      true-value="Y"
                      false-value="N"
                      style="margin-left: 10px;"
                      />
                    <v-checkbox
                      v-model="autoUpdate" 
                      width="50px"
                      true-value="Y" 
                      false-value="N"    
                      style="width: 150px; margin-left: 20px;">
                      <template v-slot:label>
                        자동 업데이트<br>(5분 간격)
                      </template>
                    </v-checkbox>
                  </template>
                  <IButtonList
                    :button-list="['btnRskCopyApp']"
                    @click-button="btnClick"
                  />
                </div>
              </section>
            </div>
          </v-card>
          <!-- 지도라벨 -->
          <v-sheet
            color="dashCard"
            class="labelCard"
            variant="flat"
          >
            <p class="cardTitle">
              기타장소
            </p>
            <div class="textLabel d-flex align-end">
              <span>군산</span>
              <span class="textNumBold">{{ areaEtc1.length }}</span>
              <v-divider vertical />
              <!--
                <span>인도호선</span>
                <span class="textNumBold">{{ areaEtc3.length }}</span>
                <v-divider vertical /> 
              -->
              <span>도로/건물/기타</span>
              <span class="textNumBold">{{ areaEtc2.length }}</span>
            </div>
          </v-sheet>
          <!-- 확대 축소 -->
          <v-card
            color="dashCard"
            variant="flat"
            class="toolCard"
          >
            <div class="d-flex align-center justify-space-between w-full">
              <v-btn
                v-for="btn in areaBtnList"
                :key="btn"
                :text="btn.text"
                :color="btn.selected ? 'primary' : 'dashBtnDisabled'"
                class="mx-2 toggleBtn"
                variant="flat"
                @click="clickAreaBtn(btn)"
              />
              <v-divider
                vertical
                style="height: 32px"
                class="mt-2 ml-2 mr-4 d-block float-right"
              />
              <section class="d-flex align-center px-3 w-full">
                <v-btn
                  variant="text"
                  icon
                  density="comfortable"
                  @click="zoomOut"
                >
                  <svg-icon name="minus" />
                </v-btn>
                <v-slider
                  v-model="setZoom"
                  min="14"
                  max="20"
                  color="white"
                  track-size="4"
                  tick-size="2"
                  thumb-size="12"
                  readonly
                />
                <v-btn
                  variant="text"
                  icon
                  density="comfortable"
                  @click="zoomIn"
                >
                  <svg-icon name="plus" />
                </v-btn>
              </section>
              <v-btn
                color="dashLogBox"
                height="100%"
                class="expansionBtn"
                @click="screenExpansion = !screenExpansion"
              >
                <svg-icon
                  :key="screenExpansion ? 'originscreen' : 'fullscreen'"
                  :name="screenExpansion ? 'originscreen' : 'fullscreen'"
                />
              </v-btn>
            </div>
          </v-card>

          <!-- 상세 패널 -->
          <detailPanel
            :list="comDetailList"
            :type="detailType"
            :dtype="detailCType"
            :visible="pannelShow"
            @click-close="pannelShow = false"
          />

        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
#info {
  position: absolute;
  display: inline-block;
  height: auto;
  width: auto;
  z-index: 100;
  background-color: #1e2e55;
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
          background: #111  E3C;
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
}

#dashboard {
  height: calc(100vh - 122px);
  // position: relative;
  font-size: 16px;
  font-size: clamp(14px, 0.8vw, 32px);
  overflow: hidden;
  // overflow-y: auto;
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
    gap: 37px;
    height: calc(100% - 64px);
    width: 20%;
    transition: all 0.4s ease-in-out 0.2s;
  }

  .pLeft2 {
    position: absolute;
    left: calc(22.7%);
    transition: all 0.4s ease-in-out 0.2s;
  }

  .pRight {
    position: absolute;
    right: 40px;
    transition: all 0.4s ease-in-out 0.2s;
  }

  .dashCard,
  .checkCard,
  .topCard,
  .progressChartCard,
  .progressCard,
  .byTopicCard,
  .logCard,
  .bottomCard,
  .toolCard,
  .labelCard {
    border-radius: 12px;
  }
  .checkCard {
    padding: 20px;
    padding-left: 24px;
    padding-right: 12px;
    border: 2px solid transparent;
    &.checked {
      border: 2px solid rgb(var(--v-theme-primary));
    }
  }
  .topCard {
    padding: 12px;
    top: 32px;
    width: calc(100% - 20% - 104px); // 전체 - 좌측카드넓이 - 여백
    height: 5.3vh;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .bottomCard {
    bottom: 32px;
    width: calc(100% - 20% - 200px); // 전체 - 좌측카드넓이 - 여백
    // width: calc(50%);
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
    top: calc(5.2vh + 56px);
    left: calc(36%);
    width: 405px; // 전체 - 좌측카드넓이 - 여백
    height: 48px;
    display: flex;
    justify-content: space-between;
    transition: all 0.4s ease-in-out;
  }
  .labelCard {
    top: calc(5.2vh + 56px);
    left: calc(20% + 64px);
    width: auto;
    position: absolute;
    padding: 16px 20px;
    transition: all 0.4s ease-in-out 0.2s;
    .cardTitle {
      font-size: 16px;
      font-size: clamp(14px, 0.8vw, 20px);
      font-weight: 600;
      line-height: normal;
      padding-bottom: 12px;
    }
    .textLabel {
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 18px);
      font-weight: 400;
      line-height: normal;
      display: flex;
      gap: 8px;
    }
    .textNumBold {
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 18px);
      font-weight: 700;
      line-height: normal;
    }
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
    .pRight {
      transform: translateX(120%);
      transition: all 0.4s ease-in-out;
    }
    .toolCard {
      top: 32px;
      left: calc(100% - 450px);
      transition: all 0.4s ease-in-out 0.2s;
    }
    .labelCard {
      top: 32px;
      left: calc(2%);
      // transform: translateX(-400%);
      transition: all 0.4s ease-in-out 0.2s;
    }
  }
  .rightArea {
    width: 16%;
    // height: calc(100% - 15.2vh - 32px * 2 - 24px * 2); // 전체  - 상단카드 - 하단카드 - 여백
    height: calc(100% - 13.4vh); // 전체  - 상단카드 - 하단카드 - 여백
    top: calc(5.2vh + 56px);
    display: flex;
    flex-direction: column;
    gap: 24px;
    .progressChartCard {
      padding: 20px 24px;
      > .v-sheet {
        position: relative;
      }
      .chartValue {
        font-size: 34px;
        font-size: clamp(30px, 1.8vw, 60px);
        font-weight: 500;
        line-height: normal;
        position: absolute;
        top: 58%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
    .progressCard,
    .byTopicCard {
      flex: 0 0 auto;
      padding: 20px 24px;
      text-align: center;
      // height: 100%;
      .chartContents {
        height: auto;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        > section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        /* .chart-row 클래스가 적용된 section에만 가로 정렬 스타일 적용 */
        > section.chart-row {
          grid-column: span 3; /* 모든 열을 차지하게 설정 */
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
      } 
    }
    .progressCard {
      .textLabel {
        font-size: 14px;
        font-size: clamp(14px, 0.7vw, 18px);
        font-weight: 600;
        line-height: normal;
      }
      .textNum {
        font-size: 13px;
        font-size: clamp(14px, 0.7vw, 20px);
        font-weight: 400;
        line-height: normal;
      }
      .textNumBold {
        font-size: 13px;
        font-size: clamp(14px, 0.7vw, 20px);
        font-weight: 700;
        line-height: normal;
      }
      .chartContents > section:not(:last-child) {
        position: relative;
        .svg-icon::before {
          position: absolute;
          content: '';
          top: 20px;
          left: 100%;
          transform: translateX(-50%);
          border: 1px dashed #566280;
          width: 30%;
          max-width: 100px;
        }
      }
    }
    .byTopicCard {
      .textLabel {
        font-size: 14px;
        font-size: clamp(14px, 0.7vw, 18px);
        font-weight: 400;
        line-height: normal;
      }
      .textNumBold {
        font-size: 20px;
        font-weight: 700;
        line-height: normal;
      }
      .textNum {
        color: #8e96aa;
        font-size: 14px;
        font-size: clamp(14px, 0.7vw, 18px);
        font-weight: 500;
        line-height: normal;
      }
      .chartArea {
        position: relative;
        // width: 100%;
        // height: 100%;
        width: 64px;
        height: 64px;
        .echarts {
          // width: 64px;
          // height: 64px;
          // margin-top: -8px;
        }
        .chartData {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
          font-weight: 700;
          line-height: normal;
          .chartNum {
            font-size: 18px;
            // font-size: clamp(16px, 0.95vw, 24px);
            font-weight: 700;
            line-height: normal;
          }
        }
      }
    }
    .logCard {
      width: 100%;
      height: 100%;
      padding: 20px 4px 0 16px;
      .logContents {
        margin-top: 12px;
        height: calc(100% - 51px); // 전체 - 제목 - margin
        overflow-y: auto;
      }
    }
  }

  // 요소
  .dataView {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .SLICOLOR1{
    color:#046CD4;
    background-color:#C6D2DF ;
  }


  .SLICOLOR2{
    color:#0BB69C;
    background-color:#E1F6F3 ;
  }

  .SLICOLOR3{
    color:#FF983B;
    background-color:#FFEEE7 ;
  }

  .SLICOLOR4{
    color:#FF0000;
    background-color:#FFEAEA ;
  }


  .slichip{
    width: 40px;
    height: 30px;

    margin: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  // 버튼
  .dataBtn {
    // height: 100%;
    padding: 0 4px 0 12px !important;
    width: 100%;
    margin: 2px 0;
    display: block;
    // border-radius: 0 4px 4px 0;
    &.v-btn--disabled {
      background: transparent !important;
      .v-btn__overlay {
        opacity: 0;
      }
    }
    .v-btn__content {
      width: 100%;
      justify-content: space-between;
    }
    &.v-btn--size-default {
      --v-btn-height: 35px;
    }
    &.selected {
      position: relative;
      // border-left: 2px solid #fff;
      &::before {
        position: absolute;
        content: '';
        width: 2px;
        height: 60%;
        background: #fff;
        border-radius: 2px;
        left: -1px;
        top: 50%;
        transform: translateY(-50%);
      }
    }
  }
  .expansionBtn {
    padding: 8px !important;
  }

  // FONT 폰트
  .cardTitle {
    font-size: 18px;
    font-size: clamp(16px, 0.95vw, 24px);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dashLabel {
    font-size: 16px;
    font-size: clamp(14px, 0.8vw, 20px);
    color: rgba(var(--v-theme-dashText), 0.75);
    line-height: normal;
  }
  .totalNum {
    font-size: 40px;
    font-size: clamp(36px, 1.7vw, 44px);
    font-weight: 800;
    line-height: normal;
    color: rgba(var(--v-theme-dashText), 1);
  }
  .dataNum {
    font-size: 18px;
    font-size: clamp(16px, 1vw, 24px);
    font-weight: 700;
    line-height: normal;
    color: rgba(var(--v-theme-dashText), 1);
  }
  .mainCard {
    .totalNum {
      font-size: 48px;
      font-size: clamp(40px, 2vw, 52px);
      font-weight: 700;
      line-height: normal;
      color: rgba(var(--v-theme-dashText), 1);
    }
    .dataNum {
      font-size: 18px;
      font-size: clamp(16px, 1vw, 24px);
      font-weight: 700;
      line-height: normal;
      color: rgba(var(--v-theme-dashText), 1);
      // font-size: 32px;
      // font-size: clamp(28px, 1.5vw, 40px);
      // font-weight: 700;
      // line-height: normal;
      // opacity: 1;
      // color: rgba(var(--v-theme-dashText), 1);
    }
    .dataNum2 {
      font-size: 18px;
      font-size: clamp(16px, 1vw, 24px);
      font-weight: 700;
      line-height: normal;
    }
  }
  .toggleBtn {
    font-size: 14px;
    font-size: clamp(14px, 0.7vw, 18px);
    font-weight: 500;
    line-height: normal;
  }
  .textSubTitle {
    font-size: 14px;
    font-size: clamp(14px, 0.7vw, 18px);
    font-weight: 500;
    line-height: normal;
  }
  .textDate {
    font-size: 14px;
    font-size: clamp(14px, 0.7vw, 18px);
    font-weight: 300;
    line-height: normal;
  }
  .textContent {
    font-size: 16px;
    font-size: clamp(14px, 0.8vw, 20px);
    font-weight: 500;
    line-height: normal;
  }

  // 지도 마커
  #markers {
    /* !!임시로 위치를 설정한 스타일은 제거하고 나머지 스타일을 적용 하시면 됩니다.!! */
    position: absolute; // 임시
    top: 24%; // 임시
    left: 30%; // 임시
    // width: 30%; // 임시
    // height: 50%; // 임시
    transform: translate(-50%, -50%); // 임시
  }

  // 지도 마커
  .active {
    z-index: 10000;
  }
  .mapMarker {
    width: 2.3vw;
    height: 2.3vw;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transform: translate(-50%, -50%);
    // margin: 20px; // 임시
    span {
      color: #fff;
      font-size: 14px;
      font-size: clamp(14px, 0.7vw, 20px);
      font-weight: 400;
    }
    &.dashAcc,
    &.dashIns,
    &.dashRul {
      background: rgb(var(--v-theme-dashAcc));
      position: relative;
      &::before {
        position: absolute;
        content: '';
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% + 8px);
        height: calc(100% + 8px);
        border-radius: 100%;
        border: 1px solid rgb(var(--v-theme-dashAcc));
        background: rgba(var(--v-theme-dashAcc), 0.5);
        z-index: -1;
      }
    }
    &.dashIns {
      background: rgb(var(--v-theme-dashIns));
      &::before {
        border-color: rgb(var(--v-theme-dashIns));
        background: rgba(var(--v-theme-dashIns), 0.5);
      }
    }
    &.dashRul {
      background: rgb(var(--v-theme-dashRul));
      &::before {
        border-color: rgb(var(--v-theme-dashRul));
        background: rgba(var(--v-theme-dashRul), 0.5);
      }
    }
    .marker-icon {
      display: none;
      height: 25px;
    }

    // PTW 라벨
    &:has(.ptwLabel) {
      // margin-top: 60px; // 임시
      width: 8px;
      height: 8px;
      position: relative;
      > span {
        display: none;
      }
    }

    // 마커 선택시
    &.selected {
      background: transparent;
      position: relative;
      width: 1.5vw;
      height: 1.5vw;
      > span {
        display: none;
      }

      .marker-icon {
        display: block;
        position: absolute;
        bottom: 50%;
      }
      &.dashAcc .marker-icon {
        color: rgb(var(--v-theme-dashAcc));
      }
      &.dashIns .marker-icon {
        color: rgb(var(--v-theme-dashIns));
      }
      &.dashRul .marker-icon {
        color: rgb(var(--v-theme-dashRul));
      }
    }
    .ptwLabel:has(.foldBtn.ptwFold) {
      background-color: rgba(0, 66, 198, 0.2); /* 반투명 파란색 */
    }
    // PTW 지도 라벨
    .ptwLabel {
      position: absolute;
      bottom: calc(100% + 8px);
      width: fit-content;
      padding: 3px 5px;
      border-radius: 10px;
      height: fit-content;
      background: rgba(var(--v-theme-dashIns), 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      color: #fff;
      > div {
        display: flex;
        gap: 6px;
      }
      // 접는 버튼
      .foldBtn {
        cursor: pointer;
        padding-left: 6px;
        border-left: 1px solid rgba(255, 255, 255, 0.5);
        > img {
          transition: all 0.4s ease-in-out;
        }
        &.ptwFold > img {
          transform: rotate(-180deg);

        }
      }
    }
  }
  //프로그래스바 배경 지우기
  #progressBackGround{
    .v-progress-linear__background{
      background-color: transparent !important;
    }
  }

  
  // vuetify
  // chip
  .v-chip {
    height: 30px !important;
    vertical-align: top !important;
    padding: 0 6px !important;
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
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #627297 !important;
    width: 4px !important;
    height: 4px !important;
  }
}
div:has(.dashboard) ~ .v-overlay-container {
  .v-menu > .v-select__content > .v-card,
  .v-menu > .v-select__content > .v-sheet,
  .v-menu > .v-select__content > .v-list {
    background: rgb(var(--v-theme-dashSelectBox)) !important;
    color: #fff !important;
  }
  .v-menu .v-select__content .v-list-item-title {
    font-size: 14px;
    font-size: clamp(14px, 0.7vw, 20px);
  }
}
</style>
