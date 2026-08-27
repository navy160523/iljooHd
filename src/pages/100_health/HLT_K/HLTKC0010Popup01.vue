<!--
  화면명 : 대상자 추가
  화면개요 : 대상자 추가
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from "@hiway/utils/notify"
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const title = ref('  ')
const grdMain = ref(null)
const grdSub = ref(null)
const grdSub2 = ref(null)

const codeList = reactive({
  DEPT_CD: [],
  PROCESS_CD: [],
})
/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VEND_CD: '',
  EMP_NO: '',
  USER_TYPE: '',
  TYPE_DIV: '',
  EMP_NO: '',
  EMP_NM: '',
  CHK_A: 'N',
  CHK_B: 'N',
  CHK_C: 'N',
  CHK_Z: 'N',
  CHK_EXCEPT: 'N',
  POSTMANAGE_YN: 'N',
  MANAGE_ITEM: ''
})

//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'EMP_NO', width: '80', dataType: 'text', editable: false, header: { text: t('등록번호') } },
    { fieldName: 'EMP_NM', width: '80', dataType: 'text', editable: false, header: { text: t('성명') } },
    { fieldName: 'JOB_TIT_NM', width: '80', dataType: 'text', editable: false, header: { text: t('직위') } },
    { fieldName: 'BIRTH_DAY', width: '100', dataType: 'text', editable: false, header: { text: t('생년월일') } },
    { fieldName: 'AGE_INT', width: '80', dataType: 'text', editable: false, header: { text: t('나이(만)') },
      'styleCallback': function(grid, dataCell){
        if(grid.getValue(dataCell.index.itemIndex, 'AGE') >= 70) {
          return { style: { background:'#FF8989' } }
        } else if(grid.getValue(dataCell.index.itemIndex, 'AGE') >= 65) {
          return { style: { background:'#FFDC6D' } }
        } else {
          return { style: { background:'#FFFFFF' } }
        }
      }
    },
    { fieldName: 'CHK_A', width: '60', dataType: 'text', editable: false, header: { text: t('건강관리위험대상') } },
    { fieldName: 'CHK_B', width: '60', dataType: 'text', editable: false, header: { text: t('유소견/요관찰') } },
    { fieldName: 'CHK_C', width: '60', dataType: 'text', editable: false, header: { text: t('일반 고령자') } },
    { fieldName: 'CHK_Z', width: '60', dataType: 'text', editable: false, header: { text: t('기타') } },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사코드') }, visible : false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible : false },
    { fieldName: 'MANAGE_ITEM', dataType: 'text', header: { text: t('부서코드') }, visible : false },
    { fieldName: 'POSTMANAGE_YN', dataType: 'text', header: { text: t('부서코드') }, visible : false },
    { fieldName: 'USER_TYPE_COLOR', dataType: 'text', header: { text: t('행 배경색') }, visible : false },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') }, visible : false },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') }, visible : false },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columnLayout: [
    'EMP_NM',
    'JOB_TIT_NM',
    'BIRTH_DAY',
    'AGE_INT',
    {
          name: '구분',
          direction: 'horizontal',
          items: [ 'CHK_A', 'CHK_B', 'CHK_C', 'CHK_Z' ],
          header: { text: t('구분') },
    },
  ],
  columns : [],
})

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys: [],
  fields: [
    { fieldName: 'MANAGE_ITEM_NM', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('요관찰(C0/C1/C2)') }, editable: false },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'USER_TYPE', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'MANAGE_ITEM', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'CHK_YN', dataType: 'text', header: { text: t('반기구분') }, visible: false },
  ],
  columns: [],
})

//그리드 속성셋팅
const grdSub2Props = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: true } },
  keys: [],
  fields: [
    { fieldName: 'MANAGE_ITEM_NM', dataType: 'text', width: '60', styleName: 'left-column', header: { text: t('유소견(D0/D1/D2)') }, editable: false },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('저장여부') }, visible: false },
    { fieldName: 'USER_TYPE', dataType: 'text', header: { text: t('부서코드') }, visible: false },
    { fieldName: 'MANAGE_ITEM', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'CHK_YN', dataType: 'text', header: { text: t('반기구분') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields
grdSub2Props.columns = grdSub2Props.fields

const openPopup = (param) => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])

  grdMain.value.getGridView().filterPanel.visible = true
  grdSub.value.getGridView().filterPanel.visible = true
  grdSub2.value.getGridView().filterPanel.visible = true

  // searchParams.CMPNY_DIV = param.CMPNY_DIV
  if(!isEmpty(param)) {
    searchParams.VEND_CD = param.VEND_CD
    title.value = param.VEND_NAME
  } else {
    searchParams.VEND_CD = ''
    title.value = ' '
  }
  
  getMainData()
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {

    if(isEmpty(searchParams.EMP_NO)) {
      return Message.warn(t('저장할 인원을 선택하여 주십시오.'))
    }
    saveData()
  } else if (btn.id === "btnClose") {
    closePopup()
  } 
}

