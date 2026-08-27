<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonSendByEmpNoApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import SelectEmpPopup from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0020Popup01.vue'
import SelectAddEmpPopup from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0020Popup02.vue'
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { join, valuesIn } from 'lodash-es'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'

defineOptions({
  name:'20_risk-assessment-RSK_D-RSKDA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const selectEmpPopup = ref(null)
const selectAddEmpPopup = ref(null)
const MailPopup = ref(null)
let saveParams = []
let deleteParams = []

// 조회조건
let searchParams = reactive({    
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  PROD_DIV: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  PROD_DIV: [
    { COD: '', TXT: '전체' },
    { COD: 'Y', TXT: '생산' },
    { COD: 'N', TXT: '비생산' },
  ],
  DEPT_HEAD: {},
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),

    // 사업부 [1]
    commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv
        , USE_DIV: 'N',
      }, 
    }),
    // 부서[2]
    commonSearchApi({ 
      queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV:'Y'
      } 
    })
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM:'전체', BSNS_CD:'' })
    codeList.DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD:'' })
    grdMain.value.setBindingColumn("BSNS_CD", codeList.BSNS_CD, "BSNS_CD", "BSNS_NM")
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['CMPNY_DIV'],
  fields : [
    { fieldName: 'BSNS_CD', dataType: 'text', editable: false, header: { text:'사업부' }, lookupDisplay: true },
    
    // 부서 그룹
    { fieldName: 'ASGN_CD', dataType: 'text', editable: false, header: { text:'부서코드' } },
    { fieldName: 'ASGN_SHRT_NM', dataType: 'text', editable: false, styleName: 'left-column',header: { text:'부서명' } },

    // 부서장 그룹
    {
      fieldName: 'CHK_DEPT_HEAD', dataType: 'boolean', styleName: 'center-column', width: '40', editable: false, sortable: false,
      header: { text: ' ', checkLocation: "left" }, checked: false, renderer: { type: 'check' }, // visible: false가 안됨.
    },
    { fieldName: 'DEPT_HEAD_NM', dataType: 'text', editable: false, header: { text:'성명' } },
    { fieldName: 'DEPT_HEAD_POSI', dataType: 'text', editable: false, header: { text:'직급' } },
    { fieldName: 'DEPT_HEAD_NO', dataType: 'text', editable: false, header: { text:'사번' } },

    // 위험성평가위원회 - 운영위원 그룹
    {
      fieldName: 'CHK_OPS_COMMITTEE', dataType: 'boolean', styleName: 'center-column', width: '40', editable: false, sortable: false,
      header: { visible: false, checkLocation: "left" }, checked: false, renderer: { type: 'check' },
    },
    { fieldName: 'OPS_COMMITTEE_NM', dataType: 'text', editable: false, header: { text:'성명' },
      button:'action', 
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'OPS_COMMITTEE_POSI', dataType: 'text', editable: false, header: { text:'직급' } },
    { fieldName: 'OPS_COMMITTEE', dataType: 'text', editable: false, header: { text:'사번' } },

    // 위험성평가위원회 - 실행위원(부서추천) 그룹
    {
      fieldName: 'CHK_COMMITTEE_DEPT', dataType: 'boolean', styleName: 'center-column', width: '40', editable: false, sortable: false,
      header: { visible: false, checkLocation: "left" }, checked: false, renderer: { type: 'check' },
    },
    { fieldName: 'EXEC_COMMITTEE_DEPT_EMP_NM', dataType: 'text', editable: false, header: { text:'성명' },
      button:'action', 
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'EXEC_COMMITTEE_DEPT_POSI', dataType: 'text', editable: false, header: { text:'직급' } },
    { fieldName: 'EXEC_COMMITTEE_DEPT', dataType: 'text', editable: false, header: { text:'사번' } },

    // 위험성평가위원회 - 실행위원(조합추천) 그룹
    {
      fieldName: 'CHK_COMMITTEE_ASSOC', dataType: 'boolean', styleName: 'center-column', width: '40', editable: false, sortable: false,
      header: { visible: false, checkLocation: "left" }, checked: false, renderer: { type: 'check' },
    },
    { fieldName: 'EXEC_COMMITTEE_ASSOC_EMP_NM', dataType: 'text', editable: false, header: { text:'성명' },
      button:'action', 
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
    },
    { fieldName: 'EXEC_COMMITTEE_ASSOC_POSI', dataType: 'text', editable: false, header: { text:'직급' } },
    { fieldName: 'EXEC_COMMITTEE_ASSOC', dataType: 'text', editable: false, header: { text:'사번' } },
    { fieldName: 'ADDI_COMMITTEE', dataType: 'text', editable: false, header: { text:'추가 위원' },
      button:'action', 
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
      displayCallback: function (grd, idx, val) {
        let txt = ''
        if (val !== null) {
          txt = val.split(',')

          return txt.length + '명'
        }
      },
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'INS_USR', dataType: 'text', visible: false },
    { fieldName: 'INS_DT', dataType: 'text', visible: false },
    { fieldName: 'UPT_USR', dataType: 'text', visible: false },
    { fieldName: 'UPT_DT', dataType: 'text', visible: false },
    { fieldName: 'ADDI_COMMITTEE_POSI', dataType: 'text', visible: false },
    { fieldName: 'ADDI_COMMITTEE_EMP_NM', dataType: 'text', visible: false },

  ],
  columnLayout: [
    'BSNS_CD',
    {
      name: '부서',
      direction: 'horizontal',
      items: ['ASGN_CD', 'ASGN_SHRT_NM'],
      header: { text: t('부서') },
    },
    {
      name: '부서장',
      direction: 'horizontal',
      items: ['CHK_DEPT_HEAD', 'DEPT_HEAD_NM', 'DEPT_HEAD_POSI', 'DEPT_HEAD_NO'],
      header: { text: t('부서장') },
    },
    {
      name: '위험성평가위원회',
      direction: 'horizontal',
      items: [
        {
          name: '운영위원',
          direction: 'horizontal',
          items: ['CHK_OPS_COMMITTEE', 'OPS_COMMITTEE_NM', 'OPS_COMMITTEE_POSI', 'OPS_COMMITTEE'],
          header: { text: t('운영위원') },
        },
        {
          name: '실행위원(부서추천)',
          direction: 'horizontal',
          items: [ 'CHK_COMMITTEE_DEPT', 'EXEC_COMMITTEE_DEPT_EMP_NM', 'EXEC_COMMITTEE_DEPT_POSI', 'EXEC_COMMITTEE_DEPT'],
          header: { text: t('실행위원(부서추천)') },
        },
        {
          name: '실행위원(조합추천)',
          direction: 'horizontal',
          items: [ 'CHK_COMMITTEE_ASSOC', 'EXEC_COMMITTEE_ASSOC_EMP_NM', 'EXEC_COMMITTEE_ASSOC_POSI', 'EXEC_COMMITTEE_ASSOC'],
          header: { text: t('실행위원(조합추천)') },
        },
      ],
      header: { text: t('위험성평가위원회') },
    },
    'ADDI_COMMITTEE',
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

/* -------------------- 버튼 클릭 이벤트 -------------------- */
const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    // 위원회 조회
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnUpdate') {
    saveData()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnSendMail') {
    transMail()
  } else if (btn.id === 'btnDownLoad') {
    let excelFileNM = '위험성평가 위원회.xlsx'

    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      allColumns: false,
    })
  }
}

