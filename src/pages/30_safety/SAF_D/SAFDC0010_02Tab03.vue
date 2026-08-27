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
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUpload from '@/components/IUpload.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import SAFDC0010_02Tab03Popup from './SAFDC0010_02Tab03Popup.vue'
import IGridTitle from '@/components/IGridTitle.vue'
const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const userLogStore = useLogsStore()
const grdMain = ref(null)
const OLD_ASGN = ref('N')
const empPopup = ref(null)
const sAFDC0010_02Tab03Popup = ref(null)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  NOTI_CHK: 'Y', //점검일자 옆 체크박스
  NOTI_FROM: '', //점검일자 FROM
  NOTI_TO: '', //점검일자 TO
  // BSNS_CD: '', //사업부
  // REC_DEPT_CD: '', //부서
  SEND_BSNS_CD: 'AN00', //발신 사업부
  SEND_DEPT_CD: '', //발신 부서
  REC_BSNS_CD: userStore.bsnsCd, //수신 사업부
  REC_DEPT_CD: userStore.deptCd, //수신 부서
  REQ_REPLY_CHK: 'N', //회신요구일 옆 체크박스
  REQ_REPLY_FROM: '', //회신요구일 FROM
  REQ_REPLY_TO: '', //회신요구일 TO
  ACT_YN: '', //회신구분
  STATUS: '', //진행상태
  SUBJECT_CD: '',
  SAGO_DIV_M: '',
  ACT_EMP_NO: '', //점검자사번
  ACT_EMP_NM: '', //점검자이름
  GUBUN: 'A',
  TYPE: 'B',
})

const initCodeList = () => {
  Promise.all([
    //사업부조회
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: 'Y' },
    }),
    //진행상태조회
    getCodeList('HHIF190'),
  ]).then((res) => {
    // codeList.SEND_BSNS_CD = []
    codeList.SEND_BSNS_CD = res[0].ORESULT_CUR
    codeList.REC_BSNS_CD = res[0].ORESULT_CUR
    // codeList.SEND_DEPT_CD = res[1].ORESULT_CUR
    // codeList.REC_DEPT_CD = res[1].ORESULT_CUR
    codeList.STATUS = res[2].ORESULT_CUR
    codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    // codeList.SEND_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    // codeList.REC_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    // codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    codeList.STATUS.unshift({ TXT: '전체', COD: '' })
  })
}

const codeList = reactive({
  SEND_BSNS_CD: [], //발신사업부
  SEND_DEPT_CD: [], //부서
  REC_BSNS_CD: [], //수신사업부
  REC_DEPT_CD: [], //부서
  STATUS: [], //진행상태
})

defineOptions({
  name: '30_safety-SAF_D-SAFDC0010',
})

//디폴트 날짜 설정 -7일~오늘
const defaultDate = () => {
  //디폴트 날짜 설정
  //FROM: -7일 ~ TO : 오늘날짜
  let date = dayjs()
  let dateFrom = dayjs().subtract(7, 'day')
  searchParam.NOTI_FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.NOTI_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')

  searchParam.REQ_REPLY_FROM =
    dateFrom.$y +
    '-' +
    (dateFrom.$M + 1).toString().padStart(2, '0') +
    '-' +
    dateFrom.$D.toString().padStart(2, '0')

  searchParam.REQ_REPLY_TO =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')

  if ( userStore.authGrpCd.includes('GRP00381') || userStore.authGrpCd.includes('GRP00369')) {
    searchParam.REC_BSNS_CD = ''
    searchParam.REC_DEPT_CD = ''
    searchParam.REQ_REPLY_CHK = 'N'
  }  
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: true },
  fields: [
    {
      fieldName: 'MNG_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      header: { text: t('관리번호') },
    },
    {
      fieldName: 'SEND_ASGN_NM',
      dataType: 'text',
      width: '250',
      editable: false,
      styleName: 'left-column',
      header: { text: t('발신') },
    },
    {
      fieldName: 'REC_ASGN_NM',
      dataType: 'text',
      width: '250',
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
      width: '80',
      editable: false,
      header: { text: t('점검일자') },
    },
    {
      fieldName: 'REQ_REPLY_DT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('회신요구일자') },
    },
    {
      fieldName: 'ACT_DT',
      dataType: 'text',
      width: '80',
      editable: false,
      header: { text: t('회신일') },
    },
    {
      fieldName: 'STATUS_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('진행상태') },
    },

    {
      fieldName: 'CHK_EMP_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('점검자') },
    },
    {
      fieldName: 'SHIP_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      visible: false,
      header: { text: t('호선번호') },
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
    {
      fieldName: 'NOTI_LPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_MPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_SPLC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_SCAN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REQUIRE_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CHK_TEL_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'LOCATION_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_PLC_DESC',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'REC_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'NOTI_TITLE',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEND_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEND_DEPT_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_RSLT',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_RSLT_SCAN',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_ASGN_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_ASGN_CD',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_EMP_NM',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'ACT_EMP_NO',
      dataType: 'text',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TARGET_FACILITY_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('분야/대상설비') },
    },
    {
      fieldName: 'SAGO_DIV_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('사고유형') },
    },
    {
      fieldName: 'CLOSE_DT',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('종결일자') },
    },
    {
      fieldName: 'CLOSE_ASGN_CD',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('종결자소속') },
    },
    {
      fieldName: 'CLOSE_ASGN_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('종결자소속명') },
    },
    {
      fieldName: 'CLOSE_EMP_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('종결자사번') },
    },
    {
      fieldName: 'CLOSE_EMP_NM',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('종결자성명') },
    },
    {
      fieldName: 'REJECT_DESC',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('재조치사유') },
    },
    {
      fieldName: 'ACT_TEL_NO',
      dataType: 'text',
      width: '150',
      editable: false,
      visible: false,
      header: { text: t('조치자 연락처') },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//점검자 조회
const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NO: searchParam.ACT_EMP_NO,
  })
}

