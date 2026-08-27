<!-- 
  * Vue 내 용 : 일정/업무 관리(To-Do-List)
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/01/25
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/01/25 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useRouter }    from 'vue-router'
import { useI18n } from 'vue-i18n'
import { commonSearchApi , commonExecuteApi, commonSendApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'

import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import { isEmpty } from "@/@core/utils"
import OPRAB0010Popup from "./OPRAB0010Popup.vue"
import { useCommonStore } from "@hiway/stores/common"
import Message from '@hiway/utils/notify' 
import { identity } from '@vueuse/core'

const props = defineProps({
  isTitle: {
    type: Boolean,
    default: true,
  },
  btnList: {
    type: Array,
    default: ['btnSearch'],
  },
  hiddenManuel: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

defineOptions({ 
  name:'80_operation-OPR_A-OPRAB0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const router = useRouter()
const userStore = useUserStore()
const menuTitle = ref(null)
const userId = ref(userStore.userId)

const oPRAB0010Popup = ref(null)
const commonStore = useCommonStore()
const dialog = ref(false)

//승인/결재
const items1 = ref([
  {
    action: '',
    headline: '',
    title: '',
    subtitle: '',
    color: '',
    app_status: '',
    app_desc: '',
    app_title: '',
    app_reqnm: '',
    app_nm: '',
    app_id: '',
    app_gbn: '',
    menu_id: '',
    path: '',
  },
])

//알림
const items2 = ref([
  {
    action: '',
    headline: '',
    title: '',
    subtitle: '',
  },
])

//일정
const items3 = ref([
  { id: 1, name: 'A', description: 'Short', showButtons: true },
  { id: 2, name: 'B', description: 'Short', showButtons: false },
  { id: 3, name: 'C', description: 'Longer text that wraps onto multiple lines', showButtons: true },
])

const searchParams = reactive({
  DT_GBN:'1',
  DTE_FROM: dayjs().subtract(14, "day").format("YYYY-MM-DD"),
  DTE_TO: dayjs().add(14, "day").format("YYYY-MM-DD"),

  // DTE_FROM: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
  // DTE_TO: dayjs().format("YYYY-MM-DD"),
  EMPNO_TO: '',
  CMPNY_DIV: userStore.cmpnyDiv,
})

const search01Params = reactive({
  DTE_FROM: '',
  DTE_TO: '',
  EMPNO_TO: userId.value,
  CMPNY_DIV: userStore.cmpnyDiv,
})

const search02Params = reactive({
  DTE_FROM: '',
  DTE_TO: '',
  EMPNO_TO: userId.value,
  CMPNY_DIV: userStore.cmpnyDiv,
})

const search03Params = reactive({
  //개인 교육 일정 조회 화면 참고(EDUAB0040)
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION: '', //분류
  CURR_ID: '',  //과정순번
  EDU_DATE_FROM: '',  //교육 신청기간
  EDU_DATE_TO: '',  //교육 신청기간
  TARGET_ID: userStore.userId,
  USER_ID: userStore.userId, //사용자사번(사용 안함)
  CHK_YN: 'N',  //소속인원 전체 조회
  ORGN_DIV: userStore.userDiv,  //A:직영, B:협력사
  ASGN_CD: userStore.asgnCd,  //조직코드(B:협력사일경우)
})

const saveParams = reactive([
  {
    CMPNY_DIV : userStore.cmpnyDiv,
    YEAR : null,
    SCHEDULE_ID : null,
    DIV : 'Y',
    APP_EMP_NO : userStore.userId ,
    USER_ID : userStore.userId,
    MENU_ID : null,
    APP_DESC: null,
  },
])

onMounted(() => {
  onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    items1.value = []
    items2.value = []
    items3.value = []

    // 결재 승인 조회
    new queryFlowHelper(vm, t)
      .setQuery(searchData01)
      .setAfter(afterSearchData01)
      .showMessage(false)
      .run()

    // 알림 조회
    new queryFlowHelper(vm, t)
      .setQuery(searchData02)
      .setAfter(afterSearchData02)
      .showMessage(false)
      .run()

    // 일정 조회
    new queryFlowHelper(vm, t)
      .setQuery(searchData03)
      .setAfter(afterSearchData03)
      .showMessage(false)
      .run()
  }else if(btn.id === 'btnClose') {
    emit('close')
  }
}

const onButtonsClick2 = btn => {
  if(btn.id === 'btnClose') {
    dialog.value = false
    onButtonsClick({ id: 'btnSearch' })
  }else if(btn.id === 'btnTurnBack'){
    onApplyTurnBack()
  }
}

// 알림 조회로직 
const searchData01 = () => {
  search01Params.DTE_FROM = searchParams.DTE_FROM
  search01Params.DTE_TO = searchParams.DTE_TO
  search01Params.EMPNO_TO = userStore.userId

  //테스트용(박용훈)
  // search01Params.EMPNO_TO = 'BP23253'

  return commonSearchApi({ queryId : 'OPRAB0010_SEARCH_01', param: search01Params }) 
}

const afterSearchData01 = async res => {
  if (res.ORESULT_CUR.length > 0) {
    // 반려는 배열 제일 뒤 쪽으로 보냄
    let result = await res.ORESULT_CUR.filter(item => item.APP_STATUS != 'Y' && !item.APP_STATUS_NM.includes('반려'))
    let result2 = await res.ORESULT_CUR.filter(item => item.APP_STATUS_NM.includes('반려') || item.APP_STATUS == 'Y')
    let result3 = [...result, ...result2]
    for (let item of result3) {
      
      // let strHeadline = '결재상신자: ' + (item.APPREQEMP_NM ? item.APPREQEMP_NM : '') + (item.APPREQEMP_JOBTIT ? item.APPREQEMP_JOBTIT : '') + '<br />' 
      // + '결재승인자: ' + (item.APPEMP_NM ? item.APPEMP_NM : '') + (item.APPEMP_JOBTIT ? item.APPEMP_JOBTIT : '')
      // let strAction = '[상신일]: ' + (item.APP_REQ_DATE ? item.APP_REQ_DATE : '') + '<br />' 
      // + '[승인일]: ' + (item.APP_DATE ? item.APP_DATE : '')

      let strHeadline = '[상신자] ' + (item.APPREQEMP_NM ? item.APPREQEMP_NM : '') + (item.APPREQEMP_JOBTIT ? item.APPREQEMP_JOBTIT : '')
      let strAction = '[상신일자] ' + (item.APP_REQ_DATE ? item.APP_REQ_DATE : '')
      let strSubtitle = (item.APP_STATUS_NM ? item.APP_STATUS_NM : '')
      let color = ''

      if (item.APPROVE_GBN === 'I') {
        color = 'rgb(212,244,250)'
      } else {
        color = 'rgb(221,221,206)'
      }

      items1.value.push({
        title: (item.APPROVE_GBNNM ? item.APPROVE_GBNNM : '') + ' ' + (item.TITLE ? item.TITLE : ''),
        action: strAction,
        headline: strHeadline,
        subtitle: strSubtitle,
        color: color,
        app_title: (item.TITLE ? item.TITLE : ''),
        app_status: (item.APP_STATUS ? item.APP_STATUS : ''),
        app_desc: (item.APP_DESC ? item.APP_DESC : ''),
        app_reqnm: (item.APPREQEMP_NM ? item.APPREQEMP_NM : '') + (item.APPREQEMP_JOBTIT ? item.APPREQEMP_JOBTIT : ''),
        app_nm: (item.APPEMP_NM ? item.APPEMP_NM : '') + (item.APPEMP_JOBTIT ? item.APPEMP_JOBTIT : ''),
        app_id: item.APPROVE_ID,
        app_gbn: item.APPROVE_GBN,
        menu_id: item.FORM_ID,
        path: item.PATH,
      }) 
    }
  }
} 

// 알림 조회로직 
const searchData02 = () => {
  search02Params.DTE_FROM = searchParams.DTE_FROM
  search02Params.DTE_TO = searchParams.DTE_TO

  return commonSearchApi({ queryId : 'OPRAB0010_SEARCH_02', param: search02Params })
}

const afterSearchData02 = res => {
  if (res.ORESULT_CUR.length > 0) {
    for (let item of res.ORESULT_CUR) {
      items2.value.push({
        action: (item.SND_DTE ? item.SND_DTE : ''),
        headline: '보낸사람: ' + (item.BSNS_NM ? item.BSNS_NM : '') + ' ' + 
                  (item.EMP_NM ? item.EMP_NM : '') + ' '+ 
                  (item.FROM_P_NO ? item.FROM_P_NO : ''),
        title: item.SYSCODE,
        subtitle: (item.TITLE ? item.TITLE : ''),
      })
    }
  }
} 

// 알림 조회로직 
const searchData03 = () => {
  search03Params.EDU_DATE_FROM = searchParams.DTE_FROM.replaceAll('-', '')
  search03Params.EDU_DATE_TO = searchParams.DTE_TO.replaceAll('-', '')

  return commonSearchApi({ queryId : 'EDUAB0040_SEARCH_01', param: search03Params })
}


const afterSearchData03 = res => {
  if (res.ORESULT_CUR.length > 0) {
    for (let item of res.ORESULT_CUR) {
      items3.value.push({
        action: '[일시 및 장소]: ' + (item.EDU_DATE ? item.EDU_DATE : '') + ' ' + 
                  (item.EDU_TIME ? item.EDU_TIME : '') + ' '+ 
                  (item.EDU_TIME_FN ? item.EDU_TIME_FN : '') + ' '+ 
                  (item.EPLACE_NM ? item.EPLACE_NM : '') + '(' + (item.LEAD_TIME_DSCR ? item.LEAD_TIME_DSCR : '') + ')',
        headline: '주관: ' + (item.MORGN_DEPTNM ? item.MORGN_DEPTNM : '') + ' ' + (item.MORGN_NM ? item.MORGN_NM : ''),
        title: '[' + (item.CURR_NM ? item.CURR_NM : '') + ']', //교육명
        subtitle: (item.EDU_CONTENT ? item.EDU_CONTENT : ''),
      })
    }
  }
}

/* ******************* 검토 승인 ******************* */
const onApplyClick = async (title, status, desc, reqnm, id, gbn, menu_id) => {
  let result = await vm.$swal({ 
    title: t('승인 하시겠습니까?'), 
    showCancelButton: true,
  })
  
  if(result.isConfirmed){
    saveParams[0].YEAR = id.substring(0, 4)
    saveParams[0].SCHEDULE_ID = id
    saveParams[0].MENU_ID = menu_id
    
    // PTW의 경우 병행 또는 긴급작업 여부 확인해야함
    if (menu_id === 'SAFBA0010'){

      let CrossedYN = 'N'   // 병행여부
      let urgentYN = await commonSearchApi({ queryId : 'SAFBA0010_SEARCH_22', param: { CMPNY_DIV : userStore.cmpnyDiv,  RCV_NO: id  } }) // 긴급작업 여부
      let oresult = await commonSearchApi({ queryId: "SAFBA0010_SEARCH_15", param: { CMPNY_DIV : userStore.cmpnyDiv,  RCV_NO: id  } })

      console.log('urgentYN: ', urgentYN.ORESULT_CUR[0].URGENT_YN)

      if (oresult.ORESULT_CUR.length === 0) {  CrossedYN = 'N'  }
      else                                  {  CrossedYN = 'Y'  }


      if(CrossedYN === 'Y' || urgentYN.ORESULT_CUR[0].URGENT_YN === 'Y'){
        Message.warn(t('긴급작업 또는 병행작업은 위험작업허가 작성/승인 메뉴에서 승인이 필요합니다.')) 
        
        return
      }
    }
    
    commonExecuteApi({ queryId : 'OPRAB0010_SAVE_03', list: saveParams }).then(() => {
      Message.success(t('승인 되었습니다.'))
      
      if(menu_id === 'SAFDC0010') {
        // 시정통보일 경우 알림 메일 발송
        sendAlram(menu_id, id)
      }

      onButtonsClick({ id: 'btnSearch' })
    })
  }
}

const ApplyTurnBackOpen = async (title, status, desc, reqnm, id, gbn, menu_id) => {
  saveParams[0].YEAR = id.substring(0, 4)
  saveParams[0].SCHEDULE_ID = id
  saveParams[0].MENU_ID = menu_id
  
  dialog.value = true
}

/* ******************* 검토 반려 ******************* */
const onApplyTurnBack = async () => {

  let result = await vm.$swal({ 
    title: t('반려 하시겠습니까?'), 
    showCancelButton: true,
  }) 

  if(!saveParams[0].APP_DESC){
    Message.warn(t('반려 사유를 입력 해주세요.'))
    
    return
  }

  if(result.isConfirmed){
    commonExecuteApi({ queryId : 'OPRAB0010_SAVE_04', list: saveParams }).then(() => {
      Message.success(t('반려 되었습니다.'))

      onButtonsClick2({ id: 'btnClose' })
    })
  }

}

const sendAlram = async (menu_id, id) => {
  if(menu_id === 'SAFDC0010') {
    let oresult = await commonSearchApi({ queryId: "SAFDC0010_SEARCH_18", param: { CMPNY_DIV : userStore.cmpnyDiv,  APPROVE_ID: id  } })

    console.log('oresult', oresult)
    console.log('oresult.Object.ORESULT_CUR', oresult.ORESULT_CUR)
    if (oresult.ORESULT_CUR.length > 0){
      let company = oresult.ORESULT_CUR[0].COMPANY
      let recDeptCD = oresult.ORESULT_CUR[0].REC_DEPT_CD
      let recAsgnCD = oresult.ORESULT_CUR[0].REC_ASGN_CD
      let subject = oresult.ORESULT_CUR[0].TITLE
      let msgHeader = oresult.ORESULT_CUR[0].MSG_HEADER
      let msgBody = oresult.ORESULT_CUR[0].MSG_BODY
      let msgFooter = oresult.ORESULT_CUR[0].MSG_FOOTER
      let msg = msgHeader + msgBody + msgFooter

      sendMail(company, recDeptCD, recAsgnCD, subject, msg)
    }
  }
}

const sendMail = async (pCmpnyDiv, pDeptCd, pAsgnCd, pSubject, pMsg) => {
  const mailList1 = await commonSearchApi({
    queryId : 'SAFDD0010_SEARCH_04',
    param: {
      CMPNY_DIV: pCmpnyDiv,
      DEPT_CD: pDeptCd,
      ASGN_CD: pAsgnCd,
    },
  })

  const mails1 = []

  mailList1.ORESULT_CUR.forEach(mail => {
    if(mail.EMAIL) {
      mails1.push(mail.EMAIL)
    }
  })

  // 메일전송
  await commonSendApi({
    EMAIL: mails1,
    SUBJECT: pSubject,
    CONTENT: pMsg,
  })
}

const onMovePage = val => {
  if(val.path) {
    commonStore.loading = true
    router.push(val.path).finally(() => {
      commonStore.loading = false
    })
  }
}

const popupClosed = () => {
  onButtonsClick({ id:'btnSearch' })
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="props.isTitle ? $t(useLogsStore().menuId) : ''"
        :button-list="props.btnList"
        :use-permission="false"
        :hidden-manuel="props.hiddenManuel"
        @click-button="onButtonsClick" 
      />
      <!-- showManuel -->
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.DTE_FROM"
            :label="$t('기간')"
            label-width="45px"
            type="date"
            width="210px"
            class="mr-1"
            required
          />
          <i-input
            v-model="searchParams.DTE_TO"
            :label="$t('~')"
            width="180px"
            type="date"
          />
        </v-sheet>
        <v-sheet class="fill-height">
          <div class="d-flex">
            <!-- 검토/확인 -->
            <v-card width="33%">
              <v-layout>
                <v-app-bar
                  height="40"
                >
                  <IGridTitle
                    :title="t('검토/확인 필요사항')"
                  />
                </v-app-bar>
                <v-main style="overflow-x: hidden; overflow-y: auto;">
                  <v-divider class="border-opacity-100" />
                  <v-container class="pa-0 PLAN_CONTENTS">
                    <v-row
                      v-for="(item, i) in items1" 
                      :key="i"
                      dense
                    >
                      <v-card
                        border
                        class="w-full"
                        :disabled="item.subtitle.includes('반려') || item.app_status === 'Y' ? true : false"
                      >
                        <div
                          class="PLAN_CARD"
                          @click="onMovePage(item)"
                        >
                          <v-card-title>
                            <div class="text-wrap">
                              {{ item.title }}
                            </div>
                          </v-card-title>
                          <v-card-text
                            class="myAction"
                            v-html="item.action"
                          />
                          <v-card-text
                            class="myHeadline"
                            v-html="item.headline"
                          />
                          <v-card-text
                            class="mySubtitle2 pb-2"
                            v-html="item.subtitle"
                          />
                        </div>
                        <v-card-actions>
                          <div class="w-full text-end">
                            <v-btn 
                              class="myViewmore v-btn bg-primary mr-2"
                              color="white"
                              variant="text"
                              @click="onApplyClick(
                                item.app_title,
                                item.app_status,
                                item.app_desc,
                                item.app_reqnm,
                                item.app_id,
                                item.app_gbn,
                                item.menu_id)"
                            >
                              승인
                            </v-btn>
                            <v-btn
                              class="myViewmore v-btn bg-primary"
                              color="white"
                              variant="text"
                              @click="ApplyTurnBackOpen(
                                item.app_title,
                                item.app_status,
                                item.app_desc,
                                item.app_reqnm,
                                item.app_id,
                                item.app_gbn,
                                item.menu_id)"
                            >
                              반려
                            </v-btn>
                          </div>
                          <v-spacer />
                          <!--
                            <v-btn
                            class="ms-2"
                            append-icon="mdi-chevron-right"
                            color="red-lighten-1"
                            variant="outlined"
                            @click="onMovePage(item.path)"
                            >
                            화면 이동
                            </v-btn> 
                          -->
                        </v-card-actions>
                      </v-card>
                    </v-row>
                  </v-container>
                </v-main>
              </v-layout>
            </v-card>
            <!-- 알림 -->
            <v-card
              class="ml-2"
              width="33%"
            >
              <v-layout>
                <v-app-bar
                  height="40"
                >
                  <IGridTitle
                    :title="t('알림')"
                  />
                </v-app-bar>
                <v-main>
                  <v-divider class="border-opacity-100" />
                  <v-container class="pa-0 PLAN_CONTENTS">
                    <v-row
                      v-for="(item, i) in items2" 
                      :key="i"
                      dense
                    >
                      <v-card
                        border  
                        class="mx-auto w-full"
                      >
                        <v-card-title>
                          <div class="text-wrap">
                            {{ item.title }}
                          </div>
                        </v-card-title>
                        <v-card-text class="myAction">
                          {{ item.action }}
                        </v-card-text>
                        <v-card-text class="myHeadline">
                          {{ item.headline }}
                        </v-card-text>
                        <v-card-text class="mySubtitle pb-2">
                          {{ item.subtitle }}
                        </v-card-text>
                      </v-card>
                    </v-row>
                  </v-container>
                </v-main>
              </v-layout>
            </v-card>
            <!-- 일정 -->
            <v-card
              class="ml-2"
              width="33%"
            >
              <v-layout>
                <v-app-bar
                  height="40"
                >
                  <IGridTitle
                    :title="t('교육 일정')"
                  />
                </v-app-bar>
                <v-main style="overflow-x: hidden; overflow-y: auto;">
                  <v-divider class="border-opacity-100" />
                  <v-container class="pa-0 PLAN_CONTENTS">
                    <v-row
                      v-for="(item, i) in items3" 
                      :key="i"
                      dense
                    >
                      <v-card
                        border  
                        class="mx-auto w-full"
                      >
                        <v-card-title>
                          <div class="text-wrap">
                            {{ item.title }}
                          </div>
                        </v-card-title>
                        <v-card-text class="myAction">
                          {{ item.action }}
                        </v-card-text>
                        <v-card-text class="myHeadline">
                          {{ item.headline }}
                        </v-card-text>
                        <v-card-text class="mySubtitle pb-2">
                          {{ item.subtitle }}
                        </v-card-text>
                      </v-card>
                    </v-row>
                  </v-container>
                </v-main>
              </v-layout>
            </v-card>
          </div>
        </v-sheet>
        <OPRAB0010Popup 
          ref="oPRAB0010Popup"
          @closed="popupClosed"
        />
      </div>
    </v-card-text>
  </v-card>
  <v-dialog
    v-model="dialog" 
    eager
    persistent 
    width="550px"
    height="190px"
    class="p-absolute user-select-none"
  >
    <v-sheet 
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>반려 사유 입력</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pt-2 pb-0">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnTurnBack', 'btnClose']"
          class="mb-0"
          @click-button="onButtonsClick2"
        />
      </v-card-title>
      <v-card-text class="pa-3">
        <div class="d-flex flex-column fill-height">
          <i-textarea 
            v-model="saveParams[0].APP_DESC"
            :label="$t('반려사유')"
            top-label
            width="520px"
            :row="2"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  .mySubtitle {
    font-size: 1.0rem;
    color: dimgray !important;
  }
  .mySubtitle2 {
    font-size: 1.2rem;
    color: dimgray !important;
  }
  .myAction {
    font-size: 1.2rem;
    color: darkblue !important;
  }
  .myHeadline {
    font-size: 1.1rem;
    color: steelblue !important;
  }
  .myViewmore {
    font-size: 1.0rem;
  }
  .content-area {
    position: relative;
    // 만약 타이틀 영역에 컴포넌트를 추가한다면
    // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
    height: calc(100vh - 200px);
    overflow-y: auto;
    > div {
      // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
      // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
      min-height: 500px;
    }
  }
  .PLAN_HEADER_COLOR {
    background-color: #d6dae7!important;
  }

  .PLAN_CONTENTS {
    overflow-y: scroll;
    overflow-x: hidden;
    max-height: 620px;
    :hover{
      background-color: #ededed;
    }
    .myViewmore {
      background-color: initial;
      :hover{
        background-color: initial;
      }
    }
  }
 .PLAN_CARD {
  cursor: pointer;
 }
</style>
