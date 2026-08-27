<script setup>
import { onMounted, reactive, ref, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import _ from 'lodash'
import HLTNA0030Popup01 from '@/pages/100_health/HLT_N/HLTNA0030Popup01.vue'
import HLTNA0030Popup02 from '@/pages/100_health/HLT_N/HLTNA0030Popup02.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'

defineOptions({
  name: '100_health-HLT_N-HLTNA0030',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const logStore = useLogsStore()
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const savePopup = ref(null)
const refApprovalPopup = ref(null)
const refAppIPopup = ref(null)

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  ASGN_CD: [],
  APP_STATUS: [],
})

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false, },
    checkBar: { visible: true, },
    edit: { editable: false },
  },
  fields: [
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부'), }, width: '180',
      mergeRule: { criteria: "values['BSNS_CD']" }, },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), }, width: '180',
      mergeRule: { criteria: "values['BSNS_CD'] + values['DEPT_CD']" }, },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('평가 조직명'), }, width: '180',
      mergeRule: { criteria: "values['BSNS_CD'] + values['DEPT_CD'] + values['ASGN_CD']" }, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도'), }, width: '60',
      mergeRule: { criteria: "values['BSNS_CD'] + values['DEPT_CD'] + values['ASGN_CD'] + values['YEAR']" }, },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('순번'), }, width: '45', },
    { fieldName: 'CHECK_DATE', dataType: 'text', header: { text: t('평가일자'), }, width: '100', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('작성자'), }, width: '65', },
    { fieldName: 'WORK_PLACE', dataType: 'text', header: { text: t('주 작업장소'), }, width: '150', },
    { fieldName: 'WORK_DESC', dataType: 'text', header: { text: t('주 작업내용'), }, width: '150', },
    { fieldName: 'APP_STATUS_NM', dataType: 'text', header: { text: t('결재상태'), }, width: '65', },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD'), }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD'), }, visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD'), }, visible: false, },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('EMP_NO'), }, visible: false, },
    { fieldName: 'USER_DIV', dataType: 'text', header: { text: t('USER_DIV'), }, visible: false, },
    { fieldName: 'APPROVE_ID', dataType: 'text', header: { text: t('APPROVE_ID'), }, visible: false, },
    { fieldName: 'APP_EMP_NO', dataType: 'text', header: { text: t('APP_EMP_NO'), }, visible: false, },
    { fieldName: 'APP_STATUS', dataType: 'text', header: { text: t('APP_STATUS'), }, visible: false, },
  ],
  columns: [],
  columnLayout: [],
})

grdMainProps.columns = grdMainProps.fields

const searchDisable = () => {
  /*
  안전경영부(N090)
  안전보건지원부(N1K0)
  조선안전부(N1E0)
  해양안전부(N1F0)
  특수선안전과(N1H0)
  엔진기계안전부(N1I0)
  */
  if(userStore.deptCd === 'N090' || userStore.deptCd === 'N1K0' || userStore.deptCd === 'N1E0'||
     userStore.deptCd === 'N1F0' || userStore.deptCd === 'N1H0' || userStore.deptCd === 'N1I0') {
    return false
  } else {
    return true
  }
}

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: searchDisable() ? userStore.bsnsCd : '',
  DEPT_CD: searchDisable() ? userStore.deptCd : '',
  ASGN_CD: '',
  APP_STATUS: '',
  FROM_DT: `${dayjs().format('YYYY')}-01-01`,
  TO_DT: `${dayjs().format('YYYY')}-12-31`,
})

