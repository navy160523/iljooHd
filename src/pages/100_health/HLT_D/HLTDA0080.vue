<!-- 
  화면명 : 부서별 규제물질관리
  화면개요 : 부서별 규제물질관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'

defineOptions({
  name:'100_health-HLT_D-HLTDA0080', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const deptPopup = ref(null)
const grdMain = ref(null)
const gridData = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  DEPT_NM: userStore.deptNm,
  MATNO: '',
  CASNO: '',
  ITEM_DIV: '',
  ITEM_TXT: '',
  FILTER: ''
})

const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  DTX0: [
    { COD: '', TXT: ''},
    { COD: 'Y', TXT: 'O'},
    { COD: 'N', TXT: 'X'},
  ],
  DT13: [
    { COD: '', TXT: ''},
    { COD: '2', TXT: '2'},
  ],
  DTMAT: [],
  DT_FILTER: [],
  ITEM_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'A', TXT: '제품명' },
    { COD: 'B', TXT: 'MSDS명' },
    { COD: 'C', TXT: '자재번호' },
    { COD: 'D', TXT: '제조사' },
    { COD: 'E', TXT: 'CAS번호' },
    { COD: 'F', TXT: 'CAS명' },
  ],
  GBN_TYPE: [
    { COD: '0', TXT: '' },
    { COD: '1', TXT: '기타' },
    { COD: '2', TXT: '관찰' },
    { COD: '3', TXT: '제한' },
    { COD: '4', TXT: '금지' },
  ]
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || userStore.authGrpCd.includes('GRP00372')) isAdmin.value = true

  onButtonsClick({ id: 'btnSearch' })

  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 6,
    })
  })

  Promise.all([
    // 회사구분
    getCodeList('HHIZ000'),
    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV } }), // 부서
    // 분류
    getCodeList('HHII060'),
    // 부서
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV:'Y' } }),
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DTMAT = res[2].ORESULT_CUR
    codeList.DEPT_CD = res[3].ORESULT_CUR

    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: ''})
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})

    grdMain.value.setBindingColumn('MATNO_GBN_TYPE', codeList.GBN_TYPE, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CASNO_GBN_TYPE', codeList.GBN_TYPE, 'COD', 'TXT')

    grdMain.value.setBindingColumn('EXTINFO_05', codeList.DTMAT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_06', codeList.DTMAT, 'COD', 'TXT')
    
    grdMain.value.setBindingColumn('EXTINFO_01', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_02', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_03', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_07', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_08', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_16', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_17', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_18', codeList.DTX0, 'COD', 'TXT')

    grdMain.value.setBindingColumn('EXTINFO_13', codeList.DT13, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_14', codeList.DT13, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_15', codeList.DT13, 'COD', 'TXT')
  })

  grdMain.value.getGridView().filterPanel.visible = true

  setFilter()
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }, header: { height: 75 } },
  keys : ['MATNO', 'MATDSC', 'DEPT_NM', 'VNDNME', 'TYPE_ID', 'CASNO'],
  fields : [ 

    { fieldName: 'MATNO', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('자재번호') }, mergeRule: { criteria: 'value' }, },
    { fieldName: 'MATDSC', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('제품명') }, mergeRule: { criteria: 'value' }, },
    { fieldName: 'DEPT_NM', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('부서') }, mergeRule: { criteria: 'value' }, },
    { fieldName: 'VNDNME', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('납품사') }, mergeRule: { criteria: 'value' }, },
    { fieldName: 'TYPE_ID', width: '50', dataType: 'text', header: { text: t('TYPE') }, mergeRule: { criteria: 'value' }, },
    { fieldName: 'CASNO', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('CAS 번호') } },
    { fieldName: 'KOR_NME', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('국문표기') } },
    { fieldName: 'ENG_NME', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('영문표기') } },
    { fieldName: 'RECDATE', width: '120', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('입고일자') } },
    { fieldName: 'FROM_IGDTRATE', width: '60', dataType: 'number', numberFormat: '0.00', styleName: 'right-column', header: { text: t('FROM') } },
    { fieldName: 'TO_IGDTRATE', width: '60', dataType: 'number', numberFormat: '0.00', styleName: 'right-column', header: { text: t('TO') } },
    { fieldName: 'IGDTRATE', width: '60', dataType: 'number', numberFormat: '0.00', styleName: 'right-column', header: { text: t('AVG') } },
    { fieldName: 'MATNO_GBN_TYPE', width: '60', dataType: 'text', header: { text: t('제품') }, mergeRule: { criteria: 'value' }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        let ret = { style:{ background: '' } }
        let matnoGbnType = grid.getValue(dataCell.index.itemIndex, 'MATNO_GBN_TYPE')
        if(matnoGbnType == '4') {
          ret.style = { background: '#E6B8B7' }
        } else if(matnoGbnType == '3') {
          ret.style = { background: '#FCD5B4' }
        } else if(matnoGbnType == '2') {
          ret.style = { background: '#8DB4E2' }
        } else if(matnoGbnType == '1') {
          ret.style = { background: '#D8E4BC' }
        }
        return ret
      }
    },
    { fieldName: 'CASNO_GBN_TYPE', width: '60', dataType: 'text', header: { text: t('성분') }, lookupDisplay: true,
      'styleCallback': function(grid, dataCell){
        let ret = { style:{ background: '' } }
        let matnoGbnType = grid.getValue(dataCell.index.itemIndex, 'CASNO_GBN_TYPE')
        if(matnoGbnType == '4') {
          ret.style = { background: '#E6B8B7' }
        } else if(matnoGbnType == '3') {
          ret.style = { background: '#FCD5B4' }
        } else if(matnoGbnType == '2') {
          ret.style = { background: '#8DB4E2' }
        } else if(matnoGbnType == '1') {
          ret.style = { background: '#D8E4BC' }
        }
        return ret
      }
    },
    { fieldName: 'EXTINFO_01', width: '60', dataType: 'text', header: { text: t('제조\n등 금지'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_02', width: '60', dataType: 'text', header: { text: t('허가\n물질'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_03', width: '60', dataType: 'text', header: { text: t('취급\n금지'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_04', width: '60', dataType: 'text', header: { text: t('발암성1') } },
    { fieldName: 'EXTINFO_05', width: '60', dataType: 'text', header: { text: t('생식\n독성1'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_06', width: '60', dataType: 'text', header: { text: t('변이\n원성1'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_07', width: '60', dataType: 'text', header: { text: t('특별\n관리'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_08', width: '60', dataType: 'text', header: { text: t('허용\n기준'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_09', width: '60', dataType: 'text', header: { text: t('기준'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_09_RESULT', width: '60', dataType: 'text', header: { text: t('판정'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_10', width: '60', dataType: 'text', header: { text: t('기준'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_10_RESULT', width: '60', dataType: 'text', header: { text: t('판정'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_11', width: '60', dataType: 'text', header: { text: t('기준'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_11_RESULT', width: '60', dataType: 'text', header: { text: t('판정'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_12', width: '60', dataType: 'text', header: { text: t('등록\n대상'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_13', width: '60', dataType: 'text', header: { text: t('발암성2') }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_14', width: '60', dataType: 'text', header: { text: t('생식\n독성2'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_15', width: '60', dataType: 'text', header: { text: t('변이\n원성2'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_16', width: '60', dataType: 'text', header: { text: t('측정\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_17', width: '60', dataType: 'text', header: { text: t('관리\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_18', width: '60', dataType: 'text', header: { text: t('특검\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_19', width: '60', dataType: 'text', header: { text: t('기준'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_19_RESULT', width: '60', dataType: 'text', header: { text: t('판정'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_20', width: '150', dataType: 'text', header: { text: t('기존\n물질'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_21', width: '150', dataType: 'text', header: { text: t('위험물') } },
    
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columnLayout: [
    'MATNO',
    'MATDSC',
    'DEPT_NM',
    'VNDNME',
    'TYPE_ID',
    'CASNO',
    'KOR_NME',
    'ENG_NME',
    'RECDATE',
    {
          name: '규제구분',
          direction: 'horizontal',
          items: [ 'FROM_IGDTRATE', 'TO_IGDTRATE', 'IGDTRATE' ],
          header: { text: t('규제구분') },
    },
    {
          name: '규제구분',
          direction: 'horizontal',
          items: [ 'MATNO_GBN_TYPE', 'CASNO_GBN_TYPE', ],
          header: { text: t('규제구분') },
    },
    {
          name: '금지 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_01', 'EXTINFO_02', 'EXTINFO_03' ],
          header: { text: t('금지 그룹') },
    },
    {
          name: '제한 그룹',
          direction: 'horizontal',
          items: [ 
            'EXTINFO_04',
            'EXTINFO_05', 
            'EXTINFO_06', 
            'EXTINFO_07', 
            'EXTINFO_08', 
            {
              name: '유독물질',
              direction: 'horizontal',
              items: [ 'EXTINFO_09', 'EXTINFO_09_RESULT'],
              header: { text: t('유독물질') },
            },
            {
              name: '사고대비',
              direction: 'horizontal',
              items: [ 'EXTINFO_10', 'EXTINFO_10_RESULT'],
              header: { text: t('사고대비') },
            },
            {
              name: '제한물질',
              direction: 'horizontal',
              items: [ 'EXTINFO_11', 'EXTINFO_11_RESULT'],
              header: { text: t('제한물질') },
            },
            'EXTINFO_12' ],
          header: { text: t('제한 그룹') },
    },
    {
          name: '관찰 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_13', 'EXTINFO_14', 'EXTINFO_15', 'EXTINFO_16', 'EXTINFO_17', 'EXTINFO_18'],
          header: { text: t('관찰 그룹') },
    },
    {
          name: '기타 그룹',
          direction: 'horizontal',
          items: [ 
            {
              name: '배출량조사',
              direction: 'horizontal',
              items: [ 'EXTINFO_19', 'EXTINFO_19_RESULT'],
              header: { text: t('배출량조사') },
            },
          ],
          header: { text: t('기타 그룹') },
    },
    'EXTINFO_20',
    'EXTINFO_21',
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력
// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
  // }

  if (btn.id === 'btnSearch') {
    searchParams.FILTER = ''
    getData()
  } else if (btn.id === 'btnExcelDownload') {
    // 엑셀 다운로드
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '부서규제물질관리'
        + (searchParams.DEPT_NM == '' ? '' : ('_' + searchParams.DEPT_NM))
        + '.xlsx', // 저장될 파일 name
      documentTitle: { //제목 
        message: '부서규제물질관리'
          + (searchParams.DEPT_NM == '' ? '' : ('_' + searchParams.DEPT_NM)),
        visible: true, 
        spaceTop: 1,
        spaceBottom: 0,
        height: 80,
        styleName: 'excelTitle', 
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'visible', // footer 표시하지 않음
      allColumns: false, // visible : false 인 행도 표시할 것인지 여부
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    }) 
  }
}
const getData = () => {
  if(isEmpty(searchParams.CMPNY_DIV)) {
    return Message.warn(t('회사구분을 선택해주십시오.'))
  } 
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTDA0080_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  gridData.value = res.ORESULT_CUR
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const setFilter = () => {
  codeList.DT_FILTER.push({ COD: '', TXT: '전체' })
  codeList.DT_FILTER.push({ COD: 'GROUP_A', TXT: '금지그룹' })
  codeList.DT_FILTER.push({ COD: 'GROUP_B', TXT: '제한그룹' })
  codeList.DT_FILTER.push({ COD: 'GROUP_C', TXT: '관찰그룹' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_01', TXT: '금지그룹(제조등금지)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_02', TXT: '금지그룹(허가물질)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_03', TXT: '금지그룹(취급금지)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_04', TXT: '제한그룹(발암성1)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_05', TXT: '제한그룹(생식독성1)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_06', TXT: '제한그룹(변이원성1)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_07', TXT: '제한그룹(특별관리)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_08', TXT: '제한그룹(허용기준)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_09', TXT: '제한그룹(유독물질)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_10', TXT: '제한그룹(사고대비)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_11', TXT: '제한그룹(제한물질)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_12', TXT: '제한그룹(등록대상)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_13', TXT: '관찰그룹(발암성2)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_14', TXT: '관찰그룹(생식독성2)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_15', TXT: '관찰그룹(변이원성2)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_16', TXT: '관찰그룹(측정대상)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_17', TXT: '관찰그룹(관리대상)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_18', TXT: '관찰그룹(특검대상)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_19', TXT: '기타그룹(배출량조사)' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_20', TXT: '기존물질' })
  codeList.DT_FILTER.push({ COD: 'EXTINFO_21', TXT: '위험물' }) 
}

//팝업 선택 이벤트
const onDeptSelected = val => {  
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.DEPT_NM = val.ASGN_SHRT_NM
  getData()
}

const openDeptcdPopup = () => {
  deptPopup.value.openPopup({ CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, HSE_ONLY : 'Y', ASGN_NM : searchParams.DEPT_NM })
}

const clearDeptcd = () => {
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''
}

// 회사구분 변경
watch(() => searchParams.CMPNY_DIV, (newValue, oldValue) => {
  searchParams.BSNS_CD = ''
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''

  // 회사구분이 바꼈으니 사업부도 바껴야함.
  if(!isEmpty(newValue)) {
    Promise.all([ 
    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: newValue } }), // 부서
    ]).then((res) => {
      codeList.BSNS_CD = res[0].ORESULT_CUR
    })
  }
})

// 사업부 변경
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  searchParams.DEPT_NM = ''

  searchParams.DEPT_CD = ''
  if(isEmpty(newValue)) {
    codeList.DEPT_CD = [
      {DEPT_NM: '전체', DEPT_CD: ''}
    ]
    return
  }
  Promise.all([
    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue, USE_DIV: 'Y'} }),
  ]).then((res) => {
    codeList.DEPT_CD = res[0].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
  })
})

// 데이터필터 변경
watch(() => searchParams.FILTER, (newValue, oldValue) => {
  if (isEmpty(newValue)) {
    grdMain.value.getDataProvider().setRows(gridData.value)
  } else if (newValue === 'GROUP_A') {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item.EXTINFO_01) || !isEmpty(item.EXTINFO_02) || !isEmpty(item.EXTINFO_03)))
  } else if (newValue === 'GROUP_B') {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item.EXTINFO_04) || !isEmpty(item.EXTINFO_05) || !isEmpty(item.EXTINFO_06) || !isEmpty(item.EXTINFO_07) || !isEmpty(item.EXTINFO_08) || !isEmpty(item.EXTINFO_09) || !isEmpty(item.EXTINFO_10) || !isEmpty(item.EXTINFO_11) || !isEmpty(item.EXTINFO_12)))
  } else if (newValue === 'GROUP_C') {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item.EXTINFO_13) || !isEmpty(item.EXTINFO_14) || !isEmpty(item.EXTINFO_15) || !isEmpty(item.EXTINFO_16) || !isEmpty(item.EXTINFO_17) || !isEmpty(item.EXTINFO_18)))
  } else {
    grdMain.value.getDataProvider().setRows(gridData.value.filter(item => !isEmpty(item[newValue])))
  }
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnExcelDownload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-select
              v-model="searchParams.CMPNY_DIV"
              :label="$t('회사구분')"
              label-width="70px"
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT" 
              width="220px"
              :readonly="true"
            />
            <i-select
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')"
              label-width="50px"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              width="200px"
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서')"
              label-width="50px"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM" 
              width="200px"
              :readonly="isEmpty(searchParams.BSNS_CD)"
            />
            <i-input
              :label="$t('자재번호')"
              v-model="searchParams.MATNO" 
              label-width="50px"
              type="text"
              width="200px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
            <i-input
              :label="$t('CAS번호')"
              v-model="searchParams.CASNO"
              label-width="60px"
              type="text" 
              width="210px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
            <i-select
              v-model="searchParams.ITEM_DIV"
              :label="$t('구분')"
              label-width="30px"
              :items="codeList.ITEM_DIV"
              item-value="COD"
              item-title="TXT" 
              width="150px"
            />
            <i-input
              :label="$t('')"
              v-model="searchParams.ITEM_TXT"
              label-width="5px"
              type="text"
              width="150px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
          <i-select
            v-model="searchParams.FILTER"
            :label="$t('데이터 필터')"
            label-width="70px"
            :items="codeList.DT_FILTER"
            item-value="COD"
            item-title="TXT"
            width="300px"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
      </div>
      <!-- 팝업존 -->
      <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
    </v-card-text>
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
    min-height: 400px;
  }
}
</style>