<!--
  화면명: 평균임금산정내역서(리스트 탭)
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCompanyList, getCodeList, commonLogExecuteApi } from '@hiway/api/commonApi'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import dayjs from 'dayjs'
import { validDateRange } from '@/utils/common.js'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import _ from 'lodash'

const emit = defineEmits([
  'dblClick',
])

defineOptions({
  name:'30_safety-SAF_A-SAFAG0040Tab1',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const logsStore = useLogsStore()
const empPopup = ref(null)
const grdMain = ref(null)

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false } },
  keys : ['CMPNY_DIV', 'SANNO'],
  fields : [
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'CMPNY_NM', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'HAS_DRV', dataType: 'text', header: { text: t('시운전여부') }, visible: false },
    { fieldName: 'SANNO', dataType: 'text', header: { text: t('산재번호') }, visible: true, width: 65 },
    { fieldName: 'SALARY_PRCS_CD', dataType: 'text', header: { text: t('처리상태') }, styleName: 'editable_column',
      lookupDisplay: true, editor: { type: 'dropdown', }, width: 60
    },
    { fieldName: 'SALARY_REQ_YN', dataType: 'text', header: { text: t('임금산정') }, styleName: 'editable_column',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N' }, width: 60 },
    { fieldName: 'REV0_DT', dataType: 'text', header: { text: t('자료일자') }, editable: false, width: 90 },
    { fieldName: 'HLD_OFFI_GBN', dataType: 'text', header: { text: t('재직구분') }, editable: false, width: 60 },
    { fieldName: 'FILENUM', dataType: 'text', header: { text: t('파일번호') }, editable: false, width: 60 },
    { fieldName: 'OKDTE', dataType: 'text', header: { text: t('승인일자') }, editable: false, width: 90 },
    { fieldName: 'SANGBN_NM', dataType: 'text', header: { text: t('산재구분') }, editable: false, width: 60 },
    { fieldName: 'YOGBN_NM', dataType: 'text', header: { text: t('요양구분') }, editable: false, width: 60 },
    { fieldName: 'REQGBN_NM', dataType: 'text', header: { text: t('신청구분') }, editable: false, width: 60 },
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, editable: false, width: 90, styleName: 'left-column' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, editable: false, width: 105, styleName: 'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, editable: false, width: 70, styleName: 'left-column' },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, editable: false, width: 70 },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, editable: false, width: 60 },
    { fieldName: 'REG_NO', dataType: 'text', header: { text: t('주민번호') }, editable: false, width: 125 },
    { fieldName: 'OCCURDATE', dataType: 'text', header: { text: t('재해일자') }, editable: false, width: 90 },
    { fieldName: 'SALARYDTE', dataType: 'text', header: { text: t('산정기준일') }, editable: false, width: 90 },
    { fieldName: 'HUDTE', dataType: 'text', header: { text: t('휴직일자') }, editable: false, width: 90 },
    { fieldName: 'SALARY_HUDTE', dataType: 'text', header: { text: t('휴직예정일') }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }, },
      width: 90 },
    { fieldName: 'SALARY_REMARK', dataType: 'text', header: { text: t('비고') }, styleName: 'editable_column left-column', width: 90 },
    { fieldName: 'TARGETDTE', dataType: 'text', header: { text: t('종결예정일') }, editable: false, width: 90 },
    { fieldName: 'HOSPITAL', dataType: 'text', header: { text: t('요양기관') }, editable: false, width: 100, styleName: 'left-column' },
    { fieldName: 'SALARY', dataType: 'number', header: { text: t('평균임금') }, editable: false, width: 100, styleName: 'right-column',
      numberFormat: '#,###.00' },
    { fieldName: 'TELNO1', dataType: 'text', header: { text: t('연락처') }, editable: false, width: 115 },
    { fieldName: 'SALARY_DESC', dataType: 'text', header: { text: t('추가내용') }, styleName: 'editable_column left-column', width: 125 },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', header: { text: t('퇴직일') }, editable: false, width: 90 },
    { fieldName: 'SALARY_YN', dataType: 'text', header: { text: t('산정여부') }, editable: false, width: 60 },
    { fieldName: 'SALARY_ETC', dataType: 'text', header: { text: t('기타') }, styleName: 'editable_column left-column', width: 125 },
    { fieldName: 'SALARY_SEND_DT', dataType: 'text', header: { text: t('발송일자') }, styleName: 'editable_column',
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true }, },
      width: 90 },
    { fieldName: 'FORM_NM', dataType: 'text', header: { text: t('양식구분') }, editable: false, width: 90, visible: false },
    { fieldName: 'VAC_MONEY', dataType: 'number', header: { text: t('추가 휴가/귀향비') }, editable: false, width: 90, visible: false },
    { fieldName: 'IS_TIME_OVER', dataType: 'text', header: { text: t('임금제공가능') }, editable: false, width: 90, visible: false },
  ]
})
grdMainProps.columns = grdMainProps.fields