// 조회
const searchData = () => {
  return commonSearchApi({ queryId : 'RSKDA0020_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 데이터 길이에 따른 Column 너비 자동 조절
  grdMain.value.getGridView().fitLayoutWidth('BSNS_CD', 150, 100, true) // 사업부
  grdMain.value.getGridView().fitLayoutWidth('ASGN_SHRT_NM') // 부서명
}

// 저장
const saveData = () => {
  saveParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedRows.length < 1) {
    Message.warn(t('선택된 데이터가 없습니다.'))
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      if (!data.OPS_COMMITTEE && !data.EXEC_COMMITTEE_DEPT && !data.EXEC_COMMITTEE_ASSOC) {
        Message.warn(t('인원을 추가해 주세요'))
      } else {
        data.DEPT_CD = data.ASGN_CD
        saveParams.push(data)

        vm.$swal({ 
          title: t('저장 하시겠습니까?'), 
          showCancelButton: true,
        }).then(swalRes => {
          if(swalRes.isConfirmed === true) {
            commonExecuteApi({
              queryId : 'RSKDA0020_SAVE_01',
              list: saveParams 
            }).then(res => {
              if (res.result.status === '200') {
                Message.success(t('저장 되었습니다.'))
              }
            }).catch(err => {
              Message.err(err)
            }).finally(() => {
              new queryFlowHelper(vm, t)
                .setQuery(searchData)
                .setAfter(afterSearch)
                .run()
            })
          }
        })
      }
    }
  }
}

