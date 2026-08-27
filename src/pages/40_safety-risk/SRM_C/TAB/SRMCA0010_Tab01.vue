<!-- 
  화면명   : Hi-SAFE 주제등록
  화면개요 : Hi-SAFE 주제를 신규 등록하거나 내용 수정
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi, commonBigUploadFilesApi, commonDeletFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import { VWindow, VWindowItem } from 'vuetify/lib/components/index.mjs'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import EmpPopup from "@/components/popup/EmpPopup.vue"
import CollaboDept01Popup from "@/components/popup/DeptPopup.vue"
import CollaboDept02Popup from "@/components/popup/DeptPopup.vue"
import WorkPopup from "@/components/popup/WorkPopup.vue"
import DiscriptRiskLevel from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup02.vue'
import SearchRiskPopup from '@/components/popup/SearchRiskPopup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'

defineOptions({
  name: "40_safety-risk-SRM_C-TAB-SRMCA0010_Tab01",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const commonStore = useCommonStore()
const t = useI18n().t //다국어
const route = useRoute()

const props = defineProps(['transfer']) 
const emit = defineEmits(['selected','updated'])

// 권한
const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)
// const isAdmin = ref(userStore.authGrpCd.includes('GRP00291') ? true : false)

// 팝업
const empPopup = ref(null)  // 인원 선택
const collaboDept01Popup = ref(null)  // 협업부서1
const collaboDept02Popup = ref(null)  // 협업부서2
const workPopup = ref(null)           // 작업표준선택
const discriptRiskLevel = ref(null)   // 위험등급 설명
const searchRiskPopup = ref(null)     // 중복제안검색
const fileUploadPopup = ref(null)

const searchParams = reactive(props.transfer ? props.transfer : {})

// 사고유형
const selectAll = ref('N')
const selectAllSago = ref('N')

// Hi-Safe 등록 데이터
const registParams = reactive({
  TASK_SEQ: '',                  // 통합관리번호 
  TASK_NO: '',                   // 주제번호
  CMPNY_DIV: userStore.cmpnyDiv, // 회사명
  BSNS_CD: '',                   // 사업부
  DEPT_CD: '',                   // 부서
  TITLE: '',                     // 주제명  
  GRADE: 'C',                    // 위험등급
  SAVE_FLAG: '010',              // 진행상태
  TASK_TYPE: 'A',                // 과제분류
  CHECK_ACC: [],                 // 사고유형
  CHECK_ACC2: '',                // 사고유형-기타(서술)
  IMPRO_PLN_FROM: dayjs().format('YYYY-MM-DD'),  // 개선계획 시작일 FROM
  IMPRO_PLN_TO: dayjs().format('YYYY-MM-DD'),    // 개선계획 종료일 TO
  TASK_COLLABOR_YN: '',          // 설계 협업 과제
  EMP_NO: userStore.userId,      // 담당자 사번
  EMP_NM: userStore.userName,    // 담당자 이름
  DIRT_EXP_PLN: null,            // 직접비용(계획)
  OTHE_COST_PLN: null,           // 기타비용(계획)
  DUR_DEC_PLN: null,             // 소요공수(계획)
  SUP_BUDGET: '',                // 지원필요여부(예산)
  SUP_SAFETY: '',                // 지원필요여부(안전/연구협업)
  PROBLEM_DETAIL: '',            // 문제점(상세)
  IMP_PLAN: '',                  // 주요개선계획(내용)
  EXP_BENEFITS: '',              // 기대효과
  FILE_ID_1: '',                 // 사진1
  FILE_ID_2: '',                 // 사진2
  FILE_ID_3: '',                 // 사진3
  FILE_ID_4: '',                 // 사진4
  COLLABO_DEPT1: '',             // 협업부서 1
  COLLABO_DEPT2: '',             // 협업부서 2
  COLLABO_DEPT1_NM: '',          // 협업부서명 1
  COLLABO_DEPT2_NM: '',          // 협업부서명 2
  INSERT_DATE: dayjs().format('YYYY-MM-DD'),
  WORK_STANDARD_ID: '',           // 작업표준ID
  WORK_STANDARD_NM: '',           // 작업표준명
  RIVISION_STATUS: '',            // 작업표준(개정상태)
  COLLABO_CMPNY_DIV1: '',
  COLLABO_CMPNY_DIV2: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  SAVE_FLAG: [],
  GRADE : [],
  TASK_TYPE: [],
  CHECK_ACC: [],
  RIVISION_STATUS: [
    { COD: 'A', TXT: '개정필요' },
    { COD: 'B', TXT: '개정 불필요' },
    { COD: 'C', TXT: '개정 중' },
    { COD: 'D', TXT: '개정완료' },
  ]
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      },
    }),
    // SAVE_FLAG[2]
    getCodeList('HHIJJA01'),
    // 위험등급[3]
    getCodeList('HHIJJC01'),
    // 과제분류[4]
    getCodeList('HHIJJA02'),
    // 사고유형[5]
    getCodeList('HHIJJC11'),
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.SAVE_FLAG = res[2].ORESULT_CUR
    codeList.GRADE = res[3].ORESULT_CUR
    codeList.TASK_TYPE = res[4].ORESULT_CUR
    codeList.CHECK_ACC = res[5].ORESULT_CUR

    codeList.TASK_TYPE.unshift({ COD: '', TXT: '전체' }) 
  })
}

