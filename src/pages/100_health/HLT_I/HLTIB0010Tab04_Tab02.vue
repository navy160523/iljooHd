<script setup>
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import _ from 'lodash'
const props = defineProps({
  tab01Data: {
    type: Object,
  },
})
let previousValue = ''

const hazardInvestigationFieldTab04_Tab02 = reactive({
  P2_QA0_C1: 'N', //최근 1년중 통증유무(Y:유,N:무) 기본값 N
  P2_QY0_C1: '', //통증부위_목
  P2_QY0_C2: '', //통증부위_어깨
  P2_QY0_C3: '', //통증부위_팔/팔꿈치
  P2_QY0_C4: '', //통증부위_손목/손가락
  P2_QY0_C5: '', //통증부위_허리
  P2_QY0_C6: '', //통증부위_다리/발
  P2_QY1_C2_I632: '', //구체적부위코드_어깨
  P2_QY1_C3_I632: '', //구체적부위코드_팔/팔꿈치
  P2_QY1_C4_I632: '', //구체적부위코드_손목/손가락
  P2_QY1_C6_I632: '', //구체적부위코드_다리/발
  P2_QY2_C1_I633: '', //통증기간코드_목
  P2_QY2_C2_I633: '', //통증기간코드_어깨
  P2_QY2_C3_I633: '', //통증기간코드_팔/팔꿈치
  P2_QY2_C4_I633: '', //통증기간코드_손목/손가락
  P2_QY2_C5_I633: '', //통증기간코드_허리
  P2_QY2_C6_I633: '', //통증기간코드_다리/발
  P2_QY3_C1_I634: '', //아픈정도코드_목
  P2_QY3_C2_I634: '', //아픈정도코드_어깨
  P2_QY3_C3_I634: '', //아픈정도코드_팔/팔꿈치
  P2_QY3_C4_I634: '', //아픈정도코드_손목/손가락
  P2_QY3_C5_I634: '', //아픈정도코드_허리
  P2_QY3_C6_I634: '', //아픈정도코드_다리/발
  P2_QY4_C1_I635: '', //증상빈도코드_목
  P2_QY4_C2_I635: '', //증상빈도코드_어깨
  P2_QY4_C3_I635: '', //증상빈도코드_팔/팔꿈치
  P2_QY4_C4_I635: '', //증상빈도코드_손목/손가락
  P2_QY4_C5_I635: '', //증상빈도코드_허리
  P2_QY4_C6_I635: '', //증상빈도코드_다리/발
  P2_QY5_C1: '', //지난1주일간증상유무(Y:예)_목
  P2_QY5_C2: '', //지난1주일간증상유무(Y:예)_어깨
  P2_QY5_C3: '', //지난1주일간증상유무(Y:예)_팔,팔꿈치
  P2_QY5_C4: '', //지난1주일간증상유무(Y:예)_손목/손가락
  P2_QY5_C5: '', //지난1주일간증상유무(Y:예)_허리
  P2_QY5_C6: '', //지난1주일간증상유무(Y:예)_다리/발
  P2_QY6_C1_I636: '', //1년활동코드들_목
  P2_QY6_C2_I636: '', //1년활동코드들_어깨
  P2_QY6_C3_I636: '', //1년활동코드들_팔/팔꿈치
  P2_QY6_C4_I636: '', //1년활동코드들_손목/손가락
  P2_QY6_C5_I636: '', //1년활동코드들_허리
  P2_QY6_C6_I636: '', //1년활동코드들_다리/발
})

