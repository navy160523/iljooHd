<!--
  화면명 : MNGAA0020Popup1.vue
  화면개요 :HSE 방침/목표/중점추진사항 - 전사 방침/목표 팝업
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from 'dayjs'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import {
  commonSearchApi,
  commonExecuteApi,
} from "@hiway/api/commonApi"
import {
  commonDownloadFilesApi,
} from "@hiway/api/commonFileApi"
import { useI18n } from "vue-i18n"
import { startDragging, handleDragging, stopDragging, } from "@/utils/useDrag.js"
import _ from "lodash"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const mngaa0020PopupDialog = ref(null)
const grdMain = ref(null)
const fileUpload = ref(null)
const imgUrlTemp1 = ref([])
const imgUrlTemp2 = ref([])
const fileUploadPopup = ref(null)
const clickedData = ref({})
const logsStore = useLogsStore()
// const buttonList = "['btnCreate','btnDelete','btnDownLoad']"

const props = defineProps({
  buttonList: {
    Type: Array,
    default: [],
  },
})

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
})

const saveParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get("year"),
  HSE_PLCY_KOR: '',
  HSE_PLCY_ENG: '',
  HSE_GOLE_KOR: '',
  HSE_GOLE_ENG: '',
  USER_ID: userStore.userId,
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: false } },
  keys : ['COL01'],
  fields : [ 
    { fieldName: 'YEAR', dataType: 'text', editable: false, 
      header: { text: t('년도') } },
    { fieldName: 'HSE_PLCY_KORYN', dataType: 'text', editable: false,
      header: { text: t('한글본') } },
    { fieldName: 'HSE_PLCY_ENGYN', dataType: 'text', editable: false, 
      header: { text: t('영문본') } },
    { fieldName: 'HSE_GOLE_KORYN', dataType: 'text', editable: false, 
      header: { text: t('한글본') } },
    { fieldName: 'HSE_GOLE_ENGYN', dataType: 'text', editable: false,
      header: { text: t('영문본') } },

    { fieldName: 'HSE_PLCY_KOR', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_KOR_NO', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG_NO', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR_NO', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG_NO', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_KOR_TITLE', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG_TITLE', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR_TITLE', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG_TITLE', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_KOR_NAME_ORIGINAL', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG_NAME_ORIGINAL', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR_NAME_ORIGINAL', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG_NAME_ORIGINAL', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_KOR_NAME', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG_NAME', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR_NAME', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG_NAME', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_KOR_PATH', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG_PATH', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR_PATH', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG_PATH', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_KOR_TYPE', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG_TYPE', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR_TYPE', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG_TYPE', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_KOR_SIZE', dataType: 'text', visible: false },
    { fieldName: 'HSE_PLCY_ENG_SIZE', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_KOR_SIZE', dataType: 'text', visible: false },
    { fieldName: 'HSE_GOLE_ENG_SIZE', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
    'YEAR', 
    {
      name: '안전보건환경 방침',
      direction: 'horizontal',
      items: [
        'HSE_PLCY_KORYN',
        'HSE_PLCY_ENGYN',
      ],
    },
    {
      name: '안전보건환경 목표',
      direction: 'horizontal',
      items: [
        'HSE_GOLE_KORYN',
        'HSE_GOLE_ENGYN',
      ],
    },
    'HSE_PLCY_KOR',
    'HSE_PLCY_ENG',
    'HSE_GOLE_KOR',
    'HSE_GOLE_ENG',
    'HSE_PLCY_KOR_NO',
    'HSE_PLCY_ENG_NO',
    'HSE_GOLE_KOR_NO',
    'HSE_GOLE_ENG_NO',
    'HSE_PLCY_KOR_TITLE',
    'HSE_PLCY_ENG_TITLE',
    'HSE_GOLE_KOR_TITLE',
    'HSE_GOLE_ENG_TITLE',
    'HSE_PLCY_KOR_NAME_ORIGINAL',
    'HSE_PLCY_ENG_NAME_ORIGINAL',
    'HSE_GOLE_KOR_NAME_ORIGINAL',
    'HSE_GOLE_ENG_NAME_ORIGINAL',
    'HSE_PLCY_KOR_NAME',
    'HSE_PLCY_ENG_NAME',
    'HSE_GOLE_KOR_NAME',
    'HSE_GOLE_ENG_NAME',
    'HSE_PLCY_KOR_PATH',
    'HSE_PLCY_ENG_PATH',
    'HSE_GOLE_KOR_PATH',
    'HSE_GOLE_ENG_PATH',
    'HSE_PLCY_KOR_TYPE',
    'HSE_PLCY_ENG_TYPE',
    'HSE_GOLE_KOR_TYPE',
    'HSE_GOLE_ENG_TYPE',
    'HSE_PLCY_KOR_SIZE',
    'HSE_PLCY_ENG_SIZE',
    'HSE_GOLE_KOR_SIZE',
    'HSE_GOLE_ENG_SIZE',
  ],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 오픈 함수
const openPopup =  params => {
  mngaa0020PopupDialog.value = true
  clickedData.value.clickData1 = 'HSE_PLCY_KOR'
  clickedData.value.clickData1 = 'HSE_GOLE_KOR'
  commonSearchApi({ queryId : 'MNGAA0020_POPUP_01_SEARCH_01', param: searchParams }).then( res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  }).finally(() => {
    // 선택된 로아가 없으면 자동으로 제일 윗 줄 한글본 클릭
    onGrdMainCellClicked('',{
      dataRow : !koEngData.dataRow ? 0 : koEngData.dataRow,
      column: !koEngData.column ? 'HSE_PLCY_KORYN' : koEngData.column,
    })
  })
}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === "btnClose") {
    onClose()
  }
}

