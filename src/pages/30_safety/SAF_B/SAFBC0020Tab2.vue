<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCompanyList, getCodeList, commonLogExecuteApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import _ from 'lodash'
import Message from '@hiway/utils/notify'

import LocationPopup from '@/components/popup/CommonCodePopUpSAF.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import SAFCD0010Tab03Popup01_NEW from '@/pages/30_safety/SAF_C/SAFCD0010Tab03Popup01_NEW.vue'

defineOptions({
  name:'30_safety-SAF_B-SAFBC0020Tab1',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const logsStore = useLogsStore()
const grdMain = ref(null)
const grdSub = ref(null)
const isMounted = ref(false)
const dtSearch = ref([])

const locationPopup = ref(null)
const mngrEmpPopup = ref(null)
const detailPopup = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'SHIP_NO', dataType: 'text', header: { text: t('호선'), }, mergeRule: { criteria: "values['SHIP_NO']" }, width: '65', },
    { fieldName: 'DIV_L_NM', dataType: 'text', header: { text: t('대구역'), }, mergeRule: { criteria: "values['SHIP_NO'] + values['DIV_L_NM']" }, width: '75', },
    { fieldName: 'DIV_M_NM', dataType: 'text', header: { text: t('중구역'), }, width: '165', },
    { fieldName: 'CONFINED_CNT', dataType: 'text', header: { text: t('밀폐공간'), }, width: '65', },
    { fieldName: 'ARGN_CNT', dataType: 'text', header: { text: t('아르곤'), }, width: '65', },

    { fieldName: 'DIV_L', dataType: 'text', header: { text: t('DIV_L'), }, visible: false, },
    { fieldName: 'DIV_M', dataType: 'text', header: { text: t('DIV_M'), }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const grdSubProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'WORK_DATE', dataType: 'text', header: { text: t('작업일'), }, width: '100', },
    { fieldName: 'WORK_TIME', dataType: 'text', header: { text: t('작업시간'), }, width: '100', },
    { fieldName: 'AREA_S_NM', dataType: 'text', header: { text: t('기본'), }, width: '100', },
    { fieldName: 'AREA_DETAIL', dataType: 'text', header: { text: t('상세'), }, styleName: 'left-column', width: '200', },
    { fieldName: 'SHIP_NO', dataType: 'text', header: { text: t('호선'), }, width: '60', },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('조직'), }, styleName: 'left-column', width: '250', },
    { fieldName: 'CONFINED_YN', dataType: 'text', header: { text: t('밀폐공간'), }, styleName: 'checkbox-column',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N', }, width: '65', },
    { fieldName: 'ARGN_YN', dataType: 'text', header: { text: t('아르곤'), }, styleName: 'checkbox-column',
      renderer: { type: 'check', trueValues: 'Y', falseValues: 'N', }, width: '65', },
    { fieldName: 'WORK_STATUS2', header: { text: t('상태'), }, width: '60',
      renderer: {
        type: 'html',
        callback: function(grid, cell, w, h) {
          let status = grid.getValue(cell.index.itemIndex, 'WORK_STATUS')

          return '<div style="display: flex; justify-content: center;">'
               +   `<div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${status === '착수' ? '#f7d342' : '#dddddd'};" />`
               + '</div>'
        },
      },
      styleCallback: function (grid, dataCell) {
        let ret = { style: { background: undefined } }
        let badYN = grid.getValue(dataCell.index.itemIndex, 'BAD_YN')

        if (badYN === '0') { ret.style.background = '#ff8080' }

        return ret
      },
    },
    { fieldName: 'WORK_START_TIME', dataType: 'text', header: { text: t('착수'), }, width: '150', },
    { fieldName: 'CHK_BTN', header: { text: t('점검현황'), }, width: '95',
      styleCallback: function(grid, dataCell) {
        let ret = {}
        let chkYN = grid.getValue(dataCell.index.itemIndex, 'CHK_YN')

        ret.renderer = chkYN === 'N' ? {} : { type: 'button' }

        return ret
      },
      displayCallback: function(grid, index, value) {
        let chkYN = grid.getValue(index.itemIndex, 'CHK_YN')

        return chkYN === 'N' ? '점검내역 없음' : value
      },
    },
    { fieldName: 'DANG_DIV_NM', dataType: 'text', header: { text: t('위험작업분류'), }, width: '150', },
    { fieldName: 'WRK_DIST', dataType: 'text', header: { text: t('작업명'), }, styleName: 'left-column', width: '150', },
    { fieldName: 'WORK_TITLE', dataType: 'text', header: { text: t('작업상세'), }, styleName: 'left-column', width: '250', },
    { fieldName: 'MNGR_EMP_NM', dataType: 'text', header: { text: t('관리감독자'), }, width: '75', },
    { fieldName: 'RCV_NO', dataType: 'text', header: { text: t('허가서 번호'), }, width: '180', },
    { fieldName: 'WORK_ID_NM', dataType: 'text', header: { text: t('작업지시서 번호'), }, width: '175', },

    { fieldName: 'BAD_YN', dataType: 'text', header: { text: t('BAD_YN'), }, visible: false, },
    { fieldName: 'WORK_STATUS', dataType: 'text', header: { text: t('WORK_STATUS'), }, visible: false, },
    { fieldName: 'P_WRK_ID', dataType: 'text', header: { text: t('P_WRK_ID'), }, visible: false, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'RESP_EMP_NM', dataType: 'text', header: { text: t('RESP_EMP_NM'), }, visible: false, },
    { fieldName: 'WRK_PLC', dataType: 'text', header: { text: t('WRK_PLC'), }, visible: false, },
    { fieldName: 'CF_DIV_NM', dataType: 'text', header: { text: t('CF_DIV_NM'), }, visible: false, },
    { fieldName: 'CHECK_DIV', dataType: 'text', header: { text: t('CHECK_DIV'), }, visible: false, },
    { fieldName: 'CHK_YN', dataType: 'text', header: { text: t('CHK_YN'), }, visible: false, },
  ],
  columns: [],
  columnLayout: [
    'WORK_DATE',
    'WORK_TIME',
    {
      name: '장소',
      direction: 'horizontal',
      items: [
        'AREA_S_NM',
        'AREA_DETAIL',
      ],
    },
    'SHIP_NO',
    'ASGN_FULL_NM',
    'CONFINED_YN',
    'ARGN_YN',
    {
      name: '작업현황',
      direction: 'horizontal',
      items: [
        'WORK_STATUS2',
        'WORK_START_TIME',
      ],
    },
    'CHK_BTN',
    {
      name: '작업',
      direction: 'horizontal',
      items: [
        'DANG_DIV_NM',
        'WRK_DIST',
        'WORK_TITLE',
        'MNGR_EMP_NM',
      ],
    },
    'RCV_NO',
    'WORK_ID_NM',
  ],
})

