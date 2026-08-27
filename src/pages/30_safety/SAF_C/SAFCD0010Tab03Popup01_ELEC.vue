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
  selectFunction,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)
const fileUploadPopup = ref(null)
const userStore = useUserStore()
const readOnlyValue = ref(false) //점검시간 readonly 플래그
const title = ref('PTW대상작업 점검결과 등록')
const emit = defineEmits(['closePopup'])
const ptwField = reactive({
  RCV_NO: '', //허가서번호
  WORK_ID: '', //작업지시No
  P_WRK_ID: '', //PTW대상 ID
  CMPNY_DIV: '', //회사
  BSNS_CD: '', //사업부코드
  ASGN_FULL_NM: '', //소속이름
  RESP_EMP_NM: '', //작업책임자(정)-이름
  RESP_EMP_NO: '', //작업책임자(정)-사번
  MNGR_EMP_NO: '', //관리감독자 사번
  MNGR_EMP_NM: '', //관리감독자 성명
  WORK_DATE: '', //작업일
  WORK_TIME: '', //작업시간
  WRK_PLC: '', //공종/계열
  DANG_DIV: '', //위험작업분류 코드
  DANG_DIV_NM: '', //위험작업분류명
  WORK_TITLE: '', //작업명
  RISK_LPLC: '', //작업내용 대분류
  RISK_MPLC: '', //작업내용 소분류
  CF_DIV: '', //대면/현장허가 여부
  CF_DIV_NM: '', //전산,대면,현장
  AREA_NM: '', //작업장소
  AREA_DETAIL: '', //작업장소상세
  CHECK_DATE: '', //점검일시
  CHECK_TIME: '', //점검시간
  CHECK_DIV: '', //3중점검여부
  MODIFY: '', //등록,수정플래그값
})

const codeList = reactive({
  CMPNY_DIV: [], //작업사업부
  WRK_DIV: [], //공종계열
  CHECK_GROUP: [], //그룹
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'ASGN_FULL_NM',
      dataType: 'text',
      editable: false,
      width: '150',
      header: { text: t('점검자 소속') },
    },
    {
      fieldName: 'CHECK_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검자') },
    },
    {
      fieldName: 'CHECK_EMP_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'CHECK_GROUP',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('그룹') },
    },
  ],
  columns: [],
})

