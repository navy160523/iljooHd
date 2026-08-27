
<!-- 
  화면명   : 안전지침서 조회-타당성확인 팝업  
  생성자 : 2025-11-06 이규호
-->

<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance }                   from 'vue'
import { startDragging, handleDragging, stopDragging }                    from '@/utils/useDrag.js'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n }      from 'vue-i18n'
import { useRouter }    from 'vue-router'
import queryFlowHelper  from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel     from '@/components/ILabel.vue'
import RealGrid   from '@/components/RealGrid.vue'
import Message    from '@hiway/utils/notify'
import dayjs      from 'dayjs'
import _          from 'lodash'
import { isEmpty } from '@/@core/utils'

defineOptions({
  name:'70_data-DAT_B-DATBA0010PopupValid',
})

// ------------------------- Variable ------------------------- //

const dialog = ref(false)
const router = useRouter()

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t                 //다국어
const menuTitle = ref(null)
const clickButton = ref('')
const grdSub = ref(null)
const emit = defineEmits(['closePopup'])
const isSave = ref(false)
const isReadonly = ref(true)
const isReadonlyMGR = ref(true)
const IsAdmin = ref('N')


const popupParam = reactive({
  CMPNY_DIV: '',
  NOTICE_DIV: '',
  NOTICE_NO: '',
  SEQ: '',
  NOTICE_TITLE: '',
  GUBUN1NM: '',
  GUBUN2NM: '',
  NOTICE_DOC_NO: '',
  NOTICE_DOC_REV: '', // 개정번호
  INSERT_DATE: '', //제개정일
  ASGN_NM: '', 
  EMP_NO: '',
  KOR_NM: '',
  VALID_DATE: '',
  NEXT_VALID_DATE: '',
  VALID_RESULT: '',
  STATUS: '',
  MGR_COMPANY: '',
  MGR_EMP_NO: '',
  MGR_STATUS: '',
  MGR_UPDATE_DATE: '',
  MGR_REJECT_DESC: '', 
  
  USER_ID: userStore.userId,
})

// 코드리스트
const codeList = reactive({
  VALID_RESULT: [
    
  ]
})

//그리드 SUB 속성셋팅
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: false }, display: { selectionStyle: 'rows', useFocusClass: true} },
  keys: ['CHECK_LIST_ID'],
  fields: [ 
    { fieldName: 'CHECK_LIST_ITEM',  dataType: 'text', width: '450', styleName: 'left-column',   header: { text: t('타당성 Check List') },  editable : false },    
    {
      fieldName: 'CHECK_Y',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      header: { text: t('만족') },
    },
    {
      fieldName: 'CHECK_N',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: 'Y',
        falseValues: 'N',
      },
      header: { text: t('불만족') },
    },    
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '100', visible : false },
    { fieldName: 'NOTICE_DIV', dataType: 'text', width: '100', visible : false },
    { fieldName: 'NOTICE_NO', dataType: 'text', width: '100', visible : false },
    { fieldName: 'SEQ', dataType: 'text', width: '100', visible : false },
    { fieldName: 'CHECK_LIST_ID', dataType: 'text', width: '100', visible : false },
    { fieldName: 'CHECK_LIST_RESULT', dataType: 'text', width: '100', visible : false },   
  ],
  columns : [],
})

grdSubProps.columns = grdSubProps.fields

// ------------------------- Method ------------------------- //

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([    
    getCodeList('HHIZ090J'),    
  ]).then(res => {
    console.log("레스 확인",res)
    codeList.VALID_RESULT = res[0].ORESULT_CUR    
  })
}

