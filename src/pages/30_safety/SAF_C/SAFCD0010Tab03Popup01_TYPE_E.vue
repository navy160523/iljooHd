<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  selectFunction,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)
const fileUploadPopup = ref(null)
const userStore = useUserStore()
const readOnlyValue = ref(false) //점검시간 readonly 플래그
const title = ref('엔진QR점검 결과 조회')
const emit = defineEmits(['closePopup'])
const ptwField = reactive({
  RCV_NO: '', //허가서번호
  WORK_ID: '', //작업지시No
  WORK_ID_NM: '', //작업지시No (지시서 없는 건 '-' 처리한 값)
  P_WRK_ID: '', //PTW대상 ID
  CMPNY_DIV: '', //회사
  BSNS_CD: '', //사업부코드
  ASGN_FULL_NM: '', //소속이름
  RESP_EMP_NM: '', //작업책임자(정)-이름
  RESP_EMP_NO: '', //작업책임자(정)-사번
  MNGR_EMP_NO: '', //관리감독자 사번
  MNGR_EMP_NM: '', //관리감독자 성명
  WORK_DATE: '', //작업일
  WORK_TIME: '', //작업시간
  WRK_PLC: '', //공종/계열
  DANG_DIV: '', //위험작업분류 코드
  DANG_DIV_NM: '', //위험작업분류명
  WRK_DIST: '', //작업명  
  WORK_TITLE: '', //작업상세  
  RISK_LPLC: '', //작업내용 대분류
  RISK_MPLC: '', //작업내용 소분류
  CF_DIV: '', //대면/현장허가 여부
  CF_DIV_NM: '', //전산,대면,현장
  AREA_NM: '', //작업장소
  AREA_DETAIL: '', //작업장소상세
  CHECK_DATE: '', //점검일시
  CHECK_TIME: '', //점검시간
  CHECK_DIV: '', //3중점검여부
  MODIFY: '', //등록,수정플래그값  
  CHECK_PIC_ID: '', // 대표사진
  STD_WORK_NM: '', // 작업표준
})

const codeList = reactive({
  CMPNY_DIV: [], //작업사업부
  WRK_DIV: [], //공종계열
  CHECK_GROUP: [], //그룹
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'CHK_ASGN_NM',
      dataType: 'text',
      editable: false,
      width: '150',
      header: { text: t('점검자 소속') },
    },
    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      editable: false,
      width: '75',
      header: { text: t('점검자') },
    },
    {
      fieldName: 'CHECK_EMP_NO',
      dataType: 'text',
      editable: false,
      width: '85',
      header: { text: t('사번') },
      visible: false,
    },
    {
      fieldName: 'CHECK_EMP_DIV_NM',
      dataType: 'text',
      editable: false,        
      width: '85',
      header: { text: t('그룹') },
    },
    {
      fieldName: 'CHECK_RESULT',
      dataType: 'text',
      editable: false,
      header: { text: t('점검결과') },
      width: '60',
      styleCallback: function (grid, dataCell) {
        var ret = { style: {background: undefined}}
        var RESULT = grid.getValue(dataCell.index.itemIndex, 'CHECK_RESULT')
        if (RESULT === '불량') { ret.style.background = '#ff8080'} 
         else {
          ret.renderer = { editable: false }
        }
        return ret

      },
    },
    {
        fieldName: 'CHECK_TIME',
        dataType: 'text',
        editable: false,
        width: '70',
        header: { text: t('점검시간') },
    },
    {
      fieldName: 'CHECK_DATE',
      dataType: 'text',      
      visible: false,
    },
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',      
      visible: false,
    },
    {
      fieldName: 'YYYYMM',
      dataType: 'text',      
      visible: false,
    },
    {
      fieldName: 'SEQ',
      dataType: 'text',      
      visible: false,
    },
    {
      fieldName: 'CHECK_PIC_ID',
      dataType: 'text',      
      visible: false,
    },
  ],
  columns: [],
})