grdSubProps.columns = grdSubProps.fields

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_DT: dayjs().format('YYYY-MM-DD'),
  TO_DT: dayjs().format('YYYY-MM-DD'),
  MNGR_EMP_NO: '',
  MNGR_EMP_NM: '',
  DN_DIV: '',
  DEPT_GBN: '2',
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  ASGN_YN: 'Y',
  ASGN_CD: '',
  REL_DEPT_CD: '',
  REL_GWA_CD: '',
  REL_TEAM_CD: '',
  LOC_L_CD: '',
  LOC_M_CD: '',
  LOC_S_CD: '',
  SHIP_NO: '',
  START_Y_CNT: 0,
  START_N_CNT: 0,
})

const codeList = reactive({
  BSNS_CD: [],
  DEPT_CD: [],
  ASGN_CD: [],
  SHIP_NO: [],
  DN_DIV : [
    { TXT: '전체', COD: '' },
    { TXT: '주간', COD: 'D' },
    { TXT: '야간', COD: 'N' },
  ],
  DEPT_GBN: [
    { TXT: '일반 기준', COD: '2' },
    { TXT: '안전조직 기준', COD: '1' },
  ],
  REL_DEPT_CD : [],
  REL_GWA_CD : [],
  REL_TEAM_CD : [],
})

const allCodeList =  reactive({
  DEPT_CD: [],
  GWA_CD: [],
  TEAM_CD: [],
})

