<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import SAFDC0020_01Popup01 from './SAFDC0020_01Popup01.vue'

defineOptions({
  name: '30_safety-SAF_D-SAFDC0020',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const gridTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const sAFDC0020_01_Popup01 = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  TYPE: 'A',
  ACT_YN: '',
  ACT_EMP_NO: '',
  GUBUN: 'A',
  NOTI_CHK: 'Y',
  NOTI_FROM: '',
  NOTI_TO: '',
  SEND_DEPT_CD: '',
  SEND_BSNS_CD: 'AN00',
  REC_BSNS_CD: userStore.bsnsCd,
  REC_DEPT_CD: userStore.deptCd,
  SUBJECT_CD: '',
  REQ_REPLY_CHK: 'Y',
  REQ_REPLY_FROM: '',
  REQ_REPLY_TO: '',
  SAGO_DIV_M: '',
  STATUS: '',
})

const codeList = reactive({
  SEND_BSNS_CD: [],
  SEND_DEPT_CD: [],
  REC_BSNS_CD: [],
  REC_DEPT_CD: [],
  DEPT_CD: [],
  SAGO_DIV: [],
  STATUS: [],
  SUBJECT: [],
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_05',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
    getCodeList('HHIF190'),
    getCodeList('HHIF120'),
  ]).then((res) => {
    codeList.SEND_BSNS_CD = res[0].ORESULT_CUR
    codeList.REC_BSNS_CD = res[0].ORESULT_CUR
    codeList.SAGO_DIV = res[1].ORESULT_CUR
    codeList.STATUS = res[2].ORESULT_CUR
    codeList.SUBJECT = res[3].ORESULT_CUR   
    
    codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.SAGO_DIV.unshift({ TXT: '전체', COD: '' })
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
    codeList.SUBJECT.unshift({ TXT: '전체', COD: '' })
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'MNG_NO',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('관리번호') },
    },
    {
      fieldName: 'SEND_ASGN_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: 'left-column',
      header: { text: t('발신') },
    },
    {
      fieldName: 'REC_ASGN_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: 'left-column',
      header: { text: t('수신') },
    },
    {
      fieldName: 'PROBLEM_DESC',
      dataType: 'text',
      width: '300',
      editable: false,
      styleName: 'left-column',
      header: { text: t('문제점') },
    },
    {
      fieldName: 'NOTI_DT',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('점검일자') },
    },
    {
      fieldName: 'REQ_REPLY_DT',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('회신요구일자') },
    },
    {
      fieldName: 'STATUS_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('진행상태') },
    },
    {
      fieldName: 'ACT_DT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('회신일') },
    },
    {
      fieldName: 'CHK_EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('점검자') },
    },
    {
      fieldName: 'SHIP_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('호선번호') },
    },
    {
      fieldName: 'REJ_DESC',
      dataType: 'text',
      width: '100',
      visible: false,
      editable: false,
      header: { text: t('반려사유') },
    },
    {
      fieldName: 'COMPANY',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REASON',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'STATUS',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'VEND_NAME',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnMuniNotice') {
    sAFDC0020_01_Popup01.value.openPopup()
  } else {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_14',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeDelete = () => {
  let chekedRow = grdMain.value.getGridView().getCheckedRows()
  if (chekedRow.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in checkedData) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: userStore.cmpnyDiv,
      MNG_NO: data.MNG_NO,
      REASON: '',
      USER_ID: userStore.userId,
    }
    deleteParam.push(deleteData)
  }
  return commonExecuteApi({
    queryId: 'SAFDC0010_DELETE01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const defaultDate = () => {
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  searchParam.NOTI_FROM = dateFrom.format('YYYY-MM-DD')
  searchParam.NOTI_TO = date.format('YYYY-MM-DD')
  searchParam.REQ_REPLY_FROM = dateFrom.format('YYYY-MM-DD')
  searchParam.REQ_REPLY_TO = date.format('YYYY-MM-DD')
}

onMounted(() => {
  defaultDate()
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFDC0020_01_Popup01.value.openPopup2(data)
}

const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

// 수신 사업부 변경
watch(
  () => searchParam.REC_BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.REC_DEPT_CD = ''
        codeList.REC_DEPT_CD = res.ORESULT_CUR
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      } else {
        codeList.REC_DEPT_CD = res.ORESULT_CUR
        codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  },
  { immediate: true }
)

// 수신 부서 변경
watch(
  () => searchParam.REC_DEPT_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchTeam',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.REC_BSNS_CD, DEPT_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.REC_ASGN_CD = ''
        codeList.REC_ASGN_CD = res.ORESULT_CUR
        codeList.REC_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      } else {
        codeList.REC_ASGN_CD = res.ORESULT_CUR
        codeList.REC_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      }
    })
  },
  { immediate: true }
)

