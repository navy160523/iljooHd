<!--
  화면명 : 작업환경개선계획 수정 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IUpload from "@/components/IUpload.vue"
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import _ from 'lodash'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const empPopup = ref(null)
const fileUpload=ref('')

// 조회조건
const searchParams = reactive({
  ACT_DATE: '',
  ACT_DETAIL: '',
  APP_DATE: '',
  APP_STATUS: '',
  ASGN_CD: '',
  BSNS_CD: '',
  CMPNY_DIV: '',
  DEPT_CD: '',
  EST_STEP: '',
  FILE_ID: '',
  FILE_YN: '',
  GBN_NM: '',
  GBN_NO: '',
  HARM_NM: '',  
  PLAN_ACT_DATE: '',
  PLAN_DECREASE: '',
  POINT: '',
  PROCESS_CD: '',
  PROCESS_NM: '',
  REPAIR_USER: '',
  REPAIR_USER_NM: '',
  RISK_PLAN: '',
  YEAR: '',
  ONLY_VIEW: false, // 읽기 전용 구분
})

const codeList = reactive({
  EST_STEP: [
    {COD:'1',TXT:'1단계[매우 낮음]'},
    {COD:'2',TXT:'2단계[낮음]'},
    {COD:'3',TXT:'3단계[보통]'},
    {COD:'4',TXT:'4단계[높음]'},
    {COD:'5',TXT:'5단계[매우 높음]'},
  ],
})

// 팝업 OPEN
const openPopup = (param) => {
  Object.assign(searchParams, param);
  checkFileId()
  dialog.value = true
}

// 팝업 CLOSE
const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

// button click event
const onButtonsClick = (btn) => {
  if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  }else if(btn.id === 'btnClose'){
    closePopup()
  }  
}

// 추진자 검색
const openEmpPopup = () => {
  empPopup.value.openPopup({ BSNS_CD: searchParams.BSNS_CD, DEPT_CD: searchParams.DEPT_CD})
}

// 인원 선택 완료
const onEmpSelected = val => {
  searchParams.REPAIR_USER_NM = val.EMP_NM
  searchParams.REPAIR_USER = val.EMP_NO
}

// 저장
const saveData = () => {
  let saveParam = _.cloneDeep(searchParams)
  if(!isEmpty(searchParams.PLAN_ACT_DATE)) {
    saveParam.PLAN_ACT_DATE = dayjs(searchParams.PLAN_ACT_DATE).format('YYYYMMDD')
  }
  if(!isEmpty(searchParams.ACT_DATE)) {
    saveParam.ACT_DATE = dayjs(searchParams.ACT_DATE).format('YYYYMMDD')
  }
  return commonExecuteApi({ queryId : 'HLTAB0020_SAVE_01', list: [saveParam] })
}

// 저장 후
const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

// 파일 업로드 후 처리
const checkFileId = () => {
  if (isEmpty(searchParams.FILE_ID)) {
    fileUpload.value.setGuid()
  } else {
    //파일아이디 있을때
    fileUpload.value.setGuid(searchParams.FILE_ID)
  }
  searchParams.FILE_ID = fileUpload.value.guid
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
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
    height="1000"
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
      <span>작업환경개선계획 관리</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="searchParams.ONLY_VIEW ? ['btnClose'] : ['btnUpdate','btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>     
        <v-sheet class="pa-4 pt-0 h-auto">
          <IGridTitle
            ref="menuTitle"
            :title="t('실적등록')"
          /> 
          <div class="h-auto table_area">
            <table class="w-100">
              <tbody>
                <tr>
                  <th width="33%">개선추진자</th>
                  <th width="33%">조치예정일</th>
                  <th width="33%">조치일자</th>
                </tr>
                <tr>
                  <td>
                    <i-input
                      v-model="searchParams.REPAIR_USER_NM"
                      type="text"
                      append-inner-icon="mdi-magnify"
                      width="100%"
                      @click:appendInner="openEmpPopup"
                      @keydown.enter="openEmpPopup"
                      bgColor="#eff8fd"
                      :readonly="searchParams.ONLY_VIEW"
                    >
                      <template #append-inner>
                        <v-icon 
                          icon="mdi-window-close"
                          @click="clearEmp"
                        />
                      </template>
                    </i-input>
                  </td>
                  <td>
                    <i-input
                      v-model="searchParams.PLAN_ACT_DATE"
                      type="date"
                      width="100%"
                      bgColor="#eff8fd"
                      :readonly="searchParams.ONLY_VIEW"
                    />
                  </td>
                  <td>
                    <i-input
                      v-model="searchParams.ACT_DATE"
                      type="date"
                      width="100%"
                      bgColor="#eff8fd"
                      :readonly="searchParams.ONLY_VIEW"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <table class="w-100">  
              <!-- </tbody> -->
              <tbody>
                <tr>
                  <th width="15%">위험구분</th>
                  <th width="15%">개선전 위험성 단계</th>
                  <th>현행 위험성 감소대책</th>
                  <th width="15%">개선후 추정 위험성 단계</th>
                </tr>
                <tr>
                  <td>{{  searchParams.GBN_NM }}</td>
                  <td rowspan="3">{{ searchParams.POINT }}</td>
                  <!-- <td>{{ searchParams.PLAN_DECREASE }}</td> -->
                  <td >
                    <i-textarea
                      v-model="searchParams.PLAN_DECREASE"
                      type="text"
                      width="100%"
                      readonly
                    />
                  </td>
                  <td rowspan="3">
                    <i-select
                      v-model="searchParams.EST_STEP"
                      :items="codeList.EST_STEP"
                      item-value="COD"
                      item-title="TXT"
                      width="100%"
                      bgColor="#eff8fd"
                      :readonly="searchParams.ONLY_VIEW"
                    />
                  </td>
                </tr>
                <tr>
                  <th >대상공정/직무</th>
                  <th >위험성 저감 계획</th>
                </tr>
                <tr>
                  <td >{{ searchParams.PROCESS_NM }}</td>
                  <td >
                    <i-textarea
                      v-model="searchParams.RISK_PLAN"
                      type="text"
                      width="100%"
                      bgColor="#eff8fd"
                      :readonly="searchParams.ONLY_VIEW"
                    />
                  </td>
                </tr>   
              </tbody>   
            </table>
            <table class="w-100">  
              <!-- </tbody>-->
              <tbody> 
                <tr>
                  <th width="15%">조치결과 상세내용</th>
                <!-- </tr>
                <tr> -->
                  <td>
                    <i-textarea
                      v-model="searchParams.ACT_DETAIL"
                      width="100%"
                      bgColor="#eff8fd"
                      :readonly="searchParams.ONLY_VIEW"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-sheet>
        <v-sheet class="pa-4 pt-0 h-auto">
          <IUpload
            ref="fileUpload"
            :max-file-size="300"
            :button-list="fileUploadButton"
            auto-upload
            :gridTitle="t('파일 첨부')"
            :is-visibled="!searchParams.ONLY_VIEW"
            style="height: 200px"
            :isCmpnyDiv="false"
          />
        </v-sheet>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
  </v-dialog>
</template>

<style scoped lang="scss">
th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
}

.no-click {
  pointer-events: none;
}
</style>
