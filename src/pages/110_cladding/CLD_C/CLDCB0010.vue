<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, commonSendApi } from '@hiway/api/commonApi'
import deleteFlowHelper from '@/utils/deleteFlowHelper'

defineOptions({
  name: '110_cladding-CLD_C-CLDCB0010',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const deptPopup = ref(null)
const fileUploadPopup = ref(null)
let mailData = []
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  DEPT_NM: userStore.asgnNm, //소속명
  BSNS_CD: userStore.bsnsCd, //사업부코드
  DEPT_CD: userStore.deptCd, //부서코드
  //DEPT_CD: 'N090', //부서코드
  //BSNS_CD: 'AN00', //사업부코드
  YEAR: new Date().getFullYear(), //해당년도
  REQ_CHA: '', //신청시기
  REQ_DATE_FROM: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), //신청일자FROM
  REQ_DATE_TO: dayjs().format('YYYY-MM-DD'), //신청일자 TO
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
  STATUS: [], //신청상태
  CLOTHE_GUBUN: [], //피복종류
  CLOTHE_SIZE: [], //사이즈
  REQ_REASON: [], //신청사유
})

const initCodeList = () => {
  Promise.all([
    //신청시기
    getCodeList('HHIT050'),
    //피복사이즈
    getCodeList('HHIT100'),
    //신청사유
    getCodeList('HHIT110'),
    //지급기준
    getCodeList('HHIT080'),
    //신청상태
    getCodeList('HHIT120'),
  ]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
    codeList.CLOTHE_SIZE = res[1].ORESULT_CUR
    codeList.REQ_REASON = res[2].ORESULT_CUR
    codeList.STANDARD = res[3].ORESULT_CUR
    codeList.STATUS = res[4].ORESULT_CUR
    codeList.REQ_CHA.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('CLOTHE_SIZE', codeList.CLOTHE_SIZE, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REQ_REASON', codeList.REQ_REASON, 'COD', 'TXT')
    grdMain.value.setBindingColumn('STANDARD', codeList.STANDARD, 'COD', 'TXT')
    grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('소속') },
    },
    {
      fieldName: 'EMP_NO',
      width: '15',
      header: { text: t('사번') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'REQ_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('신청일') },
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('직책') },
    },
    {
      fieldName: 'OFFI_RES_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('직책보임일자') },
    },
    {
      fieldName: 'CLOTHE_GUBUN',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column',
      header: { text: t('피복종류') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'GET_CLOTHE_DATE',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('최근피복 수령일') },
    },
    {
      fieldName: 'STANDARD',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('지급기준') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'CLOTHE_SIZE',
      dataType: 'text',
      width: '20',
      styleName: 'editable_column',
      header: { text: t('사이즈') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REQ_COUNT',
      dataType: 'number',
      numberFormat: '#',
      width: '20',
      editor: {
        type: 'number',
        maxIntegerLength: '1',
        textAlignment: 'far',
      },
      styleName: 'editable_column',
      header: { text: t('신청수량') },
    },
    {
      fieldName: 'REQ_REASON',
      dataType: 'text',
      width: '40',
      styleName: 'editable_column',
      header: { text: t('신청사유') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('첨부') },
      isFile: { value: true, showAlways: true },
    },
    {
      fieldName: 'PAYMENT_DATE',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      styleName: 'editable_column',
      width: '40',
      editButtonVisibility: 'always',
      header: { text: t('지급일자') },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
      },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('신청상태') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'PRINT_YN',
      width: '20',
      header: { text: t('출력여부') },
    },
    {
      fieldName: 'REMARKS',
      width: '70',
      styleName: 'editable_column-left',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },
    {
      fieldName: 'ASGN_CD',
      visible: false,
      header: { text: t('조직코드') },
    },
    {
      fieldName: 'BSNS_CD',
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'USER_DIV',
      visible: false,
      header: { text: t('조직구분') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('해당년도') },
    },

    {
      fieldName: 'REQ_CHA',
      visible: false,
      header: { text: t('신청시기') },
    },
    {
      fieldName: 'REQ_SEQ',
      visible: false,
      header: { text: t('신청 SEQ') },
    },
    {
      fieldName: 'EMAIL',
      visible: false,
      header: { text: t('신청자 메일주소') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  let day = dayjs().format('MM-DD')
  //오늘 월-일과 비교해서 7월1일 이후면 하반기 아니면 상반기
  if (day >= '07-01') {
    searchParam.REQ_CHA = '1'
  } else {
    searchParam.REQ_CHA = '0'
  }
  initCodeList()
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(beforeSearch).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave01).setQuery(saveData01).setAfter(afterSave01).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete01).setQuery(deleteData01).setAfter(afterDelete01).run()
  } else if (btn.id === 'btnPaymentComplete') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('지급완료 하시겠습니까?')
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .run()
  } else if (btn.id === 'btnTurnBack') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('반려 하시겠습니까?')
      .setBefore(beforeSave03)
      .setQuery(saveData03)
      .setAfter(afterSave03)
      .run()
  } else if (btn.id === 'btnCancelPrint') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('출력 취소 하시겠습니까?')
      .setBefore(beforeSave04)
      .setQuery(saveData04)
      .setAfter(afterSave04)
      .run()
  }
}

