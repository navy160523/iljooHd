<!--
작성자 : 일주지앤에스 SI3팀 김현재 선임
화면명 : 점검 체크리스트 및 점검계획 등록/관리
화면개요 : 안전점검 계획 및 체크리스트를 관리하는 화면
-->

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
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import SAFCC0010PopUp from './SAFCC0010PopUp.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
defineOptions({
  name: '30_safety-SAF_C-SAFCC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null) //점검계획
const grdSub1 = ref(null) //그룹
const grdSub2 = ref(null) //인원
const grdSub3 = ref(null) //점검항목
const grdSub4 = ref(null) //점검항목
const deptPopup = ref(null) //부서팝업
const sAFCC0010Popup = ref(null) //등록팝업
const empPopup = ref(null) //인원팝업
const userStore = useUserStore()
const userLogStore = useLogsStore()

const readOnlyValue = reactive({
  BSNS_NM: true,
  DEPT_NM: true,
  SAFE_MNG_YN: 'N', //로그인유저가 IT관리자,안전직원인지 확인하는 플래그값
})

//안전경영부가 아닐때는 '그룹'그리드 보이지 않고
//안전경영부일때는 그룹 그리드가 보이게됨
const layoutValue = reactive({
  groupVisibleValue: false, //그룹그리드 visible플래그 false,50% 기본 true 100%
  empWidthValue: '100%', //그룹그리드에 따라서 변하게될 인원 그리드 width
})

//코드리스트
const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  USE_YN: [
    {
      TXT: '전체',
      COD: '',
    },
    { TXT: '사용', COD: 'Y' },
    { TXT: '미사용', COD: 'N' },
  ],
})

//사용자에게 보여지는 사업부,부서이름
const showName = reactive({
  BSNS_NM: '',
  DEPT_NM: '',
})

//실제로 DB에 넘어가는 조회값들
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '', //사업부코드
  DEPT_CD: '', //부서코드
  USE_YN: 'Y', //사용여부
})

//안전경영부가 아닐때는 icon 감춤
const iconStyle = reactive({
  display: 'none',
})

//점검계획 그리드
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '100',
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('부서') },
    },

    {
      fieldName: 'CHECK_TARGET',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('점검 대상') },
    },
    {
      fieldName: 'CHECK_CYCLE_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('주기 구분') },
    },
    {
      fieldName: 'FROM_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('시작일') },
    },

    {
      fieldName: 'TO_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('종료일') },
    },
    {
      fieldName: 'CHECK_NUMBER',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'right-column',
      header: { text: t('점검 횟수') },
    },
    {
      fieldName: 'QR_CODE',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('QR') },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('사용여부') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 계획 ID') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'CHECK_CYCLE',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('') },
    },
  ],
  columns: [],
})

//그룹 그리드
const grdSub1Props = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'TXT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('그룹명') },
    },
    {
      fieldName: 'CODE_DESC1',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('그룹코드') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 대상 ID') },
    },
    {
      fieldName: 'COD',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검인원 ID') },
    },
    {
      fieldName: 'GU_DIV',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검인원구분') },
    },
  ],
})

//인원 그리드
const grdSub2Props = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직위') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 대상 ID') },
    },
    {
      fieldName: 'GU_ID',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검인원 ID') },
    },
    {
      fieldName: 'GU_DIV',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검인원구분') },
    },
  ],
})

//점검 대상 그리드
const grdSub3Props = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CHECK_TARGET_DESC',
      dataType: 'text',
      width: '100',
      styleName: 'editable_column-left',
      header: { text: t('점검 대상 내용') },
    },
    {
      fieldName: 'ORDER_NUM',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column-right',
      editor: {
        ignoreCharacters: 'ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}',
        maxLength: 3,
      },
      header: { text: t('정렬순서') },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('사용여부') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 계획 ID') },
    },
    {
      fieldName: 'CHECK_TARGET_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 대상 순번 ') },
    },
  ],
  columns: [],
})

