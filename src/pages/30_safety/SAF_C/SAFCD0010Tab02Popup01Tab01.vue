<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const emit = defineEmits(['mounted1'])
const grdMain = ref(null)
const userStore = useUserStore()
// OzReport 관련변수들
const showOz = ref(false)
const reportParam = ref([])
let mainPagereportName = [] //레포트표지
let planReportName = [] //계획점검 레포트
let dailyReportName = [] //일상점검 레포트
let dailyReportParam1 = [] //불안전사례 파라미터
let dailyReportParam2 = [] //우수사례 파라미터
const isMulti = ref(true)
// OzReport 관련변수들

const searchParam = reactive({
  CHECK_TARGET: '', //점검대상
  FROM_DATE: '', //점검기간 FROM
  TO_DATE: '', //점검기간 TO
  CHECK_DATE: '', //점검기간 FROM + 점검기간 TO
  CHECK_GUBUN: '', //점검자구분
  CHECK_EMP_NM: '', //점검자
  FIXED_YN: '', //확정여부
})

const codeList = reactive({
  CHECK_GUBUN: [], //점검자구분
})

//필요한 데이터들
const checkData = reactive({
  CHECK_PLAN_SEQ: '', //계획점검 No
  CHECK_EMP_NO: '', //점검자사번
  DAILY_CHECK_SEQ: '', //일상점검No
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CHECK_TARGET_DESC',
      editable: false,
      dataType: 'text',
      styleName: 'left-column',
      mergeRule: { criteria: 'value' },
      header: { text: t('점검항목') },
    },
    {
      fieldName: 'CHECK_LIST_DESC',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('점검 세부항목') },
    },
    {
      fieldName: 'CHECK_CNT_SUM',
      dataType: 'number',
      styleName: 'editable_column-right',
      numberFormat: '#,##0',
      editor: {
        ignoreCharacters: 'ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}',
      },
      header: { text: t('점검(개소)') },
    },
    {
      fieldName: 'BET_CNT_SUM',
      dataType: 'number',
      editable: false,
      styleName: 'right-column',
      numberFormat: '#,##0',
      header: { text: t('불량(개소)') },
    },
    {
      fieldName: 'CHECK_LIST_SEQ',
      visible: false,
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      visible: false,
    },
    {
      fieldName: 'CHECK_TARGET_SEQ',
      visible: false,
    },
    {
      fieldName: 'CHECK_EMP_NO',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnCancelConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave01)
      .setQuery(saveData01)
      .setAfter(afterSave01)
      .setConfirmMessage('확정취소 하시겠습니까?')
      .setResultMessage('확정취소 되었습니다.')
      .run()
  } else if (btn.id === 'btnConfirm') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave02)
      .setQuery(saveData02)
      .setAfter(afterSave02)
      .setConfirmMessage('확정 하시겠습니까?')
      .setResultMessage('확정 되었습니다.')
      .run()
  } else if (btn.id === 'btnPrint') {
    print()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSave03)
      .setQuery(saveData03)
      .setAfter(afterSave03)
      .run()
  } else {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

//출력관련 로직
const print = () => {
  mainPagereportName = []
  planReportName = []
  dailyReportName = []
  reportParam.value = []
  //해당 계획점검에 등록된 일상점검 조회
  let dailyParam = {
    CHECK_PLAN_SEQ: checkData.CHECK_PLAN_SEQ,
  }
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH84',
    param: dailyParam,
  }).then((res) => {
    console.log('출력물 res', res)
    //레포트 표지 출력
    let mainPageparam = [
      'IN_CMPNY_DIV=' + userStore.cmpnyDiv,
      'IN_CHECK_PLAN_SEQ=' + checkData.CHECK_PLAN_SEQ,
    ]
    mainPagereportName = ['/manage/hse/SAFCD0010_3.ozr']

    reportParam.value.push({
      reportName: mainPagereportName,
      args: mainPageparam,
    })
    isMulti.value = true
    showOz.value = true

    let planReportParam = [
      'IN_CHECK_PLAN_SEQ=' + checkData.CHECK_PLAN_SEQ,
      'IN_FROM_DATE=' + searchParam.FROM_DATE,
      'IN_TO_DATE=' + searchParam.TO_DATE,
    ]
    planReportName = ['/manage/hse/SAFCD0010_4.ozr']
    reportParam.value.push({
      reportName: planReportName,
      args: planReportParam,
    })
    isMulti.value = true
    showOz.value = true

    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      if (res.ORESULT_CUR[i].CHECK_GUBUN == 0) {
        dailyReportParam1 = ['IN_KEY=' + res.ORESULT_CUR[i].KEY]
        dailyReportName = ['/manage/hse/SAFCD0010_1.ozr']
        reportParam.value.push({
          reportName: dailyReportName,
          args: dailyReportParam1,
        })
        isMulti.value = true
        showOz.value = true
      } else {
        dailyReportParam2 = ['IN_KEY=' + res.ORESULT_CUR[i].KEY]
        dailyReportName = ['/manage/hse/SAFCD0010_2.ozr']
        reportParam.value.push({
          reportName: dailyReportName,
          args: dailyReportParam2,
        })
        isMulti.value = true
        showOz.value = true
      }
    }
  })
}

