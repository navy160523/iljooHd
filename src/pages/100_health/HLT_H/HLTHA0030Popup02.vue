<!--
  화면명 : 안전화 정기 지급 양식 업로드
  화면개요 : 안전화 정기 지급 양식 업로드
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
import queryFlowHelper from '@/utils/searchFlowHelper'
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
  REQ_CHA: [
    { COD: '1', TXT: '상반기' },
    { COD: '2', TXT: '하반기' },
  ],
  REQ_DIV: [
    { COD: 'A', TXT: '정기' },
    { COD: 'B', TXT: '수시' },
  ],
  SHOES_NAME: [],
  REASON: [],
  COUPON_YN: [
    { COD: 'N', TXT: '안전화' },
    { COD: 'Y', TXT: '쿠폰' },
  ]
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: dayjs().get('year'),
  REQ_DIV: 'A',
  REQ_CHA: '1',
  COUPON_YN: 'N'
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false }, stateBar: { visible: false } },
  keys: [],
  fields: [
    { fieldName: 'ASGN_FULL_NM', width: '240', editable : false, dataType: 'text', styleName: 'left-column', header: { text: t('소속') }, },
    { fieldName: 'EMP_NO', width: '60', editable : false, dataType: 'text', header: { text: t('사번') }, },
    { fieldName: 'KOR_NM', width: '60', dataType: 'text', header: { text: t('이름') }, },
    { fieldName: 'HLD_OFFI_GBN_NM', width: '80', editable : false, dataType: 'text', header: { text: t('재직여부') }, lookupDisplay: true },
    { fieldName: 'SHOES_KIND', width: '120', editable : false, dataType: 'text', styleName: 'left-column', header: { text: t('안전화') }, lookupDisplay: true },
    { fieldName: 'SHOES_SIZE', width: '60', editable : false, dataType: 'text', styleName: 'right-column', header: { text: t('사이즈') }, },
    { fieldName: 'COUPON_YN', width: '60', editable : false, dataType: 'text', header: { text: t('쿠폰 여부') }, },
    { fieldName: 'RECEIVE_DT', width: '80', editable : false, dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('지급일자') }, },
    { fieldName: 'RECEIVE_YN', width: '60', editable : false, dataType: 'text', styleName: '', header: { text: t('지급여부') }, lookupDisplay: true },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') }, visible: false },
    { fieldName: 'REQ_DIV', dataType: 'text', header: { text: t('구분') }, visible: false },
    { fieldName: 'REQ_CHA', dataType: 'text', header: { text: t('기간구분') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.YEAR = param.YEAR
  searchParams.REQ_CHA = param.REQ_CHA
  getCode()
  grdMain.value.getGridView().filterPanel.visible = true
  
  dialog.value = true
}

const getCode = () => {
  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: i, TXT: i})
  }

  Promise.all([
    // 품명(안전화)
    getCodeList('HHII710A'),
  ]).then((res) => {
    codeList.SHOES_NAME = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('SHOES_KIND', codeList.SHOES_NAME, 'COD', 'TXT')
    onButtonsClick({ id: 'btnSearch' })
  })
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnFormDownload') {
    let params = {
      FILE_PATH: 'HLTH',
      FILE_NAME: '안전화 정기 지급 업로드 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {
    const reqChaTxt = codeList.REQ_CHA.find(el => el.COD === searchParams.REQ_CHA);


    vm.$swal({
      title: t(searchParams.YEAR.toString() + '년도' + ' ' + reqChaTxt.TXT + ' 대상자를 업로드 하시겠습니까?'), //\r\n
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = function(event) {
          const selectedFile = event.target.files[0]
          // 선택된 파일에 대한 처리
          getJsonFromExcel(selectedFile, excelUploadCallback)
        }
        input.click()
      } 
    })
    // const input = document.createElement('input')

    // input.type = 'file'
    // input.onchange = function(event) {
    //   const selectedFile = event.target.files[0]

    //     // 선택된 파일에 대한 처리
    //   getJsonFromExcel(selectedFile, excelUploadCallback)
    // }
    // input.click()
  } else if (btn.id === 'btnPayProcess') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

// 그리드 데이터 조회
const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTHA0030_SEARCH_05', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  for(let i = 0; i < res.ORESULT_CUR.length; i++) {
    if(res.ORESULT_CUR[i].CHK == 'Y') grdMain.value.getGridView().checkRow(i, true, false, false)
  }

  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    let ret = { style:{ color: '#000000', background: '#FFFFFF' } }
    if(grid.getValue(item.index, 'HLD_OFFI_GBN_NM') !== '재직') {
      ret.style.color = '#FF0000'
    }
    if(isEmpty(grid.getValue(item.index, 'SHOES_KIND')) &&
      isEmpty(grid.getValue(item.index, 'SHOES_SIZE')) &&
      isEmpty(grid.getValue(item.index, 'COUPON_YN'))) {
      ret.style.background = '#FFA500'
    }
    return ret
  })
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  grdMain.value.getGridView().filterPanel.clearInput()
  let saveParam = []

  
  excelData.map(item => {
    if(!isEmpty(item.사번)) {
      // if(!isEmpty(codeList.EMP_NO.find(i => i.EMP_NO == item.사번))) {
        saveParam.push({
          EMP_NO: item.사번,
          RECEIVE_DT: item.지급일자,
          CHK: 'Y',
          COUPON_YN: searchParams.COUPON_YN,
          CMPNY_DIV: searchParams.CMPNY_DIV,
          YEAR: searchParams.YEAR,
          REQ_DIV: 'A',
          REQ_CHA: searchParams.REQ_CHA,
        })
      // }
    }
  }) 
  commonExecuteApi({ queryId: 'HLTHA0030_DELETE_01', list: [searchParams] }).then(res => {
    commonExecuteApi({ queryId: 'HLTHA0030_SAVE_02', list: saveParam }).then(re => {
      getData()
      return Message.success(t('성공적으로 저장되었습니다.'))
    })
  })
}

// 지급 처리 저장 전
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
    } else if (isEmpty(data.REQ_CHA)) {
      return Message.warn(t('기간구분은 필수값입니다.'))
    } else if (isEmpty(data.EMP_NO)) {
      return Message.warn(t('사번은 필수값입니다.'))
    } else if (isEmpty(data.RECEIVE_DT)) {
      return Message.warn(t('사번은 필수값입니다.'))
    } 
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.RECEIVE_DT = dayjs(data.RECEIVE_DT).format('YYYYMMDD')
    
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTHA0030_SAVE_03', list: saveParams })
}

// 지급처리 저장 후
const afterSaveData = () => {
  getData()
  payYn.value = true
  Message.success(t('성공적으로 저장되었습니다'))
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
      <span>정기 분 지급 일괄 업로드</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnFormDownload', 'btnExcelUpload', 'btnPayProcess', 'btnSearch', 'btnClose']"
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
            /> 
            <i-select
              v-model="searchParams.REQ_CHA"
              :label="$t('구분')"
              label-width="50px"
              :items="codeList.REQ_CHA" 
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <VRadioGroup
              v-model="searchParams.COUPON_YN"
              class="mt-auto pl-3 pr-3 radio"
              inline
            >
              <VRadio v-for="(item, i) in codeList.COUPON_YN" :key="i" :value="item.COD" :label="item.TXT" />
            </VRadioGroup>
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
