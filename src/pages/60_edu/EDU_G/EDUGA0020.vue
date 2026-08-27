<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick, onActivated } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import _ from 'lodash'

import EDUGA0010Popup01 from '@/pages/60_edu/EDU_G/Popup/EDUGA0010Popup01.vue'

import Map from 'ol/Map'
import View from 'ol/View'
import Overlay from 'ol/Overlay'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
// import ImageCanvas from 'ol/source/ImageCanvas'
// import { getRenderPixel } from 'ol/render'
// import ImageLayer from 'ol/layer/Image'
import Feature from 'ol/Feature'
import { Style, Fill, Stroke, Circle as CircleStyle, Text, Icon/*, RegularShape*/ } from 'ol/style'
import { defaults } from 'ol/control'
import { Point/*, LineString, Polygon*/ } from 'ol/geom'
// import GeoJSON from 'ol/format/GeoJSON'
// import { get as getProjection, transform, toLonLat, fromLonLat, Projection } from 'ol/proj'
// import { easeOut } from 'ol/easing'
// import { unByKey } from 'ol/Observable'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { totLayers } from '@/plugins/ol'

// defineOptions({
//   name: '60_edu-EDU_G-EDUGA0020',
// })

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n()
const userLogStore = useLogsStore()
const userStore = useUserStore()
const detailPop = ref(null)

const bsnsCntList = ref([])
const typeCntList = ref([])
const alarmCntList = ref([])

const ftrBtns = ref([
  { text: '본공장', id: 'A', loc: [129.437918, 35.515152], selected: true },
  { text: '해양', id: 'B', loc: [129.406218, 35.480363], selected: false },
  // { text: '군산', id: 'C', loc: [129.406218, 35.480363], selected: false },
])

let mapObj = null
const setZoom = ref(15.8)
const mapCenter4326 = ftrBtns.value[0].loc
const initZoom = 15.8
const projCode = {
  'EPSG:5176':
        '+proj=tmerc +lat_0=38 +lon_0=129.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43',
  'EPSG:5187':
        '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  'EPSG:3857' :
        '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
}
const projDefs = () => {
  Object.keys(projCode).forEach(key => {
    proj4.defs(key, projCode[key])
    register(proj4)
  })
}

projDefs()

const view = new View({
  center: proj4('EPSG:4326', 'EPSG:5187', mapCenter4326),
  zoomFactor: 2,
  zoom: initZoom,
  maxZoom: 20,
  minZoom: 14,

  enableRotation: false,
})

const [
  naviLayers,
  shipLayers,
  tempLayers,
  areaLayers,
] = totLayers

const leftSearchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
})

const searchType = async () => {
  const typeParam = getMapParam()

  await commonSearchApi({ queryId: 'EDUGA0020_SEARCH_03', param: typeParam }).then(res => {
    typeCntList.value = res.ORESULT_CUR

    typeCntList.value.forEach(row => {
      row.selected = false
    })
  })
}

const searchPanel = async () => {
  await commonSearchApi({ queryId: 'EDUGA0020_SEARCH_01', param: leftSearchParams }).then(res => {
    alarmCntList.value = res.ORESULT_CUR1
    bsnsCntList.value = res.ORESULT_CUR2

    alarmCntList.value.forEach(row => {
      row.selected = false
    })

    bsnsCntList.value.forEach(row => {
      if(row.BD_BSNS_NM === '전사') {
        row.selected = true
      } else {
        row.selected = false
      }
    })

    searchType()
  })
}

const initMap = () => {
  mapObj = new Map({
    controls: defaults({
      attributionOptions: ({
        collapsible: false,
      }),
      zoom: false,
      rotate: false,
    }),
    target: 'eduga0020-map__main',
    layers: totLayers,
    view: view,
  })

  mapObj.on('click', e => {
    const feature = mapObj.forEachFeatureAtPixel(e.pixel, f => { return f })

    if(feature != undefined && feature != null) {
      detailPop.value.openPopup({ CMPNY_DIV: feature.cmpnyDiv, SEQ: feature.seq })
    }
  })

  mapObj.on('pointermove', e => {
    const feature = mapObj.forEachFeatureAtPixel(e.pixel, f => { return true })
    
    if(feature) {
      mapObj.getTargetElement().style.cursor = 'pointer'
    } else {
      mapObj.getTargetElement().style.cursor = ''
    }
  })

  mapObj.on('moveend', e => {
    if(setZoom.value !== mapObj.getView().getZoom()) {
      setZoom.value = mapObj.getView().getZoom()
    }
  })
}

const clickFtrBtn = btn => {
  ftrBtns.value.forEach(el => (el.selected = el.id === btn.id ? true : false))
  mapObj.getView().setCenter(proj4('EPSG:4326', 'EPSG:5187', btn.loc))
}

const zoomIn = () => {
  setZoom.value = setZoom.value + 0.3
  mapObj.getView().setZoom(setZoom.value)
}

const zoomOut = () => {
  setZoom.value = setZoom.value - 0.3
  mapObj.getView().setZoom(setZoom.value)
}