//점검항목 그리드
const grdSub4Props = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CHECK_LIST_DESC',
      dataType: 'text',
      width: '100',
      styleName: 'editable_column-left',
      header: { text: t('점검 항목 내용') },
    },
    {
      fieldName: 'ORDER_NUM',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column-right',
      editor: {
        ignoreCharacters: 'ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}',
        maxLength: 3,
      },
      header: { text: t('정렬순서') },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      width: '50',
      styleName: 'editable_column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('사용여부') },
    },

    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 계획 ID') },
    },
    {
      fieldName: 'CHECK_TARGET_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 대상 순번 ') },
    },
    {
      fieldName: 'CHECK_LIST_SEQ',
      dataType: 'text',
      width: '100',
      visible: false,
      header: { text: t('점검 항목 순번') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSub2Props.columns = grdSub2Props.fields
grdSub3Props.columns = grdSub3Props.fields
grdSub4Props.columns = grdSub4Props.fields

const initCodeList = () => {
  grdSub3.value.setBindingColumn(
    'USE_YN',
    codeList.USE_YN.filter((x) => x.COD !== ''),
    'COD',
    'TXT'
  )
  grdSub4.value.setBindingColumn(
    'USE_YN',
    codeList.USE_YN.filter((x) => x.COD !== ''),
    'COD',
    'TXT'
  )
}

onMounted(() => {
  /*
  디버깅용 코드(안전경영부 권한부여)

  */
  // userStore.deptCd = 'N090'
  // userStore.bsnsCd = 'AN00'

  initCodeList()
  searchParam.BSNS_CD = userStore.bsnsCd
  searchParam.DEPT_CD = userStore.deptCd
  showName.BSNS_NM = userStore.bsnsNm
  showName.DEPT_NM = userStore.deptNm
  checkSafeTyManage() //IT관리자,안전직원 권한 소속 확인
  onButtonsClick({ id: 'btnSearch' })
})

//로그인유저가 IT관리자,안전직원 인지 확인하는 함수
const checkSafeTyManage = () => {
  //로그인 유저가 IT관리자,안전직원 권한이면 부서검색 아이콘 visible ,그룹 그리드 visible
  if (
    userStore.authGrpCd.includes('GRP00381') ||
    userStore.authGrpCd.includes('GRP00369')
  ) {
    iconStyle.display = ''
    layoutValue.groupVisibleValue = true //그룹그리드 보이게
    layoutValue.empWidthValue = '50%' //인원 그리드 width 50%로 설정
    readOnlyValue.SAFE_MNG_YN = 'Y'
    readOnlyValue.BSNS_NM = false
    readOnlyValue.DEPT_NM = false
    grdSub1Props.columns = grdSub1Props.fields //로그인유저가 안전경영부일 경우 그룹 그리드 바인딩
    getCodeList('HHIP060').then((res) => {
      grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
}

//조회버튼 이벤트 시작
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch01)
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  }
}
//조회버튼 이벤트 끝

//점검계획 조회관련 로직 시작
const beforeSearch01 = () => {
  if (!searchParam.DEPT_CD || !searchParam.BSNS_CD) {
    Message.warn(t('조회조건을 입력해주세요.'))
    return false
  }
  return true
}

const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFCC010_SEARCH01',
    param: searchParam,
  })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//점검계획 조회 관련 로직 끝

//점검계획 버튼 이벤트 시작
const onButtonsClick1 = (btn) => {
  if (btn.id === 'btnRegist') {
    sAFCC0010Popup.value.openPopup()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete01)
      .setQuery(deleteData01)
      .setAfter(afterDelete01)
      .run()
  }
}
//점검계획 버튼 이벤트 끝

//점검계획 삭제 관련 로직 시작
const beforeDelete01 = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData01 = () => {
  let deleteParam = []
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  for (let i = 0; i < chekedRow.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chekedRow[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      CHECK_PLAN_SEQ: data.CHECK_PLAN_SEQ,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFCC0010_DELETE01',
    list: deleteParam,
  })
}

const afterDelete01 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//점검계획 삭제 관련 로직 끝

