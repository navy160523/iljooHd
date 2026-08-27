<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useTagsStore } from '@hiway/stores/tags'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

import SAFFA0020_PopUp04 from '@/pages/30_safety/SAF_F/SAFFA0020_PopUp04.vue'
import SAFFA0020_PopUp05 from '@/pages/30_safety/SAF_F/SAFFA0020_PopUp05.vue'
import SAFFA0020_PopUp06 from '@/pages/30_safety/SAF_F/SAFFA0020_PopUp06.vue'
import SAFFA0020_PopUp08 from '@/pages/30_safety/SAF_F/SAFFA0020_PopUp08.vue'

defineOptions({
  name:'30_safety-SAF_F-SAFFB0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const tagsStore = useTagsStore()
const router = useRouter() 

const grdMain = ref(null)
const saffa0020_popup04 = ref(null)
const saffa0020_popup05 = ref(null)
const saffa0020_popup06 = ref(null)
const saffa0020_popup08 = ref(null)

const searchParam = reactive({ 
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  PART_CD: '',
  DEPT_CD: '',
  FROM_DT: dayjs().add(-1, 'day').startOf('month').format('YYYY-MM-DD'),
  TO_DT: dayjs().add(-1, 'day').format('YYYY-MM-DD'), 
  USE_DIV: 'N'
})

const codeList = reactive({
  BSNS_List: [],
  DEPT_List: [],
  PART_List: []
})

const gradeList = reactive([
  // {Text:'안전',Color:'#C0FFC0'},
  // {Text:'주의',Color:'#FFFFC0'},
  // {Text:'경고',Color:'#FFE0C0'},
  // {Text:'위험',Color:'#FF8080'}
  {Text:'안전',Color:'rgba(5, 129, 253, 0.1)'},
  {Text:'주의',Color:'rgba(11, 182, 156, 0.1)'},
  {Text:'경고',Color:'rgba(255, 118, 55, 0.1)'},
  {Text:'위험',Color:'rgba(255, 82, 82, 0.1)'}
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {edit: { editable:false }, header: { height: 75 }},
  keys : [],
  fields : [ 
    // , mergeRule: { "criteria": "value" }
    { fieldName: 'YYYYMMDD', dataType: 'text', header: { text: t('조회일자') }, mergeRule: { criteria: 'value' }},
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, mergeRule: { criteria: 'value' }, styleName: 'left-column', width: 100},
    { fieldName: 'PART_NM', dataType: 'text', header: { text: t('부문') }, mergeRule: { criteria: 'value' }, styleName: 'left-column', width: 100},
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') } ,styleName: 'left-column', width: 125 },
    // 안전사고
    { fieldName: 'ACC_COUNT_A', dataType: 'text', header: { text: t('중대재해') }, styleName: 'link-cell', width: 85},
    { fieldName: 'ACC_COUNT_B', dataType: 'text', header: { text: t('중대성사고') }, styleName: 'link-cell', width: 85},
    { fieldName: 'ACC_COUNT_C', dataType: 'text', header: { text: t('산재사고') }, styleName: 'link-cell', width: 85},
    { fieldName: 'ACC_COUNT_D', dataType: 'text', header: { text: t('휴업사고') }, styleName: 'link-cell', width: 85},
    { fieldName: 'ACC_COUNT_E', dataType: 'text', header: { text: t('일반사고') }, styleName: 'link-cell', width: 85},
    { fieldName: 'ACC_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'ACC_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 안전수칙
    { fieldName: 'RUL_COUNT_G', dataType: 'text', header: { text: t('The Safe Care\n핵심안전수칙'), styleName: 'multiline-editor' }, styleName: 'link-cell', width: 100},
    { fieldName: 'RUL_COUNT_A', dataType: 'text', header: { text: t('절대수칙') }, styleName: 'link-cell', width: 85},
    { fieldName: 'RUL_COUNT_B', dataType: 'text', header: { text: t('중대성수칙') }, styleName: 'link-cell', width: 85},
    { fieldName: 'RUL_COUNT_F', dataType: 'text', header: { text: t('크레인\n특별안전수칙'), styleName: 'multiline-editor' }, styleName: 'link-cell', width: 85},
    { fieldName: 'RUL_COUNT_C', dataType: 'text', header: { text: t('작업중지') }, styleName: 'link-cell', width: 85},
    { fieldName: 'RUL_COUNT_D', dataType: 'text', header: { text: t('시정통보') }, styleName: 'link-cell', width: 85},
    { fieldName: 'RUL_COUNT_E', dataType: 'text', header: { text: t('일반수칙') }, styleName: 'link-cell', width: 85},
    { fieldName: 'RUL_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'RUL_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 안전교육
    { fieldName: 'EDU_COUNT_A', dataType: 'text', header: { text: t('정기\n안전보건교육'), styleName: 'multiline-editor' }},
    { fieldName: 'EDU_COUNT_B', dataType: 'text', header: { text: t('관리감독자\n안전보건교육'), styleName: 'multiline-editor' }, styleName: 'link-cell'},
    { fieldName: 'EDU_COUNT_C', dataType: 'text', header: { text: t('단기공사') }, styleName: 'link-cell', width: 85},
    { fieldName: 'EDU_COUNT_D', dataType: 'text', header: { text: t('사내강사(내국인)\n등록'), styleName: 'multiline-editor'}, styleName: 'link-cell', width: 125},
    { fieldName: 'EDU_COUNT_E', dataType: 'text', header: { text: t('사내강사(외국인)\n등록'), styleName: 'multiline-editor' }, styleName: 'link-cell', width: 125},
    { fieldName: 'EDU_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'EDU_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 위험성평가
    { fieldName: 'DNG_COUNT_A', dataType: 'text', header: { text: t('수시 위험성평가\n(안전사고)'), styleName: 'multiline-editor' }, styleName: 'link-cell'},
    // { fieldName: 'DNG_COUNT_B', dataType: 'text', header: { text: t('수시 위험성평가\n(비일상작업)'), styleName: 'multiline-editor' }},
    { fieldName: 'DNG_COUNT_C', dataType: 'text', header: { text: t('안전작업요구권\n/안전제보'), styleName: 'multiline-editor' }, styleName: 'link-cell'},
    { fieldName: 'DNG_COUNT_D', dataType: 'text', header: { text: t('현장 위험성평가'), styleName: 'multiline-editor' }, styleName: 'link-cell'},
    { fieldName: 'DNG_MPOINT_TOT2', dataType: 'text', header: { text: t('감점합') }, width: 85},
    { fieldName: 'DNG_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},
    // 안전점검
    { fieldName: 'CHK_COUNT_A', dataType: 'text', header: { text: t('일상점검') }, styleName: 'link-cell', width: 85},
    { fieldName: 'CHK_COUNT_B', dataType: 'text', header: { text: t('일상점검\n(3일 평균)'), styleName: 'multiline-editor' }, styleName: 'link-cell'},
    // { fieldName: 'CHK_COUNT_D', dataType: 'text', header: { text: t('일상점검\n(안전요원)'), styleName: 'multiline-editor' }},
    { fieldName: 'CHK_COUNT_E', dataType: 'text', header: { text: t('PTW 점검\n(3중)'), styleName: 'multiline-editor' }, styleName: 'link-cell'},
    { fieldName: 'CHK_COUNT_F', dataType: 'text', header: { text: t('부서관리작업\n점검'), styleName: 'multiline-editor' }, styleName: 'link-cell'},
    { fieldName: 'CHK_MPOINT_TOT2', dataType: 'text', header: { text: t('가점합') }, width: 85},
    { fieldName: 'CHK_POINT', dataType: 'text', header: { text: t('점수') }, width: 85},

    { fieldName: 'TOT_POINT', dataType: 'text', header: { text: t('합계점수') }, width: 75},
    { fieldName: 'TOT_GRADE', dataType: 'text', header: { text: t('합산등급') }, width: 75},

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사')}, visible: false},
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부')}, visible: false},
    { fieldName: 'PART_CD', dataType: 'text', header: { text: t('부문')}, visible: false},
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서')}, visible: false}
  ],
  columns : [],
  columnLayout:[
    'YYYYMMDD',
    'BSNS_NM',
    'PART_NM',
    'DEPT_NM',
    'TOT_GRADE',
    'TOT_POINT',
    {
      name: '안전사고',
      direction: 'horizontal',
      items: ['ACC_COUNT_A', 'ACC_COUNT_B', 'ACC_COUNT_C', 'ACC_COUNT_D', 'ACC_COUNT_E', 'ACC_MPOINT_TOT2','ACC_POINT'],
      header: { text: t('안전사고(20)') },
    },
    {
      name: '안전수칙',
      direction: 'horizontal',
      items: ['RUL_COUNT_G', 'RUL_COUNT_A', 'RUL_COUNT_B', 'RUL_COUNT_F', 'RUL_COUNT_C', 'RUL_COUNT_D', 'RUL_COUNT_E', 'RUL_MPOINT_TOT2','RUL_POINT'],
      header: { text: t('안전수칙(20)')  },
    },
    {
      name: '안전교육',
      direction: 'horizontal',
      items: ['EDU_COUNT_A', 'EDU_COUNT_B', 'EDU_COUNT_C', 'EDU_COUNT_D', 'EDU_COUNT_E', 'EDU_MPOINT_TOT2','EDU_POINT'],
      header: { text: t('안전교육(20)') },
    },
    {
      name: '위험성평가',
      direction: 'horizontal',
      items: ['DNG_COUNT_A', 'DNG_COUNT_C', 'DNG_COUNT_D', 'DNG_MPOINT_TOT2','DNG_POINT'],
      header: { text: t('위험성평가(20)') },
    },
    {
      name: '안전점검/개입',
      direction: 'horizontal',
      items: ['CHK_COUNT_A', 'CHK_COUNT_B', 'CHK_COUNT_E', 'CHK_COUNT_F', 'CHK_MPOINT_TOT2','CHK_POINT'],
      header: { text: t('안전점검/개입(20)') },
    }
  ]

})
grdMainProps.columns = grdMainProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch'){
    const fromDt = searchParam.FROM_DT.replace(/-/gi, '')
    const toDt = searchParam.TO_DT.replace(/-/gi, '')

    if(fromDt > toDt) {
      Message.warn('조회일자를 확인해 주세요.')
      return
    }

    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnFold'){
    grdMain.value.getGridView().collapseAll()  // 전체 접기
  }else if(btn.id === 'btnExpand'){
    grdMain.value.getGridView().expandAll()       // 전체 펼치기
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SAFFB0020_SEARCH_01', param: searchParam })
}

const afterSearch = res => {
  console.log('searchParam', searchParam)
  console.log('res', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  grdMain.value.getGridView().groupBy(['YYYYMMDD'])

  grdMain.value.getGridView().setRowGroup({
    headerStatement: '${groupValue} _ ${rowCount} 건',    // group header 글자 표시
    expandedAdornments: 'header'                          // group footer 표시
  })

  cellStyle()
}

const bsnsChange = e => {
  searchParam.PART_CD = ''
  searchParam.DEPT_CD = ''
  codeList.DEPT_List = [{ ASGN_NM: '전체', ASGN_CD: '' }]
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_search03', param : searchParam }),
  ]).then(res => {
    codeList.PART_List = res[0].ORESULT_CUR
    codeList.PART_List.unshift({ PART_NM: '전체', PART_CD: '' })
  })
}

const partChange = e => {
  searchParam.DEPT_CD = ''
  Promise.all([
    commonSearchApi({queryId : 'SAFFB0010_search04', param : searchParam }),
  ]).then(res => {
    codeList.DEPT_List = res[0].ORESULT_CUR
    codeList.DEPT_List.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
  })
}

/* ******************* 합산등급 색상 변경 ******************* */
const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}
    
    if(dataCell.dataColumn.fieldName === 'TOT_GRADE'){
      // if(dataCell.value === '안전'){
      //   ret.style = { background: '#C0FFC0'}
      // }else if(dataCell.value === '주의'){
      //   ret.style = { background: '#FFFFC0'}
      // }else if(dataCell.value === '경고'){ 
      //   ret.style = { background: '#FFE0C0'}
      // }else if(dataCell.value === '위험'){
      //   ret.style = { background: '#FF8080'}
      // }
      if(dataCell.value === '안전'){
        ret.style = { background: gradeList[0].Color}
      }else if(dataCell.value === '주의'){
        ret.style = { background: gradeList[1].Color}
      }else if(dataCell.value === '경고'){ 
        ret.style = { background: gradeList[2].Color}
      }else if(dataCell.value === '위험'){
        ret.style = { background: gradeList[3].Color}
      }
    }

    return ret
  })
}

