<script setup>
import { ref, reactive, onMounted } from 'vue'
import { commonGetWeather } from "@hiway/api/commonApi"

import { useI18n } from 'vue-i18n'

import _ from 'lodash'

const emit = defineEmits(['selected'])


const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const popupParam = ref([])


const openPopup = () => {  
  dialog.value = true

  commonGetWeather().then(res => {
    popupParam.value = res.ORESULT_CUR
  })
}

const onClose = () => {
  dialog.value = false
}

const getImage = imgNm => {
  let imgNmtemp = imgNm.split('.')
  
  return new URL(`/src/assets/images/svg/${imgNmtemp[0]}.svg`, import.meta.url).href
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog 
    v-model="dialog" 
    eager
    persistent 
    width="1400"
    height="340"
    class="draggable-dialog" 
  >    
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 justify-space-between"
    >
      <span>날씨 상세</span>
      <v-icon class="cursor-pointer" @click="dialog = false">mdi-close</v-icon>
    </v-sheet>
    <v-sheet class="fill-height" style="background-color: white; ">
      <v-row no-gutters class="ma-5">
        <v-col
          v-for="item in popupParam"
          :key="item.date"
          cols="3"
          class="pa-2"
        >
          <v-card
            class="pa-2 weather_card"
            variant="outlined"
            color="card"
            rounded="lg"
          >
            <div class="weatherLayout">
              <span class="textTime justify-center d-flex align-center"> 
                {{ item.tm }}({{ item.day_of_week }})
              </span>
              <div class="d-flex align-center">
                <v-sheet
                  class="d-flex align-center justify-center"
                  width="30%"
                >
                  <img
                    :src="getImage(item.icon)"
                  >
                </v-sheet>
                <v-sheet class="d-flex textLabelLight h-auto">
                  <div class="textLabel flex-column">
                    <div class="d-flex">
                      <v-icon color="rgb(255, 96, 128)">
                        mdi-thermometer
                      </v-icon>
                      <span class="textPoint">{{ item.low }} ~ {{ item.high }}</span>°C 
                    </div>
                    <div class="textLabel">
                      <span class="textPoint pl-1">{{ item.condition }}</span>
                    </div>
                  </div>

                  <div class="textLabelLight">
                    <div class="textLabel">
                      <v-icon color="rgb(128, 192, 255)">
                        mdi-water
                      </v-icon>
                      <span class="textPoint pl-1">{{ item.rain_rate }}</span>%
                    </div>
                    <div class="textLabel">
                      <v-icon color="rgb(128, 192, 255)">
                        mdi-weather-windy
                      </v-icon>
                      <span class="textPoint pl-1">{{ item.wind_condition }}</span>
                    </div>
                  </div>
                </v-sheet>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </VDialog>
</template>

<style scoped scss="lang">
.weather_card {
  border-color: lightgray !important;
}
</style>