//점검계획 등록후 재조회 이벤트 시작
const afterSaved = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//점검계획 등록후 재조회 이벤트 끝

//점검계획 행 더블클릭 관련 로직 시작(수정)
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  sAFCC0010Popup.value.openPopup2(data)
}
//점검계획 행 더블클릭 관련 로직 끝(수정)

//점검계획 행 변경 이벤트 관련 로직 시작
const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  let row = grdMain.value.getDataProvider().getJsonRow(newIdx)

  let groupParam = {
    CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
  }
  let empParam = {
    CMPNY_DIV: row.CMPNY_DIV,
    CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
  }
  let targetParam = {
    CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
  }
  if (readOnlyValue.SAFE_MNG_YN === 'Y') {
    Promise.all([
      //점검그룹 조회
      commonSearchApi({
        queryId: 'SAFCC010_SEARCH02',
        param: groupParam,
      }),
      //점검인원 조회
      commonSearchApi({
        queryId: 'SAFCC010_SEARCH03',
        param: empParam,
      }),
      //점검항목 조회
      commonSearchApi({
        queryId: 'SAFCC010_SEARCH04',
        param: targetParam,
      }),
    ]).then((res) => {
      let rowLength = grdSub1.value.getDataProvider().getJsonRows(0, -1).length
      //그룹 체크 해제
      for (let i = 0; i < rowLength; i++) {
        grdSub1.value.getGridView().checkRow(i, false)
      }
      //조회한값이랑 일치하는 데이터 체크
      for (let i = 0; i < rowLength; i++) {
        let data = grdSub1.value.getDataProvider().getJsonRow(i)
        for (let j = 0; j < res[0].ORESULT_CUR.length; j++) {
          if (data.CODE_DESC1 === res[0].ORESULT_CUR[j].GU_ID) {
            grdSub1.value.getGridView().checkRow(i, true)
          }
        }
      }
      grdSub2.value.getDataProvider().setRows(res[1].ORESULT_CUR)
      grdSub3.value.getDataProvider().setRows(res[2].ORESULT_CUR)
      grdSub3.value.getGridView().setCurrent(0) //점검항목 행 포커스를 0번째로 설정
    })
  } else {
    Promise.all([
      //점검인원 조회
      commonSearchApi({
        queryId: 'SAFCC010_SEARCH03',
        param: empParam,
      }),
      //점검항목 조회
      commonSearchApi({
        queryId: 'SAFCC010_SEARCH04',
        param: targetParam,
      }),
    ]).then((res) => {
      grdSub2.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      grdSub3.value.getDataProvider().setRows(res[1].ORESULT_CUR)
      grdSub3.value.getGridView().setCurrent(0) //점검항목 행 포커스를 0번째로 설정
    })
  }
}
//점검계획 행 변경 이벤트 관련 로직 끝

//점검항목 행 변경 이벤트 관련 로직 시작
const onGrdSub3CurrRowChanged = (grid, oldIdx, newIdx) => {
  if (newIdx === -1) {
    grdSub4.value.getDataProvider().setRows(null)
    return false
  }
  //점검항목 데이터가 없을때 에러가 나서 false 리턴하고 점검항목 그리드 비워줌
  let row = grdSub3.value.getDataProvider().getJsonRow(newIdx)

  //신규행 추가시 조회되는거 막기
  if (!row.CHECK_TARGET_SEQ) {
    return false
  }
  let param = {
    CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
    CHECK_TARGET_SEQ: row.CHECK_TARGET_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCC010_SEARCH05',
    param: param,
  }).then((res) => {
    grdSub4.value.getDataProvider().setRows(res.ORESULT_CUR)
    Message.success(t('조회되었습니다.'))
  })
}
//점검항목 행 변경 이벤트 관련 로직 끝

//점검그룹/인원 저장버튼 이벤트 시작
const onButtonsClick2 = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave02).setQuery(saveData02).run()
  } else if (btn.id === 'btnCreate') {
    empPopup.value.openPopup({
      //인원팝업 오픈시 로그인유저 사업부,부서 선택되도록
      BSNS_CD: userStore.bsnsCd,
      DEPT_CD: userStore.deptCd,
      FLAG_D: true,
      MULTI: true,
    })
  } else {
    let deleteRows = grdSub2.value.getGridView().getCheckedRows(true)
    grdSub2.value.getDataProvider().removeRows(deleteRows)
  }
}

