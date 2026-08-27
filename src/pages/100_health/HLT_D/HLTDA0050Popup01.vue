<!--
  화면명 : 유해성평가 평가결과 팝업
  화면개요 : 유해성평가 평가결과 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
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
const copyPopup = ref(null)

const codeList = reactive({
  YEAR:[],
  DTX0: [
    { COD: '', TXT: ''},
    { COD: 'Y', TXT: 'O'},
    { COD: 'N', TXT: 'X'},
  ],
  DT13: [
    { COD: '', TXT: ''},
    { COD: '2', TXT: '2'},
  ],
  DTMAT: [],
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VNDCOD: '',
  SAUPBU: '',
  MATNO: '',
})

const resultData = reactive({
  EUSERINFO: '', // 환경분야 평가 담당자
  EDATETIME: '', // 환경분야 완료일시
  ERMK: '', // 환경분야 평가의견
  ERESULT: '', // 환경분야평가결과
  CONFIRM: '', //평가결과
  HUSERINFO: '', // 보건분야 평가 담당자
  HRESULT: '', //보건분야 평가결과
  HTIME: '',
  HRMK: '', // 보건분야 평가의견
  HCONFIRM: '', // 보건분야 평가결과
  MATNO: '', // 자재번호
  MATDSC: '', //자재명
  VNDNME: '', // 납품사명
  RESULT: '', // 종합평가결과
  EVAL_DATE: '' // 측정일
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: false }},
  keys: [],
  fields: [
    { fieldName: 'TYPE_ID', width: '80', dataType: 'text', header: { text: t('TYPE ID') }, },
    { fieldName: 'CASNM_KOR', width: '200', dataType: 'text', styleName: 'left-column', header: { text: t('국문표기') }, },
    { fieldName: 'CASNM_ENG', width: '200', dataType: 'text', styleName: 'left-column', header: { text: t('영문표기') }, },
    { fieldName: 'CASNO', width: '120', dataType: 'text', header: { text: t('CAS 번호') }, },
    { fieldName: 'FROM_IGDTRATE', width: '80', dataType: 'number', numberFormat: '0.00', styleName: 'right-column', header: { text: t('From') }, },
    { fieldName: 'TO_IGDTRATE', width: '80', dataType: 'number', numberFormat: '0.00', styleName: 'right-column', header: { text: t('To') }, },
    { fieldName: 'IGDTRATE', width: '80', dataType: 'number', numberFormat: '0.00', styleName: 'right-column', header: { text: t('AVG.') }, },
    { fieldName: 'EXTINFO_01', width: '60', dataType: 'text', header: { text: t('제조 등\n금지'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_02', width: '60', dataType: 'text', header: { text: t('허가\n물질'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_03', width: '60', dataType: 'text', header: { text: t('취급\n금지'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_04', width: '60', dataType: 'text', header: { text: t('발암성1') } },
    { fieldName: 'EXTINFO_05', width: '60', dataType: 'text', header: { text: t('생식\n독성1'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_06', width: '60', dataType: 'text', header: { text: t('변이\n원성1'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_07', width: '60', dataType: 'text', header: { text: t('특별\n관리'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_08', width: '60', dataType: 'text', header: { text: t('허용\n기준'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_09', width: '60', dataType: 'text', header: { text: t('유독\n물질'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_10', width: '60', dataType: 'text', header: { text: t('사고\n대비'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_11', width: '60', dataType: 'text', header: { text: t('제한\n물질'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_12', width: '60', dataType: 'text', header: { text: t('등록\n대상'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_13', width: '60', dataType: 'text', header: { text: t('발암성2') }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_14', width: '60', dataType: 'text', header: { text: t('생식\n독성2'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_15', width: '60', dataType: 'text', header: { text: t('변이\n원성2'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_16', width: '60', dataType: 'text', header: { text: t('측정\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_17', width: '60', dataType: 'text', header: { text: t('관리\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_18', width: '60', dataType: 'text', header: { text: t('특검\n대상'), styleName: 'multiline-editor-pre' }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'EXTINFO_19', width: '60', dataType: 'text', header: { text: t('배출량\n조사'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_20', width: '150', dataType: 'text', header: { text: t('기존\n물질'), styleName: 'multiline-editor-pre' } },
    { fieldName: 'EXTINFO_21', width: '150', dataType: 'text', header: { text: t('위험물') } },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') }, visible: false },
  ],

  columnLayout: [
    'TYPE_ID',
    'CASNM_KOR',
    'CASNM_ENG',
    'CASNO',
    {
          name: '함유량',
          direction: 'horizontal',
          items: [ 'FROM_IGDTRATE', 'TO_IGDTRATE', 'IGDTRATE' ],
          header: { text: t('함유량') },
    },
    {
          name: '금지 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_01', 'EXTINFO_02', 'EXTINFO_03' ],
          header: { text: t('금지 그룹') },
    },
    {
          name: '제한 그룹',
          direction: 'horizontal',
          items: [ 
            'EXTINFO_04',
            'EXTINFO_05', 
            'EXTINFO_06', 
            'EXTINFO_07', 
            'EXTINFO_08', 
            'EXTINFO_09',
            'EXTINFO_10',
            'EXTINFO_11',
            'EXTINFO_12' 
          ],
          header: { text: t('제한 그룹') },
    },
    {
          name: '관찰 그룹',
          direction: 'horizontal',
          items: [ 'EXTINFO_13', 'EXTINFO_14', 'EXTINFO_15', 'EXTINFO_16', 'EXTINFO_17', 'EXTINFO_18'],
          header: { text: t('관찰 그룹') },
    },
    {
          name: '기타 그룹',
          direction: 'horizontal',
          items: [ 
            {
              name: '배출량조사',
              direction: 'horizontal',
              items: [ 'EXTINFO_19'],
              header: { text: t('배출량조사') },
            },
          ],
          header: { text: t('기타 그룹') },
    },
    'EXTINFO_20',
    'EXTINFO_21',
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  
  vm.$nextTick(() => {
    grdMain.value.getGridView().setFixedOptions({
      colCount: 4,
    })
  })

  grdMain.value.getGridView().filterPanel.visible = true
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.VNDCOD = param.VNDCOD
  searchParams.SAUPBU = param.SAUPBU
  searchParams.MATNO = param.MATNO
  
  getCode()

  // onButtonsClick({ id: 'btnSearch' })
  dialog.value = true
}

const getCode = () => {

  Promise.all([
    commonSearchApi({ queryId : 'HLTDA0050_SEARCH_02', param : searchParams }),
    commonSearchApi({ queryId : 'HLTDA0050_SEARCH_03', param : searchParams }),
    getCodeList('HHII060'), 
  ]).then((res) => {
    if(!isEmpty(res[0].ORESULT_CUR[0])) {
      resultData.EUSERINFO = res[0].ORESULT_CUR[0].EUSERINFO
      resultData.EDATETIME = res[0].ORESULT_CUR[0].EDATETIME
      resultData.ERMK = res[0].ORESULT_CUR[0].ERMK
      resultData.ERESULT = res[0].ORESULT_CUR[0].ERESULT
      resultData.CONFIRM = res[0].ORESULT_CUR[0].CONFIRM
      resultData.HUSERINFO = res[0].ORESULT_CUR[0].HUSERINFO
      resultData.HRESULT = res[0].ORESULT_CUR[0].HRESULT
      resultData.HTIME = res[0].ORESULT_CUR[0].HTIME
      resultData.HCONFIRM = res[0].ORESULT_CUR[0].HCONFIRM
      resultData.HRMK = res[0].ORESULT_CUR[0].HRMK
      resultData.MATNO = res[0].ORESULT_CUR[0].MATNO
      resultData.MATDSC = res[0].ORESULT_CUR[0].MATDSC
      resultData.VNDNME = res[0].ORESULT_CUR[0].VNDNME
      resultData.RESULT = res[0].ORESULT_CUR[0].RESULT
      resultData.EVAL_DATE = res[0].ORESULT_CUR[0].EVAL_DATE
    }
    grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR)
    codeList.DTMAT = res[2].ORESULT_CUR
    grdMain.value.setBindingColumn('EXTINFO_05', codeList.DTMAT, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_06', codeList.DTMAT, 'COD', 'TXT')
    
    grdMain.value.setBindingColumn('EXTINFO_01', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_02', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_03', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_07', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_08', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_16', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_17', codeList.DTX0, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_18', codeList.DTX0, 'COD', 'TXT')

    grdMain.value.setBindingColumn('EXTINFO_13', codeList.DT13, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_14', codeList.DT13, 'COD', 'TXT')
    grdMain.value.setBindingColumn('EXTINFO_15', codeList.DT13, 'COD', 'TXT')
  })
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  emit('after-search')
  grdMain.value.getDataProvider().setRows([])
  for (let key in resultData) {
    if (resultData.hasOwnProperty(key)) {
      resultData[key] = ''
    } 
  }
  dialog.value = false
}

const setResult = () => {
  if(resultData.RESULT == 'Y') {
    return 'text-confirm'
  } else {
    return 'text-prohibit'
  }
}

const setResultText = () => {
  if(resultData.RESULT == 'Y') {
    return '사내 반입 가능'
  } else {
    return '사내 반입 불가'
  }
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
    width="1400"
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
      <span>유해성 평가 - 평가 결과</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <i-input
            v-model="resultData.MATDSC"
            :label="$t('제품명')"
            label-width="50px"
            type="text"
            width="500px"
            :readonly="true"
          />
          <i-input
            v-model="searchParams.MATNO"
            :label="$t('자재번호')"
            label-width="50px"
            type="text"
            width="500px"
            class="mt-1"
            :readonly="true"
          />
        </v-sheet>
      </div>
      <div class="d-flex justify-space-between pa-4 pt-0 pb-0">
        <div class="d-flex text-title">
          <div :class="setResult()">
            {{ setResultText() }}
          </div>
          <div class="mt-1 ml-1">
            제품입니다.
          </div>
        </div>
        <div class="text-title">
          {{ dayjs(resultData.EVAL_DATE).isValid()? '평가일: ' + dayjs(resultData.EVAL_DATE).format('YYYY.MM.DD') : '' }}
        </div>
      </div>
      <div class="h-grow d-flex">
        <v-sheet class="h-auto pa-4" width="50%">
          <div class="d-flex justify-space-between">
            <div class="text-title">
              보건 평가 의견
            </div>
            <div class="text-user">
              담당자 :{{ resultData.HUSERINFO }}
            </div>
          </div>
          <i-textarea
            v-model="resultData.HRMK"
            :row="5"
            width="100%"
            class="mt-2"
            :readonly="true"
          />
        </v-sheet>
        <v-sheet class="h-auto pa-4" width="50%">
          <div class="d-flex justify-space-between">
            <div class="text-title">
              환경 평가 의견
            </div>
            <div class="text-user">
              담당자 :{{ resultData.EUSERINFO }}
            </div>
          </div>
          <i-textarea
            v-model="resultData.ERMK"
            :row="5"
            width="100%"
            class="mt-2"
            :readonly="true"
          />
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('제품성분')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 320px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                :column-layout="grdMainProps.columnLayout"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.text-title {
  font-weight: bold;
  font-size: 18px;
}
.text-user {
  font-weight: 500;
  font-size: 16px;
  margin-top: 4px;
}

.text-confirm {
  font-weight: bold;
  font-size: 21px;
  color: blue;
}

.text-prohibit {
  font-weight: bold;
  font-size: 21px;
  color: red;
}
</style>