const grdSubProps = reactive({
  fields: [
    {
      fieldName: 'CHECK_DESC',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('점검항목') },
      styleName: 'left-column',
    },
    {
      fieldName: 'OK',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: '1',
        falseValues: '0',
      },
      header: { text: t('양호') },
    },
    {
      fieldName: 'NG',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: '0',
        falseValues: '1',
      },
      header: { text: t('불량') },
    },
    {
      fieldName: 'CHECK_DEFECT',
      dataType: 'text',
      styleName: 'editable_column left-column',
      header: { text: t('점검내용') },
    },
    {
      fieldName: 'CHECK_PIC',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('사진첨부') },
      isFile: { value: true, showAlways: true },
    },

    {
      fieldName: 'CHECK_SEQ',
      dataType: 'text',
      visible: false,
      header: { text: t('점검내용SEQ') },
    },
    {
      fieldName: 'P_WRK_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('PTW대상 ID') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

onMounted(() => {})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {

  let today = dayjs();
    if (today.diff(dayjs(ptwField.WORK_DATE), 'day') >= 7 ){
      Message.warn(t('일주일 이전의 데이터는 수정 불가능합니다.'))
      return false
    }



  if (!ptwField.CHECK_TIME) {
    Message.warn(t('작업일시는 필수값입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let grdSubData = grdSub.value.getDataProvider().getJsonRows()
  let grdMainData = grdMain.value.getFocusedRowData()
  for (let i = 0; i < grdSubData.length; i++) {
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv, //사업장
      WORK_ID: ptwField.WORK_ID, //작업지시No
      RCV_NO: ptwField.RCV_NO, //허가서No
      CHECK_EMP_NO: grdMainData.CHECK_EMP_NO, //점검자 사번
      P_WRK_ID: 'P000000', //PTW 대상 ID
      CHECK_SEQ: grdSubData[i].CHECK_SEQ, //점검내용No
      CHECK_GROUP: grdMainData.CHECK_GROUP, //점검그룹
      CHECK_RESULT:
        grdSubData[i].OK === '1' ? grdSubData[i].OK : grdSubData[i].NG, //점검결과
      CHECK_DEFECT: grdSubData[i].CHECK_DEFECT, //불량내용
      CHECK_DEPT_CD: userStore.deptCd, //점검자 부서
      CHECK_BSNS_CD: userStore.bsnsCd, //점검자 사업부
      CHECK_ASGN_CD: userStore.asgnCd, //점검자 소속
      CHECK_PIC: grdSubData[i].CHECK_PIC, //첨부파일ID
      CHECK_DATE: ptwField.CHECK_DATE, //점검일시
      CHECK_TIME: ptwField.CHECK_TIME, //점검시간
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCD0010_SAVE06_ELEC',
    list: saveParam,
  })
}

const afterSave = () => {
  aftersavePopup_save()
}
//저장관련 로직 끝

// 등록버튼 눌렀을때
const openPopup = (data) => {
  vm.$nextTick(() => {
    initCodeList()

    for (const [key, value] of Object.entries(data)) {
      if (ptwField.hasOwnProperty(key)) {
        ptwField[key] = value
      }
    }
    defaultDate()
    initGrdMain(data)
    initGrdSub(data)
  })
  dialog.value = true
  
  console.log('openpopup ptwField 1 ', ptwField )
    
  console.log('openpopup CHECK_DATE  ', ptwField.CHECK_DATE )
  console.log('openpopup WORK_DATE ', ptwField.WORK_DATE )





}

// 더블클릭 했을때 
const openPopup2 = (data) => {
  console.log('받은데이터', data)
  vm.$nextTick(() => {
    initCodeList()
    for (const [key, value] of Object.entries(data)) {
      if (ptwField.hasOwnProperty(key)) {
        ptwField[key] = value
      }
    }
    defaultDate()
    title.value = 'PTW대상작업 점검결과 수정2'
    modifyGrdMain()
    modifyGrdSub()
    dialog.value = true
  })
  menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화

  console.log('openpopup ptwField 2', ptwField )
}

// //수정시 점검자 리스트 조회
const modifyGrdMain = () => {
  let param = {
    CMPNY_DIV: ptwField.CMPNY_DIV, //사업장
    WORK_ID: ptwField.WORK_ID, //작업지시 ID
    RCV_NO: ptwField.RCV_NO, //허가서No
    P_WRK_ID: ptwField.P_WRK_ID === null ? 'P000000' : ptwField.P_WRK_ID, //PTW 대상 ID
  }
  console.log('파람', param)
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH94_ELEC',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setFocus(0)
  })
}

//수정시 점검결과 조회
const modifyGrdSub = () => {
  let param = {
    CMPNY_DIV: ptwField.CMPNY_DIV, //사업장
    WORK_ID: ptwField.WORK_ID, //작업지시 ID
    RCV_NO: ptwField.RCV_NO, //허가서No
    // 일렉
    P_WRK_ID:'P000000', //PTW 대상 ID
  }
  console.log('수정시 조회 점검결과 조회파람', param)
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH93_ELEC',
    param: param,
  }).then((res) => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      if (res.ORESULT_CUR[i].CHECK_RESULT === '1') {
        grdSub.value
          .getDataProvider()
          .setValue(i, 'OK', res.ORESULT_CUR[i].CHECK_RESULT)
      } else {
        grdSub.value
          .getDataProvider()
          .setValue(i, 'NG', res.ORESULT_CUR[i].CHECK_RESULT)
      }
    }
  })
}