/* 엑셀 다운로드시 merge 위해 전체 펼치기 */
const onContextMenuPopup = (grid, x, y, elementName) => {
  onButtonsClick({id: 'btnExpand'})
}

const initCodeList = () => {
  Promise.all([    
    // 사업부
    commonSearchApi({queryId : 'SAFFB0010_search02', param : searchParam }),
    // 부문
    commonSearchApi({queryId : 'SAFFB0010_search03', param : searchParam }),
    // 부서
    commonSearchApi({queryId : 'SAFFB0010_search04', param : searchParam }),
  ]).then(res => {
    codeList.BSNS_List = res[0].ORESULT_CUR

    codeList.BSNS_List.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.PART_List.unshift({ PART_NM: '전체', PART_CD: '' })
    codeList.DEPT_List.unshift({ ASGN_NM: '전체', ASGN_CD: '' })


    grdMain.value.getGridView().groupPanel.visible = false    // 그룹핑 헤더 판넬영역
    grdMain.value.getGridView().setGroupingOptions({
    expandWhenGrouping: false   // 그룹핑시 그룹 펼침 여부
  })
  })
}

const closePage = pageName => {
  tagsStore.deleteVisitedView({ name: pageName })
  tagsStore.deleteCachedView({ name: pageName })
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  const linkParam = {}

  // console.log('data', data)

  if(clickData.fieldName.indexOf('ACC_COUNT_') > -1) {
    commonSearchApi({ queryId: 'SAFFA0020_SEARCH_17', param: { CMPNY_DIV: data.CMPNY_DIV, DEPT_CD: data.DEPT_CD, YYYYMMDD: data.YYYYMMDD } }).then(res => {
      linkParam.DATE_GBN = 'B'
      linkParam.DEPT_GBN = 'B'
      linkParam.FROM_DT = res.ORESULT_CUR[0].FROM_DT
      linkParam.TO_DT = res.ORESULT_CUR[0].TO_DT
      linkParam.BSNS_CD = data.BSNS_CD
      linkParam.PART_CD = ''
      linkParam.DEPT_CD = data.DEPT_CD
      linkParam.SLICHECK = 'Y'

      closePage('30_safety-SAF_A-SAFAB0020')
      router.push({path: '/30_safety/SAF_A/SAFAB0020', state: { sliSAFAB0020: linkParam } })
    })
  } else if(clickData.fieldName.indexOf('RUL_COUNT_') > -1) {
    const rulType = clickData.fieldName.replace('RUL_COUNT_', '')

    linkParam.CMPNY_DIV = data.CMPNY_DIV
    linkParam.BSNS_CD = data.BSNS_CD
    linkParam.DEPT_CD = data.DEPT_CD
    linkParam.GUBUN = '',
    linkParam.FROM_DT = dayjs(data.YYYYMMDD).subtract(30, 'day').format('YYYY-MM-DD')
    linkParam.TO_DT = data.YYYYMMDD

    if (rulType === 'A' || rulType === 'B' || rulType === 'E' || rulType === 'F' || rulType === 'G') {
      if (rulType === 'A') linkParam.GUBUN = 'A'
      else if (rulType === 'B') linkParam.GUBUN = ''
      else if (rulType === 'E') linkParam.GUBUN = 'B'
      else if (rulType === 'F') linkParam.GUBUN = 'E'
      else if (rulType === 'G') linkParam.GUBUN = 'F'
      closePage('30_safety-SAF_D-SAFDC0010')
      router.push({path: '/30_safety/SAF_D/SAFDC0010', state: { sliSAFDC0010: { GUBUN: 'A' }, sliSAFDC0010_01: linkParam } })
    } else if (rulType === 'D') {
      closePage('30_safety-SAF_D-SAFDC0010')
      router.push({path: '/30_safety/SAF_D/SAFDC0010', state: { sliSAFDC0010: { GUBUN: 'B' }, sliSAFDC0010_02Tab01: linkParam } })
    } else if (rulType === 'C') {
      closePage('30_safety-SAF_D-SAFDC0010')
      router.push({path: '/30_safety/SAF_D/SAFDC0010', state: { sliSAFDC0010: { GUBUN: 'C' }, sliSAFDC0010_03: linkParam } })
    }
  } else if(clickData.fieldName.indexOf('EDU_COUNT_') > -1) {
    const eduType = clickData.fieldName.replace('EDU_COUNT_', '')

    if(eduType === 'B') {
      linkParam.CMPNY_DIV = data.CMPNY_DIV
      linkParam.BSNS_CD = data.BSNS_CD
      linkParam.DEPT_CD = data.DEPT_CD
      linkParam.TO_DT = data.YYYYMMDD.replace(/-/gi, '')

      saffa0020_popup06.value.openPopup(linkParam, data.DEPT_NM)
    } else if(eduType === 'C') {
      linkParam.CMPNY_DIV = data.CMPNY_DIV
      linkParam.BSNS_CD = data.BSNS_CD
      linkParam.DEPT_CD = data.DEPT_CD
      linkParam.TO_DT = data.YYYYMMDD.replace(/-/gi, '')

      saffa0020_popup08.value.openPopup(linkParam, data.DEPT_NM)
    } else if(eduType === 'D' || eduType === 'E') {
      linkParam.BSNS_CD = data.BSNS_CD
      linkParam.DEPT_CD = data.DEPT_CD

      router.push({ path: '/60_edu/EDU_A/EDUAA0010', state: { sliEDUAA0010: linkParam } })
    }
  } else if(clickData.fieldName.indexOf('DNG_COUNT_') > -1) {
    const dngType = clickData.fieldName.replace('DNG_COUNT_', '')

    linkParam.CMPNY_DIV = data.CMPNY_DIV
    linkParam.BSNS_CD = data.BSNS_CD
    linkParam.DEPT_CD = data.DEPT_CD
    linkParam.DEPT_NM = data.DEPT_NM
    linkParam.SLICHECK = '',
    linkParam.FROM_DT = data.YYYYMMDD
    linkParam.TO_DT = data.YYYYMMDD
    linkParam.TMP_TO_DT = data.YYYYMMDD
    linkParam.YEAR = data.YYYYMMDD.substr(0,4)
    linkParam.HALF = data.YYYYMMDD.substr(5, 2) < 7 ? '1' : '2'
    linkParam.DEPT_GBN = 'B'

    if(dngType === 'A') {
      const dateObj = new Date(data.YYYYMMDD)
      dateObj.setDate(dateObj.getDate() - 0)
      linkParam.TO_DT = dateObj.toISOString().slice(0, 10) 
      dateObj.setDate(dateObj.getDate() - 60)
      linkParam.FROM_DT = dateObj.toISOString().slice(0, 10) 
      closePage('30_safety-SAF_A-SAFAB0020')
      router.push({ path: '/30_safety/SAF_A/SAFAB0020', state: { sliSAFAB0020: linkParam }})
    } else if(dngType === 'C') {
      saffa0020_popup04.value.openPopup(linkParam)
    } else if(dngType === 'D') {
      saffa0020_popup05.value.openPopup(linkParam)
    }
  } else if(clickData.fieldName.indexOf('CHK_COUNT_') > -1) {
    const chkType = clickData.fieldName.replace('CHK_COUNT_', '')
    const dateObj = new Date(data.YYYYMMDD)
    dateObj.setMonth(dateObj.getMonth() - 1)
    dateObj.setDate(dateObj.getDate() + 1)
    linkParam.FROM_DT = dateObj.toISOString().slice(0, 10) 

    linkParam.CMPNY_DIV = data.CMPNY_DIV
    linkParam.BSNS_CD = data.BSNS_CD
    linkParam.DEPT_CD = data.DEPT_CD
    linkParam.DEPT_NM = data.DEPT_NM
    linkParam.YYYYMMDD = data.YYYYMMDD.replace(/-/gi, '')
    linkParam.TO_DT = data.YYYYMMDD
    linkParam.SAFE_YN = 'N'

    commonSearchApi({ queryId: 'SAFFA0020_SEARCH_16', param: linkParam }).then(res => {
      linkParam.FROM_DT = res.ORESULT_CUR[0].FROM_DT
      linkParam.FROM_DT2 = res.ORESULT_CUR[0].FROM_DT2
      linkParam.FROM_DT3 = res.ORESULT_CUR[0].FROM_DT3
      linkParam.TO_DT = res.ORESULT_CUR[0].TO_DT
      
      if(chkType === 'A') {
        linkParam.FROM_DT = linkParam.TO_DT
        closePage('30_safety-SAF_C-SAFCD0010')
        router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'DAILY' }, sliSAFCD0010Tab01: linkParam }})
      } else if(chkType === 'B') {
        closePage('30_safety-SAF_C-SAFCD0010')
        router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'DAILY' }, sliSAFCD0010Tab01: linkParam }})
      } else if(chkType === 'E') {
        linkParam.FROM_DT = dayjs(linkParam.TO_DT).subtract(7, 'day').format('YYYY-MM-DD')
        linkParam.TO_DT = linkParam.TO_DT
        linkParam.YARD_APP_YN = 'Y'
        closePage('30_safety-SAF_C-SAFCD0010')
        router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'PTW' }, sliSAFCD0010Tab03: linkParam }})
      } else if(chkType === 'F') {
        linkParam.FROM_DT = linkParam.TO_DT
        closePage('30_safety-SAF_C-SAFCD0010')
        router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'DEPT' }, sliSAFCD0010Tab04: linkParam }})
      }
    })
  }
}

