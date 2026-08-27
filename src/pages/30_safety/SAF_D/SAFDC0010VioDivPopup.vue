<!-- SI2팀 김성근  위험작업 허가서 현황 / 작업장소선택 팝업  -->
<script setup>
import { ref, reactive, watch } from "vue"
import IMenuTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi, 
  getCodeList,
} from "@hiway/api/commonApi"
import Message from "@hiway/utils/notify"
import { useUserStore } from "@hiway/stores/user"

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dataInt = reactive({})
const dialog = ref(false)
const emit = defineEmits(["selected"])
const codeList = reactive({})
const intFlag = ref(false)
const bsns_cd = ref("")

const openPopup = (popupParam) => {
  console.log(popupParam, "popupParam??")
  bsns_cd.value = popupParam

  Promise.all([
    getCodeList('HHIF110'),
  ]).then((res) => {
    codeList.VIO_GDIV = res[0].ORESULT_CUR.filter((x) => !x.COD.includes('S') && !x.COD.includes('C'))
  })

  dataInt.VIO_GDIV = ''
  dataInt.VIO_MDIV = ''

  dialog.value = true
}

const onButtonsClick = (btn) => {
  if (btn.id === "btnChk") {
    let GDIVNM = ''
    let MDIVNM = ''

    if (!dataInt.VIO_GDIV || !dataInt.VIO_MDIV) {        
      return Message.warn(t("위반 종류 및 위반종류 상세는 필수 선택입니다."))      
    }
    
    GDIVNM = codeList.VIO_GDIV.filter((x) => x.COD === dataInt.VIO_GDIV)
    MDIVNM = codeList.VIO_MDIV.filter((x) => x.COD === dataInt.VIO_MDIV)
    dataInt.VIO_GDIV_NM = GDIVNM[0].TXT
    dataInt.VIO_MDIV_NM = MDIVNM[0].TXT

    emit("selected", dataInt)
    dialog.value = false   
  }
  if (btn.id == "btnClose") {
    dialog.value = false
  }
}

// 위반 종류 변경시
watch(
  () => dataInt.VIO_GDIV,
  (newValue, oldValue) => {
    console.log(newValue, "newValue??")
    codeList.VIO_MDIV = []    
    
    commonSearchApi({
      queryId: 'SAFDC0010_SEARCH_03',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: bsns_cd.value,
      },
    }).then((res) => {
      codeList.VIO_MDIV = res.ORESULT_CUR.filter((x) => x.UP_COD.includes(newValue))
    })
  }
)

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="540"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move mb-0"
      @mousedown="startDragging"
    >
      <span>위반종류 선택</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnChk', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>      
      <div class="pa-5">
        <i-select
          :label="t('위반 종류')"
          top-label
          :items="codeList.VIO_GDIV"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          v-model="dataInt.VIO_GDIV"
          @click="intFlag = false"
          required
        />
        <i-select
          top-label
          :label="t('위반 종류 상세')"
          :items="codeList.VIO_MDIV"
          item-title="TXT"
          item-value="COD"
          margin="4px"
          v-model="dataInt.VIO_MDIV"
          @click="intFlag = false"
          required
        />        
      </div>
    </v-card>    
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
div {
  margin-bottom: 8px;
}
</style>
