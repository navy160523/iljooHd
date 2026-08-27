<!--
  화면명 : 개인별 장비자격 보유현황 관리
  화면개요 : 개인의 장비자격을 추가, 수정, 삭제할 수 있는 화면이다.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi, commonExecuteApi2 } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import EDUBA0010Pop01 from '@/pages/60_edu/EDU_B/EDUBA0010Pop01.vue'
import EDUAA0020Pop02 from '@/pages/60_edu/EDU_A/EDUAA0020Pop02.vue'
import _ from 'lodash'

defineOptions({
  name: '60_edu-EDU_B-EDUBA0020',
})

//***********************************세팅 영역**************************************************/
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const detailBtn =ref(null)
const searchArea = ref(null)
const eDUBA0010Pop01 = ref(null)
const eDUAA0020Pop02 = ref(null)
const firstLock = ref(0)
const grdMainRowIdx = ref(null)
const imageSrc =ref(null)
const grdMainData = ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv, //회사 구분
  BSNS_CD : '',                   //사업부
  DEPT_CD : '',                   //부서
  EMP_NO : '',                    //사번
  EMP_NM : '',                    //성명
  ALL_USER : 'N',                 //자격증 미소지자 포함
})

const userData = reactive({
  DEPT_NM : '',      //소속부서
  EMP_NM : '',       //성명
  EMP_NO : '',       //사번
  USER_DIV : '',     //소속구분
  JOB_TIT_NM : '',   //직위
  BIRTH_DAY : '',    //생년월일
  HLD_OFFI_GBN : '', //재직구분
})

//사내자격보유현황 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar : { visible:false } }, 
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', width:"50", header: { text: t('소속부서') }, editable:false },
    { fieldName: 'USER_DIV', dataType: 'text', width:"50", header: { text: t('소속구분') }, editable:false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width:"50", header: { text: t('직위') }, editable:false },
    { fieldName: 'EMP_NO', dataType: 'text', width:"50", header: { text: t('사번') }, editable:false },
    { fieldName: 'EMP_NM', dataType: 'text', width:"50", header: { text: t('성명') }, editable:false },

    //비활성화
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false, header: { text: t('회사구분') } },
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') }, editable:false, visible: false },
    { fieldName: 'BIRTH_DAY', dataType: 'text', width:"50", header: { text: t('생년월일') }, editable:false, visible: false },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', width:"50", header: { text: t('재직상태') }, editable:false, visible: false },
    { fieldName: 'EMP_NO_ENC', dataType: 'text', width:"50", header: { text: t('이미지URL') }, editable:false, visible: false },
  ],
  columns: [],
})


//자격종류별 보유자 현황
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } },
  fields : [ 
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') }, editable: false },
    { fieldName: 'LIC_GET_DT', dataType: 'text', header: { text: t('취득일자'), required: true, requiredMessage: '취득일자는 필수입니다.' }, 
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      styleName: 'editable_column', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null } },
    { fieldName: 'DT', dataType: 'text', header: { text: t('보수교육일') }, editable: false,
      'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null } },
    { fieldName: 'EDU_DEADLINE', dataType: 'text', header: { text: t('보수교육기한') }, editable: false,
    },
    { fieldName: 'LIC_STATUS', dataType: 'text', header: { text: t('자격상태') }, lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }, styleName: 'editable_column' },
    { fieldName: 'STATUS_EXP_DATE', dataType: 'text', header: { text: t('상태고정 만료일') },
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } },
      styleName: 'editable_column', 'displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null } },
    { fieldName: 'LICE_NO', dataType: 'text', header: { text: t('면허번호') }, editable: false },
    { fieldName: 'RMK', dataType: 'text', header: { text: t('비고') }, editor: { maxLength: 200 }, styleName: 'editable_column-left' },

    //비활성화
    { fieldName: 'LIC_KIND', dataType: 'text', header: { text: t('자격코드') }, visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') }, editable: false, visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, styleName:"left-column", editable: false, visible: false },
    { fieldName: 'CLIENT_IP', dataType: 'text', header: { text: t('CLIENT_IP') }, editable: false, visible: false },

  ],
  columns: [],
})

// 그리드 세팅

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const codeList = reactive({
  BSNS_CD : [],
  DEPT_CD : [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHIF340'),// 자격상태 공통 코드
  ]).then(res => {
    //사업부 데이터 세팅
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    //부서 데이터 세팅
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

    //자격 상태 컬럼 데이터 세팅
    res[2].ORESULT_CUR.unshift({ COD : '', TXT : '' })
    grdSub.value.setBindingColumn("LIC_STATUS", res[2].ORESULT_CUR, "COD", "TXT") 

  })
}

// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if(firstLock.value === 0){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
        searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
        firstLock.value = 1
      } else {
        searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      }
    }).finally(() => {
      gridRefresh()
      if(firstLock.value === 1){
        onButtonsClick({ id : 'btnSearch' })
        firstLock.value = 2
      }
    })


})


//***********************************세팅 영역(종료)**************************************************/

//*************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = btn => {    
  if(btn.id === 'btnSearch'){//조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

//자격정보 버튼 이벤트
const onDetailButtonsClick = btn => {
  if(btn.id === 'btnCreate'){//추가
    if(grdMainData.value){
      eDUAA0020Pop02.value.openPopup({
        CREATE_YN : 'Y',
        ROW_DATA : grdSub.value.getDataProvider().getRows(),
        LICE_TYPE : 'I',
      }) 
    } else {
    }

  }else if(btn.id === 'btnUpdate'){//저장
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }else if(btn.id === 'btnDelete'){//삭제
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub, row: 'check' }])
      .setGridList([grdSub])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => grdSubSearch())
      .run()
  }
}

//사업부 변경시 발생 이벤트
const changedBSNS_CD = () => {
  gridRefresh()
}

//부서 변경시 발생 이벤트
const changedDEPT_CD = () => {
  gridRefresh()
}

//사번 유효성 검사
const inputEMP_NO = () => {
  searchParams.EMP_NO = searchParams.EMP_NO.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/g, '')
}


//성명 유효성 검사
const inputEMP_NM = () => {
  searchParams.EMP_NM = searchParams.EMP_NM.replace(/[0-9a-zA-Z~!@#$%^&*()_+|<>?:{}]/g, '')
}

//장비자격 보유현황 그리드 로우 변경 시 발생 이벤트
//그룹 목록 로우 변경 이벤트
const rowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx === -1){
    return
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newIdx)
  userData.DEPT_NM = rowData.DEPT_NM
  userData.EMP_NM = rowData.EMP_NM
  userData.EMP_NO = rowData.EMP_NO
  userData.USER_DIV = rowData.USER_DIV
  userData.JOB_TIT_NM = rowData.JOB_TIT_NM
  userData.BIRTH_DAY =  rowData.BIRTH_DAY ? dayjs(rowData.BIRTH_DAY).format('YYYY-MM-DD') : null
  userData.HLD_OFFI_GBN = rowData.HLD_OFFI_GBN
  if(rowData.USER_DIV === '직영'){
    imageSrc.value = 'http://hihr.hhi.co.kr/EHR/PHOTO/searchPhoto_dec/searchPhoto_dec/?_params=[EMPLID='+ rowData.EMP_NO_ENC + ']'
  } else {
    imageSrc.value = "http://SCMS.HHIGROUP.KR/services/Common/LoadResources.aspx?EID=" + rowData.EMP_NO
  }
  grdMainRowIdx.value = newIdx
  grdMainData.value = rowData
  grdSubSearch()

}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMainData.value = ''
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
  grdSub.value.getGridView().setAllCheck(false)
  Object.keys(userData).forEach(key => {
    userData[key] = ''
  })
  imageSrc.value = ''
}

//자격상태 컬럼이 정지 또는 취소인 경우 더블클릭 시 실행되는 이벤트
const onCellDblClicked = (grid, clickData) => {
  let rowData = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
  if(rowData.LIC_STATUS == "S"){
    eDUBA0010Pop01.value.openPopup({
      ALM_TARGET : 'S',
    })
  } else if(rowData.LIC_STATUS == 'C'){
    eDUBA0010Pop01.value.openPopup({
      ALM_TARGET : 'C',
    })
  }
}

//자격상태에 따른 ROW 색상 변경 이벤트
const gridColorSetting = () => {
  grdSub.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    var ret = {}

    var LIC_STATUS = grid.getValue(item.index, "LIC_STATUS")
    if (LIC_STATUS == 'C') {                //취소
      ret.style = { background:"#A6A6A6" }
    } else if(LIC_STATUS === 'S'){          //정지
      ret.style = { background:"#F15F5F" }

    } else if(LIC_STATUS === 'Y'){          //교육기간임박
      ret.style = { background:"#FAED7D" }
    }

    return ret
  })
}

//자격증 미소지자 포함 체크 및 체크 해제 시 발생 이벤트
const ALL_USERChkYn = () => {
  gridRefresh()
}

