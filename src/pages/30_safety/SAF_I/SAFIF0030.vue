<!-- SAFIF0030 협력사 종사자 의견청취 등록/현황 -->
<!-- 
  화면명 : 협력사 종사자 의견청취 등록/현황
  화면개요 : 협력사 종사자 의견청취 조회, 저장, 삭제, 출력 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'

defineOptions({
  name: '30_safety-SAF_I-SAFIF0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const rowIndex = ref(null)

// OzReport 팝업 여부
const showOz = ref(false)
const params = ref([])
const reportName = ref('/manage/hse/SAFIF0030.ozr')

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  YEAR: dayjs(new Date).format('YYYY'),
})

const saveParams = ref([])

const codeList = reactive({
  BSNSList: [],
  DEPTList: [],
  // 구분
  ACTION_GBN_LIST: [
    { label: '작업환경', value: 'A' },
    { label: '시설', value: 'B' },
    { label: '복지', value: 'C' },
    { label: '공기구', value: 'D' },
    { label: '기타', value: 'E' },
  ],
  // 조치현황
  ACTION_PROGRESS_LIST: [
    { label: '조치중(단기)', value: 'A' }, // 2개월 이내
    { label: '조치중(중기)', value: 'B' }, // 3 ~ 6개월 이내
    { label: '조치중(장기)', value: 'C' }, // 6개월 이상
    { label: '조치완료', value: 'D' },
  ],
  OPINION_DIV: [
    // {value: '', label: '선택'},
    { value: 'A', label: '설비·기계' },
    { value: 'B', label: '휴대용 기계기구, 수공구, 치공구/지그류' },
    { value: 'C', label: '줄걸이 용구' },
    { value: 'D', label: '자재/부재, 부품, 부속물 및 재료' },
    { value: 'E', label: '비계(발판), 작업대, 구조물, 통로' },
    { value: 'F', label: '운반·보관 요구,용기 및 기구' },
    { value: 'G', label: '소방·피난시설' },
    { value: 'H', label: '화학물질 및 화학제품' },
    { value: 'I', label: '교통수단' },
    { value: 'J', label: '사람, 동·식물' },
    { value: 'K', label: '작업환경, 대기여건 등 자연현상' },
    { value: 'L', label: '보호구' },
    { value: 'Z', label: '기타' },
  ],
})

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    header: { height: 60 },
    checkBar: { visible: true },
  },
  keys: ['INSERT_DATE', 'OPINION_CMPNY', 'OPINION_CONT'],
  fields: [
    {
      fieldName: 'MEET_DATE',
      dataType: 'text',
      header: { text: t('일자') },
      textFormat: '([0-9]{4})([0-9]{2})([0-9]{2});$1-$2-$3',
      width: '150',
    },
    {
      fieldName: 'ASGN_SHRT_NM',
      dataType: 'text',
      header: { text: t('담당') },
      width: '250',
    },
    {
      fieldName: 'OPINION_CMPNY',
      dataType: 'text',
      header: { text: t('업체명') },
      width: '250',
    },
    {
      fieldName: 'OPINION_CONT',
      dataType: 'text',
      header: { text: t('내용') },
      width: '250',
    },
    {
      fieldName: 'ACTION_TARGET_YN',
      header: { text: t('조치대상제외') },
      styleName: 'editable_column',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      editor: { textReadOnly: true },
      editable: false,
    },
    {
      fieldName: 'OPINION_DIV',
      dataType: 'text',
      header: { text: t('대구분') },
      lookupDisplay: true,
      lookupData: codeList.OPINION_DIV,
      styleName: 'editable_column',
      editor: {
        type: 'dropdown',
        textReadOnly: true,
        domainOnly: true,
        dropDownWhenClick: true,
      },
      width: '200',
    },
    {
      fieldName: 'OPINION_DETAIL',
      header: { text: t('소구분') },
      editor: {
        type: 'dropdown',
        textReadOnly: true,
        domainOnly: true,
        dropDownWhenClick: true,
      },
      lookupDisplay: true,
      //위의 setLookups에서 설정한 id 지정
      lookupSourceId: 'type1',
      lookupKeyFields: ['OPINION_DIV', 'OPINION_DETAIL'],
      width: '200',
      styleName: 'editable_column',
    },
    // { fieldName: 'OPINION_DETAIL', dataType: 'text', header: { text: t('소구분'), styleName: 'header_validit'},lookupDisplay: true, lookupData: codeList.OPINION_DETAIL,
    //   styleName: 'editable_column', editor: { type: 'dropdown', textReadOnly: true, domainOnly: true, dropDownWhenClick:true }},
    {
      fieldName: 'ACTION_COMMENTS',
      dataType: 'text',
      header: { text: t('내용'), styleName: 'header_validit' },
      styleName: 'editable_column',
      width: '250',
    },
    {
      fieldName: 'COMPLETION_DATE',
      dataType: 'date',
      header: { text: t('완료예정일'), styleName: 'header_validit' },
      datetimeFormat: 'yyyy-MM-dd',
      styleName: 'editable_column',
      width: '150',
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
    },
    {
      fieldName: 'COMPLETION_STATUS',
      dataType: 'text',
      header: { text: t('조치완료여부') },
      styleName: 'editable_column',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' },
      editable: false,
    },
    {
      fieldName: 'ACTION_PROGRESS',
      dataType: 'text',
      header: { text: t('현황'), styleName: 'header_validit' },
      width: '150',
      editable: false,
      lookupDisplay: true,
      editor: { type: 'dropdown'},
      lookupData: codeList.ACTION_PROGRESS_LIST,
      // 'styleCallback': function(grid, dataCell){
      //   if(grid.getValue(dataCell.index.itemIndex, 'ACTION_PROGRESS') == 'D') {
      //     grid.setValue(dataCell.index.itemIndex, 'COMPLETION_STATUS', 'Y')
      //   } else {
      //     grid.setValue(dataCell.index.itemIndex, 'COMPLETION_STATUS', 'N')
      //   }
      // }
    },
    // { fieldName: 'ACTION_EMP_NM', dataType: 'text', header: { text: t('담당자'), styleName: 'header_validit'},styleName: 'editable_column', editable: false, width: '150',
    //   renderer: {
    //     type: "html",
    //     callback: function (grid, cell, w, h) {
    //       let result = ""

    //       result = `<div class="d-flex justify-space-between">
    //         <div class="h-auto">
    //           ${cell.value ? cell.value : '' }
    //         </div>
    //         <div>
    //           <span class="mdi mdi-magnify cursor-pointer"></span>
    //         </div>
    //       </div>`

    //       return result
    //     },
    //   },
    // },
    {
      fieldName: 'MANAGE_DEPT_NM',
      dataType: 'text',
      header: { text: t('관리 부서') },
      editable: false,
      width: '250',
    },
    {
      fieldName: 'MEET_ORG_DEPT_CD',
      dataType: 'text',
      header: { text: t('회의 주재 부서') },
      editable: false,
      width: '250',
    },
    // { fieldName: 'ACTION_EMP_EMAIL', dataType: 'text', header: { text: t('담당자 메일주소') }, editable: false, width: '200'},
    {
      fieldName: 'REMARK',
      dataType: 'text',
      header: { text: t('비고') },
      styleName: 'editable_column',
      width: '250',
    },

    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('회사') },
      visible: false,
      styleName: 'left-column',
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('사업부') },
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t('조직') },
      visible: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('부서') },
      visible: false,
    },
    { fieldName: 'MEET_NO', dataType: 'text', visible: false },
    { fieldName: 'OPINION_SEQ', dataType: 'text', visible: false },
    { fieldName: 'EMP_NM', dataType: 'text', visible: false },
    { fieldName: 'MANAGE_DEPT', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    {
      name: '종사자의견',
      direction: 'horizontal',
      items: ['MEET_DATE', 'ASGN_SHRT_NM', 'OPINION_CMPNY', 'OPINION_CONT'],
      header: { text: t('종사자의견') },
    },
    'ACTION_TARGET_YN',
    {
      name: '구분',
      direction: 'horizontal',
      items: ['OPINION_DIV', 'OPINION_DETAIL'],
      header: { text: t('구분') },
    },
    {
      name: '조치',
      direction: 'horizontal',
      items: [
        'ACTION_COMMENTS',
        'COMPLETION_DATE',
        'COMPLETION_STATUS',
        'ACTION_PROGRESS',
      ],
      header: { text: t('조치') },
    },
    'MANAGE_DEPT_NM',
    'MEET_ORG_DEPT_CD',
    'REMARK',
  ],
})
grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(afterSave)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(deleteData)
      .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
      .run()
  } else if (btn.id === 'btnSendMail') {
    mailSend()
  } else {
    params.value = []
    params.value = [
      'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
      'IN_BSNS_CD=' + searchParams.BSNS_CD,
      'IN_DEPT_CD=' + searchParams.DEPT_CD,
    ]

    showOz.value = true
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFIF0030_SEARCH_01',
    param: searchParams,
  })
}

