<!--
  화면명 : 작업환경측정 공정관리 반기 복사
  화면개요 : 특정 반기에 있는 공정을 복사한다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const visibleGubun = ref(false)
const title = ref('작업환경측정 반기 복사')

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [
    { COD: 'HI', TXT: '상반기' },
    { COD: 'LO', TXT: '하반기' },
  ],
  REG_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
})

// 어떤 쿼리를 돌릴 지 결정
const queryId = reactive({
  CONFIRM: '',
  SAVE: ''
})

/* 복사 조건 */
const searchParams = reactive({
  CMPNY_DIV: '',
  SRC_YEAR: String(dayjs().get('year') - 1),
  TAG_YEAR: String(dayjs().get('year')),
  SRC_HALF_DIV: 'HI',
  TAG_HALF_DIV: 'HI',
  SRC_REG_DIV: 'A',
  TAG_REG_DIV: 'A',
  BSNS_CD: '',
  DEPT_CD: ''
})

const openPopup = (param, confirmQuery, saveQuery) => {
  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }

  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.SRC_YEAR = param.YEAR - 1
  searchParams.TAG_YEAR = param.YEAR
  searchParams.SRC_HALF_DIV = param.HALF_DIV
  searchParams.TAG_HALF_DIV = param.HALF_DIV
  searchParams.BSNS_CD = param.BSNS_CD
  searchParams.DEPT_CD = param.DEPT_CD
  
  if(confirmQuery.includes('HLTFA0020') || confirmQuery.includes('HLTFB0010')) {
    visibleGubun.value = true
  }

  // 팝업 타이틀 변경
  if(confirmQuery === 'HLTFB0010_SEARCH_07') {
    title.value = '화학물질현황 복사'
  } else {
    title.value = '작업환경측정 반기 복사'
  } 

  queryId.CONFIRM = confirmQuery
  queryId.SAVE = saveQuery
  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnCopy') {
    Promise.all([
      commonSearchApi({
        queryId: queryId.CONFIRM,
        param: searchParams 
      }),
    ]).then((res) => {
      // 복사하려는 반기에 데이터가 없을 시 return
      if(res[0].ORESULT_CUR[0].CNT == 0) {
        Message.warn(t('해당 원본년도/반기에 데이터가 존재하지 않습니다. 복사가 불가능합니다.'))
        return
      }

      // 데이터가 있을 시 물어본다.
      if (res[0].ORESULT_CUR[1].CNT > 0) {
        new saveFlowHelper(vm, t)
          .setConfirmMessage('해당 대상년도/반기에 데이터가 존재합니다. 덮어쓰겠습니까?')
          .setQuery(saveData)
          .setAfter(afterSaveData)
          .run()
      } else {
        new saveFlowHelper(vm, t)
          .setQuery(saveData)
          .setAfter(afterSaveData)
          .run()
      }
    })
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ********** 저장 ********** */
const saveData = () => {
  return commonExecuteApi({ queryId : queryId.SAVE, list: [searchParams] })
}

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  visibleGubun.value = false
  dialog.value = false 
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
    height="400"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span> {{ title }}</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnCopy', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex mb-2">
            <i-select
              v-model="searchParams.SRC_YEAR"
              :label="$t('원본년도')"
              label-width="50px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <i-select
              v-model="searchParams.SRC_HALF_DIV"
              :label="$t('원본반기')"
              label-width="50px"
              :items="codeList.HALF_DIV"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <i-select
              v-if="visibleGubun"
              v-model="searchParams.SRC_REG_DIV"
              :label="$t('원본구분')"
              label-width="50px"
              :items="codeList.REG_DIV"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
          </div>
          <div class="d-flex">
            <i-select
              v-model="searchParams.TAG_YEAR"
              :label="$t('대상년도')"
              label-width="50px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT"
              width="200px"
            />
            <i-select
              v-model="searchParams.TAG_HALF_DIV"
              :label="$t('대상반기')"
              label-width="50px"
              :items="codeList.HALF_DIV"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <i-select
              v-if="visibleGubun"
              v-model="searchParams.TAG_REG_DIV"
              :label="$t('대상구분')"
              label-width="50px"
              :items="codeList.REG_DIV"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
          </div>
        </v-sheet>
      </div>
      
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
