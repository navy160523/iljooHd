<!--
  화면명 : 아카데미 참석 제외 신청
  화면개요 : 아카데미 참석
-->
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
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import EDUAC0030Popup01 from '@/pages/60_edu/EDU_A/EDUAC0030Popup01.vue'
import EDUAC0030Popup02 from '@/pages/60_edu/EDU_A/EDUAC0030Popup02.vue'

defineOptions({
  name: '60_edu-EDU_A-EDUAC0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const grdMain = ref(null)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  APPLY_DATE_FR: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
  APPLY_DATE_TO: dayjs().format('YYYY-MM-DD'),
  BSNS_CD: '',
  DEPT_CD: '',
  APPROVE_YN: 'N',
  STATE: '',
})
const codeList = reactive({})
const noBsnsCd = ref(true)
const noDeptCd = ref(true)

// 팝업 관련
const AddPopUp = ref(null)
const DlcPopUp = ref(null)

/*  공통코드 세팅 */
onMounted(() => {
  vm.$nextTick(() => {
    Promise.all([
      getCodeList('HHIS060'), //0
      commonSearchApi({
        queryId: 'searchBSNS',
        param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' },
      }),
    ]).then((res) => {
      codeList.STATE = res[0].ORESULT_CUR

      codeList.BSNS_CD = res[1].ORESULT_CUR
      codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
      codeList.STATE.unshift({ TXT: '전체', COD: '' })
    })
  })
})

// 사업부 바뀌면
watch(
  () => searchParams.BSNS_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_03',
      param: { CMPNY_DIV: searchParams.CMPNY_DIV, BSNS_CD: newValue },
    }).then((res) => {
      if (newValue == '') {
        searchParams.DEPT_CD = ''
        return (noBsnsCd.value = true)
      }
      searchParams.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ TXT: '전체', COD: '' })
      noBsnsCd.value = false
    })
  }
)

//부서가 바뀌면
watch(
  () => searchParams.DEPT_CD,
  (newValue) => {
    commonSearchApi({
      queryId: 'searchVend',
      param: {
        CMPNY_DIV: searchParams.CMPNY_DIV,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: newValue,
      },
    }).then((res) => {
      if (newValue == '') {
        searchParams.ASGN_CD = ''
        return (noDeptCd.value = true)
      }
      searchParams.ASGN_CD = ''
      codeList.ASGN_CD = res.ORESULT_CUR
      codeList.ASGN_CD.unshift({ ASGN_NM: '전체', ASGN_CD: '' })
      noDeptCd.value = false
    })
  }
)

watch(
  () => searchParams.APPROVE_YN,
  (newValue) => {
    if (newValue == 'Y') {
      searchParams.USER_ID = userStore.userId
    }
  }
)

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { edit: { editable: false } },
  keys: ['APPLY_DATE2', 'APPLY_EMP_NM', 'APPLY_CNT'],
  fields: [
    {
      fieldName: 'APPLY_DATE2',
      dataType: 'text',
      header: { text: t('신청일') },
    },
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') } },
    {
      fieldName: 'APPLY_EMP_NM',
      dataType: 'text',
      header: { text: t('신청자') },
    },
    {
      fieldName: 'APPROVE_EMP_NM',
      dataType: 'text',
      header: { text: t('승인자') },
    },
    {
      fieldName: 'APPLY_CNT',
      dataType: 'text',
      header: { text: t('신청인원수') },
    },
    {
      fieldName: 'STATE_NM',
      dataType: 'text',
      header: { text: t('진행상태') },
    },

    // 안보이는거

    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      header: { text: t('회사') },
      visible: false,
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      header: { text: t('사업부') },
      visible: false,
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      header: { text: t('부서') },
      visible: false,
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      header: { text: t('소속') },
      visible: false,
    },
    {
      fieldName: 'APPLY_DATE',
      dataType: 'text',
      header: { text: t('신청일') },
      visible: false,
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',
      header: { text: t('신청순번') },
      visible: false,
    },
    {
      fieldName: 'APPLY_EMP',
      dataType: 'text',
      header: { text: t('신청자사번') },
      visible: false,
    },
    {
      fieldName: 'APPROVE_DATE',
      dataType: 'text',
      header: { text: t('승인일') },
      visible: false,
    },
    {
      fieldName: 'APPROVE_EMP',
      dataType: 'text',
      header: { text: t('승인자사번') },
      visible: false,
    },
    {
      fieldName: 'SAFE_APPROVE_DATE',
      dataType: 'text',
      header: { text: t('참석제외승인일') },
      visible: false,
    },
    {
      fieldName: 'SAFE_APPROVE_EMP',
      dataType: 'text',
      header: { text: t('참석제외승인자사번') },
      visible: false,
    },
    {
      fieldName: 'SAFE_APPROVE_EMP_NM',
      dataType: 'text',
      header: { text: t('참석제외승인자이름') },
      visible: false,
    },
    {
      fieldName: 'STATE',
      dataType: 'text',
      header: { text: t('진행상태 상태코드') },
      visible: false,
    },
    { fieldName: 'EMAIL', dataType: 'text', visible: false },
    { fieldName: 'HNDPHN', dataType: 'text', visible: false },
    { fieldName: 'APPR_USER_DIV', dataType: 'text', visible: false },
    { fieldName: 'APPLY_EMP_EMAIL', dataType: 'text', visible: false },
    { fieldName: 'APPLY_EMP_PHONE', dataType: 'text', visible: false },
    { fieldName: 'REJECT_REASON', dataType: 'text', visible: false },
  ],
  columns: [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  } else if (btn.id == 'btnCreate') {
    AddPopUp.value.openPopup()
  }
}

//  조회
const searchData01 = (idx) => {
  return commonSearchApi({
    queryId: 'EDUAC0030_SEARCH_01',
    param: searchParams,
  })
}

const afterSearch01 = (res) => {
  console.log('조회', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//  더블클릭

const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  if (row.STATE == '10' || row.STATE == '11') {
    AddPopUp.value.openPopup(row)
  } else {
    DlcPopUp.value.openPopup(row)
  }
}

const upDataRow = () => {
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.APPLY_DATE_FR"
            :label="$t('신청기간')"
            labelWidth="70px"
            width="230px"
            type="date"
          />
          <i-input
            v-model="searchParams.APPLY_DATE_TO"
            :label="$t('~')"
            labelWidth="25px"
            width="190px"
            type="date"
          />
          <i-select
            :label="$t('사업부')"
            labelWidth="50px"
            width="270px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
          />
          <i-select
            :label="$t('부서')"
            :disabled="noBsnsCd"
            labelWidth="50px"
            width="300px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.DEPT_CD"
            item-value="COD"
            item-title="TXT"
          />
          <i-select
            :label="$t('협력사')"
            :disabled="noDeptCd"
            labelWidth="50px"
            width="300px"
            v-model="searchParams.ASGN_CD"
            :items="codeList.ASGN_CD"
            item-value="ASGN_CD"
            item-title="ASGN_NM"
          />
          <i-select
            :label="$t('진행상태')"
            labelWidth="70px"
            width="230px"
            v-model="searchParams.STATE"
            :items="codeList.STATE"
            item-value="COD"
            item-title="TXT"
          />
        </v-sheet>
        <v-sheet height="90%" class="mb-2">
          <!-- 메인그리드 -->
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys"
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 팝업존 -->
    <EDUAC0030Popup01 @upDataRow="upDataRow" ref="AddPopUp" />
    <EDUAC0030Popup02 @upDataRow="upDataRow" ref="DlcPopUp" />
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
