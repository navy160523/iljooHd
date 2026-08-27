<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import index from 'vue-prism-component'


defineOptions({
  name:'SAMPLE_GRID4_2',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)
const grd3 = ref(null)
const firstReadOnly = ref(true)
const textReadOnly = ref(true)
const clickAdd = ref(false)


const grdColNames = ref(null)
const grdColValues = ref(null)

const textDetail = ref(
  {
    ASGN_NM: '',
    IN_OUT_NM: '',
    CERT_DT: '',
    CERT_EMP_NM: '',
    CERT_EMP_TEL: '',
    RESULT_DSC: '',
    ACTION_CD: '',
    APP_STATUS: '',
    REMARKS: '',
    STATUS_NM: '',
  },
)

// 저장조건
let saveParams = []

const HSE_DIVLookup = reactive([
  { value: '1', label: '안전' },
  { value: '2', label: '보건' },
  { value: '3', label: '환경' },
])

//조회조건
const searchParams1 = reactive({
  CMPNY_DIV : 'HHI',
  BSNS_CD : '',
  BUMUN_CD : '',
  YEAR : dayjs().get("year"),
})

const searchParams2 = reactive({
  CMPNY_DIV: userStore.company,
  YEAR : dayjs().get("year")+'',
  BSNS_CD:'',
  ASGN_CD:'',
  IN_OUT:'',
})

const searchParams = reactive({
  CMPNY_DIV: userStore.company,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  //사용자가 직영일경우 부서코드, 협력사일경우 협력사코드
  ASGN_CD: true? userStore.deptCd : userStore.asgnCd,
  ASGN_NM: true? userStore.deptNm : userStore.deptNm,

  //BSNS_CD: 'AN00',
  //DEPT_CD: 'N1A0',
  //ASGN_CD: 'N1A0',

  YEAR: dayjs().get("year"),
})

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { checkBar: { visible: true }, header: { height:60 } },
  keys : ['COL01'],
  fields : [ 
    { 
      fieldName: 'BSNS_NM', width: '120', lookupDisplay: true,
      header: { text: t('사업부') } ,
      mergeRule: { criteria:'value' },
      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true },
    },
    { 
      fieldName: 'ASGN_NM', width: '120', lookupDisplay: true,
      header: { text: t('부서') },
      mergeRule: { criteria:'value' },
      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true },
    },
    { 
      fieldName: 'BUMUN_NM', width: '100', lookupDisplay: true,
      header: { text: t('부문') },
      mergeRule: { criteria:"values['BSNS_NM'] + value" },
      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true },
    },
    { 
      fieldName: 'LAST_YEAR', width: '50',
      header: { text: t('최종심사년도') },
    },
    {
      fieldName: 'IN_YN', width: '20',
      header: { text: t('내부') }, 
      renderer: { type: 'check' },
    },
    {
      fieldName: 'OT_YN', width: '20',
      header: { text: t('외부') }, 
      renderer: { type: 'check' },
    },
    {
      fieldName: 'IN_MM', width: '20',
      header: { text: t('내부') }, 
    },
    {
      fieldName: 'OT_MM', width: '20',
      header: { text: t('외부') }, 
    },
    { 
      fieldName: 'BSNS_CD', width: '120', lookupDisplay: true,
      header: { text: t('사업부 코드') } ,

      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true },
    },
    { 
      fieldName: 'ASGN_CD', width: '120', lookupDisplay: true,
      header: { text: t('부서 코드') },

      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true },
    },
  ],
  columns : [],
  columnLayout: [
    'BSNS_NM',
    'ASGN_NM',
    'BUMUN_NM',
    'LAST_YEAR',
    {
      name: '중점 추진 사항(중대재해 차단대책 반영)',
      direction: 'horizontal',
      items: [
        'AHEAD_ORD',
        'AHEAD_ITEM',              
        'DETAIL_ORD',              
        'DETAIL_ITEM',              
      ],
      header: {
        text: t(searchParams.YEAR),
      },
    },
    {
      name: '연도',
      direction: 'horizontal',
      items: [ 'IN_YN', 'OT_YN' ],
      header: { text: t(searchParams.YEAR) },
    },
    {
      name: '예정월',
      direction: 'horizontal',
      items: [ 'IN_MM', 'OT_MM' ],
      header: { text: t('예정월') },
    },
  ],
})