const onPlcyButtonsClick = async btn => {
  if(btn.id === "btnCreate") {
    // guid 만듬
    let fileID = ''

    // if(files1.value.FILE_ID){
    //   fileID = files1.value.FILE_ID
    // }
    // else{

    
      let chgCk = false
      fileUploadPopup.value.setGuid()
      fileID = fileUploadPopup.value.guid

      if((fileName.LEFT_CD === 1) && (saveParam.HSE_PLCY_KOR === ' ' || saveParam.HSE_PLCY_KOR === '' || !saveParam.HSE_PLCY_KOR)){
        saveParam.HSE_PLCY_KOR = fileID
        chgCk = true
      }
      else if((fileName.LEFT_CD === 2) && (saveParam.HSE_PLCY_ENG === ' ' || saveParam.HSE_PLCY_ENG === '' || !saveParam.HSE_PLCY_ENG)){
        saveParam.HSE_PLCY_ENG = fileID
        chgCk = true
      }
    // }
    fileUploadPopup.value.openPopup(fileID)

  }
  else if(btn.id === "btnDelete") {

    
    // for(let item in saveParam){
    //   if(clickedData.value.clickData1 === item){
    //     saveParam[item] = " "
    //   }
    // }


    switch(fileName.LEFT_CD){
    case 1:
      saveParam.HSE_PLCY_KOR = " "
      break
    case 2:
      saveParam.HSE_PLCY_ENG = " "   
      break
    case 3:
      saveParam.HSE_GOLE_KOR = ""
      break
    case 4:
      saveParam.HSE_GOLE_ENG = ""
      break
    }



    Promise.all([
      //방침/목표에 fileID 저장
      commonExecuteApi({ queryId: "MNGAA0020_POPUP_01_SAVE_01", list: [saveParam] }),
    ]).finally(() => {
      openPopup()
    })
  }
  else if(btn.id === "btnDownLoad") { 
    await commonDownloadFilesApi(files1.value)
      .then((res) => {
        const file = res.contentDisposition.split('fileName="')
        const blob = new Blob([res])
        const link = document.createElement("a")

        link.href = URL.createObjectURL(blob)
        
        link.download = decodeURI(file[1].replace('";', ""))
        link.click()
        URL.revokeObjectURL(link.href)
      })
  }

}


const onGOLEButtonsClick = async btn => {
  if(btn.id === "btnCreate") {

    // guid 만듬
    let fileID = ''
    let chgCk = false
    fileUploadPopup.value.setGuid()
    fileID = fileUploadPopup.value.guid

    if((fileName.RIGHT_CD === 3) && (saveParam.HSE_GOLE_KOR === ' ' || saveParam.HSE_GOLE_KOR === '' || !saveParam.HSE_GOLE_KOR)){
      saveParam.HSE_GOLE_KOR = fileID
      chgCk = true
    }
    else if((fileName.RIGHT_CD === 4) && (saveParam.HSE_GOLE_ENG === ' ' || saveParam.HSE_GOLE_ENG === '' || !saveParam.HSE_GOLE_ENG)){
      saveParam.HSE_GOLE_ENG = fileID
      chgCk = true
    }

    fileUploadPopup.value.openPopup(fileID)

  }
  else if(btn.id === "btnDelete") {

    
    // for(let item in saveParam){
    //   if(clickedData.value.clickData1 === item){
    //     saveParam[item] = " "
    //   }
    // }


    switch(fileName.RIGHT_CD){
    case 1:
      saveParam.HSE_PLCY_KOR = " "
      break
    case 2:
      saveParam.HSE_PLCY_ENG = " "   
      break
    case 3:
      saveParam.HSE_GOLE_KOR = ""
      break
    case 4:
      saveParam.HSE_GOLE_ENG = ""
      break
    }



    Promise.all([
      //방침/목표에 fileID 저장
      commonExecuteApi({ queryId: "MNGAA0020_POPUP_01_SAVE_01", list: [saveParam] }),
    ]).finally(() => {
      openPopup()
    })
  }
  else if(btn.id === "btnDownLoad") { 
    commonDownloadFilesApi(files2.value)
      .then((res) => {
        const file = res.contentDisposition.split('fileName="')
        const blob = new Blob([res])
        const link = document.createElement("a")

        link.href = URL.createObjectURL(blob)

        link.download = decodeURI(file[1].replace('";', ""))
        link.click()
        URL.revokeObjectURL(link.href)
      })
  }
}