//점검그룹/인원 저장 관련 로직 시작
const beforeSave02 = () => {
  let grdMainFocusData = grdMain.value.getFocusedRowData()
  if (!grdMainFocusData) {
    Message.warn(t('점검 계획을 먼저 저장해주세요.'))
    return false
  }
  return true
}

const saveData02 = () => {
  let saveParam01 = []
  let saveParam02 = []
  let deleteParam = []

  if (readOnlyValue.SAFE_MNG_YN === 'Y') {
    let groupData = grdSub1.value.getGridView().getCheckedRows()
    let empCount = grdSub2.value.getGridView().getItemCount() //인원그리드에 표시된 데이터갯수
    //그룹 데이터
    if (groupData.length > 0) {
      for (let i = 0; i < groupData.length; i++) {
        let data = grdSub1.value.getDataProvider().getJsonRow(groupData[i])
        let saveData = {
          CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
          GU_ID: data.CODE_DESC1,
          GU_DIV: 'G',
          INSERT_USER_ID: userStore.userId,
        }
        saveParam01.push(saveData)
      }
    }
    if (empCount > 0) {
      //인원 데이터
      for (let i = 0; i < empCount; i++) {
        let data = grdSub2.value.getGridView().getDisplayValues(i)
        let saveData = {
          CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
          GU_ID: data.EMP_NO,
          GU_DIV: 'U',
          INSERT_USER_ID: userStore.userId,
        }
        saveParam02.push(saveData)
      }
    }

    let deleteData = {
      CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
    }
    deleteParam.push(deleteData)
    return commonExecuteApi({
      queryId: 'SAFCC0010_DELETE02',
      list: deleteParam,
    }).then((res) => {
      Promise.all([
        commonExecuteApi({
          queryId: 'SAFCC0010_SAVE02',
          list: saveParam01,
        }),
        commonExecuteApi({
          queryId: 'SAFCC0010_SAVE02',
          list: saveParam02,
        }),
      ]).then((res) => {
        let row = grdMain.value.getFocusedRowData()
        let groupParam = {
          CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
        }
        let empParam = {
          CMPNY_DIV: row.CMPNY_DIV,
          CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
        }
        Promise.all([
          commonSearchApi({
            queryId: 'SAFCC010_SEARCH02',
            param: groupParam,
          }),
          commonSearchApi({
            queryId: 'SAFCC010_SEARCH03',
            param: empParam,
          }),
        ]).then((res) => {
          let rowLength = grdSub1.value
            .getDataProvider()
            .getJsonRows(0, -1).length
          for (let i = 0; i < rowLength; i++) {
            let data = grdSub1.value.getDataProvider().getJsonRow(i)
            for (let j = 0; j < res[0].ORESULT_CUR.length; j++) {
              if (data.COD === res[0].ORESULT_CUR[j].GU_ID) {
                grdSub1.value.getGridView().checkRow(i, true)
              }
            }
          }
          grdSub2.value.getDataProvider().setRows(res[1].ORESULT_CUR)
          Message.success(t('저장되었습니다.'))
        })
      })
    })
  } else {
    let empCount = grdSub2.value.getGridView().getItemCount() //인원그리드에 표시된 데이터갯수
    //인원 데이터
    for (let i = 0; i < empCount; i++) {
      let data = grdSub2.value.getGridView().getDisplayValues(i)
      let saveData = {
        CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
        GU_ID: data.EMP_NO,
        GU_DIV: 'U',
        INSERT_USER_ID: userStore.userId,
      }
      saveParam02.push(saveData)
    }
    let deleteData = {
      CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
    }
    deleteParam.push(deleteData)
    commonExecuteApi({
      queryId: 'SAFCC0010_DELETE02',
      list: deleteParam,
    }).then((res) => {
      Promise.all([
        commonExecuteApi({
          queryId: 'SAFCC0010_SAVE02',
          list: saveParam02,
        }),
      ]).then((res) => {
        let row = grdMain.value.getFocusedRowData()
        let empParam = {
          CMPNY_DIV: row.CMPNY_DIV,
          CHECK_PLAN_SEQ: row.CHECK_PLAN_SEQ,
        }
        Promise.all([
          commonSearchApi({
            queryId: 'SAFCC010_SEARCH03',
            param: empParam,
          }),
        ]).then((res) => {
          grdSub2.value.getDataProvider().setRows(res[0].ORESULT_CUR)
          Message.success(t('저장되었습니다.'))
        })
      })
    })
  }
}