const initCodeList = async () => {
  await Promise.all([
    //사업부조회
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv } }),

    // 부서
    commonSearchApi({ queryId: 'searchDept3', param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, USE_DIV: 'Y' } }),

    //협력사
    commonSearchApi({ queryId: 'searchVend',param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD } }),

    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
    commonSearchApi({ queryId: 'SAFCD0010_SEARCH81', param: {} }),
  ]).then(res => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.ASGN_CD = res[2].ORESULT_CUR
    codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })

    var orderList = ['조선안전부', '해양안전부', '엔진기계안전부', '특수선안전과', '자산안전/기획과', '안전경영부', '안전보건지원부' ]
    for(var i = 0; i < orderList.length; i++) {
      for(var j = 0; j < res[3].ORESULT_CUR.length; j++) {
        if(res[3].ORESULT_CUR[j].DEPT_NM.indexOf('안전') !== -1
          && res[3].ORESULT_CUR[j].BSNS_NM === '안전통합경영실' 
          && res[3].ORESULT_CUR[j].DEPT_NM == orderList[i]) {
          allCodeList.DEPT_CD.push(res[3].ORESULT_CUR[j])
        }
      }
    }

    allCodeList.GWA_CD = res[4].ORESULT_CUR
    allCodeList.TEAM_CD = res[5].ORESULT_CUR
    codeList.REL_DEPT_CD = allCodeList.DEPT_CD

    codeList.REL_GWA_CD = allCodeList.GWA_CD
    codeList.REL_TEAM_CD = allCodeList.TEAM_CD
    codeList.REL_DEPT_CD.unshift({ DEPT_NM:'전체', DEPT_CD:'' })
    codeList.REL_GWA_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
    codeList.REL_TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })

    codeList.SHIP_NO = res[6].ORESULT_CUR
    codeList.SHIP_NO.unshift({ TXT: '전체', COD: '' })
  })
}

const readOnlyValue = reactive({
  BSNS_CD: false,
  DEPT_CD: false,
  ASGN_CD: true,
})

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

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

const searchData = () => {
  grdMain.value.getDataProvider().setRows([])
  clearSubGrd()

  return commonSearchApi({ queryId: 'SAFBC0020_SEARCH_02', param: searchParams })
}

const afterSearch = res => {
  dtSearch.value = res.ORESULT_CUR

  const dtCnt = []

  for(let i = 0; i < dtSearch.value.length; i++) {
    const row = dtSearch.value[i]

    if(!_.some(dtCnt, { SHIP_NO: row.SHIP_NO, DIV_L: row.DIV_L, DIV_M: row.DIV_M, })) {
      dtCnt.push({
        SHIP_NO: row.SHIP_NO,
        DIV_L: row.DIV_L,
        DIV_M: row.DIV_M,
        DIV_L_NM: row.DIV_L_NM,
        DIV_M_NM: row.DIV_M_NM,
        CONFINED_CNT: row.CONFINED_CNT,
        ARGN_CNT: row.ARGN_CNT,
      })
    }
  }

  const sorted = _.sortBy(dtCnt, ['SHIP_NO', 'DIV_L', 'DIV_M'])

  grdMain.value.getDataProvider().setRows(sorted)
}

const searchSub = async () => {
  clearSubGrd()

  const curr = grdMain.value.getGridView().getCurrent()
  const currData = await grdMain.value.getDataProvider().getJsonRow(curr.dataRow)
  const filterData = _.filter(dtSearch.value, row => {
    if(curr.fieldName === 'SHIP_NO') {
      return row.SHIP_NO === currData.SHIP_NO
    } else if(curr.fieldName === 'DIV_L_NM') {
      return row.SHIP_NO === currData.SHIP_NO && row.DIV_L === currData.DIV_L
    } else {
      return row.SHIP_NO === currData.SHIP_NO && row.DIV_L === currData.DIV_L && row.DIV_M === currData.DIV_M
    }
  })

  searchParams.START_N_CNT = _.filter(filterData, { WORK_STATUS: '미착수', }).length
  searchParams.START_Y_CNT = _.filter(filterData, { WORK_STATUS: '착수', }).length

  grdSub.value.getDataProvider().setRows(filterData)
}

