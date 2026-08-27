<!-- 
  화면명 : 위험기계기구 환기설비
  화면개요 : 위험기계기구 환기설비
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import { isEmpty } from 'lodash-es'
import {
  commonSearchApi,
} from "@hiway/api/commonApi"
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import TabInTabMain from "@/pages/50_safety-support/SPP_D/SPPDA0010TabInTabMain.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const searchParams = reactive({})
const totCnt = ref("0")
const grdMain = ref(null)
const inData = ref([])
const exPanVal = ref(1)
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
    {
      fieldName: "MANAGE_DEPT_NM",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("관리부서") },
      width: 80
    },
    {
      fieldName: "MANAGE_GUA_NM",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("관리과") },
      width: 80
    },
    {
      fieldName: "CHARGE_EMP_NM",
      dataType: "text",
      header: { text: t("관리담당자") },
      width: 80
    },
    {
      fieldName: "USE_DEPT_NM",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("사용부서") },
      width: 80
    },
    {
      fieldName: "ITMANAGER_EMPNM", 
      dataType: "text",
      header: { text: t("사용자부서\n담당자"), styleName: 'multiline-editor-pre' },
      width: 80
    },

    {
      fieldName: "EQUIP_NO",
      dataType: "text",
      header: { text: t("장비번호") },
      width: 80
    },
    {
      fieldName: "TRMS_NO",
      dataType: "text",
      header: { text: t("설비번호\n(TRMS)"), styleName: 'multiline-editor-pre' },
      width: 80
    },
    {
      fieldName: "EQUIP_NAME",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("장비명") },
      width: 80
    },
    {
      fieldName: "STATUS",
      dataType: "text",
      lookupDisplay: true,
      header: { text: t("장비상태") },
      width: 60
    },
    {
      fieldName: "EQUIP_SIZE",
      styleName: "right-column",
      dataType: "text",
      header: { text: t("환기용량") },
      width: 60
    },
    {
      fieldName: "INSTALL_PLACE",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("설치위치") },
      width: 100
    },
    {
      fieldName: "INSTALL_DT",
      header: { text: t("설치일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      width: 80
    },
    { fieldName: "MAKER", 
      dataType: "text", 
      styleName: 'left-column',
      header: { text: t("제조사") },
      width: 100
    },
    {
      fieldName: "PART_DIVISION",
      lookupDisplay: true,
      dataType: "text",
      header: { text: t("구분") },
      width: 60
    },
    {
      fieldName: "TEST_DT",
      header: { text: t("인증/검사일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      width: 80
    },
    { fieldName: "PASS_NO",
      dataType: "text", 
      header: { text: t("합격번호") },
      width: 80
    },
    {
      fieldName: "EXPIRATION",
      dataType: "text",
      header: { text: t("검사유효기간") },
      width: 120
    },
    {
      fieldName: "RETEST_DT",
      dataType: "text",
      header: { text: t("차기검사년도") },
      width: 80
    },
    {
      fieldName: "TEST_AGENCY_NM",
      dataType: "text",
      styleName:'left-column',
      header: { text: t("검사기관") },
      width: 100
    },
    { fieldName: "INSPECTOR", 
      dataType: "text", 
      header: { text: t("검사원") },
      width: 80
    },
    {
      fieldName: "CERT_FILE_YN",
      dataType: "text",
      header: { text: t("인증서") },
      width: 60
    },

    {
      fieldName: "ETC_FILE_YN",
      dataType: "text",
      header: { text: t("첨부") },
      isFile: { value: true, align: "right" },
      width: 60
    },
    {
      fieldName: "NONTEST_YN",
      dataType: "text",
      header: { text: t("검사제외") },
      width: 60
    },
    {
      fieldName: "REMARK",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("비고") },
      width: 150
    },

    {
      fieldName: "EQUIP_KIND",
      lookupDisplay: true,
      dataType: "text",
      header: { text: t("장비군") },
      width: 80
    },
    {
      fieldName: "EQUIP_SEQ",
      dataType: "text",
      header: { text: t("장비군") },
      width: 40
    },
    {
      fieldName: "ETC_FILE_ID",
      dataType: "text",
      header: { text: t("파일아이디") },
      visible: false,
    },
    { fieldName: "CHARGE_EMP_NO", visible: false },
    { fieldName: "ITMANAGER_EMPNO", visible: false },
    { fieldName: "ITMANAGER_COMPANY", visible: false },
    { fieldName: "MANAGE_ASGN_FULL_NM", visible: false },
    { fieldName: "CMPNY_DIV", visible: false },
    { fieldName: "MANAGE_ASGN_CD", visible: false },
    { fieldName: "MANAGE_COMPANY", visible: false },
    { fieldName: "MANAGE_DEPT_CD", visible: false },
    { fieldName: "USE_DEPT_CD", visible: false },
    { fieldName: "USE_DEPT_COMPANY", visible: false },
    { fieldName: "CHARGE_COMPANY", visible: false },
    { fieldName: "PORT_CRANE_YN", visible: false },
    { fieldName: "LOG_CFM_CNT", visible: false },
    { fieldName: "MANAGE_TEAM_NM", visible: false },
    // { fieldName: 'EQUIP_KIND_TEST',lookupDisplay: true, dataType: 'text',header: { text: t('검사기준분류') } },
    // { fieldName: 'EQUIP_SIZE',styleName: "right-column", dataType: 'text',header: { text: t('전체용량') } },
  ],
  columns: [],
  columnLayout: [
    "MANAGE_DEPT_NM",
    "MANAGE_GUA_NM",
    "CHARGE_EMP_NM",
    "USE_DEPT_NM",
    "ITMANAGER_EMPNM",
    "EQUIP_NO",
    "TRMS_NO",
    "EQUIP_NAME",
    "STATUS",
    {
      name: "설치사양",
      direction: "horizontal",
      items: [
        'EQUIP_SIZE',
        "INSTALL_PLACE",
        "INSTALL_DT",
        "MAKER",
        "PART_DIVISION",
      ],
      header: {
        text: t("설치사양"),
      },
    },
    {
      name: "안전검사/인증",
      direction: "horizontal",
      items: [
        "TEST_DT",
        "PASS_NO",
        "EXPIRATION",
        "RETEST_DT",
        "TEST_AGENCY_NM",
        "INSPECTOR",
        "CERT_FILE_YN",
      ],
      header: {
        text: t("안전검사/인증"),
      },
    },
    "ETC_FILE_YN",
    "NONTEST_YN",
    "REMARK",
    {
      name: "장비ID",
      direction: "horizontal",
      hideChildHeaders: true,
      items: ["EQUIP_KIND", "EQUIP_SEQ"],
      header: {
        text: t("장비ID"),
      },
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

//  이벤트 시작
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

watch(() => props.codeList, (newValue, oldValue) => {
  if(!isEmpty(newValue)) {
    grdMain.value.setBindingColumn('EQUIP_KIND',props.codeList.F810,'COD','TXT')
    grdMain.value.setBindingColumn('STATUS',props.codeList.FB110,'COD','TXT')
    grdMain.value.setBindingColumn("PART_DIVISION", props.codeList.FB150, "COD", "TXT")
  }
}, { deep: true })

onMounted(() => {
  grdMain.value.setBindingColumn('EQUIP_KIND',props.codeList.F810,'COD','TXT')
  grdMain.value.setBindingColumn('STATUS',props.codeList.FB110,'COD','TXT')
  grdMain.value.setBindingColumn("PART_DIVISION", props.codeList.FB150, "COD", "TXT")

  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().setFocus(0) //행 0으로

  if (props.intData) {
    let data = props.intData.filter((x) => x.EQUIP_KIND === "M")
    grdMain.value.getDataProvider().setRows(data)
  }

  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    var ret = {}
    var gender = grid.getValue(item.index, "LOG_CFM_CNT")

    if (gender > 0) {
      ret.style = { background: "#F44336" }
    }
    return ret
  })
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

// 그리드 데이터 조회
const getData = (param) => {
  Object.assign(searchParams, param)
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'SPPDA0010_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  totCnt.value = res.ORESULT_CUR.length
  if(!isEmpty(props.codeList)) {
    grdMain.value.setBindingColumn('EQUIP_KIND',props.codeList.F810,'COD','TXT')
    grdMain.value.setBindingColumn('STATUS',props.codeList.FB110,'COD','TXT')
    grdMain.value.setBindingColumn("PART_DIVISION", props.codeList.FB150, "COD", "TXT")
  }
}

defineExpose({
  getData
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <div class="content-area">
      <v-sheet height="100%" class="mb-3">
        <RealGrid
          ref="grdMain"
          :style="{ height: exPanVal === 0 ? 'calc(100% - 420px)' : 'calc(100% - 170px)' }"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @onCellItemClicked="onCellItemClicked"
          @onCurrentRowChanged="rowChanged"
        />
        <div class="ml-2">총 : {{ totCnt }} 개</div>
        <VExpansionPanels
          v-model="exPanVal"
          class="mt-2"
        >
          <VExpansionPanel elevation="0">
            <VExpansionPanelTitle
              class="font-weight-bold mb-2"
              color="base"
            >
              상세정보
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <TabInTabMain
                @updata="updata"
                @DataReSet="DataReSet"
                :clickData="inData"
                :tab="tab"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
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
