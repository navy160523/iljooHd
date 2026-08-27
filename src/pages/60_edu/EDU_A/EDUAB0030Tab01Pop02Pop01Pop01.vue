<!--
  화면명 : 설문지 전송(팝업)
  화면개요 : 선택한 설문지를 메일로 보내거나 QR코드를 출력할 수 있는 화면.
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  getCodeList,
  commonExecuteApi,
  commonSendApi,
  commonRequest,
} from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { getJsonFromExcel } from '@/utils/excel'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import OZReport from '@/components/OZReport.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import EDUAB0030Tab01Pop02Pop01 from '@/pages/60_edu/EDU_A/EDUAB0030Tab01Pop02Pop01.vue'
import _ from 'lodash'
import { VTextField } from 'vuetify/lib/components/index.mjs'
import { getQDomain } from '@/utils/common'

//***************************************************세팅 영역*********************************************************/
// #1 START ----------------------------------------------------
// Report Name Name.ozr
const reportName = ref('')

const printParams = ref([])

// OzReport 팝업 여부
const showOz = ref(false)

// #1 END ------------------------------------------------------
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const grdSub = ref(null)
const emit = defineEmits([])
let _Parameters = reactive({})
const searchParams = reactive({
  DIVISION: '', //구분
  CURR_NM: '', //교육명
  CURR_ID: '', //교육 아이디
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: '', //년도
  KIND: '', //설문지종류
  SUVY_TITLE: '', //선택된 설문지 제목
  SUVY_ID: '', //선택된 설문지 ID
  SUVY_DIVISION: 'B', //설문지구분(B == '교육')
  SCHEDULE_ID: '', // 교육번호
})

const codeList = reactive({
  division: [], //분류
  //grp: []        //설문지
})

//설문지 목록
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
  },
  fields: [
    {
      fieldName: 'DIVISION_NM',
      dataType: 'text',
      header: { text: t('설문지 구분') },
      editable: false,
    },
    {
      fieldName: 'TITLE',
      dataType: 'text',
      header: { text: t('설문지 제목') },
      editable: false,
    },
    {
      fieldName: 'SUVY_DESC',
      dataType: 'text',
      header: { text: t('설문지 설명') },
      editable: false,
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      header: { text: t('설문지 사용유무') },
      editable: false,
    },
    //비활성화
    { fieldName: 'YEAR', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SUVY_ID', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', visible: false },
    { fieldName: 'KIND', dataType: 'text', visible: false },
    { fieldName: 'DIVISION', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'MODIFY_YN', dataType: 'text', visible: false },
  ],
  columns: [],
})

//설문지 문항 목록
const grdSubProps = reactive({
  gridViewOption: {
    checkBar: { visible: false },
    stateBar: { visible: false },
  },
  fields: [
    {
      fieldName: 'QSTN_TITLE',
      dataType: 'text',
      header: { text: t('설문 문항') },
      editable: false,
    },
    {
      fieldName: 'QSTN_CATEGORY_NM',
      dataType: 'text',
      header: { text: t('카테고리') },
      editable: false,
    },
    {
      fieldName: 'QSTN_TYPE_NM',
      dataType: 'text',
      header: { text: t('문항 유형') },
      editable: false,
    },
    {
      fieldName: 'ESNTL_YN',
      dataType: 'text',
      header: { text: t('필수 여부') },
      editable: false,
    },

    //비활성화
    { fieldName: 'QSTN_TYPE', dataType: 'text', visible: false },
    { fieldName: 'QSTN_CATEGORY', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'QSTN_ID', dataType: 'text', visible: false },
    { fieldName: 'SUVY_DIV', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'QSTN_CONTENTS', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCodeList('HHID010'), //분류
    //commonSearchApi({ queryId : 'EDUAB0030_TAB1_POP2_POP1_POP1_SEARCH_05', param : {CMPNY_DIV : userStore.cmpnyDiv} })
    // 2024.07.08 박용훈 설문지 ID 와 TITLE를 세팅 추가
    commonSearchApi({
      queryId: 'EDUAB0030_TAB1_POP2_POP1_POP1_SEARCH_06',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        SCHEDULE_ID: searchParams.SCHEDULE_ID,
        YEAR: searchParams.YEAR,
      },
    }),
  ]).then((res) => {
    //console.log("레스 확인",res)
    codeList.division = res[0].ORESULT_CUR

    // 2024.07.24 박용훈 설문지 ID 와 TITLE가 NULL 일경우 초기화 추가
    // 2024.07.08 박용훈 설문지 ID 와 TITLE를 세팅 추가
    //searchParams.SUVY_TITLE = res[1].ORESULT_CUR[0].SUVY_TITLE
    //searchParams.SUVY_ID = res[1].ORESULT_CUR[0].SUVY_ID
    if (isNullCheck(res[1].ORESULT_CUR[0])) {
      searchParams.SUVY_TITLE = ''
      searchParams.SUVY_ID = ''
    }else{
      searchParams.SUVY_TITLE = res[1].ORESULT_CUR[0].SUVY_TITLE
      searchParams.SUVY_ID = res[1].ORESULT_CUR[0].SUVY_ID
    }
  })
}

