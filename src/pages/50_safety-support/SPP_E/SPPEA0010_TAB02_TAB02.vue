<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from "dayjs"
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi, commonSendSMS } from "@hiway/api/commonApi"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from '@hiway/utils/notify'
import { commonBigUploadFilesApi } from "@hiway/api/commonFileApi"
import PdfViewPopup from "@/pages/50_safety-support/SPP_E/PdfViewPopup.vue"
import EmpPopup from '@/components/popup/EmpPopup.vue'
import AddPopup from "@/pages/50_safety-support/SPP_E/SPPEA0010_TAB02_TAB02Popup.vue"

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
const empPopup = ref(null)
const addPopup = ref(null)
const btnApplication_YN = ref('N')
 
/* 조회 데이터 */
const props = defineProps({
  searchParams: {
    Type: Object,
    default: {},
  },
  codeList: {
    Type: Object,
    default: {}
  }
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
  USER_ID: userStore.userId,
  SCAN_ID_YN: '',
  EDU_FILE_ID_YN: '',
  MENH_ID: '',
  BOHM_ID: '',
  DUNGRK_ID: '',
  VIO_CNT: null,
  REJECT_DESC: '',
  SCHEDULE_ID: '',
  STATE: '',
  STATUS: '',
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
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') },lookupDisplay: true, lookupData: props.codeList.STATUS_LIST},
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, width: '400', styleName: 'left-column'},
    { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('사외협력사명') }, width: '180', styleName: 'left-column'},
    { fieldName: 'IO_DIV', dataType: 'text', header: { text: t('소속구분') },lookupDisplay: true, lookupData: codeList.IO_DIVList2},
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }},
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }},
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') }},
    { fieldName: 'USE_DIV_NM', dataType: 'text', header: { text: t('용도구분') }},
    { fieldName: 'EDU_DATE', dataType: "text", header: { text: t('교육이수일') }, width: '120'},
    { fieldName: 'BIKE_NO', dataType: 'text', header: { text: t('차량번호') }, width: '150'},
    { fieldName: 'CAPA', dataType: 'text', header: { text: t('배기량') }, width: '80' },
    { fieldName: 'TEL_NO', dataType: 'text', header: { text: t('사내연락처') }, width: '100',lookupDisplay: true, lookupData: codeList.ERASE_DIVList},
    { fieldName: 'REJECT_USER_NM', dataType: 'text', header: { text: t('반려자') }, width: '100'},
    { fieldName: 'REJECT_DATE', dataType: 'text', header: { text: t('반려일시') }, width: '130'},
    { fieldName: 'REJECT_DESC', dataType: 'text', header: { text: t('반려/불가사유') }, width: '400', styleName: 'left-column'},
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('조직') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD') }, visible: false },
    { fieldName: 'HP_NO', dataType: 'text', header: { text: t('HP_NO') }, visible: false },
    { fieldName: 'SCAN_NM', dataType: 'text', header: { text: t('SCAN_NM') }, visible: false },
    { fieldName: 'EDU_FILE_NM', dataType: 'text', header: { text: t('EDU_FILE_NM') }, visible: false },
    { fieldName: 'ERASE_DESC', dataType: 'text', header: { text: t('ERASE_DESC') }, visible: false },
    { fieldName: 'ERASE_DATE', dataType: 'text', header: { text: t('ERASE_DATE') }, visible: false },
    { fieldName: 'USE_DIV', dataType: 'text', header: { text: t('USE_DIV') }, visible: false },
    { fieldName: 'EDU_FILE_ID', dataType: 'text', header: { text: t('EDU_FILE_ID') }, visible: false },         // 교육이수자료
    { fieldName: 'SCAN_ID', dataType: 'text', header: { text: t('SCAN_ID') }, visible: false },                 // 책임보험서류
    { fieldName: 'SCAN_ID_YN', dataType: 'text', header: { text: t('SCAN_ID_YN') }, visible: false },
    { fieldName: 'EDU_FILE_ID_YN', dataType: 'text', header: { text: t('EDU_FILE_ID_YN') }, visible: false },
    { fieldName: 'SEQ', dataType: 'text', header: { text: t('SEQ') }, visible: false },
    { fieldName: 'APP_DATE', dataType: 'text', header: { text: t('APP_DATE') }, visible: false },
    { fieldName: 'VIO_CNT', dataType: 'text', header: { text: t('VIO_CNT') }, visible: false },
    { fieldName: 'SCHEDULE_ID', dataType: 'text', header: { text: t('SCHEDULE_ID') }, visible: false },
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields

