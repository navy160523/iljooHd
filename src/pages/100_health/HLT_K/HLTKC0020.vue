<!-- 
  화면명 : 건강관리대상자 사후관리현황
  화면개요 : 건강관리대상자 사후관리현황
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonLogExecuteApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from "@/components/ILabel.vue"
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import VendTreePopup from '@/components/popup/VendTreePopup.vue'
import PdfView from '@/pages/99_indexPopUp/PdfViewPopup.vue'
import HLTKC0020Popup01 from '@/pages/100_health/HLT_K/HLTKC0020Popup01.vue'
import HLTKC0020Popup02 from '@/pages/100_health/HLT_K/HLTKC0020Popup02.vue'
import HLTKC0020Popup03 from '@/pages/100_health/HLT_K/HLTKC0020Popup03.vue'
import HLTKC0020Popup04 from '@/pages/100_health/HLT_K/HLTKC0020Popup04.vue'

defineOptions({
  name:'100_health-HLT_K-HLTKC0020', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isIp = ref(false)
const selectedRow = ref(null)

const menuTitle = ref(null)
const grdMain = ref(null)
const fileUploadPopup = ref(null)
const vendTreePopup = ref(null)
const pdfPopup = ref(null)
const hltkc0020Popup01 = ref(null)
const hltkc0020Popup02 = ref(null)
const hltkc0020Popup03 = ref(null)
const hltkc0020Popup04 = ref(null)
const fRatio = ref('0')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(dayjs().get('year')),
  VEND_CD: userStore.asgnCd,
  VEND_NAME: userStore.asgnNm,
})

const codeList = reactive({
  YEAR: []
})

const chkName = reactive([
  { ID: 'CHK_A', NAME: '건강관리위험대상'},
  { ID: 'CHK_B', NAME: '유소견/요관찰'},
  { ID: 'CHK_C', NAME: '일반 고령자'},
  { ID: 'CHK_D', NAME: '기타'},
])

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }
  // ip, login id 비교하여 인가된 계정, ip인지 확인
  userStore.getAuthIpMenus().then(res => {
    if(res.filter(item => item.EMP_NO == userStore.empNo && 
      item.PGM_ID == useLogsStore().menuId &&
      item.IP_ADD == userStore.clientIp).length > 0) {
      isIp.value = true
    }
    codeList.YEAR = []
    for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
      codeList.YEAR.push({COD: String(i), TXT: String(i)})
    }

    onButtonsClick({ id: 'btnSearch' })
    grdMain.value.getGridView().filterPanel.visible = true
  })
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true, exclusive: true }, edit: { editable: true }, header: { height: 75 } },
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
    { fieldName: 'CHK_A', width: '50', dataType: 'text', editable: false, header: { text: t('건강관리위험대상') } },
    { fieldName: 'CHK_B', width: '60', dataType: 'text', editable: false, header: { text: t('유소견/요관찰') } },
    { fieldName: 'CHK_C', width: '50', dataType: 'text', editable: false, header: { text: t('일반 고령자') } },
    { fieldName: 'CHK_Z', width: '50', dataType: 'text', editable: false, header: { text: t('기타') } },
    { fieldName: 'MANAGE_ITEM', width: '200', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('건강관리항목') } },
    { fieldName: 'FILE_ID', width: '70', editable: false, dataType: 'text', header: { text: t('개인정보\n동의서')},
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          return `<div class="d-flex justify-space-between">
            <div></div>
            <div>${cell.value ? '등록' : '미등록'}</div>
            <button 
              class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >첨부</button>
          </div>`;
        },
      },
    },
    { fieldName: 'STD_DATE', width: '70', dataType: 'text', editable: false, header: { text: t('계획등록 일자') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          return `
            <div class="d-flex justify-space-between" style="align-items: center;">
              <p style="max-width: 80%; text-align:left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value ?? ''}</p>
              <i class="mdi mdi-magnify"
                data-index="${cell.index.itemIndex}"
                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); color: #1a40c7; font-size: 18px; cursor: pointer;">
              </i>
            </div>
          `;
        }
      }
    },
    { fieldName: 'AFT_DATE', width: '70', dataType: 'text', editable: false, header: { text: t('실적등록 일자') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          return `
            <div class="d-flex justify-space-between" style="align-items: center;">
              <p style="max-width: 80%; text-align:left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value ?? ''}</p>
              <i class="mdi mdi-magnify"
                data-index="${cell.index.itemIndex}"
                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); color: #1a40c7; font-size: 18px; cursor: pointer;">
              </i>
            </div>
          `;
        }
      }
    },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('소속코드') },visible: false, },
    { fieldName: 'VEND_NM', dataType: 'text', header: { text: t('소속명') },visible: false, },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'JOB_NM', dataType: 'text', header: { text: t('직무') },visible: false, },
    { fieldName: 'JOIN_DT', dataType: 'text', header: { text: t('입사일') },visible: false, },
    { fieldName: 'STD_CNT', dataType: 'text', header: { text: t('계획카운트') },visible: false, },
    { fieldName: 'AFT_CNT', dataType: 'text', header: { text: t('실적카운트') },visible: false, },
    { fieldName: 'MEDC_TEST_DT', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columnLayout: [
    'EMP_NO',
    'EMP_NM',
    'JOB_TIT_NM',
    'BIRTH_DAY',
    'AGE_INT',
    {
          name: '구분',
          direction: 'horizontal',
          items: [ 'CHK_A', 'CHK_B', 'CHK_C', 'CHK_Z'],
          header: { text: t('구분') },
    },
    'MANAGE_ITEM',
    'FILE_ID',
    'STD_DATE',
    'AFT_DATE'
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isIp.value) {
    return showNoIp()
  }

  if (btn.id === 'btnSearch') {
    getData(true)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnSystemManual') {
    pdfPopup.value.openPopupUrl('https://hises.hd.com/HiSEsFiles/Manual/UIIH2010C.pdf')
  } else if (btn.id === 'btnRiskEmpGuide') {
    pdfPopup.value.openPopupUrl('https://hises.hd.com/HiSEsFiles/Manual/UIIH2010C_2.pdf')
  } else if (btn.id === 'btnAddPlan') {
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    if(checkRow.length != 1) {
      return Message.warn(t('하나의 데이터를 클릭하셔야 합니다.'))
    }
    let checkData = grdMain.value.getDataProvider().getJsonRow(checkRow[0])
    if(checkData.STD_CNT > checkData.AFT_CNT) {
      return Message.warn(t('실적등록을 완료해주십시오.'))
    }
    // 2025.08.20 건강관리위험대상으로 표시되지 않은 인원은 보건관리계획서 작성을 안해도 계획등록가능
    if(checkData.CHK_A) {
      if (checkData.STD_CNT == 0) {
        return Message.warn(t('보건관리계획서 작성을 완료해주십시오.'))
      } 
    }
    let param = {
      ...checkData,
      YEAR: searchParams.YEAR,
      VEND_CD: searchParams.VEND_CD,
      VEND_NAME: searchParams.VEND_NAME,
      UNFIT_RES_NAME: checkData.MANAGE_ITEM
    }
    hltkc0020Popup01.value.openPopup(param, 'B')
  } else if (btn.id === 'btnAddPerform') {
    let checkRow = grdMain.value.getGridView().getCheckedRows(true)
    if(checkRow.length != 1) {
      return Message.warn(t('하나의 데이터를 클릭하셔야 합니다.'))
    }
    let checkData = grdMain.value.getDataProvider().getJsonRow(checkRow[0])
    if (checkData.STD_CNT <= checkData.AFT_CNT) {
      return Message.warn(t('계획등록을 완료해주십시오.'))
    }
    let param = {
      ...checkData,
      YEAR: searchParams.YEAR,
      VEND_CD: searchParams.VEND_CD,
      VEND_NAME: searchParams.VEND_NAME
    }
    hltkc0020Popup02.value.openPopup(param, 'B')
  }
}

