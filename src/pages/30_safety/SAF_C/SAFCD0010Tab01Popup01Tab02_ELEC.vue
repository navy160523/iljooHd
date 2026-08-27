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
import Message from '@hiway/utils/notify'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const userStore = useUserStore()
const emit = defineEmits(['mounted2'])
const disabled = ref(false)

//그리드 위 input 컴포넌트 v-model 값들
const checkInfo = reactive({
  CHECK_TARGET: '', //점검대상
  CHECK_PERIOD: '', //점검기간
  CHECK_GUBUN: '', //점검자구분
  CHECK_EMP_NO: '', //점검자
})

const codeList = reactive({
  CHECK_GUBUN: [], //점검자구분
})

//일상점검 결과등록에서 받은 데이터중에서 계획점검 결과등록을할때 필요한 데이터를 저장하고 있는 객체
const receivedData = reactive({
  DAILY_CHECK_SEQ: '', //일상점검No
  CHECK_EMP_NO: '', //점검자
  CHECK_DATE: '', //점검일시
  CHECK_TIME: '', //점검시간
})

const searchParam = {
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  CHECK_PLAN_SEQ: '',
  CHECK_EMP_NO: '',
  DAILY_CHECK_SEQ: '',
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CHECK_TARGET_DESC',
      mergeRule: { criteria: 'value' },
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '200',
      header: { text: t('점검항목') },
    },
    {
      fieldName: 'CHECK_LIST_DESC',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '200',
      header: { text: t('점검 세부항목') },
    },
    {
      fieldName: 'CHECK_CNT_SUM',
      dataType: 'number',
      editable: false,
      width: '50',
      numberFormat: '#,###',
      header: { text: t('점검(이전누계)') },
    },
    {
      fieldName: 'CHECK_CNT',
      dataType: 'number',
      styleName: 'editable_column-right',
      width: '50',
      numberFormat: '#,###',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      header: { text: t('점검(개소)') },
    },
    {
      fieldName: 'BED_CNT_SUM',
      dataType: 'number',
      editable: false,
      width: '50',
      numberFormat: '#,###',
      header: { text: t('불량(이전누계)') },
    },
    {
      fieldName: 'BED_CNT',
      dataType: 'number',
      styleName: 'editable_column-right',
      numberFormat: '#,###',
      editor: {
        type: 'line',
        inputCharacters: '0-9',
      },
      width: '50',
      header: { text: t('불량(개소)') },
    },
    {
      fieldName: 'CHECK_PLAN_SEQ',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'CHECK_CYCLE_SEQ',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'CHECK_LIST_SEQ',
      dataType: 'text',
      visible: false,
    },
    {
      fieldName: 'CHECK_TARGET_SEQ',
      dataType: 'text',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const receivedPlanCheckedData = (data) => {
  console.log('넘어온데이터', data)
  vm.$nextTick(() => {
    //로그인유저와 점검자가 다르면 저장버튼 비활성화
    // if (data.INSERT_USER_ID !== userStore.empNo) {
    //   disabled.value = true
    // }
    receivedData.DAILY_CHECK_SEQ = data.DAILY_CHECK_SEQ //일상점검 No
    receivedData.CHECK_EMP_NO = data.CHECK_EMP_NO //점검자 사번
    receivedData.CHECK_DATE = data.CHECK_DATE //점검일시
    receivedData.CHECK_TIME = data.CHECK_TIME //점검시간
    searchParam.CMPNY_DIV = userStore.cmpnyDiv
    searchParam.BSNS_CD = userStore.bsnsCd
    searchParam.DEPT_CD = data.SENDER_DEPT_CD
    searchParam.CHECK_PLAN_SEQ = data.CHECK_PLAN_SEQ
    searchParam.CHECK_EMP_NO = data.CHECK_EMP_NO
    searchParam.DAILY_CHECK_SEQ = data.DAILY_CHECK_SEQ
    let groupParam = {
      CMPNY_DIV: userStore.cmpnyDiv,
      CHECK_PLAN_SEQ: data.CHECK_PLAN_SEQ,
    }
    Promise.all([
      //점검계획 등록 리스트 조회
      commonSearchApi({
        queryId: 'SAFCD0010_ELEC_SEARCH02',
        param: searchParam,
      }),
      //점검자 권한그룹 조회
      commonSearchApi({
        queryId: 'SAFCD0010_ELEC_SEARCH98',
        param: groupParam,
      }),
    ]).then((res) => {
      console.log('res@@@@@@@@@@@@@', res)
      grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR)
      checkInfo.CHECK_TARGET = res[0].ORESULT_CUR[0].CHECK_TARGET //점검대상
      checkInfo.CHECK_PERIOD =
        res[0].ORESULT_CUR[0].FROM_DATE +
        ' ' +
        '~' +
        ' ' +
        res[0].ORESULT_CUR[0].TO_DATE //점검기간
      checkInfo.CHECK_EMP_NO = res[0].ORESULT_CUR[0].CHECK_EMP_NM //점검자
      let filteredGroupData = res[1].ORESULT_CUR.filter((x) =>
        userStore.authGrpCd.includes(x.COD)
      ) //계획점검에서 등록된 권한과 점검자(로그인유저)가 가지고 있는 권한을 비교해서
      //로그인유저가 가지고 있는 권한만을 추출함
      codeList.CHECK_GUBUN = filteredGroupData
      codeList.CHECK_GUBUN.push({ TXT: '점검인원', COD: '' })
    })
  })
}
//계획점검 탭 데이터 초기화 함수
const initField = () => {
  for (let i in checkInfo) {
    checkInfo[i] = ''
  }
  for (let i in receivedData) {
    receivedData[i] = ''
  }
  disabled.value = false
}