//점검자 리스트 세팅(등록버튼 눌렀을때 로그인유저 세팅)
const initGrdMain = (data) => {
  let grdMainRow = {
    CHECK_DEPT_NM: '',
    CHECK_ASGN_NM: '',
    CHECK_EMP_NM: '',
    CHECK_EMP_NO: '',
    CHECK_GROUP: '',
  }
  grdMainRow.CHECK_DEPT_NM = userStore.deptNm
  grdMainRow.CHECK_ASGN_NM = userStore.asgnNm
  grdMainRow.CHECK_EMP_NM = userStore.empNm
  grdMainRow.CHECK_EMP_NO = userStore.empNo
  //로그인 유저가 어떤 권한을 가지고 있는지 체크한다.
  selectFunction({
    queryId: 'GET_AUTH_GRADE',
    EMP_NO: userStore.empNo,
  }).then((res) => {
    let grade = res.ORESULT_CUR
    if (grade === 'A0') {
      //안전요원
      grdMainRow.CHECK_GROUP = 'A0'
      grdMain.value.addRow(grdMainRow)
    }
    //관리감독자
    else if (grade === 'B0') {
      grdMainRow.CHECK_GROUP = 'B0'
      grdMain.value.addRow(grdMainRow)
    }
    //협력사 관리감독자
    else if (grade === 'B1') {
      grdMainRow.CHECK_GROUP = 'B1'
      grdMain.value.addRow(grdMainRow)
    }
    //세잎클로버
    else if (grade === 'C0') {
      grdMainRow.CHECK_GROUP = 'C0'
      grdMain.value.addRow(grdMainRow)
    }
    //협력사 안전요원
    else if (grade === 'C1') {
      grdMainRow.CHECK_GROUP = 'C1'
      grdMain.value.addRow(grdMainRow)
    } else if (grade === 'E0') {
      //기타
      grdMainRow.CHECK_GROUP = 'E0'
      grdMain.value.addRow(grdMainRow)
    }
    //퇴사자 또는 미확인
    else {
      grdMainRow.CHECK_GROUP = 'Z0'
      grdMain.value.addRow(grdMainRow)
    }
    grdMain.value.getGridView().setFocus(0)
  })
}

// //안전요원
// if (userStore.deptCd === 'N090' && userStore.bsnsCd === 'AN00') {

//   grdMain.value.addRow(grdMainRow)
//   return false
// }
// //관리감독자
// else if (data.MNGR_EMP_NO === userStore.empNo) {
//   grdMainRow.CHECK_EMP_NM = data.MNGR_EMP_NM
//   grdMainRow.CHECK_EMP_NO = data.MNGR_EMP_NO
//   grdMainRow.CHECK_GROUP = 'B0'
//   grdMain.value.addRow(grdMainRow)
//   return false
// }
// //세잎클로버
// else if (userStore.authGrpCd.includes('GRP00393')) {
//   grdMainRow.CHECK_EMP_NM = userStore.empNm
//   grdMainRow.CHECK_EMP_NO = userStore.empNo
//   grdMainRow.CHECK_GROUP = 'C0'
//   grdMain.value.addRow(grdMainRow)
//   return false
// } else {
//   //기타
//   grdMainRow.CHECK_EMP_NM = userStore.empNm
//   grdMainRow.CHECK_EMP_NO = userStore.empNo
//   grdMainRow.CHECK_GROUP = 'E0'
//   grdMain.value.addRow(grdMainRow)
// }

//P_WORK_ID에 해당하는 체크리스트 불러오기(등록버튼 눌렀을때)
const initGrdSub = (data) => {
  setTimeout(() => {
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      P_WRK_ID: !data.P_WRK_ID ? 'P000000' : data.P_WRK_ID, //P_WRK_ID가 없으면 P000000으로 조회함
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH95',
      param: param,
    }).then((res) => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }, 300)
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'),
    getCodeList('HHIE150'),
    getCodeList('HHIP050'),
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.WRK_DIV = res[1].ORESULT_CUR
    codeList.CHECK_GROUP = res[2].ORESULT_CUR
    grdMain.value.setBindingColumn(
      'CHECK_GROUP',
      codeList.CHECK_GROUP,
      'COD',
      'TXT'
    )
  })
}

