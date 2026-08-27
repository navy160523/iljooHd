<!--
화면명 : 아차사고/위험제보 등록/현황 제보 팝업
화면개요 : 제보 등록/수정
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import { useUserStore } from '@hiway/stores/user'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendSMS, commonSendApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import Message from '@hiway/utils/notify'
import IUpload from '@/components/IUpload.vue'
import CommonCodePopUpSAF from '@/components/popup/CommonCodePopUpSAF.vue'
import dayjs from 'dayjs'
const emit = defineEmits([
  'saved',
  'closed'
])

defineOptions({
  name:'30_safety-SAF_E-SAFEB0010Popup',
})

/* 변수 *******************************************/
const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t
const dialog = ref(false)
const menuTitle = ref(null)
const isSaved = ref(false)
const refCommonCodePopUpSAF = ref(null)
const refIUpload = ref(null)
const isNew = ref(false)
const imgSrc = ref('')
const isPdf = ref(false)

const cdList = reactive({
  REPORT_TYPE: [],
  REL_ASGN_CD: []
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  REPORT_DT: '',
  REPORT_NO: '',
  CONTENT: '',
  JOB_PLC_NM: '',
  JOB_LPLC: '',
  JOB_MPLC: '',
  JOB_SPLC: '',
  JOB_PLC_DETAIL: '',
  REL_BSNS_CD: '',
  REL_DEPT_CD: '',
  REL_ASGN_CD: '',
  FILE_ID: '',
  ACT_DATE: '',
  ACT_SER: '',
  REPORT_TYPE: '',
  EMP_NO: '',
})

const notSaveParams = reactive({
  CONTENT2: '',
})

watch(() => saveParams.REL_ASGN_CD, newValue => {
  console.log('cdList.REL_ASGN_CD', cdList.REL_ASGN_CD)

  const asgnItem = _.find(cdList.REL_ASGN_CD, { ASGN_CD: newValue })

  // console.log('asgnItem', asgnItem)
  // console.log('newValue', newValue)

  if(asgnItem) {
    saveParams.REL_BSNS_CD = asgnItem.BSNS_CD
    saveParams.REL_DEPT_CD = asgnItem.DEPT_CD
  }
})

const setCdList = () => {
  getCodeList('HHIZA30REPORT_TYPE').then(res => {
    console.log('REPORT_TYPE res', res)

    cdList.REPORT_TYPE = res.ORESULT_CUR
  })

  commonSearchApi({
    queryId: 'SAFEB0010_SEARCH_01',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
    },
  }).then(res => {
    // console.log('SAFEB0010_SEARCH_01 res', res)

    cdList.REL_ASGN_CD = res.ORESULT_CUR
  })
}

/* 함수 *******************************************/
const openPopup = param => {
  if(param) {
    saveParams.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.REPORT_DT = param.REPORT_DT.replace(/-/g, '')
    saveParams.REPORT_NO = param.REPORT_NO
    saveParams.CONTENT =  param.CONTENT
    saveParams.JOB_PLC_NM = param.JOB_PLC_NM
    saveParams.JOB_LPLC = param.JOB_LPLC
    saveParams.JOB_MPLC = param.JOB_MPLC
    saveParams.JOB_SPLC = param.JOB_SPLC
    saveParams.JOB_PLC_DETAIL = param.JOB_PLC_DETAIL
    saveParams.REL_BSNS_CD = param.REL_BSNS_CD
    saveParams.REL_DEPT_CD = param.REL_DEPT_CD
    saveParams.REL_ASGN_CD = param.REL_ASGN_CD
    saveParams.FILE_ID = param.FILE_ID
    saveParams.ACT_DATE = param.ACT_DATE
    saveParams.ACT_SER = param.ACT_SER
    saveParams.REPORT_TYPE = param.REPORT_TYPE
    saveParams.EMP_NO = param.EMP_NO
    notSaveParams.CONTENT2 = param.CONTENT2
    
    refIUpload.value.setGuid(saveParams.FILE_ID)
    refIUpload.value.onButtonsClick({ id: 'btnSearch' })

    isNew.value = false
  } else {
    refIUpload.value.setGuid()
    saveParams.FILE_ID = refIUpload.value.guid

    isNew.value = true
  }

  // console.log('refIUpload.value.guid', refIUpload.value.guid)

  isSaved.value = false
  dialog.value = true
}

