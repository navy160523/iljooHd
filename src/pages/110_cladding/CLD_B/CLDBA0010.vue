<script setup>
/*
  화면명 : 직영피복
  화면개요 : 직영조직의 정기 피복을 신청한다.
  작성자 : 일주지앤에스 SI3팀 김현재선임
  작성일 : 2025.01.17
*/
import { ref, reactive, onMounted, getCurrentInstance, computed, onUnmounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import searchFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import _ from 'lodash'
import dayjs from 'dayjs'
defineOptions({
  name: '110_cladding-CLD_B-CLDBA0010',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const deptPopup = ref(null)
const menuAdmin = ref(false) //관리자여부 플래그값
const deptChargeYn = ref(false) //부서별 담당자 관리자에 등록되어 있는지 여부
const dutyYn = ref(null)
const empPopup = ref(null)
let day = dayjs().format('MM-DD')
let deptChargeCd = [] //담당자가 들어왔을때 담당하고있는 부서코드를 가지고 있는 배열
/*
조회조건 라인에는 여러가지 값이 있지만
실제로 쿼리에서 WHERE절에 조회조건으로 사용되는 값들
사업장구분(CMPNY_DIV)
사업부코드(BSNS_CD)
부서코드(DEPT_CD)
대상자만조회(TARGET)
년도(YEAR)
신청시기(REQ_CHA)
신청상태(STATUS)
*/
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  DEPT_NM: userStore.asgnFullNm, //부서이름
  DEPT_CD: userStore.deptCd, //부서코드
  BSNS_CD: userStore.bsnsCd, //사업부코드
  // DEPT_CD: 'G2P0', //부서코드
  // BSNS_CD: 'AG00', //사업부코드
  DUTY_YN: 'Y', //대상자만 조회 체크박스
  YEAR: new Date().getFullYear(), //해당년도
  REQ_CHA: day >= '07-01' ? '1' : '0', //신청시기
  EN_DATE: '', //마감일시
  STATUS: '', //신청상태
  MANAGER: '', //담당자
  MANAGER_PHN_NUMBER: '', //연락처
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
  STATUS: [], //신청상태
  CLOTHE_GUBUN: [], //피복종류
  STANDARD: [], //지급기준
  CLOTHE_SIZE: [], //피복사이즈
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIT050'), getCodeList('HHIT120'), getCodeList('HHIT080'), getCodeList('HHIT100')]).then(
    (res) => {
      codeList.REQ_CHA = res[0].ORESULT_CUR
      codeList.STATUS = res[1].ORESULT_CUR
      codeList.STANDARD = res[2].ORESULT_CUR
      codeList.CLOTHE_SIZE = res[3].ORESULT_CUR
      grdMain.value.setBindingColumn('STATUS', codeList.STATUS, 'COD', 'TXT')
      grdMain.value.setBindingColumn('STANDARD', codeList.STANDARD, 'COD', 'TXT')
      grdMain.value.setBindingColumn('CLOTHE_SIZE', codeList.CLOTHE_SIZE, 'COD', 'TXT')
      codeList.STATUS.unshift({ TXT: '전체', COD: '' })
    }
  )
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
      width: '90',
      editable: false,
      header: { text: t('소속') },
      styleName: 'left-column',
    },
    {
      fieldName: 'EMP_NO',
      width: '25',
      editable: false,
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
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('직책') },
    },
    {
      fieldName: 'OFFI_RES_DATE',
      dataType: 'text',
      width: '25',
      editable: false,
      header: { text: t('직책보임일자') },
    },
    {
      fieldName: 'DUTY_YN',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('대상여부') },
    },
    {
      fieldName: 'CLOTHE_GUBUN',
      dataType: 'text',
      width: '45',
      styleName: 'editable_column',
      header: { text: t('피복종류') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        dropDownWhenClick: true,
        textReadOnly: true,
      },
      //SAFE클로버 사번이 존재하면 SAFE클로버에서 등록한 인원이므로 피복종류를 SAFE클로버 피복만 보여준다.
      styleCallback: function (grid, dataCell) {
        let gubun = grid.getValue(dataCell.index.itemIndex, 'SAFE_EMP_NO')
        let gangje = grid.getValue(dataCell.index.itemIndex, 'GANGJE_EMP_NO')
        let gangjeGubun = grid.getValue(dataCell.index.itemIndex, 'GANGJE_GUBUN')
        let offiResCd = grid.getValue(dataCell.index.itemIndex, 'OFFI_RES_CD')
        let partCd = grid.getValue(dataCell.index.itemIndex, 'PART_CD')
        let bsnsCd = grid.getValue(dataCell.index.itemIndex, 'BSNS_CD')
        let ret = {}
        //관리자면 모든 피복 신청가능 관리자가 아니면 본인이 해당하는 피복만 신청가능
        if (!menuAdmin.value) {
          //SAFE클로버에 등록된 인원은 SAFE클로버 피복만
          if (gubun) {
            let CLOTHE_GUBUN = []
            CLOTHE_GUBUN.push(_.cloneDeep(codeList.CLOTHE_GUBUN.filter((x) => x.WARE_NAME === '4')))
            let dropList = { TXT: [], COD: [] }
            for (let i = 0; i < CLOTHE_GUBUN[0].length; i++) {
              dropList.TXT.push(CLOTHE_GUBUN[0][i].TXT)
              dropList.COD.push(CLOTHE_GUBUN[0][i].COD)
            }

            ret.editor = {
              type: 'dropdown',
              domainOnly: true,
              dropDownWhenClick: true,
              textReadOnly: true,
              values: dropList.COD,
              labels: dropList.TXT,
            }
          }
          //강제대상 관리에 등록된 인원은 강제대상관리에서 지정한 피복만 신청가능
          else if (gangje) {
            let CLOTHE_GUBUN = []
            CLOTHE_GUBUN.push(_.cloneDeep(codeList.CLOTHE_GUBUN.filter((x) => x.WARE_NAME === gangjeGubun)))
            let dropList = { TXT: [], COD: [] }
            for (let i = 0; i < CLOTHE_GUBUN[0].length; i++) {
              dropList.TXT.push(CLOTHE_GUBUN[0][i].TXT)
              dropList.COD.push(CLOTHE_GUBUN[0][i].COD)
            }
            ret.editor = {
              type: 'dropdown',
              domainOnly: true,
              dropDownWhenClick: true,
              textReadOnly: true,
              values: dropList.COD,
              labels: dropList.TXT,
            }
          }
          //SAFE클로버,강제대상관리에 등록된 인원이 아니면 SAFE클로버 피복 제외하고 보여줌
          else {
            let CLOTHE_GUBUN = []
            //직책자고 안전통합경영실 - 자산부문이면 관리감독자 피복만
            if (offiResCd !== ' ' && partCd === 'NH00') {
              CLOTHE_GUBUN.push(
                _.cloneDeep(codeList.CLOTHE_GUBUN.filter((x) => x.WARE_NAME !== '4').filter((x) => x.WARE_NAME !== '2'))
              )
            }
            //안전통합경영실 - 안전부문이면 안전관리자 피복만
            else if (bsnsCd === 'AN00' && partCd === 'NA00') {
              CLOTHE_GUBUN.push(
                _.cloneDeep(codeList.CLOTHE_GUBUN.filter((x) => x.WARE_NAME !== '0').filter((x) => x.WARE_NAME !== '4'))
              )
            }
            //일반 직책자면 관리감독자 피복만
            else if (offiResCd !== ' ') {
              CLOTHE_GUBUN.push(
                _.cloneDeep(codeList.CLOTHE_GUBUN.filter((x) => x.WARE_NAME !== '4').filter((x) => x.WARE_NAME !== '2'))
              )
            } else {
              //직책자,safe클로버 아니면 안전관리자 피복
              CLOTHE_GUBUN.push(
                _.cloneDeep(codeList.CLOTHE_GUBUN.filter((x) => x.WARE_NAME !== '4').filter((x) => x.WARE_NAME !== '0'))
              )
            }
            let dropList = { TXT: [], COD: [] }
            for (let i = 0; i < CLOTHE_GUBUN[0].length; i++) {
              dropList.TXT.push(CLOTHE_GUBUN[0][i].TXT)
              dropList.COD.push(CLOTHE_GUBUN[0][i].COD)
            }

            ret.editor = {
              type: 'dropdown',
              domainOnly: true,
              dropDownWhenClick: true,
              textReadOnly: true,
              values: dropList.COD,
              labels: dropList.TXT,
            }
          }
        }

        return ret
      },
    },
    {
      fieldName: 'STANDARD',
      dataType: 'text',
      width: '15',
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
      width: '15',
      header: { text: t('사이즈') },
      styleName: 'editable_column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
        domainOnly: true,
        textReadOnly: true,
        dropDownWhenClick: true,
      },
    },
    {
      fieldName: 'REQ_COUNT',
      dataType: 'number',
      numberFormat: '#',
      width: '15',
      editor: {
        type: 'number',
        maxIntegerLength: '1',
        textAlignment: 'far',
      },
      // styleName: 'editable_column',
      header: { text: t('신청수량') },
      styleCallback: function (grid, dataCell) {
        var ret = {}
        if (menuAdmin.value) {
          //관리자일때 신청수량 수정가능
          ret.editable = true
          ret.enabled = true
          ret.styleName = 'editable_column'
          ret.style = { background: '#eff8fd' }
        } else {
          ret.editable = false
          ret.enabled = false
          ret.style = { background: '#FFFFFF' }
        }
        return ret
      },
    },

    {
      fieldName: 'STATUS',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('신청상태') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REMARKS',
      width: '80',
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
      fieldName: 'BSNS_CD',
      visible: false,
      header: { text: t('사업부코드') },
    },
    {
      fieldName: 'ASGN_CD',
      visible: false,
      header: { text: t('조직코드') },
    },
    {
      fieldName: 'REQ_CHA',
      visible: false,
      header: { text: t('신청시기') },
    },
    {
      fieldName: 'YEAR',
      visible: false,
      header: { text: t('해당년도') },
    },
    {
      fieldName: 'USER_DIV',
      visible: false,
      header: { text: t('조직구분') },
    },
    {
      fieldName: 'MANAGER',
      visible: false,
      header: { text: t('담당자') },
    },
    {
      fieldName: 'MANAGER_PHN_NUMBER',
      visible: false,
      header: { text: t('담당자연락처') },
    },
    {
      fieldName: 'REQ_SEQ',
      visible: false,
      header: { text: t('신청SEQ') },
    },
    {
      fieldName: 'OFFI_RES_CD',
      visible: false,
      header: { text: t('직책코드') },
    },
    {
      fieldName: 'PART_CD',
      visible: false,
      header: { text: t('부문') },
    },
    //SAFE클로버에서 등록된 인원을 구분하기 위한 값
    {
      fieldName: 'SAFE_EMP_NO',
      visible: false,
      header: { text: t('SAFE클로버 사번') },
    },
    //강제대상관리에서 등록된 인원을 구분하기 위한 값
    {
      fieldName: 'GANGJE_EMP_NO',
      visible: false,
      header: { text: t('강제대상관리 사번') },
    },
    {
      fieldName: 'GANGJE_GUBUN',
      visible: false,
      header: { text: t('강제대상관리에서 등록된 피복종류') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(async () => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
  //피복 관리자 인지 체크 임원도 관리자로 취급
  if (userStore.authGrpCd.includes('CLDA001') || userStore.authGrpCd.includes('GRP00386')) {
    //현재날짜가 상반기인지 하반기인지
    if (day >= '07-01') {
      searchParam.REQ_CHA = '1'
    } else {
      searchParam.REQ_CHA = '0'
    }
    menuAdmin.value = true
    //피복종류조회
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      USER_DIV: 'A',
      REQ_CHA: searchParam.REQ_CHA,
    }
    commonSearchApi({
      queryId: 'CLDBA0010_SEARCH_98',
      param: param,
    }).then((res) => {
      codeList.CLOTHE_GUBUN = res.ORESULT_CUR
      grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT')
    })
    //onButtonsClick({ id: 'btnSearch' })
    return false
  }
  //대상부서 조회
  if (await checkTargetDept()) {
    //피복종류조회
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      USER_DIV: 'A',
      REQ_CHA: searchParam.REQ_CHA,
    }
    commonSearchApi({
      queryId: 'CLDBA0010_SEARCH_98',
      param: param,
    }).then((res) => {
      codeList.CLOTHE_GUBUN = res.ORESULT_CUR
      grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT')
    })
  } else {
    menuAdmin.value = false //관리자도 다른부서 조회 못하도록
    return false
  }

  //정기신청기간 조회(관리자는 정기신청 기간에 상관없음)
  if (!userStore.authGrpCd.includes('CLDA001') && !userStore.authGrpCd.includes('GRP00386')) {
    if (!(await checkRegular())) {
      menuAdmin.value = false //관리자도 다른부서 조회 못하도록
      return false
    }
  }
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new searchFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnApplication') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('신청 하시겠습니까?')
      .setBefore(beforeSave01)
      .setQuery(saveData01)
      .setAfter(afterSave01)
      .run()
  } else if (btn.id === 'btnUpdate') {
    //2025.06.27 박래순책임 요청으로 저장기능 추가
    new saveFlowHelper(vm, t).setBefore(beforeSave03).setQuery(saveData03).setAfter(afterSave03).run()
  } else {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('신청 취소하시겠습니까?')
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .run()
  }
}

