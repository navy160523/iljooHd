<!--
  화면명 : 안전화 신청 양식 업로드
  화면개요 : 안전화 신청 양식 업로드
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'
import { getJsonFromExcel } from "@/utils/excel"

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const payYn = ref(false)

const codeList = reactive({
  YEAR:[],
  REQ_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  SHOES_NAME: [],
  REASON: [],
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get('year'),
  REQ_DIV: 'B',
  REQ_DT: dayjs().format('YYYY-MM-DD'),
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'EMP_NO', width: '60', editable : false, dataType: 'text', header: { text: t('사번') }, },
    { fieldName: 'EMP_NM', width: '60', dataType: 'text', header: { text: t('이름') }, },
    { fieldName: 'SHOES_KIND', width: '150', editable : false, dataType: 'text', styleName: 'left-column', header: { text: t('안전화 종류') }, lookupDisplay: true },
    { fieldName: 'SHOES_SIZE', width: '60', editable : false, dataType: 'text', styleName: 'right-column', header: { text: t('사이즈') }, },
    { fieldName: 'SHOES_COUNT', width: '60', editable : false, dataType: 'text', styleName: 'right-column', header: { text: t('신청수량') }, },
    { fieldName: 'REASON', width: '120', editable : false, dataType: 'text', styleName: '', header: { text: t('신청사유') }, lookupDisplay: true },
    { fieldName: 'REQ_DT', width: '100', editable : false, dataType: 'text', styleName: '', header: { text: t('신청일자') }, lookupDisplay: true },
    { fieldName: 'RECEIVE_DT', width: '100', editable : false, dataType: 'text', styleName: '', header: { text: t('지급일자') }, lookupDisplay: true },
    { fieldName: 'REMARKS', width: '200', editable : false, dataType: 'text', styleName: 'left-column', header: { text: t('비고') }, },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'REQ_DIV', dataType: 'text', header: { text: t('사업부코드') }, visible: false },
    // { fieldName: 'REQ_DT', dataType: 'text', header: { text: t('부서코드') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.REQ_DIV = 'B'
  
  getCode()
  grdMain.value.getGridView().filterPanel.visible = true
  
  dialog.value = true
}

const getCode = () => {
  Promise.all([
    // 품명(안전화)
    getCodeList('HHII710A'),
    // 신청사유
    getCodeList('HHII730'),
  ]).then((res) => {
    codeList.SHOES_NAME = res[0].ORESULT_CUR
    codeList.REASON = res[1].ORESULT_CUR

    grdMain.value.setBindingColumn('SHOES_KIND', codeList.SHOES_NAME, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REASON', codeList.REASON, 'COD', 'TXT')
    onButtonsClick({ id: 'btnSearch' })
  })
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnFormDownload') {
    let params = {
      FILE_PATH: 'HLTH',
      FILE_NAME: '안전화 신청 업로드 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {
    

    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

        // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}


//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  grdMain.value.getGridView().filterPanel.clearInput()
  grdMain.value.getDataProvider().clearRows();
  excelData.map(item => {
  if(!isEmpty(item.사번)) {
      let reqDate = ''
      let receiveDate = ''

      if (item.신청일자 instanceof Date) {
        const reqDt = new Date(item.신청일자);
        const reqYear = reqDt.getUTCFullYear();
        const reqMonth = String(reqDt.getUTCMonth() + 1).padStart(2, '0');
        const reqDay = String(reqDt.getUTCDate()).padStart(2, '0');
        reqDate = `${reqYear}${reqMonth}${reqDay}`
      }else{
        reqDate = item.신청일자.toString().replaceAll('-','')
      }

      if (item.지급일자 instanceof Date) {
        const receiveDt = new Date(item.지급일자);
        const receiveYear = receiveDt.getUTCFullYear();
        const receiveMonth = String(receiveDt.getUTCMonth() + 1).padStart(2, '0');
        const receiveDay = String(receiveDt.getUTCDate()).padStart(2, '0');
        receiveDate = `${receiveYear}${receiveMonth}${receiveDay}`
      }else{
        receiveDate = item.지급일자.toString().replaceAll('-','')
      }

      grdMain.value.addRow({
        EMP_NO: item.사번,
        EMP_NM: item.성명,
        SHOES_KIND: item['안전화 종류'],
        SHOES_SIZE: item.SIZE,
        SHOES_COUNT: item.신청수량,
        REASON: item.신청사유,
        // REQ_DT: item.신청일자.toString().replaceAll('-',''),
        RECEIVE_DT: receiveDate,//`${receiveYear}${receiveMonth}${receiveDay}`, //item.지급일자.toString('YYYYMMDD').replaceAll('-',''),
        REMARKS: item.비고,
        CMPNY_DIV: searchParams.CMPNY_DIV,
        YEAR: searchParams.YEAR,
        REQ_DIV: searchParams.REQ_DIV,
        REQ_DT: reqDate,//item.신청일자.toString('YYYYMMDD').replaceAll('-',''),
      }, false)    
    }
  })
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.CMPNY_DIV)) {
      return Message.warn(t('사업부는 필수값입니다.'))
    } else if (isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수값입니다.'))
    } else if (isEmpty(data.REQ_DIV)) {
      return Message.warn(t('신청구분은 필수값입니다.'))
    } else if (isEmpty(data.EMP_NO)) {
      return Message.warn(t('사번은 필수값입니다.'))
    } else if(!isEmpty(data.REMARKS) && data.REMARKS.length > 250) {
      return Message.warn(t('비고의 길이는 250자를 넘어선 안됩니다.'))
    } else if (!isEmpty(data.EMP_NO) && data.EMP_NO.length > 20) {
      return Message.warn(t('사번의 길이는 20자를 넘을 수 없습니다.'))
    } else if(data.REQ_DT > data.RECEIVE_DT){
      return Message.warn(t('신청일자는 지급일자보다 미래 일 수 없습니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTHA0030_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  payYn.value = true
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup();
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  emit('after-search', payYn.value)
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
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
    width="1200"
    height="890"
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
      <span>안전화 신청 양식업로드</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnFormDownload', 'btnExcelUpload', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
          :use-permission="true"
        />
      </v-card-title> 
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('해당년도')"
              label-width="50px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="200px"
              :readonly="true"
            /> 
            <i-select
              v-model="searchParams.REQ_DIV"
              :label="$t('구분')"
              label-width="50px"
              :items="codeList.REQ_DIV" 
              item-value="COD"
              item-title="TXT" 
              width="200px"
              :readonly="true"
            />
            <!-- <i-input
              v-model="searchParams.REQ_DT"
              label-width="50px"
              :label="$t('신청일자')"
              type="date"
              width="220px"
              class="mr-2"
              
            /> -->
            <!-- :readonly="true" -->
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 550px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