const clearPop = () => {
  saveParams.CMPNY_DIV = userStore.cmpnyDiv
  saveParams.REPORT_DT = ''
  saveParams.REPORT_NO = ''
  saveParams.CONTENT = ''
  saveParams.JOB_PLC_NM = ''
  saveParams.JOB_LPLC = ''
  saveParams.JOB_MPLC = ''
  saveParams.JOB_SPLC = ''
  saveParams.JOB_PLC_DETAIL = ''
  saveParams.REL_BSNS_CD = ''
  saveParams.REL_DEPT_CD = ''
  saveParams.REL_ASGN_CD = ''
  saveParams.FILE_ID = ''
  saveParams.ACT_DATE = ''
  saveParams.ACT_SER = ''
  saveParams.REPORT_TYPE = ''
  saveParams.EMP_NO = ''
  notSaveParams.CONTENT2 = ''

  imgSrc.value = ''

  refIUpload.value.clearGrid()

  dialog.value = false
}

const onButtonsClick = btn => {
  switch(btn.id) {
  case 'btnUpdate':
    btnUpdate()
    break
  case 'btnClose':
    clearPop()
    emit('closed', isSaved.value)
    break
  default: break
  }
}

const mainCheck = () => {
  if(!saveParams.REPORT_TYPE) {
    Message.warn(t('구분은 필수 입력 항목입니다.'))
    return false
  }

  if(!saveParams.REL_ASGN_CD) {
    Message.warn(t('담당안전팀은 필수 입력 항목입니다.'))
    return false
  }

  if(!saveParams.CONTENT) {
    Message.warn(t('제보내용은 필수 입력 항목입니다.'))
    return false
  }

  if(saveParams.REPORT_DT && saveParams.REPORT_NO && saveParams.EMP_NO !== userStore.userId) {
    Message.warn(t('안전 제보 등록자만 수정/저장 가능합니다.'))
    return false
  }

  return true
}

const mainSaveData = () => {
  const param = _.cloneDeep(saveParams)

  Object.keys(param).forEach(key => {
    // console.log('key', key)

    if(param[key] === undefined || param[key] === null) {
      param[key] = ''
    }
  })

  // console.log('param', param)

  return commonExecuteApi({ queryId: 'SAFEB0010_SAVE_01', list: [param], })
}



