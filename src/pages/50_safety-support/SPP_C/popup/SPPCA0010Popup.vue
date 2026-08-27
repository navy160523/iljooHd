<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGridFactory from '@/utils/realgrid2'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import Message from '@hiway/utils/notify'
import OZReport from '@/components/OZReport.vue'

const emit = defineEmits(['closePopup'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const deptPopup = ref(null)
const grdMain = ref(null)
const fileUpload1 = ref(null) // 문제점사진
const fileUpload2 = ref(null) // 개선후사진
const receivedRowData = ref(null)

// OzReport 팝업 여부 
const showOz = ref(false)
const params = ref([])
const reportName = ref('/manage/hse/SPPCA0010.ozr')

//조회조건
let searchParams = reactive({})
searchParams.CMPNY_DIV = userStore.company
searchParams.BSNS_CD = 'AC00'
searchParams.ORGN_DIV = 'A'
searchParams.USE_DIV = 'Y'

var mainContents = reactive({
  CMPNY_DIV: '',
  YEAR: '',
  SEQ: '',
  SUPVISN_TYPE: '',
  DATE_FROM: '',
  DATE_TO: '',
  REMARK: '',
  FILE_ID: '',
  FILE_YN: '',
  SAVE_YN: '',
})

var detailContents = reactive({
  CMPNY_DIV: '',
  YEAR: '',
  SEQ: '',
  SUBSEQ: '',
  ODRNUM: '',
  COMPANY: '',
  BSNS_CD: '',
  DEPT_CD: '',
  BSNS_NM: '',
  DEPT_NM: '',
  VEND_NM: '',
  PLACE: '',
  PLACE_DTL: '',
  VIO_TYPE: '',
  VIO_TYPE_DTL: '',
  VIO_DESC: '',
  LAW: '',
  RULE: '',
  MEASURE: '',
  STATUS: '',
  PROBLEM_FILE_ID: '',
  MEASURE_FILE_ID: '',
  PROBLEM_DESC: '',
  MEASURE_DESC: '',
  SAVE_YN: '',
})

//코드리스트
const codeList = reactive({
  VIO_TYPE: [],
  MEASURE: [],
  STATUS: [],

  /*메뉴버튼 조회*********************************************/
  field: [],
  columns: [],
})

watch(
  // 문제점 사진
  () => fileUpload1.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileId()
    }
  },
  // 조치후 사진
  () => fileUpload2.value,
  (newValue) => {
    if (newValue !== null && newValue !== '' && newValue !== undefined) {
      checkFileId()
    }
  }
)

// 문제점, 조치후 사진 Set
const checkFileId = async () => {
  if (detailContents.PROBLEM_FILE_ID){
    fileUpload1.value.setGuid(ref(detailContents.PROBLEM_FILE_ID))
    await fileUpload1.value.onButtonsClick({ id: 'btnSearch' })
  }

  if (detailContents.MEASURE_FILE_ID){
    fileUpload2.value.setGuid(detailContents.MEASURE_FILE_ID)
    await fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
  }
}

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 대분류
    getCodeList('HHIFI20'),
    getCodeList('HHIFI30'),
    getCodeList('HHIFI40'),
  ]).then(res => {

    codeList.VIO_TYPE = res[0].ORESULT_CUR
    codeList.VIO_TYPE.unshift({ TXT: "", COD: "" })

    codeList.MEASURE = res[1].ORESULT_CUR
    codeList.MEASURE.unshift({ TXT: "", COD: "" })

    codeList.STATUS = res[2].ORESULT_CUR
    codeList.STATUS.unshift({ TXT: "", COD: "" })
  })
}

// 신규 open
const openPopup = (mainData) =>{
  mainContents = mainData
  detailContents = reactive([])
  detailContents.CMPNY_DIV = mainData.CMPNY_DIV
  detailContents.YEAR = mainData.YEAR
  detailContents.SEQ = mainData.SEQ

  dialog.value = true
}

// 수정 open
const openPopup2 = (rowData) =>{
  vm.$nextTick(() => {
      detailContents = rowData   
      dialog.value = true
    }
  )
}

//초기 데이터셋팅
onMounted(() => {
  initCodeList()
  window.addEventListener('mousemove', mouseUpdate)
})

//메뉴버튼
const onButtonsClick = btn => {

  if (btn.id === 'btnTemporaryStorage'){
    TempSaveData("Y")
  } else if (btn.id === 'btnActionComplete'){
    CompSaveData("Y")
  } else if (btn.id === 'btnPrint'){

    if(!detailContents.SUBSEQ || detailContents.SUBSEQ == ''){
      Message.warn("임시저장 후 출력 하시기 바랍니다.")
      return
    }

    onOzPrint()
  } else if (btn.id === 'btnClose') {
    onClose()
  } else if (btn.id === 'btnSelect') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
}

// 조회로직
const searchData = () => {

  return commonSearchApi({ queryId : 'searchDept', param : searchParams })

}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  
  return true
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}


