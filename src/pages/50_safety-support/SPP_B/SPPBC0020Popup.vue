<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

defineOptions({
  name: 'SPPBC0020',
})

const emit = defineEmits(["selected"])

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const dialog = ref(false)
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)

//조회조건
let searchParams = reactive({  
  CMPNY_DIV : '',
  BSNS_CD : '',
  BUILDING_NAME : '',
  DONG_NAME : '',
})

const codeList = reactive({
  company: [],
  BSNS_CD: [],
  DEPT_CD: [],  
  BIZ_UNIT: [],
})

const openPopup = popupParam => {
  dialog.value = true

  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.BSNS_CD = popupParam.BSNS_CD
  searchParams.BUILDING_NAME = popupParam.BUILDING_NAME
  //searchParams.DONG_NAME = popupParam.DONG_NAME

  onButtonsClick({id: 'btnSearch'})
}

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    getCodeList('HHIOB_UNIT'), // 비지니스 단위 API
  ]).then(res => {
    codeList.company = res[0].ORESULT_CUR

    // 사업부
    codeList.bsnsCd = res[1].ORESULT_CUR

    // 전체 추가
    codeList.bsnsCd.unshift({ BSNS_CD : '', BSNS_NM: '전체' })
    codeList.BIZ_UNIT = res[2].ORESULT_CUR

    searchParams.COMP_CODE = res[0].ORESULT_CUR[0].COD
    
    // 사용자의 사업부 코드가 있으면 해당 코드로 바로 세팅
    if(userStore.bsnsCd != null)
      searchParams.BIZ_CODE = userStore.bsnsCd
    else
      searchParams.BIZ_CODE = res[1].ORESULT_CUR[0].BSNS_CD
    
    searchParams.BIZ_UNIT = res[2].ORESULT_CUR[0].COD
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false } },

  keys : ['CMPNY_DIV', 'BSNS_CD', 'BUILDING_NO'],
  fields : [ 
    { fieldName: 'BUILDING_NAME', dataType: 'text', width: '120', styleName: 'left-column', header: { text:'건물명' }, editable : false },
    { fieldName: 'PUMP_YN',       dataType: 'text', width: '25', styleName: 'center-column', header: { text:'수계' }, editable : false },    
    { fieldName: 'DONG_NAME',     dataType: 'text', width: '55', styleName: 'center-column editable_column', header: { text:'동명' } },
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV',          dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD',            dataType: 'text' , visible: false },
    { fieldName: 'BUILDING_NO',        dataType: 'text' , visible: false },
    { fieldName: 'BUILDING_NAME_MAIN', dataType: 'text' , visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields


/* ---------- enter 클릭 이벤트 추가 ---------- */
const onEnterClick = () => {
  new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  
}

//메뉴버튼
const onButtonsClick = btn => {

  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  }
  else if (btn.id === 'btnSelect') {
    onSelect()

  } 
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

/* ---------- 조회 ---------- */
const searchData = () => {
  // console.log('searchParam', searchParams)

  return commonSearchApi({ queryId : 'SPPBC0020_POP_SEARCH01', param: searchParams})
  
}

const afterSearch = res => {
  // console.log('afterSearch', res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ---------- 추가 ---------- */
const addData = () => {

  let rows = grdMain.value.getDataProvider().getRows()
  
  if (rows.length === 0) {
    if (isSearch === false) {
      Message.warn(t('데이터를 조회해주세요'))
    } else if (isSearch === true) {
      grdMain.value.addRow({
        CMPNY_DIV : userStore.cmpnyDiv,
        BSNS_CD : searchParams.BSNS_CD,
        BUILDING_NO : searchParams.ASGN_CD,
      })  
    }
  } else {
    grdMain.value.addRow({
      CMPNY_DIV : userStore.cmpnyDiv,
      BSNS_CD : searchParams.BSNS_CD,
      BUILDING_NO : searchParams.ASGN_CD,
    })
  }
}

const onSelect = () => {
  // 선택된 그리드의 로우 인덱스 반환
  // (DataRow : 정렬 순서가 바뀌어도 유지되는 고유 인덱스)
  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  // 그리드의 특정 행 반환 (인덱스를 넣어 특정 데이터 추출)
  var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  emit("selected", rtnData)
  onClose()
}

const beforeSave = () => {
  return true
}

const validationCheck = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      return true     
    }
  }
}

/* ---------- 저장 ---------- */
const saveData = () => {
  //console.log('save?', userStore.userId)
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId

    saveParams.push(data)
  }

  return commonExecuteApi({ queryId : 'SPPBC0020_SAVE01', list: saveParams })
}

//메뉴버튼 - 삭제
const deleteData = () => {
  let delParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // 추가버튼 클릭으로 생긴 셀 삭제
  let rowNum = grdMain.value.getGridView().getCheckedRows(true)

  for (let i in rowNum) {
    grdMain.value.getDataProvider().removeRow(rowNum[i])
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      delParams.push(data)
    }

    return commonExecuteApi({ queryId : 'SPPBC0020_DELETE01', list: delParams })
  }
}

/* ---------- 팝업 ---------- */

const onClose = () => {
  dialog.value = false
}

/* ---------------- 초기데이터 세팅 ---------------- */
onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <VDialog
    v-model="dialog"
    persistent
    width="500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">건물 검색</div>
    <VContainer style="background-color: white">
      <VRow>
        <VCol>
          <IGridTitle
            :use-permission="false"
            :button-list="['btnSearch', 'btnSelect', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm
            ref="searchArea"
            style="background-color: #fafafa"
            class="searchArea pa-0"
          >    
            <VRow>
              
              <VCol cols="12" md="6">
                <ILabel
                  :label="$t('건물명')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.BUILDING_NAME"
                      @keydown.enter="onEnterClick"
                    />
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="6">
                <ILabel
                  :label="$t('동명')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.DONG_NAME"
                    />
                  </template>
                </ILabel>
              </VCol>
            </VRow>        
          </VForm>
        </VCol>
      </VRow>
      <!-- /조회조건 -->
      
      <!-- 메인그리드 -->
      <VRow>
        <VCol>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 500px"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"            
            @onCellDblClicked="onSelect"
          />
        </VCol>
      </VRow>
      <!-- /메인그리드 -->
    </VContainer>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>