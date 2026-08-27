<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'SAFAB0020',
})


const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)
const tab = ref('Dashboard')

const searchParams = {
  input1: '',
  input2: '',
}


//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { checkBar: { visible: true } },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1',  dataType: 'text', header: { text: t('발생일시') } },
    { fieldName: 'COL2',  dataType: 'text', header: { text: t('등록일시') } },
    { fieldName: 'COL3',  dataType: 'text', header: { text: t('재해부서명') } },
    { fieldName: 'COL4',  dataType: 'text', header: { text: t('책임부서명') } },
    { fieldName: 'COL5',  dataType: 'text', header: { text: t('협력사') } },
    { fieldName: 'COL6',  dataType: 'text', header: { text: t('재해자') } },
    { fieldName: 'COL7',  dataType: 'text', header: { text: t('책임') } },
    { fieldName: 'COL8',  dataType: 'text', header: { text: t('사고구분') } },
    { fieldName: 'COL9',  dataType: 'text', header: { text: t('사고형태') } },
    { fieldName: 'COL10', dataType: 'text', header: { text: t('구급차 출동') } },
    { fieldName: 'COL11', dataType: 'text', header: { text: t('경위서 대상') } },
    { fieldName: 'COL12', dataType: 'text', header: { text: t('사고개요') } },
    { fieldName: 'COL13', dataType: 'text', header: { text: t('진행상태') } },
    { fieldName: 'COL14', dataType: 'text', header: { text: t('첨부YN') } },
    { fieldName: 'COL15', dataType: 'text', header: { text: t('작성완료일') } },
    { fieldName: 'COL16', dataType: 'text', header: { text: t('안전확인일') } },
    { fieldName: 'COL17', dataType: 'text', header: { text: t('종결일자') } },
    { fieldName: 'COL18', dataType: 'text', header: { text: t('중대재해') } },
    { fieldName: 'COL19', dataType: 'text', header: { text: t('사고 은폐') } },
    { fieldName: 'COL20', dataType: 'text', header: { text: t('중대성 사고') } },
    { fieldName: 'COL21', dataType: 'text', header: { text: t('통계 제외') } },
    { fieldName: 'COL22', dataType: 'text', header: { text: t('공개 범위') } },
    { fieldName: 'COL23', dataType: 'text', header: { text: t('애매 여부') } },
    { fieldName: 'COL24', dataType: 'text', header: { text: t('SLI 집계 여부') } },
    { fieldName: 'COL25', dataType: 'text', header: { text: t('사고번호') } },
    { fieldName: 'COL26', dataType: 'text', header: { text: t('원 사고번호') } },
    { fieldName: 'COL27', dataType: 'text', header: { text: t('자율인증취소일') } },
  ],
  columns : [],  
})

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { checkBar: { visible: true }, groupPanel : { visible: true } },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1',  dataType: 'text', header: { text: t('사업부') } },
    { fieldName: 'COL2',  dataType: 'text', header: { text: t('부서') } },
    { fieldName: 'COL3',  dataType: 'text', header: { text: t('위험성평가') } },
    { fieldName: 'COL4',  dataType: 'text', header: { text: t('완료') } },
    { fieldName: 'COL5',  dataType: 'text', header: { text: t('대상') } },
    { fieldName: 'COL6',  dataType: 'text', header: { text: t('교육율') } },    
  ],
  columnLayout: [
    'COL1',
    'COL2',
    'COL3',
    {
      name: '교육인원',
      direction: 'horizontal',
      items: [ 'COL4', 'COL5', 'COL6' ],
      header: { text: t('교육인원') },
    },
  ], 
  columns : [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

//그리드 데이터 입력
const data1 = [

  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
  { COL1: '2023-10-20 07:48',	COL2: '2023-10-25 14:57',	COL3: '차세대 ERP 추진부',	COL4: '차세대 ERP 추진부',	COL5: '',	COL6: '강동섭',	COL7: '',	COL8: '출퇴근',	COL9: '출퇴근',	COL10: 'N',	COL11: '',	COL12: '2023-10-20일 금요일 07:48분 경 울산 동구 명덕7길 서광빌딩 앞 도로에서 재해자가 킥보드 이용 출근 중 내리막길에서 미끄러지면서 킥보드 제어 잃고 우측으로 넘어진 사고',	COL13: '작성 중',	COL14: 'Y',	COL15: '',	COL16: '',	COL17: '',	COL18: 'Indeterminate',	COL19: 'Indeterminate',	COL20: 'Indeterminate',	COL21: 'Y',	COL22: '본부',	COL23: 'Indeterminate',	COL24: 'Indeterminate',	COL25: '20231020-03',	COL26: '20231020-03' },
]

const data2 = [
  { COL1: '조선해양사업부',	COL2: '가공소조립1부',	COL3: '',	COL4: '60',	COL5: '60',	COL6: '100%' },
  { COL1: '조선해양사업부',	COL2: '상선설계부',	COL3: '',	COL4: '60',	COL5: '60',	COL6: '100%' },
  { COL1: '조선해양사업부',	COL2: '기본계획부',	COL3: '',	COL4: '45',	COL5: '45',	COL6: '100%' },
  { COL1: '조선해양사업부',	COL2: '자재운영부',	COL3: '',	COL4: '55',	COL5: '55',	COL6: '100%' },
  { COL1: '조선해양사업부',	COL2: '시운전부',	COL3: '',	COL4: '30',	COL5: '30',	COL6: '100%' },
  
]

onMounted(() => {

  grd1.value.getDataProvider().setRows(data1)
  grd2.value.getDataProvider().setRows(data2)

})

const onButtonsClick = () => {

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
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch']"
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
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('조회구분')"
                  label-width="100"
                  :required="true"
                >
                  <template #editor="editorProps">
                    <VAutocomplete
                      :items="['발생기간', '등록기간']"
                      value="발생기간"
                    />
                  </template>      
                </ILabel>
              </VCol>
              <VCol cols="12" md="1">
                <VTextField
                  v-model="searchParams.input1"
                  type="date"
                /> 
              </VCol>              
              <!-- <span align="center"> ~ </span>               -->
              <VCol md="1">
                <VTextField
                  v-model="searchParams.input1"
                  type="date"
                />                
              </VCol>              
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('회사구분')"
                  label-width="100"
                  :required="true"
                >
                  <template #editor="editorProps">
                    <VAutocomplete
                      :items="['HD현대중공업']"
                      value="HD현대중공업"
                    />                    
                  </template>      
                </ILabel>
              </VCol> 
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('사업부')"
                  label-width="100"
                  :required="true"
                >
                  <template #editor="editorProps">
                    <VAutocomplete
                      :items="['조선해양사업부', '특수선사업부', '엔진기계사업부', '경영지원본부']"
                      value="전체"
                    />                    
                  </template>      
                </ILabel>
              </VCol> 
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('재해부서')"
                  label-width="100"
                >
                  <template #editor="editorProps">                    
                    <VTextField 
                      append-inner-icon="mdi-magnify" 
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
          <VRow>
            <VCol cols="12" md="12">
              <IGridTitle :title="$t('사고정보')">
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
          </VRow>
          <VRow>
            <VCol cols="12" md="12">
              <IGridTitle :title="$t('횡전개 현황')">
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
                :column-layout="grdProps2.columnLayout"
              />
            </VCol>
          </VRow>                                  
        </VCol>
      </VRow>           
    </VContainer>
  </div>
</template>
  
