<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 사고 세부사항 팝업  > 사고관리   -->
<!-- 이슈사항 : RCA 등록 비활성화 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { useLogsStore } from "@hiway/stores/logs"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import IUpload from "@/components/IUpload.vue"
import DeptPopup from "@/components/popup/DeptPopup.vue"
import dayjs from "dayjs"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from "@hiway/api/commonApi"
import saveFlowHelper from "@/utils/saveFlowHelper"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import SAFAB0020PopUp from "@/pages/30_safety/SAF_A/SAFAB0020PopUp.vue"

defineOptions({
  name: "30_safety-SAF_A-SAFAB0020",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const props = defineProps({
  popupParam: {
    type: Object,
    required: false,
    default() {
      return {}
    },
  },
})
// 팝업관련

const emit = defineEmits(["close", "upData"])

const Popdata = reactive({})
const fileUpload = ref(null)
const RCAUpload = ref(false)
const GridTitle1 = ref(false)
onMounted(() => {
  for (let i in props.popupParam) {
    Popdata[i] = props.popupParam[i]
  }
})

const onButtonsClick = (btn) => {
  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(SagoMCheck)
      .setQuery(SagoMSave)
      .setAfter(() => {
        onButtonsClick("btnSearch", "재해원인")
        emit("upData")
      })
      .run()
  }
}

// 사고관리 저장
const SagoMCheck = () => {
  return true
}
const SagoMSave = () => {
  let saveParams = [
    {
      CMPNY_DIV: Popdata.CMPNY_DIV,
      SAGO_SN: Popdata.SAGO_SN,
      SAGO_TYPE_CD: Popdata.SAGO_TYPE_CD,
      COME_SERIOUS_YN: Popdata.COME_SERIOUS_YN,
      RCA_FILE_ID: Popdata.RCA_FILE_ID,
      JEWE_YN: Popdata.JEWE_YN,
      OPEN_SCOPE: Popdata.OPEN_SCOPE,
      SLI_YN: Popdata.SLI_YN,
      JUNGDAE_YN: Popdata.JUNGDAE_YN,
      SAGO_HIDE_YN: Popdata.SAGO_HIDE_YN,
      SAGO_NM: Popdata.SAGO_NM,
    },
  ]

  return commonExecuteApi({ queryId: "SAFAB0020_save09", list: saveParams })
}

// RCA업로드

watch(
  () => fileUpload.value,
  (newValue) => {
    if (newValue !== null && newValue !== "" && newValue !== undefined) {
      checkFileId()
    }
  }
)

//  진술 파일 업로드
const checkFileId = () => {
  console.log("업로드 ")
  if (Popdata.RCA_FILE_ID === null || Popdata.RCA_FILE_ID === undefined) {
    fileUpload.value.setGuid()
    Popdata.RCA_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(Popdata.RCA_FILE_ID)
    Popdata.RCA_FILE_ID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
}

const uploaded = () => {
  SagoMSave()
}

watch(
  () => Popdata.COME_SERIOUS_YN,
  (newValue) => {
    console.log(newValue, "nee")
    if (newValue == "Y" || newValue == "S") {
      RCAUpload.value = true
    } else {
      RCAUpload.value = false
    }
  }
)

watch(
  () => props.popupParam,
  (newValue) => {
    for (let i in props.popupParam) {
      Popdata[i] = props.popupParam[i]
    }
    checkFileId()
  }
)
//  종결시 disable
watch(
  () => Popdata.APPROVAL_STATUS,
  (newValue) => {
    if (newValue == "종결") {
      // 사고 처리 구분
      GridTitle1.value.disableBtn("btnUpdate", true)
    }
  }
)
</script>

<template>
  <v-card>
    <!-- 인적사항 -->
    <v-card-title>
      <IMenuTitle
        ref="menuTitle"
        :button-list="['btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="overflowY">
      <v-card class="mb-3 mt-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle ref="GridTitle1" :title="$t('사고 처리 구분')">
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div></div>
        </v-card-text>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-card-title class="pa-0">
          <IGridTitle :title="$t('사고 강도')">
            <template #editors />
          </IGridTitle>
        </v-card-title>
        <v-card-text class="pa-0">
          <div>
            <div class="mb-3">
              <v-radio-group inline v-model="Popdata.COME_SERIOUS_YN">
                <v-radio label="일반" value="N"></v-radio>
                <v-radio label="중대(성)사고" value="Y"></v-radio>
                <v-radio label="사고중지" value="S"></v-radio>
              </v-radio-group>
            </div>
            <IUpload
              gridTitle="RCA등록"
              :showSearchMessage="false"
              v-if="RCAUpload"
              ref="fileUpload"
              @uploaded="uploaded"
              style="height: 400px"
            />
          </div>
        </v-card-text>
      </v-card>
      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-col cols="12" class="d-flex pa-0">
          <v-col cols="4" class="pa-0 pr-2">
            <v-card-title class="pa-0">
              <IGridTitle :title="$t('통계반영')">
                <template #editors />
              </IGridTitle>
            </v-card-title>

            <div>
              <v-radio-group inline v-model="Popdata.JEWE_YN">
                <v-radio label="미해당" value="Y"></v-radio>
                <v-radio label="해당" value="N"></v-radio>
              </v-radio-group>
            </div>
          </v-col>

          <v-col cols="4" class="pa-0 pr-2">
            <v-card-title class="pa-0">
              <IGridTitle :title="$t('공개범위')">
                <template #editors />
              </IGridTitle>
            </v-card-title>

            <div>
              <v-radio-group inline v-model="Popdata.OPEN_SCOPE">
                <v-radio label="미공개" value="0"></v-radio>
                <v-radio label="본부" value="1"></v-radio>
              </v-radio-group>
            </div>
          </v-col>

          <v-col cols="4" class="pa-0">
            <v-card-title class="pa-0">
              <IGridTitle :title="$t('SLI 집계')">
                <template #editors />
              </IGridTitle>
            </v-card-title>

            <div>
              <v-radio-group inline v-model="Popdata.SLI_YN">
                <v-radio label="해당" value="Y"></v-radio>
                <v-radio label="미해당" value="N"></v-radio>
              </v-radio-group>
            </div>
          </v-col>
        </v-col>
      </v-card>

      <v-card class="mb-3 mr-1 popUp-input-Form">
        <v-col cols="12" class="d-flex pa-0">
          <v-col cols="4" class="pa-0 pr-2">
            <v-card-title class="pa-0">
              <IGridTitle :title="$t('중대재해')">
                <template #editors />
              </IGridTitle>
            </v-card-title>

            <div>
              <v-radio-group inline v-model="Popdata.JUNGDAE_YN">
                <v-radio label="해당" value="Y"></v-radio>
                <v-radio label="미해당" value="N"></v-radio>
              </v-radio-group>
            </div>
          </v-col>

          <v-col cols="4" class="pa-0 pr-2">
            <v-card-title class="pa-0">
              <IGridTitle :title="$t('사고은폐')">
                <template #editors />
              </IGridTitle>
            </v-card-title>

            <div>
              <v-radio-group inline v-model="Popdata.SAGO_HIDE_YN">
                <v-radio label="해당" value="Y"></v-radio>
                <v-radio label="미해당" value="N"></v-radio>
              </v-radio-group>
            </div>
          </v-col>

          <v-col cols="4" class="pa-0">
            <v-card-title class="pa-0">
              <IGridTitle :title="$t('애매여부')">
                <template #editors />
              </IGridTitle>
            </v-card-title>

            <div>
              <v-radio-group inline v-model="Popdata.SAGO_NM">
                <v-radio label="해당" value="Y"></v-radio>
                <v-radio label="미해당" value="N"></v-radio>
              </v-radio-group>
            </div>
          </v-col>
        </v-col>
      </v-card>
      <!-- 팝업촌 -->

      <!-- @selectedArr="selectedArr" -->
    </v-card-text>
  </v-card>
</template>