const afterSearch = async (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  setCellStyle()
}

const beforeSave = async () => {
  let result = false
  saveParams.value = []
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  }

  for (let i = 0; i < chekedRow.length; i++) {
    let data = await grdMain.value.getDataProvider().getJsonRow(chekedRow[i])

    if (data.ACTION_TARGET_YN !== 'Y') {
      if (!data.ACTION_COMMENTS) {
        Message.warn(t('내용은 필수 입력입니다.'))
        return
      } else if (!data.COMPLETION_DATE) {
        Message.warn(t('완료예정일은 필수 입력입니다.'))
        return
      } else if (!data.ACTION_PROGRESS) {
        Message.warn(t('현황은 필수 입력입니다.'))
        return
      } else {
        result = true
      }
      data.COMPLETION_DATE = dayjs(data.COMPLETION_DATE).format('YYYY-MM-DD')
    } else {
      result = true
    }

    saveParams.value.push(data)
  }

  return result
}

const afterSave = () => {
  return commonExecuteApi({
    queryId: 'SAFIF0030_SAVE_01',
    list: saveParams.value,
  })
}

const deleteData = () => {
  return commonExecuteApi({
    queryId: 'SAFIF0030_DELETE_01',
    list: saveParams.value,
  })
}

const mailSend = async () => {
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('선택한 데이터가 없습니다.'))
    return
  } else {
    chekedRow.forEach(async (e) => {
      let data = await grdMain.value.getDataProvider().getJsonRow(e)
      if (data.COMPLETION_DATE > new Date()) {
        Message.warn(t('조치 완료예정일자 넘지 않았습니다.'))
        return
      }

      let param = {
        CMPNY_DIV: data.CMPNY_DIV,
        ASGN_CD: data.MANAGE_DEPT,
      }

      let mailParams = {
        EMAIL: [],
        SUBJECT: '협력사 종사자 의견청취 등록/현황 조치 완료예정일 알림',
        CONTENT: null,
      }
      commonSearchApi({ queryId: 'SAFIF0030_SEARCH_02', param: param }).then(
        (res) => {
          res.ORESULT_CUR.forEach((e) => {
            mailParams.EMAIL.push(e.EMP_NO)
          })
        }
      )

      mailParams.CONTENT = `
          <html>
            <head>
              <meta http-equiv=Content-Type content="text/html; charset=ks_c_5601-1987">
            </head>
            <body>
              <div>
                <p>회의 일자 : ${dayjs(data.MEET_DATE).format('YYYY-MM-DD')}</p>
                <p>업체명 : ${data.OPINION_CMPNY}</p>
                <p>회의 내용 : ${data.OPINION_CONT}</p>
                <br />
                <p>조치 내용 : ${data.ACTION_COMMENTS}</p>
                <p>조치 완료예정일 : ${dayjs(data.COMPLETION_DATE).format(
                  'YYYY-MM-DD'
                )}</p>
                <br />
                <p>조치 완료예정일이 지났습니다.</p>
              </div>
            </body>
          </html>
        `

      commonSendApi(mailParams)
        .then((res) => {
          Message.success(t('메일이 전송되었습니다.'))
        })
        .finally(() => {
          onButtonsClick({ id: 'btnSearch' })
        })
    })
  }
}