//신청관련 로직 시작
const beforeSave01 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    //피복종류 필수값
    if (data.DUTY_YN === 'N') {
      Message.warn(t('대상여부가 N인 인원은 신청 할 수 없습니다.'))
      return false
    } else if (data.STATUS === '30') {
      Message.warn(t('지급완료된 건은 신청할 수 없습니다.'))
      return false
    } else if (!data.CLOTHE_GUBUN) {
      Message.warn(t('피복종류를 선택해주세요.'))
      return false
    } else if (!data.CLOTHE_SIZE) {
      Message.warn(t('사이즈를 선택해주세요.'))
      return false
    } else if (!data.REQ_COUNT) {
      Message.warn(t('신청수량을 입력해주세요.'))
      return false
    }
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
      REQ_CHA: searchParam.REQ_CHA, //신청시기
      YEAR: new Date().getFullYear(), //해당년도
      EMP_NO: data.EMP_NO, //사번
      USER_DIV: 'A', //직영 신청이니 A로 고정
      BSNS_CD: data.BSNS_CD, //사업부코드
      DEPT_CD: data.DEPT_CD, //부서코드
      ASGN_CD: data.ASGN_CD, //조직코드
      CLOTHE_GUBUN: data.CLOTHE_GUBUN, //피복종류
      CLOTHE_SIZE: data.CLOTHE_SIZE, //피복사이즈
      REQ_COUNT: data.REQ_COUNT, //신청수량
      STATUS: '20', //신청상태 ->신청완료
      REQ_DIV: '0', //신청구분(정기:0,수시:1)
      MANAGER: searchParam.MANAGER,
      MANAGER_PHN_NUMBER: searchParam.MANAGER_PHN_NUMBER, //담당자 연락처
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDBA0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//신청관련 로직 끝