const grdSubProps = reactive({ 
  gridViewOption: {
    checkBar: { visible: false },
    rowIndicator: { visible: false },
  }, 
  fields: [
    {
      fieldName: 'LDIV_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('점검구분') },
      styleName: 'left-column',
      mergeRule: { criteria: 'value' },
    },
    {
      fieldName: 'MDIV_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('점검항목') },
      styleName: 'left-column',
    },
    {
      fieldName: 'SAFE_Y',
      dataType: 'text',
      width: '40',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      header: { text: t('양호') },
    },
    {
      fieldName: 'SAFE_N',
      dataType: 'text',
      width: '40',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      header: { text: t('불량') },
    },
    {
      fieldName: 'SAFE_X',
      dataType: 'text',
      width: '40',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      header: { text: t('해당없음') },
    },
    {
      fieldName: 'REMARK',
      dataType: 'text',
      styleName: 'left-column',
      header: { text: t('점검내용') },
      editable: false,
    },
    {
      fieldName: 'CHECK_PIC',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('사진') },
      isFile: { value: true, showAlways: true },
      visible: false,
    },    
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

onMounted(() => {})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
   
  } else {
    closePopup()
  }
}

const open_file = () => {
  if (!ptwField.CHECK_PIC_ID) {
    fileUploadPopup.value.setGuid()
    let fileID = fileUploadPopup.value.guid
    ptwField.CHECK_PIC_ID = fileID
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(ptwField.CHECK_PIC_ID)
  }
}

//저장관련 로직 시작


//저장관련 로직 끝

const openPopup = (data) => {
}

// 더블클릭 했을때 
const openPopup2 = (data) => {
  console.log('받은데이터', data)
  vm.$nextTick(() => {
    initCodeList()
    for (const [key, value] of Object.entries(data)) {
      if (ptwField.hasOwnProperty(key)) {
        ptwField[key] = value
      }
    }
    defaultDate()
    title.value = '엔진QR점검 결과 조회'
    modifyGrdMain()
    //modifyGrdSub()
    dialog.value = true
  })

  console.log('openpopup ptwField 2', ptwField )
}

// //수정시 점검자  리스트 조회
const modifyGrdMain = () => {
  let param = {
    CMPNY_DIV: ptwField.CMPNY_DIV, //사업장
    WORK_ID: ptwField.WORK_ID, //작업지시 ID
    
  }
  console.log('파람', param)
  commonSearchApi({
    queryId: 'SAF0200_SEARCH02',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setFocus(0)
    modifyGrdSub()
  })
}

//수정시 점검결과 조회
const modifyGrdSub = () => {
  let row = grdMain.value.getDataProvider().getJsonRow(0)

  let param = {
    CMPNY_DIV: ptwField.CMPNY_DIV, //사업장
    WORK_ID: ptwField.WORK_ID, //작업지시 ID
    YYYYMM: row.YYYYMM, //허가서No    
    SEQ: row.SEQ
  }
  console.log('수정시 조회 점검결과 조회파람', param)
  commonSearchApi({
    queryId: 'SAF0200_SEARCH04',
    param: param,
  }).then((res) => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)    
  })
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIZ000'),
    getCodeList('HHIE150'),
    getCodeList('HHIP050'),
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.WRK_DIV = res[1].ORESULT_CUR
    codeList.CHECK_GROUP = res[2].ORESULT_CUR
    grdMain.value.setBindingColumn(
      'CHECK_GROUP',
      codeList.CHECK_GROUP,
      'COD',
      'TXT'
    )
  })
}

const defaultDate = () => {

    // 점검일은 작업일과  동일해야함!!!!!! 무조건. 



    ptwField.CHECK_DATE = ptwField.WORK_DATE


}




const closePopup = () => {
  for (let i in ptwField) {
    ptwField[i] = ''
  }
  grdMain.value.getDataProvider().setRows(null)
  grdSub.value.getDataProvider().setRows(null)  
  title.value = '엔진QR점검 결과 조회'
  //emit('closePopup')
  dialog.value = false
}

//파일첨부 관련 로직 끝

