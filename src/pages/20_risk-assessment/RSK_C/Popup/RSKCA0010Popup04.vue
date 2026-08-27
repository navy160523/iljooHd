<!--
  화면명 : 수시 위험성평가(비일상 작업) 등록/수정
  화면개요 : 수시 위험성평가(비일상 작업) 등록/수정
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi, commonExecuteApi } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import Message from "@hiway/utils/notify"
import dayjs from 'dayjs'
// 참석 대상 선택
import SelectAddEmpPopup from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup01.vue'
import FileUpload from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup02.vue'
// 부서 선택 팝업
import SelectDept from "@/components/popup/DeptPopup.vue"
// 장소 선택 팝업
import LocationPopup from '@/components/popup/LocationPopup.vue'

import Discript from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup03.vue'

// 다이얼로그 관련
const vm = getCurrentInstance().proxy
// 유저정보
const userStore = useUserStore()
// 다국어
const t = useI18n().t
const emit = defineEmits(["selected"])
const dialog = ref(false)
const menuTitle = ref(null)
const selectAddEmpPopup = ref(null)  // 참석자 선택
const selectDept = ref(null)
const locationPopup = ref(null)
const discript = ref(null)
const fileUpload = ref(null)         // 파일 업로드
const params = ref([])

// 신규 구분
const isNew = ref(false)

const isReadOnly = ref(true)

const popupParams = reactive({
  COMPANY_CD: "",
  NROUTINE_WORK_ID: "",
  DEPT_CD: "",
  DEPT_NM: "",
  WORK_NM: "",
  WORK_CONTENT: "",
  WORK_ASGN_NM: "",
  WORK_ASGN_CD: "",
  WORK_LOCATION: "",  
  EXPECTED_ST_DT: "",
  EXPECTED_ED_DT: "",
  PARYT_MEMBERS: "",
  MEMBERS: "",
  NON_ROUTINE_WROK_REASON: "",
  SHOW_MEMBERS: "",
  CHANGE_MNG_CHK_LIST: "",
  RISK_LEVEL: "",
  REGULAR_RSK_METHOD: "",
  SITE_CHECK_RESULT: "",
  SITE_CHECK_PIC: "",
  FILE_ID: "",
  FILE_TITLE: "",
  FILE_COUNT: "",
  SAFE_INFO_WORK_TOOLS: "",
  SAFE_INFO_WORK_EQUIPS: "",
  SAFE_INFO_WORK_CHEMI: "",
  SAFE_INFO_CONTRACOTR_REVIEWER: "",
  USER_NM: "",
  INS_DT: "",
  WORK_PERIOD: "",
  EDU_FILE_ID: "",
  EDU_FILE_COUNT: "",
  INS_DT2: "",
  APP_KEY: "",
  APP_STATUS_NM: "",
  APP_STATUS: "",
  APP_EMP_NO: "",
  INS_USR: "",
  gridOnly:""
})

// 코드리스트
const codeList = reactive({    
  CHANGE_MNG_CHK_LIST: [
    { COD: 'A', TXT: '기술 변화' },
    { COD: 'B', TXT: '설비 변화' },
    { COD: 'C', TXT: '조직 변화' },
    { COD: 'D', TXT: '환경 변화' },
    { COD: 'E', TXT: '사고 발생' },
  ],
  MAIN_RISK_LEVEL: [
    { COD: 'A', TXT: '상' },
    { COD: 'B', TXT: '중' },
    { COD: 'C', TXT: '하' },
  ]
})