const images = reactive({
  div : '',
  img1 : '',
  img2 : '',
  img3 : '',
  img4 : '',
})

const date = ref(new Date)

/*const fileInputPopup = el => {
  let blobImage = new Blob([el[0]])

  if (images.div == 1) {
    images.img1 = URL.createObjectURL(blobImage)
    fileSave(el[0]).then(res => {
      console.log('img1 res', res)
      registParams.FILE_ID_1 = res
    })
  }

  if (images.div == 2) {
    images.img2 = URL.createObjectURL(blobImage)
    fileSave(el[0]).then(res => {
      console.log('img2 res', res)
      registParams.FILE_ID_2 = res
    })
  }

  if (images.div == 3) {
    images.img3 = URL.createObjectURL(blobImage)
    fileSave(el[0]).then(res => {
      console.log('img3 res', res)
      registParams.FILE_ID_3 = res
    })
  }

  if (images.div == 4) {
    images.img4 = URL.createObjectURL(blobImage)
    fileSave(el[0]).then(res => {
      console.log('img4 res', res)
      registParams.FILE_ID_4 = res
    })
  }
}*/

// 파일 저장
/*const fileSave = val => {
  return new Promise((resolve, reject) => {
    let getFileId = ''

    // 자르는 사이즈
    let chunkSize = 1024 * 1024 // 1MB
    // total size 계산
    let totalChunks = Math.ceil(val.size / chunkSize)

    let currentChunk = 0

    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize
    const end = Math.min(start + chunkSize, val.size)
    const chunk = val.slice(start, end)

    // form data 형식으로 전송
    const formData = new FormData()

    // FILE_ID 생성
    let dt = new Date().getTime()

    let createFileId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      let r = (dt + Math.random() * 16) % 16 | 0
      dt = Math.floor(dt / 16)

      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
    })

    let param = {
      CMPNY_DIV: userStore.cmpnyDiv, 
      FILE_ID: createFileId,
      FILE_NO: '',
      FILE_TITLE: val.name,
      FILE_NAME_ORIGINAL: val.name,
      FILE_NAME: val.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: val.name.split(".").pop(),
      FILE_SIZE: Math.round(val.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks,
    }

    formData.append("file", chunk, val.name)
    formData.append(
      "param",
      new Blob([JSON.stringify(param)], { type: "application/json" })
    )

    commonBigUploadFilesApi(formData).then(res => {
      console.log('commonBigUploadFilesApi res', res)
      getFileId = createFileId
      resolve(getFileId)
    }).catch(err => {
      reject(err)
    })

    return getFileId
  })
}*/