const clickType = btn => {
  typeCntList.value.forEach(el => {
    el.selected = el.BD_TYPE === btn.BD_TYPE ? !el.selected : false
  })

  searchMap()
}

const clickAlarm = async btn => {
  alarmCntList.value.forEach(el => {
    if(el.BD_CMPNY_DIV === btn.BD_CMPNY_DIV
       && el.BD_BSNS_CD === btn.BD_BSNS_CD) {
      el.selected = true

      bsnsCntList.value.forEach(el2 => {
        el2.selected = false
      })
    } else {
      el.selected = false
    }
  })

  await searchType()
  searchMap()
}

const clickBsns = async btn => {
  bsnsCntList.value.forEach(el => {
    el.selected = el.BD_CMPNY_DIV === btn.BD_CMPNY_DIV && el.BD_BSNS_CD === btn.BD_BSNS_CD ? true : false

    alarmCntList.value.forEach(el2 => {
      el2.selected = false
    })
  })

  await searchType()
  searchMap()
}

const getMapParam = () => {
  let pBdType = ''
  let pAlarmYn = ''
  let pBdCmpnyDiv = ''
  let pBdBsnsCd = ''

  if(_.some(typeCntList.value, { selected: true })) {
    pBdType = _.find(typeCntList.value, { selected: true }).BD_TYPE
  }

  if(_.some(alarmCntList.value, { selected: true })) {
    pAlarmYn = 'Y'
    pBdCmpnyDiv = _.find(alarmCntList.value, { selected: true }).BD_CMPNY_DIV
    pBdBsnsCd = _.find(alarmCntList.value, { selected: true }).BD_BSNS_CD
  }

  if(_.some(bsnsCntList.value, { selected: true })) {
    pAlarmYn = ''
    pBdCmpnyDiv = _.find(bsnsCntList.value, { selected: true }).BD_CMPNY_DIV
    pBdBsnsCd = _.find(bsnsCntList.value, { selected: true }).BD_BSNS_CD
  }

  const pReturn = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BD_CMPNY_DIV: pBdCmpnyDiv,
    BD_BSNS_CD: pBdBsnsCd,
    ALARM_YN: pAlarmYn,
    BD_TYPE: pBdType,
  }

  return pReturn
}

const searchMap = () => {
  // console.log('getMapParam', getMapParam())
  areaLayers.getSource().clear()

  const mapParam = getMapParam()

  commonSearchApi({ queryId: 'EDUGA0020_SEARCH_02', param: mapParam }).then(res => {
    // console.log('searchMap res', res)

    const bdData = res.ORESULT_CUR

    if(bdData.length > 0) {
      const features = []

      for(let i = 0; i < bdData.length; i++) {
        const currData = bdData[i]
        const feature = new Feature({ geometry: new Point(proj4('EPSG:4326', 'EPSG:5187', [currData.LONGITUDE, currData.LATITUDE])) })
        
        feature.cmpnyDiv = currData.CMPNY_DIV
        feature.seq = currData.SEQ
        feature.bdId = currData.BD_ID
        feature.color = currData.BD_COLOR
        feature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 14,
              scale: 1,
              fill: new Fill({
                color: feature.color,
              }),
            }),
            zIndex: 1,
            text: new Text({
              text: feature.bdId,
              font: '16px 나눔고딕',
              fill: new Fill({
                color: '#000000',
              }),
            }),
          })
        )

        features.push(feature)
      }

      areaLayers.getSource().addFeatures(features)
    }
  })
}

const refreshData = async () => {
  await searchPanel()
  searchMap()
}