const onEditRowChanged = async (
  grid,
  itemIndex,
  dataRow,
  field,
  oldValue,
  newValue
) => {
  
  grid.commit()
  let rowData = await grdMain.value.getDataProvider().getJsonRow(dataRow)
  rowChanged(null, null, dataRow)
  grdMain.value.getGridView().checkItem(itemIndex)
  let fieldName = grdMain.value.getDataProvider().getFieldName(field)

  if (fieldName === 'OPINION_DIV') {
    grdMain.value.getDataProvider().setValue(dataRow, 'OPINION_DETAIL', '')
  } else if (
    fieldName === 'COMPLETION_DATE' && 
    rowData.COMPLETION_STATUS !== 'Y'
  ) {
    let selectDate = dayjs(newValue).format('YYYY-MM-DD')
    let date2 = dayjs().add(2, 'month').format('YYYY-MM-DD')
    let date3 = dayjs().add(6, 'month').format('YYYY-MM-DD')

    // if(selectDate <= dayjs().format('YYYY-MM-DD')){
    //   grdMain.value.getDataProvider().setValue(dataRow, "ACTION_PROGRESS", 'D')
    // }else
    if (selectDate < date2) {
      grdMain.value.getDataProvider().setValue(dataRow, 'ACTION_PROGRESS', 'A')
    } else if (selectDate > date2 && selectDate < date3) {
      grdMain.value.getDataProvider().setValue(dataRow, 'ACTION_PROGRESS', 'B')
    } else if (selectDate > date3) {
      grdMain.value.getDataProvider().setValue(dataRow, 'ACTION_PROGRESS', 'C')
    }
  } else if (fieldName === 'COMPLETION_STATUS') {
    if (newValue === 'Y') {
      grdMain.value.getDataProvider().setValue(dataRow, 'ACTION_PROGRESS', 'D')
    } else {
      grdMain.value.getDataProvider().setValue(dataRow, 'ACTION_PROGRESS', '')
    }
  }

  // 2025.06.30 stylecallback으로 인해 오류 발생 onEditRowChanged 이벤트로 로직 이관
  if (rowData.ACTION_PROGRESS === 'D'){
    grdMain.value.getDataProvider().setValue(dataRow, 'COMPLETION_STATUS', 'Y')
  } else {
    grdMain.value.getDataProvider().setValue(dataRow, 'COMPLETION_STATUS', 'N')
  }
}