const codeList = reactive({
  P2_QY1_C2_I632: [], //구체적부위코드_어깨(HHII632)
  P2_QY1_C3_I632: [], //구체적부위코드_팔/팔꿈치(HHII632)
  P2_QY1_C4_I632: [], //구체적부위코드_손목/손가락(HHII632)
  P2_QY1_C6_I632: [], //구체적부위코드_다리/발(HHII632)
  P2_QY2_C1_I633: [], //통증기간코드_목(HHII633)
  P2_QY2_C2_I633: [], //통증기간코드_어깨(HHII633)
  P2_QY2_C3_I633: [], //통증기간코드_팔/팔꿈치(HHII633)
  P2_QY2_C4_I633: [], //통증기간코드_손목/손가락(HHII633)
  P2_QY2_C5_I633: [], //통증기간코드_허리(HHII633)
  P2_QY2_C6_I633: [], //통증기간코드_다리/발(HHII633)
  P2_QY3_C1_I634: [], //아픈정도코드_목(HHII634)
  P2_QY3_C2_I634: [], //아픈정도코드_어깨(HHII634)
  P2_QY3_C3_I634: [], //아픈정도코드_팔/팔꿈치(HHII634)
  P2_QY3_C4_I634: [], //아픈정도코드_손목/손가락(HHII634)
  P2_QY3_C5_I634: [], //아픈정도코드_허리(HHII634)
  P2_QY3_C6_I634: [], //아픈정도코드_다리/발(HHII634)
  P2_QY4_C1_I635: [], //증상빈도코드_목(HHII635)
  P2_QY4_C2_I635: [], //증상빈도코드_어깨(HHII635)
  P2_QY4_C3_I635: [], //증상빈도코드_팔/팔꿈치(I635)
  P2_QY4_C4_I635: [], //증상빈도코드_손목/손가락(I635)
  P2_QY4_C5_I635: [], //증상빈도코드_허리(HHII635)
  P2_QY4_C6_I635: [], //증상빈도코드_다리/발(HHII635)
  P2_QY5_C1: [], //지난1주일간증상유무(Y:예)_목
  P2_QY5_C2: [], //지난1주일간증상유무(Y:예)_어깨
  P2_QY5_C3: [], //지난1주일간증상유무(Y:예)_팔,팔꿈치
  P2_QY5_C4: [], //지난1주일간증상유무(Y:예)_손목/손가락
  P2_QY5_C5: [], //지난1주일간증상유무(Y:예)_허리
  P2_QY5_C6: [], //지난1주일간증상유무(Y:예)_다리,발
  P2_QY6_C1_I636: [], //1년활동코드들_목(HHII636)
  P2_QY6_C2_I636: [], //1년활동코드들_어깨(HHII636)
  P2_QY6_C3_I636: [], //1년활동코드들_팔,팔꿈치(HHII636)
  P2_QY6_C4_I636: [], //1년활동코드들_손목/손가락(HHII636)
  P2_QY6_C5_I636: [], // 1년활동코드들_허리(HHII636)
  P2_QY6_C6_I636: [], //1년활동코드들_다리,발(HHII636)
})

const initCodeList = () => {
  Promise.all([
    getCodeList('HHII632'),
    getCodeList('HHII633'),
    getCodeList('HHII634'),
    getCodeList('HHII635'),
    getCodeList('HHII636'),
  ]).then((res) => {
    codeList.P2_QY1_C2_I632 = res[0].ORESULT_CUR
    codeList.P2_QY1_C3_I632 = res[0].ORESULT_CUR
    codeList.P2_QY1_C4_I632 = res[0].ORESULT_CUR
    codeList.P2_QY1_C6_I632 = res[0].ORESULT_CUR
    codeList.P2_QY2_C1_I633 = res[1].ORESULT_CUR
    codeList.P2_QY2_C2_I633 = res[1].ORESULT_CUR
    codeList.P2_QY2_C3_I633 = res[1].ORESULT_CUR
    codeList.P2_QY2_C4_I633 = res[1].ORESULT_CUR
    codeList.P2_QY2_C5_I633 = res[1].ORESULT_CUR
    codeList.P2_QY2_C6_I633 = res[1].ORESULT_CUR
    codeList.P2_QY3_C1_I634 = res[2].ORESULT_CUR
    codeList.P2_QY3_C2_I634 = res[2].ORESULT_CUR
    codeList.P2_QY3_C3_I634 = res[2].ORESULT_CUR
    codeList.P2_QY3_C4_I634 = res[2].ORESULT_CUR
    codeList.P2_QY3_C5_I634 = res[2].ORESULT_CUR
    codeList.P2_QY3_C6_I634 = res[2].ORESULT_CUR
    codeList.P2_QY4_C1_I635 = res[3].ORESULT_CUR
    codeList.P2_QY4_C2_I635 = res[3].ORESULT_CUR
    codeList.P2_QY4_C3_I635 = res[3].ORESULT_CUR
    codeList.P2_QY4_C4_I635 = res[3].ORESULT_CUR
    codeList.P2_QY4_C5_I635 = res[3].ORESULT_CUR
    codeList.P2_QY4_C6_I635 = res[3].ORESULT_CUR
    codeList.P2_QY6_C1_I636 = res[4].ORESULT_CUR
    codeList.P2_QY6_C2_I636 = res[4].ORESULT_CUR
    codeList.P2_QY6_C3_I636 = res[4].ORESULT_CUR
    codeList.P2_QY6_C4_I636 = res[4].ORESULT_CUR
    codeList.P2_QY6_C5_I636 = res[4].ORESULT_CUR
    codeList.P2_QY6_C6_I636 = res[4].ORESULT_CUR
  })
}

onMounted(() => {
  initCodeList()
})

const saveTab02 = () => {
  return hazardInvestigationFieldTab04_Tab02
}

