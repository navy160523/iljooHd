<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from "dayjs"
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from '@hiway/utils/notify'
import { commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import PdfViewPopup from "@/pages/50_safety-support/SPP_E/PdfViewPopup.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const menuTitle = ref(null)
const fileInput = ref(null)
const fileInput2 = ref(null)
const route = useRoute()
const uploadFile = ref(null)
const pdfViewPopup = ref(null)
const isReadonly = ref(true)
 
/* 조회 데이터 */
const props = defineProps({
  searchParams: {
    Type: Object,
    default: {},
  },
})

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
  USE_DIV: '',
  IO_DIV: '',
  EDU_FILE_ID: '',
  SCAN_ID: '',
  VIOCNT: '',
  OLD_REG_NO: '',
  SCAN_ID_YN: '',
  EDU_FILE_ID_YN: '',
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
    { label: '업무용', value: '2' }, 
  ],
  ERASE_DIVList: [
    { label: '퇴사', value: 'A' }, 
    { label: '누적위반', value: 'B' }, 
    { label: '중대위반', value: 'C' }, 
    { label: '삭제', value: 'D' }, 
  ],
  STATUS_LIST: []
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, stateBar: { visible: false }, edit: { editable:false }  },
  keys : ['PRCS_CD','DET_PRCS_CD','EM_PART_CD'],
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width: '400', styleName: 'left-column'},
    { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('사외협력사명') }, width: '180', styleName: 'left-column'},
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('소속구분') },lookupDisplay: true, lookupData: codeList.IO_DIVList2},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }},
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') }},
    { fieldName: 'USE_DIV_NM', dataType: 'text', header: { text: t('용도구분') }, styleName: 'left-column'},
    { fieldName: 'BIKE_REG_NO', dataType: 'text', header: { text: t('등록번호(신)') }, width: '150'},
    { fieldName: 'OLD_REG_NO', dataType: 'text', header: { text: t('등록번호(구)') }, width: '150'},
    { fieldName: 'ISS_DATE', dataType: 'text', header: { text: t('발급일자') }, width: '150',displayCallback: function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}},
    { fieldName: 'BIKE_NO', dataType: 'text', header: { text: t('차량번호') }, width: '150'},
    { fieldName: 'CAPA', dataType: 'text', header: { text: t('배기량') } },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내연락처') }, width: '150',lookupDisplay: true, lookupData: codeList.ERASE_DIVList},
    { fieldName: 'VIOCNT', dataType: 'text', header: { text: t('위반횟수') }, width: '150'},
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'HP_NO', dataType: 'text', header: { text: t('HP_NO') }, visible: false },
    { fieldName: 'EDU_DATE', dataType: 'text', header: { text: t('EDU_DATE') }, visible: false },
    { fieldName: 'SCAN_NM', dataType: 'text', header: { text: t('SCAN_NM') }, visible: false },
    { fieldName: 'EDU_FILE_NM', dataType: 'text', header: { text: t('EDU_FILE_NM') }, visible: false },
    { fieldName: 'ERASE_DESC', dataType: 'text', header: { text: t('ERASE_DESC') }, visible: false },
    { fieldName: 'ERASE_DATE', dataType: 'text', header: { text: t('ERASE_DATE') }, visible: false },
    { fieldName: 'USE_DIV', dataType: 'text', header: { text: t('USE_DIV') }, visible: false },
    { fieldName: 'EDU_FILE_ID', dataType: 'text', header: { text: t('EDU_FILE_ID') }, visible: false },         // 교육이수자료
    { fieldName: 'SCAN_ID', dataType: 'text', header: { text: t('SCAN_ID') }, visible: false },                 // 책임보험서류
    { fieldName: 'SCAN_ID_YN', dataType: 'text', header: { text: t('SCAN_ID_YN') }, visible: false },                 
    { fieldName: 'EDU_FILE_ID_YN', dataType: 'text', header: { text: t('EDU_FILE_ID_YN') }, visible: false },                 
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields

