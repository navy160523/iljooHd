<script setup>
const props = defineProps({
  sysCodeList: {
    Type : Array,
    default: [],
  },
}) 

import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import IMenuTitle from "@/components/IMenuTitle.vue"
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdPop = ref(null)
const dialog = ref(false)

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  SONIM_DIV: [],
  HAEIM_YN: 'Y',
  FCTR_DIV: '',
})

//그리드 속성셋팅
const grdPopProps = reactive({
  gridViewOption : { header: { height: 60 }, checkBar: {  visible: false }, footer: { visible: false }, edit: { editable:false }  },
  keys : ['SONIM_DIV', 'FCTR_DIV','EMP_NM'],
  fields : [ 
    { fieldName: 'SONIM_DIV', dataType: 'text', header: { text: t('선임구분') }, width:'200',lookupDisplay: true, editable: false },
    { fieldName: 'FCTR_DIV', dataType: 'text', header: { text: t('사업장') }, width:'150', lookupDisplay: true, editable: false },
    { fieldName: 'SONIM_LOC', dataType: 'text', header: { text: t('선임지역') }, width:'200' },
    { fieldName: 'DIV_CD', dataType: 'text', width:'120', header: { text: t('분야') },lookupDisplay: true, editable: false },
    { fieldName: 'SONIM_INWON', dataType: 'text', header: { text: t('법적선임 인원(명)') }, width:'120', editable: false },
    { fieldName: 'SONIM_JAGYEC', dataType: 'text', header: { text: t('법적선임자격') }, width:'150', styleName: 'left-column', editable: false },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명') }, width:'120', editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, width:'120', editable: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, width:'200', styleName: 'left-column', editable: false, lookupDisplay: true },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') }, width:'200', styleName: 'left-column', editable: false },

    { fieldName: 'COM_ENT_DATE', dataType: 'text', header: { text: t('입사일') }, width:'120', editable: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', header: { text: t('퇴사일') }, width:'120', editable: false },
    { fieldName: 'SONIM_DATE', dataType: 'text','displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}, 
      width:'120', header: { text: t('선임일') }, width:'120', editable: false },
    { fieldName: 'HAEIM_DATE', dataType: 'text','displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null},
      width:'120', header: { text: t('해임일') }, width:'120', editable: false },
    { fieldName: 'DEC_DATE', dataType: 'text','displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}, 
      width:'120', header: { text: t('신고일자') }, width:'120', editable: false },
    { fieldName: 'JAGYEC_DIV', dataType: 'text', header: { text: t('자격구분') }, width:'150', styleName: 'left-column' },
    { fieldName: 'EDU_DIV', dataType: 'text', header: { text: t('구분') }, width:'80', editable: false },
    { fieldName: 'EDU_INS', dataType: 'text', header: { text: t('교육기관') }, width:'150' },
    { fieldName: 'NEW_EDU_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width:'120', header: { text: t('신규') },
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'RE_EDU_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width:'120', header: { text: t('보수') },
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true } } },
    { fieldName: 'EDU_DATE', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width:'120', header: { text: t('이수일') }, editable: false },
    { fieldName: 'EDU_TERM', dataType: 'text', header: { text: t('교육주기(년)') }, width:'120', editable: false },
    { fieldName: 'EQP_LOC', dataType: 'text', header: { text: t('대상물 (장소)') }, width:'150', styleName: 'left-column', editable: false },
    { fieldName: 'EQP_NM', dataType: 'text', header: { text: t('시설명') }, width:'150', styleName: 'left-column', editable: false },
    { fieldName: 'EQP_MGT_NO', dataType: 'text', header: { text: t('사내관리 NO.') }, width:'120', editable: false },

  ],
  columns : [],
  columnLayout: [
    'SONIM_DIV','FCTR_DIV','SONIM_LOC','DIV_CD','SONIM_INWON','SONIM_JAGYEC','EMP_NM','EMP_NO','BSNS_CD','DEPT_NM',
    'COM_ENT_DATE','RETI_TMP_DATE','SONIM_DATE','HAEIM_DATE',
    {
      name: '선해임신고',
      direction: 'horizontal',
      items: [ 'DEC_DATE' ],
      header: { text: t('선해임신고') },
    },
    ,'JAGYEC_DIV',
    {
      name: '법정교육/이수일',
      direction: 'horizontal',
      items: [ 'EDU_DIV', 'EDU_INS','NEW_EDU_DATE','RE_EDU_DATE', 'EDU_DATE','EDU_TERM' ],
      header: { text: t('법정교육/이수일') },
    },
    ,'EQP_LOC',
    {
      name: '제조소',
      direction: 'horizontal',
      items: [ 'EQP_NM', 'EQP_MGT_NO'],
      header: { text: t('제조소') },
    },
  ],
})

grdPopProps.columns = grdPopProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnClose'){
    dialog.value = false
  }
}

const openPopup = async value => {
  grdPop.value.getDataProvider().setRows([])
  dialog.value = true

  searchParams.SONIM_DIV = [value.SONIM_DIV]
  searchParams.FCTR_DIV = value.FCTR_DIV

  getSearch()

  grdPop.value.setBindingColumn("FCTR_DIV", props.sysCodeList.HHA04, "COD", "TXT")
  grdPop.value.setBindingColumn("DIV_CD", props.sysCodeList.BUNYA, "COD", "TXT")
  grdPop.value.setBindingColumn("BSNS_CD", props.sysCodeList.BSNS_CDList, "BSNS_CD", "BSNS_NM")
  grdPop.value.setBindingColumn("SONIM_DIV", props.sysCodeList.HHIZ110, "COD", "TXT")


}

const getSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdPop])
    .setQuery(searchData) 
    .setAfter(afterSearch)
    .run()
}

const searchData = () => {
  return commonSearchApi({ queryId : 'MNGCC0010_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  let data = res.ORESULT_CUR

  data.forEach(e => {
    e.COM_ENT_DATE = e.COM_ENT_DATE ? dayjs(e.COM_ENT_DATE).format('YYYY-MM-DD') : null
    e.RETI_TMP_DATE = e.RETI_TMP_DATE ? dayjs(e.RETI_TMP_DATE).format('YYYY-MM-DD') : null
    e.NEW_EDU_DATE = e.NEW_EDU_DATE ? dayjs(e.NEW_EDU_DATE).format('YYYY-MM-DD') : null
    e.RE_EDU_DATE = e.RE_EDU_DATE ? dayjs(e.RE_EDU_DATE).format('YYYY-MM-DD') : null
    e.EDU_DATE = e.EDU_DATE ? dayjs(e.EDU_DATE).format('YYYY-MM-DD') : null
  })
  
  grdPop.value.getDataProvider().setRows(data)
}

onMounted(() => {
  // initCodeList()
})

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    width="1350"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>법정선임자 이력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle 
          :title="$t('법정선임자 리스트')"
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">  
          <v-sheet class="mb-2 h-auto">
            <RealGrid
              ref="grdPop"
              :grid-view-option="grdPopProps.gridViewOption"
              :keys="grdPopProps.keys" 
              :fields="grdPopProps.fields"
              :columns="grdPopProps.columns"
              :column-layout="grdPopProps.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }
  .btn {
    height: 50px !important;
  }
.content-area {
  position: relative;
  height: calc(100vh - 350px);
  overflow-y: auto;
  > div {
    min-height: 500px;
  }
}
</style>
