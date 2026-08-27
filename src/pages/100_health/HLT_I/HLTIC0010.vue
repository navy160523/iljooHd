<!-- 
  화면명 : 교육자료실
  화면개요 : 교육자료실 조회 및 추가, 수정, 삭제 기능
  DATCA0010 ( 게시판 공통 )
  HLTIC0010 ( 조회만 )
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { getCodeList, commonSendApi, commonExecuteApi } from '@hiway/api/commonApi'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi } from '@hiway/api/commonApi'
//import TAB01 from "@/pages/100_health/HLT_I/HLTIC0010_TAB01.vue"
import HLTIC0010Popup from './HLTIC0010Popup.vue'

defineOptions({
  name: '100_health-HLT_I-HLTIC0010',
})

const userStore = useUserStore()
// const useLogStore = useLogsStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
const Popup = ref(null)
const sortOrder = ref('desc')
const isAdmin = ref(false)

/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  ASGN_NM: userStore.deptNm,
  DEPT_CD: userStore.deptCd,
  DATE_FROM: '',
  DATE_TO: '',
  GUBUN: 'T',
  SEARCH: '',
  NOTICE_TITLE: '',
  NOTICE_DIV: '',
  NOTICE_CTN: '',
  dtDate: 'A',
  ALL_UP_CD: 'HHIIK',
  NOTICE_RANGE: 'A',
  NOTICE_REG_EMPNO: '',
  USER_ID: '',
  INSERT_USER_ID: '',
  UPDATE_USER_ID: '',
  NOTICE_PERIOD: '',
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIIK')]).then((res) => {
    const cod = res[0]?.ORESULT_CUR?.[0]?.COD
    console.log('cod : ', cod)
    // if(cod){
    //   searchParams.NOTICE_DIV = cod
    //   console.log("searchParams.NOTICE_DIV : ", searchParams.NOTICE_DIV);
    // }
  })
  grdMain.value.setBindingColumn('NOTICE_PERIOD', period, 'COD', 'TXT')
  new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
}
// const initCodeList = () => {
//   grdMain.value.setBindingColumn("NOTICE_DIV", NOTICE_RANGE, "COD", "TXT")
// }

/* 기간 */
const dtDate = reactive([
  { COD: 'A', TXT: '전체기간' },
  { COD: 'W', TXT: '최근 1주' },
  { COD: 'M', TXT: '최근 1개월' },
  { COD: 'C', TXT: '기간 선택' },
])

/* 조회 구분 */
const dtGbn = reactive([
  { COD: 'T', TXT: '제목' },
  { COD: 'N', TXT: '내용' },
  { COD: 'TN', TXT: '제목 + 내용' },
])

/* 조회 범위 */
const NOTICE_RANGE = reactive([
  { COD: 'A', TXT: '전체' },
  { COD: 'I', TXT: '사내' },
  { COD: 'O', TXT: '사외' },
])

// 게시기간
let period = reactive([
  { TXT: '영구', COD: 'A' },
  { TXT: '7일', COD: '7' },
  { TXT: '15일', COD: '15' },
  { TXT: '30일', COD: '30' },
  { TXT: '90일', COD: '90' },
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: 'NOTICE_DIV', visible: false, dataType: 'text', header: { text: t('구분') }, lookupDisplay: true },
    { fieldName: 'NOTICE_NO', dataType: 'text', header: { text: t('No.') }, visible: false },
    {
      fieldName: 'NOTICE_TITLE',
      dataType: 'text',
      width: '300',
      header: { text: t('제목') },
      styleName: 'left-column',
    },
    { fieldName: 'FILE_CNT', dataType: 'text', header: { text: t('첨부자료[건]') }, styleName: 'right-column' },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('작성자') } },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '200', header: { text: t('작성일시') } },
    { fieldName: 'NOTICE_FILEID', dataType: 'text', header: { text: t('첨부파일ID') }, visible: false },
    {
      fieldName: 'NOTICE_PERIOD',
      dataType: 'text',
      header: { text: t('게시기간') },
      editable: false,
      lookupDisplay: true,
      // editor: {
      //   type: "dropdown",
      // },
      //styleName: "left-column",
    },
    { fieldName: 'NOTICE_RANGE', dataType: 'text', header: { text: t('NOTICE_RANGE') }, visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('INSERT_USER_ID') }, visible: false },
    { fieldName: 'NOTICE_CNT', dataType: 'text', header: { text: t('조회[건]') }, styleName: 'right-column' },
    { fieldName: 'REPLY_DATE', dataType: 'text', header: { text: t('답글일시') } },
    { fieldName: 'SORT_NO', dataType: 'text', header: { text: t('일련번호') } },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 화면 실행 hook
