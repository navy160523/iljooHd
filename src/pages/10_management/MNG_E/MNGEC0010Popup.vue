<!--
  화면명 : MNGEC0010Popup.vue
  화면개요 :질의회시 등록/수정 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"
import CKEditor from "@/components/ckEditor/CKEditor.vue"
import CKViewer from "@/components/ckEditor/CKViewer.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import _ from 'lodash'

let dialog = ref(false)
const grdMain = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const logsStore = useLogsStore()
const menuTitle = ref(null)
const ckEditor = ref('')
const fileUpload = ref(null)
const emit = defineEmits(["after-search"])

const cOrM = ref(false) // 기존 글 클릭(true) 새로 생성 (false) 
const editTF = ref(false)

const buttonList = ref([])

const openPopup = async (flag, data) => {
  console.log('flag:',flag,' / data:',data)
  fileUpload.value.setGuid() //guid설정
  cOrM.value = flag
  editTF.value = flag
  // buttonList.value.length = 0
  buttonList.value = []
  if(flag) {
    // 글 있는 경우
    saveParam[0] = data
    saveParam[0].NOTICE_NOTE = ckEditor.value.setContent(data.NOTICE_NOTE)
    
    commonRequest("/hse/operation/save01", {
      queryId: "MNGEC0010_SAVE_02",
      list: saveParam,
    })

    if(data.NOTICE_REG_EMPNO === userStore.userId){
      buttonList.value = _.cloneDeep(['btnFileUpload', 'btnDownLoad', 'btnDelete'])
      menuTitle.value.setBtnProperty('btnDelete', 'visible', true)
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
      editTF.value = false
    }else{
      menuTitle.value.setBtnProperty('btnDelete', 'visible', false)
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', false)
      editTF.value = true
    }
    if(logsStore.isMenuAdmin === 'Y'){
      buttonList.value = _.cloneDeep(['btnFileUpload', 'btnDownLoad', 'btnDelete'])
      menuTitle.value.setBtnProperty('btnDelete', 'visible', true)
      menuTitle.value.setBtnProperty('btnUpdate', 'visible', true)
      editTF.value = false
    }
  }
  else {    
    // 새로 등록하는 경우
    for (let i in saveParam[0]) {
      saveParam[0][i] = ckEditor.value.setContent("")
    }
    saveParam[0].KOR_NM = userStore.userName
    saveParam[0].INSERT_DATE = dayjs().format('YYYY-MM-DD')
    buttonList.value = ['btnCreate','btnDownLoad','btnDelete']
  }
  await checkFileId()
  await setButton(flag)
  dialog.value = true
}

const checkFileId = async () => {
  if (saveParam[0].NOTICE_FILEID === null || saveParam[0].NOTICE_FILEID === undefined) {
    fileUpload.value.setGuid()
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    //fileUpload.value.onButtonsClick({ id: "btnSearch" })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(saveParam[0].NOTICE_FILEID)
    saveParam[0].NOTICE_FILEID = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  }
  
}

const saveParam = reactive([
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    FILE_CNT: "",
    INSERT_DATE: "",
    KOR_NM: "",
    NOTICE_CNT: "",
    NOTICE_FILEID: "",
    NOTICE_DIV: "MNZFDB11002Y",
    NOTICE_NO: "",
    NOTICE_NOTE: "",
    NOTICE_PERIOD: "A",
    NOTICE_POPUP: "",
    NOTICE_RANGE: "A",
    NOTICE_TAG: "",
    NOTICE_TITLE: "",
    SORT_NO: "",
    USER_ID: userStore.userId,
  },
])

const deleteParam = reactive([
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    NOTICE_DIV: "",
    NOTICE_NO: "",
  },
])

defineExpose({
  openPopup,
})


