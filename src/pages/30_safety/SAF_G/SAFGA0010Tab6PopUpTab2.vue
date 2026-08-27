<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : Tab6팝업 (사고보고서 열람)  - Tab1(사고보고서 -1)  -->

<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import dayjs from "dayjs"
import { useUserStore } from "@hiway/stores/user"
import IUploadImageSingle from "@/components/IUploadImageSingle.vue"
import IUpload from "@/components/IUpload.vue"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const intData = ref({})
const codeList = reactive([])
const grdMain = ref(null)
const fileUpload = ref(null)

const props = defineProps({
  dataCheck: {
    type: Array,
    required: false,
    default() {
      return []
    },
  },
})

onMounted(() => {
  Promise.all([
    getCodeList("HHIB180"), //책임 조회
    getCodeList("HHIB050"), //공정 조회
    getCodeList("HHIF110"), //수칙위반 구분 조회
  ]).then((res) => {
    console.log(res, "res")
    codeList.RESPON_DIV = res[0].ORESULT_CUR
    codeList.PROCESS_CD = res[1].ORESULT_CUR
    codeList.SUCHIC_DIV_CD = res[2].ORESULT_CUR
  })

  searchData(props.dataCheck[0])
})

// 데이터 넣기

const searchData = async (row) => {
  await commonSearchApi({
    queryId: "SAFGA0010_search08",
    param: row,
  }).then((res) => {
    intData.value = res.ORESULT_CUR[0]
    if (intData.value.OCCUR_DT) {
      intData.value.OCCUR_DT = dayjs(intData.value.OCCUR_DT).format(
        "YYYY-MM-DD"
      )
    }
    if (intData.value.SAGO_RCV_DT) {
      intData.value.SAGO_RCV_DT = dayjs(intData.value.SAGO_RCV_DT).format(
        "YYYY-MM-DD"
      )
    }
    console.log(intData.value, "intData.value")
  })
  commonSearchApi({
    queryId: "SAFGA0010_search10",
    param: row,
  }).then((res) => {
    console.log(res.ORESULT_CUR)
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
  checkFileIdSaGo()
}

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["RSN_GRP_NM2", "RSN_CD"],
  fields: [
    {
      fieldName: "RSN_GRP_NM1",
      dataType: "text",
      header: { text: t("구분") },
      mergeRule: { criteria: "value" },
      editable: false,
    },
    {
      fieldName: "RSN_GRP_NM2",
      dataType: "text",
      header: { text: t("구분") },
      editable: false,
    },
    {
      fieldName: "RSN_NM",
      dataType: "text",
      header: { text: t("원인") },
      editable: false,
    },
    {
      fieldName: "RSN_DET",
      dataType: "text",
      header: { text: t("상세원인") },
      styleName: "editable_column",
    },
    {
      fieldName: "DAECHEK",
      dataType: "text",
      header: { text: t("재발방지대책") },
      styleName: "editable_column",
    },
    {
      fieldName: "RSN_CD",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "RSN_GRP_CD1",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "RSN_GRP_CD2",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "SAGO_SN",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",

      visible: false,
    },
    {
      fieldName: "SAVE_YN",
      dataType: "text",

      visible: false,
    },

    {
      fieldName: "REMARK",
      dataType: "text",

      visible: false,
    },
  ],
  columns: [],
  columnLayout: [
    {
      name: "구분",
      direction: "horizontal",
      hideChildHeaders: true,
      header: {
        text: t("구분"),
      },
      items: ["RSN_GRP_NM1", "RSN_GRP_NM2"],
    },
    "RSN_NM",
    "RSN_DET",
    "DAECHEK",
  ],
})

grdProps1.columns = grdProps1.fields