// 최초 조회
const searchData = async val => {
  let fileIdList = []
  let fileInfo = []
  images.img1 = []
  images.img2 = []
  images.img3 = []
  images.img4 = []

  await commonSearchApi({
    queryId: 'SRMCA0010_SEARCH_01',
    param: { TASK_NO: val }
  }).then(res => {
    for(let i in res.ORESULT_CUR[0]) {
      if (i === 'CHECK_ACC') {
        let array = res.ORESULT_CUR[0][i] ? res.ORESULT_CUR[0][i].split(',') : []
        registParams[i] = array
      } else {
        registParams[i] = res.ORESULT_CUR[0][i]
      }
    } 

    // 날짜 format 세팅 
    registParams.INSERT_DATE = dayjs(registParams.INSERT_DATE).format('YYYY-MM-DD')
    registParams.IMPRO_PLN_FROM = dayjs(registParams.IMPRO_PLN_FROM, 'YYYYMMDD').format('YYYY-MM-DD')
    registParams.IMPRO_PLN_TO = dayjs(registParams.IMPRO_PLN_TO, 'YYYYMMDD').format('YYYY-MM-DD')
    
    fileIdList.push(registParams.FILE_ID_1)
    fileIdList.push(registParams.FILE_ID_2)
    fileIdList.push(registParams.FILE_ID_3)
    fileIdList.push(registParams.FILE_ID_4)
  })

  //console.log('fileIdList', fileIdList)

  // 이미지를 미리보기 위한 파일 정보 가져오기
  for (let i of fileIdList) {
    if (i !== '') {
      await commonSearchApi({ 
        queryId: "searchFile", 
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          FILE_ID: i,
        } 
      }).then(res => {
        fileInfo.push(res.ORESULT_CUR[0])        
      })
    } else{
      fileInfo.push('-')
    }
  }

  //console.log('fileInfo', fileInfo)
  if (fileInfo.length !==0 ) {   

    for(let [index, item] of fileInfo.entries()){
      let blob = null
      let url = null

      if(item != null && item != undefined){
        await commonDownloadFilesApi(item).then(res => {
          blob = new Blob([res])
          url = URL.createObjectURL(blob)
          
          if(index === 0){
            images.img1 = URL.createObjectURL(blob)
          }

          if(index === 1){
            images.img2 = URL.createObjectURL(blob)
          }

          if(index === 2){
            images.img3 = URL.createObjectURL(blob)
          }

          if(index === 3){
            images.img4 = URL.createObjectURL(blob)
          }
        })
      }
    }    
  }
}

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if(btn.id === 'btnTemporaryStorage') { 
    saveData(btn)
  } else if (btn.id === 'btnUpdate') {
    saveData(btn)
  } else if (btn.id === 'btnDelete') {
    deleteData()
  } else if (btn.id === 'btnDupSearch') {
    searchRiskPopup.value.openPopup()
  }
}

// 저장
const saveData = async btn => {
  let saveParams = {}

  for (let i in registParams) {
    saveParams[i] = registParams[i]
  }

  if (!saveParams.TITLE) {
    return Message.warn(t('제목을 입력해주세요.'))
  }

  if (!saveParams.PROBLEM) {
    return Message.warn(t('문제점을 입력해주세요.'))
  }

  if (!saveParams.RIVISION_STATUS) {
    return Message.warn(t('작업표준을 선택해주세요.'))
  }

  if (!saveParams.WORK_STANDARD_NM) {
    return Message.warn(t('작업표준을 선택해주세요.'))
  }

  if (!saveParams.TASK_TYPE) {
    return Message.warn(t('과제분류를 선택해주세요.'))
  }

  if (!saveParams.GRADE) {
    return Message.warn(t('위험등급을 선택해주세요.'))
  }

  if (saveParams.CHECK_ACC.length === 0) {
    return Message.warn(t('사고유형을 선택해주세요.'))
  }

  if (saveParams.CHECK_ACC.includes('200') && !saveParams.CHECK_ACC2) {
    return Message.warn(t('기타(서술)을 입력해주세요.')) 
  }

  if (!saveParams.PROBLEM_DETAIL) {
    return Message.warn(t('문제점(상세)을 입력해주세요.'))
  }

  if (!saveParams.IMP_PLAN) {
    return Message.warn(t('주요개선계획(내용)을 입력해주세요.'))
  }

  if (!saveParams.EXP_BENEFITS) {
    return Message.warn(t('기대효과를 입력해주세요.'))
  }

  if (saveParams.CHECK_ACC.includes('200') === false) {
    saveParams.CHECK_ACC2 = ''
  }

  // 임시저장 구분
  if (btn.id === 'btnTemporaryStorage') {
    saveParams.TEMP_YN = 'Y'
  } else if (btn.id === 'btnUpdate') {
    saveParams.TEMP_YN = 'N'
  }

  // 사고유형
  saveParams.CHECK_ACC = registParams.CHECK_ACC.join(',')
  // 개선계획기간(시작, 종료)
  saveParams.IMPRO_PLN_FROM = registParams.IMPRO_PLN_FROM.replaceAll('-', '')
  saveParams.IMPRO_PLN_TO = registParams.IMPRO_PLN_TO.replaceAll('-', '')

  if (saveParams.IMPRO_PLN_FROM > saveParams.IMPRO_PLN_TO) {
    return Message.warn(t('개선계획기간을 확인해주세요.(시작일이 종료일보다 큽니다.)'))
  }

  console.log('saveParams', saveParams)

  await vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  }).then(async ck => {
    if (ck.isConfirmed === true) {
      await commonExecuteApi({
        queryId : 'SRMCA0010_save01', 
        list: [saveParams]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('저장 되었습니다.'))
          // SRMCA0010 컴포넌트로 EMIT
          emit("selected", { 
            TASK_NO: res.list[0].OUT_RES_KEY ? res.list[0].OUT_RES_KEY : registParams.TASK_NO, 
            TEMP_YN: res.list[0].TEMP_YN 
          })
          // SRMCA0010_popup01 컴포넌트로 EMIT
          emit('updated', 'HiSafeRegister')
          // 조회
          // searchData(res.list[0].OUT_RES_KEY)
        }
      })
    }
  })
}