// const setHDPAY =()=>{
//   let param = {
//     CMPNY_DIV: userStore.cmpnyDiv, //요청자 회사구분
//     EMP_NO: userStore.empNo, //요청자 사번
//     ACCUMULATED_CONTENT_CD: '20', //적립컨텐츠 (HHIC30)
//     POINT: '500', //적립포인트(건당 500포인트)
//   }
//   //이 프로시저를 호출하면 파라미터로 넘긴 EMP_NO에 대한 적립가능여부와 잔여 포인트가 조회된다.
//   //ex)최대 적립포인트가 1000P일때
//   //첫번째로 호출시 -> 최대 적립포인트 - 적립포인트(param.POINT = 500) = 500P가 나옴
//   //두번째로 호출시 -> 500P - 적립포인트(param.POINT = 500) = 0P가 나옴
//   commonSearchApi({
//     queryId: 'EDUDC0020_GET_PAYMENT_INFO_PC',
//     param: param,
//   }).then((res) => {
//     //지급이 가능할때 N이면 지급대상 Y면 지급불가능
//     if (
//       res.ORESULT_CUR[0].STOP_YN === 'N' &&
//       res.ORESULT_CUR[0].EARNABLE_POINT > 0
//     ) {
//       //요청자의 직영,협력사구분 코드 조회
//       selectFunction({
//         queryId: 'EMP_INFO',
//         CMPNY_DIV: userStore.cmpnyDiv,
//         EMP_NO: userStore.empNo,
//         COL_NM: 'USER_DIV',
//       }).then((res2) => {
//         // console.log('이거타냐???')
//         selectFunction({
//           queryId: 'GET_ASGN_FULL_NM',
//           CMPNY_DIV: userStore.cmpnyDiv,
//           ASGN_CD: userStore.asgnCd,
//         })
//           .then((res3) => {
//             console.log('res3@@@', res3)
//             let saveData = {
//               CMPNY_DIV: userStore.cmpnyDiv, //포인트지급대상자 사업장구분
//               YEAR: dayjs().$y, //포인트 지급 년도
//               MNTH: (dayjs().$M + 1).toString().padStart(2, '0'), //포인트 지급 월
//               EMP_NO: userStore.empNo, //포인트 지급 대상자 사번(요청자 사번)
//               POINT_SEQ: '', //포인트 지급테이블 SEQ
//               BSNS_CD: userStore.bsnsCd, //포인트 지급 대상자 사업부코드
//               DEPT_CD: userStore.deptCd, //포인트 지급 대상자 부서코드
//               ASGN_CD: userStore.asgnCd, //포인트 지급 대상자 조직코드
//               ASGN_NAME: res3.ORESULT_CUR, //포인트 지급 대상자 조직이름
//               EMP_NAME: userStore.empNm, //포인트 지급 대상자 성명
//               ORGN_DIV: res2.ORESULT_CUR, //포인트 지급 대상자 직영,협력사구분
//               ACCUMULATED_CONTENT_KEY: '', //적립컨텐츠 키값
//               ACCUMULATED_CONTENT_CD: '20', //적립 컨텐츠(HHIC30)
//               ACCUMULATED_CONTENT_DETAIL: '', //적립 컨텐츠 상세
//               ACCUMULATED_DATE: '', //적립일시
//               ACCUMULATED_POINT: res.ORESULT_CUR[0].EARNABLE_POINT, //적립가능포인트
//               CHANGE_POINT: '', //전환포인트
//               CHANGE_DATE: '', //전환일시
//               CHANGE_USER_IP: '', //전환 IP
//               REMAINING_POINT: '', //잔여포인트
//               CLOSE_DATE: '', //마감일
//               REMARK: '', //비고
//               INSERT_USER_ID: userStore.userId, //등록자
//               INSERT_DATE: '', //등록일시
//             }
//             //EDUDC0020_ADD_HDPAY 프로시저를 호출하여 안전페이를 지급한다.
//             commonSearchApi({
//               queryId: 'EDUDC0020_ADD_HDPAY',
//               param: saveData,
//             })
//           })
//       })
//     }
//     //지급이 불가능할때
//     else {
//       Message.warn(t(`${userStore.empNm}님은 지급 중단대상입니다.`))
//     }
//   })
// }

const btnUpdate = () => {
  new saveFlowHelper(vm, t)
    .setBefore(mainCheck)
    .setQuery(mainSaveData)
    .setAfter(async res => {
      // console.log('save res', res)
      await sendAlarm()
      isSaved.value = true
      emit('saved', res.list[0])
      clearPop()
    })
    .run()
}