const selectedEmpPopup = (val) => {
  searchParam.ACT_EMP_NO = val.EMP_NO
  searchParam.ACT_EMP_NM = val.EMP_NM
}

onMounted(() => {
  defaultDate()
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFDC0010_SEARCH_14',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝

//행 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  sAFDC0010_02Tab03Popup.value.openPopup(data)
}

//팝업 닫혔을때 재조회
const closedPopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//발신 사업부 변경
watch(
  () => searchParam.SEND_BSNS_CD,
  
  (newValue, oldValue) => {
    //사업부변경시 부서가져옴
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
  {
    immediate: true,
  }
)

watch(
  () => searchParam.REC_BSNS_CD,
  (newValue, oldValue) => {
    if (!newValue) {
      searchParam.REC_DEPT_CD = ''
      codeList.REC_DEPT_CD = []
      codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      return false
    }
    //사업부변경시 부서가져옴
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.REC_DEPT_CD = ''
      codeList.REC_DEPT_CD = res.ORESULT_CUR
      codeList.REC_DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)
//과거조직포함 변경시 부서에 과거조직까지 조회
watch(
  () => OLD_ASGN.value,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchBSNS3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: newValue === 'Y' ? '' : 'Y',
      },
    }).then((res) => {
      codeList.SEND_BSNS_CD = []
      codeList.SEND_BSNS_CD = res.ORESULT_CUR
      codeList.SEND_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      codeList.REC_BSNS_CD = res.ORESULT_CUR
      codeList.REC_BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    })
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <v-checkbox
              label="점검일자"
              class="mr-5"
              v-model="searchParam.NOTI_CHK"
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.NOTI_FROM"
            ></i-input>
            <span class="mt-2 mx-2">~</span>
            <i-input
              width="150px"
              type="date"
              v-model="searchParam.NOTI_TO"
            ></i-input>
            <i-select
              :items="codeList.SEND_BSNS_CD"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :label="$t('발신 사업부')"
              v-model="searchParam.SEND_BSNS_CD"
            />
            <i-select
              :items="codeList.SEND_DEPT_CD"
              width="250px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :label="$t('부서')"
              v-model="searchParam.SEND_DEPT_CD"
            />
            <!-- <i-select
              label-width="50px"
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="200px"
              v-model="searchParam.SEND_BSNS_CD"
            >
            </i-select>
            <i-select
              label-width="50px"
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              width="200px"
              v-model="searchParam.SEND_DEPT_CD"
            ></i-select> -->
            <v-checkbox
              label="과거조직포함"
              true-value="Y"
              false-value="N"
              v-model="OLD_ASGN"
            ></v-checkbox>
            <div class="ml-3">
              <v-radio-group inline class="mt-1" v-model="searchParam.ACT_YN">
                <v-radio label="All" value=""></v-radio>
                <v-radio label="회신" value="Y"></v-radio>
                <v-radio label="미회신" value="N"></v-radio>
              </v-radio-group>
            </div>
          </div>
          <div class="d-flex">
            <v-checkbox
              label="회신요구일"
              v-model="searchParam.REQ_REPLY_CHK"
              class="mr-2"
              true-value="Y"
              false-value="N"
            ></v-checkbox>
            <i-input
              width="150px"
              type="date"
              class="mr-0"
              v-model="searchParam.REQ_REPLY_FROM"
            ></i-input>
            <span class="mt-2 mx-2">~</span>
            <i-input
              width="150px"
              type="date"
              v-model="searchParam.REQ_REPLY_TO"
            ></i-input>
            <i-select
              :label="$t('수신 사업부')"
              width="250px"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              :items="codeList.REC_BSNS_CD"
              v-model="searchParam.REC_BSNS_CD"
            ></i-select>
            <i-select
              :label="$t('부서')"
              width="250px"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              :items="codeList.REC_DEPT_CD"
              v-model="searchParam.REC_DEPT_CD"
            ></i-select>
            
            <i-select
              label-width="50px"
              :items="codeList.STATUS"
              item-title="TXT"
              item-value="COD"
              :label="$t('진행상태')"
              width="200px"
              v-model="searchParam.STATUS"
            ></i-select>
            <i-input
              :label="$t('점검자')"
              width="200px"
              append-inner-icon="mdi-magnify"
              @click:appendInner="openEmpPopup"
              v-model="searchParam.ACT_EMP_NM"
            ></i-input>
            <i-input width="100px" readonly v-model="searchParam.ACT_EMP_NO">
            </i-input>
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
  <EmpPopup ref="empPopup" @selected="selectedEmpPopup"></EmpPopup>
  <SAFDC0010_02Tab03Popup
    ref="sAFDC0010_02Tab03Popup"
    @closed="closedPopup"
  ></SAFDC0010_02Tab03Popup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 345px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