const deleteData = () => {
  vm.$swal({ 
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({ 
        queryId : 'SRMCA0010_DELETE_01',
        list: [searchParams]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))
          emit('updated', 'delete') 
        }
      })
    }
  })
}

//const selectFile4 = ref(null)

// 이미지 업로드
const openFilePicker = div => {
  images.div = div
  
  if(div === 1)
    fileUploadPopup.value.openPopup(registParams.FILE_ID_1)
  else if(div === 2)
    fileUploadPopup.value.openPopup(registParams.FILE_ID_2)
  else if(div === 3)
    fileUploadPopup.value.openPopup(registParams.FILE_ID_3)
  else if(div === 4)
    fileUploadPopup.value.openPopup(registParams.FILE_ID_4)

  //selectFile4.value.click()
}

const uploadedFile = async (val) => {
  //console.log('uploadedFile val : ', val)

  if(val.STATUS === 'delete') {
    if (images.div == 1) {  
      images.img1 = ''     
      registParams.FILE_ID_1 = ''
    }

    if (images.div == 2) {  
      images.img2 = ''   
      registParams.FILE_ID_2 = ''  
    }

    if (images.div == 3) {  
      images.img3 = ''     
      registParams.FILE_ID_3 = ''
    }

    if (images.div == 4) {  
      images.img4 = ''    
      registParams.FILE_ID_4 = '' 
    }
  } else {
    let params = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: val.fileId,
    }

    await commonSearchApi({
      queryId: 'searchFile',
      param: params,
    }).then((res) => {      
      let blob = null
      let url = null
      
      commonDownloadFilesApi(res.ORESULT_CUR[0]).then((res) => {
        blob = new Blob([res])
        url = URL.createObjectURL(blob)  
        if (images.div == 1) {  
          images.img1 = url     
          registParams.FILE_ID_1 = val.fileId
        }

        if (images.div == 2) {  
          images.img2 = url   
          registParams.FILE_ID_2 = val.fileId  
        }

        if (images.div == 3) {  
          images.img3 = url     
          registParams.FILE_ID_3 = val.fileId
        }

        if (images.div == 4) {  
          images.img4 = url    
          registParams.FILE_ID_4 = val.fileId 
        }
      })     
    })
  }
}

// 이미지 삭제
/*const delFilePicker = div => {
  let deleteParams = {}

  if (div === 1) {
    deleteParams.FILE_ID = registParams.FILE_ID_1
  } else if (div === 2) {
    deleteParams.FILE_ID = registParams.FILE_ID_2
  } else if (div === 3) {
    deleteParams.FILE_ID = registParams.FILE_ID_3
  } else if (div === 4) {
    deleteParams.FILE_ID = registParams.FILE_ID_4
  }

  deleteParams.CMPNY_DIV = registParams.CMPNY_DIV
  deleteParams.TASK_NO = registParams.TASK_NO
  deleteParams.FILE_NO = 1

  vm.$swal({ 
    title: t('삭제 하시겠습니까?'),
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonDeletFilesApi([deleteParams]).then(res => {
        if (res.result.status === '200') {
          Message.success(t('삭제 되었습니다.'))

          // SRMCA0010_popup01 컴포넌트로 EMIT
          emit('updated', 'HiSafeRegister')
        } 
      })
    }
  })
}*/

/* ---------- 팝업 ---------- */
const selectEmp = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
  })
}

