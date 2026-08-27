<!--
  화면명 : 보건위험성 보정
  화면개요 : 보건위험성 보정 > 직무별 직업병 요관찰/유소견 현황
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
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import HLTAB0010Tab02Popup02 from '@/pages/100_health/HLT_A/HLTAB0010Tab02_Popup02.vue'

const emit = defineEmits(['after-search'])
const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const hltab0010Tab02Popup02 = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  YEAR: '',
  SEQ: '',
  GBN_NO: '',
  PROCESS_CD: '',
  COMBO_LIST: {},
  STATUS: '',
  STATUS_DESC: '',
  NO_ADJUST:'',
  STATUS: '',
})

const codeList = reactive({
  GBN_NO: [
    { COD: 'A', TXT: '화학물질 노출'},
    { COD: 'B', TXT: '소음 노출'},
    { COD: 'C', TXT: '근골격계'}
  ],
  STATUS: [
    { COD: '0', TXT: '보정 필요', DESC: '공정별 위험성 보정이 필요합니다. "세부 보정"을 클릭해 주세요.'},
    { COD: '1', TXT: '보정 진행 중', DESC: '공정별 위험성 보정이 진행 중입니다. "세부 보정"을 클릭해 계속 진행해주세요. '},
    { COD: '2', TXT: '보정 완료', DESC: '공정별 위험성 보정이 완료되었습니다.'}
  ]
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'GBN_NO', width: '50', dataType: 'text', header: { text: t('위험 구분') }, lookupDisplay: true },
    { fieldName: 'PROCESS_NM', width: '60', styleName:'left-column', dataType: 'text', header: { text: t('공정명') }, },
    { fieldName: 'STATUS', width: '50', dataType: 'text', header: { text: t('보정 상태') }, },
    { fieldName: 'DIAGNOSIS_CD', width: '40', dataType: 'text', styleName: 'right-column', header: { text: t('직업병 \n유소견자 수'), styleName: 'multiline-editor-pre' }, },
    { fieldName: 'DISEASE_NM', width: '100', dataType: 'text', header: { text: t('주요 판정 소견') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<p style="text-align:left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value}</p>`
          return str
        },
      }
    },
    { fieldName: 'ADJUST_STATUS', width: '40', dataType: 'text', header: { text: t('보정 결과') }, },
    { fieldName: 'ADJUST_USER', width: '60', dataType: 'text', header: { text: t('보정자') },
      mergeRule: { criteria: 'value' },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<p style="text-align:center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${isEmpty(cell.value) ? ' ': cell.value.replaceAll('&lt;br&gt;', '<br>')}</p>`
          return str
        },
      }
    },
    
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (params) => { 
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.ASGN_CD = params.ASGN_CD
  searchParams.YEAR = params.YEAR 
  searchParams.SEQ = params.SEQ 
  searchParams.GBN_NO = params.GBN_NO
  searchParams.COMBO_LIST = params.COMBO_LIST
  searchParams.STATUS = params.STATUS
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.setBindingColumn('GBN_NO', codeList.GBN_NO, 'COD', 'TXT') 
  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnDetailAdjust') {
    hltab0010Tab02Popup02.value.openPopup(searchParams)
  }
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTAB0010_SEARCH_02', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  if(res.ORESULT_CUR2.length == 1) {
    let val = codeList.STATUS.find(item => item.COD == res.ORESULT_CUR2[0].STATUS)
    
    searchParams.STATUS = val.TXT
    searchParams.STATUS_DESC = val.DESC
    searchParams.NO_ADJUST = res.ORESULT_CUR2[0].NO_ADJUST + '명'
  }
}

// const onCellClicked = (grid, clickData) => { 
//   console.log(clickData)
//   if(clickData.cellType == 'data' && clickData.fieldName == 'PROCESS_NM') {
//     const rowData = grdMain.value.getRowData(clickData.dataRow)
//     hltab0010Tab02Popup02.value.openPopup({...rowData, COMBO_LIST: searchParams.COMBO_LIST })
//   }
// }

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
      <span>보건 위험성 보정</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t('직무별 직업병 요관찰/유소견 현황')"
          :button-list="['btnDetailAdjust' , 'btnClose']"
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
      <v-sheet class="ma-4 mt-0 pt-0 searchArea">
        <div class="d-flex mt-2">
          <i-input
            :label="$t('위험성 보정 진행상태')"
            width="350px" 
            label-width="150px"
            v-model="searchParams.STATUS"
            readonly
          ></i-input> 
          <i-input
            width="500px" 
            v-model="searchParams.STATUS_DESC"
            readonly
          ></i-input>
        </div>
        <i-input
          :label="$t('위험성 미보정 유소견자 수')"
          class="mt-2"
          width="350px" 
          label-width="150px"
          v-model="searchParams.NO_ADJUST"
          readonly
        ></i-input>
        <div class="mt-2"> 
          위험성 보정 기준 : 공정 내 직업병 유소견자 미발생 - 단계 유지 / 1명 이상 2명 이하 발생 - 위험성 +1 단계 / 3명 이상 발생 - 위험성 + 2단계
        </div>
      </v-sheet>
    </v-card>
    <HLTAB0010Tab02Popup02 ref="hltab0010Tab02Popup02" @after-search="getData"/>
  </v-dialog>
</template>
