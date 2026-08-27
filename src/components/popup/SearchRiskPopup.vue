<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue";
import { useUserStore } from "@hiway/stores/user"
import { commonDownloadFilesApi, commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonRequest2, commonRequest3 } from "@hiway/api/commonApi"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import {startDragging,handleDragging,stopDragging,} from "@/utils/useDrag.js"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const commonStore = useCommonStore()
const route = useRoute()
const t = useI18n().t //다국어
const srmaa0040PopupDialog = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const carouselIdx = ref(0)

const popupParams = reactive({
  RISK_NM: '',
  CHECK_ACC: '',
  CHECK_ACC2: '',
  TYPE_IMP: '', 
  TYPE_IMP2: '',
  CUR_PROB: '', 
  FILE_ID_1: '',
  CMPNY_DIV: '',
  DEPT_CD_IMP: '',
  DEPT_CD_REL: '',
  GBN: 'A',
  RISK_TYPE: 'A',
  PLACE: '',
  PLACE_MD_DIV: '',
  PLACE_SM_DIV: '',
  DETAIL_PLACE: '',
  GRADE: '',
  DEPT_CD_IMP: '',
	DEPT_CD_REL: '',
	IMP_DEPT_NM: '',
	REL_DEPT_NM: '',
})

const carousel = ref(0)
const fileList = reactive({
  src: [],
  art: [],
  fileName: []
})
const GBNLIST = reactive([
  {COD: 'A' , TXT: '제목'},
  {COD: 'B' , TXT: '내용'},
  {COD: 'C' , TXT: '제목+내용'},
])

const RISK_TYPE_LIST = reactive([
  { COD: 'A', TXT: '전체' },
  { COD: 'H', TXT: 'Hi-Safe' },
  { COD: 'S', TXT: 'S.O.M' },
])


// 팝업 오픈 함수
const openPopup = params => {
  fileList.src = []
  fileList.name = []
  
  for (const key in popupParams) {
    popupParams[key] = ''
  }

  popupParams.GBN = 'A'
  popupParams.RISK_TYPE = 'A'

  srmaa0040PopupDialog.value = true
}

const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  keys : ['COMP_CODE'],
  fields : [
    { fieldName: 'RISK_NM',  dataType: 'text', header: { text: t('제안 제목') }, editable: false, styleName: 'left-column' },
    { fieldName: 'CHECK_ACC', dataType: 'text', visible: false },     // 사고유형
    { fieldName: 'CHECK_ACC2', dataType: 'text', visible: false },    // 사고유형(서술)
    { fieldName: 'TYPE_IMP', dataType: 'text', visible: false },      // 개선유형
    { fieldName: 'TYPE_IMP2', dataType: 'text', visible: false },     // 개선유형(서술)
    { fieldName: 'CUR_PROB', dataType: 'text', visible: false },      // 문제 개요
    { fieldName: 'FILE_ID_1', dataType: 'text', visible: false },     // 파일 ID
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },     // 회사
    { fieldName: 'DEPT_CD_IMP', dataType: 'text', visible: false },   // 담당부서
    { fieldName: 'DEPT_CD_REL', dataType: 'text', visible: false },   // 유관부서
    /* ***************************************************************************** */
    { fieldName: 'GRADE', dataType: 'text', visible: false },
    { fieldName: 'PLACE', dataType: 'text', visible: false },
    { fieldName: 'PLACE_MD_DIV', dataType: 'text', visible: false },
    { fieldName: 'PLACE_SM_DIV', dataType: 'text', visible: false },
    { fieldName: 'DETAIL_PLACE', dataType: 'text', visible: false },
    { fieldName: 'IMP_DEPT_NM', dataType: 'text', visible: false },
    { fieldName: 'REL_DEPT_NM', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV_IMP', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV_REL', dataType: 'text', visible: false },
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields

const grdSubProps = reactive({
  gridViewOption : {stateBar: { visible: false }, edit: { editable: false }, checkBar: { visible: false }},
  keys : [],
  fields : [
    { fieldName: 'OPINION_CMPNY', dataType: 'text', header: { text: t('파일명'), styleName: 'header_color'}},

    { fieldName: 'FILE_ID', dataType: 'text', visible: false }, 
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'number', visible: false }
  ],
  columns : [],
})
grdSubProps.columns = grdSubProps.fields

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      // .setAfter(afterSearch)
      .run()    
  }
  else if (btn.id === "btnSelect") {
    onSelect()
  } 
  else if (btn.id === "btnClose") {
    onClose()
  }
}

const onClose = () => {
  for (const key in popupParams) {
    popupParams[key] = ''
  }
  grdMain.value.getDataProvider().setRows([]) 
  grdSub.value.getDataProvider().setRows([]) 
  srmaa0040PopupDialog.value = false  
}