// 조회
const onSearchMain = (param) => {
  commonSearchApi({
    queryId: 'DATBA0010_SELECT_06',
    param: param,
  }).then((res) => {
    popupParam.ASGN_NM = res.ORESULT_CUR[0].DEPT_NM
    popupParam.EMP_NO = res.ORESULT_CUR[0].EMP_NO
    popupParam.KOR_NM = res.ORESULT_CUR[0].KOR_NM
    popupParam.VALID_DATE = res.ORESULT_CUR[0].VALID_DATE
    popupParam.NEXT_VALID_DATE = res.ORESULT_CUR[0].NEXT_VALID_DATE
    popupParam.VALID_RESULT = res.ORESULT_CUR[0].VALID_RESULT
    popupParam.STATUS = res.ORESULT_CUR[0].STATUS
    popupParam.MGR_COMPANY = res.ORESULT_CUR[0].MGR_COMPANY
    popupParam.MGR_EMP_NO = res.ORESULT_CUR[0].MGR_EMP_NO
    popupParam.MGR_STATUS = res.ORESULT_CUR[0].MGR_STATUS
    popupParam.MGR_UPDATE_DATE = res.ORESULT_CUR[0].MGR_UPDATE_DATE
    popupParam.MGR_REJECT_DESC = res.ORESULT_CUR[0].MGR_REJECT_DESC

    setLayout()
  })  
}

const onSearchSub = (param) => {

  commonSearchApi({
    queryId: 'DATBA0010_SELECT_07',
    param: param,
  }).then((res) => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)    
  }) 
}


//저장관련 로직 시작
const beforeSave = () => {
  if(!popupParam.VALID_RESULT){
    Message.warn(t('종합평가를 선택해주세요'))
    return false
  }

  let chkCnt = 0
  let grdSubData = grdSub.value.getDataProvider().getJsonRows()

  for (let i = 0; i < grdSubData.length; i++) {
    if(grdSubData[i].CHECK_Y === 'Y' || grdSubData[i].CHECK_N === 'Y') {
      chkCnt++
    }    
  }

  if(chkCnt === 0) {
    Message.warn(t('Check List중 최소 1개이상 체크해야 합니다.'))
    return false
  }

  return true
}

//임시저장/평가확정
const saveData = () => {
  let btn = clickButton.value
  console.log('btn',btn)
  let saveParam = []  

  let saveData = {
      CMPNY_DIV: popupParam.CMPNY_DIV,
      NOTICE_DIV: popupParam.NOTICE_DIV,
      NOTICE_NO: popupParam.NOTICE_NO,
      SEQ: isEmpty(popupParam.SEQ) ? '' : popupParam.SEQ,
      NOTICE_DOC_NO: popupParam.NOTICE_DOC_NO,
      NOTICE_DOC_REV: popupParam.NOTICE_DOC_REV,
      VALID_RESULT: popupParam.VALID_RESULT,      
      USER_ID: userStore.userId,
      VAILD_YN: btn === 'btnStandardEval' ? 'Y' : 'N',
    }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'DATBA0010_UPDATE_04',
    list: saveParam,
  }).then((res) => {

    if(!popupParam.SEQ) {
      let sSEQ = res.list[0].OUT_SEQ
      popupParam.SEQ = sSEQ
    }
    if(btn === 'btnStandardEval'){
      popupParam.STATUS = '20'
    }
    console.log('popupParam.SEQ', popupParam.SEQ)
    saveDataSub()
  })
}

const afterSave = () => {
  console.log('afterSave', '') 
  isSave.value = true 
  setLayout()
  //onSearchMain()
}

const saveDataSub = () => {
  let saveParam = []
    
  let grdSubData = grdSub.value.getDataProvider().getJsonRows()

  for (let i = 0; i < grdSubData.length; i++) {
    let saveData = {
      CMPNY_DIV: popupParam.CMPNY_DIV,
      NOTICE_DIV: popupParam.NOTICE_DIV,
      NOTICE_NO: popupParam.NOTICE_NO,      
      SEQ: popupParam.SEQ,
      CHECK_LIST_ID: grdSubData[i].CHECK_LIST_ID,
      CHECK_LIST_RESULT: grdSubData[i].CHECK_LIST_RESULT,      
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'DATBA0010_UPDATE_05',
    list: saveParam,
  })
}
//저장관련 로직 끝

//삭제관련 로직
const deleteData = () => {
  let saveParam = []  

  let saveData = {
      CMPNY_DIV: popupParam.CMPNY_DIV,
      NOTICE_DIV: popupParam.NOTICE_DIV,
      NOTICE_NO: popupParam.NOTICE_NO,      
      SEQ: popupParam.SEQ,
    }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'DATBA0010_DELETE_04',
    list: saveParam,
  })
}
//삭제관련 로직 끝