//신청취소 관련 로직 시작
const beforeSave02 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (data.STATUS !== '20') {
      Message.warn(t('신청완료된 데이터만 신청취소 가능합니다.'))
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
      REQ_SEQ: data.REQ_SEQ,
      CMPNY_DIV: data.CMPNY_DIV,
      REQ_CHA: data.REQ_CHA,
      YEAR: data.YEAR,
      EMP_NO: data.EMP_NO,
      USER_DIV: data.USER_DIV,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDBA0010_SAVE_02',
    list: saveParam,
  })
}

const afterSave02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//신청취소 관련 로직 끝

//저장관련 로직 시작
const beforeSave03 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    //피복종류 필수값
    if (!data.CLOTHE_GUBUN) {
      Message.warn(t('피복종류를 선택해주세요.'))
      return false
    } else if (!data.CLOTHE_SIZE) {
      Message.warn(t('사이즈를 선택해주세요.'))
      return false
    } else if (!data.REQ_COUNT) {
      Message.warn(t('신청수량을 입력해주세요.'))
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
      REQ_SEQ: data.REQ_SEQ, //신청 SEQ
      CMPNY_DIV: data.CMPNY_DIV, //사업장구분
      REQ_CHA: searchParam.REQ_CHA, //신청시기
      YEAR: new Date().getFullYear(), //해당년도
      EMP_NO: data.EMP_NO, //사번
      USER_DIV: 'A', //직영 신청이니 A로 고정
      BSNS_CD: data.BSNS_CD, //사업부코드
      DEPT_CD: data.DEPT_CD, //부서코드
      ASGN_CD: data.ASGN_CD, //조직코드
      CLOTHE_GUBUN: data.CLOTHE_GUBUN, //피복종류
      CLOTHE_SIZE: data.CLOTHE_SIZE, //피복사이즈
      REQ_COUNT: data.REQ_COUNT, //신청수량
      REQ_DIV: '0', //신청구분(정기:0,수시:1)
      MANAGER: searchParam.MANAGER,
      MANAGER_PHN_NUMBER: searchParam.MANAGER_PHN_NUMBER, //담당자 연락처
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'CLDBA0010_SAVE_03',
    list: saveParam,
  })
}