// 조회
const searchData = () => {
  const data = { 
    queryId: "SRMAA0040_SEARCH_02",
    param: popupParams
  }

  const meta = {
    useProgress: false
  }

  commonRequest3("/hse/common/selectList", data, meta).then(async res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

    popupParams.PLACE = res.ORESULT_CUR[0].PLACE
    popupParams.PLACE_MD_DIV = res.ORESULT_CUR[0].PLACE_MD_DIV
    popupParams.PLACE_SM_DIV = res.ORESULT_CUR[0].PLACE_SM_DIV
    popupParams.DETAIL_PLACE = res.ORESULT_CUR[0].DETAIL_PLACE
    popupParams.GRADE = res.ORESULT_CUR[0].GRADE
    popupParams.DEPT_CD_IMP = res.ORESULT_CUR[0].DEPT_CD_IMP
    popupParams.DEPT_CD_REL = res.ORESULT_CUR[0].DEPT_CD_REL
    popupParams.IMP_DEPT_NM = res.ORESULT_CUR[0].IMP_DEPT_NM
    popupParams.REL_DEPT_NM = res.ORESULT_CUR[0].REL_DEPT_NM


    fileSet(res.ORESULT_CUR[0])
  })
}

const onSelect = async () => {
  const focusedRow = grdMain.value.getFocusedRowData()

  if(focusedRow == null) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return
  }

  if(popupParams.FILE_ID_1){
    fileUpload()
  }else {
    emit('selected', popupParams)
  }

  grdMain.value.getDataProvider().setRows([]) 
  grdSub.value.getDataProvider().setRows([]) 
  srmaa0040PopupDialog.value = false
  
}

const fileUpload = async () => {
  await commonSearchApi({
    queryId: "searchFile",
    param: {
      CMPNY_DIV: popupParams.CMPNY_DIV,
      FILE_ID: popupParams.FILE_ID_1
    } 
  }).then(async res => {
    let FILE_ID = create_UUID()
    popupParams.FILE_ID_1 = FILE_ID
    /* ********** 선택한 데이터 새로운 FILE_ID 생성후 업로드 ********** */
    res.ORESULT_CUR.forEach(e  => {
      let contentDisposition = null
      let fileName = null
      let fileType = null
      let blob = null
      let file = null

      commonDownloadFilesApi(e).then( async res2 => {
        contentDisposition = res2.contentDisposition
        fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]
        fileType = fileName.split('.')

        if(fileType[1] === 'gif'){
          blob = new Blob([res2],{type: 'image/gif'})
        }else if(fileType[1] === 'jpeg' || fileType[1] === 'jpg'){
          blob = new Blob([res2],{type: 'image/jpeg'})
        }else if(fileType[1] === 'png'){
          blob = new Blob([res2],{type: 'image/png'})
        }else if(fileType[1] === 'pdf'){
          blob = new Blob([res2],{type: 'application/pdf'})
        }else if(fileType[1] === 'ppt'){
          blob = new Blob([res2],{type: 'application/ppt'})
        }else if(fileType[1] === 'txt'){
          blob = new Blob([res2],{type: 'text/plain'})
        }else if(fileType[1] === 'xls'){
          blob = new Blob([res2],{type: 'application/vnd.ms-excel'})
        }else if(fileType[1] === 'zip'){
          blob = new Blob([res2],{type: 'application/zip'})
        }

        file = new File([blob], fileName, {type: blob.type} )

        // 자르는 사이즈
        let chunkSize = 1024 * 1024 // 1MB
        // total size 계산
        let totalChunks = Math.ceil(file.size / chunkSize) 

        let currentChunk = 0

        // chunk size 만큼 데이터 분할
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // form data 형식으로 전송
        const formData = new FormData();

        const param = {
          CMPNY_DIV: userStore.cmpnyDiv,
          FILE_ID: FILE_ID,
          FILE_NO: '',
          FILE_TITLE: file.name,
          FILE_NAME_ORIGINAL: file.name,
          FILE_NAME: file.name,
          FILE_PATH: `${commonStore.systemCode}${route.path}/`,
          FILE_TYPE: file.name.split(".").pop(),
          FILE_SIZE: Math.round(file.size / 1024.0),
          USER_ID: userStore.userId,
          CHUNK_NUMBER: currentChunk,
          TOTAL_CHUNKS: totalChunks
        }

        formData.append("file", chunk, file.name)
        formData.append(
          "param",
          new Blob([JSON.stringify(param)], { type: "application/json" })
        )
        
        await commonBigUploadFilesApi(formData).then(res => {
          emit('selected', popupParams)
        }).catch(err => {
          emit('selected', popupParams)
        })
      }).catch(err => {
        emit('selected', popupParams)
      })
    })
  })

}

