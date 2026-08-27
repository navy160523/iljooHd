<script setup>
import { ref, reactive, getCurrentInstance, onMounted, watch, computed } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import { number } from 'echarts/core'

const emit = defineEmits(['update'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

const dataParams = reactive({})

const formattedAdbnf = ref('');

const popupOptions = ref({ formType: '', mode: '' });
const popupData = ref({}); 

const searchParams = reactive({})

const openPopup = async ({ formType, mode, formData }) => {
  popupOptions.value = { formType, mode };
  popupData.value = { ...formData }; 
  dialog.value = true;

  
  const formatDateToYYYYMMDD = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  searchParams.CMPNY_DIV = popupData.value.CMPNY_DIV
  searchParams.EMP_NO = popupData.value.EMP_NO
  searchParams.HOSPITAL_CODE = popupData.value.HOSPITAL_CODE
  searchParams.DISEASE_CODE = popupData.value.DISEASE_CODE
  searchParams.EVAL_DATE = formatDateToYYYYMMDD(popupData.value.EVAL_DATE)

  //차수카운트
  searchParams.AFTER_CNT = parseInt(popupData.value.AFTER_CNT)
  searchParams.HAID_CNT = parseInt(popupData.value.HAID_CNT)
  searchParams.ADBNF_CNT = parseInt(popupData.value.ADBNF_CNT)

  dataParams.OFF_NUM = popupData.value.OFF_NUM
  dataParams.SENT_DT= formatDate(popupData.value.SENT_DT)
  dataParams.LABOR_DT = formatDate(popupData.value.LABOR_DT)
  dataParams.FINAL_RST = popupData.value.FINAL_RST
  
  // 이력조회시
  if (popupOptions.value.mode == 'read') { 
    getData()
  }
  
  await nextTick();
  
  const gridView = grdMain.value?.getGridView();
  if (gridView) { 
    gridView.filterPanel.visible = true
  }
  if (!gridView) return;

  // 모든 컬럼 우선 숨김
  gridView.columnByName('AFTER_DT').visible = false;
  gridView.columnByName('AFTER_DESC').visible = false;
  gridView.columnByName('HAID_DT').visible = false;
  gridView.columnByName('ADBNF_DT').visible = false;
  gridView.columnByName('ADBNF').visible = false;

  // 필요한 컬럼만 보여주기
  if (formType === 'aftercare') {
    gridView.columnByName('AFTER_DT').visible = true;
    gridView.columnByName('AFTER_DESC').visible = true;
  } else if (formType === 'haid') {
    gridView.columnByName('HAID_DT').visible = true;
  } else if (formType === 'addbnf') {
    gridView.columnByName('ADBNF_DT').visible = true;
    gridView.columnByName('ADBNF').visible = true;
  }
};

const computedTitle = computed(() => {
  if (popupOptions.value.mode !== 'edit') return '';

  const formType = popupOptions.value.formType;
  if (formType === 'aftercare') {
    return `${searchParams.AFTER_CNT ? searchParams.AFTER_CNT + 1 : 1}차`;
  } else if (formType === 'haid') {
    return `${searchParams.HAID_CNT ? searchParams.HAID_CNT + 1 : 1}차`;
  } else if (formType === 'addbnf') {
    return `${searchParams.ADBNF_CNT ? searchParams.ADBNF_CNT + 1 : 1}차`;
  } else {
    return '';
  }
});

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

watch(formattedAdbnf, (newValue) => {
  const numericVal = parseInt(String(newValue).replace(/,/g, ''), 10);
  dataParams.ADBNF = isNaN(numericVal) ? null : numericVal;

  // 다시 콤마포맷으로 재설정 (입력값이 숫자인 경우만)
  if (!isNaN(numericVal)) {
    formattedAdbnf.value = numericVal.toLocaleString(); // 3자리마다 콤마
  } else {
    formattedAdbnf.value = '';
  }
});
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }, header: { height: 75 }},
  keys : [],
  fields: [ 
    { fieldName: 'RIV_NO', width: '40', editable: false, dataType: 'text', header: { text: t('차수'), styleName: 'center-column' }},
    // 사후관리이력
    { fieldName: 'AFTER_DT', width: '60', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('차수일자'), styleName: 'center-column' }},
    { fieldName: 'AFTER_DESC', width: '180', editable: false, dataType: 'text', header: { text: t('차수내용'), styleName: 'center-column' }},

    // 보청기 이력
    { fieldName: 'HAID_DT', width: '150', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('차수일자'), styleName: 'center-column' }},

    // 부가급여 이력
    { fieldName: 'ADBNF_DT', width: '60', editable: false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('차수일자'), styleName: 'center-column' }},
    { fieldName: 'ADBNF', width: '180', editable: false, dataType: 'number', header: { text: t('지급액'), styleName: 'center-column' },numberFormat: '#,##0'},
    
    //안보이는거
    { fieldName: 'EMP_NO', width: '80', dataType: 'text', header: { text: t('사번') },visible: false},
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서') }, visible: false, },
    { fieldName: 'HOSPITAL_CODE', dataType: 'text', header: { text: t('진단기관') },visible: false, },
    { fieldName: 'DISEASE_CODE', dataType: 'text', header: { text: t('상병코드') },visible: false, },
  ],
  columns: [],
}) 

