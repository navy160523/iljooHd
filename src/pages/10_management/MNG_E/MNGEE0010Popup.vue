<!--
  화면명 : MNGEE0010Popup.vue
  화면개요 : 이행점검 시정조치서 팝업 
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  commonSendApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import CKEditor from '@/components/ckEditor/CKEditor.vue'
import CKViewer from '@/components/ckEditor/CKViewer.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IUpload from '@/components/IUpload.vue'
import ImageViewerPopup from '@/components/popup/ImageViewerPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'

let dialog = ref(false)
const grdMain = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const logsStore = useLogsStore()
const menuTitle = ref(null)
const ckEditor = ref('')
const fileUpload = ref(null)
const emit = defineEmits(['after-search'])
const imageViewerPopup = ref(null)
const empPopup = ref(null)

// 조회조건
const searchParam = reactive({
  YEAR: dayjs().get('year'),
  HALF: dayjs().get('month') < 7 ? '상반기' : '하반기',
  INS_EMP_NM: [],
  INS_EMP_NO: '',
  INS_EMP_EMAIL: [],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    header: { height: 60 },
    stateBar: { visible: false },
    checkBar: { visible: false },
  },
  keys: ['COL1'],
  fields: [
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '150',
      lookupDisplay: true,
      button: 'action',
      header: { text: t('수검부서(장소)') },
      editable: false,
    },
    {
      fieldName: 'INS_DATE',
      dataType: 'text',
      dataType: 'text',
      width: '80',
      displayCallback: function (grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      },
      header: { text: t('점검일자') },
      editable: false,
    },
    {
      fieldName: 'INS_EMP_NM',
      dataType: 'text',
      width: '80',
      button: 'action',
      header: { text: t('점검자') },
      editable: false,
    },
    {
      fieldName: 'FAIL_CONTENT',
      dataType: 'text',
      width: '200',
      header: { text: t('내용') },
      styleName: 'multiline-editor',
      editable: false,
    },
    {
      fieldName: 'FAIL_FILE',
      dataType: 'text',
      editable: false,
      header: { text: t('사진') },
      width: '40',
      renderer: {
        type: 'button',
      },
    },

    { fieldName: 'LAW_CD', dataType: 'text', visible: false },
    { fieldName: 'SOL_SEND_DATE', dataType: 'text', visible: false },
    { fieldName: 'SOL_CONTENT', dataType: 'text', visible: false },
    { fieldName: 'SOL_FILE', dataType: 'text', visible: false },
    { fieldName: 'SOL_DATE', dataType: 'text', visible: false },
    { fieldName: 'COMP_YN', dataType: 'text', visible: false },
    { fieldName: 'REMARK', dataType: 'text', visible: false },

    { fieldName: 'INS_EMP', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'STATUS', dataType: 'text', visible: false },
    { fieldName: 'FAIL_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'SOL_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'INS_CD', dataType: 'text', visible: false },
  ],
  columns: [],
  columnLayout: [
    'DEPT_NM',
    'INS_DATE',
    'INS_EMP_NM',
    {
      name: '점검 결과 부적합 내용',
      direction: 'horizontal',
      items: ['FAIL_CONTENT', 'FAIL_FILE'],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (mailParams) => {
  grdMain.value.getDataProvider().setRows(mailParams)
  dialog.value = true
}

// 인원팝업
const openEmpPopup = async (gbn) => {
  if (gbn === '인원조회') {
    empPopup.value.openPopup({
      CMPNY_DIV: userStore.cmpnyDiv,
      HSE_ONLY: 'Y',
    })
    // EMP_NM: searchParam.INS_EMP_NM,
  }
}

// 인원 선택 후 이벤트 (조회조건)
const onEmpSelected = (val) => {
  // searchParam.INS_EMP_NO = val.EMP_NO
  searchParam.INS_EMP_NM.push(val.EMP_NM)
  searchParam.INS_EMP_EMAIL.push(val.EMAIL)
}

const RESET_ASGN_ITEM = () => {
  searchParam.INS_EMP_NM = []
  searchParam.INS_EMP_EMAIL = []
}

defineExpose({
  openPopup,
})

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnMail') {
    let ck = await vm.$swal({
      title: t('시정조치서 송부 하시겠습니까?'),
      showCancelButton: true,
    })

    if (!ck.isConfirmed) {
      Message.warn('취소되었습니다.')

      return
    }
    if (searchParam.INS_EMP_EMAIL.length === 0) {
      Message.err('수신인을 지정 해 주세요.')
      return
    }
    mailSet('mail')
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

/* ******************************** 메일 발송 ******************************* */
const mailSet = async (gbn) => {
  /* ******************** 메일 SET ******************* */
  const mailParams = reactive({
    EMAIL: searchParam.INS_EMP_EMAIL,
    SUBJECT: '',
    CONTENT: '',
  })

  let rowNums = grdMain.value.getDataProvider().getRowCount()
  let saveParams = []
  let today = dayjs().format('YYYYMMDD')
  for (let rowIdx = 0; rowIdx < rowNums; rowIdx++) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.DATE = today
    data.ADD_DATE = '10'
    saveParams.push(data)
  }
  commonExecuteApi({ queryId: 'MNGEE0010_SAVE_06', list: saveParams }).then(
    (res) => {
      let solDate =
        res.list[0].RES_COL.substr(4, 2) +
        '월 ' +
        res.list[0].RES_COL.substr(6, 2) +
        '일'
      mailParams.SUBJECT =
        searchParam.YEAR +
        '년 ' +
        searchParam.HALF +
        ' 안전보건 관계법령 이행점검 시정조치서'
      mailParams.CONTENT =
        `
      <!doctype html>
        <html>
          <head>
            <meta charset='utf-8'>
          </head>
          <body>
            1. 평소 업무 협조에 깊은 감사를 드립니다.
            <br/><br/>
            2. ${searchParam.YEAR}년 ${searchParam.HALF} 안전보건관계법령 이행 점검 결과를 다음과 같이 송부하오니 “시정조치(또는 예정) 내용“을 ` +
        solDate +
        `까지 통보하여 주시기 바랍니다. 
            <br/><br/>
            ※ 본 건은 중대재해처벌법 및 안전보건경영시스템 규격(ISO 45001) 요건에 따라 시정조치가 완료될 때까지 Follow-up 되는 사항임을 감안하여 계획을 수립하시기 바랍니다. 
            <br/><br/>
            감사합니다.
          </body>
        </html>`
      commonExecuteApi({ queryId: 'MNGEE0010_SAVE_05', list: saveParams })
        .then((res) => {
          if (res.list[0].RES_COD === '0') {
            commonSendApi(mailParams).then((res) => {
              Message.success(t('메일이 전송되었습니다.'))
            })
          }
        })
        .finally(() => {
          closePopup()
        })
    }
  )

  // commonExecuteApi({ queryId: "MNGEE0010_SAVE_05", list: saveParams }).then(res => {
  //    if(res.list[0].RES_COD === '0'){
  //     commonSendApi(mailParams)
  //    }
  // }).finally(() => {
  //   commonExecuteApi({ queryId: "MNGEE0010_SAVE_06", list: saveParams }).then(res => {
  //     closePopup()
  //   })
  // })
}

const buttonList = reactive([])
const rowData = ref('')
const uploadVisible = ref('')
const onCellItemClicked = (grid, index, col) => {
  rowData.value = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
  if (col.field === 4) {
    buttonList.length = 0
    buttonList.push(['btnClose'])
    uploadVisible.value = false

    imageViewerPopup.value.openPopup(rowData.value.FAIL_FILE_ID)
  }
}

const closePopup = () => {
  grdMain.value.getDataProvider().setRows([])
  searchParam.INS_EMP_EMAIL = []
  emit('search')
  dialog.value = false
}

onMounted(() => {})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1000"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">시정조치서 팝업</div>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <v-card-title class="pa-2 py-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnMail', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-input
              :label="$t('해당 년도')"
              labelWidth="60px"
              v-model="searchParam.YEAR"
              type="Number"
              width="180px"
            />
            <i-select
              :label="$t('구분')"
              labelWidth="30px"
              width="190px"
              v-model="searchParam.HALF"
            />
            <i-input
              :label="$t('수신인')"
              label-width="40px"
              width="460px"
              v-model="searchParam.INS_EMP_NM"
              class="mr-0"
              readonly
              @click="openEmpPopup('인원조회')"
              append-inner-icon="mdi-magnify"
            />
            <v-btn class="ml-1" style="margin-top: 2px" @click="RESET_ASGN_ITEM"
              >초기화</v-btn
            >
          </v-sheet>

          <v-sheet height="100%">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellItemClicked="onCellItemClicked"
            />
          </v-sheet>
        </div>

        <!-- IMAGE 미리보기 팝업 -->
        <ImageViewerPopup
          ref="imageViewerPopup"
          :buttonList="buttonList[0]"
          :isVisibled="uploadVisible"
        />
        <!-- 인원조회 팝업 -->
        <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}
</style>