const cdList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  SALARY_PRCS_CD: [],
  SANGBN: [],
  DATE_GBN: [
    { COD: 'Z', TXT: '전체' },
    { COD: 'A', TXT: '산정기준일' },
    { COD: 'B', TXT: '재해일자' },
    { COD: 'C', TXT: '승인일자' }
  ],
})

const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  SALARY_PRCS_CD: 'A',
  SANGBN: '',
  EMP_NM: '',
  EMP_NO: '',
  DATE_GBN: 'Z',
  DATE_FROM: '',
  DATE_TO: '',
  USE_DATE: 'N',
})

const saveParams = ref([])

const setCdList = async () => {
  await getCompanyList().then(res => {
    const data = res.ORESULT_CUR.filter(x => x.COD === '100' || x.COD === 'HHI' )
    cdList.CMPNY_DIV = data
    cdList.CMPNY_DIV.unshift({ TXT: '전체', COD: '' })
    cdList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

    // if(data.length > 0) {
    //   searchParams.CMPNY_DIV = data[0].COD
    // }
  })

  await getCodeList('HHIB250030').then(res => {
    const data = _.cloneDeep(res.ORESULT_CUR)
    data.unshift({ TXT: '전체', COD: '' })
    _.remove(data, { COD: 'N' })
    cdList.SANGBN = data

    // console.log('cdList.SANGBN', cdList.SANGBN)
  })

  await getCodeList('HHIB250120').then(res => {
    const data = _.cloneDeep(res.ORESULT_CUR)
    const data2 = _.cloneDeep(res.ORESULT_CUR)
    data.unshift({ TXT: '전체', COD: '' })
    data2.unshift({ TXT: '', COD: '' })
    cdList.SALARY_PRCS_CD = data

    grdMain.value.setBindingColumn(
      'SALARY_PRCS_CD',
      data2,
      'COD',
      'TXT',
    )
  })
}

const setInit = () => {
  searchParams.DATE_FROM = dayjs().add(-3, 'month').format('YYYY-MM-DD')
  searchParams.DATE_TO = dayjs().format('YYYY-MM-DD')

  grdMain.value.getGridView().setFixedOptions({ colCount: 15 })
}

const empPopupOpen = () => {
  empPopup.value.openPopup({
    EMP_NM: searchParams.EMP_NM,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    readonly: true,
  })
}

const empSelected = e => {
  if (e) {
    searchParams.EMP_NO = e.EMP_NO
    searchParams.EMP_NM = e.EMP_NM
  }
}

const searchMain = () => {
  const param = _.cloneDeep(searchParams)

  param.DATE_FROM = param.DATE_FROM.replace(/-/gi, '')
  param.DATE_TO = param.DATE_TO.replace(/-/gi, '')

  // console.log('param', param)

  return commonSearchApi({
    queryId: 'SAFAG0040_SEARCH_01',
    param: param
  })
}

const afterSearchMain = res => {
  const data = res.ORESULT_CUR
  // console.log('data', data)
  for(let i = 0; i < data.length; i++) {
    data[i].SALARY_REQ_YN = 'N'
  }

  grdMain.value.getDataProvider().setRows(data)

  const logParam = {
    userStore: userStore,
    params: searchParams,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R',
    logDesc: '리스트 조회',
    menuId: logsStore.menuId,
    menuNm: t(logsStore.menuId),
  }

  // console.log('logParam', logParam)

  commonLogExecuteApi(logParam)
}

const mainCheck = () => {
  const checkedRow = grdMain.value.getGridView().getCheckedRows()

  if(checkedRow.length < 1) {
    Message.warn(t('선택한 데이터가 없습니다.'))

    return false
  }

  return true
}

const saveData = () => {
  saveParams.value = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.SALARY_HUDTE = data.SALARY_HUDTE ? data.SALARY_HUDTE.replace(/-/gi, '') : ''
    data.SALARY_SEND_DT = data.SALARY_SEND_DT ? data.SALARY_SEND_DT.replace(/-/gi, '') : ''
    data.SALARYDTE = data.SALARYDTE ? data.SALARYDTE.replace(/-/gi, '') : ''
    saveParams.value.push(data)
  }

  // console.log('saveParams', saveParams.value)

  return commonExecuteApi({ queryId: 'SAFAG0040_SAVE_01', list: saveParams.value })
}

