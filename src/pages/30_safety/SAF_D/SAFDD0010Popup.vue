<script setup>
import { commonSearchApi } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import RealGrid from '@/components/RealGrid.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const dialog = ref(false)
const grdMain = ref(null)

const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false } },
  keys : [],
  fields : [
    { fieldName: 'VIO_DATE', dataType: 'text', header: { text: t('위반일') }, editable: false, width: 80, },
    { fieldName: 'VIO_PLC_NM', dataType: 'text', header: { text: t('위반장소') }, editable: false, width: 120, },
    { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('위반내용') }, editable: false, width: 200 },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = param => {
  dialog.value = true
  commonSearchApi({
    queryId: 'SAFDD0010_SEARCH_10',
    param: param
  }).then(res => {
    const data = res.ORESULT_CUR
    grdMain.value.getDataProvider().setRows(data)
  })
}

const onButtonsClick = btn => {
  if(btn.id === 'btnClose') {
    dialog.value = false
  }
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="650"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      위반내역 상세
    </div>

    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="h-grow fill-height">
          <v-sheet width="100%" class="pa-0">
            <RealGrid
              ref="grdMain"
              style="height: 450px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  height: fit-content;
  > div {
    min-height: 0;
  }
}
</style>