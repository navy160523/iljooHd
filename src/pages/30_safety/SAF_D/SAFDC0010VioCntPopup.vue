<!--
년누적 위반횟수 검색 팝업
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonSearchApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from "@/components/IMenuTitle.vue"
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import Message from "@hiway/utils/notify"
const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const t = useI18n().t
const emit = defineEmits(["selected"])
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EMP_NO: "",
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: "VIO_NO",
      dataType: "text",
      header: { text: t("등록번호") },
      editable: false,
      visible: false,
    },
    {
      fieldName: "VIO_DATE",
      dataType: "text",
      editable: false,
      header: { text: t("위반일") },
    },
    {
      fieldName: "VIO_PLC_NM",
      dataType: "text",
      editable: false,
      header: { text: t("위반장소") },
      styleName: "left-column",
    },
    {
      fieldName: "VIO_DESC",
      dataType: "text",
      editable: false,
      header: { text: t("위반내용") },
      styleName: "left-column",
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  console.log("누적위반", param)
  dialog.value = true
  searchParam.EMP_NO = param.EMP_NO
  commonSearchApi({
    queryId: "SAFDC0010_SEARCH_11",
    param: searchParam,
  }).then((res) => {
    if (res.ORESULT_CUR.length === 0) {
      Message.warn(t("조회된값이 없습니다."))
      return false
    } else {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

const closePopup = () => {
  dialog.value = false
  searchParam.EMP_NO = ""
  grdMain.value.getDataProvider().setRows(null)
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnClose") {
    closePopup()
  }
}

//조회관련 로직 끝

//선택관련 로직 끝
onMounted(() => {
  //
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
    width="850"
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
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto mt-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
            />
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
    min-height: 700px;
  }
}
</style>
