<!--
  화면명 : 사용팀 변경
  화면개요 : 어떤 팀에 배정할 지 결정하는 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import dayjs from 'dayjs'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

/* 복사 조건 */
const searchParams = reactive({
  CMPNY_DIV: '',
  SAUPBU: '',
  DEPT_CD: '',
  DEPT_NM: '',
  TEAM_CD: '',
  TYPE_ID: '',
  MSDS_NM: '',
  MATNO: '',
  VNDCOD: '',
  VNDNME: '',
  RECDATE: '',
  EXPENSE: '',
  REMARK: '',
  MATDSC: '',
  TEL: '',
  EDT_STUS: ''
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'TEAM_CD', width: '30', dataType: 'text', header: { text: t('팀코드') }, },
    { fieldName: 'ASGN_SHRT_NM', width: '60', dataType: 'text', editable: false, header: { text: t('팀') }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 오픈 시 실행
const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.SAUPBU = param.SAUPBU
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.DEPT_NM = param.DEPT_NM
  searchParams.TEAM_CD = param.TEAM_CD
  searchParams.MATNO = param.MATNO
  searchParams.MATDSC = param.MATDSC
  searchParams.MSDS_NM = param.MSDS_NM
  searchParams.VNDCOD = param.VNDCOD
  searchParams.VNDNME = param.VNDNME
  searchParams.RECDATE = dayjs(param.RECDATE).format('YYYY-MM-DD')
  searchParams.EXPENSE = param.EXPENSE
  searchParams.REMARK = param.REMARK
  searchParams.TEL = param.TEL
  searchParams.EDT_STUS = param.EDT_STUS

  Promise.all([
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_09', param: searchParams }),
  ]).then((res) => {
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
    for(let i = 0; i < res[0].ORESULT_CUR.length; i++) {
      if(res[0].ORESULT_CUR[i].YN == 'Y') {
        grdMain.value.getGridView().checkRow(i, true, false, false)
      }
    }
  })
  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
    .setConfirmMessage('저장 하시겠습니까?')
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSaveData)
    .run()    
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if(isEmpty(checkedRows)) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  searchParams.TEAM_CD = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    searchParams.TEAM_CD += data.TEAM_CD + ','
  }

  searchParams.TEAM_CD = searchParams.TEAM_CD.slice(0, -1)
  return commonExecuteApi({ queryId : 'HLTDA0020_SAVE_06', list: [searchParams] })
} 

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}


/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
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
    width="500"
    height="600"
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
      <span>사용팀 변경</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4">
        <IGridTitle
          ref="menuTitle"
          :title="$t('팀 목록')"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 350px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