const afterSave03 = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDBA0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  //신청시기에 따른 피복종류 조회 (상반기면 하복 하반기면 동복 조회)
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USER_DIV: 'A',
    REQ_CHA: searchParam.REQ_CHA,
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

//정기신청 기간인지 확인
const checkRegular = async () => {
  try {
    const res = await commonSearchApi({
      queryId: 'CLDBA0010_SEARCH_99',
      param: {},
    })

    if (!res || !res.ORESULT_CUR) {
      return false
    }

    if (res.ORESULT_CUR.length === 0) {
      await vm.$swal({
        title: t(`정기신청 기간이 아닙니다.
                  조회만 가능합니다.`),
        showCancelButton: false,
      })
      initCodeList()
      /*2025.10.13 김현재 작성
      기존에는 정기신청기간이 아닐때 관리자 이외에 사람이 접속하면 모든버튼을 비활성화 했는데
      박래순책임님 요청으로 정기신청 기간이 아닐때도 조회는 가능하도록 수정*/
      //menuTitle.value.disableBtn('btnSearch', true)
      menuTitle.value.disableBtn('btnUpdate', true)
      menuTitle.value.disableBtn('btnApplication', true)
      menuTitle.value.disableBtn('btnReqCancel', true)

      return false
    }

    searchParam.EN_DATE = res.ORESULT_CUR[0].EN_DATE
    searchParam.REQ_CHA = res.ORESULT_CUR[0].REQ_CHA
    return true
  } catch (error) {
    return false
  }
}

