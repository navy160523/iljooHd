<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'SAFAG0070',
})

const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)

const searchParams = {
  input1: '',
  input2: '',
}


//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', width: '120', header: { text: t('적용시작일') }  },
    { fieldName: 'COL2', dataType: 'text', width: '120', header: { text: t('적용종료일') } },
    { fieldName: 'COL3', dataType: 'text', width: '120', header: { text: t('비고') } },
  ],
  columns : [],
})

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', width: '120', header: { text: t('등급') }  },
    { fieldName: 'COL2', dataType: 'text', width: '120', header: { text: t('금액') } },
    { fieldName: 'COL3', dataType: 'text', width: '120', header: { text: t('비고') } },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

//그리드 데이터 입력
const data1 = [
  { COL1: '2023-10-10',	COL2: '2023-12-31',	COL3: 'test data'},
  { COL1: '2023-09-07',	COL2: '2023-09-25',	COL3: '' },
  { COL1: '2023-05-15',	COL2: '2023-08-27',	COL3: '' },  
]

const data2 = [
  { COL1: '2등급',	COL2: '10,000,000',	COL3: 'test data'},
  { COL1: '1등급',	COL2: '10,000,000',	COL3: '' },
  { COL1: '4등급',	COL2: '10,000,000',	COL3: '' },
  
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
                  :label="$t('회사')"
                  label-width="70"
                >
                  <template #editor="editorProps">
                    <VAutocomplete 
                      :items="['HD현대중공업']"
                      value="HD현대중공업"
                    />
                  </template>      
                </ILabel>
              </VCol>              
              <VCol cols="2">  
                <ILabel
                  :label="$t('적용일자')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.input1"
                      type="date"
                    />
                  </template>      
                </ILabel>
              </VCol>
              <VCol cols="2">  
                <ILabel
                  :label="$t('~')"
                  label-width="40"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.input1"
                      type="date"
                    />
                  </template>      
                </ILabel>
              </VCol>               
            </VRow>
          </VForm>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12" md="6">
          <IGridTitle
            :button-list="['btnCreate', 'btnUpdate', 'btnDelete']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grd1"
            class="mt-2"
            style="height: 650px;"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys" 
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
          />
        </VCol>
        <VCol cols="12" md="6">
          <IGridTitle
            :button-list="['btnUpdate']"
            @click-button="onButtonsClick"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grd2"
            class="mt-2"
            style="height: 650px;"
            :grid-view-option="grdProps2.gridViewOption"
            :keys="grdProps2.keys" 
            :fields="grdProps2.fields"
            :columns="grdProps2.columns"
          />
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
  