grdProps1.columns = grdProps1.fields

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }  },
  keys : ['ASGN_NM'],
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('부서') }, mergeRule: { "criteria": "value" } },
    { fieldName: 'IN_OUT_NM', dataType: 'text', header: { text: t('내/외부') } },
    { fieldName: 'CERT_DT', dataType: 'text', header: { text: t('심사일') } },   
    { fieldName: 'CERT_EMP_NM', dataType: 'text', header: { text: t('추진자') } },
    { fieldName: 'CERT_EMP_TEL', dataType: 'text', header: { text: t('연락처') } },
    { fieldName: 'RESULT_DSC', dataType: 'text', header: { text: t('심사결과') } },
    { fieldName: 'ACTION_CD', dataType: 'text', header: { text: t('작성완료') } },
    { fieldName: 'APP_STATUS', dataType: 'text', header: { text: t('결재완료') } },
    { fieldName: 'REMARKS', dataType: 'text', header: { text: t('비고') } },
    { fieldName: 'STATUS_NM', dataType: 'text', header: { text: t('진행상태') } },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false },
    { fieldName: 'YEAR', dataType: 'text' , visible:false },
    { fieldName: 'BSNS_CD', dataType: 'text' , visible:false },
    { fieldName: 'ASGN_CD', dataType: 'text' , visible:false },
    { fieldName: 'IN_OUT', dataType: 'text' , visible:false },
    { fieldName: 'CERT_EMP', dataType: 'text' , visible:false },
    { fieldName: 'EVA_EMP', dataType: 'text' , visible:false },
    { fieldName: 'EVA_EMP_NM', dataType: 'text' , visible:false },
    { fieldName: 'RESULT_CD', dataType: 'text' , visible:false },
    { fieldName: 'CERT_TIME', dataType: 'text' , visible:false },
    { fieldName: 'CERT_PLACE', dataType: 'text' , visible:false },
  ],
  columns : [],
  columnLayout: [],
})

grdProps2.columns = grdProps2.fields

//그리드3 속성셋팅
const grdProps3 = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }  },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'HSE_DIV', dataType: 'text', width: '50', lookupDisplay: true, lookupData: HSE_DIVLookup, editable: false, 
      header: { text: t('구분') }, mergeRule: { "criteria": "value" } },
    { fieldName: 'GOAL_TITLE', dataType: 'text', width: '200', editable: false, 
      header: { text: t('목표') }, mergeRule: { "criteria": "value" }, styleName: "multiline-editor" },
    { fieldName: 'AHEAD_ORD', dataType: 'text', width: '50', editable: false, 
      header: { text: t('No.') }, mergeRule: { "criteria": "value" } },
    { fieldName: 'AHEAD_ITEM', dataType: 'text', width: '220', editable: false, 
      header: { text: t('중점항목') }, mergeRule: { "criteria": "value" } },
    { fieldName: 'DETAIL_ORD', dataType: 'text', width: '50', editable: false, 
      header: { text: t('No.') }, mergeRule: { "criteria": "value" } }, 
    { fieldName: 'DETAIL_ITEM', dataType: 'text', width: '400', editable: false,
      header: { text: t('세부내용') }, mergeRule: { "criteria": "value" }, styleName: "left-column" },
    { fieldName: 'PLAN_ITEM', dataType: 'text', width: '400', editable: false,
      header: { text: t('실행방안') }, styleName: "left-column" },
    { fieldName: 'PLAN_DESC', dataType: 'text', width: '100', editable: false, header: { text: t('관리기준') } },
    { fieldName: 'RESULT_MEASUREMENT', dataType: 'text', width: '200', editable: false, header: { text: t('성과측정기준') } },
    { fieldName: 'PLAN_DOCU', dataType: 'text', width: '200', editable: false, header: { text: t('기록관리') }  },
    { fieldName: 'PERSON_NAME', dataType: 'text', width: '100', editable: false, header: { text: t('담당자') } },
    { fieldName: 'DETAIL_COMMENT', dataType: 'text', width: '200', editable: false, editor: { type: 'multiline' },
      header: { text: t('검토의견') }, styleName: "left-column multiline-editor"  },
  ],
  columns : [],
  columnLayout: [
    'HSE_DIV', 
    'GOAL_TITLE',
    {
      name: '중점 추진 사항(중대재해 차단대책 반영)',
      direction: 'horizontal',
      items: [
        'AHEAD_ORD',
        'AHEAD_ITEM',              
        'DETAIL_ORD',              
        'DETAIL_ITEM',              
      ],
      header: {
        text: t('중점 추진 사항(중대재해 차단대책 반영)'),
      },
    },
    'PLAN_ITEM',
    'PLAN_DESC',
    'RESULT_MEASUREMENT',
    'PLAN_DOCU',
    'PERSON_NAME',
    'DETAIL_COMMENT',
  ],
})