//폐기 승인관련 로직
const approveData = () => {
  let saveParam = []  

  let saveData = {
      CMPNY_DIV: popupParam.CMPNY_DIV,
      NOTICE_DIV: popupParam.NOTICE_DIV,
      NOTICE_NO: popupParam.NOTICE_NO,      
      SEQ: popupParam.SEQ,
    }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'DATBA0010_UPDATE_06',
    list: saveParam,
  })
}
//폐기 승인관련 로직 끝

//폐기 반려관련 로직
const turnBackData = () => {
  let saveParam = []  

  let saveData = {
      CMPNY_DIV: popupParam.CMPNY_DIV,
      NOTICE_DIV: popupParam.NOTICE_DIV,
      NOTICE_NO: popupParam.NOTICE_NO,      
      SEQ: popupParam.SEQ,
      MGR_REJECT_DESC: popupParam.MGR_REJECT_DESC,
    }

  saveParam.push(saveData)

  return commonExecuteApi({
    queryId: 'DATBA0010_UPDATE_07',
    list: saveParam,
  })
}
//폐기 반려관련 로직 끝


const onCellClicked = (grid, clickData) => {
  if (clickData.fieldName === 'CHECK_Y') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_N', 'N')    
  }
  if (clickData.fieldName === 'CHECK_N') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_Y', 'N')
  }

  if(grdSub.value.getDataProvider().getValue(clickData.dataRow, 'CHECK_Y') === 'Y') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_LIST_RESULT', 'Y')    
  } else if(grdSub.value.getDataProvider().getValue(clickData.dataRow, 'CHECK_N') === 'Y') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_LIST_RESULT', 'N')    
  } else {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'CHECK_LIST_RESULT', '')    
  }  
}

const clearData = () => {  
  popupParam.CMPNY_DIV= ''
  popupParam.NOTICE_DIV= ''
  popupParam.NOTICE_NO= ''
  popupParam.SEQ= ''
  popupParam.NOTICE_TITLE= ''
  popupParam.GUBUN1NM= ''
  popupParam.GUBUN2NM= ''
  popupParam.NOTICE_DOC_NO= ''
  popupParam.NOTICE_DOC_REV= '' // 개정번호
  popupParam.INSERT_DATE= '' //제개정일
  popupParam.ASGN_NM= '' 
  popupParam.EMP_NO= ''
  popupParam.KOR_NM= ''
  popupParam.VALID_DATE= ''
  popupParam.NEXT_VALID_DATE= ''
  popupParam.VALID_RESULT= ''
  popupParam.STATUS= ''
  popupParam.MGR_COMPANY= ''
  popupParam.MGR_EMP_NO= ''
  popupParam.MGR_STATUS= ''
  popupParam.MGR_UPDATE_DATE= ''
  popupParam.MGR_REJECT_DESC= ''

  if(grdSub.value.getDataProvider().rowCount > 0){ grdSub.value.getDataProvider().clearRows() }
}

// 팝업 호출시
const openPopup = (val, isAdmin) => {
  console.log('openPopup val', val)
  dialog.value = true
  IsAdmin.value = isAdmin
  
  if(val.NOTICE_NO) {
    clearData()
    popupParam.CMPNY_DIV = val.CMPNY_DIV
    popupParam.NOTICE_DIV = val.NOTICE_DIV
    popupParam.NOTICE_NO = val.NOTICE_NO  
    popupParam.SEQ = val.VALID_SEQ  
    popupParam.NOTICE_TITLE = val.NOTICE_TITLE  
    popupParam.GUBUN1NM = val.GUBUN1NM  
    popupParam.GUBUN2NM = val.GUBUN2NM  
    popupParam.NOTICE_DOC_NO = val.NOTICE_DOC_NO  
    popupParam.NOTICE_DOC_REV = val.CATEGORY1  
    popupParam.INSERT_DATE = val.INSERT_DATE 
    
    if(val.VALID_SEQ){
      onSearchMain(popupParam)
      onSearchSub(popupParam)
    }else{
      popupParam.ASGN_NM = userStore.deptNm
      popupParam.EMP_NO = userStore.userId
      popupParam.KOR_NM = userStore.userName
      onSearchSub(popupParam)
      setLayout()
    }
  } else {
    Message.warn(t('안전지침서 정보 조회 중 오류가 발생하였습니다.'))
    return false
  }
}