const onselectEmp = val => {
  registParams.BSNS_CD = val.BSNS_CD
  registParams.DEPT_CD = val.DEPT_CD
  registParams.DEPT_NM = val.DEPT_NM
  registParams.EMP_NM = val.EMP_NM
  registParams.EMP_NO = val.EMP_NO
}

// 협업부서1
const selectCollaboDept01 = () => {
  collaboDept01Popup.value.openPopup({})
}

const onselectCollaboDept01 = val => {
  // console.log('onselectCollaboDept01 val', val)

  registParams.COLLABO_CMPNY_DIV1 = val.CMPNY_DIV
  registParams.COLLABO_DEPT1 = val.DEPT_CD
  registParams.COLLABO_DEPT1_NM = val.ASGN_SHRT_NM
}

// 협업부서2
const selectCollaboDept02 = () => {
  collaboDept02Popup.value.openPopup({})
}

const onselectCollaboDept02 = val => {
  registParams.COLLABO_CMPNY_DIV2 = val.CMPNY_DIV
  registParams.COLLABO_DEPT2 = val.DEPT_CD
  registParams.COLLABO_DEPT2_NM = val.ASGN_SHRT_NM 
}

// 작업표준 선택
const selectWork = () => {
  workPopup.value.openPopup()
}

const onSelectWork = val => {
  registParams.WORK_STANDARD_ID = val.WORK_STANDARD_ID
  registParams.WORK_STANDARD_NM = val.WORK_STANDARD_NM
}

const onDeleteWork = () => {
  registParams.WORK_STANDARD_ID = ''
  registParams.WORK_STANDARD_NM = ''
}

// 사고유형 클릭 이벤트
const sagoSelectAll = e => {
  if(selectAllSago.value === 'Y'){
    registParams.CHECK_ACC = []
    codeList.CHECK_ACC.forEach(element => {

      registParams.CHECK_ACC.push(element.COD)

    })
  } else {
    registParams.CHECK_ACC = []  
  }
}

// 사고유형
const sagoSelectAll2 = e => {
  selectAllSago.value = 'N'
}

const sagoAllClick = e => {
  if(selectAllSago.value === 'Y'){
    selectAllSago.value = 'N'
  } else {
    selectAllSago.value = 'Y'
  }

  sagoSelectAll()
}

const onHelp = () => {
  discriptRiskLevel.value.openPopup()
}

const onDupSelected = val => {
  registParams.CHECK_ACC = val.CHECK_ACC
  registParams.CHECK_ACC2 = val.CHECK_ACC2
  registParams.CMPNY_DIV = val.CMPNY_DIV
  registParams.PROBLEM = val.CUR_PROB
  registParams.FILE_ID_1 = val.FILE_ID_1
  registParams.TITLE = val.RISK_NM
}

// 조회
watch(() => searchParams.TASK_NO, (newValue, oldValue) => {
  searchData(newValue)
})

