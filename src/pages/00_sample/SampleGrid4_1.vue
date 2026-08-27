<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'SAMPLE_GRID4_1',
})

const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const grd2 = ref(null)
const grd3 = ref(null)

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', width: '120', header: { text: t('COL1') }  },
    { fieldName: 'COL2', dataType: 'text', width: '120', header: { text: t('COL2') } },
    { fieldName: 'COL3', dataType: 'text', width: '120', header: { text: t('COL3') } },
    { fieldName: 'COL4', dataType: 'text', width: '120', header: { text: t('COL4') } },
  ],
  columns : [],
})

//그리드2 속성셋팅
const grdProps2 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', width: '120', header: { text: t('COL1') }  },
    { fieldName: 'COL2', dataType: 'text', width: '120', header: { text: t('COL2') } },
    { fieldName: 'COL3', dataType: 'text', width: '120', header: { text: t('COL3') } },
    { fieldName: 'COL4', dataType: 'text', width: '120', header: { text: t('COL4') } },
  ],
  columns : [],
})

//그리드3 속성셋팅
const grdProps3 = reactive({
  gridViewOption : { },
  keys : ['COL1','COL2','COL3','COL4'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', width: '120', header: { text: t('COL1') }  },
    { fieldName: 'COL2', dataType: 'text', width: '120', header: { text: t('COL2') } },
    { fieldName: 'COL3', dataType: 'text', width: '120', header: { text: t('COL3') } },
    { fieldName: 'COL4', dataType: 'text', width: '120', header: { text: t('COL4') } },
  ],
  columns : [],
})

grdProps1.columns = grdProps1.fields
grdProps2.columns = grdProps2.fields
grdProps3.columns = grdProps3.fields

