<!--
  화면명 : 안전보호구  및 안전소모품비용 전송
  화면개요 : 안전보호구  및 안전소모품비용 전송
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import EmpPopup from '@/components/popup/EmpPopup.vue'

const emit = defineEmits(['after-search', 'send-notify'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const empPopup = ref(null)
const content = ref(null)
const sendType = ref('')
const textMain = ref('')

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  BSNS_CD: '',
  DEPT_NM: '', // 부서
  DEPT_CD: '',
  ASGN_NM: '', // 과
  ASGN_CD: '',
  STD_DUTY_NM: '', // 직종
  JOB_TIT_NM: '', //직급
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  BODY1_CODE: '', // 신체부위1
  BODY1_NM: '', //신체부위1 명
  BODY2_CODE: '', // 신체부위2
  BODY2_NM: '', //신체부위2 명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_CODE: '', // 상병코드 (PK)
  DISEASE_NM: '', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_YEAR: '',
  SAVE_YN: ''
})

const chipArr = reactive({
  TO_EMP: [],
  SENDER: [],
  REFERER: [],
})

// 메일전송
const mailParams = reactive({
  EMAIL: [],
  SENDER: [],
  REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})

const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ]
})

// 팝업 OPEN
const openPopup = (param) => {
  // for (let key in param) {
  //   if (searchParams.hasOwnProperty(key)) {
  //     if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
  //       searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
  //     } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
  //       searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYY-MM-DD')
  //     } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
  //       searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
  //     } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
  //       searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
  //     } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
  //       searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
  //     } else if (key === 'HLD_OFFI_GBN') {
  //       let hldOffiGbn = codeList.HLD_OFFI_GBN.filter(item => item.COD === param.HLD_OFFI_GBN)
  //       searchParams.HLD_OFFI_GBN = !isEmpty(hldOffiGbn) ? hldOffiGbn[0].TXT : ''
  //     } else {
  //       searchParams[key] = param[key]
  //     }
  //   }
  // }
  // console.log(param)
  searchParams.EMP_NM = param.KOR_NM
  searchParams.SAVE_YN = 'Y'
  mailParams.EMAIL= []
  mailParams.REFERER = []
  chipArr.TO_EMP = []
  chipArr.SENDER = []
  chipArr.REFERER = []

  if(!isEmpty(userStore.email)) {
    chipArr.SENDER.push({ EMP_NM: userStore.empNm, EMAIL: userStore.email })
  }

  // let params = {
  //   CMPNY_DIV: searchParams.CMPNY_DIV,
  //   BSNS_CD: searchParams.BSNS_CD,
  //   USER_DIV: '',
  //   PROD_DIV: 'Y',
  //   DEPT_CD: searchParams.DEPT_CD,
  //   RES_CD1: '', //부서장
  //   RES_CD2: '', // 직책과장
  //   RES_CD3: '3', // 운영과장
  //   RES_CD4: '',
  //   RES_CD5: '',
  //   RES_CD6: '',
  //   RES_CD7: '', // 인사부서담당자
  //   RES_CD8: '',
  // }
  for(let idx of param)
  {
  let params = {
    CMPNY_DIV: idx.CMPNY_DIV,
    BSNS_CD: idx.BSNS_CD,
    USER_DIV: '',
    PROD_DIV: 'Y',
    DEPT_CD: idx.DEPT_CD,
    RES_CD1: '', //부서장
    RES_CD2: '', // 직책과장
    RES_CD3: '3', // 운영과장
    RES_CD4: '',
    RES_CD5: '',
    RES_CD6: '',
    RES_CD7: '', // 인사부서담당자
    RES_CD8: '',
  }
  // console.log("param:",params)
  commonSearchApi({ queryId : 'OPRAD0010_SEARCH_01', param: params }).then(res => {
  // console.log("res:",res.ORESULT_CUR)
    for(let result of res.ORESULT_CUR) {
      if(!isEmpty(result.EMAIL)) {
        chipArr.TO_EMP.push({ EMP_NM: result.KOR_NM, EMAIL: result.EMAIL })
        mailParams.EMAIL.push(result.EMAIL)
      }
    }
  })
  }

  // params.RES_CD1 = '1' // 부서장
  // params.RES_CD2 = ''
  // params.RES_CD3 = '' // 운영과장
  // params.RES_CD7 = ''
  // commonSearchApi({ queryId : 'OPRAD0010_SEARCH_01', param: params }).then(res => {
  //   for(let result of res.ORESULT_CUR) {
  //     if(!isEmpty(result.EMAIL)) {
  //       chipArr.REFERER.push({ EMP_NM: result.KOR_NM, EMAIL: result.EMAIL })
  //       mailParams.REFERER.push(result.EMAIL)
  //     }
  //   }
  // })
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSendMail') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content.value.outerHTML, 'text/html')
    const textareas = doc.querySelectorAll('textarea')
    textareas.forEach((textarea) => {
      const pTag = document.createElement('p')
      pTag.textContent = textMain.value
      textarea.replaceWith(pTag)
    }) 
    
    // 수신자 없을 시 return
    if(isEmpty(mailParams.EMAIL)) {
      return Message.warn(t('수신자를 지정해주십시오.'))
    }
    
    let mailParam = {
      // EMAIL: ['BP27932@bp.hd.com'], 
      EMAIL: mailParams.EMAIL,
      // REFERER: ['BP27932@bp.hd.com'],
      REFERER: mailParams.REFERER,
      SUBJECT: '월별 안전보호구 및 안전소모품 비용 실적 등록 요청 건',
      CONTENT: doc.body.innerHTML
    }
    console.log(doc.body.innerHTML)
    vm.$swal({
      title: t('메일 전송하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        commonSendApi(mailParam).then((res) => {
          // searchParams.NOTIFY_DATE = dayjs().format('YYYYMMDD')
          // searchParams.DIAGNOSIS_DATE = dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD')
          // commonExecuteApi({ queryId : 'HLTJB0010_SAVE_13', list: [ searchParams ] }).then(res => {
          //   emit('send-notify')
          //   closePopup()
          //   Message.success(t('메일이 전송되었습니다.'))
          // })
          emit('send-notify')
          closePopup()
          Message.success(t('메일이 전송되었습니다.'))
        })
      }
    })
  
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  textMain.value = ''
  dialog.value = false
}