//자격정보 추가 버튼 클릭 시 발생 이벤트
const onEDUAA0020Pop02Selected = row =>{
  let data = []
  grdSub.value.getDataProvider().getRows().forEach(val => {
    data.push(val[8])
  })
  row.forEach(item => {    
    item.LIC_KIND_NM = item.CERT_DIV_NM
    item.LIC_KIND = item.CERT_DIV 
  })
  row.forEach(item => {
    if(data.includes(item.LIC_KIND)){
      return
    }else {
      item.EMP_NO = grdMainData.value.EMP_NO
      item.CMPNY_DIV = userStore.cmpnyDiv
      grdSub.value.addRow(item)
    }



  })
}

//
const editChange = (grid, index, value) => {
  if(index.fieldName === 'LIC_STATUS'){
    document.addEventListener("keydown", e => {
      if(e.key === 'Backspace'){
        grdSub.value.getDataProvider().setValue(index.dataRow, 'LIC_STATUS', '')
      }
    })
    
  }
}

//*************************************이벤트 영역(종료)******************************************************/

//*****************************************조회 영역**************************************************************/
//장비자격 보유현황 조회 전 유효성 검사
const beforeSearch = () => {
  gridRefresh()

  return true
}

//장비자격 보유현황 리스트 조회
const searchData = () => {
  return commonSearchApi({ queryId : 'EDUBA0020_SEARCH_01', param: searchParams })
}


//장비자격 보유현황 리스트 조회 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let grdMainLength = grdMain.value.getDataProvider().getRows().length
  if(grdMainLength > 0){
    detailBtn.value.disableBtn('btnCreate', false)
  } else {
    detailBtn.value.disableBtn('btnCreate', true)
  }
}


//자격정보 조회
const grdSubSearch = () => {
  let subSearchParams = _.cloneDeep(searchParams)
  subSearchParams.EMP_NO = grdMainData.value.EMP_NO
  commonSearchApi({ queryId : 'EDUBA0020_SEARCH_02', param: subSearchParams }).then(res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    gridColorSetting()
  })
}

//*****************************************조회 영역(종료)***********************************************************/
//********************************************저장 영역**************************************************************/
//자격정보 저장 전 유효성 검사
const beforeSave = () => {
  let result = true
  let saveData = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  for(let i = 0; i < checkedRows.length; i++){
    saveData.push(grdSub.value.getDataProvider().getJsonRow(checkedRows[i]))
    if(isNullCheck(saveData[i].LIC_GET_DT)){
      saveData[i].LIC_GET_DT = null
      Message.warn(t('취득일자는 필수입니다.'))
      result = false
    }
  }
  if(checkedRows.length === 0){
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    result = false
  }

  return result
}


//자격정보 저장
const saveData = () => {
  let saveParams = []
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++){
    saveParams.push(grdSub.value.getDataProvider().getJsonRow(checkedRows[i]))
    saveParams[i].CMPNY_DIV = userStore.cmpnyDiv
    saveParams[i].EMP_NO = grdMainData.value.EMP_NO
    if(!isNullCheck(saveParams[i].LIC_GET_DT)){
      saveParams[i].LIC_GET_DT = dayjs(saveParams[i].LIC_GET_DT).format('YYYYMMDD')
    }
    if(!isNullCheck(saveParams[i].STATUS_EXP_DATE)){
      saveParams[i].STATUS_EXP_DATE = dayjs(saveParams[i].STATUS_EXP_DATE).format('YYYYMMDD')
    }
  }
  console.log("저장될 데이터 파람",saveParams)
  return commonExecuteApi({ queryId : 'EDUBA0020_SAVE_01', list: saveParams })
}

//자격정보 저장 후
const afterSave = () => {
  grdSub.value.getGridView().setAllCheck(false)
  grdSubSearch()
}

const isNullCheck = data => {

  return (data === undefined || data === null || data === '') ? true : false
}

//*****************************************저장 영역(종료)***********************************************************/
//********************************************삭제 영역*************************************************************//
//자격정보 삭제 전 유효성 검사
const beforeDelete = () => {
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)
  if(checkedRows.length === 0){
    Message.warn(t('삭제할 데이터를 선택해 주세요.'))

    return false
  }
  
  return true
}