const deleteData = () => {
  const deleteParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    deleteParams.push(data)
  }

  // console.log('deleteParams', deleteParams)

  return commonExecuteApi({ queryId: 'SAFAG0040_DELETE_01', list: deleteParams })
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    if(validDateRange(searchParams.DATE_FROM, searchParams.DATE_TO).result) {
      new queryFlowHelper(vm, t)
        .setGridList([grdMain])
        .setQuery(searchMain)
        .setAfter(afterSearchMain)
        .run()
    }
  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(saveData)
      .setAfter(res => {
        const param = {}

        for(let i = 0; i < saveParams.value.length; i++) {
          param[`CMPNY_DIV${i}`] = saveParams.value[i].CMPNY_DIV
          param[`SANNO${i}`] = saveParams.value[i].SANNO
        }

        const logParam = {
          userStore: userStore,
          params: param,
          mgs: '개인정보관련 저장했습니다.',
          crudGbn: 'U',
          logDesc: '리스트 저장',
          menuId: logsStore.menuId,
          menuNm: t(logsStore.menuId),
        }

        // console.log('logParam', logParam)

        commonLogExecuteApi(logParam)

        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  } else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(mainCheck)
      .setQuery(deleteData)
      .setAfter(res => {
        onButtonsClick({ id :'btnSearch' })
      })
      .run()
  } else {
    //
  }
}

const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType !== "header") {
    const currRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    // console.log('currRow', currRow)

    emit('dblClick', currRow)
  }
}

const cellStyle = () => {
  grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
    var ret = {}

    if(dataCell.dataColumn.fieldName === 'SALARY_REQ_YN'){
      const over = grid.getValue(dataCell.index.itemIndex, 'IS_TIME_OVER')
      if(over === 'Y') {
        ret.style = { 'background-color': '#ffdddd' }
      } else {
        ret.style = { 'background-color': '' }
      }
    }

    return ret
  })
}

onMounted(() => {
  nextTick(async () => {
    cellStyle()
    await setCdList()
    setInit()
    onButtonsClick({ id: 'btnSearch' })
  })
})

// watch(() => searchParams.CMPNY_DIV, newValue => {
//   if(newValue) {
//     commonSearchApi({
//       queryId: 'searchBSNS',
//       param: {
//         CMPNY_DIV: searchParams.CMPNY_DIV,
//         USE_DIV: 'N',
//       },
//     }).then(res => {
//       searchParams.BSNS_CD = ''
//       cdList.BSNS_CD = res.ORESULT_CUR
//       cdList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
//     }) 
//   } else {
//     searchParams.BSNS_CD = ''
//     cdList.BSNS_CD = []
//     cdList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
//   }
// })

// watch(() => searchParams.BSNS_CD, newValue => {
//   if(newValue) {
//     commonSearchApi({
//       queryId: 'searchDept3',
//       param: {
//         CMPNY_DIV: searchParams.CMPNY_DIV,
//         BSNS_CD: newValue,
//       },
//     }).then(res => {
//       searchParams.DEPT_CD = ''
//       cdList.DEPT_CD = res.ORESULT_CUR
//       cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
//     }) 
//   } else {
//     searchParams.DEPT_CD = ''
//     cdList.DEPT_CD = []
//     cdList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
//   }
// })
</script>

<template>
  <div class="h-grow">
    <v-sheet class="h-auto">
      <IGridTitle
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea d-flex flex-column">
        <div class="d-flex align-center">
          <i-select
            v-model="searchParams.DATE_GBN"
            :items="cdList.DATE_GBN"
            item-value="COD"
            item-title="TXT"
            width="125px"
            margin="5px"
          />
          <v-checkbox v-model="searchParams.USE_DATE" true-value="Y" false-value="N" />
          <i-input
            v-model="searchParams.DATE_FROM"
            type="date"
            margin="10px"
            width="150px"
          />
          <i-input
            v-model="searchParams.DATE_TO"
            width="170px"
            :label="$t('~')"
            type="date"
          />
          <i-select
            v-model="searchParams.CMPNY_DIV"
            :label="$t('회사')"
            :items="cdList.CMPNY_DIV"
            item-value="COD"
            item-title="TXT"
            width="200px"
          />
          <i-select
            v-model="searchParams.SANGBN"
            :label="$t('산재구분')"
            :items="cdList.SANGBN"
            item-value="COD"
            item-title="TXT"
            width="175px"
          />
          <i-select
            v-model="searchParams.SALARY_PRCS_CD"
            :label="$t('처리상태')"
            :items="cdList.SALARY_PRCS_CD"
            item-value="COD"
            item-title="TXT"
            width="175px"
          />
          <i-input
            :label="$t('재해자')"
            width="170px"
            v-model="searchParams.EMP_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="empPopupOpen"
            @input="searchParams.EMP_NO = ''"
          />
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            :items="cdList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            width="200px"
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            :items="cdList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            width="250px"
            margin="0"
          />
        </div>
        <!-- <div class="d-flex mt-2">
          
        </div> -->
      </v-sheet>
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :keys="grdMainProps.keys" 
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        @on-cell-dbl-clicked="onCellDblClicked"
      />
    </v-sheet>
  </div>

  <EmpPopup ref="empPopup" @selected="empSelected" />
</template>
  
<style scoped lang="scss">
</style>