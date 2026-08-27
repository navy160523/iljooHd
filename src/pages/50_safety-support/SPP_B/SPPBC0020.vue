<!-- 
  화면명   : 수신기 관리
  화면개요 : 특정 장소에 수신기 신규 등록 및 업데이트, 삭제
-->
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
import SPPBC0020Popup from './SPPBC0020Popup.vue'
import IUpload from '@/components/IUpload.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"

defineOptions({
  name: '50_safety-support-SPP_B-SPPBC0020',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

// 건물명 팝업
const rSPPBC0020Popup = ref(null)

// 업로드
const show = ref(false)
const fileUpload = ref(null)
let fileId = ref(null)

// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref(null)
// IN Parameters [ "PARAM1='AA'", "PARAM2='BB'"]
const params = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------

// 메인
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)

//조회조건
let searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BSNS_CD: '',
  BSNS_CD_OLD: '',
  BUILDING_NO : '',
  DONG_NAME : '',
  ASGN_CD: '',
  ASGN_NM: '',
  INPUT_1: '',
  INPUT_2: '',
})

// 조회조건 콤보박스
const codeList = reactive({
  company: [],
  BSNS_CD: [],
  DEPT_CD: [],  
  BIZ_UNIT: [],
})

// 그리드 콤보박스
const COMPList = ref([])

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사구분
    getCompanyList(),

    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }),

    // 비즈니스 단위 API
    getCodeList('HHIOB_UNIT'),

    // 수신기 종류 콤보박스
    commonSearchApi({ queryId : 'SPPBC0020_SEARCH03', param: { CMPNY_DIV: userStore.cmpnyDiv, COD: 'HHIK120' } }),
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
      searchParams.BSNS_CD = userStore.bsnsCd
    else
      searchParams.BSNS_CD = res[1].ORESULT_CUR[0].BSNS_CD
    
    searchParams.BIZ_UNIT = res[2].ORESULT_CUR[0].COD

    COMPList.value = res[3].ORESULT_CUR

    // 콤보박스 바인딩
    setBindCombo()

  }).catch(e => {
    console.log('PromiseAll Error : ', e)
  })
}

