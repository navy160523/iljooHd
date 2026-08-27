<!--
화면명 : 아차사고/위험제보 등록/현황 조치 팝업
화면개요 : 조치 입력
-->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import { useUserStore } from '@hiway/stores/user'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import { commonSearchApi, commonSendSMS, commonExecuteApi, getCodeList,selectFunction } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import Message from '@hiway/utils/notify'
import dayjs from "dayjs"
const emit = defineEmits([
  'saved',
])

defineOptions({
  name:'30_safety-SAF_E-SAFEB0010Popup02',
})

/* 변수 *******************************************/
const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t
const dialog = ref(false)
const menuTitle = ref(null)
const isSaved = ref(false)

const params = reactive({
  REPORT_TYPE: '',
  REL_ASGN_CD: '',
  CONTENT: '',
})

const cdList = reactive({
  REPORT_TYPE: [],
  REL_ASGN_CD: [],
})

const saveParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  REPORT_DT: '',
  REPORT_NO: '',
  CONTENT2: '',
})

const HDPAY = reactive({
  EMP_NO: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  EMP_NAME: '',
  INSERT_USER_ID: '',
  CMPNY_DIV: '',
})
/* 함수 *******************************************/
const openPopup = async param => {
  console.log(param,'param')
  await setCdList()

  if(param) {
    saveParams.CMPNY_DIV = userStore.cmpnyDiv
    saveParams.REPORT_DT = param.REPORT_DT.replace(/-/g, '')
    saveParams.REPORT_NO = param.REPORT_NO
    saveParams.CONTENT2 =  param.CONTENT2
    params.REPORT_TYPE = param.REPORT_TYPE
    params.REL_ASGN_CD = param.REL_ASGN_CD
    params.CONTENT = param.CONTENT

    HDPAY.EMP_NO = param.EMP_NO
    HDPAY.CMPNY_DIV = param.CMPNY_DIV
    HDPAY.BSNS_CD = param.BSNS_CD
    HDPAY.DEPT_CD = param.DEPT_CD
    HDPAY.ASGN_CD = param.ASGN_CD
    HDPAY.EMP_NAME = param.EMP_NM
    HDPAY.INSERT_USER_ID = param.EMP_NO

  }

  isSaved.value = false
  dialog.value = true
}

const clearPop = () => {
  saveParams.CMPNY_DIV = userStore.cmpnyDiv
  saveParams.REPORT_DT = ''
  saveParams.REPORT_NO = ''
  saveParams.CONTENT2 = ''

  dialog.value = false
}

const onButtonsClick = btn => {
  switch(btn.id) {
  case 'btnUpdate':
    btnUpdate()
    break
  case 'btnClose':
    clearPop()
    break
  default: break
  }
}

const mainCheck = () => {
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

  return commonExecuteApi({ queryId: 'SAFEB0010_SAVE_02', list: [param], })
}

const btnUpdate = () => {
  new saveFlowHelper(vm, t)
    .setBefore(mainCheck)
    .setQuery(mainSaveData)
    .setAfter(async res => {
      // console.log('save res', res.list[0])
      await setHDPAY()
      await commonSearchApi({
        queryId: 'SAFEB0010_SEARCH_04',
        param: {
          CMPNY_DIV: saveParams.CMPNY_DIV,
          REPORT_DT: saveParams.REPORT_DT.replace(/-/g, ''),
          REPORT_NO: saveParams.REPORT_NO,
        },
      }).then(res2 => {
        // console.log('SAFEB0010_SEARCH_04 res2', res2)

        const smsEmp = res2.ORESULT_CUR

        if(smsEmp.length > 0) {
          const hndPhn = smsEmp[0].HND_PHN ? smsEmp[0].HND_PHN.replace(/-/g, '') : ''
          const smsDte = smsEmp[0].SMSDTE ? smsEmp[0].SMSDTE : ''
          const smsContent = t('[HiSEs]아차사고/위험제보 조치 등록 알림 - 등록 하신 안전제보에 대한 조치내용이 등록되었습니다.')

          if(!smsDte) {
            const smsParams = {
              EMPNO_FROM: userStore.empNo,
              EMPNO_TO: smsEmp[0].EMP_NO,
              SYSCODE: '156',
              FROM_P_NO: userStore.hndPhn ? userStore.hndPhn.replace(/-/g, '') : '',
              TO_P_NO: hndPhn,
              TITLE: smsContent,
            }

            // console.log('smsParams', smsParams)

            commonSendSMS(smsParams).then(async resSms => {
              const smsLogParams = {
                CMPNY_DIV: saveParams.CMPNY_DIV,
                REPORT_DT: saveParams.REPORT_DT.replace(/-/g, ''),
                REPORT_NO: saveParams.REPORT_NO,
              }

              // console.log('smsLogParams', smsLogParams)

              await commonExecuteApi({ queryId: 'SAFEB0010_SAVE_03', list: [smsLogParams] })
            })
          }
        }
      })

      isSaved.value = true
      emit('saved', res.list[0])
      clearPop()
    })
    .run()
}

