<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from "dayjs"
import {commonSearchApi , commonExecuteApi, commonLogExecuteApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from '@hiway/utils/notify'
import { commonBigUploadFilesApi, commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import PdfViewPopup from "@/pages/50_safety-support/SPP_E/PdfViewPopup.vue"
import EmpPopup from '@/components/popup/EmpPopup.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const t = useI18n().t //다국어
const fileInput = ref(null)
const fileInput2 = ref(null)
const route = useRoute()
const uploadFile = ref(null)
const pdfViewPopup = ref(null)
const empPopup = ref(null)
const dialog = ref(false)

const emit = defineEmits(["close"])

/* 저장, 삭제 데이터 */
const saveParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  BIKE_REG_NO: '',
  EMP_NM: '',
  EMP_NO: '',
  JOB_TIT_NM: '',
  HP_NO: '',
  TEL_NO: '',
  ASGN_NM: '',
  EDU_DATE: '',
  BIKE_NO: '',
  CAPA: '',
  SCAN_NM: '',
  VND_NAME: '',
  EDU_FILE_NM: '',
  ERASE_DESC: '',
  USE_DIV: 'P',
  IO_DIV: '',
  EDU_FILE_ID: '',
  SCAN_ID: '',
  VIOCNT: '',
  OLD_REG_NO: '',
  SCAN_ID_YN: '',
  EDU_FILE_ID_YN: '',
  MENH_ID: '',
  BOHM_ID: '',
  DUNGRK_ID: '',
  USER_ID: userStore.userId,
  FILE01: null,
  FILE02: null
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_List: [],      // 회사구분
  BSNSList: [],        // 사업부
  DEPTList: [{ ASGN_SHRT_NM:'전체', DEPT_CD: '' }],      // 부서
  IO_DIVList: [                                      // 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '사내협력사', value: 'B' }, 
    { label: '사외협력사', value: 'C' }, 
  ],
  IO_DIVList2: [                                      // 그리드내 소속구분
    { label: 'ALL', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '협력사', value: 'B' }, 
    { label: '사외', value: 'C' }, 
  ],
  USE_DIVList: [
    { label: '개인', value: 'P' }, 
    { label: '업무용', value: 'B' }, 
  ],
  ERASE_DIVList: [
    { label: '퇴사', value: 'A' }, 
    { label: '누적위반', value: 'B' }, 
    { label: '중대위반', value: 'C' }, 
    { label: '삭제', value: 'D' }, 
  ],
  STATUS_LIST: []
})

const onButtonsClick = async btn => {
  if(btn.id === 'btnUpdate') {
    save()
  }else {
    onClose()
  }
}

const save = async () => {
  let params = {}

  for(let i in saveParams){
    if(i === 'APP_DATE' || i === 'EDU_DATE'){
      params[i] = saveParams[i] ? dayjs(saveParams[i]).format('YYYYMMDD') : null
    }else {
      params[i] = saveParams[i]
    }
  }

  if(!saveParams.EMP_NM){
    Message.warn(t('신청자는 필수입력 입니다.'))
    return
  }
  if(!saveParams.HP_NO){
    Message.warn(t('휴대폰은 필수입력 입니다.'))
    return
  }
  if(!saveParams.BIKE_NO){
    Message.warn(t('차량번호는 필수입력 입니다.'))
    return
  }
  if(!saveParams.CAPA){
    Message.warn(t('배기량은 필수입력 입니다.'))
    return
  }
  if(!saveParams.SCAN_ID){
    Message.warn(t('책임보험서류는 필수입력 입니다.'))
    return
  }

  /* ********** 사외협력사 체크시 검사 ********** */
  if(saveParams.IO_DIV === 'C' && !saveParams.EDU_DATE){
    Message.warn(t('교육이수일은 필수입력 입니다.'))
    return
  }
  if(saveParams.IO_DIV === 'C' && !saveParams.VND_NAME){
    Message.warn(t('사외협력사명은 필수입력 입니다.'))
    return
  }
  if(saveParams.IO_DIV === 'C' && !saveParams.EDU_FILE_ID){
    Message.warn(t('교육이수자료는 필수입력 입니다.'))
    return
  }

  let result = await vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return
  }else {
    /* ******************* 기존등록 여부 체크 ******************** */
    commonSearchApi({ queryId : 'SPPEA0010_TAB02_SEARCH_03', param: params }).then(async res => {
      if(res.ORESULT_CUR.length > 0){
        let saveResult = await vm.$swal({ 
          title: t(`기존 차량번호 ${res.ORESULT_CUR[0].BIKE_NO} 으로 등록 되어 있는 사번입니다. 
            신규 생성시 기존 오토바이 차량은 자동 말소처리 됩니다. 
            저장 하시겠습니까?`), 
          showCancelButton: true,
        })

        if(!saveResult.isConfirmed){
          return
        }else {
          afterSave(params)
        }
      }else {
        afterSave(params)
      }
    })
  }
}


