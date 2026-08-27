<!--
  화면명 : 작업환경측정 공정관리 반기 복사
  화면개요 : 특정 반기에 있는 공정을 복사한다.
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const visibleGubun = ref(false)
const grdMain = ref(null)

 
//그리드 속성셋팅_main
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, stateBar: { visible: false }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'SAMPLE_NAME', dataType: 'text', width: '80', header: { text: t('파일이름') }, styleName: 'left-column',},

    { fieldName: 'FILE_PATH', dataType: 'text', width: '120', header: { text: t('회사코드') }, visible : false },
    { fieldName: 'FILE_NAME', dataType: 'text', width: '120', header: { text: t('의뢰 부서코드') }, visible : false },
    // { fieldName: 'SELECT', dataType: 'text', header: { text: t('SELECT') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = () => {
  grdMain.value.getDataProvider().setRows([
    { SAMPLE_NAME: '청력보존프로그램 양식', FILE_PATH: 'HLTF', FILE_NAME: '청력보존프로그램 양식.xlsx'},
    { SAMPLE_NAME: '호흡기보호프로그램 양식', FILE_PATH: 'HLTF', FILE_NAME: '호흡기보호프로그램 양식.xlsx'}
  ])
  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnFormDownload') {
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    // validation 체크
    if(checkedRows.length == 0) {
      return Message.warn(t('저장할 데이터가 없습니다.'))
    }

    for(let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      let params = {
        FILE_PATH: data.FILE_PATH,
        FILE_NAME: data.FILE_NAME,
      }
      commonSampleDownFilesApi(params)
    }
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  visibleGubun.value = false
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
    height="400"
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
      <span>부서별 개선실적 관리 샘플 다운로드</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnFormDownload', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="height:150px;">
          <v-sheet class="searchArea flex-column">
            <RealGrid 
              ref="grdMain"
              style="height: 101px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
          </v-sheet>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
