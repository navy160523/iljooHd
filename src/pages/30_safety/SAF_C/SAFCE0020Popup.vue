<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
defineOptions({
  name: "30_safety-SAF_C-SAFCE0020",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)
const userStore = useUserStore()
const emit = defineEmits(["selectedData"])
const searchParam01 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  CLSS_TITLE: "",
})

const searchParam02 = reactive({
  CMPNY_DIV: "",
  CLSS_SEQ: "",
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    { fieldName: "CLSS_SEQ", dataType: "text", visible: false, header: { text: t("") } },
    { fieldName: "CLSS_TITLE", dataType: "text", editable: false, header: { text: t("점검대상") } },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false, header: { text: t("") } },
  ],
  columns: [],
})

const grdSubProps = reactive({
  fields: [
    {
      fieldName: "CLSS_TITLE",
      dataType: "text",
      editable: false,
      header: { text: t("점검대상") },
      width: "70",
      styleName: "left-column",
      mergeRule: { criteria: "value" },
    },
    {
      fieldName: "CHK_TITLE",
      dataType: "text",
      editable: false,
      width: "170",
      styleName: "left-column",
      header: { text: t("점검항목") },
    },
    {
      fieldName: "CHK_RESULT",
      dataType: "text",
      editable: false,
      width: "50",
      styleName: "left-column",
      header: { text: t("점검결과") },
    },
    { fieldName: "REMARKS", dataType: "text", editable: false, styleName: "left-column", header: { text: t("비고") } },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

//메뉴버튼
const onButtonsClick = async (btn) => {
  if (btn.id === "btnSearch") {
    await new queryFlowHelper(vm, t).setGridList([grdMain]).setQuery(searchData01).setAfter(afterSearch01).run()
  } else if (btn.id === "btnSelect") {
    checkListSelect()
  } else {
    closePopup()
  }
}

//점검대상 조회관련 로직 시작
const searchData01 = () => {
  return commonSearchApi({
    queryId: "SAFCE0020_SEARCH03",
    param: searchParam01,
  })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//점검대상 조회관련 로직 끝

//점검항목 조회관련 로직 시작
const onCurrRowChanged = (grid, oldIndex, newIndex) => {
  let row = grdMain.value.getDataProvider().getJsonRow(newIndex)
  searchParam02.CMPNY_DIV = row.CMPNY_DIV
  searchParam02.CLSS_SEQ = row.CLSS_SEQ
  new queryFlowHelper(vm, t).setGridList([grdSub]).setQuery(searchData02).setAfter(afterSearch02).run()
}

const searchData02 = () => {
  return commonSearchApi({
    queryId: "SAFCE0020_SEARCH02",
    param: searchParam02,
  })
}

const afterSearch02 = (res) => {
  grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//점검항목 조회관련 로직 끝

//선택관련 로직 시작
const checkListSelect = () => {
  let chkDataList = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t("저장할 데이터를 선택해주세요."))
    return false
  }
  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    if (chkNum.length - 1 === i) {
      let chkData = {
        CLSS_TITLE: data.CLSS_TITLE,
        CLSS_SEQ: data.CLSS_SEQ,
      }
      chkDataList.push(chkData)
    } else {
      let chkData = {
        CLSS_TITLE: data.CLSS_TITLE + ", ",
        CLSS_SEQ: data.CLSS_SEQ + ", ",
      }
      chkDataList.push(chkData)
    }
  }

  emit("selectedData", chkDataList)
  closePopup()
}
//선택관련 로직 끝

const openPopup = async param => {
  // console.log('param', param)

  dialog.value = true

  commonSearchApi({
    queryId: "SAFCE0020_SEARCH03",
    param: searchParam01,
  }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setCurrent(0)

    if(param.CLSS_SEQ !== null && param.CLSS_SEQ !== undefined) {
      const selected = param.CLSS_SEQ.replace(/ /gi, '').split(',')

      if(selected.length > 0) {
        // console.log('selected', selected)
        // console.log('rows', grdMain.value.getDataProvider().getRows())

        selected.forEach(item => {
          const grdDatas = grdMain.value.getDataProvider().getJsonRows()

          for(let i = 0; i < grdDatas.length; i++) {
            const currRow = grdDatas[i]

            if(currRow.CLSS_SEQ === item) {
              grdMain.value.getGridView().checkItem(i)
            }
          }
        })
      }
    }
  })
}

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
    persistent
    width="1300"
    height="850"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>점검대상 선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-sheet class="searchArea d-flex">
        <i-input v-model="searchParam01.CLSS_TITLE" :label="$t('점검대상')" width="200px"></i-input>
      </v-sheet>
      <v-card-text height="100%" class="pa-3 pt-0 content-area">
        <div class="h-grow">
          <v-sheet width="40%" class="pa-0 mr-3">
            <IGridTitle :title="$t('점검대상')" />
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCurrentRowChanged="onCurrRowChanged"
            >
            </RealGrid>
          </v-sheet>
          <v-sheet width="60%" class="pa-0">
            <IGridTitle :title="$t('점검항목')" />
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
            >
            </RealGrid>
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
