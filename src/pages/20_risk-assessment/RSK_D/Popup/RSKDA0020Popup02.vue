<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import SelectEmpPopup from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0020Popup01.vue'
import { lte } from "lodash-es"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null) 
const t = useI18n().t //다국어
const emit = defineEmits(["selected"])
const dialog = ref(false)
const grdMain = ref(null)
const selectEmpPopup = ref(null)

let grdParams = reactive([])
let deleteParams = reactive({})

let openParams = reactive({
  title: '',
  dataRow: null,
  fieldIndex: null,
  checkBar: false
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false } },
  keys: ["EMP_NO"],
  field: [
    { fieldName: "EMP_NM", dataType: "text", header: { text: t("성명") } },
    { fieldName: "JOB_TIT_NM", dataType: "text", header: { text: t("직급") } },
    { fieldName: "EMP_NO", dataType: "text", header: { text: t("사번") } },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = async popupParam => {
  grdParams = []
  openParams.dataRow = popupParam.dataRow
  openParams.fieldIndex = popupParam.fieldIndex
  openParams.BSNS_CD = popupParam.BSNS_CD,
  openParams.DEPT_CD = popupParam.DEPT_CD,
  dialog.value = true
  if (popupParam.ADDI_COMMITTEE !== '') {
    for (let val of popupParam.ADDI_COMMITTEE) {
      await commonSearchApi({ 
        queryId : 'searchUserInfo',
        param : { 
          CMPNY_DIV: userStore.cmpnyDiv, 
          EMP_NO: val,
        },
      }).then(res => {
        grdParams.push(res.ORESULT_CUR[0])
      })
    }
    grdMain.value.getDataProvider().setRows(grdParams)
  } else {
    grdMain.value.getDataProvider().setRows([])
  }
}

/* ------------- 팝업 ------------- */
// 팝업 닫기
const onClose = () => {
  dialog.value = false
}

const onEmpSelected = val => {
  grdMain.value.addRow({
    EMP_NM: val.EMP_NM,
    JOB_TIT_NM: val.JOB_TIT_NM,
    EMP_NO: val.EMP_NO,
  })
}

/* ------------- 클릭 이벤트 ------------- */
const onButtonsClick = btn => {
  if (btn.id === 'btnCreate') {
    selectEmpPopup.value.openPopup(openParams)
  } else if (btn.id === 'btnUpdate') {
    saveData()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 저장
const saveData = () => {
  const data = grdMain.value.getDataProvider().getJsonRows()

  let values = data.map(item => item.EMP_NO)
  let result = values.join(',')

  if (!result) {
    return Message.warn(t('인원을 추가해 주세요.'))
  }

  vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  }).then(swalRes => {
    if(swalRes.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'RSKDA0020_SAVE_02',
        list: [{
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: openParams.BSNS_CD,
          DEPT_CD: openParams.DEPT_CD,
          ADDI_COMMITTEE: result,
          USER_ID: userStore.userId,
        }],
      }).then(res => {
        if (res.result.status === '200') {
          return Message.success(t('저장되었습니다.'))
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        emit("selected", "insert")
        onClose()
      })
    }
  })
}

// 삭제
const deleteData = () => {
  // 삭제 알림
  vm.$swal({ 
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(res => {
    if(res.isConfirmed === true) {  // "예"를 클릭하면 그리드 상에서 삭제
      grdMain.value.getDataProvider().removeRow(deleteParams.dataRow)

      // 삭제한 데이터를 filter로 제외시키고 재배열
      let data = grdMain.value.getDataProvider().getJsonRows()
      delete data[deleteParams.dataRow]

      let delAfterData = data.filter(el => el !== undefined)

      // 배열을 String으로 변환 (ex: A00001,A00002)
      let values = delAfterData.map(item => item.EMP_NO)
      let result = values.join(',')

      commonExecuteApi({
        queryId : 'RSKDA0020_SAVE_02',
        list: [{
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: openParams.BSNS_CD,
          DEPT_CD: openParams.DEPT_CD,
          ADDI_COMMITTEE: result,
          USER_ID: userStore.userId,
        }],
      })
    }
  }).finally(() => {
    emit("selected", "delete")
    onClose()
  })
}

const onCellClicked = (grid, clickData) => {
  deleteParams = {}
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.itemIndex)
  data.dataRow = clickData.dataRow

  deleteParams = data

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
    height="600"
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
    <span>추가위원 등록/관리</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-title class="px-4 py-1">
      <IGridTitle
        :use-permission="false"
        :button-list="['btnCreate', 'btnDelete', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-4 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :gridViewOption="grdMainProps.gridViewOption"
            :fields="grdMainProps.field"
            :columns="grdMainProps.columns"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
        <v-sheet class="mt-2">
          <IGridTitle
            :use-permission="false"
            :button-list="['btnClose']"
            @click-button="onButtonsClick"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
    <!-- 인원조회팝업 -->
    <SelectEmpPopup 
      ref="selectEmpPopup" 
      @selected="onEmpSelected"
    />
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
