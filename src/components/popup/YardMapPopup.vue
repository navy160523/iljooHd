<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
// import IGridTitle from '@/components/IGridTitle.vue'
// import queryFlowHelper from '@/utils/searchFlowHelper'
// import { commonSearchApi, getCompanyList } from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

import Map from 'ol/Map'
import View from 'ol/View'
import Overlay from 'ol/Overlay'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
// import ImageCanvas from 'ol/source/ImageCanvas'
// import { getRenderPixel } from 'ol/render'
// import ImageLayer from 'ol/layer/Image'
import Feature from 'ol/Feature'
import { Style/*, Fill, Stroke, Circle as CircleStyle, Text*/, Icon/*, RegularShape*/ } from 'ol/style'
import { defaults } from 'ol/control'
import { Point/*, LineString, Polygon*/ } from 'ol/geom'
// import GeoJSON from 'ol/format/GeoJSON'
// import { get as getProjection, transform, toLonLat, fromLonLat, Projection } from 'ol/proj'
// import { easeOut } from 'ol/easing'
// import { unByKey } from 'ol/Observable'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { totLayers } from '@/plugins/ol'

const emit = defineEmits(['selectPoint', 'close'])
const props = defineProps({
  popupWidth: {
    type: String,
    default() {
      return '75vw'
    }
  },
  popupHeight: {
    type: String,
    default() {
      return '100vh'
    }
  },
  usePoint: {
    type: Boolean,
    default() {
      return true
    }
  }
})

const [
  naviLayers,
  shipLayers,
  tempLayers,
  areaLayers,
] = totLayers

const mapParams = reactive({
  LATITUDE: null,
  LONGITUDE: null,
})

const COORDINATE = computed(() => {
  const latitude = mapParams.LATITUDE === null ? '' : mapParams.LATITUDE
  const longitude = mapParams.LONGITUDE === null ? '' : mapParams.LONGITUDE

  return `${latitude}, ${longitude}`
})

const ftrBtns = ref([
  { text: '본공장', id: 'A', loc: [129.437918, 35.515152], selected: true },
  { text: '해양', id: 'B', loc: [129.406218, 35.480363], selected: false },
  // { text: '군산', id: 'C', loc: [129.406218, 35.480363], selected: false },
])

let mapObj = null
const dialog = ref(false)
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

// const markerLayer = new VectorLayer({
//   style: new Style({
//     image: new Icon({
//       opacity: 1,
//       scale: 1,
//       src: new URL('/src/assets/images/dashboard/mapMarker.png', import.meta.url).href
//     }),
//     zIndex: 10,
//   })
// })

const openPopup = params => {
  dialog.value = true
  
  mapParams.LATITUDE = params.LATITUDE
  mapParams.LONGITUDE = params.LONGITUDE

  nextTick(() => {
    // clearMap()
    clearMarker()

    if(mapParams.LATITUDE > 0 && mapParams.LONGITUDE > 0) {
      const point = proj4('EPSG:4326', 'EPSG:5187', [mapParams.LONGITUDE, mapParams.LATITUDE])

      addMarker(point)
      
      mapObj.getView().setCenter(point)
    } else {
      mapObj.getView().setCenter(proj4('EPSG:4326', 'EPSG:5187', _.find(ftrBtns.value, { selected: true }).loc))
    }
  })
}

const closePopup = () => {
  dialog.value = false
  emit('close')
}

const clearMarker = () => {
  areaLayers.getSource().clear()
  // if(markerLayer.getSource() != null) {
  //   markerLayer.getSource().clear()
  //   mapParams.LATITUDE = null
  //   mapParams.LONGITUDE = null
  // }
}

const addMarker = coordinate => {
  clearMarker()

  // console.log('addMarker coordinate', coordinate)
  
  const feature = new Feature({
    geometry: new Point([coordinate[0], coordinate[1]])
  })

  feature.setStyle(
    new Style({
      image: new Icon({
        opacity: 1,
        scale: 1,
        src: new URL('/src/assets/images/dashboard/mapMarker.png', import.meta.url).href
      }),
      zIndex: 10,
    })
  )

  // const markerSource = new VectorSource()

  // markerSource.addFeature(feature)
  // markerLayer.setSource(markerSource)

  areaLayers.getSource().addFeature(feature)

  const point = proj4('EPSG:5187', 'EPSG:4326', [coordinate[0], coordinate[1]])

  mapParams.LATITUDE = point[1].toFixed(8) * 1
  mapParams.LONGITUDE = point[0].toFixed(8) * 1
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
    target: 'yard-map__main',
    layers: totLayers, // 각종 layer들 모음
    view: view, // 지도의 기본 view 정보
  })

  // mapObj.addLayer(markerLayer)

  mapObj.on('click', e => {
    addMarker(e.coordinate)
  })

  mapObj.on('moveend', e => {
    // console.log('moveend1', setZoom.value)
    // console.log('moveend2', mapObj.getView().getZoom())

    if(setZoom.value !== mapObj.getView().getZoom()) {
      setZoom.value = mapObj.getView().getZoom()
    }
  })
}