// popup open
const openPopup = async el => {
  for (let i in popupParams) {
    popupParams[i] = ''
  } 

  dialog.value = true

  // 신규일 때
  if (el.isNew) {
    isNew.value = true
    popupParams.COMPANY_CD = userStore.cmpnyDiv    
    popupParams.DEPT_CD = userStore.deptCd    
    popupParams.DEPT_NM = userStore.userDiv === 'B' ? userStore.asgnNm : userStore.deptNm
    popupParams.WORK_ASGN_CD = userStore.asgnCd
    popupParams.WORK_ASGN_NM = userStore.asgnNm
    popupParams.INS_DT = dayjs().format('YYYY-MM-DD')
    popupParams.EXPECTED_ST_DT = dayjs().format('YYYY-MM-DD')
    popupParams.EXPECTED_ED_DT = dayjs().format('YYYY-MM-DD')
    popupParams.USER_NM = userStore.userName
    popupParams.INS_DT2 = dayjs().format('YYYY-MM-DD')

  } else { // 상세조회일 때
    isNew.value = false
    // 데이터 바인딩
    for (let i in el) {
      popupParams[i] = el[i]
    }
  }

  setReadOnly()
}

const setReadOnly = () => {
  // console.log('param', param)
  // console.log('userStore.userDiv', userStore.userDiv)
  // console.log('param.IS_SAVE', param.IS_SAVE)
  // console.log('param.INS_USR', param.INS_USR)
  // console.log('param.APP_STATUS', param.APP_STATUS)

  if(userStore.userDiv === 'A') {
    if(!isNew.value) {
      if(popupParams.DEPT_CD === userStore.deptCd) {
        if(popupParams.APP_STATUS === '10' || popupParams.APP_STATUS === '11') { 
          isReadOnly.value = false                   
        } else {          
          isReadOnly.value = true          
        }
      } else {    
        isReadOnly.value = true            
      }
    } else {
      if(popupParams.DEPT_CD === userStore.deptCd) {
        isReadOnly.value = false        
      } else {
        isReadOnly.value = true        
      }      
    }
  } else {
    if(!isNew.value) {
      if(popupParams.WORK_ASGN_CD === userStore.asgnCd) {
        if(popupParams.APP_STATUS === '10' || popupParams.APP_STATUS === '11') {  
          isReadOnly.value = false                  
        } else {       
          isReadOnly.value = true             
        }
      } else { 
        isReadOnly.value = true               
      }
    } else {
      if(popupParams.WORK_ASGN_CD === userStore.asgnCd) {
        isReadOnly.value = false        
      } else {
        isReadOnly.value = true        
      }
    }
  }

  if(isReadOnly.value){
    menuTitle.value.disableBtn('btnUpdate', true)
  } else{
    menuTitle.value.disableBtn('btnUpdate', false)
  }
}

// 버튼 클릭 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === "btnClose") {
    closePopup()
  } else if (btn.id === "btnUpdate") {
    saveData()
  } 
}


