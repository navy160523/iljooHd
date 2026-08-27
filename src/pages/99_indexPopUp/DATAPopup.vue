<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonRequest } from "@hiway/api/commonApi"
import IGridTitle from "@/components/IGridTitle.vue"
import Message from "@hiway/utils/notify"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import IUpload from "@/components/IUpload.vue"

const props = defineProps({
  id: {
    Type: String,
    default: "",
  },
})

const emit = defineEmits(["after-search"])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const isCreate = ref(false)
const fileVisible = ref(false) //파일업로드 visible 플래그
const fileUploadButton = reactive(["btnDownLoad"])

const searchParam = reactive({
  CMPNY_DIV: "",
  NOTICE_DIV: "",
  NOTICE_NO: "",
})

const saveParam = reactive([
  {
    CMPNY_DIV: "",
    FILE_CNT: "",
    INSERT_DATE: "",
    KOR_NM: "",
    NOTICE_CNT: "",
    NOTICE_FILEID: "",
    NOTICE_NO: "",
    NOTICE_NOTE: "",
    NOTICE_POPUP: "",
    NOTICE_REG_EMPNO: "", //실제로 DB에 넘어가는 유저 코드
    NOTICE_TAG: "",
    NOTICE_TITLE: "",
    USER_ID: "",
    NOTICE_DIV: "",
  },
])

const openPopup = (gbn) => {
  if (gbn) {
    /* ********************* 기존 저장 데이터 ******************* */
    for (let i in searchParam) {
      for (let j in gbn) {
        if (i === j) {
          searchParam[i] = gbn[j]
        }
      }
    }
    setDisableButton(gbn.NOTICE_REG_EMPNO)
    if (userStore.userId === gbn.NOTICE_REG_EMPNO) {
      fileVisible.value = true
    } else {
      fileUpload.value.diableFileUploadButton(["btnDelete"])
    }
  } 

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
  commonRequest("/hse/main/MAINPAGE_SEARCH_02", { queryId: "MAINPAGE_SEARCH_02", param: searchParam })
    .then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        Message.success(t('조회 되었습니다.'))
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
      checkFileId()
    })
}

/* ********** 닫기 ********** */
const closePopup = () => {
  for (let i in saveParam[0]) {
    saveParam[0][i] = ""
    if (i === "NOTICE_NOTE") {
      saveParam[0][i] = ckEditor.value.setContent("")
    }
  }

  for (let j in searchParam) {
    searchParam[j] = ""
  }

  /* 팝업 닫을때 파일첨부 그리드 초기화 */
  fileUpload.value.clearGrid()

  emit("after-search")
  isCreate.value === false
  dialog.value = false
  fileVisible.value = false
  fileUpload.value.enableFileUploadButton(["btnDelete"])
  setEnableButton()
}

const setDisableButton = (userId) => {
  if (userId != userStore.userId) {
    menuTitle.value.disableBtn("btnDelete", true)
    menuTitle.value.disableBtn("btnUpdate", true)
  }
}

const setEnableButton = () => {
  menuTitle.value.disableBtn("btnDelete", false)
  menuTitle.value.disableBtn("btnUpdate", false)
}

defineExpose({
  openPopup,
})

onMounted(() => {
  // fileUpload.value.setGuid() //guid설정
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="940"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>자료 상세</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2 pt-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="saveParam[0].NOTICE_TITLE"
                :label="$t('제목')"
                label-width="80px"
                width="870px"
                top-label
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="saveParam[0].KOR_NM"
                top-label
                :label="$t('작성자')"
                width="200px"
                label-width="80px"
                readonly
              />
              <i-input
                v-model="saveParam[0].INSERT_DATE"
                :label="$t('작성일')"
                width="200px"
                label-width="80px"
                readonly
                top-label
              />
            </div>
          </v-sheet>
          <v-sheet height="50%" class="mb-2">
            <CKEditor :id="props.id" ref="ckEditor" v-model="saveParam[0].NOTICE_NOTE" class="mt-2" isReadOnly="true"/>
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              :is-visibled="fileVisible"
              auto-upload
              style="height: 370px"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
