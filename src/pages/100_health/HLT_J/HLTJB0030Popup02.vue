<!--
  화면명 : 난청 사실통지
  화면개요 : 난청 사실통지
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
import CKEditor from "@/components/ckEditor/CKEditor.vue"

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
const ckEditor = ref(null)

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
  for (let key in param) {
    if (searchParams.hasOwnProperty(key)) {
      if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
        searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
      } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
        searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYY-MM-DD')
      } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
        searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
      } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
        searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
      } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
        searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
      } else if (key === 'HLD_OFFI_GBN') {
        let hldOffiGbn = codeList.HLD_OFFI_GBN.filter(item => item.COD === param.HLD_OFFI_GBN)
        searchParams.HLD_OFFI_GBN = !isEmpty(hldOffiGbn) ? hldOffiGbn[0].TXT : ''
      } else {
        searchParams[key] = param[key]
      }
    }
  }
  searchParams.EMP_NM = param.KOR_NM
  searchParams.SAVE_YN = 'Y'
  mailParams.EMAIL= []
  mailParams.REFERER = []
  
  // 기본양식 생성
  mailParams.CONTENT = 
  `
  <div style="color:black;font-size:28px;text-align:center;">
    <strong>[업무 협조전]</strong>
  </div>
  <p>
      &nbsp;
  </p>
  <div>
      1. 귀 부서의업무 협조에 감사드립니다.
  </div>
  <div>
      &nbsp;
  </div>
  <div>
      2. 상기 제목의 건으로 아래와 같이 자료 요청 드리오니, 기한 內 HiSEs자료 작성 및 등록바랍니다.
  </div>
  <div style="color:red;margin-left:10px;">
      * 관계법령: 산업재해보상보험법 제 31조(자료 제공의 요청), 제 117조(사업장 등에 대한 조사)
  </div>
  <p>
      <br>
      &nbsp;
  </p>
  <div style="font-size:20px;margin-top:12px;text-align:center;">
      <strong>= 아 래 =</strong>
  </div>
  <div style="margin-left:16px;">
      <div>
          1. 신청인: ${searchParams.EMP_NM }
      </div>
      <div>
          &nbsp;
      </div>
      <div>
          2. 상병명: ${searchParams.DISEASE_NM}
      </div>
      <div>
          &nbsp;
      </div>
      <div>
          3. 요청사항: <span style="background-color:yellow;"><strong>[HiSEs - 보건 - 직업병 관리 - 난청 신청/결과 관리]</strong></span> 메뉴에서 대상자 검색 후 자료 등록 요망
      </div>
      <div style="color:blue;margin-left:40px;">
          * 메뉴 좌측 상단의 ⍰ '자료등록매뉴얼' 참고하여 등록
      </div>
      <div style="color:blue;margin-left:40px;">
          &nbsp;
      </div>
      <div style="margin-left:8px;">
          <div style="font-size:16px;">
              <strong>&lt;해당부서&gt;</strong>
          </div>
          <div>
              1) 1단계: 신청인 표준작업 등록
          </div>
          <div>
              2) 2단계: 자료 작성 및 수정
          </div>
          <div>
              3) 3단계: 작업 영상 및 기타 자료 첨부
          </div>
          <div>
              4) 4단계: 결재 상신하여 부서장 결재
          </div>
          <div>
              &nbsp;
          </div>
          <div style="font-size:16px;">
              <strong>&lt;인사부서&gt;</strong>
          </div>
          <div>
              대외 송부용 인사기록부(직무 기재 必)를 메일 확인 즉시
          </div>
          <div>
              &nbsp;
          </div>
      </div>
      <div>
          4. 기한: ${ dayjs().add(7, 'day').format('YYYY-MM-DD') }
      </div>
      <div>
          &nbsp;
      </div>
      <div>
          5. 기타 문의 : 안전보건지원부 임은희 책임매니저 (T : 2-5407)
      </div>
      <div>
          &nbsp;
      </div>
      <div style="color:black;font-size:24px;margin-top:8px;text-align:center;">
          <strong>안전보건지원부장</strong>
      </div>
  </div>
  `
  ckEditor.value.setContent(mailParams.CONTENT)

  mailParams.SUBJECT = '요양급여신청 사실 통지 및 자료 등록 요청 件- ' + searchParams.EMP_NM + '/' + searchParams.JOB_TIT_NM
  chipArr.TO_EMP = []
  chipArr.SENDER = []
  chipArr.REFERER = []

  if(!isEmpty(userStore.email)) {
    chipArr.SENDER.push({ EMP_NM: userStore.empNm, EMAIL: userStore.email })
  }

  let params = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BSNS_CD: searchParams.BSNS_CD,
    USER_DIV: '',
    PROD_DIV: 'Y',
    DEPT_CD: searchParams.DEPT_CD,
    RES_CD1: '', //부서장
    RES_CD2: '2', // 직책과장
    RES_CD3: '', // 운영과장
    RES_CD4: '',
    RES_CD5: '',
    RES_CD6: '',
    RES_CD7: '', // 인사부서담당자
    RES_CD8: '',
  }
  commonSearchApi({ queryId : 'OPRAD0010_SEARCH_01', param: params }).then(res => {
    for(let result of res.ORESULT_CUR) {
      if(!isEmpty(result.EMAIL)) {
        chipArr.TO_EMP.push({ EMP_NM: result.KOR_NM, EMAIL: result.EMAIL })
        mailParams.EMAIL.push(result.EMAIL)
      }
    }
  })

  params.RES_CD1 = '1' // 부서장
  params.RES_CD2 = ''
  params.RES_CD3 = '3' // 운영과장
  params.RES_CD7 = ''
  commonSearchApi({ queryId : 'OPRAD0010_SEARCH_01', param: params }).then(res => {
    for(let result of res.ORESULT_CUR) {
      if(!isEmpty(result.EMAIL)) {
        chipArr.REFERER.push({ EMP_NM: result.KOR_NM, EMAIL: result.EMAIL })
        mailParams.REFERER.push(result.EMAIL)
      }
    }
  })
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSendMail') {
    
    // 수신자 없을 시 return
    if(isEmpty(mailParams.EMAIL)) {
      return Message.warn(t('수신자를 지정해주십시오.'))
    }

    let mailParam = {
      // EMAIL: ['BP27296@bp.hd.com'], 
      EMAIL: mailParams.EMAIL,
      // REFERER: ['BP27296@bp.hd.com'],
      REFERER: mailParams.REFERER,
      SUBJECT: mailParams.SUBJECT,
      CONTENT: ckEditor.value.getContent()
    }
    vm.$swal({
      title: t('메일 전송하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        commonSendApi(mailParam).then((res) => {
          searchParams.DIAGNOSIS_DATE = dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD')
          commonExecuteApi({ queryId : 'HLTJB0030_SAVE_02', list: [ searchParams ] }).then(res => {
            emit('send-notify')
            closePopup()
            Message.success(t('메일이 전송되었습니다.'))
          })
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
    width="1050"
    height="850"
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
      <span>사실통지</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnSendMail', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column mb-2">
            <div>
              <ILabel :label="$t('수신')" :required="true">
                <template #editor="editorProps">
                  <VTextField                  
                    width="100%"
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
                      <v-icon
                        color="red"
                        icon="mdi-window-close"
                        size="x-small"
                        end="true"                    
                        @click="chipDel(item.EMAIL)"
                      />
                    </v-chip>
                  </VTextField>
                </template>
              </ILabel>
            </div>
            <div>
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
            </div>
            <div>
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
                      <v-icon
                        color="red"
                        icon="mdi-window-close"
                        size="x-small"
                        end="true"                    
                        @click="chipDelRef(item.EMAIL)"
                      />
                    </v-chip>
                  </VTextField>
                </template>
              </ILabel>
            </div>
            <div>
              <ILabel :label="$t('제목')" class="mt-2">
                <template #editor="editorProps">
                <VTextField
                  v-model="mailParams.SUBJECT"
                ></VTextField>
                </template>
              </ILabel>
            </div>
          </v-sheet>
          <v-sheet class="mb-2">
            <CKEditor ref="ckEditor" id="HLTJB0030Popup02" height="100%" v-model="mailParams.CONTENT" class="mt-2" @change="onChange"/>
          </v-sheet>
        </div>        
      </v-card-text>
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
