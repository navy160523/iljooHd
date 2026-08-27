<!--
  화면명 : 대관/대노조 공문관리
  화면개요 : 대관/대노조 공문관리
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

const emit = defineEmits(['after-search'])

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
  EMP_NO: userStore.empNo, // 사번(pk)
  EMP_NM: userStore.empNm, // 이름
  JOB_TIT_NM: userStore.jobTitNm, //직급
  NOTICE_DIV: [],
  NOTICE_TITLE: [],
  WEEK_INFO: [],
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

const templateWeekInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const firstDayOfMonth = new Date(year, now.getMonth(), 1);
  const dayOfWeek = firstDayOfMonth.getDay();
  const adjustedDate = now.getDate() + dayOfWeek;
  const week = Math.ceil(adjustedDate / 7);
  return `${month}월 ${week}주차`;
}

const templateWeek = ref(templateWeekInfo())

// 팝업 OPEN
const openPopup = (param) => {

  console.log(param)

  searchParams.NOTICE_DIV = param.map(item => item.NOTICE_DIV);
  searchParams.NOTICE_TITLE = param.map(item => item.NOTICE_TITLE);
  searchParams.WEEK_INFO = param.map(item => getWeekInfoFromDate(item.INSERT_DATE));
  
  mailParams.EMAIL= []
  mailParams.REFERER = []
  chipArr.TO_EMP = []
  chipArr.SENDER = []
  chipArr.REFERER = []

  // 임시
  // chipArr.SENDER.push({ EMP_NM: '손상규', EMAIL: 'BP27414@bp.hd.com' })

  if(!isEmpty(userStore.email)) {
    chipArr.SENDER.push({ EMP_NM: userStore.empNm, EMAIL: userStore.email })
  }

  dialog.value = true
}

// 현재일 기준
const getCurrentWeekInfo = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 매달 1일부터 몇 번째 주인지 계산
  const firstDayOfMonth = new Date(year, now.getMonth(), 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0: 일요일
  const adjustedDate = now.getDate() + dayOfWeek;
  const week = Math.ceil(adjustedDate / 7);

  return `${year}. ${month}월 ${week}주차`;
};

// MAIN그리드에서 받은 INSERT_DATE 기준
const getWeekInfoFromDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const firstDay = new Date(year, month - 1, 1);
  const dayOfWeek = firstDay.getDay();
  const adjustedDate = date.getDate() + dayOfWeek;
  const week = Math.ceil(adjustedDate / 7);

  return `${year}. ${month}월 ${week}주차`;
};

const subject = ref(getCurrentWeekInfo() + ' 공문 회람(건)')
// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSendMail') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content.value.outerHTML, 'text/html')
    const textareas = doc.querySelectorAll('textarea')
    const inputs = doc.querySelectorAll('input')

    textareas.forEach((textarea) => {
      const pTag = document.createElement('p')

      const inputText = textMain.value?.trim()

      if (inputText) {
        // 내용이 있을 경우에만 [참조사항] 추가
        pTag.innerHTML = `<strong>[추가 참고 사항]</strong><br>${inputText.replace(/\n/g, '<br>')}`
      } else {
        // 내용이 없으면 빈 요소로 대체
        pTag.innerHTML = ''
      }

      textarea.replaceWith(pTag)
    })

    doc.querySelectorAll('input').forEach((input, idx) => {
      // content 내부에 있는 진짜 input 값을 Vue에서 가져오기
      const originalInput = content.value.querySelectorAll('input')[idx]
      if (originalInput) {
        input.value = originalInput.value
      }
    })

    doc.querySelectorAll('input').forEach((input) => {
      const span = document.createElement('span')
      span.textContent = input.value || ''
      input.replaceWith(span)
    })

    // 수신자 없을 시 return
    if(isEmpty(mailParams.EMAIL)) {
      return Message.warn(t('수신자를 지정해주십시오.'))
    }
    let mailParam = {
      // EMAIL: ['BP24532@bp.hd.com'], 
      EMAIL: mailParams.EMAIL,
      // REFERER: ['BP24532@bp.hd.com'],
      REFERER: mailParams.REFERER,
      SUBJECT: subject.value,
      CONTENT: doc.body.innerHTML
    }
    vm.$swal({
      title: t('메일 전송하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        commonSendApi(mailParam).then((res) => {
          closePopup()
          Message.success(t('메일이 전송되었습니다.'))
        })
      }
    })
  
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

