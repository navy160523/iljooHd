<!-- SAFIB0010 협력사 안전관리 현황 (협력사용) -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'SAFIA0020',
})


const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)

const btns = reactive([
  { title: "메뉴얼" },
  { title: "저장", icon: "mdi-content-save" },
  { title: "확정", icon: "mdi-check-circle-outline" },
  { title: "확정취소", icon: "mdi-close-circle-outline" },
  { title: "X" },
  { title: "첨부", icon: "mdi-attachment" },
])



//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('구분') }  },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('세부내용') } },
    { fieldName: 'COL3', dataType: 'boolean', width: '10', header: { text: t('Y') }, renderer: { type: "check" } },
    { fieldName: 'COL4', dataType: 'boolean', width: '10', header: { text: t('N') }, renderer: { type: "check" }  },
  ],
  columns : [],
})

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', width: '120', header: { text: t('항목') }  },
    { fieldName: 'COL2', dataType: 'boolean', width: '10', header: { text: t('Y') }, renderer: { type: "check" } },
    { fieldName: 'COL3', dataType: 'boolean', width: '10', header: { text: t('N') }, renderer: { type: "check" } },
    { fieldName: 'COL4', dataType: 'text', width: '30', header: { text: t('첨부') }, renderer: { type: "button" }, button: "action", buttonVisibility: "always" },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

//그리드 데이터 입력
const data1 = [
  { COL1: '안전보건 경영시스템',	COL2: '안전보건환경방침',	COL3: 'T',	COL4: 'F' },
  { COL1: '안전보건 경영시스템',	COL2: '안전보건환경 목표 및 중점추진사항',	COL3: 'T',	COL4: 'F' },
  { COL1: '안전보건 경영시스템',	COL2: '안전보건환경 중점 추진 계획서',	COL3: 'T',	COL4: 'F' },
  { COL1: '안전보건 경영시스템',	COL2: '안전보건환경 추진실적 HiSEs 등록 유무 확인',	COL3: 'T',	COL4: 'F' },
]

const data2 = [
  { COL1: '위험성평가 인정사업장',	COL2: 'T',	COL3: 'F',	COL4: '' },
  { COL1: 'ISO 45001, KOSHA 등 안전경영시스템 인증',	COL2: 'T',	COL3: 'F',	COL4: '' },
]

onMounted(() => {

  grd1.value.getDataProvider().setRows(data1)
  grd2.value.getDataProvider().setRows(data2)

})
</script>

<template>
  <div>
    <VContainer
      class="pt-0"
    >
      <VRow>
        <VCol cols="12" md="3">
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
        <VCol cols="12" md="12">
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
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          value="2024"
                          type="Number"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('분기')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete
                          :items="['1분기','2분기','3분기','4분기']"
                          value="1분기"
                        />
                      </template>      
                    </ILabel>
                  </VCol> 
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('대상')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          value="시온기업"
                        />
                      </template>      
                    </ILabel>
                  </VCol> 
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('협력사 대표 안전활동 건수')"
                      label-width="190"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete
                          :items="['0','1','2','3','4','5']"
                          value="5"
                        />
                      </template>      
                    </ILabel>
                  </VCol> 
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('법적 서류 및 인증 총점')"
                      label-width="150"
                    >
                      <template #editor="editorProps">
                        <VTextField
                          type="text"
                          value="1.5"
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
              <VRow>
                <VCol cols="12" md="10">
                  <IGridTitle :title="$t('법적서류')">
                    <template #editors />
                  </IGridTitle>
                </VCol>
                <VCol cols="12" md="1">
                  <VTextField
                    type="text"
                    value="0"
                  />
                </VCol>
                <VCol cols="12" md="1">
                  <h6>점</h6>
                </VCol>
              </VRow>
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
              <VRow>
                <VCol cols="12" md="10">
                  <IGridTitle :title="$t('인증평가')">
                    <template #editors />
                  </IGridTitle>
                </VCol>
                <VCol cols="12" md="1">
                  <VTextField
                    type="text"
                    value="1.5"
                  />
                </VCol>
                <VCol cols="12" md="1">
                  <h6>점</h6>
                </VCol>
              </VRow>
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
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
  
