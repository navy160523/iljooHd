<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest2 } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import CLDBC0010Popup01 from './CLDBC0010Popup01.vue'
import CLDBC0010Popup02 from './CLDBC0010Popup02.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useCommonStore } from '@hiway/stores/common'
import { getJsonFromExcel } from '@/utils/excel'
import dayjs from 'dayjs'
defineOptions({
  name: '110_cladding-CLD_B-CLDBC0010',
})

const userStore = useUserStore()
const commonStore = useCommonStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const dateAllInput = ref(null) //일자일괄입력
const cLDBC0010Popup01 = ref(null)
const cLDBC0010Popup02 = ref(null) //개인별지급이력 팝업

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  YEAR: new Date().getFullYear(), //년도
  USER_DIV: '', //조직구분
  BSNS_CD: '', //사업부
  REQ_DIV: '', //신청구분
  REQ_CHA: '', //신청시기
})

const codeList = reactive({
  USER_DIV: [], //조직구분
  BSNS_CD: [], //사업부
  REQ_DIV: [], //신청구분
  REQ_CHA: [], //신청시기
  CLOTHE_GUBUN: [], //피복종류
  CLOTHE_SIZE: [], //사이즈
  STANDARD: [], //지급기준
  STATUS: [], //신청상태
})

const initCodeList = () => {
  Promise.all([
    //신청시기
    getCodeList('HHIT050'),
    //신청구분
    getCodeList('HHIT090'),
    //사업부
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //조직구분
    getCodeList('HHIZ020'),

    //피복종류
    //getCodeList('HHIT060'),
    //지급기준
    getCodeList('HHIT080'),
    //피복사이즈
    getCodeList('HHIT100'),
    //신청상태
    getCodeList('HHIT120'),
    commonSearchApi({
      queryId: 'CLDBA0010_SEARCH_98',
      param: { CMPNY_DIV: userStore.cmpnyDiv, USER_DIV: '', REQ_CHA: '' },
    }),
  ]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
    codeList.REQ_DIV = res[1].ORESULT_CUR
    codeList.BSNS_CD = res[2].ORESULT_CUR
    //단기공사,기타 제외
    codeList.USER_DIV = res[3].ORESULT_CUR.filter((x) => !['Z', 'D'].includes(x.COD))
    codeList.STANDARD = res[4].ORESULT_CUR
    codeList.CLOTHE_SIZE = res[5].ORESULT_CUR
    codeList.STATUS = res[6].ORESULT_CUR
    codeList.CLOTHE_GUBUN = res[7].ORESULT_CUR
    codeList.REQ_DIV.unshift({ TXT: '전체', COD: '' })
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.USER_DIV.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('REQ_DIV', codeList.REQ_DIV, 'COD', 'TXT') // 신청구분
    grdMain.value.setBindingColumn('USER_DIV', codeList.USER_DIV, 'COD', 'TXT') // 조직구분
    grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT') // 피복종류
    grdMain.value.setBindingColumn('STANDARD', codeList.STANDARD, 'COD', 'TXT') // 지급기준
    grdMain.value.setBindingColumn('CLOTHE_SIZE', codeList.CLOTHE_SIZE, 'COD', 'TXT') // 피복사이즈
    grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT') // 진행상태
    grdMain.value.setBindingColumn('REQ_CHA', codeList.REQ_CHA, 'COD', 'TXT') // 신청시기
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'REQ_DIV',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('신청구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REQ_CHA',
      editable: false,
      width: '60',
      header: { text: t('신청시기') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'USER_DIV',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('조직구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('재직구분') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '350',
      editable: false,
      header: { text: t('소속') },
      styleName: 'left-column',
    },
    {
      fieldName: 'EMP_NO',
      width: '70',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('직책') },
    },
    {
      fieldName: 'OFFI_RES_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직책보임일자') },
    },
    {
      fieldName: 'CLOTHE_GUBUN',
      dataType: 'text',
      width: '180',
      editable: false,
      header: { text: t('피복종류') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'GET_CLOTHE_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('최근피복수령일') },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      width: '70',
      editable: false,
      header: { text: t('신청상태') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },

    {
      fieldName: 'STANDARD',
      dataType: 'text',
      width: '60',
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
      width: '50',
      editable: false,
      header: { text: t('사이즈') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REQ_COUNT',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('신청수량') },
    },
    {
      fieldName: 'PAYMENT_DATE',
      dataType: 'text',
      datetimeFormat: 'yyyy-MM-dd',
      width: '100',
      styleName: 'editable_column',
      header: { text: t('지급일자') },
      editButtonVisibility: 'always',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        textReadOnly: true,
        mask: {
          editMask: '9999-99-99',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'REMARKS',
      width: '200',
      styleName: 'editable_column-left',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('신청년도') },
    },
    {
      fieldName: 'REQ_SEQ',
      visible: false,
      header: { text: t('신청SEQ') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
  let day = dayjs().format('MM-DD')
  //현재날짜가 상반기인지 하반기인지
  if (day >= '07-01') {
    searchParam.REQ_CHA = '1'
  } else {
    searchParam.REQ_CHA = '0'
  }
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave01).setQuery(saveData01).setAfter(afterSave01).run()
  } else if (btn.id === 'btnPaymentComplete') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('지급완료 하시겠습니까?')
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .run()
  } else if (btn.id === 'btnReturn') { // 반납
    new saveFlowHelper(vm, t)
      .setConfirmMessage('반납 하시겠습니까?')
      .setBefore(beforeSave03)
      .setQuery(saveData03)
      .setAfter(afterSave03)
      .run()
  } else if (btn.id === 'btnPersonalHistorySearch') {
    cLDBC0010Popup02.value.openPopup()
  } else if (btn.id === 'btnFinalOutput') {
    excelDownFinalOutput()
  } else if (btn.id === 'btnExcelDownload') {
    //운영
    let params = {
      FILE_PATH: 'CLDB',
      FILE_NAME: '정기신청관리 엑셀양식.xlsx',
    }
    //로컬 테스트용
    // let params = {
    //   PATH: '',
    //   FILE_PATH: '',
    //   FILE_NAME: '정기신청관리 엑셀양식.xlsx',
    // }
    commonSampleDownFilesApi(params).catch((res) => {
      Message.err(res)
    })
  } else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function (event) {
      const selectedFile = event.target.files[0]
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  } else {
    excelDownPrint()
  }
}

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
      REQ_SEQ: data.REQ_SEQ, //신청 SEQ
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      REQ_CHA: data.REQ_CHA, //신청시기
      YEAR: data.YEAR, //신청년도
      EMP_NO: data.EMP_NO, //사번
      USER_DIV: data.USER_DIV, //조직구분
      PAYMENT_DATE: data.PAYMENT_DATE, //피복지급일
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDBC0010_SAVE_01',
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
    if (data.STATUS === '30') {
      Message.warn(t('지급완료된 건이 있습니다.'))
      return false
    }
  }
  return true
}

