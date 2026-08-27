<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue";
import { useUserStore } from "@hiway/stores/user"
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import IGridTitle from "@/components/IGridTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import {commonSearchApi} from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import {startDragging,handleDragging,stopDragging,} from "@/utils/useDrag.js"

const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
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
})

const carousel = ref(0)
const fileList = reactive({
  src: [],
  art: [],
  fileName: []
})


// 팝업 오픈 함수
const openPopup = params => {
  srmaa0040PopupDialog.value = true
}

const grdMainProps = reactive({
  gridViewOption : { 
    edit: { editable:false },     
    stateBar: { visible: false } },
  keys : ['COMP_CODE'],
  fields : [
    { fieldName: 'RISK_NM',  dataType: 'text', header: { text: t('제안 제목') }, editable: false },
    { fieldName: 'CHECK_ACC', dataType: 'text', visible: false },     // 사고유형
    { fieldName: 'CHECK_ACC2', dataType: 'text', visible: false },    // 사고유형(서술)
    { fieldName: 'TYPE_IMP', dataType: 'text', visible: false },      // 개선유형
    { fieldName: 'TYPE_IMP2', dataType: 'text', visible: false },     // 개선유형(서술)
    { fieldName: 'CUR_PROB', dataType: 'text', visible: false },      // 문제 개요
    { fieldName: 'FILE_ID_1', dataType: 'text', visible: false },     // 파일 ID
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },     // 회사
    { fieldName: 'DEPT_CD_IMP', dataType: 'text', visible: false },   // 담당부서
    { fieldName: 'DEPT_CD_REL', dataType: 'text', visible: false },   // 유관부서
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
  commonSearchApi({ queryId: "SRMAA0040_SEARCH_02", param: popupParams  }).then(async res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    fileSet(res.ORESULT_CUR[0])
  })
}

const onSelect = () => {
  emit('selected', popupParams)

  for (const key in popupParams) {
    popupParams[key] = ''
  }
  grdMain.value.getDataProvider().setRows([]) 
  grdSub.value.getDataProvider().setRows([]) 
  srmaa0040PopupDialog.value = false  
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
  fileSet(rowData)
}

const fileSet = val => {
  grdSub.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  let cnt = 0

  commonSearchApi({queryId: "searchFile", param: {CMPNY_DIV: val.CMPNY_DIV, FILE_ID: val.FILE_ID_1} }).then(async res => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach(e => {
      let type = e.FILE_TYPE.toUpperCase()
      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF'){
        cnt++
        fileList.fileName.push(e)
      }
      /* ********** grid row 추가 ********** */
      grdSub.value.addRow({OPINION_CMPNY: e.FILE_TITLE ,FILE_ID: e.FILE_ID, FILE_NO: e.FILE_NO, CMPNY_DIV: e.CMPNY_DIV, cnt: cnt})
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      commonDownloadFilesApi(e).then(res2 => {
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
    <v-card class="pa-0 fill-height">
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
            <i-input
              :label="$t('제목')"
              label-width="35px"
              width="400px"
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