const rowChanged = async (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return
  }
  let rowData = await grdMain.value.getDataProvider().getJsonRow(newRow)

  let list = [
    { name: 'ACTION_COMMENTS' },
    { name: 'COMPLETION_DATE' },
    { name: 'ACTION_PROGRESS' },
  ]

  if (rowData.ACTION_TARGET_YN !== 'Y') {
    list.forEach((e) => {
      e.editable = true
      grdMain.value.getGridView().setColumn(e)
    })
  } else {
    list.forEach((e) => {
      e.editable = false
      grdMain.value.getGridView().setColumn(e)
      grdMain.value.getDataProvider().setValue(newRow, e.name, null)
    })
  }
}

const onCellClicked = async (grid, clickData) => {
  if (clickData.cellType === 'data') {
    let rowData = await grdMain.value
      .getDataProvider()
      .getJsonRow(clickData.dataRow)
    if (rowData.ACTION_TARGET_YN === 'Y') {
      grdMain.value
        .getDataProvider()
        .setValue(clickData.dataRow, 'COMPLETION_STATUS', 'N')
    }
  }
}

const setCellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback((grid, dataCell) => {
    let ret = {}
    if (dataCell.dataColumn.fieldName === 'COMPLETION_DATE') {
      let toDay = new Date()
      if (toDay > dataCell.value && dataCell.value !== null) {
        ret.style = { background: '#FFFF00' }
      } else {
        ret = { background: 'rgb(239,248,253)' }
      }
    }

    return ret
  })
}

const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부, 부서 리스트 조회
  Promise.all([commonSearchApi({ queryId: 'searchBSNS', param })]).then(
    (res) => {
      codeList.BSNSList = res[0].ORESULT_CUR
      codeList.BSNSList.unshift({ BSNS_NM: '전체', BSNS_CD: '' })

      bsnsCdChange(searchParams.BSNS_CD)
      setLookups()
    }
  )
}

const bsnsCdChange = (e) => {
  codeList.DEPTList = []
  Promise.all([
    commonSearchApi({
      queryId: 'searchDept',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ORGN_DIV: 'A',
        BSNS_CD: e,
        USE_ONLY: 'Y',
      },
    }),
  ]).then((res) => {
    codeList.DEPTList = res[0].ORESULT_CUR
    codeList.DEPTList.unshift({ ASGN_SHRT_NM: '전체', DEPT_CD: '' })
    searchParams.DEPT_CD = ''

    // grdMain.value.setBindingColumn("ACTION_DEPT_CD", codeList.DEPTList, "DEPT_CD", "ASGN_SHRT_NM")

    grdMain.value.getDataProvider().clearRows()
  })
}