//점검그룹/인원 저장버튼 끝

//인원 그리드 버튼 이벤트 시작
//const onButtonsClick3 = (btn) => {}

//인원 그리드 버튼 이벤트 끝

//인원그리드 추가버튼 선택 관련 로직 시작
const selectedEmp = (val) => {
  for (let i = 0; i < val.length; i++) {
    grdSub2.value.addRow(val[i])
  }
}
//인원그리드 추가버튼 선택 관련 로직 끝

//점검항목 그리드 버튼 이벤트 시작
const onButtonsClick4 = (btn) => {
  if (btn.id === 'btnCreate') {
    //추가전 점검그룹,인원 그리드 저장여부 확인
    let grdSub3Count = grdSub3.value.getGridView().getItemCount() //점검항목에 표시된 그리드 행 개수
    if (grdSub3Count === 0) {
      grdSub3.value.addRow({ ORDER_NUM: 1, USE_YN: 'Y' })
    } else {
      grdSub3.value.addRow({ ORDER_NUM: grdSub3Count + 1, USE_YN: 'Y' })
    }
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete02)
      .setQuery(deleteData02)
      .setAfter(afterDelete02)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave03)
      .setQuery(saveData03)
      .setAfter(afterSave03)
      .run()
  }
}

//점검항목 그리드 버튼 이벤트 끝

//점검항목 저장 관련 로직 시작
const beforeSave03 = () => {
  let checkedData = grdSub3.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdSub3.value.getDataProvider().getJsonRow(checkedData[i])
    if (!data.CHECK_TARGET_DESC || !data.USE_YN || !data.ORDER_NUM) {
      Message.warn(t('모든 행의 데이터를 입력해주세요.'))
      return false
    }
  }
  return true
}

const saveData03 = () => {
  let saveParam = []
  let checkedData = grdSub3.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdSub3.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
      CHECK_TARGET_SEQ: data.CHECK_TARGET_SEQ,
      CHECK_TARGET_DESC: data.CHECK_TARGET_DESC,
      USE_YN: data.USE_YN,
      ORDER_NUM: data.ORDER_NUM,
      INSERT_USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCC0010_SAVE03',
    list: saveParam,
  })
}

