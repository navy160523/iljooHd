<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import {
  commonDownloadFilesApi,
  commonBigUploadFilesApi,
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUpload from '@/components/IUpload.vue'
import { lowerCase } from 'lodash-es'
import SAFDC0010_02Tab01Popup from './SAFDC0010_02Tab01Popup_ELEC.vue'
import IUploadImage from '@/components/IUploadImage.vue'
import IGridTitle from '@/components/IGridTitle.vue'
const imageUpload = ref(null)
defineOptions({
  name: '30_safety-SAF_D-SAFDC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const gridTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const sAFDC0010_02_Tab01_Popup = ref(null)
const { sliSAFDC0010_02Tab01 } = history.state

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업부
  TYPE: 'A', //
  ACT_YN: '',
  ACT_EMP_NO: '',
  GUBUN: 'A',
  NOTI_CHK: 'Y', //점검일자 옆 체크박스
  NOTI_FROM: '', //점검일자 FROM
  NOTI_TO: '', //점검일자 TO
  //BSNS_CD: sliSAFDC0010_02Tab01 === undefined ? userStore.bsnsCd : sliSAFDC0010_02Tab01.BSNS_CD, //사업부
  SEND_DEPT_CD: sliSAFDC0010_02Tab01 === undefined ? '' : sliSAFDC0010_02Tab01.DEPT_CD, //부서
  SEND_BSNS_CD: sliSAFDC0010_02Tab01 === undefined ? userStore.bsnsCd : sliSAFDC0010_02Tab01.BSNS_CD, //사업부
  //SEND_ASGN_CD: sliSAFDC0010_02Tab01 === undefined ? userStore.asgnCd : sliSAFDC0010_02Tab01.ASGN_CD, //팀
  //REC_ASGN_CD: sliSAFDC0010_02Tab01 === undefined ? userStore.asgnCd : sliSAFDC0010_02Tab01.ASGN_CD, //팀
  REC_BSNS_CD: sliSAFDC0010_02Tab01 === undefined ? userStore.bsnsCd : sliSAFDC0010_02Tab01.BSNS_CD, //사업부
  REC_DEPT_CD: sliSAFDC0010_02Tab01 === undefined ? '' : sliSAFDC0010_02Tab01.DEPT_CD, //부서
  SUBJECT_CD: '', //분야
  REQ_REPLY_CHK: sliSAFDC0010_02Tab01 === undefined ? 'Y' : 'N', //회신요구일 옆 체크박스
  REQ_REPLY_FROM: '', //회신요구일 FROM
  REQ_REPLY_TO: '', //회신요구일 TO
  SAGO_DIV_M: '', //사고유형
  STATUS: '', //진행상태
})
//협력사 설정
const setAsgnCombo = () =>{
  codeList.ASGN = [{ ASGN_CD : '', ASGN_NM : '전체' }]
  commonSearchApi({ queryId : 'searchTeam', param: paramList }).then(res => {
    res.ORESULT_CUR.forEach(element => {
      codeList.ASGN.push(element)
    })
  })
}

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),   
    //사고유형조회
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_05',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
    //진행상태조회
    getCodeList('HHIF190'),
    //분야조회
    getCodeList('HHIF120'),

    //팀 협력사 조회
    commonSearchApi({ 
      queryId : 'searchTeam', 
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.SEND_BSNS_CD, DEPT_CD: searchParam.SEND_DEPT_CD},
    }),

  ]).then((res) => {
    //codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.SEND_BSNS_CD = res[0].ORESULT_CUR //발신 사업부 추가
    codeList.REC_BSNS_CD = res[0].ORESULT_CUR  //수신 사업부 추가
    codeList.SEND_DEPT_CD = res[1].ORESULT_CUR //발신 부서 추가
    codeList.REC_DEPT_CD = res[1].ORESULT_CUR
    codeList.SAGO_DIV = res[2].ORESULT_CUR
    codeList.STATUS = res[3].ORESULT_CUR
    codeList.SUBJECT = res[4].ORESULT_CUR   
    codeList.SEND_ASGN_CD = res[5].ORESULT_CUR  //발신 팀 추가
    codeList.REC_ASGN_CD = res[5].ORESULT_CUR  //발신 팀 추가
    codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.SEND_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.REC_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.SAGO_DIV.unshift({ TXT: '전체', COD: '' })
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
    codeList.SUBJECT.unshift({ TXT: '전체', COD: '' })
  })
}

