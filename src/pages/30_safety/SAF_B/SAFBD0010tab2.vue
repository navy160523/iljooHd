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

defineOptions({
  name:'MNGCC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 } },
  keys : ['YEAR','INSERT_DATE','INSERT_EMP_NM','CNFM_DATE'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('호선번호') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('구획번호') } },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('구획명') } },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('블록번호') } },
    { fieldName: 'COL5', dataType: 'text', header: { text: t('밀폐여부') } },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 데이터 입력
const data = [
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '정일포',	COL8: 'A374628',	COL9: '조선안전부',	COL10: '2019-06-01',	COL11: '2016-12-13',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '류희진',	COL8: 'A400726',	COL9: '경영지원본부',	COL10: '2019-06-01',	COL11: '2012-01-11',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '서현수',	COL8: 'A419303',	COL9: '안전경영부',	COL10: '2019-06-01',	COL11: '2019-01-03',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '홍진혁',	COL8: 'A440736',	COL9: '안전경영부',	COL10: '2019-06-01',	COL11: '2016-02-22',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '곽정훈',	COL8: 'A465003',	COL9: '엔진기계안전부',	COL10: '2019-06-01',	COL11: '2018-02-14',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '기학연',	COL8: 'A465070',	COL9: '해양안전부',	COL10: '2019-06-01',	COL11: '2018-01-03',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '이승우',	COL8: 'A465089',	COL9: '안전보건지원부',	COL10: '2019-06-01',	COL11: '2018-02-14',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
  { COL1: '안전관리자',	COL2: '본공장',	COL3: ' ',	COL4: '1',	COL5: '2',	COL6: '산업안전기사',	COL7: '조용준',	COL8: 'A467561',	COL9: '안전보건지원부',	COL10: '2019-06-01',	COL11: '2018-05-11',	COL12: '',	COL13: '',	COL14: 'Unchecked',	COL15: '산업안전기사',	COL16: '',	COL17: 'Checked',	COL18: '25,000' },
]

onMounted(() => {
  grdMain.value.getDataProvider().setRows(data)
})

//메뉴버튼
const onButtonsClick = btn => {

}
</script>

<template>
  <div>
    <VContainer
      class="pt-0">
  
     
          <!-- 조회조건 -->
          <VRow no-gutters>
            <VCol>
              <VForm
                ref="searchArea"
                class="searchArea"
              >
                <VRow>
                  <VCol cols="12" md="3">
                    <ILabel
                      :label="$t('호선')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete 
                          :items="['안전관리자','보건관리자','소방관리자','소방보조자','위험물관리자','환경기술인']"
                          multiple
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="3">
                    <ILabel
                      :label="$t('구획')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete 
                          :items="['본공장','해양공장']"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
             
                </VRow>
              </VForm>
            </VCol>
          </VRow>
          <!-- 메인그리드 -->
          <VRow no-gutters>
            <VCol>
              <RealGrid
                ref="grdMain"
                class="mt-2"
                style="height: calc(100vh - 410px);"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </VCol>
          </VRow>
      </VContainer>
  </div>
</template>
  
