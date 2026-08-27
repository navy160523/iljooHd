<!-- SPPDA0010Tab1위험기계기구 안전검사 Tab1(공통)-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import { isEmpty } from 'lodash-es'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi } from "@hiway/api/commonApi"
import RealGrid from "@/components/RealGrid.vue"
import { useUserStore } from "@hiway/stores/user"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const searchParams = reactive({})
const totCnt = ref("0")
const grdMain = ref(null)
const fileUpload = ref(null)
const props = defineProps({
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
const emit = defineEmits(["flagfalse"])


//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: [""],
  fields: [
    {
      fieldName: "EQUIP_KIND",
      lookupDisplay: true,
      dataType: "text",
      header: { text: t("장비군") },
      width: 80
    },
    {
      fieldName: "EQUIP_SEQ",
      dataType: "number",
      header: { text: t("장비군") },
      numberFormat: "####",
      width: 60
    },
    {
      fieldName: "MANAGE_DEPT_NM",
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
      fieldName: "MANAGE_TEAM_NM",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("관리팀") },
      width: 80
    },
    {
      fieldName: "CHARGE_EMP_NM",
      dataType: "text",
      header: { text: t("관리담당자") },
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
      fieldName: "STATUS",
      lookupDisplay: true,
      dataType: "text",
      header: { text: t("장비상태") },
      width: 80
    },
    {
      fieldName: "INSTALL_PLACE",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("설치위치") },
      width: 80
    },
    {
      fieldName: "INSTALL_DT",
      header: { text: t("설치일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      width: 90
    },
    {
      fieldName: "MAKER",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("제조사") },
      width: 100
    },
    {
      fieldName: "USE_DEPT_NM",
      styleName: "left-column",
      dataType: "text",
      header: { text: t("사용부서") },
      width: 80
    },
    { 
      fieldName: "TEST_DIV_NM",
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
      width: 90
    },
    { 
      fieldName: "PASS_NO", 
      dataType: "text", 
      header: { text: t("합격번호") },
      width: 100
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
      styleName: "left-column",
      dataType: "text",
      header: { text: t("검사기관") },
      width: 100
    },
    { 
      fieldName: "INSPECTOR", 
      dataType: "text", 
      header: { text: t("검사원") },
      width: 60
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
      dataType: "text", 
      header: { text: t("비고") },
      width: 150
    },
    {
      fieldName: "ETC_FILE_ID",
      dataType: "text",
      header: { text: t("파일아이디") },
      visible: false,
    },
    { fieldName: "LOG_CFM_CNT", dataType: "text", visible: false },

    // 출력 안함
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "EQUIP_COMPANY", dataType: "text", visible: false },
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
    "MANAGE_DEPT_NM",
    "MANAGE_GUA_NM",
    "MANAGE_TEAM_NM",
    "CHARGE_EMP_NM",
    "USE_DEPT_NM","ITMANAGER_EMPNM",
    "EQUIP_NO",
    "TRMS_NO",
    "STATUS",
    {
      name: "설치사양",
      direction: "horizontal",
      items: ["INSTALL_PLACE", "INSTALL_DT", "MAKER"],
      header: {
        text: t("설치사양"),
      },
    },
    {
      name: "안전검사/인증",
      direction: "horizontal",
      items: [
        "TEST_DIV_NM",
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
  ],
})

grdMainProps.columns = grdMainProps.fields

//  이벤트 시작

onMounted(() => {
  grdMain.value.getGridView().setRowStyleCallback(function (grid, item, fixed) {
    var ret = {}
    var gender = grid.getValue(item.index, "LOG_CFM_CNT")

    if (gender > 0) {
      ret.style = { background: "#F44336" }
    }
    return ret
  })

  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().setFocus(0) //행 0으로
})

watch(() => props.codeList, (newValue, oldValue) => {
  if(!isEmpty(newValue)) {
    grdMain.value.setBindingColumn('EQUIP_KIND',props.codeList.F810,'COD','TXT')
    grdMain.value.setBindingColumn('STATUS',props.codeList.FB110,'COD','TXT')
  }
}, { deep: true })

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

const onCellItemClicked = (grid, index, col) => {
  if (index.fieldName == "ETC_FILE_YN") {
    let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
    fileUpload.value.openPopup(data.ETC_FILE_ID)
  } else {
    return
  }
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
  }
}

defineExpose({
  getData
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <div class="content-area">
      <v-sheet height="95%" class="mb-3">
        <RealGrid
          ref="grdMain"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
          :column-layout="grdMainProps.columnLayout"
          @onCellItemClicked="onCellItemClicked"
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
  min-height: 450px;
}
</style>
