<!--
  화면명 : MNGAA0060.vue
  화면개요 : 부문별 HSE 중점추진사항 수립
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import CopyPopup from '@/components/popup/CopyPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import MNGAA0060Popup from './MNGAA0060Popup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

defineOptions({
  name:'10_management-MNG_A-MNGAA0060',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const logsStore = useLogsStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const copyPopup = ref(null)
const mNGAA0060Popup = ref(null)
const detailParam = ref(null)
const userId = ref(userStore.userId)
const focusRow = ref(0)
const approvalPopup = ref(null)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  BUMUN_CD: '',
  YEAR: dayjs().get("year"),
})

// const confirmParam = reactive({
//   CMPNY_DIV : null,
//   BSNS_CD : null,
//   DEPT_CD : null,
//   ASGN_CD : null,
//   YEAR : null,
//   QUARTER : null,
//   STATUS : null,
//   USER_ID : null,
// })

// 코드리스트 선언
const codeList = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
  HSE_DIV: [ // 구분
    { value: '1', label: '안전' },
    { value: '2', label: '보건' },
    { value: '3', label: '환경' }
  ]
})

const codeList_orgin = reactive({
  BSNS: [], //사업부
  BUMUN: [], //부문
  PLAN_CYCLE: [] //주기
})


const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId: "searchBSNS", param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" }, }),
    commonSearchApi({ queryId: "MNGAA0060_SEARCH_01", param: { }, }),
    // commonSearchApi({ queryId: "MNGAA0060_SEARCH_02", param: { }, }),
    // getCodeList('HHIAF41'),
  ]).then((res) => {
    codeList.BSNS.push({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.BUMUN.push({ ASGN_SHRT_NM: "전체", PART_CD: "" })
    res[0].ORESULT_CUR.forEach(e => {
      codeList.BSNS.push(e)
    })
    res[1].ORESULT_CUR.forEach(e => {
      codeList.BUMUN.push(e)
    })
 
    codeList_orgin.BSNS = res[0].ORESULT_CUR
    codeList_orgin.BUMUN = res[1].ORESULT_CUR
    // codeList_orgin.PLAN_CYCLE = res[2].ORESULT_CUR

    grdMain.value.setBindingColumn('KPI_BSNS_CD', res[0].ORESULT_CUR, 'BSNS_CD', 'BSNS_NM')
    grdMain.value.setBindingColumn('KPI_PART_CD', res[1].ORESULT_CUR, 'PART_CD', 'ASGN_SHRT_NM')
    // grdMain.value.setBindingColumn('KPI_PLAN_CYCLE', res[2].ORESULT_CUR, 'SYS_CD', 'SYS_CDNM')

    changedBsns(searchParams.BSNS_CD)
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL01'],
  fields : [
    { fieldName: 'KPI_BSNS_CD', dataType: 'text', width: '70', 
      lookupDisplay: true, mergeRule: { "criteria": "value" },
      header: { text: t('사업부') }, editable : false 
    },
    { fieldName: 'KPI_PART_CD', dataType: 'text', width: '70', 
      lookupDisplay: true,
      header: { text: t('부문') }, editable : false 
    },
    { fieldName: 'KPI_HSE_DIV', dataType: 'text', width: '70', 
      lookupDisplay: true, lookupData: codeList.HSE_DIV, mergeRule: { "criteria": "value" },
      header: { text: t('구분') }, editable : false  
    },
    { fieldName: 'KPI_AHEAD_ITEM', dataType: 'text', width: '70', header: { text: t('부문 주요 KPI') }, editable : false  },
    { fieldName: 'KPI_PLAN_ITEM', dataType: 'text', width: '70', header: { text: t('실행방안') }, editable : false  },
    { fieldName: 'KPI_PLAN_CYCLE', dataType: 'text', width: '70', 
      lookupDisplay: true,
      header: { text: t('주기') }, editable : false  
    },
    // { fieldName: 'KPI_PLAN_CYCLE_DESC', dataType: 'text', width: '70', header: { text: t('주기별도기준') }, editable : false  },
    { fieldName: 'KPI_PLAN_DOCU', dataType: 'text', width: '70', header: { text: t('실적 관리 방법(기록)') }, editable : false  },
    
    { fieldName: 'KPI_PLAN_CYCLE_COD', dataType: 'text', visible: false },
    { fieldName: 'KPI_PERSON_NAME', dataType: 'text', visible: false },
    { fieldName: 'IDX', dataType: 'text', visible: false  },
    { fieldName: 'KPI_ASGN_ITEM', dataType: 'text', visible: false  },
    { fieldName: 'KPI_ASGN_ITEM_CD', dataType: 'text', visible: false  },
    { fieldName: 'KPI_YEAR', dataType: 'text', visible: false  },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', visible: false  },
    { fieldName: 'INSERT_DATE', dataType: 'text', visible: false  },
    { fieldName: 'UPDATE_USER_ID', dataType: 'text', visible: false  },
    { fieldName: 'UPDATE_DATE', dataType: 'text', visible: false  },

  ],
  columns : [],
  columnLayout: [
  'KPI_BSNS_CD',
  'KPI_PART_CD',
  'KPI_HSE_DIV',
  'KPI_AHEAD_ITEM',
  'KPI_PLAN_ITEM',
  'KPI_PLAN_CYCLE',
  // 'KPI_PLAN_CYCLE_DESC',
  'KPI_PLAN_DOCU',
  'KPI_PERSON_NAME'
  ],
})

grdMainProps.columns = grdMainProps.fields



onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })

  // 로그인 한 아이디의 부문 가져오기
  Promise.all([
    commonSearchApi({ queryId: "MNGAA0060_SEARCH_05", param: { ASGN_CD : userStore.asgnCd }, }),
  ]).then((res) => {
    searchParams.BUMUN_CD = res[0].ORESULT_CUR[0].PART_CD.trim()
  })
})

