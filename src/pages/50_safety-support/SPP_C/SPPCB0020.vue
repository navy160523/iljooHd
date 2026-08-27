<!--
  화면명 : 산업안전보건위원회 협의결과
  화면개요 : 산업안전보건위원회 안건을 엑셀업로드 또는 그리드 셀 추가하여 등록 또는 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonSendApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { getJsonFromExcel } from '@/utils/excel'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

import SPPCB0020Popup01 from '@/pages/50_safety-support/SPP_C/popup/SPPCB0020Popup01.vue'

defineOptions({
  name: '50_safety-support-SPP_C-SPPCB0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)

// 팝업
const sPPCB0020Popup01 = ref(null)

// 관리자 및 사용자 구분 (안전보건지원부 - 부서장, 직책과장, 화면 담당자(김태송 책임))
const  isAdmin = ref((userStore.deptCd === 'N1K0' && ['15', '62', '16'].includes(userStore.offiResCd)) || userStore.userId === 'A504638' || userStore.userId === 'BP21926' ? true : false) // 관리자(안전보건지원부 전원)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BU: '',
  PROPOSER: '',
  KEYWORD: '',
  QUARTER: '',
  REVIEW_DEPT_CD: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  QUARTER: [
    { COD: '', TXT: '전체'},
    { COD: '1', TXT: '1분기'},
    { COD: '2', TXT: '2분기'},
    { COD: '3', TXT: '3분기'},
    { COD: '4', TXT: '4분기'}
  ],
  PROGRES_STATUS: [
    { COD: 'A', TXT: '진행전' },
    { COD: 'B', TXT: '진행중' },
    { COD: 'C', TXT: '조치완료' },
  ]
})

// 코드리스트 세팅
const initCodeList = () => {

  console.log('Admin :', isAdmin.value)
  console.log('UserStore :', userStore)

  Promise.all([
    getCompanyList(),
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR // 회사
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {
    checkBar: { visible: true },
    rowIndicator: { visible: false },
  },

  keys : ['CMPNY_DIV'],
  fields : [
    { fieldName: 'YEAR', dataType: 'text', width: '70', editable: false, editable: false, header: { text:'년도' } ,
      displayCallback: function (grd, idx, val) {
        return val.substring(0, 4)
      },
      mergeRule: { "criteria": "value" }
    },
    { fieldName: 'QUARTER', dataType: 'text', width: '70', editable: false, header: { text:'분기' },
      displayCallback: function (grd, idx, val) {
        return val.substring(0, 1) + '분기'
      },
      mergeRule: { "criteria": "value" }
    }, 
    { fieldName: 'NUM_SEQ', dataType: 'text', width: '100', styleName: "multiline-editor left-column", editable: false, header: { text:'연번' }, mergeRule: { "criteria": "value" } },
    { fieldName: 'CONTENT', dataType: 'text', width: '200', styleName: "multiline-editor left-column", editable: false, header: { text:'안건' }, mergeRule: { "criteria": "value" } },
    { fieldName: 'PROBLEM', dataType: 'text', width: '200', styleName: "multiline-editor left-column", editable: false, header: { text:'문제점' }, mergeRule: { "criteria": "value" } },
    { fieldName: 'IMPROVEMENT', dataType: 'text', width: '200', styleName: "multiline-editor left-column", editable: false, header: { text:'개선요구안' }, mergeRule: { "criteria": "value" } },
    { fieldName: 'CONSULTATION_RESULT', dataType: 'text', width: '200', styleName: "multiline-editor left-column", editable: false, header: { text:'협의결과' }, mergeRule: { "criteria": "value" } },
    { fieldName: 'FILE_COUNT_QUARTER', dataType: 'text', width: '60', editable: false, header: { text:'보충자료(분기)' }, visible: isAdmin.value ? true : false },
    { fieldName: 'ACTION_DEPT_NM', dataType: 'text', width: '110', editable: false, editable: false, header: { text:'조치부서' }, visible: isAdmin.value ? true : false},
    { fieldName: 'ACTION_RESULT', dataType: 'text', width: '220', editable: false, styleName: "multiline-editor left-column ", header: { text:'조치결과' }, visible: isAdmin.value ? true : false,
      editor: {
        type: 'multiline',
        altEnterNewLine: true,
      },
    }, 
    { fieldName: 'PROGRES_STATUS', dataType: 'text', editable: false, header: { text:'진행상태' },
      
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.PROGRES_STATUS },
      editor: { type: 'dropdown' },
      visible: isAdmin.value ? true : false
    },
    { fieldName: 'FILE_COUNT', dataType: 'text', width: '60', editable: false, header: { text:'첨부파일' }, visible: isAdmin.value ? true : false },
    
    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV',         dataType: 'text' , visible: false },
    { fieldName: 'TASK_SEQ',          dataType: 'text' , visible: false },
    { fieldName: 'ACTION_DEPT_CD',    dataType: 'text' , visible: false },
    { fieldName: 'FILE_ID',           dataType: 'text' , visible: false },
    { fieldName: 'FILE_ID_QUARTER',   dataType: 'text' , visible: false },
    { fieldName: 'EXCEL_DISCRIPTION', dataType: 'text' , visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 버튼 클릭 이벤트
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') { // 조회
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else  if (btn.id === 'btnFormDownload') { // 양식다운로드
    
    grdMain.value.getGridView().exportGrid({
      type:"excel",
      target:"local",
      fileName: '산업안전보건위원회 안건 등록.xlsx', 
      textCallback: function() { return "" },
      numberCallback: function() { return "" },
      datetimeCallback: function() { return "" },
      exportLayout:[
        { column: 'YEAR',                 header: {text: '년도'} },
        { column: 'QUARTER',              header: {text: '분기'} },
        { column: 'NUM_SEQ',              header: {text: '연번'} },
        { column: 'CONTENT',              header: {text: '안건'} },
        { column: 'PROBLEM',              header: {text: '문제점'} },
        { column: 'IMPROVEMENT',          header: {text: '개선요구안'} },
        { column: 'CONSULTATION_RESULT',  header: {text: '협의결과'} },
        { column: 'ACTION_DEPT_CD',       header: {text: '조치부서'} },
        { column: 'ACTION_RESULT',        header: {text: '조치결과'} },
        { column: 'PROGRES_STATUS',       header: {text: '진행상태'} },
        // 설명 추가
        {
          column: 'EXCEL_DISCRIPTION', // 실제 데이터 컬럼과 연결되지 않음
          header: { text: `1. 분기는 코드로 입력해주세요.\n1: 1분기\n2: 2분기\n3: 3분기\n4: 4분기 \n2. 진행상태는 코드로 입력해주세요.\nA: 진행전\nB: 진행중\nC: 조치완료` }, // 헤더 부분 공백
          width: 400,
          textAlign: 'left'
        }
      ]
    })
  } else if (btn.id === 'btnExcelUpload') { // 엑셀 업로드
    await excelUpload()
    await saveData()
  } else  if (btn.id === 'btnExcelDownload') {  // 엑셀 다운로드
    grdMain.value.getGridView().exportGrid({ 
      type: 'excel',
      target: 'local',
      fileName: dayjs().format('YYYYMMDD') + '산업안전보건위원회 안건관리 목록',
      progressMessage: '엑셀 다운로드중입니다.',
      showProgress: true,
      indicator: 'visible',
      header: 'visible',
      footer: 'hidden',
      allColumns: false,
      exportTemplate: true
    })
  } else if (btn.id === 'btnUpdate') {  // 저장
    saveData()
  } else if (btn.id === 'btnDelete') {  // 삭제
    deleteData()
  } else if (btn.id === 'btnSendMail') {  // 메일 발송
    sendMail()
  }
}

// 조회
const searchData = () => {
  // 관리자, 부서장, 안전보건지원부-안전지원과는 전체 조회가능, 일반 사용자는 본인 부서만 조회 가능
  if (isAdmin.value) {
    searchParams.REVIEW_DEPT_CD = ''
  } else {
    searchParams.REVIEW_DEPT_CD = userStore.deptCd
  }

  return commonSearchApi({
    queryId : 'SPPCB0020_SEARCH_01',
    param: searchParams
  })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 엑셀 업로드
const excelUpload = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'

    input.onchange = function (event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, (excelData) => {
        excelUploadCallback(excelData)
        resolve()  // 파일 처리가 완료되면 resolve 호출
      })
    }

    input.click()
  })
}