const searchData = () => {
  return commonSearchApi({ queryId: 'HLTNA0030_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const btnSearch = (showMsg = true) => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

const deleteCheck = () => {
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for(let i = 0; i < checkedRows.length; i++) {
    const data = grdMain.value.getDataProvider().getJsonRow(checkedRows[i])

    if(data.EMP_NO !== userStore.empNo) {
      Message.warn('본인이 등록한 데이터만 삭제 가능합니다.')
      return false
    } else if(data.APP_STATUS !== 'A' && data.APP_STATUS !== 'C') {
      Message.warn(`삭제할 수 없는 데이터입니다.(결재상태 : ${data.APP_STATUS_NM})`)
      return false
    }
  }

  return true
}

const deleteData = () => {
  const deleteParams = []
  const checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (const rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    deleteParams.push(data)
  }

  // console.log('deleteParams', deleteParams)

  return commonExecuteApi({ queryId: 'HLTNA0030_DELETE_01', list: deleteParams })
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    btnSearch()
  } else if(btn.id === 'btnCreate') {
    savePopup.value.openPopup({ CRUD: 'I' })
  } else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(deleteCheck)
      .setQuery(deleteData)
      .setAfter(res => {
        btnSearch(false)
      })
      .run()
  } else if(btn.id === 'btnReqApply') {
    reqApply()
  } else if(btn.id === 'btnApprove') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('승인 하시겠습니까?')
      .setResultMessage('승인 되었습니다.')
      .setBefore(() => {
        const row = grdMain.value.getFocusedRowData()

        if(row == null) {
          Message.warn(t('선택된 데이터가 없습니다.'))
          return false
        }

        return true
      })
      .setQuery(() => {
        const row = _.cloneDeep(grdMain.value.getFocusedRowData())

        row.APP_STATUS = 'Y'

        return commonExecuteApi({ queryId: 'HLTNA0030_APPROVE_01', list: [row] })
      })
      .setAfter(async res => {
        btnSearch(false)
      })
      .run()
  } else if(btn.id === 'btnReject') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('반려 하시겠습니까?')
      .setResultMessage('반려 되었습니다.')
      .setBefore(() => {
        const row = grdMain.value.getFocusedRowData()

        if(row == null) {
          Message.warn(t('선택된 데이터가 없습니다.'))
          return false
        }

        return true
      })
      .setQuery(() => {
        const row = _.cloneDeep(grdMain.value.getFocusedRowData())

        row.APP_STATUS = 'C'

        return commonExecuteApi({ queryId: 'HLTNA0030_APPROVE_01', list: [row] })
      })
      .setAfter(async res => {
        btnSearch(false)
      })
      .run()
  }
}

const reqApply = async () => {
  const row = grdMain.value.getFocusedRowData()

  if(row == null) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return
  }

  if(userStore.userDiv === 'A') {
    const htmlForm = await htmlFormSet(row)

    refApprovalPopup.value.openPopup({
      CLSS_ID: useLogsStore().vueId,
      TITLE: '온열질환 위험성평가 체크리스트',
      CMPNY_DIV: row.CMPNY_DIV,
      DATA_KEY: `${row.CMPNY_DIV};${row.BSNS_CD};${row.DEPT_CD};${row.ASGN_CD};${new Date().getFullYear()}`,
      REPORT: htmlForm,
      MODE: '3',
      FORM_ID: '421',
      CLRLINE: 'CLR_16',
    })
  } else {
    refAppIPopup.value.openPopup(row)
  }
}

