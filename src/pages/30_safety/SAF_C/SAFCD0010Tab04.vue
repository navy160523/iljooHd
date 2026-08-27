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
import SAFCD0010Tab04Popup01 from './SAFCD0010Tab04Popup01.vue'
import SAFCD0010Tab04Popup01_NEW from './SAFCD0010Tab04Popup01_NEW.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const sAFCD0010Tab04Popup01 = ref(null)
const sAFCD0010Tab04Popup01_NEW = ref(null)
const userStore = useUserStore()
const workOrderer = ref(null) //작업지시자 인원팝업
const checkEmpPopup = ref(null) //점검자 인원팝업
const { sliSAFCD0010Tab04 } = history.state
const isMounted = ref(false)

const searchParam = reactive({
  WORK_DATE_FROM: '', //점검일자 FROM
  WORK_DATE_TO: '', //점검일자 TO
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
  ASGN_YN: 'N', //협력사 포함 여부
  ASGN_CD: '', //협력사코드
  WORK_ORDERER_EMP_NO: '', //작업지시자
  CHECK_EMP_NO: '', //점검자
  SHIP_NO: '', //호선
})

//사용자에게는 보여지지만 실제로 사용되지는 않는값
const showValue = reactive({
  WORK_ORDERER_EMP_NM: '', //작업지시자 이름
  CHECK_EMP_NM: '', //점검자 이름
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  ASGN_CD: [], //협력사
  SHIP_NO: [], //호선
})

const readOnlyValue = reactive({
  BSNS_CD: false, //테스트하려고 false로함 나중에 true로 변경해야함 2024.07.05 김현재 작성
  DEPT_CD: false,
})