const onClose = () => {
  mngaa0020PopupDialog.value = false
}

const fileName = reactive({
  LEFT: '',
  LEFT_CD : '',
  RIGHT: '',
  RIGHT_CD: '',
})

const uploaded = data => {
  Promise.all([
    //방침/목표에 fileID 저장
    commonExecuteApi({ queryId: "MNGAA0020_POPUP_01_SAVE_01", list: [saveParam] }),
  ]).finally(() => {
    openPopup()
  })
}



const files1 = ref({})
const files2 = ref({})
const koEngData = reactive({})

const onGrdMainCellClicked = async (grid, clickData) => {
  if(clickData.field === 0){
    return false
  }
  koEngData.dataRow = clickData.dataRow
  koEngData.column = clickData.column
  imgUrlTemp1.value = []
  imgUrlTemp2.value = []


  clickedData.value = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  clickedData.value.clickData1 = clickData.column.replace('YN', '')
  saveParam.HSE_PLCY_KOR = clickedData.value.HSE_PLCY_KOR
  saveParam.HSE_PLCY_ENG = clickedData.value.HSE_PLCY_ENG
  saveParam.HSE_GOLE_KOR = clickedData.value.HSE_GOLE_KOR
  saveParam.HSE_GOLE_ENG = clickedData.value.HSE_GOLE_ENG
  saveParam.YEAR = clickedData.value.YEAR
  
  
  switch(clickData.column) {
  case 'HSE_PLCY_KORYN' : 
  case 'HSE_GOLE_KORYN' : 
    fileName.LEFT = '안전보건환경 방침(한글본)'
    fileName.RIGHT = '안전보건환경 목표(한글본)'
    fileName.LEFT_CD = 1
    fileName.RIGHT_CD = 3
    files1.value = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: clickedData.value.HSE_PLCY_KOR,
      FILE_NO: clickedData.value.HSE_PLCY_KOR_NO,
      FILE_TITLE: clickedData.value.HSE_PLCY_KOR_TITLE,
      FILE_NAME_ORIGINAL: clickedData.value.HSE_PLCY_KOR_NAME_ORIGINAL,
      FILE_NAME: clickedData.value.HSE_PLCY_KOR_NAME,
      FILE_PATH: clickedData.value.HSE_PLCY_KOR_PATH,
      FILE_TYPE: clickedData.value.HSE_PLCY_KOR_TYPE,
      FILE_SIZE: clickedData.value.HSE_PLCY_KOR_SIZE,
    }
    
    files2.value = {
      CMPNY_DIV : userStore.cmpnyDiv,
      FILE_ID : clickedData.value.HSE_GOLE_KOR,
      FILE_NO: clickedData.value.HSE_GOLE_KOR_NO,
      FILE_TITLE: clickedData.value.HSE_GOLE_KOR_TITLE,
      FILE_NAME_ORIGINAL: clickedData.value.HSE_GOLE_KOR_NAME_ORIGINAL,
      FILE_NAME: clickedData.value.HSE_GOLE_KOR_NAME,
      FILE_PATH: clickedData.value.HSE_GOLE_KOR_PATH,
      FILE_TYPE: clickedData.value.HSE_GOLE_KOR_TYPE,
      FILE_SIZE: clickedData.value.HSE_GOLE_KOR_SIZE,
    }
    break
  case 'HSE_PLCY_ENGYN' :
  case 'HSE_GOLE_ENGYN' :
    fileName.LEFT = '안전보건환경 방침(영문본)'
    fileName.RIGHT = '안전보건환경 목표(영문본)'
    fileName.LEFT_CD = 2
    fileName.RIGHT_CD = 4
    files1.value = {
      CMPNY_DIV : userStore.cmpnyDiv,
      FILE_ID : clickedData.value.HSE_PLCY_ENG,
      FILE_NO: clickedData.value.HSE_PLCY_ENG_NO,
      FILE_TITLE: clickedData.value.HSE_PLCY_ENG_TITLE,
      FILE_NAME_ORIGINAL: clickedData.value.HSE_PLCY_ENG_NAME_ORIGINAL,
      FILE_NAME: clickedData.value.HSE_PLCY_ENG_NAME,
      FILE_PATH: clickedData.value.HSE_PLCY_ENG_PATH,
      FILE_TYPE: clickedData.value.HSE_PLCY_ENG_TYPE,
      FILE_SIZE: clickedData.value.HSE_PLCY_ENG_SIZE,
    }
  
    files2.value = {
      CMPNY_DIV : userStore.cmpnyDiv,
      FILE_ID : clickedData.value.HSE_GOLE_ENG,
      FILE_NO: clickedData.value.HSE_GOLE_ENG_NO,
      FILE_TITLE: clickedData.value.HSE_GOLE_ENG_TITLE,
      FILE_NAME_ORIGINAL: clickedData.value.HSE_GOLE_ENG_NAME_ORIGINAL,
      FILE_NAME: clickedData.value.HSE_GOLE_ENG_NAME,
      FILE_PATH: clickedData.value.HSE_GOLE_ENG_PATH,
      FILE_TYPE: clickedData.value.HSE_GOLE_ENG_TYPE,
      FILE_SIZE: clickedData.value.HSE_GOLE_ENG_SIZE,
    }
    break
  }

  fileDownloadParam.FILE_ID1 = files1.value.FILE_ID
  fileDownloadParam.FILE_ID2 = files2.value.FILE_ID
  commonDown(files1.value)
  commonDown(files2.value)
}

const fileDownloadParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FILE_ID1: null,
  FILE_ID2: null,
})

const commonDown = async file => {
  //imgUrlTemp1.value.length = 0
  //imgUrlTemp2.value.length = 0
  if(file.FILE_ID === '' || file.FILE_ID === ' '){
    return false
  }
  await commonDownloadFilesApi(file)
    .then((res)=>{
      const blob = new Blob([res], { type: 'application/pdf' })
      const imageURL = URL.createObjectURL(blob)
      // console.log('imageURL:',imageURL)

      if((file.FILE_ID === clickedData.value.HSE_PLCY_KOR) || (file.FILE_ID === clickedData.value.HSE_PLCY_ENG)){
        imgUrlTemp1.value.push(imageURL)
      }
      else{
        imgUrlTemp2.value.push(imageURL)
      }
    })
}

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
    v-model="mngaa0020PopupDialog"
    eager
    persistent
    width="1200"
    height="950"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
  <!-- 헤더 -->
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
        @mousedown="startDragging"
    >
      <span>전사 방침/목표</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IGridTitle
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
      
          <!-- 그리드 -->
          <v-sheet height="190">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onGrdMainCellClicked"
            />
          </v-sheet>

          <!-- pdf 미리보기 -->
          <v-sheet class="mt-4 h-auto">
            <div class="d-flex mt-4 fill-height">
              <!-- 안전보건환경 방침 -->
              <v-sheet class="mr-2 h-auto">
                <IGridTitle
                  v-if="logsStore.isMenuAdmin === 'Y'"
                  :title="$t(fileName.LEFT)"
                  :button-list="['btnCreate', 'btnDelete', 'btnDownLoad']"
                  @click-button="onPlcyButtonsClick"
                  />
                  <IGridTitle
                  v-if="logsStore.isMenuAdmin === 'N'"
                  :title="$t(fileName.LEFT)"
                  :button-list="['btnDownLoad']"
                  @click-button="onPlcyButtonsClick"
                  />
                  <iframe :src="imgUrlTemp1[0]" class="object-fit-cover h-auto" />
              </v-sheet>
                
                <!-- 안전보건환경 목표 -->
              <v-sheet class="ml-2 h-auto">
                <IGridTitle
                  v-if="logsStore.isMenuAdmin === 'Y'"
                  :title="$t(fileName.RIGHT)"
                  :button-list="['btnCreate', 'btnDelete', 'btnDownLoad']"
                  @click-button="onGOLEButtonsClick"
                />
                <IGridTitle
                  v-if="logsStore.isMenuAdmin === 'N'"
                  :title="$t(fileName.RIGHT)"
                  :button-list="['btnDownLoad']"
                  @click-button="onGOLEButtonsClick"
                />
                <iframe :src="imgUrlTemp2[0]" class="object-fit-cover h-auto" />
              </v-sheet>
            </div>
          </v-sheet>
     
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- UPLOAD 팝업 -->
  <IUploadPopup
    ref="fileUploadPopup"
    @uploaded="uploaded"
    :buttonList="['btnDownLoad', 'btnDelete', 'btnClose']"
    :autoUpload="true"
    :fileDan="true"
    :pdfOnly="true"
    @closed="onGrdMainCellClicked('',koEngData)"
    />
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.object-fit-cover {
  object-fit: cover;
}
</style>