const onButtonsClick = async btn => {
  if(btn.id === 'btnSearch'){
    saveParams.FILE01 = null
    saveParams.FILE02 = null
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  }else if(btn.id === 'btnUpdate'){
    let result = await vm.$swal({ 
      title: t('저장 하시겠습니까?'), 
      showCancelButton: true,
    })

    if(!result.isConfirmed){
      return
    }else {
      commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_01', list: [saveParams] }).then(res => {
        Message.success(t('저장 되었습니다.'))

        let afterparams = {
          userStore: userStore,
          params: saveParams,
          mgs: '[오토바이 등록(부서/협력사용)] 화면 - 개인정보관련 수정했습니다.',
          crudGbn: 'CU', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
          logDesc: '', //사유입력
          menuId: useLogsStore().menuId,
          menuNm: t(useLogsStore().menuId),
        }

        // 로그기록
        commonLogExecuteApi(afterparams)

        onButtonsClick({id: 'btnSearch'})
      })
    }
  }else if(btn.id === 'btnCancelLeave'){
    cancelLeave()
  }else if(btn.id === 'btnCancelDelete'){
    cancelDelete()
  }else if(btn.id === 'reset'){
    grdMain.value.getDataProvider().setRows({})
    for(let i in saveParams){
      saveParams[i] = ''
    }
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SPPEA0010_TAB02_SEARCH_01', param: props.searchParams })
}

const afterSearch = async res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR.length > 0){ 
    onCellClicked(null, {cellType: 'data' , dataRow: '0'})
  }

  let afterparams = {
    userStore: userStore,
    params: props.searchParams,
    mgs: '[오토바이 등록(부서/협력사용)] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', //사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }

  // 로그기록
  commonLogExecuteApi(afterparams)
}

const onCellClicked = async (grid, clickData) => {
  console.log('saveParams.SCAN_ID :', saveParams.SCAN_ID)
  if(clickData.cellType === 'data'){
    let data = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    for(let i in data){
      if(i === 'EDU_DATE'){
        saveParams[i] = await data[i] ? dayjs(data[i]).format('YYYY-MM-DD') : null
      }else {
        saveParams[i] = data[i] ? data[i] : ''
      }
    }

    if(saveParams.IO_DIV === 'C'){
      isReadonly.value = false
    }else {
      isReadonly.value = true
    }
    
  }
}

/* ************ 말소(퇴사) *************** */
const cancelLeave = async () => {
  let result = await vm.$swal({ 
    title: t('말소(퇴사) 처리 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return 
  }else {
    let params = [
      {CMPNY_DIV: saveParams.CMPNY_DIV, BIKE_REG_NO: saveParams.BIKE_REG_NO, ERASE_DIV: 'A', ERASE_DESC: saveParams.ERASE_DESC }
    ]
    commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_02', list: params }).then(res => {
      Message.success(t('말소(퇴사) 되었습니다.'))
      onButtonsClick({id: 'btnSearch'})
      reset()
    })
  }
}

/* ************ 말소(삭제) *************** */
const cancelDelete = async () => {
  let result = await vm.$swal({ 
    title: t('말소(삭제) 처리 하시겠습니까?'), 
    showCancelButton: true,
  })

  if(!result.isConfirmed){
    return
  }else {
    if(!saveParams.ERASE_DESC){
      return Message.warn(t('말소사유를 입력해 주세요.'))
    }
    let params = [
      {CMPNY_DIV: saveParams.CMPNY_DIV, BIKE_REG_NO: saveParams.BIKE_REG_NO, ERASE_DIV: 'D', ERASE_DESC: saveParams.ERASE_DESC }
    ]
    commonExecuteApi({ queryId : 'SPPEA0010_TAB01_SAVE_02', list: params }).then(res => {
      Message.success(t('말소(삭제) 되었습니다.'))
      onButtonsClick({id: 'btnSearch'})
    })
  }
}

const reset = () => {
  grdMain.value.getDataProvider().setRows([])
  for(let i in saveParams){
    saveParams[i] = ''
  }
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

  console.log('e1', e)
  console.log('file1', file)

  saveParams.SCAN_NM = file.name
  autoFileUpload(file, 'SCAN_ID' , 'SCAN_ID_YN')
}

const handleFileInputChange2 = e => {
  let file = e.target.files[0]

  console.log('e2', e)
  console.log('file2', file)

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

    console.log("param: ", param)

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
    let param = {
      CMPNY_DIV: saveParams.CMPNY_DIV,
      FILE_ID: saveParams.SCAN_ID
    }
    pdfViewPopup.value.openPopup(param)
  }
}