//그리드 속성셋팅
const grdMainProps = reactive({
  fields: [
    { fieldName: 'WORK_DATE', dataType: 'text', header: { text: t('작업일') } },
    {
      fieldName: 'WORK_TIME',
      dataType: 'text',
      header: { text: t('작업시간') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('조직') },
      width: '250',
      styleName: 'left-column',
    },
    {
      fieldName: 'RESP_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('작업책임자') },
    },
    {
      fieldName: 'RESP_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('작업책임자사번') },
    },
    {
      fieldName: 'AREA_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('기본') },
    },
    {
      fieldName: 'AREA_DETAIL',
      dataType: 'text',
      editable: false,
      width: '200',
      header: { text: t('상세') },
      styleName: 'left-column',
    },
    {
      fieldName: 'WRK_DIST',
      dataType: 'text',
      editable: false,
      width: '300',
      header: { text: t('작업명') },
      styleName: 'left-column',
    },
    {
      fieldName: 'CHECK_CURRENT',
      dataType: 'text',
      editable: false,
      header: { text: t('점검현황') },
    },
    {
      fieldName: 'WORK_TITLE',
      dataType: 'text',
      editable: false,
      width: '300',
      header: { text: t('작업내용') },
      styleName: 'left-column',
    },
    {
      fieldName: 'WORK_MSG',
      dataType: 'text',
      editable: false,
      header: { text: t('추가전달사항') },
    },
    { fieldName: 'COL8', dataType: 'text', header: { text: t('점검구분') } },
    {
      fieldName: 'WORK_ID',
      dataType: 'text',
      editable: false,
      width: '170',
      header: { text: t('작업지시서 번호') },
    },
    {
      fieldName: 'GROUP_A',
      dataType: 'text',
      editable: false,
      header: { text: t('작업지시자') },
      renderer: {
        type: 'check',
        trueValues: '0',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {style: {background: undefined}}
        var groupA = grid.getValue(dataCell.index.itemIndex, 'GROUP_A')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_A')
        if (groupA === '0' || groupA === 'N') {
          ret.renderer = { type: 'check', readonly: true }
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'}
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
    },
    {
      fieldName: 'GROUP_B',
      dataType: 'text',
      editable: false,
      header: { text: t('세잎클로버/협안') },
      renderer: {
        type: 'check',
        trueValues: '1',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {style: {background: undefined}}
        var groupB = grid.getValue(dataCell.index.itemIndex, 'GROUP_B')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_B')
        if (groupB === '1' || groupB === 'N') {
          ret.renderer = { type: 'check', readonly: true }
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'}
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
    },
    {
      fieldName: 'GROUP_C',
      dataType: 'text',
      editable: false,
      header: { text: t('안전요원') },
      renderer: {
        type: 'check',
        trueValues: '2',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {style: {background: undefined}}
        var groupC = grid.getValue(dataCell.index.itemIndex, 'GROUP_C')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_C')
        if (groupC === '2') {
          ret.renderer = { type: 'check', readonly: true }
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'}
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
    },
    {
      fieldName: 'GROUP_D',
      dataType: 'text',
      editable: false,
      header: { text: t('기타') },
      renderer: {
        type: 'check',
        trueValues: '3',
        falseValues: 'N',
      },
      styleCallback: function (grid, dataCell) {
        var ret = {style: {background: undefined}}
        var groupD = grid.getValue(dataCell.index.itemIndex, 'GROUP_D')
        var MIN_RESULT = grid.getValue(dataCell.index.itemIndex, 'MIN_RESULT_D')
        if (groupD === '3') {
          ret.renderer = { type: 'check', readonly: true }
          if (MIN_RESULT === '0') { ret.style.background = '#ff8080'}
        } else {
          ret.renderer = { editable: false }
        }
        return ret
      },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DESCRIPTION',
      dataType: 'text',
      visible: false,
      header: { text: t('위험유형') },
    },
    {
      fieldName: 'D_WRK_ID',
      dataType: 'text',
      visible: false,
      header: { text: t('부서 관리 작업 대상 ID') },
    },
    {
      fieldName: 'SHPNO',
      dataType: 'text',
      header: { text: t('호선') },
    },

    { fieldName: 'MIN_RESULT_A',      dataType: 'text',      editable: false,      visible: false},
    { fieldName: 'MIN_RESULT_B',      dataType: 'text',      editable: false,      visible: false},
    { fieldName: 'MIN_RESULT_C',      dataType: 'text',      editable: false,      visible: false},
    { fieldName: 'MIN_RESULT_D',      dataType: 'text',      editable: false,      visible: false},
  ],
  columns: [],
  columnLayout: [
    'WORK_DATE',
    'WORK_TIME',
    'WORK_ID', 
    {
      name: '장소',
      direction: 'horizontal',
      items: ['AREA_NM', 'AREA_DETAIL'],
    },
    'SHPNO',
    'ASGN_NM',
    {
      name: '점검여부',
      direction: 'horizontal',
      items: ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D'],
    },
    'CHECK_CURRENT',
    'WRK_DIST',
    {
      name: '작업',
      direction: 'horizontal',
      items: ['RESP_EMP_NM', 'WORK_TITLE'],
    },    
  ],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = async () => {
  await Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        USE_DIV: 'Y',
      },
    }), // 부서
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParam.BSNS_CD,
        DEPT_CD: searchParam.DEPT_CD,
      },
    }),
    commonSearchApi({ queryId: 'SAFCD0010_SEARCH81', param: {} }),
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.ASGN_CD = res[2].ORESULT_CUR
    codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
    codeList.SHIP_NO = res[3].ORESULT_CUR
    codeList.SHIP_NO.unshift({ TXT: '전체', COD: '' })
  })
}

const setSliParams = () => {
  if(sliSAFCD0010Tab04 !== undefined) {
    searchParam.WORK_DATE_FROM = sliSAFCD0010Tab04.FROM_DT
    searchParam.WORK_DATE_TO = sliSAFCD0010Tab04.TO_DT
    searchParam.BSNS_CD = sliSAFCD0010Tab04.BSNS_CD
    searchParam.DEPT_CD = sliSAFCD0010Tab04.DEPT_CD
  }
}

onMounted(async () => {
  defaultDate()
  setSliParams()
  await initCodeList()
  checkSafeTyManage()
  checkVend()
  onButtonsClick({ id: 'btnSearch' })
  //menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
  grdMain.value.getGridView().setFocus(0) //행 0으로

  //열고정
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 5,
    })
  })

  isMounted.value = true
})

