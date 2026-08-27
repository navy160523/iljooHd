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
  name: 'SPPBB0050',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
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
    { fieldName: 'COL01', dataType: 'text', header: { text:'연번' } },
    { fieldName: 'COL02', dataType: 'text', header: { text:'관리명' } },
    { fieldName: 'COL03', dataType: 'text', header: { text:'설비/약제명' } },
    { fieldName: 'COL04', dataType: 'text', header: { text:'약제실' } },
    { fieldName: 'COL05', dataType: 'text', header: { text:'형태별' } },
    { fieldName: 'COL06', dataType: 'text', header: { text:'용기단위' } },
    { fieldName: 'COL07', dataType: 'text', header: { text:'용기수' } },
    { fieldName: 'COL08', dataType: 'text', header: { text:'수신기위치' } },
    { fieldName: 'COL09', dataType: 'text', header: { text:'제조사' } },
    { fieldName: 'COL10', dataType: 'text', header: { text:'비고' } },

    
    // 숨기는 필드 visible:'false'
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true } },

  keys : ['COL01'],
  fields : [ 
    { fieldName: 'COL01', dataType: 'text', header: { text:'층별' } },
    { fieldName: 'COL02', dataType: 'text', header: { text:'구역명' } },
    { fieldName: 'COL03', dataType: 'text', header: { text:'제적' } },
    { fieldName: 'COL04', dataType: 'text', header: { text:'용기(EA)' } },
    { fieldName: 'COL05', dataType: 'text', header: { text:'헤드(EA)' } },
        
    // 감지기 그룹 컬럼
    { fieldName: 'COL06', dataType: 'text', header: { text:'차동식' } },
    { fieldName: 'COL07', dataType: 'text', header: { text:'정온식' } },
    { fieldName: 'COL08', dataType: 'text', header: { text:'연기식' } },
    { fieldName: 'COL09', dataType: 'text', header: { text:'불꽃' } },

    { fieldName: 'COL10', dataType: 'text', header: { text:'대상연번' } },
    { fieldName: 'COL11', dataType: 'text', header: { text:'비고' } },

    
    // 숨기는 필드 visible:'false'
    { fieldName: 'BSNS_CD', dataType: 'text' , visible: false },
  ],
  columnLayout: [
    'COL01',
    'COL02',
    'COL03',
    'COL04',
    'COL05',
    {
      name: '감지기',
      direction: 'horizontal',
      items: [ 'COL06', 'COL07', 'COL08', 'COL09'],
      header: { text: t('감지기') },
    },
    'COL10',
    'COL11',
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.fields

const data1 = [
  { COL01: '1',	COL02: 'B1F 가스계',	COL03: '할론-1301',	COL04: 'B1F 약제실',	COL05: '집합식',	COL06: '',	COL07: '34',	COL08: 'B1F 약제실',	COL09: '',	COL10: '' },
  { COL01: '2',	COL02: 'B2F 가스계',	COL03: '할론-1301',	COL04: 'B3F 약제실',	COL05: '집합식',	COL06: '',	COL07: '132',	COL08: 'B3F 약제실',	COL09: '',	COL10: '' },
]

const data2 = [
  { COL01: '지2',	COL02: 'UPS실',	COL03: '',	COL04: '13',	COL05: '12',	COL06: '7',	COL07: '',	COL08: '7',	COL09: '',	COL10: '',	COL11: '' },
  { COL01: '지2',	COL02: '고압전기',	COL03: '',	COL04: '18',	COL05: '10',	COL06: '5',	COL07: '',	COL08: '7',	COL09: '',	COL10: '',	COL11: '' },
]

onMounted(() => {
  grdMain.value.getDataProvider().setRows(data1)
  grdSub.value.getDataProvider().setRows(data2)
})

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
            title="가스계 소화설비 현황"
            :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnPrint']"
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
      <!-- 가스계 소방설비현황 조회 목록 -->
      <VRow>
        <VCol>
          <IGridTitle 
            title="가스계 소방설비현황 조회 목록"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            height="350"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </VCol>
      </VRow>
      <!-- 가스계 소방설비현황 조회 목록 -->
      <!-- 가스계 소방설비현황 세부 조회 목록 -->
      <VRow>
        <VCol>
          <IGridTitle 
            title="가스계 소방설비현황 세부 조회 목록"
            :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdSub"
            class="mt-2"
            height="350"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"
            :column-layout="grdSubProps.columnLayout"
          />
        </VCol>
      </VRow>
      <!-- 가스계 소방설비현황 세부 조회 목록 -->
    </VContainer>
    <!-- <DeptPopup
      ref="deptPopup"
      @selected="onDeptSelected"
    />   -->
  </div>
</template>