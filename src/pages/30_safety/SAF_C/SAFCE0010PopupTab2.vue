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
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
defineOptions({
  name: '30_safety-SAF_C-SAFCE0010Popup',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)
const deptPopup = ref(null)
const causepopup = ref(null)
const userStore = useUserStore()
const emit = defineEmits(['ptwSelected'])
const searchParam01 = reactive({
  BSNS_CD: userStore.bsnsCd, //사업부
  DEPT_CD: userStore.deptCd, //부서
})

const searchParam02 = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  SEQ: '',
})

const codeList = reactive({
  bsnscd: [], //사업부
  deptcd: [], //부서
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //사업부조회
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
    commonSearchApi({
      queryId: 'searchDept',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ORGN_DIV: 'A',
        BSNS_CD: '',
        DEPT_CD: '',
        ASGN_NM: '',
        HSE_ONLY: '',
        USE_ONLY: 'Y',
        USE_TEAM: '',
      },
    }),
  ]).then((res) => {
    codeList.bsnscd = res[0].ORESULT_CUR
    codeList.deptcd = res[1].ORESULT_CUR
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('SEQ') },
    },
    {
      fieldName: 'WRK_PLC',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'WRK_PLCNM',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('장소') },
    },
    {
      fieldName: 'WRK_DIST',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '100',
      header: { text: t('작업종류') },
    },
    {
      fieldName: 'DANG_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'DANG_DIVNM',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      width: '70',
      header: { text: t('위험작업분류') },
    },
    {
      fieldName: 'CF_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'LIMIT_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('') },
    },
  ],
  columns: [],
})

const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('작업 순번') },
    },
    {
      fieldName: 'CHECK_SEQ',
      dataType: 'text',
      editable: false,
      visible: false,
      header: { text: t('점검내용 순번') },
    },
    {
      fieldName: 'CHECK_DESC',
      dataType: 'text',
      editable: false,
      width: '230',
      styleName: 'left-column',
      header: { text: t('점검내용') },
    },
    {
      fieldName: 'CHECK_IMP',
      dataType: 'text',
      editable: false,
      width: '40',
      header: { text: t('핵심점검항목') },
    },
    {
      fieldName: 'ORDER_NUM',
      dataType: 'text',
      editable: false,
      width: '30',
      header: { text: t('정렬순서') },
    },
    {
      fieldName: 'USE_YN',
      dataType: 'text',
      editable: false,
      width: '30',
      header: { text: t('사용유무') },
    },
  ],
  columns: [],
})
grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  } else {
    ptwSelect()
  }
}

//조회관련 로직 시작
const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0010_SEARCH04',
    param: searchParam01,
  })
}

const afterSearch01 = (res) => {
  if (res.ORESULT_CUR.length === 0) {
    //중대재해 작업리스트 조회값이 없을시 점검내용 값 초기화
    grdSub.value.getDataProvider().setRows(null)
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//중대재해 작업리스트 행 변경 이벤트
const onGrdMainCurrRowChanged = (grid, oldIndex, newIndex) => {
  if (newIndex === -1) {
    //처음에 데이터가 있다가 다른 조회조건으로 조회했을때 데이터가 없으면 rowIndex에러가 나서 조건추가
    return false
  }
  let row = grdMain.value.getDataProvider().getJsonRow(newIndex)
  searchParam02.CMPNY_DIV = row.CMPNY_DIV
  searchParam02.BSNS_CD = row.BSNS_CD
  searchParam02.DEPT_CD = row.DEPT_CD
  searchParam02.SEQ = row.SEQ
  new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData02)
    .setAfter(afterSearch02)
    .run()
}

const searchData02 = () => {
  return commonSearchApi({
    queryId: 'SAFCE0010_SEARCH05',
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회관련 로직 끝

//선택관련 로직 시작
const ptwSelect = () => {
  let chkNum = grdSub.value.getGridView().getCheckedRows(true)
  let ptwCheck = [] //PTW 체크리스트를 담고 있는 배열
  if (chkNum.length === 0) {
    Message.warn(t('점검항목에 추가할 데이터를 선택하세요.'))
    return false
  }
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdSub.value.getDataProvider().getJsonRow(chkNum[i])
    let emitData = {
      CHECK_DESC: data.CHECK_DESC,
    }
    ptwCheck.push(emitData)
  }
  emit('ptwSelected', ptwCheck)
}
//선택관련 로직 끝

onMounted(() => {
  initCodeList()
})

watch(
  () => searchParam01.BSNS_CD,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchDept',
      param: {
        CMPNY_DIV: searchParam01.CMPNY_DIV,
        ORGN_DIV: 'A',
        BSNS_CD: newValue,
        DEPT_CD: '',
        ASGN_NM: '',
        HSE_ONLY: '',
        USE_ONLY: 'Y',
      },
    }).then((res) => {
      codeList.deptcd = res.ORESULT_CUR
      searchParam01.DEPT_CD = codeList.deptcd[0].DEPT_CD
    })
  }
)
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnSelect']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParam01.BSNS_CD"
            :items="codeList.bsnscd"
            :label="$t('사업부')"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            width="200px"
          >
          </i-select>
          <i-select
            v-model="searchParam01.DEPT_CD"
            :label="$t('부서')"
            :items="codeList.deptcd"
            item-title="ASGN_SHRT_NM"
            item-value="DEPT_CD"
            width="250px"
          >
          </i-select>
        </v-sheet>
        <div class="h-grow">
          <v-sheet width="40%" class="pa-0 h-auto mr-3">
            <IGridTitle :title="$t('중대재해 작업리스트')" />
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
            >
            </RealGrid>
          </v-sheet>
          <v-sheet width="60%" class="pa-0 h-auto">
            <IGridTitle :title="$t('중대재해작업별 점검내용')"> </IGridTitle>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 117px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 500px;
  }
}
</style>