/* ******************* FILE ID 생성 이벤트 ******************* */
const create_UUID = () => {
  let dt = new Date().getTime();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const onCellClicked = async (grid, clickData) => {
  let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  
  for(let i in rowData){
    if(i === 'CHECK_ACC' || i === 'TYPE_IMP'){
      let array = await rowData[i] ? rowData[i].split(',') : []
      popupParams[i] = array
    } else {
      popupParams[i] = rowData[i]
    }
  }

  console.log('popupParams', popupParams)

  fileSet(rowData)
}

const fileSet = val => {
  grdSub.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  let cnt = 0

  const data = {
    queryId: "searchFile",
    param: {
      CMPNY_DIV: val.CMPNY_DIV ? val.CMPNY_DIV : userStore.cmpnyDiv,
      FILE_ID: val.FILE_ID_1
    }
  }

  const meta = {
    useProgress: false
  }

  commonRequest3("/hse/common/selectList", data, meta).then(async res => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach(e => {
      let type = e.FILE_TYPE.toUpperCase()
      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF'){
        cnt++
        fileList.fileName.push(e)
      }
      /* ********** grid row 추가 ********** */
      grdSub.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
        FILE_ID: e.FILE_ID,
        FILE_NO: e.FILE_NO,
        CMPNY_DIV: e.CMPNY_DIV,
        cnt: cnt
      })
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList.fileName.forEach(async (e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      // commonDownloadFilesApi(e).then(res2 => {
      await commonRequest2('/hse/file/downloadFiles', e).then(res2 => {
        contentDisposition = res2.contentDisposition
        fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        blob = new Blob([res2])
        imageURL = URL.createObjectURL(blob)

        img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName

      }).finally(() => {
        fileList.src[idx] = imageURL
        carousel.value++
        grdSub.value.getGridView().checkAll(false)
        grdSub.value.getGridView().resetCurrent()
        Message.success(t('조회 되었습니다.'))
      })
    })
  })
}

/* 그리드 파일명 선택시 해당 파일 이미지로 변경 */
const imageChange = async (grid, clickData) => {
  let rowData = await grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)
  carouselIdx.value = rowData.cnt - 1
}

onMounted(() => {

})

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="srmaa0040PopupDialog"
    eager
    persistent
    width="1250"
    height="750"
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
      <span>중복제안검색</span>
    </v-sheet>  
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">  
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch','btnSelect','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="flex-column fill-height">
          <v-sheet class="d-flex searchArea">
            <i-select 
              v-model="popupParams.RISK_TYPE"
              :items="RISK_TYPE_LIST"
              width="150px"
              item-value="COD"
              item-title="TXT"
            />
            <i-select
              v-model="popupParams.GBN"
              :items="GBNLIST"
              width="130px"
              item-value="COD"
              item-title="TXT"
              class="mr-0"
            />
            <i-input
              width="400px"
              class="ml-0"
              append-inner-icon="mdi-magnify"
              v-model="popupParams.RISK_NM"
              @keydown.enter="searchData()"              
              @click:appendInner="searchData()"
            />
          </v-sheet>
          <div class="h-grow h-auto">
            <v-sheet width="35%">
              <IGridTitle
                :title="$t('안전리스크 제보 리스트')"
              />
              <RealGrid
                ref="grdMain"
                class="border"
                :gridViewOption="grdMainProps.gridViewOption"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellClicked="onCellClicked"
              />
            </v-sheet>
            <v-sheet class="flex-column h-auto ml-2">
              <div>
                <IGridTitle
                  :title="$t('사진 및 첨부 자료')"
                />
                <div class="d-flex">
                  <v-sheet width="60%">
                    <v-carousel
                      v-model="carouselIdx"
                      hide-delimiters 
                      height="300px"
                      class="border"
                      show-arrows="hover"
                      hide-delimiter-background
                      :key="carousel"
                    >
                      <v-carousel-item 
                        v-for="(item, i) in fileList.src"
                        :key="i"
                        :src="item"
                        width="584"
                      />
                    </v-carousel>
                  </v-sheet>
                  <v-sheet class="h-auto ml-2">
                    <RealGrid
                      ref="grdSub"
                      class="border"
                      :grid-view-option="grdSubProps.gridViewOption"
                      :keys="grdSubProps.keys" 
                      :fields="grdSubProps.fields"
                      :columns="grdSubProps.columns"
                      @onCellClicked="imageChange"
                    />
                  </v-sheet>
                </div>
              </div>
              <i-textarea
                :label="$t('문제점 및 필요성 위험요인 상세내용')"
                v-model="popupParams.CUR_PROB"
                topLabel
                width="100%"            
                class="mt-2"
                :row="8"
                readonly
              />  
            </v-sheet>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