//출력취소 관련 로직 시작
const beforeSave04 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('출력취소할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const saveData04 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      REQ_SEQ: data.REQ_SEQ,
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'CLDCB0010_SAVE_04',
    list: saveParam,
  })
}

const afterSave04 = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//출력취소 관련 로직 끝

//조회관련 로직 시작
const beforeSearch = () => {
  //2025.06.27 김현재 작성
  //신청일자의 년도가 다르면 쿼리단에서 대상여부 판단을 하지못함
  //ex) 신청일자 FROM이 2024-12-01 이고 신청일자 TO가 2025-01-03일때 년도가 다르므로 대상여부 판단하지 못해서 같은년도로만 조회되도록 함
  let YEAR_FROM = searchParam.REQ_DATE_FROM.substring(0, 4)
  let YEAR_TO = searchParam.REQ_DATE_TO.substring(0, 4)
  if (YEAR_FROM !== YEAR_TO) {
    Message.warn(t('신청일자는 같은 년도로만 조회가능합니다.'))
    return false
  }
  return true
}
const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDCB0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  //피복종류 조회
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USER_DIV: searchParam.USER_DIV,
    //REQ_CHA: searchParam.REQ_CHA,
  }
  commonSearchApi({
    queryId: 'CLDBA0010_SEARCH_98',
    param: param,
  }).then((res) => {
    codeList.CLOTHE_GUBUN = res.ORESULT_CUR
    grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT')
  })
}
//조회관련 로직 끝

//삭제관련 로직 시작
const beforeDelete01 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS === '30') {
      Message.warn(t('지급완료된건은 삭제할 수 없습니다.'))
      return false
    }
  }
  return true
}

const deleteData01 = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      REQ_SEQ: data.REQ_SEQ,
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'CLDCB0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

//저장관련 로직 시작
const beforeSave01 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }

  return true
}

const saveData01 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      REQ_SEQ: data.REQ_SEQ, //수시신청SEQ
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      REQ_CHA: data.REQ_CHA, //신청시기
      YEAR: data.YEAR, //해당년도
      EMP_NO: data.EMP_NO, //사번
      REQ_DATE: data.REQ_DATE, //신청일자
      CLOTHE_GUBUN: data.CLOTHE_GUBUN, //피복종류
      CLOTHE_SIZE: data.CLOTHE_SIZE, //피복사이즈
      REQ_COUNT: data.REQ_COUNT, //신청수량
      REQ_REASON: data.REQ_REASON, //신청사유
      PAYMENT_DATE: data.PAYMENT_DATE, //지급일자
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDCB0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//지급완료 관련 로직 시작
const beforeSave02 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS !== '20') {
      Message.warn(t('신청완료인 데이터만 지급완료 가능합니다.'))
      return false
    }
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  mailData = []
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    mailData.push(data) //지급완료후 신청자에게 메일 보내기 위해서 복사항
    let saveData = {
      REQ_SEQ: data.REQ_SEQ, //수시신청SEQ
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      REQ_CHA: data.REQ_CHA, //신청시기
      YEAR: data.YEAR, //해당년도
      EMP_NO: data.EMP_NO, //사번
      REQ_DATE: data.REQ_DATE, //신청일자
      PAYMENT_DATE: data.PAYMENT_DATE, //신청일자
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'CLDCB0010_SAVE_02',
    list: saveParam,
  })
}