// 삭제
const deleteData = () => {
  deleteParams = []

  let newList = []

  let allData = grdMain.value.getDataProvider().getJsonRows()

  allData.forEach(el => {
    let newArr = {
      CMPNY_DIV: el.CMPNY_DIV,
      BSNS_CD: el.BSNS_CD,
      DEPT_CD : el.ASGN_CD
    }

    if (el.CHK_OPS_COMMITTEE === true && el.OPS_COMMITTEE) {
      newArr.CHK_OPS_COMMITTEE = el.CHK_OPS_COMMITTEE.toString()
      newArr.OPS_COMMITTEE = el.OPS_COMMITTEE
    }

    if (el.CHK_COMMITTEE_DEPT === true && el.EXEC_COMMITTEE_DEPT) {
      newArr.CHK_COMMITTEE_DEPT = el.CHK_COMMITTEE_DEPT.toString()
      newArr.EXEC_COMMITTEE_DEPT = el.EXEC_COMMITTEE_DEPT
    }

    if (el.CHK_COMMITTEE_ASSOC === true && el.EXEC_COMMITTEE_ASSOC) {
      newArr.CHK_COMMITTEE_ASSOC = el.CHK_COMMITTEE_ASSOC.toString()
      newArr.EXEC_COMMITTEE_ASSOC = el.EXEC_COMMITTEE_ASSOC
    }

    newList.push(newArr) 

    deleteParams = newList.filter(item => Object.keys(item).length > 3)
  })

  vm.$swal({
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if(ck.isConfirmed === true) {
      commonExecuteApi({ 
        queryId : 'RSKDA0020_DELETE_01', 
        list: deleteParams
      }).then(res => {
        if (res.result.status === '200') { 
          Message.success(t('삭제 되었습니다.'))
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        new queryFlowHelper(vm, t)
          .setQuery(searchData)
          .setAfter(afterSearch)
          .run()
      })
    }
  })
}

// 메일 전송
const transMail = () => {
  let mailForm = {
    TO_EMP_NO: [],   // 받음(사번)
    TO_EMP_NM: [], // 받음(성명)
  }

  // 위원 선택
  let allData = grdMain.value.getDataProvider().getJsonRows()
  for (let col of allData) {
    if (col.CHK_DEPT_HEAD === true && col.DEPT_HEAD_NO !== null) {
      mailForm.TO_EMP_NO.push(col.DEPT_HEAD_NO + "@hd.com")
      mailForm.TO_EMP_NM.push(col.DEPT_HEAD_NM)
    } 
    if (col.CHK_OPS_COMMITTEE === true && col.OPS_COMMITTEE !== null) {
      mailForm.TO_EMP_NO.push(col.OPS_COMMITTEE + "@hd.com")
      mailForm.TO_EMP_NM.push(col.OPS_COMMITTEE_NM)
    } 
    if (col.CHK_COMMITTEE_DEPT === true && col.EXEC_COMMITTEE_DEPT !== null) {
      mailForm.TO_EMP_NO.push(col.EXEC_COMMITTEE_DEPT + "@hd.com")
      mailForm.TO_EMP_NM.push(col.EXEC_COMMITTEE_DEPT_EMP_NM)
    } 
    if (col.CHK_COMMITTEE_ASSOC === true && col.EXEC_COMMITTEE_ASSOC !== null) {
      mailForm.TO_EMP_NO.push(col.EXEC_COMMITTEE_ASSOC + "@hd.com")
      mailForm.TO_EMP_NM.push(col.EXEC_COMMITTEE_ASSOC_EMP_NM)
    }
  }

  if (mailForm.TO_EMP_NO.length > 0) {
    MailPopup.value.openPopup(mailForm)
  } else {
    Message.warn('선택된 위원이 없습니다.')
  }
}

let chkAll
// 체크바 선택 시 체크된 행의 각 위원 전체 선택 
const onItemChecked = (grid, itemIndex, checked) => {
  chkAll = checked
}

const onCellClick = (grid, clickData) => {
  
  let itemIndex = clickData.itemIndex

  if(clickData.cellType == 'check')
  {
    if(chkAll == true)
    {
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_DEPT_HEAD', true)
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_OPS_COMMITTEE', true)
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_COMMITTEE_DEPT', true)
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_COMMITTEE_ASSOC', true)
    }
    else
    {
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_DEPT_HEAD', false)
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_OPS_COMMITTEE', false)
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_COMMITTEE_DEPT', false)
      grdMain.value.getDataProvider().setValue(itemIndex, 'CHK_COMMITTEE_ASSOC', false)
    }

  }  
}


// 각 위원별 헤더 체크박스 클릭 이벤트
const onColumnCheckedChanged = (grid, col, chk) => {
  let data = grdMain.value.getDataProvider().getJsonRows()

  // 부서장 체크박스
  for (let i = 0; data.length > i; i++) {
    if (col._name === "CHK_DEPT_HEAD" && chk === true) {
      grdMain.value.getDataProvider().setValue(i, 'CHK_DEPT_HEAD', true)
    } else {
      grdMain.value.getDataProvider().setValue(i, 'CHK_DEPT_HEAD', false)
    }
  }

  // 운영위원 체크박스
  for (let i = 0; data.length > i; i++) {
    if (col._name === "CHK_OPS_COMMITTEE" && chk === true) {
      grdMain.value.getDataProvider().setValue(i, 'CHK_OPS_COMMITTEE', true)
    } else {
      grdMain.value.getDataProvider().setValue(i, 'CHK_OPS_COMMITTEE', false)
    }
  }

  // 실행위원(부서추천) 체크박스
  for (let i = 0; data.length > i; i++) {
    if (col._name === "CHK_COMMITTEE_DEPT" && chk === true) {
      grdMain.value.getDataProvider().setValue(i, 'CHK_COMMITTEE_DEPT', true)
    } else {
      grdMain.value.getDataProvider().setValue(i, 'CHK_COMMITTEE_DEPT', false)
    }
  }

  // 실행위원(조합추천) 체크박스
  for (let i = 0; data.length > i; i++) {
    if (col._name === "CHK_COMMITTEE_ASSOC" && chk === true) {
      grdMain.value.getDataProvider().setValue(i, 'CHK_COMMITTEE_ASSOC', true)
    } else {
      grdMain.value.getDataProvider().setValue(i, 'CHK_COMMITTEE_ASSOC', false)
    }
  }
}

/* -------------------- POPUP -------------------- */
// 셀 버튼 클릭 이벤트(인원조회팝업)
const onCellButtonClicked = (grid,index,col) => {
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  let openParams = {
    title: '',
    dataRow: null,
    fieldIndex: null,
    checkBar: false,
    BSNS_CD: rtnData.BSNS_CD,
    DEPT_CD: rtnData.ASGN_CD,
  }

  if (index.fieldIndex === 8) {
    openParams.title = '운영위원'
    openParams.dataRow = index.dataRow
    openParams.fieldIndex = index.fieldIndex

    return selectEmpPopup.value.openPopup(openParams)
  } else if (index.fieldIndex === 12) {
    openParams.title = '실행위원(부서추천)'
    openParams.dataRow = index.dataRow
    openParams.fieldIndex = index.fieldIndex

    return selectEmpPopup.value.openPopup(openParams)
  } else if (index.fieldIndex === 16) {
    openParams.title = '실행위원(조합추천)'
    openParams.dataRow = index.dataRow
    openParams.fieldIndex = index.fieldIndex

    return selectEmpPopup.value.openPopup(openParams)
  } else if (index.fieldIndex === 19) {
    openParams.dataRow = index.dataRow
    openParams.fieldIndex = index.fieldIndex
    openParams.ADDI_COMMITTEE = rtnData.ADDI_COMMITTEE ? rtnData.ADDI_COMMITTEE.split(',') : ''

    return selectAddEmpPopup.value.openPopup(openParams)
  }
}

// 인원 선택 후(운영위원: 8, 실행위원(부서추천): 12, 실행위원(조합추천): 16)
const onEmpSelected = val => {
  if (val.fieldIndex === 8) {
    grdMain.value.getDataProvider().setValue(val.dataRow, 'OPS_COMMITTEE', val.EMP_NO)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'OPS_COMMITTEE_NM', val.EMP_NM)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'OPS_COMMITTEE_POSI', val.JOB_TIT_NM)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'CHK_OPS_COMMITTEE', true)
    grdMain.value.getGridView().checkRow(val.dataRow)
  } else if (val.fieldIndex === 12) {
    grdMain.value.getDataProvider().setValue(val.dataRow, 'EXEC_COMMITTEE_DEPT', val.EMP_NO)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'EXEC_COMMITTEE_DEPT_EMP_NM', val.EMP_NM)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'EXEC_COMMITTEE_DEPT_POSI', val.JOB_TIT_NM)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'CHK_COMMITTEE_DEPT', true)
    grdMain.value.getGridView().checkRow(val.dataRow)
  } else if (val.fieldIndex === 16) {
    grdMain.value.getDataProvider().setValue(val.dataRow, 'EXEC_COMMITTEE_ASSOC', val.EMP_NO)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'EXEC_COMMITTEE_ASSOC_EMP_NM', val.EMP_NM)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'EXEC_COMMITTEE_ASSOC_POSI', val.JOB_TIT_NM)
    grdMain.value.getDataProvider().setValue(val.dataRow, 'CHK_COMMITTEE_ASSOC', true)
    grdMain.value.getGridView().checkRow(val.dataRow)
  }

}

