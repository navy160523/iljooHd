<!--
  화면명 : 단기공사 현황 팝업
  화면개요 : 단기공사 상세 정보 팝업 (결제이력)
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

onMounted(() => {
  // grd1.value.getDataProvider().setRows(data);
  initCodeList()
});

const dialog = ref(false)

const vm = getCurrentInstance().proxy //다이얼로그관련

const userStore = useUserStore()
const t = useI18n().t; //다국어
const grd1 = ref(null);

//결재이력
const grdProps1 = reactive({
  fields: [
    { fieldName: "DEPT_NM", dataType: "text", header: { text: t("부서") },editable: false },
    { fieldName: "EMPNM", dataType: "text", header: { text: t("이름") },editable: false },
    { fieldName: "APP_STATUS_NM", dataType: "text", header: { text: t("결재상태") },editable: false },
    { fieldName: "CLR_DATE", dataType: "text", header: { text: t("결재일시") },editable: false },
    { fieldName: "ZZ_COMMENT_DESC", dataType: "text", header: { text: t("의견") }, editable: false },
  ],
  columns: [],
  columnLayout: [
  ],
});
grdProps1.columns = grdProps1.fields;

const codeList = reactive({
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([

  ]).then(res => {
    console.log("레스 확인", res)

  })
}

//버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === "btnClose") {
    onClose()
  }
  
}


//컨트롤 초기화
const clearField = () => {
  
}

const onClose = () => {
  clearField()
  dialog.value = false
}


const openPopup = async (result) => {
  
  dialog.value = true 
  grd1.value.getDataProvider().setRows(result)    
  /**************** popupParam Object로 넘겨주기 *****************/
  // if (!popupParam) {
  //   dialog.value = true
  //   return
  // }
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
    width="900"
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
      <span>결재이력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex fill-height">
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
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 650px;
    max-height: 650px;
    // overflow-y: auto;
  }

  .expanlDiv {
    // min-height: 650px;
    // max-height: 650px;
    overflow-y: auto;
  }
}

.expanTitle{
  background-color: #e3e3e3;
}

.expanText{
  margin: 10px;
  height: 180px;
}

.expanText2{
  margin: 10px;
}

</style>