//  진술 파일 업로드(사고 즉보)
const checkFileIdSaGo = () => {
  console.log("업로드 ")
  if (
    intData.value.WRT_FILE_ID === null ||
    intData.value.WRT_FILE_ID === undefined
  ) {
    fileUpload.value.setGuid()
    intData.value.WRT_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(intData.value.WRT_FILE_ID)
    intData.value.WRT_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
  fileUpload.value.diableFileUploadButton(["btnDelete"])
}
</script>

<template>
  <v-card class="overflowY">
    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0"> 사건 개요 </v-card-title>

      <v-card-text class="ml-2 mt-3">
        <v-sheet class="d-flex">
          <i-input
            top-label
            :label="$t('발생일자')"
            type="Date"
            width="150px"
            margin="4px"
            readonly
            v-model="intData.OCCUR_DT"
          />
          <i-input
            placeholder="HH:MM"
            top-label
            :label="$t('')"
            type="Text"
            width="80px"
            margin="10px"
            readonly
            v-model="intData.OCCUR_TIME"
          />

          <i-input
            top-label
            :label="$t('사고분류')"
            width="150px"
            margin="4px"
            readonly
            v-model="intData.SAGO_DIV_L_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            width="120px"
            margin="4px"
            readonly
            v-model="intData.SAGO_DIV_M_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            width="120px"
            margin="10px"
            readonly
            v-model="intData.SAGO_DIV_S_NM"
          />
          <i-input
            top-label
            :label="$t('발생장소')"
            width="120px"
            margin="4px"
            readonly
            v-model="intData.SAGO_LOC_L_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            width="120px"
            margin="4px"
            readonly
            v-model="intData.SAGO_LOC_M_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            width="120px"
            margin="10px"
            readonly
            v-model="intData.SAGO_LOC_S_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            margin="10px"
            width="320px"
            readonly
            v-model="intData.SAGO_LOC_DTL"
          />
        </v-sheet>
      </v-card-text>
    </v-card>

    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0"> 사고 상세 </v-card-title>

      <v-card-text class="ml-2 mt-3">
        <v-sheet class="d-flex">
          <i-input
            top-label
            :label="$t('사고접수일')"
            type="Date"
            width="150px"
            margin="10px"
            readonly
            v-model="intData.SAGO_RCV_DT"
          />
          <i-select
            top-label
            :label="$t('책임')"
            v-model="intData.RESPON_DIV"
            :items="codeList.RESPON_DIV"
            item-value="COD"
            item-title="TXT"
            readonly
            width="100px"
            margin="10px"
          />

          <i-input
            top-label
            :label="$t('재해소속')"
            width="340px"
            margin="10px"
            readonly
            v-model="intData.INJR_ORGN_FULL_NMT"
          />
          <i-input
            top-label
            :label="$t('책임소속')"
            type="Text"
            width="340px"
            margin="10px"
            readonly
            v-model="intData.RESP_ORGN_FULL_NMT"
          />
        </v-sheet>
        <v-sheet class="d-flex mt-3">
          <i-select
            top-label
            :label="$t('공정')"
            v-model="intData.PROCESS_CD"
            :items="codeList.PROCESS_CD"
            item-value="COD"
            item-title="TXT"
            readonly
            width="150px"
            margin="10px"
          />

          <i-input
            top-label
            :label="$t('기인물')"
            width="150px"
            margin="4px"
            readonly
            v-model="intData.GIINMUL1_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            width="150px"
            margin="10px"
            readonly
            v-model="intData.GIINMUL2_NM"
          />

          <i-select
            top-label
            :label="$t('수칙위반 구분')"
            v-model="intData.SUCHIC_DIV_CD"
            :items="codeList.SUCHIC_DIV_CD"
            item-value="COD"
            item-title="TXT"
            readonly
            width="150px"
            margin="10px"
          />
        </v-sheet>
      </v-card-text>
    </v-card>

    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0">
        재해원인 및 예방대책 <span style="font-size: 14px">(위험성평가)</span>
      </v-card-title>

      <v-card-text class="ml-2 mt-3">
        <v-sheet>
          <i-input
            :label="$t('표준작업지도서번호')"
            type="Text"
            width="300px"
            margin="10px"
            readonly
            v-model="intData.WRK_GUD_NO"
          />

          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 160px"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
          />
        </v-sheet>
      </v-card-text>
    </v-card>

    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0"> 사고 보고서 첨부 </v-card-title>

      <v-card-text class="ml-2 mt-3">
        <v-sheet class="d-flex">
          <IUpload
            gridTitle="　"
            :gridOnly="true"
            :isVisibled="false"
            :showSearchMessage="false"
            ref="fileUpload"
            style="height: 250px; padding-top: 12px !important"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-card>
</template>

<style scoped>
.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}
.fileDiv {
  width: 420px;
  padding: 12px;
  background: #fff;
}
</style>