const setLayout = () => {
  //console.log('setLayout')
  menuTitle.value.setBtnProperty('btnApprove', 'visible', false) // 승인
  menuTitle.value.setBtnProperty('btnTurnBack', 'visible', false) // 반려
  if(popupParam.SEQ){
    // 저장 된 상태일 대
    console.log('setLayout1')
    menuTitle.value.disableBtn('btnTemporaryStorage', true)      
    menuTitle.value.disableBtn('btnStandardEval', true)
    menuTitle.value.disableBtn('btnDelete', true)
    isReadonly.value = true

    //console.log('setLayout popupParam.EMP_NO', popupParam.EMP_NO)  
    if(popupParam.EMP_NO === userStore.userId || useLogsStore().isMenuAdmin == 'Y' || IsAdmin.value == 'Y'){
      menuTitle.value.disableBtn('btnTemporaryStorage', false)      
      menuTitle.value.disableBtn('btnStandardEval', false)
      menuTitle.value.disableBtn('btnDelete', false)
      isReadonly.value = false
    }

    //console.log('setLayout popupParam.VALID_DATE', popupParam.VALID_DATE)
    if(popupParam.VALID_DATE){
      // 평가확정 시
      menuTitle.value.disableBtn('btnTemporaryStorage', true)      
      menuTitle.value.disableBtn('btnStandardEval', true)
      menuTitle.value.disableBtn('btnDelete', true)
      isReadonly.value = true

      if(popupParam.VALID_RESULT === 'C'){
        // 폐기요망 시
        if(useLogsStore().isMenuAdmin == 'Y' || IsAdmin.value == 'Y') {
          // 메뉴관리자일 때 버튼 보임
          menuTitle.value.setBtnProperty('btnApprove', 'visible', true) // 승인
          menuTitle.value.setBtnProperty('btnTurnBack', 'visible', true) // 반려
          
          if(popupParam.STATUS === '20'){
            menuTitle.value.disableBtn('btnApprove', false)      
            menuTitle.value.disableBtn('btnTurnBack', false)
            isReadonlyMGR.value = false
          } else {
            menuTitle.value.disableBtn('btnApprove', true)      
            menuTitle.value.disableBtn('btnTurnBack', true)
            isReadonlyMGR.value = true
          }
        }
      }
    }
  } else {
    // 신규 건
    console.log('setLayout2')
    menuTitle.value.disableBtn('btnTemporaryStorage', false)      
    menuTitle.value.disableBtn('btnStandardEval', false)
    menuTitle.value.disableBtn('btnDelete', true)
    isReadonly.value = false
  }
}

defineExpose({
  openPopup,
})

// ------------------------- Event ------------------------- //

// 버튼 클릭 이벤트
const onButtonsClick = btn => {

  clickButton.value = btn.id

  //임시저장
  if (btn.id === 'btnTemporaryStorage') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)      
      .run()
  }

  //평가확정
  else if (btn.id === 'btnStandardEval') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('평가확정 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(() => { 
        emit('closePopup')
        dialog.value = false })
      .run()
  }

  //삭제
  else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)      
      .setQuery(deleteData)
      .setAfter(() => { 
        emit('closePopup')
        dialog.value = false })
      .run()
  }

  //승인
  else if (btn.id === 'btnApprove') {
    new saveFlowHelper(vm, t)      
      .setQuery(approveData)
      .setConfirmMessage('승인 하시겠습니까?')
      .setAfter(() => { 
        emit('closePopup')
        dialog.value = false })
      .run()
  }

  //반려
  else if (btn.id === 'btnTurnBack') {
    if (isEmpty(popupParam.MGR_REJECT_DESC)) {
      return Message.warn('반려사유를 입력해주세요.')
    }

    new saveFlowHelper(vm, t)      
      .setQuery(turnBackData)
      .setConfirmMessage('반려 하시겠습니까?')
      .setAfter(() => { 
        emit('closePopup')
        dialog.value = false })
      .run()
  }

  // 닫기
  else if (btn.id === 'btnClose') {
    onClose()
  }
}

