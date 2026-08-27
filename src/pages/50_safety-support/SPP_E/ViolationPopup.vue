<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import { commonSearchApi} from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const dialog= ref(false)
 
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EMP_NO: userStore.empNo,
})

const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false },  stateBar: { visible: false }},
  field: [
    { fieldName: 'VIO_DATE', dataType: 'text', header: { text: t('위반일')}},
    { fieldName: 'VIO_PLC_NM', dataType: 'text', header: { text: t('위반장소')}},
    { fieldName: 'VIO_DESC', dataType: 'text', header: { text: t('위반내용')}},
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else {
    onClose()
  }
}

const searchData = () => {
  return commonSearchApi({ queryId: "SPPEA0010_TAB02_SEARCH_06", param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const openPopup = value => {
  searchParams.CMPNY_DIV = value.CMPNY_DIV
  searchParams.EMP_NO = value.EMP_NO
  dialog.value = true 
  onButtonsClick({id: 'btnSearch'})
}

const onClose = () => {
  dialog.value = false
}

onMounted(() => {
  
})

defineExpose({
  openPopup,
})

</script>
<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="600"
    height="300"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>위반내역 상세</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area fill-height">
        <v-sheet class="fill-height">
          <RealGrid
            ref="grdMain"
            :keys="grdMainProps.keys" 
            :gridViewOption="grdMainProps.gridViewOption"
            :fields="grdMainProps.field"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>