//*************************************************세팅 영역(종료)*********************************************************/

//***************************************************이벤트 영역*********************************************************/
const openPopup = (data) => {
  //console.log("설문지 전송 팝업 데이터 받아옴",data)
  _Parameters = data
  searchParams.DIVISION = data.DIVISION
  searchParams.CURR_NM = data.CURR_NM
  searchParams.CURR_ID = data.CURR_ID
  searchParams.YEAR = data.YEAR
  // 2024.07.08 추가
  searchParams.SCHEDULE_ID = data.SCHEDULE_ID

  //

  gridRefresh()
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

//버튼 클릭 이벤트
const onButtonsClick = (btn) => {
  if (btn.id == 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchMain)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnQrCodePrint') {
    onBtnQrCodePrint()
  } else if (btn.id === 'btnSendMail') {
    onbtnSendMail()
  } else if (btn.id === 'btnClose') {
    dialog.value = false
  } else if (btn.id === 'btnSelectSurvey') {
    onBtnSelectSurvey()
  }
}

//QR코드 출력 버튼 클릭 이벤트
const onBtnQrCodePrint = async () => {
  if (isNullCheck(searchParams.SUVY_ID)) {
    Message.warn(t('선택된 설문지가 없습니다.'))
    return
  }

  reportName.value = '/manage/hse/EDUAB0030_TAB01_POP01_01.ozr'

  let sTITLE = _Parameters.YEAR + '년 ' + _Parameters.CURR_NM
  let sEDATE_FROM =
    isNullCheck(_Parameters.EDATE_FROM) === true ? '' : _Parameters.EDATE_FROM
  let sEDATE_TO =
    isNullCheck(_Parameters.EDATE_TO) === true ? '' : _Parameters.EDATE_TO
  let sEDU_DATE = ''
  let sURL = ''

  var userOs = navigator.userAgent.replace(/ /g, '')
  //console.log("유저 OS",userOs)
  var osVersion = false
  //console.log("포함 확인",userOs.includes("WindowsNT10.0"))
  if (userOs.includes('WindowsNT10.0') == true) {
    osVersion = true
  }
  if (osVersion) {
    //2024.07.08 박용훈 주소 변경
    /*
    sURL += 'https://hse.hhi.co.kr/Pages/WD/DB1098W.aspx?'
    sURL += 'CMPNY_DIV=' + _Parameters.cmpnyDiv +
            '&SCHEDULE_ID=' + _Parameters.SCHEDULE_ID +
            '&YEAR=' + _Parameters.YEAR +
            '&EDUTIME_SERIAL=' + _Parameters.EDUTIME_SERIAL
    */
    sURL =
      getQDomain() +
      '/#/survey?CMPNY_DIV=' +
      _Parameters.CMPNY_DIV +
      '&SCHEDULE_ID=' +
      _Parameters.SCHEDULE_ID +
      '&YEAR=' +
      _Parameters.YEAR +
      '&EDUTIME_SERIAL=' +
      _Parameters.EDUTIME_SERIAL +
      '&DIVISION=' +
      _Parameters.DIVISION +
      '&SUVY_ID=' +
      searchParams.SUVY_ID
 

    await commonRequest(
      '/hse/slm/',
      {
        orgLinkUrl: sURL,
        shortLinkUrl: getQDomain(),
      },
      "post", // HTTP 메서드
      "application/json;charset=utf8", // Content-Type
      { apiVersion: "1.0.0" } // meta 정보
    ).then(res => {

      sURL = res.body
    })
    if (sEDATE_TO.length > 0 && sEDATE_FROM !== sEDATE_TO) {
      sEDU_DATE = '교육일자 : ' + sEDATE_FROM + ' ~ ' + sEDATE_TO
    } else {
      sEDU_DATE = '교육일자 : ' + sEDATE_FROM
    }
  } else {
    MessageBox.Show('지원하지 않는 OS입니다. Windows 10 PC에서 출력하세요.')
    return
  }

  printParams.value = [
    'TITLE=' + sTITLE,
    'EDU_DATE=' + sEDU_DATE,
    'URL=' + sURL,
  ]
  showOz.value = true
}