const saveData02 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      REQ_SEQ: data.REQ_SEQ, //신청 SEQ
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      REQ_CHA: data.REQ_CHA, //신청시기
      YEAR: data.YEAR, //신청년도
      EMP_NO: data.EMP_NO, //사번
      USER_DIV: data.USER_DIV, //조직구분
      PAYMENT_DATE: data.PAYMENT_DATE, //피복지급일
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDBC0010_SAVE_02',
    list: saveParam,
  })
}

const afterSave02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const beforeSave03 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS !== '30') {
      Message.warn(t('지급완료건만 반납 가능합니다.'))
      return false
    }
  }
  return true
}

const saveData03 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      REQ_SEQ: data.REQ_SEQ,      // 신청 SEQ
      CMPNY_DIV: data.CMPNY_DIV,  // 사업장구분
      REQ_CHA: data.REQ_CHA,      // 신청시기
      YEAR: data.YEAR,            // 신청년도
      EMP_NO: data.EMP_NO,        // 사번
      USER_DIV: data.USER_DIV,    // 조직구분
      USER_ID: userStore.userId,  // 로그인유저 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDBC0010_SAVE_03',
    list: saveParam,
  })
}

const afterSave03 = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//지급완료 관련 로직 끝

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDBC0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회관련 로직 끝

//일자일괄입력 버튼클릭 이벤트
const btnDateAllInput = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('일괄입력할 데이터를 선택해주세요.'))
    return false
  } else if (!dateAllInput.value) {
    Message.warn(t('일괄입력할 날짜를 선택해주세요'))
    return false
  }

  for (let index of checkedData) {
    grdMain.value.getDataProvider().setValue(index, 'PAYMENT_DATE', dateAllInput.value)
  }
}

//비고일괄입력 버튼클릭 이벤트
const btnRemarkAllInput = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('일괄입력할 데이터를 선택해주세요.'))
    return false
  }
  cLDBC0010Popup01.value.openPopup()
}

const allInputRemark = (val) => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let index of checkedData) {
    grdMain.value.getDataProvider().setValue(index, 'REMARKS', val)
  }
}

//최종산출
const excelDownFinalOutput = () => {
  commonStore.loading = true
  commonRequest2('hse/excel/CLD_FINAL_OUTPUT', searchParam).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })

    const link = document.createElement('a')
    let bsnsCd = codeList.BSNS_CD.find((x) => x.BSNS_CD === searchParam.BSNS_CD).BSNS_NM
    let reqDiv = codeList.REQ_DIV.find((x) => x.COD === searchParam.REQ_DIV).TXT
    let reqCha = codeList.REQ_CHA.find((x) => x.COD === searchParam.REQ_CHA).TXT
    let bsnsNm = bsnsCd === '전체' ? '' : bsnsCd
    let reqDivNm = reqDiv === '전체' ? '' : reqDiv + '신청'
    let reqChaNm = reqCha === '전체' ? '' : reqCha
    const fileName = `현황 - ${bsnsNm} ${searchParam.YEAR}년도 ${reqDivNm.trim()} ${reqChaNm} 최종산출`.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

