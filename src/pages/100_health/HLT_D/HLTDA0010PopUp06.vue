<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from "@hiway/api/commonApi"
import IUpload from "@/components/IUpload.vue"

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const fileVisible = ref(false) //파일업로드 visible 플래그
const isCreate = ref(false)
const fileUploadButton = reactive(["btnDownLoad", "btnClose"])

const searchParam = reactive({
  CMPNY_DIV: "HHI",
  NOTICE_DIV: "MNZFCB11001Y",
  NOTICE_NO: "8", 
})

const saveParam = reactive([
  {
    NOTICE_FILEID: "",
  },
])

const openPopup = () => {
  dialog.value = true
  onButtonsClick({ id: "btnSearch" })
}

const checkFileId = () => {
  if (saveParam[0].NOTICE_FILEID === null || saveParam[0].NOTICE_FILEID === undefined) {
    fileUpload.value.setGuid()
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(saveParam[0].NOTICE_FILEID)
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    search()
  } else {
    closePopup()
  }
}

/* ******************************* 조회 ***************************** */
const search = () => {
  commonRequest("/hse/data/DATCA0030_SEARCH_02", { queryId: "DATCA0050_SEARCH_02", param: searchParam })
    .then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        for (let i in saveParam[0]) {
          for (let j in res.ORESULT_CUR[0]) {
            if (i === j) {
              saveParam[0][i] = res.ORESULT_CUR[0][j]

              if (i === "NOTICE_NOTE") {
                saveParam[0][i] = ckEditor.value.setContent(res.ORESULT_CUR[0][j])
              }
            }
          }
        }
      }
    })
    .finally(() => {
      checkFileId()
    })
}

const closePopup = () => {
  fileUpload.value.clearGrid()
  isCreate.value === false 
  dialog.value = false
  fileVisible.value = false
}

defineExpose({
  openPopup,
})

onMounted(() => {
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
    height="400"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
    <span>화학물질 취급 안내 자료</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              auto-upload
              :is-visibled="fileVisible"
              style="height: 300px"
              :isCmpnyDiv="false"
              :gridTitle="''" 
              @close="closePopup"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