watch(() => [searchParams.YEAR, searchParams.ASGN_NM, searchParams.QUARTER],([newValueYEAR, newValueASGN_NM, newValueQUARTER], [oldValueYEAR, oldValueASGN_NM, oldValueQUARTER]) => {


  
  grdMain.value.getDataProvider().setRows()
})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
  else if(btn.id === 'btnCreate') {
    mNGAA0060Popup.value.openPopup(codeList_orgin, searchParams, 'CREATE')
  }
  else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id: 'btnSearch' }) })
      .run()
  }
  else if(btn.id === 'btnReqApply') {
    new queryFlowHelper(vm, t)
      .setQuery(searchApplyData)
      .setAfter(afterSearchApply)
      .run()
    
    }
  }


const searchApplyData = () => {
  return commonSearchApi({ queryId : 'MNGAA0060_PRINT_01', param: searchParams })
}
const appData = ref('')

const afterSearchApply = res => {
  appData.value = res.ORESULT_CUR
  if(res.length === 0){ 
    Message.warn('결재할 데이터가 없습니다.')
    return 
  }
  let bumunItem = codeList.BUMUN.filter((x) => x.PART_CD.includes(searchParams.BUMUN_CD))
  let bumun = bumunItem.length > 0 ? bumunItem[0].ASGN_SHRT_NM : ''
  let d = `<html>
            <head>
            <title>OZ HTML</title>
            <style type="text/css">
            <!--
            div.offset{
            position:absolute;
            background-color:transparent;
            box-sizing: border-box;
            left:0px;
            top:0px;
            width:0px;
            height:0px;
            }
            div{
            position:relative;
            }
            table.one{
            width:100%;
            height:100%;
            border:0;
            }
            table.two{
            width:100%;
            height:100%;
            border:0;
            line-height:80%;
            }
            table.three{
            width:100%;
            height:100%;
            border:0;
            line-height:60%;
            }
            table.four{
            width:100%;
            height:100%;
            border:0;
            line-height:40%;
            }
            table.five{
            width:100%;
            height:100%;
            border:0;
            line-height:20%;
            }
            br{letter-spacing:0;}
            #center{
            text-align:center;
            }
            div.b_0{
            border-width:1px;
            border-color:#000000;
            border-style:solid;
            box-sizing: border-box;
            }
            #f_9w12s0{
            font-size:9pt;
            line-height:12pt;
            letter-spacing:0pt;
            }
            font.맑은_고딕{
            font-family:맑은 고딕;
            }
            #f_10w13s0{
            font-size:10pt;
            line-height:13pt;
            letter-spacing:0pt;
            }
            font.굴림{
            font-family:굴림;
            }
            -->  
            </style>
            </head>
            <body style="margin:0px" bgcolor="#FFFFFF" text="#000000">`
    d+=`<div style="position:absolute;background-color:transparent;left:32px;top:0px;">` + bumun + `부문의 `+ searchParams.YEAR + `년도 HSE 주요 KPI를 아래와 같이 결재 상신하오니, 검토 후 재가 부탁드립니다.</div>`

    d+=`<div class=offset style="position:relative;background-color:transparent;left:0px;top:0px;width:1123px;height:793px">
    <div class=offset style="z-index:1"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:39px;width:39px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>No.</font></td></tr></table></div></div>
    <div class=offset style="z-index:2"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:63px;top:39px;width:142px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>사&nbsp업&nbsp부</font></td></tr></table></div></div>
    <div class=offset style="z-index:3"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:203px;top:39px;width:142px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>부&nbsp&nbsp&nbsp문</font></td></tr></table></div></div>
    <div class=offset style="z-index:4"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:343px;top:39px;width:59px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>구&nbsp&nbsp&nbsp분</font></td></tr></table></div></div>
    <div class=offset style="z-index:5"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:400px;top:39px;width:59px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>년&nbsp&nbsp&nbsp도</font></td></tr></table></div></div>
    <div class=offset style="z-index:6"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:457px;top:39px;width:58px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>주&nbsp&nbsp&nbsp기</font></td></tr></table></div></div>
    <div class=offset style="z-index:7"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:513px;top:39px;width:169px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>부문 주요 KPI</font></td></tr></table></div></div>
    <div class=offset style="z-index:8"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:680px;top:39px;width:168px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>실&nbsp행&nbsp방&nbsp안</font></td></tr></table></div></div>
    <div class=offset style="z-index:9"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:846px;top:39px;width:168px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>실적 관리 방법(기록)</font></td></tr></table></div></div>
    <div class=offset style="z-index:10"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1012px;top:39px;width:85px;height:60px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_9w12s0 class=맑은_고딕 style=";font-weight:bold"><nobr/>담&nbsp당&nbsp자</font></td></tr></table></div></div>`
  let zindex = 11
  let idx = 1
  let top = 97
  let height = 76
  for(let i=0;i<res.ORESULT_CUR.length;i++){
    d+=`<div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:26px;top:${top}px;width:39px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${idx++}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:63px;top:${top}px;width:142px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_BSNS_NM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:203px;top:${top}px;width:142px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_PART_NM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:343px;top:${top}px;width:59px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_HSE_DIV_NM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:400px;top:${top}px;width:59px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_YEAR}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:457px;top:${top}px;width:58px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].PLAN_DESC}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:513px;top:${top}px;width:169px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_AHEAD_ITEM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:680px;top:${top}px;width:168px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_PLAN_ITEM}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:846px;top:${top}px;width:168px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_PLAN_DOCU}</font></td></tr></table></div></div>
        <div class=offset style="z-index:${zindex++}"><div class=b_0 style=";padding-left:2px;padding-right:2px;left:1012px;top:${top}px;width:85px;height:${height}px;overflow:hidden;background-color:#FFFFFF"><table class=one cellPadding=0 cellSpacing=0 style="position:relative;top:0pt;"><tr><td id=center><font id=f_10w13s0 class=굴림><nobr/>${res.ORESULT_CUR[i].KPI_PERSON_NAME}</font></td></tr></table></div></div>`

    top = top + height - 2
  }
  d+=`</div>
  </body>
  </html>`

  approvalPopup.value.openPopup({
    CLSS_ID: logsStore.vueId,
    TITLE: 'HSE 부문별 주요 KPI 관리',
    CMPNY_DIV : userStore.cmpnyDiv,
    DATA_KEY : userStore.cmpnyDiv + ';' + userStore.bsnsCd + ';' + userStore.deptCd + ';'+ userStore.asgnCd + ';' + new Date().getFullYear(), // 'CMPNY_DIV;BSNS_CD;DEPT_CD;ASGN_CD;YEAR',
    // DATA_KEY : 'HHI;AX00;X0Q0;X0Q0;2023',
    REPORT : d, // REPORT 등록 테스트는 HTML 파일로 대체함(searchApprovalLine 테스트 확인)
    MODE : '3', //'오프라인 1, 온라인 2, 양쪽 3'
    FORM_ID: '421', //421 일반, 423 단기공사, 424 사고보고서
    CLRLINE : 'CLR_17', //결재라인
    // PARAM424 : '',  //사고보고서용 결재라인no,사번
  })        
}


