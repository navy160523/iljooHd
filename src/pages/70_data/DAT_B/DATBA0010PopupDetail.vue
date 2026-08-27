<!-- 
  * Vue 내 용 : 안전지침서 제개정 요청 팝업
  * 작 성 자 : HNIX 이규호
  * 최초 작성일 : 2025/10/23 
-->

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonRequest,
  commonSendApi,
  getCodeList,
} from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import RealGrid from '@/components/RealGrid.vue'
import IUpload from '@/components/IUpload.vue'
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"
import { toUpper } from 'lodash-es'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'

const props = defineProps({
  editorId: {
    type: String,
    default: 'editor',
  },
})

const emit = defineEmits(['closed'])
const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const ckEditor = ref(null)
const fileUpload = ref(null)
const fileUpload2 = ref(null)
const fileUploadButton = reactive(['btnDownLoad', 'btnDelete'])
const fileUploadPopup = ref(null)
const empPopup = ref(null)

const logsStore = useLogsStore()

//mouse coordinate
const x = ref(0)
const y = ref(0)

const IsAdmin = ref('N')
const strFileID = ref('')
const strFileID2 = ref('')
const grdMain2 = ref(null)

const mouseUpdate = (event) => {
  x.value = event.pageX
  y.value = event.pageY
}

const popupParam = reactive({
  CMPNY_DIV: '',
  NOTICE_DIV: '',
  NOTICE_NO: '',
  HIS_TYPE: '',

  NOTICE_TITLE: '',
  GUBUN1: [],
  GUBUN2: '',
  NOTICE_DOC_NO: '',
  CATEGORY1: '', // 개정번호
  INSERT_DATE: '',
  NOTICE_REG_EMPNO: '',
  KOR_NM: '',
  TEL_NO: '',
  NOTICE_NOTE: '',
  NOTICE_FILEID_ORG: '',
  NOTICE_FILEID_ETC: '',
  NOTICE_FILEID: '',
  
  USER_ID: userStore.userId,
})

const statusParam = reactive({   
  CTL_READONLY: false,  
})

//코드리스트
const codeList = reactive({
  GUBUN1: [],
  GUBUN2: [],
})

//그리드2 속성셋팅
const grdMain2Props = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : ['CMPNY_DIV','NOTICE_DIV','NOTICE_NO'],
  fields : [ 
    { fieldName: 'CATEGORY1', dataType: 'text', width: '50', header: { text: t('개정No.') }, editable:false },
    { fieldName: 'CATEGORY4', dataType: 'text', width: '90', header: { text: t('제개정일') }, editable:false },
    { fieldName: 'NOTICE_NOTE', dataType: 'text', width: '300', 
      header: { text: t('제개정 사유') }, editable:false,
      styleName: 'multiline-editor-pre', 
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          var str = `<div class="d-flex justify-start">
            <div></div>
            <div>${cell.value}</div>            
          </div>`
          return str
        },
      },
    },
    { fieldName: 'INSERT_DATE', dataType: 'text', width: '90', header: { text: t('등록일') }, editable:false },
    { fieldName: 'FILE_OPEN', dataType: 'text', width: '60', editable: false, header: { text: t('열람') }, editable:false,
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/detailSearch.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        return ret
      },
    },
    { fieldName: 'FILE_NAME', dataType: 'text', width: '200', type: 'data', header: { text: t('파일명') }, editable:false },
    { fieldName: 'NOTICE_REG_EMPNM', dataType: 'text', width: '90', header: { text: t('담당자') }, editable:false },

    // 출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_DIV', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_NO', dataType: 'text' , visible: false },
    { fieldName: 'INSERT_USER_ID', dataType: 'text' , visible: false },
    { fieldName: 'NOTICE_FILEID_ORG', dataType: 'text' , visible: false },
    { fieldName: 'FILE_NO', dataType: 'text' , visible: false },
    { fieldName: 'LOCAL_PATH', dataType: 'text' , visible: false },
    { fieldName: 'DIV_CD', dataType: 'text' , visible: false },
  ],
  columns : [],
})

grdMain2Props.columns = grdMain2Props.fields

//초기 데이터셋팅
onMounted(() => {})