const onClose = () => {
  emit('closePopup')
  dialog.value = false
}

const onSelect = () => {

  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  emit('selected', rtnData)
  onClose()
}

/* ---------- 임시저장 ---------- */
const TempSaveData = (MSG) => {
  let saveData = {
    CMPNY_DIV: detailContents.CMPNY_DIV,
    YEAR: detailContents.YEAR,
    SEQ: detailContents.SEQ,
    SUBSEQ: detailContents.SUBSEQ ? detailContents.SUBSEQ : '',
    ODRNUM: detailContents.ODRNUM,
    BSNS_CD: detailContents.BSNS_CD,
    BSNS_NM: detailContents.BSNS_NM,
    DEPT_CD: detailContents.DEPT_CD,
    DEPT_NM: detailContents.DEPT_NM,
    VEND_NM: detailContents.VEND_NM,
    PLACE: detailContents.PLACE,
    PLACE_DTL: detailContents.PLACE_DTL,
    VIO_TYPE: detailContents.VIO_TYPE,
    VIO_TYPE_DTL: detailContents.VIO_TYPE_DTL,
    VIO_DESC: detailContents.VIO_DESC,
    LAW: detailContents.LAW,
    RULE: detailContents.RULE,
    MEASURE: detailContents.MEASURE,
    PROBLEM_FILE_ID: detailContents.PROBLEM_FILE_ID,
    MEASURE_FILE_ID: detailContents.MEASURE_FILE_ID,
    PROBLEM_DESC: detailContents.PROBLEM_DESC,
    MEASURE_DESC: detailContents.MEASURE_DESC,
    STATUS: "10", // 진행상태: 진행중
    SAVE_YN: detailContents.SAVE_YN,
    USER_ID: userStore.userId, //로그인유저 아이디
  }
  vm.$swal({ 
    title: t('임시저장 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SPPCA0010_SAVE_02', 
        list: [saveData]
      }).then(res => {
        if (res.result.status === '200') {
          if (MSG === "Y"){
            Message.success(t('저장 되었습니다.'));
          }
          detailContents.SUBSEQ = res.list[0].SUBSEQ
          detailContents.STATUS = '10' // 진행상태: 진행중
        }
      })
    }
  })
}

const CompSaveData = () => {
  let saveData = {
    CMPNY_DIV: detailContents.CMPNY_DIV,
    YEAR: detailContents.YEAR,
    SEQ: detailContents.SEQ,
    SUBSEQ: detailContents.SUBSEQ ? detailContents.SUBSEQ : '',
    MEASURE_FILE_ID: detailContents.MEASURE_FILE_ID,
    MEASURE_DESC: detailContents.MEASURE_DESC,
    STATUS: "20",
    USER_ID: userStore.userId, //로그인유저 아이디
  }

  if (MSG === "Y"){
    vm.$swal({ 
    title: t('조치완료 하시겠습니까?'), 
    showCancelButton: true,
    }).then(ck => {
      if (ck.isConfirmed === true) {
        commonExecuteApi({
          queryId : 'SPPCA0010_SAVE_03', 
          list: [saveData]
        }).then(res => {
          if (res.result.status === '200') {
              Message.success(t('저장 되었습니다.'));
          }
        })
      }
    })
  }else{
    commonExecuteApi({
      queryId : 'SPPCA0010_SAVE_03', 
      list: [saveData]
    }).then(res => {
      if (res.result.status === '200') {
          //Message.success(t('저장 되었습니다.'));
      }
    })
  }
}

// 부서 조회 팝업 선택 이벤트(테스트용)
const onDeptSelected = (val) => {
  detailContents.BSNS_CD = val.BSNS_CD
  detailContents.BSNS_NM = val.BSNS_NM
  
  if (val.ORGN_DIV === "A"){
    detailContents.DEPT_NM = val.ASGN_SHRT_NM
    detailContents.DEPT_CD = val.DEPT_CD
  }
  else if(val.ORGN_DIV === "B"){
    detailContents.VEND_NM = val.ASGN_SHRT_NM
    detailContents.DEPT_CD = val.ASGN_CD
  }
}

const openDeptPopup = () =>{
  deptPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
  })
}

// 문제점사진 삭제 이벤트
const deletedCheckPicture = () => {
  detailContents.PROBLEM_FILE_ID = ''
}

// 개선후사진 삭제 이벤트
const deletedJoChiPicture = () => {
  detailContents.MEASURE_FILE_ID = ''
}

// 문제점사진 업로드 이벤트
const uploadPicture1 = (val) => {
  detailContents.PROBLEM_FILE_ID =  val.FILE_ID
  TempSaveData("N")
}

// 개선후사진 업로드 이벤트
const uploadPicture2 = (val) => {
  detailContents.MEASURE_FILE_ID = val.FILE_ID
  TempSaveData("N")
}

