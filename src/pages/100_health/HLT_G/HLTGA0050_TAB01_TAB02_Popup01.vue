<!--
  화면명 : 부서/직무 특수검진 유해인자 산출 - 작업환경측정 결과 현황 - 측정 유해인자 상세목록
  화면개요 : 측정 유해인자 상/하반기 목록
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const dataList = ref([])

const codeList = reactive({
  HALF_DIV:[
    {TXT:'상반기',COD:'HI'},
    {TXT:'하반기',COD:'LO'}
  ]  
})



//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'YEAR', width: '20', dataType: 'text', styleName: 'right-column', header: { text: t('년도') }},
    { fieldName: 'HALF_DIV', width: '20', dataType: 'text', styleName: 'left-column', header: { text: t('반기')}
    ,editor: {
        type: 'dropdown',
      },
    lookupDisplay: true,    
    },
    { fieldName: 'CASNO', width: '60', dataType: 'text', styleName: 'left-column', header: { text: t('CASNO') }, },
    { fieldName: 'HARM_NM1', width: '80', dataType: 'text', styleName: 'left-column', header: { text: t('측정 유해인자') }, },
    { fieldName: 'HARM_NM2', width: '80', dataType: 'text', styleName: 'left-column', header: { text: t('특검 유해인자') }, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (searchParam) => {
  grdMain.value.getGridView().filterPanel.visible = true
  getData(searchParam)
  dialog.value = true
  grdMain.value.setBindingColumn('HALF_DIV', codeList.HALF_DIV, 'COD', 'TXT')
  
}

// 그리드 데이터 가져오기
const getData = (searchParam) => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData, searchParam)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = (searchParam) => {
  return commonSearchApi({ queryId: 'HLTGA0050_SEARCH_09', param: searchParam })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ********** 닫기 ********** */
const closePopup = () => { 
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
    width="1200"
    height="750"
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
      <span>유해인자 상세목록</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="closePopup"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 519px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
      <v-card-text class="pa-4 pt-0 content-area">
        ※ 상반기 조회시 -> 작년 상/하반기 조회<br/>
        ※ 하반기 조회시 -> 올해 상반기 조회
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
