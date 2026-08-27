<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import Message from '@hiway/utils/notify'

defineOptions({
  name: 'SAMPLE_GRID3_2',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)
const deptPopup = ref(null)

const searchParams= reactive(
  {
    CMPNY_DIV: userStore.company,
    DIVISION: '%',
    ASGN_CD: userStore.asgnCd,
    ASGN_NM: userStore.deptNm,
    LECTURER_ID: null,
  },
)

const saveParams= reactive(
  {
    CMPNY_DIV: userStore.company,
    LECTURER_ID: null,
    CURR_ID: null,
    MNG_ORGN: null,
    INSERT_USER_ID: userStore.userId,
    UNT_PRC : null,
    USER_ID: userStore.userId,
  },
)

const divisionList = ref(
  [
    { code: '%' , text: '전체' },
    { code: 'A' , text: '사내' },
    { code: 'B' , text: '사외' },
  ],
)

//그리드 속성셋팅(1)
const grdProps1 = reactive({
  gridViewOption : { stateBar: { visible: false }  },
  fields : [ 
    { fieldName: 'NAME', dataType: 'text', header: { text: t('강사명') }, editable: false },
    { fieldName: 'ASGN_NM', dataType: 'text', width: '250', header: { text: t('소속') }, editable: false },
    { fieldName: 'OFFI_TEL', dataType: 'text', header: { text: t('사무실 전화번호') }, editable: false },
    { fieldName: 'MOBILE', dataType: 'text', width: '150', header: { text: t('휴대폰번호') }, editable: false },
    { fieldName: 'EMAIL', dataType: 'text', width: '200', header: { text: t('이메일') }, editable: false },
    { fieldName: 'CURRICULUM', dataType: 'text', width: '300', header: { text: t('주요강좌') }, editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('구분') }, visible: false  },
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('강사순번') }, visible: false },
  ],
  columns: [],
})

//그리드 속성셋팅(2)
const grdProps2 = reactive({
  gridViewOption : { stateBar: { visible: false }  },
  fields : [ 
    { fieldName: 'LECTURER_ID', dataType: 'text', header: { text: t('강사순번') }, visible: true },
    { fieldName: 'CURR_ID', dataType: 'text', header: { text: t('과정순번') } },
    { fieldName: 'MNG_ORGN', dataType: 'text', header: { text: t('주관부서') } },
    { fieldName: 'UNT_PRC', dataType: 'text', header: { text: t('시간당 단가(원)') } },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('구분') }, visible: false  },
  ],
  columns: [],
})

// 그리드 세팅
grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

const onButtonsClick = gbn => {
  if(gbn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grd1])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(false)
      .run()
  } else if(gbn.id ===  'btnUpdate'){
    for(let item in saveParams){
      if(!saveParams[item]){
        Message.err(t('정보를 모두 입력해 주세요.'))

        return
      }
    }
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if(gbn.id === 'btnDelete'){

    new deleteFlowHelper(vm, t)
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()

  } else if(gbn.id === 'btnCreate'){
    saveParams.CURR_ID = null
    saveParams.MNG_ORGN = null
    saveParams.UNT_PRC = null
  }
}

const searchData01 = e => {
  return commonSearchApi({ queryId : 'TEST001_SEARCH_01', param: searchParams })
}

const afterSearch01 = res => {
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const searchData02 = e => {

  return commonSearchApi({ queryId : 'TEST001_SEARCH_02', param: searchParams })
}

const afterSearch02 = res => {
  grd2.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const beforeSave = () => {
  return true
}

// 저장
const saveData = () => {
  return commonExecuteApi({ queryId : 'TEST001_SAVE_01', list: [saveParams] })
}

// 삭제
const deleteData = () => {
  return commonExecuteApi({ queryId : 'TEST001_DELETE_01', list: [saveParams] })
}

/* row 선택 이벤트*************/
const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  let row = grd1.value.getDataProvider().getJsonRow(newIdx, newIdx)
  searchParams.LECTURER_ID = row.LECTURER_ID
  saveParams.LECTURER_ID = row.LECTURER_ID

  new queryFlowHelper(vm, t)
    .setQuery(searchData02, newIdx)
    .setAfter(afterSearch02)
    .run()
}

/* row sub 선택 이벤트*************/
const onGrdSubCurrRowChanged = (grid, oldIdx, newIdx) => {
  let row = grd2.value.getDataProvider().getJsonRow(newIdx, newIdx)
  for(let item in row){
    saveParams[item] = row[item]
  }
}

//팝업 오픈
const openPopup = gbn => {
  deptPopup.value.openPopup({ CMPNY_DIV: userStore.company, HSE_ONLY : 'Y', ASGN_NM : searchParams.ASGN_NM })
}

//팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.CMPNY_DIV = val.CMPNY_DIV
  searchParams.ASGN_CD = val.ASGN_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM

  // onButtonsClick({ id: 'btnSearch' })
}

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})
</script>

<template>
  <div class="page-wrap">
    <VContainer>
      <div class="contentPanel">    
        <VRow>
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              title="그리드 샘플 2"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>
        <!-- 조회조건 -->
        <VRow>
          <VCol>
            <VForm ref="searchArea" class="searchArea">
              <VRow>
                <VCol cols="2">  
                  <ILabel
                    :label="$t('사업장')"
                    label-width="70"
                  >
                    <template #editor="editorProps">
                      <VTextField 
                        v-model="searchParams.CMPNY_DIV"
                        readonly
                      />
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="2">  
                  <ILabel
                    :label="$t('구분')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VAutocomplete
                        :items="divisionList"
                        item-title="text"
                        item-value="code"
                        v-model="searchParams.DIVISION"
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
                            @update:modelValue="e => { searchParams.DEPT_CD = null }"
                            @click:appendInner="openPopup('부서조회')"
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
        <!-- 메인그리드 -->
        <VRow no-gutters>
          <VCol cols="6" class="pa-2">
            <IGridTitle :title="$t('강사정보')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grd1"
              class="mt-2"
              style="height: 660px;"
              :grid-view-option="grdProps1.gridViewOption"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
            />
          </VCol>
          <VCol cols="6" class="pa-2">
            <VRow no-gutters>
              <VCol>
                <IGridTitle :title="$t('강사 상세정보')">
                  <template #editors />
                </IGridTitle>
                <RealGrid
                  ref="grd2"
                  class="mt-2"
                  style="height: 250px;"
                  :grid-view-option="grdProps2.gridViewOption"
                  :fields="grdProps2.fields"
                  :columns="grdProps2.columns"
                  :column-layout="grdProps2.columnLayout"
                  @onCurrentRowChanged="onGrdSubCurrRowChanged"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <IGridTitle 
                  :title="$t('상세')"
                  :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
                  @click-button="onButtonsClick"
                >
                  <template #editors />
                </IGridTitle>
                <VRow>
                  <VCol cols="12" md="12">
                    <ILabel
                      :label="$t('사업장구분')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="saveParams.CMPNY_DIV"
                          readonly
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="12">
                    <ILabel
                      :label="$t('강사순번')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="saveParams.LECTURER_ID"
                          readonly
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="12">
                    <ILabel
                      :label="$t('과정순번')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="saveParams.CURR_ID"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="12">
                    <ILabel
                      :label="$t('주관부서')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="saveParams.MNG_ORGN"
                          :maxlength="4"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="12">
                    <ILabel
                      :label="$t('시간당 단가(원)')"
                      label-loc="top"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          v-model="saveParams.UNT_PRC"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
          </VCol>
        </VRow>
      </div>
    </VContainer>

    <!-- 부서/ 협력사 팝업 -->
    <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>

  </div>
</template>