const defaultDate = () => {

    // 점검일은 작업일과  동일해야함!!!!!! 무조건. 



    ptwField.CHECK_DATE = ptwField.WORK_DATE




   //let date = dayjs()

    // date.get('year') +
    // '-' +
    // (date.get('month') + 1).toString().padStart(2, '0') +
    // '-' +
    // date.get('date').toString().padStart(2, '0')
}

const aftersavePopup_save = () => {
  for (let i in ptwField) {
    ptwField[i] = ''
  }
  grdMain.value.getDataProvider().setRows(null)
  grdSub.value.getDataProvider().setRows(null)
  menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화
  title.value = 'PTW대상작업 점검결과 등록'
  emit('closePopup')
  dialog.value = false
}


const closePopup = () => {
  for (let i in ptwField) {
    ptwField[i] = ''
  }
  grdMain.value.getDataProvider().setRows(null)
  grdSub.value.getDataProvider().setRows(null)
  menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화
  title.value = 'PTW대상작업 점검결과 등록'
  //emit('closePopup')
  dialog.value = false
}





//파일첨부 관련 로직 시작
const onCellButtonClicked = (grid, index, col) => {
  let data = grdSub.value.getDataProvider().getJsonRow(index.dataRow)
  //파일아이디 없을때 파일아이디 저장
  if (!data.CHECK_PIC) {
    fileUploadPopup.value.setGuid()
    let fileID = fileUploadPopup.value.guid
    grdSub.value.getDataProvider().setValue(col.dataRow, 'CHECK_PIC', fileID)
    grdSub.value.getGridView().checkItem(col.dataRow, true)
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(data.CHECK_PIC)
  }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.fieldName === 'OK') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'NG', '1')
  }
  if (clickData.fieldName === 'NG') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'OK', '0')
  }
}
//파일첨부 관련 로직 끝

const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  if (!title.value.includes('등록')) {
    //등록할때는 행을 변경할 이유가 없음
    let row = grdMain.value.getDataProvider().getJsonRow(newIdx)
    // 점검자 리스트에서 본인 사번과 일치하지 않으면 저장버튼 비활성화
    // 일단은 점검자가 달라서 저장버튼은 활성화 시킨다.
    if (row.CHECK_EMP_NO !== userStore.empNo) {
      menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 비활성화
    } else {
      menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화
    }
    //고위험점검항목 조회 파라미터
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      WORK_ID: ptwField.WORK_ID === !ptwField.WORK_ID ? ' ' : ptwField.WORK_ID,
      RCV_NO: ptwField.RCV_NO,
      P_WRK_ID:
        ptwField.P_WRK_ID === !ptwField.P_WRK_ID
          ? 'P000000'
          : ptwField.P_WRK_ID,
      CHECK_EMP_NO: row.CHECK_EMP_NO,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH93_ELEC',
      param: param,
    }).then((res) => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      for (let i = 0; i < res.ORESULT_CUR.length; i++) {
        if (res.ORESULT_CUR[i].CHECK_RESULT === '1') {
          grdSub.value
            .getDataProvider()
            .setValue(i, 'OK', res.ORESULT_CUR[i].CHECK_RESULT)
        } else {
          grdSub.value
            .getDataProvider()
            .setValue(i, 'NG', res.ORESULT_CUR[i].CHECK_RESULT)
        }
      }
    })
    //점검자별 점검등록 시간 조회
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH91',
      param: param,
    }).then((res) => {
      console.log('시간', res)
      if (res.ORESULT_CUR.length > 0) {
        ptwField.CHECK_TIME = res.ORESULT_CUR[0].CHECK_TIME
      }
    })
  }
}

