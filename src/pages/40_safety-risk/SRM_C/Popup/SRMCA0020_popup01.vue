<!-- 
  화면명   : Hi-SAFE 주제 현황 메일 발송 팝업
  화면개요 : Hi-SAFE 주제 현황에서 주제 선택 후 메일 발송 클릭 시 열림
            옵션에 따라 수신인 결정이 가능함
-->
<script setup>
import {
  ref,
  reactive,
  onMounted,
  getCurrentInstance,
  readonly,
  watch,
} from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSendApi, commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import IButtonList from '@/components/IButtonList.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue' // 결재팝업
import SubEmpPopup from '@/components/popup/EmpPopup.vue' // 인원 검색 팝업
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'

//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['closed', 'upDataRow'])
const userStore = useUserStore()

const menuTitle = ref(null)
const refOpiButton = ref(null)
const popupButton = ref(null)
const isReadonly = ref(true)

const subEmpPopup = ref(null)

let SELECT_EMP = ref('Y')
let icon = ''
let closeIcon = ''
let isOpen = ref(false)
let RECEIVER = ''

const dialog = ref(null)
const popupParams = reactive({
  TITLE: '',
  CONTENT: '',
  EMP_NO: [],
})

let mainData = ref(null)

let attendMembers = reactive({
  WORK_EMP_NO: [], // 과제 담당자
  SAFE_EMP_NO: [], // 안전 담당자
})

const openPopup = (rowData) => {
  if (rowData) {
    mainData = rowData
    RECEIVER = ''
    mainData.forEach((e) => {
      attendMembers.WORK_EMP_NO.push({
        EMP_NO: e.EMP_NO,
        EMP_NM: e.EMP_NM,
        EMAIL: e.EMAIL,
      })
    })
    // 수신자 정보 중복 제거
    const arrUnique = attendMembers.WORK_EMP_NO.filter(
      (character, idx, arr) => {
        return arr.findIndex((item) => item.EMP_NO === character.EMP_NO) === idx
      }
    )
    attendMembers.WORK_EMP_NO = arrUnique

    console.log('attendMembers.WORK_EMP_NO', attendMembers.WORK_EMP_NO)
    // 수신자 이름 배치
    attendMembers.WORK_EMP_NO.forEach((e) => {
      if (RECEIVER === '') {
        RECEIVER = e.EMP_NM
      } else {
        RECEIVER += ', ' + e.EMP_NM
      }
    })
    isReadonly.value = false
    isReadonly.value = true
  }
  dialog.value = true
}

// onMounted(()=>{
// })
//초기 코드값 세팅로직 시작
const initCodeList = () => {}

//팝업닫을때 팝업내부 변수 초기화
const closePopup = () => {
  popupParams.TITLE = ''
  popupParams.CONTENT = ''
  RECEIVER = ''
  isOpen.value = false
  isReadonly.value = true
  SELECT_EMP.value = 'Y'
  attendMembers.SAFE_EMP_NO = []
  attendMembers.WORK_EMP_NO = []
  mainData = []
  emit('closed')
  dialog.value = false
}

// 팝업 버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSendNormal') {
    mailData()
  } else {
    closePopup()
  }
}

const empOpenPopup = () => {
  if (isOpen.value) {
    subEmpPopup.value.openPopup({ MULTI: false })
  }
}

const onEmpSelected = (val) => {
  // console.log('emp val >> ', val )

  //2024.10.15 엄정준 책임 요청 ( 사업부 안전담당자는 한명만 지정)

  attendMembers.SAFE_EMP_NO = []
  attendMembers.SAFE_EMP_NO.push(val)
  RECEIVER = ''

  const arrUnique = attendMembers.SAFE_EMP_NO.filter((character, idx, arr) => {
    return arr.findIndex((item) => item.EMP_NO === character.EMP_NO) === idx
  })
  attendMembers.SAFE_EMP_NO = arrUnique


  attendMembers.SAFE_EMP_NO.forEach((e) => {
    if (RECEIVER === '') {
      RECEIVER = e.EMP_NM
    } 
    // else {
    //   RECEIVER += ', ' + e.EMP_NM
    // }
  })

  isReadonly.value = false
  isReadonly.value = true
  // console.log(RECEIVER)
}