const htmlFormSet = async data => {
  let html = ''
  let mainData
  let checkDiv
  let checkList

  await commonSearchApi({ queryId: 'HLTNA0030_SEARCH_01', param: data }).then(res => {
    mainData = res.ORESULT_CUR[0]
  })

  await commonSearchApi({ queryId: 'HLTNA0030_SEARCH_02', param: data }).then(res => {
    const result = _.cloneDeep(res.ORESULT_CUR)

    checkDiv = _.uniqBy(
      result.map(row => {
        return {
          CHECK_CD1: row.CHECK_CD1,
          CHECK_CDNM1: row.CHECK_CDNM1,
          CHECK_CD1_DESC1: row.CHECK_CD1_DESC1,
          CHECK_CD1_DESC2: row.CHECK_CD1_DESC2
        }
      }),
      'CHECK_CD1'
    )

    checkList = _.uniqWith(
      result.map(row => {
        return {
          CHECK_CD1: row.CHECK_CD1,
          CHECK_CDNM1: row.CHECK_CDNM1,
          CHECK_CD2: row.CHECK_CD2,
          CHECK_CDNM2: row.CHECK_CDNM2,
          CHECK_CD3: row.CHECK_CD3,
          CHECK_CDNM3: row.CHECK_CDNM3,
          CHECK_CD3_DESC1: row.CHECK_CD3_DESC1,
          CHECK_CD3_DESC2: row.CHECK_CD3_DESC2,
          CHECK_VALUE_NM: row.CHECK_VALUE_NM,
          REMARKS: row.REMARKS == null ? '' : row.REMARKS,
        }
      }),
      (a, b) => {
        return a.CHECK_CD1 === b.CHECK_CD1 && a.CHECK_CD2 === b.CHECK_CD2 && a.CHECK_CD3 === b.CHECK_CD3
      }
    )

    for(let i = 0; i < checkList.length; i++) {
      if(i === 0 || (i > 0 &&  checkList[i].CHECK_CD2 !== checkList[i - 1].CHECK_CD2)) {
        checkList[i].ROWSPAN = _.filter(checkList, row => row.CHECK_CD1 === checkList[i].CHECK_CD1 && row.CHECK_CD2 === checkList[i].CHECK_CD2).length
      } else {
        checkList[i].ROWSPAN = null
      }
    }
  })

  // console.log('mainData', mainData)
  // console.log('checkDiv', checkDiv)
  // console.log('checkList', checkList)

  html += `<div style="width: 100%;">`
  html += `    <table style="width: 100%; border: 1px solid black; border-collapse: collapse;">`
  html += `        <colgroup>`
  html += `            <col style="width: 20%;" />`
  html += `            <col style="width: 30%;" />`
  html += `            <col style="width: 20%;" />`
  html += `            <col style="width: 30%;" />`
  html += `        </colgroup>`
  html += `        <tbody>`
  html += `            <tr height="45px">`
  html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #deeaf6;">부서명</th>`
  html += `                <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${mainData.DEPT_NM}</td>`
  html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #deeaf6;">평가일자</th>`
  html += `                <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${mainData.CHECK_DATE}</td>`
  html += `            </tr>`
  html += `            <tr height="45px">`
  html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #deeaf6;">평가 조직</th>`
  html += `                <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${mainData.ASGN_NM}</td>`
  html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #deeaf6;">작성자</th>`
  html += `                <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${mainData.EMP_NM}</td>`
  html += `            </tr>`
  html += `            <tr height="45px">`
  html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #deeaf6;">주 작업장소</th>`
  html += `                <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${mainData.WORK_PLACE}</td>`
  html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #deeaf6;">주 작업내용</th>`
  html += `                <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${mainData.WORK_DESC}</td>`
  html += `            </tr>`
  html += `        </tbody>`
  html += `    </table>`
  
  for(let i = 0; i < checkDiv.length; i++) {
    html += `    <table style="width: 100%; border: 1px solid black; border-collapse: collapse; margin-top: 20px;">`
    html += `        <colgroup>`
    html += `            <col style="width: 12%;" />`
    html += `            <col style="width: 57%;" />`
    html += `            <col style="width: 11%;" />`
    html += `            <col style="width: 20%;" />`
    html += `        </colgroup>`
    html += `        <thead>`
    html += `            <tr height="35px">`
    html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #deeaf6;" colspan="4">${i + 1}. ${checkDiv[i].CHECK_CDNM1}</th>`
    html += `            </tr>`
    html += `            <tr height="35px">`
    html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #dddddd;">구분</th>`
    html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #dddddd;">내용</th>`
    html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #dddddd;">${checkDiv[i].CHECK_CD1_DESC1}</th>`
    html += `                <th style="border: 1px solid black; border-collapse: collapse; text-align: center; background-color: #dddddd;">${checkDiv[i].CHECK_CD1_DESC2}</th>`
    html += `            </tr>`
    html += `        </thead>`
    html += `        <tbody>`
    
    const filterCheck = _.filter(checkList, row => { return row.CHECK_CD1 === checkDiv[i].CHECK_CD1 })
    for(let j = 0; j < filterCheck.length; j++) {
      html += `          <tr>`
      
      if(filterCheck[j].ROWSPAN != null) {
        html += `              <td style="border: 1px solid black; border-collapse: collapse; text-align: center;" rowspan=${filterCheck[j].ROWSPAN}>${filterCheck[j].CHECK_CDNM2}</td>`
      }
      
      html += `              <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px;">`
      html += `                  <div>${filterCheck[j].CHECK_CDNM3}</div>`

      if(filterCheck[j].CHECK_CD3_DESC1 != null) {
        html += `                  <div>${filterCheck[j].CHECK_CD3_DESC1}</div>`
      }
      if(filterCheck[j].CHECK_CD3_DESC2 != null) {
        html += `                  <div>${filterCheck[j].CHECK_CD3_DESC2}</div>`
      }

      html += `              </td>`
      html += `              <td style="border: 1px solid black; border-collapse: collapse; text-align: center;">${filterCheck[j].CHECK_VALUE_NM}</td>`
      html += `              <td style="border: 1px solid black; border-collapse: collapse; text-align: left; padding: 0 4px;">${filterCheck[j].REMARKS.replace(/\n/g, '<br/>')}</td>`
      html += `          </tr>`
    }

    html += `        </tbody>`
    html += `    </table>`
  }

  html += `</div>`

  return html
}

