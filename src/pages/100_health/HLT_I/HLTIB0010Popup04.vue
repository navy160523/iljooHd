<script setup>
import IMenuTitle from '@/components/IGridTitle.vue'
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WORK_STANDARD_ID: '',
  ES_SEQ: '',
  P2_QA0_C1: 'Y',
})

const codeList = reactive({
  ES_DIV: [], //조사구분
})

const openPopup = (rowData) => {
  dialog.value = true
  searchParam.WORK_STANDARD_ID = rowData.WORK_STANDARD_ID
  searchParam.ES_SEQ = rowData.ES_SEQ
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_07',
    param: searchParam,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const closePopup = () => {
  dialog.value = false
  grdMain.value.getDataProvider().setRows(null)
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서명/협력사명') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '45',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'DUTY_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('직무') },
    },
    {
      fieldName: 'AGE',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('연령(만)') },
    },
    {
      fieldName: 'SEX',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('성별') },
    },
    {
      fieldName: 'MRY_YN',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('결혼여부') },
    },
    {
      fieldName: 'WRK_DESC',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('현 작업내용') },
    },
    {
      fieldName: 'WRK_MNTH',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('작업기간(년-개월)') },
    },
    {
      fieldName: 'WRK_TM_HH',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('1일근무시간(HR)') },
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      visible: false,
    },
    {
      fieldName: 'ES_DATE',
      visible: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
    },
    {
      fieldName: 'ES_SEQ',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>유증상자목록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 650px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 300px;
  }
}
</style>