//과제 담당자 선택
watch(
  () => SELECT_EMP.value,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      // 과제 담당자 (Y)선택 시 인원 팝업창 비활성화
      isOpen.value = false
      RECEIVER = ''
      icon = ''
      closeIcon = ''

      const arrUnique = attendMembers.WORK_EMP_NO.filter(
        (character, idx, arr) => {
          return (
            arr.findIndex((item) => item.EMP_NO === character.EMP_NO) === idx
          )
        }
      )
      attendMembers.WORK_EMP_NO = arrUnique

      attendMembers.WORK_EMP_NO.forEach((e) => {
        if (RECEIVER === '') {
          RECEIVER = e.EMP_NM
        } else {
          RECEIVER += ', ' + e.EMP_NM
        }
      })
    } else if (newValue === 'N') {
      // 사업부 안전담당자 (Y)선택 시 인원 팝업창 활성화
      isOpen.value = true
      RECEIVER = ''
      icon = 'mdi-magnify'
      closeIcon = 'mdi-close-box-outline'

      // 수신자 정보 중복 제거
      const arrUnique = attendMembers.SAFE_EMP_NO.filter(
        (character, idx, arr) => {
          return (
            arr.findIndex((item) => item.EMP_NO === character.EMP_NO) === idx
          )
        }
      )
      attendMembers.SAFE_EMP_NO = arrUnique

      attendMembers.SAFE_EMP_NO.forEach((e) => {
        if (RECEIVER === '') {
          RECEIVER = e.EMP_NM
        } else {
          RECEIVER += ', ' + e.EMP_NM
        }
      })
    }

    isReadonly.value = false
    isReadonly.value = true
  }
)

const clear = () => {
  RECEIVER = ''
  attendMembers.EMP_NO = []
  isReadonly.value = false
  isReadonly.value = true
}