const openPopup = (val, isAdmin, chk) => {
  initData()
  initCombo()

  IsAdmin.value = isAdmin
  console.log(val)

  if (!isEmpty(val)) {    
    popupParam.CMPNY_DIV = val.CMPNY_DIV
    popupParam.NOTICE_DIV = val.NOTICE_DIV
    popupParam.NOTICE_NO = val.NOTICE_NO       
    popupParam.HIS_TYPE = 'H' // HISTORY만       

    if(IsAdmin.value == 'Y' || useLogsStore().isMenuAdmin == 'Y') {      
      menuTitle.value.disableBtn('btnDelete', false)      
      menuTitle.value.disableBtn('btnUpdate', false)
    } else {      
      menuTitle.value.disableBtn('btnDelete', true)      
      menuTitle.value.disableBtn('btnUpdate', true)
    }

    Promise.all([
      commonRequest("/hse/data/DATBA0010_SELECT_CLOB02", 
        { 
          queryId: "DATBA0010_SELECT_02", 
          param: popupParam,
        }),
    ]).then(res => {
      setControlValues(res[0].ORESULT_CUR)    
      
    })
    
    Promise.all([
      commonRequest("/hse/data/DATBA0010_SELECT_CLOB02", 
        { 
          queryId: "DATBA0010_SELECT_03", 
          param: popupParam,
        }),
    ]).then(res => {        
      grdMain2.value.getDataProvider().setRows(res[0].ORESULT_CUR)
    })

  } else {
    alert('조회된 데이터가 없습니다')
    return
  }

  console.log('[DATBA0010PopupDetail] popupParam : ', popupParam)

  dialog.value = true

}

const setControlValues = res => {
  popupParam.CMPNY_DIV = res[0].CMPNY_DIV
  popupParam.NOTICE_DIV = res[0].NOTICE_DIV
  popupParam.NOTICE_NO = res[0].NOTICE_NO
  popupParam.NOTICE_TITLE = res[0].NOTICE_TITLE
  popupParam.GUBUN1 = res[0].GUBUN1.replaceAll(' ', '').split(',')
  popupParam.GUBUN2 = res[0].GUBUN2
  popupParam.NOTICE_DOC_NO = res[0].NOTICE_DOC_NO
  popupParam.CATEGORY1 = res[0].CATEGORY1
  popupParam.INSERT_DATE = res[0].INSERT_DATE
  popupParam.NOTICE_REG_EMPNO = res[0].NOTICE_REG_EMPNO
  popupParam.KOR_NM = res[0].KOR_NM
  popupParam.TEL_NO = res[0].TEL_NO  
  popupParam.NOTICE_NOTE = res[0].NOTICE_NOTE  
  popupParam.NOTICE_FILEID_ORG = res[0].NOTICE_FILEID_ORG
  popupParam.NOTICE_FILEID_ETC = res[0].NOTICE_FILEID_ETC
  popupParam.NOTICE_FILEID = res[0].NOTICE_FILEID
  strFileID.value = res[0].NOTICE_FILEID_ORG
  strFileID2.value = res[0].NOTICE_FILEID_ETC
    
  if(isEmpty(popupParam.NOTICE_NOTE)) {
    ckEditor.value.setContent("")
  }
  else {
    ckEditor.value.setContent(popupParam.NOTICE_NOTE)
  }

  checkFileId()
}

const checkFileId = () => {
  if (isEmpty(strFileID.value)) {
    fileUpload.value.setGuid()
    strFileID.value = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(strFileID.value)
    strFileID.value = fileUpload.value.guid
    fileUpload.value.onButtonsClick({ id: 'btnSearch' })
  }

  if (isEmpty(strFileID2.value)) {
    fileUpload2.value.setGuid()
    strFileID2.value = fileUpload2.value.guid
    fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
  } else {
    //파일아이디 있을때
    fileUpload2.value.setGuid(strFileID2.value)
    strFileID2.value = fileUpload2.value.guid
    fileUpload2.value.onButtonsClick({ id: 'btnSearch' })
  }
}

// 콤보박스 셋팅
const initCombo = () => {
  Promise.all([    
   
    getCodeList('HHI' + 'Z090BA'), //분류1 콤보
    getCodeList('HHI' + 'Z090BB'), //분류2 콤보
 
  ]).then((res) => {
    
    codeList.GUBUN1 = res[0].ORESULT_CUR
    codeList.GUBUN2 = res[1].ORESULT_CUR

    console.log('[initCombo] res: ', res) 
 
  })
}

const onClose = (btnId) => {
  grdMain2.value.getDataProvider().setRows(null)
  if(btnId === 'btnDelete') {
    emit('closed')
  }  
  dialog.value = false
}

const initData = () => { 
  popupParam.CMPNY_DIV = ''
  popupParam.NOTICE_DIV = ''
  popupParam.NOTICE_NO = ''
  popupParam.HIS_TYPE = ''

  popupParam.NOTICE_TITLE = ''
  popupParam.GUBUN1 = []
  popupParam.GUBUN2 = ''
  popupParam.NOTICE_DOC_NO = ''
  popupParam.CATEGORY1 = ''
  popupParam.INSERT_DATE = ''
  popupParam.NOTICE_REG_EMPNO = ''
  popupParam.KOR_NM = ''
  popupParam.TEL_NO = ''
  popupParam.NOTICE_NOTE = ckEditor.value.setContent('')
  popupParam.NOTICE_FILEID_ORG = ''
  popupParam.NOTICE_FILEID_ETC = ''
  popupParam.NOTICE_FILEID = ''

  strFileID.value = ''
  strFileID2.value = ''
  fileUpload.value.clearGrid()
  fileUpload2.value.clearGrid()
  IsAdmin.value = 'N'
}