const sendAlarm = async () => {
  await commonSearchApi({
    queryId: 'SAFEB0010_SEARCH_06',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv,
      ASGN_CD: saveParams.REL_ASGN_CD,
      WK_LPLC: saveParams.JOB_LPLC,
      WK_MPLC: saveParams.JOB_MPLC,
      WK_SPLC: saveParams.JOB_SPLC,
    },
  }).then(async res => {
    const data = res.ORESULT_CUR
    data.push({
      EMP_NO: userStore.empNo,
      HND_PHN: userStore.hndPhn,
      EMAIL: userStore.email,
    })

    const toMails = []

    // console.log('SAFEB0010_SEARCH_06 data', data)
    
    for(let i = 0; i < data.length; i++) {
      toMails.push(data[i].EMAIL)
      const hndPhn = data[i].HND_PHN
      const empNo = data[i].EMP_NO
      const smsContent = `[HiSEs]아차사고/위험제보 등록 알림`
                      + `\r ○ 제보자: ${userStore.empNm}(${userStore.asgnFullNm})`
                      + `\r ○ 제보일자: ${dayjs().format('YYYY-MM-DD')}`
                      + `\r ○ 구분: ${_.find(cdList.REPORT_TYPE, { COD: saveParams.REPORT_TYPE }).TXT}`
                      + `\r ○ 담당안전팀: ${_.find(cdList.REL_ASGN_CD, { BSNS_CD: saveParams.REL_BSNS_CD, DEPT_CD: saveParams.REL_DEPT_CD, ASGN_CD: saveParams.REL_ASGN_CD }).ASGN_FULL_NM}`
                      + `\r ○ 제보내용: ${saveParams.CONTENT}`
                      + `\r ○ 장소: ${saveParams.JOB_PLC_NM}`
                      + `\r ○ 상세장소: ${saveParams.JOB_PLC_DETAIL}`

      const smsParams = {
        EMPNO_FROM: userStore.empNo,
        EMPNO_TO: empNo,
        SYSCODE: '156',
        FROM_P_NO: userStore.hndPhn ? userStore.hndPhn.replace(/-/g, '') : '',
        TO_P_NO: hndPhn,
        TITLE: smsContent,
      }

      // console.log('smsParams', smsParams)
      
      await commonSendSMS(smsParams)
      
    }

    const maiLParmas = {
      EMAIL: toMails,
      SUBJECT: '[HiSEs]아차사고/위험제보가 등록 알림',
      CONTENT: `1. 평소 업무 협조에 감사드립니다.`
             + `<br/><br/>2. ${_.find(cdList.REPORT_TYPE, { COD: saveParams.REPORT_TYPE }).TXT}가 등록되었으니 확인해주시기 바랍니다.`
             + `<br/><br/>&nbsp;&nbsp;○ 제보자: ${userStore.empNm}(${userStore.asgnFullNm})`
             + `<br/><br/>&nbsp;&nbsp;○ 제보일자: ${dayjs().format('YYYY-MM-DD')}`
             + `<br/><br/>&nbsp;&nbsp;○ 구분: ${_.find(cdList.REPORT_TYPE, { COD: saveParams.REPORT_TYPE }).TXT}`
             + `<br/><br/>&nbsp;&nbsp;○ 담당안전팀: ${_.find(cdList.REL_ASGN_CD, { BSNS_CD: saveParams.REL_BSNS_CD, DEPT_CD: saveParams.REL_DEPT_CD, ASGN_CD: saveParams.REL_ASGN_CD }).ASGN_FULL_NM}`
             + `<br/><br/>&nbsp;&nbsp;○ 제보내용: ${saveParams.CONTENT}`
             + `<br/><br/>&nbsp;&nbsp;○ 장소: ${saveParams.JOB_PLC_NM}`
             + `<br/><br/>&nbsp;&nbsp;○ 상세장소: ${saveParams.JOB_PLC_DETAIL}`
             + `<br/><br/>3. 감사합니다.`
    }

    // console.log('maiLParmas', maiLParmas)

    await commonSendApi(maiLParmas)
  })
}

const openPlace = () => {
  refCommonCodePopUpSAF.value.openPopup('장소')
}