onMounted(() => {
  initCodeList()

  if (searchParams.TASK_NO) {
    searchData(searchParams.TASK_NO)  // 조회
  }

  registParams.BSNS_CD = userStore.bsnsCd
  registParams.DEPT_CD = userStore.deptCd
  registParams.DEPT_NM = userStore.deptNm
})
</script>
<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 py-0">
      <!-- TASK_NO 존재유무로 임시저장 버튼 출력 (신규일때만 임시저장 버튼 출력)-->
      <IMenuTitle
        v-if="!searchParams.TASK_NO || searchParams.TEMP_YN === 'Y'"
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnDupSearch', 'btnTemporaryStorage', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
      <IMenuTitle
        v-else-if="isAdmin || registParams.EMP_NO === userStore.userId ? true : false"
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
      <IMenuTitle
        v-else
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <!-- 등록일자 -->
            <i-input 
              v-model="registParams.INSERT_DATE"
              :label="$t('등록일자')"
              width="140px"
              topLabel
              type="date"
              readonly
            />
            <!-- 회사명 -->
            <i-select
              v-model="registParams.CMPNY_DIV"
              :label="$t('회사명')"
              width="150px"
              topLabel
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <!-- 사업부 -->
            <i-select
              v-model="registParams.BSNS_CD"
              :label="$t('사업부')"
              width="150px"
              topLabel
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              readonly
            />
            <!-- 부서 -->
            <i-input
              v-model="registParams.DEPT_NM"
              :label="$t('부서')"
              width="230px"
              topLabel
              readonly
            />
            <!-- 담당자 -->
            <i-input
              v-model="registParams.EMP_NM"
              :label="$t('담당자')"
              width="100px"
              topLabel
              readonly
              :append-inner-icon="registParams.EMP_NO === userStore.userId ? 'mdi-magnify' : isAdmin ? 'mdi-magnify' : ''"
              @click:appendInner="selectEmp"
            />
            <!-- Hi-SAFE 관리번호 -->
            <i-input
              v-model="registParams.TASK_NO"
              :label="$t('Hi-SAFE 관리번호')"
              width="180px"
              topLabel
              readonly
            />
            <!-- 통합관리번호 -->
            <i-input
              v-model="registParams.TASK_SEQ"
              :label="$t('통합관리번호')"
              width="180px"
              topLabel
              readonly
            />
          </div>
          <div class="d-flex mt-3">
            <!-- 제목 -->
            <i-input
              v-model="registParams.TITLE"
              :label="$t('제목')"
              width="480px"
              topLabel
              :required="registParams.EMP_NO === userStore.userId ? true : false"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
            <div class="d-flex">
              <i-select
                v-model="registParams.RIVISION_STATUS"
                :label="$t('작업표준')"
                :items="codeList.RIVISION_STATUS"
                item-value="COD"
                item-title="TXT"
                width="150px"
                topLabel
                margin="0px"
                :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
                required
              />
              <!-- 작업표준 -->
              <i-input
                v-model="registParams.WORK_STANDARD_NM"
                :label="$t('')"
                width="200px"
                topLabel
                :append-inner-icon="registParams.EMP_NO === userStore.userId ? 'mdi-magnify' : isAdmin ? 'mdi-magnify' : ''"
                @click:appendInner="selectWork"
                :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true"
                :clearable="registParams.EMP_NO === userStore.userId || isAdmin"
                @click:clearable="onDeleteWork" 
              />
            </div>
            <!-- 과제분류 -->
            <i-select
              v-model="registParams.TASK_TYPE"
              :label="$t('과제분류')"
              width="180px"
              topLabel
              :items="codeList.TASK_TYPE"
              item-value="COD"
              item-title="TXT"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true"
              required
            />
            <!-- 진행상태 -->
            <i-select
              v-model="registParams.SAVE_FLAG"
              :label="$t('진행상태')"
              width="180px"
              topLabel
              :items="codeList.SAVE_FLAG"
              item-value="COD"
              item-title="TXT"
              readonly
            />
          </div>
          <div class="d-flex mt-3">
            <!-- 문제점 -->
            <i-input
              v-model="registParams.PROBLEM"
              :label="$t('문제점')"
              width="480px"
              topLabel
              :required="registParams.EMP_NO === userStore.userId ? true : false"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
            <!-- 위험등급 -->
            <v-sheet width="150px" class="mr-5">
              <div class="formLabelText d-flex dot">
                {{ $t('위험등급') }}
                <svg-icon class="dot" name="redDot" />
                <v-icon
                  icon="mdi-help-circle-outline" 
                  size="small"
                  color="#6e6e6e"
                  class="mb-1"
                  @click="onHelp"
                />
              </div>
              <div class="d-flex align-center" style="width: 100%;">
                <i-select
                  v-model="registParams.GRADE"
                  :items="codeList.GRADE"
                  item-value="COD"
                  item-title="TXT"
                  width="100%"
                  :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true"
                  required
                />
              </div>
            </v-sheet>
            <!-- 직접비용 -->
            <i-input
              v-model="registParams.DIRT_EXP_PLN"
              :label="$t('직접비용(계획)')"
              width="180px"
              topLabel 
              suffix="(천원)"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
            <!-- 소요공수 -->
            <i-input
              v-model="registParams.DUR_DEC_PLN"
              :label="$t('소요공수(계획)')"
              width="180px"
              topLabel 
              suffix="(M/H)"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
            <!-- 기타비용 -->
            <i-input
              v-model="registParams.OTHE_COST_PLN"
              :label="$t('기타비용(계획)')"
              width="180px"
              topLabel 
              suffix="(천원)"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
          </div>
          <div class="d-flex mt-3">
            <v-sheet width="480px" class="mr-5">
              <div class="d-flex formLabelText dot">
                {{ $t('사고유형') }}
                <svg-icon class="dot" name="redDot" />
              </div>
              <div class="d-flex align-center" style="width: 100%;">
                <VAutocomplete
                  v-model="registParams.CHECK_ACC"
                  :items="codeList.CHECK_ACC"
                  item-title="TXT"
                  item-value="COD"
                  multiple
                  clearable
                  @update:modelValue="sagoSelectAll2"
                  close-on-item-click="false"
                  :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
                >
                  <template v-slot:prepend-item>
                    <v-list-item 
                      :class="selectAllSago === 'Y' ? 'select' : 'unselect'"
                      @click="sagoAllClick"
                    >
                      <v-list-item-title>
                        <VRow align="center">
                          <VCol cols="auto">
                            <v-checkbox 
                              v-model="selectAllSago"
                              @change="sagoSelectAll"
                              color="rgb(81, 77, 88)"
                            />
                          </VCol>
                          <VCol>
                            <span>전체 선택</span>
                          </VCol>
                        </VRow>
                      </v-list-item-title>
                    </v-list-item>
                  </template>
                </VAutocomplete>
              </div>
            </v-sheet>
            <!-- 사고유형이 기타(서술)일 때 입력 --> 
            <i-input 
              v-model="registParams.CHECK_ACC2"
              width="750px"
              :label="$t('기타(서술)')"
              topLabel
              :readonly="Object.values(registParams.CHECK_ACC).includes('200') ? (registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true) : true"
              placeholder="기타(서술) 선택 시 입력"
              :required="Object.values(registParams.CHECK_ACC).includes('200')"
            />
          </div>
          <div class="d-flex mt-3">
            <!-- 협업부서1 -->
            <i-input
              v-model="registParams.COLLABO_DEPT1_NM"
              :label="$t('협업부서1')"
              width="230px"
              topLabel
              :append-inner-icon="registParams.EMP_NO === userStore.userId ? 'mdi-magnify' : isAdmin ? 'mdi-magnify' : ''"
              @click:appendInner="selectCollaboDept01"
              readonly
            />
            <!-- 협업부서2 -->
            <i-input
              v-model="registParams.COLLABO_DEPT2_NM"
              :label="$t('협업부서2')"
              width="230px"
              topLabel
              :append-inner-icon="registParams.EMP_NO === userStore.userId ? 'mdi-magnify' : isAdmin ? 'mdi-magnify' : ''"
              @click:appendInner="selectCollaboDept02"
              readonly
            />
            <!-- 개선계획기간(시작) -->
            <i-input
              v-model="registParams.IMPRO_PLN_FROM"
              :label="$t('개선계획기간(시작)')"
              width="140px"
              topLabel
              type="date"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
            <!-- 개선계획기간(종료) -->
            <i-input
              v-model="registParams.IMPRO_PLN_TO"
              :label="$t('개선계획기간(종료)')"
              width="140px"
              topLabel
              type="date"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
          </div> 
          <!-- 문제점/개선계획/기대효과 -->
          <div class="d-flex mt-3">
            <i-textarea
              v-model="registParams.PROBLEM_DETAIL"
              :row="4"
              :label="$t('문제점(상세)')"
              width="405px"
              :required="registParams.EMP_NO === userStore.userId ? true : false"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
            <i-textarea
              v-model="registParams.IMP_PLAN"
              :row="4"
              :label="$t('주요개선계획(내용)')"
              width="405px"
              :required="registParams.EMP_NO === userStore.userId ? true : false"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
            <i-textarea
              v-model="registParams.EXP_BENEFITS"
              :row="4"
              :label="$t('기대효과')"
              width="405px"
              :required="registParams.EMP_NO === userStore.userId ? true : false"
              :readonly="registParams.EMP_NO === userStore.userId ? false : isAdmin ? false : true" 
            />
          </div>
          </v-sheet>
          <v-sheet class="searchArea flex-column h-auto">
          <!-- 개선전 사진 / 계획 도면(시안) -->
          <VRow>
            <VCol cols="12" md="6">
              <ILabel :label="$t('개선전 사진')" label-loc="top">
                <template #editor="editorProps">
                  <div>
                    <VRow>
                      <VCol cols="12" md="6" class="pa-5">
                        <div class="mb-1" v-if="registParams.EMP_NO === userStore.userId || isAdmin">
                          <v-btn size="small" @click="openFilePicker(1)">등록/삭제</v-btn>
                          <!--<v-btn size="small" class="ml-2" @click="delFilePicker(1)">삭제</v-btn>-->
                        </div>
                        <div>
                          <VImg
                            class="pa-2"
                            style="border: 1px solid darkgray;" 
                            :width="400"
                            :height="300"
                            outlined
                            :src="images.img1"
                          />
                        </div>
                      </VCol>
                      <VCol cols="12" md="6" class="pa-5 mb-1">
                        <div class="mb-1" v-if="registParams.EMP_NO === userStore.userId || isAdmin">
                          <v-btn size="small" @click="openFilePicker(2)">등록/삭제</v-btn>
                          <!--<v-btn size="small" class="ml-2" @click="delFilePicker(2)">삭제</v-btn>-->
                        </div>
                        <div>
                          <VImg
                            class="pa-2"
                            style="border: 1px solid darkgray;" 
                            :width="400"
                            :height="300"
                            outlined
                            :src="images.img2"
                          />
                        </div>
                      </VCol>
                    </VRow>
                  </div>
                </template>    
              </ILabel>
            </VCol>
            <VCol cols="12" md="6">
              <ILabel :label="$t('계획 도면(시안)')" label-loc="top">
                <template #editor="editorProps">
                  <div>
                    <VRow>
                      <VCol cols="12" md="6" class="pa-5">
                        <div class="mb-1" v-if="registParams.EMP_NO === userStore.userId || isAdmin">
                          <v-btn size="small" @click="openFilePicker(3)">등록/삭제</v-btn>
                          <!--<v-btn size="small" class="ml-2" @click="delFilePicker(3)">삭제</v-btn>-->
                        </div>
                        <div>
                          <VImg
                            class="pa-2"
                            style="border: 1px solid darkgray;" 
                            :width="400"
                            :height="300"
                            outlined
                            :src="images.img3"
                          />
                        </div>
                      </VCol>
                      <VCol cols="12" md="6" class="pa-5 mb-1">
                        <div class="mb-1" v-if="registParams.EMP_NO === userStore.userId || isAdmin">
                          <v-btn size="small" @click="openFilePicker(4)">등록/삭제</v-btn>
                          <!--<v-btn size="small" class="ml-2" @click="delFilePicker(4)"> 삭제 </v-btn>-->
                        </div>
                        <div>
                          <VImg
                            class="pa-2"
                            style="border: 1px solid darkgray;" 
                            :width="400"
                            :height="300"
                            outlined
                            :src="images.img4"
                          />
                        </div>
                        <!--<VFileInput style="display:none" ref="selectFile4" @update:modelValue="fileInputPopup"/>-->
                      </VCol>
                    </VRow>
                  </div>
                </template>    
              </ILabel>
            </VCol>
          </VRow>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>

  <!-- 담당자 선택 -->
  <EmpPopup ref="empPopup" @selected="onselectEmp" />

  <!-- 협업부서1 선택 -->
  <CollaboDept01Popup ref="collaboDept01Popup" @selected="onselectCollaboDept01"/>

  <!-- 협업부서2 선택 -->
  <CollaboDept02Popup ref="collaboDept02Popup" @selected="onselectCollaboDept02"/>

  <!-- 작업표준 선택 -->
  <WorkPopup ref="workPopup" @selected="onSelectWork"/>

  <!-- 위험등급 설명 -->
  <DiscriptRiskLevel ref="discriptRiskLevel" />

  <!-- 중복제안검색 -->
  <SearchRiskPopup ref="searchRiskPopup" @selected="onDupSelected"/>
  
  <!-- 첨부파일 -->
  <IUploadPopup
      ref="fileUploadPopup"
      :img-only="true"
      fileDan      
      :readOnly="isAdmin || registParams.DEPT_CD === userStore.deptCd ? false : true"
      @uploaded="uploadedFile"
    ></IUploadPopup>

</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 230px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

// 사진첨부 버튼 위치 설정
div.mb-1 {
  text-align: right;
}

.v-autocomplete__selection{
  flex-wrap: nowrap;
}
::v-deep(.v-field__input){
  min-height: 40px !important;
  flex-wrap: nowrap !important;
  color: #000 !important;
  //overflow: hidden !important;
}
::v-deep(.rg-head-cell) {
  background-color: #e4e4e4 !important;
}
::v-deep(.rg-header .rg-table tr td) {
  background-color: #e4e4e4 !important;
}

.dot {
  justify-content: normal !important;
  align-items: normal !important;
}
</style>
