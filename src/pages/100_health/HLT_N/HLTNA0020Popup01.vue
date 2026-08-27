<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import _ from 'lodash'
import Message from '@hiway/utils/notify'

import LocationPopup from '@/components/popup/CommonCodePopUpSAF.vue'
import ImgDragDrop from '@/components/IUploadImageDragDrop.vue'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const dialog = ref(false)
const popupTitle = ref(null)
const gridTitle = ref(null)
const isSaved = ref(false)
const CRUD = ref(null)
const emit = defineEmits(['close'])
const locationPopup = ref(null)
const imgDragDrop = ref(null)
const updateYn = ref(true)

const initParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  ASGN_CD: userStore.asgnCd,
  EMP_NO: userStore.empNo,
  EMP_NM: userStore.empNm,
  CHECK_DATE: '',
  CHECK_DATE_ORG: '',
  CHECK_TIME: '',
  CHECK_TIME_ORG: '',
  LOC_L: '',
  LOC_L_NM: '',
  LOC_M: '',
  LOC_M_NM: '',
  LOC_S: '',
  LOC_S_NM: '',
  LOC_L_ORG: '',
  LOC_M_ORG: '',
  LOC_S_ORG: '',
  LOC_DETAIL: '',
  TEMP: '',
  HUMI: '',
  FEEL_TEMP: '',
  FILE_ID: '',
  ACTION_CD: [],
  ACTION_ETC: '',
})

const popupParams = reactive({})

const codeList = reactive({
  ACTION_CD: [],
})

const openPopup = param => {
  setPopup(param)
  dialog.value = true
}

const initPopup = () => {
  isSaved.value = false
  updateYn.value = true
  imgDragDrop.value.clearImg()
  gridTitle.value.disableBtn('btnUpdate', true)
  gridTitle.value.disableBtn('btnDelete', true)

  getCodeList('HHII830C').then(res => {
    codeList.ACTION_CD = res.ORESULT_CUR

    // console.log('codeList.ACTION_CD', codeList.ACTION_CD)
  })

  initParams.CHECK_DATE = dayjs().format('YYYY-MM-DD')
  initParams.CHECK_TIME = dayjs().format('HH:mm')

  Object.keys(initParams).forEach(key => {
    popupParams[key] = initParams[key]
  })

  // console.log('popupParams', popupParams)
}

const setPopup = data => {
  CRUD.value = data.CRUD
  initPopup()

  if(CRUD.value === 'I') {
    popupTitle.value = '체감온도 등록'
    imgDragDrop.value.setGuid()
    popupParams.FILE_ID = imgDragDrop.value.guid
    gridTitle.value.disableBtn('btnUpdate', false)
  } else {
    popupTitle.value = '체감온도 수정'

    popupParams.CMPNY_DIV = data.CMPNY_DIV
    popupParams.EMP_NO = data.EMP_NO
    popupParams.CHECK_DATE = data.CHECK_DATE
    popupParams.CHECK_TIME = data.CHECK_TIME
    popupParams.LOC_L = data.LOC_L
    popupParams.LOC_M = data.LOC_M
    popupParams.LOC_S = data.LOC_S

    searchData()
  }
}

const searchData = () => {
  commonSearchApi({ queryId: 'HLTNA0020_SEARCH_02', param: popupParams }).then(res => {
    const result = res.ORESULT_CUR

    if(result.length > 0) {
      Object.keys(popupParams).forEach(key => {
        if(key === 'ACTION_CD') {
          popupParams[key] = result[0][key].split(',')
        } else {
          popupParams[key] = result[0][key]
        }
      })

      imgDragDrop.value.setGuid(popupParams.FILE_ID)
      imgDragDrop.value.searchImg()

      if(popupParams.EMP_NO !== userStore.empNo) {
        updateYn.value = false
      }
    }

    gridTitle.value.disableBtn('btnUpdate', !updateYn.value)
    gridTitle.value.disableBtn('btnDelete', !updateYn.value)
  })
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnUpdate') {
    saveData()
  } else if(btnId === 'btnDelete') {
    deleteData()
  } else if(btnId === 'btnClose') {
    emit('close', isSaved.value)
    dialog.value = false
  }
}

