<script setup>
import { ref, reactive, nextTick } from 'vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { useUserStore } from '@hiway/stores/user'
import ImageViewerSingle from '@/components/popup/ImageViewerSingle.vue'
const dialog = ref(null)
const menuTitle = ref(null)
let rowData = reactive({})
const userStore = useUserStore()
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['closed'])
const bfrFileId = ref(null)
const aftFileId = ref(null)

const props = defineProps({
  data: {
    type: Object,
  },
})

const tab04field = reactive({
  RPTR_EMP_NO: '',
  UNTWRK_SEQ: '',
  RPTR_EMP_NM: '',
  STD_WORK_NO: '',
  IMPLN_EMP_NM: '',
  IMP_EFFC: '',
  BSNS_CD: '',
  IMPLN_EMP_NO: '',
  ES_DEPT_CD: '',
  DEPT_NM: '',
  IMP_ITM_MGT: '',
  IMP_ITM_PLC: '',
  ES_SEQ: '',
  WRK_NM: '',
  IMP_COST: '',
  ES_DATE: '',
  UNTWRK_NM: '',
  IMPLN_DSC: '',
  CMPNY_DIV: '',
  FILE_ID_BFR: '',
  FILE_ID_AFT: '',
  IMP_DATE: '',
  IMP_ITM_EQP: '',
  IMP_DSC_BFR: '',
  IMP_DSC_AFT: '',
  HRMF_FILEID: '',
  IMP_ITM_TOOL: '',
  IMP_ITM_MTHD: '',
})

const codeList = reactive({
  ES_DIV: [], //조사구분
})

onMounted(() => {
  nextTick(() => {
    bfrFileId.value.unVisibleButton('btnFileUpload')
    bfrFileId.value.unVisibleButton('btnDelete')
    aftFileId.value.unVisibleButton('btnFileUpload')
    aftFileId.value.unVisibleButton('btnDelete')
  })
  let param = {
    CMPNY_DIV: props.data.CMPNY_DIV,
    ES_DATE: props.data.ES_DATE,
    ES_SEQ: props.data.ES_SEQ,
    UNTWRK_SEQ: props.data.IMP_RST_CNT === '0' ? '1' : props.data.IMP_RST_CNT,
  }
  commonSearchApi({
    queryId: 'HLTIB0050_SEARCH_02',
    param: param,
  }).then((res) => {
    for (const [key, value] of Object.entries(res.ORESULT_CUR[0])) {
      if (tab04field.hasOwnProperty(key)) {
        tab04field[key] = value
      }
    }
    if (tab04field.FILE_ID_BFR) {
      bfrFileId.value.setGuid(tab04field.FILE_ID_BFR)
      bfrFileId.value.onButtonsClick({ id: 'btnSearch' })
    }
    if (tab04field.FILE_ID_AFT) {
      aftFileId.value.setGuid(tab04field.FILE_ID_AFT)
      aftFileId.value.onButtonsClick({ id: 'btnSearch' })
    }
  })
})
</script>

<template>
  <v-card class="pa-0 fill-height rounded-b-5">
    <v-card-title class="pa-4 pb-2">
      <v-card-text class="pa-2 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <span class="gridTitle">조사개요</span>
            <div class="d-flex mt-2 justify-space-between">
              <i-input :label="$t('부서명')" width="250px" readonly v-model="tab04field.DEPT_NM"></i-input>
              <div class="d-flex">
                <i-input
                  :label="$t('작성자')"
                  width="150px"
                  readonly
                  class="mr-0"
                  v-model="tab04field.RPTR_EMP_NO"
                ></i-input>
                <i-input width="100px" readonly class="ml-1" v-model="tab04field.RPTR_EMP_NM"></i-input>
              </div>
              <i-input
                :label="$t('표준작업지도서 No.')"
                width="280px"
                readonly
                v-model="tab04field.STD_WORK_NO"
              ></i-input>
            </div>
            <div class="d-flex mt-2 justify-space-between">
              <i-input :label="$t('작업명')" width="250px" readonly v-model="tab04field.WRK_NM"></i-input>
              <div style="margin-right: 20px">
                <i-input
                  label-width="60px"
                  :label="$t('단위작업명')"
                  width="300px"
                  readonly
                  v-model="tab04field.UNTWRK_NM"
                ></i-input>
              </div>
              <i-input :label="$t('개선일자')" width="215px" readonly v-model="tab04field.IMP_DATE"></i-input>
            </div>
            <div class="d-flex mt-2 justify-space-around">
              <v-checkbox
                label="작업 방법 개선"
                true-value="Y"
                false-value="N"
                v-model="tab04field.IMP_ITM_MTHD"
              ></v-checkbox>
              <v-checkbox
                label="작업장 개선"
                true-value="Y"
                false-value="N"
                v-model="tab04field.IMP_ITM_PLC"
              ></v-checkbox>
              <v-checkbox
                label="치공구 개선"
                true-value="Y"
                false-value="N"
                v-model="tab04field.IMP_ITM_TOOL"
              ></v-checkbox>
              <v-checkbox
                label="장비 개선"
                true-value="Y"
                false-value="N"
                v-model="tab04field.IMP_ITM_EQP"
              ></v-checkbox>
              <v-checkbox
                label="관리적 개선"
                true-value="Y"
                false-value="N"
                v-model="tab04field.IMP_ITM_MGT"
              ></v-checkbox>
            </div>
          </v-sheet>
          <div>
            <table class="mt-2">
              <tr>
                <td>구분</td>
                <td>개선 前</td>
                <td>개선 後</td>
              </tr>
              <tr>
                <td>사진</td>
                <td>
                  <ImageViewerSingle height="300" ref="bfrFileId"></ImageViewerSingle>
                </td>
                <td>
                  <ImageViewerSingle height="300" ref="aftFileId"></ImageViewerSingle>
                </td>
              </tr>
              <tr>
                <td>변경 내용</td>
                <td>
                  <i-textarea width="100%" v-model="tab04field.IMP_DSC_BFR"></i-textarea>
                </td>
                <td>
                  <i-textarea width="100%" v-model="tab04field.IMP_DSC_AFT"></i-textarea>
                </td>
              </tr>
              <tr>
                <td>개선 효과</td>
                <td colspan="2">
                  <i-textarea width="100%" v-model="tab04field.IMP_EFFC"></i-textarea>
                </td>
              </tr>
              <tr>
                <td>투자 비용</td>
                <td colspan="2">
                  <i-textarea width="100%" v-model="tab04field.IMP_COST"></i-textarea>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </v-card-text>
    </v-card-title>
  </v-card>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
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
  font-size: 16px;
}
</style>