const afterSave03 = () => {
  let param = {
    CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCC010_SEARCH04',
    param: param,
  }).then((res) => {
    grdSub3.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//점검항목 저장 관련 로직 끝

//점검항목 삭제 관련 로직 시작
const beforeDelete02 = () => {
  let checkedData = grdSub3.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData02 = () => {
  let deleteParam = []
  let checkedData = grdSub3.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdSub3.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CHECK_PLAN_SEQ: data.CHECK_PLAN_SEQ,
      CHECK_TARGET_SEQ: data.CHECK_TARGET_SEQ,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFCC0010_DELETE03',
    list: deleteParam,
  })
}

const afterDelete02 = () => {
  let param = {
    CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCC010_SEARCH04',
    param: param,
  }).then((res) => {
    grdSub3.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

//점검항목 삭제 관련 로직 끝

//점검세부항목 그리드 버튼 이벤트 시작
const onButtonsClick5 = (btn) => {
  if (btn.id === 'btnCreate') {
    let grdSub3Count = grdSub3.value.getGridView().getItemCount() //점검세부항목에 표시된 그리드 행 개수
    if (grdSub3Count === 0) {
      Message.warn(t('점검 항목 데이터를 먼저 저장해주세요.'))
      return false
    }

    let grdSub4Count = grdSub4.value.getGridView().getItemCount() //점검세부항목에 표시된 그리드 행 개수
    if (grdSub4Count === 0) {
      grdSub4.value.addRow({ ORDER_NUM: 1, USE_YN: 'Y' })
    } else {
      grdSub4.value.addRow({ ORDER_NUM: grdSub4Count + 1, USE_YN: 'Y' })
    }
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete03)
      .setQuery(deleteData03)
      .setAfter(afterDelete03)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave04)
      .setQuery(saveData04)
      .setAfter(afterSave04)
      .run()
  }
}

//점검세부항목 그리드 버튼 이벤트 끝

//점검 세부 항목 저장관련 로직 시작
const beforeSave04 = () => {
  let checkedData = grdSub4.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdSub4.value.getDataProvider().getJsonRow(checkedData[i])
    if (!data.CHECK_LIST_DESC || !data.USE_YN || !data.ORDER_NUM) {
      Message.warn(t('모든 행의 데이터를 입력해주세요.'))
      return false
    }
  }
  return true
}

const saveData04 = () => {
  let saveParam = []
  let checkedData = grdSub4.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdSub4.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
      CHECK_TARGET_SEQ: grdSub3.value.getFocusedRowData().CHECK_TARGET_SEQ,
      CHECK_LIST_SEQ: data.CHECK_LIST_SEQ,
      CHECK_LIST_DESC: data.CHECK_LIST_DESC,
      USE_YN: data.USE_YN,
      ORDER_NUM: data.ORDER_NUM,
      INSERT_USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCC0010_SAVE04',
    list: saveParam,
  })
}

const afterSave04 = () => {
  let param = {
    CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
    CHECK_TARGET_SEQ: grdSub3.value.getFocusedRowData().CHECK_TARGET_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCC010_SEARCH05',
    param: param,
  }).then((res) => {
    grdSub4.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//점검 세부 항목 저장관련 로직 끝

//점검 세부 항목 삭제관련 로직 시작
const beforeDelete03 = () => {
  let checkedData = grdSub4.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData03 = () => {
  let deleteParam = []
  let checkedData = grdSub4.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdSub4.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CHECK_PLAN_SEQ: data.CHECK_PLAN_SEQ,
      CHECK_TARGET_SEQ: data.CHECK_TARGET_SEQ,
      CHECK_LIST_SEQ: data.CHECK_LIST_SEQ,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFCC0010_DELETE04',
    list: deleteParam,
  })
}

const afterDelete03 = () => {
  let param = {
    CHECK_PLAN_SEQ: grdMain.value.getFocusedRowData().CHECK_PLAN_SEQ,
    CHECK_TARGET_SEQ: grdSub3.value.getFocusedRowData().CHECK_TARGET_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCC010_SEARCH05',
    param: param,
  }).then((res) => {
    grdSub4.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}
//점검 세부 항목 삭제관련 로직 끝

//부서 조회조건 내부 돋보기아이콘 클릭 이벤트 시작
const openDeptPopup = () => {
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    ASGN_NM: showName.DEPT_NM,
  })
}
//부서 조회조건 내부 돋보기아이콘 클릭 이벤트 끝

//부서팝업 선택 이벤트 관련 로직 시작
const selectedDept = (val) => {
  showName.BSNS_NM = val.ASGN_FULL_NM
  showName.DEPT_NM = val.ASGN_SHRT_NM
  searchParam.BSNS_CD = val.BSNS_CD
  searchParam.DEPT_CD = val.DEPT_CD
}
//부서팝업 선택 이벤트 관련 로직 끝

