<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from "dayjs"
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi } from "@hiway/api/commonApi"
import AsgnPopup from "@/pages/50_safety-support/SPP_E/AsgnPopup.vue"
import PdfViewPopup from "@/pages/50_safety-support/SPP_E/PdfViewPopup.vue"
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const asgnPopup = ref(null)
const empPopup = ref(null)
const rowIndex = ref(null)
 
/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: '',
  IO_DIV: 'I',
  DATE_YN: 'Y',
  ISS_DATE_FR: dayjs(new Date).startOf('M').format('YYYY-MM-DD'),
  ISS_DATE_TO: dayjs(new Date).format('YYYY-MM-DD'),
  EMP_NO: '',
  EMP_NM: '',
  BIKE_NO: '',
  ERASE: 'Y',
})

const saveParams = ref([])

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_List: [],      // 회사구분
  BSNSList: [],        // 사업부
  DEPTList: [{ ASGN_SHRT_NM:'전체', DEPT_CD: '' }],      // 부서
  IO_DIVList: [                                      // 소속구분
    { label: '직영/사내협력사', value: 'I' }, 
    { label: '상주/사외협력사', value: 'O' }, 
  ],
  USE_DIVList: [
    { label: '개인', value: 'P' }, 
    { label: '업무용', value: 'B' }, 
  ],
  ERASE_DIVList: [
    { label: '퇴사', value: 'A' }, 
    { label: '누적위반', value: 'B' }, 
    { label: '중대위반', value: 'C' }, 
    { label: '삭제', value: 'D' }, 
  ]
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }},
  keys : [],
  fields : [ 
    { fieldName: 'USE_DIV', dataType: 'text', header: { text: t('용도구분') },lookupDisplay: true, lookupData: codeList.USE_DIVList, 
      styleName: 'editable_column', editor: { type: 'dropdown', textReadOnly: true, domainOnly: true, dropDownWhenClick:true }},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') },styleName: 'editable_column',
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let result = ""

          result = `<div class="d-flex justify-space-between">
            <div class="h-auto">
              ${cell.value ? cell.value : '' }
            </div>
            <div>
              <span class="mdi mdi-magnify cursor-pointer"></span>
            </div>
          </div>`

          return result
        },
      },  
    },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width: '300',styleName: 'editable_column', editable: false,
      // renderer: {
      //   type: "html",
      //   callback: function (grid, cell, w, h) {
      //     let result = ""

      //     result = `<div class="d-flex justify-space-between">
      //       <div class="h-auto">
      //         ${cell.value ? cell.value : '' }
      //       </div>
      //       <div>
      //         <span class="mdi mdi-magnify cursor-pointer"></span>
      //       </div>
      //     </div>`

      //     return result
      //   },
      // },  
    },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') },styleName: 'editable_column'},
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내전화')},styleName: 'editable_column left-column'},
    { fieldName: 'HP_NO', dataType: 'text', header: { text: t('휴대전화')},styleName: 'editable_column left-column'},
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육이수일')},styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true}}},
    { fieldName: 'ISS_DATE', dataType: 'text', header: { text: t('발급일')},styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true}}},
    { fieldName: 'BIKE_NO', dataType: 'text', header: { text: t('오토바이번호')},styleName: 'editable_column',editor: { maxLength: 30 } },
    { fieldName: 'CAPA', dataType: 'text', header: { text: t('배기량')},styleName: 'editable_column',
      editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 4 }},
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, visible: false },
    { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('협력사명') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('근무형태') }, visible: false },
    { fieldName: 'OUTVEND_YN', dataType: 'text', header: { text: t('OUTVEND_YN') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

let fields2 = reactive([
  { fieldName: 'USE_DIV', dataType: 'text', header: { text: t('용도구분') },lookupDisplay: true, lookupData: codeList.USE_DIVList, 
    styleName: 'editable_column', editor: { type: 'dropdown', textReadOnly: true, domainOnly: true, dropDownWhenClick:true }},
  { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width: '300',styleName: 'editable_column', editable: false,
    renderer: {
      type: "html",
      callback: function (grid, cell, w, h) {
        let result = ""

        result = `<div class="d-flex justify-space-between">
          <div class="h-auto">
            ${cell.value ? cell.value : '' }
          </div>
          <div>
            <span class="mdi mdi-magnify cursor-pointer"></span>
          </div>
        </div>`

        return result
      },
    },  
  },
  { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') },styleName: 'editable_column'},
  { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내전화')},styleName: 'editable_column left-column'},
  { fieldName: 'HP_NO', dataType: 'text', header: { text: t('휴대전화')},styleName: 'editable_column left-column'},
  { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('교육이수일')},styleName: 'editable_column',
    editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true}}},
  { fieldName: 'ISS_DATE', dataType: 'text', header: { text: t('발급일')},styleName: 'editable_column',
    editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true}}},
  { fieldName: 'BIKE_NO', dataType: 'text', header: { text: t('오토바이번호')},styleName: 'editable_column',
    editor: { maxLength: 30 } },
  { fieldName: 'CAPA', dataType: 'text', header: { text: t('배기량')},styleName: 'editable_column',
    editor: { ignoreCharacters: "ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}", maxLength: 4 } },
  
  { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
  { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
  { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD') }, visible: false },
  { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('협력사명') }, visible: false },
  { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
  { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('근무형태') }, visible: false },
  { fieldName: 'OUTVEND_YN', dataType: 'text', header: { text: t('OUTVEND_YN') }, visible: false }
])

const setGrid = e => {
  grdMain.value.getDataProvider().setRows([])
  if(e === 'I'){
    grdMain.value.getDataProvider().setFields(grdMainProps.fields)
    grdMain.value.getGridView().setColumns(grdMainProps.fields)
  }else {
    grdMain.value.getDataProvider().setFields(fields2)
    grdMain.value.getGridView().setColumns(fields2)
  }

}

const onButtonsClick = async btn => {
  if(btn.id === 'btnUpdate'){
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(afterSave)
      .setAfter(logSave)
      .run()
  }else if(btn.id === 'btnCreate'){
    addRowData()
  }else if(btn.id === 'btnDelete'){
    removeRow()
  }else if(btn.id === 'btnReset') {
    grdMain.value.getDataProvider().setRows([])
  }
}

const beforeSave = async () => {
  saveParams.value = []
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  } else {
    chekedRow.forEach(async e => {
      let data = await grdMain.value.getDataProvider().getJsonRow(e)
      data.EDU_DATE = dayjs(data.EDU_DATE).format('YYYYMMDD')
      data.IN_ISS_DATE = dayjs(data.IN_ISS_DATE).format('YYYYMMDD')

      saveParams.value.push(data)
    })
    return true
  }
}