const afterSave = params => {
  commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_05', list: [params] }).then(res => {
    Message.success(t('저장되었습니다'))

    // 파일 저장
    commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_04', list: res.list })

    let afterparams = {
      userStore: userStore,
      params: params,
      mgs: '[오토바이 등록(부서/협력사용)] 화면 - 개인정보관련 수정했습니다.',
      crudGbn: 'CU', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', //사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }

    // 로그기록 
    commonLogExecuteApi(afterparams)

  }).finally(() => {
    onClose()
  })
}

/* 추가 버튼 클릭시 파일업로드 기능 실행 */
const openFileInput = gbn => {
  if(gbn === '1'){
    fileInput.value.click()
  }else {
    fileInput2.value.click()
  }
}

const handleFileInputChange = e => {
  let file = e.target.files[0]
  saveParams.SCAN_NM = file.name
  saveParams.SCAN_ID_YN = 'Y'
  
  autoFileUpload(file, 'SCAN_ID' , 'SCAN_ID_YN')
}

const handleFileInputChange2 = e => {
  let file = e.target.files[0]
  saveParams.EDU_FILE_NM = file.name
  autoFileUpload(file, 'EDU_FILE_ID' , 'EDU_FILE_ID_YN')
}

const autoFileUpload = async (file, id, yn) => {
  let guid = create_UUID()

  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  let totalChunks = Math.ceil(file.size / chunkSize)

  let currentChunk = 0

  const sendNextFile = async () => {

    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // form data 형식으로 전송
    const formData = new FormData();

    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: saveParams[id] ? saveParams[id] : guid,
      FILE_NO: '',
      FILE_TITLE: file.name,
      FILE_NAME_ORIGINAL: file.name,
      FILE_NAME: file.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: file.name.split(".").pop(),
      FILE_SIZE: Math.round(file.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks
    }

    formData.append("file", chunk, file.name)
    formData.append(
      "param",
      new Blob([JSON.stringify(param)], { type: "application/json" })
    );

    commonBigUploadFilesApi(formData).then(async res => {
      // console.log(' file upload' , res  )
      uploadFile.value = res
      saveParams[id] = res.FILE_ID ? res.FILE_ID : ''
      saveParams[yn] = 'Y'
      if (res.result.status === "207") {
        currentChunk++
        if (currentChunk < totalChunks) {
          await sendNextFile()
        }
      }else if (res.result.status === "200") {
        
      }

    }).catch((e) => {
      hasErr = true
    })
  }
  await sendNextFile()
}

/* PDF파일 뷰어 팝업 */
const viewPopup = e => {
  if(e){
    pdfViewPopup.value.openPopup(uploadFile.value)
  }
}

