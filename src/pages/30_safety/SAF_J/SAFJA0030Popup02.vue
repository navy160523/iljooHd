<!--
  화면명 : 단기공사 적격성평가 팝업
  화면개요 : 단기공사 적격성평가 처리 팝업
  최종수정일자: 2024-05-27
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IGridTitle from "@/components/IGridTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import dayjs from 'dayjs'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import Message from "@hiway/utils/notify";
import {
  commonDownloadFilesApi
} from "@hiway/api/commonFileApi"
import IUpload from "@/components/IUpload.vue"

onMounted(() => {
});

const props = defineProps({
  buttonList: {
    //버튼리스트
    type: Array,
    default() {
      return ['btnClose']  //btnUpdate
    },
  },
})

const dialog = ref(false)

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t; //다국어
const grd1 = ref(null)

const filesLoad = ref(null)

const fileUploadPopup = ref(null)

console.log('dayjs(new Date()). ',dayjs(new Date()).format('YYYY-MM-DD'))

// v-model 
const setData = reactive({

  VND_NAME: '',
  BIZ_REG_NO: '',
  BIZ_REG_NM: '',
  REG_DATE: dayjs(new Date()).format('YYYY-MM-DD'), //기간 시작,
  EVAL_DEPT_CD: '',
  EVAL_USER_ID: '',
  CNT: '',
  BIZ_KIND: '',
  SAFE_REVIEW: '',
  OPER_REVIEW: '',
})

const grdProps1 = reactive({
  gridViewOption : { header: { height: 60 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL1'],
  fields: [
    { fieldName: "CODE_DESC2", dataType: "text", styleName: 'left-column', header: { text: t("평가 기준") }, width: '200', mergeRule: { "criteria": "value" },editable: false, },
    { fieldName: "FILE_TITLE", dataType: "text", header: { text: t("파일명") }, width: '60', editable: false },
    { fieldName: 'FILE_BTN', dataType: 'text', editable:false, visible: props.buttonList[0] === 'btnUpdate'? true : false,
      header: { text: t('파일') }, width: '60',
      renderer:{
        type:"button"
      }
    },
    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("CMPNY_DIV") }, editable: false, visible: false },
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("BIZ_REG_NO") }, editable: false, visible: false },
    { fieldName: "SYS_LCD", dataType: "text", header: { text: t("SYS_LCD") }, editable: false, visible: false },
    { fieldName: "SYS_MCD", dataType: "text", header: { text: t("SYS_MCD") }, editable: false, visible: false },
    { fieldName: "SYS_SCD", dataType: "text", header: { text: t("SYS_SCD") }, editable: false, visible: false },

    { fieldName: "FILE_ID", dataType: "text", header: { text: t("FILE_ID") }, editable: false, visible: false },
    { fieldName: "FILE_NO", dataType: "text", header: { text: t("FILE_NO") }, editable: false, visible: false },
    { fieldName: "FILE_NAME_ORIGINAL", dataType: "text", header: { text: t("FILE_NAME_ORIGINAL") }, editable: false, visible: false },
    { fieldName: "FILE_NAME", dataType: "text", header: { text: t("FILE_NAME") }, editable: false, visible: false },
    { fieldName: "FILE_PATH", dataType: "text", header: { text: t("FILE_PATH") }, editable: false, visible: false },
    { fieldName: "FILE_TYPE", dataType: "text", header: { text: t("FILE_TYPE") }, editable: false, visible: false },
    { fieldName: "FILE_SIZE", dataType: "text", header: { text: t("FILE_SIZE") }, editable: false, visible: false },
      
  ],
  columns: [],
  columnLayout: [],
});

grdProps1.columns = grdProps1.fields;


//버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === 'btnUpdate') {

    const chkRowIndex = grd1.value.getGridView().getCheckedRows() 
    const param = []
    console.log('getData checkRow ', chkRowIndex)

    if (chkRowIndex.length > 0) {
      chkRowIndex.forEach(val => {
        let data = grd1.value.getDataProvider().getJsonRow(val)
        param.push(data)

        commonExecuteApi({ queryId : 'SAFJA0030_UPDATE_01', list: param })
      })
      
    } else {
      Message.err(t('선택된 데이터가 없습니다.'));
    }
  } else if (btn.id === 'btnShortFileDownload') {
    //선택 다운로드

    const chkRowIndex = grd1.value.getGridView().getCheckedRows()

    if (chkRowIndex.length > 0) {
      chkRowIndex.forEach(val => {
        let data = grd1.value.getDataProvider().getJsonRow(val)

        if (data.FILE_ID === null || data .FILE_ID === '') {
          return;
        }

        commonDownloadFilesApi(data)
        .then((res) => {
          const file = res.contentDisposition.split('fileName="')
          const blob = new Blob([res])
          const link = document.createElement("a")

          link.href = URL.createObjectURL(blob)

          link.download = decodeURI(file[1].replace('";', ""))
          link.click()
          URL.revokeObjectURL(link.href)
        })
        .catch((e) => {
          console.log('e', e)
        })
      })
      
    } else {
      Message.err(t('선택된 데이터가 없습니다.'));
    }

  }else if (btn.id === "btnClose") {
    onClose()
  }
  
}