grd1Props.columns = grd1Props.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') { 
    new saveFlowHelper(vm, t)
      .showToast(false)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopupNoSearch()
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

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
}

//  조회
const searchData = () => {
  if (popupOptions.value.formType == 'aftercare') {
    // 사후
    return commonSearchApi({ queryId: 'HLTJC0010_SEARCH_02', param: searchParams })
  } else if (popupOptions.value.formType == 'haid') {
    // 보청기
    return commonSearchApi({ queryId: 'HLTJC0010_SEARCH_03', param: searchParams })
  } else if (popupOptions.value.formType == 'addbnf') {
    // 부가급여
    return commonSearchApi({ queryId: 'HLTJC0010_SEARCH_04', param: searchParams })
  }
}

// 저장 전
const beforeSave = () => {
  // validation 체크
  if (popupOptions.value.formType == 'aftercare') {
    // 사후
    if (isEmpty(dataParams.OFF_NUM)) {
      return Message.warn(t('공문번호는 필수 입력입니다.'))
    } else if (isEmpty(dataParams.SENT_DT)) {
      return Message.warn(t('발신일은 필수 입력입니다.'))
    } else if (isEmpty(dataParams.LABOR_DT)) {
      return Message.warn(t('노동부보고일은 필수 입력입니다.'))
    } else if (isEmpty(dataParams.FINAL_RST)) {
      return Message.warn(t('최종결과는 필수 입력입니다.'))
    } else if (isEmpty(dataParams.AFTER_DT)) {
      return Message.warn(t('차수일자는 필수 입력입니다.'))
    } 
  } else if (popupOptions.value.formType == 'haid') {
    // 보청기
    if (isEmpty(dataParams.HAID_DT)) {
      return Message.warn(t('지급일자는 필수 입력입니다.'))
    } 
  } else if (popupOptions.value.formType == 'addbnf') {
    // 부가급여
    if (isEmpty(dataParams.ADBNF_DT)) {
      return Message.warn(t('지급일자는 필수 입력입니다.'))
    } else if (isEmpty(dataParams.ADBNF)) {
      return Message.warn(t('지급액은 필수 입력입니다.'))
    } 
  }

  return true
}

// 저장
const saveData = () => {   
  let saveParam = _.cloneDeep(dataParams) 

  saveParam.CMPNY_DIV = searchParams.CMPNY_DIV
  saveParam.EMP_NO = searchParams.EMP_NO
  saveParam.HOSPITAL_CODE = searchParams.HOSPITAL_CODE
  saveParam.DISEASE_CODE = searchParams.DISEASE_CODE
  saveParam.EVAL_DATE = searchParams.EVAL_DATE

  if (popupOptions.value.formType == 'aftercare') {
    saveParam.SENT_DT = dataParams.SENT_DT.replaceAll('-', '')  
    saveParam.LABOR_DT = dataParams.LABOR_DT.replaceAll('-', '')  
    saveParam.AFTER_DT = dataParams.AFTER_DT.replaceAll('-', '')
    // 사후
    return commonExecuteApi({ queryId : 'HLTJC0010_SAVE_02', list: [saveParam] })
  } else if (popupOptions.value.formType == 'haid') {
    saveParam.HAID_DT = dataParams.HAID_DT.replaceAll('-', '')
    // 보청기
    return commonExecuteApi({ queryId : 'HLTJC0010_SAVE_03', list: [saveParam] })
  } else if (popupOptions.value.formType == 'addbnf') {
    saveParam.ADBNF_DT = dataParams.ADBNF_DT.replaceAll('-', '')  
    // 부가급여
    return commonExecuteApi({ queryId : 'HLTJC0010_SAVE_04', list: [saveParam] })
  }
}

