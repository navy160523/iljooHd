<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTagsStore } from '@hiway/stores/tags'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import _ from 'lodash'
import Message from '@hiway/utils/notify'

import LocationPopup from '@/components/popup/CommonCodePopUpSAF.vue'
import YardMapPopup from '@/components/popup/YardMapPopup.vue'
import ImgDragDrop from '@/components/IUploadImageDragDrop.vue'

const props = defineProps({
  isDash: {
    type: Boolean,
    default() {
      return false
    }
  }
})

const emit = defineEmits([
  'close',
])

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const tagsStore = useTagsStore()
const router = useRouter() 

const dialog = ref(false)
const popupTitle = ref(null)
const gridTitle = ref(null)
const isSaved = ref(false)
const delYn = ref(false)
const showBottom = ref(false)
const autoAddDt = ref(2)

const locationPopup = ref(null)
const yardMapPopup = ref(null)
const imgDragDrop = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SEQ: '',
  DEL_YN: 'Y',
})

const popupParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  SEQ: '',
  BD_TYPE: '',
  BD_SEQ: '',
  DEL_YN: 'N',
  BD_CMPNY_DIV: '',
  BD_BSNS_CD: '',
  INSTALL_DT: dayjs().format('YYYY-MM-DD'),
  PLACE_L: '',
  PLACE_L_NM: '',
  PLACE_M: '',
  PLACE_M_NM: '',
  PLACE_S: '',
  PLACE_S_NM: '',
  PLACE_DETAIL: '',
  LATITUDE: null,
  LONGITUDE: null,
  BD_SIZE: '',
  INSTALL_COMP: '',
  FIX_PLAN_DT: dayjs().add(autoAddDt.value, 'year').format('YYYY-MM-DD'),
  REMARKS: '',
  FIX_RESULT: '',
  FIX_RESULT_REMARKS: '',
  ALARM_PLAN: 2,
  ALARM_DT: '',
  FILE_ID: '',
})

const initParams = _.cloneDeep(popupParams)

const COORDINATE = computed(() => {
  const latitude = popupParams.LATITUDE === null ? '' : popupParams.LATITUDE
  const longitude = popupParams.LONGITUDE === null ? '' : popupParams.LONGITUDE

  return `${latitude}, ${longitude}`
})

const codeList = reactive({
  BD_CMPNY_DIV: [],
  BD_BSNS_CD: [],
  BD_TYPE: [],
  FIX_RESULT: [],
})

watch(() => popupParams.BD_CMPNY_DIV, (newValue, oldValue) => {
  commonSearchApi({
    queryId: 'searchBSNS',
    param: {
      CMPNY_DIV: popupParams.BD_CMPNY_DIV,
      USE_DIV: 'N',
    },
  }).then(res => {
    codeList.BD_BSNS_CD = res.ORESULT_CUR

    if(!_.some(codeList.BD_BSNS_CD, { BSNS_CD: popupParams.BD_BSNS_CD })) {
      popupParams.BD_BSNS_CD = ''
    }
  })
}, { immediate: true, })

const getCodes = () => {
  Promise.all([
    getCompanyList(),
    getCodeList('HHID250A'),
    getCodeList('HHID250B'),
  ]).then(res => {
    codeList.BD_CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BD_TYPE = res[1].ORESULT_CUR
    codeList.FIX_RESULT = res[2].ORESULT_CUR
  })
}

const popupInit = () => {
  getCodes()
}

const clearPopup = () => {
  isSaved.value = false
  showBottom.value = false
  delYn.value = false

  imgDragDrop.value.clearImg()

  Object.keys(popupParams).forEach(key => {
    popupParams[key] = initParams[key]
  })

  gridTitle.value.setBtnProperty('btnDelete', 'visible', false)
}

const openPopup = async param => {
  clearPopup()

  if(param.SEQ == null) {
    popupTitle.value = '안전 간판 등록'

    imgDragDrop.value.setGuid()

    popupParams.FILE_ID = imgDragDrop.value.guid

    // console.log('openPopup popupParams', popupParams)
  } else {
    popupTitle.value = '안전 간판'
    popupTitle.value = popupTitle.value + (props.isDash ? ' 상세' : ' 수정')

    searchParams.CMPNY_DIV = param.CMPNY_DIV
    searchParams.SEQ = param.SEQ

    await searchData()
  }

  dialog.value = true
}

const setBtn = () => {
  if(popupParams.SEQ == '') {
    gridTitle.value.setBtnProperty('btnDelete', 'visible', false)
  } else {
    if(delYn.value || props.isDash) {
      gridTitle.value.setBtnProperty('btnUpdate', 'visible', false)
      gridTitle.value.setBtnProperty('btnDelete', 'visible', false)
    } else {
      gridTitle.value.setBtnProperty('btnUpdate', 'visible', true)
      gridTitle.value.setBtnProperty('btnDelete', 'visible', true)
    }
  }
}