const closeSavePopup = param => {
  if(param) {
    btnSearch(false)
  }
}

const searchCodeList = () => {
  getCodeList('HHIZ030').then(res => {
    codeList.APP_STATUS = _.filter(res.ORESULT_CUR, row => row.COD === 'A' || row.COD === 'B' || row.COD === 'C' || row.COD === 'Y')
    codeList.APP_STATUS.unshift({ COD: '', TXT: '전체' })
  })
}

const searchBsnsCd = () => {
  commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N', }, }).then(res => {
    codeList.BSNS_CD = res.ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_CD: '', BSNS_NM: '전체' })
  })
}

const searchDeptCd = async (init = true) => {
  await commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y', }, }).then(res => {
    codeList.DEPT_CD = res.ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_CD: '', DEPT_NM: '전체' })

    if(init) {
      searchParams.DEPT_CD = ''
    }
  })
}

const searchAsgnCd = async (init = true) => {
  if(searchParams.DEPT_CD === '') {
    codeList.ASGN_CD = [{ ASGN_CD: '', ASGN_NM: '전체' }]
  } else {
    await commonSearchApi({ queryId: 'searchVend', param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD, }, }).then(res => {
      codeList.ASGN_CD = res.ORESULT_CUR
      codeList.ASGN_CD.unshift({ ASGN_CD: '', ASGN_NM: '전체' })

      if(init) {
        searchParams.ASGN_CD = ''
      }
    })
  }
}

const changeBsnsCd = async () => {
  await searchDeptCd()
  searchAsgnCd()
}

const changeDeptCd = () => {
  searchAsgnCd()
}