//저장버튼 클릭 이벤트
const checkSave = () => {
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(afterSave)
    .run()
}
//저장관련 로직 시작
const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn('저장할 데이터를 선택해주세요')
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CHECK_PLAN_SEQ: data.CHECK_PLAN_SEQ, //점검계획No
      CHECK_CYCLE_SEQ: data.CHECK_CYCLE_SEQ, //점검기간No
      CHECK_EMP_NO: receivedData.CHECK_EMP_NO, //점검자 사번
      DAILY_CHECK_SEQ: receivedData.DAILY_CHECK_SEQ, //일상점검 No
      CHECK_TARGET_SEQ: data.CHECK_TARGET_SEQ, //점검항목 No
      CHECK_LIST_SEQ: data.CHECK_LIST_SEQ, //점검세부항목 No
      GU_ID:
        checkInfo.CHECK_GUBUN === ''
          ? receivedData.CHECK_EMP_NO
          : checkInfo.CHECK_GUBUN, //점검인원ID OR 점검그룹 ID -> 점검자구분에 점검인원을 체크하면 점검자사번이들어가고 점검자구분에 점검그룹을 체크하면 점검그룹코드가 들어감
      CHECK_CNT: data.CHECK_CNT, //점검(개소)
      BED_CNT: data.BED_CNT, //불량(개소)
      CHECK_DATE: receivedData.CHECK_DATE + receivedData.CHECK_TIME, //점검일시
      INSERT_USER_ID: userStore.userId, //등록자
    }
    saveParam.push(saveData)
  }

  return commonExecuteApi({
    queryId: 'SAFCD0010_ELEC_SAVE02',
    list: saveParam,
  })
}

const afterSave = () => {
  commonSearchApi({
    queryId: 'SAFCD0010_ELEC_SEARCH02',
    param: searchParam,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

//저장관련 로직 끝

onMounted(() => {
  emit('mounted2')
})

//셀변경 이벤트
const onCellEdited = (grid, itemIndex, row, field) => {
  let data = grdMain.value.getDataProvider().getJsonRow(row)
  if (data.BED_CNT > data.CHECK_CNT) {
    //불량(개소)가 점검(개소)보다 큰값이 입력되면 불량(개소)에 0으로 넣음
    Message.warn(t('불량(개소)는 점검(개소)보다 큰 값을 입력할 수 없습니다.'))
    grdMain.value.getDataProvider().setValue(row, 'BED_CNT', 0)
    return false
  }
}

defineExpose({
  receivedPlanCheckedData,
  initField,
})
</script>

<template>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-text class="pa-3 pb-0">
      <v-sheet class="searchArea">
        <div class="d-flex justify-space-between">
          <div class="d-flex">
            <i-input
              :label="$t('점검대상')"
              width="200px"
              required
              v-model="checkInfo.CHECK_TARGET"
              readonly
            />
            <i-input
              :label="$t('점검기간')"
              width="270px"
              required
              v-model="checkInfo.CHECK_PERIOD"
              readonly
            />
            <i-select
              :label="$t('점검자구분')"
              width="200px"
              required
              v-model="checkInfo.CHECK_GUBUN"
              :items="codeList.CHECK_GUBUN"
              item-title="TXT"
              item-value="COD"
            />
            <i-input
              :label="$t('점검자')"
              width="200px"
              required
              v-model="checkInfo.CHECK_EMP_NO"
              readonly
            />
          </div>
          <div>
            <v-btn @click="checkSave" :disabled="disabled"> 저장 </v-btn>
          </div>
        </div>
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
    </v-card-text>
  </v-card>
</template>