//통증부위 목 체크시 증상 '예'로 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY0_C1,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
    }
  }
)
//통증부위 어깨 체크시 증상 '예'로 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY0_C2,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
    }
  }
)
//통증부위 팔/팔꿈치 체크시 증상 '예'로 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY0_C3,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
    }
  }
)
//통증부위 손목/손가락 체크시 증상 '예'로 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY0_C4,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
    }
  }
)
//통증부위 허리 체크시 증상 '예'로 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY0_C5,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
    }
  }
)
//통증부위 다리/발 체크시 증상 '예'로 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY0_C6,
  (newValue, oldValue) => {
    if (newValue === 'Y') {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
    }
  }
)

//어깨 통증 구체적부위 체크시 어깨 통증부위 체크박스 체크,상단 예,아니오 예로 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY1_C2_I632,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C2 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
    }
  }
)

//팔/팔꿈치 통증 구체적부위 체크시 팔/팔꿈치 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY1_C3_I632,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C3 = 'Y'
    }
  }
)

//손목/손가락 통증 구체적부위 체크시 손목/손가락 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY1_C4_I632,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C4 = 'Y'
    }
  }
)

//다리/발 통증 구체적부위 체크시 다리/발 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY1_C6_I632,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C6 = 'Y'
    }
  }
)

//목 통증기간 체크시 목 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY2_C1_I633,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C1 = 'Y' //통증부위_목
    }
  }
)
//어깨 통증기간 체크시 어깨 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY2_C2_I633,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C2 = 'Y' //통증부위_어깨
    }
  }
)
//팔/팔꿈치 통증기간 체크시 팔/팔꿈치 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY2_C3_I633,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C3 = 'Y' //통증부위_팔/팔꿈치
    }
  }
)
//손목/손가락 통증기간 체크시 손목/손가락 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY2_C4_I633,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C4 = 'Y' //통증부위_손목/손가락
    }
  }
)
//허리 통증기간 체크시 허리 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY2_C5_I633,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C5 = 'Y' //통증부위_허리
    }
  }
)
//다리/발 통증기간 체크시 다리/발 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY2_C6_I633,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C6 = 'Y' //통증부위_다리/발
    }
  }
)
//목 아픈정도 체크시 목 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY3_C1_I634,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C1 = 'Y'
    }
  }
)
//어깨 아픈정도 체크시 어깨 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY3_C2_I634,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C2 = 'Y'
    }
  }
)

//팔/팔꿈치 아픈정도 체크시 팔/팔꿈치 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY3_C3_I634,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C3 = 'Y'
    }
  }
)

//손목/손가락 아픈정도 체크시 손목/손가락 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY3_C4_I634,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C4 = 'Y'
    }
  }
)

//허리 아픈정도 체크시 허리 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY3_C5_I634,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C5 = 'Y'
    }
  }
)
//다리/발 아픈정도 체크시 다리/발 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY3_C6_I634,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C6 = 'Y'
    }
  }
)

//목 증상빈도 체크시 목 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY4_C1_I635,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C1 = 'Y'
    }
  }
)
//어깨 증상빈도 체크시 어깨 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY4_C2_I635,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C2 = 'Y'
    }
  }
)

//팔/팔꿈치 증상빈도 체크시 팔/팔꿈치 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY4_C3_I635,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C3 = 'Y'
    }
  }
)

//손목/손가락 증상빈도 체크시 손목/손가락 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY4_C4_I635,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C4 = 'Y'
    }
  }
)

//허리 증상빈도 체크시 허리 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY4_C5_I635,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C5 = 'Y'
    }
  }
)
//다리/발 증상빈도 체크시 다리/발 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY4_C6_I635,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C6 = 'Y'
    }
  }
)

//
//목 지난1주일간증상유무 체크시 목 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY5_C1,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C1 = 'Y'
    }
  }
)
//어깨 지난1주일간증상유무 체크시 어깨 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY5_C2,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C2 = 'Y'
    }
  }
)

//팔/팔꿈치 지난1주일간증상유무 체크시 팔/팔꿈치 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY5_C3,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C3 = 'Y'
    }
  }
)

//손목/손가락 지난1주일간증상유무 체크시 손목/손가락 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY5_C4,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C4 = 'Y'
    }
  }
)

//허리 지난1주일간증상유무 체크시 허리 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY5_C5,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C5 = 'Y'
    }
  }
)
//다리/발 지난1주일간증상유무 체크시 다리/발 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY5_C6,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C6 = 'Y'
    }
  }
)
//

