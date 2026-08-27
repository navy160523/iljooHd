<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'MNGEE0040',
})

const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)
const tab = ref('one')

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('항목') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('색상') } },
  ],
  columns : [],
})

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('법규') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('조항') } },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('조문') } },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

//그리드 데이터 입력
const data1 = [
  { COL1: '안전보건관리체제' },
  { COL1: '유해위험방지조치' },
  { COL1: '안전 • 보건 조치' },
  { COL1: '위험기계방호조치' },
  { COL1: '도급재해예방' },
  { COL1: '안전보건교육' },
  { COL1: '위험물/화학 물질 등' },
  { COL1: '유해물질조치' },
  { COL1: '법정' },
]

const data2 = [
  { COL1: '중처법',	COL2: '4',	COL3: '재발방지조치이행' },
  { COL1: '산업안전보건법',	COL2: '16',	COL3: '관리감독자업무' },
  { COL1: '산업안전보건법',	COL2: '24',	COL3: '산업안전보건위원회' },
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
          />
        </VCol>
      </VRow>      
      <!-- 탭 -->
      <VCol>
        <VTabs v-model="tab">
          <VTab value="one">조치 구분</VTab>
          <VTab value="one">위험 구분</VTab>
        </VTabs>

        <VCardText>
          <VWindow v-model="tab">
            <VWindowItem value="one">
              <VRow>
                <VCol cols="12" md="6">
                  <IGridTitle
                    ref="menuTitle"
                    :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
                    @click-button="onButtonsClick"
                  />
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
                    ref="menuTitle"
                    :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
                    @click-button="onButtonsClick"
                  />
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
            </VWindowItem>
            <VWindowItem value="two" />
          </VWindow>
        </VCardText>
      </VCol>
    </VContainer>
  </div>
</template>
  
