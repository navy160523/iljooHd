<script setup>
import { ref, reactive, getCurrentInstance, onMounted, defineEmits } from 'vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import Message from '@hiway/utils/notify'
import { isEmpty } from '@/@core/utils'

const emit = defineEmits([])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)

const tabs = {
  main: [
    { TAB: 'tab_1', COD: 'A', TXT: '건강행태' },
    { TAB: 'tab_2', COD: 'B', TXT: '보건의료서비스' },
    { TAB: 'tab_3', COD: 'C', TXT: '보건 자원 및 기타' },
    { TAB: 'tab_4', COD: 'D', TXT: '건강상태' },
    { TAB: 'tab_5', COD: 'E', TXT: '산업보건' },
  ],
  sub: [
    { TAB: 'tab01', COD: 'A01', TXT: '비만율' },
    { TAB: 'tab06', COD: 'A02', TXT: '운동실천율' },
    { TAB: 'tab05', COD: 'A03', TXT: '음주율' },
    { TAB: 'tab03', COD: 'A04', TXT: '현재 흡연율' },
    { TAB: 'tab02', COD: 'A05', TXT: '고강도 운동 실천율' },
    { TAB: 'tab04', COD: 'A06', TXT: '고위험 음주율' },

    { TAB: 'tab2_01', COD: 'B01', TXT: '건강진단실시율' },
    { TAB: 'tab2_02', COD: 'B02', TXT: '사후관리실시율' },
    { TAB: 'tab2_03', COD: 'B03', TXT: '직원당 의료시설 이용횟수' },
    { TAB: 'tab2_04', COD: 'B04', TXT: '협력사 건강관리위험대상자 비율' },
    { TAB: 'tab2_05', COD: 'B05', TXT: '협력사 건강관리위험대상자 개선 비율' },

    { TAB: 'tab3_01', COD: 'C01', TXT: '직원당 보호구 및 안전소모품 비용' },
    { TAB: 'tab3_02', COD: 'C02', TXT: '연령대별 직원 비율' },

    { TAB: 'tab4_01', COD: 'D01', TXT: '고혈압질환자 비율' },
    { TAB: 'tab4_02', COD: 'D02', TXT: '고혈압전단계 비율' },
    { TAB: 'tab4_03', COD: 'D03', TXT: '당뇨질환자 비율' },
    { TAB: 'tab4_04', COD: 'D04', TXT: '뇌심혈관계질환 고위험군 비율' },

    { TAB: 'tab5_01', COD: 'E01', TXT: '작업환경측정 초과율' },
    { TAB: 'tab5_02', COD: 'E02', TXT: '유해인자별 작업환경측정 초과율' },
    { TAB: 'tab5_03', COD: 'E03', TXT: '작업환경측정 노출기준 초과배수' },
    {
      TAB: 'tab5_04',
      COD: 'E04',
      TXT: '유해인자별 작업환경측정 노출기준 초과배수',
    },
    { TAB: 'tab5_05', COD: 'E05', TXT: '직업병 요관찰율' },
    { TAB: 'tab5_06', COD: 'E06', TXT: '질환계통별 직업병 요관찰율' },
    { TAB: 'tab5_07', COD: 'E07', TXT: '직업병 유소견율' },
    { TAB: 'tab5_08', COD: 'E08', TXT: '질환계통별 직업병 유소견율' },
    { TAB: 'tab5_09', COD: 'E09', TXT: '업무상 질병 발생율' },
    { TAB: 'tab5_10', COD: 'E10', TXT: '질환계통별 업무상 질병 발생율' },
  ],
}

const searchParams = reactive({})
const saveParams = reactive({})

const openPopup = (params) => {
  initSearchParams(params)
  initSaveParams()
  getData()
  dialog.value = true
}

const initSearchParams = (params) => {
  const param = {
    TAG1: tabs.main.find((el) => el.TAB === params.main).COD,
    TAG2: tabs.sub.find((el) => el.TAB === params.sub).COD,
  }

  Object.assign(searchParams, param)
}

const closePopup = () => {
  dialog.value = false
}

// 데이터 초기화
const initSaveParams = () => {
  if (Object.keys(saveParams).length > 0) {
    Object.keys(saveParams).forEach((key) => {
      delete saveParams[key]
    })
  }
  saveParams.NUMER = ''
  saveParams.DENOM = ''
  saveParams.DEF = ''
  saveParams.DESCR = ''
  saveParams.TERM = ''
}

// 조회
const getData = () => {
  new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
}
const searchData = () => commonSearchApi({ queryId: 'HLTCA0021_SEARCH_01', param: searchParams })
const afterSearch = async (res) => {
  if (res.ORESULT_CUR.length) {
    await Object.assign(saveParams, res.ORESULT_CUR[0])
  }
  isModified.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  }
}

// 수정 여부 확인
const isModified = ref(false)
watch(
  saveParams,
  () => {
    isModified.value = true
  },
  { deep: true }
)

// 저장
const beforeSave = () => {
  if (isEmpty(saveParams.NUMER)) {
    Message.warn(t('분자 데이터가 없습니다.'))
    return false
  }

  if (isEmpty(saveParams.DENOM)) {
    Message.warn(t('분모 데이터가 없습니다.'))
    return false
  }

  if (isEmpty(saveParams.DEF)) {
    Message.warn(t('지표정의 데이터가 없습니다.'))
    return false
  }

  if (isEmpty(saveParams.DESCR)) {
    Message.warn(t('지표설명 데이터가 없습니다.'))
    return false
  }

  if (isEmpty(saveParams.TERM)) {
    Message.warn(t('관련용어 데이터가 없습니다.'))
    return false
  }

  if (!isModified.value) {
    Message.warn(t('변경된 데이터가 없습니다.'))
    return false
  }

  Object.assign(saveParams, searchParams)
  return true
}
const saveData = () => {
  return commonSearchApi({ queryId: 'HLTCA0021_SAVE_01', param: saveParams })
}
const afterSave = () => {
  closePopup()
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
    width="700"
    height="auto"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    class="draggable-dialog"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>
        {{ tabs.main.find((el) => el.COD === searchParams.TAG1)?.TXT }}
        -
        {{ tabs.sub.find((el) => el.COD === searchParams.TAG2)?.TXT }}
      </span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <v-sheet>
          <IGridTitle ref="menuTitle" :button-list="['btnUpdate', 'btnClose']" @click-button="onButtonsClick" />
        </v-sheet>
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-container fluid class="searchArea pa-0">
          <VCol style="height: auto">
            <label class="i-label">산출식</label>
            <div class="px-2">
              <div class="mb-2">
                <i-input v-model="saveParams.NUMER" label-width="35px" width="100%" :label="$t('분자')" />
              </div>
              <div>
                <i-input v-model="saveParams.DENOM" label-width="35px" width="100%" :label="$t('분모')" />
              </div>
            </div>
          </VCol>
        </v-container>
        <v-container fluid class="searchArea pa-0">
          <VCol style="height: auto">
            <div class="mb-2">
              <label class="i-label">지표정의</label>
              <div class="px-2">
                <i-textarea v-model="saveParams.DEF" label-width="55px" width="100%" :row="1" />
              </div>
            </div>
            <div class="mb-2">
              <label class="i-label">지표설명</label>
              <div class="px-2">
                <i-textarea v-model="saveParams.DESCR" label-width="55px" width="100%" :row="3" />
              </div>
            </div>
            <div>
              <label class="i-label" required>관련용어</label>
              <div class="px-2">
                <i-textarea v-model="saveParams.TERM" label-width="55px" width="100%" :row="3" />
              </div>
            </div>
          </VCol>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss"></style>