// 저장
const saveData = async () => {
  let saveParams1 = {} 
  
  // saveParams1
  saveParams1.COMPANY_CD = popupParams.COMPANY_CD  
  saveParams1.DEPT_CD = popupParams.DEPT_CD
  saveParams1.NROUTINE_WORK_ID = popupParams.NROUTINE_WORK_ID ? popupParams.NROUTINE_WORK_ID : ''
  saveParams1.WORK_NM = popupParams.WORK_NM  
  saveParams1.WORK_CONTENT = popupParams.WORK_CONTENT
  saveParams1.WORK_ASGN_CD = popupParams.WORK_ASGN_CD
  saveParams1.EXPECTED_ST_DT = popupParams.EXPECTED_ST_DT.replace(/-/g, '')
  saveParams1.EXPECTED_ED_DT = popupParams.EXPECTED_ED_DT.replace(/-/g, '')
  saveParams1.WORK_LOCATION = popupParams.WORK_LOCATION
  saveParams1.CHANGE_MNG_CHK_LIST = popupParams.CHANGE_MNG_CHK_LIST
  saveParams1.RISK_LEVEL = popupParams.RISK_LEVEL
  saveParams1.SITE_CHECK_RESULT = popupParams.SITE_CHECK_RESULT
  saveParams1.SAFE_INFO_WORK_TOOLS = popupParams.SAFE_INFO_WORK_TOOLS
  saveParams1.SAFE_INFO_WORK_EQUIPS = popupParams.SAFE_INFO_WORK_EQUIPS
  saveParams1.SAFE_INFO_WORK_CHEMI = popupParams.SAFE_INFO_WORK_CHEMI
  saveParams1.CONTRACOTR_REVIEWER = popupParams.SAFE_INFO_CONTRACOTR_REVIEWER
  saveParams1.PARYT_MEMBERS = popupParams.PARYT_MEMBERS
  saveParams1.WORK_PERIOD = popupParams.WORK_PERIOD
  saveParams1.FILE_ID = popupParams.FILE_ID
  saveParams1.EDU_FILE_ID = popupParams.EDU_FILE_ID
  saveParams1.USER_ID = userStore.userId
  saveParams1.APP_EMP_NO = popupParams.APP_EMP_NO

  if (!saveParams1.WORK_LOCATION) {
    return Message.warn(t('작업장소를 입력해주세요.'))
  } else if (!saveParams1.EXPECTED_ST_DT) {
    return Message.warn(t('예상작업기간 시작일을 입력해주세요.'))
  } else if (!saveParams1.EXPECTED_ED_DT) {
    return Message.warn(t('예상작업기간 종료일을 입력해주세요.'))
  } else if (!saveParams1.WORK_NM) {
    return Message.warn(t('작업명을 입력해주세요.'))
  } else if (!saveParams1.WORK_CONTENT) {
    return Message.warn(t('작업내용을 입력해주세요.'))
  } else if (!saveParams1.PARYT_MEMBERS) {
    return Message.warn(t('참석자를 입력해주세요.'))
  } else if (!saveParams1.CHANGE_MNG_CHK_LIST) {
    return Message.warn(t('변화관리 체크리스트를 선택해주세요.'))
  } else if (!saveParams1.RISK_LEVEL) {
    return Message.warn(t('위험성 수준을 선택해주세요.'))
  } else if (!saveParams1.SITE_CHECK_RESULT) {
    return Message.warn(t('현장점검 결과를 입력해주세요.'))
  } else if (!saveParams1.SAFE_INFO_WORK_TOOLS) {
    return Message.warn(t('작업도구를 입력해주세요.'))
  } else if (!saveParams1.SAFE_INFO_WORK_EQUIPS) {
    return Message.warn(t('장비 및 설비를 입력해주세요.'))
  } else if (!saveParams1.SAFE_INFO_WORK_CHEMI) {
    return Message.warn(t('사용화학물질 정보를 입력해주세요.'))
  } else if (!saveParams1.CONTRACOTR_REVIEWER) {
    return Message.warn(t('직영부서 담당자를 입력해주세요.'))
  }

  if (saveParams1.EXPECTED_ED_DT < saveParams1.EXPECTED_ST_DT) {
    return Message.warn('종료일이 시작일보다 작습니다. 다시 설정해주세요.')
  }

  vm.$swal({
    title: t("저장 하시겠습니까?"),
    showCancelButton: true,
  }).then(swal => {
    if (swal.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'RSKCA0010_SAVE_01',
        list: [saveParams1] 
      }).then(res => {
        if (res.result.status === '200') {
          emit('selected', res.list[0])
          //console.log('OUT_RES_SEQ',res.list[0].OUT_RES_SEQ)
          popupParams.NROUTINE_WORK_ID = res.list[0].OUT_NROUTINE_WORK_ID
          isNew.value = false
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        Message.success(t('저장 되었습니다.'))
        //closePopup()
      })
    }
  })  
}

const searchEmpInfo = () => {
  if(!isReadOnly.value){
    selectAddEmpPopup.value.openPopup({
        title: popupParams.WORK_NM,
        dataRow: 1,
        fieldIndex: 1,
        PARYT_MEMBERS: popupParams.PARYT_MEMBERS ? popupParams.PARYT_MEMBERS.split(',') : '',
        NROUTINE_WORK_ID: popupParams.NROUTINE_WORK_ID,
        BSNS_CD: popupParams.BSNS_CD,
        DEPT_CD: popupParams.DEPT_CD
      })
  }
}