onMounted(() => {
  // vm.$nextTick(() => {
  //   initPage()
  // })

  // 근골격계질환 예방 모듈 관리자 여부 확인
  if (useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTI001')) isAdmin.value = true
  console.log('auth : ' + userStore.authGrpCd)

  initCodeList()
})

// const initPage = () => {
//   let path = useLogsStore().path.split('/')
//   let menuId = path[path.length -1]

//   // console.log("menuId", menuId)
//   searchParams.NOTICE_DIV = menuId
// }

//상단 버튼 클릭 시
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData).setAfter(afterSearch).run()
  } else {
    Popup.value.openPopup()
  }
}

// 데이터 조회
const searchData = () => {
  // console.log("데이터확인 : ",  searchParams);
  return commonSearchApi({ queryId: 'HLTIC0010_SEARCH_01', param: searchParams })
}

// 게시기간 만료된 데이터 필터링
const filterExpiredPosts = (data) => {
  const today = new Date()

  return data.filter((row) => {
    if (row.NOTICE_PERIOD === 'A') return true // "A"는 영구 게시

    const createdAt = new Date(row.INSERT_DATE)
    const periodDays = parseInt(row.NOTICE_PERIOD, 10)
    const expiryDate = new Date(createdAt)
    expiryDate.setDate(expiryDate.getDate() + periodDays)

    return expiryDate >= today // 만료되지 않은 데이터만 유지
  })
}

// 조회 후
const afterSearch = async (res) => {
  if (!res || !res.ORESULT_CUR) return

  // 만료된 게시글 필터링
  //const filteredData = filterExpiredPosts(res.ORESULT_CUR)
  //filteredData.sort((a, b) => Number(a.NOTICE_NO) - Number(b.NOTICE_NO))

  // console.log("삭제할 게시글:", deletedPosts); // 확인용

  // 필터링된 데이터 적용
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  //console.log('데이터 : ', filteredData)
}

// 기간설정 변경
const dateChange = (e) => {
  if (e === 'A' || e === 'C') {
    /* ************* 전체기간 ************** */
    searchParams.DATE_FROM = ''
    searchParams.DATE_TO = ''
  } else if (e === 'W') {
    /* ************* 최근 1주 ************** */
    searchParams.DATE_FROM = dayjs(new Date().setDate(new Date().getDate() - 7)).format('YYYY-MM-DD')
    searchParams.DATE_TO = dayjs(new Date()).format('YYYY-MM-DD')
  } else if (e === 'M') {
    /* ************ 최근 1개월 ************* */
    searchParams.DATE_FROM = dayjs(new Date().setDate(new Date().getDate() + 1))
      .subtract(1, 'month')
      .format('YYYY-MM-DD')
    searchParams.DATE_TO = dayjs(new Date()).format('YYYY-MM-DD')
  }

  reset()
}

// 행 더블클릭. 게시글 상세
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  Popup.value.openPopup(data)
  // console.log("auth : " + userStore.authGrpCd);
}

// 그리드 데이터 초기화
const reset = () => {
  grdMain.value.getDataProvider().setRows([])
}
</script>
<template>
  <v-card>
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <!-- <i-select
            v-model="searchParams.NOTICE_DIV"
            :items="cmpnyGubun"
            item-title="TXT"
            item-value="COD"
            :label="$t('회사구분')"
            width="200px"
          >
          </i-select> -->
          <i-select
            v-model="searchParams.dtDate"
            :items="dtDate"
            item-title="TXT"
            item-value="COD"
            class="mr-0"
            :label="$t('기간')"
            label-width="40px"
            width="200px"
            @update:modelValue="dateChange"
          >
          </i-select>
          <i-input
            class="ml-3"
            type="date"
            width="180px"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            v-model="searchParams.DATE_FROM"
          >
          </i-input>
          <span class="mt-1">~</span>
          <i-input
            class="ml-3"
            type="date"
            width="180px"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            v-model="searchParams.DATE_TO"
          >
          </i-input>
          <i-select
            :items="dtGbn"
            item-title="TXT"
            item-value="COD"
            v-model="searchParams.GUBUN"
            :label="$t('조회 구분')"
            width="250px"
          ></i-select>
          <i-input v-model="searchParams.SEARCH" width="200px"></i-input>
          <i-select
            :items="NOTICE_RANGE"
            item-title="TXT"
            item-value="COD"
            v-model="searchParams.NOTICE_RANGE"
            :label="$t('조회 범위')"
            width="250px"
          ></i-select>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- <TAB01 ref="criticalcase" v-if="tab == 'criticalcase'"></TAB01> -->
  </v-card>
  <HLTIC0010Popup ref="Popup" @after-search="() => onButtonsClick({ id: 'btnSearch' })"></HLTIC0010Popup>
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
    min-height: 400px;
  }
}
</style>
