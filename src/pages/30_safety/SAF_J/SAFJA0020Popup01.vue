<!--
  화면명 : 단기공사 회사 조회 팝업
  화면개요 : 단기공사 회사 공사 내역 조회
  최종수정일자: 2024-04-20
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IGridTitle from "@/components/IGridTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi,getCompanyList } from '@hiway/api/commonApi'
import SAFJA0040Popup01 from "./SAFJA0040Popup01.vue"

onMounted(() => {});

const dialog = ref(false)

const vm = getCurrentInstance().proxy //다이얼로그관련
const SAFJA0040Pop01 = ref(null)
const t = useI18n().t; //다국어
const grd1 = ref(null);


//조회 
const searchParams = reactive({
  CMPNY_DIV: '',
  VEND_CD: '',
  USER_ID: '',
  VND_NAME: '',
  REP_NAME: '',
  BIZ_REG_NO: '',
  BIZ_REG_NO_DISP: ''
})

const grdProps1 = reactive({
  fields: [
    { fieldName: "WORK_NO", dataType: "text", header: { text: t("공사번호") },editable: false },
    { fieldName: "WORK_DESC", dataType: "text", header: { text: t("공사명") },editable: false },
    { fieldName: "WORK_DT", dataType: "text", header: { text: t("공사기간") },editable: false },
    { fieldName: "IN_PERSON", dataType: "text", header: { text: t("투입인원") },editable: false },
    // { fieldName: "DANGER_S", dataType: "text", header: { text: t("신고대상") },editable: false },
    // { fieldName: "DANGER_H", dataType: "text", header: { text: t("허가대상") },editable: false },
    { fieldName: "STATUS_NAME", dataType: "text", header: { text: t("진행상태") },editable: false },
    { fieldName: "UNQUI_DESC", dataType: "text", header: { text: t("반려사유") }, editable: false },

    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "VEND_CD", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "WORK_NO_ORI", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "REV_NO", dataType: "text", header: { text: t("") },visible: false },
  ],
  columns: [],
  columnLayout: [
    "WORK_NO","WORK_DESC","WORK_DT","IN_PERSON",
    // {
    //   name: "위험작업",
    //   direction: "horizontal",
    //   hideChildHeaders: false,
    //   items: ["DANGER_S", "DANGER_H"],
    //   header: { text: t("위험작업") },
    // },
    "STATUS_NAME","UNQUI_DESC"
  ],
});

grdProps1.columns = grdProps1.fields;
//그리드 더블 클릭 이벤트
const onCellDblClicked = (grid, data) => {
  if (data.cellType === 'data') {
    const rowData = grd1.value.getRowData(data.dataRow)
    // console.log('data :: ', data, ' rowData ::: ', rowData)
    const getData = {
      CMPNY_DIV: rowData.CMPNY_DIV,
      BIZ_REG_NO:  rowData.BIZ_REG_NO,
      VEND_CD: rowData.VEND_CD,
      WORK_NO_ORI: rowData.WORK_NO_ORI,
      REV_NO: rowData.REV_NO,
      WORK_NO: rowData.WORK_NO_ORI,
    }
    SAFJA0040Pop01.value.openPopup(getData)
    // SAFJA0020Pop01.value.openPopup(getData)
  }
}

//버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === 'btnSearch') {
    searchData(searchParams)
  } else if (btn.id === "btnClose") {
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


const openPopup = async (popupParam) => {
  console.log('popupParam ', popupParam)
  searchParams.CMPNY_DIV = popupParam.CMPNY_DIV
  searchParams.VEND_CD = popupParam.VEND_CD
  searchParams.USER_ID = popupParam.USER_ID
  searchParams.VND_NAME = popupParam.VND_NAME
  searchParams.REP_NAME = popupParam.REP_NAME
  searchParams.BIZ_REG_NO = popupParam.BIZ_REG_NO
  searchParams.BIZ_REG_NO_DISP = popupParam.BIZ_REG_NO_DISP
  searchData(searchParams)

  /**************** popupParam Object로 넘겨주기 *****************/
  if (!popupParam) {
    dialog.value = true
    return
  }


}

const searchData = (param) => {
  commonSearchApi({
    queryId: "SAFJA0040_SEARCH_02",
    param: param
  }).then(async res => {  
    // console.log('res ', res)

    dialog.value = true 
    if (res.ORESULT_CUR.length > 0) {

      grd1.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })

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
    width="1400"
    height="780"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      
    >
      <span>단기공사 목록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex pb-2">
              <i-input
                  :label="$t('협력회사명')"
                  disabled
                  margin="10px"
                  width="350px"
                  label-width="80px"
                  v-model="searchParams.VND_NAME"
                />
              <i-input
                  :label="$t('대표자명')"
                  disabled
                  margin="10px"
                  width="350px"
                  label-width="80px"
                  v-model="searchParams.REP_NAME"
                />
              <i-input
                  :label="$t('사업자번호')"
                  disabled
                  margin="10px"
                  width="255px"
                  label-width="80px"
                  v-model="searchParams.BIZ_REG_NO_DISP"
                />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
                  ref="grd1"
                  class="mt-1"
                  :grid-view-option="grdProps1.gridViewOption"
                  :keys="grdProps1.keys"
                  :fields="grdProps1.fields"
                  :columns="grdProps1.columns"
                  :column-layout="grdProps1.columnLayout"
                  @onCellDblClicked="onCellDblClicked"
                  />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <SAFJA0040Popup01 ref="SAFJA0040Pop01" />
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
  margin: 15px;
}

</style>