const searchData = () => {
  return commonSearchApi({ queryId : 'MNGAA0060_SEARCH_03', param: searchParams }) 
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setButton(res.ORESULT_CUR)
}

const deleteData = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
  } else {
    let delParams = []
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      delParams.push(data)
    })

    return commonExecuteApi({ queryId : 'MNGAA0060_DELETE_01', list: delParams })
  }
}

// 부문 선택 시 사업부 자동으로 변경
const changedBumun = e => {
  let bsnsCd = ''
  if(e){
    codeList.BUMUN.forEach((list,idx) => {
      if(list.PART_CD === e){
        bsnsCd = codeList.BUMUN[idx].BSNS_CD
      } 
    })
    
    searchParams.BSNS_CD = bsnsCd
  }
}

// 사업부 선택시 부문리스트 자동으로 정리
const changedBsns = e => {
  let arr = [{
    PART_CD : '',
    ASGN_SHRT_NM : '전체'
  }]
  if(e){ // e가 있으면 (선택한게 전체가 아님)
    codeList_orgin.BUMUN.forEach((list, idx) => {
      if(list.BSNS_CD === e){
        arr.push({
          BSNS_CD : codeList_orgin.BUMUN[idx].BSNS_CD,
          PART_CD : codeList_orgin.BUMUN[idx].PART_CD,
          ASGN_SHRT_NM : codeList_orgin.BUMUN[idx].ASGN_SHRT_NM
        })
      }
    })
    codeList.BUMUN = arr
    searchParams.BUMUN_CD = ''
  }
  else{ // e가 없으면(전체 선택한것)
    codeList_orgin.BUMUN.forEach(e => {
      codeList.BUMUN.push(e)
    })
    searchParams.BUMUN_CD = ''
  }
}