const clearSubGrd = () => {
  grdSub.value.getDataProvider().setRows([])
  searchParams.START_N_CNT = 0
  searchParams.START_Y_CNT = 0
}

const openLocationPopup = () => {
  locationPopup.value.openPopup('장소')
}

const selectedLocation = (val) => {
  searchParams.LOC_L_CD = val[0].COD
  searchParams.LOC_M_CD = val[1].COD
  searchParams.LOC_S_CD = val[2].COD
  searchParams.LOC_L_NM = val[0].TXT
  searchParams.LOC_M_NM = val[1].TXT
  searchParams.LOC_S_NM = val[2].TXT
}

const clearLocation = () => {
  searchParams.LOC_L_CD = ''
  searchParams.LOC_M_CD = ''
  searchParams.LOC_S_CD = ''
  searchParams.LOC_L_NM = ''
  searchParams.LOC_M_NM = ''
  searchParams.LOC_S_NM = ''
}

const mngrEmpOpenPopup = () => {
  mngrEmpPopup.value.openPopup({
    EMP_NM: searchParams.MNGR_EMP_NM,
  })
}

const selectedMngrEmp = val => {
  searchParams.MNGR_EMP_NM = val.EMP_NM
  searchParams.MNGR_EMP_NO = val.EMP_NO
}

const clearMngrEmpNo = () => {
  searchParams.MNGR_EMP_NO = ''
  searchParams.MNGR_EMP_NM = ''
}

const grdMainFocusChanged = async (grid, newIdx) => {
  if(newIdx < 0) {
    return
  }

  searchSub()
}

const grdSubButtonClick = (grid, index, clickData) => {
  if(clickData.cellType === 'data') {
    if(clickData.fieldName === 'CHK_BTN') {
      const data = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)

      if(data.CHK_YN === 'N') {
        Message.warn('점검내역이 없습니다.')
      } else {
        data.WORK_ID = data.WORK_ID_NM
        data.AREA_NM = data.AREA_S_NM

        detailPopup.value.openPopup3(data)
      }
    }
  }
}

//사업부변경 감지
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    if(isMounted.value) {
      commonSearchApi({
        queryId: 'searchDept3',
        param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
      }).then(res => {
        if (oldValue) {
          searchParams.DEPT_CD = ''
          codeList.DEPT_CD = res.ORESULT_CUR
          codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        } else {
          codeList.DEPT_CD = res.ORESULT_CUR
          codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
        }
      }) // 부서
    }
  },
)

//부서변경감지
//부서변경시 부서에 해당하는 협력사  조회
watch(
  () => searchParams.DEPT_CD,
  (newValue, oldValue) => {
    if(isMounted.value) {
      commonSearchApi({
        queryId: 'searchVend',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: searchParams.BSNS_CD,
          DEPT_CD: newValue,
        },
      }).then(res => {
        searchParams.ASGN_CD = ''
        codeList.ASGN_CD = res.ORESULT_CUR
        codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      })
    }
  },
)

//협력사 포함 체크박스 감지
//체크가되면 협력사 셀렉트박스 활성화
//체크가 해제되면 협력사 셀렉트박스 비활성화
watch(
  () => searchParams.ASGN_YN,
  newValue => {
    if (newValue === 'Y') {
      readOnlyValue.ASGN_CD = false
    } else {
      readOnlyValue.ASGN_CD = true
    }
  },
  {
    immediate: true,
  }
)

// 안전부 변경 시 부서 변경 이벤트
watch(() => searchParams.REL_DEPT_CD, (newValue, oldValue) => {
  if(searchParams.REL_DEPT_CD === '') {
    searchParams.REL_GWA_CD = ''
    searchParams.REL_TEAM_CD = ''
  }
  
  commonSearchApi({ queryId : 'searchGwa', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', DEPT_CD: searchParams.REL_DEPT_CD, USE_DIV:'Y' } })
    .then(res => {
      codeList.REL_GWA_CD = res.ORESULT_CUR
      codeList.REL_GWA_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })

      if (newValue !== oldValue) {
        searchParams.REL_GWA_CD = codeList.REL_GWA_CD[0].ASGN_CD
      }
    })
})

