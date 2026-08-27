<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'EDUAB0010',
})


const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('교육명') } , },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('주관부서') } , },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('담당자') } , },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('대상인원') } , },
    { fieldName: 'COL5', dataType: 'text', header: { text: t('이수인원') } , },
    { fieldName: 'COL6', dataType: 'text', header: { text: t('이수율') } , },
    { fieldName: 'COL7', dataType: 'text', header: { text: t('증빙서류') } , },
    { fieldName: 'COL8', dataType: 'text', header: { text: t('SLI 감점대상') } , },
  ],
  columns : [],
})

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('교육기간') } , },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('장소') } , },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('강사') } , },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('대상인원') } , },
    { fieldName: 'COL5', dataType: 'text', header: { text: t('이수인원') } , },
    { fieldName: 'COL6', dataType: 'text', header: { text: t('이수율') } , },
    { fieldName: 'COL7', dataType: 'text', header: { text: t('증빙서류') } , },
    { fieldName: 'COL8', dataType: 'text', header: { text: t('SLI 감점대상') } , },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields

//그리드 데이터 입력
const data1 = [
    { COL1: '신규채용자 안전보건교육(단기공사-생산부서)',	COL2: '현업부서 기장1과',	COL3: '우인제',	COL4: '1',	COL5: '1',	COL6: '100%',	COL7: '1',	COL8: '', },
    { COL1: '신규채용자 안전보건교육(단기공사-생산부서)',	COL2: '현업부서 선장과',	COL3: '조해찬',	COL4: '14',	COL5: '14',	COL6: '100%',	COL7: '0',	COL8: '', },
    { COL1: '신규채용자 안전보건교육(단기공사-생산부서)',	COL2: '현업부서 선장과',	COL3: '김성민',	COL4: '2',	COL5: '2',	COL6: '100%',	COL7: '1',	COL8: '', },
    { COL1: '신규채용자 안전보건교육(단기공사-생산부서)',	COL2: '현업부서 선장과',	COL3: '최규용',	COL4: '2',	COL5: '0',	COL6: '0%',	COL7: '0',	COL8: '', },
    { COL1: '신규채용자 안전보건교육(단기공사-생산부서)',	COL2: '현업부서 전장과',	COL3: '김리규',	COL4: '5',	COL5: '5',	COL6: '100%',	COL7: '4',	COL8: '', },
    { COL1: '영상안전보건교육(정기안전보건교육)',	COL2: '현업부서 안전운영과',	COL3: '하보람',	COL4: '76',	COL5: '58',	COL6: '76.3%',	COL7: '0',	COL8: '', },
    { COL1: '영상안전보건교육(정기안전보건교육)',	COL2: '협력사 (주)시온산업',	COL3: '(주)시온산업(H도크의장부)',	COL4: '27',	COL5: '24',	COL6: '88.9%',	COL7: '0',	COL8: '', },
    { COL1: '영상안전보건교육(정기안전보건교육)',	COL2: '협력사 (주)영신이앤지',	COL3: '(주)영신이앤지(H도크의장부)',	COL4: '74',	COL5: '72',	COL6: '97.3%',	COL7: '1',	COL8: '', },
    { COL1: '영상안전보건교육(정기안전보건교육)',	COL2: '협력사 (주)준동테크',	COL3: '(주)준동테크(H도크의장부)',	COL4: '76',	COL5: '76',	COL6: '100%',	COL7: '0',	COL8: '', },
]

const data2 = [
    { COL1: '2023-10-19~2023-10-19',	COL2: '부서회의실',	COL3: '홍동국',	COL4: '3',	COL5: '3',	COL6: '100',	COL7: '0', },
    { COL1: '2023-10-25~2023-10-25',	COL2: '부서회의실',	COL3: '홍동국',	COL4: '6',	COL5: '6',	COL6: '100',	COL7: '0', },
    { COL1: '2023-10-30~2023-10-30',	COL2: '부서회의실',	COL3: '홍동국',	COL4: '2',	COL5: '2',	COL6: '100',	COL7: '0', },
    { COL1: '2023-11-01~2023-11-01',	COL2: '부서회의실',	COL3: '홍동국',	COL4: '2',	COL5: '2',	COL6: '100',	COL7: '0', },
    { COL1: '2023-11-02~2023-11-02',	COL2: '부서회의실',	COL3: '홍동국',	COL4: '1',	COL5: '1',	COL6: '100',	COL7: '0', },
]

onMounted(() => {
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
              <VCol cols="2">  
                <ILabel
                  :label="$t('기간')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VTextField
                      type="Date"
                    />
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="2">  
                <ILabel
                :label="$t('~')"
                  label-width="60"
                >
                  <template #editor="editorProps">
                    <VTextField
                      type="Date"
                    />
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="2">
                <ILabel
                  :label="$t('사업부')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VAutocomplete
                      :items="['전체', 'DT혁신', '영업본부']"
                    />
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="3">
                <ILabel
                  :label="$t('부서/ 협력사')"
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

    </VContainer>
  </div>
</template>
  