const mailData = () => {
  if (RECEIVER.length < 1) {
    Message.err('수신자를 선택해주세요')
    return
  } else if (popupParams.TITLE < 1) {
    Message.err('제목을 입력해주세요')
    return
  } else if (popupParams.CONTENT < 1) {
    Message.err('내용을 입력해주세요')
    return
  }
  for (let data of mainData) {
    let mailParams = {
      EMAIL: '',
      SUBJECT: '',
      CONTENT: '',
    }
    if (!isOpen.value) {
      // 과제 담당자 선택 시 작동
      
      mailParams = {
        EMAIL: '',
        SUBJECT: '',
        CONTENT: '',
      }
      mailParams.EMAIL = [data.EMAIL] // 조선RPA12 사번
      mailParams.SUBJECT = popupParams.TITLE 
      mailParams.CONTENT += '<br/> 주제번호  : ' + data.TASK_NO
      mailParams.CONTENT += '<br/><br/> 사업부  : ' + data.BSNS_NM
      mailParams.CONTENT += '<br/><br/> 개선주제명  : ' + data.TITLE
      mailParams.CONTENT +=
        ' <br/> 바로가기 : http://hises.hd.com/#/40_safety-risk/SRM_C/SRMCA0020'
      mailParams.CONTENT += ' <br/> 내용 : ' + popupParams.CONTENT.replaceAll(/(\n|\r\n)/g,'<br/>')
      commonSendApi(mailParams).then((res) => {
        Message.success(t('메일이 전송되었습니다.'))
      })
      console.log('메일 발송 작동')

        
      // 2024.10.15 박주성 선임
      // 아래 로직으로 전송 시 선택 한 리스트와 담당자가 for문이 두번돌아서 여러번 전송이 된다.
      // 과제담당자의 경우 선택 리스트의 담당자 이메일로 만 전송하게 변경
      
      // attendMembers.WORK_EMP_NO.forEach((element) => {
      //   mailParams = {
      //     EMAIL: '',
      //     SUBJECT: '',
      //     CONTENT: '',
      //   }
      //   mailParams.EMAIL = [element.EMAIL] // 조선RPA12 사번
      //   mailParams.SUBJECT = popupParams.TITLE 
      //   mailParams.CONTENT += '<br/> 주제번호  : ' + data.TASK_NO
      //   mailParams.CONTENT += '<br/><br/> 사업부  : ' + data.BSNS_NM
      //   mailParams.CONTENT += '<br/><br/> 개선주제명  : ' + data.TITLE
      //   mailParams.CONTENT +=
      //     ' <br/> 바로가기 : http://hises.hd.com/#/40_safety-risk/SRM_C/SRMCA0020'
      //   mailParams.CONTENT += ' <br/> 내용 : ' + popupParams.CONTENT.replaceAll(/(\n|\r\n)/g,'<br/>')
      //   commonSendApi(mailParams).then((res) => {
      //     Message.success(t('메일이 전송되었습니다.'))
      //   })
      //   console.log('메일 발송 작동')
      // })
    } else if (isOpen.value) {
      // 사업부 안전 담당자 선택 시 작동
      attendMembers.SAFE_EMP_NO.forEach((element) => {
        mailParams = {
          EMAIL: '',
          SUBJECT: '',
          CONTENT: '',
        }
        mailParams.EMAIL = [element.EMAIL] // 조선RPA12 사번
        mailParams.SUBJECT = popupParams.TITLE
        mailParams.CONTENT += '<br/> 주제번호  : ' + data.TASK_NO
        mailParams.CONTENT += '<br/><br/> 사업부  : ' + data.BSNS_NM
        mailParams.CONTENT += '<br/><br/> 개선주제명  : ' + data.TITLE
        mailParams.CONTENT +=
          ' <br/> 바로가기 : http://hises.hd.com/#/40_safety-risk/SRM_C/SRMCA0020'
        mailParams.CONTENT += ' <br/> 내용 : ' + popupParams.CONTENT.replaceAll(/(\n|\r\n)/g,'<br/>')
        commonSendApi(mailParams).then((res) => {
          Message.success(t('메일이 전송되었습니다.'))
        })
      })
    }
  }
  Message.success(t('모든 메일이 전송되었습니다.'));
  
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="600"
    height="350"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">메일 작성</div>
    <v-card class="pa-0 fill-height">
      <v-card-title
        class="pa-3 pb-0"
        style="display: flex; justify-content: flex-end"
      >
        <div class="d-flex mr-2">
          <div class="d-flex align-center">
            <VCheckbox
              v-model="SELECT_EMP"
              true-value="Y"
              false-value="N"
              :label="$t('과제 담당자')"
            />
          </div>
        </div>
        <div class="d-flex mr-2">
          <div class="d-flex align-center">
            <VCheckbox
              v-model="SELECT_EMP"
              true-value="N"
              false-value="Y"
              :label="$t('사업부 안전담당자')"
            />
          </div>
        </div>
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div style="display: flex">
          <ILabel :label="$t('제목')" labelLoc="top" style="width: 50%">
            <template #editor="editorProps">
              <VTextField v-model="popupParams.TITLE" />
            </template>
          </ILabel>
          <ILabel :label="$t('수신자')" labelLoc="top" style="width: 50%">
            <template #editor="editorProps">
              <VTextField
                v-model="RECEIVER"
                :append-inner-icon="icon"
                :append-icon="closeIcon"
                @click:appendInner="empOpenPopup()"
                @click:append="clear()"
                :readonly="isReadonly"
              />
            </template>
          </ILabel>
        </div>
        <div>
          <ILabel :label="$t('내용')" labelLoc="top">
            <template #editor="editorProps">
              <VTextarea v-model="popupParams.CONTENT" />
            </template>
          </ILabel>
        </div>
        <div style="display: flex; justify-content: center; padding-top: 4px">
          <IButtonList
            ref="popupButton"
            :button-list="['btnSendNormal', 'btnClose']"
            @click-button="onButtonsClick"
          />
        </div>
      </v-card-text>
    </v-card>

    <SubEmpPopup ref="subEmpPopup" @selected="onEmpSelected" />
  </VDialog>

</template>