// 병합된경우
const isFirstOfMergedRow = (idx) => {
  const week = searchParams.WEEK_INFO[idx];
  return idx === 0 || searchParams.WEEK_INFO[idx - 1] !== week;
};

const getRowSpan = (startIdx) => {
  const currentWeek = searchParams.WEEK_INFO[startIdx];
  let count = 1;
  for (let i = startIdx + 1; i < searchParams.WEEK_INFO.length; i++) {
    if (searchParams.WEEK_INFO[i] === currentWeek) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  textMain.value = ''
  subject.value = getCurrentWeekInfo() + ' 공문 회람(건)'
  templateWeek.value = templateWeekInfo()
  dialog.value = false
}

// 인원조회 팝업 오픈(받는사람)
const openPopupToEmp = () => {
  sendType.value = 'S'
  empPopup.value.openPopup({ MULTI: true, BSNS_CD: 'AN00', DEPT_CD: 'N090' })
}

// 인원조회 팝업 오픈(참조자)
const openPopupReferer = () => {
  sendType.value = 'R'
  empPopup.value.openPopup({ MULTI: true, BSNS_CD: 'AN00', DEPT_CD: 'N090' })
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
    height="1100"
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
      <span>대관/대노조 공문 메일발송</span>
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
      <div style="display: flex; align-items: center; margin-bottom: 12px;" class="pa-4 ml-4 mr-4 mb-4 cont">
        <label for="mailSubject" style="font-weight: bold; margin-right: 8px;">제목:</label>
        <input
          id="mailSubject"
          v-model="subject"
          type="text"
          placeholder="메일 제목을 입력하세요"
          style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;"
        />
      </div>
      <div ref="content" class="pa-4 ml-4 mr-4 mb-4 cont">
        <div>안녕하세요.</div>
        <div>ㅤ</div>
        <div>연일 안전/보건 업무에 노고 많으십니다.</div>
        <div>ㅤ</div>
        <div>
          안전보건부문
          <input
            v-model="templateWeek"
            style="border: none; #aaa; width: 120px; text-align: center;"
          />
          접수된 공문 회람 드립니다.
        </div>
        <div>ㅤ</div>
        <div style="font-family: sans-serif; font-size: 14px;">
          ※ 공문 자료 확인 경로 :
          <a
            href="https://hises.hd.com/#/70_data/DAT_C/DATCA0080"
            style="color: blue; text-decoration: underline; margin-left: 5px;"
          >
            HiSEs - 통합자료실 - 자료실 - 대관/대노조 공문 관리 (바로가기, 클릭)
          </a>
        </div>
        <div>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-size: 14px; text-align: center;">
            <tbody>
              <template v-for="(div, idx) in searchParams.NOTICE_DIV" :key="idx">
                <tr>
                  <template v-if="isFirstOfMergedRow(idx)">
                    <td
                      :rowspan="getRowSpan(idx)"
                      style="border: 2px solid #333; width: 150px;"
                    >
                      {{ searchParams.WEEK_INFO[idx] }}
                    </td>
                  </template>
                  <!-- 구분 -->
                  <td style="border: 2px solid #333; width: 200px;">
                    {{ searchParams.NOTICE_DIV[idx] }}
                  </td>
                  <!-- 제목 -->
                  <td style="border: 2px solid #333; width: 300px;">
                    {{ searchParams.NOTICE_TITLE[idx] }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div>ㅤ</div>
        <div> 
          <textarea style="width:100%; height:120px; border: 2px solid #4645b9; padding:6px; border-radius: 0.5rem;" v-model="textMain"></textarea>
        </div>
        <div>ㅤ</div>
        <div>감사합니다😊</div>
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