const getData = (showMsg) => {
  if(!isIp.value) {
    return showNoIp()
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTKC0020_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  if(isEmpty(res.ORESULT_CUR)) {
    fRatio.value = '0'
  } else {
    let ratio = ((res.ORESULT_CUR.filter(item => item.AFT_CNT > 0 && !isEmpty(item.CHK_A)).length / res.ORESULT_CUR.filter(item => !isEmpty(item.CHK_A)).length) * 100).toFixed(1)
    fRatio.value = `${res.ORESULT_CUR.filter(item => item.AFT_CNT > 0 && !isEmpty(item.CHK_A)).length} / ${res.ORESULT_CUR.filter(item => !isEmpty(item.CHK_A)).length}   ${ratio}%`
  }

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: searchParams,
    mgs: '[건강관리대상자 사후관리현황] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.CMPNY_DIV)) {
      return Message.warn(t('사업부코드는 필수 입력입니다.'))
    } else if (isEmpty(data.EMP_NO)) {
      return Message.warn(t('등록번호는 필수 입력입니다.'))
    } else if (isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력입니다.'))
    } 
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(!isEmpty(data.CHECK_DT_BEF_NEW)) {
      data.CHECK_DT_BEF_NEW = dayjs(data.CHECK_DT_BEF_NEW).format('YYYYMMDD')
    }

    if(!isEmpty(data.CHECK_DT)) {
      data.CHECK_DT = dayjs(data.CHECK_DT).format('YYYYMMDD')
    }

    if(!isEmpty(data.CHECK_DT_ADD)) {
      data.CHECK_DT_ADD = dayjs(data.CHECK_DT_ADD).format('YYYYMMDD')
    }
  
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTKC0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData(false)
  Message.success(t('성공적으로 저장되었습니다'))
}