//확정취소 관련 로직 시작
const beforeSave01 = () => {
  return true
}

const saveData01 = () => {
  let saveParam = []
  let saveData = {
    CHECK_PLAN_SEQ: checkData.CHECK_PLAN_SEQ,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFCD0010_SAVE03',
    list: saveParam,
  })
}

const afterSave01 = () => {
  searchParam.FIXED_YN = "미확정"
  btnDisabled()
}
//확정취소 관련 로직 끝

//확정 관련 로직 시작
const beforeSave02 = () => {
  return true
}

const saveData02 = () => {
  let saveParam = []
  let saveData = {
    CHECK_PLAN_SEQ: checkData.CHECK_PLAN_SEQ,
  }
  saveParam.push(saveData)
  return commonExecuteApi({
    queryId: 'SAFCD0010_SAVE04',
    list: saveParam,
  })
}

const afterSave02 = () => {
  searchParam.FIXED_YN = "확정"
  btnDisabled()
}
//확정 관련 로직 끝

//저장관련 로직 시작
const beforeSave03 = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('저장할 데이터를 선택해 주세요.'))
    return false
  }
  return true
}

const saveData03 = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CHECK_PLAN_SEQ: data.CHECK_PLAN_SEQ,
      CHECK_TARGET_SEQ: data.CHECK_TARGET_SEQ,
      CHECK_LIST_SEQ: data.CHECK_LIST_SEQ,
      CHECK_CNT_SUM: data.CHECK_CNT_SUM,
      CHECK_EMP_NO: data.CHECK_EMP_NO,
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCD0010_SAVE05',
    list: saveParam,
  })
}

const afterSave03 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//조회관련 로직 시작
const beforeSearch = () => {
  return true
}

const searchData = () => {
  let param = {
    CHECK_PLAN_SEQ: checkData.CHECK_PLAN_SEQ,
    CHECK_EMP_NO: checkData.CHECK_EMP_NO,
  }
  return commonSearchApi({
    queryId: 'SAFCD0010_SEARCH05',
    param: param,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let groupParam = {
    CMPNY_DIV: userStore.cmpnyDiv,
    CHECK_PLAN_SEQ: checkData.CHECK_PLAN_SEQ,
  }
  //점검자 권한그룹 조회
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH98',
    param: groupParam,
  }).then((res) => {
    console.log('권한', res.ORESULT_CUR)
    console.log('userStore.authGrpCd', userStore.authGrpCd)
    let filteredGroupData = res.ORESULT_CUR.filter((x) =>
      userStore.authGrpCd.includes(x.COD)
    ) //계획점검에서 등록된 권한과 점검자(로그인유저)가 가지고 있는 권한을 비교해서
    //로그인유저가 가지고 있는 권한만을 추출함
    codeList.CHECK_GUBUN = filteredGroupData
    codeList.CHECK_GUBUN.push({ TXT: '점검인원', COD: ' ' })
  })
}