const afterSave02 = (res) => {
  for (let i = 0; i < mailData.length; i++) {
    let clotheGubun = codeList.CLOTHE_GUBUN.find((x) => x.COD == mailData[i].CLOTHE_GUBUN).TXT
    let sendMailParam = {
      EMAIL: [mailData[i].EMAIL], //신청자
      SUBJECT: '수시 피복신청', //메일제목
      CONTENT: `
      요청하신 ${clotheGubun} 피복 지급승인 처리 되었습니다.<br>
      <br>
      보건 - 피복 - 수시신청 메뉴에서 출력하여 피복센터 방문하시면 됩니다.<br>
      <br>
    `,
    }
    commonSendApi(sendMailParam)
  }

  onButtonsClick({ id: 'btnSearch' })
}
//지급완료 로직 끝

//반려 관련 로직 시작
const beforeSave03 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS !== '20') {
      Message.warn(t('신청완료인 데이터만 반려 가능합니다.'))
      return false
    } else if (!data.REMARKS) {
      Message.warn(t('반려사유(비고)를 입력해주세요.'))
      return false
    }
  }
  return true
}

const saveData03 = () => {
  let saveParam = []
  mailData = []

  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    mailData.push(data) //반려후 신청자에게 메일 보내기 위해서 복사함
    let saveData = {
      REQ_SEQ: data.REQ_SEQ, //신청SEQ
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      REQ_CHA: data.REQ_CHA, //신청시기
      YEAR: data.YEAR, //해당년도
      EMP_NO: data.EMP_NO, //사번
      REQ_DATE: data.REQ_DATE, //신청일자
      REMARKS: data.REMARKS, //비고(반려사유)
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDCB0010_SAVE_03',
    list: saveParam,
  })
}

//반려하면 신청자에게 반려되었다고 메일 발송
const afterSave03 = () => {
  for (let i = 0; i < mailData.length; i++) {
    let clotheGubun = codeList.CLOTHE_GUBUN.find((x) => x.COD == mailData[i].CLOTHE_GUBUN).TXT
    let sendMailParam = {
      EMAIL: [mailData[i].EMAIL], //신청자
      SUBJECT: '수시 피복신청', //메일제목
      CONTENT: `
      요청하신 ${clotheGubun} 피복 반려되었습니다.<br>
      <br>
      반려사유 : ${mailData[i].REMARKS}<br>
      <br>
    `,
    }
    commonSendApi(sendMailParam)
  }
  onButtonsClick({ id: 'btnSearch' })
}
//반려 관련 로직 끝

//부서팝업 오픈
const openDeptPopup = () => {
  deptPopup.value.openPopup({})
}

//부서 선택 이벤트
const selectedDept = (val) => {
  searchParam.DEPT_NM = val.ASGN_FULL_NM
  searchParam.BSNS_CD = val.BSNS_CD
  searchParam.DEPT_CD = val.DEPT_CD
  onButtonsClick({ id: 'btnSearch' })
}

//그리드 셀 클릭 이벤트 첨부컬럼 셀을 클릭하면 파일 업로드 팝업을 띄운다.
const onCellButtonClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  //파일아이디 없을때 파일아이디 저장
  if (!data.FILE_ID) {
    fileUploadPopup.value.setGuid()
    let fileID = fileUploadPopup.value.guid
    grdMain.value.getDataProvider().setValue(col.dataRow, 'FILE_ID', fileID)
    grdMain.value.getGridView().checkItem(col.dataRow, true)
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(data.FILE_ID)
  }
}

const clearDeptcd = () => {
  searchParam.DEPT_NM = '전체'
  searchParam.DEPT_CD = ''
  searchParam.BSNS_CD = ''
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete', 'btnPaymentComplete', 'btnTurnBack', 'btnCancelPrint']"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('소속')"
              readonly
              width="250px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openDeptPopup"
              v-model="searchParam.DEPT_NM"
            >
              <template #append-inner>
                <v-icon icon="mdi-window-close" @click="clearDeptcd" />
              </template>
            </i-input>
            <i-select :label="$t('해당년도')" width="170px" v-model="searchParam.YEAR" type="YEAR" />
            <i-select
              :label="$t('신청시기')"
              width="170px"
              v-model="searchParam.REQ_CHA"
              :items="codeList.REQ_CHA"
              item-title="TXT"
              item-value="COD"
            >
            </i-select>
            <i-input
              type="date"
              label-width="50px"
              :label="$t('신청일자')"
              width="200px"
              v-model="searchParam.REQ_DATE_FROM"
              class="mr-0"
            >
            </i-input>
            <span class="mx-2 mt-2">~</span>
            <i-input type="date" width="150px" v-model="searchParam.REQ_DATE_TO"> </i-input>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellButtonClicked"
            @onCellEdited="onCellEdited"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <IUploadPopup ref="fileUploadPopup" :file-dan="true"></IUploadPopup>
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