const openVendPopup = () => {
  vendTreePopup.value.openPopup({ ORGN_DIV: 'B' })
}

const selectedVend = (data) => {
  searchParams.VEND_CD = data.ASGN_CD
  searchParams.VEND_NAME = data.ASGN_NM
  getData()
}

const onCellItemClicked = (grid, index, col) => {
  // 선택한 셀 row 데이터 초기화
  selectedRow.value = null

  if(!isIp.value) {
    return showNoIp()
  }

  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

  if (col.target.className.includes('mdi') && col.column === 'STD_DATE'){
    let param = {
      ...data,
      YEAR: searchParams.YEAR,
      VEND_CD: searchParams.VEND_CD,
      VEND_NAME: searchParams.VEND_NAME,
      UNFIT_RES_NAME: ''
    }
    for(let i of chkName) {
      if(data[i.ID] == 'O') {
        param.UNFIT_RES_NAME += i.NAME 
      }
    }
    hltkc0020Popup02.value.openPopup(param, 'A')
  } else if (col.target.className.includes('mdi') && col.column === 'AFT_DATE'){
    let param = {
      ...data,
      YEAR: searchParams.YEAR,
      VEND_CD: searchParams.VEND_CD,
      VEND_NAME: searchParams.VEND_NAME,
      UNFIT_RES_NAME: ''
    }
    hltkc0020Popup02.value.openPopup(param, 'B')
  // 개인정보 동의서 셀에서 첨부 버튼 클릭   
  } else if (col.target.className === 'v-btn' && col.column === 'FILE_ID') {
    if(Number(data.STD_CNT) === 0 ) {
      Message.warn(t('계획서를 먼저 등록해주세요.'))
      return
    }
    // 선택한 셀 의 row data 임시저장
    selectedRow.value = index.dataRow
    fileUploadPopup.value.openPopup(data.FILE_ID)
  }
}

// 파일업로드 이벤트
const uploaded = (val) => { 
  if(val.fileId == null) return
  let data = grdMain.value.getDataProvider().getJsonRow(selectedRow.value)
  // 파일 ID 저장
  data.FILE_ID = val.fileId
  commonExecuteApi({ queryId: 'HLTKB0020_SAVE_05', list: [data] }).then((res) => { 
    onButtonsClick({id:"btnSearch"});
  })
} 

const onCurrentChanged = async (grid, oldRow, newRow) =>{
  grdMain.value.getGridView().checkAll(false)
  grdMain.value.getGridView().checkItem(grdMain.value.getGridView().getSelectedRows(), true)
}
const showNoIp = () => {
  vm.$swal({ title: t('메뉴 사용 권한이 없습니다. 메뉴 사용을 희망하시는 경우\r\n시스템 관리자에게 IP 권한 등록을 요청하시기 바랍니다.\r\n\n☎ 문의처 : 안전보건지원부 보건관리과 T. 2-5407') }).then(res=> {
  })
  return false
}

// 이전기록 보기 팝업
const openDetailInfo = () => { 
  if (!isIp.value) {
    showNoIp()
    return
  }
  
  hltkc0020Popup04.value.openPopup({ searchParams })
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnAddPlan', 'btnAddPerform', 'btnRiskEmpGuide', 'btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            v-model="searchParams.VEND_NAME"
            label-width="50px"
            :label="$t('소속')"
            width="180px"
            :readonly="true"
          />
          <i-input
            v-model="searchParams.VEND_CD"
            width="150px"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openVendPopup"
            @keydown.enter="openVendPopup"
            :readonly="true"
          >
          </i-input>
          <div v-if="Number(searchParams.YEAR) <= '2025'">
            <v-btn 
              color="primary"
              variant="outlined"
              class="mt-1"
              @click="openDetailInfo"
            >
              이전기록 보기
            </v-btn>
          </div>
        </v-sheet>
        <div style="color: black;">
          사후관리 실적 등록율 : {{ fRatio }} 
        </div>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
            @onCurrentChanged="onCurrentChanged"  
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <VendTreePopup ref="vendTreePopup" @selected="selectedVend"/>
    <PdfView ref="pdfPopup"/>
    <IUploadPopup ref="fileUploadPopup" 
      gridTitle="개인정보 동의서 파일첨부"
      fileInputText="개인정보동의서는 개인별 최초 1회 반드시 첨부 요망"
      @uploaded="uploaded" 
      :fileDan="true"/>
    <HLTKC0020Popup01 ref="hltkc0020Popup01" @after-search="getData"/>
    <HLTKC0020Popup02 ref="hltkc0020Popup02" @after-search="getData"/>
    <HLTKC0020Popup03 ref="hltkc0020Popup03" @after-search="getData"/>
    <HLTKC0020Popup04 ref="hltkc0020Popup04" />
  </v-card>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>