// 발신 사업부 변경
watch(
  () => searchParam.SEND_BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.SEND_DEPT_CD = ''
        codeList.SEND_DEPT_CD = res.ORESULT_CUR
        codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      } else {
        codeList.SEND_DEPT_CD = res.ORESULT_CUR
        codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }
    })
  },
  { immediate: true }
)

// 발신 부서 변경
watch(
  () => searchParam.SEND_DEPT_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchTeam',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.SEND_BSNS_CD, DEPT_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      if (oldValue !== undefined) {
        searchParam.SEND_ASGN_CD = ''
        codeList.SEND_ASGN_CD = res.ORESULT_CUR
        codeList.SEND_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      } else {
        codeList.SEND_ASGN_CD = res.ORESULT_CUR
        codeList.SEND_ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      }
    })
  },
  { immediate: true }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="gridTitle"
        :button-list="['btnSearch', 'btnMuniNotice', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2 flex-wrap align-center">
            <v-checkbox
              label="점검일자"
              class="mr-5"
              true-value="Y"
              false-value="N"
              v-model="searchParam.NOTI_CHK"
              hide-details
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.NOTI_FROM"
              hide-details
            ></i-input>
            <span class="mx-1 mt-2">~</span>
            <i-input
              width="150px"
              type="date"
              v-model="searchParam.NOTI_TO"
              hide-details
            ></i-input>
            <i-select
              label-width="70px"
              :label="$t('발신 사업부')"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :items="codeList.SEND_BSNS_CD"
              v-model="searchParam.SEND_BSNS_CD"
              hide-details
            ></i-select>
            <i-select
              :label="$t('부서')"
              width="200px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :items="codeList.SEND_DEPT_CD"
              v-model="searchParam.SEND_DEPT_CD"
              hide-details
            ></i-select>
            <i-select
              :label="$t('팀/협력사')"
              width="200px"
              item-title="ASGN_NM"
              item-value="ASGN_CD"
              :items="codeList.SEND_ASGN_CD"
              v-model="searchParam.SEND_ASGN_CD"
              hide-details
            ></i-select>
          </div>
          <div class="d-flex flex-wrap align-center">
            <v-checkbox
              label="회신요구일"
              class="mr-2"
              true-value="Y"
              false-value="N"
              v-model="searchParam.REQ_REPLY_CHK"
              hide-details
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.REQ_REPLY_FROM"
              hide-details
            ></i-input>
            <span class="mx-1 mt-2">~</span>
            <i-input
              width="150px"
              type="date"
              v-model="searchParam.REQ_REPLY_TO"
              hide-details
            ></i-input>
            <i-select
              label-width="70px"
              :label="$t('수신 사업부')"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :items="codeList.REC_BSNS_CD"
              v-model="searchParam.REC_BSNS_CD"
              hide-details
            ></i-select>
            <i-select
              :label="$t('부서')"
              width="200px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :items="codeList.REC_DEPT_CD"
              v-model="searchParam.REC_DEPT_CD"
              hide-details
            ></i-select>
            <i-select
              :label="$t('진행상태')"
              width="200px"
              labelWidth="50px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.STATUS"
              v-model="searchParam.STATUS"
              hide-details
            ></i-select>
          </div>
        </v-sheet>
        <v-sheet style="height: -webkit-fill-available">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>

  <SAFDC0020_01Popup01
    ref="sAFDC0020_01_Popup01"
    @closed="closedPopup"
  ></SAFDC0020_01Popup01>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 250px);
  overflow-y: auto;
  > div {
    min-height: 500px;
  }
}
</style>