const saveData = () => {
  if(popupParams.CHECK_TIME === '') {
    Message.warn('측정 시간을 입력해 주세요.')
    return
  } else if(popupParams.EMP_NO === '') {
    Message.warn('사번 정보를 가져오지 못했습니다.')
    return
  } else if(popupParams.LOC_L === '') {
    Message.warn('작업장을 선택해 주세요.')
    return
  } else if(popupParams.TEMP === '') {
    Message.warn('온도를 입력해 주세요.')
    return
  } else if(popupParams.HUMI === '') {
    Message.warn('습도를 입력해 주세요.')
    return
  } else if(popupParams.ACTION_CD.length < 1) {
    Message.warn('조치사항을 선택해 주세요.')
    return
  } else if(_.includes(popupParams.ACTION_CD, 'Z') && popupParams.ACTION_ETC === '') {
    Message.warn('기타 내용을 입력해 주세요.')
    return
  }

  vm.$swal({
    title: t('저장 하시겠습니까?'),
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed) {
      const strQuery = CRUD.value === 'I' ? 'HLTNA0020_INSERT_01' : 'HLTNA0020_UPDATE_01'
      const saveParams = {}

      Object.keys(popupParams).forEach(key => {
        if(key === 'ACTION_CD') {
          saveParams[key] = popupParams[key].join(',')
        } else {
          saveParams[key] = popupParams[key]
        }
      })
      
      // console.log('saveParams', saveParams)
      
      commonExecuteApi({ queryId: strQuery, list: [saveParams], }).then(res => {
        if(CRUD.value === 'I') {
          CRUD.value = 'U'
          popupTitle.value = '체감온도 수정'
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
      const deleteParams = {
        CMPNY_DIV: popupParams.CMPNY_DIV,
        EMP_NO: popupParams.EMP_NO,
        CHECK_DATE: popupParams.CHECK_DATE_ORG,
        CHECK_TIME: popupParams.CHECK_TIME_ORG,
        LOC_L: popupParams.LOC_L_ORG,
        LOC_M: popupParams.LOC_M_ORG,
        LOC_S: popupParams.LOC_S_ORG,
      }

      commonExecuteApi({ queryId: 'HLTNA0020_DELETE_01', list: [deleteParams], }).then(res => {
        imgDragDrop.value.delImg2()
        isSaved.value = true
        Message.success('삭제 되었습니다.')
        onButtonsClick({ id: 'btnClose' })
      })
    }
  })
}

const openLocationPopup = () => {
  locationPopup.value.openPopup('장소')
}

const clearLocation = () => {
  popupParams.LOC_L = ''
  popupParams.LOC_M = ''
  popupParams.LOC_S = ''
  popupParams.LOC_L_NM = ''
  popupParams.LOC_M_NM = ''
  popupParams.LOC_S_NM = ''
}

const selectedLocation = (val) => {
  popupParams.LOC_L = val[0].COD
  popupParams.LOC_M = val[1].COD
  popupParams.LOC_S = val[2].COD
  popupParams.LOC_L_NM = val[0].TXT
  popupParams.LOC_M_NM = val[1].TXT
  popupParams.LOC_S_NM = val[2].TXT
}

const updaetActionEtc = e => {
  if(!_.includes(popupParams.ACTION_CD, 'Z')) {
    popupParams.ACTION_ETC = ''
  }
}

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
    <div class="title-bar">
      {{ popupTitle }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle
          ref="gridTitle"
          :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 pt-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <div>
            <div class="d-flex">
              <i-input
                width="140px"
                top-label
                :label="$t('등록 일자')"
                type="date"
                v-model="popupParams.CHECK_DATE"
                :disabled="!updateYn"
              />
              <i-input
                width="120px"
                top-label
                :label="$t('측정 시간')"
                type="time"
                v-model="popupParams.CHECK_TIME"
                :disabled="!updateYn"
              />
              <i-input
                width="200px"
                top-label
                :label="$t('부서')"
                v-model="popupParams.DEPT_NM"
                disabled
              />
              <i-input
                width="135px"
                top-label
                :label="$t('성명')"
                v-model="popupParams.EMP_NM"
                disabled
              />
              <i-input
                width="135px"
                top-label
                :label="$t('사번')"
                v-model="popupParams.EMP_NO"
                margin="0"
                disabled
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="165px"
                top-label
                :label="$t('작업장')"
                v-model="popupParams.LOC_L_NM"
                append-inner-icon="mdi-magnify"
                @click:appendInner="openLocationPopup"
                readonly
                margin="5px"
                :disabled="!updateYn"
              >
                <template #append-inner>
                  <v-icon
                    icon="mdi-window-close"
                    @click="clearLocation"
                  />
                </template>
              </i-input>
              <i-input
                top-label
                width="160px"
                v-model="popupParams.LOC_M_NM"
                disabled
                margin="5px"
              />
              <i-input
                top-label
                width="165px"
                v-model="popupParams.LOC_S_NM"
                disabled
              />
              <i-input
                width="290px"
                top-label
                :label="$t('작업장 상세')"
                v-model="popupParams.LOC_DETAIL"
                margin="0"
                :disabled="!updateYn"
              />
            </div>
            <div class="d-flex mt-2">
              <v-sheet width="370px">
                <div class="d-flex">
                  <i-input
                    width="110px"
                    top-label
                    :label="$t('온도')"
                    type="number"
                    v-model="popupParams.TEMP"
                    :disabled="!updateYn"
                  />
                  <i-input
                    width="110px"
                    top-label
                    :label="$t('습도')"
                    type="number"
                    v-model="popupParams.HUMI"
                    :disabled="!updateYn"
                  />
                  <i-input
                    width="110px"
                    top-label
                    :label="$t('체감 온도')"
                    v-model="popupParams.FEEL_TEMP"
                    disabled
                  />
                </div>
                <div class="mt-2">
                  <div style="font-size: 14px; color: #222222;">
                    조치사항
                  </div>
                  <div>
                    <template v-if="codeList.ACTION_CD != undefined && codeList.ACTION_CD.length > 0">
                      <template v-for="rowIdx in (((codeList.ACTION_CD.length - 1) / 2).toFixed(0) * 1)" :key="`action_row${rowIdx}`">
                        <div class="d-flex" :class="[rowIdx > 1 ? 'mt-2' : 'mt-1']">
                          <v-checkbox
                            style="width: 150px;"
                            v-if="codeList.ACTION_CD.length >= rowIdx * 2 - 1"
                            v-model="popupParams.ACTION_CD"
                            :true-value="codeList.ACTION_CD[(rowIdx - 1) * 2].COD"
                            false-value=""
                            :label="codeList.ACTION_CD[(rowIdx - 1) * 2].TXT"
                            :disabled="!updateYn"
                          />
                          <v-checkbox
                            style="width: 150px;"
                            v-if="codeList.ACTION_CD.length >= rowIdx * 2"
                            class="ml-3"
                            v-model="popupParams.ACTION_CD"
                            :true-value="codeList.ACTION_CD[(rowIdx - 1) * 2 + 1].COD"
                            false-value=""
                            :label="codeList.ACTION_CD[(rowIdx - 1) * 2 + 1].TXT"
                            :disabled="!updateYn"
                          />
                        </div>
                      </template>
                      <div class="d-flex" :class="[codeList.ACTION_CD.length > 1 ? 'mt-1' : '']">
                        <v-checkbox
                          style="width: 60px;"
                          v-model="popupParams.ACTION_CD"
                          :true-value="codeList.ACTION_CD[codeList.ACTION_CD.length - 1].COD"
                          false-value=""
                          :label="codeList.ACTION_CD[codeList.ACTION_CD.length - 1].TXT"
                          @update:model-value="updaetActionEtc"
                          :disabled="!updateYn"
                        />
                        <i-input
                          width="305px"
                          class="ml-2"
                          v-model="popupParams.ACTION_ETC"
                          margin="0"
                          :disabled="!(popupParams.ACTION_CD != undefined && _.includes(popupParams.ACTION_CD, 'Z') && updateYn)"
                        />
                      </div>
                    </template>
                  </div>
                </div>
              </v-sheet>
              <v-sheet v-show="CRUD === 'U'" width="430px" class="ml-2">
                <div style="font-size: 14px; color: #222222;">
                  사진
                </div>
                <div style="width: 100%; height: 300px;">
                  <ImgDragDrop ref="imgDragDrop" :read-only="!updateYn" />
                </div>
              </v-sheet>
            </div>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>

    <LocationPopup ref="locationPopup" @selected="selectedLocation" />
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>