const onOzPrint = () => {
  
  reportName.value = '/manage/hse/SPPCA0010.ozr'
  params.value = [
    "IN_YEAR=" + detailContents.YEAR,
    "IN_CMPNY_DIV=" + detailContents.CMPNY_DIV,
    "IN_SEQ=" + detailContents.SEQ,
    "IN_SUBSEQ=" + detailContents.SUBSEQ
  ]

  showOz.value = true
}


defineExpose({
  openPopup,
  openPopup2,
})


//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = event => {
  let gapx = event.pageX-x.value
  x.value = event.pageX
  y.value = event.pageY
}
</script>

<template>
  <v-dialog 
    v-model="dialog" 
    persistent 
    width="1200"
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
    <span>지적사항 등록</span>
  </v-sheet>
  <v-card class="pa-3 fill-height rounded-b-5">
    <v-card-title class="pa-3 py-0">
      <IMenuTitle
        ref="menuTitle"
        :button-list="[
          'btnTemporaryStorage',
          'btnActionComplete',
          'btnPrint',
          'btnClose',
        ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card_text class="pa-4 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex  mt-3">
            <i-input
              :label="$t('연번')"
                v-model="detailContents.ODRNUM"
                type="number"
                label-width="60px" 
                width="250px"
            />
          </div>
          <div class="d-flex  mt-3">
            <i-input
              :label="$t('사업부')"
                v-model="detailContents.BSNS_NM"
                type="text"
                label-width="60px" 
                width="250px"
            />
            <i-input
              :label="$t('부서')"
                v-model="detailContents.DEPT_NM"
                type="text"
                label-width="60px" 
                width="250px"
            />
            <i-input 
              :label="$t('부서코드')"
              v-model="detailContents.DEPT_CD"
              append-inner-icon="mdi-magnify"
              @keydown.enter="e => {openDeptPopup}"
              @click:appendInner="openDeptPopup"
              label-width="60px" 
              width="250px"
            /> 
            <i-input
              :label="$t('협력사')"
                v-model="detailContents.VEND_NM"
                type="text"
                label-width="60px"
                width="250px"
            />
          </div>

          <div class="d-flex  mt-3">
            <i-input
              :label="$t('장소(설비)')"
                v-model="detailContents.PLACE"
                type="text"
                label-width="60px"
                width="250px"
            />
            <i-input
              :label="$t('세부장소')"
                v-model="detailContents.PLACE_DTL"
                type="text"
                label-width="60px"
                width="250px"
            />
            <i-select
              :label="$t('대분류')" 
              :items="codeList.VIO_TYPE"
              v-model="detailContents.VIO_TYPE"
              item-value="COD"
              item-title="TXT"
              label-width="60px" 
              width="250px"
            />
            <i-input
              :label="$t('대상물(자)')"
                v-model="detailContents.VIO_TYPE_DTL"
                type="text"
                label-width="60px"
                width="250px"
            />
          </div>

          <div class="d-flex mt-3">
            <i-input
              :label="$t('적용법조')"
                v-model="detailContents.LAW"
                type="text"
                label-width="60px"
                width="250px"
            />
            <i-input
              :label="$t('적용규칙')"
                v-model="detailContents.RULE"
                type="text"
                label-width="60px"
                width="250px"
            />
            <i-select
              :label="$t('처분')" 
              :items="codeList.MEASURE"
              v-model="detailContents.MEASURE"
              item-value="COD"
              item-title="TXT"
              label-width="60px" 
              width="250px"
            />
            <i-select
              :label="$t('진행상태')" 
              :items="codeList.STATUS"
              v-model="detailContents.STATUS"
              item-value="COD"
              item-title="TXT"
              label-width="60px" 
              width="250px"
              readonly
            />
          </div>

          <div class="d-flex mt-3">
            <i-input
              :label="$t('위반내용')"
                v-model="detailContents.VIO_DESC"
                type="text"
                label-width="60px"
                width="1060px"
            />
          </div>

          <div class="d-flex mt-3">
          <IUploadImageMulit
            ref="fileUpload1"
            style="width: 50%"
            title="문제점"
            class="mr-2"
            @uploaded="uploadPicture1"
          ></IUploadImageMulit>

          <IUploadImageMulit
            ref="fileUpload2"
            style="width: 50%"
            title="개선후"
            class="ml-2"
            @uploaded="uploadPicture2"
          ></IUploadImageMulit>
        </div>

        <div class="d-flex mt-2 mr-5">
          <i-textarea
            class="mt-2"
            width="50%"
            :label="$t('문제점')"
            top-label
            v-model="detailContents.PROBLEM_DESC"
          >
          </i-textarea>
          <i-textarea
            class="mt-2"
            width="50%"
            :label="$t('개선후')"
            top-label
            v-model="detailContents.MEASURE_DESC"
          >
          </i-textarea>
        </div>

        </v-sheet>

      </div>
    </v-card_text>
  <!-- 부서조회팝업 -->
  <DeptPopup ref="deptPopup" @selected="onDeptSelected" />
  <!-- OZReport -->
  <OZReport :showPop="showOz" :reportName="reportName" :params="params" @close="showOz = $event" />
  </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
}
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>