grdProps3.columns = grdProps3.fields



const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    // 그리드 1
    new queryFlowHelper(vm, t)
      .setGridList([grd1])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()

    // 그리드 2
    new queryFlowHelper(vm, t)
      .setGridList([grd2])
      .setQuery(searchData02)
      .setAfter(afterSearch02)
      .run()

    // 그리드3
    new queryFlowHelper(vm, t)
      .setGridList([grd3])
      .setQuery(searchData03)
      .setAfter(afterSearch03)
      .run()
      
  } 
  else if (btn.id === 'btnCreate') {
    clickAdd.value = true
    textReadOnly.value = false
    firstReadOnly.value = false
    

    for( let item in textDetail.value){
      textDetail.value[item] = ''
    }
  } 
  else if (btn.id === 'btnUpdate' && firstReadOnly.value === false) {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    deleteData()
  }
}

const beforeSave = () => {
  let grdSelectedRows = grd2.value.getGridView().getSelectedRows()
  let grdJsonRow = grd2.value.getDataProvider().getJsonRow(grdSelectedRows)
  
  let cert_emp, bsns_cd, asgn_cd
  
  if(clickAdd.value){
    cert_emp = textDetail.value.CERT_EMP
    bsns_cd = textDetail.value.BSNS_CD
    asgn_cd = textDetail.value.ASGN_CD
  }else{
    cert_emp = grdJsonRow.CERT_EMP
    bsns_cd = grdJsonRow.BSNS_CD
    asgn_cd = grdJsonRow.ASGN_CD
  }
  
  let saveParamArr = []
  saveParamArr.push(
    {
      CMPNY_DIV: 'HHI',
      YEAR: '2023',
      BSNS_CD: bsns_cd,
      ASGN_CD: asgn_cd,
      IN_OUT: grdJsonRow.IN_OUT,
      CERT_DT: dayjs(textDetail.value.CERT_DT).format('YYYYMMDD'),
      CERT_TIME: null,
      CERT_PLACE: grdJsonRow.CERT_PLACE,
      CERT_EMP: cert_emp,
      CERT_EMP_TEL: textDetail.value.CERT_EMP_TEL,
      EVA_EMP: grdJsonRow.EVA_EMP,
      EVA_EMP_NM: grdJsonRow.EVA_EMP_NM,
      RESULT_CD: grdJsonRow.RESULT_CD,
      REMARKS: textDetail.value.REMARKS,
      SAVE_YN: '',
      USER_ID: userStore.userId,
    },
  )

  saveParams = saveParamArr
  console.log('saveParamArr:',saveParamArr)

  return true
}

const saveData = () => {
  console.log('saveData에서 : ', clickAdd.value)
  if(clickAdd.value)
    return commonExecuteApi({ queryId : 'MNGDA0020_save04', list: saveParams })
  else
    return commonExecuteApi({ queryId : 'MNGDA0020_save01', list: saveParams })
}

// 그리드 1
const searchData01 = idx => {
  return commonSearchApi({ queryId : 'MNGDA0010_search01', param: searchParams1 })
}