//목 1년활동코드들_목 체크시 목 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY6_C1_I636,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C1 = 'Y'
    }
  }
)
//어깨 1년활동코드들_목 체크시 어깨 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY6_C2_I636,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C2 = 'Y'
    }
  }
)

//팔/팔꿈치 1년활동코드들_목 체크시 팔/팔꿈치 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY6_C3_I636,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C3 = 'Y'
    }
  }
)

//손목/손가락 1년활동코드들_목 체크시 손목/손가락 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY6_C4_I636,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C4 = 'Y'
    }
  }
)

//허리 1년활동코드들_목 체크시 허리 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY6_C5_I636,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C5 = 'Y'
    }
  }
)
//다리/발 1년활동코드들_목 체크시 다리/발 통증부위 체크박스 체크
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QY6_C6_I636,
  (newValue, oldValue) => {
    if (newValue) {
      hazardInvestigationFieldTab04_Tab02.P2_QA0_C1 = 'Y'
      hazardInvestigationFieldTab04_Tab02.P2_QY0_C6 = 'Y'
    }
  }
)

//증상 아니오 체크시 모든 입력값 해제
watch(
  () => hazardInvestigationFieldTab04_Tab02.P2_QA0_C1,
  (newValue, oldValue) => {
    if (newValue === 'N') {
      for (let i in hazardInvestigationFieldTab04_Tab02) {
        hazardInvestigationFieldTab04_Tab02[i] = ''
      }
    }
  }
)

//증사조사표 인원 변경시 데이터 세팅
const setFieldTab02 = (data) => {
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (hazardInvestigationFieldTab04_Tab02.hasOwnProperty(key)) {
        hazardInvestigationFieldTab04_Tab02[key] = value
      }
    }
  }

  previousValue = _.cloneDeep(data) //초기값 저장
}

const setEmpData = () => {
  //초기화
  for (let i in hazardInvestigationFieldTab04_Tab02) {
    //1년 증상여부는 N으로 초기화 나머지는 빈값
    if (i === 'P2_QA0_C1') {
      hazardInvestigationFieldTab04_Tab02[i] = 'N'
      continue
    }
    hazardInvestigationFieldTab04_Tab02[i] = ''
  }
}

const getModifyFlag = () => {
  return _.isEqual(hazardInvestigationFieldTab04_Tab02, previousValue)
}

defineExpose({
  saveTab02,
  setFieldTab02,
  setEmpData,
  getModifyFlag,
})
</script>

