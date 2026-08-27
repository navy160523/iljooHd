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
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'

defineOptions({
  name:'SAMPLE_GRID3_1',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어


const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub1 = ref(null)
const grdSub2 = ref(null)

//저장조건
let saveParams = []

const HSE_DIVLookup = reactive([
  { value: '1', label: '안전' },
  { value: '2', label: '보건' },
  { value: '3', label: '환경' },
])


//조회조건
let options = reactive({
  disabled : {
    CMPNY_DIV : false,   // 회사구분
    ORGN_DIV : false,   // 직영, 사내협력사
    BSNS_CD : false,    // 사업부
    HSE_ONLY : false,   // HSESY적용제외
    USE_OLNY : false,    // 과거조직포함
  },
  values : {
    CMPNY_DIV : userStore.company,
    ORGN_DIV : '',
    BSNS_CD : '',
    ASGN_NM : '',
    HSE_ONLY : 'Y',
    USE_OLNY : 'Y',
  },
})


onMounted(() => {
  // onButtonsClick({ id: 'btnSearch' })
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  fields : [
    { 
      fieldName: 'CMPNY_DIV', dataType: 'text', width: '150', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('회사') } ,
    },
    { 
      fieldName: 'BSNS_CD', dataType: 'text', width: '150', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부') },
    },
    { 
      fieldName: 'ASGN_CD', dataType: 'text', width: '150', 
      header: { text: t('부서코드') }, 
    },
    { 
      fieldName: 'ASGN_SHRT_NM', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('부서명') } ,
    },
    { 
      fieldName: 'ORGN_DIV', dataType: 'text', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('구분') },
    },

  ],
  columns : [],

})

grdMainProps.columns = grdMainProps.fields


//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  fields : [
    { 
      fieldName: 'CMPNY_DIV', dataType: 'text', width: '150', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('회사') } ,
    },
    { 
      fieldName: 'BSNS_CD', dataType: 'text', width: '150', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부') },
    },
    { 
      fieldName: 'ASGN_CD', dataType: 'text', width: '150', 
      header: { text: t('부서코드') }, 
    },
    { 
      fieldName: 'ASGN_SHRT_NM', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('부서명') } ,
    },
    { 
      fieldName: 'ORGN_DIV', dataType: 'text', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('구분') },
    },

  ],
  columns : [],

})

grdSubProps.columns = grdSubProps.fields

//그리드 속성셋팅
const grdSubProps2 = reactive({
  gridViewOption : {          
    stateBar: { visible: true },
    checkBar: {  visible: true } }, 
  fields : [
    { 
      fieldName: 'CMPNY_DIV', dataType: 'text', width: '150', styleName: 'left-column',
      header: { text: t('회사') } ,
    },
    { 
      fieldName: 'BSNS_CD', dataType: 'text', width: '150', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('사업부') },
    },
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', visible: false },
    { 
      fieldName: 'ASGN_CD', dataType: 'text', width: '150', 
      header: { text: t('부서코드') }, disabled: true,
    },
    { 
      fieldName: 'ASGN_SHRT_NM', dataType: 'text', width: '200', styleName: 'left-column',
      header: { text: t('부서명') } ,
    },
    { 
      fieldName: 'ORGN_DIV', dataType: 'text', styleName: 'left-column', lookupDisplay: true,
      header: { text: t('구분') },
    },

  ],
  columns : [],

})

grdSubProps2.columns = grdSubProps2.fields

//메뉴버튼
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    // 상단 그리드
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01) 
      .setAfter(afterSearch01)           
      .run()
  } 
  else if (btn.id === 'btnCreate') {
    addRowData()
  } 
  else if (btn.id === 'btnUpdate') {
    // if (!beforeSave()) {
    //   saveData()
    // }    
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdSub2, row: null }])
      .setGridList([grdSub2])
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }
}

// 그리드1
const searchData01 = () => {
  return commonSearchApi({ queryId : 'searchDept', param: options.values })
}

const afterSearch01 = res => {  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)  
}

// 그리드2
const searchData02 = () => {
  return commonSearchApi({ queryId : 'searchDept', param: options.values })
}

const afterSearch02 = res => {
  grdSub1.value.getDataProvider().setRows(res.ORESULT_CUR)
  // let dataProvider = grdSub1.value.getDataProvider()
  // dataProvider.setRows(res.ORESULT_CUR)
}

// 그리드3
const searchData03 = () => {
  return commonSearchApi({ queryId : 'SAMPLE_SEARCH_03', param: options.values })
}

const afterSearch03 = res => {
  grdSub2.value.getDataProvider().setRows(res.ORESULT_CUR)
}


