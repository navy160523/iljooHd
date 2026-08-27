<!-- 
  화면명   : Hi-SAFE 주제 현황 조회
  화면개요 : Hi-SAFE 주제 현황을 조회하고 관리, 등록페이지로 이동 및 메일 발송 기능이 포함되어 있음
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from "@/components/IGridTitle.vue"
import { useRouter } from "vue-router"
import ILabel from "@/components/ILabel.vue"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList } from "@hiway/api/commonApi"
import SRMAA0030Popup02 from '@/pages/40_safety-risk/SRM_A/Popup/SRMAA0030Popup02.vue'

defineOptions({
  name: '40_safety-risk-SRM_C-SRMCA0020',
})

// 팝업
// Hi-SAFE 주제 등록/관리 팝업
import HiSafePopup from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup01.vue'
import NewHiSafePopup from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup01.vue'

import EmpPopup from '@/components/popup/EmpPopup.vue'// 인원 검색 팝업
import MailPopup from './Popup/SRMCA0020_popup01.vue'
import ExcellentPopup from './Popup/SRMCA0020_popup02.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어

const grdMain = ref(null)
const empPopup = ref(null)
const mailPopup = ref(null)
const excellentPopup = ref(null)
const menuTitle = ref(null)
const hiSafePopup = ref(null)
const newHiSafePopup = ref(null)
const historyPop = ref(null)

const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)
 //const isAdmin = ref(userStore.authGrpCd.includes('GRP00291') ? true : false)
 //const isAdmin = ref(userStore.authGrpCd.includes('HIWAYGRP00001') ? true : false)