const onButtonsClick = (btn) => {
  if (btn.id === "btnUpdate") {
    saveParam[0].CMPNY_DIV = 'HHI'
    saveParam[0].NOTICE_DIV = 'MNZFDB11002Y'
    saveParam[0].USER_ID = userStore.userId
    saveParam[0].NOTICE_PERIOD = 'A'
    saveParam[0].NOTICE_RANGE = 'A'
    saveParam[0].NOTICE_NOTE = ckEditor.value.getContent() //ck에디터에 입력한 내용을 html태그로 변환해서 넣어줌
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(closePopup).run()
  } else if (btn.id === "btnDelete") {
    deleteParam[0].NOTICE_NO = saveParam[0].NOTICE_NO
    deleteParam[0].NOTICE_DIV = saveParam[0].NOTICE_DIV
    new deleteFlowHelper(vm, t)
        .setBefore(beforeDelete)
        .setQuery(deleteData)
        .setAfter(afterDelete)
        .run()
  } else {
    closePopup()
  }
}


const closePopup = () => {
  for (let i in saveParam[0]) {
    saveParam[0][i] = ""
  }
  fileUpload.value.clearGrid() //팝업 닫을때 파일첨부 그리드 초기화
  emit("after-search")
  dialog.value = false
  cOrM.value = null
}

const beforeDelete = () => {
  //등록화면에서 삭제시
  console.log('cOrM:',cOrM)
  if(!cOrM.value) {
    Message.warn("등록화면에서는 삭제 할 수 없습니다.")
    
    return false
  }
  //기존 등록된 공지사항 삭제시
  if(cOrM.value) {
    if(logsStore.isMenuAdmin === 'Y'){
      return true
    }
    if (saveParam[0].NOTICE_REG_EMPNO != userStore.userId) {
      Message.warn("다른사람의 게시물은 삭제할 수 없습니다.")

      return false
    }

    return true
  }

}

const deleteData = () => {
  return commonRequest("/hse/operation/save01", {
    queryId: "MNGEC0010_DELETE_01",
    list: deleteParam,
  })
}

const afterDelete = () => {
  closePopup()
}

const saveData = () => {
  saveParam[0].INSERT_DATE = saveParam[0].INSERT_DATE.replaceAll("-", "")
  //console.log('saveData에서 saveParam:',saveParam)
  
  return commonRequest("/hse/operation/save01", {
    queryId: "MNGEC0010_SAVE_01",
    list: saveParam,
  })
}

const beforeSave = () => {
  //console.log('beforeSave에서 saveParam',saveParam)
  //신규 공지사항 등록시
  if (!cOrM.value) {
    if (saveParam[0].NOTICE_TITLE === undefined || saveParam[0].NOTICE_TITLE === "") {
      Message.warn("제목을 입력해주세요.")
      
      return false
    } else if (saveParam[0].NOTICE_NOTE === undefined || saveParam[0].NOTICE_NOTE === "") {
      Message.warn("내용을 입력해주세요.")
      
      return false
    }
    
    return true
  }

  //기존 공지사항 수정시
  if (cOrM.value) {
    if (saveParam[0].NOTICE_REG_EMPNO != userStore.userId) {
      Message.warn("다른사람의 게시물은 수정할 수 없습니다.")

      return false
    }

    return true
  }

}

const setButton = async(flag) => {
  if(!flag){
    menuTitle.value.setBtnProperty('btnDelete', 'visible', false)
  }

}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
    height="1300"
    class="p-absolute"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>게시판 등록/수정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
    
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="saveParam[0].KOR_NM" 
                :readonly="true"
                width="250px"
                :label="$t('작성자')"
              />
              <i-input
                v-model="saveParam[0].INSERT_DATE" 
                :readonly="true"
                width="250px"
                :label="$t('작성일')"
              />
            </div>
            <div class="mt-1">
              <i-input
                v-model="saveParam[0].NOTICE_TITLE" 
                :readonly="editTF"
                width="930px"
                :label="$t('제목')"
                labelWidth="37px"
              />
            </div>
          </v-sheet>
          <v-sheet>
            <CKEditor ref="ckEditor" class="mt-2"  height="300px" style="background-color: white" v-model="saveParam[0].NOTICE_NOTE" :isReadOnly="editTF ? 'true' : 'false'"></CKEditor>
          </v-sheet>
          <v-sheet> 
            <IUpload ref="fileUpload" class="mt-2" :buttonList="buttonList._value" style="height: 400px" :isVisibled="!editTF" :gridOnly="editTF" :autoUpload="true"></IUpload>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card> 
  </v-dialog>
</template>