onMounted(() => {
  grdMain.value.getGridView().setFixedOptions({colCount: 6 })
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnFold','btnExpand']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex mb-1">
          <i-input
            :label="$t('조회일자')"
            labelWidth="60px"
            type="date"
            width="230px"
            class="mr-1"
            v-model="searchParam.FROM_DT"
          />
          <i-input
            :label="$t('~')"
            type="date"
            width="180px"
            v-model="searchParam.TO_DT"
          />
          <i-select
            :label="$t('사업부')"
            labelWidth="45px"
            width="250px"
            v-model="searchParam.BSNS_CD"
            :items="codeList.BSNS_List"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            @update:modelValue="bsnsChange"
          />
          <i-select
            :label="$t('부문')"
            labelWidth="35px"
            width="250px"
            v-model="searchParam.PART_CD"
            :items="codeList.PART_List"
            item-value="PART_CD"
            item-title="PART_NM"
            @update:modelValue="partChange"
          />
          <i-select
            :label="$t('부서')"
            labelWidth="35px"
            width="300px"
            v-model="searchParam.DEPT_CD"
            :items="codeList.DEPT_List"
            item-value="ASGN_CD"
            item-title="ASGN_NM"
          />
        </v-sheet>
        <v-sheet class="h-auto flex-column">
          <div class="d-flex align-self-end">
            <div v-for="item in gradeList" :key="item" class="d-flex align-center mb-1 ml-2">
              <div class="pr-1">{{ item.Text }}</div>
              <div class="border pa-2" :style="'width:40px; height:25px; background-color: ' + item.Color"></div>
            </div>
          </div>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onContextMenuPopup="onContextMenuPopup"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <SAFFA0020_PopUp04 ref="saffa0020_popup04" />
    <SAFFA0020_PopUp05 ref="saffa0020_popup05" />
    <SAFFA0020_PopUp06 ref="saffa0020_popup06" />
    <SAFFA0020_PopUp08 ref="saffa0020_popup08" />
  </v-card>
</template>
  
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}

::v-deep(.link-cell):hover {
  color: #0000ff;
  font-weight: bold;
  cursor: pointer;
}
</style>