const afterSearch01 = res => {
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 그리드 2
const searchData02 = idx => {
  return commonSearchApi({ queryId : 'MNGDA0020_search01', param: searchParams2 })
}

const afterSearch02 = res => {
  console.log('search2 res:',res)
  grd2.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 그리드 3
const searchData03 = idx => {
  return commonSearchApi({ queryId : 'MNGAA0020_SEARCH_02', param: searchParams })
}

const afterSearch03 = res => {
  grd3.value.getDataProvider().setRows(res.ORESULT_CUR)
}


//팝업 오픈
const openPopup = gbn => {
  console.log('gbn:',gbn)
  if(gbn === '부서조회'){
    //deptPopup.value.openPopup({ CMPNY_DIV: userStore.company, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
    deptPopup.value.openPopup('openPop from parent')
  } else if(gbn === '목표/추진사항'){

    let hseDiv = '1'
    let curr = grd1.value.getGridView().getCurrent()

    if (curr.dataRow >= 0) {
      hseDiv = grd1.value.getDataProvider().getValue(curr.dataRow, 'HSE_DIV')
    }

    mNGAA0020Popup.value.openPopup({      
      YEAR : searchParams.YEAR,
      CMPNY_DIV : searchParams.CMPNY_DIV,
      BSNS_CD : searchParams.BSNS_CD,
      DEPT_CD : searchParams.DEPT_CD,
      ASGN_CD : searchParams.ASGN_CD,
      HSE_DIV : hseDiv,
    })
  } 
  else if(gbn === '인원조회'){
    empPopup.value.openPopup('openPop from parent')
  }
}

//팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.DEPT_CD = val.DEPT_CD
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM

  onButtonsClick({ id: 'btnSearch' })
}

// 상세에서 팝업 선택 이벤트
const onDeptSelected2 = val => {

  textDetail.value.ASGN_NM = val.ASGN_SHRT_NM

  textDetail.value.BSNS_CD = val.BSNS_CD
  textDetail.value.ASGN_CD = val.ASGN_CD
  textDetail.value.ASGN_NM = val.ASGN_SHRT_NM

}

// 상세에서 인원조회 선택 이벤트
const onEmpSelected = val => {
  console.log('val.HND_PHN:',val.HND_PHN)
  textDetail.value.CERT_EMP_NM = val.EMP_NM
  textDetail.value.CERT_EMP = val.EMP_NO
  textDetail.value.CERT_EMP_TEL = val.HND_PHN

}

const getGridValue = val => {
  // select 된 row의 값 가져옴 근데 json이라 순서가 뒤죽박죽
  let grdSelectedRows = grd2.value.getGridView().getSelectedRows()
  let grdJsonRow = grd2.value.getDataProvider().getJsonRow(grdSelectedRows)

  for( let item in textDetail.value){
    textDetail.value[item] = grdJsonRow[item] 
    if(item === 'CERT_DT')
      textDetail.value[item] = dayjs(textDetail.value[item]).format('YYYY-MM-DD')
    
  }

  clickAdd.value = false
  textReadOnly.value = true
  firstReadOnly.value = false
}
</script>

<template>
  <div class="page-wrap">
    <VContainer>
      <div class="contentPanel">
        <VRow>
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch', 'btnUpdate', 'btnPrint', 'btnCopy','btnDelete']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>
        <!-- 조회조건 -->
        <VRow no-gutters>
          <VCol>
            <VForm
              ref="searchArea"
              class="searchArea"
            >
              <VRow>  
                <VCol cols="12" md="2">
                  <ILabel
                    :label="$t('년도')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        v-model="searchParams.YEAR"
                        type="Number"
                      />
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="12" md="4">
                  <ILabel
                    :label="$t('부서/ 협력사')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VRow no-gutters>
                        <VCol cols="9 pr-1">
                          <VTextField 
                            v-model="searchParams.ASGN_NM" 
                            append-inner-icon="mdi-magnify" 
                            @keydown.enter="e => {
                              openPopup('부서조회')
                            }"
                            @update:modelValue="e => {
                              searchParams.DEPT_CD = null
                            }"
                            @click:appendInner="openPopup('부서조회')"
                          />
                        </VCol>   
                        <VCol cols="3">
                          <VTextField 
                            v-model="searchParams.DEPT_CD" 
                            readonly
                          />
                        </VCol>                   
                      </VRow>
                    </template>      
                  </ILabel>
                </VCol>
              </VRow>
            </VForm>
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12" md="6">
            <IGridTitle :title="$t('GRID 1')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grd1"
              class="mt-2"
              style="height: 320px;"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys" 
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
            />
          </VCol>
          <VCol cols="12" md="6">
            <IGridTitle 
              :title="$t('GRID 2')"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grd2"
              class="mt-2"
              style="height: 320px;"
              :grid-view-option="grdProps2.gridViewOption"
              :keys="grdProps2.keys" 
              :fields="grdProps2.fields"
              :columns="grdProps2.columns"
              @click="getGridValue"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12" md="6">
            <IGridTitle :title="$t('GRID 3')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grd3"
              class="mt-2"
              style="height: 320px;"
              :grid-view-option="grdProps3.gridViewOption"
              :keys="grdProps3.keys" 
              :fields="grdProps3.fields"
              :columns="grdProps3.columns"
            />
          </VCol>
          <VCol cols="12" md="6">
            <VRow>
              <VCol cols="12">
                <IGridTitle 
                  :title="$t('상세')"
                  :button-list="['btnCreate','btnUpdate']"
                  @click-button="onButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" md="12" class="pa-1">
                <VRow>
                  <VCol cols="12" md="6">
                    <ILabel
                      :label="$t('부서')"
                      label-loc="top"                
                    >
                      <template #editor="editorProps">
                        <VTextField 
                          v-model="textDetail.ASGN_NM"
                          append-inner-icon="mdi-magnify" 
                          @keydown.enter="e => {
                            openPopup('부서조회')
                          }"
                          :readOnly="textReadOnly"
                          @click:appendInner="openPopup('부서조회')"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="6">
                    <ILabel
                      :label="$t('내/외부')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete
                          v-model="textDetail.IN_OUT_NM"
                          :items="['내부','외부']"
                          :readOnly="textReadOnly"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                </VRow>
              </VCol>
              <VCol cols="12" md="12" class="pa-1">
                <VRow>
                  <VCol cols="12" md="6">
                    <ILabel
                      :label="$t('심사일')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="textDetail.CERT_DT"
                          type="DATE"
                          :readOnly="firstReadOnly"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="6" class="pa-1">
                    <ILabel
                      :label="$t('추진자')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="textDetail.CERT_EMP_NM"
                          append-inner-icon="mdi-magnify" 
                          @keydown.enter="e => {
                            openPopup('인원조회')
                          }"
                          @click:appendInner="openPopup('인원조회')"
                          :readOnly="textReadOnly"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                </VRow>
              </VCol>
              <VCol cols="12" md="12" class="pa-1">
                <VRow>
                  <VCol cols="12" md="6" class="pa-1">
                    <ILabel
                      :label="$t('연락처')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="textDetail.CERT_EMP_TEL"
                          :readOnly="textReadOnly"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="6" class="pa-1">
                    <ILabel
                      :label="$t('심사결과')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="textDetail.RESULT_DSC"
                          :readOnly="textReadOnly"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                </VRow>
              </VCol>
              <VCol cols="12" md="12" class="pa-1">
                <VRow>
                  <VCol cols="12" md="6" class="pa-1">
                    <ILabel
                      :label="$t('작성완료')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete
                          v-model="textDetail.ACTION_CD"
                          :items="['Y','N']"
                          :readOnly="textReadOnly"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="6" class="pa-1">
                    <ILabel
                      :label="$t('결재완료')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="textDetail.APP_STATUS"
                          readonly
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                </VRow>
              </VCol>
              <VCol cols="12" md="12" class="pa-1">
                <VRow>
                  <VCol cols="12" md="6" class="pa-1">
                    <ILabel
                      :label="$t('비고')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="textDetail.REMARKS"
                          readonly
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="6" class="pa-1">
                    <ILabel
                      :label="$t('진행상태')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="textDetail.STATUS_NM"
                          readonly
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                </VRow>
              </VCol>

              <input type="hidden" v-model="textDetail.BSNS_CD">
              <input type="hidden" v-model="textDetail.ASGN_CD">
              <input type="hidden" v-model="textDetail.CERT_EMP_NM">
            </VRow>
          </VCol>
        </VRow>
      </div>
    </VContainer>

    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup 
      ref="deptPopup" 
      @selected="onDeptSelected"
    />
    <!-- 상세에서 부서/ 협력사 팝업 -->
    <DeptPopup 
      ref="deptPopup" 
      @selected="onDeptSelected2"
    />
    <!-- 상세에서 추진자 팝업 -->
    <EmpPopup 
      ref="empPopup" 
      @selected="onEmpSelected"
    />
  </div>
</template>
  
<style scoped>
.page-wrap {
  border-radius: 3px;
  padding: 0px 20px 20px 20px;
}

.searchArea {
  background-color: rgba(6, 47, 135, 0.02);
}
</style>