const setHDPAY =()=>{
  let param = {
    CMPNY_DIV: HDPAY.CMPNY_DIV, //요청자 회사구분
    EMP_NO: HDPAY.EMP_NO, //요청자 사번
    ACCUMULATED_CONTENT_CD: '20', //적립컨텐츠 (HHIC30)
    POINT: '500', //적립포인트(건당 500포인트)
  }
  //이 프로시저를 호출하면 파라미터로 넘긴 EMP_NO에 대한 적립가능여부와 잔여 포인트가 조회된다.
  //ex)최대 적립포인트가 1000P일때
  //첫번째로 호출시 -> 최대 적립포인트 - 적립포인트(param.POINT = 500) = 500P가 나옴
  //두번째로 호출시 -> 500P - 적립포인트(param.POINT = 500) = 0P가 나옴
  commonSearchApi({
    queryId: 'EDUDC0020_GET_PAYMENT_INFO_PC',
    param: param,
  }).then((res) => {
    console.log(res,'res')
    //지급이 가능할때 N이면 지급대상 Y면 지급불가능
    if (
      res.ORESULT_CUR[0].STOP_YN === 'N' &&
      res.ORESULT_CUR[0].EARNABLE_POINT > 0
    ) {
      //요청자의 직영,협력사구분 코드 조회
      selectFunction({
        queryId: 'EMP_INFO',
        CMPNY_DIV: HDPAY.CMPNY_DIV,
        EMP_NO: HDPAY.EMP_NO,
        COL_NM: 'USER_DIV',
      }).then((res2) => {
        // console.log('이거타냐???')
        selectFunction({
          queryId: 'GET_ASGN_FULL_NM',
          CMPNY_DIV: HDPAY.CMPNY_DIV,
          ASGN_CD: HDPAY.ASGN_CD,
        })
          .then((res3) => {
            console.log('res3@@@', res3)
            let saveData = {
              CMPNY_DIV: HDPAY.CMPNY_DIV, //포인트지급대상자 사업장구분
              YEAR: dayjs().$y, //포인트 지급 년도
              MNTH: (dayjs().$M + 1).toString().padStart(2, '0'), //포인트 지급 월
              EMP_NO: HDPAY.EMP_NO, //포인트 지급 대상자 사번(요청자 사번)
              POINT_SEQ: '', //포인트 지급테이블 SEQ
              BSNS_CD: HDPAY.BSNS_CD, //포인트 지급 대상자 사업부코드
              DEPT_CD: HDPAY.DEPT_CD, //포인트 지급 대상자 부서코드
              ASGN_CD: HDPAY.ASGN_CD, //포인트 지급 대상자 조직코드
              ASGN_NAME: res3.ORESULT_CUR, //포인트 지급 대상자 조직이름
              EMP_NAME: HDPAY.EMP_NAME, //포인트 지급 대상자 성명
              ORGN_DIV: res2.ORESULT_CUR, //포인트 지급 대상자 직영,협력사구분
              ACCUMULATED_CONTENT_KEY: '', //적립컨텐츠 키값
              ACCUMULATED_CONTENT_CD: '20', //적립 컨텐츠(HHIC30)
              ACCUMULATED_CONTENT_DETAIL: '', //적립 컨텐츠 상세
              ACCUMULATED_DATE: '', //적립일시
              ACCUMULATED_POINT: res.ORESULT_CUR[0].EARNABLE_POINT, //적립가능포인트
              CHANGE_POINT: '', //전환포인트
              CHANGE_DATE: '', //전환일시
              CHANGE_USER_IP: '', //전환 IP
              REMAINING_POINT: '', //잔여포인트
              CLOSE_DATE: '', //마감일
              REMARK: '', //비고
              INSERT_USER_ID: HDPAY.INSERT_USER_ID, //등록자
              INSERT_DATE: '', //등록일시
            }
            //EDUDC0020_ADD_HDPAY 프로시저를 호출하여 안전페이를 지급한다.
            commonSearchApi({
              queryId: 'EDUDC0020_ADD_HDPAY',
              param: saveData,
            })
          })
      })
    }
    //지급이 불가능할때
    else {
      Message.warn(t(`${userStore.empNm}님은 지급 중단대상입니다.`))
    }
  })
}


const setCdList = async () => {
  await Promise.all([
    getCodeList('HHIZA30REPORT_TYPE'),
    commonSearchApi({ queryId: 'SAFEB0010_SEARCH_01', param: { CMPNY_DIV: userStore.cmpnyDiv, } })
  ]).then(res => {
    cdList.REPORT_TYPE = res[0].ORESULT_CUR
    cdList.REL_ASGN_CD = res[1].ORESULT_CUR
  })
}

onMounted(() => {
  //
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
      조치입력
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
          <v-sheet width="100%" class="pa-0">
            <div class="d-flex">
              <i-select
                :label="$t('구분')"
                v-model="params.REPORT_TYPE"
                :items="cdList.REPORT_TYPE"
                item-value="COD"
                item-title="TXT"
                width="140px"
                top-label
                readonly
                bg-color="#eee"
              />
              <i-select
                :label="$t('담당안전팀')"
                v-model="params.REL_ASGN_CD"
                :items="cdList.REL_ASGN_CD"
                item-value="ASGN_CD"
                item-title="ASGN_FULL_NM"
                width="275px"
                margin="0"
                top-label
                readonly
                bg-color="#eee"
              />
            </div>
            <div class="mt-2">
              <i-textarea
                :label="$t('제보내용')"
                v-model="params.CONTENT"
                :row="7"
                readonly
                bg-color="#eee"
                top-label
                margin="0"
                width="100%"
              />
            </div>
            <div class="mt-2">
              <i-textarea
                :label="$t('조치내용')"
                v-model="saveParams.CONTENT2"
                :row="10"
                top-label
                margin="0"
                width="100%"
              />
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  height: fit-content;
  > div {
    min-height: 0;
  }
}
</style>