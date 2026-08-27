<!--
  화면명 : 안전화/안전장화 강제 대상여부 관리
  화면개요 : 안전화/안전장화 지급 강제 대상여부를 관리
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { useCommonStore } from '@hiway/stores/common'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'
import HLTHF0050Popup from './HLTHF0050Popup.vue'

import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest,
  getCodeList,
} from '@hiway/api/commonApi'

defineOptions({
  name: '100_health-HLT_H-HLTHF0050',
})


const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const dataRes = ref();
const hLTHF0050Popup = ref(null)


const codeList = reactive({
  REQ_DIV : [], // 신청구분(안전화-A/안전장화-B)
  REQ_CHA : [], // 신청시기(정기(상반기-1/하반기-2)/수시(1~))
  DUTY_YN : [
    { TXT: "전체", COD: '' },
    { TXT: "대상", COD: "Y" },
    { TXT: "비대상", COD: "N" },
  ], // 대상여부(Y/N)
})


const itemField = reactive({
    CMPNY_DIV       : '', //사업장코드
    YEAR            : '', // 년도
    REQ_DIV         : '', // 신청구분(안전화-A/안전장화-B)
    REQ_CHA         : '', // 신청시기(정기(상반기-1/하반기-2)/수시(1~))
    ASGN_NM         : '', // 현재소속
    EMP_NO          : '', // 신청자
    BSNS_CD         : '', // 사업부
    DEPT_CD         : '', // 신청부서
    ASGN_CD         : '', // 신청조직
    DUTY_YN         : '', // 대상여부
    USER_DIV        : '', // 직영구분
    REMARK          : '', // 비고
})


const searchParam = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,//사업장코드 
  YEAR      : new Date().getFullYear().toString(),//년도
  REQ_DIV   : '',//신청구분(안전화-A/안전장화-B)
  REQ_CHA   : '',//신청시기(정기(상반기-1/하반기-2)/수시(1~))
  DUTY_YN   : '',
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'REQ_DIV',
      dataType: 'text',
      width: '200',
      editable: false,
      lookupDisplay: true,
      header: { text: t('신청구분') },
    },
    {
      fieldName: 'REQ_CHA',
      dataType: 'text',
      width: '200',
      editable: false,
      lookupDisplay: true,
      header: { text: t('신청시기') },
    },
    {
      fieldName: 'ASGN_FULL_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('등록당시소속') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('현재소속') },
    //   lookupDisplay: true,
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'DUTY_YN',
      dataType: 'text',
      width: '60',
      editable: false,
      lookupDisplay: true,
      header: { text: t('대상여부') },
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      width: '300',
      editable: false,
      header: { 
        text: '비고',
      },
    },
    //안보이는컬럼
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    
    {
      fieldName: 'EMP_NO',
      visible: false,
      header: { text: t('신청자') },
    },
    {
      fieldName: 'BSNS_CD',
      visible: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_CD',
      visible: false,
      header: { text: t('신청부서') },
    },
    {
      fieldName: 'ASGN_CD',
      visible: false,
      header: { text: t('신청조직') },
    },
    {
      fieldName: 'USER_DIV',
      visible: false,
      header: { text: t('직영구분') },
    },
    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('년도') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields




