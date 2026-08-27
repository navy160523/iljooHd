<!--    한민규   -->
<!--  프로그램명 : 허가서 작성 팝업의  PTW 리스트 설정 -->


<script setup>
import { ref, reactive, onMounted, watch } from "vue"
import { commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IGridTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { useI18n } from "vue-i18n"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import { useUserStore } from "@hiway/stores/user"
import Message from "@hiway/utils/notify"
import { commonSearchApi ,   commonSearchTransaction, commonExecuteApi} from "@hiway/api/commonApi"


const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const emit = defineEmits(["upData"])
const props = defineProps({
  datainer: Object,
  codeList: Object  // 메인에서 만든 codeList를 바로 받음
})


const grdMain = ref(null)

const menuTitle = ref(null)
const JOB_BSNS_CD = ref(null) // 작업사업부 정보
const PLCAE = ref(null) // 작업장소 정보
const isShortWork = ref(false)



//  팝업 관련
const DangSearch = reactive({  
  CMPNY_DIV: "",
  BSNS_CD: "",
  DEPT_CD: "",
  RCV_TYPE: "",
  WRK_PLC : "",   // 공종계열
  DANG_DIV : "",  // 위험작업분류
  SHIP_TYPE: "",
  WRK_DIST: "", 
  GBN :'1',
  
  })


  const grdMainProps = reactive({
    gridViewOption: {
      edit: { editable: false },
      stateBar: { visible: false },
    },

  field: [
    {
      fieldName: "WRK_PLC_NM",
      dataType: "text",
      header: { text: t("공종/계열") },
      editable: false,
      width:'120'
    },
    {
      fieldName: "WRK_DIST",
      dataType: "text",
      header: { text: t("작업명") },
      // lookupDisplay: true,
      // editor: { type: "dropdown" },
      styleName: "left-column",
      width:'300'
    },
    {
      fieldName: "DANG_DIV_NM",
      dataType: "text",
      header: { text: t("위험작업분류") },
      editable: false,
      width:'150'
    },

    {
      fieldName: "CF_DIV_NM",
      dataType: "text",
      header: { text: t("허가구분") },
      editable: false,
    },
    {
      fieldName: "CMPNY_DIV",
      editable: false,
      visible: false,
    },
    // {
    //   fieldName: "SEQ",
    //   editable: false,
    //   visible: false,
    // },
    {
      fieldName: "WRK_PLC",
      editable: false,
      visible: false,
    },
    {
      fieldName: "DANG_DIV",
      editable: false,
      visible: false,
    },
    {
      fieldName: "CF_DIV",
      editable: false,
      visible: false,
    },
    {
      fieldName: "P_WRK_ID",
      editable: false,
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field



const openPopup = async (Short_yn) => {
  DangSearch.CMPNY_DIV = props.datainer.CMPNY_DIV
  DangSearch.BSNS_CD = props.datainer.BSNS_CD
  DangSearch.DEPT_CD = props.datainer.DEPT_CD
  DangSearch.RCV_TYPE = props.datainer.RCV_TYPE
  JOB_BSNS_CD.value = props.datainer.JOB_BSNS_CD
  isShortWork.value = (Short_yn == "Y") ? true : false


  await search("","") // 마운트되는 시간이 중요함
  dialog.value = true

}




const onButtonsClick = (e) => {

if (e.id === "btnClose") {
  close()
}
if (e.id === "btnSelect") {
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let SelectedData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  emit('selected', SelectedData)
  close()
}




}



const search = (WrkPlc, DangDiv) => {

  DangSearch.WRK_PLC = WrkPlc     // 공종계열
  DangSearch.DANG_DIV = DangDiv   // 위험작업분류

  if (isShortWork.value){ // 단기공사 PTW 검색
      DangSearch.JOB_LPLC = props.datainer.JOB_LPLC
      DangSearch.JOB_MPLC = props.datainer.JOB_MPLC
      DangSearch.JOB_SPLC = props.datainer.JOB_SPLC

      commonSearchApi({
        queryId: "SAFBA0010_SEARCH_24",
        param: DangSearch,
      }).then((res) => {
        if(JOB_BSNS_CD.value === 'AE00'){
          res.ORESULT_CUR = res.ORESULT_CUR.filter(item => item.P_WRK_ID !== 'S999999') // 특수선은 단기공사 기타/비일상(복합)작업 없다.
        }

        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      })


  }
  else{// 일반공사 PTW 검색
    commonSearchApi({
    queryId: "SAFBA0010_SEARCH_04",
    param: DangSearch,
    }).then((res) => {
      // '공통' 공종은 작업사업부에 해당하는 것만 가져오기
      let fres = res.ORESULT_CUR.filter(x => (x.WRK_PLC != '99') || (x.BSNS_CD == JOB_BSNS_CD.value))

      if(JOB_BSNS_CD.value === 'AQ00'){
        if(DangSearch.RCV_TYPE) { // 해양공사
          fres = fres.filter(x => (x.WRK_PLC === '99') || (x.BSNS_CD === 'AQ00'))
        } 
        else {  // 호선
          fres = fres.filter(x => (x.WRK_PLC === '99') || (x.BSNS_CD === 'AC00'))
        }      
      }
      grdMain.value.getDataProvider().setRows(fres)
    })

  }

}


// gird 더블 클릭 시 조회
const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType === "data") {
    let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
    let SelectedData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    emit('selected', SelectedData)

    close()
  }
}








watch( () => DangSearch.WRK_PLC, 
(newvalue) => {
  search( newvalue, DangSearch.DANG_DIV)
})
watch( () => DangSearch.DANG_DIV, 
(newvalue) => {
  search( DangSearch.WRK_PLC, newvalue)
})





const close = () => {
  dialog.value = false
  // grdMain.value.getGridView().filterPanel.clearInput()
}



// 그리드 이벤트

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1200"
    height="800"
    content-class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>위험작업리스트(PTW list)</span>

    </v-sheet>
    <v-card class="pa-0 rounded-b-5" style="height: calc(100% - 50px); display: flex; flex-direction: column;">
      <v-card-title class="pa-4 pb-2 flex-shrink-0">
        <IMenuTitle
          :button-list="[ 'btnSelect', 'btnClose']" 
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="ml-2 mb-4 flex-shrink-0">
        ※ 더블클릭 또는 행 선택 후 선택을 눌러주세요. 
        <br> 
        <span v-if = "isShortWork"> ※ <strong>[{{ props.datainer.DEPT_NM2 }}]</strong>에서 만든 <strong>[{{ props.datainer.JOB_PLC }}]</strong>에서의 단기공사 PTW입니다.</span>
        <span v-if = "!isShortWork">※ <strong>[{{ props.datainer.DEPT_NM2 }}]</strong>의 위험작업리스트와,  '작업사업부'의 [공통] 공정이 함께 나옵니다.</span>
  
        <br>  ※ 단기공사PTW 추가 방법: 안전-단기공사 관리-단기공사 위험작업허가 작업 등록/관리 → 추가 및 검토요청
      </div>

      <div v-if = "!isShortWork" class="ml-2 mb-3 flex-shrink-0 d-flex flex-row ">
         <v-text-field
            class = 'mr-4'
            v-model="props.datainer.DEPT_NM"
            :label="t('소속조직')"
            disabled
          />
      
          <i-select
            
            class = 'mr-4'
            v-model="props.datainer.JOB_BSNS_CD"
            :label="t('작업사업부')"
            :items="props.codeList?.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            disabled
          />

      </div>
      <div v-if = "isShortWork" class="ml-2 mb-3 flex-shrink-0 d-flex flex-row ">
         <v-text-field
            class = 'mr-4'
            v-model="props.datainer.DEPT_NM2"
            :label="t('소속조직 (부서)')"
            disabled
          />
          <v-text-field
            class = 'mr-4'
            v-model="props.datainer.JOB_PLC"
            :label="t('장소')"
            disabled
          />
      </div>


      
      <div class="ml-2 mb-2 flex-shrink-0 d-flex flex-row ">

          <i-select
            v-model="DangSearch.DANG_DIV"
            :label="t('위험작업분류')"
            label-width="90px"
            width="300px"
            :items="props.codeList?.DANG_DIV1"
            item-title="TXT"
            item-value="COD"
          />

      </div>
      
      <RealGrid
              class="mx-2 mb-2 flex-grow-1"
              ref="grdMain"
              style="min-height: 500px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellDblClicked = "onCellDblClicked"

            />
    </v-card>

  </VDialog>

</template>

<style lang="scss">
// scoped 제거하여 v-dialog content에 적용되도록 함

.content-area {
  position: relative;
  height:800px;
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
