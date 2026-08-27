<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'


const emit = defineEmits(['selected'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)

const searchParams = reactive({
  KOR_NM: null
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: {  visible: true }, stateBar: { visible: false }, edit: { editable: false }, },
  keys : [],
  fields : [ 
    { fieldName: 'EMP_NO', dataType: 'text', width: '100', header: { text: t('사번') } },
    { fieldName: 'KOR_NM', dataType: 'text', width: '100', header: { text: t('이름') } },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width: '100', header: { text: t('직책') } },
    { fieldName: 'BSNS_NM', dataType: 'text', width: '150', header: { text: t('사업부') } },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '150', header: { text: t('부서') } },

    { fieldName: 'EMAIL', dataType: 'text', width: '150', header: { text: t('이메일') },visible: false },
    { fieldName: 'HND_PHN', dataType: 'text', width: '150', header: { text: t('번호') },visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', width: '150', header: { text: t('BSNS_CD') },visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', width: '150', header: { text: t('DEPT_CD') },visible: false },
    
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = val => {
  searchParams.KOR_NM = val
  dialog.value = true

  onButtonsClick({id: 'btnSearch'})
}

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()  
  }else if(btn.id === 'btnSelect'){
    let chkRow = await grdMain.value.getGridView().getCheckedRows(true)
    if(chkRow.length === 0){
      Message.warn('체크된 데이터가 없습니다.')
      return
    }else if (chkRow.length > 1){
      Message.warn('한명만 선택 가능합니다.')
      return
    }

    let checkedData = await grdMain.value.getDataProvider().getJsonRow(chkRow[0])

    emit('selected', checkedData)
    onClose()
  }else {
    onClose()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SAFJA0060_SEARCH_04', param: searchParams})
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onSelect = () => {
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  emit('selected', rtnData)
  onClose()
}

const onClose = () => {
  dialog.value = false
  emit("closed")
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="850"
    height="500"
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
      <span>안전 검토자 조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <i-input
              v-model="searchParams.KOR_NM"
              :label="$t('이름')"
              width="200px"
              label-width="40px" 
            />
          </v-sheet>
          <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked="onSelect"
          />
        </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>