const onButtonsClick = async btn => {
  btnApplication_YN.value = 'N'
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
      save()
    }
  }else if(btn.id === 'btnNew'){
    let param = {
      CMPNY_DIV: props.searchParams.CMPNY_DIV,
      BSNS_CD: props.searchParams.BSNS_CD,
      DEPT_CD: props.searchParams.DEPT_CD,
      ASGN_CD: props.searchParams.ASGN_CD,
      ASGN_NM: props.searchParams.ASGN_NM,
      APP_DATE: dayjs(new Date).format('YYYY-MM-DD'),
      APP_DIV: 'N',
      USE_DIV: 'P',
      STATUS: '10',
      VIO_CNT: '0',
    }
    addPopup.value.openPopup(param)
  }else if(btn.id === 'btnApplication') {
    let result = await vm.$swal({ 
      title: t('신청 하시겠습니까?'), 
      showCancelButton: true,
    })

    if(!result.isConfirmed){
      return
    }else {
     
      if(saveParams.STATUS === '20'){
        return Message.err(t('신청 완료 된 정보입니다. !'))
      }else if(!saveParams.EMP_NM){
        return Message.err(t('신청자를 추가 후 신청 처리 해 주세요.'))
      }else if(!saveParams.BIKE_NO){
        return Message.err(t('차량번호를 입력 해 주세요.'))
      }else if(!saveParams.CAPA){
        return Message.err(t('배기량을 입력 해 주세요.')) 
      }else if(saveParams.SCAN_ID_YN !== 'Y'){
        return Message.err(t('보험 Scan 파일을 등록하세요!'))

        // 용도구분이 개인일 때만 교육 여부 확인
      }else if(!saveParams.EDU_DATE && saveParams.USE_DIV === 'P'){
        return Message.err(t('교육이수가 완료되지 않았습니다!'))
      }else if(saveParams.IO_DIV === 'C'){
        if(!saveParams.VND_NAME){
          return Message.err(t('직영 또는 사내협력사가 아닌 경우 사외협력사를 입력해야 합니다.'))
        }
        if(saveParams.EDU_FILE_ID_YN !== 'Y'){
          return Message.err(t('교육이수자료를 등록해 주세요'))
        }
      }

      btnApplication_YN.value = 'Y'
      saveParams.STATUS = '20'
      save()
    }
  }else if(btn.id === 'btnReqCancel') {
    saveParams.STATUS = '10'
    let result = await vm.$swal({ 
      title: t('신청 취소하시겠습니까?'), 
      showCancelButton: true,
    })
    if(!result.isConfirmed){
      return
    }else {
      let params = {}
      for(let i in saveParams){
        if(i === 'STATUS'){
          params[i] = '10'
        }else if(i === 'APP_DATE'){
          params[i] = dayjs(saveParams[i]).format('YYYYMMDD')
        }else {
          params[i] = saveParams[i]
        }
      }
      commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_06', list: [params] }).then(res => {
        Message.success(t('신청 취소 되었습니다.'))
        onButtonsClick({id: 'btnSearch'})
      })
    }
  }else if(btn.id === 'btnDelete'){
    let result = await vm.$swal({ 
      title: t('삭제 하시겠습니까?'), 
      showCancelButton: true,
    })
    if(!result.isConfirmed){
      return
    }else {
      let data = {}
      for(let i in saveParams){
        if(i === 'EDU_DATE' || i === 'APP_DATE'){
          data[i] = saveParams[i] ? dayjs(saveParams[i]).format('YYYYMMDD') : null
        }else {
          data[i] = saveParams[i]
        }
      }

      commonExecuteApi({ queryId : 'SPPEA0010_TAB02_DELETE_01', list: [data] }).then(res => {
        Message.success(t('삭제 되었습니다.'))
        onButtonsClick({id: 'btnSearch'})
      })
    }
  }
}

