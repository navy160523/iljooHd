<script setup>
import OzReportView from './OZReportView.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
//import { getPopupParam } from '@/api/apiFunc'
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'

const props = defineProps({
  showPop: {
    type: Boolean,
    required: true,
    default: false,
  },
  isMulti: {
    type: Boolean,
    default: false,
  },
  MultiArr: {
    type: Array,
    required: false,
    default() {
      return []
    },
  },
  reportName: {
    type: String,
    required: false,
    default: '',
  },
  params: {
    type: Array,
    required: false,
    default() {
      return []
    },
  },
})

const emit = defineEmits(['close', 'falseMulti'])

defineOptions({
  name: 'OZReport',
})

const vm = getCurrentInstance().proxy
const showOz = ref(false)
const ozReportView = ref(null)

watch(
  () => props.showPop,
  () => {
    showOz.value = props.showPop

    // ozreport.reportName = opener.reportName
    // ozreport.args = opener.args
    //ozreport.reportName = props.reportName
    //ozreport.args = opener.args
  }
)

watch(
  () => showOz.value,
  () => {
    if (!showOz.value) {
      emit('close', showOz.value)
      emit('falseMulti', false)
    }
  }
)

// ozreport.reportName = props.reportName
// 위와 같이 한번 더 데이터를 넣어주었던 걸 바로 바인딩 하는 것으로 변경
const ozreport = reactive({
  reportName: '',
  args: [],
})

const opener = reactive({
  //reportName : '/manage/hse/HSE_TEST.ozr',
  reportName: props.reportName,
  args: props.params,
})

const closePopup = () => {
  showOz.value = false
}

onMounted(() => {
  // this.opener = getPopupParam()
  // ozreport.reportName = opener.reportName
  // ozreport.args = opener.args
  // ozReportView.value.loadReport()

  // 2024.02.07 박용훈 ozreport8.html 에서 메세지 전달 하는 내용을 받아서 다시 상위로 메세지 전달
  window.addEventListener('message', receiveMsgFromParent)
})

// 2024.02.07 박용훈 ozreport8.html 에서 메세지 전달 하는 내용을 받아서 다시 상위로 메세지 전달
const receiveMsgFromParent = (e) => {
  // 2024.05.31 박용훈 특정 도메인으로만 통신이 가능 하도록 수정
  //console.log('OZReport e : ',e)
  var hostname = window.location.hostname
  if (
    hostname === 'hises.hd.com' ||
    hostname === '10.100.45.205' ||
    hostname === 'localhost'
  ) {
    if (e.functionName === 'print') {
      //console.log('print : ', e.data.params)
      window.parent.postMessage(
        {
          functionName: e.data.functionName,
          params: [e.data.params],
        },
        e.origin
      )
    }
  } else {
    //console.log('else')
    return
  }
}
</script>

<template>
  <VDialog
    v-model="showOz"
    persistent
    class="OzReportViewClass draggable-dialog"
    width="1250"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">Preview</div>
    <VContainer class="pt-2 px-0" style="background-color: white">
      <VRow no-gutters>
        <VCol>
          <IGridTitle
            ref="menuTitle"
            :button-list="['btnClose']"
            style="padding: 0px 38px 0px 0px; height: 30px"
            @click-button="closePopup"
          />
        </VCol>
      </VRow>
      <VRow no-gutters>
        <VCol>
          <OzReportView
            ref="ozReportView"
            :report-name="props.reportName"
            :MultiArr="props.MultiArr"
            :args="props.params"
            :isMulti="props.isMulti"
          />
        </VCol>
      </VRow>
    </VContainer>
  </VDialog>
</template>

<route lang="yaml">
meta:
  noAuth: true
  noHistory: true
</route>
