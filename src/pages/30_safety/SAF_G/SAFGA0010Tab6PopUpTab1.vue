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
const codeList = reactive({})
const grdMain = ref(null)
const fileUpload = ref(null)
const fileUpload1 = ref(null)
const fileUpload2 = ref(null)
const fileUpload3 = ref(null)
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
    getCodeList("HHIB320"), //0
    getCodeList("HHIB070"), //1
  ]).then((res) => {
    codeList.GUGUP_USE = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn(
      "RPT_TYPE_CD",
      res[1].ORESULT_CUR,
      "COD",
      "TXT"
    )
  })
  searchData(props.dataCheck[0])
  console.log(props.dataCheck[0])
})

// 데이터 넣기

const searchData = async (row) => {
  await commonSearchApi({
    queryId: "SAFGA0010_search08",
    param: row,
  }).then((res) => {
    console.log(res, "res")
    intData.value = res.ORESULT_CUR[0]
    if (intData.value.OCCUR_DT) {
      intData.value.OCCUR_DT = dayjs(intData.value.OCCUR_DT).format(
        "YYYY-MM-DD"
      )
    }
  })
  commonSearchApi({
    queryId: "SAFGA0010_search09",
    param: row,
  }).then((res) => {
    console.log(res.ORESULT_CUR)
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
  checkFileId()
  checkFileIdSaGo()
}

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["BIRTHDAY", "NAME", "SOSOG_DESC"],
  fields: [
    {
      fieldName: "PRSN_DIV_NM",
      dataType: "text",
      header: { text: t("구분") },
      editable: false,
    },

    {
      fieldName: "SOSOG_DIV_NM",
      dataType: "text",
      header: { text: t("소속구분") },
      editable: false,
    },
    {
      fieldName: "RPT_TYPE_CD",
      dataType: "text",
      header: { text: t("처리구분") },
      lookupDisplay: true,
      editor: { type: "dropdown" },
    },
    {
      fieldName: "SOSOG_DESC",
      dataType: "text",
      header: { text: t("소속조직명") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "INJURY_TYPE_NM",
      dataType: "text",
      header: { text: t("상해종류") },
      editable: false,
    },
    {
      fieldName: "AGE",
      dataType: "text",
      header: { text: t("연령(만)") },
      editable: false,
    },

    {
      fieldName: "IPSAIL",
      header: { text: t("입사일자") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "JIKJONG_NM",
      dataType: "text",
      header: { text: t("직종") },
      editable: false,
    },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

// 파일 관련(싱글 이미지)
const checkFileId = async () => {
  for (let i = 1; i <= 3; i++) {
    let PIC_FILE_ID = `PIC_FILE_ID${i}`
    let fileUpload = eval(`fileUpload${i}.value`)
    if (
      intData.value[PIC_FILE_ID] === null ||
      intData.value[PIC_FILE_ID] === undefined
    ) {
      fileUpload.setGuid()
      intData.value[PIC_FILE_ID] = fileUpload.guid
      await fileUpload.onButtonsClick({ id: "btnSearch" })
    } else {
      //파일아이디 있을때
      fileUpload.setGuid(intData.value[PIC_FILE_ID])
      intData.value[PIC_FILE_ID] = fileUpload.guid
      await fileUpload.onButtonsClick({ id: "btnSearch" })
    }
  }
  disabledGridBtn()
}

const disabledGridBtn = async () => {
  await nextTick()
  fileUpload1.value.setDisable(["btnAttach", "btnFileUpload", "btnDelete"])
  fileUpload2.value.setDisable(["btnAttach", "btnFileUpload", "btnDelete"])
  fileUpload3.value.setDisable(["btnAttach", "btnFileUpload", "btnDelete"])
}

//  진술 파일 업로드(사고 즉보)
const checkFileIdSaGo = () => {
  console.log("업로드 ")
  if (intData.value.FILE_ID === null || intData.value.FILE_ID === undefined) {
    fileUpload.value.setGuid()
    intData.value.FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(intData.value.FILE_ID)
    intData.value.FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
  fileUpload.value.diableFileUploadButton(["btnDelete"])
}
</script>

<template>
  <v-card class="overflowY">
    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0"> 사고개요 </v-card-title>

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
            :label="$t('사고형태')"
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
            width="150px"
            margin="4px"
            readonly
            v-model="intData.SAGO_LOC_L_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            width="150px"
            margin="4px"
            readonly
            v-model="intData.SAGO_LOC_M_NM"
          />
          <i-input
            top-label
            :label="$t('')"
            type="Text"
            width="180px"
            margin="10px"
            readonly
            v-model="intData.SAGO_LOC_S_NM"
          />
          <i-select
            top-label
            :label="$t('구급차 이용여부')"
            v-model="intData.GUGUP_USE"
            :items="codeList.GUGUP_USE"
            item-value="COD"
            item-title="TXT"
            readonly
          />
        </v-sheet>
        <v-sheet class="d-flex mt-3">
          <i-input
            top-label
            :label="$t('작업표준')"
            type="Text"
            width="230px"
            margin="10px"
            v-model="intData.WRK_STD_NM"
            readonly
          />
          <div>
            <p style="color: #222">{{ $t("위험성재평가") }}</p>
            <v-radio-group inline v-model="intData.WIHEOM_YN" class="radio-box">
              <v-radio label="필요" value="Y" readonly></v-radio>
              <v-radio label="불필요" value="N" readonly></v-radio>
            </v-radio-group>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>

    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0">
        인적사항
        <span style="font-size: 14px"
          >재해자 또는 유발자만 입력가능 (목격자는 사고개요에 표기)</span
        >
      </v-card-title>

      <v-card-text class="ml-2 mt-3">
        <v-sheet class="d-flex">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 160px"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
          />
        </v-sheet>
      </v-card-text>
    </v-card>

    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0"> 사고개요 </v-card-title>

      <v-card-text class="ml-2 mt-3">
        <v-sheet class="d-flex">
          <i-textarea
            readonly
            label-width="120px"
            top-label
            v-model="intData.SAGO_GAEYO"
            width="100%"
          />
        </v-sheet>
      </v-card-text>
    </v-card>

    <v-card class="mb-3 mr-1 popUp-input-Form">
      <v-card-title class="pa-0">
        <IGridTitle :title="$t('사고 상황 사진')">
          <template #editors />
        </IGridTitle>
      </v-card-title>
      <v-card-text class="pa-0">
        <div>
          <div class="d-flex justify-space-between">
            <div class="fileDiv">
              <IUploadImageSingle
                ref="fileUpload1"
                style="height: 400px"
                :showMessage="false"
              />
              <i-textarea
                readonly
                class="mt-5"
                rows="1"
                width="397px"
                v-model="intData.PIC_1_DESC"
                placeholder="사진설명"
              />
            </div>
            <div class="fileDiv">
              <IUploadImageSingle
                top-label
                ref="fileUpload2"
                style="height: 400px"
                :showMessage="false"
              />
              <i-textarea
                readonly
                top-label
                width="397px"
                class="mt-5"
                rows="1"
                v-model="intData.PIC_2_DESC"
                placeholder="사진설명"
              />
            </div>
            <div class="fileDiv">
              <IUploadImageSingle ref="fileUpload3" style="height: 400px" />
              <i-textarea
                readonly
                class="mt-5"
                v-model="intData.PIC_3_DESC"
                rows="1"
                width="397px"
                placeholder="사진설명"
              />
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="my-3 popUp-input-Form">
      <v-card-title class="pa-0"> 사고즉보 첨부 </v-card-title>

      <v-card-text class="ml-2 mt-3">
        <v-sheet class="d-flex">
          <IUpload
            gridTitle="　"
            :isVisibled="false"
            :showSearchMessage="false"
            :gridOnly="true"
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