const setColumnLayout = () => {
  commonSearchApi({ queryId: 'HLTNA0030_SEARCH_00', param: {} }).then(res => {
    const cols = res.ORESULT_CUR
    const columnLayout = [
      'BSNS_NM',
      'DEPT_NM',
      'ASGN_NM',
      'YEAR',
      'SEQ',
      'CHECK_DATE',
      'EMP_NM',
      'WORK_PLACE',
      'WORK_DESC',
      'APP_STATUS_NM',
      {
        name: '평가 내용',
        direction: 'horizontal',
        items: [],
        header: { text: t('평가 내용') },
      },
    ]

    if(userStore.userDiv === 'B') {
      grdMainProps.fields.splice(10, 0, { fieldName: 'APP_EMP_NM', dataType: 'text', header: { text: t('결재자'), }, width: '65', })
      columnLayout.splice(10, 0, 'APP_EMP_NM')
    }

    for(let i = 0; i < cols.length; i++) {
      const col = cols[i]

      col.CHECK_CD3_SHRT_NM = col.CHECK_CD3_SHRT_NM.replace(/\\n/g, '\n')
      
      // console.log('col.CHECK_CD3_SHRT_NM', col.CHECK_CD3_SHRT_NM)

      grdMainProps.fields.push({
        header: { text: t(`${col.CHECK_CD3_SHRT_NM}`), styleName: 'multiline-editor', height: '40' },
        dataType: 'text',
        fieldName: `COL_${col.CHECK_CD1}_${col.CHECK_CD2}_${col.CHECK_CD3}`,
        width: '80',
      })
    }

    const layout1 = _.uniqBy(
      cols.map(row => {
        return { CHECK_CD1: row.CHECK_CD1, CHECK_CDNM1: row.CHECK_CDNM1 }
      }),
      'CHECK_CD1'
    )

    const layout2 = _.uniqWith(
      cols.map(row => {
        return { CHECK_CD1: row.CHECK_CD1, CHECK_CD2: row.CHECK_CD2, CHECK_CD3: row.CHECK_CD3, CHECK_CD3_SHRT_NM: row.CHECK_CD3_SHRT_NM }
      }),
      (a, b) => {
        return a.CHECK_CD1 === b.CHECK_CD1 && a.CHECK_CD2 === b.CHECK_CD2 && a.CHECK_CD3 === b.CHECK_CD3
      }
    )

    // console.log('layout1', layout1)
    // console.log('layout2', layout2)

    for(let i = 0; i < layout1.length; i++) {
      const lay1 = layout1[i]

      columnLayout[columnLayout.length - 1].items.push({
        name: lay1.CHECK_CDNM1,
        direction: 'horizontal',
        items: [],
        header: { text: t(lay1.CHECK_CDNM1) },
      })

      for(let j = 0; j < layout2.length; j++) {
        const lay2 = layout2[j]

        if(lay1.CHECK_CD1 === lay2.CHECK_CD1) {
          columnLayout[columnLayout.length - 1].items[i].items.push(`COL_${lay2.CHECK_CD1}_${lay2.CHECK_CD2}_${lay2.CHECK_CD3}`)
        }
      }
    }

    grdMainProps.columns = grdMainProps.fields
    grdMainProps.columnLayout = columnLayout

    grdMain.value.getDataProvider().setFields(grdMainProps.fields)
    grdMain.value.getGridView().setColumns(grdMainProps.columns)
    grdMain.value.getGridView().setColumnLayout(grdMainProps.columnLayout)
    grdMain.value.getGridView().header.heights = [25, 25, 60]
  })
}

const setBtns = param => {
  if(userStore.userDiv === 'A') {
    if(param.DEPT_CD === userStore.deptCd && param.USER_DIV === userStore.userDiv) {
      if(param.APP_STATUS === 'A' || param.APP_STATUS === 'C') {
        menuTitle.value.disableBtn('btnReqApply', false)
      } else {
        menuTitle.value.disableBtn('btnReqApply', true)
      }
    } else {
      menuTitle.value.disableBtn('btnReqApply', true)
    }
  } else {
    // console.log('param.ASGN_CD', param.ASGN_CD)
    // console.log('userStore.asgnCd', userStore.asgnCd)
    // console.log('param.USER_DIV', param.USER_DIV)
    // console.log('userStore.userDiv', userStore.userDiv)
    // if(param.DEPT_CD === userStore.deptCd && param.USER_DIV === userStore.userDiv) {
    if(param.ASGN_CD === userStore.asgnCd && param.USER_DIV === userStore.userDiv) {
      if(param.APP_STATUS === 'A' || param.APP_STATUS === 'C') {
        menuTitle.value.disableBtn('btnReqApply', false)
        menuTitle.value.disableBtn('btnApprove', true)
        menuTitle.value.disableBtn('btnReject', true)
      } else if(param.APP_STATUS === 'B' && param.APP_EMP_NO === userStore.userId) {
        menuTitle.value.disableBtn('btnReqApply', true)
        menuTitle.value.disableBtn('btnApprove', false)
        menuTitle.value.disableBtn('btnReject', false)
      } else {
        menuTitle.value.disableBtn('btnReqApply', true)
        menuTitle.value.disableBtn('btnApprove', true)
        menuTitle.value.disableBtn('btnReject', true)
      }
    } else {
      menuTitle.value.disableBtn('btnReqApply', true)
      menuTitle.value.disableBtn('btnApprove', true)
      menuTitle.value.disableBtn('btnReject', true)
    }
  }
}

