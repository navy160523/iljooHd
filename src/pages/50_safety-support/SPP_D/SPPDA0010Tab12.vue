<!-- SPPDA0010Tab1위험기계기구 일괄업로드 탭-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import { isEmpty } from 'lodash-es'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const totCnt = ref("0")
const grdMain = ref(null)
const inData = ref([])
const props = defineProps({
  tab: {
    type: String,
    default: "",
  },
  intData: {
    type: Array,
    required: false,
    default() {
      return []
    },
  },
  flag_pop: {
    type: Boolean,
    default: false,
  },
  codeList: {
    type: Object
  }
})
const emit = defineEmits(["updataMain"], ["flagfalse"])
const fileUpload = ref(null)
//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [""],
  fields: [
    // {
    //   fieldName: "MANAGE_DEPT_NM",
    //   dataType: "text",
    //   header: { text: t("관리부서") },
    // },
    // {
    //   fieldName: "CHARGE_EMP_NM",
    //   dataType: "text",
    //   header: { text: t("관리담당자") },
    // },
    // {
    //   fieldName: "ITMANAGER_EMPNM",
    //   dataType: "text",
    //   header: { text: t("사용자부서　　담당자") },
    // },
    {
      fieldName: "EQUIP_KIND",
      lookupDisplay: true,
      dataType: "text",
      header: { text: t("장비군") },
    },
    {
      fieldName: "CHARGE_EMP_NO",
      header: { text: t("사용부서 담당자") },
      dataType: "text",
    },
    {
      fieldName: "ITMANAGER_EMPNO",
      header: { text: t("관리부서 담당자") },
      dataType: "text",
    },
    {
      fieldName: "EQUIP_SEQ",
      dataType: "number",
      header: { text: t("장비SEQ") },
      numberFormat: "####",
    },
    {
      fieldName: "EQUIP_NO",
      dataType: "text",
      header: { text: t("장비번호") },
    },
    {
      fieldName: "TRMS_NO",
      dataType: "text",
      header: { text: t("설비번호(TRMS)") },
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      lookupDisplay: true,
      header: { text: t("장비상태") },
    },

    {
      fieldName: "INSTALL_PLACE",
      dataType: "text",
      header: { text: t("설치장소") },

    },

    {
      fieldName: "MAKER",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("제조사") },
    },

    {
      fieldName: "INSTALL_DT",
      header: { text: t("설치일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "text",
      datetimeFormat: "yyyyMMdd",
    },
    
    
  ],
  columns: [],
  columnLayout: [
    {
      name: "장비군",
      direction: "horizontal",
      hideChildHeaders: true,
      items: ["EQUIP_KIND", "EQUIP_SEQ"],
      header: {
        text: t("장비군"),
      },
    },
    "EQUIP_NO",
    "ITMANAGER_EMPNO",
    "CHARGE_EMP_NO",
    "TRMS_NO",
    "STATUS",
    {
      name: "설치사양",
      direction: "horizontal",
      items: ["INSTALL_PLACE",  "MAKER", "INSTALL_DT"],
      header: {
        text: t("설치사양"),
      },
    },
  
  
  
  ]
})

grdMainProps.columns = grdMainProps.fields

//  이벤트 시작

watch(
  () => props.intData,
  (newValue) => {
    console.log("props.intData changed", props.intData)
    if (newValue) {
      grdMain.value.getDataProvider().setRows(newValue)
      totCnt.value = newValue.length
    } else {
      totCnt.value = "0"
    }
  }
)

watch(
  () => props.flag_pop,
  (newValue) => {
    if (newValue) {
      let chkRow = grdMain.value.getGridView().getCheckedRows()
      let param = []
      chkRow.forEach(async (e) => {
        let rowData = await grdMain.value.getDataProvider().getJsonRow(e)
        param.push(rowData)
      })

      emit("flagfalse", param)
    }
  }
)

onMounted(() => {

  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().setFocus(0) //행 0으로
})

const onCellItemClicked = (grid, index, col) => {
  if (index.fieldName == "ETC_FILE_YN") {
    let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
    fileUpload.value.openPopup(data.ETC_FILE_ID)
  } else {
    return
  }
}

const rowChanged = (grid, oldRow, newRow) => {
  if (newRow === -1) {
    return
  }
  let data = grdMain.value.getDataProvider().getJsonRow(newRow)
  inData.value = data
}

const updata = () => {
  emit("updataMain")
}

const DataReSet = () => {
  inData.value = []
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <div class="content-area">
      <v-sheet height="85%" class="mb-3">
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @onCellItemClicked="onCellItemClicked"
          @onCurrentRowChanged="rowChanged"
        />
        <div class="ml-2">총 : {{ totCnt }} 개</div>
      </v-sheet>

     
    </div>
  </v-card>
  <IUploadPopup
    ref="fileUpload"
    :buttonList="['btnDownLoad', 'btnClose']"
    :isVisibled="false"
  />
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: calc(100vh - 345px);
  min-height: 665px;
}
</style>
