 <!--
  화면명 : 협력사 안전관리자 지원금 관리
  화면개요 : 협력사 안전관리자 지원금 관리 조회 저장 하는 화면
-->
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
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'


defineOptions({
  name: '30_safety-SAF_I-SAFIE0010',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const menuTitle = ref(null)
const searchArea = ref(null)
const grd1 = ref(null)
const tab = ref('one')
const deptPopup = ref(null)

const btns = reactive([
  { title: "메일발송", icon: "mdi-check-circle-outline" },
  { title: "조회", icon: "mdi-magnify" },
  { title: "저장", icon: "mdi-content-save" },
  { title: "삭제", icon: "mdi-delete" },
])

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('월') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('기간1') } },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('기간2') } },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('비고') } },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields

//그리드 데이터 입력
const data1 = [
  { COL1: '01',	COL2: '',	COL3: '' },
  { COL1: '02',	COL2: '2023-02-20',	COL3: '2023-02-22' },
  { COL1: '03',	COL2: '2023-03-20',	COL3: '2023-03-22' },
  { COL1: '04',	COL2: '2023-04-20',	COL3: '2023-04-25' },
  { COL1: '05',	COL2: '2023-05-22',	COL3: '2023-05-26' },
  { COL1: '06',	COL2: '2023-06-21',	COL3: '2023-06-27' },
  { COL1: '07',	COL2: '2023-07-18',	COL3: '2023-07-21', COL4: '기성일정 변경(일정 당겨짐)' },
  { COL1: '08',	COL2: '2023-08-18',	COL3: '2023-08-31' },
  { COL1: '09',	COL2: '2023-09-19',	COL3: '2023-09-21' },
  { COL1: '10',	COL2: '2023-10-19',	COL3: '2023-10-25' },
  { COL1: '11',	COL2: '2023-11-20',	COL3: '2023-11-25' },
  { COL1: '12',	COL2: '',	COL3: '' },
]

onMounted(() => {

  grd1.value.getDataProvider().setRows(data1)

})
</script>

<template>
  <div>
    <VContainer
      class="pt-0"
    >
      <VRow>
        <VCol cols="12" md="9">
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
          />
        </VCol>
        <VCol align="right">
          <VBtn v-for="(item, index) in btns" :key="index" class="titleBtn" :prepend-icon="item.icon" >
            {{ item.title }}
          </VBtn>
        </VCol>
      </VRow>

      <VRow>
        <VCol>
          <VForm
            ref="searchArea"
            class="searchArea"
          >
            <VRow>
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('년도')"
                  label-width="50"
                >
                  <template #editor="editorProps">
                    <VTextField
                      type="number"
                      value="2023"
                    />
                  </template>      
                </ILabel>
              </VCol>
            </VRow>
          </VForm>
        </VCol>
      </VRow>

      <VRow>
        <VCol>
          <VTabs v-model="tab">
            <VTab value="one">월별 신청기간관리</VTab>
            <VTab value="one">지원금 신청</VTab>
            <VTab value="one">지원금 접수</VTab>
            <VTab value="one">기성마감</VTab>
          </VTabs>

          <VWindow v-model="tab">
            <VWindowItem value="one">
              <IGridTitle>
                <template #editors />
              </IGridTitle>
              <RealGrid
                ref="grd1"
                class="mt-2"
                style="height: 600px;"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys" 
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
              />
            </VWindowItem>
          </VWindow>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