const openEmpPopup = () => {
  if(saveParams.IO_DIV !== 'C'){

    empPopup.value.openPopup({
        USER_DIV_D: false,  // 직영, 사내협력사
        BSNS_CD_D: false,   // 사업부
        DEPT_CD_D : false,  // 부서
        FLAG_D: false,      // 퇴직 여부
        EMP_NM: saveParams.EMP_NM,
        BSNS_CD: saveParams.BSNS_CD,
        DEPT_CD: saveParams.DEPT_CD,
        IS_EDUDC020: true,
    })

    // if (userStore.authGrpCd.includes('GRP00429')){
    //     empPopup.value.openPopup({
    //     USER_DIV_D: false,  // 직영, 사내협력사
    //     BSNS_CD_D: false,   // 사업부
    //     FLAG_D: false,      // 퇴직 여부
    //     EMP_NM: saveParams.EMP_NM,
    //     BSNS_CD: saveParams.BSNS_CD,
    //     DEPT_CD: saveParams.DEPT_CD,
    //   })
    // }else{
    //   empPopup.value.openPopup({
    //     USER_DIV_D: false,  // 직영, 사내협력사
    //     BSNS_CD_D: false,   // 사업부
    //     DEPT_CD_D : false,  // 부서
    //     FLAG_D: false,      // 퇴직 여부
    //     EMP_NM: saveParams.EMP_NM,
    //     BSNS_CD: saveParams.BSNS_CD,
    //     DEPT_CD: saveParams.DEPT_CD,
    //   })
    // }
  }
}

const onEmpSelected = val => {
  console.log("val.USER_DIV ", val.USER_DIV )
  if (val.USER_DIV === 'D'){
    Message.warn('단기공사 인원은 사외협력사로 신청해주세요.')    
  }
  saveParams.BSNS_CD = val.BSNS_CD
  saveParams.DEPT_CD = val.DEPT_CD
  saveParams.ASGN_CD = val.ASGN_CD
  
  saveParams.EMP_NM = val.EMP_NM
  saveParams.EMP_NO = val.EMP_NO
  saveParams.JOB_TIT_NM = val.JOB_TIT_NM
  saveParams.HP_NO = val.HND_PHN
  saveParams.TEL_NO = val.TEL_NO
  saveParams.IO_DIV = val.USER_DIV
}

