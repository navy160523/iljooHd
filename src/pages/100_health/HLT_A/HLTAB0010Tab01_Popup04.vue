<!--
  화면명 : 보건위험성 평가 유소견 명단
  화면개요 : 보건위험성 평가 유소견 명단
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
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const dialog = ref(null)
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  VEND_CD: '',
  YEAR: '',
  USER_DIV: 'A',
})

const codeList = reactive({
  LANGUAGE: [
    {COD: 'KO', TXT: '한국어'},
    {COD: 'EN', TXT: '영어'},
  ],
  BSNS_CD: [],
  DEPT_CD: [],
  ASGN_CD: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '100',
      header: { text: t('사업부') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('부서/협력사명') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WORK_STANDARD_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('작업표준번호') },
    },
    {
      fieldName: 'WORK_STANDARD_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('작업표준명') },
    },
    {
      fieldName: 'GROUP_NO',
      dataType: 'text',
      width: '180',
      editable: false,
      header: { text: t('그룹작업 표준번호') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'GROUP_YN')
          if (value == 'Y') {
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
            <div style="white-space: pre-line;">${(cell.value ?? '').replaceAll(',', '\n')}</div>
           </div>
          `
          } else {
            return ''
          }
        },
      },
    },
    {
      fieldName: 'ES_DIV',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('조사구분') },
      lookupDisplay: true,
    },
    {
      fieldName: 'SAGO_EMP_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('대상자') },
    },
    {
      fieldName: 'SAGO_DUTY_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('직종') },
    },
    {
      fieldName: 'SAGO_BODY_CD',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('신체부위') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_STUS_EQP',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('설비') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_STUS_VOL',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('작업량') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_STUS_SPD',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('작업속도') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'WRK_STUS_INC',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('작업내용') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'HO_NO1',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위1') },
    },
    {
      fieldName: 'HO_NO2',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위2') },
    },
    {
      fieldName: 'HO_NO3',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위3') },
    },
    {
      fieldName: 'TOT_PNT_1',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위1') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },

    {
      fieldName: 'TOT_PNT_2',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위2') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'TOT_PNT_3',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('단위3') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'YES_SYMPTOM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('유증상') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        let ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          const iconSize = 15
          ret.style = { background: '#FFFFFF' }
          ret.renderer = {
            type: 'icon',
            iconLocation: 'right',
            iconCallback: function (grid, cell) {
              return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }

        return ret
      },
    },
    {
      fieldName: 'ES_STUS',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('진행단계') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    {
      fieldName: 'ES_EMP_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('조사자') },
      styleCallback: function (grid, dataCell) {
        let OMIT_YN = grid.getValue(dataCell.index.itemIndex, 'OMIT_YN')
        var ret = {}
        if (OMIT_YN === 'Y') {
          ret.style = { background: '#D3D3D3' }
        } else {
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },
    //안보이는 컬럼
    {
      fieldName: 'ES_SEQ',
      visible: false,
      header: { text: t('순번') },
    },
    {
      fieldName: 'WORK_STANDARD_ID',
      visible: false,
      header: { text: t('작업표준번호') },
    },
    {
      fieldName: 'WORK_STANDARD_REVISION',
      visible: false,
      header: { text: t('작업표준리비전번호') },
    },
    {
      fieldName: 'ES_DATE',
      visible: false,
      header: { text: t('조사일자') },
    },
    {
      fieldName: 'CLOSE_DATE',
      visible: false,
      header: { text: t('완료처리일') },
    },
    {
      fieldName: 'ES_STUS_COD',
      visible: false,
      header: { text: t('진행상태코드') },
    },
    {
      fieldName: 'IMP_RESIST_YN',
      visible: false,
      header: { text: t('개선등록여부') },
    },
    {
      fieldName: 'COMPANY_CD',
      visible: false,
      header: { text: t('회사코드') },
    },
    {
      fieldName: 'OMIT_YN',
      visible: false,
      header: { text: t('조사생략 여부') },
    },
    {
      fieldName: 'ES_DEPT_NM',
      visible: false,
      header: { text: t('소속부서') },
    },
    {
      fieldName: 'IMP_YN_B_FLAG_1',
      visible: false,
      header: { text: t('단위작업1 현행유지사유 등록여부') },
    },
    {
      fieldName: 'IMP_YN_B_FLAG_2',
      visible: false,
      header: { text: t('단위작업2 현행유지사유 등록여부') },
    },
    {
      fieldName: 'IMP_YN_B_FLAG_3',
      visible: false,
      header: { text: t('단위작업3 현행유지사유 등록여부') },
    },
    {
      fieldName: 'DEPT_NM',
      visible: false,
      header: { text: t('부서/협력사') },
    },
    {
      fieldName: 'SAGO_DUTY_CD',
      visible: false,
      header: { text: t('직종코드') },
    },
    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('기준년도') },
    },
    {
      fieldName: 'GROUP_YN',
      visible: false,
      header: { text: t('그룹핑여부') },
    },
  ],
  columns: [],
  columnLayout: [
    'BSNS_CD',
    'DEPT_CD',
    'WORK_STANDARD_NO',
    'WORK_STANDARD_NM',
    'GROUP_NO',
    {
      name: '조사개요',
      direction: 'horizontal',
      items: ['ES_DIV', 'SAGO_EMP_NM', 'SAGO_DUTY_NM', 'SAGO_BODY_CD'],
    },
    {
      name: '조사내용/개선',
      direction: 'horizontal',
      items: [
        {
          name: '작업 상황 변화',
          direction: 'horizontal',
          items: ['WRK_STUS_EQP', 'WRK_STUS_VOL', 'WRK_STUS_SPD', 'WRK_STUS_INC'],
        },
        {
          name: '부담작업',
          direction: 'horizontal',
          items: ['HO_NO1', 'HO_NO2', 'HO_NO3'],
        },
        {
          name: '빈도*강도',
          direction: 'horizontal',
          items: ['TOT_PNT_1', 'TOT_PNT_2', 'TOT_PNT_3'],
        },
        'YES_SYMPTOM',
        'ES_STUS',
        'ES_EMP_NM'
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (params) => {
  
  searchParams.CMPNY_DIV = params.CMPNY_DIV
  searchParams.BSNS_CD = params.BSNS_CD
  searchParams.DEPT_CD = params.DEPT_CD
  searchParams.VEND_CD = params.ASGN_CD
  searchParams.YEAR = params.YEAR
  if(isEmpty(params.ASGN_CD)) {
    searchParams.USER_DIV = 'A'
  } else {
    searchParams.USER_DIV = 'B'
  }
  Promise.all([
    // 사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'Y'} }),
    // 부서
    // 협력사
    commonSearchApi({ queryId: 'HLTAB0010_SEARCH_ASGN', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: '', ORGN_DIV: '', USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'A')
    codeList.ASGN_CD = res[1].ORESULT_CUR.filter(item => item.ORGN_DIV == 'B')
    onButtonsClick({ id: 'btnSearch' })
  })
  dialog.value = true
}

const closePopup = () => {
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnSearch') {
    getData()
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
  return commonSearchApi({ queryId: 'HLTIB0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
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
    width="1500"
    height="650"
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
      <span>근골격계부담작업 정보</span>
    </v-sheet>
    <v-card class="pa-0 rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-input 
              v-model="searchParams.YEAR"
              :label="$t('기준년도')" 
              label-width="50px" 
              width="200px"
              type="number"
              readonly
            />
            <i-select 
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')" 
              label-width="50px" 
              width="200px" 
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM" 
              readonly
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              label-width="50px"
              :items="codeList.DEPT_CD"
              :readonly="true"
              item-value="DEPT_CD"
              item-title="ASGN_NM" 
              width="200px"
            />
            <i-select
              v-model="searchParams.VEND_CD"
              :label="$t('협력사')"
              label-width="50px"
              :items="codeList.ASGN_CD"
              :readonly="true"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
              width="200px"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 350px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>