const clearMap = () => {
  mapObj.getAllLayers().forEach(layer => {
    // if (layer.get('id') === 'area_layer') {
      if(layer.getSource() != null) {
        layer.getSource().clear()
      }
    // }
  })

  // const point = proj4('EPSG:4326', 'EPSG:5187', [mapParams.LATITUDE, mapParams.LONGITUDE])

  // console.log('clearMap point', point)
}

const goMyLoc = () => {
  clearMarker()

  navigator.geolocation.getCurrentPosition(
    res => {
      // console.log('curr loc res', res)
      
      // const point = proj4('EPSG:5187', 'EPSG:4326', [res.coords.latitude, res.coords.longitude])
      const point = proj4('EPSG:4326', 'EPSG:5187', [res.coords.longitude, res.coords.latitude])

      // console.log('curr loc point', point)

      addMarker(point)

      mapObj.getView().setCenter(point)
    },
    err => {
      // console.log('curr loc err', err)
      Message.err('현재 위치를 가져오는데 실패했습니다.')
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  )
}

const zoomIn = () => {
  setZoom.value = setZoom.value + 0.3
  mapObj.getView().setZoom(setZoom.value)
}

const zoomOut = () => {
  setZoom.value = setZoom.value - 0.3
  mapObj.getView().setZoom(setZoom.value)
}

const selectPoint = () => {
  emit(
    'selectPoint',
    {
      LATITUDE: mapParams.LATITUDE,
      LONGITUDE: mapParams.LONGITUDE,
    }
  )

  closePopup()
}

function clickFtrBtn(btn) {
  ftrBtns.value.forEach(el => (el.selected = el.id === btn.id ? true : false))
  mapObj.getView().setCenter(proj4('EPSG:4326', 'EPSG:5187', btn.loc))
}

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    :width="props.popupWidth"
    :height="props.popupHeight"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <div class="d-flex justify-space-between align-center" style="width: 100%;">
        <span>야드맵</span>
        <v-icon
          class="close-popup"
          icon="mdi-close-circle-outline"
          size="32"
          style="cursor: pointer;"
          @click="closePopup"
        />
      </div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-text class="pa-0 content-area">
        <div class="fill-height pa-2 yard-map__wrapper">
          <div id="yard-map__main" class="fill-height" />
          <v-card
            color="dashCard"
            variant="flat"
            class="btn-card d-flex justify-space-between align-center px-1"
          >
            <v-btn
              v-for="btn in ftrBtns"
              :key="btn"
              :text="btn.text"
              :color="btn.selected ? 'primary' : 'dashBtnDisabled'"
              class="mx-1 toggleBtn"
              variant="flat"
              @click="clickFtrBtn(btn)"
            />
          </v-card>
          <v-card
            color="dashCard"
            variant="flat"
            class="zoom-card d-flex justify-space-between"
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
          <div class="d-flex tool-box">
            <div class="point-box d-flex justify-center align-center">
              {{ COORDINATE }}
            </div>
            <v-btn
              color="dashLogBox"
              height="100%"
              @click="selectPoint"
            >
              <v-icon size="26">
                mdi-map-marker-check
              </v-icon>
              선택
              <v-tooltip
                activator="parent"
                location="top"
              >
                <div style="font-size: 16px;">
                  좌표 선택
                </div>
              </v-tooltip>
            </v-btn>
            <!-- <v-btn
              color="dashLogBox"
              height="100%"
              @click="goMyLoc"
            >
              <v-icon size="26">
                mdi-crosshairs-gps
              </v-icon>
              <v-tooltip
                activator="parent"
                location="top"
              >
                <div style="font-size: 16px;">
                  현재 위치
                </div>
              </v-tooltip>
            </v-btn> -->
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.close-popup:hover {
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
}

.yard-map__wrapper {
  position: relative;
  background-color: #45536f;

  .btn-card {
    position: absolute;
    bottom: 16px;
    right: 280px;
    height: 48px;
  }

  .zoom-card {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 260px;
    height: 48px;
  }

  .tool-box {
    position: absolute;
    bottom: 68px;
    right: 16px;
    height: 48px;

    .point-box {
      background-color: #222222;
      color: #f0f0f0;
      padding: 0 8px;
      border-radius: 2px;
    }
  }
}
</style>