/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD:'',
  PART_CD: '',
  DEPT_CD: '',
  DATE: dayjs(new Date).format('YYYY'),
  EMP_NO:'',
  EMP_NM:'',
  TASK_NO:'',
  TASK_TITLE:'',
  SAVE_FLAG: '',
  EXCELLENT: '',
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  PART_CD: [],
  DEPT_CD: [],
  SAVE_FLAG: [],
  DATE_LIST: [],
  GRADE: [],
  TASK_TYPE: [],
  EXCELLENT: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '대상' },
    { COD: 'B', TXT: '최우수상' },
    { COD: 'C', TXT: '우수상' },
    { COD: 'D', TXT: '장려상' },
    { COD: 'E', TXT: '안전개선상' },
  ]
})
//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {checkBar: { visible: true }},
  keys : ['TASK_NO'],
  fields : [ 
    { fieldName: 'EXCELLENT_NM', dataType: 'text', header: { text: t('등급') }, visible: false },    
    { fieldName: 'EXCELLENT', dataType: 'text', header: { text: t('등급') },
      editable: false, width: "60",
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var val = cell.value
          var text = ''
          codeList.EXCELLENT.forEach((e)=> {
            if(val === e.COD){
              text = e.TXT
            }  
          })
          var str = 
          `<div style="display: flex; justify-content: space-between;">
            <p style="display: flex; align-items: center; justify-content: center; width: -webkit-fill-available; overflow-x: hidden;">
              ${text} 
            </p>
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-pencil text-light-blue-darken-1"
              style="font-size: 22px ;display: flex; align-items: center;"/>
            </button>
          </div>`
          
          if (isAdmin.value === true) {
            return str
          } else {
            return text
          }
        },
      },
    },
    { fieldName: 'YEAR_DATE', dataType: 'text', header: { text: t('연도') },
      editable:false,width: "60"  },
    { fieldName: 'TASK_NO', dataType: 'text',width: "80", header: { text: t('주제번호') } , editable:false},
    { fieldName: 'IMP_PLAN_TERM', dataType: 'text',width: "150", header: { text: t('개선계획기간') } , editable:false},
    { fieldName: 'CMPNY_NM', dataType: 'text', header: { text: t('회사') } , visible:false},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') } , editable:false},
    { fieldName: 'PART_NM', dataType: 'text', visible: false , header: { text: t('부문') } },
    { fieldName: 'SECTOR_NM', dataType: 'text', visible: false , header: { text: t('담당') } },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') } , editable:false},
    { fieldName: 'TITLE', dataType: 'text', header: { text: t('개선주제명') } 
    , editable:false, width: "300", styleName: 'left-column' },
    { fieldName: 'IMP_PLAN_FROM', dataType: 'text', header: { text: t('개선계획기간(From)') } , visible:false},
    { fieldName: 'IMP_PLAN_TO', dataType: 'text', header: { text: t('개선계획기간(To)') } , visible:false},
    { fieldName: 'IMP_PLAN_MOVE', dataType: 'text', header: { text: t('주제관리\n이동') } 
    , editable:false ,width: "35",
    renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div style="display: flex; justify-content: center;">
            <button id="cellButton" style="height: 30px;">
              <span class="mdi mdi-file-edit-outline text-light-blue-darken-1" style="font-size: 22px;"/>
            </button>
          </div>`
          return str
        },
      }, 
    },
    { fieldName: 'SAVE_FLAG', dataType: 'text', visible:false, header: { text: t('진행 상태') } 
    , editable:false
    , renderer:{
        type:'html',
        callback: function(grid,cell,w,h){
          let result = ''
          codeList.SAVE_FLAG.forEach((e)=> {
            if(e.COD === cell.value){
              result = e.TXT
            }else if(cell.value === undefined){
              result = ''
            }
          })
          return result
        }
      },
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'SAVE_FLAG_NM', dataType: 'text', visible: true , header: { text: t('진행 상태') } },
    { fieldName: 'GRADE', dataType: 'text', visible: false , header: { text: t('위험등급') } },
    { fieldName: 'TASK_TYPE', dataType: 'text', visible: false , header: { text: t('과제분류') } },
    { fieldName: 'TASK_COLLABOR_YN', dataType: 'text', visible: false , header: { text: t('협업과제 여부') } },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'EMP_NO', dataType: 'text', visible: false },
    { fieldName: 'EMP_NM', dataType: 'text', visible: false },
    { fieldName: 'EMAIL', dataType: 'text', visible: false },  
    { fieldName: 'TEMP_YN', dataType: 'text', visible: false },    
    { fieldName: 'EXCELLENT_REMARK', dataType: 'text', visible: false },  
  ],
  columns : [],
  
})

grdMainProps.columns = grdMainProps.fields

//그리드 데이터 입력
const data = []

onMounted(() => {
  nextTick(() => {
    menuTitle.value.setBtnProperty('btnSearch2', 'text', '부서 변경이력')
  })

  // 초기 데이터 조회
  initCodeList()
  // 초기 데이터 추가
  codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
  codeList.PART_CD.unshift({ SECTOR_NM: "전체", SECTOR_CD: "" })

  onButtonsClick({id:'btnSearch'})
})

// 메뉴 버튼 (조회)
const onButtonsClick = async btn => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === "btnRegisterTask"){
    newHiSafePopup.value.openPopup({ TASK_NO_1: '', TEMP_YN: 'Y' })
  } else if(btn.id === "btnSendMail"){
    //추후 메일 여러개 발송 시 발생하는 타임아웃 에러 대비
    let selectKey = grdMain.value.getGridView().getCheckedRows(true)

    if (selectKey.length > 0) {
      mailOpenPopup()
    } else {
      Message.warn('1개 이상의 주제를 선택해주세요.')
    }
  } else if (btn.id === "btnPrintList") {
    let printList = []
    const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

    if (checkedRows.length === 0) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }

    for (let rowIdx of checkedRows) {
      const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      await commonSearchApi({
        queryId: "SRMCA0020_DOWNLOAD_01",
        param: {
          TASK_NO: data.TASK_NO
        },
      }).then(res => {
        printList.push(res.ORESULT_CUR[0])
      }).catch(err => {
        return Message.err(err) 
      })
    }
    
    setExcelSheet(printList)
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if(btn.id === 'btnSearch2') {
    historyPop.value.openPopup({
      IS_HISAFE: 'Y'
    })
  }
}

const deleteData = () => {
  let deleteParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  vm.$swal({ 
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({ 
        queryId : 'SRMCA0010_DELETE_01',
        list: deleteParams
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
          onButtonsClick({ id: "btnSearch" }) 
        }
      })
    }
  })
}

const afterSearch = (res) => {
  let searchData = res.ORESULT_CUR
  searchData.forEach((e)=> {
    codeList.SAVE_FLAG.forEach((c)=> {
      if(c.COD === e.SAVE_FLAG){
        e.SAVE_FLAG_NM = c.TXT
      }
    })
    codeList.EXCELLENT.forEach((c)=> {
      if(c.COD === e.EXCELLENT){
        e.EXCELLENT_NM = c.TXT
      }
    })
    codeList.TASK_TYPE.forEach((c)=> {
      if(c.COD === e.TASK_TYPE){
        e.TASK_TYPE = c.TXT
      }
    })
    codeList.GRADE.forEach((c)=> {
      if(c.COD === e.GRADE){
        e.GRADE = c.TXT
      }
    })
  })
  
  grdMain.value.getDataProvider().setRows(searchData)
  
}
//조회 코드
const searchData = () => {
  return commonSearchApi({
    queryId: "SRMCA0020_SEARCH01",
    param: searchParams,
  })
}
// 초기 조회 코드 생성
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ 
    commonSearchApi({
      queryId : 'MNG_searchCommonCode',
      param: { 
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y'
      } 
    }),
    // SAVE_FLAG[1]
    getCodeList('HHIJJA01'),
      // 위험등급[2]
    getCodeList('HHIJJC01'),
    // 과제분류[3]
    getCodeList('HHIJJA02'),
  ]).then(res => {
    // 회사
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    // 진행상태
    codeList.SAVE_FLAG = res[1].ORESULT_CUR
    codeList.GRADE = res[2].ORESULT_CUR
    codeList.TASK_TYPE = res[3].ORESULT_CUR
    let startDate = dayjs(new Date).format('YYYY') - 40
    let endDate = dayjs(new Date).format('YYYY')

    for(let i = endDate; i > startDate; i--){
      codeList.DATE_LIST.push({COD:i.toString() ,TXT: i.toString()})
    }
    codeList.DATE_LIST.unshift({ TXT:'전체', COD: '' })
    codeList.CMPNY_DIV.unshift({ TXT:'전체', COD: '' })
    codeList.SAVE_FLAG.unshift({ TXT:'전체', COD: '' })
    
    companyChange()
  })
}
// 회사명 변경 시 작동
const companyChange = e => {
  codeList.DEPTList = []
  Promise.all([
    commonSearchApi(
      { queryId : 'searchBSNS',
        param:{
          CMPNY_DIV: searchParams.CMPNY_DIV,
          USE_DIV: 'Y',
        }
      }
    )
  ]).then(res => {
    
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    searchParams.BSNS_CD = ''
  }) 
  bsnsChange()
  // reset()
}
// 사업부 변경 시 작동
const bsnsChange = e => {
  if(searchParams.BSNS_CD !== ''){
    Promise.all([
      // 부서[0]
      commonSearchApi({
        queryId : 'searchDept3',
        param : {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          USE_DIV:'Y'
        }
      }),
      // 부문[1]
      commonSearchApi({
        queryId : 'SEARCH_PART',
        param : {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: searchParams.DEPT_CD,
        }
      })
    ]).then(res => {
      codeList.DEPT_CD = res[0].ORESULT_CUR // 부서
      codeList.PART_CD = res[1].ORESULT_CUR // 부문

      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
      codeList.PART_CD.unshift({ PART_NM: "전체", PART_CD: "" })

      searchParams.DEPT_CD = ''
      searchParams.PART_CD = ''
    })
  }
}
const onCellItemClicked = (grid, index, col) => {
  
  if(col.target.classList[0]==="mdi"){ 
    const selectRow = grdMain.value.getRowData(index.dataRow)

    
    if(col.fieldName === 'EXCELLENT'){
      excellentPopup.value.openPopup(selectRow)
    } else {
      if (selectRow.TASK_NO) {
        hiSafePopup.value.openPopup({TASK_NO_1: selectRow.TASK_NO, TEMP_YN: selectRow.TEMP_YN})
      }
    }
  }
}

// TODO: 더블 클릭 이벤트 (추가: 2024.06.11 이희원 - 윤상원 책임 요청)
const onCellDblClicked = (grid, clickData) => {
  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  hiSafePopup.value.openPopup({TASK_NO_1: data.TASK_NO, TEMP_YN: data.TEMP_YN})
}

const empOpenPopup = () => {
  
  empPopup.value.openPopup({ MULTI: false, EMP_NM: searchParams.EMP_NM, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD  })
}

const mailOpenPopup = () => {
  let selectKey = grdMain.value.getGridView().getCheckedRows(true)
  let selectData = []
  selectKey.forEach(element => {
    selectData.push(grdMain.value.getRowData(element))
  })
  
  mailPopup.value.openPopup(selectData)
}

const onEmpSelected = (val) => {
  
  searchParams.EMP_NM = val.EMP_NM
  searchParams.EMP_NO = val.EMP_NO
}

// 담당자 조회 정보 초기화
const clear = () => {
  searchParams.EMP_NO = ''
  searchParams.EMP_NM = ''
}

// Hi-Safe 주제 등록/관리 팝업 (SRMCA0010_popup01에서 데이터가 넘어오면 재조회)
const onHiSafe = val => {
  if (val === 'update') { 
    onButtonsClick({ id: "btnSearch" })
  } else if (val === 'delete') {
    onButtonsClick({ id: "btnSearch" })
  }
}

// Hi-Safe 주제 등록/관리 팝업 (SRMCA0010_popup01에서 데이터가 넘어오면 재조회)
const onNewHiSafe = val => {
  if (val === 'update') { 
    onButtonsClick({ id: "btnSearch" })
  } else if (val === 'delete') {
    onButtonsClick({ id: "btnSearch" })
  }
}

const closedPopup = () => {
  onButtonsClick({ id: "btnSearch" })
}

// 엑셀 다운로드
const setExcelSheet = async data => {
  let excelTable = ""
  
  // 스타일 설정
  excelTable += "<style>"
  excelTable += "  .header-cell {"
  excelTable += "    background-color: #1E88E5;"
  excelTable += "    font-weight: bolder;"
  excelTable += "    height: 30px;"
  excelTable += "    text-align: center;"
  excelTable += "    vertical-align: middle;"
  excelTable += "  }"
  excelTable += "  .leftAlign {"
  excelTable += "    text-align: left;"
  excelTable += "    vertical-align: middle;"
  excelTable += "  }"
  excelTable += "  .centerAlign {"
  excelTable += "    text-align: center;"
  excelTable += "    vertical-align: middle;"
  excelTable += "  }"
  excelTable += "  .rightAlign {"
  excelTable += "    text-align: right;"
  excelTable += "    vertical-align: middle;"
  excelTable += "  }"
  excelTable += "</style>"

  // 헤더 세팅
  excelTable += "<table border='1'>"
  excelTable += "		<thead>"
  excelTable += "			<tr>"
  excelTable += "				<td class='header-cell'>No</td>"
  excelTable += "				<td class='header-cell'>연도</td>"
  excelTable += "			  <td class='header-cell'>주제번호</td>"
  excelTable += "			  <td class='header-cell'>회사</td>"
  excelTable += "			  <td class='header-cell'>사업부</td>"
  excelTable += "			  <td class='header-cell'>부문</td>"
  excelTable += "			  <td class='header-cell'>담당</td>"
  excelTable += "			  <td class='header-cell'>부서</td>"
  excelTable += "			  <td class='header-cell'>개선계획기간(시작)</td>"
  excelTable += "			  <td class='header-cell'>개선계획기간(종료)</td>"
  excelTable += "			  <td class='header-cell'>위험등급</td>"
  excelTable += "			  <td class='header-cell'>과제분류</td>"
  excelTable += "			  <td class='header-cell'>협업부서1</td>"
  excelTable += "			  <td class='header-cell'>협업부서2</td>"
  excelTable += "			  <td class='header-cell'>개선주제명</td>"
  excelTable += "			  <td class='header-cell'>주요개선내용</td>"
  excelTable += "			  <td class='header-cell'>직접비용</td>"
  excelTable += "			  <td class='header-cell'>소요공수</td>"
  excelTable += "			  <td class='header-cell'>기타비용</td>"
  excelTable += "			  <td class='header-cell'>진행상태</td>"
  excelTable += "			  <td class='header-cell'>(주제)기타 자료 등록</td>"
  excelTable += "			  <td class='header-cell'>(주제)제출일자</td>"
  excelTable += "			  <td class='header-cell'>(주제)부서 의견</td>"
  excelTable += "			  <td class='header-cell'>(주제)제출자</td>"
  excelTable += "			  <td class='header-cell'>(주제)사업부 안전의견</td>"
  excelTable += "			  <td class='header-cell'>(주제)SRM 의견</td>"
  excelTable += "			  <td class='header-cell'>(주제)등급 1차</td>"
  excelTable += "			  <td class='header-cell'>(주제)등급 2차</td>"
  excelTable += "			  <td class='header-cell'>(주제)등급 3차</td>"
  excelTable += "			  <td class='header-cell'>(주제)등급 최종</td>"
  excelTable += "			  <td class='header-cell'>(주제)결과</td>"
  excelTable += "			  <td class='header-cell'>(주제)확정여부</td>"
  excelTable += "			  <td class='header-cell'>(중간)기타 자료 등록</td>"
  excelTable += "			  <td class='header-cell'>(중간)제출일자</td>"
  excelTable += "			  <td class='header-cell'>(중간)부서 의견</td>"
  excelTable += "			  <td class='header-cell'>(중간)제출자</td>"
  excelTable += "			  <td class='header-cell'>(중간)사업부 안전의견</td>"
  excelTable += "			  <td class='header-cell'>(중간)SRM 의견</td>"
  excelTable += "			  <td class='header-cell'>(중간)평가 점수 1차</td>"
  excelTable += "			  <td class='header-cell'>(중간)평가 점수 2차</td>"
  excelTable += "			  <td class='header-cell'>(중간)평가 점수 3차</td>"
  excelTable += "			  <td class='header-cell'>(중간)평가 점수 최종</td>"
  excelTable += "			  <td class='header-cell'>(중간)확정여부</td>"
  excelTable += "			  <td class='header-cell'>(결과)기타 자료 등록</td>"
  excelTable += "			  <td class='header-cell'>(결과)제출일자</td>"
  excelTable += "			  <td class='header-cell'>(결과)부서 의견</td>"
  excelTable += "			  <td class='header-cell'>(결과)제출자</td>"
  excelTable += "			  <td class='header-cell'>(결과)사업부 안전의견</td>"
  excelTable += "			  <td class='header-cell'>(결과)SRM 의견</td>"
  excelTable += "			  <td class='header-cell'>(결과)평가 점수 1차</td>"
  excelTable += "			  <td class='header-cell'>(결과)평가 점수 2차</td>"
  excelTable += "			  <td class='header-cell'>(결과)평가 점수 3차</td>"
  excelTable += "			  <td class='header-cell'>(결과)평가 점수 최종</td>"
  excelTable += "			  <td class='header-cell'>(결과)확정여부</td>"
  excelTable += "			</tr>"
  excelTable += "		</thead>"
  excelTable += "		<tbody>"
  
  data.forEach((item, index) => {
    excelTable += "<tr>"
    excelTable += "  <td class='centerAlign'>" + (index + 1).toString() + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.YEAR ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.TASK_NO ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.CMPNY_NM ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.BSNS_NM ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.PART_NM ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.EMP_NM ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.DEPT_NM ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.IMPRO_PLN_FROM ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.IMPRO_PLN_TO ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.GRADE ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.TASK_TYPE ?? '') + "</td>"
    // excelTable += "  <td class='centerAlign'>" + (item.TASK_COLLABOR_YN ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.COLLABO_DEPT1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.COLLABO_DEPT2 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.TITLE ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.IMP_PLAN ?? '') + "</td>"
    excelTable += "  <td class='rightAlign'>" + (item.DIRT_EXP_PLN ?? '') + "</td>"
    excelTable += "  <td class='rightAlign'>" + (item.DUR_DEC_PLN ?? '') + "</td>"
    excelTable += "  <td class='rightAlign'>" + (item.OTHE_COST_PLN ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.SAVE_FLAG ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.OTHE_FILE_ID_1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.REPT_DT_1 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.DEPT_OPIN_1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.INT_USER_ID_1 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.CATE_SAFE_OPIN_1 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.SRM_OPIN_1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.GRADE_1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.GRADE_2 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.GRADE_3 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.GRADE_F ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.OUTCOME ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.CONFIRM_1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.OTHE_FILE_ID_2 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.REPT_DT_2 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.DEPT_OPIN_2 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.INT_USER_ID_2 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.CATE_SAFE_OPIN_2 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.SRM_OPIN_2 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.SCORE_1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.SCORE_2 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.SCORE_3 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.SCORE_F ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.CONFIRM_3 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.OTHE_FILE_ID_3 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.REPT_DT_3 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.DEPT_OPIN_3 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.INT_USER_ID_3 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.CATE_SAFE_OPIN_3 ?? '') + "</td>"
    excelTable += "  <td class='leftAlign'>" + (item.SRM_OPIN_3 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.STEP03_SCORE_1 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.STEP03_SCORE_2 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.STEP03_SCORE_3 ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.STEP03_SCORE_F ?? '') + "</td>"
    excelTable += "  <td class='centerAlign'>" + (item.CONFIRM ?? '') + "</td>"
    excelTable += "</tr>"
  })

  //파일명, 시트명, html
  onExcel("sheets1", excelTable)
}

const onExcel = (sheetNm, sheetHtml) => {
  let html = `
    <html xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8">
    </head>
    <body>
      ${sheetHtml}
    </body>
    </html>
  `

  let blob = new Blob([html], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" })

  let url = window.URL.createObjectURL(blob)
  let link = document.createElement('a')

  link.href = url
  link.download = `${sheetNm}.xls`

  // 링크를 body에 추가하고 클릭하여 다운로드 실행
  document.body.appendChild(link)
  link.click()

  // 다운로드 후 링크와 Blob URL 해제
  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, 0)
}

// 사업부 변경 시 부문, 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  Promise.all([
    // 부서[0]
    commonSearchApi({
        queryId : 'searchDept3',
        param : {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          USE_DIV:'Y'
        }
      }, 
      { useProgress: false }
    ),
    // 부문[1]
    commonSearchApi({
        queryId : 'SECTOR_COMBO',
        param : {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          DEPT_CD: '',
        }
      },
      { useProgress: false }
    )
  ]).then(res => {
    codeList.DEPT_CD = res[0].ORESULT_CUR // 부서
    codeList.PART_CD = res[1].ORESULT_CUR // 부문

    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
    codeList.PART_CD.unshift({ SECTOR_NM: "전체", SECTOR_CD: "" })

    if (newValue !== oldValue) {

      searchParams.DEPT_CD = ''
      searchParams.PART_CD = ''

      // 작업표준 신규제정에서 팝업으로 호출시 부서코드 한번만 넣어주기
      // if(cnt == 0 && props.val1 != null) {
      //   searchParams.DEPT_CD = props.val1.DEPT_CD
      //   cnt++
      // } 
    } 
  })
})

// 부문 변경 시 부문에 소속된 부서 조회
watch(() => searchParams.PART_CD, (newValue, oldValue) => {
  codeList.DEPT_CD = []

  if (newValue !== oldValue) {
    searchParams.DEPT_CD = ''
  }

  commonSearchApi({
    queryId : 'DEPT_COMBO',
    param : {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      DEPT_CD: searchParams.DEPT_CD,
      SECTOR_CD: searchParams.PART_CD,
      USE_DIV: 'Y'
    }},
    { useProgress: false }
  ).then(res => {
    res.ORESULT_CUR.map(el => {
      let newArr = {}

      newArr.DEPT_CD = el.DEPT_CD
      newArr.DEPT_NM = el.DEPT_NM

      codeList.DEPT_CD.push(newArr)
    })

    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" }) 
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="isAdmin === true ? ['btnSearch2', 'btnSearch','btnRegisterTask', 'btnSendMail', 'btnDelete','btnPrintList'] : ['btnSearch2', 'btnSearch','btnRegisterTask', 'btnSendMail', 'btnPrintList']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- 조회조건 -->
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex mb-2" style="padding-left: 15px;">
            <i-select 
              v-model="searchParams.DATE"
              :label="$t('연도')"
              :items="codeList.DATE_LIST"
              item-title="TXT"
              item-value="COD"
              width="235px"
              labelWidth="61px"
            />
            <i-select 
              :label="$t('회사명')"
              :items="codeList.CMPNY_DIV"
              item-title="TXT"
              item-value="COD"
              width="220px"
              v-model="searchParams.CMPNY_DIV"
              marginBetween="20px"
              readonly
            />
            <i-select 
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="220px"
              v-model="searchParams.BSNS_CD"
              marginBetween="20px"
            />
            <i-select 
              :label="$t('부문')"
              :items="codeList.PART_CD"
              item-title="SECTOR_NM"
              item-value="SECTOR_CD"
              width="250px"
              labelWidth="59px"
              v-model="searchParams.PART_CD"
              marginBetween="20px"
            />
            <i-select 
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              width="220px"
              v-model="searchParams.DEPT_CD"
              marginBetween="20px"
            />
            <i-input
              v-model="searchParams.EMP_NM"
              :label="$t('담당자')"
              width="220px"
              append-inner-icon='mdi-magnify'
              clearable
              @click:appendInner="empOpenPopup()"
              @click:clearable="clear()"
              @keydown.enter="empOpenPopup()"
            />
          </div>
          <div class="d-flex">
            <i-input
              v-model="searchParams.TASK_NO"
              :label="$t('주제번호')"
              width="250px"
              label-width="75px"
              append-inner-icon='mdi-magnify'
              @click:appendInner="onButtonsClick({id:'btnSearch'})"
              @keydown.enter="onButtonsClick({id:'btnSearch'})"
            />
            <i-input
              v-model="searchParams.TASK_TITLE"
              :label="$t('주제명')"
              width="460px"
              label-width="50px"
              append-inner-icon='mdi-magnify'
              @click:appendInner="onButtonsClick({id:'btnSearch'})"
              @keydown.enter="onButtonsClick({id:'btnSearch'})"
            />
            <i-select 
              :label="$t('진행상태')"
              label-width="70px"
              width="250px"
              :items="codeList.SAVE_FLAG"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.SAVE_FLAG"
            />
            <i-select 
              :label="$t('등급')"
              width="220px"
              :items="codeList.EXCELLENT"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.EXCELLENT"
              marginBetween="20px"
            />
          </div>
        </v-sheet>

        <!-- 메인그리드 -->
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :gridViewOption="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked="onCellItemClicked"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- 인원 정보 팝업 -->
  <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
  <!-- HiSafe 주제 등록/관리 -->
  <HiSafePopup ref="hiSafePopup" @updated="onHiSafe" />
  <NewHiSafePopup ref="newHiSafePopup" @updated="onNewHiSafe" />

  <!-- 메일 발송 팝업 -->
  <MailPopup ref="mailPopup" />
  <!-- 메일 발송 팝업 -->
  <ExcellentPopup ref="excellentPopup" @closed="closedPopup"/>

  <SRMAA0030Popup02 ref="historyPop" />
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