/*
로그인유저가 피복신청 대상부서인지 확인하는 함수
대상부서는 직군이 직접생산,지원생산,생산관리,임원이 속해있는 부서
즉, 사용자의 JOB_ROW_CD(직군코드)가
직접생산 :10
지원생산 :11
생산관리 :14
경영총괄(임원):23
경영총괄(전문임원):24
경영총괄(연구위원):25
경영총괄(퇴임임원):26
인 유저만 정기신청이 가능해야함.
로그인 유저가 안전보호구 > 기초정보관리 > 부서별 담당자 관리에 해당부서에 등록되어 있는지 확인같이함
로그인 유저가 부서별 담당자 관리에 FOS추진팀,안전경영부 담당자로 등록되어 있으면 피복화면에서도 FOS추진팀,안전경영부 조회가 가능하고, 신청도 가능함.
2025.07.25 김현재 작성 안전보건지원부 인원도 신청가능해야함
*/
const checkTargetDept = async () => {
  // await commonSearchApi({
  //   queryId: 'HLTHF0070_SEARCH_02',
  //   param: {
  //     CMPNY_DIV: userStore.cmpnyDiv,
  //     EMP_NO: userStore.empNo,
  //   },
  // }).then((res) => {
  //   if (res.ORESULT_CUR.length > 0) {
  //     deptChargeYn.value = true
  //     deptChargeCd.push(res.ORESULT_CUR)
  //   }
  // })
  // let jobRowCdList = [10, 11, 14, 23, 24, 25, 26]
  // if (
  //   !jobRowCdList.some((x) => userStore.jobRowCd?.includes(x)) &&
  //   deptChargeCd.length === 0 &&
  //   !(userStore.bsnsCd === 'AN00' && userStore.deptCd === 'N1K0')
  // ) {
  if (userStore.userDiv !== 'A') {
    await vm.$swal({
      title: t(`피복신청 대상 부서가 아닙니다.\n
                담당자에게 문의하십시오.(T. 2-5466)`),
    })
    menuTitle.value.disableBtn('btnSearch', true)
    menuTitle.value.disableBtn('btnApplication', true)
    menuTitle.value.disableBtn('btnReqCancel', true)
    menuTitle.value.disableBtn('btnUpdate', true)
    return false
  } else {
    return true
  }
}

//인원팝업 오픈 이벤트
const openDeptPopup = () => {
  //관리자 권한이면 모든부서 가능하도록
  if (menuAdmin) {
    deptPopup.value.openPopup({
      ORGN_DIV: 'A',
    })
  }
}