onMounted(() => {
  nextTick(() => {
    initMap()
    
    refreshData()
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-text class="pa-0 content-area">
      <div class="fill-height pa-2 eduga0020-map__wrapper">
        <div id="eduga0020-map__main" class="fill-height" />
        <div class="div__tool-wrapper d-flex">
          <v-card
            color="dashCard"
            variant="flat"
            class="btn-card d-flex justify-space-between align-center px-1"
          >
          <!-- :color="btn.selected ? 'primary' : 'dashBtnDisabled'" -->
            <v-btn
              v-for="btn in ftrBtns"
              :key="btn"
              :text="btn.text"
              class="mx-1 toggleBtn"
              variant="flat"
              @click="clickFtrBtn(btn)"
            />
          </v-card>
          <v-card
            color="dashCard"
            variant="flat"
            class="zoom-card d-flex justify-space-between ml-1"
          >
            <div class="d-flex align-center justify-space-between w-full">
              <section class="d-flex align-center px-3 w-full">
                <v-btn
                  color="dashLogBox"
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
                  color="dashLogBox"
                  variant="text"
                  icon
                  density="comfortable"
                  @click="zoomIn"
                >
                  <svg-icon name="plus" />
                </v-btn>
              </section>
            </div>
          </v-card>
          <!-- <v-card
            color="dashCard"
            variant="flat"
            class="refresh-card d-flex justify-center align-center ml-1"
          >
            <v-btn
              class="ma-0 pa-0"
              color="dashLogBox"
              variant="text"
              icon
              block
              density="comfortable"
              @click="refreshData"
            >
              <v-icon size="30" icon="mdi-refresh" color="#ffffff" />
            </v-btn>
          </v-card> -->
        </div>
        <div class="panel-top">
          <div class="panel-cnt d-flex align-center">
            <div
              class="data-title px-4 d-flex align-center"
              @click.stop="refreshData"
            >
              안전 간판 현황
            </div>
            <div
              class="data-cnt px-4 d-flex align-center"
              :class="[item.selected ? 'selected' : '']"
              v-for="(item, idx) in bsnsCntList"
              :key="`alarm${idx}`"
              @click.stop="clickBsns(item)"
            >
              <div>
                {{ `${item.BD_BSNS_NM}:` }}
              </div>
              <div class="ml-2">
                {{ `${item.CNT}` }}
              </div>
            </div>
          </div>
        </div>
        <div class="panel-left">
          <div class="panel-cnt px-3 py-2">
            <div class="data-title py-2">
              안전 간판 보수 임박 현황
            </div>
            <div
              class="data-cnt px-3 py-2 d-flex justify-space-between"
              :class="[item.selected ? 'selected' : '']"
              v-for="(item, idx) in alarmCntList"
              :key="`alarm${idx}`"
              @click.stop="clickAlarm(item)"
            >
              <div class="d-flex">
                <div>
                  -
                </div>
                <div class="ml-2">
                  {{ `${item.BD_BSNS_NM}` }}
                </div>
              </div>
              <div class="ml-3">
                {{ `${item.CNT}건` }}
              </div>
            </div>
          </div>
          <div class="panel-cnt px-3 py-2 mt-2">
            <div class="data-title py-2">
              안전 간판 종류별 현황
            </div>
            <div
              class="data-cnt px-3 py-2 d-flex justify-space-between"
              :class="[item.selected ? 'selected' : '']"
              v-for="(item, idx) in typeCntList"
              :key="`type${idx}`"
              @click.stop="clickType(item)"
            >
              <div class="d-flex">
                <div class="div-color" :style="{ 'background-color': `${item.BD_COLOR}` }" />
                <div class="ml-2">
                  {{ `${item.BD_TYPE_NM}` }}
                </div>
              </div>
              <div>
                {{ `${item.CNT}건` }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>

    <EDUGA0010Popup01 ref="detailPop" is-dash />
  </v-card>
</template>

<style scoped lang="scss">
$topTitleSize: 20px;
$topFontSize: 24px;
$topFontColor: #eeeeee;
$topHeight: 52px;

$lefTitleSize: 24px;
$leftFontSize: 20px;
$leftFontColor: #eeeeee;

$selectedColor: rgba(90, 128, 255, 0.5);
$hoverColor: rgba(255, 255, 255, 0.1);

.content-area {
  position: relative;
  height: 100%;
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}

.eduga0020-map__wrapper {
  position: relative;
  background-color: #45536f;

  .div__tool-wrapper{
    position: absolute;
    top: 12px;
    right: 12px;

    .btn-card {
      height: 48px;
    }

    .zoom-card {
      width: 250px;
      height: 48px;
    }

    .refresh-card {
      width: 48px;
      height: 48px;
    }
  }

  .panel-top, .panel-left {
    position: absolute;
  }

  .panel-cnt {
    background-color: rgba(20, 33, 62, 0.9);
    border-radius: 8px;
  }

  .panel-top {
    top: 12px;
    left: 304px;

    .panel-cnt {
      height: $topHeight;

      .data-title {
        color: $topFontColor;
        text-align: center;
        font-size: $topTitleSize;
        height: 100%;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
      }

      .data-title:hover {
        background-color: $hoverColor;
        cursor: pointer;
        border-radius: 6px 0 0 6px;
      }

      .data-cnt {
        cursor: pointer;
        // border-radius: 6px;
        color: $topFontColor;
        font-size: $topFontSize;
        height: 100%;
      }

      .data-cnt:last-child {
        border-radius: 0 8px 8px 0;
      }

      .data-cnt.selected {
        background-color: $selectedColor;
      }

      .data-cnt:hover:not(.selected) {
        background-color: $hoverColor;
      }
    }
  }

  .panel-left {
    top: 12px;
    left: 12px;
    width: 280px;

    .data-title {
      color: $leftFontColor;
      text-align: center;
      font-size: $lefTitleSize;
      line-height: $lefTitleSize;
    }

    .panel-cnt {
      .data-cnt:not(:first-child) {
        margin-top: 4px;
      }

      .div-color {
        width: $leftFontSize;
        height: $leftFontSize;
        border-radius: 50%;
      }

      .data-cnt {
        color: $leftFontColor;
        font-size: $leftFontSize;
        line-height: $leftFontSize;
        cursor: pointer;
        border-radius: 6px;
      }

      .data-cnt.selected {
        background-color: $selectedColor;
      }

      .data-cnt:hover:not(.selected) {
        background-color: $hoverColor;
      }
    }
  }
}
</style>