const onbtnSendMail = async () => {
  if (isNullCheck(searchParams.SUVY_ID)) {
    Message.warn(t('통보할 설문지를 선택해주세요.'))
    return
  }
  let ck = ''
  ck = await vm.$swal({
    title: t('설문 이메일을 전송 하시겠습니까?'),
    showCancelButton: true,
  })
  if (ck.isConfirmed === false) {
    return
  }

  // 설문조사 URL 생성
  let sURL = ''
  sURL =
    getQDomain() +
    '/#/survey?CMPNY_DIV=' +
    _Parameters.CMPNY_DIV +
    '&SCHEDULE_ID=' +
    _Parameters.SCHEDULE_ID +
    '&YEAR=' +
    _Parameters.YEAR +
    '&EDUTIME_SERIAL=' +
    _Parameters.EDUTIME_SERIAL +
    '&DIVISION=' +
    _Parameters.DIVISION +
    '&SUVY_ID=' +
    searchParams.SUVY_ID

  let param = { originalURL: sURL }
  // URL을 단축 URL로 변경
  await commonRequest(
      '/hse/slm/',
      {
        orgLinkUrl: sURL,
        shortLinkUrl: getQDomain(),
      },
      "post", // HTTP 메서드
      "application/json;charset=utf8", // Content-Type
      { apiVersion: "1.0.0" } // meta 정보
    ).then(res => {

    sURL = res.body
  })

  // 메일 발송할 인원 파라메트
  let searchData = {
    CMPNY_DIV: _Parameters.CMPNY_DIV,
    YEAR: _Parameters.YEAR,
    SCHEDULE_ID: _Parameters.SCHEDULE_ID,
    EDUTIME_SERIAL: _Parameters.EDUTIME_SERIAL,
  }

  // 메일 발송 인원 쿼리 실행
  commonSearchApi({
    queryId: 'EDUAB0030_TAB1_POP2_POP1_POP1_SEARCH_03',
    param: searchData,
  }).then((res) => {
    //console.log("통보 레스 확인",res)

    // 메일 발송 내용
    let sMSG = `<br><br>안녕하십니까?<br><br>`
    sMSG += `<br><br><span style='color: #ff0000'>${_Parameters.CURR_NM}</span>`
    sMSG += `<span>이수자를 대상으로 교육만족도 설문을 진행하고자 합니다.</span><br><br>
    교육품질 향상을 위해 소중한 의견을 부탁 드리며, 아래 ‘설문시작’을 클릭하여 설문을 작성해 주십시오.<br><br>
    작성된 설문은 무기명으로 등록됩니다. 감사합니다.<br><br><br><br>`

    // 메일 제목
    let sTITLE = _Parameters.CURR_NM + '에 대한 설문 요청 드립니다.'
    // let iFAIL_CNT = 0
    // let iSUCC_CNT = 0
    // let sFAIL_ID = ''

    // let data = {
    //   CMPNY_DIV : 'HHI',
    //   SCHEDULE_ID : '202404080001',
    //   EDUTIME_SERIAL : '1',
    //   YEAR : '2024',
    //   TARGET_KEY : 'testKey'
    // }

    // let sMSG2 = sMSG + "<a href='http://localhost:5173/#/80_operation/OPR_A/OPRAH0050?CMPNY_DIV="+ 'HHI' +
    //                 '&SCHEDULE_ID=' + '202404080001' + '&EDUTIME_SERIAL=' + '1' + '&YEAR=' + '2024' +
    //                 '&TARGET_KEY=' + 'testKey' + '&CURR_ID=' + searchParams.CURR_ID +
    //                 '&DIVISION='+ searchParams.DIVISION + '&SUVY_ID=' + searchParams.SUVY_ID +
    //                 '&SUVY_TITLE=' + searchParams.SUVY_TITLE +
    //                 "' target='_self' style='font: bold red;'>설문 시작</a><br><br>"

    // 메일 내용 최종 합히기
    sMSG =
      sMSG +
      `<a href=${sURL} target='_self' style='font: bold red;'>설문 시작</a><br><br>`

    // 받는사람 세팅
    const mails = []
    if (res.ORESULT_CUR.length > 0) {
      res.ORESULT_CUR.forEach((val) => {
        if (val.EMAIL) {
          mails.push(val.EMAIL)
        }
      })
    }

    // 메일 발송 파라메트
    let sendParams = {
      EMAIL: mails,
      SUBJECT: sTITLE,
      CONTENT: sMSG,
    }
    //console.log("샌드파람 확인",sendParams)

    // 메일 발송
    commonSendApi(sendParams).then((res) => {
      Message.success(t('메일이 전송되었습니다.'))
    })

    // if(res.ORESULT_CUR.length > 0){

    //   res.ORESULT_CUR.forEach(val => {
    //     console.log("발 확인",val)
    //     let sTARGET_ID = isNullCheck(val.TARGET_ID) === true ? '' : val.TARGET_ID
    //     let sMSG2 = sMSG + "<a href="+ sURL + "' target='_self' style='font: bold red;'>설문 시작</a><br><br>"

    //   let sendParams = {
    //     EMAIL   :'',
    //     SUBJECT : sTITLE,
    //     CONTENT : sMSG2,
    //   }
    //     commonSendApi(sendParams)
    //   })
    // }
  })
}