// 엑셀 업로드 콜백
const excelUploadCallback = async excelData => {
  const allData = grdMain.value.getDataProvider().getJsonRows()
  
  excelData.forEach((item, index) => {
    let newArr = {
      YEAR: item.년도,
      QUARTER: item.분기,
      NUM_SEQ: item.연번,
      CONTENT: item.안건,
      PROBLEM: item.문제점,
      IMPROVEMENT: item.개선요구안,
      CONSULTATION_RESULT: item.협의결과,
      ACTION_DEPT_CD: item.조치부서,
      ACTION_RESULT: item.조치결과,
      PROGRES_STATUS: item.진행상태
    }
    grdMain.value.getDataProvider().addRow(newArr)
    grdMain.value.getGridView().checkRow(allData.length + index)
  })
}

// 저장
const saveData = async () => {
  let saveParams = []

  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx in checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(checkedRows[rowIdx])

    if (!data.YEAR) {
      return Message.warn(t('년도를 입력해주세요.'))
    } else if (!data.QUARTER) {
      return Message.warn(t('분기를 입력해주세요.'))
    } else if (!data.NUM_SEQ) {
      return Message.warn(t('연번을 입력해주세요.'))
    }

    if (data.QUARTER > 4) {
      return Message.warn(t('1~4분기 사이로 입력해주세요.'))
    }

    data.YEAR = data.YEAR.substring(0, 4)
    data.QUARTER = data.QUARTER.substring(0, 1)
    data.CMPNY_DIV = userStore.cmpnyDiv
    data.TASK_SEQ = ''
    data.USER_ID = userStore.userId

    data.IDX = Number(rowIdx) + 1 // ROW가 똑같으면 1개만 저장되는 문제해결, DB와 무관함.

    saveParams.push(data)
  }


  // vm.$swal({
  //   title: t("저장 하시겠습니까?"),
  //   showCancelButton: true,
  // }).then(async swal => {
  //   if (swal.isConfirmed === true) {

    commonExecuteApi({
      queryId: "SPPCB0020_SAVE_01",
      list: saveParams,
    }).then(async res => {
      if (res.result.status === '200') {
        Message.success(t('저장 되었습니다.'))
      }
    }).catch(err => {
      return Message.err(err)
    }).finally(async () => {
      await onButtonsClick({ id: 'btnSearch' })
    })

  //   }
  // })
}