//조회관련 로직 끝
onMounted(() => {
  emit('mounted1')
})

//계획점검현황에서 데이터를 받음
const receivedData = (data) => {
  console.log('계획점검현황 받은데이터', data)
  searchParam.CHECK_TARGET = data.CHECK_TARGET //점검대상
  searchParam.FROM_DATE = data.FROM_DATE //점검시작일
  searchParam.TO_DATE = data.TO_DATE //점검종료일
  searchParam.CHECK_DATE = data.FROM_DATE + '   ~   ' + data.TO_DATE
  searchParam.CHECK_EMP_NM = data.CHECK_EMP_NM //점검자
  searchParam.CHECK_GUBUN = data.CHECK_GROUP //점검자구분
  searchParam.FIXED_YN = data.FIXED_YN //확정여부
  checkData.CHECK_PLAN_SEQ = data.CHECK_PLAN_SEQ //계획점검 No
  //checkData.DAILY_CHECK_SEQ = data.DAILY_CHECK_SEQ
  checkData.CHECK_EMP_NO = data.CHECK_EMP_NO //점검자 사번

  btnDisabled()
  onButtonsClick({ id: 'btnSearch' })
}

//셀변경 이벤트
const onCellEdited = (grid, itemIndex, row, field) => {
  let data = grdMain.value.getDataProvider().getJsonRow(row)
  if (data.BET_CNT_SUM > data.CHECK_CNT_SUM) {
    //점검개소가 불량개소보다 작으면
    Message.warn(t('점검(개소)는 불량개소보다 작은값을 입력할 수 없습니다.'))
    grdMain.value.getDataProvider().setValue(row, 'CHECK_CNT_SUM', 0)
    return false
  }
}

const btnDisabled = () => {
  if(searchParam.FIXED_YN === "미확정"){
    menuTitle.value.disableBtn('btnCancelConfirm', true) //확정취소
    menuTitle.value.disableBtn('btnConfirm', false) //확정
    menuTitle.value.disableBtn('btnUpdate', false) //저장
  } else {
    menuTitle.value.disableBtn('btnCancelConfirm', false) //확정취소
    menuTitle.value.disableBtn('btnConfirm', true) //확정
    menuTitle.value.disableBtn('btnUpdate', true) //저장
  }
}

defineExpose({
  receivedData,
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="[
          'btnCancelConfirm',
          'btnConfirm',
          'btnPrint',
          'btnUpdate',
          'btnSearch',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pb-0">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('점검대상')"
            width="200px"
            required
            v-model="searchParam.CHECK_TARGET"
            readonly
          >
          </i-input>
          <i-input
            :label="$t('점검기간')"
            width="300px"
            required
            v-model="searchParam.CHECK_DATE"
            readonly
          >
          </i-input>
          <i-select
            :label="$t('점검자구분')"
            width="200px"
            required
            :items="codeList.CHECK_GUBUN"
            v-model="searchParam.CHECK_GUBUN"
            item-title="TXT"
            item-value="COD"
          >
          </i-select>
          <i-input
            :label="$t('점검자')"
            width="200px"
            required
            v-model="searchParam.CHECK_EMP_NM"
            readonly
          >
          </i-input>
          <i-input
            :label="$t('확정상태')"
            width="150px"            
            v-model="searchParam.FIXED_YN"
            readonly
          >
          </i-input>
        </v-sheet>
        <v-sheet>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            style="height: 450px"
            :columns="grdMainProps.columns"
            @onCellEdited="onCellEdited"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <OZReport
    :showPop="showOz"
    :MultiArr="reportParam"
    :is-multi="isMulti"
    @close="showOz = $event"
  />
</template>
<style scoped lang="scss">
.sheetTitle {
  font-size: 20px;
  font-weight: bold;
}
</style>
