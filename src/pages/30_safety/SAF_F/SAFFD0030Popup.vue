<!--
화면명 : SLI 현황판 표시 팝업
화면개요 : SLI 현황판 표시 팝업
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonSearchApi,commonSearchnoAuthApi } from '@hiway/api/commonApi'
import _ from 'lodash'

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const slides = ref('1')
const dialog = ref(false)
const timeSearch = ref(60 * 60 * 1000)
const intervalSearch = ref(null)
const intervalSlide = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
})

const parentParams = reactive({
  GUBUN: '',
  SECOND: '',
})

const dateRange = ref('')
const data1 = ref([])
const data2 = ref([])

const openPopup = async param => {
  parentParams.GUBUN = param.GUBUN
  parentParams.SECOND = param.SECOND

  dialog.value = true

  const ele = document.documentElement

  if (document.fullscreenElement === null) {
    ele.requestFullscreen()
  }

  setInit()
  setSlide()
  await search()
  setSlideInterval()
}

const close = () => {
  if (document.fullscreenElement !== null) {
    document.exitFullscreen()
  }

  if(intervalSlide.value) {
    clearInterval(intervalSlide.value)
  }

  if(intervalSearch.value) {
    clearInterval(intervalSearch.value)
  }
  
  dialog.value = false
  slides.value = '1'
}

const setInit = () => {
  const temp = []
  const temp2 = []

  for(let i = 1; i <= 12; i++) {
    temp.push({
      title: '',
      value: '',
    })
  }

  for(let i = 1; i <= 21; i++) {
    temp2.push({
      title: '',
      value: '',
    })
  }

  data1.value = temp
  data2.value = temp2
}

const setSlide = () => {
  if(parentParams.GUBUN !== 'A') {
    slides.value = parentParams.GUBUN
  }
}

const setSlideInterval = () => {
  if(parentParams.GUBUN === 'A' && !isNaN(parentParams.SECOND)) {
    intervalSlide.value = setInterval(() => {
      slides.value = slides.value === '1' ? '2' : '1'
    }, 1000 * parentParams.SECOND)
  }
}

const search = async () => {
  if(parentParams.GUBUN === '1') {
    await search1()

    intervalSearch.value = setInterval(async () => {
      await search1()
    }, timeSearch.value)
  } else if(parentParams.GUBUN === '2') {
    await search2()

    intervalSearch.value = setInterval(async () => {
      await search2()
    }, timeSearch.value)
  } else {
    await search1()
    await search2()

    intervalSearch.value = setInterval(async () => {
      await search1()
      await search2()
    }, timeSearch.value)
  }
}

const search1 = async () => {
  await commonSearchnoAuthApi({ queryId : 'SAFFD0030_SEARCH_02', param: searchParams }).then(res => {
    // console.log('SAFFD0030_SEARCH_02 res', res.ORESULT_CUR)

    dateRange.value = res.ORESULT_CUR.length > 0 ? res.ORESULT_CUR[0].DTE : ''
    const temp = _.cloneDeep(data1.value)

    for(let i = 0; i < res.ORESULT_CUR.length; i++) {
      const row = res.ORESULT_CUR[i]

      if(temp[row.ODR * 1 - 1]){
        temp[row.ODR * 1 - 1].title = row.NAME
        temp[row.ODR * 1 - 1].value = row.VAL
      }
    }

    data1.value = temp

    // console.log('data1.value', data1.value)
  })
}

const search2 = async () => {
  await commonSearchnoAuthApi({ queryId : 'SAFFD0030_SEARCH_03', param: searchParams }).then(res => {
    // console.log('SAFFD0030_SEARCH_03 res', res.ORESULT_CUR)

    dateRange.value = res.ORESULT_CUR.length > 0 ? res.ORESULT_CUR[0].DTE : ''
    const temp = _.cloneDeep(data2.value)

    //console.log('temp', temp)

    for(let i = 0; i < res.ORESULT_CUR.length; i++) {
      const row = res.ORESULT_CUR[i]

      //console.log('row', row)

      if(temp[row.ODR2 * 1 - 1]){
        temp[row.ODR2 * 1 - 1].title = row.NAME
        temp[row.ODR2 * 1 - 1].value = row.VAL
      }
    }

    data2.value = temp

    console.log('data2.value', data2.value)
  })
}