const selectedLocation = (val) => {
  // console.log('selectedLocation val', val)
  
  popupParams.PLACE_L = val[0].COD
  popupParams.PLACE_M = val[1].COD
  popupParams.PLACE_S = val[2].COD

  popupParams.PLACE_L_NM = val[0].TXT
  popupParams.PLACE_M_NM = val[1].TXT
  popupParams.PLACE_S_NM = val[2].TXT
}

const locationPopupOpen = () => {
  locationPopup.value.openPopup('장소')
}

const openMap = () => {
  yardMapPopup.value.openPopup({
    LATITUDE: popupParams.LATITUDE,
    LONGITUDE: popupParams.LONGITUDE,
  })
}

const selectPoint = pt => {
  popupParams.LATITUDE = pt.LATITUDE
  popupParams.LONGITUDE = pt.LONGITUDE
}

const searchData = async () => {
  // console.log('searchParams', searchParams)

  await commonSearchApi({
    queryId: 'EDUGA0010_SEARCH_01',
    param: searchParams
  }).then(res => {
    // console.log('res.ORESULT_CUR', res.ORESULT_CUR)

    if(res.ORESULT_CUR.length > 0) {
      const data = res.ORESULT_CUR[0]

      Object.keys(popupParams).forEach(key => {
        popupParams[key] = data[key]
      })

      // console.log('searchData popupParams', popupParams)

      imgDragDrop.value.setGuid(popupParams.FILE_ID)
      imgDragDrop.value.searchImg()

      showBottom.value = true

      if(popupParams.DEL_YN === 'Y') {
        delYn.value = true
      } else {
        delYn.value = false
      }

      setBtn()
    }
  })
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnUpdate') {
    saveData()
  } else if(btnId === 'btnDelete') {
    deleteData()
  } else if(btnId === 'btnClose') {
    dialog.value = false
    emit('close', isSaved.value)
  }
}

const saveData = () => {
  if(popupParams.BD_TYPE === '') {
    Message.warn('구분을 선택해 주세요.')
    return
  }

  vm.$swal({
    title: t('저장 하시겠습니까?'),
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed) {
      const strQuery = popupParams.SEQ === '' ? 'EDUGA0010_SAVE_01' : 'EDUGA0010_SAVE_02'
      
      // console.log('strQuery', strQuery)
      // console.log('popupParams', popupParams)

      commonExecuteApi({ queryId: strQuery, list: [popupParams], }).then(res => {
        // console.log('res', res)

        if(strQuery === 'EDUGA0010_SAVE_01') {
          searchParams.SEQ = res.list[0].OUT_RES_SEQ
        }

        searchData()

        isSaved.value = true

        Message.success('저장 되었습니다.')
      })
    }
  })
}

const deleteData = () => {
  vm.$swal({
    title: t('삭제 하시겠습니까?'),
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed) {
      commonExecuteApi({ queryId: 'EDUGA0010_DELETE_01', list: [popupParams], }).then(res => {
        // console.log('res', res)

        searchData()

        Message.success('삭제 되었습니다.')
        isSaved.value = true

        onButtonsClick({ id: 'btnClose' })
      })
    }
  })
}

const updateInstallDt = () => {
  // console.log('updateInstallDt')

  vm.$swal({
    title: t('보수예정일을 자동계산 하시겠습니까?'),
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed) {
      const tempDt = dayjs(popupParams.INSTALL_DT).add(autoAddDt.value, 'year').format('YYYY-MM-DD')

      popupParams.FIX_PLAN_DT = tempDt
    }
  })
}

const closePage = pageName => {
  tagsStore.deleteVisitedView({ name: pageName })
  tagsStore.deleteCachedView({ name: pageName })
}

const goDetail = () => {
  dialog.value = false
  
  closePage('60_edu-EDU_G-EDUGA0010')

  router.push({
    path: '/60_edu/EDU_G/EDUGA0010',
    state: {
      rpEDUGA0020: {
        BD_CMPNY_DIV: popupParams.BD_CMPNY_DIV,
        BD_BSNS_CD: popupParams.BD_BSNS_CD,
        BD_TYPE: popupParams.BD_TYPE,
      }
    }
  })
}

