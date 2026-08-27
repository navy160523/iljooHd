

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper"
import RealGrid from '@/components/RealGrid.vue'

let dialog = ref(false)
const emit = defineEmits(['upData'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const menuTitle = ref(null)
const tab = ref('')
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV : '',
  YEAR: '',
  VEND_CD: ''
})

const dataParams = reactive({
  DETAIL_PLAN_A: '',
  DETAIL_PLAN_B: '',
  DETAIL_PLAN_C: '',
  DETAIL_PLAN_D: '',
  DETAIL_PLAN_E: '',
  DETAIL_PLAN_Z: '',
})
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

const searchData = () => {
  // console.log(searchParams);
  return commonSearchApi({ queryId: 'HLTKC0020_SEARCH_06', param: searchParams })
};

const afterSearch = (res) => {
  // console.log("res", res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 팝업
const openPopup = (popupParam) => {
  // debugger
  console.log("popupParam", popupParam)
  dialog.value = true

  searchParams.CMPNY_DIV = popupParam.searchParams.CMPNY_DIV
  searchParams.YEAR = popupParam.searchParams.YEAR
  searchParams.VEND_CD = popupParam.searchParams.VEND_CD

  getData()
}

const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: true }, header: { height: 75 } },
  keys : [],
  fields : [ 
    // { fieldName: 'EMP_NO', width: '80', dataType: 'text', editable: false, header: { text: t('등록번호') } },
    { fieldName: 'EMP_NM', width: '80', dataType: 'text', editable: false, header: { text: t('성명') } },
    { fieldName: 'JOB_TIT_NM', width: '60', dataType: 'text', editable: false, header: { text: t('직위') } },
    { fieldName: 'BIRTH_DAY', width: '100', dataType: 'text', editable: false, header: { text: t('생년월일') } },
    { fieldName: 'AGE_INT', width: '60', dataType: 'text', editable: false, header: { text: t('나이(만)') }},
    { fieldName: 'CHK_A', width: '50', dataType: 'text', editable: false, header: { text: t('건강관리위험대상') } },
    { fieldName: 'CHK_B', width: '60', dataType: 'text', editable: false, header: { text: t('유소견/요관찰') } },
    { fieldName: 'CHK_C', width: '50', dataType: 'text', editable: false, header: { text: t('일반 고령자') } },
    { fieldName: 'CHK_Z', width: '50', dataType: 'text', editable: false, header: { text: t('기타') } },
    { fieldName: 'MANAGE_ITEM', width: '230', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('건강관리항목') } },
    { fieldName: 'HALF_FST_1', width: '100', dataType: 'text', editable: false, header: { text: t('관리일자(1차)') } },
    { fieldName: 'HALF_FST_2', width: '100', dataType: 'text', editable: false, header: { text: t('관리일자(2차)') } },
    { fieldName: 'HALF_FST_3', width: '100', dataType: 'text', editable: false, header: { text: t('관리일자(3차)') } },
    { fieldName: 'HALF_SND_1', width: '100', dataType: 'text', editable: false, header: { text: t('관리일자(1차)') } },
    { fieldName: 'HALF_SND_2', width: '100', dataType: 'text', editable: false, header: { text: t('관리일자(2차)') } },
    { fieldName: 'HALF_SND_3', width: '100', dataType: 'text', editable: false, header: { text: t('관리일자(3차)') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'VEND_CD', dataType: 'text', header: { text: t('소속코드') },visible: false, },
    { fieldName: 'VEND_NM', dataType: 'text', header: { text: t('소속명') },visible: false, },
    { fieldName: 'AGE', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'JOB_NM', dataType: 'text', header: { text: t('직무') },visible: false, },
    { fieldName: 'JOIN_DT', dataType: 'text', header: { text: t('입사일') },visible: false, },
    { fieldName: 'STD_CNT', dataType: 'text', header: { text: t('계획카운트') },visible: false, },
    { fieldName: 'AFT_CNT', dataType: 'text', header: { text: t('실적카운트') },visible: false, },
    { fieldName: 'MEDC_TEST_DT', dataType: 'text', header: { text: t('나이') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columnLayout: [
    // 'EMP_NO',
    'EMP_NM',
    'JOB_TIT_NM',
    'BIRTH_DAY',
    'AGE_INT',
    {
          name: '구분',
          direction: 'horizontal',
          items: [ 'CHK_A', 'CHK_B', 'CHK_C', 'CHK_Z'],
          header: { text: t('구분') },
    },
    'MANAGE_ITEM',
    {
          name: '상반기',
          direction: 'horizontal',
          items: [ 'HALF_FST_1', 'HALF_FST_2', 'HALF_FST_3'],
          header: { text: t('상반기') },
    },
    {
          name: '하반기',
          direction: 'horizontal',
          items: [ 'HALF_SND_1', 'HALF_SND_2', 'HALF_SND_3'],
          header: { text: t('하반기') },
    },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields


</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="p-absolute user-select-none"
    width="1400"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>건강관리대상자 사후관리현황</span>
    </v-sheet>
    <v-card class="pa-3 fill-height" style="background-color: white">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnClose']"
        @click-button="onButtonsClick"
        :hiddenManuel="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  </v-dialog>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}

</style>