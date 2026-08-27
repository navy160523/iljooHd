<!--
  화면명 : MNGAA0030Popup.vue
  화면개요 : HSE 중점추진사항 실적 등록 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import DeptPopup from '@/components/popup/DeptPopup.vue'
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import IUpload from '@/components/IUpload.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import {
  startDragging,
  handleDragging,
  stopDragging,
} from "@/utils/useDrag.js"
import _ from "lodash"

const emit = defineEmits(["selected", 'afterSearch'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const mngaa0030PopupDialog = ref(null)
const grdMain = ref(null)
const fileUpload = ref(null)
const guid2 = ref('')

const radioGubun = reactive([
  { name: '안전', code: '1' },
  { name: '보건', code: '2' },
  { name: '환경', code: '3' },
])


const detailData = reactive({
  MONTH: '',
  HSE_DIV: '',
  CYCLE_DESC: '',
  DETAIL_ITEM: '',
  PLAN_ITEM: '',
  PLAN_CYCLE_DESC: '',
})

// 팝업 오픈 함수
const openPopup =  params => {
  fileUpload.value.a = ''
  //console.log('params:',params)
  detailData.MONTH = params.MONTH
  detailData.HSE_DIV = params.HSE_DIV
  detailData.CYCLE_DESC = params.CYCLE_DESC
  detailData.DETAIL_ITEM = params.DETAIL_ITEM
  detailData.PLAN_ITEM = params.PLAN_ITEM
  detailData.PLAN_CYCLE_DESC = params.PLAN_CYCLE_DESC

  commonSearchApi({ queryId : 'MNGAA0030_POP_SEARCH_01', param: params }).then( res => {
    //console.log('res값@@@@@',res)
    let setGuid = ''
    
    if(res.ORESULT_CUR.length == 0){
      // 첨부된 파일이 없을때
      fileUpload.value.setGuid()
      
      let saveParams = []
      
      let quarter = ''
      if(params.MONTH.includes('01') || params.MONTH.includes('02') || params.MONTH.includes('03')) {
        quarter = '1'
      }
      else if(params.MONTH.includes('04') || params.MONTH.includes('05') || params.MONTH.includes('06')) {
        quarter = '2'
      }
      else if(params.MONTH.includes('07') || params.MONTH.includes('08') || params.MONTH.includes('09')) {
        quarter = '3'
      }
      else if(params.MONTH.includes('10') || params.MONTH.includes('11') || params.MONTH.includes('12')) {
        quarter = '4'
      }

      // 저장
      const saveParam = reactive({
        CMPNY_DIV : params.CMPNY_DIV,
        YEAR : params.YEAR,
        BSNS_CD : params.BSNS_CD,
        DEPT_CD : params.DEPT_CD,
        ASGN_CD : params.ASGN_CD,
        HSE_DIV : params.HSE_DIV,
        QUARTER : quarter,
        AHEAD_NO : params.AHEAD_NO,
        DETAIL_NO : params.DETAIL_NO,
        PLAN_NO : params.PLAN_NO,
        MONTH : params.MONTH,
        WEEK : '1',
        ATTACH_ID : fileUpload.value.guid,
        INSERT_USER_ID : userStore.userId,
      })
      
      saveParams.push(saveParam)
      
      // console.log('saveParam:',saveParam)
      commonExecuteApi({ queryId : 'MNGAA0030_POP_SAVE_01', list: saveParams }).then( res => {
        
        // console.log('saveres:',res)
      })
      
      
    }
    else {
      // 첨부된 파일이 있을 때
      for(let i=0;i<res.ORESULT_CUR.length;i++){
        setGuid += res.ORESULT_CUR[i].ATTACH_ID+','
      }
      guid2.value = res.ORESULT_CUR[0].ATTACH_ID
      fileUpload.value.setGuid(setGuid)
    }
    
    // console.log('fileUpload가기 전 guid 체크:',fileUpload.value.guid)
    
    
    fileUpload.value.onButtonsClick({ id: "btnSearch" })
  })
  mngaa0030PopupDialog.value = true
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === "btnClose") {
    onClose()
  }
}

const onClose = () => {
  mngaa0030PopupDialog.value = false
  for(let i in detailData){
    detailData[i] = ""
  }
  fileUpload.value.setGuid()
  guid2.value = ''
  fileUpload.value.clearGrid()
  emit("afterSearch")
}

// const deleteData = data => {

//   //console.log('data:',data)

  
//   new deleteFlowHelper(vm, t)
//     .setQuery(() => {
//       commonExecuteApi({ queryId : 'MNGAA0030_POP_DELETE_01', list: data })
//     })
//     .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
//     //.run()
// }


// onMounted(() => {
//   window.addEventListener("mousemove", mouseUpdate)
// })

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="mngaa0030PopupDialog"
    eager
    persistent
    width="700"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>HSE 중점 추진사항 실적 등록</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-0">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column pt-0 pb-0" style="background-color: white !important;">
          <!-- <ILabel :label="$t('내/외부')">
            <template #editor="editorProps">
              <VRadioGroup
                v-model="detailData.HSE_DIV"
                class="ml-2 pl-3 radio"
                inline
              >
                <VRadio
                  v-for="(item, i) in radioGubun"
                  :key="i"
                  :value="item.code"
                  :label="item.name"
                  disabled
                />
              </VRadioGroup>
            </template>
          </ILabel> -->

          
        <div>
          <div style="font-size: 14px; color: #222; font-weight: 400;">내/외부</div>
          <VRadioGroup
            v-model="detailData.HSE_DIV"
            class="mt-auto"
            style="margin-left:0px !important; padding-left: 0px !important;"
            inline
          >
          <div class="radio pl-2 pr-2 ml-0 ">
            <VRadio 
              v-for="(item, i) in radioGubun"
              :key="i"
              :value="item.code"
              :label="item.name"
              disabled
            />
          </div>
          </VRadioGroup>
        </div>
        
        
        
        <div class="mt-2" style="font-size: 14px; color: #222; font-weight: 400;">관리기준</div>
        <div class="d-flex">
          <VTextField
            v-model="detailData.CYCLE_DESC"
            style="width:100px; margin-right: 20px;"
            readonly
          />

          <VTextField
            v-model="detailData.PLAN_CYCLE_DESC"
            style="width:200px;"
            readonly
          />

        </div>

        <!-- <div class="mt-2">
          <div style="font-size: 14px; color: #222; font-weight: 400;">세부내용</div>
          <VTextarea
            v-model="detailData.DETAIL_ITEM"
            width="625px"
            rows="3"
            readonly
          />
        </div> -->

        <div class="mt-2">
          <div style="font-size: 14px; color: #222; font-weight: 400;">실행방안</div>
          <VTextarea
            v-model="detailData.PLAN_ITEM"
            width="625px"
            rows="3"
            readonly
          />
        </div>
       
    </v-sheet>

      <v-sheet class="h-auto">
        <IUpload ref="fileUpload" style="height:370px" :guid2="guid2" @deleteData="deleteData" />
      </v-sheet>

        </div>
      </v-card-text>

    </v-card>
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.radio{
  margin-left: 10px; 
  height: 35px; 
  width: 250px;
  padding-top:3px;
  border: 1px solid #E4E4E4;
  background-color:#EEEEEE;
  border-radius: 2px;
}
</style>
