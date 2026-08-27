<!--
  화면명 : 작업환경측정 결과관리 알림
  화면개요 : 결과관리 업로드 중 문제 있는 행들에 대해서 알림창을 띄운다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const content = ref('')


//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: true }, header: { height: 75 }},
  keys : [],
  fields : [ 
    { fieldName: 'NO', width: '100', dataType: 'text', header: { text: t('순서') } },
    { fieldName: 'CONTENT', width: '300', dataType: 'text', header: { text: t('에러사항') } },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

const openPopup = (str, dataCnt) => {
  if(isEmpty(str)) {
    content.value = `모든 데이터들이 정상입니다. 총: ${dataCnt} 건`
  } else {
    content.value = `총: ${dataCnt} 건 중 ${str.length}건에서 문제가 발생되었습니다.\n`
    grdMain.value.getDataProvider().setRows(str)
  }
  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnChk') {
    closePopup()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  dialog.value = false 
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
    width="700"
    height="850"
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
      <span>작업환경측정 결과 관리 업로드 결과</span>
    </v-sheet>
    <v-card class="pa-4 rounded-b-5">
      <div> 
        {{ content }}
      </div>
      <v-sheet class="h-auto">
        <RealGrid
          ref="grdMain"
          class="mt-2 mb-2"
          style="height: 680px;"
          :grid-view-option="grd1Props.gridViewOption"
          :keys="grd1Props.keys" 
          :fields="grd1Props.fields"
          :columns="grd1Props.columns"
        />
      </v-sheet>
      <IGridTitle
        ref="menuTitle"
        :use-permission="false"
        :button-list="['btnChk']"
        @click-button="onButtonsClick"
      />
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
