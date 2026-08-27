<!-- 
  * Vue 내 용 : 평가지 미리보기
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/03/28
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/03/28 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import _ from "lodash"
import { isEmpty } from "@/@core/utils"

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  x.value = event.pageX
  y.value = event.pageY
}

const popupParams = reactive({
  CMPNY_DIV : '',
  EVAL_ID : '',
  TITLE : '',
  EVAL_DESC : '',
})

const queParams = reactive({
  elements : [],
})

const openPopup = val => {
  console.log("openPopup", val)
  
  popupParams.CMPNY_DIV = val.CMPNY_DIV
  popupParams.EVAL_ID = val.EVAL_ID
  popupParams.TITLE = val.TITLE
  popupParams.EVAL_DESC = val.EVAL_DESC

  createPreview()

  dialog.value = true
}

const onClose = () => {
  popupParams.CMPNY_DIV = ''
  popupParams.EVAL_ID = ''
  popupParams.TITLE = ''
  popupParams.EVAL_DESC = ''

  if (queParams.elements.length > 0) {
    queParams.elements.splice(0)
  }

  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnClose')
  {
    onClose()
  }
}

const createPreview = () => {

  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
}

const searchData = () =>{

  // 선택한 설문지의 설문 문항 ID 구하기
  return commonSearchApi({ queryId : 'OPRAH0030_SEARCH_04', param: popupParams })
}

const afterSearch = async res =>{

  let resVal = res.ORESULT_CUR

  console.log("[afterSearch] resVal : ", resVal)
  console.log("[afterSearch] queParams 1: ", queParams)

  for(let i=0; i < resVal.length; i++) {

    await commonSearchApi(
      { 
        queryId: "OPRAH0030_SEARCH_05", 
        param: { 
          CMPNY_DIV: popupParams.CMPNY_DIV,
          QSTN_ID: resVal[i].QSTN_ID,
          SEQ: resVal[i].SEQ,
        },
      }).then( res2 => {

      let resCUR1 = res2.ORESULT_CUR[0]
      let resCUR2 = res2.ORESULT_CUR2[0]

      let strQSTN_TITLE = ''
      let strBIGO_TITLE = ''
      
      if(!isEmpty(resCUR1)) {
        strQSTN_TITLE = resCUR1.QSTN_TITLE
      }

      if(!isEmpty(resCUR2)) {
        strBIGO_TITLE = resCUR2.BIGO_TITLE
      }

      const newElement = {
        QSTN_TITLE: strQSTN_TITLE,
        BIGO_TITLE: strBIGO_TITLE,
      }

      queParams.elements.push(newElement)
    })
  }
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1050"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>평가지 미리보기</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <h1 class="mb-5">
            {{ popupParams.TITLE }}
          </h1>
          <h2 class="mb-5">
            {{ popupParams.EVAL_DESC }}
          </h2>
          <div 
            v-for="(element, index) in queParams.elements"
            :key="index"
            class="mb-4"
          >
            <v-card 
              color="#e2e3e5" 
              class="pa-3"
            >
              <h4>
                {{ element.QSTN_TITLE }}
              </h4>
              <P class="ma-1 pa-2 bigo">
                {{ element.BIGO_TITLE }}
              </P>
            </v-card>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.bigo {
  background: #f5f5f5;
  border-radius: 10px;
}
</style>