const create_UUID = () => {
  let dt = new Date().getTime();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const openPopup = e => {
  for(let i in e){
    saveParams[i] = e[i]
  }
  dialog.value = true
}

const onClose = () => {
  for(let i in saveParams){
    saveParams[i] = ''
  }
  dialog.value = false
  emit('close')
}

const reset = () => {
  saveParams.EMP_NM = ''
  saveParams.EMP_NO = ''
  saveParams.JOB_TIT_NM = ''
  saveParams.TEL_NO = ''
  saveParams.HP_NO = ''
}

onMounted(() => {
  
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1100"
    height="400"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>신규 추가</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <v-sheet>
          <IGridTitle
            :button-list="['btnUpdate', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </v-sheet>
        <v-sheet class="searchArea flex-column fill-height mb-1 pa-3">
          <div class="d-flex align-center">
            <div class="d-flex align-center">
              <div class="formLabelText mr-4">
                {{ $t('용도구분') }}
              </div>
              <VRadioGroup
                v-model="saveParams.USE_DIV"
                inline
              >
                <VRadio
                  v-for="(item , i) in codeList.USE_DIVList"
                  :key="i"
                  :value="item.value"
                  :label="item.label"
                />
              </VRadioGroup>
            </div>
            <div class="d-flex align-center ml-6 mr-6">
              <VCheckbox
                v-model="saveParams.IO_DIV"
                true-value="C" false-value="A"
                @update:modelValue="reset()"
              />
              <div class="formLabelText ml-2">
                {{ $t('사외협력사(상주협력사/단기공사업체)') }}
              </div>
            </div>
          </div>
          <div class="d-flex pt-1">
            <i-input
              v-model="saveParams.EMP_NM"
              :label="$t('신청자')"
              label-width="65px"
              width="200px"
              append-inner-icon="mdi-magnify" 
              @click:appendInner="openEmpPopup"
              @keydown.enter="openEmpPopup"
              required
              v-if="saveParams.IO_DIV !== 'C'"
            />
            <i-input
              v-model="saveParams.EMP_NM"
              :label="$t('신청자')"
              label-width="65px"
              width="200px"
              required
              v-if="saveParams.IO_DIV === 'C'"
            />
            <i-input
              v-model="saveParams.EMP_NO"
              :label="$t('사번')"
              label-width="35px" 
              width="170px"
              :disabled="true"
              required
            />
            <i-input 
              v-model="saveParams.JOB_TIT_NM"
              :label="$t('직위')"
              label-width="35px" 
              width="170px"
              :disabled="true"
              required
            />
            <i-input 
              v-model="saveParams.HP_NO"
              :label="$t('휴대폰')"
              label-width="50px" 
              width="200px"
              required
            />
            <i-input 
              v-model="saveParams.TEL_NO"
              :label="$t('사내연락처')"
              label-width="80px" 
              width="210px"
            />
          </div>
          <div class="d-flex pt-1">
            <i-input 
              v-model="saveParams.ASGN_NM"
              :label="$t('소속조직')"
              label-width="65px"
              width="440px"
              :disabled="true"
              required
            />
            <i-input 
              v-show = "saveParams.IO_DIV === 'C'"
              v-model="saveParams.EDU_DATE"
              :label="$t('교육이수일')"
              label-width="80px"
              width="300px"
              type="date"
              :disabled="saveParams.IO_DIV === 'C' ? false : true"
              required
            />
          </div>
          <div class="d-flex pt-1">
            <i-input 
              v-model="saveParams.BIKE_NO"
              :label="$t('차량번호')"
              label-width="65px" 
              width="300px"
              required
            />
            <i-input 
              v-model="saveParams.CAPA"
              :label="$t('배기량')"
              label-width="50px" 
              width="180px"
              maxlength="4"
              oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
              required
            />
            <i-input 
              v-model="saveParams.SCAN_NM"
              :label="$t('책임보험서류')"
              label-width="80px"
              width="400px"
              readonly
              class="mr-0"
              required
            />
            <div class="d-flex align-center">
              <v-file-input v-model="saveParams.FILE01" style="display: none;" @change="handleFileInputChange" ref="fileInput" accept=".pdf"/>
              <v-btn @click="openFileInput('1')">추가</v-btn>
              <v-btn @click="viewPopup(saveParams.SCAN_NM)">보기</v-btn>
            </div>
          </div>
          <div class="d-flex pt-2">
            <div class="d-flex align-center ml-2" style="font-size: 12pt;">
              <div>
                ※ 이륜자동차 등록증, 원동기 면허증(운전면허증)은 부서/협력사 자체보관
              </div>
            </div>
          </div>
          <div class="d-flex pt-1" v-if="saveParams.IO_DIV === 'C'">
            <i-input 
              v-model="saveParams.VND_NAME"
              :label="$t('사외협력사명')"
              label-width="80px" 
              width="500px"
              required
            />
            <i-input 
              v-model="saveParams.EDU_FILE_NM"
              :label="$t('교육이수자료')"
              label-width="80px" 
              width="400px"
              readonly
              class="mr-0"
              required
            />
            <div class="d-flex align-center">
              <v-file-input v-model="saveParams.FILE02" style="display: none;" @change="handleFileInputChange2" ref="fileInput2" accept=".pdf"/>
              <v-btn @click="openFileInput(2)">추가</v-btn>
              <v-btn @click="viewPopup(saveParams.EDU_FILE_ID)">보기</v-btn>
            </div>
          </div>
        </v-sheet>
      </v-card-title>
    </v-card>
  </v-dialog>

  <!-- PDF VIEW 팝업 -->
  <PdfViewPopup ref="pdfViewPopup" />
  <!-- 인원조회팝업 -->
  <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
</template>
<style scoped lang="scss">
</style>