const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  let row = grdMain.value.getDataProvider().getJsonRow(newIdx)

  ptwField.CHECK_PIC_ID = row.CHECK_PIC_ID
  ptwField.CHECK_DATE = row.CHECK_DATE
  ptwField.CHECK_TIME = row.CHECK_TIME

  let param = {
    CMPNY_DIV: ptwField.CMPNY_DIV, //사업장
    WORK_ID: ptwField.WORK_ID, //작업지시 ID
    YYYYMM: row.YYYYMM, //허가서No    
    SEQ: row.SEQ
  }
  console.log('수정시 조회 점검결과 조회파람', param)
  commonSearchApi({
    queryId: 'SAF0200_SEARCH04',
    param: param,
  }).then((res) => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)    
  })
}


defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ title }} </span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <v-sheet class="searchArea">
          <div>
            <div class="sheetTitle">작업정보</div>
            <!--<div style="color: blue; font-size: medium;"> ※ 작업일시 기준 1주일 이전의 데이터는 수정이 불가합니다  </div>-->
            <div class="d-flex mt-2">              
              <i-input
                width="200px"
                :label="$t('작업지시서 No.')"
                top-label
                v-model="ptwField.WORK_ID_NM"
                readonly
              ></i-input>

              <i-select
                width="180px"
                :label="$t('작업조직')"
                top-label
                :items="codeList.CMPNY_DIV"
                item-title="TXT"
                item-value="COD"
                v-model="ptwField.CMPNY_DIV"
                readonly
              ></i-select>
              <i-input
                width="360px"
                class="mt-5"
                v-model="ptwField.ASGN_FULL_NM"
                readonly
              ></i-input>
              <i-input
                width="130px"
                :label="$t('작업책임자')"
                top-label
                v-model="ptwField.RESP_EMP_NM"
                readonly
              ></i-input>
              <!--<i-input
                width="130px"
                :label="$t('관리감독자')"
                top-label
                readonly
                v-model="ptwField.MNGR_EMP_NM"
              ></i-input>-->
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('작업일시')"
                top-label
                v-model="ptwField.WORK_DATE"
                readonly
              ></i-input>
              <i-input
                width="180px"
                top-label
                v-model="ptwField.WORK_TIME"
                readonly
              ></i-input>
              <i-input
                width="200px"
                :label="$t('작업장소')"
                top-label
                v-model="ptwField.AREA_NM"
                readonly
              ></i-input>
              <i-input
                width="500px"
                :label="$t('상세위치')"
                top-label
                v-model="ptwField.AREA_DETAIL"
                readonly
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('점검일시')"
                top-label
                v-model="ptwField.CHECK_DATE"                
                readonly
              ></i-input>
              <i-input
                width="180px"
                top-label
                v-model="ptwField.CHECK_TIME"
                readonly
              ></i-input>              
              <i-input
                width="200px"
                :label="$t('3중점검여부')"
                top-label
                v-model="ptwField.CHECK_DIV"
                readonly
              >
              </i-input>
              <i-input
                width="500px"
                :label="$t('작업상세')"
                top-label
                v-model="ptwField.WORK_TITLE"
                readonly
              ></i-input>              
              
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="1140px"
                :label="$t('작업표준 명')"
                top-label
                v-model="ptwField.STD_WORK_NM"
                readonly
              ></i-input>


            </div>
          </div>
        </v-sheet>

        
        <div class="d-flex">
          <v-sheet width="45%" class="mr-3">
            <IGridTitle :title="$t('점검현황')"> </IGridTitle>
            <RealGrid
              ref="grdMain"
              :fields="grdMainProps.fields"
              style="height: 300px"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
            />
          </v-sheet>
          <v-sheet width="55%">
            <IGridTitle :title="$t('점검 결과')">
              <template #editors>
                <div class="d-flex justify-between align-center">
                  <span class = "d-flex justify-end">
                    <v-btn @click="open_file"> 대표사진 조회 </v-btn>
                  </span>                
                  <!--<div style="color: blue; font-size: medium; margin-left: 10px;"> ※ 양호/불량 대표 사진 첨부 시 등록(저장) 가능  </div>-->
                </div>
              </template>
            </IGridTitle>            
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              style="height: 300px"                            
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout" 
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <IUploadPopup ref="fileUploadPopup"></IUploadPopup>
  </v-dialog>
</template>

<style scoped lang="scss">
.sheetTitle {
  font-size: 20px;
  font-weight: bold;
}
</style>