const setBindCombo = () => {
  grdMain.value.setBindingColumn(
    'KIND',
    COMPList.value,
    'COD',
    'TXT',
  )
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['CMPNY_DIV', 'BSNS_CD', 'BUILDING_NO'],
  fields : [ 
    { fieldName: 'RECEIVE_LOC', dataType: 'text', width: '100', styleName: 'left-column  editable_column', header: { text:'수신기위치' } },
    { fieldName: 'KIND',        dataType: 'text', width: '70',  styleName: 'left-column  editable_column', header: { text:'종류' }, lookupDisplay: true,
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'CIRCUIT',     dataType: 'text', width: '40',  styleName: 'right-column editable_column', header: { text:'총회로' } },
    { fieldName: 'DETAIL_LOC',  dataType: 'text', width: '120', styleName: 'left-column  editable_column', header: { text:'상세위치' } },
    { fieldName: 'MAKER',       dataType: 'text', width: '80',  styleName: 'left-column  editable_column', header: { text:'제조사' } },
    { fieldName: 'USE_CIRCUIT', dataType: 'text', width: '80',  styleName: 'left-column  editable_column', header: { text:'사용회로' } },
    { fieldName: 'AMP_LOC',     dataType: 'text', width: '50',  styleName: 'left-column  editable_column', header: { text:'AMP위치' } },
    { fieldName: 'AMP_MAKER',   dataType: 'text', width: '80',  styleName: 'left-column  editable_column', header: { text:'제조사' } },
    { fieldName: 'OUTPUT',      dataType: 'text', width: '80',  styleName: 'left-column  editable_column', header: { text:'출력' } },    
    { fieldName: 'FILE_INSERT_DATE', dataType: 'text', width: '110', styleName: 'center-column',  header: { text:'경계구역일람도' }, button: 'action', buttonVisibility: 'always',  editable : false },
    { fieldName: 'null', dataType: 'text', width: 'auto', styleName: 'center-column',  header: { text:' ' }, editable : false },
    
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV',   dataType: 'text' , visible: false },
    { fieldName: 'BSNS_CD',     dataType: 'text' , visible: false },
    { fieldName: 'BUILDING_NO', dataType: 'text' , visible: false },
    { fieldName: 'SEQ',         dataType: 'text' , visible: false },    
    { fieldName: 'ATTACH_KEY',  dataType: 'text' , visible: false },

  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = btn => {

  if (btn.id === 'btnSearch') {  // 조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnCreate') { // 추가

    console.log('BUILDING_NO', searchParams.BUILDING_NO)

    if(searchParams.BSNS_CD == '')
    {
      Message.warn('사업부를 선택하세요')
      
      return
    }

    if(searchParams.BUILDING_NO == undefined || searchParams.BUILDING_NO == '')
    {
      Message.warn('건물을 선택하세요')
      
      return
    }

    addData()
  } 
  else if (btn.id === 'btnUpdate') { // 저장
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {  // 삭제
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  // 출력
  else if(btn.id === 'btnPrint') {
    onOzPrint()
  }
}

/* ---------- 조회 ---------- */
const searchData = () => {

  //searchParams.CMPNY_DIV = 'HHI'
  //searchParams.BSNS_CD = 'AX00'

  console.log('searchParam =', searchParams)

  return commonSearchApi({ queryId : 'SPPBC0020_SEARCH01', param: searchParams })
  
  alert('조회')
}

const afterSearch = res => {
  console.log('afterSearch', res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ---------- 추가 ---------- */
const addData = () => {

  let rows = grdMain.value.getDataProvider().getRows()
  
  fileUpload.value.setGuid()

  let fid = fileUpload.value.guid

  console.log('guid', fid)
  
  grdMain.value.addRow({
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : searchParams.BSNS_CD,
    BUILDING_NO : searchParams.BUILDING_NO,
    ATTACH_KEY : fid,
  })  

  // if (rows.length === 0) 
  // {
  //   if (isSearch === false)     
  //     Message.warn(t('데이터를 조회해주세요'))
  
  //   else if (isSearch === true) 
  //   {
  //     grdMain.value.addRow({
  //       CMPNY_DIV : userStore.cmpnyDiv,
  //       BSNS_CD : searchParams.BSNS_CD,
  //       BUILDING_NO : searchParams.ASGN_CD,
  //     })  
  //   }

  // }
  // else {
  //   grdMain.value.addRow({
  //     CMPNY_DIV : userStore.cmpnyDiv,
  //     BSNS_CD : searchParams.BSNS_CD,
  //     BUILDING_NO : searchParams.ASGN_CD,
  //   })
  // }
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

  console.log('saveParams = ', saveParams)

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
//팝업 오픈
const openPopup = () => {
  console.log('p start')
  rSPPBC0020Popup.value.openPopup({
    CMPNY_DIV : userStore.cmpnyDiv,
    BSNS_CD : searchParams.BSNS_CD,
    BUILDING_NAME : searchParams.BUILDING_NAME,
    DONG_NAME : searchParams.DONG_NAME,   
  })
}

// 건물번호, 건물명, 동명 초기화
const clearSearchParams = () => {
  searchParams.BUILDING_NO   = ''
  searchParams.BUILDING_NAME = ''
  searchParams.DONG_NAME     = ''
}

// 그리드 초기화
const clearGrid = () => {
  grdMain.value.getDataProvider().setRows(null)
}

// 조회조건, 그리드 전체 초기화
const clearAll = async () => {

  let isGridChanged = false

  grdMain.value.getGridView().commit()

  if(grdMain.value.getDataProvider().getRowStateCount('*') > 0 ) {
    isGridChanged = true
  }

  if(isGridChanged)
  {
    let res = await vm.$swal({ 
      title: t("수정중인 데이터가 있습니다. 사업부를 변경하시겠습니까?"), 
      showCancelButton: true,
    })
    
    if (!res.isConfirmed) {
      searchParams.BSNS_CD = searchParams.BSNS_CD_OLD
      
      return false
    }
  }

  clearSearchParams()
  clearGrid()
}

// 건물명 팝업 종료
const closePopup = () => {
  show.value = false
}

// 건물명 팝업으로부터 데이터 리턴
const getData = param => {

  searchParams.BUILDING_NO   = param.BUILDING_NO
  searchParams.BUILDING_NAME = param.BUILDING_NAME
  searchParams.DONG_NAME     = param.DONG_NAME
}

const uploaded = param => {  
  console.log('uploaded = ', param)
}

// 출력 버튼 클릭시
const onOzPrint = () => {
  reportName.value = '/manage/hse/SPPBC0020.ozr'
  params.value = ['IN_CMPNY_DIV=' + userStore.cmpnyDiv,
                  'IN_BSNS_CD=' + searchParams.BSNS_CD,
                  'IN_BUILDING_NO=' + searchParams.BUILDING_NO]

  //console.log('pValue = ', params.value)

  showOz.value = true
}

// 그리드의 셀 버튼 클릭시
const btnTest = (grid, index, value) => {
  console.log('grid', grid)
  console.log('index', index)
  console.log('value', value)

  //const selectedRowData = this.$refs.realgrid.api.getSelectedCell(selectedRows[index], 'ATTACH_KEY').value
  //let selectedRowData = grdMain.value.getSelectedRows()

  let selectedRow = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

  //console.log('iRow = ', index.dataRow)
  //console.log('s3', selectedRow)

  fileId.value = selectedRow.ATTACH_KEY

  console.log('fileID = ', fileId)
  console.log('fileUpload = ', fileUpload)

  fileUpload.value.openPopup(fileId.value)

  // fileUpload.value.setGuid(fileId.value)


  // show.value = true
}

/* ---------------- 초기데이터 세팅 ---------------- */
onMounted(() => {
  initCodeList()
})

watch(() => searchParams.BSNS_CD,(newValue, oldvalue) => {
  console.log('newValue:', newValue)
  console.log('oldvalue:', oldvalue)

  searchParams.BSNS_CD_OLD = oldvalue
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        title="수신기 관리"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-select
              :label="$t('사업부')"
              label-width="60px"
              width="250px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              @update:modelValue="clearAll"
            />
            <i-input
              :label="$t('건물명')"
              label-width="60px"
              width="300px"
              v-model="searchParams.BUILDING_NAME"
              append-inner-icon="mdi-magnify"
              readonly
              clearable
              persistent-clear
              @keydown.enter=" e=> {
                openPopup()
              }"  
              @click:appendInner="openPopup"
              @click:clearable="clearSearchParams"
            />
            <i-input
              :label="$t('동명')"
              label-width="30px"
              width="300px"
              v-model="searchParams.DONG_NAME"
              readonly="true"
            />
          </div>
        </v-sheet>
        <v-sheet>
          <IGridTitle title="수신기 관리화면 조회 목록">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: calc(100vh - 300px);"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellButtonClicked="btnTest"
          />
        </v-sheet>
      </div>
      <div>
        <!-- 조회조건 팝업 -->
      <!-- 건물명 팝업 -->
      <SPPBC0020Popup ref="rSPPBC0020Popup" @selected="getData"/>
      <!-- 출력물 -->
      <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
      <!-- 파일 첨부 -->
      <IUploadPopup ref="fileUpload" :maxFileSize="2024" @uploaded="uploaded($event)" />
      <!-- <VDialog 
        v-model="show" 
        persistent
        class="draggable-dialog" 
        width="1250"
        @mousemove="handleDragging"
        @mouseup="stopDragging"
      >
        <div class="title-bar" @mousedown="startDragging">Preview</div>
        <VContainer
          class="pt-2 px-0"      
          style="background-color: white"
        >  
          <VRow no-gutters>
            <VCol>
              <IMenuTitle
                ref="menuTitle"
                :button-list="['btnClose']"
                style="padding: 0px 38px 0px 0px; height: 30px;"
                @click-button="closePopup"
              />
            </VCol>
          </VRow>        
          <VRow style="height:500px;" no-gutters>
            <VCol>
              <IUploadPopup ref="fileUpload" :maxFileSize="2024" @uploaded="uploaded($event)" />
            </VCol>
          </VRow>
        </VContainer>
      </VDialog> -->
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>

  /* ::v-deep .editable-cell {
    background-color: lightyellow;
  } */
</style>