// grid 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  mNGAA0060Popup.value.openPopup(codeList_orgin, data, 'EDIT')
}

const approvalAppkey = appKey => {
  for(let i=0;i<appData.value.length;i++){
    appData.value[i].BSNS_CD = appData.value[i].KPI_BSNS_CD
    appData.value[i].PART_CD = appData.value[i].KPI_PART_CD
    appData.value[i].YEAR = appData.value[i].KPI_YEAR
    appData.value[i].APPROVAL_ID = appKey
    appData.value[i].USER_ID = userStore.userId
  }
  commonExecuteApi({ queryId : 'MNGAA0060_UPDATE_01', list: appData.value })
}

const setButton = (res) => {
  console.log('res:',res)
  // disable은 true 안보임, false 보임 (cs와 반대)
  // visible은 true 보임, false 안보임 (cs와 같음)
  menuTitle.value.disableBtn('btnCreate', false)        // 추가
  menuTitle.value.disableBtn('btnDelete', false)        // 삭제
  menuTitle.value.disableBtn('btnReqApply', false)      // 결재상신

  // 부문을 전체 검색 할 경우는 추가 삭제 결재상신 막기 (예를들어 법무는 결재하고 HR은 결재 안 한 경우가 있을 수 있다.)
  // 부문을 선택 할 경우만 추가, 삭제, 결재상신 활성화 비활성화 하기 

  /*
  * 상태코드(F30)
  * 10 : 작성중
  * 11 : 재작성요청
  * 20 : 검토요청
  * 30 : 검토완료
  * 40 : 결재진행중
  * 50 : 수정요청중
  * 60 : 수정승인
  * 70 : 결재완료/확정 
  */
 console.log('위치확인1')
 if(searchParams.BUMUN_CD === ''){
   menuTitle.value.disableBtn('btnCreate', true)        // 추가
   menuTitle.value.disableBtn('btnDelete', true)        // 삭제
   menuTitle.value.disableBtn('btnReqApply', true)      // 결재상신
   return
  }
  if(res[0].STATUS === '40' || res[0].STATUS === '50' || res[0].STATUS === '70'){
    menuTitle.value.disableBtn('btnCreate', true)        // 추가
    menuTitle.value.disableBtn('btnDelete', true)        // 삭제
    menuTitle.value.disableBtn('btnReqApply', true)      // 결재상신
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete', 'btnReqApply']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

      <!-- 조회조건 -->
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          ※ 부문이 '전체' 인 경우는 추가/삭제/결재상신 버튼이 제한됩니다.
          <v-sheet class="searchArea d-flex " >
              <i-select
                width="180px"
                :label="$t('년도')"
                v-model="searchParams.YEAR"
                label-width="40px"
                type="YEAR"
              /> 
              <i-select 
                :label="$t('사업부')"
                labelWidth="55px"
                width="300px"
                class="ml-4"
                v-model="searchParams.BSNS_CD"
                :items="codeList.BSNS"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
                @update:modelValue="changedBsns"
              />

              <i-select 
                :label="$t('부문')"
                labelWidth="55px"
                width="300px"
                class="ml-4"
                v-model="searchParams.BUMUN_CD"
                :items="codeList.BUMUN"
                item-value="PART_CD"
                item-title="ASGN_SHRT_NM"
                @update:modelValue="changedBumun"
                />
                <!-- item-title="ASGN_SHRT_NM" -->

          </v-sheet>

          <v-sheet class="h-auto">
             <RealGrid
               ref="grdMain"
               :grid-view-option="grdMainProps.gridViewOption"
               :keys="grdMainProps.keys" 
               :fields="grdMainProps.fields"
               :columns="grdMainProps.columns"
               :column-layout="grdMainProps.columnLayout"
               @onCellDblClicked="onCellDblClicked"
             />
           </v-sheet>
        </div>
      </v-card-text>

    <!-- MNGAA0060Popup (추가 팝업) -->
    <MNGAA0060Popup ref="mNGAA0060Popup" 
      @popupExit="() => { onButtonsClick({ id: 'btnSearch' }) }"
    />
    <!-- 결재 팝업 -->
    <ApprovalPopup ref="approvalPopup" @approvalAppkey="approvalAppkey" />
 
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