const codeList = reactive({
  //BSNS_CD: [], //사업부
  SEND_BSNS_CD: [], //발신 사업부
  SEND_DEPT_CD: [], //발신 부서
  REC_BSNS_CD: [], // 수신 사업부
  REC_DEPT_CD: [], // 수신 부서
  DEPT_CD: [], //부서
  SAGO_DIV: [], //사고유형
  STATUS: [], //진행상태
  SUBJECT: [], //분야
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'MNG_NO',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('관리번호') },
    },
    {
      fieldName: 'SEND_ASGN_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: 'left-column',
      header: { text: t('발신') },
    },
    {
      fieldName: 'REC_ASGN_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: 'left-column',
      header: { text: t('수신') },
    },
    {
      fieldName: 'PROBLEM_DESC',
      dataType: 'text',
      width: '300',
      editable: false,
      styleName: 'left-column',
      header: { text: t('문제점') },
    },
    {
      fieldName: 'NOTI_DT',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('점검일자') },
    },
    {
      fieldName: 'REQ_REPLY_DT',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('회신요구일자') },
    },
    {
      fieldName: 'STATUS_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('진행상태') },
    },
    {
      fieldName: 'ACT_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('회신일') },
    },
    {
      fieldName: 'CHK_EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('점검자') },
    },
    {
      fieldName: 'SHIP_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('호선번호') },
    },
    {
      fieldName: 'REJ_DESC',
      dataType: 'text',
      width: '100',
      visible: false,
      editable: false,
      header: { text: t('반려사유') },
    },
    {
      fieldName: 'COMPANY',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REASON',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'VEND_NAME',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_LPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_MPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_SPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_SCAN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REQUIRE_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_TEL_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'LOCATION_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_PLC_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REC_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_TITLE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEND_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEND_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_FACILITY_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('분야/대상설비') },
    },
    {
      fieldName: 'SAGO_DIV_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('사고유형') },
    },
    {
      fieldName: 'INSERT_USER_ID',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('작성자') },
    },
    {
      fieldName: 'REJECT_DESC',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('재조치요청사유') },
    },
    {
      fieldName: 'REC_DEPT_CD',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('수신조직 코드') },
    },
    {
      fieldName: 'APP_EMP_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('결제자사번') },
    },
    {
      fieldName: 'SAGO_DIV_L_CODE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M_CODE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S_CODE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_L_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_M_NM',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SAGO_DIV_S_NM',
      visible: false,
      header: { text: t('') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnMuniNotice') {
    
    //안전 직원 인원만 시정통보 가능하게 요청(10/11 엄정준책임)
    // if(userStore.bsnsCd == 'AN00' || (userStore.bsnsCd == 'AC00' && userStore.deptCd == 'C8K0')) {
    // if(userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('GRP00001') || userStore.authGrpCd.includes('HIWAYGRP00001')){
    //   sAFDC0010_02_Tab01_Popup.value.openPopup()
    // } else {
    //   return Message.warn(t('시정통보등록은 안전요원 인원만 가능합니다.'))
    // }

    sAFDC0010_02_Tab01_Popup.value.openPopup()

    
  } else {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_14',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  // console.log('main search res', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      MNG_NO: data.MNG_NO,
      REASON: '',
      USER_ID: userStore.userId,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//디폴트 날짜 설정 -7일~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -7일 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  if(sliSAFDC0010_02Tab01 === undefined) {
    searchParam.NOTI_FROM =
      dateFrom.$y +
      '-' +
      (dateFrom.$M + 1).toString().padStart(2, '0') +
      '-' +
      dateFrom.$D.toString().padStart(2, '0')

    searchParam.NOTI_TO =
      date.get('year') +
      '-' +
      (date.get('month') + 1).toString().padStart(2, '0') +
      '-' +
      date.get('date').toString().padStart(2, '0')
  } else {
    searchParam.NOTI_FROM = sliSAFDC0010_02Tab01.FROM_DT
    searchParam.NOTI_TO = sliSAFDC0010_02Tab01.TO_DT
  }

  searchParam.REQ_REPLY_FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.REQ_REPLY_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

onMounted(() => {
  defaultDate()
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

//셀 더블클릭 이벤트 관련 로직 시작
const onCellDblClicked = (grid, clickData) => {
  console.log('clickData', clickData)
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFDC0010_02_Tab01_Popup.value.openPopup2(data)
}
//셀 더블클릭 이벤트 관련 로직 끝

//팝업닫히면 재조회
const closedPoup = () => {
  onButtonsClick({ id: 'btnSearch' })
}


//발신 사업부 변경
watch(
  () => searchParam.SEND_BSNS_CD,
  
  (newValue, oldValue) => {
    //사업부변경시 부서가져옴
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.SEND_DEPT_CD = ''
        codeList.SEND_DEPT_CD = res.ORESULT_CUR
        codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      } else {
        codeList.SEND_DEPT_CD = res.ORESULT_CUR
        codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  },
  {
    immediate: true,
  }
)

//발신 부서 변경
watch(
  () => searchParam.SEND_DEPT_CD,
  (newValue, oldValue) => {
    //사업부변경시 부서가져옴
    commonSearchApi({
      queryId: 'searchTeam',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.SEND_BSNS_CD, DEPT_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.SEND_ASGN_CD = ''
        codeList.SEND_ASGN_CD = res.ORESULT_CUR
        codeList.SEND_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      } else {
        codeList.SEND_ASGN_CD = res.ORESULT_CUR
        codeList.SEND_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      }
    })
  },
  {
    immediate: true,
  }
)



//수신 사업부 변경
watch(
  () => searchParam.REC_BSNS_CD,
  (newValue, oldValue) => {
    //사업부변경시 부서가져옴
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.REC_DEPT_CD = ''
        codeList.REC_DEPT_CD = res.ORESULT_CUR
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      } else {
        codeList.REC_DEPT_CD = res.ORESULT_CUR
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  },
  {
    immediate: true,
  }
)

//수신 부서 변경
watch(
  () => searchParam.REC_DEPT_CD,
  (newValue, oldValue) => {
    //사업부변경시 부서가져옴
    commonSearchApi({
      queryId: 'searchTeam',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.REC_BSNS_CD, DEPT_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.REC_ASGN_CD = ''
        codeList.REC_ASGN_CD = res.ORESULT_CUR
        codeList.REC_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      } else {
        codeList.REC_ASGN_CD = res.ORESULT_CUR
        codeList.REC_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      }
    })
  },
  {
    immediate: true,
  }
)

// //발신 사업부 변경
// watch(
//   () => searchParam.BSNS_CD,
//   (newValue, oldValue) => {
//     //사업부변경시 부서가져옴
//     commonSearchApi({
//       queryId: 'searchDept3',
//       param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
//     }).then((res) => {
//       if (oldValue !== undefined) {
//         searchParam.REC_DEPT_CD = ''
//         codeList.DEPT_CD = res.ORESULT_CUR
//         codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
//       } else {
//         codeList.DEPT_CD = res.ORESULT_CUR
//         codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
//       }
//     })
//   },
//   {
//     immediate: true,
//   }
// )
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="gridTitle"
        :button-list="['btnSearch', 'btnMuniNotice', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <v-checkbox
              label="점검일자"
              class="mr-5"
              true-value="Y"
              false-value="N"
              v-model="searchParam.NOTI_CHK"
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.NOTI_FROM"
            ></i-input>
            <span class="mx-1 mt-2">~</span>
            <i-input
              width="150px"
              type="date"
              v-model="searchParam.NOTI_TO"
            ></i-input>
            <i-select
              label-width="70px"
              :label="$t('발신 사업부')"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :items="codeList.SEND_BSNS_CD"
              v-model="searchParam.SEND_BSNS_CD"
            ></i-select>
            <i-select
              :label="$t('부서')"
              width="200px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :items="codeList.SEND_DEPT_CD"
              v-model="searchParam.SEND_DEPT_CD"
            ></i-select>
            <i-select
              :label="$t('팀/협력사')"
              width="200px"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              :items="codeList.SEND_ASGN_CD"
              v-model="searchParam.SEND_ASGN_CD"
            ></i-select>
            <v-divider style="margin: 0 5px;" vertical />
            
            <!--사고유형(대,중,소) 구분변경으로 인해 조회불가 조회조건에서 제거
              엄정준책임 요청
            -->
            <!-- <i-select
              label-width="50px"
              :label="$t('사고유형')"
              width="200px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.SAGO_DIV"
              v-model="searchParam.SAGO_DIV_M"
            ></i-select> -->
            <i-select
              :label="$t('진행상태')"
              width="200px"
              labelWidth="50px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.STATUS"
              v-model="searchParam.STATUS"
            ></i-select>
            <i-select
              :label="$t('분야')"
              width="170px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.SUBJECT"
              v-model="searchParam.SUBJECT_CD"
            ></i-select>
          </div>
          <div class="d-flex">
            <v-checkbox
              label="회신요구일"
              class="mr-2"
              true-value="Y"
              false-value="N"
              v-model="searchParam.REQ_REPLY_CHK"
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.REQ_REPLY_FROM"
            ></i-input>
            <span class="mx-1 mt-2">~</span>
            <i-input
              width="150px"
              type="date"
              v-model="searchParam.REQ_REPLY_TO"
            ></i-input>
            <i-select
              label-width="70px"
              :label="$t('수신 사업부')"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :items="codeList.REC_BSNS_CD"
              v-model="searchParam.REC_BSNS_CD"
            ></i-select>
            <i-select
              :label="$t('부서')"
              width="200px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :items="codeList.REC_DEPT_CD"
              v-model="searchParam.REC_DEPT_CD"
            ></i-select>
            <i-select
              :label="$t('팀/협력사')"
              width="200px"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              :items="codeList.REC_ASGN_CD"
              v-model="searchParam.REC_ASGN_CD"
            ></i-select>
            <v-divider style="margin: 0 5px;" vertical />
            
          </div>
        </v-sheet>
        <v-sheet style="height: -webkit-fill-available">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFDC0010_02Tab01Popup
    ref="sAFDC0010_02_Tab01_Popup"
    @closed="closedPoup"
  ></SAFDC0010_02Tab01Popup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 345px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