//그리드 데이터 입력
const data1 = [
  { COL1: '사외',	COL2: '박성권',	COL3: '미래산업인재교육원',	COL4: '실장',	COL5: '',	COL6: 'sk8216@hanmail.net',	COL7: '모든 교육' },
  { COL1: '사외',	COL2: '김선일',	COL3: '미래산업인재교육원',	COL4: '강사',	COL5: '',	COL6: '',	COL7: '소통/대화기법, 위험성평가, 안전코칭' },
  { COL1: '사내',	COL2: '이길종',	COL3: '조선해양사업부-성능평가연구실-실선성능팀',	COL4: '책임연구원',	COL5: '2-5536',	COL6: 'autoship@hd.com',	COL7: '사내 안전교육' },
  { COL1: '사내',	COL2: '황태원',	COL3: '조선해양사업부-H도크도장부-도장1과',	COL4: '책임매니저',	COL5: '3-1206',	COL6: 'taepal0921@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '김상준',	COL3: '조선해양사업부-도장2부-도장3과',	COL4: '책임매니저',	COL5: '2-6483',	COL6: 'A444456@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '김영철',	COL3: '조선해양사업부-도장1부-안전운영과',	COL4: '책임매니저',	COL5: '2-3156',	COL6: 'yck@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '곽승훈',	COL3: '조선해양사업부-도장1부-안전운영과',	COL4: '선임매니저',	COL5: '2-4463',	COL6: 'shgwak7517@hd.com',	COL7: '도장직무 안전교육, 사고사례, 절대수칙/안전수칙 교육 등' },
  { COL1: '사내',	COL2: '박상진',	COL3: '조선해양사업부-도장2부-도장1과-수석2팀',	COL4: '기장',	COL5: '2-6489',	COL6: '9604361@hd.com',	COL7: '법정안전교육, 안전사고사례, 기타 안전교육 등' },
  { COL1: '사내',	COL2: '박충일',	COL3: '조선해양사업부-도장1부-도장6과-수석2팀',	COL4: '기장',	COL5: '2-6490',	COL6: '2203359@hd.com',	COL7: '법정안전교육, 안전사고사례, 기타 안전교육 등' },
]

const data2 = [
  { COL1: '사외',	COL2: '박성권',	COL3: '미래산업인재교육원',	COL4: '실장',	COL5: '',	COL6: 'sk8216@hanmail.net',	COL7: '모든 교육' },
  { COL1: '사외',	COL2: '김선일',	COL3: '미래산업인재교육원',	COL4: '강사',	COL5: '',	COL6: '',	COL7: '소통/대화기법, 위험성평가, 안전코칭' },
  { COL1: '사내',	COL2: '이길종',	COL3: '조선해양사업부-성능평가연구실-실선성능팀',	COL4: '책임연구원',	COL5: '2-5536',	COL6: 'autoship@hd.com',	COL7: '사내 안전교육' },
  { COL1: '사내',	COL2: '황태원',	COL3: '조선해양사업부-H도크도장부-도장1과',	COL4: '책임매니저',	COL5: '3-1206',	COL6: 'taepal0921@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '김상준',	COL3: '조선해양사업부-도장2부-도장3과',	COL4: '책임매니저',	COL5: '2-6483',	COL6: 'A444456@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '김영철',	COL3: '조선해양사업부-도장1부-안전운영과',	COL4: '책임매니저',	COL5: '2-3156',	COL6: 'yck@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '곽승훈',	COL3: '조선해양사업부-도장1부-안전운영과',	COL4: '선임매니저',	COL5: '2-4463',	COL6: 'shgwak7517@hd.com',	COL7: '도장직무 안전교육, 사고사례, 절대수칙/안전수칙 교육 등' },
  { COL1: '사내',	COL2: '박상진',	COL3: '조선해양사업부-도장2부-도장1과-수석2팀',	COL4: '기장',	COL5: '2-6489',	COL6: '9604361@hd.com',	COL7: '법정안전교육, 안전사고사례, 기타 안전교육 등' },
  { COL1: '사내',	COL2: '박충일',	COL3: '조선해양사업부-도장1부-도장6과-수석2팀',	COL4: '기장',	COL5: '2-6490',	COL6: '2203359@hd.com',	COL7: '법정안전교육, 안전사고사례, 기타 안전교육 등' },
]

const data3 = [
  { COL1: '사외',	COL2: '박성권',	COL3: '미래산업인재교육원',	COL4: '실장',	COL5: '',	COL6: 'sk8216@hanmail.net',	COL7: '모든 교육' },
  { COL1: '사외',	COL2: '김선일',	COL3: '미래산업인재교육원',	COL4: '강사',	COL5: '',	COL6: '',	COL7: '소통/대화기법, 위험성평가, 안전코칭' },
  { COL1: '사내',	COL2: '이길종',	COL3: '조선해양사업부-성능평가연구실-실선성능팀',	COL4: '책임연구원',	COL5: '2-5536',	COL6: 'autoship@hd.com',	COL7: '사내 안전교육' },
  { COL1: '사내',	COL2: '황태원',	COL3: '조선해양사업부-H도크도장부-도장1과',	COL4: '책임매니저',	COL5: '3-1206',	COL6: 'taepal0921@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '김상준',	COL3: '조선해양사업부-도장2부-도장3과',	COL4: '책임매니저',	COL5: '2-6483',	COL6: 'A444456@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '김영철',	COL3: '조선해양사업부-도장1부-안전운영과',	COL4: '책임매니저',	COL5: '2-3156',	COL6: 'yck@hd.com',	COL7: '전문집합교육, 법정안전교육, 도장직무교육 ' },
  { COL1: '사내',	COL2: '곽승훈',	COL3: '조선해양사업부-도장1부-안전운영과',	COL4: '선임매니저',	COL5: '2-4463',	COL6: 'shgwak7517@hd.com',	COL7: '도장직무 안전교육, 사고사례, 절대수칙/안전수칙 교육 등' },
  { COL1: '사내',	COL2: '박상진',	COL3: '조선해양사업부-도장2부-도장1과-수석2팀',	COL4: '기장',	COL5: '2-6489',	COL6: '9604361@hd.com',	COL7: '법정안전교육, 안전사고사례, 기타 안전교육 등' },
  { COL1: '사내',	COL2: '박충일',	COL3: '조선해양사업부-도장1부-도장6과-수석2팀',	COL4: '기장',	COL5: '2-6490',	COL6: '2203359@hd.com',	COL7: '법정안전교육, 안전사고사례, 기타 안전교육 등' },
]

onMounted(() => {

  grd1.value.getDataProvider().setRows(data1)
  grd2.value.getDataProvider().setRows(data2)
  grd3.value.getDataProvider().setRows(data3)

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
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('년도')"
                  label-width="50"
                >
                  <template #editor="editorProps">
                    <VTextField
                      type="Number"
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
      <VRow>
        <VCol cols="12" md="6">
          <IGridTitle :title="$t('GRID 1')">
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
        <VCol cols="12" md="6">
          <IGridTitle :title="$t('GRID 2')">
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
          />
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12" md="6">
          <IGridTitle :title="$t('GRID 3')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grd3"
            class="mt-2"
            style="height: 320px;"
            :grid-view-option="grdProps3.gridViewOption"
            :keys="grdProps3.keys" 
            :fields="grdProps3.fields"
            :columns="grdProps3.columns"
          />
        </VCol>
        <VCol cols="12" md="6">
          <VRow>
            <VCol cols="12">
              <IGridTitle :title="$t('상세')">
                <template #editors />
              </IGridTitle>
            </VCol>
          </VRow>
          <VRow>
            <VCol cols="12" md="12">
              <ILabel
                :label="$t('TEXT 1')"
                label-width="100"
              >
                <template #editor="editorProps">
                  <VTextField
                    label="TEXT 1"
                  />
                </template>      
              </ILabel>
            </VCol>
            <VCol cols="12" md="12">
              <ILabel
                :label="$t('TEXT 2')"
                label-width="100"
              >
                <template #editor="editorProps">
                  <VTextField
                    label="TEXT 2"
                  />
                </template>      
              </ILabel>
            </VCol>
            <VCol cols="12" md="12">
              <ILabel
                :label="$t('TEXT 3')"
                label-width="100"
              >
                <template #editor="editorProps">
                  <VTextField
                    label="TEXT 3"
                  />
                </template>      
              </ILabel>
            </VCol>
            <VCol cols="12" md="12">
              <VRow>
                <VCol cols="12" md="6">
                  <ILabel
                    :label="$t('TEXT 4')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        label="TEXT 4"
                      />
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="12" md="6">
                  <ILabel
                    :label="$t('TEXT 5')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        label="TEXT 5"
                      />
                    </template>      
                  </ILabel>
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12" md="12">
              <VRow>
                <VCol cols="12" md="6">
                  <ILabel
                    :label="$t('TEXT 6')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        label="TEXT 6"
                      />
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="12" md="6">
                  <ILabel
                    :label="$t('TEXT 7')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        label="TEXT 7"
                      />
                    </template>      
                  </ILabel>
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12" md="12">
              <VRow>
                <VCol cols="12" md="6">
                  <ILabel
                    :label="$t('TEXT 8')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        label="TEXT 8"
                      />
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="12" md="6">
                  <ILabel
                    :label="$t('TEXT 9')"
                    label-width="100"
                  >
                    <template #editor="editorProps">
                      <VTextField
                        label="TEXT 5"
                      />
                    </template>      
                  </ILabel>
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
  