//점검시간 최대값은 현재시각
//점검날짜가 오늘날짜면 현재시각 이후로 설정 불가능
const checkMaxTime = () => {
  let today = dayjs().format('YYYY-MM-DD')
  if (ptwField.CHECK_DATE === today) {
    let max = dayjs().$H + ':' + dayjs().$m
    if (ptwField.CHECK_TIME > max) {
      ptwField.CHECK_TIME = max
    }
  }
}

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ title }} </span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <v-sheet class="searchArea">
          <div>
            <div class="sheetTitle">작업정보</div>
            <div style="color: blue; font-size: medium;"> ※ 작업일시 기준 1주일 이전의 데이터는 수정이 불가합니다  </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('허가서번호')"
                top-label
                v-model="ptwField.RCV_NO"
                readonly
              ></i-input>
              <i-select
                width="200px"
                :label="$t('작업조직')"
                top-label
                :items="codeList.CMPNY_DIV"
                item-title="TXT"
                item-value="COD"
                v-model="ptwField.CMPNY_DIV"
                readonly
              ></i-select>
              <i-input
                width="200px"
                class="mt-5"
                v-model="ptwField.ASGN_FULL_NM"
                readonly
              ></i-input>
              <i-input
                width="150px"
                :label="$t('작업책임자')"
                top-label
                v-model="ptwField.RESP_EMP_NM"
                readonly
              ></i-input>
              <i-input
                width="150px"
                :label="$t('관리감독자')"
                top-label
                readonly
                v-model="ptwField.MNGR_EMP_NM"
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('작업일시')"
                top-label
                v-model="ptwField.WORK_DATE"
                readonly
              ></i-input>
              <i-input
                width="200px"
                top-label
                v-model="ptwField.WORK_TIME"
                readonly
              ></i-input>
              <i-input
                width="200px"
                :label="$t('작업장소')"
                top-label
                v-model="ptwField.AREA_NM"
                readonly
              ></i-input>
              <i-input
                width="320px"
                :label="$t('상세위치')"
                top-label
                v-model="ptwField.AREA_DETAIL"
                readonly
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('위험작업분류')"
                top-label
                v-model="ptwField.DANG_DIV_NM"
                readonly
              ></i-input>
              <i-input
                width="420px"
                :label="$t('작업명')"
                top-label
                v-model="ptwField.WORK_TITLE"
                readonly
              ></i-input>
              <i-select
                width="200px"
                :label="$t('공종/계열')"
                top-label
                readonly
                :items="codeList.WRK_DIV"
                item-title="TXT"
                item-value="COD"
                v-model="ptwField.WRK_PLC"
              ></i-select>
              <i-input
                width="200px"
                :label="$t('허가구분')"
                top-label
                v-model="ptwField.CF_DIV_NM"
                readonly
              ></i-input>
              <i-input
                width="200px"
                :label="$t('3중점검여부')"
                top-label
                v-model="ptwField.CHECK_DIV"
                readonly
                v-if="false"
              >
              </i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="150px"
                :label="$t('점검일시')"
                top-label
                v-model="ptwField.CHECK_DATE"
                required
                readonly
              ></i-input>


              <i-input
                width="150px"
                top-label
                type="time"
                v-model="ptwField.CHECK_TIME"
                @input="checkMaxTime"
              ></i-input>
            </div>
          </div>
        </v-sheet>
        <div class="d-flex">
          <v-sheet width="40%" class="mr-3">
            <IGridTitle :title="$t('점검자 리스트')"> </IGridTitle>
            <RealGrid
              ref="grdMain"
              :fields="grdMainProps.fields"
              style="height: 300px"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
            />
          </v-sheet>
          <v-sheet width="60%">
            <IGridTitle :title="$t('점검 결과')"> </IGridTitle>
            <RealGrid
              ref="grdSub"
              :fields="grdSubProps.fields"
              style="height: 300px"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
              @onCellItemClicked="onCellButtonClicked"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <IUploadPopup ref="fileUploadPopup"></IUploadPopup>
  </v-dialog>
</template>

<style scoped lang="scss">
.sheetTitle {
  font-size: 20px;
  font-weight: bold;
}
</style>