// 추가위원 팝업
const onAddEmpSelected = val => {
  onButtonsClick({ id :'btnSearch' })
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    searchParams.DEPT_CD = ''
  }
  if (newValue !== '') {
    commonSearchApi({ queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV:'Y'
      } 
    }).then(res => {
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
      if (newValue !== oldValue) {
        // 사업부가 변경 시 "전체" 출력
        searchParams.DEPT_CD = ''
      }
    })
  } else {
    codeList.DEPT_CD = []
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
  }
})
// 그리드 데이터 바인딩
onMounted(() => {
  initCodeList()
  searchParams.BSNS_CD = userStore.bsnsCd // 유저정보의 사업부
  searchParams.DEPT_CD = userStore.deptCd // 유저정보의 부서
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete', 'btnSendMail', 'btnDownLoad']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <!-- 회사 -->
          <i-select
            :label="$t('회사')"
            label-width="50px"
            width="300px"
            v-model="searchParams.CMPNY_DIV"
            :items="codeList.CMPNY_DIV"
            item-value="COD"
            item-title="TXT"
            readonly 
          />
          <!-- 사업부 -->
          <i-select
            :label="$t('사업부')"
            label-width="50px"
            width="300px" 
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <!-- 부서 -->
          <i-select
            :label="$t('부서')"
            label-width="50px"
            width="300px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
          />
            <v-radio-group v-model="searchParams.PROD_DIV" inline>
              <v-radio  
                v-for="(item, i) in codeList.PROD_DIV" 
                :key="i" 
                :value="item.COD" 
                :label="item.TXT"
              />
            </v-radio-group>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellButtonClicked="onCellButtonClicked"
            @onColumnCheckedChanged="onColumnCheckedChanged"
            @onItemChecked="onItemChecked"
            @onCellClicked="onCellClick"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- 인원조회팝업 -->
  <SelectEmpPopup 
    ref="selectEmpPopup" 
    @selected="onEmpSelected"
  />
  <!-- 추가위원 등록 팝업 -->
  <SelectAddEmpPopup 
    ref="selectAddEmpPopup" 
    @selected="onAddEmpSelected"
  />
  <SendMailPopup ref="MailPopup"/>
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