//로그인 유저가 협력사이면 협력사여부 체크박스에 자동체크
const checkVend = () => {
  if (userStore.userDiv === 'B') {
    searchParam.ASGN_YN = 'Y'
  }
}

//로그인 유저가  IT관리자,안전직원인지 확인
const checkSafeTyManage = () => {
  //로그인 유저가  IT관리자,안전직원인지 확인
  if (
    userStore.authGrpCd.includes('GRP00381') ||
    userStore.authGrpCd.includes('GRP00369')
  ) {
    readOnlyValue.BSNS_CD = false
    readOnlyValue.DEPT_CD = false
  }
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btn.id === 'btnPrintAllList'){
    const rowCnt = grdMain.value.getDataProvider().getRowCount();

    if (rowCnt <= 0) {
      Message.warn(t("출력할 데이터가 없습니다."));
      return false;
    }
    onExceldown()
  }else {
    // btnRegist
    if (grdMain.value.getGridView().getCurrent().dataRow === -1) {
      Message.warn(t("부서관리작업을 선택 후 누르세요"))
      return
    }

    let data = grdMain.value.getFocusedRowData()

    if (data) {
      console.log('data.WORK_DATE',data.WORK_DATE)
      if (dayjs(getToday()).diff(dayjs(data.WORK_DATE), 'day') < 0){
        Message.warn(t('미래의 작업은 미리 점검 할 수 없습니다.'))
        return
      }

      sAFCD0010Tab04Popup01_NEW.value.openPopup(data)

      /* if (userStore.userId === 'A526166'|| userStore.userId === 'BP16992' || userStore.userId === 'A490342'){
        sAFCD0010Tab04Popup01_NEW.value.openPopup(data)
      } else {      
        //행을 변경할때마다 그 행에대한 점검결과를 입력한 점검자를 조회해서
        //행에대한 점검자가 존재하면 등록버튼 비활성화 존재하지 않으면 활성화
        let param = {
          CMPNY_DIV: data.CMPNY_DIV,
          D_WRK_ID: data.D_WRK_ID,
          WORK_ID: data.WORK_ID,
        }
        commonSearchApi({
          queryId: 'SAFCD0010_SEARCH86',
          param: param,
        }).then((res) => {
          let checkEmp = res.ORESULT_CUR.filter(
            (x) => x.CHECK_EMP_NO === userStore.userId
          )
          if (checkEmp.length > 0) {
            //menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
            Message.warn(t('이미 점검 등록한 작업입니다.'))
            return false
          } else {
            sAFCD0010Tab04Popup01.value.openPopup(data)
          }
        })
      } */
    }
  }
}

// 현재 날짜 자동 입력
const getToday = () => {
  // 현재 날짜 객체 생성
  var today = new Date()
  // 년, 월, 일을 가져오기
  var year = today.getFullYear()
  // 월은 0부터 시작하기 때문에 1을 더해줌
  var month = (today.getMonth() + 1).toString().padStart(2, '0') // 1자리 숫자는 앞에 0을 붙여 두 자리로 만듦
  var day = today.getDate().toString().padStart(2, '0') // 위와 동일
  return year + '-' + month + '-' + day
}

//조회관련 로직시작
const beforeSearch = () => {
  return true
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFCD0010_SEARCH08',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setFontStyle()
}

const setFontStyle = () => {
  //  스타일 지정
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    if (dataCell.value === '점검 완료') {
      ret.style = { color: '#1A40C7' } // ret.style = {background:"#ffff00"} 직접 스타일 적용 가능
    } else if (dataCell.value === '점검 진행중') {
      ret.style = { color: '#009900' }
    } else {
      ret.style = { color: '#000000' }
    }
    return ret
  })
}
//조회관련 로직 끝

//작업지시자 인원팝업 오픈 이벤트
const workOrdererEmpOpenPopup = () => {
  workOrderer.value.openPopup({
    EMP_NM: showValue.WORK_ORDERER_EMP_NM,
  })
}

//작업지시자 인원 선택 이벤트
const selectedWorkOrderer = (val) => {
  showValue.WORK_ORDERER_EMP_NM = val.EMP_NM
  searchParam.WORK_ORDERER_EMP_NO = val.EMP_NO
}