const afterSaveData = (res) => {
  if(!isEmpty(res)) {
    Message.success(t('성공적으로 저장되었습니다'))
    closePopup()
  }
}


/* ********** 닫기 ********** */
const closePopup = () => {
  emit('update')
  
  clearParam()
  formattedAdbnf.value = ''
  dialog.value = false
}

const closePopupNoSearch = () => { 
  clearParam()
  formattedAdbnf.value = ''
  dialog.value = false
}
const clearParam = () => {
  for (let key in dataParams) {
    if (dataParams.hasOwnProperty(key)) {
      dataParams[key] = ''
    }
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
    width="600"
    height="600"
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
      <span v-if="popupOptions.formType == 'aftercare' && popupOptions.mode == 'edit'">사후관리 등록</span>
      <span v-else-if="popupOptions.formType == 'haid' && popupOptions.mode == 'edit'">보청기 보상 등록</span>
      <span v-else-if="popupOptions.formType == 'addbnf' && popupOptions.mode == 'edit'">부가급여 보상 등록</span>
      <span v-else-if="popupOptions.formType == 'aftercare' && popupOptions.mode == 'read'">사후관리 이력</span>
      <span v-else-if="popupOptions.formType == 'haid' && popupOptions.mode == 'read'">보청기 보상 이력</span>
      <span v-else-if="popupOptions.formType == 'addbnf' && popupOptions.mode == 'read'">부가급여 보상 이력</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :title="computedTitle"
          :button-list="popupOptions.mode === 'read' ? ['btnClose'] : ['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <div v-if="popupOptions.mode == 'edit'">
            <!-- 사후관리 추가 -->
            <div v-if="popupOptions.formType == 'aftercare'">
              <div class="d-flex">
                <i-input v-model="dataParams.OFF_NUM" type="text" width="250px" :label="$t('공문번호')" label-width="80px" required :readonly="searchParams.AFTER_CNT >= 1"/>
                <i-input v-model="dataParams.SENT_DT" type="date" width="250px" :label="$t('발신일')" label-width="80px" required :readonly="searchParams.AFTER_CNT >= 1"/>
              </div>
              <div class="d-flex mt-2">
                <i-input v-model="dataParams.LABOR_DT" type="date" width="250px" :label="$t('노동부보고일')" label-width="80px" required :readonly="searchParams.AFTER_CNT >= 1"/>
                <i-input v-model="dataParams.FINAL_RST" type="text" width="250px" :label="$t('최종결과')" label-width="80px" required :readonly="searchParams.AFTER_CNT >= 1"/>
              </div>
              <i-input v-model="dataParams.AFTER_DT" class="mt-2" type="date" width="250px" :label="$t('차수일자')" label-width="80px" required/>
              <i-input v-model="dataParams.AFTER_DESC" class="mt-2" type="text" width="540px" :label="$t('차수내용')" label-width="80px" required/>
            </div>

            <!-- 보청기 추가 -->
            <div v-else-if="popupOptions.formType == 'haid'">
              <i-input v-model="dataParams.HAID_DT" type="date" width="250px" :label="$t('지급일자')" label-width="70px" required/>
            </div>
            
            <!-- 부가급여 추가 -->
            <div class="d-flex" v-else-if="popupOptions.formType == 'addbnf'">
              <i-input v-model="dataParams.ADBNF_DT" type="date" width="250px" :label="$t('지급일자')" label-width="70px" required/>
              <i-input v-model="formattedAdbnf" type="text" width="250px" :label="$t('지급액')" label-width="70px" required />
            </div>
          </div>

          <div v-else-if="popupOptions.mode == 'read'">
            <!-- 사후관리 이력 -->
            <v-sheet class="pa-0" style="height: 410px; width: 540px">
              <RealGrid
                ref="grdMain"
                :grid-view-option="grd1Props.gridViewOption"
                :keys="grd1Props.keys" 
                :fields="grd1Props.fields"
                :columns="grd1Props.columns"
              />
            </v-sheet>
          </div>
        </v-sheet>
      </div>
    </v-card>
  </v-dialog>
</template>
