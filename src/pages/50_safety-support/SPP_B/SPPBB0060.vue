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
import { required } from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'


defineOptions({
  name: 'SPPBB0060',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)

//조회조건
let searchParams = reactive({    
  CMPNY_DIV: userStore.company,
  YEAR: dayjs().get("year"),
  BSNS_CD: '',
  ASGN_CD: '',
  ASGN_NM: '',
  INPUT_1: '',
  INPUT_2: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['COL01'],
  fields : [ 
    { fieldName: 'COL01', dataType: 'text', header: { text:'건물별' } },
    { fieldName: 'COL02', dataType: 'text', header: { text:'층별' } },
    { fieldName: 'COL03', dataType: 'text', header: { text:'바닥면적' } },
    { fieldName: 'COL04', dataType: 'text', header: { text:'수계 소화설비 현황' } },
    { fieldName: 'COL05', dataType: 'text', header: { text:'자탐, 경보설비 현황' } },
    { fieldName: 'COL06', dataType: 'text', header: { text:'가스계 소화설비 현황' } },
    { fieldName: 'COL07', dataType: 'text', header: { text:'피난설비, 소화활동 설비' } },
    
    // 숨기는 필드 visible:'false'
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
  ],
  columnLayout: [
    {
      name: '구분',
      direction: 'horizontal',
      items: [ 'COL01', 'COL02', 'COL03' ],
      header: { text: t('구분') },
    },
    'COL04',
    'COL05',
    'COL06',
    'COL07',
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields


//메뉴버튼
const onButtonsClick = btn => {

  if (btn.id === 'btnSearch') {  // 조회
    searchData()
  } 
  else if (btn.id === 'btnCreate') { // 추가
    addData()
  } 
  else if (btn.id === 'btnUpdate') { // 저장
    saveData()
  }
  else if (btn.id === 'btnDelete') {  // 삭제
    deleteData()
  }
}

/* ---------- 조회 ---------- */
const searchData = () => {
  alert('조회')
}

const afterSearch = res => {
  console.log('afterSearch')
}

/* ---------- 추가 ---------- */
const addData = () => {
  alert('추가')
}

const beforeSave = () => {
  return true
}

/* ---------- 저장 ---------- */
const saveData = () => {
  alert('저장')
}

//메뉴버튼 - 삭제
const deleteData = () => {
  alert('삭제')
}

/* ---------- 팝업 ---------- */
//팝업 오픈
const openPopup = () => {
  deptPopup.value.openPopup({ DEPT_NM: searchParams.ASGN_NM })
}

// 팝업 선택 이벤트
const onDeptSelected = val => {
  searchParams.BSNS_CD = val.BSNS_CD
  searchParams.ASGN_CD = val.DEPT_CD
  searchParams.ASGN_NM = val.ASGN_SHRT_NM
}
</script>

<template>
  <div>
    <VContainer
      class="pt-0"
    >
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            title="소방설비현황"
            :button-list="['btnSearch', 'btnPrint']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>

      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm
            ref="searchArea"
            class="searchArea"
          >
            <VRow>
              <!--  사업부 -->
              <VCol cols="12" md="3">
                <ILabel
                  :label="$t('사업부')"
                  label-width="80"
                >
                  <template #editor="editorProps">
                    <VAutocomplete 
                      :items="['전체']"
                      value="전체"
                    />
                  </template>      
                </ILabel>
              </VCol>
              <!-- 건물명 -->
              <VCol cols="3">  
                <ILabel
                  :label="$t('건물명')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.INPUT_1"
                    />
                  </template>      
                </ILabel>
              </VCol>
              <!-- 동명 -->
              <VCol cols="3">  
                <ILabel
                  :label="$t('동명')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.INPUT_2"
                    />
                  </template>      
                </ILabel>
              </VCol> 
            </VRow>
          </VForm>
        </VCol>
      </VRow>
      <!-- 소방설비현황 조회 목록 -->
      <VRow>
        <VCol>
          <IGridTitle 
            title="소방설비현황 조회 목록"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </VCol>
      </VRow>
      <!-- 소방설비현황 조회 목록 -->
    </VContainer>
    <!-- <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    />   -->
  </div>
</template>