const beforeDelete = () => {
  // 체크된 컬럼 확인 작업
  let rowNum = grdSub2.value.getGridView().getCheckedRows(true)
  // 선택한 row 데이터 가져와 saveParams에 넣어줌
  let saveParamArr = []
  for (var i in rowNum) {
    let data = grdSub2.value.getDataProvider().getJsonRow(rowNum[i])

    saveParamArr.push(
      {
        CMPNY_DIV : 'HHI',          // 회사 코드        
        ASGN_CD : data.ASGN_CD,     // 부서 코드
        ASGN_SHRT_NM : data.ASGN_SHRT_NM,         // 부서명
        BSNS_CD : data.BSNS_CD,     // 사업부 코드        
        ORGN_DIV : data.ORGN_DIV,     // 구분           
        RES_COD : '',               // return 값
        RES_MSG : '',               // return 값
        RES_COL : '',               // return 값
      },
    )
  }
  saveParams = saveParamArr

  return saveParams
}

//메뉴버튼 - 삭제
const deleteData = () => {  
  return commonExecuteApi({ queryId : 'SAMPLE_DELETE_03', list: saveParams })
}

const beforeSave = () => {
  return true;
}

//로우 추가하는 함수
const addRowData = () => {
  grdSub2.value.addRow({});
}

//저장버튼 눌렀을때 실행되는 함수
const saveData = () => {
  let saveParams = []
  let updateParams = []
  const updatedRows = grdSub2.value.getDataProvider().getStateRows("updated")
  const createdRows = grdSub2.value.getDataProvider().getStateRows("created")
  for (let rowIdx of createdRows) {
    let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }
  for (let rowIdx of updatedRows) {
    let data = grdSub2.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId: "SAMPLE_SAVE_03", list: saveParams })
}

/*이벤트*****************************************************/
//그리드1 클릭 시 그리드2 바인딩
const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  if (oldIdx !== -1){
    
    new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setQuery(searchData02, newIdx)
    .setAfter(afterSearch02)
    .showMessage(false)
    .run()

  }
  
}

//그리드2 클릭 시 그리드3 바인딩
const onGrdMainCurrRowChanged2 = (grid, oldIdx, newIdx) => {
  
  new queryFlowHelper(vm, t)
    .setUseDefaultBefore(false)
    .setQuery(searchData03, newIdx)
    .setAfter(afterSearch03)
    .showMessage(false)
    .run()
}


</script>

<template>
  <div class="page-wrap">
    <VContainer>
    <!-- 타이틀 -->    
      <div class="contentPanel">    
        <VRow>
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch']"
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
                    :label="$t('구분')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VAutocomplete
                        :items="['전체', '사내', '사외']"
                      />
                    </template>      
                  </ILabel>
                </VCol>
                
                <VCol cols="12" md="2">
                  <ILabel
                    :label="$t('강사명')"
                    label-width="70"
                  >
                    <template #editor="editorProps">
                      <VTextField/>
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="12" md="2">
                  <ILabel label-width="0">
                    <template #editor="editorProps">
                      <VCheckbox
                        :label="$t('삭제/퇴직인원 포함')"
                      ></VCheckbox>
                    </template> 
                  </ILabel>
                </VCol>                                                  
              </VRow>
            </VForm>
          </VCol>
        </VRow> 
  
        <!-- 메인그리드 -->
        <VRow no-gutters>
          <VCol class="pa-2 pt-0 pb-0">
            <IGridTitle 
              :title="$t('그리드1')"                        
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 300px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"      
              @onCurrentRowChanged="onGrdMainCurrRowChanged"        
            />
          </VCol>
        </VRow>
      </div>

      
      <!-- 서브그리드 -->
      <VRow no-gutters class="contentPanel">
        <VCol cols="6 pa-2">
          <IGridTitle 
            :title="$t('그리드2')"                 
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub1"
            style="height: 300px"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"   
            @onCurrentRowChanged="onGrdMainCurrRowChanged2"                
          />
        </VCol>
        <VCol cols="6 pa-2">
          <IGridTitle 
            :title="$t('그리드3')"      
            :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onButtonsClick"             
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub2"
            style="height: 300px"
            :grid-view-option="grdSubProps2.gridViewOption"
            :keys="grdSubProps2.keys" 
            :fields="grdSubProps2.fields"
            :columns="grdSubProps2.columns"
            :column-layout="grdSubProps2.columnLayout"
            class="mt-2"
            @onItemAllChecked="checkBoxChecked"
            @onItemChecked="checkBoxChecked"
          />
        </VCol>
      </VRow>
    </VContainer>    
  </div>
</template>
  