// 인원조회 팝업 오픈(받는사람)
const openPopupToEmp = () => {
  sendType.value = 'S'
  empPopup.value.openPopup({ MULTI: true })
}

// 인원조회 팝업 오픈(참조자)
const openPopupReferer = () => {
  sendType.value = 'R'
  empPopup.value.openPopup({ MULTI: true })
}

// 받는사람 삭제
const chipDel = (item) => {
  chipArr.TO_EMP = chipArr.TO_EMP.filter((x) => x.EMAIL !== item)
  mailParams.EMAIL = mailParams.EMAIL.filter((x) => x !== item)
}

// 참조 삭제
const chipDelRef = (item) => {
  chipArr.REFERER = chipArr.REFERER.filter((x) => x.EMAIL !== item)
  mailParams.REFERER = mailParams.REFERER.filter((x) => x !== item)
}

// 인원조회
const onEmpSelected = (row) => {
  for (let i of row) {
    if (i.EMAIL && i.EMAIL !== '') {
      if(sendType.value === 'S') {
        // 보내는 사람을 선택했을 시
        chipArr.TO_EMP.push({ EMP_NM: i.EMP_NM, EMAIL: i.EMAIL })
        const uniqueData = Array.from(
          new Set(chipArr.TO_EMP.map(JSON.stringify))
        ).map(JSON.parse)
        chipArr.TO_EMP = uniqueData

        // email
        mailParams.EMAIL.push(i.EMAIL)
        let setMail = new Set([...mailParams.EMAIL])
        mailParams.EMAIL = [...setMail]
      } else if (sendType.value === 'R') {
        // 참조를 선택했을 시
        chipArr.REFERER.push({ EMP_NM: i.EMP_NM, EMAIL: i.EMAIL })
        const uniqueData = Array.from(
          new Set(chipArr.REFERER.map(JSON.stringify))
        ).map(JSON.parse)
        chipArr.REFERER = uniqueData

        // email
        mailParams.REFERER.push(i.EMAIL)
        let setMail = new Set([...mailParams.REFERER])
        mailParams.REFERER = [...setMail]
      }
    } else {
      Message.warn(t(`${i.EMP_NM} 님이 이메일주소가 없습니다.`))
    }
  }
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
    width="800"
    height="800"
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
      <span>안전보호구 및 안전소모품 비용 등록 협조메일 작성</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSendMail', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea flex-column mb-2">
          <ILabel :label="$t('수신')" :required="true">
            <template #editor="editorProps">
              <VTextField
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopupToEmp"
                readonly
                class="setWhiteColor"
              >
                <v-chip
                  v-for="(item, i) in chipArr.TO_EMP"
                  :key="i"
                  class="ml-2"
                  size="small"
                  @click="chipDel(item.EMAIL)"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel>
          <ILabel :label="$t('발신')" class="mt-2">
            <template #editor="editorProps">
              <VTextField
                readonly
                class="setWhiteColor"
              >
                <v-chip
                  v-for="(item, i) in chipArr.SENDER"
                  :key="i"
                  class="ml-2"
                  size="small"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel>
          <ILabel :label="$t('참조')" class="mt-2">
            <template #editor="editorProps">
              <VTextField
                append-inner-icon="mdi-magnify"
                @click:appendInner="openPopupReferer({ gbn: 'Referer' })"
                readonly
                class="setWhiteColor"
              >
                <v-chip
                  v-for="(item, i) in chipArr.REFERER"
                  :key="i"
                  class="ml-2"
                  size="small"
                  @click="chipDelRef(item.EMAIL)"
                >
                  {{ item.EMP_NM }}
                </v-chip>
              </VTextField>
            </template>
          </ILabel>
        </v-sheet>
      </div>

      <div ref="content" class="pa-4 ml-4 mr-4 mb-4 cont">
        <div style="font-size:16px; color:black; text-align: left; font-weight: bold; margin-left:325px">[업무 협조전]</div>
        <br>
        <div style="margin: 5px; font-size:13px; font-weight:bold;">수신: 수신자 제위</div>
        <div style="margin: 5px; font-size:13px; font-weight:bold;">발신: 안전보건지원부 김병태 책임</div>
        <div style="margin: 5px; font-size:13px; font-weight:bold;">제목: 월별 안전보호구 및 안전소모품 비용 실적 등록 요청 건</div>
        <br>
        <div style="margin-left: 16px;">
          <div style="font-size:13px;">1. 귀 부서의 업무 협조에 감사드립니다.</div>
          <br>
          <div style="font-size:13px;">2. 중대재해처벌법 시행에 따른 협력회사 안전/보건 부자재 운영제도가 변경('22년 1월부)됨에 따라 안전보호구 및 안전소포품비용 </div><br>
          <div style="margin-left:15px; font-size:13px;" >실적 등록을 월별로 시행하고 있습니다.</div>
          <br>
          <div style="font-size:13px;">3. 각 부서에서는 담당자 지정 후 등록 주기(1회/월)에 맞게 등록 업무 진행 부탁드립니다.</div>
          <br><br>
          <div style="margin-left:20px; font-weight:bold; text-decoration:underline; font-size:13px;">* 등록순서: HiSEs=>보건=>안전보호구 및 안전소모품 비용(직영 및 협력사 지급 비용 입력)</div>
          <div style="margin-left:20px; font-weight:bold; text-decoration:underline; font-size:13px;">※ 부자재 업부 담당자 변경 시 변경된 담당자에게 해당 내용 전달 바라며, 담당자 변경시 통보 바람!!!</div><br>
          <div> 
            <textarea style="font-size:13px; width:100%; height:150px; border: 2px solid #4645b9; padding:6px; border-radius: 0.5rem;" v-model="textMain"></textarea>
          </div>
          <div style="font-size:17px; margin-top:8px; color:black; text-align: left; font-weight: bold; margin-left:285px">안전보건지원부장</div>
        </div>
      </div>
    </v-card>
  </v-dialog>
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />
</template>

<style scoped lang="scss">
::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}

.cont {
  border: 2px solid rgb(117, 121, 208);
  border-radius: 0.5rem;
}
</style>