const selectLoc = param => {
  // console.log('param', param)

  saveParams.JOB_LPLC = param[0].COD
  saveParams.JOB_MPLC = param[1].COD
  saveParams.JOB_SPLC = param[2].COD
  saveParams.JOB_PLC_NM = param[2].TXT
}

const rowChanged = param => {
  // console.log('param', param)

  if(param) {
    isPdf.value = param.FILE_TYPE !== undefined && param.FILE_TYPE.toUpperCase() === 'PDF'
    imgSrc.value = param.IMG_URL
  }
}

const uploaded = param => {
  isSaved.value = true
}

onMounted(() => {
  setCdList()
})

/* 외부사용 ***************************************/
defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="fit-content"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div
      class="title-bar"
      @mousedown="startDragging"
    >
      {{ `${saveParams.REPORT_DT ? '제보수정' : '제보등록'}` }}
    </div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="h-grow fill-height">
          <v-sheet class="pa-0 mr-3">
            <div class="d-flex">
              <i-select
                :label="$t('구분')"
                v-model="saveParams.REPORT_TYPE"
                :items="cdList.REPORT_TYPE"
                item-value="COD"
                item-title="TXT"
                width="135px"
                top-label
                required
              />
              <i-select
                :label="$t('담당안전팀')"
                v-model="saveParams.REL_ASGN_CD"
                :items="cdList.REL_ASGN_CD"
                item-value="ASGN_CD"
                item-title="ASGN_FULL_NM"
                width="275px"
                margin="0"
                top-label
                required
              />
            </div>
            <div class="mt-2">
              <i-textarea
                :label="$t('제보내용')"
                v-model="saveParams.CONTENT"
                :row="7"
                required
                top-label
                margin="0"
                width="100%"
              />
            </div>
            <div class="mt-2">
              <i-input
                :label="$t('장소')"
                v-model="saveParams.JOB_PLC_NM"
                readonly
                append-inner-icon="mdi-magnify"
                @click:append-inner="openPlace"
                top-label
                width="100%"
                margin="0"
              />
            </div>
            <div class="mt-2">
              <i-textarea
                :label="$t('상세장소')"
                v-model="saveParams.JOB_PLC_DETAIL"
                top-label
                margin="0"
                width="100%"
              />
            </div>
            <template v-if="!isNew">
              <div class="mt-2">
                <i-textarea
                  :label="$t('조치내용')"
                  v-model="notSaveParams.CONTENT2"
                  readonly
                  top-label
                  margin="0"
                  width="100%"
                  bg-color="#eeeeee"
                />
              </div>
            </template>
          </v-sheet>
          <v-sheet width="515px" class="pa-0 mr-3">
            <div class="area--upload pa-2">
              <IUpload
                ref="refIUpload"
                img-pdf-only
                use-img-view
                :download-off="isNew"
                :button-list="isNew ? ['btnFileUpload', 'btnDelete'] : ['btnFileUpload', 'btnDownLoad', 'btnDelete']"
                @rowChanged="rowChanged"
                @uploaded="uploaded"
              />
            </div>
          </v-sheet>
          <v-sheet width="500px" class="pa-0">
            <div class="area--img pa-2">
              <template v-if="isPdf">
                <iframe width="100%" height="100%" :src="imgSrc" style="object-fit: cover;" />
              </template>
              <template v-else>
                <div
                  class="w-full h-full"
                  :style="`background-image: url(${imgSrc}); background-size: contain; background-position: 50% 50%;`"
                />
              </template>
            </div>
          </v-sheet>
        </div>
      </v-card-text>

      <CommonCodePopUpSAF ref="refCommonCodePopUpSAF" @selected="selectLoc" />
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.area--upload {
  border: 1px solid #cccccc;
  border-radius: 7px;
  height: 100%;
}

.area--img {
  height: 100%;
  border: 1px solid #cccccc;
  border-radius: 7px;
}

.content-area {
  height: fit-content;
  > div {
    min-height: 0;
  }
}
</style>