// 참석자 선택 후
const onSelectEmp = async val => {
  console.log('val = ', val)

  let cnt = val.SHOW_MEMBERS.length
  let first = val.SHOW_MEMBERS[0]
  let member

  if(cnt <= 0)
    return

  if(cnt == 1)
    member = first
  else
    member = first + ' 외 ' + (cnt-1) + '명'

  let sPARYT_MEMBERS = val.PARYT_MEMBERS.join(', ')
  let sSHOW_MEMBERS = val.SHOW_MEMBERS.join(', ')

  //console.log('sPARYT_MEMBERS = ', sPARYT_MEMBERS)
  //console.log('sSHOW_MEMBERS = ', sSHOW_MEMBERS)

  popupParams.PARYT_MEMBERS = sPARYT_MEMBERS
  popupParams.MEMBERS = member
  popupParams.SHOW_MEMBERS = sSHOW_MEMBERS
}

// 참석자 팝업 닫기
const closeSelectEmp = val => {
  //onButtonsClick({ id: 'btnSearch' })
}

// 부서 선택 팝업
const onSearchDept = () => {
  if(!isReadOnly.value){
    selectDept.value.openPopup({})
  }
}

const onDeptSelected = (val) => {  
  popupParams.DEPT_CD = val.DEPT_CD
  popupParams.WORK_ASGN_CD = val.ASGN_CD
  popupParams.DEPT_NM = val.ASGN_SHRT_NM
}

// 장소 선택 팝업
const onSearchLocation = () => {
  if(!isReadOnly.value){
    locationPopup.value.openPopup({})
  }
}

const selectedLocation = (val) => {  
  //console.log('selectedLocation ::::::: ', val)
  popupParams.WORK_LOCATION = val[2].TXT
}

const openDiscript = (val) => {
  discript.value.openPopup(val)
}

// 점검사진 팝업
const onOpenFile = () => {
  let data = popupParams
  data.gridOnly = isReadOnly.value
  fileUpload.value.openPopup(data, 'FILE_ID')  
}

// 파일 업로드 후
const onFileSelected = val => {
  if(val) {
    console.log('file val = ', val)
    popupParams.FILE_ID = val.FILE_ID
    popupParams.FILE_COUNT = val.FILE_CNT + '건'    
  }
}

const onChangeRISK_LEVEL = () => {
  let newValue = popupParams.RISK_LEVEL

  if(newValue == 'A')
    popupParams.REGULAR_RSK_METHOD = 'Table Meeting(안전 포함)'
  else if(newValue == 'B')
    popupParams.REGULAR_RSK_METHOD = 'Table Meeting(자체 수행)'
  else if(newValue == 'C')
    popupParams.REGULAR_RSK_METHOD = 'Standing Meeting'
}

// 팝업 닫기
const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})

onMounted(() => {})
</script>