defineExpose({
  openPopup,
})

const onButtonsClick = (btn) => {
  console.log('onButtonsClick', btn.id)

  if (btn.id === 'btnDelete') {
    Delete()
  } else if (btn.id === 'btnUpdate') {
    saveData('btnUpdate')
  } else if (btn.id === 'btnClose') {
    onClose('btnClose')
  }
}

/* ************ 삭제처리 *************** */
const Delete = async () => {
  let result = await vm.$swal({
    title: t('현재지침서 및 개정이력이 모두 삭제됩니다.\n삭제처리 하시겠습니까?'),
    showCancelButton: true,
  })

  if (!result.isConfirmed) {
    return
  } else {
    let deleteParams = []

    deleteParams.push({
      CMPNY_DIV: popupParam.CMPNY_DIV,
      NOTICE_DIV: popupParam.NOTICE_DIV,
      NOTICE_NO: popupParam.NOTICE_NO,
    })

    console.log('[Delete] saveParams: ', deleteParams)

    Promise.all([
      commonExecuteApi({ queryId: 'DATBA0010_DELETE_03', list: deleteParams }),
    ]).then((res) => {
      console.log('[Delete] res: ', res)

      let rcod = res[0].list[0].OUT_RES_COD

      if (rcod === '0') {
        onClose('btnDelete')
      }
    })
  }
}

const saveData = (btnId) => {
  popupParam.NOTICE_NOTE = ckEditor.value.getContent()

  new saveFlowHelper(vm, t)
    .setBefore(beforeSaveQue)
    .setQuery(saveDataQue)
    .setAfter((result) => {
      console.log('[saveData] result : ', result)
      let rcod = result.OUT_RES_COD
      let rmsg = result.OUT_RES_MSG

      if (rcod === '0') {
        
      } else {
        Message.err(t(rmsg))
      }
    })    
    .run()
}

// 저장 전 체크
const beforeSaveQue = () => {

  if (isEmpty(popupParam.NOTICE_TITLE)) {
    return Message.warn('지침서명을 입력해주세요.')
  }
  
  if (isEmpty(popupParam.GUBUN1)) {
    return Message.warn('적용사업부를 선택해주세요.')
  }

  if (isEmpty(popupParam.GUBUN2)) {
    return Message.warn('작업구분을 선택해주세요.')
  }

  console.log('[beforeSaveQue] 내용: ', popupParam)

  if (isEmpty(popupParam.NOTICE_NOTE)) {
    return Message.warn('내용을 입력해주세요.')
  }

  return true
}

// 저장
const saveDataQue = () => {
  let saveParams = []

  let gubun1 = popupParam.GUBUN1

  saveParams.push(
    {
      CMPNY_DIV : popupParam.CMPNY_DIV,
      NOTICE_DIV : popupParam.NOTICE_DIV,
      NOTICE_NO : popupParam.NOTICE_NO,
      NOTICE_TITLE : popupParam.NOTICE_TITLE,
      NOTICE_REG_EMPNO : popupParam.NOTICE_REG_EMPNO,
      NOTICE_NOTE : ckEditor.value.getContent(),      
      NOTICE_FILEID_ETC : strFileID2.value,
      NOTICE_FILEID_ORG : strFileID.value,      
      GUBUN1 : gubun1.join(','),
      GUBUN2 : popupParam.GUBUN2,     
      USER_ID : userStore.userId,
      RES_COD : '',               // return 값
      RES_MSG : '',               // return 값
      RES_COL : '',               // return 값
    },
  )  
  console.log('[saveDataQue] 데이터 저장 >>>> ', saveParams)

  return commonRequest('/hse/data/DATBA0010_UPDATE_CLOB01', {
    queryId: 'DATBA0010_UPDATE_01',
    list: saveParams,
  })
}

const onGrdMain2CellItemClicked = (grid, index, col) => {
  if(col.cellType !== 'data'){
    return
  }
  
  let data = grdMain2.value.getDataProvider().getJsonRow(col.dataRow)

  if (col.fieldName === 'FILE_OPEN') {
    fileUploadPopup.value.openPopup(data.NOTICE_FILEID_ORG)
  }
}

const deptValidation = () => {
  popupParam.KOR_NM = popupParam.KOR_NM.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "")
}

// 인원 조회 팝업 오픈
const openEmpPopup = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NM: popupParam.KOR_NM,
  })
}