const onClose = () => {
  dialog.value = false
}

const pdfUrl = ref()
const commonDown = async file => {  

  if (file.FILE_ID === null || file.FILE_ID === '') {
    pdfUrl.value = ''
    return false
  }
  await commonDownloadFilesApi(file)
    .then((res)=>{
      const blob = new Blob([res], { type: 'application/pdf' })
      const imageURL = URL.createObjectURL(blob)

      //파일 적용
      pdfUrl.value = imageURL
    })
}

 
const openPopup = async (popupParam) => {

  // commonSearchApi({ queryId: "SAFJA0030_SEARCH_03", param: popupParam  }).then(async res => {

  //   if (res.ORESULT_CUR.length > 0) {
  //     dialog.value = true 
  //     console.log('res.ORESULT_CUR ', res.ORESULT_CUR)

  //     grd1.value.getDataProvider().setRows(res.ORESULT_CUR);
  //   }
  // })

  dialog.value = true
  console.log('popupParam ' , popupParam)

  vm.$nextTick(() => {
    // getData.WRK_STD_NM = data.WRK_STD_NM
    // getData.WRK_STD_CON = data.WRK_STD_CON
    // getData.FILE_ID = data.FILE_ID

    filesLoad.value.changeCmpny(popupParam.CMPNY_DIV)
    filesLoad.value.setGuid(popupParam.FILE_ID)
    filesLoad.value.onButtonsClick({ id: "btnSearch" })
  })
}


//grid 값 변경 이벤트
const grdEditRowChanged = (grid, itemIndex, dataRow, field, oldValue, newValue) => {

  let getRowData = ''
  let num1 = 0
  if (field === 5 || field === 6) {
    getRowData = grd1.value.getDataProvider().getJsonRow(itemIndex, false)

    if (field === 5) {

      if (getRowData.EVAL_NUM3 === null) {
          num1 = newValue/2
      } else {
          num1 = (Number(newValue) + Number(getRowData.EVAL_NUM3))/2
      }
       
    } else {

      if (getRowData.EVAL_NUM2 === null) {
          num1 = newValue/2
      } else {
          num1 = ( Number(newValue) + Number(getRowData.EVAL_NUM2))/2
      }

    }

    grid.commit()
    grd1.value.getDataProvider().setValue(itemIndex, 'EVAL_NUM1', num1)

  }
  
}


const fileID = ref('')
const buttonList = reactive([])
const uploadVisible = ref('')
const rowData = ref('')

// 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  
  rowData.value = grd1.value.getDataProvider().getJsonRow(col.dataRow)
  console.log('rowData:',rowData.value)
  
  console.log('col:', col, ' rowData : ', rowData)
  
  if (col.field === 2) {
    // // 점검 결과 부적합 내용 사진 첨부
    fileID.value = ''
    buttonList.length = 0
    buttonList.push(['btnFileUpload', 'btnDownLoad', 'btnDelete', 'btnClose']) 
    uploadVisible.value = true

    // // 첨부 id 생성
    fileUploadPopup.value.setGuid()
    //fileID에 가지고 있음
    fileID.value = rowData.value.FILE_ID ? rowData.value.FILE_ID : fileUploadPopup.value.guid
    //grid에 fileID 입력
    grd1.value.getDataProvider().setValue(col.dataRow, 'FILE_ID', fileID.value)
    
    // rowData.value.FILE_ID = fileID.value

    // if(rowData.value.FILE_ID){
      // 결과 코드(key값)가 있으면 첨부 id를 업데이트해줌 (저장 된 row는 없데이트, 저장 안 된 row는 그냥 변수에만 담아둠)
      
      // commonExecuteApi({ queryId : 'MNGEE0010_SAVE_02', list: [rowData.value] })
    // }

    fileUploadPopup.value.openPopup(fileID.value)
  }  
  
}

const onGrdMainCellClicked = async (grid, clickData) => {

  const getRow = grd1.value.getDataProvider().getJsonRow(clickData.dataRow)

  console.log('getRow ', getRow)

  commonDown(getRow)
}


const uploaded = (data) => {
  return null 
}

defineExpose({
  openPopup,
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="650"
    height="500"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move">
      <span>첨부파일</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="props.buttonList"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex fill-height">
          <v-sheet class="h-auto ">
            <IUpload
              class="mt-3"
              gridTitle="첨부파일"
              :gridOnly="true"
              ref="filesLoad"
              style="height: 300px"
            />
          </v-sheet>

        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <IUploadPopup ref="fileUploadPopup" :buttonList="buttonList[0]" @uploaded="uploaded" :isVisibled="uploadVisible" />
  
</template>


<style scoped lang="scss">

.object-fit-cover {
  object-fit: cover;
}

</style>