//lookup설정
const setLookups = () => {
  grdMain.value.getGridView().setLookups([
    {
      id: 'type1',
      levels: 2,
      //모든 경우의 수를 나열
      keys: [
        ['A', 'A1'],
        ['A', 'A2'],
        ['A', 'A3'],
        ['A', 'A4'],
        ['A', 'A5'],
        ['A', 'A7'],
        ['B', 'B1'],
        ['B', 'B2'],
        ['B', 'B3'],
        ['B', 'B4'],
        ['C', 'C1'],
        ['C', 'C2'],
        ['C', 'C3'],
        ['D', 'D1'],
        ['D', 'D2'],
        ['D', 'D3'],
        ['E', 'M1'],
        ['E', 'E1'],
        ['E', 'E2'],
        ['E', 'E3'],
        ['E', 'E4'],
        ['E', 'E5'],
        ['E', 'E6'],
        ['E', 'E7'],
        ['E', 'E8'],
        ['F', 'F1'],
        ['F', 'F2'],
        ['F', 'F3'],
        ['F', 'F4'],
        ['G', 'G1'],
        ['G', 'G2'],
        ['G', 'G3'],
        ['H', 'H1'],
        ['H', 'H2'],
        ['H', 'H3'],
        ['H', 'H4'],
        ['H', 'H5'],
        ['H', 'H6'],
        ['H', 'H7'],
        ['H', 'H8'],
        ['I', 'I1'],
        ['I', 'I2'],
        ['I', 'I3'],
        ['J', 'J1'],
        ['K', 'K1'],
        ['L', 'L1'],
        ['Z', 'Z2'],
      ],
      //경우의 수에 따른 표시값 설정
      values: [
        ['제조 및 가공설비·기계'],
        ['운반, 인양 설비·기계'],
        ['건설 기계'],
        ['전기 설비'],
        ['가스 설비'],
        ['환기 설비'],
        ['기타 설비·기계'],
        ['휴대용 공구'],
        ['산업용 로봇'],
        ['수공구, 치공구/지그류'],
        ['기타 휴대용 기계기구, 수공구, 치공구/지그류'],
        ['줄걸이 용구'],
        ['자재/부재'],
        ['조각,파편,쓰레기'],
        ['설비·기계기구 부품 및 부속물'],
        ['서포트'],
        ["기타 자재/부재, 부품, 부속물 및 재료'"],
        ['비계(발판) 및 작업발판'],
        ['임시통로'],
        ['계단, 사다리, 작업대'],
        ['단부 및 개구부'],
        ['통로, 바닥 및 표면 등'],
        ['동력문'],
        ['기타 건물·구조물 등'],
        ['기타 비계(발판), 작업대, 구조물, 통로'], //["M", "M1"],
        ['운반 용구 및 기구'],
        ['툴박스'],
        ['보일러, 압력용기'],
        ['기타 운반·보관 요구, 용기 및 기구'],
        ['소방시설'],
        ['피난시설'],
        ['기타 소방·피난시설'],
        ['산류'],
        ['알카리류'],
        ['방향족 및 지방족 탄화수소'],
        ['할로겐 및 할로겐화합물'],
        ['그 밖의 화학물질'],
        ['금속미립자, 미량원소, 분진, 흄'],
        ['화학제품'],
        ['기타 화학물질 및 화학제품'],
        ['육상교통수단'],
        ['항공, 수상교통수단'],
        ['기타 교통수단'],
        ['사람, 동·식물'],
        ['작업환경, 대기여건 등 자연현상'],
        ['보호구'],
        ['기타'],
      ],
    },
  ])
}

onMounted(() => {
  initCodeList()
})
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
          'btnDelete',
          'btnPrint',
          'btnSendMail',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('년도')"
            labelWidth="35px"
            v-model="searchParams.YEAR"
            type="YEAR"
            width="200px"
          />
          <i-select
            :label="$t('사업부')"
            labelWidth="50px"
            width="250px"
            :items="codeList.BSNSList"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            v-model="searchParams.BSNS_CD"
            @update:modelValue="bsnsCdChange"
          />
          <i-select
            :label="$t('관리부서')"
            label-width="50px"
            width="250px"
            :items="codeList.DEPTList"
            item-title="ASGN_SHRT_NM"
            item-value="DEPT_CD"
            v-model="searchParams.DEPT_CD"
          />
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onEditRowChanged="onEditRowChanged"
            @onCurrentRowChanged="rowChanged"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>

    <!-- OZReport -->
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="params"
      @close="showOz = $event"
    />
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