const onClose = () => {
  if(isSave.value) {
    emit('closePopup') 
  }
  dialog.value = false
}

onMounted(() => {
  initCodeList()  
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="900px"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet 
      height="50"
      color="primarySub"
      class="px-4 d-flex align-center rounded-t-5 cursor-move topBetween"
      @mousedown="startDragging"
    >
      <div>타당성 확인</div>      
    </v-sheet>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnTemporaryStorage', 'btnStandardEval', 'btnDelete', 'btnApprove', 'btnTurnBack', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>      
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                :label="$t('지침서명')"
                width="800px"                
                v-model="popupParam.NOTICE_TITLE"
                :readonly="true"
                label-width="70px"
              />              
            </div>
            <div class="d-flex mt-2">              
              <i-input
                :label="$t('적용사업부')"
                width="250px"                
                v-model="popupParam.GUBUN1NM"
                :readonly="true"
                label-width="70px"
              />
              <i-input
                :label="$t('작업구분')"
                width="180px"                
                v-model="popupParam.GUBUN2NM"
                :readonly="true"
                label-width="50px"
              />
              <i-input
                :label="$t('문서번호')"
                width="130px"                
                v-model="popupParam.NOTICE_DOC_NO"
                :readonly="true"
                label-width="50px"
              />
              <i-input
                :label="$t('제/개정 일자')"
                width="180px"                
                v-model="popupParam.INSERT_DATE"
                :readonly="true"
                label-width="70px"
              />
            </div>
          </v-sheet>
          
          <v-sheet class="flex-column">
            <VTable>
              <thead>
                <tr>
                  <th class="border tdBg" style="width:30%; text-align: center;">소속</th>
                  <th class="border tdBg" style="width:12%; text-align: center;">확인자</th>
                  <th class="border tdBg" style="width:14%; text-align: center;">확인일</th>
                  <th class="border tdBg" style="width:14%; text-align: center;">다음확인일</th>
                  <th class="border tdBg" style="width:30%; text-align: center;">종합평가</th>
                </tr>
              </thead>
              <tbody>
                <tr>                      
                  <td class="border pa-0" style="width:30%; text-align: center">
                    {{ popupParam.ASGN_NM }}
                  </td>                     
                  <td class="border pa-0" style="width:12%; text-align: center;">
                    {{ popupParam.KOR_NM }}
                  </td>
                  <td class="border pa-0" style="width:14%; text-align: center;">
                    {{ popupParam.VALID_DATE }}
                  </td>
                  <td class="border pa-0" style="width:14%; text-align: center;">
                    {{ popupParam.NEXT_VALID_DATE }}
                  </td>
                  <td class="border pa-0" style="width:30%; text-align: center;">
                    <v-radio-group
                      v-model="popupParam.VALID_RESULT"
                      inline
                      class="radioStyle ml-2"
                    >
                      <v-radio
                        v-for="item in codeList.VALID_RESULT"
                        :key="item"
                        :value="item.COD"
                        :label="item.TXT"
                        :readonly="isReadonly"
                      />
                    </v-radio-group>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </v-sheet>
          
          <v-sheet class="flex-column mt-2" v-if="popupParam.VALID_RESULT === 'C' && popupParam.VALID_DATE">
            <div class="d-flex">
              <i-input
                :label="$t('반려사유')"      
                width="100%"                         
                v-model="popupParam.MGR_REJECT_DESC"                
                label-width="70px"
                :readonly="isReadonlyMGR"
              />              
            </div>
          </v-sheet>          
          
          <v-sheet class="mt-2">
            <RealGrid
            ref="grdSub"
            style="height: 370px"
            :grid-view-option="grdSubProps.gridViewOption"
            :keys="grdSubProps.keys" 
            :fields="grdSubProps.fields"
            :columns="grdSubProps.columns"            
            @onCellClicked="onCellClicked"
          />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.tdBg{
  background-color: #e8eaf2;
  height: 20px !important;
}
</style>

