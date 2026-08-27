<!--
  화면명 : 안전화 지급이력 조회
  화면개요 : 안전화 지급이력 조회
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

const codeList = reactive({
  YEAR:[],
  REQ_CHA: [
    { COD: '1', TXT: '상반기' },
    { COD: '2', TXT: '하반기' },
  ],
  REQ_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  SHOES_NAME: [],
  REASON: [],
  COUPON_YN: [
    { COD: 'N', TXT: '안전화' },
    { COD: 'Y', TXT: '쿠폰' },
  ]
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get('year'),
  REQ_DIV: 'A',
  REQ_CHA: '1',
  COUPON_YN: 'N',
  EMP_NO: '',
  EMP_NM: '',
  ASGN_FULL_NM: '',
  JOB_ROW_NM: '',
  STD_DUTY_NM: '',
  UNT_DUTY_NM: '',
  RECEIVE_RULE: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'YEAR', width: '60', editable : false, dataType: 'text', header: { text: t('년도') }, },
    { fieldName: 'REQ_DIV', width: '60', editable : false, dataType: 'text', header: { text: t('구분') }, },
    { fieldName: 'REQ_CHA_DT', width: '60', dataType: 'text', header: { text: t('신청시기(신청일자)') }, },
    { fieldName: 'SHOES_KIND', width: '120', editable : false, dataType: 'text', header: { text: t('안전화 종류') }, lookupDisplay: true },
    { fieldName: 'SHOES_SIZE', width: '60', editable : false, dataType: 'text', styleName: 'right-column', header: { text: t('사이즈') }, lookupDisplay: true },
    { fieldName: 'SHOES_COUNT', width: '60', editable : false, dataType: 'text', styleName: 'right-column', header: { text: t('신청수량') }, },
    { fieldName: 'COUPON_YN', width: '60', editable : false, dataType: 'text', header: { text: t('쿠폰 여부') }, }, 
    { fieldName: 'REASON', width: '180', editable : false, dataType: 'text', header: { text: t('신청사유') }, lookupDisplay: true },
    { fieldName: 'INSORE_YN', width: '60', editable : false, dataType: 'text', styleName: '', header: { text: t('보온 깔창여부') }, lookupDisplay: true },
    { fieldName: 'RECEIVE_YN', width: '60', editable : false, dataType: 'text', styleName: '', header: { text: t('지급여부') }, lookupDisplay: true },
    { fieldName: 'RECEIVE_DT', width: '100', editable : false, dataType: 'text', styleName: '', header: { text: t('지급일자') }, lookupDisplay: true },
    { fieldName: 'CHK', width: '100', editable : false, dataType: 'text', styleName: '', header: { text: t('미지급사유') }, lookupDisplay: true },
    { fieldName: 'ASGN_FULL_NM', width: '250', editable : false, dataType: 'text', styleName: '', header: { text: t('소속부서') }, lookupDisplay: true },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'REQ_CHA', dataType: 'text', header: { text: t('기간구분') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.EMP_NO = param.EMP_NO
  searchParams.EMP_NM = param.EMP_NM
  searchParams.ASGN_FULL_NM = param.ASGN_FULL_NM
  // searchParams.JOB_ROW_NM = param.
  searchParams.UNT_DUTY_NM = param.UNT_DUTY_NM
  searchParams.STD_DUTY_NM = param.STD_DUTY_NM
  searchParams.JOB_ROW_NM = param.JOB_ROW_NM
  searchParams.RECEIVE_RULE = param.RECEIVE_RULE
  getCode()
  grdMain.value.getGridView().filterPanel.visible = true
  
  dialog.value = true
}

const getCode = () => {
  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: i, TXT: i})
  }

  Promise.all([
    // 품명(안전화)
    getCodeList('HHII710A'),
    // 신청사유
    getCodeList('HHII730'),
    // 지급기준
    getCodeList('HHII740'),
  ]).then((res) => {
    codeList.SHOES_NAME = res[0].ORESULT_CUR
    codeList.REASON = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('SHOES_KIND', codeList.SHOES_NAME, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REASON', codeList.REASON, 'COD', 'TXT')
    onButtonsClick({ id: 'btnSearch' })
  })
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

// 그리드 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTHA0030_SEARCH_06', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  emit('after-search')
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="890"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>지급이력 조회</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title> 
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-input
              v-model="searchParams.EMP_NM"
              label-width="50px"
              :label="$t('이름')"
              width="200px"
              class="mr-2"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.EMP_NO"
              label-width="50px"
              :label="$t('사번')"
              width="200px"
              class="mr-2 ml-3"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.ASGN_FULL_NM"
              label-width="80px"
              :label="$t('부서/협력사')"
              width="500px"
              class="mr-2 ml-3"
              :readonly="true"
            />
          </div>
          <div class="d-flex mt-2">
            <i-input
              v-model="searchParams.JOB_ROW_NM"
              label-width="50px"
              :label="$t('직군')"
              width="200px"
              class="mr-2"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.STD_DUTY_NM"
              label-width="50px"
              :label="$t('직렬')"
              width="200px"
              class="mr-2 ml-3"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.UNT_DUTY_NM"
              label-width="80px"
              :label="$t('직무')"
              width="230px"
              class="mr-2 ml-3"
              :readonly="true"
            />
            <i-input
              v-model="searchParams.RECEIVE_RULE"
              :label="$t('지급기준')"
              label-width="50px"
              width="200px"
              class="mr-2 ml-3"
              :readonly="true"
            />
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 550px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