const searchData = () => {
  return commonSearchApi({ queryId : 'SPPEA0010_TAB02_SEARCH_02', param: props.searchParams })
}

const afterSearch = async res => {
  for(let i in saveParams){
    saveParams[i] = ''
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  if(res.ORESULT_CUR.length > 0){ 
    onCellClicked(null, {cellType: 'data' , dataRow: '0'})
    setBtn()
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

const save = () => {
  let params = {}

  for(let i in saveParams){
    if(i === 'APP_DATE' || i === 'EDU_DATE'){
      params[i] = saveParams[i] ? dayjs(saveParams[i]).format('YYYYMMDD') : null
    }else {
      params[i] = saveParams[i]
    }
  }

  commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_05', list: [params] }).then(res => {

    console.log ('save res: ', res.list)
    if(btnApplication_YN.value === 'Y'){
      Message.success(t('신청 되었습니다.'))
    }else{
      Message.success(t('저장 되었습니다.'))
    }

    // 파일 저장
    commonExecuteApi({ queryId : 'SPPEA0010_TAB02_SAVE_04', list: res.list })

    if(btnApplication_YN.value === 'Y'){
      /* ********** 오토바이 등록번호 발급 담당자 조회후 담당자가 있을시 선청접수 문자 전송 *********** */
      commonSearchApi({ queryId : 'SPPEA0010_TAB02_SEARCH_04', param: {CMPNY_DIV: userStore.cmpnyDiv, CODE: 'G260'} }).then(res2 => {
        if(res2.ORESULT_CUR.length > 0){
          res2.ORESULT_CUR.forEach(e => {
            let sendSMSParams = {
              EMPNO_FROM : userStore.empNo,
              EMPNO_TO : '',
              SYSCODE : '156',
              FROM_P_NO : userStore.telNo,
              TO_P_NO : e.HND_PHN ,
              TITLE : '[오토바이 전산등록 신청 알림]오토바이 전산등록 신청이 접수되었습니다.-안전경영실- '
            }
            commonSendSMS(sendSMSParams).then(() => {
              Message.success(t('메시지 전송 완료'))
            })
          })
        }
      })
    }

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

    onButtonsClick({id: 'btnSearch'})
  })
}

const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data'){
    let data = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    for(let i in data){
      if(i === 'EDU_DATE' || i === 'APP_DATE'){
        saveParams[i] = await data[i] ? dayjs(data[i]).format('YYYY-MM-DD') : null
      }else {
        saveParams[i] = data[i] ? data[i] : ''
      }
    }
    setBtn()
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
        // console.log('commonBigUploadFilesApi res', res)

        // 마지막 파일까지 전송 되면
        // Message.success(t("업로드 되었습니다."))
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

const openEmpPopup = () => {
  empPopup.value.openPopup({
    USER_DIV_D: false, // 직영, 사내협력사
    BSNS_CD_D: false, // 사업부
    DEPT_CD_D: false, // 부서
    FLAG_D: false, // 부서
    EMP_NM: saveParams.EMP_NM,
    BSNS_CD: saveParams.BSNS_CD,
    DEPT_CD: saveParams.DEPT_CD,
  })
}

const onEmpSelected = val => {
  saveParams.EMP_NM = val.EMP_NM
  saveParams.EMP_NO = val.EMP_NO
  saveParams.JOB_TIT_NM = val.JOB_TIT_NM
  saveParams.HP_NO = val.HND_PHN
  saveParams.TEL_NO = val.TEL_NO
}

const create_UUID = () => {
  let dt = new Date().getTime();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const setBtn = () => {
  menuTitle.value.disableBtn('btnUpdate', true)
  menuTitle.value.disableBtn('btnApplication', true)
  menuTitle.value.disableBtn('btnReqCancel', true)
  menuTitle.value.disableBtn('btnDelete', true)

    /* 신청대기 */
  if(saveParams.STATUS === '10'){
    menuTitle.value.disableBtn('btnUpdate', false)
    menuTitle.value.disableBtn('btnApplication', false)
    menuTitle.value.disableBtn('btnReqCancel', true)
    menuTitle.value.disableBtn('btnDelete', false)

    /* 반려 */
  }else if(saveParams.STATUS === '11'){
    menuTitle.value.disableBtn('btnUpdate', false)
    menuTitle.value.disableBtn('btnApplication', false)
    menuTitle.value.disableBtn('btnReqCancel', true)
    menuTitle.value.disableBtn('btnDelete', true)

    /* 신청완료 */
  }else if(saveParams.STATUS === '20'){
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnApplication', true)
    menuTitle.value.disableBtn('btnReqCancel', false)
    menuTitle.value.disableBtn('btnDelete', true)
  }

  if(saveParams.VIO_CNT && saveParams.VIO_CNT > 0){
    menuTitle.value.disableBtn('btnUpdate', true)
    menuTitle.value.disableBtn('btnReqCancel', true)
    menuTitle.value.disableBtn('btnApplication', true)
    // menuTitle.value.disableBtn('btnDelete', false)

    saveParams.REJECT_DESC = '위반 건 존재로 자격중지 및 신청불가'
  }
}

onMounted(() => {
  menuTitle.value.disableBtn('btnUpdate', true)
  menuTitle.value.disableBtn('btnApplication', true)
  menuTitle.value.disableBtn('btnReqCancel', true)
  // menuTitle.value.disableBtn('btnDelete', true)

  onButtonsClick({id: 'btnSearch'})
})

defineExpose({
  onButtonsClick,
})
</script>

<template>
  <div class="d-flex flex-column fill-height">
    <v-sheet class="h-auto">
      <div style="color: red">
        교육을 이수하여도 자동으로 신청명단에 뜨지 않습니다. 신규 버튼을 눌러서 추가해주세요. (서무/운영과장에게 활성화) 
      </div>
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
        ref="menuTitle"
        :title="$t('신청 상세 내역')"
        :button-list="['btnNew', 'btnUpdate', 'btnApplication', 'btnReqCancel', 'btnDelete']"
        @click-button="onButtonsClick"
      />
      <!-- , 'btnDelete' -->
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
              disabled
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
            label-width="80px"
            width="370px"
            disabled
          />
            <!-- append-inner-icon="mdi-magnify" 
            @click:appendInner="openEmpPopup"
            @keydown.enter="openEmpPopup" -->
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
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}-]/, '' );"
            maxlength="11"
            disabled
          />
          <i-input 
            v-model="saveParams.TEL_NO"
            :label="$t('사내연락처')"
            label-width="80px" 
            width="250px"
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}-]/, '' );"
            maxlength="11"
            disabled
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
            disabled
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
            oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣a-zA-Z~!@#$%^&*()_+|<>?:{}-]/, '' );"
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
        <div class="d-flex pt-1" v-if="saveParams.VIO_CNT && saveParams.VIO_CNT > 0">
          <i-input 
            v-model="saveParams.REJECT_DESC"
            :label="$t('반려/불가사유')"
            label-width="80px" 
            width="1450px"
            readonly
            class="mr-0"
          />
        </div>
      </div>
    </v-sheet>
  <!-- PDF VIEW 팝업 -->
  <PdfViewPopup ref="pdfViewPopup" />
  <!-- 인원조회팝업 -->
  <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
  <!-- 추가(신규) 팝업 -->
  <AddPopup ref="addPopup" @close="onButtonsClick({id: 'btnSearch'})"/>
  </div>
</template>
<style scoped lang="scss">
</style>