const afterApproval = async appKey => {
  const row = grdMain.value.getFocusedRowData()

  row.APPROVE_ID = appKey

  commonExecuteApi({ queryId: 'HLTNA0030_UPDATE_03', list: [row] }).then(res => {
    btnSearch(false)
  })
}

const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType === 'data') {
    const data = _.cloneDeep(grdMain.value.getDataProvider().getJsonRow(clickData.dataRow))
    data.CRUD = 'U'

    savePopup.value.openPopup(data)
  }
}

const onCurrentRowChanged = async (grid, oldIdx, newIdx) => {
  if(newIdx < 0) {
    return
  }
  
  const currData = grdMain.value.getDataProvider().getJsonRow(newIdx)

  setBtns(currData)
}

onMounted(() => {
  nextTick(() => {
    if(userStore.userDiv === 'A') {
      menuTitle.value.visibleBtn('btnApprove', false)
      menuTitle.value.visibleBtn('btnReject', false)
    }

    grdMain.value.getGridView().filterPanel.visible = true
    grdMain.value.getGridView().setFixedOptions({ colCount: 5 })
    grdMain.value.getGridView().setDisplayOptions({
      fitStyle: 'none',
    })

    setColumnLayout()

    grdMain.value.getGridView().setCellStyleCallback(function (grid, dataCell) {
      var ret = { style: { 'background-color': '' } }

      if(dataCell.dataColumn.fieldName.indexOf('COL_B_') > -1) {
        if(dataCell.value.replace(/ /g, '') === '보완필요') {
          ret.style = { 'background-color': '#ff8080' }
        }
      }
      
      return ret
    })

    menuTitle.value.setBtnProperty('btnCreate', 'text', '신규 등록')
    searchCodeList()
    searchBsnsCd()
    searchDeptCd(false)
    searchAsgnCd(false)

    btnSearch(false)
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="`${$t(logStore.menuId)}`"
        :button-list="['btnReqApply', 'btnApprove', 'btnReject', 'btnSearch', 'btnCreate', 'btnDelete']" 
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex align-center">
            <i-input
              label-width="50px"
              width="200px" 
              :label="$t('평가기간')" type="date"
              v-model="searchParams.FROM_DT"
              margin="10px"
            />
            <i-input
              width="160px"
              :label="$t('~')" type="date"
              v-model="searchParams.TO_DT"
            />
            <i-select
              :label="$t('사업부')"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              width="250px"
              @update:model-value="changeBsnsCd"
            />
              <!-- :disabled="searchDisable()" -->
            <i-select
              :label="$t('부서')"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              width="250px"
              @update:model-value="changeDeptCd"
            />
              <!-- :disabled="searchDisable()" -->
            <i-select
              :label="$t('협력사')"
              v-model="searchParams.ASGN_CD"
              :items="codeList.ASGN_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
              width="250px"
            />
            <i-select
              :label="$t('결재상태')"
              v-model="searchParams.APP_STATUS"
              :items="codeList.APP_STATUS"
              item-value="COD"
              item-title="TXT"
              width="225px"
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
              @onCurrentRowChanged="onCurrentRowChanged"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>

    <HLTNA0030Popup01 ref="savePopup" @close="closeSavePopup" />
    <ApprovalPopup ref="refApprovalPopup" @approvalAppkey="afterApproval" />
    <HLTNA0030Popup02 ref="refAppIPopup" @close="closeSavePopup" />
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 176px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>