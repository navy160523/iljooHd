<!--
  화면명 : 단기공사 현황 팝업
  화면개요 : 단기공사 협력회사 조회 팝업
  최종수정일자: 2024-04-20
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IGridTitle from "@/components/IGridTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi,getCompanyList } from '@hiway/api/commonApi'
const emit = defineEmits(['selected'])

onMounted(() => {
  // grd1.value.getDataProvider().setRows(data);
});

const dialog = ref(false)

const vm = getCurrentInstance().proxy //다이얼로그관련

const userStore = useUserStore()
const t = useI18n().t; //다국어
const grd1 = ref(null);


const popParam = reactive({
  dataRow: '',
  fieldIndex: '',
})


//결재이력
const grdProps1 = reactive({
  fields: [
    { fieldName: "VEND_CD", dataType: "text", header: { text: t("협력사코드") }, editable: false },
    { fieldName: "VND_NAME", dataType: "text", header: { text: t("협력사명") },editable: false },
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("BIZ_REG_NO") },editable: false,visible: false },
  ],
  columns: [],
  columnLayout: [
  ],
});
grdProps1.columns = grdProps1.fields;

let options = reactive({
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    VND_NAME: '',
  },
})

//버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === "btnClose") {
    onClose()
  } else if (btn.id === "btnSearch") {
    search()
  }
}


const onClose = () => {
  clearField()
  dialog.value = false
}

const clearField = () => {
  grd1.value.getDataProvider().setRows(null)
  options.values.VND_NAME = ''
}





const openPopup = async (popupParam) => {
  
  dialog.value = true 
  // search()

  /**************** popupParam Object로 넘겨주기 *****************/
  // if (!popupParam) {
  //   dialog.value = true
  //   return
  // }


}

const search = () => {
  const setpara = {
    CMPNY_DIV: options.values.CMPNY_DIV,
    VND_NAME: options.values.VND_NAME,
    USER_ID: '',
    USE_YN: 'Y',
  }

  
  commonSearchApi({
      queryId: "SAFJA0040_SEARCH_09"
    , param: setpara
  }).then(async res => {
    grd1.value.getDataProvider().setRows(res.ORESULT_CUR)    
  })
}

const onSelect = () => {
  var rowIdx = grd1.value.getGridView().getCurrent().dataRow

  var rtnData = grd1.value.getDataProvider().getJsonRow(rowIdx)

  // 팝업 오픈 시 넘어오는 그리드 DataRow(그리드에 적용시킬려면 "dataRow"가 필요)
  // 작성자 : 이희원(2024-02-01)
  rtnData.dataRow = popParam.dataRow
  rtnData.fieldIndex = popParam.fieldIndex

  // console.log(rtnData)

  emit('selected', rtnData)
  onClose()
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
    width="600"
    height="700"
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
      <span>협력회사 조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex fill-height flex-column">
          <v-sheet class="searchArea ">
            <div class="d-flex">
              <i-input
                v-model="options.values.VND_NAME"
                top-label
                width="250px"
                :label="$t('협력회사명')"
                @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              />
            </div>
          </v-sheet>
          <v-sheet  class="h-auto">
            <div class="d-flex h-full">
              <RealGrid
              ref="grd1"
              class="mt-2"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
              @onCellDblClicked="onSelect"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>


<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 250px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 550px;
    max-height: 550px;
    // overflow-y: auto;
  }

}

</style>