// 메인 데이터 조회
const getMainData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchMainData)
    .setAfter(afterMainSearch)
    .showMessage(true)
    .run()
}

//DB 조회
const searchMainData = () => { 
  return commonSearchApi({ queryId : 'HLTKC0010_SEARCH_02', param: searchParams })
}

//조회 후 반영
const afterMainSearch = res =>{
  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 행마다 색깔 바꾸기
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{ background: '#FFFFFF' } }
    if(!isEmpty(grid.getValue(item.index, 'USER_TYPE_COLOR'))) {
      ret.style = { background: grid.getValue(item.index, 'USER_TYPE_COLOR') }
    }
    return ret
  })
}

// 그리드 데이터 조회
const getSubData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchSubData)
    .setAfter(afterSubSearch)
    .showMessage(true)
    .run()
}

//DB 조회
const searchSubData = () => { 
  // searchParams.USER_TYPE = 'B'
  let param1 = _.cloneDeep(searchParams)
  let param2 = _.cloneDeep(searchParams)

  param1.TYPE_DIV = 'C'
  param2.TYPE_DIV = 'D'
  
  return Promise.all([
    // 화학물질 식별 조회
    commonSearchApi({ queryId: 'HLTKC0010_SEARCH_03', param: param1 }),
    // 화학물질 유해성 평가 조회
    commonSearchApi({ queryId: 'HLTKC0010_SEARCH_03', param: param2 }),
  ])
}

//조회 후 반영
const afterSubSearch = res =>{
  grdSub.value.getDataProvider().setRows([])
  grdSub2.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows(res[0].ORESULT_CUR)
  grdSub2.value.getDataProvider().setRows(res[1].ORESULT_CUR)

  //grdMain.value.getGridView().checkRow(grdMain.value.getGridView().getCurrent().dataRow, true, false, false)
  for(let i = 0; i < res[0].ORESULT_CUR.length; i++) {
    if(res[0].ORESULT_CUR[i].CHK_YN == 'Y') {
      grdSub.value.getGridView().checkRow(i, true, false, false)
    }

    if(res[1].ORESULT_CUR[i].CHK_YN == 'Y') {
      grdSub2.value.getGridView().checkRow(i, true, false, false)
    }
  }
}

/* ********** 저장 ********** */
const saveData = () => {
  commonExecuteApi({ queryId : 'HLTKC0010_SAVE_02', list: [searchParams] }).then(res => {
    let saveParams = []
    let saveParams2 = []
    let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

    for (let rowIdx of checkedRows) {
      let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
      saveParams.push(data)
    }
    checkedRows = grdSub2.value.getGridView().getCheckedRows(true)
    for (let rowIdx of checkedRows) {
      let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
      saveParams2.push(data)
    }

    Promise.all([
      // 화학물질 식별 조회
      commonExecuteApi({ queryId: 'HLTKC0010_SAVE_03', list: saveParams }),
      // 화학물질 유해성 평가 조회
      commonExecuteApi({ queryId: 'HLTKC0010_SAVE_03', list: saveParams2 }),
    ]).then(res => {
      Message.success('성공적으로 저장되었습니다.')
      getMainData()
    })
  })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  grdSub.value.getDataProvider().setRows([])
  grdSub2.value.getDataProvider().setRows([])

  searchParams.EMP_NO = ''
  searchParams.EMP_NM = ''
  searchParams.CHK_A = 'N'
  searchParams.CHK_B = 'N'
  searchParams.CHK_C = 'N'
  searchParams.CHK_Z = 'N'
  searchParams.MANAGE_ITEM = ''
  searchParams.POSTMANAGE_YN = 'N'

  dialog.value = false
}

// 셀 클릭 이벤트(이미지 변경)
const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === 'data') {
    searchParams.CHK_A = 'N'
    searchParams.CHK_B = 'N'
    searchParams.CHK_C = 'N'
    searchParams.CHK_Z = 'N'
    const rowData = grdMain.value.getDataProvider().getJsonRow(grdMain.value.getGridView().getCurrent().dataRow)
    
    searchParams.CHK_A = checkValue(rowData.CHK_A)
    searchParams.CHK_B = checkValue(rowData.CHK_B)
    searchParams.CHK_C = checkValue(rowData.CHK_C)
    searchParams.CHK_Z = checkValue(rowData.CHK_Z)
    
    searchParams.EMP_NO = rowData.EMP_NO
    searchParams.EMP_NM = rowData.EMP_NM
    searchParams.POSTMANAGE_YN = rowData.POSTMANAGE_YN
    searchParams.MANAGE_ITEM = rowData.MANAGE_ITEM

    grdSub.value.getDataProvider().setRows([])
    grdSub2.value.getDataProvider().setRows([])

    console.log(searchParams)
    if(searchParams.CHK_B == 'Y') {
      getSubData()
    }
  }
}