const create_UUID = () => {
  let dt = new Date().getTime();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

onMounted(() => {
  onButtonsClick({id: 'btnSearch'})
})

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <v-sheet class="h-auto">
      <RealGrid
        ref="grdMain"
        :grid-view-option="grdMainProps.gridViewOption"
        :keys="grdMainProps.keys" 
        :fields="grdMainProps.fields"
        :columns="grdMainProps.columns"
        @onCellClicked="onCellClicked"
      />
    </v-sheet>
    <v-sheet class="mt-4">
      <IMenuTitle
        ref="detailMenu"
        :title="$t('등록 상세 내역')"
        :button-list="['btnUpdate', 'btnCancelLeave', 'btnCancelDelete']"
        @click-button="onButtonsClick"
      />
      <div class="searchArea flex-column fill-height mb-1 pa-3">
        <div class="d-flex">
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
                :disabled="true"
              />
            </VRadioGroup>
          </div>
          <div class="d-flex align-center ml-6 mr-6">
            <VCheckbox 
              v-model="saveParams.IO_DIV"
              true-value="C" false-value="N"
              :disabled="true"
            />
            <div class="formLabelText ml-2">
              {{ $t('사외협력사') }}
            </div>
          </div>
          <i-input 
            v-model="saveParams.BIKE_REG_NO"
            :label="$t('등록번호(신)')"
            label-width="80px" 
            width="400px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.OLD_REG_NO"
            :label="$t('등록번호(구)')"
            label-width="80px" 
            width="400px"
            :disabled="true"
            />
            <!-- oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}]/, '' );"
            maxlength="20" -->
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.EMP_NM"
            :label="$t('운전자')"
            label-width="80px" 
            width="370px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.EMP_NO"
            :label="$t('사번')"
            label-width="35px" 
            width="200px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.JOB_TIT_NM"
            :label="$t('직위')"
            label-width="35px" 
            width="300px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.HP_NO"
            :label="$t('휴대폰')"
            label-width="50px" 
            width="250px"
            :disabled="isReadonly"
          />
          <i-input 
            v-model="saveParams.TEL_NO"
            :label="$t('사내연락처')"
            label-width="80px" 
            width="250px"
            :disabled="isReadonly"
          />
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.ASGN_NM"
            :label="$t('소속조직')"
            label-width="80px" 
            width="620px"
            :disabled="true"
          />
          <i-input 
            v-model="saveParams.EDU_DATE"
            :label="$t('교육이수일')"
            label-width="80px" 
            width="350px"
            type="date"
            :disabled="true"
          />
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.BIKE_NO"
            :label="$t('차량번호')"
            label-width="80px" 
            width="400px"
            oninput="javascript: this.value = this.value.replace(/[~!@#$%^&*()_+|<>?:{}]/, '' );"
            maxlength="20"
          />
          <i-input 
            v-model="saveParams.CAPA"
            :label="$t('배기량')"
            label-width="50px" 
            width="200px"
            maxlength="4"
            oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
          />
          <i-input 
            v-model="saveParams.SCAN_NM"
            :label="$t('책임보험서류')"
            label-width="80px" 
            width="700px"
            readonly
            class="mr-0"
          />

          <div class="d-flex align-center">
             <v-file-input v-model="saveParams.FILE01" style="display: none;" @change="handleFileInputChange" ref="fileInput" accept=".pdf"/>            
            <v-btn @click="openFileInput('1')">추가</v-btn>
            <v-btn @click="viewPopup(saveParams.SCAN_NM)">보기</v-btn>
          </div>
        </div>
        <div class="d-flex pt-1">
          <i-input 
            v-model="saveParams.ERASE_DESC"
            :label="$t('말소사유')"
            label-width="80px" 
            width="900px"
          />
          <div class="d-flex align-center ml-2" style="font-size: 12pt;">
            <div>
              ※ 이륜자동차 등록증, 원동기 면허증(운전면허증)은 부서/협력사 자체보관
            </div>
          </div>
        </div>
        <!-- v-if="saveParams.IO_DIV === 'C'" -->
        <div class="d-flex pt-1" v-if="saveParams.IO_DIV === 'C'">
          <i-input 
            v-model="saveParams.VND_NAME"
            :label="$t('사외협력사명')"
            label-width="80px" 
            width="620px"
          />
          <i-input 
            v-model="saveParams.EDU_FILE_NM"
            :label="$t('교육이수자료')"
            label-width="80px" 
            width="700px"
            readonly
            class="mr-0"
          />
          <div class="d-flex align-center">
            <v-file-input v-model="saveParams.FILE02" style="display: none;" @change="handleFileInputChange2" ref="fileInput2" accept=".pdf"/>
            <v-btn @click="openFileInput('2')">추가</v-btn>
            <v-btn @click="viewPopup(saveParams.EDU_FILE_ID)">보기</v-btn>
          </div>
        </div>
      </div>
    </v-sheet>
  <!-- PDF VIEW 팝업 -->
  <PdfViewPopup ref="pdfViewPopup" />
  </div>
</template>
<style scoped lang="scss">
</style>
