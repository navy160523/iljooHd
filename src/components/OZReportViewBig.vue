<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
//import { close } from 'fs'

const props = defineProps({
  reportName: {
    type: String,
    required: false,
  },
  args: {
    type: Array,
    required: true,
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
})

// console.log('reportName111', props.reportName)
// console.log('args111', props.args)

defineOptions({
  name: "IframeView",
})

const vm = getCurrentInstance().proxy
const ifr = ref(null)
const isView = ref(false)
let reportUrl = "/external/ozreport/ozreport8.html"
let reportMultiUrl = "/external/ozreport/ozreport8_Multi.html"

const ozreport = reactive({
  reportName: "",
  args: [],
})

onMounted(() => {
  // 2025.05.29 박용훈 운영서버와 개발서버 분기 추가
  var hostname = window.location.hostname

  if(hostname=="hises.hd.com"){
    reportUrl = '/external/ozreport/ozreport8_Server.html'
    reportMultiUrl = '/external/ozreport/ozreport8_Multi_Server.html'
  }
  else{
    reportUrl = '/external/ozreport/ozreport8.html'
    reportMultiUrl = '/external/ozreport/ozreport8_Multi.html'
  }

  // console.log('# [ozreportView.vue] mounted()')
  isView.value = true
  // console.log('Report Name   =', props.reportName)
  // console.log('Report Params =', props.args)

  // 2024.02.07 박용훈 ozreport8.html 에서 메세지 전달 하는 내용 받기 위해 추가
  window.addEventListener("message", receiveMsgFromParent)
})

const loadReport = () => {
  // props로 전달받은 정보를 세팅한다.
  ozreport.reportName = props.reportName
  ozreport.args = props.args

  vm.$nextTick(() => {
    if (ifr.value) {
      ifr.value.contentWindow.setParameter(ozreport)
    }
  })
}

const loadReportMulti = () => {
  vm.$nextTick(() => {
    if (ifr.value) {
      ifr.value.contentWindow.setParameter(props.MultiArr)
    }
  })
}

// defineExpose({
//   openReport,
// })

// 2024.02.07 박용훈 ozreport8.html 에서 메세지 전달 하는 내용을 받아서 다시 상위로 메세지 전달
const receiveMsgFromParent = (e) => {
  //console.log('OZReportView e : ',e)
  // 2024.05.31 박용훈 특정 도메인으로만 통신이 가능 하도록 수정
  var hostname = window.location.hostname
  if (hostname === 'hises.hd.com' || hostname === '10.100.45.205' || hostname === 'localhost') {
    if (e.functionName === "print") {
      window.parent.postMessage(
        {
          functionName: e.data.functionName,
          params: [e.data.params],
        },
        e.origin
      )
    }
  }
  else{
    return
  }

  
}
</script>

<template>
  <div style="width: 100%">
    <iframe
      v-if="isView && !isMulti"
      :src="reportUrl"
      @load="loadReport"
      ref="ifr"
      id="ifr"
      width="100%"
      height="880px"
      frameborder="0"
      scrolling="no"
    ></iframe>

    <iframe
      v-if="isView && isMulti"
      :src="reportMultiUrl"
      @load="loadReportMulti"
      ref="ifr"
      id="ifr"
      width="100%"
      height="880px"
      frameborder="0"
      scrolling="no"
    ></iframe>
  </div>
</template>

<route lang="yaml">
meta:
  noAuth: true
  noHistory: true
</route>