//설문지 선택 버튼 클릭 이벤트
const onBtnSelectSurvey = () => {
  let focusedRow = grdMain.value.getFocusedRowData()
  if (isNullCheck(focusedRow)) {
    Message.warn(t('사용할 설문지를 선택해 주세요.'))
    return
  }

  let saveParams = {
    CMPNY_DIV: focusedRow.CMPNY_DIV,
    YEAR: focusedRow.YEAR,
    SCHEDULE_ID: _Parameters.SCHEDULE_ID,
    SUVY_ID: focusedRow.SUVY_ID,
  }
  //console.log("포커스드 로우",focusedRow)
  commonExecuteApi({
    queryId: 'EDUAB0030_TAB1_POP2_POP1_POP1_SAVE_01',
    list: [saveParams],
  }).then((res) => {
    //console.log("저장 후 레스 확인",res)
    if (res.list.length > 0) {
      searchParams.SUVY_TITLE = focusedRow.TITLE
      searchParams.SUVY_ID = res.list[0].SUVY_ID

      Message.success(t('저장되었습니다.'))
    }
  })
}

//교육장 목록 ROW 클릭 이벤트
const grdMainRowChanged = (grid, index, clickData) => {
  // 2024.08.14 박용훈 getGridView().getValues -> getRowData 변경
  // let rowData = grdMain.value.getGridView().getValues(clickData)
  let rowData = grdMain.value.getRowData(clickData)
  grdSubSearch(rowData)
}

