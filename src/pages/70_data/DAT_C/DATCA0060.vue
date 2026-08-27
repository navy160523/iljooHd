<!--
  화면명 : 부서 교육자료
  화면개요 : 부서별 자료를 저장한다(본인이 소속된 부서게시글은 수정/삭제가 되지만. 타부서는 열람만 가능)
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCodeList } from '@hiway/api/commonApi'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import IMenuTitle from '@/components/IMenuTitle.vue'
import DATCA0060Popup from '@/pages/70_data/DAT_C/DATCA0060Popup.vue'
import Message from '@hiway/utils/notify'

defineOptions({
  name: '70_data-DAT_C-DATCA0060', 
})


const userStore = useUserStore()
const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const grdMain = ref(null)
const Popup = ref(null)

const codeList = reactive({
  DEPT : [],
})

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
  NOTICE_DIV: 'DATCA0060',
  dtDate: 'A',
})

const initCodeList = () => {
  Promise.all([
       commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', USE_DIV:'Y' } }), // 부서
    ]).then(res => {
      codeList.DEPT = res[0].ORESULT_CUR
      codeList.DEPT.unshift({ DEPT_CD: '', DEPT_NM: '전체' })
  })
}

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

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, lookupDisplay: true },
    { fieldName: 'NOTICE_TITLE', dataType: 'text', width: '250', header: { text: t('제목') }, styleName: 'left-column' },
    { fieldName: 'FILE_CNT', dataType: 'text', header: { text: t('첨부자료[건]') }, styleName: 'right-column' },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('작성자') } },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '200', header: { text: t('작성일시') } },
    { fieldName: 'NOTICE_CNT', dataType: 'text', header: { text: t('조회[건]') }, styleName: 'right-column' },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'NOTICE_FILEID', dataType: 'text', header: { text: t('첨부파일ID') }, visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text', header: { text: t('NOTICE_NO') }, visible: false },
    { fieldName: 'NOTICE_RANGE', dataType: 'text', header: { text: t('NOTICE_RANGE') }, visible: false },
    { fieldName: 'NOTICE_REG_EMPNO', dataType: 'text', header: { text: t('NOTICE_REG_EMPNO') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    search()
  } else {
    Popup.value.openPopup(null, search)
  }
}

// ⭐ 이미지 가져오기
function getImg(name) {
  return new URL(`/src/assets/images/icons/${name}.png`, import.meta.url).href
}

const search = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
  .run()
}
const searchData = () => {
  return commonSearchApi({ queryId: 'DATCA0060_SEARCH_01', param: searchParams })
}

const afterSearch = async (res) => {
  grdMain.value.setBindingColumn('DEPT_CD', codeList.DEPT, 'DEPT_CD', 'DEPT_NM')
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

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

const dateFromChanged = (e) => {
  if(parseDate(e) > parseDate(searchParams.DATE_TO)) {
    Message.warn(t('시작일은 종료일 이후일 수 없습니다.'))
    searchParams.DATE_FROM = searchParams.DATE_TO
  }
}

const dateToChanged = (e) => {
  if(parseDate(e) < parseDate(searchParams.DATE_FROM)) {
    Message.warn(t('종료일은 시작일 이전일 수 없습니다.'))
    searchParams.DATE_TO = searchParams.DATE_FROM
  }
}
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  Popup.value.openPopup(data) 
}

const reset = () => {
  grdMain.value.getDataProvider().setRows([])
}

const parseDate = (dateString) => {
  const [year, month, day] = dateString.split('-')
  return new Date(year, month - 1, day)
}

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="notice">
      <h2 class="text-center pt-5">주의사항</h2>
      <div class="d-flex">
        <div class="icon mt-4">
          <v-img
            width="120"
            height="120"
            :src="getImg('DATCA0060ICON')"
          />
        </div>
        <div class="notice-content">
          <p>● 부서 안전교육자료 게시판은 부서원 모두 열람할 수 있는 안전교육 자료를 게시하는 공간입니다. 목적에 맞는 자료를 업로드해 주시고, 제목은 형식에 맞도록 작성하여 주시기 바랍니다.</p>
          <p>● 게시되는 글의 본문이나 첨부파일에 <strong>개인정보(주민등록번호, 휴대폰번호, 주소, 은행계좌번호, 신용카드번호 등 개인을 식별할 수 있는 모든정보)를 포함시키지 않도록 주의 </strong>하시기 바랍니다.</p>
          <p>● <strong>개인정보가 게시되어 노출 될 경우 해당 게시물 작성자가 관련 법령에 따라 처분</strong>을 받을 수 있으니 유의하시기 바랍니다.</p>
          <p>● 저작권자의 허락없이 제작물(사진, 그림, 영상, 폰트 등)을 올릴경우 저작권법에 의하여 처벌받을 수 있으니 유의하시기 바랍니다.</p>
        </div>
      </div>
    </v-card-text>
    
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            label-width="50px"
            append-inner-icon="mdi-magnify"
            :items="codeList.DEPT"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            width="250px"
            clearable
          />
          <i-select
            v-model="searchParams.dtDate"
            :label="$t('기간')"
            label-width="50px"
            width="200px"
            :items="dtDate"
            item-title="TXT"
            item-value="COD"
            @update:modelValue="dateChange"
          />
          <i-input
            v-model="searchParams.DATE_FROM"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            label-width="35px"
            width="205px"
            type="date"
            margin="10px"
            @update:modelValue="dateFromChanged"
          />
          <i-input
            v-model="searchParams.DATE_TO"
            :disabled="searchParams.dtDate === 'A' ? true : false"
            width="190px"
            :label="$t('-')"
            type="date"
            @update:modelValue="dateToChanged"
          />
          <i-select
            v-model="searchParams.GUBUN"
            :label="$t('조회 구분')"
            label-width="80px"
            append-inner-icon="mdi-magnify"
            :items="dtGbn"
            item-title="TXT"
            item-value="COD"
            width="250px"
            clearable
            @update:modelValue="reset"
          />
          <i-input v-model="searchParams.SEARCH" width="250px" />
          
        </v-sheet>
        <v-sheet style="height:calc(100vh - 500px);">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </div>
      <DATCA0060Popup
        :id="searchParams.NOTICE_DIV"
        ref="Popup"
        @after-search="() => onButtonsClick({ id: 'btnSearch' })"
      />
    </v-card-text>
  </v-card>
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

.notice {
  background-color: rgb(var(--v-theme-base));
  margin-bottom: 10px;
  border-radius: 5px;
  margin-left: 12px;
  margin-right: 12px;
  line-height: 2;

  
  .notice-content {
    font-size: 1rem;
    padding: 10px;
    margin-top: 5px;
  }
  .icon {
    width:120px;
  }
}

.text-center {
  text-align: center;
}

</style>