<template>
  <VDialog
    v-model="dialog"
    scrollable
    eager
    persistent
    :width="isNew ? '1200' : '1200'"
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
      <span>수시 위험성평가(비일상 작업) 등록/수정</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0">
        <!-- (1)신규 -->
        <IGridTitle  
          ref="menuTitle"        
          :title="''"          
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />        
      </v-card-title>
      <v-card-text class="pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="flex-column" style="text-align: center">
            <VTable style="overflow: hidden;">
              <tbody style="overflow: hidden">
                <tr>
                  <!-- 소속조직 -->
                  <td class="border pa-0 thBg"
                      style="width: 130px; text-align: center"
                  >
                    <div class="d-flex justify-center">
                      <p>소속조직</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0">
                    <VRow class="d-flex align-center">
                      <VCol md="10" class="pl-5">
                        {{ popupParams.DEPT_NM }}
                      </VCol>
                      <VCol md="2" class="d-flex align-center">                        
                          <svg-icon name="search" @click="onSearchDept" style="cursor: pointer;"/>
                      </VCol>
                    </VRow>
                  </td>
                  <!-- 작성자 -->
                  <td
                    class="border pa-0 thBg"
                    style="width: 130px; text-align: center"
                  >
                    작성자
                  </td>
                  <td class="border pa-0" style="width: 200px; text-align: center; background-color: whitesmoke;">
                    {{ popupParams.USER_NM }}
                  </td>
                  <!-- 작성일자 -->
                  <td class="border pa-0 thBg" style="width: 130px; text-align: center">
                    작성일자
                  </td>
                  <td class="border pa-0" style="width: 200px; text-align: center; background-color: whitesmoke;">
                    {{ popupParams.INS_DT2 }}
                  </td>                  
                </tr>
                <tr>
                  <!-- 작업장소 -->
                  <td
                    class="border pa-0 thBg"                    
                  >
                    <div class="d-flex justify-center">
                      <p>작업장소</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td
                    class="border pa-0"
                  >
                    <VRow class="d-flex align-center">
                      <VCol md="10" class="pl-5">
                        <VTextField
                          v-model="popupParams.WORK_LOCATION"
                          variant="solo"
                          :readonly="isReadOnly"
                          placeholder="장소선택 또는 직접입력"                          
                        />                                                
                      </VCol>
                      <VCol md="2" class="d-flex align-center">                        
                        <svg-icon name="search" @click="onSearchLocation" style="cursor: pointer;"/>
                      </VCol>                     
                    </VRow>
                  </td>
                  <!-- 예상작업기간 -->
                  <td
                    class="border pa-0 thBg"                    
                  >
                    <div class="d-flex justify-center">
                      <p>예상작업기간</p>
                      <svg-icon class="dot" name="redDot" />                      
                    </div>
                  </td>
                  <td
                    class="border pa-0"
                    style="text-align: center"
                    colspan="3"                    
                  >
                    <v-row no-gutters class="align-center">
                      <i-input 
                        type="date" 
                        v-model="popupParams.EXPECTED_ST_DT"
                        width="140px" 
                        labelWidth="0px" 
                        class="mr-2 ml-2"
                        :readonly="isReadOnly"
                      />
                      <i-input 
                        type="date" 
                        v-model="popupParams.EXPECTED_ED_DT"
                        width="160px" 
                        labelWidth="10px"  
                        :label="t('-')"
                        :readonly="isReadOnly"
                      />
                      <v-radio-group inline v-model="popupParams.WORK_PERIOD" class="radioGroup">
                        <v-radio color="primary" label="주간" :value="'A'" class="mr-4" :readonly="isReadOnly"></v-radio>
                        <v-radio color="primary" label="야간" :value="'B'" :readonly="isReadOnly"></v-radio>            
                      </v-radio-group>
                    </v-row>
                  </td>
                </tr>
                <!-- 작업명 -->
                <tr>
                  <td class="border pa-0 thBg">
                    <div class="d-flex justify-center">
                      <p>작업명</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" colspan="5">                    
                    <VTextarea
                      v-model="popupParams.WORK_NM"
                      variant="solo"
                      hide-details
                      :no-resize="false"
                      rows="2"
                      :readonly="isReadOnly"
                    />
                  </td>
                </tr>

                <!-- 작업내용-->
                <tr>
                  <td class="border pa-0 thBg">
                    <div class="d-flex justify-center">
                      <p>작업내용</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" colspan="5">
                    <VTextarea
                      v-model="popupParams.WORK_CONTENT"
                      variant="solo"
                      hide-details
                      :no-resize="false"
                      rows="5"
                      :readonly="isReadOnly"
                    />
                  </td>
                </tr>

                <!-- 참석자-->
                <tr>
                  <td class="border pa-0 thBg">
                    <div class="d-flex justify-center">
                      <p>참석자</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" colspan="5">
                    <v-row no-gutters>
                      <v-col cols="11">
                        {{ popupParams.SHOW_MEMBERS }}
                      </v-col>
                      <v-col cols="1">
                        <svg-icon name="peoplePlus" @click="searchEmpInfo" style="cursor: pointer; height:24px"/>
                      </v-col>
                    </v-row>
                  </td>
                </tr>

              </tbody>
            </VTable>

            <!-- 수시 위험성평가 대상 선정-->
            <VTable style="overflow: hidden;" class="mt-2">
              <tbody style="overflow: hidden">
                <tr>
                  <td class="border pa-0 thBg"
                    style="width: 130px; text-align: center"
                    rowspan="2">
                      수시 위험성평가<br/>대상 선정
                  </td>                  
                  <td class="border pa-0 thBg" style="width:330px;">                    
                    <div class="d-flex justify-center">
                      <p>변화관리 체크리스트</p> 
                      <svg-icon class="dot" name="redDot" />                     
                      <svg-icon name="tooltip" @click="openDiscript('CHANGE_MNG_CHK_LIST')" style="cursor: pointer; height:20px; margin-left:4px;"/>
                    </div>
                  </td>
                  <td class="border pa-0 thBg" style="width:230px;">
                    <div class="d-flex justify-center">
                      <p>위험성 수준</p> 
                      <svg-icon class="dot" name="redDot" />                     
                      <svg-icon name="tooltip" @click="openDiscript('RISK_LEVEL')" style="cursor: pointer; height:20px; margin-left:4px;"/>
                    </div>                    
                  </td>
                  <td class="border pa-0 thBg" >수시 위험성평가 방법</td>
                </tr>                
                <tr no-gutters class="align-center pa-0" style="text-align: center"> 
                  <td class="border pa-0" style="text-align: center">
                    <i-select
                      :label="$t('')"
                      label-width="0px" 
                      width="290px"
                      v-model="popupParams.CHANGE_MNG_CHK_LIST"
                      :items="codeList.CHANGE_MNG_CHK_LIST"
                      item-value="COD"
                      item-title="TXT"
                      class="ml-4"     
                      :readonly="isReadOnly"                  
                    />
                  </td>
                  <td class="border pa-0" style="text-align: center">
                    <i-select
                      :label="$t('')"
                      label-width="0px" 
                      width="190px"
                      v-model="popupParams.RISK_LEVEL"
                      :items="codeList.MAIN_RISK_LEVEL"
                      item-value="COD"
                      item-title="TXT"
                      class="ml-4"
                      @update:model-value = onChangeRISK_LEVEL()   
                      :readonly="isReadOnly"                    
                    />
                  </td>
                  <td class="border pa-0" style="background-color: whitesmoke;">
                    {{ popupParams.REGULAR_RSK_METHOD }}
                  </td>
                </tr>
              </tbody>
            </VTable>

            <!-- 현장점검 결과 -->
            <VTable style="overflow: hidden;" class="mt-2">
              <tbody style="overflow: hidden">
                <tr>                  
                  <td class="border pa-0 thBg"
                      style="width: 130px; text-align: center"
                      rowspan="2"
                  >
                    <div class="d-flex justify-center">
                      <p>현장점검 결과</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>                      
                  </td>
                  <td class="border pa-0" rowspan="2">
                    <VTextarea
                      v-model="popupParams.SITE_CHECK_RESULT"
                      variant="solo"
                      hide-details
                      :no-resize="false"
                      rows="5"
                      :readonly="isReadOnly"
                    />
                  </td>
                  <td class="border pa-0 thBg"
                      style="width:200px; text-align: center;"                                                                 
                  >
                      점검사진
                  </td>
                </tr>                
                <tr no-gutters class="align-center pa-0" style="text-align: center"> 
                  <td class="border pa-0">
                    <v-row no-gutters>
                      <v-col cols="10">
                        {{ popupParams.FILE_COUNT }}
                      </v-col>
                      <v-col cols="2">
                        <svg-icon name="search" @click="onOpenFile" style="cursor: pointer; height:24px"/>
                      </v-col>
                    </v-row>
                  </td>                                   
                </tr>
              </tbody>
            </VTable>

            <!-- 작업도구, 장비 및 설비, 사용화학물질정보, 직영부서 담당자-->
            <div class="mt-2" style="text-align:left"><span style="color:red;">※해당 내용 없을 시, "없음" 기입</span></div>
            <VTable style="overflow: hidden;">
              <tbody style="overflow: hidden">                
                <tr no-gutters class="align-center pa-0 thBg" style="text-align: center">
                  <td class="border pa-0" style="width:25%;">
                    <div class="d-flex justify-center">
                      <p>작업도구</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" style="width:25%;">
                    <div class="d-flex justify-center">
                      <p>장비 및 설비</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" style="width:25%;">
                    <div class="d-flex justify-center">
                      <p>사용화학물질 정보</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                  <td class="border pa-0" style="width:25%;">
                    <div class="d-flex justify-center">
                      <p>직영부서 담당자</p>
                      <svg-icon class="dot" name="redDot" />
                    </div>
                  </td>
                </tr>
                <tr no-gutters class="align-center pa-0" style="text-align: center"> 
                  <td class="border pa-0">
                    <VTextField
                      v-model="popupParams.SAFE_INFO_WORK_TOOLS"
                      variant="solo"
                      :readonly="isReadOnly"
                    />
                  </td>
                  <td class="border pa-0">
                    <VTextField
                      v-model="popupParams.SAFE_INFO_WORK_EQUIPS"
                      variant="solo"
                      :readonly="isReadOnly"
                    />
                  </td>
                  <td class="border pa-0">
                    <VTextField
                      v-model="popupParams.SAFE_INFO_WORK_CHEMI"
                      variant="solo"
                      :readonly="isReadOnly"
                    />
                  </td>
                  <td class="border pa-0">
                    <VTextField
                      v-model="popupParams.SAFE_INFO_CONTRACOTR_REVIEWER"
                      variant="solo"
                      :readonly="isReadOnly"
                    />
                  </td>
                </tr>
              </tbody>
            </VTable>
          </v-sheet> 
        </div>
      </v-card-text>
    </v-card>

    <!-- 참석자 선택 팝업 -->
    <SelectAddEmpPopup 
      ref="selectAddEmpPopup"
      @selected="onSelectEmp"
      @closed="closeSelectEmp"
    />

    <!-- 파일 업로드 -->
    <FileUpload 
      ref="fileUpload"
      @selected="onFileSelected"
    />
    
    <!-- 부서 선택 -->
    <SelectDept ref="selectDept" @selected="onDeptSelected" />

    <!-- 장소 -->
    <LocationPopup ref="locationPopup" @selectedArr="selectedLocation" />

    <!-- 설명팝업 -->
    <Discript ref="discript" />
    
    
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.thBg {
  background-color: #e8eaf2;
  font-weight: bold;
}

/* 참석자 출력 */
.btnH {
  font-size: 12px;
  height: 40px;
}

.btnParticipant {
  background-color: #e8eaf2;
  border-radius: 5px;
  text-align: center;
}

.btnDelParticipant {
  background-color: #ff1d00;
  border-radius: 5px;
  text-align: center;
  height: 100%;
  font-size: 15px;
  color: white;
  line-height: 40px;
}

div.v-col-md-1.v-col-12 {
  align-self: center;
  text-align: center;
}

.v-table {
  overflow: hidden;
  width:99%;
}

div.v-table__wrapper {
  overflow: hidden !important;
}

.dot {
  justify-content: normal !important;
  align-items: normal !important;
} 
</style>