//점검자 인원팝업 오픈 이벤트
const checkEmpOpenPopup = () => {
  checkEmpPopup.value.openPopup({
    EMP_NM: showValue.CHECK_EMP_NM,
  })
}

//점검자 인원 선택 이벤트
const selectedCheckEmp = (val) => {
  showValue.CHECK_EMP_NM = val.EMP_NM
  searchParam.CHECK_EMP_NO = val.EMP_NO
}

//그리드 셀 더블클릭 이벤트 (수정)
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  //GROUP_A ~D가 모두 null이면 점검을 한 사람이 없다는 뜻
  if (!data.GROUP_A && !data.GROUP_B && !data.GROUP_C && !data.GROUP_D) {
    Message.warn(t('점검내역이 없어 수정할 수 없습니다.'))
    return false
  } else {
    sAFCD0010Tab04Popup01_NEW.value.openPopup2(data)

    /* if (userStore.userId === 'A526166'|| userStore.userId === 'BP16992' || userStore.userId === 'A490342'){
      sAFCD0010Tab04Popup01_NEW.value.openPopup2(data)
    } else {
      sAFCD0010Tab04Popup01.value.openPopup2(data)
    } */
  }
}

const onCurrentRowChanged = (grid, oldIdx, newIdx) => {
  /* let data = grdMain.value.getDataProvider().getJsonRow(newIdx)
  //행을 변경할때마다 그 행에대한 점검결과를 입력한 점검자를 조회해서
  //행에대한 점검자가 존재하면 등록버튼 비활성화 존재하지 않으면 활성화
  let param = {
    CMPNY_DIV: data.CMPNY_DIV,
    D_WRK_ID: data.D_WRK_ID,
    WORK_ID: data.WORK_ID,
  }
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH86',
    param: param,
  }).then((res) => {
    let checkEmp = res.ORESULT_CUR.filter(
      (x) => x.CHECK_EMP_NO === userStore.userId
    )
    if (checkEmp.length > 0) {
      //menuTitle.value.disableBtn('btnRegist', true) //등록버튼 비활성화
      Message.warn(t('이미 점검 등록한 작업입니다.'))
      return false
    } else {
      //menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
    }
  }) */
  // //로우 데이터가 있으면
  // if (data) {
  //   menuTitle.value.disableBtn('btnRegist', false) //등록버튼 활성화
  // } else {
  //   menuTitle.value.disableBtn('btnRegist', false) //등록버튼 비활성화
  // }
}

//디폴트 날짜 설정 -1달~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  searchParam.WORK_DATE_FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.WORK_DATE_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

// 엑셀다운
const onExceldown = () => {
  grdMain.value.getGridView().exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName: '부서관리작업 점검 내역_' + searchParam.WORK_DATE_FROM +'_'+  searchParam.WORK_DATE_TO+ '.xlsx', // 저장될 파일 name
    
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    indicator: 'hidden', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: true, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })

}

//팝업 닫혔을때 조회
const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//사업부 변경시 부서 가져옴
watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    if(isMounted.value) {
      console.log('newValue', newValue)
      console.log('oldValue', oldValue)
      commonSearchApi({
        queryId: 'searchDept3',
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
      }).then((res) => {
        if (oldValue) {
          console.log('searchParam.DEPT_CD', searchParam.DEPT_CD)
          searchParam.DEPT_CD = ''
          codeList.DEPT_CD = res.ORESULT_CUR
          codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        } else {
          codeList.DEPT_CD = res.ORESULT_CUR
          codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        }
      }) // 부서
    }
  }
)

//부서변경시 협력사 가져옴
watch(
  () => searchParam.DEPT_CD,
  (newValue, oldValue) => {
    if(isMounted.value) {
      commonSearchApi({
        queryId: 'searchVend',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: searchParam.BSNS_CD,
          DEPT_CD: newValue,
        },
      }).then((res) => {
        searchParam.ASGN_CD = ''
        codeList.ASGN_CD = res.ORESULT_CUR
        codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      })
    }
  }
)
// //사업부 변경시 부서 조회
// watch(
//   () => searchParam.BSNS_CD,
//   (newValue, oldValue) => {
//     commonSearchApi({
//       queryId: 'searchDept3',
//       param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
//     }).then((res) => {
//       if (oldValue) {
//         searchParam.DEPT_CD = ''
//         codeList.DEPT_CD = res.ORESULT_CUR
//         codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
//       } else {
//         codeList.DEPT_CD = res.ORESULT_CUR
//         codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
//       }
//     }) // 부서
//   }
// )