const initCodeList = () => {

  Promise.all([
    //구분
    getCodeList('HHII811'),

    //신청시기 - 안전화
    reqChaSearchData('HLTHF0050_SEARCH_COMMONCODE','HHII808A'),

    //신청시기 - 안전장화
    reqChaSearchData('HLTHF0050_SEARCH_COMMONCODE','HHII808C'),

    //신청시기 - 전체
    reqChaSearchData('HLTHF0050_SEARCH_COMMONCODE','HHII808A/HHII808C'),

  ]).then((res) => {

    dataRes.value =res

    //년도
    searchParam.YEAR = new Date().getFullYear().toString()

    //구분
    codeList.REQ_DIV = res[0].ORESULT_CUR
    codeList.REQ_DIV.unshift({ TXT: '전체', COD: ''})
    //신청시기
    codeList.REQ_CHA.unshift({ TXT: '전체', COD: ''})

    
    grdMain.value.setBindingColumn('REQ_DIV', codeList.REQ_DIV, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REQ_CHA', res[3].ORESULT_CUR, 'COD', 'TXT')
    grdMain.value.setBindingColumn('DUTY_YN', codeList.DUTY_YN, 'COD', 'TXT')
  })
}

const itemSearchParam = reactive({
    ALL_UP_CD : "HHII808A/HHII808C",
    CMPNY_DIV : "HHI",
    USE_FLAG : "Y",
    CODE_NAME_TYPE : "0",
    LEVEL : null,
})


const reqChaSearchData = (queryId,allUpCd) =>{
  itemSearchParam.ALL_UP_CD = allUpCd
    return commonSearchApi({
        queryId: queryId,
        param:itemSearchParam,
    })
}

onMounted(() => {
  initCodeList()
  //onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})

const onButtonsClick = async(btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    hLTHF0050Popup.value.openPopup(searchParam.REQ_DIV) // { EMP_NM: item_.KOR_NM }
  } else if (btn.id === 'btnDelete'){
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnFormDownload'){
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '안전화,안전장화 강제 대상여부 관리 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {

    vm.$swal({
      title: t('안전화,안전장화 강제 대상여부 관리를 업로드 하시겠습니까?\r\n신규 대상이 아니면 이전 결과는 모두 갱신 됩니다.'),
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = function(event) {
          commonStore.loading = true
          const selectedFile = event.target.files[0]
          // 선택된 파일에 대한 처리
          getJsonFromExcel(selectedFile, excelUploadCallback)
        }
        input.click()
      } else {
        commonStore.loading = false 
      }
    })
    
  }
}

const excelUploadCallback = async(excelData) => {  
  let errMsg = ''
  let gridData = []

  //엑셀 데이터 한줄씩 확인
  excelData.map((item, index) => {

    let addRow = {
      CMPNY_DIV: item['사업장코드'],
      YEAR: item['년도'],
      REQ_DIV: item['신청구분(안전화-A/안전장화-B)'],
      REQ_CHA: item['신청시기(정기(상반기-1/하반기-2)/수시-1))'],
      EMP_NO: item['사번'],
      KOR_NM: item['성명'],
      DUTY_YN: item['대상여부(Y/N)'],
      REMARKS: item['비고'],
      USER_ID: userStore.userId,
    }    
    
    if(isEmpty(item['사업장코드'])) {
      errMsg = '데이터 누락이 있습니다. ' + (index+1) + '번째 행 : 사업장코드'
      return
    } else if(isEmpty(item['년도'])){
      errMsg = '데이터 누락이 있습니다. ' + (index+1) + '번째 행 : 년도'
      return
    } else if(isEmpty(item['신청구분(안전화-A/안전장화-B)'])){
      errMsg = '데이터 누락이 있습니다. ' + (index+1) + '번째 행 : 신청구분(안전화-A/안전장화-B)'
      return
    } else if(isEmpty(item['신청시기(정기(상반기-1/하반기-2)/수시-1))'])){
      errMsg = '데이터 누락이 있습니다. ' + (index+1) + '번째 행 : 신청시기(정기(상반기-1/하반기-2)/수시-1))'
      return
    } else if(isEmpty(item['사번'])){
      errMsg = '데이터 누락이 있습니다. ' + (index+1) + '번째 행 : 사번'
      return
    } else if(isEmpty(item['성명'])){
      errMsg = '데이터 누락이 있습니다. ' + (index+1) + '번째 행 : 성명'
      return
    } else if(isEmpty(item['대상여부(Y/N)'])){
      errMsg = '데이터 누락이 있습니다. ' + (index+1) + '번째 행 : 대상여부(Y/N)'
      return
    } else if(item['신청구분(안전화-A/안전장화-B)'] === 'B' && !item['신청시기(정기(상반기-1/하반기-2)/수시-1))'] === '1'){
      errMsg = '신청구분(안전장화)는 신청시기(수시)로 작성되어야 됩니다. ' + (index+1) + '번째 행'
      return
    }

    gridData.push(addRow)
  })
  
  let seen = new Set();
  let duplicates = gridData.filter(item =>{
    let key = `${item.CMPNY_DIV}-${item.YEAR}-${item.REQ_DIV}-${item.REQ_CHA}-${item.EMP_NO}-${item.KOR_NM}`

    let isDuplicate = seen.has(key);
    if (!isDuplicate) {
      seen.add(key);
    }

    return isDuplicate;
  })

  if(duplicates.length > 0){
    errMsg = '중복된 데이터가 있습니다. ' + duplicates[0].EMP_NO + ' : ' + duplicates[0].KOR_NM
  }else{
    await commonRequest('/hse/health/HLTHF0050_EXCEL_UPLOAD', {data: gridData } ).then(res =>{

      if(res.data != null ){
        onButtonsClick({ id: 'btnSearch' })
        Message.success(t('저장 되었습니다.'))
      }
    })
  }



  // grdMain.value.getDataProvider().setRows(gridData)
   
  // let grdList = grdMain.value.getDataProvider().getJsonRows(0,-1)
  
  
  commonStore.loading = false

  if(!isEmpty(errMsg)) {
    Message.err(t(errMsg))
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTHF0050_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  const gridView = grdMain.value.getGridView();
 
  gridView.setAllCheck(false)
  gridView.checkAll(false)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//삭제 전 유효성 검사
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

//삭제 이벤트
const deleteData = async () => {
  let temp = null
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let deleteParam = [{
      CMPNY_DIV : data.CMPNY_DIV,
      YEAR      : data.YEAR,
      REQ_DIV   : data.REQ_DIV,
      REQ_CHA   : data.REQ_CHA,
      EMP_NO    : data.EMP_NO
    }]
    temp = commonExecuteApi({ queryId : 'HLTHF0050_DELETE_01', list: deleteParam }) 
  }
  return temp
}

//삭제 후
const afterDelete = async () => {
  await onButtonsClick({ id: 'btnSearch' })
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  hLTHF0050Popup.value.openPopup(data.REQ_DIV, data)
}

const changeReqDiv = async () => {

  codeList.REQ_CHA = []
  searchParam.REQ_CHA = ''
  

  if(searchParam.REQ_DIV === 'A'){
    searchParam.REQ_CHA = ''
    codeList.REQ_CHA = dataRes.value[1].ORESULT_CUR
    if(!codeList.REQ_CHA.some(item => item.TXT === "전체")){
      codeList.REQ_CHA.unshift({ TXT: "전체", COD: "" });
    }
  }else if (searchParam.REQ_DIV === 'B') {
    searchParam.REQ_CHA = 'C1'
    codeList.REQ_CHA = dataRes.value[2].ORESULT_CUR
  }else{
    codeList.REQ_CHA = []
    searchParam.REQ_CHA = ''
    if(!codeList.REQ_CHA.some(item => item.TXT === "전체")){
      codeList.REQ_CHA.unshift({ TXT: "전체", COD: "" });
    }
  }
  // grdMain.value.setBindingColumn('REQ_CHA', res[3].ORESULT_CUR, 'COD', 'TXT')
  await onButtonsClick({ id: 'btnSearch' })
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :use-permission="true"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete','btnFormDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('구분')"
              :items="codeList.REQ_DIV"
              item-title="TXT"
              item-value="COD"
              width="200px"
              labelWidth="50px"
              v-model="searchParam.REQ_DIV"
              @update:modelValue="changeReqDiv"
            />
            <i-select
              v-model="searchParam.YEAR"
              :label="$t('년도')"
              label-width="50px"
              type="YEAR"
              width="200px"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
            <i-select
              :label="$t('신청시기')"
              :items="codeList.REQ_CHA"
              item-title="TXT"
              item-value="COD"
              width="200px"
              labelWidth="50px"
              v-model="searchParam.REQ_CHA"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
            <i-select
              :label="$t('대상여부')"
              :items="codeList.DUTY_YN"
              item-title="TXT"
              item-value="COD"
              width="200px"
              labelWidth="50px"
              v-model="searchParam.DUTY_YN"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <HLTHF0050Popup
    @Saved="() => onButtonsClick({ id: 'btnSearch' })"
    ref="hLTHF0050Popup"
  ></HLTHF0050Popup>
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

.multi-line-css {
  white-space: pre;
}
</style>