// 인원 조회 팝업 선택 이벤트
const onEmpSelected = val => {
  console.log('[onEmpSelected] val : ', val)

  popupParam.KOR_NM = val.EMP_NM
  popupParam.NOTICE_REG_EMPNO = val.EMP_NO
  popupParam.TEL_NO = val.TEL_NO

}

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1000"
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
      <span> 안전지침서 상세</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="[            
            'btnUpdate',
            'btnDelete',            
            'btnClose',
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="max-height:800px; overflow-y: auto;">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">            
            <div class="d-flex">              
              <i-input
                v-model="popupParam.NOTICE_TITLE"
                :label="$t('지침서명')"
                top-label
                label-width="200px"
                width="860px"
                :required="!statusParam.CTL_READONLY"
                :readonly="statusParam.CTL_READONLY"
              />              
            </div>
            
            <div class="d-flex mt-2">
              <i-select
                v-model="popupParam.GUBUN1"
                :label="$t('적용사업부')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.GUBUN1"
                item-value="COD"
                item-title="TXT"
                width="400px"
                :required="!statusParam.CTL_READONLY"
                :readonly="statusParam.CTL_READONLY"
                multiple
              />
              <i-select
                v-model="popupParam.GUBUN2"
                :label="$t('작업구분')"
                top-label
                label-width="80px"
                append-inner-icon="mdi-magnify"
                :items="codeList.GUBUN2"
                item-value="COD"
                item-title="TXT"
                width="150px"
                :required="!statusParam.CTL_READONLY"
                :readonly="statusParam.CTL_READONLY"
              />
              <i-input
                v-model="popupParam.NOTICE_DOC_NO"
                :label="$t('문서번호')"
                top-label
                width="150px"
                label-width="80px"
                disabled
              />
              <i-input
                v-model="popupParam.CATEGORY1"
                :label="$t('개정 No.')"
                top-label
                width="100px"
                label-width="80px"
                disabled
              />
            </div>
            <div class="d-flex mt-2">              
              <i-input
                v-model="popupParam.INSERT_DATE"
                :label="$t('제/개정일')"
                top-label
                width="150px"
                label-width="80px"
                disabled
              />
              <i-input
                v-model="popupParam.KOR_NM"
                :label="$t('담당자(신청자)')"
                top-label
                width="150px"
                label-width="120px"
                disabled
                v-if="IsAdmin === 'N'"
              />
              <i-input
                v-model="popupParam.KOR_NM"
                width="150px"
                :label="$t('담당자(신청자)')"
                top-label
                append-inner-icon="mdi-magnify"
                :rules="[deptValidation]"
                required
                @click:append-inner="openEmpPopup"
                @keydown.enter="() => openEmpPopup('인원조회')"
                v-if="IsAdmin === 'Y'"
              />
              <i-input
                v-model="popupParam.TEL_NO"
                :label="$t('Tel')"
                top-label
                width="150px"
                label-width="80px"
                disabled
              />              
            </div>            
          </v-sheet>        
          
          <v-sheet class="mb-2">
            <div class="title d-flex" required>제/개정 사유 <svg-icon class="dot ml-2" name="redDot"></svg-icon></div>
            <CKEditor              
              :id="props.editorId"
              ref="ckEditor"
              v-model="popupParam.NOTICE_NOTE"
              class="mt-2"
              :is-read-only="!statusParam.CTL_READONLY"
              height="120px"
            />
          </v-sheet>
           
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload"
              :max-file-size="300"
              :button-list="fileUploadButton"
              :gridTitle="$t('지침서자료')"
              auto-upload
              style="height: 200px"
              fixHeight
              :comment="$t('※ PPT 원본파일로 저장')"             
            />
          </v-sheet>
          <v-sheet class="h-auto mt-2">
            <IUpload
              ref="fileUpload2"
              :max-file-size="300"
              :button-list="fileUploadButton"
              :gridTitle="$t('참고자료')"
              auto-upload
              style="height: 200px"
              fixHeight
            />
          </v-sheet>
          <v-sheet 
            height="200px"
            class="mt-2"
          >            
            <IGridTitle :title="$t('구버전 이력')">
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdMain2"
              :grid-view-option="grdMain2Props.gridViewOption"
              :keys="grdMain2Props.keys" 
              :fields="grdMain2Props.fields"
              :columns="grdMain2Props.columns"
              @on-cell-item-clicked="onGrdMain2CellItemClicked"              
            />
          </v-sheet>
        </div>        
        <IUploadPopup 
          ref="fileUploadPopup" 
          :cmpnyUseYn = "false"
          :readOnly = true
        />
        <!-- 인원조회팝업 -->
        <EmpPopup 
          ref="empPopup" 
          @selected="onEmpSelected" 
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