//자격정보 삭제
const deleteData = () => {
  let checkedRowIndex = grdSub.value.getGridView().getCheckedRows()
  var deleteParams =[]
  for(let i = 0; i < checkedRowIndex.length; i++){
    deleteParams.push(grdSub.value.getDataProvider().getJsonRow(checkedRowIndex[i]))
    deleteParams[i].CLIENT_IP = userStore.clientIp
    deleteParams[i].USER_ID = userStore.userId
  }

  return commonExecuteApi({ queryId : 'EDUBA0020_DELETE_01', list: deleteParams })
}

//*****************************************삭제 영역(종료)***********************************************************/

onMounted( () => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
      <!-- 타이틀 -->        
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t(useLogsStore().menuId)"
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
      <!-- 조회조건 -->
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              :label="$t('사업부')"
              width=300px
              labelWidth="39px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.bsnsCd"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              @update:model-value="changedBSNS_CD"
            />
            <i-select
              :label="$t('부서')"
              width=300px
              labelWidth="26px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.deptCd"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              @update:model-value="changedDEPT_CD"
            />
            <i-input
              :label="$t('사번')"
              width=200px
              labelWidth="26px"
              v-model="searchParams.EMP_NO"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/, '');"
              maxlength="20"
              @input="inputEMP_NO"
            />
            <i-input
              :label="$t('성명')"
              width=200px
              labelWidth="26px"
              v-model="searchParams.EMP_NM"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[0-9~!@#$%^&*()_+|<>?:{}]/, '' );"
              maxlength="500"
              @input="inputEMP_NM"
            /> 
            <v-checkbox 
              v-model="searchParams.ALL_USER"
              label="자격증 미소지자 포함"
              false-value="N"
              true-value="Y"
              @update:model-value="ALL_USERChkYn"
            />
          </v-sheet>
          <div class=d-flex>
            <div class="mr-2" style="width:50%; height:217%" >
              <IGridTitle 
                :title="$t('장비자격 보유현황')"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCurrentRowChanged="rowChanged"
              />
            </div>
            <div style="width:50%">
              <IGridTitle 
                :title="$t('인사정보')"
              >
                <template #editors />
              </IGridTitle>
              <v-sheet class="searchArea d-flex">
                <VImg
                  :height="180"
                  :src="imageSrc"
                /> 
                <div class="flex-column">
                  <i-input
                    :label="$t('소속부서')"
                    width=620px
                    labelWidth="52px"
                    v-model="userData.DEPT_NM"
                    :readonly="true"
                  />
                  <div class="d-flex mt-2">
                    <i-input
                      :label="$t('성명')"
                      width=300px
                      labelWidth="52px"
                      v-model="userData.EMP_NM"
                      :readonly="true"
                    />
                    <i-input
                      :label="$t('사번')" 
                      width=300px
                      labelWidth="52px"
                      v-model="userData.EMP_NO"
                      :readonly="true"
                    />
                  </div>
                  <div class="d-flex mt-2">
                    <i-input
                      :label="$t('소속구분')"
                      width=300px
                      labelWidth="52px"
                      v-model="userData.USER_DIV"
                      :readonly="true"
                    />
                    <i-input
                      :label="$t('직위')"
                      width=300px
                      labelWidth="52px"
                      v-model="userData.JOB_TIT_NM"
                      :readonly="true"
                    />
                  </div>
                  <div class="d-flex mt-2">
                    <i-input
                      :label="$t('생년월일')"
                      width=300px
                      labelWidth="52px"
                      v-model="userData.BIRTH_DAY"
                      :readonly="true"
                    />
                    <i-input
                      :label="$t('재직구분')"
                      width=300px
                      labelWidth="52px"
                      v-model="userData.HLD_OFFI_GBN"
                      :readonly="true"
                    />
                  </div>
                </div>
              </v-sheet>
              <div style="height:130%" >
                <IGridTitle 
                  ref="detailBtn"
                  :title="$t('자격정보')"
                  :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                  @click-button="onDetailButtonsClick"
                >
                  <template #editors>※정지일 경우 보수 교육 필요, 취소일 경우 자격 재취득 필요※</template>
                </IGridTitle>
                <RealGrid
                  ref="grdSub"
                  :grid-view-option="grdSubProps.gridViewOption"
                  :fields="grdSubProps.fields"
                  :columns="grdSubProps.columns"
                  @onCellDblClicked="onCellDblClicked"
                  @onEditChange="editChange"
                />
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <EDUBA0010Pop01
      ref="eDUBA0010Pop01"
    />
    <EDUAA0020Pop02
      ref="eDUAA0020Pop02"
      @selected="onEDUAA0020Pop02Selected"
    />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
