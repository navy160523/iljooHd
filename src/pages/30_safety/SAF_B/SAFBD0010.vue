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
import SAFBD0010tab1 from '@/pages/30_safety/SAF_B/SAFBD0010tab1.vue'
import SAFBD0010tab2 from '@/pages/30_safety/SAF_B/SAFBD0010tab2.vue'
defineOptions({
  name:'MNGCC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const tab = ref('안전')

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 } },
  keys : ['YEAR','INSERT_DATE','INSERT_EMP_NM','CNFM_DATE'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('선임구분') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('사업장') } },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('분야') } },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('법적선임 인원(명)') } },
    { fieldName: 'COL5', dataType: 'text', header: { text: t('교육 주기:년') } },
    { fieldName: 'COL6', dataType: 'text', header: { text: t('법적선임자격') } },
    { fieldName: 'COL7', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'COL8', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'COL9', dataType: 'text', header: { text: t('부서명') } },
    { fieldName: 'COL10', dataType: 'text', header: { text: t('입사일') } },
    { fieldName: 'COL11', dataType: 'text', header: { text: t('선임일') } },
    { fieldName: 'COL12', dataType: 'text', header: { text: t('해임일') } },
    { fieldName: 'COL13', dataType: 'text', header: { text: t('선임장') } },
    { fieldName: 'COL14', dataType: 'text', header: { text: t('경력자 여부') } },
    { fieldName: 'COL15', dataType: 'text', header: { text: t('자격구분') } },
    { fieldName: 'COL16', dataType: 'text', header: { text: t('자격 증명') } },
    { fieldName: 'COL17', dataType: 'text', header: { text: t('자격수당 지급여부') } },
    { fieldName: 'COL18', dataType: 'text', header: { text: t('수당금액(원)') } },
    { fieldName: 'COL19', dataType: 'text', header: { text: t('구분') } },
    { fieldName: 'COL20', dataType: 'text', header: { text: t('이수일') } },
    { fieldName: 'COL21', dataType: 'text', header: { text: t('대상물 (장소)') } },
    { fieldName: 'COL22', dataType: 'text', header: { text: t('시설명') } },
    { fieldName: 'COL23', dataType: 'text', header: { text: t('사내관리No.') } },
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
      <!-- tab -->
      <VTabs v-model="tab">
        <VTab value="GIS 장소맵핑">{{$t('GIS 장소맵핑')}}</VTab>
        <VTab value="호선블록구획정보">{{$t('호선블록구획정보')}}</VTab>
 
      </VTabs>
      <VWindow v-model="tab">
        <VWindowItem value="GIS 장소맵핑">
          <!-- 조회조건 -->
       <SAFBD0010tab1 />
        </VWindowItem>
       <VWindowItem value="호선블록구획정보"> 
        <SAFBD0010tab2 />
      </VWindowItem>
      </VWindow>
    </VContainer>
  </div>
</template>
  
