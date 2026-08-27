<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

defineOptions({
  name: '40_safety-risk-SRM_A-Popup-SRMBA0020',
})

const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const dialog = ref(false)
const grdMain = ref(null)

//그리드 속성셋팅
const grdProps1 = reactive({
  gridViewOption: {
    rowIndicator: { visible: false },
  },
  fields: [
    { fieldName: 'COL1', dataType: 'text', width: '75', header: { text: t('연도') } },
    { fieldName: 'COL2', dataType: 'text', width: '75', header: { text: t('구분') } },
    { fieldName: 'COL3', dataType: 'text', width: '300', header: { text: t('파일명') } },
    { fieldName: 'COL4', dataType: 'text', width: '100', header: { text: t('Mapping 연동') }, 
      checked: false, renderer: { type: 'check' }
    },
    { fieldName: 'COL5', dataType: 'text', width: '100', header: { text: t('내려받기') } },
  ], 
  columns: [],
})

const data = [
  {
    COL1: "2021",
    COL2: "원본",
    COL3: "[원본]21년도 공모전 1037건.xlsx",
    COL4: "",
    COL5: "",
  },
  {
    COL1: "2022",
    COL2: "원본",
    COL3: "[원본]22년도 공모전 512건.xlsx",
    COL4: "",
    COL5: "",
  },
  {
    COL1: "2023",
    COL2: "검토",
    COL3: "[검토]23년도 공모전 782건.xlsx",
    COL4: "",
    COL5: "",
  },
]

grdProps1.columns = grdProps1.fields

// 팝업오픈
const openPopup = popupParam => {
  dialog.value = true

  grdMain.value.getDataProvider().setRows(data)
}

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    dialog.value = false
  }
}

onMounted(() => {})

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
      <span>설문지 현황 관리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnRegisterSurvey', 'btnRegisterMappingInfo']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: calc(100vh - 700px);"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys" 
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
            />
          </v-sheet>
        </div>
      </v-card-text>
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
    </v-card>
  </v-dialog>
</template>