//부서 조회조건 내부 엑스표아이콘 클릭 이벤트 시작
const clearDept = () => {
  showName.DEPT_NM = ''
  showName.BSNS_NM = ''
  searchParam.DEPT_CD = ''
  searchParam.BSNS_CD = ''
}
//부서 조회조건 내부 엑스표아이콘 클릭 이벤트 끝
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('사업부')"
            required
            labelWidth="50px"
            width="250px"
            v-model="showName.BSNS_NM"
            :readonly="readOnlyValue.BSNS_NM"
          >
          </i-input>
          <i-input
            :label="$t('부서')"
            @keydown.enter="
              (e) => {
                openDeptPopup('부서조회')
              }
            "
            required
            labelWidth="50px"
            width="350px"
            v-model="showName.DEPT_NM"
            :readonly="readOnlyValue.DEPT_NM"
          >
            <template v-slot:append-inner>
              <v-icon
                @click="openDeptPopup('부서조회')"
                icon="mdi-magnify"
                :style="{ display: iconStyle.display }"
              />
              <v-icon
                color="error"
                @click="clearDept"
                icon="mdi-window-close"
                :style="{ display: iconStyle.display }"
              />
            </template>
          </i-input>
          <i-input
            width="100px"
            readonly
            v-model="searchParam.DEPT_CD"
          ></i-input>
          <i-select
            :label="$t('사용여부')"
            :items="codeList.USE_YN"
            item-title="TXT"
            item-value="COD"
            required
            labelWidth="70px"
            width="200px"
            v-model="searchParam.USE_YN"
          >
          </i-select>
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="50%" class="pa-0 mr-3">
            <IGridTitle
              :title="$t('점검 계획')"
              :button-list="['btnRegist', 'btnDelete']"
              @click-button="onButtonsClick1"
            />
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
            />
          </v-sheet>
          <v-sheet width="50%">
            <IGridTitle
              :title="$t('점검 그룹(전사)')"
              :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
              @click-button="onButtonsClick2"
              class="mr-3"
            />
            <div class="d-flex" style="height: 33%">
              <v-sheet
                v-if="layoutValue.groupVisibleValue"
                width="50%"
                class="pa-0 mr-3"
              >
                <RealGrid
                  ref="grdSub1"
                  :grid-view-option="grdSub1Props.gridViewOption"
                  :keys="grdSub1Props.keys"
                  :fields="grdSub1Props.fields"
                  :columns="grdSub1Props.columns"
                />
              </v-sheet>
              <v-sheet :width="layoutValue.empWidthValue" class="pa-0 mr-3">
                <RealGrid
                  ref="grdSub2"
                  :grid-view-option="grdSub2Props.gridViewOption"
                  :keys="grdSub2Props.keys"
                  :fields="grdSub2Props.fields"
                  :columns="grdSub2Props.columns"
                />
              </v-sheet>
            </div>
            <div style="height: 33%" class="mt-2">
              <v-sheet class="pa-0 mr-3" style="height: 100%">
                <IGridTitle
                  :title="$t('점검 항목')"
                  :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                  @click-button="onButtonsClick4"
                />
                <RealGrid
                  ref="grdSub3"
                  :grid-view-option="grdSub3Props.gridViewOption"
                  :keys="grdSub3Props.keys"
                  :fields="grdSub3Props.fields"
                  :columns="grdSub3Props.columns"
                  @onCurrentRowChanged="onGrdSub3CurrRowChanged"
                />
              </v-sheet>
            </div>
            <div style="height: 33%" class="mt-2">
              <v-sheet class="pa-0 mr-3" style="height: 100%">
                <IGridTitle
                  :title="$t('점검 세부 항목')"
                  :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                  @click-button="onButtonsClick5"
                />
                <RealGrid
                  ref="grdSub4"
                  :grid-view-option="grdSub4Props.gridViewOption"
                  :keys="grdSub4Props.keys"
                  :fields="grdSub4Props.fields"
                  :columns="grdSub4Props.columns"
                />
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <DeptPopup ref="deptPopup" @selected="selectedDept"></DeptPopup>
  <EmpPopup ref="empPopup" @selected="selectedEmp"></EmpPopup>
  <SAFCC0010PopUp ref="sAFCC0010Popup" @saved="afterSaved"></SAFCC0010PopUp>
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