onMounted(() => {
  popupInit()
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
    class="draggable-dialog"
    width="auto"
  >
    <div class="title-bar d-flex">
      <div>
        {{ popupTitle }}
      </div>
      <div v-show="props.isDash" class="link-detail pa-1" @click.stop="goDetail">
        <v-icon icon="mdi-open-in-new" />
      </div>
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle ref="gridTitle" :button-list="['btnUpdate', 'btnDelete', 'btnClose']" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <div class="d-flex mx-2" :class="popupParams.SEQ.length > 0 ? '' : 'mb-1'" >
            <div class="div-photo mr-4">
              <ImgDragDrop ref="imgDragDrop" :read-only="delYn||props.isDash" />
            </div>
            <div>
              <div class="d-flex">
                <i-select
                  top-label
                  :label="$t('회사')"
                  v-model="popupParams.BD_CMPNY_DIV"
                  :items="codeList.BD_CMPNY_DIV"
                  item-value="COD"
                  item-title="TXT"
                  width="190px"
                  :disabled="delYn||props.isDash"
                />
                <i-select
                  top-label
                  :label="$t('사업부')"
                  v-model="popupParams.BD_BSNS_CD"
                  :items="codeList.BD_BSNS_CD"
                  item-value="BSNS_CD"
                  item-title="BSNS_NM"
                  width="200px"
                  :disabled="delYn||props.isDash"
                />
                <i-select
                  top-label
                  :label="$t('구분')"
                  v-model="popupParams.BD_TYPE"
                  :items="codeList.BD_TYPE"
                  item-value="COD"
                  item-title="TXT"
                  width="150px"
                  :disabled="delYn||props.isDash"
                />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  :label="$t('사이즈')"
                  topLabel
                  width="190px"
                  v-model="popupParams.BD_SIZE"
                  :disabled="delYn||props.isDash"
                />
                <i-input
                  :label="$t('설치업체')"
                  topLabel
                  width="200px"
                  v-model="popupParams.INSTALL_COMP"
                  :disabled="delYn||props.isDash"
                />
                <i-input
                  :label="$t('설치일자')"
                  topLabel
                  width="150px"
                  margin="0"
                  v-model="popupParams.INSTALL_DT"
                  type="Date"
                  :disabled="delYn||props.isDash"
                  @update:model-value="updateInstallDt"
                />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  :label="$t('상세내용')"
                  topLabel
                  width="410px"
                  v-model="popupParams.REMARKS"
                  :disabled="delYn||props.isDash"
                />
                <i-input
                  :label="$t('보수예정일')"
                  topLabel
                  width="150px"
                  margin="0"
                  v-model="popupParams.FIX_PLAN_DT"
                  type="Date"
                  :nullMsg="false"
                  :disabled="delYn||props.isDash"
                />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  :label="$t('장소')"
                  topLabel
                  v-model="popupParams.PLACE_L_NM"
                  width="180px"
                  margin="5px"
                  readonly
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="locationPopupOpen"
                  :disabled="delYn||props.isDash"
                />
                <i-input
                  topLabel
                  v-model="popupParams.PLACE_M_NM"
                  width="190px"
                  margin="5px"
                  readonly
                  :disabled="delYn||props.isDash"
                />
                <i-input
                  topLabel
                  v-model="popupParams.PLACE_S_NM"
                  width="200px"
                  margin="0"
                  readonly
                  :disabled="delYn||props.isDash"
                />
              </div>
              <div class="d-flex mt-2">
                <i-input
                  :label="$t('상세장소')"
                  topLabel
                  width="320px"
                  margin="5px"
                  v-model="popupParams.PLACE_DETAIL"
                  :disabled="delYn||props.isDash"
                />
                <i-input
                  :label="$t('좌표')"
                  topLabel
                  v-model="COORDINATE"
                  width="255px"
                  margin="0"
                  readonly
                  clearable
                  append-inner-icon="mdi-magnify"
                  @click:appendInner="openMap"
                  :disabled="delYn||props.isDash"
                />
              </div>
            </div>
          </div>
          <div v-show="showBottom">
            <div class="div-line mt-4" />
            <div class="d-flex mt-3 mb-2 mx-2">
              <i-select
                top-label
                :label="$t('보수 결과')"
                v-model="popupParams.FIX_RESULT"
                :items="codeList.FIX_RESULT"
                item-value="COD"
                item-title="TXT"
                width="200px"
                :margin="popupParams.FIX_RESULT === 'C' ? '5px' : '20px'"
                :disabled="delYn||props.isDash"
              />
              <i-input
                v-show="popupParams.FIX_RESULT === 'C'"
                topLabel
                width="250px"
                v-model="popupParams.FIX_RESULT_REMARKS"
                :disabled="delYn||props.isDash"
              />
              <i-input
                :label="$t('알람기준일')"
                topLabel
                :nullMsg="false"
                width="150px"
                v-model="popupParams.ALARM_DT"
                type="Date"
                :disabled="delYn||props.isDash"
              />
              <div style="width: 125px">
                <div style="font-size: 14px;">
                  재 알림 예정일 설정
                </div>
                <div class="d-flex align-center">
                  <div style="width: 60px">
                    <i-number
                      v-model="popupParams.ALARM_PLAN"
                      :readonly="delYn||props.isDash"
                    />
                  </div>
                  <div class="ml-1">
                    개월 후
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>

    <LocationPopup ref="locationPopup" @selected="selectedLocation" />
    <YardMapPopup ref="yardMapPopup" @selectPoint="selectPoint" />
  </v-dialog>
</template>

<style lang="scss" scoped>
.div-photo {
  width: 225px;
}

.div-line {
  border-top: 1px solid #ccccdd;
}

.link-detail {
  position: absolute;
  top: 10px;
  left: 113px;
  cursor: pointer;
  border-radius: 50%;
}

.link-detail:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>