// 삭제
const deleteData = async () => {
  const deleteParams = []

  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    deleteParams.push(data)
  }

  vm.$swal({
    title: t("삭제 하시겠습니까?"),
    showCancelButton: true,
  }).then(swal => {
    if (swal.isConfirmed === true) {
      commonExecuteApi({
        queryId: "SPPCB0020_DELETE_01",
        list: deleteParams,
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    }
  })
}

// 메일 발송
const sendMail = async () => {
  let mailParams = {
    EMAIL: [],
    SUBJECT: '[HiSEs] 산업안전보건위원회 안건 조치결과(진행사항) 작성 요청',
    CONTENT: `
    <div>
      <span>
        산업안전보건위원회 관련, 개선조치 미완료 또는 진행 건에 대하여 안내 드리오니, 각 안건별 현재까지 개선 진행 사항 또는 개선조치 결과 업데이트 바랍니다.<br/>
        <br/>
        1. 산업안전보건위원회 안건 협의 결과<br/>
        &nbsp;검토부서에 해당하는 산업안전보건위원회 목록 표: 년도/분기/상정안건 항목/상정 주체/안건 내용/협의결과
        <br/>
        <br/>
        2. 요청사항<br/>
        &nbsp;- 팝업 내 조치결과(현재 진행사항 포함) 및 관련 자료(사진파일 변환 후 업데이트) 등록<br/>
        &nbsp;&nbsp;1) 조치 진행 중 : 진행사항에 대해 업데이트 및 관련 보고서 또는 계획서(사진파일 변환 후 업데이트) 등록<br/>
        &nbsp;&nbsp;2) 조치 완료 : 조치 결과 업데이트 및 완료 사항을 증명할 수 있는 자료(사진파일 변환 후 업데이트) 등록<br/>
        <br/>
        3. 관련문의 : 안전보건지원부 김태송 책임(3-8691)
      </span>
    </div>
    `
  }

  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  if (checkedRows.length === 0) {
    return Message.warn(t('선택된 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    await commonSearchApi({
      queryId : 'SPPCB0010_SEARCH_02',
      param: {
        CMPNY_DIV: data.CMPNY_DIV,
        DEPT_CD: data.REVIEW_DEPT_CD
      }
    }).then(async res => {
      for (let i of res.ORESULT_CUR) {
        let emailList = []
        emailList.push(i.EMAIL)

        mailParams.EMAIL = emailList
      }

      await commonSendApi(mailParams).then((res) => {
        Message.success(t('메일이 전송되었습니다.'))
      })
    })


  }
}

// 셀 더블 클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  if (data.TASK_SEQ) {
    sPPCB0020Popup01.value.openPopup({ TASK_SEQ: data.TASK_SEQ })
  }
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="isAdmin ? ['btnSearch', 'btnFormDownload', 'btnExcelUpload', 'btnExcelDownload', 'btnSendMail'] : ['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-select 
              v-model="searchParams.YEAR"
              :label="$t('연도')"
              width="220px"
              type="YEAR_ALL"
            />
            <i-select 
              v-model="searchParams.CMPNY_DIV"
              :label="$t('회사')"
              :items="codeList.CMPNY_DIV"
              item-title="TXT"
              item-value="COD"
              width="220px"
              readonly
            />
            <!-- <i-input
              v-model="searchParams.BU"
              :label="$t('BU')"
              width="220px"
            /> -->
            <!-- <i-input
              v-model="searchParams.PROPOSER"
              :label="$t('안건상정주체')"
              width="220px"
            />
            <i-input
              v-model="searchParams.KEYWORD"
              :label="$t('키워드')"
              width="220px"
            /> -->
            <i-select
              v-model="searchParams.QUARTER"
              :label="$t('분기')"
              width="220px"
              :items="codeList.QUARTER"
              item-title="TXT"
              item-value="COD"
            />
          </div>
        </v-sheet>
        <!-- 메인그리드 -->
        <v-sheet class="h-auto">
          <IGridTitle
            ref="menuTitle"
            :button-list="isAdmin ? ['btnDelete'] : []"
            :title="$t('산업안전보건위원회 협의결과 목록')"
            @click-button="onButtonsClick"
          />
          <RealGrid
            ref="grdMain"
            :gridViewOption="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <!-- 상세팝업 -->
    <SPPCB0020Popup01 ref="sPPCB0020Popup01" @closePopup="onButtonsClick({ id: 'btnSearch' })"/>

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
    min-height: 700px;
  }
}

</style>