//출력
const excelDownPrint = () => {
  commonStore.loading = true
  commonRequest2('hse/excel/CLD_PRINT', searchParam).then((res) => {
    commonStore.loading = false

    let bsnsCd = codeList.BSNS_CD.find((x) => x.BSNS_CD === searchParam.BSNS_CD).BSNS_NM
    let reqDiv = codeList.REQ_DIV.find((x) => x.COD === searchParam.REQ_DIV).TXT
    let reqCha = codeList.REQ_CHA.find((x) => x.COD === searchParam.REQ_CHA).TXT
    let bsnsNm = bsnsCd === '전체' ? '' : bsnsCd
    let reqDivNm = reqDiv === '전체' ? '' : reqDiv + '신청'
    let reqChaNm = reqCha === '전체' ? '' : reqCha
    const fileName = `현황 - ${bsnsNm} ${searchParam.YEAR}년도 ${reqDivNm.trim()} ${reqChaNm} 지급현황`.trim()
    const blob = new Blob([res], { type: res.type })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

//엑셀업로드
const excelUploadCallback = async (excelData) => {
  commonStore.loading = true //로딩바 추가
  let mappedItemArray = []
  if (excelData.length === 0) {
    Message.err('엑셀 데이터를 입력해주세요.')
    commonStore.loading = false
    return false
  }
  for (let i = 0; i < excelData.length; i++) {
    const item = excelData[i]
    //모든 엑셀 데이터 검증후에 행추가
    if (!item.신청년도) {
      Message.err(i + 2 + '번 행의 신청년도가 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.신청시기) {
      Message.err(i + 2 + '번 행의 신청시기가 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.사번) {
      Message.err(i + 2 + '번 행의 사번이 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.지급일자) {
      Message.err(i + 2 + '번 행의 지급일자가 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    } else if (!item.조직구분) {
      Message.err(i + 2 + '번 행의 조직구분이 누락되었습니다.')
      commonStore.loading = false
      return false // 함수 종료
    }
    let REQ_CHA = ''
    if (item.신청시기.includes('상반기')) {
      REQ_CHA = '0' //상반기
    } else {
      REQ_CHA = '1' //하반기
    }
    let USER_DIV = ''
    if (item.조직구분.includes('직영')) {
      USER_DIV = 'A' // 직영
    } else {
      USER_DIV = 'B' // 협력사
    }
    /*   
    2025.06.30 김현재 작성
    엑셀에서 지급일자를 yyyy-mm-dd 형태로 입력하고 엑셀 업로드를 했을때    
    자바스크립트에서는 하루전 23시 59분 08초로 인식을함....
    예를들어 지급일자를 2025.06.30으로 입력을하고 업로드를 하면 
    자바스크립트에서는 2025.06.29 23시 59 08초로 인식을함
    그래서 1분을 더하는 로직을 추가함
    */
    let date = dayjs(item.지급일자).add(1, 'minute')
    let formattedDate = date.format('YYYY-MM-DD')

    // 필요한 데이터 매핑 후 추가
    mappedItemArray.push({
      YEAR: item.신청년도,
      REQ_CHA: REQ_CHA,
      EMP_NO: item.사번,
      PAYMENT_DATE: formattedDate,
      USER_DIV: USER_DIV,
      USER_ID: userStore.userId,
      REMARKS: item.비고,
    })
  }
  for (let i = 0; i < mappedItemArray.length; i++) {
    grdMain.value.addRow(mappedItemArray[i])
  }
  commonStore.loading = false //로딩바 닫기
  Message.info('엑셀 업로드가 완료되었습니다.')
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="[
          'btnSearch',
          'btnUpdate',
          'btnPaymentComplete',
          'btnReturn',
          'btnPersonalHistorySearch',
          'btnFinalOutput',
          'btnPrint',
          'btnExcelDownload',
          'btnExcelUpload',
        ]"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('년도')" width="150px" v-model="searchParam.YEAR" type="YEAR"> </i-select>
            <i-select
              :label="$t('조직구분')"
              width="170px"
              v-model="searchParam.USER_DIV"
              :items="codeList.USER_DIV"
              item-title="TXT"
              item-value="COD"
            >
            </i-select>
            <i-select
              :label="$t('사업부')"
              width="200px"
              v-model="searchParam.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              label-width="50px"
            >
            </i-select>
            <i-select
              :label="$t('신청구분')"
              width="170px"
              v-model="searchParam.REQ_DIV"
              :items="codeList.REQ_DIV"
              item-title="TXT"
              item-value="COD"
            >
            </i-select>
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
              :label="$t('지급일자 일괄입력')"
              width="260px"
              label-width="110px"
              v-model="dateAllInput"
            ></i-input>
            <v-btn @click="btnDateAllInput">지급일자 일괄입력</v-btn>
            <v-btn @click="btnRemarkAllInput">비고일괄입력</v-btn>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <CLDBC0010Popup01 ref="cLDBC0010Popup01" @allInputRemark="allInputRemark"></CLDBC0010Popup01>
  <CLDBC0010Popup02 ref="cLDBC0010Popup02"> </CLDBC0010Popup02>
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
