<!-- 
  화면명 : 유해성 평가결과 조회
  화면개요 : 유해성 평가결과 조회
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import HLTDA0050Popup01 from '@/pages/100_health/HLT_D/HLTDA0050Popup01.vue'

defineOptions({
  name:'100_health-HLT_D-HLTDA0050', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const hltda0050Popup01 = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  TMP_DATE_FROM:  dayjs().subtract(3, 'month').format('YYYY-MM-DD'), 
  TMP_DATE_TO: dayjs().format('YYYY-MM-DD'),
  MATNO: '',
})

const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: []
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || userStore.authGrpCd.includes('GRP00372')) isAdmin.value = true

  onButtonsClick({ id: 'btnSearch' })

  Promise.all([
    // 사업부
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: searchParams.CMPNY_DIV } }), 
  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('SAUPBU', codeList.BSNS_CD, 'BSNS_CD', 'BSNS_NM')   // 사업부 lookup set
  })

  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }, },
  keys : [],
  fields : [ 

    { fieldName: 'SAUPBU', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('사업부') }, lookupDisplay: true, },
    { fieldName: 'MATNO', width: '120', dataType: 'text', header: { text: t('자재번호') }, },
    { fieldName: 'MATDSC', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('제품명') }, },
    { fieldName: 'VAL_DATE', width: '120', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('평가일자') }, },
    { fieldName: 'VAL_RESULT', width: '50', dataType: 'text', header: { text: t('평가결과') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<div class="d-flex justify-space-between">
            <div>${cell.value}</div>
            <button 
              class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >상세</button>
          </div>`;
          return str;
        },
      },
    },
    { fieldName: 'VNDNME', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('납품사') } },
    { fieldName: 'PROD_VNDNME', width: '120', dataType: 'text', styleName: 'left-column', header: { text: t('제조사') } },
    
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력
// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    return Message.warn(t('관리자만 사용가능합니다.'))
  }

  if (btn.id === 'btnSearch') {
    getData()
  }
}
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  searchParams.DATE_FROM = dayjs(searchParams.TMP_DATE_FROM).format('YYYYMMDD')
  searchParams.DATE_TO = dayjs(searchParams.TMP_DATE_TO).format('YYYYMMDD')
  return commonSearchApi({ queryId: 'HLTDA0050_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  if (col.target.className === 'v-btn' && col.column === 'VAL_RESULT') {
    hltda0050Popup01.value.openPopup(data)
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex mb-2">
            <i-input
              v-model="searchParams.TMP_DATE_FROM"
              label-width="50px"
              :label="$t('기간')"
              type="date"
              width="200px"
              class="mr-2"
            />
            <i-input
              v-model="searchParams.TMP_DATE_TO"
              label-width="20px"
              :label="$t('~')"
              type="date"
              width="180px"
            />
            <i-input
              :label="$t('자재번호')"
              v-model="searchParams.MATNO" 
              label-width="50px"
              type="text"
              width="200px"
              @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
            />           
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
      <!-- 팝업존 -->
      <HLTDA0050Popup01 ref="hltda0050Popup01" />
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
    min-height: 400px;
  }
}
</style>