const afterSave = async () => {
  return commonExecuteApi({ queryId : 'SPPEA0010_TAB03_SAVE_01', list: saveParams.value })
}

const logSave = () => {
  let afterparams = {
    userStore: userStore,
    params: saveParams.value,
    mgs: '[오토바이강제등록] 화면 - 저장 시, 개인정보관련 저장했습니다.',
    crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', //사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }

  // 로그기록 
  commonLogExecuteApi(afterparams)
}

//로우 추가
const addRowData = () => {
  let newRow = {
    USE_DIV: 'P',
    OUTVEND_YN: 'Y',
    IO_DIV: searchParams.IO_DIV === 'O' ? 'C' : 'A',
    EDU_DATE: dayjs(new Date).format('YYYY-MM-DD'),
    ISS_DATE: dayjs(new Date).format('YYYY-MM-DD'),
    CMPNY_DIV: userStore.cmpnyDiv,
    OUTVEND_YN: 'N',
  }
  grdMain.value.addRow(newRow)
}

//로우 삭제
const removeRow = async () => {
  let checkRows = grdMain.value.getGridView().getCheckedRows()
  grdMain.value.getDataProvider().removeRows(checkRows)
}

const onEditRowChanged = async (grid, itemIndex, dataRow, field, oldValue, newValue) => {
  if(field === 1){
    grid.commit()
    let rowData = await grdMain.value.getDataProvider().getJsonRow(dataRow)
    rowIndex.value = dataRow
    rowData.EMP_NO = await rowData.EMP_NO.toUpperCase()

    empPopup.value.openPopup(rowData)
  }
}

const popupOpen = async (grid, index, clickData) => {
  if(clickData.target.nodeName === 'SPAN' && index.fieldName === 'EMP_NO'){
    let data = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    rowIndex.value = clickData.dataRow
    data.EMP_NO = await data.EMP_NO ? data.EMP_NO.toUpperCase() : data.EMP_NO
    data.readonly = true
    empPopup.value.openPopup(data)
  }else {
    if(clickData.target.nodeName === 'SPAN'){
      rowIndex.value = clickData.dataRow
      asgnPopup.value.openPopup({})
    }
  }
}

const onEmpSelected = val => {
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'CMPNY_DIV', val.CMPNY_DIV)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'BSNS_CD', val.BSNS_CD)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'DEPT_CD', val.DEPT_CD)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'ASGN_CD', val.ASGN_CD)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'ASGN_NM', val.ASGN_NM)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'EMP_NO', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'EMP_NM', val.EMP_NM)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'TEL_NO', val.TEL_NO)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'HP_NO', val.HND_PHN)
}

const onDeptSelected = val => {
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'ASGN_CD', val.ASGN_CD)
  grdMain.value.getDataProvider().setValue(rowIndex.value, 'ASGN_NM', val.ASGN_FULL_NM)
}

onMounted(() => {
  
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <IGridTitle
      ref="menuTitle"
      :button-list="['btnCreate', 'btnUpdate', 'btnDelete' , 'btnReset']"
      @click-button="onButtonsClick"
    />
    <v-sheet class="searchArea flex-column">
      <div class="d-flex">
        <i-select 
          :label="$t('소속구분')"
          label-width="60px"
          width="300px"
          :items="codeList.IO_DIVList"
          item-title="label"
          item-value="value"
          v-model="searchParams.IO_DIV"
          @update:modelValue="setGrid"
        />
      </div>
    </v-sheet>
    <v-sheet class="pa-0 h-auto">
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :keys="grdMainProps.keys" 
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        @onEditRowChanged="onEditRowChanged"
        @onCellItemClicked="popupOpen"
      />
    </v-sheet>

    <!-- 인원조회팝업 -->
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />

    <!-- 부서/ 협력사 팝업 -->
    <AsgnPopup ref="asgnPopup" @selected="onDeptSelected" />

    <!-- PDF VIEW 팝업 -->
    <PdfViewPopup ref="pdfViewPopup" />
  </div>
</template>
<style scoped lang="scss">
</style>