// 안전과 바뀌면 안전팀 데이터 가져옴
watch(() => searchParams.REL_GWA_CD, (newValue, oldValue) => {
  searchParams.REL_TEAM_CD = ''
  commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: 'AN00', ASGN_CD: searchParams.REL_GWA_CD } })
    .then(res => {
      codeList.REL_TEAM_CD = res.ORESULT_CUR
      
      if(codeList.REL_TEAM_CD.length == 1) {
        searchParams.REL_TEAM_CD = res.ORESULT_CUR[0].ASGN_CD
        codeList.REL_TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
        
        return
      }

      codeList.REL_TEAM_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
      if (codeList.REL_TEAM_CD.length !== 0) {
        searchParams.TEAM_CD = ''
      }
    })
})

watch(
  () => searchParams.MNGR_EMP_NM,
  (newValue, oldValue) => {
    if (!oldValue) {
      return false
    }
    searchParams.MNGR_EMP_NO = ''
  },
)

onMounted(async () => {
  await initCodeList()
  checkSafeTyManage()

  isMounted.value = true

  grdSub.value.getGridView().setFixedOptions({ colCount: 4 })
  grdSub.value.getGridView().filterPanel.visible = true

  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet class="h-auto">
      <IGridTitle
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea">
        <div class="d-flex">
          <i-input
            v-model="searchParams.FROM_DT"
            label-width="60px"
            :label="$t('작업기간')"
            type="date"
            width="210px"
            class="mr-0"
            required
          />
          <span class="mx-2 mt-1">~</span>
          <i-input
            v-model="searchParams.TO_DT"
            type="date"
            width="155px"
            class="ml-0"
            required
          />

          <div
            v-if="userStore.bsnsCd === 'AN00' || userStore.authGrpCd.includes('HIWAYGRP00001')"
            style="margin-top: 5px;width: 270px;"
          > 
            <v-radio-group
              v-model="searchParams.DEPT_GBN" 
              inline
            >
              <v-radio
                v-for="item in codeList.DEPT_GBN"
                :key="item"
                :value="item.COD"
                :label="item.TXT"
              />
            </v-radio-group>
          </div>
          <template v-if="searchParams.DEPT_GBN === '2'">
            <i-select
              v-model="searchParams.BSNS_CD"
              label-width="65px"
              :label="$t('사업부')"
              width="230px"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :readonly="readOnlyValue.BSNS_CD"
              required
            />
            <i-select
              v-model="searchParams.DEPT_CD"
              label-width="40px"
              :label="$t('부서')"
              width="250px"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :readonly="readOnlyValue.DEPT_CD"
            />
            <i-select
              v-model="searchParams.ASGN_CD"
              label-width="50px"
              :label="$t('협력사')"
              width="250px"
              :items="codeList.ASGN_CD"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              :disabled="readOnlyValue.ASGN_CD"
            />
            <v-checkbox
              v-model="searchParams.ASGN_YN"
              label="협력사 포함"
              true-value="Y"
              false-value="N"
              class="mr-2"
              style="margin-top: 3px"
            />
          </template>
          <template v-if="searchParams.DEPT_GBN === '1'">
            <i-select
              label-width="65px"
              v-model="searchParams.REL_DEPT_CD"
              :label="$t('안전부')"
              :items="codeList.REL_DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM" 
              width="230px"  
            />
            <i-select 
              v-model="searchParams.REL_GWA_CD"
              :label="$t('안전과')"
              :disabled="searchParams.REL_DEPT_CD === '' ? true : false"
              :items="codeList.REL_GWA_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
              width="250px" 
            />
            <i-select 
              v-model="searchParams.REL_TEAM_CD"
              :label="$t('안전팀')"
              :disabled="searchParams.REL_GWA_CD === '' ? true : false"
              :items="codeList.REL_TEAM_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
              width="250px" 
            />
          </template>
        </div>
        <div class="d-flex mt-2">
          <i-input
            label-width="60px"
            width="245px"
            :label="$t('장소')"
            v-model="searchParams.LOC_L_NM"
            append-inner-icon="mdi-magnify"
            @click:appendInner="openLocationPopup"
            readonly
            margin="5px"
          >
            <template #append-inner>
              <v-icon
                icon="mdi-window-close"
                @click="clearLocation"
              />
            </template>
          </i-input>
          <i-input
            width="190px"
            v-model="searchParams.LOC_M_NM"
            readonly
            margin="5px"
          />
          <i-input
            width="215px"
            v-model="searchParams.LOC_S_NM"
            readonly
          />
          <i-select
            v-model="searchParams.SHIP_NO"
            label-width="80px"
            :label="$t('호선/프로젝트')"
            :items="codeList.SHIP_NO"
            item-title="TXT"
            item-value="COD"              
            width="230px"
          />
          <i-input
            label-width="65px"
            v-model="searchParams.MNGR_EMP_NM"
            :label="$t('관리감독자')"
            append-inner-icon="mdi-magnify"
            width="250px"
            clearable
            @click:clearable="clearMngrEmpNo"
            @click:appendInner="mngrEmpOpenPopup"
            @keydown.enter="mngrEmpOpenPopup"
          />
          <i-select
            v-model="searchParams.DN_DIV"
            label-width="65px"
            :label="$t('주/야구분')"
            :items="codeList.DN_DIV"
            item-title="TXT"
            item-value="COD"
            width="250px"
          />
        </div>
      </v-sheet>
      <div class="h-grow">
        <v-sheet width="30%" class="h-auto">
          <IGridTitle title="밀폐공간 및 아르곤 현황" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCurrentChanged="grdMainFocusChanged"
          />
        </v-sheet>
        <v-sheet width="70%" class="h-auto pa-0 ml-3">
          <IGridTitle title="상세현황">
            <template #editors>
              <div class="d-flex align-center">
                <div class="d-flex align-center ml-4">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #dddddd;" />
                  <div class="ml-1" style="color: #222222;">작업미착수</div>
                  <v-text-field v-model="searchParams.START_N_CNT" class="ml-2" readonly reverse />
                  <div class="ml-4" style="width: 20px; height: 20px; border-radius: 50%; background-color: #f7d342;" />
                  <div class="ml-1" style="color: #222222;">작업착수</div>
                  <v-text-field v-model="searchParams.START_Y_CNT" class="ml-2" readonly reverse />
                  <div class="ml-6" style="width: 60px; height: 30px; background-color: #ff8080;" />
                  <div class="ml-1" style="color: #222222;"> : 점검결과 "불량"건 존재</div>
                </div>
                <div style="margin-left: 32px;">
                  ※ 모바일 안전작업지시를 연계하지 않은 PTW건은 조회되지 않습니다.
                </div>
              </div>
            </template>
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
            @onCellItemClicked="grdSubButtonClick"
          />
        </v-sheet>
      </div>
    </v-sheet>

    <LocationPopup ref="locationPopup" @selected="selectedLocation" />
    <EmpPopup ref="mngrEmpPopup" @selected="selectedMngrEmp" />
    <SAFCD0010Tab03Popup01_NEW ref="detailPopup" />
  </div>
</template>
  
<style scoped lang="scss">
::v-deep(.checkbox-column) {
  input[type=checkbox] {
    width: 18px !important;
    height: 18px !important;
    background-color: #ffffff !important;
  }

  input[type=checkbox]::after {
    background-size: 14px !important;
    background-image: url("data:image/svg+xml,%3Csvg width='9' height='6' viewBox='0 0 9 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M8.4188 0.140506C8.61735 0.332431 8.62271 0.648968 8.43079 0.847512L3.59745 5.84751C3.50203 5.94622 3.37022 6.00135 3.23294 5.99998C3.09566 5.9986 2.96498 5.94083 2.87156 5.84023L0.704894 3.50689C0.516993 3.30454 0.52871 2.98817 0.731066 2.80027C0.933421 2.61237 1.24979 2.62409 1.43769 2.82644L3.24525 4.77305L7.7118 0.152489C7.90372 -0.0460538 8.22026 -0.0514188 8.4188 0.140506Z' fill='white'/%3E%3C/svg%3E%0A") !important;
  }

  input[type=checkbox]:checked {
    background-color: #1a40c7 !important;
  }
}
</style>