<template>
  <v-sheet class="searchArea">
    <div class="gridTitle">증상</div>
    <span
      >지난 1년 동안 손/손가락/손목, 팔/팔꿈치, 어깨, 목, 허리, 다리/발 중 어느 한 부위에서라도 귀하의 작업과 관련하여
      통증이나 불편함(통증, 쑤시는 느낌, 뻣뻣함, 화끈거리는 느낌, 무감각 혹은 찌릿찌릿함 등)을 느끼신 적이
      있습니까?</span
    >
    <div>
      <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QA0_C1">
        <v-radio label="아니오 (수고하셨습니다. 설문을 다 마치셨습니다.)" value="N"></v-radio>
        <v-radio
          label="예 (예 라고 답하신 분은아래표의 통증부위에 체크(v)하고, 해당 통증부위의 세로줄로 내려가며 해당 사항에 체크(v)하여 주십시오.)"
          value="Y"
        ></v-radio>
      </v-radio-group>
    </div>
    <table>
      <tr>
        <td>통증부위</td>
        <td>
          <v-checkbox
            label="목"
            true-value="Y"
            false-value="N"
            v-model="hazardInvestigationFieldTab04_Tab02.P2_QY0_C1"
          ></v-checkbox>
        </td>
        <td>
          <v-checkbox
            label="어깨"
            true-value="Y"
            false-value="N"
            v-model="hazardInvestigationFieldTab04_Tab02.P2_QY0_C2"
          ></v-checkbox>
        </td>
        <v-checkbox
          label="팔/팔꿈치"
          true-value="Y"
          false-value="N"
          v-model="hazardInvestigationFieldTab04_Tab02.P2_QY0_C3"
        ></v-checkbox>

        <td>
          <v-checkbox
            label="손목/손가락"
            true-value="Y"
            false-value="N"
            v-model="hazardInvestigationFieldTab04_Tab02.P2_QY0_C4"
          ></v-checkbox>
        </td>
        <td>
          <v-checkbox
            label="허리"
            true-value="Y"
            false-value="N"
            v-model="hazardInvestigationFieldTab04_Tab02.P2_QY0_C5"
          ></v-checkbox>
        </td>
        <td>
          <v-checkbox
            label="다리/발"
            true-value="Y"
            false-value="N"
            v-model="hazardInvestigationFieldTab04_Tab02.P2_QY0_C6"
          ></v-checkbox>
        </td>
      </tr>
      <tr>
        <td>1.통증의 구체적 부위는?</td>
        <td><보기></td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY1_C2_I632">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY1_C2_I632"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY1_C3_I632">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY1_C3_I632"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY1_C4_I632">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY1_C4_I632"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td></td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY1_C6_I632">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY1_C6_I632"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
      </tr>
      <tr>
        <td style="width: 175px">2. 한번 아프기 시작하면 통증 기간은 얼마동안 지속됩니까?</td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY2_C1_I633">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY2_C1_I633"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY2_C2_I633">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY2_C2_I633"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY2_C3_I633">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY2_C3_I633"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY2_C4_I633">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY2_C4_I633"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY2_C5_I633">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY2_C5_I633"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY2_C6_I633">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY2_C6_I633"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
      </tr>
      <tr>
        <td rowspan="2">3. 그때의 아픈 정도는 어느 정도 입니까?</td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY3_C1_I634">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY3_C1_I634"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY3_C2_I634">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY3_C2_I634"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY3_C3_I634">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY3_C3_I634"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY3_C4_I634">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY3_C4_I634"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY3_C5_I634">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY3_C5_I634"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY3_C6_I634">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY3_C6_I634"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
      </tr>
      <tr>
        <td><보기></td>
        <td colspan="5" style="text-align: left">
          약한통증 : 약간 불편한 정도이나 작업에 열중할 때에는 못 느낀다. <br />
          중간통증 : 작업 중 통증이 있으나 귀가 후 휴식을 취하면 괜찮다. <br />
          심한통증 : 작업 중 통증이 비교적 심하고 귀가 후에도 통증이 계속된다. <br />
          매우 심한 통증 :통증 때문에 작업은 물론 일상 생활을 하기가 어렵다. <br />
        </td>
      </tr>
      <tr>
        <td>4. 지난 1년동안 이러한 증상을 얼마나 자주 경험하십니까?</td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY4_C1_I635">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY4_C1_I635"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY4_C2_I635">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY4_C2_I635"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY4_C3_I635">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY4_C3_I635"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY4_C4_I635">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY4_C4_I635"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY4_C5_I635">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY4_C5_I635"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY4_C6_I635">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY4_C6_I635"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
      </tr>
      <tr>
        <td>5. 지난 1주일 동안에도 이러한 증상이 있었습니까?</td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY5_C1">
            <v-radio label="아니오" value="N"> </v-radio>
            <v-radio label="예" value="Y"></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY5_C2">
            <v-radio label="아니오" value="N"> </v-radio>
            <v-radio label="예" value="Y"></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY5_C3">
            <v-radio label="아니오" value="N"> </v-radio>
            <v-radio label="예" value="Y"></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY5_C4">
            <v-radio label="아니오" value="N"> </v-radio>
            <v-radio label="예" value="Y"></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY5_C5">
            <v-radio label="아니오" value="N"> </v-radio>
            <v-radio label="예" value="Y"></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY5_C6">
            <v-radio label="아니오" value="N"> </v-radio>
            <v-radio label="예" value="Y"></v-radio>
          </v-radio-group>
        </td>
      </tr>
      <tr>
        <td>6. 지난 1년동안 이러한 통증으로 인해 어떤 일이 있었습니까?</td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY6_C1_I636">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY6_C1_I636"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY6_C2_I636">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY6_C2_I636"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY6_C3_I636">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY6_C3_I636"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY6_C4_I636">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY6_C4_I636"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY6_C5_I636">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY6_C5_I636"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
        <td>
          <v-radio-group v-model="hazardInvestigationFieldTab04_Tab02.P2_QY6_C6_I636">
            <v-radio
              :label="item.TXT"
              v-for="(item, index) in codeList.P2_QY6_C6_I636"
              :key="index"
              :value="item.COD"
            ></v-radio>
          </v-radio-group>
        </td>
      </tr>
    </table>
  </v-sheet>
</template>

<style lang="scss" scoped>
table {
  border-collapse: collapse;
  width: 100%;
  border: 1px solid black;
}
td {
  padding: 4px;
  text-align: center; /* 가로 가운데 정렬 */
  vertical-align: middle; /* 세로 가운데 정렬 */
  border: 1px solid black;
  margin-top: 2px;
  margin-bottom: 2px;
}
</style>