// //교육장 목록 ROW 더블 클릭 이벤트
// const grdMainRowDblClick = (grid, clickData) => {
//   console.log("더블클릭 데이터",clickData)
//   let rowData = grdMain.value.getGridView().getValues(clickData.dataRow)
//   console.log("로우데이터 확인",rowData)
//   emit('onSelect', rowData)
//   dialog.value = false
// }

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
  grdSub.value.getDataProvider().setRows([])
}

const isNullCheck = (val) => {
  return val === undefined || val === null || val === '' ? true : false
}
//************************************************이벤트 영역(종료)*********************************************************/

//***************************************************조회 영역**************************************************************/
//설문지 목록 조회
const searchMain = () => {
  let searchParam = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    YEAR: searchParams.YEAR,
    DIVISION: searchParams.SUVY_DIVISION,
    //USE_YN : 'Y',
  }
  return commonSearchApi({ queryId: 'OPRAH0010_SEARCH_01', param: searchParam })
}

// 설문지 목록 조회 후 데이터 처리
const afterSearch = async (res) => {
  //console.log('afterSearch : ', res)
  let pushData = []
  for (let i = 0; i < res.ORESULT_CUR.length; i++) {
    await commonSearchApi({
      queryId: 'OPRAH0010_SEARCH_07',
      param: { SUVY_ID: res.ORESULT_CUR[i].SUVY_ID },
    }).then((res2) => {
      if (res2.ORESULT_CUR[0].CNT > 0) {
        pushData.push(res.ORESULT_CUR[i])
      }
    })
  }
  grdMain.value.getDataProvider().setRows(pushData)
}

const grdSubSearch = (data) => {
  if (isNullCheck(data)) {
    return
  }
  //console.log("서브그리드 서치할 데이터",data)
  let searchData = {
    SUVY_ID: data.SUVY_ID,
  }
  commonSearchApi({ queryId: 'OPRAH0010_SEARCH_03', param: searchData }).then(
    (res) => {
      //console.log("서브그리드 조회 결과",res)
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  )
}

//*************************************************조회 영역(종료)**********************************************************/

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
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>설문지 전송</span>
    </v-sheet>
    <v-card class="pa-0 flex-column rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="popupButtons"
          :use-permission="false"
          :button-list="[
            'btnSearch',
            'btnQrCodePrint',
            'btnSendMail',
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <v-sheet class="d-flex searchArea">
          <i-select
            :label="$t('구분')"
            leftLabel
            v-model="searchParams.DIVISION"
            :items="codeList.division"
            item-title="TXT"
            item-value="COD"
            width="190px"
            readonly
          />
          <i-input
            :label="$t('이름')"
            leftLabel
            v-model="searchParams.CURR_NM"
            width="400px"
            readonly
          />
          <i-input
            :label="$t('선택된 설문지')"
            leftLabel
            v-model="searchParams.SUVY_TITLE"
            width="400px"
            readonly
          />
        </v-sheet>
        <div class="d-flex" style="height: 85%">
          <v-sheet width="55%" class="flex-column mr-10">
            <div class="d-flex h-auto">
              <IGridTitle
                :title="$t('설문지 목록')"
                ref="popupButtons"
                :use-permission="false"
                :button-list="['btnSelectSurvey']"
                @click-button="onButtonsClick"
              >
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grdMain"
                :grid-view-option="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCurrentRowChanged="grdMainRowChanged"
              />
            </div>
          </v-sheet>
          <v-sheet width="45%" class="flex-column">
            <div class="d-flex h-auto" style="align-items: baseline">
              <IGridTitle :title="$t('설문지 문항 목록')">
                <template #editors />
              </IGridTitle>
            </div>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <OZReport
    :showPop="showOz"
    :reportName="reportName"
    :params="printParams"
    @close="showOz = $event"
  />
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (430px));
  overflow-y: auto;
  // > div {
  //   // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
  //   // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
  //   min-height: 700px;
  // }
}
</style>