const checkValue = (value) => {
  if(isEmpty(value)) {
    return 'N'
  }
  return value == 'O' ? 'Y' : 'N'
}

const isNullSpace = (value) => {
  return isEmpty(value) ? ' ' : value
}

watch(() => searchParams.CHK_B, (newValue, oldValue) => {
  if(newValue === oldValue) return
  if(newValue == 'Y') {
    getSubData()
  } else {
    grdSub.value.getDataProvider().setRows([])
    grdSub2.value.getDataProvider().setRows([])
  }
})

watch(() => searchParams.CHK_Z, (newValue, oldValue) => {
  if(newValue === oldValue) return
  if(newValue !== 'Y') {
    searchParams.MANAGE_ITEM = ''
  } 
})

watch(() => [searchParams.CHK_A, searchParams.CHK_B, searchParams.CHK_C, searchParams.CHK_Z], (newValue, oldValue) => {
  searchParams.USER_TYPE = ''
  if(searchParams.CHK_A == 'Y') {
    searchParams.USER_TYPE += 'A'
  }
  if(searchParams.CHK_B == 'Y') {
    searchParams.USER_TYPE += 'B'
  }
  if(searchParams.CHK_C == 'Y') {
    searchParams.USER_TYPE += 'C'
  }
  if(searchParams.CHK_Z == 'Y') {
    searchParams.USER_TYPE += 'Z'
  }
})

defineExpose({
  openPopup
})

onMounted(() => {
  
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    height="905"
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
      <span>관리 대상자 추가</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t(isNullSpace(title))"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="height:750px;">
        <div class="h-grow">
          <v-sheet class="h-auto mr-2" width="50%">
            <RealGrid 
              ref="grdMain"
              style="height: 727px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
          <v-sheet class="h-auto mr-2" width="50%">
            <div class="searchArea">
              <div class="d-flex">
                <i-input
                  v-model="searchParams.EMP_NO"
                  label-width="50px"
                  :label="$t('등록번호')"
                  width="180px"
                  :readonly="true"
                />
                <i-input
                  v-model="searchParams.EMP_NM"
                  label-width="50px"
                  :label="$t('성명')"
                  width="180px"
                  :readonly="true"
                />
              </div>
              <div class="d-flex mt-2">
                <ILabel 
                  :label="$t('구분')"
                  class="pl-0"
                  label-width="50"
                />
                <VCheckbox
                  v-model="searchParams.CHK_A"
                  :label="$t('건강관리위험대상자')"
                  true-value="Y"
                  false-value="N"
                  class="mr-5"
                  :disabled="true"
                  :readonly="true"
                />
                <VCheckbox
                  v-model="searchParams.CHK_B"
                  :label="$t('유소견/요관찰')"
                  true-value="Y"
                  false-value="N"
                  class="mr-5"
                />
                <VCheckbox
                  v-model="searchParams.CHK_C"
                  :label="$t('일반고령자')"
                  true-value="Y"
                  false-value="N"
                  class="mr-5"
                />
                <VCheckbox
                  v-model="searchParams.CHK_Z"
                  :label="$t('기타')"
                  true-value="Y"
                  false-value="N"
                  class="mr-5"
                />
              </div>
              <div class="d-flex mt-2">
                <ILabel 
                  :label="$t('사후관리 제외')"
                  class="pl-0"
                />
                <VCheckbox
                  v-model="searchParams.POSTMANAGE_YN"
                  :label="$t('(체크 시 사후관리 현황 메뉴 목록에서 제외됩니다.)')"
                  true-value="Y"
                  false-value="N"
                  class="mr-5"
                />
              </div>
              <i-input
                v-model="searchParams.MANAGE_ITEM"
                label-width="100px"
                :label="$t('기타항목')"
                class="mt-2"
                width="500px"
                :readonly="searchParams.CHK_Z !== 'Y'"
              />
            </div>
            <IGridTitle
              ref="menuTitle"
              :title="$t('유소견/요관찰 항목 선택')"
            />
            <div class="d-flex">
              <v-sheet class="h-auto mr-2" width="50%">
                <RealGrid 
                  ref="grdSub"
                  style="height: 500px;"
                  :grid-view-option="grdSubProps.gridViewOption"
                  :keys="grdSubProps.keys"
                  :fields="grdSubProps.fields"
                  :columns="grdSubProps.columns"
                />
              </v-sheet>
              <v-sheet class="h-auto mr-2" width="50%">
                <RealGrid 
                  ref="grdSub2"
                  style="height: 500px;"
                  :grid-view-option="grdSub2Props.gridViewOption"
                  :keys="grdSub2Props.keys"
                  :fields="grdSub2Props.fields"
                  :columns="grdSub2Props.columns"
                />
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