//부서팝업 선택 이벤트
const selectedDept = async (val) => {
  //로그인유저 부서와 선택한 부서가 일치하지 않으면
  if (userStore.deptCd !== val.DEPT_CD && deptChargeCd.length > 0) {
    //부서별 담당자에 등록되어있는 부서와 비교해서 일치하면 조회가능 일치하지 않으면 튕구기
    if (deptChargeCd[0].some((x) => x.DEPT_CD === val.DEPT_CD) || menuAdmin.value === true) {
      searchParam.CMPNY_DIV = val.CMPNY_DIV
      searchParam.DEPT_NM = val.ASGN_FULL_NM
      searchParam.DEPT_CD = val.DEPT_CD
      searchParam.BSNS_CD = val.BSNS_CD
      onButtonsClick({ id: 'btnSearch' })
    } else {
      await vm.$swal({
        title: '해당부서에 조회 권한이 없습니다.',
      })
    }
  }
  //자기 부서 조회했을때는 그냥 조회
  else {
    searchParam.CMPNY_DIV = val.CMPNY_DIV
    searchParam.DEPT_NM = val.ASGN_FULL_NM
    searchParam.DEPT_CD = val.DEPT_CD
    searchParam.BSNS_CD = val.BSNS_CD
    onButtonsClick({ id: 'btnSearch' })
  }
}

//행변경 이벤트
const rowChanged = async (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return false
  }

  let rowData = await grdMain.value.getDataProvider().getJsonRow(newRow)
  searchParam.MANAGER = rowData.MANAGER
  searchParam.MANAGER_PHN_NUMBER = rowData.MANAGER_PHN_NUMBER
  dutyYn.value = rowData.DUTY_YN

  //대상여부 N이면 수정불가,지급완료시 신청불가
  if (dutyYn.value === 'N' || rowData.STATUS === '30') {
    grdMain.value.getGridView().columnByName('CLOTHE_GUBUN').editable = false
    grdMain.value.getGridView().columnByName('REQ_COUNT').editable = false
    grdMain.value.getGridView().columnByName('REMARKS').editable = false
    grdMain.value.getGridView().columnByName('CLOTHE_SIZE').editable = false
  } else {
    //Y면 수정가능
    grdMain.value.getGridView().columnByName('CLOTHE_GUBUN').editable = true
    grdMain.value.getGridView().columnByName('REQ_COUNT').editable = true
    grdMain.value.getGridView().columnByName('REMARKS').editable = true
    grdMain.value.getGridView().columnByName('CLOTHE_SIZE').editable = true
  }
}

//점검부서 x아이콘 선택, 점검부서 초기화
const clearDeptcd = () => {
  searchParam.DEPT_NM = '전체'
  searchParam.DEPT_CD = ''
  searchParam.BSNS_CD = ''
}

//담당자 선택 이벤트
const selectedEmp = (val) => {
  searchParam.MANAGER = val.EMP_NM
  searchParam.MANAGER_PHN_NUMBER = val.TEL_NO
}

const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NM: searchParam.MANAGER,
  })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnApplication', 'btnReqCancel']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('부서')"
              width="250px"
              v-model="searchParam.DEPT_NM"
              :append-inner-icon="menuAdmin || deptChargeYn ? 'mdi-magnify' : null"
              @click:appendInner="openDeptPopup"
              readonly
            >
              <template #append-inner v-if="menuAdmin">
                <v-icon icon="mdi-window-close" @click="clearDeptcd" />
              </template>
            </i-input>
            <i-input width="70px" v-model="searchParam.DEPT_CD" readonly> </i-input>
            <v-checkbox true-value="Y" false-value="N" class="mt-1" v-model="searchParam.DUTY_YN"> </v-checkbox>
            <span class="mt-2 mr-2">대상자만 조회</span>
            <i-select :label="$t('해당년도')" width="170px" v-model="searchParam.YEAR" type="YEAR"> </i-select>
            <i-select
              :label="$t('신청시기')"
              width="170px"
              v-model="searchParam.REQ_CHA"
              :items="codeList.REQ_CHA"
              item-title="TXT"
              item-value="COD"
            >
            </i-select>
            <i-input :label="$t('마감일시')" width="200px" v-model="searchParam.EN_DATE" readonly></i-input>
            <i-select
              :label="$t('신청상태')"
              width="170px"
              v-model="searchParam.STATUS"
              :items="codeList.STATUS"
              item-title="TXT"
              item-value="COD"
            ></i-select>
            <i-input
              :label="$t('담당자')"
              width="150px"
              v-model="searchParam.MANAGER"
              :append-inner-icon="'mdi-magnify'"
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
            ></i-input>
            <i-input :label="$t('연락처')" width="150px" v-model="searchParam.MANAGER_PHN_NUMBER" readonly></i-input>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCurrentRowChanged="rowChanged"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <EmpPopup ref="empPopup" @selected="selectedEmp"></EmpPopup>
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