//작업지시자 이름 변경시 사번 초기화
watch(
  () => showValue.WORK_ORDERER_EMP_NM,
  (newValue, oldValue) => {
    searchParam.WORK_ORDERER_EMP_NO = ''
  }
)

//점검자 이름 변경시 사번 초기화
watch(
  () => showValue.CHECK_EMP_NM,
  (newValue, oldValue) => {
    searchParam.CHECK_EMP_NO = ''
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnPrintAllList', 'btnSearch', 'btnRegist']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              label-width="60px"
              :label="$t('작업기간')"
              type="date"
              width="210px"
              class="mr-0"
              v-model="searchParam.WORK_DATE_FROM"
              required
            />
            <span class="mx-3 mt-2"> ~ </span>
            <i-input
              type="date"
              width="150px"
              class="ml-0"
              v-model="searchParam.WORK_DATE_TO"
              required
            />
            <i-select
              label-width="80px"
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="250px"
              class="ml-4"
              v-model="searchParam.BSNS_CD"
              :readonly="readOnlyValue.BSNS_CD"
              required
            />
            <i-select
              label-width="30px"
              :label="$t('부서')"
              width="250px"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              v-model="searchParam.DEPT_CD"
              :readonly="readOnlyValue.DEPT_CD"
            />            
            <i-select
              :label="$t('협력사')"
              width="270px"
              :items="codeList.ASGN_CD"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              v-model="searchParam.ASGN_CD"
              label-width="50px"
            ></i-select>
            <v-checkbox
              label="협력사 포함"
              true-value="Y"
              false-value="N"
              class="mr-2"
              style="margin-top: 3px"
              v-model="searchParam.ASGN_YN"
            ></v-checkbox>
          </div>
          <div class="d-flex mt-2">
            <i-input
              :label="$t('작업지시자')"
              width="210px"
              v-model="showValue.WORK_ORDERER_EMP_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="workOrdererEmpOpenPopup"
              @keydown.enter="workOrdererEmpOpenPopup"
            ></i-input>
            <i-input
              :label="$t('점검자')"
              width="170px"
              v-model="showValue.CHECK_EMP_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="checkEmpOpenPopup"
              @keydown.enter="checkEmpOpenPopup"
            ></i-input>
            <i-select
              label-width="80px"
              v-model="searchParam.SHIP_NO"
              :label="$t('호선/프로젝트')"
              :items="codeList.SHIP_NO"
              item-title="TXT"
              item-value="COD"
              class="ml-2"
              width="250px"
            >
            </i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <IGridTitle :title="$t('부서관리작업 점검 현황')"> 
            <template #editors>
              <div class="d-flex justify-between align-center" style="100%">                
                <div style=" width: 80px; height:25px ; background-color: #ff8080; margin-left: 20px; border-color: grey;" />
                <div style="color: black; margin-left: 10px;"> : 점검결과 '불량' 건 존재</div>                
                <div style="margin-left: 32px;"> ※ 모바일 안전작업지시를 연계해야 부서관리작업이 조회됩니다</div>
              </div>             
            </template>          
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellDblClicked="onCellDblClicked"
            @onCurrentRowChanged="onCurrentRowChanged"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SAFCD0010Tab04Popup01
    ref="sAFCD0010Tab04Popup01"
    @closePopup="closedPopup"
  ></SAFCD0010Tab04Popup01>
  <SAFCD0010Tab04Popup01_NEW
    ref="sAFCD0010Tab04Popup01_NEW"
    @closePopup="closedPopup"
  ></SAFCD0010Tab04Popup01_NEW>
  <EmpPopup ref="workOrderer" @selected="selectedWorkOrderer"></EmpPopup>
  <EmpPopup ref="checkEmpPopup" @selected="selectedCheckEmp"></EmpPopup>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 280px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