const setColorText = val => {
  const value = val * 1

  if(val) {
    if(value >= 90) {
      return { class: 'GOOD', text: '(양호)' }
    } else if(value >= 80) {
      return { class: 'ATTNT', text: '(주의)' }
    } else if(value >= 70) {
      return { class: 'WARN', text: '(경고)' }
    } else {
      return { class: 'DANGER', text: '(위험)' }
    }
  } else {
    return { class: 'NONE', text: '' }
  }
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
    fullscreen
  >
    <div class="h-full w-full saffd0030popup--main">
      <div class="dashboard--title text-h4 d-flex justify-center align-center">
        안전선행지수(SLI) 현황
        <VBtn
          class="dashboard--btn btn__refresh"
          icon
          @click.stop="search"
        >
          <VIcon>
            mdi-refresh
          </VIcon>
        </VBtn>
        <VBtn
          class="dashboard--btn btn__close"
          icon
          color="#ff0000"
          @click.stop="close"
        >
          <VIcon color="#ffffff">
            mdi-close
          </VIcon>
        </VBtn>
      </div>
      <div class="dashboard--guide px-6 d-flex align-center justify-space-between">
        <div class="text-h6">
          ※ 1시간단위로 자동갱신
        </div>
        <div class="text-h6">
          {{ dateRange }}
        </div>
      </div>
      <div class="dashboard--panels">
        <div class="panels--wrap h-full">
          <VCarousel
            v-model="slides"
            height="100%"
            :show-arrows="false"
            hide-delimiters
          >
            <VCarouselItem
              value="1"
            >
              <div class="h-full pb-1">
                <div
                  class="row--odr d-flex px-3 pb-2"
                  v-for="odrRowIdx in (data1.length / 3)"
                  :key="`row--odr__${odrRowIdx}`"
                >
                  <div div class="data--odr px-1">
                    <div class="data--wrap data--title h-full d-flex justify-center align-center">
                      {{ data1[odrRowIdx * 3 - 3].title }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div
                      class="data--wrap data--value h-full d-flex justify-center align-center text-center"
                      :class="`text--${setColorText(data1[odrRowIdx * 3 - 3].value).class}`"
                    >
                      {{ data1[odrRowIdx * 3 - 3].value }}
                      <br/>
                      {{ setColorText(data1[odrRowIdx * 3 - 3].value).text }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div class="data--wrap data--title h-full d-flex justify-center align-center">
                      {{ data1[odrRowIdx * 3 - 2].title }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div
                      class="data--wrap data--value h-full d-flex justify-center align-center text-center"
                      :class="`text--${setColorText(data1[odrRowIdx * 3 - 2].value).class}`"
                    >
                      {{ data1[odrRowIdx * 3 - 2].value }}
                      <br/>
                      {{ setColorText(data1[odrRowIdx * 3 - 2].value).text }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div class="data--wrap data--title h-full d-flex justify-center align-center">
                      {{ data1[odrRowIdx * 3 - 1].title }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div
                      class="data--wrap data--value h-full d-flex justify-center align-center text-center"
                      :class="`text--${setColorText(data1[odrRowIdx * 3 - 1].value).class}`"
                    >
                      {{ data1[odrRowIdx * 3 - 1].value }}
                      <br/>
                      {{ setColorText(data1[odrRowIdx * 3 - 1].value).text }}
                    </div>
                  </div>
                </div>
              </div>
            </VCarouselItem>
            <VCarouselItem
              value="2"
            >
              <div class="h-full pb-1">
                <div
                  class="row--odr2 d-flex px-3 pb-2"
                  v-for="odrRowIdx in (data2.length / 3)"
                  :key="`row--odr2__${odrRowIdx}`"
                >
                  <div class="data--odr px-1">
                    <div class="data--wrap data--title h-full d-flex justify-center align-center">
                      {{ data2[odrRowIdx * 3 - 3].title }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div
                      class="data--wrap data--value h-full d-flex justify-center align-center text-center"
                      :class="`text--${setColorText(data2[odrRowIdx * 3 - 3].value).class}`"
                    >
                      {{ data2[odrRowIdx * 3 - 3].value }}
                      <br/>
                      {{ setColorText(data2[odrRowIdx * 3 - 3].value).text }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div class="data--wrap data--title h-full d-flex justify-center align-center">
                      {{ data2[odrRowIdx * 3 - 2].title }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div
                      class="data--wrap data--value h-full d-flex justify-center align-center text-center"
                      :class="`text--${setColorText(data2[odrRowIdx * 3 - 2].value).class}`"
                    >
                      {{ data2[odrRowIdx * 3 - 2].value }}
                      <br/>
                      {{ setColorText(data2[odrRowIdx * 3 - 2].value).text }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div class="data--wrap data--title h-full d-flex justify-center align-center">
                      {{ data2[odrRowIdx * 3 - 1].title }}
                    </div>
                  </div>
                  <div class="data--odr px-1">
                    <div
                      class="data--wrap data--value h-full d-flex justify-center align-center text-center"
                      :class="`text--${setColorText(data2[odrRowIdx * 3 - 1].value).class}`"
                    >
                      {{ data2[odrRowIdx * 3 - 1].value }}
                      <br/>
                      {{ setColorText(data2[odrRowIdx * 3 - 1].value).text }}
                    </div>
                  </div>
                </div>
              </div>
            </VCarouselItem>
          </VCarousel>
        </div>
      </div>
    </div>
  </VDialog>
</template>

<style scoped lang="scss">
.saffd0030popup--main {
  background-color: #eeeeee;

  .dashboard--title {
    position: relative;
    height: 62px;

    .dashboard--btn {
      position: absolute;
    }

    .btn__refresh {
      top: 8px;
      right: 66px;
    }
    .btn__close {
      top: 8px;
      right: 16px;
    }
  }

  .dashboard--guide {
    height: 38px;
  }

  .dashboard--panels {
    height: calc(100% - 100px);
    
    .panels--wrap {
      .row--odr {
        height: 25%;

        .data--odr {
          width: calc(100% / 6);
          
          .data--wrap.data--title {
            font-size: 48px;
            font-weight: bold;
          }

          .data--wrap.data--value {
            font-size: 96px;
            line-height: 96px;
          }
        }
      }

      .row--odr2 {
        height: calc(100% / 7);

        .data--odr {
          width: calc(100% / 6);
          
          .data--wrap.data--title {
            font-size: 44px;
            font-weight: bold;
          }

          .data--wrap.data--value {
            font-size: 56px;
            line-height: 56px;
          }
        }
      }
    }
  }

  .data--wrap {
    border: 2px solid #aaaaaa;
    border-radius: 8px;
    background-color: #ffffff;
    padding: 0 8px;
  }

  .data--title {
    background-color: #ddffff;
  }
  
  .data--wrap.text--GOOD {
    color: rgb(15, 151, 77);
  }

  .data--wrap.text--ATTNT {
    color: rgb(239, 174, 18);
  }

  .data--wrap.text--WARN {
    color: rgb(234, 119, 4);
  }

  .data--wrap.text--DANGER {
    color: rgb(219, 4, 2);
  }
}
</style>
